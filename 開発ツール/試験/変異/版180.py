# -*- coding: utf-8 -*-
# 版180 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   まだほどいていない暗号の戸別を開いたとき、一覧の行の伏せ字（★★★★★）・作り物の値を、ほどいた中身にかぶせない（lgOverlayLedger）。
#   ・.hyb：暗号の欄（氏名・電話・住所）はかぶせない。暗号でない欄・受付台帳の控えは今までどおりかぶせる
#   ・.enc（全暗号化）：何もかぶせない（一覧の行は作り物で、受付台帳の控えも本当の管理番号で引けない）
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v180_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  (u"★まだほどいていない .hyb にも、一覧の行の伏せ字（氏名・電話・住所の ★★★★★）をかぶせる",
   u'''    Object.keys(want).forEach(k => { if(sens.indexOf(k) < 0) fresh[k] = want[k]; });''',
   u'''    Object.keys(want).forEach(k => { fresh[k] = want[k]; });''', TM, "main", u"①"),
  (u"★まだほどいていない .enc にも、一覧の行の作り物の値（管理番号・住所・日程・空の備考）をかぶせる",
   u'''  if(locked && row.fileType === "full") return fresh;
''', u'''''', TM, "main", u"②"),
  (u"★まだほどいていない .hyb には何もかぶせない（受付台帳の備考などが開いた画面に入らない）",
   u'''  if(locked && row.fileType === "full") return fresh;''',
   u'''  if(locked) return fresh;''', TM, "main", u"①"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
_todo = [c for c in CASES if not _only or _only in c[0] or _only == "メイン"]

def _run(test, args, scene):
    env = dict(os.environ); env["ONLY"] = scene
    try:
        r = subprocess.run(["node", SP + test] + ["file://" + a for a in args], capture_output=True, text=True, timeout=900, env=env)
    except subprocess.TimeoutExpired:
        return 99, ["- 時間切れ"]
    return r.returncode, [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。使う場面だけで先に確かめて、赤なら止める。
sc = ",".join(sorted(set(x for c in _todo for x in c[5].split(","))))
if sc:
    rc, last = _run(TM, [MAIN], sc)
    if rc != 0:
        print("土台が赤（壊す前から試験が通らない）:", TM, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        _s.exit(1)
    print("土台 緑:", TM, flush=True)

red = 0; n_run = 0; green = []
for name, old, new, test, which, sc in _todo:
    base = io.open(MAIN, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); green.append(name); continue
    io.open(OUTM, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    n_run += 1
    rc, last = _run(test, [OUTM], sc)
    isred = rc != 0
    if isred: red += 1
    else: green.append(name)
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
if os.path.exists(OUTM): os.remove(OUTM)
print("=== 赤 %d / %d ===" % (red, n_run))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
