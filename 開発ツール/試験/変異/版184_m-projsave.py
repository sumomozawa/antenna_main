# -*- coding: utf-8 -*-
# 版184（組 m-projsave）変異試験: 1か所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   開き直した行の 💾 物件に保存：ファイルのほうが新しければ、いま直した欄だけをファイルの中身へ入れて書く
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
#   同時に走らせる数は JOBS で渡す（既定 1。メモリの少ない端末では増やさない）。
import io, os, subprocess, sys, threading, queue
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
L = "smoke_v184_m_projsave_main.js"

# (名前, 試験, 場面, [(壊す前, 壊した後), ...])
CASES = [
 ('p01 ファイルが新しくても見ない', L, 'P1',
  [('      if(!sideKept && mine && !alsoFh && !row._genbaUnsaved && indivFileNewer(row, sideFile)){', '      if(false){')]),
 ('p02 いま直した欄を渡さない', L, 'P1',
  [('writeCurrentCaseToIndividualFile(mine); }', 'writeCurrentCaseToIndividualFile(); }')]),
 ('p03 行を新しい中身にしない', L, 'P1',
  [('  row.data = Object.assign({}, t.data, { chosho_photos: was.chosho_photos });\n', '')]),
 ('p04 画面を開き直さない', L, 'P2',
  [('      try { await openCaseInEditor(row0); } catch(_){}\n    }\n    try { await projSaveNow(); } catch(_){}\n', '    }\n    try { await projSaveNow(); } catch(_){}\n')]),
 ('p05 台帳の突き合わせをしない', L, 'P4b',
  [('  noteResolveRows([t], true);\n', '')]),
 ('p05b 台帳の突き合わせをしない（台帳で直した値）', L, 'P4',
  [('  noteResolveRows([t], true);\n', '')]),
 ('p06 欄の分からない行でも合わせる', L, 'P6',
  [('  if(row._manual || lk.indexOf("*") >= 0){\n    if(created) return null;', '  if(row._manual){\n    if(created) return null;')]),
 ('p07 📥 の行も合わせる', L, 'P7',
  [('      if(!sideKept && mine && !alsoFh && !row._genbaUnsaved && indivFileNewer(row, sideFile)){', '      if(!sideKept && mine && !alsoFh && indivFileNewer(row, sideFile)){')]),
 ('p08 書いたあと控えを取り直さない', L, 'P8',
  [('    if(_editingRow === row0 && !row0._indivMerged) editorBaseKeep(row0);   // 次の保存は、ここからの差を見る（版184。いま書いたファイルを「新しい」と見ない）\n', '')]),
 ('p09 日時の順を見ない（違えば新しいと見る）', L, 'P3',
  [('  return !isFinite(ra) || fa > ra;', '  return !isFinite(ra) || fa !== ra;')]),
 ('p09b 同じ日時も新しいと見る', L, 'P3b',
  [('  return !isFinite(ra) || fa > ra;', '  return !isFinite(ra) || fa >= ra;')]),
 ('p09c 日時の無いファイルも新しいと見る', L, 'P10',
  [('  if(!isFinite(fa)) return false;\n', '  if(!isFinite(fa)) return true;\n')]),
 ('p10 台帳で直した欄を入れない', L, 'P5',
  [('mine.concat(lk, Array.isArray(row._rowNewer)', 'mine.concat(Array.isArray(row._rowNewer)')]),
 ('p11 📥 で変わった欄を入れない', L, 'P13',
  [('mine.concat(lk, Array.isArray(row._rowNewer) ? row._rowNewer : [], ', 'mine.concat(lk, ')]),
 ('p12 行に元の写真を持たせる', L, 'P9',
  [('  row.data = Object.assign({}, t.data, { chosho_photos: was.chosho_photos });', '  row.data = Object.assign({}, t.data);')]),
 ('p13 触っていなくても差を数える', L, 'P12',
  [('  if(!_editorDirty) return [];\n', '')]),
 ('p14 開いたとき控えを取らない', L, 'P1',
  [('  if(_editingRow === row) editorBaseKeep(row);   // 開いたときの画面の中身（版184。備考を台帳に合わせたあとで取る。開けなかったときは替えない）\n', '')]),
 ('p14b 備考を台帳に合わせる前に控えを取る', L, 'P4f',
  [('  noteSyncToEditor(row);          // 備考は台帳と共通の1つの欄\n  if(_editingRow === row) editorBaseKeep(row);   // 開いたときの画面の中身（版184。備考を台帳に合わせたあとで取る。開けなかったときは替えない）\n', '  if(_editingRow === row) editorBaseKeep(row);\n  noteSyncToEditor(row);\n')]),
 ('p15 一覧から直に開いたとき控えを取らない', L, 'P2c',
  [('  editorBaseKeep(_editingRow);   // 開いたときの画面の中身（版184）\n', '')]),
 ('p16 行の番号を守らない', L, 'P14',
  [('keys.concat(["chosho_mgmt_no", "chosho_photos",', 'keys.concat(["chosho_photos",')]),
 ('p17 写真をファイルのままにする', L, 'P9b',
  [('keys.concat(["chosho_mgmt_no", "chosho_photos",', 'keys.concat(["chosho_mgmt_no",')]),
 ('p18 新しいファイルを作るときも止める', L, 'P15b',
  [('    if(created) return null;\n', '')]),
 ('p19 知らせを出さない', L, 'P1',
  [('  renamedNote += newerNote + sideKeptNote', '  renamedNote += sideKeptNote')]),
 ('p20 残した欄の名前を出さない', L, 'P16',
  [('    + (names.length ? ("：" + names.slice(0, 6).join("・") + (names.length > 6 ? (" など " + names.length + " 項目") : "")) : "")\n', '')]),
 ('p22 空にした欄を消さない', L, 'P11',
  [('keys.concat(["chosho_mgmt_no", "chosho_photos", "_origin", "_schemaVer", "editedAt"]).forEach(k => { if(k in obj) out[k] = obj[k]; else delete out[k]; });', 'keys.concat(["chosho_mgmt_no", "chosho_photos", "_origin", "_schemaVer", "editedAt"]).forEach(k => { if(obj[k]) out[k] = obj[k]; });')]),
 ('p23 一覧へ戻っただけの直しを入れない', L, 'P21',
  [(', Array.isArray(row._edKeys) ? row._edKeys : []', '')]),
 ('p23b 直した欄を行に覚えない', L, 'P21',
  [('    editorEditedRemember(_editingRow, s);   // 直した欄を覚える（版184。下で画面に無い欄を足す前に見る）\n', '')]),
 ('p24 直した欄を物件に入れない', L, 'P21b',
  [('    if(Array.isArray(r._edKeys) && r._edKeys.length && !r._manual) payload = Object.assign({}, payload, { _edKeys: r._edKeys });   // 画面で直して、まだファイルに入っていない欄（版184）\n', '')]),
 ('p24b 開くとき直した欄を行へ戻さない', L, 'P21b',
  [(' if(Array.isArray(ek)) r._edKeys = ek; }', ' }')]),
 ('p24c 直した欄の印を戸別の中身に残す', L, 'P21b',
  [(' delete pl._lgKeys; delete pl._edKeys; }', ' delete pl._lgKeys; }')]),
 ('p25 書けても印を下ろさない', L, 'P21c',
  [('  editorEditedDone(row);   // 直した欄はファイルに入った（版184）\n', '')]),
 ('p25b 💾 上書き保存で書けても印を下ろさない', L, 'P21d',
  [('      editorEditedDone(_editingRow);                               // 直した欄はファイルに入った（版184）\n', '')]),
 ('p26 図面の無い行の印を付けない', L, 'P20',
  [('  if(b.preset && ks.some(editorWorkKey)) ks.push(EDIT_PRESET);', '  ')]),
 ('p26b 標準の構成を入れない', L, 'P20',
  [('    if(!file.amplifier) keys = Array.from', '    if(false) keys = Array.from')]),
 ('p26c ファイルに図面があるときも標準の構成で上書きする', L, 'P20b',
  [('    if(!file.amplifier) keys = Array.from', '    if(true) keys = Array.from')]),
 ('p26d お客様の欄も標準の構成といっしょに行の値で書く', L, 'P20',
  [('  return !editorBaseSkip(k) && LG_EDITOR_FIELDS.indexOf(k) < 0 && EDITOR_KEEP_FIELDS.indexOf(k) < 0\n', '  return !editorBaseSkip(k) && EDITOR_KEEP_FIELDS.indexOf(k) < 0\n')]),
 ('p26e 画面に無い印も標準の構成といっしょに行の値で書く', L, 'P20',
  [('  return !editorBaseSkip(k) && LG_EDITOR_FIELDS.indexOf(k) < 0 && EDITOR_KEEP_FIELDS.indexOf(k) < 0\n', '  return !editorBaseSkip(k) && LG_EDITOR_FIELDS.indexOf(k) < 0\n')]),
 ('p27 台帳で作った行も合わせる', L, 'P22',
  [('  if(row._manual || lk.indexOf("*") >= 0){', '  if(lk.indexOf("*") >= 0){')]),
 ('p28 付け替え先の別のファイルと合わせる', L, 'P23',
  [('      if(!sideKept && mine && !alsoFh && !row._genbaUnsaved && indivFileNewer(row, sideFile)){', '      if(!sideKept && mine && !row._genbaUnsaved && indivFileNewer(row, sideFile)){')]),
 ('p29 自分で書いた日時を行に入れない', L, 'P24',
  [('  if(row.data) row.data = Object.assign({}, row.data, { editedAt: json.editedAt });\n  if(_editorBase && _editorBase.row === row) _editorBase.at = json.editedAt;\n', '')]),
 ('p30 そろえて書けても欄の分からない印を下ろさない', L, 'P24b',
  [('delete m._lgEdited; delete m._lgKeys; try', 'delete m._lgEdited; try')]),
 ('p31 合わせた中身を知らせる前に物件へ入れない', L, 'P19',
  [('      try { await openCaseInEditor(row0); } catch(_){}\n    }\n    try { await projSaveNow(); } catch(_){}\n', '      try { await openCaseInEditor(row0); } catch(_){}\n    }\n')]),
 ('p32 PCだけが持つ欄を守らない', L, 'P26',
  [('  if(file._origin === "genba") keys = Array.from', '  if(false) keys = Array.from')]),
 ('p32b 別のPCのファイルでも行の値を残す', L, 'P26b',
  [('  if(file._origin === "genba") keys = Array.from', '  if(true) keys = Array.from')]),
 ('p32c アパートの欄を守らない', L, 'P26c',
  [('GENBA_HARD_KEEP_MAIN.concat(LGWB_FIELDS.map(f => f.k).filter(k => /^apt_/.test(k))).filter(k => k in obj)', 'GENBA_HARD_KEEP_MAIN.filter(k => k in obj)')]),
 ('p33 融合で替わった行へ控えを付け直さない', L, 'P27',
  [('      if(_editorBase && _editorBase.row === _editingRow) _editorBase.row = nr;   // 開いたときの控えも新しい行へ（版184。古い行のままだと直した欄を覚えない）\n', '')]),
 ('p34 開けなかったときも控えを替える', L, 'P27b',
  [('  if(_editingRow === row) editorBaseKeep(row);   // 開いたときの画面の中身', '  editorBaseKeep(row);   // 開いたときの画面の中身')]),
 ('p35 開き直す前に打った欄を行へ入れない', L, 'P28b',
  [('      if(_editorDirty){\n        const st = collectState(), ks = editorEditedRemember(row0, st) || [];\n        ks.forEach(k => { if(k in st) row0.data[k] = st[k]; });\n      }\n', '')]),
 ('p35b 合わせたあと控えを取り直してから開き直す', L, 'P28b',
  [('    if(_editingRow === row0 && !row0._indivMerged) editorBaseKeep(row0);', '    if(_editingRow === row0) editorBaseKeep(row0);')]),
 ('p35c 合わせているあいだの自動保存を止めない', L, 'P28b',
  [('  if(_editingRow._indivMerged) return;   // ファイルの新しい中身と合わせて書いているあいだは、前の画面の中身で行を戻さない（版184）\n', '')]),
 ('p36 預けの印を残す', L, 'P29',
  [('  delete out._side;           // 📮 預けの印は いつもの名前のファイルに入れない（版176）\n', '')]),
 ('p37 行の知らない預けがあるときも合わせる', L, 'P30',
  [('      if(!sideKept && mine && !alsoFh && !row._genbaUnsaved && indivFileNewer(row, sideFile)){', '      if(mine && !alsoFh && !row._genbaUnsaved && indivFileNewer(row, sideFile)){')]),
]

