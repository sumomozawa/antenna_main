/* 版181（メイン）組 m-side：📮 預かりの振り分けの直し（版176 の見直しで見つかったもの）
     ① 振り分けたとき開いていなかった物件（その２）の戸別を、あとで物件から開いて「物件に保存」しても、現場で直した欄（増幅器・電話）が
        前の値に戻らない（v176-1）。まとめたとき、どの預けでどの欄を入れたかを戸別ファイルに残す（_sideKeys）。
        a) 振り分けたあとで物件を開いて開く → 画面に現場の値が出る・保存しても戻らない・写真・印は減らない・_sideKeys も残る
        b) 開いたあとで、ほかのPCがまとめた → 1回目の保存で引き継ぎ、画面にも出す（知らせで「現場で直した欄（N項目）も残しました」）・2回目も戻らない
        c) 台帳で作った行しか無い物件で、開いていないときに新しく置いた → 台帳の行から開いて保存しても戻らない
        d) 🧹 未施工に戻しても _sideKeys を落とさない。引き継ぐのは入れた欄だけ（写真・工程の印・状態・PCだけの欄は引き継がない）
     ② 前に選んだフォルダ（去年の 物件情報_調書）で振り分けても、📁 の一覧の預け（選んだフォルダの外）を名前（その番号）だけで
        別の物件へ置かない・まとめない・預けを片付けない。選んだフォルダの外にあると言う（v176-2）
        a) 預けの物件の名前で決める道（今年の一覧には預けだけ）　b) 預けのすぐ隣に本当の戸別ファイルがあり、去年にも同じ管理番号（別のお宅）がある
        c) 預けの物件の名前が空で、このPCの物件（去年の その１）にその管理番号がある（今年の一覧には預けだけ）
     ③ 古い預け（A）があとからまとまっても、新しい預け（B）で直した欄を古い値に戻さない（写真・済みの印は入れる）。知らせで言う。
        📥 の窓でも言う。名前の日時しか無い印は比べない（v176-3）。読めない預けを「（管理番号なし）」と言わない（v176-8）
     ④ 物件に 📁 を取り込み、戸別を開いたまま振り分けても、一覧を読み直して開いている戸別を一覧から外さない（あとで直した中身が行に入る）。
        振り分けた戸別の行には同じ中身を入れる・読み直さなかったわけを言う（v176-4）
     ⑤ いつもの名前（管理番号.json）に _side が入った戸別を、📁 で一覧から消さない（行には預けの印を持たせない）。
        知らせは「預けの印が入った いつもの名前のファイル」と分けて数える。📮 で印を外せる（v176-5）
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ フォルダは試験の中で作る作り物（smoke_v176_main.js と同じ道具）。
   使い方: node smoke_v181_m_side_main.js [メイン index.html の file:// URL]　（ONLY=①a,③ で場面を絞れる） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url'), cp = require('child_process');
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
const REAL_MAIN = path.join(ROOT, 'antenna_main', 'index.html');
const GENBA_PATH = process.env.GENBA_FOR_CONTRACT || path.join(ROOT, 'antenna_genba', 'index.html');
const VIEWER_PATH = process.env.VIEWER || path.join(ROOT, 'antenna_viewer', 'index.html');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* 場面を絞る（変異試験を速くするため）: ONLY=③,⑦ のように付けると、その記号で始まる場面だけ走らせる */
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

const NO = '2612MKM013';
const SIDE = NO + '_現場預け_20261014-091812.json';
const AT = '2026-10-14T00:18:12.000Z';
const STAMP = AT + '|' + NO;
const P1N = '令和８年度戸別受信設備設置工事（その１）';
const P2N = '令和８年度戸別受信設備設置工事（その２）';

