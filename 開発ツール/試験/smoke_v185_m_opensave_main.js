/* 版185（メイン・組 m-opensave）
   ファイルから開いた図面のある行で、開いているあいだに現場がファイルを保存し、そのまま「💾 上書き保存」を押すと、
   現場の新しい内容を画面の値で消していた（写真と工程の印は残っていた）。★は直ったあとの正しい動き。作りは smoke_v184_m_projsave_main.js と同じ。
     R1  何も直さず 💾 → ファイルの中身はそのまま・行と画面も新しい中身になる
     R2  電話を直して 💾 → 電話だけ入り、ほかは現場の中身。続けて 💾 しても戻らない
     R3  現場が保存していない → 今までどおり全部の欄を書く  R3b 続けて 💾：いま書いたファイルを「新しい」と見ない
     R4  開く前に現場が保存（開くときファイルを読むが、住所などは行の値がかぶさる）→ 合わせて書く
     R5  現場が直した備考は採る  R5b 台帳で直した備考は残す  R5c 画面で打った備考は書く
     R6  直した欄の分からない行は書かずに知らせる  R7 📥 で入れてまだファイルに無い行は合わせない
     R8  開いたあとで現場が足した写真は残る  R8b 画面で足した写真は残る  R8c 画面で消した写真は戻らない  R6b 物件なしで止めたときの知らせ
     R9  書けなかったとき：画面の直しは残り、もう一度 💾 で入る（印が残って行へ取り込めなくならない）
     R10 物件を開いていないときも同じ  R11 現場が書いたファイルでも、PCだけが持つ欄は画面の値を残す
     R12 書いているあいだに打った欄：消えない・次の 💾 で入る
   使い方: node smoke_v185_m_opensave_main.js [メイン index.html]　（ONLY=R1,R5b で場面を絞れる。完全一致） */
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
const want = label => !ONLY.length || ONLY.indexOf(String(label)) >= 0;
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
  const S = { label, ctx, page, said: [], scan: 0, name: '', foreignSeen: [] };
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(/再帰スキャン完了/.test(t)) S.scan++;       // 📁 フォルダ の読み込みが最後まで済んだ（物件への取り込みも済んだ）印
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => {
    const type = d.type(), msg = d.message();
    S.said.push({ type, msg });
    if(type === 'prompt'){ d.accept(S.name).catch(()=>{}); return; }
    if(S.dismiss && S.dismiss.test(msg)){ d.dismiss().catch(()=>{}); return; }
    if(S.keepAsk && /まだ戸別ファイルへ入っていません/.test(msg)){ d.accept().catch(()=>{}); return; }
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
    const fm = await S.page.evaluate(() => { const x = document.getElementById('lgforeign-modal'); return x ? x.innerText : ''; });
    if(fm){ S.foreignSeen.push(fm); await S.page.click(S.foreign || '#lgforeign-stop'); await sleep(80); continue; }
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
  const confirms = S => S.said.filter(s => s.type === 'confirm').map(s => s.msg);
  const ghostOf = async (S, spec) => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', spec || [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
  };

  // ---- 道具 ----
  const reopen = async S => { await sleep(1800); await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S); };
  const rowSt = (S, no) => S.page.evaluate(no => {
    const r = _listRows.find(x => (x.data || {}).chosho_mgmt_no === no);
    return r ? { s: r.data.chosho_status, ed: !!r._lgEdited, note: r.data.chosho_note || '', fp: !!r._fromProject } : null;
  }, no);
  const led = (S, no) => S.page.evaluate(k => Object.assign({}, _ledgerMap[k] || {}), 'm:' + no);
  const putFile = (S, id, n, no, photos, extra) => S.page.evaluate(({ id, n, no, photos, extra }) => {
    window.__folders[id].__files[n] = __case(no, photos, extra);
  }, { id, n, no, photos, extra });
  const askedDiscard = S => S.said.filter(m => /まだ戸別ファイルへ入っていません/.test(m.msg));
  const ticked = (S, no, f, v) => S.page.evaluate(({ k, f, v }) => { setLedger(k, { [f]: v }); }, { k: 'm:' + no, f, v });
  const start = async (S, spec) => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', spec || [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
  };
  const doneTick = (S, no) => S.page.evaluate(no => {
    const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
    lgWriteCaseField(r, 'status', 'completed');
  }, no);

  const fileOf = (S, no) => S.page.evaluate(n => JSON.parse(window.__folders.L.__files[n]), no + '.json');
  const NEW = '2030-01-01T00:00:00.000Z', OLD = '2020-01-01T00:00:00.000Z';
  const MS = { channels: ['14-2ch'], antenna: [{ db: 41.5, mer: 32, ber: 0 }], amplifier: [{ db: 80.5, mer: 32, ber: 0 }], terminal: [{ db: 60.5, mer: 32, ber: 0 }] };
  const genba = { chosho_cust_addr: '現場の住所', chosho_status: 'completed', work_done: true, work_done_at: '2026-11-05', flyer_done: true,
                  chosho_note: '現場の備考', amplifier: 'amp_3u43', measurements: MS, _origin: 'genba', editedAt: NEW };
  const openRow = (S, no) => S.page.evaluate(async no => { await openCaseInEditor(_listRows.find(x => x.data.chosho_mgmt_no === no), false); }, no);
  /* 本物のボタンを押す（押すと、保存の前に画面の中身が行へ入る）。知らせが出るまで待つ */
  const pressOnly = async S => { S.said.length = 0; await S.page.evaluate(() => { document.getElementById('btn-save-overwrite').click(); }); };
  const saved = async S => { for(let i = 0; i < 600 && !alerts(S).length; i++) await sleep(25); await sleep(500); };
  const press = async S => { await pressOnly(S); await saved(S); };
  const typeField = (S, id, v) => S.page.evaluate(({ id, v }) => {
    const t = document.getElementById(id); t.value = v;
    t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true }));
  }, { id, v });
  const rowOf2 = (S, no) => S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
    return r ? { addr: r.data.chosho_cust_addr, st: r.data.chosho_status, amp: r.data.amplifier, ms: r.data.measurements, note: r.data.chosho_note,
                 ed: !!r._lgEdited, fp: !!r._fromProject, merged: !!r._indivMerged } : null; }, no);
  const scr = (S, id) => S.page.evaluate(id => (document.getElementById(id) || {}).value, id);
  const merged = S => alerts(S).some(m => /いま直した欄だけをファイルの中身へ入れて書きました/.test(m));
  const okGenba = (f, label) => {
    ok(f.chosho_cust_addr === '現場の住所', '★' + label + ' 現場の住所を物件の古い値で消した → ' + f.chosho_cust_addr);
    ok(f.chosho_status === 'completed' && f.work_done === true && f.work_done_at === '2026-11-05', '★' + label + ' 現場の完了を消した → ' + short({ s: f.chosho_status, w: f.work_done, a: f.work_done_at }));
    ok(f.flyer_done === true, '★' + label + ' 現場の ✔ を消した → ' + f.flyer_done);
    ok(f.amplifier === 'amp_3u43' && f.measurements && f.measurements.antenna && f.measurements.antenna[0].db === 41.5, '★' + label + ' 現場の機器・測定値を消した → ' + short({ a: f.amplifier, m: f.measurements }));
  };

  const amp = { amplifier: 'amp_3u43', editedAt: OLD };
  const startRow = (S, ex) => start(S, [[X], [Y, [], Object.assign({}, amp, ex || {})], [Z]]);
  const fromFile = S => S.page.evaluate(() => !!(_loadedOrigin && _loadedOrigin.fileHandle));

  // ---- R1 何も直さず 💾 ----
  await go('R1', async S => {
    await startRow(S);
    await openRow(S, Y);
    const org = await fromFile(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await press(S);
    const f = await fileOf(S, Y), r = await rowOf2(S, Y), sa = await scr(S, 'chosho_cust_addr'), a = alerts(S);
    console.log('R1', brief({ org, f: { a: f.chosho_cust_addr, s: f.chosho_status, n: f.chosho_note, o: f._origin }, r: { a: r.addr, s: r.st }, sa, said: a.slice(-1).map(m => m.slice(0, 240)) }));
    ok(org, 'R1 試験の前提: ファイルから開いた');
    okGenba(f, 'R1');
    ok(f.chosho_note === '現場の備考', '★R1 現場の備考を消した → ' + f.chosho_note);
    ok(merged(S), '★R1 合わせて書いた知らせが無い → ' + short(a));
    ok(r.addr === '現場の住所' && r.st === 'completed', '★R1 行が新しい中身にならない → ' + short(r));
    ok(sa === '現場の住所', '★R1 画面が前の中身のまま → ' + sa);
  });

  // ---- R2 電話を直して 💾・続けて 💾 ----
  await go('R2', async S => {
    await startRow(S);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await press(S);
    const f = await fileOf(S, Y), sa = await scr(S, 'chosho_cust_addr');
    const ek = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { e: r._edKeys || null, n: r._rowNewer || null }; }, Y);
    console.log('R2', brief({ t: f.chosho_cust_tel, a: f.chosho_cust_addr, s: f.chosho_status, sa, ek }));
    ok(!ek.e && !ek.n, '★R2 書けたのに直した欄の印が残った → ' + short(ek));
    okGenba(f, 'R2');
    ok(f.chosho_cust_tel === '090-1234-5678', '★R2 いま直した電話が入らない → ' + f.chosho_cust_tel);
    ok(sa === '現場の住所', '★R2 画面が前の中身のまま → ' + sa);
    await typeField(S, 'chosho_cust_tel', '090-9999-0000');
    await press(S);
    const f2 = await fileOf(S, Y);
    console.log('R2 続き', brief({ t: f2.chosho_cust_tel, a: f2.chosho_cust_addr, m: merged(S) }));
    okGenba(f2, 'R2 続き');
    ok(f2.chosho_cust_tel === '090-9999-0000', '★R2 続きの電話が入らない → ' + f2.chosho_cust_tel);
    ok(!merged(S), '★R2 いま書いたファイルを「新しい」と見た');
  });

  // ---- R3 現場が保存していない → 全部の欄を書く ----
  await go('R3', async S => {
    await startRow(S);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1111-2222');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R3', brief({ t: f.chosho_cust_tel, m: merged(S) }));
    ok(f.chosho_cust_tel === '090-1111-2222', '★R3 直した電話が入らない → ' + f.chosho_cust_tel);
    ok(!merged(S), '★R3 ファイルが新しくないのに合わせて書いた');
  });

  // ---- R3b 続けて 💾：いま書いたファイルを「新しい」と見ない ----
  await go('R3b', async S => {
    await startRow(S);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1111-0001');
    await press(S);
    await sleep(50);
    await typeField(S, 'chosho_cust_tel', '090-1111-0002');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R3b', brief({ t: f.chosho_cust_tel, m: merged(S) }));
    ok(f.chosho_cust_tel === '090-1111-0002', 'R3b 2回目の電話が入る → ' + f.chosho_cust_tel);
    ok(!merged(S), '★R3b いま書いたファイルを「新しい」と見た');
  });

  // ---- R4 開く前に現場が保存（開くときファイルを読むが、住所などは行の値がかぶさる）→ 合わせて書く ----
  await go('R4', async S => {
    await startRow(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await S.page.evaluate(no => { _listRows.find(x => x.data.chosho_mgmt_no === no)._slim = true; }, Y);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await press(S);
    const f = await fileOf(S, Y), sa = await scr(S, 'chosho_cust_addr');
    console.log('R4', brief({ sa, t: f.chosho_cust_tel, a: f.chosho_cust_addr, m: merged(S) }));
    okGenba(f, 'R4');
    ok(f.chosho_cust_tel === '090-1234-5678', '★R4 いま直した電話が入らない → ' + f.chosho_cust_tel);
    ok(sa === '現場の住所', '★R4 画面が前の中身のまま → ' + sa);
  });

  // ---- R5 現場が直した備考は採る ----
  await go('R5', async S => {
    await startRow(S, { chosho_note: '前の備考' });
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('R5', brief({ n: f.chosho_note, l: { n: l.note, s: l.noteSrc } }));
    ok(f.chosho_note === '現場の備考' && l.note === '現場の備考', '★R5 現場の備考を古い値で消した → ' + short({ n: f.chosho_note, l: l.note }));
  });

  // ---- R5b 台帳で直した備考は残す ----
  await go('R5b', async S => {
    await startRow(S, { chosho_note: '前の備考' });
    await S.page.evaluate(k => { lgSetNote(k, '台帳の備考'); }, 'm:' + Y);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { chosho_note: '前の備考' }));
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('R5b', brief({ n: f.chosho_note, l: { n: l.note, s: l.noteSrc } }));
    okGenba(f, 'R5b');
    ok(f.chosho_note === '台帳の備考' && l.note === '台帳の備考', '★R5b 台帳で直した備考が入らない → ' + short({ n: f.chosho_note, l: l.note }));
  });

  // ---- R5c 画面で打った備考は書く ----
  await go('R5c', async S => {
    await startRow(S, { chosho_note: '前の備考' });
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await typeField(S, 'chosho_note', '画面の備考');
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('R5c', brief({ n: f.chosho_note, l: { n: l.note } }));
    okGenba(f, 'R5c');
    ok(f.chosho_note === '画面の備考' && l.note === '画面の備考', '★R5c いま打った備考が入らない → ' + short({ n: f.chosho_note, l: l.note }));
  });

  // ---- R6 直した欄の分からない行は、書かずに知らせる ----
  await go('R6', async S => {
    await startRow(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r._lgEdited = true; lgEditedKeys(r, ['*']); }, Y);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await press(S);
    const f = await fileOf(S, Y), r = await rowOf2(S, Y), a = alerts(S);
    console.log('R6', brief({ a: f.chosho_cust_addr, ed: r.ed, said: a.slice(-1).map(m => m.slice(0, 160)) }));
    okGenba(f, 'R6');
    ok(a.some(m => /戸別ファイルは書き替えていません/.test(m) && /新しい中身/.test(m)), '★R6 書かなかったことを知らせない → ' + short(a));
    ok(!a.some(m => /上書き保存しました/.test(m)), '★R6 書かないのに保存したと言った → ' + short(a));
    ok(r.ed, '★R6 「まだ入っていない」印が下りた');
  });

  // ---- R7 📥 で入れてまだファイルに無い行は合わせない ----
  await go('R7', async S => {
    await startRow(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r._genbaUnsaved = true; }, Y);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_addr', '取り込んだ住所');
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R7', brief({ a: f.chosho_cust_addr, m: merged(S) }));
    ok(f.chosho_cust_addr === '取り込んだ住所' && !merged(S), '★R7 📥 の行を合わせた → ' + short({ a: f.chosho_cust_addr, m: merged(S) }));
  });

  // ---- R8 開いたあとで現場が足した写真は残る ----
  await go('R8', async S => {
    await start(S, [[X], [Y, ['g1'], amp], [Z]]);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, ['g1', 'g2'], genba);
    await press(S);
    const ids = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json');
    console.log('R8', brief({ ids, m: merged(S) }));
    ok(ids === 'g1,g2', '★R8 ファイルの写真が減った → ' + ids);
  });

  // ---- R8b 画面で足した写真：現場が足した写真と両方ファイルに入り、画面にも残り、続けて 💾 しても消えない ----
  const shown = S => S.page.evaluate(() => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','));
  await go('R8b', async S => {
    await start(S, [[X], [Y, ['g1'], amp], [Z]]);
    await openRow(S, Y);
    await S.page.evaluate(() => { STATE.photos = (STATE.photos || []).concat([__ph('p9', '#333')]); markEditorDirty(); });
    await putFile(S, 'L', Y + '.json', Y, ['g1', 'g2'], genba);
    await press(S);
    const ids = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json'), sh = await shown(S);
    await press(S);
    const ids2 = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json');
    console.log('R8b', brief({ ids, sh, ids2 }));
    ok(ids === 'g1,g2,p9', '★R8b ファイルの写真が足りない → ' + ids);
    ok(sh === 'g1,g2,p9', '★R8b 画面の写真が足りない → ' + sh);
    ok(ids2 === 'g1,g2,p9', '★R8b 続けて 💾 すると写真が消えた → ' + ids2);
  });

  // ---- R8c 画面で消した写真は戻らない ----
  await go('R8c', async S => {
    await start(S, [[X], [Y, ['g1', 'g3'], amp], [Z]]);
    await openRow(S, Y);
    await S.page.evaluate(() => { STATE.photos = (STATE.photos || []).filter(p => p && p.id !== 'g3'); markEditorDirty(); });
    await putFile(S, 'L', Y + '.json', Y, ['g1', 'g3'], genba);
    await press(S);
    const ids = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json'), sh = await shown(S);
    await press(S);
    const ids2 = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json');
    console.log('R8c', brief({ ids, sh, ids2 }));
    ok(ids === 'g1' && sh === 'g1' && ids2 === 'g1', '★R8c 画面で消した写真が戻った → ' + short({ ids, sh, ids2 }));
  });

  // ---- R9 書けなかったとき：画面の直しは残り、もう一度 💾 で入る ----
  await go('R9', async S => {
    await startRow(S);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await S.page.evaluate(() => { window.__wr = writeRowFile; writeRowFile = async () => { throw new Error('書けない'); }; });
    await press(S);
    const a1 = alerts(S);
    const st = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { stuck: !!r._indivMerged, tel: (document.getElementById('chosho_cust_tel') || {}).value }; }, Y);
    await S.page.evaluate(() => { writeRowFile = window.__wr; });
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R9', brief({ st, said: a1.slice(-1).map(m => m.slice(0, 80)), t: f.chosho_cust_tel, a: f.chosho_cust_addr }));
    ok(a1.some(m => /保存に失敗しました/.test(m)), 'R9 試験の前提: 書けなかった → ' + short(a1));
    ok(!st.stuck, '★R9 合わせている印が残った（行へ取り込めなくなる）');
    ok(st.tel === '090-1234-5678', '★R9 画面の直しが消えた → ' + st.tel);
    okGenba(f, 'R9');
    ok(f.chosho_cust_tel === '090-1234-5678', '★R9 もう一度 💾 しても電話が入らない → ' + f.chosho_cust_tel);
  });

  // ---- R10 物件を開いていないときも同じ ----
  await go('R10', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, [], amp], [Z]]);
    await pressFolder(S, 'L');
    await openRow(S, Y);
    const pre = await S.page.evaluate(() => ({ proj: !!_currentProject, org: !!(_loadedOrigin && _loadedOrigin.fileHandle) }));
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R10', brief({ pre, t: f.chosho_cust_tel, a: f.chosho_cust_addr }));
    ok(!pre.proj && pre.org, 'R10 試験の前提: 物件なしで、ファイルから開いた → ' + short(pre));
    okGenba(f, 'R10');
    ok(f.chosho_cust_tel === '090-1234-5678', '★R10 電話が入らない → ' + f.chosho_cust_tel);
  });

  // ---- R6b 物件を開いていないときに止めたら、物件に入ったとは言わない ----
  await go('R6b', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, [], amp], [Z]]);
    await pressFolder(S, 'L');
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r._lgEdited = true; lgEditedKeys(r, ['*']); }, Y);
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await press(S);
    const a = alerts(S);
    console.log('R6b', brief(a.slice(-1).map(m => m.slice(-70))));
    ok(a.some(m => /閉じると消えます/.test(m)) && !a.some(m => /物件に入っています/.test(m)), '★R6b 物件が無いのに物件に入っていると言った → ' + short(a));
  });

  // ---- R11 現場が書いたファイルでも、PCだけが持つ欄は画面の値を残す ----
  await go('R11', async S => {
    await startRow(S, { tax_mode: 'excl' });
    await openRow(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { tax_mode: 'incl' }));
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R11', brief({ tax: f.tax_mode, m: merged(S) }));
    okGenba(f, 'R11');
    ok(f.tax_mode === 'excl', '★R11 PCだけが持つ欄が現場のファイルの値になった → ' + f.tax_mode);
  });

  // ---- R12 書いているあいだに打った欄：消えない・次の 💾 で入る ----
  const slowClose = (S, no, ms) => S.page.evaluate(({ n, ms }) => { const d = window.__folders.L, r = _listRows.find(x => (x.file || '').indexOf(n) >= 0), h = r.fileHandle, cw = h.createWritable;
    h.createWritable = async () => { const w = await cw(), cl = w.close; w.close = async () => { await new Promise(q => setTimeout(q, ms)); await cl(); }; return w; }; }, { n: no + '.json', ms });
  await go('R12', async S => {
    await startRow(S);
    await S.page.evaluate(no => { _listRows.find(x => x.data.chosho_mgmt_no === no)._slim = true; }, Y);
    await openRow(S, Y);
    const h0 = await scr(S, 'high_work');
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { high_work: h0 }));
    await slowClose(S, Y, 2000);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await pressOnly(S);
    await sleep(700);
    const hw = h0 === 'yes' ? 'no' : 'yes';
    await typeField(S, 'high_work', hw);
    await saved(S);
    const sv = await scr(S, 'high_work'), sa = await scr(S, 'chosho_cust_addr');
    const ek = await S.page.evaluate(no => _listRows.find(x => x.data.chosho_mgmt_no === no)._edKeys || [], Y);
    console.log('R12', brief({ hw, sv, sa, ek, m: merged(S) }));
    ok(ek.join() === 'high_work', '★R12 書いた欄まで覚え直した（後の現場の直しを古い値で消す） → ' + short(ek));
    ok(merged(S), 'R12 試験の前提: 合わせて書いた');
    ok(sa === '現場の住所', '★R12 画面が前の中身のまま → ' + sa);
    ok(sv === hw, '★R12 書いているあいだに打った欄が消えた → ' + sv);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('R12 続き', brief({ h: f.high_work }));
    okGenba(f, 'R12 続き');
    ok(f.high_work === hw, '★R12 次の 💾 で打った欄が入らない → ' + f.high_work);
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v185_m_opensave_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
