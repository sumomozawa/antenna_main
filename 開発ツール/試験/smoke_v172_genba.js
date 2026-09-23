/* 版172（現場入力）
   保存先を「物件 ＞ リスト」に固定する。
     ・PC：物件のフォルダ（ルート）を選んでも、覚えるのは中の「リスト」。親（物件）も一緒に覚える。
       前の版でルートを覚えたままの端末も、保存・読み込みのときに黙ってリストへ寄せる。
       ルートには新しい戸別ファイルを作らない。特別記録もリストへ。
     ・前の版でルートにできてしまった写しは、保存のときには読まない・触らない・消さない
       （利用者の決め 2026-09-23。そこにしか無い写真は PC の「🧩 重複をまとめる」でリストへまとめる）。
       控えは「今の保存先から取った（印 ep）」か「ファイルと同じ中身」のときだけ見比べに使う。
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
  _saveDir = null; _saveDirPar = null; _saveDirEp = ""; _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
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

  /* ---------- ③ リスト{写真a}＋ルートの写し{写真a,b} → 保存ではリストだけを見る（リストに a。ルートの写しは読まない・触らない） ---------- */
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
  ok(r3.リストの写真 === 'pa',
     '★保存のときに物件のすぐ下の古いファイルを読んで混ぜた（保存ではリストだけを見る）→ ' + r3.リストの写真);
  ok(r3.リストの備考 === '現場で直した', '★現場の入力がリストに入っていない → ' + r3.リストの備考);
  ok(r3.ルートそのまま === true && r3.ルートに書いた.length === 0, '★ルートの写しを書き替えた（または消した）');
  ok(!/すぐ下にも/.test(r3.msg), '★保存では読んでいない、すぐ下のファイルのことを知らせた → ' + r3.msg);

  /* ---------- ③b 控えがルートの写しから取られている（前の版で物件を覚えていた端末） ----------
     保存ではリストだけを見る。控えはリストから取ったものではなく、リストの中身とも違うので、見比べに使わない。
     黙ってリストの値へ戻さず、1回だけ聞く（「はい」で現場の値）。一度リストへ書けば控えはリストのものになり、2回目は聞かない。 */
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
  ok(r3b.窓1 === 1, '★ルートの写しから取った控えなのに、聞かずにリストと見比べた（または何度も聞いた）→ ' + r3b.窓1 + '回');
  ok(r3b.増幅器2 === 'amp_2u43' && r3b.備考2 === '現場で直した2', '★2回目の保存が入っていない → ' + JSON.stringify(r3b));
  ok(r3b.窓2 === 0, '★2回目の保存でも確かめの窓が出る（毎回聞かれる）→ ' + r3b.窓2 + '回');
  ok(r3b.ルートそのまま === true, '★ルートの写しを書き替えた（または消した）');

  /* ---------- ④ ルートにだけある写し{写真2枚・PCの備考} → 保存では読まない（リストには現場の中身だけ。ルートの写しはそのまま） ---------- */
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
  ok(r4.title === '保存しました', '★保存が止まった → ' + r4.title);
  ok(r4.リストの写真 === '' && !r4.リストの備考,
     '★保存のときに物件のすぐ下の古いファイルを読んで混ぜた（保存ではリストだけを見る）→ ' + JSON.stringify([r4.リストの写真, r4.リストの備考]));
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

  /* ---------- ㉑ まとめて保存でも、ルートの写しは読まない（③b・④ と同じ場面） ----------
     a 控えはルートの写しから取った＝リストの中身と違う → 書かずに残して知らせる（リストはそのまま）
     b ルートにだけある写し → リストには現場の中身だけ。ルートの写しはそのまま */
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
      o.a_残した = __said.some(s => /Z172S01/.test(s) && /書いていません/.test(s));
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
  ok(r21.a_残した === true && r21.a_備考 !== '現場で直した' && r21.a_増幅器 === 'amp_3u43',
     '★まとめて保存で、ルートの写しから取った控えのまま書いた（書かずに残して知らせること）→ '
     + JSON.stringify([r21.a_残した, r21.a_備考, r21.a_増幅器]));
  ok(r21.a_ルートそのまま === true && r21.a_ルートに書いた === 0, '★まとめて保存でルートの写しを書き替えた');
  ok(r21.b_覚え === 'リスト', '試験の前提: まとめて保存でリストを選べていない → ' + r21.b_覚え);
  ok(r21.b_写真 === '' && !r21.b_備考,
     '★まとめて保存で、物件のすぐ下の古いファイルを読んで混ぜた → ' + JSON.stringify([r21.b_写真, r21.b_備考]));
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
      const ep0 = _saveDirEp;
      // 開き直し：画面の中の覚えを全部捨てる
      _saveDir = null; _saveDirPar = null; _saveDirEp = ""; _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
      const g = await saveDirGet();
      o.印が戻った = !!ep0 && _saveDirEp === ep0;
      o.戻った = __same(g, list); o.親 = __same(saveDirParentOf(g), root); o.場所 = saveDirPlace();
      renderSaveBar();
      o.帯 = (document.getElementById('sb-dest') || {}).textContent || '';
      // そのまま保存する（ルートの写しは読まない）
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
  ok(r24.印が戻った === true, '★開き直すと保存先の印が替わる（今の保存先から取った控えが、次の保存で使えなくなる）');
  ok(r24.got === true && r24.写真 === 'pa',
     '★開き直したあとの保存で、物件のすぐ下の古いファイルを読んで混ぜた → ' + r24.写真);
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
      if(M._fileBase){ delete M._fileBase.from; delete M._fileBase.ep; }   // 前の版の控え（印が無い）
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
      if(M._fileBase){ delete M._fileBase.from; delete M._fileBase.ep; }   // 前の版の控え（印が無い）
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
  /* e：印の無い控え（物件を覚えていた前の版で取った）で、リストの中身と違う → 1回だけ聞く（「はい」で現場の値） */
  ok(r27.e_got === true && r27.e_増幅器 === 'amp_2u43' && r27.e_窓 === 1,
     '★物件のすぐ下から取った控えで、聞かずにリストと見比べた（または現場の値が入らない）→ ' + JSON.stringify([r27.e_増幅器, r27.e_窓]));
  /* g：前の保存先（物件）で取った控えが、リストの中身と同じ → 見比べに使う（聞かない） */
  ok(r27.g_got === true && r27.g_窓 === 0 && r27.g_備考 === '現場で直した',
     '★控えがリストの中身と同じなのに、控えを古い扱いにした（毎回確かめの窓が出る）→ '
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

  /* ---------- ㉙ ルートの写しの方が新しくても、保存ではリストだけを見る ----------
     a 前の版の現場がルートへ書いた写しを、事務所が直した（料金の扱い）。保存ではその写しを読まない
       （料金の扱いはリストの値。控えはリストと違うので1回聞き、現場の入力はそのまま入る）。
     b・c リストから開いた控え（印 list）。そのあと別の端末（前の版）がルートへ新しく書いた
       → ルートの写しは読まない。リストと控えで見比べ、聞かずに書く（1件・まとめて）。 */
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
  ok(r29.a_misc === 'include', '★保存のときに物件のすぐ下の古いファイルを読んで混ぜた → ' + r29.a_misc);
  ok(r29.a_備考 === '現場v171で書いた備考', '★現場が前の版で入れた備考が、古いリストの値に戻った → ' + r29.a_備考);
  ok(r29.a_電話 === '0176-99-9999', '★今回の現場の入力が入っていない → ' + r29.a_電話);
  ok(r29.a_写真 === 'p1,p9' && r29.a_ルートそのまま === true,
     '★リストにある写真が落ちた、またはルートの写しを書き替えた → ' + JSON.stringify([r29.a_写真, r29.a_ルートそのまま]));
  ok(r29.b_got === true && r29.b_印 === 'list', '試験の前提: リストから開けていない → ' + JSON.stringify(r29));
  ok(r29.b_増幅器 === 'amp_2u43' && r29.b_備考 === '現場で直した' && r29.b_窓 === 0,
     '★リストから取った控えなのに、ルートの写しを読んで聞いた、または値を替えた → ' + JSON.stringify([r29.b_増幅器, r29.b_備考, r29.b_窓]));
  ok(r29.c_got === true && r29.c_増幅器 === 'amp_2u43' && r29.c_備考 === '現場で直した',
     '★（まとめて保存）リストから取った控えなのに、ルートの写しを読んで値を替えた、または書かなかった → '
     + JSON.stringify([r29.c_増幅器, r29.c_備考, r29.c_知らせ]));

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

  /* ---------- ㉝ まとめて保存：出どころの確かでない控え＋あとでPCが直したリスト → 書かずに残して知らせる ----------
     ㉛ と同じ場面を「まとめて保存」で。まとめて保存は聞けないので、黙って書くと
     PCがリストで直した備考・増幅器が、この端末の古い値（ルートの写しの値）へ戻る。
     その戸別は書かない（下書きは残る＝写真も入力も減らない）。1件ずつ開いて保存するよう知らせる。
     「PCで入れた写真や工事日は、消えていません」とは言わない（書いていないので）。 */
  const r33 = await page.evaluate(async () => {
    const o = {};
    __noDir(); await __clearDrafts();
    const rootObj = JSON.parse(__caseJson('Z172Y02', { amplifier:'amp_2u43', chosho_note:'現場で書いた（前の版）',
      chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-05T00:00:00.000Z' }));
    const listObj = JSON.parse(__caseJson('Z172Y02', { amplifier:'amp_3u43', chosho_note:'PCで書いた備考',
      misc_fee:'exclude', chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-20T00:00:00.000Z' }));
    const listTxt = JSON.stringify(listObj), rootTxt = JSON.stringify(rootObj);
    const list = __mkdir('リスト', { 'Z172Y02.json': listTxt }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172Y02.json': rootTxt }, { 'リスト': list });
    await saveDirSet(list, root);
    await loadStateInto(JSON.parse(rootTxt), 'Z172Y02.json');
    if(M._fileBase) delete M._fileBase.from;
    o.控えの印 = (M._fileBase && M._fileBase.from) || '';
    M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
    await persistDraft();
    const odp = window.showDirectoryPicker;
    window.showDirectoryPicker = async () => root;
    __said.length = 0;
    try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
    o.リストそのまま = list.__files['Z172Y02.json'] === listTxt;
    o.ルートそのまま = root.__files['Z172Y02.json'] === rootTxt;
    o.書いた = list.__wrote.concat(root.__wrote).filter(n => /Z172Y02/.test(n)).join(',');   // 前の場面の下書きは数えない
    o.知らせ = __said.filter(s => /どちらの値が新しいか分からない/.test(s)).join(' / ').slice(0, 300);
    o.消えていません = __said.some(s => /PCで入れた写真や工事日は、消えていません/.test(s));
    let rec = null; try{ rec = await idbGet('no:Z172Y02'); }catch(_){}
    o.下書き = !!rec; o.渡した印 = !!(rec && rec.fileSavedAt);
    o.下書きの写真 = rec && rec.model ? __pids({ chosho_photos: rec.model.chosho_photos }) : '';
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉝まとめて保存・出どころの確かでない控え', JSON.stringify(r33));
  ok(r33.控えの印 === '', '試験の前提: 控えに印が付いている');
  ok(r33.リストそのまま === true && r33.書いた === '',
     '★（まとめて保存）出どころの確かでない控えのまま書いた（PCがリストで直した備考・増幅器が古い値へ戻る）→ ' + r33.書いた);
  ok(r33.ルートそのまま === true, '★ルートの写しを書き替えた');
  ok(/Z172Y02/.test(r33.知らせ) && /1件ずつ/.test(r33.知らせ),
     '★書かなかった戸別を知らせていない（1件ずつ開いて保存すること）→ ' + r33.知らせ);
  ok(r33.消えていません === false, '★書いていないのに「消えていません」と言った');
  ok(r33.下書き === true && r33.渡した印 === false && r33.下書きの写真 === 'p1,p2',
     '★書かなかった戸別の下書きが消えた・渡した扱いになった・写真が減った → '
     + JSON.stringify([r33.下書き, r33.渡した印, r33.下書きの写真]));

  /* ---------- ㉞ 中へ降りない所（「リスト」そのもの・「完了」などの子）と、まとめ表は台帳と見なさない ---------- */
  const r34 = await page.evaluate(async () => {
    const o = {};
    // a 「リスト」そのものを選んだ：中に戸別の多いフォルダがあっても降りない・聞かない
    __noDir(); await __clearDrafts();
    const ya = __mkdir('2024', { 'Z172V01.json':'{}', 'Z172V02.json':'{}', 'Z172V03.json':'{}' }, {});
    const la = __mkdir('リスト', { 'Z172V09.json':'{}' }, { '2024': ya });
    __said.length = 0;
    const ga = await __T(saveDirAdopt(la, { ask:true }), 5000);
    o.a_覚え = ga && ga.name; o.a_聞いた = __said.length;
    // b 「リスト」の無い物件に「完了」がある：戸別が多くても「完了」へは入らない・聞かない
    __noDir();
    const done = __mkdir('完了', { 'Z172V11.json':'{}', 'Z172V12.json':'{}', 'Z172V13.json':'{}' }, {});
    const pb = __mkdir('物件Z', { 'Z172V19.json':'{}' }, { '完了': done });
    __said.length = 0;
    const gb = await __T(saveDirAdopt(pb, { ask:true }), 5000);
    o.b_覚え = gb && gb.name; o.b_聞いた = __said.length;
    // c 中のフォルダに「受付台帳_まとめ.xlsx」（まとめ表）があっても、物件とは見なさずに読む
    __noDir();
    const yc = __mkdir('2024分', { 'Z172V21.json': __caseJson('Z172V21'), '受付台帳_まとめ.xlsx':'x' }, {});
    const pc = __mkdir('物件Y', {}, { '2024分': yc });
    await saveDirSet(pc, null);
    const hc = await __T(caseFileFromDir(pc, 'Z172V21'), 5000);
    o.c_読めた = !!(hc && hc.data && hc.data.chosho_mgmt_no === 'Z172V21');
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉞降りない所・まとめ表', JSON.stringify(r34));
  ok(r34.a_覚え === 'リスト' && r34.a_聞いた === 0,
     '★「リスト」そのものを選んだのに、中のフォルダへ降りた（または聞いた）→ ' + JSON.stringify([r34.a_覚え, r34.a_聞いた]));
  ok(r34.b_覚え === '物件Z' && r34.b_聞いた === 0,
     '★「完了」を保存先の候補にした（終わった分の置き場へ書く）→ ' + JSON.stringify([r34.b_覚え, r34.b_聞いた]));
  ok(r34.c_読めた === true, '★まとめ表（.xlsx）を受付台帳と見なして、その中の戸別を読まなかった');

  /* ---------- ㉟ 控えが使えないとき、欄ごとの決まりで現場の値が黙って残る所（第6回） ----------
     控えの出どころが確かでないと、融合は欄ごとの決まり（TVの台数・測定値・材料）で「現場が触ったか」を推し量る。
     その決まりで現場の値が残っても「この端末の値」として数えないと、まとめて保存が黙って書き、
     PCがリストで直した値が戻る。書くとファイルの値が1つでも変わるなら、書かずに残すこと。
     a TVの台数 / b 測定値 / c 材料（控えが使えない）/ d 材料（控えが無い：前の版から）
     e 保存先を選ぶ画面の道（許可が切れた）でも、すぐ下の写しから取った控えなら1回聞く
     f 前に読み返しが合わず古い扱いになっている控え＋すぐ下の写し → まとめて保存で書かない */
  const r35 = await page.evaluate(async () => {
    const o = {};
    const bulk = async (root) => {
      const odp = window.showDirectoryPicker;
      window.showDirectoryPicker = async () => root;
      __said.length = 0;
      try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
    };
    const setup = async (no, rootOver, listOver, from) => {
      __noDir(); await __clearDrafts();
      const rootTxt = rootOver ? __caseJson(no, Object.assign({ chosho_photos:[ __ph('p1', '#c33') ],
        editedAt:'2026-09-05T00:00:00.000Z' }, rootOver)) : null;
      const listTxt = __caseJson(no, Object.assign({ chosho_photos:[ __ph('p1', '#c33') ],
        editedAt:'2026-09-20T00:00:00.000Z' }, listOver));
      const list = __mkdir('リスト', { [no + '.json']: listTxt }, {});
      const rf = { '現場用_物件.json':'{}' }; if(rootTxt) rf[no + '.json'] = rootTxt;
      const root = __mkdir('物件', rf, { 'リスト': list });
      await saveDirSet(list, root);
      return { list, root, listTxt, rootTxt };
    };
    const openFrom = async (txt, no, from) => {
      await loadStateInto(JSON.parse(txt), no + '.json');
      if(M._fileBase){ if(from) M._fileBase.from = from; else delete M._fileBase.from; }
    };
    const held = no => __said.some(s => new RegExp(no).test(s) && /書いていません/.test(s));
    const draftOf = async no => { try{ return await idbGet('no:' + no); }catch(_){ return null; } };
    // a TVの台数：前の版の現場はすぐ下の写しに1台。PCがリストで3台に直した。現場は写真を足しただけ
    {
      const x = await setup('Z172L01', { tv_count:'1', survey_done:false }, { tv_count:'3', survey_done:false });
      await openFrom(x.rootTxt, 'Z172L01', '');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true; await persistDraft();
      await bulk(x.root);
      o.a_TV = (__read(x.list, 'Z172L01.json') || {}).tv_count; o.a_残した = held('Z172L01');
    }
    // b 測定値：すぐ下の写しに60、PCがリストで66に直した
    {
      const mA = v => ({ channels:['14-2ch'], antenna:[{ db:v, mer:'', ber:'' }] });
      const x = await setup('Z172L02', { measurements: mA('60') }, { measurements: mA('66') });
      await openFrom(x.rootTxt, 'Z172L02', '');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true; await persistDraft();
      await bulk(x.root);
      const j = __read(x.list, 'Z172L02.json') || {};
      o.b_測定 = (((j.measurements || {}).antenna || [])[0] || {}).db; o.b_残した = held('Z172L02');
    }
    // c 材料（控えが使えない）：ファイルは下見済み。現場は増幅器だけ直した
    {
      // リストとの違いは PC だけの欄（料金の扱い）だけ＝この端末の値として数えるものは材料のほかに無い
      const x = await setup('Z172L03', { survey_done:true }, { survey_done:true, misc_fee:'exclude' });
      await openFrom(x.rootTxt, 'Z172L03', '');
      M.amplifier = 'amp_2u43'; M._touched = true; await persistDraft();
      await bulk(x.root);
      const d = await draftOf('Z172L03');
      o.c_リスト増幅器 = (__read(x.list, 'Z172L03.json') || {}).amplifier;
      o.c_下書き増幅器 = d && d.model && d.model.amplifier; o.c_渡した = !!(d && d.fileSavedAt);
      o.c_残した = held('Z172L03');
    }
    // d 材料（控えが無い＝前の版からの道）：ファイルは下見済み・PCの増幅器。現場は増幅器を入れた
    {
      const x = await setup('Z172L04', null, { survey_done:true });
      M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'Z172L04';
      M.amplifier = 'amp_2u43'; M._touched = true; M._viewOnly = false; await persistDraft();
      await bulk(x.root);
      const d = await draftOf('Z172L04');
      o.d_リスト増幅器 = (__read(x.list, 'Z172L04.json') || {}).amplifier;
      o.d_下書き増幅器 = d && d.model && d.model.amplifier; o.d_渡した = !!(d && d.fileSavedAt);
      o.d_知らせ = __said.filter(s => /Z172L04/.test(s) && /下見の内容/.test(s)).join(' / ').slice(0, 400);
    }
    // e 許可が切れて「保存先を選ぶ画面」の道：控えはすぐ下の写しから（印 root）、選んだのはリストのファイル
    {
      const x = await setup('Z172L05', { amplifier:'amp_2u43', chosho_note:'現場で書いた（前の版）' },
                                       { amplifier:'amp_3u43', chosho_note:'PCで書いた備考' });
      await openFrom(x.rootTxt, 'Z172L05', 'root');
      o.e_印 = (M._fileBase && M._fileBase.from) || '';
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      const fh = await x.list.getFileHandle('Z172L05.json');
      saveDirGet = async () => null; saveDirOk = async () => false;   // 覚えている保存先はそのまま（許可だけ切れた）
      window.showSaveFilePicker = async () => fh;
      __said.length = 0;
      try{ await __T(saveJsonRun(), 8000); }
      finally { saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; }
      o.e_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
      const j = __read(x.list, 'Z172L05.json') || {};
      o.e_写真 = __pids(j); o.e_備考 = j.chosho_note;
    }
    // f 控えが前から古い扱い（読み返しが合わなかった）＋すぐ下の写しもある → まとめて保存で書かない
    {
      const x = await setup('Z172L06', { chosho_note:'前の版' }, { chosho_note:'PCの直し' });
      await openFrom(x.listTxt, 'Z172L06', 'list');
      if(M._fileBase) M._fileBase.stale = true;
      M.chosho_note = '現場で直した'; M._touched = true; await persistDraft();
      await bulk(x.root);
      o.f_備考 = (__read(x.list, 'Z172L06.json') || {}).chosho_note; o.f_残した = held('Z172L06');
    }
    // g 1件ずつの保存でも、TVの台数のように「この端末の値」と数えない欄で黙って戻さない（1回聞く）
    {
      const x = await setup('Z172L07', { tv_count:'1', survey_done:false }, { tv_count:'3', survey_done:false });
      await openFrom(x.rootTxt, 'Z172L07', '');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.g_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s) && /TV/.test(s)).length;
      o.g_写真 = __pids(__read(x.list, 'Z172L07.json'));
    }
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㉟欄ごとの決まりで現場の値が残る所', JSON.stringify(r35));
  ok(r35.g_窓 === 1 && r35.g_写真 === 'p1,p2',
     '★（1件ずつの保存）控えが使えないのに、TVの台数を黙ってこの端末の値にした（聞かなかった）→ '
     + JSON.stringify([r35.g_窓, r35.g_写真]));
  ok(r35.a_TV === '3' && r35.a_残した === true,
     '★（まとめて保存）PCがリストで直したTVの台数が、黙ってこの端末の古い値へ戻った → ' + JSON.stringify([r35.a_TV, r35.a_残した]));
  ok(r35.b_測定 === '66' && r35.b_残した === true,
     '★（まとめて保存）PCがリストで直した測定値が、黙ってこの端末の古い値へ戻った → ' + JSON.stringify([r35.b_測定, r35.b_残した]));
  ok(r35.c_下書き増幅器 === 'amp_2u43' && r35.c_渡した === false && r35.c_残した === true,
     '★（まとめて保存・控えが使えない）この端末の材料が下書きから消えた／渡した扱いになった → '
     + JSON.stringify([r35.c_リスト増幅器, r35.c_下書き増幅器, r35.c_渡した, r35.c_残した]));
  ok(r35.d_下書き増幅器 === 'amp_2u43' && r35.d_渡した === false && /書いていません/.test(r35.d_知らせ) && /材料/.test(r35.d_知らせ),
     '★（まとめて保存・控えが無い）この端末の材料が下書きから消えた、または書かなかったことを知らせていない → '
     + JSON.stringify([r35.d_リスト増幅器, r35.d_下書き増幅器, r35.d_渡した, r35.d_知らせ]));
  ok(r35.e_印 === 'root', '試験の前提: 控えの印が root になっていない → ' + r35.e_印);
  ok(r35.e_窓 === 1 && r35.e_写真 === 'p1,p2',
     '★保存先を選ぶ画面の道で、すぐ下の写しから取った控えのまま見比べ、黙ってリストの値にした → '
     + JSON.stringify([r35.e_窓, r35.e_写真, r35.e_備考]));
  ok(r35.f_備考 === 'PCの直し' && r35.f_残した === true,
     '★（まとめて保存）古い扱いの控え＋すぐ下の写しで、PCの直しを黙って戻した → ' + JSON.stringify([r35.f_備考, r35.f_残した]));

  /* ---------- ㊱ すぐ下の古い写しは、足りない写真を足すだけ（名前・印を戻さない）／リストを選び直しても親を忘れない ----------
     a リストとすぐ下の両方に同じ戸別。現場で p1 に名前を付け「工事調書に載せる」印を付けて保存 → 備考だけ直して保存。
       すぐ下の古い写し（名前 p1・印なし）を控えと見比べると「PCが直した」と読み違え、保存のたびに入れ替わる。
     b まとめて保存で、覚えている「リスト」をもう一度選ぶ → 親（物件）を忘れない。案内にも「物件 ＞ リスト」 */
  const r36 = await page.evaluate(async () => {
    const o = {};
    __noDir(); await __clearDrafts();
    const listTxt = __caseJson('Z172P01', { chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-20T00:00:00.000Z' });
    const rootTxt = __caseJson('Z172P01', { chosho_photos:[ __ph('p1', '#c33'), __ph('p2', '#3a6') ], editedAt:'2026-09-05T00:00:00.000Z' });
    const list = __mkdir('リスト', { 'Z172P01.json': listTxt }, {});
    const root = __mkdir('物件', { '現場用_物件.json':'{}', 'Z172P01.json': rootTxt }, { 'リスト': list });
    await saveDirSet(list, root);
    M = freshModel(); M.chosho_mgmt_no = 'Z172P01'; M._viewOnly = true;
    o.a_got = await __T(pcGuardAutoLoad());
    const p1 = (M.chosho_photos || []).find(p => String(p.id) === 'p1');
    if(p1){ p1.label = '屋根アンテナ'; p1.chosho = true; }
    M._touched = true;
    const look = () => { const j = __read(list, 'Z172P01.json') || {};
      const q = (j.chosho_photos || []).find(p => String(p.id) === 'p1') || {};
      return (q.label || '') + '/' + (q.chosho ? '印あり' : '印なし'); };
    o.a_回 = [];
    for(let i = 1; i <= 3; i++){
      M.chosho_note = '直し' + i; M._touched = true;
      await __T(saveJsonRun(), 8000);
      o.a_回.push(look());
    }
    o.a_写真 = __pids(__read(list, 'Z172P01.json'));
    o.a_ルートそのまま = root.__files['Z172P01.json'] === rootTxt;
    // b
    await __clearDrafts();
    await saveDirSet(list, root);
    __mine('Z172P02'); await persistDraft();
    const odp = window.showDirectoryPicker;
    window.showDirectoryPicker = async () => __copyDir(list);    // 本物と同じく、選ぶたびに別の取っ手
    __said.length = 0;
    try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
    o.b_覚え = saveDirPlace();
    o.b_案内 = /前回は「物件 ＞ リスト」/.test(__said.join(' / '));
    o.b_書いた = Object.keys(list.__files).includes('Z172P02.json');
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㊱すぐ下の写しの名前・印／リストの選び直し', JSON.stringify(r36));
  ok(r36.a_got === true, '試験の前提: リストから開けていない');
  ok(r36.a_回.every(x => x === '屋根アンテナ/印あり'),
     '★すぐ下の古い写しで、写真の名前・「工事調書に載せる」印が保存のたびに戻る → ' + JSON.stringify(r36.a_回));
  ok(r36.a_写真 === 'p1' && r36.a_ルートそのまま === true,
     '★保存のときに物件のすぐ下の古いファイルを読んで混ぜた、またはすぐ下の写しを書き替えた → ' + JSON.stringify([r36.a_写真, r36.a_ルートそのまま]));
  ok(r36.b_覚え === '物件 ＞ リスト' && r36.b_書いた === true,
     '★まとめて保存で覚えている「リスト」を選び直すと、親（物件）を忘れた → ' + JSON.stringify([r36.b_覚え, r36.b_書いた]));
  ok(r36.b_案内 === true, '★まとめて保存の案内で、前回の保存先を「物件 ＞ リスト」と出していない');

  /* ---------- ㊲ 第7回：物件の許可が無い／保存先を選ぶ画面の道／使えない控えと写真の名前・印／すぐ下の写しが無い古い控え ----------
     a ブラウザを開き直して、リストの許可だけ戻り物件（親）の許可が無い。すぐ下の写しを読めないのに「写しは無い」として
       すぐ下の写しから取った控えで見比べると、現場の入力が黙ってリストの古い値へ戻る。→ 1件保存は1回聞く・まとめて保存は書かない
     b 保存先を選ぶ画面の道（許可が切れた）で、前の版の控え（印の欄が無い）→ 1回聞く
     c 保存先を選ぶ画面の道で、控えが無い → 覚えているフォルダの道と同じく1回聞く
     d 控えが使えないとき、土台のファイルの写真の名前・印を控えで見比べない（現場が付けた名前・印が消える）
     e 前に読み返しが合わず古い扱いの控え・すぐ下の写しは無い → まとめて保存で PC の直しを戻さない */
  const r37 = await page.evaluate(async () => {
    const o = {};
    const bulk = async (pick) => {
      const odp = window.showDirectoryPicker;
      window.showDirectoryPicker = async () => pick;
      __said.length = 0;
      try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
    };
    const asked = () => __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    const pair = (no, rootOver, listOver) => {
      const rootTxt = __caseJson(no, Object.assign({ amplifier:'amp_2u43', chosho_note:'現場で書いた（前の版）',
        chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-05T00:00:00.000Z' }, rootOver || {}));
      const listTxt = __caseJson(no, Object.assign({ amplifier:'amp_3u43', chosho_note:'PCで書いた備考（古い）',
        chosho_photos:[ __ph('p1', '#c33') ], editedAt:'2026-09-20T00:00:00.000Z' }, listOver || {}));
      const list = __mkdir('リスト', { [no + '.json']: listTxt }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}', [no + '.json']: rootTxt }, { 'リスト': list });
      return { list, root, listTxt, rootTxt };
    };
    const openUnmarked = async (txt, no) => {
      await loadStateInto(JSON.parse(txt), no + '.json');
      if(M._fileBase) delete M._fileBase.from;               // 前の版の控え（印の欄が無い）
    };
    // a1 1件保存
    {
      __noDir(); await __clearDrafts();
      const x = pair('Z172J01');
      await saveDirSet(x.list, x.root);
      x.root.__perm = 'prompt';
      await openUnmarked(x.rootTxt, 'Z172J01');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.a1_窓 = asked(); o.a1_物件に聞いた = x.root.__asked;
      o.a1_写真 = __pids(__read(x.list, 'Z172J01.json'));
    }
    // a2 まとめて保存（リストを選び直す＝物件の許可は戻らない）
    {
      __noDir(); await __clearDrafts();
      const x = pair('Z172J02');
      await saveDirSet(x.list, x.root);
      x.root.__perm = 'prompt';
      await openUnmarked(x.rootTxt, 'Z172J02');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true; await persistDraft();
      await bulk(__copyDir(x.list));
      o.a2_覚え = saveDirPlace();
      o.a2_リストそのまま = x.list.__files['Z172J02.json'] === x.listTxt;
      o.a2_残した = __said.some(s => /Z172J02/.test(s) && /書いていません/.test(s));
    }
    // b 保存先を選ぶ画面の道＋前の版の控え（すぐ下の写しから取った中身）
    const viaPicker = async (fh) => {
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      saveDirGet = async () => null; saveDirOk = async () => false;   // 覚えている保存先はそのまま（許可だけ切れた）
      window.showSaveFilePicker = async () => fh;
      __said.length = 0;
      try{ return await __T(saveJsonRun(), 8000); }
      finally { saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; }
    };
    {
      __noDir(); await __clearDrafts();
      const x = pair('Z172J03');
      await saveDirSet(x.list, x.root);
      await openUnmarked(x.rootTxt, 'Z172J03');
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      await viaPicker(await x.list.getFileHandle('Z172J03.json'));
      o.b_窓 = asked(); o.b_写真 = __pids(__read(x.list, 'Z172J03.json'));
    }
    // c 保存先を選ぶ画面の道＋控えが無い（この端末で備考を入れた）
    {
      __noDir(); await __clearDrafts();
      const x = pair('Z172J04');
      await saveDirSet(x.list, x.root);
      __mine('Z172J04'); M.chosho_note = '現場の備考';
      await viaPicker(await x.list.getFileHandle('Z172J04.json'));
      o.c_窓 = asked(); o.c_写真 = __pids(__read(x.list, 'Z172J04.json'));
    }
    // d 使えない控え（すぐ下の写しから取った・前の版）で、現場が前の版で付けた写真の名前・印
    {
      __noDir(); await __clearDrafts();
      const x = pair('Z172J05', { chosho_photos:[ Object.assign(__ph('p1', '#c33'), { label:'屋根の上', chosho:true }) ] });
      await saveDirSet(x.list, x.root);
      await openUnmarked(x.rootTxt, 'Z172J05');
      M.chosho_note = '現場の直し'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      const j = __read(x.list, 'Z172J05.json') || {};
      const q = (j.chosho_photos || []).find(p => String(p.id) === 'p1') || {};
      o.d_p1 = (q.label || '') + '/' + (q.chosho ? '印あり' : '印なし');
    }
    // e 古い扱いの控え・すぐ下の写しは無い（親を覚えていない）。PCがリストで測定値を66に直した
    {
      __noDir(); await __clearDrafts();
      const mA = v => ({ channels:['14-2ch'], antenna:[{ db:v, mer:'', ber:'' }] });
      const t0 = __caseJson('Z172J06', { measurements: mA('60'), chosho_photos:[ __ph('p1', '#c33') ] });
      const t1 = __caseJson('Z172J06', { measurements: mA('66'), chosho_photos:[ __ph('p1', '#c33') ],
        editedAt:'2026-09-21T00:00:00.000Z' });
      const list = __mkdir('リスト', { 'Z172J06.json': t1 }, {});
      await loadStateInto(JSON.parse(t0), 'Z172J06.json');
      if(M._fileBase) M._fileBase.stale = true;
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true; await persistDraft();
      await bulk(list);
      const j = __read(list, 'Z172J06.json') || {};
      o.e_測定 = (((j.measurements || {}).antenna || [])[0] || {}).db;
      o.e_残した = __said.some(s => /Z172J06/.test(s) && /書いていません/.test(s));
    }
    // f 同じ場面を1件ずつの保存で：この端末の値と数えない欄（測定値）でも1回聞く
    {
      __noDir(); await __clearDrafts();
      const mA = v => ({ channels:['14-2ch'], antenna:[{ db:v, mer:'', ber:'' }] });
      const t0 = __caseJson('Z172J07', { measurements: mA('60'), chosho_photos:[ __ph('p1', '#c33') ] });
      const t1 = __caseJson('Z172J07', { measurements: mA('66'), chosho_photos:[ __ph('p1', '#c33') ],
        editedAt:'2026-09-21T00:00:00.000Z' });
      const list = __mkdir('リスト', { 'Z172J07.json': t1 }, {});
      await saveDirSet(list, null);
      await loadStateInto(JSON.parse(t0), 'Z172J07.json');
      if(M._fileBase) M._fileBase.stale = true;
      M.chosho_photos.push(__ph('p2', '#3a6')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.f_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s) && /測定値/.test(s)).length;
    }
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㊲第7回', JSON.stringify(r37));
  ok(r37.a1_窓 === 1 && r37.a1_物件に聞いた === 0 && r37.a1_写真 === 'p1,p2',
     '★物件の許可が無いとき、すぐ下の写しから取った控えのまま見比べた（聞かなかった）→ '
     + JSON.stringify([r37.a1_窓, r37.a1_物件に聞いた, r37.a1_写真]));
  ok(r37.a2_覚え === '物件 ＞ リスト', '試験の前提: リストを選び直して親を忘れた → ' + r37.a2_覚え);
  ok(r37.a2_リストそのまま === true && r37.a2_残した === true,
     '★（まとめて保存）物件の許可が無いとき、すぐ下の写しから取った控えのまま書いた → '
     + JSON.stringify([r37.a2_リストそのまま, r37.a2_残した]));
  ok(r37.b_窓 === 1 && r37.b_写真 === 'p1,p2',
     '★保存先を選ぶ画面の道で、前の版の控え（どこから取ったか分からない）のまま見比べた → ' + JSON.stringify([r37.b_窓, r37.b_写真]));
  ok(r37.c_窓 === 1 && r37.c_写真 === 'p1',
     '★保存先を選ぶ画面の道で、控えが無いのに聞かずに置き換えた → ' + JSON.stringify([r37.c_窓, r37.c_写真]));
  ok(r37.d_p1 === '屋根の上/印あり',
     '★使えない控えで写真の名前・「工事調書に載せる」印を見比べ、現場が付けたものを消した → ' + r37.d_p1);
  ok(r37.f_窓 === 1, '★（1件ずつの保存）古い扱いの控え（すぐ下の写し無し）で、測定値を聞かずに置き換えた → ' + r37.f_窓);
  ok(r37.e_測定 === '66' && r37.e_残した === true,
     '★（まとめて保存）古い扱いの控え（すぐ下の写し無し）で、PCが直した測定値を黙って戻した → ' + JSON.stringify([r37.e_測定, r37.e_残した]));

  /* ---------- ㊳ 第8回：ふつうの流れで聞きすぎない／使えない控えのときの写真の名前・印 ----------
     a1 リストから開く → 許可が切れて「保存先を選ぶ画面」でリストのファイルへ保存 → 控えの印は list のまま。
        そのあと物件（親）の許可だけ戻らない。PCがリストで備考を直し、現場は電話を直して保存 → 聞かない・両方残る
     a2 📂 で読んだ控え（印 ""）＋物件の許可が無い → 同じく聞かない・両方残る
     b  控えが使えない（すぐ下の写しから取った前の版の控え）。PCがリストで写真の名前を直し、印を外した。
        現場は写真を1枚足しただけ → 1件保存は「写真の名前・工事調書の印」を確かめる・まとめて保存は書かない */
  const r38 = await page.evaluate(async () => {
    const o = {};
    const asked = () => __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    const pcEdit = (dir, no, over) => {
      const j = JSON.parse(dir.__files[no + '.json']);
      dir.__files[no + '.json'] = JSON.stringify(Object.assign(j, over, { editedAt: new Date(Date.now() + 60000).toISOString() }));
    };
    const viaPicker = async (fh) => {
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      saveDirGet = async () => null; saveDirOk = async () => false;   // 覚えている保存先はそのまま（許可だけ切れた）
      window.showSaveFilePicker = async () => fh;
      __said.length = 0;
      try{ return await __T(saveJsonRun(), 8000); }
      finally { saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; }
    };
    // a1
    {
      __noDir(); await __clearDrafts();
      const list = __mkdir('リスト', { 'Z172H01.json': __caseJson('Z172H01') }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      await saveDirSet(list, root);
      M = freshModel(); M.chosho_mgmt_no = 'Z172H01'; M._viewOnly = true;
      o.a1_got = await __T(pcGuardAutoLoad());
      M.chosho_cust_addr = '現場で直した住所'; M._touched = true;
      await viaPicker(await list.getFileHandle('Z172H01.json'));
      o.a1_印 = (M._fileBase && M._fileBase.from) || '';
      await saveDirSet(list, root);
      root.__perm = 'prompt';
      pcEdit(list, 'Z172H01', { chosho_note:'PCがあとで直した備考' });
      M.chosho_cust_tel = '0176-11-2222'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      const j = __read(list, 'Z172H01.json') || {};
      o.a1_窓 = asked(); o.a1_備考 = j.chosho_note; o.a1_電話 = j.chosho_cust_tel;
    }
    // a2
    {
      __noDir(); await __clearDrafts();
      const txt = __caseJson('Z172H02');
      const list = __mkdir('リスト', { 'Z172H02.json': txt }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      await loadStateInto(JSON.parse(txt), 'Z172H02.json');
      o.a2_印 = (M._fileBase && ('from' in M._fileBase)) ? ('"' + M._fileBase.from + '"') : '（欄なし）';
      await saveDirSet(list, root);
      root.__perm = 'prompt';
      pcEdit(list, 'Z172H02', { chosho_note:'PCがあとで直した備考' });
      M.chosho_cust_tel = '0176-11-3333'; M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      const j = __read(list, 'Z172H02.json') || {};
      o.a2_窓 = asked(); o.a2_備考 = j.chosho_note; o.a2_電話 = j.chosho_cust_tel;
    }
    // b
    const mkB = (no) => {
      const rootTxt = __caseJson(no, { chosho_photos:[ Object.assign(__ph('p1', '#c33'), { label:'屋根' }),
        Object.assign(__ph('p2', '#3a6'), { chosho:true }) ], editedAt:'2026-09-05T00:00:00.000Z' });
      const listTxt = __caseJson(no, { misc_fee:'exclude', chosho_photos:[ Object.assign(__ph('p1', '#c33'), { label:'屋根（施工前）' }),
        __ph('p2', '#3a6') ], editedAt:'2026-09-20T00:00:00.000Z' });
      const list = __mkdir('リスト', { [no + '.json']: listTxt }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}', [no + '.json']: rootTxt }, { 'リスト': list });
      return { list, root, listTxt, rootTxt };
    };
    {
      __noDir(); await __clearDrafts();
      const x = mkB('Z172H03');
      await saveDirSet(x.list, x.root);
      await loadStateInto(JSON.parse(x.rootTxt), 'Z172H03.json');
      if(M._fileBase) delete M._fileBase.from;
      M.chosho_photos.push(__ph('p3', '#36c')); M._touched = true;
      __said.length = 0;
      await __T(saveJsonRun(), 8000);
      o.b1_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s) && /写真の名前/.test(s)).length;
      o.b1_写真 = __pids(__read(x.list, 'Z172H03.json'));
    }
    {
      __noDir(); await __clearDrafts();
      const x = mkB('Z172H04');
      await saveDirSet(x.list, x.root);
      await loadStateInto(JSON.parse(x.rootTxt), 'Z172H04.json');
      if(M._fileBase) delete M._fileBase.from;
      M.chosho_photos.push(__ph('p3', '#36c')); M._touched = true; await persistDraft();
      const odp = window.showDirectoryPicker;
      window.showDirectoryPicker = async () => x.root;
      __said.length = 0;
      try{ await __T(saveAllDrafts(), 10000); } finally { window.showDirectoryPicker = odp; }
      o.b2_リストそのまま = x.list.__files['Z172H04.json'] === x.listTxt;
      o.b2_残した = __said.some(s => /Z172H04/.test(s) && /書いていません/.test(s));
    }
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㊳第8回', JSON.stringify(r38));
  ok(r38.a1_got === true && r38.a1_印 === 'list', '★保存先を選ぶ画面でリストのファイルへ書いたあと、控えの印 list が落ちた → ' + JSON.stringify([r38.a1_got, r38.a1_印]));
  ok(r38.a1_窓 === 0 && r38.a1_備考 === 'PCがあとで直した備考' && r38.a1_電話 === '0176-11-2222',
     '★ふつうの流れ（物件の許可だけ戻らない）で聞いた、またはPCの直し・現場の直しが残らない → '
     + JSON.stringify([r38.a1_窓, r38.a1_備考, r38.a1_電話]));
  ok(r38.a2_印 === '""', '試験の前提: 📂 で読んだ控えの印が "" でない → ' + r38.a2_印);
  /* a2：📂 で読んだ控えは、どこから取ったか分からない。PCがあとでリストを直していれば1回だけ聞く */
  ok(r38.a2_窓 === 1 && r38.a2_電話 === '0176-11-3333',
     '★📂 で読んだ控え（どこから取ったか分からない）で、聞かずにリストと見比べた → '
     + JSON.stringify([r38.a2_窓, r38.a2_備考, r38.a2_電話]));
  ok(r38.b1_窓 === 1 && r38.b1_写真 === 'p1,p2,p3',
     '★（1件ずつの保存）控えが使えないのに、写真の名前・印を黙って替えた（確かめに出ない）→ ' + JSON.stringify([r38.b1_窓, r38.b1_写真]));
  ok(r38.b2_リストそのまま === true && r38.b2_残した === true,
     '★（まとめて保存）控えが使えないのに、写真の名前・印を黙って替えて書いた → ' + JSON.stringify([r38.b2_リストそのまま, r38.b2_残した]));

  /* ---------- ㊴ 第9回：保存ではリストだけを見る（利用者の決め）。控えは「今の保存先の印」か「ファイルと同じ中身」で使う ----------
     a 同じリストを選び直しても印は替わらない → PCがあとで直しても聞かずに両方残る。別の物件へ替えて戻ると印が替わる → 1回聞く
     b ファイルはあるのに、いま読めない → 書かない（1件・まとめて）。写真が減らない
     c まとめて保存で、開いている戸別は画面の中身で書き、控えも画面で取り直す → 続けて直して、もう一度まとめて保存しても書ける
     d まとめて保存は融合のあとの中身を書く（PCが外した完了書なし・直した写真の名前・外した印を戻さない）。2回目の保存でも戻さない
     e まとめて保存で、PCとこの端末の両方で直した工事日・備考 → 書かずに残す（この端末の値を下書きから消さない）
     f 許可が切れたときの「保存先を選ぶ画面」は、覚えているリストから開く
     g 同じ戸別の別名ファイルからは写真を足すだけ（PCが消した欄を戻さない）
     h 📂 で読んだ控えで、PCがあとで写真の名前だけ直した → 控えはファイルと違う＝1回聞く
     i 📂 で同じ戸別を読み直したとき、PCが外した工事調書の印を画面で戻さない
     j 保存先を覚えていない端末（保存先を選ぶ画面だけで保存する）は、今までどおり控えで見比べる（聞かない） */
  const r39 = await page.evaluate(async () => {
    const o = {};
    const asked = () => __said.filter(s => /PCのファイルに中身が入っています/.test(s)).length;
    const phl = (id, c, lab, ch) => { const q = __ph(id, c); q.label = lab; if(ch) q.chosho = true; return q; };
    const labs = j => ((j && j.chosho_photos) || []).map(q => q.id + ':' + q.label + ':' + (q.chosho ? '印' : '-')).sort().join(' ');
    const bulk = async d => { const odp = window.showDirectoryPicker; window.showDirectoryPicker = async () => d;
      __said.length = 0; try{ await __T(saveAllDrafts(), 12000); } finally { window.showDirectoryPicker = odp; } };
    const pcSet = (dir, no, over) => {
      const j = JSON.parse(dir.__files[no + '.json']);
      dir.__files[no + '.json'] = JSON.stringify(Object.assign(j, over, { editedAt: new Date(Date.now() + 60000).toISOString() }));
    };
    const mk = (no, over, extra) => {
      const list = __mkdir('リスト', Object.assign({ [no + '.json']: __caseJson(no, over || {}) }, extra || {}), {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      return { list, root };
    };
    const openAuto = async no => { M = freshModel(); M.chosho_mgmt_no = no; M._viewOnly = true; return await __T(pcGuardAutoLoad()); };
    // a
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G01');
      await saveDirSet(x.list, x.root);
      const ep0 = _saveDirEp;
      o.a_got = await openAuto('Z172G01');
      o.a_控えの印 = !!ep0 && !!M._fileBase && M._fileBase.ep === ep0;
      await saveDirAdopt(__copyDir(x.list), { ask:false });          // 同じリストを選び直す（本物と同じく別の取っ手）
      o.a_同じ印 = _saveDirEp === ep0;
      pcSet(x.list, 'Z172G01', { chosho_note:'PCがあとで直した備考' });
      M.chosho_cust_tel = '0176-12-0001'; M._touched = true;
      __said.length = 0; await __T(saveJsonRun(), 8000);
      const j1 = __read(x.list, 'Z172G01.json') || {};
      o.a_窓1 = asked(); o.a_備考1 = j1.chosho_note; o.a_電話1 = j1.chosho_cust_tel;
      const y = mk('Z172G99');
      await saveDirSet(y.list, y.root);                               // 別の物件へ替えて
      await saveDirSet(x.list, x.root);                               // 戻る
      o.a_替わった = _saveDirEp !== ep0;
      pcSet(x.list, 'Z172G01', { chosho_note:'PCがもう一度直した備考' });
      M.chosho_cust_addr = '現場で直した住所'; M._touched = true;
      __said.length = 0; await __T(saveJsonRun(), 8000);
      o.a_窓2 = asked();
    }
    // b
    for(const path of ['single', 'bulk']){
      __noDir(); await __clearDrafts();
      const no = 'Z172G0' + (path === 'single' ? '2' : '3');
      const x = mk(no, { chosho_photos:[ __ph('p1', '#c33'), __ph('p2', '#3a6'), __ph('p3', '#36c') ] });
      await saveDirSet(x.list, x.root);
      __mine(no); await persistDraft();
      let failed = 0;
      const ogf = x.list.getFileHandle;
      x.list.getFileHandle = async (nm, opt) => {
        const h = await ogf(nm, opt);
        if(nm !== no + '.json') return h;
        return Object.assign({}, h, { getFile: async () => { const f = await h.getFile();
          if(!failed){ failed++; return Object.assign({}, f, { text: async () => { const e = new Error('could not be read'); e.name = 'NotReadableError'; throw e; } }); }
          return f; } });
      };
      _lastSaveInfo = null; __said.length = 0;
      if(path === 'single') await __T(saveJsonRun(), 8000); else await bulk(x.list);
      x.list.getFileHandle = ogf;
      o['b_' + path + '_写真'] = __pids(__read(x.list, no + '.json'));
      o['b_' + path + '_知らせ'] = path === 'single' ? ((_lastSaveInfo && _lastSaveInfo.title) || '')
        : __said.filter(s => /いま読めない/.test(s)).join(' / ').slice(0, 80);
    }
    // c
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G04');
      await saveDirSet(x.list, x.root);
      await loadStateInto(JSON.parse(x.list.__files['Z172G04.json']), 'Z172G04.json');   // 📂 で読んだ（印なし）
      M.chosho_cust_tel = '0176-12-0004'; M._touched = true; await persistDraft();
      await bulk(x.list);
      o.c_1回目 = (__read(x.list, 'Z172G04.json') || {}).chosho_cust_tel;
      M.chosho_cust_addr = '続けて直した住所'; M._touched = true; await persistDraft();
      await bulk(x.list);
      o.c_2回目 = (__read(x.list, 'Z172G04.json') || {}).chosho_cust_addr;
      o.c_残した = __said.some(s => /Z172G04/.test(s) && /書いていません/.test(s));
    }
    // d
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G05', { compdoc_waived:'yes', compdoc_waived_at:'2026-09-01',
        chosho_photos:[ phl('p1', '#c33', '屋根', true), phl('p2', '#3a6', '分配器', true) ] });
      await saveDirSet(x.list, x.root);
      o.d_got = await openAuto('Z172G05');
      const j0 = JSON.parse(x.list.__files['Z172G05.json']);
      delete j0.compdoc_waived; delete j0.compdoc_waived_at;
      j0.chosho_photos = [ phl('p1', '#c33', '屋根（施工前）', true), phl('p2', '#3a6', '分配器', false) ];
      j0.editedAt = new Date(Date.now() + 60000).toISOString();
      x.list.__files['Z172G05.json'] = JSON.stringify(j0);            // PCが完了書なしを外し、p1 の名前を直し、p2 の印を外した
      M.chosho_cust_tel = '0176-12-0005'; M._touched = true; await persistDraft();
      await bulk(x.list);
      const j1 = __read(x.list, 'Z172G05.json') || {};
      o.d_1回目 = [j1.compdoc_waived || '(無し)', labs(j1), j1.chosho_cust_tel];
      M.chosho_cust_addr = '現場で直した住所'; M._touched = true;
      __said.length = 0; await __T(saveJsonRun(), 8000);
      const j2 = __read(x.list, 'Z172G05.json') || {};
      o.d_2回目 = [j2.compdoc_waived || '(無し)', labs(j2), j2.chosho_cust_addr];
      o.d_窓 = asked();
    }
    // e
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G06', { chosho_note:'元の備考', chosho_date:'2026-09-20' });
      await saveDirSet(x.list, x.root);
      o.e_got = await openAuto('Z172G06');
      pcSet(x.list, 'Z172G06', { chosho_note:'PCが直した備考', chosho_date:'2026-10-01' });
      M.chosho_note = '現場で書いた大事な備考'; M.chosho_date = '2026-10-05'; M._touched = true; await persistDraft();
      await bulk(x.list);
      const j = __read(x.list, 'Z172G06.json') || {};
      let rec = null; try{ rec = await idbGet('no:Z172G06'); }catch(_){}
      o.e_ファイル = [j.chosho_note, j.chosho_date];
      o.e_下書き = rec && rec.model ? [rec.model.chosho_note, rec.model.chosho_date] : null;
      o.e_知らせ = __said.some(s => /Z172G06/.test(s) && /書いていません/.test(s) && /どちらにするか聞かれます/.test(s));
    }
    // f
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G07');
      await saveDirSet(x.list, x.root);
      o.f_got = await openAuto('Z172G07');
      M.chosho_cust_tel = '0176-12-0007'; M._touched = true;
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      saveDirGet = async () => null; saveDirOk = async () => false;   // 覚えている保存先はそのまま（許可だけ切れた）
      window.showSaveFilePicker = async opt => { o.f_startIn = !!(opt && opt.startIn && __same(opt.startIn, x.list));
        return x.list.getFileHandle(opt.suggestedName, { create:true }); };
      __said.length = 0;
      try{ await __T(saveJsonRun(), 8000); } finally { saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; }
      o.f_電話 = (__read(x.list, 'Z172G07.json') || {}).chosho_cust_tel;
    }
    // g
    {
      __noDir(); await __clearDrafts();
      const alias = __caseJson('Z172G08', { compdoc_waived:'yes', chosho_photos:[ __ph('p1', '#c33'), __ph('p9', '#963') ],
        editedAt:'2026-09-01T00:00:00.000Z' });
      const x = mk('Z172G08', { chosho_photos:[ __ph('p1', '#c33') ] }, { 'Z172G08.json.txt': alias });
      await saveDirSet(x.list, x.root);
      o.g_got = await openAuto('Z172G08');
      M.chosho_cust_tel = '0176-12-0008'; M._touched = true;
      __said.length = 0; await __T(saveJsonRun(), 8000);
      const j = __read(x.list, 'Z172G08.json') || {};
      o.g_完了書なし = j.compdoc_waived || '(無し)'; o.g_写真 = __pids(j);
      o.g_別名そのまま = x.list.__files['Z172G08.json.txt'] === alias;
    }
    // h
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G09', { chosho_photos:[ phl('p1', '#c33', '屋根', false) ] });
      await saveDirSet(x.list, x.root);
      await loadStateInto(JSON.parse(x.list.__files['Z172G09.json']), 'Z172G09.json');   // 📂 で読んだ（印なし）
      const j0 = JSON.parse(x.list.__files['Z172G09.json']);
      j0.chosho_photos = [ phl('p1', '#c33', '屋根（施工前）', false) ];
      x.list.__files['Z172G09.json'] = JSON.stringify(j0);             // PCが写真の名前だけ直した
      M.chosho_cust_tel = '0176-12-0009'; M._touched = true;
      __said.length = 0; await __T(saveJsonRun(), 8000);
      o.h_窓 = __said.filter(s => /PCのファイルに中身が入っています/.test(s) && /写真の名前/.test(s)).length;
    }
    // i
    for(const touched of [true, false]){
      __noDir(); await __clearDrafts();
      const no = touched ? 'Z172G10' : 'Z172G11';
      const f0 = __caseJson(no, { chosho_photos:[ phl('p1', '#c33', '屋根', true), phl('p2', '#3a6', '分配器', true) ] });
      const f1 = __caseJson(no, { chosho_photos:[ phl('p1', '#c33', '屋根（施工前）', true), phl('p2', '#3a6', '分配器', false) ],
        editedAt:'2026-09-15T00:00:00.000Z' });
      const list = __mkdir('リスト', { [no + '.json']: f0 }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      await saveDirSet(list, root);
      await loadStateInto(JSON.parse(f0), no + '.json');
      if(touched){ M.chosho_note = '現場の備考'; M._touched = true; }
      await persistDraft();
      list.__files[no + '.json'] = f1;
      await loadStateInto(JSON.parse(f1), no + '.json');             // 📂 で読み直した
      o['i_' + (touched ? '入力あり' : '入力なし')] = labs({ chosho_photos: M.chosho_photos });
    }
    // j
    {
      __noDir(); await __clearDrafts();
      const x = mk('Z172G12');
      await loadStateInto(JSON.parse(x.list.__files['Z172G12.json']), 'Z172G12.json');   // 📂 で読んだ
      __noDir();                                                        // 保存先を覚えていない
      pcSet(x.list, 'Z172G12', { chosho_note:'PCがあとで直した備考' });
      M.chosho_cust_tel = '0176-12-0012'; M._touched = true;
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      const fh = await x.list.getFileHandle('Z172G12.json');
      saveDirGet = async () => null; saveDirOk = async () => false;
      window.showSaveFilePicker = async () => fh;
      __said.length = 0;
      try{ await __T(saveJsonRun(), 8000); } finally { saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; }
      const j = __read(x.list, 'Z172G12.json') || {};
      o.j_窓 = asked(); o.j_備考 = j.chosho_note; o.j_電話 = j.chosho_cust_tel;
    }
    __noDir(); await __clearDrafts();
    return o;
  });
  console.log('㊴第9回', JSON.stringify(r39));
  ok(r39.a_got === true && r39.a_控えの印 === true, '★今の保存先から読んだ控えに、保存先の印が付いていない → ' + JSON.stringify([r39.a_got, r39.a_控えの印]));
  ok(r39.a_同じ印 === true, '★同じリストを選び直しただけで、保存先の印が替わった（ふつうの保存で毎回聞く）');
  ok(r39.a_窓1 === 0 && r39.a_備考1 === 'PCがあとで直した備考' && r39.a_電話1 === '0176-12-0001',
     '★今の保存先から取った控えなのに聞いた、またはPCの直し・現場の直しが残らない → ' + JSON.stringify([r39.a_窓1, r39.a_備考1, r39.a_電話1]));
  ok(r39.a_替わった === true && r39.a_窓2 === 1,
     '★別の物件へ替えて戻ったあと（どこから取った控えか分からない）、聞かずに見比べた → ' + JSON.stringify([r39.a_替わった, r39.a_窓2]));
  ok(r39.b_single_写真 === 'p1,p2,p3' && /読めない/.test(r39.b_single_知らせ),
     '★（1件保存）読めないファイルを「無い」とみなして上書きした（PCの写真が消える）→ ' + JSON.stringify([r39.b_single_写真, r39.b_single_知らせ]));
  ok(r39.b_bulk_写真 === 'p1,p2,p3' && /いま読めない/.test(r39.b_bulk_知らせ),
     '★（まとめて保存）読めないファイルを「無い」とみなして上書きした、または知らせていない → ' + JSON.stringify([r39.b_bulk_写真, r39.b_bulk_知らせ]));
  ok(r39.c_1回目 === '0176-12-0004' && r39.c_2回目 === '続けて直した住所' && r39.c_残した === false,
     '★まとめて保存のあと、開いている戸別の控えが古いまま（次のまとめて保存で書かずに残した）→ ' + JSON.stringify([r39.c_1回目, r39.c_2回目, r39.c_残した]));
  ok(r39.d_got === true && JSON.stringify(r39.d_1回目) === JSON.stringify(['(無し)', 'p1:屋根（施工前）:印 p2:分配器:-', '0176-12-0005']),
     '★（まとめて保存）融合の前の中身を書いた（PCが外した完了書なし・直した写真の名前・外した印が戻る）→ ' + JSON.stringify(r39.d_1回目));
  ok(JSON.stringify(r39.d_2回目) === JSON.stringify(['(無し)', 'p1:屋根（施工前）:印 p2:分配器:-', '現場で直した住所']) && r39.d_窓 === 0,
     '★2回目の保存で、PCが直した写真の名前・印が戻った（画面の写真に入っていない）→ ' + JSON.stringify([r39.d_2回目, r39.d_窓]));
  ok(r39.e_got === true && JSON.stringify(r39.e_ファイル) === JSON.stringify(['PCが直した備考', '2026-10-01'])
     && JSON.stringify(r39.e_下書き) === JSON.stringify(['現場で書いた大事な備考', '2026-10-05']) && r39.e_知らせ === true,
     '★（まとめて保存）両方で直した工事日・備考で、この端末の値を下書きから消した、または知らせが違う → '
     + JSON.stringify([r39.e_ファイル, r39.e_下書き, r39.e_知らせ]));
  ok(r39.f_got === true && r39.f_startIn === true && r39.f_電話 === '0176-12-0007',
     '★許可が切れたときの保存先を選ぶ画面を、覚えているリストから開いていない → ' + JSON.stringify([r39.f_startIn, r39.f_電話]));
  ok(r39.g_got === true && r39.g_完了書なし === '(無し)' && r39.g_写真 === 'p1,p9' && r39.g_別名そのまま === true,
     '★同じ戸別の別名ファイルから欄を足した（PCが消した欄が戻る）、または写真を足していない → '
     + JSON.stringify([r39.g_完了書なし, r39.g_写真, r39.g_別名そのまま]));
  ok(r39.h_窓 === 1, '★📂 で読んだ控えで、PCが写真の名前だけ直したのに聞かなかった（控えをファイルと同じと見た）→ ' + r39.h_窓);
  ok(r39.j_窓 === 0 && r39.j_備考 === 'PCがあとで直した備考' && r39.j_電話 === '0176-12-0012',
     '★保存先を覚えていない端末で、PCがあとで直しただけなのに聞いた（または値が残らない）→ ' + JSON.stringify([r39.j_窓, r39.j_備考, r39.j_電話]));
  ok(r39.i_入力あり === 'p1:屋根（施工前）:印 p2:分配器:-' && r39.i_入力なし === 'p1:屋根（施工前）:印 p2:分配器:-',
     '★📂 で読み直したとき、PCが外した工事調書の印を画面で戻した → ' + JSON.stringify([r39.i_入力あり, r39.i_入力なし]));

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

  /* ---------- ㊵ スマホ：前の版で「物件名だけ」を入れる場所にしていた端末も、起動したら「物件名/リスト」を案内する ----------
     台帳を取り込み直すまで待つと、その間「物件のすぐ下」へ入れる案内が出続ける。自分で決めた名前には触らない。 */
  {
    const ctx3 = await b.newContext({ viewport:{ width:375, height:740 }, isMobile:true, hasTouch:true });
    await ctx3.addInitScript(() => { try{ delete window.showDirectoryPicker; }catch(_){} window.showDirectoryPicker = undefined; });
    const p3 = await ctx3.newPage();
    p3.on('dialog', d => d.accept().catch(()=>{}));
    await p3.goto(HTML); await p3.waitForTimeout(1800);
    await p3.evaluate(() => {
      rcPersist({ type:'antenna_reception_ledger', importedAt:Date.now(), exportedAt:'', project:'物件A', mainVersion:'171',
        rows:[{ mgmt_no:'Z172E01', name:'台帳の 太郎' }] });
      localStorage.setItem(LS_SAVEHINT, '物件A');
      localStorage.removeItem(LS_SAVEHINT_AUTO);
    });
    await p3.reload(); await p3.waitForTimeout(2000);
    const r40 = await p3.evaluate(() => ({ hint: saveHintName(), bar: (document.getElementById('sb-dest') || {}).textContent || '' }));
    await p3.evaluate(() => { localStorage.setItem(LS_SAVEHINT, '自分で決めた所'); localStorage.removeItem(LS_SAVEHINT_AUTO); });
    await p3.reload(); await p3.waitForTimeout(2000);
    r40.own = await p3.evaluate(() => saveHintName());
    console.log('㊵スマホの入れる場所（起動したとき）', JSON.stringify(r40));
    ok(r40.hint === '物件A/リスト' && /リスト/.test(r40.bar),
       '★起動しても「物件A」（物件のすぐ下）を案内したまま → ' + JSON.stringify(r40));
    ok(r40.own === '自分で決めた所', '★自分で決めた入れる場所を書き替えた → ' + r40.own);
    await ctx3.close();
  }

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版172（現場入力）');
})();
