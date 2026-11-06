# -*- coding: utf-8 -*-
# 版185（組 m-opensave）変異試験: 1か所ずつ壊して、試験が赤くなるか確かめる（メイン）
#   ファイルから開いた行の 💾 上書き保存：ファイルのほうが新しければ、いま直した欄だけをファイルの中身へ入れて書く
#   場面を絞って速くする（ONLY に場面の記号を渡す）。名前の一部を引数に渡して絞れる。
#   同時に走らせる数は JOBS で渡す（既定 1。メモリの少ない端末では増やさない）。
import io, os, subprocess, sys, threading, queue
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
L = "smoke_v185_m_opensave_main.js"; A = "smoke_v179_main.js"

# (名前, 試験, 場面, [(壊す前, 壊した後), ...])
CASES = [
 ('q01 ファイルが新しくても見ない', L, 'R1',
  [('    if(fmt === "plain" && prev && mine && _editingRow && !_editingRow._genbaUnsaved && indivFileNewer(_editingRow, prev)){', '    if(false){')]),
 ('q02 いま直した欄を取らない', L, 'R2',
  [('  try { mine = editorEditedKeys(_editingRow, stateObj); } catch(_){ mine = null; }\n  let mergedRow', '  let mergedRow')]),
 ('q03 合わせた中身で書かない', L, 'R1',
  [('      if(nw){ stateObj = nw.obj; newerNote = nw.note; mergedRow = _editingRow; }\n', '      if(nw){ newerNote = nw.note; mergedRow = _editingRow; }\n')]),
 ('q04 書いたあと控えを取り直さない', L, 'R3b',
  [('        else editorBaseKeep(_editingRow);\n', '')]),
 ('q05 書いた日時を行に入れない', L, 'R3b',
  [('        if(_editingRow.data) _editingRow.data = Object.assign({}, _editingRow.data, up);\n', '')]),
 ('q06 開き直さない', L, 'R1',
  [('        if(mergedRow === _editingRow) await indivMergedReopen(_editingRow, pressVals);\n        else editorBaseKeep(_editingRow);\n', '        editorBaseKeep(_editingRow);\n')]),
 ('q07 書けなかったとき印を下ろさない', L, 'R9',
  [('  if(mergedRow) delete mergedRow._indivMerged;\n', '')]),
 ('q09 打った欄を行へ入れない', L, 'R12',
  [('      ks.forEach(k => { row.data[k] = st[k]; });\n', '')]),
 ('q10 知らせを出さない', L, 'R1',
  [('  " + res.name + newerNote);', '  " + res.name);')]),
 ('q11 欄の分からない行でも書く', L, 'R6',
  [('      if(typeof nw === "string"){ alert(nw.trim()); return; }\n      if(nw){ stateObj', '      if(typeof nw === "string"){ alert(nw.trim()); }\n      else if(nw){ stateObj')]),
 ('q12 📥 の行も合わせる', L, 'R7',
  [('    if(fmt === "plain" && prev && mine && _editingRow && !_editingRow._genbaUnsaved && indivFileNewer(_editingRow, prev)){', '    if(fmt === "plain" && prev && mine && _editingRow && indivFileNewer(_editingRow, prev)){')]),
 ('q13 暗号でないファイルでも形を見ない', L, 'R1',
  [('    if(fmt === "plain" && prev && mine && _editingRow', '    if(fmt !== "plain" && prev && mine && _editingRow')]),
 ('q14 押したときの画面との差で見ない（書いた欄を覚え直す）', L, 'R12',
  [('    if(vals && _editorBase && _editorBase.row === row) _editorBase.vals = vals;\n', '')]),
 ('q15 書いた写真を行へ入れない', L, 'R8b',
  [('          up.chosho_photos = stateObj.chosho_photos;\n', '')]),
 ('q16 物件なしでも物件に入ったと言う', L, 'R6b',
  [('(_currentProject ? "\u3000 直しは物件に入っています。" : "\u3000 直しはこの画面と一覧の行にだけあります（閉じると消えます）。")', '"\u3000 直しは物件に入っています。"')]),
 ('q17 🏢 のまとめで書いた日時を行に入れない', A, '③a',
  [('    if(back && back.editedAt) d.editedAt = back.editedAt;   // いま書いた日時（版185。入れないと、次の 💾 が自分で書いたファイルを「新しい」と見て、行にだけある直しを落とす）\n', '')]),
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
for test in (L, A):
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
