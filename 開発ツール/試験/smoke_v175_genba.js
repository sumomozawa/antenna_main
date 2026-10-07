/* 版175（現場入力）
   その１の工事の人から「受付台帳を読み込んだら、その２になっている」と言われた。
   アプリの中に「その２」と決め打ちした所は無く、前に取り込んだ物件（その２）の名前を
   この端末が覚えたままにしていた（入れる場所・保存先のフォルダ・地図・会社の絞り込み・起動のときの台帳）。
   版175 の直しを、場面ごとに確かめる。
     ⓪ 前提・物件名の見比べ（かっこ・全角半角は見ない／「その１」「その２」は番号で決める／片方だけ番号＝分からない）
     ① スマホ：その２ → その１ を取り込むと、入れる場所は黙って「その１ ＞ リスト」（窓は出ない・その２ は出ない）
     ② スマホ：物件名の入っていない台帳 → 入れる場所は「リスト」だけ（開き直しても その２ を出さない）
     ②b 自分で書いた名前のまま、物件名の入っていない台帳 → 書き替えない・確かめるよう言う
     ③ スマホ：自分で「その２/リスト」と書いた端末 → 知らせに ⚠、選ぶ窓（おすすめ＝その１ ＞ リスト／いまのまま）
     ③c 地図の窓から「現場用_….json」を入れても同じように聞く（地図あり・地図なし）
     ④ 見当違いで脅さない（「R8その１/リスト」「物件A/リスト」）
     ⑤ 同じ名前（「リスト」）を選び直しただけなら、物件が変わったら追いかけるまま
     ⑥ 📁 の「前に使った名前」に別の物件の名前を出さない（覚え書きからは消さない）
        物件を見ながら自分で書いた名前は、その物件では ⚠ を出さない
     ⑦ PC：覚えているフォルダが「その２ ＞ リスト」→ 知らせに「保存先：」と ⚠、選ぶ窓、帯に「⚠ 物件が違う」。
        取り込みではフォルダに何も書かない
     ⑧ PC：📁 で別の物件のフォルダを選ぶと、1回だけ確かめる（OK＝⚠ が消える／キャンセル＝⚠ が残る）
     ⑨ PC でも窓が開けずに名前だけ覚えた端末は、物件が変わったら追いかける
     ⑩ 地図が別の物件のものなら知らせる（地図は消さない）。その物件の地図を入れれば知らせない
     ⑪ 前の物件で選んだ会社が新しい台帳に居なければ「すべて」に戻す（居れば選んだまま）
     ⑫ 起動のとき、古い台帳（その２）が新しい台帳（その１）を押しのけない（「| 0」で比べない）
     ⑬ まとめて保存：いまの台帳に無い戸別を先に言う（書くものは変えない・下書きと写真は減らさない）
     ⑭ 幅320px：長い物件名＋「⚠ 物件が違う」でも横にはみ出さない（PC のフォルダ／スマホの名前）
     ⑮ ③で「その１ ＞ リスト」を選んだあとは、画面にも、そのあとの知らせにも「その２」が出ない
        （③の取り込みの知らせそのものは、本人が書いた「その２」を言うので数えない）
     ⑯ 聞く窓・知らせの窓は地図の画面より上に出る（地図の画面から取り込んでも隠れない）
     ⑰ PC のまとめて保存：別の物件（その２）のフォルダを選んだら、書く前に確かめる（キャンセル＝何も書かない）
     ⑱ 名前1つの入れる場所（「その２」）・リストの無い物件のフォルダそのものでも、番号が違えば知らせる（「data」では脅さない）
     ⑲ 物件が合う台帳（または物件名の無い台帳）に戻したら、帯の ⚠ もすぐ消える
     ⑳ フォルダを覚えた PC で名前だけ選んでも、フォルダの ⚠ は消さない
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   スマホ＝起動の前に「フォルダを選ぶ窓」を消した入れ物（__noPicker と同じ）。
   使い方: node smoke_v175_genba.js [index.html の file:// URL]
           SCENE=③,⑦ node smoke_v175_genba.js   … 名前にその字が入る場面だけ（⓪ はいつも走る） */
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

/* 物件名（PCの受付台帳の「物件」）。その１ がいまの工事、その２ が前の工事 */
const P1 = '令和８年度戸別受信設備設置工事（その１）';
const P2 = '令和８年度戸別受信設備設置工事（その２）';
const P3 = '令和８年度戸別受信設備設置工事（その３）';
const SONO2 = /その[２2二]/;
const ONLY = String(process.env.SCENE || '').split(',').map(s => s.trim()).filter(Boolean);
const ROWS = {
  P2: [ { mgmt_no:'2622MAT001', name:'弐 二郎', addr:'三沢市B町1', contractor:'B社', date:'2026-09-20' },
        { mgmt_no:'2622MAT002', name:'弐 二子', addr:'三沢市B町2', contractor:'B社', date:'2026-09-21' } ],
  P1: [ { mgmt_no:'2611AAA001', name:'壱 一郎', addr:'三沢市A町1', contractor:'A社', date:'2026-10-07' },
        { mgmt_no:'2611AAA002', name:'壱 一子', addr:'三沢市A町2', contractor:'C社', date:'2026-10-08' } ],
  P3: [ { mgmt_no:'2633CCC001', name:'参 三郎', addr:'三沢市C町1', contractor:'C社', date:'2026-10-09' } ]
};

/* スマホ：起動の前に、フォルダを選ぶ窓・ファイルを保存する窓を消す。共有は「渡せた」とみなして数える */
const PHONE_INIT = () => {
  try{ delete window.showDirectoryPicker; }catch(_){}
  if(window.showDirectoryPicker) window.showDirectoryPicker = undefined;
  try{ delete window.showSaveFilePicker; }catch(_){}
  if(window.showSaveFilePicker) window.showSaveFilePicker = undefined;
  window.__shared = 0;
  try{ navigator.canShare = () => true; navigator.share = async () => { window.__shared++; }; }catch(_){}
};

/* 画面の中に作る道具。smoke_v172_genba.js の __mkdir などと同じ形。
   ★窓（uiAlert / uiConfirm）は黙って「OK」で閉じ、出た文を __said に控える★
     __cancelIf に正規表現を入れておくと、それに合う確かめ（uiConfirm）だけ「キャンセル」を押す。
   ★保存先を選ぶ窓（uiPickName ＝ #pick-modal）は、ここでは閉じない★ 試験の側で __pickAnswer で答える。 */
