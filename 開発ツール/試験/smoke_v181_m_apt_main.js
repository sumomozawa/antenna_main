/* 版181（メイン・組 m-apt）
   🏢 マンション管理の「まとめて消す」（帯の外の行 → ⇢ … を移して消す・aptMgStrayMerge／aptMgMovePhotos）と
   「🗑 消す（中身なし）」（aptMgStrayDrop）で、写真が減る・ファイルを消す道を塞いだ。
     A1 まとめる先（ファイル無し）をエディタで開いたまま、帯の外の行（ファイルあり）をまとめる → 一覧を閉じて古い画面で 💾
        → 行・物件に o1・z1 が残る（前は画面の中身で行が置き換わり z1 が消えた）・💾 は押せない・知らせに「画面は古くなりました」
     A2 両方にファイル・まとめる先を開いたまま → 古い画面で 💾 → 行・ファイル・物件に f1・z1
     A3 どちらにもファイルが無い（画面の順：開いて写真を足す → 一覧 → まとめる → 一覧を閉じる → 💾）→ 行・物件に o1・z1
     A4 A3 と同じで、💾 は押さずに画面で何か直す（自動保存）→ 行・物件に o1・z1
     A5 まとめる先（図面あり・ファイルあり＝開くと「💾 上書き保存」の行き先がそのファイル）を開いたまま、帯の外の行（ファイルに z1）をまとめる
        → 💾 上書き保存 は押せない・押してもファイル・物件は f1・z1 のまま（前は行き先が残り、古い画面がファイルを f1 だけで上書きした）
     B1 帯の外の行（同じ番号の手作りの行）が「💾 戸別ファイルへ反映」の結び付けでまとめる先と同じファイルに付いた
        → まとめてもそのファイルを消さない（f1・f2 と帯の外の行の z1）・預けた写真を読み直せる（miss 0）
     B2 B1 と同じで、まとめる先が「ファイルから読む」行 → ファイルが残る・物件に f1・f2
     B3 「🗑 消す（中身なし）」で、まとめる先と同じファイルに付いた行 → 「ファイルごと消す」を出さない・ファイルが残る
     C1 帯の外の行（ファイルに z1）を開いて y1 を足して一覧へ戻る → まとめる先（ファイルあり）へ → ファイル・物件に f1・y1・z1
     C2 C1 と同じで、まとめる先にファイルが無い（ファイルを引き取る）→ ファイル・行・物件に y1・z1
     D1 帯の外の行が暗号（.hyb）で、開いて戻った → 止めて知らせる・.hyb を消さない
     D2 まとめる先が暗号（.hyb）→ 止めて知らせる・.hyb の外側へ平文で写真を書かない・帯の外のファイルも消さない
     D3 台帳で作った世帯（平文の行）が同じ番号の .hyb に結び付いた → 読んだ中身で止める・両方のファイルが残る
     D4 帯の外の手作りの行（平文の行・写真 y1）が .hyb に結び付いた → 読んだ中身で止める・.hyb を消さない・行も残る
     D5 まとめる先が暗号の行（物件の行・ファイル無し）→ 止めて知らせる・帯の外の行が残る
     E  まとめる先（ファイルあり）を開いて f1 の名前・調書の印を直し f2 を消して一覧へ → まとめる → 行は直したまま（f1 の名前・印・f2 なし）＋z1
     F  帯の外の行（📁・図面あり）を開いたまま → まとめる先（ファイル無し・o1）がそのファイルを引き取る
        → 古い画面の 💾 上書き保存 は押せない・押してもファイルは o1・z1 のまま・預けた o1 を読み直せる（miss 0）
     G1 まとめる先の行はファイルを指しているが、そのファイルが無い（ほかのPCで消した・名前を替えた）
        → 止めて知らせる・帯の外の行・ファイル・物件の z1 が残る（前は「同じファイル」と決めて写真を移さないまま行を消した）
     G2 まとめる先が別のフォルダで、そのフォルダの許可がまだ無い → 先に許可を取ってからまとめる（f1・z1。止めない・行を消して z1 を置き去りにしない）
     G3 「🗑 消す（中身なし）」で、まとめる先と同じファイルかどうか確かめられない（フォルダを比べられない）
        → 「ファイルごと消す」を出さない・ファイルが残る（同じファイルなら世帯の写真が消える）
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★
   フォルダは試験の中で作る作り物。工事フォルダはつながない（フォルダを選ぶ画面は「閉じた」にする）。
   使い方: node smoke_v181_m_apt_main.js [メイン index.html]　（ONLY=A1,B3 で場面を絞れる） */
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

const B = 'W7A007';            // 建物の管理番号（世帯は -01・-02。帯の外の行は枝番なし＝元の1行）
const T1 = B + '-01';

