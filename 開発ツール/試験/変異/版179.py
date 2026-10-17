# -*- coding: utf-8 -*-
# 版179 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   アパートの「まとめて消す」（aptMgMovePhotos）で写真が消える道を塞いだ直し。
#   ・まとめる先にファイルが無く、帯の外の行にファイルがある：まとめる先が行に持っている写真を、そのファイルへ和集合で入れる
#     （書く → 読み返す → 確かめる。足りなければ元の中身に戻す）。行にもファイルと同じ写真を全部持たせる（「ファイルから読む」形にしない）
#   ・まとめる先にもファイルがある：行にだけある写真も、そのファイルへ入れる。もともと「ファイルから読む」行はそのまま
#   ・どちらにもファイルが無い：物件の縮小版を作り直す・この端末で直した印を付ける
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v179_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  # ======== まとめる先の写真をファイルへ入れる ========
  (u"★まとめる先が行に持っている写真を、ファイルへ入れない",
   u'''      .filter(x => x && x.dataUri && !have.has(keyOf(x)) && !(ownFile && thumbish && !x.id));''',
   u'''      .filter(x => false);''', TM, "main", u"①a,①b,③a"),
  (u"★まとめる先にファイルが無いとき、まとめる先の写真を引き取るファイルへ書かない",
   u'''    let back = sj;
    if(own.length || strayExtra.length){''',
   u'''    let back = sj;
    if(false){''', TM, "main", u"①a,①b"),   # 版181（m-apt）：帯の外の行にだけある写真も書くので目印を合わせた
  (u"★写真IDの無い物件の縮小版も、まとめる先のファイルへ足す（同じ写真が2枚になる）",
   u''' && !(ownFile && thumbish && !x.id));''',
   u''');''', TM, "main", u"③c"),
  (u"★まとめる先にファイルが無いときも、写真IDの無い縮小版を足さない（そこにしか無い古い写真が消える）",
   u'''    const own = ownLack(strayPhotos, false);''',
   u'''    const own = ownLack(strayPhotos, true);''', TM, "main", u"①b"),
  # ======== 書く → 読み返す → 確かめる ========
  (u"★書いたあと読み返して、足りなくても気づかない",
   u'''    const miss = lack(back.chosho_photos);''',
   u'''    const miss = 0;''', TM, "main", u"①d"),
  (u"★読み返して足りないとき、ファイルを元の中身に戻さない",
   u'''      try { const w2 = await fh.createWritable(); await w2.write(text0); await w2.close(); undone = true; } catch(_){}''',
   u'''      undone = true;''', TM, "main", u"①d"),
  (u"ファイルの名前だけの空の枠を残さない",
   u'''    if(slots.length) merged = merged.concat(slots);''',
   u'''''', TM, "main", u"①a,③a"),
  # ======== 行の写真をファイルとそろえる ========
  (u"★まとめたあと、行の写真をファイルとそろえない（古い写真のまま）",
   u'''      d.chosho_photos = known
        ? photosKeepFileOnly(d0.chosho_photos, (Array.isArray(back.chosho_photos) ? back.chosho_photos : [])
            .filter(p => p && (!photoSeenBy(target, p) || (p.dataUri && movedKeys.has(keyOf(p))))))
        : back.chosho_photos;
''',
   u'''''', TM, "main", u"①a,③a"),   # 版181（m-apt）：行の写真を当てにしてよい行は行の写真に足す形にしたので目印を合わせた
  (u"★まとめる先にファイルが無いとき、行を「ファイルから読む」形にする（行の写真が出ない）",
   u'''    settle(back, false);''',
   u'''    settle(back, true);''', TM, "main", u"①a"),
  (u"★まとめる先にファイルがあるとき、いつも「ファイルから読む」形にする（行にだけある図面の直しが開いて出ない）",
   u'''    const own = ownLack(tj.chosho_photos, true), fromFile = !!(target._slim && target.fileHandle);''',
   u'''    const own = ownLack(tj.chosho_photos, true), fromFile = true;''', TM, "main", u"③a"),
  (u"「ファイルから読む」行にも写真を持たせる",
   u'''    const own = ownLack(tj.chosho_photos, true), fromFile = !!(target._slim && target.fileHandle);''',
   u'''    const own = ownLack(tj.chosho_photos, true), fromFile = false;''', TM, "main", u"③b"),
  (u"★ファイルへ入れたあと、物件の縮小版を作り直さない",
   u'''    target._photoCount = cnt(fromFile ? back.chosho_photos : d.chosho_photos);
    target._thumbs = undefined;''',
   u'''    target._photoCount = cnt(fromFile ? back.chosho_photos : d.chosho_photos);''', TM, "main", u"①a,③a"),   # 版181（m-apt）：目印を合わせた
  (u"★ファイルへ入れたあと、この端末で直した印を付けない（別のPCの保存とまとめると前の写真に戻る）",
   u'''    target._thumbs = undefined;
    try { markCaseEdited(target); } catch(_){}
  };''',
   u'''    target._thumbs = undefined;
  };''', TM, "main", u"①a,③a"),
  # ======== どちらにもファイルが無い ========
  (u"★どちらにもファイルが無いとき、物件の縮小版を作り直さない（移した写真が物件に入らない）",
   u'''  target._thumbs = undefined;             // 物件の縮小版は、合わせた写真から作り直す（古いままだと移した写真が物件に入らない）
''',
   u'''''', TM, "main", u"②"),
  (u"★どちらにもファイルが無いとき、この端末で直した印を付けない",
   u'''  try { markCaseEdited(target); } catch(_){}   // 別のPCの保存とまとめても、この行を採る
''',
   u'''''', TM, "main", u"②"),
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
