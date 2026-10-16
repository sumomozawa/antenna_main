/* 版178（メイン）
   物件を開いていて（工事フォルダとつながっていない）、ファイルのつながっていない戸別に
   エディタで写真を足して「物件に保存」すると、戸別ファイル（管理番号.json）に
   元の写真ではなく 物件用の縮小版（長辺512px）が書かれていた（192KB の写真が 40KB に）。
   物件の保存（prepareProjectThumbs）が、行の写真そのものを縮小版に置き換えていたため。
   ★決まり★ 戸別ファイルには、いつも元の写真（約1MBを超えるものだけ photoFitForStorage で縮めたもの）を書く。
   縮小版は物件（端末内の IndexedDB・共有ファイル）の保存のためだけに使う。どの経路でも写真の枚数は減らさない。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① 物件の行（図面なし・写真なし）に写真を足して「物件に保存」→ フォルダを選ぶ → 新しい 管理番号.json の写真が
        エディタの写真と同じ（1文字も違わない）。物件（IndexedDB）には縮小版。行の写真は元のまま（縮小版の印なし）
     ② フォルダに現場の 管理番号.json（写真 G＝原寸）があり、物件の行は G の縮小版
        a) 図面あり（開くと縮小版が画面に出る）　b) 図面なし（画面に出ない）
        → 写真 P を足して保存 → ファイルは G（原寸のまま）＋ P（元のまま）の2枚。物件（端末内）にも G と P が残る
     ③ 保存の前に自動保存が走った・「物件に保存」を2回・別の戸別を開いて戻る → それでもファイルの P は元のまま・枚数は同じ
     ④ 共有ファイルと連動していて、ほかの端末の保存とまとめた（行が作り直される）→ それでもファイルの P は元のまま
        a) 物件の行に写真なし　b) 図面のまだ無い物件の行に、物件にしか無い写真（縮小版）→ それも戸別ファイルに入る
        c) ほかの行（保存済み）の元の写真は元のまま・ほかの端末で消した写真は戻さない
     ⑤ このPCの受付台帳で作った行（物件から読んだ行ではない）＋フォルダに現場の 管理番号.json（写真 G・名前だけの枠）
        a) 写真を足さずに名前だけ直して保存 → G と枠が残る（前は「写真なし」を書いて G が消えていた）
        b) 写真を足して保存（2回）→ G と P（元のまま）の2枚のまま
        c) 写真を足して保存 → エディタで その写真を消して もう一度保存 → ファイルの写真は減らない（G・P とも残る）
        d) ファイルの中身が壊れていて読めない → 書かない・知らせる
     ⑥ 1MB を超える写真を足す → ファイルにはエディタの写真（photoFitForStorage で縮めたもの・1MB以下）がそのまま。物件には縮小版
     ⑦ 「物件に保存」でフォルダを選ばなかった → あとで 受付台帳「💾 戸別ファイルへ反映」で新しく作る → 元の写真
     ⑧ 📥 現場取込（工事フォルダを掴めなかった）→ 図面のまだ無いその戸別を開いて「物件に保存」でフォルダを選ぶ →
        現場の写真が原寸のまま入る・行と物件（端末内）からも消えない（前は開いて保存しただけで写真が消えていた）
        b) 画面に出ていない写真と同じものを入れ直しても二重にならない
     ⑨ 物件の行の縮小版しか無い写真（原寸がどこにも無い）は、新しい戸別ファイルに縮小版のまま入れる（枚数を減らさない）
        a) 図面あり　b) 図面なし　c) 開き直して（写真が画面に出る）消した写真は、行（物件）からは消える
     ⑩ フォルダから読んだ行（ファイルを持つ）で消した写真は、これまでどおり戸別ファイルからも消える。
        ファイルを持たない行は、行の写真（軽くしたもの）を書き、ファイルにしか無い写真も残す
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   フォルダは試験の中で作る作り物（getDirectoryHandle／getFileHandle／removeEntry／entries／values を持つ）。
   フォルダを選ぶ画面は window.showDirectoryPicker を差し替える。
   使い方: node smoke_v178_main.js [メイン index.html の file:// URL]　（ONLY=①,④ で場面を絞れる） */
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
  /* 作り物のフォルダ。書くときは close で中身が入る。 */
  window.__mk = function(name, files, subs){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [] };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        const t = d.__files[n];
        return { name:n, size: new Blob([t]).size, lastModified: Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { d.__files[n] = buf; d.__writes.push({ n, t: buf }); } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(n in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async (n, opt) => {
        if(!d.__subs[n]){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n); }
        return d.__subs[n]; },
      removeEntry: async n => { if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(n); delete d.__files[n]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
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
    const o = { text: b ? b.textContent : '', disabled: b ? b.disabled : null };
    if(b && b.onclick) await b.onclick();
    return o;
  };
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

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['overwriteSaveCurrent','overwriteSaveCurrentToProject','writeCurrentCaseToIndividualFile','buildIndividualContent',
                    'prepareProjectThumbs','ensureRowThumbs','projPlainPayload','projSaveNow','applyMergedLocally','openCaseInEditor',
                    'bulkImportPhotoFiles','photoFitForStorage','lgwbButton','applyGenbaMergeToRow','createManualRow'];
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION };
    });
    console.log('⓪前提', short(r0));
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
  }

  // ---- ① 物件の行に写真を足して「物件に保存」→ 新しい戸別ファイルには元の写真 ----
  if(want('①')){
    const { ctx, page, said } = await openMain('①');
    const r1 = await run(page, async ({ NO, PN }) => {
      const P = __proj178('pj178a', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 1);
      const ed = await __addPhoto(src, 'genba1.jpg');
      const list = __mk('リスト', {});
      const root = __mk('その１', {}, { 'リスト': list });
      let picks = 0;
      window.showDirectoryPicker = async () => { picks++; return root; };
      const btn = await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      const idb = await __idbPhotos('pj178a', NO);
      return { btn, picks, srcLen: src.length, srcBytes: __bytes(src), edSame: !!(ed && ed.dataUri === src), edId: ed && ed.id,
               n: ph.length, same: ph.length === 1 && ph[0].dataUri === src, lens: ph.map(p => p.dataUri.length), ids: ph.map(p => p.id),
               idb: { n: idb.photos.length, lens: idb.photos.map(p => p.dataUri.length), thumb: idb.thumb, count: idb.count, ids: idb.photos.map(p => p.id) },
               row: { thumbFlag: !!row.data.chosho_photos_thumb, same: ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src },
               thumbFile: /chosho_photos_thumb|chosho_photo_count/.test(list.__files[NO + '.json'] || '') };
    }, { NO, PN });
    const a1 = alerts(said);
    console.log('①物件の行に写真を足す', short(r1));
    ok(!r1.error, '①止まった → ' + r1.error);
    if(!r1.error){
      ok(/物件に保存/.test(r1.btn.text) && r1.btn.disabled === false && r1.picks === 1, '①試験の前提: 「物件に保存」でフォルダを選ぶ → ' + short(r1.btn) + ' picks=' + r1.picks);
      ok(r1.edSame && r1.srcBytes > 150000 && r1.srcBytes < 1000000, '①試験の前提: 約200KBの写真がそのままエディタに入る → ' + short(r1));
      ok(r1.n === 1, '★①戸別ファイルの写真の枚数が違う → ' + short(r1));
      ok(r1.same, '★①戸別ファイルに元の写真ではなく縮小版が書かれた（' + r1.srcLen + ' 字 → ' + short(r1.lens) + '）');
      ok(r1.ids[0] === r1.edId, '★①写真IDが変わった → ' + short(r1.ids) + ' / ' + r1.edId);
      ok(!r1.thumbFile, '★①物件専用の印（chosho_photos_thumb／chosho_photo_count）が戸別ファイルに入った');
      ok(r1.idb.n === 1 && r1.idb.thumb === true && r1.idb.lens[0] < r1.srcLen && r1.idb.count === 1 && r1.idb.ids[0] === r1.edId,
         '★①物件（端末内）には縮小版（写真IDそのまま）が入っていない → ' + short(r1.idb));
      ok(r1.row.thumbFlag === false && r1.row.same === true, '★①物件の保存で、行の写真が縮小版に置き換わった → ' + short(r1.row));
      ok(a1.some(m => /戸別の個別JSONも更新しました/.test(m)), '①知らせに戸別ファイルを書いたことが出ない → ' + short(a1));
    }
    await ctx.close();
  }

  // ---- ② フォルダに現場の 管理番号.json（原寸 G）があり、物件の行は G の縮小版 ----
  for(const mode of ['a', 'b'].filter(m => want('②' + m))){
    const { ctx, page, said } = await openMain('②' + mode);
    const r2 = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 2);
      const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const fileObj = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43', _origin: 'genba',
                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] };
      const payload = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      if(mode === 'a') payload.amplifier = 'amp_3u43';            // 図面あり＝開くと物件の縮小版が画面に出る
      const P = __proj178('pj178b' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      const src = __jpeg(900, 700, 0.85, 3);
      const ed = await __addPhoto(src, 'pc.jpg');
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(fileObj, null, 2) });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json']) || [];
      const g = ph.filter(p => p.id === gid)[0], p = ph.filter(p => ed && p.id === ed.id)[0];
      const idb = await __idbPhotos('pj178b' + mode, NO);
      return { shown, n: ph.length, gSame: !!(g && g.dataUri === G), pSame: !!(p && p.dataUri === src),
               lens: ph.map(x => x.dataUri.length), gLen: G.length, srcLen: src.length, gtLen: Gt.length,
               idb: { n: idb.photos.length, count: idb.count, ids: idb.photos.map(x => x.id === gid ? 'G' : (ed && x.id === ed.id ? 'P' : '?')) } };
    }, { NO, PN, mode });
    console.log('②' + mode + '現場の写真があるファイル', short(r2));
    ok(!r2.error, '②' + mode + '止まった → ' + r2.error);
    if(!r2.error){
      if(mode === 'a') ok(r2.shown === 1, '②a試験の前提: 図面のある戸別を開くと物件の縮小版が画面に出る → ' + short(r2));
      ok(r2.n === 2, '★②' + mode + '戸別ファイルの写真の枚数が違う（2枚のはず） → ' + short(r2));
      ok(r2.gSame, '★②' + mode + '現場の原寸の写真が縮小版に置き換わった → ' + short(r2));
      ok(r2.pSame, '★②' + mode + '足した写真が元の写真ではなく縮小版で書かれた → ' + short(r2));
      ok(r2.idb.n === 2 && r2.idb.count === 2 && r2.idb.ids.join() === 'G,P',
         '★②' + mode + '物件（端末内）から現場の写真が消えた（開いて保存しただけで） → ' + short(r2.idb));
    }
    await ctx.close();
  }

  // ---- ③ 保存の前に自動保存が走った・「物件に保存」を2回 ----
  if(want('③')){
    const { ctx, page } = await openMain('③');
    const r3 = await run(page, async ({ NO, PN }) => {
      const P = __proj178('pj178c', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 4);
      const ed = await __addPhoto(src, 'a.jpg');
      await projSaveNow();                               // 自動保存（1.5秒あと）が先に走った
      const afterAuto = { thumbFlag: !!row.data.chosho_photos_thumb, n: (row.data.chosho_photos || []).filter(p => p && p.dataUri).length };
      const list = __mk('リスト', {});
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await __pressSave();
      const ph1 = __photosOf(list.__files[NO + '.json']) || [];
      await projSaveNow();                               // そのあとも自動保存が走る
      await __pressSave();                               // もう一度「物件に保存」
      const ph2 = __photosOf(list.__files[NO + '.json']) || [];
      // 別の戸別を開いて戻ってから、もう一度保存
      const P2row = createManualRow({ chosho_mgmt_no: '2612MKM099', chosho_cust_name: '別 様' }, 'manual');
      await openCaseInEditor(P2row);
      await projSaveNow();
      await openCaseInEditor(row);
      const shown3 = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.dataUri === src);
      await __pressSave();
      const ph3 = __photosOf(list.__files[NO + '.json']) || [];
      const s = arr => ({ n: arr.length, same: arr.length === 1 && arr[0].dataUri === src, lens: arr.map(p => p.dataUri.length) });
      return { afterAuto, edSame: !!(ed && ed.dataUri === src), first: s(ph1), second: s(ph2), third: s(ph3), shown3, writes: list.__writes.length };
    }, { NO, PN });
    console.log('③自動保存・2回', short(r3));
    ok(!r3.error, '③止まった → ' + r3.error);
    if(!r3.error){
      ok(r3.writes >= 3, '③試験の前提: 3回とも戸別ファイルを書く → ' + short(r3));
      ok(r3.afterAuto.thumbFlag === false && r3.afterAuto.n === 1, '★③自動保存で、行の写真が縮小版に置き換わった → ' + short(r3.afterAuto));
      ok(r3.first.same, '★③自動保存のあとの「物件に保存」で、縮小版が書かれた → ' + short(r3.first));
      ok(r3.second.same, '★③2回目の「物件に保存」で、縮小版が書かれた → ' + short(r3.second));
      ok(r3.shown3.length === 1 && r3.shown3[0] === true, '★③別の戸別を開いて戻ると、エディタの写真が縮小版になっている → ' + short(r3.shown3));
      ok(r3.third.same, '★③開き直して保存すると、縮小版が書かれた → ' + short(r3.third));
    }
    await ctx.close();
  }

  // ---- ④ 共有ファイルと連動していて、ほかの端末の保存とまとめた ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('④' + m))){
    const { ctx, page, said } = await openMain('④' + mode);
    const r4 = await run(page, async ({ NO, NO2, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 13);
      const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const pl = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' };
      if(mode === 'b') Object.assign(pl, { chosho_photos: [{ id: gid, label: '物件にしか無い', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 });
      const P = __proj178('pj178d' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload: pl }]);
      P.updatedAt = '2026-10-15T00:00:00.000Z';
      let disk = JSON.stringify(P);
      const pfh = { kind: 'file', name: PN + '.json',
        getFile: async () => ({ name: PN + '.json', size: disk.length, lastModified: Date.now(), text: async () => disk }),
        createWritable: async () => { let buf = ''; return { write: async t => { buf += t; }, close: async () => { disk = buf; } }; },
        queryPermission: async () => 'granted', requestPermission: async () => 'granted' };
      try { listCensusClear(); } catch(_){}
      _listRows = []; _listDirHandle = null; _projDirHandle = null;
      await projIdbPut(P);
      await applyProject(P, { silent: true, fileHandle: pfh });
      try { writeSharedBak = async () => {}; } catch(_){}
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 5);
      const ed = await __addPhoto(src, 'b.jpg');
      // ほかの端末が、別の戸別を足して共有ファイルを保存した
      const other = JSON.parse(disk);
      other.updatedAt = '2026-10-15T01:00:00.000Z';
      const o2 = { chosho_mgmt_no: NO2, chosho_cust_name: '別の端末 様', chosho_status: 'in_progress', work_type: '' };
      let Q = null, qid = '', X = null;
      if(mode === 'c'){
        // c) この端末の別の行（NO2）は、前に足した元の写真 Q と、物件の縮小版 X を持っている（保存は済み）。
        //    ほかの端末はその行の X を消して保存した → まとめたあと、X は戻らず、Q は元の写真のまま
        Q = __jpeg(900, 700, 0.85, 14); qid = photoContentId(Q);
        X = await makeThumbDataUri(__jpeg(900, 700, 0.85, 15), PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
        const Qt = await makeThumbDataUri(Q, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
        const r2 = { file: 'リスト/' + NO2 + '.json', lastModified: 0, fileType: 'plain', envelope: null, unlocked: true, _fromProject: true, _caseId: 'c2',
          data: Object.assign({}, o2, { chosho_photos: [{ id: 'px', label: 'X', dataUri: X }, { id: qid, label: 'Q', dataUri: Q }] }), _photoCount: 2 };
        _listRows.push(r2);
        Object.assign(o2, { chosho_photos: [{ id: qid, label: 'Q', dataUri: Qt }], chosho_photos_thumb: true, chosho_photo_count: 1 });
      }
      other.cases.push({ caseId: 'c2', file: 'リスト/' + NO2 + '.json', lastModified: 0, payload: o2 });
      disk = JSON.stringify(other);
      const list = __mk('リスト', {});
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await __pressSave();
      let ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      const merged = JSON.parse(disk);
      const gIn = ph.filter(p => p.id === gid).map(p => p.dataUri === Gt);
      ph = ph.filter(p => p.id !== gid);
      const n2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      const other2 = n2 ? (n2.data.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id === qid ? (p.dataUri === Q ? 'Q元' : 'Q縮') : (p.id === 'px' ? 'X' : '?')) : null;
      return { gIn, other2, edSame: !!(ed && ed.dataUri === src), n: ph.length, same: ph.length === 1 && ph[0].dataUri === src,
               lens: ph.map(p => p.dataUri.length), srcLen: src.length,
               mergedNos: merged.cases.map(c => (c.payload || {}).chosho_mgmt_no).sort(), rowReplaced: _listRows.indexOf(row) < 0,
               editLinked: !!(_editingRow && _editingRow.data && _editingRow.data.chosho_mgmt_no === NO) };
    }, { NO, NO2, PN, mode });
    console.log('④' + mode + '共有ファイルとまとめた', short(r4));
    ok(!r4.error, '④' + mode + '止まった → ' + r4.error);
    if(!r4.error){
      if(mode === 'b') ok(r4.gIn.length === 1 && r4.gIn[0] === true,
         '★④b図面のまだ無い物件の行にしか無い写真が、共有ファイルとまとめたあとの保存で戸別ファイルに入らない → ' + short(r4.gIn));
      if(mode !== 'b') ok(r4.gIn.length === 0, '④' + mode + '試験の前提: 物件の行に写真は無い → ' + short(r4.gIn));
      if(mode === 'c') ok(r4.other2 && r4.other2.join() === 'Q元',
         '★④cまとめたあと、ほかの行の写真が縮小版に戻った／ほかの端末で消した写真が戻ってきた → ' + short(r4.other2));
      ok(r4.mergedNos.join() === [NO, NO2].sort().join() && r4.rowReplaced && r4.editLinked,
         '④' + mode + '試験の前提: ほかの端末の保存とまとめて、行が作り直される → ' + short(r4));
      ok(r4.n === 1, '★④' + mode + '戸別ファイルの写真の枚数が違う → ' + short(r4));
      ok(r4.same, '★④' + mode + '共有ファイルとまとめたあと、戸別ファイルに縮小版が書かれた（' + r4.srcLen + ' 字 → ' + short(r4.lens) + '）');
    }
    await ctx.close();
  }

  // ---- ⑤ このPCの受付台帳で作った行＋フォルダに現場の 管理番号.json ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('⑤' + m))){
    const { ctx, page, said } = await openMain('⑤' + mode);
    const r5 = await run(page, async ({ NO, PN, mode }) => {
      await __openProj(__proj178('pj178e' + mode, PN, []));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const G = __jpeg(900, 700, 0.85, 6);
      const gid = photoContentId(G);
      const fileObj = { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', _origin: 'genba',
                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }, { id: 'pslot', label: '名前だけの枠', dataUri: null }] };
      const root = __mk('その１', { [NO + '.json']: (mode === 'd') ? '{"chosho_mgmt_no":"' + NO + '","chosho_photos":[{"id":"' : JSON.stringify(fileObj, null, 2) });
      const before = root.__files[NO + '.json'];
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const o = {};
      if(mode === 'a'){
        const el = document.getElementById('chosho_cust_name');
        el.value = '台帳 様（直した）'; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change'));
      }
      let src = null, ed = null;
      if(mode !== 'a'){ src = __jpeg(900, 700, 0.85, 7); ed = await __addPhoto(src, 'p.jpg'); }
      await __pressSave();
      if(mode === 'd') return { untouched: root.__files[NO + '.json'] === before, writes: root.__writes.length };
      let ph = __photosOf(root.__files[NO + '.json']) || [];
      if(mode === 'b'){ o.first = ph.length; await __pressSave(); ph = __photosOf(root.__files[NO + '.json']) || []; }   // もう一度保存（増えも減りもしない）
      if(mode === 'c'){
        // エディタで足した写真を消して、もう一度保存（ファイルの写真は減らさない）
        STATE.photos = (STATE.photos || []).filter(p => !(p && ed && p.id === ed.id));
        try { renderPhotoInputs(); } catch(_){}
        try { markEditorDirty(); } catch(_){}
        o.first = ph.length;
        await __pressSave();
        ph = __photosOf(root.__files[NO + '.json']) || [];
      }
      const j = JSON.parse(root.__files[NO + '.json']);
      const g = ph.filter(p => p.id === gid)[0], p = ph.filter(p => ed && p.id === ed.id)[0];
      return Object.assign(o, { n: ph.length, gSame: !!(g && g.dataUri === G), pSame: src ? !!(p && p.dataUri === src) : null,
               name: j.chosho_cust_name, slot: (j.chosho_photos || []).some(x => x && x.id === 'pslot' && !x.dataUri),
               lens: ph.map(x => x.dataUri.length), writes: root.__writes.length });
    }, { NO, PN, mode });
    console.log('⑤' + mode + '台帳で作った行', short(r5), mode === 'd' ? short(alerts(said).slice(-1).map(m => m.slice(0, 160))) : '');
    ok(!r5.error, '⑤' + mode + '止まった → ' + r5.error);
    if(!r5.error && mode === 'd'){
      ok(r5.untouched && r5.writes === 0, '★⑤d中身を読めない戸別ファイルを上書きした（写真を確かめられないのに） → ' + short(r5));
      ok(alerts(said).some(m => /もとのファイルを読めませんでした/.test(m)), '★⑤d読めなかったので書かなかったことを知らせない → ' + short(alerts(said)));
    }
    if(!r5.error && mode !== 'd'){
      ok(r5.writes >= 1, '⑤' + mode + '試験の前提: 戸別ファイルを書く → ' + short(r5));
      if(mode === 'a'){
        ok(r5.name === '台帳 様（直した）', '⑤a試験の前提: 直した名前がファイルに入る → ' + short(r5));
        ok(r5.n === 1 && r5.gSame, '★⑤a写真の無い行を保存すると、戸別ファイルにあった現場の写真が消える → ' + short(r5));
      } else {
        ok(r5.n === 2 && r5.gSame, '★⑤' + mode + '戸別ファイルにあった現場の写真が消えた・変わった → ' + short(r5));
        ok(r5.pSame, '★⑤' + mode + '足した写真が元の写真ではない（縮小版） → ' + short(r5));
      }
      if(mode === 'b' || mode === 'c') ok(r5.first === 2, '⑤' + mode + '試験の前提: 1回目の保存で2枚 → ' + short(r5));
      ok(r5.slot, '★⑤' + mode + '戸別ファイルの名前だけの枠が消えた → ' + short(r5));
    }
    await ctx.close();
  }

  // ---- ⑥ 1MB を超える写真 ----
  if(want('⑥')){
    const { ctx, page } = await openMain('⑥');
    const r6 = await run(page, async ({ NO, PN }) => {
      const P = __proj178('pj178f', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const big = __jpeg(2600, 1950, 0.92, 8);
      const ed = await __addPhoto(big, 'big.jpg');
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      const idb = await __idbPhotos('pj178f', NO);
      return { bigBytes: __bytes(big), edBytes: ed ? __bytes(ed.dataUri) : 0, edEdge: ed ? await __edge(ed.dataUri) : 0,
               n: ph.length, same: !!(ed && ph.length === 1 && ph[0].dataUri === ed.dataUri),
               fileBytes: ph.map(p => __bytes(p.dataUri)), fileEdge: ph.length ? await __edge(ph[0].dataUri) : 0,
               idbEdge: idb.photos.length ? await __edge(idb.photos[0].dataUri) : 0, idbThumb: idb.thumb };
    }, { NO, PN });
    console.log('⑥1MBを超える写真', short(r6));
    ok(!r6.error, '⑥止まった → ' + r6.error);
    if(!r6.error){
      ok(r6.bigBytes > 1100000 && r6.edBytes <= 1048576 && r6.edEdge > 512 && r6.edEdge <= 2048,
         '⑥試験の前提: 1MBを超える写真は入れるときに縮める（photoFitForStorage） → ' + short(r6));
      ok(r6.n === 1 && r6.same, '★⑥戸別ファイルの写真が、エディタの写真（縮めたもの）と違う → ' + short(r6));
      ok(r6.fileEdge > 512, '★⑥戸別ファイルに縮小版（長辺512px）が書かれた → ' + short(r6));
      ok(r6.idbThumb && r6.idbEdge > 0 && r6.idbEdge <= 512, '★⑥物件（端末内）に縮小版が入っていない → ' + short(r6));
    }
    await ctx.close();
  }

  // ---- ⑦ フォルダを選ばなかった → あとで 💾 戸別ファイルへ反映 で新しく作る ----
  if(want('⑦')){
    const { ctx, page, said } = await openMain('⑦');
    const r7 = await run(page, async ({ NO, NO2, PN }) => {
      const P = __proj178('pj178g', PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openProj(P);
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 9);
      const ed = await __addPhoto(src, 'c.jpg');
      window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
      await __pressSave();
      await projSaveNow();
      const root = __mk('工事フォルダ', { [NO2 + '.json']: JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '別 様' }, null, 2) });
      window.showDirectoryPicker = async () => root;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};               // 書いたあとの一覧の読み直し（ここでは見ない）は止めておく
      await lgwbButton();
      const ph = __photosOf(root.__files[NO + '.json'] || '{}') || [];
      return { made: (NO + '.json') in root.__files, n: ph.length, same: !!(ed && ph.length === 1 && ph[0].dataUri === src),
               lens: ph.map(p => p.dataUri.length), srcLen: src.length };
    }, { NO, NO2, PN });
    console.log('⑦💾 戸別ファイルへ反映', short(r7), short(alerts(said).map(m => m.slice(0, 80))));
    ok(!r7.error, '⑦止まった → ' + r7.error);
    if(!r7.error){
      ok(r7.made, '⑦試験の前提: 💾 戸別ファイルへ反映 でファイルを新しく作る → ' + short(r7));
      ok(r7.n === 1 && r7.same, '★⑦💾 戸別ファイルへ反映 で作ったファイルに、元の写真ではなく縮小版が書かれた → ' + short(r7));
    }
    await ctx.close();
  }

  // ---- ⑧ 📥 現場取込（工事フォルダを掴めなかった）→ あとで「物件に保存」でフォルダを選ぶ ----
  for(const mode of ['a', 'b'].filter(m => want('⑧' + m))){
    const { ctx, page } = await openMain('⑧' + mode);
    const r8 = await run(page, async ({ NO, PN, mode }) => {
      const P = __proj178('pj178h', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const G = __jpeg(900, 700, 0.85, 10);
      const gid = photoContentId(G);
      const genba = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
                      chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] };
      window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
      _genbaNoDir = false;
      const note = await applyGenbaMergeToRow(row, genba, { importRun: true });
      await prepareProjectThumbs(); await projSaveNow();           // 取り込みの終わりと同じ
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      if(mode === 'b') await __addPhoto(G, 'genba_again.jpg');      // 画面に出ていない写真と同じものを入れ直した
      await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      const idb = await __idbPhotos('pj178h', NO);
      return { note, shown, n: ph.length, same: ph.length === 1 && ph[0].dataUri === G, lens: ph.map(p => p.dataUri.length), gLen: G.length,
               rowN: (row.data.chosho_photos || []).filter(p => p && p.dataUri).length, pc: row._photoCount, idbN: idb.photos.length, idbCount: idb.count };
    }, { NO, PN, mode });
    console.log('⑧' + mode + '📥 現場取込のあと', short(r8));
    ok(!r8.error, '⑧' + mode + '止まった → ' + r8.error);
    if(!r8.error){
      ok(/工事フォルダを掴めていません/.test(r8.note || '') && r8.shown === 0,
         '⑧' + mode + '試験の前提: 取り込みでは戸別ファイルへ書けず、図面が無いので開いても写真は画面に出ない → ' + short(r8));
      ok(r8.n === 1 && r8.same, '★⑧' + mode + '📥 で取り込んだ現場の写真が、あとの「物件に保存」で戸別ファイルに入らない・縮小版になる → ' + short(r8));
      ok(r8.rowN === 1 && r8.pc === 1 && r8.idbN === 1 && r8.idbCount === 1,
         '★⑧' + mode + '開いて保存しただけで、行・物件（端末内）の写真が消えた／二重になった → ' + short(r8));
    }
    await ctx.close();
  }

  // ---- ⑨ 縮小版しか無い写真は、そのまま入れる（枚数を減らさない） ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑨' + m))){
    const { ctx, page } = await openMain('⑨' + mode);
    const r9 = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 11);
      const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const P = __proj178('pj178i', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: Object.assign({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                   chosho_photos: [{ id: gid, label: '物件にしか無い', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 },
                   mode === 'a' ? { amplifier: 'amp_3u43' } : {}) }]);
      await __openProj(P);
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      const src = __jpeg(900, 700, 0.85, 12);
      const ed = await __addPhoto(src, 'd.jpg');
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      const g = ph.filter(p => p.id === gid)[0], p = ph.filter(p => ed && p.id === ed.id)[0];
      const o = { shown, n: ph.length, gThumb: !!(g && g.dataUri === Gt), pSame: !!(p && p.dataUri === src) };
      if(mode === 'c'){
        // 開き直す（もう図面がある＝写真が画面に出る）→ 物件にしか無かった写真を消して保存 → 行・物件からは消える
        await openCaseInEditor(_listRows.filter(r => r.data.chosho_mgmt_no === NO)[0]);
        o.shown2 = (STATE.photos || []).filter(p => p && p.dataUri).length;
        STATE.photos = (STATE.photos || []).filter(p => !(p && p.id === gid));
        try { renderPhotoInputs(); } catch(_){}
        try { markEditorDirty(); } catch(_){}
        await __pressSave();
        const r2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
        o.rowIds = (r2.data.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id === gid ? 'G' : 'P');
        o.fileN = (__photosOf(list.__files[NO + '.json'] || '{}') || []).length;
      }
      return o;
    }, { NO, PN, mode });
    console.log('⑨' + mode + '縮小版しか無い写真', short(r9));
    ok(!r9.error, '⑨' + mode + '止まった → ' + r9.error);
    if(!r9.error){
      ok(r9.shown === (mode === 'a' ? 1 : 0), '⑨' + mode + '試験の前提: 図面があれば物件の縮小版が画面に出る・無ければ出ない → ' + short(r9));
      ok(r9.n === 2 && r9.gThumb, '★⑨' + mode + '物件にしか無い写真（縮小版）を新しい戸別ファイルに入れない＝枚数が減る → ' + short(r9));
      ok(r9.pSame, '★⑨' + mode + '足した写真が元の写真ではない → ' + short(r9));
      if(mode === 'c'){
        ok(r9.shown2 === 2, '⑨c試験の前提: 開き直すと2枚とも画面に出る → ' + short(r9));
        ok(r9.rowIds.join() === 'P', '★⑨c画面で消した写真が、行（物件）に戻ってくる（前に開いたときの覚えが残っている） → ' + short(r9));
        ok(r9.fileN === 2, '★⑨c戸別ファイルの写真が減った → ' + short(r9));
      }
    }
    await ctx.close();
  }

  // ---- ⑩ フォルダから読んだ行（ファイルを持つ）で画面から消した写真は、これまでどおり戸別ファイルからも消える ----
  if(want('⑩')){
    const { ctx, page } = await openMain('⑩');
    const r10 = await run(page, async ({ NO }) => {
      const ph = (id, n) => ({ id, label: id, dataUri: 'data:image/jpeg;base64,' + 'A'.repeat(n) });
      const file = JSON.stringify({ chosho_mgmt_no: NO, chosho_photos: [ph('k1', 900), ph('x1', 900)] });
      const fh = { getFile: async () => ({ text: async () => file }) };
      const src = { fileType: 'plain', fileHandle: fh, _photosKnown: true, data: { chosho_mgmt_no: NO, chosho_photos: [ph('k1', 900)] } };
      const nosrc = { fileType: 'plain', _photosKnown: true, data: { chosho_mgmt_no: NO, chosho_photos: [ph('k1', 400)] } };
      const a = await buildIndividualContent(src, fh);
      const b = await buildIndividualContent(nosrc, fh);
      const ids = o => (o.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id + ':' + p.dataUri.length).join(',');
      return { src: ids(a), nosrc: ids(b) };
    }, { NO });
    console.log('⑩ファイルを持つ行', short(r10));
    ok(!r10.error, '⑩止まった → ' + r10.error);
    if(!r10.error){
      ok(r10.src === 'k1:923', '★⑩フォルダから読んで開いた行で消した写真が、戸別ファイルに戻ってくる → ' + short(r10));
      ok(r10.nosrc === 'k1:423,x1:923', '★⑩ファイルを持たない行で、行の写真（軽くしたもの）を書かない・ファイルにしか無い写真を落とす → ' + short(r10));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v178_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
