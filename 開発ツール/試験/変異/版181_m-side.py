# -*- coding: utf-8 -*-
# 版181（組 m-side）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   📮 預かりの振り分けの直し（版176 の見直しで見つかったもの）
#   ・v176-1 振り分けたとき開いていなかった物件の行で保存しても、現場で直した欄を戻さない（_sideKeys・開くときに引き継ぐ・画面にも出す）
#   ・v176-2 選んだフォルダの外（📁 の一覧）の預けを、名前（その番号）だけで別の物件へ置かない・まとめない
#   ・v176-3 古い預けがあとからまとまっても、新しい預けで直した欄を古い値に戻さない（知らせる）
#   ・v176-4 戸別を開いたまま振り分けても、一覧を読み直して開いている戸別を一覧から外さない
#   ・v176-5 いつもの名前（管理番号.json）に _side が入った戸別を、📁 で一覧から消さない
#   ・v176-8 読めない預けを「（管理番号なし）」と言わない
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main_m-side.html")
OUTG = os.path.join(HERE, "mut_genba_m-side.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v181_m_side_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  # ---- v176-1 ----
  (u"★まとめたとき、その預けで入れた欄を戸別ファイルに残さない（_sideKeys）",
   u'''    const keys = report.taken.concat(report.filled);
    if(stamp && keys.length) sk[stamp] = keys;''',
   u'''    const keys = report.taken.concat(report.filled);''', TM, "main", u"①a"),
  (u"★行の知らない預けで入れた欄を、戸別ファイルから引き継がない",
   u'''    data[k] = JSON.parse(JSON.stringify(file[k])); out.fields.push(k);''',
   u'''''', TM, "main", u"①a"),
  (u"★物件から開くとき、戸別ファイルにだけまとめた預けを行へ引き継がない（画面に前の値が出る）",
   u'''  if(row._fromProject && !row.fileHandle && !row.srcFile){ try { await sideAdoptFileMarks(row); } catch(_){} if(seq !== _openSeq) return; }''',
   u'''''', TM, "main", u"①a"),
  (u"★開くときに戸別ファイルから引き継いだことを言わない",
   u'''  if(k.flagsOn.length || k.status || nf)   // 一覧で見ていた中身と画面が違うわけを言う''',
   u'''  if(false)''', TM, "main", u"①a"),
  (u"★保存で引き継いだ欄を、開いている画面に出さない（次の保存で戻る）",
   u'''    if(nf && _editingRow === row && !_indivWriteNotShown) unshown = sideShowFields(sideKept.fields, contentObj);''',
   u'''''', TM, "main", u"①b"),
  (u"★保存の知らせで、現場で直した欄も残したことを言わない",
   u'''        + (nf ? ("。現場で直した欄（" + nf + "項目）も残しました") : "") + "）"''',
   u'''        + "）"''', TM, "main", u"①b"),
  (u"★エディタで保存すると、どの預けで入れた欄か（_sideKeys）を落とす",
   u'''  "_sideKeys",                       // 📮 どの預けで、どの欄を入れたか（版181。戸別ファイルにだけまとめた預けの欄を行へ引き継ぐ）
''', u'''''', TM, "main", u"①a"),
  (u"★🧹 未施工に戻すと _sideKeys を落とす",
   u'''  // どの預けで、どの欄を入れたか（版181）も、印と一緒に残す。
  "_sideKeys",
''', u'''''', TM, "main", u"①d"),
  (u"★新しく置いた戸別に、その預けで入れた欄を残さない",
   u'''    if(stamp && keys.length) sk[stamp] = keys;
    if(Object.keys(sk).length) S2._sideKeys = sk;''',
   u'''    if(Object.keys(sk).length) S2._sideKeys = sk;''', TM, "main", u"①c"),
  (u"★戸別ファイルから、写真・工程の印・状態・PCだけの欄まで引き継ぐ",
   u'''    if(typeof k !== "string" || sideNeverKey(k) || !(k in file) || out.fields.indexOf(k) >= 0) return;''',
   u'''    if(typeof k !== "string" || !(k in file) || out.fields.indexOf(k) >= 0) return;''', TM, "main", u"①d"),
  # ---- v176-2 ----
  (u"★📁 の一覧の預けにも、預けの物件の名前（その番号）だけで行き先を決める",
   u'''  if(proj && !it.fromList){''', u'''  if(proj){''', TM, "main", u"②a"),
  (u"★📁 の一覧の預けにも、このPCの物件の名前で行き先を決める",
   u'''  if(it.fromList) return { dest: -1, how: "" };        // 選んだフォルダの外の預けは、このPCの物件の名前でも決めない（版181）
''', u'''''', TM, "main", u"②c"),
  (u"★預けのすぐ隣に本当の戸別ファイルがあるのに、選んだフォルダの同じ管理番号のファイルへまとめる",
   u'''  if(it.fromList && sideHomeNext(it)) return { dest: -1, how: "" };
''', u'''''', TM, "main", u"②b"),
  (u"★選んだフォルダの外の預けだと言わない",
   u'''    if(it.fromList) return { act: "hold", why: "この預けは、選んだフォルダ（"''',
   u'''    if(false) return { act: "hold", why: "この預けは、選んだフォルダ（"''', TM, "main", u"②a"),
  # ---- v176-3・v176-8 ----
  (u"★新しい預けがもうまとめてあるのに、古い預けの直した欄を入れる",
   u'''  if(touched && !newerIn){''', u'''  if(touched){''', TM, "main", u"③"),
  (u"★名前の日時しか無い印まで比べる",
   u'''return /^\\d{4}-\\d{2}-\\d{2}T/.test(a) ? Date.parse(a) : NaN; };''',
   u'''const m = /^(\\d{4})(\\d{2})(\\d{2})-(\\d{2})(\\d{2})(\\d{2})$/.exec(a); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : Date.parse(a); };''', TM, "main", u"③"),
  (u"★直した欄を入れなかったことを、振り分けの終わりの知らせで言わない",
   u'''    if(r.report && r.report.olderSkipped)   // 新しい預けがもうまとめてあった（版181。黙って欄を入れないことにしない）''',
   u'''    if(false)''', TM, "main", u"③"),
  (u"★📥 の窓で、古い預けだと言わない",
   u'''(rep.olderSkipped ? "<div''', u'''(false ? "<div''', TM, "main", u"③"),
  (u"★読めない預けを「（管理番号なし）」と言う",
   u'''(it.no || (SIDE_NAME_RE.test(it.name) && sideAnyNo(it.name)) || "（管理番号なし）")''',
   u'''(it.no || "（管理番号なし）")''', TM, "main", u"③"),
  # ---- v176-4 ----
  (u"★戸別を開いたまま振り分けると、一覧を読み直して開いている戸別を一覧から外す",
   u'''      const reloaded = editing ? false : await listReloadFolder(gone);''',
   u'''      const reloaded = await listReloadFolder(gone);''', TM, "main", u"④"),
  (u"★一覧を読み直さなかったわけ（画面に戸別を開いている）を言わない",
   u'''          + (editing
              ? "画面に戸別を開いているので''', u'''          + (false
              ? "画面に戸別を開いているので''', TM, "main", u"④"),
  # ---- v176-5 ----
  (u"★いつもの名前に _side が入った戸別を、一覧から消す",
   u'''          if(!sideCanonNo(name)){
            stats.files--;''', u'''          if(true){
            stats.files--;''', TM, "main", u"⑤"),
  (u"★いつもの名前に _side が入った戸別の行に、預けの印を持たせる",
   u'''          data = Object.assign({}, data); delete data._side;''', u'''''', TM, "main", u"⑤"),
  (u"★一覧に出している戸別を「預かったファイル」と数える",
   u'''  const nSelf = _sideFiles.filter(x => x && x.self).length, nSide = _sideFiles.length - nSelf;''',
   u'''  const nSelf = 0, nSide = _sideFiles.length;''', TM, "main", u"⑤"),
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
    src = MAIN if which == "main" else GENBA
    out = OUTM if which == "main" else OUTG
    base = io.open(src, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); green.append(name); continue
    io.open(out, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    n_run += 1
    rc, last = _run(test, [out], sc)
    isred = rc != 0
    if isred: red += 1
    else: green.append(name)
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
for f in (OUTM, OUTG):
    if os.path.exists(f): os.remove(f)
print("=== 赤 %d / %d ===" % (red, n_run))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
