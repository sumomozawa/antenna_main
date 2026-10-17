# -*- coding: utf-8 -*-
# 版181 変異試験（組 m-import-enc・1段目）: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   📥 現場取込のあとの「まだ戸別ファイルに入っていない」分。
#   ・取込-1：戸別ファイルが無いままの行は「台帳で作った行」の印を残す（📁 の読み直しで消さない・💾 反映で作る）。
#            写真の入った「台帳で作った行」に、カレンダーの「🗑 仮予定を削除」を出さない
#   ・取込-4：📄 で読んだ行は、工事フォルダへ書けても「行が読み直すファイル」には入っていない（平文は欄をかぶせる・.hyb は行の封筒で開く）
#   ・取込-5：📥 で変わった欄（_rowNewer）を、開くときにファイルの中身へかぶせる。書けたら下ろす
#   ・取込-6：💾 上書き保存で、📥 で入れた工程の印をファイルの古い「未」で外さない（📥 で入れた印だけ・入れる方向だけ）
#   ・取込-7：物件なしの 📥 の知らせ・反映の「一致しています」の言い方
#   ・取込-8：📥 で入れてまだどの戸別ファイルにも無い戸別（_genbaUnsaved）を、📁 の読み直しの前に確かめる（写真だけの取り込みも）
#   ・v176-6：預けの注意は proj だけで決める（ledger では決めない）／v176-7：置き換える欄は「置き換え」と言う
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM = "smoke_v181_m_import_enc_main.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)
CASES = [
  # ======== 取込-1 ========
  (u"★取込-1 戸別ファイルが無いままの行からも「台帳で作った行」の印を外す（📁 の読み直しで消える・反映で作らない）",
   u'''  if(!row._detached && (row.fileHandle || (row._dir && row._name) || wrote)) row._manual = false;''',
   u'''  row._manual = false;''', TM, "main", u"①a,①b"),
  (u"★取込-1 写真の入った「台帳で作った行」にも「🗑 仮予定を削除」を出す",
   u'''  } else if(row._manual && isProv && lgPhotoCountOf(row.data || {}, row) === 0){''',
   u'''  } else if(row._manual && isProv){''', TM, "main", u"①c"),
  (u"★取込-1 反映で作った戸別に「まだ戸別ファイルに入っていない」の印を残す",
   u'''  mk.made.forEach(r => { delete r._genbaUnsaved; delete r._rowNewer; });''',
   u'''  void 0;''', TM, "main", u"①b"),
  (u"★取込-7 反映の確かめで、反映で作る戸別まで「まだ戸別ファイルに入っていない」に数える",
   u'''  const gLeft = _listRows.filter(r => r && r._genbaUnsaved && (missing || []).indexOf(r) < 0).length;''',
   u'''  const gLeft = _listRows.filter(r => r && r._genbaUnsaved).length;''', TM, "main", u"①b"),
  # ======== 取込-5・取込-4 ========
  (u"★取込-5 開くとき、📥 で入れてまだファイルに無い欄をかぶせない（ファイルの古い機器・長さで開く）",
   u'''      if(fresh){ d = lgOverlayLedger(rowNewerOver(fresh, target), target);''',
   u'''      if(fresh){ d = lgOverlayLedger(fresh, target);''', TM, "main", u"②"),
  (u"★取込-5 📥 で変わった欄を覚えない",
   u'''    if(!wroteOwn && ks.length) row._rowNewer =''',
   u'''    if(false && ks.length) row._rowNewer =''', TM, "main", u"②,③a,④a"),
  (u"★取込-4 📄 の行でも、工事フォルダへ書けたら「行が読み直すファイルに入った」と見なす",
   u'''  const wroteOwn = wrote && !!row.fileHandle;''',
   u'''  const wroteOwn = wrote;''', TM, "main", u"④a,④h"),
  (u"★取込-4 📄 の .hyb の行は、書けたら「ファイルから読む」のまま（📄 の古い写しで開く）",
   u'''  if(row.fileType === "hybrid" && row._slim && !wroteOwn) row._slim = false;''',
   u'''  if(row.fileType === "hybrid" && row._slim && !wrote) row._slim = false;''', TM, "main", u"④h"),
  # ======== 取込-6 ========
  (u"★取込-6 💾 上書き保存で、📥 で入れた工程の印をファイルの古い「未」で外す",
   u'''        if(_editingRow._rowNewer.indexOf(f) < 0 || !_editingRow.data[f] || stateObj[f]) return;''',
   u'''        return;''', TM, "main", u"②,③a,③h"),
  (u"★取込-6 📥 で入れた印でなくても、行の「済」でファイルの「未」を付け直す（ほかの端末が外した印が戻る）",
   u'''    if(_editingRow && _editingRow.data && Array.isArray(_editingRow._rowNewer))
      SIDE_FLOW_FLAGS.forEach(([f, at]) => {
        if(_editingRow._rowNewer.indexOf(f) < 0 || !_editingRow.data[f] || stateObj[f]) return;''',
   u'''    if(_editingRow && _editingRow.data)
      SIDE_FLOW_FLAGS.forEach(([f, at]) => {
        if(!_editingRow.data[f] || stateObj[f]) return;''', TM, "main", u"③a"),
  (u"★取込-6 💾 上書き保存で書けても、📥 で入れた欄の覚えを下ろさない（ほかの端末が外した印を付け直す）",
   u'''      if(_editingRow){ delete _editingRow._rowNewer; if(fmt !== "full") delete _editingRow._genbaUnsaved; }''',
   u'''      if(_editingRow){ if(fmt !== "full") delete _editingRow._genbaUnsaved; }''', TM, "main", u"③a"),
  # ======== 取込-8 ========
  (u"★取込-8 📁 の読み直しの前に、📥 で入れてまだファイルに無い戸別を数えない",
   u'''  return (Array.isArray(_listRows) ? _listRows : []).filter(r => r && (r._lgEdited || lgGenbaUnsaved(r))).length;''',
   u'''  return (Array.isArray(_listRows) ? _listRows : []).filter(r => r && r._lgEdited).length;''', TM, "main", u"⑥a,⑥b"),
  (u"★取込-8 写真だけの 📥 を「まだ入っていない」に数えない",
   u'''    if(!wrote && (phNew || ks.some(k => k !== "editedAt" && k.charAt(0) !== "_"))) row._genbaUnsaved = true; }''',
   u'''    if(!wrote && (ks.some(k => k !== "editedAt" && k.charAt(0) !== "_"))) row._genbaUnsaved = true; }''', TM, "main", u"⑥b"),
  (u"★取込-8 💾 上書き保存で書けても「まだ入っていない」の印を下ろさない（読み直しのたびに確かめる）",
   u'''      if(_editingRow){ delete _editingRow._rowNewer; if(fmt !== "full") delete _editingRow._genbaUnsaved; }''',
   u'''      if(_editingRow){ delete _editingRow._rowNewer; }''', TM, "main", u"②"),
  (u"★取込-8 読み直しても残る「台帳で作った行」まで「消えます」と確かめる",
   u'''  return !!(r && r._genbaUnsaved && !r._manual);''',
   u'''  return !!(r && r._genbaUnsaved);''', TM, "main", u"①a"),
  # ======== 取込-7 ========
  (u"★取込-7 物件なしの 📥 の知らせで、現場の機器・長さ・写真の入らない「💾 戸別ファイルへ反映」を勧める",
   u'''\\n　 もうファイルのある戸別は、1件ずつ開いて「💾 上書き保存」を押してください（受付台帳の「💾 戸別ファイルへ反映」では、現場の機器・長さ・写真は入りません）。"
          + "\\n　 ファイルの無い戸別は、受付台帳の「💾 戸別ファイルへ反映」で作れます。" : "")''',
   u'''\\n　 受付台帳の「💾 戸別ファイルへ反映」か、戸別を開いて「保存」で書けます。" : "")''', TM, "main", u"⑤"),
  (u"★取込-7 物件を開いていないのに「物件ファイルとこの端末に保存されているので消えません」と言う",
   u'''      + (_currentProject ? "　 これらは物件ファイルとこの端末に保存されているので、書き戻さなくても消えません。" : "") + note);''',
   u'''      + "　 これらは物件ファイルとこの端末に保存されているので、書き戻さなくても消えません。" + note);''', TM, "main", u"⑤"),
  (u"★取込-7 反映の知らせで、📥 で入れてまだ戸別ファイルに入っていない戸別を言わない",
   u'''             + (unreadable.length ? ("\\n※ 読めなかったファイル " + unreadable.length + " 件は飛ばします") : "") + gNote;''',
   u'''             + (unreadable.length ? ("\\n※ 読めなかったファイル " + unreadable.length + " 件は飛ばします") : "");''', TM, "main", u"⑤"),
  # ======== v176-6・v176-7 ========
  (u"★v176-6 預けの台帳（proj）が空のとき、現場で開いていただけの台帳（ledger）で「別の物件」と言う",
   u'''  const sp = String(side.proj || "").trim();''',
   u'''  const sp = String(side.proj || side.ledger || "").trim();''', TM, "main", u"⑦"),
  (u"★v176-7 預けで PC の値を置き換える欄も「📱現場から補完」と言う",
   u'''        ctrl='<span class="gi-take">'+((sideMode && mv) ? ('📱現場で直した値に替えます: '+escapeHtml(mv)+' → ') : '📱現場から補完: ')+escapeHtml(gv)+'</span>'; }''',
   u'''        ctrl='<span class="gi-take">📱現場から補完: '+escapeHtml(gv)+'</span>'; }''', TM, "main", u"⑧"),
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
