/* 版172（現場入力）
   保存先を「物件 ＞ リスト」に固定する。
     ・PC：物件のフォルダ（ルート）を選んでも、覚えるのは中の「リスト」。親（物件）も一緒に覚える。
       前の版でルートを覚えたままの端末も、保存・読み込みのときに黙ってリストへ寄せる。
       ルートには新しい戸別ファイルを作らない。特別記録もリストへ。
     ・前の版でルートにできてしまった写しは、保存のたびに写真を和集合にしてリストへ入れる。
       ルートの写しは消さない。
     ・スマホ：受付台帳を取り込むと、入れる場所が「物件名/リスト」に自動で決まる
       （自分で選んだ名前は書き替えない）。案内も「すぐ下には入れない」とはっきり言う。
     ・保存バー：「📁 物件 ＞ リスト」。長い物件名でも横にはみ出さない。 */
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

/* 画面の中に作る「にせのフォルダ」（smoke_v168 の __mkdir に values() を足したもの）。
   子フォルダは __subs、ファイルの中身は __files、中をなめた回数は __listed、許可を聞いた回数は __asked。
   ★本物の Chrome と同じく、entries()/values() のたびに子フォルダの「写し」（同じ中身を指す別のもの）を返す★
     === で同じフォルダかを比べると、本物ではいつも「違う」になる。写しは isSameEntry で同じと答える。
     試験の側で同じフォルダかを見るときは __same(a, b) を使う。 */
