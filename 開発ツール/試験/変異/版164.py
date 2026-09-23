# -*- coding: utf-8 -*-
# 版164 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  (u"★📂 でまとめて選べない（1つずつしか選べない）",
   u'''<input type="file" id="import-file" accept=".json,application/json,*/*" multiple style="display:none;">''',
   u'''<input type="file" id="import-file" accept=".json,application/json,*/*" style="display:none;">''',
   "smoke_v164_genba.js", "genba"),
  (u"★まとめて選んでも一覧に出ない（最初の1つだけ開く）",
   u'''  if(all.length === 1){ await openJsonFile(all[0]); return; }   // 1つだけ＝そのまま開く''',
   u'''  { await openJsonFile(all[0]); return; }''',
   "smoke_v164_genba.js", "genba"),
  (u"★管理番号の順に並ばない（探しにくい）",
   u'''               .sort((a,b) => String(a.mgmt).localeCompare(String(b.mgmt), "ja", { numeric:true }));''',
   u'''               .reverse();''',
   "smoke_v164_genba.js", "genba"),
  (u"★氏名・住所で絞り込めない（管理番号だけ）",
   u'''    const hay = toHalfWidthAn(o.mgmt + " " + (info.name || "") + " " + (info.addr || "")).toLowerCase();''',
   u'''    const hay = toHalfWidthAn(String(o.mgmt)).toLowerCase();''',
   "smoke_v164_genba.js", "genba"),
  (u"★受付台帳の氏名・住所を出さない",
   u'''    return { name: String(r.name || "").trim(), addr: String(r.addr || "").trim() };''',
   u'''    return null;''',
   "smoke_v164_genba.js", "genba"),
  (u"★一覧から1つ開くと、選んだ一覧が消える（何戸も回れない）",
   u'''      if(o && o.file) await openJsonFile(o.file);''',
   u'''      if(o && o.file){ await openJsonFile(o.file); _openPick = []; renderOpenPick(); }''',
   "smoke_v164_genba.js", "genba"),
  (u"★入れる場所の名前を、また手で打たせる",
   u'''    const picked = await uiPickName("\U0001F4C1 \u5165\u308c\u308b\u5834\u6240\u306e\u540d\u524d",''',
   u'''    const picked = (window.prompt("\u5165\u308c\u308b\u5834\u6240\u306e\u540d\u524d", now) || ""); await Promise.resolve(0 &&''',
   "smoke_v164_genba.js", "genba"),
  (u"★受付台帳の物件名を候補に出さない",
   u'''    if(proj) add(proj + " ＞ リスト", proj + "/リスト", "受付台帳の物件名の中の「リスト」（決まりの置き場所）", "");''',
   u'''      void proj;''',
   "smoke_v164_genba.js", "genba"),
  (u"★「自分で書く」の逃げ道を無くす",
   u'''    add("\u81ea\u5206\u3067\u66f8\u304f", "\\u0000type", "\u5019\u88dc\u306b\u7121\u3044\u3068\u304d\u306f\u3053\u3061\u3089", "type");''',
   u'''    void 0;''',
   "smoke_v164_genba.js", "genba"),
  (u"★選んだ名前を覚えない（次から候補に出ない）",
   u'''    saveHintRemember(v);''', u'''    void 0;''',
   "smoke_v164_genba.js", "genba"),
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
