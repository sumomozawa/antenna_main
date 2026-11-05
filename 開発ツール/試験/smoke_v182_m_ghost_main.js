/* 版182（メイン・組 m-ghost）
   「戸別ファイルが見当たりません」の窓と「名前だけ残す」の行（ファイル無の行）を、実際のボタンと窓を押して確かめる。
   ★は直ったあとの正しい動き。版181 で赤くなるものがある（版181 の動きは「見えた」の行に出す）。
     A1 ファイルのある行のファイルを消す → 📁 → 窓で「名前だけ残す」→ ファイル無の行を受付台帳の🗑で消す → 📁
        → 行が確認なしに戻らない・物件にも入らない・端末の控えに残らない
     A2 A1 と同じで、物件を開き直したあとの行（フォルダの掴みが無い行。🗑 の窓は「消す」だけ）→ 行が戻らない・物件ファイルにも入らない
     A3 ファイル無の行の 🗑 に「ファイルごと消す」を出さない・「また出てきます」と言わない・押すと行が消える
     A4 A1 と同じで、読み直しの道が「💾 戸別ファイルへ反映」のあとの読み直し（listReloadFolder）→ 行が戻らない
     A5 A1 と同じで、物件を開かず、アプリを開き直して前回のフォルダを自動で読む道（listReloadRemembered）→ 行が戻らない
     B1 実際に起きたこと：物件ファイルから2行を外し、戸別ファイルも別の場所へ移した（アプリの外）→ 物件を開き直す → 📁
        → 端末の控え（前回見えていた戸別）にだけある番号で窓を出さない・中身の無い行を作らない・物件ファイルへ入れない
     B2 B1 と同じで、窓が出たら「あとで決める」→ 中身の無い行を作らない
     B3 B1 と同じで、控えが「名前だけ残す」のほう（antenna_detached_v1）→ 物件に無い番号の行を黙って起こさない
     C1 名前がどちらも「リスト」の別々のフォルダ（別々の物件）を続けて読む・番号が1件だけ重なる → 相手の全件を「見当たりません」に出さない
     C2 同じで、番号が1件も重ならない → 窓が出ない（残すべき動き）
     C3 物件を開かずに、C1 と同じ2つのフォルダを続けて読む → 相手の全件を「見当たりません」に出さない
     C4 その１ → その２ と読んだあと、その１ を開き直す。その１ の1件だけファイルが無い → その1件を窓に出す（その２ の番号を出さない・黙って消さない）
     D1 残すべき動き：物件に行があるのにファイルだけが無くなった → 窓が出る／名前だけ残すと備考・写真の縮小版が残る／
        ファイルが戻ると行が元に戻る／📁 はフォルダのファイルに触らない
     D2 D1 と同じで、物件を開き直したあとの行（端末の控えで気付く）・備考はファイルに入っている・ファイル無のあいだにもう一度読んでも聞かない・増えない
     D3 残すべき動き：物件を開かずに名前だけ残す → アプリを開き直す → 📁 → 名前だけの行が戻る／ファイルが戻ると元に戻る
     D4 控えの無い端末（このフォルダを読んだことが無い）で、物件に行があるのにファイルだけが無い → 黙って物件から消さない
     D5 残すべき動き：窓で「あとで決める」→ 行は残り、次に読むとまた聞く → 行の「消す」→ 一覧から消え、もう聞かない
     D6 台帳で打っただけの備考（ファイルに入れていない）・ファイル無のあいだにもう一度読む → ファイルが戻っても備考が消えない
     D7 （見るだけ・持ち越し）台帳で打っただけの備考・物件を開き直す → 名前だけ残す → ファイルが戻ると備考が消える（版181 と同じ）
     D8 （見るだけ・持ち越し）台帳で打っただけの備考・物件を開き直す → 📁（ファイルはずっとある）→ 備考が消える（版181 と同じ。↩ 備考の履歴には残る）
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 端末の保管場所は試験のブラウザの中だけ。
   フォルダと共有ファイルは試験の中で作る作り物。ボタン・窓は実際に押す（フォルダ・ファイルを選ぶ画面だけ作り物を返す）。
   ページの中の変数は見るためだけに読む（A5 だけ、作り物は端末に覚えられないので「前回のフォルダ」を手で渡す）。
   使い方: node smoke_v182_m_ghost_main.js [メイン index.html]　（ONLY=A1,B で場面を絞れる） */
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
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0 || String(x).indexOf(label) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

const PJ1 = '令和８年度戸別受信設備設置工事（その１）';
const PJ2 = '令和８年度戸別受信設備設置工事（その２）';
const SHARED = 'その２.json';
const NOTE = 'かぎは大家さん';
const X = '2622MAB001', Y = '2622MAB002', Z = '2622MAB003';       // ふつうの3件。Y のファイルが無くなる
const M1 = '2612ORK121', M2 = '2622MAB021';                        // 実際に物件から外した2件
const P = ['2612AAA001', '2612AAA002', '2612AAA003'], Q = ['2622BBB001', '2622BBB002'];   // その１・その２ の番号
const SAME = '2612ORK121';                                         // どちらのフォルダにもある番号

