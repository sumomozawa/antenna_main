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
   （ここから 特別記録の写真の取り込みも、端末の記録を読み直して「新しく読んだ写真だけ」を写真IDで足す。同じ記録を開いていれば、そこにも足す）
     ⑰ 写真を3枚選び、1枚目が入ったところで「戻る」→ 一覧から同じ記録を開き直してカメラで1枚 → 残りの2枚が入っても、
        カメラの写真が端末の記録から消えない・開いている画面に4枚出る。そのあと開き直した記録で備考を直しても、2枚目・3枚目が消えない
     ⑰b 同じく、開き直した記録で取り込んだ1枚目を消した → 残りが入っても、消した1枚目が戻らない
     ⑰b2 同じく、消したあと一覧へ戻ったまま残りが入る → 消した1枚目が端末の記録に戻らない
     ⑰c 開き直した記録のカメラの写真と、取り込みの残りの写真が同時に入る → 両方とも端末の記録に残る（読んで足して書くのを1つずつ）
     ⑰c2 同じく、一覧へ戻ったまま2つが同時に入る → 両方とも端末の記録に残る
     ⑰d 取り込みの写真を書いているあいだに、開き直した記録で備考を直した → 備考が元に戻らない（控えるのも同じ順番に並ぶ）。取り込みの途中でも
     ⑰e カメラで撮ったあと一覧へ戻ったまま、取り込みの残りが入る → 端末の記録に4枚そろう・開くと4枚出る
     ⑰f 新しい記録（まだ一度も控えていない）で写真を2枚選び、そのまま待つ → 1枚目から端末の記録に入る・2枚とも画面に入る・「未保存」
     ⑰g ファイルに保存した記録で、取り込みの途中に開き直した → 1枚目から「未保存」になる（保存済に見せない）
   （⑰b2・⑰c2・⑰d・⑰f・⑰g の「途中」「一覧で」の確かめは、取り込みの終わりに開いている記録を控える直し（⑰m）が
     あとから直してしまう前の、端末の記録そのものを見るためのもの）
     ⑰h 一覧から記録を開いているあいだに、取り込みの写真が入る → 開いた記録にもその写真がある（備考を直しても消えない）
   （ここから 特別記録の「保存」：書き出しているあいだに中身が変わったら「保存済」にしない・始めの記録を丸ごと書かない）
     ⑰i ファイルへ書き出しているあいだに、取り込みの写真が入る → 「保存済」にしない・そう知らせる・記録を開いたまま（入った写真が出る）
        もう一度「保存」を押すと、その写真もファイルに入って「保存済」になる
     ⑰j 書き出しているあいだに「戻る」→ 開き直した記録でカメラの1枚 → その写真が端末の記録から消えない・「保存済」にしない
     ⑰k 「保存済」の印を付けるために端末の記録を読んだところで、取り込みの写真が入る → その写真が端末の記録から消えない
   （ここから 見直しで見つかった道）
     ⑰l 一覧へ戻ったあと、取り込みの写真を端末に控えるのに1回失敗した → 次の1枚と一緒にもう一度控える（黙って落とさない）。
        ずっと控えられないときは、そう知らせる
     ⑰m 取り込みのあいだに備考を打った（欄を離れない＝控えの合図が出ない）→ 取り込みが終わって描き直しても、備考が端末の記録に残る
     ⑰n 保存のあいだに「戻る」→ ほかの記録を開いた → 保存が終わっても、その記録を閉じない
     ⑰o もう入っている写真（同じ画像）をもう一度選んだ → 1枚のまま・「同じ写真がもう入っているので足しませんでした（N枚）」と知らせる。
        a) 記録を開いたまま　b) 一覧へ戻ったあとに届いた同じ写真（端末の記録と見比べる）
     ⑰p 取り込みの途中で「戻る」→ ほかの記録 B を開いた → 取り込みの写真は B に入らない（画面・端末の記録とも）。元の記録にそろう
     ⑰f2 まだ一度も控えていない新しい記録で写真を選び、1枚目が入る前に「戻る」→ 写真が端末の記録に入り、一覧に出る
     ⑰f3 保存した記録で写真を選び、1枚目が入る前に「この記録を消す」→ あとから入った写真は捨てない（写真を減らさない）・「未保存」
     ⑰q 取り込みの途中で開き直した記録で「保存」（取り込みはまだ続く）→ 保存のあいだに何も入らなければ「保存済」（途中で変わったと言わない）
   （ここから 3回目の見直しの直し：下書きを見分ける印。下書きのキーの引っ越しは、同じ下書きのときだけ引く）
     ⑳ 新しい戸別で管理番号を 033 と打ち間違えて 034 に直した（下書きが 033 → 034 へ移った）。あとで本当の 033 の戸別を
        受付台帳から開き、写真を3枚取り込み、途中で別の戸別へ → 3枚とも 033 の下書き・ファイルに入る（034 の別のお宅に入らない）
     ⑳b 同じく、途中で 034 の戸別を開いた → 034 の画面にも下書きにも 033 の写真が出ない。
        下書きを書いたキーの引っ越しの覚えは、その下書き自身のものだけ捨てる（別の下書きの覚えは残す・4回目の見直し）
     ㉑ 測定値のCSVの取り込み（別の戸別へ移ったあとで読み終わる）で、そのキーの下書きが別の下書き（印が違う）になっていた
        → 別の下書きを置き換えない・取り込んだ戸別は一時のキーに残る（下書き一覧に出る）・別の下書きに入れたことを知らせる。
        ⑳と同じ打ち間違いのあとでも、034 を置き換えない
     ㉒ 写真が下書きに書かれている最中に、その戸別を開き直した（画面の写しは書く前の下書き）→ 書いた写真が画面の写しにも入り、控えても消えない
   （ここから 4回目の見直しの直し：同じ番号のファイルを読んでも下書きの印を引き継ぐ。別の下書きの引っ越しの覚えは捨てない）
     ㉓ A を開いて写真を3枚取り込み、1枚目のあとで「📂 読込」から A の PCのファイル（PCの写真 pc1）を読んだ（自動の控えも走る）
        → 残りの写真も画面と A の下書き1つにそろう（一時のキーの下書きを作らない）・まとめて保存で全部 A のファイルに入ってから「保存済」
     ㉔ 新規で D のつもりで 033 と打ち間違え、写真を4枚取り込む。1枚目のあとで B を見に行き、下書き一覧から戻って 034 に直し、
        本当の 033（C）を受付台帳から開いた → 残りの写真は D の下書き（034）にそろう・C の下書きは元のまま・まとめて保存で 034.json に4枚
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
/* （㉑・㉓・㉔で使う）画面の下に出る短い知らせ（toast）を __toasts に控える。知らせはそのまま出す */
window.__catchToasts = function(){
  if(window.__toasts) return;
  window.__toasts = [];
  const ot = toast;
  toast = function(msg){ window.__toasts.push(String(msg)); return ot.apply(this, arguments); };
};
/* （㉓・㉔で使う）管理番号 no の下書き。「キー=写真…」の並び（一時のキーの数字は T にする） */
window.__draftsOfNo = async no => ((await idbGetAll()) || []).filter(x => x && x.model && draftNoKey(x.mgmt) === no)
  .map(x => x.key.replace(/\\d{6,}/, 'T') + '=' + __pids(x.model));
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
/* （⑰で使う）特別記録の道具。写真の並び・📷 撮る／🖼 選ぶ に写真を渡す・欄に打つ・一覧から開く */
window.__spIds = rec => ((rec && rec.photos) || []).filter(p => p && p.dataUri).map(p => String(p.id)).sort().join(',');
window.__spFire = function(inpId, cs){
  const inp = document.getElementById(inpId);
  const fl = __files(cs);
  Object.defineProperty(inp, 'files', { configurable:true, get: () => fl });
  inp.dispatchEvent(new Event('change', { bubbles:true }));
};
window.__spType = async function(id, v){
  const el = document.getElementById(id);
  el.value = v; el.dispatchEvent(new Event('input', { bubbles:true })); el.dispatchEvent(new Event('change', { bubbles:true }));
  await __sleep(200);
};
window.__spOpen = async function(id){
  document.getElementById('sp-back').click(); await __sleep(200);
  document.querySelector('[data-sp-open="' + id + '"]').click(); await __sleep(250);
};
window.__spNew = async function(title){
  await openSpecialModal();
  document.getElementById('sp-new').click(); await __sleep(150);
  if(title) await __spType('sp-title', title);
  return { key: _spCur.key, id: _spCur.id };
};
window.__spImgs = () => document.querySelectorAll('#sp-body .sp-ph img').length;
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

  /* ---------- ⑰ 特別記録：取り込みの途中で「戻る」→ 同じ記録を開き直してカメラで1枚 → 残りが入っても消えない ----------
     取り込み（take）が覚えている記録は、取り込みを始めたときのもの。一覧から開き直した記録は別の物
     （_spCur = Object.assign(spBlank(), rec)）。始めの記録を丸ごと書くと、開き直した記録で足した写真が消える。 */
  await scene('⑰', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f01', '#f02', '#f03'], cC = '#0c0';
      const { key, id } = await __spNew('アンテナ 検収');
      const r1 = _spCur;
      __spFire('sp-pick', cs);                           // 写真を3枚選ぶ（取り込みは r1 に入っていく）
      await __rel(cs[0]);                                // 1枚目が入った
      await __spOpen(id);                                // 「戻る」→ 一覧から同じ記録を開き直す（別の物）
      const r2 = _spCur;
      __spFire('sp-cam', [cC]); await __rel(cC);         // 開き直した記録でカメラの1枚
      const mid = __spIds(await idbGet(key));
      await __rel(cs[1]); await __rel(cs[2]); await __sleep(300);   // 取り込みの2枚目・3枚目が入る
      const after = __spIds(await idbGet(key)), scr = __spIds(_spCur), imgs = __spImgs(), same = (_spCur === r2);
      await __spType('sp-note', '備考を直した');          // 開き直した記録で備考を直す
      const rec = await idbGet(key);
      return { ps: cs.map(__pidOf), pC: __pidOf(cC), other: r1 !== r2, mid, after, scr, imgs, same,
               final: __spIds(rec), note: rec && rec.note, title: rec && rec.title };
    });
    console.log('⑰特別記録の開き直し', J(r));
    ok(r.other && r.same && hasAll(r.mid, [r.ps[0], r.pC]), '⑰試験の前提: 開き直した記録は別の物で、1枚目とカメラの1枚が端末の記録に入る → ' + J(r));
    ok(hasAll(r.after, r.ps.concat([r.pC])), '★⑰取り込みの残りが入ると、開き直して撮ったカメラの写真が端末の記録から消える → ' + J(r));
    ok(hasAll(r.scr, r.ps.concat([r.pC])) && r.imgs === 4, '★⑰取り込みの残りの写真が、開いている記録の画面に出ない → ' + J(r));
    ok(hasAll(r.final, r.ps.concat([r.pC])), '★⑰開き直した記録で備考を直すと、取り込んだ2枚目・3枚目が端末の記録から消える → ' + J(r));
    ok(r.note === '備考を直した' && r.title === 'アンテナ 検収', '★⑰開き直した記録の備考・件名が端末の記録に残らない → ' + J(r));
  });

  /* ---------- ⑰b 開き直した記録で取り込んだ1枚目を消した → 残りが入っても、消した1枚目が戻らない ---------- */
  await scene('⑰b', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f11', '#f12', '#f13'];
      const { key, id } = await __spNew('消す');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);                                // 開き直す（1枚目が出ている）
      const ps = cs.map(__pidOf);
      const i = _spCur.photos.findIndex(p => p && p.id === ps[0]);
      const b = document.querySelector('[data-sp-photodel="' + i + '"]');
      if(b) b.click();                                   // ✕ → 確かめの窓は「OK」
      await __sleep(400);
      const mid = __spIds(await idbGet(key));
      await __rel(cs[1]); await __rel(cs[2]); await __sleep(300);
      return { ps, btn: !!b, mid, scr: __spIds(_spCur), final: __spIds(await idbGet(key)) };
    });
    console.log('⑰b消した1枚目', J(r));
    ok(r.btn && r.mid === '', '⑰b試験の前提: 開き直した記録で1枚目を消すと、端末の記録からも消える → ' + J(r));
    ok(hasAll(r.final, [r.ps[1], r.ps[2]]) && hasAll(r.scr, [r.ps[1], r.ps[2]]), '★⑰b取り込みの残り（2枚目・3枚目）が端末の記録・画面に入らない → ' + J(r));
    ok(hasNone(r.final, [r.ps[0]]) && hasNone(r.scr, [r.ps[0]]), '★⑰b開き直して消した1枚目が、取り込みの残りが入ったときに戻った → ' + J(r));
  });
  await scene('⑰b2', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f14', '#f15', '#f16'];
      const { key, id } = await __spNew('消して一覧で待つ');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);
      const ps = cs.map(__pidOf);
      const i = _spCur.photos.findIndex(p => p && p.id === ps[0]);
      const b = document.querySelector('[data-sp-photodel="' + i + '"]');
      if(b) b.click();
      await __sleep(400);
      const mid = __spIds(await idbGet(key));
      document.getElementById('sp-back').click(); await __sleep(200);   // 一覧へ戻ったまま
      await __rel(cs[1]); await __rel(cs[2]); await __sleep(300);
      return { ps, btn: !!b, mid, list: !_spCur, final: __spIds(await idbGet(key)) };
    });
    console.log('⑰b2消して一覧で待つ', J(r));
    ok(r.btn && r.mid === '' && r.list, '⑰b2試験の前提: 開き直した記録で1枚目を消し、一覧へ戻る → ' + J(r));
    ok(hasAll(r.final, [r.ps[1], r.ps[2]]) && hasNone(r.final, [r.ps[0]]), '★⑰b2一覧で待つあいだに残りが入ると、消した1枚目が端末の記録に戻った・残りが入らない → ' + J(r));
  });

  /* ---------- ⑰c 開き直した記録のカメラの写真と、取り込みの残りが同時に入る → 両方とも残る ---------- */
  await scene('⑰c', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f21', '#f22'], cC = '#0c2';
      const { key, id } = await __spNew('同時');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);
      __spFire('sp-cam', [cC]);
      await __relAll([cs[1], cC]);                       // 2つの取り込みの写真が同時に入る
      await __sleep(300);
      return { ps: cs.map(__pidOf), pC: __pidOf(cC), db: __spIds(await idbGet(key)), scr: __spIds(_spCur) };
    });
    console.log('⑰c同時に入る', J(r));
    ok(hasAll(r.scr, r.ps.concat([r.pC])), '⑰c試験の前提: 開いている記録に3枚出る → ' + J(r));
    ok(hasAll(r.db, r.ps.concat([r.pC])), '★⑰c2つの取り込みの写真が同時に入ると、片方が端末の記録から消える → ' + J(r));
  });
  await scene('⑰c2', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f24', '#f25'], cC = '#0c5';
      const { key, id } = await __spNew('同時に一覧で');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);
      __spFire('sp-cam', [cC]);
      for(let i = 0; i < 50 && !(window.__cg && window.__cg[cC]); i++) await __sleep(20);   // カメラの1枚を読み始めた
      document.getElementById('sp-back').click(); await __sleep(200);   // 一覧へ戻ったまま
      await __relAll([cs[1], cC]); await __sleep(300);
      return { ps: cs.map(__pidOf), pC: __pidOf(cC), list: !_spCur, db: __spIds(await idbGet(key)) };
    });
    console.log('⑰c2一覧で同時に入る', J(r));
    ok(r.list, '⑰c2試験の前提: 一覧へ戻ったまま → ' + J(r));
    ok(hasAll(r.db, r.ps.concat([r.pC])), '★⑰c2一覧へ戻ったまま2つの写真が同時に入ると、片方が端末の記録から消える → ' + J(r));
  });

  /* ---------- ⑰d 取り込みの写真を書いているあいだに、開き直した記録で備考を直した → 備考が元に戻らない ---------- */
  await scene('⑰d', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f31', '#f32', '#f33'];
      const { key, id } = await __spNew('並ぶ');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);
      /* 取り込みが端末の記録を読み直したところで、備考を直す（控えは取り込みの書き込みのあとに並ぶはず） */
      const og = idbGet; let fired = 0;
      idbGet = async k => { const v = await og(k);
        if(k === key && !fired){ fired = 1; const el = document.getElementById('sp-note');
          el.value = '備考を直した'; el.dispatchEvent(new Event('input', { bubbles:true })); el.dispatchEvent(new Event('change', { bubbles:true })); }
        return v; };
      await __rel(cs[1]); await __sleep(400);
      idbGet = og;
      const mid = await idbGet(key);                      // 取り込みの途中（3枚目はまだ）
      await __rel(cs[2]); await __sleep(300);
      const rec = await idbGet(key);
      return { fired, ps: cs.map(__pidOf), midNote: mid && mid.note, final: __spIds(rec), note: rec && rec.note, scr: _spCur && _spCur.note };
    });
    console.log('⑰d備考が戻らない', J(r));
    ok(r.fired === 1 && r.scr === '備考を直した', '⑰d試験の前提: 取り込みが端末の記録を読み直したところで備考を直す → ' + J(r));
    ok(hasAll(r.final, r.ps), '★⑰d取り込んだ写真が端末の記録にそろわない → ' + J(r));
    ok(r.midNote === '備考を直した' && r.note === '備考を直した', '★⑰d取り込みの写真を書いたときに、開き直した記録で直した備考が元に戻った（取り込みの途中・終わり） → ' + J(r));
  });

  /* ---------- ⑰e カメラで撮ったあと一覧へ戻ったまま、取り込みの残りが入る → 端末の記録に4枚そろう ---------- */
  await scene('⑰e', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f41', '#f42', '#f43'], cC = '#0c4';
      const { key, id } = await __spNew('一覧で待つ');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);
      __spFire('sp-cam', [cC]); await __rel(cC);
      document.getElementById('sp-back').click(); await __sleep(200);   // 一覧へ戻ったまま
      await __rel(cs[1]); await __rel(cs[2]); await __sleep(300);
      const db = __spIds(await idbGet(key)), list = !_spCur && !!document.querySelector('[data-sp-open="' + id + '"]');
      document.querySelector('[data-sp-open="' + id + '"]').click(); await __sleep(250);
      return { ps: cs.map(__pidOf), pC: __pidOf(cC), db, list, scr: __spIds(_spCur), imgs: __spImgs() };
    });
    console.log('⑰e一覧で待つ', J(r));
    ok(r.list, '⑰e試験の前提: 取り込みの残りが入っても一覧のまま → ' + J(r));
    ok(hasAll(r.db, r.ps.concat([r.pC])), '★⑰e一覧へ戻ったあとに取り込みの残りが入ると、カメラの写真が端末の記録から消える → ' + J(r));
    ok(hasAll(r.scr, r.ps.concat([r.pC])) && r.imgs === 4, '★⑰eあとで開いた記録に4枚出ない → ' + J(r));
  });

  /* ---------- ⑰f 新しい記録（まだ控えていない）で写真を2枚選び、そのまま待つ ---------- */
  await scene('⑰f', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f51', '#f52'];
      const { key } = await __spNew('');                 // 件名も打たない（端末にまだ記録が無い）
      const before = await idbGet(key);
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      const mid = __spIds(await idbGet(key));             // 取り込みの途中（2枚目はまだ）
      await __rel(cs[1]); await __sleep(300);
      const rec = await idbGet(key);
      return { ps: cs.map(__pidOf), before: !!before, mid, db: __spIds(rec), scr: __spIds(_spCur), imgs: __spImgs(),
               stale: !!(rec && spStale(rec)), rev: (rec && rec.rev) | 0 };
    });
    console.log('⑰f新しい記録', J(r));
    ok(r.before === false, '⑰f試験の前提: 新しい記録は端末にまだ無い → ' + J(r));
    ok(r.mid === r.ps[0], '★⑰f新しい記録の1枚目が、取り込みの途中で端末の記録に入っていない（取り込みが終わるまで控えない） → ' + J(r));
    ok(hasAll(r.db, r.ps) && hasAll(r.scr, r.ps) && r.imgs === 2, '★⑰f新しい記録に選んだ写真が、端末の記録・画面に入らない → ' + J(r));
    ok(r.stale && r.rev > 0, '★⑰f写真を入れた新しい記録が「未保存」にならない → ' + J(r));
  });

  /* ---------- ⑰g ファイルに保存した記録で、取り込みの途中に開き直した → 残りが入ると「未保存」 ---------- */
  await scene('⑰g', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f61', '#f62'];
      const D = __mkdir('リスト', {});
      window.showSaveFilePicker = undefined; saveDirGet = async () => D; saveDirSettle = async d => d;
      const { key, id } = await __spNew('保存した');
      const res = await spSaveFile(_spCur); await __sleep(100);
      const saved0 = !spStale(await idbGet(key));
      await __spOpen(id);                                // 保存した記録を開き直して
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      const mid = await idbGet(key);                      // 取り込みの途中（2枚目はまだ）
      const midStale = !!(mid && spStale(mid));
      await __spOpen(id);                                // 取り込みの途中でまた開き直す
      await __rel(cs[1]); await __sleep(300);
      const rec = await idbGet(key);
      document.getElementById('sp-back').click(); await __sleep(200);
      const row = document.querySelector('[data-sp-open="' + id + '"]');
      const badge = row ? ((row.closest('.sp-row') || {}).textContent || '') : '';
      return { ok: !!(res && res.ok), saved0, midStale, ps: cs.map(__pidOf), db: __spIds(rec), stale: !!(rec && spStale(rec)),
               rev: rec && rec.rev, fileRev: rec && rec.fileRev, unsaved: /未保存/.test(badge) };
    });
    console.log('⑰g保存した記録', J(r));
    ok(r.ok && r.saved0, '⑰g試験の前提: 記録をファイルに保存すると「保存済」 → ' + J(r));
    ok(hasAll(r.db, r.ps), '★⑰g保存した記録に取り込んだ写真が、端末の記録に入らない → ' + J(r));
    ok(r.midStale && r.stale && r.unsaved, '★⑰gファイルに入っていない写真が入ったのに「保存済」に見える（取り込みの途中・終わり） → ' + J(r));
  });

  /* ---------- ⑰h 一覧から記録を開いているあいだに、取り込みの写真が入る → 開いた記録にもその写真がある ---------- */
  await scene('⑰h', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#f71', '#f72'];
      const { key, id } = await __spNew('開くあいだ');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      document.getElementById('sp-back').click(); await __sleep(200);
      /* 一覧から開く：端末の記録を読み終えたところで、取り込みの2枚目が入る */
      for(let i = 0; i < 50 && !(window.__cg && window.__cg[cs[1]]); i++) await __sleep(20);
      const og = spList; let fired = 0;
      spList = async () => { const v = await og();
        if(!fired){ fired = 1; await __rel(cs[1]); }
        return v; };
      document.querySelector('[data-sp-open="' + id + '"]').click(); await __sleep(500);
      spList = og;
      const scr = __spIds(_spCur);
      await __spType('sp-note', '開いてから直した');
      const rec = await idbGet(key);
      return { fired, ps: cs.map(__pidOf), scr, final: __spIds(rec), note: rec && rec.note };
    });
    console.log('⑰h開くあいだ', J(r));
    ok(r.fired === 1 && r.note === '開いてから直した', '⑰h試験の前提: 一覧から開くあいだに2枚目が入り、開いた記録で備考を直す → ' + J(r));
    ok(hasAll(r.scr, r.ps), '★⑰h一覧から開くあいだに入った写真が、開いた記録に無い → ' + J(r));
    ok(hasAll(r.final, r.ps), '★⑰h一覧から開くあいだに入った写真が、開いた記録で備考を直すと端末の記録から消える → ' + J(r));
  });

  /* ---------- ⑰i〜⑰k 特別記録の「保存」：書き出しているあいだに中身が変わる ----------
     書き出すファイルの中身は「保存」を押したときに作る。書き出しているあいだ（フォルダ・保存先を選ぶ画面・共有・読み返し）に
     入った写真はファイルに無いので、「保存済」にしてはいけない。印を付けるときに始めの記録を丸ごと書いてもいけない。 */
  const SP_SAVE_SETUP = async () => {
    const D = __mkdir('リスト', {});
    window.showSaveFilePicker = undefined; saveDirGet = async () => D; saveDirSettle = async d => d;
    window.__spD = D;
  };
  await scene('⑰i', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      __gatedImport();
      const D = window.__spD, cs = ['#f81', '#f82', '#f83'];
      const { key, id } = await __spNew('保存の途中');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);                                // 1枚目が入った
      let fired = 0;
      window.__onWrite = async () => { if(fired) return; fired = 1; await __rel(cs[1]); };   // 書き出しているあいだに2枚目が入る
      document.getElementById('sp-save').click();
      for(let i = 0; i < 100 && !document.querySelector('#save-ov .save-ov-check'); i++) await __sleep(30);
      await __sleep(200);
      window.__onWrite = null;
      const fname = Object.keys(D.__files)[0] || '';
      const f1 = fname ? __spIds({ photos: JSON.parse(D.__files[fname]).chosho_photos }) : null;
      const rec1 = await idbGet(key);
      const ov = (document.getElementById('save-ov') || {}).textContent || '';
      const open = !!(_spCur && _spCur.key === key), imgs = __spImgs();
      await __rel(cs[2]); await __sleep(300);            // 取り込みの3枚目
      const x = document.getElementById('save-ov-x2'); if(x) x.click();
      /* もう一度「保存」（開いたままでなければ、一覧から開いて押す） */
      if(!(_spCur && _spCur.key === key)) document.querySelector('[data-sp-open="' + id + '"]').click();
      await __sleep(250);
      const w0 = D.__wrote.length;
      document.getElementById('sp-save').click();
      for(let i = 0; i < 100 && D.__wrote.length === w0; i++) await __sleep(30);
      await __sleep(400);
      const rec2 = await idbGet(key);
      return { fired, ps: cs.map(__pidOf), f1, db1: __spIds(rec1), stale1: !!(rec1 && spStale(rec1)),
               said: /保存の途中/.test(ov) && /もう一度「保存」/.test(ov), open, imgs,
               f2: __spIds({ photos: JSON.parse(D.__files[fname] || '{}').chosho_photos }), stale2: !!(rec2 && spStale(rec2)),
               sameName: Object.keys(D.__files).length === 1 };
    });
    console.log('⑰i保存の途中で写真が入る', J(r));
    ok(r.fired === 1 && r.f1 === r.ps[0], '⑰i試験の前提: 書き出すファイルは1枚目だけで、書き出しているあいだに2枚目が入る → ' + J(r));
    ok(hasAll(r.db1, [r.ps[0], r.ps[1]]), '★⑰i書き出しているあいだに入った写真が、端末の記録から消えた → ' + J(r));
    ok(r.stale1, '★⑰i書き出しているあいだに写真が入ったのに「保存済」になった（ファイルにその写真が無い） → ' + J(r));
    ok(r.said, '★⑰i保存の途中で中身が変わったことを知らせない → ' + J(r));
    ok(r.open && r.imgs === 2, '★⑰i保存の途中で中身が変わったのに、記録を閉じた・入った写真が画面に出ない → ' + J(r));
    ok(hasAll(r.f2, r.ps) && !r.stale2 && r.sameName, '★⑰iもう一度「保存」を押しても、写真がそろわない・「保存済」にならない・別の名前のファイルができた → ' + J(r));
  });

  await scene('⑰j', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cC = '#0c9';
      const { key, id } = await __spNew('保存の途中で開き直す');
      __spFire('sp-pick', ['#f91']); await __rel('#f91');
      let fired = 0;
      window.__onWrite = async () => { if(fired) return; fired = 1;
        await __spOpen(id);                              // 書き出しているあいだに「戻る」→ 開き直して
        __spFire('sp-cam', [cC]); await __rel(cC); };     // カメラで1枚
      document.getElementById('sp-save').click();
      for(let i = 0; i < 100 && !document.querySelector('#save-ov .save-ov-check'); i++) await __sleep(30);
      await __sleep(300);
      window.__onWrite = null;
      const rec = await idbGet(key);
      return { fired, p1: __pidOf('#f91'), pC: __pidOf(cC), db: __spIds(rec), stale: !!(rec && spStale(rec)),
               scr: __spIds(_spCur), open: !!(_spCur && _spCur.key === key) };
    });
    console.log('⑰j保存の途中で開き直す', J(r));
    ok(r.fired === 1, '⑰j試験の前提: 書き出しているあいだに開き直してカメラで撮る → ' + J(r));
    ok(hasAll(r.db, [r.p1, r.pC]), '★⑰j書き出しているあいだに開き直して撮った写真が、保存の印を付けたときに端末の記録から消えた → ' + J(r));
    ok(r.stale, '★⑰j書き出しているあいだに写真が入ったのに「保存済」になった → ' + J(r));
    ok(r.open && hasAll(r.scr, [r.p1, r.pC]), '★⑰j開き直した記録が閉じられた・撮った写真が出ない → ' + J(r));
  });

  await scene('⑰k', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#fa1', '#fa2'];
      const { key, id } = await __spNew('印のあいだ');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      /* 書き終えたあと、「保存済」の印のために端末の記録を読んだところで、取り込みの2枚目が入る */
      let arm = 0, fired = 0;
      window.__onWrite = async () => { arm = 1; };
      const og = idbGet;
      idbGet = async k => { const v = await og(k);
        if(arm && k === key){ arm = 0; fired = 1; await __rel(cs[1]); await __sleep(300); }
        return v; };
      document.getElementById('sp-save').click();
      for(let i = 0; i < 100 && !document.querySelector('#save-ov .save-ov-check'); i++) await __sleep(30);
      await __sleep(600);
      idbGet = og; window.__onWrite = null;
      const rec = await idbGet(key);
      return { fired, ps: cs.map(__pidOf), db: __spIds(rec), stale: !!(rec && spStale(rec)) };
    });
    console.log('⑰k印のあいだに写真が入る', J(r));
    ok(r.fired === 1, '⑰k試験の前提: 保存済の印のために端末の記録を読んだところで2枚目が入る → ' + J(r));
    ok(hasAll(r.db, r.ps), '★⑰k保存済の印を付けたときに、そのあいだに入った写真が端末の記録から消えた → ' + J(r));
    ok(r.stale, '★⑰kファイルに無い写真が入ったのに「保存済」に見える → ' + J(r));
  });

  /* ---------- ⑰l 一覧へ戻ったあと、取り込みの写真を端末に控えるのに失敗した ---------- */
  await scene('⑰l', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const op = idbPut, said = () => ((document.getElementById('savedhint') || {}).textContent || '');
      /* a) 2枚目の控えに1回だけ失敗する */
      const cs = ['#fb1', '#fb2', '#fb3'];
      const A = await __spNew('控えに1回失敗');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      document.getElementById('sp-back').click(); await __sleep(200);   // 一覧へ戻ったまま
      let thrown = 0;
      idbPut = async rec => { if(rec && rec.key === A.key && !thrown){ thrown = 1; throw new Error('QuotaExceededError'); } return op(rec); };
      await __rel(cs[1]);
      idbPut = op;
      await __rel(cs[2]); await __sleep(300);
      const dbA = __spIds(await idbGet(A.key));
      /* b) ずっと控えられない */
      const ds = ['#fb4', '#fb5'];
      const B = await __spNew('ずっと控えられない');
      __spFire('sp-pick', ds);
      await __rel(ds[0]);
      document.getElementById('sp-back').click(); await __sleep(200);
      let tries = 0;
      idbPut = async rec => { if(rec && rec.key === B.key){ tries++; throw new Error('QuotaExceededError'); } return op(rec); };
      await __rel(ds[1]); await __sleep(300);
      const msg = said();
      idbPut = op;
      return { thrown, ps: cs.map(__pidOf), dbA, tries, msg };
    });
    console.log('⑰l控えに失敗', J(r));
    ok(r.thrown === 1, '⑰l試験の前提: 2枚目の控えに1回だけ失敗する → ' + J(r));
    ok(hasAll(r.dbA, r.ps), '★⑰l端末に控えられなかった写真を、もう一度控えない（黙って消える） → ' + J(r));
    ok(r.tries >= 2 && /控えられませんでした/.test(r.msg), '★⑰lずっと控えられない写真があるのに、知らせない → ' + J(r));
  });

  /* ---------- ⑰m 取り込みのあいだに備考を打った（欄を離れない）→ 描き直しても端末の記録に残る ---------- */
  await scene('⑰m', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#fc1', '#fc2'];
      const { key } = await __spNew('打った文字');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      const el = document.getElementById('sp-note');
      el.value = '取り込み中に打った'; el.dispatchEvent(new Event('input', { bubbles:true }));   // 欄を離れない（change は出ない）
      await __rel(cs[1]); await __sleep(300);            // 取り込みが終わって描き直す
      const shown = (document.getElementById('sp-note') || {}).value;
      document.getElementById('sp-back').click(); await __sleep(200);
      const rec = await idbGet(key);
      return { ps: cs.map(__pidOf), shown, note: rec && rec.note, db: __spIds(rec) };
    });
    console.log('⑰m取り込み中に打った', J(r));
    ok(r.shown === '取り込み中に打った' && hasAll(r.db, r.ps), '⑰m試験の前提: 描き直した欄に打った文字が出て、写真が端末の記録に入る → ' + J(r));
    ok(r.note === '取り込み中に打った', '★⑰m取り込みのあいだに打った備考が、描き直したあと端末の記録に残らない → ' + J(r));
  });

  /* ---------- ⑰n 保存のあいだに「戻る」→ ほかの記録を開いた → 保存が終わっても閉じない ---------- */
  await scene('⑰n', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      const B = await __spNew('ほかの記録');
      const A = await __spNew('保存する記録');
      let fired = 0;
      window.__onWrite = async () => { if(fired) return; fired = 1;
        document.getElementById('sp-back').click(); await __sleep(200);
        document.querySelector('[data-sp-open="' + B.id + '"]').click(); await __sleep(250); };
      document.getElementById('sp-save').click();
      for(let i = 0; i < 100 && !document.querySelector('#save-ov .save-ov-check'); i++) await __sleep(30);
      await __sleep(300);
      window.__onWrite = null;
      return { fired, openB: !!(_spCur && _spCur.key === B.key), title: (document.getElementById('sp-title') || {}).value || '',
               savedA: !spStale(await idbGet(A.key)) };
    });
    console.log('⑰n保存のあいだにほかの記録', J(r));
    ok(r.fired === 1 && r.savedA, '⑰n試験の前提: 保存のあいだにほかの記録を開き、保存は終わる → ' + J(r));
    ok(r.openB && r.title === 'ほかの記録', '★⑰n保存が終わったときに、あいだに開いたほかの記録を閉じた → ' + J(r));
  });

  /* ---------- ⑰o もう入っている写真（同じ画像）をもう一度選んだ → 1枚のまま・知らせる ---------- */
  await scene('⑰o', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const said = () => ((document.getElementById('savedhint') || {}).textContent || '');
      const ids = rec => ((rec && rec.photos) || []).filter(p => p && p.dataUri).map(p => String(p.id));
      /* a) 記録を開いたまま：X を入れてから、X と Y を選ぶ */
      const A = await __spNew('同じ写真 a');
      __spFire('sp-pick', ['#fd1']); await __rel('#fd1');
      __spFire('sp-pick', ['#fd1', '#fd2']); await __rel('#fd1'); await __rel('#fd2'); await __sleep(300);
      const aDb = ids(await idbGet(A.key)), aScr = ids(_spCur), aImgs = __spImgs(), aSaid = said();
      /* b) Z・W・Z（同じ画像）を選び、1枚目のあとで一覧へ戻る */
      const B = await __spNew('同じ写真 b');
      __spFire('sp-pick', ['#fd3', '#fd4', '#fd3']);
      await __rel('#fd3');
      document.getElementById('sp-back').click(); await __sleep(200);
      await __rel('#fd4'); await __rel('#fd3'); await __sleep(300);
      const bDb = ids(await idbGet(B.key)), bSaid = said();
      return { X: __pidOf('#fd1'), Y: __pidOf('#fd2'), Z: __pidOf('#fd3'), W: __pidOf('#fd4'), aDb, aScr, aImgs, aSaid, bDb, bSaid };
    });
    console.log('⑰o同じ写真', J(r));
    const one = (a, ps) => Array.isArray(a) && a.length === ps.length && ps.every(p => a.indexOf(p) >= 0);
    ok(one(r.aDb, [r.X, r.Y]) && one(r.aScr, [r.X, r.Y]) && r.aImgs === 2, '★⑰o a) 開いている記録で同じ写真を選ぶと、2枚になった・Y が入らない → ' + J(r));
    ok(/同じ写真がもう入っているので足しませんでした（1枚）/.test(r.aSaid), '★⑰o a) 同じ写真を足さなかったことを知らせない → ' + J(r));
    ok(one(r.bDb, [r.Z, r.W]), '★⑰o b) 一覧へ戻ったあとに届いた同じ写真が、2枚になった・W が入らない → ' + J(r));
    ok(/同じ写真がもう入っているので足しませんでした（1枚）/.test(r.bSaid), '★⑰o b) 一覧へ戻ったあとの同じ写真を、足さなかったと知らせない → ' + J(r));
  });

  /* ---------- ⑰p 取り込みの途中で ほかの記録 B を開いた → B に入らない ---------- */
  await scene('⑰p', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#fe1', '#fe2'];
      const B = await __spNew('ほかの記録 B');
      const A = await __spNew('取り込む記録 A');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      document.getElementById('sp-back').click(); await __sleep(200);
      document.querySelector('[data-sp-open="' + B.id + '"]').click(); await __sleep(250);   // B を開く
      await __rel(cs[1]); await __sleep(300);
      const bScr = __spIds(_spCur), bImgs = __spImgs();
      await __spType('sp-note', 'B の備考');            // B で備考を直す（B を控える）
      return { ps: cs.map(__pidOf), openB: !!(_spCur && _spCur.key === B.key), bScr, bImgs,
               bDb: __spIds(await idbGet(B.key)), aDb: __spIds(await idbGet(A.key)) };
    });
    console.log('⑰pほかの記録', J(r));
    ok(r.openB, '⑰p試験の前提: 取り込みの途中で B を開いている → ' + J(r));
    ok(r.bScr === '' && r.bImgs === 0 && r.bDb === '', '★⑰p取り込みの写真が、ほかの記録 B（画面・端末の記録）に入った → ' + J(r));
    ok(hasAll(r.aDb, r.ps), '★⑰p取り込みの写真が、取り込んだ記録 A の端末の記録にそろわない → ' + J(r));
  });

  /* ---------- ⑰f2 まだ控えていない新しい記録で、1枚目が入る前に「戻る」 ---------- */
  await scene('⑰f2', async page => {
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#ff1', '#ff2'];
      const { key, id } = await __spNew('');             // 件名なし（端末にまだ無い）
      const before = await idbGet(key);
      __spFire('sp-pick', cs);
      document.getElementById('sp-back').click(); await __sleep(200);   // 1枚目が入る前に一覧へ
      await __rel(cs[0]); await __rel(cs[1]); await __sleep(300);
      await renderSpecial();
      return { ps: cs.map(__pidOf), before: !!before, db: __spIds(await idbGet(key)),
               row: !!document.querySelector('[data-sp-open="' + id + '"]') };
    });
    console.log('⑰f2控えていない新しい記録', J(r));
    ok(r.before === false, '⑰f2試験の前提: 新しい記録は端末にまだ無い → ' + J(r));
    ok(hasAll(r.db, r.ps) && r.row, '★⑰f2まだ控えていない新しい記録で一覧へ戻ると、取り込みの写真が端末の記録に入らない・一覧に出ない → ' + J(r));
  });

  /* ---------- ⑰f3 保存した記録で、1枚目が入る前に「この記録を消す」 ---------- */
  await scene('⑰f3', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      __gatedImport();
      const cs = ['#ff3', '#ff4'];
      const { key, id } = await __spNew('消す記録');
      const res = await spSaveFile(_spCur); await __sleep(100);
      await __spOpen(id);
      const saved0 = !spStale(await idbGet(key));
      __spFire('sp-pick', cs);
      const del = document.getElementById('sp-delrec');
      if(del) del.click();                               // 確かめの窓は「OK」
      await __sleep(400);
      const gone = !(await idbGet(key));
      await __rel(cs[0]);
      const mid = await idbGet(key);
      await __rel(cs[1]); await __sleep(300);
      const rec = await idbGet(key);
      return { ok: !!(res && res.ok), saved0, del: !!del, gone, ps: cs.map(__pidOf),
               midDb: __spIds(mid), midStale: !!(mid && spStale(mid)), db: __spIds(rec), stale: !!(rec && spStale(rec)) };
    });
    console.log('⑰f3消した記録に写真が入る', J(r));
    ok(r.ok && r.saved0 && r.del && r.gone, '⑰f3試験の前提: 保存した記録を端末から消した → ' + J(r));
    ok(r.midDb === r.ps[0] && hasAll(r.db, r.ps), '★⑰f3消したあとに入った写真を捨てた（写真が減る） → ' + J(r));
    ok(r.midStale && r.stale, '★⑰f3ファイルに無い写真が入った記録が「保存済」に見える → ' + J(r));
  });

  /* ---------- ⑰q 取り込みの途中で開き直した記録で「保存」→ 何も入らなければ「保存済」 ---------- */
  await scene('⑰q', async page => {
    await page.evaluate(SP_SAVE_SETUP);
    const r = await page.evaluate(async () => {
      __gatedImport();
      const D = window.__spD, cs = ['#ff5', '#ff6', '#ff7'];
      const { key, id } = await __spNew('開き直して保存');
      __spFire('sp-pick', cs);
      await __rel(cs[0]);
      await __spOpen(id);                                // 開き直す（取り込みは始めの記録に続く）
      await __rel(cs[1]);                                // 2枚目は開き直した記録にも入る
      document.getElementById('sp-save').click();       // 3枚目はまだ
      for(let i = 0; i < 100 && !document.querySelector('#save-ov .save-ov-check'); i++) await __sleep(30);
      await __sleep(200);
      const ov = (document.getElementById('save-ov') || {}).textContent || '';
      const rec = await idbGet(key);
      const fname = Object.keys(D.__files)[0] || '';
      const file = fname ? __spIds({ photos: JSON.parse(D.__files[fname]).chosho_photos }) : null;
      await __rel(cs[2]); await __sleep(300);
      return { ps: cs.map(__pidOf), file, late: /保存の途中/.test(ov), stale: !!(rec && spStale(rec)), rev: rec && rec.rev, fileRev: rec && rec.fileRev };
    });
    console.log('⑰q開き直して保存', J(r));
    ok(hasAll(r.file, [r.ps[0], r.ps[1]]), '⑰q試験の前提: ファイルに1枚目・2枚目が入る → ' + J(r));
    ok(!r.late && !r.stale, '★⑰q保存のあいだに何も入っていないのに「保存の途中で変わった」「未保存」になる（開き直した記録の回数がずれている） → ' + J(r));
  });

  /* 写真の並び（a,b,c）に、ps の写真がどれも入っていないか（写真が1枚も無い '' でもよい） */
  const lacks = (s, ps) => typeof s === 'string' && ps.every(p => s.split(',').indexOf(p) < 0);
  const NC = '2612MKM033', ND = '2612MKM034';

  /* ⑳・⑳b の流れ（画面の中で動かす）。
     新しい戸別で 033 と打ち間違え（自動の控えが走る）→ 034 に直して名前を入れる（下書きが 033 → 034 へ移る）。
     あとで本当の 033（C）を受付台帳から開き、写真を3枚取り込む。1枚目のあとで別の戸別（SW='B' なら B、'D' なら 034）を開き、残りが届く。
     最後に「まとめて保存」。 */
  const typoFlow = async ({ NA, NB, NC, ND, SW, cs }) => {
    __gatedImport();
    await __state();                                   // A・B の下書き（画面は B）
    const L = __ledger(); L.rows.push({ mgmt_no: NC, name: '工藤 C', addr: '三沢市C町3', date: '2026-10-22' });
    receptionSaveRows(L);
    clearTimeout(_persistTimer); await persistDraft();
    M = freshModel(); ensureModelShape(M); render();   // 新しい戸別
    const how1 = __typeFld('chosho_mgmt_no', NC); await __sleep(700);   // 033 と打ち間違えた（自動の控えが走る）
    const k0 = M._lastDraftKey;
    const how2 = __typeFld('chosho_mgmt_no', ND); await __sleep(700);   // 034 に直した（下書きが 033 → 034 へ移る）
    __typeFld('chosho_cust_name', '別の人 D'); await __sleep(700);
    const k1 = M._lastDraftKey;
    const rowC = getReceptionRows().find(x => x.mgmt_no === NC);
    await openFromReception(rowC); await __sleep(400); // あとで本当の 033（C）を受付台帳から開く
    const kc = M._lastDraftKey, openC = M.chosho_mgmt_no;
    const staleLeft = draftMoves().has('no:' + NC);    // 033 は いま C の下書きのキー（前の引っ越しの覚えが残っているか）
    const ps = cs.map(__pidOf);
    const imp = handlePhotoFiles(__files(cs));         // C に写真を3枚
    await __rel(cs[0]);                                // 1枚目（C を開いている）
    await __open(SW === 'D' ? 'no:' + ND : 'no:' + NB); // 読み込み中に別の戸別を開く
    const seen = [];
    const look = async () => { const rd = await idbGet('no:' + ND);
      seen.push({ screen: M.chosho_mgmt_no, m: __pids(M), d: rd ? __pids(rd.model) : null }); };
    await __rel(cs[1]); await look();                  // 2枚目
    await __rel(cs[2]); await imp; await __sleep(600); await look();   // 3枚目
    const rc = await idbGet('no:' + NC), rd = await idbGet('no:' + ND);
    const res = { how1, how2, k0, k1, kc, openC, staleLeft, ps, seen,
                  c: rc ? __pids(rc.model) : null, d: rd ? __pids(rd.model) : null, dName: rd && rd.model.chosho_cust_name,
                  others: await __holders(ps, ['no:' + NC]) };
    await saveAllDrafts('unsaved'); await __sleep(800); // まとめて保存
    res.fileC = __file(NC); res.fileD = __file(ND);
    return res;
  };
  const typoPre = (r, tag) => ok(r.k0 === 'no:' + NC && r.k1 === 'no:' + ND && r.kc === 'no:' + NC && r.openC === NC && r.dName === '別の人 D',
    tag + '試験の前提: 033 と打って 034 に直した下書きは 034 のキーへ移り、あとで開いた本当の 033 は 033 のキーに置かれる → ' + J(r));

  /* ---------- ⑳ 打ち間違いで移った下書きのあとで、本当の 033 に写真を取り込む → 033 にだけ入る ----------
     C を開いても「033 → 034」の覚え（D の下書きのもの）は残る（4回目の見直し：別の下書きの覚えは捨てない）。
     033 の写真が 034 へ行かないのは、覚えを同じ下書き（印が同じ）のときだけ引くから。下の関数の確かめでも見る。 */
  await scene('⑳', async page => {
    const r = await page.evaluate(typoFlow, { NA, NB, NC, ND, SW: 'B', cs: ['#e11', '#e12', '#e13'] });
    console.log('⑳打ち間違いのあとの取り込み（途中で B）', J(r));
    typoPre(r, '⑳');
    ok(hasAll(r.c, r.ps), '★⑳取り込んだ写真が、取り込んだ戸別（033）の下書きにそろわない → ' + J(r));
    ok(lacks(r.d, r.ps) && r.others && r.others.length === 0,
       '★⑳033 に取り込んだ写真が、別のお宅（034・打ち間違いを直した下書き）の下書きに入った → ' + J(r));
    ok(hasAll(r.fileC, r.ps) && lacks(r.fileD, r.ps),
       '★⑳まとめて保存で、033 の写真が 033.json にそろわない・034.json に入った → ' + J({ fileC: r.fileC, fileD: r.fileD, ps: r.ps }));
    /* 関数の確かめ：引っ越しの覚えは、同じ下書き（印が同じ）のときだけ引く */
    const f = await page.evaluate(() => {
      draftMoves().set('no:X1', { to: 'no:X2', uid: 'uidD' });   // 別の下書き（D）が X1 から X2 へ移った覚え
      const other = draftKeyNow('no:X1', 'uidC'), same = draftKeyNow('no:X1', 'uidD');
      draftMoves().delete('no:X1');
      return { other, same };
    });
    console.log('⑳引っ越しの覚えを引く', J(f));
    ok(f.other === 'no:X1', '★⑳別の下書き（印が違う）の引っ越しの覚えを引いた（別のお宅の下書きへ写真が行く） → ' + J(f));
    ok(f.same === 'no:X2', '★⑳同じ下書きの引っ越しの覚えを引かない（移った先に写真が届かない） → ' + J(f));
  });

  /* ---------- ⑳b 同じく、途中で 034 の戸別を開いた → 034 の画面にも下書きにも 033 の写真が出ない ----------
     下書きをキー K に書いたとき、K からの引っ越しの覚えは「その下書き自身のもの」だけ捨てる（移って戻った＝K にいる）。
     別の下書きの覚えは残す（捨てると、その下書きの取り込み中の写真が迷子になる＝㉔）。関数の確かめで両方を見る。 */
  await scene('⑳b', async page => {
    const r = await page.evaluate(typoFlow, { NA, NB, NC, ND, SW: 'D', cs: ['#e21', '#e22', '#e23'] });
    console.log('⑳b打ち間違いのあとの取り込み（途中で 034）', J(r));
    typoPre(r, '⑳b');
    ok(r.seen && r.seen.length === 2 && r.seen.every(x => x.screen === ND), '⑳b試験の前提: 写真が届くとき、画面は 034 → ' + J(r.seen));
    ok(r.seen && r.seen.length === 2 && r.seen.every(x => lacks(x.m, r.ps) && lacks(x.d, r.ps)),
       '★⑳b033 に取り込んだ写真が、開いている 034（別のお宅）の画面・下書きに出た → ' + J(r.seen));
    ok(hasAll(r.c, r.ps) && lacks(r.d, r.ps) && r.others && r.others.length === 0,
       '★⑳b取り込んだ写真が、033 の下書きにそろわない・ほかの下書きに入った → ' + J(r));
    ok(hasAll(r.fileC, r.ps) && lacks(r.fileD, r.ps),
       '★⑳bまとめて保存で、033 の写真が 033.json にそろわない・034.json に入った → ' + J({ fileC: r.fileC, fileD: r.fileD, ps: r.ps }));
    ok(r.staleLeft === true, '⑳b試験の前提: 「033 → 034」の覚え（D の下書きのもの）は、C を 033 に書いても残る → ' + J(r));
    /* 関数の確かめ：下書きをキー K に書いたとき、K からの引っ越しの覚えは、その下書き自身のものだけ捨てる */
    const f = await page.evaluate(async () => {
      const K = 'no:2612MKM088';
      draftMoves().set(K, { to: 'no:2612MKM089', uid: 'uidOld' });   // 前に別の下書きが K から移った覚え
      clearTimeout(_persistTimer); await persistDraft();
      M = freshModel(); ensureModelShape(M); render();
      M.chosho_mgmt_no = '2612MKM088'; M.chosho_cust_name = '新しい人'; M._touched = true;
      await persistDraft();                              // 新しい下書きを K に書く
      const wrote = M._lastDraftKey, otherLeft = draftMoves().has(K);
      draftMoves().set(K, { to: 'no:2612MKM089', uid: M._uid });      // この下書きが K から移って、また K に戻ってきた覚え
      M.chosho_note = '戻ってきた'; await persistDraft();
      return { wrote, otherLeft, ownLeft: draftMoves().has(K) };
    });
    console.log('⑳b書いたキーの引っ越しの覚え', J(f));
    ok(f.wrote === 'no:2612MKM088', '⑳b試験の前提: 新しい下書きは番号のキーに書かれる → ' + J(f));
    ok(f.otherLeft === true, '★⑳b別の下書きの引っ越しの覚えまで捨てた（その下書きの取り込み中の写真が迷子になる） → ' + J(f));
    ok(f.ownLeft === false, '★⑳b下書きを書いたキーの、自分の前の引っ越しの覚えが残っている（移った先を引き続け、写真が届かない） → ' + J(f));
  });

  /* ---------- ㉑ 測定値のCSVの取り込みで、そのキーの下書きが別の下書きになっていた → 置き換えない ----------
     CSV の取り込み（handleMeasCsv）は、読み終えたとき読込元の戸別が画面に無ければ persistModel(読込元) で書く（写真を足す道ではない）。 */
  await scene('㉑', async page => {
    const csv = 'チャンネル,LEVEL(dBuV),MER(dB),BER\r\n14,61.0,30.1,0\r\n18,60.0,29.0,0\r\n';
    /* その1：⑳と同じ打ち間違い（033 → 034）のあとで、本当の 033 に CSV を取り込み、読み終える前に B へ */
    const e = await page.evaluate(async ({ NB, NC, ND, csv }) => {
      await __state();
      const L = __ledger(); L.rows.push({ mgmt_no: NC, name: '工藤 C', addr: '三沢市C町3', date: '2026-10-22' });
      receptionSaveRows(L);
      clearTimeout(_persistTimer); await persistDraft();
      M = freshModel(); ensureModelShape(M); render();
      __typeFld('chosho_mgmt_no', NC); await __sleep(700);   // 033 と打ち間違えた
      __typeFld('chosho_mgmt_no', ND); await __sleep(700);   // 034 に直した
      __typeFld('chosho_cust_name', '別の人 D'); __typeFld('chosho_note', 'Dの現場メモ'); await __sleep(700);
      M.chosho_photos.push(__ph('d1', '#dd0')); saveDraft(); await __sleep(700);
      const rowC = getReceptionRows().find(x => x.mgmt_no === NC);
      await openFromReception(rowC); await __sleep(400); // 本当の 033（C）を受付台帳から開く
      let rel; const gate = new Promise(res => rel = res);
      const orig = readFileAsArrayBuffer;
      readFileAsArrayBuffer = async f => { await gate; return orig(f); };
      const p = handleMeasCsv(new File([csv], 'm.csv', { type: 'text/csv' }), 'antenna');
      await __sleep(100);
      await __open('no:' + NB);                          // CSV を読んでいるあいだに B へ
      rel(); await p; await __sleep(500);                // 読み終えた
      readFileAsArrayBuffer = orig;
      const rc = await idbGet('no:' + NC), rd = await idbGet('no:' + ND);
      const meas = m => (((m || {}).measurements || {}).antenna || [])[0] || null;
      return { c: rc && { mgmt: rc.model.chosho_mgmt_no, name: rc.model.chosho_cust_name, meas: meas(rc.model) },
               d: rd && { mgmt: rd.model.chosho_mgmt_no, recMgmt: rd.mgmt, name: rd.model.chosho_cust_name, note: rd.model.chosho_note,
                          photos: __pids(rd.model), meas: meas(rd.model) } };
    }, { NB, NC, ND, csv });
    console.log('㉑その1 打ち間違いのあとの CSV', J(e));
    ok(e.c && e.c.mgmt === NC && e.c.meas && String(e.c.meas.db) === '61',
       '★㉑CSV の値が、読み込んだ戸別（033）の下書きに入らない → ' + J(e.c));
    ok(e.d && e.d.mgmt === ND && e.d.recMgmt === ND && e.d.name === '別の人 D' && e.d.note === 'Dの現場メモ' && e.d.photos === 'd1'
       && !(e.d.meas && e.d.meas.db),
       '★㉑CSV の取り込みで、別のお宅（034）の下書きが 033 の戸別で置き換わった → ' + J(e.d));
    /* その2：A を開いて CSV を読み、読み終える前に B へ。そのあいだに一覧で A の下書きを消し、
       新しい戸別に同じ番号で別のお宅（X：名前・備考・写真）を入れた（A のキーの下書きは、印の違う X になった） */
    const r = await page.evaluate(async ({ NA, NB, csv }) => {
      let rel; const gate = new Promise(res => rel = res);
      const orig = readFileAsArrayBuffer;
      readFileAsArrayBuffer = async f => { await gate; return orig(f); };
      await __open('no:' + NA);                          // A を開いて、測定値の CSV を読む
      const uidA = M._uid;
      const p = handleMeasCsv(new File([csv], 'm.csv', { type: 'text/csv' }), 'antenna');
      await __sleep(100);
      await __open('no:' + NB);                          // 読んでいるあいだに B へ
      await draftsFlushAndStop(); await forgetDrafts(await draftKeysOfNo(NA), null);   // 一覧で A の下書きを消した
      M = freshModel(); ensureModelShape(M); render();   // 新しい戸別に、同じ番号で別のお宅を入れた
      __typeFld('chosho_mgmt_no', NA); await __sleep(700);
      __typeFld('chosho_cust_name', '別の人 X'); __typeFld('chosho_note', 'Xの現場メモ'); await __sleep(700);
      M.chosho_photos.push(__ph('x1', '#880')); saveDraft(); await __sleep(700);
      const kx = M._lastDraftKey, uidX = M._uid;
      await __open('no:' + NB);
      __catchToasts(); const t0 = __toasts.length;       // ここから出た知らせを見る
      rel(); await p; await __sleep(500);                // CSV を読み終えた（読込元は消す前の A）
      readFileAsArrayBuffer = orig;
      const said = __toasts.slice(t0);
      const meas = m => (((m || {}).measurements || {}).antenna || [])[0] || null;
      const rx = await idbGet('no:' + NA);
      const tmps = ((await idbGetAll()) || []).filter(x => x && x.model && /^tmp:/.test(x.key || ''))
        .map(x => ({ key: x.key, mgmt: x.model.chosho_mgmt_no, name: x.model.chosho_cust_name, photos: __pids(x.model), meas: meas(x.model) }));
      await openDraftModal(); await __sleep(200);        // 下書き一覧に出るか
      const listed = Array.from(document.querySelectorAll('#draft-list [data-draftopen]')).map(el => el.getAttribute('data-draftopen'));
      try{ closeDraftModal(); }catch(_){}
      return { kx, uidA, uidX, x: rx && { mgmt: rx.model.chosho_mgmt_no, name: rx.model.chosho_cust_name, note: rx.model.chosho_note,
                                          photos: __pids(rx.model), meas: meas(rx.model) },
               tmps, listed: Array.from(new Set(listed)), said };
    }, { NA, NB, csv });
    console.log('㉑その2 消して同じ番号で入れ直したあとの CSV', J(r));
    ok(r.kx === 'no:' + NA, '㉑試験の前提: 消したあとに入れた別のお宅（X）の下書きは、A の番号のキーに置かれる → ' + J(r));
    ok(r.x && r.x.name === '別の人 X' && r.x.note === 'Xの現場メモ' && r.x.photos === 'x1' && !(r.x.meas && r.x.meas.db),
       '★㉑CSV の取り込みで、そのキーの別の下書き（X：印が違う）が置き換わった → ' + J(r.x));
    const t = (r.tmps || []).filter(x => x.mgmt === NA && x.name === '工藤 A');
    ok(t.length === 1 && t[0].meas && String(t[0].meas.db) === '61' && t[0].photos === 'a1',
       '★㉑CSV を読み込んだ戸別（A：値と写真）が、一時のキーに残らない（または X の写真が混ざった） → ' + J(r.tmps));
    ok(t.length === 1 && (r.listed || []).indexOf(t[0].key) >= 0, '★㉑一時のキーに残した戸別が、下書き一覧に出ない → ' + J(r.listed));
    ok((r.said || []).some(s => s.indexOf(NA) >= 0 && /別の下書き/.test(s)),
       '★㉑そのキーの下書きが別のものに替わっていたのに、別の下書き（一時のキー）に入れたことを知らせない → ' + J(r.said));
  });

  /* ---------- ㉒ 写真が下書きに書かれている最中に、その戸別を開き直した → 書いた写真が消えない ----------
     2枚目を A の下書きへ書くところ（persistModel の idbPut）を止めておき、そのあいだに A を開き直す
     （画面の写しは、2枚目がまだ無い下書きから読む）。止めを外して書き終え、3枚目を届かせ、B を開いて画面の A を控える。 */
  await scene('㉒', async page => {
    const r = await page.evaluate(async ({ NA, NB }) => {
      __gatedImport();
      await __state();
      const cs = ['#7a1', '#7a2', '#7a3'], ps = cs.map(__pidOf);
      await __open('no:' + NA);                          // A を開く（A1）
      const imp = handlePhotoFiles(__files(cs));
      await __rel(cs[0]);                                // 1枚目（A1 を開いている）
      await __open('no:' + NB);                          // B へ（A1 は1枚目ごと下書きへ）
      const op = idbPut; let hold = null, hit = 0;
      idbPut = async function(rec){                      // 2枚目を A の下書きへ書くところで止める
        if(!hit && rec && rec.key === 'no:' + NA && __pids(rec.model).split(',').indexOf(ps[1]) >= 0){
          hit++; await new Promise(res => { hold = res; });
        }
        return op.apply(this, arguments);
      };
      await __rel(cs[1]);                                // 2枚目を読み終えた（A の下書きへ書いている最中）
      for(let i = 0; i < 50 && !hold; i++) await __sleep(20);
      await __open('no:' + NA);                          // ちょうどそのとき A を一覧から開き直した（A2）
      const mid = __pids(M), midRec = __pids((await idbGet('no:' + NA)).model);
      idbPut = op;
      if(hold) hold();                                   // 2枚目が下書きに書かれる
      await __sleep(600);
      const afterPut = { m: __pids(M), rec: __pids((await idbGet('no:' + NA)).model) };
      await __rel(cs[2]); await imp; await __sleep(600); // 3枚目は開いている A2 に届く
      const m = __pids(M);
      await __open('no:' + NB);                          // A を離れる（画面の A2 が下書きに控えられる）
      return { hit, ps, mid, midRec, afterPut, m, final: __pids((await idbGet('no:' + NA)).model) };
    }, { NA, NB });
    console.log('㉒書いている最中に開き直した', J(r));
    ok(r.hit === 1 && hasAll(r.mid, ['a1', r.ps[0]]) && lacks(r.mid, [r.ps[1]]) && lacks(r.midRec, [r.ps[1]]),
       '㉒試験の前提: 2枚目を下書きへ書いている最中に A を開き直し、画面の写しには2枚目がまだ無い → ' + J(r));
    ok(hasAll(r.afterPut.rec, [r.ps[1]]), '㉒試験の前提: 止めを外すと、2枚目が下書きに書かれる → ' + J(r.afterPut));
    ok(hasAll(r.m, ['a1'].concat(r.ps)), '★㉒書いている最中に開き直した画面に、書いた写真（2枚目）が入らない → ' + J(r));
    ok(hasAll(r.final, ['a1'].concat(r.ps)),
       '★㉒書いている最中に開き直した画面を控えると、書いた写真（2枚目）が下書きから消える → ' + J(r));
  });

  /* ---------- ㉓ 写真の取り込みの途中で、同じ戸別の PCのファイルを「📂 読込」で読んだ → 残りの写真も A の下書き1つにそろう ----------
     読み込みは画面の戸別を作り直す。下書きを見分ける印を引き継がないと、自動の控えで新しい印が付き、
     残りの写真は「別の下書きになった」とみなされて一時のキーの下書きへ行く（まとめて保存から漏れ、A は保存済に見える）。 */
  await scene('㉓', async page => {
    const r = await page.evaluate(async ({ NA }) => {
      __gatedImport(); __catchToasts();
      await __state();                                   // A（写真 a1）・B の下書き（画面は B）
      await __open('no:' + NA);                          // A を開く
      const uidA = M._uid, m0 = M;
      const pm = freshModel(); ensureModelShape(pm);     // A の PCのファイル（PCの写真 pc1）
      pm.chosho_mgmt_no = NA; pm.chosho_cust_name = '工藤 A'; pm.chosho_photos = [__ph('pc1', '#777')];
      const f = new File([JSON.stringify(buildStateOf(pm))], NA + '.json', { type: 'application/json' });
      const cs = ['#a71', '#a72', '#a73'], ps = cs.map(__pidOf);
      const imp = handlePhotoFiles(__files(cs));         // ギャラリーから写真を3枚選んだ
      await __rel(cs[0]);                                // 1枚目
      const inp = document.getElementById('import-file');   // 上の「📂 読込」で A の PCのファイルを選ぶ
      Object.defineProperty(inp, 'files', { value: [f], configurable: true });
      inp.dispatchEvent(new Event('change'));
      for(let i = 0; i < 150 && (M === m0 || _openBusy); i++) await __sleep(20);
      for(let i = 0; i < 150; i++){                      // 読み込んだ戸別の自動の控えが走る（下書きに pc1 が入るまで待つ）
        const rec = await idbGet('no:' + NA);
        if(rec && __pids(rec.model).split(',').indexOf('pc1') >= 0) break;
        await __sleep(20);
      }
      await __sleep(200);
      const loaded = { remade: M !== m0, key: M._lastDraftKey, uidSame: M._uid === uidA, m: __pids(M) };
      await __rel(cs[1]); await __rel(cs[2]); await imp; await __sleep(800);   // 2枚目・3枚目
      const all = ['a1', 'pc1'].concat(ps);
      const res = { ps, loaded, open: M.chosho_mgmt_no, m: __pids(M), drafts: await __draftsOfNo(NA),
                    others: await __holders(ps, ['no:' + NA]), before: await __info(NA) };
      await saveAllDrafts('unsaved'); await __sleep(1000); // まとめて保存
      res.fileA = __file(NA); res.after = await __info(NA); res.draftsAfter = await __draftsOfNo(NA);
      res.said = __toasts.filter(s => /別の下書き/.test(s));
      return Object.assign(res, { all });
    }, { NA });
    console.log('㉓取り込みの途中で同じ戸別のファイルを読んだ', J(r));
    ok(r.loaded && r.loaded.remade && r.loaded.key === 'no:' + NA && hasAll(r.loaded.m, ['a1', 'pc1', r.ps[0]]),
       '㉓試験の前提: 取り込みの途中で A の PCのファイルを読み、画面に a1・pc1・1枚目が出る（A の下書きのキーのまま） → ' + J(r.loaded));
    ok(r.open === NA && hasAll(r.m, r.all), '★㉓ファイルを読んだあとに届いた写真が、開いている A の画面に入らない → ' + J(r));
    ok(r.drafts && r.drafts.length === 1 && r.drafts[0].indexOf('no:' + NA + '=') === 0 && hasAll(r.drafts[0].split('=')[1], r.all)
       && r.others && r.others.length === 0,
       '★㉓取り込んだ写真が A の下書き1つにそろわない（一時のキーに同じ戸別の下書きをもう1つ作った） → ' + J({ drafts: r.drafts, others: r.others }));
    ok(r.before && r.before.h !== 'ok', '㉓試験の前提: まとめて保存の前は、A は保存済ではない → ' + J(r.before));
    ok(hasAll(r.fileA, r.all), '★㉓まとめて保存で、取り込んだ写真が A のファイルにそろわない → ' + J({ fileA: r.fileA, all: r.all }));
    ok(r.after && r.after.h === 'ok' && hasAll(r.fileA, r.all),
       '★㉓写真がファイルにそろっていないのに A を「保存済」にした・そろったのに保存済にならない → ' + J({ after: r.after, fileA: r.fileA }));
    ok(r.said && r.said.length === 0, '★㉓同じ下書きなのに「別の下書きに入れました」と出た → ' + J(r.said));
  });

  /* ---------- ㉔ 番号を打ち間違えた新しい戸別（033→034 に直した）の取り込みの途中で、本当の 033 を開いた → 写真は 034 にそろう ----------
     番号を直したとき「033 から 034 へ移った」と覚える。本当の 033（C）の下書きを 033 のキーに書くとき、その覚え（D のもの）まで
     捨てると、残りの写真は行き先を引けず、C の下書きを避けて一時のキーへ行く（D の下書きは1枚だけで保存済に見える）。 */
  await scene('㉔', async page => {
    const r = await page.evaluate(async ({ NB, NC, ND }) => {
      __gatedImport(); __catchToasts();
      await __state();                                   // A・B の下書き（画面は B）
      const L = __ledger();
      L.rows.push({ mgmt_no: NC, name: '工藤 C', addr: '三沢市C町3', date: '2026-10-22' });
      L.rows.push({ mgmt_no: ND, name: '工藤 D', addr: '三沢市D町4', date: '2026-10-23' });
      receptionSaveRows(L);
      const m0 = M;
      document.getElementById('btn-new').click();        // 「新規」（確かめの窓は OK）
      for(let i = 0; i < 150 && M === m0; i++) await __sleep(20);
      await __sleep(200);
      const how1 = __typeFld('chosho_mgmt_no', NC); __typeFld('chosho_cust_name', '工藤 D'); await __sleep(700);   // D のつもりで 033 と打ち間違えた
      const k0 = M._lastDraftKey, uidD = M._uid;
      const cs = ['#d41', '#d42', '#d43', '#d44'], ps = cs.map(__pidOf);
      const imp = handlePhotoFiles(__files(cs));         // 写真を4枚
      await __rel(cs[0]);                                // 1枚目（D を開いている）
      await __open('no:' + NB);                          // 読み込み中に B を見に行く
      await openDraftModal(); await __sleep(300);        // 下書き一覧から 033（D）を開き直す
      const ob = document.querySelector('#draft-list .d-open[data-draftopen="no:' + NC + '"]');
      if(ob) ob.click();
      for(let i = 0; i < 150 && M.chosho_mgmt_no !== NC; i++) await __sleep(20);
      await __sleep(200);
      const reopen = { btn: !!ob, no: M.chosho_mgmt_no, name: M.chosho_cust_name, uidSame: M._uid === uidD };
      const how2 = __typeFld('chosho_mgmt_no', ND); await __sleep(700);   // 番号の間違いに気づいて 034 に直す
      const k1 = M._lastDraftKey;
      openReceptionModal(); await __sleep(500);          // 本当の 033（工藤 C）を受付台帳から開く
      let rb = null;
      document.querySelectorAll('#reception-modal .draft').forEach(el => {
        if(!rb && (el.textContent || '').indexOf(NC) >= 0) rb = el.querySelector('.d-open[data-recopen]'); });
      if(rb) rb.click(); else await openFromReception(getReceptionRows().find(x => x.mgmt_no === NC));
      for(let i = 0; i < 150 && !(M.chosho_mgmt_no === NC && M._lastDraftKey === 'no:' + NC && M._uid); i++) await __sleep(20);
      await __sleep(600);
      const kc = M._lastDraftKey, openC = M.chosho_mgmt_no, uidC = M._uid;
      const cOf = rec => rec && { no: rec.model.chosho_mgmt_no, name: rec.model.chosho_cust_name, photos: __pids(rec.model), uid: rec.model._uid === uidC };
      const c0 = cOf(await idbGet('no:' + NC));
      await __rel(cs[1]); await __rel(cs[2]); await __rel(cs[3]); await imp; await __sleep(800);   // 2〜4枚目
      const rd = await idbGet('no:' + ND);
      const res = { how1, how2, k0, k1, kc, openC, reopen, recBtn: !!rb, uidDiff: !!uidC && uidC !== uidD, ps, screen: M.chosho_mgmt_no + ' ' + __pids(M),
                    c0, c: cOf(await idbGet('no:' + NC)),
                    d: rd && { no: rd.model.chosho_mgmt_no, name: rd.model.chosho_cust_name, photos: __pids(rd.model) },
                    others: await __holders(ps, ['no:' + ND]), dupC: await __draftsOfNo(NC) };
      await saveAllDrafts('unsaved'); await __sleep(1000); // まとめて保存
      res.fileD = __file(ND); res.fileC = __file(NC); res.infoD = await __info(ND);
      res.said = __toasts.filter(s => /別の下書き/.test(s));
      return res;
    }, { NB, NC, ND });
    console.log('㉔番号を直した戸別の取り込みの途中で本当の 033 を開いた', J(r));
    ok(r.k0 === 'no:' + NC && r.reopen && r.reopen.btn && r.reopen.no === NC && r.reopen.uidSame && r.k1 === 'no:' + ND
       && r.kc === 'no:' + NC && r.openC === NC && r.uidDiff && r.c0 && r.c0.name === '工藤 C' && lacks(r.c0.photos, r.ps),
       '㉔試験の前提: 033 と打った新しい戸別を一覧から開き直して 034 に直し、本当の 033（C・別の下書き）を受付台帳から開いた → ' + J(r));
    ok(r.d && r.d.no === ND && r.d.name === '工藤 D' && hasAll(r.d.photos, r.ps),
       '★㉔番号を直した D の下書き（034）に、取り込んだ写真4枚がそろわない → ' + J(r.d));
    ok(r.others && r.others.length === 0 && r.dupC && r.dupC.length === 1,
       '★㉔取り込んだ写真が、ほかの下書き（033 の一時のキーの下書き）に入った → ' + J({ others: r.others, dupC: r.dupC }));
    ok(r.c && r.c0 && r.c.no === NC && r.c.name === '工藤 C' && r.c.photos === r.c0.photos && r.c.uid && lacks(r.c.photos, r.ps),
       '★㉔本当の 033（C）の下書きが変わった → ' + J({ c0: r.c0, c: r.c }));
    ok(hasAll(r.fileD, r.ps) && r.infoD && r.infoD.h === 'ok' && (r.fileC === null || lacks(r.fileC, r.ps)),
       '★㉔まとめて保存で、D の写真4枚が 2612MKM034.json にそろわない（または 033 のファイルに入った） → ' + J({ fileD: r.fileD, fileC: r.fileC, infoD: r.infoD }));
    ok(r.said && r.said.length === 0, '★㉔同じ下書き（番号を直しただけ）なのに「別の下書きに入れました」と出た → ' + J(r.said));
  });

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版178（現場入力）');
})();
