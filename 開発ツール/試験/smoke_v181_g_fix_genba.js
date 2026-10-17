/* 版181（現場入力・組 g-fix）
   見直しで見つかった現場入力の不具合の直しを、場面ごとに確かめる（直す前の中身では赤・直したあとは緑）。
   道具（ANDROID_INIT・SETUP）は smoke_v176_genba.js と同じもの。写真の取り込みを1枚ずつ届かせる道具は smoke_v178_genba.js と同じ形。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
   ── 📮 事務所に預ける（版176 の見直し）──
     ① 同じ管理番号の下書きが2つ（番号が重なって一時のキーに逃げた）→ 履歴で全選択 → 📮 → 共有
        → 2つの預けの名前も、預けた時刻（_side.at）も別々（事務所が2つ目を「もうまとめた」として片付けない）。名前の日時と _side.at は同じ時刻
     ②a Android（PC版サイトのタブレット）・覚えているフォルダは端末の中の「その2」。見るだけ → 保存 → 📮 → 📁「その2」に置く
        → 題で「事務所に預けました」と言い切らない（「置きました（まだ届いていないかもしれません）」・⚠）。置いた預けはそのまま
     ②b 続けて「📤 共有でも渡す」→ 共有の画面を閉じた → 元の窓（⚠ と「📤 共有でも渡す」）が出直す（黙って「預け済」のまま終わらない）
     ②c 物件が違うフォルダ（その2）への いつもの保存 → 預けの名前で置いた知らせが ⚠
     ②d PC の「リスト」（Dropbox のフォルダ）に置いたとき → 今までどおり「📮 事務所に預けました」（⚠ にしない）
     ③a 共有できない・フォルダも無い端末で、履歴から2件を 📮 → ⬇ → 「ブラウザが途中で止めることがあります」と言う（1件のときは言わない）
     ③b 共有で渡す道・共有できない端末の まとめて保存（預けだけを2件ダウンロード）→ 同じく言う
     ④a Android・フォルダを覚えていない・見るだけ → 保存 → 📁（フォルダを選びます）→ 画面を閉じた → 黙らず 📮／📂 の窓を出す
     ④b 見るだけの帯の「📁 PCのフォルダから読み込む」→ 閉じた（Android）→ 同じ窓を出す
     ④c PC で帯の 📁 を自分で閉じたとき → 今までどおり何も出さない
   ── 写真の取り込みと、下書きを読んで直して書くところの順番（版178 の見直し）──
     ⑤a A で写真を3枚取り込み中に、履歴から B を開く。開く途中（A を控えたあと・B を読み始めた瞬間）に2枚目が読み終わる → 2枚目が A の下書きに残る
     ⑤b 同じく、受付台帳から B を開く ⑤c ＋新規 で新しい戸別にする
     ⑤r A で3枚を取り込み中に B を開き、A を開き直す（開き直した写し A'）。A' から履歴で B へ移る途中（B を読み始めた瞬間）に2枚目が読み終わる
        → 2枚目が A の下書きに残る（開き直した写しの枝でも、下書きにすぐ足す）
     ⑤d 切り替える直前に A で打った備考・消した写真・撮った写真（まだ控えていない）を、取り込みの控えが戻さない・落とさない
     ⑥a まとめて保存で A の「保存済」の印を付けるために下書きを読むのと同時に、A の写真が下書きに届く → 写真が下書きに残る・「保存済」にしない
     ⑥b 受付台帳の取り込み（下書きへの入れ直し）と同時に届く → 写真が残る・名前も直る
     ⑥c 全部保存し直す（台帳の入れ直し）と同時に届く → 写真が残る
     ⑥d 📥 他の端末の保存を読み込む（印の引き継ぎ）と同時に届く → 写真が残る・印も付く
     ⑥e 履歴の 📮（開いていない戸別に預けた印を付ける）と同時に届く → 写真が残る・「預け済」にしない
     ⑦ 別の下書きに入れた知らせは、画面にある「履歴」と言う（画面に無い「下書き一覧」と言わない）
   ── 追加で直したもの（事実集め・その確かめで本当と分かったこと）──
     ⑧ 受付台帳で下見済の印が付いているだけで、この端末では開いただけの戸別 → 「まだ保存していない」に数えない（まとめて保存の N・一覧の印）
     ⑨a 開いただけの戸別に 📥 で他の端末の印を引き継いだ → 「入力あり」にしない・まとめて保存で書かない（ほかの端末のファイルを置き換えない）
     ⑨b 開いている（開いただけの）戸別に 📥 → 同じく「入力あり」にしない
     ⑩a 控えの無い戸別（台帳から開いただけ・PCのファイルを読んでいない）に PCのファイルがあり、中身が違う → まとめて保存は書かずに残し、1件ずつの保存で聞くと言う
     ⑩b 同じく、消える PCの値が無い（PCのファイルの電話＝台帳＝この端末だけが直した・PCのファイルの住所は空）→ 今までどおり読み合わせて書く（写真は和集合）
     ⑪ 地図の画面で現場用ファイル（受付台帳）を入れた → 台帳で直った保存済みの戸別が「保存後に変更」に戻る（まとめて保存の対象に入る）
     ⑫ 履歴の ✏️ は直した回数で決める（保存のあと何も直さずに別の戸別を開いても ✏️ にしない。直したら ✏️）
     ⑬a ほかの端末も保存している戸別を、フォルダを覚えていない PC で1件保存 → 保存先を選ぶ画面を開かない（選んだファイルは空にされて写真が消える）・窓は本当のことを言う。
         確かめの窓を通らずに書く道へ来ても開かない（2つ目の歯止め）
     ⑬b 同じ窓の「📁 保存先のフォルダを選んで書く」→ そのファイルを読み合わせて書く（ほかの端末の写真も残る）
     ⑭a 控えあり。PC とこの端末の両方で電話・ケーブル長を直した → まとめて保存の知らせが「この端末の内容にした」欄を言う（「消えていません」と言わない）
     ⑭b 控えあり。PC があとで配線の指定・図面の注記を直した・消した（この端末は触っていない）→ PC の直し・消したものが残る。この端末で足したものも残る
     ⑭c ⑭a と同じで1件の保存 → 結果の窓が「両方で直していた … は、この端末の内容にしました」と言う
     ⑮ 保存済みをもう一度保存するときの確かめ（フォルダの道）が「ファイルがもう1つ増えます」と言わない・保存バーの 📁 が「上書きします」と言わない
   使い方: node smoke_v181_g_fix_genba.js [現場入力 index.html の file:// URL]　（SCENE=①,⑤a または ONLY=… で場面を絞れる） */
/* ---- ここから smoke_v176_genba.js と同じ道具（写し） ---- */
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

/* 物件名（PCの受付台帳の「物件」）。その１ がいまの工事 */
const P1 = '令和８年度戸別受信設備設置工事（その１）';
/* 預けの名前（2612MKM013_現場預け_20261014-091812.json） */
const SIDE13 = /^2612MKM013_現場預け_\d{8}-\d{6}\.json$/;
const SIDE14 = /^2612MKM014_現場預け_\d{8}-\d{6}\.json$/;
/* 端末の名前（userAgent）。既定＝PC版のサイトを開いた Android タブレット（10インチくらいより大きい Chrome の既定）。
   UA_PC は Windows のPC（入れ物も指で触れない＝maxTouchPoints 0） */
const UA_TAB = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

/* Android のタブレット：フォルダを選ぶ窓は出るが閉じる（Dropbox が出ない）。保存先を選ぶ窓は無い。共有はできる。
   cfg.savePicker … 保存先を選ぶ窓がある端末（閉じる）／cfg.noShare … 共有できない端末 */
const ANDROID_INIT = (cfg) => {
  cfg = cfg || {};
  window.__pickerCalls = 0; window.__savePickerCalls = 0; window.__shared = 0; window.__sharedNames = []; window.__sharedTexts = [];
  window.__shareCalls = 0; window.__dl = [];
  window.__pickerMode = 'abort'; window.__pickerRet = null; window.__shareMode = 'ok'; window.__dlHref = [];
  if(cfg.ua === 'iphone'){
    try{ delete window.showDirectoryPicker; }catch(_){}
    if(window.showDirectoryPicker) window.showDirectoryPicker = undefined;
  } else
  window.showDirectoryPicker = async function(){
    window.__pickerCalls++;
    if(window.__pickerMode === 'return') return window.__pickerRet;
    if(window.__pickerMode === 'error'){ const e = new Error('picker failed'); e.name = 'SecurityError'; throw e; }
    throw new DOMException('The user aborted a request.', 'AbortError');
  };
  if(cfg.savePicker){
    window.showSaveFilePicker = async function(){ window.__savePickerCalls++; if(window.__savePickerRet) return window.__savePickerRet; throw new DOMException('The user aborted a request.', 'AbortError'); };
  } else {
    try{ delete window.showSaveFilePicker; }catch(_){}
    if(window.showSaveFilePicker) window.showSaveFilePicker = undefined;
  }
  if(!cfg.noShare){
    try{
      navigator.canShare = () => true;
      navigator.share = async d => {
        window.__shareCalls++;
        if(window.__shareMode === 'abort') throw new DOMException('cancel', 'AbortError');
        if(window.__shareMode === 'fail') throw new DOMException('not allowed', 'NotAllowedError');
        window.__shared++;
        for(const f of ((d && d.files) || [])){ window.__sharedNames.push(f.name); window.__sharedTexts.push(await f.text()); }
      };
    }catch(_){}
  } else {
    try{ navigator.canShare = undefined; navigator.share = undefined; }catch(_){}
  }
  const oc = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){ if(this.download){ window.__dl.push(this.download); window.__dlHref.push(this.href); return; } return oc.call(this); };
};

/* 画面の中に作る道具。smoke_v172_genba.js / smoke_v175_genba.js の __mkdir と同じ形に、壊し方を足したもの。
     __unread[名前]＝読めない／__failWrite＝書けない／__corrupt＝書くと中身が変わる（読み返しが合わない）／
     __ghost[名前]＝名前を聞くと「無い」と言うのに、作ると中身が入っている（同期中のファイルなど）
   ★窓（uiAlert / uiConfirm）は「OK」で閉じ、出た文を __said に控える★ __cancelIf に合う確かめだけ「キャンセル」。
   ★選ぶ窓（uiPickName ＝ #pick-modal）は __plan の順に答える★（押す字の前が合えばよい。無ければ「やめる」）
     '@measure' … 押さずに、はみ出しを測ってから閉じる。出た窓の題・説明・並びは __picks に控える。 */
