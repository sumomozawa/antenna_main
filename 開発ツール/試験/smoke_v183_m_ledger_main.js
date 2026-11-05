/* 版183（メイン・組 m-ledger）
   受付台帳で入れた値が、物件を開き直したあとの 📁 で消える不具合。★は直ったあとの正しい動き。作りは smoke_v182_m_ghost2_main.js と同じ。
     F1  「完了」✔ を反映しないまま開き直す → 📁：窓なしで ✔ を読んだ行へ持ち越し、直していない欄はファイルの中身 → 💾 反映でファイルへ
     F1b 直した欄の分からない印は、今までどおり確かめの窓が出る
     F14b 画面で打っただけの備考  F4d 図面のある行の 💾 上書き保存  F8c 消した備考を読んだ行で開く  F12b ファイルが同じだった 💾 反映  F21b 読めなかった行の電話の持ち越し  F25・F25b 📥 の内容は 💾 反映で全部書く
     F2  💾 反映のあとは印が下りて、開き直しても窓が出ない・物件に印が残らない
     F3  台帳だけの ✔（ビラ・同意書・完了書・保留）が、2回開き直しても 📁 で外れない
     F4  💾 物件に保存（ファイルへ書けた）のあと台帳で直した時刻・備考が、📁 で前の値へ戻らない
     F4b 現場が消した備考：💾 で書いた値が控えに入っているので、📁 で台帳からも消える
     F5  現場がファイルを直した → 開き直す → 📁：現場の値を採る（残す動き）
     F6  現場がファイルの備考を消した → 開き直す → 📁：台帳からも消える（残す動き）
     F7  版182 までの控え（行の写しのことがある）：空のファイルで台帳の値を消さない・控えを直す
     F7b 版182 までの ✔ の控え：同じ
     F8  台帳で打っただけの備考を消す → 開き直す → 戻らない
     F9  台帳で打っただけの時刻・打合せが、開き直したあとの 📁 で消えない
     F10 同じ画面で：台帳の備考 → 📁（行へ配る）→ 戸別を開いて閉じる → 📁：消えない
     F11 台帳で作った行は印を物件に入れない（読み直しても残る行で窓を出し続けない）
     F4c 💾 上書き保存のあと台帳で直した時刻  F12 💾 物件に保存で印が下りて物件にも残らない  F14 開いて直しただけの時刻を空のファイルで消さない
     F15 開き直したまま 💾 反映：直した欄だけ書く  F16 版182 までの ✔  F17 開くだけで台帳の値が戻らない  F18 消して同じ値を入れ直す  F8b 消した備考が開いても戻らない  F19 書いた ✔ の控え  F20 記録の無い行  F21 読めなかったので残した行の ✔
     F16b 印の無い完了は持ち越さない  F22 番号を直した行は窓  F23 欄の分からない直しは窓  F24 行にだけある備考
   使い方: node smoke_v183_m_ledger_main.js [メイン index.html]　（ONLY=F1,F4b で場面を絞れる。完全一致） */
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

  // ---- F1 「完了」✔ を反映しないまま開き直す → 📁：窓なしで ✔ を読んだ行へ持ち越す（現場の新しい中身はそのまま）→ 💾 反映でファイルへ ----
  await go('F1', async S => {
    await start(S, [[X], [Y, [], { chosho_cust_addr: '前の住所' }], [Z]]);
    await doneTick(S, Y);
    await reopen(S);
    const st0 = await rowSt(S, Y);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '現場の住所' });
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowSt(S, Y), v = await look(S);
    const addr = await S.page.evaluate(no => _listRows.find(x => x.data.chosho_mgmt_no === no).data.chosho_cust_addr, Y);
    S.said.length = 0;
    await pressWriteback(S);
    await sleep(600);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    console.log('F1', brief({ st0, w, st, addr, fs: f.chosho_status, fa: f.chosho_cust_addr, status: v.status }));
    ok(st0 && st0.s === 'completed' && st0.ed, '★F1 開き直すと「まだ戸別ファイルに入っていない」印が消えた → ' + short(st0));
    ok(st && st.s === 'completed' && st.ed && !st.fp, '★F1 📁 で完了が外れた／読んだ行にならない → ' + short(st));
    ok(addr === '現場の住所', '★F1 直していない欄が物件の古い値のまま → ' + addr);
    ok(/持ち越しました/.test(v.status), '★F1 持ち越した知らせが無い → ' + v.status);
    ok(f.chosho_status === 'completed' && f.chosho_cust_addr === '現場の住所', '★F1 💾 反映でファイルに入らない／現場の値を消した → ' + short({ s: f.chosho_status, a: f.chosho_cust_addr }));
  });

  // ---- F1b 直した欄の分からない印（_lgEdited だけ）は、今までどおり確かめの窓が出る ----
  await go('F1b', async S => {
    await start(S);
    await doneTick(S, Y);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); delete r._lgKeys; }, Y);
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    console.log('F1b', brief({ w, asked: askedDiscard(S).length }));
    ok(askedDiscard(S).length === 1, '★F1b 確かめの窓が出ない');
  });

  // ---- F2 💾 反映のあとは印が下りて、開き直しても窓が出ない ----
  await go('F2', async S => {
    await start(S);
    await doneTick(S, Y);
    await pressWriteback(S);
    await sleep(600);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await reopen(S);
    const st = await rowSt(S, Y);
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st2 = await rowSt(S, Y);
    console.log('F2', brief({ fs: f.chosho_status, st, w, st2, asked: askedDiscard(S).length }));
    ok(f.chosho_status === 'completed', 'F2 試験の前提: 反映でファイルが完了になった → ' + f.chosho_status);
    ok(st && !st.ed, '★F2 反映のあと開き直しても「まだ入っていない」印が残った → ' + short(st));
    ok(!askedDiscard(S).length, '★F2 反映したのに 📁 で確かめの窓が出た');
    ok(st2 && st2.s === 'completed', '★F2 完了が外れた → ' + short(st2));
  });

  // ---- F3 台帳だけの ✔（ビラ・同意書・完了書・保留）が、2回開き直しても 📁 で外れない ----
  await go('F3', async S => {
    const fl = { flyer_done: false, consent_received: false, compdoc_received: false, hold_flag: false };
    await start(S, [[X, [], fl], [Y, [], fl], [Z, [], fl]]);
    for(const f of ['flyer', 'consent', 'compdoc', 'hold']) await ticked(S, Y, f, true);
    await reopen(S);
    await S.page.evaluate(() => { projTouch(); });        // 行へ配った ✔ が物件に入る
    await sleep(400);
    await reopen(S);
    const l0 = await led(S, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F3', brief({ l0, w, l }));
    ok(!l0.flyerSrc && !l0.consentSrc && !l0.compdocSrc && !l0.holdSrc, '★F3 開き直しただけで、ファイルに無い ✔ が控えに入った → ' + short(l0));
    ok(l.flyer && l.consent && l.compdoc && l.hold, '★F3 台帳だけの ✔ が 📁 で外れた → ' + short(l));
    ok(!l.flyerSrc && !l.compdocSrc, '★F3 ファイルに無い ✔ が控えに入った → ' + short(l));
  });

  // ---- F4 💾 物件に保存（ファイルへ書けた）のあと台帳で直した時刻・備考が、📁 で前の値へ戻らない ----
  const saveAt = (S, no, time, note) => S.page.evaluate(async ({ no, time, note }) => {
    const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
    await openCaseInEditor(r, false);
    const t = document.getElementById('chosho_time'); if(t) t.value = time;
    const n = document.getElementById('chosho_note'); if(n) n.value = note;
    await overwriteSaveCurrent();
  }, { no, time, note });
  await go('F4', async S => {
    const ex = { chosho_time: '', chosho_meet_at: '' };
    await start(S, [[X, [], ex], [Y, [], ex], [Z, [], ex]]);
    await reopen(S);
    await saveAt(S, Y, '10:00', '書いた備考');
    await sleep(600);
    await toLedger(S);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await S.page.evaluate(k => { setLedger(k, { time: '13:00', note: '台帳で直した備考' }); }, 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F4', brief({ ft: f.chosho_time, fn: f.chosho_note, w, l }));
    ok(f.chosho_time === '10:00' && f.chosho_note === '書いた備考', 'F4 試験の前提: 💾 でファイルに入った → ' + short({ t: f.chosho_time, n: f.chosho_note }));
    ok(l.time === '13:00', '★F4 台帳で直した時刻が、ファイルの前の値へ戻った → ' + short(l));
    ok(l.note === '台帳で直した備考', '★F4 台帳で直した備考が、ファイルの前の値へ戻った → ' + short(l));
  });

  // ---- F4b 💾 で書いた備考を現場が消した → 📁：台帳からも消える ----
  await go('F4b', async S => {
    const ex = { chosho_time: '', chosho_meet_at: '' };
    await start(S, [[X, [], ex], [Y, [], ex], [Z, [], ex]]);
    await reopen(S);
    await saveAt(S, Y, '', '書いた備考');
    await sleep(600);
    await toLedger(S);
    await putFile(S, 'L', Y + '.json', Y, [], ex);        // 現場が消した
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F4b', brief({ w, l }));
    ok(!l.note, '★F4b 現場が消した備考が、台帳に残った → ' + short(l));
  });

  // ---- F5 現場がファイルを直した → 開き直す → 📁：現場の値を採る ----
  await go('F5', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_note: '現場の備考' });
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F5', brief({ w, l }));
    ok(l.note === '現場の備考' && l.noteSrc === '現場の備考', '★F5 現場の直しを採らない → ' + short(l));
  });

  // ---- F6 現場がファイルの備考を消した → 開き直す → 📁：台帳からも消える ----
  await go('F6', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], {});
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F6', brief({ w, l }));
    ok(!l.note, '★F6 現場が消した備考が台帳に残った → ' + short(l));
  });

  // ---- F7 版182 までの控え（行の写しのことがある）：空のファイルで台帳の値を消さない ----
  await go('F7', async S => {
    await start(S);
    await S.page.evaluate(k => { _ledgerMap[k] = Object.assign({}, _ledgerMap[k] || {}, { note: '台帳の備考', noteSrc: '台帳の備考' }); delete _ledgerMap[k].srcOk; saveLedgerMap(); }, 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F7', brief({ w, l }));
    ok(l.note === '台帳の備考', '★F7 版182 までの控えで、台帳の備考が空のファイルに消された → ' + short(l));
    ok(!l.noteSrc && l.srcOk, '★F7 控えが直っていない → ' + short(l));
  });

  // ---- F7b 版182 までの ✔ の控え：同じ ----
  await go('F7b', async S => {
    const fl = { flyer_done: false };
    await start(S, [[X, [], fl], [Y, [], fl], [Z, [], fl]]);
    await S.page.evaluate(k => { _ledgerMap[k] = Object.assign({}, _ledgerMap[k] || {}, { flyer: true, flyerSrc: true }); delete _ledgerMap[k].srcOk; saveLedgerMap(); }, 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F7b', brief({ w, l }));
    ok(l.flyer && !l.flyerSrc, '★F7b 版182 までの控えで、台帳の ✔ が外れた → ' + short(l));
  });

  // ---- F8 台帳で打っただけの備考を消す → 開き直す → 戻らない ----
  await go('F8', async S => {
    await start(S);
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await reopen(S);
    await S.page.evaluate(k => { lgSetNote(k, ''); }, 'm:' + Y);
    await reopen(S);
    const l = await led(S, Y), r = await ledgerRow(S, Y);
    console.log('F8', brief({ l, r }));
    ok(r && !r.note, '★F8 台帳で消した備考が、開き直すと戻った → ' + short({ l, r }));
  });

  // ---- F9 台帳で打っただけの時刻・打合せが、開き直したあとの 📁 で消えない ----
  await go('F9', async S => {
    const ex = { chosho_time: '', chosho_meet_at: '' };
    await start(S, [[X, [], ex], [Y, [], ex], [Z, [], ex]]);
    await S.page.evaluate(k => { setLedger(k, { time: '09:30', meetAt: '2026-11-10 10:00' }); }, 'm:' + Y);
    await reopen(S);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F9', brief({ w, l }));
    ok(l.time === '09:30' && l.meetAt === '2026-11-10 10:00', '★F9 台帳で打っただけの時刻・打合せが 📁 で消えた → ' + short(l));
  });

  // ---- F10 同じ画面で：台帳の備考 → 📁（行へ配る）→ 戸別を開いて閉じる → 📁：消えない ----
  await go('F10', async S => {
    await start(S);
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await pressFolder(S, 'L');
    await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      noteResolveRow(r);                                   // 戸別を開いたときの突き合わせ（noteSyncToEditor）
    }, Y);
    const l0 = await led(S, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F10', brief({ l0, w, l }));
    ok(!l0.noteSrc, '★F10 台帳から配った値を控えに書いた → ' + short(l0));
    ok(l.note === NOTE, '★F10 開いて閉じただけで、台帳の備考が 📁 で消えた → ' + short(l));
  });

  // ---- F11 台帳で作った行は印を物件に入れない ----
  await go('F11', async S => {
    await start(S);
    await S.page.evaluate(() => {
      const r = createManualRow({ chosho_mgmt_no: '2622MAN001', chosho_cust_name: '手入力 様' });
      if(r){ r._lgEdited = true; }
      projTouch();
    });
    await reopen(S);
    S.said.length = 0;
    const st = await rowSt(S, '2622MAN001');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const leak = await S.page.evaluate(async () => { const p = await projIdbGet(_currentProject.id); const c = (p.cases || []).find(x => x.payload && x.payload.chosho_mgmt_no === '2622MAN001'); return !!(c && c.payload._lgEdited); });
    console.log('F11', brief({ st, w, leak, asked: askedDiscard(S).length }));
    ok(st && !st.ed && !leak, '★F11 台帳で作った行の印が物件に入った → ' + short({ st, leak }));
    ok(!askedDiscard(S).length, '★F11 台帳で作った行のせいで確かめの窓が出た');
  });

  // ---- F4c 💾 上書き保存（ファイルの行）のあと台帳で直した時刻が、📁 で前の値へ戻らない ----
  await go('F4c', async S => {
    const ex = { chosho_time: '', chosho_meet_at: '' };
    await start(S, [[X, [], ex], [Y, [], ex], [Z, [], ex]]);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); if(!r.fileHandle) throw new Error('ファイルが付いていない'); }, Y);
    await saveAt(S, Y, '10:00', '');
    await sleep(600);
    await toLedger(S);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await S.page.evaluate(k => { setLedger(k, { time: '13:00' }); }, 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F4c', brief({ ft: f.chosho_time, w, l }));
    ok(f.chosho_time === '10:00', 'F4c 試験の前提: 💾 でファイルに入った → ' + f.chosho_time);
    ok(l.time === '13:00', '★F4c 台帳で直した時刻が、ファイルの前の値へ戻った → ' + short(l));
  });

  // ---- F12 開き直した行を 💾 物件に保存（ファイルへ書けた）→ 印が下りて物件にも残らない ----
  await go('F12', async S => {
    await start(S);
    await doneTick(S, Y);
    await reopen(S);
    await saveAt(S, Y, '', '');
    await sleep(2400);                                    // 画面を閉じないまま、物件の自動保存を待つ
    const stored = await S.page.evaluate(async no => {
      const p = await projIdbGet(_currentProject.id), x = (p.cases || []).find(q => q.payload && q.payload.chosho_mgmt_no === no);
      return !!(x && x.payload._lgEdited);
    }, Y);
    await toLedger(S);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await reopen(S);
    const st = await rowSt(S, Y);
    console.log('F12', brief({ fs: f.chosho_status, stored, st }));
    ok(!stored, '★F12 印を下ろしたことが物件に入らない（このまま閉じると開き直したとき印が戻る）');
    ok(f.chosho_status === 'completed', 'F12 試験の前提: 💾 でファイルが完了になった → ' + f.chosho_status);
    ok(st && !st.ed, '★F12 ファイルへ書けたのに、開き直すと「まだ入っていない」印が戻った → ' + short(st));
  });

  // ---- F14 開いて時刻を直しただけ（ファイルへ書いていない）→ 📁：空のファイルで台帳の時刻を消さない ----
  await go('F14', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考', chosho_time: '', chosho_meet_at: '' }], [Z]]);
    await reopen(S);
    await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      const t = document.getElementById('chosho_time'); if(t) t.value = '10:00';
      syncEditorToRowData(true);
    }, Y);
    await sleep(300);
    await toLedger(S);
    const l0 = await led(S, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F14', brief({ l0, w, l }));
    ok(l0.time === '10:00', 'F14 試験の前提: 画面の時刻が台帳に入った → ' + short(l0));
    ok(l.time === '10:00', '★F14 ファイルへ書いていない時刻が、空のファイルで消えた → ' + short(l));
  });

  // ---- F14b 開いて備考を打っただけ（ファイルへ書いていない）→ 控えに入れない・📁 で空のファイルに消されない ----
  await go('F14b', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '', chosho_time: '', chosho_meet_at: '' }], [Z]]);
    await reopen(S);
    await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      const n = document.getElementById('chosho_note'); if(n) n.value = '画面で打った備考';
      syncEditorToRowData(true);
    }, Y);
    await sleep(300);
    await toLedger(S);
    const l0 = await led(S, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F14b', brief({ l0, w, l }));
    ok(l0.note === '画面で打った備考', 'F14b 試験の前提: 画面の備考が台帳に入った → ' + short(l0));
    ok(!l0.noteSrc, '★F14b 画面で打っただけの備考が控えに入った → ' + short(l0));
    ok(l.note === '画面で打った備考', '★F14b ファイルへ書いていない備考が、空のファイルで消えた → ' + short(l));
  });

  // ---- F15 開き直したまま 💾 反映：直した欄だけ書く（現場が入れた ✔・備考を物件の古い値で消さない）----
  await go('F15', async S => {
    const fl = { compdoc_received: false, consent_received: false };
    await start(S, [[X, [], fl], [Y, [], fl], [Z, [], fl]]);
    await doneTick(S, Y);
    await reopen(S);
    await putFile(S, 'L', X + '.json', X, [], { compdoc_received: true, consent_received: true, chosho_note: '現場の備考', chosho_status: 'completed' });
    S.said.length = 0;
    await pressWriteback(S);
    await sleep(600);
    const fx = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], X + '.json'));
    const fy = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    console.log('F15', brief({ x: { c: fx.compdoc_received, n: fx.chosho_note, s: fx.chosho_status }, ys: fy.chosho_status }));
    ok(fx.compdoc_received === true && fx.consent_received === true && fx.chosho_note === '現場の備考' && fx.chosho_status === 'completed', '★F15 💾 反映が、現場の新しい内容を物件の古い値で消した → ' + short({ c: fx.compdoc_received, n: fx.chosho_note, s: fx.chosho_status }));
    ok(fy.chosho_status === 'completed', '★F15 台帳で直した欄がファイルに入らない → ' + fy.chosho_status);
  });

  // ---- F16 版182 までに付けた ✔（印が無い）：その物件を開くと状態を直した欄と見て、📁 で読んだ行へ持ち越す ----
  const reopenOld = async S => {
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []);
    await S.page.evaluate(f => {
      const d = window.__folders.D, j = JSON.parse(d.__files[f]);
      if(j.lastSavedBy) j.lastSavedBy.app = '182';
      (j.cases || []).forEach(c => { if(c.payload){ delete c.payload._lgEdited; delete c.payload._lgKeys; } });
      d.__files[f] = JSON.stringify(j);
    }, SHARED);
    await openShared(S, 'D', SHARED); await toLedger(S);
  };
  await go('F16', async S => {
    await start(S);
    await doneTick(S, Y);
    await reopenOld(S);
    const st0 = await rowSt(S, Y);
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowSt(S, Y);
    console.log('F16', brief({ st0, w, st, asked: askedDiscard(S).length }));
    ok(st && st.s === 'completed' && st.ed, '★F16 版182 までの物件の完了が 📁 で外れた → ' + short(st));
    ok(!askedDiscard(S).length, '★F16 確かめの窓が出た');
  });

  // ---- F16b 版183 の物件で印の無い完了は持ち越さない（現場が工事完了を取り消したとき）----
  await go('F16b', async S => {
    await start(S);
    await doneTick(S, Y);
    await pressWriteback(S);
    await sleep(600);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_status: 'in_progress' });   // 現場が取り消した
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowSt(S, Y);
    console.log('F16b', brief({ w, st }));
    ok(st && st.s === 'in_progress' && !st.ed, '★F16b 現場が取り消した完了を、印の無い行で戻した → ' + short(st));
  });

  // ---- F17 戸別で直して 💾 を押さず、台帳で別の値に直す → 開く：台帳の値が前の値へ戻らない ----
  await go('F17', async S => {
    await start(S);
    const o = await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no), k = 'm:' + no;
      r.data.chosho_note = '戸別で直した備考';
      setLedger(k, { note: '台帳で直した備考' });
      noteResolveRow(r);                                   // 開いたときの突き合わせ（noteSyncToEditor）
      return { l: _ledgerMap[k].note, src: _ledgerMap[k].noteSrc };
    }, Y);
    console.log('F17', brief(o));
    ok(o.l === '台帳で直した備考' && !o.src, '★F17 開いただけで台帳の値が戻った／控えにファイルに無い値が入った → ' + short(o));
  });

  // ---- F18 台帳だけの値を消して同じ値を入れ直す → 📁：消えない ----
  await go('F18', async S => {
    await start(S);
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await pressFolder(S, 'L');
    await S.page.evaluate(({ k, n }) => { lgSetNote(k, ''); lgSetNote(k, n); }, { k: 'm:' + Y, n: NOTE });
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F18', brief({ w, l }));
    ok(l.note === NOTE, '★F18 入れ直した備考が 📁 で消えた → ' + short(l));
  });

  // ---- F8b 台帳で消した備考：開き直したあと戸別を開いても戻らない ----
  await go('F8b', async S => {
    await start(S, [[X], [Y, [], { chosho_note: 'ファイルの備考' }], [Z]]);
    await S.page.evaluate(k => { lgSetNote(k, ''); }, 'm:' + Y);
    await reopen(S);
    const o = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      noteSyncToEditor(r);
      const el = document.getElementById('chosho_note');
      return { el: el ? el.value : null, l: (_ledgerMap['m:' + no] || {}).note || '', row: r.data.chosho_note || '' };
    }, Y);
    console.log('F8b', brief(o));
    ok(!o.l && !o.el && !o.row, '★F8b 台帳で消した備考が、開くと戻った → ' + short(o));
  });

  // ---- F19 書いた ✔ の控え：💾 で書いた ✔ を台帳で外す → 📁：現場が押したと見ない ----
  await go('F19', async S => {
    const fl = { compdoc_received: false };
    await start(S, [[X, [], fl], [Y, [], fl], [Z, [], fl]]);
    await ticked(S, Y, 'compdoc', true);
    await reopen(S);
    await saveAt(S, Y, '', '');
    await sleep(600);
    await toLedger(S);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await ticked(S, Y, 'compdoc', false);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F19', brief({ fc: f.compdoc_received, w, l }));
    ok(f.compdoc_received === true, 'F19 試験の前提: 💾 でファイルに ✔ が入った → ' + f.compdoc_received);
    ok(!l.compdoc, '★F19 台帳で外した ✔ が「現場が押した」と見られて戻った → ' + short(l));
  });

  // ---- F20 台帳に記録の無い行：備考・時刻・打合せ・✔ を全部採る ----
  await go('F20', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '行の備考', chosho_time: '09:00', chosho_meet_at: '打合せ', flyer_done: true }], [Z]]);
    await reopen(S);
    const l = await S.page.evaluate(k => { delete _ledgerMap[k]; noteResolveRows(_listRows); return Object.assign({}, _ledgerMap[k] || {}); }, 'm:' + Y);
    console.log('F20', brief(l));
    ok(l.note === '行の備考' && l.time === '09:00' && l.meetAt === '打合せ' && l.flyer, '★F20 記録の無い行の欄が台帳に入らない → ' + short(l));
  });


  // ---- F21 読めなかったので残した行の ✔：読めるようになった 📁 でも持ち越す ----
  await go('F21', async S => {
    await start(S);
    await reopen(S);
    await doneTick(S, Y);
    await S.page.evaluate(n => { window.__folders.L.__stash = window.__folders.L.__files[n]; window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-later');
    const st0 = await rowSt(S, Y);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = window.__folders.L.__stash; }, Y + '.json');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowSt(S, Y);
    console.log('F21', brief({ w0, st0, w, st }));
    ok(st0 && st0.s === 'completed', 'F21 試験の前提: 読めない行が残った → ' + short(st0));
    ok(st && st.s === 'completed' && st.ed, '★F21 読めるようになった 📁 で ✔ が外れた → ' + short(st));
  });

  // ---- F4d 図面のある行（💾 上書き保存の道）のあと台帳で直した時刻が、📁 で前の値へ戻らない ----
  await go('F4d', async S => {
    const ex = { chosho_time: '', chosho_meet_at: '' };
    await start(S, [[X, [], ex], [Y, [], ex], [Z, [], ex]]);
    const pre = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      _loadedOrigin = { file: r.file, fileHandle: r.fileHandle, fileType: 'plain' };   // 図面のある行を開いたとき
      const t = document.getElementById('chosho_time'); if(t) t.value = '10:00';
      await overwriteSaveCurrent();
      return !!r.fileHandle;
    }, Y);
    await sleep(600);
    await toLedger(S);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    await S.page.evaluate(k => { setLedger(k, { time: '13:00' }); }, 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const l = await led(S, Y);
    console.log('F4d', brief({ pre, ft: f.chosho_time, w, l }));
    ok(pre, 'F4d 試験の前提: ファイルが付いている');
    ok(f.chosho_time === '10:00', 'F4d 試験の前提: 💾 でファイルに入った → ' + f.chosho_time);
    ok(l.time === '13:00', '★F4d 台帳で直した時刻が、ファイルの前の値へ戻った → ' + short(l));
  });

  // ---- F8c 台帳で消した備考：読んだファイルの行を開いても、画面に出さず台帳へ戻さない ----
  await go('F8c', async S => {
    await start(S, [[X], [Y, [], { chosho_note: 'ファイルの備考' }], [Z]]);
    await S.page.evaluate(k => { lgSetNote(k, ''); }, 'm:' + Y);
    const o = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      const el = document.getElementById('chosho_note');
      el.value = 'ファイルの備考';                         // 図面のある行は、開くとファイルの中身が画面に出る
      noteSyncToEditor(r);
      return { el: el ? el.value : null, l: (_ledgerMap['m:' + no] || {}).note || '', row: r.data.chosho_note || '' };
    }, Y);
    console.log('F8c', brief(o));
    ok(!o.l && !o.el && !o.row, '★F8c 台帳で消した備考が、開くと戻った → ' + short(o));
  });

  // ---- F12b 開き直した行の 💾 反映で、ファイルがもう同じだった → 印が下りて物件にも残らない ----
  await go('F12b', async S => {
    await start(S);
    await doneTick(S, Y);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_status: 'completed' });   // 現場も完了にした
    await sleep(2400);                                    // 開いた直後の自動保存が終わるのを待つ
    const was = await S.page.evaluate(async no => {
      const p = await projIdbGet(_currentProject.id), x = (p.cases || []).find(q => q.payload && q.payload.chosho_mgmt_no === no);
      return !!(x && x.payload._lgEdited);
    }, Y);
    ok(was, 'F12b 試験の前提: 物件に印が入っている');
    S.said.length = 0;
    await S.page.click('#lg-writeback');                  // 書くものが無いので一覧は読み直さない
    await sleep(2400);
    const o = await S.page.evaluate(async no => {
      const p = await projIdbGet(_currentProject.id), x = (p.cases || []).find(q => q.payload && q.payload.chosho_mgmt_no === no);
      return { stored: !!(x && x.payload._lgEdited), row: !!_listRows.find(q => q.data.chosho_mgmt_no === no)._lgEdited };
    }, Y);
    console.log('F12b', brief(o));
    ok(!o.row, 'F12b 試験の前提: 行の印が下りた → ' + short(o));
    ok(!o.stored, '★F12b 印を下ろしたことが物件に入らない → ' + short(o));
  });

  // ---- F12c 💾 上書き保存（図面のある行）で書けた → 画面を閉じなくても、下ろした印が物件へ入る ----
  await go('F12c', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', work_type: 'uhf_new' }], [Z]]);
    await doneTick(S, Y);
    await sleep(2400);
    const stored = () => S.page.evaluate(async no => {
      const p = await projIdbGet(_currentProject.id), x = (p.cases || []).find(q => q.payload && q.payload.chosho_mgmt_no === no);
      return !!(x && x.payload._lgEdited);
    }, Y);
    const was = await stored();
    const origin = await S.page.evaluate(async no => {
      await openCaseInEditor(_listRows.find(x => x.data.chosho_mgmt_no === no), false);
      return !!(_loadedOrigin && _loadedOrigin.fileHandle);
    }, Y);
    await sleep(2400);                                    // 開いた直後の自動保存が終わるのを待つ
    await S.page.evaluate(async () => { await overwriteSaveCurrent(); });
    await sleep(2400);
    const now = await stored();
    const ed = (await rowSt(S, Y)).ed;
    console.log('F12c', brief({ origin, was, ed, now }));
    ok(origin && was && !ed, 'F12c 試験の前提: ファイルから開いていて、物件に印が入っていて、💾 で行の印が下りた → ' + short({ origin, was, ed }));
    ok(!now, '★F12c 印を下ろしたことが物件に入らない（このまま閉じると、開き直したとき印が戻る）');
  });

  // ---- F21b 読めなかったので残した行で直した電話：読めるようになった 📁 で読んだ行へ持ち越す ----
  await go('F21b', async S => {
    await start(S);
    await reopen(S);
    await S.page.evaluate(no => { lgWriteCaseField(_listRows.find(x => x.data.chosho_mgmt_no === no), 'tel', '090-2222-3333'); }, Y);
    await S.page.evaluate(n => { window.__folders.L.__stash = window.__folders.L.__files[n]; window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-later');
    await S.page.evaluate(n => { window.__folders.L.__files[n] = window.__folders.L.__stash; }, Y + '.json');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const o = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { tel: r.data.chosho_cust_tel, ed: !!r._lgEdited, fp: !!r._fromProject }; }, Y);
    console.log('F21b', brief({ w0, w, o }));
    ok(o.tel === '090-2222-3333' && o.ed && !o.fp, '★F21b 読めるようになった 📁 で、直した電話が消えた → ' + short(o));
  });

  // ---- F25 📥 で入れてまだファイルに無い行は、開き直しても 💾 反映で全部の欄を書く ----
  await go('F25', async S => {
    await start(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_cust_addr: '現場の住所' }); r._genbaUnsaved = true; projTouch(); }, Y);
    await reopen(S);
    S.said.length = 0;
    await pressWriteback(S);
    await sleep(600);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    console.log('F25', brief({ a: f.chosho_cust_addr }));
    ok(f.chosho_cust_addr === '現場の住所', '★F25 📥 で入れた内容が 💾 反映でファイルに入らない → ' + f.chosho_cust_addr);
  });

  // ---- F25b 📥 で変わった欄（_rowNewer）も、開き直した行の 💾 反映で書く ----
  await go('F25b', async S => {
    await start(S);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_cust_addr: '現場の住所' }); r._rowNewer = ['chosho_cust_addr']; }, Y);
    S.said.length = 0;
    await pressWriteback(S);
    await sleep(600);
    const f = JSON.parse(await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json'));
    console.log('F25b', brief({ a: f.chosho_cust_addr }));
    ok(f.chosho_cust_addr === '現場の住所', '★F25b 📥 で変わった欄が 💾 反映でファイルに入らない → ' + f.chosho_cust_addr);
  });

  // ---- F22 管理番号を直した行は持ち越せないので、確かめの窓が出る ----
  await go('F22', async S => {
    await start(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); lgWriteCaseField(r, 'mgmt', '2622MAB099', { quiet: true }); }, Y);
    await reopen(S);
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    console.log('F22', brief({ w, asked: askedDiscard(S).length }));
    ok(askedDiscard(S).length === 1, '★F22 番号を直した行で確かめの窓が出ない');
  });

  // ---- F23 欄の分かる直しと分からない直しが同じ行にあるとき、確かめの窓が出る ----
  await go('F23', async S => {
    await start(S);
    await doneTick(S, Y);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); lgEditedKeys(r, ['*']); projTouch(); }, Y);
    await reopen(S);
    S.said.length = 0;
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    console.log('F23', brief({ w, asked: askedDiscard(S).length }));
    ok(askedDiscard(S).length === 1, '★F23 直した欄の分からない直しがあるのに確かめの窓が出ない');
  });

  // ---- F24 行にだけある備考（台帳に入っていない）は、開いても消さず台帳へ入れる ----
  await go('F24', async S => {
    await start(S);
    await ticked(S, Y, 'flyer', true);
    await reopen(S);
    const o = await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no), k = 'm:' + no;
      r.data.chosho_note = '行だけの備考';
      noteResolveRow(r);
      return { l: (_ledgerMap[k] || {}).note, row: r.data.chosho_note };
    }, Y);
    console.log('F24', brief(o));
    ok(o.l === '行だけの備考' && o.row === '行だけの備考', '★F24 行にだけある備考が消えた → ' + short(o));
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v183_m_ledger_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
