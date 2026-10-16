/* 版178（現場入力）
   「まとめて保存」は、まとめて保存の初めに下書き（IndexedDB）を読み出し、その写しで戸別ファイルを書く。
   フォルダに書いた道では、書いたあと「保存済」の印を付けるときに、その写しで下書きを書き直していた。
   戸別Aの写真の取り込み（何枚も選んだ写真）が終わらないうちに戸別Bを開いて「まとめて保存」を押すと、
   保存しているあいだ（確かめの窓・フォルダを選ぶ画面・書き込み）に Aの写真が下書きに届く（persistModel）。
   そのあと始めの写しで下書きを書き直すと、その写真が下書きから消え、Aは「保存済」になる（写真はどこにも残らない）。
   ★決まり★ 下書きの中身が、保存したもの（写しを作ったとき）とまだ同じときだけ、写しで書き直す・「保存済」にする。
   変わっていたら下書きはそのまま残し（写真が残る）、「保存済」にせず、そう知らせる。もう一度押せば渡る。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① まとめて保存（フォルダに書く道）のあいだに Aの写真が届く → 下書きに写真が残る・「保存済」にしない・知らせる。
        Bはいつもどおり保存済。もう一度「まとめて保存」を押すと Aの写真もファイルに入り、保存済になる
     ② 写真が届かないとき → これまでどおり、書いたときの中身（控えつき）で下書きを書き直し、「保存済」にする
     ③ 全部保存し直す：受付台帳を下書きへ入れ直しているあいだに Bの写真が届く → 下書きにもファイルにも入る
     ④ まとめて保存のあいだに Aを開き直した（画面の戸別が A）・そこへ写真が届く → 下書きに残る・「保存済」にしない
   （ここから 見直しの直し）
     ①b フォルダに PCのファイル（PCだけの値）がある → 届いた写真は次の保存で渡る・PCの値は消えない
     ③b 全部保存し直す：管理番号が全角で入っている下書き → 台帳の直しがファイルに入る・「写真が入った」と誤って言わない
     ⑤ 引き継ぎ（📥）：確かめの窓のあいだに届いた写真を、下書きから消さない
     ⑥ 受付台帳の取り込み：入れ直しているあいだに届いた写真を、下書きから消さない
     ⑦ 写真の取り込みの途中でその戸別を開き直し、カメラで1枚足した → 取り込みの残りが届いても、その1枚が消えない
     ⑦b 測定値のCSVの取り込み（別の戸別へ移ったあとで読み終わる）でも、開き直して足したカメラの写真を消さない
     ⑧ 管理番号が別の下書きと重なった新しい戸別（一時のキー）に写真を取り込む → 別の戸別の下書きを置き換えない
     ⑨ 特別記録：写真を読み終える前に「戻る」を押した → 読み終わりの描き直しで止まらない（写真は読み終えたときに控えてある）
   （ここから 写真の取り込みは、いちばん新しい下書きに「新しく読んだ写真だけ」を足す。下書きのキーが移っていれば移った先へ）
     ⑩ 番号が重なった新しい戸別（一時のキー）の取り込みの途中で、一覧から開き直して番号を直し、そのまま開いている
        → 残りの写真が画面と直した番号の下書きに入る・誰にも見えない下書きを作らない・重なった相手の下書きは元のまま
     ⑩b 同じく、開き直したが番号を直さずにまた離れた（一時のキーが付け替わる）→ 写真は付け替わった先の1つの下書きにそろう
     ⑪ 管理番号の無い新しい戸別の取り込みの途中で、一覧から開き直して管理番号を入れた → 残りの写真が画面とその番号の下書きに入る
     ⑫ 取り込みの途中で開き直してカメラで足した写真を、また開き直して消した → 取り込みの残りが届いても、消した写真が戻らない
     ⑫b 取り込みの途中で開き直した画面（開いたまま）で、取り込んだ1枚目を消した → 残りが画面に届いても、消した1枚目が戻らない
     ⑬ 取り込みの途中で開き直して備考を直し、まとめて保存した → あとから届いた写真で「保存済」に見せない・備考を戻さない
        もう一度「まとめて保存」を押すと、その写真がファイルに入る
     ⑭ 取り込みの途中で受付台帳を取り込み、名前が直った → 残りの写真が届いても、名前を元に戻さない
     ⑮ 画面に出ていない同じ戸別に、2つの取り込みの写真が同時に届く → 両方とも下書きに残る
     ⑮b 同じく、2つの取り込みが別々の写し（開き直す前と後）から始まっている → 両方とも下書きに残る
     ⑯ 引き継ぎ（📥）で新しく付く印が無いとき → 読んだ戸別ファイル全部の控えが端末（IndexedDB）に残る（1件目だけにならない）
   使い方: node smoke_v178_genba.js [現場入力 index.html の file:// URL]　（SCENE=①,③ で場面を絞れる） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const HTML = process.argv[2] || FILE('antenna_genba');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();
const ONLY = String(process.env.SCENE || process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const P1 = '令和８年度戸別受信設備設置工事（その１）';
const NA = '2612MKM031', NB = '2612MKM032';

/* 画面の中に作る道具（smoke_v176_genba.js と同じ形を小さくしたもの）。
   __mkdir のフォルダは、書いたら __onWrite(名前) を呼ぶ（そこで写真の取り込みを終わらせる）。
   窓（uiAlert / uiConfirm）は「OK」で閉じ、出た文を __said に控える。 */
