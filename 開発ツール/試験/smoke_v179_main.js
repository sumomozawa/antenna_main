/* 版179（メイン）
   アパートの「まとめて消す」（🏢 マンション管理 → 帯の外の行 → ⇢ … を移して消す・aptMgMovePhotos）で、写真が消える道を塞いだ。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① まとめる先にファイルが無く、帯の外の行にファイルがある（まとめる先がそのファイルを引き取る）
        a) まとめる先が自分の写真 O を持つ（フォルダをつないでいないときにエディタで足した＝行と物件にしか無い）
           → まとめたとき O もそのファイルへ和集合で入る（名前だけの空の枠も残る）・行も O と Z を持つ・
             別のPCの保存とまとめても O と Z・自動保存で物件に O と Z・開くと O と Z（図面は行のもの）・
             「💾 上書き保存」してもファイル・物件に O と Z・物件を開き直しても O と Z・知らせに「行にだけあった写真」
        b) 物件を開き直したあと（まとめる先の写真は物件の縮小版だけ）→ その縮小版もファイルへ入る（写真IDの無い古い写真も）・
           開き直しても残る
        c) まとめる先が写真を持たない → ファイルは1バイトも書き替えない（今までどおり引き取るだけ）・開くと Z
        d) 書いたあと読み返したら O が入っていない → ファイルは元の中身に戻す・行は消さない・まとめる先も前のまま
     ② どちらの行にもファイルが無い → 物件の縮小版を作り直す（自動保存で物件に O と Z・開き直しても O と Z）・
        この端末で直した印（別のPCの保存とまとめても O と Z）
     ③ まとめる先にもファイルがある
        a) まとめる先が行にだけ写真 O と図面の直しを持つ（エディタで直して一覧へ戻った・ファイルはまだ前のまま）
           → ファイルに F・O・Z（空の枠も残る）・元のファイルは消える・開くと F・O・Z と行の図面・
             「💾 上書き保存」してもファイルに F・O・Z・物件・別のPCの保存とまとめても F・O・Z
        b) まとめる先が「ファイルから読む」行（写真を持たない）→ ファイルに F・Z・行はそのまま（写真を持たせない）・開くと F・Z
        c) まとめる先が物件の縮小版を持つ（ファイルとつないだ物件の行）→ 写真IDの無い縮小版は足さない（同じ写真が2枚にならない）・
           写真IDのある縮小版で、ファイルに無いもの（そこにしか無い）は足す
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   フォルダは試験の中で作る作り物。工事フォルダはつながない（フォルダを選ぶ画面は「閉じた」にする）。
   使い方: node smoke_v179_main.js [メイン index.html の file:// URL]　（ONLY=①a,② で場面を絞れる） */
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

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['aptMgMovePhotos','aptMgStrayMerge','aptMgOpen','aptMgStrayInfo','prepareProjectThumbs','buildProjectSnapshot',
                    'mergeProjectSnapshots','captureMarks','applyProject','openCaseInEditor','overwriteSaveCurrent','overwriteSaveCurrentToProject'];
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION };
    });
    console.log('⓪前提', brief(r0));
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
  }

  // ---- ①a まとめる先にファイルが無い・帯の外の行にファイルがある・まとめる先が自分の写真を持つ ----
  if(want('①a')){
    const { ctx, page, said } = await openMain('①a');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-1a');
      const T = __unit(1, { amplifier: 'amp_1u45' }); __unit(2);       // 図面は行にだけある
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual');
      await __addPhoto(T, [__ph('o1', '#c33')]);                          // フォルダをつないでいないときに足した写真
      const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c'), { id: 's1', label: '玄関（まだ写真なし）', dataUri: null }]) });
      await __fileRow(list, B + '.json');
      await openCaseInEditor(other);
      await projSaveNow();
      o.pre = { T: __pids(T.data), Tfile: !!T.fileHandle, nos: __nos() };
      const disk0 = JSON.parse(JSON.stringify(await projIdbGet(_currentProject.id)));   // 別のPCが持っている、まとめる前の物件
      o.btn = await __merge();
      const F = () => list.__files[B + '.json'];
      o.file = __pids(F()); o.slot = __slots(F()); o.files = Object.keys(list.__files).sort().join(',');
      o.nos = __nos();
      o.row = { ph: __pids(T.data), cnt: lgPhotoCountOf(T.data, T), own: T._name === B + '.json' };
      o.other = __pay(await __mergeOther(disk0), T1);
      await projSaveNow();                                                // 自動保存
      o.idb = __pay(await projIdbGet(_currentProject.id), T1);
      await openCaseInEditor(T);                                          // 開く
      o.ed = __ed(); o.amp = (document.getElementById('amplifier') || {}).value;
      await __save();                                                     // 「💾 上書き保存」
      o.saved = { file: __pids(F()), slot: __slots(F()), idb: __pay(await projIdbGet(_currentProject.id), T1) };
      await openCaseInEditor(other);
      await applyProject(await projIdbGet(_currentProject.id), { silent: true });   // 物件を開き直す
      o.reopen = __pids((__row(T1) || {}).data);
      return o;
    }, { B, T1 });
    const a = alerts(said), c = confirms(said);
    console.log('①a まとめる先にファイルが無い', brief(r));
    ok(!r.error, '①a止まった → ' + r.error);
    if(!r.error){
      const pre = r.pre.T === 'o1' && !r.pre.Tfile && /写真1枚/.test(r.btn) && r.nos === 'W0Z000,' + T1 + ',' + B + '-02';
      ok(pre, '①a 前提が違う（まとめる先に写真 o1・ファイル無し／帯の外の行が消える） → ' + short({ pre: r.pre, btn: r.btn, nos: r.nos }));
      ok(r.file === 'o1,z1' && r.files === B + '.json',
         '★①a まとめる先が引き取ったファイルに、まとめる先の写真が入らない（開いて保存すると消える） → ' + short({ file: r.file, files: r.files }));
      ok(r.slot === 's1', '①a ファイルの名前だけの空の枠が消えた → ' + r.slot);
      ok(r.row.ph === 'o1,z1' && r.row.cnt === 2 && r.row.own, '★①a まとめたあと、行の写真が o1・z1 でない → ' + short(r.row));
      ok(r.other === 'o1,z1', '★①a 別のPCの保存とまとめると、まとめる先が前の写真のまま（まとめた写真が物件から消える） → ' + r.other);
      ok(r.idb === 'o1,z1', '★①a 自動保存で、物件に o1・z1 が入らない（古い縮小版のまま） → ' + r.idb);
      ok(r.ed === 'o1,z1', '★①a 開くと、まとめる先の写真 o1 が出ない（保存で消える） → ' + r.ed);
      ok(r.amp === 'amp_1u45', '★①a 開くと、まとめる先の行の図面が出ない（帯の外の行のファイルの中身が出る） → ' + r.amp);
      ok(r.saved.file === 'o1,z1' && r.saved.slot === 's1' && r.saved.idb === 'o1,z1',
         '★①a 開いて保存すると、ファイル・物件から写真が消える → ' + short(r.saved));
      ok(r.reopen === 'o1,z1', '★①a 物件を開き直すと、写真が o1・z1 でない → ' + r.reopen);
      ok(c.some(m => /まとめる先の世帯の中身は減りません/.test(m)), '①a 確かめの窓の文言が無い → ' + short(c));
      ok(a.some(m => /まとめました/.test(m) && /行にだけあった写真 1 枚も、このファイルへ入れました/.test(m)),
         '①a まとめる先の写真をファイルへ入れたことを知らせない → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ①b 物件を開き直したあと（まとめる先の写真は物件の縮小版だけ） ----
  if(want('①b')){
    const { ctx, page, said } = await openMain('①b');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-1b');
      let T = __unit(1); __unit(2);
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual');
      await __addPhoto(T, [__ph('o1', '#c33')]);
      await openCaseInEditor(other);
      await projSaveNow();
      await applyProject(await projIdbGet(_currentProject.id), { silent: true });   // 開き直した＝行は物件の縮小版だけ
      T = __row(T1);
      o.pre = { ph: __pids(T.data), thumb: !!T.data.chosho_photos_thumb, fp: !!T._fromProject };
      // 写真IDの無い古い写真の縮小版も持っている（これもここにしか無い）
      const OLD = __png('#c93');
      T.data = Object.assign({}, T.data, { chosho_photos: T.data.chosho_photos.concat([{ label: '古い写真', dataUri: OLD }]) });
      const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      await __fileRow(list, B + '.json');
      o.btn = await __merge();
      o.file = __pids(list.__files[B + '.json']);
      o.old = (JSON.parse(list.__files[B + '.json']).chosho_photos || []).filter(p => p && p.dataUri === OLD).length;
      o.nos = __nos();
      await projSaveNow();
      await applyProject(await projIdbGet(_currentProject.id), { silent: true });
      o.reopen = __pids((__row(T1) || {}).data);
      return o;
    }, { B, T1 });
    console.log('①b 物件の縮小版だけ', brief(r));
    ok(!r.error, '①b止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.ph === 'o1' && r.pre.thumb && r.pre.fp && /写真1枚/.test(r.btn), '①b 前提が違う（行は物件の縮小版 o1 だけ） → ' + short({ pre: r.pre, btn: r.btn }));
      ok(r.file.split(',').filter(x => x === 'o1' || x === 'z1').join(',') === 'o1,z1' && r.old === 1,
         '★①b まとめる先の縮小版（そこにしか無い o1・写真IDの無い古い写真）が、引き取ったファイルに入らない → ' + short({ file: r.file, old: r.old }));
      ok(r.reopen === r.file && r.reopen.split(',').length === 3 && r.nos === 'W0Z000,' + T1 + ',' + B + '-02',
         '★①b 物件を開き直すと、写真が o1・古い写真・z1 でない → ' + short({ reopen: r.reopen, file: r.file, nos: r.nos }));
    }
    await ctx.close();
  }

  // ---- ①c まとめる先が写真を持たない（今までどおり、ファイルを引き取るだけ） ----
  if(want('①c')){
    const { ctx, page } = await openMain('①c');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-1c');
      const T = __unit(1); __unit(2);
      const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      const before = list.__files[B + '.json'];
      await __fileRow(list, B + '.json');
      await projSaveNow();
      o.btn = await __merge();
      o.same = list.__files[B + '.json'] === before;
      o.writes = list.__writes.length;
      o.row = { ph: __pids(T.data), cnt: lgPhotoCountOf(T.data, T), own: T._name === B + '.json' };
      o.nos = __nos();
      await openCaseInEditor(T);
      o.ed = __ed();
      return o;
    }, { B, T1 });
    console.log('①c まとめる先が写真を持たない', brief(r));
    ok(!r.error, '①c止まった → ' + r.error);
    if(!r.error){
      ok(r.same && r.writes === 0, '★①c まとめる先が写真を持たないのに、ファイルを書き替えた → ' + short({ same: r.same, writes: r.writes }));
      ok(r.row.own && r.row.cnt === 1 && r.nos === T1 + ',' + B + '-02' && r.ed === 'z1',
         '★①c ファイルを引き取ったあと、写真 z1 が出ない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ①d 書いたあと読み返したら足りない → 元の中身に戻す・何も消さない ----
  if(want('①d')){
    const { ctx, page, said } = await openMain('①d');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-1d');
      const T = __unit(1); __unit(2);
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual');
      await __addPhoto(T, [__ph('o1', '#c33')]);
      const list = __mk('リスト', { [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      const before = list.__files[B + '.json'];
      await __fileRow(list, B + '.json');
      await openCaseInEditor(other);
      await projSaveNow();
      let wrote = 0;
      list.__hooks.write = () => { wrote++; };
      list.__hooks.getFile = () => (wrote === 1 ? before : undefined);  // 書いた直後に読み返すと、前の中身（o1 が無い）
      o.btn = await __merge();
      list.__hooks = {};
      o.same = list.__files[B + '.json'] === before;
      o.writes = list.__writes.length;
      o.removed = list.__removed.slice();
      o.nos = __nos();
      o.T = { ph: __pids(T.data), dir: !!T._dir, fh: !!T.fileHandle, name: T._name || '' };
      return o;
    }, { B, T1 });
    const a = alerts(said);
    console.log('①d 読み返したら足りない', brief(r), brief(a.filter(m => /まとめ/.test(m))));
    ok(!r.error, '①d止まった → ' + r.error);
    if(!r.error){
      ok(r.same && r.writes === 2 && !r.removed.length, '★①d 読み返して足りないのに、ファイルを元の中身に戻さない → ' + short({ same: r.same, writes: r.writes, removed: r.removed }));
      ok(r.nos === 'W0Z000,' + B + ',' + T1 + ',' + B + '-02', '★①d まとめられなかったのに、帯の外の行を消した → ' + r.nos);
      ok(r.T.ph === 'o1' && !r.T.dir && !r.T.fh, '★①d まとめられなかったのに、まとめる先がファイルを引き取った → ' + short(r.T));
      ok(a.some(m => /まとめられませんでした/.test(m) && /入っていませんでした/.test(m) && /元の中身に戻しました/.test(m)),
         '①d まとめられなかったこと・戻したことを知らせない → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ② どちらの行にもファイルが無い ----
  if(want('②')){
    const { ctx, page } = await openMain('②');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-2');
      const T = __unit(1); __unit(2);
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual');
      await __addPhoto(T, [__ph('o1', '#c33')]);
      const S = createManualRow({ chosho_mgmt_no: B, chosho_cust_name: 'みさわ荘', chosho_photos: [__ph('z1', '#33c')] }, 'manual');
      S._photoCount = 1; S._photosKnown = true;
      await openCaseInEditor(other);
      await projSaveNow();
      o.pre = { thumbs: (T._thumbs || []).map(p => p.id).join(','), idb: __pay(await projIdbGet(_currentProject.id), T1) };
      const disk0 = JSON.parse(JSON.stringify(await projIdbGet(_currentProject.id)));
      o.btn = await __merge();
      o.row = __pids(T.data);
      o.nos = __nos();
      o.other = __pay(await __mergeOther(disk0), T1);
      await projSaveNow();
      o.idb = __pay(await projIdbGet(_currentProject.id), T1);
      await applyProject(await projIdbGet(_currentProject.id), { silent: true });
      o.reopen = __pids((__row(T1) || {}).data);
      return o;
    }, { B, T1 });
    console.log('② どちらにもファイルが無い', brief(r));
    ok(!r.error, '②止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.thumbs === 'o1' && r.pre.idb === 'o1' && /写真1枚/.test(r.btn) && r.row === 'o1,z1' && r.nos === 'W0Z000,' + T1 + ',' + B + '-02',
         '② 前提が違う（まとめる先の縮小版 o1・行は o1・z1 になる） → ' + short({ pre: r.pre, btn: r.btn, row: r.row, nos: r.nos }));
      ok(r.idb === 'o1,z1', '★② 物件に古い縮小版（o1）しか入らない（移した z1 が物件から消える） → ' + r.idb);
      ok(r.reopen === 'o1,z1', '★② 物件を開き直すと、移した写真 z1 がどこにも無い → ' + r.reopen);
      ok(r.other === 'o1,z1', '★② 別のPCの保存とまとめると、まとめる先が前の写真のまま（この端末で直した印が無い） → ' + r.other);
    }
    await ctx.close();
  }

  // ---- ③a まとめる先にもファイルがある・行にだけ写真と図面の直しがある ----
  if(want('③a')){
    const { ctx, page, said } = await openMain('③a');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-3a');
      const list = __mk('リスト', {
        [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3'), { id: 's1', label: '玄関（まだ写真なし）', dataUri: null }], { amplifier: 'amp_3u43' }),
        [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      const T = await __fileRow(list, T1 + '.json');
      __unit(2);
      await __fileRow(list, B + '.json');
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家' }, 'manual');
      // 開いて写真 o1 を足し、図面を直して、一覧へ戻った（ファイルはまだ前のまま）
      await openCaseInEditor(T);
      STATE.photos = STATE.photos.concat([__ph('o1', '#c33')]);
      document.getElementById('amplifier').value = 'amp_1u45';
      projSyncEditorToRow(true);
      await openCaseInEditor(other);
      await projSaveNow();
      o.pre = { row: __pids(T.data), file: __pids(list.__files[T1 + '.json']), amp: T.data.amplifier };
      const disk0 = JSON.parse(JSON.stringify(await projIdbGet(_currentProject.id)));
      o.btn = await __merge();
      const F = () => list.__files[T1 + '.json'];
      o.file = __pids(F()); o.slot = __slots(F()); o.files = Object.keys(list.__files).sort().join(',');
      o.nos = __nos();
      o.row = { ph: __pids(T.data), cnt: lgPhotoCountOf(T.data, T) };
      o.other = __pay(await __mergeOther(disk0), T1);
      await projSaveNow();
      o.idb = __pay(await projIdbGet(_currentProject.id), T1);
      await openCaseInEditor(T);
      o.ed = __ed(); o.amp = (document.getElementById('amplifier') || {}).value;
      await __save();
      o.saved = { file: __pids(F()), slot: __slots(F()), amp: (JSON.parse(F()) || {}).amplifier, idb: __pay(await projIdbGet(_currentProject.id), T1) };
      return o;
    }, { B, T1 });
    const a = alerts(said);
    console.log('③a まとめる先にもファイル', brief(r));
    ok(!r.error, '③a止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.row === 'f1,o1' && r.pre.file === 'f1' && r.pre.amp === 'amp_1u45' && /写真1枚/.test(r.btn),
         '③a 前提が違う（行は f1・o1／ファイルは f1） → ' + short({ pre: r.pre, btn: r.btn }));
      ok(r.file === 'f1,o1,z1' && r.files === T1 + '.json', '★③a まとめる先のファイルに、行にだけある写真 o1 が入らない／元のファイルが残る → ' + short({ file: r.file, files: r.files }));
      ok(r.slot === 's1', '③a ファイルの名前だけの空の枠が消えた → ' + r.slot);
      ok(r.row.ph === 'f1,o1,z1' && r.row.cnt === 3 && r.nos === 'W0Z000,' + T1 + ',' + B + '-02', '★③a まとめたあと、行の写真が f1・o1・z1 でない → ' + short({ row: r.row, nos: r.nos }));
      ok(r.ed === 'f1,o1,z1', '★③a 開くと、行の古い写真だけが出る（保存でファイルの写真が消える） → ' + r.ed);
      ok(r.amp === 'amp_1u45', '★③a 開くと、行にだけある図面の直しが出ない（ファイルの古い図面が出る） → ' + r.amp);
      ok(r.saved.file === 'f1,o1,z1' && r.saved.slot === 's1' && r.saved.amp === 'amp_1u45' && r.saved.idb === 'f1,o1,z1',
         '★③a 開いて保存すると、ファイル・物件から写真が消える → ' + short(r.saved));
      ok(r.idb === 'f1,o1,z1' && r.other === 'f1,o1,z1', '★③a 物件（自動保存・別のPCの保存とまとめる）に f1・o1・z1 が入らない → ' + short({ idb: r.idb, other: r.other }));
      ok(a.some(m => /まとめました/.test(m) && /行にだけあった写真 1 枚も、このファイルへ入れました/.test(m)),
         '③a 行にだけあった写真をファイルへ入れたことを知らせない → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ③b まとめる先が「ファイルから読む」行（写真を持たない） ----
  if(want('③b')){
    const { ctx, page } = await openMain('③b');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-3b');
      const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [__ph('f1', '#3c3')]), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      const T = await __fileRow(list, T1 + '.json');
      __unit(2);
      await __fileRow(list, B + '.json');
      await projSaveNow();
      o.btn = await __merge();
      o.file = __pids(list.__files[T1 + '.json']); o.files = Object.keys(list.__files).sort().join(',');
      o.row = { slim: !!T._slim, ph: T.data.chosho_photos, cnt: lgPhotoCountOf(T.data, T), known: !!T._photosKnown };
      await openCaseInEditor(T);
      o.ed = __ed();
      return o;
    }, { B, T1 });
    console.log('③b ファイルから読む行', brief(r));
    ok(!r.error, '③b止まった → ' + r.error);
    if(!r.error){
      ok(r.file === 'f1,z1' && r.files === T1 + '.json', '★③b まとめる先のファイルが f1・z1 でない／元のファイルが残る → ' + short({ file: r.file, files: r.files }));
      ok(r.row.slim && r.row.ph === null && r.row.cnt === 2 && !r.row.known, '③b 「ファイルから読む」行に写真を持たせた（または枚数が違う） → ' + short(r.row));
      ok(r.ed === 'f1,z1', '★③b 開くと f1・z1 が出ない → ' + r.ed);
    }
    await ctx.close();
  }

  // ---- ③c まとめる先が物件の縮小版を持つ（ファイルとつないだ物件の行） ----
  if(want('③c')){
    const { ctx, page } = await openMain('③c');
    const r = await run(page, async ({ B, T1 }) => {
      const o = {};
      __proj('pj179-3c');
      const F0 = __png('#3c3');                       // 写真IDの無い古い写真（ファイル）
      const list = __mk('リスト', { [T1 + '.json']: __unitFile(1, [{ label: '古い写真', dataUri: F0 }]), [B + '.json']: __strayFile([__ph('z1', '#33c')]) });
      const T = await __fileRow(list, T1 + '.json');
      __unit(2);
      await __fileRow(list, B + '.json');
      // 物件の行（写真は物件の縮小版）：F0 の縮小版（写真IDなし＝ファイルの写真と突き合わせられない）と、ここにしか無い o2 の縮小版
      T.data = Object.assign({}, T.data, { chosho_photos: [{ label: '古い写真', dataUri: __png('#3d3') }, __ph('o2', '#c3c')], chosho_photos_thumb: true });
      T._slim = false; T._fromProject = true;
      await projSaveNow();
      o.btn = await __merge();
      const j = JSON.parse(list.__files[T1 + '.json']);
      const real = (j.chosho_photos || []).filter(p => p && p.dataUri);
      o.n = real.length;
      o.ids = real.filter(p => p.dataUri !== F0).map(p => p.id).sort().join(',');
      o.f0 = real.filter(p => p.dataUri === F0).length;
      return o;
    }, { B, T1 });
    console.log('③c 物件の縮小版を持つ行', brief(r));
    ok(!r.error, '③c止まった → ' + r.error);
    if(!r.error){
      ok(r.f0 === 1 && r.ids === 'o2,z1' && r.n === 3,
         '★③c 写真IDの無い縮小版を足した（同じ写真が2枚）／そこにしか無い縮小版 o2 を足さない → ' + short(r));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v179_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
