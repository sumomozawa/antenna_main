# -*- coding: utf-8 -*-
# 版166 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#
# ここに入れていない直し（わざと外したもの）
#  ・.sb-base / .sb-dest-x の flex:none
#    → これだけ壊しても、最後の歯止めが受け止めるので赤にならない。
#      «縮む順»を整えるための手当てで、はみ出しを止めているのは別の2つ。
#  ・.savebar の max-width:100%; overflow:hidden;
#    → 保存先のボタンの幅の上限（max-width:60%）と最後の歯止めの2つで、もう帯の中に収まっている。
#      これを外しても帯の中身は画面に収まったままで赤にならない。
#      あとから帯に何か足したときの用心として残してあるが、いまは効いていない。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")

# (名前, 壊す前, 壊した後, 試験, どちらのファイル)
CASES = [
  (u"★保存先のボタンが縮まない（長い物件名で画面が横に広がる）",
   u'''    display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:60%;
''',
   u'''''', "smoke_v166_genba.js", "genba"),
  (u"★保存先の名前を「…」で切らない",
   u'''  .sb-dest-n{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }''',
   u'''  .sb-dest-n{ }''', "smoke_v166_genba.js", "genba"),
  (u"★切った名前の全部を、押したときの説明に残さない",
   u'''      ? \'<button type="button" class="sb-dest" id="sb-dest" title="入れる場所： 「\' + esc(saveHintName())''',
   u'''      ? \'<button type="button" class="sb-dest" id="sb-dest" title="入れる場所： 「\' + ""''',
   "smoke_v166_genba.js", "genba"),
  (u"★最後の歯止めを外す（画面より広い物が1つ混ざると横に動く）",
   u'''  html,body{margin:0; padding:0; overflow-x:clip;}''',
   u'''  html,body{margin:0; padding:0;}''', "smoke_v166_genba.js", "genba"),
  (u"★歯止めを clip ではなく hidden にする（上の帯の貼り付きが壊れる）",
   u'''  html,body{margin:0; padding:0; overflow-x:clip;}''',
   u'''  html,body{margin:0; padding:0; overflow-x:hidden;}''', "smoke_v166_genba.js", "genba"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
red = 0; n_run = 0
for name, old, new, test, which in CASES:
    if _only and _only not in name: continue
    n_run += 1
    src, OUT = (GENBA, OUTG) if which == "genba" else (MAIN, OUTM)
    base = io.open(src, encoding="utf-8", newline="").read()
    o, n = CR(old), CR(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); continue
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    r = subprocess.run(["node", SP + test, "file://" + OUT], capture_output=True, text=True, timeout=900)
    last = [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")][:1]
    isred = r.returncode != 0
    if isred: red += 1
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:110] for x in last))
print("=== 赤 %d / %d ===" % (red, n_run))
