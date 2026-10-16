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
        c) 写真を足して保存 → エディタで その写真を消して もう一度保存 → 画面で消した P だけが消える（G・枠は残る）
        d) ファイルの中身が壊れていて読めない → 書かない・知らせる
        e) 0バイト・BOM だけのファイル（前の保存が途中で切れた残り）→ 読めたものとして書く
     ⑥ 1MB を超える写真を足す → ファイルにはエディタの写真（photoFitForStorage で縮めたもの・1MB以下）がそのまま。物件には縮小版
     ⑦ 「物件に保存」でフォルダを選ばなかった → あとで 受付台帳「💾 戸別ファイルへ反映」で新しく作る → 元の写真
     ⑧ 📥 現場取込（工事フォルダを掴めなかった）→ 図面のまだ無いその戸別を開いて「物件に保存」でフォルダを選ぶ →
        現場の写真が原寸のまま入る・行と物件（端末内）からも消えない（前は開いて保存しただけで写真が消えていた）
        b) 画面に出ていない写真と同じものを入れ直しても二重にならない
     ⑨ 物件の行の縮小版しか無い写真（原寸がどこにも無い）は、新しい戸別ファイルに縮小版のまま入れる（枚数を減らさない）
        a) 図面あり　b) 図面なし　c) 開き直して（写真が画面に出る）消した写真は、行（物件）からは消える
     ⑩ エディタで見せた写真（そのファイルを読んで開いた・行が持っていた）を画面から消すと、これまでどおり戸別ファイルからも消える。
        ファイルが付いているだけの行・ファイルを持たない行は、行の写真（軽くしたもの）を書き、ファイルにしか無い写真・枠も残す
        （埋まった枠は1つにまとめ、名前を引き継ぐ。写真IDの無い名前だけの枠も残す）
   （ここから 見直しの直し）
     ⑪ 工事調書のまとめ印刷のあとでも、画面に入れなかった写真（物件にしか無い）を保存で落とさない
     ⑫ 🔄 最新を取り込む・自動の取り込みで行が作り直されても、元の写真を持ち越す（a 物件の行　b 📥 のあと自動の取り込み　c 台帳の行 → 💾 反映）
     ⑬ 台帳で作った行（写真あり）を物件から戻しても、物件（端末内・共有ファイル）の写真が抜けない（a 開き直す　b まとめる）
     ⑭ 「💾 戸別ファイルへ反映」で行にファイルが付いたあと、開いて保存しても原寸を縮小版で上書きしない・ファイルにしか無い写真を消さない
        （a 図面あり　b 図面なし　c 台帳で作った行）
     ⑮ 📄 で読んだ戸別（工事フォルダとは別のファイル）を物件に保存しても、工事フォルダの戸別ファイルにしか無い写真を落とさない
     ⑯ 管理番号を、もうファイルがある番号に付け替えて保存 → 書かない・知らせる（そのファイルの写真も、元のファイルも消さない）
     ⑰ ほかの端末が同じ写真IDのまま直した写真（回した・軽くした）は、まとめたあと この端末の古い元の写真に戻さない。
        自分の縮小版のままの物件を開き直すときは、元の写真を持ち越す
     ⑱ 「小さい写真」の知らせは、行の写真の中身で決める（開いて保存しても消えない・元の写真の行には出さない）
     ⑲ 共有ファイルとまとめたあと、もう一度写真を足して保存しても、物件にしか無い写真を落とさない
     ⑳ フォルダから読んだ戸別（図面なし）で画面から消した写真は、これまでどおり戸別ファイルからも消える（版178 で変えていない）
   （ここから 2回目の見直しの直し）
     ㉑ 「💾 戸別ファイルへ反映」でファイルが付いた行は、付いているファイルへ書く（同じ管理番号のファイルをもう1つ作らない・縮小版を書かない）
        a) 台帳で作った行（図面あり）　b) 台帳で作った行（図面なし）　c) ファイルを「リスト/完了」へ移してあった
        d) Android の名前（管理番号_数字.json）→ 管理番号.json にそろえる（写真がみな移ったので古い名前を消す）・2回目の保存も同じファイルへ
     ㉒ 名前の大文字・小文字を区別しないフォルダ（Windows・Mac）で、小文字の名前の戸別ファイル → そのファイルへ書く（消さない・断らない）
     ㉓ 開いたあとで現場入力がファイルに足した写真を、保存で消さない（画面で消した写真だけを消す）
        a) 図面なし・物件に保存　b) 図面あり・💾 上書き保存（物件なし）　c) 一覧へ戻ったあと、協力会社諸経費のそろえ直しで書く
        d) 物件に保存のあと開き直して 💾 上書き保存　e) 画面で消した写真は 💾 上書き保存 で消える　f) 足して上書き保存 → 消して上書き保存 → 消える
        g) 📮 振り分けで写真が入った（まだ開いていない）📁 の行を開いて1枚消す → 💾 上書き保存で消える
     ㉔ 自分のファイルから読んだ行の小さい写真（図など）を「小さい写真」と言わない。物件の行（開いて直して印が外れた）は今までどおり言う
     ㉕ 暗号の戸別（.hyb）：写真を剥がした封筒をそのまま書かない（a 元のファイルの暗号の写真を戻して書く　b 鍵が違えば書かない・知らせる）
     ㉖ 物件の縮小版づくりが動いているあいだに次の保存が来たら、終わるのを待つ（縮小版の無い行を「写真なし」で物件に入れない）
     ⑫d 物件にだけ保存 → 別の欄を直す → 保存せずに物件を開き直す → 物件に保存でフォルダを選ぶ → 元の写真
     ⑭d 開いて直して戻った（縮小版の印が外れた）物件の行に「💾 戸別ファイルへ反映」でファイルが付いたあと保存 → 原寸と K が残る
     ⑯c 同じ管理番号のファイルが2つあり、行の知らない写真がある → 書かない・「🧩 重複をまとめる」を案内する
     ⑯d 付け替え先のファイルの写真を行がみな知っている → 両方の写真で書き、古いファイルを消す（断らない）
     ⑯e 同じ・物件の行が付け替え先の写真の縮小版しか持っていない → 付け替え先には原寸を残す
   （ここから 3回目の見直しの直し）
     ㉒ （作り直し）作り物のフォルダの isSameEntry を Chromium と同じにした（渡した名前の文字どおりに比べる＝大文字・小文字も区別）
        a) 行が知らない写真 K がある（前は「同じ管理番号のファイルが2つ」と断った）　b) 行が G・K を知っている（前は書いたあと同じファイルを消した）
     ⑯f 管理番号を打ち間違えて、ほかのお宅のファイル（写真なし・名前も住所も違う）の番号にして保存 → 書かない・どちらのファイルも元のまま（a 台帳の行　b 物件の行）
     ⑯g 同じ・付け替え先のファイルが写真なしで、お客様の名前が同じ（全角の空白・「様」の違いは同じと見る）→ そのファイルへ書き、
        古いファイルは写真（あとで現場が足した K も）がみな移ってから消す（a 台帳の行　b 物件の行）
     ㉕c 暗号の戸別（.hyb）を 💾 上書き保存（鍵の元が新しくなる）したあと、そろえ直しで戸別ファイルへ書ける（断らない）・写真がほどける
     ㊸ 付いているファイル（💾 戸別ファイルへ反映 で付けた）
        a) ほかのPCが Android の名前のファイルを 管理番号.json にまとめた → 管理番号.json へ書く（G 原寸・K を残す・ほかにファイルを作らない）
        b) ほかのPCが「リスト/完了」へ動かした・リストに 管理番号.json も無い → どこにも書かない・作らない（0バイトも）・📁 で読み直すよう知らせる
        c) 物件の行の覚えている古い名前のファイルが壊れている → 書かない・空の 管理番号.json を残さない
        d) 💾 反映で「リスト」を選んで付けた → 保存で物件の覚える道のりを工事フォルダ（その１）から見た「リスト/管理番号.json」にする（resolve）→
           次の日 物件を開き直しても同じファイルへ書く（1 物件は「リスト/管理番号.json」を覚えている　2 物件は「管理番号.json」を覚えている）
     ㊹ 写真IDの無い名前だけの枠を、画面で ✕・名前を直して 💾 上書き保存 → 外した枠・前の名前の枠が戻ってこない
     ㊺ 共有の物件とまとめて行が作り直されたあと、画面で消した写真は 💾 上書き保存 で消える（a 自動保存でまとめる　b 🔄 最新を取り込む）
     ㊻ 開き直すとき一度だけファイルを読めなかった → 何も見せていない＝あとの保存で写真を消さない（a 図面あり・💾 上書き保存　b 図面なし・💾 物件に保存）
     ㊼ 💾 上書き保存で元ファイルを読み直せない → 書かない・知らせる（開いたあとで現場が足した写真を消さない）。読めるようになって押せば書く
     ㊽ 開いている戸別へ 📥 現場取込 → 直して戻って開き直し 💾 上書き保存 → 前に見せた写真（ファイルにある）を消さない
     ㊾ 📥 現場取込で行にだけ入った写真（ファイルに書けなかった）→ 開くと画面に出る・保存でファイルに入る（a 物件なし・図面あり　b 物件あり・図面なし）
     ㊿ 縮小版づくり（自動保存）のあいだに行の写真が変わった → 古い縮小版を付けない（足した写真の縮小版も物件に入る）
   （ここから 4回目の見直しの直し）
     ⑯f （直し）付け替え先が写真なし・名前の違うファイル → 同じお宅か聞く（両方の名前を見せる）。キャンセル → 書かない
     ⑯g （直し）名前が同じなら聞かずに書く　⑯h 聞いて OK → そのファイルへ書く（キャンセルのときは書かない）
     ⑯i まとめて書いているとき（📥・諸経費のそろえ直し）は聞かずに書かない・開いて「💾 物件に保存」するよう知らせる
     ⑯j アパートの別の世帯（住所が同じ）のファイル → 住所だけでは同じお宅と見ない（聞いてキャンセル → 書かない）
     ㉕d 物件の暗号の行（写真を剥がした封筒）に .hyb が付いた → 開くとファイルの写真が出る・💾 上書き保存で写真が消えない（d2 先に 🔓 まとめて復号）
     ㊸e 💾 反映で リスト を選んで一覧を読み直した → 覚える名前を工事フォルダから見た道のりに → 次の日の保存も リスト/管理番号.json へ
     ㊸f 物件の覚えている名前で見つからない → 工事フォルダの中の 管理番号.json へ書く（f2 2つあれば書かない）
     ㊻c ファイルを読めないまま開いた（図面なし）→ 行の写真（📥 で入れた分）を出して知らせる・戻っても行は「ファイルから読む」のまま
     ㊼b 💾 上書き保存の元ファイルの名前がほかのPCで変わった → 同じフォルダの 管理番号.json に付け直して書く
     ㊼c 元ファイルが壊れている → この画面の中身で書き直すか聞く　㊼d そろえ直しで開いている戸別の名前が変わった → 行き先も付け替わる
     ㊽ （直し）開いている戸別へ 📥 → 画面にファイルの写真と現場の写真を合わせて出す
     ㊽b 画面で消した写真は、開いている戸別へ 📥 したあとの保存でも戻らない　㊽c 常駐させない行へ 📥 して書けた → 行は「ファイルから読む」に戻る
     ㊿b 縮小版づくりのあいだに直して戻った・物件に保存を押した（写真は同じ）→ 作った縮小版を使う（共有ファイルとまとめても写真が残る）
     ㊿c 縮小版を作れないまま物件に入り、まとめで行が作り直された → この端末の元の写真を戻す・次の保存で縮小版が入る
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
      ok(/物件に保存/.test(r1.btn.text) && r1.btn.disabled === false, '★①図面のまだ無い戸別を開くと「💾 物件に保存」が押せない → ' + short(r1.btn));
      ok(r1.picks === 1, '①試験の前提: 「物件に保存」でフォルダを選ぶ → ' + short(r1.btn) + ' picks=' + r1.picks);
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
               pGone: !!(ed && !ph.some(x => x.id === ed.id)),
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
      } else if(mode === 'c'){
        ok(r5.n === 1 && r5.gSame, '★⑤c戸別ファイルにあった現場の写真が消えた・変わった → ' + short(r5));
        ok(r5.pGone, '★⑤c画面で消した写真（行が見せて書いた写真）が、戸別ファイルに残る → ' + short(r5));
      } else {
        ok(r5.n === 2 && r5.gSame, '★⑤' + mode + '戸別ファイルにあった現場の写真が消えた・変わった → ' + short(r5));
        ok(r5.pSame, '★⑤' + mode + '足した写真が元の写真ではない（縮小版） → ' + short(r5));
      }
      if(mode === 'b' || mode === 'c') ok(r5.first === 2, '⑤' + mode + '試験の前提: 1回目の保存で2枚 → ' + short(r5));
      ok(r5.slot, '★⑤' + mode + '戸別ファイルの名前だけの枠が消えた → ' + short(r5));
    }
    await ctx.close();
  }

  // ---- ⑤e 台帳で作った行＋工事フォルダに 0バイト・BOM だけの 管理番号.json（前の保存が途中で切れた残り）→ 書ける ----
  for(const mode of ['empty', 'bom'].filter(m => want('⑤e'))){
    const { ctx, page } = await openMain('⑤e' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      await __openProj(__proj178('pj178e' + mode, PN, []));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      const root = __mk('その１', { [NO + '.json']: mode === 'bom' ? '\uFEFF' : '' });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 31); await __addPhoto(src, 'p.jpg');
      await __pressSave();
      const ph = __photosOf(root.__files[NO + '.json'] || '{}') || [];
      return { writes: root.__writes.length, n: ph.length, same: ph.length === 1 && ph[0].dataUri === src };
    }, { NO, PN, mode });
    console.log('⑤e' + mode + '空のファイル', short(r));
    ok(!r.error && r.writes === 1 && r.n === 1 && r.same, '★⑤e' + mode + '0バイト・BOM だけのファイルがあると、戸別ファイルを書けない → ' + short(r));
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
      // 写真ごとに中身を変える（同じ中身だと、同じ写真と見なされて試験が効かない）
      const ph = (id, n, ch) => ({ id, label: id, dataUri: 'data:image/jpeg;base64,' + (ch || 'A').repeat(n) });
      const file = JSON.stringify({ chosho_mgmt_no: NO, chosho_photos: [ph('k1', 900), ph('x1', 900, 'B'),
                                    { id: 's1', label: '', dataUri: ph('s1', 700, 'C').dataUri },   // 現場が埋めた枠
                                    { label: '屋根の上', dataUri: null }] });                          // 写真IDの無い名前だけの枠
      const fh = { getFile: async () => ({ text: async () => file }) };
      fh.isSameEntry = async o => o === fh;
      // エディタがこのファイルを読んで開いた行（見せた写真を覚えている＝_photosSeen）：画面で消した x1 は消える
      const src = { fileType: 'plain', fileHandle: fh, _photosSeen: new Set(['k1', 'x1', 's1']), _photosKnown: true,
                    data: { chosho_mgmt_no: NO, chosho_photos: [ph('k1', 900), { id: 's1', label: '表札', dataUri: null }, { label: '屋根の上', dataUri: null }] } };
      // ファイルが付いているだけの行（このファイルを読んで開いていない）：ファイルにしか無い写真を残す
      const att = { fileType: 'plain', fileHandle: fh, _photosKnown: true, data: { chosho_mgmt_no: NO, chosho_photos: [ph('k1', 900)] } };
      // ファイルを持たない行：行の写真（軽くした k1）を書き、ファイルにしか無い x1 と、埋まった枠 s1（名前は「表札」）を残す
      const nosrc = { fileType: 'plain', _photosKnown: true,
                      data: { chosho_mgmt_no: NO, chosho_photos: [ph('k1', 400), { id: 's1', label: '表札', dataUri: null }] } };
      const a = await buildIndividualContent(src, fh);
      const c = await buildIndividualContent(att, fh);
      const b = await buildIndividualContent(nosrc, fh);
      const ids = o => (o.chosho_photos || []).map(p => (p.id || '-') + ':' + (p.dataUri ? p.dataUri.length : 'slot') + ':' + (p.label || '')).join(',');
      return { src: ids(a), att: ids(c), nosrc: ids(b) };
    }, { NO });
    console.log('⑩ファイルを持つ行', short(r10));
    ok(!r10.error, '⑩止まった → ' + r10.error);
    if(!r10.error){
      ok(r10.src === 'k1:923:k1,s1:slot:表札,-:slot:屋根の上', '★⑩フォルダから読んで開いた行で消した写真が、戸別ファイルに戻ってくる → ' + short(r10));
      ok(/^k1:923:k1,x1:923:x1,s1:723:,-:slot:屋根の上$/.test(r10.att),
         '★⑩ファイルが付いているだけの行（そのファイルを読んで開いていない）で、ファイルにしか無い写真・枠を落とす → ' + short(r10));
      ok(r10.nosrc === 'k1:423:k1,s1:723:表札,x1:923:x1,-:slot:屋根の上',
         '★⑩ファイルを持たない行で、行の写真（軽くしたもの）を書かない・ファイルにしか無い写真や枠を落とす・埋まった枠を二重にする → ' + short(r10));
    }
    await ctx.close();
  }

  // ---- ⑪ 工事調書のまとめ印刷のあとでも、画面に入れなかった写真（物件にしか無い）を保存で落とさない ----
  if(want('⑪')){
    const { ctx, page } = await openMain('⑪');
    const r = await run(page, async ({ NO, PN }) => {
      const G = __jpeg(900, 700, 0.85, 21); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178('pj178k', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                   chosho_photos: [{ id: gid, label: '物件にしか無い', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      const src = __jpeg(900, 700, 0.85, 22); const ed = await __addPhoto(src, 'e.jpg');
      let printed = 0;
      printWithFilename = (n, cb) => { printed++; try { cb && cb(); } catch(_){} };
      await buildAndPrintChoshoBatch([row], 'x_');
      await new Promise(r => setTimeout(r, 300));
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await __pressSave();
      const tag = p => p.id === gid ? 'G' : (ed && p.id === ed.id ? (p.dataUri === src ? 'P' : 'P縮') : '?');
      const tagId = p => p.id === gid ? 'G' : (ed && p.id === ed.id ? 'P' : '?');     // 物件の中は縮小版（写真IDで見る）
      const idb = await __idbPhotos('pj178k', NO);
      const r2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      return { shown, printed, file: (__photosOf(list.__files[NO + '.json'] || '{}') || []).map(tag),
               idb: idb.photos.map(tagId), row: (r2.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag) };
    }, { NO, PN });
    console.log('⑪まとめ印刷のあと', short(r));
    ok(!r.error, '⑪止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 0 && r.printed === 1, '⑪試験の前提: 図面の無い戸別を開いて、まとめ印刷をした → ' + short(r));
      ok(r.file.join() === 'G,P' && r.idb.join() === 'G,P' && r.row.join() === 'G,P',
         '★⑪まとめ印刷のあとの保存で、物件にしか無い写真が消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑫ 🔄 最新を取り込む・自動の取り込み・物件の開き直しでも、元の写真を持ち越す ----
  //   a) 物件の行に写真を足して保存（フォルダは選ばない）→ ほかの端末が保存 → 🔄 最新を取り込む → 物件に保存（フォルダを選ぶ）
  //   b) 📥 現場取込（フォルダを掴めない）→ 自動の取り込み → 物件に保存
  //   c) 台帳で作った行に写真を足して保存（フォルダは選ばない）→ 🔄 → 💾 戸別ファイルへ反映（新しく作る）
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑫' + m))){
    const { ctx, page } = await openMain('⑫' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const cases = (mode === 'c') ? [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
                                        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]
                                   : [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
                                        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }];
      await __openShared(__proj178('pj178l' + mode, PN, cases));
      let row = (mode === 'c') ? createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual')
                               : _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const src = __jpeg(900, 700, 0.85, 40);
      const o = {};
      if(mode === 'b'){
        const genba = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
                        chosho_photos: [{ id: photoContentId(src), label: '現場で撮った', dataUri: src }] };
        __abortPicker(); _genbaNoDir = false;
        o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 40);
        await prepareProjectThumbs(); await projSaveNow();
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
      } else {
        await openCaseInEditor(row);
        await __addPhoto(src, 'p.jpg');
        __abortPicker();
        await __pressSave();                                 // 物件に保存（フォルダは選ばなかった）
      }
      o.rowHadOrig = ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      __otherDeviceSaves('2612MKM099');
      if(mode === 'b'){ _rtRemoteBump = { name: '別のPC', at: Date.now() }; o.pulled = await rtMaybeAutoPull({ name: '別のPC' }); }
      else await rtPullLatest();
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      o.rebuilt = row2 !== row;
      o.rowOrig = ((row2.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      let ph;
      if(mode === 'c'){
        const root = __mk('工事フォルダ', { [NO2 + '.json']: JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '別 様' }, null, 2) });
        window.showDirectoryPicker = async () => root;
        try { await listDirForget(); } catch(_){}
        _listDirHandle = null;
        listReloadFolder = async () => {};
        await lgwbButton();
        ph = __photosOf(root.__files[NO + '.json'] || '{}') || [];
      } else {
        const list = __mk('リスト', {});
        window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
        await openCaseInEditor(row2);
        await __pressSave();
        ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      }
      o.n = ph.length; o.same = ph.length === 1 && ph[0].dataUri === src; o.lens = ph.map(p => p.dataUri.length); o.srcLen = src.length;
      return o;
    }, { NO, NO2, PN, mode });
    console.log('⑫' + mode + '取り込み・開き直し', short(r));
    ok(!r.error, '⑫' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.rowHadOrig && r.rebuilt && (mode !== 'b' || r.pulled), '⑫' + mode + '試験の前提: 元の写真を持ったまま、行が作り直される → ' + short(r));
      ok(r.rowOrig, '★⑫' + mode + '最新を取り込むと、行の元の写真が縮小版に替わる → ' + short(r));
      ok(r.n === 1 && r.same, '★⑫' + mode + '最新を取り込んだあと、戸別ファイルに縮小版が書かれた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑬ 台帳で作った行（写真あり）を物件から戻しても、物件（端末内・共有ファイル）の写真が抜けない ----
  //   a) 物件を開き直す → 別の戸別を直して保存　b) 共有ファイルとまとめる → 次の保存
  for(const mode of ['a', 'b'].filter(m => want('⑬' + m))){
    const { ctx, page } = await openMain('⑬' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const P = __proj178('pj178m' + mode, PN, [{ caseId: 'c2', file: NO2 + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO2, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]);
      if(mode === 'a') await __openProj(P); else await __openShared(P);
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      await openCaseInEditor(row);
      await __addPhoto(__jpeg(900, 700, 0.85, 41), 'c.jpg');
      __abortPicker();
      await __pressSave();
      const o = { idb1: (await __idbPhotos('pj178m' + mode, NO)).photos.length };
      if(mode === 'a'){
        await applyProject(await projIdbGet('pj178m' + mode), { silent: true });       // 次の日：物件を開き直す
      } else {
        __otherDeviceSaves('2612MKM099');
      }
      const other = _listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0];
      setLedger(subCaseKey(other), { note: 'メモ1' });                                   // 別の戸別の備考を直す（自動保存）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      setLedger(subCaseKey(_listRows.filter(r => r.data.chosho_mgmt_no === NO2)[0]), { note: 'メモ2' });
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      const idb = await __idbPhotos('pj178m' + mode, NO);
      o.idb2 = { n: idb.photos.length, count: idb.count };
      if(mode === 'b') o.disk = __diskPhotos(NO);
      return o;
    }, { NO, NO2, PN, mode });
    console.log('⑬' + mode + '台帳で作った行を戻す', short(r));
    ok(!r.error, '⑬' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.idb1 === 1, '⑬' + mode + '試験の前提: 物件に写真が入る → ' + short(r));
      ok(r.idb2.n === 1 && (mode !== 'b' || r.disk.n === 1),
         '★⑬' + mode + '台帳で作った行の写真が、物件（端末内・共有ファイル）から抜けた（枚数だけ残る） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑭ 「💾 戸別ファイルへ反映」で物件の行にファイルが付いたあと、開いて保存しても原寸を縮小版で上書きしない ----
  //   a) 図面あり（前は「💾 上書き保存」が縮小版で上書きし、ファイルにしか無い写真 K も消していた）　b) 図面なし
  //   c) 台帳で作った行（このPC）にファイルが付いただけ → 写真の無いまま保存しても、現場の写真が消えない
  for(const mode of ['a', 'b', 'c'].filter(m => want('⑭' + m))){
    const { ctx, page } = await openMain('⑭' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 31); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 32); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' };
      if(mode === 'a') base.amplifier = 'amp_3u43';
      let row;
      if(mode === 'c'){
        await __openProj(__proj178('pj178n' + mode, PN, []));
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様' }, 'manual');
      } else {
        const pl = Object.assign({}, base, { chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 });
        await __openProj(__proj178('pj178n' + mode, PN, [{ caseId: 'c1', file: NO + '.json', lastModified: 0, payload: pl }]));
        row = _listRows[0];
      }
      const fileObj = Object.assign({}, (mode === 'c') ? row.data : base, { _origin: 'genba',
                        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] });
      const root = __mk('その１', { [NO + '.json']: JSON.stringify(fileObj, null, 2) });
      window.showDirectoryPicker = async () => root;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      await lgwbButton();                                   // 💾 戸別ファイルへ反映（書き戻すものは無い・行にファイルが付く）
      const o = { fh: !!row.fileHandle };
      await openCaseInEditor(row);
      const el = document.getElementById('chosho_cust_tel');
      el.value = '090-1111-2222'; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change'));
      o.btn = await __pressSave();
      const j = JSON.parse(root.__files[NO + '.json']);
      o.tel = j.chosho_cust_tel;
      o.file = (__photosOf(j) || []).map(p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? 'K' : '?'));
      return o;
    }, { NO, PN, mode });
    console.log('⑭' + mode + '反映のあとの保存', short(r));
    ok(!r.error, '⑭' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.fh && r.btn.pressed && r.tel === '090-1111-2222', '⑭' + mode + '試験の前提: 反映で行にファイルが付き、開いて保存できる → ' + short(r));
      ok(r.file.join() === 'G原寸,K', '★⑭' + mode + '反映のあとに開いて保存すると、原寸を縮小版で上書きする・ファイルにしか無い写真が消える → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑮ 📄 で読んだ戸別（工事フォルダとは別のファイル）を物件に保存しても、工事フォルダの戸別ファイルにしか無い写真を落とさない ----
  for(const mode of ['a', 'b'].filter(m => want('⑮' + m))){
    const { ctx, page } = await openMain('⑮' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G1 = __jpeg(900, 700, 0.85, 51), G2 = __jpeg(900, 700, 0.85, 52), F1 = __jpeg(900, 700, 0.85, 53);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(mode === 'b') base.amplifier = 'amp_3u43';                  // b) 図面あり
      await __openProj(__proj178('pj178o' + mode, PN, []));
      const root = __mk('その１', { [NO + '.json']: JSON.stringify(Object.assign({}, base, {
        chosho_photos: [{ label: '現場1', dataUri: G1, id: 'g1' }, { label: '現場2', dataUri: G2, id: 'g2' }] })) });
      _projDirHandle = root;
      const text = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ label: '写し', dataUri: F1, id: 'f1' }] }));
      const row = buildListRow(NO + '.json', 2, JSON.parse(text));
      row.srcFile = { name: NO + '.json', lastModified: 2, text: async () => text };
      slimListRow(row, true);
      _listRows = [row];
      await openCaseInEditor(row);
      const b = document.getElementById('btn-save-overwrite');
      const btn = { text: b.textContent, disabled: b.disabled };
      if(!b.disabled) await b.onclick();
      return { btn, file: __pids(root.__files[NO + '.json']) };
    }, { NO, PN, mode });
    console.log('⑮' + mode + '📄 で読んだ戸別', short(r));
    ok(!r.error, '⑮' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.file === 'f1,g1,g2', '★⑮' + mode + '📄 で読んだ戸別の保存で、工事フォルダの戸別ファイルにしか無い写真が消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑯ 管理番号を、もうファイルがある番号に付け替えて保存 → 書かない（そのファイルの写真を消さない・元のファイルも消さない） ----
  for(const mode of ['a', 'b'].filter(m => want('⑯' + m))){
    const { ctx, page, said } = await openMain('⑯' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      let row;
      if(mode === 'a'){
        await __openProj(__proj178('pj178p' + mode, PN, []));
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');
      } else {
        await __openProj(__proj178('pj178p' + mode, PN, [{ caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', chosho_status: 'in_progress', work_type: '' } }]));
        row = _listRows[0];
      }
      const G2 = __jpeg(900, 700, 0.85, 61); const g2 = photoContentId(G2);
      const root = __mk('その１', { [NO2 + '.json']: JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '台帳 様', _origin: 'genba',
                        chosho_photos: [{ id: g2, label: '現場で撮った', dataUri: G2 }] }, null, 2) });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const P = __jpeg(900, 700, 0.85, 62);
      await __addPhoto(P, 'p.jpg');
      await __pressSave();                                   // NO.json を作る
      const first = { n1: (__photosOf(root.__files[NO + '.json'] || '{}') || []).length };
      const el = document.getElementById('chosho_mgmt_no');   // 現場が使っている番号へ直す
      el.value = NO2; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change'));
      await __pressSave();
      const ph = __photosOf(root.__files[NO2 + '.json'] || '{}') || [];
      return { first, removed: root.__removed, keptOld: (NO + '.json') in root.__files,
               ids: ph.map(p => p.id === g2 ? 'G2' : (p.dataUri === P ? 'P' : '?')) };
    }, { NO, NO2, PN, mode });
    const a16 = alerts(said);
    console.log('⑯' + mode + '番号の付け替え', short(r));
    ok(!r.error, '⑯' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.first.n1 === 1, '⑯' + mode + '試験の前提: 1回目の保存で NO.json ができる → ' + short(r));
      ok(r.ids.join() === 'G2' && r.removed.length === 0 && r.keptOld,
         '★⑯' + mode + 'もうファイルがある番号へ付け替えて保存すると、そのファイルの写真が消える・元のファイルが消える → ' + short(r));
      ok(a16.some(m => /もう工事フォルダにあります/.test(m) && /管理番号が合っているか/.test(m) && /📥 現場取込/.test(m)), '★⑯' + mode + '書かなかったことを知らせない・どうすればよいか言わない → ' + short(a16.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ⑰ ほかの端末が同じ写真IDのまま中身を直した（回した・軽くした）→ まとめたあと、この端末の古い元の写真に戻さない ----
  if(want('⑰')){
    const { ctx, page } = await openMain('⑰');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178q', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' } }]));
      let row = _listRows[0];
      await openCaseInEditor(row);
      const ORIG = __jpeg(900, 700, 0.85, 71);
      STATE.photos = [{ label: '写真1', dataUri: ORIG, id: 'X' }];
      syncEditorToRowData(true);
      await projSaveNow();
      const NEWTHUMB = await makeThumbDataUri(__jpeg(700, 900, 0.85, 72), PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const disk = JSON.parse(JSON.stringify(await projIdbGet('pj178q')));
      disk.cases[0].payload.chosho_photos = [{ label: '写真1', dataUri: NEWTHUMB, id: 'X' }];
      disk.cases[0].payload.chosho_photos_thumb = true;
      disk.updatedAt = new Date().toISOString();
      await applyMergedLocally(disk);                       // この戸別は直していない＝ほかの端末の版が入る
      row = _listRows[0];
      const o = { other: ((row.data.chosho_photos || [])[0] || {}).dataUri === NEWTHUMB };
      // 自分の縮小版のままの物件を開き直す → 元の写真に戻る（持ち越す）
      await applyProject(await projIdbGet('pj178q'), { silent: true });
      const pre = _listRows[0];
      pre.data = Object.assign({}, pre.data, { chosho_photos: [{ label: '写真1', dataUri: ORIG, id: 'X' }] });
      pre._thumbs = undefined; await projSaveNow();                 // 自分の縮小版を物件に入れる
      await applyProject(await projIdbGet('pj178q'), { silent: true });
      o.mineBack = ((_listRows[0].data.chosho_photos || [])[0] || {}).dataUri === ORIG;
      return o;
    }, { NO, PN });
    console.log('⑰ほかの端末が直した写真', short(r));
    ok(!r.error, '⑰止まった → ' + r.error);
    if(!r.error){
      ok(r.other, '★⑰ほかの端末が直した写真を、この端末の古い元の写真に戻した → ' + short(r));
      ok(r.mineBack, '★⑰自分の縮小版のままの物件を開き直すと、元の写真が縮小版に替わる → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑱ 「小さい写真」の印は、行の写真の中身で決める（開いて保存しても印が外れない・元の写真に戻した行は小さいと言わない） ----
  for(const mode of ['a', 'b'].filter(m => want('⑱' + m))){
    const { ctx, page } = await openMain('⑱' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const th = await makeThumbDataUri(__jpeg(1600, 1200, 0.85, 81), PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const pl = { chosho_mgmt_no: NO, chosho_cust_name: '試験', chosho_status: 'completed', work_type: 'uhf_new',
                   chosho_photos: [{ label: '写真1', dataUri: th, id: 'T1' }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      if(mode === 'a') pl.amplifier = 'amp_3u43';
      await __openProj(__proj178('pj178r' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload: pl }]));
      const row = _listRows[0];
      const before = cdlPhotoText({ row, printable: true, locked: false });
      await openCaseInEditor(row);
      syncEditorToRowData(true);
      await projSaveNow();
      const after = cdlPhotoText({ row, printable: true, locked: false });
      // 元の写真を持つ行（印は残っている）
      const big = { chosho_mgmt_no: NO, chosho_photos: [{ label: '写真2', dataUri: __jpeg(900, 700, 0.85, 82), id: 'B1' }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      const orig = cdlPhotoText({ row: { fileType: 'plain', data: big, _photoCount: 1 }, printable: true, locked: false });
      return { before: before.t, after: after.t, afterWarn: after.warn, orig: orig.t, origWarn: orig.warn };
    }, { NO, PN, mode });
    console.log('⑱' + mode + '小さい写真の印', short(r));
    ok(!r.error, '⑱' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(/小さい写真/.test(r.before), '⑱' + mode + '試験の前提: 物件の縮小版の行は「小さい写真」 → ' + short(r));
      ok(/小さい写真/.test(r.after) && r.afterWarn, '★⑱' + mode + '開いて保存すると「小さい写真」の知らせが消える → ' + short(r));
      ok(!/小さい写真/.test(r.orig) && !r.origWarn, '★⑱' + mode + '元の写真を持つ行を「小さい写真」と言う → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑲ 共有ファイルとまとめたあと、もう一度写真を足して保存しても、物件にしか無い写真を落とさない ----
  if(want('⑲')){
    const { ctx, page } = await openMain('⑲');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const G = __jpeg(900, 700, 0.85, 23); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openShared(__proj178('pj178s', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                   chosho_photos: [{ id: gid, label: '物件にしか無い', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      await openCaseInEditor(row);
      const s1 = __jpeg(900, 700, 0.85, 24); const e1 = await __addPhoto(s1, 'p1.jpg');
      __otherDeviceSaves(NO2);
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await __pressSave();
      const replaced = _listRows.indexOf(row) < 0;
      const s2 = __jpeg(900, 700, 0.85, 25); const e2 = await __addPhoto(s2, 'p2.jpg');
      await __pressSave();
      const tag = p => p.id === gid ? 'G' : (e1 && p.id === e1.id ? 'P1' : (e2 && p.id === e2.id ? 'P2' : '?'));
      const idb = await __idbPhotos('pj178s', NO);
      const nr = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const sh = JSON.parse(__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
      return { replaced, idb: idb.photos.map(tag).sort(), row: (nr.data.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort(),
               shared: ((sh && sh.payload.chosho_photos) || []).filter(p => p && p.dataUri).map(tag).sort(),
               file: (__photosOf(list.__files[NO + '.json'] || '{}') || []).map(tag).sort() };
    }, { NO, NO2, PN });
    console.log('⑲まとめたあとの2回目の保存', short(r));
    ok(!r.error, '⑲止まった → ' + r.error);
    if(!r.error){
      ok(r.replaced, '⑲試験の前提: 保存で共有ファイルとまとめ、行が作り直される → ' + short(r));
      ok(r.row.join() === 'G,P1,P2' && r.idb.join() === 'G,P1,P2' && r.shared.join() === 'G,P1,P2' && r.file.join() === 'G,P1,P2',
         '★⑲まとめたあとの保存で、物件にしか無い写真が消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑳ フォルダから読んだ戸別（図面なし）を開いて写真を消し、物件に保存 → これまでどおり戸別ファイルからも消える ----
  //   （開くときにそのファイルを読んでいる＝画面の写真がファイルの写真。消したのは利用者の意思）
  if(want('⑳')){
    const { ctx, page } = await openMain('⑳');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178t', PN, []));
      const K = __jpeg(900, 700, 0.85, 91), X = __jpeg(900, 700, 0.85, 92);
      const obj = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                    chosho_photos: [{ id: 'k1', label: 'K', dataUri: K }, { id: 'x1', label: 'X', dataUri: X }] };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(obj, null, 2) });
      _projDirHandle = list;
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      slimListRow(row, true);
      _listRows = [row];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',');
      STATE.photos = (STATE.photos || []).filter(p => !(p && p.id === 'x1'));
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      const btn = await __pressSave();
      return { shown, btn, file: __pids(list.__files[NO + '.json']) };
    }, { NO, PN });
    console.log('⑳フォルダから読んだ戸別で写真を消す', short(r));
    ok(!r.error, '⑳止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 'k1,x1' && r.btn.pressed, '⑳試験の前提: 開くとファイルの写真が画面に出て、物件に保存できる → ' + short(r));
      ok(r.file === 'k1', '★⑳フォルダから読んで開いた戸別で消した写真が、戸別ファイルに戻ってくる（利用者が消したのに） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉑ 「💾 戸別ファイルへ反映」でファイルが付いた行は、付いているファイルへ書く ----
  //   （物件の覚えている名前で探して、同じ管理番号のファイルをもう1つ作り、そこへ縮小版を書いていた）
  //   a) 台帳で作った行（図面あり）　b) 台帳で作った行（図面なし）　c) ファイルを「リスト/完了」へ移してあった
  //   d) Android の名前（管理番号_数字.json）→ 管理番号.json にそろえる（古い名前は写真がみな移ったので消す）・もう一度保存しても同じファイル
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㉑' + m))){
    const { ctx, page, said } = await openMain('㉑' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 101); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 102); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const pl = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      if(mode === 'a' || mode === 'c') pl.amplifier = 'amp_3u43';            // 図面あり
      let file = 'リスト/' + NO + '.json';                                   // 物件の覚えている名前
      if(mode === 'a' || mode === 'b'){ Object.assign(pl, { _manual: true, _origin: 'manual' }); file = 'manual:m178u' + mode; }
      await __openProj(__proj178('pj178u' + mode, PN, [{ caseId: 'c1', file, lastModified: 0, payload: pl }]));
      const row = _listRows[0];
      // 現場入力が書いた戸別ファイル（G は原寸・K はファイルにしか無い）
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const fname = (mode === 'd') ? NO + '_1700000000.json' : NO + '.json';
      const done = __mk('完了', (mode === 'c') ? { [fname]: txt } : {});
      const list = __mk('リスト', (mode === 'c') ? {} : { [fname]: txt }, (mode === 'c') ? { '完了': done } : {});
      const root = __mk('その１', {}, { 'リスト': list });
      const at = (mode === 'c') ? done : list;                                 // ファイルの置き場所
      window.showDirectoryPicker = async () => root;                           // 保存のときにフォルダを聞かれたら、この工事フォルダを選ぶ
      const before = __tree(root);
      const res = await lgwbAttachFrom(root, false);                           // 💾 戸別ファイルへ反映 の結び付け（管理番号で探す）
      const o = { hit: res.hit, attached: !!(row._dir === at && row._name === fname && row.fileHandle),
                  fromProject: !!row._fromProject, manual: !!row._manual, file: row.file };
      await openCaseInEditor(row);
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      __setTel('090-2222-3333');
      o.btn = await __pressSave();
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? (p.dataUri === K ? 'K' : 'K?') : '?');
      const nf = (mode === 'd') ? NO + '.json' : fname;                       // 書いたあとの名前
      const j = JSON.parse(at.__files[nf] || '{}');
      Object.assign(o, { before, after: __tree(root), tel: j.chosho_cust_tel, photos: (__photosOf(j) || []).map(tag),
                         removed: at.__removed.slice(), thumbAnywhere: __allPhotos(root).some(p => p.dataUri === Gt) });
      if(mode === 'd'){
        // もう一度直して保存 → 新しい名前（管理番号.json）へ書く。古い名前を作り直さない
        o.rowNow = { name: row._name, file: row.file };
        const w0 = at.__writes.length;
        __setTel('090-4444-5555');
        o.btn2 = await __pressSave();
        const j2 = JSON.parse(at.__files[nf] || '{}');
        o.second = { tree: __tree(root), tel: j2.chosho_cust_tel, photos: (__photosOf(j2) || []).map(tag),
                     writes: at.__writes.slice(w0).map(w => w.n), removed: at.__removed.slice(),
                     thumbAnywhere: __allPhotos(root).some(p => p.dataUri === Gt) };
      }
      return o;
    }, { NO, PN, mode });
    const a21 = alerts(said);
    console.log('㉑' + mode + '反映で付いたファイルへ書く', short(r), short(a21.map(m => m.slice(0, 90))));
    ok(!r.error, '㉑' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.hit >= 1 && r.attached && r.fromProject && r.btn.pressed && /物件に保存/.test(r.btn.text),
         '㉑' + mode + '試験の前提: 反映の結び付けで物件の行にファイルが付き、開いて「物件に保存」できる → ' + short(r));
      if(mode === 'd'){
        ok(r.after.join() === 'リスト/' + NO + '.json' && r.removed.join() === NO + '_1700000000.json',
           '★㉑d管理番号.json にそろえていない・古い名前のファイルを消していない（写真はみな移っている）・別の場所にファイルを作った → ' + short(r));
      } else {
        ok(r.after.join() === r.before.join(), '★㉑' + mode + '付いているファイルがあるのに、同じ管理番号のファイルをもう1つ作った → ' + short(r.before) + ' → ' + short(r.after));
        ok(r.removed.length === 0, '★㉑' + mode + 'ファイルを消した → ' + short(r.removed));
      }
      ok(r.tel === '090-2222-3333', '★㉑' + mode + '付いているファイルに直しが入っていない → ' + short(r));
      ok(r.photos.join() === 'G原寸,K', '★㉑' + mode + '付いているファイルの写真が G（原寸）と K のままではない → ' + short(r.photos));
      ok(!r.thumbAnywhere, '★㉑' + mode + 'フォルダのどこかに縮小版（長辺512px）が書かれた → ' + short(r));
      ok(!a21.some(m => /書き替えていません/.test(m)) && a21.some(m => /戸別の個別JSONも更新しました/.test(m)),
         '★㉑' + mode + '戸別ファイルを書いたと知らせない・書かなかった → ' + short(a21.slice(-1)));
      if(mode === 'd'){
        const s = r.second || {};
        ok(r.rowNow && r.rowNow.name === NO + '.json' && r.rowNow.file === 'リスト/' + NO + '.json',
           '★㉑d書いたあと、行が新しい名前（管理番号.json）を指していない → ' + short(r.rowNow));
        ok(s.tree && s.tree.join() === 'リスト/' + NO + '.json' && s.writes.length >= 1 && s.writes.every(n => n === NO + '.json')
           && s.removed.join() === NO + '_1700000000.json',
           '★㉑d2回目の保存で、新しい名前のファイルへ書いていない・ファイルを作り直した → ' + short(s));
        ok(s.tel === '090-4444-5555' && s.photos && s.photos.join() === 'G原寸,K' && !s.thumbAnywhere,
           '★㉑d2回目の保存で、直しが入らない・写真が G（原寸）と K のままではない → ' + short(s));
      }
    }
    await ctx.close();
  }

  // ---- ㉒ 名前の大文字・小文字を区別しないフォルダ（Windows・Mac）：小文字の名前の戸別ファイル → そのファイルへ書く ----
  //   作り物のフォルダは Chromium と同じ：ファイルを引く・読む・消すときは大文字・小文字を区別しないが、
  //   isSameEntry は渡した名前の文字どおりに比べる（2612MKM077.json と 2612mkm077.json は「別のもの」と答える）。
  //   a) 物件の行は G だけ知っている（K は現場があとで足した）→ 前は「同じ管理番号のファイルが2つ」と断っていた
  //   b) 物件の行は G・K を知っている → 前は大文字の名前で書いたあと、小文字の名前を「古い名前」として消していた（同じファイル＝写真ごと無くなる）
  for(const mode of ['a', 'b'].filter(m => want('㉒' + m))){
    const { ctx, page, said } = await openMain('㉒' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 111); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 112); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const Kt = await makeThumbDataUri(K, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const low = NO.toLowerCase() + '.json';                                 // 2612mkm077.json
      const thumbs = [{ id: gid, label: 'G', dataUri: Gt }].concat(mode === 'b' ? [{ id: kid, label: 'K', dataUri: Kt }] : []);
      await __openProj(__proj178('pj178w' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + low, lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: thumbs, chosho_photos_thumb: true, chosho_photo_count: thumbs.length } }]));
      const text0 = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const list = __mk('リスト', { [low]: text0 }, {}, { ci: true });
      const root = __mk('その１', {}, { 'リスト': list }, { ci: true });
      window.showDirectoryPicker = async () => root;
      const up = await list.getFileHandle(NO + '.json'), lo = await list.getFileHandle(low);
      const pre = { sameText: (await (await up.getFile()).text()) === text0,          // 大文字の名前でも同じファイルが開ける
                    sameEntry: await up.isSameEntry(lo) };                              // Chromium どおり「別のもの」と答える
      const row = _listRows[0];
      await openCaseInEditor(row);
      __setTel('090-2222-3333');
      const btn = await __pressSave();
      const j = JSON.parse(list.__files[low] || '{}');
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? (p.dataUri === K ? 'K' : 'K縮') : '?');
      return { pre, btn, names: Object.keys(list.__files), tel: j.chosho_cust_tel, photos: (__photosOf(j) || []).map(tag),
               removed: list.__removed.slice(), writes: list.__writes.map(w => w.n), rowFile: row.file, tree: __tree(root) };
    }, { NO, PN, mode });
    const a22 = alerts(said);
    console.log('㉒' + mode + '大文字・小文字を区別しないフォルダ', short(r), short(a22.map(m => m.slice(0, 160))));
    ok(!r.error, '㉒' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.pre.sameText && r.pre.sameEntry === false && r.btn.pressed,
         '㉒' + mode + '試験の前提: 大文字の名前でも同じファイルが開ける・isSameEntry は「別のもの」と答える（Chromium どおり）・物件に保存できる → ' + short(r));
      ok(r.names.join() === NO.toLowerCase() + '.json' && r.removed.length === 0 && r.tree.length === 1,
         '★㉒' + mode + '同じファイル（名前の大文字・小文字が違うだけ）を消した・もう1つ作った → ' + short(r));
      ok(r.tel === '090-2222-3333' && r.photos.join() === 'G原寸,K',
         '★㉒' + mode + '小文字の名前の戸別ファイルへ書かない・写真が G（原寸）と K のままではない → ' + short(r));
      ok(!a22.some(m => /書き替えていません/.test(m)), '★㉒' + mode + '同じファイルなのに「書き替えていません」と断った → ' + short(a22.slice(-1)));
      ok(a22.some(m => /戸別の個別JSONも更新しました/.test(m)) && !a22.some(m => /統一|新名|旧 /.test(m)) && r.rowFile === 'リスト/' + NO.toLowerCase() + '.json',
         '★㉒' + mode + '同じファイルなのに「古い名前」として扱った（名前をそろえた・旧を残したと知らせる・行の名前を替えた） → ' + short(r.rowFile) + ' ' + short(a22.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㉓ 開いたあとで現場入力が戸別ファイルに足した写真を、保存で消さない（画面で消した写真だけを消す） ----
  //   a) 物件・フォルダの行（図面なし）→ 物件に保存　b) 物件なし・フォルダの行（図面あり）→ 💾 上書き保存
  //   c) 物件・フォルダの行（図面あり）を直して一覧へ戻る → 協力会社諸経費のそろえ直しで書く
  //   d) 図面なしで写真を足して物件に保存 → 現場が足した → 開き直して 💾 上書き保存
  //   e) 画面で消した写真は、これまでどおり 💾 上書き保存 で消える
  //   f) 一度開いて戻った行を開き直す → 写真を足して 💾 上書き保存 → その写真を消して 💾 上書き保存 → 消える
  //   g) 写真の無かった 📁 の行に 📮 振り分けで現場の写真が入った（行が写真を持つ・まだ開いていない）→ 開いて1枚消して 💾 上書き保存 → 消える
  for(const mode of ['a', 'b', 'c', 'd', 'e', 'f', 'g'].filter(m => want('㉓' + m))){
    const { ctx, page, said } = await openMain('㉓' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const g1 = __jpeg(900, 700, 0.85, 121), K = __jpeg(900, 700, 0.85, 122), x1 = __jpeg(900, 700, 0.85, 123);
      const G2 = __jpeg(900, 700, 0.85, 124), P = __jpeg(900, 700, 0.85, 125);
      const proj = (mode === 'a' || mode === 'c' || mode === 'd');
      const drawing = (mode !== 'a' && mode !== 'd');
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(drawing) base.amplifier = 'amp_3u43';
      const photos0 = (mode === 'g') ? undefined                                // g) 📁 で読んだときは写真が無かった
        : [{ id: 'g1', label: 'g1', dataUri: g1 }].concat(mode === 'e' ? [{ id: 'x1', label: 'x1', dataUri: x1 }] : []);
      if(proj) await __openProj(__proj178('pj178v' + mode, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: photos0 }), null, 2) });
      if(proj) _projDirHandle = list;                                          // 工事フォルダとつながっている
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行（写真は常駐させない）
      slimListRow(row, true);
      _listRows = [row];
      window.confirm = () => true;                                              // 「元ファイルに上書き保存します」→ はい
      // 現場入力が、いまのファイルに写真を足して保存した
      const fieldAdds = add => {
        const j = JSON.parse(list.__files[NO + '.json']);
        j.chosho_photos = (j.chosho_photos || []).concat([add]);
        list.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      };
      const ids = () => { const j = JSON.parse(list.__files[NO + '.json']);
        return (__photosOf(j) || []).map(p => (p.dataUri === P) ? 'P' : p.id).sort().join(','); };
      const shownIds = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => (p.dataUri === P) ? 'P' : p.id).sort().join(',');
      const o = {};
      if(mode === 'a'){
        await openCaseInEditor(row);                                            // 図面なし：開くときにファイルを読む（g1）
        o.shown = shownIds();
        fieldAdds({ id: 'K', label: 'K', dataUri: K });
        __setTel('090-2222-3333');
        o.btn = await __pressSave();                                            // 💾 物件に保存
      } else if(mode === 'b' || mode === 'e'){
        await listLoadRow(row);                                                 // 📁 で読んだ戸別を開く（図面あり）
        o.shown = shownIds();
        o.btnText = document.getElementById('btn-save-overwrite').textContent;
        if(mode === 'b') fieldAdds({ id: 'K', label: 'K', dataUri: K });
        else {
          STATE.photos = (STATE.photos || []).filter(p => !(p && p.id === 'x1'));   // 画面で x1 を消す
          try { renderPhotoInputs(); } catch(_){}
          try { markEditorDirty(); } catch(_){}
        }
        __setTel('090-2222-3333');
        await overwriteSaveCurrent();                                           // 💾 上書き保存
      } else if(mode === 'c'){
        await openCaseInEditor(row);
        o.shown = shownIds();
        __setTel('090-2222-3333');
        openListView();                                                         // 一覧へ戻る（行へ取り込む）
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        o.rowHeld = { slim: !!row._slim, ids: ((row.data && row.data.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id).join(',') };
        fieldAdds({ id: 'K', label: 'K', dataUri: K });
        o.note = String(await _genbaWriteRowIndividual(row) || '').slice(0, 80);   // 協力会社諸経費のそろえ直しと同じ書き方
      } else if(mode === 'd'){
        await openCaseInEditor(row);                                            // 図面なし
        o.shown = shownIds();
        await __addPhoto(P, 'p.jpg');
        o.btn = await __pressSave();                                            // 💾 物件に保存（g1・P）
        o.first = ids();
        fieldAdds({ id: 'G2', label: 'G2', dataUri: G2 });
        await openCaseInEditor(row);                                            // 開き直す（もう図面がある）
        o.shown2 = shownIds();
        __setTel('090-2222-3333');
        o.btn2 = await __pressSave();                                           // 💾 上書き保存
      } else if(mode === 'f'){
        await listLoadRow(row);
        __setTel('090-2222-3333');
        openListView();                                                         // 一覧へ戻る（行が写真を持つ）
        o.rowHeld = { slim: !!row._slim, ids: ((row.data && row.data.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id).join(',') };
        await listLoadRow(row);                                                 // 開き直す
        o.shown = shownIds();
        o.btnText = document.getElementById('btn-save-overwrite').textContent;
        await __addPhoto(P, 'p.jpg');
        await overwriteSaveCurrent();
        o.first = ids();
        STATE.photos = (STATE.photos || []).filter(p => !(p && p.dataUri === P));   // 画面で P を消す
        try { renderPhotoInputs(); } catch(_){}
        try { markEditorDirty(); } catch(_){}
        await overwriteSaveCurrent();
      } else if(mode === 'g'){
        // 📮 預かりを振り分ける：現場の預けの写真（g1・x1）を戸別ファイルへ入れ、一覧の行にも同じ写真を持たせる（sideAdoptRow）
        fieldAdds({ id: 'g1', label: 'g1', dataUri: g1 }); fieldAdds({ id: 'x1', label: 'x1', dataUri: x1 });
        o.adopt = await sideAdoptRow(row, { m: { stamp: '20261016-090000', fh, no: NO, photos: 2, side: { touched: [] },
          S: { chosho_mgmt_no: NO, chosho_photos: [{ id: 'g1', label: 'g1', dataUri: g1 }, { id: 'x1', label: 'x1', dataUri: x1 }] } } });
        o.rowHeld = { slim: !!row._slim, ids: ((row.data && row.data.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id).join(','),
                      seen: row._photosSeen instanceof Set ? row._photosSeen.size : null };
        await listLoadRow(row);                                                 // 開く（行の写真を画面に出す）
        o.shown = shownIds();
        o.btnText = document.getElementById('btn-save-overwrite').textContent;
        STATE.photos = (STATE.photos || []).filter(p => !(p && p.id === 'x1'));   // 画面で x1 を消す
        try { renderPhotoInputs(); } catch(_){}
        try { markEditorDirty(); } catch(_){}
        __setTel('090-2222-3333');
        await overwriteSaveCurrent();
      }
      const j = JSON.parse(list.__files[NO + '.json']);
      return Object.assign(o, { file: ids(), tel: j.chosho_cust_tel, writes: list.__writes.length });
    }, { NO, PN, mode });
    const a23 = alerts(said);
    console.log('㉓' + mode + '開いたあとで現場が足した写真', short(r), short(a23.slice(-1).map(m => m.slice(0, 60))));
    ok(!r.error, '㉓' + mode + '止まった → ' + r.error);
    if(!r.error){
      const want23 = { a: 'K,g1', b: 'K,g1', c: 'K,g1', d: 'G2,P,g1', e: 'g1', f: 'g1', g: 'g1' }[mode];
      if(mode === 'a') ok(r.shown === 'g1' && r.btn.pressed && /物件に保存/.test(r.btn.text), '㉓a試験の前提: 開くとファイルの写真が出て、物件に保存できる → ' + short(r));
      if(mode === 'b' || mode === 'e') ok(r.shown === (mode === 'e' ? 'g1,x1' : 'g1') && /上書き保存/.test(r.btnText), '㉓' + mode + '試験の前提: 📁 で読んだ戸別を開くと、ファイルの写真が出て「💾 上書き保存」になる → ' + short(r));
      if(mode === 'c') ok(r.shown === 'g1' && !r.rowHeld.slim && r.rowHeld.ids === 'g1' && /戸別の個別JSONも更新しました/.test(r.note),
                          '㉓c試験の前提: 一覧へ戻ると行が写真を持ち、そろえ直しで戸別ファイルを書く → ' + short(r));
      if(mode === 'd') ok(r.shown === 'g1' && /物件に保存/.test(r.btn.text) && r.first === 'P,g1' && r.shown2 === 'P,g1' && /上書き保存/.test(r.btn2.text) && r.btn2.pressed,
                          '㉓d試験の前提: 物件に保存で g1・P が入り、開き直すと「💾 上書き保存」になる → ' + short(r));
      if(mode === 'f') ok(!r.rowHeld.slim && r.rowHeld.ids === 'g1' && r.shown === 'g1' && /上書き保存/.test(r.btnText) && r.first === 'P,g1',
                          '㉓f試験の前提: 戻ると行が写真を持ち、開き直して足した P が上書き保存で入る → ' + short(r));
      ok(r.tel === '090-2222-3333', '㉓' + mode + '試験の前提: 直しが戸別ファイルに入る → ' + short(r));
      if(mode === 'g') ok(r.adopt === true && !r.rowHeld.slim && r.rowHeld.ids === 'g1,x1' && r.rowHeld.seen === null && r.shown === 'g1,x1' && /上書き保存/.test(r.btnText),
                          '㉓g試験の前提: 振り分けで行が写真を持ち（まだ開いていない）、開くと写真が出て「💾 上書き保存」になる → ' + short(r));
      if(mode === 'e' || mode === 'f' || mode === 'g') ok(r.file === want23, '★㉓' + mode + '画面で消した写真が、戸別ファイルに残る（消えない） → ' + short(r));
      else ok(r.file === want23, '★㉓' + mode + '開いたあとで現場入力がファイルに足した写真が、保存で消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉔ 「小さい写真」の知らせ：自分のファイルから読んだ行の小さい写真（図など）は元の写真。物件の行の縮小版は今までどおり ----
  if(want('㉔')){
    const { ctx, page } = await openMain('㉔');
    const r = await run(page, async ({ NO, PN }) => {
      const small = __jpeg(480, 360, 0.85, 131), big = __jpeg(900, 700, 0.85, 132);
      // 📁 で読んだ行（物件から読んだ行ではない・写真を持っている）
      const row = buildListRow('リスト/' + NO + '.json', 1, { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
        chosho_photos: [{ id: 's1', label: '図', dataUri: small }, { id: 'b1', label: '写真', dataUri: big }] }, null);
      _listRows = [row];
      const t1 = cdlPhotoText({ row, printable: true, locked: false });
      const l1 = await loadRowPhotos(row);
      const folder = { t: t1.t, warn: t1.warn, thumb: l1.thumb, n: (l1.photos || []).length, smallEdge: await __edge(small) };
      // 物件の行（縮小版）を開いて直して戻る → 縮小版の印は外れるが、写真は縮小版のまま
      const G = __jpeg(900, 700, 0.85, 133);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178('pj178x', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: photoContentId(G), label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const prow = _listRows[0];
      await openCaseInEditor(prow);
      __setTel('090-2222-3333');
      openListView();
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      const t2 = cdlPhotoText({ row: prow, printable: true, locked: false });
      const l2 = await loadRowPhotos(prow);
      const proj = { flag: !!(prow.data && prow.data.chosho_photos_thumb), fromProject: !!prow._fromProject,
                     same: ((prow.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === Gt,
                     t: t2.t, warn: t2.warn, thumb: l2.thumb };
      return { folder, proj };
    }, { NO, PN });
    console.log('㉔小さい写真の知らせ', short(r));
    ok(!r.error, '㉔止まった → ' + r.error);
    if(!r.error){
      ok(r.folder.smallEdge === 480 && r.folder.n === 2, '㉔試験の前提: 長辺480pxの写真と大きい写真の2枚 → ' + short(r.folder));
      ok(r.folder.t === '2枚' && !r.folder.warn, '★㉔自分のファイルから読んだ行の小さい写真を「小さい写真」と言う → ' + short(r.folder));
      ok(r.folder.thumb === false, '★㉔自分のファイルから読んだ行の写真を、物件の縮小版として見せる → ' + short(r.folder));
      ok(!r.proj.flag && r.proj.fromProject && r.proj.same, '㉔試験の前提: 物件の行を開いて直して戻ると、縮小版の印は外れ、写真は縮小版のまま → ' + short(r.proj));
      ok(/小さい写真/.test(r.proj.t) && r.proj.warn, '★㉔物件の行の縮小版を「小さい写真」と言わなくなった（印が外れたあと） → ' + short(r.proj));
      ok(r.proj.thumb === true, '★㉔物件の行の縮小版を、縮小版として見せない（印が外れたあと） → ' + short(r.proj));
    }
    await ctx.close();
  }

  // ---- ㉕ 暗号の戸別（.hyb）：物件の行は写真を剥がした封筒を持つ。そのまま書くと戸別ファイルの写真が全部消える ----
  //   a) 元のファイル（同じ鍵）の暗号の写真を戻して書く　b) 元のファイルの鍵（salt）が違う → 書かない・知らせる
  for(const mode of ['a', 'b'].filter(m => want('㉕' + m))){
    const { ctx, page } = await openMain('㉕' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const ph = __jpeg(600, 450, 0.85, 141);
      const state = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                      chosho_photos: [{ id: 'h1', label: '写真1', dataUri: ph }] };
      const env = await encryptHybrid(state, 'pw1234');
      const fileEnv = (mode === 'b') ? await encryptHybrid(state, 'pw1234') : env;   // b) 暗号をかけ直した（鍵が違う）ファイル
      const fileText = JSON.stringify(fileEnv, null, 2);
      const list = __mk('リスト', { [NO + '.hyb']: fileText });
      const root = __mk('その１', {}, { 'リスト': list });
      // 物件の行は、写真を剥がした封筒（slimListRow と同じ形）
      const slim = Object.assign({}, env, { encrypted_fields: Object.assign({}, env.encrypted_fields, { chosho_photos: { stripped: true } }) });
      await __openProj(__proj178('pj178y' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.hyb', lastModified: 0, payload: slim }]));
      const row = _listRows[0];
      _projDirHandle = root;                                 // 工事フォルダとつながっている
      _editingRow = row;                                     // 協力会社諸経費のそろえ直しと同じ（画面に出ていない戸別を書く）
      const msg = String(await writeCurrentCaseToIndividualFile() || '');
      const now = list.__files[NO + '.hyb'];
      const o = { fileType: row.fileType, rowStripped: !!((row.envelope.encrypted_fields || {}).chosho_photos || {}).stripped,
                  saltDiff: fileEnv.salt !== env.salt, msg: msg.slice(0, 120), unchanged: now === fileText, writes: list.__writes.length };
      let j = null; try { j = JSON.parse(now); } catch(_){}
      const ep = j && j.encrypted_fields && j.encrypted_fields.chosho_photos;
      o.encPhotos = !!(ep && ep.iv && ep.ct);
      try { const dec = await decryptHybrid(j, 'pw1234');
            const ps = (dec.chosho_photos || []).filter(p => p && p.dataUri);
            o.dec = { n: ps.length, same: ps.length === 1 && ps[0].dataUri === ph, name: dec.chosho_cust_name, no: dec.chosho_mgmt_no }; }
      catch(e){ o.decErr = String((e && e.message) || e).slice(0, 80); }
      return o;
    }, { NO, PN, mode });
    console.log('㉕' + mode + '暗号の戸別', short(r));
    ok(!r.error, '㉕' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.fileType === 'hybrid' && r.rowStripped && r.saltDiff === (mode === 'b'), '㉕' + mode + '試験の前提: 物件の行は写真を剥がした暗号の封筒 → ' + short(r));
      if(mode === 'a'){
        ok(/戸別の個別JSONも更新しました/.test(r.msg) && r.writes >= 1, '㉕a試験の前提: 戸別ファイル（.hyb）を書く → ' + short(r));
        ok(r.encPhotos && r.dec && r.dec.n === 1 && r.dec.same && r.dec.name === '暗号 様',
           '★㉕a写真を剥がした封筒をそのまま書き、.hyb の写真が消えた → ' + short(r));
      } else {
        ok(r.unchanged && r.writes === 0, '★㉕b鍵の違う .hyb に、写真を剥がした封筒を書いた（写真が消える） → ' + short(r));
        ok(/書き替えていません/.test(r.msg), '★㉕b書かなかったことを知らせない → ' + short(r));
      }
    }
    await ctx.close();
  }

  // ---- ㉖ 物件の縮小版づくりが動いているあいだに次の保存が来たら、終わるのを待つ（縮小版の無い行を「写真なし」で物件に入れない） ----
  if(want('㉖')){
    const { ctx, page } = await openMain('㉖');
    const r = await run(page, async ({ PN }) => {
      const nos = ['2612MKM081', '2612MKM082', '2612MKM083'];
      await __openProj(__proj178('pj178z', PN, nos.map((no, i) => ({ caseId: 'c' + i, file: 'リスト/' + no + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: no, chosho_cust_name: '試験' + i + ' 様', chosho_status: 'in_progress', work_type: '',
                   chosho_photos: [{ id: 'q' + i, label: '写真', dataUri: __jpeg(900, 700, 0.85, 150 + i) }] } }))));
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      const targets = _listRows.filter(r => r.fileType === 'plain' && r._photoCount > 0 && !Array.isArray(r._thumbs));
      // 1回目の縮小版づくりを、1件目のところで止めておく（写真が多くて時間がかかっている）
      const orig = ensureRowThumbs;
      let release; const gate = new Promise(res => { release = res; });
      let first = true;
      ensureRowThumbs = async row => { if(first){ first = false; await gate; } return orig(row); };
      let done1 = false, done2 = false, snap = null;
      const p1 = prepareProjectThumbs(true).then(() => { done1 = true; });
      await new Promise(res => setTimeout(res, 50));
      // 次の保存（自動保存）：縮小版がそろってから物件の中身を作る
      const p2 = prepareProjectThumbs(true).then(() => { done2 = true; snap = buildProjectSnapshot({ id: 'pj178z', name: PN }); });
      await new Promise(res => setTimeout(res, 300));
      const early = { done1, done2 };
      release();
      await p1; await p2;
      ensureRowThumbs = orig;
      const bad = ((snap && snap.cases) || []).filter(c => c.payload && c.payload.chosho_photo_count > 0 && c.payload.chosho_photos == null)
        .map(c => c.payload.chosho_mgmt_no);
      return { n: targets.length, early, thumbs: targets.map(r => Array.isArray(r._thumbs) ? r._thumbs.length : -1),
               bad, snapN: snap ? snap.cases.length : -1 };
    }, { PN });
    console.log('㉖縮小版づくりが重なった', short(r));
    ok(!r.error, '㉖止まった → ' + r.error);
    if(!r.error){
      ok(r.n === 3 && r.snapN === 3, '㉖試験の前提: 写真のある行が3つ（縮小版はまだ無い） → ' + short(r));
      ok(r.early.done1 === false && r.early.done2 === false, '★㉖前の縮小版づくりが終わる前に、次の保存へ進んだ → ' + short(r.early));
      ok(r.thumbs.every(n => n === 1), '★㉖縮小版のできていない行が残った → ' + short(r.thumbs));
      ok(r.bad.length === 0, '★㉖縮小版のできていない行を「写真なし」で物件に入れた（枚数だけ残る） → ' + short(r.bad));
    }
    await ctx.close();
  }

  // ---- ⑫d 物件にだけ保存 → 別の欄を直す（縮小版の控えが消える）→ 保存しないまま物件を開き直す → 物件に保存でフォルダを選ぶ → 元の写真 ----
  if(want('⑫d')){
    const { ctx, page } = await openMain('⑫d');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178ld', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows[0];
      await openCaseInEditor(row);
      const src = __jpeg(900, 700, 0.85, 171);
      const ed = await __addPhoto(src, 'p.jpg');
      __abortPicker();
      await __pressSave();                                    // 物件にだけ保存（フォルダは選ばなかった）
      const idb = await __idbPhotos('pj178ld', NO);
      const o = { edSame: !!(ed && ed.dataUri === src), thumbs1: Array.isArray(row._thumbs), idbThumb: idb.thumb && idb.photos.length === 1 };
      __setTel('090-3333-4444');                              // 別の欄を直す
      syncEditorToRowData();                                  // 行へ取り込む（縮小版の控え _thumbs が消える）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }   // まだ保存していない
      o.thumbsCleared = !Array.isArray(row._thumbs);
      await applyProject(await projIdbGet('pj178ld'), { silent: true });          // 端末内の物件を開き直す
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      o.rebuilt = row2 !== row;
      o.row2Orig = ((row2.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src;
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row2);
      o.btn = await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      o.n = ph.length; o.same = ph.length === 1 && ph[0].dataUri === src; o.edge = ph.length ? await __edge(ph[0].dataUri) : 0;
      return o;
    }, { NO, PN });
    console.log('⑫d保存せずに開き直す', short(r));
    ok(!r.error, '⑫d止まった → ' + r.error);
    if(!r.error){
      ok(r.edSame && r.thumbs1 && r.idbThumb && r.thumbsCleared && r.rebuilt && r.btn.pressed,
         '⑫d試験の前提: 物件には縮小版・行の縮小版の控えが消えたあとに開き直す → ' + short(r));
      ok(r.row2Orig, '★⑫d開き直すと、行の元の写真が縮小版に替わる（縮小版の控えが無かったので） → ' + short(r));
      ok(r.n === 1 && r.same && r.edge > 512, '★⑫d開き直したあとの「物件に保存」で、戸別ファイルに縮小版が書かれた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑭d 物件の行（図面あり）を開いて直して戻った（縮小版の印が外れた）→ 💾 戸別ファイルへ反映 でファイルが付く → 開いて保存 → 原寸と K が残る ----
  if(want('⑭d')){
    const { ctx, page } = await openMain('⑭d');
    const r = await run(page, async ({ NO, PN }) => {
      const G = __jpeg(900, 700, 0.85, 181); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 182); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      await __openProj(__proj178('pj178nd', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: Object.assign({}, base, { chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 }) }]));
      const row = _listRows[0];
      await openCaseInEditor(row);
      __setTel('090-0000-0001');
      openListView();                                         // 一覧へ戻る（行へ取り込む＝縮小版の印が外れる）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      const o = { flag: !!row.data.chosho_photos_thumb, fromProject: !!row._fromProject };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { _origin: 'genba',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }), null, 2) });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      try { await listDirForget(); } catch(_){}
      _listDirHandle = null;
      listReloadFolder = async () => {};
      await lgwbButton();                                     // 💾 戸別ファイルへ反映（行にファイルが付く・電話を書き戻す）
      o.fh = !!row.fileHandle;
      await openCaseInEditor(row);
      __setTel('090-1111-2222');
      o.btn = await __pressSave();
      const j = JSON.parse(list.__files[NO + '.json']);
      o.tel = j.chosho_cust_tel;
      o.file = (__photosOf(j) || []).map(p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? 'K' : '?'));
      o.tree = __tree(root);
      return o;
    }, { NO, PN });
    console.log('⑭d印が外れた物件の行に反映', short(r));
    ok(!r.error, '⑭d止まった → ' + r.error);
    if(!r.error){
      ok(!r.flag && r.fromProject && r.fh && r.btn.pressed && r.tel === '090-1111-2222',
         '⑭d試験の前提: 縮小版の印が外れた物件の行にファイルが付き、開いて保存できる → ' + short(r));
      ok(r.file.join() === 'G原寸,K' && r.tree.join() === 'リスト/' + NO + '.json',
         '★⑭d縮小版の印が外れた物件の行を保存すると、原寸を縮小版で上書きする・ファイルにしか無い写真が消える → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑯c 同じ管理番号のファイルが2つ（NO.antenna.json と NO.json）・行の知らない写真が NO.json にある → 書かない・まとめ方を案内する ----
  if(want('⑯c')){
    const { ctx, page, said } = await openMain('⑯c');
    const r = await run(page, async ({ NO, PN }) => {
      const A = __jpeg(900, 700, 0.85, 191); const aid = photoContentId(A);
      const B = __jpeg(900, 700, 0.85, 192); const bid = photoContentId(B);
      const At = await makeThumbDataUri(A, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      await __openProj(__proj178('pj178pc', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.antenna.json', lastModified: 0,
        payload: Object.assign({}, base, { chosho_photos: [{ id: aid, label: 'A', dataUri: At }], chosho_photos_thumb: true, chosho_photo_count: 1 }) }]));
      const tA = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: aid, label: 'A', dataUri: A }] }), null, 2);
      const tB = JSON.stringify(Object.assign({}, base, { _origin: 'genba', chosho_photos: [{ id: bid, label: 'B', dataUri: B }] }), null, 2);
      const list = __mk('リスト', { [NO + '.antenna.json']: tA, [NO + '.json']: tB });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(_listRows[0]);
      __setTel('090-2222-3333');
      const btn = await __pressSave();
      return { btn, keptA: list.__files[NO + '.antenna.json'] === tA, keptB: list.__files[NO + '.json'] === tB,
               writes: list.__writes.length, removed: list.__removed.slice(), tree: __tree(root) };
    }, { NO, PN });
    const a = alerts(said);
    console.log('⑯c同じ管理番号のファイルが2つ', short(r), short(a.slice(-1).map(m => m.slice(m.indexOf('⚠'), m.indexOf('⚠') + 200))));
    ok(!r.error, '⑯c止まった → ' + r.error);
    if(!r.error){
      ok(r.btn.pressed, '⑯c試験の前提: 物件に保存できる → ' + short(r));
      ok(r.keptA && r.keptB && r.writes === 0 && r.removed.length === 0 && r.tree.length === 2,
         '★⑯c同じ管理番号のファイルが2つあるのに書いた・消した（行の知らない写真 B が消える） → ' + short(r));
      ok(a.some(m => /書き替えていません/.test(m) && /同じ管理番号のファイルが2つ/.test(m) && /重複をまとめる/.test(m)),
         '★⑯c同じ管理番号のファイルが2つあると知らせない・「🧩 重複をまとめる」を案内しない → ' + short(a.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ⑯d 管理番号の付け替え先にファイルがあるが、その写真を行がみな知っている → 両方の写真で書く・古いファイルを消す（断らない） ----
  // ---- ⑯e 同じ・行は物件の行で、付け替え先の写真の縮小版しか持っていない → 付け替え先には原寸を残す ----
  for(const mode of ['d', 'e'].filter(m => want('⑯' + m))){
    const { ctx, page, said } = await openMain('⑯' + mode);
    const r = await run(page, async ({ NO, NO2, PN, mode }) => {
      const G2 = __jpeg(900, 700, 0.85, 201); const g2 = photoContentId(G2);
      const G2t = await makeThumbDataUri(G2, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      let row;
      if(mode === 'd'){
        await __openProj(__proj178('pj178pd', PN, []));
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');   // 台帳で作った行
      } else {
        await __openProj(__proj178('pj178pe', PN, [{ caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: g2, label: '現場で撮った', dataUri: G2t }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
        row = _listRows[0];                                    // 物件の行（G2 の縮小版だけ）
      }
      const root = __mk('その１', { [NO2 + '.json']: JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '台帳 様', _origin: 'genba',
                        chosho_photos: [{ id: g2, label: '現場で撮った', dataUri: G2 }] }, null, 2) });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const P = __jpeg(900, 700, 0.85, 202);
      const eP = await __addPhoto(P, 'p.jpg');
      let eG = null;
      if(mode === 'd') eG = await __addPhoto(G2, 'g2.jpg');   // 現場の写真と同じもの（同じ写真ID・同じ中身）
      await __pressSave();                                   // NO.json を作る
      const tag = p => p.id === g2 ? (p.dataUri === G2 ? 'G2' : (p.dataUri === G2t ? 'G2縮' : 'G2?')) : (eP && p.id === eP.id ? (p.dataUri === P ? 'P' : 'P?') : '?');
      const first = (__photosOf(root.__files[NO + '.json'] || '{}') || []).map(tag).sort();
      __setField('chosho_mgmt_no', NO2);                     // 現場が使っている番号へ直す
      await __pressSave();
      const ph = __photosOf(root.__files[NO2 + '.json'] || '{}') || [];
      return { eG: eG ? (eG.id === g2 && eG.dataUri === G2) : null, first, ids: ph.map(tag).sort(), removed: root.__removed.slice(),
               keptOld: (NO + '.json') in root.__files, tree: __tree(root) };
    }, { NO, NO2, PN, mode });
    const a = alerts(said);
    console.log('⑯' + mode + '付け替え先の写真を行が知っている', short(r), short(a.slice(-1).map(m => m.slice(0, 160))));
    ok(!r.error, '⑯' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.first.join() === (mode === 'd' ? 'G2,P' : 'G2縮,P') && (mode !== 'd' || r.eG === true),
         '⑯' + mode + '試験の前提: 1回目の保存で NO.json ができる（G2 は現場の写真と同じ写真ID） → ' + short(r));
      ok(r.ids.indexOf('G2') >= 0 && r.ids.indexOf('G2縮') < 0 && r.ids.indexOf('G2?') < 0,
         '★⑯' + mode + '付け替え先の現場の写真（原寸）が無くなった・縮小版に置き換わった → ' + short(r));
      ok(r.ids.join() === 'G2,P' && r.removed.join() === NO + '.json' && !r.keptOld && r.tree.join() === NO2 + '.json',
         '★⑯' + mode + '付け替え先の写真を行がみな知っているのに、書かずに断った・古いファイルを残した → ' + short(r));
      ok(!a.some(m => /書き替えていません/.test(m)), '★⑯' + mode + '断る必要が無いのに「書き替えていません」と知らせた → ' + short(a.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ⑯f 管理番号を打ち間違えて、ほかのお宅の番号（写真のまだ無い 管理番号.json がある）にして保存 → 書かない・どちらのファイルも元のまま ----
  //   （前は付け替え先に「行の知らない写真」が無いだけで、ほかのお宅のファイルに このお宅の中身を書き、元のファイルも消していた）
  //   （4回目の見直しから）写真の無い・名前の違うファイルのときは、同じお宅か聞く（両方の名前・住所を見せる）。キャンセル → 書かない
  // ---- ⑯g 同じ・付け替え先のファイルに写真が無く、お客様の名前が同じ（空白・「様」の違いは同じと見る）→ 聞かずにそのファイルへ書く ----
  //   古いファイルは、その写真（あとで現場が足した K も）がみな新しいファイルに入ってから消す
  // ---- ⑯h ⑯f と同じ（写真の無い・名前の違うファイル）。聞かれて「キャンセル」→ 書かない → もう一度押して「OK」（同じお宅）→ そのファイルへ書く ----
  //   書いたファイルには この戸別の写真 P と直した電話が入り、古いファイルは写真が移ってから消す（「統一」と知らせる）
  //   a) 受付台帳で作った行　b) 物件の行
  for(const sc of ['⑯fa', '⑯fb', '⑯ga', '⑯gb', '⑯ha', '⑯hb'].filter(want)){
    const { ctx, page, said } = await openMain(sc);
    const kind = sc.charAt(1), mode = sc.charAt(2);
    const r = await run(page, async ({ NO, NO2, PN, kind, mode }) => {
      const nm = '山田 太郎 様', addr = '本町1-1';
      let row;
      if(mode === 'a'){
        await __openProj(__proj178('pj178p' + kind + mode, PN, []));
        row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: nm, chosho_cust_addr: addr }, 'manual');
      } else {
        await __openProj(__proj178('pj178p' + kind + mode, PN, [{ caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: nm, chosho_cust_addr: addr, chosho_status: 'in_progress', work_type: '' } }]));
        row = _listRows[0];
      }
      // 付け替え先のファイル（写真はまだ無い）
      const tgt = (kind !== 'g')
        ? { chosho_mgmt_no: NO2, chosho_cust_name: '鈴木 様', chosho_cust_addr: '川町9-9', chosho_cust_tel: '090-7777-8888',   // 名前も住所も違う：現場が工事完了・電話・測定を入れた
            _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43', chosho_status: 'done', meas_note: '鈴木様の測定値' }
        : { chosho_mgmt_no: NO2, chosho_cust_name: '山田　太郎様', _origin: 'genba', work_type: 'uhf_new' };                  // 同じお宅（全角の空白・「様」が続く）
      const tgtText = JSON.stringify(tgt, null, 2);
      const root = __mk('その１', { [NO2 + '.json']: tgtText });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const P = __jpeg(900, 700, 0.85, 211);
      await __addPhoto(P, 'p.jpg');
      const K = __jpeg(900, 700, 0.85, 212);
      const tag = p => p.dataUri === P ? 'P' : (p.dataUri === K ? 'K' : '?');
      const o = { b1: await __pressSave() };                 // NO.json を作る
      o.first = (__photosOf(root.__files[NO + '.json'] || '{}') || []).map(tag).join();
      if(kind === 'g'){                                      // 現場入力が NO.json に写真 K を足した（行はまだ知らない）
        const j = JSON.parse(root.__files[NO + '.json']);
        j.chosho_photos = (j.chosho_photos || []).concat([{ id: 'K', label: 'K', dataUri: K }]);
        root.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      }
      const oldText = root.__files[NO + '.json'];
      const w0 = root.__writes.length;
      __setField('chosho_mgmt_no', NO2);                     // NO2 に直す（f・h＝名前の違うファイルの番号　g＝同じお宅の番号）
      if(kind === 'h') __setTel('090-1212-3434');            // h) 電話も直す（書いたファイルに入るか見る）
      // 「同じお宅のファイルですか？」の問い：f・h（1回目）はキャンセル、h（2回目）は OK。g は聞かれないはず（聞かれたら OK）
      const asked = [];
      let answer = (kind === 'g');
      window.confirm = m => { asked.push(String(m)); return /同じお宅/.test(String(m)) ? answer : true; };
      o.b2 = await __pressSave();
      o.asked = asked.slice();
      if(kind === 'h'){
        // キャンセルした直後：どちらのファイルも元のまま
        o.cancel = { writes: root.__writes.slice(w0).map(w => w.n), removed: root.__removed.slice(), oldSame: root.__files[NO + '.json'] === oldText,
                     tgtSame: root.__files[NO2 + '.json'] === tgtText, tree: __tree(root) };
        answer = true; asked.length = 0;
        o.b3 = await __pressSave();                          // もう一度押して「OK」（同じお宅）
        o.asked3 = asked.slice();
      }
      const t2 = root.__files[NO2 + '.json'];
      let j2 = {}; try { j2 = JSON.parse(t2 || '{}'); } catch(_){}
      return Object.assign(o, { tree: __tree(root), removed: root.__removed.slice(), writes: root.__writes.slice(w0).map(w => w.n),
               oldSame: root.__files[NO + '.json'] === oldText, tgtSame: t2 === tgtText,
               tgt: { no: j2.chosho_mgmt_no, name: j2.chosho_cust_name, tel: j2.chosho_cust_tel, photos: (__photosOf(j2) || []).map(tag).sort().join() } });
    }, { NO, NO2, PN, kind, mode });
    const a = alerts(said);
    console.log(sc + '番号の付け替え先（写真の無いファイル）', short(Object.assign({}, r, { asked: (r.asked || []).map(m => m.slice(0, 80)), asked3: (r.asked3 || []).map(m => m.slice(0, 80)) })),
                short(a.slice(-2).map(m => m.slice(0, 200))));
    ok(!r.error, sc + '止まった → ' + r.error);
    if(!r.error){
      ok(r.b1.pressed && r.b2.pressed && r.first === 'P', sc + '試験の前提: 1回目の保存で NO.json（写真 P）ができ、番号を直して保存できる → ' + short(r));
      const sameQ = arr => (arr || []).filter(m => /同じお宅/.test(m));
      if(kind === 'f' || kind === 'h'){
        const q = sameQ(r.asked);
        ok(r.asked.length === 1 && q.length === 1 && /鈴木 様/.test(q[0]) && /山田 太郎 様/.test(q[0]) && /川町9-9/.test(q[0]) && /本町1-1/.test(q[0]),
           '★' + sc + '名前の違う写真なしのファイルへ書く前に、同じお宅か（両方の名前・住所を見せて）1回だけ聞いていない → ' + short(r.asked.map(m => m.slice(0, 300))));
        const c = (kind === 'h') ? r.cancel : r;
        ok(c.writes.length === 0 && c.removed.length === 0 && c.oldSame && c.tgtSame && c.tree.join() === [NO + '.json', NO2 + '.json'].join(),
           '★' + sc + '「キャンセル」なのに、ほかのお宅かもしれないファイルに このお宅の中身を書いた・元のファイルを消した → ' + short(c));
        const m0 = (kind === 'h') ? a[a.length - 2] : a[a.length - 1];
        ok(/書き替えていません/.test(m0 || '') && /管理番号を確かめ/.test(m0 || '') && !/📥 現場取込/.test(m0 || ''),
           '★' + sc + 'キャンセルで書かなかったことを知らせない・番号を確かめるよう言わない・（取り込んでも変わらない）📥 現場取込を案内した → ' + short(m0));
      }
      if(kind === 'h'){
        const q3 = sameQ(r.asked3);
        ok(r.b3 && r.b3.pressed && q3.length === 1, sc + '試験の前提: もう一度押すと、また同じお宅か聞かれる → ' + short(r.asked3));
        ok(r.tree.join() === NO2 + '.json' && r.removed.join() === NO + '.json' && r.tgt.no === NO2 && r.tgt.name === '山田 太郎 様'
           && r.tgt.tel === '090-1212-3434' && r.tgt.photos === 'P',
           '★' + sc + '「OK」（同じお宅）なのに そのファイルへ書かない・写真 P／直した電話が入らない・古いファイルが残った → ' + short(r));
        ok(/戸別の個別JSONも更新しました/.test(a[a.length - 1] || '') && /統一/.test(a[a.length - 1] || '') && !/書き替えていません/.test(a[a.length - 1] || ''),
           '★' + sc + '「OK」で書いたのに、1つにまとめた（統一）と知らせない → ' + short(a.slice(-1)));
      } else if(kind === 'g'){
        ok(r.asked.length === 0, '★' + sc + '名前が同じお宅のファイルなのに、同じお宅か聞いた → ' + short(r.asked.map(m => m.slice(0, 200))));
        ok(r.tree.join() === NO2 + '.json' && r.removed.join() === NO + '.json' && r.tgt.no === NO2 && r.tgt.photos === 'K,P',
           '★' + sc + '同じお宅（名前が同じ・写真の無い）ファイルへ書かない・古いファイルの写真（P・現場の K）が移っていない・古いファイルが残った → ' + short(r));
        ok(!a.some(m => /書き替えていません/.test(m)) && a.some(m => /戸別の個別JSONも更新しました/.test(m) && /統一/.test(m)),
           '★' + sc + '同じお宅のファイルなのに書かずに断った → ' + short(a.slice(-1)));
      }
    }
    await ctx.close();
  }

  // ---- ㉕c 暗号の戸別（.hyb）を開いて 💾 上書き保存（暗号をかけ直す＝鍵の元 salt が新しくなる）→ そのあと そろえ直しで戸別ファイルへ書く ----
  //   （前は行の封筒が古い鍵のままで、そのあと戸別ファイルへ書くたびに「もとのファイルを読めませんでした」と断っていた）
  if(want('㉕c')){
    const { ctx, page, said } = await openMain('㉕c');
    const r = await run(page, async ({ NO, PN }) => {
      const ph = __jpeg(600, 450, 0.85, 142);
      const state = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                      chosho_photos: [{ id: 'h1', label: '写真1', dataUri: ph }] };
      const env = await encryptHybrid(state, 'pw1234');
      const list = __mk('リスト', { [NO + '.hyb']: JSON.stringify(env, null, 2) });
      const root = __mk('その１', {}, { 'リスト': list });
      await __openProj(__proj178('pj178yc', PN, []));
      const fh = await list.getFileHandle(NO + '.hyb');
      const row = buildListRow('リスト/' + NO + '.hyb', 1, JSON.parse(list.__files[NO + '.hyb']), fh);   // 📁 で読んだ行（写真を剥がした封筒）
      row._dir = list; row._name = NO + '.hyb'; row._dirPath = 'リスト/';
      slimListRow(row, true);
      // 🔓 まとめて復号したのと同じ（パスワードを覚え、行は名前などがほどけている。写真は常駐させない）
      row.data = Object.assign({}, await decryptHybrid(env, 'pw1234'), { chosho_photos: null }); row.unlocked = true; row._slim = true;
      _listRows = [row]; _projDirHandle = root;
      window.showDirectoryPicker = async () => root;
      try { setSessionPassword('pw1234'); } catch(_){ _sessionPassword = 'pw1234'; }
      const o = { fileType: row.fileType, stripped: !!(((row.envelope || {}).encrypted_fields || {}).chosho_photos || {}).stripped };
      await openCaseInEditor(row);
      o.btn = document.getElementById('btn-save-overwrite').textContent;
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      __setTel('090-1111-2222');
      await overwriteSaveCurrent();                                   // 💾 上書き保存（暗号をかけ直す）
      const f1 = JSON.parse(list.__files[NO + '.hyb']);
      o.saltChanged = f1.salt !== env.salt;
      openListView();                                                  // 一覧へ戻る
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      const w0 = list.__writes.length;
      o.note = String(await _genbaWriteRowIndividual(row) || '').slice(0, 200);   // 協力会社諸経費のそろえ直しと同じ書き方
      o.writes = list.__writes.length - w0;
      try { const dec = await decryptHybrid(JSON.parse(list.__files[NO + '.hyb']), 'pw1234');
            const ps = (dec.chosho_photos || []).filter(p => p && p.dataUri);
            o.dec = { n: ps.length, same: ps.length === 1 && ps[0].dataUri === ph, tel: dec.chosho_cust_tel, name: dec.chosho_cust_name }; }
      catch(e){ o.decErr = String((e && e.message) || e).slice(0, 80); }
      return o;
    }, { NO, PN });
    console.log('㉕c暗号の戸別を上書き保存したあと', short(r));
    ok(!r.error, '㉕c止まった → ' + r.error);
    if(!r.error){
      ok(r.fileType === 'hybrid' && r.stripped && r.shown === 1 && /上書き保存/.test(r.btn) && r.saltChanged,
         '㉕c試験の前提: 写真を剥がした封筒の行を開き、💾 上書き保存で鍵の元（salt）が新しくなる → ' + short(r));
      ok(r.writes >= 1 && /戸別の個別JSONも更新しました/.test(r.note) && !/書き替えていません/.test(r.note),
         '★㉕c💾 上書き保存のあと、戸別ファイル（.hyb）へ書かずに断った（行の封筒が古い鍵のまま） → ' + short(r));
      ok(r.dec && r.dec.n === 1 && r.dec.same && r.dec.name === '暗号 様' && r.dec.tel === '090-1111-2222',
         '★㉕c書いた .hyb がほどけない・写真が消えた・直しが消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊸ 付いているファイル（💾 戸別ファイルへ反映 で付けた）が、ほかのPCの整理で動いた・名前が変わった ----
  //   a) ほかのPCの「🧩 重複をまとめる」で Android の名前（管理番号_数字.json）が消え、同じフォルダの 管理番号.json に G・K がある
  //      → 管理番号.json に付け直して書く（直しが入る・G は原寸・K も残る・ほかにファイルを作らない）
  //   b) ほかのPCが「リスト/完了」へ動かした・リストに 管理番号.json も無い → どこにも書かない・作らない（0バイトも残さない）・📁 で読み直すよう知らせる
  for(const mode of ['a', 'b'].filter(m => want('㊸' + m))){
    const { ctx, page, said } = await openMain('㊸' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 231); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 232); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178('pj178at' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const row = _listRows[0];
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const fname = NO + '_1700000000.json';                                  // 現場入力（Android）が付けた名前
      const done = __mk('完了', {});
      const list = __mk('リスト', { [fname]: txt }, { '完了': done });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      const res = await lgwbAttachFrom(root, false);                          // 💾 戸別ファイルへ反映 の結び付け
      const o = { hit: res.hit, attached: !!(row._dir === list && row._name === fname && row.fileHandle) };
      // ほかのPCが整理した（中身はそのまま。名前・置き場所だけ変わった）
      if(mode === 'a'){ list.__files[NO + '.json'] = txt; delete list.__files[fname]; }
      else { done.__files[NO + '.json'] = txt; delete list.__files[fname]; }
      o.before = __tree(root);
      const snap = JSON.stringify([list.__files, done.__files]);
      const w0 = list.__writes.length + done.__writes.length;
      await openCaseInEditor(row);
      __setTel('090-2222-3333');
      o.btn = await __pressSave();
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? (p.dataUri === K ? 'K' : 'K?') : '?');
      const j = JSON.parse(list.__files[NO + '.json'] || '{}');
      Object.assign(o, { after: __tree(root), tel: j.chosho_cust_tel || '', photos: (__photosOf(j) || []).map(tag),
        sizes: Object.keys(list.__files).map(n => n + ':' + list.__files[n].length),
        unchanged: JSON.stringify([list.__files, done.__files]) === snap, writes: list.__writes.length + done.__writes.length - w0,
        rowNow: { name: row._name, file: row.file }, thumbAnywhere: __allPhotos(root).some(p => p.dataUri === Gt) });
      return o;
    }, { NO, PN, mode });
    const a = alerts(said);
    console.log('㊸' + mode + '付いているファイルが動いた', short(r), short(a.slice(-1).map(m => m.slice(0, 240))));
    ok(!r.error, '㊸' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.hit >= 1 && r.attached && r.btn.pressed && /物件に保存/.test(r.btn.text), '㊸' + mode + '試験の前提: 反映の結び付けで Android の名前のファイルが付き、開いて「物件に保存」できる → ' + short(r));
      if(mode === 'a'){
        ok(r.after.join() === 'リスト/' + NO + '.json' && r.tel === '090-2222-3333' && r.photos.join() === 'G原寸,K' && !r.thumbAnywhere,
           '★㊸aほかのPCがまとめた 管理番号.json に書かない・写真が G（原寸）と K のままではない・ファイルを作った → ' + short(r));
        ok(r.rowNow.name === NO + '.json' && r.rowNow.file === 'リスト/' + NO + '.json', '★㊸a行が 管理番号.json に付け直されていない → ' + short(r.rowNow));
        ok(a.some(m => /戸別の個別JSONも更新しました/.test(m)) && !a.some(m => /書き替えていません/.test(m)), '★㊸a書いたと知らせない・断った → ' + short(a.slice(-1)));
      } else {
        ok(r.after.join() === r.before.join() && r.unchanged && r.writes === 0,
           '★㊸b付いているファイルが無いのに、書いた・ファイルを作った（0バイトも含む） → ' + short(r.before) + ' → ' + short(r));
        ok(a.some(m => /書き替えていません/.test(m) && /見つかりません/.test(m) && /📁 フォルダ/.test(m)),
           '★㊸bつないでいたファイルが見つからないこと・📁 フォルダで読み直すことを知らせない → ' + short(a.slice(-1)));
      }
    }
    await ctx.close();
  }

  // ---- ㊸c 物件の行が覚えている古い名前（管理番号.antenna.json）のファイルが壊れていて読めない → 書かない・空の 管理番号.json を残さない ----
  if(want('㊸c')){
    const { ctx, page, said } = await openMain('㊸c');
    const r = await run(page, async ({ NO, PN }) => {
      const G = __jpeg(900, 700, 0.85, 233); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178('pj178atc', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.antenna.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const broken = '{"chosho_mgmt_no":"' + NO + '","chosho_photos":[{"id":"';             // 書いている途中で切れた
      const list = __mk('リスト', { [NO + '.antenna.json']: broken });
      const root = __mk('その１', {}, { 'リスト': list });
      _projDirHandle = root;                                                             // 工事フォルダとつながっている
      window.showDirectoryPicker = async () => root;
      const before = __tree(root);
      await openCaseInEditor(_listRows[0]);
      __setTel('090-2222-3333');
      const btn = await __pressSave();
      return { btn, before, after: __tree(root), sizes: Object.keys(list.__files).map(n => n + ':' + list.__files[n].length),
               untouched: list.__files[NO + '.antenna.json'] === broken, writes: list.__writes.length, removed: list.__removed.slice() };
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊸c古い名前のファイルが壊れている', short(r), short(a.slice(-1).map(m => m.slice(0, 200))));
    ok(!r.error, '㊸c止まった → ' + r.error);
    if(!r.error){
      ok(r.btn.pressed, '㊸c試験の前提: 物件に保存できる → ' + short(r));
      ok(r.after.join() === r.before.join() && r.untouched && r.writes === 0 && r.removed.length === 0,
         '★㊸c読めないファイルの写真を確かめられないのに、管理番号.json を作った（空のファイルを残した）・書いた・消した → ' + short(r));
      ok(a.some(m => /書き替えていません/.test(m) && /読めませんでした/.test(m)), '★㊸c書かなかったことを知らせない → ' + short(a.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㊸d 💾 反映で「リスト」（工事フォルダ その１ の中）を選んで付けた → 保存で、物件の覚える道のりを その１ から見た「リスト/管理番号.json」にする ----
  //   次の日（物件を開き直す＝ファイルの結び付きは消える）に保存しても、同じ リスト/管理番号.json へ書く（その１ に縮小版のファイルを作らない）
  //   作り物のフォルダは Chromium と同じ resolve を持つ。　1) 物件は「リスト/管理番号.json」を覚えている　2) 物件は「管理番号.json」（リストから見た名前）を覚えている
  for(const mode of ['1', '2'].filter(m => want('㊸d' + m))){
    const { ctx, page, said } = await openMain('㊸d' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178ad' + mode;
      const G = __jpeg(900, 700, 0.85, 234); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 235); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const Kt = await makeThumbDataUri(K, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178(PID, PN, [{ caseId: 'c1', file: (mode === '1' ? 'リスト/' : '') + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }, { id: kid, label: 'K', dataUri: Kt }], chosho_photos_thumb: true, chosho_photo_count: 2 } }]));
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: txt }, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      _projDirHandle = root;                                                 // 物件の工事フォルダ＝その１
      window.showDirectoryPicker = async () => root;
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : 'G縮') : (p.id === kid ? (p.dataUri === K ? 'K原寸' : 'K縮') : '?');
      const thumbIn = () => __allPhotos(root).some(p => p.dataUri === Gt || p.dataUri === Kt);
      let row = _listRows[0];
      const o = { fileBefore: row.file };
      const res = await lgwbAttachFrom(list, true);                          // 1日目：💾 反映でフォルダ「リスト」を選んだ
      o.hit = res.hit; o.att = !!(row._dir === list && row._name === NO + '.json' && row.fileHandle);
      o.rp = await root.resolve(await list.getFileHandle(NO + '.json'));
      await openCaseInEditor(row);
      __setTel('090-2222-3333');
      o.btn1 = await __pressSave();
      o.fileAfter = row.file;
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      o.projFile = ((await projIdbGet(PID)).cases || []).map(c => c.file);
      const j1 = JSON.parse(list.__files[NO + '.json']);
      o.day1 = { tree: __tree(root), tel: j1.chosho_cust_tel, photos: (__photosOf(j1) || []).map(tag), thumb: thumbIn() };
      // 2日目：物件を開き直す（ファイルの結び付きは無い）→ 工事フォルダ（その１）とつなぐ → 開いて直して物件に保存
      try { listCensusClear(); } catch(_){}
      _listRows = []; _listDirHandle = null; _projDirHandle = null;
      await applyProject(await projIdbGet(PID), { silent: true });
      row = _listRows[0];
      o.day2file = row.file; o.day2att = !!(row._dir || row.fileHandle);
      await openCaseInEditor(row);
      __setTel('090-4444-5555');
      o.btn2 = await __pressSave();                                          // 工事フォルダを聞かれたら その１ を選ぶ
      const j2 = JSON.parse(list.__files[NO + '.json']);
      o.day2 = { tree: __tree(root), tel: j2.chosho_cust_tel, photos: (__photosOf(j2) || []).map(tag), thumb: thumbIn(), linked: _projDirHandle === root };
      return o;
    }, { NO, PN, mode });
    const a = alerts(said);
    console.log('㊸d' + mode + '反映で選んだフォルダが工事フォルダと違う', short(r), short(a.slice(-1).map(m => m.slice(0, 120))));
    ok(!r.error, '㊸d' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.hit >= 1 && r.att && r.rp && r.rp.join('/') === 'リスト/' + NO + '.json' && r.btn1.pressed && r.btn2.pressed && !r.day2att && r.day2.linked,
         '㊸d' + mode + '試験の前提: リスト を選んで付き、1日目・2日目とも保存できる（2日目はファイルの結び付きが無く、工事フォルダ その１ とつなぐ） → ' + short(r));
      ok(r.day1.tree.join() === 'リスト/' + NO + '.json' && r.day1.tel === '090-2222-3333' && r.day1.photos.join() === 'G原寸,K原寸',
         '★㊸d' + mode + '1日目：付いているファイルに書かない・写真が原寸のままではない → ' + short(r.day1));
      ok(r.fileAfter === 'リスト/' + NO + '.json',
         '★㊸d' + mode + '1日目の保存のあと、行の覚える名前が工事フォルダ（その１）から見た「リスト/' + NO + '.json」になっていない → ' + short(r.fileAfter));
      ok(r.fileAfter === 'リスト/' + NO + '.json' && r.projFile.join() === 'リスト/' + NO + '.json' && r.day2file === 'リスト/' + NO + '.json',
         '★㊸d' + mode + '物件の覚える道のりが、工事フォルダ（その１）から見た「リスト/管理番号.json」になっていない → ' + short(r));
      ok(r.day2.tree.join() === 'リスト/' + NO + '.json' && r.day2.tel === '090-4444-5555' && r.day2.photos.join() === 'G原寸,K原寸' && !r.day2.thumb,
         '★㊸d' + mode + '2日目：工事フォルダに縮小版のファイルを作った・リストのファイルに直しが入らない・写真が原寸のままではない → ' + short(r.day2));
    }
    await ctx.close();
  }

  // ---- ㊹ 写真IDの無い名前だけの枠（写真の無いまま 💾 上書き保存 した戸別の「施工前」「施工完了」）----
  //   📁 で読んだ戸別を開き、画面で「施工前」を ✕ で外し、「施工完了」の名前を直す → 💾 上書き保存 → 外した枠・前の名前の枠が戻ってこない
  if(want('㊹')){
    const { ctx, page } = await openMain('㊹');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(900, 700, 0.85, 241);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [
        { id: 'A', label: 'A', dataUri: A }, { label: '施工前', dataUri: null }, { label: '施工完了', dataUri: null }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const slots = arr => (arr || []).filter(Boolean).map(p => (p.dataUri ? '[写]' : '[空]') + p.label).join(' / ');
      const o = {};
      await listLoadRow(row);
      o.shown = slots(STATE.photos);
      removePhotoEntry(STATE.photos.findIndex(p => p && !p.dataUri && p.label === '施工前'));          // ✕ で外す
      STATE.photos[STATE.photos.findIndex(p => p && !p.dataUri && p.label === '施工完了')].label = '完了（北面）';   // 名前を直す
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      o.screen = slots(STATE.photos);
      o.btn = await __pressSave();                                     // 💾 上書き保存
      o.file = slots(JSON.parse(list.__files[NO + '.json']).chosho_photos);
      await listLoadRow(row);                                          // 開き直す
      o.reopen = slots(STATE.photos);
      return o;
    }, { NO });
    console.log('㊹写真IDの無い名前だけの枠', short(r));
    ok(!r.error, '㊹止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === '[写]A / [空]施工前 / [空]施工完了' && r.screen === '[写]A / [空]完了（北面）' && r.btn.pressed && /上書き保存/.test(r.btn.text),
         '㊹試験の前提: 開くと枠が2つ出て、画面で1つ外し1つ名前を直し、💾 上書き保存できる → ' + short(r));
      ok(r.file === '[写]A / [空]完了（北面）' && r.reopen === r.file,
         '★㊹画面で外した枠・名前を直す前の枠が、💾 上書き保存で戸別ファイルに戻ってきた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊺ 共有の物件とまとめて行が作り直されたあと（開いている戸別の行も付け替わる）、画面で消した写真は 💾 上書き保存 で消える ----
  //   a) 自動保存でほかの端末の保存とまとめた　b) 🔄 最新を取り込む
  for(const mode of ['a', 'b'].filter(m => want('㊺' + m))){
    const { ctx, page } = await openMain('㊺' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const A = __jpeg(900, 700, 0.85, 251), B = __jpeg(900, 700, 0.85, 252);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      await __openShared(__proj178('pj178sn' + mode, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      _projDirHandle = list;
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行（図面あり）
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = {};
      await prepareProjectThumbs(true); await projSaveNow();          // 物件に入る
      o.caseId = !!row._caseId;
      await listLoadRow(row);                                          // 開く（A・B が出る）
      o.shown1 = shown();
      __otherDeviceSaves('2612MKM099');                                // ほかの端末が共有ファイルを保存した
      if(mode === 'a'){
        __setTel('090-0000-0000');                                     // 何か直す → 自動保存でまとめる
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await projSaveNow();
      } else await rtPullLatest();                                     // 🔄 最新を取り込む
      const nr = _listRows.filter(r => (r.data || {}).chosho_mgmt_no === NO)[0];
      // 開いている戸別は、作り直した行に付け替わる（🔄 のときは、取り込む前の保存でまとめて作り直した行）
      o.rebuilt = nr !== row; o.relinked = !!_editingRow && _editingRow !== row && (_editingRow.data || {}).chosho_mgmt_no === NO;
      o.edInList = _listRows.indexOf(_editingRow) >= 0;
      o.btn = document.getElementById('btn-save-overwrite').textContent;
      o.shown2 = shown();
      STATE.photos = (STATE.photos || []).filter(p => !(p && p.id === 'B'));   // 画面で B を消す
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      __setTel('090-1111-2222');
      await overwriteSaveCurrent();                                    // 💾 上書き保存
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN, mode });
    console.log('㊺' + mode + 'まとめて行が作り直されたあとに写真を消す', short(r));
    ok(!r.error, '㊺' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.caseId && r.shown1 === 'A,B' && r.rebuilt && r.relinked && r.shown2 === 'A,B' && /上書き保存/.test(r.btn) && r.tel === '090-1111-2222',
         '㊺' + mode + '試験の前提: 開いたあと、まとめで行が作り直され、開いている戸別が新しい行に付け替わる・上書き保存できる → ' + short(r));
      ok(r.file === 'A', '★㊺' + mode + 'まとめて行が作り直されたあと、画面で消した写真が 💾 上書き保存で消えない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊻ 開き直すとき一度だけファイルを読めなかった（同期ソフトが書き替えている最中など）→ 何も見せていない ----
  //   前に開いて見せた写真の覚えが残っていると、あとの保存で「画面で消した」と見て、ファイルの写真を全部消していた
  //   a) 図面あり・物件なし → 💾 上書き保存　b) 図面なし・物件あり（工事フォルダとつながっている）→ 💾 物件に保存
  for(const mode of ['a', 'b'].filter(m => want('㊻' + m))){
    const { ctx, page, said } = await openMain('㊻' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const A = __jpeg(900, 700, 0.85, 261), B = __jpeg(900, 700, 0.85, 262);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(mode === 'a') base.amplifier = 'amp_3u43';
      if(mode === 'b') await __openProj(__proj178('pj178nr', PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      if(mode === 'b') _projDirHandle = list;
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = {};
      await openCaseInEditor(row);                                     // 1回目：A・B が出る
      o.shown1 = shown();
      openListView();                                                  // 何も直さずに一覧へ戻る
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.slimBack = !!row._slim;
      list.__unreadable[NO + '.json'] = 1;                             // 次に読むときだけ読めない
      await openCaseInEditor(row);                                     // 開き直す（このとき読めない）
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.shown2 = shown();
      __setTel('090-1111-2222');
      o.btn = await __pressSave();                                     // このときは読める
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN, mode });
    console.log('㊻' + mode + '開き直すとき読めなかった', short(r), short(alerts(said).slice(-1).map(m => m.slice(0, 80))));
    ok(!r.error, '㊻' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.shown1 === 'A,B' && r.slimBack && r.readFailed && r.shown2 === '' && r.btn.pressed
         && (mode === 'a' ? /上書き保存/ : /物件に保存/).test(r.btn.text) && r.tel === '090-1111-2222',
         '㊻' + mode + '試験の前提: 1回目は A・B が出る・開き直すときだけ読めず写真が出ない・保存で直しが入る → ' + short(r));
      ok(r.file === 'A,B', '★㊻' + mode + '開き直すときファイルを読めなかったあとの保存で、ファイルの写真が消えた（前に見せた覚えが残っている） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊼ 💾 上書き保存で元ファイルを読み直せない（一度だけ）→ 書かない・知らせる（開いたあとで現場入力が足した写真 K を消さない） ----
  //   読めるようになってから、もう一度押す → 書く・K も残る
  if(want('㊼')){
    const { ctx, page, said } = await openMain('㊼');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(900, 700, 0.85, 271), K = __jpeg(900, 700, 0.85, 272);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行（物件なし）
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const o = {};
      await openCaseInEditor(row);
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',');
      const j = JSON.parse(list.__files[NO + '.json']);                // 開いているあいだに、現場入力が K を足した
      j.chosho_photos.push({ id: 'K', label: 'K', dataUri: K }); list.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      const t0 = list.__files[NO + '.json'];
      list.__unreadable[NO + '.json'] = 1;                             // 保存のときの読み直しが一度だけ読めない
      __setTel('090-1111-2222');
      o.btn1 = await __pressSave();
      o.first = { untouched: list.__files[NO + '.json'] === t0, writes: list.__writes.length, file: ids() };
      o.btn2 = await __pressSave();                                    // 読めるようになってから、もう一度押す
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO });
    const a = alerts(said);
    const iNo = a.findIndex(m => /上書き保存していません/.test(m) && /読み直せませんでした/.test(m));
    const iOk = a.findIndex(m => /✅ 上書き保存しました/.test(m));
    console.log('㊼上書き保存で読み直せない', short(r), short(a.map(m => m.slice(0, 50))));
    ok(!r.error, '㊼止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 'A' && r.btn1.pressed && /上書き保存/.test(r.btn1.text) && r.btn2.pressed, '㊼試験の前提: 📁 で読んだ戸別を開き、💾 上書き保存を押せる → ' + short(r));
      ok(r.first.untouched && r.first.writes === 0 && r.first.file === 'A,K',
         '★㊼元ファイルを読み直せないのに上書きした（開いたあとで現場が足した写真が消える） → ' + short(r.first));
      ok(iNo >= 0 && (iOk < 0 || iNo < iOk), '★㊼読み直せなかったので上書きしなかったことを知らせない → ' + short(a.map(m => m.slice(0, 80))));
      ok(r.file === 'A,K' && r.tel === '090-1111-2222' && iOk > iNo, '★㊼読めるようになってから押すと、書かない・K が消える → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊽ 開いている戸別（📁 の行・図面あり・物件あり）へ 📥 現場取込 → 画面にはファイルの写真（A・B）と現場の写真（G）を合わせて出す ----
  //   （前は取り込んだあとの行の写真 G だけを出していた＝直して戻ると、一覧・物件・工事調書が G だけになった）
  //   直して一覧へ戻る → 開き直して 💾 上書き保存 → 前に見せた写真（A・B。ファイルにある）を「画面で消した」としない
  if(want('㊽')){
    const { ctx, page } = await openMain('㊽');
    const r = await run(page, async ({ NO, PN }) => {
      const A = __jpeg(900, 700, 0.85, 281), B = __jpeg(900, 700, 0.85, 282), G = __jpeg(900, 700, 0.85, 283);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      await __openProj(__proj178('pj178gi', PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      _projDirHandle = list;                                           // 工事フォルダとつながっている
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = {};
      await openCaseInEditor(row);                                     // 開く（A・B が出る）
      o.shown1 = shown();
      openListView();                                                  // 何も直さずに一覧へ戻る（戸別は開いたまま）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.slimBack = !!row._slim;
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 80);   // 📥 現場取込
      o.fileAfterImport = ids();
      o.shownAfterImport = shown();
      o.editing = _editingRow === row;
      closeListView();
      __setTel('090-1111-2222');                                       // 画面で電話を直す（写真には触らない）
      openListView();                                                  // 一覧へ戻る（行へ取り込む）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await openCaseInEditor(row);                                     // 開き直す
      o.shown2 = shown();
      __setTel('090-1111-3333');
      o.btn = await __pressSave();                                     // 💾 上書き保存
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN });
    console.log('㊽開いている戸別へ現場取込', short(r));
    ok(!r.error, '㊽止まった → ' + r.error);
    if(!r.error){
      ok(r.shown1 === 'A,B' && r.slimBack && r.editing && r.fileAfterImport === 'A,B,G' && r.btn.pressed
         && /上書き保存/.test(r.btn.text) && r.tel === '090-1111-3333',
         '㊽試験の前提: 開いて戻ったあとの 📥 で、ファイルは A・B・G・開き直して上書き保存できる → ' + short(r));
      ok(r.shownAfterImport === 'A,B,G',
         '★㊽開いている戸別へ 📥 したあと、画面にファイルの写真（A・B）が出ない（現場の写真 G だけ） → ' + short(r.shownAfterImport));
      ok(r.file === 'A,B,G', '★㊽📥 のあと開き直して上書き保存すると、前に見せた写真（ファイルにある）が消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊾ 📥 現場取込で、常駐させない行（📁 の行）にだけ入った写真 G（戸別ファイルには書けなかった）→ 開くと画面に出る・保存でファイルに入る ----
  //   a) 物件なし・図面あり → 💾 上書き保存　b) 物件あり（取り込みのときは工事フォルダを掴めなかった）・図面なし → 💾 物件に保存
  for(const mode of ['a', 'b'].filter(m => want('㊾' + m))){
    const { ctx, page } = await openMain('㊾' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const A = __jpeg(900, 700, 0.85, 291), G = __jpeg(900, 700, 0.85, 292);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(mode === 'a') base.amplifier = 'amp_3u43';
      if(mode === 'b') await __openProj(__proj178('pj178gs', PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      if(mode === 'a'){ row._dir = list; row._name = NO + '.json'; row._dirPath = ''; }   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = { proj: !!_currentProject };
      if(mode === 'b'){ __abortPicker(); _genbaNoDir = false; }       // 取り込みのときは工事フォルダを掴めなかった
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);   // 📥 現場取込
      o.rowAfterImport = { slim: !!row._slim, ph: ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',') };
      o.fileAfterImport = ids();
      if(mode === 'b') window.showDirectoryPicker = async () => list;  // 保存のとき工事フォルダを選ぶ
      await openCaseInEditor(row);                                     // 知らせのとおり「戸別を開いて保存」
      o.shown = shown();
      __setTel('090-1111-2222');
      o.btn = await __pressSave();
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      openListView();
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.rowAfter = ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      return o;
    }, { NO, PN, mode });
    console.log('㊾' + mode + '取り込んだ写真が行にだけある', short(r));
    ok(!r.error, '㊾' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.proj === (mode === 'b') && r.rowAfterImport.slim && r.rowAfterImport.ph === 'G' && r.fileAfterImport === 'A'
         && (mode === 'a' || /工事フォルダを掴めていません/.test(r.note)) && r.btn.pressed
         && (mode === 'a' ? /上書き保存/ : /物件に保存/).test(r.btn.text) && r.tel === '090-1111-2222',
         '㊾' + mode + '試験の前提: 取り込んだ G は行にだけあり（ファイルは A のまま）、開いて保存できる → ' + short(r));
      ok(r.shown === 'A,G', '★㊾' + mode + '開いたとき、取り込んだ写真 G が画面に出ない → ' + short(r));
      ok(r.file === 'A,G' && r.rowAfter === 'A,G', '★㊾' + mode + '開いて保存すると、取り込んだ写真 G が戸別ファイル・行から消えた → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊿ 物件の縮小版づくり（自動保存）が動いているあいだに、行の写真が変わった（写真を足して一覧へ戻った）----
  //   → 古い写真の縮小版を行に付けない。次の保存で作り直し、足した写真の縮小版も物件（端末内）に入る（枚数だけ多い、にしない）
  //   （4回目の見直しから）付けなかった行は、その保存のうちに作り直す＝その回の保存で、物件に4枚とも入る（「写真なし」で入れない）
  if(want('㊿')){
    const { ctx, page } = await openMain('㊿');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178th', PN, []));
      const row = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: '台帳 様' }, 'manual');   // 受付台帳で作った行（ファイルなし）
      await openCaseInEditor(row);
      STATE.photos = [1, 2, 3].map(i => ({ id: 'q' + i, label: '写真' + i, dataUri: __jpeg(900, 700, 0.85, 300 + i) }));
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      openListView();                                                  // 行へ取り込む（3枚）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      const o = { idb0: (await __idbPhotos('pj178th', NO)).photos.length };
      await openCaseInEditor(row);                                     // もう一度開く
      // 縮小版づくりを遅くする（写真が多い・大きい）：最初の1枚のところで止めておく
      const orig = makeThumbDataUri;
      let release; const gate = new Promise(res => { release = res; });
      let hits = 0;
      makeThumbDataUri = async (...a) => { hits++; await gate; return orig(...a); };
      __setTel('090-1111-2222');                                       // 電話を直す → 行へ取り込む（縮小版の控えが消え、次の保存で作り直す）
      syncEditorToRowData();
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.thumbsCleared = !Array.isArray(row._thumbs);
      const p = projSaveNow();                                         // 1.5秒あとの自動保存（縮小版づくりが始まる）
      for(let i = 0; i < 200 && !hits; i++) await new Promise(res => setTimeout(res, 10));
      o.started = hits > 0;
      const P4 = __jpeg(900, 700, 0.85, 304);
      STATE.photos = (STATE.photos || []).concat([{ id: 'q4', label: '写真4', dataUri: P4 }]);   // その間に1枚足して
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      openListView();                                                  // すぐ一覧へ戻る（行の写真が4枚になる）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.rowN = ((row.data || {}).chosho_photos || []).filter(x => x && x.dataUri).length;
      release();
      await p;
      makeThumbDataUri = orig;
      for(let i = 0; i < 100 && _projSaving; i++) await new Promise(res => setTimeout(res, 50));
      o.thumbsAfterRace = Array.isArray(row._thumbs) ? row._thumbs.length : null;
      { const ia = await __idbPhotos('pj178th', NO);                  // その回の保存で物件（端末内）に入ったもの
        o.idbRace = { n: ia.photos.length, count: ia.count, ids: ia.photos.map(x => x.id).sort().join(',') }; }
      await projSaveNow();                                             // 次の自動保存
      const idb = await __idbPhotos('pj178th', NO);
      o.idb = { n: idb.photos.length, count: idb.count, ids: idb.photos.map(x => x.id).sort().join(','), thumb: idb.thumb };
      // 物件を開き直しても4枚
      await applyProject(await projIdbGet('pj178th'), { silent: true });
      const r2 = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.reopen = ((r2 && r2.data.chosho_photos) || []).filter(x => x && x.dataUri).map(x => x.id).sort().join(',');
      return o;
    }, { NO, PN });
    console.log('㊿縮小版づくりのあいだに写真が変わった', short(r));
    ok(!r.error, '㊿止まった → ' + r.error);
    if(!r.error){
      ok(r.idb0 === 3 && r.thumbsCleared && r.started && r.rowN === 4, '㊿試験の前提: 3枚の縮小版が物件に入り、縮小版づくりのあいだに行が4枚になる → ' + short(r));
      ok(r.thumbsAfterRace !== 3, '★㊿縮小版づくりのあいだに行の写真が変わったのに、古い写真（3枚）の縮小版を行に付けた → ' + short(r));
      ok(r.thumbsAfterRace === 4 && r.idbRace.n === 4 && r.idbRace.count === 4 && r.idbRace.ids === 'q1,q2,q3,q4',
         '★㊿縮小版を付けなかった行を、その保存のうちに作り直さない（その回は「写真なし」で物件に入る） → ' + short(r));
      ok(r.idb.n === 4 && r.idb.count === 4 && r.idb.ids === 'q1,q2,q3,q4' && r.reopen === 'q1,q2,q3,q4',
         '★㊿足した写真の縮小版が物件（端末内）に入らない（枚数だけ4・縮小版は3）・開き直すと消える → ' + short(r));
    }
    await ctx.close();
  }

  /* ===================== ここから 4回目の見直しの直し ===================== */

  // ---- ㉕d 物件の行（暗号の戸別。物件には写真を剥がした封筒しか無い）に「💾 戸別ファイルへ反映」の結び付けで リスト/管理番号.hyb（写真入り・同じ鍵）が付いた ----
  //   → 一覧から開くと、付いているファイルの暗号の部分で開く（写真1枚が出る・「写真が失われます」と聞かない）
  //   → 電話を直して 💾 上書き保存 → .hyb は写真1枚のまま・直した電話が入る（前は写真の無い封筒で開き、写真なしで .hyb を書いていた）
  //   ㉕d) パスワードを覚えているまま開く　㉕d2) 先に「🔓 まとめて復号」してから開く（名前・住所も元のまま書く）
  for(const sc of ['㉕d', '㉕d2'].filter(want)){
    const { ctx, page, said } = await openMain(sc);
    const bulk = (sc === '㉕d2');
    const r = await run(page, async ({ NO, PN, bulk }) => {
      const ph = __jpeg(600, 450, 0.85, 143);
      const state = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_addr: '本町1-1', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                      chosho_photos: [{ id: 'h1', label: '写真1', dataUri: ph }] };
      const env = await encryptHybrid(state, 'pw1234');
      const fileText = JSON.stringify(env, null, 2);
      const list = __mk('リスト', { [NO + '.hyb']: fileText });
      const root = __mk('その１', {}, { 'リスト': list });
      // 物件の行は、写真を剥がした封筒（slimListRow と同じ形）
      const slim = Object.assign({}, env, { encrypted_fields: Object.assign({}, env.encrypted_fields, { chosho_photos: { stripped: true } }) });
      await __openProj(__proj178('pj178yd' + (bulk ? '2' : ''), PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.hyb', lastModified: 0, payload: slim }]));
      const row = _listRows[0];
      _projDirHandle = root;                                           // 工事フォルダとつながっている
      window.showDirectoryPicker = async () => root;
      const res = await lgwbAttachFrom(root, false);                   // 💾 戸別ファイルへ反映 の結び付け（行に .hyb が付く）
      try { setSessionPassword('pw1234'); } catch(_){ _sessionPassword = 'pw1234'; }   // パスワードは覚えている
      const asked = [];
      window.confirm = m => { asked.push(String(m)); return true; };   // 「元ファイルに上書き保存します」→ はい
      const o = { hit: res.hit, att: !!(row._dir === list && row.fileHandle), fileType: row.fileType, slim: !!row._slim,
                  rowStripped: !!(((row.envelope || {}).encrypted_fields || {}).chosho_photos || {}).stripped };
      if(bulk){ o.unlock = await unlockListView({ silent: true }); o.unlockedName = (row.data || {}).chosho_cust_name; }   // d2) 🔓 まとめて復号
      await openCaseInEditor(row);                                     // 一覧から開く
      o.screenName = document.getElementById('chosho_cust_name').value;
      o.btn = document.getElementById('btn-save-overwrite').textContent;
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.dataUri === ph ? 'P' : '?').join(',');
      o.askedOpen = asked.map(m => m.slice(0, 120));
      __setTel('090-1111-2222');
      o.press = await __pressSave();                                   // 💾 上書き保存
      o.asked = asked.map(m => m.slice(0, 120));
      o.writes = list.__writes.length;
      try { const dec = await decryptHybrid(JSON.parse(list.__files[NO + '.hyb']), 'pw1234');
            const ps = (dec.chosho_photos || []).filter(p => p && p.dataUri);
            o.dec = { n: ps.length, same: ps.length === 1 && ps[0].dataUri === ph, tel: dec.chosho_cust_tel, name: dec.chosho_cust_name, addr: dec.chosho_cust_addr }; }
      catch(e){ o.decErr = String((e && e.message) || e).slice(0, 80); }
      return o;
    }, { NO, PN, bulk });
    const a = alerts(said);
    console.log(sc + '物件の暗号の行に付いた .hyb を開いて上書き保存', short(r), short(a.slice(-1).map(m => m.slice(0, 60))));
    ok(!r.error, sc + '止まった → ' + r.error);
    if(!r.error){
      ok(r.hit >= 1 && r.att && r.fileType === 'hybrid' && !r.slim && r.rowStripped && /上書き保存/.test(r.btn) && r.press.pressed && r.writes >= 1
         && (!bulk || (r.unlock && r.unlock.ok === 1 && r.unlockedName === '暗号 様')),
         sc + '試験の前提: 写真を剥がした封筒の物件の行に .hyb が付き、開いて 💾 上書き保存できる → ' + short(r));
      ok(r.shown === 'P', '★' + sc + '付いている .hyb があるのに、写真を剥がした封筒で開いた（写真が出ない） → ' + short(r.shown));
      ok(!r.asked.some(m => /写真が失われます|復元できていません/.test(m)), '★' + sc + '「写真が失われます」と聞いた（写真を読めているはずなのに） → ' + short(r.asked));
      ok(r.dec && r.dec.n === 1 && r.dec.same && r.dec.tel === '090-1111-2222',
         '★' + sc + '💾 上書き保存で .hyb の写真が消えた・直しが入らない・ほどけない → ' + short(r.dec || r.decErr));
      // ※ ㉕d（まとめて復号せずに開く）は、名前・住所が「★★★★★」のまま画面に出て、そのまま書かれる（版178 より前からの動き。ここでは見ない）
      if(bulk) ok(r.screenName === '暗号 様' && r.dec && r.dec.name === '暗号 様' && r.dec.addr === '本町1-1',
                  '★㉕d2まとめて復号してから開いて保存すると、名前・住所が元のまま書かれない → ' + short(r.dec));
    }
    await ctx.close();
  }

  // ---- ⑯i まとめて書いているとき（📥 現場取込・協力会社諸経費のそろえ直し）に、管理番号の付け替え先が 写真なし・名前の違うファイル ----
  //   画面に出ていない戸別なので、同じお宅かを聞けない（聞くと、どの戸別のことか分からないまま OK を押してしまう）。
  //   → 聞かない・書かない（どちらのファイルも元のまま）・その戸別を開いて「💾 物件に保存」を押すよう知らせる（そのとき聞く）
  if(want('⑯i')){
    const { ctx, page } = await openMain('⑯i');
    const r = await run(page, async ({ NO, NO2, PN }) => {
      const NO3 = '2612MKM099';
      await __openProj(__proj178('pj178pi', PN, [
        { caseId: 'c1', file: NO + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO, chosho_cust_name: '山田 太郎 様', chosho_cust_addr: '本町1-1', chosho_status: 'in_progress', work_type: '' } },
        { caseId: 'c3', file: NO3 + '.json', lastModified: 0,
          payload: { chosho_mgmt_no: NO3, chosho_cust_name: '別 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(x => x.data.chosho_mgmt_no === NO)[0];
      const other = _listRows.filter(x => x.data.chosho_mgmt_no === NO3)[0];
      const tgtText = JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '鈴木 様', chosho_cust_addr: '川町9-9', chosho_cust_tel: '090-7777-8888',
                                       _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43', chosho_status: 'done' }, null, 2);
      const root = __mk('その１', { [NO2 + '.json']: tgtText });
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const P = __jpeg(900, 700, 0.85, 215);
      await __addPhoto(P, 'p.jpg');
      const o = { b1: await __pressSave() };                 // NO.json を作る（工事フォルダ その１ を選ぶ）
      o.first = (__photosOf(root.__files[NO + '.json'] || '{}') || []).length;
      __setField('chosho_mgmt_no', NO2);                     // 番号を打ち間違えた
      openListView();                                        // 一覧へ戻る（直した番号が行に入る）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await openCaseInEditor(other);                         // 別の戸別を開いた（この戸別は画面に出ていない）
      o.rowNo = row.data.chosho_mgmt_no; o.notShown = _editingRow === other;
      const oldText = root.__files[NO + '.json'];
      const w0 = root.__writes.length, r0 = root.__removed.length;
      const asked = [];
      window.confirm = m => { asked.push(String(m)); return true; };
      o.note = String(await _genbaWriteRowIndividual(row) || '');   // 協力会社諸経費のそろえ直し・📥 と同じ書き方（まとめて書く）
      Object.assign(o, { asked: asked.map(m => m.slice(0, 200)), writes: root.__writes.slice(w0).map(w => w.n), removed: root.__removed.slice(r0),
                         oldSame: root.__files[NO + '.json'] === oldText, tgtSame: root.__files[NO2 + '.json'] === tgtText, tree: __tree(root) });
      return o;
    }, { NO, NO2, PN });
    console.log('⑯iまとめて書くとき付け替え先が名前の違うファイル', short(r));
    ok(!r.error, '⑯i止まった → ' + r.error);
    if(!r.error){
      ok(r.b1.pressed && r.first === 1 && r.rowNo === NO2 && r.notShown, '⑯i試験の前提: NO.json（写真 P）ができ、番号を直した戸別は画面に出ていない → ' + short(r));
      ok(r.asked.length === 0, '★⑯iまとめて書いているときに「同じお宅ですか」と聞いた（どの戸別のことか分からない） → ' + short(r.asked));
      ok(r.writes.length === 0 && r.removed.length === 0 && r.oldSame && r.tgtSame && r.tree.join() === [NO + '.json', NO2 + '.json'].join(),
         '★⑯iまとめて書いているときに、名前の違うファイルへ このお宅の中身を書いた・元のファイルを消した → ' + short(r));
      ok(/書き替えていません/.test(r.note) && /開いて/.test(r.note) && /💾 物件に保存/.test(r.note) && /鈴木 様/.test(r.note),
         '★⑯i書かなかったこと・その戸別を開いて「💾 物件に保存」を押せばよいことを知らせない → ' + short(r.note));
    }
    await ctx.close();
  }

  // ---- ⑯j アパートの世帯（同じ建物＝同じ住所）：-01（山田 様・写真 P）を開いて、管理番号を -02 に直して保存 ----
  //   -02 の戸別ファイルは 佐藤 様（写真はまだ無い・住所は同じ 本町1-1）。住所が同じでも同じお宅とは見ない
  //   → 同じお宅か聞く（キャンセル）→ 書かない・どちらのファイルも元のまま（前は黙って 佐藤 様のファイルへ書き、-01 のファイルを消していた）
  if(want('⑯j')){
    const { ctx, page, said } = await openMain('⑯j');
    const r = await run(page, async ({ PN }) => {
      const B = '2612MKM090', N1 = B + '-01', N2 = B + '-02', ADDR = '本町1-1';
      const APT = { apt_units: '2', apt_bldg: B, apt_name: 'さくらハイツ', apt_common: 'no' };
      const P = __jpeg(900, 700, 0.85, 221); const pid = photoContentId(P);
      const Pt = await makeThumbDataUri(P, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const p1 = Object.assign({ chosho_mgmt_no: N1, chosho_cust_name: '山田 様', chosho_cust_addr: ADDR, chosho_status: 'in_progress', work_type: 'uhf_new',
                                 amplifier: 'amp_3u43', apt_idx: '1', apt_room: '101' }, APT);
      const p2 = Object.assign({ chosho_mgmt_no: N2, chosho_cust_name: '佐藤 様', chosho_cust_addr: ADDR, chosho_cust_tel: '090-7777-8888', chosho_status: 'done',
                                 _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43', meas_note: '佐藤様の測定値', apt_idx: '2', apt_room: '102' }, APT);
      await __openProj(__proj178('pj178pj', PN, [
        { caseId: 'c1', file: 'リスト/' + N1 + '.json', lastModified: 0,
          payload: Object.assign({}, p1, { chosho_photos: [{ id: pid, label: '施工前', dataUri: Pt }], chosho_photos_thumb: true, chosho_photo_count: 1 }) },
        { caseId: 'c2', file: 'リスト/' + N2 + '.json', lastModified: 0, payload: Object.assign({}, p2) }]));
      const f1 = JSON.stringify(Object.assign({}, p1, { _origin: 'genba', chosho_photos: [{ id: pid, label: '施工前', dataUri: P }] }), null, 2);
      const f2 = JSON.stringify(p2, null, 2);
      const list = __mk('リスト', { [N1 + '.json']: f1, [N2 + '.json']: f2 });
      const root = __mk('その１', {}, { 'リスト': list });
      _projDirHandle = root;                                 // 工事フォルダとつながっている
      window.showDirectoryPicker = async () => root;
      const row = _listRows.filter(x => x.data.chosho_mgmt_no === N1)[0];
      await openCaseInEditor(row);
      const asked = [];
      window.confirm = m => { asked.push(String(m)); return !/同じお宅/.test(String(m)); };   // 「同じお宅のファイルですか？」→ キャンセル
      __setField('chosho_mgmt_no', N2);                      // -02 にした（何世帯目を選び間違えた・打ち間違えた）
      __setTel('090-1111-2222');
      const btn = await __pressSave();
      return { btn, mg: document.getElementById('chosho_mgmt_no').value, asked: asked.map(m => m.slice(0, 700)),
               tree: __tree(root), writes: list.__writes.map(w => w.n), removed: list.__removed.slice(),
               f1same: list.__files[N1 + '.json'] === f1, f2same: list.__files[N2 + '.json'] === f2 };
    }, { PN });
    const a = alerts(said);
    console.log('⑯jアパートの別の世帯のファイル', short(Object.assign({}, r, { asked: (r.asked || []).map(m => m.slice(0, 120)) })), short(a.slice(-1).map(m => m.slice(0, 200))));
    ok(!r.error, '⑯j止まった → ' + r.error);
    if(!r.error){
      ok(r.btn.pressed && r.mg === '2612MKM090-02', '⑯j試験の前提: 管理番号を -02 に直して保存できる → ' + short(r));
      ok(r.f1same && r.f2same && r.writes.length === 0 && r.removed.length === 0,
         '★⑯j住所が同じだけで同じお宅と見て、別の世帯（佐藤 様）のファイルに このお宅の中身を書いた・-01 のファイルを消した → ' + short(r));
      const q = r.asked.filter(m => /同じお宅/.test(m));
      ok(q.length === 1 && /佐藤 様/.test(q[0]) && /山田 様/.test(q[0]),
         '★⑯j別の世帯のファイルへ書く前に、同じお宅か（両方の名前を見せて）聞いていない → ' + short(r.asked.map(m => m.slice(0, 300))));
      ok(a.some(m => /書き替えていません/.test(m)), '★⑯j書かなかったことを知らせない → ' + short(a.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㊸e 物件の工事フォルダは その１。受付台帳で電話を直し「💾 戸別ファイルへ反映」で リスト（戸別ファイルが直に入っているフォルダ）を選んだ ----
  //   → 書き戻して一覧を読み直す → 読み直した行の覚える名前を、工事フォルダ（その１）から見た「リスト/管理番号.json」にそろえる（物件にもそう入る）
  //   → 次の日 物件を開き直し、開いて直して「💾 物件に保存」（工事フォルダ その１ を選ぶ）→ リスト/管理番号.json へ書く
  //   （前は「管理番号.json」を覚え、次の日 その１ に縮小版だけの 管理番号.json をもう1つ作っていた）
  if(want('㊸e')){
    const { ctx, page, said } = await openMain('㊸e');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ae';
      const G = __jpeg(900, 700, 0.85, 236); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 237); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const Kt = await makeThumbDataUri(K, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178(PID, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }, { id: kid, label: 'K', dataUri: Kt }], chosho_photos_thumb: true, chosho_photo_count: 2 } }]));
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: txt }, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      _projDirHandle = root;                                                 // 物件の工事フォルダ＝その１
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : 'G縮') : (p.id === kid ? (p.dataUri === K ? 'K原寸' : 'K縮') : '?');
      const thumbIn = () => __allPhotos(root).some(p => p.dataUri === Gt || p.dataUri === Kt);
      const row0 = _listRows[0];
      row0.data = Object.assign({}, row0.data, { chosho_cust_tel: '090-1111-0000' });   // 受付台帳で電話を直した（まだ戸別ファイルに入っていない）
      try { markCaseEdited(row0); } catch(_){}
      window.showDirectoryPicker = async () => list;                         // 反映でフォルダを聞かれ、リスト を選んだ
      await lgwbButton();                                                    // 書き戻し → 一覧を読み直す
      const row = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      const o = { reflect: { reloaded: !!row && row !== row0 && _listDirHandle === list, att: !!(row && row._dir === list && row.fileHandle),
                             fileTel: JSON.parse(list.__files[NO + '.json']).chosho_cust_tel, caseId: !!(row && row._caseId) },
                  fileAfterReload: row && row.file };
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      o.projFile = ((await projIdbGet(PID)).cases || []).map(c => c.file);
      // 2日目：物件を開き直す（ファイルの結び付きは無い）→ 開いて直して物件に保存（工事フォルダを聞かれたら その１ を選ぶ）
      try { listCensusClear(); } catch(_){}
      _listRows = []; _listDirHandle = null; _projDirHandle = null;
      await applyProject(await projIdbGet(PID), { silent: true });
      const row2 = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.day2file = row2 && row2.file; o.day2att = !!(row2 && (row2._dir || row2.fileHandle));
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row2);
      __setTel('090-4444-5555');
      o.btn2 = await __pressSave();
      const j = JSON.parse(list.__files[NO + '.json']);
      o.day2 = { tree: __tree(root), tel: j.chosho_cust_tel, photos: (__photosOf(j) || []).map(tag), thumb: thumbIn(), linked: _projDirHandle === root };
      return o;
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊸e反映で選んだフォルダが工事フォルダと違う（一覧の読み直し）', short(r), short(a.slice(-1).map(m => m.slice(0, 120))));
    ok(!r.error, '㊸e止まった → ' + r.error);
    if(!r.error){
      ok(r.reflect.reloaded && r.reflect.att && r.reflect.fileTel === '090-1111-0000' && r.btn2.pressed && /物件に保存/.test(r.btn2.text) && !r.day2att && r.day2.linked,
         '㊸e試験の前提: 反映で リスト を選んで書き戻し・一覧を読み直す。2日目は結び付きが無く、工事フォルダ その１ とつないで物件に保存できる → ' + short(r));
      ok(r.fileAfterReload === 'リスト/' + NO + '.json',
         '★㊸e反映のあと一覧を読み直した行が、工事フォルダ（その１）から見た「リスト/' + NO + '.json」を覚えていない → ' + short(r.fileAfterReload));
      ok(r.projFile.join() === 'リスト/' + NO + '.json' && r.day2file === 'リスト/' + NO + '.json',
         '★㊸e物件の覚える道のりが「リスト/' + NO + '.json」になっていない → ' + short(r));
      ok(r.day2.tree.join() === 'リスト/' + NO + '.json' && r.day2.tel === '090-4444-5555' && r.day2.photos.join() === 'G原寸,K原寸' && !r.day2.thumb,
         '★㊸e2日目：工事フォルダに縮小版のファイルを作った・リストのファイルに直しが入らない・写真が原寸のままではない → ' + short(r.day2));
    }
    await ctx.close();
  }

  // ---- ㊸f 物件の行（ファイルは付いていない）は その１ の「管理番号.json」を覚えているが、ファイルは リスト/管理番号.json にある（G 原寸・K）----
  //   → 工事フォルダの中（下のフォルダも）を探して リスト/管理番号.json へ書く（直しが入る・G は原寸・K も残る・その１ にファイルを作らない）
  //   f2) リスト/ と リスト/完了/ の両方に 管理番号.json がある → どちらとも決められない → 書かない・作らない・🧩 で1つにするよう知らせる
  for(const sc of ['㊸f', '㊸f2'].filter(want)){
    const { ctx, page, said } = await openMain(sc);
    const two = (sc === '㊸f2');
    const r = await run(page, async ({ NO, PN, two }) => {
      const G = __jpeg(900, 700, 0.85, 238); const gid = photoContentId(G);
      const K = __jpeg(900, 700, 0.85, 239); const kid = photoContentId(K);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178('pj178af' + (two ? '2' : ''), PN, [{ caseId: 'c1', file: NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }, { id: kid, label: 'K', dataUri: K }] }, null, 2);
      const done = __mk('完了', two ? { [NO + '.json']: txt } : {});
      const list = __mk('リスト', { [NO + '.json']: txt }, { '完了': done });
      const root = __mk('その１', {}, { 'リスト': list });
      _projDirHandle = root;                                                 // 工事フォルダとつながっている
      window.showDirectoryPicker = async () => root;
      const before = __tree(root), snap = JSON.stringify([root.__files, list.__files, done.__files]);
      const w0 = root.__writes.length + list.__writes.length + done.__writes.length;
      const row = _listRows[0];
      const o = { rowFile0: row.file, att: !!(row._dir || row.fileHandle) };
      await openCaseInEditor(row);
      __setTel('090-2222-3333');
      o.btn = await __pressSave();
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G原寸' : (p.dataUri === Gt ? 'G縮' : 'G?')) : (p.id === kid ? (p.dataUri === K ? 'K' : 'K?') : '?');
      const j = JSON.parse(list.__files[NO + '.json'] || '{}');
      Object.assign(o, { before, after: __tree(root), tel: j.chosho_cust_tel || '', photos: (__photosOf(j) || []).map(tag),
                         unchanged: JSON.stringify([root.__files, list.__files, done.__files]) === snap,
                         writes: root.__writes.length + list.__writes.length + done.__writes.length - w0,
                         rowFile: row.file, thumbAnywhere: __allPhotos(root).some(p => p.dataUri === Gt) });
      return o;
    }, { NO, PN, two });
    const a = alerts(said);
    console.log(sc + '覚えている名前で見つからない（工事フォルダの中を探す）', short(r), short(a.slice(-1).map(m => m.slice(m.indexOf('📄') >= 0 ? m.indexOf('📄') : m.indexOf('⚠'), 260))));
    ok(!r.error, sc + '止まった → ' + r.error);
    if(!r.error){
      ok(r.rowFile0 === NO + '.json' && !r.att && r.btn.pressed && /物件に保存/.test(r.btn.text),
         sc + '試験の前提: ファイルの付いていない物件の行（その１ の ' + NO + '.json を覚えている）を開いて「物件に保存」できる → ' + short(r));
      if(!two){
        ok(r.after.join() === 'リスト/' + NO + '.json' && r.tel === '090-2222-3333' && r.photos.join() === 'G原寸,K' && !r.thumbAnywhere,
           '★㊸f工事フォルダの中の リスト/' + NO + '.json に書かない・その１ にファイルを作った・写真が G（原寸）と K のままではない → ' + short(r));
        ok(r.rowFile === 'リスト/' + NO + '.json', '★㊸f書いたあと、行が見つけたファイル（リスト/' + NO + '.json）を覚えていない → ' + short(r.rowFile));
        ok(a.some(m => /戸別の個別JSONも更新しました/.test(m) && !/新規作成/.test(m)) && !a.some(m => /書き替えていません/.test(m)),
           '★㊸f見つけたファイルに書いたと知らせない・新しく作ったと知らせた → ' + short(a.slice(-1)));
      } else {
        ok(r.after.join() === r.before.join() && r.unchanged && r.writes === 0,
           '★㊸f2同じ管理番号のファイルが2つあるのに、書いた・ファイルを作った → ' + short(r.before) + ' → ' + short(r));
        ok(a.some(m => /書き替えていません/.test(m) && /複数/.test(m) && /🧩/.test(m)),
           '★㊸f2同じ管理番号のファイルが複数あること・「🧩 重複をまとめる」で1つにすることを知らせない → ' + short(a.slice(-1)));
      }
    }
    await ctx.close();
  }

  // ---- ㊻c 物件あり（工事フォルダとはつながっていない）・📁 の行（図面なし・ファイルの写真 A）へ 📥 現場取込（G。フォルダを掴めず行にだけある）----
  //   → 開くとき一度だけファイルを読めない → 行の写真 G を出す・読めなかったと知らせる
  //   → 直して一覧へ戻っても、行は「ファイルから読む」のまま（ファイルの写真があることを忘れない）・G も持ったまま
  //   → 読めるときに開き直すと A・G → 保存（一度戻ると行に図面の欄が入るので「💾 上書き保存」になる）→ ファイルは A・G
  //   （前は読めないと何も出さず、戻ると行が「写真なし」になって G が消え、A も見えなくなっていた）
  if(want('㊻c')){
    const { ctx, page, said } = await openMain('㊻c');
    const r = await run(page, async ({ NO, PN }) => {
      const A = __jpeg(900, 700, 0.85, 265), G = __jpeg(900, 700, 0.85, 266);
      await __openProj(__proj178('pj178nc', PN, []));
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };   // 図面なし
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const held = () => ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = { drawing: lgHasDrawing(row) };
      __abortPicker(); _genbaNoDir = false;                            // 取り込みのときは工事フォルダを掴めなかった
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);   // 📥 現場取込
      o.afterImport = { slim: !!row._slim, held: held(), file: ids() };
      list.__unreadable[NO + '.json'] = 1;                             // 開くときだけ読めない（同期ソフトが書き替えている最中など）
      await openCaseInEditor(row);
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.shown1 = shown();
      await new Promise(res => setTimeout(res, 400));                  // 知らせ（少しあとに出る）を待つ
      __setTel('090-1111-2222');                                       // 何か直して
      openListView();                                                  // 一覧へ戻る（行へ取り込む）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.back = { slim: !!row._slim, known: !!row._photosKnown, held: held() };
      await openCaseInEditor(row);                                     // 開き直す（今度は読める）
      o.shown2 = shown();
      window.showDirectoryPicker = async () => list;                   // 保存のとき工事フォルダを選ぶ
      __setTel('090-1111-3333');
      o.btn = await __pressSave();                                     // 💾 保存
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊻c読めないまま開いた戸別（取り込んだ写真あり）', short(r), short(a.map(m => m.slice(0, 40))));
    ok(!r.error, '㊻c止まった → ' + r.error);
    if(!r.error){
      // 一度開いて戻ると行に図面の欄が入る＝開き直すと「💾 上書き保存」になる（どちらのボタンでもよい）
      ok(!r.drawing && /工事フォルダを掴めていません/.test(r.note) && r.afterImport.slim && r.afterImport.held === 'G' && r.afterImport.file === 'A' && r.readFailed
         && r.btn.pressed && /保存/.test(r.btn.text) && r.tel === '090-1111-3333',
         '㊻c試験の前提: 取り込んだ G は行にだけあり（ファイルは A のまま）、開くときだけ読めない・あとで保存できる → ' + short(r));
      ok(r.shown1 === 'G', '★㊻cファイルを読めないまま開いたとき、行が持っている写真（取り込んだ G）を出さない → ' + short(r.shown1));
      ok(a.some(m => /読めませんでした/.test(m) && /写真/.test(m)), '★㊻cファイルの写真を読めないまま開いたことを知らせない → ' + short(a.map(m => m.slice(0, 60))));
      ok(r.back.slim && !r.back.known && r.back.held === 'G',
         '★㊻c読めないまま開いて直して戻ると、行が「写真はこれで全部」になった（ファイルの写真 A を忘れる・G が消える） → ' + short(r.back));
      ok(r.shown2 === 'A,G', '★㊻c読めるときに開き直しても、ファイルの写真 A と取り込んだ G が出ない → ' + short(r.shown2));
      ok(r.file === 'A,G', '★㊻c保存で、戸別ファイルが A・G にならない（取り込んだ写真・ファイルの写真が消えた） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊼b 物件なし・📁 の行（図面あり・A・B。Android の名前 管理番号_数字.json）を開いている → ほかのPCが 🧩 重複をまとめる で 管理番号.json にした ----
  //   → 💾 上書き保存 で、同じフォルダの 管理番号.json に付け直して書く（直しが入る・A・B のまま・古い名前を作り直さない）
  //   （前は「少し待ってから、もう一度」と断り続け、待っても書けなかった）
  if(want('㊼b')){
    const { ctx, page, said } = await openMain('㊼b');
    const r = await run(page, async ({ NO }) => {
      const OLD = NO + '_1700000000.json';
      const A = __jpeg(900, 700, 0.85, 273), B = __jpeg(900, 700, 0.85, 274);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [OLD]: JSON.stringify(base, null, 2) });
      const fh = await list.getFileHandle(OLD);
      const row = buildListRow(OLD, 1, JSON.parse(list.__files[OLD]), fh);   // 📁 フォルダで読んだ行（物件なし）
      row._dir = list; row._name = OLD; row._dirPath = '';
      slimListRow(row, true);
      _listRows = [row];
      window.confirm = () => true;                                     // 「元ファイルに上書き保存します」→ はい
      await openCaseInEditor(row);
      const o = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',') };
      list.__files[NO + '.json'] = list.__files[OLD]; delete list.__files[OLD];   // ほかのPCが名前を変えた（中身はそのまま）
      __setTel('090-1111-2222');
      o.btn = await __pressSave();                                     // 💾 上書き保存
      const j = JSON.parse(list.__files[NO + '.json'] || '{}');
      Object.assign(o, { tree: __tree(list), tel: j.chosho_cust_tel || '', file: (__photosOf(j) || []).map(p => p.id).sort().join(','),
                         rowNow: { name: row._name, file: row.file } });
      return o;
    }, { NO });
    const a = alerts(said);
    console.log('㊼b上書き保存の元ファイルの名前が変わった', short(r), short(a.map(m => m.slice(0, 60))));
    ok(!r.error, '㊼b止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 'A,B' && r.btn.pressed && /上書き保存/.test(r.btn.text), '㊼b試験の前提: 📁 で読んだ戸別を開き、💾 上書き保存を押せる → ' + short(r));
      ok(r.tree.join() === NO + '.json' && r.tel === '090-1111-2222' && r.file === 'A,B',
         '★㊼b元ファイルの名前が変わったら書けない（同じフォルダの ' + NO + '.json に付け直さない）・古い名前を作り直した・写真が A・B のままではない → ' + short(r));
      ok(r.rowNow.name === NO + '.json', '★㊼b行が ' + NO + '.json に付け直されていない（次の保存も無い名前へ行く） → ' + short(r.rowNow));
      ok(a.some(m => /✅ 上書き保存しました/.test(m)) && !a.some(m => /少し待って|見つかりません/.test(m)),
         '★㊼b上書き保存できたと知らせない・「少し待って」「見つかりません」と断った → ' + short(a.map(m => m.slice(0, 80))));
    }
    await ctx.close();
  }

  // ---- ㊼c 物件なし・📁 の行（図面あり・A・B）を開いている → 元ファイルの中身が壊れた（同期のぶつかりで途中で切れた等）----
  //   → 💾 上書き保存で「この画面の中身で書き直しますか」と聞く。キャンセル → 書かない（「少し待って」とは言わない）
  //   → もう一度押して OK → 画面の中身（A・B・直した電話）で書き直す（読めるファイルに戻る）
  if(want('㊼c')){
    const { ctx, page } = await openMain('㊼c');
    const r = await run(page, async ({ NO }) => {
      const N = NO + '.json';
      const A = __jpeg(900, 700, 0.85, 275), B = __jpeg(900, 700, 0.85, 276);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [N]: JSON.stringify(base, null, 2) });
      const fh = await list.getFileHandle(N);
      const row = buildListRow(N, 1, JSON.parse(list.__files[N]), fh);
      row._dir = list; row._name = N; row._dirPath = '';
      slimListRow(row, true);
      _listRows = [row];
      const asked = []; let answer = false;
      window.confirm = m => { asked.push(String(m)); return /壊れて/.test(String(m)) ? answer : true; };
      const al = []; const oa = window.alert; window.alert = m => { al.push(String(m)); };
      const o = {};
      try {
        await openCaseInEditor(row);
        o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',');
        const broken = list.__files[N].slice(0, 300);                  // 途中で切れたファイル
        list.__files[N] = broken;
        __setTel('090-1111-2222');
        o.btn1 = await __pressSave();                                  // 「書き直しますか」→ キャンセル
        o.first = { asked: asked.filter(m => /壊れて/.test(m)).length, untouched: list.__files[N] === broken, writes: list.__writes.length, alerts: al.slice() };
        answer = true; asked.length = 0; al.length = 0;
        o.btn2 = await __pressSave();                                  // もう一度押して OK
        o.second = { asked: asked.filter(m => /壊れて/.test(m)).length, alerts: al.slice() };
      } finally { window.alert = oa; }
      let j = null; try { j = JSON.parse(list.__files[N]); } catch(_){}
      o.valid = !!j; o.file = j ? (__photosOf(j) || []).map(p => p.id).sort().join(',') : '(壊れたまま)'; o.tel = j ? j.chosho_cust_tel : '';
      return o;
    }, { NO });
    console.log('㊼c上書き保存の元ファイルが壊れている', short(Object.assign({}, r, { first: r.first && Object.assign({}, r.first, { alerts: (r.first.alerts || []).map(m => m.slice(0, 50)) }),
                                                                              second: r.second && Object.assign({}, r.second, { alerts: (r.second.alerts || []).map(m => m.slice(0, 50)) }) })));
    ok(!r.error, '㊼c止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 'A,B' && r.btn1.pressed && /上書き保存/.test(r.btn1.text) && r.btn2.pressed, '㊼c試験の前提: 📁 で読んだ戸別を開き、💾 上書き保存を押せる → ' + short(r));
      ok(r.first.asked === 1 && r.first.untouched && r.first.writes === 0,
         '★㊼c元ファイルが壊れているとき、この画面の中身で書き直すか聞かない・キャンセルなのに書いた → ' + short(r.first));
      ok(!r.first.alerts.some(m => /少し待って/.test(m)), '★㊼c壊れたファイルなのに「少し待ってから、もう一度」と言う（待っても直らない） → ' + short(r.first.alerts.map(m => m.slice(0, 80))));
      ok(r.second.asked === 1 && r.valid && r.file === 'A,B' && r.tel === '090-1111-2222' && r.second.alerts.some(m => /✅ 上書き保存しました/.test(m)),
         '★㊼c「書き直す」を選んでも、画面の中身（A・B・直した電話）で書き直さない（壊れたまま） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊼d 物件あり・📁 の行（古い名前 リスト/管理番号.antenna.json・図面あり・A・B）を開いている ----
  //   → 協力会社諸経費のそろえ直しが その戸別ファイルを書き、名前を 管理番号.json にそろえた（古い名前は消えた）
  //   → 💾 上書き保存 の行き先も 管理番号.json に付け替わる（確かめの窓・ボタンに新しい名前が出る・直しが入る・古い名前を作り直さない）
  if(want('㊼d')){
    const { ctx, page, said } = await openMain('㊼d');
    const r = await run(page, async ({ NO, PN }) => {
      const OLD = NO + '.antenna.json';
      const A = __jpeg(900, 700, 0.85, 277), B = __jpeg(900, 700, 0.85, 278);
      await __openProj(__proj178('pj178od', PN, []));
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [OLD]: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      _projDirHandle = root;                                           // 工事フォルダとつながっている
      window.showDirectoryPicker = async () => root;
      const fh = await list.getFileHandle(OLD);
      const row = buildListRow('リスト/' + OLD, 1, JSON.parse(list.__files[OLD]), fh);   // 📁 フォルダ（その１）で読んだ行
      row._dir = list; row._name = OLD; row._dirPath = 'リスト/';
      slimListRow(row, true);
      _listRows = [row];
      const asked = [];
      window.confirm = m => { asked.push(String(m)); return true; };
      await openCaseInEditor(row);
      const b = document.getElementById('btn-save-overwrite');
      const o = { shown: (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(','), btn0: b.textContent, title0: b.title };
      o.note = String(await _genbaWriteRowIndividual(row) || '').slice(0, 160);   // 協力会社諸経費のそろえ直しと同じ書き方（開いている戸別も書く）
      o.treeAfterAlign = __tree(root);
      o.titleAfterAlign = b.title;
      __setTel('090-1111-2222');
      asked.length = 0;
      o.btn = await __pressSave();                                     // 💾 上書き保存
      o.askedSave = asked.map(m => m.slice(0, 200));
      const j = JSON.parse(list.__files[NO + '.json'] || '{}');
      Object.assign(o, { tree: __tree(root), tel: j.chosho_cust_tel || '', file: (__photosOf(j) || []).map(p => p.id).sort().join(','),
                         removed: list.__removed.slice() });
      return o;
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊼dそろえ直しで開いている戸別の名前が変わった', short(r), short(a.map(m => m.slice(0, 60))));
    ok(!r.error, '㊼d止まった → ' + r.error);
    if(!r.error){
      ok(r.shown === 'A,B' && /上書き保存/.test(r.btn0) && /antenna/.test(r.title0) && /統一/.test(r.note) && r.treeAfterAlign.join() === 'リスト/' + NO + '.json' && r.btn.pressed,
         '㊼d試験の前提: 古い名前の戸別を開いて「💾 上書き保存」、そろえ直しで ' + NO + '.json にそろって古い名前が消える → ' + short(r));
      const cf = r.askedSave.filter(m => /元ファイルに上書き保存します/.test(m))[0] || '';
      ok(new RegExp(NO + '\\.json').test(r.titleAfterAlign) && !/antenna/.test(r.titleAfterAlign) && new RegExp('ファイル: ' + NO + '\\.json').test(cf),
         '★㊼dそろえ直しで名前が変わったのに、💾 上書き保存 の行き先（ボタン・確かめの窓）が古い名前のまま → ' + short(r.titleAfterAlign) + ' / ' + short(cf));
      ok(r.tree.join() === 'リスト/' + NO + '.json' && r.tel === '090-1111-2222' && r.file === 'A,B',
         '★㊼d💾 上書き保存で ' + NO + '.json に直しが入らない・古い名前を作り直した・写真が A・B のままではない → ' + short(r));
      ok(a.some(m => /✅ 上書き保存しました/.test(m)) && !a.some(m => /少し待って|見つかりません/.test(m)),
         '★㊼d上書き保存できたと知らせない・「少し待って」「見つかりません」と断った → ' + short(a.map(m => m.slice(0, 80))));
    }
    await ctx.close();
  }

  // ---- ㊽b 物件なし・📁 の行（図面あり・A・B）：開いて B を画面で消し、一覧へ戻る（行は A）→ 開いたまま 📥 現場取込（G。ファイルへは書かない）----
  //   → 画面は A・G → 開き直して 💾 上書き保存 → ファイルは A・G（画面で消した B は戻らない）
  if(want('㊽b')){
    const { ctx, page, said } = await openMain('㊽b');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(900, 700, 0.85, 284), B = __jpeg(900, 700, 0.85, 285), G = __jpeg(900, 700, 0.85, 286);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行（物件なし）
      row._dir = list; row._name = NO + '.json'; row._dirPath = '';
      slimListRow(row, true);
      _listRows = [row];
      window.confirm = () => true;
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = { proj: !!_currentProject };
      await openCaseInEditor(row);
      o.shown1 = shown();
      removePhotoEntry(STATE.photos.findIndex(p => p && p.id === 'B'));   // 画面で B を ✕
      try { renderPhotoInputs(); } catch(_){}
      try { markEditorDirty(); } catch(_){}
      openListView();                                                  // 一覧へ戻る（行は A）
      o.row1 = ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',');
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '');   // 📥 現場取込（物件なし＝ファイルへは書かない）
      o.fileAfterImport = ids();
      o.screenAfterImport = shown();
      o.editing = _editingRow === row;
      { const b = document.getElementById('btn-save-overwrite');      // 開いたまま 📥 したあとのボタン
        o.btnAfterImport = { text: b && b.textContent, disabled: !!(b && b.disabled) }; }
      await openCaseInEditor(row);                                     // 開き直す
      o.shown2 = shown();
      __setTel('090-1111-2222');
      o.btn = await __pressSave();                                     // 💾 上書き保存
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO });
    const a = alerts(said);
    console.log('㊽b画面で消した写真と開いている戸別への現場取込', short(r), short(a.slice(-1).map(m => m.slice(0, 60))));
    ok(!r.error, '㊽b止まった → ' + r.error);
    if(!r.error){
      ok(!r.proj && r.shown1 === 'A,B' && r.row1 === 'A' && r.fileAfterImport === 'A,B' && r.editing && r.btn.pressed && /上書き保存/.test(r.btn.text)
         && r.tel === '090-1111-2222',
         '㊽b試験の前提: 画面で B を消して戻り（行は A）、開いたまま 📥（ファイルは A・B のまま）、開き直して上書き保存できる → ' + short(r));
      ok(r.screenAfterImport === 'A,G' && r.shown2 === 'A,G', '★㊽b開いている戸別へ 📥 したあと、画面が A・G にならない（消した B が戻った・G が出ない） → ' + short(r));
      ok(r.file === 'A,G', '★㊽b開いている戸別へ 📥 したあとの上書き保存で、画面で消した写真 B が戸別ファイルに戻った・G が入らない → ' + short(r));
      ok(r.btnAfterImport && !r.btnAfterImport.disabled && /上書き保存/.test(r.btnAfterImport.text || ''),
         '★㊽b開いている戸別へ 📥 したあと、「💾 上書き保存」が押せないまま → ' + short(r.btnAfterImport));
    }
    await ctx.close();
  }

  // ---- ㊽c 物件あり・工事フォルダとつながっている・📁 の行（常駐させない・A・B）を開いて戻る → 開いたまま 📥 現場取込（G）----
  //   → ファイルは A・B・G・画面も A・B・G・行は「ファイルから読む」に戻る（一覧の写真・工事調書の写真は3枚）
  //   → 直して戻る → 行の写真 A・B・G → 物件（端末内）に縮小版3枚（枚数3）
  //   （前は行・画面・物件・工事調書が 現場の写真 G だけになっていた）
  if(want('㊽c')){
    const { ctx, page } = await openMain('㊽c');
    const r = await run(page, async ({ NO, PN }) => {
      const A = __jpeg(900, 700, 0.85, 287), B = __jpeg(900, 700, 0.85, 288), G = __jpeg(900, 700, 0.85, 289);
      const PID = 'pj178gc';
      await __openProj(__proj178(PID, PN, []));
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                     chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(base, null, 2) }, {}, { resolve: true });
      _projDirHandle = list;                                           // 工事フォルダとつながっている
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      row._dir = list; row._name = NO + '.json'; row._dirPath = '';
      slimListRow(row, true);
      _listRows.push(row);
      window.confirm = () => true;
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const held = () => ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const cdl = () => cdlPhotoText({ row, printable: true, locked: false }).t;   // 工事調書（まとめ印刷）の写真の欄
      const o = {};
      await openCaseInEditor(row); o.shown1 = shown();
      openListView(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.slimBack = !!row._slim;
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);   // 📥 現場取込
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.fileAfterImport = ids();
      o.screenAfterImport = shown();
      o.rowAfterImport = { held: held(), count: row._photoCount };
      o.load = ((await loadRowPhotos(row)).photos || []).map(p => p.id).sort().join(',');   // 一覧の写真（📷）
      o.cdl1 = cdl();
      closeListView(); __setTel('090-1111-2222'); openListView();      // 直して一覧へ戻る
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.rowBack = held();
      await projSaveNow();
      const idb = await __idbPhotos(PID, NO);
      o.idb = { n: idb.photos.length, count: idb.count, ids: idb.photos.map(p => p.id).sort().join(',') };
      o.cdl2 = cdl();
      o.fileEnd = ids();
      return o;
    }, { NO, PN });
    console.log('㊽c常駐させない行へ現場取込（開いたまま）', short(r));
    ok(!r.error, '㊽c止まった → ' + r.error);
    if(!r.error){
      ok(r.shown1 === 'A,B' && r.slimBack && /戸別の個別JSONも更新しました/.test(r.note) && r.fileAfterImport === 'A,B,G',
         '㊽c試験の前提: 開いて戻り（行は常駐させない）、開いたまま 📥 で戸別ファイルが A・B・G になる → ' + short(r));
      ok(r.screenAfterImport === 'A,B,G', '★㊽c開いている戸別へ 📥 したあと、画面にファイルの写真（A・B）が出ない → ' + short(r.screenAfterImport));
      ok(r.load === 'A,B,G' && r.rowAfterImport.count === 3 && r.cdl1 === '3枚',
         '★㊽c📥 で戸別ファイルに全部入ったのに、行（一覧の写真・工事調書）が現場の写真だけ（ファイルから読み直さない） → ' + short(r));
      ok(r.rowBack === 'A,B,G' && r.idb.n === 3 && r.idb.count === 3 && r.idb.ids === 'A,B,G' && r.cdl2 === '3枚' && r.fileEnd === 'A,B,G',
         '★㊽c直して戻ったあと、行・物件（端末内）・工事調書の写真が A・B・G の3枚ではない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊿b 共有の物件・受付台帳で作った行（写真24枚・戸別ファイルなし）。ほかの端末が物件を保存していた ----
  //   開いて電話を直す → 自動保存の縮小版づくりが始まる（遅い）→ そのあいだに もう一度直して b) 一覧へ戻る／b2) 💾 物件に保存 を押す（写真には触らない）
  //   → 作った縮小版をそのまま使う（写真は同じ。捨てて作り直さない）→ まとめたあとも行は24枚・物件（端末内）に縮小版24枚・開き直しても24枚
  //   （前は縮小版を捨てて「写真なし」で物件に保存し、ほかの端末の保存とまとめると、行の写真が全部消えていた）
  for(const sc of ['㊿b', '㊿b2'].filter(want)){
    const { ctx, page, said } = await openMain(sc);
    const press = (sc === '㊿b2');
    const r = await run(page, async ({ NO, PN, press }) => {
      const PID = 'pj178tb' + (press ? '2' : '');
      await __openShared(__proj178(PID, PN, []));
      const ph = []; for(let i = 0; i < 24; i++) ph.push({ id: 'k' + i, label: '写真' + i, dataUri: __jpeg(900, 700, 0.85, 400 + i) });
      const X = buildListRow('manual:x', 0, { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                                              amplifier: 'amp_3u43', chosho_photos: ph }, null);       // 受付台帳で作り、このPCで写真を入れた戸別
      X._manual = true; X._photosKnown = true;
      _listRows.push(X);
      await projSaveNow();                                             // 一度保存（共有ファイル・端末内に縮小版24枚）
      const o = { first: __diskPhotos(NO), idb0: (await __idbPhotos(PID, NO)).photos.length };
      await openCaseInEditor(X);
      __setTel('090-1111-2222');                                       // 直す
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      __otherDeviceSaves('2612MKM099');                                // ほかの端末が物件を保存していた
      // 縮小版づくりを遅くする（写真が多い・大きい）：放すまで止めておく。作った回ごとに数える
      const orig = makeThumbDataUri, origP = prepareProjectThumbs;
      let release; const gate = new Promise(res => { release = res; });
      let hits = 0; const made = [];
      makeThumbDataUri = async (...a) => { hits++; await gate; return orig(...a); };
      prepareProjectThumbs = async s => { const h0 = hits; try { return await origP(s); } finally { made.push(hits - h0); } };
      let pressP = null;
      try {
        const A = projSaveNow();                                       // 1.5秒あとの自動保存（縮小版づくりが始まる）
        for(let i = 0; i < 400 && !hits; i++) await new Promise(res => setTimeout(res, 10));
        o.started = hits > 0;
        const data0 = X.data;
        __setTel('090-1111-3333');                                     // 続けて直して
        if(press){ __abortPicker(); pressP = __pressSave(); }          // b2) 💾 物件に保存（工事フォルダは選ばない）
        else openListView();                                           // b) 一覧へ戻る
        o.replaced = X.data !== data0;                                 // 行の中身（写真の入れ物も）が新しくなった
        await new Promise(res => setTimeout(res, 50));
        release();
        await A;
        if(pressP) o.press = await pressP;
        for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued); i++){
          if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
          await new Promise(res => setTimeout(res, 50));
        }
      } finally { makeThumbDataUri = orig; prepareProjectThumbs = origP; }
      o.made = made.slice();
      const cur = () => _listRows.filter(x => x.data && x.data.chosho_mgmt_no === NO)[0];
      const orig24 = row => { const a = ((row && row.data.chosho_photos) || []).filter(p => p && p.dataUri);
        return a.length + (a.every((p, i) => ph[i] && p.id === ph[i].id && p.dataUri === ph[i].dataUri) ? '' : '（元の写真ではない）'); };
      o.rebuilt = cur() !== X;
      o.row = orig24(cur());
      const idb = await __idbPhotos(PID, NO);
      o.idb = { n: idb.photos.length, count: idb.count, thumb: idb.thumb };
      o.disk = __diskPhotos(NO);
      await applyProject(await projIdbGet(PID), { silent: true });     // 物件を開き直す
      o.reopen = orig24(cur());
      return o;
    }, { NO, PN, press });
    const a = alerts(said);
    console.log(sc + '縮小版づくりのあいだに直して戻った（写真は同じ）', short(r), short(a.slice(-1).map(m => m.slice(0, 60))));
    ok(!r.error, sc + '止まった → ' + r.error);
    if(!r.error){
      ok(r.first.n === 24 && r.idb0 === 24 && r.started && r.replaced && r.rebuilt && (!press || (r.press && r.press.pressed && /物件に保存/.test(r.press.text))),
         sc + '試験の前提: 24枚の行を物件に入れ、縮小版づくりのあいだに行の中身が新しくなり、ほかの端末の保存とまとめて行が作り直される → ' + short(r));
      ok(r.made[0] === 24, '★' + sc + '画面から戻っただけ（写真は同じ）なのに、作った縮小版を捨てた（作り直した） → 1回目の縮小版づくりで作った枚数 ' + short(r.made));
      ok(r.row === '24' && r.idb.n === 24 && r.idb.count === 24 && r.idb.thumb && r.disk.n === 24 && r.reopen === '24',
         '★' + sc + '縮小版づくりのあいだに直して戻ったら、まとめたあと行・物件（端末内・共有ファイル）の写真が消えた・減った → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊿c 同じ（共有の物件・受付台帳で作った行 写真24枚・ほかの端末が保存していた）。開いて電話を直す ----
  //   縮小版づくりが一度だけ失敗した（作れないまま）→ 物件には「写真なし（枚数24）」で入り、ほかの端末の保存とまとめて行が作り直される
  //   → 作り直した行に、この端末が持っていた元の写真24枚を戻す → 次の保存で物件（端末内・共有ファイル）に縮小版24枚・開き直しても24枚
  //   （前は作り直した行に写真が無く、戸別ファイルも無いので、写真がどこにも残らなかった）
  if(want('㊿c')){
    const { ctx, page } = await openMain('㊿c');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178tc';
      await __openShared(__proj178(PID, PN, []));
      const ph = []; for(let i = 0; i < 24; i++) ph.push({ id: 'k' + i, label: '写真' + i, dataUri: __jpeg(900, 700, 0.85, 430 + i) });
      const X = buildListRow('manual:x', 0, { chosho_mgmt_no: NO, chosho_cust_name: '台帳 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                                              amplifier: 'amp_3u43', chosho_photos: ph }, null);
      X._manual = true; X._photosKnown = true;
      _listRows.push(X);
      await projSaveNow();
      const o = { first: __diskPhotos(NO), idb0: (await __idbPhotos(PID, NO)).photos.length };
      await openCaseInEditor(X);
      __setTel('090-1111-2222');
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      __otherDeviceSaves('2612MKM099');
      const orig = makeThumbDataUri;
      let failed = 0;
      makeThumbDataUri = async (...a) => { if(!failed){ failed++; throw new Error('縮小版を作れませんでした'); } return orig(...a); };
      try { await projSaveNow(); } finally { makeThumbDataUri = orig; }   // 縮小版を作れないまま保存 → ほかの端末の保存とまとめる
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      for(let i = 0; i < 100 && (_projSaving || _projSaveQueued); i++) await new Promise(res => setTimeout(res, 50));
      const cur = () => _listRows.filter(x => x.data && x.data.chosho_mgmt_no === NO)[0];
      const orig24 = row => { const a = ((row && row.data.chosho_photos) || []).filter(p => p && p.dataUri);
        return a.length + (a.every((p, i) => ph[i] && p.id === ph[i].id && p.dataUri === ph[i].dataUri) ? '' : '（元の写真ではない）'); };
      o.failed = failed;
      o.rebuilt = cur() !== X;
      const idbA = await __idbPhotos(PID, NO);
      o.afterA = { idb: idbA.photos.length, count: idbA.count, disk: __diskPhotos(NO) };
      o.row = orig24(cur());
      await projSaveNow();                                             // 次の保存
      for(let i = 0; i < 100 && (_projSaving || _projSaveQueued); i++) await new Promise(res => setTimeout(res, 50));
      const idb = await __idbPhotos(PID, NO);
      o.idb = { n: idb.photos.length, count: idb.count, thumb: idb.thumb };
      o.disk = __diskPhotos(NO);
      await applyProject(await projIdbGet(PID), { silent: true });     // 物件を開き直す
      o.reopen = orig24(cur());
      return o;
    }, { NO, PN });
    console.log('㊿c縮小版を作れないまま物件に入り、まとめで作り直された', short(r));
    ok(!r.error, '㊿c止まった → ' + r.error);
    if(!r.error){
      ok(r.first.n === 24 && r.idb0 === 24 && r.failed === 1 && r.rebuilt && r.afterA.idb === 0 && r.afterA.count === 24,
         '㊿c試験の前提: 縮小版を作れないまま「写真なし（枚数24）」で物件に入り、まとめで行が作り直される → ' + short(r));
      ok(r.row === '24', '★㊿c作り直した行に、この端末の元の写真24枚が戻らない（戸別ファイルも無く、写真がどこにも残らない） → ' + short(r.row));
      ok(r.idb.n === 24 && r.idb.count === 24 && r.idb.thumb && r.disk.n === 24 && r.reopen === '24',
         '★㊿c次の保存で、物件（端末内・共有ファイル）に縮小版24枚が入らない・開き直すと写真が無い → ' + short(r));
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
