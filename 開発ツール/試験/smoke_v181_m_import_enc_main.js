/* 版181（メイン）組 m-import-enc・1段目：📥 現場取込のあとの「まだ戸別ファイルに入っていない」分
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ①a 取込-1：物件を開かずに 📁 の一覧へ、台帳に無い管理番号（新しく作る行）・アパートの足りない世帯（台帳で作った行）へ 📥（写真 G・増幅器 1U）
         → 行は「台帳で作った行」のまま → 📁 で読み直しても行と G が残る（前は印が外れ、確かめの窓も出ずに行ごと消えた）
         → 読み直しの確かめの窓は出さない（台帳で作った行は読み直しても残る）
     ①b 取込-1：受付台帳で足した行（番号・名前を打った）へ 📥 → 「💾 戸別ファイルへ反映」で 管理番号.json を作る（G の元の写真・1U・台帳の名前）
         （前は反映でファイルを作らず「一致しています…消えません」と出た）。作ったら「まだ入っていない」の印を下ろす。
         反映の確かめでは、ファイルのある戸別で 📥 の分がまだ入っていない数だけを言う・反映のあとの読み直しはそれを確かめる
     ①c 取込-1 の副作用：写真の入った「台帳で作った行」（仮受付）に、カレンダーの「🗑 仮予定を削除（管理番号だけの仮メモ）」を出さない
         （写真の無い仮受付の行には今までどおり出す）
     ②  取込-5・取込-6：物件なしで 📁 の平文の戸別（写真 A・B・3U・長さ5・工事未了）へ 📥（1U・25・G・下見済・工事完了）
         → 開くと 1U・25・写真 A,B,G → 電話を直して 💾 上書き保存 → ファイルは 1U・25・A,B,G・下見済・工事完了・電話
         （前は開くとファイルの古い 3U・5 で開き、上書き保存で古い値・「未」を書いた）
         → 書けたら 📁 の読み直しで確かめの窓を出さない（もうファイルに入っている）
     ③a 取込-6：ファイルに写真の無い戸別（行が中身を持つ）へ 📥（下見済・工事完了）→ 開いて 💾 上書き保存 → ファイルも済
         → 外す方向は今までどおり：そのあとほかの端末がファイルで工事完了を外した → 開き直して保存 → 行の古い「済」で付け直さない
     ③h 取込-6：暗号（.hyb）の戸別（🔓 済み・工事未了）へ 📥（工事完了・1U）→ 開いて 💾 上書き保存 → .hyb も工事完了・1U・写真 A のまま
     ④a 取込-4：物件を開き工事フォルダをつないで、📄 で読んだ（別の場所の写し）平文の戸別を物件に取り込む → 📥（1U・25・G）
         → 工事フォルダのファイルは 1U・25 → 開くと 1U・25 → 「💾 物件に保存」のあともファイルは 1U・25・A,B,G
         （前は 📄 の古い写しで開き、物件に保存でファイルを 3U・5 に戻した）
     ④h 取込-4：同じことを 📄 の .hyb で（開くと 1U・25、物件に保存のあとも .hyb は 1U・25）
     ⑤  取込-7：物件なしの 📥 の知らせは「💾 上書き保存」を勧める（反映では現場の機器・長さ・写真は入らないと言う）
         → 「💾 戸別ファイルへ反映」の「一致しています」は、物件が無いのに「物件ファイルに保存されているので消えません」と言わない
           ・まだ戸別ファイルに入っていない戸別の数を言う
     ⑥a 取込-8：物件なしで、ファイルに写真の無い戸別へ 📥（1U）→ 開かずに 📁 で読み直す → 確かめの窓が出る（OK＝中止で行は 1U のまま）
     ⑥b 取込-8：写真だけの 📥（欄は変わらない）でも確かめの窓が出る
     ⑦  v176-6：📥 の預けの注意は、預けの台帳（proj）が空なら「別の物件」と言わない（現場で開いていただけの台帳 ledger では決めない）
     ⑧  v176-7：📥 の預けの窓で、PC の値を現場で直した値に置き換える欄は「置き換え」と言う（PC が空の欄は今までどおり「補完」）
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ フォルダは試験の中で作る作り物。
   使い方: node smoke_v181_m_import_enc_main.js [メイン index.html の file:// URL]　（ONLY=①a,② で場面を絞れる。SCENE= も同じ） */
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

const NO = '2612MKM077';
const NO2 = '2612MKM078';
const P1N = '令和８年度戸別受信設備設置工事（その１）';
const P2N = '令和８年度戸別受信設備設置工事（その２）';