/* ページの中で使う道具 */
const SETUP = `
  /* 作り物のフォルダ。書くときは close で中身が入る。__hooks.getFile(name) が文字を返せばその中身を読ませる。
     __hooks.write(name, text) は書いた直後に呼ぶ。 */
  window.__mk = function(name, files){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __removed: [], __writes: [], __mt: {}, __hooks: {} };
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
  /* 写真の入っているものの写真ID（並べて , でつなぐ）。文字（ファイルの中身）でも行の data でもよい */
  window.__pids = t => { try{ const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return ((j && j.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(読めない)'; } };
  /* 名前だけの空の枠の写真ID */
  window.__slots = t => { try{ const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return ((j && j.chosho_photos) || []).filter(p => p && !p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(読めない)'; } };
  /* 物件（の写し）の中の、その管理番号の戸別の写真ID（物件に入れる縮小版のID） */
  window.__pay = (snap, no) => { const c = ((snap && snap.cases) || []).find(c => c && c.payload && c.payload.chosho_mgmt_no === no);
    return c ? __pids(c.payload) : '(戸別が無い)'; };
  /* エディタに出ている写真の写真ID */
  window.__ed = () => (Array.isArray(STATE.photos) ? STATE.photos : []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
  /* 📁 フォルダで読んだ行と同じ形の行（写真は常駐させない）を一覧に足す */
  window.__fileRow = async (dir, name) => {
    const fh = await dir.getFileHandle(name); const f = await fh.getFile();
    const row = buildListRow(name, f.lastModified, JSON.parse(await f.text()), fh);
    row._dir = dir; row._name = name; row._dirPath = ''; row._size = f.size;
    slimListRow(row, true); _listRows.push(row); return row;
  };
  /* 物件を開いた（工事フォルダはつないでいない。フォルダを選ぶ画面は「閉じた」） */
  window.__proj = id => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null; _editingRow = null;
    _currentProject = { id, name: '令和８年度戸別受信設備設置工事（その１）', cases: [] };
    _projDirHandle = null;
    window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
  };
  /* アパートの世帯（受付台帳で作った行） */
  window.__unit = (i, extra) => createManualRow(Object.assign({ chosho_mgmt_no: '${B}-0' + i, chosho_cust_name: '10' + i + '号',
    apt_units: '2', apt_idx: String(i), apt_bldg: 'B-${B}', apt_name: 'みさわ荘', apt_room: '10' + i }, extra || {}), 'manual');
  /* 世帯のファイルの中身 */
  window.__unitFile = (i, photos, extra) => JSON.stringify(Object.assign({ chosho_mgmt_no: '${B}-0' + i, chosho_cust_name: '10' + i + '号',
    apt_units: '2', apt_idx: String(i), apt_bldg: 'B-${B}', apt_name: 'みさわ荘', apt_room: '10' + i, chosho_photos: photos }, extra || {}), null, 2);
  /* 帯の外の行（元の1行）のファイルの中身 */
  window.__strayFile = photos => JSON.stringify({ chosho_mgmt_no: '${B}', chosho_cust_name: 'みさわ荘', chosho_cust_addr: '三沢市1-2',
    chosho_photos: photos }, null, 2);
  /* エディタで開いて写真を足し、「💾 物件に保存」（工事フォルダはつながない） */
  window.__addPhoto = async (row, photos) => {
    await openCaseInEditor(row);
    STATE.photos = (Array.isArray(STATE.photos) ? STATE.photos.filter(p => p && p.dataUri) : []).concat(photos);
    await overwriteSaveCurrentToProject();
  };
  /* 🏢 マンション管理を開いて、帯の外の行の「⇢ … を移して消す」を押す（終わるまで待つ） */
  window.__merge = async () => {
    aptMgOpen('B-${B}');
    const btn = document.querySelector('#aptmg-ov [data-amgstray="merge"]');
    const text = btn ? btn.textContent : '';
    if(btn) await aptMgStrayMerge(btn.dataset.amgs);
    aptMgClose();
    return text;
  };
  /* 開いている戸別を保存する（元のファイルがあれば「💾 上書き保存」、無ければ「💾 物件に保存」）→ 物件の保存 */
  window.__save = async () => {
    if(_loadedOrigin && _loadedOrigin.fileHandle) await overwriteSaveCurrent(); else await overwriteSaveCurrentToProject();
    await projSaveNow();
  };
  /* 別のPCが前に保存した物件（disk）と、この端末の物件をまとめた結果 */
  window.__mergeOther = async disk => {
    const cap = captureMarks();
    try { await prepareProjectThumbs(true); } catch(_){}
    const base = (await projIdbGet(_currentProject.id)) || { id: _currentProject.id, name: _currentProject.name };
    return mergeProjectSnapshots(disk, buildProjectSnapshot(base), cap);
  };
  window.__row = no => (_listRows || []).find(r => r && r.data && r.data.chosho_mgmt_no === no) || null;
  window.__nos = () => (_listRows || []).map(r => r && r.data && r.data.chosho_mgmt_no).sort().join(',');
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
async function openMain(label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const said = [];
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => { said.push({ type: d.type(), msg: d.message() }); d.accept().catch(()=>{}); });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await page.goto(MAIN);
  await page.waitForFunction(() => typeof aptMgOpen === 'function' && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await page.evaluate(SETUP);
  said.length = 0;
  return { ctx, page, said };
}
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
const alerts = said => said.filter(s => s.type === 'alert').map(s => s.msg);
const confirms = said => said.filter(s => s.type === 'confirm').map(s => s.msg);
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
const brief = o => JSON.stringify(o === undefined ? null : o).slice(0, 300);
const MORE = `
  window.__big = (id, seed) => { const cv = document.createElement('canvas'); cv.width = 900; cv.height = 700; const x = cv.getContext('2d');
    const im = x.createImageData(900, 700); let s = seed * 7919; for(let i = 0; i < im.data.length; i++){ s = (s * 1103515245 + 12345) & 0x7fffffff; im.data[i] = (i % 4 === 3) ? 255 : (s >> 8) & 255; }
    x.putImageData(im, 0, 0); return { id, label: '写真' + id, dataUri: cv.toDataURL('image/jpeg', 0.6) }; };
  window.__files = list => Object.keys(list.__files).sort().map(n => n + ':' + __pids(list.__files[n])).join(' ');
  /* 画面の操作に近い形：一覧へ戻る（openListView）・一覧を閉じる（closeListView）・💾 ボタン */
  window.__toList = () => { openListView(); };
  window.__back = () => { closeListView(); };
  window.__btnSave = async () => { projSyncEditorToRow(true); await overwriteSaveCurrent(); };
  window.__btn = () => { const b = document.getElementById('btn-save-overwrite') || {}; return { text: b.textContent, disabled: !!b.disabled }; };
  window.__other = async () => { const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual'); await openCaseInEditor(other); };
  /* 🏢 を開いて、帯の外の行の「🗑 消す（中身なし）」を押す。ファイルを消すかの窓（lgDelDialog）が出たら「ファイルごと消す」を選ぶ */
  window.__drop = async () => {
    aptMgOpen('B-${B}');
    const btn = document.querySelector('#aptmg-ov [data-amgstray="drop"]');
    const o = { text: btn ? btn.textContent : '', dlg: false };
    if(btn){
      let done = false;
      const p = aptMgStrayDrop(btn.dataset.amgs).then(() => { done = true; });
      for(let i = 0; i < 100 && !done; i++){
        await new Promise(r => setTimeout(r, 20));
        const f = document.getElementById('lgdel-file');
        if(f){ o.dlg = true; f.click(); break; }
      }
      await p;
    }
    aptMgClose();
    return o;
  };
  window.__fmt = arr => (arr || []).filter(p => p && p.dataUri).map(p => p.id + ':' + p.label + ':' + !!p.chosho).join(' ');
`;

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const go = async (label, fn, check, arg) => {
    if(!want(label)) return;
    const { ctx, page, said } = await openMain(label);
    await page.evaluate(MORE);
    const r = await run(page, fn, Object.assign({ B, T1 }, arg || {}));
    console.log(label, brief(r), JSON.stringify(alerts(said).map(m => m.slice(0, 160))));
    ok(!(r && r.error), label + ' 止まった → ' + (r && r.error));
    if(r && !r.error){ try { check(r, said); } catch(e){ fails.push(label + ' 確かめが止まった: ' + e.message); } }
    await ctx.close();
  };
  const said1 = (said, re) => alerts(said).some(m => re.test(m));

  // ---- A1 まとめる先（ファイル無し）を開いたまま、帯の外の行（ファイルあり）をまとめる → 古い画面で 💾
  await go('A1', async ({ B, T1 }) => {
    const o = {};
    __proj('x-a1');
    const T = __unit(1); __unit(2);
    await openCaseInEditor(T);
    STATE.photos = (STATE.photos || []).filter(p => p && p.dataUri).concat([__ph('o1', '#c33')]);
    projAutoSaveEdit(); __toList(); await projSaveNow();
    const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    await __fileRow(list, B + '.json');
    await projSaveNow();
    o.open = _editingRow === T;
    o.btn = await __merge();
    o.afterMerge = __pids(T.data);
    __back();
    o.save = __btn();
    await __btnSave();                              // 押せないはずのボタンを、それでも押した形
    o.row = __pids(T.data); o.files = __files(list);
    await projSaveNow();
    o.idb = __pay(await projIdbGet(_currentProject.id), T1);
    return o;
  }, (r, said) => {
    ok(r.open && /移して消す/.test(r.btn) && r.afterMerge === 'o1,z1', 'A1 試験の前提: まとめる先を開いたまま、まとめた → ' + short(r));
    ok(r.row === 'o1,z1' && r.idb === 'o1,z1', '★A1 古い画面で保存したら、移した写真が行・物件から消えた → ' + short(r));
    ok(r.files === B + '.json:o1,z1', '★A1 引き取ったファイルの写真が o1・z1 でない → ' + short(r.files));
    ok(r.save.disabled, '★A1 まとめたあとも、古い画面の 💾 が押せる → ' + short(r.save));
    ok(said1(said, /画面は古くなりました/), '★A1 開いていた画面が古くなったことを知らせていない');
  });

  // ---- A2 両方にファイル・まとめる先を開いたまま → 古い画面で 💾
  await go('A2', async ({ B, T1 }) => {
    const o = {};
    __proj('x-a2');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3')]), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await openCaseInEditor(T); markEditorDirty(); __toList();
    await projSaveNow();
    o.open = _editingRow === T; o.origin = !!_loadedOrigin;
    o.btn = await __merge();
    o.afterMerge = __pids(T.data);
    __back();
    o.save = __btn();
    await __btnSave();
    o.row = __pids(T.data); o.files = __files(list);
    await projSaveNow();
    o.idb = __pay(await projIdbGet(_currentProject.id), T1);
    return o;
  }, (r) => {
    ok(r.open && r.afterMerge === 'f1,z1', 'A2 試験の前提 → ' + short(r));
    ok(r.row === 'f1,z1' && r.idb === 'f1,z1', '★A2 古い画面で保存したら、移した写真が行・物件から消えた → ' + short(r));
    ok(r.files === T1 + '.json:f1,z1', '★A2 まとめる先のファイルが f1・z1 でない → ' + short(r.files));
    ok(r.save.disabled, '★A2 まとめたあとも、古い画面の 💾 上書き保存 が押せる → ' + short(r.save));
  });

  // ---- A3 どちらにもファイルが無い（画面の順）→ 一覧を閉じて 💾
  // ---- A4 同じで、💾 は押さずに何か直す（自動保存）
  for(const lb of ['A3', 'A4']){
    await go(lb, async ({ B, T1, lb }) => {
      const o = {};
      __proj('x-' + lb);
      const T = __unit(1); __unit(2);
      await openCaseInEditor(T);
      STATE.photos = (STATE.photos || []).filter(p => p && p.dataUri).concat([__ph('o1', '#c33')]);
      projAutoSaveEdit(); __toList(); await projSaveNow();
      const S = createManualRow({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__ph('z1', '#33c')] }, 'manual');
      S._photoCount = 1; S._photosKnown = true;
      await projSaveNow();
      o.btn = await __merge();
      o.afterMerge = __pids(T.data);
      __back();
      o.save = __btn();
      if(lb === 'A3') await __btnSave();
      else { projAutoSaveEdit(); }               // 何か直した（自動保存）
      await projSaveNow();
      o.row = __pids(T.data);
      o.idb = __pay(await projIdbGet(_currentProject.id), T1);
      o.nos = __nos();
      return o;
    }, (r) => {
      ok(/移して消す/.test(r.btn) && r.afterMerge === 'o1,z1' && r.nos.indexOf(B + ',') < 0, lb + ' 試験の前提 → ' + short(r));
      ok(r.row === 'o1,z1' && r.idb === 'o1,z1', '★' + lb + ' 古い画面の保存で、移した写真 z1 がどこにも無くなった → ' + short(r));
      ok(r.save.disabled, '★' + lb + ' まとめたあとも、古い画面の 💾 が押せる → ' + short(r.save));
    }, { lb });
  }

  // ---- B1 同じ番号の手作りの行が、結び付け（lgwbAttachFrom）でまとめる先と同じファイルに付いた → まとめて消す
  await go('B1', async ({ B, T1 }) => {
    const o = {};
    __proj('x-b1');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__big('f1', 1), __big('f2', 2)]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2);
    await openCaseInEditor(T); markEditorDirty(); __toList();         // 世帯を開いて一覧へ戻った（行が写真を持つ）
    const S = createManualRow({ chosho_mgmt_no: T1, chosho_cust_name: '101号' }, 'manual');
    S.data = Object.assign({}, S.data, { chosho_photos: [__big('z1', 9)] }); S._photoCount = 1;
    const res = await lgwbAttachFrom(list, false);
    o.attach = { hit: res.hit, sameName: S._name === T._name, sameDir: S._dir === T._dir };
    o.btn = await __merge();
    o.files = __files(list); o.removed = list.__removed.slice();
    o.T = __pids(T.data);
    const tb = await rowPhotosWithOriginals(T);
    o.takeBack = tb ? { got: tb.got, miss: tb.miss } : null;
    return o;
  }, (r, said) => {
    ok(r.attach.sameName && r.attach.sameDir && /移して消す/.test(r.btn), 'B1 試験の前提: 2つの行が同じファイルに付いた → ' + short(r));
    ok(r.removed.length === 0 && r.files === T1 + '.json:f1,f2,z1', '★B1 まとめる先と同じファイルを消した／写真が足りない → ' + short(r));
    ok(r.T === 'f1,f2,z1' && r.takeBack && r.takeBack.miss === 0, '★B1 まとめる先の行の元の写真を読み直せない → ' + short(r));
    ok(said1(said, /写真 1 枚を W7A007-01\.json へ移しました/), '★B1 同じファイルの写真まで「移しました」と数えた → ' + short(alerts(said)));
  });

  // ---- B2 同じファイル・まとめる先が「ファイルから読む」行
  await go('B2', async ({ B, T1 }) => {
    const o = {};
    __proj('x-b2');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), __ph('f2', '#c3c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2);
    const S = createManualRow({ chosho_mgmt_no: T1, chosho_cust_name: '101号', chosho_photos: [__ph('f1', '#3c3')] }, 'manual');
    S._photoCount = 1;
    S._dir = list; S._name = T1 + '.json'; S._dirPath = ''; S.fileHandle = await list.getFileHandle(T1 + '.json');
    await projSaveNow();
    o.slim = !!T._slim;
    o.btn = await __merge();
    o.files = __files(list); o.removed = list.__removed.slice();
    await projSaveNow();
    o.idb = __pay(await projIdbGet(_currentProject.id), T1);
    return o;
  }, (r) => {
    ok(r.slim && /移して消す/.test(r.btn), 'B2 試験の前提 → ' + short(r));
    ok(r.removed.length === 0 && r.files === T1 + '.json:f1,f2' && r.idb === 'f1,f2', '★B2 まとめる先と同じファイルを消した → ' + short(r));
  });

  // ---- B3 「🗑 消す（中身なし）」で、まとめる先と同じファイルに付いた行
  await go('B3', async ({ B, T1 }) => {
    const o = {};
    __proj('x-b3');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), __ph('f2', '#c3c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2);
    const S = createManualRow({ chosho_mgmt_no: T1, chosho_cust_name: '101号' }, 'manual');
    const res = await lgwbAttachFrom(list, false);
    o.attach = { hit: res.hit, sameName: S._name === T._name };
    o.drop = await __drop();
    o.files = __files(list); o.removed = list.__removed.slice();
    o.nos = __nos();
    return o;
  }, (r) => {
    ok(r.attach.sameName && /消す/.test(r.drop.text), 'B3 試験の前提: 中身の無い行がまとめる先と同じファイルに付いた → ' + short(r));
    ok(!r.drop.dlg, '★B3 まとめる先と同じファイルなのに「ファイルごと消す」の窓を出した → ' + short(r));
    ok(r.removed.length === 0 && r.files === T1 + '.json:f1,f2', '★B3 まとめる先のファイルを消した → ' + short(r));
    ok(r.nos === [T1, B + '-02'].join(','), '★B3 中身の無い行を一覧から外していない／世帯が消えた → ' + short(r.nos));
  });

  // ---- B4 帯の外の行が、同じフォルダを別の掴み方（別のハンドル）で持っている → 同じファイルなら消さない
  await go('B4', async ({ B, T1 }) => {
    const o = {};
    __proj('x-b4');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), __ph('f2', '#c3c')]) });
    const list2 = __mk('リスト', {});
    list2.__files = list.__files;                                    // 同じフォルダを別に掴んだ（中身は同じ）
    list.isSameEntry = async x => x === list || x === list2;
    list2.isSameEntry = async x => x === list || x === list2;
    const T = await __fileRow(list, T1 + '.json'); __unit(2);
    const S = createManualRow({ chosho_mgmt_no: T1, chosho_cust_name: '101号', chosho_photos: [__ph('z1', '#33c')] }, 'manual');
    S._photoCount = 1;
    S._dir = list2; S._name = T1 + '.json'; S._dirPath = ''; S.fileHandle = await list2.getFileHandle(T1 + '.json');
    o.btn = await __merge();
    o.files = __files(list); o.removed = list.__removed.concat(list2.__removed);
    return o;
  }, (r) => {
    ok(/移して消す/.test(r.btn), 'B4 試験の前提 → ' + short(r));
    ok(r.removed.length === 0 && r.files === T1 + '.json:f1,f2,z1', '★B4 別の掴み方の同じファイルを消した → ' + short(r));
  });

  // ---- C1・C2 帯の外の行にだけある写真 y1（ファイルにはまだ無い）
  for(const tf of ['C1', 'C2']){
    await go(tf, async ({ B, T1, tf }) => {
      const o = {};
      __proj('x-' + tf);
      const files = { [B + '.json']: __strayFile([__ph('z1', '#33c')]) };
      if(tf === 'C1') files[T1 + '.json'] = __unitFile(1, [__ph('f1', '#3c3')]);
      const list = __mk('リスト', files);
      const T = (tf === 'C1') ? await __fileRow(list, T1 + '.json') : __unit(1);
      __unit(2);
      const S = await __fileRow(list, B + '.json');
      await openCaseInEditor(S);
      STATE.photos = (STATE.photos || []).filter(p => p && p.dataUri).concat([__ph('y1', '#cc3')]);
      projAutoSaveEdit(); __toList();
      await projSaveNow();
      o.pre = { S: __pids(S.data), Sfile: __pids(list.__files[B + '.json']) };
      o.btn = await __merge();
      o.files = __files(list);
      o.T = __pids(T.data);
      await projSaveNow();
      o.idb = __pay(await projIdbGet(_currentProject.id), T1);
      return o;
    }, (r, said) => {
      ok(r.pre.S === 'y1,z1' && r.pre.Sfile === 'z1' && /写真2枚/.test(r.btn), tf + ' 試験の前提: 帯の外の行にだけ y1 がある → ' + short(r));
      const want3 = (tf === 'C1') ? 'f1,y1,z1' : 'y1,z1';
      const wantF = (tf === 'C1') ? (T1 + '.json:' + want3) : (B + '.json:' + want3);
      ok(r.files === wantF && r.idb === want3, '★' + tf + ' 帯の外の行にだけあった写真 y1 が、まとめたあとどこにも無い → ' + short(r));
      if(tf === 'C2') ok(r.T === want3, '★C2 まとめる先の行が y1・z1 を持たない → ' + short(r.T));
      ok(said1(said, /写真 2 枚/) || tf === 'C2', '★' + tf + ' 知らせの枚数が合わない');
    }, { tf });
  }

  // ---- D1 帯の外の行が暗号（.hyb）・開いて戻った
  await go('D1', async ({ B, T1 }) => {
    const o = {};
    __proj('x-d1');
    const env = await encryptHybrid({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_cust_addr: '三沢市1-2', chosho_photos: [__ph('h1', '#393')] }, 'pw1234');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3')]), [B + '.hyb']: JSON.stringify(env) });
    await __fileRow(list, T1 + '.json'); __unit(2);
    const S = await __fileRow(list, B + '.hyb');
    setSessionPassword('pw1234');
    await openCaseInEditor(S);
    markEditorDirty(); __toList();
    o.cnt = lgPhotoCountOf(S.data, S);
    o.btn = await __merge();
    o.files = __files(list); o.removed = list.__removed.slice();
    o.nos = __nos();
    return o;
  }, (r, said) => {
    ok(r.cnt === 1 && /移して消す/.test(r.btn), 'D1 試験の前提: 開いて戻ると写真の枚数が出る → ' + short(r));
    ok(r.removed.length === 0 && /W7A007\.hyb/.test(r.files) && r.nos.indexOf(B + ',') >= 0, '★D1 暗号の帯の外の行のファイルを消した → ' + short(r));
    ok(said1(said, /暗号をかけた戸別/), '★D1 暗号の戸別はここで移せないと知らせていない');
  });

  // ---- D2 まとめる先が暗号（.hyb）
  await go('D2', async ({ B, T1 }) => {
    const o = {};
    __proj('x-d2');
    const env = await encryptHybrid(JSON.parse(__unitFile(1, [__ph('h1', '#393')])), 'pw1234');
    const list = __mk('リスト', { [T1 + '.hyb']: JSON.stringify(env), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.hyb'); __unit(2);
    await __fileRow(list, B + '.json');
    setSessionPassword('pw1234');
    o.inBand = !!aptBldgKeyOfRow(T);
    o.btn = await __merge();
    const F = JSON.parse(list.__files[T1 + '.hyb']);
    o.files = Object.keys(list.__files).sort().join(','); o.removed = list.__removed.slice();
    o.plainTop = __pids(F);
    o.enc = __pids(await decryptHybrid(F, 'pw1234'));
    return o;
  }, (r, said) => {
    ok(r.inBand && /移して消す/.test(r.btn), 'D2 試験の前提 → ' + short(r));
    ok(r.plainTop === '' && r.enc === 'h1', '★D2 暗号の戸別ファイルの外側へ平文で写真を書いた → ' + short(r));
    ok(r.removed.length === 0 && r.files === [B + '.json', T1 + '.hyb'].sort().join(','), '★D2 帯の外のファイルを消した → ' + short(r));
    ok(said1(said, /暗号をかけた戸別/), '★D2 暗号の戸別はここで移せないと知らせていない');
  });

  // ---- D3 台帳で作った世帯（平文の行）が、同じ番号の .hyb に結び付いた
  await go('D3', async ({ B, T1 }) => {
    const o = {};
    __proj('x-d3');
    const env = await encryptHybrid(JSON.parse(__unitFile(1, [__ph('h1', '#393')])), 'pw1234');
    const list = __mk('リスト', { [T1 + '.hyb']: JSON.stringify(env), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = __unit(1); __unit(2);
    await __fileRow(list, B + '.json');
    await lgwbAttachFrom(list, false);
    o.attach = { name: T._name, type: T.fileType };
    o.btn = await __merge();
    const F = JSON.parse(list.__files[T1 + '.hyb']);
    o.files = Object.keys(list.__files).sort().join(','); o.removed = list.__removed.slice();
    o.plainTop = __pids(F);
    return o;
  }, (r, said) => {
    ok(r.attach.name === T1 + '.hyb' && r.attach.type === 'plain' && /移して消す/.test(r.btn), 'D3 試験の前提: 平文の行が .hyb に結び付いた → ' + short(r));
    ok(r.plainTop === '' && r.removed.length === 0 && r.files === [B + '.json', T1 + '.hyb'].sort().join(','),
       '★D3 .hyb の外側へ平文で写真を書いた／帯の外のファイルを消した → ' + short(r));
    ok(said1(said, /暗号をかけた戸別ファイル/), '★D3 暗号の戸別ファイルはここで移せないと知らせていない');
  });

  // ---- D4 帯の外の手作りの行（平文の行・写真 y1）が .hyb に結び付いた
  await go('D4', async ({ B, T1 }) => {
    const o = {};
    __proj('x-d4');
    const env = await encryptHybrid({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__ph('h1', '#393')] }, 'pw1234');
    const list = __mk('リスト', { [B + '.hyb']: JSON.stringify(env) });
    __unit(1); __unit(2);
    const S = createManualRow({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__ph('y1', '#cc3')] }, 'manual');
    S._photoCount = 1; S._photosKnown = true;
    await lgwbAttachFrom(list, false);
    o.attach = { name: S._name, type: S.fileType };
    o.btn = await __merge();
    o.files = Object.keys(list.__files).sort().join(','); o.removed = list.__removed.slice();
    o.nos = __nos(); o.S = __pids(S.data);
    return o;
  }, (r, said) => {
    ok(r.attach.name === B + '.hyb' && r.attach.type === 'plain' && /移して消す/.test(r.btn), 'D4 試験の前提: 平文の行が .hyb に結び付いた → ' + short(r));
    ok(r.removed.length === 0 && r.files === B + '.hyb' && r.nos.indexOf(B + ',') >= 0 && r.S === 'y1',
       '★D4 写真を移さないまま .hyb を消した／行を消した → ' + short(r));
    ok(said1(said, /暗号をかけた戸別ファイル/), '★D4 暗号の戸別ファイルはここで移せないと知らせていない');
  });

  // ---- D5 まとめる先が暗号の行（物件の行・ファイル無し）
  await go('D5', async ({ B, T1 }) => {
    const o = {};
    __proj('x-d5');
    const env = await encryptHybrid(JSON.parse(__unitFile(1, [__ph('h1', '#393')])), 'pw1234');
    const T = buildListRow(T1 + '.hyb', 1, env, null); _listRows.push(T);
    __unit(2);
    const S = createManualRow({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__ph('z1', '#33c')] }, 'manual');
    S._photoCount = 1; S._photosKnown = true;
    o.inBand = !!aptBldgKeyOfRow(T);
    o.btn = await __merge();
    o.nos = __nos(); o.S = __pids(S.data);
    return o;
  }, (r, said) => {
    ok(r.inBand && /移して消す/.test(r.btn), 'D5 試験の前提 → ' + short(r));
    ok(r.nos.indexOf(B + ',') >= 0 && r.S === 'z1', '★D5 暗号の行へまとめて、帯の外の行（z1）を消した → ' + short(r));
    ok(said1(said, /暗号をかけた戸別/), '★D5 暗号の戸別はここで移せないと知らせていない');
  });

  // ---- E まとめる先で直した名前・調書の印・画面で消した写真が、ファイルの中身に戻らない
  await go('E', async ({ B, T1 }) => {
    const o = {};
    __proj('x-e');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [Object.assign(__ph('f1', '#3c3'), { chosho: true }), __ph('f2', '#c3c')]),
                                 [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await openCaseInEditor(T);
    STATE.photos = STATE.photos.filter(p => p && p.dataUri && p.id !== 'f2').map(p => p.id === 'f1' ? Object.assign({}, p, { label: '玄関（直した）', chosho: false }) : p);
    projAutoSaveEdit(); __toList(); await __other();
    o.pre = __fmt(T.data.chosho_photos);
    o.btn = await __merge();
    o.row = __fmt(T.data.chosho_photos).split(' ').sort().join(' ');
    o.file = __pids(list.__files[T1 + '.json']);
    await openCaseInEditor(T);
    o.ed = __fmt(STATE.photos).split(' ').sort().join(' ');
    return o;
  }, (r) => {
    ok(r.pre === 'f1:玄関（直した）:false' && /移して消す/.test(r.btn), 'E 試験の前提 → ' + short(r));
    ok(r.row === 'f1:玄関（直した）:false z1:写真z1:false' && r.ed === r.row,
       '★E まとめたら、行で直した名前・調書の印が戻った／画面で消した写真が戻った → ' + short(r));
    ok(r.file === 'f1,f2,z1', '★E まとめる先のファイルの写真が減った → ' + short(r.file));
  });

  // ---- E2 まとめる先で消した写真と同じ写真（同じ写真ID）が帯の外の行にある → 移した写真として行に残す（減らさない向き）
  await go('E2', async ({ B, T1 }) => {
    const o = {};
    __proj('x-e2');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), __ph('z1', '#33c')]),
                                 [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await openCaseInEditor(T);
    STATE.photos = STATE.photos.filter(p => p && p.dataUri && p.id !== 'z1');
    projAutoSaveEdit(); __toList(); await __other();
    o.pre = __pids(T.data);
    o.btn = await __merge();
    o.row = __pids(T.data);
    o.files = __files(list);
    return o;
  }, (r) => {
    ok(r.pre === 'f1' && /移して消す/.test(r.btn), 'E2 試験の前提 → ' + short(r));
    ok(r.files === T1 + '.json:f1,z1' && r.row === 'f1,z1', '★E2 帯の外の行から移した z1 を、まとめる先の行が持たない（次の保存で消える） → ' + short(r));
  });

  // ---- F 帯の外の行（📁・図面あり）を開いたまま → まとめる先（ファイル無し・o1）がそのファイルを引き取る → 古い画面の 💾 上書き保存
  await go('F', async ({ B, T1 }) => {
    const o = {};
    __proj('x-f');
    const T = __unit(1); __unit(2);
    T.data = Object.assign({}, T.data, { chosho_photos: [__big('o1', 3)] }); T._photoCount = 1; T._photosKnown = true; T._thumbs = undefined;
    await projSaveNow();
    const list = __mk('リスト', { [B + '.json']: JSON.stringify(Object.assign(JSON.parse(JSON.stringify(PRESETS.standard)),
      { chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__big('z1', 5)] }), null, 2) });
    const S = await __fileRow(list, B + '.json');
    await openCaseInEditor(S);
    o.origin = !!(_loadedOrigin && _loadedOrigin.fileHandle); o.editing = _editingRow === S;
    __toList();
    o.btn = await __merge();
    o.afterMerge = { files: __files(list), parked: !!T._parked, save: __btn() };
    __back();
    await __btnSave();
    o.files = __files(list);
    const tb = await rowPhotosWithOriginals(T);
    o.takeBack = tb ? { got: tb.got, miss: tb.miss } : null;
    return o;
  }, (r, said) => {
    ok(r.origin && r.editing && /移して消す/.test(r.btn) && r.afterMerge.files === B + '.json:o1,z1' && r.afterMerge.parked,
       'F 試験の前提: 帯の外の行を開いたまま、まとめる先がファイルを引き取って o1 を預けた → ' + short(r));
    ok(r.afterMerge.save.disabled, '★F 消した行の古い画面の 💾 上書き保存 が押せる → ' + short(r.afterMerge.save));
    ok(r.files === B + '.json:o1,z1' && r.takeBack && r.takeBack.miss === 0,
       '★F 古い画面の 💾 上書き保存 で、まとめる先の元の写真 o1 が無くなった → ' + short(r));
  });

  // ---- A5 まとめる先（図面あり・ファイルあり）を開いたまま → まとめる → 古い画面の 💾 上書き保存
  //      図面のある行は、開くと「💾 上書き保存」の行き先（_loadedOrigin）がそのファイルになる（図面の無い行はプリセットで開くので行き先が無い）
  await go('A5', async ({ B, T1 }) => {
    const o = {};
    __proj('x-a5');
    const tj = Object.assign(JSON.parse(JSON.stringify(PRESETS.standard)), JSON.parse(__unitFile(1, [__ph('f1', '#3c3')])));
    const list = __mk('リスト', { [T1 + '.json']: JSON.stringify(tj, null, 2), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await openCaseInEditor(T);
    o.origin = !!(_loadedOrigin && _loadedOrigin.fileHandle); o.open = _editingRow === T;
    o.save0 = __btn();
    markEditorDirty(); __toList();
    await projSaveNow();
    o.btn = await __merge();
    o.afterMerge = { files: __files(list), save: __btn(), origin: !!_loadedOrigin };
    __back();
    await __btnSave();                              // 押せないはずのボタンを、それでも押した形
    o.files = __files(list); o.row = __pids(T.data);
    await projSaveNow();
    o.idb = __pay(await projIdbGet(_currentProject.id), T1);
    return o;
  }, (r, said) => {
    ok(r.origin && r.open && !r.save0.disabled && /移して消す/.test(r.btn) && r.afterMerge.files === T1 + '.json:f1,z1',
       'A5 試験の前提: まとめる先（図面あり）を開くと 💾 上書き保存 の行き先がそのファイル → ' + short(r));
    ok(r.afterMerge.save.disabled && !r.afterMerge.origin, '★A5 まとめたあとも、古い画面の 💾 上書き保存 が押せる → ' + short(r.afterMerge));
    ok(r.files === T1 + '.json:f1,z1' && r.row === 'f1,z1' && r.idb === 'f1,z1',
       '★A5 古い画面の 💾 上書き保存 で、まとめる先のファイルから移した写真 z1 が消えた → ' + short(r));
    ok(said1(said, /画面は古くなりました/), '★A5 開いていた画面が古くなったことを知らせていない');
  });

  // ---- G1 まとめる先の行が指すファイルが無い（ほかのPCで消した・名前を替えた）→ 止める
  await go('G1', async ({ B, T1 }) => {
    const o = {};
    __proj('x-g1');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3')]), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const T = await __fileRow(list, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await projSaveNow();
    delete list.__files[T1 + '.json'];               // ほかのPCで消した
    o.btn = await __merge();
    o.files = __files(list); o.removed = list.__removed.slice();
    o.nos = __nos();
    await projSaveNow();
    const snap = await projIdbGet(_currentProject.id);
    o.idbS = __pay(snap, B); o.idbT = __pay(snap, T1);
    return o;
  }, (r, said) => {
    ok(/移して消す/.test(r.btn), 'G1 試験の前提 → ' + short(r));
    ok(r.nos.indexOf(B + ',') >= 0 && r.idbS === 'z1', '★G1 写真を移さないまま、帯の外の行を一覧と物件から消した → ' + short(r));
    ok(r.removed.length === 0 && r.files === B + '.json:z1', '★G1 帯の外の行のファイルを消した／書き替えた → ' + short(r));
    ok(said1(said, /まとめられませんでした/) && said1(said, /見つからないか、読めませんでした/) && !said1(said, /へまとめました/),
       '★G1 止めたことを知らせていない（「まとめました」と言った） → ' + short(alerts(said)));
  });

  // ---- G2 まとめる先が別のフォルダで、そのフォルダの許可がまだ無い（開き直したあとなど）→ 先に許可を取ってまとめる
  await go('G2', async ({ B, T1 }) => {
    const o = {};
    __proj('x-g2');
    const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
    const tdir = __mk('世帯', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3')]) });
    const T = await __fileRow(tdir, T1 + '.json'); __unit(2); await __fileRow(list, B + '.json');
    await projSaveNow();
    // 許可がまだ無い：許可を求めるまで、ファイルを掴めない（Chrome は NotAllowedError）
    let perm = 'prompt'; o.asked = 0;
    const gfh = tdir.getFileHandle;
    tdir.queryPermission = async () => perm;
    tdir.requestPermission = async () => { o.asked++; perm = 'granted'; return perm; };
    tdir.getFileHandle = async (n, opt) => { if(perm !== 'granted'){ const e = new Error('NotAllowed'); e.name = 'NotAllowedError'; throw e; } return gfh(n, opt); };
    o.btn = await __merge();
    o.files = __files(list) + ' | ' + __files(tdir); o.removed = list.__removed.concat(tdir.__removed);
    o.nos = __nos(); o.T = __pids(T.data);
    return o;
  }, (r, said) => {
    ok(/移して消す/.test(r.btn), 'G2 試験の前提 → ' + short(r));
    ok(r.asked >= 1 && r.files === ' | ' + T1 + '.json:f1,z1' && r.removed.join(',') === B + '.json' && r.nos.indexOf(B + ',') < 0,
       '★G2 まとめる先のフォルダの許可を取らずに、まとめられなかった／写真を移さないまま行を消した → ' + short(r));
    ok(said1(said, /へまとめました/) && said1(said, /写真 1 枚を W7A007-01\.json へ移しました/), '★G2 知らせが合わない → ' + short(alerts(said)));
  });

  // ---- G3 「🗑 消す（中身なし）」で、同じファイルかどうか確かめられない（フォルダを比べられない）→ ファイルを消さない
  await go('G3', async ({ B, T1 }) => {
    const o = {};
    __proj('x-g3');
    const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), __ph('f2', '#c3c')]) });
    const list2 = __mk('リスト', {});
    list2.__files = list.__files;                                    // 同じフォルダを別に掴んだ（中身は同じ）
    list2.isSameEntry = async () => { const e = new Error('比べられない'); e.name = 'NotAllowedError'; throw e; };
    const T = await __fileRow(list, T1 + '.json'); __unit(2);
    const S = createManualRow({ chosho_mgmt_no: T1, chosho_cust_name: '101号' }, 'manual');
    S._dir = list2; S._name = T1 + '.json'; S._dirPath = ''; S.fileHandle = await list2.getFileHandle(T1 + '.json');
    o.drop = await __drop();
    o.files = __files(list); o.removed = list.__removed.concat(list2.__removed);
    o.nos = __nos();
    return o;
  }, (r, said) => {
    ok(/消す/.test(r.drop.text), 'G3 試験の前提: 中身の無い行が出ている → ' + short(r));
    ok(!r.drop.dlg, '★G3 同じファイルかどうか確かめられないのに「ファイルごと消す」の窓を出した → ' + short(r));
    ok(r.removed.length === 0 && r.files === T1 + '.json:f1,f2', '★G3 まとめる先と同じかもしれないファイルを消した → ' + short(r));
    ok(r.nos === [T1, B + '-02'].join(','), '★G3 中身の無い行を一覧から外していない／世帯が消えた → ' + short(r.nos));
    ok(confirms(said).some(m => /確かめられないので、ファイルは消しません/.test(m)), '★G3 ファイルを消さない訳を知らせていない → ' + short(confirms(said)));
  });

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v181_m_apt_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
