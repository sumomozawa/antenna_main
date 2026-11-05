# -*- coding: utf-8 -*-
# 版183（組 m-ledger）変異試験: 1か所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   台帳の「完了」✔ の印を物件に持たせる・控え（*Src）はファイルの内容だけ・物件の行は台帳が持ち主・書けた値を控えへ・版182 までの控えの扱い。
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
#   同時に走らせる数は JOBS で渡す（既定 1。メモリの少ない端末では増やさない）。
import io, os, subprocess, sys, threading, queue
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
E = "smoke_v182_m_ghost2_main.js"; L = "smoke_v183_m_ledger_main.js"

# (名前, 試験, 場面, [(壊す前, 壊した後), ...])
CASES = [
 ('n01 行の値を控えに書く（読んだばかりのファイルの行でなくても）', L, 'F10',
  [('    if(fileVal && _lgRowIsFile && lg[srcKey] !== fileVal) setLedger(tk, { [srcKey]: fileVal });', '    if(fileVal && lg[srcKey] !== fileVal) setLedger(tk, { [srcKey]: fileVal });')]),
 ('n02 読んだばかりでない行の値を「現場が直した」と見る（開くだけで台帳の値が戻る）', L, 'F17',
  [('  const rowCopy = !_lgRowIsFile;\n  if(fileVal === lgVal){', '  const rowCopy = !!(row._detached || row._fromProject || row._manual);\n  if(fileVal === lgVal){')]),
 ('n02b 物件の行の欄をファイルの内容と見なす（融合で行が古い値のとき台帳の値が戻る）', E, 'E21',
  [('  const rowCopy = !_lgRowIsFile;\n  if(fileVal === lgVal){', '  const rowCopy = !!(row._detached || row._manual);\n  if(fileVal === lgVal){')]),
 ('n03 台帳に記録があっても行の値を採る（台帳で消した値が戻る）', L, 'F8',
  [('    if(lg["cut_" + lgKey] || fileVal === known){', '    if(false){')]),
 ('n04 💾 で書いた値を控えへ入れない', L, 'F4',
  [('  try { lgSrcFromWritten(row, row.fileType === "hybrid" ? ((contentObj && contentObj.plain) || null) : contentObj); } catch(_){}', '  ')]),
 ('n04b 💾 上書き保存で書いた値を控えへ入れない', L, 'F4d',
  [('      try { lgSrcFromWritten(_editingRow, stateObj); } catch(_){}', '      ')]),
 ('n05 台帳で消すと記録ごと無くなる（開き直すと行の値が戻る）', L, 'F8',
  [('  ["note", "time", "meetAt"].forEach(k => { if(next[k]) delete next["cut_" + k]; else if(was[k]) next["cut_" + k] = true; });\n', '')]),
 ('n05b 消した値を控えに置く（同じ値を入れ直すと 📁 で消える）', L, 'F18',
  [('  ["note", "time", "meetAt"].forEach(k => { if(next[k]) delete next["cut_" + k]; else if(was[k]) next["cut_" + k] = true; });\n', '  [["note", "noteSrc"], ["time", "timeSrc"], ["meetAt", "meetSrc"]].forEach(([k, c]) => { if(was[k] && !next[k] && !next[c] && !(c in patch)) next[c] = was[k]; });\n')]),
 ('n06 まだ入っていない印を物件に入れない（開き直すと持ち越さない）', L, 'F1',
  [('    if(r._lgEdited && !r._manual) payload = Object.assign({}, payload, { _lgEdited: true, _lgKeys: r._lgKeys || undefined });\n', '')]),
 ('n07 開き直すとき印を行へ戻さない', L, 'F1',
  [(' if(le){ r._lgEdited = true; if(Array.isArray(lk)) r._lgKeys = lk; }', '')]),
 ('n08 台帳で作った行の印も物件に入れる', L, 'F11',
  [('    if(r._lgEdited && !r._manual) payload', '    if(r._lgEdited) payload')]),
 ('n09 物件の行の ✔ を控えに書く（台帳だけの ✔ が 📁 で外れる）', L, 'F3',
  [('  const rowCopy = !_lgRowIsFile;                 // 行の印は', '  const rowCopy = false;   // 行の印は')]),
 ('n10 版182 までの控えで、空のファイルが台帳の値を消す', L, 'F7',
  [('  if(fileChanged && !fileVal && !lg.srcOk) setLedger(tk, { [srcKey]: "" });\n  else if(fileChanged){', '  if(fileChanged){')]),
 ('n11 版182 までの ✔ の控えで、台帳の ✔ が外れる', L, 'F7b',
  [('    if(fileVal !== known && !fileVal && lgVal && !lg.srcOk){', '    if(false){')]),
 ('n12 読んだファイルと突き合わせ済みの印を付けない（現場が消した備考が残る）', L, 'F6',
  [('    if(_lgRowIsFile && k && _ledgerMap[k] && !_ledgerMap[k].srcOk){ _ledgerMap[k].srcOk = true; okNew = true; }\n', '')]),
 ('n13 書いた控えに確かの印を付けない（現場が消した備考が残る）', L, 'F4b',
  [('setLedger(tk, Object.assign(patch, { srcOk: true }));', 'setLedger(tk, patch);')]),
 ('n14 印を下ろしたことを物件へ保存しない', L, 'F12c',
  [('  if(had){ try { projTouch(); } catch(_){} }', '  ')]),
 ('n15 画面の時刻を控えに書く（空のファイルで台帳の時刻が消える）', L, 'F14',
  [('setLedger(ntk, { time: t });   // 控えはファイルへ書けたとき（版183）', 'setLedger(ntk, { time: t, timeSrc: t });')]),
 ('n16 直した欄を読んだ行へ持ち越さない', L, 'F1',
  [('  const nCarry = window.__VIEWER_MODE__ ? 0 : lgCarryEdits(newRows);', '  const nCarry = 0;')]),
 ('n17 版182 までの物件の完了に印を付けない（✔ が外れる）', L, 'F16',
  [('    if(!opts._merge && !(p.lastSavedBy && +p.lastSavedBy.app >= 183) && !window.__VIEWER_MODE__){', '    if(false){')]),
 ('n18 開き直したままの 💾 反映が全部の欄を書く（現場の直しを消す）', L, 'F15',
  [('    if(row._fromProject && !row._genbaUnsaved && (!row._lgEdited || lgEditKeysKnown(row))){', '    if(false){')]),
 ('n19 持ち越せる行でも確かめの窓を出す', L, 'F1',
  [('  return !lgEditKeysKnown(r) || r._lgKeys.indexOf("chosho_mgmt_no") >= 0;', '  return true;')]),
 ('n19b 直した欄の分からない印でも窓を出さない', L, 'F1b',
  [('  if(!r._fromProject || r._manual || r.fileType !== "plain") return true;\n', '  if(!r._fromProject || r._manual || r.fileType !== "plain") return true;\n  return false;\n')]),
 ('n20 消した値を行の写しに残す（開くと台帳へ戻る）', L, 'F8b',
  [('      row.data[fileKey] = "";            // 残すと物件へ入り直し', '      // 残すと物件へ入り直し')]),
 ('n21 記録の有無を欄ごとに見る（1欄目しか台帳に入らない）', L, 'F20',
  [('    _lgRowNoRecord = !!k && !_ledgerMap[k];\n', '')]),
 ('n22 書いた ✔ を控えへ入れない', L, 'F19',
  [('    if(!!lg[F.src] !== v) patch[F.src] = v;\n', '')]),
 ('n23 開いたとき消した値を台帳へ戻す', L, 'F8c',
  [('      if(_ledgerMap[tk] && (el.value === rowNote || el.value === String(lg0.noteSrc || ""))) el.value = "";\n      else noteAdopt(tk, el.value, row);', '      noteAdopt(tk, el.value, row);')]),
 ('n24 読めなかった行を、直した欄を持ち越す前に外す', L, 'F21b',
  [('    out.handed = handed;                                 // 外すのは mergeRowsWithManual（台帳で直した欄を持ち越したあと）\n', '    handed.forEach(g => { const i = _listRows.indexOf(g); if(i >= 0) _listRows.splice(i, 1); });\n')]),
 ('n25 印の無い完了も毎回持ち越す（現場の取り消しを戻す）', L, 'F16b',
  [('    if(!r || !r._lgEdited || r._manual || !r._fromProject || r.fileType !== "plain" || lgEditLost(r)) return;\n', '    if(!r || r._manual || !r._fromProject || r.fileType !== "plain") return;\n    if(r.data.chosho_status === "completed"){ r._lgEdited = true; lgEditedKeys(r, ["chosho_status"]); }\n    if(!r._lgEdited) return;\n')]),
 ('n26 番号を直した行でも窓を出さない', L, 'F22',
  [('  return !lgEditKeysKnown(r) || r._lgKeys.indexOf("chosho_mgmt_no") >= 0;', '  return !lgEditKeysKnown(r);')]),
 ('n27 欄の分からない直しがあっても窓を出さない', L, 'F23',
  [('  return Array.isArray(r._lgKeys) && r._lgKeys.length > 0 && r._lgKeys.indexOf("*") < 0;', '  return Array.isArray(r._lgKeys) && r._lgKeys.length > 0;')]),
 ('n28 行にだけある備考を消す', L, 'F24',
  [('    if(lg["cut_" + lgKey] || fileVal === known){', '    if(true){')]),
 ('n29 📥 で入れた行も直した欄だけ書く（入れた内容がファイルへ届かない）', L, 'F25',
  [('    if(row._fromProject && !row._genbaUnsaved && (!row._lgEdited || lgEditKeysKnown(row))){', '    if(row._fromProject && (!row._lgEdited || lgEditKeysKnown(row))){')]),
 ('n30 📥 で変わった欄を直した欄に数えない', L, 'F25b',
  [('  if(Array.isArray(row._rowNewer) && row._rowNewer.indexOf(k) >= 0) return true;   // 📥 で変わった欄（行のほうが新しい）\n', '')]),
 ('n31 画面の備考を控えに書く（空のファイルで台帳の備考が消える）', L, 'F14b',
  [('  setLedger(tk, row ? { note: s } : { note: s, noteSrc: s });', '  setLedger(tk, { note: s, noteSrc: s });')]),
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
for test in (E, L):
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
