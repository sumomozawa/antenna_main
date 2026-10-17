# -*- coding: utf-8 -*-
# 版181（組 m-apt）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   🏢 マンション管理の「まとめて消す」（aptMgStrayMerge・aptMgMovePhotos）と「🗑 消す（中身なし）」（aptMgStrayDrop）・
#   行を一覧から外す（aptMgRemoveRow）で、写真が減る・ファイルを消す道を塞いだ。
#   ・まとめる先を開いていた画面・消した行を開いていた画面と、行・ファイルのつなぎを外す（古い画面の保存で移した写真を消さない）
#   ・帯の外の行とまとめる先が同じファイルなら、そのファイルを消さない（別の掴み方のフォルダも isSameEntry で見る）
#   ・帯の外の行にだけある写真（ファイルにまだ無い）も移す
#   ・暗号をかけた戸別（行・読んだ中身）はここで扱わない
#   ・まとめる先の行で直した名前・調書の印・画面で消した写真を、ファイルの中身に戻さない（移した写真は必ず持たせる）
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main_m-apt.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v181_m_apt_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  (u"★消した行を開いていた画面の 💾 上書き保存 の行き先（_loadedOrigin）を残す（古い画面がまとめる先の引き取ったファイルを上書き）",
   u'''    try { rtReleaseLock(row); } catch(_){}
    _editingRow = null; _loadedOrigin = null;''',
   u'''    try { rtReleaseLock(row); } catch(_){}
    _editingRow = null;''', TM, "main", u"F"),
  (u"★まとめる先を開いていた画面と行のつなぎを外さない（古い画面の保存で移した写真が消える）",
   u'''      try { rtReleaseLock(t); } catch(_){}
      _editingRow = null; _loadedOrigin = null;''',
   u'''      try { rtReleaseLock(t); } catch(_){}''', TM, "main", u"A1,A2,A3,A4"),
  (u"★帯の外の行とまとめる先が同じファイルでも、帯の外の行のファイルを消す（aptMgMovePhotos）",
   u'''    if(strayHasFile && !sameFile){''',
   u'''    if(strayHasFile){''', TM, "main", u"B1,B2"),
  (u"★同じファイルかを見ずに、まとめたあと帯の外の行のファイルを消す（aptMgStrayMerge・別の掴み方のフォルダ）",
   u'''    if(info.hasFile && r._dir && r._name && !ph.keepFile && !(t._dir === r._dir && t._name === r._name)){''',
   u'''    if(info.hasFile && r._dir && r._name && !(t._dir === r._dir && t._name === r._name)){''', TM, "main", u"B4"),
  (u"★同じファイルかを、フォルダの掴み方が同じときしか見ない（別に掴んだ同じフォルダを見抜けない）",
   u'''    const sameDir = a._dir === b._dir || (typeof a._dir.isSameEntry === "function" && await a._dir.isSameEntry(b._dir));''',
   u'''    const sameDir = a._dir === b._dir;''', TM, "main", u"B4"),
  (u"★同じファイルの写真まで「移しました」と数える",
   u'''  const strayFilePhotos = sameFile ? [] : strayPhotos;''',
   u'''  const strayFilePhotos = strayPhotos;''', TM, "main", u"B1"),
  (u"★🗑 消す（中身なし）で、まとめる先と同じファイルでも「ファイルごと消す」を出す",
   u'''  const sameFile = !!(info.hasFile && info.target && (await aptMgSameFile(r, info.target)));''',
   u'''  const sameFile = false;''', TM, "main", u"B3"),
  (u"★帯の外の行にだけある写真（ファイルにまだ無い）を移さない",
   u'''      .filter(x => x && x.dataUri && !have.has(keyOf(x)) && !(sThumb && !x.id));''',
   u'''      .filter(x => false);''', TM, "main", u"C1,C2"),
  (u"★まとめる先にもファイルがあるとき、帯の外の行にだけある写真をそのファイルへ書かない",
   u'''      { photos: strayExtra, thumb: sThumb },
      { photos: own, thumb: !!((target.data || {}).chosho_photos_thumb) } ]);''',
   u'''      { photos: own, thumb: !!((target.data || {}).chosho_photos_thumb) } ]);''', TM, "main", u"C1"),
  (u"★まとめる先がファイルを引き取るとき、帯の外の行にだけある写真しか無ければそのファイルへ書かない",
   u'''    if(own.length || strayExtra.length){''',
   u'''    if(own.length){''', TM, "main", u"C2"),
  (u"★暗号をかけた行（ファイル無しの物件の行など）でも、まとめて消す",
   u'''  if(r.fileType !== "plain" || t.fileType !== "plain"){''',
   u'''  if(false){''', TM, "main", u"D5"),
  (u"★帯の外の行のファイルの中身が暗号（.hyb）でも、平文として読む（写真0枚に見えてファイルを消す）",
   u'''    encStop(sj, stray._name);
''', u'''''', TM, "main", u"D4"),
  (u"★まとめる先のファイルの中身が暗号（.hyb）でも、外側へ平文で写真を書く",
   u'''    encStop(tj, target._name);
''', u'''''', TM, "main", u"D3"),
  (u"★まとめる先の行の写真を、ファイルとの和集合で置き換える（直した名前・印が戻る・消した写真が戻る）",
   u'''    const known = !fromFile && !!target._photosKnown && !target._slim''',
   u'''    const known = false && !fromFile && !!target._photosKnown && !target._slim''', TM, "main", u"E"),
  (u"★まとめる先で消した写真と同じ写真を帯の外の行から移しても、まとめる先の行に持たせない（次の保存で消える）",
   u'''            .filter(p => p && (!photoSeenBy(target, p) || (p.dataUri && movedKeys.has(keyOf(p))))))''',
   u'''            .filter(p => p && !photoSeenBy(target, p)))''', TM, "main", u"E2"),
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
