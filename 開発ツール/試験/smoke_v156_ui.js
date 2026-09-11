/* 版156: 画面がふつうに動くか（900行の直しで壊れていないか）を通しで見る。
   失われた試験一式の代わりに、現場入力のいちばん通る道を端から端まで通す。 */
const { chromium } = require('playwright-core');
/* Chromium の置き場所。環境変数 CHROME で変えられる。 */
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
/* 3つのリポジトリは隣どうしに置いてある前提（…/antenna_main/開発ツール/試験/ から数える） */
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
    window.__asked = []; window.__answer = true;
    uiConfirm = async m => { window.__asked.push(m); return window.__answer; };
    uiAlert   = async m => { window.__asked.push(m); return true; };
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
  });

  // ---- ① 画面が全部出る（節をひとつずつ開く） ----
  const r1 = await page.evaluate(async () => {
    const secs = Array.from(document.querySelectorAll('#app .sec'));
    const names = secs.map(s => s.dataset.sec);
    for(const s of secs){ if(s.classList.contains('open')) continue;
      const h = s.querySelector('.head'); if(h) h.click(); }
    await new Promise(r => setTimeout(r, 400));
    const open = Array.from(document.querySelectorAll('#app .sec.open')).length;
    const fields = document.querySelectorAll('#app input, #app select, #app textarea').length;
    return { n: secs.length, names, open, fields, ver: APP_VERSION };
  });
  console.log('①画面', JSON.stringify({ 節: r1.n, 開いた: r1.open, 欄: r1.fields, 版: r1.ver }));
  ok(!!WANT_VER && r1.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r1.ver + ' ／ ファイル ' + WANT_VER);
  ok(r1.n >= 5 && r1.open === r1.n, '★節が開かない（画面が壊れている） → ' + JSON.stringify(r1));
  ok(r1.fields > 40, '★入力の欄が出ていない → ' + r1.fields);

  // ---- ② 入力すると下書きに残る（印が立つ・回数が進む） ----
  const r2 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); render();
    const before = { touched: M._touched === true, rev: M._rev | 0 };
    const el = document.querySelector('[data-fld="chosho_cust_name"]');
    if(el){ el.value = '試験 太郎'; el.dispatchEvent(new Event('input', { bubbles:true })); }
    await new Promise(r => setTimeout(r, 300));
    return { before, touched: M._touched === true, rev: M._rev | 0, name: M.chosho_cust_name };
  });
  console.log('②入力', JSON.stringify(r2));
  ok(r2.name === '試験 太郎', '★画面の入力がモデルに入らない → ' + JSON.stringify(r2));
  ok(r2.before.touched === false && r2.touched === true,
     '★入力しても「現場で入力した」印が立たない（G1で書かれなくなる） → ' + JSON.stringify(r2));

  // ---- ③ 工程の印（下見 → 取り消し）が動く。取り消しは状態も下げる ----
  const r3 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'UI0001'; render();
    window.__answer = true;
    await flowToggle('survey'); await new Promise(r => setTimeout(r, 200));
    const on = { f: M.survey_done === true, at: !!M.survey_done_at };
    await flowToggle('work'); await new Promise(r => setTimeout(r, 200));
    const work = { f: M.work_done === true, st: M.chosho_status };
    await flowToggle('work'); await new Promise(r => setTimeout(r, 200));
    const undo = { f: M.work_done === true, st: M.chosho_status, at: String(M.work_done_at || '') };
    return { on, work, undo };
  });
  console.log('③工程', JSON.stringify(r3));
  ok(r3.on.f && r3.on.at, '★下見の印が付かない → ' + JSON.stringify(r3.on));
  ok(r3.work.f && r3.work.st === 'completed', '★工事完了の印が状態に反映しない → ' + JSON.stringify(r3.work));
  ok(r3.undo.f === false && r3.undo.st === 'in_progress' && r3.undo.at === '',
     '★工事完了を取り消しても状態が完了のまま → ' + JSON.stringify(r3.undo));

  // ---- ④ 受付台帳を取り込んで開く。PCに中身がある戸別は見るだけになる ----
  const r4 = await page.evaluate(async () => {
    receptionSaveRows({ rows:[
      { mgmt_no:'UI1001', name:'あ様', addr:'○市1-1', date:'2026-09-10',
        status:'in_progress', photos:6, has_dwg:true, work_done:false },
      { mgmt_no:'UI1002', name:'い様', addr:'○市1-2', date:'2026-09-11',
        status:'in_progress', photos:0, has_dwg:false, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    const rows = getReceptionRows();
    M = freshModel(); ensureModelShape(M);
    await openFromReception(rows[0]); await new Promise(r => setTimeout(r, 500));
    const pc = { viewOnly: !!M._viewOnly, band: !!document.querySelector('.pcg-ttl'),
                 body: document.body.classList.contains('viewonly') };
    await openFromReception(rows[1]); await new Promise(r => setTimeout(r, 500));
    const plain = { viewOnly: !!M._viewOnly, name: M.chosho_cust_name, date: M.chosho_date };
    return { n: rows.length, pc, plain };
  });
  console.log('④受付台帳', JSON.stringify(r4));
  ok(r4.n === 2, '★受付台帳が取り込めていない → ' + r4.n);
  ok(r4.pc.viewOnly === true && r4.pc.band === true && r4.pc.body === true,
     '★PCに中身がある戸別が【見るだけ】になっていない（写真が消える） → ' + JSON.stringify(r4.pc));
  ok(r4.plain.viewOnly === false && r4.plain.name === 'い様' && r4.plain.date === '2026-09-11',
     '★PCに中身が無い戸別まで止めている／台帳の値が入っていない → ' + JSON.stringify(r4.plain));

  // ---- ⑤ 保存バー（保存先と控えの表示） ----
  const r5 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'UI2001';
    renderSaveBar(); await new Promise(r => setTimeout(r, 200));
    const el = document.getElementById('savebar') || document.querySelector('.savebar');
    const txt = el ? el.textContent.replace(/\s+/g,' ').trim() : '(無し)';
    const dest = !!document.getElementById('sb-dest');
    const base = !!document.querySelector('.sb-base');
    return { txt: txt.slice(0, 90), dest, base };
  });
  console.log('⑤保存バー', JSON.stringify(r5));
  ok(r5.dest, '★保存先のボタンが出ていない → ' + JSON.stringify(r5));
  ok(r5.base && /控え/.test(r5.txt), '★控えがあるかの表示が出ていない → ' + JSON.stringify(r5));

  // ---- ⑥ 写真を撮って保存 → 読み返して確かめる ----
  const r6 = await page.evaluate(async () => {
    const files = {};
    const dir = { name:'にせ', queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(n, o){ if(!(n in files)){ if(!(o&&o.create)) throw new Error('NF'); files[n]=''; }
        return { getFile: async()=>({ text: async()=>files[n] }),
                 createWritable: async()=>({ write: async(bl)=>{ files[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(files)) yield [n, { kind:'file' }]; },
      values: function*(){} };
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = 'UI3001'; M.chosho_cust_name = 'う様'; M.cable_main_len = '18';
    M.chosho_photos = [{ label:'施工前', dataUri: __png('#c33'), id:'u1' }];
    M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    const ret1 = await saveJsonRun();
    const names1 = Object.keys(files);
    const f1 = JSON.parse(files['UI3001.json'] || '{}');
    const ret2 = await saveJsonRun();                  // 2回目：ファイルは増えない
    const names2 = Object.keys(files);
    saveDirGet = og; saveDirOk = oo;
    return { ret1, ret2, names1, names2, cable: f1.cable_main_len,
             photos: (f1.chosho_photos||[]).length, name: f1.chosho_cust_name,
             origin: f1._origin, info: (_lastSaveInfo && _lastSaveInfo.title) || '' };
  });
  console.log('⑥保存', JSON.stringify(r6));
  ok(r6.ret1 === true && r6.names1.join(',') === 'UI3001.json',
     '★保存で 管理番号.json が書けていない → ' + JSON.stringify(r6));
  ok(r6.cable === '18' && r6.photos === 1 && r6.name === 'う様' && r6.origin === 'genba',
     '★書いた中身が入っていない → ' + JSON.stringify(r6));
  ok(r6.names2.length === 1, '★2回保存するとファイルが増える → ' + JSON.stringify(r6.names2));
  ok(/保存しました/.test(r6.info), '★保存したと知らせていない → ' + r6.info);

  // ---- ⑦ 書いたあと読み返しが合わないときは、黙って成功にしない ----
  const r7 = await page.evaluate(async () => {
    const files = { };
    const dir = { name:'うそつき', queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(n, o){ if(!(n in files)) files[n]='';
        return { getFile: async()=>({ text: async()=>{ const o2 = JSON.parse(files[n]||'{}');
                   o2.chosho_cust_name = ''; return JSON.stringify(o2); } }),
                 createWritable: async()=>({ write: async(bl)=>{ files[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(files)) yield [n, { kind:'file' }]; },
      values: function*(){} };
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = 'UI4001'; M.chosho_cust_name = 'え様'; M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    await saveJsonRun();
    saveDirGet = og; saveDirOk = oo;
    return { title: (_lastSaveInfo && _lastSaveInfo.title) || '', warn: !!(_lastSaveInfo && _lastSaveInfo.warn) };
  });
  console.log('⑦読み返し', JSON.stringify(r7));
  ok(/保存できていない/.test(r7.title) && r7.warn === true,
     '★書いた中身が落ちていても「保存しました」と言ってしまう → ' + JSON.stringify(r7));

  // ---- ⑧ 測定値の既定は空（見本の数字を調書に載せない） ----
  const r8 = await page.evaluate(() => {
    const a = freshModel(); ensureModelShape(a);
    const b2 = { chosho_mgmt_no:'UI5001' }; ensureModelShape(b2);   // 古い下書き（測定値なし）
    const val = m => (((m.measurements||{}).antenna||[])[0]||{}).db;
    return { fresh: String(val(a)), shaped: String(val(b2)),
             ch: ((b2.measurements||{}).channels||[]).length };
  });
  console.log('⑧測定値', JSON.stringify(r8));
  ok(r8.fresh === '' && r8.shaped === '',
     '★測定値の既定に見本の数字が入る（測っていない数字が工事調書に載る） → ' + JSON.stringify(r8));
  ok(r8.ch > 0, 'CH名まで消えている → ' + r8.ch);

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v156_ui');
})();