/* ページの中で使う道具（版178・版180 の試験と同じ作り物のフォルダなど） */
const SETUP = `
  window.__mk = function(name, files, subs, opt){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __unreadable: {} };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        if(d.__unreadable[n] > 0){ d.__unreadable[n]--; const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; throw e; }
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
      getDirectoryHandle: async (n, o2) => {
        if(!d.__subs[n]){ if(!(o2 && o2.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n, {}, {}, opt || null); }
        return d.__subs[n]; },
      removeEntry: async n => { if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(n); delete d.__files[n]; },
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
  window.__setField = (id, v) => { const el = document.getElementById(id);
    el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); };
  window.__setTel = v => window.__setField('chosho_cust_tel', v);
  window.__v = id => (document.getElementById(id) || {}).value;
  /* 「💾」のボタンを押す（押せないボタンは押さない＝利用者と同じ） */
  window.__pressSave = async function(){
    const b = document.getElementById('btn-save-overwrite');
    const o = { text: b ? b.textContent : '', disabled: b ? b.disabled : null, pressed: false };
    if(b && !b.disabled && b.onclick){ o.pressed = true; await b.onclick(); }
    return o;
  };
  window.__rowOf = no => (_listRows || []).filter(r => r && r.data && String(r.data.chosho_mgmt_no || '').trim() === no)[0] || null;
  window.__ids = arr => (Array.isArray(arr) ? arr : []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
  window.__fileOf = (d, n) => { try { return JSON.parse(d.__files[n]); } catch(_){ return null; } };
  window.__proj = (id, name) => { const now = new Date().toISOString();
    return { schema: PROJ_SCHEMA, id, name, createdAt: now, updatedAt: now, cases: [], ledger: {}, takeout: {}, review: {} }; };
  window.__openProj = async (P) => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null; _projDirHandle = null;
    try { await projHandleDelete(P.id + ':dir'); } catch(_){}
    await projIdbPut(P);
    await applyProject(P, { silent: true });
  };
  window.__stopProjSave = () => { try { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } } catch(_){} };
  /* 📥 現場取込（本物の genbaImportFlow）。窓が出たら clickId（既定は「取り込む」）を押す。終わりの知らせを返す */
  window.__genbaImport = (files, clickId) => new Promise(res => {
    pickFile = (opts, cb) => { cb(files.map(f => new File([JSON.stringify(f.obj)], f.name, { type: 'application/json' }))); };
    const oa = window.alert;
    window.alert = m => { if(/現場データ取込 完了/.test(String(m))){ window.alert = oa; clearInterval(iv); res(String(m)); } };
    const iv = setInterval(() => { const md = document.getElementById('genba-import-modal');
      if(md && md.classList.contains('open')){ const b = document.getElementById(clickId || 'gi-import'); if(b && b.onclick) b.click(); } }, 50);
    genbaImportFlow();
  });
  /* 確かめ（confirm）と知らせ（alert）を控える。ans＝確かめへの答え（関数か真偽） */
  window.__catch = (ans) => {
    const log = { asked: [], said: [] };
    window.confirm = m => { log.asked.push(String(m)); return (typeof ans === 'function') ? !!ans(String(m)) : !!ans; };
    window.alert = m => { log.said.push(String(m)); };
    return log;
  };
  /* 📁 フォルダ（物件なし）で読む：本物の読み直し（listReloadFolder）と同じ道 */
  window.__loadFolder = async (list) => {
    _listRows = []; _listDirHandle = list;
    window.showDirectoryPicker = async () => list;
    const c = window.confirm; window.confirm = () => true;
    try { await listReloadFolder(); } finally { window.confirm = c; }
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
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 1200);
const flat = s => String(s || '').replace(/\s+/g, ' ');

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['applyGenbaMergeToRow','genbaImportFlow','listReloadFolder','listLoadRow','openCaseInEditor','overwriteSaveCurrent',
                    'lgwbButton','lgConfirmDiscardCaseEdits','sideImportWarn','openGenbaImportPreview','renderCalPanel','createManualRow',
                    'lgWriteCaseField','encryptHybrid','decryptHybrid','unlockListView','listSelectFiles','applyProject'];
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION };
    });
    console.log('⓪前提', short(r0));
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
  }

  // ---- ①a 台帳に無い管理番号・アパートの足りない世帯へ 📥 → 📁 読み直しでも残る ----
  for(const mode of ['new', 'apt']){
    const label = '①a' + (mode === 'apt' ? '2' : '');
    if(!want(label)) continue;
    const { ctx, page } = await openMain(label);
    const r = await run(page, async ({ NO, NO2, mode }) => {
      const G = __jpeg(600, 450, 0.85, 41);
      const other = { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO2 + '.json']: JSON.stringify(other, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const o = { rows0: _listRows.length };
      if(mode === 'apt') createManualRow({ chosho_mgmt_no: NO, chosho_status: 'provisional' }, 'apartment');
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '現場 様', amplifier: 'amp_1u45',
                      chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.imp = flat(await __genbaImport([{ name: NO + '.json', obj: genba }]));
      const r1 = __rowOf(NO);
      o.after = r1 ? { manual: !!r1._manual, ph: __ids(r1.data.chosho_photos), amp: r1.data.amplifier } : null;
      const log = __catch(false);                 // 確かめの窓が出たら「キャンセル」＝捨てて読み直す
      o.reload = await listReloadFolder();
      o.asked = log.asked.filter(m => /まだ戸別ファイルへ入っていません/.test(m)).length;
      const r2 = __rowOf(NO);
      o.afterReload = r2 ? { ph: __ids(r2.data.chosho_photos), amp: r2.data.amplifier, name: r2.data.chosho_cust_name } : null;
      o.rows1 = _listRows.length;
      return o;
      function flat(s){ return String(s || '').replace(/\s+/g, ' ').slice(0, 300); }
    }, { NO, NO2, mode });
    console.log(label + ' 📥 のあと 📁 読み直し（' + mode + '）', short(r));
    ok(!r.error, label + '止まった → ' + r.error);
    if(!r.error){
      ok(r.rows0 === 1 && /取込: 1 件/.test(r.imp) && r.after && r.after.ph === 'G' && r.after.amp === 'amp_1u45',
         label + '試験の前提: 📥 で行に G・1U が入る → ' + short(r));
      ok(r.after && r.after.manual, '★' + label + ' 戸別ファイルが無いままの行から「台帳で作った行」の印を外した → ' + short(r.after));
      ok(r.reload === true && r.afterReload && r.afterReload.ph === 'G' && r.afterReload.amp === 'amp_1u45',
         '★' + label + ' 📁 で読み直すと、📥 した行（写真 G ごと）が一覧から消えた → ' + short({ reload: r.reload, afterReload: r.afterReload, rows1: r.rows1 }));
      ok(r.asked === 0, '★' + label + ' 読み直しても残る行（台帳で作った行）なのに「消えます」と確かめた → ' + r.asked);
    }
    await ctx.close();
  }

  // ---- ①b 受付台帳で足した行へ 📥 → 💾 戸別ファイルへ反映 でファイルを作る ----
  //   ほかの戸別（ファイルあり）にも 📥 して、まだ戸別ファイルに入っていない状態にしておく。反映のあとの読み直しの確かめは「中止」
  //   （読み直さない＝作った行がそのまま残る。作った行の「まだ入っていない」の印が下りているかを見る）
  if(want('①b')){
    const { ctx, page } = await openMain('①b');
    const r = await run(page, async ({ NO, NO2 }) => {
      const G = __jpeg(600, 450, 0.85, 42), H = __jpeg(600, 450, 0.85, 44);
      const other = { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO2 + '.json']: JSON.stringify(other, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const row = createManualRow({}, 'manual'); lgWriteCaseField(row, 'mgmt', NO); lgWriteCaseField(row, 'name', '台帳 様');
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '台帳 様', amplifier: 'amp_1u45',
                      chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      const genba2 = { chosho_mgmt_no: NO2, _origin: 'genba', chosho_cust_name: '別 様', amplifier: 'amp_1u45',
                       chosho_photos: [{ id: 'H', label: 'H', dataUri: H }] };
      const o = {};
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }, { name: NO2 + '.json', obj: genba2 }])).replace(/\s+/g, ' ').slice(0, 200);
      o.manual = !!row._manual;
      window.showDirectoryPicker = async () => list;
      const log = __catch(true);                     // 書き戻す＝OK／読み直しの確かめ＝OK（中止する）
      try { await lgwbButton(); } catch(e){ o.lgwbErr = String(e); }
      o.said = log.said.map(m => m.replace(/\s+/g, ' ').slice(0, 200));
      o.asked = log.asked.map(m => m.replace(/\s+/g, ' ').slice(0, 600));
      o.files = Object.keys(list.__files).sort().join(',');
      const f = __fileOf(list, NO + '.json');
      o.made = f ? { amp: f.amplifier, ph: __ids(f.chosho_photos), name: f.chosho_cust_name } : null;
      const r2 = __rowOf(NO), r3 = __rowOf(NO2);
      o.rowAfter = r2 ? { same: r2 === row, name: r2.data.chosho_cust_name, unsaved: !!r2._genbaUnsaved, newer: Array.isArray(r2._rowNewer) } : null;
      o.other = r3 ? { unsaved: !!r3._genbaUnsaved, amp: r3.data.amplifier } : null;
      return o;
    }, { NO, NO2 });
    console.log('①b 📥 のあと 💾 反映', short(r));
    ok(!r.error, '①b止まった → ' + r.error);
    if(!r.error){
      ok(/取込: 2 件/.test(r.imp) && r.other && r.other.unsaved && r.other.amp === 'amp_1u45',
         '①b試験の前提: 2件とも 📥 で入り、ファイルのある戸別は「まだ入っていない」 → ' + short(r));
      ok(r.manual, '★①b 受付台帳で足した行に 📥 すると「台帳で作った行」の印が外れた → ' + short(r));
      ok(r.made && r.made.amp === 'amp_1u45' && r.made.ph === 'G' && r.made.name === '台帳 様',
         '★①b 「💾 戸別ファイルへ反映」で、📥 した行のファイル（G の元の写真・1U・台帳の名前）を作らない → ' + short({ files: r.files, made: r.made, said: r.said }));
      ok(!(r.said || []).some(m => /一致しています/.test(m)), '★①b ファイルを作るべき行があるのに「一致しています」と言った → ' + short(r.said));
      const wb = (r.asked || []).filter(m => /新しく作ります/.test(m))[0] || '';
      ok(/まだ戸別ファイルに入っていない戸別が 1 件/.test(wb),
         '★①b 反映の確かめで、📥 で入れてまだ戸別ファイルに入っていない戸別の数が違う（反映で作る戸別まで数えた・言わない） → ' + wb);
      ok(r.rowAfter && r.rowAfter.same && r.rowAfter.name === '台帳 様' && !r.rowAfter.unsaved && !r.rowAfter.newer,
         '★①b 反映で行の中身からファイルを作ったのに、行に「まだ戸別ファイルに入っていない」の印が残った → ' + short(r.rowAfter));
      ok((r.asked || []).some(m => /📥 現場取込で入れた 1 件/.test(m)),
         '★①b 反映のあとの読み直しで、📥 で入れてまだファイルに無い戸別（ファイルのある戸別）を確かめない → ' + short(r.asked));
    }
    await ctx.close();
  }

  // ---- ①c 写真の入った「台帳で作った行」に「🗑 仮予定を削除」を出さない ----
  if(want('①c')){
    const { ctx, page } = await openMain('①c');
    const r = await run(page, async ({ NO, NO2 }) => {
      const G = __jpeg(400, 300, 0.85, 43);
      _listRows = [];
      const a = createManualRow({ chosho_mgmt_no: NO, chosho_status: 'provisional', chosho_date: '2026-11-05',
                                  chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, 'manual');
      const b = createManualRow({ chosho_mgmt_no: NO2, chosho_status: 'provisional', chosho_date: '2026-11-06' }, 'manual');
      const html = row => { _calPanel = { type: 'event', tk: subCaseKey(row), evType: 'work' }; return String(renderCalPanel({}) || ''); };
      const ha = html(a), hb = html(b);
      _calPanel = null;
      return { manualA: !!a._manual, manualB: !!b._manual, delA: /cal-ev-del-row/.test(ha), delB: /cal-ev-del-row/.test(hb),
               otherA: /cal-ev-unschedule/.test(ha) };
    }, { NO, NO2 });
    console.log('①c カレンダーの仮予定を削除', short(r));
    ok(!r.error, '①c止まった → ' + r.error);
    if(!r.error){
      ok(r.manualA && r.manualB && r.delB, '①c試験の前提: 写真の無い仮受付の「台帳で作った行」には「🗑 仮予定を削除」が出る → ' + short(r));
      ok(!r.delA, '★①c 写真の入った「台帳で作った行」に「🗑 仮予定を削除（管理番号だけの仮メモ）」を出した（写真ごと行を消せる） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ② 物件なしで 📁 の平文の戸別（写真あり）へ 📥 → 開く → 💾 上書き保存 ----
  if(want('②')){
    const { ctx, page } = await openMain('②');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(600, 450, 0.85, 11), B = __jpeg(600, 450, 0.85, 12), G = __jpeg(600, 450, 0.85, 13);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43', cable_main_len: '5',
                     survey_done: false, survey_done_at: '', work_done: false, work_done_at: '',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const row = __rowOf(NO);
      const o = { row0: { slim: !!row._slim, fh: !!row.fileHandle } };
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', amplifier: 'amp_1u45', cable_main_len: '25',
                      chosho_status: 'completed', survey_done: true, survey_done_at: '2026-10-10T09:00', work_done: true, work_done_at: '2026-10-12T15:00',
                      chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }])).replace(/\s+/g, ' ').slice(0, 200);
      const r1 = __rowOf(NO);
      o.row1 = { amp: r1.data.amplifier, wd: r1.data.work_done, slim: !!r1._slim };
      const f0 = __fileOf(list, NO + '.json'); o.file0 = { amp: f0.amplifier, wd: f0.work_done };
      await openCaseInEditor(r1);
      o.ed = { amp: __v('amplifier'), len: __v('cable_main_len'), st: __v('chosho_status'),
               ph: (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','), editing: _editingRow === r1 };
      __setTel('090-1111-2222');
      const log = __catch(true);
      o.btn = await __pressSave();
      o.saveSaid = log.said.map(m => m.replace(/\s+/g, ' ').slice(0, 120));
      const f = __fileOf(list, NO + '.json');
      o.file = { amp: f.amplifier, len: f.cable_main_len, wd: f.work_done, wdAt: f.work_done_at, sd: f.survey_done, st: f.chosho_status,
                 tel: f.chosho_cust_tel, ph: __ids(f.chosho_photos) };
      const log2 = __catch(false);
      o.reload = await listReloadFolder();
      o.reloadAsked = log2.asked.filter(m => /📥 現場取込で入れた/.test(m)).length;   // 受付台帳で直した分（状態）の確かめは今までどおり
      const r2 = __rowOf(NO);
      o.row2 = r2 ? { amp: r2.data.amplifier, wd: r2.data.work_done } : null;
      return o;
    }, { NO });
    console.log('② 📥 → 開く → 💾 上書き保存', short(r));
    ok(!r.error, '②止まった → ' + r.error);
    if(!r.error){
      ok(r.row0.slim && r.row0.fh && r.row1.amp === 'amp_1u45' && r.row1.wd === true && r.file0.amp === 'amp_3u43' && r.ed.editing && r.btn.pressed,
         '②試験の前提: 写真を常駐させない 📁 の行・📥 で行は 1U・工事完了・ファイルは 3U のまま・開いて 💾 上書き保存を押せる → ' + short(r));
      ok(r.ed.amp === 'amp_1u45' && r.ed.len === '25' && r.ed.st === 'completed',
         '★② 📥 したのに、開くとファイルの古い機器・長さ・状態（3U・5）で開いた → ' + short(r.ed));
      ok(r.ed.ph === 'A,B,G', '★② 開いた画面の写真が A,B,G でない → ' + short(r.ed));
      ok(r.file.amp === 'amp_1u45' && r.file.len === '25' && r.file.tel === '090-1111-2222' && r.file.ph === 'A,B,G',
         '★② 💾 上書き保存で、ファイルに古い機器・長さを書いた（または写真が減った） → ' + short(r.file));
      ok(r.file.wd === true && r.file.sd === true && r.file.wdAt === '2026-10-12T15:00',
         '★② 💾 上書き保存で、📥 で入れた工事完了・下見済が、ファイルの古い「未」に戻った → ' + short(r.file));
      ok(r.reload === true && r.reloadAsked === 0 && r.row2 && r.row2.amp === 'amp_1u45',
         '★② 書けたあとの 📁 の読み直しで「📥 で入れた分がまだ入っていません」と確かめた（または読み直した行が古い） → ' + short({ reload: r.reload, asked: r.reloadAsked, row2: r.row2 }));
    }
    await ctx.close();
  }

  // ---- ③a ファイルに写真の無い戸別へ 📥（工程の印）→ 💾 上書き保存。外す方向は今までどおりファイル ----
  if(want('③a')){
    const { ctx, page } = await openMain('③a');
    const r = await run(page, async ({ NO }) => {
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '写真なし 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     survey_done: false, survey_done_at: '', work_done: false, work_done_at: '' };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '写真なし 様', survey_done: true, survey_done_at: '2026-10-10T09:00',
                      work_done: true, work_done_at: '2026-10-12T15:00' };
      const o = {};
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }])).replace(/\s+/g, ' ').slice(0, 200);
      const r1 = __rowOf(NO);
      o.row1 = { slim: !!r1._slim, wd: r1.data.work_done, sd: r1.data.survey_done };
      await openCaseInEditor(r1);
      __setTel('090-3333-4444');
      let log = __catch(true);
      o.btn1 = (await __pressSave()).pressed;
      let f = __fileOf(list, NO + '.json');
      o.file1 = { wd: f.work_done, sd: f.survey_done, tel: f.chosho_cust_tel };
      // ほかの端末が、ファイルで工事完了を外した（わざと「未」に戻した）
      f.work_done = false; f.work_done_at = '';
      list.__files[NO + '.json'] = JSON.stringify(f, null, 2);
      const r2 = __rowOf(NO);
      o.row2wd = r2.data.work_done;
      await openCaseInEditor(r2);
      __setTel('090-5555-6666');
      log = __catch(true);
      o.btn2 = (await __pressSave()).pressed;
      f = __fileOf(list, NO + '.json');
      o.file2 = { wd: f.work_done, sd: f.survey_done, tel: f.chosho_cust_tel };
      return o;
    }, { NO });
    console.log('③a 写真の無い戸別の工程の印', short(r));
    ok(!r.error, '③a止まった → ' + r.error);
    if(!r.error){
      ok(!r.row1.slim && r.row1.wd === true && r.btn1 && r.btn2 && r.file1.tel === '090-3333-4444',
         '③a試験の前提: 写真の無い戸別は行が中身を持つ・📥 で行は工事完了・💾 上書き保存を押せる → ' + short(r));
      ok(r.file1.wd === true && r.file1.sd === true,
         '★③a 写真の無い戸別でも、📥 で入れた工事完了・下見済が 💾 上書き保存でファイルの古い「未」に戻った → ' + short(r.file1));
      ok(r.row2wd === true && r.file2.wd === false && r.file2.tel === '090-5555-6666',
         '★③a ファイルで外した工事完了を、行の古い「済」で付け直した（📥 で入れた印だけを勝たせるはず） → ' + short({ row2wd: r.row2wd, file2: r.file2 }));
    }
    await ctx.close();
  }

  // ---- ③h 暗号（.hyb）の戸別へ 📥（工程の印）→ 💾 上書き保存 ----
  if(want('③h')){
    const { ctx, page } = await openMain('③h');
    const r = await run(page, async ({ NO }) => {
      const PW = 'pw-181-h';
      const A = __jpeg(600, 450, 0.85, 21), G = __jpeg(600, 450, 0.85, 23);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress', work_type: 'uhf_new',
                     amplifier: 'amp_3u43', cable_main_len: '5', survey_done: false, survey_done_at: '', work_done: false, work_done_at: '',
                     chosho_photos: [{ id: 'hA', label: 'A', dataUri: A }] };
      const list = __mk('リスト', { [NO + '.hyb']: JSON.stringify(await encryptHybrid(base, PW), null, 2) }, {}, { resolve: true });
      setSessionPassword(PW);
      await __loadFolder(list);
      try { await unlockListView({ silent: true }); } catch(_){}
      const row = __rowOf(NO);
      const o = { row0: row ? { type: row.fileType, unlocked: !!row.unlocked } : null };
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', amplifier: 'amp_1u45', cable_main_len: '25',
                      survey_done: true, survey_done_at: '2026-10-10T09:00', work_done: true, work_done_at: '2026-10-12T15:00' };
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }])).replace(/\s+/g, ' ').slice(0, 200);
      const r1 = __rowOf(NO);
      o.row1 = { wd: r1.data.work_done, amp: r1.data.amplifier };
      await openCaseInEditor(r1);
      o.ed = { amp: __v('amplifier'), editing: _editingRow === r1 };
      __setTel('090-7777-8888');
      const log = __catch(true);
      o.btn = (await __pressSave()).pressed;
      o.said = log.said.map(m => m.replace(/\s+/g, ' ').slice(0, 120));
      try { const d = await decryptHybrid(JSON.parse(list.__files[NO + '.hyb']), PW);
        o.file = { wd: d.work_done, sd: d.survey_done, amp: d.amplifier, len: d.cable_main_len, tel: d.chosho_cust_tel,
                   ph: migratePhotosShape(d.chosho_photos).filter(p => p && p.dataUri).map(p => p.id).sort().join(',') };
      } catch(e){ o.file = { err: String((e && e.message) || e).slice(0, 120) }; }
      return o;
    }, { NO });
    console.log('③h .hyb の工程の印', short(r));
    ok(!r.error, '③h止まった → ' + r.error);
    if(!r.error){
      ok(r.row0 && r.row0.type === 'hybrid' && r.row0.unlocked && r.row1.wd === true && r.ed.editing && r.btn && r.file && !r.file.err && r.file.tel === '090-7777-8888',
         '③h試験の前提: 🔓 した .hyb の行・📥 で行は工事完了・開いて 💾 上書き保存できる → ' + short(r));
      ok(r.file.wd === true && r.file.sd === true,
         '★③h .hyb でも、📥 で入れた工事完了・下見済が 💾 上書き保存でファイルの古い「未」に戻った → ' + short(r.file));
      ok(r.file.amp === 'amp_1u45' && r.file.ph === 'hA', '★③h .hyb の機器が古い／写真 A が減った → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ④a 物件あり：📄 で読んだ（別の場所の写し）平文の戸別へ 📥 → 開く → 💾 物件に保存 ----
  if(want('④a')){
    const { ctx, page } = await openMain('④a');
    const r = await run(page, async ({ NO, P1N }) => {
      const A = __jpeg(600, 450, 0.85, 61), B = __jpeg(600, 450, 0.85, 62), G = __jpeg(600, 450, 0.85, 63);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43', cable_main_len: '5',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const text = JSON.stringify(base, null, 2);
      await __openProj(__proj('pj181a', P1N));
      const work = __mk('その１', { [NO + '.json']: text }, {}, { resolve: true });
      _projDirHandle = work;
      const src = new File([text], NO + '.json', { type: 'application/json', lastModified: 1 });   // USB・ダウンロードなどの写し
      window.confirm = () => true;
      pickFile = (opts, cb) => cb([src]);
      listSelectFiles();
      for(let i = 0; i < 100 && !__rowOf(NO); i++) await new Promise(r => setTimeout(r, 50));
      await new Promise(r => setTimeout(r, 500));
      const row = __rowOf(NO);
      const o = { row0: { slim: !!row._slim, src: !!row.srcFile, fh: !!row.fileHandle } };
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', amplifier: 'amp_1u45', cable_main_len: '25',
                      chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }])).replace(/\s+/g, ' ').slice(0, 200);
      __stopProjSave();
      const fj = () => { const j = __fileOf(work, NO + '.json'); return { amp: j.amplifier, len: j.cable_main_len, tel: j.chosho_cust_tel, ph: __ids(j.chosho_photos) }; };
      o.fileAfterImport = fj();
      const log = __catch(true);
      await openCaseInEditor(row);
      o.ed = { amp: __v('amplifier'), len: __v('cable_main_len'), ph: (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','), editing: _editingRow === row };
      if(_editingRow === row){ __setTel('090-1111-2222'); o.btn = await __pressSave(); __stopProjSave(); }
      o.said = log.said.map(m => m.replace(/\s+/g, ' ').slice(0, 160));
      o.file = fj();
      return o;
    }, { NO, P1N });
    console.log('④a 📄 の写しで読んだ行へ 📥 → 物件に保存', short(r));
    ok(!r.error, '④a止まった → ' + r.error);
    if(!r.error){
      ok(r.row0.slim && r.row0.src && !r.row0.fh && /取込: 1 件/.test(r.imp) && r.fileAfterImport.amp === 'amp_1u45' && r.fileAfterImport.ph === 'A,B,G'
         && r.ed.editing && r.btn && r.btn.pressed,
         '④a試験の前提: 📄 の行・📥 で工事フォルダのファイルは 1U・A,B,G・開いて保存できる → ' + short(r));
      ok(r.ed.amp === 'amp_1u45' && r.ed.len === '25', '★④a 📥 したのに、開くと 📄 の古い写し（3U・5）で開いた → ' + short(r.ed));
      ok(r.file.amp === 'amp_1u45' && r.file.len === '25' && r.file.tel === '090-1111-2222' && r.file.ph === 'A,B,G',
         '★④a 「💾 物件に保存」で、工事フォルダの戸別ファイルを古い値（3U・5）に戻した（または写真が減った） → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ④h 物件あり：📄 で読んだ .hyb へ 📥 → 開く → 💾 物件に保存 ----
  if(want('④h')){
    const { ctx, page } = await openMain('④h');
    const r = await run(page, async ({ NO, P1N }) => {
      const PW = 'pw-181-4h';
      const A = __jpeg(600, 450, 0.85, 81), G = __jpeg(600, 450, 0.85, 83);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43', cable_main_len: '5',
                     chosho_photos: [{ id: 'hA', label: 'A', dataUri: A }] };
      const text = JSON.stringify(await encryptHybrid(base, PW), null, 2);
      setSessionPassword(PW);
      await __openProj(__proj('pj181h', P1N));
      const work = __mk('その１', { [NO + '.hyb']: text }, {}, { resolve: true });
      _projDirHandle = work;
      const src = { name: NO + '.hyb', lastModified: 1, size: text.length, text: async () => text };   // 📄 で選んだ写し
      const row = buildListRow(NO + '.hyb', 1, JSON.parse(text));
      row.srcFile = src; slimListRow(row, true);
      _listRows.push(row);
      await unlockListView({ silent: true });
      window.confirm = () => true;
      const o = { row0: { slim: !!row._slim, unlocked: !!row.unlocked, fh: !!row.fileHandle } };
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', amplifier: 'amp_1u45', cable_main_len: '25', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 120);
      __stopProjSave();
      const dec = async () => { const d = await decryptHybrid(JSON.parse(work.__files[NO + '.hyb']), PW);
        return { amp: d.amplifier, len: d.cable_main_len, tel: d.chosho_cust_tel, ph: migratePhotosShape(d.chosho_photos).filter(p => p && p.dataUri).length }; };
      o.fileAfterImport = await dec();
      const log = __catch(true);
      await openCaseInEditor(row);
      o.ed = { amp: __v('amplifier'), len: __v('cable_main_len'), editing: _editingRow === row };
      if(_editingRow === row){ __setTel('090-2222-3333'); o.btn = await __pressSave(); __stopProjSave(); }
      o.said = log.said.map(m => m.replace(/\s+/g, ' ').slice(0, 160));
      o.file = await dec();
      return o;
    }, { NO, P1N });
    console.log('④h 📄 の .hyb へ 📥 → 物件に保存', short(r));
    ok(!r.error, '④h止まった → ' + r.error);
    if(!r.error){
      ok(r.row0.slim && r.row0.unlocked && !r.row0.fh && /個別JSONも更新しました/.test(r.note) && r.fileAfterImport.amp === 'amp_1u45'
         && r.ed.editing && r.btn && r.btn.pressed,
         '④h試験の前提: 📄 の .hyb の行・📥 で工事フォルダの .hyb は 1U・開いて保存できる → ' + short(r));
      ok(r.ed.amp === 'amp_1u45' && r.ed.len === '25', '★④h 📥 したのに、開くと 📄 の古い .hyb（3U・5）で開いた → ' + short(r.ed));
      ok(r.file.amp === 'amp_1u45' && r.file.len === '25' && r.file.ph >= 1,   // お客様の欄・足した写真は暗号の部分（.hyb へは入らない＝版178 の決まり）
         '★④h 「💾 物件に保存」で、工事フォルダの .hyb を古い値（3U・5）に戻した（または写真 A が消えた） → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ⑤ 物件なしの 📥 の知らせ・💾 戸別ファイルへ反映の「一致しています」 ----
  if(want('⑤')){
    const { ctx, page } = await openMain('⑤');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(600, 450, 0.85, 31), G = __jpeg(600, 450, 0.85, 33);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43', cable_main_len: '5',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', amplifier: 'amp_1u45', cable_main_len: '25',
                      chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      const o = {};
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }]));
      window.showDirectoryPicker = async () => list;
      const log = __catch(true);
      try { await lgwbButton(); } catch(e){ o.err = String(e); }
      o.said = log.said.slice();
      o.asked = log.asked.slice();
      const f = __fileOf(list, NO + '.json'); o.file = { amp: f.amplifier, ph: __ids(f.chosho_photos) };
      const r1 = __rowOf(NO); o.row = r1 ? r1.data.amplifier : null;
      return o;
    }, { NO });
    console.log('⑤ 物件なしの知らせ', short({ imp: flat(r.imp).slice(0, 400), said: (r.said || []).map(flat), file: r.file, row: r.row, error: r.error }));
    ok(!r.error, '⑤止まった → ' + r.error);
    if(!r.error){
      const one = (r.said || []).filter(m => /一致しています/.test(m))[0] || '';
      ok(/取込: 1 件/.test(r.imp) && r.file.amp === 'amp_3u43' && r.row === 'amp_1u45' && !!one,
         '⑤試験の前提: 物件なしの 📥 はファイルに書かない・反映は「一致しています」になる → ' + short({ imp: flat(r.imp), said: r.said, file: r.file }));
      ok(/もうファイルのある戸別は、1件ずつ開いて「💾 上書き保存」/.test(r.imp) && /反映」では、現場の機器・長さ・写真は入りません/.test(r.imp)
         && !/戸別を開いて「保存」で書けます/.test(r.imp),
         '★⑤ 物件なしの 📥 の知らせが、現場の機器・長さ・写真の入らない「💾 戸別ファイルへ反映」を勧める → ' + flat(r.imp));
      ok(!/消えません/.test(one), '★⑤ 物件を開いていないのに「物件ファイルとこの端末に保存されているので、書き戻さなくても消えません」と言った → ' + flat(one));
      ok(/まだ戸別ファイルに入っていない戸別が 1 件/.test(one) && /💾 上書き保存/.test(one),
         '★⑤ 反映の「一致しています」で、📥 で入れてまだ戸別ファイルに入っていない戸別を言わない → ' + flat(one));
    }
    await ctx.close();
  }

  // ---- ⑥ 📥 で入れてまだファイルに無いのに、📁 の読み直しで確かめずに捨てる ----
  for(const mode of ['a', 'b']){
    const label = '⑥' + mode;
    if(!want(label)) continue;
    const { ctx, page } = await openMain(label);
    const r = await run(page, async ({ NO, mode }) => {
      const A = __jpeg(600, 450, 0.85, 51), G = __jpeg(600, 450, 0.85, 53);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      if(mode === 'b') base.chosho_photos = [{ id: 'A', label: 'A', dataUri: A }];
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      await __loadFolder(list);
      const o = {};
      let log = __catch(true);
      o.reload0 = await listReloadFolder();           // 📥 の前：何も確かめない
      o.asked0 = log.asked.filter(m => /まだ戸別ファイルへ入っていません/.test(m)).length;
      const genba = (mode === 'a')
        ? { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', amplifier: 'amp_1u45' }
        : { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };   // 写真だけ
      o.imp = String(await __genbaImport([{ name: NO + '.json', obj: genba }])).replace(/\s+/g, ' ').slice(0, 120);
      const r1 = __rowOf(NO);
      o.row1 = { amp: r1.data.amplifier, ph: __ids(r1.data.chosho_photos), slim: !!r1._slim };
      log = __catch(true);                             // OK＝中止する
      o.reload = await listReloadFolder();
      o.asked = log.asked.filter(m => /まだ戸別ファイルへ入っていません/.test(m)).map(m => m.replace(/\s+/g, ' ').slice(0, 300));
      const r2 = __rowOf(NO);
      o.row2 = r2 ? { amp: r2.data.amplifier, ph: __ids(r2.data.chosho_photos), same: r2 === r1 } : null;
      return o;
    }, { NO, mode });
    console.log(label + ' 📥 のあと 📁 読み直しの確かめ', short(r));
    ok(!r.error, label + '止まった → ' + r.error);
    if(!r.error){
      ok(r.reload0 === true && r.asked0 === 0 && /取込: 1 件/.test(r.imp)
         && (mode === 'a' ? (r.row1.amp === 'amp_1u45' && !r.row1.slim) : (r.row1.slim && /G/.test(r.row1.ph))),
         label + '試験の前提: 📥 の前の読み直しは確かめない・📥 で行に入る → ' + short(r));
      ok(r.asked.length === 1 && /📥 現場取込で入れた 1 件/.test(r.asked[0]) && /💾 上書き保存/.test(r.asked[0]),
         '★' + label + ' 📥 で入れてまだ戸別ファイルに無いのに、📁 の読み直しで確かめずに捨てる（' + (mode === 'b' ? '写真だけの取り込み' : 'ファイルに写真の無い戸別') + '） → ' + short(r.asked));
      ok(r.reload === false && r.row2 && r.row2.same && (mode === 'a' ? r.row2.amp === 'amp_1u45' : /G/.test(r.row2.ph)),
         '★' + label + ' 「中止する」を選んだのに読み直した（📥 で入れた分が消えた） → ' + short({ reload: r.reload, row2: r.row2 }));
    }
    await ctx.close();
  }

  // ---- ⑦ v176-6 預けの台帳（proj）が空なら「別の物件」と言わない ----
  if(want('⑦')){
    const { ctx, page } = await openMain('⑦');
    const r = await run(page, ({ P1N, P2N }) => {
      _currentProject = { id: 'pj181s', name: P1N };
      const o = {
        emptyProj: sideImportWarn({ proj: '', ledger: P2N, at: 'x' }, 'case'),
        otherProj: sideImportWarn({ proj: P2N, ledger: P2N, at: 'x' }, 'case'),
        sameProj: sideImportWarn({ proj: P1N, ledger: P2N, at: 'x' }, 'case'),
        emptyNew: sideImportWarn({ proj: '', ledger: '', at: 'x' }, 'new'),
        emptyProjNew: sideImportWarn({ proj: '', ledger: P2N, at: 'x' }, 'new')   // 一覧に無い戸別は、台帳の名前が無くても今までどおり注意
      };
      _currentProject = null;
      return o;
    }, { P1N, P2N });
    console.log('⑦ 預けの注意', short(r));
    ok(!r.error, '⑦止まった → ' + r.error);
    if(!r.error){
      ok(/とは違います/.test(r.otherProj) && r.sameProj === '' && /にありません/.test(r.emptyNew),
         '⑦試験の前提: 預けの台帳が別の物件なら注意・同じなら注意なし・一覧に無い戸別なら注意 → ' + short(r));
      ok(r.emptyProj === '', '★⑦ 預けの台帳（proj）が空なのに、現場で開いていただけの台帳（ledger）で「別の物件の預け」と言った → ' + short(r.emptyProj));
      ok(/にありません/.test(r.emptyProjNew) && !/とは違います/.test(r.emptyProjNew),
         '★⑦ 一覧に無い戸別の預けで、現場で開いていただけの台帳の名前から「別の物件」と言った（または注意しない） → ' + short(r.emptyProjNew));
    }
    await ctx.close();
  }

  // ---- ⑧ v176-7 預けで PC の値を置き換える欄は「置き換え」と言う ----
  if(want('⑧')){
    const { ctx, page } = await openMain('⑧');
    const r = await run(page, async ({ NO }) => {
      const row = { file: NO + '.json', fileType: 'plain',
                    data: { chosho_mgmt_no: NO, chosho_cust_name: '三沢 太郎', chosho_cust_tel: '', chosho_status: 'in_progress', work_type: 'uhf_new' } };
      _listRows = [row];
      const data = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '三沢 次郎', chosho_cust_tel: '011-222-3333',
                     _side: { at: '20261014-091812', proj: '', ledger: '', touched: ['chosho_cust_name', 'chosho_cust_tel'] } };
      const p = openGenbaImportPreview({ row, mgmt: NO, mainData: row.data, genbaData: data, matchType: 'case',
                                         fileName: NO + '_現場預け_20261014-091812.json', side: data._side, sideWarn: '' });
      const md = document.getElementById('genba-import-modal');
      for(let i = 0; i < 100 && !(md && md.classList.contains('open')); i++) await new Promise(r => setTimeout(r, 50));
      const text = String((document.getElementById('gi-body') || {}).innerText || '').replace(/\s+/g, ' ');
      const cancel = document.getElementById('gi-cancel'); if(cancel) cancel.click();
      const res = await p;
      const o = { text: text.slice(0, 900), action: res && res.action, name: row.data.chosho_cust_name };
      // ふだんの取り込み（預けでない）：PC が空の欄だけ埋める＝今までどおり「補完」
      const row2 = { file: 'X.json', fileType: 'plain', data: { chosho_mgmt_no: 'X', chosho_cust_name: '', chosho_status: 'in_progress' } };
      const p2 = openGenbaImportPreview({ row: row2, mgmt: 'X', mainData: row2.data, genbaData: { chosho_mgmt_no: 'X', chosho_cust_name: '現場 花子' },
                                          matchType: 'case', fileName: 'X.json' });
      for(let i = 0; i < 100 && !(md && md.classList.contains('open')); i++) await new Promise(r => setTimeout(r, 50));
      o.text2 = String((document.getElementById('gi-body') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 400);
      const c2 = document.getElementById('gi-cancel'); if(c2) c2.click();
      await p2;
      return o;
    }, { NO });
    console.log('⑧ 預けの窓の言い方', short(r));
    ok(!r.error, '⑧止まった → ' + r.error);
    if(!r.error){
      ok(r.action === 'cancel' && r.name === '三沢 太郎' && /📱現場から補完: 現場 花子/.test(r.text2),
         '⑧試験の前提: 窓を閉じると何も入らない・ふだんの取り込みで PC が空の欄は「現場から補完」 → ' + short(r));
      ok(/📱現場で直した値に替えます: 三沢 太郎 → 三沢 次郎/.test(r.text),
         '★⑧ 預けで PC の氏名（三沢 太郎）を置き換えるのに「📱現場から補完」と出した（前の値を見せない） → ' + r.text);
      ok(/📱現場から補完: 011-222-3333/.test(r.text) && !/替えます: → /.test(r.text),
         '★⑧ PC が空の欄（電話）まで「置き換え」と言った → ' + r.text);
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v181_m_import_enc_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
