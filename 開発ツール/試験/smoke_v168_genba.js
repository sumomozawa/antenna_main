/* 版168（現場入力）
   PCで開いたとき、戸別ファイルを「手で探させない」。
     ・受付台帳から開くと、掴んでいるフォルダの中の 管理番号.json をその場で読む
       （端末のファイル選択は出さない）。写真も図面も手元に入り、【見るだけ】が解ける。
     ・フォルダの直下に無く、その下の「リスト」フォルダにあるときも見つける。
     ・許可が切れているときは、勝手に窓を出さず、今までどおり帯を出す。
     ・フォルダを掴めない端末（スマホ）は、今までどおりファイル選択の窓のまま。
     ・読み込んだあとも、受付台帳で直された工事日は入ったまま（ファイルの古い日で戻らない）。
     ・【見るだけ】でも、フォルダから読めれば「保存」は通る。 */
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
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

/* 画面の中に作る「にせのフォルダ」。本物の File System Access と同じ形だけ持たせる。 */
const SETUP = `
window.__mkdir = function(name, files, subs){
  const dir = {
    kind: 'directory', name: name, __files: files || {}, __subs: subs || {}, __perm: 'granted',
    __listed: 0,
    queryPermission: async () => dir.__perm,
    requestPermission: async () => { dir.__perm = 'granted'; return 'granted'; },
    getFileHandle: async (n, opt) => {
      if(!(n in dir.__files)){
        if(!(opt && opt.create)) { const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        dir.__files[n] = '';
      }
      return { kind:'file', name:n,
        getFile: async () => ({ name:n, size:(dir.__files[n]||'').length,
          text: async () => dir.__files[n],
          arrayBuffer: async () => new TextEncoder().encode(dir.__files[n]).buffer }),
        createWritable: async () => ({
          write: async b => { dir.__files[n] = (typeof b === 'string') ? b : await b.text(); },
          close: async () => {} }) };
    },
    entries: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => [n, { kind:'file', name:n }])
        .concat(Object.keys(dir.__subs).map(n => [n, dir.__subs[n]]));
      let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } };
    } }; }
  };
  return dir;
};
window.__caseJson = function(no, over){
  return JSON.stringify(Object.assign({
    chosho_mgmt_no: no, work_type: 'catv_to_uhf', amplifier: 'amp_3u43',
    chosho_cust_name: 'ファイルの 太郎', chosho_date: '2026-09-01',
    chosho_note: 'PCで書いた備考',
    chosho_photos: [
      { id:'p1', label:'外観', dataUri:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==' },
      { id:'p2', label:'屋根', dataUri:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==' }
    ],
    editedAt: '2026-09-10T00:00:00.000Z'
  }, over || {}));
};
window.__seedLedger = function(over){
  receptionSaveRows({ type:'antenna_reception_ledger', version:5,
    rows: [Object.assign({ mgmt_no:'2621HIN101', name:'台帳の 太郎', addr:'青森県三沢市1-1',
      tel:'0176-00-0001', date:'2026-09-20', status:'in_progress',
      photos:2, has_dwg:true }, over || {})],
    project:'令和８年度戸別受信設備設置工事（その２）',
    exportedAt:'2026-09-17T00:00:00.000Z', appVersion:'168' });
};
window.__openRow = async function(){
  const r = getReceptionRows().find(x => x.mgmt_no === '2621HIN101');
  await openFromReception(r);
};
window.__reset = async function(){
  M = freshModel(); M._viewOnly = false; _caseDirHit = null; _saveDir = null;
  try{ localStorage.removeItem('genba_last_draft'); }catch(_){}
  const ks = await idbAllKeys ? null : null;
  render();
};
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);
  await page.evaluate(SETUP);

  /* 窓（uiAlert / uiConfirm）は黙って「はい」で閉じ、出た文を控える */
  await page.evaluate(() => {
    window.__said = [];
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')){
        const b = document.getElementById('ui-dialog-msg');
        window.__said.push(b ? b.textContent : '');
        const okb = document.getElementById('ui-dialog-ok'); if(okb) okb.click();
      }
    }, 40);
    window.__stopDlg = () => clearInterval(t);
  });

  // ---------- ⓪ 前提 ----------
  const ready = await page.evaluate(() => ({
    f: ['caseDirReady','caseFileFromDir','pcGuardAutoLoad','pcGuardDirLoad',
        'pcGuardNeeded','renderPcGuard','openFromReception','readExistingCaseFiles']
        .filter(n => typeof window[n] !== 'function'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // ---------- ① 台帳から開くと、フォルダの中のファイルをその場で読む ----------
  const r1 = await page.evaluate(async () => {
    __seedLedger();
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    await __openRow();
    await new Promise(r => setTimeout(r, 400));
    return { viewOnly: !!M._viewOnly, fromFile: !!M._fromCaseFile,
             photos: (M.chosho_photos || []).length,
             amp: M.amplifier, name: M.chosho_cust_name,
             band: (document.getElementById('pcguard') || {}).style ?
                   document.getElementById('pcguard').style.display : '?',
             base: !!(M._fileBase && M._fileBase.no) };
  });
  console.log('①台帳から開く（直下にある）', JSON.stringify(r1));
  ok(r1.viewOnly === false, '★台帳から開いても【見るだけ】のまま＝フォルダから読めていない');
  ok(r1.fromFile === true, '★戸別ファイルを読んだ印（_fromCaseFile）が立っていない');
  ok(r1.photos === 2, '★PCの写真が手元に入っていない → ' + r1.photos + '枚');
  ok(r1.amp === 'amp_3u43', '★ファイルの中身（増幅器）が入っていない → ' + r1.amp);
  ok(r1.base === true, '★ファイルの控え（3つ見比べの土台）が取れていない');
  ok(r1.band === 'none', '★守りの帯が出たまま → ' + r1.band);

  // ---------- ② 受付台帳で直された工事日が、ファイルの古い日で戻らない ----------
  console.log('②台帳の工事日', JSON.stringify({ date: await page.evaluate(() => M.chosho_date) }));
  ok(await page.evaluate(() => M.chosho_date) === '2026-09-20',
     '★台帳で直した工事日が、ファイルの古い日に戻った → ' + await page.evaluate(() => M.chosho_date));

  // ---------- ③ 直下に無く、その下の「リスト」フォルダにあるとき ----------
  const r3 = await page.evaluate(async () => {
    const inner = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101', { amplifier:'amp_2u43' }) }, {});
    _caseDirHit = null;
    _saveDir = __mkdir('令和８年度…（その２）', { '受付台帳.json': '{"type":"antenna_reception_ledger"}' },
                        { 'リスト': inner, '_控え': __mkdir('_控え', {}, {}) });
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    const got = await pcGuardAutoLoad();
    return { got: got, amp: M.amplifier, photos: (M.chosho_photos||[]).length,
             viewOnly: !!M._viewOnly, hit: _caseDirHit && _caseDirHit.name };
  });
  console.log('③下のフォルダにある', JSON.stringify(r3));
  ok(r3.got === true, '★すぐ下のフォルダ（リスト）にある戸別ファイルを見つけられない');
  ok(r3.amp === 'amp_2u43', '★下のフォルダのファイルの中身が入っていない → ' + r3.amp);
  ok(r3.photos === 2, '★下のフォルダのファイルの写真が入っていない → ' + r3.photos);
  ok(r3.viewOnly === false, '★【見るだけ】が解けていない');
  ok(r3.hit === 'リスト', '★当たったフォルダを覚えていない → ' + r3.hit);

  // ---------- ④ 許可が切れているときは、勝手に窓を出さず、今までどおり帯 ----------
  const r4 = await page.evaluate(async () => {
    _caseDirHit = null;
    const d = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    d.__perm = 'prompt';
    let asked = 0;
    d.requestPermission = async () => { asked++; return 'granted'; };
    _saveDir = d;
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    const got = await pcGuardAutoLoad();
    return { got: got, asked: asked, viewOnly: !!M._viewOnly, listed: d.__listed };
  });
  console.log('④許可が切れている', JSON.stringify(r4));
  ok(r4.got === false, '★許可が切れているのに読んだことになっている');
  ok(r4.asked === 0, '★押してもいないのに、許可を聞く窓を出している（' + r4.asked + '回）');
  ok(r4.viewOnly === true, '★読めていないのに【見るだけ】が解けている');

  // ---------- ⑤ 帯のボタン（フォルダを掴める端末） ----------
  const r5 = await page.evaluate(async () => {
    _saveDir = __mkdir('リスト', {}, {});
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    renderPcGuard();
    const h = document.getElementById('pcguard');
    return { dir: !!document.getElementById('pcg-dir'),
             load: !!document.getElementById('pcg-load'),
             force: !!document.getElementById('pcg-force'),
             dirTxt: (document.getElementById('pcg-dir') || {}).textContent || '',
             shown: h.style.display !== 'none' };
  });
  console.log('⑤帯のボタン（PC）', JSON.stringify(r5));
  ok(r5.shown === true, '★帯が出ていない');
  ok(r5.dir === true, '★「📁 PCのフォルダから読み込む」が無い＝手でファイルを探すしかない');
  ok(/フォルダ/.test(r5.dirTxt), '★フォルダのボタンの字が違う → ' + r5.dirTxt);
  ok(r5.load === true, '★「📂 ファイルを選んで読み込む」（今までの道）が消えている');
  ok(r5.force === true, '★「このまま新しく入力する」が消えている');

  // ---------- ⑥ フォルダを掴めない端末（スマホ）は今までどおり ----------
  const r6 = await page.evaluate(async () => {
    const keep = window.showDirectoryPicker;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    renderPcGuard();
    const o = { dir: !!document.getElementById('pcg-dir'),
                load: (document.getElementById('pcg-load') || {}).textContent || '',
                force: !!document.getElementById('pcg-force') };
    window.showDirectoryPicker = keep;
    return o;
  });
  console.log('⑥帯のボタン（スマホ）', JSON.stringify(r6));
  ok(r6.dir === false, '★フォルダを掴めない端末に、押しても何も起きないボタンを出している');
  ok(/戸別ファイルを読み込んで編集する/.test(r6.load),
     '★スマホの言い方が変わっている → ' + r6.load);
  ok(r6.force === true, '★「このまま新しく入力する」が消えている');

  // ---------- ⑦ 【見るだけ】でも、フォルダから読めれば「保存」は通る ----------
  const r7 = await page.evaluate(async () => {
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    __said.length = 0;
    const pass = await pcGuardBeforeSave();
    return { pass: pass, viewOnly: !!M._viewOnly, photos: (M.chosho_photos||[]).length, said: __said.slice() };
  });
  console.log('⑦保存の関門', JSON.stringify({ pass:r7.pass, viewOnly:r7.viewOnly, photos:r7.photos, said:r7.said.length }));
  ok(r7.pass === true, '★フォルダから読めるのに、保存を止めている');
  ok(r7.photos === 2, '★止めずに通したのに、PCの写真が手元に無い → ' + r7.photos);
  ok(r7.said.length === 0, '★黙って読めるはずの場面で、窓を出している → ' + r7.said.join(' / '));

  // ---------- ⑧ フォルダから読めないときは、今までどおり止める ----------
  const r8 = await page.evaluate(async () => {
    _caseDirHit = null; _saveDir = null;
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    __said.length = 0;
    const pass = await pcGuardBeforeSave();
    return { pass: pass, said: __said.slice() };
  });
  console.log('⑧読めないときは止める', JSON.stringify(r8));
  ok(r8.pass === false, '★フォルダから読めないのに、保存を通している（PCの写真が消える）');
  ok(r8.said.length >= 1 && /見るだけ/.test(r8.said.join(' ')),
     '★止めたのに、理由を知らせていない → ' + r8.said.join(' / '));

  // ---------- ⑨ 別の戸別のファイルは読まない ----------
  const r9 = await page.evaluate(async () => {
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2622MAB025') }, {});
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    const got = await pcGuardAutoLoad();
    return { got: got, no: M.chosho_mgmt_no, photos: (M.chosho_photos||[]).length,
             viewOnly: !!M._viewOnly };
  });
  console.log('⑨中の管理番号が違うファイル', JSON.stringify(r9));
  ok(r9.got === false, '★名前は合っていても中身が別の戸別のファイルを読み込んでいる');
  ok(r9.photos === 0, '★別の戸別の写真が入った → ' + r9.photos);
  ok(r9.viewOnly === true, '★読めていないのに【見るだけ】が解けている（このまま保存するとPCの中身が消える）');

  // ---------- ⑩ 現場で入力した中身は、読み込んでも消えない ----------
  const r10 = await page.evaluate(async () => {
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101';
    M.amplifier = 'amp_2u43';                 // 現場で選び直した
    M.chosho_note = '現場で書いた備考';        // 現場で書いた
    M.chosho_date = '2026-09-25';             // 現場で工事日を直した（台帳は 09-20 のまま）
    M._rcSrc = rcSrcOf(getReceptionRows().find(x => x.mgmt_no === '2621HIN101'));
    M._touched = true;
    M._viewOnly = true;
    __said.length = 0;
    const got = await pcGuardAutoLoad();
    return { got: got, amp: M.amplifier, note: M.chosho_note, date: M.chosho_date,
             photos: (M.chosho_photos||[]).length, work: M.work_type };
  });
  console.log('⑩現場の入力は消えない', JSON.stringify(r10));
  ok(r10.got === true, '★フォルダから読めていない');
  ok(r10.amp === 'amp_2u43', '★現場で選んだ増幅器が、ファイルの内容で消えた → ' + r10.amp);
  ok(r10.note === '現場で書いた備考', '★現場で書いた備考が消えた → ' + r10.note);
  ok(r10.photos === 2, '★PCの写真が入っていない → ' + r10.photos);
  ok(r10.work === 'catv_to_uhf', '★ファイルにしか無い内容（工事種別）が入っていない → ' + r10.work);
  ok(r10.date === '2026-09-25',
     '★現場で直した工事日が、台帳の入れ直しで潰れた → ' + r10.date);

  // ---------- ⑪ ファイルにしか無い備考は、台帳の入れ直しで消さない ----------
  const r11 = await page.evaluate(async () => {
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._touched = false; M._viewOnly = true;
    const got = await pcGuardAutoLoad();
    return { got: got, note: M.chosho_note };
  });
  console.log('⑪PCで書いた備考', JSON.stringify(r11));
  ok(r11.note === 'PCで書いた備考', '★PCで書いた備考が、台帳の入れ直しで消えた → ' + r11.note);

  // ---------- ⑫ 「下書きの続き」で開く道でも、フォルダから読む ----------
  const r12 = await page.evaluate(async () => {
    _caseDirHit = null;
    _saveDir = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    /* 先にこの端末の下書きを作っておく（次に台帳から開くと「続きから」の道を通る） */
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._lastDraftKey = 'no:2621HIN101';
    M._touched = false; M._viewOnly = false;
    await persistDraft();
    M = freshModel(); render();
    await __openRow();
    await new Promise(r => setTimeout(r, 400));
    return { viewOnly: !!M._viewOnly, fromFile: !!M._fromCaseFile,
             photos: (M.chosho_photos||[]).length, amp: M.amplifier,
             key: M._lastDraftKey || '' };
  });
  console.log('⑫下書きの続きの道', JSON.stringify(r12));
  ok(r12.key === 'no:2621HIN101', '★「下書きの続き」の道を通っていない（試験の前提）→ ' + r12.key);
  ok(r12.viewOnly === false, '★下書きの続きで開くと【見るだけ】のまま＝フォルダから読めていない');
  ok(r12.fromFile === true, '★下書きの続きの道で、戸別ファイルを読んだ印が立っていない');
  ok(r12.photos === 2, '★下書きの続きの道で、PCの写真が入っていない → ' + r12.photos);
  ok(r12.amp === 'amp_3u43', '★下書きの続きの道で、ファイルの中身が入っていない → ' + r12.amp);

  await page.evaluate(() => { try{ __stopDlg(); }catch(_){} });
  const e2 = errs.filter(x => !/ResizeObserver|NotFound/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版168（現場入力）');
})();
