# -*- coding: utf-8 -*-
# 版181（組 m-save）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   保存ボタンまわり：ファイルを選ぶ画面で戸別ファイルを空にさせない（この場で作った物件の行・パスワードなしで開いた画面・📁 の戸別）・
#   写しの知らせ（小さい写真の枚数）・閲覧のみ・保存の状態・台帳の印・反映で作るファイル・暗号の保存の知らせ・物件に保存の知らせ・
#   📤／🔗 の保存先を選ぶ前の確かめ
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main_m_save.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v181_m_save_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  # ---- F1 この場で作った物件の行 ----
  (u"★この場で作った物件の行（受付台帳で作った行）を、物件から開いた戸別と見ない（💾 保存がファイルを選ぶ画面を開き、現場の写真 G が消える）",
   u'''  if(rowMadeInProject(row)) return true;   // この場で作った物件の行も（版181）
''', u'''''', TM, "main", u"①a,①b"),
  (u"★📥 で新しくできた行（_manual が外れる）を、物件から開いた戸別と見ない（_origin を見ない）",
   u'''  return !!(row && (row._manual || row._origin) && !row._slim''',
   u'''  return !!(row && row._manual && !row._slim''', TM, "main", u"①c"),
  # ---- F2 パスワードなしで閲覧 ----
  (u"★パスワードなしで開いた画面を覚えない（📁 の .hyb の 🔑 がファイルを選ぶ画面を開き、写真0枚・氏名の無いファイルになる）",
   u'''      _editorViewOnlyRow = target;
''', u'''''', TM, "main", u"②b"),
  (u"★写しにするかで、パスワードなしで開いた画面を見ない",
   u'''  return saveStateFromProject() || !!_editorViewOnlyRow || !!(_loadedOrigin && _loadedOrigin.fileHandle);''',
   u'''  return saveStateFromProject() || !!(_loadedOrigin && _loadedOrigin.fileHandle);''', TM, "main", u"②b"),
  (u"★パスワードなしで開いた物件の暗号の行で、物件から開いた印を立てない（「物件から開いています」と言わない）",
   u'''      if(rowOpenedFromProject(target)) _editorProjRow = target;
''', u'''''', TM, "main", u"②a"),
  (u"★パスワードなしで開いた画面で、氏名・電話・住所・写真が写しに入らないと言わない（物件の行）",
   u'''    + (_editorViewOnlyRow ? "パスワードなしで開いたので、氏名・電話・住所・写真は、この写しに入りません。\\n" : "")   // 伏せ字の画面（版181）''',
   u'''    + ""''', TM, "main", u"②a"),
  # ---- F4 小さい写真の枚数 ----
  (u"★元の写真が混じっていても「写真は、物件に控えた小さい写真です」と全部が小さい写真のように言う",
   u'''     : (small && nSmall < ph.length) ? "写真 "''', u'''     : (false) ? "写真 "''', TM, "main", u"③a"),
  (u"★小さい写真が全部でも「N 枚のうち M 枚」と言う（今までの文言が出ない）",
   u'''     : (small && nSmall < ph.length) ? "写真 "''', u'''     : (small) ? "写真 "''', TM, "main", u"③b"),
  # ---- S1 📁 の戸別 ----
  (u"★📁 で読んだ戸別（ファイルが付いている）の 💾・🔑・🔐 で、ファイルを選ぶ画面を開く（元のファイルが空にされ、工程の印・保留・同意書が消える）",
   u'''  return saveStateFromProject() || !!_editorViewOnlyRow || !!(_loadedOrigin && _loadedOrigin.fileHandle);''',
   u'''  return saveStateFromProject() || !!_editorViewOnlyRow;''', TM, "main", u"④a,④b"),
  (u"★📁 の戸別の写しで「💾 上書き保存」へ案内しない（物件から開いた戸別の知らせを出す）",
   u'''  if(!saveStateFromProject()) return saveStateFileNote(s, mgmtSafe);   // 📁 の戸別・パスワードなしで開いた画面（版181）
''', u'''''', TM, "main", u"④a"),
  (u"★パスワードなしで開いた画面でも、押せない「💾 上書き保存」へ案内する",
   u'''  const ovBtn = !ro && !vr && !!(o && o.fileHandle);''', u'''  const ovBtn = true;''', TM, "main", u"②b"),
  (u"★ファイルの付いていない戸別まで写しにする（📂 で読んだ戸別をファイルを選ぶ画面で保存できない）",
   u'''  return saveStateFromProject() || !!_editorViewOnlyRow || !!(_loadedOrigin && _loadedOrigin.fileHandle);''',
   u'''  return true;''', TM, "main", u"④c"),
  # ---- S2 閲覧のみ ----
  (u"★閲覧のみのあいだも、画面の直しを行へ取り込む（タブを裏へ回す・一覧へ戻る・保存ボタンで物件に入る）",
   u'''  if(rtIsCaseReadOnly()) return;
  // 開いてから何も触っていなければ書き戻さない（見ただけで工事内容・金額が入るのを防ぐ）。''',
   u'''  // 開いてから何も触っていなければ書き戻さない（見ただけで工事内容・金額が入るのを防ぐ）。''', TM, "main", u"⑤a,⑤b,⑤c"),
  (u"★閲覧のみのあいだも、エディタの名前・電話などの欄を行へすぐ入れる（受付台帳の印も付く）",
   u'''      if(rtIsCaseReadOnly()) return;   // 閲覧のみのあいだは行へ入れない（版181）
''', u'''''', TM, "main", u"⑤a"),
  (u"★閲覧のみのあいだも、図面・写真の直しで「この端末が直した戸別」にする",
   u'''  if(rtIsCaseReadOnly()) return;   // 閲覧のみのあいだは、この戸別を「この端末が直した」にしない（版181）
''', u'''''', TM, "main", u"⑤a"),
  (u"★閲覧のみの帯が「この端末の変更は保存されません」のまま（物件にも戸別ファイルにも入らないと言わない）",
   u'''（この端末で直しても、物件にも戸別ファイルにも入りません）";''', u'''（この端末の変更は保存されません）";''', TM, "main", u"⑤a"),
  # ---- S3 保存の状態 ----
  (u"★共有ファイルへ書けなくても、受付台帳の「保存の状態」①が緑の「自動で保存されています」のまま",
   u'''  if(_currentProject && _projWriteWarn){
    c1 = "lgs-warn";''', u'''  if(false){
    c1 = "lgs-warn";''', TM, "main", u"⑥"),
  (u"★共有ファイルへ書けなくても、メニューの帯が「✅ 共有ファイルに自動で保存されています」のまま",
   u'''  if(_projWriteWarn){
    b.classList.add("ss-warn");''', u'''  if(false){
    b.classList.add("ss-warn");''', TM, "main", u"⑥"),
  (u"★受付台帳を開いたままだと、①を出し直さない",
   u'''        if(lb && (lb.getAttribute("data-w") || "") !== ((_currentProject && _projWriteWarn) ? "1" : "")) lgSaveStateRefresh(); } catch(_){}''',
   u'''        } catch(_){}''', TM, "main", u"⑥"),
  # ---- S4 台帳の印を下ろす ----
  (u"★「💾 物件に保存」で戸別ファイルへ書けても、②の印を下ろさない",
   u'''    try { lgwbMarkWritten(row0, row0.fileType === "hybrid" ? ((row0.envelope && row0.envelope.plain) || null) : row0.data); } catch(_){}''',
   u'''''', TM, "main", u"⑦a"),
  (u"★「💾 上書き保存」で戸別ファイルへ書けても、②の印を下ろさない",
   u'''      try { lgwbMarkWritten(_editingRow, stateObj); } catch(_){}   // 戸別ファイルへ書けた＝台帳の印を下ろす（版181）''',
   u'''''', TM, "main", u"⑦b"),
  (u"★台帳の控えにしか無い直し（保留）がまだ戸別ファイルに入っていないのに、②の印を下ろす",
   u'''  if(diff) return false;
  if(want.chosho_mgmt_no''', u'''  if(want.chosho_mgmt_no''', TM, "main", u"⑦c"),
  (u"★②の文が「台帳で直した N 件」のまま（エディタで直した分も数えているのに）",
   u'''  const t2 = n ? ("台帳やエディタで直した " + n''', u'''  const t2 = n ? ("台帳で直した " + n''', TM, "main", u"⑦a"),
  # ---- S5 反映で作るファイル ----
  (u"★「💾 戸別ファイルへ反映」で新しく作るファイルに、台帳の 保留・同意書・ビラ・完了書・打合せ予定・備考 を入れない",
   u'''      lgwbLedgerInto(obj, row);
''', u'''''', TM, "main", u"⑧"),
  # ---- S6 暗号の保存の知らせ ----
  (u"★🔐 暗号化保存で、読み返して合わないのに「完了しました」と言う",
   u'''      if(!bad) alert("🔐 全暗号化保存が完了しました");''', u'''      alert("🔐 全暗号化保存が完了しました");''', TM, "main", u"⑨enc"),
  (u"★🔑 ハイブリッド保存で、読み返して合わないのに「完了しました」と言う",
   u'''      if(!bad) alert("🔑 ハイブリッド保存が完了しました''', u'''      alert("🔑 ハイブリッド保存が完了しました''', TM, "main", u"⑨hyb"),
  # ---- S7 物件に保存の知らせ ----
  (u"★自動保存が書いている最中に「💾 物件に保存」を押すと、書き終わる前に「✅ 保存しました」と言う",
   u'''  if(busy){
    let done = false;''', u'''  if(false){
    let done = false;''', TM, "main", u"⑩"),
  # ---- S8 保存先を選ぶ前の確かめ ----
  (u"★🔗 共有ファイルに連動（PC）で、確かめずに保存先を選ぶ画面を開く",
   u'''  if(!isAndroid && !(await projPickerWarn("attach"))) return;''', u'''''', TM, "main", u"⑪a"),
  (u"★📤 出力/保存（PC）で、確かめずに保存先を選ぶ画面を開く",
   u'''      if(!(await projPickerWarn("export"))) return;''', u'''''', TM, "main", u"⑪b"),
  (u"★確かめの窓がメニューの画面の後ろに隠れる",
   u'''    back.style.zIndex = "5000";''', u'''''', TM, "main", u"⑪a"),
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
