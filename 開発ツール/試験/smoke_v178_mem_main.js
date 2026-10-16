/* 版178（メイン）3回目の見直し：メモリ
   版178 で、物件の保存（ensureRowThumbs）が行の写真を縮小版に置き換えるのをやめたため、ファイルの無い行は
   開いているあいだ元の写真をずっと持っていた（写真40枚で約52MB。前は縮小版だけで約2.5MB）。
   ★決まり★ 戸別ファイル（管理番号.json）に入れて、読み返して写真IDと中身が同じと確かめた元の写真は、行に持たせない
   （物件の縮小版に置き換え、預け先を覚える＝rowParkOriginals）。要るときにそのファイルから読み直す（rowTakeBackOriginals）。
   ほかのどこにも無い写真は、決して手放さない。読み直せない写真は縮小版のまま出し、戸別ファイルの元の写真を縮小版で上書きしない。
     ㉟ メモリ：10戸×4枚（約1MB）を物件の行に足して保存 → 行が持つ元の写真 0・縮小版だけ・JS のメモリの増えが小さい・開き直すと元の写真が出る
     ㊱ 預けた写真を読み直す：開くと元の写真（行にも戻る・印は前のまま）・別の戸別を開くとまた軽くなる・プレビュー／写真の書き出し／工事調書の
        一覧は元の写真を使う（「小さい写真」と言わない）・開いて消した写真はファイルからも消える
     ㊲ 確かめられない写真は預けない：a) 読み返した中身が違う（1字でも）　b) 写真IDの無い写真　c) 読み返せない
     ㊳ 読み直せないときは縮小版のまま・元の写真を縮小版で上書きしない：a) 壊れたファイル → 知らせ・書かない → 直ったら元の写真＋現場の写真
        b) 台帳で作った行（物件から開いた行ではない）にファイルが付いた形。読めないまま保存すると縮小版の印が外れる → それでも開き直したとき
           「💾 上書き保存」にしない（縮小版で原寸を上書きしない）
     ㊴ 預けたあとで管理番号を付け替える → 新しいファイルに元の写真・預け先も移る・開くと元の写真
     ㊵ 共有ファイルとまとめて行が作り直されても、預け先を持ち越す（a 預けたまま　b 開いて見ている途中＝元の写真も持ち越し、あとで確かめて軽くする
        c 作り直した行に写真の配列が無い（縮小版を作れないまま物件に入った）＝前の行の写真を戻すとき、預け先も渡す）
     ㊶ 「💾 戸別ファイルへ反映」：a) 新しく作ったファイルに預ける　b) 名前の付け替えで預け先も移る
     ㊷ 見ただけ・取り込みで元の写真を持っている行は、物件の保存のときファイルを確かめてから軽くする（ファイルから消えていれば持ち続ける・止まらない）
        c 開いている戸別へ 📥（工事フォルダとつながっている）→ 書き戻しで預けても、画面には元の写真を出す
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   道具（作り物のフォルダ __mk など）は smoke_v178_main.js と同じもの（ここに写してある。opt.blob・opt.tamper・__memRows はこの試験のため）。
   使い方: node smoke_v178_mem_main.js [メイン index.html の file:// URL]　（ONLY=㉟,㊱ で場面を絞れる。MEM_ONLY=1 ONLY=㉟ でメモリの数だけ出す） */
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
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

const NO = '2612MKM077';
const NO2 = '2612MKM078';
const PN = '令和８年度戸別受信設備設置工事（その１）';

