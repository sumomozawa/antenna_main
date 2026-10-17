# -*- coding: utf-8 -*-
# 版181（保存まわりの言葉と見た目・現場入力）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる
#   ・見るだけの帯：📚 の字・すぐ下の一行・📮／このまま新しく入力する を閉じた「困ったとき」へ
#   ・履歴・読込の窓：📚 の字・📮 を閉じた「困ったとき」へ
#   ・保存が止まったときの窓：📮 を閉じた「困ったとき」へ
#   ・受付台帳：「🔍 絞り込みを外して、すべて表示」（小さい白地）・「💾 まだ保存していない N件 をまとめて保存」とすぐ下の一行・
#     「全部保存し直す」はふだん閉じる
#   ・まとめて保存の確かめの窓：【変わること】【変わらないこと】【保存する戸別】【気をつけること】・ほかの端末の戸別の文
#   名前の一部を引数に渡すとそれだけ走る。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main_ui.html")
OUTG = os.path.join(HERE, "mut_genba_ui.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TG = "smoke_v181_ui_genba.js"

CASES = [
  (u"★帯の 📚 を前の字（まとめて選んで、この戸別を出す）に戻す",
   u"""    +     (canDir ? "📂 ファイルを選んで読み込む" : "📚 ファイルをまとめて読み込んで、この戸別を探す") + '</button>'""",
   u"""    +     (canDir ? "📂 ファイルを選んで読み込む" : "📚 まとめて選んで、この戸別を出す") + '</button>'""", TG, "genba", u"①"),
  (u"★帯の 📚 のすぐ下に、何が起きるかの一行を出さない",
   u"""         : ('<div class="pcg-sub">ファイルを選ぶ画面で <b>すべて選択</b>（または今日回るぶん）を選ぶと、'""",
   u"""         : ('<div class="pcg-sub" hidden>ファイルを選ぶ画面で <b>すべて選択</b>（または今日回るぶん）を選ぶと、'""", TG, "genba", u"①"),
  (u"★帯の「困ったとき」をはじめから開いておく（📮 が目立つ）",
   u"""    + '<details class="pcg-trouble"><summary>困ったとき（PCのファイルがどうしても読み込めない）</summary>'""",
   u"""    + '<details class="pcg-trouble" open><summary>困ったとき（PCのファイルがどうしても読み込めない）</summary>'""", TG, "genba", u"①"),
  (u"★帯の 📮 を前の字（入力して事務所に預ける）に戻す",
   u"""    +     '<button type="button" id="pcg-side" class="side">📮 事務所に預ける（別のファイルで送る・PCのファイルはそのまま）</button>'""",
   u"""    +     '<button type="button" id="pcg-side" class="side">📮 入力して事務所に預ける</button>'""", TG, "genba", u"①"),
  (u"★履歴の「困ったとき」をはじめから開いておく",
   u"""       <details class="d-trouble"><summary>困ったとき（PCのファイルに入ったか分からない）</summary>""",
   u"""       <details class="d-trouble" open><summary>困ったとき（PCのファイルに入ったか分からない）</summary>""", TG, "genba", u"③"),
  (u"★履歴の 📚 を前の字（まとめて選んで、管理番号で絞り込む）に戻す",
   u"""font-size:15px; margin-bottom:8px;">📚 ファイルをまとめて読み込んで、管理番号で探す</button>""",
   u"""font-size:15px; margin-bottom:8px;">📚 まとめて選んで、管理番号で絞り込む</button>""", TG, "genba", u"③"),
  (u"★保存が止まったときの 📮 を「困ったとき」にしまわない",
   u"""      : ('<details class="save-ov-trouble"><summary>困ったとき（どうしても保存できない）</summary>' + sideIn + '</details>');""",
   u"""      : sideIn;""", TG, "genba", u"④"),
  (u"★「すべて表示」を前の字（すべて出す）に戻す",
   u"""<button type="button" id="rc-showall">🔍 絞り込みを外して、すべて表示（${rows.length}件）</button></div>`""",
   u"""<button type="button" id="rc-showall">すべて出す（${rows.length}件）</button></div>`""", TG, "genba", u"⑤"),
  (u"★「すべて表示」を幅いっぱいのボタンにする（大げさに見える）",
   u"""  #rc-showall{display:inline-block; max-width:100%; margin-top:7px; min-height:36px; padding:6px 12px;""",
   u"""  #rc-showall{display:block; width:100%; margin-top:7px; min-height:36px; padding:6px 12px;""", TG, "genba", u"⑤"),
  (u"★「すべて表示」を色付きの塗りつぶしにする",
   u"""    border:1px solid var(--accent); border-radius:9px; background:#fff; color:var(--accent);""",
   u"""    border:1px solid var(--accent); border-radius:9px; background:var(--accent); color:#fff;""", TG, "genba", u"⑤"),
  (u"★まとめて保存のボタンを前の字（まとめて保存（N件））に戻す",
   u"""      + `<button id="rc-saveall" class="rc-saveall" data-label="💾 まだ保存していない ${notHanded}件 をまとめて保存">💾 まだ保存していない ${notHanded}件 をまとめて保存</button>`""",
   u"""      + `<button id="rc-saveall" class="rc-saveall" data-label="まとめて保存（${notHanded}件）">まとめて保存（${notHanded}件）</button>`""", TG, "genba", u"⑥"),
  (u"★「写真以外の入力はPCへ渡りません」（本当でない）に戻す",
   u"""      + `保存しないと、入力も写真もPCへ渡りません。`""",
   u"""      + `保存しないと、写真以外の入力はPCへ渡りません。`""", TG, "genba", u"⑥"),
  (u"★まとめて保存のすぐ下に、読み合わせてから書くことを言わない",
   u"""  const bulkHow = bulkByDir""", u"""  const bulkHow = false""", TG, "genba", u"⑥"),
  (u"★「全部保存し直す」をはじめから開いておく（重いボタンが目立つ）",
   u"""    ? `<details class="rc-redo">` + redoSum
      + `<div class="rc-redo-sub">ふだんは上の""",
   u"""    ? `<details class="rc-redo" open>` + redoSum
      + `<div class="rc-redo-sub">ふだんは上の""", TG, "genba", u"⑥"),
  (u"★「全部保存し直す」で時間がかかることを言わない",
   u"""      + `<button id="rc-saveall2" data-label="💾 全部保存し直す（${redoCnt}件・時間がかかります）">💾 全部保存し直す（${redoCnt}件・時間がかかります）</button>`""",
   u"""      + `<button id="rc-saveall2" data-label="全部保存し直す（${redoCnt}件）">全部保存し直す（${redoCnt}件）</button>`""", TG, "genba", u"⑥"),
  (u"★まとめて保存の確かめの窓に【変わらないこと】を出さない",
   u"""       + "【変わらないこと】\\n\"""", u"""       + "\\n\"""", TG, "genba", u"⑦"),
  (u"★まとめて保存の確かめの窓に【気をつけること】の見出しを出さない",
   u"""      + (cautions ? ("\\n\\n【気をつけること】" + cautions) : "")""",
   u"""      + (cautions ? cautions : "")""", TG, "genba", u"⑦"),
  (u"★ほかの端末の戸別で「上書きすると…写真などはファイルから消えます」（本当でない）に戻す",
   u"""    ? ("\\n\\n※ このうち " + otherCnt + "件は、ほかの端末も保存している戸別です。\\n\"""",
   u"""    ? ("\\n\\n※ このうち " + otherCnt + "件は、他の端末が保存したファイルです。\\n上書きすると、その端末で撮った写真などはファイルから消えます。\\n\"""", TG, "genba", u"⑦"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
_todo = [c for c in CASES if not _only or _only in c[0] or (_only == "現場" and c[4] == "genba") or (_only == "メイン" and c[4] == "main")]

def _run(test, args, scene):
    env = dict(os.environ); env["SCENE"] = scene; env["ONLY"] = scene
    try:
        r = subprocess.run(["node", SP + test] + ["file://" + a for a in args], capture_output=True, text=True, timeout=900, env=env)
    except subprocess.TimeoutExpired:
        return 99, ["- 時間切れ"]
    return r.returncode, [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。使う場面だけで先に確かめて、赤なら止める。
for which, test, src in (("genba", TG, GENBA),):
    sc = ",".join(sorted(set(x for c in _todo if c[4] == which and c[3] == test for x in c[5].split(","))))
    if not sc: continue
    rc, last = _run(test, [src], sc)
    if rc != 0:
        print("土台が赤（壊す前から試験が通らない）:", test, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        _s.exit(1)
    print("土台 緑:", test, flush=True)

red = 0; n_run = 0; green = []
for name, old, new, test, which, sc in _todo:
    src, OUT = {"genba": (GENBA, OUTG), "main": (MAIN, OUTM)}[which]
    base = io.open(src, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); green.append(name); continue
    n_run += 1
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    rc, last = _run(test, [OUT], sc)
    isred = rc != 0
    if isred: red += 1
    else: green.append(name)
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
for p in (OUTM, OUTG):
    if os.path.exists(p): os.remove(p)
print("=== 赤 %d / %d ===" % (red, n_run))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
