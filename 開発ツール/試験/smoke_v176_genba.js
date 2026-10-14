/* 版176（現場入力）
   Android のタブレット（フォルダを選ぶ画面に Dropbox が出ない）で、その１ の受付台帳を入れたら、
   PCに写真・図面・完了がある戸別が【見るだけ】になり、覚えている「その2」（端末の中のフォルダ）にも書けず、
   「何も書けず、次にできることも無い」で止まっていた。
   版176 では、保存が止まるところには必ず「📮 事務所に預ける」を出す。預けは別の名前
   （管理番号_現場預け_YYYYMMDD-HHMMSS.json）で渡し、★何も上書きしない★。事務所（メイン）が振り分けて1つにまとめる。
   場面ごとに確かめる。
     ⓪ 前提・預けの名前（先頭・末尾に固定しない＝端末が名前の後ろに足しても預けと分かる）・読む名前・共有の分け方
     ① 見るだけ → 保存 → 窓のいちばん上が 📮 → 📤 共有：預けの名前・_side の中身・写真・その2 には書かない・控えを取らない
     ② 📮 → 📁「その2」に置く（同じ戸別のファイルがある）：元のファイルはそのまま・読み返す・「📤 共有でも渡す」
     ③ 同じ名前があれば -2（1回目はそのまま）。名前が空いて見えても中身のあるファイルは書き替えない
     ④ 共有できない・フォルダも無い端末 → ⬇ ダウンロード
     ⑤ 共有をやめた・保存先を選ぶ画面を閉じた → 黙らない（「保存をやめました」＋📮）
     ⑥ 書く許可が取れない → 結果の窓に 📮 → 押す → 共有（フォルダのファイルはそのまま）
     ⑦ 書けない ⑧ 読めない ⑨ 読み返しが合わない → どれも結果の窓に 📮
     ⑩ 写真の歯止め：見るだけの預けは止めない（足りない写真の枚数を _side.lacks に書く）／いつもの名前の保存は今までどおり止める（＋📮）
     ⑪ 帯の「📮 入力して事務所に預ける」（預けモード）：保存はいつも預け／📂 でPCのファイルを読むと、いつもの保存に戻る
     ⑫ 預けモードで保存するたびに、覚えているフォルダの PCのファイル（らしいもの）を探して、あれば戻る
     ⑬ 預けを 📂 で開いても見るだけは外れない（預けモードになる）・控えを取らない・_side を持ち越さない
     ⑭ _side がいつもの名前のファイルに入らない（預けを開いて保存／フォルダのファイルに _side があった）・_sideMerged は残す
     ⑮ 読む道は預けを使わない（名前でも中身でも）・見るだけを外さない
     ⑯ PCのファイルらしくない写し（写真が台帳より少ない・完了の印が無い）では見るだけを外さない。本物なら外す
     ⑰ まとめて保存：見るだけの戸別はいつもの名前で書かない → 最後の知らせ → 📮 → 共有
     ⑱ まとめて保存：フォルダに本物のPCのファイルがあれば、今までどおり読み合わせて書く（預けに回さない）
        ※ 版175 と同じ動き（変えていないことの確かめ）。見るだけの判定を「読んだあと」に決めるのが崩れると赤くなる
     ⑲ まとめて保存：フォルダを選ぶ画面を閉じた・エラー・物件が違うフォルダでやめた → 黙らず「📮 まとめて事務所に預ける」
        （閉じたときは「📤 フォルダを覚えるのをやめる」も。押すまで何も書かない・渡さない）
        ⑲c フォルダを覚えていないときの「📤 フォルダを選ばずに、共有で渡す」→ そのまま共有で渡す（「覚えるのをやめました」と言わない）
     ⑳ 保存バーの 📁 → 閉じる → 「フォルダを覚えるのをやめる」→ 保存は共有（預けの名前）。フォルダを選び直すと戻る。
        ⑳b 取り込みのあとの「保存先が物件と違う」窓にも「📤 フォルダを覚えるのをやめて、共有で渡す」
        ⑳c フォルダを選ぶ窓が開けない端末の「入れる場所の名前」の窓にも「📤 フォルダを覚えるのをやめる」
     ㉑ 共有で渡す道でも、PCのファイルを読んだ戸別はいつもの名前で渡す
     ㉒ 別の戸別のファイル（読み合わせを止めた）→ 「保存しました」と言わない＋📮。結果の無い保存で緑の「保存しました」を出さない
     ㉓ この端末で何も入力していない見るだけの戸別 → 「渡すものはありません」（📮 を出さない・何も渡さない）
     ㉔ 保存先が受付台帳の物件と違う（その2）→ いつもの名前で書かず、預けの名前で置く
     ㉕ 履歴の「📮 選んで事務所に預ける（保存済みも）」・📮 の印（履歴・台帳の一覧）・消すときの知らせ
     ㉖ ほかの端末が保存した戸別 → 窓に 📮 → 預けても、ほかの端末のファイルの印は消さない
     ㉗ 共有は1回10件まで（続きは「📤 次の N件を共有（2/2）」）・共有に失敗したら窓に戻る（⬇ を選べる）
     ㉘ 直した欄（touched）：PCのファイルを読んだときは直した欄だけ・端末の中だけのフォルダに書いたあとは前に入れた欄も・台帳に無い戸別は proj が空
     ㉙ 文言：「このまま新しく入力する」の確かめが「PCのファイルから消えます」と言い切らない・見るだけの窓の 📁 は リスト のときだけ
     ㉛ 帯の「📁 PCのフォルダから読み込む」で見つからない → 「📮 事務所に預ける」「📂」を出す（PCらしくない写しならそのわけも）
     ㉜ 見るだけの窓の「📂」＝ファイルを選ぶ画面を開く／「📁」＝フォルダを選んで読み込めたら、そのまま保存する
     ㉚ 幅375px・320px：預けの窓（長い管理番号も）・保存バー（共有で渡す）・預けモードの帯・結果の窓・履歴のボタンが横にはみ出さない
        ㉚d まとめて保存の「閉じた」窓・端末の中のフォルダに書いたあとの知らせ
     ── 第2回の直し ──
     ㉝ 📮 で渡しているあいだに入った写真を、下書きから消さない（渡す前に読んだ写しで書き戻さない・その写真まで渡した扱いにしない）
     ㉞ 共有で渡す道：PCのファイルを読んでいない戸別は、どこに書いたあとでも預けの名前（「リスト」という名前のフォルダでも）。
        📂 で読んだあとは、端末の中のフォルダに書いたあとも いつもの名前（読んだ中身を受け継ぐ）。直した欄は、書く前に入れた欄も入れる。
        まとめて保存（共有で渡す道）も同じ。渡しているあいだに入った写真を消さない
        ㉞e 「リスト」に書いただけ → フォルダを覚えるのをやめる → 保存・まとめて保存 → 預けの名前
        ㉞f 同じく → 共有をやめた → 📮 の預けの直した欄に、「リスト」に書く前に入れた欄も入る
     ㉟ 事務所でまとめた覚え（_sideMerged）を、共有で渡す いつもの名前のファイルにも残す（預けには入れない）
     ㊱ まとめて保存で共有の画面を閉じた → 「保存をやめました（何も書いていません）」＋📮（iPhone も）
     ㊲ 「それでも、このまま保存しますか？」→ いいえ → 黙らず 📮（覚えているフォルダの道・保存先を選ぶ画面の道）
     ㊳ 見るだけの帯が「保存すると…PCのファイルから消えます」と言わない
     ㊴ 端末の中だけかもしれないフォルダ（その2）への いつもの保存 → 勝手に閉じず ⚠＋「📮 事務所にも届ける」（まとめて保存も）
        まとめて保存の「あとで」は、「まとめて保存」ではなく 履歴 の「📮 選んで事務所に預ける」を言う（書いた戸別は保存済みになる）
     ㊵ 同じ戸別の別名ファイル（「2612MKM013 2.json」）に写真・完了があれば、本物のPCのファイルとして読む（1件・まとめて）
     ── 第3回の直し ──
     ㊶ PC版のサイトを開いている Android タブレット（名前は「X11; Linux x86_64」・指で触れる）も Android と見る
        （「リスト」に書いても ⚠＋「📮 事務所にも届ける」。まとめて保存も）・Windows／Mac／Linux のPC・Chromebook は今までどおり
     ㊷ 書いたあとの控えを当てにするのは、今の保存先そのもの（印が同じ）で、端末の中だけかもしれないフォルダでないときだけ
        （Android の「リスト」に書いた → 許可が取れない → 📮 の直した欄に、前に入れた欄も入る／PCで別の「リスト」を選び直したあとも）
     ㊸ 📂・PCのフォルダから読んだファイルが PCのファイルらしくない（写真が台帳より少ない）ときは、PCのファイルを読んだことにしない
        （共有で渡す道で いつもの名前にしない）。別名ファイルにしかない写真も写真の歯止めに入れる
     ㊹ フォルダに書いたときに足した「事務所でまとめた覚え」（_sideMerged）を、そのあと共有で渡すファイルにも残す
     ㊺ 共有で渡す道の案内（保存バー・フォルダを覚えるのをやめた知らせ・保存のあとの案内・取り込みのあとの窓）は Dropbox で見つかる名前（その１ ＞ リスト）
     ㊻ 共有の画面が出ているあいだに中身が変わった（写真の取り込みが終わった）いま開いている戸別は「保存済」にしない（まとめて保存・1件の保存）
     ── 第4回の直し ──
     ㊼ 1件の保存（共有）：保存が下書きを書いているあいだ（渡す中身を作ったあと）に入った写真も「渡した」にしない（渡す中身の指紋は作ったときに取る）
     ㊽ 保存の途中で入った写真（書いた・入れたファイルに無い）があれば「保存済」にしない・そう言う。もう一度押せば渡る
        ㊽a PCの「その１ ＞ リスト」に書く道 ㊽b 保存先を選ぶ画面の道 ㊽c ダウンロードの道 ㊽d まとめて保存（フォルダ）
     ㊾ iPhone（フォルダを選べない・保存はいつも共有）も、入れる場所は Dropbox で見つかる名前（その１ ＞ リスト）で言う
        （保存バー・保存中の「入れる所」・保存のあとの★入れる場所★・📮 の説明が同じ名前）
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   端末＝Android のタブレット（フォルダを選ぶ窓はあるが閉じる＝Dropbox が出ない・共有はできる・保存先を選ぶ窓は無い）。
   ★場面ごとに、PC か タブレットかを はっきりさせる★（第3回）既定＝PC版のサイトを開いた Android タブレット
   （名前は「X11; Linux x86_64」・指で触れる＝isAndroidLike）。{ ua:'android' } … 名前に Android。
   { pc:true } … Windows のPC（指で触れない）。PCの「リスト」に書いたときの動き（⚠ を出さない・控えを当てにする）はこちらで見る。
   { ua:'iphone' } … iPhone（フォルダを選ぶ窓が無い・共有はできる）（第4回）。
   使い方: node smoke_v176_genba.js [index.html の file:// URL]
           SCENE=①,⑰ node smoke_v176_genba.js   … 名前にその字が入る場面だけ（⓪ はいつも走る） */
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
const ONLY = String(process.env.SCENE || '').split(',').map(s => s.trim()).filter(Boolean);

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

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errs = [];
  /* 場面ごとに新しい入れ物で開く（覚え書きを持ち越さない） */
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
    return { ctx, page };
  }
  /* 1つの場面。途中で止まっても、ほかの場面は続ける */
  async function scene(name, cfg, fn){
    if(ONLY.length && name !== '⓪' && !ONLY.some(s => name.indexOf(s) >= 0)) return;
    let c = null;
    try{ c = await fresh(name, cfg); await fn(c.page); }
    catch(e){ fails.push('試験が途中で止まった（' + name + '）→ ' + ((e && e.message) || e)); }
    finally{ if(c) await c.ctx.close().catch(()=>{}); }
  }
  const J = o => String(JSON.stringify(o)).slice(0, 1400);
  const last = a => (a && a.length) ? a[a.length - 1] : {};
  const side = t => { try{ return JSON.parse(t); }catch(_){ return null; } };

  /* ---------- ⓪ 前提・預けの名前 ---------- */
  await scene('⓪', {}, async page => {
    const r0 = await page.evaluate(() => ({
      ver: APP_VERSION,
      f: ['receptionSaveRows','saveDirSet','saveDirChange','renderSaveBar','saveAllDrafts','persistDraft','freshModel','ensureModelShape',
          'render','uiPickName','openFromReception','saveJson','saveJsonRun','saveOverlayDone','pcGuardBeforeSave','pcGuardAutoLoad',
          'readExistingCaseFiles','caseNameRe','loadStateInto','buildStateOf','fileBaseGet','pbaseSet','pbaseIds','openDraftModal',
          'markDraftSaved','saveDirCountCases','caseFileFromDir','photoGateStop','mergeIntoState','savePlaceCheckAfterImport',
          'renderReceptionList','saveDraft','saveButtonState','pcGuardForceAsk'].filter(n => typeof window[n] !== 'function'),
      f176: ['isSideName','isSideData','sideTimeTag','sideFileName','sideTouched','sideStamp','sideBuild','sideWriteDir','sideChunks',
             'sideShareChunks','sideAskDeliver','sideSaveFlow','sideShowResult','sideEscapeRun','saveCancelInfo','markDraftSidedFor',
             'saveRoute','saveRouteSet','saveDirForget','saveDirAfterBack','pcHitLooksPc','pcGuardSideMode','sideModeTryReturn',
             'pcGuardDirUseful','pcGuardLoadMissAsk','bulkSideOffer','saveShareAsSide'].filter(n => typeof window[n] !== 'function'),
      f176c: ['isAndroidLike','saveDirMaybeDevice','sideBaseTrusted','saveHintShowParts','saveHintShowLabel','saveStale','photosMissing']
             .filter(n => typeof window[n] !== 'function'),
      re: (typeof SIDE_NAME_RE !== 'undefined') ? [SIDE_NAME_RE.source, SIDE_NAME_RE.flags] : null
    }));
    console.log('⓪前提', JSON.stringify(r0));
    ok(r0.f.length === 0, '試験の前提: 無い関数がある → ' + r0.f.join(' / '));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    ok(r0.f176.length === 0, '★版176 の関数が無い → ' + r0.f176.join(' / '));
    ok(r0.f176c.length === 0, '★版176（第3回）の関数が無い → ' + r0.f176c.join(' / '));
    if(r0.f.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }
    /* ★メインと取り決めた預けの名前★ 先頭・末尾に固定しない（Android の「_1」・Dropbox の「 (1)」・共有の「.json.txt」） */
    ok(r0.re && r0.re[0] === '_(現場預け|振り分け)_\\d{8}-\\d{6}' && r0.re[1] === '',
       '★預けの名前の決まり（SIDE_NAME_RE）がメインと取り決めた形でない → ' + JSON.stringify(r0.re));
    const NAMES = [
      ['2612MKM013_現場預け_20261014-091812.json', true, false], ['2612MKM013_現場預け_20261014-091812-2.json', true, false],
      ['2612MKM013_現場預け_20261014-091812_1.json', true, false], ['2612MKM013_現場預け_20261014-091812 (1).json', true, false],
      ['2612MKM013_現場預け_20261014-091812.json.txt', true, false], ['2612MKM013_現場預け_20261014-091812.json (1).txt', true, false],
      ['2612MKM013_振り分け_20261014-091812.json', true, false],
      ['2612MKM013.json', false, true], ['2612MKM013 (1).json', false, true], ['2612MKM013.json.txt', false, true],
      ['2612MKM013_1.json', false, true], ['2612MKM013_現場預け.json', false, true], ['現場用_その１.json', false, false]
    ];
    const r1 = await page.evaluate(ns => ns.map(n => [
      (typeof isSideName === 'function') ? isSideName(n[0]) : null,
      caseNameRe('2612MKM013').test(n[0]) ]), NAMES);
    const bad1 = NAMES.filter((n, i) => r1[i][0] !== n[1]).map(n => n[0] + '→' + !n[1]);
    const bad2 = NAMES.filter((n, i) => r1[i][1] !== n[2]).map(n => n[0] + '→' + !n[2]);
    console.log('⓪名前', JSON.stringify(r1));
    ok(bad1.length === 0, '★預けの名前を見分けられない（端末が後ろに足した名前も預け）→ ' + bad1.join(' ｜ '));
    ok(bad2.length === 0, '★その戸別のファイルとして読む名前に、預けが入る（またはいつもの名前が外れる）→ ' + bad2.join(' ｜ '));
    const r2 = await page.evaluate(() => {
      if(typeof sideFileName !== 'function') return null;
      const d = new Date(2026, 9, 14, 9, 18, 12);
      const it = n => ({ bytes: n });
      const sz = a => sideChunks(a).map(c => c.length).join(',');
      return { a: sideFileName('２６１２ＭＫＭ０１３', d), b: sideFileName('', d),
               c12: sz(Array.from({ length:12 }, () => it(1024))), c30: sz([it(30e6), it(30e6), it(30e6)]), c20: sz([it(20e6), it(20e6)]),
               side: isSideData({ _side:{ v:1 } }), plain: isSideData({ chosho_mgmt_no:'X' }) };
    });
    console.log('⓪作る名前', JSON.stringify(r2));
    ok(r2 && r2.a === '2612MKM013_現場預け_20261014-091812.json' && r2.b === '戸別_現場預け_20261014-091812.json',
       '★預けの名前の作り方が違う（全角の管理番号・管理番号なし）→ ' + JSON.stringify(r2));
    ok(r2 && r2.c12 === '10,2' && r2.c30 === '1,1,1' && r2.c20 === '2',
       '★1回の共有に入れる数（10件・45MB まで）で分けていない → ' + JSON.stringify(r2));
    ok(r2 && r2.side === true && r2.plain === false, '★中身の _side で預けと分からない → ' + JSON.stringify(r2));
  });

  /* ---------- ① 見るだけ → 保存 → 📮 → 📤 共有 ---------- */
  await scene('①', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state();
      __plan = ['📮', '📤'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { st, w: Object.assign({}, w, { sharedTexts: w.sharedTexts.length }), side: j && j._side, photos: __pids(j), no: j && j.chosho_mgmt_no,
               note: j && j.chosho_note, tag: (j && j._side) ? __tagOf(j._side.at) : '',
               base: !!fileBaseGet(M), fromCase: !!M._fromCaseFile, sideAt: !!M._sideAt, sideHow: M._sideHow || '', bar: __bar(), viewOnly: !!M._viewOnly,
               label: ((document.getElementById('btn-save') || {}).textContent || '').trim(), pb: (await pbaseIds('2612MKM013')).length,
               files: Object.keys(__D.__files) };
    });
    console.log('①見るだけ→📮→共有', J(r));
    const p0 = r.w.picks[0] || {}, p1 = r.w.picks[1] || {};
    ok(r.st.viewOnly === true, '試験の前提: その１ の台帳で 2612MKM013 が見るだけになっていない → ' + J(r.st));
    ok(/見るだけ/.test(p0.title || '') && /^📮/.test((p0.rows || [])[0] || ''),
       '★見るだけで保存を押したとき、窓のいちばん上が「📮 事務所に預ける」でない（知らせだけで止まる）→ ' + J(p0));
    ok(!(p0.rows || []).some(t => /^📁/.test(t)),
       '★親もリストも無い端末の中のフォルダ（その2）なのに「📁 PCのフォルダから読み込む」を出した（探しても見つからない）→ ' + J(p0.rows));
    ok(/事務所に預ける/.test(p1.title || '') && /2612MKM013_現場預け_\d{8}-\d{6}\.json/.test(p1.note || '') && /書き替えません/.test(p1.note || ''),
       '★預けの窓に、別の名前と「PCのファイルは書き替えません」が出ない → ' + J(p1));
    ok(r.w.shared === 1 && SIDE13.test(r.w.sharedNames[0] || ''), '★預けの名前（管理番号_現場預け_日時.json）で共有していない → ' + J(r.w.sharedNames));
    ok(r.side && r.side.v === 1 && r.side.why === 'viewonly' && r.side.proj === P1 && r.side.ledger === P1 && r.side.place === 'その2'
       && r.side.app === WANT_VER && r.side.base === null && r.side.lacks === 0,
       '★預けの印（_side）の中身が取り決めと違う → ' + J(r.side));
    ok(r.side && r.tag && (r.w.sharedNames[0] || '').indexOf('_' + r.tag + '.json') > 0,
       '★_side.at と名前の日時が合わない → ' + J([r.side && r.side.at, r.tag, r.w.sharedNames[0]]));
    ok(r.side && Array.isArray(r.side.touched) && r.side.touched.indexOf('chosho_note') >= 0 && r.side.touched.indexOf('chosho_cust_name') < 0
       && r.side.touched.indexOf('chosho_photos') < 0,
       '★直した欄（touched）に、この端末で入れた備考が無い／台帳から入れた氏名・写真が入る → ' + J(r.side && r.side.touched));
    ok(r.photos === 't1' && r.no === '2612MKM013' && r.note === '現場メモ 追記', '★預けに この端末の写真・入力が入っていない → ' + J([r.photos, r.no, r.note]));
    ok(r.w.wrote.length === 0 && r.files.length === 0, '★共有を選んだのに「その2」に書いた → ' + J(r.w.wrote));
    ok(!r.base && !r.fromCase && r.pb === 0, '★預けで控え・写真IDの副本を取った／PCのファイルを読んだことにした（見るだけが外れる元）→ ' + J([r.base, r.fromCase, r.pb]));
    ok(r.viewOnly === true, '★預けたら見るだけが外れた → ' + r.viewOnly);
    ok(r.sideAt && r.sideHow === 'share' && /📮 預け済/.test(r.bar.all) && /預け済み/.test(r.label),
       '★預けた印（保存バーの「📮 預け済」・ボタンの「✓ 預け済み」）が出ない → ' + J([r.sideAt, r.sideHow, r.bar.all, r.label]));
    ok(/事務所に預けました/.test(last(r.w.ov).title || '') && /書き替えていません/.test(last(r.w.ov).msg || ''),
       '★結果の窓に「📮 事務所に預けました」「PCのファイル…は書き替えていません」が出ない → ' + J(r.w.ov));
  });

  /* ---------- ② 📮 → 📁「その2」に置く（同じ戸別のファイルがある） ---------- */
  await scene('②', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pcFile());
      await __state({ files: { '2612MKM013.json': txt } });
      const vo = !!M._viewOnly;
      __plan = ['📮', '📁'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const names = __sideNames(__D);
      const j = names[0] ? __fileOf(__D, names[0]) : null;
      const sideTxt = names[0] ? __D.__files[names[0]] : '';
      const btn = __overlay();
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      return { vo, w, names, same: __D.__files['2612MKM013.json'] === txt, side: j && j._side, photos: __pids(j), btn, w2,
               same2: __D.__files['2612MKM013.json'] === txt, sideSame: names[0] ? __D.__files[names[0]] === sideTxt : false,
               fromCase: !!M._fromCaseFile, base: !!fileBaseGet(M), how: M._sideHow };
    });
    console.log('②その2に置く', J(r));
    ok(r.vo === true, '試験の前提: PCらしくない写し（写真3枚）で見るだけが外れた');
    ok(r.names.length === 1 && SIDE13.test(r.names[0]) && r.same === true,
       '★預けを置いていない／その2 の 2612MKM013.json を書き替えた → ' + J([r.names, r.same]));
    ok(r.side && r.side.why === 'viewonly' && r.photos === 't1', '★置いた預けの中身が違う → ' + J([r.side, r.photos]));
    ok(/共有でも渡す/.test(r.btn) && last(r.w.ov).escape === 'share-also' && /この端末の中だけのフォルダなら/.test(last(r.w.ov).msg || ''),
       '★フォルダに置いたあと「📤 共有でも渡す」と、端末の中だけのフォルダなら届かない知らせが無い → ' + J([r.btn, r.w.ov]));
    ok(r.w2.shared === 1 && r.w2.sharedNames[0] === r.names[0] && r.same2 && r.sideSame,
       '★「📤 共有でも渡す」で、置いた預けと同じものを共有しない／ファイルが変わった → ' + J([r.w2.sharedNames, r.same2, r.sideSame]));
    ok(!r.fromCase && !r.base && r.how === 'share', '★フォルダに預けたあと、控えを取った／PCのファイルを読んだことにした → ' + J([r.fromCase, r.base, r.how]));
  });

  /* ---------- ③ 同じ名前があれば -2。中身のあるファイルは書き替えない ---------- */
  await scene('③', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      const it = await sideBuild(M, 'viewonly', new Date(2026, 9, 14, 9, 18, 12));
      const a = await sideWriteDir(__D, it);
      const first = __D.__files[it.name];
      const b2 = await sideWriteDir(__D, it);
      /* 名前を聞くと「無い」と言うのに、作ると中身が入っている（同期中のファイルなど）→ その名前は使わない */
      const g = __mkdir('その2', { '2612MKM013_現場預け_20261014-091812.json': 'PCが置いた中身' }, {});
      g.__ghost['2612MKM013_現場預け_20261014-091812.json'] = true;
      const c = await sideWriteDir(g, it);
      return { a, b: b2, same: __D.__files[it.name] === first, firstOk: (function(){ try{ return JSON.parse(first)._side.why; }catch(_){ return null; } })(),
               c, ghost: g.__files['2612MKM013_現場預け_20261014-091812.json'], gnames: Object.keys(g.__files) };
    });
    console.log('③-2', J(r));
    ok(r.a.ok && r.a.name === '2612MKM013_現場預け_20261014-091812.json' && r.firstOk === 'viewonly', '試験の前提: 1回目を置けない → ' + J(r.a));
    ok(r.b.ok && r.b.name === '2612MKM013_現場預け_20261014-091812-2.json' && r.same,
       '★同じ名前があるのに -2 にしない／1回目のファイルを書き替えた → ' + J([r.b, r.same]));
    ok(r.c.ok && r.c.name === '2612MKM013_現場預け_20261014-091812-2.json' && r.ghost === 'PCが置いた中身',
       '★名前が空いて見えても、作ったら中身のあったファイルを書き替えた → ' + J([r.c, r.ghost]));
  });

  /* ---------- ④ 共有できない・フォルダも無い → ⬇ ダウンロード ---------- */
  await scene('④', { noShare:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true });
      __plan = ['📮', '⬇'];
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w, how: M._sideHow };
    });
    console.log('④ダウンロード', J(r));
    const p1 = r.w.picks[1] || {};
    ok(p1.rows && !p1.rows.some(t => /共有/.test(t)) && !p1.rows.some(t => /^📁/.test(t)) && p1.rows.some(t => /^⬇/.test(t)),
       '★共有できない・フォルダも無い端末で、預けの窓の並びが違う（⬇ だけのはず）→ ' + J(p1));
    ok(r.w.dl.length === 1 && SIDE13.test(r.w.dl[0]) && r.how === 'dl', '★ダウンロードに入れていない → ' + J([r.w.dl, r.how]));
    ok(/ダウンロードに入れました/.test(last(r.w.ov).title || ''), '★ダウンロードの結果を言わない → ' + J(r.w.ov));
  });

  /* ---------- ⑤ 共有をやめた／保存先を選ぶ画面を閉じた → 黙らない ---------- */
  await scene('⑤a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true, no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true;
      __shareMode = 'abort';
      const w = await __watch(() => __press('btn-save'), 15000);
      const btn = __overlay();
      __shareMode = 'ok'; __plan = ['📤'];
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { w, btn, w2, why: j && j._side && j._side.why };
    });
    console.log('⑤a共有をやめた', J(r));
    const ov = last(r.w.ov);
    ok(/保存をやめました/.test(ov.title || '') && /何も書いていません/.test(ov.title || '') && ov.escape === 'cancel' && /事務所に預ける/.test(r.btn),
       '★共有をやめたとき黙った／「📮 別の名前で事務所に預ける」が無い → ' + J([r.w.ov, r.btn]));
    ok(r.w2.shared === 1 && SIDE14.test(r.w2.sharedNames[0] || '') && r.why === 'cancel', '★結果の窓の 📮 で預けられない → ' + J([r.w2.sharedNames, r.why]));
  });
  await scene('⑤b', { savePicker:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true, no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true;
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w, btn: __overlay(), sp: __savePickerCalls };
    });
    console.log('⑤b保存先を選ぶ画面を閉じた', J(r));
    const ov = last(r.w.ov);
    ok(r.sp === 1, '試験の前提: 保存先を選ぶ画面が出ていない → ' + r.sp);
    ok(/保存をやめました/.test(ov.title || '') && ov.escape === 'cancel' && /事務所に預ける/.test(r.btn),
       '★保存先を選ぶ画面を閉じたとき黙った／📮 が無い → ' + J([r.w.ov, r.btn]));
  });

  /* ---------- ⑥ 書く許可が取れない → 📮 → 共有（フォルダのファイルはそのまま） ---------- */
  await scene('⑥', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pcFull());
      const st = await __state({ dirName:'リスト', files: { '2612MKM013.json': txt } });
      __D.__perm = 'prompt'; __D.__req = 'denied';
      const w = await __watch(() => __press('btn-save'), 15000);
      const btn = __overlay();
      __plan = ['📤'];
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { st, w, btn, w2, why: j && j._side && j._side.why, photos: __pids(j), same: __D.__files['2612MKM013.json'] === txt };
    });
    console.log('⑥許可が取れない', J(r));
    const ov = last(r.w.ov);
    ok(r.st.viewOnly === false && r.st.fromCase === true, '試験の前提: リストの本物のPCのファイルを読んでいない → ' + J(r.st));
    ok(/許可が取れない/.test(ov.title || '') && ov.escape === 'perm' && /事務所に預ける/.test(r.btn),
       '★書く許可が取れないとき、結果の窓に 📮 が無い → ' + J([r.w.ov, r.btn]));
    ok(r.w2.shared === 1 && SIDE13.test(r.w2.sharedNames[0] || '') && r.why === 'perm' && r.w2.wrote.length === 0 && r.same,
       '★📮 で預けられない／フォルダに書いた → ' + J([r.w2.sharedNames, r.why, r.w2.wrote, r.same]));
    ok(r.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1', '★預けに PCの写真と この端末の写真がそろっていない → ' + r.photos);
  });

  /* ---------- ⑦ 書けない ⑧ 読めない ⑨ 読み返しが合わない → 📮 ---------- */
  await scene('⑦', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pc14());
      await __state({ dirName:'リスト', no:'2612MKM014', files: { '2612MKM014.json': txt } });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      __D.__failWrite = true;
      const w = await __watch(() => __press('btn-save'), 15000);
      const btn = __overlay();
      __plan = ['📤'];
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { w, btn, w2, why: j && j._side && j._side.why, same: __D.__files['2612MKM014.json'] === txt };
    });
    console.log('⑦書けない', J(r));
    const ov = last(r.w.ov);
    ok(/書けなかった/.test(ov.title || '') && ov.escape === 'write' && /事務所に預ける/.test(r.btn), '★書けないとき、結果の窓に 📮 が無い → ' + J([r.w.ov, r.btn]));
    ok(r.w2.shared === 1 && SIDE14.test(r.w2.sharedNames[0] || '') && r.why === 'write' && r.same, '★書けないあとの 📮 で預けられない → ' + J([r.w2.sharedNames, r.why]));
  });
  await scene('⑧', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pc14());
      await __state({ dirName:'リスト', no:'2612MKM014', files: { '2612MKM014.json': txt } });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      __D.__unread = { '2612MKM014.json': true };
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w, btn: __overlay(), same: __D.__files['2612MKM014.json'] === txt };
    });
    console.log('⑧読めない', J(r));
    const ov = last(r.w.ov);
    ok(ov.escape === 'unread' && /事務所に預ける/.test(r.btn) && r.same && r.w.wrote.length === 0,
       '★ファイルを読めないとき、結果の窓に 📮 が無い（または書いた）→ ' + J([r.w.ov, r.btn, r.w.wrote]));
  });
  await scene('⑨', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト', no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      __D.__corrupt = true;
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w, btn: __overlay() };
    });
    console.log('⑨読み返しが合わない', J(r));
    const ov = last(r.w.ov);
    ok(ov.escape === 'verify' && /事務所に預ける/.test(r.btn), '★読み返しが合わないとき、結果の窓に 📮 が無い → ' + J([r.w.ov, r.btn]));
  });

  /* ---------- ⑩ 写真の歯止め：預けは止めない／いつもの名前は止める ---------- */
  await scene('⑩', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true, pbase: ['pc1', 'pc2', 'pc3', 't1'] });
      __plan = ['📮', '📤'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      /* 「このまま新しく入力する」→ 保存（いつもの名前）→ 写真が減るので止める（＋📮） */
      __click('pcg-force'); await __sleep(600);
      M.chosho_note = 'このまま入力'; M._touched = true; saveDraft(); await __sleep(300);
      const w2 = await __watch(() => __press('btn-save'), 15000);
      return { w: { shared: w.shared, names: w.sharedNames, ov: w.ov }, lacks: j && j._side && j._side.lacks, why: j && j._side && j._side.why,
               photos: __pids(j), vo: !!M._viewOnly, w2, btn: __overlay() };
    });
    console.log('⑩写真の歯止め', J(r));
    ok(r.w.shared === 1 && SIDE13.test(r.w.names[0] || '') && r.lacks === 3 && r.photos === 't1',
       '★PCの写真が足りない戸別でも預けは止めない・足りない枚数（_side.lacks=3）を書く → ' + J(r.w));
    ok(/この端末に無い写真が 3枚/.test(last(r.w.ov).msg || ''), '★預けの結果に、PCにだけある写真の枚数を言わない → ' + J(r.w.ov));
    ok(r.vo === false, '試験の前提: 「このまま新しく入力する」で入力できるようにならない');
    const ov2 = last(r.w2.ov);
    ok(r.w2.shared === 0 && /写真が減る/.test(ov2.title || '') && ov2.escape === 'photo' && /事務所に預ける/.test(r.btn),
       '★いつもの名前の保存で、写真の歯止めが効かない／📮 が無い → ' + J([r.w2.sharedNames, r.w2.ov, r.btn]));
  });

  /* ---------- ⑪ 預けモード ---------- */
  await scene('⑪', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      const vo0 = !!M._viewOnly;
      const order = Array.from(document.querySelectorAll('#pcguard .pcg-btns button')).map(x => x.id);
      __click('pcg-side'); await __sleep(500);
      const mode = { sideOnly: !!M._sideOnly, viewOnly: !!M._viewOnly, band: ((document.getElementById('pcguard') || {}).innerText || '').replace(/\s+/g, ' '),
                     bar: __bar().all, said: __said.slice(-1)[0] || '' };
      M.chosho_note = '預けモードで書いた'; saveDraft(); await __sleep(500);
      __plan = ['📤'];
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      const canon1 = '2612MKM013.json' in __D.__files;
      await __import(__pcFull());
      const after = { sideOnly: !!M._sideOnly, viewOnly: !!M._viewOnly, fromCase: !!M._fromCaseFile, bar: __bar().all };
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(__D, '2612MKM013.json');
      return { vo0, order, mode, w: { shared: w.shared, names: w.sharedNames, picks: w.picks }, why: j && j._side && j._side.why, note: j && j.chosho_note,
               canon1, after, w2: { shared: w2.shared, wrote: w2.wrote, ov: w2.ov }, file: f && { photos: __pids(f), note: f.chosho_note, side: ('_side' in f) } };
    });
    console.log('⑪預けモード', J(r));
    ok(r.vo0 === true, '試験の前提: 見るだけになっていない');
    ok(r.order.indexOf('pcg-side') >= 0 && r.order.indexOf('pcg-side') === r.order.indexOf('pcg-load') + 1,
       '★帯に「📮 入力して事務所に預ける」が無い（または「📂」のすぐ後でない）→ ' + J(r.order));
    ok(/別の名前/.test(r.mode.said) && /書き替えません/.test(r.mode.said), '★預けモードの確かめで、別の名前で渡すと言わない → ' + r.mode.said);
    ok(r.mode.sideOnly && !r.mode.viewOnly && /預けモード/.test(r.mode.band) && /預けモード/.test(r.mode.bar),
       '★預けモードにならない（帯・保存バーに「📮 預けモード」が出ない）→ ' + J(r.mode));
    ok(r.w.shared === 1 && SIDE13.test(r.w.names[0] || '') && r.why === 'mode' && r.note === '預けモードで書いた' && r.canon1 === false,
       '★預けモードの保存が預けにならない（いつもの名前で書いた）→ ' + J([r.w, r.why, r.canon1]));
    ok(!(r.w.picks[0] && /見るだけ/.test(r.w.picks[0].title)), '★預けモードなのに見るだけの窓が出た → ' + J(r.w.picks));
    ok(!r.after.sideOnly && !r.after.viewOnly && r.after.fromCase && !/預けモード/.test(r.after.bar),
       '★📂 でPCのファイルを読んでも、いつもの保存に戻らない → ' + J(r.after));
    ok(r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && r.file.note === '預けモードで書いた' && r.file.side === false,
       '★戻ったあとの いつもの保存がおかしい（写真・入力・_side）→ ' + J(r.file));
  });

  /* ---------- ⑫ 預けモードで保存するたびに、PCのファイル（らしいもの）を探して戻る ---------- */
  await scene('⑫', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      __click('pcg-side'); await __sleep(500);
      M.chosho_note = '預けモードで書いた'; saveDraft(); await __sleep(400);
      /* PCらしくない写し（写真1枚）がある → 戻らない（預け） */
      __D.__files['2612MKM013.json'] = JSON.stringify(__pcFile({ chosho_photos:[ __ph('t1', '#c33') ] }));
      __plan = ['📤'];
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const s1 = { sideOnly: !!M._sideOnly, shared: w1.shared, names: w1.sharedNames, wrote: w1.wrote };
      /* 本物のPCのファイルが入った → 読み込んで いつもの保存に戻る */
      M.chosho_note = '預けモードで書いた 2'; M._touched = true; saveDraft(); await __sleep(400);
      __D.__files['2612MKM013.json'] = JSON.stringify(__pcFull());
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(__D, '2612MKM013.json');
      return { s1, w2: { shared: w2.shared, wrote: w2.wrote, toasts: w2.toasts }, sideOnly: !!M._sideOnly, fromCase: !!M._fromCaseFile,
               file: f && { photos: __pids(f), note: f.chosho_note, side: ('_side' in f) } };
    });
    console.log('⑫預けモードから戻る', J(r));
    ok(r.s1.sideOnly && r.s1.shared === 1 && SIDE13.test(r.s1.names[0] || '') && r.s1.wrote.length === 0,
       '★PCらしくない写しで預けモードを抜けた（または いつもの名前で書いた）→ ' + J(r.s1));
    ok(!r.sideOnly && r.fromCase && r.w2.shared === 0 && r.w2.wrote.indexOf('2612MKM013.json') >= 0,
       '★フォルダに本物のPCのファイルが入ったのに、預けモードのまま（読み込んで いつもの保存に戻らない）→ ' + J([r.sideOnly, r.fromCase, r.w2]));
    ok(r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && r.file.note === '預けモードで書いた 2' && !r.file.side,
       '★戻ったときの保存で、PCの写真・この端末の入力が残らない → ' + J(r.file));
  });

  /* ---------- ⑬ 預けを 📂 で開く ---------- */
  await scene('⑬a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      const sideObj = Object.assign(__pcFull(), { chosho_note:'預けの備考', _side: { v:1, at:'2026-10-01T00:00:00.000Z', why:'viewonly', touched:['chosho_note'] },
                                                   _sideMerged: ['2026-09-01T00:00:00.000Z|2612MKM013'] });
      await __import(sideObj, '2612MKM013_現場預け_20261001-101010.json');
      const st = buildStateOf(M);
      return { sideOnly: !!M._sideOnly, viewOnly: !!M._viewOnly, fromCase: !!M._fromCaseFile, base: !!fileBaseGet(M),
               pass: !!(M._passthrough && (M._passthrough._side || M._passthrough._sideMerged)), stSide: ('_side' in st), stMerged: ('_sideMerged' in st),
               pb: (await pbaseIds('2612MKM013')).length, bar: __bar().all };
    });
    console.log('⑬a預けを開く（同じ戸別）', J(r));
    ok(r.sideOnly && !r.viewOnly && !r.fromCase && !r.base && r.pb === 0,
       '★預けを 📂 で開いたら PCのファイルを読んだことにした（見るだけが外れる・控えを取る）→ ' + J(r));
    ok(!r.pass && !r.stSide && !r.stMerged, '★預けの印（_side・_sideMerged）を持ち越した → ' + J(r));
  });
  await scene('⑬b', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      window.__D = __mkdir('リスト', {}, {}); await saveDirSet(__D, null);
      M = freshModel(); ensureModelShape(M); render();
      const sideObj = Object.assign(__pcFull(), { chosho_note:'預けの備考', _side: { v:1, at:'2026-10-01T00:00:00.000Z', why:'viewonly' } });
      await __import(sideObj, '2612MKM013_現場預け_20261001-101010.json');
      const st = buildStateOf(M);
      __plan = ['📤'];
      M.chosho_note = '預けを開いて直した'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      return { no: M.chosho_mgmt_no, sideOnly: !!M._sideOnly, fromCase: !!M._fromCaseFile, base: !!fileBaseGet(M),
               pass: !!(M._passthrough && M._passthrough._side), stSide: ('_side' in st), pb: (await pbaseIds('2612MKM013')).length,
               w: { shared: w.shared, names: w.sharedNames, wrote: w.wrote } };
    });
    console.log('⑬b預けを開く（はじめて）', J(r));
    ok(r.no === '2612MKM013' && r.sideOnly && !r.fromCase && !r.base && !r.pass && !r.stSide && r.pb === 0,
       '★はじめて預けを 📂 で開いたら、PCのファイル扱い（控え・_side の持ち越し）→ ' + J(r));
    ok(r.w.shared === 1 && SIDE13.test(r.w.names[0] || '') && r.w.wrote.length === 0,
       '★預けを開いたあとの保存が、いつもの名前になった → ' + J(r.w));
  });

  /* ---------- ⑭ _side がいつもの名前のファイルに入らない ---------- */
  await scene('⑭a', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      window.__D = __mkdir('リスト', {}, {}); await saveDirSet(__D, null);
      M = freshModel(); ensureModelShape(M); render();
      const sideObj = __pc14({ chosho_note:'預けの備考', _side: { v:1, at:'2026-10-01T00:00:00.000Z', why:'write', touched:['chosho_note'] },
                               _sideMerged: ['x|2612MKM014'] });
      await __import(sideObj, '2612MKM014_現場預け_20261001-101010.json');
      const m0 = { sideOnly: !!M._sideOnly, fromCase: !!M._fromCaseFile, base: !!fileBaseGet(M) };
      M.cable_main_len = '15'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(__D, '2612MKM014.json');
      return { m0, wrote: w.wrote, file: f && { side: ('_side' in f), merged: ('_sideMerged' in f), note: f.chosho_note, len: f.cable_main_len, photos: __pids(f) } };
    });
    console.log('⑭a預けを開いて保存', J(r));
    ok(!r.m0.sideOnly && !r.m0.fromCase && !r.m0.base, '試験の前提: PCに中身の無い戸別の預けを開いたあと、預けモード・控えあり → ' + J(r.m0));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && r.file && r.file.note === '預けの備考' && r.file.len === '15' && r.file.photos === 'q1',
       '試験の前提: 預けを開いたあとの いつもの保存ができない → ' + J(r));
    ok(r.file && !r.file.side && !r.file.merged,
       '★預けを開いて保存した いつもの名前のファイルに _side・_sideMerged が入った（PCがそのファイルを預けと読んで一覧から消す）→ ' + J(r.file));
  });
  await scene('⑭b', {}, async page => {
    const r = await page.evaluate(async () => {
      const old = __pc14({ chosho_photos:[ __ph('q1', '#a52'), __ph('q2', '#25a') ], _side: { v:1, at:'2026-10-01T00:00:00.000Z', why:'write' },
                           _sideMerged: ['2026-09-30T00:00:00.000Z|2612MKM014'] });
      await __state({ dirName:'リスト', no:'2612MKM014', files: { '2612MKM014.json': JSON.stringify(old) } });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(__D, '2612MKM014.json');
      return { wrote: w.wrote, ov: w.ov, file: f && { side: ('_side' in f), merged: f._sideMerged, photos: __pids(f), len: f.cable_main_len } };
    });
    console.log('⑭bフォルダのファイルに _side', J(r));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && r.file && r.file.len === '12', '試験の前提: いつもの保存ができない → ' + J(r));
    ok(r.file && r.file.photos === 'q1,q2,t1', '★フォルダのファイルの写真を読み合わせていない（写真が減った）→ ' + J(r.file));
    ok(r.file && !r.file.side, '★フォルダのファイルにあった _side を、いつもの名前のファイルへ書き戻した → ' + J(r.file));
    ok(r.file && Array.isArray(r.file.merged) && r.file.merged.join() === '2026-09-30T00:00:00.000Z|2612MKM014',
       '★事務所でまとめた覚え（_sideMerged）を消した（事務所が同じ預けをもう一度まとめてしまう）→ ' + J(r.file));
  });

  /* ---------- ⑮ 読む道は預けを使わない ---------- */
  await scene('⑮', {}, async page => {
    const r = await page.evaluate(async () => {
      const full = () => Object.assign(__pcFull(), { _side: { v:1, at:'2026-10-01T00:00:00.000Z', why:'viewonly' } });
      const files = {
        '2612MKM013_現場預け_20261001-101010.json': JSON.stringify(full()),
        '2612MKM013_現場預け_20261001-101010_1.json': JSON.stringify(full()),
        '2612MKM013_現場預け_20261001-101010 (1).json': JSON.stringify(full()),
        '2612MKM013_現場預け_20261001-101010.json.txt': JSON.stringify(full()),
        '2612MKM013_tab.json': JSON.stringify(full())                 // 名前は預けでないが、中身に _side
      };
      const st = await __state({ dirName:'リスト', files: files });
      const cf = await readExistingCaseFiles(__D, '2612MKM013.json', '2612MKM013');
      const hit = await caseFileFromDir(__D, '2612MKM013');
      const only = __mkdir('リスト', { '2612MKM013_現場預け_20261001-101010.json': '{}', '2612MKM014_現場預け_20261001-101010 (1).json': '{}' }, {});
      const n = await saveDirCountCases(only, 50);
      return { st, names: cf.names, primary: !!cf.primary, others: (cf.others || []).length, hit: hit ? hit.name || true : null, n,
               miss: (typeof _pcAutoLoadMiss !== 'undefined') ? _pcAutoLoadMiss : 'none' };
    });
    console.log('⑮読む道', J(r));
    ok(r.st.viewOnly === true && !r.st.fromCase, '★フォルダに預けしか無いのに、見るだけが外れた（預けを PCのファイルとして読んだ）→ ' + J(r.st));
    ok(r.names.length === 0 && !r.primary && r.others === 0, '★保存の読み合わせに預けを使った → ' + J(r));
    ok(r.n === 0, '★フォルダの戸別ファイルの数に預けを数えた → ' + r.n);
    ok(r.hit === null, '★PCのフォルダから読む道（caseFileFromDir）が預けを返した → ' + J(r.hit));
  });

  /* ---------- ⑯ PCのファイルらしくない写し ---------- */
  await scene('⑯a', {}, async page => {
    const r = await page.evaluate(async () => {
      /* 工事完了の印は入っている（この端末が前に書いた写しでも、台帳から完了が入る）。写真が1枚しかない */
      const st = await __state({ files: { '2612MKM013.json': JSON.stringify(__pcFile({ chosho_photos:[ __ph('t1', '#c33') ], work_done:true, chosho_status:'completed' })) } });
      return { st, miss: (typeof _pcAutoLoadMiss !== 'undefined') ? _pcAutoLoadMiss : null };
    });
    console.log('⑯a写真1枚の写し', J(r));
    ok(r.st.viewOnly === true && !r.st.fromCase && r.miss && r.miss.have === 1 && r.miss.want === 6,
       '★台帳は写真6枚なのに、写真1枚の写し（この端末が前に書いたもの）を PCのファイルとして読んだ → ' + J(r));
  });
  await scene('⑯b', {}, async page => {
    const r = await page.evaluate(async () => {
      const notDone = Object.assign(__pcFull(), { work_done:false, chosho_status:'' });
      const a = await __state({ files: { '2612MKM013.json': JSON.stringify(notDone) } });
      const looks = { full: pcHitLooksPc(__pcFull(), rcRowOf('2612MKM013')), notDone: pcHitLooksPc(notDone, rcRowOf('2612MKM013')),
                      noRow: pcHitLooksPc(__pcFile(), null), side: pcHitLooksPc(Object.assign(__pcFull(), { _side:{ v:1 } }), rcRowOf('2612MKM013')) };
      __D.__files['2612MKM013.json'] = JSON.stringify(__pcFull());
      const ok2 = await pcGuardAutoLoad(__D);
      return { a, looks, ok2, vo: !!M._viewOnly, fromCase: !!M._fromCaseFile };
    });
    console.log('⑯b完了の印・本物', J(r));
    ok(r.a.viewOnly === true, '★台帳は工事完了なのに、完了の印の無いファイルを PCのファイルとして読んだ → ' + J(r.a));
    ok(r.looks.full === true && r.looks.notDone === false && r.looks.noRow === true && r.looks.side === false,
       '★PCのファイルらしいかの決め方が違う → ' + J(r.looks));
    ok(r.ok2 === true && r.vo === false && r.fromCase === true, '★本物のPCのファイルなのに見るだけを外さない → ' + J(r));
  });

  /* ---------- ⑰ まとめて保存：見るだけの戸別 ---------- */
  await scene('⑰', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      __pickerMode = 'return'; __pickerRet = __copyDir(__D);
      __plan = ['📮 書けなかった', '📤'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(2500); }, 20000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { w: Object.assign({}, w, { sharedTexts: w.sharedTexts.length }), canon: '2612MKM013.json' in __D.__files, why: j && j._side && j._side.why };
    });
    console.log('⑰まとめて保存（見るだけ）', J(r));
    ok(r.canon === false && r.w.wrote.length === 0, '★まとめて保存で、見るだけの戸別を いつもの名前で書いた → ' + J(r.w.wrote));
    ok(r.w.said.some(s => /見るだけ/.test(s) && /2612MKM013/.test(s) && /まとめて保存します/.test(s)),
       '★まとめて保存の最初の確かめで、見るだけの戸別があると言わない → ' + J(r.w.said));
    const fin = r.w.picks.find(p => /書けなかった/.test(p.title)) || {};
    ok(/見るだけ/.test(fin.note || '') && /2612MKM013/.test(fin.note || '') && (fin.rows || []).some(t => /^📮 書けなかった 1件/.test(t)),
       '★最後に、書けなかった戸別を1つの知らせで言い「📮 書けなかった N件を事務所に預ける」を出さない → ' + J(r.w.picks));
    ok(r.w.shared === 1 && SIDE13.test(r.w.sharedNames[0] || '') && r.why === 'viewonly', '★まとめて保存のあとの 📮 で預けられない → ' + J([r.w.sharedNames, r.why]));
  });

  /* ---------- ⑱ まとめて保存：フォルダに本物のPCのファイル → 今までどおり書く ---------- */
  await scene('⑱', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ dirName:'リスト' });
      __D.__files['2612MKM013.json'] = JSON.stringify(__pcFull());
      __pickerMode = 'return'; __pickerRet = __copyDir(__D);
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const f = __fileOf(__D, '2612MKM013.json');
      return { st, w, file: f && { photos: __pids(f), note: f.chosho_note, done: f.work_done } };
    });
    console.log('⑱まとめて保存（本物がある）', J(r));
    ok(r.st.viewOnly === true, '試験の前提: 見るだけになっていない');
    ok(r.w.wrote.indexOf('2612MKM013.json') >= 0 && r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && r.file.note === '現場メモ 追記' && r.file.done === true,
       '★フォルダに本物のPCのファイルがあるのに、読み合わせて書かない（または写真・完了が消えた）→ ' + J([r.w.wrote, r.file]));
    ok(!r.w.picks.some(p => /書けなかった/.test(p.title)) && r.w.shared === 0, '★読み合わせて書けたのに、預けに回した → ' + J(r.w.picks));
  });

  /* ---------- ⑲ まとめて保存：窓のエラー・物件が違うフォルダでやめた ---------- */
  await scene('⑲a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      /* 閉じた（Android は Dropbox が出ないので、閉じるのがふつう）→ 知らせは「やめる」 */
      __pickerMode = 'abort'; __plan = [null];
      const w0 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(800); }, 15000);
      const rec0 = await idbGet('no:2612MKM014');
      __pickerMode = 'error';
      __plan = ['📮 まとめて', '📤'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(2000); }, 15000);
      /* もう一度直して、閉じる → 「📤 フォルダを覚えるのをやめる」→ 何も渡さず、次からは共有で渡す道 */
      M.cable_main_len = '13'; M._touched = true; await persistDraft();
      __pickerMode = 'abort'; __plan = ['📤 フォルダを'];
      const w3 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1200); }, 15000);
      return { w0: { picks: w0.picks, shared: w0.shared, dl: w0.dl.length, wrote: w0.wrote.length, saved: !!(rec0 && (rec0.fileRev | 0) >= (rec0.rev | 0)) },
               w: Object.assign({}, w, { sharedTexts: 0 }),
               w3: { picks: w3.picks.length, shared: w3.shared, dl: w3.dl.length, wrote: w3.wrote.length, said: w3.said }, route: saveRoute(), dir: !!_saveDir };
    });
    console.log('⑲a窓を閉じた・エラー', J(r));
    const p0 = r.w0.picks[0] || {};
    ok(r.w0.picks.length === 1 && /閉じた/.test(p0.note || '') && (p0.rows || []).some(t => /^📮 まとめて事務所に預ける（1件）/.test(t))
       && (p0.rows || []).some(t => /^📤 フォルダを覚えるのをやめる/.test(t)) && (p0.rows || []).some(t => /^やめる/.test(t)),
       '★フォルダを選ぶ画面を閉じたとき黙って終わった（「📮 まとめて事務所に預ける」「📤 フォルダを覚えるのをやめる」「やめる」が出ない）→ ' + J(r.w0.picks));
    ok(r.w0.shared === 0 && r.w0.dl === 0 && r.w0.wrote === 0 && !r.w0.saved,
       '★フォルダを選ぶ画面を自分で閉じたのに、押す前に何か渡した・書いた・渡した扱いにした → ' + J(r.w0));
    ok(r.w3.picks === 1 && r.w3.shared === 0 && r.w3.dl === 0 && r.w3.wrote === 0 && r.route === 'share' && !r.dir
       && r.w3.said.some(s => /フォルダを覚えるのをやめました/.test(s)),
       '★閉じたときの「📤 フォルダを覚えるのをやめる」で、フォルダを忘れない（または何か渡した）→ ' + J([r.w3, r.route, r.dir]));
    const p = r.w.picks[0] || {};
    ok(/選べませんでした/.test(p.title + p.note) && /1件ずつ/.test(p.note || '') && (p.rows || []).some(t => /^📮 まとめて事務所に預ける（1件）/.test(t)),
       '★フォルダを選ぶ画面のエラーで「📮 まとめて事務所に預ける」が出ない（「1件ずつ」も残す）→ ' + J(p));
    ok(r.w.shared === 1 && SIDE14.test(r.w.sharedNames[0] || ''), '★エラーのあとの 📮 で預けられない → ' + J(r.w.sharedNames));
  });
  /* フォルダを覚えていない端末：閉じたときの「📤 フォルダを選ばずに、共有で渡す」は、押したとおり そのまま共有で渡す */
  await scene('⑲c', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', noDir:true });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      __pickerMode = 'abort'; __plan = ['📤'];
      const s0 = __shared;
      const w = await __watch(async () => {
        await saveAllDrafts('unsaved');
        for(let i = 0; i < 80 && __shared === s0; i++) await __sleep(100);
        await __sleep(800);
      }, 20000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { picks: w.picks.map(p => ({ title: p.title, rows: p.rows, clicked: p.clicked })), shared: w.shared, names: w.sharedNames, said: w.said,
               picker: w.picker, why: j && j._side && j._side.why, len: j && j.cable_main_len, route: saveRoute(), dir: !!_saveDir };
    });
    console.log('⑲cフォルダを覚えていない端末で「📤 共有で渡す」', J(r));
    const p0 = r.picks[0] || {};
    ok(r.picker === 1 && (p0.rows || []).some(t => /^📤 フォルダを選ばずに、共有で渡す/.test(t)) && /^📤/.test(p0.clicked || ''),
       '試験の前提: フォルダを覚えていない端末で、閉じたときの窓に「📤 フォルダを選ばずに、共有で渡す」が出ない → ' + J(r.picks));
    ok(r.shared === 1 && SIDE14.test(r.names[0] || '') && r.why === 'share' && r.len === '12',
       '★「📤 フォルダを選ばずに、共有で渡す」を押しても共有で渡さない（「もう一度まとめて保存を押して」で終わる）→ ' + J([r.shared, r.names, r.why]));
    ok(!r.said.some(s => /フォルダを覚えるのをやめました/.test(s)),
       '★フォルダを覚えていないのに「フォルダを覚えるのをやめました」と言う → ' + J(r.said));
    ok(r.route === 'share' && !r.dir, '★「📤 共有で渡す」のあと、共有で渡す道になっていない → ' + J([r.route, r.dir]));
  });
  await scene('⑲b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      __pickerMode = 'return'; __pickerRet = __copyDir(__D);
      __cancelIf = /このフォルダでよいですか/;
      __plan = ['📮 まとめて'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 15000);
      return { w: Object.assign({}, w, { sharedTexts: 0 }), canon: '2612MKM014.json' in __D.__files };
    });
    console.log('⑲b物件が違うフォルダでやめた', J(r));
    ok(r.w.said.some(s => /このフォルダでよいですか/.test(s)), '試験の前提: 物件が違うフォルダの確かめが出ない → ' + J(r.w.said));
    ok(r.canon === false && r.w.wrote.length === 0, '★やめたのに書いた → ' + J(r.w.wrote));
    const p = r.w.picks[0] || {};
    ok((p.rows || []).some(t => /^📮 まとめて事務所に預ける/.test(t)), '★物件が違うフォルダでやめたあと、黙って終わった（📮 が無い）→ ' + J(r.w.picks));
  });

  /* ---------- ⑳ 保存バーの 📁 → 閉じる → フォルダを覚えるのをやめる ---------- */
  await scene('⑳', { savePicker:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true;
      __plan = ['📤 フォルダを覚える'];
      const w = await __watch(async () => { __click('sb-dest'); await __sleep(1200); }, 10000);
      const st = { dir: !!_saveDir, route: saveRoute(), bar: __bar(), ls: (function(){ try{ return localStorage.getItem('field_save_route_v1'); }catch(_){ return null; } })() };
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      /* フォルダを選び直したら、フォルダへ書く道に戻る */
      await saveDirSet(__mkdir('リスト', {}, {}), null); renderSaveBar();
      const back = { route: saveRoute(), bar: __bar().dest };
      return { w: { picks: w.picks, picker: w.picker, said: w.said }, st, w2: { shared: w2.shared, names: w2.sharedNames, sp: __savePickerCalls, wrote: w2.wrote, ov: w2.ov },
               why: j && j._side && j._side.why, back };
    });
    console.log('⑳フォルダを覚えるのをやめる', J(r));
    const p = r.w.picks[0] || {};
    ok(r.w.picker === 1 && (p.rows || []).some(t => /^📁 もう一度フォルダを選ぶ/.test(t)) && (p.rows || []).some(t => /^📤 フォルダを覚えるのをやめる/.test(t))
       && /Dropbox/.test(p.note || ''),
       '★保存バーの 📁 で窓を閉じたとき黙った（「📤 フォルダを覚えるのをやめる」が出ない）→ ' + J(r.w));
    ok(!r.st.dir && r.st.route === 'share' && r.st.ls === 'share' && /📤 ?共有で渡す/.test(r.st.bar.dest) && /その１/.test(r.st.bar.dest),
       '★フォルダを忘れていない／保存バーに「📤 共有で渡す（その１ ＞ リスト）」が出ない → ' + J(r.st));
    ok(r.w2.shared === 1 && SIDE14.test(r.w2.names[0] || '') && r.w2.sp === 0 && r.why === 'share',
       '★フォルダを覚えるのをやめたあとの保存が、共有（PCのファイルを読んでいない戸別は預けの名前）にならない → ' + J([r.w2, r.why]));
    ok(r.back.route === '' && !/共有で渡す/.test(r.back.bar), '★フォルダを選び直しても、共有で渡す道のまま → ' + J(r.back));
  });
  await scene('⑳b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      __plan = ['📤 フォルダを覚えるのをやめて'];
      const w = await __watch(async () => { await savePlaceCheckAfterImport(); await __sleep(300); }, 10000);
      return { w: { picks: w.picks }, dir: !!_saveDir, route: saveRoute() };
    });
    console.log('⑳b取り込みのあとの窓', J(r));
    ok(r.w.picks[0] && /違います/.test(r.w.picks[0].title) && r.w.picks[0].rows.some(t => /^📤 フォルダを覚えるのをやめて/.test(t))
       && !r.dir && r.route === 'share',
       '★保存先が物件と違う知らせ（取り込みのあと）に「📤 フォルダを覚えるのをやめて、共有で渡す」が無い／選んでも忘れない → ' + J(r));
  });

  await scene('⑳c', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      __pickerMode = 'error';
      __plan = ['📤 フォルダを覚えるのをやめる'];
      const w = await __watch(async () => { await saveDirChange(); await __sleep(300); }, 10000);
      return { w: { picks: w.picks, said: w.said }, dir: !!_saveDir, route: saveRoute() };
    });
    console.log('⑳c名前だけの窓', J(r));
    const p = r.w.picks[0] || {};
    ok(r.w.said.some(s => /窓を開けませんでした/.test(s)), '試験の前提: フォルダを選ぶ窓が開けない知らせが出ない → ' + J(r.w.said));
    ok(/入れる場所の名前/.test(p.title || '') && (p.rows || []).some(t => /^📤 フォルダを覚えるのをやめる/.test(t)) && !r.dir && r.route === 'share',
       '★名前だけの窓に「📤 フォルダを覚えるのをやめる」が無い（または選んでも忘れない）→ ' + J(r));
  });

  /* ---------- ㉑ 共有で渡す道：PCのファイルを読んだ戸別は いつもの名前 ---------- */
  await scene('㉑', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true });
      await saveDirForget();
      await __import(__pcFull());
      const m0 = { vo: !!M._viewOnly, base: !!fileBaseGet(M) };
      M.chosho_note = 'PCを読んで直した'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { m0, w: { shared: w.shared, names: w.sharedNames }, side: !!(j && j._side), photos: __pids(j) };
    });
    console.log('㉑共有で渡す道（PCを読んだ）', J(r));
    ok(r.m0.vo === false && r.m0.base, '試験の前提: 📂 でPCのファイルを読めていない → ' + J(r.m0));
    ok(r.w.shared === 1 && r.w.names[0] === '2612MKM013.json' && !r.side && r.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1',
       '★PCのファイルを読んだ戸別まで預けの名前にした（または写真が欠けた）→ ' + J(r));
  });

  /* ---------- ㉒ 別の戸別のファイル／結果の無い保存 → 緑の「保存しました」を出さない ---------- */
  await scene('㉒a', { savePicker:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true });
      await __import(__pcFull());
      const other = __mkdir('x', { '2612MKM099.json': JSON.stringify(Object.assign(__pcFile(), { chosho_mgmt_no:'2612MKM099' })) }, {});
      window.__savePickerRet = await other.getFileHandle('2612MKM099.json');
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w, btn: __overlay(), otherWrote: other.__wrote.slice() };
    });
    console.log('㉒a別の戸別のファイル', J(r));
    const ov = last(r.w.ov);
    ok(r.otherWrote.length === 0, '試験の前提: 別の戸別のファイルに書いた');
    ok(!r.w.ov.some(o => o === null || /^保存しました/.test((o && o.title) || '')) && /別の戸別/.test(ov.title || '') && ov.escape === 'merge'
       && /事務所に預ける/.test(r.btn) && !r.w.said.some(s => /別の戸別/.test(s)),
       '★別の戸別のファイルで止めたのに「保存しました」と出た（または知らせだけで 📮 が無い）→ ' + J([r.w.ov, r.w.said, r.btn]));
  });
  /* 保存の中身（saveJsonRun）が、結果を作らずに「済んだ」と返した（版175 の別の戸別のファイルの道がそうだった）。
     そのときは緑の「保存しました」を出さない（何も書いていないかもしれない） */
  await scene('㉒b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト', no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      saveJsonRun = async () => true;
      const w = await __watch(() => __press('btn-save'), 15000);
      const ovEl = document.getElementById('save-ov');
      return { w, shown: !!(ovEl && ovEl.classList.contains('ok')),
               title: ((document.querySelector('#save-ov .save-ov-t') || {}).textContent || '') };
    });
    console.log('㉒b結果の無い保存', J(r));
    ok(!r.w.ov.some(o => o === null || /^保存しました/.test((o && o.title) || '')) && !/保存しました/.test(r.title),
       '★結果が無い（何も書いていないかもしれない）のに、緑の「保存しました」を出した → ' + J([r.w.ov, r.title]));
  });

  /* ---------- ㉓ 何も入力していない見るだけの戸別 → 渡すものはありません ---------- */
  await scene('㉓', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      window.__D = __mkdir('その2', {}, {}); await saveDirSet(__D, null);
      M = freshModel(); ensureModelShape(M); render();
      const row = getReceptionRows().find(x => x.mgmt_no === '2612MKM013');
      await openFromReception(row); await __sleep(300);
      const vo = !!M._viewOnly, nothing = isNothingNewHere(M);
      __plan = ['📮', '📤'];
      const w = await __watch(() => __press('btn-save'), 15000);
      /* 直接 📮 を呼んでも渡さない */
      const w2 = await __watch(async () => { const x = await sideSaveFlow('viewonly', [M]); return x ? 'info' : 'null'; }, 10000);
      return { vo, nothing, w, w2 };
    });
    console.log('㉓何も入力していない見るだけ', J(r));
    ok(r.vo && r.nothing, '試験の前提: 見るだけ・何も入力していない、になっていない → ' + J([r.vo, r.nothing]));
    ok(r.w.picks.length === 0 && r.w.shared === 0 && r.w.said.some(s => /渡すものはありません/.test(s)),
       '★何も入力していないのに 📮 を出した（既定値だけの預けができる）→ ' + J(r.w));
    ok(r.w2.ret === 'null' && r.w2.shared === 0 && r.w2.picks.length === 0, '★何も入力していない戸別を預けた → ' + J(r.w2));
  });

  /* ---------- ㉔ 保存先が受付台帳の物件と違う → 預けの名前で置く ---------- */
  await scene('㉔', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      await __import(__pcFull());
      const vo = !!M._viewOnly;
      const w = await __watch(() => __press('btn-save'), 15000);
      const names = __sideNames(__D);
      const j = names[0] ? __fileOf(__D, names[0]) : null;
      return { vo, w, names, canon: '2612MKM013.json' in __D.__files, why: j && j._side && j._side.why, base: !!(j && j._side && j._side.base), btn: __overlay() };
    });
    console.log('㉔物件が違うフォルダ', J(r));
    ok(r.vo === false, '試験の前提: 📂 でPCのファイルを読めていない');
    ok(r.names.length === 1 && SIDE13.test(r.names[0]) && !r.canon && r.why === 'place' && r.base,
       '★受付台帳の物件と違うフォルダ（その2）に、いつもの名前で書いた → ' + J([r.names, r.canon, r.why]));
    ok(/別の名前で置きました/.test(last(r.w.ov).title || '') && /受付台帳の物件と違う/.test(last(r.w.ov).msg || '') && /共有でも渡す/.test(r.btn),
       '★物件が違うので別の名前で置いた、と言わない → ' + J([r.w.ov, r.btn]));
  });

  /* ---------- ㉕ 履歴：📮 選んで事務所に預ける（保存済みも）・📮 の印・消すときの知らせ ---------- */
  await scene('㉕', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      await openDraftModal(); await __sleep(400);
      const cb = document.querySelector('.d-check'); cb.checked = true; cb.dispatchEvent(new Event('change'));
      const btnTxt = ((document.getElementById('d-sidesel') || {}).textContent || '').trim();
      __plan = ['📤'];
      const w = await __watch(async () => { __click('d-sidesel'); await __sleep(2000); }, 15000);
      await __sleep(500);
      const badge = (document.querySelector('#draft-list .d-no') || {}).textContent || '';
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      renderReceptionList('');
      const rc = ((document.getElementById('reception-list') || {}).innerText || '').replace(/\s+/g, ' ');
      /* 預けた下書きを消そうとすると、知らせる（キャンセル） */
      await openDraftModal(); await __sleep(400);
      const cb2 = document.querySelector('.d-check'); cb2.checked = true; cb2.dispatchEvent(new Event('change'));
      __cancelIf = /選択した/;
      const w3 = await __watch(async () => { __click('d-delsel'); await __sleep(800); }, 10000);
      const still = !!(await idbGet('no:2612MKM014'));
      return { btnTxt, w: { shared: w.shared, names: w.sharedNames }, why: j && j._side && j._side.why, base: j && j._side && j._side.base, badge, rc, del: w3.said, still };
    });
    console.log('㉕履歴', J(r));
    ok(/📮 選んだ 1件を事務所に預ける/.test(r.btnTxt), '★履歴に「📮 選んで事務所に預ける（保存済みも）」が無い → ' + r.btnTxt);
    ok(r.w.shared === 1 && SIDE14.test(r.w.names[0] || '') && r.why === 'resend', '★履歴から預けられない → ' + J([r.w, r.why]));
    ok(/📮/.test(r.badge) && !/💾/.test(r.badge), '★履歴に 📮（預けた）の印が出ない → ' + r.badge);
    ok(/📮 預け済/.test(r.rc), '★受付台帳の一覧に「📮 預け済」が出ない → ' + r.rc.slice(0, 300));
    ok(r.del.some(s => /事務所に預けた戸別/.test(s) && /まとめ終わるまで消さないでください/.test(s)) && r.still,
       '★預けた下書きを消すとき「事務所でまとめ終わるまで消さないでください」と言わない → ' + J(r.del));
  });

  /* ---------- ㉖ ほかの端末が保存した戸別 → 📮 ---------- */
  await scene('㉖', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });
      M.cable_main_len = '12'; M._touched = true; M._otherFile = '2612MKM014.json';
      __plan = ['📮', '📤'];
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w: Object.assign({}, w, { sharedTexts: 0 }), other: M._otherFile, base: !!fileBaseGet(M) };
    });
    console.log('㉖ほかの端末', J(r));
    const p = r.w.picks[0] || {};
    ok((p.rows || []).some(t => /^保存先のファイルに書く/.test(t)) && (p.rows || []).some(t => /^📮 事務所に預ける/.test(t))
       && /保存先のファイル/.test(p.note || '') && !/そのファイルから消えます/.test(p.note || ''),
       '★ほかの端末が保存した戸別の確かめに 📮 が無い（または「そのファイルから消えます」と言う）→ ' + J(p));
    ok(r.w.shared === 1 && SIDE14.test(r.w.sharedNames[0] || '') && r.w.wrote.length === 0 && r.other === '2612MKM014.json' && !r.base,
       '★預けたら、ほかの端末のファイルの印を消した（または書いた）→ ' + J([r.w.sharedNames, r.w.wrote, r.other]));
  });

  /* ---------- ㉗ 共有は1回10件まで・共有に失敗したら窓に戻る ---------- */
  await scene('㉗a', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      const ms = [];
      for(let i = 1; i <= 12; i++){
        const m = freshModel(); ensureModelShape(m);
        m.chosho_mgmt_no = 'Z9999A' + String(i).padStart(2, '0'); m.chosho_note = 'n' + i; m._touched = true;
        ms.push(m);
      }
      __plan = ['📤', '📤 次の'];
      const w = await __watch(async () => { const x = await sideSaveFlow('bulk', ms); if(x) sideShowResult(x); await __sleep(300); }, 20000);
      return { calls: __shareCalls, w: { shared: w.shared, n: w.sharedNames.length, picks: w.picks.map(p => ({ t: p.title, rows: p.rows })), ov: w.ov } };
    });
    console.log('㉗a10件ずつ', J(r));
    ok(r.calls === 2 && r.w.shared === 2 && r.w.n === 12, '★1回の共有に10件より多く入れた（または続きを渡せない）→ ' + J(r));
    ok(r.w.picks.some(p => (p.rows || []).some(t => /^📤 次の 2件を共有（2\/2）/.test(t))), '★続きの「📤 次の 2件を共有（2/2）」が出ない → ' + J(r.w.picks));
  });
  await scene('㉗b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      __shareMode = 'fail';
      __plan = ['📮', '📤', '⬇'];
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w: Object.assign({}, w, { sharedTexts: 0 }) };
    });
    console.log('㉗b共有に失敗', J(r));
    const again = r.w.picks[2] || {};
    ok(/共有できませんでした/.test(again.note || '') && (again.rows || []).some(t => /^⬇/.test(t)),
       '★共有に失敗したとき、預けの窓に戻らない（黙って終わる）→ ' + J(r.w.picks));
    ok(r.w.dl.length === 1 && SIDE13.test(r.w.dl[0]), '★共有に失敗したあと ⬇ でダウンロードに入れられない → ' + J(r.w.dl));
  });

  /* ---------- ㉘ 直した欄（touched）・proj ---------- */
  await scene('㉘a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      await __import(__pcFull());
      M.chosho_cust_tel = '0176-99-0000'; saveDraft();
      const it = await sideBuild(M, 'verify');
      return { touched: it.state._side.touched, base: it.state._side.base, photos: it.photos, proj: it.state._side.proj };
    });
    console.log('㉘aPCを読んだあとの預け', J(r));
    ok(r.base && r.base.file === '2612MKM013.json' && r.touched.slice().sort().join() === 'chosho_cust_tel,chosho_note',
       '★PCのファイルを読んだあとの預けの touched が「この端末で直した欄（電話・備考）」だけでない（PCの値＝工事のしかた などが入る）→ ' + J(r));
    ok(r.photos === 7 && r.proj === P1, '★預けに写真7枚・物件名が入っていない → ' + J(r));
  });
  await scene('㉘b', { pc:true }, async page => {      // PC（「リスト」は Dropbox のフォルダ）
    const r = await page.evaluate(async () => {
      const run = async (dirName) => {
        receptionSaveRows(__ledgerP1());
        const d = __mkdir(dirName, {}, {}); await saveDirSet(d, null); window.__D = d;
        M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'Z9999A01'; M.cable_main_len = '25'; M._touched = true;
        M._lastDraftKey = 'no:Z9999A01'; await persistDraft();
        await saveJsonRun();
        const wrote = Object.keys(d.__files);
        M.chosho_cust_tel = '0176-11-2222'; saveDraft();
        const it = await sideBuild(M, 'write');
        return { wrote, base: !!it.state._side.base, touched: it.state._side.touched, proj: it.state._side.proj, ledger: it.state._side.ledger };
      };
      return { sono2: await run('その2'), list: await run('リスト') };
    });
    console.log('㉘b端末の中のフォルダに書いたあと', J(r));
    ok(r.sono2.wrote.indexOf('Z9999A01.json') >= 0 && r.sono2.base, '試験の前提: その2 に書けない → ' + J(r.sono2));
    ok(r.sono2.touched.indexOf('cable_main_len') >= 0 && r.sono2.touched.indexOf('chosho_cust_tel') >= 0,
       '★端末の中だけのフォルダ（その2）に書いた控えを当てにして、前に入れた欄を touched から落とした（事務所で採られない）→ ' + J(r.sono2));
    ok(r.list.base && r.list.touched.indexOf('cable_main_len') < 0 && r.list.touched.indexOf('chosho_cust_tel') >= 0,
       '★リストに書いた控えのあとの touched が違う → ' + J(r.list));
    ok(r.sono2.proj === '' && r.sono2.ledger === P1, '★受付台帳に無い戸別なのに、台帳の物件名で振り分けさせる（proj が空でない）→ ' + J([r.sono2.proj, r.sono2.ledger]));
  });

  /* ---------- ㉙ 文言 ---------- */
  await scene('㉙', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      const vo = !!M._viewOnly;
      __plan = [null];
      const w = await __watch(() => __press('btn-save'), 15000);
      const w2 = await __watch(async () => { __click('pcg-force'); await __sleep(600); }, 8000);
      return { vo, picks: w.picks, said: w2.said };
    });
    console.log('㉙文言', J(r));
    const p = r.picks[0] || {};
    ok(r.vo === true, '試験の前提: 見るだけになっていない');
    ok((p.rows || []).some(t => /^📁 PCのフォルダから読み込む（リスト）/.test(t)) && /^📮/.test((p.rows || [])[0] || ''),
       '★覚えているフォルダが「リスト」なら、見るだけの窓に 📁 も出す（📮 がいちばん上）→ ' + J(p.rows));
    const t = r.said.find(s => /2612MKM013\.json/.test(s)) || r.said[0] || '';
    ok(!/がPCのファイルから消えます/.test(t) && /📮/.test(t) && /作ります/.test(t),
       '★「このまま新しく入力する」の確かめが「PCのファイルから消えます」と言い切る（📮 を言わない）→ ' + t);
  });

  /* ---------- ㉛ 帯の「📁 PCのフォルダから読み込む」で見つからない → 「📁 選び直す」とだけ言わない（📮・📂） ---------- */
  await scene('㉛', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pcFile({ chosho_photos:[ __ph('t1', '#c33') ] }));
      await __state({ dirName:'リスト', files: { '2612MKM013.json': txt } });
      const vo = !!M._viewOnly;
      __plan = ['📮', '📤'];
      const w = await __watch(async () => { __click('pcg-dir'); await __sleep(2500); }, 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { vo, w: Object.assign({}, w, { sharedTexts: 0 }), why: j && j._side && j._side.why, same: __D.__files['2612MKM013.json'] === txt };
    });
    console.log('㉛帯の📁で見つからない', J(r));
    const p = r.w.picks[0] || {};
    ok(r.vo === true, '試験の前提: 見るだけになっていない');
    ok(/見つかりませんでした/.test(p.title || '') && /^📮 事務所に預ける/.test((p.rows || [])[0] || '') && (p.rows || []).some(t => /^📂 PCのファイルを選んで読み込む/.test(t)),
       '★帯の 📁 で見つからないとき「📮 事務所に預ける」「📂 PCのファイルを選んで読み込む」を出さない → ' + J(p));
    ok(/写真が 1枚/.test(p.note || '') && /PCのファイルではないようです/.test(p.note || ''),
       '★見つけたファイルが PCのファイルらしくない（写真1枚）わけを言わない → ' + J(p.note));
    ok(r.w.shared === 1 && SIDE13.test(r.w.sharedNames[0] || '') && r.why === 'viewonly' && r.same && /事務所に預けました/.test(last(r.w.ov).title || ''),
       '★見つからない窓の 📮 で預けられない → ' + J([r.w.sharedNames, r.why, r.w.ov]));
  });

  /* ---------- ㉜ 見るだけの窓の「📂」「📁」 ---------- */
  await scene('㉜a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ dirName:'リスト' });
      const vo = !!M._viewOnly;
      const inp = document.getElementById('import-file'); let clicks = 0; inp.click = () => { clicks++; };
      __plan = ['📂'];
      const w1 = await __watch(() => __press('btn-save'), 15000);
      return { vo, clicks, w1: { picks: w1.picks.length, shared: w1.shared, wrote: w1.wrote, ov: w1.ov } };
    });
    console.log('㉜a見るだけの窓の📂', J(r));
    ok(r.vo === true, '試験の前提: 見るだけになっていない');
    ok(r.clicks === 1 && r.w1.shared === 0 && r.w1.wrote.length === 0,
       '★見るだけの窓で「📂 PCのファイルを選んで読み込む」を押しても、ファイルを選ぶ画面を開かない（または何か書いた）→ ' + J([r.clicks, r.w1]));
  });
  /* フォルダを覚えていない端末：📁 でフォルダを選ぶ → 本物のPCのファイルがあれば読み込んで、そのまま保存する */
  await scene('㉜b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true });
      const vo = !!M._viewOnly;
      const list = __mkdir('リスト', { '2612MKM013.json': JSON.stringify(__pcFull()) }, {});
      window.__D = list;
      __pickerMode = 'return'; __pickerRet = __copyDir(list);
      __plan = ['📁'];
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(list, '2612MKM013.json');
      return { vo, w2: { picks: w2.picks, wrote: w2.wrote, ov: w2.ov, shared: w2.shared, picker: w2.picker },
               vo2: !!M._viewOnly, file: f && { photos: __pids(f), note: f.chosho_note } };
    });
    console.log('㉜b見るだけの窓の📁', J(r));
    const p = r.w2.picks[0] || {};
    ok(r.vo === true, '試験の前提: 見るだけになっていない');
    ok((p.rows || []).some(t => /^📁 PCのフォルダから読み込む（フォルダを選びます）/.test(t)) && r.w2.picker === 1,
       '試験の前提: 見るだけの窓に「📁 PCのフォルダから読み込む（フォルダを選びます）」が無い／押してもフォルダを選ぶ窓が出ない → ' + J([p.rows, r.w2.picker]));
    ok(!r.vo2 && r.w2.wrote.indexOf('2612MKM013.json') >= 0 && r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && r.file.note === '現場メモ 追記'
       && /^保存しました/.test(last(r.w2.ov).title || ''),
       '★見るだけの窓の「📁 PCのフォルダから読み込む」で読み込めたのに、そのまま保存しない（または写真・入力が欠けた）→ ' + J([r.vo2, r.w2.wrote, r.w2.ov, r.file]));
  });

  /* ---------- ㉚ 幅375px・320px ---------- */
  await scene('㉚a', { width:375, height:740 }, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      __plan = ['📮', '@measure'];
      const w = await __watch(() => __press('btn-save'), 15000);
      return { picks: w.picks, sw: document.documentElement.scrollWidth, iw: window.innerWidth };
    });
    console.log('㉚a幅375', J(r));
    const m = (r.picks[1] || {}).measure || {};
    ok(m.sw <= m.iw && m.sheet && m.sheet[0] <= m.sheet[1] + 1, '★幅375px で預けの窓（長い名前）が横にはみ出した → ' + J(m));
  });
  await scene('㉚c', { width:320, height:640 }, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      window.__D = __mkdir('その2', {}, {}); await saveDirSet(__D, null);
      M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'R8MISAWAKITA2612MKM0130001APT0203BLDGSOUTHWING'; M.chosho_note = 'x'; M._touched = true;
      M._lastDraftKey = 'no:' + M.chosho_mgmt_no; await persistDraft(); render();
      __plan = ['@measure'];
      const w = await __watch(async () => { await sideSaveFlow('resend', [M]); }, 10000);
      return { picks: w.picks };
    });
    console.log('㉚c長い管理番号', J(r));
    const m = (r.picks[0] || {}).measure || {};
    ok(/R8MISAWAKITA2612MKM0130001APT0203BLDGSOUTHWING_現場預け_/.test((r.picks[0] || {}).note || ''), '試験の前提: 預けの窓に長い名前が出ない → ' + J(r.picks));
    ok(m.sw <= m.iw && m.sheet && m.sheet[0] <= m.sheet[1] + 1, '★幅320px で、長い管理番号の預けの名前が窓の横にはみ出した → ' + J(m));
  });
  await scene('㉚b', { width:320, height:640 }, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      const m = () => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth });
      await saveDirForget(); renderSaveBar(); await __sleep(200);
      const a = Object.assign(m(), { bar: __bar().dest });
      __click('pcg-side'); await __sleep(500);
      const b2 = m();
      sideShowResult({ title:'📮 事務所に預けました', msg:'2612MKM013_現場預け_20261014-091812.json\n' + 'あ'.repeat(400), escape:'share-also', _sideItems:[] });
      await __sleep(300);
      const c = m();
      const card = document.querySelector('#save-ov .save-ov-card');
      const cr = card ? card.getBoundingClientRect() : null;
      const btn = document.getElementById('save-ov-x2');
      const br = btn ? btn.getBoundingClientRect() : null;
      try{ saveOverlayHide(); }catch(_){}
      M._touched = true; await persistDraft();
      await openDraftModal(); await __sleep(400);
      const cb = document.querySelector('.d-check'); if(cb){ cb.checked = true; cb.dispatchEvent(new Event('change')); }
      const sb = document.getElementById('d-sidesel'); const sr = sb ? sb.getBoundingClientRect() : null;
      const d = m();
      return { a, b2, c, d, card: cr && [Math.round(cr.left), Math.round(cr.right), Math.round(cr.height)], vh: window.innerHeight,
               btn: br && [Math.round(br.top), Math.round(br.bottom)], side: sr && [Math.round(sr.left), Math.round(sr.right)] };
    });
    console.log('㉚b幅320', J(r));
    ok(r.a.sw <= r.a.iw && /共有で渡す/.test(r.a.bar), '★幅320px で保存バー（📤 共有で渡す・長い物件名）が横にはみ出した → ' + J(r.a));
    ok(r.b2.sw <= r.b2.iw, '★幅320px で預けモードの帯が横にはみ出した → ' + J(r.b2));
    ok(r.c.sw <= r.c.iw && r.card && r.card[0] >= 0 && r.card[1] <= 320 && r.card[2] <= r.vh,
       '★幅320px で結果の窓（長い知らせ）が画面に収まらない → ' + J([r.c, r.card, r.vh]));
    ok(r.d.sw <= r.d.iw && r.side && r.side[0] >= 0 && r.side[1] <= 320, '★幅320px で履歴の「📮 選んで事務所に預ける」が横にはみ出した → ' + J([r.d, r.side]));
  });

  /* ======== 版176 第2回の直し ======== */
  /* ---------- ㉝ 📮 で渡しているあいだに入った写真を、下書きから消さない（渡した写しで書き戻さない） ---------- */
  await scene('㉝', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      /* 別の戸別へ移る（2612MKM014 は下書きの中だけになる） */
      M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'Z9999B01'; M.chosho_note = 'b'; M._touched = true;
      M._lastDraftKey = 'no:Z9999B01'; await persistDraft(); render();
      const pick = async () => {
        await openDraftModal(); await __sleep(400);
        const cb = document.querySelector('.d-check[data-draftcheck="no:2612MKM014"]');
        if(!cb) return false;
        cb.checked = true; cb.dispatchEvent(new Event('change')); return true;
      };
      if(!(await pick())) return { err: '履歴に 2612MKM014 が無い' };
      /* 共有の画面が出ているあいだに、その戸別の写真の取り込みが終わる（persistModel） */
      const os = navigator.share; let raced = 0;
      navigator.share = async d => {
        if(!raced++){ const rec = await idbGet('no:2612MKM014'); rec.model.chosho_photos.push(__ph('a2', '#0a0')); await persistModel(rec.model); }
        return os(d);
      };
      __plan = ['📤'];
      const w = await __watch(async () => { __click('d-sidesel'); await __sleep(2000); }, 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      const rec = await idbGet('no:2612MKM014');
      await refreshDraftInfo(true);
      const r1 = { sent: __pids(j), photos: __pids(rec.model), sideAt: !!rec.model._sideAt, rev: rec.rev | 0, fileRev: rec.fileRev | 0,
                   names: w.sharedNames, h: handoverOf(draftInfoOf('2612MKM014')) };
      /* 2回目（取り込み中のものが無い）は、渡した扱い（📮）になる */
      if(!(await pick())) return { r1, err: '2回目：履歴に 2612MKM014 が無い' };
      __plan = ['📤'];
      const w2 = await __watch(async () => { __click('d-sidesel'); await __sleep(2000); }, 15000);
      const j2 = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      const rec2 = await idbGet('no:2612MKM014');
      await refreshDraftInfo(true);
      return { r1, r2: { sent: __pids(j2), photos: __pids(rec2.model), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0,
                         sided: !!(rec2.model._sideAt && rec2.model._sideAt === rec2.fileSavedAt), h: handoverOf(draftInfoOf('2612MKM014')) } };
    });
    console.log('㉝渡しているあいだの写真', J(r));
    ok(!r.err, '試験の前提: ' + J(r));
    ok(r.r1 && r.r1.names.length === 1 && SIDE14.test(r.r1.names[0] || '') && r.r1.sent === 't1', '試験の前提: 履歴の 📮 で渡せていない → ' + J(r.r1));
    ok(r.r1 && r.r1.photos === 'a2,t1',
       '★📮 で渡しているあいだに入った写真が、下書きから消えた（渡す前に読んだ写しで下書きを書き戻した）→ ' + J(r.r1));
    ok(r.r1 && r.r1.sideAt && r.r1.fileRev < r.r1.rev && r.r1.h !== 'ok',
       '★渡したあとに入った写真まで「渡した」扱いにした（まとめて保存の対象から外れ、新しい写真が渡らない）→ ' + J(r.r1));
    ok(r.r2 && r.r2.sent === 'a2,t1' && r.r2.photos === 'a2,t1' && r.r2.fileRev === r.r2.rev && r.r2.sided && r.r2.h === 'ok',
       '★中身が変わっていないのに「渡した（📮）」にならない → ' + J(r.r2));
  });

  /* ---------- ㉞ 共有で渡す道：PCのファイルを読んでいない戸別は預けの名前（端末の中だけのフォルダに書いたあとの控えは当てにしない） ---------- */
  await scene('㉞a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });                    // 端末の中の「その2」（親なし・リストでない）
      savePlaceOkSet(__P1);                                  // 「このフォルダのままにする」と答えた
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const b = fileBaseGet(M);
      const base = b ? { rd: !!b.rd, pc: !!b.pc, from: b.from } : null;
      try{ saveOverlayHide(); }catch(_){}
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { wrote: w1.wrote, fromCase: !!M._fromCaseFile, base, shared: w2.shared, names: w2.sharedNames, why: j && j._side && j._side.why,
               photos: __pids(j), note: j && j.chosho_note, ov: w2.ov.map(o => o && o.title) };
    });
    console.log('㉞a端末の中のフォルダに書いたあと共有', J(r));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && r.base && !r.base.rd && !r.base.pc && r.fromCase, '試験の前提: その2 に いつもの名前で書けていない → ' + J(r));
    ok(r.shared === 1 && SIDE14.test(r.names[0] || '') && r.why === 'share' && r.photos === 't1' && r.note === '共有で直した',
       '★端末の中だけのフォルダ（その2）に書いただけの戸別を、共有で いつもの名前（管理番号.json）で渡した（PCのファイルを読んでいない）→ ' + J(r));
  });
  /* 📂 で PCのファイルを読んだあと、端末の中の「その2」に書いた → フォルダを覚えるのをやめた → 保存＝いつもの名前（読んだ中身を受け継ぐ） */
  await scene('㉞b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });                    // 端末の中の「その2」（親なし・リストでない）
      savePlaceOkSet(__P1);                                  // 「このフォルダのままにする」と答えた
      await __import(__pc14(), '2612MKM014.json');           // 📂 で PCのファイルを読んだ（写真 q1）
      const b0 = fileBaseGet(M);
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const b = fileBaseGet(M);
      const base = b ? { rd: !!b.rd, pc: !!b.pc, from: b.from } : null;
      try{ saveOverlayHide(); }catch(_){}
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      /* 読んだあと端末の中のフォルダに書いた控えは、直した欄を決めるときには当てにしない（書く前に入れた欄も入れる） */
      const it = await sideBuild(M, 'cancel');
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { rd0: !!(b0 && b0.rd), wrote: w1.wrote, base, touched: it.state._side.touched, shared: w2.shared, names: w2.sharedNames,
               side: !!(j && j._side), photos: __pids(j), note: j && j.chosho_note, len: j && j.cable_main_len };
    });
    console.log('㉞b読んだあと その2 に書いて共有', J(r));
    ok(r.rd0 && r.wrote.indexOf('2612MKM014.json') >= 0 && r.base && !r.base.rd, '試験の前提: 📂 で読めていない・その2 に書けていない → ' + J(r));
    ok(r.base && r.base.pc && r.shared === 1 && r.names[0] === '2612MKM014.json' && !r.side && r.photos === 'q1,t1' && r.note === '共有で直した' && r.len === '12',
       '★📂 で PCのファイルを読んだあと その2 に書いた戸別を、共有で いつもの名前（管理番号.json）で渡さない（読んでいれば いつもの名前）→ ' + J(r));
    ok(Array.isArray(r.touched) && r.touched.indexOf('chosho_note') >= 0 && r.touched.indexOf('cable_main_len') >= 0,
       '★読んだあと端末の中のフォルダに書いた控えを当てにして、書く前に入れた欄を直した欄（touched）から落とした（事務所で採られない）→ ' + J(r.touched));
  });
  /* 「リスト」という名前のフォルダに書いただけ（PCのファイルは読んでいない）→ フォルダを覚えるのをやめた → 保存・まとめて保存＝預けの名前 */
  await scene('㉞e', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });  // 親の分からない空の「リスト」（端末の中に作ったものかもしれない）
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const b = fileBaseGet(M);
      const base = b ? { rd: !!b.rd, pc: !!b.pc, from: b.from } : null;
      try{ saveOverlayHide(); }catch(_){}
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      try{ saveOverlayHide(); }catch(_){}
      /* まとめて保存（共有で渡す道）でも同じ */
      M.chosho_cust_tel = '0176-11-2222'; M._touched = true; await persistDraft();
      const w3 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const j3 = w3.sharedTexts[0] ? JSON.parse(w3.sharedTexts[0]) : null;
      return { wrote: w1.wrote, base, shared: w2.shared, names: w2.sharedNames, why: j && j._side && j._side.why, photos: __pids(j), note: j && j.chosho_note,
               shared3: w3.shared, names3: w3.sharedNames, why3: j3 && j3._side && j3._side.why, photos3: __pids(j3) };
    });
    console.log('㉞eリストに書いただけで共有', J(r));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && r.base && !r.base.rd, '試験の前提: 「リスト」に いつもの名前で書けていない → ' + J(r));
    ok(r.shared === 1 && SIDE14.test(r.names[0] || '') && r.why === 'share' && r.photos === 't1' && r.note === '共有で直した',
       '★「リスト」という名前のフォルダに書いただけ（PCのファイルを読んでいない）の戸別を、共有で いつもの名前（管理番号.json）で渡した → ' + J(r));
    ok(r.shared3 === 1 && SIDE14.test(r.names3[0] || '') && r.why3 === 'share' && r.photos3 === 't1',
       '★まとめて保存（共有で渡す道）で、「リスト」に書いただけの戸別を いつもの名前で渡した → ' + J([r.names3, r.why3]));
  });
  /* 「リスト」に書いただけ → フォルダを覚えるのをやめた → 共有をやめた → 📮 の預け：「リスト」に書く前に入れた欄も直した欄に入れる */
  await scene('㉞f', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      try{ saveOverlayHide(); }catch(_){}
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      __shareMode = 'abort';
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const btn = __overlay();
      __shareMode = 'ok'; __plan = ['📤'];
      const w3 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w3.sharedTexts[0] ? JSON.parse(w3.sharedTexts[0]) : null;
      return { wrote: w1.wrote, ov2: w2.ov, btn, shared: w3.shared, names: w3.sharedNames, side: j && j._side, len: j && j.cable_main_len, note: j && j.chosho_note };
    });
    console.log('㉞fリストに書いたあと共有をやめて📮', J(r));
    const ov = last(r.ov2);
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && /保存をやめました/.test(ov.title || '') && ov.escape === 'cancel' && /^📮/.test(r.btn || ''),
       '試験の前提: 「リスト」に書けていない・共有をやめたときに 📮 が出ない → ' + J([r.wrote, ov, r.btn]));
    ok(r.shared === 1 && SIDE14.test(r.names[0] || '') && r.side && r.side.why === 'cancel' && r.len === '12' && r.note === '共有で直した'
       && Array.isArray(r.side.touched) && r.side.touched.indexOf('cable_main_len') >= 0 && r.side.touched.indexOf('chosho_note') >= 0,
       '★フォルダを覚えるのをやめたあとの預けで、「リスト」に書く前に入れた欄を直した欄（touched）から落とした（事務所で採られない）→ ' + J([r.names, r.side]));
  });
  await scene('㉞c', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', noDir:true });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      await __import(__pcFull());                            // 2612MKM013 は 📂 で PCのファイルを読んだ
      M.chosho_note = 'PCを読んで直した'; M._touched = true; await persistDraft();
      await saveDirForget();
      const c0 = __shareCalls;
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const texts = w.sharedTexts.map(t => { try{ return JSON.parse(t); }catch(_){ return null; } });
      const s14 = texts.find(j => j && j.chosho_mgmt_no === '2612MKM014');
      const s13 = texts.find(j => j && j.chosho_mgmt_no === '2612MKM013');
      const rec14 = await idbGet('no:2612MKM014'), rec13 = await idbGet('no:2612MKM013');
      return { calls: __shareCalls - c0, names: w.sharedNames, said: w.said, picker: w.picker,
               why14: s14 && s14._side && s14._side.why, photos14: __pids(s14), side13: !!(s13 && s13._side), photos13: __pids(s13),
               m14: { sided: !!(rec14 && rec14.model._sideAt && rec14.model._sideAt === rec14.fileSavedAt), base: !!(rec14 && rec14.model._fileBase), fromCase: !!(rec14 && rec14.model._fromCaseFile) },
               m13: { saved: !!(rec13 && rec13.fileSavedAt && (rec13.fileRev | 0) === (rec13.rev | 0)) } };
    });
    console.log('㉞cまとめて保存（共有で渡す道）', J(r));
    ok(r.calls === 1 && r.picker === 0 && r.names.length === 2 && r.names.indexOf('2612MKM013.json') >= 0 && r.names.some(n => SIDE14.test(n)),
       '★共有で渡す道のまとめて保存で、PCのファイルを読んでいない戸別を いつもの名前で渡した（または読んだ戸別まで預けにした）→ ' + J(r.names));
    ok(r.why14 === 'share' && r.photos14 === 't1' && !r.side13 && r.photos13 === 'pc1,pc2,pc3,pc4,pc5,pc6',
       '★預けの中身（_side.why＝share）・いつもの名前の中身が違う → ' + J(r));
    ok(r.m14.sided && !r.m14.base && !r.m14.fromCase && r.m13.saved, '★渡した印（📮・💾）が違う／預けで控えを取った → ' + J([r.m14, r.m13]));
    ok(r.said.some(s => /別の名前で渡しました/.test(s) && /2612MKM014_現場預け_/.test(s)), '★別の名前で渡したことを言わない → ' + J(r.said));
  });
  /* まとめて保存（共有で渡す道）でも、渡しているあいだに入った写真を下書きから消さない */
  await scene('㉞d', {}, async page => {
    const r = await page.evaluate(async () => {
      receptionSaveRows(__ledgerP1());
      M = freshModel(); ensureModelShape(M); render();
      await __import({ chosho_mgmt_no:'Z9999C01', chosho_cust_name:'C様', work_type:'detached', chosho_photos:[ __ph('c1', '#a5a') ],
                       editedAt:'2026-10-10T00:00:00.000Z' }, 'Z9999C01.json');
      M.chosho_note = 'Cを直した'; M._touched = true; await persistDraft();
      await __import(__pcFull());                            // いま開いている戸別は 2612MKM013（Z9999C01 は下書きの中だけ）
      await saveDirForget();
      const os = navigator.share; let raced = 0;
      navigator.share = async d => {
        if(!raced++){ const rec = await idbGet('no:Z9999C01'); rec.model.chosho_photos.push(__ph('c2', '#0aa')); await persistModel(rec.model); }
        return os(d);
      };
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const rec = await idbGet('no:Z9999C01');
      const sc = w.sharedTexts.map(t => { try{ return JSON.parse(t); }catch(_){ return null; } }).find(j => j && j.chosho_mgmt_no === 'Z9999C01');
      return { names: w.sharedNames, sent: __pids(sc), photos: __pids(rec && rec.model), rev: rec ? rec.rev | 0 : -1, fileRev: rec ? rec.fileRev | 0 : -1 };
    });
    console.log('㉞dまとめて保存のあいだの写真', J(r));
    ok(r.names.indexOf('Z9999C01.json') >= 0 && r.sent === 'c1', '試験の前提: Z9999C01 を いつもの名前で渡せていない → ' + J(r));
    ok(r.photos === 'c1,c2' && r.fileRev < r.rev,
       '★まとめて保存（共有）で渡しているあいだに入った写真が下書きから消えた／その写真まで渡した扱いにした → ' + J(r));
  });

  /* ---------- ㉟ 事務所でまとめた覚え（_sideMerged）を、共有・ダウンロードで渡す いつもの名前のファイルにも残す ---------- */
  await scene('㉟', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true });
      await saveDirForget();
      const SM = ['2026-10-01T00:00:00.000Z|2612MKM013_現場預け_20261001-101010.json'];
      await __import(Object.assign(__pcFull(), { _sideMerged: SM }));
      M.chosho_note = 'PCを読んで直した'; M._touched = true; saveDraft();
      const it = await sideBuild(M, 'verify');
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { names: w.sharedNames, merged: j && j._sideMerged, side: !!(j && j._side), sideFileMerged: ('_sideMerged' in it.state), want: SM };
    });
    console.log('㉟まとめた覚え', J(r));
    ok(r.names[0] === '2612MKM013.json' && !r.side, '試験の前提: PCのファイルを読んだ戸別を いつもの名前で渡せていない → ' + J(r));
    ok(JSON.stringify(r.merged) === JSON.stringify(r.want),
       '★共有で渡した いつもの名前のファイルから、事務所でまとめた覚え（_sideMerged）が落ちた（同じ預けをもう一度まとめてしまう）→ ' + J(r));
    ok(r.sideFileMerged === false, '★預けのファイルに、まとめた覚え（_sideMerged）を入れた → ' + J(r));
  });

  /* ---------- ㊱ まとめて保存：共有の画面を閉じた → 黙らず「📮 まとめて事務所に預ける」 ---------- */
  await scene('㊱a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      await saveDirForget();
      const os = navigator.share; let n = 0;
      navigator.share = async d => { if(n++ === 0) throw new DOMException('cancel', 'AbortError'); return os(d); };
      __plan = [null];                                       // 知らせは「やめる」
      const w0 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1200); }, 15000);
      const rec0 = await idbGet('no:2612MKM014');
      n = 0; __plan = ['📮 まとめて', '📤'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(2500); }, 20000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { w0: { picks: w0.picks, shared: w0.shared, dl: w0.dl.length, saved: !!(rec0 && (rec0.fileRev | 0) >= (rec0.rev | 0)) },
               w: { shared: w.shared, names: w.sharedNames }, why: j && j._side && j._side.why };
    });
    console.log('㊱a共有をやめた（まとめて保存）', J(r));
    const p = r.w0.picks[0] || {};
    ok(r.w0.picks.length === 1 && /保存をやめました（何も書いていません）/.test(p.title || '') && (p.rows || []).some(t => /^📮 まとめて事務所に預ける（1件）/.test(t)),
       '★まとめて保存で共有の画面を閉じたとき、黙って終わった（「📮 まとめて事務所に預ける」が出ない）→ ' + J(r.w0.picks));
    ok(r.w0.shared === 0 && r.w0.dl === 0 && !r.w0.saved, '★押す前に何か渡した・渡した扱いにした → ' + J(r.w0));
    ok(r.w.shared === 1 && SIDE14.test(r.w.names[0] || '') && r.why === 'cancel', '★知らせの 📮 で預けられない → ' + J(r));
  });
  /* iPhone（フォルダを選ぶ窓が無い・フォルダを覚えていない）：共有の画面を閉じた */
  await scene('㊱b', {}, async page => {
    const r = await page.evaluate(async () => {
      window.showDirectoryPicker = undefined;
      await __state({ no:'2612MKM014', noDir:true });
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      __shareMode = 'abort'; __plan = [null];
      const w0 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1200); }, 15000);
      return { w0: { picks: w0.picks, shared: w0.shared, dl: w0.dl.length } };
    });
    console.log('㊱b共有をやめた（iPhone）', J(r));
    const p = r.w0.picks[0] || {};
    ok(/保存をやめました（何も書いていません）/.test(p.title || '') && (p.rows || []).some(t => /^📮 まとめて事務所に預ける/.test(t)) && r.w0.shared === 0 && r.w0.dl === 0,
       '★iPhone のまとめて保存で共有の画面を閉じたとき、黙って終わった（または何か渡した）→ ' + J(r.w0));
  });

  /* ---------- ㊲ 「それでも、このまま保存しますか？」→ いいえ → 黙らず 📮 ---------- */
  await scene('㊲a', {}, async page => {
    const r = await page.evaluate(async () => {
      const txt = JSON.stringify(__pc14({ cable_main_len:'30', chosho_note:'PCの備考' }));
      await __state({ dirName:'リスト', no:'2612MKM014', files: { '2612MKM014.json': txt } });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      __cancelIf = /それでも、このまま保存しますか/;
      const w = await __watch(() => __press('btn-save'), 15000);
      const btn = __overlay();
      __cancelIf = null; __plan = ['📤'];
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { w: { said: w.said, ov: w.ov, wrote: w.wrote, shared: w.shared }, btn, w2: { shared: w2.shared, names: w2.sharedNames, wrote: w2.wrote },
               why: j && j._side && j._side.why, len: j && j.cable_main_len, same: __D.__files['2612MKM014.json'] === txt };
    });
    console.log('㊲a「いいえ」（覚えているフォルダ）', J(r));
    const ov = last(r.w.ov);
    ok(r.w.said.some(s => /それでも、このまま保存しますか/.test(s)), '試験の前提: 「それでも、このまま保存しますか？」が出ない → ' + J(r.w.said));
    ok(r.w.wrote.length === 0 && r.same && /保存をやめました/.test(ov.title || '') && ov.escape === 'merge' && /事務所に預ける/.test(r.btn),
       '★「いいえ」と答えたら黙って閉じた（「📮 別の名前で事務所に預ける」が無い）／書いた → ' + J([r.w, r.btn]));
    ok(r.w2.shared === 1 && SIDE14.test(r.w2.names[0] || '') && r.why === 'merge' && r.len === '12' && r.w2.wrote.length === 0 && r.same,
       '★「いいえ」のあとの 📮 で預けられない（またはPCのファイルを書き替えた）→ ' + J([r.w2, r.why]));
  });
  await scene('㊲b', { savePicker:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ noDir:true, no:'2612MKM014' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const txt = JSON.stringify(__pc14({ cable_main_len:'30', chosho_note:'PCの備考' }));
      const pick = __mkdir('x', { '2612MKM014.json': txt }, {});
      window.__savePickerRet = await pick.getFileHandle('2612MKM014.json');
      __cancelIf = /それでも、このまま保存しますか/;
      const w = await __watch(() => __press('btn-save'), 15000);
      return { w: { said: w.said, ov: w.ov }, btn: __overlay(), wrote: pick.__wrote.slice(), same: pick.__files['2612MKM014.json'] === txt };
    });
    console.log('㊲b「いいえ」（保存先を選ぶ画面）', J(r));
    const ov = last(r.w.ov);
    ok(r.w.said.some(s => /それでも、このまま保存しますか/.test(s)), '試験の前提: 「それでも、このまま保存しますか？」が出ない → ' + J(r.w.said));
    ok(r.wrote.length === 0 && r.same && /保存をやめました/.test(ov.title || '') && ov.escape === 'merge' && /事務所に預ける/.test(r.btn),
       '★保存先を選ぶ画面の道で「いいえ」と答えたら黙って閉じた（📮 が無い）／書いた → ' + J(r));
  });

  /* ---------- ㊳ 見るだけの帯：「ここで保存すると、上の中身はPCのファイルから消えます」と言わない ---------- */
  await scene('㊳', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state();
      const band = () => ((document.getElementById('pcguard') || {}).innerText || '').replace(/\s+/g, ' ');
      const a = band();
      const lg = __ledgerP1(); lg.rows[0] = { mgmt_no:'2612MKM013', name:'工藤 一', addr:'三沢市X町1', photos:6, has_dwg:true, contractor:'A社' };
      receptionSaveRows(lg); renderPcGuard();
      return { vo: !!M._viewOnly, a, b: band() };
    });
    console.log('㊳見るだけの帯', J(r));
    ok(r.vo, '試験の前提: 見るだけになっていない');
    ok(!/PCのファイルから消えます/.test(r.a) && /保存」を押しても、PCのファイルは書き替えません/.test(r.a) && /直すときは、PCで/.test(r.a),
       '★工事が終わっている見るだけの帯が「ここで保存すると…PCのファイルから消えます」と言う（いまは書き替えない）→ ' + r.a);
    ok(!/PCのファイルから消えます/.test(r.b) && /保存」を押しても、PCのファイルは書き替えません/.test(r.b),
       '★見るだけの帯が「このまま保存すると…PCのファイルから消えます」と言う（いまは書き替えない）→ ' + r.b);
  });

  /* ---------- ㊴ 端末の中だけかもしれないフォルダ（その2）への いつもの保存 → ⚠ と「📮 事務所にも届ける」 ---------- */
  await scene('㊴a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      savePlaceOkSet(__P1);                                  // 「このフォルダのままにする」と答えた
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      await __sleep(2600);                                   // 緑の知らせは 2.2秒で勝手に閉じる。閉じないこと
      const still = !!document.getElementById('save-ov');
      const btn = __overlay();
      __plan = ['📤'];
      const w2 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { w: { wrote: w.wrote, ov: w.ov }, still, btn, w2: { shared: w2.shared, names: w2.sharedNames, wrote: w2.wrote },
               why: j && j._side && j._side.why, photos: __pids(j), len: j && j.cable_main_len };
    });
    console.log('㊴aその2にいつもの保存', J(r));
    const ov = last(r.w.ov);
    ok(r.w.wrote.indexOf('2612MKM014.json') >= 0 && /^保存しました/.test(ov.title || ''), '試験の前提: その2 に いつもの名前で書けていない → ' + J(r.w));
    ok(r.still && ov.escape === 'resend' && /この端末の中だけのフォルダなら、事務所には届きません/.test(ov.msg || '') && /^📮 事務所にも届ける/.test(r.btn),
       '★端末の中だけかもしれないフォルダ（その2）に書いたのに、緑の「保存しました」が勝手に閉じた（⚠・「📮 事務所にも届ける」が無い）→ ' + J([r.still, ov, r.btn]));
    ok(r.w2.shared === 1 && SIDE14.test(r.w2.names[0] || '') && r.why === 'resend' && r.photos === 't1' && r.len === '12' && r.w2.wrote.length === 0,
       '★「📮 事務所にも届ける」で、同じ戸別を別の名前で渡せない → ' + J([r.w2, r.why]));
  });
  await scene('㊴b', { pc:true }, async page => {      // PC（「リスト」は Dropbox のフォルダ）
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      await __sleep(2600);
      return { w: { wrote: w.wrote, ov: w.ov }, still: !!document.getElementById('save-ov') };
    });
    console.log('㊴b(PC)リストにいつもの保存', J(r));
    const ov = last(r.w.ov);
    ok(r.w.wrote.indexOf('2612MKM014.json') >= 0 && /^保存しました/.test(ov.title || '') && !ov.escape && !r.still,
       '★PCの読む「リスト」に書いたのに、⚠・📮 を出した（または緑の知らせが閉じない）→ ' + J(r));
  });
  /* ㊴d Android は、フォルダを選ぶ画面に Dropbox が出ない＝「リスト」に書いても端末の中。⚠ と 📮 を出す */
  await scene('㊴d', {}, async page => {
    const r = await page.evaluate(async () => {
      Object.defineProperty(navigator, 'userAgent', { configurable:true,
        get: () => 'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' });
      await __state({ no:'2612MKM014', dirName:'リスト' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      await __sleep(2600);
      return { w: { wrote: w.wrote, ov: w.ov }, still: !!document.getElementById('save-ov'), btn: __overlay() };
    });
    console.log('㊴dAndroidでリストにいつもの保存', J(r));
    const ov = last(r.w.ov);
    ok(r.w.wrote.indexOf('2612MKM014.json') >= 0 && /^保存しました/.test(ov.title || ''), '試験の前提: リスト に いつもの名前で書けていない → ' + J(r.w));
    ok(r.still && ov.escape === 'resend' && /この端末の中だけのフォルダなら、事務所には届きません/.test(ov.msg || '') && /^📮 事務所にも届ける/.test(r.btn),
       '★Android で「リスト」に書いたのに、緑の「保存しました」が勝手に閉じた（Android のフォルダはいつも端末の中。⚠・「📮 事務所にも届ける」が無い）→ ' + J([r.still, ov, r.btn]));
  });
  await scene('㊴c', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      savePlaceOkSet(__P1);
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      __pickerMode = 'return'; __pickerRet = __copyDir(__D);
      __plan = ['📮 書いた', '📤'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(2500); }, 20000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { w: Object.assign({}, w, { sharedTexts: 0 }), why: j && j._side && j._side.why, photos: __pids(j), canon: !!__fileOf(__D, '2612MKM014.json') };
    });
    console.log('㊴cまとめて保存でその2', J(r));
    const p = r.w.picks.find(x => /その2/.test(x.title || '')) || {};
    ok(r.w.wrote.indexOf('2612MKM014.json') >= 0 && r.canon, '試験の前提: まとめて保存で その2 に書けていない → ' + J(r.w.wrote));
    ok(/この端末の中だけのフォルダなら/.test(p.note || '') && (p.rows || []).some(t => /^📮 書いた 1件を事務所にも届ける/.test(t)),
       '★まとめて保存で端末の中だけかもしれないフォルダに書いたのに、最後に「📮 書いた N件を事務所にも届ける」を出さない → ' + J(r.w.picks));
    { const d = r.w.picks.find(x => /^📮 事務所に預ける/.test(x.title || '')) || {};
      ok(/物件情報_調書 ＞ その１ ＞ リスト/.test((d.subs || [])[0] || '') && !/（その１） ＞/.test((d.subs || [])[0] || ''),
         '★共有の案内が Dropbox のフォルダ名（その１ ＞ リスト）で言っていない（物件の正式名では Dropbox で見つからない）→ ' + J(d.subs)); }
    ok(r.w.shared === 1 && SIDE14.test(r.w.sharedNames[0] || '') && r.why === 'resend' && r.photos === 't1',
       '★まとめて保存のあとの「📮 事務所にも届ける」で渡せない → ' + J([r.w.sharedNames, r.why]));
    /* 書いた戸別は保存済み（💾）になり、次の「まとめて保存」には出ない。「あとで」は 履歴 の 📮 を言う */
    const later = (p.subs || [])[(p.rows || []).indexOf('あとで')];
    ok(later && !/まとめて保存/.test(later) && /履歴/.test(later) && /選んで事務所に預ける/.test(later),
       '★その2 に書いたあとの「あとで」が「もう一度まとめて保存からできます」と言う（書いた戸別は もう出てこない）→ ' + J([p.rows, p.subs]));
  });

  /* ---------- ㊵ 同じ戸別の別名ファイル（「2612MKM013 2.json」）に写真・完了があっても、本物のPCのファイルとして読む ---------- */
  await scene('㊵a', {}, async page => {
    const r = await page.evaluate(async () => {
      const dup = Object.assign(__pcFull(), { editedAt:'2026-10-12T00:00:00.000Z' });
      const st = await __state({ dirName:'リスト', files: { '2612MKM013.json': JSON.stringify(__pcFile()), '2612MKM013 2.json': JSON.stringify(dup) } });
      const w = await __watch(() => __press('btn-save'), 15000);
      const f = __fileOf(__D, '2612MKM013.json');
      return { st, w: { wrote: w.wrote, shared: w.shared, picks: w.picks.map(p => p.title), ov: w.ov }, file: f && { photos: __pids(f), note: f.chosho_note, done: f.work_done } };
    });
    console.log('㊵a別名ファイル（1件の保存）', J(r));
    ok(r.st.viewOnly === false && r.st.fromCase === true,
       '★「2612MKM013 2.json」に写真6枚・工事完了があるのに、見るだけが外れない（1つのファイルだけで判定した）→ ' + J(r.st));
    ok(r.w.wrote.indexOf('2612MKM013.json') >= 0 && r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && r.file.note === '現場メモ 追記' && r.file.done === true && r.w.shared === 0,
       '★いつもの保存で、別名ファイルの写真・工事完了まで読み合わせて書かない（写真・完了が欠けた・預けに回した）→ ' + J([r.w, r.file]));
  });
  await scene('㊵b', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ noDir:true });
      const d = __mkdir('リスト', { '2612MKM013.json': JSON.stringify(__pcFile()), '2612MKM013 2.json': JSON.stringify(__pcFull()) }, {});
      window.__D = d;
      __pickerMode = 'return'; __pickerRet = __copyDir(d);
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const f = __fileOf(d, '2612MKM013.json');
      return { st, w: { wrote: w.wrote, shared: w.shared, picks: w.picks.map(p => p.title) }, file: f && { photos: __pids(f), note: f.chosho_note } };
    });
    console.log('㊵b別名ファイル（まとめて保存）', J(r));
    ok(r.st.viewOnly === true, '試験の前提: 見るだけになっていない');
    ok(r.w.wrote.indexOf('2612MKM013.json') >= 0 && r.file && r.file.photos === 'pc1,pc2,pc3,pc4,pc5,pc6,t1' && !r.w.picks.some(t => /書けなかった/.test(t)),
       '★まとめて保存で、別名ファイルに写真6枚・工事完了があるのに書かない（預けに回した）／写真が欠けた → ' + J([r.w, r.file]));
  });


  /* ======== 版176 第3回の直し ======== */
  /* ---------- ㊶ PC版のサイトを開いている Android タブレットも Android と見る ---------- */
  await scene('㊶a', {}, async page => {
    const r = await page.evaluate(async () => {
      const env = { ua: navigator.userAgent, touch: navigator.maxTouchPoints | 0,
                    android: (typeof isAndroidLike === 'function') ? isAndroidLike() : null };
      await __state({ no:'2612MKM014', dirName:'リスト' });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      await __sleep(2600);                                   // 緑の知らせは 2.2秒で勝手に閉じる。閉じないこと
      const still = !!document.getElementById('save-ov'), btn = __overlay();
      try{ saveOverlayHide(); }catch(_){}
      /* まとめて保存も：書いた戸別を「📮 書いた N件を事務所にも届ける」で渡せる */
      M.cable_main_len = '13'; M._touched = true; await persistDraft();
      __pickerMode = 'return'; __pickerRet = __copyDir(__D); __plan = [null];
      const w2 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      return { env, w: { wrote: w.wrote, ov: w.ov }, still, btn, w2: { wrote: w2.wrote, picks: w2.picks.map(p => ({ title: p.title, rows: p.rows })) } };
    });
    console.log('㊶aPC版のサイトのタブレットでリストに保存', J(r));
    ok(/X11; Linux x86_64/.test(r.env.ua) && !/Android/.test(r.env.ua) && r.env.touch > 0,
       '試験の前提: PC版のサイトを開いたタブレット（名前は Linux・指で触れる）になっていない → ' + J(r.env));
    ok(r.env.android === true, '★PC版のサイトを開いた Android タブレット（名前は「X11; Linux x86_64」）を Android と見ない → ' + J(r.env));
    const ov = last(r.w.ov);
    ok(r.w.wrote.indexOf('2612MKM014.json') >= 0 && /^保存しました/.test(ov.title || ''), '試験の前提: リスト に いつもの名前で書けていない → ' + J(r.w));
    ok(r.still && ov.escape === 'resend' && /この端末の中だけのフォルダなら、事務所には届きません/.test(ov.msg || '') && /^📮 事務所にも届ける/.test(r.btn),
       '★PC版のサイトを開いたタブレットで「リスト」に書いたのに、緑の「保存しました」が勝手に閉じた（⚠・「📮 事務所にも届ける」が無い）→ ' + J([r.still, ov, r.btn]));
    ok(r.w2.wrote.indexOf('2612MKM014.json') >= 0 && r.w2.picks.some(p => (p.rows || []).some(t => /^📮 書いた 1件を事務所にも届ける/.test(t))),
       '★PC版のサイトを開いたタブレットのまとめて保存で、「リスト」に書いたあと「📮 書いた N件を事務所にも届ける」を出さない → ' + J(r.w2));
  });
  await scene('㊶b', { pc:true }, async page => {
    const r = await page.evaluate(() => {
      if(typeof isAndroidLike !== 'function') return null;
      const pc0 = isAndroidLike();                           // この入れ物そのもの（Windows・指で触れない）
      const dev0 = saveDirMaybeDevice({ name:'リスト' });
      const set = (ua, touch, plat) => {
        Object.defineProperty(navigator, 'userAgent', { configurable:true, get: () => ua });
        Object.defineProperty(navigator, 'maxTouchPoints', { configurable:true, get: () => touch });
        Object.defineProperty(navigator, 'userAgentData', { configurable:true, get: () => (plat == null ? undefined : { platform: plat }) });
        return isAndroidLike();
      };
      const W = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
      const L = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
      const out = {
        win: set(W, 0, 'Windows'), winTouch: set(W, 10, 'Windows'),
        mac: set('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'macOS'),
        linuxPc: set(L, 0, 'Linux'),
        cros: set('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 10, 'Chrome OS'),
        tabDesktop: set(L, 5, 'Linux'), tabNoData: set(L, 5, null),
        android: set('Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 5, 'Android'),
        plat: set(L, 0, 'Android')
      };
      const dev1 = saveDirMaybeDevice({ name:'リスト' });     // 最後は Android（platform）
      return Object.assign({ pc0, dev0, dev1 }, out);
    });
    console.log('㊶bAndroidの見分け', J(r));
    ok(r && r.pc0 === false && r.dev0 === false, '試験の前提: Windows のPCの入れ物なのに Android と見た／PCの「リスト」を端末の中と見た → ' + J(r));
    ok(r && r.win === false && r.winTouch === false && r.mac === false && r.linuxPc === false && r.cros === false,
       '★Windows（指で触れるものも）・Mac・Linux のPC・Chromebook を Android と見た（PCの保存に ⚠ が出る）→ ' + J(r));
    ok(r && r.tabDesktop === true && r.tabNoData === true && r.android === true && r.plat === true && r.dev1 === true,
       '★PC版のサイトを開いた Android タブレット（Linux＋指で触れる／platform が Android）を Android と見ない → ' + J(r));
  });

  /* ---------- ㊷ 書いたあとの控えを当てにするのは、今の保存先そのもので、端末の中だけかもしれないフォルダでないときだけ ---------- */
  await scene('㊷a', { ua:'android' }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });  // Android：端末の中の「リスト」（親なし）
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const o1 = w1.ov[w1.ov.length - 1] || {};
      try{ saveOverlayHide(); }catch(_){}
      /* 次の日：備考を直して保存 → 書く許可が取れない → 📮 → 📤 */
      M.chosho_note = '二日目の備考'; M._touched = true; saveDraft();
      __D.__perm = 'prompt'; __D.__req = 'denied';
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const o2 = w2.ov[w2.ov.length - 1] || {};
      const btn = __overlay();
      __plan = ['📤'];
      const w3 = await __watch(async () => { __click('save-ov-side'); await __sleep(1500); }, 15000);
      const j = w3.sharedTexts[0] ? JSON.parse(w3.sharedTexts[0]) : null;
      return { ua: navigator.userAgent, wrote1: w1.wrote, esc1: o1.escape || '', esc2: o2.escape || '', btn, names: w3.sharedNames,
               side: j && j._side, len: j && j.cable_main_len, note: j && j.chosho_note };
    });
    console.log('㊷aAndroidのリストに書いたあと📮', J(r));
    ok(/Android/.test(r.ua) && r.wrote1.indexOf('2612MKM014.json') >= 0 && r.esc1 === 'resend' && r.esc2 === 'perm' && /事務所に預ける/.test(r.btn),
       '試験の前提: Android の「リスト」に書けていない／許可が取れないときの 📮 が出ない → ' + J(r));
    ok(r.names.length === 1 && SIDE14.test(r.names[0] || '') && r.side && r.side.why === 'perm' && r.len === '12' && r.note === '二日目の備考',
       '試験の前提: 📮 で預けられない → ' + J([r.names, r.side, r.len]));
    ok(r.side && Array.isArray(r.side.touched) && r.side.touched.indexOf('cable_main_len') >= 0 && r.side.touched.indexOf('chosho_note') >= 0,
       '★Android の「リスト」（端末の中）に書いた控えを当てにして、前の日に入れた欄（主線の長さ）を直した欄（touched）から落とした（事務所で採られない）→ ' + J(r.side && r.side.touched));
  });
  await scene('㊷b', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト' });  // PC：「リスト」
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      try{ saveOverlayHide(); }catch(_){}
      const b1 = fileBaseGet(M);
      const it1 = await sideBuild(M, 'write');              // 同じ「リスト」のまま（書いたあとの控えを当てにしてよい）
      /* 別の「リスト」（端末の中に作ったものなど）を選び直した → 前の「リスト」に書いた控えは、もう当てにしない */
      const B = __mkdir('リスト', {}, {}); await saveDirSet(B, null); window.__D = B;
      M.chosho_note = '選び直したあと'; M._touched = true; saveDraft();
      const it2 = await sideBuild(M, 'write');
      return { wrote: w1.wrote, base1: b1 && { from: b1.from, ep: !!b1.ep, rd: !!b1.rd }, t1: it1.state._side.touched, t2: it2.state._side.touched };
    });
    console.log('㊷bPCでリストを選び直したあと', J(r));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && r.base1 && r.base1.from === 'list' && r.base1.ep && !r.base1.rd,
       '試験の前提: PCの「リスト」に書いた控えになっていない → ' + J(r));
    ok(Array.isArray(r.t1) && r.t1.indexOf('cable_main_len') < 0, '★PCの「リスト」に書いた控え（同じフォルダのまま）を当てにしない → ' + J(r.t1));
    ok(Array.isArray(r.t2) && r.t2.indexOf('cable_main_len') >= 0 && r.t2.indexOf('chosho_note') >= 0,
       '★別の「リスト」を選び直したあとも、前のフォルダに書いた控えを当てにして、前に入れた欄を直した欄（touched）から落とした → ' + J(r.t2));
  });

  /* ---------- ㊸ PCのファイルらしくないファイルを読んでも、PCのファイルを読んだことにしない ---------- */
  await scene('㊸a', {}, async page => {
    const r = await page.evaluate(async () => {
      const st = await __state({ no:'2612MKM013' });
      /* この端末が前に「その2」へ書いた写し（写真 t1 だけ・未完了）を 📂 で読む（台帳は PCに写真6枚・工事完了） */
      const own = { chosho_mgmt_no:'2612MKM013', chosho_cust_name:'工藤 一', work_type:'detached', chosho_note:'現場メモ',
                    chosho_photos:[ __ph('t1', '#c33') ], editedAt:'2026-09-23T00:00:00.000Z' };
      await __import(own, '2612MKM013.json');
      const b = fileBaseGet(M);
      const after = { base: !!b, rd: !!(b && b.rd) };
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { st, after, names: w.sharedNames, side: j && j._side, photos: __pids(j), ov: w.ov.map(o => o && o.title) };
    });
    console.log('㊸a薄い写しを📂で読んで共有', J(r));
    ok(r.st.viewOnly === true && r.after.base, '試験の前提: 見るだけになっていない／📂 で読めていない → ' + J(r));
    ok(!r.after.rd, '★台帳は PCに写真6枚・工事完了なのに、写真1枚の写しを 📂 で読んだだけで「PCのファイルを読んだ」ことにした → ' + J(r.after));
    ok(r.names.length === 1 && SIDE13.test(r.names[0] || '') && r.side && r.side.why === 'share' && r.photos === 't1',
       '★薄い写しを読んだだけの戸別を、共有で いつもの名前（2612MKM013.json）で渡した（事務所が Dropbox で「置き換え」ると PCの写真6枚が消える）→ ' + J(r));
  });
  await scene('㊸b', {}, async page => {
    const r = await page.evaluate(async () => {
      const dup = Object.assign(__pcFull(), { editedAt:'2026-10-12T00:00:00.000Z' });
      const st = await __state({ dirName:'リスト', files: { '2612MKM013.json': JSON.stringify(__pcFile()), '2612MKM013 2.json': JSON.stringify(dup) } });
      const b = fileBaseGet(M);
      const base = b && { rd: !!b.rd, photos: b.photos.map(p => p.id).sort().join(',') };
      const pb = (await pbaseIds('2612MKM013')).slice().sort().join(',');
      const mine = __pids({ chosho_photos: M.chosho_photos });
      const miss = await photosMissing(M, buildStateOf(M));   // 別名ファイルにしかない写真（pc4〜pc6）
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      return { st, base, pb, mine, miss, names: w.sharedNames, side: j && j._side, photos: __pids(j) };
    });
    console.log('㊸b薄いファイル＋別名ファイル', J(r));
    ok(r.st.viewOnly === false && r.st.fromCase === true && r.base && r.mine === 'pc1,pc2,pc3,t1', '試験の前提: 別名ファイルで見るだけが外れていない → ' + J(r));
    ok(r.base && !r.base.rd, '★読み込んだのは写真3枚のファイルなのに（6枚は別名ファイル）、「PCのファイルを読んだ」ことにした → ' + J(r.base));
    ok(r.pb === 'pc1,pc2,pc3,pc4,pc5,pc6' && r.miss === 3,
       '★別名ファイルにしかない写真（pc4〜pc6）を写真の歯止めに入れていない（その写真の無いファイルを いつもの名前で渡せる）→ ' + J([r.pb, r.miss]));
    ok(r.names.length === 1 && SIDE13.test(r.names[0] || '') && r.side && r.side.why === 'share' && r.side.lacks === 3,
       '★写真3枚のファイルを読んだだけの戸別を、共有で いつもの名前（2612MKM013.json）で渡した（PCの写真 pc4〜pc6 が抜ける）→ ' + J([r.names, r.side, r.photos]));
  });

  /* ---------- ㊹ フォルダに書いたときに足した _sideMerged を、そのあと共有で渡すファイルにも残す ---------- */
  await scene('㊹', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      savePlaceOkSet(__P1);
      const A = '2026-10-01T00:00:00.000Z|2612MKM014', B = '2026-10-13T00:00:00.000Z|2612MKM014';
      await __import(__pc14({ _sideMerged:[A] }), '2612MKM014.json');
      /* そのあと事務所が別の預け（B）をまとめた → フォルダのファイルは [A, B] */
      __D.__files['2612MKM014.json'] = JSON.stringify(__pc14({ _sideMerged:[A, B], editedAt:'2026-10-13T01:00:00.000Z' }));
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      const w1 = await __watch(() => __press('btn-save'), 15000);
      const f1 = __fileOf(__D, '2612MKM014.json');
      try{ saveOverlayHide(); }catch(_){}
      const pt = ((M._passthrough || {})._sideMerged || []).slice();
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      return { A, B, wrote: w1.wrote, fileStamps: f1 && f1._sideMerged, modelStamps: pt, names: w2.sharedNames, side: !!(j && j._side), sharedStamps: j && j._sideMerged };
    });
    console.log('㊹まとめた覚えを共有にも', J(r));
    ok(r.wrote.indexOf('2612MKM014.json') >= 0 && JSON.stringify(r.fileStamps) === JSON.stringify([r.A, r.B]),
       '試験の前提: フォルダのファイルに まとめた覚え [A, B] が入っていない → ' + J(r));
    ok(r.names[0] === '2612MKM014.json' && !r.side, '試験の前提: PCのファイルを読んだ戸別を いつもの名前で渡せていない → ' + J(r.names));
    ok(JSON.stringify(r.modelStamps) === JSON.stringify([r.A, r.B]) && JSON.stringify(r.sharedStamps) === JSON.stringify([r.A, r.B]),
       '★フォルダに書いたときの まとめた覚え（事務所の新しい B）を画面の中身に入れず、そのあと共有で渡したファイルから落とした（同じ預けをもう一度まとめてしまう）→ ' + J([r.modelStamps, r.sharedStamps]));
  });

  /* ---------- ㊺ 共有で渡す道の案内は、Dropbox で見つかる名前（その１ ＞ リスト） ---------- */
  await scene('㊺', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });                    // 端末の中の「その2」（受付台帳の物件と違う）
      __plan = [null];
      const w0 = await __watch(async () => { await savePlaceCheckAfterImport(); await __sleep(300); }, 10000);
      await saveDirForget(); renderSaveBar(); await __sleep(100);
      const sb = document.getElementById('sb-dest');
      const bar = { text: sb ? sb.textContent.replace(/\s+/g, ' ').trim() : '', title: sb ? (sb.getAttribute('title') || '') : '' };
      const forget = saveForgetDoneText();
      const line = saveHintLine();
      saveOverlayShow('2612MKM014.json');
      const ovs = ((document.getElementById('save-ov') || {}).innerText || '').replace(/\s+/g, ' ');
      try{ saveOverlayHide(); }catch(_){}
      return { pick: w0.picks[0] || null, bar, forget, line, ovs, hint: saveHintName(), route: saveRoute() };
    });
    console.log('㊺共有の案内の名前', J(r));
    const p = r.pick || {};
    const i = (p.rows || []).findIndex(t => /^📤/.test(t));
    const sub = i >= 0 ? (p.subs || [])[i] : '';
    ok(r.hint === P1 + '/リスト' && r.route === 'share', '試験の前提: フォルダを覚えるのをやめたあと、入れる場所が「その１ の物件/リスト」になっていない → ' + J([r.hint, r.route]));
    ok(/「その１ ＞ リスト」/.test(sub) && sub.indexOf(P1) < 0,
       '★取り込みのあとの窓の「📤 フォルダを覚えるのをやめて、共有で渡す」の説明が、Dropbox に無い物件の正式名で言う → ' + sub);
    ok(/その１/.test(r.bar.text) && r.bar.text.indexOf(P1) < 0 && /「その１ ＞ リスト」/.test(r.bar.title) && r.bar.title.indexOf(P1) < 0,
       '★保存バーの「📤 共有で渡す（…）」が、Dropbox に無い物件の正式名で言う → ' + J(r.bar));
    ok(/「その１ ＞ リスト」/.test(r.forget) && r.forget.indexOf(P1) < 0,
       '★「フォルダを覚えるのをやめました」の知らせが、Dropbox に無い物件の正式名で言う → ' + r.forget);
    ok(/「その１」フォルダの中の「リスト」/.test(r.line) && r.line.indexOf(P1) < 0,
       '★共有で渡したあとの案内（★入れる場所★）が、Dropbox に無い物件の正式名で言う → ' + r.line);
    ok(/入れる所：その１ ＞ リスト/.test(r.ovs) && r.ovs.indexOf(P1) < 0, '★保存中の「入れる所」が、Dropbox に無い物件の正式名で言う → ' + r.ovs);
  });

  /* ---------- ㊻ 共有の画面が出ているあいだに中身が変わったら、いま開いている戸別を「保存済」にしない ---------- */
  await scene('㊻a', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      await __import(__pc14(), '2612MKM014.json');
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      await __sleep(600);
      const os = navigator.share; let n = 0;
      navigator.share = async d => {
        await os(d);
        if(!n++){ M.chosho_photos.push(__ph('late', '#0a0')); saveDraft(); await persistDraft(); }   // 共有の画面が出ているあいだに写真の取り込みが終わった（下書きにも入った）
        await __sleep(700);
      };
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(800); }, 20000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      await __sleep(800);
      const rec = await idbGet(M._lastDraftKey);
      await refreshDraftInfo(true);
      const r1 = { names: w.sharedNames, sent: __pids(j), m: __pids({ chosho_photos: M.chosho_photos }), rev: rec.rev | 0, fileRev: rec.fileRev | 0,
                   stale: saveStale(), h: handoverOf(draftInfoOf('2612MKM014')) };
      /* もう一度まとめて保存（中身は変わらない）→ 保存済になる */
      navigator.share = os;
      const w2 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(800); }, 20000);
      const j2 = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      await __sleep(800);
      const rec2 = await idbGet(M._lastDraftKey);
      return { r1, r2: { names: w2.sharedNames, sent: __pids(j2), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊻aまとめて保存（共有）のあいだに写真', J(r));
    ok(r.r1.names.length === 1 && r.r1.names[0] === '2612MKM014.json' && r.r1.sent === 'q1,t1' && r.r1.m === 'late,q1,t1',
       '試験の前提: いつもの名前で渡せていない／あとから入った写真が画面に無い → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && r.r1.h !== 'ok',
       '★共有の画面が出ているあいだに入った写真（渡したファイルには無い）まで「保存済」にした（まとめて保存から外れ、その写真が渡らない）→ ' + J(r.r1));
    ok(r.r2.names[0] === '2612MKM014.json' && r.r2.sent === 'late,q1,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false,
       '★中身が変わっていない2回目のまとめて保存で「保存済」にならない → ' + J(r.r2));
  });
  await scene('㊻b', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      await __import(__pc14(), '2612MKM014.json');
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      await __sleep(600);
      const os = navigator.share; let n = 0;
      navigator.share = async d => {
        await os(d);
        if(!n++){ M.chosho_photos.push(__ph('late', '#0a0')); saveDraft(); await persistDraft(); }   // 同じ（下書きにも入った）
        await __sleep(300);
      };
      const w = await __watch(() => __press('btn-save'), 15000);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      await __sleep(800);
      const rec = await idbGet(M._lastDraftKey);
      const o = w.ov[w.ov.length - 1] || {};
      const r1 = { names: w.sharedNames, sent: __pids(j), m: __pids({ chosho_photos: M.chosho_photos }), rev: rec.rev | 0, fileRev: rec.fileRev | 0,
                   stale: saveStale(), title: o.title || '', msg: o.msg || '' };
      try{ saveOverlayHide(); }catch(_){}
      navigator.share = os;
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j2 = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      await __sleep(800);
      const rec2 = await idbGet(M._lastDraftKey);
      return { r1, r2: { names: w2.sharedNames, sent: __pids(j2), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊻b1件の保存（共有）のあいだに写真', J(r));
    ok(r.r1.names.length === 1 && r.r1.names[0] === '2612MKM014.json' && r.r1.sent === 'q1,t1' && r.r1.m === 'late,q1,t1' && /共有で渡しました/.test(r.r1.title),
       '試験の前提: いつもの名前で渡せていない／あとから入った写真が画面に無い → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && /まだ渡していません/.test(r.r1.msg),
       '★1件の保存（共有）で、共有の画面が出ているあいだに入った写真まで「保存済」にした（またはそのことを言わない）→ ' + J(r.r1));
    ok(r.r2.names[0] === '2612MKM014.json' && r.r2.sent === 'late,q1,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false,
       '★中身が変わっていない2回目の保存で「保存済」にならない → ' + J(r.r2));
  });

  /* ---------- ㊼ 1件の保存（共有）：保存が下書きを書いているあいだに入った写真も「渡した」にしない ---------- */
  await scene('㊼', {}, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014' });
      await __import(__pc14(), '2612MKM014.json');           // PCのファイルを読んだ＝いつもの名前で渡す
      await saveDirForget();
      M.chosho_note = '共有で直した'; M._touched = true; saveDraft();
      await __sleep(800);
      __lateArm();
      const os = navigator.share;
      navigator.share = async d => { await os(d); await __sleep(1200); };   // 共有の画面で Dropbox を選ぶのに1秒ほど
      const w = await __watch(() => __press('btn-save'), 15000);
      __lateOff(); navigator.share = os;
      await __sleep(1200);
      const j = w.sharedTexts[0] ? JSON.parse(w.sharedTexts[0]) : null;
      const rec = await idbGet(M._lastDraftKey);
      const o = w.ov[w.ov.length - 1] || {};
      await refreshDraftInfo(true);
      const r1 = { fired: __lateFired, names: w.sharedNames, sent: __pids(j), m: __pids(M), rev: rec.rev | 0, fileRev: rec.fileRev | 0,
                   stale: saveStale(), h: handoverOf(draftInfoOf('2612MKM014')), title: o.title || '', msg: o.msg || '' };
      try{ saveOverlayHide(); }catch(_){}
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j2 = w2.sharedTexts[0] ? JSON.parse(w2.sharedTexts[0]) : null;
      await __sleep(800);
      const rec2 = await idbGet(M._lastDraftKey);
      return { r1, r2: { names: w2.sharedNames, sent: __pids(j2), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊼1件の保存（共有）：下書きを書くあいだに写真', J(r));
    ok(r.r1.fired === 1 && r.r1.names.length === 1 && r.r1.names[0] === '2612MKM014.json' && r.r1.sent === 'q1,t1' && r.r1.m === 'late,q1,t1'
       && /共有で渡しました/.test(r.r1.title),
       '試験の前提: いつもの名前で渡せていない／保存の途中で写真が入っていない（渡す中身を作ったあとに入っていない）→ ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && r.r1.h !== 'ok' && /まだ渡していません/.test(r.r1.msg),
       '★1件の保存（共有）で、下書きを書いているあいだに入った写真（渡したファイルには無い）まで「保存済」にした（またはそのことを言わない）→ ' + J(r.r1));
    ok(r.r2.names[0] === '2612MKM014.json' && r.r2.sent === 'late,q1,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false,
       '★もう一度「保存」を押しても、その写真が渡らない／「保存済」にならない → ' + J(r.r2));
  });

  /* ---------- ㊽ 保存の途中で入った写真があれば「保存済」にしない（フォルダ・保存先を選ぶ画面・ダウンロード・まとめて保存） ---------- */
  await scene('㊽a', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト', files: { '2612MKM014.json': JSON.stringify(__pc14()) } });
      const parent = __mkdir('その１', {}, { 'リスト': __D });
      await saveDirSet(__D, parent);                         // PCの Dropbox「その１ ＞ リスト」
      savePlaceOkSet(__P1);
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      await __sleep(800);
      __lateArm();
      const w = await __watch(() => __press('btn-save'), 15000);
      __lateOff();
      await __sleep(1200);
      const f = __fileOf(__D, '2612MKM014.json');
      const rec = await idbGet(M._lastDraftKey);
      const o = w.ov[w.ov.length - 1] || {};
      await refreshDraftInfo(true);
      const r1 = { fired: __lateFired, wrote: w.wrote, title: o.title || '', warn: !!o.warn, msg: o.msg || '', written: __pids(f), m: __pids(M),
                   rev: rec.rev | 0, fileRev: rec.fileRev | 0, stale: saveStale(), h: handoverOf(draftInfoOf('2612MKM014')) };
      try{ saveOverlayHide(); }catch(_){}
      const w2 = await __watch(() => __press('btn-save'), 15000);
      await __sleep(800);
      const f2 = __fileOf(__D, '2612MKM014.json');
      const rec2 = await idbGet(M._lastDraftKey);
      const o2 = w2.ov[w2.ov.length - 1] || {};
      return { r1, r2: { wrote: w2.wrote, written: __pids(f2), title: o2.title || '', warn: !!o2.warn, rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊽aフォルダに書く道：保存の途中で写真', J(r));
    ok(r.r1.fired === 1 && r.r1.wrote.length === 1 && r.r1.written === 'q1,t1' && /late/.test(r.r1.m) && /保存しました/.test(r.r1.title),
       '試験の前提: 「その１ ＞ リスト」に書けていない／保存の途中で写真が入っていない → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && r.r1.h !== 'ok',
       '★フォルダに書いた保存で、書いたファイルに入っていない写真（保存の途中で入った）まで「保存済」にした（まとめて保存から外れ、その写真が PC に渡らない）→ ' + J(r.r1));
    ok(/保存の途中で入った写真は、まだ渡していません/.test(r.r1.msg) && r.r1.warn === true,
       '★保存の途中で入った写真がまだ渡っていないことを言わない（緑の「保存しました」で閉じる）→ ' + J(r.r1));
    ok(r.r2.written === 'late,q1,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false && r.r2.warn === false,
       '★もう一度「保存」を押しても、その写真が書けない／「保存済」にならない／⚠ のまま → ' + J(r.r2));
  });
  await scene('㊽b', { pc:true, savePicker:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', noDir:true });
      const d = __mkdir('リスト', {}, {});
      window.__savePickerRet = await d.getFileHandle('2612MKM014.json', { create:true });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      await __sleep(800);
      __lateArm();
      const w = await __watch(() => __press('btn-save'), 15000);
      __lateOff();
      await __sleep(1200);
      const f = __fileOf(d, '2612MKM014.json');
      const rec = await idbGet(M._lastDraftKey);
      const o = w.ov[w.ov.length - 1] || {};
      const r1 = { fired: __lateFired, picker: __savePickerCalls, title: o.title || '', warn: !!o.warn, msg: o.msg || '', written: __pids(f), m: __pids(M),
                   rev: rec.rev | 0, fileRev: rec.fileRev | 0, stale: saveStale() };
      try{ saveOverlayHide(); }catch(_){}
      const w2 = await __watch(() => __press('btn-save'), 15000);
      await __sleep(800);
      const f2 = __fileOf(d, '2612MKM014.json');
      const rec2 = await idbGet(M._lastDraftKey);
      const o2 = w2.ov[w2.ov.length - 1] || {};
      return { r1, r2: { written: __pids(f2), title: o2.title || '', rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊽b保存先を選ぶ画面の道：保存の途中で写真', J(r));
    ok(r.r1.fired === 1 && r.r1.picker === 1 && r.r1.written === 't1' && r.r1.m === 'late,t1' && /保存しました/.test(r.r1.title),
       '試験の前提: 保存先を選ぶ画面で書けていない／保存の途中で写真が入っていない → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && /保存の途中で入った写真は、まだ渡していません/.test(r.r1.msg) && r.r1.warn === true,
       '★保存先を選ぶ画面で書いた保存で、書いたファイルに入っていない写真まで「保存済」にした（またはそのことを言わない）→ ' + J(r.r1));
    ok(r.r2.written === 'late,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false,
       '★もう一度「保存」を押しても、その写真が書けない／「保存済」にならない → ' + J(r.r2));
  });
  await scene('㊽c', { noShare:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', noDir:true });
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      await __sleep(800);
      __lateArm();
      const w = await __watch(() => __press('btn-save'), 15000);
      __lateOff();
      const rd = async () => { try{ return JSON.parse(await (await fetch(__dlHref[__dlHref.length - 1])).text()); }catch(_){ return null; } };
      const j = await rd();
      await __sleep(800);
      const rec = await idbGet(M._lastDraftKey);
      const o = w.ov[w.ov.length - 1] || {};
      const r1 = { fired: __lateFired, dl: w.dl, title: o.title || '', msg: o.msg || '', sent: __pids(j), m: __pids(M),
                   rev: rec.rev | 0, fileRev: rec.fileRev | 0, stale: saveStale() };
      try{ saveOverlayHide(); }catch(_){}
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const j2 = await rd();
      await __sleep(800);
      const rec2 = await idbGet(M._lastDraftKey);
      return { r1, r2: { dl: w2.dl, sent: __pids(j2), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale() } };
    });
    console.log('㊽cダウンロードの道：保存の途中で写真', J(r));
    ok(r.r1.fired === 1 && r.r1.dl.length === 1 && r.r1.dl[0] === '2612MKM014.json' && r.r1.sent === 't1' && r.r1.m === 'late,t1'
       && /ダウンロードに入れました/.test(r.r1.title),
       '試験の前提: ダウンロードに入れていない／保存の途中で写真が入っていない → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && /保存の途中で入った写真は、まだ渡していません/.test(r.r1.msg),
       '★ダウンロードの保存で、入れたファイルに入っていない写真まで「保存済」にした（またはそのことを言わない）→ ' + J(r.r1));
    ok(r.r2.dl[0] === '2612MKM014.json' && r.r2.sent === 'late,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false,
       '★もう一度「保存」を押しても、その写真が入らない／「保存済」にならない → ' + J(r.r2));
  });
  await scene('㊽d', { pc:true }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'リスト', files: { '2612MKM014.json': JSON.stringify(__pc14()) } });
      const parent = __mkdir('その１', {}, { 'リスト': __D });
      await saveDirSet(__D, parent);
      savePlaceOkSet(__P1);
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      /* まとめて保存がファイルを書いて読み返した直後に、最後の写真が入る（中身はもう作ってある） */
      const ov = saveVerify; let n = 0;
      saveVerify = async function(){
        const ret = await ov.apply(this, arguments);
        if(!n++){ M.chosho_photos.push({ label: suggestLabel(M.chosho_photos.length), dataUri: __png('#0a0'), id: 'late' }); await photoKeepInto(M);
                  await persistDraft(); }   // 何件も書くあいだに、下書きにも控えられた
        return ret;
      };
      __pickerMode = 'return'; __pickerRet = __copyDir(__D); __plan = [null];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      saveVerify = ov;
      const f = __fileOf(__D, '2612MKM014.json');
      const rec = await idbGet(M._lastDraftKey);
      await refreshDraftInfo(true);
      const r1 = { fired: n, wrote: w.wrote, written: __pids(f), m: __pids(M), rev: rec.rev | 0, fileRev: rec.fileRev | 0,
                   stale: saveStale(), h: handoverOf(draftInfoOf('2612MKM014')), said: w.said.filter(s => /保存の途中/.test(s)) };
      __pickerMode = 'return'; __pickerRet = __copyDir(__D); __plan = [null];
      const w2 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1500); }, 20000);
      const f2 = __fileOf(__D, '2612MKM014.json');
      const rec2 = await idbGet(M._lastDraftKey);
      await refreshDraftInfo(true);
      return { r1, r2: { wrote: w2.wrote, written: __pids(f2), rev: rec2.rev | 0, fileRev: rec2.fileRev | 0, stale: saveStale(),
                         h: handoverOf(draftInfoOf('2612MKM014')), said: w2.said.filter(s => /保存の途中/.test(s)) } };
    });
    console.log('㊽dまとめて保存（フォルダ）：保存の途中で写真', J(r));
    ok(r.r1.fired === 1 && r.r1.wrote.length === 1 && r.r1.written === 'q1,t1' && /late/.test(r.r1.m),
       '試験の前提: まとめて保存で「その１ ＞ リスト」に書けていない／保存の途中で写真が入っていない → ' + J(r.r1));
    ok(r.r1.fileRev < r.r1.rev && r.r1.stale === true && r.r1.h !== 'ok',
       '★まとめて保存（フォルダ）で、書いたファイルに入っていない写真（保存の途中で入った）まで「保存済」にした → ' + J(r.r1));
    ok(r.r1.said.length === 1 && /2612MKM014/.test(r.r1.said[0]) && /まだ渡していません/.test(r.r1.said[0]),
       '★まとめて保存で、保存の途中で入った写真がまだ渡っていないことを言わない → ' + J(r.r1.said));
    ok(r.r2.wrote.length === 1 && r.r2.written === 'late,q1,t1' && r.r2.fileRev === r.r2.rev && r.r2.stale === false && r.r2.h === 'ok' && !r.r2.said.length,
       '★もう一度まとめて保存しても、その写真が書けない／「保存済」にならない → ' + J(r.r2));
  });

  /* ---------- ㊾ iPhone も、入れる場所は Dropbox で見つかる名前（その１ ＞ リスト） ---------- */
  await scene('㊾', { ua:'iphone' }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', noDir:true });
      renderSaveBar(); await __sleep(100);
      const sb = document.getElementById('sb-dest');
      const bar = { text: sb ? sb.textContent.replace(/\s+/g, ' ').trim() : '', title: sb ? (sb.getAttribute('title') || '') : '' };
      saveOverlayShow('2612MKM014.json');
      const ovs = ((document.getElementById('save-ov') || {}).innerText || '').replace(/\s+/g, ' ');
      try{ saveOverlayHide(); }catch(_){}
      M.cable_main_len = '12'; M._touched = true; saveDraft();
      await __sleep(600);
      const w = await __watch(() => __press('btn-save'), 15000);
      const o = w.ov[w.ov.length - 1] || {};
      try{ saveOverlayHide(); }catch(_){}
      /* 同じ iPhone で、見るだけの 2612MKM013 を 📮 → 📤 */
      const row = getReceptionRows().find(x => x.mgmt_no === '2612MKM013');
      await openFromReception(row); await __sleep(300);
      M.chosho_note = 'メモ'; M._touched = true; saveDraft(); await __sleep(500);
      __plan = ['📮', '📤'];
      const w2 = await __watch(() => __press('btn-save'), 15000);
      const p1 = w2.picks[1] || {};
      const i = (p1.rows || []).findIndex(t => /^📤/.test(t));
      return { ua: /iPhone/.test(navigator.userAgent), dirPicker: !!window.showDirectoryPicker, route: saveRoute(), hint: saveHintName(),
               bar, ovs, names: w.sharedNames, title: o.title || '', msg: o.msg || '', where: saveHintWhere(),
               sideSub: i >= 0 ? (p1.subs || [])[i] : '', sideNames: w2.sharedNames };
    });
    console.log('㊾iPhone の入れる場所の名前', J(r));
    ok(r.ua && !r.dirPicker && r.route === '' && r.hint === P1 + '/リスト' && r.names[0] === '2612MKM014.json' && /共有で渡しました/.test(r.title),
       '試験の前提: iPhone（フォルダを選べない）で、入れる場所が「その１ の物件/リスト」でない／共有で渡せていない → ' + J([r.ua, r.dirPicker, r.route, r.hint, r.names, r.title]));
    ok(/物件情報_調書 ＞ その１ ＞ リスト/.test(r.sideSub) && r.sideNames.length === 1 && SIDE13.test(r.sideNames[0]),
       '試験の前提: 📮 → 📤 の説明が「その１ ＞ リスト」でない／預けを渡せていない → ' + J([r.sideSub, r.sideNames]));
    ok(/その１/.test(r.bar.text) && r.bar.text.indexOf(P1) < 0 && /「その１」/.test(r.bar.title) && r.bar.title.indexOf(P1) < 0,
       '★iPhone の保存バーが、Dropbox に無い物件の正式名で入れる場所を言う（📮 は「その１ ＞ リスト」と言う）→ ' + J(r.bar));
    ok(/入れる所：その１ ＞ リスト/.test(r.ovs) && r.ovs.indexOf(P1) < 0, '★iPhone の保存中の「入れる所」が、Dropbox に無い物件の正式名で言う → ' + r.ovs);
    ok(/★入れる場所：「その１」フォルダの中の「リスト」フォルダ★/.test(r.msg) && r.msg.indexOf(P1) < 0,
       '★iPhone で共有で渡したあとの案内（★入れる場所★）が、Dropbox に無い物件の正式名で言う → ' + r.msg);
    ok(r.where === '「その１」フォルダの中の「リスト」', '★iPhone の「入れる場所」の言い方が「その１」でない → ' + r.where);
  });

  /* ---------- ㉚d 幅320px：まとめて保存の「閉じた」窓・端末の中のフォルダの知らせ ---------- */
  await scene('㉚d', { width:320, height:640 }, async page => {
    const r = await page.evaluate(async () => {
      await __state({ no:'2612MKM014', dirName:'その2_端末の中のとても長いフォルダの名前ですよ_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' });
      savePlaceOkSet(__P1);
      M.cable_main_len = '12'; M._touched = true; await persistDraft();
      __pickerMode = 'abort'; __plan = ['@measure'];
      const w = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(800); }, 15000);
      const m = () => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth });
      await __press('btn-save');
      const card = document.querySelector('#save-ov .save-ov-card');
      const cr = card ? card.getBoundingClientRect() : null;
      const ov = Object.assign(m(), { card: cr && [Math.round(cr.left), Math.round(cr.right)], btn: __overlay() });
      try{ saveOverlayHide(); }catch(_){}
      /* まとめて保存で同じフォルダに書いたあとの「📮 書いた N件を事務所にも届ける」の知らせ */
      M.cable_main_len = '14'; M._touched = true; await persistDraft();
      __pickerMode = 'return'; __pickerRet = __copyDir(__D); __plan = ['@measure'];
      const w2 = await __watch(async () => { await saveAllDrafts('unsaved'); await __sleep(1200); }, 20000);
      return { picks: w.picks, ov, picks2: w2.picks, wrote2: w2.wrote };
    });
    console.log('㉚d幅320（閉じた窓・その2の知らせ）', J(r));
    const mm = (r.picks[0] || {}).measure || {};
    ok((r.picks[0] || {}).rows && r.picks[0].rows.some(t => /^📤 フォルダを覚えるのをやめる/.test(t)), '試験の前提: 閉じたときの窓が出ない → ' + J(r.picks));
    ok(mm.sw <= mm.iw && mm.sheet && mm.sheet[0] <= mm.sheet[1] + 1, '★幅320px で、まとめて保存の「閉じた」窓が横にはみ出した → ' + J(mm));
    ok(r.ov.sw <= r.ov.iw && r.ov.card && r.ov.card[0] >= 0 && r.ov.card[1] <= 320 && /事務所にも届ける/.test(r.ov.btn),
       '★幅320px で、端末の中のフォルダに書いたあとの知らせ（📮 事務所にも届ける）が横にはみ出した → ' + J(r.ov));
    const p2 = (r.picks2 || [])[0] || {}, m2 = p2.measure || {};
    ok(r.wrote2.length === 1 && (p2.rows || []).some(t => /^📮 書いた 1件を事務所にも届ける/.test(t)), '試験の前提: まとめて保存のあとの「📮 書いた」の知らせが出ない → ' + J(r.picks2));
    ok(m2.sw <= m2.iw && m2.sheet && m2.sheet[0] <= m2.sheet[1] + 1, '★幅320px で、まとめて保存のあとの「📮 書いた N件を事務所にも届ける」の知らせ（長いフォルダ名）が横にはみ出した → ' + J(m2));
  });

  await b.close();
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版176（現場入力）');
})();