/* ページの中で使う道具（作り物のフォルダと、見るための道具だけ） */
const SETUP = `
  window.__folders = {};
  window.__moved = {};
  window.__mk = function(name, files){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __removed: [], __writes: [], __mt: {} };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        const t = d.__files[n];
        return { name:n, size: new Blob([t]).size, lastModified: d.__mt[n] || Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { d.__files[n] = buf; d.__mt[n] = Date.now(); d.__writes.push(n); } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]);
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(n in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async n => { const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; },
      removeEntry: async n => { if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(n); delete d.__files[n]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
    return d;
  };
  window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6; const x = cv.getContext('2d');
    x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
  window.__ph = (id, c) => ({ id, label: '写真' + id, dataUri: window.__png(c) });
  window.__pids = t => { try{ const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return ((j && j.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(読めない)'; } };
  /* 戸別ファイルの中身 */
  window.__case = (no, photos, extra) => JSON.stringify(Object.assign({ chosho_mgmt_no: no, chosho_cust_name: no + ' 様', chosho_cust_addr: '三沢市1-' + no.slice(-3),
    chosho_cust_tel: '0176-00-' + no.slice(-4), chosho_status: 'in_progress', work_type: 'uhf_new',
    chosho_photos: (photos || []).map((id, i) => __ph(id, ['#c33', '#3c3', '#33c'][i % 3])) }, extra || {}), null, 2);
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
async function startPage(S){
  await S.page.goto(MAIN);
  await S.page.waitForFunction(() => typeof listSelectFolder === 'function' && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await S.page.evaluate(SETUP);
  S.said.length = 0;
}
async function openMain(label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const S = { label, ctx, page, said: [], scan: 0, name: '' };
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(/再帰スキャン完了/.test(t)) S.scan++;       // 📁 フォルダ の読み込みが最後まで済んだ（物件への取り込みも済んだ）印
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => {
    const type = d.type(), msg = d.message();
    S.said.push({ type, msg });
    if(type === 'prompt'){ d.accept(S.name).catch(()=>{}); return; }
    /* 新しい物件は空で作る（別の工事）。読み込みの前の「まだ戸別ファイルへ入っていません」は OK が中止なのでキャンセル。ほかは OK */
    if(type === 'confirm' && /新しい物件にも入れますか|をこの物件に取り込みますか？\n\nOK＝取り込む|まだ戸別ファイルへ入っていません/.test(msg)){ d.dismiss().catch(()=>{}); return; }
    d.accept().catch(()=>{});
  });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await startPage(S);
  return S;
}
const brief = o => JSON.stringify(o === undefined ? null : o).slice(0, 1200);
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
const alerts = S => S.said.filter(s => s.type === 'alert').map(s => s.msg);

/* ---- 画面の操作 ---- */
async function toMenu(S){
  const st = await S.page.evaluate(() => ({ menu: document.body.classList.contains('menu-open'), list: document.body.classList.contains('list-view-open') }));
  if(st.menu) return;
  await S.page.click(st.list ? '#btn-menu-list' : '#btn-menu-app');
  await S.page.waitForFunction(() => document.body.classList.contains('menu-open'));
}
async function toLedger(S){
  await toMenu(S);
  await S.page.locator('#menu-feats .menu-card .mc-title', { hasText: '受付台帳' }).click();
  await S.page.waitForSelector('#lg-load-folder', { state: 'visible' });
}
const projIs = (S, name) => S.page.evaluate(async n => !!(_currentProject && _currentProject.name === n && await projIdbGet(_currentProject.id)), name);
/* ＋ 新規作成（空の物件） */
async function newProject(S, name){
  await toMenu(S);
  S.name = name;
  await S.page.click('#menu-proj-new');
  for(let i = 0; i < 800; i++){ if(await projIs(S, name)) return; await sleep(50); }
  throw new Error('物件を作れない');
}
/* 物件の一覧の 📂 開く */
async function openFromMenu(S, name){
  await toMenu(S);
  await S.page.locator('#menu-proj-list tr[data-pid]', { hasText: name }).locator('button[data-act="open"]').click();
  for(let i = 0; i < 200; i++){ if(await projIs(S, name)) return; await sleep(50); }
  throw new Error('物件を開けない');
}
/* 📂 共有ファイルを開く（ファイルを選ぶ画面だけ作り物） */
async function openShared(S, drive, file){
  await toMenu(S);
  await S.page.evaluate(({ drive, file }) => { window.showOpenFilePicker = async () => [await window.__folders[drive].getFileHandle(file)]; }, { drive, file });
  const n = alerts(S).length;
  await S.page.click('#menu-proj-openfile');
  for(let i = 0; i < 400; i++){
    if(alerts(S).slice(n).some(m => /ファイル連動で開きました/.test(m))) return;
    await sleep(25);
  }
  throw new Error('共有ファイルを開けない → ' + short(alerts(S).slice(n)));
}
const missWindow = S => S.page.evaluate(() => {
  const ov = document.getElementById('lgmiss-ov');
  if(!ov || !ov.classList.contains('open')) return null;
  return { head: (document.getElementById('lgmiss-head') || {}).textContent || '',
           nos: Array.from(ov.querySelectorAll('.lgmiss-tbl tr')).slice(1).map(tr => tr.children[2].textContent.trim()).sort() };
});
async function waitFolder(S, before){
  const t0 = Date.now();
  for(;;){
    if(S.scan > before) return null;
    const m = await missWindow(S);
    if(m) return m;
    if(Date.now() - t0 > 20000){
      const open = await S.page.evaluate(() => Array.from(document.querySelectorAll('.modal-backdrop.open')).map(e => e.id).join(','));
      throw new Error('📁 の読み込みが終わらない（開いている窓: ' + (open || 'なし') + '）');
    }
    await sleep(40);
  }
}
/* 📁 フォルダ（フォルダを選ぶ画面だけ作り物）。「見当たりません」の窓が出たらその中身を返す。出なければ読み終わって null */
async function pressFolder(S, id){
  const before = S.scan;
  await S.page.evaluate(id => { window.showDirectoryPicker = async () => window.__folders[id]; }, id);
  await S.page.click('#btn-list-select-folder');
  return waitFolder(S, before);
}
/* 窓のボタンを押して、読み終わるまで待つ */
async function answerMiss(S, id){
  const before = S.scan;
  await S.page.click(id);
  const m = await waitFolder(S, before);
  if(m) throw new Error('窓が閉じない');
}
/* 「💾 戸別ファイルへ反映」を押す。全部書けると一覧を読み直す（読み直しに終わりの印は無いので、窓が出るか少し待つ） */
async function pressWriteback(S){
  const n = alerts(S).length;
  await S.page.click('#lg-writeback');
  for(let i = 0; i < 400; i++){
    const a = alerts(S).slice(n);
    if(a.some(m => /一覧を読み直します/.test(m))){
      for(let j = 0; j < 30; j++){ const m = await missWindow(S); if(m) return m; await sleep(40); }
      return null;
    }
    if(a.some(m => /書き戻すものはありません|書き戻せませんでした/.test(m))) throw new Error('反映するものが無い → ' + short(a));
    await sleep(25);
  }
  throw new Error('💾 戸別ファイルへ反映 が終わらない → ' + short(alerts(S).slice(n)));
}
const trOf = (S, no) => S.page.locator('tr[data-uid]', { hasText: no }).first();
/* 受付台帳の 🗑 → 窓の中身を見て、ボタンを押す */
async function ledgerDelete(S, no, btn){
  await trOf(S, no).locator('[data-open="del"]').click();
  await S.page.waitForSelector('#lgdel-modal', { state: 'visible' });
  const o = await S.page.evaluate(() => ({ fileBtn: !!document.getElementById('lgdel-file'),
    listBtn: ((document.getElementById('lgdel-list') || {}).textContent || '').trim(),
    text: (document.querySelector('#lgdel-modal .modal') || {}).innerText || '' }));
  const pick = (btn === '#lgdel-file' && !o.fileBtn) ? '#lgdel-list' : btn;
  await S.page.click(pick);
  o.pressed = pick;
  await S.page.waitForFunction(() => !document.getElementById('lgdel-modal'));
  await sleep(300);
  return o;
}
/* 受付台帳の備考に打ち込む */
async function typeNote(S, no, text){
  const ta = trOf(S, no).locator('textarea.lg-note-input');
  await ta.fill(text);
  await ta.press('Tab');
}
/* 物件の自動保存（1.5秒後）が備考まで書き終わるのを待つ */
async function waitNoteSaved(S, no, text){
  for(let i = 0; i < 200; i++){
    const done = await S.page.evaluate(async ({ no, text }) => {
      const p = await projIdbGet(_currentProject.id);
      return !!(p && p.ledger && p.ledger['m:' + no] && p.ledger['m:' + no].note === text);
    }, { no, text });
    if(done) return;
    await sleep(50);
  }
  throw new Error('備考が物件に保存されない');
}

/* ---- アプリの外でしたこと（作り物のフォルダと共有ファイルを手で変える） ---- */
const mkFolder = (S, id, name, spec) => S.page.evaluate(({ id, name, spec }) => {
  const files = {};
  spec.forEach(c => { files[c[0] + '.json'] = __case(c[0], c[1], c[2]); });
  window.__folders[id] = __mk(name, files);
}, { id, name, spec });
const moveOut = (S, id, no) => S.page.evaluate(({ id, no }) => {
  const d = window.__folders[id], n = no + '.json';
  window.__moved[n] = d.__files[n]; delete d.__files[n];
}, { id, no });
const moveBack = (S, id, no) => S.page.evaluate(({ id, no }) => {
  const d = window.__folders[id], n = no + '.json';
  d.__files[n] = window.__moved[n]; delete window.__moved[n];
}, { id, no });
/* いまの物件の中身から共有ファイルを作る。drop の行を物件ファイルから外す（アプリの外で直接）。更新日時は少し先にする */
const writeShared = (S, drive, file, drop) => S.page.evaluate(async ({ drive, file, drop }) => {
  const p = JSON.parse(JSON.stringify(await projIdbGet(_currentProject.id)));
  p.cases = (p.cases || []).filter(c => drop.indexOf(c.payload.chosho_mgmt_no) < 0);
  p.caseCount = p.cases.length;
  drop.forEach(no => { if(p.ledger) delete p.ledger['m:' + no]; });
  p.updatedAt = new Date(Date.now() + 60000).toISOString();
  window.__folders[drive] = __mk('ドライブ', { [file]: JSON.stringify(p) });
}, { drive, file, drop });

/* ---- 見るだけ ---- */
const look = S => S.page.evaluate(async () => {
  const byNo = (a, b) => String(a.no).localeCompare(String(b.no));
  const js = k => { try { return JSON.parse(lsGet(k)); } catch(_){ return null; } };
  const rows = (_listRows || []).map(r => { const d = r.data || {}; return { no: d.chosho_mgmt_no, name: d.chosho_cust_name || '', addr: d.chosho_cust_addr || '',
    det: r._detached ? r._detached.reason : '', origin: r._origin || '', manual: !!r._manual, dir: !!(r._dir && r._name), ph: r._photoCount,
    thumbs: Array.isArray(r._thumbs) ? r._thumbs.length : 0 }; }).sort(byNo);
  const c = js('antenna_list_census_v1'), det = js('antenna_detached_v1');
  let idb = null;
  if(_currentProject){
    const p = await projIdbGet(_currentProject.id);
    if(p) idb = (p.cases || []).map(x => { const d = x.payload || {}; return { no: d.chosho_mgmt_no, det: d._detached ? d._detached.reason : '', origin: d._origin || '',
      manual: !!d._manual, count: d.chosho_photo_count, thumbs: (d.chosho_photos || []).filter(q => q && q.dataUri).length, note: d.chosho_note || '' }; }).sort(byNo);
  }
  return { proj: _currentProject ? _currentProject.name : '', rows, idb,
           census: c ? { root: c.root, keys: Object.keys(c.entries || {}).sort() } : null,
           det: det ? Object.keys(det).sort() : [], status: (document.getElementById('list-status') || {}).textContent || '' };
});
const sharedCases = (S, drive, file) => S.page.evaluate(({ drive, file }) => {
  const p = JSON.parse(window.__folders[drive].__files[file]);
  return (p.cases || []).map(c => { const d = c.payload || {}; return { no: d.chosho_mgmt_no, det: d._detached ? d._detached.reason : '', origin: d._origin || '', manual: !!d._manual }; })
    .sort((a, b) => String(a.no).localeCompare(String(b.no)));
}, { drive, file });
const folderInfo = (S, id) => S.page.evaluate(id => { const d = window.__folders[id];
  return { writes: d.__writes.slice(), removed: d.__removed.slice(), files: Object.keys(d.__files).sort().map(n => n + ':' + __pids(d.__files[n])) }; }, id);
const ledgerRow = (S, no) => S.page.evaluate(no => {
  const tr = Array.from(document.querySelectorAll('tr[data-uid]')).filter(t => t.textContent.indexOf(no) >= 0)[0];
  if(!tr) return null;
  const ta = tr.querySelector('textarea.lg-note-input');
  return { nofile: !!tr.querySelector('.lg-nofile-badge'), note: ta ? ta.value : '' };
}, no);
const rowOf = (v, no) => (v.rows || []).find(r => r.no === no) || null;
const idbOf = (v, no) => (v.idb || []).find(r => r.no === no) || null;
const nos = v => (v.rows || []).map(r => r.no + (r.det ? '(' + r.det + ')' : '')).join(',');
const idbNos = v => (v.idb || []).map(r => r.no + (r.det ? '(' + r.det + ')' : '')).join(',');
const spNos = sp => sp.map(c => c.no + (c.det ? '(' + c.det + ')' : '')).join(',');

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  console.log('版 ' + WANT_VER);
  const go = async (label, fn) => {
    if(!want(label)) return;
    const S = await openMain(label);
    try { await fn(S); }
    catch(e){ const m = String((e && e.message) || e).slice(0, 500); console.log(label, '止まった', m); fails.push(label + ' 止まった → ' + m); }
    await S.ctx.close();
  };
  /* 物件を作り、3件のフォルダを読み、Y のファイルを動かして「名前だけ残す」まで */
  const makeGhost = async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    const v0 = await look(S);
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S), r1 = await ledgerRow(S, Y);
    ok(nos(v0) === [X, Y, Z].join(','), S.label + ' 試験の前提: 3件読めた → ' + short(v0.rows));
    ok(w1 && w1.nos.join() === Y && rowOf(v1, Y) && rowOf(v1, Y).det === 'kept' && r1 && r1.nofile, S.label + ' 試験の前提: 窓に Y が出て、名前だけ残した → ' + short({ w1, ghost: rowOf(v1, Y), r1 }));
    return { w1, v1, r1 };
  };

  // ---- A1 ファイル無の行を 🗑 で消して読み直す ----
  await go('A1', async S => {
    const { w1, v1, r1 } = await makeGhost(S);
    const del = await ledgerDelete(S, Y, '#lgdel-list');
    const v2 = await look(S);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S), r3 = await ledgerRow(S, Y);
    console.log('A1 見えた', brief({ w1, ghost: rowOf(v1, Y), r1, del: { file: del.fileBtn, list: del.listBtn }, afterDel: nos(v2), detAfterDel: v2.det, w2, rows: nos(v3), idb: idbNos(v3), det: v3.det, r3 }));
    ok(!rowOf(v2, Y), 'A1 試験の前提: 🗑 で一覧から消えた → ' + nos(v2));
    ok(!w2, '★A1 🗑 で消した戸別を、次に読んだとき窓でまた聞いた → ' + short(w2));
    ok(!rowOf(v3, Y), '★A1 🗑 で消したファイル無の行が、読み直すと確認なしに戻った → ' + nos(v3));
    ok(!idbOf(v3, Y), '★A1 🗑 で消したファイル無の行が、物件に戻って保存された → ' + idbNos(v3));
    ok(v3.det.indexOf('m:' + Y) < 0, '★A1 🗑 で消したのに端末の控え（名前だけ残す）に残っている → ' + short(v3.det));
  });

  // ---- A2 物件を開き直したあとのファイル無の行を 🗑 で消して読み直す ----
  await go('A2', async S => {
    await makeGhost(S);
    await writeShared(S, 'D', SHARED, []);
    await openShared(S, 'D', SHARED);
    await toLedger(S);
    const v1 = await look(S);
    const del = await ledgerDelete(S, Y, '#lgdel-list');
    const v2 = await look(S);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S), sp = await sharedCases(S, 'D', SHARED);
    console.log('A2 見えた', brief({ ghost: rowOf(v1, Y), del: { file: del.fileBtn, list: del.listBtn }, afterDel: nos(v2), w2, rows: nos(v3), shared: spNos(sp), det: v3.det }));
    ok(rowOf(v1, Y) && rowOf(v1, Y).det === 'kept' && !rowOf(v1, Y).dir, 'A2 試験の前提: 開き直したあとのファイル無の行 → ' + short(rowOf(v1, Y)));
    ok(!del.fileBtn, 'A2 試験の前提: 開き直した行の 🗑 に「ファイルごと消す」は出ない → ' + short(del));
    ok(!rowOf(v2, Y), 'A2 試験の前提: 🗑 で一覧から消えた → ' + nos(v2));
    ok(!w2, '★A2 🗑 で消した戸別を、次に読んだとき窓でまた聞いた → ' + short(w2));
    ok(!rowOf(v3, Y), '★A2 🗑 で消したファイル無の行が、読み直すと確認なしに戻った → ' + nos(v3));
    ok(!sp.some(c => c.no === Y), '★A2 🗑 で消したファイル無の行が、物件ファイルに戻って保存された → ' + spNos(sp));
  });

  // ---- A3 ファイル無の行の 🗑 に「ファイルごと消す」を出さない ----
  await go('A3', async S => {
    await makeGhost(S);
    S.said.length = 0;
    const del = await ledgerDelete(S, Y, '#lgdel-file');
    const v = await look(S);
    console.log('A3 見えた', brief({ fileBtn: del.fileBtn, listBtn: del.listBtn, pressed: del.pressed, saysComesBack: /また出てきます/.test(del.text), rowLeft: !!rowOf(v, Y), said: alerts(S).map(m => m.slice(0, 60)) }));
    ok(!del.fileBtn && !/また出てきます/.test(del.text), '★A3 ファイル無の行の 🗑 に「ファイルごと消す」か「また出てきます」が出た → ' + brief({ fileBtn: del.fileBtn, text: String(del.text).slice(0, 80) }));
    ok(!rowOf(v, Y), '★A3 消したのに行が残った → ' + short(v.rows));
  });

  // ---- A4 読み直しの道が「💾 戸別ファイルへ反映」のあと ----
  await go('A4', async S => {
    await makeGhost(S);
    await ledgerDelete(S, Y, '#lgdel-list');
    const v2 = await look(S);
    await typeNote(S, X, NOTE);                                  // 反映するものを作る
    const w2 = await pressWriteback(S);
    if(w2){ await S.page.click('#lgmiss-later'); await sleep(500); }
    await sleep(2000);                                           // 読み直したあとの物件の自動保存を待つ
    const v3 = await look(S), f = await folderInfo(S, 'L');
    console.log('A4 見えた', brief({ afterDel: nos(v2), w2, rows: nos(v3), idb: idbNos(v3), writes: f.writes }));
    ok(!rowOf(v2, Y) && f.writes.join() === X + '.json', 'A4 試験の前提: 🗑 で消して、X のファイルへ反映した → ' + short({ rows: nos(v2), f }));
    ok(!w2, '★A4 🗑 で消した戸別を、反映のあとの読み直しで窓でまた聞いた → ' + short(w2));
    ok(!rowOf(v3, Y), '★A4 🗑 で消したファイル無の行が、反映のあとの読み直しで確認なしに戻った → ' + nos(v3));
    ok(!idbOf(v3, Y), '★A4 🗑 で消したファイル無の行が、物件に戻って保存された → ' + idbNos(v3));
  });

  // ---- A5 物件を開かず、アプリを開き直して前回のフォルダを自動で読む道 ----
  await go('A5', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S);
    await ledgerDelete(S, Y, '#lgdel-list');
    const v2 = await look(S);
    await sleep(300);                                            // 端末の控えを書き終わるのを待つ
    await startPage(S);                                          // アプリを開き直す
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    // 端末が覚えている「前回のフォルダ」。作り物は端末に残せないので、ここだけ手で渡す
    await S.page.evaluate(() => { _listDirHandle = window.__folders.L; localStorage.setItem('antenna_list_folder_name', 'リスト'); });
    await toLedger(S);                                           // 一覧を開くと自動で読む
    let w2 = null;
    for(let i = 0; i < 100; i++){
      w2 = await missWindow(S);
      const st = await S.page.evaluate(() => (document.getElementById('list-status') || {}).textContent || '');
      if(w2 || /前回のフォルダ/.test(st)) break;
      await sleep(50);
    }
    if(w2){ await S.page.click('#lgmiss-later'); await sleep(500); }
    const v3 = await look(S);
    console.log('A5 見えた', brief({ w1, ghost: rowOf(v1, Y), afterDel: nos(v2), detAfterDel: v2.det, w2, rows: nos(v3), status: v3.status, det: v3.det }));
    ok(w1 && rowOf(v1, Y) && !rowOf(v2, Y), 'A5 試験の前提: 名前だけ残して、🗑 で消した → ' + short({ w1, v1: nos(v1), v2: nos(v2) }));
    ok(rowOf(v3, X) && rowOf(v3, Z), 'A5 試験の前提: 開き直して自動で読めた → ' + nos(v3));
    ok(!w2, '★A5 🗑 で消した戸別を、自動の読み込みで窓でまた聞いた → ' + short(w2));
    ok(!rowOf(v3, Y), '★A5 🗑 で消したファイル無の行が、開き直して自動で読むと確認なしに戻った → ' + nos(v3));
  });

  // ---- B1・B2 実際に起きたこと ----
  const incident = async (S, btn) => {
    const A = '2622MAB031', B = '2622MAB032';
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[A], [B], [M1, ['m1']], [M2]]);
    await pressFolder(S, 'L');
    await writeShared(S, 'D', SHARED, [M1, M2]);                 // 物件ファイルから2行を外す（アプリの外）
    await moveOut(S, 'L', M1); await moveOut(S, 'L', M2);        // 戸別ファイルも別の場所へ（アプリの外）
    await openShared(S, 'D', SHARED);                            // 数日後：物件を開く
    await toLedger(S);
    const v0 = await look(S);
    const w = await pressFolder(S, 'L');                         // 📁 の読み直し
    if(w) await answerMiss(S, btn);
    const v1 = await look(S), sp = await sharedCases(S, 'D', SHARED);
    ok(nos(v0) === [A, B].join(',') && v0.census && v0.census.keys.indexOf('m:' + M1) >= 0 && v0.census.keys.indexOf('m:' + M2) >= 0,
       S.label + ' 試験の前提: 物件に行が無く、端末の控えにだけ2件ある → ' + short({ rows: nos(v0), census: v0.census }));
    return { v0, w, v1, sp };
  };
  await go('B1', async S => {
    const { v0, w, v1, sp } = await incident(S, '#lgmiss-keep');
    console.log('B1 見えた', brief({ before: nos(v0), census: v0.census, w, rows: nos(v1), ghost: rowOf(v1, M1), shared: sp.filter(c => c.no === M1 || c.no === M2), status: v1.status }));
    ok(!w, '★B1 物件に行が無い番号なのに「見当たりません」の窓が出た → ' + short(w));
    ok(!rowOf(v1, M1) && !rowOf(v1, M2), '★B1 物件に無い番号の中身の無い行ができた → ' + nos(v1));
    ok(!idbOf(v1, M1) && !idbOf(v1, M2), '★B1 中身の無い行が物件に保存された → ' + idbNos(v1));
    ok(!sp.some(c => c.no === M1 || c.no === M2), '★B1 中身の無い行が物件ファイルへ戻って保存された → ' + spNos(sp));
  });
  await go('B2', async S => {
    const { w, v1, sp } = await incident(S, '#lgmiss-later');
    console.log('B2 見えた', brief({ w, rows: nos(v1), ghost: rowOf(v1, M1), shared: sp.filter(c => c.no === M1 || c.no === M2), census: v1.census, det: v1.det }));
    ok(!rowOf(v1, M1) && !rowOf(v1, M2), '★B2 「あとで決める」でも、物件に無い番号の中身の無い行ができた → ' + nos(v1));
    ok(!sp.some(c => c.no === M1 || c.no === M2), '★B2 「あとで決める」でも、中身の無い行が物件ファイルへ入った → ' + spNos(sp));
  });

  // ---- B3 控えが「名前だけ残す」のほう ----
  await go('B3', async S => {
    const A = '2622MAB031', B = '2622MAB032';
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[A], [B], [M1]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', M1);
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-keep');
    await writeShared(S, 'D', SHARED, [M1]);                     // ほかの端末で行を消した（物件ファイルに行が無い）
    await openShared(S, 'D', SHARED);
    await toLedger(S);
    const v0 = await look(S);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S), sp = await sharedCases(S, 'D', SHARED);
    console.log('B3 見えた', brief({ before: nos(v0), det: v0.det, w, rows: nos(v1), ghost: rowOf(v1, M1), shared: sp.filter(c => c.no === M1) }));
    ok(!rowOf(v0, M1) && v0.det.indexOf('m:' + M1) >= 0, 'B3 試験の前提: 物件に行が無く、名前だけ残すの控えにだけある → ' + short({ rows: nos(v0), det: v0.det }));
    ok(!rowOf(v1, M1), '★B3 物件に無い番号の行を、端末の控えから黙って起こした → ' + nos(v1));
    ok(!sp.some(c => c.no === M1), '★B3 物件に無い番号の行が物件ファイルへ戻って保存された → ' + spNos(sp));
  });

  // ---- C 名前がどちらも「リスト」の別々のフォルダ ----
  await go('C1', async S => {
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.concat(SAME).map(n => [n]));
    await pressFolder(S, 'L1');
    const v0 = await look(S);
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', Q.concat(SAME).map(n => [n]));
    const w = await pressFolder(S, 'L2');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S);
    console.log('C1 見えた', brief({ census0: v0.census, proj: v1.proj, w, rows: nos(v1), idb: idbNos(v1), det: v1.det }));
    ok(v0.census && v0.census.root === 'リスト' && v0.census.keys.length === 4, 'C1 試験の前提: その１ の控えがある → ' + short(v0.census));
    ok(rowOf(v1, SAME) && Q.every(n => rowOf(v1, n)), 'C1 試験の前提: 読んだフォルダの行がある → ' + nos(v1));
    ok(!w, '★C1 別の物件の「リスト」を読んだら、前の物件の全件が「見当たりません」に出た → ' + short(w));
    ok(!P.some(n => rowOf(v1, n)), '★C1 別の物件の番号の、中身の無い行ができた → ' + nos(v1));
    ok(!P.some(n => idbOf(v1, n)), '★C1 別の物件の番号の行が、この物件に保存された → ' + idbNos(v1));
  });
  await go('C2', async S => {
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.map(n => [n]));
    await pressFolder(S, 'L1');
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', Q.map(n => [n]));
    const w = await pressFolder(S, 'L2');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    console.log('C2 見えた', brief({ w, rows: nos(v1), census: v1.census }));
    ok(!w, '★C2 番号の重ならない別のフォルダで窓が出た → ' + short(w));
    ok(nos(v1) === Q.join(','), '★C2 読んだフォルダの行だけにならない → ' + nos(v1));
  });
  await go('C3', async S => {
    await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.concat(SAME).map(n => [n]));
    await pressFolder(S, 'L1');
    await mkFolder(S, 'L2', 'リスト', Q.concat(SAME).map(n => [n]));
    const w = await pressFolder(S, 'L2');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    console.log('C3 見えた', brief({ w, rows: nos(v1), census: v1.census }));
    ok(!w, '★C3 物件を開かずに別の「リスト」を読んだら、前のフォルダの全件が「見当たりません」に出た → ' + short(w));
    ok(!P.some(n => rowOf(v1, n)), '★C3 前のフォルダの番号の、中身の無い行ができた → ' + nos(v1));
  });
  await go('C4', async S => {
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.concat(SAME).map(n => [n]));
    await pressFolder(S, 'L1');
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', Q.concat(SAME).map(n => [n]));
    const w0 = await pressFolder(S, 'L2');
    if(w0){                                                      // 窓が出たら、中身の無い行を残さないよう、行の「消す」を選んで閉じる
      for(let i = 0; i < w0.nos.length; i++) await S.page.check('#lgmiss-ov input[name="lgmiss' + i + '"][value="drop"]');
      await answerMiss(S, '#lgmiss-drop');
    }
    await openFromMenu(S, PJ1); await toLedger(S);
    const v0 = await look(S);
    await moveOut(S, 'L1', P[0]);                                // その１ の1件だけファイルが無くなった
    const w = await pressFolder(S, 'L1');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S);
    console.log('C4 見えた', brief({ before: nos(v0), census0: v0.census, w, rows: nos(v1), idb: idbNos(v1) }));
    ok(P.every(n => rowOf(v0, n)) && rowOf(v0, SAME), 'C4 試験の前提: その１ を開き直した → ' + nos(v0));
    ok(w && w.nos.join() === P[0], '★C4 物件を行き来したあと、ファイルだけ無くなった行が窓に出ない／別の物件の番号が出た → ' + short(w));
    ok(rowOf(v1, P[0]), '★C4 物件に行があるのにファイルが無い戸別が、聞かれないまま一覧から消えた → ' + nos(v1));
    ok(idbOf(v1, P[0]), '★C4 物件に行があるのにファイルが無い戸別が、聞かれないまま物件から消えた → ' + idbNos(v1));
  });

  /* 名前だけ残した行に、もとの中身・備考・写真の縮小版が残っているか */
  const checkGhost = (lb, v1, r1, note) => {
    const g = rowOf(v1, Y), gi = idbOf(v1, Y);
    ok(g && g.det === 'kept' && g.name === Y + ' 様' && g.addr && r1 && r1.nofile, '★' + lb + ' 名前だけ残した行の中身が残らない → ' + short({ g, r1 }));
    ok(r1 && r1.note === note && gi && gi.note === note, '★' + lb + ' 名前だけ残すと備考が消えた → ' + short({ r1, gi }));
    ok(gi && gi.det === 'kept' && gi.count === 2 && gi.thumbs === 2, '★' + lb + ' 名前だけ残した行の写真の縮小版が物件から減った → ' + short(gi));
  };
  /* ファイルが戻ったあと、行がもとに戻っているか。📁 はフォルダのファイルに触らない */
  const checkBack = (lb, w3, v3, f) => {
    const b = rowOf(v3, Y), bi = idbOf(v3, Y);
    ok(!w3, '★' + lb + ' ファイルが戻ったのに窓が出た → ' + short(w3));
    ok(nos(v3) === [X, Y, Z].join(',') && b && !b.manual && b.dir && b.ph === 2, '★' + lb + ' ファイルが戻っても行が元に戻らない → ' + short({ rows: nos(v3), b }));
    ok(bi && !bi.det && !bi.manual && bi.count === 2, '★' + lb + ' ファイルが戻っても物件の行が元に戻らない → ' + short(bi));
    ok(v3.det.indexOf('m:' + Y) < 0, '★' + lb + ' ファイルが戻っても端末の控え（名前だけ残す）に残っている → ' + short(v3.det));
    ok(f.writes.length === 0 && f.removed.length === 0 && f.files.join(' ').indexOf(Y + '.json:y1,y2') >= 0 && f.files.length === 3, '★' + lb + ' 📁 で戸別ファイルが変わった → ' + short(f));
  };

  // ---- D1 残すべき動き：物件に行があるのにファイルだけが無くなった（同じ画面のまま） ----
  await go('D1', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE);
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S), r1 = await ledgerRow(S, Y);
    await moveBack(S, 'L', Y);
    const w3 = await pressFolder(S, 'L');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S), r3 = await ledgerRow(S, Y), f = await folderInfo(S, 'L');
    console.log('D1 見えた', brief({ w1, ghost: rowOf(v1, Y), idb: idbOf(v1, Y), r1, w3, back: rowOf(v3, Y), idb3: idbOf(v3, Y), r3, det: v3.det, folder: f }));
    ok(w1 && w1.nos.join() === Y, '★D1 物件に行があるのにファイルだけが無くなったのに、窓に出ない → ' + short(w1));
    checkGhost('D1', v1, r1, NOTE);
    checkBack('D1', w3, v3, f);
    ok(r3 && !r3.nofile && r3.note === NOTE, '★D1 ファイルが戻ると備考が消えた／ファイル無の札が残る → ' + short(r3));
  });

  // ---- D2 残すべき動き：物件を開き直したあとの行（備考はファイルに入っている） ----
  await go('D2', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2'], { chosho_note: NOTE }], [Z]]);
    await pressFolder(S, 'L');
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    const v0 = await look(S);
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S), r1 = await ledgerRow(S, Y), sp1 = await sharedCases(S, 'D', SHARED);
    const w2 = await pressFolder(S, 'L');                        // もう一度読んでも聞かない・増えない
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v2 = await look(S);
    await moveBack(S, 'L', Y);
    const w3 = await pressFolder(S, 'L');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S), r3 = await ledgerRow(S, Y), f = await folderInfo(S, 'L');
    console.log('D2 見えた', brief({ dir0: rowOf(v0, Y) && rowOf(v0, Y).dir, w1, ghost: rowOf(v1, Y), idb: idbOf(v1, Y), r1, shared: spNos(sp1), w2, rows2: nos(v2), w3, back: rowOf(v3, Y), r3, det: v3.det, folder: f }));
    ok(rowOf(v0, Y) && !rowOf(v0, Y).dir, 'D2 試験の前提: 開き直した行はフォルダを掴んでいない → ' + short(rowOf(v0, Y)));
    ok(w1 && w1.nos.join() === Y, '★D2 物件に行があるのにファイルだけが無くなったのに、窓に出ない → ' + short(w1));
    checkGhost('D2', v1, r1, NOTE);
    ok(sp1.some(c => c.no === Y && c.det === 'kept'), '★D2 名前だけ残した行が物件ファイルに入らない → ' + spNos(sp1));
    ok(!w2 && nos(v2) === [X, Y + '(kept)', Z].join(','), '★D2 もう一度読むと、また聞く／行が増える → ' + short({ w2, rows: nos(v2) }));
    checkBack('D2', w3, v3, f);
    ok(r3 && !r3.nofile && r3.note === NOTE, '★D2 ファイルが戻ると備考が消えた／ファイル無の札が残る → ' + short(r3));
  });

  // ---- D3 残すべき動き：物件を開かずに名前だけ残す → アプリを開き直す ----
  await go('D3', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE);
    const yText = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-keep');
    const v1 = await look(S);
    await sleep(300);                                            // 端末の控えを書き終わるのを待つ
    await startPage(S);                                          // アプリを開き直す
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    await toLedger(S);
    const v2 = await look(S);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S), r3 = await ledgerRow(S, Y);
    await S.page.evaluate(({ n, t }) => { window.__folders.L.__files[n] = t; }, { n: Y + '.json', t: yText });
    const w4 = await pressFolder(S, 'L');
    if(w4) await answerMiss(S, '#lgmiss-later');
    const v4 = await look(S), r4 = await ledgerRow(S, Y);
    console.log('D3 見えた', brief({ w1, ghost: rowOf(v1, Y), reopened: nos(v2), det: v2.det, w2, rows: nos(v3), ghost3: rowOf(v3, Y), r3, w4, rows4: nos(v4), r4, det4: v4.det }));
    ok(w1 && rowOf(v1, Y) && rowOf(v1, Y).det === 'kept', 'D3 試験の前提: 名前だけ残した → ' + short({ w1, ghost: rowOf(v1, Y) }));
    ok(!v2.rows.length, 'D3 試験の前提: 開き直すと一覧は空 → ' + nos(v2));
    ok(!w2 && rowOf(v3, Y) && rowOf(v3, Y).det === 'kept' && rowOf(v3, Y).name === Y + ' 様', '★D3 開き直して読むと、名前だけの行が戻らない → ' + short({ w2, rows: nos(v3), g: rowOf(v3, Y) }));
    ok(r3 && r3.nofile && r3.note === NOTE, '★D3 開き直すと備考が消えた → ' + short(r3));
    ok(!w4 && nos(v4) === [X, Y, Z].join(',') && r4 && !r4.nofile && r4.note === NOTE, '★D3 ファイルが戻っても行が元に戻らない → ' + short({ w4, rows: nos(v4), r4 }));
    ok(v4.det.indexOf('m:' + Y) < 0, '★D3 ファイルが戻っても端末の控え（名前だけ残す）に残っている → ' + short(v4.det));
  });

  // ---- D4 控えの無い端末で、物件に行があるのにファイルだけが無い ----
  if(want('D4')){
    let text = '';
    const T1 = await openMain('D4端末1');
    try {
      await newProject(T1, PJ2); await toLedger(T1);
      await mkFolder(T1, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
      await pressFolder(T1, 'L');
      await typeNote(T1, Y, NOTE);
      await waitNoteSaved(T1, Y, NOTE);
      text = await T1.page.evaluate(async () => JSON.stringify(await projIdbGet(_currentProject.id)));
    } catch(e){ fails.push('D4 止まった（端末1） → ' + String((e && e.message) || e).slice(0, 400)); }
    await T1.ctx.close();
    await go('D4', async S => {
      await S.page.evaluate(({ t, f }) => { window.__folders.D = __mk('ドライブ', { [f]: t }); }, { t: text, f: SHARED });
      await mkFolder(S, 'L', 'リスト', [[X], [Z]]);              // Y のファイルだけ無い
      await openShared(S, 'D', SHARED);
      await toLedger(S);
      const v0 = await look(S);
      const w = await pressFolder(S, 'L');
      if(w) await answerMiss(S, '#lgmiss-keep');
      const v1 = await look(S), sp = await sharedCases(S, 'D', SHARED), r1 = await ledgerRow(S, Y);
      const ledger = await S.page.evaluate(({ d, f, k }) => { const p = JSON.parse(window.__folders[d].__files[f]); return !!(p.ledger && p.ledger[k]); }, { d: 'D', f: SHARED, k: 'm:' + Y });
      console.log('D4 見えた', brief({ before: nos(v0), row0: rowOf(v0, Y), census0: v0.census, w, rows: nos(v1), idb: idbOf(v1, Y), shared: spNos(sp), sharedLedger: ledger, r1 }));
      ok(nos(v0) === [X, Y, Z].join(',') && !v0.census, 'D4 試験の前提: 物件に行があり、端末の控えが無い → ' + short({ rows: nos(v0), census: v0.census }));
      ok(rowOf(v1, Y), '★D4 物件に行があるのにファイルが無い戸別が、聞かれないまま一覧から消えた → ' + short({ w, rows: nos(v1) }));
      ok(sp.some(c => c.no === Y), '★D4 物件に行があるのにファイルが無い戸別が、聞かれないまま物件ファイルから消えた → ' + spNos(sp));
    });
  }

  // ---- D5 残すべき動き：「あとで決める」→ 次にまた聞く →「消す」 ----
  await go('D5', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S), r1 = await ledgerRow(S, Y);
    const w2 = await pressFolder(S, 'L');
    if(w2){
      await S.page.check('#lgmiss-ov input[name="lgmiss0"][value="drop"]');
      await answerMiss(S, '#lgmiss-drop');
    }
    const v2 = await look(S);
    const w3 = await pressFolder(S, 'L');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S);
    console.log('D5 見えた', brief({ w1, ghost: rowOf(v1, Y), r1, w2, afterDrop: nos(v2), w3, rows: nos(v3), idb: idbNos(v3), det: v3.det, census: v3.census }));
    ok(w1 && rowOf(v1, Y) && rowOf(v1, Y).det === 'pending', '★D5 「あとで決める」で行が残らない → ' + short({ w1, ghost: rowOf(v1, Y) }));
    ok(w2 && w2.nos.join() === Y, '★D5 「あとで決める」のあと、次に読んでも聞かない → ' + short(w2));
    ok(!rowOf(v2, Y), '★D5 窓の「消す」で行が消えない → ' + nos(v2));
    ok(!w3 && !rowOf(v3, Y) && !idbOf(v3, Y), '★D5 窓の「消す」で消した戸別が戻った → ' + short({ w3, rows: nos(v3), idb: idbNos(v3) }));
  });

  // ---- D6・D7 台帳で打っただけの備考（ファイルに入れていない）はファイルが戻っても消えない ----
  for(const lb of ['D6', 'D7']){
    await go(lb, async S => {
      await newProject(S, PJ2); await toLedger(S);
      await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
      await pressFolder(S, 'L');
      await typeNote(S, Y, NOTE);
      await waitNoteSaved(S, Y, NOTE);
      if(lb === 'D7'){ await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S); }
      await moveOut(S, 'L', Y);
      const w1 = await pressFolder(S, 'L');
      if(w1) await answerMiss(S, '#lgmiss-keep');
      const v1 = await look(S), r1 = await ledgerRow(S, Y);
      if(lb === 'D6'){ const w2 = await pressFolder(S, 'L'); if(w2) await answerMiss(S, '#lgmiss-later'); }   // ファイル無のあいだにもう一度読む
      const r2 = await ledgerRow(S, Y);
      await moveBack(S, 'L', Y);
      const w3 = await pressFolder(S, 'L');
      if(w3) await answerMiss(S, '#lgmiss-later');
      const v3 = await look(S), r3 = await ledgerRow(S, Y);
      console.log(lb + ' 見えた', brief({ w1, r1, r2, w3, rows: nos(v3), r3, idb3: idbOf(v3, Y) }));
      ok(r1 && r1.note === NOTE && r2 && r2.note === NOTE, lb + ' 試験の前提: 名前だけ残した行に備考がある → ' + short({ r1, r2 }));
      if(lb === 'D6') ok(r3 && r3.note === NOTE, '★' + lb + ' ファイルが戻ると、台帳で打った備考が消えた → ' + short(r3));   // D7 は持ち越し（物件の行の備考を控えに書く作りを変える別の版）
    });
  }

  // ---- D8 （見るだけ・持ち越し）ファイルはずっとある。台帳で打っただけの備考・物件を開き直す → 📁 ----
  await go('D8', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE);
    await waitNoteSaved(S, Y, NOTE);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    const r0 = await ledgerRow(S, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const r1 = await ledgerRow(S, Y);
    const log = await S.page.evaluate(k => JSON.stringify(_lgNoteLog).indexOf(k) >= 0, NOTE);   // 「↩ 備考の履歴」に残っているか
    console.log('D8 見えた（見るだけ）', brief({ r0, w, r1, inNoteLog: log }));
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v182_m_ghost_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