/* ページの中で使う道具：作り物のフォルダ・写真・PCの戸別（D）・現場の預け（S）・振り分けの窓を押す */
const SETUP = `
  /* 作り物のフォルダ。書くときは close で中身が入る（途中で失敗したら元のまま）。
     __hooks.getFile(name) が文字を返せばその中身を読ませ、Error を返せば読めなくする。
     __hooks.write(name, text) は書いた直後に呼ぶ。__hooks.getDir(name) が Error を返せばそのフォルダを開けない。 */
  window.__mk = function(name, files, subs){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __mt: {}, __hooks: {}, __perm: 'granted', __permReq: null };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        if(d.__hooks.getFile){ const r = d.__hooks.getFile(n);
          if(r instanceof Error) throw r;
          if(typeof r === 'string') return { name:n, size: new Blob([r]).size, lastModified: Date.now(), text: async () => r }; }
        if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        const t = d.__files[n];
        return { name:n, size: new Blob([t]).size, lastModified: d.__mt[n] || Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { d.__files[n] = buf; d.__mt[n] = Date.now(); d.__writes.push({ n, t: buf });
                                      if(d.__hooks.write) d.__hooks.write(n, buf); } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => d.__perm,
      requestPermission: async () => (d.__permReq || d.__perm),
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(n in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async (n, opt) => {
        if(d.__hooks.getDir){ const r = d.__hooks.getDir(n); if(r instanceof Error) throw r; }
        if(!d.__subs[n]){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n); }
        return d.__subs[n]; },
      removeEntry: async n => { if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(n); delete d.__files[n]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
    return d;
  };
  /* フォルダの中身を「場所 → 中身」で写し取る（変わったところを見比べるため） */
  window.__tree = function(d, pre){ const o = {}; pre = pre || '';
    Object.keys(d.__files).forEach(n => { o[pre + n] = d.__files[n]; });
    Object.keys(d.__subs).forEach(n => Object.assign(o, window.__tree(d.__subs[n], pre + n + '/')));
    return o; };
  window.__diff = function(a, b){ const out = [];
    Object.keys(Object.assign({}, a, b)).sort().forEach(k => {
      if(!(k in a)) out.push('+' + k); else if(!(k in b)) out.push('-' + k); else if(a[k] !== b[k]) out.push('~' + k); });
    return out; };
  window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6; const x = cv.getContext('2d');
    x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
  window.__ph = (id, c) => ({ id, label: '写真' + id, dataUri: window.__png(c) });
  window.__pids = t => { try{ const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return (j.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(読めない)'; } };
  window.__COL = ['#c33','#3c3','#33c','#cc3','#3cc','#c3c'];
  /* PC の戸別（写真6枚・工事完了・同意書・PCだけの欄） */
  window.__D = no => ({ chosho_mgmt_no: no, chosho_cust_name: '三沢 太郎', chosho_cust_addr: '三沢市1-2', chosho_cust_tel: '',
    work_type: 'uhf_new', amplifier: 'pcAmp', line_booster: 'lbPC', chosho_note: 'PCの備考',
    work_done: true, work_done_at: '2026-09-30', chosho_status: 'completed',
    flyer_done: false, consent_received: true, consent_received_at: '2026-09-01',
    asbestos: { judge: 'none', by: 'office' }, qty_overrides: { a: 1 },
    chosho_photos: ['p1','p2','p3','p4','p5','p6'].map((id, i) => window.__ph(id, window.__COL[i])),
    _origin: 'main', editedAt: '2026-10-01T00:00:00Z' });
  /* 現場の預け（PCのファイルを読めない端末から。写真は p1 と同じもの＋新しい t1） */
  window.__S = (no, side) => ({ chosho_mgmt_no: no, chosho_cust_name: '三沢 太郎', chosho_cust_tel: '0176-11-2222',
    work_type: 'catv_to_uhf', amplifier: 'genbaAmp', line_booster: '', chosho_note: '',
    work_done: false, chosho_status: 'in_progress', flyer_done: true, flyer_done_at: '2026-10-14',
    consent_received: false, asbestos: { judge: 'yes', by: 'genba' }, qty_overrides: {},
    chosho_photos: [ window.__ph('p1', '#c33'), window.__ph('t1', '#963') ], _origin: 'genba',
    _side: Object.assign({ v: 1, at: '${AT}', why: 'viewonly', proj: '', ledger: '${P2N}', place: 'その2', lacks: 5, base: null,
      touched: ['amplifier', 'line_booster', 'work_done', 'consent_received', 'chosho_status', 'asbestos'], app: '176' }, side || {}) });
  /* 物件（このPCの IndexedDB に入れる） */
  window.__proj = (id, name, nos) => { const now = new Date().toISOString();
    return { schema: PROJ_SCHEMA, id, name, createdAt: now, updatedAt: now,
      cases: (nos || []).map((no, i) => ({ caseId: id + '_c' + i, file: 'リスト/' + no + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: no, chosho_cust_name: '試験 ' + no, chosho_status: 'in_progress', work_type: '' } })),
      ledger: {}, takeout: {}, review: {} }; };
  /* 「📮 預かりを振り分ける」を押して、窓が開いたら（pre を済ませてから）btn を押す。
     窓の文字・OK の文字と押せるか を返す。OK が押せないときは「何もしない」で閉じる（止まらないように）。 */
  window.__sortRun = async (btn, pre) => {
    const seen = { opened: false, text: '', after: '', okText: '', okDisabled: null };
    let finished = false;
    const waiter = new Promise(res => { let n = 0; const t = setInterval(async () => {
      const m = document.getElementById('sort-modal');
      if(m && m.classList.contains('open') && !seen.opened){
        seen.opened = true; clearInterval(t);
        seen.text = (m.innerText || '').replace(/\\s+/g, ' ');
        if(pre){ try { await pre(m); } catch(e){ seen.preErr = String(e && e.message || e); } }
        seen.after = (m.innerText || '').replace(/\\s+/g, ' ');
        const okb = document.getElementById('sort-ok');
        seen.okText = okb ? okb.textContent : ''; seen.okDisabled = okb ? !!okb.disabled : null;
        const b = (btn === 'sort-ok' && okb && okb.disabled) ? 'sort-cancel' : btn;
        document.getElementById(b).click();
        return res();
      }
      if(finished || ++n > 800){ clearInterval(t); res(); }
    }, 25); });
    /* 窓が出たまま戻らない（見当たらない窓・📥 の窓など）ときに試験ごと止まらないよう、20秒で切り上げる */
    const tm = new Promise(r => setTimeout(() => { seen.timedOut = true; r(); }, 20000));
    await Promise.race([sideSortButton(), tm]);
    finished = true;
    await waiter;
    return seen;
  };
  /* 表の行（その管理番号を含む行）の「行き先」を、名前に want を含む物件へ替える */
  window.__pickDest = (m, no, want) => {
    const tr = [...m.querySelectorAll('tr')].filter(r => r.innerText.indexOf(no) >= 0)[0];
    const sel = tr && tr.querySelector('select');
    if(!sel) throw new Error('行き先を選ぶ所が無い: ' + no);
    const op = [...sel.options].filter(o => o.textContent.indexOf(want) >= 0)[0];
    if(!op) throw new Error('行き先の候補に ' + want + ' が無い');
    sel.value = op.value; sel.dispatchEvent(new Event('change'));
  };
  window.__fresh = async () => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null;
    try { _sideFiles = []; } catch(_){}
    try { _sideSortRoot = null; } catch(_){}
    try { await projHandleDelete(SIDE_SORT_DIR_KEY); } catch(_){}
  };
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
/* 新しい入れ物でページを開く。出た窓（alert/confirm）は said に残して OK で閉じる */
async function openPage(target, label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const said = [];
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => { said.push({ type: d.type(), msg: d.message() }); d.accept().catch(()=>{}); });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await page.goto(target);
  return { ctx, page, said };
}
async function openMain(label){
  const o = await openPage(MAIN, label);
  await o.page.waitForFunction(() => typeof listReloadFolder === 'function' && typeof genbaImportFlow === 'function'
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await o.page.evaluate(SETUP);
  /* 知らせ（alert）はページの中でも控える（ページの中の試験から読めるように） */
  await o.page.evaluate(() => { window.__al = []; window.alert = m => { window.__al.push(String(m)); }; });
  o.said.length = 0;
  return o;
}
/* ページの中で走らせる。止まったら { error } を返す（v175 のように関数が無いときも、場面ごとに赤にする） */
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
const alerts = said => said.filter(s => s.type === 'alert').map(s => s.msg);
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
const brief = o => JSON.stringify(o === undefined ? null : o).slice(0, 260);   // 流れを追うための短い控え（失敗の知らせは short）

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  /* ---- ① 振り分けたとき開いていなかった物件（その２）から、あとで同じ戸別を開いて「物件に保存」（v176-1） ---- */
  {
    for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('①' + m))){
      const { ctx, page, said } = await openMain('①' + mode);
      const r = await run(page, async ({ P1N, P2N, AT, mode }) => {
        await __fresh();
        const NO = 'W2B001';
        const ST = AT + '|' + NO;
        // その２ の戸別ファイル（PC）：まだ工事完了でない・増幅器 amp_3u43・電話なし
        const D = Object.assign(__D(NO), { amplifier: 'amp_3u43', work_done: false, chosho_status: 'in_progress', chosho_cust_tel: '' });
        delete D.work_done_at;
        // 現場の預け（その２ の台帳）：増幅器を amp_1u45 に・電話を入れた・工事完了
        const S = Object.assign(__S(NO, { proj: P2N, ledger: P2N, touched: ['amplifier', 'chosho_cust_tel', 'work_done', 'chosho_status'] }),
                                { amplifier: 'amp_1u45', chosho_cust_tel: '0176-11-2222', work_done: true, work_done_at: '2026-10-14', chosho_status: 'completed' });
        const SIDEN = NO + '_現場預け_20261014-091812.json';
        const o = { mode };
        const file = l => { const t = l.__files[NO + '.json']; return t ? JSON.parse(t) : null; };
        const pick = f => f ? { amp: f.amplifier, tel: f.chosho_cust_tel, wd: f.work_done, st: f.chosho_status, sm: f._sideMerged || null,
                                keys: (f._sideKeys && f._sideKeys[ST]) || null, ph: __pids(f) } : null;
        const screen = () => ({ amp: (document.getElementById('amplifier') || {}).value, tel: (document.getElementById('chosho_cust_tel') || {}).value });
        if(mode === 'a'){
          // ① その１ の物件を開いたまま 📮 で振り分ける（その２ の行には入らない）
          const l1 = __mk('リスト', {});
          const l2 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2), [SIDEN]: JSON.stringify(S) });
          const p2 = __mk('その２', {}, { 'リスト': l2 });
          const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': p2 });
          _currentProject = { id: 'pjA1', name: P1N, cases: [] };
          _listRows = [];
          window.showDirectoryPicker = async () => root;
          o.run = (await __sortRun('sort-ok')).okText;
          o.afterSort = pick(file(l2));
          // ② あとで その２ の物件を開く（物件の行は振り分ける前の中身のまま）→ その戸別を開いて「物件に保存」
          const stale = Object.assign({}, D, { chosho_photos: null, chosho_photo_count: 6 });
          const row = { file: 'リスト/' + NO + '.json', data: stale, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
          _currentProject = { id: 'pjA2', name: P2N, cases: [] };
          _listRows = [row];
          _projDirHandle = p2;
          window.__al.length = 0;
          try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
          o.shown = screen();
          o.toast = ((document.getElementById('ui-toast') || {}).textContent) || '';
          o.rowAfterOpen = { amp: row.data.amplifier, wd: row.data.work_done, sm: row.data._sideMerged || null };
          try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
          o.afterSave = pick(file(l2));
          o.rowAfterSave = { amp: row.data.amplifier, tel: row.data.chosho_cust_tel };
        } else if(mode === 'b'){
          // 開いたあとで、ほかのPCが振り分けた（戸別ファイルにだけ入る）→ 1回目の保存・2回目の保存
          const l2 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2) });
          const p2 = __mk('その２', {}, { 'リスト': l2 });
          const stale = Object.assign({}, D, { chosho_photos: null, chosho_photo_count: 6 });
          const row = { file: 'リスト/' + NO + '.json', data: stale, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
          _currentProject = { id: 'pjB2', name: P2N, cases: [] };
          _listRows = [row];
          _projDirHandle = p2;
          await openCaseInEditor(row);
          o.shown0 = screen();
          const mg = sideMergeInto(D, S, S._side, { name: SIDEN });
          l2.__files[NO + '.json'] = JSON.stringify(mg.merged, null, 2);
          // 事務所は別の欄（備考）を直して保存 → もう一度保存
          const nt = document.getElementById('chosho_note'); if(nt){ nt.value = '事務所の備考'; nt.dispatchEvent(new Event('input', { bubbles: true })); }
          try { markEditorDirty(); } catch(_){}
          window.__al.length = 0;
          await overwriteSaveCurrentToProject();
          o.save1 = Object.assign(pick(file(l2)), { screen: screen(), note: file(l2).chosho_note });
          o.save1Alert = window.__al.join(' / ');
          await overwriteSaveCurrentToProject();
          o.save2 = Object.assign(pick(file(l2)), { screen: screen(), row: row.data.amplifier });
        } else if(mode === 'c'){
          // 台帳で作った行しか無い物件（その２）。開いていないときに 📮 で新しく置いた → あとで台帳の行を開いて「物件に保存」
          const l2 = __mk('リスト', { [SIDEN]: JSON.stringify(S) });
          const p2 = __mk('その２', {}, { 'リスト': l2 });
          const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': __mk('リスト', {}) }), 'その２': p2 });
          _currentProject = null; _listRows = [];
          window.showDirectoryPicker = async () => root;
          o.run = (await __sortRun('sort-ok')).okText;
          o.placed = pick(file(l2));
          const row = { file: 'manual:x1', data: { chosho_mgmt_no: NO, chosho_cust_name: '三沢 太郎', chosho_status: 'in_progress', work_type: '' },
                        fileType: 'plain', _manual: true, _origin: 'manual', _fromProject: true };
          _currentProject = { id: 'pjC2', name: P2N, cases: [] };
          _listRows = [row];
          _projDirHandle = l2;
          try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
          o.shown = screen();
          try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
          o.afterSave = pick(file(l2));
        } else {
          // 🧹 未施工に戻しても、どの預けで入れた欄か（_sideKeys）は印（_sideMerged）と一緒に残る
          const row = { file: NO + '.json', data: Object.assign({}, D, { _sideMerged: [ST], _sideKeys: { [ST]: ['amplifier'] }, chosho_photos: null }),
                        fileType: 'plain', _fromProject: true, _slim: true };
          _listRows = [row];
          try { revertCaseFromList(row); } catch(e){ o.revErr = String(e && e.message || e); }
          o.afterRevert = { sm: row.data._sideMerged || null, keys: row.data._sideKeys || null, amp: row.data.amplifier };
          // 引き継ぐのは、その預けで入れた欄だけ。写真・工程の印・状態・PCだけの欄は、_sideKeys に書いてあっても引き継がない
          const data = { chosho_mgmt_no: NO, amplifier: 'amp_3u43', work_done: true, work_done_at: '2026-09-30', chosho_status: 'completed',
                         qty_overrides: { a: 1 }, chosho_photos: [__ph('p1', '#c33'), __ph('p2', '#3c3')] };
          const fileJ = { chosho_mgmt_no: NO, amplifier: 'amp_1u45', work_done: false, chosho_status: 'in_progress', qty_overrides: {},
                          chosho_photos: [__ph('p1', '#c33')], _sideMerged: [ST],
                          _sideKeys: { [ST]: ['chosho_photos', 'amplifier', 'work_done', 'chosho_status', 'qty_overrides', '_side', 'chosho_mgmt_no'] } };
          const k = sideKeepFileMarks(data, fileJ);
          o.keep = { fields: k && k.fields, amp: data.amplifier, wd: data.work_done, st: data.chosho_status, qo: data.qty_overrides, ph: __pids(data),
                     sm: data._sideMerged, keys: data._sideKeys && data._sideKeys[ST] };
        }
        _currentProject = null; _listRows = []; _projDirHandle = null; _editingRow = null;
        return o;
      }, { P1N, P2N, AT, mode });
      console.log('①' + mode, brief(r));
      ok(!r.error, '①' + mode + ' 止まった → ' + r.error);
      if(!r.error){
        const keysOk = k => Array.isArray(k) && k.indexOf('amplifier') >= 0 && k.indexOf('chosho_cust_tel') >= 0;
        if(mode === 'a'){
          ok(r.afterSort && r.afterSort.amp === 'amp_1u45' && r.afterSort.tel === '0176-11-2222' && r.afterSort.wd === true,
             '①a 試験の前提: 振り分けで戸別ファイルに現場の直しが入る → ' + short(r.afterSort));
          ok(keysOk(r.afterSort && r.afterSort.keys), '★①a まとめたとき、その預けで入れた欄を戸別ファイルに残さない（_sideKeys） → ' + short(r.afterSort));
          ok(r.shown.amp === 'amp_1u45' && r.shown.tel === '0176-11-2222',
             '★①a 物件から開いた画面に、振り分ける前の増幅器・電話が出る → ' + short(r.shown));
          ok(/済みの印・状態と、現場で直した欄（2項目）を、この戸別に入れて開きました/.test(r.toast),
             '★①a 開くときに戸別ファイルから引き継いだことを言わない（一覧で見ていた中身と画面が違う） → ' + r.toast);
          ok(r.afterSave && r.afterSave.amp === 'amp_1u45' && r.afterSave.tel === '0176-11-2222' && r.afterSave.wd === true && r.afterSave.st === 'completed',
             '★①a 「物件に保存」で、現場で直した欄（増幅器・電話）が前の値に戻った → ' + short(r.afterSave));
          ok(r.afterSave && r.afterSave.ph === r.afterSort.ph && (r.afterSave.sm || []).length >= 1,
             '★①a 物件に保存で写真・まとめた印が減った → ' + short([r.afterSort, r.afterSave]));
          ok(keysOk(r.afterSave && r.afterSave.keys), '★①a 画面で保存すると、その預けで入れた欄の覚え（_sideKeys）を落とす → ' + short(r.afterSave));
        } else if(mode === 'b'){
          ok(r.shown0.amp === 'amp_3u43', '①b 試験の前提: 開いたときは前の中身 → ' + short(r.shown0));
          ok(r.save1.amp === 'amp_1u45' && r.save1.tel === '0176-11-2222' && r.save1.wd === true && r.save1.note === '事務所の備考',
             '★①b 開いたあとでまとめた預けの欄を、1回目の保存で前の値に戻した → ' + short(r.save1));
          ok(r.save1.screen.amp === 'amp_1u45' && r.save1.screen.tel === '0176-11-2222',
             '★①b 引き継いだ欄を開いている画面に出さない（次の保存で戻る） → ' + short(r.save1));
          ok(/済みの印・状態は消さずに残しました。現場で直した欄（2項目）も残しました/.test(r.save1Alert),
             '★①b 保存の知らせで、現場で直した欄も残したことを言わない → ' + r.save1Alert.slice(0, 400));
          ok(r.save2.amp === 'amp_1u45' && r.save2.tel === '0176-11-2222' && r.save2.wd === true && r.save2.row === 'amp_1u45',
             '★①b 2回目の保存で、現場で直した欄が前の値に戻った → ' + short(r.save2));
        } else if(mode === 'c'){
          ok(r.placed && r.placed.amp === 'amp_1u45' && r.placed.wd === true, '①c 試験の前提: 新しく置く → ' + short(r));
          ok(keysOk(r.placed && r.placed.keys), '★①c 新しく置いた戸別に、その預けで入れた欄を残さない（_sideKeys） → ' + short(r.placed));
          ok(r.afterSave && r.afterSave.amp === 'amp_1u45' && r.afterSave.tel === '0176-11-2222' && r.afterSave.wd === true
             && r.afterSave.ph === r.placed.ph,
             '★①c 台帳で作った行から保存すると、新しく置いた戸別の現場の直しが前の値に戻った／写真が減った → ' + short(r));
        } else {
          ok(!r.revErr && Array.isArray(r.afterRevert.sm) && r.afterRevert.keys && Array.isArray(r.afterRevert.keys[AT + '|W2B001']),
             '★①d 🧹 未施工に戻すと、どの預けで入れた欄か（_sideKeys）を落とす → ' + short(r));
          ok(r.keep && r.keep.amp === 'amp_1u45' && r.keep.fields.join() === 'amplifier' && r.keep.wd === true && r.keep.st === 'completed'
             && JSON.stringify(r.keep.qo) === '{"a":1}' && r.keep.ph === 'p1,p2' && (r.keep.sm || []).length === 1,
             '★①d 戸別ファイルから、写真・工程の印・状態・PCだけの欄まで引き継いだ（写真が減る・済みの印が外れる） → ' + short(r.keep));
        }
      }
      await ctx.close();
    }
  }

  /* ---- ② 前に選んだフォルダ（去年の 物件情報_調書）で振り分けると、📁 の一覧の預けを別の物件へ置く（v176-2） ---- */
  for(const mode of ['a', 'b', 'c'].filter(m => want('②' + m))){
    const { ctx, page, said } = await openMain('②' + mode);
    const r = await run(page, async ({ mode }) => {
      await __fresh();
      const NO = 'W9A001';
      const P9 = '令和９年度戸別受信設備設置工事（その１）';
      // 今年（令和９年度）の その１/リスト：戸別ファイルと預けがある（📁 で読む）
      const D9 = JSON.stringify(Object.assign(__D(NO), { work_done: false, chosho_status: 'in_progress', work_done_at: '' }), null, 2);
      const SIDEN = NO + '_現場預け_20261014-091812.json';
      const sp = (mode === 'c') ? { proj: '', ledger: P9, touched: ['work_done', 'chosho_status', 'amplifier'] }
                                : { proj: P9, ledger: P9, touched: ['work_done', 'chosho_status', 'amplifier'] };
      const S9 = JSON.stringify(__S(NO, sp));
      // a・c は預けだけ（その戸別のファイルは別の所）、b は預けのすぐ隣にその戸別のファイルがある
      const l9 = __mk('リスト', (mode === 'b') ? { [NO + '.json']: D9, [SIDEN]: S9 } : { [SIDEN]: S9 });
      // 去年（令和８年度）の 物件情報_調書（前に 📮 で選んだフォルダ＝覚えている）。b は去年にも同じ管理番号（別のお宅）がある
      const old = JSON.stringify(Object.assign(__D(NO), { chosho_cust_name: '去年の 別のお宅', amplifier: 'oldAmp' }), null, 2);
      const l8a = __mk('リスト', Object.assign({ 'W8A001.json': JSON.stringify(__D('W8A001')) }, (mode === 'b') ? { [NO + '.json']: old } : {}));
      const l8b = __mk('リスト', {});
      const root8 = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l8a }), 'その２': __mk('その２', {}, { 'リスト': l8b }) });
      if(mode === 'c') await projIdbPut(__proj('pj9c', '令和８年度戸別受信設備設置工事（その１）', [NO]));   // このPCの物件（去年の その１）にこの管理番号
      window.confirm = () => true;
      window.showDirectoryPicker = async () => l9;
      await listSelectFolder();
      const o = { rows: (_listRows || []).map(x => x._name).sort().join(), side: (_sideFiles || []).map(x => x.name).join() };
      const before8 = __tree(root8), before9 = __tree(l9);
      _sideSortRoot = root8;               // 覚えているフォルダ（IndexedDB の代わり）
      window.showDirectoryPicker = async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); };
      o.run = await __sortRun('sort-ok');
      o.diff8 = __diff(before8, __tree(root8));
      o.diff9 = __diff(before9, __tree(l9));
      return o;
    }, { mode });
    console.log('②' + mode, brief(r));
    ok(!r.error, '②' + mode + ' 止まった → ' + r.error);
    if(!r.error){
      ok(/（読み込んだ一覧）/.test(r.run.text) && r.side === 'W9A001_現場預け_20261014-091812.json',
         '②' + mode + ' 試験の前提: 📁 の一覧の預けが表に出る → ' + short(r));
      ok(r.diff8.length === 0 && r.diff9.length === 0 && r.run.okDisabled === true,
         '★②' + mode + ' 前に選んだ（去年の）フォルダの「その１」へ、📁 の一覧の預けを置いた・まとめた／預けを片付けた → ' + short({ d8: r.diff8, d9: r.diff9, ok: r.run.okText }));
      ok(/選んだフォルダ（物件情報_調書）の外の、読み込んだ一覧の中にあります/.test(r.run.text) && /「📁 別のフォルダを選ぶ」/.test(r.run.text),
         '★②' + mode + ' 選んだフォルダの外の預けだと言わない（どうすればよいか分からない） → ' + r.run.text.slice(0, 700));
    }
    await ctx.close();
  }

  /* ---- ③ 古い預けがあとからまとまる（v176-3）・読めない預けの管理番号（v176-8） ---- */
  if(want('③')){
    const { ctx, page, said } = await openMain('③');
    const r = await run(page, async ({ P1N }) => {
      await __fresh();
      const NO = 'W1C001';
      const D = Object.assign(__D(NO), { amplifier: 'pcAmp', chosho_cust_tel: '' });
      // 預け A（10:00）: 増幅器 ampA・電話 A   預け B（11:00）: 増幅器 ampB・電話 B
      const A = Object.assign(__S(NO, { at: '2026-10-14T01:00:00.000Z', proj: P1N, touched: ['amplifier', 'chosho_cust_tel'] }),
                              { amplifier: 'ampA', chosho_cust_tel: '0176-AAAA', chosho_photos: [__ph('a1', '#111')], flyer_done: true, flyer_done_at: '2026-10-13' });
      const B = Object.assign(__S(NO, { at: '2026-10-14T02:00:00.000Z', proj: P1N, touched: ['amplifier', 'chosho_cust_tel'] }),
                              { amplifier: 'ampB', chosho_cust_tel: '0176-BBBB', chosho_photos: [__ph('b1', '#222')], flyer_done: false });
      const NA = NO + '_現場預け_20261014-100000.json', NB = NO + '_現場預け_20261014-110000.json';
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, D, { flyer_done: false }), null, 2), [NA]: JSON.stringify(A), [NB]: JSON.stringify(B) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }) });
      // 1回目：A はまだ同期が終わっていない（読めない）
      l1.__hooks.getFile = n => (n === NA) ? Object.assign(new Error('読めない'), { name: 'NotReadableError' }) : undefined;
      window.showDirectoryPicker = async () => root;
      const o = {};
      window.__al.length = 0;
      o.run1 = (await __sortRun('sort-ok')).okText;
      o.alert1 = window.__al.join(' / ');
      let f = JSON.parse(l1.__files[NO + '.json']);
      o.after1 = { amp: f.amplifier, tel: f.chosho_cust_tel, sm: f._sideMerged, ph: __pids(f) };
      // 2回目：A が届いた
      l1.__hooks.getFile = null;
      window.__al.length = 0;
      o.run2 = (await __sortRun('sort-ok')).okText;
      o.alert2 = window.__al.join(' / ');
      f = JSON.parse(l1.__files[NO + '.json']);
      o.after2 = { amp: f.amplifier, tel: f.chosho_cust_tel, sm: f._sideMerged, ph: __pids(f), flyer: f.flyer_done, keys: f._sideKeys || null };
      o.sideLeft = Object.keys(l1.__files).filter(n => /現場預け/.test(n));
      // 合わせ方だけ：新しい預けがもうまとめてある行に、古い預けを入れる（📥 で新しい→古いの順に選んだとき）
      const base = { chosho_mgmt_no: NO, amplifier: 'ampB', chosho_cust_tel: '0176-BBBB', _sideMerged: ['2026-10-14T02:00:00.000Z|' + NO],
                     chosho_photos: [__ph('b1', '#222')] };
      const A2 = Object.assign({}, A); delete A2._side;
      const mg = sideMergeInto(base, A2, A._side, { name: NA });
      o.pure = { amp: mg.merged.amplifier, tel: mg.merged.chosho_cust_tel, flyer: mg.merged.flyer_done, ph: __pids(mg.merged),
                 sm: mg.merged._sideMerged, older: !!mg.report.olderSkipped };
      // 名前の日時しか無い印（中の時刻が無い）は比べない（入れる）
      const base2 = Object.assign({}, base, { _sideMerged: ['20261014-110000|' + NO] });
      const A3side = Object.assign({}, A._side); delete A3side.at;
      const mg2 = sideMergeInto(base2, A2, A3side, { name: NA });
      o.pureNoIso = { amp: mg2.merged.amplifier };
      // 📥 の窓でも、古い預けだと言う
      const p = openGenbaImportPreview({ row: null, mgmt: NO, mainData: base, genbaData: A, matchType: 'case', fileName: NA, side: A._side });
      await new Promise(res => setTimeout(res, 400));
      o.preview = ((document.getElementById('gi-body') || {}).innerText || '').replace(/\s+/g, ' ');
      const cb = document.getElementById('gi-cancel'); if(cb) cb.click();
      await Promise.race([p, new Promise(res => setTimeout(res, 2000))]);
      return o;
    }, { P1N });
    console.log('③', brief(r));
    ok(!r.error, '③ 止まった → ' + r.error);
    if(!r.error){
      ok(r.after1.amp === 'ampB' && r.after1.tel === '0176-BBBB' && /b1/.test(r.after1.ph),
         '③ 試験の前提: 1回目は新しい預け（B）だけまとまる → ' + short(r.after1));
      ok(/・W1C001（W1C001_現場預け_20261014-100000\.json）：中身を読めません/.test(r.alert1) && !/管理番号なし/.test(r.alert1),
         '★③ 読めない預けを、振り分けの終わりの知らせで「（管理番号なし）」と言う → ' + r.alert1.slice(0, 600));
      ok(r.after2.amp === 'ampB' && r.after2.tel === '0176-BBBB',
         '★③ 古い預け（A）があとからまとまると、新しい預け（B）で直した欄が古い値に戻った → ' + short(r.after2));
      ok(r.after2.ph.split(',').indexOf('a1') >= 0 && r.after2.ph.split(',').indexOf('b1') >= 0 && (r.after2.sm || []).length === 2
         && r.after2.flyer === true && r.sideLeft.length === 0,
         '★③ 古い預けの写真・済みの印・まとめた印が入らない／預けが残った → ' + short(r.after2));
      ok(/W1C001（W1C001_現場預け_20261014-100000\.json）：この預けより新しい預けが もうまとめてあるので、現場で直した欄は入れていません/.test(r.alert2),
         '★③ 直した欄を入れなかったことを、振り分けの終わりの知らせで言わない → ' + r.alert2.slice(0, 600));
      ok(r.pure.amp === 'ampB' && r.pure.tel === '0176-BBBB' && r.pure.flyer === true && /a1/.test(r.pure.ph) && /b1/.test(r.pure.ph)
         && r.pure.sm.length === 2 && r.pure.older,
         '★③ 合わせ方：新しい預けがもうまとめてあるのに、古い預けの直した欄を入れる → ' + short(r.pure));
      ok(r.pureNoIso.amp === 'ampA', '③ 名前の日時しか無い印でも比べてしまう（今までどおり入れるはず） → ' + short(r.pureNoIso));
      ok(/この預けより新しい預けが、もうまとめてあります。現場で直した欄は入れません/.test(r.preview),
         '★③ 📥 の窓で、古い預けだと言わない → ' + r.preview.slice(0, 600));
    }
    await ctx.close();
  }

  /* ---- ④ 物件に 📁 を取り込み、戸別を開いたまま振り分ける（v176-4） ---- */
  if(want('④')){
    const { ctx, page, said } = await openMain('④');
    const r = await run(page, async ({ P1N }) => {
      await __fresh();
      const NO = 'W1D001', N9 = 'W1D009';
      const D = Object.assign(__D(NO), { amplifier: 'amp_3u43' });
      const D9 = Object.assign(__D(N9), { amplifier: 'amp_3u43', chosho_note: '元の備考', chosho_cust_name: '九 太郎' });
      const S = Object.assign(__S(NO, { proj: P1N, touched: ['amplifier'] }), { amplifier: 'amp_1u45' });
      const SIDEN = NO + '_現場預け_20261014-091812.json';
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2), [N9 + '.json']: JSON.stringify(D9, null, 2) });
      const l2 = __mk('リスト', { [SIDEN]: JSON.stringify(S) });
      const p1 = __mk('その１', {}, { 'リスト': l1 });
      const root = __mk('物件情報_調書', {}, { 'その１': p1, 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _currentProject = { id: 'pjD4', name: P1N, cases: [] };
      window.confirm = () => true;
      window.showDirectoryPicker = async () => l1;
      await listSelectFolder();                 // 物件に取り込む（行はファイルを持つ）
      const o = { rows: (_listRows || []).map(x => x._name + ':' + !!x.fileHandle).sort().join() };
      const row9 = _listRows.filter(x => x._name === N9 + '.json')[0];
      await openCaseInEditor(row9);
      const el = document.getElementById('amplifier');
      el.value = 'amp_1u45'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      try { markEditorDirty(); } catch(_){}
      o.beforeSortInList = _listRows.indexOf(_editingRow) >= 0;
      window.showDirectoryPicker = async () => root;
      window.__al.length = 0;
      o.run = (await __sortRun('sort-ok')).okText;
      o.alert = window.__al.join(' / ');
      o.afterSortInList = _listRows.indexOf(_editingRow) >= 0;
      o.file1 = JSON.parse(l1.__files[NO + '.json']).amplifier;
      const r1 = _listRows.filter(x => x._name === NO + '.json')[0];
      o.row1 = r1 && r1.data && r1.data.amplifier;
      try { await overwriteSaveCurrent(); } catch(e){ o.saveErr = String(e && e.message || e); }
      await new Promise(res => setTimeout(res, 2500));
      o.file9 = JSON.parse(l1.__files[N9 + '.json']).amplifier;
      const nr = _listRows.filter(x => x._name === N9 + '.json')[0];
      o.row9 = nr && nr.data && nr.data.amplifier; o.same = nr === _editingRow;
      _currentProject = null; _listRows = []; _editingRow = null;
      return o;
    }, { P1N });
    console.log('④', brief(r));
    ok(!r.error, '④ 止まった → ' + r.error);
    if(!r.error){
      ok(r.beforeSortInList && r.file1 === 'amp_1u45' && r.file9 === 'amp_1u45', '④ 試験の前提: 振り分けでまとまる・上書き保存でファイルに入る → ' + short(r));
      ok(r.afterSortInList && r.same && r.row9 === 'amp_1u45',
         '★④ 振り分けたあと、開いている戸別が一覧から外れ、あとで直した中身が一覧の行に入らない → ' + short(r));
      ok(r.row1 === 'amp_1u45', '★④ 読み直さなかったとき、振り分けた戸別の行に同じ中身を入れない → ' + short(r));
      ok(/画面に戸別を開いているので、読み直していません/.test(r.alert),
         '★④ 一覧を読み直さなかったわけを言わない → ' + r.alert.slice(0, 700));
    }
    await ctx.close();
  }

  /* ---- ⑤ いつもの名前（管理番号.json）に _side が入った戸別を、📁 で一覧から消さない（v176-5） ---- */
  if(want('⑤')){
    const { ctx, page, said } = await openMain('⑤');
    const r = await run(page, async ({ P1N }) => {
      await __fresh();
      const o = {};
      const NO = 'W7A007';
      const bad = Object.assign(__D(NO), { _side: { v: 1, at: '2026-10-01T00:00:00.000Z', proj: P1N } });
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(bad, null, 2), 'W7A008.json': JSON.stringify(__D('W7A008'), null, 2) });
      const p1 = __mk('その１', {}, { 'リスト': l1 });
      _currentProject = { id: 'pjE5', name: P1N, cases: [] };
      _listRows = [ { file: 'リスト/' + NO + '.json', data: Object.assign(__D(NO), { chosho_photos: null }), fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 },
                    { file: 'リスト/W7A008.json', data: Object.assign(__D('W7A008'), { chosho_photos: null }), fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 } ];
      window.confirm = () => true;
      window.showDirectoryPicker = async () => l1;
      await listSelectFolder();
      o.rows = (_listRows || []).map(x => (x.data && x.data.chosho_mgmt_no) + ':' + (x._name || x.file)).sort().join();
      const r7 = (_listRows || []).filter(x => x.data && x.data.chosho_mgmt_no === NO)[0];
      o.rowSide = !!(r7 && r7.data && r7.data._side);
      o.note = (document.getElementById('list-status') || {}).textContent || '';
      o.sf = (_sideFiles || []).map(x => x.name).join();
      const mo = document.getElementById('lgmiss-ov');
      o.missOpen = !!(mo && mo.classList.contains('open'));
      // 📮 で印を外す（消さない・中身はそのまま）
      window.showDirectoryPicker = async () => p1;
      o.run = await __sortRun('sort-ok');
      const j = JSON.parse(l1.__files[NO + '.json']);
      o.fixed = { side: '_side' in j, ph: __pids(j), amp: j.amplifier };
      o.rows2 = (_listRows || []).map(x => (x.data && x.data.chosho_mgmt_no)).sort().join();
      _currentProject = null; _listRows = [];
      return o;
    }, { P1N });
    console.log('⑤', brief(r));
    ok(!r.error, '⑤ 止まった → ' + r.error);
    if(!r.error){
      ok(/W7A008:/.test(r.rows) && r.sf === 'W7A007.json', '⑤ 試験の前提: 📁 で読む・印の入ったファイルを預けとしても覚える → ' + short(r));
      ok(/W7A007:/.test(r.rows) && !r.rowSide && !r.missOpen,
         '★⑤ いつもの名前に _side が入った戸別が、一覧（物件）から黙って消えた／行に預けの印を持たせた → ' + short(r));
      ok(/預けの印が入った いつもの名前のファイルが 1件あります（一覧には出しています/.test(r.note) && !/現場から預かったファイルが/.test(r.note),
         '★⑤ 読み込んだあとの知らせで、一覧に出している戸別を「預かったファイル」と数える → ' + r.note.slice(0, 300));
      ok(/預けの印を外す/.test(r.run.text) && !r.fixed.side && r.fixed.ph === 'p1,p2,p3,p4,p5,p6' && r.fixed.amp === 'pcAmp' && /W7A007/.test(r.rows2),
         '★⑤ 一覧に出したあと、📮 で印を外せない／中身が変わった／行が消えた → ' + short(r));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v181_m_side_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
