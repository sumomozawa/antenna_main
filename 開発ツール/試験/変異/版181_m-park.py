# -*- coding: utf-8 -*-
# 版181（組 m-park）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   戸別ファイルに預けた元の写真を読み直せないときの知らせ（まとめ印刷・写真の書き出し・💾 反映）・📉 と預けた縮小版・
#   📄 ファイルで読んだ戸別の案内・縮小版の控え（工事フォルダと一覧のフォルダが違うとき）・Excel 取込で暗号の戸別の住所を書かない。
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main_m-park.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v181_m_park_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  (u"★まとめ印刷：預けた元の写真を読み直せなかった戸別を数えない（黙って小さい写真で印刷する）",
   u'''                        if(up.miss) parkMiss.push(''',
   u'''                        if(false && up.miss) parkMiss.push(''', TM, "main", u"①c"),
  (u"★まとめ印刷：知らせで「キャンセル」しても印刷する",
   u'''      + "\\nこのまま出しますか？")){ host.innerHTML = ""; return; }''',
   u'''      + "\\nこのまま出しますか？")){ }''', TM, "main", u"①d"),
  (u"★写真の書き出し：画面の預けた縮小版を、書き出す前に読み直さない",
   u'''    if(up) photos = up.photos.filter(p => p && p.dataUri);''',
   u'''    if(false) photos = up.photos.filter(p => p && p.dataUri);''', TM, "main", u"②a"),
  (u"★写真の書き出し：終わりの知らせに「うち N 枚は小さい写真」を出さない",
   u'''    + (left ? ("・うち " + left + " 枚は小さい写真（元の写真ではありません）\\n") : "")''',
   u'''    + ""''', TM, "main", u"②b"),
  (u"★写真の書き出し：知らせで「キャンセル」しても書き出す",
   u'''        + "このまま書き出しますか？（同期中のときは、少し待って開き直すと元の写真で書き出せます）")) return;''',
   u'''        + "このまま書き出しますか？（同期中のときは、少し待って開き直すと元の写真で書き出せます）")){}''', TM, "main", u"②c"),
  (u"★読み直し：預けたファイルが無いことを覚えない（ファイルが無いのに「少し待って」）",
   u'''files.set(fh, await photoFileRead(fh, why)); if(why.notFound) lost.add(fh); }''',
   u'''files.set(fh, await photoFileRead(fh, why)); }''', TM, "main", u"③a"),
  (u"★読み直し：ファイルが無い（NotFoundError）を知らせない（photoFileRead）",
   u'''  catch(e){ if(why && e && e.name === "NotFoundError") why.notFound = true; return undefined; }''',
   u'''  catch(e){ return undefined; }''', TM, "main", u"③a"),
  (u"★読み直し：ファイルは読めたのにその写真が無いとき、gone に数えない",
   u'''    if(!f){ miss++; if(lost.has(e.fh) || (j && typeof j === "object")) gone++; return p; }''',
   u'''    if(!f){ miss++; if(lost.has(e.fh)) gone++; return p; }''', TM, "main", u"③b"),
  (u"★読み直し：いま読めないだけでも gone に数える（同期中なのに「見つかりません」）",
   u'''    if(!f){ miss++; if(lost.has(e.fh) || (j && typeof j === "object")) gone++; return p; }''',
   u'''    if(!f){ miss++; gone++; return p; }''', TM, "main", u"③c"),
  (u"★💾 反映：ファイルが無いときも「少し待ってから」と言う",
   u'''          + (tb.gone ? "元の写真の入ったファイル''',
   u'''          + (false ? "元の写真の入ったファイル''', TM, "main", u"③a"),
  (u"★📉：預けた縮小版も、軽くした元の写真に差し替える",
   u'''byId.has(p.id) && !photoIsParkedThumb(row, p)) p.dataUri = byId.get(p.id); });''',
   u'''byId.has(p.id)) p.dataUri = byId.get(p.id); });''', TM, "main", u"④"),
  (u"★開けないときの案内：📄 ファイルで読んだ戸別にも「少し待って」と言う",
   u'''  const fromPick = !!(row && row.srcFile && !row.fileHandle);''',
   u'''  const fromPick = false;''', TM, "main", u"⑤a"),
  (u"★開けないときの案内：📁 フォルダで読んだ戸別にも「📄 ファイルで選び直す」と言う",
   u'''  const fromPick = !!(row && row.srcFile && !row.fileHandle);''',
   u'''  const fromPick = true;''', TM, "main", u"⑤c"),
  (u"★縮小版の控え：工事フォルダから見た名前で控えを引かない（読み直すたびに作り直す）",
   u'''      if(!Array.isArray(r._thumbs) && r._photoCount > 0){ const m = thumbMemoGet(r.file, r.lastModified, r._photoCount); if(m) r._thumbs = m; }''',
   u'''''', TM, "main", u"⑥"),
  (u"★Excel 取込：暗号の戸別にも住所を書く（平文で残り、開くと元に戻る）",
   u'''      if(lgEditableField(row, "addr")) lgWriteCaseField(row, "addr", e.excel.addr, { keepStatus: true });''',
   u'''      if(true) lgWriteCaseField(row, "addr", e.excel.addr, { keepStatus: true });''', TM, "main", u"⑦"),
  (u"★Excel 取込：暗号の戸別の住所を変えなかったことを知らせない",
   u'''      else if(String((row.data && row.data.chosho_cust_addr) || "") !== e.excel.addr) addrLocked++;''',
   u'''''', TM, "main", u"⑦"),
  (u"★Excel 取込：下見の窓で、暗号の戸別にも住所を選ばせる",
   u'''      if(a1 !== a2 && !lgEditableField(t, "addr")){''',
   u'''      if(false){''', TM, "main", u"⑦"),
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
