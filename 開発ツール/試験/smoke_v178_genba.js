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
     ⑧ 管理番号が別の下書きと重なった新しい戸別（一時のキー）に写真を取り込む → 別の戸別の下書きを置き換えない
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
/* 本物の写真の取り込み（handlePhotoFiles）を、1枚ずつ好きなときに届かせる道具（⑦⑧だけで使う） */
window.__gatedImport = function(){
  window.__cg = {};
  window.__cgate = c => new Promise(r => { window.__cg[c] = r; });
  window.__rel = async c => { for(let i = 0; i < 50 && !window.__cg[c]; i++) await __sleep(20); const g = window.__cg[c]; delete window.__cg[c]; if(g) g(); await __sleep(200); };
  readImageAsDataURI = async function(f){ await __cgate(f.__c); return __png(f.__c || '#000'); };
  photoFitForStorage = async d => d;
  window.__files = cs => cs.map(c => { const f = new File([new Uint8Array([1,2,3])], 'p.jpg', { type:'image/jpeg' }); f.__c = c; return f; });
  window.__pidOf = c => photoContentId(__png(c));
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

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版178（現場入力）');
})();
