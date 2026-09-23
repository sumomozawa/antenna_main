# -*- coding: utf-8 -*-
# 版172 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版172 は「保存先を『物件 ＞ リスト』に固定する」版。
#     PC   … 物件のフォルダを選んでも中の「リスト」を覚える（親も覚える）。前の版で覚えたルートも寄せる。
#             ルートにできてしまった写しは、保存のたびに写真を和集合にしてリストへ（ルートは消さない）。
#     スマホ … 受付台帳を取り込むと入れる場所が「物件名/リスト」に決まる。案内も入れない所まで言う。
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
  (u"★1-1 「リスト」という名前で決めない（中が空の新しい物件で、物件のすぐ下に書く）",
   u'''      if(!named && String(name).normalize("NFKC").trim() === "リスト") named = { dir:h, name:name, strong:true };''',
   u'''      void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-1 受付台帳が横にあっても強い手がかりにしない（直下にまちがって溜まった数に負ける）",
   u'''  best.strong = ledger;''',
   u'''  best.strong = false;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-1 特別記録を戸別の数に入れる",
   u'''!/^現場用|^受付台帳|^特別記録_/.test(name)) n++;''',
   u'''!/^現場用|^受付台帳/.test(name)) n++;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-2 強い手がかりでも中へ入るか聞く（押す回数が増える）",
   u'''  if(f && !f.strong){''',
   u'''  if(f){''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-2 まとめて保存で選んだフォルダをそのまま覚える（物件のすぐ下に書く）",
   u'''      dir = await saveDirAdopt(dir, { ask:false });''',
   u'''      await saveDirSet(dir);''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-3 保存（1件）で、前の版で覚えたルートをリストへ寄せない",
   u'''     ただし黙って別の道へ行くと「いつもと違う画面が出た」理由が分からないので、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }
  if(dir) dir = await saveDirSettle(dir);    // 前の版で物件のフォルダを覚えていたら、中の「リスト」へ寄せる''',
   u'''     ただし黙って別の道へ行くと「いつもと違う画面が出た」理由が分からないので、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-3 特別記録の保存で、前の版で覚えたルートをリストへ寄せない",
   u'''  /* 戸別の「保存」と同じ。許可が切れているときは聞き直さずに落として、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }
  if(dir) dir = await saveDirSettle(dir);    // 前の版で物件のフォルダを覚えていたら、中の「リスト」へ寄せる''',
   u'''  /* 戸別の「保存」と同じ。許可が切れているときは聞き直さずに落として、あとで伝える。 */
  let dirLapsed = false;
  if(dir && !(await saveDirOk(dir, false))){ dir = null; dirLapsed = true; }''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-3 寄せられないフォルダを、保存のたびに総なめする",
   u'''  if(_saveDirChecked.has(dir)) return dir;''',
   u'''  void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-4 覚えるフォルダを替えても、前の物件で当たったフォルダ・名前の一覧を捨てない",
   u'''  _caseDirHit = null; _caseDirHitRoot = null; _cfIdx = null;''',
   u'''  void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-5 保存バーに「物件 ＞ リスト」を出さない（どこへ入れているか見えない）",
   u'''  const destHtml = (dest && destPP.outer && destPP.inner)''',
   u'''  const destHtml = (false && destPP.outer && destPP.inner)''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-5 「＞ リスト」の max-width を消す（中の名前が長いと「変更」が画面の外へ）",
   u'''  .sb-dest-in{ flex:none; max-width:8em; overflow:hidden; text-overflow:ellipsis;''',
   u'''  .sb-dest-in{ flex:none; overflow:hidden; text-overflow:ellipsis;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-5 「＞ リスト」を縮む箱に戻す（長い物件名で「＞ リ…」まで削られる）",
   u'''  .sb-dest-in{ flex:none; max-width:8em; overflow:hidden; text-overflow:ellipsis;''',
   u'''  .sb-dest-in{ flex:0 1 auto; min-width:3em; max-width:8em; overflow:hidden; text-overflow:ellipsis;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-6 根元（物件）が違っても、前に当たったフォルダを先に見る（前の物件のファイルを読む）",
   u'''  if(_caseDirHit && _caseDirHitRoot === root && _caseDirHit !== dir){''',
   u'''  if(_caseDirHit && _caseDirHit !== dir){''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-6 物件のフォルダのまま覚えていて中で当たっても、そこを覚え直さない（保存がすぐ下へ）",
   u'''    if(hit.dir && hit.dir !== dir && !hit.fromRoot && dir === _saveDir && !saveDirParentOf(dir)''',
   u'''    if(false''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-7 リストとルートの両方にあるとき、ルートの写しを和集合に入れない（写真が落ちる）",
   u'''  else { cf.others = cf.others.concat([cp.primary], cp.others); cf.baseStale = true; }''',
   u'''  else { cf.baseStale = true; }''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-7 ルートにだけあるとき、ルートの写しを土台にしない（写真・PCの中身が消える）",
   u'''  if(!cf.primary){ cf.primary = cp.primary; cf.pick = cp.pick; cf.others = cf.others.concat(cp.others); }''',
   u'''  if(!cf.primary){ }''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-7 両方にあるとき、控えを古い扱いにしない（現場の値がリストの古い値に黙って戻る）",
   u'''  else { cf.others = cf.others.concat([cp.primary], cp.others); cf.baseStale = true; }''',
   u'''  else { cf.others = cf.others.concat([cp.primary], cp.others); }''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-7 控えがリストの中身と合っていても古い扱いにする（毎回確かめの窓が出る）",
   u'''  if(baseFitsFile(b, cf.primary)) return b;''',
   u'''  void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★1-9 📥 で物件のすぐ下のファイルを読まない（スマホが前の案内どおり入れた分を取りこぼす）",
   u'''          if(h && h.kind === "file" && /\\.json(\\.txt)?$/i.test(h.name)) out.push({ name: h.name, handle: h });''',
   u'''          void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★2-4 案内で「物件の中のリスト」と言わない（名前1つの言い方に戻る）",
   u'''  if(pp.outer) return "''',
   u'''  if(false) return "''',
   "smoke_v172_genba.js", "genba"),
  (u"★2-4 特別記録を共有で渡したとき、入れる場所を言わない",
   u'''        + saveHintLine()
        + shareRenameNote(sr.as) + lapsedLine(), warn:true };''',
   u'''        + shareRenameNote(sr.as) + lapsedLine(), warn:true };''',
   "smoke_v172_genba.js", "genba"),
  (u"★2-2 受付台帳を取り込んでも、入れる場所を決めない",
   u'''  try{ if(saveHintAuto(src && src.project, oldProj)) renderSaveBar(); }catch(_){}''',
   u'''  void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★2-2 自分で選んだ名前まで書き替える",
   u'''  if(mine) return "";''',
   u'''  void 0;''',
   "smoke_v172_genba.js", "genba"),
  (u"★2-5 保存中の暗幕に「入れる所」を出さない",
   u'''    + (where ? ('<div class="save-ov-s">入れる所：' + esc(where) + "</div>") : "")''',
   u'''    + ""''',
   "smoke_v172_genba.js", "genba"),
  # ---- 反証を生き延びた指摘の直し（工事フォルダ・リストの中の子・PCの名前だけの道）と、試験の抜け ----
  (u"★修1 読んで当たった中のフォルダ（物件A）を、中のリストまで降りずに覚え直す（物件Aのすぐ下へ書く）",
   u"""      const t = await saveDirInto(hit.dir, dir);""",
   u"""      const t = { dir:hit.dir, parent:dir };""",
   "smoke_v172_genba.js", "genba"),
  (u"★修1 弱い手がかりで「はい」と答えたとき、中のリストまで降りない（物件Aのすぐ下を覚える）",
   u"""    const t = await saveDirInto(f.dir, picked);""",
   u"""    const t = { dir:f.dir, parent:picked };""",
   "smoke_v172_genba.js", "genba"),
  (u"★修1 中のリストへ入れないのに覚え直す（物件Aのすぐ下を親つきで覚える）",
   u"""    if(!(await saveDirOk(f.dir, false))) return null;""",
   u"""    void 0;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修1 中のリストへ降りるとき、許可を聞き直す（押した操作を使ってしまう）",
   u"""    if(!(await saveDirOk(f.dir, false))) return null;""",
   u"""    if(!(await saveDirOk(f.dir, true))) return null;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修1 根元が物件と確かめずに子を見る（工事フォルダの下の別の物件を読んで、ここへ書く）",
   u"""  if(root !== dir && !(await saveDirRootIsProj(root, dir))) return null;""",
   u"""  void 0;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修3 「リスト」そのものを覚えていても、中の子フォルダへ覚え直す",
   u"""       && !saveDirNamedList(dir)
       && (await saveDirCountCases(dir, 1)) === 0""",
   u"""       && (await saveDirCountCases(dir, 1)) === 0""",
   "smoke_v172_genba.js", "genba"),
  (u"★修3 直下に戸別があるフォルダを覚えていても、中の子フォルダへ覚え直す",
   u"""       && !saveDirNamedList(dir)
       && (await saveDirCountCases(dir, 1)) === 0""",
   u"""       && !saveDirNamedList(dir)""",
   "smoke_v172_genba.js", "genba"),
  (u"★修2 PC（フォルダを選べる端末）でも、取り込みで名前だけの入れる場所を決める（「未設定 選ぶ」が消える）",
   u"""  if(window.showDirectoryPicker) return "";""",
   u"""  void 0;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修2 PC の取り込みの知らせに、名前だけの入れる場所を出す",
   u"""(saveHintWhere() && !window.showDirectoryPicker && !saveDirName())""",
   u"""(saveHintWhere() && !saveDirName())""",
   "smoke_v172_genba.js", "genba"),
  (u"★修4 まとめて保存で、ルートの写しを読み合わせない（写真・PCだけの中身が入らない）",
   u"""        const cf0 = await readCaseFilesForWrite(dir, f.name, f.no);""",
   u"""        const cf0 = await readExistingCaseFiles(dir, f.name, f.no);""",
   "smoke_v172_genba.js", "genba"),
  (u"★修4 まとめて保存で、控えを古い扱いにしない（現場の値がリストの古い値に黙って戻る）",
   u"""          const base0 = baseForWrite(fileBaseGet(f.model), cf0);""",
   u"""          const base0 = fileBaseGet(f.model);""",
   "smoke_v172_genba.js", "genba"),
  (u"★修5 「覚えない」を選んだ印を残さない（次の取り込みで入れる場所が黙って戻る）",
   u"""      try{ localStorage.setItem(LS_SAVEHINT_AUTO,
        !got ? "\\u0000off" : ((proj && got === proj + "/リスト") ? got : "")); }catch(_){}""",
   u"""      void 0;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修6 親（物件）を IndexedDB に残さない（開き直すと親が消える）",
   u"""  try{ await idbMapPut({ key:SAVEDIR_KEY, handle:h, parent:(h && parent) || null,""",
   u"""  try{ await idbMapPut({ key:SAVEDIR_KEY, handle:h, parent:null,""",
   "smoke_v172_genba.js", "genba"),
  (u"★修6 開き直したとき、親（物件）を戻さない",
   u"""    _saveDirPar = (_saveDir && r.parent)""",
   u"""    _saveDirPar = (false && r.parent)""",
   "smoke_v172_genba.js", "genba"),
  (u"★修7 保存の読み合わせで、物件のフォルダの許可を聞き直す",
   u"""  if(!(await saveDirOk(par, false))) return cf;""",
   u"""  if(!(await saveDirOk(par, true))) return cf;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修7 リストへ寄せるとき、リストの許可を聞き直す",
   u"""  if(!(await saveDirOk(f.dir, false))) return dir;""",
   u"""  if(!(await saveDirOk(f.dir, true))) return dir;""",
   "smoke_v172_genba.js", "genba"),
  (u"★修7 📥 で、物件のフォルダの許可を聞き直す",
   u"""      if(await saveDirOk(par, false)){""",
   u"""      if(await saveDirOk(par, true)){""",
   "smoke_v172_genba.js", "genba"),
  (u"★修8 前の版の履歴に残った「物件名だけ」を候補に出す",
   u"""  const notBare = h => !proj || h !== proj;""",
   u"""  const notBare = h => true;""",
   "smoke_v172_genba.js", "genba"),
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
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:120] for x in last))
print("=== 赤 %d / %d ===" % (red, n_run))