const SETUP = `
window.__sleep = ms => new Promise(r => setTimeout(r, ms));
window.__onWrite = null;
window.__mkdir = function(name, files){
  const fileH = n => ({ kind:'file', name:n,
    getFile: async () => ({ name:n, size:(dir.__files[n]||'').length, lastModified: Date.now(),
      text: async () => dir.__files[n], arrayBuffer: async () => new TextEncoder().encode(dir.__files[n]).buffer }),
    createWritable: async () => ({
      write: async b => { const t = (typeof b === 'string') ? b : await b.text(); dir.__files[n] = t; dir.__wrote.push(n); },
      close: async () => { if(window.__onWrite) await window.__onWrite(n); } }) });
  const dir = {
    kind:'directory', name, __files: files || {}, __wrote: [],
    queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    getFileHandle: async (n, opt) => {
      if(!(n in dir.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } dir.__files[n] = ''; }
      return fileH(n); },
    getDirectoryHandle: async () => { const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; },
    isSameEntry: async o => o === dir,
    entries: () => ({ [Symbol.asyncIterator](){ const rows = Object.keys(dir.__files).map(n => [n, fileH(n)]); let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } }; } }),
    values: () => ({ [Symbol.asyncIterator](){ const rows = Object.keys(dir.__files).map(n => fileH(n)); let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } }; } })
  };
  return dir;
};
window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6;
  const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
window.__ph = (id, c) => ({ id:id, label:id, dataUri:__png(c) });
window.__pids = j => ((j && j.chosho_photos) || []).filter(p => p && p.dataUri).map(p => String(p.id)).sort().join(',');
window.__said = [];
if(window.__dlgTimer) clearInterval(window.__dlgTimer);
window.__dlgTimer = setInterval(() => {
  const m = document.getElementById('ui-dialog');
  if(m && m.classList.contains('open')){
    const t = (document.getElementById('ui-dialog-msg') || {}).textContent || '';
    window.__said.push(t);
    const b = document.getElementById('ui-dialog-ok'); if(b) b.click();
  }
  const pm = document.getElementById('pick-modal');
  if(pm && pm.classList.contains('open')){ const c = document.getElementById('pick-close'); if(c) c.click(); }
}, 40);
/* 受付台帳（物件 その１・2戸）。名前は over で変えられる（全部保存し直すで入れ直すため） */
window.__ledger = over => ({ type:'antenna_reception_ledger', version:5, project: ${JSON.stringify(P1)},
  exportedAt:'2026-10-13T00:00:00.000Z', appVersion:'176',
  rows:[ Object.assign({ mgmt_no:'${NA}', name:'工藤 A', addr:'三沢市A町1', date:'2026-10-20' }, (over || {}).a || {}),
         Object.assign({ mgmt_no:'${NB}', name:'工藤 B', addr:'三沢市B町2', date:'2026-10-21' }, (over || {}).b || {}) ] });
/* この端末で入力した下書き（写真 1枚・備考）を作る。終わると その戸別が画面に開いたまま */
window.__draft = async function(no, pid, color){
  M = freshModel(); ensureModelShape(M);
  M.chosho_mgmt_no = no; M.chosho_cust_name = (no === '${NA}') ? '工藤 A' : '工藤 B';
  M.chosho_note = '現場メモ ' + no; M.chosho_photos = [ __ph(pid, color) ];
  M._touched = true; M._lastDraftKey = 'no:' + no;
  await persistDraft();
};
/* 写真の取り込みが終わって、その戸別の下書きに届く（handlePhotoFiles → photoKeepInto → persistModel と同じ）。
   読込を始めたときの戸別（下書きの中身）に写真を足して、そのまま控える。 */
window.__photoArrives = async function(no, pid){
  const rec = await idbGet('no:' + no);
  rec.model.chosho_photos.push(__ph(pid, '#0a0'));
  await persistModel(rec.model);
};
window.__state = async function(){
  receptionSaveRows(__ledger());
  window.__D = __mkdir('リスト', {});
  window.showDirectoryPicker = async () => window.__D;
  await __draft('${NA}', 'a1', '#c33');
  await __draft('${NB}', 'b1', '#33c');          // A の写真の取り込み中に B を開いた（画面の戸別は B）
  render();
};
window.__info = async function(no){
  await refreshDraftInfo(true);
  const rec = await idbGet('no:' + no);
  return { photos: __pids(rec && rec.model), rev: (rec && rec.rev) | 0, fileRev: (rec && rec.fileRev) | 0,
           saved: !!(rec && rec.fileSavedAt), base: !!(rec && rec.model && rec.model._fileBase), h: handoverOf(draftInfoOf(no)) };
};
window.__file = (no) => { try{ return __pids(JSON.parse(__D.__files[no + '.json'])); }catch(_){ return null; } };
/* 戸別を開く（履歴から開くのと同じ：下書きを読み直した別の物が画面の戸別になる） */
window.__open = async function(k){
  clearTimeout(_persistTimer); await persistDraft();
  const rec = await idbGet(k);
  M = rec.model; M._lastDraftKey = k; ensureModelShape(M); resetOpenState(); render(); await saveStateLoad();
};
/* 本物の写真の取り込み（handlePhotoFiles）を、1枚ずつ好きなときに届かせる道具（⑦⑧・⑩〜⑮で使う） */
window.__gatedImport = function(){
  window.__cg = {};
  window.__cgate = c => new Promise(r => { window.__cg[c] = r; });
  window.__rel = async c => { for(let i = 0; i < 50 && !window.__cg[c]; i++) await __sleep(20); const g = window.__cg[c]; delete window.__cg[c]; if(g) g(); await __sleep(200); };
  readImageAsDataURI = async function(f){ await __cgate(f.__c); return __png(f.__c || '#000'); };
  photoFitForStorage = async d => d;
  window.__files = cs => cs.map(c => { const f = new File([new Uint8Array([1,2,3])], 'p.jpg', { type:'image/jpeg' }); f.__c = c; return f; });
  window.__pidOf = c => photoContentId(__png(c));
};
/* （⑩〜⑮で使う）いくつかの取り込みの写真を、同時に届かせる */
window.__relAll = async function(cs){
  for(let i = 0; i < 50 && !cs.every(c => window.__cg[c]); i++) await __sleep(20);
  const gs = cs.map(c => { const g = window.__cg[c]; delete window.__cg[c]; return g; });
  gs.forEach(g => { if(g) g(); });
  await __sleep(300);
};
/* 画面の入力欄に打つ（欄が無いときは中身を直して自動の控えを頼む）。打った道を返す */
window.__typeFld = function(id, v){
  const el = document.querySelector('[data-fld="' + id + '"]');
  if(el){ el.value = v; el.dispatchEvent(new Event('input', { bubbles:true })); return 'field'; }
  M[id] = v; saveDraft(); return 'direct';
};
/* 画面の写真の「✕」で消す（ボタンが無いときだけ、消して控える）。消した道を返す */
window.__delPhoto = function(pid){
  const has = () => M.chosho_photos.some(p => p && String(p.id) === String(pid));
  const i = M.chosho_photos.findIndex(p => p && String(p.id) === String(pid));
  if(i < 0) return 'none';
  try{ refreshPhotos(); }catch(_){}
  const el = document.querySelector('.sec[data-sec="photos"] [data-photodel="' + i + '"]');
  if(el){ el.click(); return has() ? 'refused' : 'button'; }
  M.chosho_photos.splice(i, 1); saveDraft(); try{ refreshPhotos(); }catch(_){}
  return 'splice';
};
/* 写真 ps のどれかを持っている下書き（except のキーは除く）。「キー=写真…」の並び */
window.__holders = async function(ps, except){
  const out = [];
  for(const rec of (await idbGetAll()) || []){
    if(!rec || !rec.model || (except || []).indexOf(rec.key) >= 0) continue;
    const have = __pids(rec.model).split(',');
    if(ps.some(p => have.indexOf(p) >= 0)) out.push(rec.key + '=' + have.join('/'));
  }
  return out;
};
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errs = [];
  async function fresh(name){
    const ctx = await b.newContext({ viewport:{ width: 1280, height: 900 }, deviceScaleFactor:1, isMobile:false, hasTouch:false, userAgent: UA_PC });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror(' + name + '): ' + e.message));
    page.on('console', m => { const t = m.text();
      if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push('console(' + name + '): ' + t); });
    page.on('dialog', d => d.accept().catch(()=>{}));
    await page.goto(HTML); await page.waitForTimeout(1600);
    await page.evaluate(SETUP);
    return { ctx, page };
  }
  async function scene(name, fn){
    if(ONLY.length && name !== '⓪' && !ONLY.some(s => name.indexOf(s) >= 0)) return;
    let c = null;
    try{ c = await fresh(name); await fn(c.page); }
    catch(e){ fails.push('試験が途中で止まった（' + name + '）→ ' + ((e && e.message) || e)); }
    finally{ if(c) await c.ctx.close().catch(()=>{}); }
  }
  const J = o => String(JSON.stringify(o)).slice(0, 1400);

  /* ---------- ⓪ 前提 ---------- */
  await scene('⓪', async page => {
    const r0 = await page.evaluate(() => ({
      ver: APP_VERSION,
      f: ['saveAllDrafts','markDraftSavedFor','persistModel','persistDraft','draftRecSame','stateSig','receptionSaveRows','refreshDraftInfo',
          'handoverOf','draftInfoOf','idbGet','idbPut','photoKeepInto','freshModel','ensureModelShape'].filter(n => typeof window[n] !== 'function')
    }));
    console.log('⓪前提', J(r0));
    ok(r0.f.length === 0, '★関数が無い → ' + r0.f.join(' / '));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
  });

  /* ---------- ① まとめて保存のあいだに Aの写真が届く ---------- */
  await scene('①', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();
      const before = { a: await __info(NA), b: await __info(NB), open: M.chosho_mgmt_no };
      let fired = 0;
      __onWrite = async n => { if(n === NA + '.json' && !fired++) await __photoArrives(NA, 'a2'); };   // A を書いた直後に、A の写真の取り込みが終わる
      const s0 = __said.length;
      await saveAllDrafts('unsaved'); await __sleep(600);
      __onWrite = null;
      const r1 = { fired, a: await __info(NA), b: await __info(NB), fileA: __file(NA), fileB: __file(NB), said: __said.slice(s0) };
      const s1 = __said.length;
      await saveAllDrafts('unsaved'); await __sleep(600);           // もう一度押す
      const r2 = { a: await __info(NA), b: await __info(NB), fileA: __file(NA), said: __said.slice(s1) };
      return { before, r1, r2 };
    }, { NA, NB });
    console.log('①まとめて保存のあいだに写真', J(r));
    const r1 = r.r1 || {}, r2 = r.r2 || {};
    ok(r.before && r.before.open === NB && r.before.a.photos === 'a1' && r.before.a.h !== 'ok', '試験の前提: Aは渡していない下書き・画面は B → ' + J(r.before));
    ok(r1.fired === 1 && r1.fileA === 'a1' && r1.fileB === 'b1', '試験の前提: まとめて保存で A・B を書き、Aを書いた直後に写真が届く → ' + J(r1));
    ok(r1.a && r1.a.photos === 'a1,a2',
       '★まとめて保存のあいだに届いた写真が、下書きから消えた（始めに読んだ写しで下書きを書き直した） → ' + J(r1.a));
    ok(r1.a && r1.a.h !== 'ok' && r1.a.fileRev < r1.a.rev,
       '★届いた写真を渡していないのに「保存済」にした（まとめて保存から外れ、写真が渡らない） → ' + J(r1.a));
    ok(r1.b && r1.b.h === 'ok' && r1.b.photos === 'b1', '★写真の届いていない B が「保存済」にならない → ' + J(r1.b));
    ok((r1.said || []).some(t => t.indexOf(NA) >= 0 && /保存の途中で写真が入りました/.test(t)),
       '★保存の途中で写真が入ったことを知らせない → ' + J(r1.said));
    ok(r2.fileA === 'a1,a2' && r2.a && r2.a.h === 'ok' && r2.a.photos === 'a1,a2',
       '★もう一度「まとめて保存」を押しても、届いた写真が渡らない・保存済にならない → ' + J(r2));
  });

  /* ---------- ② 写真が届かないとき：これまでどおり ---------- */
  await scene('②', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();
      await saveAllDrafts('unsaved'); await __sleep(600);
      return { a: await __info(NA), b: await __info(NB), fileA: __file(NA), fileB: __file(NB) };
    }, { NA, NB });
    console.log('②写真が届かない', J(r));
    ok(r.fileA === 'a1' && r.fileB === 'b1', '試験の前提: A・B を書く → ' + J(r));
    ok(r.a.h === 'ok' && r.a.fileRev === r.a.rev && r.a.photos === 'a1' && r.a.base,
       '★中身が変わっていない A を「保存済」にしない・控えを下書きに入れ直さない → ' + J(r.a));
    ok(r.b.h === 'ok' && r.b.photos === 'b1', '★B が「保存済」にならない → ' + J(r.b));
  });

  /* ---------- ③ 全部保存し直す：台帳を入れ直しているあいだに Bの写真が届く ---------- */
  await scene('③', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();
      await saveAllDrafts('unsaved'); await __sleep(600);           // いちど渡しておく
      receptionSaveRows(__ledger({ a: { name: '工藤 A（直した）' }, b: { name: '工藤 B（直した）' } }));
      M = freshModel(); ensureModelShape(M); render();               // 画面には別の（空の）戸別
      const op = idbPut; let fired = 0;
      idbPut = async function(rec){                                  // A を下書きへ入れ直したところで、B の写真の取り込みが終わる
        const ret = await op.apply(this, arguments);
        if(rec && rec.key === 'no:' + NA && !fired){ fired++; await __photoArrives(NB, 'b2'); }
        return ret;
      };
      const s0 = __said.length;
      await saveAllDrafts('all'); await __sleep(600);
      idbPut = op;
      const recB = await idbGet('no:' + NB);
      let jb = null; try{ jb = JSON.parse(__D.__files[NB + '.json']); }catch(_){}
      return { fired, a: await __info(NA), b: await __info(NB), fileA: __file(NA), fileB: __file(NB),
               nameB: recB && recB.model && recB.model.chosho_cust_name, fileNameB: jb && jb.chosho_cust_name, said: __said.slice(s0) };
    }, { NA, NB });
    console.log('③全部保存し直す', J(r));
    ok(r.fired === 1 && r.nameB === '工藤 B（直した）' && r.fileNameB === '工藤 B（直した）',
       '試験の前提: 全部保存し直すで台帳を入れ直し、そのあいだに B の写真が届く → ' + J(r));
    ok(r.b.photos === 'b1,b2', '★台帳を入れ直しているあいだに届いた写真が、下書きから消えた → ' + J(r.b));
    ok(r.fileB === 'b1,b2', '★台帳を入れ直しているあいだに届いた写真が、ファイルに入らない → ' + J(r));
  });

  /* ---------- ④ まとめて保存のあいだに Aを開き直した（画面の戸別が A）・そこへ写真が届く ---------- */
  await scene('④', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();
      let fired = 0;
      __onWrite = async n => {
        if(n !== NA + '.json' || fired++) return;
        const rec = await idbGet('no:' + NA);                        // 書いているあいだに A を開き直した
        M = rec.model; ensureModelShape(M); M._lastDraftKey = 'no:' + NA;
        M.chosho_photos.push(__ph('a3', '#0a0')); M._touched = true; await persistDraft();   // そこへ写真が届いた
      };
      await saveAllDrafts('unsaved'); await __sleep(600);
      __onWrite = null;
      return { fired, a: await __info(NA), fileA: __file(NA), open: M.chosho_mgmt_no, m: __pids(M) };
    }, { NA, NB });
    console.log('④開き直した A', J(r));
    ok(r.fired === 1 && r.fileA === 'a1' && r.open === NA, '試験の前提: A を書いたあとに A を開き直し、写真が届く → ' + J(r));
    ok(r.a.photos === 'a1,a3' && r.m === 'a1,a3', '★開き直した A に届いた写真が、下書きから消えた → ' + J(r));
    ok(r.a.h !== 'ok', '★届いた写真を渡していないのに「保存済」にした → ' + J(r.a));
  });

  /* ---------- ①b フォルダに PCのファイル（PCだけの値）があるときも、届いた写真は次の保存で渡り、PCの値は消えない ---------- */
  await scene('①b', async page => {
    const r = await page.evaluate(async ({ NA }) => {
      await __state();
      const pc = buildStateOf(Object.assign(freshModel(), { chosho_mgmt_no: NA, chosho_cust_name: '工藤 A', chosho_time: '10:00', chosho_note: 'PCメモ' }));
      pc.chosho_photos = [ __ph('pc1', '#999') ]; pc._origin = 'main';
      __D.__files[NA + '.json'] = JSON.stringify(pc);
      let fired = 0;
      __onWrite = async n => { if(n === NA + '.json' && !fired++) await __photoArrives(NA, 'a2'); };
      await saveAllDrafts('unsaved'); await __sleep(600); __onWrite = null;
      const r1 = { a: await __info(NA), fileA: __file(NA) };
      await saveAllDrafts('unsaved'); await __sleep(600);
      let ja = null; try{ ja = JSON.parse(__D.__files[NA + '.json']); }catch(_){}
      return { fired, r1, r2: { a: await __info(NA), fileA: __file(NA), time: ja && ja.chosho_time } };
    }, { NA });
    console.log('①b PCのファイルがある', J(r));
    ok(r.fired === 1 && r.r1.fileA === 'a1,pc1' && r.r1.a.photos === 'a1,a2' && r.r1.a.h !== 'ok',
       '★①b 保存の途中で届いた写真が下書きから消えた・保存済になった（PCのファイルがあるとき） → ' + J(r.r1));
    ok(r.r2.fileA === 'a1,a2,pc1' && r.r2.a.h === 'ok' && r.r2.time === '10:00',
       '★①b もう一度押しても届いた写真が渡らない・PCの値（時刻）が消えた → ' + J(r.r2));
  });

  /* ---------- ③b 全部保存し直す：管理番号が全角で入っている下書き → 台帳の直しがファイルに入り、写真が入ったとは言わない ---------- */
  await scene('③b', async page => {
    const r = await page.evaluate(async ({ NA }) => {
      await __state();
      await saveAllDrafts('unsaved'); await __sleep(600);
      const z = s => s.replace(/[0-9A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0));
      const rec = await idbGet('no:' + NA);
      await idbDel('no:' + NA);
      rec.key = 'no:' + z(NA); rec.mgmt = z(NA); rec.model.chosho_mgmt_no = z(NA); rec.model._lastDraftKey = rec.key;
      rec.rev = (rec.rev | 0) + 1; rec.model._rev = rec.rev; rec.sig = stateSig(rec.model);
      await idbPut(rec);
      await refreshDraftInfo(true);
      receptionSaveRows(__ledger({ a: { name: '工藤 A（直した）' } }));
      const s0 = __said.length;
      await saveAllDrafts('all'); await __sleep(600);
      const r2 = await idbGet(rec.key);
      let ja = null; try{ ja = JSON.parse(__D.__files[NA + '.json']); }catch(_){}
      return { recName: r2.model.chosho_cust_name, saved: !!r2.fileSavedAt && r2.fileRev === r2.rev, fileName: ja && ja.chosho_cust_name,
               photos: __pids(r2.model), late: __said.slice(s0).filter(t => /途中/.test(t)) };
    }, { NA });
    console.log('③b 全角の管理番号', J(r));
    ok(r.recName === '工藤 A（直した）' && r.photos === 'a1', '③b試験の前提: 下書きに台帳の直しが入る → ' + J(r));
    ok(r.fileName === '工藤 A（直した）' && r.saved && r.late.length === 0,
       '★③b 全角の管理番号の下書きで、台帳の直しがファイルに入らない・「写真が入った」と誤って言う → ' + J(r));
  });

  /* ---------- ⑤ 引き継ぎ（📥）：確かめの窓が出ているあいだに届いた写真を、下書きから消さない ---------- */
  await scene('⑤', async page => {
    const r = await page.evaluate(async ({ NA }) => {
      await __state();
      const data = { chosho_mgmt_no: NA, work_type: 'x', flyer_done: true, flyer_done_at: '2026-10-15', editedAt: '2026-10-15T00:00:00.000Z', chosho_photos: [] };
      const file = new File([JSON.stringify(data)], NA + '.json', { type: 'application/json' });
      const oc = uiConfirm; let fired = 0;
      uiConfirm = async function(msg){ if(/印が増えます/.test(msg) && !fired++){ await __photoArrives(NA, 'a2'); } return true; };
      await flowShareRead([{ name: NA + '.json', file }], false);
      uiConfirm = oc;
      const rec = await idbGet('no:' + NA);
      return { fired, photos: __pids(rec.model), flyer: !!rec.model.flyer_done };
    }, { NA });
    console.log('⑤引き継ぎ', J(r));
    ok(r.fired === 1 && r.flyer, '⑤試験の前提: 引き継ぎで印が入り、確かめの窓のあいだに写真が届く → ' + J(r));
    ok(r.photos === 'a1,a2', '★⑤引き継ぎのあいだに届いた写真が、下書きから消えた → ' + J(r));
  });

  /* ---------- ⑥ 受付台帳の取り込み：入れ直しているあいだに届いた写真を、下書きから消さない ---------- */
  await scene('⑥', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();
      M = freshModel(); ensureModelShape(M); render();
      receptionSaveRows(__ledger({ a: { name: '工藤 A（直した）' }, b: { name: '工藤 B（直した）' } }));
      const op = idbPut; let fired = 0;
      idbPut = async function(rec){ const ret = await op.apply(this, arguments);
        if(rec && rec.key === 'no:' + NA && !fired){ fired++; await __photoArrives(NB, 'b2'); } return ret; };
      const n = await receptionApplyToDrafts();
      idbPut = op;
      const rec = await idbGet('no:' + NB);
      return { fired, applied: n, photosB: __pids(rec.model), nameB: rec.model.chosho_cust_name };
    }, { NA, NB });
    console.log('⑥台帳の取り込み', J(r));
    ok(r.fired === 1 && r.nameB === '工藤 B（直した）', '⑥試験の前提: 台帳を入れ直し、そのあいだに写真が届く → ' + J(r));
    ok(r.photosB === 'b1,b2', '★⑥台帳を入れ直しているあいだに届いた写真が、下書きから消えた → ' + J(r));
  });

  /* ---------- ⑦ 写真の取り込みの途中でその戸別を開き直し、カメラで1枚足した → 取り込みの残りが届いても、その1枚が消えない ---------- */
  await scene('⑦', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      await __open('no:' + NA);                         // A を開く（M = A1）
      const imp = handlePhotoFiles(__files(['#101', '#202', '#303']));
      await __rel('#101');                               // 1枚目（A1 を開いている）
      await __open('no:' + NB);                          // B へ
      await __rel('#202');                               // 2枚目 → 読込元 A1 を直接控える
      await __open('no:' + NA);                          // A を開き直す（M = A2、別の物）
      const cam = handlePhotoFiles(__files(['#0f0']));   // A2 でカメラの1枚
      await __rel('#0f0'); await cam;
      await __open('no:' + NB);                          // B へ（A2 はカメラの1枚ごと下書きへ）
      const mid = __pids((await idbGet('no:' + NA)).model);
      await __rel('#303'); await imp;                    // 最初の取り込みの3枚目 → 読込元 A1 を直接控える
      await __sleep(400);
      const rec = await idbGet('no:' + NA);
      return { cam: __pidOf('#0f0'), p3: __pidOf('#303'), mid, final: __pids(rec.model) };
    }, { NA, NB });
    console.log('⑦開き直した戸別', J(r));
    ok(r.mid && r.mid.indexOf(r.cam) >= 0, '⑦試験の前提: 開き直した戸別にカメラの1枚が入る → ' + J(r));
    ok(r.final && r.final.indexOf(r.cam) >= 0 && r.final.indexOf(r.p3) >= 0,
       '★⑦写真の取り込みの残りが届くと、開き直して足したカメラの写真が下書きから消える → ' + J(r));
  });

  /* ---------- ⑦b 測定値のCSVの取り込みが、別の戸別へ移ったあとで読み終わる → 開き直して足したカメラの写真を消さない ----------
     CSV の取り込み（handleMeasCsv）は、読み終えたとき読込元の戸別が画面に無ければ persistModel(読込元) で書く（写真を足す道ではない）。 */
  await scene('⑦b', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      await __open('no:' + NA);                         // A を開く（M = A1）＝CSV の読込元
      const A1 = M;
      await __open('no:' + NB);                          // CSV を読んでいるあいだに B へ
      await __open('no:' + NA);                          // A を開き直す（M = A2、別の物）
      const cam = handlePhotoFiles(__files(['#0f0']));   // A2 でカメラの1枚
      await __rel('#0f0'); await cam;
      await __open('no:' + NB);                          // B へ（A2 はカメラの1枚ごと下書きへ）
      const mid = __pids((await idbGet('no:' + NA)).model);
      A1.measurements.antenna = [{ db: '61', mer: '30', ber: '' }];   // CSV を読み終えた（読込元 A1 に入る）
      await persistModel(A1);                            // handleMeasCsv と同じ：別の戸別へ移ったので読込元を直接控える
      const rec = await idbGet('no:' + NA);
      return { cam: __pidOf('#0f0'), mid, final: __pids(rec.model),
               meas: ((rec.model.measurements || {}).antenna || [])[0] || null };
    }, { NA, NB });
    console.log('⑦b CSVの取り込み', J(r));
    ok(r.mid && r.mid.indexOf(r.cam) >= 0, '⑦b試験の前提: 開き直した戸別にカメラの1枚が入る → ' + J(r));
    ok(r.meas && r.meas.db === '61', '⑦b試験の前提: CSV の値が下書きに入る → ' + J(r));
    ok(r.final && r.final.indexOf(r.cam) >= 0, '★⑦b測定値のCSVの取り込みが読み終わると、開き直して足したカメラの写真が下書きから消える → ' + J(r));
  });

  /* ---------- ⑧ 管理番号が別の下書きと重なった新しい戸別（一時のキー）に写真を取り込む → 別の戸別の下書きを置き換えない ---------- */
  await scene('⑧', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();                                   // A（写真 a1）・B を開いている
      M = freshModel(); ensureModelShape(M); render();   // 新しい戸別
      M.chosho_mgmt_no = NA; M.chosho_cust_name = '別の人'; M._touched = true;   // もうある番号を打った
      await persistDraft();
      const k1 = M._lastDraftKey;
      const imp = handlePhotoFiles(__files(['#404', '#505']));
      await __rel('#404');
      await __open('no:' + NB);
      await __rel('#505'); await imp; await __sleep(300);
      const ra = await idbGet('no:' + NA), rt = await idbGet(k1);
      return { k1, aPhotos: __pids(ra.model), aName: ra.model.chosho_cust_name, tPhotos: rt ? __pids(rt.model) : null,
               p4: __pidOf('#404'), p5: __pidOf('#505') };
    }, { NA, NB });
    console.log('⑧番号が重なった新しい戸別', J(r));
    ok(/^tmp:/.test(r.k1 || ''), '⑧試験の前提: 番号が重なった新しい戸別は一時のキーに置かれる → ' + J(r));
    ok(r.aPhotos === 'a1' && r.aName === '工藤 A', '★⑧写真の取り込みで、別の戸別の下書き（写真ごと）が置き換わった → ' + J(r));
    ok(r.tPhotos && r.tPhotos.indexOf(r.p4) >= 0 && r.tPhotos.indexOf(r.p5) >= 0, '★⑧取り込んだ写真が、その戸別の下書きに入らない → ' + J(r));
  });

  /* ---------- ⑨ 特別記録：写真を読み終える前に「戻る」を押した → 描き直しで止まらない（写真は控えてある） ---------- */
  await scene('⑨', async page => {
    const r = await page.evaluate(async () => {
      const host = document.createElement('div');
      _spCur = null;
      let err = '';
      try { renderSpecialEdit(host); } catch(e){ err = String(e && e.message || e); }
      return { err };
    });
    console.log('⑨特別記録の描き直し', J(r));
    ok(r.err === '', '★⑨特別記録を閉じたあと、写真の読み終わりの描き直しで止まる → ' + J(r));
  });

  /* 写真の並び（a,b,c）に、ps の写真がみな入っているか／どれも入っていないか */
  const hasAll = (s, ps) => !!s && ps.every(p => String(s).split(',').indexOf(p) >= 0);
  const hasNone = (s, ps) => !!s && ps.every(p => String(s).split(',').indexOf(p) < 0);

  /* ---------- ⑩ 番号が重なった新しい戸別の取り込みの途中で、開き直して番号を直し、そのまま開いている ---------- */
  await scene('⑩', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();                                   // A（写真 a1・工藤 A）・B を開いている
      const N2 = '2612MKM099', cs = ['#a01', '#a02', '#a03'];
      M = freshModel(); ensureModelShape(M); render();   // 新しい戸別
      M.chosho_mgmt_no = NA; M.chosho_cust_name = '別の人'; M._touched = true;   // もうある番号を打った → 一時のキーに置かれる
      await persistDraft();
      const k1 = M._lastDraftKey;
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);                                // 1枚目（新しい戸別を開いている）
      await __open('no:' + NB);                          // B へ
      await __rel(cs[1]);                                // 2枚目 → 一時のキーの下書きへ
      await __open(k1);                                  // 一覧から新しい戸別を開き直す（別の写し）
      const how = __typeFld('chosho_mgmt_no', N2); await __sleep(700);   // 番号を直して、そのまま開いている（自動の控えが走る）
      const k2 = M._lastDraftKey;
      await __rel(cs[2]); await imp; await __sleep(700); // 3枚目
      const ps = cs.map(__pidOf);
      const ra = await idbGet('no:' + NA), rn = await idbGet('no:' + N2);
      return { k1, k2, how, ps, open: M.chosho_mgmt_no, m: __pids(M),
               n: rn ? __pids(rn.model) : null, nName: rn && rn.model.chosho_cust_name,
               aPhotos: __pids(ra.model), aName: ra.model.chosho_cust_name, ghosts: await __holders(ps, ['no:' + N2]) };
    }, { NA, NB });
    console.log('⑩重なった番号を開き直して直した', J(r));
    ok(/^tmp:/.test(r.k1 || '') && r.k2 === 'no:2612MKM099' && r.open === '2612MKM099',
       '⑩試験の前提: 番号が重なった新しい戸別は一時のキーに置かれ、番号を直すと直した番号のキーへ移る → ' + J(r));
    ok(hasAll(r.m, r.ps), '★⑩番号を直して開いている画面に、取り込みの残りの写真が入らない → ' + J(r));
    ok(hasAll(r.n, r.ps) && r.nName === '別の人', '★⑩直した番号の下書きに、取り込んだ写真がそろわない → ' + J(r));
    ok(r.aPhotos === 'a1' && r.aName === '工藤 A', '★⑩番号が重なった相手（A）の下書きが変わった → ' + J(r));
    ok(r.ghosts && r.ghosts.length === 0, '★⑩取り込んだ写真が、誰にも見えない下書き（消えた一時のキー）に残った → ' + J(r.ghosts));
  });

  /* ---------- ⑩b 同じく、開き直したが番号を直さずにまた離れた（一時のキーが付け替わる） ---------- */
  await scene('⑩b', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#a11', '#a12', '#a13'];
      M = freshModel(); ensureModelShape(M); render();
      M.chosho_mgmt_no = NA; M.chosho_cust_name = '別の人'; M._touched = true;
      await persistDraft();
      const k1 = M._lastDraftKey;
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);
      await __open('no:' + NB);
      await __rel(cs[1]);
      await __open(k1);                                  // 一覧から開き直す
      const m2 = M;
      await __open('no:' + NB);                          // 番号は直さずに B へ（重なったままなので、新しい一時のキーに置き直される）
      const k2 = m2._lastDraftKey;
      await __rel(cs[2]); await imp; await __sleep(400);
      const ps = cs.map(__pidOf);
      const ra = await idbGet('no:' + NA), r2 = await idbGet(k2);
      return { k1, k2, ps, holders: await __holders(ps, []), k2Photos: r2 ? __pids(r2.model) : null, k2Name: r2 && r2.model.chosho_cust_name,
               aPhotos: __pids(ra.model), aName: ra.model.chosho_cust_name };
    }, { NA, NB });
    console.log('⑩b開き直してまた離れた', J(r));
    ok(/^tmp:/.test(r.k1 || '') && /^tmp:/.test(r.k2 || '') && r.k1 !== r.k2,
       '⑩b試験の前提: 開き直して離れると、新しい一時のキーに置き直される → ' + J(r));
    ok(r.holders && r.holders.length === 1 && r.holders[0].indexOf(r.k2 + '=') === 0 && hasAll(r.k2Photos, r.ps) && r.k2Name === '別の人',
       '★⑩b取り込んだ写真が、置き直した下書き1つにそろわない（消えた一時のキーに下書きを作った） → ' + J(r));
    ok(r.aPhotos === 'a1' && r.aName === '工藤 A', '★⑩b番号が重なった相手（A）の下書きが変わった → ' + J(r));
  });

  /* ---------- ⑪ 管理番号の無い新しい戸別の取り込みの途中で、開き直して管理番号を入れた ---------- */
  await scene('⑪', async page => {
    const r = await page.evaluate(async ({ NB }) => {
      __gatedImport();
      await __state();
      const N3 = '2612MKM077', cs = ['#b01', '#b02', '#b03'];
      M = freshModel(); ensureModelShape(M); render();   // 新しい戸別（名前だけ・番号なし → 一時のキー）
      M.chosho_cust_name = '番号なしの人'; M._touched = true;
      await persistDraft();
      const k1 = M._lastDraftKey;
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);
      await __open('no:' + NB);
      await __rel(cs[1]);
      await __open(k1);                                  // 一覧から開き直す
      const how = __typeFld('chosho_mgmt_no', N3); await __sleep(700);   // 管理番号を入れて、そのまま開いている
      const k2 = M._lastDraftKey;
      await __rel(cs[2]); await imp; await __sleep(700);
      const ps = cs.map(__pidOf);
      const rn = await idbGet('no:' + N3);
      const noNum = ((await idbGetAll()) || []).filter(x => x && x.model && !String(x.mgmt || '').trim()).map(x => x.key + '=' + __pids(x.model));
      return { k1, k2, how, ps, m: __pids(M), n: rn ? __pids(rn.model) : null, ghosts: await __holders(ps, ['no:' + N3]), noNum };
    }, { NB });
    console.log('⑪番号の無い戸別に番号を入れた', J(r));
    ok(/^tmp:/.test(r.k1 || '') && r.k2 === 'no:2612MKM077', '⑪試験の前提: 番号の無い戸別は一時のキー・番号を入れるとその番号のキーへ移る → ' + J(r));
    ok(hasAll(r.m, r.ps), '★⑪番号を入れて開いている画面に、取り込みの残りの写真が入らない → ' + J(r));
    ok(hasAll(r.n, r.ps), '★⑪番号を入れた下書きに、取り込んだ写真がそろわない → ' + J(r));
    ok(r.ghosts && r.ghosts.length === 0 && r.noNum && r.noNum.length === 0,
       '★⑪取り込んだ写真が、番号の無い下書き（消えた一時のキー）に残った → ' + J(r));
  });

  /* ---------- ⑫ 取り込みの途中で開き直してカメラで足した写真を、また開き直して消した ---------- */
  await scene('⑫', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#c01', '#c02', '#c03'], cC = '#c0c';
      await __open('no:' + NA);                          // A を開く（A1）
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);                                // 1枚目（A1 を開いている）
      await __open('no:' + NB);
      await __open('no:' + NA);                          // A を開き直す（A2）
      const cam = handlePhotoFiles(__files([cC]));       // A2 でカメラの1枚
      await __rel(cC); await cam;
      await __open('no:' + NB);
      await __rel(cs[1]);                                // 2枚目 → A の下書きへ
      await __open('no:' + NA);                          // また開き直す（A3）
      const ps = cs.map(__pidOf), pC = __pidOf(cC);
      const mid = __pids(M);
      const how = __delPhoto(pC);                        // カメラの1枚を消す
      await __open('no:' + NB);
      const mid2 = __pids((await idbGet('no:' + NA)).model);
      await __rel(cs[2]); await imp; await __sleep(400); // 3枚目 → A の下書きへ
      return { ps, pC, mid, how, mid2, final: __pids((await idbGet('no:' + NA)).model) };
    }, { NA, NB });
    console.log('⑫消した写真', J(r));
    ok(hasAll(r.mid, [r.pC, r.ps[0], r.ps[1]]) && (r.how === 'button' || r.how === 'splice') && hasNone(r.mid2, [r.pC]),
       '⑫試験の前提: 開き直した A にカメラの1枚と2枚目が出ていて、消すと下書きから消える → ' + J(r));
    ok(hasAll(r.final, ['a1'].concat(r.ps)), '★⑫取り込んだ写真が下書きにそろわない → ' + J(r));
    ok(hasNone(r.final, [r.pC]), '★⑫開き直して消した写真が、取り込みの残りが届いたときに戻った → ' + J(r));
  });

  /* ---------- ⑫b 取り込みの途中で開き直した画面（開いたまま）で、取り込んだ1枚目を消した ---------- */
  await scene('⑫b', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#d01', '#d02', '#d03'];
      await __open('no:' + NA);                          // A1
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);                                // 1枚目（A1 を開いている）
      await __open('no:' + NB);
      await __open('no:' + NA);                          // A を開き直して（A2）、そのまま開いている
      const ps = cs.map(__pidOf);
      const mid = __pids(M);
      const how = __delPhoto(ps[0]);                     // 取り込んだ1枚目を消す
      await __rel(cs[1]); await __rel(cs[2]); await imp; await __sleep(700);   // 2枚目・3枚目は開いている A2 に届く
      return { ps, mid, how, open: M.chosho_mgmt_no, m: __pids(M), final: __pids((await idbGet('no:' + NA)).model) };
    }, { NA, NB });
    console.log('⑫b開いたまま消した1枚目', J(r));
    ok(r.open === NA && hasAll(r.mid, ['a1', r.ps[0]]) && (r.how === 'button' || r.how === 'splice'),
       '⑫b試験の前提: 開き直した A に1枚目が出ていて、それを消す → ' + J(r));
    ok(hasAll(r.m, ['a1', r.ps[1], r.ps[2]]) && hasAll(r.final, ['a1', r.ps[1], r.ps[2]]),
       '★⑫b取り込みの残り（2枚目・3枚目）が、開いている画面・下書きに入らない → ' + J(r));
    ok(hasNone(r.m, [r.ps[0]]) && hasNone(r.final, [r.ps[0]]),
       '★⑫b開いたまま消した1枚目が、取り込みの残りが届いたときに戻った → ' + J(r));
  });

  /* ---------- ⑬ 取り込みの途中で開き直して備考を直し、まとめて保存した → あとから届いた写真で「保存済」に見せない ---------- */
  await scene('⑬', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#e01', '#e02'], NOTE = '備考を直した';
      await __open('no:' + NA);                          // A1
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);
      await __open('no:' + NB);
      await __open('no:' + NA);                          // A2
      const how = __typeFld('chosho_note', NOTE);        // 備考を直す（直した回数が進む）
      await saveAllDrafts('unsaved'); await __sleep(600);   // まとめて保存（A は保存済になる）
      const file1 = __file(NA);
      await __open('no:' + NB);
      const before = await __info(NA);
      await __rel(cs[1]); await imp; await __sleep(400); // 2枚目 → A の下書きへ
      const late = await __info(NA);
      const note = (await idbGet('no:' + NA)).model.chosho_note;
      await saveAllDrafts('unsaved'); await __sleep(600);   // もう一度押す
      let ja = null; try{ ja = JSON.parse(__D.__files[NA + '.json']); }catch(_){}
      return { ps: cs.map(__pidOf), how, file1, before, late, note, after: await __info(NA), file2: __file(NA), fileNote: ja && ja.chosho_note };
    }, { NA, NB });
    console.log('⑬保存したあとに届いた写真', J(r));
    ok(hasAll(r.file1, ['a1', r.ps[0]]) && r.before && r.before.h === 'ok' && r.before.rev === r.before.fileRev,
       '⑬試験の前提: 備考を直した A をまとめて保存し、保存済になる → ' + J(r));
    ok(r.note === '備考を直した', '★⑬あとから届いた写真で、開き直して直した備考が元に戻った → ' + J(r));
    ok(r.late && hasAll(r.late.photos, r.ps), '★⑬あとから届いた写真が下書きに入らない → ' + J(r.late));
    ok(r.late && r.late.rev > r.late.fileRev && r.late.h !== 'ok',
       '★⑬ファイルに入っていない写真があるのに「保存済」に見える（まとめて保存から漏れる） → ' + J(r.late));
    ok(hasAll(r.file2, ['a1'].concat(r.ps)) && r.fileNote === '備考を直した' && r.after && r.after.h === 'ok',
       '★⑬もう一度「まとめて保存」を押しても、あとから届いた写真がファイルに入らない・保存済にならない → ' + J(r));
  });

  /* ---------- ⑭ 取り込みの途中で受付台帳を取り込み、名前が直った → 残りの写真が届いても名前を戻さない ---------- */
  await scene('⑭', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#f01', '#f02'];
      await __open('no:' + NA);
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);
      await __open('no:' + NB);
      receptionSaveRows(__ledger({ a: { name: '工藤 A（直した）' } }));   // 受付台帳を取り込む（A の名前が直る）
      const n = await receptionApplyToDrafts();
      const mid = (await idbGet('no:' + NA)).model.chosho_cust_name;
      await __rel(cs[1]); await imp; await __sleep(400);
      const rec = await idbGet('no:' + NA);
      return { n, mid, ps: cs.map(__pidOf), name: rec.model.chosho_cust_name, photos: __pids(rec.model) };
    }, { NA, NB });
    console.log('⑭台帳で直した名前', J(r));
    ok(r.mid === '工藤 A（直した）', '⑭試験の前提: 受付台帳の取り込みで A の下書きの名前が直る → ' + J(r));
    ok(r.name === '工藤 A（直した）', '★⑭取り込みの残りの写真が届いたら、受付台帳で直した名前が元に戻った → ' + J(r));
    ok(hasAll(r.photos, ['a1'].concat(r.ps)), '★⑭取り込んだ写真が下書きにそろわない → ' + J(r));
  });

  /* ---------- ⑮ 画面に出ていない同じ戸別に、2つの取り込みの写真が同時に届く ---------- */
  await scene('⑮', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      await __open('no:' + NA);
      const i1 = handlePhotoFiles(__files(['#071']));    // 1つ目の取り込み
      const i2 = handlePhotoFiles(__files(['#072']));    // 2つ目の取り込み（同じ A）
      await __open('no:' + NB);
      await __relAll(['#071', '#072']); await i1; await i2; await __sleep(400);   // 同時に届く
      return { ps: [__pidOf('#071'), __pidOf('#072')], photos: __pids((await idbGet('no:' + NA)).model) };
    }, { NA, NB });
    console.log('⑮2つの取り込み', J(r));
    ok(hasAll(r.photos, ['a1'].concat(r.ps)), '★⑮2つの取り込みの写真が同時に届くと、片方が下書きから消える → ' + J(r));
  });

  /* ---------- ⑮b 2つの取り込みが別々の写し（開き直す前と後）から始まっている ---------- */
  await scene('⑮b', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      await __open('no:' + NA);                          // A1
      const i1 = handlePhotoFiles(__files(['#081']));
      await __open('no:' + NB);
      await __open('no:' + NA);                          // A2
      const i2 = handlePhotoFiles(__files(['#082']));
      await __open('no:' + NB);
      await __relAll(['#081', '#082']); await i1; await i2; await __sleep(400);
      return { ps: [__pidOf('#081'), __pidOf('#082')], photos: __pids((await idbGet('no:' + NA)).model) };
    }, { NA, NB });
    console.log('⑮b別々の写しからの2つの取り込み', J(r));
    ok(hasAll(r.photos, ['a1'].concat(r.ps)), '★⑮b別々の写しから始めた2つの取り込みの写真が同時に届くと、片方が下書きから消える → ' + J(r));
  });

  /* ---------- ⑯ 引き継ぎ（📥）で新しく付く印が無いとき → 読んだ戸別ファイル全部の控えが端末に残る ---------- */
  await scene('⑯', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      await __state();                                   // この端末に A・B の下書き
      M = freshModel(); ensureModelShape(M); render();   // 画面は空の戸別（A・B は開いていない）
      const mk = no => new File([JSON.stringify({ chosho_mgmt_no: no, work_type: 'x', editedAt: '2026-10-15T00:00:00.000Z', chosho_photos: [] })],
                                no + '.json', { type: 'application/json' });   // 他の端末が保存した（印は無い）
      const s0 = __said.length;
      await flowShareRead([{ name: NA + '.json', file: mk(NA) }, { name: NB + '.json', file: mk(NB) }], false);
      await __sleep(400);
      let rec = null; try{ rec = await idbMapGet(FS_KEY); }catch(_){}
      const rows = Object.keys((rec && rec.data && rec.data.rows) || {}).sort().join(',');
      return { rows, mem: Object.keys(_flowShare.rows || {}).sort().join(','), said: __said.slice(s0) };
    }, { NA, NB });
    console.log('⑯引き継ぎ（新しい印なし）', J(r));
    ok(r.mem === NA + ',' + NB && (r.said || []).some(t => /新しく付く印はありませんでした/.test(t)),
       '⑯試験の前提: 印の増えない2件を読み、「新しく付く印はありませんでした」と出る → ' + J(r));
    ok(r.rows === NA + ',' + NB, '★⑯読んだ戸別ファイルの控えが、端末（IndexedDB）に全部残らない（控えを書き終える前に残した） → ' + J(r));
  });

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版178（現場入力）');
})();
