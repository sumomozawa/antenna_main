/* 版181（メイン・組 m-save）保存ボタンまわり
   ★決まり★ ファイルを選ぶ画面（showSaveFilePicker）で選んだ既にあるファイルは、ブラウザがページへ渡す前に中身を空にする（Chrome の決まり）。
   選ばせたあとでは止められないので、写真・印の歯止めは画面を開く前にする。知らせは本当のことだけを言う。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① この場で作った物件の行（受付台帳・📥 で新しくできた行）の「💾 保存」→ ファイルを選ぶ画面を開かずに写し（管理番号_写し.json）。
        工事フォルダの 管理番号.json（現場の写真 G）は元のまま（F1）
        a) 台帳で作った行（まだファイルが付いていない）に写真 P を足す
        b) 同じ行を「💾 物件に保存」で書いて（ファイルは G・P）開き直す → 現場が G2 を足す → 💾 保存 → ファイルは G・P・G2 のまま
        c) 📥 現場取込で新しくできた行（_manual が外れる・ファイルは G・K）に P を足す → ファイルは G・K のまま
     ② 「パスワードなしで閲覧」で開いた暗号の戸別（伏せ字・写真なし）の 🔑・💾 → ファイルを選ぶ画面を開かずに写し（F2）
        a) 物件の暗号の行（工事フォルダに 管理番号.antenna.hyb）　b) 📁 で読んだ .antenna.hyb（物件なし）
        知らせは「パスワードなしで開いたので、氏名・電話・住所・写真は、この写しに入りません」
     ③ 写しの知らせの「小さい写真」は枚数で言う（F4）
        a) 図面のある物件の行（G縮）に元の写真 P を足す →「写真 2 枚のうち 1 枚は、物件に控えた小さい写真」
        b) G縮 だけ →「写真は、物件に控えた小さい写真です」（今までどおり）
     ④ 📁 で読んだ戸別（ファイルが付いている）の「💾 保存」「🔑」「🔐」→ ファイルを選ぶ画面を開かずに写し（S1）。
        工程の印・保留・同意書・完了書の入った元の 管理番号.json／.antenna.hyb は元のまま。「💾 上書き保存」で書くよう知らせる
        a) 管理番号.json → 💾 保存　b) 管理番号.antenna.hyb → 🔑・🔐　c) ファイルの付いていない戸別（📂 で読んだ）は今までどおりファイルを選ぶ画面
     ⑤ 「🔒 閲覧のみ」（ほかの端末が編集中）のあいだは、画面の直しを行・物件へ入れない（S2）
        a) 電話を直してタブを裏へ回す（自動保存）　b) 一覧へ戻って別の戸別を開いて保存　c) 「💾 保存」を押す（写しの名前でやめる）
        → 行・端末内・共有ファイルの電話は元のまま・帯は「物件にも戸別ファイルにも入りません」
     ⑥ 共有ファイルへ書けない（書き込みを断られた）→ 受付台帳の「保存の状態」①・メニューの帯が ⚠ とわけを出す（緑の「自動で保存されています」と言わない）。
        受付台帳を開いたままでも出し直す。書けるようになったら ✅ に戻る（S3）
     ⑦ 戸別ファイルへ書けたら、その戸別の「まだ入っていない直し」の印を下ろす（S4）
        a) 台帳で名前を直した物件の行を開いて「💾 物件に保存」（フォルダを選ぶ）→ 印 0　b) 📁 の戸別の電話をエディタで直して「💾 上書き保存」→ 印 0
        c) 台帳で保留だけ付けた（ファイルには入らない）→ 「💾 物件に保存」でも印は残る　文は「台帳やエディタで直した N 件」
     ⑧ 「💾 戸別ファイルへ反映」で台帳で作った行のファイルを新しく作る → 台帳の 保留・ビラ・同意書・完了書・打合せ予定・備考 も入る（S5）
     ⑨ 🔐 全暗号化保存・🔑 ハイブリッド保存で、書いたあと読み返して大きさが合わない → 「完了しました」と言わない（S6）
     ⑩ 自動保存が書いている最中に「💾 物件に保存」→ 書き終わるまで「✅ 保存しました」と言わない・言ったときは端末内に直しが入っている（S7）
     ⑪ 🔗 共有ファイルに連動・📤 出力/保存（PC）：保存先を選ぶ画面を開く前に「既にあるファイルを選ぶと置き換わる」と確かめる（S8）
        a) 🔗 連動：やめる → 画面を開かない／続ける → 開く　b) 📤 出力/保存：やめる → 開かない／続ける → 開く
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ フォルダは試験の中で作る作り物。
   使い方: node smoke_v181_m_save_main.js [メイン index.html の file:// URL]　（ONLY=①a,⑤ で場面を絞れる） */
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
const ONLY = String(process.env.ONLY || process.env.SCENE || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();
const NO = '2612MKM077', PN = '令和８年度戸別受信設備設置工事（その１）';

/* ページの中で使う道具（smoke_v178_main.js と同じ作り物のフォルダなど）＋ この試験の道具 */
const SETUP = `
  /* 作り物のフォルダ。書くときは close で中身が入る。
     opt.ci＝Windows・Mac のように、名前の大文字・小文字を区別しないフォルダ（同じ名前なら同じファイル）。
       ファイルを引く・読む・書く・消すときだけ区別しない。isSameEntry は Chromium と同じく、渡した名前の文字どおりに比べる
       （大文字・小文字が違えば「別のもの」と答える。同じファイルでも）。
     opt.resolve＝Chromium と同じ resolve(ハンドル) を持つ（中にあるファイル・フォルダなら道のりの配列、無ければ null）。
     __unreadable[名前]＝その回数だけ、読むときに NotReadableError（同期ソフトが書き替えている最中など）。 */
  window.__mk = function(name, files, subs, opt){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __unreadable: {} };
    const ci = !!(opt && opt.ci);
    const key = n => { if(!ci || (n in d.__files)) return n;
      const k = Object.keys(d.__files).filter(k => k.toLowerCase() === String(n).toLowerCase())[0];
      return (k === undefined) ? n : k; };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        const k = key(n);
        if(!(k in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        if(d.__unreadable[k] > 0){ d.__unreadable[k]--; const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; throw e; }
        const t = d.__files[k];
        return { name:n, size: new Blob([t]).size, lastModified: Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { const k = key(n); d.__files[k] = buf; d.__writes.push({ n: k, t: buf }); } }; },
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
  /* エディタの 📷 まとめて取り込み から写真を入れる（利用者が写真を選んだのと同じ道）。type＝ファイルの種類（省略時は JPEG） */
  window.__addPhoto = async function(uri, name, type){
    const blob = await (await fetch(uri)).blob();
    const file = new File([blob], name || 'genba.jpg', { type: type || 'image/jpeg' });
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
  window.__idbPhotos = async (pid, no) => {
    const p = await projIdbGet(pid);
    const c = ((p && p.cases) || []).filter(c => ((c.payload || {}).chosho_mgmt_no || '') === no)[0];
    const pl = (c && c.payload) || {};
    return { photos: (pl.chosho_photos || []).filter(x => x && x.dataUri), thumb: !!pl.chosho_photos_thumb, count: pl.chosho_photo_count };
  };
  /* ---- ここから この試験（版181・m-save）の道具 ---- */
  /* ファイルを選ぶ画面（名前を付けて保存）。利用者は dir の中の name（省略時は勧められた名前）を選んで置き換える。
     Chrome と同じく、選んだ既にあるファイルを こちらへ渡す前に空にする */
  window.__pickerBlanks = function(dir, name){
    window.__picks = [];
    window.showSaveFilePicker = async o => { const sug = (o && o.suggestedName) || ''; window.__picks.push(sug);
      const n = name || sug; if(n in dir.__files) dir.__files[n] = ''; return await dir.getFileHandle(n, { create: true }); };
  };
  /* ダウンロード（写しの名前と中身）を拾う */
  window.__catchDownloads = function(){
    window.__dls = [];
    const blobs = {};
    const oc = URL.createObjectURL.bind(URL);
    URL.createObjectURL = b => { const u = oc(b); blobs[u] = b; return u; };
    const ck = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(){
      if(this.download){ window.__dls.push({ name: this.download, blob: blobs[this.href] }); return; }
      return ck.call(this); };
  };
  window.__dlJson = async i => { const d = (window.__dls || [])[i]; if(!d || !d.blob) return null;
    try { return JSON.parse(await d.blob.text()); } catch(_){ return '(読めない)'; } };
  /* 📁 で読んだ戸別（ファイルが付いている）として開く */
  window.__openFileRow = async function(list, fname, envOrObj){
    const fh = await list.getFileHandle(fname);
    const row = buildListRow('リスト/' + fname, 1, envOrObj, fh);
    row._dir = list; row._name = fname;
    _listRows = [row];
    await listLoadRow(row);
    return row;
  };
  window.__wait = async (fn, ms) => { for(let i = 0; i < (ms || 5000) / 50; i++){ if(fn()) return true; await new Promise(r => setTimeout(r, 50)); } return !!fn(); };
  window.__v = id => (document.getElementById(id) || {}).value;
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

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['rowOpenedFromProject','saveStateFromProject','saveStateProjNote','saveState','saveStateEncrypted','saveStateHybrid','listLoadRow',
                    'rtSetCaseReadOnlyUI','rtIsCaseReadOnly','syncEditorToRowData','lgSaveStateHtml','updateSaveStateBar','lgTouchedCount','lgwbScan',
                    'lgwbCreateMissing','overwriteSaveCurrent','overwriteSaveCurrentToProject','projSaveNow','attachProjectFile','exportProjectFlow',
                    'createManualRow','applyGenbaMergeToRow','openCaseInEditor','encryptHybrid','decryptHybrid'];
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION };
    });
    console.log('⓪前提', short(r0));
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
  }

  // ---- ① この場で作った物件の行の「💾 保存」（F1）----
  for(const mode of ['a', 'b', 'c'].filter(m => want('①' + m))){
    const { ctx, page, said } = await openMain('①' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 1811); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 1812); const kid = photoContentId(K);
      const fileText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba',
                                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, null, 2);
      const root = __mk('その１', { [NO + '.json']: fileText }, {});
      window.showDirectoryPicker = async () => root;
      __catchDownloads();
      await __openProj(__proj178('pj181a' + mode, PN, []));
      let row;
      if(mode === 'c'){
        row = createManualRow({ chosho_mgmt_no: NO }, 'genba-import');      // 📥 現場取込：一覧に無い管理番号 → 新しい行
        await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, chosho_photos: [{ id: kid, label: '現場K', dataUri: K }] }, { importRun: true });
      } else row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様' }, 'manual');   // 受付台帳で行を足した
      const o = { manual: !!row._manual, origin: row._origin || '', fromProject: !!row._fromProject };
      await openCaseInEditor(row);
      const P = __jpeg(900, 700, 0.85, 1813); const eP = await __addPhoto(P, 'p.jpg');
      const G2 = __jpeg(800, 600, 0.85, 1814);
      const tag = p => p.id === gid ? 'G' : (eP && p.id === eP.id ? 'P' : (p.id === kid ? 'K' : (p.id === 'G2' ? 'G2' : '?')));
      if(mode === 'b'){
        o.save1 = (await __pressSave()).text;                       // 💾 物件に保存（工事フォルダを選ぶ）
        o.file1 = (__photosOf(root.__files[NO + '.json']) || []).map(tag).sort().join();
        openListView();
        await openCaseInEditor(_listRows.filter(x => x.data.chosho_mgmt_no === NO)[0]);   // 開き直す
        const j = JSON.parse(root.__files[NO + '.json']);           // 開き直したあとで、現場が写真 G2 を足した
        j.chosho_photos.push({ id: 'G2', label: '現場で足した', dataUri: G2 });
        root.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      }
      o.fileBefore = (__photosOf(root.__files[NO + '.json']) || []).map(tag).sort().join();
      __pickerBlanks(root, NO + '.json');                           // 利用者は工事フォルダの 管理番号.json を選んで置き換える
      await document.getElementById('btn-save').onclick();         // エディタの「💾 保存」
      o.picks = window.__picks;
      o.fileAfter = (__photosOf(root.__files[NO + '.json'] || '{}') || []).map(tag).sort().join();
      o.dls = __dls.map(d => d.name);
      const c = await __dlJson(0);
      o.copyPh = (c && typeof c === 'object') ? (c.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort().join() : c;
      return o;
    }, { NO, PN, mode });
    const asked = said.filter(s => s.type === 'prompt').map(s => s.msg);
    console.log('①' + mode + ' この場で作った物件の行の 💾 保存', short(r), short(asked.map(m => m.slice(0, 160))));
    ok(!r.error, '①' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'c') ok(r.origin === 'genba-import' && !r.manual, '①c試験の前提: 📥 で新しくできた行は _manual が外れ、_origin が残る → ' + short(r));
      else ok(r.manual && !r.fromProject, '①' + mode + '試験の前提: 台帳で作った行（_manual）・物件を読み直していない → ' + short(r));
      if(mode === 'b') ok(r.save1 === '💾 物件に保存' && r.file1 === 'G,P', '①b試験の前提: 「💾 物件に保存」でファイルは G・P → ' + short(r));
      const want0 = { a: 'G', b: 'G,G2,P', c: 'G,K' }[mode];
      ok(r.fileBefore === want0, '①' + mode + '試験の前提: 工事フォルダの ' + NO + '.json は ' + want0 + ' → ' + short(r));
      ok(Array.isArray(r.picks) && r.picks.length === 0 && r.fileAfter === want0,
         '★①' + mode + 'この場で作った物件の行の「💾 保存」で、ファイルを選ぶ画面を開いた（選んだ戸別ファイルが空にされ、画面の写真だけで書かれる＝'
         + want0 + ' が ' + r.fileAfter + ' になった） → ' + short(r));
      ok(Array.isArray(r.dls) && r.dls.length === 1 && r.dls[0] === NO + '_写し.json' && /P/.test(r.copyPh || ''),
         '★①' + mode + '写し（' + NO + '_写し.json・足した P 入り）をダウンロードの場所へ保存しない → ' + short(r));
      ok(asked.some(m => /物件から開いています/.test(m) && /書き替えません/.test(m)), '★①' + mode + '写しにすること（戸別ファイルは書き替えない）を知らせない → ' + short(asked));
    }
    await ctx.close();
  }

  // ---- ② パスワードなしで開いた暗号の戸別の 🔑・💾（F2）----
  for(const mode of ['a', 'b'].filter(m => want('②' + m))){
    const { ctx, page, said } = await openMain('②' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 1821); const gid = photoContentId(G);
      const env = await encryptHybrid({ chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_tel: '0120-00-0000', chosho_cust_addr: '青森市',
                                        chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                                        chosho_photos: [{ id: gid, label: '現場', dataUri: G }] }, 'pw1');
      const FN = NO + '.antenna.hyb', hybText = JSON.stringify(env, null, 2);
      const list = __mk('リスト', { [FN]: hybText });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      __catchDownloads();
      try { clearSessionPassword('試験'); } catch(_){}
      let n = 0;
      promptPassword = async () => { n++; return n === 1 ? PW_SKIP : 'pw2'; };   // 開くときは「パスワードなしで閲覧」・保存では新しいパスワード
      if(mode === 'a'){
        await __openProj(__proj178('pj181b', PN, [{ caseId: 'c1', file: 'リスト/' + FN, lastModified: 0, payload: env }]));
        await openCaseInEditor(_listRows.filter(x => x.fileType === 'hybrid')[0]);
      } else await __openFileRow(list, FN, env);                  // 📁 で読んだ .antenna.hyb（物件なし）
      const o = { masked: !!document.getElementById('photo-mask-banner'), name: __v('chosho_cust_name'),
                  shown: (STATE.photos || []).filter(p => p && p.dataUri).length };
      __pickerBlanks(list, FN);                                     // 利用者は工事フォルダの .antenna.hyb を選んで置き換える
      await document.getElementById('btn-save-hyb').onclick();     // 🔑 ハイブリッド保存
      await document.getElementById('btn-save').onclick();         // 💾 保存
      o.picks = window.__picks;
      o.fileSame = list.__files[FN] === hybText;
      o.dls = __dls.map(d => d.name);
      return o;
    }, { NO, PN, mode });
    const notes = said.filter(s => s.type === 'confirm' || s.type === 'prompt').map(s => s.msg);
    console.log('②' + mode + ' パスワードなしで開いた画面の保存', short(r), short(notes.map(m => m.slice(0, 200))));
    ok(!r.error, '②' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.masked && r.name === '' && r.shown === 0, '②' + mode + '試験の前提: 「パスワードなしで閲覧」で開くと伏せ字・写真なし → ' + short(r));
      ok(Array.isArray(r.picks) && r.picks.length === 0 && r.fileSame,
         '★②' + mode + 'パスワードなしで開いた画面の 🔑／💾 で、ファイルを選ぶ画面を開いた（工事フォルダの .antenna.hyb が写真0枚・氏名の無いファイルになる） → ' + short(r));
      ok(Array.isArray(r.dls) && r.dls.join() === NO + '_写し.antenna.hyb,' + NO + '_写し.json',
         '★②' + mode + '写し（' + NO + '_写し.antenna.hyb・' + NO + '_写し.json）をダウンロードの場所へ保存しない → ' + short(r));
      ok(notes.length >= 2 && notes.every(m => /パスワードなしで開いたので/.test(m) && /写しに入りません/.test(m)),
         '★②' + mode + '氏名・電話・住所・写真が写しに入らない（パスワードなしで開いたため）と知らせない → ' + short(notes));
      if(mode === 'a') ok(notes.every(m => /物件から開いています/.test(m) && /2612MKM077\.antenna\.hyb）は、ここからは書き替えません/.test(m)),
         '★②a物件の暗号の行なのに「物件から開いています」・戸別ファイル（' + NO + '.antenna.hyb）は書き替えないと知らせない（物件から開いた印が立たない） → ' + short(notes));
      else ok(notes.every(m => /戸別ファイル（2612MKM077\.antenna\.hyb）から開いています/.test(m) && !/物件から開いています/.test(m) && !/「💾 上書き保存」で書いて/.test(m)),
         '★②b📁 の .hyb をパスワードなしで開いた画面で、戸別ファイルから開いていると言わない・押せない「💾 上書き保存」へ案内した → ' + short(notes));
    }
    await ctx.close();
  }

  // ---- ③ 写しの知らせの「小さい写真」は枚数で言う（F4）----
  for(const mode of ['a', 'b'].filter(m => want('③' + m))){
    const { ctx, page, said } = await openMain('③' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 1831); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const payload = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '', amplifier: 'amp_3u43',
                        chosho_photos: [{ id: gid, label: '現場', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      await __openProj(__proj178('pj181c' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload }]));
      await openCaseInEditor(_listRows[0]);
      __catchDownloads(); __pickerBlanks(__mk('保存先', {}));
      let P = null;
      if(mode === 'a') P = await __addPhoto(__jpeg(900, 700, 0.85, 1832), 'p.jpg');   // 元の写真を足す
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      await document.getElementById('btn-save').onclick();
      const c = await __dlJson(0);
      return { shown, addedP: !!P, picks: window.__picks, dls: __dls.map(d => d.name),
               copyN: (c && typeof c === 'object') ? (c.chosho_photos || []).filter(p => p && p.dataUri).length : c };
    }, { NO, PN, mode });
    const asked = said.filter(s => s.type === 'prompt').map(s => s.msg);
    console.log('③' + mode + ' 写しの知らせ（小さい写真の枚数）', short(r), short(asked.map(m => m.slice(0, 200))));
    ok(!r.error, '③' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === (mode === 'a' ? 2 : 1) && r.copyN === r.shown && r.picks.length === 0,
         '③' + mode + '試験の前提: 図面のある物件の行を開くと縮小版が出る・写しに画面の写真が入る → ' + short(r));
      if(mode === 'a')
        ok(asked.some(m => /写真 2 枚のうち 1 枚は、物件に控えた小さい写真/.test(m)) && !asked.some(m => /写真は、物件に控えた小さい写真です/.test(m)),
           '★③a元の写真（足した P）が混じっているのに「写真は、物件に控えた小さい写真です」と全部が小さい写真のように言う（「2 枚のうち 1 枚」と言わない） → ' + short(asked));
      else
        ok(asked.some(m => /写真は、物件に控えた小さい写真です/.test(m)) && !asked.some(m => /枚のうち/.test(m)),
           '★③b写真がみな物件の小さい写真なのに、今までの「写真は、物件に控えた小さい写真です」と言わない → ' + short(asked));
    }
    await ctx.close();
  }

  // ---- ④ 📁 で読んだ戸別（ファイルが付いている）の 💾・🔑・🔐（S1）----
  for(const mode of ['a', 'b', 'c'].filter(m => want('④' + m))){
    const { ctx, page, said } = await openMain('④' + mode);
    const r = await run(page, async ({ NO, mode }) => {
      const G = __jpeg(900, 700, 0.85, 1841); const gid = photoContentId(G);
      const st = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'completed', amplifier: 'amp_3u43',
                   survey_done: true, survey_done_at: '2026-10-01', work_done: true, work_done_at: '2026-10-05', hold_flag: true,
                   consent_received: true, compdoc_received: true, compdoc_received_at: '2026-10-06',
                   chosho_photos: [{ id: gid, label: '現場', dataUri: G }] };
      const pw = 'pw4';
      const FN = (mode === 'b') ? NO + '.antenna.hyb' : NO + '.json';
      const text = (mode === 'b') ? JSON.stringify(await encryptHybrid(st, pw), null, 2) : JSON.stringify(st, null, 2);
      const list = __mk('リスト', { [FN]: text });
      __catchDownloads();
      promptPassword = async () => pw;
      if(mode === 'b') setSessionPassword(pw);
      if(mode === 'c') applyStateData(JSON.parse(text));          // 📂 で読んだ戸別（ファイルは付いていない）
      else await __openFileRow(list, FN, JSON.parse(text));        // 📁 で読んだ戸別（ファイルが付いている）
      const o = { btn: ((document.getElementById('btn-save-overwrite') || {}).textContent || '').trim(), origin: !!(_loadedOrigin && _loadedOrigin.fileHandle) };
      __pickerBlanks(list, mode === 'c' ? '' : FN);                // 利用者は元の戸別ファイルを選んで置き換える（c は勧められた名前）
      const presses = (mode === 'b') ? ['btn-save-hyb', 'btn-save-enc'] : ['btn-save'];
      for(const id of presses) await document.getElementById(id).onclick();
      o.picks = window.__picks;
      o.fileSame = list.__files[FN] === text;
      o.dls = __dls.map(d => d.name);
      return o;
    }, { NO, mode });
    const notes = said.filter(s => s.type === 'confirm' || s.type === 'prompt').map(s => s.msg);
    console.log('④' + mode + ' 📁 の戸別の名前を付けて保存', short(r), short(notes.map(m => m.slice(0, 200))));
    ok(!r.error, '④' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'c'){
        ok(!r.origin && r.picks.length === 1 && r.picks[0] === NO + '.json' && r.dls.length === 0,
           '★④cファイルの付いていない戸別（📂 で読んだ）の「💾 保存」が、今までどおりファイルを選ぶ画面（' + NO + '.json）で保存しない → ' + short(r));
        ok(!notes.some(m => /上書き保存/.test(m)), '★④cファイルの付いていない戸別で「💾 上書き保存」を案内した → ' + short(notes));
      } else {
        ok(r.origin && r.btn === '💾 上書き保存', '④' + mode + '試験の前提: 📁 で読んだ戸別はファイルが付いていて「💾 上書き保存」が押せる → ' + short(r));
        ok(Array.isArray(r.picks) && r.picks.length === 0 && r.fileSame,
           '★④' + mode + '📁 で読んだ戸別の「' + (mode === 'b' ? '🔑・🔐' : '💾 保存') + '」で、ファイルを選ぶ画面を開いた（元の ' + (mode === 'b' ? NO + '.antenna.hyb' : NO + '.json')
           + ' が空にされ、工程の印・保留・同意書・完了書・あとから足された写真が消える） → ' + short(r));
        const wantDl = (mode === 'b') ? [NO + '_写し.antenna.hyb', NO + '_写し.antenna.enc'] : [NO + '_写し.json'];
        ok(Array.isArray(r.dls) && r.dls.join() === wantDl.join(), '★④' + mode + '写し（' + wantDl.join('・') + '）をダウンロードの場所へ保存しない → ' + short(r));
        ok(notes.length >= wantDl.length && notes.every(m => /「💾 上書き保存」で書いてください/.test(m) && /書き替えません/.test(m)),
           '★④' + mode + '戸別ファイルへは「💾 上書き保存」で書くよう知らせない → ' + short(notes));
        if(mode === 'b') ok(notes.every(m => !/パスワードなしで開いた/.test(m)), '★④bパスワードで開いた画面で「パスワードなしで開いた」と言った → ' + short(notes));
      }
    }
    await ctx.close();
  }

  // ---- ⑤ 閲覧のみのあいだは、画面の直しを行・物件へ入れない（S2）----
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑤' + m))){
    const { ctx, page } = await openMain('⑤' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const P = __proj178('pj181e' + mode, PN, [
        { caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_cust_tel: '0170-00-0000', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c2', file: 'リスト/2612MKM078.json', lastModified: 0, payload: { chosho_mgmt_no: '2612MKM078', chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openShared(P);
      const row = _listRows.filter(x => x.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      rtSetCaseReadOnlyUI(true, '別のPC');                          // ほかの端末が編集中（閲覧のみ）
      const o = { ro: rtIsCaseReadOnly(), banner: ((document.getElementById('rt-readonly-banner') || {}).textContent || '') };
      __setTel('0170-99-9999');                                      // 閲覧のみのまま電話を直した
      projAutoSaveEdit();                                            // 図面を動かした・写真を直した（図面・写真の直しの知らせ）
      o.marked = _editedCaseKeys.has(row._caseId);                   // この端末が直した戸別にされたか（物件をまとめるとき、ほかの端末の直しより先になる）
      if(mode === 'a'){
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));       // 別のアプリへ切り替えた（タブを裏へ）
        await new Promise(r => setTimeout(r, 1500));
      } else if(mode === 'b'){
        openListView();                                              // 一覧へ戻る
        await openCaseInEditor(_listRows.filter(x => x.data.chosho_mgmt_no === '2612MKM078')[0]);
        await projSaveNow();
      } else {
        window.prompt = () => null;                                  // 「💾 保存」→ 写しの名前を聞かれて やめる
        document.getElementById('btn-save').click();
        await new Promise(r => setTimeout(r, 400));
        await projSaveNow();
      }
      o.rowTel = row.data.chosho_cust_tel;
      o.idbTel = (await projIdbGet('pj181e' + mode)).cases.filter(c => c.payload.chosho_mgmt_no === NO)[0].payload.chosho_cust_tel;
      o.diskTel = JSON.parse(window.__disk).cases.filter(c => c.payload.chosho_mgmt_no === NO)[0].payload.chosho_cust_tel;
      o.touched = lgTouchedCount();
      return o;
    }, { NO, PN, mode });
    console.log('⑤' + mode + ' 閲覧のみ', short(r));
    ok(!r.error, '⑤' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.ro, '⑤' + mode + '試験の前提: 閲覧のみになった → ' + short(r));
      ok(/物件にも戸別ファイルにも入りません/.test(r.banner), '★⑤' + mode + '閲覧のみの帯が、直しても物件にも戸別ファイルにも入らないと言わない → ' + short(r.banner));
      ok(r.rowTel === '0170-00-0000' && r.idbTel === '0170-00-0000' && r.diskTel === '0170-00-0000',
         '★⑤' + mode + '閲覧のみ（帯は「入りません」）なのに、'
         + ({ a: 'タブを裏へ回しただけで', b: '一覧へ戻って別の戸別を開くと', c: '「💾 保存」を押すと' }[mode])
         + '、直した電話が行・端末内・共有ファイルに入った（ほかの端末の直しと食い違う） → ' + short(r));
      ok(r.touched === 0, '★⑤' + mode + '閲覧のみで直した欄が、受付台帳の「まだ入っていない直し」に数えられた → ' + short(r));
      ok(r.marked === false, '★⑤' + mode + '閲覧のみで図面・写真を直すと、この端末が直した戸別にされた（まとめるとき、ほかの端末の直しより先になる） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑥ 共有ファイルへ書けない → 保存の状態に ⚠（S3）----
  if(want('⑥')){
    const { ctx, page } = await openMain('⑥');
    const r = await run(page, async ({ NO, PN }) => {
      const P = __proj178('pj181f', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
                                           payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]);
      const pfh = await __openShared(P);
      openListView(); setListMode('ledger');                         // 受付台帳を開いておく
      const bar1 = () => { const d = document.createElement('div'); d.innerHTML = lgSaveStateHtml(); return d.querySelector('.lgs-item').textContent; };
      const live = () => ((document.querySelector('#lg-save-bar .lgs-item') || {}).textContent || '');
      const menu = () => { try { updateSaveStateBar(); } catch(_){} return ((document.getElementById('menu-savestate') || {}).textContent || ''); };
      const o = { live0: live() };
      const okWrite = pfh.createWritable;
      pfh.createWritable = async () => { throw new Error('書けない'); };   // ドライブが書かせない
      projTouch(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      o.warn1 = _projWriteWarn; o.html1 = bar1(); o.live1 = live(); o.menu1 = menu();
      pfh.createWritable = okWrite;                                  // 書けるようになった
      projTouch(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      o.warn2 = _projWriteWarn; o.html2 = bar1(); o.live2 = live(); o.menu2 = menu();
      return o;
    }, { NO, PN });
    console.log('⑥ 共有ファイルへ書けない', short(r));
    ok(!r.error, '⑥止まった → ' + r.error);
    if(!r.error){
      ok(!!r.warn1 && /自動で保存されています/.test(r.live0), '⑥試験の前提: 書けないと _projWriteWarn が立つ・はじめは「自動で保存されています」 → ' + short(r));
      ok(/⚠/.test(r.html1) && /共有ファイルへ保存できていません/.test(r.html1) && /共有ファイルへの保存に失敗しました/.test(r.html1) && !/自動で保存されています/.test(r.html1),
         '★⑥共有ファイルへ書けないのに、受付台帳の「保存の状態」①が緑の「自動で保存されています」のまま（⚠ とわけを出さない） → ' + short(r.html1));
      ok(/⚠/.test(r.live1) && !/自動で保存されています/.test(r.live1), '★⑥受付台帳を開いたままだと、①が「自動で保存されています」のまま出し直さない → ' + short(r.live1));
      ok(/⚠/.test(r.menu1) && !/✅/.test(r.menu1) && /共有ファイルへの保存に失敗しました/.test(r.menu1),
         '★⑥共有ファイルへ書けないのに、メニューの帯が「✅ 共有ファイルに自動で保存されています」のまま → ' + short(r.menu1));
      ok(!r.warn2 && /自動で保存されています/.test(r.html2) && /自動で保存されています/.test(r.live2) && /✅/.test(r.menu2),
         '★⑥書けるようになっても ⚠ のまま（✅ に戻らない） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑦ 戸別ファイルへ書けたら、その戸別の印を下ろす（S4）----
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑦' + m))){
    const { ctx, page } = await openMain('⑦' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const fileObj = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_cust_tel: '0170-00-0000', chosho_status: 'in_progress', amplifier: 'amp_3u43' };
      const FN = NO + '.json';
      const list = __mk('リスト', { [FN]: JSON.stringify(fileObj, null, 2) });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      const bar2 = () => { const d = document.createElement('div'); d.innerHTML = lgSaveStateHtml(); return d.querySelectorAll('.lgs-item')[1].textContent; };
      const o = {};
      let row;
      if(mode === 'b'){
        row = await __openFileRow(list, FN, JSON.parse(list.__files[FN]));   // 📁 で読んだ戸別
        __setTel('0170-12-3456');                                          // エディタで電話を直した
        o.n0 = lgTouchedCount(); o.bar0 = bar2();
        document.getElementById('btn-save-overwrite').click();             // 「💾 上書き保存」
        await __wait(() => JSON.parse(list.__files[FN]).chosho_cust_tel === '0170-12-3456', 8000);
        await new Promise(r => setTimeout(r, 300));
        o.file = { tel: JSON.parse(list.__files[FN]).chosho_cust_tel };
      } else {
        await __openProj(__proj178('pj181g' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + FN, lastModified: 0, payload: Object.assign({}, fileObj) }]));
        row = _listRows[0];
        if(mode === 'a') lgWriteCaseField(row, 'chosho_cust_name', '台帳で直した 様');   // 受付台帳で名前を直した
        else { setLedger(subCaseKey(row), { hold: true }); lgMarkTouched(row); }        // 受付台帳で保留だけ付けた
        o.n0 = lgTouchedCount(); o.bar0 = bar2();
        await openCaseInEditor(row);
        o.btn = (await __pressSave()).text;                                  // 「💾 物件に保存」（工事フォルダを選ぶ）
        const f = JSON.parse(list.__files[FN]);
        o.file = { name: f.chosho_cust_name, hold: !!f.hold_flag };
      }
      o.n1 = lgTouchedCount(); o.edited = !!row._lgEdited; o.bar1 = bar2();
      return o;
    }, { NO, PN, mode });
    console.log('⑦' + mode + ' 戸別ファイルへ書けたら印を下ろす', short(r));
    ok(!r.error, '⑦' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.n0 === 1, '⑦' + mode + '試験の前提: 直したら受付台帳の②に 1 件と数える → ' + short(r));
      ok(/台帳やエディタで直した 1 件/.test(r.bar0), '★⑦' + mode + '②の文が「台帳やエディタで直した 1 件」でない → ' + short(r.bar0));
      if(mode === 'a'){
        ok(r.btn === '💾 物件に保存' && r.file.name === '台帳で直した 様', '⑦a試験の前提: 「💾 物件に保存」で戸別ファイルに直した名前が入った → ' + short(r));
        ok(r.n1 === 0 && !r.edited, '★⑦a「💾 物件に保存」で戸別ファイルへ書けたのに、②の「まだ入っていません」の印が下りない → ' + short(r));
      } else if(mode === 'b'){
        ok(r.file.tel === '0170-12-3456', '⑦b試験の前提: 「💾 上書き保存」で戸別ファイルに直した電話が入った → ' + short(r));
        ok(r.n1 === 0 && !r.edited, '★⑦b「💾 上書き保存」で戸別ファイルへ書けたのに、②の「まだ入っていません」の印が下りない → ' + short(r));
      } else {
        ok(r.btn === '💾 物件に保存' && !r.file.hold, '⑦c試験の前提: 「💾 物件に保存」は台帳の保留を戸別ファイルに入れない → ' + short(r));
        ok(r.n1 === 1, '★⑦c台帳の保留がまだ戸別ファイルに入っていないのに、②の印を下ろした（「💾 戸別ファイルへ反映」を押す手がかりが消える） → ' + short(r));
      }
    }
    await ctx.close();
  }

  // ---- ⑧ 「💾 戸別ファイルへ反映」で新しく作るファイルに台帳の欄も入れる（S5）----
  if(want('⑧')){
    const { ctx, page } = await openMain('⑧');
    const r = await run(page, async ({ NO, PN }) => {
      const NO2 = '2612MKM099';
      const fileObj = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(fileObj, null, 2) });
      await __openProj(__proj178('pj181h', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload: Object.assign({}, fileObj) }]));
      const row1 = _listRows[0];
      row1._dir = list; row1._name = NO + '.json'; row1.fileHandle = await list.getFileHandle(NO + '.json');
      _listDirHandle = list;
      const m = createManualRow({ chosho_mgmt_no: NO2, chosho_cust_name: '新規 様', chosho_status: 'in_progress' }, 'manual');   // 台帳で作った行
      const tk = subCaseKey(m);
      setLedger(tk, { hold: true, consent: true, flyer: true, compdoc: true, meetAt: '2026-10-20 10:00', note: '台帳の備考' }); lgMarkTouched(tk);
      const sc = await lgwbScan(_listRows);
      const mk = await lgwbCreateMissing(list, sc.missing);
      const j = list.__files[NO2 + '.json'] ? JSON.parse(list.__files[NO2 + '.json']) : null;
      const sc2 = await lgwbScan(_listRows);                         // もう一度押したら（書き戻すものは無いはず）
      return { missing: sc.missing.length, made: mk.made.length, fails: mk.fails,
               file: j && { name: j.chosho_cust_name, hold: j.hold_flag, consent: j.consent_received, flyer: j.flyer_done, compdoc: j.compdoc_received,
                            meet: j.chosho_meet_at, note: j.chosho_note },
               again: sc2.list.map(it => it.diffs.map(d => d.label).join('・')) };
    }, { NO, PN });
    console.log('⑧ 反映で新しく作るファイル', short(r));
    ok(!r.error, '⑧止まった → ' + r.error);
    if(!r.error){
      ok(r.missing === 1 && r.made === 1 && r.file && r.file.name === '新規 様', '⑧試験の前提: 台帳で作った行のファイルを新しく作れた → ' + short(r));
      ok(r.file && r.file.hold === true && r.file.consent === true && r.file.flyer === true && r.file.compdoc === true
         && r.file.meet === '2026-10-20 10:00' && r.file.note === '台帳の備考',
         '★⑧新しく作った戸別ファイルに、台帳の 保留・同意書・ビラ・完了書・打合せ予定・備考 が入らない（それでも②の印は下ろす） → ' + short(r.file));
      ok(Array.isArray(r.again) && r.again.length === 0, '★⑧作った直後にもう一度「💾 戸別ファイルへ反映」を押すと、まだ書き戻すものがある → ' + short(r.again));
    }
    await ctx.close();
  }

  // ---- ⑨ 🔐・🔑 で読み返して大きさが合わない →「完了しました」と言わない（S6）----
  for(const btn of ['enc', 'hyb'].filter(b => want('⑨' + b) || want('⑨'))){
    const { ctx, page, said } = await openMain('⑨' + btn);
    const r = await run(page, async ({ NO, btn }) => {
      applyStateData({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43' });   // 📂 で読んだ戸別（写しにしない）
      promptPassword = async () => 'pw9';
      const dir = __mk('保存先', {});
      let picked = 0;
      window.showSaveFilePicker = async o => { picked++; const n = o.suggestedName; const fh = await dir.getFileHandle(n, { create: true });
        return Object.assign({}, fh, { createWritable: async () => { let buf = '';
          return { write: async t => { buf += t; }, close: async () => { dir.__files[n] = buf.slice(0, Math.floor(buf.length / 2)); } }; } }); };   // 途中で切れた（空き容量が足りない など）
      await document.getElementById(btn === 'enc' ? 'btn-save-enc' : 'btn-save-hyb').onclick();
      return { picked, files: Object.keys(dir.__files) };
    }, { NO, btn });
    const al = alerts(said);
    console.log('⑨' + btn + ' 読み返して合わない', short(r), short(al.map(m => m.slice(0, 120))));
    ok(!r.error, '⑨' + btn + '止まった → ' + r.error);
    if(!r.error){
      ok(r.picked === 1 && al.some(m => /中身が合いませんでした/.test(m)), '⑨' + btn + '試験の前提: ファイルを選ぶ画面で書いて、読み返すと合わない → ' + short(r) + short(al));
      ok(!al.some(m => /完了しました/.test(m)), '★⑨' + btn + '読み返して中身が合わないのに「' + (btn === 'enc' ? '🔐 暗号化保存' : '🔐🔑 ハイブリッド暗号化保存') + 'が完了しました」と言った → ' + short(al));
    }
    await ctx.close();
  }

  // ---- ⑩ 自動保存が書いている最中に「💾 物件に保存」（S7）----
  if(want('⑩')){
    const { ctx, page } = await openMain('⑩');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj181j', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_cust_tel: '0170-00-0000', chosho_status: 'in_progress', work_type: '' } }]));
      await openCaseInEditor(_listRows[0]);
      __abortPicker();                                               // 工事フォルダは選ばない
      __setTel('0170-77-7777');
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      const said = []; const oa = window.alert; window.alert = m => { said.push(String(m)); };
      _projSaving = true;                                            // 前の自動保存が書いている最中（共有ファイルの書き込みが遅い など）
      const pr = overwriteSaveCurrentToProject();
      await new Promise(r => setTimeout(r, 1200));
      const early = said.slice();
      const idbEarly = (await projIdbGet('pj181j')).cases[0].payload.chosho_cust_tel;
      _projSaving = false;                                           // 前の自動保存が書き終わった
      await Promise.race([pr, new Promise(r => setTimeout(r, 8000))]);
      await new Promise(r => setTimeout(r, 300));
      const idbAfter = (await projIdbGet('pj181j')).cases[0].payload.chosho_cust_tel;
      window.alert = oa;
      return { early: early.map(m => m.slice(0, 60)), late: said.map(m => m.slice(0, 60)), idbEarly, idbAfter };
    }, { NO, PN });
    console.log('⑩ 自動保存の最中に 💾 物件に保存', short(r));
    ok(!r.error, '⑩止まった → ' + r.error);
    if(!r.error){
      ok(r.idbEarly === '0170-00-0000', '⑩試験の前提: 前の自動保存が書いているあいだは、端末内はまだ前の電話 → ' + short(r));
      ok(!r.early.some(m => /✅/.test(m)), '★⑩自動保存が書いている最中に押すと、まだ書いていないのに「✅ 物件に保存しました」と言った → ' + short(r.early));
      ok(r.late.some(m => /✅ 物件「[^」]*」をこの端末に保存しました/.test(m)) && r.idbAfter === '0170-77-7777',
         '★⑩前の自動保存が終わったあと、直した電話を書き切って「✅ 保存しました」と言わない（端末内に直しが入らない） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑪ 🔗 共有ファイルに連動・📤 出力/保存：保存先を選ぶ画面を開く前に確かめる（S8）----
  for(const mode of ['a', 'b'].filter(m => want('⑪' + m))){
    const { ctx, page } = await openMain('⑪' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      await __openProj(__proj178('pj181k' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]));
      openMenuView();                                                // メニューの画面から押す
      const picks = [];
      window.showSaveFilePicker = async o => { picks.push((o && o.suggestedName) || ''); const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
      const go = () => mode === 'a' ? attachProjectFile() : exportProjectFlow(_currentProject.id);
      const o = {};
      // 1回目：やめる
      const p1 = go();
      await __wait(() => !!document.getElementById('proj-pick-warn') || picks.length > 0, 8000);
      const w1 = document.getElementById('proj-pick-warn');
      o.modal1 = !!w1; o.text1 = w1 ? w1.textContent : ''; o.z1 = w1 ? Number(getComputedStyle(w1).zIndex) : 0; o.picks1 = picks.length;
      const c = document.getElementById('proj-pick-cancel'); if(c) c.click();
      await Promise.race([p1, new Promise(r => setTimeout(r, 8000))]);
      o.picks1b = picks.length; o.linked = !!_projFileHandle; o.left1 = !!document.getElementById('proj-pick-warn');
      // 2回目：続ける
      const p2 = go();
      await __wait(() => !!document.getElementById('proj-pick-warn') || picks.length > 1, 8000);
      o.modal2 = !!document.getElementById('proj-pick-warn'); o.picks2a = picks.length;
      const g = document.getElementById('proj-pick-go'); if(g) g.click();
      await Promise.race([p2, new Promise(r => setTimeout(r, 8000))]);
      o.picks2 = picks.length;
      return o;
    }, { NO, PN, mode });
    const what = mode === 'a' ? '🔗 共有ファイルに連動' : '📤 出力/保存';
    console.log('⑪' + mode + ' ' + what, short(r));
    ok(!r.error, '⑪' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.modal1 && r.picks1 === 0,
         '★⑪' + mode + what + '（PC）で、保存先を選ぶ画面を確かめずに開いた（既にある共有ファイルを選ぶと、空にされてこの端末の物件で置き換わる） → ' + short(r));
      ok(/📂 共有ファイルを開く/.test(r.text1) && /置き換わります/.test(r.text1), '★⑪' + mode + '確かめの窓が「📂 共有ファイルを開く」で開くこと・選ぶと置き換わることを言わない → ' + short(r.text1));
      ok(r.z1 > 400, '★⑪' + mode + '確かめの窓がメニューの画面（z-index:400）の後ろに隠れる → ' + short(r));
      ok(r.picks1b === 0 && !r.left1 && !r.linked, '★⑪' + mode + '「やめる」を押したのに、保存先を選ぶ画面を開いた・窓が残った → ' + short(r));
      ok(r.modal2 && r.picks2a === 0 && r.picks2 === 1, '★⑪' + mode + '「続ける」を押しても、保存先を選ぶ画面を開かない → ' + short(r));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v181_m_save_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
