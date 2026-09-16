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
   u'''    const scale = Math.min(1, maxEdge / Math.max(w, h));   // 大きくはしない''',
   u'''    const scale = maxEdge / Math.max(w, h);''', "smoke_v161_main.js", "main"),

  # ---- 取り込み口（メイン） ----
  (u"★まとめて取り込みで軽くしない",
   u'''    const fit = await photoFitForStorage(uri);''',
   u'''    const fit = uri;''', "smoke_v161_main.js", "main"),
  (u"★1枚ずつの欄で軽くしない",
   u'''    const uri = await photoFitForStorage(raw);''',
   u'''    const uri = raw;''', "smoke_v161_main.js", "main"),
  (u"★1枚ずつの欄で、写真IDを縮めたあとの中身から付ける",
   u'''    const id = photoContentId(raw);''',
   u'''    const id = photoContentId(await photoFitForStorage(raw));''', "smoke_v161_main.js", "main"),

  # ---- 検証で見つかった穴の砦 ----
  (u"★縮めた結果が真っ白でも確かめずに入れる（写真が白い枠になる）",
   u'''  if(!(await photoLooksLike(dataUri, best.out))) return dataUri;    // 絵が変わっていたら元のまま''',
   u'''  void 0;''', "smoke_v161_main.js", "main"),
  (u"★のっぺりした絵になっても見逃す（ばらつきを見ない）",
   u'''  if(a.sd >= 6 && b.sd < a.sd * 0.35) return false;           // 模様が消えている（のっぺりした絵）''',
   u'''  void 0;''', "smoke_v161_main.js", "main"),
  (u"★明るさがまるで違っても見逃す",
   u'''  if(Math.abs(a.mean - b.mean) > 28) return false;            // 明るさがまるで違う（真っ白など）''',
   u'''  void 0;''', "smoke_v161_main.js", "main"),
  (u"★1枚ずつの欄で、読んでいる間に別の戸別を開いてもそのまま入れる",
   u'''    if(STATE.photos !== target){''', u'''    if(false){''',
   "smoke_v161_main.js", "main"),
  (u"★まとめて取り込みで、写真IDを縮めたあとの中身から付ける（版160以前の同じ写真と別物になる）",
   u'''    const id = photoContentId(uri);
    if(haveIds.has(id)){ dup.push(f.name); continue; }''',
   u'''    const id = photoContentId(await photoFitForStorage(uri));
    if(haveIds.has(id)){ dup.push(f.name); continue; }''',
   "smoke_v161_main.js", "main"),
  (u"★現場入力で、写真IDを縮めたあとの中身から付ける",
   u'''      const id=photoContentId(raw);''',
   u'''      const id=photoContentId(await photoFitForStorage(raw));''',
   "smoke_v161_genba.js", "genba"),
  (u"★特別記録で、写真IDを縮めたあとの中身から付ける",
   u'''        const id = photoContentId(raw);                  // 写真IDは縮める前の中身から''',
   u'''        const id = photoContentId(await photoFitForStorage(raw));''',
   "smoke_v161_genba.js", "genba"),

  # ---- 同じ写真が2つあるときの残し方 ----
  (u"★外部で縮めた写真が、現場に残っている撮りっぱなしで元の重さに戻る",
   u'''  let win = (aFit !== bFit)
    ? (aFit ? a : b)                                   // 片方だけ目安の内 → そちらを残す
    : ((blen>alen) ? b : (alen>blen ? a : (b.from==="genba" ? b : a)));''',
   u'''  let win = (blen>alen) ? b : (alen>blen ? a : (b.from==="genba" ? b : a));''',
   "smoke_v161_main.js", "main"),
  (u"★目安の内どうしでも、小さいほうを残してしまう",
   u'''  let win = (aFit !== bFit)
    ? (aFit ? a : b)                                   // 片方だけ目安の内 → そちらを残す
    : ((blen>alen) ? b : (alen>blen ? a : (b.from==="genba" ? b : a)));''',
   u'''  let win = (aFit !== bFit)
    ? (aFit ? a : b)
    : ((blen<alen) ? b : (alen<blen ? a : (b.from==="genba" ? b : a)));''',
   "smoke_v161_main.js", "main"),
  (u"★残した写真の写真IDを落とす（次の突合で2枚に増える）",
   u'''  if(win.p.id) o.id=win.p.id;''', u'''  void 0;''',
   "smoke_v161_main.js", "main"),

  (u"★ちゃんと縮めた小さい写真をサムネと取り違える（撮りっぱなしに戻る）",
   u'''const PHOTO_KEEP_MIN_BYTES = 16 * 1024;''',
   u'''const PHOTO_KEEP_MIN_BYTES = 200 * 1024;''',
   "smoke_v161_main.js", "main"),
  (u"★サムネの印を見ないで大きさだけで決める（サムネで原本を潰す）",
   u'''  const aFit = !a.thumb && photoIsFitSize(a.p.dataUri);
  const bFit = !b.thumb && photoIsFitSize(b.p.dataUri);''',
   u'''  const aFit = photoIsFitSize(a.p.dataUri);
  const bFit = photoIsFitSize(b.p.dataUri);''',
   "smoke_v161_main.js", "main"),
  (u"★書き出した写真を入れ直すと二重に入る",
   u'''    if(p.id) haveIds.add(p.id);
    haveIds.add(photoContentId(p.dataUri));''',
   u'''    haveIds.add(p.id || photoContentId(p.dataUri));''',
   "smoke_v161_main.js", "main"),
  (u"★写真を1枚ずつ読み直す部品が、開けないときに元のまま返さない",
   u'''  if(!img) return dataUri;                     // 開けない＝元のまま（写真は捨てない）''',
   u'''  if(!img) return "";''',
   "smoke_v161_main.js", "main"),

  # ---- 現場入力 ----
  (u"★現場で撮った写真を軽くしない",
   u'''      const dataUri=await photoFitForStorage(raw);''',
   u'''      const dataUri=raw;''', "smoke_v161_genba.js", "genba"),
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
