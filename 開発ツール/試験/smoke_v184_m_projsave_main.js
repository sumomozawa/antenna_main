/* 版184（メイン・組 m-projsave）
   物件を開き直しただけの行（ファイルを読んでいない行）を戸別で開いて「💾 物件に保存」すると、現場がファイルへ入れた新しい内容を
   物件の古い値で消していた（写真だけは残っていた）。★は直ったあとの正しい動き。作りは smoke_v183_m_ledger_main.js と同じ。
     P1  図面の無い行：何も直さず 💾 → ファイルの中身はそのまま・行と物件と台帳もその中身になる
     P2  図面の有る行：電話を直して 💾 → 電話だけ入り、ほかは現場の中身。画面も開き直して新しい中身が出る・続けて 💾 しても戻らない
     P3  ファイルのほうが古い（一覧へ戻っただけの直しがある）→ 今までどおり全部の欄を書く  P3b 同じ日時も同じ
     P4  台帳で直した備考は残す  P4b 現場が直した備考は採る  P4c 台帳だけの ✔ は書く  P4d 画面で打った備考は書く
     P5  台帳の「完了」✔（直した欄の分かる行）は持ち越して書く  P6 直した欄の分からない行は書かずに知らせる
     P7  📥 で入れてまだファイルに無い行は合わせない  P8 続けて保存：いま書いたファイルを「新しい」と見ない
     P9  写真：ファイルにしか無い写真は残る・行に元の写真を持たせない  P10 日時の無いファイルは見分けられない（今までどおり）
     P11 画面で空にした欄は空で書く  P12 利用者が触っていなければ、画面の差を直した欄に数えない  P13 📥 で変わった欄（_rowNewer）は行の値で書く
     P14 ファイルの中の管理番号が違っても、行の番号で書く  P15 管理番号を付け替えるときも合わせる  P15b 付け替えるときは止めない（空のファイルを残さない）
     P19 合わせた中身が物件へ入る  P16 見比べの知らせ：残した欄の名前が出る  P18 自動保存のあとで 💾：触った欄を覚えている
     P20・P20b 図面の無い行で工事の欄を直す  P21・P21b・P21c・P21d 一覧へ戻っただけの直し  P22 台帳で作った行  P23 付け替え先の別のファイル  P24・P24b 自分で書いたファイル
     P26・P26b・P26c PCだけが持つ欄  P27・P27b 融合で替わる行・開けなかったとき  P28・P28b 保存のあいだの入力と自動保存  P29 預けの印
     P30 行の知らない預けがあるファイル
     P2c 一覧から直に開いた行  P4e 現場も画面も備考を直した → 画面の値  P4f 図面の無い行で電話を直す → 現場の備考は採る  P9b 行にだけある写真も入る
   使い方: node smoke_v184_m_projsave_main.js [メイン index.html]　（ONLY=P1,P4b で場面を絞れる。完全一致） */
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
  const press = async S => { S.said.length = 0; await S.page.evaluate(async () => { await overwriteSaveCurrent(); }); await sleep(500); };
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

  // ---- P1 図面の無い行を開いて何も直さず 💾 ----
  await go('P1', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), r = await rowOf2(S, Y), l = await led(S, Y), a = alerts(S);
    console.log('P1', brief({ f: { a: f.chosho_cust_addr, s: f.chosho_status, n: f.chosho_note, o: f._origin }, r, l: { n: l.note, fl: l.flyer }, a: a.slice(-1).map(m => m.slice(0, 300)) }));
    okGenba(f, 'P1');
    ok(f.chosho_note === '現場の備考', '★P1 現場の備考を消した → ' + f.chosho_note);
    ok(f._origin === 'main', 'P1 書いたのはメイン → ' + f._origin);
    ok(merged(S), '★P1 合わせて書いた知らせが無い → ' + short(a));
    ok(r.addr === '現場の住所' && r.st === 'completed' && r.amp === 'amp_3u43', '★P1 行が新しい中身にならない → ' + short(r));
    ok(l.note === '現場の備考' && l.flyer, '★P1 台帳が現場の値にならない → ' + short(l));
    await sleep(1600);
    await reopen(S);
    const r2 = await rowOf2(S, Y);
    ok(r2.addr === '現場の住所' && r2.st === 'completed', '★P1 物件に新しい中身が入らない → ' + short(r2));
  });

  // ---- P2 図面の有る行：電話を直して 💾 ----
  await go('P2', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_old', chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await press(S);
    const f = await fileOf(S, Y), sa = await scr(S, 'chosho_cust_addr'), st = await scr(S, 'chosho_status');
    console.log('P2', brief({ f: { t: f.chosho_cust_tel, a: f.chosho_cust_addr, s: f.chosho_status, n: f.chosho_note }, sa, st }));
    okGenba(f, 'P2');
    ok(f.chosho_cust_tel === '090-1234-5678', '★P2 いま直した電話が入らない → ' + f.chosho_cust_tel);
    ok(f.chosho_note === '現場の備考', '★P2 現場の備考を消した → ' + f.chosho_note);
    ok(sa === '現場の住所' && st === 'completed', '★P2 画面が前の中身のまま → ' + short({ sa, st }));
    // 続けて別の欄を直して 💾：前の値へ戻らない
    await typeField(S, 'chosho_cust_tel', '090-9999-0000');
    await press(S);
    const f2 = await fileOf(S, Y);
    console.log('P2 続き', brief({ t: f2.chosho_cust_tel, a: f2.chosho_cust_addr, s: f2.chosho_status, m: merged(S) }));
    okGenba(f2, 'P2 続き');
    ok(f2.chosho_cust_tel === '090-9999-0000', '★P2 続きの電話が入らない → ' + f2.chosho_cust_tel);
  });

  // ---- P3 ファイルのほうが古い（一覧へ戻っただけの直しがある）→ 全部の欄を書く ----
  await go('P3', async S => {
    await start(S, [[X], [Y, [], { editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_addr', '物件で直した住所');
    await S.page.evaluate(() => { syncEditorToRowData(); projTouch(); });     // 一覧へ戻った（💾 は押していない）
    await sleep(300);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P3', brief({ a: f.chosho_cust_addr, m: merged(S) }));
    ok(f.chosho_cust_addr === '物件で直した住所', '★P3 物件にある直しがファイルに入らない → ' + f.chosho_cust_addr);
    ok(!merged(S), '★P3 ファイルが古いのに合わせて書いた');
  });

  // ---- P3b 同じ日時：全部の欄を書く ----
  await go('P3b', async S => {
    await start(S, [[X], [Y, [], { editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1111-2222');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P3b', brief({ t: f.chosho_cust_tel, m: merged(S) }));
    ok(f.chosho_cust_tel === '090-1111-2222', '★P3b 直した電話が入らない');
    ok(!merged(S), '★P3b 同じ日時なのに合わせて書いた');
  });

  // ---- P4 台帳で直した備考は残す ----
  await go('P4', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await S.page.evaluate(k => { lgSetNote(k, '台帳の備考'); }, 'm:' + Y);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { chosho_note: '前の備考' }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('P4', brief({ n: f.chosho_note, l: { n: l.note, s: l.noteSrc } }));
    okGenba(f, 'P4');
    ok(f.chosho_note === '台帳の備考', '★P4 台帳で直した備考が入らない → ' + f.chosho_note);
    ok(l.note === '台帳の備考' && l.noteSrc === '台帳の備考', '★P4 台帳の備考・控えが違う → ' + short(l));
  });

  // ---- P4b 現場が直した備考は採る（台帳の記録がある行）----
  await go('P4b', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('P4b', brief({ n: f.chosho_note, l: { n: l.note, s: l.noteSrc } }));
    ok(f.chosho_note === '現場の備考', '★P4b 現場の備考を古い値で消した → ' + f.chosho_note);
    ok(l.note === '現場の備考', '★P4b 台帳が現場の備考にならない → ' + short(l));
  });

  // ---- P4c 台帳だけの ✔ は書く ----
  await go('P4c', async S => {
    const fl = { compdoc_received: false };
    await start(S, [[X, [], fl], [Y, [], fl], [Z, [], fl]]);
    await ticked(S, Y, 'compdoc', true);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, fl));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('P4c', brief({ c: f.compdoc_received, l: { c: l.compdoc, s: l.compdocSrc } }));
    ok(f.compdoc_received === true, '★P4c 台帳の ✔ がファイルに入らない → ' + f.compdoc_received);
    ok(l.compdoc && l.compdocSrc, '★P4c 台帳の ✔・控えが違う → ' + short(l));
  });

  // ---- P4d 画面で打った備考は書く ----
  await go('P4d', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { chosho_note: '前の備考' }));
    await openRow(S, Y);
    await typeField(S, 'chosho_note', '画面の備考');
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('P4d', brief({ n: f.chosho_note, l: { n: l.note } }));
    okGenba(f, 'P4d');
    ok(f.chosho_note === '画面の備考' && l.note === '画面の備考', '★P4d 画面で打った備考が入らない → ' + short({ n: f.chosho_note, l: l.note }));
  });

  // ---- P5 台帳の「完了」✔（直した欄の分かる行）は持ち越して書く ----
  await go('P5', async S => {
    await start(S);
    await doneTick(S, Y);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '現場の住所', editedAt: NEW });
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), r = await rowOf2(S, Y);
    console.log('P5', brief({ a: f.chosho_cust_addr, s: f.chosho_status, r }));
    ok(f.chosho_cust_addr === '現場の住所', '★P5 現場の住所を消した → ' + f.chosho_cust_addr);
    ok(f.chosho_status === 'completed', '★P5 台帳の完了がファイルに入らない → ' + f.chosho_status);
    ok(!r.ed, '★P5 書けたのに「まだ入っていない」印が残った → ' + short(r));
  });

  // ---- P6 直した欄の分からない行は、書かずに知らせる ----
  await go('P6', async S => {
    await start(S);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r._lgEdited = true; lgEditedKeys(r, ['*']); }, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), r = await rowOf2(S, Y), a = alerts(S);
    console.log('P6', brief({ a: f.chosho_cust_addr, r, said: a.slice(-1).map(m => m.slice(0, 200)) }));
    okGenba(f, 'P6');
    ok(a.some(m => /戸別ファイルは書き替えていません/.test(m) && /新しい中身/.test(m)), '★P6 書かなかったことを知らせない → ' + short(a));
    ok(r.ed, '★P6 「まだ入っていない」印が下りた → ' + short(r));
  });

  // ---- P7 📥 で入れてまだファイルに無い行は合わせない ----
  await go('P7', async S => {
    await start(S);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_cust_addr: '取り込んだ住所' }); r._genbaUnsaved = true; }, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P7', brief({ a: f.chosho_cust_addr, m: merged(S) }));
    ok(f.chosho_cust_addr === '取り込んだ住所' && !merged(S), '★P7 📥 で入れた内容がファイルに入らない → ' + f.chosho_cust_addr);
  });

  // ---- P8 続けて保存：いま書いたファイルを「新しい」と見ない ----
  await go('P8', async S => {
    await start(S);
    await reopen(S);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1111-0001');
    await press(S);
    await sleep(50);
    await typeField(S, 'chosho_cust_tel', '090-1111-0002');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P8', brief({ t: f.chosho_cust_tel, m: merged(S) }));
    ok(f.chosho_cust_tel === '090-1111-0002', 'P8 2回目の電話が入る → ' + f.chosho_cust_tel);
    ok(!merged(S), '★P8 いま書いたファイルを「新しい」と見た');
  });

  // ---- P9 写真：ファイルにしか無い写真は残る・行に元の写真を持たせない ----
  await go('P9', async S => {
    await start(S, [[X], [Y, ['g1'], {}], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, ['g1', 'g2'], genba);
    const n0 = await S.page.evaluate(no => ((_listRows.find(x => x.data.chosho_mgmt_no === no).data.chosho_photos) || []).filter(p => p && p.dataUri).length, Y);
    await openRow(S, Y);
    await press(S);
    const ids = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json');
    const n1 = await S.page.evaluate(no => ((_listRows.find(x => x.data.chosho_mgmt_no === no).data.chosho_photos) || []).filter(p => p && p.dataUri).length, Y);
    console.log('P9', brief({ ids, n0, n1 }));
    ok(ids === 'g1,g2', '★P9 ファイルの写真が減った → ' + ids);
    ok(n1 === n0, '★P9 行の写真が替わった → ' + short({ n0, n1 }));
  });

  // ---- P10 日時の無いファイルは見分けられない（今までどおり全部の欄を書く）----
  await go('P10', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '日時の無いファイル' });
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P10', brief({ a: f.chosho_cust_addr, m: merged(S) }));
    ok(!merged(S) && f.chosho_cust_addr !== '日時の無いファイル', 'P10 日時の無いファイルは今までどおり → ' + f.chosho_cust_addr);
  });

  // ---- P11 画面で空にした欄は空で書く ----
  await go('P11', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P11', brief({ t: f.chosho_cust_tel, a: f.chosho_cust_addr }));
    okGenba(f, 'P11');
    ok(!f.chosho_cust_tel, '★P11 空にした電話が戻った → ' + f.chosho_cust_tel);
  });

  // ---- P12 利用者が触っていなければ、画面の差を直した欄に数えない（開いたあとで自動で整う欄）----
  await go('P12', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_old' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await S.page.evaluate(() => { _editorBase.vals.amplifier = '"自動で整う前の値"'; clearEditorDirty(); });
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P12', brief({ amp: f.amplifier }));
    okGenba(f, 'P12');
  });

  // ---- P13 📥 で変わった欄（_rowNewer）は行の値で書く ----
  await go('P13', async S => {
    await start(S);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_cust_addr: '取り込んだ住所' }); r._rowNewer = ['chosho_cust_addr']; }, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P13', brief({ a: f.chosho_cust_addr, s: f.chosho_status }));
    ok(f.chosho_cust_addr === '取り込んだ住所', '★P13 📥 で変わった欄がファイルの値へ戻った → ' + f.chosho_cust_addr);
    ok(f.chosho_status === 'completed', '★P13 現場の完了を消した → ' + f.chosho_status);
  });

  // ---- P14 ファイルの中の管理番号が違っても、行の番号で書く ----
  await go('P14', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', '2622ZZZ999', [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P14', brief({ no: f.chosho_mgmt_no }));
    ok(f.chosho_mgmt_no === Y, '★P14 行の番号が替わった → ' + f.chosho_mgmt_no);
  });

  // ---- P15 管理番号を付け替えるときも合わせる ----
  const NO2 = '2622MAB099';
  await go('P15', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await S.page.evaluate(({ no, n2 }) => { lgWriteCaseField(_listRows.find(x => x.data.chosho_mgmt_no === no), 'mgmt', n2, { quiet: true }); }, { no: Y, n2: NO2 });
    await press(S);
    const f = await fileOf(S, NO2);
    console.log('P15', brief({ no: f.chosho_mgmt_no, a: f.chosho_cust_addr, s: f.chosho_status }));
    ok(f.chosho_mgmt_no === NO2, '★P15 新しい番号で書いていない → ' + f.chosho_mgmt_no);
    okGenba(f, 'P15');
  });

  // ---- P15b 付け替えるときは止めない（空のファイルを残さない）----
  await go('P15b', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await S.page.evaluate(({ no, n2 }) => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); lgWriteCaseField(r, 'mgmt', n2, { quiet: true }); lgEditedKeys(r, ['*']); }, { no: Y, n2: NO2 });
    await press(S);
    const t = await S.page.evaluate(n => window.__folders.L.__files[n], NO2 + '.json');
    console.log('P15b', brief({ t: String(t).slice(0, 60) }));
    ok(t && JSON.parse(t).chosho_mgmt_no === NO2, '★P15b 新しい名前のファイルが空のまま → ' + String(t).slice(0, 60));
  });

  // ---- P19 合わせた中身が物件へ入る（ファイルを読むのが遅いときも）----
  await go('P19', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '現場の住所', editedAt: NEW });
    await openRow(S, Y);
    await sleep(2400);                                    // 開いた直後の自動保存が終わるのを待つ
    /* ファイルを読むのが遅いとき：保存を押したときの自動保存は、合わせる前に終わる（別の保存に入らない） */
    await S.page.evaluate(n => { const d = window.__folders.L, g = d.getFileHandle;
      d.getFileHandle = async (m, o) => { const h = await g(m, o);
        if(m === n){ const gf = h.getFile; h.getFile = async () => { await new Promise(r => setTimeout(r, 1200)); return gf(); }; }
        return h; }; }, Y + '.json');
    await press(S);
    await sleep(2400);
    const a = await S.page.evaluate(async no => {
      const p = await projIdbGet(_currentProject.id), x = (p.cases || []).find(q => q.payload && q.payload.chosho_mgmt_no === no);
      return x && x.payload.chosho_cust_addr;
    }, Y);
    console.log('P19', brief({ a, m: merged(S) }));
    ok(merged(S), 'P19 試験の前提: 合わせて書いた');
    ok(a === '現場の住所', '★P19 合わせた中身が物件に入らない → ' + a);
  });

  const flip = async S => { const hw = (await scr(S, 'high_work')) === 'yes' ? 'no' : 'yes'; await typeField(S, 'high_work', hw); return hw; };
  const backToList = S => S.page.evaluate(() => { syncEditorToRowData(); projTouch(); });   // 一覧へ戻った（💾 は押していない）

  // ---- P20 図面の無い行で工事の欄を直す（ファイルにも図面が無い）→ 標準の構成ごと入る・続けて 💾 しても消えない ----
  await go('P20', async S => {
    await start(S, [[X], [Y, [], { survey_done: false }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '現場の住所', survey_done: true, editedAt: NEW });
    await openRow(S, Y);
    const hw = await flip(S);
    await press(S);
    const f = await fileOf(S, Y), s1 = await scr(S, 'high_work');
    console.log('P20', brief({ hw, f: { h: f.high_work, amp: f.amplifier, a: f.chosho_cust_addr, sv: f.survey_done }, s1 }));
    ok(f.high_work === hw && !!f.amplifier, '★P20 直した欄・標準の構成がファイルに入らない → ' + short({ h: f.high_work, amp: f.amplifier }));
    ok(f.chosho_cust_addr === '現場の住所' && f.survey_done === true, '★P20 現場の内容を消した → ' + short({ a: f.chosho_cust_addr, sv: f.survey_done }));
    ok(s1 === hw, '★P20 画面が標準の値に戻った → ' + s1);
    await press(S);
    const f2 = await fileOf(S, Y);
    console.log('P20 続き', brief({ h: f2.high_work, a: f2.chosho_cust_addr, sv: f2.survey_done }));
    ok(f2.high_work === hw && f2.chosho_cust_addr === '現場の住所' && f2.survey_done === true, '★P20 続けて 💾 すると直しか現場の内容が消えた → ' + short({ h: f2.high_work, a: f2.chosho_cust_addr, sv: f2.survey_done }));
  });

  // ---- P20b 図面の無い行で工事の欄を直す（ファイルには図面がある）→ 直した欄だけ入る・現場の図面は残す ----
  await go('P20b', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { wire_len_test: 12 }));
    await openRow(S, Y);
    const hw = await flip(S);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P20b', brief({ hw, h: f.high_work, amp: f.amplifier }));
    okGenba(f, 'P20b');
    ok(f.high_work === hw, '★P20b 直した欄が入らない → ' + f.high_work);
  });

  // ---- P21 一覧へ戻っただけの直しのあとで現場が保存 → 何も直さず 💾：直しも現場の内容も残る ----
  await go('P21', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    const hw = await flip(S);
    await backToList(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P21', brief({ hw, h: f.high_work, a: f.chosho_cust_addr, m: merged(S) }));
    okGenba(f, 'P21');
    ok(f.high_work === hw, '★P21 一覧へ戻っただけの直しが消えた → ' + f.high_work);
  });

  // ---- P21b 同じ。物件を開き直したあと（直した欄は物件に入っている）----
  await go('P21b', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    const hw = await flip(S);
    await backToList(S);
    await sleep(1700);
    await reopen(S);
    const leak = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { k: r._edKeys || null, inData: '_edKeys' in r.data }; }, Y);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P21b', brief({ leak, hw, h: f.high_work, e: f._edKeys }));
    ok(!leak.inData && !f._edKeys, '★P21b 印が戸別の中身に混ざった → ' + short(leak));
    okGenba(f, 'P21b');
    ok(f.high_work === hw, '★P21b 開き直すと一覧へ戻っただけの直しが消えた → ' + f.high_work);
  });

  // ---- P21c 書けたら印を下ろす：そのあと現場が同じ欄を直したら、現場の値を残す ----
  await go('P21c', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    const hw = await flip(S);
    await backToList(S);
    await press(S);
    const left = await S.page.evaluate(no => _listRows.find(x => x.data.chosho_mgmt_no === no)._edKeys || null, Y);
    const other = hw === 'yes' ? 'no' : 'yes';
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { high_work: other }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P21c', brief({ left, other, h: f.high_work }));
    ok(!left, '★P21c 書けたのに直した欄の印が残った → ' + short(left));
    ok(f.high_work === other, '★P21c 現場が直した欄を前の直しで戻した → ' + f.high_work);
  });

  // ---- P21d 💾 上書き保存の道でも、書けたら印を下ろす ----
  await go('P21d', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43' }], [Z]]);
    await S.page.evaluate(async no => { await openCaseInEditor(_listRows.find(x => x.data.chosho_mgmt_no === no), false); }, Y);
    const hw = await flip(S);
    const o = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      syncEditorToRowData();
      const k0 = (r._edKeys || []).slice(), org = !!(_loadedOrigin && _loadedOrigin.fileHandle);
      await overwriteSaveCurrent();
      return { k0, org, k1: r._edKeys || null };
    }, Y);
    console.log('P21d', brief(o));
    ok(o.org && o.k0.indexOf('high_work') >= 0, 'P21d 試験の前提: ファイルから開いていて、直した欄を覚えている → ' + short(o));
    ok(!o.k1, '★P21d 💾 上書き保存で書けたのに印が残った → ' + short(o));
  });

  // ---- P22 台帳で作った行に同じ番号の新しいファイル → 書かずに知らせる（台帳の値をファイルの値で置き換えない）----
  const NO3 = '2622MAB055';
  await go('P22', async S => {
    await start(S);
    await S.page.evaluate(no => { createManualRow({ chosho_mgmt_no: no, chosho_cust_name: '台帳の名前', chosho_cust_addr: '台帳の住所' }); projTouch(); }, NO3);
    await reopen(S);
    await putFile(S, 'L', NO3 + '.json', NO3, [], genba);
    await openRow(S, NO3);
    await press(S);
    const f = await fileOf(S, NO3), a = alerts(S);
    const r = await S.page.evaluate(no => { const x = _listRows.find(q => q.data.chosho_mgmt_no === no); return { n: x.data.chosho_cust_name, a: x.data.chosho_cust_addr, m: !!x._manual }; }, NO3);
    console.log('P22', brief({ a: f.chosho_cust_addr, r, said: a.slice(-1).map(m => m.slice(0, 220)) }));
    ok(f.chosho_cust_addr === '現場の住所', '★P22 台帳で作った行でファイルを書き替えた → ' + f.chosho_cust_addr);
    ok(r.a === '台帳の住所' && r.n === '台帳の名前', '★P22 台帳の値が消えた → ' + short(r));
    ok(a.some(m => /受付台帳で作った行/.test(m)), '★P22 知らせが無い → ' + short(a));
  });

  // ---- P23 管理番号の付け替え先に別のファイル：そのファイルで行を置き換えない ----
  const NO4 = '2622MAB066';
  await go('P23', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_old', chosho_cust_addr: '行の住所' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', NO4 + '.json', NO4, [], genba);
    await openRow(S, Y);
    await S.page.evaluate(({ no, n2 }) => { lgWriteCaseField(_listRows.find(x => x.data.chosho_mgmt_no === no), 'mgmt', n2, { quiet: true }); }, { no: Y, n2: NO4 });
    await press(S);
    const f = await fileOf(S, NO4);
    console.log('P23', brief({ no: f.chosho_mgmt_no, a: f.chosho_cust_addr, m: merged(S) }));
    ok(!merged(S) && f.chosho_cust_addr === '行の住所', '★P23 付け替え先の別のファイルで行を置き換えた → ' + short({ a: f.chosho_cust_addr, m: merged(S) }));
  });

  // ---- P24 自分でファイルへ書いた日時を、次の 💾 が「新しい」と見ない ----
  await go('P24', async S => {
    await start(S, [[X], [Y, [], { editedAt: OLD }], [Z]]);
    await openRow(S, Y);
    const st = await S.page.evaluate(async no => await caseFilePatch(_listRows.find(x => x.data.chosho_mgmt_no === no), { asbestos: { judged: 'test' } }), Y);
    await typeField(S, 'chosho_cust_tel', '090-1111-2222');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P24', brief({ st, t: f.chosho_cust_tel, m: merged(S) }));
    ok(st === 'written', 'P24 試験の前提: ファイルへ書けた → ' + st);
    ok(!merged(S), '★P24 自分で書いたファイルを「新しい」と見た');
  });

  // ---- P24b 石綿を全世帯へそろえて書けた行は、欄の分からない印も下ろす ----
  await go('P24b', async S => {
    await start(S);
    const o = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      const res = await aptAsbestosApplyAll([r], { judged: 'test' });
      return { w: res.written, ed: !!r._lgEdited, lk: r._lgKeys || null };
    }, Y);
    console.log('P24b', brief(o));
    ok(o.w === 1, 'P24b 試験の前提: ファイルへ書けた → ' + short(o));
    ok(!o.ed && !o.lk, '★P24b 書けたのに印が残った → ' + short(o));
  });

  const slowFile = (S, no, read, close) => S.page.evaluate(({ n, read, close }) => { const d = window.__folders.L, g = d.getFileHandle;
    d.getFileHandle = async (m, o) => { const h = await g(m, o);
      if(m === n){
        const gf = h.getFile, cw = h.createWritable;
        if(read) h.getFile = async () => { await new Promise(r => setTimeout(r, read)); return gf(); };
        if(close) h.createWritable = async () => { const w = await cw(), cl = w.close; w.close = async () => { await new Promise(r => setTimeout(r, close)); await cl(); }; return w; };
      }
      return h; }; }, { n: no + '.json', read, close });

  // ---- P26 現場のファイルでも、PCだけが持つ欄（料金・石綿・図面の手直し）は行の値を残す ----
  await go('P26', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', tax_mode: 'excl', editedAt: OLD }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { tax_mode: 'incl' }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P26', brief({ tax: f.tax_mode, m: merged(S) }));
    okGenba(f, 'P26');
    ok(f.tax_mode === 'excl', '★P26 PCだけが持つ欄が現場のファイルの値になった → ' + f.tax_mode);
  });

  // ---- P26b 別のPCが書いたファイルは、その値を採る ----
  await go('P26b', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', tax_mode: 'excl', editedAt: OLD }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { tax_mode: 'incl', _origin: 'main' }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P26b', brief({ tax: f.tax_mode, m: merged(S) }));
    ok(f.tax_mode === 'incl', '★P26b 別のPCが直した欄を行の古い値で戻した → ' + f.tax_mode);
  });

  // ---- P26c アパートの欄（受付台帳でしか直せない）も行の値を残す ----
  await go('P26c', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', apt_name: '台帳のアパート', editedAt: OLD }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { apt_name: '' }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P26c', brief({ apt: f.apt_name }));
    ok(f.apt_name === '台帳のアパート', '★P26c アパートの欄が消えた → ' + f.apt_name);
  });

  // ---- P27 物件の融合で行が替わっても、直した欄を覚える ----
  await go('P27', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    const swapped = await S.page.evaluate(async no => {
      const was = _editingRow, p = await projIdbGet(_currentProject.id);
      await applyMergedLocally(p);
      return was !== _editingRow && _editingRow.data.chosho_mgmt_no === no;
    }, Y);
    const hw = await flip(S);
    await backToList(S);
    const k = await S.page.evaluate(no => _listRows.find(x => x.data.chosho_mgmt_no === no)._edKeys || null, Y);
    console.log('P27', brief({ swapped, k }));
    ok(swapped, 'P27 試験の前提: 融合で行が替わった');
    ok(Array.isArray(k) && k.indexOf('high_work') >= 0, '★P27 融合のあとで直した欄を覚えない → ' + short(k));
  });

  // ---- P27b 開けなかったときは、開いている戸別の控えを替えない ----
  await go('P27b', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43' }], [Z]]);
    await openRow(S, Y);
    const o = await S.page.evaluate(async () => {
      const was = _editorBase && _editorBase.row;
      const p0 = promptPassword; promptPassword = async () => null;
      await openCaseInEditor({ fileType: 'hybrid', envelope: { plain: {} }, file: 'H1.hyb', data: { chosho_mgmt_no: '2622HYB001', amplifier: 'amp_3u43' } }, false);
      promptPassword = p0;
      return { same: !!was && _editorBase && _editorBase.row === was, editing: was === _editingRow };
    });
    console.log('P27b', brief(o));
    ok(o.editing, 'P27b 試験の前提: 開いている戸別のまま → ' + short(o));
    ok(o.same, '★P27b 開けなかったのに控えが替わった → ' + short(o));
  });

  // ---- P28 保存のあいだに打った欄：消えない・現場の内容も消えない ----
  await go('P28', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await slowFile(S, Y, 500, 0);
    S.said.length = 0;
    const pr = S.page.evaluate(async () => { await overwriteSaveCurrent(); });
    await sleep(300);
    const hw = await flip(S);
    await pr;
    await sleep(300);
    const sv = await scr(S, 'high_work'), sa = await scr(S, 'chosho_cust_addr');
    console.log('P28', brief({ hw, sv, sa, m: merged(S) }));
    ok(merged(S), 'P28 試験の前提: 合わせて書いた');
    ok(sv === hw, '★P28 保存のあいだに打った欄が消えた → ' + sv);
    ok(sa === '現場の住所', '★P28 画面が前の中身のまま → ' + sa);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P28 続き', brief({ h: f.high_work }));
    okGenba(f, 'P28 続き');
    ok(f.high_work === hw, '★P28 続けて 💾 しても打った欄が入らない → ' + f.high_work);
  });

  // ---- P28b 書くのが遅く、そのあいだに自動保存が走っても、前の画面で行を戻さない ----
  await go('P28b', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_3u43', editedAt: OLD }], [Z]]);
    await reopen(S);
    await openRow(S, Y);
    const h0 = await scr(S, 'high_work');                 // ファイルにも同じ値（開き直すと画面がこの値に戻る）
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { high_work: h0 }));
    await slowFile(S, Y, 0, 2500);
    S.said.length = 0;
    const pr = S.page.evaluate(async () => { await overwriteSaveCurrent(); });
    await sleep(700);
    const hw = await flip(S);
    await S.page.evaluate(() => { projAutoSaveEdit(); });
    await pr;
    await sleep(300);
    const r = await rowOf2(S, Y), sa = await scr(S, 'chosho_cust_addr'), sv = await scr(S, 'high_work');
    console.log('P28b', brief({ r: { a: r.addr, s: r.st }, sa, sv, hw, m: merged(S) }));
    ok(merged(S), 'P28b 試験の前提: 合わせて書いた');
    ok(r.addr === '現場の住所' && sa === '現場の住所', '★P28b 自動保存が前の画面で行を戻した → ' + short({ a: r.addr, sa }));
    ok(sv === hw, '★P28b 書いているあいだに打った欄が消えた → ' + sv);
  });

  // ---- P29 ファイルの預けの印（_side）を、いつもの名前のファイルに残さない ----
  await go('P29', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { _side: { at: 'x' } }));
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), r = await S.page.evaluate(no => '_side' in _listRows.find(x => x.data.chosho_mgmt_no === no).data, Y);
    console.log('P29', brief({ side: f._side, r }));
    ok(!f._side && !r, '★P29 預けの印が残った → ' + short({ side: f._side, r }));
  });

  // ---- P30 行の知らない預けがあるファイル：今までの引き継ぎの道（預けの欄と済みの印を残す）----
  await go('P30', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], Object.assign({}, genba, { chosho_cust_tel: '預けの電話', _sideMerged: ['st1'], _sideKeys: { st1: ['chosho_cust_tel'] } }));
    await S.page.evaluate(() => { _projDirHandle = null; });        // 開くときは預けを読まない（工事フォルダをまだつないでいない）
    await openRow(S, Y);
    await press(S);
    const f = await fileOf(S, Y), a = alerts(S);
    console.log('P30', brief({ t: f.chosho_cust_tel, wd: f.work_done, s: f.chosho_status, m: merged(S), said: a.slice(-1).map(m => m.slice(-160)) }));
    ok(f.chosho_cust_tel === '預けの電話' && f.work_done === true && f.chosho_status === 'completed', '★P30 預けの欄・済みの印が消えた → ' + short({ t: f.chosho_cust_tel, wd: f.work_done, s: f.chosho_status }));
    ok(a.some(m => /現場から預かった入力/.test(m)) && !merged(S), '★P30 預けの知らせが出ない → ' + short(a));
  });

  // ---- P16 残した欄の名前を知らせる ----
  await go('P16', async S => {
    await start(S);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], { chosho_cust_addr: '現場の住所', editedAt: NEW });
    await openRow(S, Y);
    await press(S);
    const a = alerts(S).filter(m => /いま直した欄だけ/.test(m));
    console.log('P16', brief(a.map(m => m.slice(-160))));
    ok(a.length && /住所/.test(a[0]), '★P16 残した欄の名前が出ない → ' + short(a));
  });

  // ---- P2c 一覧から直に開いた行 ----
  await go('P2c', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_old' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await S.page.evaluate(async no => { await listLoadRow(_listRows.find(x => x.data.chosho_mgmt_no === no)); }, Y);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P2c', brief({ a: f.chosho_cust_addr, m: merged(S) }));
    okGenba(f, 'P2c');
  });

  // ---- P4e 現場も画面も備考を直した → いま打った値 ----
  await go('P4e', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await typeField(S, 'chosho_note', '画面の備考');
    await press(S);
    const f = await fileOf(S, Y), l = await led(S, Y);
    console.log('P4e', brief({ n: f.chosho_note, l: { n: l.note, s: l.noteSrc } }));
    ok(f.chosho_note === '画面の備考' && l.note === '画面の備考', '★P4e いま打った備考が現場の備考に負けた → ' + short({ n: f.chosho_note, l: l.note }));
  });

  // ---- P4f 図面の無い行で電話を直す → 現場の備考は採る（開いたとき画面へ入った備考を、いま直した欄に数えない）----
  await go('P4f', async S => {
    await start(S, [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    await typeField(S, 'chosho_cust_tel', '090-1234-5678');
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P4f', brief({ t: f.chosho_cust_tel, n: f.chosho_note }));
    ok(f.chosho_cust_tel === '090-1234-5678', '★P4f 電話が入らない');
    ok(f.chosho_note === '現場の備考', '★P4f 現場の備考を台帳の古い値で消した → ' + f.chosho_note);
  });

  // ---- P9b 行にだけある写真も入る ----
  await go('P9b', async S => {
    await start(S, [[X], [Y, ['g1'], {}], [Z]]);
    await reopen(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_photos: (r.data.chosho_photos || []).concat([__ph('g9', '#333')]) }); }, Y);
    await putFile(S, 'L', Y + '.json', Y, ['g1'], genba);
    await openRow(S, Y);
    await press(S);
    const ids = await S.page.evaluate(n => __pids(window.__folders.L.__files[n]), Y + '.json');
    console.log('P9b', brief({ ids, m: merged(S) }));
    ok(ids === 'g1,g9', '★P9b 行にだけある写真がファイルに入らない → ' + ids);
  });

  // ---- P18 自動保存のあとで 💾：触った欄を覚えている ----
  await go('P18', async S => {
    await start(S, [[X], [Y, [], { amplifier: 'amp_old' }], [Z]]);
    await reopen(S);
    await putFile(S, 'L', Y + '.json', Y, [], genba);
    await openRow(S, Y);
    const hw = (await scr(S, 'high_work')) === 'yes' ? 'no' : 'yes';
    await typeField(S, 'high_work', hw);
    await S.page.evaluate(() => { projAutoSaveEdit(); });  // 自動保存で行へ取り込まれる
    await sleep(2300);
    const dirty = await S.page.evaluate(() => _editorDirty);
    await press(S);
    const f = await fileOf(S, Y);
    console.log('P18', brief({ dirty, hw, f: f.high_work, m: merged(S) }));
    ok(!dirty, 'P18 試験の前提: 自動保存で行へ取り込まれた');
    ok(f.high_work === hw, '★P18 自動保存のあとで、触った欄がファイルに入らない → ' + f.high_work);
    okGenba(f, 'P18');
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v184_m_projsave_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
