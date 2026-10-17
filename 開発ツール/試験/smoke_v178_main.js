/* 版178（メイン）
   物件を開いていて（工事フォルダとつながっていない）、ファイルのつながっていない戸別に
   エディタで写真を足して「物件に保存」すると、戸別ファイル（管理番号.json）に
   元の写真ではなく 物件用の縮小版（長辺512px）が書かれていた（192KB の写真が 40KB に）。
   物件の保存（prepareProjectThumbs）が、行の写真そのものを縮小版に置き換えていたため。
   ★決まり★ 戸別ファイルには、いつも元の写真（約1MBを超えるものだけ photoFitForStorage で縮めたもの）を書く。
   縮小版は物件（端末内の IndexedDB・共有ファイル）の保存のためだけに使う。どの経路でも写真の枚数は減らさない。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① 物件の行（図面なし・写真なし）に写真を足して「物件に保存」→ フォルダを選ぶ → 新しい 管理番号.json の写真が
        エディタの写真と同じ（1文字も違わない）。物件（IndexedDB）には縮小版。行は（3回目の見直しで）縮小版を持ち、どのファイルに入っているかを覚える
        （預けたこと・預け先・読み直しの確かめは smoke_v178_mem_main.js）
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
     ㊻ 開き直すとき一度だけファイルを読めなかった → 開かない・知らせる。読めるときに開いて保存しても写真は消えない（a 図面あり・💾 上書き保存　b 図面なし・💾 物件に保存）
     ㊼ 💾 上書き保存で元ファイルを読み直せない → 書かない・知らせる（開いたあとで現場が足した写真を消さない）。読めるようになって押せば書く
     ㊽ 開いている戸別へ 📥 現場取込 → 直して戻って開き直し 💾 上書き保存 → 前に見せた写真（ファイルにある）を消さない
     ㊾ 📥 現場取込で行にだけ入った写真（ファイルに書けなかった）→ 開くと画面に出る・保存でファイルに入る（a 物件なし・図面あり　b 物件あり・図面なし）
     ㊿ 縮小版づくり（自動保存）のあいだに行の写真が変わった → 古い縮小版を付けない（足した写真の縮小版も物件に入る）
   （ここから 4回目の見直しの直し）
     ⑯f （直し）付け替え先が写真なし・名前の違うファイル → 同じお宅か聞く（両方の名前を見せる）。キャンセル → 書かない
     ⑯g （直し）名前が同じなら聞かずに書く　⑯h 聞いて OK → そのファイルへ書く（キャンセルのときは書かない）
     ⑯i まとめて書いているとき（📥・諸経費のそろえ直し）は聞かずに書かない・管理番号を確かめ、同じお宅なら開いて保存するよう知らせる
     ⑯j アパートの別の世帯（住所が同じ）のファイル → 住所だけでは同じお宅と見ない（聞いてキャンセル → 書かない）
     ㊸e 💾 反映で リスト を選んで一覧を読み直した → 覚える名前を工事フォルダから見た道のりに → 次の日の保存も リスト/管理番号.json へ
     ㊻c ファイルを読めない（図面なし・📥 で入れた写真が行にある）→ 開かない・行は「ファイルから読む」のまま・取り込んだ写真も持ったまま
     ㊼b 💾 上書き保存の元ファイルの名前がほかのPCで変わった → 同じフォルダの 管理番号.json に付け直して書く
     ㊼c 元ファイルが壊れている → この画面の中身で書き直すか聞く　㊼d そろえ直しで開いている戸別の名前が変わった → 行き先も付け替わる
     ㊽ （直し）開いている戸別へ 📥 → 画面にファイルの写真と現場の写真を合わせて出す
     ㊽b 画面で消した写真は、開いている戸別へ 📥 したあとの保存でも戻らない　㊽c 常駐させない行へ 📥 して書けた → 行は「ファイルから読む」に戻る
     ㊿b 縮小版づくりのあいだに直して戻った・物件に保存を押した（写真は同じ）→ 作った縮小版を使う（共有ファイルとまとめても写真が残る）
     ㊿c 縮小版を作れないまま物件に入り、まとめで行が作り直された → この端末の元の写真を戻す・次の保存で縮小版が入る
   （ここから 5回目の見直しの直し）
     ※ 物件の覚えている名前で見つからないとき工事フォルダの中を探して書く（㊸f）・物件の暗号の行を付いている .hyb の暗号の部分で開く（㉕d）は、
       アプリから外したので場面も外した（控えのフォルダまで数えた・現場のファイルを確かめずに上書きした・まとめて復号のあと古い図面で開いた）
     ⑯k まとめて書いているとき、付け替え先（写真なし・名前の違うファイル）と元のファイルが同じ管理番号（前の 💾 上書き保存で中の番号が変わった）
        → 聞かない・書かない・「同じ管理番号のファイルが2つ」あること、「🧩 重複をまとめる」で1つにすることを知らせる
     ㊻d 共有の物件・📁 の行（ファイルの写真 A・B）。一度だけ読めない → 開かない（物件は2枚のまま）。読めるときに開いて写真 P を足して戻る → 物件（行・端末内・共有ファイル）に3枚
     ㊸g ㊸e と同じ・反映のとき工事フォルダをまだつないでいない（前の日の工事フォルダを覚えている）→ 覚えている工事フォルダから見た道のりにそろえる
     ⑫e ⑫d と同じで、写真が小さい図（PNG。元の写真のほうが縮小版の JPEG より短い）→ 開き直しても元の PNG・戸別ファイルにも元の PNG
     ⑰b 小さい図・画面写し（PNG。元の写真のほうが縮小版の JPEG より短い）を物件にだけ保存 → 物件を開き直す・まとめる → 行は元の PNG のまま →
        物件に保存でフォルダを選ぶ → 戸別ファイルにも元の PNG（前は大きさで比べて、縮小版の JPEG が残り、戸別ファイルに書かれていた）
   （ここから 6回目の見直しの直し）
     ※ 写真をファイルに置いている戸別を、ファイルを読めないまま開く仕組みは外した（開かずに知らせる）。㊻・㊻c・㊻d はその形に直した
     ㊻e 図面のある戸別を開いているところへ 📥 現場取込 → 取り込んだあとの読み直しが一度だけ読めない → 画面はファイルの写真 A・B ＋ 取り込んだ G
         （行・物件も3枚・あとの保存でファイルも A・B・G）
     ㊻f 別の戸別 X を開いている → 読めない戸別 Y を開こうとした → 開かない・画面は X のまま（Y の備考が X の画面に入らない・石綿を直した印も残る）
   （ここから 7回目の直し：物件の覚えている名前が古い戸別（㊸h〜）・暗号の戸別の上書き保存（㉕e〜）・📥 で入れた写真だけが物件に入る（㊾c〜））
     ㊸h 物件の覚えている戸別ファイルの名前が古い（本当のファイルは リスト/管理番号.json に原寸 G）→ 新しく作るファイルの写真は元の写真・本当のファイルは元のまま
        （a 物件に保存・図面あり　b 図面なし　c 📥 現場取込　d 協力会社諸経費のそろえ直し）
     ㊸i 確かめられないとき　a) 本当のファイルを一度だけ読めない　b) 本当のファイルのある リスト を一度だけ開けない
         → 行の写真がみな縮小版なので作らない・どこを読めなかったか、どうすればよいかを知らせる → 読めるようになって押せば元の写真で作る
         c) 📥 現場取込で読めない（行に K の原寸がある）→ 作る（G は小さいまま・K は原寸）・※ で知らせる（⚠ は付けない）
         d) 関係の無いフォルダを開けない・本当のファイルは読める → 飛ばして続け、元の写真で作る（📁 の読み込みと同じ）
     ㊸j 控えのフォルダ（_整理前の控え）・写真のフォルダは見ない（📁 の読み込みと同じ）：そこが読めなくても断らない
     ㊸k 管理番号を付け替えた（077 → 078）：078 はほかのお宅のファイル（写真 S）→ 新しいファイルに S を入れない・G は 077 の原寸
     ㊸l 本当のファイルが Android の名前（管理番号_数字.json）→ 原寸を使う
     ㊸m 見て回らない（a 行に縮小版が無い（足した写真 P だけ）　b 管理番号の無い行＝探す番号が無い）→ 開けないフォルダがあっても今までどおり作る
     ㊸n 📷 で写真 P を足した・リストに読める本当のファイル（G の原寸）と途中で切れた Android の名前のファイル（H の原寸はここだけ）
         → 作る（G は原寸・H は小さいまま・P は元の大きさ）・切れたファイルの名前を ※ で知らせる・見つけたファイルは元のまま
     ㊸o 行の写真がみな縮小版・同じ番号のファイルは途中で切れたものだけ → 作らない・「工事フォルダの外へ移してから」と知らせる（📁 は勧めない）
         → 中身がそろって保存 → 元の写真（G・H）で作る
     ㊸p 見て回っているあいだに、工事フォルダの直下に 管理番号.json が届いた → 上書きしない・知らせる → もう一度保存で、届いたファイルへ書く（届いた写真 X も残る）
     ㊸q 同じ写真が2つのファイルにある → 目安の内に縮めたほう（pickBetterPhoto）を使う・縮小版より小さい写真では置き換えない
     ㉕e 物件の暗号の行（写真を剥がした封筒）に「💾 戸別ファイルへ反映」でファイルが付く → 開く（写真は出ない）→ 電話を直し写真 P を足して 💾 上書き保存
         →「写真が失われます」と聞かない・.hyb は A・B・P・電話が入る・もう一度押しても減らない・帯は「元の写真はそのまま残し」（old：ファイルの写真が古い形 {before, after}）
     ㉕f 📁 で読んだ .hyb の行を開いて直し、一覧へ戻って開き直す（写真の出ていない画面・行の写真 A・B は出る）→ 💾 上書き保存 → .hyb の写真 A・B はそのまま
     ㉕g 元ファイルの写真をほどけない → 書かない・わけを知らせる・「開き直して」とは言わない（pw：ほかで別のパスワードをかけ直した　bad：写真の部分が壊れている）
     ㉕h 元ファイルに写真が無い → 聞かずに書く（失うものが無い）
     ㉕i 写真の出ている画面で写真 B を消して 💾 上書き保存 → B は消える（今までどおり）
     ㉕j 開いている暗号の戸別へ 📥 現場取込（写真 P）→ 画面は P だけ・帯が出る → 💾 上書き保存 → .hyb は A・B・P（strip：写真の出ていない画面を直して戻ってから 📥）
         plain：開いている平文の戸別へ 📥 → 帯・印は出ない・上書き保存は今までどおり A・B・P
     ㉕k 写真の出ていない画面を開いたまま 🖨 工事調書をまとめて印刷 → 帯が残る → 💾 上書き保存 → .hyb は A・B
         shown：写真の出ている画面でまとめて印刷 → 帯・印は出ない・画面で消した B は上書き保存で消える
     ㉕l 物件の暗号の行が「💾 戸別ファイルへ反映」で平文の 管理番号.json（写真 A・B）に付いた → 💾 上書き保存 → 書かない・わけを知らせる（「📁 フォルダ」は案内しない）
     ㉕m 📁 の .hyb を開いて写真 P を足し、一覧へ戻って開き直す → 画面に A・B・P（写真の出ていない画面の印）→ 何もせずに戻ってもう一度開いても A・B・P →
         💾 上書き保存 → .hyb は A・B・P（pw：開き直すときパスワードを聞かれる　proj：物件の行に 💾 反映でファイルが付いた → 画面は P → .hyb は A・B・P）
         （8回目の見直し）開き直しても行は「ファイルから読む」に替えない（写真の出ていない画面のまま）・💾 のあと一覧へ戻ると 📷 にファイルの A・B・P
     ㉕n 全暗号化(.enc)の戸別を開いたまま 📥 現場取込（写真 G）→ 💾 上書き保存 は押せない（版177 と同じ）・.enc は A・B のまま
     ㉕o 写真の出ていない画面で、元の .hyb の終わりが欠けて読めない → 書かない（「この画面の中身で書き直しますか」と聞かない）・知らせる
     ㉕p 開き直すとき行の写真を出す決まり（8回目の見直しで今の形に）：写真を剥がした封筒で開いたときは、行の写真をいつも出す
         （当てにしてよい印が無くても＝📥 で入れた写真）。ファイルからほどいたときは、ファイルの写真に行にだけある写真を足して出す
         （置き換えない・同じ写真を二重にしない・ファイルに写真が無ければ行の写真）。名前だけの枠しか無いときは出さない（ファイルの写真も変えない）
     ㊾c 📥 現場取込で戸別ファイルへ書けなかった（常駐させない行・ファイルの写真 A・B）→ 物件（この端末・共有ファイル）に
         ファイルの写真と取り込んだ G の両方（縮小版・1枚ずつ・3枚）。行・ファイルは元のまま・一覧の枚数はファイルの枚数のまま
         （h ファイルだけ付いている行　src 📄 の行　ro 書くときだけ読めない　dupid／dupuri ファイルにもう同じ写真がある＝二重にしない
           zero ファイルに写真が無い → 物件に G・1枚）
     ㊾d 写真の無い取り込み（下見済みの印だけ）で書けなかった → 物件は A・B（2枚）のまま（前は「写真なし・0枚」）
         （a 工事フォルダを掴めない　b ファイルを読めない → 同期でファイルに C も入って読めるようになった次の保存で A・B・C）
     ㊾e 縮小版を作るときもファイルを読めない → 物件は前の縮小版 A・B に G を足したもの（3枚）。同期でファイルに C も入って
         読めるようになった次の保存で、ファイルから作り直す（A・B・C・G）。はじめの保存で読めなかったときも、次の保存で縮小版が入る
     ㊾f 物件に A・B・G が入ったあと、まとめ（a 自動保存　b 🔄 最新を取り込む）で行が作り直される → 行に G の元の写真・
         物件は A・B・G（1枚ずつ）・ほかの端末の戸別も残る・開いて物件に保存で戸別ファイルも A・B・G（元の写真）
     ㊾g 書けなかったあと 📮 預かりの振り分けを行に入れる → 行にだけあった G（元の写真）を落とさない・物件は A・B・G・S
     ㊾h アパートの帯の外の行（ファイルに S1・S2）をファイルの無い世帯（T1）へまとめる → 物件のその世帯は T1・S1・S2（3枚）
     ㊾i 書けなかった取り込みのあと縮小版を作るときも読めない → 読めるようになって 📁 を読み直す → 物件にファイルの写真 A が入る
         （読めずに作った縮小版を、このファイルの縮小版として覚えない。a 前に物件に保存してあった　b まだ保存していなかった）
     ㊾j ファイルを読めないまま取り込み・物件の保存、そのあいだにほかの端末が共有ファイルを保存 → 読めるようになる →
         物件はずっと A・B・G（2枚以上・最後は3枚）（a ほかの端末の保存が後　b 先　c 写真の無い取り込み → ずっと A・B）
     ㊾k 📄 の行で取り込みは工事フォルダのファイルへ書けたが、📄 で選んだファイルはもう読めない（Chrome）→ 物件は A・B・G
     ㊾l 同じ管理番号のファイルが2つ・古いほうへの取り込みが書けなかった → 物件は A・B・G・一覧の枚数はファイルの枚数のまま →
         🧩 重複をまとめる の残す方（既定）は、これまでどおり工事完了・測定値のある 管理番号.json
   （ここから 7回目の見直しの直し：断るかどうかは、元の写真を探す前の行の写真で・物件にそのまま入る写真だけが「物件の縮小版」（㊸r〜㊸t））
     ㊸r 行の写真がみな縮小版（G・H）・リストの本当のファイルに G の原寸・H の原寸は Android の名前のファイルだけ（1 同期の途中で読めない　2 途中で切れている）
         → 見つけた G の原寸を「画面にしか無い元の写真」と数えない＝作らない・知らせる → 読めるようになって保存 → 元の写真（G・H）で作る
         （前は G 原寸・H 縮小版で作り、そのあとは H がずっと縮小版のままだった）
     ㊸s 小さい図（PNG・400×300。物件には作り直した JPEG しか入らない）を 📷 で足して 💾 物件に保存
         u) 物件にだけある戸別・関係の無いフォルダを開けない　b) 物件にだけある戸別・途中で切れた Android の名前の残り
         → 作る・PNG は1文字も違わない・見て回らない・※ を付けない
         g) 物件の覚えている名前が古い行（G は縮小版）・同じ番号のファイルは途中で切れたものだけ → 作る（G は縮小版のまま・PNG は元のまま）・※ で知らせる
         （前は PNG を物件の縮小版と取り違えて断り、アプリを閉じると物件の JPEG しか残らず、元の PNG が消えた）
         j) 小さい JPEG（400×300・150000字未満＝物件にそのまま入る）＋ b → これまでどおり作らない・物件（端末内）の写真は足した写真と同じ →
            アプリを開き直し、残りを工事フォルダの外へ移して保存 → 足した写真のまま作る（何も失わない）
     ㊸t 長辺512px で 150000字を超える JPEG（物件には作り直したものが入る）は元の写真（u・g は ㊸s と同じ）
         → 作る・1文字も違わない（g は ※ で知らせる）・物件（端末内）には作り直した縮小版
   （ここから 8回目の見直しの直し：見つけた同じ写真は、縮小版より大きいか、物件の縮小版でない（PNG の図など）なら使う（㊸u））
     ㊸u 物件の覚えている名前が古い行。物件の縮小版 G'・P' は、物件の縮小版づくりが 900px の JPEG G と 400×300 の PNG の図 P から作ったもの。
         リスト/管理番号.json に G と PNG の P（同じ写真ID）がある　a) 読めない所なし　u) 関係の無い 打合せ フォルダを開けない
         → 新しいファイルは G と PNG の P（1文字も違わない）・断らない・※ を付けない・見つけたファイルは元のまま
         （前は長辺が同じ 400 なので PNG を使わず、物件の JPEG を入れた（a）・PNG の縮小版が残ったと数えて断った（u））
     ㊾m （7回目の見直し）共有の物件・📁 の行（ファイルの写真 A・B）。ファイルを読めないあいだに 📥 で G1 を取り込む（書けない・前の縮小版 A・B を残す）
         → 自動保存の縮小版づくりが G1 を縮めているあいだに、同じ管理番号のもう1つの現場ファイル（G1・G2）を 📥 → その保存でほかの端末の保存とまとめる
         → その保存のうちに作り直し、物件（この端末・共有ファイル）は A・B・G1・G2・作り直した行に G1・G2 の元の写真・読めるようになっても同じ
         （作り直せたら作り直しの印を消す＝同じ保存で同じ写真を何度も縮めない。（📥 の画面）同じことを 📥 の画面で）
     ㊾m2（8回目の見直し）📁 の2つの戸別 X（A・B・ファイルを読めない）・Y（C・D）。1回の 📥 で Y を取り込み（書けた）、Y の縮小版づくりのあいだに
         X に GX を取り込む（書けない）→ その保存でほかの端末の保存とまとめる → 縮小版づくりを始めたときに選ばなかった X も同じ回で作り直し、
         物件の X は A・B・GX・作り直した X の行に GX の元の写真・読めるようになっても同じ（（📥 の画面）同じことを 📥 の画面で）
   （ここから 7回目・8回目の見直しの直し：📥 のあとの暗号の戸別の一覧の枚数（㊾n））
     ㊾n 📁 で読んだ .hyb・.enc（写真 A・B）を 🔓 まとめて復号 → 📥 現場取込（ボタン・取り込み窓の「🔀 取り込む」）
         写真 G の取り込み → 一覧（工事別フォルダ）の「写真」欄は「―」（写真なし）にしない・押せて写真が出る（枚数は 0 でない）
         写真の無い取り込み → 🔒（開くまで分からない）のまま。平文の常駐させない行の枚数はファイルの枚数のまま
         （f 物件なし＝2　p 物件あり・戸別ファイルへ書けて 3。前は暗号の行の「分からない」を 0 にして「―」と出し、押せなかった）
         r .hyb を開いて電話を直して一覧へ → 開き直して 💾 上書き保存（直さずに）→ 一覧へ（行の写真は空・枚数は 2）→
           写真の無い取り込み → 「📷 2」のまま押せる（前は 0 にして「―」）→ 写真 G の取り込み → 枚数は 2 より減らない（前は 1）
   （ここから 8回目の見直しの直し：暗号の戸別（.hyb）を開いても「ファイルから読む」に替えない・📷 と書き出しと一括再暗号化は
     剥がした封筒ならファイルの写真を読む・暗号の行が持つ写真はいつも出す（㉕q〜㉕u））
     ㉕q 📁 の .hyb（A・B・増幅器 3U）を 🔓 して開き、増幅器を 1U に直して一覧へ戻る（reopen：開き直して、何もせずに戻ってから）
         → 📷 写真セルのプレビュー・📸 写真の一括書き出し・📄 一括平文化・🔄 一括再暗号化（新しいパスワード）が、ファイルの写真 A・B を読む（飛ばさない）
         → 平文化・再暗号化で書いた中身は A・B・増幅器 1U（行で直したところを、ファイルの古い中身で戻さない）
         （前は行が写真を剥がした封筒のままで、📷 は「写真が登録されていません」、📸 は「鍵がなくスキップ」、🔄 は「写真未復元のため保全スキップ」）
     ㉕r 🔓 した 📁 の .hyb（A・B。開いていない）へ 📥 現場取込（写真 G）→ 開く → 写真の出ている画面に A・B・G
         → 何もせずに戻ってもう一度開いても A・B・G → 💾 上書き保存 → .hyb は A・B・G（前はファイルの A・B だけを出し、G が行からも消えた）
     ㉕s 📁 の .hyb を開いて P を足して戻り、開き直して（写真の出ていない画面）💾 上書き保存（A・B・P）→ 何もせずに戻る
         → 行は、行にだけ持っていた写真を捨てて、ファイルから読む（📷 は A・B・P）→ 開き直すと写真の出ている画面に A・B・P
         → P を消して 💾 上書き保存（A・B）→ 何もせずに戻って開き直しても P は戻らない
         （''：「💾」の働きだけ　click：利用者と同じにボタンを押す・× で消す）
     ㉕t 📁 の .hyb（A・B・増幅器 3U）を開いて 1U に直して戻る → 開く（見るだけ）→ 戻る → 開く → 画面も行も 1U → 💾 上書き保存で .hyb も 1U
         （pw：2回目からはパスワードを聞かれて開く　proj：物件（共有ファイル）を開いている → 3回目に開いて備考を直して戻っても、共有ファイルは 1U のまま。
           前は開くたびに行を「ファイルから読む」に替え、3回目にファイルの古い 3U で画面・行・物件・.hyb を戻していた）
     ㉕u 📥 で暗号の戸別に入れた写真 G が、写真の出ていない画面で開いても消えない
     ㉕v 暗号の戸別を直して戻ってから 🔄 一括再暗号化（新しいパスワード）→ 行の封筒もファイルと同じ鍵の元になる・新しいパスワードで開いて 💾 上書き保存できる
     ㉕w 直して戻ったあと、ほかのPCが .hyb を書き替えた（鍵の元が新しい）→ 🔄 一括再暗号化はこの戸別を飛ばして知らせる（ファイルはほかのPCが書いたまま）
     ㉕x 暗号の戸別へ 📥 現場取込（現場の増幅器）→ 封筒の暗号でない部分にも入る：開くと現場の増幅器・💾 で .hyb にも・物件（共有ファイル）にも
     ㉕y 物件のファイルから読む .hyb に受付台帳で「完了」→ 🔄 一括再暗号化（パスワードそのまま・新しいパスワード）→ 物件に「完了」が残る・物件の封筒も新しい鍵
     ㉕z ほかのPCが物件で「完了」を付けた（この端末はまだ取り込んでいない）→ 🔄 一括再暗号化 → 物件の保存で「完了」を消さない
     ㉕yS ほかのPCが物件なしで .hyb を書き替えた（新しい鍵の元・1U）→ 🔄 → 物件の封筒は、いまのファイルの中身（1U）＋受付台帳の「完了」＋新しい鍵（古い中身に新しい鍵を付けない）
     ㉕yL この端末は受付台帳を直していない・ほかのPCが .hyb に「完了」（備考）を入れた → 🔄 → 物件の封筒にもほかのPCの「完了」（備考）（古い写しをかぶせない）
     ㉕yM 受付台帳で作った行に「完了」→ 📁 で同じ番号の .hyb と重なって「台帳を優先」（まとめて復号は キャンセル）→ 🔄 → 物件は「完了」・台帳の日程のまま
     ㉕zM ほかのPCが物件を保存（この戸別は直していない）→ 🔄 → まとめても物件のこの戸別は新しい鍵（keep・newpw）
     ㉕zf 📄 ファイルで読んだ .hyb へ 📥（G・1U-BC）→ 開くと A・B・G（読んだファイルの写真を差し込む）・保存の中身も A・B・G（nog：現場の写真なし　gpw：聞かれたパスワードで）
     ㉕zk 📄 ファイルで読んだ .hyb で B を消し A を「玄関」にして戻る → 開き直しても A「玄関」だけ・保存も同じ・一括平文化も A は「玄関」
     ㉕ze 📄 ファイルで読んだ .hyb を直して P を足して戻る → 📄 一括平文化・🔄 一括再暗号化が A・B・P・直しを書き出す（飛ばさない・P を抜かない）
         A：物件の暗号の行に「💾 戸別ファイルへ反映」でファイルが付いた → 📥 G → 開く → 画面に G（帯あり）・行に G → 戻ってもう一度開いても G
            → 💾 上書き保存 → .hyb は A・B・G
         U：📁 の .hyb へ 📥 G → 開くときだけファイルを読めない → 画面に G（帯あり）・行に G → 次に開くと A・B・G → 💾 上書き保存 → .hyb は A・B・G
         （前は行の写真を当てにしてよい印が無いと出さず、行からも外して、G がどこにも残らなかった）
   （ここから 名前を付けて保存）
     ㉗ 物件から開いた戸別で、エディタの「💾 保存」（名前を付けて保存）を押す。フォルダには現場の 管理番号.json（原寸 G）。
        ファイルを選ぶ画面は Chrome と同じく、選んだファイルを こちらへ渡す前に空にする（あとから読んで合わせることはできない）。
        → ファイルを選ぶ画面を開かない（戸別ファイルは元のまま）。写しをダウンロードの場所へ保存する（名前は 管理番号_写し.json）。
          写しの写真は減らさない（画面に入れなかった写真も入れる）。戸別ファイルへは「💾 物件に保存」で書くよう知らせる
        a) 図面あり（縮小版が画面に出る）に写真 P を足す　b) 図面なし（写真を画面に入れていない）　c) 写真の無い物件の行
        d) 物件から開いたのではない戸別（📂 で読んだ）は、今までどおりファイルを選ぶ画面で 管理番号.json
        e) 開いている行が一覧から外れた（🧹 未施工）あとも、画面の側で覚えていて写しにする（図面なし＝画面に入れなかった G縮 も写しに入る）。
           「💾 物件に保存」は押せないので、その名前へは案内しない　f) 同じ・図面あり（setLoadedOrigin の道）
        g) 物件の行を開いたあと、📂 で別の戸別を読んで画面を替えた → 今までどおりファイルを選ぶ画面（物件から開いた印は下ろす）
        h) 行が外れたあと、工事調書のまとめ印刷（画面を替えて戻す）をしても、写しにする
        i) 📥 現場取込で開いている戸別へ現場の写真 K を入れた（画面を入れ直す）あとも覚えていて、「💾 物件に保存」を出し直す。
           そのあと 🧹 未施工にしても写し（G縮・K）　j) 世帯の削除（aptMgRemoveRow）で行が外れた → ボタンを描き直す・写し
        k) 受付台帳の 🗑 →「一覧から消す（ファイルは残す）」で行が外れた → ボタンを描き直す・写し
     ㉘ 「🔐 暗号化保存」「ハイブリッド保存」も同じ（パスワードを聞く前に知らせて確かめる）。
        a) 暗号の物件の行（写真を剥がした封筒・フォルダに 管理番号.antenna.hyb）→ ハイブリッド保存：画面を開かない・.hyb は元のまま・
           写しは 管理番号_写し.antenna.hyb・「写真は復元できていない」・戸別ファイルの名前は行が覚えている 管理番号.antenna.hyb と知らせる
        b) 図面のある物件の行（縮小版 G縮 が画面に出る）に P を足す → ハイブリッド保存：写しに G縮・P・「小さい写真」の知らせ
        c) 図面の無い物件の行（写真を画面に入れていない）→ 🔐 暗号化保存・ハイブリッド保存の両方：写し（.antenna.enc・.antenna.hyb）に画面に入れなかった G縮 も入る
        d) 物件から開いたのではない戸別 → 今までどおりファイルを選ぶ画面で 管理番号.antenna.hyb／.antenna.enc
        e) a と同じ暗号の行が工事フォルダのファイルに結び付いている（ボタンは「💾 上書き保存」）→ 写しにする・「💾 物件に保存」へは案内しない。
           写真は剥がれたまま開く（版178 の adee23e で、付いているファイルの暗号の部分で開く仕組みを外した）＝写しに写真は入らない・「復元できていない」と言う
        f) c の行を開いて 🧹 未施工で外したあと、🔐 とハイブリッドの両方 → どちらの写しにも画面に入れなかった G縮
        g) a の暗号の行を開いて 🧹 未施工で外したあと → 知らせの戸別ファイルの名前は、開いた行の 管理番号.antenna.hyb
        h) a の暗号の行を開いて、工事調書のまとめ印刷をしたあと → 「写真が復元できていない」印とバナーが残る・知らせもそう言う
        （a・h：暗号の戸別へ「💾 物件に保存」を案内するときは、ここで足した写真とお客様の欄は暗号の戸別ファイルに入らないと言う）
        i) a の暗号の行を開いて（写真は剥がれたまま）写真 P を足す → 写しに P・「元の暗号の写真は…入りません（この画面の写真だけが入ります…）」と言う
           （剥がれていても画面の写真は写しに入る。版178 の b93342c から、📥 や行の写真でも剥がれた画面に写真が出る）
        j) 暗号の物件の行の封筒に元の写真 S（長辺400px の JPEG）がある（剥がれていない）→ 写しに S・「物件に控えた小さい写真」とは言わない
           （暗号の戸別は物件に縮小版を入れない＝画面の写真はファイルからほどいた元の写真）
        k) 図面のある物件の行の写真が小さい PNG の図 F（元の写真のまま物件に残る）→ 写しに F・「物件に控えた小さい写真」とは言わない
           （縮小版かは、物件の縮小版づくりと同じ物差し projThumbLike で見る）
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
               row: { thumbFlag: !!row.data.chosho_photos_thumb, same: ((row.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri === src,
                      parked: (typeof rowHasParkedThumb === 'function') && rowHasParkedThumb(row),
                      to: (ed && typeof rowParkedEntry === 'function' && rowParkedEntry(row, ed) && rowParkedEntry(row, ed).fh.name) || '' },
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
      // 3回目の見直し（メモリ）から：戸別ファイルに入れて確かめた元の写真は、行に持たせない（預けた縮小版＋預け先）
      ok(r1.row.parked === true && r1.row.same === false && r1.row.to === NO + '.json',
         '★①戸別ファイルに入れて確かめたのに、行が元の写真を持ち続けている・預け先が違う → ' + short(r1.row));
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
      // 行の P は、戸別ファイルに入れて確かめたので預けた縮小版（3回目の見直し）。G と P が行に残っていること
      ok(r.file.join() === 'G,P' && r.idb.join() === 'G,P' && r.row.join() === 'G,P縮',
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

  // ---- ⑫e ⑫d と同じ（縮小版の控えが消えてから開き直す）。写真が小さい図（PNG。元の写真のほうが、縮小版の JPEG より字数が少ない）----
  //   縮小版の控えが無いときは大きさで比べるが、元が PNG で作り直した写真が JPEG（縮小版はいつも JPEG）なら元の写真を戻す。
  if(want('⑫e')){
    const { ctx, page } = await openMain('⑫e');
    const r = await run(page, async ({ NO, PN }) => {
      await __openProj(__proj178('pj178le', PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows[0];
      await openCaseInEditor(row);
      /* 斜線（1画素の線を3画素おき）の図（PNG・1000×800）。PNG は同じ並びを短くできるが、縮小版（JPEG・長辺512px）は細かい線で長くなる。
         （一色だけの図は、縮小版のほうが短いので この場面にならない） */
      const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 800;
      const cx = cv.getContext('2d'); const im = cx.createImageData(1000, 800);
      for(let y = 0; y < 800; y++) for(let i = 0; i < 1000; i++){
        const v = ((i + y) % 3 === 0) ? 0 : 255, q = (y * 1000 + i) * 4;
        im.data[q] = v; im.data[q + 1] = v; im.data[q + 2] = v; im.data[q + 3] = 255;
      }
      cx.putImageData(im, 0, 0);
      const PNG = cv.toDataURL('image/png');
      const TH = await makeThumbDataUri(PNG, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const ed = await __addPhoto(PNG, 'zu.png', 'image/png');
      __abortPicker();
      await __pressSave();                                    // 物件にだけ保存（フォルダは選ばなかった）
      const o = { pngLen: PNG.length, thLen: TH.length, edPng: !!(ed && ed.dataUri === PNG), thumbs1: Array.isArray(row._thumbs) };
      __setTel('090-3333-4445');                              // 別の欄を直す
      syncEditorToRowData();                                  // 行へ取り込む（縮小版の控え _thumbs が消える）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }   // まだ保存していない
      o.thumbsCleared = !Array.isArray(row._thumbs);
      await applyProject(await projIdbGet('pj178le'), { silent: true });          // 端末内の物件を開き直す
      const row2 = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const u2 = ((row2.data.chosho_photos || []).filter(p => p && p.dataUri)[0] || {}).dataUri;
      o.row2 = u2 === PNG ? 'PNG' : (/^data:image\/jpeg/.test(String(u2 || '')) ? 'JPEG(縮小版)' : '?');
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row2);
      o.btn = await __pressSave();
      const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
      o.n = ph.length; o.file = ph.length ? (ph[0].dataUri === PNG ? 'PNG' : (/^data:image\/jpeg/.test(ph[0].dataUri) ? 'JPEG(縮小版)' : '?')) : 'なし';
      return o;
    }, { NO, PN });
    console.log('⑫e短い PNG の図を保存せずに開き直す', short(r));
    ok(!r.error, '⑫e止まった → ' + r.error);
    if(!r.error){
      ok(r.pngLen < r.thLen && r.edPng && r.thumbs1 && r.thumbsCleared && r.btn.pressed,
         '⑫e試験の前提: 元の PNG のほうが縮小版より短い・縮小版の控えが消えたあとに開き直す → ' + short(r));
      ok(r.row2 === 'PNG', '★⑫e開き直すと、短い PNG の図が縮小版（JPEG）に替わる → ' + short(r));
      ok(r.n === 1 && r.file === 'PNG', '★⑫e開き直したあとの「物件に保存」で、戸別ファイルに縮小版（JPEG）が書かれた → ' + short(r));
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

  // ---- ㊻ 開き直すとき一度だけファイルを読めなかった（同期ソフトが書き替えている最中など）→ 開かない・知らせる（6回目の見直しから）----
  //   読めるときにもう一度開くと A・B が出る・保存してもファイルは A・B のまま
  //   （前は写真の出ない画面で開いていた。そこで足した写真・直した内容が、物件に正しく入らなかった）
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
      const listOpen = () => document.body.classList.contains('list-view-open');
      const o = {};
      await openCaseInEditor(row);                                     // 1回目：A・B が出る
      o.shown1 = shown();
      openListView();                                                  // 何も直さずに一覧へ戻る
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.slimBack = !!row._slim;
      list.__unreadable[NO + '.json'] = 1;                             // 次に読むときだけ読めない
      await openCaseInEditor(row);                                     // 開き直す（このとき読めない）→ 開かない
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.refused = { list: listOpen(), slim: !!row._slim, known: !!row._photosKnown };
      await openCaseInEditor(row);                                     // もう一度開く（今度は読める）
      o.shown2 = shown();
      o.list2 = listOpen();
      __setTel('090-1111-2222');
      o.btn = await __pressSave();
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN, mode });
    const a = alerts(said);
    console.log('㊻' + mode + '開き直すとき読めなかった', short(r), short(a.slice(-1).map(m => m.slice(0, 80))));
    ok(!r.error, '㊻' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.shown1 === 'A,B' && r.slimBack && r.readFailed && r.btn.pressed
         && (mode === 'a' ? /上書き保存/ : /物件に保存/).test(r.btn.text) && r.tel === '090-1111-2222',
         '㊻' + mode + '試験の前提: 1回目は A・B が出る・開き直すときだけ読めない・あとで保存できる → ' + short(r));
      ok(r.refused.list && r.refused.slim && !r.refused.known && a.some(m => /開きませんでした/.test(m)),
         '★㊻' + mode + 'ファイルを読めないのに戸別を開いた（写真の出ない画面）・開かなかったことを知らせない → ' + short(r.refused) + ' ' + short(a.slice(-1)));
      ok(r.shown2 === 'A,B' && !r.list2, '★㊻' + mode + '読めるときに開き直しても、ファイルの写真 A・B が出ない → ' + short(r));
      ok(r.file === 'A,B', '★㊻' + mode + '開けなかったあとの保存で、ファイルの写真が消えた → ' + short(r));
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

  // ---- ⑯i まとめて書いているとき（📥 現場取込・協力会社諸経費のそろえ直し）に、管理番号の付け替え先が 写真なし・名前の違うファイル ----
  //   画面に出ていない戸別なので、同じお宅かを聞けない（聞くと、どの戸別のことか分からないまま OK を押してしまう）。
  //   → 聞かない・書かない（どちらのファイルも元のまま）・管理番号を確かめ、同じお宅ならその戸別を開いて保存するよう知らせる
  //     （5回目の見直しで文を直した。前は「💾 物件に保存」を押すよう書いていたが、📁 の行のボタンは「💾 上書き保存」で、聞かずに書いていた）
  // ---- ⑯k（5回目の見直し）⑯i と同じ。ただし 元のファイル（NO.json）の中の管理番号が、もう 付け替え先と同じ 078 になっている ----
  //   （前に 💾 上書き保存 で、番号を直した中身が元のファイルへ書かれた）＝同じ管理番号のファイルが2つある
  //   → 聞かない・書かない・「同じ管理番号のファイルが2つ」あること、「🧩 重複をまとめる」で1つにすることを知らせる
  //   （前は ⑯i と同じ文で「開いて保存して」と言い、開いて保存しても 2つのまま、次のそろえ直しで同じ文が出続けた）
  for(const sc of ['⑯i', '⑯k'].filter(want)){
    const { ctx, page } = await openMain(sc);
    const twin = (sc === '⑯k');
    const r = await run(page, async ({ NO, NO2, PN, twin }) => {
      const NO3 = '2612MKM099';
      await __openProj(__proj178('pj178p' + (twin ? 'k' : 'i'), PN, [
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
      if(twin){                                              // ⑯k：前の 💾 上書き保存で、元のファイルの中の番号が 078 になっている
        const j = JSON.parse(root.__files[NO + '.json']); j.chosho_mgmt_no = NO2;
        root.__files[NO + '.json'] = JSON.stringify(j, null, 2);
      }
      o.srcNo = JSON.parse(root.__files[NO + '.json']).chosho_mgmt_no;
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
    }, { NO, NO2, PN, twin });
    console.log(sc + (twin ? 'まとめて書くとき付け替え先と元のファイルが同じ管理番号' : 'まとめて書くとき付け替え先が名前の違うファイル'), short(r));
    ok(!r.error, sc + '止まった → ' + r.error);
    if(!r.error){
      ok(r.b1.pressed && r.first === 1 && r.rowNo === NO2 && r.notShown && r.srcNo === (twin ? NO2 : NO),
         sc + '試験の前提: NO.json（写真 P）ができ、番号を直した戸別は画面に出ていない' + (twin ? '・NO.json の中の番号は ' + NO2 : '') + ' → ' + short(r));
      ok(r.asked.length === 0, '★' + sc + 'まとめて書いているときに「同じお宅ですか」と聞いた（どの戸別のことか分からない） → ' + short(r.asked));
      ok(r.writes.length === 0 && r.removed.length === 0 && r.oldSame && r.tgtSame && r.tree.join() === [NO + '.json', NO2 + '.json'].join(),
         '★' + sc + 'まとめて書いているときに、名前の違うファイルへ このお宅の中身を書いた・元のファイルを消した → ' + short(r));
      if(!twin){
        ok(/書き替えていません/.test(r.note) && /管理番号が合っているか/.test(r.note) && /開いて保存/.test(r.note) && /🧩/.test(r.note)
           && /鈴木 様/.test(r.note) && !/💾 物件に保存/.test(r.note),
           '★⑯i書かなかったこと・管理番号を確かめること・同じお宅なら開いて保存すること（🧩 で1つにすること）を知らせない・'
           + '「💾 物件に保存」を押すよう書いた（📁 の行のボタンは「💾 上書き保存」で、聞かずに書く） → ' + short(r.note));
      } else {
        ok(/書き替えていません/.test(r.note) && r.note.indexOf('同じ管理番号のファイルが2つ（' + NO + '.json・' + NO2 + '.json）') >= 0
           && /🧩 重複をまとめる/.test(r.note),
           '★⑯k元のファイルと付け替え先が同じ管理番号なのに「同じ管理番号のファイルが2つ」あること・「🧩 重複をまとめる」で1つにすることを知らせない → ' + short(r.note));
      }
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

  // ---- ㊻c 物件あり（工事フォルダとはつながっていない）・📁 の行（図面なし・ファイルの写真 A）へ 📥 現場取込（G。フォルダを掴めず行にだけある）----
  //   → 開くとき一度だけファイルを読めない → 開かない・知らせる（6回目の見直しから）
  //   → 行は「ファイルから読む」のまま（ファイルの写真があることを忘れない）・G も持ったまま
  //   → 読めるときに開き直すと A・G → 保存 → ファイルは A・G
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
      openListView();                                                  // 一覧から開く
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      list.__unreadable[NO + '.json'] = 1;                             // 開くときだけ読めない（同期ソフトが書き替えている最中など）
      await openCaseInEditor(row);
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.refused = { list: document.body.classList.contains('list-view-open'), editing: _editingRow === row,
                    slim: !!row._slim, known: !!row._photosKnown, held: held() };
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
    console.log('㊻c読めない戸別（取り込んだ写真あり）', short(r), short(a.map(m => m.slice(0, 40))));
    ok(!r.error, '㊻c止まった → ' + r.error);
    if(!r.error){
      ok(!r.drawing && /工事フォルダを掴めていません/.test(r.note) && r.afterImport.slim && r.afterImport.held === 'G' && r.afterImport.file === 'A' && r.readFailed
         && r.btn.pressed && /保存/.test(r.btn.text) && r.tel === '090-1111-3333',
         '㊻c試験の前提: 取り込んだ G は行にだけあり（ファイルは A のまま）、開くときだけ読めない・あとで保存できる → ' + short(r));
      ok(r.refused.list && !r.refused.editing && a.some(m => /開きませんでした/.test(m)),
         '★㊻cファイルを読めないのに戸別を開いた（図面なし・写真の出ない画面）・開かなかったことを知らせない → ' + short(r.refused) + ' ' + short(a.slice(-1)));
      ok(r.refused.slim && !r.refused.known && r.refused.held === 'G',
         '★㊻c開けなかったあと、行が「写真はこれで全部」になった・取り込んだ G を落とした → ' + short(r.refused));
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


  /* ===================== ここから 5回目の見直しの直し ===================== */

  // ---- ㊻d 物件あり（共有ファイルと連動）・📁 で読んだ行（常駐させない・ファイルの写真 A・B）。物件に保存して、物件では写真2枚 ----
  //   → 開くとき一度だけファイルを読めない → 開かない（行・物件は2枚のまま）
  //   → 読めるときに開くと A・B → 写真 P を足して電話を直し、一覧へ戻る → 物件の保存
  //   → 行の写真は3枚・物件（端末内・共有ファイル）にも3枚
  //   （6回目の見直しから。前は読めないまま開いて足した写真が、物件に入らなかった）
  //   図面あり・図面なし の両方で見る
  for(const mode of ['図面あり', '図面なし'].filter(() => want('㊻d'))){
    const { ctx, page, said } = await openMain('㊻d');
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178nd' + (mode === '図面あり' ? '1' : '2');
      const A = __jpeg(900, 700, 0.85, 267), B = __jpeg(900, 700, 0.85, 268), PP = __jpeg(800, 600, 0.85, 269);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(mode === '図面あり') base.amplifier = 'amp_3u43';
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      row._dir = list; row._name = NO + '.json'; row._dirPath = '';
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const proj = async () => { const x = await __idbPhotos(PID, NO); return { idb: x.photos.length, idbCount: x.count, disk: __diskPhotos(NO) }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();                                                // 物件に保存（写真2枚・縮小版）
      const o = { drawing: lgHasDrawing(row), slim0: !!row._slim, count0: row._photoCount, before: await proj() };
      openListView();                                                  // 一覧から開く
      list.__unreadable[NO + '.json'] = 1;                             // 開くときだけ読めない
      await openCaseInEditor(row);
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.refused = { list: document.body.classList.contains('list-view-open'), slim: !!row._slim, count: row._photoCount };
      await saveProj();
      o.refusedProj = await proj();
      await openCaseInEditor(row);                                     // 開き直す（今度は読める）
      o.shown1 = shown();
      const added = await __addPhoto(PP, 'P.jpg');                     // 写真 P を足す
      o.added = !!(added && added.dataUri);
      __setTel('090-1111-2222');                                       // 電話を直して
      openListView();                                                  // 一覧へ戻る（行へ取り込む）
      await saveProj();                                                // 物件の保存（この端末・共有ファイル）
      o.after = Object.assign({ count: row._photoCount, tel: (row.data || {}).chosho_cust_tel }, await proj());
      o.file = ids();
      await openCaseInEditor(row);                                     // もう一度開く
      o.shown2 = (STATE.photos || []).filter(p => p && p.dataUri).length;
      return o;
    }, { NO, PN, mode });
    const a = alerts(said);
    console.log('㊻d' + mode + '・読めない戸別は開かない／開けたら足した写真が物件に入る', short(r), short(a.map(m => m.slice(0, 40))));
    ok(!r.error, '㊻d' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.drawing === (mode === '図面あり') && r.slim0 && r.count0 === 2 && r.before.idb === 2 && r.before.idbCount === 2
         && r.before.disk.n === 2 && r.before.disk.count === 2 && r.readFailed && r.shown1 === 'A,B' && r.added && r.after.tel === '090-1111-2222',
         '㊻d' + mode + '試験の前提: 物件（端末内・共有ファイル）に写真2枚で入り、開くときだけ読めない・あとで開いて写真を足せる → ' + short(r));
      ok(r.refused.list && r.refused.slim && r.refused.count === 2 && a.some(m => /開きませんでした/.test(m)),
         '★㊻d' + mode + 'ファイルを読めないのに戸別を開いた・開かなかったことを知らせない → ' + short(r.refused));
      ok(r.refusedProj.idb === 2 && r.refusedProj.idbCount === 2 && r.refusedProj.disk.n === 2 && r.refusedProj.disk.count === 2,
         '★㊻d' + mode + '開けなかったあとの物件の保存で、物件の写真が2枚ではなくなった → ' + short(r.refusedProj));
      ok(r.after.count === 3, '★㊻d' + mode + '開いて写真を足して戻ると、行の写真の枚数が3にならない → ' + short(r.after));
      ok(r.after.idb === 3 && r.after.idbCount === 3, '★㊻d' + mode + '物件（この端末）に、この戸別が写真3枚で入っていない（足した写真が物件に入らない） → ' + short(r.after));
      ok(r.after.disk.n === 3 && r.after.disk.count === 3, '★㊻d' + mode + '共有ファイルの物件に、この戸別が写真3枚で入っていない → ' + short(r.after));
      ok(r.file === 'A,B', '★㊻d' + mode + '戻っただけで戸別ファイルの写真が変わった → ' + short(r.file));
      ok(r.shown2 === 3, '★㊻d' + mode + 'もう一度開くと、写真が3枚出ない → ' + short(r.shown2));
    }
    await ctx.close();
  }

  // ---- ㊸g ㊸e と同じ（物件の工事フォルダは その１。受付台帳で電話を直し「💾 戸別ファイルへ反映」で リスト を選ぶ）----
  //   ただし反映のとき、工事フォルダをまだつないでいない（物件を開いた直後。前の日につないだ その１ を覚えている）
  //   → 一覧を読み直した行の覚える名前を、覚えている工事フォルダ（その１）から見た「リスト/管理番号.json」にそろえる（物件にもそう入る）
  //   （前は「管理番号.json」を覚え、次の日 その１ に縮小版だけの 管理番号.json をもう1つ作っていた）
  if(want('㊸g')){
    const { ctx, page, said } = await openMain('㊸g');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ag';
      const G = __jpeg(900, 700, 0.85, 240); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      await __openProj(__proj178(PID, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: 'G', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const txt = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: 'uhf_new', amplifier: 'amp_3u43',
        chosho_photos: [{ id: gid, label: 'G', dataUri: G }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: txt }, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      _projDirHandle = null;                                                 // 工事フォルダは、まだつないでいない
      const o = {};
      /* 前の日につないだ工事フォルダ その１ を覚えている。作り物のフォルダは本物の IndexedDB に入らない（関数を持つ）ので、
         入らなかったときだけ、覚えの出し入れを この場で持つ（物件の id の覚えだけ） */
      try { await projHandlePut(_currentProject.id + ':dir', root); o.put = 'IndexedDB'; }
      catch(e){
        const mem = {}, get0 = projHandleGet, put0 = projHandlePut;
        projHandlePut = async (k, h) => { if(String(k).indexOf(PID) === 0){ mem[k] = h; return true; } return put0(k, h); };
        projHandleGet = async k => (k in mem) ? mem[k] : get0(k);
        await projHandlePut(_currentProject.id + ':dir', root); o.put = 'この場（' + ((e && e.name) || e) + '）';
      }
      o.remembered = (await projHandleGet(_currentProject.id + ':dir')) === root;
      const row0 = _listRows[0];
      row0.data = Object.assign({}, row0.data, { chosho_cust_tel: '090-1111-0000' });   // 受付台帳で電話を直した（まだ戸別ファイルに入っていない）
      try { markCaseEdited(row0); } catch(_){}
      o.linkedAtReflect = !!_projDirHandle;
      window.showDirectoryPicker = async () => list;                         // 反映でフォルダを聞かれ、リスト を選んだ
      await lgwbButton();                                                    // 書き戻し → 一覧を読み直す
      const row = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.reflect = { reloaded: !!row && row !== row0 && _listDirHandle === list, att: !!(row && row._dir === list && row.fileHandle),
                    fileTel: JSON.parse(list.__files[NO + '.json']).chosho_cust_tel };
      o.fileAfterReload = row && row.file;
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      o.projFile = ((await projIdbGet(PID)).cases || []).map(c => c.file);
      o.tree = __tree(root);
      return o;
    }, { NO, PN });
    const a = alerts(said);
    console.log('㊸g反映のとき工事フォルダをまだつないでいない（覚えている工事フォルダから道のりを引く）', short(r), short(a.slice(-1).map(m => m.slice(0, 120))));
    ok(!r.error, '㊸g止まった → ' + r.error);
    if(!r.error){
      ok(r.remembered && !r.linkedAtReflect && r.reflect.reloaded && r.reflect.att && r.reflect.fileTel === '090-1111-0000',
         '㊸g試験の前提: 工事フォルダ その１ を覚えている・反映のときはつないでいない・リスト を選んで書き戻し、一覧を読み直す → ' + short(r));
      ok(r.fileAfterReload === 'リスト/' + NO + '.json',
         '★㊸g反映のあと一覧を読み直した行が、覚えている工事フォルダ（その１）から見た「リスト/' + NO + '.json」を覚えていない → ' + short(r.fileAfterReload));
      ok(r.projFile.join() === 'リスト/' + NO + '.json',
         '★㊸g物件（この端末）の覚える道のりが「リスト/' + NO + '.json」になっていない → ' + short(r.projFile));
      ok(r.tree.join() === 'リスト/' + NO + '.json', '★㊸g反映で、工事フォルダにほかのファイルを作った → ' + short(r.tree));
    }
    await ctx.close();
  }


  // ---- ⑰b 物件の行（図面なし）に、小さい図・画面写し（PNG。元の写真のほうが、物件用の縮小版の JPEG より字数が少ない）を入れて 物件にだけ保存 ----
  //   → ほかの端末の保存とまとめる（行が作り直される）→ 行は元の PNG のまま
  //   → 物件を開き直す（行がまた作り直される。その前に物件の保存で縮小版を作り直す）→ 行は元の PNG のまま
  //   → 開いて「💾 物件に保存」でフォルダを選ぶ → 戸別ファイルにも元の PNG（物件には縮小版）
  //   （前は「元の写真のほうが大きいときだけ戻す」と大きさで比べていたので、PNG は戻さず縮小版の JPEG が残り、戸別ファイルに書かれていた）
  if(want('⑰b')){
    const { ctx, page, said } = await openMain('⑰b');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178qb';
      await __openShared(__proj178(PID, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]));
      /* 斜線（1画素の線を3画素おき）の図（PNG・1000×800）。PNG は同じ並びを短くできるが、縮小版（JPEG・長辺512px）は細かい線で長くなる。
         （一色だけの図は、縮小版のほうが短いので この場面にならない） */
      const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 800;
      const cx = cv.getContext('2d'); const im = cx.createImageData(1000, 800);
      for(let y = 0; y < 800; y++) for(let i = 0; i < 1000; i++){
        const v = ((i + y) % 3 === 0) ? 0 : 255, q = (y * 1000 + i) * 4;
        im.data[q] = v; im.data[q + 1] = v; im.data[q + 2] = v; im.data[q + 3] = 255;
      }
      cx.putImageData(im, 0, 0);
      const PNG = cv.toDataURL('image/png');
      const TH = await makeThumbDataUri(PNG, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);       // 物件用の縮小版（JPEG）と同じ作り方
      const row = _listRows[0];
      await openCaseInEditor(row);
      const ed = await __addPhoto(PNG, 'zu.png', 'image/png');
      __abortPicker();
      const o = { pngLen: PNG.length, thLen: TH.length, edPng: !!(ed && ed.dataUri === PNG), b1: await __pressSave() };   // 物件にだけ保存（フォルダは選ばなかった）
      for(let i = 0; i < 100 && (_projSaving || _projSaveQueued); i++) await new Promise(res => setTimeout(res, 50));
      const tag = u => u === PNG ? 'PNG' : (u === TH ? '縮小版' : (u ? '?' : 'なし'));
      const held = () => { const x = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
        return ((x && x.data.chosho_photos) || []).filter(p => p && p.dataUri).map(p => tag(p.dataUri)).join(','); };
      const idb0 = await __idbPhotos(PID, NO);
      o.saved = { thumbs: Array.isArray(row._thumbs) && row._thumbs.length === 1 && row._thumbs[0].dataUri === TH,
                  idb: idb0.photos.map(p => tag(p.dataUri)).join(','), row: held() };
      openListView();                                                  // 一覧へ戻る（何も直していない）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      // ほかの端末が保存した（別の戸別を足した）→ 🔄 最新を取り込む（まとめて、行が作り直される）
      __otherDeviceSaves('2612MKM099');
      await rtPullLatest();
      for(let i = 0; i < 100 && (_projSaving || _projSaveQueued); i++) await new Promise(res => setTimeout(res, 50));
      o.merged = { rebuilt: _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0] !== row, n: _listRows.length, row: held() };
      // 物件を開き直す（行がまた作り直される）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await projSaveNow();
      const row1 = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      await applyProject(await projIdbGet(PID), { silent: true, fileHandle: _projFileHandle });
      const row2 = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.reopened = { rebuilt: row2 !== row1, row: held() };
      // 開いて「💾 物件に保存」でフォルダを選ぶ
      const list = __mk('リスト', {});
      window.showDirectoryPicker = async () => __mk('その１', {}, { 'リスト': list });
      await openCaseInEditor(row2);
      o.shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => tag(p.dataUri)).join(',');
      o.b2 = await __pressSave();
      o.file = (__photosOf(list.__files[NO + '.json'] || '{}') || []).map(p => tag(p.dataUri)).join(',');
      return o;
    }, { NO, PN });
    console.log('⑰b元の写真のほうが短い PNG の図', short(r));
    ok(!r.error, '⑰b止まった → ' + r.error);
    if(!r.error){
      ok(r.pngLen < r.thLen && r.edPng && r.b1.pressed && /物件に保存/.test(r.b1.text) && r.saved.thumbs && r.saved.idb === '縮小版' && r.saved.row === 'PNG'
         && r.merged.rebuilt && r.merged.n === 2 && r.reopened.rebuilt && r.b2.pressed,
         '⑰b試験の前提: PNG（' + r.pngLen + ' 字）が縮小版（' + r.thLen + ' 字）より短い・物件には縮小版で入る・まとめる／開き直すで行が作り直される → ' + short(r));
      ok(r.merged.row === 'PNG', '★⑰bほかの端末の保存とまとめると、行の元の PNG が縮小版の JPEG に替わった → ' + short(r.merged));
      ok(r.reopened.row === 'PNG', '★⑰b物件を開き直すと、行の元の PNG が縮小版の JPEG に替わった → ' + short(r.reopened));
      ok(r.file === 'PNG', '★⑰b「物件に保存」で、戸別ファイルに元の PNG ではなく縮小版の JPEG が書かれた → ' + short(r.file) + ' 画面 ' + short(r.shown));
    }
    await ctx.close();
  }

  /* ===================== ここから 6回目の見直しの直し ===================== */

  // ---- ㊻e 物件あり（工事フォルダとはつながっていない）・📁 の行（図面あり・ファイルの写真 A・B）を開いている ----
  //   → 📥 現場取込（G。フォルダを掴めず行にだけある）→ 取り込んだあとの読み直しが一度だけ読めない
  //   → 画面は A・B（開いたときファイルから読んだ分）＋ G。直して戻ると行は3枚・あとで保存するとファイルも A・B・G
  //   （前は行が持っている写真 G だけを画面に出し、戻ると行と物件の写真が G だけになっていた）
  if(want('㊻e')){
    const { ctx, page, said } = await openMain('㊻e');
    const r = await run(page, async ({ NO, PN }) => {
      const A = __jpeg(900, 700, 0.85, 271), B = __jpeg(900, 700, 0.85, 272), G = __jpeg(900, 700, 0.85, 273);
      await __openProj(__proj178('pj178ne', PN, []));
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = () => (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).sort().join(',');
      const shown = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const o = { drawing: lgHasDrawing(row) };
      await openCaseInEditor(row);                                     // 開く：A・B
      o.shown1 = shown();
      o.editing = _editingRow === row;
      __abortPicker(); _genbaNoDir = false;                            // 取り込みのときは工事フォルダを掴めなかった
      list.__unreadable[NO + '.json'] = 1;                             // 取り込んだあとの読み直しが読めない
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);   // 📥 現場取込
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.shown2 = shown();
      o.fileAfterImport = ids();
      __setTel('090-1111-1111');                                       // 何か直して
      openListView();                                                  // 一覧へ戻る（画面を行へ取り込む）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      o.back = { count: row._photoCount, held: ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',') };
      await openCaseInEditor(row);                                     // 開き直す
      o.shown3 = shown();
      window.showDirectoryPicker = async () => list;                   // 保存のとき工事フォルダを選ぶ
      __setTel('090-1111-2222');
      o.btn = await __pressSave();
      o.file = ids();
      o.tel = JSON.parse(list.__files[NO + '.json']).chosho_cust_tel;
      return o;
    }, { NO, PN });
    console.log('㊻e開いている戸別へ取り込んだあと読み直せない', short(r), short(alerts(said).map(m => m.slice(0, 40))));
    ok(!r.error, '㊻e止まった → ' + r.error);
    if(!r.error){
      ok(r.drawing && r.shown1 === 'A,B' && r.editing && /工事フォルダを掴めていません/.test(r.note) && r.readFailed && r.fileAfterImport === 'A,B'
         && r.btn.pressed && r.tel === '090-1111-2222',
         '㊻e試験の前提: 開いている戸別（A・B）へ取り込み、G は行にだけある・取り込んだあとの読み直しが読めない・あとで保存できる → ' + short(r));
      ok(r.shown2 === 'A,B,G', '★㊻e取り込んだあと読み直せないと、画面にファイルの写真 A・B が出ない（取り込んだ G だけ） → ' + short(r.shown2));
      ok(r.back.count === 3 && r.back.held === 'A,B,G', '★㊻e戻ると、行の写真が A・B・G にならない（物件にも G だけで入る） → ' + short(r.back));
      ok(r.shown3 === 'A,B,G' && r.file === 'A,B,G', '★㊻e開き直して保存しても、ファイルが A・B・G にならない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊻f 別の戸別 X（台帳で作った行・備考あり）を開いて、石綿の欄を直した → 一覧から、ファイルを読めない戸別 Y（備考あり）を開こうとした ----
  //   → 開かない・画面は X のまま（Y の備考が X の画面に入らない）・石綿を直した印も残る（図面あり・図面なし の両方）
  for(const mode of ['図面あり', '図面なし'].filter(() => want('㊻f'))){
    const { ctx, page, said } = await openMain('㊻f');
    const r = await run(page, async ({ NO, mode }) => {
      const A = __jpeg(900, 700, 0.85, 275);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: 'ワイ 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      if(mode === '図面あり') base.amplifier = 'amp_3u43';
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const y = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);   // 📁 フォルダで読んだ行
      slimListRow(y, true);
      _listRows = [y];
      const x = createManualRow({ chosho_mgmt_no: '2612MKM098', chosho_cust_name: 'エックス 様' }, 'manual');
      x.data.chosho_note = 'X の備考'; noteAdopt(subCaseKey(x), 'X の備考');
      y.data.chosho_note = 'Y の備考'; noteAdopt(subCaseKey(y), 'Y の備考');
      await openCaseInEditor(x);                                       // X を開く
      const note = () => (document.getElementById('chosho_note') || {}).value;
      const o = { xNote: note(), xEditing: _editingRow === x };
      openListView();                                                  // 一覧へ（X の画面はそのまま）
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      _asbEdited = true;                                               // X の石綿の欄を直した印
      list.__unreadable[NO + '.json'] = 1;                             // Y のファイルを読めない
      await openCaseInEditor(y);                                       // Y を開こうとする → 開かない
      o.readFailed = list.__unreadable[NO + '.json'] === 0;
      o.after = { note: note(), editingX: _editingRow === x, asb: _asbEdited === true, list: document.body.classList.contains('list-view-open'),
                  name: (document.getElementById('chosho_cust_name') || {}).value };
      return o;
    }, { NO, mode });
    const a = alerts(said);
    console.log('㊻f' + mode + '・開けなかった戸別の備考が開いている画面に入らない', short(r), short(a.slice(-1).map(m => m.slice(0, 40))));
    ok(!r.error, '㊻f' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.xNote === 'X の備考' && r.xEditing && r.readFailed && a.some(m => /開きませんでした/.test(m)),
         '㊻f' + mode + '試験の前提: X を開いて備考が出ている・Y は読めず開かなかった → ' + short(r));
      ok(r.after.note === 'X の備考' && r.after.editingX && r.after.list && r.after.name === 'エックス 様',
         '★㊻f' + mode + '開けなかった Y の備考などが、開いている X の画面に入った → ' + short(r.after));
      ok(r.after.asb, '★㊻f' + mode + '開けなかったのに、X の石綿を直した印が消えた（同じ建物の世帯へ配られない） → ' + short(r.after));
    }
    await ctx.close();
  }

  /* ===================== ここから 7回目の直し（古い名前・暗号の上書き保存・📥 だけの写真） ===================== */

  /* ===== 7回目の見直し：物件の覚えている戸別ファイルの名前が古い（㊸h〜㊸q）=====
     物件は「2612MKM077.json」と覚えているが、本当のファイルは 工事フォルダ（その１）/リスト/2612MKM077.json（原寸 G・現場の工事完了・測定値）。
     前は「💾 物件に保存」・📥 現場取込・協力会社諸経費のそろえ直しで、工事フォルダの直下に 2612MKM077.json を新しく作り、
     写真に物件の縮小版（長辺512px）を書いていた（あとで「🧩 重複をまとめる」が新しいほうを残すと、元の写真が縮小版に置き換わる）。
     ★決まり★ 新しく作るときは、📁 の読み込みと同じフォルダ（控え・写真のフォルダは見ない）で名前が同じ管理番号のファイルを探し、
     同じ写真IDの元の写真を使う（同じ写真がいくつもあれば pickBetterPhoto で選ぶ）。見つけたファイルには書かない・消さない・ほかの写真は足さない。
     開けないフォルダ・読めないファイルは飛ばして続ける。元の写真の見つからない縮小版が残り、読めなかった所があるときは：
       行の写真がみな縮小版 → 作らない・知らせる（物件に同じものがある）　元の大きさの写真がある → 作る・※ で知らせる（⚠ を付けない）
     見て回っているあいだに、同じ名前のファイルが届いたら上書きしない。 */
  /* 物件の覚えている名前が古い戸別（㊸h〜㊸q で使う）。
     物件の行：file は「管理番号.json」（古い）・写真 G は縮小版（o.withH なら H の縮小版も）。本当のファイルは リスト/o.realName（既定 管理番号.json）に原寸 G・工事完了・測定値。
     o.draw＝図面あり　o.subBefore／o.sub＝その１ の リスト の前／後ろに足すフォルダ　o.listFiles・o.listSubs＝リストに足すファイル・フォルダ
     o.names＝写真ID→名前（desc で使う。あとから足してもよい） */
  const STALE = `
    window.__stale = async function(o){
      o = o || {};
      const NO = o.no || '2612MKM077', PID = o.pid || 'pj178st';
      const G = __jpeg(900, 700, 0.85, 251); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const H = __jpeg(1000, 750, 0.85, 256); const hid = photoContentId(H);
      const Ht = await makeThumbDataUri(H, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const payload = { chosho_mgmt_no: NO, chosho_cust_name: '山田 太郎 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      const pp = o.noPhoto ? [] : [{ id: gid, label: '現場で撮った', dataUri: Gt }].concat(o.withH ? [{ id: hid, label: '現場で撮った2', dataUri: Ht }] : []);
      if(pp.length) Object.assign(payload, { chosho_photos: pp, chosho_photos_thumb: true, chosho_photo_count: pp.length });
      if(o.draw) payload.amplifier = 'amp_3u43';
      await __openProj(__proj178(PID, '令和８年度戸別受信設備設置工事（その１）', [{ caseId: 'c1', file: NO + '.json', lastModified: 0, payload }]));
      const realText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '山田 太郎 様', amplifier: 'amp_3u43', work_type: 'uhf_new', _origin: 'genba',
        chosho_status: 'done', meas_note: '現場の測定値', chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, null, 2);
      const realName = o.realName || (NO + '.json');
      const lf = Object.assign({}, o.noReal ? {} : { [realName]: realText }, o.listFiles || {});
      const list = __mk('リスト', lf, o.listSubs || {}, { resolve: true });
      const root = __mk('その１', {}, Object.assign({}, o.subBefore || {}, { 'リスト': list }, o.sub || {}), { resolve: true });
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const K = __jpeg(800, 600, 0.85, 252); const kid = photoContentId(K);
      const name = (u, id) => id === gid ? (u === G ? 'G原寸' : (u === Gt ? 'G縮小版' : 'G?'))
        : (id === hid ? (u === H ? 'H原寸' : (u === Ht ? 'H縮小版' : 'H?'))
        : (id === kid ? (u === K ? 'K原寸' : 'K?') : ((o.names || {})[id] || ('?' + String(u).length))));
      const desc = t => { if(t === undefined) return null; try { const j = JSON.parse(t);
        return { status: j.chosho_status || '', meas: j.meas_note || '', tel: j.chosho_cust_tel || '',
                 photos: (j.chosho_photos || []).filter(p => p && p.dataUri).map(p => name(p.dataUri, p.id)) }; } catch(_){ return '(読めない)'; } };
      /* フォルダの中を見ようとすると（entries）、when() が true のあいだ「見られない」になる */
      const unlistable = (d, when) => { const org = d.entries; let looked = 0;
        d.entries = function(){ looked++; if(!when()) return org.apply(this, arguments);
          return { [Symbol.asyncIterator](){ return { next: async () => { const e = new Error('見られない'); e.name = 'NotReadableError'; throw e; } }; } }; };
        return () => looked; };
      return { NO, PID, G, gid, Gt, H, hid, Ht, K, kid, list, root, row, realText, realName, desc, unlistable };
    };
  `;
  const ANDROID = NO + '_5017105541291380094.json';
  const indivPart = m => { const s = String(m || ''); const i = s.indexOf('戸別の個別JSON'); if(i < 0) return ''; const j = s.indexOf('\n\n', i); return s.slice(i, j < 0 ? s.length : j); };

  // ---- ㊸h 物件の覚えている名前が古い（本当のファイルは リスト/管理番号.json）→ 新しいファイルに縮小版を書かない ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㊸h' + m))){
    const { ctx, page, said } = await openMain('㊸h' + mode);
    await page.evaluate(STALE);
    const r = await run(page, async ({ mode }) => {
      const s = await __stale({ draw: mode !== 'b', pid: 'pj178ah' + mode });
      let picks = 0;
      window.showDirectoryPicker = async () => { picks++; return s.root; };
      const o = { rowFile: s.row.file };
      if(mode === 'a' || mode === 'b'){
        await openCaseInEditor(s.row);
        __setTel('090-1111-2222');
        o.press = await __pressSave();
      } else if(mode === 'c'){
        _projDirHandle = s.root; _genbaNoDir = false;          // 工事フォルダはつないである
        o.note = await applyGenbaMergeToRow(s.row, { chosho_mgmt_no: s.NO, chosho_cust_name: '山田 太郎 様', _origin: 'genba', work_type: 'uhf_new',
                                                     chosho_photos: [{ id: s.kid, label: '現場で足した', dataUri: s.K }] }, { importRun: true });
      } else {
        _projDirHandle = s.root;
        o.note = await _genbaWriteRowIndividual(s.row);        // 協力会社諸経費のそろえ直しと同じ書き方（ほかの戸別を書く）
      }
      o.picks = picks;
      o.tree = __tree(s.root);
      o.made = s.desc(s.root.__files[s.NO + '.json']);
      o.realSame = s.list.__files[s.NO + '.json'] === s.realText;
      o.rowN = (s.row.data.chosho_photos || []).filter(p => p && p.dataUri).length;
      await projSaveNow();
      const idb = await __idbPhotos(s.PID, s.NO);
      o.idb = { n: idb.photos.length, count: idb.count };
      return o;
    }, { mode });
    const a = alerts(said);
    console.log('㊸h' + mode + '古い名前の物件の行', short(r), short(a.map(m => m.slice(0, 80))));
    ok(!r.error, '㊸h' + mode + '止まった → ' + r.error);
    if(!r.error){
      const nP = mode === 'c' ? 2 : 1;
      ok(r.rowFile === NO + '.json' && r.realSame && r.tree.join() === [NO + '.json', 'リスト/' + NO + '.json'].join() && r.made,
         '㊸h' + mode + '試験の前提: 物件は古い名前を覚えていて、工事フォルダの直下に新しく作る（本当のファイルは元のまま）→ ' + short(r));
      if(mode === 'a' || mode === 'b') ok(r.picks === 1 && r.made.tel === '090-1111-2222', '㊸h' + mode + '試験の前提: 物件に保存でフォルダを選び、電話が入る → ' + short(r));
      ok(r.made.photos.join() === (mode === 'c' ? 'G原寸,K原寸' : 'G原寸'),
         '★㊸h' + mode + '新しく作った戸別ファイルに、物件の縮小版が書かれた（工事フォルダの リスト に元の写真があるのに）→ ' + short(r.made));
      ok(r.rowN === nP && r.idb.n === nP && r.idb.count === nP, '★㊸h' + mode + '行・物件（端末内）の写真の枚数が変わった → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊸i 確かめられないとき（a 本当のファイルを一度だけ読めない　b 本当のファイルのある リスト を一度だけ開けない
  //          c 📥 現場取込で読めない（行に K の原寸がある）　d 関係の無いフォルダを開けない・本当のファイルは読める）----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㊸i' + m))){
    const { ctx, page, said } = await openMain('㊸i' + mode);
    await page.evaluate(STALE);
    const r = await run(page, async ({ mode }) => {
      let throwing = true;
      const odd = __mk('打合せ', {}, {});
      const s = await __stale({ draw: true, pid: 'pj178ai' + mode, subBefore: mode === 'd' ? { '打合せ': odd } : {} });
      if(mode === 'a' || mode === 'c') s.list.__unreadable[s.NO + '.json'] = 1;   // 同期の途中などで、一度だけ読めない
      if(mode === 'b') s.unlistable(s.list, () => throwing);                      // リスト を開けない（読めるようになるまで）
      if(mode === 'd') s.unlistable(odd, () => true);                             // 関係の無いフォルダは、ずっと開けない
      window.showDirectoryPicker = async () => s.root;
      const o = {};
      if(mode === 'c'){
        _projDirHandle = s.root; _genbaNoDir = false;
        o.note1 = String(await applyGenbaMergeToRow(s.row, { chosho_mgmt_no: s.NO, chosho_cust_name: '山田 太郎 様', _origin: 'genba', work_type: 'uhf_new',
                                                    chosho_photos: [{ id: s.kid, label: '現場で足した', dataUri: s.K }] }, { importRun: true }) || '');
        await prepareProjectThumbs(true); await projSaveNow();
      } else {
        await openCaseInEditor(s.row);
        __setTel('090-1111-2222');
        await __pressSave();
      }
      o.tree1 = __tree(s.root);
      o.made1 = s.desc(s.root.__files[s.NO + '.json']);
      o.realSame1 = s.list.__files[s.NO + '.json'] === s.realText;
      const idb1 = await __idbPhotos(s.PID, s.NO);
      o.idb1 = { n: idb1.photos.length, count: idb1.count };
      o.rowN1 = (s.row.data.chosho_photos || []).filter(p => p && p.dataUri).length;
      o.rowFile1 = s.row.file;
      if(mode === 'a' || mode === 'b'){
        // 読めるようになって、もう一度保存する
        throwing = false;
        await __pressSave();
        o.tree2 = __tree(s.root);
        o.made2 = s.desc(s.root.__files[s.NO + '.json']);
        o.realSame2 = s.list.__files[s.NO + '.json'] === s.realText;
      }
      return o;
    }, { mode });
    const a = alerts(said);
    console.log('㊸i' + mode + '確かめられないとき', short(r), short(a.map(m => indivPart(m).slice(0, 160))));
    ok(!r.error, '㊸i' + mode + '止まった → ' + r.error);
    if(!r.error){
      const said1 = mode === 'c' ? r.note1 : indivPart(a[0] || '');
      if(mode === 'a' || mode === 'b'){
        ok(/作っていません/.test(said1) && /小さくしたものしか入っていません/.test(said1)
           && (mode === 'b' ? (/工事フォルダの中の リスト フォルダを開けませんでした/.test(said1) && /そのフォルダが開けるか確かめて/.test(said1))
                            : (/リスト\/2612MKM077\.json を読めませんでした/.test(said1) && /同期が終わってから/.test(said1))),
           '★㊸i' + mode + '確かめられなかったこと（どこを・どうすればよいか）を知らせない → ' + short(said1.slice(0, 300)));
        ok(r.tree1.join() === 'リスト/' + NO + '.json' && r.realSame1 && r.rowFile1 === NO + '.json',
           '★㊸i' + mode + '行の写真がみな縮小版なのに、確かめられないまま縮小版のファイルを作った・本当のファイルを書き替えた → ' + short(r));
        ok(r.rowN1 === 1 && r.idb1.n === 1 && r.idb1.count === 1, '★㊸i' + mode + '作らなかったときに、行・物件（端末内）の写真が減った → ' + short(r));
        ok(r.made2 && r.made2.photos.join() === 'G原寸' && r.realSame2 && r.tree2.join() === [NO + '.json', 'リスト/' + NO + '.json'].join(),
           '★㊸i' + mode + '読めるようになって保存したのに、元の写真で作らない → ' + short(r));
      } else if(mode === 'c'){
        ok(/新規作成/.test(said1) && r.made1 && r.made1.photos.join() === 'G縮小版,K原寸' && r.realSame1
           && r.tree1.join() === [NO + '.json', 'リスト/' + NO + '.json'].join(),
           '★㊸ic 📥 で入れた K の原寸があるのに作らなかった（K の原寸は画面の中にしか無い）・本当のファイルを書き替えた → ' + short(r) + ' ' + short(said1.slice(0, 200)));
        ok(/※ 工事フォルダの中の リスト\/2612MKM077\.json を読めませんでした。/.test(said1) && /元の写真を見つけられなかったものは、物件の小さい写真のまま入れました/.test(said1),
           '★㊸ic 縮小版のまま入れたことを知らせない → ' + short(said1.slice(0, 300)));
        ok(!/⚠/.test(said1), '★㊸ic 書けたのに ⚠ を付けた（📥 の知らせで「書けていません」に数えられる）→ ' + short(said1.slice(0, 300)));
        ok(r.rowN1 === 2 && r.idb1.n === 2 && r.idb1.count === 2, '★㊸ic 行・物件（端末内）の写真が減った → ' + short(r));
      } else {
        ok(/新規作成/.test(said1) && !/作っていません/.test(said1) && r.made1 && r.made1.photos.join() === 'G原寸' && r.realSame1,
           '★㊸id 関係の無いフォルダを開けないだけで作るのを断った・元の写真を使わない（📁 の読み込みと同じく飛ばして続ける）→ ' + short(r) + ' ' + short(said1.slice(0, 200)));
        ok(!/※/.test(said1), '★㊸id 元の写真がみな見つかったのに「小さい写真のまま入れた」と知らせた → ' + short(said1.slice(0, 300)));
      }
    }
    await ctx.close();
  }

  // ---- ㊸j 控えのフォルダ・写真のフォルダは見ない（📁 の読み込みと同じ）----
  if(want('㊸j')){
    const { ctx, page, said } = await openMain('㊸j');
    await page.evaluate(STALE);
    const r = await run(page, async () => {
      const G0 = __jpeg(900, 700, 0.85, 251); const t = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_photos: [{ id: photoContentId(G0), label: '', dataUri: G0 }] });
      const bak = __mk('_整理前の控え', { '2612MKM077.json': t }, {});
      const pic = __mk('工事写真', { '2612MKM077.json': t }, {});
      bak.__unreadable['2612MKM077.json'] = 5; pic.__unreadable['2612MKM077.json'] = 5;    // 読みに来たら読めない
      const s = await __stale({ draw: true, pid: 'pj178aj', noReal: true, listSubs: { '_整理前の控え': bak }, sub: { '工事写真': pic } });
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      await __pressSave();
      return { tree: __tree(s.root), made: s.desc(s.root.__files[s.NO + '.json']), untouched: bak.__unreadable['2612MKM077.json'] === 5 && pic.__unreadable['2612MKM077.json'] === 5 };
    });
    const a = alerts(said);
    console.log('㊸j控え・写真のフォルダは見ない', short(r), short(a.map(m => m.slice(0, 80))));
    ok(!r.error, '㊸j止まった → ' + r.error);
    if(!r.error){
      ok(r.untouched, '★㊸j控えのフォルダ・写真のフォルダの中まで読みに行った（📁 の読み込みでは見ないフォルダ）→ ' + short(r));
      ok(r.made && r.made.photos.length === 1 && !a.some(m => /作っていません/.test(m)),
         '★㊸j控え・写真のフォルダが読めないだけで、作るのを断った・写真の枚数が違う → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊸k 管理番号を付け替えた（077 → 078）。078 はほかのお宅のファイル（写真 S）→ S を入れない。G は 077 の原寸 ----
  if(want('㊸k')){
    const { ctx, page, said } = await openMain('㊸k');
    await page.evaluate(STALE);
    const r = await run(page, async ({ NO2 }) => {
      const S = __jpeg(900, 700, 0.85, 253); const sid = photoContentId(S);
      const sato = JSON.stringify({ chosho_mgmt_no: NO2, chosho_cust_name: '佐藤 花子 様', _origin: 'genba', chosho_status: 'done', meas_note: '佐藤様の測定値',
                                    chosho_photos: [{ id: sid, label: '佐藤様', dataUri: S }] }, null, 2);
      const s = await __stale({ draw: true, pid: 'pj178ak', listFiles: { [NO2 + '.json']: sato }, names: { [sid]: 'S' } });
      lgWriteCaseField(s.row, 'mgmt', NO2);                       // 受付台帳で管理番号を打ち直した
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      await __pressSave();
      return { tree: __tree(s.root), made: s.desc(s.root.__files[NO2 + '.json']),
               satoSame: s.list.__files[NO2 + '.json'] === sato, realSame: s.list.__files[s.NO + '.json'] === s.realText };
    }, { NO2 });
    const a = alerts(said);
    console.log('㊸k付け替えた番号のファイルはほかのお宅', short(r), short(a.map(m => m.slice(0, 80))));
    ok(!r.error, '㊸k止まった → ' + r.error);
    if(!r.error){
      ok(r.made && r.satoSame && r.realSame, '㊸k試験の前提: 新しく 078 を作り、リストの 077・078 は元のまま → ' + short(r));
      ok(r.made && r.made.photos.indexOf('S') < 0, '★㊸k ほかのお宅のファイルの写真が入った → ' + short(r.made));
      ok(r.made && r.made.photos.join() === 'G原寸', '★㊸k 付け替える前の番号のファイル（077）にある元の写真を使わない → ' + short(r.made));
    }
    await ctx.close();
  }

  // ---- ㊸l 本当のファイルが Android の名前（管理番号_数字.json）----
  if(want('㊸l')){
    const { ctx, page, said } = await openMain('㊸l');
    await page.evaluate(STALE);
    const r = await run(page, async ({ ANDROID }) => {
      const s = await __stale({ draw: true, pid: 'pj178al', realName: ANDROID });
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      await __pressSave();
      return { tree: __tree(s.root), made: s.desc(s.root.__files[s.NO + '.json']), realSame: s.list.__files[s.realName] === s.realText };
    }, { ANDROID });
    console.log('㊸l Android の名前', short(r));
    ok(!r.error, '㊸l止まった → ' + r.error);
    if(!r.error){
      ok(r.made && r.realSame, '㊸l試験の前提: 新しく作り、Android の名前のファイルは元のまま → ' + short(r));
      ok(r.made && r.made.photos.join() === 'G原寸', '★㊸l Android の名前のファイルにある元の写真を使わない → ' + short(r.made));
    }
    await ctx.close();
  }

  // ---- ㊸m 見て回らない（a 行に縮小版が無い（足した写真 P だけ）　b 管理番号の無い行（探す番号が無い））----
  for(const mode of ['a', 'b'].filter(m => want('㊸m' + m))){
    const { ctx, page, said } = await openMain('㊸m' + mode);
    await page.evaluate(STALE);
    const r = await run(page, async ({ mode }) => {
      const odd = __mk('古い', {}, {});
      if(mode === 'a'){
        const s = await __stale({ draw: true, pid: 'pj178am', noPhoto: true, noReal: true, sub: { '古い': odd } });
        const looked = s.unlistable(odd, () => true);
        window.showDirectoryPicker = async () => s.root;
        await openCaseInEditor(s.row);
        const P = __jpeg(900, 700, 0.85, 254);
        const ed = await __addPhoto(P, 'pc.jpg');
        await __pressSave();
        const ph = __photosOf(s.root.__files[s.NO + '.json'] || '{}') || [];
        return { looked: looked(), n: ph.length, same: !!(ed && ph.length === 1 && ph[0].dataUri === P) };
      }
      // b) 管理番号がまだ無い物件の行（覚えている名前は 戸別_xxx.json・もう無い）。写真は縮小版
      const s = await __stale({ draw: true, pid: 'pj178amb', noReal: true, sub: { '古い': odd } });
      const looked = s.unlistable(odd, () => true);
      const G = s.G, gid = s.gid, Gt = s.Gt;
      await __openProj(__proj178('pj178amb2', '令和８年度戸別受信設備設置工事（その１）', [{ caseId: 'c9', file: '戸別_abc.json', lastModified: 0,
        payload: { chosho_mgmt_no: '', chosho_cust_name: '番号まだ 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                   chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 } }]));
      const row = _listRows.filter(r => r.data.chosho_cust_name === '番号まだ 様')[0];
      _projDirHandle = s.root;
      const note = String(await _genbaWriteRowIndividual(row) || '');
      const ph = __photosOf(s.root.__files['戸別_abc.json'] || '{}') || [];
      return { looked: looked(), note: note.slice(0, 200), n: ph.length, small: !!(ph[0] && ph[0].id === gid && ph[0].dataUri === Gt), tree: __tree(s.root) };
    }, { mode });
    const a = alerts(said);
    console.log('㊸m' + mode + '見て回らない', short(r), short(a.slice(-1).map(m => m.slice(0, 80))));
    ok(!r.error, '㊸m' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'a'){
        ok(r.looked === 0, '★㊸ma 縮小版が無いのに、工事フォルダの中を見て回った → ' + short(r));
        ok(r.n === 1 && r.same, '★㊸ma 縮小版が無い行の保存を断った・写真が元のままでない → ' + short(r));
      } else {
        ok(r.looked === 0, '★㊸mb 探す管理番号が無いのに、工事フォルダの中を見て回った → ' + short(r));
        ok(r.n === 1 && r.small && /新規作成/.test(r.note) && !/作っていません/.test(r.note),
           '★㊸mb 管理番号の無い行の戸別ファイルを作らなかった（関係の無いフォルダを開けないだけで断った）→ ' + short(r));
      }
    }
    await ctx.close();
  }

  // ---- ㊸n 古い名前の行（G・H は縮小版）に 📷 で写真 P を足す。リストには読める本当のファイル（G の原寸）と、
  //          中身が途中で切れた Android の名前のファイル（H の原寸はここにしか無い）→ 💾 物件に保存 ----
  if(want('㊸n')){
    const { ctx, page, said } = await openMain('㊸n');
    await page.evaluate(STALE);
    const r = await run(page, async ({ ANDROID }) => {
      const H0 = __jpeg(1000, 750, 0.85, 256);
      const full = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba',
                                    chosho_photos: [{ id: photoContentId(H0), label: '現場で撮った2', dataUri: H0 }] }, null, 2);
      const broken = full.slice(0, Math.floor(full.length * 0.6));              // 書いている途中で切れた（読めない）
      const s = await __stale({ draw: true, withH: true, pid: 'pj178an', listFiles: { [ANDROID]: broken } });
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      const P = __jpeg(1200, 900, 0.85, 254);
      const ed = await __addPhoto(P, 'pc.jpg');
      await __pressSave();
      const t = s.root.__files[s.NO + '.json'];
      const ph = __photosOf(t || '{}') || [];
      const p = ph.filter(x => ed && x.id === ed.id)[0];
      const idb = await __idbPhotos(s.PID, s.NO);
      return { edOk: !!(ed && ed.dataUri === P), made: s.desc(t), pSame: !!(p && p.dataUri === P), pEdge: p ? await __edge(p.dataUri) : 0,
               tree: __tree(s.root), realSame: s.list.__files[s.NO + '.json'] === s.realText, brokenSame: s.list.__files[ANDROID] === broken,
               rowN: (s.row.data.chosho_photos || []).filter(x => x && x.dataUri).length, idb: { n: idb.photos.length, count: idb.count } };
    }, { ANDROID });
    const a = alerts(said);
    const msg = indivPart(a[a.length - 1] || '');
    console.log('㊸n足した写真と、読めない Android の名前のファイル', short(r), short(msg.slice(0, 240)));
    ok(!r.error, '㊸n止まった → ' + r.error);
    if(!r.error){
      ok(r.edOk && r.realSame && r.brokenSame && r.tree.join() === [NO + '.json', 'リスト/' + ANDROID, 'リスト/' + NO + '.json'].sort().join(),
         '★㊸n試験の前提・見つけたファイルを書き替えた（本当のファイル・切れたファイルは元のまま）→ ' + short(r));
      ok(r.made && r.pSame && r.pEdge > 512,
         '★㊸n 画面で足した写真 P の元の大きさが戸別ファイルに入らない（断ると、P の原寸は画面の中にしか無い）→ ' + short(r));
      ok(r.made && r.made.photos.length === 3 && r.made.photos.indexOf('G原寸') >= 0 && r.made.photos.indexOf('H縮小版') >= 0,
         '★㊸n 新しいファイルの写真が違う（G は読める本当のファイルの原寸・H は小さいまま・P）→ ' + short(r.made));
      ok(/新規作成/.test(msg) && !/作っていません/.test(msg)
         && msg.indexOf('※ 工事フォルダの中の リスト/' + ANDROID + ' を読めませんでした。この戸別の写真のうち、元の写真を見つけられなかったものは、物件の小さい写真のまま入れました。') >= 0,
         '★㊸n 縮小版のまま入れたこと・読めなかったファイルを知らせない → ' + short(msg.slice(0, 300)));
      ok(r.rowN === 3 && r.idb.n === 3 && r.idb.count === 3, '★㊸n 行・物件（端末内）の写真の枚数が変わった → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊸o 行の写真がみな縮小版（G・H）・同じ番号のファイルは途中で切れた Android の名前のファイルだけ → 作らない・直し方を知らせる。
  //          そのファイルがそろって（読めるようになって）保存 → 元の写真（G・H）で作る ----
  if(want('㊸o')){
    const { ctx, page, said } = await openMain('㊸o');
    await page.evaluate(STALE);
    const r = await run(page, async ({ ANDROID }) => {
      const G0 = __jpeg(900, 700, 0.85, 251), H0 = __jpeg(1000, 750, 0.85, 256);
      const full = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba', chosho_status: 'done',
                                    chosho_photos: [{ id: photoContentId(G0), label: '現場で撮った', dataUri: G0 }, { id: photoContentId(H0), label: '現場で撮った2', dataUri: H0 }] }, null, 2);
      const broken = full.slice(0, Math.floor(full.length * 0.7));
      const s = await __stale({ draw: true, withH: true, noReal: true, pid: 'pj178ao', listFiles: { [ANDROID]: broken } });
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      __setTel('090-1111-2222');
      await __pressSave();
      const o = { tree1: __tree(s.root), brokenSame: s.list.__files[ANDROID] === broken, rowFile1: s.row.file,
                  rowN1: (s.row.data.chosho_photos || []).filter(x => x && x.dataUri).length };
      const idb1 = await __idbPhotos(s.PID, s.NO);
      o.idb1 = { n: idb1.photos.length, count: idb1.count };
      s.list.__files[ANDROID] = full;                                          // 同期が終わって、中身がそろった
      await __pressSave();
      o.tree2 = __tree(s.root);
      o.made2 = s.desc(s.root.__files[s.NO + '.json']);
      o.fullSame = s.list.__files[ANDROID] === full;
      return o;
    }, { ANDROID });
    const a = alerts(said);
    const m1 = indivPart(a[0] || ''), m2 = indivPart(a[1] || '');
    console.log('㊸o みな縮小版で、読めないファイル', short(r), short([m1.slice(0, 300), m2.slice(0, 120)]));
    ok(!r.error, '㊸o止まった → ' + r.error);
    if(!r.error){
      ok(r.tree1.join() === 'リスト/' + ANDROID && r.brokenSame && r.rowFile1 === NO + '.json',
         '★㊸o 行の写真がみな縮小版なのに、確かめられないまま縮小版のファイルを作った → ' + short(r));
      ok(String(a[0] || '').indexOf('\u26a0 戸別の個別JSONは作っていません') >= 0 && m1.indexOf('リスト/' + ANDROID + ' を読めませんでした') >= 0 && /小さくしたものしか入っていません/.test(m1)
         && /壊れているかもしれません/.test(m1) && /工事フォルダの外へ移してから、もう一度保存してください/.test(m1) && !/📁/.test(m1),
         '★㊸o 作らなかったこと・読めないファイル・直し方（工事フォルダの外へ移す）を知らせない（📁 を勧めた）→ ' + short(m1.slice(0, 400)));
      ok(r.rowN1 === 2 && r.idb1.n === 2 && r.idb1.count === 2, '★㊸o 作らなかったときに、行・物件（端末内）の写真が減った → ' + short(r));
      ok(r.made2 && r.made2.photos.join() === 'G原寸,H原寸' && r.made2.tel === '090-1111-2222' && r.fullSame
         && r.tree2.join() === [NO + '.json', 'リスト/' + ANDROID].join() && /新規作成/.test(m2) && !/※/.test(m2),
         '★㊸o 読めるようになって保存したのに、元の写真（G・H）で作らない → ' + short(r) + ' ' + short(m2.slice(0, 200)));
    }
    await ctx.close();
  }

  // ---- ㊸p 見て回っているあいだに、工事フォルダの直下に 管理番号.json が届いた（現場の iPad の同期・写真 X）→ 上書きしない・知らせる。
  //          もう一度保存 → 届いたファイルへいつもどおり書く（X も残る）----
  if(want('㊸p')){
    const { ctx, page, said } = await openMain('㊸p');
    await page.evaluate(STALE);
    const r = await run(page, async () => {
      const names = {};
      const s = await __stale({ draw: true, pid: 'pj178ap', names });
      const X = __jpeg(800, 600, 0.85, 255); const xid = photoContentId(X); names[xid] = 'X';
      const arrived = JSON.stringify({ chosho_mgmt_no: s.NO, chosho_cust_name: '山田 太郎 様', amplifier: 'amp_3u43', work_type: 'uhf_new', _origin: 'genba',
        chosho_status: 'done', chosho_photos: [{ id: s.gid, label: '現場で撮った', dataUri: s.G }, { id: xid, label: 'iPad で足した', dataUri: X }] }, null, 2);
      const org = s.list.entries; let came = 0;
      s.list.entries = function(){ if(!came){ came++; s.root.__files[s.NO + '.json'] = arrived; } return org.apply(this, arguments); };
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      __setTel('090-1111-2222');
      await __pressSave();
      const o = { came, rootSame1: s.root.__files[s.NO + '.json'] === arrived, rootWrites1: s.root.__writes.length, rowFile1: s.row.file,
                  tree1: __tree(s.root), realSame1: s.list.__files[s.NO + '.json'] === s.realText };
      await __pressSave();
      o.made2 = s.desc(s.root.__files[s.NO + '.json']);
      o.tree2 = __tree(s.root);
      o.realSame2 = s.list.__files[s.NO + '.json'] === s.realText;
      return o;
    });
    const a = alerts(said);
    const m1 = indivPart(a[0] || ''), m2 = indivPart(a[1] || '');
    console.log('㊸p見て回っているあいだに届いた', short(r), short([m1.slice(0, 200), m2.slice(0, 120)]));
    ok(!r.error, '㊸p止まった → ' + r.error);
    if(!r.error){
      ok(r.came === 1 && r.realSame1 && r.tree1.join() === [NO + '.json', 'リスト/' + NO + '.json'].join(), '㊸p試験の前提: 見て回っているあいだに直下へ届いた → ' + short(r));
      ok(r.rootSame1 && r.rootWrites1 === 0, '★㊸p 見て回っているあいだに届いたファイルを、読まずに上書きした（現場の写真 X が消える）→ ' + short(r));
      ok(/\u26a0 戸別の個別JSONは書いていません：2612MKM077\.json が、いま工事フォルダに届きました。もう一度保存してください。/.test(String(a[0] || '')),
         '★㊸p 届いたので書かなかったことを知らせない → ' + short(m1.slice(0, 300)));
      ok(r.made2 && r.made2.photos.indexOf('X') >= 0 && r.made2.photos.indexOf('G原寸') >= 0 && r.made2.tel === '090-1111-2222' && r.realSame2,
         '★㊸p もう一度保存しても、届いたファイルへ書けない・X か G の原寸が消えた → ' + short(r) + ' ' + short(m2.slice(0, 120)));
    }
    await ctx.close();
  }

  // ---- ㊸q 同じ写真が2つの同じ番号のファイルにある（リスト/管理番号.json は目安の内に縮めた G・リスト/完了/管理番号.json は撮りっぱなしの G（1MB超）と
  //          縮小版より小さい H）→ G は目安の内のほう（pickBetterPhoto）・H は縮小版より小さいものに置き換えない ----
  if(want('㊸q')){
    const { ctx, page, said } = await openMain('㊸q');
    await page.evaluate(STALE);
    const r = await run(page, async () => {
      const G0 = __jpeg(900, 700, 0.85, 251), H0 = __jpeg(1000, 750, 0.85, 256);
      const Gbig = __jpeg(2000, 1500, 0.92, 251);
      const Hsmall = await makeThumbDataUri(H0, 300, 0.9);
      const old = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba',
        chosho_photos: [{ id: photoContentId(G0), label: '現場で撮った', dataUri: Gbig }, { id: photoContentId(H0), label: '現場で撮った2', dataUri: Hsmall }] }, null, 2);
      const done = __mk('完了', { '2612MKM077.json': old }, {});
      const s = await __stale({ draw: true, withH: true, pid: 'pj178aq', listSubs: { '完了': done } });
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      await __pressSave();
      const ph = __photosOf(s.root.__files[s.NO + '.json'] || '{}') || [];
      const g = ph.filter(x => x.id === s.gid)[0], h = ph.filter(x => x.id === s.hid)[0];
      return { n: ph.length, gIsFit: !!(g && g.dataUri === s.G), gIsBig: !!(g && g.dataUri === Gbig), bigBytes: __bytes(Gbig), gBytes: __bytes(s.G),
               hIsThumb: !!(h && h.dataUri === s.Ht), hIsSmaller: !!(h && h.dataUri === Hsmall), hEdge: h ? await __edge(h.dataUri) : 0,
               oldSame: done.__files['2612MKM077.json'] === old, realSame: s.list.__files[s.NO + '.json'] === s.realText, tree: __tree(s.root) };
    });
    const a = alerts(said);
    console.log('㊸q同じ写真が2つのファイルに', short(r), short(a.map(m => indivPart(m).slice(0, 120))));
    ok(!r.error, '㊸q止まった → ' + r.error);
    if(!r.error){
      ok(r.bigBytes > 1024 * 1024 && r.gBytes < 1024 * 1024 && r.oldSame && r.realSame && r.n === 2,
         '㊸q試験の前提: 撮りっぱなしの G は 1MB 超・目安の内の G は 1MB 以下・見つけたファイルは元のまま → ' + short(r));
      ok(r.gIsFit && !r.gIsBig, '★㊸q 同じ写真が2つあるとき、目安の内のほう（pickBetterPhoto）でなく撮りっぱなしの重いほうを入れた → ' + short(r));
      ok(r.hIsThumb && !r.hIsSmaller, '★㊸q 縮小版より小さい写真で、縮小版を置き換えた → ' + short(r));
    }
    await ctx.close();
  }
  /* ===== ここまで（7回目の見直し）===== */

  // ---- ㉕e〜㉕o 暗号の戸別（.hyb）を、写真の出ていない画面から 💾 上書き保存（前は写真なしで .hyb を書いていた。版177 から） ----
  //   e) 物件の行に 💾 反映でファイルが付く → 開く（写真なし）→ 電話・写真 P → 上書き保存 ×2（old：ファイルの写真が古い形）
  //   f) 📁 の .hyb を開いて直し、一覧へ戻って開き直す　g) 元ファイルの写真をほどけない（pw：別のパスワード　bad：写真の部分が壊れている）
  //   h) 元ファイルに写真が無い　i) 写真の出ている画面で B を消す（今までどおり消える）
  //   j) 開いている暗号の戸別へ 📥（strip：写真の出ていない画面を直して戻ってから　plain：平文の戸別には帯を出さない）
  //   k) 写真の出ていない画面のまま 🖨 まとめ印刷（shown：写真の出ている画面には帯を出さない・消した写真は消える）
  //   l) 付いているファイルが暗号の形でない（平文の 管理番号.json）　m) 写真を足して一覧へ戻り、開き直す（2回。pw：パスワードを聞かれて開く　proj：物件の行）
  //   o) 写真の出ていない画面で、元ファイルの終わりが欠けて読めない
  for(const [label, mode] of [['㉕e', 'new'], ['㉕e', 'old'], ['㉕f', ''], ['㉕g', 'pw'], ['㉕g', 'bad'], ['㉕h', ''], ['㉕i', ''],
                              ['㉕j', ''], ['㉕j', 'strip'], ['㉕j', 'plain'], ['㉕k', ''], ['㉕k', 'shown'], ['㉕l', ''],
                              ['㉕m', ''], ['㉕m', 'pw'], ['㉕m', 'proj'], ['㉕o', '']].filter(([l, m]) => want(l + m))){
    const L = label + mode;
    const { ctx, page, said } = await openMain(L);
    const r = await run(page, async ({ NO, PN, label, mode }) => {
        const A = __jpeg(600, 450, 0.85, 151), B = __jpeg(640, 480, 0.85, 152), P = __jpeg(620, 460, 0.85, 153);
        const nm = u => u === A ? 'A' : u === B ? 'B' : u === P ? 'P' : '?';
        const shownNow = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => nm(p.dataUri)).join(',');
        const base = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress',
                       work_type: 'uhf_new', amplifier: 'amp_3u43' };
        const photos = (label === '㉕e' && mode === 'old') ? { before: A, after: B }
                     : [{ id: 'hA', label: '写真A', dataUri: A }, { id: 'hB', label: '写真B', dataUri: B }];
        const env = await encryptHybrid(Object.assign({}, base, { chosho_photos: photos }), 'pw1234');
        const plainFile = (label === '㉕l') || (label === '㉕j' && mode === 'plain');   // 暗号でない 管理番号.json
        const FN = NO + (plainFile ? '.json' : '.hyb');
        let fileEnv = env;
        if(label === '㉕g' && mode === 'pw') fileEnv = await encryptHybrid(Object.assign({}, base, { chosho_photos: photos }), 'betsu-pass-99');   // ほかで別のパスワード
        if(label === '㉕g' && mode === 'bad'){                                                                            // 写真の部分が壊れている
          fileEnv = JSON.parse(JSON.stringify(env));
          const ct = fileEnv.encrypted_fields.chosho_photos.ct;
          fileEnv.encrypted_fields.chosho_photos.ct = ct.slice(0, 40) + (ct[40] === 'A' ? 'B' : 'A') + ct.slice(41);
        }
        if(label === '㉕h') fileEnv = await encryptHybrid(base, 'pw1234');                                               // 写真の無いファイル
        if(plainFile) fileEnv = Object.assign({}, base, { chosho_photos: photos });                                       // 平文（写真 A・B）
        const fileText = JSON.stringify(fileEnv, null, 2);
        const list = __mk('リスト', { [FN]: fileText }, {}, { resolve: true });
        const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
        window.showDirectoryPicker = async () => root;
        setSessionPassword('pw1234');
        const o = {};
        const dec = async (pw) => { try { const j = JSON.parse(list.__files[FN]);
          const d = (j.format === 'hybrid') ? await decryptHybrid(j, pw || 'pw1234') : j;
          const ps = migratePhotosShape(d.chosho_photos).filter(p => p && p.dataUri);
          return { fmt: j.format || 'plain', n: ps.length, ids: ps.map(p => nm(p.dataUri)).join(','), tel: d.chosho_cust_tel, name: d.chosho_cust_name }; }
          catch(e){ return { err: String((e && e.message) || e).slice(0, 60) }; } };
        const look = () => ({ shown: shownNow(), stripped: _editorPhotosStripped, banner: !!document.getElementById('photo-stripped-banner'),
                              btn: document.getElementById('btn-save-overwrite').textContent });
        const back = () => { openListView(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } };
        const fromFolder = label === '㉕f' || label === '㉕i' || (label === '㉕j' && mode !== 'strip') || (label === '㉕k' && mode === 'shown')
                        || (label === '㉕m' && mode !== 'proj');
        let row;
        if(fromFolder){
          const fh = await list.getFileHandle(FN);
          row = buildListRow('リスト/' + FN, 1, JSON.parse(fileText), fh);   // 📁 で読んだ行
          row._dir = list; row._name = FN; row._dirPath = 'リスト/';
          slimListRow(row, true);
          _listRows = [row];
          if(!plainFile) await unlockListView({ silent: true });   // 🔓 まとめて復号（覚えているパスワードで。名前などがほどける）
          if(label === '㉕f'){
            await openCaseInEditor(row);
            o.first = (STATE.photos || []).filter(p => p && p.dataUri).length;
            __setTel('090-1111-0000');
            back();                                              // 直したので行へ取り込む（行の封筒は写真を剥がしたまま）
          }
        } else {
          const slim = Object.assign({}, env, { encrypted_fields: Object.assign({}, env.encrypted_fields, { chosho_photos: { stripped: true } }) });
          await __openProj(__proj178('pj25' + label + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.hyb', lastModified: 0, payload: slim }]));
          row = _listRows[0];
          await unlockListView({ silent: true });               // 🔓 まとめて復号（覚えているパスワードで。名前などがほどける）
          const res = await lgwbAttachFrom(root, false);       // 「💾 戸別ファイルへ反映」と同じ結び付け（読み直さない）
          o.attached = res.hit === 1 && !!row.fileHandle;
          o.fhName = row.fileHandle && row.fileHandle.name;
        }
        await openCaseInEditor(row);
        Object.assign(o, look());
        o.shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
        o.bannerText = ((document.getElementById('photo-stripped-banner') || {}).textContent || '').slice(0, 200);
        if(label === '㉕m'){
          // 写真 P を足して一覧へ戻る → 開き直す → 何もせずに一覧へ戻る → もう一度開き直す
          o.added = !!(await __addPhoto(P, 'p.jpg'));
          back();
          o.rowAfterBack = ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => nm(p.dataUri)).join(',');
          if(mode === 'pw'){                                     // 覚えているパスワードが無い → 開くときに聞かれて入れる
            clearSessionPassword('試験');
            window.__asked = 0;
            promptPassword = async () => { window.__asked++; return 'pw1234'; };
          }
          await openCaseInEditor(row);
          o.reopen1 = look();
          o.asked = window.__asked || 0;
          back();
          await openCaseInEditor(row);
          o.reopen2 = look();
        }
        if(!(label === '㉕j' && mode !== 'strip') && !(label === '㉕k' && mode === 'shown')) __setTel('090-2222-3333');   // ㉕j：直さずに一覧へ戻る（行は写真を持たないまま）
        if(label === '㉕j'){
          back();                                               // 一覧へ戻る（strip：直したので行へ取り込む）
          const genba = { chosho_mgmt_no: NO, _origin: 'genba', work_type: 'uhf_new', chosho_photos: [{ id: 'g1', label: '現場', dataUri: P }] };
          o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').slice(0, 60);   // 📥 現場取込（開いている戸別）
          o.afterImport = look();
          __setTel('090-2222-3333');
        }
        if(label === '㉕k'){
          printWithFilename = (n, cb) => { try { cb && cb(); } catch(_){} };
          await buildAndPrintChoshoBatch([row], 'x_');          // 🖨 工事調書をまとめて印刷（画面を戻す）
          await new Promise(r => setTimeout(r, 300));
          o.afterPrint = look();
          if(mode === 'shown'){ STATE.photos = STATE.photos.filter(p => !(p && p.dataUri === B)); renderPhotoInputs(); __setTel('090-2222-3333'); }
        }
        if(label === '㉕e') o.added = !!(await __addPhoto(P, 'p.jpg'));
        if(label === '㉕i'){ STATE.photos = STATE.photos.filter(p => !(p && p.dataUri === B)); renderPhotoInputs(); }
        if(label === '㉕o'){ list.__files[FN] = fileText.slice(0, fileText.length - 2); }   // ファイルの終わりが欠けた（同期の途中など）
        const before = list.__files[FN];
        const w0 = list.__writes.length;
        o.press = await __pressSave();
        await new Promise(r => setTimeout(r, 200));
        o.writes = list.__writes.length - w0;
        o.unchanged = list.__files[FN] === before;
        o.file = (label === '㉕o') ? null : await dec();
        if(label === '㉕g' && mode === 'pw') o.fileOther = await dec('betsu-pass-99');
        if(label === '㉕e'){ await __pressSave(); o.file2 = await dec(); }
        if(label === '㉕m'){                                     // 💾 のあと一覧へ戻って 📷（8回目の見直し：剥がした封筒の行でもファイルの写真を読む）
          back();
          await showPhotoPreviewForRow(row);
          const pb = document.getElementById('photo-prev-body');
          o.afterSavePreview = pb ? ([...pb.querySelectorAll('img')].map(im => nm(im.getAttribute('src'))).join(',') || ('（' + pb.textContent.trim().slice(0, 30) + '）')) : '';
          closePhotoPreview();
        }
        if(label === '㉕o'){ try { const d0 = await decryptHybrid(JSON.parse(fileText), 'pw1234'); o.recoverable = (d0.chosho_photos || []).length; } catch(_){ o.recoverable = -1; } }
        return o;
      }, { NO, PN, label, mode });
    const lost = said.filter(s => /写真が失われます/.test(s.msg)).length;
    const al = alerts(said).map(a => a.replace(/\s+/g, ' '));
    const rewriteAsk = said.filter(s => s.type === 'confirm' && /書き直しますか/.test(s.msg)).length;
    console.log(L + '写真の出ていない画面から上書き保存', short(r), 'lostAsk=' + lost, short(al.map(a => a.slice(0, 50))));
      ok(!r.error, L + '止まった → ' + r.error);
      if(!r.error){
        if(label === '㉕e'){
          ok(r.attached && /上書き保存/.test(r.btn) && r.stripped && r.shown === 0 && r.added, '★' + L + ' 試験の前提 ' + short(r));
          ok(lost === 0, '★' + L + ' 「写真が失われます」と聞いた');
          ok(r.writes === 1 && r.file.n === 3 && r.file.ids === 'A,B,P' && r.file.tel === '090-2222-3333' && r.file.name === '暗号 様', '★' + L + ' .hyb の写真が減った・足した写真が無い・直しが無い ' + short(r.file));
          ok(r.file2 && r.file2.n === 3 && r.file2.ids === 'A,B,P', '★' + L + ' 2回目の上書き保存で減った ' + short(r.file2));
          ok(!/失われます/.test(r.bannerText) && /元の写真はそのまま残し/.test(r.bannerText), '★' + L + ' 帯が「写真が失われます」のまま・新しい文言でない → ' + r.bannerText);
        }
        if(label === '㉕f'){
          ok(r.first === 2 && r.stripped && r.shown === 2 && /上書き保存/.test(r.btn), '★' + L + ' 試験の前提（開き直すと行の写真 A・B が出る・写真の出ていない画面の印） ' + short(r));
          ok(lost === 0, '★' + L + ' 「写真が失われます」と聞いた');
          ok(r.writes === 1 && r.file.n === 2 && r.file.ids === 'A,B' && r.file.tel === '090-2222-3333', '★' + L + ' .hyb の写真が減った ' + short(r.file));
        }
        if(label === '㉕g'){
          ok(r.attached && r.stripped && r.shown === 0, '★' + L + ' 試験の前提 ' + short(r));
          ok(r.unchanged && r.writes === 0, '★' + L + ' ほどけない .hyb に写真なしで書いた ' + short(r));
          ok(al.some(a => /上書き保存していません/.test(a) && /別のパスワード/.test(a) && /写真の部分が壊れている/.test(a) && /入力した内容はこの画面に残っています/.test(a)),
             '★' + L + ' 書かなかったこと・わけを知らせない ' + short(al));
          ok(!al.some(a => /開き直/.test(a)), '★' + L + ' 開き直しても直らないのに「開き直して」と案内した ' + short(al));
          if(mode === 'pw') ok(r.fileOther && r.fileOther.n === 2, '★' + L + ' 元のパスワードでほどけなくなった ' + short(r.fileOther));
        }
        if(label === '㉕h'){
          ok(r.attached && r.stripped, '★' + L + ' 試験の前提 ' + short(r));
          ok(lost === 0, '★' + L + ' 写真の無いファイルなのに「写真が失われます」と聞いた');
          ok(r.writes === 1 && r.file.tel === '090-2222-3333', '★' + L + ' 書かなかった ' + short(r.file));
        }
        if(label === '㉕j'){
          if(mode === 'plain'){
            ok(r.shown === 2 && !r.stripped && /上書き保存/.test(r.btn) && r.afterImport && r.afterImport.shown === 'A,B,P',
               '★' + L + ' 試験の前提: 開いている平文の戸別へ 📥 すると画面は A・B・P → ' + short(r));
            ok(r.afterImport && !r.afterImport.stripped && !r.afterImport.banner, '★' + L + ' 平文の戸別へ 📥 したら「写真が出ていません」の帯・印が出た → ' + short(r.afterImport));
            ok(r.writes === 1 && r.file.fmt === 'plain' && r.file.ids === 'A,B,P', '★' + L + ' 平文の戸別の上書き保存が変わった → ' + short(r.file));
          } else {
            ok(r.afterImport && r.afterImport.shown === 'P' && /上書き保存/.test(r.afterImport.btn) && (mode === 'strip' ? (r.attached && r.stripped) : (!r.stripped && r.shown === 2)),
               '★' + L + ' 試験の前提: 開いている暗号の戸別へ 📥 すると画面には取り込んだ写真だけ → ' + short(r));
            ok(r.afterImport && r.afterImport.stripped && r.afterImport.banner, '★' + L + ' 📥 のあと、写真の出ていない画面の印・帯が無い → ' + short(r.afterImport));
            ok(r.writes === 1 && r.file.n === 3 && r.file.ids === 'A,B,P' && r.file.tel === '090-2222-3333', '★' + L + ' 📥 で入れた写真だけで .hyb を書いた（元の写真が消えた） → ' + short(r.file));
          }
        }
        if(label === '㉕k'){
          if(mode === 'shown'){
            ok(!r.stripped && r.shown === 2 && /上書き保存/.test(r.btn), '★' + L + ' 試験の前提: 写真の出ている画面 → ' + short(r));
            ok(r.afterPrint && !r.afterPrint.stripped && !r.afterPrint.banner, '★' + L + ' 写真の出ている画面なのに、まとめて印刷のあと「写真が出ていません」の帯・印が出た → ' + short(r.afterPrint));
            ok(r.writes === 1 && r.file.ids === 'A' && r.file.tel === '090-2222-3333', '★' + L + ' まとめて印刷のあと、画面で消した写真 B が消えない → ' + short(r.file));
          } else {
            ok(r.attached && r.stripped && r.shown === 0, '★' + L + ' 試験の前提 → ' + short(r));
            ok(r.afterPrint && r.afterPrint.stripped && r.afterPrint.banner, '★' + L + ' まとめて印刷のあと、写真の出ていない画面の印・帯が消えた → ' + short(r.afterPrint));
            ok(lost === 0 && r.writes === 1 && r.file.n === 2 && r.file.ids === 'A,B' && r.file.tel === '090-2222-3333', '★' + L + ' まとめて印刷のあと上書き保存で .hyb の写真が減った → ' + short(r.file));
          }
        }
        if(label === '㉕i'){
          ok(!r.stripped && /上書き保存/.test(r.btn) && r.shown === 2, '★' + L + ' 試験の前提 ' + short(r));
          ok(r.writes === 1 && r.file.n === 1 && r.file.ids === 'A' && r.file.tel === '090-2222-3333', '★' + L + ' 画面で消した写真が消えない（今までと変わった） ' + short(r.file));
        }
        if(label === '㉕l'){
          ok(r.attached && r.fhName === NO + '.json' && r.stripped && /上書き保存/.test(r.btn), '★' + L + ' 試験の前提: 物件の暗号の行が平文の 管理番号.json に付いて、写真の出ていない画面 → ' + short(r));
          ok(r.unchanged && r.writes === 0 && r.file.fmt === 'plain' && r.file.ids === 'A,B', '★' + L + ' 暗号の形でないファイルを、写真なしの .hyb で書いた（写真 A・B が消えた） → ' + short(r));
          ok(al.some(a => /上書き保存していません/.test(a) && /暗号（\.hyb）の形ではありません/.test(a) && /入力した内容はこの画面に残っています/.test(a)),
             '★' + L + ' 書かなかったこと・わけを知らせない ' + short(al));
          ok(!al.some(a => /📁/.test(a)), '★' + L + ' 「📁 フォルダ」を案内した（読み直しても直らない） ' + short(al));
        }
        if(label === '㉕m'){
          const one = mode === 'proj' ? 'P' : 'A,B,P';
          ok(r.added && r.rowAfterBack === one && (mode === 'proj' ? (r.attached && r.stripped && r.shown === 0) : (!r.stripped && r.shown === 2)),
             '★' + L + ' 試験の前提: 写真 P を足して一覧へ戻ると、行に写真が入る → ' + short(r));
          if(mode === 'pw') ok(r.asked === 1, '★' + L + ' 試験の前提: 開き直すときパスワードを聞かれる → ' + short(r));
          ok(r.reopen1 && r.reopen1.shown === one && r.reopen1.stripped && r.reopen1.banner, '★' + L + ' 開き直すと、足した写真 P が画面から消えた → ' + short(r.reopen1));
          /* 8回目の見直しの直し：開いても行を「ファイルから読む」に替えない（開く前のまま）＝もう一度開いても行の封筒で、写真の出ていない画面。
             ファイルから読む形に替えると、まだファイルに無い直しをファイルの古い中身で戻す（㉕t） */
          ok(r.reopen2 && r.reopen2.shown === one && r.reopen2.stripped,
             '★' + L + ' 何もせずに一覧へ戻ってもう一度開くと、足した写真 P が消えた・行がファイルから読む形に替わった（写真の出ていない画面でない） → ' + short(r.reopen2));
          ok(lost === 0 && r.writes === 1 && r.file.n === 3 && r.file.ids === 'A,B,P' && r.file.tel === '090-2222-3333', '★' + L + ' 足して一覧へ戻った写真 P が .hyb に入らない・元の写真が減った → ' + short(r.file));
          ok(r.afterSavePreview === 'A,B,P', '★' + L + ' 💾 上書き保存して一覧へ戻ったあと、📷 にファイルの写真 A・B・P が出ない（行の封筒の、写真を剥がした印を読んだ） → ' + r.afterSavePreview);
        }
        if(label === '㉕o'){
          ok(r.attached && r.stripped && r.shown === 0 && r.recoverable === 2, '★' + L + ' 試験の前提 → ' + short(r));
          ok(r.unchanged && r.writes === 0, '★' + L + ' 写真の出ていない画面から、壊れた .hyb を写真なしで書き直した → ' + short(r));
          ok(rewriteAsk === 0, '★' + L + ' 「この画面の中身で書き直しますか」と聞いた（OK で写真がみな消える）');
          ok(al.some(a => /上書き保存していません/.test(a) && /壊れていて読めません/.test(a) && /入力した内容はこの画面に残っています/.test(a)), '★' + L + ' 書かなかったことを知らせない ' + short(al));
        }
      }
    await ctx.close();
  }

  // ---- ㉕p 開き直すとき行の写真を出す決まり（8回目の見直しで今の形に）----
  //   写真を剥がした封筒で開いたときは、行の写真をいつも出す（当てにしてよい印が無くても＝📥 で入れた写真）。
  //   ファイルからほどいたときは、ファイルの写真に、行にだけある写真を足して出す（置き換えない・同じ写真を二重にしない）。
  //   名前だけの枠しか無いときは出さない（ファイルの写真も変えない）
  if(want('㉕p')){
    const { ctx, page } = await openMain('㉕p');
    const r = await run(page, async () => {
      const F = { id: 'f1', label: 'ファイル', dataUri: __jpeg(300, 200, 0.8, 171) }, R = { id: 'r1', label: '行', dataUri: __jpeg(300, 200, 0.8, 172) };
      const strip = o => { Object.defineProperty(o, '_photosStripped', { value: true, enumerable: false }); return o; };
      const ids = a => (Array.isArray(a) ? a : []).map(p => p && p.id).join(',');
      const t = (full, target) => { const got = hybRowPhotosToShow(full, target); return { got: got ? ids(got) : null, full: ids(full.chosho_photos), flag: !!full._photosStripped }; };
      return {
        known:    t(strip({ chosho_photos: null }), { _photosKnown: true,  data: { chosho_photos: [R] } }),
        notStrip: t({ chosho_photos: [F] },        { _photosKnown: true,  data: { chosho_photos: [R] } }),
        imported: t({ chosho_photos: [F] },        { _photosKnown: false, data: { chosho_photos: [R] } }),     // 📥 で入れた（当てにしてよい印は無い）
        same:     t({ chosho_photos: [F] },        { _photosKnown: true,  data: { chosho_photos: [F, R] } }),  // ファイルにもある写真
        noFile:   t({ chosho_photos: null },       { _photosKnown: true,  data: { chosho_photos: [R] } }),     // ファイルに写真が無い
        fileFrames: t({ chosho_photos: [F] },      { _photosKnown: true,  data: { chosho_photos: [{ id: 'w1', label: '枠', dataUri: null }] } }),
        unknown:  t(strip({ chosho_photos: null }), { _photosKnown: false, data: { chosho_photos: [R] } }),
        frames:   t(strip({ chosho_photos: null }), { _photosKnown: true,  data: { chosho_photos: [{ id: 'w1', label: '枠', dataUri: null }] } })
      };
    });
    console.log('㉕p開き直すとき行の写真を出す決まり', short(r));
    ok(!r.error, '㉕p止まった → ' + r.error);
    if(!r.error){
      ok(r.known.got === 'r1' && r.known.full === 'r1' && r.known.flag, '★㉕p写真を剥がした封筒で開いたのに、画面から取り込んだ行の写真を出さない・印が外れた → ' + short(r.known));
      ok(r.unknown.got === 'r1' && r.unknown.full === 'r1' && r.unknown.flag,
         '★㉕p写真を剥がした封筒で開いたとき、当てにしてよい印の無い行の写真（📥 で入れた写真）を出さない・印が外れた → ' + short(r.unknown));
      ok(r.notStrip.got === 'r1' && r.notStrip.full === 'f1,r1' && !r.notStrip.flag,
         '★㉕pファイルからほどいたとき、ファイルの写真に行にだけある写真を足さない（置き換えた・出さない） → ' + short(r.notStrip));
      ok(r.imported.got === 'r1' && r.imported.full === 'f1,r1', '★㉕pファイルからほどいたとき、📥 で入れた行の写真（当てにしてよい印なし）を足さない → ' + short(r.imported));
      ok(r.same.full === 'f1,r1', '★㉕pファイルにもある写真を二重にした・ファイルの写真が消えた → ' + short(r.same));
      ok(r.noFile.got === 'r1' && r.noFile.full === 'r1', '★㉕pファイルに写真が無いとき、行にだけある写真を出さない → ' + short(r.noFile));
      ok(r.frames.got === null && r.frames.full === '', '★㉕p名前だけの枠しか無いのに、行の写真として出した → ' + short(r.frames));
      ok(r.fileFrames.got === null && r.fileFrames.full === 'f1', '★㉕p名前だけの枠しか無い行で、ファイルの写真を変えた・枠を行の写真として出した → ' + short(r.fileFrames));
    }
    await ctx.close();
  }

  // ---- ㉕n 全暗号化(.enc)の戸別を開いたまま 📥 現場取込（写真 G）→ 💾 上書き保存 を押せない（版177 と同じ）・.enc の写真 A・B はそのまま ----
  //   （版178 の ㊽b で行き先を戻したため、取り込んだ写真 G だけで .enc を書き、A・B が消えていた）
  if(want('㉕n')){
    const { ctx, page, said } = await openMain('㉕n');
    const r = await run(page, async ({ NO }) => {
      const A = __jpeg(600, 450, 0.85, 161), B = __jpeg(640, 480, 0.85, 162), G = __jpeg(620, 460, 0.85, 163);
      const nm = u => u === A ? 'A' : u === B ? 'B' : u === G ? 'G' : '?';
      const shownNow = () => (STATE.photos || []).filter(p => p && p.dataUri).map(p => nm(p.dataUri)).join(',');
      const withAB = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress', work_type: 'uhf_new',
                       amplifier: 'amp_3u43', chosho_photos: [{ id: 'eA', label: 'A', dataUri: A }, { id: 'eB', label: 'B', dataUri: B }] };
      setSessionPassword('pw1234');
      const env = await encryptJsonString(JSON.stringify(withAB), 'pw1234');
      const text = JSON.stringify(env);
      const list = __mk('リスト', { [NO + '.enc']: text }, {}, { resolve: true });
      const fh = await list.getFileHandle(NO + '.enc');
      const row = buildListRow('リスト/' + NO + '.enc', 1, env, fh);   // 📁 で読んだ行
      row._dir = list; row._name = NO + '.enc'; row._dirPath = 'リスト/'; slimListRow(row, true);
      _listRows = [row];
      await unlockListView({ silent: true });                          // 🔓 まとめて復号
      const o = { type: row.fileType, slim: !!row._slim };
      await openCaseInEditor(row);
      o.shown1 = shownNow(); o.btn1 = document.getElementById('btn-save-overwrite').textContent;
      openListView();                                                  // 何もせずに一覧へ
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', work_type: 'uhf_new', chosho_photos: [{ id: 'g1', label: 'G', dataUri: G }] };
      await applyGenbaMergeToRow(row, genba, { importRun: true });     // 📥 現場取込（開いている戸別）
      const b = document.getElementById('btn-save-overwrite');
      o.afterImport = { shown: shownNow(), btn: b.textContent, disabled: b.disabled, origin: !!(_loadedOrigin && _loadedOrigin.fileHandle) };
      const w0 = list.__writes.length;
      o.press = await __pressSave();
      o.writes = list.__writes.length - w0;
      o.unchanged = list.__files[NO + '.enc'] === text;
      try { const d = JSON.parse(await decryptJsonString(JSON.parse(list.__files[NO + '.enc']), 'pw1234'));
            o.file = (d.chosho_photos || []).filter(p => p && p.dataUri).map(p => nm(p.dataUri)).join(','); }
      catch(e){ o.file = 'err:' + String((e && e.message) || e).slice(0, 60); }
      return o;
    }, { NO });
    console.log('㉕n全暗号化の戸別へ開いたまま現場取込', short(r));
    ok(!r.error, '㉕n止まった → ' + r.error);
    if(!r.error){
      ok(r.type === 'full' && r.slim && r.shown1 === 'A,B' && /上書き保存/.test(r.btn1) && r.afterImport.shown === 'G',
         '㉕n試験の前提: .enc の戸別を開くと A・B、📥 のあと画面は G だけ → ' + short(r));
      ok(!r.afterImport.origin && !(/上書き保存/.test(r.afterImport.btn) && !r.afterImport.disabled),
         '★㉕n開いている .enc の戸別へ 📥 したあと、💾 上書き保存 が押せる（取り込んだ写真だけで書く） → ' + short(r.afterImport));
      ok(r.writes === 0 && r.unchanged && r.file === 'A,B', '★㉕n📥 で入れた写真だけで .enc を書いた（元の写真 A・B が消えた） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊾c 📥 現場取込で戸別ファイルへ書けなかった（常駐させない行・ファイルの写真 A・B）→ 物件（この端末・共有ファイル）に
  //   ファイルの写真と取り込んだ写真 G の両方が入る（枚数も3）。行は「ファイルから読む」のまま・G は行にだけ・ファイルは元のまま
  //   一覧の枚数はファイルの枚数のまま（🧩 重複をまとめる が残すファイルを選ぶのに使う）
  //   h) ファイルだけ付いている行・工事フォルダを掴めない　src) 📄 で読んだ行・工事フォルダを掴めない
  //   ro) 📁 の行・書くときだけファイルを読めない（同期中）
  //   dupid) h と同じで、ファイルにもう G がある（同じ写真ID・中身は軽くしたもの）　dupuri) ファイルに同じ中身の写真が別の写真IDである
  //   zero) h と同じで、ファイルに写真が無い → 物件に G（1枚）
  //   （前は物件のこの戸別が取り込んだ写真 G の1枚だけになり、物件しか見ないほかの端末では A・B が消えて見えた）
  for(const mode of ['h', 'src', 'ro', 'dupid', 'dupuri', 'zero'].filter(m => want('㊾c' + m))){
    const { ctx, page } = await openMain('㊾c' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178ic' + mode;
      const A = __jpeg(900, 700, 0.85, 361), B = __jpeg(900, 700, 0.85, 362), G = __jpeg(900, 700, 0.85, 363), G2 = __jpeg(600, 467, 0.7, 363);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };   // 図面なし
      await __openShared(__proj178(PID, PN, []));
      const fph = (mode === 'zero') ? [] : [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }];
      if(mode === 'dupid') fph.push({ id: 'G', label: 'G', dataUri: G2 });          // ファイルにもう G がある（軽くしたもの）
      if(mode === 'dupuri') fph.push({ id: 'g-old', label: 'G', dataUri: G });      // 同じ中身が別の写真IDで入っている
      const text = JSON.stringify(Object.assign({}, base, { chosho_photos: fph }), null, 2);
      const list = __mk('リスト', { [NO + '.json']: text });
      let row;
      if(mode === 'src'){
        const f = new File([text], NO + '.json', { type: 'application/json', lastModified: Date.parse('2026-10-01T01:00:00Z') });
        row = buildListRow(f.name, f.lastModified, JSON.parse(text)); row.srcFile = f;   // 📄 で読んだ戸別
      } else {
        const fh = await list.getFileHandle(NO + '.json');
        row = buildListRow(NO + '.json', 1, JSON.parse(text), fh);
        if(mode === 'ro'){ row._dir = list; row._name = NO + '.json'; row._dirPath = ''; }   // 📁 フォルダで読んだ行
      }
      slimListRow(row, true);
      _listRows = [row];
      const uniq = a => a.length === new Set(a).size;
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const dk = JSON.parse(window.__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        const di = ((dk && dk.payload.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id);
        const ii = x.photos.map(p => p.id);
        return { idb: ii.slice().sort().join(','), idbUniq: uniq(ii), idbCount: x.count, thumb: x.thumb,
                 small: x.photos.length > 0 && !x.photos.some(p => [A, B, G].indexOf(p.dataUri) >= 0),   // 物件には縮小版（元の写真ではない）
                 disk: di.slice().sort().join(','), diskUniq: uniq(di), diskCount: dk && dk.payload.chosho_photo_count }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();                                                // 物件に保存（ファイルの写真の縮小版）
      const o = { before: await proj(), slim: !!row._slim };
      __abortPicker(); _genbaNoDir = false;                            // 取り込みのときは工事フォルダを掴めなかった
      if(mode === 'ro') list.__unreadable[NO + '.json'] = 2;           // 書くとき（付いているか確かめる・中身を作る）だけ読めない
      const genba = { chosho_mgmt_no: NO, _origin: 'genba', chosho_cust_name: '試験 様', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);   // 📥 現場取込
      o.unread = list.__unreadable[NO + '.json'] || 0;
      await saveProj();                                                // 取り込みのあとの物件の保存
      o.after = await proj();
      o.row = { slim: !!row._slim, held: ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).join(','), count: row._photoCount };
      o.fileSame = list.__files[NO + '.json'] === text;
      return o;
    }, { NO, PN, mode });
    console.log('㊾c' + mode + '・書けなかった取り込みのあとの物件の写真', short(r));
    ok(!r.error, '㊾c' + mode + '止まった → ' + r.error);
    if(!r.error){
      const n0 = (mode === 'zero') ? 0 : ((mode === 'dupid' || mode === 'dupuri') ? 3 : 2);   // ファイルの枚数
      const n1 = (mode === 'zero') ? 1 : 3;                                                      // 物件の枚数（ファイルと G を合わせて）
      const want3 = (mode === 'zero') ? 'G' : (mode === 'dupuri' ? 'A,B,g-old' : 'A,B,G');
      ok(r.slim && r.before.idbCount === n0 && r.before.diskCount === n0 && r.unread === 0 && r.fileSame
         && (mode === 'ro' ? /読めませんでした/ : /工事フォルダを掴めていません/).test(r.note) && r.row.slim && r.row.held === 'G',
         '㊾c' + mode + '試験の前提: 物件にファイルの写真が入り、取り込んだ G は行にだけ（戸別ファイルは元のまま） → ' + short(r));
      ok(r.after.idb === want3 && r.after.idbUniq && r.after.idbCount === n1 && r.after.thumb && r.after.small,
         '★㊾c' + mode + '物件（この端末）のこの戸別が、ファイルの写真と取り込んだ写真の両方（縮小版・1枚ずつ・' + n1 + '枚）になっていない → ' + short(r.after));
      ok(r.after.disk === want3 && r.after.diskUniq && r.after.diskCount === n1,
         '★㊾c' + mode + '共有ファイルの物件のこの戸別が、ファイルの写真と取り込んだ写真の両方（1枚ずつ・' + n1 + '枚）になっていない → ' + short(r.after));
      ok(r.row.count === n0, '★㊾c' + mode + '一覧の写真の枚数が、ファイルの枚数（' + n0 + '）のままでない（🧩 重複をまとめる が残すファイルを選び違える） → ' + short(r.row));
    }
    await ctx.close();
  }

  // ---- ㊾d 📥 現場取込で、写真の無い現場のデータ（下見済みの印だけ）を取り込み、戸別ファイルへ書けなかった ----
  //   a) 工事フォルダを掴めない → 物件（この端末・共有ファイル）のこの戸別は、ファイルの写真 A・B（2枚）のまま（前は「写真なし・0枚」になっていた）
  //   b) 📁 の行・ファイルを読めない（同期中。物件の保存でも読めない）→ 物件は A・B のまま →
  //      同期でファイルに C も入り、読めるようになった次の物件の保存で、ファイルから作り直す（A・B・C）
  for(const mode of ['a', 'b'].filter(m => want('㊾d' + m))){
    const { ctx, page } = await openMain('㊾d' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178id' + mode;
      const A = __jpeg(900, 700, 0.85, 364), B = __jpeg(900, 700, 0.85, 365), C = __jpeg(900, 700, 0.85, 392);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      if(mode === 'b'){ row._dir = list; row._name = NO + '.json'; row._dirPath = ''; }   // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const dk = JSON.parse(window.__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();
      const o = { before: await proj() };
      if(mode === 'a'){ __abortPicker(); _genbaNoDir = false; }
      else list.__unreadable[NO + '.json'] = 99;                       // b) しばらく読めない（書くときも、縮小版を作るときも）
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', survey_done: true, survey_done_at: '2026-10-10T09:00' }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      await saveProj();
      o.after = await proj();
      o.row = { slim: !!row._slim, count: row._photoCount, survey: !!(row.data || {}).survey_done };
      if(mode === 'b'){
        // 同期で、ほかの端末が足した写真 C もファイルに入り、読めるようになった
        list.__files[NO + '.json'] = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }, { id: 'C', label: 'C', dataUri: C }] }), null, 2);
        list.__unreadable[NO + '.json'] = 0;
        await saveProj();                                              // 次の物件の保存（自動保存）
        o.healed = await proj();
      }
      return o;
    }, { NO, PN, mode });
    console.log('㊾d' + mode + '・写真の無い取り込み・書けなかった', short(r));
    ok(!r.error, '㊾d' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.before.idb === 'A,B' && r.before.idbCount === 2 && r.before.disk === 'A,B'
         && (mode === 'a' ? /工事フォルダを掴めていません/ : /読めませんでした/).test(r.note) && r.row.slim && r.row.survey,
         '㊾d' + mode + '試験の前提: 物件に写真2枚・取り込んだ下見済みの印は行に入り、戸別ファイルへは書けなかった → ' + short(r));
      ok(r.after.idb === 'A,B' && r.after.idbCount === 2, '★㊾d' + mode + '物件（この端末）のこの戸別が、写真の無い取り込みで写真2枚（A・B）ではなくなった → ' + short(r.after));
      ok(r.after.disk === 'A,B' && r.after.diskCount === 2, '★㊾d' + mode + '共有ファイルの物件のこの戸別が、写真の無い取り込みで写真2枚（A・B）ではなくなった → ' + short(r.after));
      ok(r.row.count === 2, '★㊾d' + mode + '一覧の写真の枚数がファイルの枚数（2）ではなくなった → ' + short(r.row));
      if(mode === 'b')
        ok(r.healed.idb === 'A,B,C' && r.healed.idbCount === 3 && r.healed.disk === 'A,B,C',
           '★㊾db読めるようになっても、次の物件の保存でファイルから作り直さない（同期で入った C が物件に入らない） → ' + short(r.healed));
    }
    await ctx.close();
  }

  // ---- ㊾e ㊾c ro と同じで、縮小版を作るときもファイルを読めない（同期がまだ終わっていない）----
  //   → 物件は前の縮小版（ファイルの写真 A・B）に取り込んだ写真 G を足したもの（3枚）・一覧の枚数はファイルの枚数（2）のまま
  //   → 同期でファイルに C も入り、読めるようになった → 次の物件の保存（自動保存）でファイルから作り直す（A・B・C・G。開かなくても）
  //   → 知らせのとおり戸別を開いて「💾 物件に保存」→ 戸別ファイルも物件も A・B・C・G
  //   はじめの物件の保存で読めなかったとき（縮小版なし・枚数だけ）も、次の保存で縮小版が入る（これまでと同じ）
  if(want('㊾e')){
    const { ctx, page } = await openMain('㊾e');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ie';
      const A = __jpeg(900, 700, 0.85, 366), B = __jpeg(900, 700, 0.85, 367), G = __jpeg(900, 700, 0.85, 368), C = __jpeg(900, 700, 0.85, 369);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      row._dir = list; row._name = NO + '.json'; row._dirPath = '';    // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const dk = JSON.parse(window.__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      list.__unreadable[NO + '.json'] = 99;                            // はじめの物件の保存では読めない
      await saveProj();
      const o = { first: await proj(), firstLeft: list.__unreadable[NO + '.json'] < 99 };
      list.__unreadable[NO + '.json'] = 0;
      await saveProj();                                                // 次の保存では読める
      o.before = await proj();
      list.__unreadable[NO + '.json'] = 99;                            // しばらく読めない（書くときも、縮小版を作るときも）
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      await saveProj();
      o.unreadable = await proj();
      o.rowCount = row._photoCount;
      // 同期で、ほかの端末が足した写真 C もファイルに入った（まだ読めない）
      list.__files[NO + '.json'] = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }, { id: 'C', label: 'C', dataUri: C }] }), null, 2);
      await saveProj();
      o.unreadable2 = await proj();
      list.__unreadable[NO + '.json'] = 0;                             // 同期が終わって読めるようになった
      await saveProj();                                                // 次の物件の保存（自動保存）
      o.healed = await proj();
      o.healedCount = row._photoCount;
      await openCaseInEditor(row);                                     // 知らせのとおり、戸別を開いて
      o.shown = ids(STATE.photos);
      __setTel('090-1111-2222');
      o.btn = await __pressSave();                                     // 💾 物件に保存
      o.file = ids(__photosOf(list.__files[NO + '.json']));
      openListView();
      await saveProj();
      o.after = await proj();
      return o;
    }, { NO, PN });
    console.log('㊾e縮小版を作るときも読めない', short(r));
    ok(!r.error, '㊾e止まった → ' + r.error);
    if(!r.error){
      ok(r.firstLeft && r.first.idb === '' && r.first.idbCount === 2 && /読めませんでした/.test(r.note) && r.shown === 'A,B,C,G' && r.btn.pressed,
         '㊾e試験の前提: はじめの保存では読めず枚数だけ・取り込みは書けなかった・あとで読めるようになって開くと A・B・C・G が出る・保存できる → ' + short(r));
      ok(r.before.idb === 'A,B' && r.before.idbCount === 2 && r.before.disk === 'A,B',
         '★㊾eはじめの物件の保存で読めなかったあと、次の保存で物件にファイルの写真の縮小版が入らない → ' + short(r.before));
      ok(/(^|,)G(,|$)/.test(r.unreadable.idb) && /(^|,)G(,|$)/.test(r.unreadable.disk),
         '★㊾e縮小版を作るときに読めなかったら、物件から取り込んだ写真 G まで消えた → ' + short(r.unreadable));
      ok(r.unreadable.idb === 'A,B,G' && r.unreadable.disk === 'A,B,G' && r.unreadable2.idb === 'A,B,G' && r.unreadable2.disk === 'A,B,G',
         '★㊾e読めないあいだ、物件からファイルの写真 A・B が消えた（前の縮小版に G を足していない） → ' + short(r.unreadable) + ' ' + short(r.unreadable2));
      ok(r.unreadable.idbCount === 3 && r.unreadable.diskCount === 3 && r.rowCount === 2,
         '★㊾e読めなかったとき、物件の枚数が3（A・B・G）でない・一覧の枚数がファイルの枚数（2）でない → ' + short(r.unreadable) + ' 行 ' + r.rowCount);
      ok(r.healed.idb === 'A,B,C,G' && r.healed.idbCount === 4 && r.healed.disk === 'A,B,C,G' && r.healedCount >= 2,
         '★㊾e読めるようになっても、次の物件の保存でファイルから作り直さない（同期で入った C が物件に入らない） → ' + short(r.healed) + ' 行 ' + r.healedCount);
      ok(r.file === 'A,B,C,G' && r.after.idb === 'A,B,C,G' && r.after.idbCount === 4 && r.after.disk === 'A,B,C,G',
         '★㊾e読めるようになって開いて保存しても、戸別ファイル・物件が A・B・C・G にならない → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㊾f ㊾c h と同じ（物件に A・B・G）→ ほかの端末が共有ファイルを保存 → まとめて行が作り直される（a 自動保存　b 🔄 最新を取り込む）----
  //   → 行には取り込んだ G の元の写真が残る・物件（この端末・共有ファイル）は A・B・G のまま（同じ写真は1枚）・ほかの端末の戸別も残る
  //   → 知らせのとおり戸別を開いて「💾 物件に保存」でフォルダを選ぶ → 戸別ファイルは A・B・G（どれも元の写真・1枚ずつ）
  for(const mode of ['a', 'b'].filter(m => want('㊾f' + m))){
    const { ctx, page } = await openMain('㊾f' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178if' + mode;
      const A = __jpeg(900, 700, 0.85, 371), B = __jpeg(900, 700, 0.85, 372), G = __jpeg(900, 700, 0.85, 373);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      slimListRow(row, true);
      _listRows = [row];
      const uniq = a => a.length === new Set(a).size;
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const all = JSON.parse(window.__disk).cases; const dk = all.filter(c => (c.payload || {}).chosho_mgmt_no === NO);
        const di = ((dk[0] && dk[0].payload.chosho_photos) || []).filter(p => p && p.dataUri).map(p => p.id);
        const ii = x.photos.map(p => p.id);
        return { idb: ii.slice().sort().join(','), idbUniq: uniq(ii), idbCount: x.count,
                 disk: di.slice().sort().join(','), diskUniq: uniq(di), diskCount: dk[0] && dk[0].payload.chosho_photo_count, diskCases: dk.length, all: all.length }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();
      __abortPicker(); _genbaNoDir = false;
      const o = {};
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      await saveProj();
      o.saved = await proj();
      __otherDeviceSaves('2612MKM099');                                // ほかの端末が共有ファイルを保存した（別の戸別を足した）
      if(mode === 'a'){ markCaseEdited(row); await saveProj(); }       // 自動保存でまとめる
      else await rtPullLatest();                                       // 🔄 最新を取り込む
      const nr = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      const rp = ((nr && nr.data && nr.data.chosho_photos) || []).filter(p => p && p.dataUri);
      o.rebuilt = { other: nr !== row, ids: rp.map(p => p.id).sort().join(','), gOrig: rp.some(p => p.id === 'G' && p.dataUri === G), count: nr && nr._photoCount, rows: _listRows.length };
      await saveProj();
      o.merged = await proj();
      window.showDirectoryPicker = async () => list;                   // 保存のとき工事フォルダを選ぶ
      await openCaseInEditor(nr);
      __setTel('090-1111-2222');
      o.btn = await __pressSave();                                     // 💾 物件に保存
      const fp = __photosOf(list.__files[NO + '.json']) || [];
      o.file = { ids: fp.map(p => p.id).sort().join(','), uniq: uniq(fp.map(p => p.id)),
                 orig: fp.some(p => p.id === 'A' && p.dataUri === A) && fp.some(p => p.id === 'B' && p.dataUri === B) && fp.some(p => p.id === 'G' && p.dataUri === G),
                 tel: JSON.parse(list.__files[NO + '.json']).chosho_cust_tel };
      openListView();
      await saveProj();
      o.final = await proj();
      return o;
    }, { NO, PN, mode });
    console.log('㊾f' + mode + '・書けなかった取り込みのあと、まとめで行が作り直される', short(r));
    ok(!r.error, '㊾f' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(/工事フォルダを掴めていません/.test(r.note) && r.rebuilt.other && r.rebuilt.rows === 2 && r.btn.pressed && r.file.tel === '090-1111-2222',
         '㊾f' + mode + '試験の前提: 書けなかった・まとめで行が作り直され、ほかの端末の戸別も入った・あとで物件に保存できる → ' + short(r));
      ok(r.saved.idb === 'A,B,G' && r.saved.idbCount === 3 && r.saved.disk === 'A,B,G' && r.saved.diskCount === 3,
         '★㊾f' + mode + 'まとめる前の物件（この端末・共有ファイル）が A・B・G になっていない → ' + short(r.saved));
      ok(r.rebuilt.gOrig && r.rebuilt.ids === 'A,B,G' && r.rebuilt.count === 3,
         '★㊾f' + mode + 'まとめて作り直した行に、取り込んだ G の元の写真・ファイルの写真の縮小版が無い（枚数3でない） → ' + short(r.rebuilt));
      ok(r.merged.idb === 'A,B,G' && r.merged.idbUniq && r.merged.idbCount === 3 && r.merged.disk === 'A,B,G' && r.merged.diskUniq
         && r.merged.diskCount === 3 && r.merged.diskCases === 1 && r.merged.all === 2,
         '★㊾f' + mode + 'まとめたあとの物件（この端末・共有ファイル）が A・B・G（1枚ずつ）でない・ほかの端末の戸別が消えた → ' + short(r.merged));
      ok(r.file.ids === 'A,B,G' && r.file.uniq && r.file.orig, '★㊾f' + mode + '戸別ファイルが A・B・G（どれも元の写真・1枚ずつ）にならない → ' + short(r.file));
      ok(r.final.idb === 'A,B,G' && r.final.idbCount === 3 && r.final.disk === 'A,B,G', '★㊾f' + mode + '保存のあとの物件が A・B・G でない → ' + short(r.final));
    }
    await ctx.close();
  }

  // ---- ㊾g 📄 で読んだ戸別（常駐させない・A・B）に 📥 で G を入れたが書けなかった → 📮 預かりの振り分けで、工事フォルダの
  //   管理番号.json に預け（写真 S・ビラ済み）がまとまり、一覧の行にも入れる（sideAdoptRow）→ 行にだけあった G を落とさない
  //   （前は行がファイルの写真 A・B と S だけになり、G はこの端末からも物件からも消えていた）
  if(want('㊾g')){
    const { ctx, page } = await openMain('㊾g');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ig';
      const A = __jpeg(900, 700, 0.85, 374), B = __jpeg(900, 700, 0.85, 375), G = __jpeg(900, 700, 0.85, 376), S = __jpeg(900, 700, 0.85, 377);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const text = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2);
      const f = new File([text], NO + '.json', { type: 'application/json', lastModified: Date.parse('2026-10-01T01:00:00Z') });
      const row = buildListRow(f.name, f.lastModified, JSON.parse(text)); row.srcFile = f;   // 📄 で読んだ戸別
      slimListRow(row, true);
      _listRows = [row];
      const held = () => ((row.data || {}).chosho_photos || []).filter(p => p && p.dataUri);
      const o = {};
      __abortPicker(); _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      o.afterImport = held().map(p => p.id).join(',');
      // 振り分けで、工事フォルダの 管理番号.json（A・B）に預け（写真 S・ビラ済み）がまとまった
      const stamp = '20261012-101010|' + NO;
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { flyer_done: true, _sideMerged: [stamp],
        chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }, { id: 'S', label: 'S', dataUri: S }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      o.adopted = await sideAdoptRow(row, { m: { no: NO, S: { chosho_mgmt_no: NO, flyer_done: true }, side: { at: '20261012-101010' }, stamp, photos: 3, fh } });
      o.row = { ids: held().map(p => p.id).sort().join(','), gOrig: held().some(p => p.id === 'G' && p.dataUri === G), count: row._photoCount,
                flyer: !!(row.data || {}).flyer_done };
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await prepareProjectThumbs(true); await projSaveNow();
      const x = await __idbPhotos(PID, NO);
      o.proj = { idb: x.photos.map(p => p.id).sort().join(','), count: x.count, disk: __diskPhotos(NO) };
      return o;
    }, { NO, PN });
    console.log('㊾g書けなかった取り込みのあと 📮 振り分けを行に入れる', short(r));
    ok(!r.error, '㊾g止まった → ' + r.error);
    if(!r.error){
      ok(/工事フォルダを掴めていません/.test(r.note) && r.afterImport === 'G' && r.adopted && r.row.flyer,
         '㊾g試験の前提: G は行にだけあり、振り分けた預け（ビラ済み）が行に入った → ' + short(r));
      ok(r.row.ids === 'A,B,G,S' && r.row.gOrig && r.row.count === 4,
         '★㊾g振り分けを行に入れると、行にだけあった写真 G（元の写真）が消えた → ' + short(r.row));
      ok(r.proj.idb === 'A,B,G,S' && r.proj.count === 4 && r.proj.disk.n === 4,
         '★㊾g振り分けのあとの物件（この端末・共有ファイル）が A・B・G・S でない → ' + short(r.proj));
    }
    await ctx.close();
  }

  // ---- ㊾h アパートの帯の外の行（📁 の行・ファイルに写真 S1・S2）を、ファイルを持たない世帯（台帳で作った行・写真 T1）へまとめる
  //   （aptMgMovePhotos：ファイルをそのまま持たせる）→ 物件（この端末）のその世帯は T1・S1・S2 の3枚
  //   （前は物件の縮小版を作り直さず、T1 だけ・枚数2で入っていた＝持たせたファイルの写真が物件から消えた）
  //   版179 から：まとめる先の行にだけある T1 も、持たせるファイルへ和集合で入れ（書く → 読み返す → 確かめる）、
  //   行はファイルと同じ写真（S1・S2・T1）を持つ（_slim にしない）。前提をそれに合わせた
  if(want('㊾h')){
    const { ctx, page } = await openMain('㊾h');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ih', NOS = '2612MKM177';
      const T1 = __jpeg(900, 700, 0.85, 378), S1 = __jpeg(900, 700, 0.85, 379), S2 = __jpeg(900, 700, 0.85, 380);
      await __openShared(__proj178(PID, PN, []));
      const tRow = createManualRow({ chosho_mgmt_no: NO, chosho_cust_name: 'まとめる先 様' }, 'ledger');
      tRow.data = Object.assign({}, tRow.data, { chosho_photos: [{ id: 'T1', label: 'T1', dataUri: T1 }] }); tRow._photoCount = 1; tRow._photosKnown = true;
      const text = JSON.stringify({ chosho_mgmt_no: NOS, chosho_cust_name: '帯の外 様', chosho_status: 'in_progress', work_type: 'uhf_new',
        chosho_photos: [{ id: 'S1', label: 'S1', dataUri: S1 }, { id: 'S2', label: 'S2', dataUri: S2 }] }, null, 2);
      const list = __mk('リスト', { [NOS + '.json']: text });
      const fh = await list.getFileHandle(NOS + '.json');
      const sRow = buildListRow('リスト/' + NOS + '.json', 1, JSON.parse(text), fh);
      sRow._dir = list; sRow._name = NOS + '.json'; sRow._dirPath = 'リスト/';
      slimListRow(sRow, true);
      _listRows = [tRow, sRow];
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      const proj = async no => { const x = await __idbPhotos(PID, no); return { ids: x.photos.map(p => p.id).sort().join(','), count: x.count }; };
      await saveProj();
      const o = { before: { t: await proj(NO), s: await proj(NOS) } };
      o.moved = await aptMgMovePhotos(tRow, sRow);                     // ファイルをまとめる先の持ち物にする
      aptMgRemoveRow(sRow); markCaseEdited(tRow);
      o.t = { slim: !!tRow._slim, held: ((tRow.data || {}).chosho_photos || []).map(p => p.id).sort().join(',') };   // 並びは見ない（版181：行の写真を先に、移した写真を後ろに足す）
      o.file = (JSON.parse(list.__files[NOS + '.json']).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      await saveProj();
      o.after = await proj(NO);
      o.disk = __diskPhotos(NO);
      return o;
    }, { NO, PN });
    console.log('㊾hアパートの帯の外の行をファイルの無い世帯へまとめる', short(r));
    ok(!r.error, '㊾h止まった → ' + r.error);
    if(!r.error){
      ok(r.before.t.ids === 'T1' && r.before.s.ids === 'S1,S2' && r.moved && r.moved.moved === 2 && !r.t.slim && r.t.held === 'S1,S2,T1'
         && r.file === 'S1,S2,T1',
         '㊾h試験の前提（版179）: まとめる先は T1 を持ち、帯の外の行のファイル（S1・S2）を持たされ、T1 もそのファイルへ入った → ' + short(r));
      ok(r.after.ids === 'S1,S2,T1' && r.after.count === 3 && r.disk.n === 3 && r.disk.count === 3,
         '★㊾hまとめたあとの物件のその世帯が T1・S1・S2 の3枚でない（持たせたファイルの写真が物件から消えた） → ' + short(r.after) + ' ' + short(r.disk));
    }
    await ctx.close();
  }

  // ---- ㊾i 📁 で読んだ戸別（ファイルの写真 A の1枚）に 📥 で G を入れたが書けなかった・縮小版を作るときもファイルを読めない（同期中）
  //   → 読めるようになって、📁 フォルダを読み直す（listReloadFolder）→ 物件のこの戸別にファイルの写真 A が入る
  //   （読めずに作った縮小版を「このファイルの縮小版」として覚えない。覚えると、同じ枚数（1枚）のファイルを読み直したとき、
  //     A の代わりに取り込んだ写真 G の縮小版が物件に入り、物件しか見ないほかの端末では A が消えて見えた）
  //   a) 取り込みの前に物件に保存してあった（物件に A）　b) まだ物件に保存していなかった（縮小版なし）→ 読めるようになった次の保存で A・G
  for(const mode of ['a', 'b'].filter(m => want('㊾i' + m))){
    const { ctx, page } = await openMain('㊾i' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178ii' + mode;
      const A = __jpeg(900, 700, 0.85, 381), G = __jpeg(900, 700, 0.85, 382);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }] }), null, 2) });
      const rows = [], stats = { dirs: 0, files: 0, skipped: 0, errDirs: [], skippedPaths: [] };
      await scanDirRecursive(list, '', rows, stats);                   // 📁 フォルダで読んだのと同じ行
      _listRows = rows; _listDirHandle = list;
      const row = rows[0];
      // 縮小版の作り方は ensureRowThumbs と同じ（同じ写真からは同じ縮小版）
      const th = async u => (u.startsWith('data:image/jpeg') && u.length < 150000) ? u : await makeThumbDataUri(u, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const aT = await th(A), gT = await th(G);
      const look = ph => { ph = (ph || []).filter(p => p && p.dataUri);
        return { ids: ph.map(p => p.id).sort().join(','), aOk: ph.some(p => p.id === 'A' && p.dataUri === aT), gAsA: ph.some(p => p.dataUri === gT && p.id !== 'G') }; };
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const dk = JSON.parse(window.__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: look(x.photos), idbCount: x.count, disk: look(dk && dk.payload.chosho_photos) }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      if(mode === 'a') await saveProj();                               // a) 取り込みの前に物件に保存してあった
      const o = { before: await proj(), thumbsBefore: Array.isArray(row && row._thumbs), slim: !!(row && row._slim), rows: rows.length, aT: aT !== A };
      list.__unreadable[NO + '.json'] = 99;                            // しばらく読めない（書くときも、縮小版を作るときも）
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      await saveProj();
      o.unreadable = await proj();
      list.__unreadable[NO + '.json'] = 0;                             // 読めるようになった
      if(mode === 'b'){ await saveProj(); o.healed = await proj(); }   // b) 読めるようになった次の物件の保存
      o.reload = await listReloadFolder();                             // 📁 フォルダを読み直す
      const nr = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.newRow = { other: nr !== row, count: nr && nr._photoCount, thumbs: ((nr && nr._thumbs) || []).map(t => t.id).join(',') };
      await saveProj();
      o.after = await proj();
      o.file = (__photosOf(list.__files[NO + '.json']) || []).map(p => p.id).join(',');
      return o;
    }, { NO, PN, mode });
    console.log('㊾i' + mode + '・読めずに作った縮小版を、フォルダを読み直したときに使わない', short(r));
    ok(!r.error, '㊾i' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.slim && r.rows === 1 && r.aT && (mode === 'a' ? (r.before.idb.ids === 'A' && r.thumbsBefore) : !r.thumbsBefore)
         && /読めませんでした/.test(r.note) && /(^|,)G(,|$)/.test(r.unreadable.idb.ids)
         && r.reload === true && r.newRow.other && r.newRow.count === 1 && r.file === 'A',
         '㊾i' + mode + '試験の前提: 書けなかった取り込みの G が物件に入り、読めるようになって読み直した（ファイルは A のまま） → ' + short(r));
      if(mode === 'a')
        ok(r.unreadable.idb.ids === 'A,G' && r.unreadable.idb.aOk && r.unreadable.disk.ids === 'A,G',
           '★㊾ia読めないあいだ、物件からファイルの写真 A が消えた → ' + short(r.unreadable));
      if(mode === 'b')
        ok(r.healed.idb.ids === 'A,G' && r.healed.idb.aOk && r.healed.idbCount === 2 && r.healed.disk.ids === 'A,G',
           '★㊾ib読めるようになった次の物件の保存で、ファイルの写真 A が物件に入らない（読めずに作った縮小版のまま） → ' + short(r.healed));
      ok(r.newRow.thumbs !== 'G' && r.after.idb.aOk && !r.after.idb.gAsA && r.after.disk.aOk && !r.after.disk.gAsA,
         '★㊾i' + mode + 'フォルダを読み直したら、物件のこの戸別にファイルの写真 A が無い（取り込んだ写真 G の縮小版が A の代わりに入った） → ' + short(r.newRow) + ' ' + short(r.after));
    }
    await ctx.close();
  }

  // ---- ㊾j 📁 の行（ファイルの写真 A・B）。ファイルを読めないあいだ（同期中）に 📥 で G を取り込み（書けない）、物件に保存した。
  //   そのあいだに、ほかの端末が共有ファイルを保存した（a 物件に保存したあと　b 物件に保存する前　c a と同じで、写真の無い取り込み）
  //   → 読めるようになって自動保存 → 物件（この端末・共有ファイル）は、ずっと A・B・G（枚数2以上・最後は3）。c はずっと A・B（2枚）
  //   （前は物件が G だけ・枚数1になり、まとめで作り直した行はファイルを読まないので、そのまま戻らなかった）
  for(const mode of ['a', 'b', 'c'].filter(m => want('㊾j' + m))){
    const { ctx, page } = await openMain('㊾j' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const PID = 'pj178ij' + mode;
      const A = __jpeg(900, 700, 0.85, 383), B = __jpeg(900, 700, 0.85, 384), G = __jpeg(900, 700, 0.85, 385);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [NO + '.json']: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(NO + '.json');
      const row = buildListRow(NO + '.json', 1, JSON.parse(list.__files[NO + '.json']), fh);
      row._dir = list; row._name = NO + '.json'; row._dirPath = '';    // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const proj = async () => { const x = await __idbPhotos(PID, NO); const all = JSON.parse(window.__disk).cases;
        const dk = all.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count, cases: all.length }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();
      const o = { before: await proj() };
      list.__unreadable[NO + '.json'] = 99;                            // 同期中で読めない（書くときも、縮小版を作るときも）
      const genba = (mode === 'c')
        ? { chosho_mgmt_no: NO, _origin: 'genba', survey_done: true, survey_done_at: '2026-10-10T09:00' }   // 写真の無い取り込み
        : { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] };
      o.note = String(await applyGenbaMergeToRow(row, genba, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      if(mode === 'b') __otherDeviceSaves('2612MKM099');               // b) この端末が物件に保存する前に、ほかの端末が保存した
      await saveProj();
      o.unreadable = await proj();
      if(mode !== 'b') __otherDeviceSaves('2612MKM099');               // a・c) 物件に保存したあとで、ほかの端末が保存した
      list.__unreadable[NO + '.json'] = 0;                             // 同期が終わった
      projTouch(); await saveProj();                                   // 自動保存（ほかの端末の保存とまとめる）
      o.after1 = await proj();
      await saveProj();
      o.after2 = await proj();
      o.file = ids(__photosOf(list.__files[NO + '.json']));
      return o;
    }, { NO, PN, mode });
    console.log('㊾j' + mode + '・読めないあいだの取り込みと、ほかの端末の保存', short(r));
    ok(!r.error, '㊾j' + mode + '止まった → ' + r.error);
    if(!r.error){
      const w = (mode === 'c') ? 'A,B' : 'A,B,G', wn = (mode === 'c') ? 2 : 3;
      const wj = w.replace(/,/g, '・');
      ok(r.before.idb === 'A,B' && r.before.idbCount === 2 && /読めませんでした/.test(r.note) && r.file === 'A,B' && r.after2.cases === 2,
         '㊾j' + mode + '試験の前提: 物件に A・B・取り込みは書けなかった（ファイルは A・B のまま）・ほかの端末の戸別も物件に入った → ' + short(r));
      ok(r.unreadable.idb === w && r.unreadable.disk === w && r.unreadable.idbCount >= 2 && r.unreadable.diskCount >= 2,
         '★㊾j' + mode + 'ファイルを読めないあいだの物件（この端末・共有ファイル）が ' + wj + '（2枚以上）でない → ' + short(r.unreadable));
      ok(r.after1.idb === w && r.after1.disk === w && r.after1.idbCount >= 2 && r.after1.diskCount >= 2,
         '★㊾j' + mode + 'ほかの端末の保存とまとめたあとの物件が ' + wj + '（2枚以上）でない → ' + short(r.after1));
      ok(r.after2.idb === w && r.after2.disk === w && r.after2.idbCount === wn && r.after2.diskCount === wn,
         '★㊾j' + mode + '読めるようになったあとの物件が ' + wj + '（' + wn + '枚）でない → ' + short(r.after2));
    }
    await ctx.close();
  }

  // ---- ㊾k 📄 で読んだ戸別（常駐させない・A・B）。📥 で G を入れる → 工事フォルダの同じ名前のファイルへ書けた（A・B・G）。
  //   Chrome では、📄 で選んだファイルは、ファイルが書き替わると読めなくなる → 物件（この端末・共有ファイル）は A・B・G（3枚）
  //   （前は物件が G だけ・1枚になり、ほかの端末では A・B が消えて見えた）
  if(want('㊾k')){
    const { ctx, page } = await openMain('㊾k');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178ik';
      const A = __jpeg(900, 700, 0.85, 386), B = __jpeg(900, 700, 0.85, 387), G = __jpeg(900, 700, 0.85, 388);
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const text = JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2);
      const top = __mk('工事', {}, { 'リスト': __mk('リスト', { [NO + '.json']: text }) });
      const list = top.__subs['リスト'];
      const f0 = new File([text], NO + '.json', { type: 'application/json', lastModified: Date.parse('2026-10-01T01:00:00Z') });
      // Chrome と同じ：選んだファイルが書き替わったあとは読めない（NotReadableError）
      const f = { name: f0.name, lastModified: f0.lastModified, size: f0.size, type: f0.type,
                  text: async () => { if(list.__writes.length){ const e = new Error('The requested file could not be read'); e.name = 'NotReadableError'; throw e; } return f0.text(); } };
      const row = buildListRow('リスト/' + NO + '.json', f0.lastModified, JSON.parse(text)); row.srcFile = f;   // 📄 で読んだ戸別
      slimListRow(row, true);
      _listRows = [row];
      window.showDirectoryPicker = async () => top;                    // 取り込みのとき工事フォルダを選ぶ
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const proj = async () => { const x = await __idbPhotos(PID, NO);
        const dk = JSON.parse(window.__disk).cases.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();
      const o = { before: await proj() };
      _genbaNoDir = false;
      o.note = String(await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 80);
      o.writes = list.__writes.map(x => x.n).join(',');
      o.file = ids(__photosOf(list.__files[NO + '.json']));
      try { await row.srcFile.text(); o.srcReadable = true; } catch(_){ o.srcReadable = false; }
      await saveProj();
      o.after = await proj();
      await saveProj();
      o.after2 = await proj();
      return o;
    }, { NO, PN });
    console.log('㊾k📄 の行で書けたあと、選んだファイルが読めない', short(r));
    ok(!r.error, '㊾k止まった → ' + r.error);
    if(!r.error){
      ok(r.before.idb === 'A,B' && /個別JSONも更新しました/.test(r.note) && r.writes === NO + '.json' && r.file === 'A,B,G' && r.srcReadable === false,
         '㊾k試験の前提: 物件に A・B・取り込みは工事フォルダのファイルへ書けた（A・B・G）・📄 で選んだファイルはもう読めない → ' + short(r));
      ok(r.after.idb === 'A,B,G' && r.after.idbCount === 3 && r.after.disk === 'A,B,G' && r.after.diskCount === 3,
         '★㊾k物件（この端末・共有ファイル）のこの戸別が A・B・G（3枚）でない（ファイルの写真 A・B が物件から消えた） → ' + short(r.after));
      ok(r.after2.idb === 'A,B,G' && r.after2.idbCount === 3 && r.after2.disk === 'A,B,G',
         '★㊾k次の物件の保存で、物件のこの戸別が A・B・G でなくなった → ' + short(r.after2));
    }
    await ctx.close();
  }

  // ---- ㊾l 同じ管理番号のファイルが2つ（スマホの名前 管理番号_数字.json＝古い・管理番号.json＝新しい・工事完了と測定値あり。どちらも写真 A・B）
  //   古いほうの行に 📥 で G を入れる → 書けない（「🧩 重複をまとめる」で1つにしてから、と知らせる）→ 物件の保存
  //   → 物件のその戸別は A・B・G。一覧の枚数はファイルの枚数（2）のまま → 🧩 重複をまとめる の残す方（既定）は、これまでどおり
  //     工事完了・測定値のある 管理番号.json。既定のまま整理しても工事完了・測定値は残る
  //   （行の枚数を、取り込んだ写真と合わせた3にすると、古いほうを「写真3枚」として残す方に選び、工事完了・測定値が消えていた）
  if(want('㊾l')){
    const { ctx, page } = await openMain('㊾l');
    const r = await run(page, async ({ NO, PN }) => {
      const PID = 'pj178il', OLD = NO + '_1760000000000.json';
      const A = __jpeg(900, 700, 0.85, 389), B = __jpeg(900, 700, 0.85, 390), G = __jpeg(900, 700, 0.85, 391);
      const ph = [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }];
      const old = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new', editedAt: '2026-10-01T00:00:00Z', chosho_photos: ph };
      const neu = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'done', work_type: 'uhf_new', editedAt: '2026-10-12T00:00:00Z',
                    work_done: true, work_done_at: '2026-10-12T05:00:00Z', meas_ch13: '62', chosho_photos: ph };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [OLD]: JSON.stringify(old, null, 2), [NO + '.json']: JSON.stringify(neu, null, 2) });
      const rows = [], stats = { dirs: 0, files: 0, skipped: 0, errDirs: [], skippedPaths: [] };
      await scanDirRecursive(list, '', rows, stats);                   // 📁 フォルダで読んだのと同じ行
      _listRows = rows; _listDirHandle = list;
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const isOld = c => String(c.file || '').split('/').pop() === OLD;
      const proj = async () => { const p = await projIdbGet(PID); const c = ((p && p.cases) || []).filter(isOld)[0];
        const dk = JSON.parse(window.__disk).cases.filter(isOld)[0];
        return { idb: ids(c && c.payload.chosho_photos), idbCount: c && c.payload.chosho_photo_count,
                 disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count }; };
      const saveProj = async () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await prepareProjectThumbs(true); await projSaveNow(); };
      await saveProj();
      const tgt = rows.filter(x => x._name === OLD)[0];
      const o = { rows: rows.map(x => x._name + ':' + x._photoCount).sort().join(' '), before: await proj() };
      o.note = String(await applyGenbaMergeToRow(tgt, { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] }, { importRun: true }) || '').replace(/\s+/g, ' ');
      await saveProj();
      o.proj = await proj();
      o.counts = rows.map(x => x._name + ':' + x._photoCount + (x._slim ? '(slim)' : '')).sort().join(' ');
      o.files = Object.keys(list.__files).sort().map(n => n + ':' + ids(__photosOf(list.__files[n]))).join(' ');
      const g = dupFindGroups(_listRows).filter(x => x.no === NO)[0];
      if(g){
        const keep = g.items.filter(x => x._name === g.pick)[0] || g.items[0];
        o.pick = g.pick; o.why = dupWhyKeep(keep, g.items);
        const res = await dupApply([g], [g.pick]);                     // 既定のまま整理する
        o.res = { done: res.done, fails: (res.fails || []).length };
        const t = list.__files[NO + '.json']; const j = t ? JSON.parse(t) : {};
        o.after = { names: Object.keys(list.__files).filter(n => /\.json$/.test(n)).sort().join(','), photos: ids(j.chosho_photos),
                    work_done: !!j.work_done, meas: j.meas_ch13 || '', status: j.chosho_status };
      }
      return o;
    }, { NO, PN });
    console.log('㊾l同じ管理番号のファイルが2つ・古いほうへの取り込みが書けなかった', short(r));
    ok(!r.error, '㊾l止まった → ' + r.error);
    if(!r.error){
      ok(r.rows === NO + '.json:2 ' + NO + '_1760000000000.json:2' && r.before.idb === 'A,B' && /重複をまとめる/.test(r.note)
         && r.files === NO + '.json:A,B ' + NO + '_1760000000000.json:A,B' && r.res && r.res.done === 1,
         '㊾l試験の前提: 同じ管理番号のファイルが2つ（写真 A・B）・取り込みは書けず「🧩 重複をまとめる」を知らせた・整理できた → ' + short(r));
      ok(r.proj.idb === 'A,B,G' && r.proj.idbCount === 3 && r.proj.disk === 'A,B,G' && r.proj.diskCount === 3,
         '★㊾l物件（この端末・共有ファイル）のその戸別が A・B・G（3枚）でない → ' + short(r.proj));
      ok(r.counts === NO + '.json:2(slim) ' + NO + '_1760000000000.json:2(slim)',
         '★㊾l一覧の枚数がファイルの枚数（どちらも2）でなくなった → ' + short(r.counts));
      ok(r.pick === NO + '.json' && /写真2枚/.test(r.why || ''),
         '★㊾l🧩 重複をまとめる の残す方（既定）が、工事完了・測定値のある ' + NO + '.json でない → ' + short({ pick: r.pick, why: r.why }));
      ok(r.after && r.after.names === NO + '.json' && r.after.work_done && r.after.meas === '62' && r.after.status === 'done' && /^A,B/.test(r.after.photos),
         '★㊾l既定のまま整理したら、' + NO + '.json の工事完了・測定値が消えた → ' + short(r.after));
    }
    await ctx.close();
  }

  /* ===== 7回目・8回目の見直しの直し：断るかどうかは行の写真で・物件にそのまま入る写真だけが縮小版・見つけた元の写真は大きさが同じでも使う（㊸r〜㊸u）=====
     ★決まり★ 確かめられない縮小版が残ったとき、断ってよいのは「行の写真（元の写真を探す前）がみな物件の縮小版そのもの」のときだけ。
     物件の縮小版そのもの＝物件の縮小版づくりが作り直さずにそのまま入れる写真（JPEG・150000字未満・長辺512px以下・写真IDあり。projThumbLike）。
     ほかのファイルから見つけた元の写真は数えない（そのファイルに残っている）。PNG の図・大きい JPEG は、物件には作り直した別物しか無い
     ＝元の写真（作る。読めなかった所があれば ※ で知らせる）。元の写真を探しに見て回るのも、物件の縮小版そのものがあるときだけ。 */
  /* 図（線と字だけの絵）。type＝'image/png'／'image/jpeg' */
  const FIG43R = `
    window.__fig = function(w, h, type, q){
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d'); x.fillStyle = '#fafafa'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#1565c0'; x.lineWidth = 2;
      for(let i = 0; i < 12; i++){ x.strokeRect(10 + i * 14, 10 + i * 9, w - 20 - i * 28, h - 20 - i * 18); }
      x.fillStyle = '#b71c1c'; x.font = 'bold 18px sans-serif'; x.fillText('配線図 アンテナ→分配器', 16, h - 24);
      return cv.toDataURL(type || 'image/png', q);
    };
    /* 物件にだけある戸別（ファイル無し・写真なし）。工事フォルダ その１ に リスト と 打合せ。
       o.unlist＝打合せ を開けない　o.left＝リスト に途中で切れた Android の名前の残り
       looked()＝工事フォルダの中を見て回った回数（その１ の中を見た回数） */
    window.__projOnly = async function(pid, o){
      o = o || {};
      const NO = '2612MKM077';
      await __openProj(__proj178(pid, '令和８年度戸別受信設備設置工事（その１）', [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' } }]));
      const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
      const list = __mk('リスト', {}, {}, { resolve: true });
      const odd = __mk('打合せ', { 'memo.json': '{"x":1}' }, {});
      const left = '{"chosho_mgmt_no":"' + NO + '","chosho_photos":[{"id":"x","dataUri":"data:image/jpeg;base64,/9j/4A';
      if(o.left) list.__files[o.left] = left;
      if(o.unlist) odd.entries = function(){ return { [Symbol.asyncIterator](){ return { next: async () => { const e = new Error('見られない'); e.name = 'NotReadableError'; throw e; } }; } }; };
      const root = __mk('その１', {}, { 'リスト': list, '打合せ': odd }, { resolve: true });
      let looked = 0; const org = root.entries;
      root.entries = function(){ looked++; return org.apply(this, arguments); };
      return { NO, row, list, odd, root, left, looked: () => looked };
    };
  `;

  // ---- ㊸r 行の写真がみな縮小版（G・H）。リストに読める本当のファイル（G の原寸）。H の原寸は Android の名前のファイルだけで、
  //          1) 同期の途中で読めない　2) 途中で切れている → 見つけた G の原寸を「画面にしか無い元の写真」と数えない＝作らない・知らせる。
  //          読めるようになって保存 → 元の写真（G・H）で作る（前は G 原寸・H 縮小版のファイルを作り、そのあと H はずっと縮小版のままだった）----
  for(const mode of ['1', '2'].filter(m => want('㊸r' + m))){
    const { ctx, page, said } = await openMain('㊸r' + mode);
    await page.evaluate(STALE);
    const r = await run(page, async ({ ANDROID, mode }) => {
      const H0 = __jpeg(1000, 750, 0.85, 256);
      const full = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba',
                                    chosho_photos: [{ id: photoContentId(H0), label: '現場で撮った2', dataUri: H0 }] }, null, 2);
      const first = mode === '2' ? full.slice(0, Math.floor(full.length * 0.6)) : full;
      const s = await __stale({ draw: true, withH: true, pid: 'pj178ar' + mode, listFiles: { [ANDROID]: first } });
      if(mode === '1') s.list.__unreadable[ANDROID] = 1e9;              // 同期の途中（終わるまで読めない）
      window.showDirectoryPicker = async () => s.root;
      await openCaseInEditor(s.row);
      __setTel('090-1111-2222');
      await __pressSave();
      const o = { tree1: __tree(s.root), made1: s.desc(s.root.__files[s.NO + '.json']), realSame1: s.list.__files[s.NO + '.json'] === s.realText,
                  andSame1: s.list.__files[ANDROID] === first, rowFile1: s.row.file,
                  rowN1: (s.row.data.chosho_photos || []).filter(x => x && x.dataUri).length };
      const idb1 = await __idbPhotos(s.PID, s.NO);
      o.idb1 = { n: idb1.photos.length, count: idb1.count };
      s.list.__unreadable[ANDROID] = 0; s.list.__files[ANDROID] = full;   // 同期が終わって、読めるようになった
      __setTel('090-1111-3333');
      await __pressSave();
      o.tree2 = __tree(s.root);
      o.made2 = s.desc(s.root.__files[s.NO + '.json']);
      o.realSame2 = s.list.__files[s.NO + '.json'] === s.realText;
      o.andSame2 = s.list.__files[ANDROID] === full;
      return o;
    }, { ANDROID, mode });
    const a = alerts(said);
    const m1 = indivPart(a[0] || ''), m2 = indivPart(a[1] || '');
    console.log('㊸r' + mode + '見つけた原寸は数えない', short(r), short([m1.slice(0, 300), m2.slice(0, 160)]));
    ok(!r.error, '㊸r' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.realSame1 && r.andSame1 && r.rowFile1 === NO + '.json' && a.length === 2,
         '㊸r' + mode + '試験の前提: 物件は古い名前を覚えていて、見つけたファイルは元のまま・保存の知らせが2つ → ' + short(r) + ' ' + a.length);
      ok(r.tree1.join() === ['リスト/' + ANDROID, 'リスト/' + NO + '.json'].sort().join() && !r.made1,
         '★㊸r' + mode + ' 1日目：行の写真がみな縮小版なのに、ほかのファイルで見つけた G の原寸を「画面にしか無い元の写真」と数えて作った（H は縮小版のまま）→ ' + short(r));
      ok(String(a[0] || '').indexOf('⚠ 戸別の個別JSONは作っていません') >= 0 && m1.indexOf('リスト/' + ANDROID + ' を読めませんでした') >= 0
         && /小さくしたものしか入っていません/.test(m1) && /同期が終わってから、もう一度保存してください/.test(m1),
         '★㊸r' + mode + ' 1日目：作らなかったこと・読めないファイル・直し方を知らせない → ' + short(m1.slice(0, 400)));
      ok(r.rowN1 === 2 && r.idb1.n === 2 && r.idb1.count === 2, '★㊸r' + mode + ' 作らなかったときに、行・物件（端末内）の写真が減った → ' + short(r));
      ok(r.made2 && r.made2.photos.join() === 'G原寸,H原寸' && r.made2.tel === '090-1111-3333' && r.realSame2 && r.andSame2
         && r.tree2.join() === [NO + '.json', 'リスト/' + ANDROID, 'リスト/' + NO + '.json'].sort().join() && /新規作成/.test(m2) && !/※/.test(m2),
         '★㊸r' + mode + ' 読めるようになって保存したのに、元の写真（G・H）で作らない（H が縮小版のまま）→ ' + short(r) + ' ' + short(m2.slice(0, 200)));
    }
    await ctx.close();
  }

  // ---- ㊸s 小さい図（PNG・400×300）を 📷 で足して 💾 物件に保存（物件には作り直した JPEG しか入らない＝PNG は元の写真）----
  //   u) 物件にだけある戸別（ファイル無し）・関係の無い 打合せ フォルダを開けない
  //   b) 物件にだけある戸別・リスト に途中で切れた Android の名前の残り
  //   g) 物件の覚えている名前が古い行（G は縮小版）・同じ番号のファイルは途中で切れた Android の名前のファイルだけ
  //   → 作る・PNG は1文字も違わない（u・b は見て回らない・※ も付けない　g は G は縮小版のまま・※ で知らせる）
  //   （前は PNG を物件の縮小版と取り違えて断り、閉じると物件の JPEG しか残らず、元の PNG が消えていた）
  for(const mode of ['u', 'b', 'g'].filter(m => want('㊸s' + m))){
    const { ctx, page, said } = await openMain('㊸s' + mode);
    await page.evaluate(STALE);
    await page.evaluate(FIG43R);
    const r = await run(page, async ({ ANDROID, mode }) => {
      const P = __fig(400, 300, 'image/png');
      const o = { pLen: P.length, pEdge: photoLongEdgeOf(P) };
      let NO, PID, root, list, row, looked, left = null, gid = null, Gt = null;
      if(mode === 'g'){
        const G0 = __jpeg(900, 700, 0.85, 251);
        const full = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba',
                                      chosho_photos: [{ id: photoContentId(G0), label: '現場で撮った', dataUri: G0 }] }, null, 2);
        left = full.slice(0, Math.floor(full.length * 0.6));
        const s = await __stale({ draw: true, noReal: true, pid: 'pj178asg', listFiles: { [ANDROID]: left } });
        NO = s.NO; PID = s.PID; root = s.root; list = s.list; row = s.row; gid = s.gid; Gt = s.Gt;
        let n = 0; const org = root.entries; root.entries = function(){ n++; return org.apply(this, arguments); }; looked = () => n;
      } else {
        const q = await __projOnly('pj178as' + mode, { unlist: mode === 'u', left: mode === 'b' ? ANDROID : '' });
        NO = q.NO; PID = 'pj178as' + mode; root = q.root; list = q.list; row = q.row; looked = q.looked; left = mode === 'b' ? q.left : null;
      }
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const ed = await __addPhoto(P, 'zu.png', 'image/png');
      o.edSame = !!(ed && ed.dataUri === P);
      await __pressSave();
      const t = mode === 'g' ? root.__files[NO + '.json'] : list.__files[NO + '.json'];
      const ph = __photosOf(t || '{}') || [];
      o.made = t ? ph.map(p => (gid && p.id === gid) ? (p.dataUri === Gt ? 'G縮小版' : 'G?')
                             : ((ed && p.id === ed.id) ? (p.dataUri === P ? 'P元' : ('P別物' + p.dataUri.slice(5, 15))) : '?')) : null;
      o.tree = __tree(root);
      o.looked = looked();
      o.leftSame = left === null || list.__files[ANDROID] === left;
      o.rowSame = (row.data.chosho_photos || []).filter(p => p && ed && p.id === ed.id).map(p => p.dataUri === P).join();
      const idb = await __idbPhotos(PID, NO);
      const ip = idb.photos.filter(p => ed && p.id === ed.id)[0];
      o.idb = { n: idb.photos.length, count: idb.count, pJpeg: !!(ip && /^data:image\/jpeg/.test(ip.dataUri)), pSame: !!(ip && ip.dataUri === P) };
      return o;
    }, { ANDROID, mode });
    const a = alerts(said);
    const msg = indivPart(a[a.length - 1] || '');
    console.log('㊸s' + mode + '小さい図（PNG）', short(r), short(msg.slice(0, 300)));
    ok(!r.error, '㊸s' + mode + '止まった → ' + r.error);
    if(!r.error){
      const nP = mode === 'g' ? 2 : 1;
      ok(r.edSame && r.pEdge === 400 && r.leftSame && r.idb.n === nP && r.idb.count === nP && r.idb.pJpeg && !r.idb.pSame,
         '㊸s' + mode + '試験の前提: PNG がそのまま画面に入り、物件（端末内）には作り直した JPEG（元の PNG とは別物）・残りのファイルは元のまま → ' + short(r));
      ok(r.made && r.made.join() === (mode === 'g' ? 'G縮小版,P元' : 'P元') && r.rowSame === 'true'
         && r.tree.indexOf(mode === 'g' ? NO + '.json' : 'リスト/' + NO + '.json') >= 0,
         '★㊸s' + mode + ' 画面で足した小さい図（PNG）を物件の縮小版と取り違えて断った・戸別ファイルの PNG が元のままでない（物件には作り直した JPEG しか無い）→ ' + short(r));
      ok(/新規作成/.test(msg) && !/作っていません/.test(msg) && String(a[a.length - 1] || '').indexOf('⚠ 戸別の個別JSONは作っていません') < 0,
         '★㊸s' + mode + ' 作ったことを知らせない・「作っていません」と知らせた → ' + short(msg.slice(0, 300)));
      if(mode === 'g'){
        ok(msg.indexOf('※ 工事フォルダの中の リスト/' + ANDROID + ' を読めませんでした。この戸別の写真のうち、元の写真を見つけられなかったものは、物件の小さい写真のまま入れました。') >= 0,
           '★㊸sg G を縮小版のまま入れたこと・読めなかったファイルを知らせない → ' + short(msg.slice(0, 300)));
      } else {
        ok(r.looked === 0 && !/※/.test(msg),
           '★㊸s' + mode + ' 物件の縮小版が無い（PNG の図だけ）のに、工事フォルダの中を見て回った・「小さい写真のまま入れた」と知らせた → ' + short(r) + ' ' + short(msg.slice(0, 200)));
      }
    }
    await ctx.close();
  }

  // ---- ㊸sj 小さい JPEG（400×300・150000字未満＝物件にそのまま入る）を足した物件にだけある戸別・リスト に途中で切れた Android の名前の残り
  //          → これまでどおり作らない（物件に同じ写真がある）・物件（端末内）の写真は1文字も違わない →
  //          アプリを開き直し、残りを工事フォルダの外へ移して保存 → 足した写真のまま作る（何も失わない）----
  if(want('㊸sj')){
    const { ctx, page, said } = await openMain('㊸sj');
    await page.evaluate(STALE);
    await page.evaluate(FIG43R);
    const r1 = await run(page, async ({ ANDROID }) => {
      const P = __fig(400, 300, 'image/jpeg', 0.9);
      const q = await __projOnly('pj178asj', { left: ANDROID });
      window.showDirectoryPicker = async () => q.root;
      await openCaseInEditor(q.row);
      const ed = await __addPhoto(P, 'zu.jpg', 'image/jpeg');
      await __pressSave();
      const idb = await __idbPhotos('pj178asj', q.NO);
      const ip = idb.photos.filter(p => ed && p.id === ed.id)[0];
      return { P, id: ed && ed.id, pLen: P.length, pEdge: photoLongEdgeOf(P), edSame: !!(ed && ed.dataUri === P), tree: __tree(q.root),
               leftSame: q.list.__files[ANDROID] === q.left,
               rowSame: (q.row.data.chosho_photos || []).filter(p => p && ed && p.id === ed.id).map(p => p.dataUri === P).join(),
               idb: { n: idb.photos.length, count: idb.count, pSame: !!(ip && ip.dataUri === P) } };
    }, { ANDROID });
    const a1 = alerts(said);
    const m1 = indivPart(a1[a1.length - 1] || '');
    said.length = 0;
    // アプリを閉じて開き直す（物件はこの端末に残っているものから開く）→ 残りを工事フォルダの外へ移した → 電話を直して保存
    let r2 = { error: '1日目が止まった' };
    if(!r1.error){
      await page.reload();
      await page.waitForFunction(() => typeof applyProject === 'function' && typeof overwriteSaveCurrent === 'function'
        && document.readyState === 'complete', null, { timeout: 30000 });
      await sleep(2500);
      await page.evaluate(SETUP);
      said.length = 0;
      r2 = await run(page, async ({ P, id }) => {
        const NO = '2612MKM077';
        await __openProj(await projIdbGet('pj178asj'));
        const row = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
        const list = __mk('リスト', {}, {}, { resolve: true });
        const root = __mk('その１', {}, { 'リスト': list, '打合せ': __mk('打合せ', { 'memo.json': '{"x":1}' }, {}) }, { resolve: true });
        window.showDirectoryPicker = async () => root;
        await openCaseInEditor(row);
        const shown = (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id === id && p.dataUri === P).join();
        __setTel('090-1111-2222');
        await __pressSave();
        const ph = __photosOf(list.__files[NO + '.json'] || '{}') || [];
        return { shown, tree: __tree(root), made: ph.map(p => p.id === id ? (p.dataUri === P ? 'P元' : 'P別物') : '?').join() };
      }, { P: r1.P, id: r1.id });
    }
    const a2 = alerts(said);
    const m2 = indivPart(a2[a2.length - 1] || '');
    if(r1.P) r1.P = r1.P.length;
    console.log('㊸sj小さい JPEG（物件にそのまま入る）', short(r1), short(r2), short([m1.slice(0, 200), m2.slice(0, 120)]));
    ok(!r1.error && !r2.error, '㊸sj止まった → ' + (r1.error || r2.error));
    if(!r1.error && !r2.error){
      ok(r1.edSame && r1.pEdge === 400 && r1.pLen < 150000 && r1.leftSame,
         '㊸sj試験の前提: 400×300・150000字未満の JPEG がそのまま画面に入る・残りのファイルは元のまま → ' + short(r1));
      ok(r1.tree.join() === ['リスト/' + ANDROID, '打合せ/memo.json'].sort().join() && /作っていません/.test(m1) && m1.indexOf('リスト/' + ANDROID + ' を読めませんでした') >= 0,
         '★㊸sj 物件にそのまま入る小さい JPEG だけの行で、確かめられないまま作った・作らなかったことを知らせない → ' + short(r1) + ' ' + short(m1.slice(0, 300)));
      ok(r1.rowSame === 'true' && r1.idb.n === 1 && r1.idb.count === 1 && r1.idb.pSame,
         '★㊸sj 作らなかったときに、物件（端末内）の写真が足した写真と違う（物件の縮小版づくりが作り直した＝閉じると元の写真が消える）→ ' + short(r1));
      ok(r2.shown === 'true' && r2.made === 'P元' && r2.tree.join() === ['リスト/' + NO + '.json', '打合せ/memo.json'].sort().join() && /新規作成/.test(m2),
         '★㊸sj 開き直して保存したら、足した写真のまま作らない（写真が変わった・作らない）→ ' + short(r2) + ' ' + short(m2.slice(0, 200)));
    }
    await ctx.close();
  }

  // ---- ㊸t 長辺512px で 150000字を超える JPEG（物件には作り直したものが入る）は元の写真
  //   u) 物件にだけある戸別・関係の無い 打合せ フォルダを開けない → 作る・1文字も違わない・見て回らない・※ を付けない
  //   g) 物件の覚えている名前が古い行（G は縮小版）・同じ番号のファイルは途中で切れたものだけ → 作る（G は縮小版のまま）・※ で知らせる
  for(const mode of ['u', 'g'].filter(m => want('㊸t' + m))){
    const { ctx, page, said } = await openMain('㊸t' + mode);
    await page.evaluate(STALE);
    await page.evaluate(FIG43R);
    const r = await run(page, async ({ ANDROID, mode }) => {
      const P = __jpeg(512, 384, 0.98, 261);
      const o = { pLen: P.length, pEdge: photoLongEdgeOf(P) };
      let NO, PID, root, list, row, looked, gid = null, Gt = null;
      if(mode === 'g'){
        const G0 = __jpeg(900, 700, 0.85, 251);
        const full = JSON.stringify({ chosho_mgmt_no: '2612MKM077', chosho_cust_name: '山田 太郎 様', _origin: 'genba',
                                      chosho_photos: [{ id: photoContentId(G0), label: '現場で撮った', dataUri: G0 }] }, null, 2);
        const s = await __stale({ draw: true, noReal: true, pid: 'pj178atg', listFiles: { [ANDROID]: full.slice(0, Math.floor(full.length * 0.6)) } });
        NO = s.NO; PID = s.PID; root = s.root; list = s.list; row = s.row; gid = s.gid; Gt = s.Gt;
        let n = 0; const org = root.entries; root.entries = function(){ n++; return org.apply(this, arguments); }; looked = () => n;
      } else {
        const q = await __projOnly('pj178atu', { unlist: true });
        NO = q.NO; PID = 'pj178atu'; root = q.root; list = q.list; row = q.row; looked = q.looked;
      }
      window.showDirectoryPicker = async () => root;
      await openCaseInEditor(row);
      const ed = await __addPhoto(P, 'p.jpg', 'image/jpeg');
      o.edSame = !!(ed && ed.dataUri === P);
      await __pressSave();
      const t = mode === 'g' ? root.__files[NO + '.json'] : list.__files[NO + '.json'];
      const ph = __photosOf(t || '{}') || [];
      o.made = t ? ph.map(p => (gid && p.id === gid) ? (p.dataUri === Gt ? 'G縮小版' : 'G?')
                             : ((ed && p.id === ed.id) ? (p.dataUri === P ? 'P元' : ('P別物' + p.dataUri.length)) : '?')) : null;
      o.looked = looked();
      const idb = await __idbPhotos(PID, NO);
      const ip = idb.photos.filter(p => ed && p.id === ed.id)[0];
      o.idb = { n: idb.photos.length, count: idb.count, pLen: ip ? ip.dataUri.length : 0, pSame: !!(ip && ip.dataUri === P) };
      return o;
    }, { ANDROID, mode });
    const a = alerts(said);
    const msg = indivPart(a[a.length - 1] || '');
    console.log('㊸t' + mode + '大きい JPEG（長辺512px）', short(r), short(msg.slice(0, 300)));
    ok(!r.error, '㊸t' + mode + '止まった → ' + r.error);
    if(!r.error){
      const nP = mode === 'g' ? 2 : 1;
      ok(r.edSame && r.pEdge === 512 && r.pLen > 150000 && r.idb.n === nP && r.idb.count === nP,
         '㊸t' + mode + '試験の前提: 長辺512px・150000字を超える JPEG がそのまま画面に入る → ' + short(r));
      ok(r.idb.pLen > 0 && r.idb.pLen < 150000 && !r.idb.pSame,
         '★㊸t' + mode + ' 物件（端末内）に大きい JPEG がそのまま入った（物件の縮小版づくりの物差しが、縮小版そのものかを見る物差しと違う）→ ' + short(r.idb));
      ok(r.made && r.made.join() === (mode === 'g' ? 'G縮小版,P元' : 'P元') && /新規作成/.test(msg) && !/作っていません/.test(msg),
         '★㊸t' + mode + ' 150000字を超える JPEG を物件の縮小版と取り違えて断った・戸別ファイルの写真が元のままでない → ' + short(r) + ' ' + short(msg.slice(0, 200)));
      if(mode === 'g'){
        ok(msg.indexOf('※ 工事フォルダの中の リスト/' + ANDROID + ' を読めませんでした。') >= 0,
           '★㊸tg G を縮小版のまま入れたこと・読めなかったファイルを知らせない → ' + short(msg.slice(0, 300)));
      } else {
        ok(r.looked === 0 && !/※/.test(msg),
           '★㊸tu 物件の縮小版が無い（大きい JPEG だけ）のに、工事フォルダの中を見て回った・「小さい写真のまま入れた」と知らせた → ' + short(r) + ' ' + short(msg.slice(0, 200)));
      }
    }
    await ctx.close();
  }

  // ---- ㊸u 物件の覚えている名前が古い行。物件の縮小版 G'・P' は、物件の縮小版づくり（ensureRowThumbs）が 900px の JPEG G と
  //          400×300 の PNG の図 P から作ったもの（P' は作り直した JPEG・長辺は P と同じ 400）。リスト/管理番号.json に G と PNG の P（同じ写真ID）
  //   a) 読めない所なし　u) 関係の無い 打合せ フォルダを開けない
  //   → 新しいファイルは G と PNG の P（1文字も違わない）・断らない・※ を付けない・見つけたファイルは元のまま
  //   （前は長辺が同じなので PNG を使わず物件の JPEG を入れた（a）・PNG の縮小版が残ったと数えて断った（u））----
  for(const mode of ['a', 'u'].filter(m => want('㊸u' + m))){
    const { ctx, page, said } = await openMain('㊸u' + mode);
    await page.evaluate(STALE);
    await page.evaluate(FIG43R);
    const r = await run(page, async ({ mode }) => {
      const NO = '2612MKM077', PID = 'pj178au' + mode;
      const G = __jpeg(900, 700, 0.85, 251), gid = photoContentId(G);
      const P = __fig(400, 300, 'image/png'), pid = photoContentId(P);
      const o = { pPng: /^data:image\/png/.test(P), pFit: (await photoFitForStorage(P)) === P, pEdge: photoLongEdgeOf(P) };
      /* 物件の縮小版は、物件の縮小版づくりそのもので元の写真から作る */
      const tmp = { fileType: 'plain', file: 'tmp_' + PID + '.json', lastModified: 1,
                    data: { chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }, { id: pid, label: '配線図', dataUri: P }] } };
      await ensureRowThumbs(tmp);
      const th = Array.isArray(tmp._thumbs) ? tmp._thumbs : [];
      const Gt = (th.filter(t => t.id === gid)[0] || {}).dataUri || '', Pt = (th.filter(t => t.id === pid)[0] || {}).dataUri || '';
      o.th = { n: th.length, gEdge: Gt ? photoLongEdgeOf(Gt) : 0, pJpeg: /^data:image\/jpeg/.test(Pt), pLen: Pt.length, pEdge: Pt ? photoLongEdgeOf(Pt) : 0 };
      const payload = { chosho_mgmt_no: NO, chosho_cust_name: '山田 太郎 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                        chosho_photos: th.map(t => Object.assign({}, t)), chosho_photos_thumb: true, chosho_photo_count: th.length };
      await __openProj(__proj178(PID, '令和８年度戸別受信設備設置工事（その１）', [{ caseId: 'c1', file: NO + '.json', lastModified: 0, payload }]));
      const realText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '山田 太郎 様', amplifier: 'amp_3u43', work_type: 'uhf_new', _origin: 'genba',
        chosho_status: 'done', meas_note: '現場の測定値',
        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }, { id: pid, label: '配線図', dataUri: P }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: realText }, {}, { resolve: true });
      const odd = __mk('打合せ', { 'memo.json': '{"x":1}' }, {});
      let oddLooked = 0;
      if(mode === 'u') odd.entries = function(){ oddLooked++;
        return { [Symbol.asyncIterator](){ return { next: async () => { const e = new Error('見られない'); e.name = 'NotReadableError'; throw e; } }; } }; };
      const root = __mk('その１', {}, { 'リスト': list, '打合せ': odd }, { resolve: true });
      window.showDirectoryPicker = async () => root;
      const nm = p => p.id === gid ? (p.dataUri === G ? 'G元' : (p.dataUri === Gt ? 'G縮小版' : 'G?'))
                   : (p.id === pid ? (p.dataUri === P ? 'P元' : (p.dataUri === Pt ? 'P縮小版' : 'P?' + String(p.dataUri).slice(5, 15))) : '?');
      const row = _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      o.rowFile = row.file;
      o.rowPh = (row.data.chosho_photos || []).filter(p => p && p.dataUri).map(nm).join();
      await openCaseInEditor(row);
      __setTel('090-1111-2222');
      o.press = await __pressSave();
      const t = root.__files[NO + '.json'];
      o.made = t ? (__photosOf(t) || []).map(nm).join() : null;
      o.tel = t ? (JSON.parse(t).chosho_cust_tel || '') : null;
      o.tree = __tree(root);
      o.realSame = list.__files[NO + '.json'] === realText;
      o.oddLooked = oddLooked;
      o.rowN = (row.data.chosho_photos || []).filter(p => p && p.dataUri).length;
      const idb = await __idbPhotos(PID, NO);
      o.idb = { n: idb.photos.length, count: idb.count };
      return o;
    }, { mode });
    const a = alerts(said);
    const msg = indivPart(a[a.length - 1] || '');
    console.log('㊸u' + mode + '見つけた PNG の図（長辺は縮小版と同じ）', short(r), short(msg.slice(0, 300)));
    ok(!r.error, '㊸u' + mode + '止まった → ' + r.error);
    if(!r.error){
      ok(r.pPng && r.pFit && r.pEdge === 400 && r.th.n === 2 && r.th.gEdge === 512 && r.th.pJpeg && r.th.pLen < 150000 && r.th.pEdge === 400
         && r.rowFile === NO + '.json' && r.rowPh === 'G縮小版,P縮小版' && r.press.pressed && (mode === 'a' || r.oddLooked > 0),
         '㊸u' + mode + '試験の前提: PNG はそのまま入る・物件の縮小版は G・P から作った JPEG（P の縮小版は長辺 400 のまま）・物件は古い名前を覚えている・保存を押せた → ' + short(r));
      ok(r.made === 'G元,P元' && r.tel === '090-1111-2222',
         '★㊸u' + mode + ' 見つけた PNG の図（元の写真）を使わず、新しいファイルに物件の JPEG を入れた・作らなかった → ' + short(r));
      ok(/新規作成/.test(msg) && !/作っていません/.test(msg) && !/※/.test(msg) && String(a[a.length - 1] || '').indexOf('⚠ 戸別の個別JSONは作っていません') < 0,
         '★㊸u' + mode + ' 元の写真がみな見つかったのに、断った・「小さい写真のまま入れた」と知らせた → ' + short(msg.slice(0, 300)));
      ok(r.realSame && r.tree.join() === [NO + '.json', 'リスト/' + NO + '.json', '打合せ/memo.json'].sort().join(),
         '★㊸u' + mode + ' 見つけたファイルを書き替えた・工事フォルダの直下に作っていない・ほかのファイルを作った → ' + short(r));
      ok(r.rowN === 2 && r.idb.n === 2 && r.idb.count === 2, '★㊸u' + mode + ' 行・物件（端末内）の写真の枚数が変わった → ' + short(r));
    }
    await ctx.close();
  }
  /* ===== ここまで（㊸r〜㊸u）===== */

  /* ===================== ここから 7回目・8回目の見直しの直し（縮小版づくりのあいだに 📥 が入った行を、同じ回で作り直す） ===================== */

  // ---- ㊾m 共有の物件・📁 の行（ファイルの写真 A・B、物件には A・B の縮小版）。ファイルがいま読めない（同期中）。
  //   📥 で G1 を取り込む（書けない → 物件の縮小版 A・B を残し、作り直す印）→ 自動保存の縮小版づくりが G1 を縮めているあいだに、
  //   同じ管理番号のもう1つの現場ファイル（G1・G2）を 📥 で取り込む。その保存で、ほかの端末の保存とまとめる（行が作り直される）
  //   → その保存のうちに作り直し、物件（この端末・共有ファイル）に A・B・G1・G2。作り直した行に G1・G2 の元の写真。
  //     読めるようになった次の保存でも A・B・G1・G2。作り直せたら印を消す（同じ保存で同じ写真を何度も縮めない）
  //   （前は残した縮小版 A・B を持っているので同じ回に作り直さず、物件に A・B だけが入り、まとめで行が作り直されると
  //     G1・G2 が行・端末内・共有ファイル・戸別ファイルのどこにも残らなかった）
  //   （📥 の画面）同じことを 📥 の画面で：2つの現場ファイルを選び、1つめを 🔀 取り込む → 2つめの確かめの画面を見ているあいだに
  //       自動保存の縮小版づくりが始まる → そこで 2つめを 🔀 取り込む
  for(const ui of (want('㊾m') ? [false, true] : [])){
    const sc = '㊾m' + (ui ? '（📥 の画面）' : '');
    const { ctx, page, said } = await openMain(sc);
    const r0 = await run(page, async ({ NO, PN, ui }) => {
      const PID = 'pj178im' + (ui ? '2' : ''), FN = NO + '.json';
      const A = __jpeg(900, 700, 0.85, 392), B = __jpeg(900, 700, 0.85, 393);
      const G1 = __jpeg(1200, 900, 0.9, 394), G2 = __jpeg(1200, 900, 0.9, 395);   // 現場の写真（大きい＝縮小版を作るのに縮める）
      window.__m = { A, B, G1, G2, PID, FN };
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new' };
      await __openShared(__proj178(PID, PN, []));
      const list = __mk('リスト', { [FN]: JSON.stringify(Object.assign({}, base, { chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }), null, 2) });
      const fh = await list.getFileHandle(FN);
      const row = buildListRow(FN, 1, JSON.parse(list.__files[FN]), fh);
      row._dir = list; row._name = FN; row._dirPath = '';              // 📁 フォルダで読んだ行
      slimListRow(row, true);
      _listRows = [row];
      window.__m.list = list; window.__m.row = row;
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      window.__m.proj = async () => { const x = await __idbPhotos(PID, NO); const all = JSON.parse(window.__disk).cases;
        const dk = all.filter(c => (c.payload || {}).chosho_mgmt_no === NO)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count, cases: all.length }; };
      // 行の写真（元の写真か、縮小版か）
      window.__m.tag = a => (a || []).filter(p => p && p.dataUri)
        .map(p => p.id + ([A, B, G1, G2].indexOf(p.dataUri) >= 0 ? '' : '(縮)')).sort().join(',');
      window.__m.cur = () => _listRows.filter(x => (x.data || {}).chosho_mgmt_no === NO)[0];
      if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await prepareProjectThumbs(true); await projSaveNow();
      const o = { before: await window.__m.proj() };
      list.__unreadable[FN] = 99;                                      // 同期中で読めない（書くときも、縮小版を作るときも）
      const g1 = { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G1', label: 'G1', dataUri: G1 }] };
      const g2 = { chosho_mgmt_no: NO, _origin: 'genba', chosho_photos: [{ id: 'G1', label: 'G1', dataUri: G1 }, { id: 'G2', label: 'G2', dataUri: G2 }] };
      // 縮小版づくりを止めておく（写真が多い・大きいと時間がかかる）。縮めた写真を数える
      const orig = makeThumbDataUri;
      let release; const gate = new Promise(res => { release = res; });
      const shrunk = [];
      makeThumbDataUri = async (u, ...a) => { shrunk.push(u === G1 ? 'G1' : (u === G2 ? 'G2' : '?')); await gate; return orig(u, ...a); };
      window.__m.shrunk = shrunk;
      window.__m.release = () => { release(); makeThumbDataUri = orig; };
      if(ui){
        window.__m.files = [new File([JSON.stringify(g1)], 'genba_1.json', { type: 'application/json' }),
                            new File([JSON.stringify(g2)], 'genba_2.json', { type: 'application/json' })];
        pickFile = function(opts, onFile){ setTimeout(() => onFile(window.__m.files.slice()), 0); };   // 2つのファイルを選んだ
        return o;
      }
      const imp = async g => String(await applyGenbaMergeToRow(row, g, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      try {
        o.note1 = await imp(g1);
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        o.kept = { thumbs: ids(row._thumbs), noFile: !!row._thumbsNoFile };   // 📥 で前の縮小版 A・B を残した
        __otherDeviceSaves('2612MKM099');                              // ほかの端末が物件を保存していた
        const S = projSaveNow();                                       // 自動保存（縮小版づくり → ほかの端末の保存とまとめる）
        for(let i = 0; i < 400 && !shrunk.length; i++) await new Promise(res => setTimeout(res, 10));
        o.started = shrunk.slice();                                    // G1 を縮めているところ
        o.note2 = await imp(g2);                                       // そのあいだに、もう1つの現場ファイル（G1・G2）を取り込む
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        o.rowN = ids(row.data.chosho_photos);
        release();
        await S;
        o.shrunk = shrunk.slice();                                     // その保存で縮めた写真
      } finally { window.__m.release(); }
      for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued); i++){
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
        await new Promise(res => setTimeout(res, 50));
      }
      return o;
    }, { NO, PN, ui });
    let ui2 = null;
    if(ui && !r0.error){
      // 📥 現場取込：2つのファイルを選ぶ → 1つめの確かめの画面で 🔀 取り込む
      ui2 = {};
      try {
        await page.evaluate(() => { genbaImportFlow(); });
        await page.waitForSelector('#genba-import-modal.open', { timeout: 30000 });
        await page.$eval('#gi-import', b => b.click());
        await page.waitForFunction(() => !document.getElementById('genba-import-modal').classList.contains('open'), null, { timeout: 30000 });
        await page.waitForSelector('#genba-import-modal.open', { timeout: 60000 });   // 2つめの確かめの画面
        ui2.kept = await page.evaluate(() => { const r = window.__m.row;
          return { thumbs: (r._thumbs || []).map(p => p.id).sort().join(','), noFile: !!r._thumbsNoFile }; });
        await page.evaluate(() => __otherDeviceSaves('2612MKM099'));    // ほかの端末が物件を保存していた
        // 画面を見ているあいだに、1つめの取り込みの自動保存（1.5秒あと）が縮小版づくりを始める
        await page.waitForFunction(() => window.__m.shrunk.length > 0, null, { timeout: 30000 });
        ui2.started = await page.evaluate(() => window.__m.shrunk.slice());
        await page.$eval('#gi-import', b => b.click());                // 2つめを 🔀 取り込む
        await page.waitForFunction(() => ((window.__m.row.data || {}).chosho_photos || []).some(p => p && p.id === 'G2'), null, { timeout: 30000 });
        ui2.rowN = await page.evaluate(() => (window.__m.row.data.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','));
        await page.evaluate(() => window.__m.release());               // 縮小版づくりが進む
        for(let i = 0; i < 600 && !alerts(said).some(m => /現場データ取込 完了/.test(m)); i++) await sleep(100);
        ui2.done = alerts(said).filter(m => /現場データ取込 完了/.test(m)).map(m => m.replace(/\s+/g, ' ').slice(0, 80))[0] || '';
        await page.evaluate(async () => {
          for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued); i++){
            if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
            await new Promise(res => setTimeout(res, 50));
          }
        });
      } catch(e){ ui2.error = String((e && e.message) || e).slice(0, 300); }
      finally { await page.evaluate(() => window.__m.release()).catch(() => {}); }
    }
    const r = r0.error ? r0 : await run(page, async ({ NO }) => {
      const m = window.__m, cur = m.cur();
      const o = { rebuilt: cur !== m.row, row: m.tag(cur && cur.data.chosho_photos), race: await m.proj(),
                  file: (__photosOf(m.list.__files[m.FN]) || []).map(p => p.id).sort().join(',') };
      m.list.__unreadable[m.FN] = 0;                                   // 同期が終わった
      projTouch(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await prepareProjectThumbs(true); await projSaveNow();           // 自動保存
      const c2 = m.cur();
      o.after = await m.proj(); o.rowAfter = m.tag(c2 && c2.data.chosho_photos);
      return o;
    }, { NO });
    if(!r.error) Object.assign(r, r0, ui2 ? { ui: ui2 } : {});
    console.log(sc + '縮小版づくりのあいだに同じ戸別へ2つめの 📥・まとめ', short(r));
    ok(!r.error && !(ui2 && ui2.error), sc + '止まった → ' + (r.error || (ui2 && ui2.error)));
    if(!r.error && !(ui2 && ui2.error)){
      const w = 'A,B,G1,G2';
      const pre = ui
        ? (ui2.kept.thumbs === 'A,B' && ui2.kept.noFile && ui2.started[0] === 'G1' && ui2.rowN === 'G1,G2'
           && /取込: 2 件（うち 2 件は戸別ファイルへ書けていません）/.test(ui2.done))
        : (/読めませんでした/.test(r.note1) && /読めませんでした/.test(r.note2) && r.kept.thumbs === 'A,B' && r.kept.noFile
           && r.started.length === 1 && r.started[0] === 'G1' && r.rowN === 'G1,G2');
      ok(r.before.idb === 'A,B' && r.before.idbCount === 2 && pre && r.rebuilt && r.file === 'A,B' && r.race.cases === 2,
         sc + '試験の前提: 物件に A・B・取り込みは書けず前の縮小版 A・B を残した・G1 を縮めているあいだに G2 も入った・ほかの端末の保存とまとめて行が作り直された → ' + short(r));
      ok(r.race.idb === w && r.race.idbCount === 4 && r.race.disk === w && r.race.diskCount === 4,
         '★' + sc + '縮小版づくりのあいだに2つめの 📥 が入った保存で、物件（この端末・共有ファイル）が A・B・G1・G2（4枚）でない（取り込んだ写真が入らない） → ' + short(r.race));
      ok(/(^|,)G1(,|$)/.test(r.row) && /(^|,)G2(,|$)/.test(r.row),
         '★' + sc + 'まとめで作り直した行に、取り込んだ G1・G2 の元の写真が無い（行・端末内・共有ファイル・戸別ファイルのどこにも残らない） → ' + short(r.row));
      ok(r.after.idb === w && r.after.idbCount === 4 && r.after.disk === w && r.after.diskCount === 4 && /(^|,)G1(,|$)/.test(r.rowAfter) && /(^|,)G2(,|$)/.test(r.rowAfter),
         '★' + sc + '読めるようになった次の保存で、行・物件（この端末・共有ファイル）が A・B・G1・G2 でない → ' + short({ after: r.after, row: r.rowAfter }));
      if(!ui){
        const n = k => r.shrunk.filter(x => x === k).length;
        ok(n('G1') <= 2 && n('G2') <= 1,
           '★' + sc + '作り直せたあとも作り直しの印が残り、同じ保存のうちに同じ写真を何度も縮めた（ファイルを読めないあいだ、保存のたびに大きい写真を何度も縮める） → ' + short(r.shrunk));
      }
    }
    await ctx.close();
  }

  // ---- ㊾m2 （8回目の見直し）共有の物件・📁 で読んだ2つの戸別 X（ファイルの写真 A・B）・Y（C・D）。どちらも物件に縮小版がある。
  //   X のファイルはいま読めない（同期中）。1回の 📥 で Y・X の2つの現場ファイルを選ぶ。
  //   Y を取り込む（書けた）→ 自動保存の縮小版づくりが Y の写真を縮めているあいだに、X（GX）を取り込む（書けない → 物件の縮小版 A・B を残す）。
  //   その保存で、ほかの端末の保存（別の戸別）とまとめる（行が作り直される）
  //   → その保存のうちに X も作り直し、物件（この端末・共有ファイル）の X は A・B・GX。作り直した X の行に GX の元の写真。
  //     読めるようになった次の保存でも A・B・GX。X を作り直すのはその回に1度だけ
  //   （前は、作り直すのを縮小版づくりを始めたときに選んだ行だけにしていたため、X は A・B の縮小版のまま物件に入り、
  //     まとめで行が作り直されると GX が行・端末内・共有ファイル・戸別ファイルのどこにも残らなかった）
  //   （📥 の画面）同じことを 📥 の画面で（📥 ボタン → Y の確かめの画面で 🔀 取り込む → X の確かめの画面を見ているあいだに
  //       Y の縮小版づくりが始まる → そこで X を 🔀 取り込む）
  for(const ui of (want('㊾m2') ? [false, true] : [])){
    const sc = '㊾m2' + (ui ? '（📥 の画面）' : '');
    const { ctx, page, said } = await openMain(sc);
    const r0 = await run(page, async ({ NO, NO2, PN, ui }) => {
      const PID = 'pj178in' + (ui ? '2' : ''), FX = NO + '.json', FY = NO2 + '.json';
      const A = __jpeg(900, 700, 0.85, 396), B = __jpeg(900, 700, 0.85, 397), C = __jpeg(900, 700, 0.85, 398), D = __jpeg(900, 700, 0.85, 399);
      const GY = [__jpeg(1200, 900, 0.9, 410), __jpeg(1200, 900, 0.9, 411)], GX = __jpeg(1200, 900, 0.9, 412);   // 現場の写真（大きい＝縮める）
      const ORIG = [A, B, C, D, GX].concat(GY);
      const mk = (no, ph) => JSON.stringify({ chosho_mgmt_no: no, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: 'uhf_new',
                                              chosho_photos: ph.map(([id, u]) => ({ id, label: id, dataUri: u })) }, null, 2);
      await __openShared(__proj178(PID, PN, []));
      closeMenuView(); openListView();                                 // 戸別一覧の画面（📁・📥 のある画面）
      await new Promise(res => setTimeout(res, 500));
      const list = __mk('リスト', { [FX]: mk(NO, [['A', A], ['B', B]]), [FY]: mk(NO2, [['C', C], ['D', D]]) });
      const root = __mk(PN, {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      await listSelectFolder();                                        // 📁 フォルダ（物件に取り込む）
      const ids = a => (a || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(',');
      const rowOf = no => _listRows.filter(x => (x.data || {}).chosho_mgmt_no === no)[0];
      const desc = r => r ? { slim: !!r._slim, thumbs: Array.isArray(r._thumbs) ? ids(r._thumbs) : null, noFile: !!r._thumbsNoFile, retry: !!r._thumbsRetry } : null;
      window.__m = { PID, FX, FY, list, rowOf, desc, ids, x: rowOf(NO) };
      window.__m.proj = async no => { const x = await __idbPhotos(PID, no); const all = JSON.parse(window.__disk).cases;
        const dk = all.filter(c => (c.payload || {}).chosho_mgmt_no === no)[0];
        return { idb: ids(x.photos), idbCount: x.count, disk: ids(dk && dk.payload.chosho_photos), diskCount: dk && dk.payload.chosho_photo_count, cases: all.length }; };
      window.__m.tag = a => (a || []).filter(p => p && p.dataUri).map(p => p.id + (ORIG.indexOf(p.dataUri) >= 0 ? '' : '(縮)')).sort().join(',');
      for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued || _projThumbsBusy); i++){
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        await new Promise(res => setTimeout(res, 50));
      }
      await prepareProjectThumbs(true); await projSaveNow();
      const o = { before: { X: await window.__m.proj(NO), Y: await window.__m.proj(NO2) }, rows: _listRows.length };
      list.__unreadable[FX] = 1e9;                                     // X の戸別ファイルはいま読めない（同期中）
      const gy = { chosho_mgmt_no: NO2, _origin: 'genba', work_type: 'uhf_new', chosho_photos: GY.map((u, i) => ({ id: 'GY' + i, label: 'GY' + i, dataUri: u })) };
      const gx = { chosho_mgmt_no: NO, _origin: 'genba', work_type: 'uhf_new', chosho_photos: [{ id: 'GX', label: 'GX', dataUri: GX }] };
      // 縮小版づくりを止めておく（写真が多い・大きいと時間がかかる）。縮めた写真を数える
      const orig = makeThumbDataUri;
      let release; const gate = new Promise(res => { release = res; });
      const shrunk = [];
      const NAME = new Map([[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D'], [GX, 'GX']].concat(GY.map((u, i) => [u, 'GY' + i])));
      makeThumbDataUri = async (u, ...a) => { shrunk.push(NAME.get(u) || '?'); await gate; return orig(u, ...a); };
      window.__m.shrunk = shrunk;
      window.__m.release = () => { release(); makeThumbDataUri = orig; };
      if(ui){
        const files = [new File([JSON.stringify(gy)], FY, { type: 'application/json' }), new File([JSON.stringify(gx)], FX, { type: 'application/json' })];
        pickFile = function(opts, onFile){ setTimeout(() => onFile(files.slice()), 0); };   // ファイルを選ぶ画面で Y・X の2つを選んだ
        return o;
      }
      const imp = async (no, g) => String(await applyGenbaMergeToRow(rowOf(no), g, { importRun: true }) || '').replace(/\s+/g, ' ').slice(0, 60);
      try {
        _genbaNoDir = false;
        o.noteY = await imp(NO2, gy);                                  // Y を取り込む（戸別ファイルへ書けた）
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        __otherDeviceSaves('2612MKM099');                              // ほかの端末が物件を保存していた（別の戸別）
        const S = projSaveNow();                                       // 自動保存（Y の縮小版づくり → ほかの端末の保存とまとめる）
        for(let i = 0; i < 400 && !shrunk.length; i++) await new Promise(res => setTimeout(res, 10));
        o.started = shrunk.slice();                                    // Y の写真を縮めているところ
        o.xPrev = desc(rowOf(NO));                                     // X は縮小版 A・B（ファイルから作った）を持つ＝この回の作る行に入っていない
        o.noteX = await imp(NO, gx);                                   // そのあいだに X を取り込む（書けない）
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
        o.xKept = desc(rowOf(NO));
        release();
        await S;
        o.shrunk = shrunk.slice();                                     // その保存で縮めた写真
      } finally { window.__m.release(); }
      for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued); i++){
        if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
        await new Promise(res => setTimeout(res, 50));
      }
      return o;
    }, { NO, NO2, PN, ui });
    let ui2 = null;
    if(ui && !r0.error){
      ui2 = {};
      try {
        await page.click('#btn-genba-import');                        // 📥 現場取込（Y・X の2つを選ぶ）
        await page.waitForFunction(no => { const m = document.getElementById('genba-import-modal');
          return m && m.classList.contains('open') && document.getElementById('gi-title').textContent.indexOf(no) >= 0; }, NO2, { timeout: 30000 });
        await page.click('#gi-import');                                // Y を 🔀 取り込む
        await page.waitForFunction(no => { const m = document.getElementById('genba-import-modal');
          return m && m.classList.contains('open') && document.getElementById('gi-title').textContent.indexOf(no) >= 0; }, NO, { timeout: 60000 });
        await page.evaluate(() => __otherDeviceSaves('2612MKM099'));    // ほかの端末が物件を保存していた（別の戸別）
        // X の確かめの画面を見ているあいだに、Y の取り込みの自動保存（1.5秒あと）が Y の縮小版づくりを始める
        await page.waitForFunction(() => window.__m.shrunk.length > 0, null, { timeout: 30000 });
        Object.assign(ui2, await page.evaluate(no => ({ started: window.__m.shrunk.slice(), busy: _projThumbsBusy,
          xPrev: window.__m.desc(window.__m.rowOf(no)) }), NO));
        await page.click('#gi-import');                                // X を 🔀 取り込む（書けない）
        await page.waitForFunction(no => { const r = window.__m.rowOf(no);
          return ((r && r.data && r.data.chosho_photos) || []).some(p => p && p.id === 'GX'); }, NO, { timeout: 30000 });
        ui2.xKept = await page.evaluate(no => window.__m.desc(window.__m.rowOf(no)), NO);
        await page.evaluate(() => window.__m.release());               // 縮小版づくりが進む
        for(let i = 0; i < 600 && !alerts(said).some(m => /現場データ取込 完了/.test(m)); i++) await sleep(100);
        ui2.done = alerts(said).filter(m => /現場データ取込 完了/.test(m)).map(m => m.replace(/\s+/g, ' ').slice(0, 80))[0] || '';
        await page.evaluate(async () => {
          for(let i = 0; i < 100 && (_projSaving || _projSaveTimer || _projSaveQueued || _projThumbsBusy); i++){
            if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; await projSaveNow(); }
            await new Promise(res => setTimeout(res, 50));
          }
        });
      } catch(e){ ui2.error = String((e && e.message) || e).slice(0, 300); }
      finally { await page.evaluate(() => window.__m.release()).catch(() => {}); }
    }
    const r = r0.error ? r0 : await run(page, async ({ NO, NO2 }) => {
      const m = window.__m, cur = m.rowOf(NO);
      const o = { rebuilt: cur !== m.x, row: m.tag(cur && cur.data.chosho_photos), race: await m.proj(NO), raceY: await m.proj(NO2),
                  file: m.ids(__photosOf(m.list.__files[m.FX])), fileY: m.ids(__photosOf(m.list.__files[m.FY])) };
      m.list.__unreadable[m.FX] = 0;                                   // 同期が終わった
      projTouch(); if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }
      await prepareProjectThumbs(true); await projSaveNow();           // 自動保存
      const c2 = m.rowOf(NO);
      o.after = await m.proj(NO); o.rowAfter = m.tag(c2 && c2.data.chosho_photos);
      return o;
    }, { NO, NO2 });
    if(!r.error) Object.assign(r, r0, ui2 ? { ui: ui2 } : {});
    console.log(sc + '縮小版づくりのあいだに別の戸別へ 📥・まとめ', short(r));
    ok(!r.error && !(ui2 && ui2.error), sc + '止まった → ' + (r.error || (ui2 && ui2.error)));
    if(!r.error && !(ui2 && ui2.error)){
      const w = 'A,B,GX';
      const v = ui ? ui2 : r;
      const pre = ui
        ? (ui2.busy && /取込: 2 件（うち 1 件は戸別ファイルへ書けていません）/.test(ui2.done))
        : (/個別JSONも更新しました/.test(r.noteY) && /読めませんでした/.test(r.noteX));
      ok(r.rows === 2 && r.before.X.idb === 'A,B' && r.before.X.idbCount === 2 && r.before.Y.idb === 'C,D' && pre
         && v.started.length === 1 && /^(C|D|GY0|GY1)$/.test(v.started[0]) && v.xPrev && v.xPrev.slim && v.xPrev.thumbs === 'A,B' && !v.xPrev.noFile && !v.xPrev.retry
         && v.xKept && v.xKept.thumbs === 'A,B' && v.xKept.noFile
         && r.rebuilt && r.file === 'A,B' && r.fileY === 'C,D,GY0,GY1' && r.race.cases === 3
         && r.raceY.idb === 'C,D,GY0,GY1' && r.raceY.disk === 'C,D,GY0,GY1',
         sc + '試験の前提: X・Y とも物件に縮小版・Y は書けた・Y の写真を縮めているあいだに X に GX が入った（書けず前の縮小版 A・B を残した・この回の作る行ではなかった）・ほかの端末の保存とまとめて行が作り直された → ' + short(r));
      ok(r.race.idb === w && r.race.idbCount === 3 && r.race.disk === w && r.race.diskCount === 3,
         '★' + sc + 'ほかの戸別の縮小版づくりのあいだに 📥 が入った保存で、物件（この端末・共有ファイル）の X が A・B・GX（3枚）でない（取り込んだ写真が入らない） → ' + short(r.race));
      ok(/(^|,)GX(,|$)/.test(r.row),
         '★' + sc + 'まとめで作り直した X の行に、取り込んだ GX の元の写真が無い（行・端末内・共有ファイル・戸別ファイルのどこにも残らない） → ' + short(r.row));
      ok(r.after.idb === w && r.after.idbCount === 3 && r.after.disk === w && r.after.diskCount === 3 && /(^|,)GX(,|$)/.test(r.rowAfter),
         '★' + sc + '読めるようになった次の保存で、X の行・物件（この端末・共有ファイル）が A・B・GX でない → ' + short({ after: r.after, row: r.rowAfter }));
      if(!ui){
        ok(r.shrunk.filter(x => x === 'GX').length === 1,
           '★' + sc + 'その保存で X の GX を1度だけ縮めていない（作り直していない・作り直しの印が消えず何度も縮めた） → ' + short(r.shrunk));
      }
    }
    await ctx.close();
  }

  // ---- ㊾n 📁 で読んだ暗号の戸別（.hyb・.enc。どちらも写真 A・B）を 🔓 まとめて復号 → 📥 現場取込（ボタン・取り込み窓の「取り込む」）----
  //   写真 G の取り込み → 一覧（工事別フォルダ）の「写真」欄が「―」（写真なし）にならない・押すと写真が出る（枚数は取り込んだ数＝1。0 にしない）
  //   写真の無い取り込み（下見済みの印だけ）→ 🔒（開くまで分からない＝-1）のまま
  //   平文の常駐させない行（写真 A・B）へ G → 一覧の枚数はファイルの枚数のまま（㊾c・㊾l と同じ。f は 2・p はファイルへ書けて 3）
  //   （前は暗号の行の「分からない」（-1）を 0 にして、ファイルに A・B、行に G があるのに「―」と出し、押せなかった）
  //   f) 物件を開いていない（戸別ファイルへは書かない）　p) 物件を開いている（取り込みで戸別ファイルへ書く）
  for(const mode of ['f', 'p'].filter(m => want('㊾n' + m))){
    const { ctx, page } = await openMain('㊾n' + mode);
    const r = await run(page, async ({ PN, mode }) => {
      const wait = ms => new Promise(res => setTimeout(res, ms));
      const A = __jpeg(600, 450, 0.85, 421), B = __jpeg(640, 480, 0.85, 422), G = __jpeg(620, 460, 0.85, 423);
      // hg／eg＝写真 G を取り込む .hyb／.enc　hn／en＝写真の無い取り込みの .hyb／.enc　pg＝写真 G を取り込む平文の戸別
      const K = { hg: '2612MKM181', eg: '2612MKM182', hn: '2612MKM183', en: '2612MKM184', pg: '2612MKM185' };
      const FN = { hg: K.hg + '.hyb', eg: K.eg + '.enc', hn: K.hn + '.hyb', en: K.en + '.enc', pg: K.pg + '.json' };
      if(mode === 'p') await __openProj(__proj178('pj178in', PN, []));
      setSessionPassword('pw1234');
      const st = no => ({ chosho_mgmt_no: no, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress', work_type: 'uhf_new',
                          chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] });
      const files = {};
      for(const k of ['hg', 'hn']) files[FN[k]] = JSON.stringify(await encryptHybrid(st(K[k]), 'pw1234'), null, 2);
      for(const k of ['eg', 'en']) files[FN[k]] = JSON.stringify(await encryptJsonString(JSON.stringify(st(K[k])), 'pw1234'), null, 2);
      files[FN.pg] = JSON.stringify(st(K.pg), null, 2);
      const list = __mk('リスト', files, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      window.showDirectoryPicker = async () => root;
      openListView();
      await document.getElementById('btn-list-select-folder').onclick();          // 📁 フォルダ
      for(let i = 0; i < 200 && _listRows.length < 5; i++) await wait(50);
      await document.getElementById('btn-list-unlock').onclick();                 // 🔓 まとめて復号
      const rowOf = k => _listRows.filter(x => String(x.file || '').split('/').pop() === FN[k])[0];
      // 工事別フォルダの一覧（「写真」欄があるのはここ）のその戸別の行
      const trOf = k => Array.from(document.querySelectorAll('table.folder-table tr[data-list-idx]'))
        .filter(t => t.querySelector('td.photo-cell') && t.querySelector('td.mgmt-no') && t.querySelector('td.mgmt-no').textContent.trim() === K[k])[0];
      const look = () => { _listMode = 'by_folder'; renderListTable(); const o = {};
        for(const k of Object.keys(K)){ const x = rowOf(k), tr = trOf(k), c = tr && tr.querySelector('td.photo-cell');
          o[k] = { pc: x ? x._photoCount : '行なし', cell: c ? c.textContent.trim() : 'なし', click: !!(c && c.classList.contains('has-photos')), vis: !!(tr && tr.offsetParent !== null) }; }
        return o; };
      const o = { rows: _listRows.length };
      o.kind = Object.keys(K).map(k => { const x = rowOf(k); return k + ':' + (x ? (x.fileType + (x._slim ? '(slim)' : '') + (x.unlocked ? '(unlocked)' : '')) : '行なし'); }).join(' ');
      o.before = look();
      // 📥 現場取込：ボタンを押す → ファイルを選ぶ（5つ）→ 取り込み窓で「🔀 取り込む」を1件ずつ押す
      const gfile = (k, withPhoto) => new File([JSON.stringify(Object.assign({ chosho_mgmt_no: K[k], _origin: 'genba', work_type: 'uhf_new' },
        withPhoto ? { chosho_photos: [{ id: 'G' + k, label: 'G', dataUri: G }] } : { survey_done: true, survey_done_at: '2026-10-10T09:00' }))],
        K[k] + '.json', { type: 'application/json' });
      const picked = [gfile('hg', true), gfile('eg', true), gfile('hn', false), gfile('en', false), gfile('pg', true)];
      pickFile = (opts, cb) => { setTimeout(() => cb(opts && opts.multiple ? picked : picked[0]), 0); };
      const al = []; const oa = window.alert; window.alert = m => { al.push(String(m)); };
      try {
        document.getElementById('btn-genba-import').onclick();
        o.clicks = 0;
        for(let i = 0; i < 800 && !al.some(a => /現場データ取込 完了/.test(a)); i++){
          await wait(50);
          const b = document.getElementById('gi-import');
          if(b && b.onclick && b.offsetParent !== null){ b.click(); o.clicks++; }
        }
      } finally { window.alert = oa; }
      o.done = (al.filter(a => /現場データ取込 完了/.test(a))[0] || '').replace(/\s+/g, ' ').slice(0, 60);
      o.held = Object.keys(K).map(k => { const x = rowOf(k); return k + ':' + (((x && x.data) || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).join(','); }).join(' ');
      o.after = look();
      // 「写真」欄を押す → 写真の見本が出る
      const prev = async k => { look(); const tr = trOf(k), td = tr && tr.querySelector('td.photo-cell.has-photos');
        if(!td) return { n: 0, t: '押せない' };
        td.click();
        let body = null;
        for(let i = 0; i < 200; i++){ await wait(50); body = document.getElementById('photo-prev-body'); if(body && !/読み込み中/.test(body.textContent)) break; }
        const res = { n: body ? body.querySelectorAll('img').length : 0, t: body ? body.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '窓なし' };
        closePhotoPreview(); return res; };
      o.prevHg = await prev('hg'); o.prevEg = await prev('eg');
      // 戸別ファイルの写真（どれも A・B は残っている）
      o.files = [];
      for(const k of Object.keys(K)){
        let ids;
        try { const j = JSON.parse(list.__files[FN[k]]);
          const d = (k === 'pg') ? j : ((j.format === 'hybrid') ? await decryptHybrid(j, 'pw1234') : JSON.parse(await decryptJsonString(j, 'pw1234')));
          ids = (d.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); } catch(e){ ids = '読めない ' + String(e).slice(0, 40); }
        o.files.push(k + ':' + ids);
      }
      o.files = o.files.join(' ');
      o.writes = list.__writes.map(w => w.n).join(',');
      return o;
    }, { PN, mode });
    console.log('㊾n' + mode + '・暗号の戸別へ 📥 したあとの一覧の写真の欄', short(r));
    ok(!r.error, '㊾n' + mode + '止まった → ' + r.error);
    if(!r.error){
      const b = r.before || {}, a = r.after || {};
      ok(r.rows === 5 && r.kind === 'hg:hybrid(slim)(unlocked) eg:full(slim)(unlocked) hn:hybrid(slim)(unlocked) en:full(slim)(unlocked) pg:plain(slim)(unlocked)'
         && Object.keys(b).length === 5 && Object.keys(b).every(k => b[k].vis)
         && ['hg', 'eg', 'hn', 'en'].every(k => b[k].pc === -1 && b[k].cell === '🔒' && !b[k].click)
         && b.pg.pc === 2 && b.pg.cell === '📷 2' && b.pg.click
         && /取込: 5 件/.test(r.done) && r.clicks === 5
         && r.held === 'hg:Ghg eg:Geg hn: en: pg:' + (mode === 'p' ? '' : 'Gpg'),   // p) 平文は戸別ファイルへ書けた → 行は「ファイルから読む」に戻る（㊽c）
         '㊾n' + mode + '試験の前提: 📁 で読んで 🔓 した暗号の戸別は 🔒（枚数 -1）・平文は 📷 2・取り込み窓を5回押して5件取り込んだ → ' + short(r));
      for(const k of ['hg', 'eg']){
        const nm = (k === 'hg') ? '.hyb' : '.enc';
        ok(a[k].pc === 1, '★㊾n' + mode + '写真 G を取り込んだ ' + nm + ' の行の枚数が、取り込んだ写真の数（1）でない（0＝写真なし・-1＝🔒 で押せない） → ' + short(a[k]));
        ok(a[k].vis && a[k].cell !== '―' && /^📷 [1-9]/.test(a[k].cell) && a[k].click,
           '★㊾n' + mode + '写真 G を取り込んだ ' + nm + ' の行の「写真」欄が「―」（写真なし）で押せない（ファイルに A・B、行に G がある） → ' + short(a[k]));
      }
      ok(r.prevHg.n >= 1 && r.prevEg.n >= 1, '★㊾n' + mode + '暗号の戸別の「写真」欄を押しても写真が出ない → ' + short({ hyb: r.prevHg, enc: r.prevEg }));
      for(const k of ['hn', 'en']){
        const nm = (k === 'hn') ? '.hyb' : '.enc';
        ok(a[k].vis && a[k].pc === -1 && a[k].cell === '🔒',
           '★㊾n' + mode + '写真の無い取り込みで、' + nm + ' の行が 🔒（開くまで分からない）でなくなった（「―」＝写真なし と出る） → ' + short(a[k]));
      }
      {
        const fn = (mode === 'p') ? 3 : 2;   // p) 取り込みで戸別ファイルへ書けた（A・B・G）→ ファイルの枚数は3
        ok(a.pg.vis && a.pg.pc === fn && a.pg.cell === '📷 ' + fn && a.pg.click,
           '★㊾n' + mode + '平文の常駐させない行の枚数が、ファイルの枚数（' + fn + '）でなくなった（🧩 重複をまとめる が残すファイルを選び違える） → ' + short(a.pg));
      }
      ok(r.files.split(' ').length === 5 && r.files.split(' ').every(x => /^[a-z]+:A,B(,|$)/.test(x))
         && (mode === 'p' ? /(^| )pg:A,B,Gpg( |$)/.test(r.files) : r.files === 'hg:A,B eg:A,B hn:A,B en:A,B pg:A,B'),
         '㊾n' + mode + '戸別ファイルの写真 A・B が減った（p は平文の戸別ファイルに G も入る） → ' + short({ files: r.files, writes: r.writes }));
    }
    await ctx.close();
  }

  // ---- ㊾nr 📁 で読んだ .hyb（写真 A・B）を 🔓 → 開いて電話を直して一覧へ（枚数 2）→ 開き直して 💾 上書き保存（直さずに）→ 一覧へ
  //      （行は「ファイルから読む」になり、行の写真は空・枚数は 2 のまま）→ 📥 写真の無い取り込み → 一覧の「写真」欄は「📷 2」のまま押せる・
  //      受付台帳の枚数も 2 → 📥 写真 G の取り込み → 枚数はファイルの枚数（2）より減らない（行に G を持つ）
  //   （前は写真の無い取り込みで、分かっている枚数 2 を 0 にして「―」と出し、押せなかった。写真 G の取り込みでは 1 にしていた）
  if(want('㊾nr')){
    const { ctx, page } = await openMain('㊾nr');
    const r = await run(page, async ({ PN }) => {
      const wait = ms => new Promise(res => setTimeout(res, ms));
      const A = __jpeg(600, 450, 0.85, 424), B = __jpeg(640, 480, 0.85, 425), G = __jpeg(620, 460, 0.85, 426);
      const K = '2612MKM186', FN = K + '.hyb';
      await __openProj(__proj178('pj178nr', PN, []));
      setSessionPassword('pw1234');
      const env = await encryptHybrid({ chosho_mgmt_no: K, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress',
        work_type: 'uhf_new', chosho_photos: [{ id: 'A', label: 'A', dataUri: A }, { id: 'B', label: 'B', dataUri: B }] }, 'pw1234');
      const list = __mk('リスト', { [FN]: JSON.stringify(env, null, 2) }, {}, { resolve: true });
      const root = __mk('その１', {}, { 'リスト': list }, { resolve: true });
      window.showDirectoryPicker = async () => root;
      openListView();
      await document.getElementById('btn-list-select-folder').onclick();          // 📁 フォルダ
      for(let i = 0; i < 200 && _listRows.length < 1; i++) await wait(50);
      await document.getElementById('btn-list-unlock').onclick();                 // 🔓 まとめて復号
      const rowOf = () => _listRows.filter(x => String(x.file || '').split('/').pop() === FN)[0];
      const trOf = () => Array.from(document.querySelectorAll('table.folder-table tr[data-list-idx]'))
        .filter(t => t.querySelector('td.photo-cell') && t.querySelector('td.mgmt-no') && t.querySelector('td.mgmt-no').textContent.trim() === K)[0];
      // 物件の自動保存は止める（一覧へ戻るたびに待たないで済むように）
      const stopTimer = () => { if(typeof _projSaveTimer !== 'undefined' && _projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } };
      const fileIds = async () => { try { const d = await decryptHybrid(JSON.parse(list.__files[FN]), 'pw1234');
        return (d.chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); } catch(e){ return '読めない ' + String(e).slice(0, 40); } };
      const back = async () => { openListView(); stopTimer(); await wait(300); };
      const look = async () => {
        if(!document.body.classList.contains('list-view-open')){ openListView(); stopTimer(); }
        _listMode = 'by_folder'; renderListTable();
        const x = rowOf(), tr = trOf(), c = tr && tr.querySelector('td.photo-cell');
        return { slim: !!(x && x._slim), pc: x ? x._photoCount : '行なし',
                 rowPh: (((x && x.data) || {}).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).join(','),
                 cell: c ? c.textContent.trim() : 'なし', click: !!(c && c.classList.contains('has-photos')), vis: !!(tr && tr.offsetParent !== null),
                 ledger: x ? lgPhotoCountOf(x.data, x) : null, file: await fileIds() }; };
      // 一覧の行を押して開く → 画面の写真
      const open = async () => {
        await look();
        const tr = trOf();
        if(!tr) return '行が無い';
        tr.click();
        for(let i = 0; i < 100 && document.body.classList.contains('list-view-open'); i++) await wait(100);
        await wait(300);
        return (STATE.photos || []).filter(p => p && p.dataUri).map(p => p.id).join(',');
      };
      // 📥 現場取込：ボタンを押す → ファイルを選ぶ → 取り込み窓で「🔀 取り込む」を押す
      const imp = async withPhoto => {
        await look();
        const f = new File([JSON.stringify(Object.assign({ chosho_mgmt_no: K, _origin: 'genba', work_type: 'uhf_new' },
          withPhoto ? { chosho_photos: [{ id: 'G', label: 'G', dataUri: G }] } : { survey_done: true, survey_done_at: '2026-10-10T09:00' }))],
          K + '.json', { type: 'application/json' });
        pickFile = (opts, cb) => { setTimeout(() => cb(opts && opts.multiple ? [f] : f), 0); };
        const al = []; const oa = window.alert; window.alert = m => { al.push(String(m)); };
        let clicks = 0;
        try {
          document.getElementById('btn-genba-import').onclick();
          for(let i = 0; i < 800 && !al.some(a => /現場データ取込 完了/.test(a)); i++){
            await wait(50);
            const b = document.getElementById('gi-import');
            if(b && b.onclick && b.offsetParent !== null){ b.click(); clicks++; }
          }
        } finally { window.alert = oa; }
        await wait(300); stopTimer();
        return clicks + '回・' + (al.filter(a => /現場データ取込 完了/.test(a))[0] || '').replace(/\s+/g, ' ').slice(0, 30);
      };
      // 「写真」欄を押す → 写真の見本が出る
      const prev = async () => { await look(); const tr = trOf(), td = tr && tr.querySelector('td.photo-cell.has-photos');
        if(!td) return { n: 0, t: '押せない' };
        td.click();
        let body = null;
        for(let i = 0; i < 200; i++){ await wait(50); body = document.getElementById('photo-prev-body'); if(body && !/読み込み中/.test(body.textContent)) break; }
        const res = { n: body ? body.querySelectorAll('img').length : 0, t: body ? body.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '窓なし' };
        closePhotoPreview(); return res; };
      const o = { rows: _listRows.length };
      o.s0 = await look();
      o.open1 = await open(); __setTel('090-1111-2222'); await back();                 // 開いて電話を直して一覧へ
      o.s1 = await look();
      o.open2 = await open(); o.save = await __pressSave(); await back();              // 開き直して 💾 上書き保存（直さずに）→ 一覧へ
      o.dirty2 = !!_editorDirty;
      o.s2 = await look();
      o.imp3 = await imp(false);                                                       // 📥 写真の無い取り込み
      o.s3 = await look();
      o.prev3 = await prev();
      o.imp4 = await imp(true);                                                        // 📥 写真 G の取り込み
      o.s4 = await look();
      o.prev4 = await prev();
      return o;
    }, { PN });
    console.log('㊾nr・💾 上書き保存のあとの .hyb へ 📥 したあとの一覧の写真の欄', short(r).slice(0, 1600));
    ok(!r.error, '㊾nr止まった → ' + r.error);
    if(!r.error){
      const s = k => r[k] || {};
      ok(r.rows === 1 && s('s0').slim && s('s0').pc === -1 && s('s0').cell === '🔒' && s('s0').file === 'A,B'
         && r.open1 === 'A,B' && !s('s1').slim && s('s1').pc === 2 && s('s1').cell === '📷 2' && s('s1').rowPh === 'A,B'
         && r.open2 === 'A,B' && r.save && r.save.pressed && /上書き保存/.test(r.save.text)
         && s('s2').slim && s('s2').rowPh === '' && s('s2').pc === 2 && s('s2').cell === '📷 2' && s('s2').click
         && /^1回・.*取込: 1 件/.test(r.imp3) && /^1回・.*取込: 1 件/.test(r.imp4),
         '㊾nr試験の前提: 🔓 で 🔒・開いて直して戻ると 📷 2・💾 上書き保存のあと行は「ファイルから読む」で行の写真は空・📷 2・取り込みを1件ずつ → ' + short(r).slice(0, 1600));
      ok(s('s3').pc === 2 && s('s3').vis && s('s3').cell === '📷 2' && s('s3').click,
         '★㊾nr写真の無い取り込みで、💾 上書き保存のあとの .hyb の行の枚数 2 を 0 にした（「写真」欄が「―」＝写真なし で押せない。ファイルに A・B がある） → ' + short(s('s3')));
      ok(s('s3').ledger === 2, '★㊾nr写真の無い取り込みで、受付台帳の枚数が 2 でなくなった（0＝写真なし） → ' + short(s('s3')));
      ok(r.prev3 && r.prev3.n >= 1, '★㊾nr写真の無い取り込みのあと、.hyb の「写真」欄を押しても写真が出ない → ' + short(r.prev3));
      ok(s('s4').pc >= 2 && s('s4').vis && /^📷 [2-9]/.test(s('s4').cell) && s('s4').click,
         '★㊾nr写真 G を取り込むと、.hyb の行の枚数がファイルの枚数（2）より減った（取り込んだ数だけにした） → ' + short(s('s4')));
      ok(r.prev4 && r.prev4.n >= 1, '㊾nr写真 G の取り込みのあと、.hyb の「写真」欄を押しても写真が出ない → ' + short(r.prev4));
      ok(s('s4').rowPh === 'G' && ['s1', 's2', 's3', 's4'].every(k => s(k).file === 'A,B'),
         '㊾nr行の写真 G・.hyb の写真 A・B が減った → ' + short(['s1', 's2', 's3', 's4'].map(k => k + ':' + s(k).rowPh + '/' + s(k).file)));
    }
    await ctx.close();
  }

  /* ===== 8回目の見直しの直し：暗号の戸別（.hyb）（㉕q〜㉕u）=====
     ★決まり★ 暗号の戸別を開いても、行を「ファイルから読む」（_slim）に替えない（開く前のまま）。替えると次に開いたとき、
     まだファイルに入っていない直し（画面で直した増幅器など。物件にはもう入っている）を、ファイルの古い中身で戻す。
     一覧の 📷・📸 写真の書き出し・🔄 一括再暗号化／📄 一括平文化は、行の封筒の写真が剥がした印なら、ファイルの暗号の部分（写真）を読み、
     行の封筒の暗号でない部分（直したところ）と合わせる。暗号の行が持つ写真（📥 で入れた・画面で足して戻った）は、開くときいつも出す。
     💾 上書き保存で画面の写真がファイルに入ったら、行にだけ持っていた写真は捨てて、次からはファイルを読む。 */
  {
  const HYB25 = `
    window.__hyb25 = async function(NO, opt){
      opt = opt || {};
      const FN = NO + '.hyb', PW = 'pw1234';
      const A = __jpeg(600, 450, 0.85, 151), B = __jpeg(640, 480, 0.85, 152), P = __jpeg(620, 460, 0.85, 153), G = __jpeg(560, 420, 0.85, 154);
      const nm = u => u === A ? 'A' : u === B ? 'B' : u === P ? 'P' : u === G ? 'G' : '?';
      const names = arr => (Array.isArray(arr) ? arr : []).filter(p => p && p.dataUri).map(p => nm(p.dataUri)).join(',');
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_cust_tel: '011-000-0000', chosho_status: 'in_progress',
                     work_type: 'uhf_new', amplifier: 'amp_3u43' };
      const env = await encryptHybrid(Object.assign({}, base, { chosho_photos: [{ id: 'hA', label: '写真A', dataUri: A }, { id: 'hB', label: '写真B', dataUri: B }] }), PW);
      const list = __mk('リスト', { [FN]: JSON.stringify(env, null, 2) }, {}, { resolve: true });
      const root = __mk('工事', {}, { 'リスト': list }, { resolve: true });
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const stop = () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } };
      if(opt.shared) await __openShared(__proj178(opt.shared, '暗号の物件', []));   // 共有ファイルの物件を開いておく（📁 は物件に取り込む）
      window.showDirectoryPicker = async () => root;
      setSessionPassword(PW);
      openListView(); stop();
      if(opt.src){                                                 // 📄 ファイル（ファイルの写しだけ。書き戻せない＝iPad など）
        const f = new File([JSON.stringify(env, null, 2)], FN, { type: 'application/octet-stream' });
        const oPick = pickFile; pickFile = (o3, cb) => { setTimeout(() => cb(o3 && o3.multiple ? [f] : f), 0); };
        try { listSelectFiles(); for(let i = 0; i < 100 && !_listRows.length; i++) await sleep(50); await sleep(200); }
        finally { pickFile = oPick; }
        stop();
      } else
      await listSelectFolder();                                    // 📁 フォルダ
      const h = { FN, PW, A, B, P, G, nm, names, list, root, sleep, stop };
      h.row = _listRows.filter(x => x && x.fileType === 'hybrid')[0];
      h.loaded = { rows: _listRows.length, slim: !!(h.row && h.row._slim) };
      await unlockListView({ silent: true });                      // 🔓 まとめて復号（覚えているパスワードで）
      h.look = () => ({ shown: names(STATE.photos), stripped: !!_editorPhotosStripped, banner: !!document.getElementById('photo-stripped-banner'),
                        amp: (document.getElementById('amplifier') || {}).value });
      h.back = async () => { openListView(); stop(); await sleep(300); if(opt.shared) await projSaveNow(); };
      h.open = async (o2) => {                                     // 一覧の行を押して開く（pw：覚えているパスワードを消して、聞かれて入れる）
        if(!document.body.classList.contains('list-view-open')){ openListView(); stop(); }
        await sleep(300);
        if(o2 && o2.pw){ clearSessionPassword('試験'); promptPassword = async () => { window.__asked = (window.__asked || 0) + 1; return PW; }; }
        const row = h.row, i = _listRows.indexOf(row);
        const tr = [...document.querySelectorAll('tbody tr[data-list-idx="' + i + '"]')].filter(t => t.offsetParent !== null)[0];
        if(tr) tr.click();
        for(let k = 0; k < 80 && document.body.classList.contains('list-view-open'); k++) await sleep(100);
        await sleep(300);
        return Object.assign({ click: !!tr, slim: !!row._slim, rowPh: names(row.data && row.data.chosho_photos), rowAmp: row.data && row.data.amplifier }, h.look());
      };
      h.preview = async () => {                                    // 📷 写真セルを押したのと同じ
        await showPhotoPreviewForRow(h.row);
        const body = document.getElementById('photo-prev-body');
        const imgs = body ? [...body.querySelectorAll('img')].map(im => nm(im.getAttribute('src'))).join(',') : '';
        const txt = body ? body.textContent.trim().slice(0, 30) : '';
        closePhotoPreview();
        return imgs || ('（' + txt + '）');
      };
      h.exportAll = async () => {                                  // 📸 写真の一括書き出し（書いた写真の数）
        const exp = __mk('書き出し', {}, {});
        window.showDirectoryPicker = async () => exp;
        try { await bulkExportPhotosToFolders(); } finally { window.showDirectoryPicker = async () => root; }
        let n = 0; Object.keys(exp.__subs).forEach(s => { n += Object.keys(exp.__subs[s].__files).length; });
        return n;
      };
      h.toPlain = async () => {                                    // 📄 一括平文化（.hyb の隣に .json を作れないので保存の窓に落ちる。その中身を見る）
        const blobs = [], oURL = URL.createObjectURL;
        URL.createObjectURL = b => { blobs.push(b); return oURL.call(URL, b); };
        try { await bulkConvertToPlain(); } finally { URL.createObjectURL = oURL; }
        const js = blobs.filter(b => b && b.type === 'application/json');
        if(!js.length) return { ids: '（書かない）' };
        try { const d = JSON.parse(await js[js.length - 1].text()); return { ids: names(d.chosho_photos), amp: d.amplifier, enc: !!d.encrypted_fields }; }
        catch(_){ return { ids: '（読めない）' }; }
      };
      h.fileAs = async pw => { try { const d = await decryptHybrid(JSON.parse(list.__files[FN]), pw || PW);
        return { ids: names(d.chosho_photos), tel: d.chosho_cust_tel, amp: d.amplifier }; } catch(_){ return { ids: '（ほどけない）' }; } };
      h.reenc = async pw => {                                      // 🔄 一括再暗号化（方式はそのまま・新しいパスワード。pw 無し＝パスワードもそのまま）
        document.getElementById('bulk-target').value = 'hybrid';
        document.getElementById('bulk-new-format').value = 'keep';
        document.getElementById('bulk-new-pw-src').value = pw ? 'manual' : 'keep';
        const m = document.getElementById('bulk-new-pw-manual'); m.disabled = false; m.value = pw || '';
        const w0 = list.__writes.length;
        await applyBulkReenc();
        return Object.assign({ wrote: list.__writes.length - w0 }, await h.fileAs(pw));
      };
      h.reencDl = async pw => {                                    // 🔄 一括再暗号化で、保存の窓に落ちた（ダウンロードの）中身を見る（📄 ファイルの行）
        const blobs = [], oURL = URL.createObjectURL;
        URL.createObjectURL = b => { blobs.push(b); return oURL.call(URL, b); };
        try { await h.reenc(pw); } finally { URL.createObjectURL = oURL; }
        const js = blobs.filter(b => b && b.type === 'application/json');
        if(!js.length) return { ids: '（書かない）' };
        try { const d = await decryptHybrid(JSON.parse(await js[js.length - 1].text()), pw || PW); return { ids: names(d.chosho_photos), amp: d.amplifier }; }
        catch(_){ return { ids: '（ほどけない）' }; }
      };
      h.ledgerDone = async () => {                                 // 受付台帳の「完了」に印を付ける（利用者と同じに押す）
        openListView(); stop(); setListMode('ledger'); await sleep(400);
        const uid = Object.keys(_ledgerShown).find(k => _ledgerShown[k] === h.row);
        const tr = uid ? document.querySelector('tr[data-uid="' + uid + '"]') : null;
        const cb = tr ? tr.querySelector('input[data-f="done"]') : null;
        const o = { found: !!cb };
        if(cb && !cb.disabled){ cb.click(); await sleep(300); }
        setListMode('list'); await sleep(200); stop();
        o.rowSt = h.row.data && h.row.data.chosho_status;
        return o;
      };
      h.diskCase = () => { if(!window.__disk) return null;         // 共有ファイル（物件）に入っているこの戸別の封筒
        const c = JSON.parse(window.__disk).cases.filter(c => c.payload && (((c.payload.plain || {}).chosho_mgmt_no === NO) || c.payload.chosho_mgmt_no === NO))[0];
        return c ? c.payload : null; };
      h.importG = async (extra) => {                               // 📥 現場取込（取り込み窓の「取り込む」まで。現場の写真 G。extra＝現場で入れたほかの欄）
        const genba = Object.assign({ chosho_mgmt_no: NO, _origin: 'genba', work_type: 'uhf_new', chosho_photos: [{ id: 'g1', label: '現場', dataUri: G }] }, extra || {});
        const jf = new File([JSON.stringify(genba)], NO + '.json', { type: 'application/json' });
        const oPick = pickFile, oa = window.alert, al = [];
        pickFile = (o3, cb) => { setTimeout(() => cb(o3 && o3.multiple ? [jf] : jf), 0); };
        window.alert = m => al.push(String(m));
        try {
          document.getElementById('btn-genba-import').onclick();
          for(let i = 0; i < 200; i++){ await sleep(50); const md = document.getElementById('gi-import'); if(md && md.offsetParent !== null) break; }
          document.getElementById('gi-import').click();
          for(let i = 0; i < 400 && !al.some(a => /現場データ取込 完了/.test(a)); i++) await sleep(50);
        } finally { pickFile = oPick; window.alert = oa; }
        return (al.filter(a => /現場データ取込 完了/.test(a))[0] || al.join(' | ')).slice(0, 160);
      };
      /* 💾 上書き保存を、利用者と同じにボタンを押して（押したときの行への取り込みも走る）。終わるまで待つ */
      h.clickSave = async () => {
        const b = document.getElementById('btn-save-overwrite');
        if(!b || b.disabled) return false;
        const org = b.onclick; let pr = null;
        b.onclick = function(e){ pr = org.call(this, e); return pr; };
        try { b.click(); if(pr) await pr; } finally { b.onclick = org; }
        await sleep(200);
        return !!pr;
      };
      h.diskAmp = () => { if(!opt.shared || !window.__disk) return null;   // 共有ファイル（物件）に入っている増幅器
        const c = JSON.parse(window.__disk).cases.filter(c => c.payload && (((c.payload.plain || {}).chosho_mgmt_no === NO) || c.payload.chosho_mgmt_no === NO))[0];
        const p = c && c.payload && (c.payload.plain || c.payload); return p ? p.amplifier : '（無い）'; };
      return h;
    };
  `;

  // ---- ㉕q 📁 の .hyb（写真 A・B・増幅器 3U）を 🔓 して開き、増幅器を 1U に直して一覧へ戻る（reopen：開き直して、何もせずに戻ってから）
  //   → 📷 写真セルのプレビュー・📸 写真の一括書き出し・📄 一括平文化・🔄 一括再暗号化（新しいパスワード）は、ファイルの写真 A・B を読む（飛ばさない）
  //   → 平文化・再暗号化で書いた中身は A・B・増幅器 1U（行で直したところを、ファイルの古い中身で戻さない）
  //   （前は行が写真を剥がした封筒のままで、📷 は「写真が登録されていません」、📸 は「鍵がなくスキップ」、
  //     🔄 は「写真未復元のため保全スキップ（元の.hybから開き直してください）」になり、開き直しても直らなかった）
  for(const mode of ['edit', 'reopen'].filter(m => want('㉕q' + m))){
    const L = '㉕q' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO);
      const { row } = h;
      const o = { loaded: h.loaded };
      o.open1 = await h.open();
      __setField('amplifier', 'amp_1u45');
      await h.back();                                              // 直したので行へ取り込む（行の封筒は写真を剥がした印のまま）
      o.afterBack1 = { slim: !!row._slim, amp: row.data.amplifier, envAmp: ((row.envelope || {}).plain || {}).amplifier };
      if(mode === 'reopen'){
        o.open2 = await h.open();                                  // 開き直す（見るだけ）→ 何もせずに戻る
        await h.back();
      }
      o.preview = await h.preview();
      o.exported = await h.exportAll();
      o.plain = await h.toPlain();
      o.reenc = await h.reenc('atarashii-99');
      o.rowAmp = row.data.amplifier;
      return o;
    }, { NO, mode });
    const al = alerts(said).map(a => a.replace(/\s+/g, ' '));
    console.log(L + '直して戻ったあとの 📷・📸・📄・🔄', short(r), short(al.map(a => a.slice(0, 60))));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.rows === 1 && r.loaded.slim && r.open1.click && r.open1.shown === 'A,B' && !r.open1.stripped && r.open1.amp === 'amp_3u43'
         && !r.afterBack1.slim && r.afterBack1.amp === 'amp_1u45' && r.afterBack1.envAmp === 'amp_1u45'
         && (mode !== 'reopen' || (r.open2.click && r.open2.shown === 'A,B' && r.open2.amp === 'amp_1u45')),
         L + '試験の前提: 📁 の .hyb を開いて増幅器を 1U に直して戻ると、行（封筒の暗号でない部分）が 1U' + (mode === 'reopen' ? '・開き直しても 1U' : '') + ' → ' + short(r));
      ok(r.preview === 'A,B', '★' + L + ' 直して戻ったあと、📷 にファイルの写真 A・B が出ない（行の封筒の、写真を剥がした印を読んだ） → ' + r.preview);
      ok(r.exported === 2 && !al.some(a => /鍵がなくスキップ/.test(a)),
         '★' + L + ' 直して戻ったあと、📸 写真の一括書き出しがこの戸別を飛ばした・枚数が違う → ' + r.exported + ' ' + short(al.filter(a => /書き出し/.test(a))));
      ok(r.plain.ids === 'A,B' && !r.plain.enc, '★' + L + ' 直して戻ったあと、📄 一括平文化がこの戸別の写真を書かない（飛ばした・写真が減った） → ' + short(r.plain));
      ok(r.plain.amp === 'amp_1u45', '★' + L + ' 📄 一括平文化で、直した増幅器 1U がファイルの古い 3U に戻った → ' + short(r.plain));
      ok(r.reenc.wrote === 1 && r.reenc.ids === 'A,B' && !al.some(a => /写真未復元のため保全スキップ/.test(a)),
         '★' + L + ' 直して戻ったあと、🔄 一括再暗号化がこの戸別を飛ばした（新しいパスワードにならない・写真が減った） → ' + short(r.reenc));
      ok(r.reenc.amp === 'amp_1u45' && r.reenc.tel === '011-000-0000' && r.rowAmp === 'amp_1u45',
         '★' + L + ' 🔄 一括再暗号化で、直した増幅器 1U がファイルの古い 3U に戻った（氏名・電話はファイルのまま） → ' + short(r.reenc) + ' 行=' + r.rowAmp);
    }
    await ctx.close();
  }

  // ---- ㉕r 🔓 した 📁 の .hyb（写真 A・B。開いていない）へ 📥 現場取込（写真 G）→ 行を押して開く → 💾 上書き保存 → .hyb は A・B・G
  //   ''：物件なし（戸別ファイルへ書けない）→ 行はまだファイルに無い現場の中身を持つので、行の封筒で開く（写真の出ていない画面に G・帯あり）。
  //       何もせずに戻ってもう一度開いても G → 💾 上書き保存はファイルの写真に足して書く（A・B・G）
  //   proj：共有ファイルの物件あり（戸別ファイルへ書けた）→ 行はファイルから読む・開くと写真の出ている画面に A・B・G（ファイルの写真＋行にだけある G）
  //   （前はファイルからほどいた A・B だけを出して、行にだけある G を行からも外し、G がどこにも残らなかった）
  for(const mode of ['', 'proj'].filter(m => want('㉕r' + m))){
    const L = '㉕r' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, mode === 'proj' ? { shared: 'pj25r' } : {});
      const { row } = h;
      const o = { loaded: h.loaded };
      o.importNote = await h.importG();                            // 📥 現場取込（開いていない戸別）
      o.afterImport = { slim: !!row._slim, rowPh: h.names(row.data && row.data.chosho_photos), file: (await h.fileAs()).ids };
      o.open1 = await h.open();
      await h.back();                                              // 何もせずに戻る
      o.back1 = { rowPh: h.names(row.data && row.data.chosho_photos) };
      o.open2 = await h.open();
      __setTel('090-2222-3333');
      o.press = (await __pressSave()).pressed;
      await h.sleep(200);
      o.file = await h.fileAs();
      return o;
    }, { NO, mode });
    console.log(L + '開いていない暗号の戸別へ 📥 してから開く', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.rows === 1 && r.loaded.slim && r.afterImport.rowPh === 'G' && r.afterImport.file === 'A,B' && r.open1.click
         && r.afterImport.slim === (mode === 'proj'),
         L + '試験の前提: 🔓 した .hyb の行へ 📥 すると、行に G・ファイルの写真は A・B のまま・' + (mode === 'proj' ? '書けたので行はファイルから読む' : '書けないので行の封筒で開く') + ' → ' + short(r));
      if(mode === 'proj'){
        ok(r.open1.shown === 'A,B,G' && !r.open1.stripped && !r.open1.banner,
           '★' + L + '📥 で入れた写真 G が、開くと画面に出ない（ファイルの写真だけ）・写真の出ている画面にならない → ' + short(r.open1));
        ok(r.back1.rowPh === 'G' && r.open2.shown === 'A,B,G' && !r.open2.stripped,
           '★' + L + '何もせずに戻ってもう一度開くと、📥 で入れた写真 G が消えた（開いたとき行から外した） → ' + short(r.back1) + ' ' + short(r.open2));
      } else {
        ok(r.open1.shown === 'G' && r.open1.stripped && r.open1.banner && r.open1.rowPh === 'G',
           '★' + L + '📥 で入れた写真 G が、開くと画面に出ない・行から消えた（または写真の出ていない画面の印・帯が無い） → ' + short(r.open1));
        ok(r.back1.rowPh === 'G' && r.open2.shown === 'G' && r.open2.stripped,
           '★' + L + '何もせずに戻ってもう一度開くと、📥 で入れた写真 G が消えた → ' + short(r.back1) + ' ' + short(r.open2));
      }
      ok(r.press && r.file.ids === 'A,B,G' && r.file.tel === '090-2222-3333',
         '★' + L + '💾 上書き保存で .hyb が A・B・G にならない（📥 で入れた写真が入らない・元の写真が減った） → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ㉕s 💾 上書き保存のあとは、行にだけ持っていた写真を捨てて、次からファイルを読む
  //   📁 の .hyb（A・B）を開いて P を足して戻り、開き直す（写真の出ていない画面に A・B・P）→ 💾 上書き保存（A・B・P）→ 何もせずに戻る
  //   → 行は写真を持たず、ファイルから読む（📷 は A・B・P）→ 開き直すと写真の出ている画面に A・B・P → P を消して 💾 上書き保存（A・B）
  //   → 何もせずに戻って開き直しても P は戻らない（前は行に残っていた P が、開き直すと戻ってきた）
  //   ''：「💾」の働きだけ（戻るとき画面を行へ取り込まない）　click：利用者と同じにボタンを押す・× で消す（押すと画面を行へ取り込む）
  for(const mode of ['', 'click'].filter(m => want('㉕s' + m))){
    const L = '㉕s' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO);
      const { row, P } = h;
      const o = { loaded: h.loaded };
      const save = async () => (mode === 'click') ? await h.clickSave() : (await __pressSave()).pressed;
      const rowNow = async () => ({ slim: !!row._slim, rowPh: h.names(row.data && row.data.chosho_photos), preview: await h.preview() });
      o.open1 = await h.open();
      o.added = !!(await __addPhoto(P, 'p.jpg'));
      await h.back();                                              // 足したので行へ取り込む
      o.open2 = await h.open();                                    // 写真の出ていない画面（A・B・P）
      o.save1 = await save();
      o.file1 = (await h.fileAs()).ids;
      o.dirty1 = !!_editorDirty;                                   // 戻るとき画面を行へ取り込むか
      await h.back();                                              // 何もせずに戻る
      o.afterSave1 = await rowNow();
      o.open3 = await h.open();                                    // ファイルを読んだ、写真の出ている画面（A・B・P）
      const i = (STATE.photos || []).findIndex(p => p && p.dataUri === P);
      if(mode === 'click'){                                        // × を押して P を消す（確かめの窓は OK）
        const del = document.querySelector('[data-photo-del="' + i + '"]');
        o.delBtn = !!del;
        if(del) del.click();
        await h.sleep(200);
      } else { STATE.photos = STATE.photos.filter(p => !(p && p.dataUri === P)); renderPhotoInputs(); }
      o.afterDel = h.look().shown;
      o.save2 = await save();
      o.file2 = (await h.fileAs()).ids;
      o.dirty2 = !!_editorDirty;
      await h.back();                                              // 何もせずに戻る
      o.afterSave2 = await rowNow();
      o.open4 = await h.open();
      return o;
    }, { NO, mode });
    console.log(L + '上書き保存のあと行の写真を捨てる', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.slim && r.open1.click && r.open1.shown === 'A,B' && !r.open1.stripped && r.added && r.open2.shown === 'A,B,P' && r.open2.stripped,
         L + '試験の前提: 📁 の .hyb を開いて P を足して戻り、開き直すと写真の出ていない画面に A・B・P → ' + short(r));
      if(mode === '') ok(!r.dirty1 && !r.dirty2, L + '試験の前提: 一覧へ戻るとき、画面を行へ取り込まない（直していない） → ' + r.dirty1 + ' ' + r.dirty2);
      ok(r.save1 && r.file1 === 'A,B,P', L + '試験の前提: 写真の出ていない画面から 💾 上書き保存すると .hyb は A・B・P → ' + r.file1);
      ok(r.afterSave1.slim && r.afterSave1.rowPh === '' && r.afterSave1.preview === 'A,B,P',
         '★' + L + ' 💾 上書き保存して戻ったあと、行が行にだけ持っていた写真を捨てない・ファイルから読む形でない（📷 がファイルの A・B・P でない） → ' + short(r.afterSave1));
      ok(r.open3.shown === 'A,B,P' && !r.open3.stripped && !r.open3.banner,
         '★' + L + ' 💾 上書き保存のあと開き直すと、ファイルを読んだ写真の出ている画面に A・B・P が出ない → ' + short(r.open3));
      ok(r.afterDel === 'A,B' && (mode !== 'click' || r.delBtn) && r.save2 && r.file2 === 'A,B',
         '★' + L + ' 写真の出ている画面で P を消して 💾 上書き保存しても、.hyb から P が消えない → ' + short(r));
      ok(r.afterSave2.slim && r.afterSave2.rowPh === '' && r.afterSave2.preview === 'A,B',
         '★' + L + ' P を消して 💾 上書き保存して戻ったあと、行に P が残った・📷 がファイルの A・B でない → ' + short(r.afterSave2));
      ok(r.open4.shown === 'A,B' && !r.open4.stripped && !r.open4.banner,
         '★' + L + ' 画面で消して上書き保存した P が、開き直すと戻ってきた（行に残っていた）・写真の出ている画面にならない → ' + short(r.open4));
    }
    await ctx.close();
  }

  // ---- ㉕t 📁 の .hyb（A・B・増幅器 3U）を開いて 1U に直して戻る → 開く（見るだけ）→ 戻る → 開く → 画面も行も 1U → 💾 上書き保存で .hyb も 1U
  //   pw：2回目からはパスワードを聞かれて開く（覚えているパスワードが無い）
  //   proj：物件（共有ファイル）を開いている → 3回目に開いて備考を直して戻っても、共有ファイルは 1U のまま・4回目に開いても 1U
  //   （前は開くたびに行を「ファイルから読む」に替え、3回目にファイルの古い 3U で画面・行・物件・.hyb を戻していた）
  for(const mode of ['', 'pw', 'proj'].filter(m => want('㉕t' + m))){
    const L = '㉕t' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, { shared: mode === 'proj' ? 'pj25t' : '' });
      const { row } = h;
      const o = { loaded: h.loaded, proj: !!_currentProject };
      o.open1 = await h.open();
      __setField('amplifier', 'amp_1u45');
      await h.back();                                              // 直したので行へ取り込む（物件にも入る）
      o.back1 = { slim: !!row._slim, amp: row.data.amplifier, disk: h.diskAmp() };
      o.open2 = await h.open({ pw: mode === 'pw' });               // 見るだけ
      await h.back();
      o.back2 = { amp: row.data.amplifier, disk: h.diskAmp() };
      o.open3 = await h.open({ pw: mode === 'pw' });
      o.asked = window.__asked || 0;
      if(mode === 'proj'){
        __setField('chosho_note', '見ただけのあと備考');           // 3回目に開いたところで、ほかの欄を直して戻る
        await h.back();
        o.back3 = { amp: row.data.amplifier, disk: h.diskAmp() };
        o.open4 = await h.open();
      }
      o.press = (await __pressSave()).pressed;
      await h.sleep(200);
      o.file = await h.fileAs();
      return o;
    }, { NO, mode });
    console.log(L + '直して戻った暗号の戸別を何度か開く', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.rows === 1 && r.loaded.slim && r.open1.click && r.open1.amp === 'amp_3u43' && r.open1.shown === 'A,B' && r.back1.amp === 'amp_1u45'
         && (mode !== 'proj' || (r.proj && r.back1.disk === 'amp_1u45')) && (mode !== 'pw' || r.asked === 2),
         L + '試験の前提: 📁 の .hyb を開いて増幅器を 1U に直して戻ると、行' + (mode === 'proj' ? 'と共有ファイル' : '') + 'が 1U'
           + (mode === 'pw' ? '・2回目と3回目はパスワードを聞かれる' : '') + ' → ' + short(r));
      ok(r.open2.amp === 'amp_1u45' && r.back2.amp === 'amp_1u45', L + ' 直して戻ったあと開き直すと、画面・行が 1U でない → ' + short(r.open2));
      ok(r.open3.amp === 'amp_1u45' && r.open3.rowAmp === 'amp_1u45' && r.open3.shown === 'A,B',
         '★' + L + ' 見るだけで戻ってもう一度開くと、まだファイルに無い直し（増幅器 1U）がファイルの古い 3U に戻った（行をファイルから読む形に替えた） → ' + short(r.open3));
      if(mode === 'proj')
        ok(r.back2.disk === 'amp_1u45' && r.back3.disk === 'amp_1u45' && r.back3.amp === 'amp_1u45' && r.open4.amp === 'amp_1u45',
           '★' + L + ' 物件（共有ファイル）に入っていた増幅器 1U が、開き直して直して戻ると 3U に戻った → ' + short(r.back2) + ' ' + short(r.back3) + ' ' + short(r.open4));
      ok(r.press && r.file.amp === 'amp_1u45' && r.file.ids === 'A,B',
         '★' + L + ' 💾 上書き保存で .hyb の増幅器が 1U にならない（ファイルの古い中身で書いた）・写真が減った → ' + short(r.file));
    }
    await ctx.close();
  }

  // ---- ㉕u 📥 で暗号の戸別に入れた写真 G が、写真の出ていない画面で開いても消えない
  //   A：📁 で読んで物件を作る → 物件を開き直す（行は物件の、写真を剥がした封筒）→ 🔓 →「💾 戸別ファイルへ反映」でファイルが付く
  //      → 📥 G → 開く → 画面に G（帯あり）・行に G → 戻ってもう一度開いても G → 💾 上書き保存 → .hyb は A・B・G
  //   U：📁 の .hyb → 🔓 → 📥 G（物件なし＝書けない）→ 行の封筒で開く（ファイルが読めなくても開ける・読まない）→ 画面に G（帯あり）・行に G
  //      → 戻って次に開いても G → 💾 上書き保存（読めるようになってから）→ .hyb は A・B・G
  //   （前は行の写真を当てにしてよい印が無いと出さず、行からも外して、G がどこにも残らなかった。📥 の知らせは「戸別を開いて保存で書けます」）
  for(const mode of ['A', 'U'].filter(m => want('㉕u' + m))){
    const L = '㉕u' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO);
      const o = { loaded: h.loaded };
      if(mode === 'A'){
        const snap = buildProjectSnapshot({ id: 'pj25u', name: '暗号の物件' });   // この端末で保存した物件の中身そのもの
        const ef = (((snap.cases[0] || {}).payload || {}).encrypted_fields || {}).chosho_photos;
        o.snapStripped = !!(ef && ef.stripped);
        await __openProj(__proj178('pj25u', '暗号の物件', snap.cases.map(c => ({ caseId: c.caseId, file: c.file, lastModified: c.lastModified, payload: c.payload }))));
        openListView(); h.stop();
        await unlockListView({ silent: true });                    // 🔓
        await lgwbButton();                                        // 受付台帳「💾 戸別ファイルへ反映」（フォルダを選ぶ → 結び付ける）
        h.row = _listRows[0];
        o.linked = { rows: _listRows.length, fh: !!h.row.fileHandle, slim: !!h.row._slim, known: !!h.row._photosKnown };
      }
      const row = h.row;
      o.importNote = await h.importG();
      o.afterImport = { rowPh: h.names(row.data && row.data.chosho_photos), known: !!row._photosKnown, file: (await h.fileAs()).ids };
      if(mode === 'U') h.list.__unreadable[h.FN] = 1;              // 開くときファイルを読めない（同期の途中など）
      o.open1 = await h.open();
      if(mode === 'U'){ o.notRead = h.list.__unreadable[h.FN] === 1; h.list.__unreadable[h.FN] = 0; }   // 開くときファイルを読まなかった → 読めるようにする
      await h.back();                                              // 何もせずに戻る
      o.back1 = { rowPh: h.names(row.data && row.data.chosho_photos) };
      o.open2 = await h.open();
      __setTel('090-2222-3333');
      o.press = (await __pressSave()).pressed;
      await h.sleep(200);
      o.file = await h.fileAs();
      return o;
    }, { NO, mode });
    console.log(L + '📥 で入れた写真を写真の出ていない画面で開く', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.afterImport.rowPh === 'G' && !r.afterImport.known && r.afterImport.file === 'A,B' && r.open1.click
         && (mode === 'A' ? (r.snapStripped && r.linked.rows === 1 && r.linked.fh && !r.linked.slim && !r.linked.known) : r.loaded.slim),
         L + '試験の前提: ' + (mode === 'A' ? '物件の暗号の行（写真を剥がした封筒）に 💾 反映でファイルが付き、' : '📁 の .hyb の行へ、')
           + '📥 すると行に G（当てにしてよい印なし）・ファイルは A・B のまま → ' + short(r));
      ok(r.open1.shown === 'G' && r.open1.stripped && r.open1.banner && r.open1.rowPh === 'G',
         '★' + L + ' 写真の出ていない画面で開くと、📥 で入れた写真 G が画面に出ない・行から消えた → ' + short(r.open1));
      if(mode === 'A')
        ok(r.back1.rowPh === 'G' && /G/.test(r.open2.shown), '★' + L + ' 何もせずに戻ってもう一度開くと、📥 で入れた写真 G が消えた → ' + short(r.back1) + ' ' + short(r.open2));
      else
        ok(r.notRead && r.back1.rowPh === 'G' && r.open2.shown === 'G' && r.open2.stripped,
           '★' + L + ' 書けなかった 📥 のあと、開くときファイルを読んだ（行の封筒で開かない）・もう一度開くと G が消えた → ' + short(r.notRead) + ' ' + short(r.back1) + ' ' + short(r.open2));
      ok(r.press && r.file.ids === 'A,B,G' && r.file.tel === '090-2222-3333',
         '★' + L + ' 💾 上書き保存で .hyb が A・B・G にならない（📥 で入れた写真 G が入らない・元の写真が減った） → ' + short(r.file));
    }
    await ctx.close();
  }
  // ---- ㉕v 📁 の .hyb（A・B・増幅器 3U）を開いて 1U に直して戻る → 🔄 一括再暗号化（新しいパスワード）
  //   → 行の封筒もファイルと同じ鍵の元（salt）になる → 新しいパスワードで開いて電話を直し 💾 上書き保存 → .hyb は A・B・1U・電話
  //   （前は行の封筒が古い鍵のまま残り、開くと古い封筒で開いて 💾 が「写真を取り出せませんでした」で書けず、物件にも古い鍵が残った）
  if(want('㉕v')){
    const { ctx, page, said } = await openMain('㉕v');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO);
      const row = h.row, NEWPW = 'atarashii-99';
      const o = {};
      o.open1 = await h.open();
      __setField('amplifier', 'amp_1u45');
      await h.back();                                              // 直したので行へ取り込む（行は写真を剥がした封筒のまま）
      o.reenc = await h.reenc(NEWPW);
      const f = JSON.parse(h.list.__files[h.FN]);
      o.saltSame = !!(row.envelope && f && row.envelope.salt === f.salt);
      setSessionPassword(NEWPW);
      promptPassword = async () => NEWPW;                          // 聞かれたら新しいパスワード
      o.open2 = await h.open();
      __setTel('090-2222-3333');
      const w0 = h.list.__writes.length;
      o.press = (await __pressSave()).pressed;
      await h.sleep(200);
      o.wrote = h.list.__writes.length - w0;
      o.file = await h.fileAs(NEWPW);
      return o;
    }, { NO });
    const al = alerts(said);
    console.log('㉕v直して戻ったあとの 🔄 一括再暗号化（新しいパスワード）', short(r), short(al.slice(-2).map(a => a.slice(0, 50))));
    ok(!r.error, '㉕v止まった → ' + r.error);
    if(!r.error){
      ok(r.open1.click && r.open1.shown === 'A,B' && r.reenc.wrote === 1 && r.reenc.ids === 'A,B' && r.reenc.amp === 'amp_1u45',
         '㉕v試験の前提: 直して戻ったあとの 🔄 一括再暗号化で、.hyb が新しいパスワードの A・B・1U になる → ' + short(r));
      ok(r.saltSame, '★㉕v 🔄 一括再暗号化のあと、行の封筒が古い鍵のまま（開くと古い封筒で開き、💾 上書き保存が書けない・物件に古い鍵が残る） → ' + short(r));
      ok(r.press && r.wrote === 1 && r.file.ids === 'A,B' && r.file.tel === '090-2222-3333' && r.file.amp === 'amp_1u45'
         && !al.some(a => /取り出せませんでした/.test(a)),
         '★㉕v 🔄 のあと新しいパスワードで開いて 💾 上書き保存すると書けない・写真が減った・直しが入らない → ' + short(r) + ' ' + short(al.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㉕w 📁 の .hyb（A・B・増幅器 3U）を開いて 1U に直して戻る → ほかのPCが .hyb を書き替えた（増幅器 1U-BC・写真 A・B・C。鍵の元が新しい）
  //   → 🔄 一括再暗号化（新しいパスワード）はこの戸別を飛ばし、「ファイルが、この一覧を読んだあとで書き替えられていた」と知らせる
  //     （「開いて 💾 上書き保存」は勧めない：開くと一覧の古い中身で開き、💾 でほかのPCの直しを消す。📁 フォルダで読み直してもらう）
  //   → .hyb はほかのPCが書いたまま（前のパスワードで開ける・1U-BC・A・B・C）。行の古い中身（1U）で戻さない
  if(want('㉕w')){
    const { ctx, page, said } = await openMain('㉕w');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO);
      const o = {};
      o.open1 = await h.open();
      __setField('amplifier', 'amp_1u45');
      await h.back();
      const d = await decryptHybrid(JSON.parse(h.list.__files[h.FN]), h.PW);   // ほかのPCが書き替えた（同じパスワード・鍵の元は新しい）
      d.amplifier = 'amp_1ubc45';
      d.chosho_photos = (d.chosho_photos || []).concat([{ id: 'hC', label: '写真C', dataUri: __jpeg(580, 430, 0.85, 155) }]);
      h.list.__files[h.FN] = JSON.stringify(await encryptHybrid(d, h.PW), null, 2);
      const before = h.list.__files[h.FN];
      o.reenc = await h.reenc('atarashii-99');
      o.same = h.list.__files[h.FN] === before;
      const fd = await decryptHybrid(JSON.parse(h.list.__files[h.FN]), h.PW);
      o.file = { n: (fd.chosho_photos || []).filter(p => p && p.dataUri).length, amp: fd.amplifier };
      return o;
    }, { NO });
    const al = alerts(said).map(a => a.replace(/\s+/g, ' '));
    console.log('㉕wほかのPCが書き替えた .hyb の 🔄 一括再暗号化', short(r), short(al.slice(-1).map(a => a.slice(0, 80))));
    ok(!r.error, '㉕w止まった → ' + r.error);
    if(!r.error){
      ok(r.open1.click && r.open1.shown === 'A,B', '㉕w試験の前提: 開いて A・B が出る → ' + short(r.open1));
      ok(r.reenc.wrote === 0 && r.same && r.file.amp === 'amp_1ubc45' && r.file.n === 3,
         '★㉕w ほかのPCが書き替えた .hyb を、🔄 一括再暗号化が行の古い中身（増幅器 1U）で書き替えた → ' + short(r));
      ok(al.some(a => /ファイルが、この一覧を読んだあとで書き替えられていた戸別: 1 件/.test(a) && /📁 フォルダ」で読み直して/.test(a) && !/💾 上書き保存/.test(a)),
         '★㉕w 飛ばしたことを知らせない・「ファイルがあとで書き替えられていた」と分けて言わない・「💾 上書き保存してから」と勧めた（ほかのPCの直しが消える） → ' + short(al.slice(-1)));
    }
    await ctx.close();
  }

  // ---- ㉕x 🔓 した 📁 の .hyb（増幅器 3U）へ 📥 現場取込（増幅器 1U-BC・写真 G）→ 開くと 1U-BC（現場の機器）→ 💾 上書き保存で .hyb も 1U-BC
  //   proj：共有ファイルの物件を開いているとき、📥 のあとの物件の保存で、物件（共有ファイル）にも 1U-BC が入る（開かなくても）
  //   （前は行の中身だけが替わり、封筒の暗号でない部分は古いままで、開くと 3U に戻り、💾 で 3U を書き、物件にも 3U が入っていた）
  for(const mode of ['', 'proj'].filter(m => want('㉕x' + m))){
    const L = '㉕x' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, mode === 'proj' ? { shared: 'pj25x' } : {});
      const row = h.row;
      const o = {};
      o.importNote = await h.importG({ amplifier: 'amp_1ubc45' });
      o.afterImport = { rowAmp: row.data && row.data.amplifier, envAmp: ((row.envelope || {}).plain || {}).amplifier,
                        envName: ((row.envelope || {}).plain || {}).chosho_cust_name };
      if(mode === 'proj'){ h.stop(); await projSaveNow(); o.diskAmp = h.diskAmp(); }
      o.open1 = await h.open();
      __setTel('090-2222-3333');
      o.press = (await __pressSave()).pressed;
      await h.sleep(200);
      o.file = await h.fileAs();
      return o;
    }, { NO, mode });
    console.log(L + '暗号の戸別へ 📥 した現場の増幅器', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.afterImport.rowAmp === 'amp_1ubc45' && r.open1.click && r.press,
         L + '試験の前提: 📥 で行の増幅器が現場の 1U-BC になる・開いて保存できる → ' + short(r));
      ok(r.afterImport.envAmp === 'amp_1ubc45' && r.afterImport.envName === undefined,
         '★' + L + ' 📥 の現場の増幅器が、封筒の暗号でない部分に入らない（または氏名が暗号でない部分に入った） → ' + short(r.afterImport));
      ok(r.open1.amp === 'amp_1ubc45', '★' + L + ' 📥 のあと開くと、現場の増幅器 1U-BC が古い 3U に戻った → ' + short(r.open1));
      ok(r.file.amp === 'amp_1ubc45' && /G/.test(r.file.ids) && /A/.test(r.file.ids),
         '★' + L + ' 💾 上書き保存で .hyb に現場の増幅器が入らない（古い 3U を書いた）・写真が減った → ' + short(r.file));
      if(mode === 'proj')
        ok(r.diskAmp === 'amp_1ubc45', '★' + L + ' 📥 のあとの物件の保存で、物件（共有ファイル）に古い 3U が入った → ' + short(r.diskAmp));
    }
    await ctx.close();
  }

  // ---- ㉕y 共有ファイルの物件で 📁（物件に取り込む）した .hyb（ファイルから読む行）に、受付台帳で「完了」の印 → 物件の保存
  //   → 🔄 一括再暗号化（keep：パスワードそのまま　newpw：新しいパスワード）→ 物件の保存 → 物件（共有ファイル）の「完了」が残る・物件の封筒も新しい鍵
  //   （前は行の封筒をファイルの古い中身（着工前）で置き換え、.hyb に入らない受付台帳の「完了」が物件から消えた）
  for(const mode of ['keep', 'newpw'].filter(m => want('㉕y' + m))){
    const L = '㉕y' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, { shared: 'pj25y' });
      const NEWPW = 'atarashii-99';
      const o = { loaded: h.loaded };
      o.done = await h.ledgerDone();
      h.stop(); await projSaveNow();
      o.diskBefore = ((h.diskCase() || {}).plain || {}).chosho_status;
      o.reenc = await h.reenc(mode === 'newpw' ? NEWPW : null);
      h.stop(); await projSaveNow();
      const pl = h.diskCase() || {};
      o.diskAfter = { st: (pl.plain || {}).chosho_status, saltSame: pl.salt === JSON.parse(h.list.__files[h.FN]).salt };
      try { o.diskName = (await decryptHybrid(pl, mode === 'newpw' ? NEWPW : h.PW)).chosho_cust_name; } catch(_){ o.diskName = '（ほどけない）'; }
      o.rowSt = h.row.data && h.row.data.chosho_status;
      return o;
    }, { NO, mode });
    console.log(L + '受付台帳の「完了」のあとの 🔄 一括再暗号化', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.slim && r.done.found && r.done.rowSt === 'completed' && r.diskBefore === 'completed' && r.reenc.wrote === 1 && r.reenc.ids === 'A,B',
         L + '試験の前提: ファイルから読む .hyb に受付台帳で「完了」→ 物件に「完了」・🔄 で .hyb を A・B で書く → ' + short(r));
      ok(r.diskAfter.st === 'completed' && r.rowSt === 'completed',
         '★' + L + ' 🔄 一括再暗号化のあと、物件（共有ファイル）から受付台帳の「完了」が消えた（行の封筒をファイルの古い中身にした） → ' + short(r));
      ok(r.diskAfter.saltSame && r.diskName === '暗号 様',
         '★' + L + ' 🔄 一括再暗号化のあと、物件の封筒が新しい鍵にならない（新しいパスワードでほどけない） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉕z 共有ファイルの物件で 📁（物件に取り込む）した .hyb → 物件の保存 → ほかのPCが物件で受付台帳の「完了」を付けて保存（この端末はまだ取り込んでいない）
  //   → この端末で 🔄 一括再暗号化（パスワードそのまま）→ 物件の保存 → 物件（共有ファイル）の「完了」が残る（ほかのPCの直しを、この端末の古い写しで消さない）
  //   （前は 🔄 で書いた戸別を「この端末が直した戸別」にしていたので、物件の保存のときこの端末の古い写し（着工前）が勝ち、「完了」が消えた）
  if(want('㉕z')){
    const { ctx, page, said } = await openMain('㉕z');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO, { shared: 'pj25z' });
      const o = { loaded: h.loaded };
      h.stop(); await projSaveNow();                               // 物件（共有ファイル）にこの戸別が入る
      __otherDeviceSaves(null, other => {                          // ほかのPC：受付台帳で「完了」
        other.cases.forEach(c => { if(c && c.payload && (c.payload.plain || {}).chosho_mgmt_no === NO)
          c.payload = Object.assign({}, c.payload, { plain: Object.assign({}, c.payload.plain, { chosho_status: 'completed' }) }); });
      });
      o.diskBefore = ((h.diskCase() || {}).plain || {}).chosho_status;
      o.reenc = await h.reenc(null);
      h.stop(); await projSaveNow();
      o.diskAfter = ((h.diskCase() || {}).plain || {}).chosho_status;
      return o;
    }, { NO });
    console.log('㉕zほかのPCが物件で付けた「完了」と 🔄 一括再暗号化', short(r));
    ok(!r.error, '㉕z止まった → ' + r.error);
    if(!r.error){
      ok(r.diskBefore === 'completed' && r.reenc.wrote === 1 && r.reenc.ids === 'A,B',
         '㉕z試験の前提: ほかのPCの「完了」が物件にある・🔄 で .hyb を A・B で書く → ' + short(r));
      ok(r.diskAfter === 'completed',
         '★㉕z 🔄 一括再暗号化のあとの物件の保存で、ほかのPCが付けた「完了」を、この端末の古い写しで消した → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉕yS 共有ファイルの物件で 📁（物件に取り込む）した .hyb（ファイルから読む行）→ 受付台帳で「完了」→ 物件の保存
  //   → ほかのPCが物件なしで .hyb を書き替えた（増幅器 1U・鍵の元が新しい）→ この端末で 🔄 一括再暗号化（パスワードそのまま）→ 物件の保存
  //   → 物件の封筒がファイルと同じ鍵の元なら、中身もいまのファイルの 1U（受付台帳の「完了」も残る）
  //   （前は行の古い中身 3U に新しい鍵の元を付けたので、あとの 💾 物件に保存 が、ほかのPCの 1U を古い 3U で戻した）
  if(want('㉕yS')){
    const { ctx, page, said } = await openMain('㉕yS');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO, { shared: 'pj25yS' });
      const o = { loaded: h.loaded };
      o.done = await h.ledgerDone();
      h.stop(); await projSaveNow();
      const d = await decryptHybrid(JSON.parse(h.list.__files[h.FN]), h.PW);   // ほかのPC：物件なしで 💾 上書き保存（新しい鍵の元）
      d.amplifier = 'amp_1u45';
      h.list.__files[h.FN] = JSON.stringify(await encryptHybrid(d, h.PW), null, 2);
      o.reenc = await h.reenc(null);
      h.stop(); await projSaveNow();
      const pl = h.diskCase() || {};
      o.disk = { amp: (pl.plain || {}).amplifier, st: (pl.plain || {}).chosho_status, saltSame: pl.salt === JSON.parse(h.list.__files[h.FN]).salt };
      return o;
    }, { NO });
    console.log('㉕ySほかのPCが書き替えた .hyb の 🔄 と物件の封筒', short(r));
    ok(!r.error, '㉕yS止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.slim && r.done.rowSt === 'completed' && r.reenc.wrote === 1 && r.reenc.amp === 'amp_1u45' && r.reenc.ids === 'A,B',
         '㉕yS試験の前提: ファイルから読む行の 🔄 で、.hyb はほかのPCの 1U のまま A・B で書かれる → ' + short(r));
      ok(!(r.disk.saltSame && r.disk.amp !== 'amp_1u45'),
         '★㉕yS 🔄 のあと物件の封筒が、ファイルと同じ鍵の元なのに古い中身（3U）（あとの 💾 物件に保存 が、ほかのPCの 1U を戻す） → ' + short(r.disk));
      ok(r.disk.saltSame && r.disk.amp === 'amp_1u45' && r.disk.st === 'completed',
         '★㉕yS 🔄 のあと物件の封筒が、いまのファイルの中身（1U）・受付台帳の「完了」・新しい鍵にならない → ' + short(r.disk));
    }
    await ctx.close();
  }

  // ---- ㉕yL 共有ファイルの物件で 📁（物件に取り込む）した .hyb（ファイルから読む行）→ 物件の保存（この端末は受付台帳を直していない）
  //   → ほかのPCが物件なしで .hyb を書き替えた（st：状態を「完了」に　note：備考を書いた。鍵の元が新しい）→ この端末で 🔄（パスワードそのまま）→ 物件の保存
  //   → 物件の封筒に、ほかのPCの「完了」（備考）が入る（この端末の古い写しの受付台帳の欄をかぶせない）
  //   （前は、この端末が直していない受付台帳の欄まで古い写しでかぶせ、ファイルと同じ鍵の元で物件に入れたので、
  //     あとの 💾 物件に保存 が、ほかのPCの「完了」・備考を戻した）
  for(const mode of ['st', 'note'].filter(m => want('㉕yL' + m))){
    const L = '㉕yL' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, { shared: 'pj25yL' });
      const o = { loaded: h.loaded, lgEdited: !!h.row._lgEdited };
      h.stop(); await projSaveNow();
      const d = await decryptHybrid(JSON.parse(h.list.__files[h.FN]), h.PW);   // ほかのPC：物件なしで 💾 上書き保存（新しい鍵の元）
      if(mode === 'st') d.chosho_status = 'completed'; else d.chosho_note = '現場：裏口から';
      h.list.__files[h.FN] = JSON.stringify(await encryptHybrid(d, h.PW), null, 2);
      o.reenc = await h.reenc(null);
      h.stop(); await projSaveNow();
      const pl = h.diskCase() || {};
      o.disk = { st: (pl.plain || {}).chosho_status, note: (pl.plain || {}).chosho_note, saltSame: pl.salt === JSON.parse(h.list.__files[h.FN]).salt };
      const fd = await decryptHybrid(JSON.parse(h.list.__files[h.FN]), h.PW);
      o.file = { st: fd.chosho_status, note: fd.chosho_note };
      return o;
    }, { NO, mode });
    console.log(L + 'ほかのPCがファイルに入れた受付台帳の欄と 🔄', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      const want1 = mode === 'st' ? (r.disk.st === 'completed') : (r.disk.note === '現場：裏口から');
      ok(r.loaded.slim && !r.lgEdited && r.reenc.wrote === 1 && (mode === 'st' ? r.file.st === 'completed' : r.file.note === '現場：裏口から'),
         L + '試験の前提: この端末は受付台帳を直していない・🔄 で .hyb はほかのPCの中身のまま → ' + short(r));
      ok(!(r.disk.saltSame && !want1),
         '★' + L + ' 🔄 のあと物件の封筒が、ファイルと同じ鍵の元なのに、この端末の古い写しの受付台帳の欄（ほかのPCの' + (mode === 'st' ? '「完了」' : '備考') + 'が消える） → ' + short(r.disk));
    }
    await ctx.close();
  }

  // ---- ㉕yM 共有ファイルの物件に、受付台帳で作った行（工事日程予定 10-22）→ 受付台帳で「完了」→ 物件の保存
  //   → 📁（物件に取り込む）で同じ管理番号の .hyb（受付済・10-20・写真 A・B）→ 重なりの窓で「📒 台帳を優先」→「まとめて復号しますか？」は キャンセル
  //   → 🔄 一括再暗号化（パスワードは聞かれて入れる）→ 物件の保存 → 物件（共有ファイル）は「完了」・10-22 のまま
  //   （前は台帳の値を入れた .hyb の行に「まだ戸別ファイルに入っていない」印を付けず、🔄 で物件の封筒をファイルの中身（受付済・10-20）にした）
  if(want('㉕yM')){
    const { ctx, page, said } = await openMain('㉕yM');
    const r = await run(page, async ({ NO }) => {
      const PW = 'pw-vm-1', FN = NO + '.hyb';
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const stop = () => { if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; } };
      const X = () => _listRows.find(x => x && x.data && x.data.chosho_mgmt_no === NO);
      const diskX = () => { const c = JSON.parse(window.__disk).cases.find(c => c.payload && ((c.payload.plain || c.payload).chosho_mgmt_no === NO));
        const pl = c ? (c.payload.plain || c.payload) : {}; return { hyb: !!(c && c.payload.plain), st: pl.chosho_status, date: pl.chosho_date }; };
      const o = {};
      clearSessionPassword('試験');
      await __openShared(__proj178('pj25yM', '工事V', [{ caseId: 'cM1', file: 'manual:x', lastModified: 0,
        payload: { chosho_mgmt_no: NO, chosho_cust_name: '戊 様', chosho_status: 'in_progress', chosho_date: '2026-10-22', _manual: true, _origin: 'manual' } }]));
      stop();
      openListView(); stop(); setListMode('ledger'); await sleep(400);              // 受付台帳で「完了」
      { const uid = Object.keys(_ledgerShown).find(k => _ledgerShown[k] === X());
        const tr = uid ? document.querySelector('tr[data-uid="' + uid + '"]') : null;
        const cb = tr ? tr.querySelector('input[data-f="done"]') : null;
        o.ledgerCb = !!cb; if(cb && !cb.disabled){ cb.click(); await sleep(300); } }
      setListMode('list'); await sleep(200); stop();
      await projSaveNow();
      o.disk1 = diskX();
      await __openShared(JSON.parse(window.__disk)); stop();                         // 次の日：物件を開き直す（直した印は残らない）
      const base = { chosho_mgmt_no: NO, chosho_cust_name: '戊 様', chosho_cust_tel: '011-222-3333', chosho_status: 'in_progress', chosho_date: '2026-10-20',
        work_type: 'uhf_new', amplifier: 'amp_3u43',
        chosho_photos: [{ id: 'qa', label: 'A', dataUri: __jpeg(600, 450, 0.85, 41) }, { id: 'qb', label: 'B', dataUri: __jpeg(620, 460, 0.85, 42) }] };
      const list = __mk('リスト', { [FN]: JSON.stringify(await encryptHybrid(base, PW)) }, {}, { resolve: true });
      const root = __mk('工事V', {}, { 'リスト': list }, { resolve: true });
      window.showDirectoryPicker = async () => root;
      let merges = 0;
      const tm = setInterval(() => { const m = document.getElementById('ledger-merge-modal');           // 重なりの窓：「📒 台帳を優先」
        if(m && m.classList.contains('open') && !m.__b){ m.__b = true; merges++; setTimeout(() => { document.getElementById('lg-merge-ledger').click(); m.__b = false; }, 120); } }, 80);
      const oConfirm = window.confirm;
      window.confirm = m => /まとめて復号しますか/.test(String(m)) ? false : oConfirm.call(window, m);  // まとめて復号は キャンセル
      promptPassword = async () => PW;                                                                  // 聞かれたらパスワード
      try { openListView(); stop(); await listSelectFolder(); stop(); await sleep(1200); }
      finally { clearInterval(tm); window.confirm = oConfirm; }
      const x = X();
      o.merged = { merges, ft: x && x.fileType, slim: !!(x && x._slim), unlocked: !!(x && x.unlocked), st: x && x.data.chosho_status,
                   lgEdited: !!(x && x._lgEdited) };
      stop(); await projSaveNow();
      o.disk2 = diskX();
      document.getElementById('bulk-target').value = 'hybrid';                                         // 🔄 一括再暗号化（方式・パスワードそのまま）
      document.getElementById('bulk-new-format').value = 'keep';
      document.getElementById('bulk-new-pw-src').value = 'keep';
      const w0 = list.__writes.length;
      await applyBulkReenc(); await sleep(300); stop();
      o.wrote = list.__writes.length - w0;
      await projSaveNow();
      o.disk3 = diskX();
      return o;
    }, { NO: '2612VM0001' });
    console.log('㉕yM台帳を優先した .hyb の 🔄', short(r), short(said.map(d => d.type + ':' + String(d.msg).replace(/\s+/g, ' ').slice(0, 60))));
    ok(!r.error, '㉕yM止まった → ' + r.error);
    if(!r.error){
      ok(r.ledgerCb && r.disk1.st === 'completed' && r.merged.merges >= 1 && r.merged.ft === 'hybrid' && r.merged.st === 'completed' && r.disk2.st === 'completed' && r.wrote === 1,
         '㉕yM試験の前提: 受付台帳の「完了」→ 📁 で .hyb と重なって「台帳を優先」→ 行と物件は「完了」・🔄 で .hyb を書く → ' + short(r));
      ok(r.disk3.st === 'completed' && r.disk3.date === '2026-10-22',
         '★㉕yM 「台帳を優先」で入れた「完了」・工事日程予定が、🔄 のあと物件から消えた（まだ戸別ファイルに入っていない印が無い） → ' + short(r.disk3) + ' 印=' + r.merged.lgEdited);
    }
    await ctx.close();
  }

  // ---- ㉕zM 共有ファイルの物件で 📁（物件に取り込む）した .hyb → 物件の保存 → ほかのPCが物件を保存（別の戸別を足しただけ。この戸別は直していない）
  //   → この端末で 🔄 一括再暗号化（keep：パスワードそのまま　newpw：新しいパスワード）→ 物件の保存（ほかのPCの保存とまとめる）
  //   → 物件のこの戸別は新しい鍵（ファイルと同じ鍵の元・新しいパスワードでほどける）・ほかのPCの戸別も残る
  //   （前は「この端末が直した戸別」でないので、まとめるときほかのPCの写し（前の鍵）に戻り、💾 物件に保存 が断り、新しいパスワードで開けなかった）
  for(const mode of ['keep', 'newpw'].filter(m => want('㉕zM' + m))){
    const L = '㉕zM' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, { shared: 'pj25zM' });
      const NEWPW = 'atarashii-99';
      const o = { loaded: h.loaded };
      h.stop(); await projSaveNow();
      __otherDeviceSaves('2612ZZZ901');                            // ほかのPC：別の戸別を足して物件を保存（この戸別は直していない）
      o.reenc = await h.reenc(mode === 'newpw' ? NEWPW : null);
      h.stop(); await projSaveNow();
      const pl = h.diskCase() || {};
      o.disk = { saltSame: pl.salt === JSON.parse(h.list.__files[h.FN]).salt,
                 other: JSON.parse(window.__disk).cases.some(c => (c.payload || {}).chosho_mgmt_no === '2612ZZZ901') };
      try { o.disk.name = (await decryptHybrid(pl, mode === 'newpw' ? NEWPW : h.PW)).chosho_cust_name; } catch(_){ o.disk.name = '（ほどけない）'; }
      o.rowSalt = (_listRows.find(x => x && x.fileType === 'hybrid') || {}).envelope;
      o.rowSalt = !!(o.rowSalt && o.rowSalt.salt === JSON.parse(h.list.__files[h.FN]).salt);
      return o;
    }, { NO, mode });
    console.log(L + 'ほかのPCの保存とまとめても 🔄 の鍵が物件に残る', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      ok(r.reenc.wrote === 1 && r.reenc.ids === 'A,B' && r.disk.other,
         L + '試験の前提: 🔄 で .hyb を書く・ほかのPCが足した戸別が物件にある → ' + short(r));
      ok(r.disk.saltSame && r.disk.name === '暗号 様' && r.rowSalt,
         '★' + L + ' ほかのPCの保存とまとめたら、🔄 で新しくした鍵が物件（と行）で前の鍵に戻った（💾 物件に保存 が断る・新しいパスワードで開けない） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ㉕zf 📄 ファイルで読んだ .hyb（A・B・増幅器 3U。書き戻せない＝iPad など）を 🔓 → 📥 現場取込（増幅器 1U-BC・写真 G）→ 開く
  //   → 画面に A・B・G（写真の出ている画面）・増幅器 1U-BC → 保存（💾 保存・🔑 ハイブリッド保存）に出す中身も A・B・G → 戻ってもう一度開いても同じ
  //   （nog：現場の写真なし → A・B　gpw：覚えているパスワードを消して、聞かれて入れて開く）
  //   （前は写真を剥がした封筒で開き、画面に G だけ（nog は写真なし）。保存して書き出したファイルからも A・B が抜けた）
  for(const mode of ['g', 'nog', 'gpw'].filter(m => want('㉕zf' + m))){
    const L = '㉕zf' + mode;
    const { ctx, page, said } = await openMain(L);
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO, mode }) => {
      const h = await __hyb25(NO, { src: true });
      const o = { loaded: Object.assign({ fh: !!h.row.fileHandle, src: !!h.row.srcFile }, h.loaded) };
      o.importNote = await h.importG(mode === 'nog' ? { amplifier: 'amp_1ubc45', chosho_photos: [] } : { amplifier: 'amp_1ubc45' });
      o.afterImport = { slim: !!h.row._slim, rowPh: h.names(h.row.data && h.row.data.chosho_photos) };
      o.open1 = await h.open(mode === 'gpw' ? { pw: true } : undefined);
      o.saveSet = h.names(collectState().chosho_photos);
      await h.back();
      o.open2 = await h.open();
      return o;
    }, { NO, mode });
    console.log(L + '📄 ファイルの .hyb へ 📥 して開く', short(r));
    ok(!r.error, L + '止まった → ' + r.error);
    if(!r.error){
      const want1 = mode === 'nog' ? 'A,B' : 'A,B,G';
      ok(r.loaded.src && !r.loaded.fh && r.open1.click && r.open1.amp === 'amp_1ubc45',
         L + '試験の前提: 📄 ファイルの .hyb（書き戻せない）へ 📥 して開くと、現場の増幅器 1U-BC → ' + short(r));
      ok(r.open1.shown === want1 && !r.open1.stripped && r.saveSet === want1,
         '★' + L + ' 📄 ファイルの .hyb へ 📥 して開くと、読んだファイルの写真 A・B が画面に出ない・保存の中身から抜ける（写真を剥がした封筒で開いた） → ' + short(r.open1) + ' 保存=' + r.saveSet);
      ok(r.open2.shown === want1 && r.open2.amp === 'amp_1ubc45',
         '★' + L + ' もう一度開くと、写真か現場の増幅器が変わった → ' + short(r.open2));
    }
    await ctx.close();
  }

  // ---- ㉕zk 📄 ファイルで読んだ .hyb（A「写真A」・B「写真B」）を開いて、B を × で消し、A の名前を「玄関」に、増幅器を 1U にして一覧へ戻る
  //   → 開き直すと画面は A「玄関」だけ（読んだファイルの写真で戻さない）・保存（💾 保存・🔑）の中身も A「玄関」
  //   → 一括平文化の中身は A が「玄関」（行の写真が先。ファイルにしか無い B は足す＝減らさない）
  //   （前は読んだファイルの写真が勝ち、消した B が戻り、名前も「写真A」に戻った。保存してもその古いほうが書かれた）
  if(want('㉕zk')){
    const { ctx, page, said } = await openMain('㉕zk');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO, { src: true });
      const desc = arr => (Array.isArray(arr) ? arr : []).filter(p => p && p.dataUri).map(p => h.nm(p.dataUri) + ':' + (p.label || '')).join(',');
      const o = { loaded: Object.assign({ fh: !!h.row.fileHandle, src: !!h.row.srcFile }, h.loaded) };
      o.open1 = await h.open();
      const wrap = document.getElementById('photo-list');
      wrap.querySelector('[data-photo-del="1"]').click(); await h.sleep(200);      // B を × で消す（確かめは「はい」）
      const lb = document.getElementById('photo-list').querySelector('[data-photo-label="0"]');
      lb.value = '玄関'; lb.dispatchEvent(new Event('input', { bubbles: true })); await h.sleep(100);
      __setField('amplifier', 'amp_1u45');
      o.edited = desc(STATE.photos);
      await h.back();
      o.afterBack = { known: !!h.row._photosKnown, rowPh: desc(h.row.data && h.row.data.chosho_photos) };
      o.open2 = await h.open();
      o.screen2 = desc(STATE.photos);
      o.save2 = desc(collectState().chosho_photos);
      await h.back();
      const blobs = [], oURL = URL.createObjectURL;
      URL.createObjectURL = b => { blobs.push(b); return oURL.call(URL, b); };
      try { await bulkConvertToPlain(); } finally { URL.createObjectURL = oURL; }
      const js = blobs.filter(b => b && b.type === 'application/json');
      try { const d = JSON.parse(await js[js.length - 1].text()); o.plain = { ph: desc(d.chosho_photos), amp: d.amplifier }; } catch(_){ o.plain = { ph: '（書かない）' }; }
      return o;
    }, { NO });
    console.log('㉕zk📄 ファイルの .hyb で写真を直して戻り、開き直す', short(r));
    ok(!r.error, '㉕zk止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.src && r.open1.shown === 'A,B' && r.edited === 'A:玄関' && r.afterBack.known && r.afterBack.rowPh === 'A:玄関',
         '㉕zk試験の前提: 📄 ファイルの .hyb を開いて B を消し A を「玄関」にして戻ると、行は A「玄関」 → ' + short(r));
      ok(r.screen2 === 'A:玄関' && r.save2 === 'A:玄関' && r.open2.amp === 'amp_1u45',
         '★㉕zk 開き直すと、読んだファイルの写真で戻った（消した B が戻った・名前が「写真A」に戻った）・保存の中身も古いほう → ' + short(r.screen2) + ' 保存=' + r.save2);
      ok(/^A:玄関(,B:写真B)?$/.test(r.plain.ph) && r.plain.amp === 'amp_1u45',
         '★㉕zk 一括平文化の中身で、画面で直した名前が読んだファイルの「写真A」に戻った（行の写真を先にしない） → ' + short(r.plain));
    }
    await ctx.close();
  }

  // ---- ㉕ze 📄 ファイルで読んだ .hyb（A・B・増幅器 3U）を開いて、増幅器を 1U に直し写真 P を足して一覧へ戻る
  //   → 📄 一括平文化・🔄 一括再暗号化（新しいパスワード）は飛ばさずに書き出す（ダウンロード）。中身は A・B・P・増幅器 1U
  //   （前は「ファイルの付いている戸別は、開いて 💾 上書き保存」と知らせて飛ばした。📄 の行の 💾 上書き保存は押せない。
  //     読んだファイルの写真だけで書くと、足した写真 P が抜けた）
  if(want('㉕ze')){
    const { ctx, page, said } = await openMain('㉕ze');
    await page.evaluate(HYB25);
    const r = await run(page, async ({ NO }) => {
      const h = await __hyb25(NO, { src: true });
      const o = { loaded: Object.assign({ fh: !!h.row.fileHandle, src: !!h.row.srcFile }, h.loaded) };
      o.open1 = await h.open();
      __setField('amplifier', 'amp_1u45');
      await __addPhoto(h.P, 'p.jpg');
      o.shown = h.look().shown;
      await h.back();
      o.afterBack = { slim: !!h.row._slim, rowPh: h.names(h.row.data && h.row.data.chosho_photos) };
      o.plain = await h.toPlain();
      o.reenc = await h.reencDl('atarashii-99');
      return o;
    }, { NO });
    const al = alerts(said).map(a => a.replace(/\s+/g, ' '));
    console.log('㉕ze📄 ファイルの .hyb を直して戻ったあとの 📄・🔄', short(r), short(al.slice(-2).map(a => a.slice(0, 80))));
    ok(!r.error, '㉕ze止まった → ' + r.error);
    if(!r.error){
      ok(r.loaded.src && !r.loaded.fh && r.open1.shown === 'A,B' && r.shown === 'A,B,P' && !r.afterBack.slim && r.afterBack.rowPh === 'A,B,P',
         '㉕ze試験の前提: 📄 ファイルの .hyb を開いて P を足して戻ると、行に A・B・P → ' + short(r));
      ok(r.plain.ids === 'A,B,P' && r.plain.amp === 'amp_1u45' && !r.plain.enc,
         '★㉕ze 📄 ファイルの行を直して戻ったあと、📄 一括平文化が飛ばした・写真が抜けた・直しが入らない → ' + short(r.plain));
      ok(r.reenc.ids === 'A,B,P' && r.reenc.amp === 'amp_1u45',
         '★㉕ze 📄 ファイルの行を直して戻ったあと、🔄 一括再暗号化が飛ばした・写真が抜けた・直しが入らない → ' + short(r.reenc));
      ok(!al.some(a => /飛ばした戸別/.test(a)), '★㉕ze 📄 ファイルの行を飛ばした → ' + short(al.slice(-1)));
    }
    await ctx.close();
  }
  }
  /* ===== ここまで（8回目の見直し：暗号の戸別）===== */

  // ---- ㉗ 物件から開いた戸別の「💾 保存」（名前を付けて保存）：ファイルを選ぶ画面で戸別ファイルを置き換えさせない ----
  for(const mode of ['a', 'b', 'c', 'd'].filter(m => want('㉗' + m))){
    const { ctx, page, said } = await openMain('㉗' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 271); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const fileText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43', _origin: 'genba',
                                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: fileText });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      /* ファイルを選ぶ画面（名前を付けて保存）。利用者は工事フォルダの戸別ファイルを選んで置き換える。
         Chrome と同じく、選んだファイルを こちらへ渡す前に空にする */
      const picks = [];
      window.showSaveFilePicker = async o => { picks.push((o && o.suggestedName) || '');
        list.__files[NO + '.json'] = ''; return await list.getFileHandle(NO + '.json'); };
      /* ダウンロード（写しの名前と中身）を拾う */
      const blobs = {}, dls = [];
      const oc = URL.createObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = oc(b); blobs[u] = b; return u; };
      const ck = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){
        if(this.download){ dls.push({ name: this.download, blob: blobs[this.href] }); return; }
        return ck.call(this); };
      let P = null, eP = null;
      if(mode === 'd'){
        applyStateData({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43',
                         chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] });   // 📂 で読んだ戸別（物件なし）
      } else {
        const payload = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '' };
        if(mode !== 'c') Object.assign(payload, { chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: Gt }],
                                                  chosho_photos_thumb: true, chosho_photo_count: 1 });
        if(mode === 'a') payload.amplifier = 'amp_3u43';            // 図面あり＝開くと物件の縮小版が画面に出る
        await __openProj(__proj178('pj178s' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload }]));
        const row = _listRows.filter(r => r.data.chosho_mgmt_no === NO)[0];
        await openCaseInEditor(row);
        if(mode === 'a'){ P = __jpeg(900, 700, 0.85, 272); eP = await __addPhoto(P, 'p.jpg'); }
      }
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      await document.getElementById('btn-save').onclick();         // エディタの「💾 保存」
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G' : (p.dataUri === Gt ? 'G縮' : 'G?'))
                                    : (eP && p.id === eP.id ? (p.dataUri === P ? 'P' : 'P?') : '?');
      const fileNow = list.__files[NO + '.json'];
      const dl = dls[0] || null;
      let copy = null;
      try { copy = (dl && dl.blob) ? JSON.parse(await dl.blob.text()) : null; } catch(_){ copy = '(読めない)'; }
      return { picks, shown, eP: mode === 'a' ? !!(eP && eP.dataUri === P) : null,
               fileSame: fileNow === fileText, filePh: (__photosOf(fileNow || '{}') || []).map(tag), writes: list.__writes.length,
               dls: dls.map(d => d.name), copyNo: (copy && copy.chosho_mgmt_no) || null,
               copyPh: (copy && typeof copy === 'object') ? (copy.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort() : copy };
    }, { NO, PN, mode });
    const asked = said.filter(s => s.type === 'prompt').map(s => s.msg);   // 「💾 保存」で出た窓（写しの名前を聞く窓）
    console.log('㉗' + mode + '物件から開いた戸別の名前を付けて保存', short(r), short(asked.map(m => m.slice(0, 200))));
    ok(!r.error, '㉗' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'd'){
        ok(r.picks.length === 1 && r.picks[0] === NO + '.json' && r.dls.length === 0 && r.filePh.join() === 'G',
           '★㉗d物件から開いたのではない戸別の「💾 保存」が、今までどおりファイルを選ぶ画面（' + NO + '.json）で保存しない → ' + short(r));
        ok(!asked.some(m => /物件に保存/.test(m)), '★㉗d物件から開いたのではない戸別で「💾 物件に保存」を案内した → ' + short(asked));
      } else {
        if(mode === 'a') ok(r.shown === 2 && r.eP === true, '㉗a試験の前提: 図面のある戸別を開くと縮小版が画面に出て、P を足せる → ' + short(r));
        if(mode !== 'a') ok(r.shown === 0, '㉗' + mode + '試験の前提: 図面のまだ無い戸別を開くと、写真は画面に出ない → ' + short(r));
        ok(r.picks.length === 0 && r.fileSame && r.writes === 0,
           '★㉗' + mode + '物件から開いた戸別の「💾 保存」で、ファイルを選ぶ画面を開いた（選んだ戸別ファイルが空にされ、'
           + (mode === 'a' ? '縮小版で書かれる・原寸の G が消える' : '写真の無いファイルになる') + '） → ' + short(r));
        ok(r.dls.length === 1 && r.dls[0] === NO + '_写し.json' && r.copyNo === NO,
           '★㉗' + mode + '写しをダウンロードの場所へ「' + NO + '_写し.json」で保存しない → ' + short(r));
        const want = { a: 'G縮,P', b: 'G縮', c: '' }[mode];
        ok(Array.isArray(r.copyPh) && r.copyPh.join() === want,
           '★㉗' + mode + '写しの写真が減った・違う（' + want + ' のはず。図面の無い戸別は画面に入れなかった写真も入れる） → ' + short(r.copyPh));
        ok(asked.some(m => /💾 物件に保存/.test(m) && /戸別ファイル/.test(m) && /書き替えません/.test(m)),
           '★㉗' + mode + '「戸別ファイルへは 💾 物件に保存 で書いてください」と知らせない → ' + short(asked));
        if(mode !== 'c') ok(asked.some(m => /物件に控えた小さい写真/.test(m)), '★㉗' + mode + '写真が物件に控えた小さい写真だと知らせない → ' + short(asked));
        else ok(!asked.some(m => /物件に控えた小さい写真/.test(m)), '★㉗c写真の無い戸別で「小さい写真です」と知らせた → ' + short(asked));
      }
    }
    await ctx.close();
  }

  // ---- ㉗e〜h 物件から開いた戸別：開いている行が一覧から外れても（🧹 未施工）、画面の側で覚えて、保存は写しにする ----
  for(const mode of ['e', 'f', 'g', 'h', 'i', 'j', 'k'].filter(m => want('㉗' + m))){
    const { ctx, page, said } = await openMain('㉗' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 273); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      const fileText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43', _origin: 'genba',
                                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, null, 2);
      const list = __mk('リスト', { [NO + '.json']: fileText });
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      /* ファイルを選ぶ画面：工事フォルダの戸別ファイルを選んで置き換える。Chrome と同じく、渡す前に空にする */
      const picks = [];
      window.showSaveFilePicker = async o => { picks.push((o && o.suggestedName) || '');
        list.__files[NO + '.json'] = ''; return await list.getFileHandle(NO + '.json'); };
      const blobs = {}, dls = [];
      const oc = URL.createObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = oc(b); blobs[u] = b; return u; };
      const ck = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){
        if(this.download){ dls.push({ name: this.download, blob: blobs[this.href] }); return; }
        return ck.call(this); };
      const payload = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                        chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 };
      if(mode === 'f') payload.amplifier = 'amp_3u43';            // 図面あり＝開くと縮小版が画面に出る（setLoadedOrigin の道）
      await __openProj(__proj178('pj178u' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + NO + '.json', lastModified: 0, payload }]));
      const row = _listRows[0];
      await openCaseInEditor(row);
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      let detached = null, printed = 0, K = null, btnAfterImport = null;
      if(mode === 'g'){
        applyStateData(JSON.parse(fileText));                      // 📂 で工事フォルダの戸別を読んで、画面を替えた
      } else {
        if(mode === 'i'){
          // 📥 現場取込で、開いている戸別へ現場の写真 K を入れた（工事フォルダは掴めなかった）＝画面を入れ直す
          K = __jpeg(900, 700, 0.85, 274);
          window.showDirectoryPicker = async () => { const e = new Error('閉じた'); e.name = 'AbortError'; throw e; };
          _genbaNoDir = false;
          await applyGenbaMergeToRow(row, { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', _origin: 'genba', work_type: '',
                                            chosho_photos: [{ id: photoContentId(K), label: '現場で撮った2', dataUri: K }] }, { importRun: true });
          const b0 = document.getElementById('btn-save-overwrite');
          btnAfterImport = { text: b0 ? b0.textContent.trim() : '', disabled: b0 ? b0.disabled : null };
        }
        let done;
        if(mode === 'j'){ aptMgRemoveRow(row); done = _listRows.indexOf(row) < 0; }   // 世帯の削除（一覧から外す）
        else if(mode === 'k'){                                     // 受付台帳の 🗑 →「一覧から消す（ファイルは残す）」
          openListView(); setListMode('ledger');
          lgDelDialog = async () => 'list';
          const uid = Object.keys(_ledgerShown).filter(u => _ledgerShown[u] === row)[0];
          const tr = (uid != null) ? document.querySelector('tr[data-uid="' + uid + '"]') : null;
          const b = tr && tr.querySelector('[data-open="del"]');
          if(b) b.click();
          for(let t = 0; t < 60 && _listRows.indexOf(row) >= 0; t++) await new Promise(res => setTimeout(res, 50));
          closeListView();
          done = !!b && _listRows.indexOf(row) < 0;
        }
        else done = revertCaseToNotStarted(row);                   // 一覧で「🧹 未施工」：開いている行が外れる（画面はそのまま）
        detached = { done, editingNull: _editingRow === null };
        if(mode === 'h'){
          printWithFilename = (n, cb) => { printed++; try { cb && cb(); } catch(_){} };
          await buildAndPrintChoshoBatch([row], 'x_');             // 工事調書のまとめ印刷（画面を替えて戻す）
          await new Promise(res => setTimeout(res, 300));
        }
      }
      const btn = document.getElementById('btn-save-overwrite');
      const btnState = { text: btn ? btn.textContent.trim() : '', disabled: btn ? btn.disabled : null };
      await document.getElementById('btn-save').onclick();         // エディタの「💾 保存」
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G' : (p.dataUri === Gt ? 'G縮' : 'G?')) : ((K && p.dataUri === K) ? 'K' : '?');
      const fileNow = list.__files[NO + '.json'];
      let copy = null;
      try { copy = (dls[0] && dls[0].blob) ? JSON.parse(await dls[0].blob.text()) : null; } catch(_){ copy = '(読めない)'; }
      return { picks, shown, detached, printed, btnState, btnAfterImport, fileSame: fileNow === fileText,
               filePh: (__photosOf(fileNow || '{}') || []).map(tag), writes: list.__writes.length, dls: dls.map(d => d.name),
               copyPh: (copy && typeof copy === 'object') ? (copy.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort() : copy };
    }, { NO, PN, mode });
    const asked = said.filter(s => s.type === 'prompt').map(s => s.msg);
    console.log('㉗' + mode + '行が外れたあとの名前を付けて保存', short(r), short(asked.map(m => m.slice(0, 200))));
    ok(!r.error, '㉗' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'g'){
        ok(r.picks.length === 1 && r.picks[0] === NO + '.json' && r.dls.length === 0 && r.filePh.join() === 'G' && asked.length === 0,
           '★㉗g物件の行を開いたあと 📂 で別の戸別を読んで画面を替えても、写しにされた（物件から開いた印が下りていない） → ' + short(r));
      } else {
        ok(r.shown === (mode === 'f' ? 1 : 0) && r.detached && r.detached.done && r.detached.editingNull && (mode !== 'h' || r.printed === 1),
           '㉗' + mode + '試験の前提: 物件の行を開いて、一覧から外した（' + ({ j: '世帯の削除', k: '台帳の「一覧から消す」' }[mode] || '「🧹 未施工」')
           + '）' + (mode === 'h' ? '・まとめ印刷をした' : '') + (mode === 'i' ? '・その前に 📥 で現場の写真を入れた' : '') + ' → ' + short(r));
        if(mode === 'i') ok(r.btnAfterImport && /物件に保存/.test(r.btnAfterImport.text) && r.btnAfterImport.disabled === false,
           '★㉗i 📥 で開いている戸別へ入れたあと、ボタンが「💾 物件に保存」に戻らない（押せない「💾 上書き保存」のまま） → ' + short(r.btnAfterImport));
        if(mode === 'j' || mode === 'k') ok(!(/物件に保存/.test(r.btnState.text) && r.btnState.disabled === false),
           '★㉗' + mode + '行が一覧から外れたのに、ボタンが「💾 物件に保存」で押せるまま（描き直していない） → ' + short(r.btnState));
        ok(r.picks.length === 0 && r.fileSame && r.writes === 0,
           '★㉗' + mode + '開いている行が一覧から外れたあとの「💾 保存」で、ファイルを選ぶ画面を開いた（選んだ戸別ファイルが空にされ、'
           + (mode === 'f' ? '縮小版で書かれる' : '写真0枚になる') + '） → ' + short(r));
        const wantCopy = (mode === 'i') ? 'G縮,K' : 'G縮';
        ok(r.dls.length === 1 && r.dls[0] === NO + '_写し.json' && Array.isArray(r.copyPh) && r.copyPh.join() === wantCopy,
           '★㉗' + mode + '写し（' + NO + '_写し.json・' + wantCopy + (mode === 'f' || mode === 'i' ? '' : '＝画面に入れなかった写真') + '）を保存しない・写真が減った → ' + short(r));
        ok(asked.length === 1 && /物件から開いています/.test(asked[0]) && /物件に控えた小さい写真/.test(asked[0])
           && /ここからは書き替えません/.test(asked[0]) && !/物件に保存/.test(asked[0]),
           '★㉗' + mode + '行が外れて「💾 物件に保存」が押せないのに、その名前へ案内した・知らせない → ' + short(asked) + ' ボタン ' + short(r.btnState));
      }
    }
    await ctx.close();
  }

  // ---- ㉘ 物件から開いた戸別の「🔐 暗号化保存」「ハイブリッド保存」：ファイルを選ぶ画面で戸別ファイルを空にさせない ----
  for(const mode of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'].filter(m => want('㉘' + m))){
    const { ctx, page, said } = await openMain('㉘' + mode);
    const r = await run(page, async ({ NO, PN, mode }) => {
      const G = __jpeg(900, 700, 0.85, 281); const gid = photoContentId(G);
      const Gt = await makeThumbDataUri(G, PROJ_THUMB_MAXPX, PROJ_THUMB_QUALITY);
      promptPassword = async () => 'pw1234';                          // パスワードの窓（開くときも保存のときも同じ鍵）
      /* ダウンロード（写しの名前と中身）を拾う */
      const blobs = {}, dls = [], picks = [];
      const oc = URL.createObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = oc(b); blobs[u] = b; return u; };
      const ck = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){
        if(this.download){ dls.push({ name: this.download, blob: blobs[this.href] }); return; }
        return ck.call(this); };
      const hybMode = ['a', 'e', 'g', 'h', 'i', 'j'].indexOf(mode) >= 0;
      let list, fileName, fileText;
      let S = null, sid = null, F = null, fid = null;
      if(mode === 'j'){ S = __jpeg(400, 300, 0.85, 284); sid = photoContentId(S); }   // 小さい元の写真（JPEG・長辺400px）
      if(mode === 'k'){                                                                // 小さい PNG の図（300×200。元の写真のまま物件に残る）
        const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200;
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 300, 200);
        cx.strokeStyle = '#000'; cx.lineWidth = 3; cx.strokeRect(20, 20, 260, 160); cx.beginPath(); cx.moveTo(20, 20); cx.lineTo(280, 180); cx.stroke();
        F = cv.toDataURL('image/png'); fid = photoContentId(F);
      }
      if(hybMode){
        // 暗号の戸別：フォルダに 管理番号.antenna.hyb（このアプリのハイブリッド保存が付ける名前・暗号の写真 G）。
        // 物件の行は写真を剥がした封筒（slimListRow と同じ形）
        const state = { chosho_mgmt_no: NO, chosho_cust_name: '暗号 様', chosho_status: 'in_progress', work_type: 'uhf_new', amplifier: 'amp_3u43',
                        chosho_photos: [S ? { id: sid, label: '小さい写真', dataUri: S } : { id: gid, label: '現場で撮った', dataUri: G }] };
        const env = await encryptHybrid(state, 'pw1234');
        fileName = NO + '.antenna.hyb'; fileText = JSON.stringify(env, null, 2);
        list = __mk('リスト', { [fileName]: fileText });
        const slim = Object.assign({}, env, { encrypted_fields: Object.assign({}, env.encrypted_fields, { chosho_photos: { stripped: true } }) });
        await __openProj(__proj178('pj178t' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + fileName, lastModified: 0, payload: (mode === 'j') ? env : slim }]));   // j は剥がしていない封筒
        if(mode === 'e') _listRows[0].fileHandle = await list.getFileHandle(fileName);   // 工事フォルダのファイルに結び付いている
      } else {
        fileName = NO + '.json';
        fileText = JSON.stringify({ chosho_mgmt_no: NO, chosho_cust_name: '試験 様', amplifier: 'amp_3u43', _origin: 'genba',
                                    chosho_photos: [{ id: gid, label: '現場で撮った', dataUri: G }] }, null, 2);
        list = __mk('リスト', { [fileName]: fileText });
        if(mode === 'd') applyStateData(JSON.parse(fileText));        // 📂 で読んだ戸別（物件なし）
        else {
          const payload = { chosho_mgmt_no: NO, chosho_cust_name: '試験 様', chosho_status: 'in_progress', work_type: '',
                            chosho_photos: [F ? { id: fid, label: '図', dataUri: F } : { id: gid, label: '現場で撮った', dataUri: Gt }], chosho_photos_thumb: true, chosho_photo_count: 1 };
          if(mode === 'b' || mode === 'k') payload.amplifier = 'amp_3u43';   // 図面あり＝開くと物件の写真が画面に出る
          await __openProj(__proj178('pj178t' + mode, PN, [{ caseId: 'c1', file: 'リスト/' + fileName, lastModified: 0, payload }]));
        }
      }
      const root = __mk('その１', {}, { 'リスト': list });
      window.showDirectoryPicker = async () => root;
      /* ファイルを選ぶ画面：利用者は工事フォルダの戸別ファイルを選んで置き換える（d は勧められた名前で新しく作る）。
         Chrome と同じく、選んだファイルを こちらへ渡す前に空にする */
      window.showSaveFilePicker = async o => { const sug = (o && o.suggestedName) || ''; picks.push(sug);
        const n = (mode === 'd') ? sug : fileName;
        list.__files[n] = ''; return await list.getFileHandle(n); };
      let P = null, eP = null, stripped = null, detached = null, after = null;
      if(mode !== 'd'){
        const row = _listRows[0];
        await openCaseInEditor(row);
        stripped = _editorPhotosStripped;
        if(mode === 'b' || mode === 'i'){ P = __jpeg(900, 700, 0.85, 282); eP = await __addPhoto(P, 'p.jpg'); }
        if(mode === 'f' || mode === 'g'){ const done = revertCaseToNotStarted(row); detached = { done, editingNull: _editingRow === null }; }   // 一覧で「🧹 未施工」
        if(mode === 'h'){
          let printed = 0;
          printWithFilename = (n, cb) => { printed++; try { cb && cb(); } catch(_){} };
          await buildAndPrintChoshoBatch([row], 'x_');               // 工事調書のまとめ印刷（画面を替えて戻す）
          await new Promise(res => setTimeout(res, 300));
          after = { printed, stripped: _editorPhotosStripped, banner: !!document.getElementById('photo-stripped-banner') };
        }
      }
      const btn = ((document.getElementById('btn-save-overwrite') || {}).textContent || '').trim();
      const shown = (STATE.photos || []).filter(p => p && p.dataUri).length;
      const presses = (mode === 'c' || mode === 'f') ? ['btn-save-enc', 'btn-save-hyb'] : (mode === 'd' ? ['btn-save-hyb', 'btn-save-enc'] : ['btn-save-hyb']);
      for(const id of presses) await document.getElementById(id).onclick();
      const tag = p => p.id === gid ? (p.dataUri === G ? 'G' : (p.dataUri === Gt ? 'G縮' : 'G?'))
                     : (sid && p.id === sid) ? (p.dataUri === S ? 'S' : 'S?')
                     : (fid && p.id === fid) ? (p.dataUri === F ? 'F' : 'F?')
                     : (eP && p.id === eP.id ? (p.dataUri === P ? 'P' : 'P?') : '?');
      const copies = [];
      for(const d of dls){
        let j = null, dec = null, err = '';
        try { j = JSON.parse(await d.blob.text()); } catch(_){ err = 'JSONでない'; }
        try { if(j && j.encrypted_fields) dec = await decryptHybrid(j, 'pw1234');
              else if(j) dec = JSON.parse(await decryptJsonString(j, 'pw1234')); }
        catch(e){ err = String((e && e.message) || e).slice(0, 80); }
        copies.push({ name: d.name, hybrid: !!(j && j.encrypted_fields), err, no: dec && dec.chosho_mgmt_no,
                      ph: dec ? (dec.chosho_photos || []).filter(p => p && p.dataUri).map(tag).sort() : null });
      }
      return { picks, shown, stripped, detached, after, btn, eP: (mode === 'b' || mode === 'i') ? !!(eP && eP.dataUri === P) : null,
               fileSame: list.__files[fileName] === fileText, writes: list.__writes.length, tree: __tree(root), copies };
    }, { NO, PN, mode });
    const confirms = said.filter(s => s.type === 'confirm').map(s => s.msg);
    const alerts2 = alerts(said);
    console.log('㉘' + mode + '暗号の保存', short(r), short(confirms.map(m => m.slice(0, 160))));
    ok(!r.error, '㉘' + mode + '止まった → ' + r.error);
    if(!r.error){
      if(mode === 'd'){
        ok(r.picks.join() === NO + '.antenna.hyb,' + NO + '.antenna.enc' && r.writes === 2 && r.fileSame && r.copies.length === 0,
           '★㉘d物件から開いたのではない戸別の 🔐／ハイブリッド保存が、今までどおりファイルを選ぶ画面で保存しない → ' + short(r));
        ok(!confirms.some(m => /物件から開いています/.test(m)), '★㉘d物件から開いたのではない戸別で「物件から開いています」と知らせた → ' + short(confirms));
      } else {
        const hybMode = ['a', 'e', 'g', 'h', 'i', 'j'].indexOf(mode) >= 0;
        const exts = (mode === 'c' || mode === 'f') ? ['.antenna.enc', '.antenna.hyb'] : ['.antenna.hyb'];
        const wantPh = { a: '', b: 'G縮,P', c: 'G縮', e: '', f: 'G縮', g: '', h: '', i: 'P', j: 'S', k: 'F' }[mode];
        const indiv = hybMode ? NO + '.antenna.hyb' : NO + '.json';
        const guide = ['a', 'b', 'c', 'h', 'i', 'j', 'k'].indexOf(mode) >= 0;   // 「💾 物件に保存」が押せる（行が外れていない・ファイルに結び付いていない）
        const strip = ['a', 'e', 'g', 'h', 'i'].indexOf(mode) >= 0;      // 写真が剥がれたまま開いた
        const notSmall = (mode === 'j' || mode === 'k');            // 画面の写真は小さいが、物件の縮小版ではない（元の写真）
        // ---- 試験の前提 ----
        if(strip) ok(r.stripped === true && r.shown === (mode === 'i' ? 1 : 0), '㉘' + mode + '試験の前提: 暗号の物件の行を開くと、写真は復元できていない（剥がれている）'
                     + (mode === 'i' ? '・足した P だけが画面に出る' : '') + ' → ' + short(r));
        if(mode === 'i') ok(r.eP === true, '㉘i試験の前提: 写真の剥がれた画面に P を足せる → ' + short(r));
        if(mode === 'j') ok(r.stripped === false && r.shown === 1, '㉘j試験の前提: 剥がしていない封筒の暗号の行を開くと、元の写真 S が画面に出る → ' + short(r));
        if(mode === 'k') ok(r.shown === 1, '㉘k試験の前提: 図面のある物件の行を開くと、PNG の図 F が画面に出る → ' + short(r));
        if(mode === 'a') ok(/物件に保存/.test(r.btn), '㉘a試験の前提: ボタンは「💾 物件に保存」 → ' + short(r));
        if(mode === 'e') ok(/上書き保存/.test(r.btn), '㉘e試験の前提: ファイルに結び付いた暗号の物件の行は、ボタンが「💾 上書き保存」 → ' + short(r));
        if(mode === 'b') ok(r.shown === 2 && r.eP === true, '㉘b試験の前提: 図面のある戸別を開くと縮小版が画面に出て、P を足せる → ' + short(r));
        if(mode === 'c' || mode === 'f') ok(r.shown === 0, '㉘' + mode + '試験の前提: 図面のまだ無い戸別を開くと、写真は画面に出ない → ' + short(r));
        if(mode === 'f' || mode === 'g') ok(r.detached && r.detached.done && r.detached.editingNull, '㉘' + mode + '試験の前提: 一覧で「🧹 未施工」にして、開いている行が外れた → ' + short(r));
        if(mode === 'h'){
          ok(r.after && r.after.printed === 1, '㉘h試験の前提: 工事調書のまとめ印刷をした → ' + short(r.after));
          ok(r.after && r.after.stripped === true && r.after.banner === true,
             '★㉘h工事調書のまとめ印刷のあと、「写真が復元できていない」印・バナーが消えた（あとの 💾 上書き保存が画面の写真だけで .hyb を書く・写しの知らせが「復元できていない」と言わない） → ' + short(r.after));
        }
        // ---- 画面を開かない・写し ----
        ok(r.picks.length === 0 && r.fileSame && r.writes === 0,
           '★㉘' + mode + '物件から開いた戸別の暗号の保存で、ファイルを選ぶ画面を開いた（選んだ戸別ファイルが空にされ、'
           + (hybMode ? '元の暗号の写真が消える' : '縮小版・写真なしで書かれる') + '） → ' + short(r));
        ok(r.copies.length === exts.length && r.copies.every((c, k) => c.name === NO + '_写し' + exts[k] && c.hybrid === (exts[k] === '.antenna.hyb') && c.no === NO && !c.err),
           '★㉘' + mode + '写しを「' + exts.map(e => NO + '_写し' + e).join('」「') + '」でダウンロードの場所へ保存しない・ほどけない → ' + short(r.copies));
        ok(r.copies.length === exts.length && r.copies.every(c => Array.isArray(c.ph) && c.ph.join() === wantPh),
           '★㉘' + mode + '写しの写真が違う（' + (wantPh || '復元できていないので無し') + ' のはず'
           + ((mode === 'c' || mode === 'f') ? '。🔐 もハイブリッドも、画面に入れなかった写真を入れる' + (mode === 'f' ? '（行が外れていても）' : '') : '') + '） → ' + short(r.copies));
        // ---- 知らせ ----
        ok(confirms.length === exts.length && confirms.every((m, k) => /物件から開いています/.test(m) && /書き替えません/.test(m)
             && m.indexOf('（' + indiv + '）') >= 0 && m.indexOf(NO + '_写し' + exts[k]) >= 0),
           '★㉘' + mode + 'パスワードの前に、戸別ファイル（' + indiv + '）は書き替えないと知らせて確かめない・名前が違う'
           + (mode === 'g' ? '（行が外れても、開いた行の名前を言う）' : '') + ' → ' + short(confirms));
        if(guide) ok(confirms.length === exts.length && confirms.every(m => /「💾 物件に保存」で書いてください/.test(m)),
           '★㉘' + mode + '「戸別ファイルへは 💾 物件に保存 で」と案内しない → ' + short(confirms));
        else ok(confirms.length >= 1 && confirms.every(m => !/物件に保存/.test(m) && /ここからは書き替えません/.test(m)),
           '★㉘' + mode + '「💾 物件に保存」が押せない（' + (mode === 'e' ? 'ボタンは「💾 上書き保存」' : '行が外れた') + '）のに、その名前へ案内した → ' + short(confirms));
        if(guide && hybMode) ok(confirms.every(m => /写真とお客様の欄は、暗号の戸別ファイルには入りません/.test(m)),
           '★㉘' + mode + '暗号の戸別へ「💾 物件に保存」を案内するのに、ここで足した写真とお客様の欄は暗号の戸別ファイルに入らないと言わない → ' + short(confirms));
        if(guide && !hybMode) ok(confirms.every(m => !/暗号の戸別ファイルには入りません/.test(m)), '★㉘' + mode + 'ふつうの戸別で「暗号の戸別ファイルには入りません」と言った → ' + short(confirms));
        if(strip) ok(confirms.length >= 1 && confirms.every(m => /復元できていない/.test(m)), '★㉘' + mode + '写真が復元できていない（写しに入らない）と知らせない → ' + short(confirms));
        if(mode === 'i') ok(confirms.length >= 1 && confirms.every(m => /元の暗号の写真は復元できていない/.test(m) && /この画面の写真だけが入ります/.test(m)),
           '★㉘i剥がれた画面に P が出ていて写しにも入るのに、「写真は…この写しには入りません」とだけ言った（この画面の写真は入ると言わない） → ' + short(confirms));
        else if(strip) ok(confirms.every(m => !/この画面の写真だけが入ります/.test(m)),
           '★㉘' + mode + '写しに写真が1枚も入らないのに「この画面の写真だけが入ります」と言った → ' + short(confirms));
        if(notSmall) ok(confirms.length >= 1 && confirms.every(m => !/物件に控えた小さい写真/.test(m) && /戸別ファイルにしか無い写真/.test(m)),
           '★㉘' + mode + '画面の写真は元の写真（' + (mode === 'j' ? '暗号の戸別からほどいた小さい JPEG' : '小さい PNG の図') + '）なのに「物件に控えた小さい写真（元の写真ではありません）」と言った → ' + short(confirms));
        else if(!strip) ok(confirms.length >= 1 && confirms.every(m => /物件に控えた小さい写真/.test(m)), '★㉘' + mode + '写真が物件に控えた小さい写真だと知らせない → ' + short(confirms));
        ok(alerts2.filter(m => /写しをダウンロードの場所へ保存しました/.test(m) && /書き替えていません/.test(m)).length === exts.length
           && !alerts2.some(m => /保存が完了しました/.test(m)),
           '★㉘' + mode + '写しを保存したこと（戸別ファイルは書き替えていない）を知らせない・「保存が完了しました」と言った → ' + short(alerts2));
      }
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
