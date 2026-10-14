/* 版176（メイン）
   現場入力が【見るだけ】・許可切れ・保存先の違いで「何も書けない」ときの逃げ道として、
   別の名前（管理番号_現場預け_YYYYMMDD-HHMMSS.json・中に _side）でファイルを渡すようになった（📮 事務所に預ける）。
   PC はそれを戸別の行にせず、「📮 預かりを振り分ける」で正しい物件のリストの 管理番号.json へ1つにまとめる。
   メイン側の決まりを場面ごとに確かめる。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ・預けの名前の目印が現場入力と同じ／先頭・末尾に固定しない）
     ① 📁 フォルダで読む：預け（名前で分かるもの・中に _side があるもの・名前の変わったもの）は行にしない。
        一覧の外（_sideFiles）に名前と場所だけ覚える（中身・写真は持たない）。🧩 を勧めない。知らせに件数。
        読み直しても同じ。預けを片付けたあと読み直しても「見当たりません」と言わない
     ② 📄 ファイルで読む：預けは行にしない。「📁 フォルダで読み込むと振り分けできます」と言う
     ③ 振り分け・まとめる：その２ に落ちた預けを、その１/リスト の 管理番号.json へ。
        写真は和集合・工程の印は外れない（入れる方向だけ）・現場で直した欄（touched）だけ採る・PCだけの欄は採らない・
        状態は進む方向だけ・_sideMerged に印・_side は入れない・まとめる前の控え＝元の中身・預けの控え＝預けの中身・預けは消える。
        写真フォルダの中は探さない。同じ預けをもう一度置いて押すと「まとめ済み」＝戸別ファイルは1バイトも変えず、預けを片付けるだけ
     ④ 合わせ方（sideMergeInto）だけ：touched の無い古い預け＝PCで空の欄だけ埋める／管理番号は変えない／
        工程の日時は PC が空のときだけ／名前だけの空の写真枠は残す／前の印を残して足す
     ⑤ 書いたあと読み返したら合わない → 元の中身に戻す・預けは消さない
        ⑤b 合わせ方が写真を1枚落とした → 写真の id を全部確かめて気づき、元に戻す（預けは消さない）
     ⑥ 書いたあと読み返せない → 戻さない（他の端末の保存を潰さない）・預けも消さない
     ⑦ 控えが取れない：行き先の控え → 何も書かない／預けの控え → 預けを消さない（次に押すと片付けるだけ）
     ⑧ まとめている間に別のPCが保存した → 何も書かない（「もう一度」）
     ⑨ 新しく置く：行き先が証拠（_side.proj・このPCの物件）で決まったときだけ 管理番号.json を作る。
        分からない・手で選んだ・暗号化・0KB・壊れ は触らない（理由を出す）
     ⑩ 迷子（同じ管理番号が2つの物件のリストに）：並べて知らせるだけ・どれも触らない
     ⑪ 読み込んだ一覧に関係するとき：振り分けたあと一覧を読み直す（まとめた中身が出る・見当たらない扱いにしない）。
        a) その１/リスト を読んでいて上のフォルダを選ぶ　b) その２/リスト（預けがある所）を読んでいて その１ を選ぶ
     ⑫ 開いて直している途中・台帳で直したまま（_editingRow・_lgEdited）の戸別は触らない
     ⑬ 同じ戸別に預けが2つ（新しい戸別）：古い方で置き、新しい方をそこへまとめる。読み込んだ一覧の預けと2回数えない
     ⑭ いつもの名前のファイルに _side が入ってしまったもの：一覧には出ないが、振り分けで印だけ外して戻す（消さない）
     ⑮ 📥 現場取込で預けを選ぶ：直した欄だけ・工程の印は外れない（受付台帳の同意書も）・似た写真を捨てる選択を出さない・
        写真は和集合・まとめた印。同じ預けをもう一度取り込もうとすると「もうまとめてあります」
     ⑯ PC が いつもの名前で書くとき（buildIndividualContent・💾 戸別ファイルへ反映）_side を入れない。_sideMerged は残す
     ⑰ フォルダの選び方：前に選んだフォルダの許可が断られた → 何も変えず忘れる（次はフォルダを選ぶ画面）・
        閉じた → 黙る・許可があれば選び直さない・選ぶ画面は書き込み（readwrite）で開く
     ⑱ 閲覧用（antenna_viewer）：ボタンを出さない・知らせを出さない・押しても何もしない／ビューアがメインから作り直してある。
        試験しているメインでも、閲覧専用の印が立っていればフォルダを選ばせない・知らせを出さない
   （ここから 2回目の直し）
     ⑲ 物件を開いていて 📁 の一覧が無い（ふつうの状態）：開いている物件の行を、ファイルの中身で置き換えず、
        預けを同じ合わせ方で入れる（物件だけの備考・工事の種類・工事完了は残る・現場で直した欄・まとめた印・
        済みの印（受付台帳）は入る・写真は行のまま）。「まだ前の中身」とは言わない。
        b) 現場の工事完了が行に入り、そのあと物件から開いて「物件に保存」しても、戸別ファイルの工事完了・印が消えない
        c) 開いている物件（その１）と違う物件（その２）へまとめた預けは、その１ の同じ管理番号の行に入れない
     ⑳ 新しく置く前に、行き先の物件フォルダの中を全部探す：a) 完了 フォルダ・物件のすぐ下（_数字 の名前）にあれば置かない
        （0KB は数えない・名前の変わった預け自身は数えない・「エクスプローラで … へ移して」と、できる手順を言う）
        b) リストに 管理番号.json.txt があれば置かない
        （預けの物件は現場の書くとおりの長い名前＝①で決まる）　c) リストの中のフォルダにあるものも迷子に並べ、どちらとも決めない
     ㉑ 預けの台帳の「その」の番号：a) 物件フォルダ その１ だけを選び、預けが その２ → 紛れた その１ の写しへまとめない・
        上のフォルダを選ぶよう言う　b) 預けの物件が長い名前（…（その１））でも ① で その１ へ（両方のリストにあっても）
        「リスト」だけを選んだとき：c) 上が分からない その２/リスト（紛れた写し）→ その１ の預けをまとめない・どうするか言う
        d) 上が分からない その１/リスト → 自動では決めない → 行き先で（選んだ「リスト」）を選ぶとまとめる
        e) 📁 の その１ の中の リスト → その１ と分かって自動でまとめる　f) 📁 の 物件情報_調書 の中の その２/リスト → まとめない
     ㉒ 振り分けたあと一覧を読み直そうとして断られた（受付台帳で直したまま）→ 知らせで「まだ前の中身」と言う。読み直せたときは言わない
     ㉓ 📥 現場取込で預けを選ぶ：現場の台帳を見せる。別の物件の預け・台帳に無い戸別は注意を出して「スキップ」を選んでおく
        （「残りも確かめなしで」を選んでいても、その預けは窓を出す）。同じ物件の預けはいつもどおり
     ㉔ 行き先を手で選ぶ：その番号の違う物件は自動では決めない → 手で選んだ先に 管理番号.json があればまとめる
   （ここから 3回目の直し）
     ㉕ 物件を開いていて「リスト」だけを選んだ：a) 物件の工事フォルダが そのリスト（物件に取り込んだ 📁）→ 開いている物件の
        リストと分かって自動でまとめる・行に入る・「物件に保存」しても工事完了・直した欄・印が消えない
        （a2: 物件を開き直して、工事フォルダは覚えてあるだけのときも同じ）
        （リストの中の 完了 にあるものは「リスト の中のフォルダ（リスト/完了/…）」・物件の名前をフォルダの名前のように書かない）
        b) 工事フォルダが無い・名前の分からないリストを手で選ぶ → 預けの物件が開いている物件なら行にも入る
        （a の始めに）📁 で読んだだけのリスト（工事フォルダではない）は、開いている物件のリストと決めない
     ㉖ 振り分けたあと行から開いて保存しても、戸別ファイルの写真が減らない：a) 台帳で作って保存した戸別（写真なし・行の写真を当てにする）
        b) 行にしか無い写真がある戸別　c) 図面のまだ無い戸別（新しく置く）　d) アパートの2世帯（同じ建物・混ざらない）
        e) 📁 の一覧で読み直しを断った（写真の無かった戸別・常駐させない戸別）→ 行にも入れる・新しく置いた分は「まだ前の中身」と言う・
           片付けた預けを一覧の外の覚えから外す　f) 物件を開いて 📁 も読んでいる・図面の無い戸別（写真は戸別ファイルだけ）→ 開くと写真が出る・保存しても消えない
     ㉗ 言い方：a) 名前の分からない「リスト」で新しい戸別を手で選ぶ → どうすれば置けるか言う（上のフォルダを選んでいて手で選んだときは言わない）
        b) 保存して一覧に戻った戸別 → できる手順を言う
        c) 「リスト」を選んで、リストの中の 完了 にある → 「リスト の中のフォルダ（その１/リスト/完了/…）」（名前が分からなければ リスト/完了/…）
   （ここから 4回目の直し）
     ㉕ d) 預けの物件の名前が空（現場の受付台帳にその戸別が無い）・現場の台帳は その１・工事フォルダ無し → 名前の分からないリストへ
        自動でまとめても、開いている物件の行に入る・「物件に保存」しても工事完了・直した欄・印が消えない
        d2) 現場の台帳が その２（Android で その２ を開いたまま その１ の戸別を預けた）でも同じ
        e) 預けの物件が その２ とはっきり分かる → 名前の分からないリストへ手で選んでまとめても、その１ の行には入れない。
           それでも「物件に保存」で、戸別ファイルの工事完了・状態・まとめた印・写真は消えない（最後の歯止め）
        （a に）開いている物件のリストへ新しい戸別を置いた知らせで、物件の名前をフォルダの名前のように書かない（選んだ「リスト」）
     ㉘ 物件を開いていて 📁 のフォルダも覚えている（行は物件の行）：振り分けたあと、そのフォルダを読み直して物件の行を置き換えない
        （リストの外にある物件の戸別・まだ戸別ファイルに入っていない物件だけの直しが残る・物件の保存にも残る）
        a) 物件のリストを選ぶ（台帳で作って「💾 戸別ファイルへ反映」でファイルのできた行もある）　b) 上のフォルダ（物件情報_調書）を選ぶ
        c) 物件に 📁 を取り込んでいる（台帳で作った行のほかは、行がファイルを持つ）→ これまでどおり読み直す（新しく置いた戸別が一覧に出る）
        d) 台帳で作った行しか無い物件（その２）で、覚えているのは その１ のリスト → その１ の戸別をこの物件に入れない
     ㉙ 物件に保存：戸別ファイルに、行のまだ知らない預けがまとめてある（ほかのPCで振り分けた）→ 工事完了・日付・状態・まとめた印を
        落とさない（行と開いている画面にも入れる＝開いたままもう一度保存しても外れない）。
        行が知っている印だけのファイルは、事務所が外した工事完了をそのまま書く
     ㉚ 📁 の一覧で、預けの印を外しただけ（一覧に行の無い戸別）で読み直しを断った → 「まだ振り分ける前の中身」と言う
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   フォルダは試験の中で作る作り物（getDirectoryHandle／getFileHandle／removeEntry／entries／values を持つ）。
   「📮 預かりを振り分ける」のフォルダを選ぶ画面は window.showDirectoryPicker を差し替える。
   使い方: node smoke_v176_main.js [メイン index.html の file:// URL]　（ONLY=③,⑦ で場面を絞れる）
     （変異試験は壊した写しをここに渡す。⓪の「現場入力と同じ目印」と⑱のビューアは、いつもの置き場所のものを見る） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url'), cp = require('child_process');
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
const REAL_MAIN = path.join(ROOT, 'antenna_main', 'index.html');
const GENBA_PATH = process.env.GENBA_FOR_CONTRACT || path.join(ROOT, 'antenna_genba', 'index.html');
const VIEWER_PATH = process.env.VIEWER || path.join(ROOT, 'antenna_viewer', 'index.html');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* 場面を絞る（変異試験を速くするため）: ONLY=③,⑦ のように付けると、その記号で始まる場面だけ走らせる */
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

const NO = '2612MKM013';
const SIDE = NO + '_現場預け_20261014-091812.json';
const AT = '2026-10-14T00:18:12.000Z';
const STAMP = AT + '|' + NO;
const P1N = '令和８年度戸別受信設備設置工事（その１）';
const P2N = '令和８年度戸別受信設備設置工事（その２）';