/* ページの中で使う道具 */
const SETUP = `
  /* 作り物のフォルダ。書くときは close で中身が入る。
     opt.ci＝Windows・Mac のように、名前の大文字・小文字を区別しないフォルダ（同じ名前なら同じファイル）。
       ファイルを引く・読む・書く・消すときだけ区別しない。isSameEntry は Chromium と同じく、渡した名前の文字どおりに比べる
       （大文字・小文字が違えば「別のもの」と答える。同じファイルでも）。
     opt.resolve＝Chromium と同じ resolve(ハンドル) を持つ（中にあるファイル・フォルダなら道のりの配列、無ければ null）。
     __unreadable[名前]＝その回数だけ、読むときに NotReadableError（同期ソフトが書き替えている最中など）。 opt.blob＝中身を Blob で持つ（JS のメモリに数えない＝本物のディスクと同じ。㉟ のメモリを測る場面）。
     opt.tamper(中身, 名前)＝書いた中身を替えて入れる（書いたあとの読み返しが合わない場面。㊲）。 */
  window.__mk = function(name, files, subs, opt){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __unreadable: {} };
    const ci = !!(opt && opt.ci), blob = !!(opt && opt.blob), tamper = (opt && opt.tamper) || null;
    const key = n => { if(!ci || (n in d.__files)) return n;
      const k = Object.keys(d.__files).filter(k => k.toLowerCase() === String(n).toLowerCase())[0];
      return (k === undefined) ? n : k; };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        const k = key(n);
        if(!(k in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        if(d.__unreadable[k] > 0){ d.__unreadable[k]--; const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; throw e; }
        const t = d.__files[k], isB = (t instanceof Blob);
        return { name:n, size: isB ? t.size : new Blob([t]).size, lastModified: Date.parse('2026-10-01T01:00:00Z'),
                 text: async () => isB ? await t.text() : t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { const k = key(n); if(tamper) buf = tamper(buf, k);
                   if(blob){ d.__files[k] = new Blob([buf]); d.__writes.push({ n: k, len: buf.length }); }
                   else { d.__files[k] = buf; d.__writes.push({ n: k, t: buf }); } } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(key(n) in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async (n, o2) => {
        if(!d.__subs[n]){ if(!(o2 && o2.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n, {}, {}, opt || null); }
        return d.__subs[n]; },
      removeEntry: async n => { const k = key(n); if(!(k in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(k); delete d.__files[k]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
    if(opt && opt.resolve) d.resolve = async h => {
      const walk = (dd, pre) => {
        if(h && h.kind === 'directory' && h === dd) return pre;
        if(h && h.kind === 'file' && h.__d === dd) return pre.concat([h.name]);
        for(const s of Object.keys(dd.__subs)){ const r = walk(dd.__subs[s], pre.concat([s])); if(r) return r; }
        return null;
      };
      return walk(d, []);
    };
    return d;
  };
  /* 雑音の入った JPEG（seed で毎回同じ絵）。w×h と画質で大きさを決める */
  window.__jpeg = function(w, h, q, seed){
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); const im = x.createImageData(w, h);
    let s = (seed * 2654435761) >>> 0;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    for(let i = 0; i < im.data.length; i += 4){
      const v = (rnd() * 90) | 0;
      im.data[i] = (60 + seed * 23 + v) & 255; im.data[i + 1] = (110 + v * 2) & 255; im.data[i + 2] = (150 + seed * 7) & 255; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return cv.toDataURL('image/jpeg', q);
  };
  /* フォルダの中のファイルを全部（下のフォルダも）「リスト/xxx.json」の形で並べる */
  window.__tree = (d, pre) => { pre = pre || ''; let out = Object.keys(d.__files).map(n => pre + n);
    Object.keys(d.__subs).forEach(s => { out = out.concat(window.__tree(d.__subs[s], pre + s + '/')); }); return out.sort(); };
  /* フォルダの中の全部のファイルの写真 */
  window.__allPhotos = d => { let out = [];
    Object.keys(d.__files).forEach(n => { out = out.concat(window.__photosOf(d.__files[n]) || []); });
    Object.keys(d.__subs).forEach(s => { out = out.concat(window.__allPhotos(d.__subs[s])); }); return out; };
  /* エディタの電話の欄を直す（打ち込んだのと同じ知らせを出す） */
  window.__setField = (id, v) => { const el = document.getElementById(id);
    el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); };
  window.__setTel = v => window.__setField('chosho_cust_tel', v);
  window.__bytes = u => Math.floor(String(u).split(',')[1].length * 3 / 4);
  window.__edge = u => new Promise(res => { const im = new Image(); im.onload = () => res(Math.max(im.naturalWidth, im.naturalHeight)); im.onerror = () => res(0); im.src = u; });
  /* エディタの 📷 まとめて取り込み から写真を入れる（利用者が写真を選んだのと同じ道） */
  window.__addPhoto = async function(uri, name){
    const blob = await (await fetch(uri)).blob();
    const file = new File([blob], name || 'genba.jpg', { type: 'image/jpeg' });
    const inp = document.getElementById('photo-bulk-file');
    const btn = document.getElementById('btn-photo-bulk');
    const before = (STATE.photos || []).filter(p => p && p.dataUri).length;
    const dt = new DataTransfer(); dt.items.add(file); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    for(let i = 0; i < 600; i++){
      await new Promise(r => setTimeout(r, 50));
      if((STATE.photos || []).filter(p => p && p.dataUri).length > before && !(btn && btn.disabled)) break;
    }
    await new Promise(r => setTimeout(r, 100));
    const real = (STATE.photos || []).filter(p => p && p.dataUri);
    return real[real.length - 1] || null;
  };
  /* 「💾 物件に保存」を押す（ボタンの中身を確かめてから、押したのと同じ関数を待つ） */
  window.__pressSave = async function(){
    const b = document.getElementById('btn-save-overwrite');
    const o = { text: b ? b.textContent : '', disabled: b ? b.disabled : null, pressed: false };
    if(b && !b.disabled && b.onclick){ o.pressed = true; await b.onclick(); }   // 押せないボタンは押さない（利用者と同じ）
    return o;
  };
  window.__pids = t => { try { const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return (j.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); } catch(_){ return '(読めない)'; } };
  window.__photosOf = t => { try { const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return (j.chosho_photos || []).filter(p => p && p.dataUri); } catch(_){ return null; } };
  window.__proj178 = (id, name, cases) => { const now = new Date().toISOString();
    return { schema: PROJ_SCHEMA, id, name, createdAt: now, updatedAt: now, cases: cases || [], ledger: {}, takeout: {}, review: {} }; };
  window.__openProj = async (P) => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null; _projDirHandle = null;
    try { await projHandleDelete(P.id + ':dir'); } catch(_){}
    await projIdbPut(P);
    await applyProject(P, { silent: true });
  };
  /* 共有ファイル（物件ファイル）の作り物。__otherDeviceSaves でほかの端末が保存した形にする */
  window.__mkShared = function(P){
    window.__disk = JSON.stringify(P);
    return { kind: 'file', name: 'shared.json',
      getFile: async () => ({ name: 'shared.json', size: window.__disk.length, lastModified: Date.now(), text: async () => window.__disk }),
      createWritable: async () => { let buf = ''; return { write: async t => { buf += t; }, close: async () => { window.__disk = buf; } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' };
  };
  window.__openShared = async (P) => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null; _projDirHandle = null;
    P.updatedAt = '2026-10-15T00:00:00.000Z';
    const pfh = __mkShared(P);
    await projIdbPut(P);
    await applyProject(P, { silent: true, fileHandle: pfh });
    try { writeSharedBak = async () => {}; } catch(_){}
    return pfh;
  };
  window.__otherDeviceSaves = (no2, edit) => {
    const other = JSON.parse(window.__disk);
    other.updatedAt = new Date(Date.now() + 60000).toISOString();
    if(no2) other.cases.push({ caseId: 'cX' + no2, file: 'リスト/' + no2 + '.json', lastModified: 0,
      payload: { chosho_mgmt_no: no2, chosho_cust_name: '別の端末 様', chosho_status: 'in_progress', work_type: '' } });
    if(edit) edit(other);
    window.__disk = JSON.stringify(other);
  };
  window.__diskPhotos = (no) => { const p = JSON.parse(window.__disk);
    const c = p.cases.filter(c => (c.payload || {}).chosho_mgmt_no === no)[0];
    const pl = (c && c.payload) || {};
    return { n: (pl.chosho_photos || []).filter(x => x && x.dataUri).length, count: pl.chosho_photo_count }; };
  window.__abortPicker = () => { window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; }; };
  /* 一覧の行（_listRows）が持っている写真の大きさ（同じ文字列は1回だけ数える）。
     orig＝元の写真（この端末の縮小版ではないもの）、thumb＝縮小版。単位は文字数（base64）。 */
  window.__memRows = () => {
    const seen = new Set(); let orig = 0, thumb = 0, nOrig = 0, nThumb = 0;
    (_listRows || []).forEach(r => {
      const th = new Set(((r && r._thumbs) || []).map(t => t && t.dataUri).filter(Boolean));
      const add = (u, isThumb) => { if(!u || seen.has(u)) return; seen.add(u);
        if(isThumb){ thumb += u.length; nThumb++; } else { orig += u.length; nOrig++; } };
      (((r && r.data) || {}).chosho_photos || []).forEach(p => { if(p && p.dataUri) add(p.dataUri, th.has(p.dataUri)); });
      ((r && r._thumbs) || []).forEach(t => { if(t && t.dataUri) add(t.dataUri, true); });
    });
    return { origMB: Math.round(orig / 1e4) / 100, thumbMB: Math.round(thumb / 1e4) / 100, nOrig, nThumb };
  };
  window.__idbPhotos = async (pid, no) => {
    const p = await projIdbGet(pid);
    const c = ((p && p.cases) || []).filter(c => ((c.payload || {}).chosho_mgmt_no || '') === no)[0];
    const pl = (c && c.payload) || {};
    return { photos: (pl.chosho_photos || []).filter(x => x && x.dataUri), thumb: !!pl.chosho_photos_thumb, count: pl.chosho_photo_count };
  };
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
  await page.waitForFunction(() => typeof applyProject === 'function' && typeof overwriteSaveCurrent === 'function'
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);
  await page.evaluate(SETUP);
  said.length = 0;
  return { ctx, page, said };
}
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
const alerts = said => said.filter(s => s.type === 'alert').map(s => s.msg);
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ㊱ 預けた写真を読み直す（開く・見る・消す） ----
  if(want('㊱')){
    const { ctx, page, said } = await openMain('㊱');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pa', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 301);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      const first = (row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
      const o = { parked: rowHasParkedThumb(row), flag: !!row.data.chosho_photos_thumb, rowLen: (first.dataUri || '').length, srcLen: src.length,
                  edShown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src };
      // 預けたまま（開いていない）で見るところ：プレビュー・写真の書き出し・工事調書の一覧
      await openCaseInEditor(row2);
      o.afterSwitch = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      const pv = await loadRowPhotos(row);
      o.preview = { n: pv.photos.length, orig: !!(pv.photos[0] && pv.photos[0].dataUri === src), thumb: !!pv.thumb };
      const cp = await _getCasePhotos(row, null, []);
      const cpr = (cp.photos || []).filter(p => p && p.dataUri);           // 名前だけの枠は数えない
      o.export = { n: cpr.length, orig: !!(cpr[0] && cpr[0].dataUri === src), thumbOnly: !!cp.thumbOnly };
      const ct = cdlPhotoText({ row, printable: true, locked: false });
      o.cdl = { t: ct.t, warn: ct.warn };
      o.stillParked = rowHasParkedThumb(row);
      // 開き直す → エディタにも行にも元の写真。印は預ける前のまま（無い）
      await openCaseInEditor(row);
      const now = (row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
      o.reopen = { shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src, rowOrig: now.dataUri === src,
                   flag: !!row.data.chosho_photos_thumb, parkedNow: rowHasParkedThumb(row), remembers: !!(row._parked && row._parked.map.size) };
      // 別の戸別を開く → また軽くなる（ファイルを確かめてから）
      await openCaseInEditor(row2);
      o.again = { parked: rowHasParkedThumb(row), held: __memRows().nOrig, writes: list.__writes.length };
      // 開いて消す → ファイルからも消える（利用者が消した）。台帳で作った行で見る
      // （物件から開いた行は、ファイルの写真を画面の消しで消さない＝⑨c の決まりのまま）
      const rowM = createManualRow({ chosho_mgmt_no: NO3, chosho_cust_name: '台帳 様' }, 'manual');
      await openCaseInEditor(rowM);
      const src2 = __jpeg(900, 700, 0.85, 302);
      const ed2 = await __addPhoto(src2, 'q.jpg');
      await __pressSave();
      o.manual = { parked: rowHasParkedThumb(rowM), file: (__photosOf(root.__files[NO3 + '.json'] || '{}') || []).length, held: __memRows().nOrig };
      await openCaseInEditor(row2);
      await openCaseInEditor(rowM);
      o.manualReopen = ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src2;
      STATE.photos = (STATE.photos || []).filter(p => !(p && ed2 && p.id === ed2.id));
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      await __pressSave();
      o.deleted = { file: (__photosOf(root.__files[NO3 + '.json']) || []).length, row: (rowM.data.chosho_photos || []).filter(p => p && p.dataUri).length,
                    parked: rowHasParkedThumb(rowM) };
      return o;
    }, { NO, NO2, PN });
    console.log('㊱預けた写真を読み直す', short(r));
    ok(!r.error, '㊱止まった → ' + r.error);
    if(!r.error){
      ok(r.edShown && r.parked && r.flag && r.rowLen > 0 && r.rowLen < r.srcLen, '㊱試験の前提: 保存で預けて、行は縮小版 → ' + short(r));
      ok(r.afterSwitch.parked && r.afterSwitch.held === 0, '★㊱別の戸別を開いても、行が元の写真を持っている → ' + short(r.afterSwitch));
      ok(r.preview.n === 1 && r.preview.orig && !r.preview.thumb, '★㊱プレビューが、預けた元の写真ではなく縮小版を出す → ' + short(r.preview));
      ok(r.export.n === 1 && r.export.orig && !r.export.thumbOnly, '★㊱写真の書き出しが、預けた元の写真ではなく縮小版を使う → ' + short(r.export));
      ok(!/小さい写真/.test(r.cdl.t) && !r.cdl.warn, '★㊱預けただけの行を「小さい写真」と言う → ' + short(r.cdl));
      ok(r.stillParked, '★㊱見るだけで、行が元の写真を持ってしまう → ' + short(r));
      ok(r.reopen.shown && r.reopen.rowOrig && !r.reopen.flag && !r.reopen.parkedNow && r.reopen.remembers,
         '★㊱開き直したとき、元の写真が出ない・行に戻らない・印が預ける前と違う・預け先を忘れた → ' + short(r.reopen));
      ok(r.again.parked && r.again.held === 0 && r.again.writes === 1, '★㊱開いて戻ったあと、また軽くならない（または書き直した） → ' + short(r.again));
      ok(r.manual.parked && r.manual.file === 1 && r.manual.held === 0 && r.manualReopen, '㊱試験の前提: 台帳で作った行も預けて、開くと元の写真 → ' + short(r));
      ok(r.deleted.file === 0 && r.deleted.row === 0 && !r.deleted.parked, '★㊱開いて消した写真が、戸別ファイルに残る → ' + short(r.deleted));
    }
    ok(!alerts(said).some(m => /書き替えていません|読めませんでした/.test(m)), '★㊱書けなかった知らせが出た → ' + short(alerts(said).slice(-1)));
    await ctx.close();
  }

  // ---- ㊲ 確かめられない写真は預けない（元の写真を持ち続ける） ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('㊲' + m))){
    const { ctx, page, said } = await openMain('㊲' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      await __openProj(__proj178('pj178pb' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } }]));
      const row = _listRows[0];
      // a) 書いた中身が1字だけ違って戻ってくる（枚数は合う）　c) 読み返せない中身になる
      const tamper = mode === 'a' ? (t => { const i = t.indexOf('base64,') + 2000; return t.slice(0, i) + (t[i] === 'A' ? 'B' : 'A') + t.slice(i + 1); })
                   : mode === 'c' ? (t => t.slice(0, 40)) : null;
      const list = __mk('リスト', {}, {}, tamper ? { tamper } : null);
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 311);
      if(mode === 'b'){
        // 写真IDの無い写真（古いファイルから来た写真など。エディタで入れた写真には必ず写真IDが付く）→ ファイルに同じ中身があっても預けない
        row.data = Object.assign({}, row.data, { chosho_photos: [{ label: '写真IDなし', dataUri: src }] });
        row._photoCount = 1; row._thumbs = undefined;
        list.__files[NO + '.json'] = JSON.stringify({ chosho_mgmt_no: NO, chosho_photos: [{ label: '写真IDなし', dataUri: src }] }, null, 2);
        const n = await rowParkOriginals(row, await list.getFileHandle(NO + '.json'));
        const now = (row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
        return { n, rowOrig: now.dataUri === src, flag: !!row.data.chosho_photos_thumb, parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      }
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      const now = (row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
      const fp = __photosOf(list.__files[NO + '.json'] || '{}');
      return { writes: list.__writes.length, rowOrig: now.dataUri === src, flag: !!row.data.chosho_photos_thumb, parked: rowHasParkedThumb(row),
               held: __memRows().nOrig, file: fp ? { n: fp.length, same: !!(fp[0] && fp[0].dataUri === src), id: fp[0] && fp[0].id } : null, edId: ed && ed.id };
    }, { NO, PN, mode });
    const a = alerts(said);
    console.log('㊲' + mode + '確かめられない写真', short(r), short(a.slice(-1).map(m => m.slice(0, 120))));
    ok(!r.error, '㊲' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode !== 'b') ok(r.writes === 1, '㊲' + mode + '試験の前提: 戸別ファイルを1回書く → ' + short(r));
      if(mode === 'a') ok(r.file && r.file.n === 1 && !r.file.same && r.file.id === r.edId, '㊲a試験の前提: ファイルの中身が1字違う（写真IDと枚数は同じ） → ' + short(r.file));
      if(mode === 'b') ok(r.n === 0, '★㊲b写真IDの無い写真を預けた → ' + short(r));
      if(mode === 'c') ok(r.file === null && a.some(m => /読み返し|合いません/.test(m)), '㊲c試験の前提: 読み返せない・知らせる → ' + short(a.slice(-1)));
      ok(r.rowOrig && !r.flag && !r.parked && r.held === 1,
         '★㊲' + mode + '確かめられない写真を預けた（行から元の写真が消えた＝ほかのどこにも無いのに） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊳ 読み直せないときは縮小版のまま・ファイルの元の写真を縮小版で上書きしない ----
  for(const mode of ['a', 'b'].filter(m => want('㊳' + m))){
    const { ctx, page, said } = await openMain('㊳' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const cases = [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
                       payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }];
      if(mode === 'a') cases.unshift({ caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } });
      await __openProj(__proj178('pj178pc' + mode, PN, cases));
      // b) 台帳で作った行（物件から開いた行ではない＝_fromProject でない）
      const row = (mode === 'b') ? createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual')
                                 : _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      if(mode === 'b') __setField('amplifier', 'amp_3u43');          // 図面あり＝次に開くと listLoadRow（💾 上書き保存 の判定）を通る
      const src = __jpeg(900, 700, 0.85, 321);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      const o = { parked: rowHasParkedThumb(row), drawing: lgHasDrawing(row), fromProject: !!row._fromProject };
      if(mode === 'b'){
        // 「💾 戸別ファイルへ反映」の結び付けで、行にそのファイルが付く（開くと「💾 上書き保存」になりうる行）
        try { await listDirForget(); } catch(_){}
        _listDirHandle = null;
        const res = await lgwbAttachFrom(root, false);
        o.attached = !!(res && res.hit >= 1 && row.fileHandle && row._dir === root);
      }
      await openCaseInEditor(row2);
      const good = root.__files[NO + '.json'];
      root.__files[NO + '.json'] = good.slice(0, 60);                 // 壊れた（読めない）
      const w0 = root.__writes.length;
      await openCaseInEditor(row);
      const toast = document.getElementById('ui-toast');
      o.open = { shownOrig: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src,
                 shownN: (STATE.photos || []).filter(p => p && p.dataUri).length, parked: rowHasParkedThumb(row),
                 toast: toast && toast.style.display !== 'none' ? toast.textContent.slice(0, 60) : '',
                 btn: (document.getElementById('btn-save-overwrite') || {}).textContent };
      await __pressSave();                                          // 読めないまま保存 → 書かない（b では、これで縮小版の印が外れる）
      o.broken = { writes: root.__writes.length - w0, untouched: root.__files[NO + '.json'] === good.slice(0, 60),
                   flag: !!row.data.chosho_photos_thumb, parked: rowHasParkedThumb(row), fromProject: !!row._fromProject };
      if(mode === 'b'){
        // 印の外れた行（物件から開いた行でもない）を開き直す → 預けた縮小版を持つので、それでも「💾 上書き保存」にしない
        await openCaseInEditor(row2);
        await openCaseInEditor(row);
        o.open2 = { shownOrig: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src, parked: rowHasParkedThumb(row),
                    btn: (document.getElementById('btn-save-overwrite') || {}).textContent };
      }
      // ファイルが直った（＋現場が写真 G を足していた）→ 保存 → 元の写真 P と G
      const G = __jpeg(900, 700, 0.85, 322), gid = photoContentId(G);
      const j = JSON.parse(good); j.chosho_photos.push({ id: gid, label: '現場で撮った', dataUri: G });
      root.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      __setTel('090-3333-4444');
      const btn = await __pressSave();
      const ph = __photosOf(root.__files[NO + '.json']) || [];
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : (p.id === gid ? (p.dataUri === G ? 'G' : 'G?') : '?');
      o.fixed = { btn: btn.text, pressed: btn.pressed, photos: ph.map(tag).sort(), tel: JSON.parse(root.__files[NO + '.json']).chosho_cust_tel,
                  parked: rowHasParkedThumb(row), heldAfter: __memRows().nOrig };
      await openCaseInEditor(row2);
      o.end = { parked: rowHasParkedThumb(row), held: __memRows().nOrig, tree: __tree(root) };
      return o;
    }, { NO, NO2, PN, mode });
    const a = alerts(said);
    console.log('㊳' + mode + '読み直せないとき', short(r), short(a.slice(-2).map(m => m.slice(0, 100))));
    ok(!r.error, '㊳' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.drawing && (mode !== 'b' || (r.attached && !r.fromProject)), '㊳' + mode + '試験の前提: 保存で預けた・図面あり（b は台帳で作った行にファイルが付いた） → ' + short(r));
      ok(!r.open.shownOrig && r.open.shownN === 1 && r.open.parked && /読めなかった/.test(r.open.toast),
         '★㊳' + mode + '読めないファイルから開いたのに、縮小版のまま出していない・知らせない → ' + short(r.open));
      ok(/物件に保存/.test(r.open.btn || ''), '★㊳' + mode + '預けた縮小版を持つ行を「💾 上書き保存」で開いた（縮小版で原寸を上書きする） → ' + short(r.open));
      ok(r.broken.writes === 0 && r.broken.untouched && a.some(m => /読めませんでした/.test(m)),
         '★㊳' + mode + '読めないファイルを上書きした・書かなかったことを知らせない → ' + short(r.broken));
      if(mode === 'b'){
        ok(r.broken.flag === false && r.broken.parked && !r.broken.fromProject, '㊳b試験の前提: 読めないまま保存すると縮小版の印が外れる（行は預けた縮小版のまま） → ' + short(r.broken));
        ok(/物件に保存/.test(r.open2.btn || '') && !r.open2.shownOrig && r.open2.parked,
           '★㊳b印の外れた行（物件から開いた行でもない）を開き直すと「💾 上書き保存」になる（縮小版で原寸を上書きする） → ' + short(r.open2));
      }
      ok(r.fixed.pressed && r.fixed.photos.join() === 'G,P' && r.fixed.tel === '090-3333-4444',
         '★㊳' + mode + 'ファイルが直ったあとの保存で、元の写真 P が縮小版になった・現場の G が消えた・直しが入らない → ' + short(r.fixed));
      ok(r.end.parked && r.end.held === 0 && r.end.tree.join() === NO + '.json', '★㊳' + mode + '保存のあと、また軽くならない → ' + short(r.end));
    }
    await ctx.close();
  }

  // ---- ㊴ 預けたあとで管理番号を付け替える → 新しいファイルに元の写真・預け先も移る ----
  if(want('㊴')){
    const { ctx, page, said } = await openMain('㊴');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pd', PN, [
        { caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: NO3 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 331);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row), tree0: __tree(root) };
      await openCaseInEditor(row);                                // 読み直す
      __setField('chosho_mgmt_no', NO2);                          // 番号を付け替える
      await __pressSave();
      const ph = __photosOf(root.__files[NO2 + '.json'] || '{}') || [];
      const e = ed && rowParkedEntry(row, ed);
      o.after = { tree: __tree(root), removed: root.__removed.slice(), n: ph.length, same: !!(ph[0] && ph[0].dataUri === src),
                  to: e ? e.fh.name : '', parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      await openCaseInEditor(row2);
      await openCaseInEditor(row);
      const tt = document.getElementById('ui-toast');
      o.reopen = { shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src, toast: (tt && tt.style.display !== 'none') ? tt.textContent : '' };
      return o;
    }, { NO, NO2, PN });
    console.log('㊴付け替え', short(r));
    ok(!r.error, '㊴止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.tree0.join() === NO + '.json', '㊴試験の前提: 保存で預けた → ' + short(r));
      ok(r.after.tree.join() === NO2 + '.json' && r.after.removed.join() === NO + '.json' && r.after.n === 1 && r.after.same,
         '★㊴付け替えた先のファイルに元の写真が入っていない・古いファイルが残った → ' + short(r.after));
      ok(r.after.parked && r.after.to === NO2 + '.json' && r.after.held === 0, '★㊴預け先が新しいファイルに移っていない → ' + short(r.after));
      ok(r.reopen.shown && !/読めなかった/.test(r.reopen.toast), '★㊴付け替えのあと開くと、元の写真が出ない → ' + short(r.reopen));
    }
    ok(!alerts(said).some(m => /書き替えていません/.test(m)), '★㊴断った → ' + short(alerts(said).slice(-1)));
    await ctx.close();
  }

  // ---- ㊵ 共有ファイルとまとめて行が作り直されても、預け先を持ち越す ----
  for(const mode of ['a', 'b'].filter(m => want('㊵' + m))){
    const { ctx, page } = await openMain('㊵' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const NO3 = '2612MKM079';
      await __openShared(__proj178('pj178pe' + mode, PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c3', file: 'リスト/' + NO3 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 341);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();                                        // 共有ファイルにも書く・戸別ファイルに預ける
      const o = { parked: rowHasParkedThumb(row) };
      if(mode === 'a') await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0]);
      else { await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0]); await openCaseInEditor(row); }   // b) 開いて見ている途中
      o.before = { held: __memRows().nOrig, rowOrig: ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src };
      __otherDeviceSaves(NO2);
      await rtPullLatest();                                       // ほかの端末の保存とまとめる → 行が作り直される
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const e = ed && rowParkedEntry(row2, ed);
      const p0 = (row2.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
      o.after = { rebuilt: row2 !== row, remembers: !!e, to: e ? e.fh.name : '', rowOrig: p0.dataUri === src, parked: rowHasParkedThumb(row2),
                  held: __memRows().nOrig, editLinked: _editingRow === row2 || mode === 'a', idb: (await __idbPhotos('pj178pe' + mode, NO)).photos.length };
      if(mode === 'b'){
        await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0]);   // 別の戸別を開く
        await projSaveNow();                                                                 // 物件の保存（自動保存と同じ）→ 確かめてから軽くする
        o.left = { parked: rowHasParkedThumb(row2), held: __memRows().nOrig, writes: list.__writes.length };
      }
      await openCaseInEditor(row2);
      o.reopen = { shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src };
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊵' + mode + 'まとめて作り直す', short(r));
    ok(!r.error, '㊵' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.after.rebuilt && r.after.idb === 1, '㊵' + mode + '試験の前提: 預けたあと、まとめで行が作り直される → ' + short(r));
      if(mode === 'a'){
        ok(r.before.held === 0 && !r.before.rowOrig, '㊵a試験の前提: まとめる前は預けたまま → ' + short(r.before));
        ok(r.after.remembers && r.after.to === NO + '.json' && r.after.parked && !r.after.rowOrig && r.after.held === 0,
           '★㊵a作り直した行が預け先を忘れた（元の写真を読み直せない）・元の写真を持ってしまった → ' + short(r.after));
      } else {
        ok(r.before.held === 1 && r.before.rowOrig, '㊵b試験の前提: 開いて見ている途中（行は元の写真を持つ） → ' + short(r.before));
        ok(r.after.remembers && r.after.rowOrig && r.after.held === 1,
           '★㊵b開いて見ている途中にまとめると、作り直した行から元の写真か預け先が消えた → ' + short(r.after));
        ok(r.left.parked && r.left.held === 0 && r.left.writes === 1, '★㊵b別の戸別を開いて物件を保存したあと、また軽くならない（または書き直した） → ' + short(r.left));
      }
      ok(r.reopen.shown, '★㊵' + mode + 'まとめたあと開くと、元の写真が出ない → ' + short(r.reopen));
    }
    await ctx.close();
  }

  // ---- ㊶ 「💾 戸別ファイルへ反映」：a) 新しく作ったファイルに預ける　b) 名前の付け替えで預け先も移る ----
  if(want('㊶')){
    const { ctx, page, said } = await openMain('㊶');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pf', PN, [{ caseId: 'c3', file: NO3 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row2 = _listRows[0];
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 351);
      const ed = await __addPhoto(src, 'p.jpg');
      __abortPicker();
      await __pressSave();                                        // 物件にだけ保存（フォルダは選ばなかった）
      await openCaseInEditor(row2);
      const o = { heldBefore: __memRows().nOrig };
      const root = __mk('工事フォルダ', { [NO3 + '.json']: JSON.stringify({ chosho_mgmt_no: NO3, chosho_cust_name: '別 様' }, null, 2) });
      window.showDirectoryPicker = async () => root;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      await lgwbButton();                                         // 💾 戸別ファイルへ反映 → NO.json を新しく作る
      const ph = __photosOf(root.__files[NO + '.json'] || '{}') || [];
      let e = ed && rowParkedEntry(row, ed);
      o.made = { n: ph.length, same: !!(ph[0] && ph[0].dataUri === src), parked: rowHasParkedThumb(row), to: e ? e.fh.name : '',
                 held: __memRows().nOrig, fh: !!row.fileHandle };
      // b) 名前の付け替え（受付台帳で管理番号を直して反映）→ 預け先も新しいファイルへ
      row.data = Object.assign({}, row.data, { chosho_mgmt_no: NO2 });
      const res = await lgwbApply([{ row, name: NO + '.json', rename: NO2 + '.json', diffs: [{ k: 'chosho_mgmt_no', to: NO2, label: '管理番号' }] }]);
      e = ed && rowParkedEntry(row, ed);
      o.renamed = { ok: res.ok, fails: res.fails, tree: __tree(root), to: e ? e.fh.name : '', fhName: row.fileHandle && row.fileHandle.name,
                    n: (__photosOf(root.__files[NO2 + '.json'] || '{}') || []).length };
      await openCaseInEditor(row);
      const tt = document.getElementById('ui-toast');
      o.reopen = { shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src, toast: (tt && tt.style.display !== 'none') ? tt.textContent : '' };
      return o;
    }, { NO, NO2, PN });
    console.log('㊶💾 戸別ファイルへ反映', short(r), short(alerts(said).map(m => m.slice(0, 60))));
    ok(!r.error, '㊶止まった → ' + r.error);
    if(!r.error){
      ok(r.heldBefore === 1 && r.made.n === 1 && r.made.same && r.made.fh, '㊶試験の前提: 反映で新しいファイルに元の写真が入る → ' + short(r));
      ok(r.made.parked && r.made.to === NO + '.json' && r.made.held === 0, '★㊶a反映で作ったファイルに入れたのに、行が元の写真を持ち続けている → ' + short(r.made));
      ok(r.renamed.ok === 1 && r.renamed.tree.join() === NO2 + '.json,' + '2612MKM079.json' && r.renamed.n === 1,
         '㊶b試験の前提: 名前の付け替え → ' + short(r.renamed));
      ok(r.renamed.to === NO2 + '.json' && r.renamed.fhName === NO2 + '.json', '★㊶b名前を付け替えたのに、預け先が古いファイルのまま → ' + short(r.renamed));
      ok(r.reopen.shown && !/読めなかった/.test(r.reopen.toast), '★㊶b付け替えのあと開くと、元の写真が出ない → ' + short(r.reopen));
    }
    await ctx.close();
  }

  // ---- ㊷ 見ただけ・取り込みで元の写真を持っている行は、物件の保存のときファイルを確かめてから軽くする ----
  for(const mode of ['a', 'b'].filter(m => want('㊷' + m))){
    const { ctx, page } = await openMain('㊷' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      await __openProj(__proj178('pj178pg' + mode, PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 361);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row) };
      // 📥 現場取込（工事フォルダを掴めない）→ 行は P（預けから読み直した元の写真）と G（まだどのファイルにも無い）を持つ
      const G = __jpeg(900, 700, 0.85, 362), gid = photoContentId(G);
      const genba = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
                      chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] };
      const picker = window.showDirectoryPicker;
      _projDirHandle = null; try { await projHandleDelete('pj178pg' + mode + ':dir'); } catch(_){}   // 工事フォルダを掴めない
      __abortPicker(); _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 40);
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : (p.id === gid ? (p.dataUri === G ? 'G' : 'G?') : '?');
      o.merged = { row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort(), held: __memRows().nOrig };
      if(mode === 'b'){                                           // b) 現場がファイルから P を消していた → P は持ち続ける（確かめてから）
        const j = JSON.parse(list.__files[NO + '.json']); j.chosho_photos = []; list.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      }
      // 物件の保存（取り込みの終わりと同じ）。止まらないこと
      const t0 = Date.now();
      const done = await Promise.race([(async () => { await prepareProjectThumbs(); await projSaveNow(); return 'done'; })(),
                                       new Promise(res => setTimeout(() => res('timeout'), 20000))]);
      o.save = { done, ms: Date.now() - t0, row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort(), held: __memRows().nOrig,
                 flag: !!row.data.chosho_photos_thumb, idb: (await __idbPhotos('pj178pg' + mode, NO)).photos.length };
      // フォルダを掴めるようになって開いて保存 → ファイルに P と G
      window.showDirectoryPicker = picker;
      await openCaseInEditor(row);
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(tag).sort();
      await __pressSave();
      o.file = (__photosOf(list.__files[NO + '.json']) || []).map(tag).sort();
      await openCaseInEditor(row2);
      o.end = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊷' + mode + '確かめてから軽くする', short(r));
    ok(!r.error, '㊷' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && /掴めていません/.test(r.note) && r.merged.row.join() === 'G,P' && r.merged.held === 2,
         '㊷' + mode + '試験の前提: 預けたあと 📥 で、行が P（読み直し）と G を持つ → ' + short(r));
      ok(r.save.done === 'done', '★㊷' + mode + '物件の保存が止まった（縮小版づくりの中で、その回の終わりを待っている） → ' + short(r.save));
      if(mode === 'a') ok(r.save.row.join() === 'G,P縮' && r.save.held === 1 && r.save.idb === 2,
         '★㊷a物件の保存で、ファイルにある P を軽くしない／まだファイルに無い G まで軽くした → ' + short(r.save));
      else ok(r.save.row.join() === 'G,P' && r.save.held === 2 && r.save.idb === 2,
         '★㊷bファイルから消えていた P を、確かめずに軽くした（元の写真がどこにも無くなる） → ' + short(r.save));
      ok(r.shown.join() === 'G,P' && r.file.join() === 'G,P', '★㊷' + mode + '開いて保存したあと、画面かファイルに P・G がそろっていない → ' + short(r));
      ok(r.end.parked && r.end.held === 0, '★㊷' + mode + '保存のあと、また軽くならない → ' + short(r.end));
    }
    await ctx.close();
  }

  // ---- ㊵c 作り直した行に写真の配列が無い（縮小版を作れないまま物件に入った）→ 前の行の写真（預けた縮小版）を戻すとき、預け先も渡す ----
  if(want('㊵c')){
    const { ctx, page } = await openMain('㊵c');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178ph', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 371);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0]);
      const o = { parked: rowHasParkedThumb(row) };
      // ほかの端末の保存とまとめた：この戸別は、縮小版を作れないまま物件に入っていた（写真の配列なし・枚数だけ）
      const disk = JSON.parse(JSON.stringify(await projIdbGet('pj178ph')));
      const c = disk.cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
      c.payload.chosho_photos = null; delete c.payload.chosho_photos_thumb; c.payload.chosho_photo_count = 1;
      disk.updatedAt = new Date().toISOString();
      await applyMergedLocally(disk);
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const p0 = (row2.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {};
      const e = ed && rowParkedEntry(row2, ed);
      o.after = { rebuilt: row2 !== row, n: (row2.data.chosho_photos || []).filter(p => p && p.dataUri).length, id: p0.id === (ed && ed.id),
                  orig: p0.dataUri === src, parked: rowHasParkedThumb(row2), to: e ? e.fh.name : '', flag: !!row2.data.chosho_photos_thumb };
      await openCaseInEditor(row2);
      const tt = document.getElementById('ui-toast');
      o.reopen = { shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src,
                   toast: (tt && tt.style.display !== 'none') ? tt.textContent : '' };
      return o;
    }, { NO, NO2, PN });
    console.log('㊵c配列の無い行を作り直す', short(r));
    ok(!r.error, '㊵c止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.after.rebuilt && r.after.n === 1 && r.after.id && !r.after.orig, '㊵c試験の前提: 預けたあと、配列の無い行に作り直され、前の行の写真（縮小版）が戻る → ' + short(r));
      ok(r.after.parked && r.after.to === NO + '.json' && r.after.flag,
         '★㊵c配列の無い行に戻した預けた縮小版の、預け先を渡さない・印を付けない（元の写真を読み直せない・縮小版を元の写真と見る） → ' + short(r.after));
      ok(r.reopen.shown && !/読めなかった/.test(r.reopen.toast), '★㊵c作り直した行を開くと、元の写真が出ない → ' + short(r.reopen));
    }
    await ctx.close();
  }

  // ---- ㊷c 開いている戸別へ 📥 現場取込（工事フォルダとつながっている）→ 書き戻しで預けても、画面には元の写真を出す ----
  if(want('㊷c')){
    const { ctx, page } = await openMain('㊷c');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178pi', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } }]));
      const row = _listRows[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 381);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();                                        // 預ける（画面はまだ元の写真）
      const o = { parked: rowHasParkedThumb(row), open: _editingRow === row };
      const G = __jpeg(900, 700, 0.85, 382), gid = photoContentId(G);
      const genba = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43',
                      chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] };
      _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 40);
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : (p.id === gid ? (p.dataUri === G ? 'G' : 'G縮') : '?');
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(tag).sort();
      o.file = (__photosOf(list.__files[NO + '.json']) || []).map(tag).sort();
      // そのまま保存しても、ファイルは元の写真のまま。
      // ※ 開いている戸別へ 📥 したあとは「💾」ボタンが押せないまま（applyStateData が下ろし、付け直さない＝前からの動き）。
      //    ここではボタンと同じ関数を呼んで、保存の道（物件に保存）を確かめる。
      __setTel('090-5555-6666');
      const b = document.getElementById('btn-save-overwrite');
      o.btn = { disabled: !!(b && b.disabled), text: b ? b.textContent : '' };
      await overwriteSaveCurrent();
      o.saved = (__photosOf(list.__files[NO + '.json']) || []).map(tag).sort();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN });
    console.log('㊷c開いている戸別へ📥', short(r));
    ok(!r.error, '㊷c止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.open && /個別JSONも更新しました/.test(r.note) && r.file.join() === 'G,P', '㊷c試験の前提: 預けたあと、開いている戸別へ 📥 して戸別ファイルへ書けた → ' + short(r));
      ok(r.shown.join() === 'G,P', '★㊷c開いている戸別へ 📥 したあと、画面に預けた縮小版を出した（元の写真ではない） → ' + short(r.shown));
      ok(r.saved.join() === 'G,P' && r.tel === '090-5555-6666', '★㊷cそのあとの保存で、戸別ファイルの元の写真が縮小版になった・直しが入らない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉟ メモリ：戸別ファイルに入れて確かめた元の写真は、行に持たせない（3回目の見直し） ----
  //   10戸 × 4枚＝40枚（1枚 約1MB）を、物件の行（ファイルのつながっていない戸別）に足して「物件に保存」。
  //   行（_listRows）が持っている元の写真の大きさと、片付けたあとの JS の使用量（ごみ集めのあと。V8 の外の大きな文字列も足す）を測る。
  //   作り物のフォルダは中身を Blob で持つ（JS のメモリに数えない＝本物のディスクと同じ）。
  //   MEM_ONLY=1 のときは数を出すだけ（直す前の index.html を測るため）。
  if(want('㉟')){
    const { ctx, page } = await openMain('㉟');
    const cdp = await ctx.newCDPSession(page);
    const heapMB = async () => {
      for(let i = 0; i < 3; i++){ await cdp.send('HeapProfiler.collectGarbage'); await sleep(150); }
      // 大きな文字列（写真の dataURI）は V8 の外（backingStorageSize）に置かれることがあるので、足して数える
      const h = await cdp.send('Runtime.getHeapUsage'); return Math.round(((h.usedSize || 0) + (h.backingStorageSize || 0)) / 1e4) / 100; };
    const N = 10, K = 4;
    const nos = Array.from({ length: N }, (_, i) => '2612MKM2' + String(i).padStart(2, '0'));
    await run(page, async ({ PN, nos }) => {
      await __openProj(__proj178('pj178mem', PN, nos.map((no, i) => ({ caseId: 'm' + i, file: 'リスト/' + no + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: no, chosho_cust_name: '試験' + i + ' 様', chosho_status: 'in_progress', work_type: '' } }))
        .concat([{ caseId: 'mz', file: 'リスト/2612MKM299.json', lastModified: 0,
                   payload: { chosho_mgmt_no: '2612MKM299', chosho_cust_name: '写真なし 様', chosho_status: 'in_progress', work_type: '' } }])));
      window.__memList = __mk('リスト', {}, {}, { blob: true });
      window.__memRoot = __mk('その１', {}, { 'リスト': window.__memList }, { blob: true });
      window.showDirectoryPicker = async () => window.__memRoot;
    }, { PN, nos });
    const h0 = await heapMB();
    const t0 = Date.now();
    const r = await run(page, async ({ nos, K }) => {
      const lens = {};
      for(let i = 0; i < nos.length; i++){
        const row = _listRows.filter(r => r.data.chosho_mgmt_no === nos[i])[0];
        await openCaseInEditor(row);
        lens[nos[i]] = [];
        for(let j = 0; j < K; j++){
          const ed = await __addPhoto(__jpeg(1400, 1050, 0.85, 200 + i * K + j), 'm' + i + '_' + j + '.jpg');
          lens[nos[i]].push(ed ? ed.dataUri.length : 0);
        }
        await __pressSave();
      }
      // エディタの写真を片付ける（写真の無い戸別を開く）
      await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === '2612MKM299')[0]);
      await new Promise(res => setTimeout(res, 300));
      const files = {};
      for(const no of nos){ const b = __memList.__files[no + '.json'];
        files[no] = b ? (JSON.parse(await b.text()).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.dataUri.length) : null; }
      window.__memLens = lens;
      return { mem: __memRows(), lens, files };
    }, { nos, K });
    const h1 = await heapMB();
    // 開き直すと、エディタには元の写真が出る（ファイルから読み直す）
    const r2 = await run(page, async ({ nos }) => {
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === nos[3])[0];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.dataUri.length);
      await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === '2612MKM299')[0]);
      return { shown, want: window.__memLens[nos[3]], mem: __memRows() };
    }, { nos });
    const sec = Math.round((Date.now() - t0) / 1000);
    console.log('㉟メモリ', short({ 写真: N * K + '枚', 行の元の写真MB: r.mem && r.mem.origMB, 行の縮小版MB: r.mem && r.mem.thumbMB,
      元の写真の枚数: r.mem && r.mem.nOrig, JSのメモリMB_前: h0, JSのメモリMB_後: h1, 増えたMB: Math.round((h1 - h0) * 100) / 100, 秒: sec }));
    ok(!r.error && !r2.error, '㉟止まった → ' + (r.error || r2.error));
    if(!r.error && !r2.error && !process.env.MEM_ONLY){
      const allIn = nos.every(no => short(r.files[no]) === short(r.lens[no]));
      ok(allIn && nos.every(no => r.lens[no].every(n => n > 1000000)),
         '㉟試験の前提: 40枚（約1MB）がそのまま戸別ファイルに入る → ' + short({ lens: r.lens[nos[0]], file: r.files[nos[0]] }));
      ok(r.mem.nOrig === 0 && r.mem.origMB === 0, '★㉟戸別ファイルに入れて確かめた元の写真を、行が持ち続けている → ' + short(r.mem));
      ok(r.mem.nThumb === N * K && r.mem.thumbMB < 5, '★㉟行に縮小版（物件に入れる分）が残っていない／大きすぎる → ' + short(r.mem));
      // 直す前は約60MB 増えていた（元の写真を行が持ち続ける）。ごみ集めの具合で前後するので、半分に抑えられていればよい
      ok(h1 - h0 < 35, '★㉟40枚を戸別ファイルに入れたあと、JS のメモリが ' + Math.round(h1 - h0) + 'MB 増えた（元の写真を持ち続けている）');
      ok(short(r2.shown) === short(r2.want), '★㉟開き直したエディタに、元の写真が出ない（縮小版のまま） → ' + short(r2));
      ok(r2.mem.nOrig === 0, '★㉟開いて見ただけで戻ると、行が元の写真を持ったまま → ' + short(r2.mem));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v178_mem_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
