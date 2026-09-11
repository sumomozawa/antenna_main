# 試験（現場入力・版156）

アプリ本体（`index.html`）は**ビルド無し・npm無し**のままです。ここに入っているのは
**試験だけ**で、アプリの動きには一切関わりません。

## 用意（1回だけ）
この場所で

    npm install playwright-core

Chromium は環境に入っているものを自動で探します（`/opt/pw-browsers/…`）。
別の場所にあるときは `CHROME=/path/to/chrome` を付けてください。

3つのリポジトリ（antenna_main / antenna_genba / antenna_viewer）が
**隣どうしに置いてある**前提です。別の場所のときは、試験の引数で渡せます。

    node smoke_pcbase.js file:///path/to/antenna_genba/index.html

## 走らせ方

    ./全件.sh            # まとめて。結果は 全件.out
    node smoke_pcbase.js # 1本だけ

| ファイル | 見ているもの |
|---|---|
| `smoke_pcbase.js` | 版156 の決まりそのもの（控えで3つ見比べる・写真・完了の取り消し） |
| `smoke_v156_ui.js` | 画面がふつうに動くか（節・入力・工程・台帳・保存バー・保存） |
| `smoke_v156_save.js` | 1件ずつの保存の4つの道（フォルダ・窓・共有・ダウンロード） |
| `smoke_v156_bulk.js` | まとめて保存・全部保存し直す（ふるいと知らせ） |
| `smoke_v156_guard.js` | PCに中身がある戸別の【見るだけ】の関門・台帳との往復・欄の突き合わせ |

## 変異試験（壊すと赤くなるか）

    python3 変異/版156.py          # 全件
    python3 変異/版156.py 写真      # 名前に「写真」が入るものだけ

1箇所ずつ壊した写しを作って試験を走らせ、**赤くなること**を確かめます。
直したのに試験が通るままなら、その試験は効いていません。

## 構文チェック

    python3 syn.py ../../index.html
