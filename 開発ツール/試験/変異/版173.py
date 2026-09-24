# -*- coding: utf-8 -*-
# 版173 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   #20 PCのエディタで保存しただけのファイルを「下見済み」と読み違えない（MERGE_MAIN_FRESH・mergeFileUntouchedVal）
#   #21 まとめて保存の知らせに、取っていない「TVの台数・部屋」を出さない
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
  (u"★#20 下見済みの判定に、PCの作りたての値を「触っていない」と見なす決まりを使わない",
   u"""      || (!("survey_done" in old) && keys0.some(k => (k in old) && !mergeFileUntouchedVal(k, old[k])));""",
   u"""      || (!("survey_done" in old) && keys0.some(k => (k in old) && !mergeUntouchedVal(k, old[k])));""",
   "smoke_v173_genba.js", "genba"),
  (u"★#20 現場に欄が無い（メインだけが書く tv_power など）欄も、下見の内容に数える",
   u"""  if(isPassthroughKey(k)) return true;           // 現場に欄が無い（メインだけが必ず書く tv_power など）""",
   u"""  void 0;""", "smoke_v173_genba.js", "genba"),
  (u"★#20 メインの作りたての値の表を空にする（side_base_2・mast を下見の内容と読む）",
   u"""const MERGE_MAIN_FRESH = { side_base_2:"side_sb22s", mast:"mast_m182z", mast_2:"mast_m182z" };""",
   u"""const MERGE_MAIN_FRESH = {};""", "smoke_v173_genba.js", "genba"),
  (u"★#20 緩めすぎる（作りたてと違う材料があっても、下見の内容と見なさない）",
   u"""  if(isPassthroughKey(k)) return true;           // 現場に欄が無い（メインだけが必ず書く tv_power など）""",
   u"""  return true;""", "smoke_v173_genba.js", "genba"),
  (u"★#21 TVの台数・部屋で、同じ値の欄も入れ替える（取っていないのに知らせる）",
   u"""      if(JSON.stringify(state[k]) === JSON.stringify(old[k])) return;""",
   u"""      void 0;""", "smoke_v173_genba.js", "genba"),
  (u"★#21 取ったかどうかに関わらず「TVの台数・部屋」を知らせる",
   u"""    if(took) out.kept.push("TVの台数・部屋");""",
   u"""    out.kept.push("TVの台数・部屋");""", "smoke_v173_genba.js", "genba"),
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
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:120] for x in last))
print("=== 赤 %d / %d ===" % (red, n_run))
