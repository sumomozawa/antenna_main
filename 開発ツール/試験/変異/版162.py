# -*- coding: utf-8 -*-
# 版162 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  # ---- まとめて軽くする（メイン） ----
  (u"★縮めた写真が開けるか確かめずに入れる",
   u'''    if(!(await photoCheckDecodable(out))){ noShrink++; continue; }  // 開けないものは入れない''',
   u'''    void 0;''', "smoke_v162_main.js", "main"),
  (u"★書く前にファイルが外から変わっていても、そのまま書く",
   u'''  if(read1.text !== text0) return { kind:"other", why:"書こうとしたら、ファイルが外から変わっていました（何も書いていません）" };''',
   u'''  void 0;''', "smoke_v162_main.js", "main"),
  (u"★書いたあと読み返さない",
   u'''  if(!back) return { kind:"unverified", n: real.length, why:"書いたあと読み返せませんでした（中身は確かめられていません）" };''',
   u'''  if(!back) return { kind:"ok", n: real.length, changed: changed, before: before, after: after, noShrink: noShrink };''',
   "smoke_v162_main.js", "main"),
  (u"★読み返しが合わないとき、いつでも元に戻す（別の端末の保存を消す）",
   u'''  if(sameCase && keptAll){''', u'''  if(false){''', "smoke_v162_main.js", "main"),
  (u"★写真が減っていても、元に戻さない",
   u'''  if(restored) return { kind:"restored", n: real.length, why:"読み返しが合わなかったので、元に戻しました" };''',
   u'''  if(true) return { kind:"ok", n: real.length, changed: changed };''',
   "smoke_v162_main.js", "main"),
  (u"★小さい写真しか無いファイルでも書き替える（原寸を潰す）",
   u'''  if(obj.chosho_photos_thumb) return { kind:"skip", why:"小さい写真しか無い" };''',
   u'''  void 0;''', "smoke_v162_main.js", "main"),
  (u"★見分けの無い写真に、縮めたあとの中身から見分けを付ける",
   u'''    if(!p.id) p.id = photoContentId(p.dataUri);      // 縮める前に写真の見分けを確定させる''',
   u'''    void 0;''', "smoke_v162_main.js", "main"),
  (u"★写真以外（氏名・更新日時）にも触る",
   u'''  const outText = JSON.stringify(obj, null, 2);''',
   u'''  obj.editedAt = "2030-01-01T00:00:00.000Z"; const outText = JSON.stringify(obj, null, 2);''',
   "smoke_v162_main.js", "main"),
  (u"★暗号化した戸別も触る",
   u'''  if(row.fileType !== "plain") return "暗号化";''', u'''  void 0;''',
   "smoke_v162_main.js", "main"),
  (u"★物件から開いた行（小さい写真しか無い）も触る",
   u'''  if(row._fromProject || (row.data && row.data.chosho_photos_thumb)) return "小さい写真しか無い";''',
   u'''  void 0;''', "smoke_v162_main.js", "main"),
  (u"★いま開いている戸別も触る（次の保存で原寸が戻る）",
   u'''  if(row === _editingRow) return "いま開いている";''', u'''  void 0;''',
   "smoke_v162_main.js", "main"),
  (u"★同じ管理番号が重なっている戸別も触る",
   u'''  if(dupSet && mg && dupSet.has(mg)) return "同じ管理番号が重なっている";''',
   u'''  void 0;''', "smoke_v162_main.js", "main"),
  (u"★元ファイルを掴んでいない行も触る",
   u'''  if(!(row._dir && row._name && row.fileHandle)) return "元ファイルなし";''',
   u'''  void 0;''', "smoke_v162_main.js", "main"),
  (u"★写真の無い戸別まで読みにいく",
   u'''  if(!(row._photoCount > 0)) return "写真なし";''', u'''  void 0;''',
   "smoke_v162_main.js", "main"),

  # ---- 現場入力：読み込み中に同じ戸別を開き直す ----
  (u"★同じ戸別を開き直したときに、読み込んだ写真を画面へ足さない（あとで消える）",
   u'''  if(a && a === b){                       // 同じ戸別を開き直した
    mergePhotosInto(M.chosho_photos, model.chosho_photos);''',
   u'''  if(false){
    mergePhotosInto(M.chosho_photos, model.chosho_photos);''',
   "smoke_v161_genba.js", "genba"),
  (u"★別の戸別へ移ったときも、画面のほうへ写真を足す（よその戸別に混ざる）",
   u'''  const a = photoMgmtKeyOf(M), b = photoMgmtKeyOf(model);
  if(a && a === b){                       // 同じ戸別を開き直した''',
   u'''  const a = photoMgmtKeyOf(M), b = photoMgmtKeyOf(model);
  if(true){''',
   "smoke_v161_genba.js", "genba"),
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
