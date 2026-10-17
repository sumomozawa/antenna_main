/* 版181（メイン）組 m-park：戸別ファイルに預けた元の写真まわりの知らせ・📉・📄 の案内・縮小版の控え・Excel 取込の暗号の住所
   場面（ONLY=① などで絞れる。①a のように枝まで書いてもよい）
     ① 工事調書のまとめ印刷（全件・選択・✅完了一覧が通る buildAndPrintChoshoBatch）で、預けた元の写真を読み直せないとき
        a) 読める → 知らせない・元の写真で出す　b) ファイルを控えへ移した　c) いま読めない（同期中）→ 印刷の前に知らせる（管理番号）・OK なら出す
        d) 知らせで「キャンセル」→ 印刷しない・用意したページも残さない。どの枝でも行の写真・ファイルは変えない
     ② 画面の「📁 写真の書き出し」：開いた瞬間だけ読めず縮小版のまま出ている画面
        a) 書き出すときに読み直して元の写真を書き出す（知らせない）　b) ファイルが無い → 書き出す前に知らせ、終わりの知らせに「うち N 枚は小さい写真」
        c) b の知らせで「キャンセル」→ 書き出さない
     ③ 「💾 戸別ファイルへ反映」で作る戸別の、預けた元の写真を読み直せない
        a) 預けたファイルを消した → 「見つかりません」「📁 フォルダで読み込み直して」と言う（待てば直るとは言わない）
        b) ファイルはあるが、その写真がもう無い → 同じ　c) いま読めない（同期中）→ 今までどおり「少し待ってから」。どれも作らない
     ④ 「📉 写真を軽くする」：預けた縮小版を、軽くした元の写真に差し替えない（預けたまま・行が元の写真を持たない）。
        開くと「💾 上書き保存」で、画面には軽くした元の写真
     ⑤ 写真をファイルに置いている戸別（_slim）を開けないときの案内
        a) 📄 ファイルで読んだ戸別（図面あり）・ファイルが書き替わって読めない → 「📄 ファイル」で選び直すよう言う（「少し待って」と言わない）
        b) 同じ・図面の無い戸別（エディタの写真の道）　c) 📁 フォルダで読んだ戸別 → 今までどおり「少し待って」「📁 フォルダ」
     ⑥ 工事フォルダ（工事）と一覧のフォルダ（工事/リスト）が違うとき、📁 を読み直すたびに全部の写真の縮小版を作り直さない
     ⑦ Excel 取込で、まだほどいていない .hyb の行の住所に「Excel」を選んで反映 → 住所を書かない（行にも暗号でない部分にも平文で残さない）・
        反映の知らせで「暗号の戸別 1 件は住所を変えていません」・下見の窓は選ばせない・開くとファイルの住所。平文の戸別は今までどおり書く
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★
   道具（作り物のフォルダ __mk など）は smoke_v178_mem_main.js と同じもの（ここに写してある）。
   使い方: node smoke_v181_m_park_main.js [メイン index.html の file:// URL]　（ONLY=①,② で場面を絞れる） */
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


