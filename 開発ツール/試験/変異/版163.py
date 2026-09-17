# -*- coding: utf-8 -*-
# 版163 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  (u"★撮った日時・場所（Exif）を引き継がない",
   u'''  const withExif = photoCarryExif(best.out, dataUri);   // 撮った日時・場所を引き継ぐ''',
   u'''  const withExif = best.out;''', "smoke_v163_main.js", "main"),
  (u"★向きの印をそのまま移す（縦の写真が二重に回って横倒しになる）",
   u'''    if(!photoExifClearOrientation(seg)) return outDataUri; // 向きを直せない＝付けない（横倒しになる）''',
   u'''    void 0;''', "smoke_v163_main.js", "main"),
  (u"★向きの印の書き替えが、並びの向き（エンディアン）を見ない",
   u'''        if(little){ seg[e + 8] = 1; seg[e + 9] = 0; }
        else { seg[e + 8] = 0; seg[e + 9] = 1; }''',
   u'''        seg[e + 8] = 0; seg[e + 9] = 1;''',
   "smoke_v163_main.js", "main"),
  (u"★現場入力で、撮った日時・場所を引き継がない",
   u'''  const withExif = photoCarryExif(best.out, dataUri);   // 撮った日時・場所を引き継ぐ''',
   u'''  const withExif = best.out;''', "smoke_v163_genba.js", "genba"),
  (u"★現場入力で、向きの印をそのまま移す",
   u'''    if(!photoExifClearOrientation(seg)) return outDataUri; // 向きを直せない＝付けない（横倒しになる）''',
   u'''    void 0;''', "smoke_v163_genba.js", "genba"),
  (u"★Exif の大きさの上限を狭めすぎて、本物の Exif を通さない",
   u'''    if(!seg || seg.length < 12 || seg.length > 128 * 1024) return null;   // 念のための上限（JPEGの印は長さが2バイト＝実際は約64KBまで）''',
   u'''    if(!seg || seg.length < 12 || seg.length > 16) return null;''',
   "smoke_v163_main.js", "main"),
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