const SETUP = `
window.__mkdir = function(name, files, subs){
  const fileH = n => ({ kind:'file', name:n,
    getFile: async () => ({ name:n, size:(dir.__files[n]||'').length,
      text: async () => dir.__files[n],
      arrayBuffer: async () => new TextEncoder().encode(dir.__files[n]).buffer }),
    createWritable: async () => ({
      write: async b => { dir.__files[n] = (typeof b === 'string') ? b : await b.text(); dir.__wrote.push(n); },
      close: async () => {} }) });
  const dir = {
    kind: 'directory', name: name, __files: files || {}, __subs: subs || {}, __perm: 'granted',
    __listed: 0, __wrote: [], __asked: 0,
    queryPermission: async () => dir.__perm,
    requestPermission: async () => { dir.__asked++; dir.__perm = 'granted'; return 'granted'; },
    getFileHandle: async (n, opt) => {
      if(!(n in dir.__files)){
        if(!(opt && opt.create)) { const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        dir.__files[n] = '';
      }
      return fileH(n);
    },
    isSameEntry: async o => !!o && o.__self === dir,
    entries: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => [n, { kind:'file', name:n }])
        .concat(Object.keys(dir.__subs).map(n => [n, __copyDir(dir.__subs[n])]));
      let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } };
    } }; },
    values: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => fileH(n))
        .concat(Object.keys(dir.__subs).map(n => __copyDir(dir.__subs[n])));
      let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } };
    } }; }
  };
  dir.__self = dir;
  return dir;
};
/* 子フォルダの写し：中身・数え・許可はもとのものを指す（関数はもとの dir を見ている） */
window.__copyDir = d => (d && d.__self) ? Object.create(d.__self) : d;
window.__same = (a, b) => !!a && !!b && a.__self === b.__self;
window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6;
  const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
window.__ph = (id, c) => ({ id:id, label:id, dataUri:__png(c) });
window.__caseJson = function(no, over){
  return JSON.stringify(Object.assign({
    chosho_mgmt_no: no, work_type: 'catv_to_uhf', amplifier: 'amp_3u43',
    chosho_cust_name: 'ファイルの 太郎', chosho_date: '2026-09-01',
    chosho_note: 'PCで書いた備考',
    chosho_photos: [ __ph('p1', '#c33'), __ph('p2', '#3a6') ],
    editedAt: '2026-09-10T00:00:00.000Z'
  }, over || {}));
};
/* 受付台帳（現場用のひとまとめ）の中身。nos … 管理番号の並び */
window.__ledger = nos => JSON.stringify({ type:'antenna_genba_set',
  ledger:{ type:'antenna_reception_ledger', version:5, rows: nos.map(n => ({ mgmt_no:n })) } });
window.__read = (dir, n) => { try{ return JSON.parse(dir.__files[n]); }catch(_){ return null; } };
window.__pids = j => ((j && j.chosho_photos) || []).filter(p => p && p.dataUri).map(p => String(p.id)).sort().join(',');
/* 窓を出しうる呼び出しは、壊れた本文でも必ず返ってくるようにする */
window.__T = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r('__timeout'), ms || 5000))]);
window.__seedLedger = function(over){
  receptionSaveRows({ type:'antenna_reception_ledger', version:5,
    rows: [Object.assign({ mgmt_no:'2621HIN101', name:'台帳の 太郎', addr:'青森県三沢市1-1',
      tel:'0176-00-0001', date:'2026-09-20', status:'in_progress',
      photos:2, has_dwg:true }, over || {})],
    project:'令和８年度戸別受信設備設置工事（その２）',
    exportedAt:'2026-09-17T00:00:00.000Z', appVersion:'172' });
};
window.__openRow = async function(){
  const r = getReceptionRows().find(x => x.mgmt_no === '2621HIN101');
  await openFromReception(r);
};
/* 覚えているフォルダを空にする（前の場面の親・当たり・名前の一覧を持ち越さない） */
window.__noDir = function(){
  _saveDir = null; _saveDirPar = null; _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
  try{ localStorage.removeItem(LS_SAVEDIR); localStorage.removeItem(LS_SAVEDIR_PAR); }catch(_){}
};
/* 前の場面で作った下書きを消す。
   ★これをやらないと「下書きの続き」の道に入り、自動読み込みが走らないまま緑になる★ */
window.__freshOpen = async function(){
  M = freshModel(); _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
  try{ await idbDel('no:2621HIN101'); }catch(_){}
  try{ localStorage.removeItem(LS_LAST); }catch(_){}
  render();
};
window.__clearDrafts = async () => {
  try{ for(const r of (await idbGetAll()) || []) if(r && r.key) await idbDel(r.key); }catch(_){}
  try{ localStorage.removeItem(LS_LAST); }catch(_){}
};
/* フォルダを選ぶ窓の無い端末（スマホ）にする／戻す */
window.__noPicker = function(){
  if(!('__keepPicker' in window)) window.__keepPicker = window.showDirectoryPicker;
  try{ delete window.showDirectoryPicker; }catch(_){}
  if(window.showDirectoryPicker) window.showDirectoryPicker = undefined;
};
window.__pickerBack = function(){
  if('__keepPicker' in window){ window.showDirectoryPicker = window.__keepPicker; delete window.__keepPicker; }
};
/* 受付台帳ファイルを「取り込む」から入れて、知らせの文を返す */
window.__impFile = async function(proj){
  const inp = document.getElementById('reception-file');
  const dt = new DataTransfer();
  dt.items.add(new File([JSON.stringify({ type:'antenna_reception_ledger', version:5, project:proj,
    exportedAt:'2026-09-17T00:00:00.000Z', appVersion:'172',
    rows:[{ mgmt_no:'2621HIN101', name:'台帳の 太郎', addr:'青森県三沢市1-1', date:'2026-09-20' }] })],
    '現場用_' + proj + '.json', { type:'application/json' }));
  inp.files = dt.files;
  __said.length = 0;
  inp.dispatchEvent(new Event('change', { bubbles:true }));
  for(let i = 0; i < 60 && !__said.some(s => /受付台帳/.test(s)); i++) await new Promise(r => setTimeout(r, 100));
  return __said.filter(s => /受付台帳/.test(s)).join(' / ');
};
/* 保存バーの📁（名前だけ覚える道）を開いて、label の候補を押す。typed があれば「自分で書く」の窓に書く。
   並んでいた候補を返す（label が無ければ閉じる） */
window.__pickHint = async function(label, typed){
  const p = saveDirChange('nameonly');
  const pm = document.getElementById('pick-modal');
  for(let i = 0; i < 40 && !(pm && pm.classList.contains('open')); i++) await new Promise(r => setTimeout(r, 50));
  const els = Array.from(document.querySelectorAll('#pick-list .pick-row'));
  const rows = els.map(el => el.querySelector('.pick-main').textContent.trim());
  const el = els.find(e => e.querySelector('.pick-main').textContent.trim() === label);
  if(el) el.click(); else { const c = document.getElementById('pick-close'); if(c) c.click(); }
  if(el && typed != null){
    const tm = document.getElementById('type-modal');
    for(let i = 0; i < 40 && !(tm && tm.classList.contains('open')); i++) await new Promise(r => setTimeout(r, 50));
    const inp = document.getElementById('type-input'); if(inp) inp.value = typed;
    const okb = document.getElementById('type-ok'); if(okb) okb.click();
  }
  await __T(p, 5000);
  return rows;
};
/* 管理番号 no の、この端末で入力した戸別を作る（PCのファイルは読んでいない） */
window.__mine = function(no){
  M = freshModel(); ensureModelShape(M);
  M.chosho_mgmt_no = no; M.chosho_cust_name = '現場の 花子'; M.chosho_date = '2026-09-10';
  M._touched = true; M._viewOnly = false;
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

  /* 窓（uiAlert / uiConfirm）は黙って「はい」で閉じ、出た文を控える。toast も控える。 */
  await page.evaluate(() => {
    window.__said = []; window.__toasts = [];
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')){
        const b = document.getElementById('ui-dialog-msg');
        window.__said.push(b ? b.textContent : '');
        const okb = document.getElementById('ui-dialog-ok'); if(okb) okb.click();
      }
    }, 40);
    window.__stopDlg = () => clearInterval(t);
    window.__ot = toast; toast = m => { window.__toasts.push(String(m)); try{ window.__ot(m); }catch(_){} };
  });

  // ---------- ⓪ 前提 ----------
  const ready = await page.evaluate(() => ({
    f: ['saveDirFindList','saveDirSkipChild','saveDirAdopt','saveDirSettle','saveDirParentOf','saveDirPlace',
        'readCaseFilesForWrite','caseFileFromDir','pcGuardAutoLoad','saveJsonRun','saveAllDrafts','spSaveFile',
        'flowShareDirFiles','saveHintParts','saveHintLabel','saveHintLine','saveShareWhere','saveHintAuto',
        'receptionSaveRows','saveOverlayShow','renderSaveBar','saveDirChange']
        .filter(n => typeof window[n] !== 'function'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  /* ---------- ① 前の版でルート（物件のフォルダ）を覚えたまま、台帳から開く → 保存 ----------
     リストの 管理番号.json が書き替わり、ルートには 管理番号.json ができない。 */
  const r1 = await page.evaluate(async () => {
    __noDir();
    __seedLedger();
    const list = __mkdir('リスト', { '2621HIN101.json': __caseJson('2621HIN101') }, {});
    const root = __mkdir('物件', { '現場用_物件_20260917.json': '{"type":"antenna_genba_set"}' }, { 'リスト': list });
    _saveDir = root;                               // 前の版の記録（親なし・ルート）
    await __freshOpen();
    await __T(__openRow());
    await new Promise(r => setTimeout(r, 400));
    const o = { 読んだ: !!M._fromCaseFile, 写真: (M.chosho_photos || []).length,
                覚え: _saveDir && _saveDir.name, 親: __same(saveDirParentOf(_saveDir), root),
                場所: saveDirPlace(),
                帯: (document.getElementById('sb-dest') || {}).textContent || '' };
    M.chosho_note = '現場で書いた備考'; M._touched = true;
    __said.length = 0;
    o.ret = await __T(saveJsonRun(), 8000);
    const j = __read(list, '2621HIN101.json');
    o.リストの備考 = j && j.chosho_note;
    o.リストの写真 = __pids(j);
    o.ルートに書いた = ('2621HIN101.json' in root.__files) || root.__wrote.length;
    o.title = (_lastSaveInfo && _lastSaveInfo.title) || '';
    o.msg = (_lastSaveInfo && _lastSaveInfo.msg) || '';
    return o;
  });
  console.log('①ルートを覚えたまま開いて保存', JSON.stringify(r1));
  ok(r1.読んだ === true && r1.写真 === 2,
     '試験の前提: 台帳から開いてリストのファイルを読めていない → ' + JSON.stringify(r1));
  ok(r1.覚え === 'リスト' && r1.親 === true,
     '★前の版で覚えた物件のフォルダを、中の「リスト」へ寄せていない → ' + r1.覚え);
  ok(r1.場所 === '物件 ＞ リスト', '★保存先の名前が「物件 ＞ リスト」になっていない → ' + r1.場所);
  ok(/物件/.test(r1.帯) && /＞ リスト/.test(r1.帯), '★保存バーに「物件 ＞ リスト」が出ていない → ' + r1.帯);
  ok(r1.ret === true && r1.title === '保存しました', '試験の前提: 保存できていない → ' + r1.title + ' / ' + r1.ret);
  ok(r1.リストの備考 === '現場で書いた備考', '★リストの 管理番号.json が書き替わっていない → ' + r1.リストの備考);
  ok(r1.リストの写真 === 'p1,p2', '★リストのファイルの写真が減った → ' + r1.リストの写真);
  ok(!r1.ルートに書いた, '★物件のすぐ下（ルート）に 管理番号.json を作った');
  ok(/物件 ＞ リスト/.test(r1.msg), '★保存の知らせに「物件 ＞ リスト」が出ていない → ' + r1.msg);

  /* ---------- ①b 自動読み込みを通らない戸別（PCにまだ無い新しい戸別）でも、保存はリストへ ----------
     保存そのものがリストへ寄せる（読み込みで寄せるのを当てにしない）。 */
  const r1b = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件B', { '現場用_物件B.json': '{}' }, { 'リスト': list });
    _saveDir = root;                               // 前の版の記録（親なし・ルート）
    __mine('Z172N01');
    const ret = await __T(saveJsonRun(), 8000);
    return { ret: ret, リスト: Object.keys(list.__files), ルート: Object.keys(root.__files),
             覚え: _saveDir && _saveDir.name, 親: __same(saveDirParentOf(_saveDir), root),
             title: (_lastSaveInfo && _lastSaveInfo.title) || '' };
  });
  console.log('①b新しい戸別の保存', JSON.stringify(r1b));
  ok(r1b.title === '保存しました', '試験の前提: 保存できていない → ' + JSON.stringify(r1b));
  ok(r1b.リスト.indexOf('Z172N01.json') >= 0, '★保存がリストに入っていない → ' + JSON.stringify(r1b));
  ok(r1b.ルート.indexOf('Z172N01.json') < 0, '★物件のすぐ下（ルート）に新しい戸別ファイルを作った → ' + JSON.stringify(r1b.ルート));
  ok(r1b.覚え === 'リスト' && r1b.親 === true, '★保存のときに「リスト」へ寄せていない → ' + r1b.覚え);

  /* ---------- ② リストの見つけ方 ---------- */
  const r2 = await page.evaluate(async () => {
    const o = {};
    // ② 「リスト」という名前なら、中が空（新しい物件）でもそこ
    __noDir();
    const l2 = __mkdir('リスト', {}, {});
    const p2 = __mkdir('新しい物件', {}, { '_控え': __mkdir('_控え', { 'A.json':'{}' }, {}), 'リスト': l2 });
    const g2 = await saveDirAdopt(p2, { ask:false });
    o.空のリスト = g2 && g2.name; o.空のリストの親 = __same(saveDirParentOf(_saveDir), p2);
    // ②b 名前は違うが、受付台帳が横にあり、直下に戸別が無く、台帳の管理番号が中のフォルダにある → 聞かずに中へ
    __noDir();
    const k2 = __mkdir('戸別', { 'X1 (1).json':'{}' }, {});
    const p2b = __mkdir('物件', { '受付台帳_物件.json': JSON.stringify({ type:'antenna_reception_ledger',
      rows:[ { mgmt_no:'X0' }, { mgmt_no:'Ｘ１' } ] }) }, { '戸別': k2 });
    const g2b = await saveDirAdopt(p2b, { ask:false });
    o.台帳あり = g2b && g2b.name;
    // ②c 特別記録は戸別に数えない
    o.数 = await saveDirCountCases(__mkdir('x', { '特別記録_資材_20260901_ab12.json':'{}',
      '特別記録_資材_20260902_cd34.json':'{}', 'X1.json':'{}', '現場用_x.json':'{}' }, {}), 200);
    // ⑨ 「リスト」を選んで、その中に「会社A」（台帳なし・手がかりが弱い）→ 聞かない道では選んだまま
    __noDir();
    const ka = __mkdir('会社A', { 'Y1.json':'{}', 'Y2.json':'{}' }, {});
    const l9 = __mkdir('リスト', { 'X1.json':'{}' }, { '会社A': ka });
    const g9 = await saveDirAdopt(l9, { ask:false });
    o.入れ子 = g9 && g9.name; o.入れ子の親 = saveDirParentOf(_saveDir);
    // 写真や控えのフォルダには入らない
    __noDir();
    const p2d = __mkdir('物件', { '現場用_物件.json':'{}' },
      { '写真': __mkdir('写真', { 'X1.json':'{}', 'X2.json':'{}' }, {}), '_控え': __mkdir('_控え', { 'X1.json':'{}' }, {}) });
    const g2d = await saveDirAdopt(p2d, { ask:false });
    o.写真フォルダ = g2d && g2d.name;
    __noDir();
    return o;
  });
  console.log('②リストの見つけ方', JSON.stringify(r2));
  ok(r2.空のリスト === 'リスト' && r2.空のリストの親 === true,
     '★中が空の「リスト」を選ばない（新しい物件で、物件のすぐ下に書いてしまう）→ ' + r2.空のリスト);
  /* 版172 第4回から: 受付台帳は強い手がかりにしない（台帳はリストの中にも工事フォルダにも置かれうる）。
     名前が「リスト」でない中のフォルダへは、聞かない道では入らない（選んだフォルダのまま＝前の版と同じ）。 */
  ok(r2.台帳あり === '物件',
     '★名前が「リスト」でないのに、受付台帳だけを手がかりに聞かずに中のフォルダへ入った → ' + r2.台帳あり);
  ok(r2.数 === 1, '★特別記録（や現場用）を戸別の数に入れている → ' + r2.数);
  ok(r2.入れ子 === 'リスト' && r2.入れ子の親 === null,
     '★手がかりが弱いのに、聞かずに「リスト」の中の別のフォルダへ入った → ' + r2.入れ子);
  ok(r2.写真フォルダ === '物件', '★写真や控えのフォルダを保存先にした → ' + r2.写真フォルダ);

  /* ---------- ③ リスト{写真a}＋ルートの写し{写真a,b}（リストの方が新しい）→ 保存するとリストに a,b。ルートは消えない ---------- */
  const r3 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    const list = __mkdir('リスト', { 'Z172A03.json': __caseJson('Z172A03',
      { chosho_photos:[ __ph('pa', '#c33') ] }) }, {});
    const rootTxt = __caseJson('Z172A03', { chosho_photos:[ __ph('pa', '#c33'), __ph('pb', '#36c') ],
      editedAt:'2026-09-05T00:00:00.000Z' });
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172A03.json': rootTxt }, { 'リスト': list });
    await saveDirAdopt(root, { ask:false });
    const 前提 = { 覚え: _saveDir && _saveDir.name, 親: __same(saveDirParentOf(_saveDir), root) };
    M = freshModel(); M.chosho_mgmt_no = 'Z172A03'; M._viewOnly = true;
    const got = await __T(pcGuardAutoLoad());
    const 読んだ写真 = (M.chosho_photos || []).map(p => p.id).sort().join(',');
    M.chosho_note = '現場で直した'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j = __read(list, 'Z172A03.json');
    return { 前提: 前提, got: got, 読んだ写真: 読んだ写真,
             リストの写真: __pids(j), リストの備考: j && j.chosho_note,
             ルートそのまま: root.__files['Z172A03.json'] === rootTxt,
             ルートに書いた: root.__wrote.slice(),
             title: (_lastSaveInfo && _lastSaveInfo.title) || '', msg: (_lastSaveInfo && _lastSaveInfo.msg) || '' };
  });
  console.log('③ルートの写しの写真をリストへ', JSON.stringify(r3));
  ok(r3.前提.覚え === 'リスト' && r3.前提.親 === true && r3.got === true && r3.読んだ写真 === 'pa',
     '試験の前提: リストを覚えてリストのファイルを読めていない → ' + JSON.stringify(r3));
  ok(r3.title === '保存しました', '試験の前提: 保存できていない → ' + r3.title);
  ok(r3.リストの写真 === 'pa,pb',
     '★ルートの写しにしか無い写真が、リストへ入っていない（和集合になっていない）→ ' + r3.リストの写真);
  ok(r3.リストの備考 === '現場で直した', '★現場の入力がリストに入っていない → ' + r3.リストの備考);
  ok(r3.ルートそのまま === true && r3.ルートに書いた.length === 0, '★ルートの写しを書き替えた（または消した）');
  ok(/すぐ下にも/.test(r3.msg) && /消していません/.test(r3.msg),
     '★ルートにも同じ戸別があったことを知らせていない → ' + r3.msg);

  /* ---------- ③b 両方にある組で、控えがルートの写しから取られている（ルートの写しの方が新しい） ----------
     古いリストを土台にして控えで見比べると「リスト≠控え」の欄を「PCが直した」と読み違え、現場の値を古い値に戻す。
     新しい方（ルートの写し）を土台にするので、控え＝土台の中身。確かめの窓は出ない（1回目も2回目も）。 */
  const r3b = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    // 前の版：物件のすぐ下を覚えていて、そこへ現場が書いていた（増幅器＝現場で選んだもの）
    const rootTxt = __caseJson('Z172A33', { amplifier:'amp_2u43', chosho_photos:[ __ph('pa', '#c33') ],
      editedAt:'2026-09-15T00:00:00.000Z' });
    const root = __mkdir('物件', { 'Z172A33.json': rootTxt }, {});
    _saveDir = root;
    M = freshModel(); M.chosho_mgmt_no = 'Z172A33'; M._viewOnly = true;
    const got = await __T(pcGuardAutoLoad());      // 控え＝ルートの写し
    const 控えの増幅器 = (M._fileBase && M._fileBase.state && M._fileBase.state.amplifier) || '';
    // そのあとPCで「リスト」ができて、古い値の戸別ファイルが入っている
    const list = __mkdir('リスト', { 'Z172A33.json': __caseJson('Z172A33', { amplifier:'amp_3u43',
      chosho_photos:[ __ph('pa', '#c33') ], editedAt:'2026-09-01T00:00:00.000Z' }) }, {});
    root.__subs['リスト'] = list;
    await saveDirSet(list, root);
    M.chosho_note = '現場で直した1'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j1 = __read(list, 'Z172A33.json');
    const 窓1 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    M.chosho_note = '現場で直した2';
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j2 = __read(list, 'Z172A33.json');
    const 窓2 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    return { got: got, 控えの増幅器: 控えの増幅器, 増幅器1: j1 && j1.amplifier, 備考1: j1 && j1.chosho_note, 窓1: 窓1,
             増幅器2: j2 && j2.amplifier, 備考2: j2 && j2.chosho_note, 窓2: 窓2,
             ルートそのまま: root.__files['Z172A33.json'] === rootTxt };
  });
  console.log('③b控えがルートの写しのとき', JSON.stringify(r3b));
  ok(r3b.got === true && r3b.控えの増幅器 === 'amp_2u43',
     '試験の前提: ルートの写しから控えを取れていない → ' + JSON.stringify(r3b));
  ok(r3b.増幅器1 === 'amp_2u43',
     '★現場で選んだ増幅器が、リストの古い値に黙って戻された（控えで読み違えている）→ ' + r3b.増幅器1);
  ok(r3b.備考1 === '現場で直した1', '★1回目の保存が入っていない → ' + r3b.備考1);
  ok(r3b.窓1 === 0, '★控えが新しい方（ルートの写し）の中身なのに、確かめの窓が出た → ' + r3b.窓1 + '回');
  ok(r3b.増幅器2 === 'amp_2u43' && r3b.備考2 === '現場で直した2', '★2回目の保存が入っていない → ' + JSON.stringify(r3b));
  ok(r3b.窓2 === 0, '★2回目の保存でも確かめの窓が出る（毎回聞かれる）→ ' + r3b.窓2 + '回');
  ok(r3b.ルートそのまま === true, '★ルートの写しを書き替えた（または消した）');

  /* ---------- ④ ルートにだけある写し{写真2枚・PCの備考} → リストへ2枚と備考が入る ---------- */
  const r4 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    const rootTxt = __caseJson('Z172A04', { chosho_note:'PCだけの備考',
      chosho_photos:[ __ph('q1', '#c33'), __ph('q2', '#3a6') ] });
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172A04.json': rootTxt }, { 'リスト': list });
    await saveDirAdopt(root, { ask:false });
    const 覚え = _saveDir && _saveDir.name;
    __mine('Z172A04');                                  // この端末で入力しただけ（PCのファイルは読んでいない）
    M.chosho_note = '';
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j = __read(list, 'Z172A04.json');
    return { 覚え: 覚え, リストの写真: __pids(j), リストの備考: j && j.chosho_note, 氏名: j && j.chosho_cust_name,
             ルートそのまま: root.__files['Z172A04.json'] === rootTxt, ルートに書いた: root.__wrote.slice(),
             title: (_lastSaveInfo && _lastSaveInfo.title) || '' };
  });
  console.log('④ルートにだけある写し', JSON.stringify(r4));
  ok(r4.覚え === 'リスト', '試験の前提: リストを覚えていない → ' + r4.覚え);
  ok(r4.title === '保存しました', '★ルートにだけある写しを土台にできず、保存が止まった → ' + r4.title);
  ok(r4.リストの写真 === 'q1,q2', '★ルートの写しの写真がリストへ入っていない → ' + r4.リストの写真);
  ok(r4.リストの備考 === 'PCだけの備考', '★ルートの写しにしか無い中身（備考）が消えた → ' + r4.リストの備考);
  ok(r4.氏名 === '現場の 花子', '★現場の入力が入っていない → ' + r4.氏名);
  ok(r4.ルートそのまま === true && r4.ルートに書いた.length === 0, '★ルートの写しを書き替えた（または消した）');

  /* ---------- ⑤ 覚えるフォルダを替えたら、前の物件のファイルを読まない ---------- */
  const r5 = await page.evaluate(async () => {
    __noDir();
    const listA = __mkdir('リスト', { 'Z172A05.json': __caseJson('Z172A05', { amplifier:'amp_2u43' }) }, {});
    const rootA = __mkdir('物件A', { '現場用_A.json':'{}' }, { 'リスト': listA });
    await saveDirAdopt(rootA, { ask:false });
    M = freshModel(); M.chosho_mgmt_no = 'Z172A05'; M._viewOnly = true;
    const gotA = await __T(pcGuardAutoLoad());
    const 当たりA = __same(_caseDirHit, listA);
    const rootB = __mkdir('物件B', { 'Z172A05.json': __caseJson('Z172A05', { amplifier:'amp_3u43' }) }, {});
    await saveDirSet(rootB, null);
    const 当たり空 = (_caseDirHit === null), 一覧空 = (_cfIdx === null);
    M = freshModel(); M.chosho_mgmt_no = 'Z172A05'; M._viewOnly = true;
    const gotB = await __T(pcGuardAutoLoad());
    const o = { gotA: gotA, 当たりA: 当たりA, 当たり空: 当たり空, 一覧空: 一覧空, gotB: gotB, 増幅器B: M.amplifier };
    /* ⑤b 前の物件のリストで当たった覚えが残っていても、根元が違えば見ない */
    __noDir();
    _caseDirHit = listA; _caseDirHitRoot = rootA;
    const listB = __mkdir('いまのリスト', { 'Z172A05.json': __caseJson('Z172A05', { amplifier:'amp_3u43' }) }, {});
    _saveDir = listB;
    M = freshModel(); M.chosho_mgmt_no = 'Z172A05'; M._viewOnly = true;
    o.gotB2 = await __T(pcGuardAutoLoad());
    o.増幅器B2 = M.amplifier;
    return o;
  });
  console.log('⑤覚えるフォルダを替える', JSON.stringify(r5));
  ok(r5.gotA === true && r5.当たりA === true, '試験の前提: 物件A のリストで当たっていない → ' + JSON.stringify(r5));
  ok(r5.当たり空 === true, '★覚えるフォルダを替えたのに、前の物件で当たったフォルダを覚えたまま');
  ok(r5.一覧空 === true, '★覚えるフォルダを替えたのに、前のフォルダの名前一覧を持ったまま');
  ok(r5.gotB === true && r5.増幅器B === 'amp_3u43', '★物件B のファイルを読んでいない（前の物件を読んだ）→ ' + r5.増幅器B);
  ok(r5.gotB2 === true && r5.増幅器B2 === 'amp_3u43',
     '★前の物件のリストで当たった覚えから、別の物件のファイルを読んだ → ' + r5.増幅器B2);

  /* ---------- ⑥ まとめて保存で物件のフォルダを選んでも、リストへ書く ---------- */
  const r6 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    __mine('Z172A06'); await persistDraft();
    M = freshModel(); render();
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
    const odp = window.showDirectoryPicker;
    let picked = 0;
    window.showDirectoryPicker = async () => { picked++; return root; };
    __said.length = 0;
    try{ await __T(saveAllDrafts(), 10000); }
    finally{ window.showDirectoryPicker = odp; }
    await new Promise(r => setTimeout(r, 200));
    return { picked: picked, リスト: Object.keys(list.__files), ルート: Object.keys(root.__files),
             覚え: _saveDir && _saveDir.name, 親: __same(saveDirParentOf(_saveDir), root),
             said: __said.slice(-2).map(s => s.slice(0, 60)) };
  });
  console.log('⑥まとめて保存', JSON.stringify(r6));
  ok(r6.picked === 1, '試験の前提: フォルダを選ぶ窓を通っていない → ' + JSON.stringify(r6));
  ok(r6.リスト.indexOf('Z172A06.json') >= 0, '★まとめて保存がリストに入っていない → ' + JSON.stringify(r6));
  ok(r6.ルート.indexOf('Z172A06.json') < 0, '★まとめて保存で、物件のすぐ下に書いた → ' + JSON.stringify(r6.ルート));
  ok(r6.覚え === 'リスト' && r6.親 === true, '★まとめて保存で選んだ物件の、中の「リスト」を覚えていない → ' + r6.覚え);

  /* ---------- ⑦ 特別記録もリストへ書く ---------- */
  const r7 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
    _saveDir = root;                               // 前の版の記録（親なし・ルート）
    const rec = spBlank(); rec.id = spNewId(); rec.key = spKey(rec.id);
    rec.title = '20素子アンテナ 検収'; rec.photos = [ __ph('s1', '#963') ];
    const r = await __T(spSaveFile(rec), 8000);
    return { ok: !!(r && r.ok), msg: (r && r.msg) || '', リスト: Object.keys(list.__files), ルート: Object.keys(root.__files),
             覚え: _saveDir && _saveDir.name };
  });
  console.log('⑦特別記録', JSON.stringify(r7));
  ok(r7.ok === true, '試験の前提: 特別記録を保存できていない → ' + JSON.stringify(r7));
  ok(r7.リスト.some(n => /^特別記録_/.test(n)), '★特別記録がリストに入っていない → ' + JSON.stringify(r7));
  ok(!r7.ルート.some(n => /^特別記録_/.test(n)), '★特別記録を物件のすぐ下に書いた → ' + JSON.stringify(r7.ルート));
  ok(/物件 ＞ リスト/.test(r7.msg), '★特別記録の知らせに「物件 ＞ リスト」が出ていない → ' + r7.msg);

  /* ---------- ⑧ 1つのフォルダにつき、中をなめるのは1回だけ（保存のたびに総なめしない） ---------- */
  const r8 = await page.evaluate(async () => {
    __noDir();
    const root = __mkdir('工事', { 'A.json':'{}' }, { '戸別': __mkdir('戸別', {}, {}) });   // 手がかりなし
    _saveDir = root;
    await saveDirSettle(root);
    const 総なめ1 = root.__listed;
    await saveDirSettle(root);
    return { 総なめ1: 総なめ1, 総なめ2: root.__listed, 覚え: _saveDir && _saveDir.name };
  });
  console.log('⑧総なめは1回', JSON.stringify(r8));
  ok(r8.総なめ1 === 1, '試験の前提: 1回目にフォルダの中を見ていない → ' + JSON.stringify(r8));
  ok(r8.総なめ2 === 1, '★寄せられないフォルダを、保存のたびに総なめしている → ' + r8.総なめ1 + ' → ' + r8.総なめ2);
  ok(r8.覚え === '工事', '★手がかりが無いのに、覚えるフォルダを替えた → ' + r8.覚え);

  /* ---------- ⑩ 保存バーの📁：手がかりが弱いときだけ1回聞く／強いときは聞かずにリストへ ---------- */
  const r10 = await page.evaluate(async () => {
    const odp = window.showDirectoryPicker;
    const o = {};
    try{
      __noDir();
      const weak = __mkdir('工事', { 'A.json':'{}' }, { '戸別': __mkdir('戸別', { 'X1.json':'{}', 'X2.json':'{}' }, {}) });
      window.showDirectoryPicker = async () => weak;
      __said.length = 0;
      await __T(saveDirChange(), 6000);
      o.弱い_窓 = __said.filter(s => /の方に入れますか/.test(s)).length;
      o.弱い_覚え = _saveDir && _saveDir.name;
      __noDir();
      const strong = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': __mkdir('リスト', {}, {}) });
      window.showDirectoryPicker = async () => strong;
      __said.length = 0; __toasts.length = 0;
      await __T(saveDirChange(), 6000);
      o.強い_窓 = __said.length;
      o.強い_覚え = _saveDir && _saveDir.name;
      o.強い_場所 = saveDirPlace();
      o.強い_知らせ = __toasts.join(' / ');
    } finally { window.showDirectoryPicker = odp; }
    return o;
  });
  console.log('⑩保存バーの📁', JSON.stringify(r10));
  ok(r10.弱い_窓 === 1, '★手がかりが弱いのに、中へ入るか聞いていない（または何度も聞く）→ ' + r10.弱い_窓);
  ok(r10.弱い_覚え === '戸別', '試験の前提: 「はい」と答えたのに中へ入っていない → ' + r10.弱い_覚え);
  ok(r10.強い_窓 === 0, '★「リスト」があるのに、わざわざ聞いている（押す回数が増える）→ ' + r10.強い_窓);
  ok(r10.強い_覚え === 'リスト' && r10.強い_場所 === '物件 ＞ リスト',
     '★物件のフォルダを選んだのに「リスト」へ入っていない → ' + r10.強い_覚え + ' / ' + r10.強い_場所);
  ok(/すぐ下には入れません/.test(r10.強い_知らせ), '★中へ入ったことを知らせていない → ' + r10.強い_知らせ);

  /* ---------- ⑪ ルートとリストの両方にある（ルートの方が新しい）→ 読むのはリスト ---------- */
  const r11 = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', { 'Z172A11.json': __caseJson('Z172A11',
      { amplifier:'amp_3u43', editedAt:'2026-09-01T00:00:00.000Z' }) }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172A11.json': __caseJson('Z172A11',
      { amplifier:'amp_2u43', editedAt:'2026-09-20T00:00:00.000Z' }) }, { 'リスト': list });
    _saveDir = root;                               // 前の版の記録
    M = freshModel(); M.chosho_mgmt_no = 'Z172A11'; M._viewOnly = true;
    const got1 = await __T(pcGuardAutoLoad());
    const 増幅器1 = M.amplifier;
    // 開き直し（リストを覚えている・当たりの覚えは無い）
    _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
    M = freshModel(); M.chosho_mgmt_no = 'Z172A11'; M._viewOnly = true;
    const got2 = await __T(pcGuardAutoLoad());
    return { got1: got1, 増幅器1: 増幅器1, got2: got2, 増幅器2: M.amplifier, 覚え: _saveDir && _saveDir.name };
  });
  console.log('⑪リストを先に読む', JSON.stringify(r11));
  ok(r11.got1 === true && r11.増幅器1 === 'amp_3u43', '★リストより先にルートの写しを読んだ → ' + r11.増幅器1);
  ok(r11.got2 === true && r11.増幅器2 === 'amp_3u43', '★開き直すとルートの写しを先に読む → ' + r11.増幅器2);

  /* ---------- ⑫ 子「戸別」だけ（台帳なし・名前も違う）で当てる → 読むだけ。保存先は覚え直さない ----------
     控えなど「_」で始まるフォルダの古いファイルは読まない。 */
  const r12 = await page.evaluate(async () => {
    __noDir();
    const kobetsu = __mkdir('戸別', { 'Z172A12.json': __caseJson('Z172A12', { amplifier:'amp_2u43' }) }, {});
    const hikae = __mkdir('_控え', { 'Z172A12.json': __caseJson('Z172A12', { amplifier:'amp_NG' }) }, {});
    const root = __mkdir('工事', { 'メモ.txt':'x' }, { '_控え': hikae, '戸別': kobetsu });
    _saveDir = root;
    M = freshModel(); M.chosho_mgmt_no = 'Z172A12'; M._viewOnly = true;
    __toasts.length = 0;
    const got = await __T(pcGuardAutoLoad());
    return { got: got, 増幅器: M.amplifier, 写真: (M.chosho_photos || []).length,
             覚え: _saveDir && _saveDir.name, 親: !!saveDirParentOf(_saveDir),
             知らせ: __toasts.join(' / ') };
  });
  console.log('⑫中のフォルダで当てる（読むだけ）', JSON.stringify(r12));
  ok(r12.got === true, '★物件のすぐ下のフォルダ（戸別）にあるファイルを見つけられない');
  ok(r12.増幅器 !== 'amp_NG', '★控えなど「_」で始まるフォルダの古いファイルを読んだ');
  ok(r12.増幅器 === 'amp_2u43' && r12.写真 === 2, '★中のフォルダのファイルの中身が入っていない → ' + r12.増幅器);
  ok(r12.覚え === '工事' && r12.親 === false,
     '★読んで当たった所に合わせて、保存先を黙って覚え直した（別の物件へ移る元）→ ' + r12.覚え);
  ok(!/そろえました/.test(r12.知らせ), '★読んだだけなのに保存先を替えた → ' + r12.知らせ);

  /* ---------- ⑫b リストを覚えているとき、別の子で当たったら、次はそこを先に見る（覚え直さない） ---------- */
  const r12b = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', {}, {});
    const ka = __mkdir('会社A', { 'Z172A13.json': __caseJson('Z172A13', { amplifier:'amp_2u43' }) }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list, '会社A': ka });
    await saveDirSet(list, root);
    M = freshModel(); M.chosho_mgmt_no = 'Z172A13'; M._viewOnly = true;
    const got1 = await __T(pcGuardAutoLoad());
    const 当たり = _caseDirHit && _caseDirHit.name;
    M = freshModel(); M.chosho_mgmt_no = 'Z172A13'; M._viewOnly = true;
    const got2 = await __T(pcGuardAutoLoad());
    return { got1: got1, 当たり: 当たり, got2: got2, 増幅器: M.amplifier, 覚え: _saveDir && _saveDir.name };
  });
  console.log('⑫b別の子で当たる', JSON.stringify(r12b));
  ok(r12b.got1 === true && r12b.当たり === '会社A', '試験の前提: 会社A で当たっていない → ' + JSON.stringify(r12b));
  ok(r12b.got2 === true && r12b.増幅器 === 'amp_2u43',
     '★2回目に、前に当たったフォルダを見ずに見つけられない → ' + JSON.stringify(r12b));
  ok(r12b.覚え === 'リスト', '★リストを覚えているのに、読んだだけの別のフォルダを保存先にした → ' + r12b.覚え);

  /* ---------- ⑬ 📥 他の端末の保存：リスト{A.json}＋ルート{B.json, 現場用…} → A と B の両方 ---------- */
  const r13 = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', { 'Z172B01.json': __caseJson('Z172B01') }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172B02.json.txt': __caseJson('Z172B02') }, { 'リスト': list });
    _saveDir = root;
    const got = await __T(flowShareDirFiles());
    return { names: (Array.isArray(got) ? got : []).map(x => x.name).sort(), 覚え: _saveDir && _saveDir.name };
  });
  console.log('⑬他の端末の保存', JSON.stringify(r13));
  ok(r13.覚え === 'リスト', '試験の前提: リストへ寄せていない → ' + r13.覚え);
  ok(r13.names.indexOf('Z172B01.json') >= 0, '★リストのファイルを読んでいない → ' + JSON.stringify(r13.names));
  ok(r13.names.indexOf('Z172B02.json.txt') >= 0,
     '★物件のすぐ下に入れられたファイル（スマホの前の案内どおり）を取りこぼした → ' + JSON.stringify(r13.names));

  /* ---------- ⑮ 保存のあとの案内の文 ---------- */
  const r15 = await page.evaluate(() => {
    __noDir();
    saveHintSet('テスト物件/リスト');
    const a = saveHintLine(), w = saveShareWhere(), lb = saveHintLabel();
    saveHintSet('リスト');
    const c = saveHintLine();
    saveHintSet('');
    const d = saveHintLine(), w0 = saveShareWhere();
    return { a: a, w: w, lb: lb, c: c, d: d, w0: w0 };
  });
  console.log('⑮案内の文', JSON.stringify(r15));
  ok(/「テスト物件」フォルダの中の「リスト」/.test(r15.a), '★入れる場所を「物件の中のリスト」と言っていない → ' + r15.a);
  ok(/すぐ下には入れません/.test(r15.a), '★物件のすぐ下には入れない、と言っていない → ' + r15.a);
  ok(!/PCが読み込めません/.test(r15.a + r15.c), '★正しくない「PCが読み込めません」が残っている');
  ok(/★入れる場所/.test(r15.a) && /「リスト」フォルダ/.test(r15.c), '★名前1つのときの案内が出ない → ' + r15.c);
  ok(r15.d === '', '★名前を覚えていないのに案内が出る → ' + r15.d);
  ok(r15.lb === 'テスト物件 ＞ リスト', '★名前の見せ方が「物件 ＞ リスト」でない → ' + r15.lb);
  ok(/下の★/.test(r15.w) && !/下の★/.test(r15.w0), '★共有の知らせが、覚えている場所を指していない → ' + r15.w + ' / ' + r15.w0);

  /* ---------- ⑯ 特別記録を共有で渡したときも、入れる場所を言う ---------- */
  const r16 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    saveHintSet('テスト物件/リスト');
    const ossp = window.showSaveFilePicker, ocs = navigator.canShare, osh = navigator.share;
    let shared = 0;
    try{
      window.showSaveFilePicker = undefined;
      navigator.canShare = () => true;
      navigator.share = async () => { shared++; };
      const rec = spBlank(); rec.id = spNewId(); rec.key = spKey(rec.id);
      rec.title = '資材'; rec.photos = [ __ph('s2', '#369') ];
      const r = await __T(spSaveFile(rec), 8000);
      return { shared: shared, title: (r && r.title) || '', msg: (r && r.msg) || '' };
    } finally {
      window.showSaveFilePicker = ossp; navigator.canShare = ocs; navigator.share = osh;
    }
  });
  console.log('⑯特別記録の共有', JSON.stringify(r16));
  ok(r16.shared === 1 && /共有/.test(r16.title), '試験の前提: 共有の道を通っていない → ' + JSON.stringify(r16));
  ok(/★入れる場所：「テスト物件」フォルダの中の「リスト」/.test(r16.msg),
     '★特別記録を共有で渡したとき、入れる場所を言っていない → ' + r16.msg);
  ok(/下の★のフォルダなら/.test(r16.msg), '★共有の知らせが、覚えている場所を指していない → ' + r16.msg);

  /* ---------- ⑰ 受付台帳を取り込むと、入れる場所が「物件名/リスト」に自動で決まる ---------- */
  const r17 = await page.evaluate(async () => {
    __noDir();
    const imp = proj => receptionSaveRows({ type:'antenna_reception_ledger', version:5,
      rows: [{ mgmt_no:'2621HIN101', name:'台帳の 太郎', addr:'青森県三沢市1-1', date:'2026-09-20' }],
      project: proj, exportedAt:'2026-09-17T00:00:00.000Z', appVersion:'172' });
    const set = (hint, auto) => {
      try{ localStorage.setItem(LS_SAVEHINT, hint); localStorage.setItem(LS_SAVEHINT_AUTO, auto); }catch(_){}
    };
    const o = {};
    /* PC（フォルダを選ぶ窓がある端末）では決めない＝「未設定 選ぶ」を消さない */
    imp('前の物件');
    set('', ''); imp('テスト物件'); o.PC = saveHintName();
    renderSaveBar();
    o.PC帯 = (document.getElementById('sb-dest') || {}).textContent || '';
    set('手で/リスト', ''); o.PC知らせ = await __impFile('PC物件');
    // ここからはスマホ（フォルダを掴めない端末）
    __noPicker();
    try{
    imp('前の物件');
    set('', ''); imp('テスト物件'); o.空から = saveHintName();
    o.帯 = (document.getElementById('sb-dest') || {}).textContent || '';
    set('テスト物件', ''); imp('テスト物件'); o.前の版の既定 = saveHintName();
    set('ABC', ''); imp('テスト物件'); o.自分で選んだ = saveHintName();
    set('', '\u0000off'); imp('テスト物件'); o.覚えない = saveHintName();
    set('', ''); imp('テスト物件'); imp('物件B'); o.物件が変わる = saveHintName();
    // 取り込みの知らせにも1行（フォルダを掴めない端末）
    set('', ''); imp('前の物件');
    o.知らせ = await __impFile('取込物件');
    o.取込後 = saveHintName();
    /* 保存バーの📁から「覚えない」を押す → 次に取り込んでも、入れる場所を決め直さない */
    set('', ''); imp('テスト物件');
    o.UI_前 = saveHintName();
    await __pickHint('覚えない');
    o.UI_覚えない = saveHintName();
    o.UI_印 = (localStorage.getItem(LS_SAVEHINT_AUTO) === '\u0000off');
    imp('テスト物件'); o.UI_同じ物件 = saveHintName();
    imp('物件C'); o.UI_別の物件 = saveHintName();
    /* 自動の候補（物件 ＞ リスト）を押したら、物件が変わったとき追いかける */
    set('ABC', ''); imp('テスト物件');
    await __pickHint('テスト物件 ＞ リスト');
    o.UI_候補 = saveHintName();
    imp('物件C'); o.UI_候補の後 = saveHintName();
    /* 自分で書いた名前は追いかけない */
    await __pickHint('自分で書く', 'XYZ/リスト');
    o.UI_手書き = saveHintName();
    imp('物件D'); o.UI_手書きの後 = saveHintName();
    /* 前の版の履歴に残った「物件名だけ」は、候補に出さない（押すだけで物件のすぐ下を覚える元） */
    imp('テスト物件');
    saveHintRemember('テスト物件'); set('テスト物件', '');
    o.UI_候補1 = await __pickHint('\u0000none');
    set('', '');
    o.UI_候補2 = await __pickHint('\u0000none');
    /* 前の版で「覚えない」を押した端末：印はまだ無く、名前のキーだけが空で残っている */
    try{ localStorage.removeItem(LS_SAVEHINT_AUTO); localStorage.setItem(LS_SAVEHINT, ''); }catch(_){}
    imp('テスト物件'); o.旧覚えない = saveHintName();
    o.旧覚えない印 = (localStorage.getItem(LS_SAVEHINT_AUTO) === '\u0000off');
    imp('物件E'); o.旧覚えない2 = saveHintName();
    /* まっさらな端末（名前のキーも無い）は、今までどおり決める */
    try{ localStorage.removeItem(LS_SAVEHINT_AUTO); localStorage.removeItem(LS_SAVEHINT); }catch(_){}
    imp('テスト物件'); o.まっさら = saveHintName();
    } finally { __pickerBack(); }
    return o;
  });
  console.log('⑰受付台帳を取り込む', JSON.stringify(r17));
  ok(r17.PC === '', '★フォルダを選べる端末（PC）でも、名前だけの入れる場所を決めた → ' + r17.PC);
  ok(/未設定/.test(r17.PC帯), '★PC で受付台帳を取り込むと、保存バーの「未設定 選ぶ」が消える → ' + r17.PC帯);
  ok(/受付台帳/.test(r17.PC知らせ), '試験の前提: PC で取り込みの知らせが出ていない → ' + r17.PC知らせ);
  ok(!/入れる場所/.test(r17.PC知らせ),
     '★PC（フォルダを選べる端末）の取り込みの知らせに、名前だけの入れる場所を出した → ' + r17.PC知らせ);
  ok(r17.UI_前 === 'テスト物件/リスト', '試験の前提: 取り込みで入れる場所が決まっていない → ' + r17.UI_前);
  ok(r17.UI_覚えない === '' && r17.UI_印 === true,
     '★保存バーの📁で「覚えない」を選んでも、その印を残していない → ' + JSON.stringify([r17.UI_覚えない, r17.UI_印]));
  ok(r17.UI_同じ物件 === '' && r17.UI_別の物件 === '',
     '★「覚えない」を選んだのに、次の取り込みで入れる場所が黙って戻った → ' + r17.UI_同じ物件 + ' / ' + r17.UI_別の物件);
  ok(r17.UI_候補 === 'テスト物件/リスト' && r17.UI_候補の後 === '物件C/リスト',
     '★自動の候補（物件 ＞ リスト）を選んだのに、物件が変わっても追いかけない → ' + r17.UI_候補 + ' → ' + r17.UI_候補の後);
  ok(r17.UI_手書き === 'XYZ/リスト', '試験の前提: 自分で書いた名前が覚えられていない → ' + r17.UI_手書き);
  ok(r17.UI_手書きの後 === 'XYZ/リスト', '★自分で書いた名前を、取り込みで書き替えた → ' + r17.UI_手書きの後);
  ok(Array.isArray(r17.UI_候補1) && r17.UI_候補1.indexOf('テスト物件 ＞ リスト') >= 0,
     '試験の前提: 候補の窓が出ていない → ' + JSON.stringify(r17.UI_候補1));
  ok(r17.UI_候補1.indexOf('テスト物件') < 0 && r17.UI_候補2.indexOf('テスト物件') < 0,
     '★前の版で覚えた「物件名だけ」（物件のすぐ下）が候補に出ている → ' + JSON.stringify([r17.UI_候補1, r17.UI_候補2]));
  ok(r17.旧覚えない === '' && r17.旧覚えない2 === '' && r17.旧覚えない印 === true,
     '★前の版で「覚えない」を選んだ端末で、取り込むと入れる場所を決め直した → ' + JSON.stringify([r17.旧覚えない, r17.旧覚えない2, r17.旧覚えない印]));
  ok(r17.まっさら === 'テスト物件/リスト', '★まっさらな端末で、取り込んでも入れる場所が決まらない → ' + r17.まっさら);
  ok(r17.空から === 'テスト物件/リスト', '★受付台帳を取り込んでも、入れる場所が決まらない → ' + r17.空から);
  ok(/テスト物件/.test(r17.帯) && /＞ リスト/.test(r17.帯), '★保存バーに「物件 ＞ リスト」が出ていない → ' + r17.帯);
  ok(r17.前の版の既定 === 'テスト物件/リスト', '★前の版の既定（物件名だけ＝すぐ下）が直らない → ' + r17.前の版の既定);
  ok(r17.自分で選んだ === 'ABC', '★自分で選んだ名前を書き替えた → ' + r17.自分で選んだ);
  ok(r17.覚えない === '', '★「覚えない」を選んだのに、入れる場所を決めた → ' + r17.覚えない);
  ok(r17.物件が変わる === '物件B/リスト', '★物件が変わっても、自動で決めた名前が追いかけない → ' + r17.物件が変わる);
  ok(r17.取込後 === '取込物件/リスト', '★ファイルから取り込んでも入れる場所が決まらない → ' + r17.取込後);
  ok(/入れる場所：「取込物件」フォルダの中の「リスト」/.test(r17.知らせ),
     '★取り込みの知らせに、入れる場所が出ていない → ' + r17.知らせ);

  /* ---------- ⑱ 保存中の暗幕に「入れる所」 ---------- */
  const r18 = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件', {}, { 'リスト': list });
    await saveDirSet(list, root);
    saveOverlayShow('Z172.json');
    const pc = (document.getElementById('save-ov') || {}).textContent || '';
    saveOverlayHide();
    __noDir();
    saveHintSet('テスト物件/リスト');
    saveOverlayShow('Z172.json');
    const sp = (document.getElementById('save-ov') || {}).textContent || '';
    saveOverlayHide();
    saveHintSet('');
    saveOverlayShow('Z172.json');
    const none = (document.getElementById('save-ov') || {}).textContent || '';
    saveOverlayHide();
    return { pc: pc, sp: sp, none: none };
  });
  console.log('⑱暗幕', JSON.stringify(r18));
  ok(/入れる所：物件 ＞ リスト/.test(r18.pc), '★暗幕に入れる所（PC）が出ていない → ' + r18.pc);
  ok(/入れる所：テスト物件 ＞ リスト/.test(r18.sp), '★暗幕に入れる所（スマホ）が出ていない → ' + r18.sp);
  ok(!/入れる所/.test(r18.none), '★入れる所が分からないのに出している → ' + r18.none);

  /* ---------- ⑲ 工事フォルダ（物件の上）を覚えている端末：別の物件のリストへ移って上書きしない ----------
     工事/{物件A/{迷子の Z172Q01, リスト/Z172Q01}, 物件B/リスト/Z172Q01}。物件B の Z172Q01 を開いても、
     物件A のすぐ下の迷子を読まない・保存先を物件A のリストへ覚え直さない・物件A のリストへ書かない。 */
  const r19 = await page.evaluate(async () => {
    const mk = () => {
      const listA = __mkdir('リスト', { 'Z172Q02.json': __caseJson('Z172Q02') }, {});
      const bukA = __mkdir('物件A', { '現場用_物件A.json':'{"type":"antenna_genba_set"}', 'Z172Q01.json': __caseJson('Z172Q01') },
        { 'リスト': listA });
      const listB = __mkdir('リスト', {}, {});
      const bukB = __mkdir('物件B', { 'Z172Q09.json': __caseJson('Z172Q09', { amplifier:'amp_2u43' }) }, { 'リスト': listB });
      const koji = __mkdir('工事', {}, { '物件A': bukA, '物件B': bukB });
      return { listA, bukA, listB, bukB, koji };
    };
    const o = {};
    __noDir(); await __clearDrafts();
    const aTxt = __caseJson('Z172Q01', { amplifier:'amp_3u43', chosho_note:'物件Aのリスト' });
    const listA = __mkdir('リスト', { 'Z172Q01.json': aTxt }, {});
    const bukA = __mkdir('物件A', { 'Z172Q01.json': __caseJson('Z172Q01', { amplifier:'amp_NG' }) }, { 'リスト': listA });
    const bTxt = __caseJson('Z172Q01', { amplifier:'amp_2u43', chosho_note:'物件Bのリスト' });
    const listB = __mkdir('リスト', { 'Z172Q01.json': bTxt }, {});
    const bukB = __mkdir('物件B', {}, { 'リスト': listB });
    const koji = __mkdir('工事', {}, { '物件A': bukA, '物件B': bukB });
    _saveDir = koji;                               // 工事を覚えている（親なし・直下0件・台帳なし）
    M = freshModel(); M.chosho_mgmt_no = 'Z172Q01'; M._viewOnly = true;
    __toasts.length = 0;
    o.got = await __T(pcGuardAutoLoad());
    o.増幅器 = M.amplifier;
    o.覚え = _saveDir && _saveDir.name; o.親 = !!saveDirParentOf(_saveDir);
    o.知らせ = __toasts.join(' / ');
    __mine('Z172Q01'); M.chosho_note = '物件Bの現場';
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    o.title = (_lastSaveInfo && _lastSaveInfo.title) || '';
    o.リストAそのまま = listA.__files['Z172Q01.json'] === aTxt && listA.__wrote.length === 0;
    o.物件Aに書いた = bukA.__wrote.length;
    o.リストBそのまま = listB.__files['Z172Q01.json'] === bTxt;
    // 受付台帳だけがある子（中に「リスト」は無い）も「物件」らしいので読まない
    __noDir(); await __clearDrafts();
    const bukC = __mkdir('物件C', { '受付台帳_物件C.json':'{}', 'Z172Q05.json': __caseJson('Z172Q05', { amplifier:'amp_NG' }) }, {});
    _saveDir = __mkdir('工事', {}, { '物件C': bukC });
    M = freshModel(); M.chosho_mgmt_no = 'Z172Q05'; M._viewOnly = true;
    o.c台帳_got = await __T(pcGuardAutoLoad());
    o.c台帳_増幅器 = M.amplifier;

    /* ⑲b 保存バーの📁で工事を選び「物件C の方に入れますか」に「はい」→ 物件C（親＝工事）を覚える。
       親が工事（物件と確かめられない）なので、兄弟の物件D の戸別は読まない */
    const odp = window.showDirectoryPicker;
    try{
      __noDir(); await __clearDrafts();
      const bC = __mkdir('物件C', { 'Z172Q11.json': __caseJson('Z172Q11'), 'Z172Q12.json': __caseJson('Z172Q12') }, {});
      const bD = __mkdir('物件D', { 'Z172Q19.json': __caseJson('Z172Q19', { amplifier:'amp_2u43' }) }, {});
      const koji2 = __mkdir('工事', {}, { '物件C': bC, '物件D': bD });
      window.showDirectoryPicker = async () => koji2;
      __said.length = 0;
      await __T(saveDirChange(), 6000);
      o.b_覚え = _saveDir && _saveDir.name; o.b_親が工事 = __same(saveDirParentOf(_saveDir), koji2);
      M = freshModel(); M.chosho_mgmt_no = 'Z172Q19'; M._viewOnly = true;
      o.b_got = await __T(pcGuardAutoLoad());
      o.b_増幅器 = M.amplifier;

      /* ⑲c 保存バーの📁で工事を選び、「物件A の方に入れますか」に「はい」→ 物件A の中のリストまで降りる */
      __noDir();
      const t3 = mk();
      window.showDirectoryPicker = async () => t3.koji;
      __said.length = 0;
      await __T(saveDirChange(), 6000);
      o.c_窓 = __said.filter(s => /の方に入れますか/.test(s)).length;
      o.c_覚えがリストA = __same(_saveDir, t3.listA); o.c_親が物件A = __same(saveDirParentOf(_saveDir), t3.bukA);
      o.c_場所 = saveDirPlace();

      /* ⑲d 同じく「はい」でも、物件Aの中のリストへ書く許可が（聞き直さずには）取れない
         → 物件Aのすぐ下を覚えない（選んだ工事のまま）・許可を聞き直さない */
      __noDir();
      const t4 = mk();
      t4.listA.__perm = 'prompt';
      window.showDirectoryPicker = async () => t4.koji;
      __said.length = 0;
      await __T(saveDirChange(), 6000);
      o.d_覚え = _saveDir && _saveDir.name; o.d_親 = !!saveDirParentOf(_saveDir);
      o.d_聞いた = t4.listA.__asked;
    } finally { window.showDirectoryPicker = odp; }
    __noDir();
    return o;
  });
  console.log('⑲工事フォルダを覚えている', JSON.stringify(r19));
  ok(r19.増幅器 !== 'amp_NG', '★工事フォルダの下の、別の物件（物件A）のすぐ下の迷子を読んだ → ' + r19.増幅器);
  ok(r19.覚え === '工事' && r19.親 === false && !/そろえました/.test(r19.知らせ),
     '★読んだ所に合わせて、保存先を別の物件のリストへ覚え直した → ' + r19.覚え + ' / ' + r19.知らせ);
  ok(r19.title === '保存しました', '試験の前提: 保存できていない → ' + r19.title);
  ok(r19.リストAそのまま === true && r19.物件Aに書いた === 0,
     '★物件B の戸別を、別の物件（物件A）のリストへ書いた（上書きした）→ ' + JSON.stringify(r19));
  ok(r19.リストBそのまま === true, '★物件B のリストを書き替えた → ' + JSON.stringify(r19));
  ok(r19.c台帳_増幅器 !== 'amp_NG', '★受付台帳のある子（物件）のすぐ下の戸別を読んだ → ' + r19.c台帳_増幅器);
  ok(r19.b_覚え === '物件C' && r19.b_親が工事 === true,
     '試験の前提: 「はい」と答えて物件C（親＝工事）を覚えていない → ' + JSON.stringify(r19));
  ok(r19.b_got === false && r19.b_増幅器 !== 'amp_2u43',
     '★親が工事フォルダ（物件と確かめられない）なのに、兄弟の別の物件（物件D）の戸別を読んだ → ' + JSON.stringify(r19));
  ok(r19.c_窓 === 1, '試験の前提: 工事フォルダを選んだとき、中へ入るか聞いていない → ' + r19.c_窓);
  ok(r19.c_覚えがリストA === true && r19.c_親が物件A === true,
     '★「はい」と答えたら、物件Aのすぐ下（ルート）を覚えた（中のリストまで降りていない）→ ' + r19.c_場所);
  ok(r19.d_覚え === '工事' && r19.d_親 === false,
     '★中のリストへ入れないのに、物件Aのすぐ下（または書けないリスト）を覚えた → ' + r19.d_覚え);
  ok(r19.d_聞いた === 0, '★中のリストへ降りるときに許可を聞き直した → ' + r19.d_聞いた);

  /* ---------- ⑳ 「リスト」を直接覚えている端末で、中の「完了」で当たっても、保存先を替えない ---------- */
  const r20 = await page.evaluate(async () => {
    const o = {};
    // ⑳a 名前が「リスト」（直下は空）
    __noDir(); await __clearDrafts();
    const kanA = __mkdir('完了', { 'Z172R01.json': __caseJson('Z172R01') }, {});
    const list = __mkdir('リスト', {}, { '完了': kanA });
    await saveDirAdopt(list, { ask:false });
    o.a_前提 = __same(_saveDir, list);
    M = freshModel(); M.chosho_mgmt_no = 'Z172R01'; M._viewOnly = true;
    o.a_got = await __T(pcGuardAutoLoad());
    o.a_覚え = _saveDir && _saveDir.name;
    __mine('Z172R02');
    await __T(saveJsonRun(), 8000);
    o.a_完了 = Object.keys(kanA.__files).sort(); o.a_リスト = Object.keys(list.__files).sort();
    // ⑳b 名前は違うが、直下に戸別がある
    __noDir(); await __clearDrafts();
    const kanB = __mkdir('完了', { 'Z172R11.json': __caseJson('Z172R11') }, {});
    const kobetsu = __mkdir('戸別一覧', { 'Z172R12.json': __caseJson('Z172R12') }, { '完了': kanB });
    await saveDirAdopt(kobetsu, { ask:false });
    o.b_前提 = __same(_saveDir, kobetsu);
    M = freshModel(); M.chosho_mgmt_no = 'Z172R11'; M._viewOnly = true;
    o.b_got = await __T(pcGuardAutoLoad());
    o.b_覚え = _saveDir && _saveDir.name;
    __mine('Z172R12');
    await __T(saveJsonRun(), 8000);
    o.b_完了 = Object.keys(kanB.__files).sort(); o.b_書いた = kobetsu.__wrote.slice();
    __noDir();
    return o;
  });
  console.log('⑳リストの中の子フォルダで当たる', JSON.stringify(r20));
  ok(r20.a_前提 === true && r20.a_got === true, '試験の前提: 「リスト」を覚えて「完了」の戸別を読めていない → ' + JSON.stringify(r20));
  ok(r20.a_覚え === 'リスト', '★「リスト」を覚えていたのに、中の「完了」で当たったら保存先がそこへ替わった → ' + r20.a_覚え);
  ok(r20.a_完了.indexOf('Z172R02.json') < 0 && r20.a_リスト.indexOf('Z172R02.json') >= 0,
     '★別の戸別の保存が「完了」へ入った（戸別が2か所にできていく）→ ' + JSON.stringify(r20));
  ok(r20.b_前提 === true && r20.b_got === true, '試験の前提: 「戸別一覧」を覚えて「完了」の戸別を読めていない → ' + JSON.stringify(r20));
  ok(r20.b_覚え === '戸別一覧', '★直下に戸別があるフォルダを覚えていたのに、中の「完了」へ替わった → ' + r20.b_覚え);
  ok(r20.b_完了.indexOf('Z172R12.json') < 0 && r20.b_書いた.indexOf('Z172R12.json') >= 0,
     '★直下にある戸別の保存が「完了」へ入った（同じ戸別が2か所にできる）→ ' + JSON.stringify(r20));

  /* ---------- ⑳c 台帳ファイルが「リスト」の中にある／「完了」などの子は保存先の候補にしない ---------- */
  const r20c = await page.evaluate(async () => {
    const o = {};
    const mkList = () => {
      const kan = __mkdir('完了', { 'Z172V04.json': __caseJson('Z172V04') }, {});
      const list = __mkdir('リスト', { '現場用_物件A.json':'{}', 'Z172V01.json': __caseJson('Z172V01'),
        'Z172V02.json': __caseJson('Z172V02'), 'Z172V03.json': __caseJson('Z172V03') }, { '完了': kan });
      return { kan, list };
    };
    const odp = window.showDirectoryPicker;
    try{
      // a 保存バーの📁で「リスト」を選ぶ → そのまま「リスト」（中の「完了」へ移らない）
      __noDir(); await __clearDrafts();
      const a = mkList();
      window.showDirectoryPicker = async () => a.list;
      __said.length = 0;
      await __T(saveDirChange(), 6000);
      o.a_覚え = _saveDir && _saveDir.name; o.a_窓 = __said.length;
    } finally { window.showDirectoryPicker = odp; }
    // b 前の版で「リスト」を直接覚えている → 保存しても「完了」へ寄せない
    __noDir(); await __clearDrafts();
    const b = mkList();
    _saveDir = b.list;
    __mine('Z172V05');
    await __T(saveJsonRun(), 8000);
    o.b_覚え = _saveDir && _saveDir.name;
    o.b_リスト = Object.keys(b.list.__files).indexOf('Z172V05.json') >= 0;
    o.b_完了 = Object.keys(b.kan.__files).indexOf('Z172V05.json') >= 0;
    // e 前の版で「リスト」を直接覚えていて、中に台帳と別の子（会社A）がある → 会社A へ黙って寄せない
    __noDir(); await __clearDrafts();
    const ka = __mkdir('会社A', { 'Z172V11.json': __caseJson('Z172V11') }, {});
    const le = __mkdir('リスト', { '現場用_物件A.json': __ledger(['Z172V11', 'Z172V12']) }, { '会社A': ka });
    _saveDir = le;
    __mine('Z172V12');
    await __T(saveJsonRun(), 8000);
    o.e_覚え = _saveDir && _saveDir.name;
    o.e_リスト = Object.keys(le.__files).indexOf('Z172V12.json') >= 0;
    o.e_会社A = Object.keys(ka.__files).indexOf('Z172V12.json') >= 0;
    // c 物件/{現場用, 完了/{X1,X2}} → 「完了」は候補にしない
    __noDir();
    const pc = __mkdir('物件', { '現場用_物件.json': __ledger(['X1']) }, { '完了': __mkdir('完了', { 'X1.json':'{}', 'X2.json':'{}' }, {}) });
    const gc = await saveDirAdopt(pc, { ask:false });
    o.c = gc && gc.name;
    // d 物件/{現場用, 直下に戸別1件, 戸別/{X1}} → 台帳が横にあっても、直下に戸別があれば聞かずには入らない
    __noDir();
    const pd = __mkdir('物件', { '現場用_物件.json': __ledger(['X1']), 'A1.json':'{}' }, { '戸別': __mkdir('戸別', { 'X1.json':'{}' }, {}) });
    const gd = await saveDirAdopt(pd, { ask:false });
    o.d = gd && gd.name;
    __noDir();
    return o;
  });
  console.log('⑳c台帳がリストの中', JSON.stringify(r20c));
  ok(r20c.a_覚え === 'リスト' && r20c.a_窓 === 0,
     '★「リスト」を選んだのに、中の「完了」などへ保存先が移った（または聞いた）→ ' + JSON.stringify(r20c));
  ok(r20c.b_覚え === 'リスト' && r20c.b_リスト === true && r20c.b_完了 === false,
     '★前の版で覚えた「リスト」から、中の「完了」へ黙って寄せた → ' + JSON.stringify(r20c));
  ok(r20c.e_覚え === 'リスト' && r20c.e_リスト === true && r20c.e_会社A === false,
     '★「リスト」を覚えていたのに、中の子（会社A）へ黙って寄せた → ' + JSON.stringify(r20c));
  ok(r20c.c === '物件', '★「完了」を保存先にした → ' + r20c.c);
  ok(r20c.d === '物件', '★直下に戸別があるのに、受付台帳だけを手がかりに聞かずに中へ入った → ' + r20c.d);

  /* ---------- ㉑ まとめて保存でも、ルートの写しを和集合に入れ、控えを古い扱いにする（③b・④ と同じ場面） ---------- */
  const r21 = await page.evaluate(async () => {
    const o = {};
    const odp = window.showDirectoryPicker;
    try{
      // ㉑a（③b）控えがルートの写しから取られていて、リストの方が古い値
      __noDir(); await __clearDrafts();
      const rootTxt = __caseJson('Z172S01', { amplifier:'amp_2u43', chosho_photos:[ __ph('pa', '#c33') ],
        editedAt:'2026-09-15T00:00:00.000Z' });
      const root = __mkdir('物件', { 'Z172S01.json': rootTxt }, {});
      _saveDir = root;
      M = freshModel(); M.chosho_mgmt_no = 'Z172S01'; M._viewOnly = true;
      o.a_got = await __T(pcGuardAutoLoad());
      o.a_控え = (M._fileBase && M._fileBase.state && M._fileBase.state.amplifier) || '';
      const list = __mkdir('リスト', { 'Z172S01.json': __caseJson('Z172S01', { amplifier:'amp_3u43',
        chosho_photos:[ __ph('pa', '#c33') ], editedAt:'2026-09-01T00:00:00.000Z' }) }, {});
      root.__subs['リスト'] = list;
      M.chosho_note = '現場で直した'; M._touched = true;
      await persistDraft();
      window.showDirectoryPicker = async () => root;
      __said.length = 0;
      await __T(saveAllDrafts(), 10000);
      const j = __read(list, 'Z172S01.json');
      o.a_覚え = _saveDir && _saveDir.name;
      o.a_増幅器 = j && j.amplifier; o.a_備考 = j && j.chosho_note;
      o.a_ルートそのまま = root.__files['Z172S01.json'] === rootTxt; o.a_ルートに書いた = root.__wrote.length;
      // ㉑b（④）ルートにだけある写し{写真2枚・PCの備考}
      __noDir(); await __clearDrafts();
      const rootTxt2 = __caseJson('Z172S02', { chosho_note:'PCだけの備考',
        chosho_photos:[ __ph('q1', '#c33'), __ph('q2', '#3a6') ] });
      const list2 = __mkdir('リスト', {}, {});
      const root2 = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172S02.json': rootTxt2 }, { 'リスト': list2 });
      __mine('Z172S02'); M.chosho_note = '';
      await persistDraft();
      window.showDirectoryPicker = async () => root2;
      __said.length = 0;
      await __T(saveAllDrafts(), 10000);
      const j2 = __read(list2, 'Z172S02.json');
      o.b_覚え = _saveDir && _saveDir.name;
      o.b_写真 = __pids(j2); o.b_備考 = j2 && j2.chosho_note;
      o.b_ルートそのまま = root2.__files['Z172S02.json'] === rootTxt2; o.b_ルートに書いた = root2.__wrote.length;
    } finally { window.showDirectoryPicker = odp; }
    __noDir();
    return o;
  });
  console.log('㉑まとめて保存とルートの写し', JSON.stringify(r21));
  ok(r21.a_got === true && r21.a_控え === 'amp_2u43' && r21.a_覚え === 'リスト',
     '試験の前提: ルートの写しから控えを取って、まとめて保存でリストを選べていない → ' + JSON.stringify(r21));
  ok(r21.a_備考 === '現場で直した', '試験の前提: まとめて保存がリストに入っていない → ' + r21.a_備考);
  ok(r21.a_増幅器 === 'amp_2u43',
     '★まとめて保存で、現場で選んだ増幅器がリストの古い値に黙って戻された（控えで読み違えている）→ ' + r21.a_増幅器);
  ok(r21.a_ルートそのまま === true && r21.a_ルートに書いた === 0, '★まとめて保存でルートの写しを書き替えた');
  ok(r21.b_覚え === 'リスト', '試験の前提: まとめて保存でリストを選べていない → ' + r21.b_覚え);
  ok(r21.b_写真 === 'q1,q2', '★まとめて保存で、ルートにだけある写しの写真がリストへ入っていない → ' + r21.b_写真);
  ok(r21.b_備考 === 'PCだけの備考', '★まとめて保存で、ルートの写しにしか無い中身（備考）が消えた → ' + r21.b_備考);
  ok(r21.b_ルートそのまま === true && r21.b_ルートに書いた === 0, '★まとめて保存でルートの写しを書き替えた');

  /* ---------- ㉒ 上（物件）・中（リスト）のフォルダの許可は聞き直さない。取れなければ読み合わせに入れない ---------- */
  const r22 = await page.evaluate(async () => {
    const o = {};
    // ㉒a 物件の許可が切れている → ルートの写しは読まずにリストへ書く（止まらない・聞かない）
    __noDir(); await __clearDrafts();
    const list = __mkdir('リスト', { 'Z172U01.json': __caseJson('Z172U01', { chosho_photos:[ __ph('pa', '#c33') ] }) }, {});
    const rootTxt = __caseJson('Z172U01', { chosho_photos:[ __ph('pa', '#c33'), __ph('pb', '#36c') ],
      editedAt:'2026-09-15T00:00:00.000Z' });
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172U01.json': rootTxt }, { 'リスト': list });
    await saveDirSet(list, root);
    root.__perm = 'prompt';
    M = freshModel(); M.chosho_mgmt_no = 'Z172U01'; M._viewOnly = true;
    o.a_got = await __T(pcGuardAutoLoad());
    M.chosho_note = '現場で直した'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j = __read(list, 'Z172U01.json');
    o.a_title = (_lastSaveInfo && _lastSaveInfo.title) || ''; o.a_msg = (_lastSaveInfo && _lastSaveInfo.msg) || '';
    o.a_備考 = j && j.chosho_note; o.a_写真 = __pids(j);
    o.a_聞いた = root.__asked + list.__asked; o.a_ルートに書いた = root.__wrote.length;
    // ㉒b 前の版で物件を覚えたまま、中の「リスト」の許可が（聞き直さずには）取れない → 寄せない・聞かない
    __noDir(); await __clearDrafts();
    const list2 = __mkdir('リスト', {}, {}); list2.__perm = 'prompt';
    const root2 = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list2 });
    _saveDir = root2;
    __mine('Z172U02');
    await __T(saveJsonRun(), 8000);
    o.b_title = (_lastSaveInfo && _lastSaveInfo.title) || '';
    o.b_聞いた = list2.__asked + root2.__asked; o.b_覚え = _saveDir && _saveDir.name;
    // ㉒c 📥：物件の許可が切れている → 物件のすぐ下は読まない・聞かない
    __noDir();
    const list3 = __mkdir('リスト', { 'Z172U03.json': __caseJson('Z172U03') }, {});
    const root3 = __mkdir('物件', { 'Z172U04.json.txt': __caseJson('Z172U04') }, { 'リスト': list3 });
    await saveDirSet(list3, root3);
    root3.__perm = 'prompt';
    const got = await __T(flowShareDirFiles());
    o.c_names = (Array.isArray(got) ? got : []).map(x => x.name).sort();
    o.c_聞いた = root3.__asked + list3.__asked;
    __noDir();
    return o;
  });
  console.log('㉒許可を聞き直さない', JSON.stringify(r22));
  ok(r22.a_got === true && r22.a_title === '保存しました' && r22.a_備考 === '現場で直した',
     '★物件の許可が切れていると、リストへの保存が止まる → ' + JSON.stringify(r22));
  ok(r22.a_写真 === 'pa', '★許可の無い物件のすぐ下の写しを読んだ（聞き直して読んだ）→ ' + r22.a_写真);
  ok(!/すぐ下にも/.test(r22.a_msg), '★読んでいないのに「すぐ下にも」と知らせた → ' + r22.a_msg);
  ok(r22.a_聞いた === 0, '★保存のとき、物件のフォルダの許可を聞き直した（押した操作を使ってしまう）→ ' + r22.a_聞いた);
  ok(r22.a_ルートに書いた === 0, '★物件のすぐ下に書いた');
  ok(r22.b_title === '保存しました', '試験の前提: 保存できていない → ' + r22.b_title);
  ok(r22.b_聞いた === 0, '★リストへ寄せるときに許可を聞き直した（押した操作を使ってしまう）→ ' + r22.b_聞いた);
  ok(r22.b_覚え === '物件', '★許可が取れないのに、中の「リスト」へ寄せた → ' + r22.b_覚え);
  ok(r22.c_names.indexOf('Z172U03.json') >= 0, '試験の前提: 📥 でリストのファイルを読めていない → ' + JSON.stringify(r22.c_names));
  ok(r22.c_names.indexOf('Z172U04.json.txt') < 0 && r22.c_聞いた === 0,
     '★📥 で、許可の無い物件のフォルダを聞き直して読んだ → ' + JSON.stringify(r22));

  /* ---------- ㉓ ルートに写しが残ったまま、PC がリストを直す → 2回目の保存で確かめの窓0回・PCの直しが残る ---------- */
  const r23 = await page.evaluate(async () => {
    __noDir(); await __clearDrafts();
    const txt = __caseJson('Z172W01', { chosho_photos:[ __ph('pa', '#c33') ] });
    const list = __mkdir('リスト', { 'Z172W01.json': txt }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172W01.json': txt }, { 'リスト': list });
    await saveDirSet(list, root);
    M = freshModel(); M.chosho_mgmt_no = 'Z172W01'; M._viewOnly = true;
    const got = await __T(pcGuardAutoLoad());
    M.chosho_note = '現場1'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const 窓1 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    // PC がリストを直す：PCだけの欄（misc_fee）と現場の欄（増幅器）
    const j = __read(list, 'Z172W01.json');
    j.misc_fee = 'exclude'; j.amplifier = 'amp_2u43'; j.editedAt = '2026-09-22T00:00:00.000Z';
    list.__files['Z172W01.json'] = JSON.stringify(j);
    M.chosho_note = '現場2'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const 窓2 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    const j2 = __read(list, 'Z172W01.json');
    return { got: got, 窓1: 窓1, 窓2: 窓2, title: (_lastSaveInfo && _lastSaveInfo.title) || '',
             misc: j2 && j2.misc_fee, 増幅器: j2 && j2.amplifier, 備考: j2 && j2.chosho_note,
             ルートそのまま: root.__files['Z172W01.json'] === txt };
  });
  console.log('㉓PCがリストを直す', JSON.stringify(r23));
  ok(r23.got === true && r23.窓1 === 0 && r23.title === '保存しました', '試験の前提: 読んで保存できていない → ' + JSON.stringify(r23));
  ok(r23.窓2 === 0, '★PC がリストを直しただけなのに、確かめの窓が出た（控えを古い扱いにしている）→ ' + r23.窓2 + '回');
  ok(r23.misc === 'exclude', '★PC だけの欄の直しが消えた → ' + r23.misc);
  ok(r23.増幅器 === 'amp_2u43', '★PC の直し（増幅器）が現場の古い値に戻った → ' + r23.増幅器);
  ok(r23.備考 === '現場2', '★現場の入力が入っていない → ' + r23.備考);
  ok(r23.ルートそのまま === true, '★ルートの写しを書き替えた');

  /* ---------- ㉕ 同じフォルダを見分ける（本物と同じく、なめるたびに別の取っ手が返る） ----------
     覚えているリストを、物件のすぐ下を見るときにもう一度読まない */
  const r25 = await page.evaluate(async () => {
    __noDir();
    const list = __mkdir('リスト', {}, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list, '会社A': __mkdir('会社A', {}, {}) });
    await saveDirSet(list, root);
    const before = list.__listed;
    M = freshModel(); M.chosho_mgmt_no = 'Z172X01'; M._viewOnly = true;
    const got = await __T(pcGuardAutoLoad());
    return { got: got, 読んだ回数: list.__listed - before };
  });
  console.log('㉕同じフォルダを見分ける', JSON.stringify(r25));
  ok(r25.got === false, '試験の前提: 無い戸別を読んだ → ' + JSON.stringify(r25));
  ok(r25.読んだ回数 === 1, '★覚えているリストを、同じフォルダと見分けられずに2回読んだ → ' + r25.読んだ回数);

  /* ---------- ㉔ 開き直し：親（物件）を IndexedDB から戻す ----------
     試験のにせフォルダは写し取れないので、ここだけ IndexedDB を記憶用の入れ物に差し替える。 */
  const r24 = await page.evaluate(async () => {
    const o = {};
    const mem = new Map();
    const oG = idbMapGet, oP = idbMapPut;
    idbMapPut = async rec => { mem.set(rec.key, Object.assign({}, rec)); };
    idbMapGet = async k => mem.get(k) || null;
    try{
      __noDir(); await __clearDrafts();
      const list = __mkdir('リスト', { 'Z172T01.json': __caseJson('Z172T01', { chosho_photos:[ __ph('pa', '#c33') ] }) }, {});
      const rootTxt = __caseJson('Z172T01', { chosho_photos:[ __ph('pa', '#c33'), __ph('pb', '#36c') ],
        editedAt:'2026-09-15T00:00:00.000Z' });
      const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172T01.json': rootTxt }, { 'リスト': list });
      await saveDirAdopt(root, { ask:false });
      o.ls = localStorage.getItem(LS_SAVEDIR); o.ls親 = localStorage.getItem(LS_SAVEDIR_PAR);
      // 開き直し：画面の中の覚えを全部捨てる
      _saveDir = null; _saveDirPar = null; _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
      const g = await saveDirGet();
      o.戻った = __same(g, list); o.親 = __same(saveDirParentOf(g), root); o.場所 = saveDirPlace();
      renderSaveBar();
      o.帯 = (document.getElementById('sb-dest') || {}).textContent || '';
      // そのまま保存すると、ルートの写しの写真もリストへ入る
      M = freshModel(); M.chosho_mgmt_no = 'Z172T01'; M._viewOnly = true;
      o.got = await __T(pcGuardAutoLoad());
      M.chosho_note = '現場で直した'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.写真 = __pids(__read(list, 'Z172T01.json'));
      o.ルートに書いた = root.__wrote.length;
    } finally { idbMapGet = oG; idbMapPut = oP; }
    __noDir();
    return o;
  });
  console.log('㉔開き直し', JSON.stringify(r24));
  ok(r24.ls === 'リスト' && r24.ls親 === '物件', '★覚えた親（物件）の名前を控えていない → ' + JSON.stringify([r24.ls, r24.ls親]));
  ok(r24.戻った === true, '試験の前提: 開き直して覚えたフォルダを戻せていない');
  ok(r24.親 === true && r24.場所 === '物件 ＞ リスト',
     '★開き直すと親（物件）が消える（ルートの写しを読み合わせなくなる）→ ' + r24.場所);
  ok(/物件/.test(r24.帯) && /＞ リスト/.test(r24.帯), '★開き直したあと、保存バーに「物件 ＞ リスト」が出ない → ' + r24.帯);
  ok(r24.got === true && r24.写真 === 'pa,pb',
     '★開き直したあとの保存で、ルートの写しの写真がリストへ入らない → ' + r24.写真);
  ok(r24.ルートに書いた === 0, '★開き直したあと、物件のすぐ下に書いた');

  /* ---------- ㉖ 受付台帳が工事フォルダ（物件の上）の直下にある ----------
     工事/{現場用_物件B.json, 物件A/{受付台帳_A.json, 迷子の Z172K01, リスト/Z172K01}, 物件B/{受付台帳_B.json, リスト/Z172K09}}。
     台帳で選ぶ子（物件A）がそれ自体「物件」なので、聞かずに物件Aのすぐ下へ入らない。
     物件Bの戸別を物件Aへ書かない・物件Aのすぐ下の迷子を読まない。
     あわせて、まとめ表（受付台帳_まとめ.xlsx）は台帳と見なさない。 */
  const r26 = await page.evaluate(async () => {
    const o = {};
    const mk = top => {
      const aTxt = __caseJson('Z172K01', { amplifier:'amp_3u43', chosho_note:'物件Aのリスト' });
      const listA = __mkdir('リスト', { 'Z172K01.json': aTxt }, {});
      const bukA = __mkdir('物件A', { '受付台帳_物件A.json':'{}',
        'Z172K01.json': __caseJson('Z172K01', { amplifier:'amp_NG', chosho_note:'迷子' }) }, { 'リスト': listA });
      const bTxt = __caseJson('Z172K09', { amplifier:'amp_2u43' });
      const listB = __mkdir('リスト', { 'Z172K09.json': bTxt }, {});
      const bukB = __mkdir('物件B', { '受付台帳_物件B.json':'{}' }, { 'リスト': listB });
      const files = {}; files[top] = __ledger(['Z172K01', 'Z172K09']);   // まとめ表も、中身が読めても台帳と見なさない
      const koji = __mkdir('工事', files, { '物件A': bukA, '物件B': bukB });
      return { aTxt, listA, bukA, bTxt, listB, bukB, koji };
    };
    const odp = window.showDirectoryPicker, oConf = uiConfirm;
    try{
      for(const top of ['現場用_物件B.json', '受付台帳_まとめ.xlsx']){
        const k = top.slice(0, 3);
        // (a) 前の版で工事を覚えていた端末：開く → 保存
        __noDir(); await __clearDrafts();
        const t = mk(top);
        _saveDir = t.koji;
        M = freshModel(); M.chosho_mgmt_no = 'Z172K01'; M._viewOnly = true;
        __toasts.length = 0;
        await __T(pcGuardAutoLoad());
        o[k + '_a増幅器'] = M.amplifier;
        o[k + '_a覚え'] = _saveDir && _saveDir.name; o[k + '_a親'] = !!saveDirParentOf(_saveDir);
        o[k + '_a知らせ'] = __toasts.filter(x => /そろえました/.test(x)).length;
        __mine('Z172K09'); M.chosho_note = '物件Bの現場';
        __said.length = 0;
        await __T(saveJsonRun(), 8000);
        o[k + '_a物件Aに書いた'] = t.bukA.__wrote.length + t.listA.__wrote.length;
        o[k + '_a工事に書いた'] = t.koji.__wrote.slice().join(',');
        // (b) 保存バーの📁で工事を選ぶ：聞かずに物件Aへ入らない。「いいえ」なら工事のまま
        __noDir(); await __clearDrafts();
        const t2 = mk(top);
        let asked = 0;
        uiConfirm = async () => { asked++; return false; };
        window.showDirectoryPicker = async () => t2.koji;
        __toasts.length = 0;
        await __T(saveDirChange(), 6000);
        uiConfirm = oConf;
        o[k + '_b聞いた'] = asked;
        o[k + '_b覚え'] = _saveDir && _saveDir.name; o[k + '_b親'] = !!saveDirParentOf(_saveDir);
        __mine('Z172K09'); M.chosho_note = '物件Bの現場';
        __said.length = 0;
        await __T(saveJsonRun(), 8000);
        o[k + '_b物件Aに書いた'] = t2.bukA.__wrote.length + t2.listA.__wrote.length;
        // (c) まとめて保存・帯の📁（聞かない道）
        __noDir();
        const t3 = mk(top);
        await saveDirAdopt(t3.koji, { ask:false });
        o[k + '_c覚え'] = _saveDir && _saveDir.name; o[k + '_c親'] = !!saveDirParentOf(_saveDir);
      }
      // (d) まとめ表（.xlsx）だけが横にある物件：中の「戸別」へ聞かずに入らない（.json の台帳なら入る＝②b）
      __noDir();
      const kob = __mkdir('戸別', { 'Z172K21.json': __caseJson('Z172K21') }, {});
      const bx = __mkdir('物件X', { '受付台帳_まとめ.xlsx': __ledger(['Z172K21']) }, { '戸別': kob });
      await saveDirAdopt(bx, { ask:false });
      o.d_覚え = _saveDir && _saveDir.name;
    } finally { window.showDirectoryPicker = odp; uiConfirm = oConf; }
    __noDir();
    return o;
  });
  console.log('㉖台帳が工事フォルダの直下', JSON.stringify(r26));
  for(const k of ['現場用', '受付台']){
    ok(r26[k + '_a増幅器'] !== 'amp_NG', '★（' + k + '）工事を覚えた端末で、物件Aのすぐ下の迷子を読んだ → ' + r26[k + '_a増幅器']);
    ok(r26[k + '_a覚え'] === '工事' && r26[k + '_a親'] === false && r26[k + '_a知らせ'] === 0,
       '★（' + k + '）工事を覚えた端末が、黙って物件A（のすぐ下）へ寄せられた → ' + r26[k + '_a覚え']);
    ok(r26[k + '_a物件Aに書いた'] === 0, '★（' + k + '）物件Bの戸別を物件Aへ書いた（別の物件へ書く）');
    ok(r26[k + '_b覚え'] !== '物件A', '★（' + k + '）📁で工事を選ぶと、物件Aのすぐ下（リストの外）を覚えた');
    ok(r26[k + '_b聞いた'] === 1 && r26[k + '_b覚え'] === '工事' && r26[k + '_b親'] === false,
       '★（' + k + '）📁で工事を選ぶと、聞かずに中へ入った／「いいえ」でも工事のままにならない → '
       + JSON.stringify([r26[k + '_b聞いた'], r26[k + '_b覚え'], r26[k + '_b親']]));
    ok(r26[k + '_b物件Aに書いた'] === 0, '★（' + k + '）📁で工事を選んだあと、物件Bの戸別を物件Aへ書いた');
    ok(r26[k + '_c覚え'] === '工事' && r26[k + '_c親'] === false,
       '★（' + k + '）まとめて保存・帯の📁で工事を選ぶと、聞かずに物件Aへ入った → ' + r26[k + '_c覚え']);
  }
  ok(r26.d_覚え === '物件X', '★まとめ表（.xlsx）を受付台帳と見なして、聞かずに中のフォルダへ入った → ' + r26.d_覚え);

  /* ---------- ㉗ 写真だけ足してリストへ書いた → PCがリストを直す → もう一度保存：PCの直しが残る ----------
     ルートの写しとリストの中身が、写真のほか同じ。「控えがルートに合う」だけで、控えをルートの写しから
     取ったものと読み違えると、3つ見比べが止まり、PCの直し（増幅器・備考）が現場の古い値へ戻る。
     ㉗a はリストを覚えていて、戸別がルートにだけある場面で開く（前の版で保存した戸別を開く道）。 */
  const r27 = await page.evaluate(async () => {
    const o = {};
    const odp = window.showDirectoryPicker;
    const later = () => new Date(Date.now() + 3600000).toISOString();
    /* PCがリストを直す。when を渡さなければ editedAt は変えない（PCの時計が遅れていても、印で見分けること） */
    const pcEdit = (list, n, when) => {
      const j = __read(list, n);
      j.amplifier = 'amp_3u43'; j.chosho_note = 'PCの直し'; j.misc_fee = 'exclude'; if(when) j.editedAt = when;
      list.__files[n] = JSON.stringify(j);
    };
    const setup = no => {
      const rootTxt = __caseJson(no, { amplifier:'amp_2u43', chosho_note:'はじめの備考',
        chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-15T00:00:00.000Z' });
      const list = __mkdir('リスト', {}, {});
      const files = { '現場用_物件.json':'{}' }; files[no + '.json'] = rootTxt;
      const root = __mkdir('物件', files, { 'リスト': list });
      return { rootTxt, list, root };
    };
    try{
      // ㉗a 1件保存
      __noDir(); await __clearDrafts();
      const a = setup('Z172V01');
      await saveDirAdopt(a.root, { ask:false });
      o.a_覚え = saveDirPlace();
      M = freshModel(); M.chosho_mgmt_no = 'Z172V01'; M._viewOnly = true;
      o.a_got = await __T(pcGuardAutoLoad());               // ルートにだけある → ルートの写しを読む
      o.a_開いた増幅器 = M.amplifier; o.a_開いた写真 = __pids(M); o.a_見るだけ = !!M._viewOnly;
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.a_窓1 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      pcEdit(a.list, 'Z172V01.json');
      M.chosho_photos.push(__ph('p3', '#36c')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.a_窓2 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      const ja = __read(a.list, 'Z172V01.json');
      o.a_増幅器 = ja && ja.amplifier; o.a_備考 = ja && ja.chosho_note; o.a_misc = ja && ja.misc_fee;
      o.a_写真 = __pids(ja); o.a_ルートそのまま = a.root.__files['Z172V01.json'] === a.rootTxt;

      // ㉗b まとめて保存
      __noDir(); await __clearDrafts();
      const b = setup('Z172V02');
      await saveDirAdopt(b.root, { ask:false });
      M = freshModel(); M.chosho_mgmt_no = 'Z172V02'; M._viewOnly = true;
      o.b_got = await __T(pcGuardAutoLoad());
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      await persistDraft();
      window.showDirectoryPicker = async () => b.root;
      await __T(saveAllDrafts(), 10000);               // 1回目もまとめて保存（控えの印は、まとめて保存が付ける）
      o.b_1回目 = __pids(__read(b.list, 'Z172V02.json'));
      { const rec = await idbGet('no:Z172V02'); if(rec && rec.model){ M = rec.model; ensureModelShape(M); } }  // 下書きから開き直す
      o.b_控えの印 = (M._fileBase && M._fileBase.from) || '';
      pcEdit(b.list, 'Z172V02.json');
      M.chosho_photos.push(__ph('p3', '#36c')); M._touched = true;
      await persistDraft();
      window.showDirectoryPicker = async () => b.root;
      __said.length = 0;
      await __T(saveAllDrafts(), 10000);
      o.b_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      o.b_知らせ = __said.join(' / ').slice(0, 300);
      const jb = __read(b.list, 'Z172V02.json');
      o.b_増幅器 = jb && jb.amplifier; o.b_備考 = jb && jb.chosho_note; o.b_misc = jb && jb.misc_fee;
      o.b_写真 = __pids(jb);
      window.showDirectoryPicker = odp;

      // ㉗c 印の無い控え（前の版で作った控え）：リストがあとで直されていれば、PCの直しを残す
      __noDir(); await __clearDrafts();
      const c = setup('Z172V03');
      await saveDirAdopt(c.root, { ask:false });
      M = freshModel(); M.chosho_mgmt_no = 'Z172V03'; M._viewOnly = true;
      o.c_got = await __T(pcGuardAutoLoad());
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      await __T(saveJsonRun(), 8000);
      if(M._fileBase) delete M._fileBase.from;
      pcEdit(c.list, 'Z172V03.json', later());
      M.chosho_photos.push(__ph('p3', '#36c')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.c_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      o.c_知らせ = (__said.filter(s => /PCのファイルに中身が入っています/.test(s))[0] || '').slice(0, 300);
      const jc = __read(c.list, 'Z172V03.json');
      o.c_増幅器 = jc && jc.amplifier; o.c_備考 = jc && jc.chosho_note;

      // ㉗d リストから開いた（控え＝リスト）→ 保存する前にPCがリストを直す（ルートは同じ中身の写し）
      __noDir(); await __clearDrafts();
      const txt = __caseJson('Z172V04', { amplifier:'amp_2u43', chosho_note:'はじめの備考',
        chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-15T00:00:00.000Z' });
      const listD = __mkdir('リスト', { 'Z172V04.json': txt }, {});
      const rootD = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172V04.json': txt }, { 'リスト': listD });
      await saveDirSet(listD, rootD);
      M = freshModel(); M.chosho_mgmt_no = 'Z172V04'; M._viewOnly = true;
      o.d_got = await __T(pcGuardAutoLoad());
      pcEdit(listD, 'Z172V04.json');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.d_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      const jd = __read(listD, 'Z172V04.json');
      o.d_増幅器 = jd && jd.amplifier; o.d_備考 = jd && jd.chosho_note;

      // ㉗e 印の無い控えで、リストの方が古い（③b と同じ場面）：新しいルートの写しが土台。控えはそれに合う
      __noDir(); await __clearDrafts();
      const rTxt = __caseJson('Z172V05', { amplifier:'amp_2u43', chosho_photos:[ __ph('pa', '#c33') ],
        editedAt:'2026-09-15T00:00:00.000Z' });
      const rootE = __mkdir('物件', { 'Z172V05.json': rTxt }, {});
      _saveDir = rootE;
      M = freshModel(); M.chosho_mgmt_no = 'Z172V05'; M._viewOnly = true;
      o.e_got = await __T(pcGuardAutoLoad());
      if(M._fileBase) delete M._fileBase.from;
      const listE = __mkdir('リスト', { 'Z172V05.json': __caseJson('Z172V05', { amplifier:'amp_3u43',
        chosho_photos:[ __ph('pa', '#c33') ], editedAt:'2026-09-01T00:00:00.000Z' }) }, {});
      rootE.__subs['リスト'] = listE;
      await saveDirSet(listE, rootE);
      M.chosho_note = '現場で直した'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      const je = __read(listE, 'Z172V05.json');
      o.e_増幅器 = je && je.amplifier; o.e_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;

      // ㉗f 印の無い古い控え（前の版でリストから開いた）で、PCの時計が遅れている（editedAt が新しくない）。
      //     控えはリストにもルートの写しにも合わず、新しさでも分からない → 「PCがリストを直した」と決めつけない
      __noDir(); await __clearDrafts();
      const txtF = __caseJson('Z172V06', { amplifier:'amp_2u43', chosho_note:'はじめの備考',
        chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-15T00:00:00.000Z' });
      const listF = __mkdir('リスト', { 'Z172V06.json': txtF }, {});
      const rootF = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172V06.json': __caseJson('Z172V06', { amplifier:'amp_NG',
        chosho_note:'前の版の古い写し', chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-01T00:00:00.000Z' }) },
        { 'リスト': listF });
      await saveDirSet(listF, rootF);
      M = freshModel(); M.chosho_mgmt_no = 'Z172V06'; M._viewOnly = true;
      o.f_got = await __T(pcGuardAutoLoad());
      if(M._fileBase) delete M._fileBase.from;
      pcEdit(listF, 'Z172V06.json');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.f_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      const jf = __read(listF, 'Z172V06.json');
      o.f_増幅器 = jf && jf.amplifier; o.f_備考 = jf && jf.chosho_note;

      // ㉗g ルートの写しから開いた控え（印＝root）で、そのあとPCが同じ中身をリストへ写した
      //     → 控えはリストの中身と同じ。値の見比べを続け、確かめの窓は出さない
      __noDir(); await __clearDrafts();
      const txtG = __caseJson('Z172V07', { amplifier:'amp_2u43', chosho_photos:[ __ph('p1', '#c33') ],
        editedAt:'2026-09-15T00:00:00.000Z' });
      const rootG = __mkdir('物件', { 'Z172V07.json': txtG }, {});
      _saveDir = rootG;
      M = freshModel(); M.chosho_mgmt_no = 'Z172V07'; M._viewOnly = true;
      o.g_got = await __T(pcGuardAutoLoad());
      o.g_印 = (M._fileBase && M._fileBase.from) || '';
      const listG = __mkdir('リスト', { 'Z172V07.json': txtG }, {});
      rootG.__subs['リスト'] = listG;
      await saveDirSet(listG, rootG);
      M.chosho_note = '現場で直した'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.g_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      const jg = __read(listG, 'Z172V07.json');
      o.g_備考 = jg && jg.chosho_note;
    } finally { window.showDirectoryPicker = odp; }
    __noDir();
    return o;
  });
  console.log('㉗写真だけ足した保存のあと、PCがリストを直す', JSON.stringify(r27));
  ok(r27.a_覚え === '物件 ＞ リスト', '試験の前提: リストを覚えていない → ' + r27.a_覚え);
  ok(r27.a_got === true && r27.a_見るだけ === false && r27.a_開いた増幅器 === 'amp_2u43' && r27.a_開いた写真 === 'p1',
     '★リストを覚えていて戸別がルートにだけあるとき、開いてもルートの写しを読まない（見るだけのまま）→ '
     + JSON.stringify([r27.a_got, r27.a_見るだけ, r27.a_開いた増幅器, r27.a_開いた写真]));
  ok(r27.a_窓1 === 0 && r27.a_窓2 === 0, '★PCがリストを直しただけなのに、確かめの窓が出た → ' + r27.a_窓1 + '/' + r27.a_窓2);
  ok(r27.a_増幅器 === 'amp_3u43' && r27.a_備考 === 'PCの直し' && r27.a_misc === 'exclude',
     '★（1件保存）PCの直しが現場の古い値へ戻った → ' + JSON.stringify([r27.a_増幅器, r27.a_備考, r27.a_misc]));
  ok(r27.a_写真 === 'p1,p2,p3', '★（1件保存）写真が落ちた → ' + r27.a_写真);
  ok(r27.a_ルートそのまま === true, '★ルートの写しを書き替えた');
  ok(r27.b_got === true && r27.b_1回目 === 'p1,p2' && r27.b_写真 === 'p1,p2,p3', '試験の前提: まとめて保存がリストに入っていない → ' + JSON.stringify(r27));
  ok(r27.b_増幅器 === 'amp_3u43' && r27.b_備考 === 'PCの直し' && r27.b_misc === 'exclude',
     '★（まとめて保存）PCの直しが、何も言わずに現場の古い値へ戻った → ' + JSON.stringify([r27.b_増幅器, r27.b_備考, r27.b_misc]));
  ok(r27.b_窓 === 0, '★（まとめて保存）PCの直しを残すだけなのに、知らせの窓が出た → ' + r27.b_窓);
  /* 版172 第4回から: 控えの出どころ（リストかルートの写しか）が確かでないときは推し量らない。
     日付で「使える」と決めると、ルートの写しから取った控えでリストを見比べ、現場の入力が黙って戻る（㉛）。
     ここ（㉗c）はその逆向きの場面だが、中身だけでは見分けられないので、黙らずに1回聞く。
     聞く窓には、置き換わる欄の名前を必ず出す（利用者は「いいえ」を選べる）。 */
  ok(r27.c_got === true && r27.c_窓 === 1,
     '★出どころの分からない控えなのに、聞かずに保存した（どちらかの値が黙って消える）→ ' + JSON.stringify([r27.c_窓]));
  ok(/増幅器|備考/.test(r27.c_知らせ || ''),
     '★聞く窓に、置き換わる欄の名前が出ていない → ' + r27.c_知らせ);
  ok(r27.d_got === true && r27.d_窓 === 0 && r27.d_増幅器 === 'amp_3u43' && r27.d_備考 === 'PCの直し',
     '★リストから開いたあとPCがリストを直すと、PCの直しが戻った → ' + JSON.stringify([r27.d_窓, r27.d_増幅器, r27.d_備考]));
  ok(r27.e_got === true && r27.e_増幅器 === 'amp_2u43' && r27.e_窓 === 0,
     '★印の無い控えで、リストの方が古いのに、古いリストを土台にした（現場の値が古い値へ戻る／窓が出る）→ ' + JSON.stringify([r27.e_増幅器, r27.e_窓]));
  ok(r27.g_got === true && r27.g_印 === 'root' && r27.g_窓 === 0 && r27.g_備考 === '現場で直した',
     '★ルートの写しから取った控えがリストの中身と同じなのに、控えを古い扱いにした（毎回確かめの窓が出る）→ '
     + JSON.stringify([r27.g_印, r27.g_窓, r27.g_備考]));
  ok(r27.f_got === true && r27.f_窓 === 1,
     '★控えがリストにもルートの写しにも合わず新しさでも分からないのに、確かめずに見比べた（黙って決めつけた）→ '
     + JSON.stringify([r27.f_窓, r27.f_増幅器, r27.f_備考]));

  /* ---------- ㉘ 受付台帳が工事フォルダ（物件の上）にあり、物件のフォルダに「リスト」が無い ----------
     台帳を手がかりに強いと決めるのは確かめられるときだけ。確かめられなければ弱い扱い
     （聞かない道では選んだフォルダのまま＝版171 と同じ）。別の物件のフォルダへ黙って書かない。 */
  const r28 = await page.evaluate(async () => {
    const o = {};
    const mkA = nos => { const f = {}; nos.forEach(n => f[n + '.json'] = __caseJson(n)); return f; };
    // a 工事/{現場用_物件A, 現場用_物件B}, 物件A/{R01,R02,R03}, 物件B/{R09}：帯の📁で工事 → 物件Bの戸別を開いて保存
    __noDir(); await __clearDrafts();
    const aA = __mkdir('物件A', mkA(['Z172R01', 'Z172R02', 'Z172R03']), {});
    const aB = __mkdir('物件B', mkA(['Z172R09']), {});
    const ka = __mkdir('工事', { '現場用_物件A_20260917.json': __ledger(['Z172R01', 'Z172R02', 'Z172R03']),
      '現場用_物件B_20260917.json': __ledger(['Z172R09']) }, { '物件A': aA, '物件B': aB });
    const ga = await saveDirAdopt(ka, { ask:false });
    o.a_覚え = ga && ga.name; o.a_親 = !!saveDirParentOf(_saveDir);
    M = freshModel(); M.chosho_mgmt_no = 'Z172R09'; M._viewOnly = true;
    o.a_got = await __T(pcGuardAutoLoad());
    M.chosho_note = '物件Bの現場'; M._touched = true;
    await __T(saveJsonRun(), 8000);
    o.a_物件Aに書いた = aA.__wrote.slice().join(',');
    o.a_物件Aに増えた = Object.keys(aA.__files).filter(n => /R09/.test(n)).length;
    // b 前の版で「工事」を覚えていた端末：工事/{現場用_物件B}, 物件A/{R11,R12}, 物件B/{R13}。物件Bの新しい戸別を保存
    __noDir(); await __clearDrafts();
    const bA = __mkdir('物件A', mkA(['Z172R11', 'Z172R12']), {});
    const bB = __mkdir('物件B', mkA(['Z172R13']), {});
    const kb = __mkdir('工事', { '現場用_物件B_20260917.json': __ledger(['Z172R13', 'Z172R19']) }, { '物件A': bA, '物件B': bB });
    _saveDir = kb;
    __toasts.length = 0;
    __mine('Z172R19');
    await __T(saveJsonRun(), 8000);
    o.b_覚え = _saveDir && _saveDir.name; o.b_親 = !!saveDirParentOf(_saveDir);
    o.b_物件Aに書いた = bA.__wrote.slice().join(',');
    o.b_そろえた = __toasts.filter(x => /そろえました/.test(x)).length;
    // c 工事/{現場用_物件B}、中は物件A/{R21,R22} だけ（物件Bのフォルダはまだ無い）→ 台帳の戸別が物件Aに無い
    __noDir();
    const kc = __mkdir('工事', { '現場用_物件B.json': __ledger(['Z172R29']) },
      { '物件A': __mkdir('物件A', mkA(['Z172R21', 'Z172R22']), {}) });
    const gc = await saveDirAdopt(kc, { ask:false });
    o.c_覚え = gc && gc.name;
    // d 工事/{現場用_物件A}、物件A/{R31,R32}（台帳に合う）と 物件B/{R39}：戸別の入った子が2つ
    __noDir();
    const kd = __mkdir('工事', { '現場用_物件A.json': __ledger(['Z172R31', 'Z172R32']) },
      { '物件A': __mkdir('物件A', mkA(['Z172R31', 'Z172R32']), {}), '物件B': __mkdir('物件B', mkA(['Z172R39']), {}) });
    const gd = await saveDirAdopt(kd, { ask:false });
    o.d_覚え = gd && gd.name;
    // e 工事/{現場用_物件A（R41）, 現場用_物件B（R49）}、中は物件A/{R41} だけ：台帳が2つ
    __noDir();
    const ke = __mkdir('工事', { '現場用_物件A.json': __ledger(['Z172R41']), '現場用_物件B.json': __ledger(['Z172R49']) },
      { '物件A': __mkdir('物件A', mkA(['Z172R41']), {}) });
    const ge = await saveDirAdopt(ke, { ask:false });
    o.e_覚え = ge && ge.name;
    // f 台帳が1つ・子が1つ・台帳の戸別が中にある → 聞かずに中へ（確かめられた）
    __noDir();
    const kf = __mkdir('物件F', { '現場用_物件F.json': __ledger(['Z172R51']) },
      { '戸別': __mkdir('戸別', mkA(['Z172R51', 'Z172R52']), {}) });
    const gf = await saveDirAdopt(kf, { ask:false });
    o.f_覚え = gf && gf.name; o.f_親 = __same(saveDirParentOf(_saveDir), kf);
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉘台帳が工事フォルダ・リストなし', JSON.stringify(r28));
  ok(r28.a_覚え === '工事' && r28.a_親 === false,
     '★台帳が2つある工事フォルダを選ぶと、聞かずに物件Aへ入った → ' + r28.a_覚え);
  ok(r28.a_got === true, '試験の前提: 物件Bの戸別を開けていない → ' + JSON.stringify(r28));
  ok(r28.a_物件Aに書いた === '' && r28.a_物件Aに増えた === 0,
     '★物件Bの戸別を、物件Aのフォルダへ書いた（別の物件へ書く）→ ' + r28.a_物件Aに書いた);
  ok(r28.b_覚え === '工事' && r28.b_親 === false && r28.b_そろえた === 0,
     '★前の版で工事を覚えた端末が、保存のときに黙って物件Aへ寄せられた → ' + r28.b_覚え);
  ok(r28.b_物件Aに書いた === '', '★物件Bの新しい戸別を、物件Aのフォルダへ書いた → ' + r28.b_物件Aに書いた);
  ok(r28.c_覚え === '工事', '★台帳の戸別が1つも無い中のフォルダへ、聞かずに入った（別の物件の台帳）→ ' + r28.c_覚え);
  ok(r28.d_覚え === '工事', '★戸別の入った子が2つあるのに、聞かずに片方へ入った → ' + r28.d_覚え);
  ok(r28.e_覚え === '工事', '★台帳が2つあるのに、聞かずに中へ入った → ' + r28.e_覚え);
  ok(r28.f_覚え === '物件F' && r28.f_親 === false,
     '★名前が「リスト」でないのに、受付台帳を手がかりに聞かずに中のフォルダへ入った → ' + r28.f_覚え);

  /* ---------- ㉙ PCがルートの写し（新しい方）を直している → 古いリストを土台にしない ----------
     前の版の現場がルートへ書いた写しを、事務所が開いて直した（料金の扱い・editedAt が新しい）。
     リストは古い（PCで書いた備考）。版172 で保存すると、新しい方を土台にして PC の直しと現場の前の入力を残す。 */
  const r29 = await page.evaluate(async () => {
    const o = {};
    // a 印の無い控え（前の版でルートへ書いた）
    __noDir(); await __clearDrafts();
    const r0 = __caseJson('Z172X01', { chosho_note:'現場v171で書いた備考', misc_fee:'include',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-05T00:00:00.000Z' });
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172X01.json': r0 }, {});
    _saveDir = root;
    M = freshModel(); M.chosho_mgmt_no = 'Z172X01'; M._viewOnly = true;
    o.a_got = await __T(pcGuardAutoLoad());
    if(M._fileBase) delete M._fileBase.from;          // 前の版の控え（印なし）
    const rj = JSON.parse(r0); rj.misc_fee = 'exclude'; rj.editedAt = '2026-09-12T00:00:00.000Z';
    const rootTxt = JSON.stringify(rj);
    root.__files['Z172X01.json'] = rootTxt;           // PCがルートの写しを直した
    const list = __mkdir('リスト', { 'Z172X01.json': __caseJson('Z172X01', { chosho_note:'PCで書いた備考',
      misc_fee:'include', chosho_photos:[ __ph('p1', '#c33'), __ph('p9', '#963') ], editedAt:'2026-09-01T00:00:00.000Z' }) }, {});
    root.__subs['リスト'] = list;
    await saveDirSet(list, root);
    M.chosho_cust_tel = '0176-99-9999'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const j = __read(list, 'Z172X01.json');
    o.a_misc = j && j.misc_fee; o.a_備考 = j && j.chosho_note; o.a_電話 = j && j.chosho_cust_tel;
    o.a_写真 = __pids(j); o.a_ルートそのまま = root.__files['Z172X01.json'] === rootTxt;
    o.a_title = (_lastSaveInfo && _lastSaveInfo.title) || '';
    // b リストから開いた控え（印＝list）。そのあと別の端末（前の版）がルートへ新しく書いた
    //   → 控えは新しい方（ルート）の前の中身ではない。黙ってルートの値へ戻さない
    __noDir(); await __clearDrafts();
    const lb = __mkdir('リスト', { 'Z172X02.json': __caseJson('Z172X02', { amplifier:'amp_2u43',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-15T00:00:00.000Z' }) }, {});
    const rb = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': lb });
    await saveDirSet(lb, rb);
    M = freshModel(); M.chosho_mgmt_no = 'Z172X02'; M._viewOnly = true;
    o.b_got = await __T(pcGuardAutoLoad());
    o.b_印 = (M._fileBase && M._fileBase.from) || '';
    rb.__files['Z172X02.json'] = __caseJson('Z172X02', { amplifier:'amp_3u43',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt: new Date(Date.now() + 3600000).toISOString() });
    M.chosho_note = '現場で直した'; M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    const jb = __read(lb, 'Z172X02.json');
    o.b_増幅器 = jb && jb.amplifier; o.b_備考 = jb && jb.chosho_note;
    o.b_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    // c まとめて保存で同じ場面
    __noDir(); await __clearDrafts();
    const lc = __mkdir('リスト', { 'Z172X03.json': __caseJson('Z172X03', { amplifier:'amp_2u43',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-15T00:00:00.000Z' }) }, {});
    const rc = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': lc });
    await saveDirSet(lc, rc);
    M = freshModel(); M.chosho_mgmt_no = 'Z172X03'; M._viewOnly = true;
    o.c_got = await __T(pcGuardAutoLoad());
    rc.__files['Z172X03.json'] = __caseJson('Z172X03', { amplifier:'amp_3u43',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt: new Date(Date.now() + 3600000).toISOString() });
    M.chosho_note = '現場で直した'; M._touched = true;
    await persistDraft();
    const odp = window.showDirectoryPicker;
    window.showDirectoryPicker = async () => rc;
    __said.length = 0;
    try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
    const jc = __read(lc, 'Z172X03.json');
    o.c_増幅器 = jc && jc.amplifier; o.c_備考 = jc && jc.chosho_note;
    o.c_知らせ = __said.join(' / ').slice(0, 300);
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉙PCがルートの写しを直していた', JSON.stringify(r29));
  ok(r29.a_got === true && r29.a_title === '保存しました', '試験の前提: 開いて保存できていない → ' + JSON.stringify(r29));
  ok(r29.a_misc === 'exclude', '★PCがルートの写し（新しい方）で直した料金の扱いが、古いリストの値に戻った → ' + r29.a_misc);
  ok(r29.a_備考 === '現場v171で書いた備考', '★現場が前の版で入れた備考が、古いリストの値に戻った → ' + r29.a_備考);
  ok(r29.a_電話 === '0176-99-9999', '★今回の現場の入力が入っていない → ' + r29.a_電話);
  ok(r29.a_写真 === 'p1,p9' && r29.a_ルートそのまま === true,
     '★古い方（リスト）にしか無い写真が落ちた、またはルートの写しを書き替えた → ' + JSON.stringify([r29.a_写真, r29.a_ルートそのまま]));
  ok(r29.b_got === true && r29.b_印 === 'list', '試験の前提: リストから開けていない → ' + JSON.stringify(r29));
  ok(!(r29.b_増幅器 === 'amp_3u43' && r29.b_窓 === 0),
     '★リストから取った控えのまま、新しいルートの写しと見比べて、現場の値を黙って替えた → ' + JSON.stringify([r29.b_増幅器, r29.b_窓]));
  ok(r29.b_窓 === 1 && r29.b_備考 === '現場で直した', '★どちらとも言えないのに、確かめの窓が出ない → ' + JSON.stringify(r29));
  ok(r29.c_got === true && r29.c_備考 === '現場で直した', '試験の前提: まとめて保存がリストに入っていない → ' + JSON.stringify(r29));
  ok(r29.c_増幅器 !== 'amp_3u43',
     '★（まとめて保存）リストから取った控えのまま新しいルートの写しと見比べて、現場の値を黙って替えた → ' + r29.c_増幅器);

  /* ---------- ㉚ 物件の中にフォルダが21個以上あっても、「リスト」を見落とさない ----------
     メインの「全戸別の写真を書き出す」は、管理番号のフォルダを何十個も作る。Windows では名前順に並ぶので、
     数字のフォルダが「リスト」より先に来る。途中で打ち切ると「リスト」を見落とし、物件のすぐ下へ書いてしまう。
     （偽のフォルダも、数字の名前が先に並ぶ＝本物と同じ順） */
  const r30 = await page.evaluate(async () => {
    const o = {};
    __noDir(); await __clearDrafts();
    const subs = {};
    for(let i = 1; i <= 25; i++) subs[String(245000 + i)] = __mkdir(String(245000 + i), {}, {});
    const list = __mkdir('リスト', {}, {});
    subs['リスト'] = list;
    const files = { '現場用_物件.json':'{}' };
    for(let i = 1; i <= 3; i++) files['Z172W0' + i + '.json'] = __caseJson('Z172W0' + i);
    const root = __mkdir('物件', files, subs);
    o.並び = Object.keys(root.__subs).slice(-2).join(',');
    // a 選んだとき
    const g = await saveDirAdopt(root, { ask:false });
    o.a_覚え = g && g.name; o.a_親 = __same(saveDirParentOf(_saveDir), root);
    // b 前の版で物件を覚えたままの端末：保存で寄せる → リストへ書き、物件のすぐ下に新しいファイルを作らない
    __noDir(); await __clearDrafts();
    await saveDirSet(root, null);
    const before = Object.keys(root.__files).length;
    M = freshModel(); M.chosho_mgmt_no = 'Z172W09'; M.chosho_note = '新しい戸別'; M._touched = true;
    await __T(saveJsonRun(), 8000);
    o.b_覚え = saveDirPlace();
    o.b_リスト = Object.keys(list.__files).join(',');
    o.b_物件に増えた = Object.keys(root.__files).length - before;
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉚フォルダが21個以上', JSON.stringify(r30));
  ok(r30.並び === '245025,リスト', '試験の前提: 数字のフォルダが「リスト」より先に並んでいない → ' + r30.並び);
  ok(r30.a_覚え === 'リスト' && r30.a_親 === true,
     '★中のフォルダが多いと「リスト」を見落とす（物件のすぐ下に書く）→ ' + r30.a_覚え);
  ok(r30.b_覚え === '物件 ＞ リスト' && r30.b_リスト === 'Z172W09.json' && r30.b_物件に増えた === 0,
     '★前の版で物件を覚えた端末が、フォルダの多い物件でリストへ寄らずに物件のすぐ下へ書いた → '
     + JSON.stringify([r30.b_覚え, r30.b_リスト, r30.b_物件に増えた]));

  /* ---------- ㉛ ルートの写しから取った印の無い控え＋あとでPCが直したリスト → 現場の入力を黙って戻さない ----------
     前の版の現場がルートへ書いた写し（現場の備考・増幅器）から開いた控えは、印が無い（前の版の控え）。
     そのあと PC がリストを直す（リストの日付の方が新しい）。日付だけで「控えを使ってよい」とすると、
     控え＝ルートの中身でリスト（現場の入力が入っていない）を見比べ、現場の備考・増幅器が黙って古い値へ戻る。
     出どころが確かでないので、黙らずに1回聞くこと。 */
  const r31 = await page.evaluate(async () => {
    const o = {};
    __noDir(); await __clearDrafts();
    const rootObj = JSON.parse(__caseJson('Z172Y01', { amplifier:'amp_2u43', chosho_note:'現場で書いた（前の版）',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-05T00:00:00.000Z' }));
    const listObj = JSON.parse(__caseJson('Z172Y01', { amplifier:'amp_3u43', chosho_note:'PCで書いた備考',
      misc_fee:'exclude', chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-20T00:00:00.000Z' }));
    const list = __mkdir('リスト', { 'Z172Y01.json': JSON.stringify(listObj) }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172Y01.json': JSON.stringify(rootObj) }, { 'リスト': list });
    await saveDirSet(list, root);
    // 前の版で、ルートの写しから開いた下書き（控えに印が無い）
    await loadStateInto(JSON.parse(JSON.stringify(rootObj)), 'Z172Y01.json');
    if(M._fileBase) delete M._fileBase.from;
    o.控えの印 = (M._fileBase && M._fileBase.from) || '';
    M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
    __said.length = 0;
    await __T(saveJsonRun(), 8000);
    o.窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    const j = __read(list, 'Z172Y01.json');
    o.写真 = __pids(j);
    o.ルートそのまま = root.__files['Z172Y01.json'] === JSON.stringify(rootObj);
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉛ルートから取った印なしの控え', JSON.stringify(r31));
  ok(r31.控えの印 === '', '試験の前提: 控えに印が付いている');
  ok(r31.窓 === 1,
     '★控えの出どころが確かでないのに聞かなかった（現場の備考・増幅器が黙ってリストの古い値へ戻る）→ ' + r31.窓);
  ok(r31.写真 === 'p1,p2', '★写真が落ちた → ' + r31.写真);
  ok(r31.ルートそのまま === true, '★ルートの写しを書き替えた');

  /* ---------- ㉜ 帯の「📁 PCのフォルダから読み込む」（pcGuardDirLoad）を実際に押す ---------- */
  const r32 = await page.evaluate(async () => {
    const o = {};
    const odp = window.showDirectoryPicker;
    try{
      // a まだフォルダを覚えていない：窓で物件を選ぶ → 覚えるのは「物件 ＞ リスト」、そのまま読み込める
      __noDir(); await __clearDrafts();
      const listA = __mkdir('リスト', { 'Z172Z01.json': __caseJson('Z172Z01', { chosho_photos:[ __ph('p1', '#c33') ] }) }, {});
      const rootA = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': listA });
      window.showDirectoryPicker = async () => rootA;
      M = freshModel(); M.chosho_mgmt_no = 'Z172Z01'; M._viewOnly = true;
      __said.length = 0;
      await __T(pcGuardDirLoad(), 8000);
      o.a_覚え = saveDirPlace(); o.a_読んだ = !!M._fromCaseFile; o.a_見るだけ = !!M._viewOnly;
      o.a_写真 = (M.chosho_photos || []).length;
      // b 見つからないとき：知らせに「物件 ＞ リスト」と出す（どこを探したか分かるように）
      M = freshModel(); M.chosho_mgmt_no = 'Z172Z99'; M._viewOnly = true;
      __said.length = 0;
      await __T(pcGuardDirLoad(), 8000);
      o.b_知らせ = (__said.filter(s => /見つかりませんでした/.test(s))[0] || '').slice(0, 120);
      // c 覚えているが許可が切れている：押した操作で1回だけ聞き直し、読み込める
      __noDir(); await __clearDrafts();
      const listC = __mkdir('リスト', { 'Z172Z02.json': __caseJson('Z172Z02') }, {});
      const rootC = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': listC });
      await saveDirSet(listC, rootC);
      listC.__perm = 'prompt';
      window.showDirectoryPicker = async () => { o.c_窓を開いた = true; return rootC; };
      M = freshModel(); M.chosho_mgmt_no = 'Z172Z02'; M._viewOnly = true;
      await __T(pcGuardDirLoad(), 8000);
      o.c_聞いた = listC.__asked; o.c_読んだ = !!M._fromCaseFile; o.c_覚え = saveDirPlace();
      o.c_窓を開いた = !!o.c_窓を開いた;
    } finally { window.showDirectoryPicker = odp; }
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉜帯の📁', JSON.stringify(r32));
  ok(r32.a_覚え === '物件 ＞ リスト',
     '★帯の📁で物件を選ぶと、物件のすぐ下を覚えた（リストへ寄せていない）→ ' + r32.a_覚え);
  ok(r32.a_読んだ === true && r32.a_見るだけ === false && r32.a_写真 === 1,
     '★帯の📁で選んだあと、その戸別を読み込めていない → ' + JSON.stringify([r32.a_読んだ, r32.a_見るだけ, r32.a_写真]));
  ok(/物件 ＞ リスト/.test(r32.b_知らせ),
     '★見つからないときの知らせに、どこを探したか（物件 ＞ リスト）が出ていない → ' + r32.b_知らせ);
  ok(r32.c_聞いた === 1 && r32.c_読んだ === true && r32.c_窓を開いた === false && r32.c_覚え === '物件 ＞ リスト',
     '★許可が切れているとき、1回だけ聞き直して読み込めていない（または窓を開き直した）→ '
     + JSON.stringify([r32.c_聞いた, r32.c_読んだ, r32.c_窓を開いた, r32.c_覚え]));

  await page.evaluate(() => { try{ __stopDlg(); }catch(_){} });
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));

  /* ---------- ⑭ 幅320px・長い物件名で、保存バーが横にはみ出さない（PC の親あり・スマホの「/」あり） ---------- */
  const p2 = await (await b.newContext({ viewport:{ width: 320, height: 700 } })).newPage();
  p2.on('dialog', d => d.accept().catch(()=>{}));
  await p2.goto(HTML); await p2.waitForTimeout(2000);
  await p2.evaluate(SETUP);
  const r14 = await p2.evaluate(async () => {
    const LONG = 'あ'.repeat(120);
    const measure = () => {
      const W = window.innerWidth;
      const q = s => document.querySelector('#savebar ' + s);
      const r = e => e ? e.getBoundingClientRect() : null;
      const inn = q('.sb-dest-in'), x = q('.sb-dest-x'), n = q('.sb-dest-n');
      return { W: W, sw: document.documentElement.scrollWidth,
        inRight: inn ? Math.round(r(inn).right) : -1, inLeft: inn ? Math.round(r(inn).left) : -1,
        inCut: inn ? (inn.scrollWidth > inn.clientWidth + 1) : null, inW: inn ? Math.round(r(inn).width) : -1,
        xRight: x ? Math.round(r(x).right) : -1, xW: x ? Math.round(r(x).width) : -1,
        nCut: n ? (n.scrollWidth > n.clientWidth + 1) : null,
        text: (document.getElementById('sb-dest') || {}).textContent || '' };
    };
    const o = {};
    // PC：物件（長い名前）＞ リスト
    __noDir(); saveHintSet('');
    await saveDirSet(__mkdir('リスト', {}, {}), __mkdir(LONG, {}, {}));
    renderSaveBar(); await new Promise(r => setTimeout(r, 80));
    o.pc = measure();
    // PC：中の名前も長い
    await saveDirSet(__mkdir('い'.repeat(60), {}, {}), __mkdir(LONG, {}, {}));
    renderSaveBar(); await new Promise(r => setTimeout(r, 80));
    o.pcLong = measure();
    // スマホ：入れる場所の名前「長い物件名/リスト」
    __noDir(); saveHintSet(LONG + '/リスト');
    renderSaveBar(); await new Promise(r => setTimeout(r, 80));
    o.sp = measure();
    saveHintSet(LONG + '/' + 'い'.repeat(60));
    renderSaveBar(); await new Promise(r => setTimeout(r, 80));
    o.spLong = measure();
    return o;
  });
  console.log('⑭幅320px', JSON.stringify(r14));
  for(const [k, v] of Object.entries(r14)){
    ok(v.inRight > 0 && v.xRight > 0, '試験の前提: 「物件 ＞ リスト」の形で出ていない（' + k + '）→ ' + v.text.slice(0, 40));
    ok(v.sw <= v.W, '★保存バーが横にはみ出した＝画面が横に動く（' + k + '）→ ' + v.sw + ' > ' + v.W);
    ok(v.inRight <= v.W && v.inLeft >= 0, '★「＞ リスト」が画面の外に出た（' + k + '）→ ' + v.inLeft + '〜' + v.inRight);
    ok(v.xRight <= v.W && v.xW > 0, '★「変更」が画面の外に出た（' + k + '）→ ' + v.xRight);
  }
  ok(r14.pc.inCut === false && r14.sp.inCut === false,
     '★長い物件名のとき「＞ リスト」まで削られている（どこへ入れるか見えない）→ pc ' + r14.pc.inW + 'px / sp ' + r14.sp.inW + 'px');
  ok(r14.pc.nCut === true && r14.sp.nCut === true, '★長い物件名の方が「…」になっていない');
  await p2.close();

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版172（現場入力）');
})();
