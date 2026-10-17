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
     ㉗p （#174 との取り決め）㊳b と同じ行（台帳で作った行・預けた縮小版のまま・縮小版の印が外れた・ファイルが読めない）を開き直して、
        エディタの「💾 保存」（名前を付けて保存）を押す → ファイルを選ぶ画面を開かない（Chrome は選んだファイルを渡す前に空にする＝
        縮小版で戸別ファイルを置き換えてしまう）。写し（管理番号_写し.json）に預けた縮小版 P縮・「物件に控えた小さい写真」と知らせる
     ㊴ 預けたあとで管理番号を付け替える → 新しいファイルに元の写真・預け先も移る・開くと元の写真
     ㊵ 共有ファイルとまとめて行が作り直されても、預け先を持ち越す（a 預けたまま　b 開いて見ている途中＝元の写真も持ち越し、あとで確かめて軽くする
        c 作り直した行に写真の配列が無い（縮小版を作れないまま物件に入った）＝前の行の写真を戻すとき、預け先も渡す）
     ㊶ 「💾 戸別ファイルへ反映」：a) 新しく作ったファイルに預ける　b) 名前の付け替えで預け先も移る
        c 預けた元の写真をいま読めない → 縮小版で新しいファイルを作らない・知らせる
        d 🔄 一括再保存：ファイルの付いた行の元ファイルをいま読めない → 行の写真（預けた縮小版・物件の縮小版）で元ファイルを書き替えない
     ㊷ 見ただけ・取り込みで元の写真を持っている行は、物件の保存のときファイルを確かめてから軽くする（ファイルから消えていれば持ち続ける・止まらない）
        c 開いている戸別へ 📥（工事フォルダとつながっている）→ 書き戻しで預けても、画面には元の写真を出す
        d 初めの預けが途中で止まった（読み返しているあいだに行が変わった）→ 次に別の戸別を開くとき、書いたファイルを確かめて軽くする。
          預けられない写真（まだファイルに無い）を持つ行は、行が変わるまでファイルを読み直さない
        e 🏢 まとめて消す：帯の外の行（ファイルを持たない）の預けた元の写真を読めない → 移さない（縮小版を移さない）・何も変えない
        f 物件の縮小版づくりが長く動いているあいだでも、戸別を開くとき待たない（前の戸別を軽くするために、その終わりを待たない）
        g 開いている 📁 の戸別へ 📥 したあと読み直せない → 画面の元の写真から戻す・戻せない写真があれば「💾 上書き保存」にしない
        h 読めない戸別を開けなかった → 画面に残る前の戸別は軽くしない　i 開くのと物件の作り直しが重なった → いま開いた戸別の行で開く
        j 開くのに時間がかかるあいだに別の戸別を押した → あとから押した戸別のまま（読み直し・📁 の戸別・暗号の戸別・一覧から直に）
        k 「💾 上書き保存」は預けた縮小版を元の写真の代わりに書かない　l 一覧から直に開く（読込）も読み直す・前の戸別を軽くする
        m 画面に出ている前の縮小版を、元の写真と見なして戻さない
     ㊶ e 🔄 一括再保存：ファイルの付いていない行の預けた写真を読めない → 縮小版で書き出さない
        f・g 💾 反映で別の場所のファイルに結び付いた → そのファイルの写真を縮小版にしない（f）・同じ写真なら預け先も移す（g）
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
      // a) 縮小版が1枚足りない（写真が増えたあと作り直していない）→ 物件の保存の縮小版づくりの中で預けるとき、縮小版を作り直す。
      //    そこでその回の終わりを待つと、自分の終わりを待って止まる
      for(let i = 0; _projThumbsRun && i < 100; i++){ try { await _projThumbsRun; } catch(_){} }
      if(mode === 'a') row._thumbs = [{ id: ed.id, label: '', dataUri: await makeThumbDataUri(src, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY) }];
      o.stale = Array.isArray(row._thumbs) ? row._thumbs.length : -1;
      // 物件の保存（取り込みの終わりと同じ）。止まらないこと
      const t0 = Date.now();
      const done = await Promise.race([(async () => { await prepareProjectThumbs(); await projSaveNow(); return 'done'; })(),
                                       new Promise(res => setTimeout(() => res('timeout'), 20000))]);
      o.save = { done, ms: Date.now() - t0, row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort(), held: __memRows().nOrig,
                 flag: !!row.data.chosho_photos_thumb, idb: (await __idbPhotos('pj178pg' + mode, NO)).photos.length };
      if(done !== 'done') return o;                               // 止まったまま先へ進むと、開くところでも待って終わらない
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
      if(mode === 'a') ok(r.stale === 1, '㊷a試験の前提: 縮小版が1枚足りない → ' + short(r.stale));
      ok(r.save.done === 'done', '★㊷' + mode + '物件の保存が止まった（縮小版づくりの中で、その回の終わりを待っている） → ' + short(r.save));
    }
    if(!r.error && r.save.done === 'done'){
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
      ok(r.parked && r.open && /戸別ファイルにも書きました/.test(r.note) && r.file.join() === 'G,P', '㊷c試験の前提: 預けたあと、開いている戸別へ 📥 して戸別ファイルへ書けた → ' + short(r));
      ok(r.shown.join() === 'G,P', '★㊷c開いている戸別へ 📥 したあと、画面に預けた縮小版を出した（元の写真ではない） → ' + short(r.shown));
      ok(r.saved.join() === 'G,P' && r.tel === '090-5555-6666', '★㊷cそのあとの保存で、戸別ファイルの元の写真が縮小版になった・直しが入らない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊶c 💾 戸別ファイルへ反映で新しく作る：預けた元の写真をいま読めない → 縮小版で新しいファイルを作らない ----
  if(want('㊶c')){
    const { ctx, page, said } = await openMain('㊶c');
    const r = await run(page, async ({ NO, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pj', PN, [{ caseId: 'c3', file: NO3 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row2 = _listRows[0];
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const root1 = __mk('その１', {});
      window.showDirectoryPicker = async () => root1;
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 391);
      await __addPhoto(src, 'p.jpg');
      await __pressSave();                                        // その１ の 管理番号.json に預ける
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      root1.__unreadable[NO + '.json'] = 99;                      // いま読めない（同期ソフトが書き替えている最中など）
      const root2 = __mk('工事フォルダ', { [NO3 + '.json']: JSON.stringify({ chosho_mgmt_no: NO3, chosho_cust_name: '別 様' }, null, 2) });
      window.showDirectoryPicker = async () => root2;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      await lgwbButton();                                         // 💾 戸別ファイルへ反映 → NO.json は新しく作る道
      o.after = { made: (NO + '.json') in root2.__files, writes: root2.__writes.map(w => w.n), parked: rowHasParkedThumb(row),
                  fh: !!row.fileHandle };
      return o;
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊶c反映で作るとき読めない', short(r), short(a.slice(-1).map(m => m.slice(0, 200))));
    ok(!r.error, '㊶c止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.held === 0, '㊶c試験の前提: 預けてある → ' + short(r));
      ok(!r.after.made && r.after.writes.indexOf(NO + '.json') < 0 && r.after.parked && !r.after.fh,
         '★㊶c預けた元の写真を読めないのに、縮小版で新しいファイルを作った（元の写真のファイルを置き去りにする） → ' + short(r.after));
      ok(a.some(m => /読めませんでした/.test(m) && /作っていません/.test(m)), '★㊶c作らなかったわけを知らせない → ' + short(a.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㊶d 🔄 一括再保存：ファイルの付いた行の元ファイルを、いま読めない（同期ソフトが書き替えている最中など）→ 行の写真で元ファイルを書き替えない ----
  //      a) 預けた縮小版の行（反映で作ったファイルに預けた）　b) 物件の縮小版の行（物件から開いた行に、反映でファイルが付いた。預けてはいない）
  //      見直し：前は先頭に BOM を付けて読めなくしていたが、預けた写真の読み直しは BOM を読み飛ばすので、縮小版を書く道を通っていなかった
  for(const mode of ['a', 'b', 'c'].filter(m => want('㊶d' + m))){
    const { ctx, page } = await openMain('㊶d' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const NO3 = '2612MKM079';
      const src = __jpeg(900, 700, 0.85, 392), pid = photoContentId(src);
      const cases = [{ caseId: 'c3', file: NO3 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }];
      if(mode === 'b') cases.unshift({ caseId: 'c1', file: NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '', chosho_photo_count: 1,
                   chosho_photos: [{ id: pid, label: '写真', dataUri: await makeThumbDataUri(src, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY) }], chosho_photos_thumb: true } });
      await __openProj(__proj178('pj178pk' + mode, PN, cases));
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      let row;
      const root = __mk('工事フォルダ', { [NO3 + '.json']: JSON.stringify({ chosho_mgmt_no: NO3, chosho_cust_name: '別 様' }, null, 2) });
      if(mode === 'c'){
        // c) 台帳で作った行に写真 P を足した（まだどのファイルにも入れていない）→ 💾 反映で、現場の写真 G だけが入ったそのお宅のファイルに結び付いた
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
        await openCaseInEditor(row);
        await __addPhoto(src, 'p.jpg');
        projSyncEditorToRow(true);                                // 行へ取り込む（保存はしていない）
        await openCaseInEditor(row2);
        root.__files[NO + '.json'] = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様',
          chosho_photos: [{ id: 'g392', label: '現場で撮った', dataUri: __jpeg(900, 700, 0.85, 393) }] }, null, 2);
      } else if(mode === 'a'){
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
        await openCaseInEditor(row);
        await __addPhoto(src, 'p.jpg');
        __abortPicker();
        await __pressSave();
        await openCaseInEditor(row2);
      } else {
        row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
        root.__files[NO + '.json'] = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_photos: [{ id: pid, label: '写真', dataUri: src }] }, null, 2);
      }
      window.showDirectoryPicker = async () => root;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      if(mode === 'a') await lgwbButton();                        // NO.json を作って預ける（行にファイルが付く）
      else await lgwbAttachFrom(root, false);                     // 行に、そのお宅のファイルが付く
      const o = { parked: rowHasParkedThumb(row), flag: !!row.data.chosho_photos_thumb, fh: !!row.fileHandle };
      root.__unreadable[NO + '.json'] = 99;                       // いま読めない
      const before = root.__files[NO + '.json'];
      const res = await bulkReencodeTargets({ targets: [row], newFormat: 'plain', pwSrc: 'keep', newPw: null, statusEl: null });
      root.__unreadable[NO + '.json'] = 0;
      const ph = __photosOf(root.__files[NO + '.json']) || [];
      o.after = { photoSkip: res.photoSkip, ok: res.ok, untouched: root.__files[NO + '.json'] === before,
                  orig: mode === 'c' ? ph.map(p => p.id).join() === 'g392' : !!(ph[0] && ph[0].dataUri === src) };
      if(mode === 'c') o.rowP = ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      return o;
    }, { NO, PN, mode });
    console.log('㊶d' + mode + '一括再保存で読み直せない', short(r));
    ok(!r.error, '㊶d' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'c') ok(r.fh && !r.flag && !r.parked && r.rowP, '㊶dc試験の前提: 行にファイルが付き、行は元の写真 P を持つ（預けていない・縮小版の印も無い） → ' + short(r));
      else ok(r.fh && r.flag && (mode === 'a' ? r.parked : !r.parked), '㊶d' + mode + '試験の前提: 行にファイルが付き、行の写真は' + (mode === 'a' ? '預けた' : '物件の') + '縮小版 → ' + short(r));
      ok(r.after.untouched && r.after.orig && r.after.photoSkip === 1 && r.after.ok === 0,
         '★㊶d' + mode + '元ファイルを読み直せないのに、行の写真で元ファイルを書き替えた（縮小版を書いた・ファイルにしか無い写真が消えた） → ' + short(r.after));
    }
    await ctx.close();
  }

  // ---- ㊷d 初めの預けが途中で止まった → あとで確かめて軽くする／預けられない写真の行は、行が変わるまで読み直さない ----
  if(want('㊷d')){
    const { ctx, page } = await openMain('㊷d');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pl', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 393);
      await __addPhoto(src, 'p.jpg');
      // 書いたファイルを読み返しているあいだに、行が入れ替わった（自動保存など）
      const orig = photoFileRead; let first = true;
      photoFileRead = async fh => { const j = await orig(fh); if(first){ first = false; row.data = Object.assign({}, row.data); } return j; };
      await __pressSave();
      photoFileRead = orig;
      const o = { first: { parked: rowHasParkedThumb(row), held: __memRows().nOrig, file: (__photosOf(list.__files[NO + '.json']) || []).length } };
      await openCaseInEditor(row2);                              // 別の戸別を開く → 書いたファイルを確かめて軽くする
      o.switched = { parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      // まだファイルに無い写真 X を持たせる（保存していない）→ 物件の保存を2回。ファイルを読むのは1回だけ
      const X = __jpeg(900, 700, 0.85, 394);
      row.data = Object.assign({}, row.data, { chosho_photos: (row.data.chosho_photos || []).concat([{ id: 'x394', label: 'X', dataUri: X }]) });
      row._photoCount = (row.data.chosho_photos || []).filter(p => p && p.dataUri).length; row._thumbs = undefined;
      let reads = 0;
      photoFileRead = async fh => { reads++; return orig(fh); };
      await prepareProjectThumbs(true); const r1 = reads;
      await prepareProjectThumbs(true); const r2 = reads - r1;
      photoFileRead = orig;
      const xNow = (row.data.chosho_photos || []).filter(p => p && p.id === 'x394')[0] || {};
      o.memo = { r1, r2, xKept: xNow.dataUri === X, thumbs: (row._thumbs || []).length };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷d預けが途中で止まった', short(r));
    ok(!r.error, '㊷d止まった → ' + r.error);
    if(!r.error){
      ok(!r.first.parked && r.first.held === 1 && r.first.file === 1, '㊷d試験の前提: 初めの預けが途中で止まり、行は元の写真を持つ（ファイルには入っている） → ' + short(r.first));
      ok(r.switched.parked && r.switched.held === 0, '★㊷d初めの預けが止まった行を、あとで確かめて軽くしない（元の写真を持ち続ける） → ' + short(r.switched));
      ok(r.memo.xKept && r.memo.r1 === 1 && r.memo.r2 === 0,
         '★㊷d預けられない写真（まだファイルに無い）を持つ行を、物件の保存のたびにファイルを読み直す（または X を手放した） → ' + short(r.memo));
    }
    await ctx.close();
  }

  // ---- ㊷e 🏢 まとめて消す：帯の外の行（ファイルを持たない）の預けた元の写真を読めない → 移さない・何も変えない ----
  if(want('㊷e')){
    const { ctx, page } = await openMain('㊷e');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pm', PN, [
        { caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: 'まとめる先 様', chosho_status: 'in_progress', work_type: '' } }]));
      const stray = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], target = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(stray);
      const src = __jpeg(900, 700, 0.85, 395);
      await __addPhoto(src, 'p.jpg');
      await __pressSave();                                        // 帯の外の行の写真を その１/NO.json に預ける
      await openCaseInEditor(target);
      const o = { parked: rowHasParkedThumb(stray), strayFile: !!(stray._dir && stray._name) };
      root.__unreadable[NO + '.json'] = 99;
      const tBefore = JSON.stringify(target.data.chosho_photos || null), sBefore = stray.data;
      let err = '';
      try { await aptMgMovePhotos(target, stray); } catch(e){ err = String(e && e.message || e); }
      o.after = { err: err.slice(0, 80), targetSame: JSON.stringify(target.data.chosho_photos || null) === tBefore, straySame: stray.data === sBefore };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷eまとめて消すで読めない', short(r));
    ok(!r.error, '㊷e止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && !r.strayFile, '㊷e試験の前提: 帯の外の行はファイルを持たず、写真は預けてある → ' + short(r));
      ok(/読めませんでした/.test(r.after.err) && r.after.targetSame && r.after.straySame,
         '★㊷e預けた元の写真を読めないのに、縮小版をまとめる先へ移した・知らせない → ' + short(r.after));
    }
    await ctx.close();
  }

  // ---- ㊷f 物件の縮小版づくりが長く動いているあいだでも、戸別を開くとき待たない ----
  if(want('㊷f')){
    const { ctx, page } = await openMain('㊷f');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pn', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c3', file: 'リスト/' + NO3 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO3, chosho_cust_name: '写真の多い 様', chosho_status: 'in_progress', work_type: '',
                     chosho_photos: [{ id: 'q396', label: '写真', dataUri: __jpeg(900, 700, 0.85, 396) }] } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 397);
      await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      await openCaseInEditor(row);                                // 読み直す（行は元の写真を持つ）
      const rowOrig = () => ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      const o = { held: rowOrig() };
      // 物件の縮小版づくりが、写真の多い戸別のところで長く止まっている
      const origE = ensureRowThumbs;
      let release; const gate = new Promise(res => { release = res; });
      ensureRowThumbs = async rr => { if(rr && rr.data && rr.data.chosho_mgmt_no === NO3) await gate; return origE(rr); };
      const rowC = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      rowC._thumbs = undefined;                                   // 前の保存で作った縮小版を捨てる＝この回で作り直す（ここで止まる）
      const pass = prepareProjectThumbs(true);
      await new Promise(res => setTimeout(res, 50));
      o.blocked = !!_projThumbsRun;                               // 縮小版づくりが動いている（止まっている）
      const opened = await Promise.race([openCaseInEditor(row2).then(() => 'opened'), new Promise(res => setTimeout(() => res('waited'), 3000))]);
      o.open = { opened, held: rowOrig(), parked: rowHasParkedThumb(row) };
      release(); await pass;
      ensureRowThumbs = origE;
      return o;
    }, { NO, NO2, PN });
    console.log('㊷f縮小版づくりのあいだに開く', short(r));
    ok(!r.error, '㊷f止まった → ' + r.error);
    if(!r.error){
      ok(r.held === true && r.blocked === true, '㊷f試験の前提: 開いて読み直した行は元の写真を持ち、縮小版づくりが止まっている → ' + short(r));
      ok(r.open.opened === 'opened' && r.open.parked && r.open.held === false,
         '★㊷f縮小版づくりが動いているあいだ、戸別を開くと待たされる（または前の戸別を軽くしない） → ' + short(r.open));
    }
    await ctx.close();
  }

  // ---- ㊷g 開いている 📁 の戸別へ 📥：書いた直後に同期ソフトがファイルを掴み、元の写真を読み直せない ----
  //      → 画面に出ていた元の写真（P）から戻す。戻せない写真（取り込んだ G）があれば「💾 上書き保存」にしない・知らせる。
  //      → 同期が終わってからの保存で、ファイルの元の写真を縮小版にしない（見直し：前は P・G とも 512px の縮小版で上書きしていた）
  if(want('㊷g')){
    const { ctx, page } = await openMain('㊷g');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pq', PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');                        // 図面あり＝開くと「💾 上書き保存」の判定を通る
      const src = __jpeg(900, 700, 0.85, 401);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();                                        // その１/NO.json に預ける
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);                          // 💾 反映の結び付け（行にファイルが付く）
      await openCaseInEditor(row2);
      await openCaseInEditor(row);                                // 読み直す → 元の写真・「💾 上書き保存」
      const o = { attached: !!row.fileHandle, btn0: document.getElementById('btn-save-overwrite').textContent,
                  shown0: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src };
      const G = __jpeg(900, 700, 0.85, 402), gid = photoContentId(G);
      const genba = { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', _origin: 'genba', amplifier: 'amp_3u43',
                      chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] };
      // 書き戻して預けた直後に、同期ソフトがファイルを掴む（次の1回は読めない）
      const origPark = rowParkOriginals;
      rowParkOriginals = async function(rw, fh, inRun){ const n = await origPark(rw, fh, inRun);
        if(rw === row){ root.__unreadable[NO + '.json'] = 1; rowParkOriginals = origPark; } return n; };
      _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);
      rowParkOriginals = origPark;
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : (p.id === gid ? (p.dataUri === G ? 'G' : 'G縮') : '?');
      const tt = document.getElementById('ui-toast');
      o.imp = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(tag).sort(), btn: document.getElementById('btn-save-overwrite').textContent,
                file: (__photosOf(root.__files[NO + '.json']) || []).map(tag).sort(), unread: root.__unreadable[NO + '.json'],
                toast: (tt && tt.style.display !== 'none') ? tt.textContent.slice(0, 40) : '' };
      root.__unreadable[NO + '.json'] = 0;                        // 同期が終わった
      __setTel('090-1111-2222');
      const b = await __pressSave();                              // 押せるボタンで保存
      o.saved = { btn: b.text, pressed: b.pressed, file: (__photosOf(root.__files[NO + '.json']) || []).map(tag).sort(),
                  tel: JSON.parse(root.__files[NO + '.json']).chosho_cust_tel };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷g📥のあと読み直せない', short(r));
    ok(!r.error, '㊷g止まった → ' + r.error);
    if(!r.error){
      ok(r.attached && /上書き保存/.test(r.btn0) && r.shown0 && /戸別ファイルにも書きました/.test(r.note) && r.imp.file.join() === 'G,P' && r.imp.unread === 0,
         '㊷g試験の前提: 「💾 上書き保存」で開いた戸別へ 📥 して書け、そのあとの読み直しだけ読めなかった → ' + short(r));
      ok(r.imp.shown.indexOf('P') >= 0, '★㊷g読み直せなかったとき、画面に出ていた元の写真 P から戻さず、縮小版を出した → ' + short(r.imp));
      ok(!/上書き保存/.test(r.imp.btn) && /読めなかった/.test(r.imp.toast),
         '★㊷g縮小版（G）を出しているのに「💾 上書き保存」にした・知らせない（縮小版で元ファイルの元の写真を上書きする） → ' + short(r.imp));
      ok(r.saved.pressed && r.saved.file.join() === 'G,P' && r.saved.tel === '090-1111-2222',
         '★㊷gそのあとの保存で、ファイルの元の写真が縮小版になった・直しが入らない → ' + short(r.saved));
    }
    await ctx.close();
  }

  // ---- ㊷h 読めない戸別を開こうとして開けなかった（版178：開かない）→ 画面に残る前の戸別は軽くしない ----
  //      見直し：前は開く前に前の戸別を軽くしていたので、画面に残った戸別の行が縮小版になり、そこへ 📥 すると画面まで縮小版になった
  if(want('㊷h')){
    const { ctx, page } = await openMain('㊷h');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pr', PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const src = __jpeg(900, 700, 0.85, 403);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);
      await openCaseInEditor(row2);
      await openCaseInEditor(row);                                // 元の写真で開いている（「💾 上書き保存」）
      // 別の 📁 の戸別（写真をファイルに置いている）が同期中で読めない → 開かない（版178）
      root.__files[NO2 + '.json'] = JSON.stringify({ chosho_mgmt_no: NO2, chosho_photos: [{ id: 'zz', label: 'x', dataUri: __jpeg(300, 200, 0.8, 9) }] });
      row2._dir = root; row2._name = NO2 + '.json'; row2.fileHandle = await root.getFileHandle(NO2 + '.json'); row2._slim = true; row2._fromProject = false;
      row2.data = Object.assign({}, row2.data, { chosho_photos: null });
      root.__unreadable[NO2 + '.json'] = 50;
      await openCaseInEditor(row2);
      const rowP = () => ((row.data.chosho_photos || []).filter(p => p && p.id === ed.id)[0] || {}).dataUri === src;
      const o = { refused: { editing: _editingRow === row, rowOrig: rowP(), parked: rowHasParkedThumb(row),
                             shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src } };
      // 同じ同期で、この戸別のファイルも読めないあいだに 📥
      root.__unreadable[NO + '.json'] = 50;
      const G = __jpeg(900, 700, 0.85, 404), gid = photoContentId(G);
      _genbaNoDir = false;
      await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', _origin: 'genba', amplifier: 'amp_3u43',
                                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, { importRun: true });
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : (p.id === gid ? (p.dataUri === G ? 'G' : 'G縮') : '?');
      o.imp = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(tag).sort() };
      root.__unreadable[NO + '.json'] = 0;
      const b = await __pressSave();
      o.saved = { btn: b.text, pressed: b.pressed, file: (__photosOf(root.__files[NO + '.json']) || []).map(tag).sort() };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷h開けなかったとき', short(r));
    ok(!r.error, '㊷h止まった → ' + r.error);
    if(!r.error){
      ok(r.refused.editing && r.refused.shown, '㊷h試験の前提: 読めない戸別は開かず、前の戸別の画面のまま → ' + short(r.refused));
      ok(r.refused.rowOrig && !r.refused.parked, '★㊷h開けなかったのに、画面に残る前の戸別を軽くした（行が縮小版になる） → ' + short(r.refused));
      ok(r.imp.shown.join() === 'G,P' && r.saved.pressed && r.saved.file.join() === 'G,P',
         '★㊷hそのあと 📥・保存で、画面かファイルの元の写真が縮小版になった → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊷i 戸別を開くのと、物件の作り直し（自動保存でほかの端末の保存とまとめた）が重なった → いま開いた戸別の行で開く ----
  //      a) 元の写真を読み直しているあいだに作り直された → 作り直した同じ戸別の行で開く
  //      b) まとめが端末内へ書いているあいだに開き終えた → まとめのあと、開いた戸別の新しい行に付け直す（前に開いていた戸別に付けない）
  //      （見直し：前は古い行で開いた（a）・前の戸別に付け直して、次の保存で前の戸別の中身を画面の中身で上書きした（b））
  for(const mode of ['a', 'b'].filter(m => want('㊷i' + m))){
    const { ctx, page } = await openMain('㊷i' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const P = __proj178('pj178ps' + mode, PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openShared(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 405);
      await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row) };
      const orig = photoFileRead, origPut = projIdbPut;
      const merged = JSON.parse(window.__disk); merged.updatedAt = new Date(Date.now() + 60000).toISOString();
      if(mode === 'a'){
        photoFileRead = async fh => { await new Promise(res => setTimeout(res, 300)); return orig(fh); };   // 同期の遅いフォルダ
        const pOpen = openCaseInEditor(row);                      // 一覧で戸別を押した
        await new Promise(res => setTimeout(res, 50));
        await applyMergedLocally(merged);                         // そのあいだに自動保存がまとめて、行を作り直した
        await pOpen;
      } else {
        projIdbPut = async p => { await new Promise(res => setTimeout(res, 600)); return origPut(p); };   // 大きい物件を端末内へ書いている
        const pMerge = applyMergedLocally(merged);                // 自動保存がまとめ始めた
        await new Promise(res => setTimeout(res, 50));
        await openCaseInEditor(row);                              // そのあいだに一覧で戸別を押して、開き終えた
        await pMerge;
      }
      photoFileRead = orig; projIdbPut = origPut;
      o.open = { inList: _listRows.indexOf(_editingRow) >= 0, no: _editingRow && _editingRow.data && _editingRow.data.chosho_mgmt_no,
                 screenNo: (document.getElementById('chosho_mgmt_no') || {}).value || '',
                 shown: ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src };
      await __addPhoto(__jpeg(800, 600, 0.85, 406), 'new.jpg');   // 開いた戸別で写真を足し、電話を直す
      __setTel('099-999-9999');
      projSyncEditorToRow(true);
      const nr = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], nB = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      o.row = { tel: nr.data.chosho_cust_tel || '', n: ((nr.data.chosho_photos) || []).filter(p => p && p.dataUri).length,
                other: nB ? { name: nB.data.chosho_cust_name, tel: nB.data.chosho_cust_tel || '' } : null,
                nos: _listRows.map(r => r.data.chosho_mgmt_no).sort() };
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊷i' + mode + '開くのと作り直しが重なった', short(r));
    ok(!r.error, '㊷i' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked, '㊷i' + mode + '試験の前提: 保存で預けた → ' + short(r));
      ok(r.open.inList && r.open.no === NO && r.open.screenNo === NO && r.open.shown,
         '★㊷i' + mode + '開いた戸別と、エディタが付いている行が違う（古い行・前の戸別） → ' + short(r.open));
      ok(r.row.tel === '099-999-9999' && r.row.n === 2 && r.row.other && r.row.other.name === '別 様' && !r.row.other.tel && r.row.nos.join() === NO + ',' + NO2,
         '★㊷i' + mode + '開いた戸別で直した中身・足した写真が、その戸別の行に入らない（または前の戸別を上書きした） → ' + short(r.row));
    }
    await ctx.close();
  }

  // ---- ㊷j 戸別を開くのに時間がかかっているあいだに、別の戸別を押した → あとから押した戸別のまま（先の戸別に戻らない） ----
  //      a) 先の戸別は預けた元の写真の読み直し　b) 先の戸別は写真をファイルに置いている（図面あり＝ファイルを読み直す）
  //      c) 同じ（図面なし）　d) 一覧から直に開く：先の戸別の読み直しのあいだに、暗号の戸別を押した
  //      e) 一覧から直に開く：先の暗号の戸別を読んでいるあいだに、別の戸別を押した
  for(const mode of ['a', 'b', 'c', 'd', 'e'].filter(m => want('㊷j' + m))){
    const { ctx, page } = await openMain('㊷j' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const NO3 = '2612MKM079', NOH = '2612MKM090';
      await __openProj(__proj178('pj178pt' + mode, PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c3', file: 'リスト/' + NO3 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO3, chosho_cust_name: 'あとから 様', chosho_status: 'in_progress', work_type: '' } }]));
      let row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      let row3 = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      const list = __mk('リスト', {});
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      const o = {};
      const undo = [];
      if(mode === 'a' || mode === 'd'){
        await openCaseInEditor(row);
        await __addPhoto(__jpeg(900, 700, 0.85, 407), 'p.jpg');
        await __pressSave();
        await openCaseInEditor(row2);
        o.parked = rowHasParkedThumb(row);
        const orig = photoFileRead;
        photoFileRead = async fh => { await new Promise(res => setTimeout(res, 400)); return orig(fh); };   // 読み直しに時間がかかる
        undo.push(() => { photoFileRead = orig; });
      }
      if(mode === 'b' || mode === 'c'){
        // 先の戸別は 📁 の戸別（写真をファイルに置いている）。同期の遅いフォルダ
        const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                       chosho_photos: [{ id: 'zz', label: 'x', dataUri: __jpeg(300, 200, 0.8, 9) }] };
        if(mode === 'b') base.amplifier = 'amp_3u43';
        list.__files[NO + '.json'] = JSON.stringify(base);
        row._dir = list; row._name = NO + '.json'; row.fileHandle = await list.getFileHandle(NO + '.json'); row._slim = true; row._fromProject = false;
        row.data = Object.assign({}, row.data, { chosho_photos: null }); if(mode === 'c') delete row.data.amplifier;
        await openCaseInEditor(row2);
        o.slow = { slim: row._slim, drawing: lgHasDrawing(row) };
        const orig = rereadRowSourceWhy;
        rereadRowSourceWhy = async t => { await new Promise(res => setTimeout(res, 400)); return orig(t); };
        undo.push(() => { rereadRowSourceWhy = orig; });
      }
      if(mode === 'd' || mode === 'e'){
        // 暗号の戸別（📁 で読んだ・🔓 まとめて復号したのと同じ＝パスワードを覚えている）
        const st = { chosho_mgmt_no: NOH, chosho_cust_name: '暗号 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'h1', label: '写真1', dataUri: __jpeg(600, 450, 0.85, 142) }] };
        const env = await encryptHybrid(st, 'pw1234');
        list.__files[NOH + '.hyb'] = JSON.stringify(env, null, 2);
        const fh = await list.getFileHandle(NOH + '.hyb');
        const rh = buildListRow('リスト/' + NOH + '.hyb', 1, JSON.parse(list.__files[NOH + '.hyb']), fh);
        rh._dir = list; rh._name = NOH + '.hyb'; rh._dirPath = 'リスト/';
        slimListRow(rh, true);
        rh.data = Object.assign({}, await decryptHybrid(env, 'pw1234'), { chosho_photos: null }); rh.unlocked = true; rh._slim = true;
        _listRows.push(rh);
        try { setSessionPassword('pw1234'); } catch(_){ _sessionPassword = 'pw1234'; }
        o.hyb = rh.fileType;
        if(mode === 'd') row3 = rh;                               // あとから押すのは暗号の戸別
        else {
          row = rh;                                               // 先に押すのは暗号の戸別（読むのに時間がかかる）
          const origE = getFullEnvelope;
          getFullEnvelope = async t => { await new Promise(res => setTimeout(res, 400)); return origE(t); };
          undo.push(() => { getFullEnvelope = origE; });
        }
      }
      const open = (mode === 'd' || mode === 'e') ? (rw => listLoadRow(rw)) : (rw => openCaseInEditor(rw));
      if(mode === 'b') _asbEdited = true;                         // いまの戸別で石綿の欄を直していた
      const p1 = open(row);                                       // 先に押した（時間がかかる）
      await new Promise(res => setTimeout(res, 50));
      const p2 = open(row3);                                      // 待たずに別の戸別を押した
      await Promise.all([p1, p2]);
      undo.forEach(f => f());
      o.end = { editing: _editingRow && _editingRow.data && _editingRow.data.chosho_mgmt_no,
                name: (document.getElementById('chosho_cust_name') || {}).value || '' };
      o.want = { no: row3.data.chosho_mgmt_no, name: row3.data.chosho_cust_name };
      if(mode === 'b') o.asb = _asbEdited;
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊷j' + mode + '続けて押した', short(r));
    ok(!r.error, '㊷j' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok((mode === 'a' || mode === 'd' ? r.parked : true) && (mode === 'b' || mode === 'c' ? (r.slow.slim && r.slow.drawing === (mode === 'b')) : true)
         && (mode === 'd' || mode === 'e' ? r.hyb === 'hybrid' : true), '㊷j' + mode + '試験の前提 → ' + short(r));
      ok(r.end.editing === r.want.no && r.end.name === r.want.name,
         '★㊷j' + mode + 'あとから押した戸別を開いたのに、先に押した戸別の画面に戻った（直している戸別が替わる） → ' + short(r));
      if(mode === 'b') ok(r.asb === false, '★㊷jb先に押した戸別の開きをやめたとき、前の戸別の「石綿を直した」印を、あとから開いた戸別に付けた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊷k 守りの最後：画面に預けた縮小版が出ているのに、何かの道で「💾 上書き保存」が押せた（ここでは行き先を手で戻す）----
  //      a) 元ファイルが読める → 元ファイルの同じ写真（元の写真）に替えて書く　b) 元ファイルにもその写真が無い → 書かない
  for(const mode of ['a', 'b'].filter(m => want('㊷k' + m))){
    const { ctx, page, said } = await openMain('㊷k' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      await __openProj(__proj178('pj178pu' + mode, PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const src = __jpeg(900, 700, 0.85, 408);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);
      await openCaseInEditor(row2);
      root.__unreadable[NO + '.json'] = 2;                        // 開くときは読めない → 縮小版のまま出す
      await openCaseInEditor(row);
      root.__unreadable[NO + '.json'] = 0;
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : 'P縮') : '?';
      const o = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(tag), btn0: document.getElementById('btn-save-overwrite').textContent };
      _loadedOrigin = { file: row.file || (NO + '.json'), fileHandle: row.fileHandle, fileType: 'plain' };   // 行き先が戻った（どこかの道で）
      if(mode === 'b'){ const j = JSON.parse(root.__files[NO + '.json']); j.chosho_photos = []; root.__files[NO + '.json'] = JSON.stringify(j, null, 2); }
      const before = root.__files[NO + '.json'];
      __setTel('090-7777-8888');
      await overwriteSaveCurrent();
      const fj = JSON.parse(root.__files[NO + '.json']);
      o.after = { untouched: root.__files[NO + '.json'] === before, file: (fj.chosho_photos || []).filter(p => p && p.dataUri).map(tag), tel: fj.chosho_cust_tel || '' };
      return o;
    }, { NO, NO2, PN, mode });
    const a = alerts(said);
    console.log('㊷k' + mode + '上書き保存の守り', short(r), short(a.slice(-1).map(m => m.slice(0, 80))));
    ok(!r.error, '㊷k' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.shown.join() === 'P縮' && /物件に保存/.test(r.btn0), '㊷k' + mode + '試験の前提: 読み直せず縮小版で開き、「💾 上書き保存」にはなっていない → ' + short(r));
      if(mode === 'a') ok(r.after.file.join() === 'P' && r.after.tel === '090-7777-8888',
         '★㊷k上書き保存で、預けた縮小版を元ファイルの元の写真の代わりに書いた → ' + short(r.after));
      else ok(r.after.untouched && a.some(m => /上書き保存していません/.test(m) && /小さい写真/.test(m)),
         '★㊷k元ファイルにも元の写真が無いのに、預けた縮小版を書いた・知らせない → ' + short(r.after));
    }
    await ctx.close();
  }

  // ---- ㊷l 一覧から直に開く（読込・行を押す）：預けた元の写真を読み直す・読めなければ知らせる・別の戸別を開いたら前の戸別を軽くする ----
  if(want('㊷l')){
    const { ctx, page } = await openMain('㊷l');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178px', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 411);
      await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const shownP = () => ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      const o = { parked: rowHasParkedThumb(row) };
      openListView();
      await listLoadRow(row);                                     // 一覧の「読込」
      o.load = { editing: _editingRow === row, shown: shownP(), parked: rowHasParkedThumb(row) };
      openListView();
      await listLoadRow(row2);                                    // 別の戸別を「読込」→ 前の戸別をまた軽くする
      o.back = { editing: _editingRow === row2, parked: rowHasParkedThumb(row), held: __memRows().nOrig };
      list.__unreadable[NO + '.json'] = 2;                        // いま読めない
      openListView();
      await listLoadRow(row);
      const tt = document.getElementById('ui-toast');
      o.miss = { shown: shownP(), toast: (tt && tt.style.display !== 'none') ? tt.textContent.slice(0, 30) : '' };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷l一覧から直に開く', short(r));
    ok(!r.error, '㊷l止まった → ' + r.error);
    if(!r.error){
      ok(r.parked, '㊷l試験の前提: 保存で預けた → ' + short(r));
      ok(r.load.editing && r.load.shown && !r.load.parked, '★㊷l一覧から直に開くと、預けた元の写真を読み直さない（縮小版のまま） → ' + short(r.load));
      ok(r.back.editing && r.back.parked && r.back.held === 0, '★㊷l一覧から別の戸別を開いても、前の戸別を軽くしない → ' + short(r.back));
      ok(!r.miss.shown && /読めなかった/.test(r.miss.toast), '★㊷l一覧から直に開いて読めなかったのに、知らせない → ' + short(r.miss));
    }
    await ctx.close();
  }

  // ---- ㊷m 読めないまま縮小版で開いた戸別へ 📥（同じ写真の別の版＝現場の写真のほうが大きい）→ 書いた直後にまた読めない ----
  //      → 画面に出ている前の縮小版を、元の写真と見なして戻さない（見直し：前はその縮小版を、あとの保存で戸別ファイルの元の写真の代わりに書いた）
  if(want('㊷m')){
    const { ctx, page } = await openMain('㊷m');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178py', PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const src = __jpeg(900, 700, 0.85, 412);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);
      await openCaseInEditor(row2);
      const T1 = (rowParkedEntry(row, { id: ed.id }) || {}).thumb || '';
      // 同じ写真の別の版（現場の下書きに残っていた回す前の写真など）：ファイルは大きいが、その縮小版は前の縮小版より短い
      const mk = (w, h, amp, q) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const x = cv.getContext('2d'); const im = x.createImageData(w, h); let s = 12345;
        const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
        for(let i = 0; i < im.data.length; i += 4){ const p = i / 4, xx = p % w, yy = (p / w) | 0; const v = (rnd() * amp) | 0;
          im.data[i] = (xx * 255 / w + v) & 255; im.data[i+1] = (yy * 255 / h + v) & 255; im.data[i+2] = 128; im.data[i+3] = 255; }
        x.putImageData(im, 0, 0); return cv.toDataURL('image/jpeg', q); };
      let Og = null;
      for(const amp of [20, 30, 40, 50, 60, 70, 80]){ const c = mk(1600, 1200, amp, 0.8); if(c.length > src.length && c.length * 3 / 4 < 1000000){ Og = c; break; } }
      const T2 = Og ? await makeThumbDataUri(Og, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY) : '';
      const o = { pre: { parked: rowHasParkedThumb(row), og: !!Og, t2Shorter: !!Og && T2.length < T1.length } };
      root.__unreadable[NO + '.json'] = 2;                        // 開くときは読めない → 前の縮小版 T1 のまま出す
      await openCaseInEditor(row);
      root.__unreadable[NO + '.json'] = 0;
      const tag = p => (p.id === ed.id) ? (p.dataUri === src ? 'Ox' : (p.dataUri === Og ? 'Og' : (p.dataUri === T1 ? 'T1' : (p.dataUri === T2 ? 'T2' : '?')))) : '?';
      o.open = (STATE.photos || []).filter(p => p && p.dataUri).map(tag);
      const origPark = rowParkOriginals;
      rowParkOriginals = async function(rw, fh, inRun){ const n = await origPark(rw, fh, inRun);
        if(rw === row){ root.__unreadable[NO + '.json'] = 1; rowParkOriginals = origPark; } return n; };
      _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', _origin: 'genba', amplifier: 'amp_3u43',
                                                        chosho_photos: [{ id: ed.id, label: 'p', dataUri: Og }] }, { importRun: true }) || '').slice(0, 60);
      rowParkOriginals = origPark;
      o.imp = { file: (__photosOf(root.__files[NO + '.json']) || []).map(tag), row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag),
                btn: document.getElementById('btn-save-overwrite').textContent };
      root.__unreadable[NO + '.json'] = 0;
      __setTel('090-1111-2222');
      const b = await __pressSave();
      o.saved = { pressed: b.pressed, file: (__photosOf(root.__files[NO + '.json']) || []).map(tag), tel: JSON.parse(root.__files[NO + '.json']).chosho_cust_tel };
      return o;
    }, { NO, NO2, PN });
    console.log('㊷m前の縮小版が画面に出ている', short(r));
    ok(!r.error, '㊷m止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.parked && r.pre.og && r.pre.t2Shorter && r.open.join() === 'T1' && /戸別ファイルにも書きました/.test(r.note) && r.imp.file.join() === 'Og',
         '㊷m試験の前提: 縮小版 T1 で開き、📥 で大きい版 Og をファイルへ書けた → ' + short(r));
      ok(r.imp.row.join() !== 'T1' && !/上書き保存/.test(r.imp.btn), '★㊷m画面に出ていた前の縮小版 T1 を、元の写真と見なして行に戻した → ' + short(r.imp));
      ok(r.saved.pressed && r.saved.file.join() === 'Og' && r.saved.tel === '090-1111-2222',
         '★㊷mそのあとの保存で、戸別ファイルの元の写真 Og を縮小版で上書きした → ' + short(r.saved));
    }
    await ctx.close();
  }

  // ---- ㊷n 台帳で作った行の写真を その１ の 管理番号.json に預けた → ほかのPCで リスト/ へ動かした（物件の覚えている名前では見つからない）----
  //      → 開くと縮小版（読めなかった）。保存で その１ に新しく作るファイルに、預けた縮小版を書かない（リスト/ の元の写真に替える）
  //      （見直し：縮小版の印は保存で外れるので、新しいファイルを作るときの「元の写真を探す」を通らず、縮小版のファイルを作っていた）
  // ---- ㊷o 預けた写真の1枚を、ほかの端末が戸別ファイルから消した → 保存で、その写真の縮小版を元の写真の代わりに書かない（知らせる）
  for(const mode of ['n', 'o'].filter(m => want('㊷' + m))){
    const { ctx, page, said } = await openMain('㊷' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      await __openProj(__proj178('pj178px' + mode, PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const s1 = __jpeg(900, 700, 0.85, 413), s2 = __jpeg(900, 700, 0.85, 414);
      const e1 = await __addPhoto(s1, 'p1.jpg'), e2 = await __addPhoto(s2, 'p2.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row) && !row.fileHandle };
      if(mode === 'n'){                                            // ほかのPCで 📂 そろえる：リスト/ へ動かした
        const good = root.__files[NO + '.json'];
        delete root.__files[NO + '.json'];
        root.__subs['リスト'] = __mk('リスト', { [NO + '.json']: good });
      } else {                                                     // ほかの端末が p2 を消した
        const j = JSON.parse(root.__files[NO + '.json']);
        j.chosho_photos = j.chosho_photos.filter(p => p.id !== e2.id);
        root.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      }
      await openCaseInEditor(row);
      const tag = p => (p.id === e1.id ? (p.dataUri === s1 ? 'P1' : 'P1縮') : (p.id === e2.id ? (p.dataUri === s2 ? 'P2' : 'P2縮') : '?'));
      const tt = document.getElementById('ui-toast');
      o.open = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(tag),
                 toast: (tt && tt.style.display !== 'none') ? tt.textContent.slice(0, 30) : '' };
      __setTel('090-1111-2222');
      const b = await __pressSave();
      const files = {};
      const walk = (d, pre) => { Object.keys(d.__files).forEach(n => { files[pre + n] = (__photosOf(d.__files[n]) || []).filter(p => p && p.dataUri).map(tag).join(); });
        Object.keys(d.__subs).forEach(k => walk(d.__subs[k], pre + k + '/')); };
      walk(root, '');
      o.after = { pressed: b.pressed, files, tel: (JSON.parse(root.__files[NO + '.json'] || '{}')).chosho_cust_tel || '',
                  row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag) };
      if(mode === 'o'){                                            // もう一度保存しても、縮小版を書かない
        __setTel('090-3333-4444');
        const b2 = await __pressSave();
        o.again = { pressed: b2.pressed, file: (__photosOf(root.__files[NO + '.json']) || []).filter(p => p && p.dataUri).map(tag).join(),
                    tel: JSON.parse(root.__files[NO + '.json']).chosho_cust_tel || '' };
      }
      return o;
    }, { NO, NO2, PN, mode });
    const last = alerts(said).slice(-1)[0] || '';
    console.log('㊷' + mode + (mode === 'n' ? '預けたファイルを動かした' : '預けた写真をほかの端末が消した'), short(r), short(last.slice(0, 200)));
    ok(!r.error, '㊷' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'n'){
        ok(r.parked && r.open.shown.join() === 'P1縮,P2縮' && /読めなかった/.test(r.open.toast),
           '㊷n試験の前提: 預けたファイルが見つからず、縮小版のまま出して知らせる → ' + short(r));
        ok(r.after.pressed && r.after.files[NO + '.json'] === 'P1,P2' && r.after.files['リスト/' + NO + '.json'] === 'P1,P2' && r.after.tel === '090-1111-2222',
           '★㊷n新しく作った戸別ファイルに、預けた縮小版を元の写真として書いた → ' + short(r.after));
      } else {
        ok(r.parked && r.open.shown.join() === 'P1,P2縮' && /読めなかった/.test(r.open.toast),
           '㊷o試験の前提: 消された写真は縮小版のまま出して知らせる → ' + short(r));
        ok(r.after.pressed && r.after.files[NO + '.json'] === 'P1' && r.after.tel === '090-1111-2222',
           '★㊷o戸別ファイルから消された写真を、預けた縮小版で書き戻した → ' + short(r.after));
        ok(r.again.pressed && r.again.file === 'P1' && r.again.tel === '090-3333-4444',
           '★㊷oもう一度保存したら、消された写真を預けた縮小版で書き戻した → ' + short(r.again));
        ok(r.after.row.join() === 'P1縮,P2縮' || r.after.row.join() === 'P1,P2縮', '★㊷o物件の行から、その写真の縮小版まで無くなった → ' + short(r.after.row));
        ok(/1 枚は、戸別ファイルから元の写真を読めなかった/.test(last), '★㊷o戸別ファイルに入れなかった写真を知らせない → ' + short(last.slice(0, 200)));
      }
    }
    await ctx.close();
  }

  // ---- ㊷p 預けた写真のある世帯が、その写真の入っていない別のファイルを「ファイルから読む」形で持った（版179 より前の 🏢 まとめて消す と同じ形）→ 預けたファイルをほかの端末が消した → 📥 現場取込 ----
  //      → 戸別ファイルに入れなかった預けた縮小版を、行から外さない（外すと物件からも消える＝ただ1つの写し）
  if(want('㊷p')){
    const { ctx, page } = await openMain('㊷p');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178py2', PN, [
        { caseId: 'c1', file: NO + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO, chosho_cust_name: '帯の外 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c2', file: NO2 + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO2, chosho_cust_name: 'まとめる先 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c3', file: NO3 + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const stray = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], target = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const row3 = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(target);
      const s1 = __jpeg(900, 700, 0.85, 415);
      const e1 = await __addPhoto(s1, 'p1.jpg');
      await __pressSave();
      await openCaseInEditor(row3);
      const o = { parked: rowHasParkedThumb(target) && !(target._dir && target._name) };
      const q = __jpeg(900, 700, 0.85, 416);                      // 帯の外の行のファイル（写真 Q）
      root.__files[NO + '.json'] = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '帯の外 様', chosho_photos: [{ id: 'qq1', label: 'Q', dataUri: q }] });
      stray._dir = root; stray._name = NO + '.json'; stray.fileHandle = await root.getFileHandle(NO + '.json'); stray.file = NO + '.json';
      target._dir = root; target._name = NO + '.json'; target.fileHandle = stray.fileHandle; target.file = NO + '.json';
      target._slim = true; target._photosKnown = false; target._thumbs = undefined; target._manual = false; delete target._detached;
      o.move = 1;
      o.slim = !!target._slim && rowHasParkedThumb(target);
      delete root.__files[NO2 + '.json'];                          // 預けたファイルを、ほかの端末が消した
      const tag = p => (p.id === e1.id ? (p.dataUri === s1 ? 'P1' : 'P1縮') : (p.id === 'qq1' ? (p.dataUri === q ? 'Q' : 'Q縮') : '?'));
      _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(target, { chosho_mgmt_no: NO2, chosho_cust_name: 'まとめる先 様' }, { importRun: true }) || '').slice(0, 80);
      o.file = (__photosOf(root.__files[NO2 + '.json']) || []).filter(p => p && p.dataUri).map(tag).join();
      o.row = (target.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).join();
      try { await prepareProjectThumbs(); } catch(_){}
      try { await projSaveNow(); } catch(_){}
      o.project = (await __idbPhotos('pj178py2', NO2)).photos.map(tag).join();
      return o;
    }, { NO, NO2, PN });
    console.log('㊷p預けた世帯へまとめたあと 📥', short(r));
    ok(!r.error, '㊷p止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.move === 1 && r.slim && /戸別ファイルにも書きました/.test(r.note) && r.file === 'Q',
         '㊷p試験の前提: 預けた世帯へまとめ、📥 で戸別ファイルに Q を書いた（預けた縮小版は書かない） → ' + short(r));
      ok(r.row === 'P1縮' && r.project === 'Q縮,P1縮', '★㊷p戸別ファイルに入れなかった預けた縮小版を行から外し、物件からも消した → ' + short({ row: r.row, project: r.project }));
    }
    await ctx.close();
  }

  // ---- ㊷r 預けた写真のある世帯（ファイルは付いていない）へ、帯の外の行（ファイルあり）を 🏢 まとめて消す（版179：世帯の行の写真もそのファイルへ入れる）----
  //      a) 預けた元の写真を読み直して入れる（縮小版を入れない）・入れて確かめたら行に持たせない
  //      b) 預けたファイルを読めない → 移さない（縮小版を元の写真としてファイルへ入れない）
  for(const mode of ['a', 'b'].filter(m => want('㊷r' + m))){
    const { ctx, page } = await openMain('㊷r' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const NO3 = '2612MKM079';
      await __openProj(__proj178('pj178pr' + mode, PN, [
        { caseId: 'c1', file: NO + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO, chosho_cust_name: '帯の外 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c2', file: NO2 + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO2, chosho_cust_name: 'まとめる先 様', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c3', file: NO3 + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const stray = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], target = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const row3 = _listRows.filter(r => r.data.chosho_mgmt_no === NO3)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(target);
      const s1 = __jpeg(900, 700, 0.85, 420);
      const e1 = await __addPhoto(s1, 'p1.jpg');
      await __pressSave();
      await openCaseInEditor(row3);
      const o = { parked: rowHasParkedThumb(target) && !(target._dir && target._name) };
      const q = __jpeg(900, 700, 0.85, 421);
      root.__files[NO + '.json'] = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '帯の外 様', chosho_photos: [{ id: 'qq1', label: 'Q', dataUri: q }] });
      stray._dir = root; stray._name = NO + '.json'; stray.fileHandle = await root.getFileHandle(NO + '.json'); stray.file = NO + '.json';
      if(mode === 'b') root.__unreadable[NO2 + '.json'] = 99;      // 預けたファイルを読めない
      const tag = p => (p.id === e1.id ? (p.dataUri === s1 ? 'P1' : 'P1縮') : (p.id === 'qq1' ? (p.dataUri === q ? 'Q' : 'Q縮') : '?'));
      try { o.move = (await aptMgMovePhotos(target, stray)).moved; } catch(e){ o.move = 'ERR ' + String(e && e.message || e).slice(0, 40); }
      o.file = (__photosOf(root.__files[NO + '.json']) || []).filter(p => p && p.dataUri).map(tag).join();
      o.row = (target.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).join();
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊷r' + mode + '預けた世帯へまとめる（版179）', short(r));
    ok(!r.error, '㊷r' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked, '㊷r' + mode + '試験の前提: まとめる先の写真を預けた → ' + short(r));
      if(mode === 'a'){
        ok(r.move === 1 && r.file === 'Q,P1', '★㊷raまとめる先の預けた縮小版を、元の写真としてファイルへ入れた → ' + short(r));
        ok(r.row === 'Q縮,P1縮', '★㊷ra入れて確かめた元の写真を、まとめる先の行に持たせたまま → ' + short(r));
      } else {
        ok(/^ERR まとめる先の写真のうち 1 枚/.test(String(r.move)) && r.file === 'Q' && r.row === 'P1縮',
           '★㊷rb預けたファイルを読めないのに、縮小版をファイルへ入れて移した → ' + short(r));
      }
    }
    await ctx.close();
  }

  // ---- ㊷q 台帳で作った行の写真を その１ に預けた → 預けたファイルをほかの端末が消した → 保存で新しいファイルを作るとき ----
  //      qa) 写真がみな預けた縮小版 → 作らない（物件に同じものがある）・知らせる
  //      qb) この画面で足した写真がある → 作る。預けた縮小版は入れずに知らせる
  for(const mode of ['a', 'b'].filter(m => want('㊷q' + m))){
    const { ctx, page, said } = await openMain('㊷q' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      await __openProj(__proj178('pj178pz' + mode, PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const s1 = __jpeg(900, 700, 0.85, 417), s2 = __jpeg(900, 700, 0.85, 418), s3 = __jpeg(900, 700, 0.85, 419);
      const e1 = await __addPhoto(s1, 'p1.jpg'), e2 = await __addPhoto(s2, 'p2.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row) && !row.fileHandle };
      delete root.__files[NO + '.json'];                           // 預けたファイルを、ほかの端末が消した
      await openCaseInEditor(row);
      let e3 = null;
      if(mode === 'b') e3 = await __addPhoto(s3, 'p3.jpg');
      const tag = p => (p.id === e1.id ? (p.dataUri === s1 ? 'P1' : 'P1縮') : (p.id === e2.id ? (p.dataUri === s2 ? 'P2' : 'P2縮')
                        : ((e3 && p.id === e3.id) ? (p.dataUri === s3 ? 'P3' : 'P3縮') : '?')));
      __setTel('090-1111-2222');
      const b = await __pressSave();
      o.after = { pressed: b.pressed, files: Object.keys(root.__files).join(),
                  file: root.__files[NO + '.json'] ? (__photosOf(root.__files[NO + '.json']) || []).filter(p => p && p.dataUri).map(tag).join() : null,
                  row: (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).join() };
      try { await prepareProjectThumbs(); } catch(_){}
      try { await projSaveNow(); } catch(_){}
      o.after.project = (await __idbPhotos('pj178pz' + mode, NO)).photos.length;
      return o;
    }, { NO, NO2, PN, mode });
    const last = alerts(said).slice(-1)[0] || '';
    console.log('㊷q' + mode + '預けたファイルが消えて新しく作る', short(r), short(last.slice(0, 160)));
    ok(!r.error, '㊷q' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.after.pressed, '㊷q' + mode + '試験の前提: 預けて、保存を押せた → ' + short(r));
      if(mode === 'a'){
        ok(r.after.file === null && /戸別ファイルは作っていません/.test(last), '★㊷qa預けた縮小版しか無いのに、新しい戸別ファイルを作った → ' + short(r.after) + ' ' + short(last.slice(0, 80)));
        ok(r.after.row === 'P1縮,P2縮' && r.after.project === 2, '★㊷qa行・物件から預けた縮小版が無くなった → ' + short(r.after));
      } else {
        ok(r.after.file === 'P3' && /2 枚は、戸別ファイルから元の写真を読めなかった/.test(last),
           '★㊷qb新しく作った戸別ファイルに預けた縮小版を元の写真として書いた・知らせない → ' + short(r.after) + ' ' + short(last.slice(0, 160)));
        ok(r.after.project === 3, '★㊷qb物件から写真が減った → ' + short(r.after));
      }
    }
    await ctx.close();
  }

  // ---- ㊶e 🔄 一括再保存：ファイルの付いていない行（物件の工事フォルダに書いた行）の預けた元の写真をいま読めない ----
  //      → 縮小版で書き出さない（見直し：前は縮小版をその戸別のファイルとしてダウンロードに書き出していた）
  if(want('㊶e')){
    const { ctx, page } = await openMain('㊶e');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pv', PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } },
        { caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0], row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      await __addPhoto(__jpeg(900, 700, 0.85, 409), 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row), fh: !!row.fileHandle };
      list.__unreadable[NO + '.json'] = 99;
      const res = await bulkReencodeTargets({ targets: [row], newFormat: 'plain', pwSrc: 'keep', newPw: null, statusEl: null });
      o.after = { photoSkip: res.photoSkip, ok: res.ok };
      return o;
    }, { NO, NO2, PN });
    console.log('㊶e一括再保存（ファイルの無い行）', short(r));
    ok(!r.error, '㊶e止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && !r.fh, '㊶e試験の前提: 物件の工事フォルダに書いて預けた（行にファイルは付いていない） → ' + short(r));
      ok(r.after.photoSkip === 1 && r.after.ok === 0, '★㊶e預けた元の写真を読めないのに、縮小版をその戸別のファイルとして書き出した → ' + short(r.after));
    }
    await ctx.close();
  }

  // ---- ㊶f・㊶g 台帳で作った行の写真を その１ に預けたあと、フォルダの名前を変えた（前のファイルは読めない）→ 💾 反映で別の場所のファイルに結び付けた ----
  //      f) そのファイルの写真は同じ写真の別の大きさ（預け先は移らない）→ 開くと縮小版・保存しても、そのファイルの写真を縮小版にしない
  //      g) そのファイルに同じ写真が同じ大きさで入っている → 預け先もそのファイルへ（開くと元の写真）
  for(const mode of ['f', 'g'].filter(m => want('㊶' + m))){
    const { ctx, page } = await openMain('㊶' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      await __openProj(__proj178('pj178pw' + mode, PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row2 = _listRows[0];
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const rootA = __mk('その１', {});
      window.showDirectoryPicker = async () => rootA;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');
      const src = __jpeg(900, 700, 0.85, 410);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();
      await openCaseInEditor(row2);
      const o = { parked: rowHasParkedThumb(row) };
      const P2 = __jpeg(900, 700, 0.8, 410);                      // 同じ写真の別の大きさ（ほかの端末で軽くした等）
      const j = JSON.parse(rootA.__files[NO + '.json']);
      if(mode === 'f') j.chosho_photos = j.chosho_photos.map(p => (p && p.id === ed.id) ? Object.assign({}, p, { dataUri: P2 }) : p);
      const rootB = __mk('その１（完了）', { [NO + '.json']: JSON.stringify(j, null, 2) });
      delete rootA.__files[NO + '.json'];                         // 前の場所のファイルはもう無い
      window.showDirectoryPicker = async () => rootB;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null; _projDirHandle = null;
      const res = await lgwbAttachFrom(rootB, false);
      o.attached = !!(res && res.hit >= 1 && row.fileHandle && row._dir === rootB);
      await openCaseInEditor(row);
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : (p.dataUri === P2 ? 'P2' : 'P縮')) : '?';
      const tt = document.getElementById('ui-toast');
      o.open = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(tag), toast: (tt && tt.style.display !== 'none') ? tt.textContent.slice(0, 30) : '' };
      __setTel('090-1111-2222');
      const b = await __pressSave();
      const fj = JSON.parse(rootB.__files[NO + '.json']);
      o.after = { pressed: b.pressed, file: (fj.chosho_photos || []).filter(p => p && p.dataUri).map(tag), tel: fj.chosho_cust_tel || '' };
      return o;
    }, { NO, NO2, PN, mode });
    console.log('㊶' + mode + '別の場所のファイルに結び付けた', short(r));
    ok(!r.error, '㊶' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.parked && r.attached, '㊶' + mode + '試験の前提: 預けたあと、別の場所のファイルに結び付いた → ' + short(r));
      if(mode === 'f'){
        ok(r.open.shown.join() === 'P縮' && /読めなかった/.test(r.open.toast), '㊶f試験の前提: 前の預け先は読めず、縮小版のまま出して知らせる → ' + short(r.open));
        ok(r.after.pressed && r.after.file.join() === 'P2' && r.after.tel === '090-1111-2222',
           '★㊶f保存で、結び付いたファイルの写真を預けた縮小版で上書きした・直しが入らない → ' + short(r.after));
      } else {
        ok(r.open.shown.join() === 'P' && !/読めなかった/.test(r.open.toast), '★㊶g結び付いたファイルに同じ写真が入っているのに、預け先を移さない（開くと縮小版） → ' + short(r.open));
        ok(r.after.pressed && r.after.file.join() === 'P' && r.after.tel === '090-1111-2222', '★㊶g保存で、ファイルの元の写真が縮小版になった → ' + short(r.after));
      }
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

  // ---- ㉗p 預けた縮小版を持つ行の「💾 保存」（名前を付けて保存）：ファイルを選ぶ画面を開かない（#174 と #176 の取り決め） ----
  for(const mode of ['p'].filter(m => want('㉗' + m))){
    const { ctx, page, said } = await openMain('㉗' + mode);
    const r = await run(page, async ({ NO, NO2, PN }) => {
      await __openProj(__proj178('pj178pp', PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
                         payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');   // 台帳で作った行（物件から開いた行ではない）
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const root = __mk('その１', {});
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      __setField('amplifier', 'amp_3u43');                            // 図面あり
      const src = __jpeg(900, 700, 0.85, 331);
      const ed = await __addPhoto(src, 'p.jpg');
      await __pressSave();                                            // 物件に保存 → 戸別ファイルへ書いて預ける
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      await lgwbAttachFrom(root, false);                              // ㊳b と同じ：行にファイルが付く
      await openCaseInEditor(row2);
      const broken = root.__files[NO + '.json'].slice(0, 60);
      root.__files[NO + '.json'] = broken;                            // 読めない
      await openCaseInEditor(row);
      await __pressSave();                                            // 読めないまま保存 → 書かない・縮小版の印が外れる
      await openCaseInEditor(row2);
      await openCaseInEditor(row);                                    // 開き直す（預けた縮小版のまま）
      const Pt = ((STATE.photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri;
      const pre = { fromProject: !!row._fromProject, flag: !!row.data.chosho_photos_thumb, parked: rowHasParkedThumb(row),
                    shownOrig: Pt === src, shownN: (STATE.photos || []).filter(p => p && p.dataUri).length };
      /* ファイルを選ぶ画面。利用者は工事フォルダの戸別ファイルを選んで置き換える。Chrome と同じく、選んだファイルを こちらへ渡す前に空にする */
      const picks = [];
      window.showSaveFilePicker = async o => { picks.push((o && o.suggestedName) || '');
        root.__files[NO + '.json'] = ''; return await root.getFileHandle(NO + '.json'); };
      /* ダウンロード（写しの名前と中身）を拾う */
      const blobs = {}, dls = [];
      const oc = URL.createObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = oc(b); blobs[u] = b; return u; };
      const ck = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){
        if(this.download){ dls.push({ name: this.download, blob: blobs[this.href] }); return; }
        return ck.call(this); };
      const w0 = root.__writes.length;
      await document.getElementById('btn-save').onclick();           // エディタの「💾 保存」
      const dl = dls[0] || null;
      let copy = null;
      try { copy = (dl && dl.blob) ? JSON.parse(await dl.blob.text()) : null; } catch(_){ copy = '(読めない)'; }
      const tag = p => (ed && p.id === ed.id) ? (p.dataUri === src ? 'P' : (p.dataUri === Pt ? 'P縮' : 'P?')) : '?';
      return { pre, picks, fileSame: root.__files[NO + '.json'] === broken, writes: root.__writes.length - w0,
               dls: dls.map(d => d.name), copyNo: (copy && copy.chosho_mgmt_no) || null,
               copyPh: (copy && typeof copy === 'object') ? (copy.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort() : copy };
    }, { NO, NO2, PN });
    const asked = said.filter(s => s.type === 'prompt').map(s => s.msg);   // 写しの名前を聞く窓
    console.log('㉗p預けた縮小版の行の名前を付けて保存', short(r), short(asked.map(m => m.slice(0, 160))));
    ok(!r.error, '㉗p止まった → ' + r.error);
    if(!r.error){
      ok(r.pre && !r.pre.fromProject && !r.pre.flag && r.pre.parked && !r.pre.shownOrig && r.pre.shownN === 1,
         '㉗p試験の前提: 台帳で作った行（物件の行ではない）・縮小版の印が外れた・預けた縮小版のまま開いた → ' + short(r.pre));
      ok(r.picks.length === 0 && r.fileSame && r.writes === 0,
         '★㉗p預けた縮小版を持つ行の「💾 保存」で、ファイルを選ぶ画面を開いた（選んだ戸別ファイルが空にされ、縮小版で書かれる） → ' + short(r));
      ok(r.dls.length === 1 && r.dls[0] === NO + '_写し.json' && r.copyNo === NO && Array.isArray(r.copyPh) && r.copyPh.join() === 'P縮',
         '★㉗p写しを「' + NO + '_写し.json」でダウンロードの場所へ保存しない・写しの写真が違う（P縮 のはず） → ' + short(r));
      ok(asked.some(m => /物件から開いています/.test(m) && /物件に控えた小さい写真/.test(m) && /書き替えません/.test(m)),
         '★㉗p写しの窓で、写真が小さい写真で戸別ファイルは書き替えないと知らせない → ' + short(asked));
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