const SETUP = `
window.__sleep = ms => new Promise(r => setTimeout(r, ms));
window.__T = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r('__timeout'), ms || 5000))]);
window.__mkdir = function(name, files, subs){
  const fileH = n => ({ kind:'file', name:n,
    getFile: async () => {
      if(dir.__unread && dir.__unread[n]){ const e = new Error('busy'); e.name = 'NotReadableError'; throw e; }
      return { name:n, size:(dir.__files[n]||'').length, lastModified: Date.now(),
        text: async () => dir.__files[n],
        arrayBuffer: async () => new TextEncoder().encode(dir.__files[n]).buffer }; },
    createWritable: async () => {
      if(dir.__failWrite){ const e = new Error('write failed'); e.name = 'InvalidStateError'; throw e; }
      return { write: async b => { const t = (typeof b === 'string') ? b : await b.text();
                                   dir.__files[n] = dir.__corrupt ? '{"chosho_mgmt_no":"XXXX"}' : t; dir.__wrote.push(n); },
               close: async () => {} }; } });
  const dir = {
    kind: 'directory', name: name, __files: files || {}, __subs: subs || {}, __perm: 'granted', __req: 'granted',
    __listed: 0, __wrote: [], __asked: 0, __ghost: {},
    queryPermission: async () => dir.__perm,
    requestPermission: async () => {
      dir.__asked++;
      if(dir.__req === 'denied') return 'denied';
      dir.__perm = 'granted'; return 'granted'; },
    getFileHandle: async (n, opt) => {
      if(dir.__ghost[n] && !(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
      if(!(n in dir.__files)){
        if(!(opt && opt.create)) { const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        dir.__files[n] = '';
      }
      return fileH(n);
    },
    getDirectoryHandle: async (n) => {
      if(!(n in dir.__subs)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
      return __copyDir(dir.__subs[n]);
    },
    isSameEntry: async o => !!o && o.__self === dir,
    entries: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => [n, fileH(n)])
        .concat(Object.keys(dir.__subs).map(n => [n, __copyDir(dir.__subs[n])]));
      let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } };
    } }; },
    values: () => { dir.__listed++; return { [Symbol.asyncIterator](){
      const rows = Object.keys(dir.__files).map(n => fileH(n))
        .concat(Object.keys(dir.__subs).map(n => __copyDir(dir.__subs[n])));
      let i = 0;
      return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value:undefined, done:true } };
    } }; }
  };
  dir.__self = dir;
  return dir;
};
window.__copyDir = d => (d && d.__self) ? Object.create(d.__self) : d;
window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6;
  const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
window.__ph = (id, c) => ({ id:id, label:id, dataUri:__png(c) });
window.__said = []; window.__cancelIf = null; window.__plan = []; window.__picks = [];
if(window.__dlgTimer) clearInterval(window.__dlgTimer);
window.__dlgTimer = setInterval(() => {
  const m = document.getElementById('ui-dialog');
  if(m && m.classList.contains('open')){
    const t = (document.getElementById('ui-dialog-msg') || {}).textContent || '';
    const cb = document.getElementById('ui-dialog-cancel');
    const isConfirm = !!(cb && cb.style.display !== 'none');
    window.__said.push((isConfirm ? '[確かめ] ' : '[知らせ] ') + t);
    const cancel = isConfirm && window.__cancelIf && window.__cancelIf.test(t);
    const b = document.getElementById(cancel ? 'ui-dialog-cancel' : 'ui-dialog-ok'); if(b) b.click();
  }
  const pm = document.getElementById('pick-modal');
  if(pm && pm.classList.contains('open') && !pm.__seen){
    pm.__seen = true;
    setTimeout(() => {
      pm.__seen = false;
      const rows = Array.from(document.querySelectorAll('#pick-list .pick-row'));
      const mains = rows.map(e => ((e.querySelector('.pick-main') || {}).textContent || '').trim());
      const subs = rows.map(e => ((e.querySelector('.pick-sub') || {}).textContent || '').trim());
      const rec = { title: (document.getElementById('pick-title') || {}).textContent || '',
                    note: (document.getElementById('pick-note') || {}).textContent || '', rows: mains, subs: subs };
      const want = window.__plan.shift();
      if(want === '@measure'){
        const s = pm.querySelector('.sheet');
        rec.measure = { sw: document.documentElement.scrollWidth, iw: window.innerWidth, sheet: s ? [s.scrollWidth, s.clientWidth] : null };
        window.__picks.push(rec);
        const c = document.getElementById('pick-close'); if(c) c.click();
        return;
      }
      window.__picks.push(rec);
      const i = (want == null) ? -1 : mains.findIndex(t => t.indexOf(want) === 0);
      rec.clicked = i >= 0 ? mains[i] : null;
      if(i >= 0) rows[i].click(); else { const c = document.getElementById('pick-close'); if(c) c.click(); }
    }, 60);
  }
}, 40);
window.__toasts = [];
if(!window.__otoast){ window.__otoast = toast; toast = m => { window.__toasts.push(String(m)); try{ window.__otoast(m); }catch(_){} }; }
/* 保存の結果の窓（saveOverlayDone）に渡ったもの。null＝結果なし（緑の「保存しました」になる） */
window.__ov = [];
if(!window.__oov){ window.__oov = saveOverlayDone; saveOverlayDone = info => { window.__ov.push(info ? { title: info.title, msg: info.msg, warn: !!info.warn, escape: info.escape || '' } : null); return window.__oov(info); }; }
window.__bar = function(){
  const sb = document.getElementById('savebar');
  const d = document.getElementById('sb-dest');
  return { dest: d ? d.textContent.replace(/\\s+/g, ' ').trim() : '', all: sb ? sb.innerText.replace(/\\s+/g, ' ').trim() : '' };
};
window.__P1 = ${JSON.stringify(P1)};
/* その１ の受付台帳。2612MKM013 は PCに 写真6・図面・完了（見るだけになる）／2612MKM014 は PCに何も無い */
window.__ledgerP1 = () => ({ type:'antenna_reception_ledger', version:5, project: __P1,
  exportedAt:'2026-10-13T00:00:00.000Z', appVersion:'175',
  rows:[ { mgmt_no:'2612MKM013', name:'工藤 一', addr:'三沢市X町1', date:'2026-08-28', status:'completed', work_done:true,
           photos:6, has_dwg:true, contractor:'A社' },
         { mgmt_no:'2612MKM014', name:'工藤 二', addr:'三沢市X町2', date:'2026-10-20', contractor:'A社' } ] });
/* PCのファイル（写真3枚。PCらしくない）と、本物のPCのファイル（写真6枚・工事完了） */
window.__pcFile = (over) => Object.assign({ chosho_mgmt_no:'2612MKM013', chosho_cust_name:'工藤 一', chosho_cust_addr:'三沢市X町1',
  chosho_date:'2026-08-28', work_type:'detached', chosho_photos:[ __ph('pc1', '#33c'), __ph('pc2', '#3c3'), __ph('pc3', '#cc3') ],
  editedAt:'2026-10-10T00:00:00.000Z' }, over || {});
window.__pcFull = () => __pcFile({ chosho_photos:[ __ph('pc1','#33c'), __ph('pc2','#3c3'), __ph('pc3','#cc3'), __ph('pc4','#c3c'), __ph('pc5','#3cc'), __ph('pc6','#666') ],
  work_done:true, chosho_status:'completed', amplifier:'amp_3u43' });
/* 2612MKM014 の PCのファイル（PCに中身の無い戸別） */
window.__pc14 = (over) => Object.assign({ chosho_mgmt_no:'2612MKM014', chosho_cust_name:'工藤 二', chosho_cust_addr:'三沢市X町2',
  chosho_date:'2026-10-20', work_type:'detached', chosho_photos:[ __ph('q1', '#a52') ], editedAt:'2026-10-10T00:00:00.000Z' }, over || {});
/* その１ の台帳を入れ、フォルダ（既定は端末の中の「その2」。親なし）を覚え、この端末で入力した下書き（写真 t1・備考）を作って台帳から開く */
window.__state = async function(o){
  o = o || {};
  receptionSaveRows(__ledgerP1());
  const d = __mkdir(o.dirName || 'その2', o.files || {}, {});
  if(o.unread) d.__unread = o.unread;
  if(!o.noDir) await saveDirSet(d, null);
  window.__D = d;
  M = freshModel(); ensureModelShape(M);
  M.chosho_mgmt_no = o.no || '2612MKM013'; M.chosho_cust_name = (o.no === '2612MKM014') ? '工藤 二' : '工藤 一'; M.chosho_note = '現場メモ';
  M.chosho_photos = [ __ph('t1', '#c33') ];
  M._touched = true; M._lastDraftKey = 'no:' + M.chosho_mgmt_no;
  await persistDraft(); await markDraftSaved();
  M.chosho_note = '現場メモ 追記'; M._rev = (M._rev | 0) + 1; await persistDraft();
  if(o.pbase) await pbaseSet(M.chosho_mgmt_no, o.pbase);
  const row = getReceptionRows().find(r => r.mgmt_no === M.chosho_mgmt_no);
  await openFromReception(row);
  await __sleep(300);
  renderSaveBar();
  return { viewOnly: !!M._viewOnly, fromCase: !!M._fromCaseFile };
};
/* fn のあいだに起きたこと（知らせ・結果の窓・書いたファイル・共有・ダウンロード・選ぶ窓）*/
window.__watch = async function(fn, ms){
  const n0 = __said.length, t0 = __toasts.length, o0 = __ov.length, w0 = (window.__D ? __D.__wrote.length : 0),
        s0 = __shared, d0 = __dl.length, p0 = __pickerCalls, k0 = __picks.length, st0 = __sharedTexts.length, sn0 = __sharedNames.length;
  let ret;
  try{ ret = await __T(Promise.resolve().then(fn), ms || 9000); }catch(e){ ret = 'THROW ' + (e && e.message); }
  for(let i = 0; i < 100 && (typeof _saving !== 'undefined' && _saving); i++) await __sleep(50);
  await __sleep(500);
  return { ret: (ret === undefined ? null : (typeof ret === 'object' ? JSON.stringify(ret).slice(0, 80) : ret)), said: __said.slice(n0), toasts: __toasts.slice(t0),
           ov: __ov.slice(o0), wrote: (window.__D ? __D.__wrote.slice(w0) : []), shared: __shared - s0, sharedNames: __sharedNames.slice(sn0),
           sharedTexts: __sharedTexts.slice(st0), dl: __dl.slice(d0), picker: __pickerCalls - p0, picks: __picks.slice(k0) };
};
window.__busy = () => (typeof _saving !== 'undefined' && _saving) || (typeof _sideBusy !== 'undefined' && _sideBusy);
window.__click = id => { const b = document.getElementById(id); if(!b) return 'NO BUTTON ' + id; b.click(); return 'clicked'; };
window.__press = async id => { __click(id); await __sleep(200); for(let i = 0; i < 160 && __busy(); i++) await __sleep(50); await __sleep(300); };
/* 📂（1つ選ぶ）でファイルを読み込む */
window.__import = async function(obj, name){
  const inp = document.getElementById('import-file');
  const dt = new DataTransfer();
  dt.items.add(new File([JSON.stringify(obj)], name || '2612MKM013.json', { type:'application/json' }));
  inp.files = dt.files;
  inp.dispatchEvent(new Event('change', { bubbles:true }));
  for(let i = 0; i < 40; i++){ await __sleep(50); if(typeof _openBusy === 'undefined' || !_openBusy) break; }
  await __sleep(400);
};
window.__pids = j => ((j && j.chosho_photos) || []).filter(p => p && p.dataUri).map(p => String(p.id)).sort().join(',');
/* 保存の途中で写真が入る（何枚も選んだ写真の取り込みの、最後の1枚）（第4回）。
   保存が下書きを書いた直後（＝渡す・書く中身を作ったあと）に、handlePhotoFiles と同じように
   画面の戸別へ足して（push）、photoKeepInto(M) で下書きへ控える。1回だけ。
   ★下書きにもすぐ確定する★ 本当は、保存先を選ぶ画面・共有の画面で選んでいる数秒のあいだに確定する（試験の窓はすぐ閉じるので、ここで確定する） */
window.__lateArm = function(id){
  const op = persistDraft; let armed = true; window.__lateFired = 0;
  window.__lateOff = () => { persistDraft = op; };
  persistDraft = async function(){
    const ret = await op.apply(this, arguments);
    if(armed){ armed = false; window.__lateFired++;
      M.chosho_photos.push({ label: suggestLabel(M.chosho_photos.length), dataUri: __png('#0a0'), id: id || 'late' });
      await photoKeepInto(M); await op(); }
    return ret;
  };
};
window.__fileOf = (d, n) => { try{ return JSON.parse(d.__files[n]); }catch(_){ return null; } };
window.__sideNames = d => Object.keys(d.__files).filter(n => /_現場預け_\\d{8}-\\d{6}/.test(n));
window.__overlay = () => { const s = document.getElementById('save-ov-side'); return s ? s.textContent.trim() : ''; };
/* 名前に入れた日時（ローカル）と _side.at が同じ時刻か */
window.__tagOf = iso => { const d = new Date(iso); const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); };
`;

