# -*- coding: utf-8 -*-
# 版157 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる
#   現場入力（genba）と メイン（main）の両方。名前の一部を引数に渡すと絞れる。
import io, subprocess
import os
HERE = os.path.dirname(os.path.abspath(__file__))        # …/antenna_main/開発ツール/試験/変異
SP = os.path.join(HERE, "..") + os.sep                   # 試験の置き場所
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))   # 3つのリポジトリの親
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
MAIN  = os.environ.get("MAIN")  or os.path.join(ROOT, "antenna_main", "index.html")
OUTG = os.path.join(HERE, "mut_genba.html")              # 壊した写し（git には入れない）
OUTM = os.path.join(HERE, "mut_main.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")

# (名前, 壊す前, 壊した後, 試験, どちらのファイル)
CASES = [
  # ---- ① 融合できていないのに書く（写真が減る）----
  ("★読み合わせられなかったのに書いてしまう（窓の道）", u'''      if(pickedOld && !pickedMerged){''', u'''      if(false){''',
   "smoke_v157_genba.js", "genba"),
  ("★融合を通らなくても「通った」印を立てる", u'''            pickedMerged = true;        // ここまで来たら、融合と写真の確かめを通っている''',
   u'''            void 0;''', "smoke_v157_genba.js", "genba"),

  # ---- ② 材料の一言 ----
  ("材料をどちらにしたかの一言を消す", u'''            if(mgp.kept.length) pickedNote += "\\n（ファイルに入っていた "''',
   u'''            if(mgp.kept.length) pickedNote = "\\n（ファイルに入っていた "''', "smoke_v157_genba.js", "genba"),

  # ---- ③ 窓の開く場所 ----
  ("保存の窓をフォルダの窓と別の場所から開く", u'''        id:"genba-save",                 // フォルダを選ぶ窓と同じ場所から開く（毎回たどり直さない）\r\n''',
   u'''''', "smoke_v157_genba.js", "genba"),
  ("特別記録の窓も別の場所から開く", u'''      const h = await window.showSaveFilePicker({ id:"genba-save", suggestedName: fname,''',
   u'''      const h = await window.showSaveFilePicker({ suggestedName: fname,''', "smoke_v157_genba.js", "genba"),

  # ---- ④ 許可が切れていたことを知らせない ----
  ("★フォルダの許可が切れたことを知らせない",
   u'''     ただし黙って別の道へ行くと「いつもと違う画面が出た」理由が分からないので、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }''',
   u'''     ただし黙って別の道へ行くと「いつもと違う画面が出た」理由が分からないので、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; }''', "smoke_v157_genba.js", "genba"),

  # ---- ⑤ 共有で渡した .json.txt を読まない ----
  ("共有で渡したファイル（.json.txt）を印の引き継ぎで読まない",
   u'''      if(!h || h.kind !== "file" || !/\\.json(\\.txt)?$/i.test(h.name)) continue;''',
   u'''      if(!h || h.kind !== "file" || !/\\.json$/i.test(h.name)) continue;''', "smoke_v157_genba.js", "genba"),

  # ---- ⑥ まとめて保存：フォルダの窓が開けないのに先へ進む ----
  ("★フォルダの窓が開けないのに共有・ダウンロードへ落ちる",
   u'''          + "共有やダウンロードで渡せます。");
      }
      return; }''',
   u'''          + "共有やダウンロードで渡せます。");
      }
      dir = null; }''',
   "smoke_v157_genba.js", "genba"),

  # ---- ⑦ まとめて保存：共有・ダウンロードの知らせ ----
  ("★まとめて保存の知らせをトーストだけに戻す", u'''    if(okNos.length){
      await uiAlert((shared ? "共有で渡しました： " : "ダウンロードに入れました： ") + okNos.length + " 件\\n\\n"''',
   u'''    if(false){
      await uiAlert((shared ? "共有で渡しました： " : "ダウンロードに入れました： ") + okNos.length + " 件\\n\\n"''',
   "smoke_v157_genba.js", "genba"),

  # ---- ⑧ 特別記録 ----
  ("★特別記録で、書いたあと読み返して確かめない",
   u'''         特別記録の写真は、この端末の下書きと、このファイルの2か所にしか無い。 */
      const bad = await saveVerify(fh, state);''',
   u'''         特別記録の写真は、この端末の下書きと、このファイルの2か所にしか無い。 */
      const bad = "";''',
   "smoke_v157_genba.js", "genba"),
  ("★特別記録の写真を、確かめずに消せるようにする", u'''    if(!(await uiConfirm("この写真を消します。\\n\\n"''',
   u'''    if(!(true || await uiConfirm("この写真を消します。\\n\\n"''', "smoke_v157_genba.js", "genba"),

  # ---- 検証で足した分（特別記録の控え・許可切れ・止めたときの案内）----
  ("★特別記録：読み返しで合わなかったときに名前を控えない（別名のファイルが増える）",
   u'''        try{ await spPersist(rec, false); }catch(_){}''', u'''        void 0;''',
   "smoke_v157_genba.js", "genba"),
  ("特別記録で、覚えているフォルダの許可切れを知らせない",
   u'''  /* 戸別の「保存」と同じ。許可が切れているときは聞き直さずに落として、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }''',
   u'''  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; }''',
   "smoke_v157_genba.js", "genba"),
  ("まとめて保存の逃げ道（1件ずつ保存）を書かない",
   u'''          + "それでも開かないときは、戸別を1件ずつ開いて「保存」を押すと、\\n"
          + "共有やダウンロードで渡せます。"''',
   u'''          + ""''',
   "smoke_v157_genba.js", "genba"),

  # ---- ⑨ メイン：アパートの気づき ----
  ("★共用部ボックスが金額に入らないことを知らせない", u'''    if(rep && v("power_pos") !== "outside"){''', u'''    if(false){''',
   "smoke_v157_main.js", "main"),
  ("代表でない世帯にも注意を出す", u'''    if(rep && v("power_pos") !== "outside"){''', u'''    if(v("power_pos") !== "outside"){''',
   "smoke_v157_main.js", "main"),
  ("共用部なしで「分配器は入れていません」を言わない",
   u'''    L.push("増幅器から各世帯へ分ける分配器は、自動では入れていません"''',
   u'''    if(0) L.push("増幅器から各世帯へ分ける分配器は、自動では入れていません"''', "smoke_v157_main.js", "main"),
  ("分配器の空き口数を出さない", u'''         + (plan.ports > units ? ("　空き " + (plan.ports - units) + " 口") : "") + "。");''',
   u'''         + "。");''', "smoke_v157_main.js", "main"),

  # ---- ⑩ メイン：ビラの言い方 ----
  ("★台帳の見出しを「ビラ」に戻す", u'''">ビラ済 ' + arrow("flyer")''', u'''">ビラ ' + arrow("flyer")''',
   "smoke_v157_main.js", "main"),
  ("見出しの説明から「どちらも空欄」を消す", u'''&#10;これから配る戸別・配らなくてよい戸別は、どちらも空欄です。''', u'''''',
   "smoke_v157_main.js", "main"),
  ("Excelを読むときに「ビラ」を拾わなくする", u'''  flyer:["ビラ済","ビラ","ビラ配布","チラシ"],''', u'''  flyer:["ビラ済"],''',
   "smoke_v157_main.js", "main"),
  ("★書き込みを断られたのに「対応していません」と言う（理由と合わない）",
   u'''  alert(askRefused''', u'''  alert(false''', "smoke_v157_main.js", "main"),
  ("★フォルダを掴めないときに黙って終わる",
   u'''  alert(askRefused''', u'''  if(0) alert(askRefused''', "smoke_v157_main.js", "main"),
  ("「戸別ファイルへ反映」の差分の言い方が「ビラ」のまま",
   u'''  { k:"flyer_done",        label:"ビラ済", bool:true, lg:"flyer" },''',
   u'''  { k:"flyer_done",        label:"ビラ",   bool:true, lg:"flyer" },''', "smoke_v157_main.js", "main"),
  ("地図の説明の言い方が「ビラ」のまま",
   u'''title="受付台帳の「ビラ済」に○が付いた戸別''',
   u'''title="受付台帳の「ビラ」に○が付いた戸別''', "smoke_v157_main.js", "main"),
  ("印刷の列名を「ビラ」に戻す", u'''  { key: "flyer",   label: "ビラ済",   def: 3 },''',
   u'''  { key: "flyer",   label: "ビラ",     def: 3 },''', "smoke_v157_main.js", "main"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
red = 0
n_run = 0
for name, old, new, test, which in CASES:
    if _only and _only not in name: continue
    n_run += 1
    src, out = (GENBA, OUTG) if which == "genba" else (MAIN, OUTM)
    base = io.open(src, encoding="utf-8", newline="").read()
    o, n = CR(old), CR(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); continue
    io.open(out, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    # 現場入力の試験は第1引数が genba、メインの試験は第1引数が main
    r = subprocess.run(["node", SP + test, "file://" + out], capture_output=True, text=True, timeout=900)
    last = [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")][:1]
    isred = r.returncode != 0
    if isred: red += 1
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:110] for x in last))
print("=== 赤 %d / %d ===" % (red, n_run))