def run(test, path, scene):
    env = dict(os.environ); env["ONLY"] = scene
    try:
        r = subprocess.run(["node", SP + test, path], capture_output=True, timeout=900, env=env)
    except subprocess.TimeoutExpired:
        return 99, ["- 時間切れ"]
    out = (r.stdout or b"").decode("utf-8", "replace") + (r.stderr or b"").decode("utf-8", "replace")
    return r.returncode, [l for l in out.splitlines() if l.startswith("- ")] or out.strip().splitlines()[-1:]

pats = sys.argv[1:]
todo = [c for c in CASES if not pats or any(p in c[0] for p in pats)]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。使う場面だけで先に確かめて、赤なら止める。
for test in (L,):
    sc = ",".join(sorted(set(c[2] for c in todo if c[1] == test)))
    if not sc: continue
    rc, last = run(test, MAIN, sc)
    if rc != 0:
        print("土台が赤（壊す前から試験が通らない）:", test, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        sys.exit(1)
    print("土台 緑:", test, flush=True)

base = io.open(MAIN, encoding="utf-8", newline="").read()
fix = CR if "\r\n" in base else LF
q = queue.Queue()
for c in todo: q.put(c)
lock = threading.Lock()
red = [0]; n_run = [0]; green = []
def work(k):
    out = os.path.join(HERE, "mut_main_m-ledger_%d.html" % k)
    while True:
        try: name, test, sc, reps = q.get_nowait()
        except queue.Empty: break
        s = base; lost = None
        for a, b in reps:
            a2, b2 = fix(a), fix(b)
            if s.count(a2) < 1: lost = a[:50]; break
            s = s.replace(a2, b2)
        if lost is not None:
            with lock:
                print("SKIP（目印なし）:", name, "|", lost, flush=True); green.append(name)
            continue
        io.open(out, "w", encoding="utf-8", newline="").write(s)
        rc, last = run(test, out, sc)
        with lock:
            n_run[0] += 1
            if rc != 0: red[0] += 1
            else: green.append(name)
            print(("赤 ✓" if rc != 0 else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
    if os.path.exists(out): os.remove(out)
th = [threading.Thread(target=work, args=(k,)) for k in range(int(os.environ.get("JOBS") or 1))]
for t in th: t.start()
for t in th: t.join()
print("=== 赤 %d / %d ===" % (red[0], n_run[0]))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