/* ここから 版181（組 g-fix）で足した道具。smoke_v178_genba.js と同じ形（戸別 A・B と、写真の取り込みを1枚ずつ届かせる道具） */
const NA = '2612MKM031', NB = '2612MKM032';
const SETUP2 = `
window.__NA = ${JSON.stringify(NA)}; window.__NB = ${JSON.stringify(NB)};
window.__ledger78 = over => ({ type:'antenna_reception_ledger', version:5, project: __P1,
  exportedAt:'2026-10-13T00:00:00.000Z', appVersion:'176',
  rows:[ Object.assign({ mgmt_no:__NA, name:'工藤 A', addr:'三沢市A町1', date:'2026-10-20' }, (over || {}).a || {}),
         Object.assign({ mgmt_no:__NB, name:'工藤 B', addr:'三沢市B町2', date:'2026-10-21' }, (over || {}).b || {}) ] });
window.__rows = rows => receptionSaveRows({ type:'antenna_reception_ledger', version:5, project: __P1,
  exportedAt:'2026-10-13T00:00:00.000Z', appVersion:'176', rows: rows });
window.__draft78 = async function(no, pid, color){
  M = freshModel(); ensureModelShape(M);
  M.chosho_mgmt_no = no; M.chosho_cust_name = (no === __NA) ? '工藤 A' : '工藤 B';
  M.chosho_note = '現場メモ ' + no; M.chosho_photos = [ __ph(pid, color) ];
  M._touched = true; M._lastDraftKey = 'no:' + no;
  await persistDraft();
};
/* 受付台帳（A・B）を入れ、A・B の下書き（写真 a1・b1）を作る。保存先を選ぶ画面は「リスト」を返す（画面の戸別は B） */
window.__state78 = async function(){
  receptionSaveRows(__ledger78());
  window.__D = __mkdir('リスト', {}, {});
  __pickerMode = 'return'; __pickerRet = window.__D;
  savePlaceOkSet(__P1);
  await __draft78(__NA, 'a1', '#c33');
  await __draft78(__NB, 'b1', '#33c');
  render();
};
/* 戸別を開く（履歴から開くのと同じ：下書きを読み直した別の物が画面の戸別になる） */
window.__open = async function(k){
  clearTimeout(_persistTimer); await persistDraft();
  const rec = await idbGet(k);
  M = rec.model; M._lastDraftKey = k; ensureModelShape(M); resetOpenState(); render(); await saveStateLoad();
};
/* 本物の写真の取り込み（handlePhotoFiles）を、1枚ずつ好きなときに届かせる */
window.__gatedImport = function(){
  window.__cg = {};
  window.__cgate = c => new Promise(r => { window.__cg[c] = r; });
  window.__rel = async c => { for(let i = 0; i < 50 && !window.__cg[c]; i++) await __sleep(20); const g = window.__cg[c]; delete window.__cg[c]; if(g) g(); await __sleep(200); };
  readImageAsDataURI = async function(f){ await __cgate(f.__c); return __png(f.__c || '#000'); };
  photoFitForStorage = async d => d;
  window.__files = cs => cs.map(c => { const f = new File([new Uint8Array([1,2,3])], 'p.jpg', { type:'image/jpeg' }); f.__c = c; return f; });
  window.__pidOf = c => photoContentId(__png(c));
};
window.__holders = async function(ps){
  const out = [];
  for(const rec of (await idbGetAll()) || []){
    if(!rec || !rec.model) continue;
    const have = __pids(rec.model).split(',');
    if(ps.some(p => have.indexOf(p) >= 0)) out.push(rec.key + '=' + have.join('/'));
  }
  return out;
};
window.__info78 = async function(no){
  await refreshDraftInfo(true);
  const rec = await idbGet('no:' + no);
  const m = (rec && rec.model) || {};
  return { photos: __pids(m), saved: !!(rec && rec.fileSavedAt), h: handoverOf(draftInfoOf(no)),
           note: m.chosho_note, name: m.chosho_cust_name, flyer: !!m.flyer_done, side: !!m._sideAt };
};
/* 写真の取り込みの控え（persistModel）が下書き no を読み始めるまで待つ「きっかけ」（人工の遅延なし）。
   __kickArm(no) で idbGet を見張り、__kick(c) で写真 c を読み終わらせ、その控えが no を読み始めたところで戻る。
   ★列（photoKeepQueue）の中から __kick を呼ばないこと★（写真の控えは同じ列に並ぶので、待つと止まる） */
window.__kickArm = function(no){
  window.__kickOg = idbGet; window.__pmCalled = null; window.__kicked = 0;
  idbGet = function(k){ const p = window.__kickOg.apply(this, arguments);
    if(k === 'no:' + no && window.__pmCalled){ const f = window.__pmCalled; window.__pmCalled = null; window.__kicked++; f(); } return p; };
};
window.__kick = async function(c){
  const called = new Promise(r => { window.__pmCalled = r; });
  for(let i = 0; i < 50 && !window.__cg[c]; i++) await __sleep(20);
  const g = window.__cg[c]; delete window.__cg[c]; if(g) g();
  await Promise.race([called, __sleep(3000)]);
};
window.__kickOff = function(){ if(window.__kickOg){ idbGet = window.__kickOg; window.__kickOg = null; } };
window.__dno = no => { const el = Array.from(document.querySelectorAll('#draft-list .d-no')).find(e => e.textContent.indexOf(no) >= 0); return el ? el.textContent : ''; };
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errs = [];
  /* 場面ごとに新しい入れ物で開く（覚え書きを持ち越さない）。既定＝PC版サイトの Android タブレット／{pc:true}＝Windows のPC */
  async function fresh(name, cfg){
    cfg = cfg || {};
    const ctx = await b.newContext(cfg.pc
      ? { viewport:{ width: cfg.width || 1280, height: cfg.height || 900 }, deviceScaleFactor:1, isMobile:false, hasTouch:false, userAgent: UA_PC }
      : { viewport:{ width: cfg.width || 800, height: cfg.height || 1200 }, deviceScaleFactor:1.5, isMobile:true, hasTouch:true,
          userAgent: cfg.ua === 'android' ? UA_ANDROID : cfg.ua === 'iphone' ? UA_IPHONE : UA_TAB });
    await ctx.addInitScript(ANDROID_INIT, cfg);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror(' + name + '): ' + e.message));
    page.on('console', m => { const t = m.text();
      if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push('console(' + name + '): ' + t); });
    page.on('dialog', d => d.accept().catch(()=>{}));
    await page.goto(HTML); await page.waitForTimeout(1600);
    await page.evaluate(SETUP);
    await page.evaluate(SETUP2);
    return { ctx, page };
  }
  async function scene(name, cfg, fn){
    if(ONLY.length && name !== '⓪' && !ONLY.some(s => name.indexOf(s) >= 0)) return;
    let c = null;
    try{ c = await fresh(name, cfg); await fn(c.page); }
    catch(e){ fails.push('試験が途中で止まった（' + name + '）→ ' + ((e && e.message) || e)); }
    finally{ if(c) await c.ctx.close().catch(()=>{}); }
  }
  const J = o => String(JSON.stringify(o)).slice(0, 1400);
  const last = a => (a && a.length) ? a[a.length - 1] : {};
  const has = (list, p) => String(list || '').split(',').indexOf(p) >= 0;

  /* ---------- ⓪ 前提 ---------- */
  await scene('⓪', { pc:true }, async page => {
    const r0 = await page.evaluate(() => ({
      ver: APP_VERSION,
      f: ['sideSaveFlow','sideAskDeliver','sideInfoDir','sideInfoDl','sideEscapeRun','pcGuardDirLoad','photoKeepInto','persistModel',
          'markDraftSavedFor','markDraftSidedFor','receptionApplyToDrafts','flowShareItemsApply','flowApplyShared','isUntouchedHere',
          'mapImportFile','openDraftModal','flowShareConfirmOverwrite','mergeIntoState','saveAllDrafts','saveJson','persistMovedNotice',
          'unsavedTargets','handoverOf','draftInfoOf','photoKeepQueue'].filter(n => typeof window[n] !== 'function')
    }));
    console.log('⓪前提', J(r0));
    ok(r0.f.length === 0, '★関数が無い → ' + r0.f.join(' / '));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
  });

  /* ---------- ① 同じ管理番号の下書き2つを一緒に 📮 → 名前も預けた時刻も別々 ---------- */
  await scene('①', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = '2612MKM014'; M.chosho_cust_name = '工藤 二'; M.chosho_note = 'A';
      M.chosho_photos = [ __ph('a1', '#c33') ]; M._touched = true;
      await persistDraft();
      const k1 = M._lastDraftKey;
      /* 別の下書き（新規）で同じ番号を打つ → 番号が重なるので一時のキーへ */
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = '2612MKM014'; M.chosho_note = 'B';
      M.chosho_photos = [ __ph('b1', '#3c3'), __ph('b2', '#33c') ]; M._touched = true;
      await persistDraft();
      const k2 = M._lastDraftKey;
      await openDraftModal(); await __sleep(300);
      const cbs = Array.from(document.querySelectorAll('.d-check'));
      cbs.forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles:true })); });
      __plan = ['📤'];
      const w = await __watch(async () => { __click('d-sidesel'); await __sleep(1500); }, 15000);
      const js = w.sharedTexts.map(t => { try{ return JSON.parse(t); }catch(_){ return null; } });
      return { k1, k2, n: cbs.length, names: w.sharedNames,
               stamps: js.map(j => (j && j._side) ? (j._side.at + '|' + j.chosho_mgmt_no) : null),
               tags: js.map(j => (j && j._side) ? __tagOf(j._side.at) : null), photos: js.map(j => __pids(j)) };
    });
    console.log('①同じ番号の下書き2つを預ける', J(r));
    ok(r.k1 !== r.k2 && r.n === 2 && r.names.length === 2 && r.photos.slice().sort().join('|') === 'a1|b1,b2',
       '①試験の前提: 同じ番号の下書き2つを、1回の共有で渡せていない → ' + J(r));
    ok(new Set(r.names).size === 2 && new Set(r.stamps).size === 2,
       '★①同じ番号の下書き2つの預けが、同じ名前か同じ預けた時刻（時刻|管理番号）になった（事務所で2つ目がまとまらない）→ ' + J([r.names, r.stamps]));
    ok(r.names.every((n, i) => !!r.tags[i] && n.indexOf(r.tags[i]) >= 0),
       '★①預けの名前の日時と、中の _side.at が違う時刻 → ' + J([r.names, r.tags]));
  });

  /* ---------- ② 端末の中だけかもしれないフォルダに置いた預け ---------- */
  await scene('②a', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state();                     // 覚えているフォルダは端末の中の「その2」・2612MKM013 は見るだけ
      __plan = ['📮', '📁'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const o = w.ov[w.ov.length - 1] || {};
      const names = __sideNames(__D);
      const btn = __overlay();
      /* ②b：「📤 共有でも渡す」→ 共有の画面を閉じた */
      __shareMode = 'abort';
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const o2 = w2.ov[w2.ov.length - 1] || null;
      return { st, android: isAndroidLike(), dev: saveDirMaybeDevice(_saveDir), names, title: o.title || '', warn: !!o.warn, msg: o.msg || '',
               escape: o.escape || '', btn, side: !!M._sideAt, how: M._sideHow || '',
               w2: { shareCalls: __shareCalls, ov: w2.ov.length, title: o2 && o2.title, escape: o2 && o2.escape, btn: __overlay() } };
    });
    console.log('②a/②b その2に置く・共有を閉じる', J(r));
    ok(r.st.viewOnly && r.android && r.dev && r.names.length === 1 && /共有でも渡す/.test(r.btn),
       '②a試験の前提: Android の「その2」に預けを置けていない → ' + J(r));
    ok(!/事務所に預けました/.test(r.title) && /置きました/.test(r.title) && /届いていないかもしれません/.test(r.title) && r.warn === true,
       '★②a端末の中だけかもしれない「その2」に置いただけなのに、「事務所に預けました」と言い切った（⚠ にしない）→ ' + J([r.title, r.warn]));
    ok(r.side && r.how === 'dir' && /この端末の中だけのフォルダなら/.test(r.msg) && r.escape === 'share-also',
       '★②a置いたあとの印・「📤 共有でも渡す」・⚠ の一文が変わった → ' + J([r.side, r.how, r.escape]));
    ok(r.w2.ov === 1 && r.w2.escape === 'share-also' && /共有でも渡す/.test(r.w2.btn || ''),
       '★②b「📤 共有でも渡す」で共有の画面を閉じたら、何も出ずに終わった（元の窓を出し直さない）→ ' + J(r.w2));
  });
  await scene('②c', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ no:'2612MKM014' });  // PCに中身の無い戸別を、物件の違う「その2」に保存 → 預けの名前で置く
      __plan = [];
      const w = await __watch(() => __press('btn-save'), 15000);
      const o = w.ov[w.ov.length - 1] || {};
      return { st, names: __sideNames(__D), title: o.title || '', warn: !!o.warn, escape: o.escape || '' };
    });
    console.log('②c物件の違うフォルダに預けの名前で置く', J(r));
    ok(r.names.length === 1 && /別の名前で置きました/.test(r.title) && r.escape === 'share-also',
       '②c試験の前提: 物件の違う「その2」に預けの名前で置けていない → ' + J(r));
    ok(r.warn === true, '★②c端末の中だけかもしれない「その2」に預けの名前で置いた知らせが ⚠ でない → ' + J(r));
  });
  await scene('②d', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ dirName:'リスト' });  // PC の「リスト」（Dropbox のフォルダ）
      __plan = ['📮', '📁'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const o = w.ov[w.ov.length - 1] || {};
      return { st, dev: saveDirMaybeDevice(_saveDir), names: __sideNames(__D), title: o.title || '', warn: !!o.warn };
    });
    console.log('②dPCのリストに置く', J(r));
    ok(r.st.viewOnly && !r.dev && r.names.length === 1, '②d試験の前提: PC の「リスト」に預けを置けていない → ' + J(r));
    ok(/^📮 事務所に預けました$/.test(r.title) && r.warn === false,
       '★②dPC の「リスト」（Dropbox）に置いたのに、「事務所に預けました」と言わない（または ⚠ にした）→ ' + J(r));
  });

  /* ---------- ③ 何件も続けてダウンロードしたとき ---------- */
  await scene('③a', { noShare:true }, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      for(const no of ['2612MKM014', '2612MKM015']){
        M = freshModel(); ensureModelShape(M);
        M.chosho_mgmt_no = no; M.chosho_note = 'メモ ' + no; M.chosho_photos = [ __ph('p' + no.slice(-2), '#c3' + no.slice(-1)) ]; M._touched = true;
        await persistDraft();
      }
      const pick = async n => {
        await openDraftModal(); await __sleep(300);
        Array.from(document.querySelectorAll('.d-check')).slice(0, n).forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles:true })); });
        __plan = ['⬇'];
        const w = await __watch(async () => { __click('d-sidesel'); await __sleep(1500); }, 15000);
        try{ saveOverlayHide(); }catch(_){}
        return { dl: w.dl, msg: (w.ov[w.ov.length - 1] || {}).msg || '', title: (w.ov[w.ov.length - 1] || {}).title || '' };
      };
      const two = await pick(2);
      const one = await pick(1);
      return { two, one };
    });
    console.log('③a履歴から2件をダウンロード', J(r));
    ok(r.two.dl.length === 2 && /ダウンロードに入れました/.test(r.two.title), '③a試験の前提: 2件をダウンロードに入れていない → ' + J(r.two));
    ok(/途中で止めることがあります/.test(r.two.msg) && /許可/.test(r.two.msg) && /困ったとき/.test(r.two.msg),
       '★③a何件も続けてダウンロードしたのに、ブラウザが途中で止めることがあると言わない → ' + J(r.two.msg));
    ok(r.one.dl.length === 1 && !/途中で止めることがあります/.test(r.one.msg), '★③a1件だけなのに、続けてダウンロードの注意を出した → ' + J(r.one));
  });
  await scene('③b', { noShare:true }, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      saveRouteSet('share');                          // 共有で渡す道（フォルダを覚えるのをやめた）・共有できない端末
      for(const no of ['2612MKM014', '2612MKM015']){
        M = freshModel(); ensureModelShape(M);
        M.chosho_mgmt_no = no; M.chosho_note = 'メモ ' + no; M.chosho_photos = [ __ph('p' + no.slice(-2), '#c3' + no.slice(-1)) ]; M._touched = true;
        await persistDraft();
      }
      await refreshDraftInfo(true);
      const s0 = __said.length;
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(800); }, 20000);
      return { dl: w.dl, said: __said.slice(s0).filter(s => /ダウンロードに入れました/.test(s)) };
    });
    console.log('③bまとめて保存で預けを2件ダウンロード', J(r));
    ok(r.dl.length === 2 && r.said.length === 1, '③b試験の前提: まとめて保存で預けを2件ダウンロードに入れていない → ' + J(r));
    ok(/途中で止めることがあります/.test(r.said[0] || ''),
       '★③bまとめて保存で預けを何件もダウンロードしたのに、ブラウザが途中で止めることがあると言わない → ' + J(r.said));
  });

  /* ---------- ④ フォルダを選ぶ画面を閉じたとき ---------- */
  await scene('④a', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ noDir:true });       // Android・フォルダを覚えていない・見るだけ
      __plan = ['📁'];
      const w = await __watch(() => __press('btn-save'), 15000);
      return { st, picks: w.picks.map(p => ({ title: p.title, rows: p.rows })), picker: w.picker, viewOnly: !!M._viewOnly };
    });
    console.log('④a保存→📁→閉じる', J(r));
    ok(r.st.viewOnly && r.picker === 1 && (r.picks[0] || {}).rows && r.picks[0].rows.some(t => /^📁 PCのフォルダから読み込む/.test(t)),
       '④a試験の前提: 見るだけの窓の 📁 でフォルダを選ぶ画面が出ない → ' + J(r));
    const p1 = r.picks[1] || {};
    ok(/フォルダを選びませんでした/.test(p1.title || '') && (p1.rows || []).some(t => /^📮/.test(t)) && (p1.rows || []).some(t => /^📂/.test(t)),
       '★④aフォルダを選ぶ画面を閉じたら、何も言わずに終わった（📮・📂 の窓が出ない）→ ' + J(r.picks));
  });
  await scene('④b', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ noDir:true });
      renderPcGuard();
      const has = !!document.getElementById('pcg-dir');
      __plan = [];
      const w = await __watch(async () => { __click('pcg-dir'); await __sleep(800); }, 8000);
      return { st, has, picker: w.picker, picks: w.picks.map(p => ({ title: p.title, rows: p.rows })) };
    });
    console.log('④b帯の📁→閉じる（Android）', J(r));
    ok(r.has && r.picker === 1, '④b試験の前提: 帯の「📁 PCのフォルダから読み込む」が無い・押してもフォルダを選ぶ画面が出ない → ' + J(r));
    ok(r.picks.length === 1 && /フォルダを選びませんでした/.test(r.picks[0].title || '') && (r.picks[0].rows || []).some(t => /^📂/.test(t)),
       '★④b帯の 📁 でフォルダを選ぶ画面を閉じたら、何も言わずに終わった（Android）→ ' + J(r.picks));
  });
  await scene('④c', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ noDir:true });
      renderPcGuard();
      const has = !!document.getElementById('pcg-dir');
      __plan = [];
      const w = await __watch(async () => { __click('pcg-dir'); await __sleep(800); }, 8000);
      return { st, has, picker: w.picker, picks: w.picks.length, said: w.said };
    });
    console.log('④cPCで帯の📁→閉じる', J(r));
    ok(r.has && r.picker === 1, '④c試験の前提: PC の帯に「📁 PCのフォルダから読み込む」が無い → ' + J(r));
    ok(r.picks === 0 && r.said.length === 0, '★④cPC で帯の 📁 を自分で閉じただけなのに、窓を出した → ' + J(r));
  });

  /* ---------- ⑤ 写真の取り込み中に戸別を切り替える ---------- */
  const switchBody = async ({ mode }) => {
    __gatedImport();
    await __state78();
    await __open('no:' + __NA);
    const imp = handlePhotoFiles(__files(['#101', '#202', '#303']));
    await __rel('#101');
    await __sleep(600);
    const og = idbGet; let armed = true;
    if(mode === 'newcase'){
      /* ＋新規：今の戸別を控えるのに時間がかかる（写真の多い下書き）。控えているあいだに2枚目が読み終わる */
      idbGet = og;
      const oc = uiConfirm; uiConfirm = async () => true;
      const op = persistDraft; persistDraft = async function(){ const r = op.apply(this, arguments); await __sleep(200); return r; };
      const sw = newCase().then(() => { uiConfirm = oc; persistDraft = op; });
      await __sleep(50);
      await __rel('#202');
      await sw;
    } else {
      /* 開く戸別（B）を読み始めた瞬間に、2枚目を読み終わらせる（人工の遅延なし） */
      idbGet = function(k){
        if(armed && k === 'no:' + __NB){ armed = false; const g = window.__cg['#202']; delete window.__cg['#202']; if(g) g(); }
        return og.apply(this, arguments);
      };
      for(let i = 0; i < 50 && !window.__cg['#202']; i++) await __sleep(20);
      if(mode === 'click'){
        await openDraftModal();
        document.querySelector('button.d-open[data-draftopen="no:' + __NB + '"]').click();
      } else {
        openFromReception(rcRowOf(__NB));
      }
      for(let i = 0; i < 100 && M.chosho_mgmt_no !== __NB; i++) await __sleep(10);
      idbGet = og;
    }
    await __sleep(700);
    await __rel('#303'); await imp; await __sleep(700);
    const rec = await idbGet('no:' + __NA);
    return { mode, armed, open: M.chosho_mgmt_no || '(新規)', p2: __pidOf('#202'), p3: __pidOf('#303'), final: __pids(rec.model),
             holders: await __holders([__pidOf('#202')]) };
  };
  for(const [sc, mode] of [['⑤a', 'click'], ['⑤b', 'reception'], ['⑤c', 'newcase']]){
    await scene(sc, { pc:true }, async page => {
      const r = await page.evaluate(switchBody, { mode });
      console.log(sc + '取り込み中に切り替え（' + mode + '）', J(r));
      ok(r.open !== NA && has(r.final, r.p3) && has(r.final, 'a1'), sc + '試験の前提: 切り替わっていない／3枚目が A に入っていない → ' + J(r));
      ok(has(r.final, r.p2), '★' + sc + '切り替えの途中で読み終わった2枚目が、A の下書きに無い（どの下書きにも残らない）→ ' + J(r));
    });
  }
  /* ⑤r 開き直した写し（A'）から B へ移る途中に2枚目が読み終わる（photoKeepInto の「同じ戸別を開き直した」枝・確かめ係の見つけた道） */
  const reopenBody = async () => {
    __gatedImport();
    await __state78();
    await __open('no:' + __NA);
    const X = M;
    const imp = handlePhotoFiles(__files(['#101', '#202', '#303']));
    await __rel('#101');
    await __sleep(600);
    await __open('no:' + __NB);
    await __sleep(200);
    await __open('no:' + __NA);                 // 開き直した写し（別の物）
    const reopened = (M !== X) && M.chosho_mgmt_no === __NA;
    await __sleep(600);
    const og = idbGet; let armed = true;
    idbGet = function(k){
      if(armed && k === 'no:' + __NB){ armed = false; const g = window.__cg['#202']; delete window.__cg['#202']; if(g) g(); }
      return og.apply(this, arguments);
    };
    for(let i = 0; i < 50 && !window.__cg['#202']; i++) await __sleep(20);
    await openDraftModal();
    document.querySelector('button.d-open[data-draftopen="no:' + __NB + '"]').click();
    for(let i = 0; i < 100 && M.chosho_mgmt_no !== __NB; i++) await __sleep(10);
    idbGet = og;
    await __sleep(700);
    await __rel('#303'); await imp; await __sleep(700);
    const rec = await idbGet('no:' + __NA);
    return { reopened, armed, open: M.chosho_mgmt_no, p2: __pidOf('#202'), p3: __pidOf('#303'), final: __pids(rec.model),
             holders: await __holders([__pidOf('#202')]) };
  };
  await scene('⑤r', { pc:true }, async page => {
    const r = await page.evaluate(reopenBody);
    console.log('⑤r開き直した写しから切り替え', J(r));
    ok(r.reopened && !r.armed && r.open === NB && has(r.final, r.p3), '⑤r試験の前提 → ' + J(r));
    ok(has(r.final, r.p2), '★⑤r開き直した写しから切り替える途中で読み終わった2枚目が、A の下書きに無い → ' + J(r));
  });
  const raceBody = async ({ what }) => {
    __gatedImport();
    await __state78();
    await __open('no:' + __NA);
    const imp = handlePhotoFiles(__files(['#101', '#202', '#303']));
    await __rel('#101');
    await __sleep(600);
    if(what === 'cam') M.chosho_photos.push(__ph('cam1', '#0f0'));             // 📷 で撮った1枚（まだ400msの控えの前）
    else if(what === 'del') M.chosho_photos = M.chosho_photos.filter(p => p.id !== 'a1');
    else M.chosho_note = '打ち直した備考';
    saveDraft();                                       // 400ms の控えを待たずに切り替える
    const og = idbGet; let armed = true;
    idbGet = function(k){
      if(armed && k === 'no:' + __NA){ armed = false; const g = window.__cg['#202']; delete window.__cg['#202']; if(g) g(); }
      return og.apply(this, arguments);
    };
    for(let i = 0; i < 50 && !window.__cg['#202']; i++) await __sleep(20);
    await openDraftModal();
    document.querySelector('button.d-open[data-draftopen="no:' + __NB + '"]').click();
    for(let i = 0; i < 100 && M.chosho_mgmt_no !== __NB; i++) await __sleep(10);
    idbGet = og;
    await __sleep(700);
    await __rel('#303'); await imp; await __sleep(700);
    const rec = await idbGet('no:' + __NA);
    return { what, armed, note: rec.model.chosho_note, photos: __pids(rec.model), p2: __pidOf('#202'), p3: __pidOf('#303') };
  };
  await scene('⑤d', { pc:true }, async page => {
    const rs = [];
    for(const what of ['note', 'del', 'cam']){
      if(rs.length){ await page.reload(); await page.waitForTimeout(1500); await page.evaluate(SETUP); await page.evaluate(SETUP2);
                     await page.evaluate(async () => { for(const r of (await idbGetAll()) || []) if(r && r.key) await idbDel(r.key); }); }
      rs.push(await page.evaluate(raceBody, { what }));
    }
    console.log('⑤d切り替える直前の直し', J(rs));
    const [n, d, c] = rs;
    ok(!n.armed && has(n.photos, n.p2) && has(n.photos, n.p3), '⑤d試験の前提: 切り替えの控えと同時に写真が読み終わっていない → ' + J(n));
    ok(n.note === '打ち直した備考', '★⑤d切り替える直前に打った備考が、写真の控えで元に戻った → ' + J(n));
    ok(!has(d.photos, 'a1') && has(d.photos, d.p2), '★⑤d切り替える直前に消した写真が、写真の控えで戻った → ' + J(d));
    ok(has(c.photos, 'cam1') && has(c.photos, c.p2), '★⑤d切り替える直前に撮った（まだ控えていない）写真が、下書きから落ちた → ' + J(c));
  });

  /* ---------- ⑥ 下書きを読んで直して書くところ と 写真の控え が同時 ---------- */
  const raceStart = async () => {
    __gatedImport();
    await __state78();
    await __open('no:' + __NA);
    window.__imp = handlePhotoFiles(__files(['#101', '#202']));
    await __rel('#101');
    await __sleep(600);
    await __open('no:' + __NB);                      // 画面は B（A の取り込みは続いている）
    __kickArm(__NA);
  };
  const raceEnd = async () => { await window.__imp; await __sleep(700); __kickOff(); return await __info78(__NA); };
  await scene('⑥a', { pc:true }, async page => {
    const r = await page.evaluate(async (rs) => {
      await eval(rs)();
      let armed = true;
      const om = markDraftSavedFor;
      markDraftSavedFor = async function(key){ if(armed && key === 'no:' + __NA){ armed = false; await __kick('#202'); } return om.apply(this, arguments); };
      const s0 = __said.length;
      await saveAllDrafts('unsaved');
      markDraftSavedFor = om;
      const kicked = window.__kicked;
      const info = await (async () => { await window.__imp; await __sleep(700); __kickOff(); return await __info78(__NA); })();
      return { armed, kicked, p2: __pidOf('#202'), info, file: (() => { try{ return __pids(JSON.parse(__D.__files[__NA + '.json'])); }catch(_){ return null; } })(),
               said: __said.slice(s0).filter(s => /保存の途中/.test(s)) };
    }, '(' + raceStart.toString() + ')');
    console.log('⑥aまとめて保存の印付けと写真の控え', J(r));
    ok(!r.armed && r.kicked === 1 && r.file !== null, '⑥a試験の前提: まとめて保存で A を書いていない／写真の控えと重なっていない → ' + J(r));
    ok(has(r.info.photos, r.p2), '★⑥aまとめて保存の「保存済」の印付けが、同時に届いた写真を下書きから消した → ' + J(r));
    ok(r.info.h !== 'ok' && r.said.length === 1, '★⑥a下書きに入っていない写真があるのに「保存済」にした（または知らせない）→ ' + J(r));
  });
  await scene('⑥b', { pc:true }, async page => {
    const r = await page.evaluate(async (rs) => {
      await eval(rs)();
      receptionSaveRows(__ledger78({ a: { name: '工藤 A（直した）' } }));
      let armed = true; const oa = idbGetAll;
      idbGetAll = async function(){ const x = await oa.apply(this, arguments); if(armed){ armed = false; await __kick('#202'); } return x; };
      await receptionApplyToDrafts();
      idbGetAll = oa;
      const kicked = window.__kicked;
      await window.__imp; await __sleep(700); __kickOff();
      return { armed, kicked, p2: __pidOf('#202'), info: await __info78(__NA) };
    }, '(' + raceStart.toString() + ')');
    console.log('⑥b台帳の入れ直しと写真の控え', J(r));
    ok(!r.armed && r.kicked === 1 && r.info.name === '工藤 A（直した）', '⑥b試験の前提: 台帳の入れ直しが A に入っていない／重なっていない → ' + J(r));
    ok(has(r.info.photos, r.p2), '★⑥b受付台帳の入れ直しが、同時に届いた写真を下書きから消した → ' + J(r));
  });
  await scene('⑥c', { pc:true }, async page => {
    const r = await page.evaluate(async (rs) => {
      await eval(rs)();
      receptionSaveRows(__ledger78({ a: { name: '工藤 A（直した）' } }));
      let n = 0; const oa = idbGetAll;
      /* 全部保存し直す：下書きの一覧を読んだ直後（A を入れ直す直前）に、2枚目の控えが A を読み始める */
      idbGetAll = async function(){ const x = await oa.apply(this, arguments); if(++n === 2){ await __kick('#202'); } return x; };
      await saveAllDrafts('all');
      idbGetAll = oa;
      const kicked = window.__kicked;
      await window.__imp; await __sleep(700); __kickOff();
      return { n, kicked, p2: __pidOf('#202'), info: await __info78(__NA) };
    }, '(' + raceStart.toString() + ')');
    console.log('⑥c全部保存し直すと写真の控え', J(r));
    ok(r.kicked === 1 && r.info.name === '工藤 A（直した）', '⑥c試験の前提: 全部保存し直すで台帳が A に入っていない／重なっていない → ' + J(r));
    ok(has(r.info.photos, r.p2), '★⑥c全部保存し直すの台帳の入れ直しが、同時に届いた写真を下書きから消した → ' + J(r));
  });
  await scene('⑥d', { pc:true }, async page => {
    const r = await page.evaluate(async (rs) => {
      await eval(rs)();
      const other = { chosho_mgmt_no: __NA, work_type:'new', chosho_cust_name:'工藤 A', flyer_done:true, flyer_at:'2026-10-02T10:00',
                      editedAt: new Date(Date.now() + 3600e3).toISOString(), _origin:'genba' };
      let armed = true; const oc = uiConfirm;
      uiConfirm = async m => { if(armed && /印が増えます/.test(String(m))){ armed = false; await __kick('#202'); } return true; };
      await flowShareRead([{ name: __NA + '.json', file: new File([JSON.stringify(other)], __NA + '.json') }], false);
      uiConfirm = oc;
      const kicked = window.__kicked;
      await window.__imp; await __sleep(700); __kickOff();
      return { armed, kicked, p2: __pidOf('#202'), info: await __info78(__NA) };
    }, '(' + raceStart.toString() + ')');
    console.log('⑥d📥引き継ぎと写真の控え', J(r));
    ok(!r.armed && r.kicked === 1 && r.info.flyer === true, '⑥d試験の前提: 引き継いだ印が A に付いていない／重なっていない → ' + J(r));
    ok(has(r.info.photos, r.p2), '★⑥d📥 の印の引き継ぎが、同時に届いた写真を下書きから消した → ' + J(r));
  });
  await scene('⑥e', { pc:true }, async page => {
    const r = await page.evaluate(async (rs) => {
      await eval(rs)();
      await openDraftModal(); await __sleep(300);
      const cb = document.querySelector('.d-check[data-draftcheck="no:' + __NA + '"]');
      cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles:true }));
      /* 共有で渡したあと、A に「預けた」印を付けるために下書きを読むのと同時に、A の写真が下書きに届く */
      let armed = true; const om = markDraftSidedFor;
      markDraftSidedFor = async function(model){ if(armed && model && model.chosho_mgmt_no === __NA){ armed = false; await __kick('#202'); } return om.apply(this, arguments); };
      __plan = ['📤'];
      const w = await __watch(async () => { __click('d-sidesel'); await __sleep(1500); }, 15000);
      markDraftSidedFor = om;
      const kicked = window.__kicked;
      await window.__imp; await __sleep(700); __kickOff();
      return { armed, kicked, shared: w.sharedNames, p2: __pidOf('#202'), info: await __info78(__NA) };
    }, '(' + raceStart.toString() + ')');
    console.log('⑥e履歴の📮と写真の控え', J(r));
    ok(!r.armed && r.kicked === 1 && r.shared.length === 1 && r.info.side, '⑥e試験の前提: 履歴から A を預けていない／重なっていない → ' + J(r));
    ok(has(r.info.photos, r.p2), '★⑥e預けた印付けが、同時に届いた写真を下書きから消した → ' + J(r));
    ok(r.info.h !== 'ok', '★⑥e預けたファイルに入っていない写真があるのに「預け済」にした → ' + J(r));
  });

  /* ---------- ⑦ 別の下書きに入れた知らせは「履歴」と言う ---------- */
  await scene('⑦', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      persistModel._moved = [{ no: __NA, photo: true, tag: null }];
      const s0 = __said.length;
      await persistMovedNotice(null);
      await __sleep(300);
      return { said: __said.slice(s0) };
    });
    console.log('⑦別の下書きの知らせ', J(r));
    ok(r.said.length === 1 && /別の下書き/.test(r.said[0]), '⑦試験の前提: 知らせが出ない → ' + J(r));
    ok(/「履歴」/.test(r.said[0]) && !/下書き一覧/.test(r.said[0]), '★⑦知らせが、画面に無い「下書き一覧」を案内した（ボタンは「履歴」）→ ' + J(r));
  });

  /* ---------- ⑧ 台帳の印が付いているだけの戸別を「まだ保存していない」に数えない ---------- */
  await scene('⑧', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      __rows([{ mgmt_no:'Q1001', name:'う様', addr:'○市3', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false, survey:true },
              { mgmt_no:'Q1002', name:'え様', addr:'○市4', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
      for(const row of getReceptionRows()){ await openFromReception(row); await __sleep(250); }
      await refreshDraftInfo(true);
      const u = unsavedTargets();
      renderReceptionList('');
      const btn = document.getElementById('rc-saveall');
      const rc = ((document.getElementById('reception-list') || {}).innerText || '').replace(/\s+/g, ' ');
      const h = handoverOf(draftInfoOf('Q1001'));
      const s0 = __said.length;
      await saveAllDrafts('unsaved');
      const info = draftInfoOf('Q1001');
      return { u, btn: btn ? btn.textContent : '', rc: (rc.match(/Q1001[\s\S]{0,80}/) || [''])[0], h, said: __said.slice(s0),
               has: !!(info && info.has), touched: !!(info && info.touched), flow: !!(info && flowAny(info.flow)) };
    });
    console.log('⑧台帳の印だけの戸別', J(r));
    ok(r.has && !r.touched && r.flow, '⑧試験の前提: 台帳で下見済の戸別の下書きが（開いただけ・印あり）になっていない → ' + J(r));
    ok(r.u.indexOf('Q1001') < 0 && r.h === '' && r.btn === '',
       '★⑧この端末で何も入力していない（台帳の印だけの）戸別を「まだ保存していない」に数えた → ' + J(r));
    ok(!/まだ保存していません|未保存/.test(r.rc), '★⑧受付台帳の一覧に、開いただけの戸別の「まだ保存していません」が出た → ' + J(r.rc));
    ok(!r.said.some(s => /書き替える戸別はありません/.test(s)), '★⑧まとめて保存を押すと「書き替える戸別はありません」（数えた戸別を書かない）→ ' + J(r.said));
  });

  /* ---------- ⑨ 引き継いだ印だけでは「入力あり」にしない ---------- */
  await scene('⑨a', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      __rows([{ mgmt_no:'E5101', name:'お様', addr:'○市5', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false },
              { mgmt_no:'E5102', name:'か様', addr:'○市6', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
      const rows = getReceptionRows();
      await openFromReception(rows[0]); await __sleep(250);
      await openFromReception(rows[1]); await __sleep(250);       // E5101 は開いただけで閉じた
      const other = { chosho_mgmt_no:'E5101', work_type:'new', chosho_cust_name:'お様', chosho_photos:[ __ph('x1', '#123'), __ph('x2', '#456') ],
        survey_done:true, survey_at:'2026-10-02T10:00', antenna_type:'U206', cable_main_len:'40',
        editedAt: new Date(Date.now() + 3600e3).toISOString(), _origin:'genba' };
      await flowShareRead([{ name:'E5101.json', file: new File([JSON.stringify(other)], 'E5101.json') }], false);
      await refreshDraftInfo(true);
      const u = unsavedTargets();
      const rec = await idbGet('no:E5101');
      const dir = __mkdir('リスト', { 'E5101.json': JSON.stringify(other) }, {}); window.__D = dir;
      __pickerMode = 'return'; __pickerRet = dir; savePlaceOkSet(__P1);
      await saveAllDrafts('unsaved');
      return { u, touched: rec.touched, mt: rec.model._touched, survey: !!rec.model.survey_done, wrote: dir.__wrote.slice(),
               photos: __pids(JSON.parse(dir.__files['E5101.json'])) };
    });
    console.log('⑨a開いただけの戸別に📥', J(r));
    ok(r.survey === true, '⑨a試験の前提: 他の端末の印を引き継げていない → ' + J(r));
    ok(r.touched === false && r.mt !== true && r.u.indexOf('E5101') < 0,
       '★⑨a引き継いだ印だけで「入力あり」にした（まとめて保存の対象になった）→ ' + J(r));
    ok(r.wrote.indexOf('E5101.json') < 0 && r.photos === 'x1,x2', '★⑨a開いただけの戸別を、まとめて保存で書いた（ほかの端末のファイルを置き換えた）→ ' + J(r));
  });
  await scene('⑨b', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      __rows([{ mgmt_no:'E5201', name:'お様', addr:'○市5', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
      await openFromReception(getReceptionRows()[0]); await __sleep(250);     // 開いたまま
      const other = { chosho_mgmt_no:'E5201', work_type:'new', chosho_cust_name:'お様', flyer_done:true, flyer_at:'2026-10-02T10:00',
        editedAt: new Date(Date.now() + 3600e3).toISOString(), _origin:'genba' };
      await flowShareRead([{ name:'E5201.json', file: new File([JSON.stringify(other)], 'E5201.json') }], false);
      await refreshDraftInfo(true);
      const rec = await idbGet('no:E5201');
      return { flyer: !!M.flyer_done, mt: M._touched, touched: rec.touched, u: unsavedTargets(), bar: ((document.getElementById('savebar') || {}).innerText || '') };
    });
    console.log('⑨b開いている戸別に📥', J(r));
    ok(r.flyer === true, '⑨b試験の前提: 開いている戸別に印を引き継げていない → ' + J(r));
    ok(r.mt !== true && r.touched === false && r.u.indexOf('E5201') < 0,
       '★⑨b開いている（開いただけの）戸別に引き継いだ印だけで「入力あり」にした → ' + J(r));
  });

  /* ---------- ⑩ 控えの無い戸別に PCのファイルがあるとき、まとめて保存は聞けないので書かずに残す ---------- */
  const noBaseBody = async ({ ledgerTel, ledgerAddr, mineTel }) => {
    const pc = { chosho_mgmt_no:'N1001', work_type:'new', chosho_cust_name:'PC名', chosho_cust_tel:'090-PC', chosho_cust_addr:'',
      chosho_photos:[ __ph('p1', '#a11'), __ph('p2', '#a22') ], editedAt: new Date().toISOString(), _origin:'main' };
    const dir = __mkdir('リスト', { 'N1001.json': JSON.stringify(pc) }, {}); window.__D = dir;
    __rows([{ mgmt_no:'N1001', name:'PC名', tel: ledgerTel, addr: ledgerAddr || '', date:'', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await __sleep(250);
    const pre = { base: !!fileBaseGet(M), viewOnly: !!M._viewOnly };
    if(mineTel) M.chosho_cust_tel = mineTel;           // この端末で電話を直した
    M.chosho_photos = [ __ph('g0', '#0f0') ]; M._touched = true; await persistDraft();
    __pickerMode = 'return'; __pickerRet = dir; savePlaceOkSet(__P1);
    const s0 = __said.length;
    await saveAllDrafts('unsaved');
    await refreshDraftInfo(true);
    const f = JSON.parse(dir.__files['N1001.json']);
    return { pre, wrote: dir.__wrote.slice(), tel: f.chosho_cust_tel, addr: f.chosho_cust_addr, photos: __pids(f), u: unsavedTargets(), said: __said.slice(s0) };
  };
  await scene('⑩a', { pc:true }, async page => {
    const r = await page.evaluate(noBaseBody, { ledgerTel: '03-LEDGER' });
    console.log('⑩a控えなし・PCのファイルと違う', J(r));
    ok(!r.pre.base && !r.pre.viewOnly, '⑩a試験の前提: 控えが無い・見るだけでない戸別になっていない → ' + J(r.pre));
    ok(r.wrote.length === 0 && r.tel === '090-PC' && r.photos === 'p1,p2',
       '★⑩a控えの無い戸別を、まとめて保存が聞かずに書いた（PCのファイルの電話がこの端末の値になった）→ ' + J(r));
    ok(r.u.indexOf('N1001') >= 0 && r.said.some(s => /PCのファイルを読み込んでいない/.test(s) && /1件ずつ/.test(s) && /N1001/.test(s)),
       '★⑩a書かずに残した戸別を「保存済」にした／1件ずつの保存で聞くと言わない → ' + J([r.u, r.said]));
  });
  await scene('⑩b', { pc:true }, async page => {
    /* PCのファイルの電話は台帳と同じ（PCは台帳から直していない）・この端末で電話を直した／PCのファイルの住所は空・台帳から住所が入った
       → 消える PCの値は無い（変えたのはこの端末だけ）ので、今までどおり読み合わせて書く */
    const r = await page.evaluate(noBaseBody, { ledgerTel: '090-PC', ledgerAddr: '三沢市L町', mineTel: '090-NEW' });
    console.log('⑩b控えなし・消えるPCの値が無い', J(r));
    ok(r.wrote.indexOf('N1001.json') >= 0 && r.tel === '090-NEW' && r.addr === '三沢市L町' && r.photos === 'g0,p1,p2' && r.u.indexOf('N1001') < 0,
       '★⑩b消える PCの値が無い（この端末だけが直した・PCのファイルの欄は空）戸別まで、まとめて保存が書かなくなった → ' + J(r));
  });

  /* ---------- ⑪ 地図の画面で現場用ファイル（受付台帳）を入れたとき、下書きへ入れ直す ---------- */
  await scene('⑪', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      const dir = __mkdir('リスト', {}, {}); window.__D = dir;
      __pickerMode = 'return'; __pickerRet = dir; savePlaceOkSet(__P1);
      const rows0 = [];
      for(let i = 1; i <= 3; i++) rows0.push({ mgmt_no:'L900' + i, name:'様' + i, addr:'○市', tel:'03-OLD', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false });
      __rows(rows0);
      for(const row of getReceptionRows()){ await openFromReception(row); await __sleep(200);
        M.cable_main_len = '1' + row.mgmt_no.slice(-1); M._touched = true; await persistDraft(); }
      await saveAllDrafts('unsaved');
      await refreshDraftInfo(true);
      const u0 = unsavedTargets();
      const rows1 = getReceptionRows().map(x => Object.assign({}, x, x.mgmt_no === 'L9001' ? { tel:'03-NEW' } : {}));
      const set = { type:'antenna_genba_set', ledger:{ type:'antenna_reception_ledger', version:5, rows: rows1, project: __P1,
                    exportedAt:new Date().toISOString(), appVersion:'180' }, map:null };
      await mapImportFile(new File([JSON.stringify(set)], '現場用_試験.json', { type:'application/json' }));
      await __sleep(300);
      await refreshDraftInfo(true);
      const u1 = unsavedTargets();
      const rec = await idbGet('no:L9001');
      dir.__wrote.length = 0;
      await saveAllDrafts('unsaved');
      return { u0, u1, wrote0: Object.keys(dir.__files), recTel: rec.model.chosho_cust_tel, h: handoverOf(draftInfoOf('L9001')),
               wrote: dir.__wrote.slice(), tel: JSON.parse(dir.__files['L9001.json']).chosho_cust_tel };
    });
    console.log('⑪地図の画面で台帳を入れる', J(r));
    ok(r.u0.length === 0 && r.wrote0.length === 3, '⑪試験の前提: 3件を保存済みにできていない → ' + J(r));
    ok(r.recTel === '03-NEW' && r.u1.indexOf('L9001') >= 0,
       '★⑪地図の画面で台帳を入れても、台帳で直った保存済みの戸別が「保存後に変更」に戻らない（下書きへ入れ直さない）→ ' + J(r));
    ok(r.wrote.indexOf('L9001.json') >= 0 && r.tel === '03-NEW', '★⑪台帳の直しが、まとめて保存でPCのファイルに入らない → ' + J(r));
  });

  /* ---------- ⑫ 履歴の ✏️ は直した回数で決める ---------- */
  await scene('⑫', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      const dir = __mkdir('リスト', {}, {}); window.__D = dir;
      await saveDirSet(dir, null); savePlaceOkSet(__P1);
      __rows([{ mgmt_no:'F6001', name:'き様', addr:'○市7', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false },
              { mgmt_no:'F6002', name:'く様', addr:'○市8', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
      const rows = getReceptionRows();
      await openFromReception(rows[0]); await __sleep(250);
      M.cable_main_len = '12'; M._touched = true; saveDraft(); await __sleep(600);
      await __press('btn-save'); try{ saveOverlayHide(); }catch(_){}
      await __sleep(50);
      await openFromReception(rows[1]); await __sleep(250);       // 何も直さずに次の戸別へ
      await openDraftModal(); await __sleep(300);
      const b1 = __dno('F6001');
      closeDraftModal();
      await __open('no:F6001');
      M.cable_main_len = '13'; M._touched = true; saveDraft(); await __sleep(600);
      await openFromReception(rows[1]); await __sleep(250);
      await openDraftModal(); await __sleep(300);
      const b2 = __dno('F6001');
      return { wrote: dir.__wrote.slice(), b1, b2 };
    });
    console.log('⑫履歴の✏️', J(r));
    ok(r.wrote.indexOf('F6001.json') >= 0 && /💾/.test(r.b2 + r.b1 + '💾'), '⑫試験の前提: F6001 を保存できていない → ' + J(r));
    ok(/💾/.test(r.b1) && !/✏️/.test(r.b1), '★⑫保存のあと何も直さずに別の戸別を開いただけで、履歴が ✏️（保存後に変更あり）になった → ' + J(r));
    ok(/✏️/.test(r.b2), '★⑫保存のあと直したのに、履歴に ✏️ が出ない → ' + J(r));
  });

  /* ---------- ⑬ ほかの端末も保存している戸別を、保存先を選ぶ画面で書かない ---------- */
  const otherStart = async () => {
    __rows([{ mgmt_no:'R1001', name:'さ様', addr:'○市', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
    await openFromReception(getReceptionRows()[0]); await __sleep(250);
    window.__other = { chosho_mgmt_no:'R1001', work_type:'new', chosho_cust_name:'さ様', chosho_photos:[ __ph('x1', '#a11'), __ph('x2', '#a22'), __ph('x3', '#a33') ],
      flyer_done:true, flyer_at:'2026-10-02', editedAt: new Date(Date.now() + 3600e3).toISOString(), _origin:'genba' };
    await flowShareRead([{ name:'R1001.json', file: new File([JSON.stringify(__other)], 'R1001.json') }], false);
    M.cable_main_len = '7'; M.chosho_photos = [ __ph('m0', '#0f0') ]; M._touched = true; await persistDraft();
  };
  await scene('⑬a', { pc:true, savePicker:true }, async page => {
    const r = await page.evaluate(async (os) => {
      await eval(os)();
      const other = M._otherFile;
      let written = '';
      /* 保存先を選ぶ画面：選んだ既にあるファイル（ほかの端末の写真3枚）は、ブラウザが空にしてから渡す（Chrome の決まり） */
      window.__savePickerRet = { name:'R1001.json', kind:'file', getFile: async () => ({ text: async () => written }),
        createWritable: async () => ({ write: async b => { written = typeof b === 'string' ? b : await b.text(); }, close: async () => {} }) };
      __plan = ['保存先のファイルに書く'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const sp1 = __savePickerCalls, wr1 = written ? __pids(JSON.parse(written)) : null;
      /* 2つ目の歯止め：確かめの窓を通らずに書く道（saveJsonRun）へ来ても、保存先を選ぶ画面を開かない */
      _lastSaveInfo = null;
      await saveJsonRun();
      return { other, savePicker: sp1, picks: w.picks.map(p => ({ title: p.title, note: p.note, rows: p.rows })), written: wr1,
               direct: { savePicker: __savePickerCalls, written: written ? __pids(JSON.parse(written)) : null, title: (_lastSaveInfo || {}).title || '' } };
    }, '(' + otherStart.toString() + ')');
    console.log('⑬aほかの端末の戸別を保存先を選ぶ画面で', J(r));
    const p = r.picks[0] || {};
    ok(r.other === 'R1001.json' && /ほかの端末も保存しています/.test(p.title || ''), '⑬a試験の前提: ほかの端末の戸別の確かめが出ない → ' + J(r));
    ok(r.savePicker === 0 && r.written === null,
       '★⑬aほかの端末も保存している戸別で、保存先を選ぶ画面を開いた（選んだファイルが空にされ、ほかの端末の写真が消える）→ ' + J(r));
    ok(r.direct.savePicker === 0 && r.direct.written === null && /ほかの端末も保存している/.test(r.direct.title),
       '★⑬a確かめの窓を通らずに書く道へ来たとき、ほかの端末も保存している戸別で保存先を選ぶ画面を開いた → ' + J(r.direct));
    ok(!(p.rows || []).some(t => /^保存先のファイルに書く/.test(t)) && !/写真は消えません/.test(p.note || '')
       && (p.rows || []).some(t => /^📁 保存先のフォルダを選んで書く/.test(t)) && (p.rows || []).some(t => /^📮/.test(t)),
       '★⑬a確かめの窓が「読み合わせるので、写真は消えません」と言う（この道では本当でない）／📁・📮 が無い → ' + J(p));
  });
  await scene('⑬b', { pc:true, savePicker:true }, async page => {
    const r = await page.evaluate(async (os) => {
      await eval(os)();
      const list = __mkdir('リスト', { 'R1001.json': JSON.stringify(__other) }, {}); window.__D = list;
      __pickerMode = 'return'; __pickerRet = list; savePlaceOkSet(__P1);
      __plan = ['📁'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(list, 'R1001.json');
      return { savePicker: __savePickerCalls, picker: w.picker, wrote: w.wrote, photos: __pids(f), title: (w.ov[w.ov.length - 1] || {}).title || '',
               dir: !!_saveDir };
    }, '(' + otherStart.toString() + ')');
    console.log('⑬b📁でフォルダを選んで書く', J(r));
    ok(r.savePicker === 0 && r.picker === 1 && r.wrote.indexOf('R1001.json') >= 0 && r.photos === 'm0,x1,x2,x3' && /^保存しました/.test(r.title) && r.dir,
       '★⑬b「📁 保存先のフォルダを選んで書く」で、そのファイルを読み合わせて書けない（ほかの端末の写真が残らない）→ ' + J(r));
  });

  /* ---------- ⑭ 本当のことだけを言う／PCがあとで直した・消した配線の指定・注記 ---------- */
  const bStart = async (pc0, row) => {
    const dir = __mkdir('リスト', {}, {});
    dir.__files[pc0.chosho_mgmt_no + '.json'] = JSON.stringify(pc0);
    __rows([row]);
    await saveDirSet(dir, null); savePlaceOkSet(__P1); window.__D = dir;
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await __sleep(300);
    return { viewOnly: !!M._viewOnly, base: !!fileBaseGet(M) };
  };
  const pcB = { chosho_mgmt_no:'C3001', work_type:'new', chosho_cust_name:'PC名', chosho_cust_tel:'111', chosho_cust_addr:'住所0',
    chosho_date:'2026-10-01', chosho_time:'09:00', chosho_note:'備考0', chosho_photos:[], antenna_type:'U206',
    cable_main_len:'20', survey_done:true, _origin:'main' };
  const rowB = { mgmt_no:'C3001', name:'PC名', addr:'住所0', tel:'111', date:'2026-10-01', time:'09:00', note:'備考0', status:'in_progress', photos:2, has_dwg:true, work_done:false, survey:true };
  const bothBody = async ({ bs, pc0, row, single }) => {
    pc0.chosho_photos = [ __ph('p1', '#a11'), __ph('p2', '#a22') ];
    const auto = await eval(bs)(pc0, row);
    M.chosho_cust_tel = '222-現場'; M.cable_main_len = '33'; M._touched = true; await persistDraft();
    /* PC があとでファイルを直す：電話・工事日・ケーブル長 */
    const pc1 = JSON.parse(__D.__files['C3001.json']);
    pc1.chosho_cust_tel = '333-PC'; pc1.chosho_date = '2026-10-05'; pc1.cable_main_len = '25';
    __D.__files['C3001.json'] = JSON.stringify(pc1);
    __pickerMode = 'return'; __pickerRet = __D;
    const s0 = __said.length;
    const w = await __watch(async () => { if(single) await __press('btn-save'); else await saveAllDrafts('unsaved'); }, 20000);
    const f = __fileOf(__D, 'C3001.json');
    return { auto, said: __said.slice(s0), ov: w.ov.map(o => o && (o.title + ' / ' + o.msg)), tel: f.chosho_cust_tel, date: f.chosho_date, cable: f.cable_main_len };
  };
  await scene('⑭a', { pc:true }, async page => {
    const r = await page.evaluate(bothBody, { bs: '(' + bStart.toString() + ')', pc0: pcB, row: rowB, single: false });
    console.log('⑭a両方で直した（まとめて保存）', J(r));
    ok(r.auto.base && !r.auto.viewOnly && r.tel === '222-現場' && r.date === '2026-10-05' && r.cable === '33',
       '⑭a試験の前提: 控えを取って読み合わせて書けていない → ' + J(r));
    const t = r.said.filter(s => /^\[知らせ\]/.test(s) && /読み合わせて書いた|中身を残しました/.test(s));
    ok(t.length === 1 && !/消えていません/.test(t[0]) && /この端末の内容にした/.test(t[0]) && /お客様の情報/.test(t[0]) && /ケーブル・配線/.test(t[0]),
       '★⑭aまとめて保存の知らせが、両方で直してこの端末の内容にした欄を言わない（「消えていません」とだけ言う）→ ' + J(r.said));
  });
  await scene('⑭c', { pc:true }, async page => {
    const r = await page.evaluate(bothBody, { bs: '(' + bStart.toString() + ')', pc0: pcB, row: rowB, single: true });
    console.log('⑭c両方で直した（1件の保存）', J(r));
    const o = r.ov[r.ov.length - 1] || '';
    ok(r.auto.base && r.tel === '222-現場' && /^保存しました/.test(o), '⑭c試験の前提: 1件の保存で読み合わせて書けていない → ' + J(r));
    ok(/両方で直していた/.test(o) && /お客様の情報/.test(o) && /この端末の内容にしました/.test(o),
       '★⑭c1件の保存の結果が、両方で直してこの端末の内容にした欄を言わない → ' + J(o));
  });
  await scene('⑭b', { pc:true }, async page => {
    const r = await page.evaluate(async (bs) => {
      const pc0 = { chosho_mgmt_no:'C3101', work_type:'new', chosho_cust_name:'PC名', chosho_date:'2026-10-01',
        chosho_photos:[ __ph('p1', '#a11') ], cable_main_len:'20', survey_done:true,
        wire_overrides:{ e1:'#ff0000', e2:'#00ff00' },
        text_annotations:[{ id:'a1', x:1, y:1, text:'PC注記1', color:'#d32f2f', size:18 }, { id:'a2', x:2, y:2, text:'PC注記2', color:'#d32f2f', size:18 }],
        _origin:'main' };
      const auto = await eval(bs)(pc0, { mgmt_no:'C3101', name:'PC名', date:'2026-10-01', status:'in_progress', photos:1, has_dwg:true, work_done:false, survey:true });
      const loaded = { wo: Object.assign({}, M.wire_overrides), an: (M.text_annotations || []).map(a => a.id) };
      /* この端末：ケーブル長と、配線の指定 e3・注記 a3 を足しただけ（e1・e2・a1・a2 は触らない） */
      M.cable_main_len = '33'; M.wire_overrides.e3 = '#123456';
      M.text_annotations.push({ id:'a3', x:3, y:3, text:'現場注記', color:'#d32f2f', size:18 });
      M._touched = true; await persistDraft();
      /* PC があとで：e1 を直し e2 を消した／a1 を直し a2 を消した */
      const pc1 = JSON.parse(__D.__files['C3101.json']);
      pc1.wire_overrides = { e1:'#0000ff' };
      pc1.text_annotations = [{ id:'a1', x:1, y:1, text:'PC注記1を直した', color:'#d32f2f', size:18 }];
      __D.__files['C3101.json'] = JSON.stringify(pc1);
      __pickerMode = 'return'; __pickerRet = __D;
      await saveAllDrafts('unsaved');
      const f = __fileOf(__D, 'C3101.json');
      return { auto, loaded, wrote: __D.__wrote.slice(), wo: f.wire_overrides, an: (f.text_annotations || []).map(a => a.id + ':' + a.text).sort(), cable: f.cable_main_len,
               mwo: M.wire_overrides, man: (M.text_annotations || []).map(a => a.id + ':' + a.text).sort() };
    }, '(' + bStart.toString() + ')');
    console.log('⑭bPCがあとで直した配線の指定・注記', J(r));
    ok(r.auto.base && r.loaded.wo.e1 === '#ff0000' && r.wrote.indexOf('C3101.json') >= 0 && r.cable === '33',
       '⑭b試験の前提: 控えを取って読み合わせて書けていない → ' + J(r));
    ok(JSON.stringify(r.wo) === JSON.stringify({ e1:'#0000ff', e3:'#123456' }),
       '★⑭bPC があとで直した・消した配線の指定が、この端末が前に読んだ値に戻った（または この端末で足した指定が消えた）→ ' + J(r.wo));
    ok(r.an.join('|') === 'a1:PC注記1を直した|a3:現場注記',
       '★⑭bPC があとで直した・消した図面の注記が、この端末が前に読んだ注記に戻った（または この端末で足した注記が消えた）→ ' + J(r.an));
    ok(r.man.join('|') === 'a1:PC注記1を直した|a3:現場注記' && !('e2' in (r.mwo || {})),
       '★⑭b書いたあと、画面の戸別が書いた中身と違う（次の保存で戻る）→ ' + J([r.mwo, r.man]));
  });

  /* ---------- ⑮ 「ファイルがもう1つ増えます」「上書きします」 ---------- */
  await scene('⑮', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      const dir = __mkdir('リスト', {}, {}); window.__D = dir;
      await saveDirSet(dir, null); savePlaceOkSet(__P1);
      __rows([{ mgmt_no:'S1001', name:'し様', addr:'○市', date:'2026-10-01', status:'in_progress', photos:0, has_dwg:false, work_done:false }]);
      await openFromReception(getReceptionRows()[0]); await __sleep(250);
      M.cable_main_len = '5'; M._touched = true; saveDraft(); await __sleep(600);
      await __press('btn-save'); try{ saveOverlayHide(); }catch(_){}
      const st = saveButtonState();
      const s0 = __said.length;
      await __press('btn-save'); try{ saveOverlayHide(); }catch(_){}
      renderSaveBar();
      return { st, said: __said.slice(s0), title: ((document.getElementById('sb-dest') || {}).title || ''), wrote: dir.__wrote.slice() };
    });
    console.log('⑮もう一度保存の確かめ・保存バー', J(r));
    const a = r.said.find(s => /保存済みです/.test(s)) || '';
    ok(r.st === 'saved' && !!a && r.wrote.length === 2, '⑮試験の前提: 保存済みをもう一度保存する確かめが出ない → ' + J(r));
    ok(!/もう1つ増えます/.test(a) && /ファイルは増えません/.test(a),
       '★⑮フォルダへ書く道（同じ 管理番号.json を書き直す）なのに「同じ戸別のファイルがもう1つ増えます」と言う → ' + J(a));
    ok(!/上書きします/.test(r.title) && /読み合わせてから書き直します/.test(r.title),
       '★⑮保存バーの 📁 の説明が「管理番号.json を上書きします」と言う（読み合わせてから書き直す）→ ' + J(r.title));
  });

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版181（現場入力・組 g-fix）');
})();
