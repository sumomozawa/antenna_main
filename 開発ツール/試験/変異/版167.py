# -*- coding: utf-8 -*-
# 版167 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版167 は「どんな端末の字の幅でも、上部が横にはみ出さない」ようにした版。
#   試験機の日本語フォントは実機（iPhone）より狭いので、字を 100〜180% に太らせて測る。
#
# ここに入れていない直し（わざと外したもの。壊しても赤にならない理由つき）
#  ・.savebar .sb-file / .sb-base の「縮む」指定（flex:0 1 auto; min-width:0; overflow:hidden）
#    → 保存バーが折り返す（flex-wrap:wrap）ようになったので、縮まない物は
#      はみ出さずに次の行へ回るだけ。«何行になるか»は変わるが、はみ出しは起きない。
#      はみ出しを止めているのは「折り返す」と「狭い画面では保存先を1行まるごと」の2つ。
#  ・header button の max-width:52% / flex:0 1 auto
#    → いまの上の帯にボタンは「保存」1つだけで、その字の幅は 52% にとうてい届かない。
#      （管理番号の側が flex:1; overflow:hidden で先に縮む）
#      あとで上の帯にボタンを足したときの用心として残してあるが、いまは効いていない。
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
  (u"★保存バーが折り返さない（字の広い端末で1行に詰め込んで、はみ出す）",
   u'''    max-width:100%; overflow:hidden; flex-wrap:wrap; row-gap:3px; align-content:center;''',
   u'''    max-width:100%; overflow:hidden;''',
   "smoke_v167_genba.js", "genba"),
  (u"★狭い画面で、保存先を1行まるごとに回さない",
   u'''  @media (max-width: 460px){
    .savebar .sb-dest{ order:9; flex:1 1 100%; max-width:100%; margin-left:0; }
  }''',
   u'''  @media (max-width: 460px){
  }''',
   "smoke_v167_genba.js", "genba"),
  (u"★予定カレンダーの行を block にしない（span には「…」が効かず、画面の外へ出る）",
   u'''  .cal-ev .cal-ev-t{display:block; font-weight:700; font-size:14px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  .cal-ev .cal-ev-s{display:block; font-size:11.5px; color:var(--sub);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}''',
   u'''  .cal-ev .cal-ev-t{font-weight:700; font-size:14px;}
  .cal-ev .cal-ev-s{font-size:11.5px; color:var(--sub);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}''',
   "smoke_v167_genba.js", "genba"),
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