/* 物件の行 NO に写真を足して「💾 物件に保存」（その１/NO.json に預ける）→ 別の戸別 NO2 を開く。ページの中で使う */
const PARK_SETUP = `
  window.__parkOne = async function(pid, seed, w, h){
    await __openProj(__proj178(pid, PN_, [
      { caseId: 'c1', file: NO_ + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO_, chosho_cust_name: '試験 様', chosho_status: 'completed', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
      { caseId: 'c2', file: NO2_ + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2_, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
    const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO_)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2_)[0];
    const root = __mk('その１', {});
    window.showDirectoryPicker = async () => root;
    await openCaseInEditor(row);
    const ed = await __addPhoto(__jpeg(w || 1600, h || 1200, 0.9, seed), 'p.jpg');
    const sv = await __pressSave();
    await openCaseInEditor(row2);
    return { row, row2, root, ed, sv };
  };
`;
async function openPark(label){
  const o = await openMain(label);
  await o.page.evaluate(PARK_SETUP.replace(/PN_/g, JSON.stringify(PN)).replace(/NO2_/g, JSON.stringify(NO2)).replace(/NO_/g, JSON.stringify(NO)));
  return o;
}

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ① 工事調書のまとめ印刷：預けた元の写真を読み直せないとき、印刷の前に知らせる ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('①' + m))){
    const { ctx, page } = await openPark('①' + mode);
    const r = await run(page, async ({ NO, mode }) => {
      const { row, row2, root, ed, sv } = await __parkOne('pj181a' + mode, 511);
      const o = { sv: sv.text, parked: rowHasParkedThumb(row), held: __memRows().nOrig, fh: !!row.fileHandle, origLen: (ed && ed.dataUri || '').length };
      const body = root.__files[NO + '.json'];
      if(mode === 'b'){ root.__subs['控え'] = __mk('控え', { [NO + '.json']: body }); delete root.__files[NO + '.json']; }   // ほかのPCが 🧩 で控えへ移した
      if(mode === 'c' || mode === 'd') root.__unreadable[NO + '.json'] = 100;                                                  // 同期ソフトが掴んでいる
      const rowPh0 = JSON.stringify(row.data.chosho_photos);
      const lens = [];
      const rc = window.renderChosho;
      window.renderChosho = function(){ (STATE.photos || []).filter(p => p && p.dataUri).forEach(p => lens.push(p.dataUri.length)); return rc.apply(this, arguments); };
      const asked = []; const cf = window.confirm;
      window.confirm = m => { asked.push({ m: String(m), editing2: _editingRow === row2 }); return mode !== 'd'; };
      let printed = 0; const pwf = window.printWithFilename;
      window.printWithFilename = function(){ printed++; };
      try { await buildAndPrintChoshoBatch([row], '工事調書_選択_'); }
      finally { window.confirm = cf; window.renderChosho = rc; }
      await new Promise(r => setTimeout(r, 300));
      window.printWithFilename = pwf;
      o.after = { asked, printed, lens, hostLeft: document.getElementById('chosho-batch-host').children.length,
                  rowSame: JSON.stringify(row.data.chosho_photos) === rowPh0, stillParked: rowHasParkedThumb(row), editing2: _editingRow === row2,
                  fileSame: (mode === 'b' ? root.__subs['控え'].__files[NO + '.json'] : root.__files[NO + '.json']) === body };
      return o;
    }, { NO, mode });
    console.log('①' + mode + 'まとめ印刷', short(r).slice(0, 700));
    ok(!r.error, '①' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(/物件に保存/.test(r.sv) && r.parked && r.held === 0 && !r.fh && r.origLen > 500000, '①' + mode + '試験の前提: 物件の行（ファイル無し）に足した写真を預けた → ' + short(r));
      const a = r.after, warn = a.asked.filter(x => /元の写真を読めなかった/.test(x.m));
      ok(a.rowSame && a.stillParked && a.fileSame && a.editing2, '★①' + mode + '印刷で行の写真・ファイル・開いている戸別が変わった → ' + short(a));
      if(mode === 'a'){
        ok(warn.length === 0 && a.printed === 1 && a.lens.length === 1 && a.lens[0] === r.origLen,
           '★①a読めるのに知らせた・元の写真で出さない → ' + short(a));
      } else {
        ok(warn.length === 1 && warn[0].m.indexOf(NO) >= 0 && /小さい写真/.test(warn[0].m) && /1 件/.test(warn[0].m),
           '★①' + mode + '預けた元の写真を読めず小さい写真で出すのに、印刷の前に知らせない（管理番号を言わない） → ' + short(a.asked.map(x => x.m.slice(0, 120))));
        ok(warn.length === 1 && warn[0].editing2, '★①' + mode + '知らせを出したとき、開いていた戸別の画面に戻していない → ' + short(a.asked.map(x => x.editing2)));
        ok(warn.length === 1 && /📁 フォルダ/.test(warn[0].m) && /少し待って/.test(warn[0].m), '★①' + mode + '知らせに、どうすれば元の写真で出るかが無い → ' + short(warn.map(x => x.m.slice(-120))));
        if(mode === 'd') ok(a.printed === 0 && a.hostLeft === 0, '★①dキャンセルしたのに印刷した・用意したページを残した → ' + short(a));
        else ok(a.printed === 1 && a.lens.length === 1 && a.lens[0] < r.origLen / 5, '★①' + mode + 'OK のあと印刷しない（小さい写真のまま出すはず） → ' + short(a));
      }
    }
    await ctx.close();
  }

  // ---- ② 画面の「📁 写真の書き出し」：開いたとき縮小版のままだった画面 ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('②' + m))){
    const { ctx, page } = await openPark('②' + mode);
    const r = await run(page, async ({ NO, mode }) => {
      const { row, row2, root, ed } = await __parkOne('pj181b' + mode, 512);
      const toasts = [];
      const ut = window.uiToast; window.uiToast = function(m){ toasts.push(String(m).slice(0, 80)); return ut.apply(this, arguments); };
      if(mode === 'a') root.__unreadable[NO + '.json'] = 1;                                   // 開くときの1回だけ読めない
      else { root.__subs['控え'] = __mk('控え', { [NO + '.json']: root.__files[NO + '.json'] }); delete root.__files[NO + '.json']; }
      await openCaseInEditor(row);
      const o = { editing: _editingRow === row, origLen: ed.dataUri.length,
                  shownThumb: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri !== ed.dataUri,
                  openToast: toasts.some(t => /読めなかった/.test(t)) };
      const stateBefore = JSON.stringify(STATE.photos), rowBefore = JSON.stringify(row.data.chosho_photos);
      const out = __mk('書き出し先', {});
      window.showDirectoryPicker = async () => out;
      const passed = [];
      const wcp = window._writeCasePhotos;
      window._writeCasePhotos = async function(parent, no, photos){ photos.forEach(p => passed.push(p.dataUri.length)); return wcp.apply(this, arguments); };
      const asked = []; const cf = window.confirm;
      window.confirm = m => { asked.push(String(m)); return mode !== 'c'; };
      const al = []; const wa = window.alert; window.alert = m => { al.push(String(m)); };
      try { await exportPhotosToFolder(); }
      finally { window.confirm = cf; window.alert = wa; window._writeCasePhotos = wcp; window.uiToast = ut; }
      const sub = out.__subs[NO];
      o.after = { passed, asked: asked.map(m => m.slice(0, 140)), alert: (al[al.length - 1] || '').slice(0, 300),
                  files: sub ? Object.keys(sub.__files).length : 0,
                  stateSame: JSON.stringify(STATE.photos) === stateBefore, rowSame: JSON.stringify(row.data.chosho_photos) === rowBefore };
      return o;
    }, { NO, mode });
    console.log('②' + mode + '写真の書き出し', short(r).slice(0, 700));
    ok(!r.error, '②' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.editing && r.shownThumb && r.openToast, '②' + mode + '試験の前提: 開いたとき読めず、縮小版のまま出ている（知らせあり） → ' + short(r));
      const a = r.after, warn = a.asked.filter(m => /元の写真を読めなかった/.test(m));
      ok(a.stateSame && a.rowSame, '★②' + mode + '書き出しで画面・行の写真が変わった → ' + short(a));
      if(mode === 'a'){
        ok(a.passed.length === 1 && a.passed[0] === r.origLen && warn.length === 0 && a.files === 1 && !/小さい写真/.test(a.alert),
           '★②a一度だけ読めなかった縮小版を、書き出すとき読み直さずに書き出した（元の写真のはず） → ' + short(a));
      } else {
        ok(warn.length === 1 && /1 枚/.test(warn[0]), '★②' + mode + '小さい写真を書き出す前に知らせない → ' + short(a.asked));
        if(mode === 'b') ok(a.files === 1 && a.passed[0] < r.origLen / 5 && /うち 1 枚は小さい写真/.test(a.alert),
           '★②b終わりの知らせで、小さい写真を書き出したと言わない（「縮め直していません」だけ） → ' + short(a));
        else ok(a.files === 0 && a.passed.length === 0, '★②cキャンセルしたのに書き出した → ' + short(a));
      }
    }
    await ctx.close();
  }

  // ---- ③ 💾 戸別ファイルへ反映：預けた元の写真の入ったファイルが無い／その写真が無い／いま読めない ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('③' + m))){
    const { ctx, page, said } = await openMain('③' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj181c' + mode, PN, [{ caseId: 'c3', file: NO3 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row2 = _listRows[0];
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const root1 = __mk('その１', {});
      window.showDirectoryPicker = async () => root1;
      await openCaseInEditor(row);
      await __addPhoto(__jpeg(900, 700, 0.85, 513), 'p.jpg');
      await __pressSave();                                        // その１/NO.json に預ける
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      if(mode === 'a') delete root1.__files[NO + '.json'];                                     // ほかのPCが消した
      if(mode === 'b'){ const j = JSON.parse(root1.__files[NO + '.json']); j.chosho_photos = []; root1.__files[NO + '.json'] = JSON.stringify(j); }   // その写真を消した
      if(mode === 'c') root1.__unreadable[NO + '.json'] = 99;                                  // いま読めない（同期中）
      const root2 = __mk('工事フォルダ', { [NO3 + '.json']: JSON.stringify({ chosho_mgmt_no: NO3, chosho_cust_name: '別 様' }, null, 2) });
      window.showDirectoryPicker = async () => root2;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      await lgwbButton();                                         // NO.json は新しく作る道
      o.after = { made: (NO + '.json') in root2.__files, writes: root2.__writes.map(w => w.n), parked: rowHasParkedThumb(row), fh: !!row.fileHandle };
      return o;
    }, { NO, PN, mode });
    const a = alerts(said).filter(m => /預けてある元の写真/.test(m));
    console.log('③' + mode + '反映で作るとき読み直せない', short(r), short(a.map(m => m.replace(/\n/g, ' / ').slice(0, 300))));
    ok(!r.error, '③' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.held === 0, '③' + mode + '試験の前提: 預けてある → ' + short(r));
      ok(!r.after.made && r.after.writes.indexOf(NO + '.json') < 0 && r.after.parked && !r.after.fh,
         '★③' + mode + '預けた元の写真を読めないのに、縮小版で新しいファイルを作った → ' + short(r.after));
      ok(a.length === 1 && /作っていません/.test(a[0]), '★③' + mode + '作らなかったわけを知らせない → ' + short(a));
      if(mode === 'c') ok(a.length === 1 && /少し待って/.test(a[0]) && !/見つかりません/.test(a[0]),
         '★③cいま読めないだけなのに「見つかりません」と言った・「少し待って」と言わない → ' + short(a));
      else ok(a.length === 1 && /見つかりません/.test(a[0]) && /📁 フォルダ/.test(a[0]) && !/少し待って/.test(a[0]),
         '★③' + mode + '預けたファイル（その写真）が無いのに「少し待ってから」と言う（待っても直らない） → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ④ 📉 写真を軽くする：預けた縮小版を、軽くした元の写真に差し替えない ----
  if(want('④')){
    const { ctx, page, said } = await openMain('④');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj181d', PN, [
        { caseId: 'c2', file: NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      const big = __jpeg(2400, 1800, 0.95, 514);                 // 古いファイルから来た大きい写真（約1MBの目安を超える）
      row.data = Object.assign({}, row.data, { chosho_photos: [{ id: photoContentId(big), label: '古い写真', dataUri: big }], amplifier: 'amp_3u43', work_type: 'uhf_new' });
      row._photosKnown = true; row._slim = false; row._photoCount = 1; row._thumbs = undefined;
      await openCaseInEditor(row);
      __setTel('090-1111-2222');
      const sv = await __pressSave();                             // その１/NO.json に入れて預ける
      await openCaseInEditor(row2);
      const o = { sv: sv.text, bigLen: big.length, parked0: rowHasParkedThumb(row), held0: __memRows().nOrig,
                  fileLen0: ((__photosOf(root.__files[NO + '.json']) || [])[0] || {}).dataUri.length };
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);                          // 💾 反映の結び付け（行にファイルが付く）
      o.att = !!(row.fileHandle && row._dir);
      _ledgerShown = { a: row };
      await photoSlimRun([row], _listRows);                       // 📉 写真を軽くする
      const fileLen = ((__photosOf(root.__files[NO + '.json']) || [])[0] || {}).dataUri.length;
      o.after = { parked: rowHasParkedThumb(row), held: __memRows().nOrig, rowLen: ((row.data.chosho_photos || [])[0] || {}).dataUri.length,
                  fileLen, n: (row.data.chosho_photos || []).filter(p => p && p.dataUri).length };
      await openCaseInEditor(row);
      o.open = { btn: (document.getElementById('btn-save-overwrite') || {}).textContent, projRow: !!_editorProjRow,
                 shownLen: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri.length };
      await openCaseInEditor(row2);
      o.back = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      return o;
    }, { NO, NO2, PN });
    const a = alerts(said);
    console.log('④📉と預けた縮小版', short(r).slice(0, 800), short(a.slice(-1).map(m => m.slice(0, 120))));
    ok(!r.error, '④止まった → ' + r.error);
    if(!r.error){
      ok(r.parked0 && r.held0 === 0 && r.fileLen0 === r.bigLen && r.att, '④試験の前提: 大きい写真を戸別ファイルに入れて預け、ファイルに結び付いた → ' + short(r));
      ok(r.after.fileLen < r.bigLen && r.after.n === 1, '④試験の前提: 📉 でファイルの写真が軽くなった → ' + short(r.after));
      ok(r.after.parked && r.after.held === 0 && r.after.rowLen < r.after.fileLen / 5,
         '★④📉 が預けた縮小版を軽くした元の写真に差し替えた（縮小版の印だけ残り、行が元の写真を持つ） → ' + short(r.after));
      /* 台帳で作った行は、版181（組 m-save の F1）から「物件から開いた戸別」と見る（3つの保存は写しになる）。
         ここで見るのは、ボタンが「💾 上書き保存」で、画面に軽くした元の写真が出ること */
      ok(/上書き保存/.test(r.open.btn) && r.open.shownLen === r.after.fileLen,
         '★④開いても「💾 上書き保存」にならない・軽くした元の写真が出ない → ' + short(r.open));
      ok(r.back.parked && r.back.held === 0, '★④別の戸別を開いたあと、預けた形に戻らない → ' + short(r.back));
    }
    await ctx.close();
  }

  // ---- ⑤ 写真をファイルに置いている戸別を開けないときの案内（📄 ファイルで読んだ戸別は選び直す） ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑤' + m))){
    const { ctx, page, said } = await openMain('⑤' + mode);
    const r = await run(page, async ({ NO, mode }) => {
      const P = __jpeg(800, 600, 0.85, 515);
      const data = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                     chosho_photos: [{ id: photoContentId(P), label: '写真', dataUri: P }] };
      if(mode !== 'b') data.amplifier = 'amp_3u43';               // 図面あり（一覧から開く道）。b は図面の無い戸別（エディタの写真の道）
      const nr = () => { const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; return e; };
      let row;
      if(mode === 'c'){
        const root = __mk('工事', { [NO + '.json']: JSON.stringify(data) });
        const fh = await root.getFileHandle(NO + '.json');
        row = buildListRow(NO + '.json', 1, JSON.parse(JSON.stringify(data)), fh);
        row._dir = root; row._name = NO + '.json';
        slimListRow(row, true);
        root.__unreadable[NO + '.json'] = 99;                     // いま読めない
      } else {
        // 📄 ファイルで選んだファイル（読んだあとで書き替わった＝Chrome は読むたびに NotReadableError）
        const f = { name: NO + '.json', lastModified: 1, size: 10, text: async () => { throw nr(); } };
        row = buildListRow(f.name, f.lastModified, JSON.parse(JSON.stringify(data)));
        row.srcFile = f; slimListRow(row, true);
      }
      _listRows = [row];
      const before = _editingRow;
      if(mode === 'b') await openCaseInEditor(row); else await listLoadRow(row);
      return { slim: !!row._slim, fromPick: !!(row.srcFile && !row.fileHandle), opened: _editingRow === row, same: _editingRow === before };
    }, { NO, mode });
    const a = alerts(said).filter(m => /開きませんでした/.test(m));
    console.log('⑤' + mode + '開けないときの案内', short(r), short(a.map(m => m.replace(/\n/g, ' / ').slice(0, 300))));
    ok(!r.error, '⑤' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.slim && r.fromPick === (mode !== 'c'), '⑤' + mode + '試験の前提: 写真をファイルに置いている行 → ' + short(r));
      ok(!r.opened && a.length === 1, '★⑤' + mode + '読めないファイルの戸別を開いた・知らせない → ' + short(r));
      if(mode === 'c') ok(a.length === 1 && /少し待って/.test(a[0]) && /📁 フォルダ/.test(a[0]) && !/📄 ファイル/.test(a[0]),
         '★⑤c📁 で読んだ戸別の案内が変わった（「少し待って」「📁 フォルダ」のはず） → ' + short(a));
      else ok(a.length === 1 && /「📄 ファイル」/.test(a[0]) && /選んで/.test(a[0]) && !/少し待って/.test(a[0]) && !/同期中・ほかのアプリ/.test(a[0]),
         '★⑤' + mode + '📄 ファイルで読んだ戸別に「少し待って」と言う（待っても開けない）・選び直す案内が無い → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ⑥ 工事フォルダと一覧のフォルダが違うとき、📁 を読み直すたびに縮小版を作り直さない ----
  if(want('⑥')){
    const { ctx, page } = await openMain('⑥');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const A = __jpeg(1200, 900, 0.9, 516), B = __jpeg(1200, 900, 0.9, 517);
      const mk = (no, u) => JSON.stringify({ chosho_mgmt_no: no, chosho_cust_name: 'x', chosho_status: 'in_progress', work_type: 'uhf_new',
                                             chosho_photos: [{ id: 'p' + no, label: 'a', dataUri: u }] });
      const list = __mk('リスト', { [NO + '.json']: mk(NO, A), [NO2 + '.json']: mk(NO2, B) }, {}, { resolve: true });
      const root = __mk('工事', {}, { 'リスト': list }, { resolve: true });
      await __openProj(__proj178('pj181f', PN, []));
      _projDirHandle = root; _listDirHandle = list;
      let n = 0; const orig = ensureRowThumbs;
      ensureRowThumbs = async row => { if(!Array.isArray(row._thumbs)) n++; return orig(row); };
      const o = {};
      await listReloadFolder();
      o.files = _listRows.map(x => x.file).sort().join(',');
      n = 0; await prepareProjectThumbs(true); o.gen1 = n;
      await listReloadFolder();
      o.thumbs2 = _listRows.map(x => Array.isArray(x._thumbs));
      n = 0; await prepareProjectThumbs(true); o.gen2 = n;
      await listReloadFolder();
      n = 0; await prepareProjectThumbs(true); o.gen3 = n;
      // 控えから付けた縮小版が、その戸別の写真のものか（ほかの戸別の縮小版を付けない）・ファイルは書かない
      o.thumbIds = _listRows.map(x => x.data.chosho_mgmt_no + ':' + ((x._thumbs || []).map(t => t && t.id).join('+'))).sort().join(',');
      o.writes = list.__writes.length + root.__writes.length;
      ensureRowThumbs = orig;
      return o;
    }, { NO, NO2, PN });
    console.log('⑥縮小版の控え', short(r));
    ok(!r.error, '⑥止まった → ' + r.error);
    if(!r.error){
      ok(r.files === 'リスト/' + NO + '.json,リスト/' + NO2 + '.json' && r.gen1 === 2, '⑥試験の前提: 名前は工事フォルダから見た道のり・初めは2件とも作る → ' + short(r));
      ok(r.gen2 === 0 && r.gen3 === 0 && r.thumbs2.every(Boolean), '★⑥読み直すたびに全部の縮小版を作り直した（控えが当たらない） → ' + short(r));
      ok(r.thumbIds === NO + ':p' + NO + ',' + NO2 + ':p' + NO2 && r.writes === 0, '★⑥控えから、ほかの戸別の縮小版を付けた・ファイルを書いた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑦ Excel 取込：まだほどいていない .hyb の行の住所は書かない ----
  if(want('⑦')){
    const { ctx, page, said } = await openMain('⑦');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const env = await encryptHybrid({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_cust_tel: '0120', chosho_cust_addr: '東京都千代田区1', amplifier: 'amp_3u43' }, 'pw1');
      await __openProj(__proj178('pj181g', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.antenna.hyb', lastModified: 0, payload: env },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '平文 様', chosho_cust_addr: '大阪府1', chosho_status: 'in_progress', work_type: '' } }]));
      try { clearSessionPassword('試験'); } catch(_){}
      const row = _listRows.filter(r => r.fileType === 'hybrid')[0];
      const rowP = _listRows.filter(r => r.fileType === 'plain')[0];
      const o = { pre: { unlocked: !!row.unlocked, addr: row.data.chosho_cust_addr, plainHas: Object.prototype.hasOwnProperty.call(row.envelope.plain, 'chosho_cust_addr') } };
      const ent = (rw, mg, addr, l3) => ({ excel: { mgmt: mg, addr, note: '', built: null }, last3: l3, cands: [rw], targetIdx: 0, apply: true,
                                         addrPick: 'excel', notePick: 'keep', builtPick: 'keep' });
      _xlsxPlan = { entries: [ent(row, NO, '東京都千代田区2-3', '077'), ent(rowP, NO2, '大阪府2', '078')], fileName: 'x.xlsx', cols: null, headerIdx: -1 };
      openXlsxPreview();                                          // 下見の窓
      const bd = document.getElementById('xlsx-modal-backdrop');
      const rows = bd ? [...bd.querySelectorAll('[data-xi]')] : [];
      o.preview = rows.map(el => ({ pick: el.querySelectorAll('[data-xact="addr"]').length, note: /暗号の戸別のため、住所は変えません/.test(el.textContent),
                                    plainAddr: el.textContent.indexOf('東京都千代田区2-3') >= 0 }));
      await applyXlsxPlan();
      o.afterWrite = { data: row.data.chosho_cust_addr, plain: row.envelope.plain.chosho_cust_addr, plainHas: Object.prototype.hasOwnProperty.call(row.envelope.plain, 'chosho_cust_addr'),
                       rowP: rowP.data.chosho_cust_addr };
      let idbPlain = null;
      try { const p = await projIdbGet('pj181g'); const c = p.cases.filter(c => c.payload && c.payload.plain)[0];
            idbPlain = c ? (c.payload.plain.chosho_cust_addr || '') : '(暗号の行が無い)'; } catch(e){ idbPlain = 'err ' + e.message; }
      o.idbPlain = idbPlain;
      window.promptPassword = async () => 'pw1';
      await openCaseInEditor(row);
      o.open = { editorAddr: document.getElementById('chosho_cust_addr').value, editing: _editingRow === row,
                 plainAfterOpen: row.envelope && row.envelope.plain ? (row.envelope.plain.chosho_cust_addr || '') : '' };
      return o;
    }, { NO, NO2, PN });
    const a = alerts(said).filter(m => /Excelの内容を反映しました/.test(m));
    console.log('⑦Excel取込と暗号の住所', short(r), short(a.map(m => m.replace(/\n/g, ' / ').slice(0, 300))));
    ok(!r.error, '⑦止まった → ' + r.error);
    if(!r.error){
      ok(!r.pre.unlocked && r.pre.addr !== '東京都千代田区1' && !r.pre.plainHas, '⑦試験の前提: まだほどいていない .hyb の行（住所は伏せ字・暗号でない部分に住所が無い） → ' + short(r.pre));
      ok(r.afterWrite.data === r.pre.addr && !r.afterWrite.plainHas && r.idbPlain === '',
         '★⑦暗号の戸別に Excel の住所を書いた（暗号でない部分・物件に平文で残る） → ' + short(r));
      ok(r.afterWrite.rowP === '大阪府2', '★⑦平文の戸別に Excel の住所が入らない → ' + short(r.afterWrite));
      ok(a.length === 1 && /暗号の戸別 1 件は、住所を変えていません/.test(a[0]), '★⑦反映の知らせで、暗号の戸別の住所を変えなかったと言わない（黙って何も起きない） → ' + short(a));
      ok(r.preview.length === 2 && r.preview[0].pick === 0 && r.preview[0].note && r.preview[1].pick === 2 && !r.preview[1].note,
         '★⑦下見の窓で、暗号の戸別にも住所を選ばせる（選んでも入らない）・平文の戸別で選べない → ' + short(r.preview));
      ok(r.open.editing && r.open.editorAddr === '東京都千代田区1' && r.open.plainAfterOpen === '',
         '★⑦開いたときファイルの住所でない・暗号でない部分に住所が残った → ' + short(r.open));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v181_m_park_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
