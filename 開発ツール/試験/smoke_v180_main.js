/* 版180（メイン）
   まだほどいていない暗号の戸別を開いたとき、一覧の行の伏せ字（★★★★★）・作り物の値を、ほどいた中身にかぶせない（lgOverlayLedger）。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① 📁 の .hyb（甲 様・電話・住所・写真 A）を「まとめて復号」せずに、行を押してパスワードを入れて開く
        → 画面の氏名・電話・住所が本物（★★★★★ でない）・受付台帳の備考は今までどおり入る
        → 増幅器を直して 💾 上書き保存 → .hyb をほどくと、氏名・電話・住所が本物・写真 A のまま
        （前は一覧の行の「★★★★★」を、ほどいた中身にかぶせていたので、画面も .hyb の氏名・電話も「★★★★★」になった）
     ② 📁 の .enc（全暗号化：乙 様・住所・工事日程予定・備考）を「まとめて復号」せず、覚えているパスワードで開く
        → 画面の管理番号・氏名・住所・日程・備考が本物（「🔐 全暗号化」「(全暗号化・パスワード必須)」・作った日・空の備考にならない）
        → 💾 上書き保存 → .enc をほどくと本物のまま
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ フォルダは試験の中で作る作り物。
   使い方: node smoke_v180_main.js [メイン index.html の file:// URL]　（ONLY=①,② で場面を絞れる） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const asUrl = s => /^(file|https?):/i.test(s) ? s : url.pathToFileURL(path.resolve(s)).href;
const asPath = s => /^file:/i.test(s) ? url.fileURLToPath(s) : (/^https?:/i.test(s) ? '' : path.resolve(s));
const MAIN = asUrl(process.argv[2] || path.join(ROOT, 'antenna_main', 'index.html'));
const MAIN_PATH = asPath(MAIN);
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

/* ページの中で使う道具（版178 の試験と同じ作り物のフォルダなど） */
const SETUP = `
  window.__mk = function(name, files, subs, opt){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __unreadable: {} };
    const ci = !!(opt && opt.ci);
    const key = n => { if(!ci || (n in d.__files)) return n;
      const k = Object.keys(d.__files).filter(k => k.toLowerCase() === String(n).toLowerCase())[0];
      return (k === undefined) ? n : k; };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        const k = key(n);
        if(!(k in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        if(d.__unreadable[k] > 0){ d.__unreadable[k]--; const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; throw e; }
        const t = d.__files[k];
        return { name:n, size: new Blob([t]).size, lastModified: Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { const k = key(n); d.__files[k] = buf; d.__writes.push({ n: k, t: buf }); } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(key(n) in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async (n, o2) => {
        if(!d.__subs[n]){ if(!(o2 && o2.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n, {}, {}, opt || null); }
        return d.__subs[n]; },
      removeEntry: async n => { const k = key(n); if(!(k in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(k); delete d.__files[k]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
    if(opt && opt.resolve) d.resolve = async h => {
      const walk = (dd, pre) => {
        if(h && h.kind === 'directory' && h === dd) return pre;
        if(h && h.kind === 'file' && h.__d === dd) return pre.concat([h.name]);
        for(const s of Object.keys(dd.__subs)){ const r = walk(dd.__subs[s], pre.concat([s])); if(r) return r; }
        return null;
      };
      return walk(d, []);
    };
    return d;
  };
  window.__jpeg = function(w, h, q, seed){
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); const im = x.createImageData(w, h);
    let s = (seed * 2654435761) >>> 0;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    for(let i = 0; i < im.data.length; i += 4){
      const v = (rnd() * 90) | 0;
      im.data[i] = (60 + seed * 23 + v) & 255; im.data[i + 1] = (110 + v * 2) & 255; im.data[i + 2] = (150 + seed * 7) & 255; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return cv.toDataURL('image/jpeg', q);
  };
  window.__setField = (id, v) => { const el = document.getElementById(id);
    el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); };
  window.__pressSave = async function(){
    const b = document.getElementById('btn-save-overwrite');
    const o = { text: b ? b.textContent : '', disabled: b ? b.disabled : null, pressed: false };
    if(b && !b.disabled && b.onclick){ o.pressed = true; await b.onclick(); }   // 押せないボタンは押さない（利用者と同じ）
    return o;
  };
  /* 📁 フォルダで読む（「まとめて復号しますか？」は キャンセル）。覚えているパスワードは消してから読む */
  window.__readFolderLocked = async function(files){
    const list = window.__mk('リスト', files, {});
    const root = window.__mk('工事', {}, { 'リスト': list });
    window.showDirectoryPicker = async () => root;
    clearSessionPassword('試験');
    const oc = window.confirm;
    window.confirm = m => /まとめて復号しますか/.test(String(m)) ? false : oc.call(window, m);
    try { openListView(); await listSelectFolder(); await new Promise(r => setTimeout(r, 600)); }
    finally { window.confirm = oc; if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } }
    return list;
  };
  /* 一覧の行を押して開く */
  window.__openRow = async function(row){
    const i = _listRows.indexOf(row);
    const tr = [...document.querySelectorAll('tbody tr[data-list-idx="' + i + '"]')].filter(t => t.offsetParent !== null)[0];
    if(tr) tr.click();
    for(let k = 0; k < 80 && document.body.classList.contains('list-view-open'); k++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 400));
    return !!tr;
  };
  window.__v = id => (document.getElementById(id) || {}).value;
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
async function openMain(label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const said = [];
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => { said.push({ type: d.type(), msg: d.message() }); d.accept().catch(()=>{}); });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await page.goto(MAIN);
  await page.waitForFunction(() => typeof applyProject === 'function' && typeof overwriteSaveCurrent === 'function'
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);
  await page.evaluate(SETUP);
  said.length = 0;
  return { ctx, page, said };
}
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['lgOverlayLedger','lgwbWanted','listLoadRow','listSelectFolder','overwriteSaveCurrent','encryptHybrid','decryptHybrid',
                    'encryptJsonString','decryptJsonString','setLedger','subCaseKey','clearSessionPassword','setSessionPassword'];
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION };
    });
    console.log('⓪前提', short(r0));
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
  }

  // ---- ① まだほどいていない .hyb を、行を押してパスワードを入れて開く ----
  if(want('①')){
    const { ctx, page } = await openMain('①');
    const r = await run(page, async () => {
      const NO = '2612ST0001', PW = 'pw-180-a', FN = NO + '.hyb';
      const A = __jpeg(600, 450, 0.85, 181);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '甲 様', chosho_cust_tel: '011-111-1111', chosho_cust_addr: '札幌市北区1-1',
                     chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43', chosho_photos: [{ id: 'pA', label: '写真A', dataUri: A }] };
      const list = await __readFolderLocked({ [FN]: JSON.stringify(await encryptHybrid(base, PW), null, 2) });
      const row = _listRows.find(x => x && x.fileType === 'hybrid');
      const o = { loaded: { rows: _listRows.length, locked: !!(row && !row.unlocked), rowName: row && row.data.chosho_cust_name } };
      setLedger(subCaseKey(row), { note: '台帳の備考' });              // 受付台帳の備考（今までどおり入る）
      promptPassword = async () => PW;                                // 聞かれたらパスワードを入れる
      o.click = await __openRow(row);
      o.screen = { name: __v('chosho_cust_name'), tel: __v('chosho_cust_tel'), addr: __v('chosho_cust_addr'), note: __v('chosho_note') };
      __setField('amplifier', 'amp_1u45');
      o.press = (await __pressSave()).pressed;
      await new Promise(r => setTimeout(r, 300));
      try { const d = await decryptHybrid(JSON.parse(list.__files[FN]), PW);
        o.file = { name: d.chosho_cust_name, tel: d.chosho_cust_tel, addr: d.chosho_cust_addr, amp: d.amplifier,
                   n: (d.chosho_photos || []).filter(p => p && p.dataUri).length };
      } catch(e){ o.file = { err: String((e && e.message) || e).slice(0, 80) }; }
      return o;
    });
    console.log('①まだほどいていない .hyb を開いて保存', short(r));
    ok(!r.error, '①止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.rows === 1 && r.loaded.locked && r.loaded.rowName === '★★★★★' && r.click && r.press,
         '①試験の前提: 📁 の .hyb をまとめて復号せずに読むと、行の氏名は「★★★★★」・開いて保存できる → ' + short(r));
      ok(r.screen.name === '甲 様' && r.screen.tel === '011-111-1111' && r.screen.addr === '札幌市北区1-1',
         '★① まだほどいていない .hyb を開くと、画面の氏名・電話・住所が一覧の伏せ字（★★★★★）になった → ' + short(r.screen));
      ok(r.screen.note === '台帳の備考', '★① 受付台帳の備考が、開いた画面に入らない（台帳の控えまでかぶせなくなった） → ' + short(r.screen));
      ok(r.file.name === '甲 様' && r.file.tel === '011-111-1111' && r.file.addr === '札幌市北区1-1' && r.file.amp === 'amp_1u45' && r.file.n === 1,
         '★① 💾 上書き保存で、.hyb のお客様の氏名・電話・住所が「★★★★★」になった（または直しが入らない・写真が減った） → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ② まだほどいていない .enc を、覚えているパスワードで開く ----
  if(want('②')){
    const { ctx, page } = await openMain('②');
    const r = await run(page, async () => {
      const NO = '2612ST0002', PW = 'pw-180-b', FN = NO + '.enc';
      const obj = { chosho_mgmt_no: NO, chosho_cust_name: '乙 様', chosho_cust_tel: '011-222-2222', chosho_cust_addr: '札幌市南区2-2',
                    chosho_date: '2026-11-05', chosho_note: '乙の備考', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = await __readFolderLocked({ [FN]: JSON.stringify(await encryptJsonString(JSON.stringify(obj), PW), null, 2) });
      const row = _listRows.find(x => x && x.fileType === 'full');
      const o = { loaded: { rows: _listRows.length, locked: !!(row && !row.unlocked), rowMgmt: row && row.data.chosho_mgmt_no } };
      setSessionPassword(PW);                                         // 別の戸別を開いたときに入れたパスワードを覚えている
      o.click = await __openRow(row);
      o.screen = { mgmt: __v('chosho_mgmt_no'), name: __v('chosho_cust_name'), addr: __v('chosho_cust_addr'), date: __v('chosho_date'), note: __v('chosho_note') };
      __setField('amplifier', 'amp_1u45');
      o.press = (await __pressSave()).pressed;
      await new Promise(r => setTimeout(r, 300));
      try { const d = JSON.parse(await decryptJsonString(JSON.parse(list.__files[FN]), PW));
        o.file = { mgmt: d.chosho_mgmt_no, name: d.chosho_cust_name, addr: d.chosho_cust_addr, date: d.chosho_date, note: d.chosho_note, amp: d.amplifier };
      } catch(e){ o.file = { err: String((e && e.message) || e).slice(0, 80) }; }
      return o;
    });
    console.log('②まだほどいていない .enc を開いて保存', short(r));
    ok(!r.error, '②止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.rows === 1 && r.loaded.locked && r.loaded.rowMgmt !== '2612ST0002' && r.click && r.press,
         '②試験の前提: 📁 の .enc をまとめて復号せずに読むと、行は作り物（管理番号も伏せてある）・開いて保存できる → ' + short(r));
      ok(r.screen.mgmt === '2612ST0002' && r.screen.name === '乙 様' && r.screen.addr === '札幌市南区2-2' && r.screen.date === '2026-11-05' && r.screen.note === '乙の備考',
         '★② まだほどいていない .enc を開くと、画面に一覧の作り物の値（管理番号・氏名・住所・日程・備考）が入った → ' + short(r.screen));
      ok(r.file.mgmt === '2612ST0002' && r.file.name === '乙 様' && r.file.addr === '札幌市南区2-2' && r.file.date === '2026-11-05' && r.file.note === '乙の備考' && r.file.amp === 'amp_1u45',
         '★② 💾 上書き保存で、.enc に作り物の値が書かれた（または直しが入らない） → ' + short(r.file));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v180_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