const SETUP = `
window.__P = ${JSON.stringify({ P1, P2, P3 })};
window.__ROWS = ${JSON.stringify(ROWS)};
window.__sleep = ms => new Promise(r => setTimeout(r, ms));
window.__T = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r('__timeout'), ms || 5000))]);
window.__mkdir = function(name, files, subs){
  const fileH = n => ({ kind:'file', name:n,
    getFile: async () => ({ name:n, size:(dir.__files[n]||'').length, lastModified: Date.now(),
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
    getDirectoryHandle: async (n) => {
      if(!(n in dir.__subs)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
      return __copyDir(dir.__subs[n]);
    },
    isSameEntry: async o => !!o && o.__self === dir,
    entries: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => [n, fileH(n)])
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
window.__copyDir = d => (d && d.__self) ? Object.create(d.__self) : d;
window.__same = (a, b) => !!a && !!b && a.__self === b.__self;
window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6;
  const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
window.__ph = (id, c) => ({ id:id, label:id, dataUri:__png(c) });
/* 覚えているフォルダを空にする */
window.__noDir = function(){
  _saveDir = null; _saveDirPar = null; _saveDirEp = ""; _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;
  try{ localStorage.removeItem(LS_SAVEDIR); localStorage.removeItem(LS_SAVEDIR_PAR); }catch(_){}
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
/* 窓（uiAlert / uiConfirm）を閉じる係 */
window.__said = []; window.__cancelIf = null;
if(window.__dlgTimer) clearInterval(window.__dlgTimer);
window.__dlgTimer = setInterval(() => {
  const m = document.getElementById('ui-dialog');
  if(m && m.classList.contains('open')){
    const t = (document.getElementById('ui-dialog-msg') || {}).textContent || '';
    window.__said.push(t);
    const cb = document.getElementById('ui-dialog-cancel');
    const isConfirm = !!(cb && cb.style.display !== 'none');
    const cancel = isConfirm && window.__cancelIf && window.__cancelIf.test(t);
    const b = document.getElementById(cancel ? 'ui-dialog-cancel' : 'ui-dialog-ok'); if(b) b.click();
  }
}, 40);
/* 受付台帳（PCの「📦 現場用」の中身）。proj が空＝物件を開かずに書き出した台帳 */
window.__led = (proj, rows) => ({ type:'antenna_reception_ledger', version:5, appVersion:'175',
  exportedAt:'2026-10-06T00:00:00.000Z', project: proj, rows: rows });
/* 地図（main の「全体図」など。シート名に物件名は入らない） */
window.__map = (proj, nos) => ({ type:'antenna_map_pack', version:1, project: proj, exportedAt:'2026-10-06T00:00:00.000Z',
  sheetCount:2, markCount: nos.length, sheets:[
    { name:'全体図', zentai:true, viewBox:{ x:0, y:0, w:100, h:100 },
      svg: nos.map((n, i) => '<rect x="' + (10 + i * 30) + '" y="10" width="20" height="20" fill="none" stroke="#000"/>').join(''),
      marks: Object.fromEntries(nos.map((n, i) => [n, { cx:20 + i * 30, cy:20, w:20, h:20 }])), markCount: nos.length },
    { name:'北地区', viewBox:{ x:0, y:0, w:100, h:100 }, svg:'<rect x="1" y="1" width="5" height="5"/>', marks:{}, markCount:0 } ] });
/* 受付台帳と地図のひとまとめ（現場用_….json） */
window.__set = (proj, rows, mapNos) => ({ type:'antenna_genba_set', version:1, project: proj,
  exportedAt:'2026-10-06T00:00:00.000Z', caseCount: rows.length, ledger: __led(proj, rows),
  map: mapNos ? __map(proj, mapNos) : null });
/* いま出ている「選ぶ窓」（#pick-modal）の中身 */
window.__pickState = function(){
  const pm = document.getElementById('pick-modal');
  const open = !!(pm && pm.classList.contains('open'));
  return { open: open,
    title: open ? (document.getElementById('pick-title') || {}).textContent || '' : '',
    note: open ? (document.getElementById('pick-note') || {}).textContent || '' : '',
    rows: open ? Array.from(document.querySelectorAll('#pick-list .pick-row')).map(el => ({
      main: (el.querySelector('.pick-main') || {}).textContent.trim(),
      sub: ((el.querySelector('.pick-sub') || {}).textContent || '').trim() })) : [] };
};
/* 選ぶ窓に答える。what＝何番目／押す字（前が合えばよい）／null＝「やめる」 */
window.__pickAnswer = async function(what){
  const els = Array.from(document.querySelectorAll('#pick-list .pick-row'));
  const main = e => (e.querySelector('.pick-main') || {}).textContent.trim();
  let el = null;
  if(typeof what === 'number') el = els[what] || null;
  else if(typeof what === 'string') el = els.find(e => main(e) === what) || els.find(e => main(e).indexOf(what) === 0) || null;
  const got = el ? main(el) : null;
  if(el) el.click(); else { const c = document.getElementById('pick-close'); if(c) c.click(); }
  await __sleep(250);
  return got;
};
/* 受付台帳ファイルを「取り込む」から入れる。取り込みの知らせ（OK で閉じる）と、
   そのあと出た選ぶ窓（開いたまま）を返す */
window.__imp = async function(obj){
  const inp = document.getElementById('reception-file');
  const dt = new DataTransfer();
  dt.items.add(new File([JSON.stringify(obj)], '現場用_' + (obj.project || '物件なし') + '.json', { type:'application/json' }));
  inp.files = dt.files;
  const n0 = __said.length;
  const isAlert = s => /受付台帳を(取り込み|読み込み)ました/.test(s);
  inp.dispatchEvent(new Event('change', { bubbles:true }));
  for(let i = 0; i < 100 && !__said.slice(n0).some(isAlert); i++) await __sleep(50);
  await __sleep(300);              // 知らせを閉じたあと、選ぶ窓が出るなら、ここまでに出ている
  const said = __said.slice(n0);
  return { alert: said.filter(isAlert).join(' / '), said: said, pick: __pickState() };
};
/* start() で選ぶ窓を出させて、label を押す（typed があれば「自分で書く」の窓に書く）。
   label が null なら「やめる」。並んでいた候補と、そのあいだに出た知らせを返す */
window.__pickVia = async function(start, label, typed){
  const n0 = __said.length;
  const p = start();
  const pm = document.getElementById('pick-modal');
  for(let i = 0; i < 80 && !(pm && pm.classList.contains('open')); i++) await __sleep(50);
  const st = __pickState();
  const els = Array.from(document.querySelectorAll('#pick-list .pick-row'));
  const el = (label == null) ? null : els.find(e => (e.querySelector('.pick-main') || {}).textContent.trim() === label);
  if(el) el.click(); else { const c = document.getElementById('pick-close'); if(c) c.click(); }
  if(el && typed != null){
    const tm = document.getElementById('type-modal');
    for(let i = 0; i < 40 && !(tm && tm.classList.contains('open')); i++) await __sleep(50);
    const inp = document.getElementById('type-input'); if(inp) inp.value = typed;
    const okb = document.getElementById('type-ok'); if(okb) okb.click();
  }
  await __T(p, 6000);
  await __sleep(100);
  return { open: st.open, title: st.title, rows: st.rows, clicked: !!el, said: __said.slice(n0) };
};
/* 保存バーの📁（名前だけ覚える道） */
window.__pickHint = (label, typed) => __pickVia(() => saveDirChange('nameonly'), label, typed);
/* 保存バーの📁ボタン（いまの見た目のまま。描き直さない） */
window.__bar = function(){
  const d = document.getElementById('sb-dest');
  if(!d) return { text:'', other:false, tag:'', title:'' };
  return { text: d.textContent.replace(/\\s+/g, ' ').trim(), other: d.classList.contains('other'),
           tag: ((d.querySelector('.sb-dest-x') || {}).textContent || '').trim(), title: d.title || '' };
};
window.__auto = () => { try{ return localStorage.getItem('field_savedir_hint_auto_v1'); }catch(_){ return null; } };
window.__okKey = () => { try{ return localStorage.getItem('field_saveplace_ok_v1'); }catch(_){ return null; } };
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errs = [];
  /* 場面ごとに新しい入れ物で開く（覚え書きを持ち越さない） */
  async function fresh(name, opt){
    opt = opt || {};
    const ctx = await b.newContext(opt.mobile
      ? { viewport:{ width: opt.width || 375, height: opt.height || 740 }, deviceScaleFactor:2, isMobile:true, hasTouch:true }
      : { viewport:{ width: opt.width || 1280, height: opt.height || 860 } });
    if(opt.phone) await ctx.addInitScript(PHONE_INIT);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror(' + name + '): ' + e.message));
    page.on('console', m => { const t = m.text();
      if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push('console(' + name + '): ' + t); });
    page.on('dialog', d => d.accept().catch(()=>{}));
    await page.goto(HTML); await page.waitForTimeout(1800);
    await page.evaluate(SETUP);
    return { ctx, page };
  }
  async function reopen(page){
    await page.reload(); await page.waitForTimeout(1800);
    await page.evaluate(SETUP);
  }
  /* 1つの場面。途中で止まっても、ほかの場面は続ける */
  async function scene(name, opt, fn){
    if(ONLY.length && name !== '⓪' && !ONLY.some(s => name.indexOf(s) >= 0)) return;
    let c = null;
    try{ c = await fresh(name, opt); await fn(c.page); }
    catch(e){ fails.push('試験が途中で止まった（' + name + '）→ ' + ((e && e.message) || e)); }
    finally{ if(c) await c.ctx.close().catch(()=>{}); }
  }
  const noBody = o => { const x = Object.assign({}, o); delete x.body; return x; };

  /* ---------- ⓪ 前提・物件名の見比べ ---------- */
  await scene('⓪', {}, async page => {
    const r0 = await page.evaluate(() => ({
      ver: APP_VERSION,
      f: ['receptionSaveRows','getReceptionData','saveHintName','saveHintSet','saveHintLine','saveDirSet','saveDirChange',
          'saveDirParentOf','renderSaveBar','saveAllDrafts','persistDraft','freshModel','ensureModelShape','render',
          'openMapView','closeMapView','idbMapPut','idbMapGet','idbGetAll','rcCtrSet','rcLoadFromIdb','mapImportFile','openReceptionModal',
          'closeReceptionModal','uiPickName'].filter(n => typeof window[n] !== 'function'),
      f175: ['pjDiffers','pjNameKey','pjSonoNo','rcProjName','savePlaceMismatch','savePlaceCheckAfterImport',
             'savePlaceOkSet','savePlaceOkFor','mapPackOtherProj','mapSubText'].filter(n => typeof window[n] !== 'function')
    }));
    console.log('⓪前提', JSON.stringify(r0));
    ok(r0.f.length === 0, '試験の前提: 無い関数がある → ' + r0.f.join(' / '));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    ok(r0.f175.length === 0, '★版175 の関数が無い → ' + r0.f175.join(' / '));
    if(r0.f.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }
    /* 名前は人が打つ。かっこ・空白・全角半角の違いは見ない。両方に「その＋番号」があれば番号で決める。
       片方にだけ番号があるときは「分からない」＝違うと言わない（物件A のような名前で脅さない） */
    const cases = [
      [P1, P2, true], [P2, P1, true], [P1, P3, true],
      [P1, '令和8年度 戸別受信設備設置工事 (その1)', false],
      ['令和８年度戸別受信設備設置工事（その二）', P2, false],
      ['R8その１', P1, false], ['R8その１', P2, true],
      ['物件A', P1, false], [P1, '物件A', false],
      ['物件A', '物件B', true], ['三沢地区', '三沢地区 北', false],
      ['', P1, false], [P1, '', false],
      ['工事（その十一）', '工事（その十二）', true], ['工事（その二十）', '工事（その二）', true],
      ['工事（その十一）', '工事（その11）', false],
      // 番号は、かっこ・空白を消す前の名前で読む（「その十 三沢」を 13 と読まない）
      ['工事 その十 三沢地区', '工事 その10', false], ['工事 その一（十和田）', '工事（その１）', false],
      // 番号の無い名前どうしでも、全角半角・かっこの違いは同じ物件とみる
      ['Ａ地区（北）', 'A地区(北)', false]
    ];
    const r0b = await page.evaluate(cs => cs.map(c => (typeof pjDiffers === 'function') ? pjDiffers(c[0], c[1]) : null), cases);
    const bad = cases.filter((c, i) => r0b[i] !== c[2]).map(c => c[0] + ' ／ ' + c[1] + ' → ' + !c[2]);
    console.log('⓪見比べ', JSON.stringify(r0b));
    ok(bad.length === 0, '★物件名の見比べがおかしい → ' + bad.join(' ｜ '));
  });

  /* ---------- ① スマホ：その２ → その１ を取り込む ---------- */
  await scene('①', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      const a = await __imp(__led(__P.P2, __ROWS.P2));
      o.hint2 = saveHintName(); o.pick2 = a.pick.open;
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick.open; o.pickTitle = c.pick.title;
      o.hint = saveHintName(); o.auto = __auto();
      o.bar = __bar(); o.line = saveHintLine();
      o.body = document.body.innerText;
      return o;
    });
    console.log('①その２→その１', JSON.stringify(noBody(r)));
    ok(r.hint2 === P2 + '/リスト' && !r.pick2, '試験の前提: その２ を取り込んで入れる場所が「その２ ＞ リスト」にならない → ' + r.hint2);
    ok(r.hint === P1 + '/リスト' && r.auto === P1 + '/リスト',
       '★その１ の台帳を取り込んでも、入れる場所が「その１ ＞ リスト」にならない → ' + r.hint + ' ／ 印 ' + r.auto);
    ok(!r.pick, '★自動で決めた名前なのに、選ぶ窓を出した（黙って追いかけてよい） → ' + r.pickTitle);
    ok(/前に取り込んでいた物件から替わりました/.test(r.alert), '★物件が替わったことを知らせない → ' + r.alert);
    ok(r.alert.indexOf('物件：' + P1) >= 0, '★知らせに物件名が出ない → ' + r.alert);
    ok(!SONO2.test(r.alert), '★その１ を取り込んだ知らせに「その２」が出た → ' + r.alert);
    ok(!SONO2.test(r.bar.text) && !SONO2.test(r.bar.title) && r.bar.text.indexOf(P1) >= 0 && !r.bar.other,
       '★保存バーに「その２」が出た／その１ が出ない → ' + JSON.stringify(r.bar));
    ok(!SONO2.test(r.line) && r.line.indexOf(P1) >= 0, '★保存のあとの案内に「その２」が出た → ' + r.line);
    ok(!SONO2.test(r.body), '★画面に「その２」が残っている → ' + ((r.body.match(/.{0,30}その[２2二].{0,30}/) || [''])[0]));
  });

  /* ---------- ② スマホ：その２ のあと、物件名の入っていない台帳 ---------- */
  await scene('②', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2)); o.hint2 = saveHintName();
      const c = await __imp(__led('', __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick.open; o.hint = saveHintName(); o.auto = __auto();
      o.bar = __bar(); o.line = saveHintLine(); o.body = document.body.innerText;
      return o;
    });
    await reopen(page);
    const r2 = await page.evaluate(async () => {
      const o = { hint: saveHintName(), proj: String((getReceptionData() || {}).project), bar: __bar(),
                  line: saveHintLine(), body: document.body.innerText };
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.p1hint = saveHintName(); o.p1pick = c.pick.open; o.p1alert = c.alert;
      return o;
    });
    console.log('②物件名なし', JSON.stringify(noBody(r)), '開き直し', JSON.stringify(noBody(r2)));
    ok(r.hint2 === P2 + '/リスト', '試験の前提: その２ の入れる場所が決まっていない → ' + r.hint2);
    ok(/物件名が入っていません/.test(r.alert), '★物件名の無い台帳だと知らせない → ' + r.alert);
    ok(/入れる場所：「リスト」フォルダ/.test(r.alert), '★物件名の無い台帳で、入れる場所が「リスト」にならない（知らせ） → ' + r.alert);
    ok(r.hint === 'リスト' && r.auto === 'リスト', '★物件名の無い台帳で、自動で決めた「その２ ＞ リスト」が残った → ' + r.hint + ' ／ 印 ' + r.auto);
    ok(!r.pick, '★物件名の無い台帳で選ぶ窓を出した');
    ok(/リスト/.test(r.bar.text) && !SONO2.test(r.bar.text + r.bar.title) && !r.bar.other, '★保存バーが「リスト」でない／その２ が出た → ' + JSON.stringify(r.bar));
    ok(!SONO2.test(r.alert) && !SONO2.test(r.line) && !SONO2.test(r.body), '★物件名の無い台帳のあと、どこかに「その２」が出た → '
       + [r.alert, r.line, (r.body.match(/.{0,30}その[２2二].{0,30}/) || [''])[0]].filter(s => SONO2.test(s)).join(' ｜ '));
    ok(r2.hint === 'リスト' && r2.proj === '' && /リスト/.test(r2.bar.text), '★開き直すと入れる場所が変わった → ' + JSON.stringify([r2.hint, r2.proj, r2.bar.text]));
    ok(!SONO2.test(r2.bar.text + r2.bar.title) && !SONO2.test(r2.line) && !SONO2.test(r2.body),
       '★開き直すと「その２」が出た → ' + JSON.stringify(r2.bar) + ' ' + ((r2.body.match(/.{0,30}その[２2二].{0,30}/) || [''])[0]));
    ok(r2.p1hint === P1 + '/リスト' && !r2.p1pick, '★物件名の無い台帳のあと、その１ を取り込んでも追いかけない → ' + r2.p1hint);
  });

  /* ---------- ②b スマホ：自分で書いた名前のまま、物件名の入っていない台帳 ----------
     自分で書いた名前は黙って書き替えない。そのかわり、合っているか確かめるよう知らせで言う。 */
  await scene('②b', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      o.typed = saveHintName();
      const c = await __imp(__led('', __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick.open; o.hint = saveHintName();
      if(c.pick.open) await __pickAnswer(null);
      return o;
    });
    console.log('②b自分で書いた名前＋物件名なし', JSON.stringify(r));
    ok(r.typed === 'その２/リスト', '試験の前提: 自分で書いた名前が覚えられていない → ' + r.typed);
    ok(r.hint === 'その２/リスト', '★物件名の無い台帳で、自分で書いた名前を黙って書き替えた → ' + r.hint);
    ok(/⚠ 物件名が無いので、入れる場所が合っているか確かめてください/.test(r.alert),
       '★物件名の無い台帳で、自分で書いた入れる場所を確かめるよう言わない → ' + r.alert);
    ok(!r.pick, '★物件名の無い台帳なのに選ぶ窓を出した（何と比べたか分からない）');
  });

  /* ---------- ③a ＋ ⑮ スマホ：自分で「その２/リスト」と書いた端末 → おすすめを選ぶ ---------- */
  await scene('③a', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      o.typed = saveHintName(); o.typedAuto = __auto();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick;
      o.chose = await __pickAnswer(0);
      o.hint = saveHintName(); o.auto = __auto(); o.bar = __bar();
      /* ⑮ ここから先は、画面にも知らせにも「その２」が出ない */
      const n0 = __said.length;
      const d = await __imp(__led(__P.P1, __ROWS.P1));
      o.re = { alert: d.alert, pick: d.pick.open };
      const l = await __pickHint(null);
      o.list = l.rows; o.listOpen = l.open;
      o.line = saveHintLine();
      o.bar2 = __bar();
      o.body = document.body.innerText;
      o.saidAfter = __said.slice(n0);
      return o;
    });
    console.log('③a自分で書いた→おすすめ', JSON.stringify(noBody(r)));
    ok(r.typed === 'その２/リスト', '試験の前提: 自分で書いた名前が覚えられていない → ' + r.typed);
    ok(/⚠ 入れる場所が、この物件と違います/.test(r.alert), '★入れる場所が物件と違うのに、取り込みの知らせで言わない → ' + r.alert);
    ok(r.pick.open && /入れる場所が、受付台帳の物件と違います/.test(r.pick.title),
       '★入れる場所が物件と違うのに、選ぶ窓が出ない → ' + JSON.stringify(r.pick));
    ok(r.pick.rows.length >= 2 && r.pick.rows[0].main === P1 + ' ＞ リスト' && /^いまのまま/.test(r.pick.rows[1].main),
       '★選ぶ窓のいちばん上が「その１ ＞ リスト」でない／「いまのまま」が無い → ' + JSON.stringify(r.pick.rows));
    ok(r.chose === P1 + ' ＞ リスト' && r.hint === P1 + '/リスト', '★おすすめを選んでも入れる場所が変わらない → ' + r.hint);
    ok(r.auto === P1 + '/リスト', '★おすすめを選んだのに、次に物件が変わったとき追いかける印が付かない → ' + r.auto);
    ok(!r.bar.other && r.bar.tag === '変更' && r.bar.text.indexOf(P1) >= 0, '★おすすめを選んだのに保存バーに ⚠ が残る → ' + JSON.stringify(r.bar));
    // ⑮
    ok(!r.re.pick, '★直したあと、同じ物件をもう一度取り込むと、また選ぶ窓が出た');
    ok(r.listOpen && r.list.length > 0, '試験の前提: 📁 の名前の一覧が出ない');
    const bad15 = [];
    if(SONO2.test(r.re.alert)) bad15.push('取り込みの知らせ: ' + r.re.alert);
    r.saidAfter.forEach(s => { if(SONO2.test(s)) bad15.push('知らせ: ' + s); });
    r.list.forEach(x => { if(SONO2.test(x.main + x.sub)) bad15.push('📁 の候補: ' + x.main + '（' + x.sub + '）'); });
    if(SONO2.test(r.line)) bad15.push('保存のあとの案内: ' + r.line);
    if(SONO2.test(r.bar2.text + r.bar2.title)) bad15.push('保存バー: ' + r.bar2.text);
    if(SONO2.test(r.body)) bad15.push('画面: ' + (r.body.match(/.{0,30}その[２2二].{0,30}/) || [''])[0]);
    ok(bad15.length === 0, '★⑮ その１ に直したあとも「その２」が出る → ' + bad15.join(' ｜ '));
  });

  /* ---------- ③b スマホ：自分で「その２/リスト」と書いた端末 → いまのまま ---------- */
  await scene('③b', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.pick = c.pick.open;
      o.chose = await __pickAnswer('いまのまま');
      o.hint = saveHintName(); o.auto = __auto(); o.okKey = __okKey(); o.bar = __bar();
      const d = await __imp(__led(__P.P1, __ROWS.P1));
      o.re = { pick: d.pick.open, alert: d.alert, bar: __bar() };
      const e = await __imp(__led(__P.P3, __ROWS.P3));
      o.p3 = { pick: e.pick.open, title: e.pick.title, first: (e.pick.rows[0] || {}).main || '', alert: e.alert };
      await __pickAnswer(null);                  // やめる（何も覚えない）
      o.p3.bar = __bar(); o.p3.hint = saveHintName(); o.p3.line = saveHintLine();
      o.p3.list = (await __pickHint(null)).rows;  // 📁 の一覧（見るだけで閉じる）
      return o;
    });
    console.log('③bいまのまま', JSON.stringify(r));
    ok(r.pick && /^いまのまま/.test(r.chose || ''), '試験の前提: 選ぶ窓で「いまのまま」を押せていない → ' + r.chose);
    ok(r.hint === 'その２/リスト', '★「いまのまま」を選んだのに、入れる場所を書き替えた → ' + r.hint);
    ok(!r.bar.other && r.bar.tag === '変更', '★「いまのまま」を選んだのに保存バーに ⚠ が残る → ' + JSON.stringify(r.bar));
    ok(!r.re.pick && !/⚠ 入れる場所が/.test(r.re.alert) && !r.re.bar.other,
       '★「いまのまま」と答えた物件をもう一度取り込むと、また聞いた → ' + JSON.stringify(r.re));
    ok(r.p3.pick && r.p3.first === P3 + ' ＞ リスト' && /⚠ 入れる場所が、この物件と違います/.test(r.p3.alert),
       '★別の物件（その３）を取り込んでも聞かない（「いまのまま」は答えた物件だけ） → ' + JSON.stringify(r.p3));
    ok(r.p3.bar.other && r.p3.bar.tag === '⚠ 物件が違う' && r.p3.hint === 'その２/リスト',
       '★窓を「やめる」で閉じたら、保存バーに ⚠ が出ない／名前が変わった → ' + JSON.stringify(r.p3));
    ok(r.p3.line.indexOf('⚠ 受付台帳の物件「' + P3 + '」とは違う名前です') >= 0,
       '★入れる場所が物件と違うのに、保存のあとの案内で言わない → ' + r.p3.line);
    const nowRow = (r.p3.list || []).find(x => x.main === 'その２ ＞ リスト') || {};
    ok((r.p3.list[0] || {}).main === P3 + ' ＞ リスト' && /⚠ 受付台帳の物件と違います/.test(nowRow.sub || ''),
       '★📁 の一覧で、いま覚えている名前が物件と違うと言わない → ' + JSON.stringify(r.p3.list));
  });

  /* ---------- ③c スマホ：地図の窓から「現場用_….json」を入れても、同じように聞く ----------
     地図の「現場用_….json を選ぶ」からも受付台帳が入る（地図あり／地図なしの2つの道）。 */
  await scene('③c', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      const f = (obj, n) => new File([JSON.stringify(obj)], n, { type:'application/json' });
      // 地図の入っていない「現場用」
      const a = await __pickVia(() => mapImportFile(f(__set(__P.P1, __ROWS.P1, null), 'a.json')), null);
      o.a = { open: a.open, title: a.title, first: (a.rows[0] || {}).main || '', hint: saveHintName(),
              proj: (getReceptionData() || {}).project };
      // 地図も入った「現場用」（その３）→ おすすめを選ぶ
      const b = await __pickVia(() => mapImportFile(f(__set(__P.P3, __ROWS.P3, ['2633CCC001']), 'b.json')), __P.P3 + ' ＞ リスト');
      o.b = { open: b.open, title: b.title, clicked: b.clicked, hint: saveHintName(), pack: _mapPack && _mapPack.project };
      try{ closeMapView(); }catch(_){}
      return o;
    });
    console.log('③c地図の窓から', JSON.stringify(r));
    ok(r.a.proj === P1, '試験の前提: 地図の窓から受付台帳が入っていない → ' + r.a.proj);
    ok(r.a.open && /入れる場所が、受付台帳の物件と違います/.test(r.a.title) && r.a.first === P1 + ' ＞ リスト',
       '★地図の窓から（地図なし）受付台帳を入れたとき、入れる場所が物件と違っても聞かない → ' + JSON.stringify(r.a));
    ok(r.a.hint === 'その２/リスト', '★窓を「やめる」で閉じたのに、入れる場所を書き替えた → ' + r.a.hint);
    ok(r.b.open && r.b.clicked && r.b.hint === P3 + '/リスト' && r.b.pack === P3,
       '★地図の窓から（地図あり）受付台帳を入れたとき、入れる場所を聞かない／選んでも変わらない → ' + JSON.stringify(r.b));
  });

  /* ---------- ④ 見当違いで脅さない ---------- */
  for(const typed of ['R8その１/リスト', '物件A/リスト']){
    await scene('④' + typed, { phone:true }, async page => {
      const r = await page.evaluate(async t => {
        const o = {};
        await __imp(__led(__P.P2, __ROWS.P2));
        await __pickHint('自分で書く', t);          // その２ を見ながら書いた名前
        o.typed = saveHintName();
        const c = await __imp(__led(__P.P1, __ROWS.P1));
        o.pick = c.pick.open; o.title = c.pick.title; o.alert = c.alert; o.bar = __bar(); o.line = saveHintLine();
        o.hint = saveHintName();
        if(c.pick.open) await __pickAnswer(null);
        return o;
      }, typed);
      console.log('④' + typed, JSON.stringify(r));
      ok(r.typed === typed, '試験の前提: 自分で書いた名前が覚えられていない → ' + r.typed);
      ok(!r.pick && !/⚠/.test(r.alert) && !r.bar.other && !/⚠/.test(r.line),
         '★「' + typed + '」は その１ と違うとは言えないのに ⚠／選ぶ窓を出した → ' + JSON.stringify({ pick: r.title, alert: r.alert, bar: r.bar.tag }));
      ok(r.hint === typed, '★自分で書いた名前を黙って書き替えた → ' + r.hint);
    });
  }

  /* ---------- ⑤ 同じ名前を選び直しただけなら、自動のまま ---------- */
  await scene('⑤', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __imp(__led('', __ROWS.P1));
      o.hint0 = saveHintName(); o.auto0 = __auto();
      const p = await __pickHint('リスト');
      o.rows = p.rows.map(x => x.main + '（' + x.sub + '）'); o.clicked = p.clicked;
      o.hint1 = saveHintName(); o.auto1 = __auto();
      const d = await __imp(__led(__P.P1, __ROWS.P1));
      o.hint2 = saveHintName(); o.pick = d.pick.open;
      return o;
    });
    console.log('⑤同じ名前を選び直す', JSON.stringify(r));
    ok(r.hint0 === 'リスト' && r.auto0 === 'リスト', '★物件名の無い台帳のあと、入れる場所が自動の「リスト」になっていない → ' + r.hint0 + ' ／ 印 ' + r.auto0);
    ok(r.clicked, '試験の前提: 📁 の一覧に「リスト」が無い → ' + JSON.stringify(r.rows));
    ok(r.hint1 === 'リスト' && r.auto1 === 'リスト', '★同じ名前を選び直しただけで「自分で選んだ名前」扱いになった → 印 ' + JSON.stringify(r.auto1));
    ok(r.hint2 === P1 + '/リスト' && !r.pick, '★同じ名前を選び直したあと、その１ を取り込んでも追いかけない → ' + r.hint2);
  });

  /* ---------- ⑥ 📁 の「前に使った名前」に別の物件を出さない ---------- */
  await scene('⑥', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __imp(__led(__P.P1, __ROWS.P1));
      const p = await __pickHint(null);
      o.open = p.open; o.rows = p.rows.map(x => x.main);
      try{ o.hist = JSON.parse(localStorage.getItem('genba_savehints_v1') || '[]'); }catch(_){ o.hist = null; }
      o.hint = saveHintName();
      /* 受付台帳の物件（その１）を見ながら、自分で別の名前を書いた → この物件ではそれでよい（⚠ を出さない・もう聞かない） */
      await __pickHint('自分で書く', 'その２/リスト');
      o.own = { hint: saveHintName(), bar: __bar() };
      const d = await __imp(__led(__P.P1, __ROWS.P1));
      o.own.pick = d.pick.open;
      if(d.pick.open) await __pickAnswer(null);
      return o;
    });
    console.log('⑥前に使った名前', JSON.stringify(r));
    ok(r.open && r.rows.indexOf(P1 + ' ＞ リスト') >= 0, '試験の前提: 📁 の一覧に「その１ ＞ リスト」が無い → ' + JSON.stringify(r.rows));
    ok(r.rows.indexOf(P2 + ' ＞ リスト') < 0 && !r.rows.some(x => SONO2.test(x)),
       '★📁 の一覧に前の物件（その２）の名前が出る（押すだけで その２ へ戻る） → ' + JSON.stringify(r.rows));
    ok(Array.isArray(r.hist) && r.hist.indexOf(P2 + '/リスト') >= 0, '★覚え書きから前の物件の名前を消した（その物件に戻ったとき出なくなる） → ' + JSON.stringify(r.hist));
    ok(r.hint === P1 + '/リスト', '★一覧を閉じただけで入れる場所が変わった → ' + r.hint);
    ok(r.own.hint === 'その２/リスト' && !r.own.bar.other && !r.own.pick,
       '★物件を見ながら自分で書いた名前なのに ⚠／選ぶ窓を出した → ' + JSON.stringify(r.own));
  });

  /* ---------- ⑦ PC：覚えているフォルダが「その２ ＞ リスト」 ---------- */
  await scene('⑦', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      const list = __mkdir('リスト', {}, {});
      const root = __mkdir(__P.P2, { '現場用_その２.json':'{}' }, { 'リスト': list });
      await saveDirSet(list, root); renderSaveBar();
      o.bar0 = __bar();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick;
      o.chose1 = await __pickAnswer('あとで');
      o.bar1 = __bar();
      const d = await __imp(__led(__P.P1, __ROWS.P1));
      o.pick2 = d.pick.open;
      o.chose2 = await __pickAnswer('このフォルダのまま');
      o.bar2 = __bar();
      const e = await __imp(__led(__P.P1, __ROWS.P1));
      o.pick3 = e.pick.open; o.bar3 = __bar();
      if(e.pick.open) await __pickAnswer(null);
      o.wrote = list.__wrote.concat(root.__wrote);
      o.dir = _saveDir && _saveDir.name; o.par = __same(saveDirParentOf(_saveDir), root);
      o.hint = saveHintName();
      return o;
    });
    console.log('⑦PCのフォルダ', JSON.stringify(r));
    ok(r.bar0.text.indexOf(P2) >= 0 && !r.bar0.other, '試験の前提: 保存バーに「その２ ＞ リスト」が出ていない／その２ の台帳なのに ⚠ → ' + JSON.stringify(r.bar0));
    ok(/保存先：「/.test(r.alert) && r.alert.indexOf(P2 + ' ＞ リスト') >= 0, '★PCの取り込みの知らせに、保存先のフォルダが出ない → ' + r.alert);
    ok(/⚠ 保存先が、この物件と違います/.test(r.alert), '★保存先が物件と違うのに、取り込みの知らせで言わない → ' + r.alert);
    ok(r.pick.open && /保存先が、受付台帳の物件と違います/.test(r.pick.title)
       && r.pick.rows.some(x => x.main === 'このフォルダのままにする') && r.pick.rows.some(x => /^あとで/.test(x.main)),
       '★保存先が物件と違うのに、選ぶ窓が出ない → ' + JSON.stringify(r.pick));
    ok(r.bar1.other && r.bar1.tag === '⚠ 物件が違う' && r.bar1.title.indexOf(P1) >= 0,
       '★「あとで選び直す」のあと、保存バーに「⚠ 物件が違う」が出ない → ' + JSON.stringify(r.bar1));
    ok(r.pick2, '★「あとで」と答えただけなのに、次の取り込みで聞かなくなった');
    ok(!r.bar2.other && r.bar2.tag === '変更', '★「このフォルダのままにする」を選んでも ⚠ が消えない → ' + JSON.stringify(r.bar2));
    ok(!r.pick3 && !r.bar3.other, '★「このフォルダのまま」と答えた物件で、また聞いた → ' + JSON.stringify(r.bar3));
    ok(r.wrote.length === 0, '★受付台帳を取り込んだだけで、フォルダに書いた → ' + JSON.stringify(r.wrote));
    ok(r.dir === 'リスト' && r.par === true && r.hint === '', '★取り込みで保存先のフォルダ（または名前）を黙って変えた → ' + JSON.stringify([r.dir, r.par, r.hint]));
  });

  /* ---------- ⑧ PC：📁 で別の物件のフォルダを選ぶと確かめる ---------- */
  await scene('⑧', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.pick0 = c.pick.open;
      const list = __mkdir('リスト', {}, {});
      const root = __mkdir(__P.P2, {}, { 'リスト': list });
      let n = 0;
      window.showDirectoryPicker = async () => { n++; return root; };
      const n0 = __said.length;
      await __T(saveDirChange(), 6000); await __sleep(150);
      o.picked = n; o.said = __said.slice(n0); o.bar = __bar();
      o.dir = _saveDir && _saveDir.name; o.par = __same(saveDirParentOf(_saveDir), root);
      /* キャンセル＝フォルダはそのまま、⚠ が残る（別の物件 その３ のフォルダで） */
      const list3 = __mkdir('リスト', {}, {});
      const root3 = __mkdir(__P.P3, {}, { 'リスト': list3 });
      window.showDirectoryPicker = async () => root3;
      window.__cancelIf = /名前が違います/;
      const n1 = __said.length;
      await __T(saveDirChange(), 6000); await __sleep(150);
      window.__cancelIf = null;
      o.said2 = __said.slice(n1); o.bar2 = __bar();
      o.par3 = __same(saveDirParentOf(_saveDir), root3);
      return o;
    });
    console.log('⑧PCで別の物件のフォルダを選ぶ', JSON.stringify(r));
    ok(!r.pick0, '試験の前提: フォルダを覚えていないのに選ぶ窓が出た');
    ok(r.picked === 1 && r.dir === 'リスト' && r.par === true, '試験の前提: 選んだ物件の中の「リスト」を覚えていない → ' + JSON.stringify([r.picked, r.dir, r.par]));
    const ask = r.said.find(s => /名前が違います/.test(s)) || '';
    ok(!!ask && ask.indexOf(P1) >= 0, '★別の物件のフォルダを選んでも確かめない → ' + JSON.stringify(r.said));
    ok(!r.bar.other && r.bar.tag === '変更', '★「このフォルダにする」と答えたのに ⚠ が残る → ' + JSON.stringify(r.bar));
    ok(r.said2.some(s => /名前が違います/.test(s)) && r.par3 === true,
       '試験の前提: その３ のフォルダで確かめが出ない／フォルダを覚えていない → ' + JSON.stringify(r.said2));
    ok(r.bar2.other && r.bar2.tag === '⚠ 物件が違う', '★確かめで「キャンセル」なのに、保存バーに ⚠ が出ない → ' + JSON.stringify(r.bar2));
  });

  /* ---------- ⑨ PC でも、窓が開けずに名前だけ覚えた端末は追いかける ---------- */
  await scene('⑨', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      window.showDirectoryPicker = async () => { const e = new Error('この端末では使えません'); e.name = 'SecurityError'; throw e; };
      await __imp(__led(__P.P2, __ROWS.P2));
      o.hint0 = saveHintName();
      const p = await __pickVia(() => saveDirChange(), __P.P2 + ' ＞ リスト');
      o.open = p.open; o.rows = p.rows.map(x => x.main); o.said = p.said;
      o.hint1 = saveHintName(); o.auto1 = __auto();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.hint2 = saveHintName(); o.auto2 = __auto(); o.pick = c.pick.open; o.alert = c.alert; o.bar = __bar();
      if(c.pick.open) await __pickAnswer(null);
      return o;
    });
    console.log('⑨名前だけ覚えたPC', JSON.stringify(r));
    ok(r.hint0 === '', '★フォルダを選べる端末で、取り込んだだけで名前を決めた → ' + r.hint0);
    ok(r.said.some(s => /開けませんでした/.test(s)) && r.open && r.hint1 === P2 + '/リスト',
       '試験の前提: 窓が開けない端末で「その２ ＞ リスト」を選べていない → ' + JSON.stringify([r.said, r.rows, r.hint1]));
    ok(r.hint2 === P1 + '/リスト' && r.auto2 === P1 + '/リスト',
       '★名前だけ覚えたPCで、その１ を取り込んでも「その２ ＞ リスト」のまま → ' + r.hint2);
    ok(!r.pick && !SONO2.test(r.bar.text + r.bar.title), '★追いかけたのに選ぶ窓／その２ が出た → ' + JSON.stringify(r.bar));
  });

  /* ---------- ⑩ 地図が別の物件のもの ---------- */
  await scene('⑩', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      const a = await __imp(__set(__P.P2, __ROWS.P2, ['2622MAT001', '2622MAT002']));
      o.a = a.alert; o.pack0 = _mapPack && _mapPack.project;
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick.open;
      openMapView('2611AAA001'); await __sleep(250);
      o.sub = document.getElementById('map-sub').textContent; closeMapView();
      const rec = await idbMapGet('pack');
      o.stored = (rec && rec.pack) ? { project: rec.pack.project, n: (rec.pack.sheets || []).length } : null;
      o.mem = _mapPack ? _mapPack.project : null;
      const d = await __imp(__set(__P.P1, __ROWS.P1, ['2611AAA001', '2611AAA002']));
      o.alert2 = d.alert; o.pack2 = _mapPack && _mapPack.project;
      openMapView('2611AAA001'); await __sleep(250);
      o.sub2 = document.getElementById('map-sub').textContent; closeMapView();
      return o;
    });
    console.log('⑩地図', JSON.stringify(r));
    ok(r.pack0 === P2 && /地図も取り込みました/.test(r.a), '試験の前提: その２ の地図が入っていない → ' + JSON.stringify([r.pack0, r.a]));
    const line = (r.alert.split('\n').find(l => /地図は、別の物件/.test(l)) || '');
    ok(!!line, '★地図が別の物件のものなのに、取り込みの知らせで言わない → ' + r.alert);
    ok(!SONO2.test(line) && !SONO2.test(r.alert), '★地図の知らせに「その２」が出た → ' + r.alert);
    ok(r.sub.indexOf('⚠ 別の物件の地図') === 0, '★別の物件の地図なのに、地図の見出しに印が無い → ' + r.sub);
    ok(r.stored && r.stored.project === P2 && r.stored.n === 2 && r.mem === P2, '★別の物件の地図を消した（地図は消さない） → ' + JSON.stringify([r.stored, r.mem]));
    ok(r.pack2 === P1 && !/別の物件/.test(r.alert2) && r.sub2.indexOf('⚠') !== 0,
       '★その物件の地図を入れたのに、まだ「別の物件」と言う → ' + JSON.stringify([r.pack2, r.alert2, r.sub2]));
  });

  /* ---------- ⑪ 会社の絞り込み ---------- */
  await scene('⑪', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      rcCtrSet('B社');
      await __imp(__led(__P.P1, __ROWS.P1));
      o.ctr1 = _rcCtr; o.ls1 = localStorage.getItem('field_reception_ctr_v1');
      openReceptionModal(); await __sleep(300);
      o.list = (document.getElementById('reception-list') || {}).innerText || ''; closeReceptionModal();
      rcCtrSet('A社');
      await __imp(__led(__P.P1, __ROWS.P1));
      o.ctr2 = _rcCtr;
      return o;
    });
    console.log('⑪会社の絞り込み', JSON.stringify(r));
    ok(r.ctr1 === 'all' && r.ls1 === 'all', '★前の物件の会社（新しい台帳に居ない）で絞り込んだまま → ' + r.ctr1);
    ok(r.list.indexOf('壱 一郎') >= 0 && r.list.indexOf('壱 一子') >= 0, '★新しい台帳の戸別が一覧に出ない → ' + r.list.slice(0, 120));
    ok(r.ctr2 === 'A社', '★新しい台帳に居る会社なのに、絞り込みを外した → ' + r.ctr2);
  });

  /* ---------- ⑫ 起動のとき、古い台帳が新しい台帳を押しのけない ---------- */
  await scene('⑫', { phone:true }, async page => {
    await page.evaluate(async () => {
      const mk = (proj, at, rows) => ({ type:'antenna_reception_ledger', importedAt: at, exportedAt:'', project: proj,
        mainVersion:'174', rows: rows.map(x => Object.assign({ status:'', photos:0 }, x)) });
      /* 本体（IndexedDB）は その２（9/1 に取り込んだ）、写し（localStorage）は その１（9/20）。
         「| 0」で比べると 9/1 の方が大きくなる（32ビットに入らない） */
      await idbMapPut({ key:'reception', data: mk(__P.P2, Date.parse('2026-09-01T00:00:00Z'), __ROWS.P2), savedAt: Date.now() });
      localStorage.setItem('field_reception_ledger_v1', JSON.stringify(mk(__P.P1, Date.parse('2026-09-20T00:00:00Z'), __ROWS.P1)));
      localStorage.setItem('field_savedir_hint_v1', __P.P1 + '/リスト');
      localStorage.setItem('field_savedir_hint_auto_v1', __P.P1 + '/リスト');
    });
    await reopen(page);
    const r = await page.evaluate(async () => {
      const o = { proj: (getReceptionData() || {}).project, hint: saveHintName(), bar: __bar(), body: document.body.innerText };
      /* 起動の読み込みが待ち時間のうちに終わっていなかったときのために、もう1回だけ同じ読み込みを通す */
      await rcLoadFromIdb();
      o.proj2 = (getReceptionData() || {}).project;
      return o;
    });
    console.log('⑫起動のときの台帳', JSON.stringify(noBody(r)));
    ok(r.proj === P1 && r.proj2 === P1, '★起動すると、古い その２ の台帳が戻ってきた → ' + r.proj + ' ／ ' + r.proj2);
    ok(r.hint === P1 + '/リスト', '★起動すると、入れる場所が その２ に戻った → ' + r.hint);
    ok(!SONO2.test(r.bar.text + r.bar.title) && !SONO2.test(r.body), '★起動すると「その２」が出た → ' + JSON.stringify(r.bar));
  });

  /* ---------- ⑬ まとめて保存：いまの台帳に無い戸別を先に言う ---------- */
  await scene('⑬', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P1, __ROWS.P1));
      const mk = async (no, photos) => {
        M = freshModel(); ensureModelShape(M);
        M.chosho_mgmt_no = no; M.chosho_cust_name = '現場の 花子'; M.chosho_date = '2026-09-10';
        M.chosho_photos = photos; M._touched = true; M._viewOnly = false;
        await persistDraft();
      };
      await mk('Z175OLD1', [__ph('o1', '#c33'), __ph('o2', '#3a6')]);   // 前の物件（その２）の下書き
      await mk('2611AAA001', [__ph('n1', '#36c')]);                    // いまの台帳にある戸別
      M = freshModel(); render();
      const snap = async () => ((await idbGetAll()) || []).filter(x => x && x.model)
        .map(x => x.key + ':' + (x.model.chosho_photos || []).map(p => p.id + '/' + String(p.dataUri || '').length).join(','))
        .sort();
      o.before = await snap();
      window.__cancelIf = /まとめて保存します/;               // 書き出す前の確かめで「キャンセル」
      const n0 = __said.length;
      await __T(saveAllDrafts(), 8000); await __sleep(200);
      window.__cancelIf = null;
      o.said = __said.slice(n0); o.after = await snap(); o.shared = window.__shared || 0;
      return o;
    });
    console.log('⑬まとめて保存', JSON.stringify(r));
    const msg = r.said.find(s => /まとめて保存します/.test(s)) || '';
    ok(!!msg, '試験の前提: まとめて保存の確かめが出ない → ' + JSON.stringify(r.said));
    ok(r.before.some(s => /^no:Z175OLD1:o1\/\d+,o2\/\d+$/.test(s)), '試験の前提: 前の物件の下書き（写真2枚）が無い → ' + JSON.stringify(r.before));
    const i = msg.indexOf('いまの受付台帳に無い戸別');
    const part = i >= 0 ? msg.slice(i).split('\n\n')[0] : '';
    ok(/このうち 1件は、いまの受付台帳に無い戸別/.test(msg) && /・Z175OLD1/.test(part),
       '★いまの受付台帳に無い戸別（前の物件の下書き）を、まとめて保存の前に言わない → ' + msg);
    ok(part.indexOf('2611AAA001') < 0, '★台帳にある戸別まで「台帳に無い」と言った → ' + part);
    ok(JSON.stringify(r.before) === JSON.stringify(r.after), '★キャンセルしたのに下書き・写真が変わった → ' + JSON.stringify([r.before, r.after]));
    ok(r.shared === 0, '★キャンセルしたのに書き出した（共有） → ' + r.shared);
  });

  /* ---------- ⑭ 幅320px：長い物件名＋「⚠ 物件が違う」でも横にはみ出さない ---------- */
  await scene('⑭', { mobile:true, width:320, height:700 }, async page => {
    const r = await page.evaluate(async () => {
      const LONG1 = '令和８年度戸別受信設備設置工事' + '三沢市北地区ほか'.repeat(10) + '（その１）';
      const LONG2 = '令和８年度戸別受信設備設置工事' + '三沢市北地区ほか'.repeat(10) + '（その２）';
      const measure = () => {
        const W = document.documentElement.clientWidth;
        const d = document.getElementById('sb-dest');
        const q = s => d ? d.querySelector(s) : null;
        const R = e => e.getBoundingClientRect();
        const x = q('.sb-dest-x'), inn = q('.sb-dest-in'), n = q('.sb-dest-n');
        return { W: W, sw: document.documentElement.scrollWidth, bsw: document.body.scrollWidth,
          other: !!(d && d.classList.contains('other')), tag: x ? x.textContent : '',
          dL: d ? Math.round(R(d).left) : -1, dR: d ? Math.round(R(d).right) : 9999,
          xL: x ? Math.round(R(x).left) : -1, xR: x ? Math.round(R(x).right) : 9999, xW: x ? Math.round(R(x).width) : 0,
          xCut: x ? (x.scrollWidth > x.clientWidth + 1) : null,
          inR: inn ? Math.round(R(inn).right) : 9999, nCut: n ? (n.scrollWidth > n.clientWidth + 1) : null };
      };
      const o = {};
      // PC（フォルダを覚えている）：受付台帳は その１、フォルダは その２
      await __imp(__led(LONG1, __ROWS.P1));
      await saveDirSet(__mkdir('リスト', {}, {}), __mkdir(LONG2, {}, {}));
      renderSaveBar(); await __sleep(120);
      o.pc = measure();
      // スマホ（名前だけ）：入れる場所の名前は その２
      __noPicker(); __noDir();
      saveHintSet(LONG2 + '/リスト'); localStorage.setItem('field_savedir_hint_auto_v1', '');
      renderSaveBar(); await __sleep(120);
      o.sp = measure();
      __pickerBack();
      return o;
    });
    console.log('⑭幅320px', JSON.stringify(r));
    for(const [k, v] of Object.entries(r)){
      ok(v.other && v.tag === '⚠ 物件が違う', '試験の前提: 保存バーに「⚠ 物件が違う」が出ていない（' + k + '） → ' + JSON.stringify(v));
      ok(v.sw <= v.W && v.bsw <= v.W, '★幅320pxで横にはみ出した＝画面が横に動く（' + k + '） → ' + v.sw + ' / ' + v.bsw + ' > ' + v.W);
      ok(v.dL >= 0 && v.dR <= v.W, '★保存バーの📁が画面の外に出た（' + k + '） → ' + v.dL + '〜' + v.dR);
      ok(v.xL >= 0 && v.xR <= v.W && v.xW > 0 && v.xCut === false, '★「⚠ 物件が違う」が画面の外に出た／削れた（' + k + '） → ' + JSON.stringify(v));
      ok(v.inR <= v.W, '★「＞ リスト」が画面の外に出た（' + k + '） → ' + v.inR);
      ok(v.nCut === true, '★長い物件名が「…」になっていない（' + k + '）');
    }
  });

  /* ====================== 見直しで足した場面（版175） ====================== */

  /* ---------- ⑯ 聞く窓・知らせの窓は、地図の画面より上に出る ----------
     地図の画面から現場用ファイルを入れると、保存先を聞く窓が地図の裏に隠れ、地図も出なくなっていた。 */
  await scene('⑯', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const z = id => parseInt(getComputedStyle(document.getElementById(id)).zIndex, 10) || 0;
      const o = { map: z('map-modal'), pick: z('pick-modal'), type: z('type-modal'), dlg: z('ui-dialog'), toast: z('savedhint') };
      // 「保存中…」の暗幕（#save-ov）の重なり
      saveOverlayShow('テスト.json'); await __sleep(50);
      o.ov = z('save-ov'); saveOverlayHide();
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      receptionSaveRows(__led(__P.P1, __ROWS.P1));
      document.getElementById('map-modal').classList.add('open');     // 地図の画面を開いたまま
      const p = savePlaceCheckAfterImport();
      const pm = document.getElementById('pick-modal');
      for(let i = 0; i < 60 && !pm.classList.contains('open'); i++) await __sleep(50);
      await __sleep(700);                       // 下から出てくる動きが終わるのを待つ
      const box = document.getElementById('pick-list').getBoundingClientRect();
      o.box = [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)];
      const el = document.elementFromPoint(box.left + box.width / 2, box.top + Math.min(20, box.height / 2));
      o.onTop = !!(el && el.closest('#pick-modal'));
      o.hit = el ? (el.id || el.className || el.tagName) : null;
      o.open = pm.classList.contains('open');
      await __pickAnswer(null); await __T(p, 3000);
      document.getElementById('map-modal').classList.remove('open');
      return o;
    });
    console.log('⑯地図の上の窓', JSON.stringify(r));
    ok(r.open, '試験の前提: 入れる場所が物件と違うのに選ぶ窓が出ない');
    ok(r.pick > r.map && r.type > r.map && r.dlg > r.map,
       '★聞く窓・知らせの窓が、地図の画面より下にある（地図の裏に隠れる） → ' + JSON.stringify(r));
    ok(r.onTop, '★地図の画面を開いたまま選ぶ窓を出すと、窓が地図の裏に隠れる → ' + JSON.stringify(r));
    ok(r.ov > 0 && r.pick > r.ov && r.type > r.ov && r.dlg > r.ov,
       '★聞く窓・知らせの窓が「保存中…」の暗幕より下にある（保存の途中の質問に答えられない） → ' + JSON.stringify(r));
    ok(r.toast > r.map, '★知らせ（トースト）が地図の画面の裏に隠れる → ' + JSON.stringify(r));
  });

  /* ---------- ⑰ PC のまとめて保存：別の物件（その２）のフォルダを選んだら、書く前に確かめる ----------
     窓はいつも前のフォルダ（その２）から開くので、そのまま選んで その１ の戸別を その２ のリストへ書いていた。
     キャンセル＝何も書かない（下書きも写真もそのまま）。OK＝このフォルダに書く（この物件では、もう聞かない）。 */
  await scene('⑰', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      const list = __mkdir('リスト', {}, {});
      const root = __mkdir(__P.P2, {}, { 'リスト': list });
      await saveDirSet(list, root); renderSaveBar();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      if(c.pick.open) await __pickAnswer('あとで');
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = '2611AAA001'; M.chosho_cust_name = '現場の 花子'; M.chosho_date = '2026-09-10';
      M.chosho_photos = [__ph('n1', '#36c')]; M._touched = true; M._viewOnly = false;
      await persistDraft();
      M = freshModel(); render();
      const snap = async () => ((await idbGetAll()) || []).filter(x => x && x.model)
        .map(x => x.key + ':' + (x.model.chosho_photos || []).map(p => p.id).join(',')).sort();
      o.before = await snap();
      let n = 0;
      window.showDirectoryPicker = async () => { n++; return root; };   // そのまま前のフォルダ（その２）を選ぶ
      window.__cancelIf = /このフォルダでよいですか/;
      let n0 = __said.length;
      await __T(saveAllDrafts(), 10000); await __sleep(300);
      window.__cancelIf = null;
      o.said1 = __said.slice(n0); o.wrote1 = list.__wrote.concat(root.__wrote); o.after1 = await snap(); o.n1 = n;
      o.busy = document.body.classList.contains('busy') || !!document.querySelector('.busy-ov.open');
      n0 = __said.length;
      await __T(saveAllDrafts(), 20000); await __sleep(500);
      o.said2 = __said.slice(n0); o.wrote2 = list.__wrote.slice(); o.bar = __bar();
      return o;
    });
    console.log('⑰PCのまとめて保存', JSON.stringify(r));
    const pre = r.said1.find(s => /まとめて保存します/.test(s)) || '';
    ok(r.n1 === 1, '試験の前提: まとめて保存でフォルダを選ぶ窓が出ない → ' + r.n1);
    ok(/⚠ 前回のフォルダは、受付台帳の物件「/.test(pre) && pre.indexOf(P1) >= 0,
       '★まとめて保存の前の確かめで、前回のフォルダが物件と違うと言わない → ' + pre);
    ok(r.said1.some(s => /名前が違います/.test(s) && s.indexOf(P1) >= 0),
       '★まとめて保存で別の物件（その２）のフォルダを選んでも、書く前に確かめない → ' + JSON.stringify(r.said1));
    ok(r.wrote1.length === 0, '★確かめで「キャンセル」したのに、別の物件のフォルダへ書いた → ' + JSON.stringify(r.wrote1));
    ok(JSON.stringify(r.before) === JSON.stringify(r.after1), '★キャンセルしたのに下書き・写真が変わった → ' + JSON.stringify([r.before, r.after1]));
    ok(r.said2.some(s => /名前が違います/.test(s)) && r.wrote2.indexOf('2611AAA001.json') >= 0,
       '試験の前提: 確かめで OK なのに書かない → ' + JSON.stringify({ said: r.said2.map(s => s.slice(0, 40)), wrote: r.wrote2 }));
    ok(!r.bar.other, '★確かめで OK（このフォルダにする）と答えたのに、帯に ⚠ が残る → ' + JSON.stringify(r.bar));
  });

  /* ---------- ⑰b PC のまとめて保存：別の物件のフォルダを断ったら、前に覚えていた保存先へ戻す ----------
     断ったフォルダを覚えたままだと、次の1件の「保存」が確かめずにそこ（その２）へ書く。 */
  await scene('⑰b', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P1, __ROWS.P1));
      const list1 = __mkdir('リスト', {}, {}); const root1 = __mkdir(__P.P1, {}, { 'リスト': list1 });
      await saveDirSet(list1, root1); renderSaveBar();
      o.place0 = saveDirPlace(); o.ep0 = _saveDirEp;
      /* 試験のにせフォルダは端末の記録（IndexedDB）に入らないので、前の中身と同じに戻るかで見る */
      let rec0 = null; try{ rec0 = await idbMapGet(SAVEDIR_KEY); }catch(_){}
      const ls0 = [localStorage.getItem(LS_SAVEDIR), localStorage.getItem(LS_SAVEDIR_PAR)];
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = '2611AAA001'; M.chosho_cust_name = '現場の 花子'; M.chosho_date = '2026-09-10';
      M.chosho_photos = [__ph('n1', '#36c')]; M._touched = true; M._viewOnly = false;
      await persistDraft();
      M = freshModel(); render();
      const list2 = __mkdir('リスト', {}, {}); const root2 = __mkdir(__P.P2, {}, { 'リスト': list2 });
      window.showDirectoryPicker = async () => root2;      // まちがえて その２ を選ぶ
      window.__cancelIf = /このフォルダでよいですか/;
      const n0 = __said.length;
      await __T(saveAllDrafts(), 10000); await __sleep(300);
      window.__cancelIf = null;
      o.said = __said.slice(n0);
      o.place1 = saveDirPlace(); o.ep1 = _saveDirEp;
      o.same = __same(_saveDir, list1) && __same(saveDirParentOf(_saveDir), root1);
      let rec = null; try{ rec = await idbMapGet(SAVEDIR_KEY); }catch(_){}
      o.recSame = rec0 ? !!(rec && rec.ep === rec0.ep && rec.parentName === rec0.parentName) : !(rec && rec.handle);
      o.ls = [localStorage.getItem(LS_SAVEDIR), localStorage.getItem(LS_SAVEDIR_PAR)];
      o.lsSame = JSON.stringify(o.ls) === JSON.stringify(ls0);
      o.wrote = list1.__wrote.concat(root1.__wrote, list2.__wrote, root2.__wrote);
      o.bar = __bar();
      return o;
    });
    console.log('⑰b断ったフォルダ', JSON.stringify(r));
    ok(r.place0 === P1 + ' ＞ リスト', '試験の前提: その１ ＞ リスト を覚えていない → ' + r.place0);
    ok(r.said.some(s => /名前が違います/.test(s)), '試験の前提: その２ のフォルダで確かめが出ない → ' + JSON.stringify(r.said));
    ok(r.place1 === P1 + ' ＞ リスト' && r.same === true,
       '★まとめて保存で断ったフォルダ（その２）を、保存先として覚えたまま（次の「保存」がそこへ書く） → ' + JSON.stringify([r.place1, r.same]));
    ok(r.ep1 === r.ep0, '★断ったあと、保存先の印（ep）が変わった（前の控えが使えなくなる） → ' + JSON.stringify([r.ep0, r.ep1]));
    ok(r.recSame, '★断ったあと、開き直したときの保存先（端末の記録）が前のフォルダに戻っていない');
    ok(r.lsSame, '★断ったあと、保存先の名前の控えが前のものに戻っていない → ' + JSON.stringify(r.ls));
    ok(r.wrote.length === 0, '★断ったのに、どこかへ書いた → ' + JSON.stringify(r.wrote));
    ok(!r.bar.other, '★前の保存先（その１）に戻ったのに、帯に ⚠ が出る → ' + JSON.stringify(r.bar));
  });

  /* ---------- ⑱ 名前1つの入れる場所（「その２」）・物件のフォルダそのものを覚えた PC ----------
     「/」の無い名前（前の版のころの書き方）や、リストの無い物件のフォルダそのものでも、
     その番号が違えば知らせる。「data」のような物件名でない名前では脅さない。 */
  await scene('⑱', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２');
      o.hint0 = saveHintName();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick; o.bar = __bar();
      o.line = saveHintLine();
      o.chose = await __pickAnswer(__P.P1 + ' ＞ リスト');
      o.hint1 = saveHintName(); o.bar1 = __bar();
      await __pickHint('自分で書く', 'data');
      const d = await __imp(__led(__P.P2, __ROWS.P2));
      o.pickData = d.pick.open; o.barData = __bar();
      if(d.pick.open) await __pickAnswer(null);
      return o;
    });
    console.log('⑱名前1つの入れる場所', JSON.stringify(r));
    ok(r.hint0 === 'その２', '試験の前提: 「その２」と書いた名前を覚えていない → ' + r.hint0);
    ok(/⚠ 入れる場所が、この物件と違います/.test(r.alert), '★名前1つ（「その２」）の入れる場所が物件と違うのに、取り込みの知らせで言わない → ' + r.alert);
    ok(r.pick.open && (r.pick.rows[0] || {}).main === P1 + ' ＞ リスト', '★名前1つ（「その２」）の入れる場所で、選ぶ窓が出ない → ' + JSON.stringify(r.pick));
    ok(r.bar.other && r.bar.tag === '⚠ 物件が違う', '★名前1つの入れる場所で、帯に「⚠ 物件が違う」が出ない → ' + JSON.stringify(r.bar));
    ok(/⚠ 受付台帳の物件「/.test(r.line), '★名前1つの入れる場所で、保存のたびの案内に ⚠ が無い → ' + r.line);
    ok(r.hint1 === P1 + '/リスト' && !r.bar1.other, '★おすすめを選んでも その１ ＞ リスト にならない／⚠ が残る → ' + JSON.stringify([r.hint1, r.bar1]));
    ok(!r.pickData && !r.barData.other, '★物件名でない名前（「data」）で「物件が違う」と脅した → ' + JSON.stringify(r.barData));
  });
  await scene('⑱b', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      const root = __mkdir(__P.P2, { '2622MAT001.json':'{}' }, {});   // リストの無い物件のフォルダそのもの
      await saveDirSet(root, null); renderSaveBar();
      o.bar0 = __bar();
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      o.alert = c.alert; o.pick = c.pick;
      if(c.pick.open) await __pickAnswer('あとで');
      o.bar1 = __bar();
      return o;
    });
    console.log('⑱b物件のフォルダそのもの', JSON.stringify(r));
    ok(!r.bar0.other, '試験の前提: その２ の台帳なのに ⚠ → ' + JSON.stringify(r.bar0));
    ok(/⚠ 保存先が、この物件と違います/.test(r.alert) && r.pick.open,
       '★その２ の物件のフォルダそのものを覚えた PC で、その１ を入れても知らせない → ' + JSON.stringify({ alert: r.alert, pick: r.pick.open }));
    ok(r.bar1.other && r.bar1.tag === '⚠ 物件が違う', '★物件のフォルダそのものを覚えた PC で、帯に ⚠ が出ない → ' + JSON.stringify(r.bar1));
  });

  /* ---------- ⑲ 物件が合う台帳に戻したら、帯の ⚠ もすぐ消える ---------- */
  await scene('⑲', { phone:true }, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      await __pickHint('自分で書く', 'その２/リスト');
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      if(c.pick.open) await __pickAnswer(null);       // やめる
      o.bar1 = __bar();
      const d = await __imp(__led(__P.P2, __ROWS.P2));
      o.pick2 = d.pick.open; o.bar2 = __bar();
      const e = await __imp(__led(__P.P1, __ROWS.P1));
      if(e.pick.open) await __pickAnswer(null);
      o.bar3 = __bar();
      const f = await __imp(__led('', __ROWS.P1));
      o.pick4 = f.pick.open; o.bar4 = __bar();
      return o;
    });
    console.log('⑲帯の描き直し', JSON.stringify(r));
    ok(r.bar1.other, '試験の前提: その１ を入れたあと帯に ⚠ が出ていない → ' + JSON.stringify(r.bar1));
    ok(!r.pick2 && !r.bar2.other, '★その２ の台帳に戻したのに、帯に「⚠ 物件が違う」が残る → ' + JSON.stringify(r.bar2));
    ok(r.bar3.other, '試験の前提: もう一度 その１ を入れたのに ⚠ が出ない → ' + JSON.stringify(r.bar3));
    ok(!r.pick4 && !r.bar4.other, '★物件名の無い台帳を入れたのに、帯に「⚠ 物件が違う」が残る → ' + JSON.stringify(r.bar4));
  });

  /* ---------- ⑳ フォルダを覚えた PC で「名前だけ」選んでも、フォルダの ⚠ は消さない ----------
     名前を選んでも保存の行き先（覚えているフォルダ）は変わらない。⚠ だけ消すと、気づかないまま その２ に書く。 */
  await scene('⑳', {}, async page => {
    const r = await page.evaluate(async () => {
      const o = {};
      await __imp(__led(__P.P2, __ROWS.P2));
      const list = __mkdir('リスト', {}, {});
      const root = __mkdir(__P.P2, {}, { 'リスト': list });
      await saveDirSet(list, root);
      const c = await __imp(__led(__P.P1, __ROWS.P1));
      if(c.pick.open) await __pickAnswer('あとで');
      o.bar0 = __bar();
      const v = await __pickHint(__P.P1 + ' ＞ リスト');
      o.clicked = v.clicked; o.bar1 = __bar(); o.dir = _saveDir && _saveDir.name;
      o.par = __same(saveDirParentOf(_saveDir), root);
      return o;
    });
    console.log('⑳名前だけ選んだPC', JSON.stringify(r));
    ok(r.bar0.other && r.clicked, '試験の前提: ⚠ が出ていない／名前を選べない → ' + JSON.stringify([r.bar0, r.clicked]));
    ok(r.dir === 'リスト' && r.par === true, '試験の前提: 覚えているフォルダが変わった → ' + JSON.stringify([r.dir, r.par]));
    ok(r.bar1.other && r.bar1.tag === '⚠ 物件が違う',
       '★名前だけ選んだら、覚えている その２ のフォルダの ⚠ が消えた（行き先は その２ のまま） → ' + JSON.stringify(r.bar1));
  });

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版175（現場入力）');
})();
