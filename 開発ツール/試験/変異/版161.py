# -*- coding: utf-8 -*-
# 版161 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  # ---- 軽くする仕組みそのもの（メイン） ----
  (u"★もともと目安の内の写真まで作り直す（保存のたびに画質が落ちる）",
   u'''  if(photoBytesOf(dataUri) <= PHOTO_FIT_MAX_BYTES) return dataUri;   // もともと目安の内＝触らない''',
   u'''  if(false) return dataUri;''', "smoke_v161_main.js", "main"),
  (u"★開けない写真を壊して入れる（写真を失う）",
   u'''    if(!out) break;                                                  // 画像として開けない → 元のまま''',
   u'''    if(!out){ tries.push({ out: "", b: 0 }); break; }''', "smoke_v161_main.js", "main"),
  (u"★目安を超えたままの写真を入れてしまう",
   u'''    if(b <= PHOTO_FIT_MAX_BYTES) break;                              // 収まった''',
   u'''    break;''', "smoke_v161_main.js", "main"),
  (u"★必要以上に小さくする（長辺が2048pxでなくなる）",
   u'''const PHOTO_FIT_MAX_EDGE = 2048;''',
   u'''const PHOTO_FIT_MAX_EDGE = 1000;''', "smoke_v161_main.js", "main"),
  (u"★1枚の目安を大きくしすぎる（ファイルが重いまま）",
   u'''const PHOTO_FIT_MAX_BYTES = 1024 * 1024;   // 1枚がこれを超えたら縮める（約1MB）''',
   u'''const PHOTO_FIT_MAX_BYTES = 8 * 1024 * 1024;''', "smoke_v161_main.js", "main"),
  (u"写真を大きく引き伸ばしてしまう",
   u'''        const scale = Math.min(1, maxEdge / Math.max(w, h));   // 大きくはしない''',
   u'''        const scale = maxEdge / Math.max(w, h);''', "smoke_v161_main.js", "main"),

  # ---- 取り込み口（メイン） ----
  (u"★まとめて取り込みで軽くしない",
   u'''    const fit = await photoFitForStorage(uri);''',
   u'''    const fit = uri;''', "smoke_v161_main.js", "main"),
  (u"★まとめて取り込みで、写真IDを軽くする前の中身から付ける（PCと現場の突合が外れる）",
   u'''    const id = photoContentId(fit);''',
   u'''    const id = photoContentId(uri);''', "smoke_v161_main.js", "main"),
  (u"★1枚ずつの欄で軽くしない",
   u'''    const uri = await photoFitForStorage(raw);''',
   u'''    const uri = raw;''', "smoke_v161_main.js", "main"),
  (u"★1枚ずつの欄で、写真IDを軽くする前の中身から付ける",
   u'''    STATE.photos[idx].id = photoContentId(uri); // 撮影/追加時に安定IDを付与''',
   u'''    STATE.photos[idx].id = photoContentId(raw);''', "smoke_v161_main.js", "main"),

  # ---- 現場入力 ----
  (u"★現場で撮った写真を軽くしない",
   u'''      const dataUri=await photoFitForStorage(raw);''',
   u'''      const dataUri=raw;''', "smoke_v161_genba.js", "genba"),
  (u"★現場で撮った写真の写真IDが、入れた中身と合わない",
   u'''      model.chosho_photos.push({label:suggestLabel(model.chosho_photos.length), dataUri, id:photoContentId(dataUri)});''',
   u'''      model.chosho_photos.push({label:suggestLabel(model.chosho_photos.length), dataUri, id:photoContentId(raw)});''',
   "smoke_v161_genba.js", "genba"),
  (u"★特別記録（資材検収など）の写真だけ軽くしない",
   u'''        const dataUri = await photoFitForStorage(raw);   // 大きすぎるものだけ軽くする''',
   u'''        const dataUri = raw;''', "smoke_v161_genba.js", "genba"),
  (u"★現場入力の目安だけPCと違う大きさにする",
   u'''const PHOTO_FIT_MAX_EDGE = 2048;''',
   u'''const PHOTO_FIT_MAX_EDGE = 3000;''', "smoke_v161_genba.js", "genba"),
  (u"★現場入力でも、もともと目安の内の写真まで作り直す",
   u'''  if(photoBytesOf(dataUri) <= PHOTO_FIT_MAX_BYTES) return dataUri;   // もともと目安の内＝触らない''',
   u'''  if(false) return dataUri;''', "smoke_v161_genba.js", "genba"),
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
