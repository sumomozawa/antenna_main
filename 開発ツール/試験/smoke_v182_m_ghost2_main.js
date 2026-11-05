/* 版182（メイン・組 m-ghost の続き）
   smoke_v182_m_ghost_main.js の A〜D（再現）の続き。物件の行とフォルダの中身だけで決める読み込みの、残す動きと穴を確かめる。
   ★は直ったあとの正しい動き。作りは同じ（場面ごとに新しいブラウザの入れ物・作り物のフォルダと共有ファイル・ボタンと窓は実際に押す）。
     E1〜E1c 端末の古い控え・物件なしの控え・物件で残した控え     E2〜E2b 行にだけある写真の引き継ぎと 💾
     E3〜E5  読めない行・暗号の行を聞かずに残す                     E6〜E6d 別の工事のフォルダの窓（重複の整理・掃除より先に出る）
     E7 📄 で物件のほかの行が残る                                    E8・E30・E31 🗑 の窓（写真の枚数・ファイルごと消すの出し分け・再接続）
     E9・E10・E25・E33 戻ったファイルを書き替えない                  E11 物件で 🧽 が効かない
     E12 全角の番号                                                   E13 行を消したときの台帳の記入・備考の履歴
     E14・E18・E24・E26・E41 行からファイルへの引き継ぎ               E15・E16・E20 行を作らない・札の無い控え
     E17 📁 のフォルダの持ち越し                                      E19 別の階層の同じ名前
     E21・E37・E40・E43 備考の控え（ファイル無の行は書かない）                         E22・E23 掃除で消したファイルの行・同じ番号の2行
     E27・E36・E42 読んでいる間に物件が替わる                         E28・E29 空のフォルダ
     E32・E34・E35・E38・E39 控えの後始末・閲覧用・窓の文
     E44 暗号の行の足した写真  E45 引き継いだ work_done と 💾  E46 ファイルができた行  E47 読めなかったので残した行  E48 📄 で残した行の備考
     E49 ファイル無の行と 💾 上書き保存  E50 完了を下げない  E51 引き継いだ写真の行の 🗑  E52 読めなかった行に足した写真  E53 窓のあいだの行
   使い方: node smoke_v182_m_ghost2_main.js [メイン index.html]　（ONLY=E1,E2b で場面を絞れる。完全一致） */
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

  // ---- E1 古い形の控えが残っている端末（実機の3件）：物件でも物件なしでも窓も行も出ない・消さない・🗑 で消えて戻らない ----
  await go('E1', async S => {
    const A = '2622MAB031', B = '2622MAB032', K = '2612MKM016';
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[A], [B], [M2]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', M2);
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-keep');
    await writeShared(S, 'D', SHARED, []);
    await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(({ A, B, nos }) => {
      const e = no => ({ no, n: no + ' 様', a: '三沢市', t: '', dt: '', s: 'in_progress', wt: '', note: '', p: no + '.json', root: 'リスト', at: 1, key: 'm:' + no });
      _detachedMap = {}; nos.forEach(no => { _detachedMap['m:' + no] = e(no); }); saveDetachedMap();
      const c = { v: 1, root: 'リスト', at: 1, entries: {} };
      [A, B].concat(nos).forEach(no => { const x = e(no); delete x.root; delete x.at; delete x.key; c.entries['m:' + no] = x; });
      lsSet('antenna_list_census_v1', JSON.stringify(c));
    }, { A, B, nos: [M1, K, M2] });
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    console.log('E1 物件で読む', brief({ w1, rows: nos(v1), det: v1.det, census: v1.census, status: v1.status }));
    ok(!w1, '★E1 物件を開いて読むと、古い控えの番号で窓が出た → ' + short(w1));
    ok(!rowOf(v1, M1) && !rowOf(v1, K), '★E1 古い控えから行が戻った → ' + nos(v1));
    ok(rowOf(v1, M2) && rowOf(v1, M2).det === 'kept', '★E1 物件のファイル無の行が残っていない → ' + nos(v1));
    ok(new RegExp('ファイル無の行 1 件：' + M2).test(v1.status) && /🗑/.test(v1.status), '★E1 読み終わりの一行に、片付ける行が出ない → ' + v1.status);
    await ledgerDelete(S, M2, '#lgdel-list');
    await sleep(1800);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v2 = await look(S), sp = await sharedCases(S, 'D', SHARED);
    console.log('E1 🗑 のあと', brief({ w2, rows: nos(v2), shared: spNos(sp), det: v2.det }));
    ok(!w2 && !rowOf(v2, M2), '★E1 🗑 で消した行が戻った → ' + short({ w2, rows: nos(v2) }));
    ok(!sp.some(c => c.no === M2), '★E1 🗑 で消した行が物件ファイルに残っている → ' + spNos(sp));
    ok(v2.det.indexOf('m:' + M2) < 0 && v2.det.indexOf('m:' + M1) >= 0, '★E1 控えの片付けが違う（消した番号だけ外す） → ' + short(v2.det));
    // 物件を閉じて読む：窓も行も出ない。知らせは1回だけ。控えは消えない
    await S.page.evaluate(() => detachProject());
    const w3 = await pressFolder(S, 'L');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S);
    const w4 = await pressFolder(S, 'L');
    if(w4) await answerMiss(S, '#lgmiss-keep');
    const v4 = await look(S);
    console.log('E1 物件なし', brief({ w3, rows: nos(v3), det: v3.det, status: v3.status, w4, rows4: nos(v4), status4: v4.status }));
    ok(!w3 && !w4, '★E1 物件なしで、古い控えの番号の窓が出た → ' + short({ w3, w4 }));
    ok(!rowOf(v4, M1) && !rowOf(v4, K), '★E1 物件なしで、古い控えの行が起きた → ' + nos(v4));
    ok(v4.det.indexOf('m:' + M1) >= 0 && v4.det.indexOf('m:' + K) >= 0, '★E1 古い控えが消えた → ' + short(v4.det));
    ok(/前の版で「名前だけ残す」/.test(v3.status) && /そのままで問題ありません/.test(v3.status), '★E1 古い控えの知らせが出ない → ' + v3.status);
    ok(!/前の版で「名前だけ残す」/.test(v4.status), '★E1 古い控えの知らせが毎回出る → ' + v4.status);
  });

  // ---- E1b 物件なしで残した新しい形の控え：物件には入らず消えない・物件を閉じて読むと起きる ----
  await go('E1b', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-keep');
    await newProject(S, PJ2); await toLedger(S);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    const pidIn = await S.page.evaluate(k => (JSON.parse(lsGet('antenna_detached_v1')) || {})[k], 'm:' + Y);
    console.log('E1b 物件', brief({ w1, rows: nos(v1), pidIn }));
    ok(!rowOf(v1, Y), '★E1b 物件なしの控えから物件に行が入った → ' + nos(v1));
    ok(pidIn && pidIn.pid === '', '★E1b 物件なしの控えが消えた／札が違う → ' + short(pidIn));
    await S.page.evaluate(() => { detachProject(); _listRows = []; renderListTable(); });
    await sleep(300);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v2 = await look(S);
    console.log('E1b 物件なし', brief({ w2, rows: nos(v2) }));
    ok(rowOf(v2, Y) && rowOf(v2, Y).det === 'kept', '★E1b 物件を閉じて読んでも、物件なしの控えの行が起きない → ' + nos(v2));
  });

  // ---- E1c 物件で残した控えは、物件を閉じて読んでも起きない ----
  await go('E1c', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-keep');
    await S.page.evaluate(() => { detachProject(); _listRows = []; renderListTable(); });
    await sleep(300);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S);
    console.log('E1c', brief({ w, rows: nos(v), det: v.det }));
    ok(!w && nos(v) === [X, Z].join(','), '★E1c 物件の控えから物件なしの一覧に行が起きた → ' + short({ w, rows: nos(v) }));
  });
  // ---- E2 行にだけある写真（ファイルが無いあいだに入った）→ ファイルが戻る ----
  await go('E2', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_photos: [__ph('y3', '#999')] });
      r._thumbs = undefined; r._thumbsRetry = true; r._genbaUnsaved = true;
    }, Y);
    await moveBack(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S), f = await folderInfo(S, 'L');
    const ph = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      const p = await projIdbGet(_currentProject.id);
      const c = p.cases.find(x => x.payload.chosho_mgmt_no === no);
      return { mem: (r.data.chosho_photos || []).map(q => q.id), unsaved: !!r._genbaUnsaved, thumbs: (r._thumbs || []).map(q => q.id).sort(),
               idb: ((c.payload.chosho_photos) || []).map(q => q.id).sort(), man: !!c.payload._manual };
    }, Y);
    console.log('E2', brief({ w, row: rowOf(v, Y), ph, status: v.status, writes: f.writes }));
    ok(!w && rowOf(v, Y) && !rowOf(v, Y).det, '★E2 ファイルが戻っても行が元に戻らない → ' + short({ w, r: rowOf(v, Y) }));
    ok(ph.mem.join() === 'y3' && ph.unsaved, '★E2 行にだけある写真を引き継がない → ' + short(ph));
    ok(ph.idb.join() === 'y1,y2,y3' && !ph.man, '★E2 物件の写真が減った → ' + short(ph));
    ok(f.writes.length === 0, '★E2 📁 でファイルを書いた → ' + short(f));
    // 💾 で戸別ファイルへ入る
    const note = await S.page.evaluate(async no => {
      const row = _listRows.find(x => x.data.chosho_mgmt_no === no), prev = _editingRow;
      _editingRow = row;
      try { return await writeCurrentCaseToIndividualFile(); } finally { _editingRow = prev; }
    }, Y);
    const f2 = await folderInfo(S, 'L');
    console.log('E2 💾', brief({ note, files: f2.files, writes: f2.writes }));
    ok(f2.files.join(' ').indexOf(Y + '.json:y1,y2,y3') >= 0, '★E2 💾 で戸別ファイルへ入らない → ' + short(f2));
  });
  // ---- E2b 引き継いだまま 💾 を押さずに物件を開き直す → 📁 の前に確かめが出る（黙って消えない） ----
  await go('E2b', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_photos: [__ph('y3', '#999')] });
      r._thumbs = undefined; r._thumbsRetry = true; r._genbaUnsaved = true;
    }, Y);
    await moveBack(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    const st = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { un: !!r._genbaUnsaved, inData: '_genbaUnsaved' in r.data, ph: (r.data.chosho_photos || []).map(q => q.id).sort() }; }, Y);
    S.said.length = 0;
    await pressFolder(S, 'L');
    const asked = confirms(S).some(m => /まだ戸別ファイルへ入っていません/.test(m));
    console.log('E2b', brief({ st, asked }));
    ok(st.un && !st.inData && st.ph.join() === 'y1,y2,y3', '★E2b 開き直すと印か写真が抜けた／中身に印が混ざった → ' + short(st));
    ok(asked, '★E2b 行にだけある写真があるのに、📁 の前に確かめが出ない → ' + short(S.said));
  });

  // ---- E3 読めないファイルの行は残す ----
  await go('E3', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S), sp = await sharedCases(S, 'D', SHARED), r = await ledgerRow(S, Y);
    const led = await S.page.evaluate(({ f, k }) => { const p = JSON.parse(window.__folders.D.__files[f]); return p.ledger && p.ledger[k] && p.ledger[k].note; }, { f: SHARED, k: 'm:' + Y });
    console.log('E3', brief({ w, rows: nos(v), shared: spNos(sp), r, led, status: v.status }));
    ok(!w, '★E3 読めないだけのファイルで窓が出た → ' + short(w));
    ok(rowOf(v, Y) && !rowOf(v, Y).det, '★E3 読めないファイルの行が消えた／印が付いた → ' + nos(v));
    ok(sp.some(c => c.no === Y), '★E3 読めないファイルの行が物件ファイルから消えた → ' + spNos(sp));
    ok(led === NOTE && r && r.note === NOTE, '★E3 台帳の記入が消えた → ' + short({ led, r }));
    ok(idbOf(v, Y) && idbOf(v, Y).thumbs === 2, '★E3 写真の縮小版が減った → ' + short(idbOf(v, Y)));
  });

  // ---- E4 まだ開いていない暗号の行 ----
  await go('E4', async S => {
    const H = '2622HYB001', PW = 'pw1234';
    S.dismiss = /まとめて復号しますか/;
    await newProject(S, PJ2); await toLedger(S);
    await S.page.evaluate(async ({ H, PW, X }) => {
      const env = await encryptHybrid(JSON.parse(__case(H, ['h1'])), PW);
      window.__folders.L = __mk('リスト', { [X + '.json']: __case(X), [H + '.hyb']: JSON.stringify(env) });
    }, { H, PW, X });
    await pressFolder(S, 'L');
    await typeNote(S, H, NOTE); await waitNoteSaved(S, H, NOTE);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(n => { delete window.__folders.L.__files[n]; }, H + '.hyb');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S), sp = await sharedCases(S, 'D', SHARED), r = await ledgerRow(S, H);
    console.log('E4', brief({ w, rows: nos(v), shared: spNos(sp), r, status: v.status }));
    ok(!w && rowOf(v, H), '★E4 暗号の行が消えた／窓が出た → ' + short({ w, rows: nos(v) }));
    ok(sp.length === 2, '★E4 暗号の行が物件ファイルから消えた → ' + spNos(sp));
    ok(r && r.note === NOTE, '★E4 暗号の行の台帳の記入が消えた → ' + short(r));
  });

  // ---- E5 開いた暗号の行を名前だけ残す → 開き直す ----
  await go('E5', async S => {
    const H = '2622HYB002', PW = 'pw1234';
    await newProject(S, PJ2); await toLedger(S);
    await S.page.evaluate(async ({ H, PW, X }) => {
      setSessionPassword(PW);
      const env = await encryptHybrid(JSON.parse(__case(H, ['h1'])), PW);
      window.__folders.L = __mk('リスト', { [X + '.json']: __case(X), [H + '.hyb']: JSON.stringify(env) });
    }, { H, PW, X });
    await pressFolder(S, 'L');
    await sleep(800);
    await typeNote(S, H, NOTE); await waitNoteSaved(S, H, NOTE);
    await S.page.evaluate(n => { delete window.__folders.L.__files[n]; }, H + '.hyb');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const memo = await S.page.evaluate(k => { const j = JSON.parse(lsGet('antenna_detached_v1')); return j[k] || null; }, 'm:' + H);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    const v = await look(S), r = await ledgerRow(S, H);
    const row = await S.page.evaluate(no => { const x = _listRows.find(q => (q.data || {}).chosho_mgmt_no === no); return x ? { type: x.fileType, env: !!x.envelope, name: x.data.chosho_cust_name, det: !!x._detached, manual: !!x._manual } : null; }, H);
    console.log('E5', brief({ w, memo, rows: nos(v), r, row }));
    ok(w && w.nos.join() === H, 'E5 試験の前提: 窓に暗号の行が出た → ' + short(w));
    ok(memo && !memo.n && !memo.t && !memo.a, '★E5 端末の控えに暗号の行の氏名・電話・住所が残った → ' + short(memo));
    ok(row && row.type === 'hybrid' && row.env && row.det && row.manual, '★E5 開き直すと暗号の行が中身の行に化けた → ' + short(row));
    ok(r && r.nofile && r.note === NOTE, '★E5 開き直すと台帳の記入が外れた → ' + short(r));
  });


  // ---- E6 別の工事のフォルダを読む（窓のボタンにすることが書いてある。止めると何も変わらない） ----
  await go('E6', async S => {
    const big = [1, 2, 3, 4, 5, 6, 7, 8].map(i => '2622MAB10' + i);
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', big.map(n => [n]));
    await pressFolder(S, 'L');
    await sleep(300);
    // 1件も重ならない → やめる
    await mkFolder(S, 'L9', 'リスト', P.map(n => [n]));
    S.said.length = 0; S.foreignSeen.length = 0;
    const w = await pressFolder(S, 'L9');
    const v = await look(S);
    const ds = await S.page.evaluate(() => ({ list: _listDirHandle === window.__folders.L, proj: _projDirHandle === window.__folders.L }));
    console.log('E6 やめる', brief({ w, rows: nos(v), ds, foreign: S.foreignSeen.map(t => t.slice(0, 90)), status: v.status }));
    ok(!w && nos(v) === big.join(','), '★E6 別のフォルダを読むと物件の行が替わった → ' + nos(v));
    ok(S.foreignSeen.length === 1 && /読み込みをやめる/.test(S.foreignSeen[0]) && /このまま読み込む/.test(S.foreignSeen[0]), '★E6 別の工事のフォルダの窓が出ない → ' + short(S.foreignSeen));
    ok(ds.list && ds.proj, '★E6 止めたのに覚えのフォルダが替わった → ' + short(ds));
    ok(!alerts(S).some(m => /取り込みました/.test(m)), '★E6 止めたのに「取り込みました」と出た → ' + short(alerts(S)));
    ok(/選び直してください/.test(v.status), '★E6 止めたあとの次の操作を言わない → ' + v.status);
    // 1件だけ重なる → やめる
    await mkFolder(S, 'L8', 'リスト', P.concat(big[0]).map(n => [n]));
    S.foreignSeen.length = 0;
    const w2 = await pressFolder(S, 'L8');
    const v2 = await look(S);
    ok(S.foreignSeen.length === 1 && !w2 && nos(v2) === big.join(','), '★E6 1件重なる別のフォルダで物件の行が替わった → ' + short({ w2, rows: nos(v2) }));
    // このまま読み込む → 窓で聞く
    S.foreign = '#lgforeign-go';
    const w3 = await pressFolder(S, 'L9');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S);
    console.log('E6 続ける', brief({ w3, rows: nos(v3) }));
    ok(w3 && w3.nos.length === big.length, '★E6 続けたのに窓で聞かない → ' + short(w3));
    ok(big.every(n => rowOf(v3, n) && rowOf(v3, n).det === 'pending'), '★E6 続けて あとで決める で物件の行が落ちた → ' + nos(v3));
  });
  // ---- E6b 別の工事のフォルダの窓は、重複の整理・空の掃除より先に出る（やめると別の工事のファイルに触らない） ----
  await go('E6b', async S => {
    const mine = [1, 2, 3, 4, 5, 6, 7, 8].map(i => '2622MAB10' + i);
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', mine.map(n => [n]));
    await pressFolder(S, 'L1');
    await sleep(300);
    await mkFolder(S, 'L2', 'リスト', ['2622BBB001', '2622BBB002', '2622BBB003', '2622BBB004', '2622BBB005'].map(n => [n]));
    await S.page.evaluate(() => { const d = window.__folders.L2; d.__files['2622BBB009.json'] = ''; d.__files['2622BBB001 2.json'] = __case('2622BBB001', ['d1']); });
    S.said.length = 0; S.foreignSeen.length = 0;
    await pressFolder(S, 'L2');
    const f = await folderInfo(S, 'L2'), said = S.said.map(s => s.msg.slice(0, 30));
    console.log('E6b', brief({ removed: f.removed, said, foreign: S.foreignSeen.length }));
    ok(S.foreignSeen.length === 1, 'E6b 試験の前提: 別の工事のフォルダの窓が出た');
    ok(!f.removed.length && !f.writes.length, '★E6b 止める前に別の工事のファイルを消した → ' + short(f));
    ok(!S.said.some(s => /同じ管理番号のファイルが|中身が空（0KB）/.test(s.msg)), '★E6b 重複の整理・掃除の窓が先に出た → ' + short(said));
  });
  // ---- E6c やめたあとの 💾 反映は、別の物件のフォルダへ書かない（フォルダを聞く） ----
  await go('E6c', async S => {
    const A = ['2612AAA001','2612AAA002','2612AAA003','2612AAA004','2612AAA005','2612AAA006','2612AAA007', SAME];
    const B = ['2622BBB001','2622BBB002','2622BBB003','2622BBB004','2622BBB005','2622BBB006','2622BBB007', SAME];
    await S.page.evaluate(() => { window.__hs = {}; window.projHandlePut = async (k, v) => { window.__hs[k] = v; };
      window.projHandleGet = async k => window.__hs[k]; window.projHandleDelete = async k => { delete window.__hs[k]; }; });
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', A.map(n => [n]));
    await pressFolder(S, 'L1');
    await sleep(1800);
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', B.map(n => [n]));
    await pressFolder(S, 'L2');
    await sleep(1800);
    await openFromMenu(S, PJ1); await toLedger(S);
    S.foreignSeen.length = 0;
    await pressFolder(S, 'L2');                                  // まちがって その２ のフォルダを選ぶ → やめる
    const h = await S.page.evaluate(() => _listDirHandle === window.__folders.L2 ? 'L2' : String(_listDirHandle));
    await typeNote(S, SAME, NOTE);
    await S.page.evaluate(() => { window.__picked = 0; window.showDirectoryPicker = async () => { window.__picked++; return window.__folders.L1; }; });
    await S.page.click('#lg-writeback');
    await sleep(2500);
    const w = await S.page.evaluate(() => ({ picked: window.__picked, L1: window.__folders.L1.__writes.slice(), L2: window.__folders.L2.__writes.slice() }));
    console.log('E6c', brief({ foreign: S.foreignSeen.length, h, w }));
    ok(S.foreignSeen.length === 1 && h !== 'L2', '★E6c やめたのに別の物件のフォルダを掴んでいる → ' + h);
    ok(w.picked === 1 && !w.L2.length, '★E6c やめたあとの 💾 反映が、別の物件のフォルダへ書いた → ' + short(w));
  });
  // ---- E6d 小さい物件（4行）でも、別の工事のフォルダで聞く／下の階層だけ読んだときは聞かない ----
  await go('E6d', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', ['2622AAA001','2622AAA002','2622AAA003', SAME].map(n => [n]));
    await pressFolder(S, 'L1');
    await sleep(300);
    await mkFolder(S, 'L2', 'リスト', ['2612BBB001','2612BBB002','2612BBB003','2612BBB004','2612BBB005','2612BBB006','2612BBB007','2612BBB008','2612BBB009', SAME].map(n => [n]));
    S.foreignSeen.length = 0;
    await pressFolder(S, 'L2');
    const v = await look(S);
    ok(S.foreignSeen.length === 1 && v.rows.length === 4, '★E6d 小さい物件で別の工事のフォルダを聞かずに入れた → ' + short({ n: S.foreignSeen.length, rows: nos(v) }));
    await mkFolder(S, 'S', '東地区', ['2622AAA001'].map(n => [n]));
    S.foreignSeen.length = 0;
    const w = await pressFolder(S, 'S');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v2 = await look(S);
    console.log('E6d', brief({ foreign: S.foreignSeen.length, w, rows: nos(v2) }));
    ok(!S.foreignSeen.length, '★E6d 下の階層だけ読んだのに「別の工事」と聞いた → ' + short(S.foreignSeen));
    ok(w && w.nos.length === 3 && rowOf(v2, SAME), '★E6d 下の階層を読むと物件のほかの行が聞かれずに落ちた → ' + short({ w, rows: nos(v2) }));
  });
  // ---- E7 📄 で1つ選ぶ ----
  await go('E7', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await sleep(300);
    await S.page.evaluate(no => {
      const f = new File([__case(no, [], { chosho_cust_name: '選んだファイル 様' })], no + '.json', { type: 'application/json' });
      window.__pick = pickFile; pickFile = (o, cb) => cb([f]);
      listSelectFiles();
    }, X);
    for(let i = 0; i < 200 && !alerts(S).some(m => /取り込みました/.test(m)); i++) await sleep(25);
    await sleep(600);
    const v = await look(S);
    console.log('E7', brief({ rows: v.rows.map(r => r.no + ':' + r.name), idb: idbNos(v) }));
    ok(nos(v) === [X, Y, Z].join(','), '★E7 📄 で1つ選ぶと物件のほかの行が消えた → ' + nos(v));
    ok(rowOf(v, X).name === '選んだファイル 様', '★E7 📄 で選んだファイルの行に替わらない → ' + short(rowOf(v, X)));
    ok(idbOf(v, Y) && idbOf(v, Y).thumbs === 2, '★E7 📄 で物件のほかの行の写真が減った → ' + short(idbOf(v, Y)));
  });

  // ---- E8 写真のあるファイル無の行を 🗑 ----
  await go('E8', async S => {
    await ghostOf(S);
    S.dismiss = /のある行を消します/;
    S.said.length = 0;
    const d = await ledgerDelete(S, Y, '#lgdel-list');
    const v = await look(S);
    console.log('E8', brief({ d: { text: d.text.slice(0, 200), list: d.listBtn, file: d.fileBtn }, row: rowOf(v, Y), det: v.det }));
    ok(/写真が 2 枚/.test(d.text) && d.listBtn === '写真ごと消す', '★E8 🗑 の窓が写真の枚数を言わない → ' + short(d));
    ok(rowOf(v, Y), '★E8 確かめの窓でやめたのに行が消えた → ' + nos(v));
    ok(!d.fileBtn, '★E8 ファイル無の行に「ファイルごと消す」が出た → ' + short(d));
  });

  // ---- E9 ファイルが戻ったのに読み直さず 💾 ----
  await go('E9', async S => {
    await ghostOf(S);
    await moveBack(S, 'L', Y);
    const before = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    const note = await S.page.evaluate(async no => {
      const row = _listRows.find(x => x.data.chosho_mgmt_no === no), prev = _editingRow;
      _editingRow = row;
      try { return await writeCurrentCaseToIndividualFile(); } finally { _editingRow = prev; }
    }, Y);
    const after = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    console.log('E9', brief({ note }));
    ok(before === after, '★E9 ファイル無の行で戻ったファイルを書き替えた');
    ok(/戻っています/.test(String(note)), '★E9 知らせが無い → ' + short(note));
  });

  // ---- E10 💾 反映はファイル無の行をつながない ----
  await go('E10', async S => {
    await ghostOf(S);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await moveBack(S, 'L', Y);
    // ファイル無のあいだに、ほかの所で工事が済んだファイルが戻った（行の中身は古い）
    const before = await S.page.evaluate(n => { const d = window.__folders.L; const j = JSON.parse(d.__files[n]);
      Object.assign(j, { chosho_status: 'completed', work_done: true, compdoc_received: true, apt_units: '3', chosho_cust_tel: '0176-99-9999' });
      d.__files[n] = JSON.stringify(j, null, 2); return d.__files[n]; }, Y + '.json');
    await typeNote(S, X, NOTE);
    const w = await pressWriteback(S);
    if(w){ await S.page.click('#lgmiss-later'); await sleep(500); }
    await sleep(1500);
    const after = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    const f = await folderInfo(S, 'L'), v = await look(S);
    console.log('E10', brief({ w, writes: f.writes, rows: nos(v) }));
    ok(before === after && f.writes.indexOf(Y + '.json') < 0, '★E10 💾 反映が戻ったファイルを書き替えた → ' + short(f.writes));
  });

  // ---- E10c E10 と同じ。開き直していない行（物件の行は 💾 反映の絞り込みにも守られるので、E10 では止めの有無が見えない）----
  await go('E10c', async S => {
    await ghostOf(S);
    await moveBack(S, 'L', Y);
    // ファイル無のあいだに、ほかの所で工事が済んだファイルが戻った（行の中身は古い）
    const before = await S.page.evaluate(n => { const d = window.__folders.L; const j = JSON.parse(d.__files[n]);
      Object.assign(j, { chosho_status: 'completed', work_done: true, compdoc_received: true, apt_units: '3', chosho_cust_tel: '0176-99-9999' });
      d.__files[n] = JSON.stringify(j, null, 2); return d.__files[n]; }, Y + '.json');
    await typeNote(S, X, NOTE);
    const w = await pressWriteback(S);
    if(w){ await S.page.click('#lgmiss-later'); await sleep(500); }
    await sleep(1500);
    const after = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    const f = await folderInfo(S, 'L'), v = await look(S);
    console.log('E10c', brief({ w, writes: f.writes, rows: nos(v) }));
    ok(before === after && f.writes.indexOf(Y + '.json') < 0, '★E10c 💾 反映が戻ったファイルを書き替えた → ' + short(f.writes));
  });

  // ---- E11 🧽 ----
  await go('E11', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await S.page.evaluate(() => document.getElementById('btn-list-clear').click());
    await sleep(200);
    const v = await look(S);
    console.log('E11', brief({ rows: nos(v), said: alerts(S).slice(-1) }));
    ok(nos(v) === [X, Y, Z].join(','), '★E11 物件を開いたまま一覧を空にできた → ' + nos(v));
  });

  // ---- E12 全角の番号のファイル ----
  await go('E12', async S => {
    const W = '２６２２ＭＡＢ００９', Wh = '2622MAB009';
    S.dismiss = /同じ管理番号のファイルが/;              // 全角の名前は「重複の整理」の候補に出る。ここでは整理しない
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [W], [Z]]);
    await pressFolder(S, 'L');
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    await moveOut(S, 'L', W);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-keep');
    const v2 = await look(S);
    await moveBack(S, 'L', W);
    const w3 = await pressFolder(S, 'L');
    if(w3) await answerMiss(S, '#lgmiss-later');
    const v3 = await look(S);
    console.log('E12', brief({ w1, rows1: nos(v1), w2, rows2: nos(v2), w3, rows3: nos(v3), det: v3.det }));
    ok(!w1 && rowOf(v1, Wh) && !rowOf(v1, Wh).det, '★E12 全角の番号のファイルがあるのに窓が出た → ' + short({ w1, rows: nos(v1) }));
    ok(w2 && rowOf(v2, Wh) && rowOf(v2, Wh).det === 'kept', '★E12 全角の番号のファイルが無くなっても聞かない → ' + short({ w2, rows: nos(v2) }));
    ok(!w3 && rowOf(v3, Wh) && !rowOf(v3, Wh).det && !v3.det.length, '★E12 全角の番号のファイルが戻っても元に戻らない → ' + short({ w3, rows: nos(v3), det: v3.det }));
    // ファイルの名前を変えても、番号で同じ戸別と分かる（読みたての全角の番号と、物件の半角の番号を、そろえて比べる）
    await S.page.evaluate(({ a, b }) => { const d = window.__folders.L; d.__files[b] = d.__files[a]; delete d.__files[a]; }, { a: W + '.json', b: '名前を変えた.json' });
    const w4 = await pressFolder(S, 'L');
    if(w4) await answerMiss(S, '#lgmiss-later');
    const v4 = await look(S);
    console.log('E12 名前', brief({ w4, rows4: nos(v4) }));
    ok(!w4 && rowOf(v4, Wh) && !rowOf(v4, Wh).det, '★E12 全角の番号のファイルの名前を変えたら「見当たりません」と出た → ' + short({ w4, rows: nos(v4) }));
  });

  // ---- E13 消した行の記入（時刻の控えがあっても消える）・同じ番号の行が残るときは消さない ----
  await go('E13', async S => {
    await ghostOf(S, [[X], [Y], [Z]]);
    const a = await S.page.evaluate(no => {
      const k = 'm:' + no;
      setLedger(k, { time: '10:00', timeSrc: '10:00', anytime: true, note: 'メモ' });
      _contractorMap[k] = '試験会社'; saveContractorMap();
      return !!_ledgerMap[k];
    }, Y);
    await ledgerDelete(S, Y, '#lgdel-list');
    const b = await S.page.evaluate(no => { const k = 'm:' + no; return { lg: !!_ledgerMap[k], ct: !!_contractorMap[k], log: JSON.stringify(_lgNoteLog).indexOf('メモ') >= 0 }; }, Y);
    console.log('E13', brief({ a, b }));
    ok(a && !b.lg && !b.ct, '★E13 🗑 で台帳の記入が残った（消す印も打ち消された） → ' + short(b));
    ok(b.log, '★E13 消した備考が「↩ 備考の履歴」に残らない → ' + short(b));
    // 同じ番号の行が残るとき
    const c = await S.page.evaluate(no => {
      const k = 'm:' + no;
      setLedger(k, { note: '残す行のメモ' });
      const man = createManualRow({ chosho_mgmt_no: no, chosho_cust_name: '手で足した行' }, 'manual');
      return !!man;
    }, X);
    await S.page.evaluate(() => renderListTable());
    await sleep(200);
    await ledgerDelete(S, X, '#lgdel-list');
    const d = await S.page.evaluate(no => { const k = 'm:' + no; return { note: (_ledgerMap[k] || {}).note, marked: _deletedAnnoKeys.has(k) }; }, X);
    console.log('E13 同じ番号', brief({ c, d }));
    ok(d.note === '残す行のメモ' && !d.marked, '★E13 同じ番号の行が残るのに台帳の記入が消えた → ' + short(d));
  });

  // ---- E14 ファイル無の行で付けた「完了」は、ファイルが戻っても外れない ----
  await go('E14', async S => {
    await ghostOf(S, [[X], [Y], [Z]]);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_status: 'completed' });
    }, Y);
    await moveBack(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { s: r.data.chosho_status, e: !!r._lgEdited, det: !!r._detached }; }, Y);
    console.log('E14', brief({ w, st }));
    ok(st.s === 'completed' && st.e && !st.det, '★E14 ファイルが戻ると完了が外れた → ' + short(st));
  });

  // ---- E15 物件なし：開き直して、行の無い戸別を「あとで決める」→ 行を作らず、次にまた聞く ----
  await go('E15', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await sleep(300);
    await startPage(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    await toLedger(S);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-keep');
    const v2 = await look(S);
    console.log('E15', brief({ w1, rows1: nos(v1), status: v1.status, w2, rows2: nos(v2), det: v2.det }));
    ok(w1 && w1.nos.join() === Y, '★E15 物件なしで見当たらないファイルを聞かない → ' + short(w1));
    ok(!rowOf(v1, Y), '★E15 あとで決める で中身の無い行を作った → ' + nos(v1));
    ok(w2 && w2.nos.join() === Y && rowOf(v2, Y) && rowOf(v2, Y).det === 'kept', '★E15 あとで決める のあと、次に聞かない／残すで行ができない → ' + short({ w2, rows: nos(v2) }));
  });

  // ---- E16 物件なし：古い形の前回の控えは使わない（どのフォルダのものか分からない）。次から新しい形で働く ----
  await go('E16', async S => {
    await toLedger(S);
    await S.page.evaluate(({ X, Y, Z }) => {
      const e = no => ({ no, n: no + ' 様', a: '', t: '', dt: '', s: 'in_progress', wt: '', note: '', p: no + '.json' });
      lsSet('antenna_list_census_v1', JSON.stringify({ v: 1, root: 'リスト', at: 1, entries: { ['m:' + X]: e(X), ['m:' + Y]: e(Y), ['m:' + Z]: e(Z) } }));
    }, { X, Y, Z });
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    const w1 = await pressFolder(S, 'L');
    if(w1) await answerMiss(S, '#lgmiss-later');
    const v1 = await look(S);
    await moveOut(S, 'L', Z);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    console.log('E16', brief({ w1, rows: nos(v1), census: v1.census, w2 }));
    ok(!w1 && !rowOf(v1, Y), '★E16 古い形の控えの番号を聞いた／行を作った → ' + short({ w1, rows: nos(v1) }));
    ok(v1.census && v1.census.keys.indexOf('m:' + Y) < 0, '★E16 古い形の控えの番号が残った → ' + short(v1.census));
    ok(w2 && w2.nos.join() === Z, '★E16 新しい形の控えで、見当たらないファイルを聞かない → ' + short(w2));
  });

  // ---- E17 別の物件へ替えたら、前の物件の 📁 のフォルダを持ち越さない（同じ物件の開き直しは持ち越す） ----
  await go('E17', async S => {
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.map(n => [n]));
    await pressFolder(S, 'L1');
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', Q.map(n => [n]));
    await pressFolder(S, 'L2');
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []);
    await openShared(S, 'D', SHARED);
    const same = await S.page.evaluate(() => _listDirHandle === window.__folders.L2);
    await openFromMenu(S, PJ1);
    const other = await S.page.evaluate(() => _listDirHandle);
    let root = null;
    await S.page.evaluate(() => { window.__picked = 0; window.showDirectoryPicker = async () => { window.__picked++; const e = new Error('閉じた'); e.name = 'AbortError'; throw e; }; });
    await S.page.evaluate(() => lgwbEnsureRoot().then(r => { window.__root = r; }));
    root = await S.page.evaluate(() => ({ picked: window.__picked, root: window.__root }));
    const gone = await S.page.evaluate(() => { _listDirHandle = window.__folders.L2; detachProject(); return !_listDirHandle; });
    console.log('E17', brief({ same, other: !!other, root, gone }));
    ok(gone, '★E17 物件を切り離しても 📁 のフォルダが残っている');
    ok(same, '★E17 同じ物件を開き直したのに 📁 のフォルダが外れた');
    ok(!other, '★E17 別の物件へ替えても、前の物件の 📁 のフォルダが残っている');
    ok(root.picked === 1 && !root.root, '★E17 💾 反映が、この物件で読んでいないフォルダを黙って使った → ' + short(root));
  });


  // ---- E18 同じ番号のファイル無の行が2つ、どちらも行にだけ写真。ファイルが1つ戻る → 写真が減らない・枚数の知らせが本当 ----
  await go('E18', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1']], [Z]]);
    await S.page.evaluate(n => { window.__folders.L.__files[n + ' 2.json'] = JSON.stringify(Object.assign(JSON.parse(__case(n, [])), { chosho_photos: [__ph('y2', '#2a7')] })); }, Y);
    S.dismiss = /同じ管理番号のファイルが/;
    await pressFolder(S, 'L');
    await S.page.evaluate(n => { const d = window.__folders.L; delete d.__files[n + '.json']; delete d.__files[n + ' 2.json']; }, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const n0 = await S.page.evaluate(no => _listRows.filter(r => r.data.chosho_mgmt_no === no).length, Y);
    await S.page.evaluate(n => { window.__folders.L.__files[n + '.json'] = JSON.stringify(Object.assign(JSON.parse(__case(n, [])), { chosho_photos: [__ph('z9', '#71b')] })); }, Y);
    await pressFolder(S, 'L');
    await sleep(2500);
    const v = await look(S);
    const ph = await S.page.evaluate(async no => { const p = await projIdbGet(_currentProject.id);
      return { rows: _listRows.filter(r => r.data.chosho_mgmt_no === no).map(r => ({ ph: (r.data.chosho_photos || []).filter(q => q && q.dataUri).map(q => q.id).sort().join(), th: (r._thumbs || []).map(q => q.id).sort().join() })),
               idb: p.cases.filter(c => c.payload.chosho_mgmt_no === no).map(c => (c.payload.chosho_photos || []).map(q => q.id).sort().join()) }; }, Y);
    console.log('E18', brief({ n0, ph, status: v.status }));
    ok(n0 === 2, 'E18 試験の前提: 同じ番号の行がどちらも残った');
    ok(ph.rows.length === 1 && ph.rows[0].ph === 'y1,y2', '★E18 同じファイルへ引き継ぐと、先の行の写真が消えた → ' + short(ph));
    ok(ph.idb.length === 1 && ph.idb[0] === 'y1,y2,z9', '★E18 物件の写真が減った → ' + short(ph));
    ok(/写真 2 枚を引き継ぎました/.test(v.status), '★E18 引き継いだ枚数の知らせが違う → ' + v.status);
  });

  // ---- E19 番号の無い行で、別の階層に同じ名前のファイルがあっても「ある」と見ない ----
  await go('E19', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    await pressFolder(S, 'L');
    const r = await S.page.evaluate(async () => {
      const a = buildListRow('リスト/棟A/101.json', Date.now(), { chosho_cust_name: '棟Aの方', chosho_status: 'in_progress', work_type: 'uhf_new', chosho_photos: [__ph('a1', '#111')] });
      a._fromProject = true; a._thumbs = [__ph('a1', '#111')]; _listRows.push(a);
      const newRows = _listRows.filter(x => x !== a).map(x => buildListRow(x.file, Date.now(), Object.assign({}, x.data), null));
      newRows.push(buildListRow('棟B/101.json', Date.now(), { chosho_cust_name: '棟Bの方', chosho_status: 'in_progress', work_type: 'uhf_new' }));
      const st = { files: newRows.length, dirs: 2, skipped: 0, errDirs: [], skippedPaths: [] };
      window.__p = mergeRowsWithManual(newRows, { source: 'folder', stats: st, root: 'リスト', expectedGone: [], pid: missPid(), sameDir: true });
      return 'started';
    });
    let win = null;
    for(let i = 0; i < 60; i++){ const m = await missWindow(S); if(m){ win = m; await S.page.click('#lgmiss-later'); break; } await sleep(50); }
    const out = await S.page.evaluate(async () => (await window.__p).map(x => (x.data.chosho_cust_name || x.data.chosho_mgmt_no) + (x._detached ? '(' + x._detached.reason + ')' : '')));
    console.log('E19', brief({ r, win, out }));
    ok(win, '★E19 別の階層の同じ名前のファイルを「ある」と見て聞かなかった');
    ok(out.indexOf('棟Aの方(pending)') >= 0, '★E19 物件の行が聞かれずに落ちた → ' + short(out));
  });

  // ---- E20 窓が開いているあいだにほかの端末の 🗑 が取り込まれた：「名前だけ残す」で中身の無い行を物件へ入れない ----
  await go('E20', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    await S.page.evaluate(no => { _listRows = _listRows.filter(r => r.data.chosho_mgmt_no !== no); }, Y);
    if(w) await answerMiss(S, '#lgmiss-keep');
    await sleep(2000);
    const v = await look(S);
    console.log('E20', brief({ w: w && w.nos, rows: nos(v), idb: idbNos(v) }));
    ok(w && !rowOf(v, Y) && !idbOf(v, Y), '★E20 窓のあいだに消えた戸別の、中身の無い行が物件へ入った → ' + short({ rows: nos(v), idb: idbNos(v) }));
  });

  // ---- E21 開き直したあと、ほかの端末の保存と重なっても、台帳で直した備考が古い値へ戻らない／消した備考が戻らない ----
  for(const lb of ['E21', 'E21b']){
    await go(lb, async S => {
      const put = lb === 'E21' ? '備考その2' : '';
      await newProject(S, PJ2); await toLedger(S);
      await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
      await pressFolder(S, 'L');
      await typeNote(S, Y, '備考その1'); await waitNoteSaved(S, Y, '備考その1');
      await sleep(600);
      await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
      await sleep(2200);
      await S.page.evaluate(({ file, x }) => { const d = window.__folders.D; const p = JSON.parse(d.__files[file]);
        p.updatedAt = new Date(Date.now() + 120000).toISOString(); p.ledger = p.ledger || {}; p.ledger['m:' + x] = { note: 'ほかの端末' };
        d.__files[file] = JSON.stringify(p); }, { file: SHARED, x: X });
      await typeNote(S, Y, put);
      await sleep(4500);
      await S.page.evaluate(() => { projTouch(); });              // 次の保存（ほかの欄を直した等）
      await sleep(3500);
      const r = await ledgerRow(S, Y);
      const sh = await S.page.evaluate(({ file, y }) => { const p = JSON.parse(window.__folders.D.__files[file]); return { lg: ((p.ledger || {})['m:' + y] || {}).note, x: ((p.ledger || {})['m:2622MAB001'] || {}).note }; }, { file: SHARED, y: Y });
      // 別の端末で共有ファイルを開いても同じ
      await openShared(S, 'D', SHARED); await toLedger(S);
      await sleep(600);
      const r2 = await ledgerRow(S, Y);
      console.log(lb, brief({ r, sh, r2 }));
      ok(r && r.note === put, '★' + lb + ' 融合のあと、台帳の備考が古い値へ戻った → ' + short(r));
      ok(String(sh.lg || '') === put && sh.x === 'ほかの端末', '★' + lb + ' 共有ファイルの備考が違う → ' + short(sh));
      ok(r2 && r2.note === put, '★' + lb + ' 開き直すと備考が戻った → ' + short(r2));
    });
  }

  // ---- E22 掃除で自分が消したファイルの物件の行：窓なしで行のまま残る・次に読むと聞く ----
  await go('E22', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = ''; }, Y + '.json');
    const before = S.scan;
    await S.page.click('#btn-list-select-folder');
    for(let i = 0; i < 400; i++){ const j = await S.page.evaluate(() => !!document.getElementById('junk-modal')); if(j){ await S.page.click('#junk-ok'); break; } await sleep(30); }
    const w = await waitFolder(S, before);
    if(w) await answerMiss(S, '#lgmiss-later');
    await sleep(2000);
    const v = await look(S), r = await ledgerRow(S, Y);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    console.log('E22', brief({ w, row: rowOf(v, Y), idb: idbOf(v, Y), r, status: v.status, w2 }));
    ok(!w && rowOf(v, Y) && !rowOf(v, Y).det, '★E22 掃除で消したファイルの行が落ちた／窓が出た → ' + short({ w, rows: nos(v) }));
    ok(idbOf(v, Y) && idbOf(v, Y).thumbs === 2 && r && r.note === NOTE, '★E22 物件の縮小版か備考が減った → ' + short({ i: idbOf(v, Y), r }));
    ok(/いま消したファイルの戸別 1 件/.test(v.status), '★E22 残した知らせが無い → ' + v.status);
    ok(w2 && w2.nos.join() === Y, '★E22 次に読むと聞かない → ' + short(w2));
  });

  // ---- E23 同じ番号の行が2つで、どちらのファイルも無い：窓で残すと2行とも残る ----
  await go('E23', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1']], [Z]]);
    await S.page.evaluate(n => { window.__folders.L.__files[n + ' 2.json'] = __case(n, ['y2']); }, Y);
    S.dismiss = /同じ管理番号のファイルが/;
    await pressFolder(S, 'L');
    await S.page.evaluate(n => { const d = window.__folders.L; delete d.__files[n + '.json']; delete d.__files[n + ' 2.json']; }, Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    await sleep(2000);
    const v = await look(S);
    const n = v.rows.filter(r => r.no === Y && r.det === 'kept').length, ni = (v.idb || []).filter(r => r.no === Y && r.thumbs === 1).length;
    console.log('E23', brief({ w, n, ni, rows: nos(v) }));
    ok(n === 2 && ni === 2, '★E23 同じ番号の行の片方が黙って落ちた → ' + short({ n, ni, rows: nos(v) }));
  });

  // ---- E24 ファイルが戻ったのが暗号のファイル：行にだけある写真を確かめられないので、行を外さない・知らせが次の操作を言う ----
  await go('E24', async S => {
    const hyb = no => JSON.stringify({ format: 'hybrid', encrypted_fields: { chosho_cust_name: { ct: 'x', iv: 'y' } },
      meta: { sensitive_fields: ['chosho_cust_name', 'chosho_cust_tel', 'chosho_cust_addr', 'chosho_photos'] },
      plain: { chosho_mgmt_no: no, chosho_status: 'in_progress', work_type: 'uhf_new', chosho_date: '2026-10-01' } });
    await ghostOf(S);
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(({ n, t }) => { window.__folders.L.__files[n] = t; }, { n: Y + '.antenna.hyb', t: hyb(Y) });
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    await sleep(2200);
    const v = await look(S);
    console.log('E24', brief({ w, row: rowOf(v, Y), idb: idbOf(v, Y), status: v.status }));
    ok(rowOf(v, Y) && rowOf(v, Y).det === 'kept' && v.rows.filter(r => r.no === Y).length === 1, '★E24 暗号のファイルが戻ると行が外れた／2行になった → ' + nos(v));
    ok(idbOf(v, Y) && idbOf(v, Y).thumbs === 2, '★E24 物件の写真が減った → ' + short(idbOf(v, Y)));
    ok(/確かめられないので元に戻していません/.test(v.status) && /🗑/.test(v.status), '★E24 知らせが無い → ' + v.status);
  });

  // ---- E25 ファイル無の行（古い名前 .antenna.json のファイルが戻った）を開いて 💾：本物に書かない・消さない ----
  await go('E25', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    await pressFolder(S, 'L');
    await S.page.evaluate(no => { detachedRowFromEntry('m:' + no, { no, n: no + ' 様', p: no + '.antenna.json', root: 'リスト' }); renderListTable(); }, Y);
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(no => { window.__folders.L.__files[no + '.antenna.json'] = __case(no, ['r1'], { chosho_status: 'completed', work_done: true }); }, Y);
    await S.page.evaluate(() => { window.showDirectoryPicker = async () => window.__folders.L; });
    S.said.length = 0;
    await S.page.evaluate(async no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); await openCaseInEditor(r, false); await overwriteSaveCurrentToProject(); }, Y);
    await sleep(600);
    const fi = await folderInfo(S, 'L');
    const j = await S.page.evaluate(n => { const t = window.__folders.L.__files[n]; if(t === undefined) return null; const o = JSON.parse(t); return { s: o.chosho_status, w: !!o.work_done }; }, Y + '.antenna.json');
    console.log('E25', brief({ removed: fi.removed, writes: fi.writes, j, a: alerts(S).map(m => m.slice(0, 80)) }));
    ok(j && j.s === 'completed' && j.w && !fi.removed.length, '★E25 ファイル無の行の 💾 で、古い名前の本物を書き替えた／消した → ' + short({ j, fi }));
    ok(alerts(S).some(m => /戸別ファイルは書き替えていません/.test(m)), '★E25 書かなかった知らせが無い → ' + short(alerts(S)));
  });

  // ---- E26 引き継いだ行の読み直しの確かめは、📥 の話にしない・この行にしか無いと言う ----
  await go('E26', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r._thumbs = (r._thumbs || []).concat([__ph('y3', '#123')]); r._photoCount = r._thumbs.length; projTouch(); }, Y);
    await sleep(1800);
    await moveBack(S, 'L', Y);
    await pressFolder(S, 'L');
    await sleep(1800);
    S.said.length = 0;
    S.dismiss = null;
    await pressFolder(S, 'L');
    const asked = confirms(S).filter(m => /まだ戸別ファイルへ入っていません/.test(m));
    console.log('E26', brief({ asked: asked.map(m => m.slice(0, 200)) }));
    ok(asked.length === 1 && /ファイルが戻った戸別/.test(asked[0]) && /この行にしかありません/.test(asked[0]), '★E26 確かめの文が本当でない → ' + short(asked));
    ok(!asked.some(m => /📥 現場取込で入れた/.test(m)), '★E26 📥 を使っていない行に「📥 現場取込で入れた」と出た → ' + short(asked));
  });

  // ---- E27 読んでいる間に物件が替わった：一覧を作り直さない・工事フォルダの覚えを替えない ----
  await go('E27', async S => {
    await newProject(S, PJ1); await toLedger(S);
    await mkFolder(S, 'L1', 'リスト', P.map(n => [n]));
    await pressFolder(S, 'L1');
    await sleep(1800);
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L2', 'リスト', Q.map(n => [n]));
    await pressFolder(S, 'L2');
    await sleep(1800);
    const v0 = await look(S);
    const r = await S.page.evaluate(async () => {
      const stale = await listMissingFlow([], { source: 'folder', stats: { files: 1 }, root: 'リスト', pid: 'ほかの物件', sameDir: true });
      return { keepAll: stale.keepAll, warn: stale.warn };
    });
    console.log('E27', brief({ r, rows: nos(v0) }));
    ok(r.keepAll && /物件が替わった/.test(r.warn), '★E27 読んでいる間に物件が替わっても止めない → ' + short(r));
  });

  // ---- E28 物件なしで空のフォルダを読んでも一覧を空にしない ----
  await go('E28', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await mkFolder(S, 'E', '空', []);
    await pressFolder(S, 'E');
    const v = await look(S);
    console.log('E28', brief({ rows: nos(v), status: v.status }));
    ok(nos(v) === [X, Y, Z].join(','), '★E28 物件なしで空のフォルダを読むと一覧が空になった → ' + nos(v));
    ok(/読み取れませんでした/.test(v.status), '★E28 読めなかった知らせが無い → ' + v.status);
  });

  // ---- E29 物件を開いて空のフォルダを読む：行も工事フォルダの覚えも替わらず「取り込みました」と言わない ----
  await go('E29', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await sleep(300);
    await mkFolder(S, 'E', 'リスト', []);
    S.said.length = 0;
    await pressFolder(S, 'E');
    const v = await look(S);
    const ds = await S.page.evaluate(() => ({ proj: _projDirHandle === window.__folders.L, list: _listDirHandle === window.__folders.E }));
    console.log('E29', brief({ rows: nos(v), ds, a: alerts(S).map(m => m.slice(0, 40)), status: v.status }));
    ok(nos(v) === [X, Y, Z].join(','), '★E29 空のフォルダで物件の行が替わった → ' + nos(v));
    ok(ds.proj && !ds.list, '★E29 読めなかったフォルダを覚えた → ' + short(ds));
    ok(!alerts(S).some(m => /取り込みました/.test(m)), '★E29 読めなかったのに「取り込みました」と出た → ' + short(alerts(S)));
  });

  // ---- E30 🗑 の窓：ふつうの行は写真の枚数を言う・同じファイルの行に「ファイルごと消す」を出さない ----
  await go('E30', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await trOf(S, Y).locator('[data-open="del"]').click();
    await S.page.waitForSelector('#lgdel-modal', { state: 'visible' });
    const t = await S.page.evaluate(() => ({ text: document.querySelector('#lgdel-modal .modal').innerText, file: !!document.getElementById('lgdel-file') }));
    await S.page.click('#lgdel-cancel');
    await S.page.waitForFunction(() => !document.getElementById('lgdel-modal'));
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      const c = createManualRow({ chosho_mgmt_no: no, chosho_cust_name: '手で足した行' }, 'manual');
      c._dir = r._dir; c._name = r._name; c._dirPath = r._dirPath; c.fileHandle = r.fileHandle; renderListTable(); }, Y);
    await sleep(200);
    const tr = S.page.locator('tr[data-uid]', { hasText: '手で足した行' }).first();
    await tr.locator('[data-open="del"]').click();
    await S.page.waitForSelector('#lgdel-modal', { state: 'visible' });
    const t2 = await S.page.evaluate(() => ({ text: document.querySelector('#lgdel-modal .modal').innerText, file: !!document.getElementById('lgdel-file') }));
    await S.page.click('#lgdel-cancel');
    console.log('E30', brief({ t: t.text.slice(0, 260), t2: t2.text.slice(0, 200), f2: t2.file }));
    ok(t.file && /写真が 2 枚/.test(t.text), '★E30 ファイルごと消す窓が写真の枚数を言わない → ' + short(t));
    ok(!t2.file && /ほかの行も使っています/.test(t2.text), '★E30 同じファイルの行に「ファイルごと消す」が出た → ' + short(t2));
  });

  // ---- E31 共有ファイルにつながっていないときのファイル無の行の 🗑 は、つないでからと言う ----
  await go('E31', async S => {
    await ghostOf(S);
    await S.page.evaluate(() => { _projPendingHandle = { name: '仮' }; _projFileHandle = null; });
    const d = await ledgerDelete(S, Y, '#lgdel-list');
    console.log('E31', brief({ text: d.text.slice(0, 300) }));
    ok(/共有ファイルにつながっていません/.test(d.text), '★E31 つながっていないと言わない → ' + short(d.text));
  });

  // ---- E32 ファイル無の行のカレンダーの「行ごと削除」も、端末の控えを外す ----
  await go('E32', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const a = await S.page.evaluate(no => { const row = _listRows.find(x => x.data.chosho_mgmt_no === no); aptMgRemoveRow(row); return !!_detachedMap['m:' + no]; }, Y);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const v = await look(S);
    console.log('E32', brief({ a, w2, rows: nos(v) }));
    ok(!a && !w2 && !rowOf(v, Y), '★E32 行を外しても控えが残り、次の 📁 で戻った → ' + short({ a, w2, rows: nos(v) }));
  });

  // ---- E33 ファイルが戻っているときの 💾 反映の知らせ（つながる行があっても言う） ----
  await go('E33', async S => {
    await ghostOf(S);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await moveBack(S, 'L', Y);
    await typeNote(S, X, NOTE);
    await S.page.evaluate(() => { window.showDirectoryPicker = async () => window.__folders.L; });
    S.said.length = 0;
    await pressWriteback(S).catch(() => null);
    const a = alerts(S).filter(m => /同じ番号のファイルが戻っています/.test(m));
    console.log('E33', brief({ a: a.map(m => m.slice(0, 120)) }));
    ok(a.length >= 1, '★E33 つながる行があると、戻っているファイルのことを言わない → ' + short(alerts(S).map(m => m.slice(0, 50))));
  });

  // ---- E34 閲覧用：ファイル無の行と同じ番号を読んでも端末の控えを書かない ----
  await go('E34', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    const r = await S.page.evaluate(async no => {
      window.__VIEWER_MODE__ = true;
      const row = buildListRow(no + '.json', Date.now(), JSON.parse(__case(no, [])));
      const p = mergeRowsWithManual([row], { source: 'folder', stats: { files: 1 }, root: 'リスト' });
      return { det: Object.keys(JSON.parse(lsGet('antenna_detached_v1')) || {}), started: !!p };
    }, Y);
    await sleep(300);
    const open = await S.page.evaluate(() => { const m = document.getElementById('ledger-merge-modal'); return !!(m && m.classList.contains('open')); });
    if(open) await S.page.click('#lg-merge-skip');
    const det = await S.page.evaluate(() => Object.keys(JSON.parse(lsGet('antenna_detached_v1')) || {}));
    console.log('E34', brief({ r, open, det }));
    ok(det.indexOf('m:' + Y) >= 0, '★E34 閲覧用で端末の控えを書き替えた → ' + short(det));
  });

  // ---- E35 見当たらない窓：物件の話になっている・写真の列・同期待ちの文・「消す」の確かめが写真を言う ----
  await go('E35', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    const t = await S.page.evaluate(() => document.getElementById('lgmiss-body').innerText);
    await S.page.check('#lgmiss-ov input[name="lgmiss0"][value="drop"]');
    S.said.length = 0; S.dismiss = /件を受付台帳からも消します/;
    await S.page.click('#lgmiss-drop');
    await sleep(200);
    const c = confirms(S);
    await answerMiss(S, '#lgmiss-later');
    console.log('E35', brief({ t: t.slice(0, 240), c: c.map(m => m.slice(0, 160)) }));
    ok(w && t.indexOf(PJ2) >= 0 && /このフォルダに見当たりません/.test(t), '★E35 窓が物件の話になっていない → ' + t.slice(0, 120));
    ok(/同期が終わっていない/.test(t) && /2 枚/.test(t) && /🗑/.test(t), '★E35 窓に同期待ち・写真の枚数・🗑 の文が無い → ' + t.slice(0, 300));
    ok(c.some(m => /写真が入っています/.test(m)), '★E35 「消す」の確かめが写真を言わない → ' + short(c));
  });

  // ---- E36 物件を替えたあと、読み直しの途中で _listDirHandle が外れても止まらない ----
  await go('E36', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await sleep(300);
    const r = await S.page.evaluate(async () => {
      const dh = _listDirHandle, orig = dh.entries;
      dh.entries = function(){ _listDirHandle = null; dh.entries = orig; return orig.call(dh); };   // 読み始めたところで外れる
      try { const ok = await listReloadFolder(); return { ok }; } catch(e){ return { err: String(e && e.message) }; }
    });
    console.log('E36', brief(r));
    ok(!r.err, '★E36 読んでいる途中で物件を替えると止まった → ' + short(r));
  });

  // ---- E3b 物件の道のりが工事フォルダから（リスト/…）のとき：読めないファイル・番号の無い行も末尾で比べる ----
  await go('E3b', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1', 'y2']], [Z]]);
    await pressFolder(S, 'L');
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(() => { _listRows.forEach(r => { r.file = 'リスト/' + r.file; }); });
    await S.page.evaluate(n => { window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S);
    console.log('E3b', brief({ w, rows: nos(v), status: v.status.slice(0, 80) }));
    ok(!w && rowOf(v, Y) && !rowOf(v, Y).det, '★E3b 物件の道のりが違うと、読めないだけのファイルで窓が出た → ' + short({ w, rows: nos(v) }));
  });

  // ---- E10b 開き直す前のファイル無の行（前の _dir・_name を持ったまま）：💾 反映で本物を書かない ----
  await go('E10b', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); r.data = Object.assign({}, r.data, { chosho_cust_name: '', chosho_status: 'in_progress' }); }, Y);
    await moveBack(S, 'L', Y);
    const before = await S.page.evaluate(n => { const d = window.__folders.L; const j = JSON.parse(d.__files[n]);
      Object.assign(j, { chosho_status: 'completed', work_done: true }); d.__files[n] = JSON.stringify(j, null, 2); return d.__files[n]; }, Y + '.json');
    await typeNote(S, X, NOTE);
    await pressWriteback(S).catch(() => null);
    await sleep(800);
    const after = await S.page.evaluate(n => window.__folders.L.__files[n], Y + '.json');
    const f = await folderInfo(S, 'L');
    console.log('E10b', brief({ writes: f.writes }));
    ok(before === after && f.writes.indexOf(Y + '.json') < 0, '★E10b 💾 反映が、前のつなぎを持ったファイル無の行で本物を書き替えた → ' + short(f.writes));
  });

  // ---- E37 控えから起きたファイル無の行（備考が空）で、中身のある台帳の備考を消さない ----
  await go('E37', async S => {
    await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, [], { chosho_note: NOTE }], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    await S.page.evaluate(k => { const j = JSON.parse(lsGet('antenna_detached_v1')); j[k].note = ''; lsSet('antenna_detached_v1', JSON.stringify(j)); _detachedMap = j; }, 'm:' + Y);
    await sleep(300);
    await startPage(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Z]]);
    await toLedger(S);
    const w2 = await pressFolder(S, 'L');
    if(w2) await answerMiss(S, '#lgmiss-later');
    const r = await ledgerRow(S, Y), lg = await S.page.evaluate(k => (_ledgerMap[k] || {}).note, 'm:' + Y);
    console.log('E37', brief({ w2, r, lg }));
    ok(r && r.nofile && lg === NOTE, '★E37 控えから起きた行で台帳の備考が消えた → ' + short({ r, lg }));
  });

  // ---- E38 窓の「消す」のあとにほかの端末の保存と重なっても、行が戻らない ----
  await go('E38', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await sleep(600);
    await moveOut(S, 'L', Y);
    await S.page.evaluate(file => { const d = window.__folders.D; const p = JSON.parse(d.__files[file]);
      p.updatedAt = new Date(Date.now() + 120000).toISOString(); d.__files[file] = JSON.stringify(p); }, SHARED);
    const w = await pressFolder(S, 'L');
    if(w){ await S.page.check('#lgmiss-ov input[name="lgmiss0"][value="drop"]'); await answerMiss(S, '#lgmiss-drop'); }
    await sleep(3000);
    const v = await look(S), sp = await sharedCases(S, 'D', SHARED);
    console.log('E38', brief({ w, rows: nos(v), shared: spNos(sp) }));
    ok(w && !rowOf(v, Y), '★E38 窓の「消す」のあと、融合で行が戻った → ' + nos(v));
    ok(!sp.some(c => c.no === Y), '★E38 窓の「消す」のあと、物件ファイルに行が残った → ' + spNos(sp));
  });

  // ---- E39 ファイル無の行へ世帯の写真をまとめた（ファイルを引き取った）ら、端末の控えも外す ----
  await go('E39', async S => {
    await ghostOf(S, [[X], [Y], [Z, ['z1']]]);
    const r = await S.page.evaluate(async ({ y, z }) => {
      const t = _listRows.find(x => x.data.chosho_mgmt_no === y), st = _listRows.find(x => x.data.chosho_mgmt_no === z);
      const before = !!_detachedMap['m:' + y];
      await aptMgMovePhotos(t, st);
      return { before, after: !!_detachedMap['m:' + y], det: !!t._detached };
    }, { y: Y, z: Z });
    console.log('E39', brief(r));
    ok(r.before && !r.det && !r.after, '★E39 ファイルを引き取ったのに端末の控えが残った → ' + short(r));
  });

  // ---- E40 ファイル無の行を開いて閉じても、台帳で打っただけの備考を「ファイルの内容」にしない ----
  await go('E40', async S => {
    await ghostOf(S, [[X], [Y], [Z]]);
    await typeNote(S, Y, NOTE);
    await waitNoteSaved(S, Y, NOTE);
    await sleep(600);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);   // 開き直した行（ファイルが無くても開ける）
    const dbg = await S.page.evaluate(async no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); await openCaseInEditor(r, false);
      const o = { same: _editingRow === r, inList: _listRows.indexOf(_editingRow) >= 0, ro: rtIsCaseReadOnly(), dirty: !!_editorDirty, el: (document.getElementById('chosho_note') || {}).value };
      syncEditorToRowData(true); return o; }, Y);
    const lg = await S.page.evaluate(k => { const l = _ledgerMap[k] || {}; return { note: l.note, src: l.noteSrc, row: l.noteRowSrc }; }, 'm:' + Y);
    console.log('E40 前', brief({ dbg, lg }));
    await toLedger(S);
    await moveBack(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const r = await ledgerRow(S, Y);
    console.log('E40', brief({ lg, w, r }));
    ok(dbg.same && dbg.inList, 'E40 試験の前提: ファイル無の行を開けた → ' + short(dbg));
    ok(r && r.note === NOTE, '★E40 ファイル無の行を開いて閉じると、ファイルが戻ったとき備考が消えた → ' + short({ lg, r }));
  });

  // ---- E41 ファイルが戻った行は、ほかの端末の保存と重なっても、ファイル無の行のまま戻らない・2行にならない ----
  await go('E41', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1']], [Z]]);
    await pressFolder(S, 'L');
    await moveOut(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-keep');
    await sleep(1800);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await sleep(600);
    await moveBack(S, 'L', Y);
    await S.page.evaluate(file => { const d = window.__folders.D; const p = JSON.parse(d.__files[file]);
      p.updatedAt = new Date(Date.now() + 120000).toISOString(); d.__files[file] = JSON.stringify(p); }, SHARED);
    await pressFolder(S, 'L');
    await sleep(3000);
    const v = await look(S), sp = await sharedCases(S, 'D', SHARED);
    console.log('E41', brief({ rows: nos(v), shared: spNos(sp) }));
    ok(sp.filter(c => c.no === Y).length === 1 && !sp.find(c => c.no === Y).det, '★E41 ファイルが戻ったのに、融合でファイル無の行のまま残った／2行になった → ' + spNos(sp));
    ok(rowOf(v, Y) && !rowOf(v, Y).det, '★E41 融合のあと一覧でファイル無の行に戻った → ' + nos(v));
  });

  // ---- E42 読み始めと物件が違うときは、別の工事の窓を出さない（このあとの突き合わせで止める） ----
  await go('E42', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await sleep(300);
    const r = await S.page.evaluate(async () => {
      const row = buildListRow('2612ZZZ001.json', Date.now(), JSON.parse(__case('2612ZZZ001', [])));
      const p = listForeignStop([row], { skippedPaths: [] }, 'ほかの物件');
      const shown = !!document.getElementById('lgforeign-modal');
      return { shown, v: await Promise.race([p, new Promise(res => setTimeout(() => res('待ち'), 300))]) };
    });
    console.log('E42', brief(r));
    ok(!r.shown && r.v === false, '★E42 読んでいる間に物件が替わったのに、別の工事の窓が出た → ' + short(r));
  });

  // ---- E43 ファイルの備考を台帳で直した（ファイルは前のまま）→ 物件を開き直す → 📁：台帳の直しがファイルの古い値へ戻らない（版183）----
  await go('E43', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, [], { chosho_note: '前の備考' }], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, '直した備考'); await waitNoteSaved(S, Y, '直した備考');
    await sleep(600);
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const r = await ledgerRow(S, Y);
    console.log('E43', brief({ w, r }));
    ok(r && r.note === '直した備考', '★E43 開き直して読むと、台帳で直した備考がファイルの古い値へ戻った → ' + short(r));
  });

  // ---- 2回目の直し（差分の再検証で落ちなかった指摘） ----
  const rowState = (S, no) => S.page.evaluate(no => {
    const r = _listRows.find(x => (x.data || {}).chosho_mgmt_no === no);
    return r ? { det: !!r._detached, man: !!r._manual, s: r.data.chosho_status, wd: r.data.work_done === true, unsaved: r._genbaUnsaved || '', newer: r._rowNewer || [], hold: !!r._holdUnread } : null;
  }, no);
  const writeRow = (S, no) => S.page.evaluate(async no => {
    const row = _listRows.find(x => (x.data || {}).chosho_mgmt_no === no), prev = _editingRow;
    _editingRow = row;
    try { return await writeCurrentCaseToIndividualFile(); } finally { _editingRow = prev; }
  }, no);
  const fileText = (S, id, n) => S.page.evaluate(({ id, n }) => window.__folders[id].__files[n], { id, n });
  const putFile = (S, id, n, no, photos, extra) => S.page.evaluate(({ id, n, no, photos, extra }) => {
    window.__folders[id].__files[n] = __case(no, photos, extra);
  }, { id, n, no, photos, extra });

  // ---- E44 暗号のファイル無の行を開いて写真を足した：ファイルが戻っても 📁 で行を外さない（行の写真が消える）----
  await go('E44', async S => {
    const H = '2622HYB002', PW = 'pw1234';
    await newProject(S, PJ2); await toLedger(S);
    await S.page.evaluate(async ({ H, PW, X }) => {
      setSessionPassword(PW);
      const env = await encryptHybrid(JSON.parse(__case(H, ['h1'])), PW);
      window.__hybText = JSON.stringify(env);
      window.__folders.L = __mk('リスト', { [X + '.json']: __case(X), [H + '.hyb']: window.__hybText });
    }, { H, PW, X });
    await pressFolder(S, 'L');
    await sleep(800);
    await S.page.evaluate(n => { delete window.__folders.L.__files[n]; }, H + '.hyb');
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-keep');
    await S.page.evaluate(no => {
      const r = _listRows.find(x => (x.data || {}).chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_photos: (r.data.chosho_photos || []).concat([__ph('gx', '#999')]) });
    }, H);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = window.__hybText; }, H + '.hyb');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    await sleep(1200);
    const v = await look(S), st = await rowState(S, H);
    console.log('E44', brief({ w, st, status: v.status }));
    ok(st && st.det && v.rows.filter(r => r.no === H).length === 1, '★E44 暗号の行で足した写真を見比べずに行を外した → ' + short({ st, rows: nos(v) }));
    ok(/確かめられないので元に戻していません/.test(v.status), '★E44 知らせが無い → ' + v.status);
  });

  // ---- E45 引き継いだ work_done が 💾 上書き保存でファイルの古い「未」に戻らない ----
  await go('E45', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { work_done: true, work_done_at: '2026-10-20' });
    }, Y);
    await putFile(S, 'L', Y + '.json', Y, ['y1', 'y2'], { work_done: false });
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowState(S, Y);
    await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      await openCaseInEditor(r, false);
      await overwriteSaveCurrent();
    }, Y);
    await sleep(500);
    const f = JSON.parse(await fileText(S, 'L', Y + '.json'));
    console.log('E45', brief({ w, st, wd: f.work_done, at: f.work_done_at, said: alerts(S).map(m => m.slice(0, 50)) }));
    ok(st && st.wd && !st.det && st.newer.indexOf('work_done') >= 0, '★E45 work_done の引き継ぎの印が無い → ' + short(st));
    ok(f.work_done === true, '★E45 💾 上書き保存で引き継いだ work_done がファイルに入らない → ' + short({ wd: f.work_done }));
  });

  // ---- E46 ファイル無の行に 💾 でファイルができたら、ふつうの行に戻る（2回目の 💾 が止まらない）----
  await go('E46', async S => {
    await ghostOf(S);
    const n1 = await writeRow(S, Y);
    const st1 = await rowState(S, Y), t1 = await fileText(S, 'L', Y + '.json');
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_cust_addr: '三沢市 二回目' });
    }, Y);
    const n2 = await writeRow(S, Y);
    const t2 = await fileText(S, 'L', Y + '.json');
    const det = await S.page.evaluate(k => { const j = JSON.parse(lsGet('antenna_detached_v1') || '{}'); return !!j[k]; }, 'm:' + Y);
    console.log('E46', brief({ n1, st1, n2, det }));
    ok(t1, 'E46 試験の前提: 1回目の 💾 でファイルができた');
    ok(st1 && !st1.det && !st1.man, '★E46 ファイルができても「ファイル無」のまま → ' + short(st1));
    ok(!/戻っています/.test(String(n2)) && /二回目/.test(String(t2)), '★E46 2回目の 💾 が自分の作ったファイルで止まった → ' + short(n2));
    ok(!det, '★E46 端末の控えが残った');
  });

  // ---- E47 読めなかったので残した行は、読めるようになったファイルを書き替えない ----
  await go('E47', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1']], [Z]]);
    await pressFolder(S, 'L');
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowState(S, Y);
    await putFile(S, 'L', Y + '.json', Y, ['y1'], { chosho_status: 'completed', work_done: true });
    const before = await fileText(S, 'L', Y + '.json');
    const note = await writeRow(S, Y);
    const after = await fileText(S, 'L', Y + '.json');
    try { await pressWriteback(S); } catch(_){}          // 書くものが無いと止まる（それでよい）
    const after2 = await fileText(S, 'L', Y + '.json');
    console.log('E47', brief({ w, st, note }));
    ok(st && st.hold, 'E47 試験の前提: 読めなかった行を残した → ' + short(st));
    ok(before === after, '★E47 読めなかったので残した行が、読めるようになったファイルを書き替えた');
    ok(/読めなかった/.test(String(note)), '★E47 知らせが無い → ' + short(note));
    ok(before === after2, '★E47 💾 反映が、読めなかったので残した行でファイルを書き替えた');
  });

  // ---- E48 📄 で残した行を突き合わせに通さない（台帳にだけある備考が次の 📁 で消える）----
  await go('E48', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y], [Z]]);
    await pressFolder(S, 'L');
    await typeNote(S, Y, NOTE); await waitNoteSaved(S, Y, NOTE);
    await pressFolder(S, 'L');
    await sleep(300);
    S.said.length = 0;
    await S.page.evaluate(no => {
      const f = new File([__case(no, [], { chosho_cust_name: '選んだファイル 様' })], no + '.json', { type: 'application/json' });
      window.__pick = pickFile; pickFile = (o, cb) => cb([f]);
      listSelectFiles();
    }, X);
    for(let i = 0; i < 200 && !alerts(S).some(m => /取り込みました/.test(m)); i++) await sleep(25);
    await sleep(600);
    const src = await S.page.evaluate(k => (getLedger(k) || {}).noteSrc || '', 'm:' + Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const r = await ledgerRow(S, Y);
    console.log('E48', brief({ src, w, r }));
    ok(src !== NOTE, '★E48 📄 で残した行の備考を、ファイルにあったと控えた');
    ok(r && r.note === NOTE, '★E48 台帳にだけある備考が、📄 のあとの 📁 で消えた → ' + short(r));
  });

  // ---- E49 物件のファイル無の行の「💾 上書き保存」は、戻ったファイルを書き替えない ----
  await go('E49', async S => {
    await ghostOf(S);
    await moveBack(S, 'L', Y);
    const before = await fileText(S, 'L', Y + '.json');
    const o = await S.page.evaluate(async no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      const had = !!r.fileHandle;
      await openCaseInEditor(r, false);
      _loadedOrigin = { file: r.file, fileHandle: r.fileHandle, fileType: r.fileType };   // 📁 で読んだ行を開いた形（「💾 上書き保存」の行き先が立っている）
      await overwriteSaveCurrent();
      return { had };
    }, Y);
    await sleep(500);
    const after = await fileText(S, 'L', Y + '.json');
    console.log('E49', brief({ o, same: before === after, said: alerts(S).slice(-1).map(m => m.slice(0, 80)) }));
    ok(o.had, 'E49 試験の前提: ファイル無の行が前のファイルの持ち手を持っている');
    ok(before === after, '★E49 ファイル無の行の「💾 上書き保存」が、戻ったファイルを書き替えた');
  });

  // ---- E50 📥 で変わった欄の引き継ぎで、ファイルの完了を下げない ----
  await go('E50', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_status: 'in_progress', work_done: false });
      r._rowNewer = ['chosho_status', 'work_done'];
    }, Y);
    await putFile(S, 'L', Y + '.json', Y, ['y1', 'y2'], { chosho_status: 'completed', work_done: true });
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowState(S, Y);
    console.log('E50', brief({ w, st }));
    ok(st && st.s === 'completed' && st.wd, '★E50 行の古い状態がファイルの完了を下げた → ' + short(st));
  });

  // ---- E51 引き継いだ写真のある行の 🗑 も、もう一度確かめる ----
  await go('E51', async S => {
    await ghostOf(S);
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_photos: [__ph('y3', '#999')] });
      r._thumbs = undefined; r._thumbsRetry = true;
    }, Y);
    await moveBack(S, 'L', Y);
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const st = await rowState(S, Y);
    S.said.length = 0; S.dismiss = /のある行を消します/;
    await ledgerDelete(S, Y, '#lgdel-list');
    S.dismiss = null;
    const v = await look(S);
    console.log('E51', brief({ w, st, left: !!rowOf(v, Y) }));
    ok(st && st.unsaved === 'back', 'E51 試験の前提: 写真を引き継いだ → ' + short(st));
    ok(rowOf(v, Y), '★E51 引き継いだ写真のある行が、もう一度確かめずに消えた');
  });

  // ---- E52 読めなかったので残した行に足した写真は、読めるようになった 📁 でファイルの行へ引き継ぐ ----
  await go('E52', async S => {
    await newProject(S, PJ2); await toLedger(S);
    await mkFolder(S, 'L', 'リスト', [[X], [Y, ['y1']], [Z]]);
    await pressFolder(S, 'L');
    await writeShared(S, 'D', SHARED, []); await openShared(S, 'D', SHARED); await toLedger(S);
    await S.page.evaluate(n => { window.__folders.L.__files[n] = '{ 途中で切れた'; }, Y + '.json');
    const w0 = await pressFolder(S, 'L');
    if(w0) await answerMiss(S, '#lgmiss-later');
    await S.page.evaluate(no => {
      const r = _listRows.find(x => x.data.chosho_mgmt_no === no);
      r.data = Object.assign({}, r.data, { chosho_photos: [__ph('hx', '#999')] });
    }, Y);
    await putFile(S, 'L', Y + '.json', Y, ['y1'], {});
    const w = await pressFolder(S, 'L');
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S);
    const st = await S.page.evaluate(no => { const r = _listRows.find(x => x.data.chosho_mgmt_no === no); return { ph: (r.data.chosho_photos || []).map(p => p.id), un: r._genbaUnsaved || '', hold: !!r._holdUnread }; }, Y);
    console.log('E52', brief({ w, st, status: v.status }));
    ok(st.ph.indexOf('hx') >= 0 && st.un && !st.hold, '★E52 読めなかったので残した行に足した写真が消えた → ' + short(st));
  });

  // ---- E53 窓のあいだは、引き継ぎの済んだ行をまだ外さない（タブを閉じると、その形で物件が保存される）----
  await go('E53', async S => {
    await ghostOf(S);
    await moveBack(S, 'L', Y);
    await moveOut(S, 'L', Z);
    const w = await pressFolder(S, 'L');
    const during = await S.page.evaluate(no => { const r = _listRows.find(x => (x.data || {}).chosho_mgmt_no === no); return r ? { det: !!r._detached } : null; }, Y);
    if(w) await answerMiss(S, '#lgmiss-later');
    const v = await look(S);
    console.log('E53', brief({ w, during, rows: nos(v) }));
    ok(w && w.nos.join() === Z, 'E53 試験の前提: Z の窓が出た → ' + short(w));
    ok(during && during.det, '★E53 窓のあいだに行が一覧から外れた → ' + short(during));
    ok(rowOf(v, Y) && !rowOf(v, Y).det && v.rows.filter(r => r.no === Y).length === 1, '★E53 読み終わると元の行に戻らない → ' + nos(v));
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v182_m_ghost2_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
