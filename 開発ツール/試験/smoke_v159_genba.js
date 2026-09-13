/* 版159: 現場入力の控え（この端末に残す下書き）まわり。
   ・写真を読み終えたときの控えが失敗したら、黙って失わせない（知らせる）
   ・下書き（写真入り）を、ブラウザの都合で消されにくくするよう申し出る */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const HTML = process.argv[2] || FILE('antenna_genba');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* 版番号は上げるたびに試験を直さなくてよいように、読み込むファイルから拾う */
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();


(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:420,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);
  await page.evaluate(() => {
    window.__toasts = []; window.__ot = toast; toast = m => { window.__toasts.push(String(m)); };
  });

  // ---- ① 写真の控えが失敗したら知らせる（いまの戸別なら保存バーも赤く） ----
  const r1 = await page.evaluate(async () => {
    const op = idbPut, og = idbGet;
    idbGet = async () => null;
    idbPut = async () => { throw new Error('QuotaExceededError'); };
    const out = {};
    try{
      M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'V159A';
      M.chosho_photos = [{ label:'現場', dataUri:'data:image/jpeg;base64,AAAA' }];
      // (a) いま開いている戸別の控えが失敗した
      _save.failed = false; persistModel._warned = false; window.__toasts = [];
      await persistModel(M);
      out.a = { failed: !!_save.failed, toast: (window.__toasts[0] || '') };
      // (b) 別の戸別の控えが失敗した（画面の保存バーは巻き添えにしない／知らせは出す）
      _save.failed = false; persistModel._warned = false; window.__toasts = [];
      const other = freshModel(); ensureModelShape(other); other.chosho_mgmt_no = 'V159B';
      await persistModel(other);
      out.b = { failed: !!_save.failed, toast: (window.__toasts[0] || '') };
      // (c) 一度うまくいけば、次に失敗したときまた知らせる
      idbPut = async () => {};
      persistModel._warned = true;
      await persistModel(M);
      out.warnedAfterOk = !!persistModel._warned;
      idbPut = async () => { throw new Error('QuotaExceededError'); };
      window.__toasts = [];
      await persistModel(M);
      out.c = { toast: (window.__toasts[0] || '') };
    } finally { idbPut = op; idbGet = og; _save.failed = false; }
    return out;
  });
  console.log('①写真の控えの失敗', JSON.stringify(r1));
  ok(/控えに失敗/.test(r1.a.toast) && /保存/.test(r1.a.toast),
     '★写真の控えが失敗しても黙っている（画面の中にしかない写真が消える） → ' + JSON.stringify(r1.a));
  ok(r1.a.failed === true, '★いまの戸別の控えが失敗したのに、保存バーが赤くならない → ' + JSON.stringify(r1.a));
  ok(/控えに失敗/.test(r1.b.toast), '★別の戸別の控えが失敗したときに知らせない → ' + JSON.stringify(r1.b));
  ok(r1.b.failed === false, '別の戸別の失敗で、いまの戸別の保存バーまで赤くしている → ' + JSON.stringify(r1.b));
  ok(r1.warnedAfterOk === false && /控えに失敗/.test(r1.c.toast),
     '★一度うまくいったあと、次に失敗しても知らせない → ' + JSON.stringify({ w:r1.warnedAfterOk, c:r1.c }));

  // ---- ② 下書きを消されにくくする申し出 ----
  const r2 = await page.evaluate(async () => {
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'storage');
    const set = v => Object.defineProperty(navigator, 'storage', { value: v, configurable: true });
    const out = {};
    try{
      // (a) まだ申し出ていない → 申し出る
      let asked = 0;
      set({ persisted: async () => false, persist: async () => { asked++; return true; } });
      out.a = { ret: await askPersistentStorage(), asked };
      // (b) もう申し出済み → もう一度は申し出ない
      asked = 0;
      set({ persisted: async () => true, persist: async () => { asked++; return true; } });
      out.b = { ret: await askPersistentStorage(), asked };
      // (c) 対応していない端末 → 何も起きない（例外にしない）
      set(undefined);
      out.c = { ret: await askPersistentStorage() };
      // (d) 申し出が失敗しても、例外にしない
      set({ persisted: async () => false, persist: async () => { throw new Error('だめ'); } });
      out.d = { ret: await askPersistentStorage() };
    } finally {
      delete navigator.storage;
      if(desc && !Object.getOwnPropertyDescriptor(navigator, 'storage')) { /* prototype の元の入口に戻る */ }
    }
    return out;
  });
  console.log('②消されにくくする申し出', JSON.stringify(r2));
  ok(r2.a.asked === 1 && r2.a.ret === true, '★下書きを消されにくくする申し出をしていない → ' + JSON.stringify(r2.a));
  ok(r2.b.asked === 0 && r2.b.ret === true, '申し出済みなのに毎回申し出ている → ' + JSON.stringify(r2.b));
  ok(r2.c.ret === false && r2.d.ret === false, '★対応していない／断られた端末で落ちる → ' + JSON.stringify(r2));

  // ---- ③ 保存は、同じ中身の控えを二重に作らない ----
  const r3 = await page.evaluate(() => {
    const src = String(saveJsonRun);
    return { blob: /new Blob\(\[json\]/.test(src), blob2: /new Blob\(\[JSON.stringify\(state\)\]/.test(src) };
  });
  console.log('③二重の控え', JSON.stringify(r3));
  ok(r3.blob === false, '★保存のたびに、使っていない写真ぶんの控えをもう1つ作っている → ' + JSON.stringify(r3));
  ok(r3.blob2 === true, '共有の道で渡す中身の作り直しまで消えている → ' + JSON.stringify(r3));

  // ---- ④ 版 ----
  const ver = await page.evaluate(() => APP_VERSION);
  ok(!!WANT_VER && ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ver + ' ／ ファイル ' + WANT_VER);

  await page.evaluate(() => { toast = window.__ot; });
  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v159_genba');
})();