/* ページの中で使う道具：作り物のフォルダ・写真・PCの戸別（D）・現場の預け（S）・振り分けの窓を押す */
const SETUP = `
  /* 作り物のフォルダ。書くときは close で中身が入る（途中で失敗したら元のまま）。
     __hooks.getFile(name) が文字を返せばその中身を読ませ、Error を返せば読めなくする。
     __hooks.write(name, text) は書いた直後に呼ぶ。__hooks.getDir(name) が Error を返せばそのフォルダを開けない。 */
  window.__mk = function(name, files, subs){
    const d = { kind:'directory', name, __files: Object.assign({}, files || {}), __subs: Object.assign({}, subs || {}),
                __removed: [], __writes: [], __mt: {}, __hooks: {}, __perm: 'granted', __permReq: null };
    const fh = n => ({ kind:'file', name:n, __d:d,
      isSameEntry: async o => !!(o && o.__d === d && o.name === n),
      getFile: async () => {
        if(d.__hooks.getFile){ const r = d.__hooks.getFile(n);
          if(r instanceof Error) throw r;
          if(typeof r === 'string') return { name:n, size: new Blob([r]).size, lastModified: Date.now(), text: async () => r }; }
        if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
        const t = d.__files[n];
        return { name:n, size: new Blob([t]).size, lastModified: d.__mt[n] || Date.parse('2026-10-01T01:00:00Z'), text: async () => t };
      },
      createWritable: async () => { let buf = '';
        return { write: async t => { buf += (typeof t === 'string') ? t : await new Blob([t]).text(); },
                 close: async () => { d.__files[n] = buf; d.__mt[n] = Date.now(); d.__writes.push({ n, t: buf });
                                      if(d.__hooks.write) d.__hooks.write(n, buf); } }; },
      queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
    const list = () => Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
    const iter = map => () => ({ [Symbol.asyncIterator](){ const rows = list(); let i = 0;
      return { next: async () => (i < rows.length) ? { value: map(rows[i++]), done:false } : { value: undefined, done: true } }; } });
    Object.assign(d, {
      queryPermission: async () => d.__perm,
      requestPermission: async () => (d.__permReq || d.__perm),
      isSameEntry: async o => o === d,
      getFileHandle: async (n, opt) => {
        if(!(n in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; }
        return fh(n); },
      getDirectoryHandle: async (n, opt) => {
        if(d.__hooks.getDir){ const r = d.__hooks.getDir(n); if(r instanceof Error) throw r; }
        if(!d.__subs[n]){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = window.__mk(n); }
        return d.__subs[n]; },
      removeEntry: async n => { if(!(n in d.__files)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; }
                                d.__removed.push(n); delete d.__files[n]; },
      entries: iter(x => x), values: iter(x => x[1]), keys: iter(x => x[0])
    });
    return d;
  };
  /* フォルダの中身を「場所 → 中身」で写し取る（変わったところを見比べるため） */
  window.__tree = function(d, pre){ const o = {}; pre = pre || '';
    Object.keys(d.__files).forEach(n => { o[pre + n] = d.__files[n]; });
    Object.keys(d.__subs).forEach(n => Object.assign(o, window.__tree(d.__subs[n], pre + n + '/')));
    return o; };
  window.__diff = function(a, b){ const out = [];
    Object.keys(Object.assign({}, a, b)).sort().forEach(k => {
      if(!(k in a)) out.push('+' + k); else if(!(k in b)) out.push('-' + k); else if(a[k] !== b[k]) out.push('~' + k); });
    return out; };
  window.__png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6; const x = cv.getContext('2d');
    x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
  window.__ph = (id, c) => ({ id, label: '写真' + id, dataUri: window.__png(c) });
  window.__pids = t => { try{ const j = (typeof t === 'string') ? JSON.parse(t) : t;
    return (j.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(読めない)'; } };
  window.__COL = ['#c33','#3c3','#33c','#cc3','#3cc','#c3c'];
  /* PC の戸別（写真6枚・工事完了・同意書・PCだけの欄） */
  window.__D = no => ({ chosho_mgmt_no: no, chosho_cust_name: '三沢 太郎', chosho_cust_addr: '三沢市1-2', chosho_cust_tel: '',
    work_type: 'uhf_new', amplifier: 'pcAmp', line_booster: 'lbPC', chosho_note: 'PCの備考',
    work_done: true, work_done_at: '2026-09-30', chosho_status: 'completed',
    flyer_done: false, consent_received: true, consent_received_at: '2026-09-01',
    asbestos: { judge: 'none', by: 'office' }, qty_overrides: { a: 1 },
    chosho_photos: ['p1','p2','p3','p4','p5','p6'].map((id, i) => window.__ph(id, window.__COL[i])),
    _origin: 'main', editedAt: '2026-10-01T00:00:00Z' });
  /* 現場の預け（PCのファイルを読めない端末から。写真は p1 と同じもの＋新しい t1） */
  window.__S = (no, side) => ({ chosho_mgmt_no: no, chosho_cust_name: '三沢 太郎', chosho_cust_tel: '0176-11-2222',
    work_type: 'catv_to_uhf', amplifier: 'genbaAmp', line_booster: '', chosho_note: '',
    work_done: false, chosho_status: 'in_progress', flyer_done: true, flyer_done_at: '2026-10-14',
    consent_received: false, asbestos: { judge: 'yes', by: 'genba' }, qty_overrides: {},
    chosho_photos: [ window.__ph('p1', '#c33'), window.__ph('t1', '#963') ], _origin: 'genba',
    _side: Object.assign({ v: 1, at: '${AT}', why: 'viewonly', proj: '', ledger: '${P2N}', place: 'その2', lacks: 5, base: null,
      touched: ['amplifier', 'line_booster', 'work_done', 'consent_received', 'chosho_status', 'asbestos'], app: '176' }, side || {}) });
  /* 物件（このPCの IndexedDB に入れる） */
  window.__proj = (id, name, nos) => { const now = new Date().toISOString();
    return { schema: PROJ_SCHEMA, id, name, createdAt: now, updatedAt: now,
      cases: (nos || []).map((no, i) => ({ caseId: id + '_c' + i, file: 'リスト/' + no + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: no, chosho_cust_name: '試験 ' + no, chosho_status: 'in_progress', work_type: '' } })),
      ledger: {}, takeout: {}, review: {} }; };
  /* 「📮 預かりを振り分ける」を押して、窓が開いたら（pre を済ませてから）btn を押す。
     窓の文字・OK の文字と押せるか を返す。OK が押せないときは「何もしない」で閉じる（止まらないように）。 */
  window.__sortRun = async (btn, pre) => {
    const seen = { opened: false, text: '', after: '', okText: '', okDisabled: null };
    let finished = false;
    const waiter = new Promise(res => { let n = 0; const t = setInterval(async () => {
      const m = document.getElementById('sort-modal');
      if(m && m.classList.contains('open') && !seen.opened){
        seen.opened = true; clearInterval(t);
        seen.text = (m.innerText || '').replace(/\\s+/g, ' ');
        if(pre){ try { await pre(m); } catch(e){ seen.preErr = String(e && e.message || e); } }
        seen.after = (m.innerText || '').replace(/\\s+/g, ' ');
        const okb = document.getElementById('sort-ok');
        seen.okText = okb ? okb.textContent : ''; seen.okDisabled = okb ? !!okb.disabled : null;
        const b = (btn === 'sort-ok' && okb && okb.disabled) ? 'sort-cancel' : btn;
        document.getElementById(b).click();
        return res();
      }
      if(finished || ++n > 800){ clearInterval(t); res(); }
    }, 25); });
    /* 窓が出たまま戻らない（見当たらない窓・📥 の窓など）ときに試験ごと止まらないよう、20秒で切り上げる */
    const tm = new Promise(r => setTimeout(() => { seen.timedOut = true; r(); }, 20000));
    await Promise.race([sideSortButton(), tm]);
    finished = true;
    await waiter;
    return seen;
  };
  /* 表の行（その管理番号を含む行）の「行き先」を、名前に want を含む物件へ替える */
  window.__pickDest = (m, no, want) => {
    const tr = [...m.querySelectorAll('tr')].filter(r => r.innerText.indexOf(no) >= 0)[0];
    const sel = tr && tr.querySelector('select');
    if(!sel) throw new Error('行き先を選ぶ所が無い: ' + no);
    const op = [...sel.options].filter(o => o.textContent.indexOf(want) >= 0)[0];
    if(!op) throw new Error('行き先の候補に ' + want + ' が無い');
    sel.value = op.value; sel.dispatchEvent(new Event('change'));
  };
  window.__fresh = async () => {
    try { listCensusClear(); } catch(_){}
    _listRows = []; _listDirHandle = null;
    try { _sideFiles = []; } catch(_){}
    try { _sideSortRoot = null; } catch(_){}
    try { await projHandleDelete(SIDE_SORT_DIR_KEY); } catch(_){}
  };
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
/* 新しい入れ物でページを開く。出た窓（alert/confirm）は said に残して OK で閉じる */
async function openPage(target, label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const said = [];
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => { said.push({ type: d.type(), msg: d.message() }); d.accept().catch(()=>{}); });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await page.goto(target);
  return { ctx, page, said };
}
async function openMain(label){
  const o = await openPage(MAIN, label);
  await o.page.waitForFunction(() => typeof listReloadFolder === 'function' && typeof genbaImportFlow === 'function'
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await o.page.evaluate(SETUP);
  o.said.length = 0;
  return o;
}
/* ページの中で走らせる。止まったら { error } を返す（v175 のように関数が無いときも、場面ごとに赤にする） */
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
const alerts = said => said.filter(s => s.type === 'alert').map(s => s.msg);
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
const brief = o => JSON.stringify(o === undefined ? null : o).slice(0, 260);   // 流れを追うための短い控え（失敗の知らせは short）

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r0 = await run(page, () => {
      const need = ['sideSortButton','sideMergeInto','isSideCaseFile','sideLoadNote','listReloadFolder','listSelectFolder','listSelectFiles',
                    'genbaImportFlow','buildIndividualContent','lgwbApply','editorKeepFields','dupFindGroups','lgDupCounts'];
      const names = { yes: [
          'W1A001_現場預け_20261014-091812.json', 'W1A001_現場預け_20261014-091812-2.json',
          'W1A001_現場預け_20261014-091812 (1).json', 'W1A001_現場預け_20261014-091812.json.txt',
          'W1A001_現場預け_20261014-091812.json (1).txt', 'W1A001_現場預け_20261014-091812_3.json',
          'W1A001_振り分け_20261014-091812.json' ],
        no: [ 'W1A001.json', 'W1A001_1758000000000.json', 'W1A001_現場預け.json', 'W1A001 (1).json', 'W1A001_現場預け_2026101-091812.json' ] };
      let re = null; try { re = SIDE_NAME_RE; } catch(_){}
      return { missing: need.filter(n => typeof window[n] !== 'function'), ver: APP_VERSION,
        src: re ? re.source : null, flags: re ? re.flags : null,
        yesNg: re ? names.yes.filter(n => !re.test(n)) : null, noNg: re ? names.no.filter(n => re.test(n)) : null,
        byData: (typeof isSideCaseFile === 'function') ? [isSideCaseFile('W1A001.json', { _side: { at: 'x' } }), isSideCaseFile('W1A001.json', { chosho_mgmt_no: 'W1A001' }),
                  isSideCaseFile('W1A001.json', null)] : null };
    });
    let genbaSrc = null;
    try { const m = fs.readFileSync(GENBA_PATH, 'utf8').match(/const SIDE_NAME_RE = \/(.*)\/([a-z]*);/); genbaSrc = m ? m[1] : null; } catch(_){}
    console.log('⓪前提', brief(r0), '現場入力の目印', genbaSrc);
    ok(!r0.error && r0.missing.length === 0, '★関数が無い → ' + (r0.error || r0.missing.join(' / ')));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    ok(r0.src === '_(現場預け|振り分け)_\\d{8}-\\d{6}' && r0.flags === '',
       '★預けの名前の目印が決まり（先頭・末尾に固定しない）と違う → ' + r0.src + ' /' + r0.flags);
    ok(r0.yesNg && r0.yesNg.length === 0, '★預けの名前（Android の _数字・Dropbox の (1)・.json.txt）を見分けない → ' + short(r0.yesNg));
    ok(r0.noNg && r0.noNg.length === 0, '★ふつうの戸別の名前を預けと見る → ' + short(r0.noNg));
    ok(r0.byData && r0.byData.join() === 'true,false,false', '★中に _side があれば名前に関係なく預け（無ければ違う）になっていない → ' + short(r0.byData));
    ok(genbaSrc !== null && genbaSrc === r0.src, '★現場入力（' + GENBA_PATH + '）の SIDE_NAME_RE がメインと違う → 現場 ' + genbaSrc + ' ／ メイン ' + r0.src);
    await ctx.close();
  }

  // ---- ① 📁 フォルダで読む：預けは行にしない ----
  if(want('①')){
    const { ctx, page, said } = await openMain('①');
    const r1 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const D = JSON.stringify(__D(NO), null, 2);
      const S = JSON.stringify(__S(NO));
      const S2 = JSON.stringify(Object.assign(__S('W1X002'), {}));         // 名前が変わった預け（中に _side）
      const W4 = JSON.stringify({ chosho_mgmt_no: 'W1X004', work_type: 'uhf_new', chosho_status: 'in_progress', chosho_photos: [__ph('w4', '#456')] });
      const list = __mk('リスト', { [NO + '.json']: D, [SIDE]: S, 'W1X002 (1).json': S2,
                                   'W1X003_現場預け_20261014-091812 (1).json.txt': '', 'W1X004.json': W4 });
      window.__confirms = [];
      const origConfirm = window.confirm;
      window.confirm = m => { window.__confirms.push(String(m)); return false; };
      window.showDirectoryPicker = async () => list;
      await listSelectFolder();
      const o = {};
      o.rows = (_listRows || []).map(r => r._name || r.file).sort();
      o.side = (_sideFiles || []).map(x => x.name).sort();
      o.sideKeys = (_sideFiles || []).map(x => Object.keys(x).filter(k => /data|photo/i.test(k)).join('|')).join(',');
      o.status = (document.getElementById('list-status') || {}).textContent || '';
      o.confirms = window.__confirms.slice();
      o.dup = dupFindGroups(_listRows).length;
      o.lgdup = lgDupCounts(_listRows)[NO];
      // 読み直しても同じ
      await listReloadFolder();
      o.rows2 = (_listRows || []).map(r => r._name || r.file).sort();
      o.side2 = (_sideFiles || []).length;
      o.status2 = (document.getElementById('list-status') || {}).textContent || '';
      // 預けを片付けた（事務所が手で消した）あと読み直す → 「見当たりません」と言わない
      delete list.__files[SIDE]; delete list.__files['W1X002 (1).json'];
      // 「見当たりません」の窓が出ると答えるまで戻らないので、少し待って切り上げる
      await Promise.race([listReloadFolder(), new Promise(r => setTimeout(r, 4000))]);
      await new Promise(r => setTimeout(r, 300));
      const mo = document.getElementById('lgmiss-ov');
      o.missOpen = !!(mo && mo.classList.contains('open'));
      o.rows3 = (_listRows || []).map(r => r._name || r.file).sort();
      o.side3 = (_sideFiles || []).length;
      if(o.missOpen){ try { mo.classList.remove('open'); } catch(_){} }
      window.confirm = origConfirm;
      return o;
    }, { NO, SIDE });
    console.log('①📁 読み込み', brief(r1));
    ok(!r1.error, '①止まった → ' + r1.error);
    if(!r1.error){
      ok(r1.rows.join() === [NO + '.json', 'W1X004.json'].join(), '★預けが戸別の行に入った（積算・費用が二重になる） → ' + short(r1.rows));
      ok(r1.side.length === 3 && r1.side.indexOf(SIDE) >= 0 && r1.side.indexOf('W1X002 (1).json') >= 0,
         '★預けを一覧の外（_sideFiles）に覚えていない → ' + short(r1.side));
      ok(r1.sideKeys === ',,', '★一覧の外の預けに中身・写真を持たせている（名前・場所・大きさ・日時だけのはず） → ' + r1.sideKeys);
      ok(!r1.confirms.some(m => /同じ管理番号/.test(m)), '★預けと PC のファイルを 🧩 でまとめようと勧める（現場の入力が捨てられる） → ' + short(r1.confirms));
      ok(r1.dup === 0 && r1.lgdup === 1, '★預けが重複に数えられる → 🧩 ' + r1.dup + ' 組 ／ 台帳の重複 ' + r1.lgdup);
      ok(/📮 現場から預かったファイルが 3件/.test(r1.status) && /預かりを振り分ける/.test(r1.status),
         '★読み込んだあとの知らせに預けの件数・振り分けの道が出ない → ' + r1.status);
      ok(r1.rows2.join() === r1.rows.join() && r1.side2 === 3 && /現場から預かったファイルが 3件/.test(r1.status2),
         '★読み直すと預けの扱いが変わる → ' + short({ rows2: r1.rows2, side2: r1.side2, st: r1.status2 }));
      ok(!r1.missOpen && r1.rows3.join() === r1.rows.join() && r1.side3 === 1,
         '★預けを片付けたあと読み直すと「見当たりません」と聞く／行が変わる → ' + short({ miss: r1.missOpen, rows3: r1.rows3, side3: r1.side3 }));
    }
    await ctx.close();
  }

  // ---- ② 📄 ファイルで読む ----
  if(want('②')){
    const { ctx, page } = await openMain('②');
    const r2 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const files = [ new File([JSON.stringify(__D(NO))], NO + '.json', { type: 'application/json' }),
                      new File([JSON.stringify(__S(NO))], SIDE, { type: 'application/json' }),
                      new File([JSON.stringify(__S('W2X002'))], 'W2X002.json', { type: 'application/json' }) ];
      const orig = window.pickFile;
      window.pickFile = (o, cb) => { cb(files); };
      listSelectFiles();
      await new Promise(r => setTimeout(r, 1500));
      window.pickFile = orig;
      return { rows: (_listRows || []).map(r => r.file).sort(), side: (_sideFiles || []).length,
               status: (document.getElementById('list-status') || {}).textContent || '' };
    }, { NO, SIDE });
    console.log('②📄 読み込み', brief(r2));
    ok(!r2.error, '②止まった → ' + r2.error);
    if(!r2.error){
      ok(r2.rows.join() === NO + '.json', '★📄 で読んだ預けが戸別の行に入った → ' + short(r2.rows));
      ok(r2.side === 0, '📄 で読んだ預けを振り分けの対象に覚えた（消せない） → ' + r2.side);
      ok(/現場から預かったファイルが 2件ありました/.test(r2.status) && /📁 フォルダで読み込むと振り分けできます/.test(r2.status),
         '★📄 で読んだときに「📁 フォルダで読み込むと振り分けできます」と言わない → ' + r2.status);
    }
    await ctx.close();
  }

  // ---- ③ 振り分け・まとめる（二度目はまとめ済み） ----
  if(want('③')){
    const { ctx, page, said } = await openMain('③');
    const r3 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const T0 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO));
      const DECOY = 'W9Q999_現場預け_20261014-091812.json';
      const l1 = __mk('リスト', { [NO + '.json']: T0 });
      const p1 = __mk('その１', {}, { 'リスト': l1, '写真': __mk('写真', { [DECOY]: JSON.stringify(__S('W9Q999', { proj: 'その１' })) }) });
      const l2 = __mk('リスト', { [SIDE]: ST });
      const root = __mk('物件情報_調書', {}, { 'その１': p1, 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run1: await __sortRun('sort-ok') };
      const after = __tree(root);
      o.diff = __diff(before, after);
      const got = JSON.parse(l1.__files[NO + '.json']);
      o.photos = __pids(got);
      ['work_done','work_done_at','consent_received','consent_received_at','flyer_done','flyer_done_at','chosho_status',
       'chosho_note','amplifier','line_booster','work_type','chosho_cust_tel','chosho_mgmt_no','_sideMerged'].forEach(k => { o[k] = got[k]; });
      o.asbestos = JSON.stringify(got.asbestos); o.qty = JSON.stringify(got.qty_overrides);
      o.hasSide = '_side' in got;
      o.dBk = (l1.__subs['_整理前の控え'] || { __files: {} }).__files[NO + '.json'] === T0;
      o.sBk = (l2.__subs['_整理前の控え'] || { __files: {} }).__files[SIDE] === ST;
      o.sideLeft = SIDE in l2.__files;
      o.decoy = (p1.__subs['写真'].__files[DECOY] || '').length > 0;
      // 二度目：同じ預けを戻して押す → まとめ済み（戸別ファイルは1バイトも変えない）
      const merged1 = l1.__files[NO + '.json'];
      const w1 = l1.__writes.length;
      l2.__files[SIDE] = ST;
      o.run2 = await __sortRun('sort-ok');
      o.same2 = l1.__files[NO + '.json'] === merged1;
      o.writes2 = l1.__writes.length - w1;
      o.sideLeft2 = SIDE in l2.__files;
      o.sBk2 = Object.values((l2.__subs['_整理前の控え'] || { __files: {} }).__files).filter(t => t === ST).length;
      return o;
    }, { NO, SIDE });
    const a3 = alerts(said);
    console.log('③振り分け・まとめる', brief(r3), brief(a3));
    ok(!r3.error, '③止まった → ' + r3.error);
    if(!r3.error){
      ok(r3.run1.opened && /2612MKM013/.test(r3.run1.text) && /まとめる（2612MKM013\.json に入れる）/.test(r3.run1.text),
         '★振り分けの表に「まとめる」が出ない → ' + r3.run1.text.slice(0, 400));
      ok(!/W9Q999/.test(r3.run1.text), '★写真フォルダの中まで預けを探した → ' + r3.run1.text.slice(0, 300));
      ok(r3.photos === 'p1,p2,p3,p4,p5,p6,t1', '★写真が和集合にならない（PCの6枚＋現場の t1） → ' + r3.photos);
      ok(r3.work_done === true && r3.work_done_at === '2026-09-30' && r3.chosho_status === 'completed',
         '★預けで工事完了・状態が外れた（印は入れる方向だけ） → ' + short({ w: r3.work_done, at: r3.work_done_at, st: r3.chosho_status }));
      ok(r3.consent_received === true && r3.consent_received_at === '2026-09-01', '★預けで同意書の印が外れた → ' + r3.consent_received);
      ok(r3.flyer_done === true && r3.flyer_done_at === '2026-10-14', '★現場で済みにしたビラ配りの印・日付が入らない → ' + r3.flyer_done + ' ' + r3.flyer_done_at);
      ok(r3.amplifier === 'genbaAmp', '★現場で直した欄（増幅器）が入らない → ' + r3.amplifier);
      ok(r3.line_booster === '', '★現場で直した欄（空にした）が入らない → ' + r3.line_booster);
      ok(r3.work_type === 'uhf_new' && r3.chosho_note === 'PCの備考' && r3.chosho_cust_tel === '',
         '★現場で直していない欄を預けの値で上書きした（工事の種類・備考・電話） → ' + short({ wt: r3.work_type, note: r3.chosho_note, tel: r3.chosho_cust_tel }));
      ok(r3.asbestos === JSON.stringify({ judge: 'none', by: 'office' }) && r3.qty === '{"a":1}',
         '★PCだけの欄（石綿判定・数量の手直し）を預けで変えた → ' + r3.asbestos + ' ' + r3.qty);
      ok(Array.isArray(r3._sideMerged) && r3._sideMerged.join() === STAMP && !r3.hasSide,
         '★まとめた印（_sideMerged）が無い／_side が戸別ファイルに入った → ' + short({ sm: r3._sideMerged, side: r3.hasSide }));
      ok(r3.dBk && r3.sBk, '★控え（まとめる前の戸別ファイル・預け）がそのままの中身で残っていない → ' + short({ d: r3.dBk, s: r3.sBk }));
      ok(!r3.sideLeft, '★まとめた預けが残っている → ' + r3.sideLeft);
      ok(r3.decoy, '★写真フォルダの中のファイルを触った');
      ok(r3.diff.slice().sort().join() === ['~その１/リスト/' + NO + '.json', '+その１/リスト/_整理前の控え/' + NO + '.json',
                             '-その２/リスト/' + SIDE, '+その２/リスト/_整理前の控え/' + SIDE].sort().join(),
         '★変わったファイルが決まりと違う → ' + short(r3.diff));
      ok(a3.some(m => /振り分け終わりました/.test(m) && /まとめた 1件/.test(m) && /_整理前の控え/.test(m)),
         '★終わりの知らせ（まとめた件数・控えの場所）が無い → ' + short(a3));
      ok(/まとめ済み/.test(r3.run2.text), '★同じ預けをもう一度振り分けると「まとめ済み」と出ない → ' + r3.run2.text.slice(0, 300));
      ok(r3.same2 && r3.writes2 === 0, '★同じ預けを二度まとめた（あとで PC で直した内容を古い預けで戻す） → 書いた回数 ' + r3.writes2);
      ok(!r3.sideLeft2 && r3.sBk2 === 2, '★まとめ済みの預けを控えへ写して片付けない → ' + short({ left: r3.sideLeft2, bk: r3.sBk2 }));
      ok(a3.some(m => /まとめ済みで片付けた 1件/.test(m)), '★二度目の知らせに「まとめ済みで片付けた」が無い → ' + short(a3));
    }
    await ctx.close();
  }

  // ---- ④ 合わせ方だけ（sideMergeInto） ----
  if(want('④')){
    const { ctx, page } = await openMain('④');
    const r4 = await run(page, async ({ NO }) => {
      const o = {};
      // a) touched の無い古い預け：PCで空の欄だけ埋める
      { const D = __D(NO), S = __S(NO); delete S._side.touched;
        const r = sideMergeInto(D, S, S._side, {});
        o.a = { amp: r.merged.amplifier, tel: r.merged.chosho_cust_tel, lb: r.merged.line_booster, wd: r.merged.work_done,
                fl: r.merged.flyer_done, st: r.merged.chosho_status, ph: __pids(r.merged), side: '_side' in r.merged, D: D.amplifier }; }
      // b) touched に管理番号・PCだけの欄・工程の印が入っていても動かさない／状態は直したときだけ・進む方向だけ
      { const D = __D(NO), S = __S(NO);
        D.chosho_status = 'in_progress'; S.chosho_status = 'completed'; S.chosho_mgmt_no = 'X9X999';
        S._side.touched = ['chosho_mgmt_no', 'qty_overrides', 'work_done', 'amplifier'];
        const r1 = sideMergeInto(D, S, S._side, {});
        S._side.touched.push('chosho_status');
        const r2 = sideMergeInto(D, S, S._side, {});
        o.b = { no: r1.merged.chosho_mgmt_no, qty: JSON.stringify(r1.merged.qty_overrides), wd: r1.merged.work_done,
                st1: r1.merged.chosho_status, st2: r2.merged.chosho_status }; }
      // c) 工程の日時：PCが済み・日時が空なら預けの日時で埋める。PCに日時があれば変えない
      { const D = __D(NO), S = __S(NO);
        D.flyer_done = true; D.flyer_done_at = ''; S.flyer_done_at = '2026-10-14';
        D.work_done_at = '2026-09-30'; S.work_done = true; S.work_done_at = '2026-10-14';
        const r = sideMergeInto(D, S, S._side, {});
        o.c = { fat: r.merged.flyer_done_at, wat: r.merged.work_done_at }; }
      // d) 名前だけの空の写真枠は残す・前の印を残して足す・_side は入れない
      { const D = __D(NO), S = __S(NO);
        D.chosho_photos.push({ id: 'slot1', label: '表札（あとで）' });
        D._sideMerged = ['2026-10-01T00:00:00.000Z|' + NO]; D._side = { at: 'x' };
        const r = sideMergeInto(D, S, S._side, {});
        o.d = { slot: r.merged.chosho_photos.some(p => p && p.id === 'slot1' && !p.dataUri), n: r.merged.chosho_photos.length,
                sm: r.merged._sideMerged, side: '_side' in r.merged, Dside: '_side' in D, Dn: D.chosho_photos.length }; }
      return o;
    }, { NO });
    console.log('④合わせ方', brief(r4));
    ok(!r4.error, '④止まった → ' + r4.error);
    if(!r4.error){
      ok(r4.a.amp === 'pcAmp' && r4.a.lb === 'lbPC' && r4.a.tel === '0176-11-2222',
         '★touched の無い古い預けで、PCに値のある欄を上書きした／空の欄を埋めない → ' + short(r4.a));
      ok(r4.a.wd === true && r4.a.fl === true && r4.a.st === 'completed' && r4.a.ph === 'p1,p2,p3,p4,p5,p6,t1' && !r4.a.side && r4.a.D === 'pcAmp',
         '★古い預け：印・状態・写真・元の中身 → ' + short(r4.a));
      ok(r4.b.no === NO && r4.b.qty === '{"a":1}' && r4.b.wd === true,
         '★touched に入っていても、管理番号・PCだけの欄・工程の印を預けで変えた → ' + short(r4.b));
      ok(r4.b.st1 === 'in_progress' && r4.b.st2 === 'completed', '★状態：直していないのに進めた／直したのに進めない → ' + short(r4.b));
      ok(r4.c.fat === '2026-10-14' && r4.c.wat === '2026-09-30', '★工程の日時：PCの空を埋めない／PCの日時を変えた → ' + short(r4.c));
      ok(r4.d.slot && r4.d.n === 8 && Array.isArray(r4.d.sm) && r4.d.sm.length === 2 && r4.d.sm[1] === STAMP && !r4.d.side && r4.d.Dside && r4.d.Dn === 7,
         '★空の写真枠・前の印・_side・元の中身（書き替えない） → ' + short(r4.d));
    }
    await ctx.close();
  }

  // ---- ⑤⑥⑦⑧ 書いたあと・控え・あいだの保存 ----
  for(const mode of ['⑤', '⑤b', '⑥', '⑦a', '⑦b', '⑧'].filter(want)){
    const { ctx, page, said } = await openMain(mode);
    const r = await run(page, async ({ NO, SIDE, mode }) => {
      await __fresh();
      const T0 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO));
      const T0MOD = T0.replace('PCの備考', 'PCの備考（別のPCが直した）');
      const l1 = __mk('リスト', { [NO + '.json']: T0 });
      const l2 = __mk('リスト', { [SIDE]: ST });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      window.showDirectoryPicker = async () => root;
      const CORRUPT = JSON.stringify({ chosho_mgmt_no: NO, chosho_photos: [] });
      if(mode === '⑤') l1.__hooks.getFile = n => (n === NO + '.json' && l1.__files[n] !== T0) ? CORRUPT : undefined;
      if(mode === '⑤b'){        // 合わせ方が写真を1枚落とした（壊れた合わせ方の代わり）→ 写真の id を全部確かめるところで止まる
        window.__mgp = mergeGenbaPhotos;
        mergeGenbaPhotos = function(){ return window.__mgp.apply(this, arguments).filter(p => !(p && p.id === 't1')); };
      }
      if(mode === '⑥') l1.__hooks.getFile = n => (n === NO + '.json' && l1.__files[n] !== T0)
        ? Object.assign(new Error('読めない'), { name: 'NotReadableError' }) : undefined;
      if(mode === '⑦a') l1.__hooks.getDir = n => (n === '_整理前の控え') ? new Error('控えを作れない') : undefined;
      if(mode === '⑦b') l2.__hooks.getDir = n => (n === '_整理前の控え') ? new Error('控えを作れない') : undefined;
      if(mode === '⑧'){
        const bk = __mk('_整理前の控え');
        bk.__hooks.write = () => { l1.__files[NO + '.json'] = T0MOD; };       // 控えを取っている間に、別のPCが保存した
        l1.__subs['_整理前の控え'] = bk;
      }
      const o = { run: await __sortRun('sort-ok') };
      l1.__hooks = {}; l2.__hooks = {};
      if(window.__mgp){ mergeGenbaPhotos = window.__mgp; window.__mgp = null; }
      const cur = l1.__files[NO + '.json'];
      o.canonT0 = cur === T0; o.canonMod = cur === T0MOD;
      o.canonPh = __pids(cur);
      o.writes = l1.__writes.filter(w => w.n === NO + '.json').map(w => w.t === T0 ? 'T0' : (w.t === T0MOD ? 'MOD' : 'merged'));
      o.sideLeft = (SIDE in l2.__files) && l2.__files[SIDE] === ST;
      o.sideRemoved = l2.__removed.slice();
      if(mode === '⑦b'){        // 次に押すと片付けるだけ（もうまとめてある）
        const m1 = l1.__files[NO + '.json'];
        o.run2 = await __sortRun('sort-ok');
        o.same2 = l1.__files[NO + '.json'] === m1;
        o.sideLeft2 = SIDE in l2.__files;
      }
      return o;
    }, { NO, SIDE, mode });
    const a = alerts(said);
    console.log(mode, brief(r), brief(a));
    ok(!r.error, mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    if(mode === '⑤'){
      ok(r.canonT0 && r.writes.join() === 'merged,T0', '★⑤読み返したら合わないのに、元の中身に戻さない → ' + short(r.writes));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑤まとめられなかったのに預けを消した');
      ok(a.some(m => /もとに戻しました/.test(m) && /預けは消していません/.test(m)), '★⑤知らせに「もとに戻しました」「預けは消していません」が無い → ' + short(a));
    }
    if(mode === '⑤b'){
      ok(r.canonT0 && r.writes.join() === 'merged,T0', '★⑤b書いたファイルに写真が1枚入っていないのに、元の中身に戻さない → ' + short(r.writes));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑤b写真の足りないまとめ方で、預けを消した（現場の写真が無くなる）');
      ok(a.some(m => /写真が 1 枚 入っていませんでした/.test(m)), '★⑤b知らせに「写真が入っていませんでした」が無い → ' + short(a));
    }
    if(mode === '⑥'){
      ok(r.writes.join() === 'merged', '★⑥読み返せないのに書き戻した（他の端末の新しい保存を潰す） → ' + short(r.writes));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑥確かめられないのに預けを消した');
      ok(a.some(m => /読み返せませんでした/.test(m) && /もとに戻さず/.test(m)), '★⑥知らせに「読み返せませんでした・もとに戻さず」が無い → ' + short(a));
    }
    if(mode === '⑦a'){
      ok(r.canonT0 && r.writes.length === 0, '★⑦a行き先の控えが取れないのに戸別ファイルを書いた → ' + short(r.writes));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑦a控えが取れないのに預けを消した');
      ok(a.some(m => /行き先の控えを取れませんでした/.test(m)), '★⑦a知らせに理由が無い → ' + short(a));
    }
    if(mode === '⑦b'){
      ok(r.canonPh === 'p1,p2,p3,p4,p5,p6,t1' && r.writes.join() === 'merged', '⑦b戸別ファイルへはまとまるはず → ' + short(r));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑦b預けの控えが取れないのに預けを消した');
      ok(a.some(m => /預けの控えを取れなかったので、預けは消していません/.test(m)), '★⑦b知らせに理由が無い → ' + short(a));
      ok(/まとめ済み/.test((r.run2 || {}).text || '') && r.same2 && !r.sideLeft2,
         '★⑦b次に押したとき、まとめ済みとして片付けない／二度まとめた → ' + short({ t: (r.run2 || {}).text, same: r.same2, left: r.sideLeft2 }));
    }
    if(mode === '⑧'){
      ok(r.canonMod && r.writes.length === 0, '★⑧あいだに別のPCが保存したのに上書きした → ' + short(r.writes));
      ok(r.sideLeft && r.sideRemoved.length === 0, '★⑧まとめていないのに預けを消した');
      ok(a.some(m => /別のPCがこの戸別を保存しました/.test(m) && /もう一度/.test(m)), '★⑧知らせに「もう一度」が無い → ' + short(a));
    }
    await ctx.close();
  }

  // ---- ⑨ 新しく置く／触らない ----
  if(want('⑨')){
    const { ctx, page, said } = await openMain('⑨');
    const r9 = await run(page, async ({ NO, P1N }) => {
      await __fresh();
      await projIdbPut(__proj('pj176a', P1N, ['W7G007', 'W1Z001']));
      const nm = no => no + '_現場預け_20261014-1' + ('00000' + no.slice(-3)).slice(-5) + '.json';
      const mk = (no, side) => JSON.stringify(__S(no, Object.assign({ at: '2026-10-14T01:' + no.slice(-2) + ':00.000Z' }, side || {})));
      const l1 = __mk('リスト', { 'W3C003.enc': '暗号の中身', 'W1Z001.json': JSON.stringify({ chosho_mgmt_no: 'W1Z001', work_type: 'uhf_new' }) });
      const files = {
        [nm(NO)]: mk(NO, { proj: 'その１' }),               // ① 預けに書いた物件 → その１ に新しく置く
        [nm('W7G007')]: mk('W7G007'),                        // ③ このPCの物件 → その１ に新しく置く
        [nm('W9Z009')]: mk('W9Z009', { ledger: 'その２' }),  // 分からない → 触らない
        [nm('W8H008')]: mk('W8H008'),                        // 手で その１ を選んでも新しくは置かない
        [nm('W3C003')]: mk('W3C003', { proj: 'その１' }),   // 行き先が暗号化 → 触らない
        [nm('W4D004')]: '',                                   // 0KB → 触らない
        [nm('W5E005')]: '{"chosho_mgmt_no":'                 // 壊れ → 触らない
      };
      const l2 = __mk('リスト', files);
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run: await __sortRun('sort-ok', m => __pickDest(m, 'W8H008', 'その１')) };
      o.diff = __diff(before, __tree(root));
      const put = l1.__files[NO + '.json'];
      if(put){ const j = JSON.parse(put); o.put = { side: '_side' in j, sm: j._sideMerged, ph: __pids(j), amp: j.amplifier, no: j.chosho_mgmt_no }; }
      const put7 = l1.__files['W7G007.json'];
      if(put7){ const j = JSON.parse(put7); o.put7 = { side: '_side' in j, sm: (j._sideMerged || []).length }; }
      o.names = { NO: nm(NO), W7: nm('W7G007') };
      return o;
    }, { NO, P1N });
    const a9 = alerts(said);
    console.log('⑨新しく置く', brief(r9), brief(a9));
    ok(!r9.error, '⑨止まった → ' + r9.error);
    if(!r9.error){
      const t = r9.run.after || '';
      ok(/新しく置く（2612MKM013\.json）/.test(r9.run.text) && /新しく置く（W7G007\.json）/.test(r9.run.text),
         '★行き先が証拠（預けの物件・このPCの物件）で決まるのに「新しく置く」にならない → ' + r9.run.text.slice(0, 500));
      ok(/どこの物件か分かりません（現場の台帳: その２）/.test(t), '★行き先の分からない預けに理由（現場の台帳）が出ない → ' + t.slice(0, 600));
      ok(/行き先がはっきり分かるときだけ/.test(t), '★手で選んだ行き先に新しく置こうとする → ' + t.slice(0, 600));
      ok(/暗号化されています（先に 🔓 復号/.test(t) && /中身が空（0KB）/.test(t) && /壊れていて読めません/.test(t),
         '★暗号化・0KB・壊れの理由が出ない → ' + t.slice(0, 600));
      ok(r9.run.okText === 'この内容で振り分ける（2 件）', '★振り分ける件数が違う（新しく置く2件だけのはず） → ' + r9.run.okText);
      ok(r9.put && !r9.put.side && Array.isArray(r9.put.sm) && r9.put.sm.join() === '2026-10-14T01:13:00.000Z|' + NO
         && r9.put.ph === 'p1,t1' && r9.put.amp === 'genbaAmp' && r9.put.no === NO,
         '★新しく置いた 管理番号.json の中身（_side 無し・印・写真） → ' + short(r9.put));
      ok(r9.put7 && !r9.put7.side && r9.put7.sm === 1, '★このPCの物件で決まった戸別を新しく置かない → ' + short(r9.put7));
      const want = ['+その１/リスト/' + NO + '.json', '+その１/リスト/W7G007.json',
                    '-その２/リスト/' + r9.names.NO, '-その２/リスト/' + r9.names.W7,
                    '+その２/リスト/_整理前の控え/' + r9.names.NO, '+その２/リスト/_整理前の控え/' + r9.names.W7].sort().join();
      ok(r9.diff.slice().sort().join() === want, '★変わったファイルが決まりと違う（触らないはずのものを触った等） → ' + short(r9.diff));
      ok(a9.some(m => /新しく置いた 2件/.test(m) && /そのまま 5件/.test(m)), '★終わりの知らせの件数 → ' + short(a9));
    }
    await ctx.close();
  }

  // ---- ⑩ 迷子：知らせるだけ ----
  if(want('⑩')){
    const { ctx, page } = await openMain('⑩');
    const r10 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const T1 = JSON.stringify(__D(NO), null, 2);
      const T2 = JSON.stringify(Object.assign(__D(NO), { chosho_note: 'その２に紛れた写し', _origin: 'genba' }), null, 2);
      const l1 = __mk('リスト', { [NO + '.json']: T1 });
      const l2 = __mk('リスト', { [NO + '.json']: T2, [SIDE]: JSON.stringify(__S(NO)) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run: await __sortRun('sort-cancel') };
      o.diff = __diff(before, __tree(root));
      return o;
    }, { NO, SIDE });
    console.log('⑩迷子', brief(r10));
    ok(!r10.error, '⑩止まった → ' + r10.error);
    if(!r10.error){
      ok(/別の物件のリストにも同じ管理番号のファイルがあります/.test(r10.run.text) && /その１ にも その２ にも 2612MKM013\.json/.test(r10.run.text),
         '★迷子（2つの物件のリストに同じ管理番号）を知らせない → ' + r10.run.text.slice(0, 600));
      ok(/どこの物件か分かりません/.test(r10.run.text) && r10.run.okDisabled === true,
         '★行き先が2つあるのに、どちらかへ決めた → ' + short({ ok: r10.run.okText, dis: r10.run.okDisabled }));
      ok(r10.diff.length === 0, '★迷子・預けを触った → ' + short(r10.diff));
    }
    await ctx.close();
  }

  // ---- ⑪ 読み込んだ一覧に関係するとき：読み直す ----
  for(const mode of ['a', 'b'].filter(m => want('⑪' + m))){
    const { ctx, page, said } = await openMain('⑪' + mode);
    const r11 = await run(page, async ({ NO, SIDE, mode }) => {
      await __fresh();
      const T0 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO));
      const l1 = __mk('リスト', { [NO + '.json']: T0, 'W1A001.json': JSON.stringify({ chosho_mgmt_no: 'W1A001', work_type: 'uhf_new', chosho_status: 'in_progress' }) });
      const p1 = __mk('その１', {}, { 'リスト': l1 });
      const l2 = __mk('リスト', { [SIDE]: ST, 'W2B001.json': JSON.stringify({ chosho_mgmt_no: 'W2B001', work_type: 'uhf_new', chosho_status: 'in_progress' }) });
      const root = __mk('物件情報_調書', {}, { 'その１': p1, 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _listDirHandle = (mode === 'a') ? l1 : l2;
      await listReloadFolder();
      const o = { rows0: (_listRows || []).map(r => r._name).sort().join(), side0: (_sideFiles || []).length };
      window.showDirectoryPicker = async () => (mode === 'a') ? root : p1;
      o.run = await __sortRun('sort-ok');
      await new Promise(r => setTimeout(r, 300));
      o.rows = (_listRows || []).map(r => r._name + ':' + (r.data && r.data.amplifier)).sort().join();
      o.side1 = (_sideFiles || []).length;
      const mo = document.getElementById('lgmiss-ov');
      o.missOpen = !!(mo && mo.classList.contains('open'));
      o.merged = __pids(l1.__files[NO + '.json']);
      o.sideLeft = SIDE in l2.__files;
      return o;
    }, { NO, SIDE, mode });
    const a11 = alerts(said);
    console.log('⑪' + mode, brief(r11), brief(a11));
    ok(!r11.error, '⑪' + mode + '止まった → ' + r11.error);
    if(r11.error){ await ctx.close(); continue; }
    ok(r11.merged === 'p1,p2,p3,p4,p5,p6,t1' && !r11.sideLeft, '⑪' + mode + ' まとまっていない → ' + short(r11));
    ok(!r11.missOpen, '★⑪' + mode + ' 振り分けたあと「見当たりません」と聞いた');
    if(mode === 'a'){
      ok(r11.rows0 === [NO + '.json', 'W1A001.json'].join(), '⑪a試験の前提: 読み込んだ一覧 → ' + r11.rows0);
      ok(/^2612MKM013\.json:genbaAmp,W1A001\.json:/.test(r11.rows),
         '★⑪a振り分けたあと一覧を読み直さない（古い中身のまま＝あとの保存で戻ってしまう） → ' + r11.rows);
    } else {
      ok(r11.side0 === 1 && r11.rows0 === 'W2B001.json', '⑪b試験の前提: 預けのある一覧 → ' + short(r11));
      ok(/（読み込んだ一覧）/.test(r11.run.text), '★⑪b選んだフォルダの外にある、読み込んだ一覧の預けを拾わない → ' + r11.run.text.slice(0, 400));
      ok(/^W2B001\.json:[^,]*$/.test(r11.rows) && r11.side1 === 0,
         '★⑪b片付けた預けが一覧の外の覚え（_sideFiles）に残る／一覧が変わった → ' + short({ rows: r11.rows, side: r11.side1 }));
    }
    await ctx.close();
  }

  // ---- ⑫ 直している途中の戸別は触らない ----
  for(const mode of ['lg', 'edit'].filter(m => want('⑫' + m))){
    const { ctx, page } = await openMain('⑫' + mode);
    const r12 = await run(page, async ({ NO, SIDE, mode }) => {
      await __fresh();
      const T0 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO));
      const l1 = __mk('リスト', { [NO + '.json']: T0 });
      const l2 = __mk('リスト', { [SIDE]: ST });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      const row = { file: NO + '.json', data: Object.assign(__D(NO), { chosho_photos: null }), fileType: 'plain', _slim: true };
      if(mode === 'lg') row._lgEdited = true;
      _listRows = [row];
      if(mode === 'edit') _editingRow = row;
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run: await __sortRun('sort-ok') };
      o.diff = __diff(before, __tree(root));
      if(mode === 'edit') _editingRow = null;
      _listRows = [];
      return o;
    }, { NO, SIDE, mode });
    console.log('⑫' + mode, brief(r12));
    ok(!r12.error, '⑫' + mode + '止まった → ' + r12.error);
    if(r12.error){ await ctx.close(); continue; }
    ok(r12.run.okDisabled === true && r12.diff.length === 0, '★⑫' + mode + ' 直している途中の戸別をまとめた（あとの保存で戻ってしまう） → ' + short(r12));
    ok(mode === 'lg' ? /受付台帳で直したまま/.test(r12.run.text)
       : /この戸別は いま開いたままです。まだ保存していなければ 💾 で保存し、ほかの戸別を開くか ページを読み込み直してから、もう一度押してください/.test(r12.run.text),
       '★⑫' + mode + ' 触らない理由が出ない → ' + r12.run.text.slice(0, 500));
    await ctx.close();
  }

  // ---- ⑬ 同じ戸別に預けが2つ（新しい戸別） ----
  if(want('⑬')){
    const { ctx, page } = await openMain('⑬');
    const r13 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const Sa = __S(NO, { proj: 'その１' }); Sa.chosho_photos = [__ph('a1', '#123')]; Sa.amplifier = 'ampA';
      const Sb = __S(NO, { proj: 'その１', at: '2026-10-14T05:00:00.000Z' }); Sb.chosho_photos = [__ph('b1', '#456')]; Sb.amplifier = 'ampB';
      const nb = NO + '_現場預け_20261014-140000.json';
      const l1 = __mk('リスト', {});
      const l2 = __mk('リスト', { [nb]: JSON.stringify(Sb), [SIDE]: JSON.stringify(Sa) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _listDirHandle = l2;                         // その２/リスト を読んでいる（預けは一覧の外に覚える）
      await listReloadFolder();
      const sideN = (_sideFiles || []).length;
      window.showDirectoryPicker = async () => root;
      const run = await __sortRun('sort-ok');
      const j = JSON.parse(l1.__files[NO + '.json'] || '{}');
      return { sideN, inTable: (run.text.match(/2612MKM013_現場預け_/g) || []).length, okText: run.okText,
               photos: __pids(j), amp: j.amplifier, sm: j._sideMerged, l2: Object.keys(l2.__files) };
    }, { NO, SIDE });
    console.log('⑬預けが2つ', brief(r13));
    ok(!r13.error, '⑬止まった → ' + r13.error);
    if(!r13.error){
      ok(r13.sideN === 2 && r13.inTable === 2 && r13.okText === 'この内容で振り分ける（2 件）',
         '★読み込んだ一覧の預けと、フォルダで見つけた預けを2回数えた → ' + short(r13));
      ok(r13.photos === 'a1,b1' && r13.amp === 'ampB' && Array.isArray(r13.sm) && r13.sm.length === 2 && r13.l2.length === 0,
         '★同じ戸別の2つ目の預け（あとのもの）を、1つ目で置いたファイルへまとめない → ' + short(r13));
    }
    await ctx.close();
  }

  // ---- ⑭ いつもの名前に _side が入ってしまったもの ----
  if(want('⑭')){
    const { ctx, page, said } = await openMain('⑭');
    const r14 = await run(page, async ({ NO }) => {
      await __fresh();
      const D = __D(NO); D._side = { v: 1, at: '2026-10-13T00:00:00.000Z', touched: ['amplifier'] };
      const T0 = JSON.stringify(D, null, 2);
      const l1 = __mk('リスト', { [NO + '.json']: T0 });
      const p1 = __mk('その１', {}, { 'リスト': l1 });
      _listDirHandle = l1;
      await listReloadFolder();
      const o = { rows0: (_listRows || []).length, side0: (_sideFiles || []).length };
      window.showDirectoryPicker = async () => p1;
      o.run = await __sortRun('sort-ok');
      const cur = l1.__files[NO + '.json'];
      const j = cur ? JSON.parse(cur) : {};
      o.still = !!cur; o.hasSide = '_side' in j; o.sm = j._sideMerged; o.photos = __pids(j); o.amp = j.amplifier;
      o.bk = (l1.__subs['_整理前の控え'] || { __files: {} }).__files[NO + '.json'] === T0;
      o.rows1 = (_listRows || []).map(r => r._name).join();
      o.removed = l1.__removed.slice();
      return o;
    }, { NO });
    console.log('⑭いつもの名前の _side', brief(r14));
    ok(!r14.error, '⑭止まった → ' + r14.error);
    if(!r14.error){
      ok(r14.rows0 === 0 && r14.side0 === 1, '⑭試験の前提: 印の入ったいつもの名前のファイルは一覧に出ない → ' + short(r14));
      ok(/預けの印を外す/.test(r14.run.text), '★いつもの名前のファイルに入った預けの印を外す道が無い → ' + r14.run.text.slice(0, 400));
      ok(r14.still && r14.removed.length === 0 && !r14.hasSide && r14.photos === 'p1,p2,p3,p4,p5,p6' && r14.amp === 'pcAmp' && r14.bk,
         '★いつもの名前のファイルを消した／印が残る／中身が変わった／控えが無い → ' + short(r14));
      ok(r14.rows1 === NO + '.json', '★印を外したあと一覧に戻らない → ' + r14.rows1);
    }
    await ctx.close();
  }

  // ---- ⑮ 📥 現場取込で預けを選ぶ ----
  if(want('⑮')){
    const { ctx, page, said } = await openMain('⑮');
    const r15a = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const D = __D(NO);
      const S = __S(NO);
      S.chosho_photos.push(Object.assign(__ph('s2', __COL[1]), {}));     // p2 と同じ絵で別の写真ID（似た写真）
      window.__ST = JSON.stringify(S);
      _listRows = [ { file: NO + '.json', data: JSON.parse(JSON.stringify(D)), fileType: 'plain' } ];
      _currentProject = null;
      setLedger('m:' + NO, { consent: true, consentSrc: true, compdoc: true, compdocSrc: true });
      window.__origPick = window.pickFile;
      window.pickFile = (o, cb) => { cb([ new File([window.__ST], SIDE, { type: 'application/json' }) ]); };
      window.__gi = { seen: '', radios: -1, n: 0 };
      window.__giT = setInterval(() => { const m = document.getElementById('genba-import-modal');
        if(m && m.classList.contains('open')){ window.__gi.n++; window.__gi.seen = (m.innerText || '').replace(/\s+/g, ' ');
          window.__gi.radios = m.querySelectorAll('input[type=radio][name^="gi-sim"], .gi-sim input[type=radio]').length;
          document.getElementById('gi-import').click(); } }, 25);
      genbaImportFlow();
      return true;
    }, { NO, SIDE });
    const waitAlert = async re => { for(let i = 0; i < 80; i++){ if(alerts(said).some(m => re.test(m))) return true; await sleep(100); } return false; };
    const done1 = r15a === true && await waitAlert(/現場データ取込 完了/);
    const r15b = done1 ? await run(page, ({ NO }) => {
      const d = _listRows[0].data, lg = getLedger('m:' + NO) || {};
      const o = { gi: Object.assign({}, window.__gi), wd: d.work_done, st: d.chosho_status, fl: d.flyer_done, cr: d.consent_received,
        amp: d.amplifier, wt: d.work_type, note: d.chosho_note, ph: __pids(d), sm: d._sideMerged, side: '_side' in d,
        lgConsent: lg.consent, lgCompdoc: lg.compdoc, lgFlyer: lg.flyer };
      window.__gi = { seen: '', radios: -1, n: 0 };
      genbaImportFlow();                         // 同じ預けをもう一度
      return o;
    }, { NO }) : { error: '取り込みが終わらない（知らせが出ない）: ' + short(r15a) };
    const done2 = !r15b.error && await waitAlert(/もうまとめてあります/);
    const r15c = await run(page, () => { clearInterval(window.__giT); window.pickFile = window.__origPick; return Object.assign({}, window.__gi); });
    console.log('⑮📥 現場取込', brief(r15b), brief(r15c), brief(alerts(said)));
    ok(!r15b.error, '⑮止まった → ' + r15b.error);
    if(!r15b.error){
      ok(/📮 現場の預け/.test(r15b.gi.seen) && /現場で直した欄だけ/.test(r15b.gi.seen), '★📥 の窓に「📮 現場の預け・直した欄だけ」が出ない → ' + r15b.gi.seen.slice(0, 400));
      ok(r15b.gi.radios === 0, '★預けで「似た写真を捨てる」選択を出した（写真が減る） → ' + r15b.gi.radios);
      ok(r15b.wd === true && r15b.st === 'completed' && r15b.cr === true && r15b.fl === true,
         '★📥 で預けを取り込むと工程の印・状態が外れた／ビラが入らない → ' + short(r15b));
      ok(r15b.lgConsent === true && r15b.lgCompdoc === true && r15b.lgFlyer === true,
         '★📥 で受付台帳の同意書・完了書が外れた／ビラが入らない → ' + short({ c: r15b.lgConsent, d: r15b.lgCompdoc, f: r15b.lgFlyer }));
      ok(r15b.amp === 'genbaAmp' && r15b.wt === 'uhf_new' && r15b.note === 'PCの備考',
         '★📥 で直していない欄を預けで上書きした／直した欄が入らない → ' + short({ amp: r15b.amp, wt: r15b.wt, note: r15b.note }));
      ok(r15b.ph === 'p1,p2,p3,p4,p5,p6,s2,t1', '★📥 の写真が和集合にならない → ' + r15b.ph);
      ok(Array.isArray(r15b.sm) && r15b.sm.join() === STAMP && !r15b.side, '★📥 でまとめた印が無い／_side が入った → ' + short({ sm: r15b.sm, side: r15b.side }));
      ok(done2 && r15c.n === 0, '★まとめ済みの預けをもう一度 📥 で取り込もうとした（あとで直した内容が戻る） → ' + short({ done2, n: r15c.n }));
    }
    await ctx.close();
  }

  // ---- ⑯ PC が いつもの名前で書くとき ----
  if(want('⑯')){
    const { ctx, page } = await openMain('⑯');
    const r16 = await run(page, async ({ NO }) => {
      const o = {};
      const data = Object.assign(__D(NO), { _side: { at: 'x' }, _sideMerged: ['a|' + NO] });
      const c = await buildIndividualContent({ data, _photosKnown: true }, null);
      o.bic = { side: '_side' in c, sm: c._sideMerged };
      const T = JSON.stringify(Object.assign(__D(NO), { _side: { at: 'y' }, _sideMerged: ['b|' + NO] }), null, 2);
      const dir = __mk('リスト', { [NO + '.json']: T });
      const row = { _dir: dir, _name: NO + '.json', data: { chosho_mgmt_no: NO } };
      const r = await lgwbApply([{ row, name: NO + '.json', diffs: [{ k: 'chosho_note', to: '台帳で直した備考', label: '備考' }] }]);
      const j = JSON.parse(dir.__files[NO + '.json']);
      o.lgwb = { ok: r.ok, side: '_side' in j, sm: j._sideMerged, note: j.chosho_note, ph: __pids(j) };
      const s = editorKeepFields({ chosho_mgmt_no: NO }, { _sideMerged: ['c|' + NO] });
      o.keep = s._sideMerged;
      return o;
    }, { NO });
    console.log('⑯いつもの名前で書く', brief(r16));
    ok(!r16.error, '⑯止まった → ' + r16.error);
    if(!r16.error){
      ok(!r16.bic.side && Array.isArray(r16.bic.sm) && r16.bic.sm.join() === 'a|' + NO,
         '★戸別ファイルへ書く中身に _side が入る（次に読むと預けと見られて一覧から消える）／_sideMerged が落ちる → ' + short(r16.bic));
      ok(r16.lgwb.ok === 1 && !r16.lgwb.side && r16.lgwb.sm && r16.lgwb.sm.join() === 'b|' + NO && r16.lgwb.note === '台帳で直した備考'
         && r16.lgwb.ph === 'p1,p2,p3,p4,p5,p6',
         '★💾 戸別ファイルへ反映 で _side が残る／_sideMerged・写真が落ちる → ' + short(r16.lgwb));
      ok(Array.isArray(r16.keep) && r16.keep.join() === 'c|' + NO, '★エディタで開いて保存すると、まとめた印（_sideMerged）が落ちる → ' + short(r16.keep));
    }
    await ctx.close();
  }

  // ---- ⑰ フォルダの選び方・許可 ----
  if(want('⑰')){
    const { ctx, page, said } = await openMain('⑰');
    const r17 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const o = {};
      const l2 = __mk('リスト', { [SIDE]: JSON.stringify(__S(NO)) });
      const root = __mk('物件情報_調書', {}, { 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      const picks = [];
      window.showDirectoryPicker = async opts => { picks.push(opts || {}); return root; };
      // a) 前に選んだフォルダ：許可が断られた → 何も変えず忘れる。選ぶ画面は出さない（押した直後の1回を使ったので）
      const old = __mk('前の物件情報_調書'); old.__perm = 'prompt'; old.__permReq = 'denied';
      _sideSortRoot = old;
      o.a = await __sortRun('sort-cancel');
      o.aPicks = picks.length; o.aRoot = (_sideSortRoot === null);
      // b) 次に押す → 選ぶ画面（書き込み）
      o.b = await __sortRun('sort-cancel');
      o.bPicks = picks.length; o.bMode = picks.length ? picks[picks.length - 1].mode : '';
      // c) 許可のある覚えたフォルダ → 選び直さない
      o.c = await __sortRun('sort-cancel');
      o.cPicks = picks.length;
      // d) 選ぶ画面を閉じた → 黙って何もしない
      _sideSortRoot = null;
      window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
      o.d = await __sortRun('sort-cancel');
      o.sideLeft = SIDE in l2.__files;
      return o;
    }, { NO, SIDE });
    const a17 = alerts(said);
    console.log('⑰選び方', brief(r17), brief(a17));
    ok(!r17.error, '⑰止まった → ' + r17.error);
    if(!r17.error){
      ok(!r17.a.opened && r17.aPicks === 0 && r17.aRoot && a17.length >= 1 && /許可が取れませんでした/.test(a17[0]) && /何も変えていません/.test(a17[0]),
         '★前に選んだフォルダの許可が断られたとき、忘れずに先へ進んだ／黙った → ' + short({ a: r17.a, picks: r17.aPicks, root: r17.aRoot, said: a17 }));
      ok(r17.b.opened && r17.bPicks === 1 && r17.bMode === 'readwrite', '★次に押してもフォルダを選ぶ画面が出ない／書き込みで開かない → ' + short({ b: r17.b.opened, n: r17.bPicks, m: r17.bMode }));
      ok(r17.c.opened && r17.cPicks === 1, '★許可のある覚えたフォルダなのに、また選ばせた → ' + r17.cPicks);
      ok(!r17.d.opened && a17.length === 1, '★選ぶ画面を閉じただけで何か言う／窓が出た → ' + short(a17));
      ok(r17.sideLeft, '★何もしていないのに預けが消えた');
    }
    await ctx.close();
  }

  // ---- ⑱ 閲覧用 ----
  if(want('⑱')){
    const py = cp.spawnSync('python3', [path.join(ROOT, 'antenna_main', '開発ツール', 'ビューア生成.py'), '--check',
      '--main', REAL_MAIN, '--block', path.join(ROOT, 'antenna_main', '開発ツール', 'viewer-block.html'), '--out', VIEWER_PATH], { encoding: 'utf8' });
    let r18 = null;
    if(fs.existsSync(VIEWER_PATH)){
      const o = await openPage(url.pathToFileURL(VIEWER_PATH).href, '⑱');
      try { await o.page.waitForFunction(() => document.readyState === 'complete' && typeof listReloadFolder === 'function', null, { timeout: 30000 }); } catch(_){}
      await sleep(2500);
      r18 = await run(o.page, async () => {
        const b = document.getElementById('btn-list-sort');
        let picks = 0;
        window.showDirectoryPicker = async () => { picks++; throw Object.assign(new Error('x'), { name: 'AbortError' }); };
        try { await sideSortButton(); } catch(_){}
        return { viewer: !!window.__VIEWER_MODE__, has: !!b, disp: b ? getComputedStyle(b).display : '',
                 note: (typeof sideLoadNote === 'function') ? sideLoadNote({ side: [{ name: 'x' }] }) : null, picks };
      });
      await o.ctx.close();
    }
    // 試験しているメインそのものでも、閲覧専用の印（__VIEWER_MODE__）が立っていれば何もしない
    let r18m = null;
    {
      const { ctx, page } = await openMain('⑱m');
      r18m = await run(page, async () => {
        window.__VIEWER_MODE__ = true;
        let picks = 0;
        window.showDirectoryPicker = async () => { picks++; throw Object.assign(new Error('x'), { name: 'AbortError' }); };
        await sideSortButton();
        const note = sideLoadNote({ side: [{ name: 'x' }] });
        window.__VIEWER_MODE__ = false;
        return { picks, note };
      });
      await ctx.close();
    }
    console.log('⑱閲覧用', brief(r18), brief(r18m), 'ビューア生成 --check', py.status);
    ok(r18m && !r18m.error && r18m.picks === 0 && r18m.note === '', '★閲覧専用の印があっても振り分けのフォルダを選ばせる／知らせを出す → ' + short(r18m));
    ok(py.status === 0, '★ビューア（antenna_viewer）がメインから作り直されていない → ' + String(py.stdout || '').split('\n').slice(-3).join(' ') + String(py.stderr || '').slice(0, 300));
    ok(r18 && !r18.error && r18.viewer && r18.has && r18.disp === 'none', '★閲覧用で「📮 預かりを振り分ける」が出る → ' + short(r18));
    ok(r18 && r18.note === '' && r18.picks === 0, '★閲覧用で振り分けの知らせを出す／フォルダを選ばせる → ' + short(r18));
  }

  // ---- ⑲ 物件を開いていて 📁 の一覧が無い：開いている物件の行にも、同じ合わせ方で入れる ----
  //   a) 行の 物件だけの直し（備考・工事の種類）と工事完了は残る・現場で直した欄とまとめた印は入る・写真は行のまま
  //   b) 現場の工事完了が行に入り、そのあと物件から開いて「物件に保存」しても戸別ファイルの工事完了・印が消えない
  for(const mode of ['a', 'b'].filter(m => want('⑲' + m))){
    const { ctx, page, said } = await openMain('⑲' + mode);
    // b は戸別を開いて保存するので、画面の選ぶ欄にある値を使う（無い値は開いたときに空になる）
    const WT = (mode === 'a') ? 'bs_new' : 'replace', AMP = (mode === 'a') ? 'genbaAmp' : 'amp_1u45';
    const r19 = await run(page, async ({ NO, SIDE, P1N, mode, WT, AMP }) => {
      await __fresh();
      const D = Object.assign(__D(NO), { work_done: false, chosho_status: 'in_progress' });   // ファイルはまだ工事完了でない
      delete D.work_done_at;
      if(mode === 'b') D.amplifier = 'amp_3u43';
      const S = (mode === 'a') ? __S(NO)
        : Object.assign(__S(NO, { proj: P1N, ledger: P1N,
            touched: ['amplifier', 'line_booster', 'work_done', 'chosho_status', 'asbestos', 'chosho_cust_tel'] }),
            { amplifier: AMP, work_done: true, work_done_at: '2026-10-14', chosho_status: 'completed' });
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2) });
      const l2 = __mk('リスト', { [SIDE]: JSON.stringify(S) });
      const p1 = __mk('その１', {}, { 'リスト': l1 });
      const root = __mk('物件情報_調書', {}, { 'その１': p1, 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      // 物件の行：物件だけの直し（まだファイルに無い備考・工事の種類）。a は工事完了も物件だけ。b は工事完了でない
      const rd = (mode === 'a')
        ? Object.assign(__D(NO), { chosho_note: '物件だけの備考（まだファイルに無い）', work_type: WT,
                                   work_done: true, chosho_status: 'completed', chosho_photos: null, chosho_photo_count: 6 })
        : Object.assign({}, D, { chosho_note: '物件だけの備考（まだファイルに無い）', work_type: WT, chosho_photos: null, chosho_photo_count: 6 });
      const row = { file: 'リスト/' + NO + '.json', data: rd, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
      _listRows = [row];
      _currentProject = { id: 'pj176r2' + mode, name: P1N, cases: [] };
      window.showDirectoryPicker = async () => root;
      const o = { run: await __sortRun('sort-ok') };
      const g = row.data;
      o.row = { note: g.chosho_note, wd: g.work_done, wt: g.work_type, st: g.chosho_status, amp: g.amplifier, tel: g.chosho_cust_tel,
                sm: g._sideMerged, ph: g.chosho_photos, cnt: g.chosho_photo_count, pc: row._photoCount, side: ('_side' in g),
                lgFlyer: !!(getLedger(subCaseKey(row)) || {}).flyer };
      const f = l1.__files[NO + '.json'];
      o.file = __pids(f); o.fileAmp = JSON.parse(f).amplifier; o.sideLeft = SIDE in l2.__files;
      if(mode === 'b'){
        // 物件から開いて「物件に保存」（工事フォルダはリンク済み）→ 戸別ファイルも書き直される
        _projDirHandle = p1;
        try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
        try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
        const f2 = JSON.parse(l1.__files[NO + '.json']);
        o.saved = { wd: f2.work_done, st: f2.chosho_status, amp: f2.amplifier, tel: f2.chosho_cust_tel, note: f2.chosho_note,
                    wt: f2.work_type, sm: f2._sideMerged, ph: __pids(f2), side: ('_side' in f2) };
        o.rewrote = l1.__writes.length;
      }
      _currentProject = null; _listRows = []; _projDirHandle = null;
      return o;
    }, { NO, SIDE, P1N, mode, WT, AMP });
    const a19 = alerts(said);
    console.log('⑲' + mode + '物件を開いている', brief(r19), brief(a19));
    ok(!r19.error, '⑲' + mode + '止まった → ' + r19.error);
    if(r19.error){ await ctx.close(); continue; }
    const fin = a19.filter(m => /振り分け終わりました/.test(m));
    ok(r19.file === 'p1,p2,p3,p4,p5,p6,t1' && r19.fileAmp === AMP && !r19.sideLeft && fin.length === 1,
       '⑲' + mode + '試験の前提: 戸別ファイルへはまとまる → ' + short({ r19, fin }));
    const R = r19.row || {};
    ok(R.note === '物件だけの備考（まだファイルに無い）' && R.wt === WT,
       '★⑲' + mode + '開いている物件の行の、物件だけの直し（備考・工事の種類）が消えた → ' + short(R));
    ok(R.amp === AMP && Array.isArray(R.sm) && R.sm.indexOf(STAMP) >= 0 && R.side === false,
       '★⑲' + mode + '開いている物件の行に、現場で直した欄・まとめた印が入らない（あとの「物件に保存」で消える） → ' + short(R));
    ok(R.lgFlyer === true, '★⑲' + mode + '現場で済みにした印（ビラ）が、受付台帳に入らない → ' + short(R));
    ok(R.ph === null && R.cnt === 7 && R.pc === 7, '★⑲' + mode + '行の写真の扱いが違う（常駐させない・枚数は多い方） → ' + short(R));
    ok(fin.length === 1 && !/まだ振り分ける前の中身/.test(fin[0]),
       '★⑲' + mode + '行に入れたのに「まだ振り分ける前の中身のまま」と言う → ' + short(fin));
    if(mode === 'a'){
      ok(R.wd === true && R.st === 'completed', '★⑲a 物件だけの工事完了が外れた → ' + short(R));
    }
    if(mode === 'b'){
      ok(R.wd === true && R.st === 'completed' && R.tel === '0176-11-2222',
         '★⑲b 現場の工事完了・直した欄が、開いている物件の行に入らない → ' + short(R));
      const V = r19.saved || {};
      ok(!r19.openErr && !r19.saveErr && r19.rewrote >= 2, '⑲b試験の前提: 物件から開いて保存すると戸別ファイルも書く → ' + short(r19));
      ok(V.wd === true && V.st === 'completed' && V.amp === AMP && V.tel === '0176-11-2222' && Array.isArray(V.sm) && V.sm.indexOf(STAMP) >= 0
         && V.note === '物件だけの備考（まだファイルに無い）' && V.wt === WT && V.ph === 'p1,p2,p3,p4,p5,p6,t1' && V.side === false,
         '★⑲b 振り分けたあと「物件に保存」すると、戸別ファイルの工事完了・現場の入力・まとめた印が消える → ' + short(V));
    }
    await ctx.close();
  }
  // ---- ⑲c 開いている物件（その１）と違う物件（その２）へまとめた預けは、開いている物件の同じ管理番号の行に入れない ----
  if(want('⑲c')){
    const { ctx, page } = await openMain('⑲c');
    const r = await run(page, async ({ NO, SIDE, P1N, P2N }) => {
      await __fresh();
      const T1 = JSON.stringify(__D(NO), null, 2);
      const T2 = JSON.stringify(Object.assign(__D(NO), { chosho_note: 'その２に紛れた写し' }), null, 2);
      const l1 = __mk('リスト', { [NO + '.json']: T1 });
      const l2 = __mk('リスト', { [NO + '.json']: T2, [SIDE]: JSON.stringify(__S(NO, { proj: P2N })) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      const rd = Object.assign(__D(NO), { chosho_photos: null, chosho_photo_count: 6 });
      const before = JSON.stringify(rd);
      const row = { file: 'リスト/' + NO + '.json', data: rd, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
      _listRows = [row];
      _currentProject = { id: 'pj176r2c', name: P1N, cases: [] };
      window.showDirectoryPicker = async () => root;
      const o = { run: await __sortRun('sort-ok') };
      o.same = (row.data === rd) && JSON.stringify(row.data) === before; o.amp = row.data.amplifier;
      o.f2amp = JSON.parse(l2.__files[NO + '.json']).amplifier; o.f1same = l1.__files[NO + '.json'] === T1;
      _currentProject = null; _listRows = [];
      return o;
    }, { NO, SIDE, P1N, P2N });
    console.log('⑲c別の物件へまとめた', brief(r));
    ok(!r.error, '⑲c止まった → ' + r.error);
    if(!r.error){
      ok(r.f2amp === 'genbaAmp' && r.f1same, '⑲c試験の前提: その２ のファイルへまとまり、その１ のファイルは触らない → ' + short(r));
      ok(r.same && r.amp === 'pcAmp', '★⑲c 別の物件（その２）へまとめた預けを、開いている物件（その１）の行に入れた → ' + short({ same: r.same, amp: r.amp }));
    }
    await ctx.close();
  }

  // ---- ⑳ 新しく置く前に、行き先の物件フォルダの中を全部探す ----
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑳' + m))){
    const { ctx, page, said } = await openMain('⑳' + mode);
    const r = await run(page, async ({ NO, P1N, mode }) => {
      await __fresh();
      const nm = no => no + '_現場預け_20261014-1' + ('00000' + no.slice(-3)).slice(-5) + '.json';
      const mk = (no, side) => JSON.stringify(__S(no, Object.assign({ at: '2026-10-14T02:' + no.slice(-2) + ':00.000Z' }, side || {})));
      const D = no => JSON.stringify(__D(no), null, 2);
      let root, l1, l2;
      if(mode === 'a'){
        // その１/完了/NO.json・その１/W2X001_数字.json（物件のすぐ下）・その１/完了/W3X003.json（0KB）・その１/リスト/W4X004 (1).json（名前の変わった預け）
        l1 = __mk('リスト', { 'W4X004 (1).json': mk('W4X004', { proj: 'その１' }) });
        const p1 = __mk('その１', { 'W2X001_1758000000000.json': D('W2X001') },
                        { 'リスト': l1, '完了': __mk('完了', { [NO + '.json']: D(NO), 'W3X003.json': '' }) });
        l2 = __mk('リスト', { [nm(NO)]: mk(NO, { proj: 'その１' }), [nm('W2X001')]: mk('W2X001', { proj: 'その１' }),
                              [nm('W3X003')]: mk('W3X003', { proj: 'その１' }) });
        root = __mk('物件情報_調書', {}, { 'その１': p1, 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      }
      if(mode === 'b'){
        l1 = __mk('リスト', { [NO + '.json.txt']: D(NO) });                     // Android の共有で付いた名前のまま
        l2 = __mk('リスト', { [nm(NO)]: mk(NO, { proj: P1N }) });                 // 現場の書くとおりの長い物件名
        root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      }
      if(mode === 'c'){
        l1 = __mk('リスト', {}, { '完了': __mk('完了', { [NO + '.json']: D(NO) }) });   // その１/リスト/完了/NO.json
        l2 = __mk('リスト', { [NO + '.json']: D(NO).replace('PCの備考', 'その２に紛れた写し'), [nm(NO)]: mk(NO) });
        root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      }
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run: await __sortRun('sort-ok') };
      o.diff = __diff(before, __tree(root));
      o.names = { NO: nm(NO), W2: nm('W2X001'), W3: nm('W3X003') };
      if(mode === 'a'){
        const t3 = l1.__files['W3X003.json'], t4 = l1.__files['W4X004.json'];
        o.put3 = t3 ? __pids(t3) : null; o.put4 = t4 ? JSON.parse(t4)._sideMerged : null;
      }
      return o;
    }, { NO, P1N, mode });
    const a = alerts(said);
    console.log('⑳' + mode, brief(r), brief(a));
    ok(!r.error, '⑳' + mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    const t = r.run.text || '';
    if(mode === 'a'){
      ok(/この戸別のファイルが リスト の外（その１\/完了\/2612MKM013\.json）にあります/.test(t),
         '★⑳a その１/完了 に戸別のファイルがあるのに、リストに新しく置こうとする（同じ戸別が2つになる） → ' + t.slice(0, 900));
      /* 「📂 1つのフォルダにそろえる」「🧩 重複をまとめる」は 📁 の一覧（ふつうは その１/リスト）しか見ないので、できる手順を言う */
      ok(/エクスプローラで その１\/完了\/2612MKM013\.json を その１\/リスト へ移してから、もう一度押してください/.test(t)
         && !/リスト の外（その１\/完了\/2612MKM013\.json）にあります[^：]*「📂 1つのフォルダにそろえる」/.test(t),
         '★⑳a リストの外にあるとき、できない手順（📂・🧩）を言う → ' + t.slice(0, 900));
      ok(/この戸別のファイルが リスト の外（その１\/W2X001_1758000000000\.json）にあります/.test(t),
         '★⑳a 物件のすぐ下に「管理番号_数字.json」があるのに、新しく置こうとする → ' + t.slice(0, 900));
      ok(/新しく置く（W3X003\.json）/.test(t) && r.put3 === 'p1,t1', '★⑳a 0KB のファイルを「ある」と数えて、置くのをやめた → ' + short({ put3: r.put3 }));
      ok(/新しく置く（W4X004\.json）/.test(t) && Array.isArray(r.put4) && r.put4.length === 1,
         '★⑳a 名前の変わった預け（中に _side）自身を「その戸別のファイル」と数えた → ' + short({ put4: r.put4 }));
      const want = ['+その１/リスト/W3X003.json', '+その１/リスト/W4X004.json', '-その１/リスト/W4X004 (1).json',
                    '+その１/リスト/_整理前の控え/W4X004 (1).json', '-その２/リスト/' + r.names.W3,
                    '+その２/リスト/_整理前の控え/' + r.names.W3].sort().join();
      ok(r.diff.slice().sort().join() === want, '★⑳a 変わったファイルが決まりと違う（リストの外にある戸別を新しく置いた等） → ' + short(r.diff));
      ok(a.some(m => /新しく置いた 2件/.test(m) && /そのまま 2件/.test(m) && /リスト の外/.test(m)), '★⑳a 終わりの知らせに件数・理由が無い → ' + short(a));
    }
    if(mode === 'b'){
      ok(/その１（決まった物件）/.test(t), '★⑳b 預けの物件が現場の書く長い名前（…（その１））だと、その１ に決まらない → ' + t.slice(0, 700));
      ok(/この戸別のファイルが 別の名前（その１\/リスト\/2612MKM013\.json\.txt）で リスト にあります/.test(t) && r.run.okDisabled === true,
         '★⑳b リストに 2612MKM013.json.txt があるのに、新しく置こうとする → ' + t.slice(0, 900));
      ok(r.diff.length === 0, '★⑳b 何か書いた・消した → ' + short(r.diff));
    }
    if(mode === 'c'){
      ok(/別の物件のリストにも同じ管理番号のファイルがあります/.test(t) && /その２ にも その１\/リスト\/完了 にも 2612MKM013\.json/.test(t),
         '★⑳c リストの中のフォルダにある同じ戸別を、迷子として並べない → ' + t.slice(0, 900));
      ok(/どこの物件か分かりません/.test(t) && r.run.okDisabled === true && r.diff.length === 0,
         '★⑳c 2つの物件に同じ戸別のファイルがあるのに、片方へまとめた → ' + short({ dis: r.run.okDisabled, diff: r.diff }));
    }
    await ctx.close();
  }

  // ---- ㉑ 預けの台帳の「その」の番号 ----
  if(want('㉑')){
    const { ctx, page, said } = await openMain('㉑');
    const r21 = await run(page, async ({ NO, SIDE, P1N, P2N }) => {
      await __fresh();
      const o = {};
      // a) 物件フォルダ その１ だけを選んだ。その１/リスト に紛れた古い写しと、その２ の台帳の預け
      { const T1 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO, { proj: P2N }));
        const l1 = __mk('リスト', { [NO + '.json']: T1, [SIDE]: ST });
        const p1 = __mk('その１', {}, { 'リスト': l1 });
        window.showDirectoryPicker = async () => p1;
        const before = __tree(p1);
        o.a = await __sortRun('sort-ok');
        o.aDiff = __diff(before, __tree(p1)); }
      // b) 上のフォルダを選んだ。両方のリストに同じ戸別があっても、預けの物件（長い名前・その１）で決まる
      { await __fresh();
        const T1 = JSON.stringify(__D(NO), null, 2);
        const T2 = JSON.stringify(Object.assign(__D(NO), { chosho_note: 'その２に紛れた写し' }), null, 2);
        const l1 = __mk('リスト', { [NO + '.json']: T1 });
        const l2 = __mk('リスト', { [NO + '.json']: T2, [SIDE]: JSON.stringify(__S(NO, { proj: P1N })) });
        const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
        window.showDirectoryPicker = async () => root;
        o.b = await __sortRun('sort-ok');
        o.bP1 = __pids(l1.__files[NO + '.json']); o.bAmp = JSON.parse(l1.__files[NO + '.json']).amplifier;
        o.bP2same = l2.__files[NO + '.json'] === T2; o.bSideLeft = SIDE in l2.__files; }
      return o;
    }, { NO, SIDE, P1N, P2N });
    console.log('㉑その番号', brief(r21));
    ok(!r21.error, '㉑止まった → ' + r21.error);
    if(!r21.error){
      ok(/どこの物件か分かりません（現場の台帳: 令和８年度戸別受信設備設置工事（その２））/.test(r21.a.text) && r21.a.okDisabled === true && r21.aDiff.length === 0,
         '★㉑a 預けの台帳が その２ なのに、その１ に紛れた写しへまとめた → ' + short({ t: r21.a.text.slice(0, 600), diff: r21.aDiff }));
      ok(/預けの台帳は その２ です。物件情報_調書（上のフォルダ）を選ぶと見つかります/.test(r21.a.text),
         '★㉑a 物件フォルダ1つだけを選んだとき、上のフォルダを選ぶよう言わない → ' + r21.a.text.slice(0, 600));
      ok(/その１（決まった物件）/.test(r21.b.text) && /まとめる（2612MKM013\.json に入れる）/.test(r21.b.text),
         '★㉑b 預けの物件が長い名前（…（その１））なのに その１ に決まらない → ' + r21.b.text.slice(0, 600));
      ok(r21.bP1 === 'p1,p2,p3,p4,p5,p6,t1' && r21.bAmp === 'genbaAmp' && r21.bP2same && !r21.bSideLeft,
         '★㉑b その１ へまとまらない／その２ の写しを触った → ' + short(r21));
    }
    await ctx.close();
  }

  // ---- ㉑c〜f 「リスト」だけを選んだ（どの物件のリストか）----
  //   c) その２/リスト だけ（上が分からない）・紛れた写し・預けは その１ → まとめない・「「リスト」だけを選んだので」
  //   d) その１/リスト だけ（上が分からない）・預けは その１ → 自動ではまとめない → 行き先で（選んだ「リスト」）を選ぶとまとめる
  //   e) 📁 で その１（物件のフォルダ）を読んでいて、その中の リスト を選んだ → その１ と分かって自動でまとめる
  //   f) 📁 で 物件情報_調書 を読んでいて、その２/リスト を選んだ → その２ と分かる・まとめない・上のフォルダを選ぶよう言う
  for(const mode of ['c', 'd', 'e', 'f'].filter(m => want('㉑' + m))){
    const { ctx, page, said } = await openMain('㉑' + mode);
    const r = await run(page, async ({ NO, SIDE, P1N, mode }) => {
      await __fresh();
      const T1 = JSON.stringify(__D(NO), null, 2);
      const T2 = JSON.stringify(Object.assign(__D(NO), { chosho_note: 'その２に紛れた写し' }), null, 2);
      const ST = JSON.stringify(__S(NO, { proj: P1N, ledger: P1N }));
      const l = (mode === 'c' || mode === 'f') ? __mk('リスト', { [NO + '.json']: T2, [SIDE]: ST })
                                               : __mk('リスト', { [NO + '.json']: T1, [SIDE]: ST });
      if(mode === 'e'){
        const p1 = __mk('その１', {}, { 'リスト': l });
        p1.resolve = async o => (o === l) ? ['リスト'] : ((o === p1) ? [] : null);
        _listDirHandle = p1;
      }
      if(mode === 'f'){
        const top = __mk('物件情報_調書', {}, { 'その２': __mk('その２', {}, { 'リスト': l }) });
        top.resolve = async o => (o === l) ? ['その２', 'リスト'] : ((o === top) ? [] : null);
        _listDirHandle = top;
      }
      window.showDirectoryPicker = async () => l;
      const before = __tree(l);
      const o = { run: await __sortRun('sort-ok', mode === 'd' ? (m => __pickDest(m, NO, '選んだ')) : null) };
      await new Promise(res => setTimeout(res, 300));
      o.diff = __diff(before, __tree(l));
      const f = l.__files[NO + '.json'];
      o.amp = f ? JSON.parse(f).amplifier : null; o.sm = f ? JSON.parse(f)._sideMerged : null; o.ph = f ? __pids(f) : '';
      o.sideLeft = SIDE in l.__files;
      _listDirHandle = null; _listRows = [];
      return o;
    }, { NO, SIDE, P1N, mode });
    console.log('㉑' + mode + '「リスト」だけ', brief(r));
    ok(!r.error, '㉑' + mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    const t = r.run.text || '';
    const merged = r.amp === 'genbaAmp' && Array.isArray(r.sm) && r.sm.join() === STAMP && r.ph === 'p1,p2,p3,p4,p5,p6,t1' && !r.sideLeft
      && r.diff.slice().sort().join() === ['~' + NO + '.json', '+_整理前の控え/' + NO + '.json', '-' + SIDE, '+_整理前の控え/' + SIDE].sort().join();
    if(mode === 'c'){
      ok(/どこの物件か分かりません/.test(t) && !/（決まった物件）/.test(t) && r.run.okDisabled === true && r.diff.length === 0 && r.sideLeft,
         '★㉑c その２/リスト だけを選ぶと、その１ の預けを紛れた写しへまとめる → ' + short({ t: t.slice(0, 900), diff: r.diff }));
      ok(/「リスト」だけを選んだので、どの物件のリストか分かりません（預けの台帳は その１）/.test(t)
         && /その１ のリストなら「行き先」で（選んだ「リスト」）を選んでください/.test(t),
         '★㉑c 「リスト」だけを選んだとき、どうすればよいか言わない → ' + t.slice(0, 900));
    }
    if(mode === 'd'){
      ok(/「リスト」だけを選んだので、どの物件のリストか分かりません/.test(t) && !/（決まった物件）/.test(t),
         '★㉑d 上の分からない「リスト」を、預けの物件と決めた → ' + t.slice(0, 900));
      ok(/まとめる（2612MKM013\.json に入れる）/.test(r.run.after) && merged,
         '★㉑d 行き先で（選んだ「リスト」）を選んでも、まとめない → ' + short({ after: r.run.after.slice(0, 600), r }));
    }
    if(mode === 'e'){
      ok(/その１（選んだ「リスト」）（決まった物件）/.test(t) && /まとめる（2612MKM013\.json に入れる）/.test(t) && merged,
         '★㉑e 📁 で読んでいる その１ の中の リスト なのに、その１ と分からない／まとめない → ' + short({ t: t.slice(0, 900), r }));
    }
    if(mode === 'f'){
      ok(/その２（選んだ「リスト」）/.test(t) && !/（決まった物件）/.test(t) && r.run.okDisabled === true && r.diff.length === 0
         && /預けの台帳は その１ です。物件情報_調書（上のフォルダ）を選ぶと見つかります/.test(t),
         '★㉑f 📁 で読んでいる上のフォルダから その２ と分かるのに、その１ の預けをまとめる／上のフォルダを選ぶよう言わない → ' + short({ t: t.slice(0, 900), diff: r.diff }));
    }
    await ctx.close();
  }

  // ---- ㉒ 振り分けたあと一覧を読み直せなかった → 知らせで言う ----
  if(want('㉒')){
    const { ctx, page, said } = await openMain('㉒');
    const r22 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const T0 = JSON.stringify(__D(NO), null, 2);
      const l1 = __mk('リスト', { [NO + '.json']: T0, 'W1A001.json': JSON.stringify({ chosho_mgmt_no: 'W1A001', work_type: 'uhf_new', chosho_status: 'in_progress' }) });
      const l2 = __mk('リスト', { [SIDE]: JSON.stringify(__S(NO)) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _listDirHandle = l1;
      await listReloadFolder();
      const other = (_listRows || []).filter(r => r._name === 'W1A001.json')[0];
      if(other) other._lgEdited = true;           // ほかの戸別を受付台帳で直したまま
      window.showDirectoryPicker = async () => root;
      const ampOf = () => ((_listRows || []).filter(r => r._name === NO + '.json')[0] || { data: {} }).data.amplifier;
      const o = { other: !!other };
      o.run1 = await __sortRun('sort-ok');
      await new Promise(r => setTimeout(r, 300));
      o.amp1 = ampOf(); o.merged = __pids(l1.__files[NO + '.json']);
      // 2回目：台帳の直しを反映した（直したままの戸別が無い）→ 読み直す → 「まだ前の中身」と言わない
      (_listRows || []).forEach(r => { delete r._lgEdited; });
      l2.__files[NO + '_現場預け_20261014-120000.json'] = JSON.stringify(__S(NO, { at: '2026-10-14T03:00:00.000Z' }));
      o.run2 = await __sortRun('sort-ok');
      await new Promise(r => setTimeout(r, 300));
      o.amp2 = ampOf();
      return o;
    }, { NO, SIDE });
    const fin = said.map((s, i) => ({ i, s })).filter(x => x.s.type === 'alert' && /振り分け終わりました/.test(x.s.msg));
    const conf = said.map((s, i) => ({ i, s })).filter(x => x.s.type === 'confirm' && /読み直す/.test(x.s.msg));
    console.log('㉒読み直しを断る', brief(r22), brief(said.map(s => s.type + ':' + s.msg.slice(0, 80))));
    ok(!r22.error, '㉒止まった → ' + r22.error);
    if(!r22.error){
      ok(r22.other && r22.merged === 'p1,p2,p3,p4,p5,p6,t1' && conf.length === 1,
         '㉒試験の前提: まとまる・読み直しの確かめが出て断る → ' + short({ r22, conf: conf.length }));
      /* 読み直しを断られても、その戸別ファイルの行には同じ合わせ方で入れる（前の中身のまま保存すると戻ってしまう。3回目） */
      ok(r22.amp1 === 'genbaAmp', '★㉒読み直しを断られたとき、まとめた戸別の行に入れない（あとの保存で戻ってしまう） → ' + short({ amp1: r22.amp1 }));
      ok(fin.length === 2 && conf.length && fin[0].i > conf[0].i && /一覧は読み直していません（振り分けた戸別の行には、同じ中身を入れました）/.test(fin[0].s.msg)
         && /「💾 戸別ファイルへ反映」/.test(fin[0].s.msg) && /「📁 フォルダ」で読み直してください/.test(fin[0].s.msg),
         '★㉒読み直しを断られたのに、一覧を読み直していないと言わない → ' + short(fin.map(x => x.s.msg)));
      ok(fin.length === 2 && !/まだ振り分ける前の中身|読み直していません/.test(fin[1].s.msg) && r22.amp2 === 'genbaAmp',
         '★㉒読み直せたのに「まだ前の中身」と言う／読み直さない → ' + short({ msg: fin[1] && fin[1].s.msg, amp2: r22.amp2 }));
    }
    await ctx.close();
  }

  // ---- ㉓ 📥 現場取込：別の物件の預け・台帳に無い戸別は「スキップ」を選んでおく ----
  if(want('㉓')){
    const { ctx, page, said } = await openMain('㉓');
    const r0 = await run(page, async ({ NO, P1N }) => {
      await __fresh();
      _listRows = [ { file: NO + '.json', data: __D(NO), fileType: 'plain' },
                    { file: 'W6X006.json', data: __D('W6X006'), fileType: 'plain' } ];
      _currentProject = { id: 'pj176r2i', name: P1N };
      window.__origPick = window.pickFile;
      window.__giLog = []; window.__giPlan = [];
      window.__giT = setInterval(() => { const m = document.getElementById('genba-import-modal');
        if(!(m && m.classList.contains('open'))) return;
        const a = document.activeElement, wrap = document.getElementById('gi-apply-all-wrap');
        window.__giLog.push({ text: (m.innerText || '').replace(/\s+/g, ' '), active: a ? a.id : '',
          imp: document.getElementById('gi-import').textContent, skip: document.getElementById('gi-skip').textContent,
          all: wrap ? getComputedStyle(wrap).display : '' });
        const plan = window.__giPlan.shift() || 'active';
        if(plan === 'import+all'){ document.getElementById('gi-apply-all').checked = true; document.getElementById('gi-import').click(); return; }
        if(a && /^gi-(import|skip|cancel)$/.test(a.id)) a.click();          // 選んであるボタン（Enter と同じ）
        else document.getElementById('gi-cancel').click();
      }, 25);
      window.__giRun = (list, plan) => {
        const files = list.map(x => new File([JSON.stringify(__S(x.no, { proj: x.proj, ledger: x.proj }))],
                                              x.no + '_現場預け_20261014-091812.json', { type: 'application/json' }));
        window.__giPlan = plan.slice(); window.pickFile = (o, cb) => { cb(files); }; genbaImportFlow(); return true; };
      return true;
    }, { NO, P1N });
    const nDone = () => alerts(said).filter(m => /現場データ取込 完了/.test(m)).length;
    const waitDone = async n => { for(let i = 0; i < 120; i++){ if(nDone() >= n) return true; await sleep(100); } return false; };
    const parts = [
      ['a', [{ no: NO, proj: P2N }], []],                                         // 別の物件（その２）の預け・台帳にある戸別
      ['b', [{ no: 'W5N005', proj: P1N }], []],                                   // 同じ物件の預けだが、台帳に無い戸別
      ['c', [{ no: NO, proj: P1N }], []],                                         // 同じ物件・台帳にある → いつもどおり
      ['d', [{ no: NO, proj: P1N }, { no: 'W6X006', proj: P2N }], ['import+all']] // 「残りも確かめなしで」でも、別の物件の預けは窓を出す
    ];
    const r23 = { log: {} };
    for(const [k, list, plan] of parts){
      const n0 = nDone();
      const st = await run(page, ({ list, plan }) => { const n = window.__giLog.length; window.__giRun(list, plan); return n; }, { list, plan });
      const done = await waitDone(n0 + 1);
      r23.log[k] = await run(page, n => window.__giLog.slice(n), st);
      r23['done' + k] = done;
    }
    const after = await run(page, ({ NO }) => {
      clearInterval(window.__giT); window.pickFile = window.__origPick;
      const amp = no => ((_listRows || []).filter(r => r.data && r.data.chosho_mgmt_no === no)[0] || { data: {} }).data.amplifier;
      const o = { rows: (_listRows || []).map(r => r.data && r.data.chosho_mgmt_no).join(), ampNO: amp(NO), ampW6: amp('W6X006') };
      _currentProject = null; _listRows = [];
      return o;
    }, { NO });
    const fins = alerts(said).filter(m => /現場データ取込 完了/.test(m));
    console.log('㉓📥 別の物件の預け', brief(r23), brief(after), brief(fins));
    ok(!after.error && ['a', 'b', 'c', 'd'].every(k => r23['done' + k]), '㉓止まった／取り込みが終わらない → ' + short({ r23, after }));
    if(!after.error){
      const A = (r23.log.a || [])[0] || {}, B = (r23.log.b || [])[0] || {}, C = (r23.log.c || [])[0] || {}, Dl = r23.log.d || [];
      ok(/現場の台帳: 令和８年度戸別受信設備設置工事（その２）/.test(A.text || ''), '★㉓a 📥 の窓に「現場の台帳」が出ない → ' + String(A.text || '').slice(0, 500));
      ok(/開いている物件（令和８年度戸別受信設備設置工事（その１））とは違います/.test(A.text || '') && /「📮 預かりを振り分ける」/.test(A.text || ''),
         '★㉓a 別の物件の預けなのに注意が無い／振り分けの道を言わない → ' + String(A.text || '').slice(0, 600));
      ok(A.active === 'gi-skip' && A.all === 'none' && /それでも/.test(A.imp || ''), '★㉓a 別の物件の預けで「スキップ」を選んでいない → ' + short(A));
      ok(/にありません/.test(B.text || '') && /「📮 預かりを振り分ける」/.test(B.text || '') && B.active === 'gi-skip',
         '★㉓b 台帳に無い戸別の預けで注意が無い／「スキップ」を選んでいない → ' + short(B));
      ok(C.text !== undefined && !/「📮 預かりを振り分ける」/.test(C.text || '') && C.active !== 'gi-skip' && C.imp === '🔀 取り込む' && C.all !== 'none'
         && /現場の台帳: 令和８年度戸別受信設備設置工事（その１）/.test(C.text || ''),
         '★㉓c 同じ物件の預けにまで注意を出す／ボタンが元に戻らない → ' + short(C));
      ok(Dl.length === 2 && Dl[1].active === 'gi-skip' && /とは違います/.test(Dl[1].text || ''),
         '★㉓d 「残りも確かめなしで」を選ぶと、別の物件の預けまで窓を出さずに取り込む → ' + short(Dl.map(x => ({ a: x.active, t: String(x.text).slice(0, 80) }))));
      ok(after.rows === NO + ',W6X006' && after.ampW6 === 'pcAmp' && after.ampNO === 'genbaAmp',
         '★㉓ スキップしたはずの預けが入った／台帳に無い戸別の行が残った → ' + short(after));
      ok(fins.length === 4 && /取込: 0 件/.test(fins[0]) && /取込: 0 件/.test(fins[1]) && /取込: 1 件/.test(fins[3]) && /スキップ: 1 件/.test(fins[3]),
         '★㉓ 取込の件数が違う → ' + short(fins));
    }
    await ctx.close();
  }

  // ---- ㉔ 行き先を手で選ぶ：その番号の違う物件は自動で決めない → 手で選んだ先に 管理番号.json があればまとめる ----
  if(want('㉔')){
    const { ctx, page, said } = await openMain('㉔');
    const r24 = await run(page, async ({ NO, SIDE }) => {
      await __fresh();
      const T1 = JSON.stringify(__D(NO), null, 2), ST = JSON.stringify(__S(NO, { proj: 'その２' }));
      const l1 = __mk('リスト', { [NO + '.json']: T1 });
      const l3 = __mk('リスト', { [SIDE]: ST });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その３': __mk('その３', {}, { 'リスト': l3 }) });
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      const o = { run: await __sortRun('sort-ok', m => __pickDest(m, NO, 'その１')) };
      o.diff = __diff(before, __tree(root));
      const j = JSON.parse(l1.__files[NO + '.json']);
      o.ph = __pids(j); o.amp = j.amplifier; o.wd = j.work_done; o.sm = j._sideMerged;
      o.bk = (l1.__subs['_整理前の控え'] || { __files: {} }).__files[NO + '.json'] === T1;
      return o;
    }, { NO, SIDE });
    const a24 = alerts(said);
    console.log('㉔手で選ぶ', brief(r24), brief(a24));
    ok(!r24.error, '㉔止まった → ' + r24.error);
    if(!r24.error){
      ok(/どこの物件か分かりません（現場の台帳: 令和８年度戸別受信設備設置工事（その２））/.test(r24.run.text) && !/（決まった物件）/.test(r24.run.text),
         '★㉔預けの台帳（その２）と番号の違う その１ を、ファイルがあるからと自動で決めた → ' + r24.run.text.slice(0, 600));
      ok(/まとめる（2612MKM013\.json に入れる）/.test(r24.run.after) && r24.run.okText === 'この内容で振り分ける（1 件）',
         '★㉔手で選んだ行き先に 管理番号.json があるのに、まとめる にならない → ' + r24.run.after.slice(0, 600));
      ok(r24.ph === 'p1,p2,p3,p4,p5,p6,t1' && r24.amp === 'genbaAmp' && r24.wd === true && Array.isArray(r24.sm) && r24.sm.join() === STAMP && r24.bk,
         '★㉔手で選んだ先へのまとめ方（写真・直した欄・印・控え） → ' + short(r24));
      ok(r24.diff.slice().sort().join() === ['~その１/リスト/' + NO + '.json', '+その１/リスト/_整理前の控え/' + NO + '.json',
                                             '-その３/リスト/' + SIDE, '+その３/リスト/_整理前の控え/' + SIDE].sort().join(),
         '★㉔変わったファイルが決まりと違う → ' + short(r24.diff));
    }
    await ctx.close();
  }

  // ---- ㉕ 物件を開いていて「リスト」だけを選んだ（3回目） ----
  //   a) 工事フォルダ＝選んだリスト そのもの（resolve が [] を返す）→ 開いている物件のリスト → 自動でまとめる・行に入る・保存しても消えない
  //   a2) a と同じ。工事フォルダは覚えてある（物件を開き直したとき：IndexedDB の :dir）だけ
  //   b) 工事フォルダ無し → 手で（選んだ「リスト」）→ 預けの物件が開いている物件なら行に入る → 保存しても消えない
  //   （a の始めに）📁 で読んだだけのリスト（工事フォルダは別）→ 開いている物件のリストと決めない
  const sc25 = async ({ NO, SIDE, P1N, P2N, mode }) => {
      await __fresh();
      const D = Object.assign(__D(NO), { work_done: false, chosho_status: 'in_progress', amplifier: 'amp_3u43' });
      delete D.work_done_at;
      // 預けの物件の名前（proj）・現場で開いていた台帳（ledger）。d/d2 は proj が空（現場の台帳にその戸別が無い。4回目）
      const sideOf = { d: { proj: '', ledger: P1N }, d2: { proj: '', ledger: P2N }, e: { proj: P2N, ledger: P2N } }[mode] || { proj: P1N, ledger: P1N };
      const S = Object.assign(__S(NO, Object.assign({}, sideOf,
          { touched: ['amplifier', 'work_done', 'chosho_status', 'chosho_cust_tel'] })),
          { amplifier: 'amp_1u45', work_done: true, work_done_at: '2026-10-14', chosho_status: 'completed' });
      const files = { [NO + '.json']: JSON.stringify(D, null, 2), [SIDE]: JSON.stringify(S) };
      const W7 = 'W7X007';
      if(mode === 'a') files[W7 + '_現場預け_20261014-100000.json'] = JSON.stringify(__S(W7, { proj: P1N, ledger: P1N, at: '2026-10-14T01:00:00.000Z' }));
      // a：新しい戸別（物件にもリストにも無い）の預け → 開いている物件のリストへ置く（知らせの場所の書き方を見る。4回目）
      if(mode === 'a') files['W6N006_現場預け_20261014-110000.json'] = JSON.stringify(__S('W6N006', { proj: P1N, ledger: P1N, at: '2026-10-14T02:00:00.000Z' }));
      const l = __mk('リスト', files, (mode === 'a') ? { '完了': __mk('完了', { [W7 + '.json']: JSON.stringify(__D(W7), null, 2) }) } : {});
      l.resolve = async o => (o === l) ? [] : null;          // 本物と同じ：同じフォルダなら []
      const rd = Object.assign({}, D, { chosho_note: '物件だけの備考', chosho_photos: null, chosho_photo_count: 6 });
      const row = { file: NO + '.json', data: rd, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
      _listRows = [row];
      _currentProject = { id: 'pj176r3' + mode, name: P1N, cases: [] };
      if(mode === 'a') _projDirHandle = l;                    // 物件に取り込んだ 📁（その１/リスト）が工事フォルダ
      if(mode === 'a2'){                                      // 開き直した物件：工事フォルダは覚えてある（:dir）だけ
        window.__phg = projHandleGet;
        const key = _currentProject.id + ':dir';
        projHandleGet = async k => (k === key) ? l : window.__phg(k);
      }
      if(mode === 'c'){
        const l1 = __mk('リスト', {}); l1.resolve = async o => (o === l1) ? [] : null;
        _projDirHandle = l1;                                  // 開いている物件の工事フォルダは別のリスト
        _listDirHandle = l;                                   // 📁 で読んでいるのが、選んだ「リスト」そのもの
      }
      window.showDirectoryPicker = async () => l;
      const before = __tree(l);
      const o = { run: await __sortRun('sort-ok', (mode === 'b' || mode === 'e') ? (m => __pickDest(m, NO, '選んだ')) : null) };
      await new Promise(res => setTimeout(res, 300));
      o.diff = __diff(before, __tree(l));
      o.placedNew = !!l.__files['W6N006.json'];
      const f = JSON.parse(l.__files[NO + '.json']);
      o.file = { wd: f.work_done, st: f.chosho_status, amp: f.amplifier, sm: f._sideMerged };
      o.row = { wd: row.data.work_done, st: row.data.chosho_status, amp: row.data.amplifier, sm: row.data._sideMerged, note: row.data.chosho_note };
      if(mode !== 'c'){
        // 物件から開いて「物件に保存」（b は工事フォルダを聞かれて その リスト を選ぶ）
        try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
        try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
        const f2 = JSON.parse(l.__files[NO + '.json']);
        o.saved = { wd: f2.work_done, st: f2.chosho_status, amp: f2.amplifier, tel: f2.chosho_cust_tel, sm: f2._sideMerged, ph: __pids(f2) };
        o.linked = (_projDirHandle === l);
      }
      _currentProject = null; _listRows = []; _projDirHandle = null; _listDirHandle = null;
      if(window.__phg){ projHandleGet = window.__phg; window.__phg = null; }
      return o;
  };
  for(const mode of ['a', 'a2', 'b', 'd', 'd2', 'e'].filter(m => want('㉕' + m))){
    const { ctx, page, said } = await openMain('㉕' + mode);
    if(mode === 'a'){
      // 📁 で読んだだけの「リスト」そのもの（開いている物件の工事フォルダは別のリスト）は、開いている物件のリストと決めない
      const rc = await run(page, sc25, { NO, SIDE, P1N, P2N, mode: 'c' });
      const tc = (rc.run && rc.run.text) || '', Rc = rc.row || {};
      ok(!rc.error && /「リスト」だけを選んだので、どの物件のリストか分かりません/.test(tc) && !/（決まった物件）/.test(tc) && rc.run.okDisabled === true
         && rc.diff.length === 0 && Rc.amp === 'amp_3u43',
         '★㉕a 📁 で読んだだけの「リスト」を、開いている物件のリストと決めた（紛れた写しへまとめてしまう） → ' + short({ e: rc.error, t: tc.slice(0, 900), diff: rc.diff, Rc }));
      said.length = 0;
    }
    const r = await run(page, sc25, { NO, SIDE, P1N, P2N, mode });
    const a = alerts(said);
    const fin25 = a.filter(m => /振り分け終わりました/.test(m));
    console.log('㉕' + mode + '「リスト」だけ・物件を開いている', brief(r), brief(a));
    ok(!r.error, '㉕' + mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    const t = r.run.text || '', F = r.file || {}, R = r.row || {}, V = r.saved || {};
    const fileMerged = F.wd === true && F.st === 'completed' && F.amp === 'amp_1u45' && Array.isArray(F.sm) && F.sm.indexOf(STAMP) >= 0;
    if(mode === 'a' || mode === 'a2'){
      ok(/令和８年度戸別受信設備設置工事（その１）（選んだ「リスト」）（決まった物件）/.test(t) && /まとめる（2612MKM013\.json に入れる）/.test(t) && fileMerged,
         '★㉕' + mode + ' 工事フォルダが選んだ「リスト」そのものなのに、開いている物件のリストと分からない／まとめない → ' + short({ t: t.slice(0, 900), F }));
    }
    if(mode === 'a'){
      ok(/この戸別のファイルが リスト の中のフォルダ（リスト\/完了\/W7X007\.json）にあります/.test(t)
         && /エクスプローラで リスト\/完了\/W7X007\.json を リスト へ移してから/.test(t) && !/工事（その１）\//.test(t),
         '★㉕a リストの中の 完了 にあるものの場所の書き方が違う（物件の名前をフォルダのように書く・リスト の外と言う） → ' + t.slice(0, 1400));
      /* 新しい戸別を開いている物件のリストへ置いた：知らせで物件の名前をフォルダの名前のように書かない（4回目） */
      ok(r.placedNew && fin25.length === 1
         && /開いている物件「令和８年度戸別受信設備設置工事（その１）」の一覧は、まだ振り分ける前の中身のままです（1件）。「📁 フォルダ」で 選んだ「リスト」 を読み込むと入ります/.test(fin25[0])
         && !/工事（その１） ＞ リスト/.test(fin25[0]),
         '★㉕a 新しい戸別を置いた知らせで、物件の名前をフォルダの名前のように書く（無いフォルダを読み込ませる） → ' + short({ placed: r.placedNew, fin25 }));
    }
    if(mode === 'b' || mode === 'e'){
      ok(!/（決まった物件）/.test(t) && /まとめる（2612MKM013\.json に入れる）/.test(r.run.after) && fileMerged,
         '㉕' + mode + '試験の前提: 名前の分からないリストを手で選ぶとまとめる → ' + short({ after: (r.run.after || '').slice(0, 700), F }));
    }
    if(mode === 'd' || mode === 'd2'){
      ok(/（選んだ「リスト」）（決まった物件）/.test(t) && /まとめる（2612MKM013\.json に入れる）/.test(t) && fileMerged,
         '㉕' + mode + '試験の前提: 名前の分からないリスト・預けの物件の名前が空 → ファイルがあるので自動でまとめる → ' + short({ t: t.slice(0, 900), F }));
      ok(fin25.length === 1 && !/まだ振り分ける前の中身/.test(fin25[0]),
         '★㉕' + mode + ' 預けの物件の名前が空だと、開いている物件の行に入れず「まだ前の中身」と言う → ' + short(fin25));
    }
    if(mode === 'e'){
      /* その２ とはっきり分かる預けは、その１ の行に入れない。それでも保存で戸別ファイルの済みの印・状態は消さない（4回目） */
      ok(R.wd === false && R.st === 'in_progress' && R.amp === 'amp_3u43' && !(Array.isArray(R.sm) && R.sm.length),
         '★㉕e 預けの物件が その２ とはっきり分かるのに、開いている その１ の行に入れた（別の物件の工事完了が付く） → ' + short(R));
      ok(!r.openErr && !r.saveErr && r.linked && V.wd === true && V.st === 'completed' && Array.isArray(V.sm) && V.sm.indexOf(STAMP) >= 0
         && V.ph === 'p1,p2,p3,p4,p5,p6,t1' && a.some(m => /済みの印・状態は消さずに残しました/.test(m)),
         '★㉕e 行に入れなかった預けの工事完了・状態・まとめた印が、「物件に保存」で戸別ファイルから消える → ' + short({ V, a }));
    } else {
      ok(R.wd === true && R.st === 'completed' && R.amp === 'amp_1u45' && Array.isArray(R.sm) && R.sm.indexOf(STAMP) >= 0 && R.note === '物件だけの備考',
         '★㉕' + mode + ' 開いている物件の行に、まとめた預けが入らない（あとの「物件に保存」で工事完了が外れる） → ' + short(R));
      ok(!r.openErr && !r.saveErr && r.linked && V.wd === true && V.st === 'completed' && V.amp === 'amp_1u45' && V.tel === '0176-11-2222'
         && Array.isArray(V.sm) && V.sm.indexOf(STAMP) >= 0 && V.ph === 'p1,p2,p3,p4,p5,p6,t1',
         '★㉕' + mode + ' 振り分けたあと「物件に保存」すると、戸別ファイルの工事完了・現場の入力・まとめた印・写真が消える → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉖ 振り分けたあと、行から開いて保存しても、戸別ファイルの写真が減らない（3回目） ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㉖' + m))){
    const { ctx, page, said } = await openMain('㉖' + mode);
    const r = await run(page, async ({ NO, P1N, mode }) => {
      await __fresh();
      const l1 = __mk('リスト', {}), l2 = __mk('リスト', {});
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _currentProject = { id: 'pj176r3p' + mode, name: P1N, cases: [] };
      _projDirHandle = l1;
      const nos = (mode === 'd') ? ['W8A008-01', 'W8A008-02'] : [NO];
      const o = { rowPh: {}, file: {}, saved: {} };
      const rows = {};
      for(const no of nos){
        const f = { chosho_mgmt_no: no, chosho_cust_name: '三沢 太郎' };
        if(mode !== 'c') f.amplifier = 'amp_3u43';                     // 図面あり（開くと行の中身を出す）
        if(mode === 'b') f.chosho_photos = [__ph('f1', '#c33')];
        if(mode === 'd') Object.assign(f, { apt_units: '2', apt_idx: no.slice(-1), apt_bldg: 'B-W8A008', apt_name: 'みさわ荘', apt_room: '10' + no.slice(-1) });
        rows[no] = createManualRow(f, 'manual');                        // 受付台帳で作った戸別（物件の外から来ていない）
        if(mode !== 'c'){                                               // いちど開いて「物件に保存」（戸別ファイルができる）
          try { await openCaseInEditor(rows[no]); } catch(e){ o.open1Err = String(e && e.message || e); }
          try { await overwriteSaveCurrentToProject(); } catch(e){ o.save1Err = String(e && e.message || e); }
          o.file1 = Object.assign(o.file1 || {}, { [no]: __pids(l1.__files[no + '.json'] || '{}') });
          o.known = Object.assign(o.known || {}, { [no]: !!rows[no]._photosKnown });
        }
      }
      if(mode === 'b'){   // もう一度開いて写真 m1 を足し、一覧へ戻った（行には入ったが、まだ戸別ファイルに入っていない）
        try { await openCaseInEditor(rows[NO]); } catch(e){ o.open1Err = String(e && e.message || e); }
        STATE.photos = (Array.isArray(STATE.photos) ? STATE.photos : []).concat([__ph('m1', '#c3c')]);
        syncEditorToRowData(true);
        o.rowM1 = { ph: __pids(rows[NO].data), thumb: !!rows[NO].data.chosho_photos_thumb, known: !!rows[NO]._photosKnown };
      }
      // ほかの戸別を開いた（開いた戸別とのつながりが切れる）
      const other = createManualRow({ chosho_mgmt_no: 'W0Z000', chosho_cust_name: '別の家', amplifier: 'amp_3u43' }, 'manual');
      try { await openCaseInEditor(other); } catch(e){ o.openOtherErr = String(e && e.message || e); }
      // 現場の預け（その２ に落ちた。写真あり）
      const G = { [NO]: ['g1', 'g2'], 'W8A008-01': ['g1'], 'W8A008-02': ['g2', 'g3'] };
      nos.forEach((no, i) => {
        const S = __S(no, { proj: P1N, ledger: P1N, at: '2026-10-14T0' + (i + 1) + ':00:00.000Z',
          touched: (mode === 'c') ? ['chosho_cust_tel', 'work_done'] : ['amplifier', 'work_done'] });
        S.chosho_photos = G[no].map((id, k) => __ph(id, __COL[k + 2]));
        if(mode !== 'c') S.amplifier = 'amp_1u45';
        l2.__files[no + '_現場預け_20261014-0' + (i + 1) + '0000.json'] = JSON.stringify(S);
      });
      window.showDirectoryPicker = async () => root;
      o.run = await __sortRun('sort-ok');
      await new Promise(res => setTimeout(res, 300));
      for(const no of nos){
        o.file[no] = __pids(l1.__files[no + '.json'] || '{}');
        o.rowPh[no] = __pids(rows[no].data);
      }
      // 物件の自動保存が先に走った（物件に入れるサムネを作り、ファイルを持たない行の写真はサムネに替わる）
      try { await projSaveNow(); } catch(e){ o.autoErr = String(e && e.message || e); }
      o.thumbed = nos.map(no => !!rows[no].data.chosho_photos_thumb);
      // 振り分けたあと、その戸別を開いて「物件に保存」
      for(const no of nos){
        try { await openCaseInEditor(rows[no]); } catch(e){ o.open2Err = String(e && e.message || e); }
        try { await overwriteSaveCurrentToProject(); } catch(e){ o.save2Err = String(e && e.message || e); }
        o.saved[no] = __pids(l1.__files[no + '.json'] || '{}');
      }
      o.left = Object.keys(l2.__files).filter(n => /現場預け/.test(n));
      _currentProject = null; _listRows = []; _projDirHandle = null; _editingRow = null;
      return o;
    }, { NO, P1N, mode });
    const a = alerts(said);
    console.log('㉖' + mode + '振り分けたあと開いて保存', brief(r), brief(a.filter(m => /振り分け終わりました/.test(m))));
    ok(!r.error, '㉖' + mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    const wantF = { a: { [NO]: 'g1,g2' }, b: { [NO]: 'f1,g1,g2' }, c: { [NO]: 'g1,g2' },
                   d: { 'W8A008-01': 'g1', 'W8A008-02': 'g2,g3' } }[mode];
    const wantSaved = { a: { [NO]: 'g1,g2' }, b: { [NO]: 'f1,g1,g2,m1' }, c: { [NO]: 'g1,g2' },
                        d: { 'W8A008-01': 'g1', 'W8A008-02': 'g2,g3' } }[mode];
    const pre = Object.keys(wantF).every(no => r.file[no] === wantF[no]) && !(r.left || []).length && !r.open1Err && !r.save1Err
      && (mode !== 'b' || (r.rowM1 && r.rowM1.ph === 'f1,m1' && !r.rowM1.thumb && r.rowM1.known)) && !r.autoErr
      && (mode !== 'c' || (r.thumbed && r.thumbed[0] === true))
      && (mode === 'c' || Object.keys(wantF).every(no => r.known[no] === true && r.file1[no] === (mode === 'b' ? 'f1' : '')));
    ok(pre, '㉖' + mode + '試験の前提: いちど保存した戸別ファイル・振り分けで写真が戸別ファイルへ入る → ' + short(r));
    ok(Object.keys(wantF).every(no => wantF[no].split(',').every(id => (r.rowPh[no] || '').split(',').indexOf(id) >= 0))
       && (mode !== 'b' || (r.rowPh[NO] || '').split(',').indexOf('m1') >= 0),
       '★㉖' + mode + ' 振り分けで戸別ファイルに入れた写真を、行に持たせない（開くと画面に出ず、保存で消える） → ' + short(r.rowPh));
    ok(!r.open2Err && !r.save2Err && Object.keys(wantSaved).every(no => r.saved[no] === wantSaved[no]),
       '★㉖' + mode + ' 振り分けたあと開いて「物件に保存」すると、戸別ファイルの写真が減る（行にしか無い写真も入らない） → ' + short({ saved: r.saved, want: wantSaved, e: [r.open2Err, r.save2Err] }));
    await ctx.close();
  }
  // ---- ㉖e 📁 の一覧で、振り分けたあと読み直しを断った（受付台帳で直したままの戸別がある）----
  if(want('㉖e')){
    const { ctx, page, said } = await openMain('㉖e');
    const r = await run(page, async ({ NO, SIDE, P1N }) => {
      await __fresh();
      const W9 = 'W9B009';
      const D0 = Object.assign(__D(NO), { chosho_photos: null });           // 写真の無い戸別（行が写真を持つ扱い）
      const S1 = __S(NO, { proj: P1N }); S1.chosho_photos = [__ph('g1', '#c33'), __ph('g2', '#3c3')];
      const S9 = __S(W9, { proj: P1N, at: '2026-10-14T01:00:00.000Z' }); S9.chosho_photos = [__ph('g9', '#33c')];
      const SN = __S('W1N001', { proj: P1N, at: '2026-10-14T02:00:00.000Z' });     // 一覧に行の無い、新しい戸別
      // W9 の預けは 📁 で読んでいるリストの中（読むと一覧の外の覚え _sideFiles に入る）
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D0, null, 2), [W9 + '.json']: JSON.stringify(__D(W9), null, 2),
                                  'W1A001.json': JSON.stringify({ chosho_mgmt_no: 'W1A001', work_type: 'uhf_new', chosho_status: 'in_progress' }),
                                  [W9 + '_現場預け_20261014-100000.json']: JSON.stringify(S9) });
      const l2 = __mk('リスト', { [SIDE]: JSON.stringify(S1), 'W1N001_現場預け_20261014-110000.json': JSON.stringify(SN) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _listDirHandle = l1;
      await listReloadFolder();
      const byName = n => (_listRows || []).filter(x => x._name === n)[0];
      const other = byName('W1A001.json'); if(other) other._lgEdited = true;   // ほかの戸別を受付台帳で直したまま
      const rNo = byName(NO + '.json'), r9 = byName(W9 + '.json');
      const o = { pre: { other: !!other, noSlim: !!(rNo && rNo._slim), w9Slim: !!(r9 && r9._slim), sf: (_sideFiles || []).length } };
      window.showDirectoryPicker = async () => root;
      o.run = await __sortRun('sort-ok');
      await new Promise(res => setTimeout(res, 300));
      o.file = { no: __pids(l1.__files[NO + '.json']), w9: __pids(l1.__files[W9 + '.json']), n1: !!l1.__files['W1N001.json'] };
      o.row = rNo ? { amp: rNo.data.amplifier, ph: __pids(rNo.data), sm: rNo.data._sideMerged } : null;
      o.row9 = r9 ? { amp: r9.data.amplifier, sm: r9.data._sideMerged } : null;
      o.sfAfter = (_sideFiles || []).map(s => s.name);
      // 開いて「💾 上書き保存」（📁 の戸別は、その戸別ファイルへ書く）
      for(const [k, rr, fn] of [['no', rNo, NO + '.json'], ['w9', r9, W9 + '.json']]){
        try { await openCaseInEditor(rr); } catch(e){ o[k + 'OpenErr'] = String(e && e.message || e); }
        try { await overwriteSaveCurrent(); } catch(e){ o[k + 'SaveErr'] = String(e && e.message || e); }
        o['saved_' + k] = __pids(l1.__files[fn]);
      }
      _listDirHandle = null; _listRows = []; _editingRow = null;
      return o;
    }, { NO, SIDE, P1N });
    const fin = alerts(said).filter(m => /振り分け終わりました/.test(m));
    console.log('㉖e読み直しを断った', brief(r), brief(fin));
    ok(!r.error, '㉖e止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.other && !r.pre.noSlim && r.pre.w9Slim && r.pre.sf === 1 && r.file.no === 'g1,g2' && r.file.w9 === 'g9,p1,p2,p3,p4,p5,p6' && r.file.n1,
         '㉖e試験の前提: 写真の無い戸別・常駐させない戸別・新しい戸別へ振り分ける → ' + short(r));
      ok(r.row && r.row.amp === 'genbaAmp' && r.row.ph === 'g1,g2' && Array.isArray(r.row.sm) && r.row.sm.indexOf(STAMP) >= 0
         && r.row9 && r.row9.amp === 'genbaAmp',
         '★㉖e 読み直しを断られたとき、その戸別ファイルの行に預け（直した欄・写真・印）を入れない → ' + short({ row: r.row, row9: r.row9 }));
      ok(!r.noSaveErr && !r.w9SaveErr && r.saved_no === 'g1,g2' && r.saved_w9 === 'g9,p1,p2,p3,p4,p5,p6',
         '★㉖e 読み直しを断ったあと開いて「💾 上書き保存」すると、戸別ファイルの写真が減る → ' + short(r));
      ok(fin.length === 1 && /一覧は、まだ振り分ける前の中身のままです（読み直していません。1件）/.test(fin[0]),
         '★㉖e 行の無い戸別（新しく置いた）があるのに、一覧がまだ前の中身だと言わない → ' + short(fin));
      ok(Array.isArray(r.sfAfter) && r.sfAfter.length === 0,
         '★㉖e 片付けた預けを、一覧の外の覚え（_sideFiles）に残す（次に押すと、もう無いファイルを読みに行く） → ' + short(r.sfAfter));
    }
    await ctx.close();
  }

  // ---- ㉖f 物件を開いて 📁 の一覧も読んでいる・図面のまだ無い戸別（写真は戸別ファイルにだけある）→ 振り分け → 開いて保存 ----
  if(want('㉖f')){
    const { ctx, page, said } = await openMain('㉖f');
    const r = await run(page, async ({ NO, SIDE, P1N }) => {
      await __fresh();
      const D = Object.assign(__D(NO), { amplifier: '' });              // 図面のまだ無い戸別（写真だけある）
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2) });
      const S = __S(NO, { proj: P1N, touched: ['chosho_cust_tel'] }); S.chosho_photos = [__ph('g1', '#cc3')];
      const l2 = __mk('リスト', { [SIDE]: JSON.stringify(S) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
      _currentProject = { id: 'pj176r3f', name: P1N, cases: [] };
      _projDirHandle = l1; _listDirHandle = l1;
      await listReloadFolder();
      window.showDirectoryPicker = async () => root;
      const o = { run: await __sortRun('sort-ok') };
      await new Promise(res => setTimeout(res, 300));
      o.file = __pids(l1.__files[NO + '.json']);
      const row = (_listRows || []).filter(x => x._name === NO + '.json')[0];
      o.pre = row ? { slim: !!row._slim, fh: !!row.fileHandle, amp: String(row.data.amplifier || '') } : null;
      try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
      o.editorPh = (Array.isArray(STATE.photos) ? STATE.photos : []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      try { await overwriteSaveCurrent(); } catch(e){ o.saveErr = String(e && e.message || e); }
      o.saved = __pids(l1.__files[NO + '.json']);
      _currentProject = null; _listRows = []; _projDirHandle = null; _listDirHandle = null; _editingRow = null;
      return o;
    }, { NO, SIDE, P1N });
    console.log('㉖f図面の無い戸別', brief(r));
    ok(!r.error, '㉖f止まった → ' + r.error);
    if(!r.error){
      const all = 'g1,p1,p2,p3,p4,p5,p6';
      ok(r.file === all && r.pre && r.pre.slim && r.pre.fh && r.pre.amp === '', '㉖f試験の前提: 写真を常駐させない・図面の無い戸別へ振り分ける → ' + short(r));
      ok(!r.openErr && r.editorPh === all, '★㉖f 図面の無い戸別を開くと、戸別ファイルの写真が画面に出ない（保存で消える） → ' + short(r));
      ok(!r.saveErr && r.saved === all, '★㉖f 図面の無い戸別を開いて保存すると、戸別ファイルの写真が消える → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉗ 言い方（3回目） ----
  const sc27 = async ({ NO, SIDE, P1N, mode }) => {
      await __fresh();
      const o = {};
      if(mode === 'a'){        // 名前の分からない その１/リスト・新しい戸別・手で（選んだ「リスト」）
        const l = __mk('リスト', { [SIDE]: JSON.stringify(__S(NO, { proj: P1N, ledger: P1N })) });
        window.showDirectoryPicker = async () => l;
        const before = __tree(l);
        o.run = await __sortRun('sort-ok', m => __pickDest(m, NO, '選んだ'));
        o.diff = __diff(before, __tree(l));
      }
      if(mode === 'b'){        // 上のフォルダを選んだ・預けの物件（その２）は無い・手で その１（ファイル無し）
        const l1 = __mk('リスト', {}), l3 = __mk('リスト', { [SIDE]: JSON.stringify(__S(NO, { proj: 'その２' })) });
        const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その３': __mk('その３', {}, { 'リスト': l3 }) });
        window.showDirectoryPicker = async () => root;
        const before = __tree(root);
        o.run = await __sortRun('sort-ok', m => __pickDest(m, NO, 'その１'));
        o.diff = __diff(before, __tree(root));
      }
      if(mode === 'c'){        // 物件の戸別を開いて保存 → 一覧へ戻った → 振り分け
        const D = __D(NO);
        const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2) });
        const l2 = __mk('リスト', { [SIDE]: JSON.stringify(__S(NO, { proj: P1N, ledger: P1N })) });
        const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }), 'その２': __mk('その２', {}, { 'リスト': l2 }) });
        const row = { file: 'リスト/' + NO + '.json', data: Object.assign({}, D, { chosho_photos: null, chosho_photo_count: 6 }),
                      fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
        _listRows = [row];
        _currentProject = { id: 'pj176r3c', name: P1N, cases: [] };
        _projDirHandle = root.__subs['その１'];
        try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
        try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
        try { openListView(); } catch(_){}
        o.still = (_editingRow === row);
        window.showDirectoryPicker = async () => root;
        const before = __tree(root);
        o.run = await __sortRun('sort-ok');
        o.diff = __diff(before, __tree(root));
        _currentProject = null; _listRows = []; _projDirHandle = null; _editingRow = null;
      }
      if(mode === 'd'){        // 「リスト」を選んだ。リストの中の 完了 に 管理番号.json（新しい戸別の預け）
        const mk = () => __mk('リスト', { [SIDE]: JSON.stringify(__S(NO, { proj: P1N, ledger: P1N })) },
                              { '完了': __mk('完了', { [NO + '.json']: JSON.stringify(__D(NO), null, 2) }) });
        const l = mk();
        const p1 = __mk('その１', {}, { 'リスト': l });
        p1.resolve = async x => (x === l) ? ['リスト'] : ((x === p1) ? [] : null);
        _listDirHandle = p1;                                  // 📁 で その１ を読んでいる → その１ と分かる
        window.showDirectoryPicker = async () => l;
        o.run = await __sortRun('sort-ok');
        _listDirHandle = null;
        const l2 = mk();                                      // 名前の分からない「リスト」→ 手で（選んだ「リスト」）
        window.showDirectoryPicker = async () => l2;
        await __fresh();
        o.run2 = await __sortRun('sort-ok', m => __pickDest(m, NO, '選んだ'));
        await __fresh();                                      // 物件のフォルダ（その１）を選んだ。リストの中の 完了 にある
        const p1b = __mk('その１', {}, { 'リスト': mk() });
        window.showDirectoryPicker = async () => p1b;
        o.run3 = await __sortRun('sort-ok');
      }
      return o;
  };
  const PH27 = { a: ['a', 'b'], b: ['c'], c: ['d'] };    // a は「言う」ときと「言わない」ときを続けて確かめる
  for(const sc of ['a', 'b', 'c'].filter(m => want('㉗' + m))){
    const { ctx, page, said } = await openMain('㉗' + sc);
    for(const mode of PH27[sc]){
      const r = await run(page, sc27, { NO, SIDE, P1N, mode });
      console.log('㉗' + sc + '（' + mode + '）言い方', brief(r));
      ok(!r.error, '㉗' + sc + '止まった → ' + r.error);
      if(r.error) continue;
      const t = (r.run && (r.run.after || r.run.text)) || '';
      if(mode === 'a'){
        ok(/行き先に この戸別のファイル（2612MKM013\.json）がありません。新しく置くのは、行き先がはっきり分かるときだけです。「📁 別のフォルダを選ぶ」で 物件のフォルダ（その１）か 物件情報_調書（上のフォルダ）を選ぶと、新しく置けます/.test(t)
           && r.run.okDisabled === true && r.diff.length === 0,
           '★㉗a 名前の分からない「リスト」で新しい戸別を手で選ぶと、どうすれば置けるか言わない → ' + t.slice(0, 900));
      }
      if(mode === 'b'){
        ok(/行き先に この戸別のファイル（2612MKM013\.json）がありません。新しく置くのは、行き先がはっきり分かるときだけです/.test(t)
           && !/「📁 別のフォルダを選ぶ」で 物件のフォルダ/.test(t) && r.run.okDisabled === true && r.diff.length === 0,
           '★㉗a 上のフォルダを選んでいるのに「上のフォルダを選ぶと置けます」と言う（選んでも置けない） → ' + t.slice(0, 900));
      }
      if(mode === 'c'){
        ok(!r.openErr && !r.saveErr && r.still === true, '㉗b試験の前提: 保存して一覧へ戻っても、開いた戸別とつながったまま → ' + short(r));
        ok(/この戸別は いま開いたままです。まだ保存していなければ 💾 で保存し、ほかの戸別を開くか ページを読み込み直してから、もう一度押してください/.test(t)
           && !/先に保存して閉じてください/.test(t) && r.run.okDisabled === true && r.diff.length === 0,
           '★㉗b 保存して一覧に戻った戸別に「保存して閉じてください」（閉じる操作が無い）と言う → ' + t.slice(0, 900));
      }
      if(mode === 'd'){
        const t2 = (r.run2 && r.run2.after) || '';
        ok(/この戸別のファイルが リスト の中のフォルダ（その１\/リスト\/完了\/2612MKM013\.json）にあります/.test(t)
           && /エクスプローラで その１\/リスト\/完了\/2612MKM013\.json を その１\/リスト へ移してから/.test(t),
           '★㉗c 「リスト」を選んだとき、リストの中の 完了 を「リスト の外（その１/完了/…）」と言う（無いフォルダを探させる） → ' + t.slice(0, 1200));
        ok(/この戸別のファイルが リスト の中のフォルダ（リスト\/完了\/2612MKM013\.json）にあります/.test(t2)
           && /エクスプローラで リスト\/完了\/2612MKM013\.json を リスト へ移してから/.test(t2),
           '★㉗c 名前の分からない「リスト」で、リストの中の 完了 の場所の書き方が違う → ' + t2.slice(0, 1200));
        const t3 = (r.run3 && r.run3.text) || '';
        ok(/この戸別のファイルが リスト の中のフォルダ（その１\/リスト\/完了\/2612MKM013\.json）にあります/.test(t3)
           && /エクスプローラで その１\/リスト\/完了\/2612MKM013\.json を その１\/リスト へ移してから/.test(t3),
           '★㉗c 物件のフォルダを選んだとき、リストの中の 完了 を「リスト の外」と言う → ' + t3.slice(0, 1200));
      }
    }
    await ctx.close();
  }

  // ---- ㉘ 物件を開いていて 📁 のフォルダも覚えている：読み直して物件の行を置き換えない（4回目） ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㉘' + m))){
    const { ctx, page, said } = await openMain('㉘' + mode);
    const r = await run(page, async ({ NO, SIDE, P1N, P2N, mode }) => {
      await __fresh();
      const D = Object.assign(__D(NO), { amplifier: 'amp_3u43' });
      const N6 = 'W6N006';
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(D, null, 2),
        [SIDE]: JSON.stringify(__S(NO, { proj: P1N, ledger: P1N, touched: ['chosho_cust_tel'] })),
        [N6 + '_現場預け_20261014-110000.json']: JSON.stringify(__S(N6, { proj: P1N, ledger: P1N, at: '2026-10-14T02:00:00.000Z' })) });
      l1.resolve = async x => (x === l1) ? [] : null;
      const top = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }) });
      const pid = 'pj176r4' + mode;
      const pname = (mode === 'd') ? P2N : P1N;
      _currentProject = { id: pid, name: pname, cases: [] };
      _projDirHandle = (mode === 'd') ? null : l1;            // 物件の工事フォルダ＝その１/リスト（d は無し）
      const o = {};
      if(mode === 'd'){                                       // その２：台帳で作った行だけ（ファイルはまだ無い）
        _listRows = [createManualRow({ chosho_mgmt_no: 'W8M008', chosho_cust_name: '八戸', amplifier: 'amp_3u43' }, 'manual')];
        await projIdbPut(Object.assign(__proj(pid, pname, []), { cases: [] }));
        try { await projSaveNow(); } catch(e){ o.save0Err = String(e && e.message || e); }
        const p0 = await projIdbGet(pid);
        o.idb0 = ((p0 && p0.cases) || []).map(c => c.payload && (c.payload.chosho_mgmt_no + ':' + c.payload.amplifier)).sort().join();
        _listDirHandle = l1;                                  // 覚えている 📁 は その１/リスト
      } else if(mode === 'c'){                                       // 物件に 📁 を取り込んだ（行がファイルを持つ）
        _listDirHandle = l1;
        await listReloadFolder();
        o.pre = (_listRows || []).map(x => x._name + ':' + !!x.fileHandle).join();
        // 台帳で作った行（ファイルはまだ無い）もある。フォルダの行の証拠にも、物件だけの行にも数えない
        createManualRow({ chosho_mgmt_no: 'W9M009', chosho_cust_name: '九戸', amplifier: 'amp_3u43' }, 'manual');   // 一覧に入る
      } else {
        // 物件の行：NO は事務所が図面を直して一覧へ戻った（物件には保存・戸別ファイルはまだ前のまま）
        //          W5E005 は物件の戸別（ファイルは このリストの外。完了 など）
        const rd = Object.assign({}, D, { amplifier: 'officeAmp', chosho_note: 'PCの備考', chosho_photos: null, chosho_photo_count: 6 });
        const row = { file: NO + '.json', data: rd, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6, _caseId: 'c1' };
        const r5 = { file: 'W5E005.json', data: { chosho_mgmt_no: 'W5E005', chosho_cust_name: '五戸', amplifier: 'amp_3u43', chosho_status: 'in_progress' },
                     fileType: 'plain', _fromProject: true, _caseId: 'c5' };
        _listRows = [row, r5];
        if(mode === 'a'){        // 台帳で作り、「💾 戸別ファイルへ反映」でファイルができた行（ファイルを持つが、フォルダの行ではない）
          l1.__files['W7M007.json'] = JSON.stringify({ chosho_mgmt_no: 'W7M007', chosho_cust_name: '七戸', amplifier: 'amp_3u43' }, null, 2);
          const m7 = createManualRow({ chosho_mgmt_no: 'W7M007', chosho_cust_name: '七戸', amplifier: 'officeAmp7' }, 'manual');
          m7.fileHandle = await l1.getFileHandle('W7M007.json'); m7._dir = l1; m7._name = 'W7M007.json'; m7.file = 'W7M007.json';
          _listRows = [row, r5, m7];
        }
        await projIdbPut(Object.assign(__proj(pid, P1N, []), { cases: [] }));
        try { await projSaveNow(); } catch(e){ o.save0Err = String(e && e.message || e); }
        const p0 = await projIdbGet(pid);
        o.idb0 = ((p0 && p0.cases) || []).map(c => c.payload && (c.payload.chosho_mgmt_no + ':' + c.payload.amplifier)).sort().join();
        _listDirHandle = l1;                                  // 📁 のフォルダを覚えている（「💾 戸別ファイルへ反映」など）
        // 前に 📁 で読んだときの預けの覚え（一覧の外）。片付けたら外す
        _sideFiles = [{ name: SIDE, file: SIDE, dirPath: '', dir: l1, fileHandle: await l1.getFileHandle(SIDE) }];
      }
      window.showDirectoryPicker = async () => (mode === 'b' || mode === 'd') ? top : l1;
      o.run = await __sortRun('sort-ok');
      await new Promise(res => setTimeout(res, 500));
      o.rows = (_listRows || []).map(x => x.data && [x.data.chosho_mgmt_no, x.data.amplifier, x.data.chosho_cust_tel || '',
        (Array.isArray(x.data._sideMerged) && x.data._sideMerged.length) ? 'sm' : ''].join(':')).sort().join();
      if(mode !== 'c'){
        try { await projSaveNow(); } catch(e){ o.saveErr = String(e && e.message || e); }
        const p = await projIdbGet(pid);
        o.idb = ((p && p.cases) || []).map(c => c.payload && (c.payload.chosho_mgmt_no + ':' + c.payload.amplifier)).sort().join();
      }
      o.placed = !!l1.__files[N6 + '.json'];
      o.merged = JSON.parse(l1.__files[NO + '.json']).chosho_cust_tel;
      o.sf = (_sideFiles || []).map(s => s.name).join();
      _currentProject = null; _listRows = []; _projDirHandle = null; _listDirHandle = null;
      return o;
    }, { NO, SIDE, P1N, P2N, mode });
    console.log('㉘' + mode + '物件を開いて 📁 も覚えている', brief(r));
    ok(!r.error, '㉘' + mode + '止まった → ' + r.error);
    if(r.error){ await ctx.close(); continue; }
    const idbWant = { a: '2612MKM013:officeAmp,W5E005:amp_3u43,W7M007:officeAmp7', b: '2612MKM013:officeAmp,W5E005:amp_3u43', d: 'W8M008:amp_3u43' }[mode];
    const rowsWant = { a: '2612MKM013:officeAmp:0176-11-2222:sm,W5E005:amp_3u43::,W7M007:officeAmp7::',
                       b: '2612MKM013:officeAmp:0176-11-2222:sm,W5E005:amp_3u43::', d: 'W8M008:amp_3u43::' }[mode];
    ok(r.placed && r.merged === '0176-11-2222' && (mode === 'c' || r.idb0 === idbWant)
       && (mode !== 'c' || r.pre === '2612MKM013.json:true'),
       '㉘' + mode + '試験の前提: 物件を保存してある・まとめる・新しく置く → ' + short(r));
    if(mode !== 'c'){
      ok(r.rows === rowsWant,
         '★㉘' + mode + ' 振り分けたあと 📁 のフォルダを読み直して、物件の行を置き換えた（物件の戸別・物件だけの直しが消える・別の物件の戸別が入る） → ' + short(r.rows));
      ok(!r.saveErr && r.idb === idbWant,
         '★㉘' + mode + ' 物件の保存から、物件の戸別・物件だけの直しが消えた（別の物件の戸別が入った） → ' + short({ idb: r.idb, e: r.saveErr }));
      ok(r.sf === '', '★㉘' + mode + ' 読み直さないとき、片付けた預けを一覧の外の覚え（_sideFiles）に残す（次に押すと、もう無いファイルを読みに行く） → ' + short(r.sf));
    } else {
      ok(/^2612MKM013:amp_3u43:0176-11-2222:sm,W6N006:genbaAmp:0176-11-2222:sm,W9M009:amp_3u43::$/.test(r.rows),
         '★㉘c 物件に 📁 を取り込んでいるのに、振り分けたあと読み直さない（新しく置いた戸別が一覧に出ない） → ' + short(r.rows));
    }
    await ctx.close();
  }

  // ---- ㉙ 物件に保存：戸別ファイルに、行のまだ知らない預けがまとめてある（ほかのPCで振り分けた。4回目） ----
  if(want('㉙')){
    const { ctx, page, said } = await openMain('㉙');
    const r = await run(page, async ({ NO, P1N, STAMP }) => {
      await __fresh();
      const W2 = 'W2B002', S2 = '2026-10-10T00:00:00.000Z|W2B002';
      // 戸別ファイル：ほかのPCで現場の預けをまとめた（工事完了・状態・まとめた印）
      const F = Object.assign(__D(NO), { amplifier: 'amp_1u45', work_done: true, work_done_at: '2026-10-14', chosho_status: 'completed', _sideMerged: [STAMP] });
      // W2：まとめた印は行も知っている。このPCで事務所が工事完了を外した
      const F2 = Object.assign(__D(W2), { work_done: true, work_done_at: '2026-10-10', chosho_status: 'completed', _sideMerged: [S2] });
      const l = __mk('リスト', { [NO + '.json']: JSON.stringify(F, null, 2), [W2 + '.json']: JSON.stringify(F2, null, 2) });
      const stale = Object.assign({}, F, { amplifier: 'amp_3u43', work_done: false, chosho_status: 'in_progress', chosho_photos: null, chosho_photo_count: 6 });
      delete stale.work_done_at; delete stale._sideMerged;
      const row = { file: NO + '.json', data: stale, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
      const d2 = Object.assign({}, F2, { work_done: false, chosho_status: 'in_progress', chosho_photos: null, chosho_photo_count: 6 });
      delete d2.work_done_at;
      const row2 = { file: W2 + '.json', data: d2, fileType: 'plain', _fromProject: true, _slim: true, _photoCount: 6 };
      _listRows = [row, row2];
      _currentProject = { id: 'pj176r4k', name: P1N, cases: [] };
      _projDirHandle = l;
      const o = {};
      try { await openCaseInEditor(row); } catch(e){ o.openErr = String(e && e.message || e); }
      try { await overwriteSaveCurrentToProject(); } catch(e){ o.saveErr = String(e && e.message || e); }
      const f1 = JSON.parse(l.__files[NO + '.json']);
      o.saved = { wd: f1.work_done, at: f1.work_done_at, st: f1.chosho_status, sm: f1._sideMerged, ph: __pids(f1) };
      o.row = { wd: row.data.work_done, st: row.data.chosho_status, sm: row.data._sideMerged };
      o.sel = (document.getElementById('chosho_status') || {}).value;
      // 開いたまま、もう一度「物件に保存」
      try { await overwriteSaveCurrentToProject(); } catch(e){ o.save2Err = String(e && e.message || e); }
      const f1b = JSON.parse(l.__files[NO + '.json']);
      o.saved2 = { wd: f1b.work_done, st: f1b.chosho_status, sm: f1b._sideMerged };
      try { await openCaseInEditor(row2); } catch(e){ o.open3Err = String(e && e.message || e); }
      try { await overwriteSaveCurrentToProject(); } catch(e){ o.save3Err = String(e && e.message || e); }
      const f2 = JSON.parse(l.__files[W2 + '.json']);
      o.saved3 = { wd: f2.work_done, st: f2.chosho_status, sm: f2._sideMerged };
      _currentProject = null; _listRows = []; _projDirHandle = null; _editingRow = null;
      return o;
    }, { NO, P1N, STAMP });
    const a = alerts(said);
    console.log('㉙行の知らない預けがまとめてある', brief(r), brief(a));
    ok(!r.error, '㉙止まった → ' + r.error);
    if(!r.error){
      const S = r.saved || {}, S2 = r.saved2 || {}, S3 = r.saved3 || {}, R = r.row || {};
      ok(!r.openErr && !r.saveErr && S.wd === true && S.at === '2026-10-14' && S.st === 'completed' && Array.isArray(S.sm) && S.sm.indexOf(STAMP) >= 0
         && S.ph === 'p1,p2,p3,p4,p5,p6',
         '★㉙ 行の知らない預けがまとめてある戸別ファイルへ「物件に保存」すると、工事完了・状態・まとめた印が消える → ' + short(r));
      ok(R.wd === true && R.st === 'completed' && Array.isArray(R.sm) && R.sm.indexOf(STAMP) >= 0 && r.sel === 'completed',
         '★㉙ 戸別ファイルから引き継いだ工事完了・状態・まとめた印を、行と開いている画面に入れない → ' + short({ R, sel: r.sel }));
      ok(!r.save2Err && S2.wd === true && S2.st === 'completed' && Array.isArray(S2.sm) && S2.sm.indexOf(STAMP) >= 0,
         '★㉙ 開いたままもう一度「物件に保存」すると、工事完了・状態が外れる → ' + short(S2));
      ok(a.length >= 1 && /済みの印・状態は消さずに残しました/.test(a[0]),
         '★㉙ 戸別ファイルから済みの印・状態を引き継いだことを知らせない → ' + short(a[0]));
      ok(!r.open3Err && !r.save3Err && S3.wd === false && S3.st === 'in_progress' && Array.isArray(S3.sm) && S3.sm.join() === '2026-10-10T00:00:00.000Z|W2B002'
         && a.length >= 3 && !/済みの印・状態は消さずに残しました/.test(a[2]),
         '★㉙ 行の知っている印だけの戸別ファイルで、事務所が外した工事完了を戻す → ' + short({ S3, a2: a[2] }));
    }
    await ctx.close();
  }

  // ---- ㉚ 📁 の一覧で、預けの印を外しただけ（行の無い戸別）で読み直しを断った（4回目） ----
  if(want('㉚')){
    const { ctx, page, said } = await openMain('㉚');
    const r = await run(page, async ({ NO, P1N }) => {
      await __fresh();
      // いつもの名前の 管理番号.json に _side が入ってしまっている（一覧の行にならない）
      const l1 = __mk('リスト', { [NO + '.json']: JSON.stringify(__S(NO, { proj: P1N }), null, 2),
                                  'W1A001.json': JSON.stringify({ chosho_mgmt_no: 'W1A001', work_type: 'uhf_new', chosho_status: 'in_progress' }) });
      const root = __mk('物件情報_調書', {}, { 'その１': __mk('その１', {}, { 'リスト': l1 }) });
      _listDirHandle = l1;
      await listReloadFolder();
      const other = (_listRows || []).filter(x => x._name === 'W1A001.json')[0];
      if(other) other._lgEdited = true;                       // ほかの戸別を受付台帳で直したまま
      const o = { pre: { rows: (_listRows || []).map(x => x._name).join(), sf: (_sideFiles || []).map(s => s.name).join() } };
      window.showDirectoryPicker = async () => root;
      o.run = await __sortRun('sort-ok');
      await new Promise(res => setTimeout(res, 300));
      o.fileHasSide = !!JSON.parse(l1.__files[NO + '.json'])._side;
      o.rowForNo = (_listRows || []).some(x => x && x.data && x.data.chosho_mgmt_no === NO);
      _listDirHandle = null; _listRows = [];
      return o;
    }, { NO, P1N });
    const fin = alerts(said).filter(m => /振り分け終わりました/.test(m));
    console.log('㉚印を外して読み直しを断った', brief(r), brief(fin));
    ok(!r.error, '㉚止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.rows === 'W1A001.json' && r.pre.sf === NO + '.json' && !r.fileHasSide && !r.rowForNo && fin.length === 1 && /預けの印を外した 1件/.test(fin[0]),
         '㉚試験の前提: 印を外す・行が無い・読み直しを断る → ' + short({ r, fin }));
      ok(fin.length === 1 && /一覧は、まだ振り分ける前の中身のままです（読み直していません。1件）/.test(fin[0])
         && !/振り分けた戸別の行には、同じ中身を入れました/.test(fin[0]),
         '★㉚ 行の無い戸別があるのに「振り分けた戸別の行には、同じ中身を入れました」と言う → ' + short(fin));
    }
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v176_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
