# -*- coding: utf-8 -*-
# 版182（組 m-ghost）変異試験: 1か所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   物件を開いているときの 📁 は物件の行とフォルダの中身だけで決める・端末の控え（札 pid）・🗑 で控えも外す・
#   行にだけある写真と完了の引き継ぎ・別の工事のフォルダの窓・戻ったファイルを書き替えない・ファイル無の行の備考。
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
#   同時に走らせる数は JOBS で渡す（既定 1。メモリの少ない端末では増やさない）。
import io, os, subprocess, sys, threading, queue
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
G = "smoke_v182_m_ghost_main.js"; E = "smoke_v182_m_ghost2_main.js"

# (名前, 試験, 場面, [(壊す前, 壊した後), ...])
CASES = [
 ('m01 物件を開いていても控えから行を起こす', G, 'B3',
  [('  if(!inProj && aliveN){\n', '  if(aliveN){\n'),
   ('      if(e.pid !== "") return;                           // 物件で残した控えは起こさない\n', '')]),
 ('m02 物件を開いていても控えの番号を窓に出す', G, 'B1',
  [('  const baseN = Object.keys(base).length;\n  const aliveN = (newRows || []).length;\n\n  // 何も読めていない', '  if(inProj){ const c0 = listCensusLoad(); Object.keys(c0.entries || {}).forEach(k => { if(!base[k]) base[k] = c0.entries[k]; }); }\n  const baseN = Object.keys(base).length;\n  const aliveN = (newRows || []).length;\n\n  // 何も読めていない')]),
 ('m03 行を外すとき名前だけ残すの控えを外さない', G, 'A5',
  [('try { const mk = missKeyOf(row); undetach(mk); listCensusForget(mk); if(!shared) missPurgeAnno(key); } catch(_){}', 'try { const mk = missKeyOf(row); listCensusForget(mk); if(!shared) missPurgeAnno(key); } catch(_){}')]),
 ('m04 札の無い控えを物件なしで起こす', E, 'E1',
  [('      if(e.pid === undefined){                           // 札の無い控え：起こさない・消さない。知らせは端末に1回だけ\n        if(sameName && !alive[k] && !here[k] && !e.oldNoted){ oldNos.push(e.no || k); e.oldNoted = 1; noted = true; }\n        return;\n      }\n      if(e.pid !== "") return;', '      if(e.pid){ return; }')]),
 ('m05 札の無い前回の控えを物件なしで使う', E, 'E16',
  [('    if(census.pid === "" && census.root && root && census.root === root){', '    if(census.root && root && census.root === root){')]),
 ('m06 物件で残した控えを物件なしで起こす', E, 'E1c',
  [('      if(e.pid !== "") return;                           // 物件で残した控えは起こさない\n', '')]),
 ('m07 別のフォルダでも控えを使う', G, 'C3',
  [('  } else if(sameDir !== false){\n    const census = listCensusLoad();', '  } else {\n    const census = listCensusLoad();')]),
 ('m08 あとで決める の行をまた聞かない', G, 'D5',
  [('      if(!r || (r._manual && !(r._detached && r._detached.reason === "pending"))) return;', '      if(!r || r._manual) return;')]),
 ('m09 行の無い あとで決める で行を作る', E, 'E15',
  [('    if(inProj || reason !== "kept") return;              // 物件には行を作らない（窓のあいだにほかの端末で消えた行も）\n', '    if(inProj) return;\n')]),
 ('m10 物件に行が無いとき行を作る', E, 'E20',
  [('    if(inProj || reason !== "kept") return;              // 物件には行を作らない（窓のあいだにほかの端末で消えた行も）\n', '    if(reason !== "kept") return;\n')]),
 ('m11 同じ番号の行の1行目にだけ印を付ける', E, 'E23',
  [('      rows.forEach(row => detachRow(row, m.key, root, reason));   // いまある行に印を付ける', '      detachRow(rows[0], m.key, root, reason);   // いまある行に印を付ける')]),
 ('m12 読めない行・暗号の行を残さない（読めない）', E, 'E3',
  [('        rows.forEach(r => { if(!r._manual){ out.hold.push(r); if(unread) r._holdUnread = true; } });', '')]),
 ('m12b 読めない行・暗号の行を残さない（暗号）', E, 'E4',
  [('        rows.forEach(r => { if(!r._manual){ out.hold.push(r); if(unread) r._holdUnread = true; } });', '')]),
 ('m13 掃除で消したファイルの行を残さない', E, 'E22',
  [('      if(gone || unread || lock){\n', '      if(gone){ return; }\n      if(unread || lock){\n')]),
 ('m14 行にだけある写真を引き継がない', E, 'E2',
  [('      if(extra.length){\n        if(!sameNo) return { ok: false };', '      if(false){\n        if(!sameNo) return { ok: false };')]),
 ('m15 同じファイルへ引き継ぐとき足さず置き換える', E, 'E18',
  [('        n.data = Object.assign({}, n.data, { chosho_photos: cur.concat(add) });', '        n.data = Object.assign({}, n.data, { chosho_photos: add });')]),
 ('m16 完了の印を引き継がない', E, 'E14',
  [('  if(!userChose && gd.chosho_status === "completed" && nd.chosho_status !== "completed") up.chosho_status = "completed";\n', '')]),
 ('m17 道のりを名前だけで比べる', E, 'E19',
  [('    const q = (aliveName[missTail(p)] || []).find(x => missSamePath(p, x));', '    const q = (aliveName[missTail(p)] || [])[0];')]),
 ('m18 道のりを完全一致だけで比べる', E, 'E3b',
  [('  return a === b || a.endsWith("/" + b) || b.endsWith("/" + a);', '  return a === b;')]),
 ('m19 別の工事のフォルダで聞かない', E, 'E6',
  [('  if(hit * 2 >= Math.min(n, a)) return false;\n', '  return false;\n')]),
 ('m19b 物差しが4分の1（小さい物件で聞かない）', E, 'E6d',
  [('  if(hit * 2 >= Math.min(n, a)) return false;\n', '  if(hit && (hit * 4 >= n || n - hit < 5)) return false;\n')]),
 ('m19c 下の階層でも聞く（重なりを物件の件数だけで見る）', E, 'E6d',
  [('  if(hit * 2 >= Math.min(n, a)) return false;\n', '  if(hit * 2 >= n) return false;\n')]),
 ('m20 止める前にフォルダを覚える', E, 'E6',
  [('    await scanDirRecursive(dirHandle, "", rows, stats);\n    /* ★別の工事のフォルダらしいときは、ここで聞く★', '    await scanDirRecursive(dirHandle, "", rows, stats);\n    await listDirRemember(dirHandle);\n    /* ★別の工事のフォルダらしいときは、ここで聞く★')]),
 ('m20b 別の工事の確かめを重複の整理より後にする', E, 'E6b',
  [('    if(await listForeignStop(rows, stats, pid0)){\n      renderListTable();\n      missShowNote();\n      console.log("[一覧] 再帰スキャン完了: 別の工事のフォルダなので入れていません");\n      return;\n    }\n    await listDirRemember(dirHandle);    // 次からは選び直さずに読み込む（重複整理にも使う）\n', '    await listDirRemember(dirHandle);    // 次からは選び直さずに読み込む（重複整理にも使う）\n'),
   ('    const specialWas = _specialRows;\n    _specialRows = stats.special || [];\n    _listRows = await mergeRowsWithManual(rows, { source: "folder", stats,\n      root: dirHandle.name || "", expectedGone, pid: pid0, sameDir });', '    if(await listForeignStop(rows, stats, pid0)){ renderListTable(); missShowNote(); console.log("[一覧] 再帰スキャン完了: 別"); return; }\n    const specialWas = _specialRows;\n    _specialRows = stats.special || [];\n    _listRows = await mergeRowsWithManual(rows, { source: "folder", stats,\n      root: dirHandle.name || "", expectedGone, pid: pid0, sameDir });')]),
 ('m21 読めなかったのに先へ進む', E, 'E29',
  [('    if(_missLastKeepAll && (pid0 || _currentProject)){\n      _specialRows = specialWas;\n      if(_currentProject) _listDirHandle = null;   // 読めなかったフォルダ', '    if(false){\n      _specialRows = specialWas;\n      if(_currentProject) _listDirHandle = null;   // 読めなかったフォルダ')]),
 ('m22 読めなかったフォルダを掴んだままにする', E, 'E29',
  [('      if(_currentProject) _listDirHandle = null;   // 読めなかったフォルダを掴んだままにしない（💾 反映はこの物件の工事フォルダへ）\n', '')]),
 ('m23 読んでいる間に物件が替わっても止めない', E, 'E27',
  [('  if(opts.pid !== undefined && opts.pid !== pid){\n', '  if(false){\n')]),
 ('m25 ファイル無の行で中身のある台帳を変える', E, 'E37',
  [('  const fileChanged = rowCopy ? false\n', '  const fileChanged = false ? false\n')]),
 ('m27 ファイル無の行に ファイルごと消す を出す', E, 'E8',
  [('    const canFile = !!(row && row._dir && row._name) && !ghost && !shareFile;', '    const canFile = !!(row && row._dir && row._name) && !shareFile;')]),
 ('m28 記入を setLedger の空で消す', E, 'E13',
  [('      delete _ledgerMap[key]; saveLedgerMap();\n    }\n  } catch(_){}\n  try { if(_takeoutMap[key])', '      setLedger(key, { time:"", meetAt:"", flyer:false, consent:false, compdoc:false, hold:false, note:"", noteSrc:"", meetSrc:"", flyerSrc:false, consentSrc:false, compdocSrc:false, holdSrc:false });\n    }\n  } catch(_){}\n  try { if(_takeoutMap[key])')]),
 ('m29 同じ番号の行が残るのに消す印を付ける', E, 'E13',
  [('  try { markCaseDeleted(row, shared); } catch(_){}', '  try { markCaseDeleted(row); } catch(_){}')]),
 ('m30 同じ番号の行が残るのに記入を消す', E, 'E13',
  [('listCensusForget(mk); if(!shared) missPurgeAnno(key); } catch(_){}', 'listCensusForget(mk); missPurgeAnno(key); } catch(_){}')]),
 ('m31 💾 反映がファイル無の行をつなぐ', E, 'E10c',
  [('    if(r._detached){\n      const no0 =', '    if(false){\n      const no0 ='),
   ('    if(row._detached){ noFile.push(row); continue; }\n', '')]),
 ('m32 💾 反映が前のつなぎのファイル無の行を書く', E, 'E10b',
  [('    if(row._detached){ noFile.push(row); continue; }\n', '')]),
 ('m33 ファイルが戻っていても書く', E, 'E9',
  [('  if(((row._detached && row.fileType === "plain") || row._holdUnread) && (fh || photoSrcFh)){\n', '  if(false){\n')]),
 ('m34 古い名前のファイルを見ない', E, 'E25',
  [('  if(((row._detached && row.fileType === "plain") || row._holdUnread) && (fh || photoSrcFh)){\n', '  if(row._detached && fh){\n')]),
 ('m35 別の物件へ替えても 📁 のフォルダを持ち越す', E, 'E17',
  [('    if(!opts._merge && !(_currentProject && p && _currentProject.id === p.id)) _listDirHandle = null;\n', '')]),
 ('m36 物件でも前回のフォルダを黙って使う', E, 'E17',
  [('  if(!dh && !_currentProject){ try { dh = await listDirRestore(); } catch(_){ dh = null; } }', '  if(!dh){ try { dh = await listDirRestore(); } catch(_){ dh = null; } }'),
   ('    if(!opts._merge && !(_currentProject && p && _currentProject.id === p.id)) _listDirHandle = null;\n', '')]),
 ('m36b 切り離しても 📁 のフォルダを持ち越す', E, 'E17',
  [('  _listDirHandle = null;  // 📁 のフォルダも解除（物件なしで押したときは、覚えているフォルダを読み直す。版182）\n', '')]),
 ('m37 物件で 🧽 が効く', E, 'E11',
  [('    if(_currentProject && !window.__VIEWER_MODE__){\n      alert("物件を開いているときは、一覧を空にできません。', '    if(false){\n      alert("物件を開いているときは、一覧を空にできません。')]),
 ('m38 📄 で物件のほかの行を落とす', E, 'E7',
  [('    held = _listRows.filter(r => r && !r._manual && !picked[missKeyOf(r)]);\n', '')]),
 ('m39 暗号の封筒を中身の行にする', E, 'E5',
  [('        if(detectEncFormat(c.payload) === "hybrid"){', '        if(false){')]),
 ('m40 行にだけある分の印を物件に入れない', E, 'E2b',
  [('    if(r._genbaUnsaved) payload = Object.assign({}, payload, { _genbaUnsaved: r._genbaUnsaved });\n', '')]),
 ('m41 引き継いだ行の確かめを 📥 の文にする', E, 'E26',
  [('  const nB = rows.filter(r => lgGenbaUnsaved(r) && r._genbaUnsaved === "back").length;', '  const nB = 0;')]),
 ('m42 全角の番号を半角にそろえない', E, 'E12',
  [('  const no = toHalfWidthAn(String((row && row.data && row.data.chosho_mgmt_no) || "")).trim();\n  if(no && no.indexOf("🔐") < 0) return "m:" + no;', '  const no = String((row && row.data && row.data.chosho_mgmt_no) || "").trim();\n  if(no && no.indexOf("🔐") < 0) return "m:" + no;')]),
 ('m43 暗号の行の氏名を控えに残す', E, 'E5',
  [('  const enc = !!(row && row.fileType === "hybrid");', '  const enc = false;')]),
 ('m44 古い控えの知らせを毎回出す', E, 'E1',
  [('if(sameName && !alive[k] && !here[k] && !e.oldNoted){', 'if(sameName && !alive[k] && !here[k]){')]),
 ('m45 窓の消すで消す印を付けない', E, 'E38',
  [('        rows.forEach(r => aptMgRemoveRow(r));            // 控え・記入・消す印・開いていた画面の後始末（最後の1行で記入も消える）\n', '        rows.forEach(r => { const i0 = _listRows.indexOf(r); if(i0 >= 0) _listRows.splice(i0, 1); }); undetach(m.key); missPurgeAnno(m.key);\n')]),
 ('m46 同じファイルの行に ファイルごと消す を出す', E, 'E30',
  [('          if(row._dir && row._name && !row._detached){\n            const k0 = subCaseKey(row);', '          if(false){\n            const k0 = subCaseKey(row);')]),
 ('m47 🗑 の窓で写真の枚数を言わない', E, 'E8',
  [('      + phText\n      + "</div>"\n', '      + "</div>"\n')]),
 ('m48 写真のある行の二段目の確かめを外す', E, 'E8',
  [('          if(ph && !confirm("⚠ 写真"', '          if(false && !confirm("⚠ 写真"')]),
 ('m49 閲覧用でも控えを書く', E, 'E34',
  [('    if(mr._detached && !window.__VIEWER_MODE__){\n', '    if(mr._detached){\n')]),
 ('m50 読んでいる途中で _listDirHandle が外れると止まる', E, 'E36',
  [('    root: dh0.name || "", expectedGone: expectedGone || [], pid: pid0, sameDir: true });', '    root: _listDirHandle.name || "", expectedGone: expectedGone || [], pid: pid0, sameDir: true });')]),
 ('m51 物件なしで空のフォルダを読むと一覧が空になる', E, 'E28',
  [('  if((baseN || _listRows.some(r => r && !r._manual && !r._detached)) && (!(stats.files > 0) || !aliveN)){', '  if(baseN && (!(stats.files > 0) || !aliveN)){'),
   ('  } else if(sameDir !== false){\n    const census = listCensusLoad();', '  } else if(false){\n    const census = listCensusLoad();')]),
 ('m53 つながる行があると戻ったファイルを言わない', E, 'E33',
  [('    : backNote;      // 全部そろっているときは黙って先へ進む（窓を減らす）', '    : "";      // 全部そろっているときは黙って先へ進む（窓を減らす）')]),
 ('m54 共有ファイルにつながっていないと言わない', E, 'E31',
  [('              + ((_projPendingHandle && !_projFileHandle)\n', '              + (false\n')]),
 ('m55 窓が写真・同期待ちを言わない', E, 'E35',
  [("      + (info.proj ? '<br>まだ同期が終わっていないだけのこともあります。そのときは<b>「あとで決める」</b>で閉じてください。' : '')\n", '')]),
 ('m56 窓の消すの確かめが写真を言わない', E, 'E35',
  [('        + (nPh ? ("⚠ このうち " + nPh + " 件には写真が入っています。この行の写真も消えます（戸別ファイルを別の場所へ移しただけなら、写真はそのファイルに残っています）。\\n") : "")\n', '')]),
 ('m57 世帯をまとめたとき控えを外さない', E, 'E39',
  [('    try { undetach(missKeyOf(target)); } catch(_){}   // 端末の控えからも外す（版182）\n', '')]),
 ('m59 ファイルが戻った行に直した印を付けない（融合でファイル無の行が残る）', E, 'E41',
  [('      else n._caseId = g._caseId;\n    }\n    try { markCaseEdited(n); } catch(_){}\n', '      else n._caseId = g._caseId;\n    }\n')]),
 ('m60 読んでいる間に替わった物件で別の工事の窓を出す', E, 'E42',
  [('  if(!_currentProject || window.__VIEWER_MODE__ || pid0 !== missPid()) return false;', '  if(!_currentProject || window.__VIEWER_MODE__) return false;')]),
 ('m58 ファイル無の行で控えを物件の行として残す知らせを出さない', E, 'E1',
  [('    if(gh.length) bits.push("ファイル無の行 "', '    if(false) bits.push("ファイル無の行 "')]),
 ('m62 暗号の行の足した写真を見比べずに行を外す', E, 'E44',
  [('  } else if(g._genbaUnsaved || (Array.isArray(gd.chosho_photos) && gd.chosho_photos.some(p => p && p.dataUri))) return { ok: false };', '  } else if(g._genbaUnsaved) return { ok: false };')]),
 ('m63 引き継いだ印を _rowNewer に足さない（💾 上書き保存でファイルの古い「未」に戻る）', E, 'E45',
  [('    addNewer(Object.keys(up));', '    ')]),
 ('m64 ファイルができても「ファイル無」のまま（2回目の 💾 が止まる）', E, 'E46',
  [('  if(row._detached){\n    try { undetach(missKeyOf(row)); } catch(_){}\n    delete row._detached; delete row._origin; row._manual = false;', '  if(false){\n    try { undetach(missKeyOf(row)); } catch(_){}\n    delete row._detached; delete row._origin; row._manual = false;')]),
 ('m65 読めなかったので残した行も 💾 で書く', E, 'E47',
  [('  if(((row._detached && row.fileType === "plain") || row._holdUnread) && (fh || photoSrcFh)){', '  if((row._detached && row.fileType === "plain") && (fh || photoSrcFh)){')]),
 ('m66 残した行を突き合わせに通す（台帳にだけある備考が次の 📁 で消える）', E, 'E48',
  [('  if(manuals.length === 0) return held.concat(noteResolveRows(newRows, true));', '  if(manuals.length === 0) return noteResolveRows(held.concat(newRows), true);')]),
 ('m67 ファイル無の行の「💾 上書き保存」が戻ったファイルを書き替える', E, 'E49',
  [('  if(_editingRow && _editingRow._detached && _currentProject && _listRows.indexOf(_editingRow) >= 0){', '  if(false){')]),
 ('m68 行の古い状態がファイルの完了を下げる', E, 'E50',
  [('      && !(k === "chosho_status" && d2.chosho_status === "completed" && gd.chosho_status !== "completed")   // 完了は下げない\n', '')]),
 ('m68b 行の古い work_done がファイルの印を下げる', E, 'E50',
  [('      && !(k === "work_done" && d2.work_done === true && gd.work_done !== true));', '      );')]),
 ('m69 引き継いだ写真の行の 🗑 をもう一度確かめない', E, 'E51',
  [('const ph = (row._detached || row._manual || row._genbaUnsaved) ? lgPhotoCountOf(d0, row) : 0;', 'const ph = (row._detached || row._manual) ? lgPhotoCountOf(d0, row) : 0;')]),
 ('m71 読めなかったので残した行の写真を引き継がない', E, 'E52',
  [('  for(const g of _listRows.filter(r => r && (r._detached || r._holdUnread))){', '  for(const g of _listRows.filter(r => r && r._detached)){')]),
 ('m72 窓の前に行を外す（窓のあいだの保存で行が消える）', E, 'E53',
  [('    handed.push(g);', '    { const i0 = _listRows.indexOf(g); if(i0 >= 0) _listRows.splice(i0, 1); }')]),
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
for test in (G, E):
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
    out = os.path.join(HERE, "mut_main_m-ghost_%d.html" % k)
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
