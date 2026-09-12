# -*- coding: utf-8 -*-
# 版158 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")

CASES = [
  ("★🧹 の控えフォルダを戸別として読んでしまう", u'''  if(s.indexOf(DUP_BACKUP_DIR) === 0) return true;''', u'''  if(false) return true;''',
   "smoke_v158_main.js", "main"),
  ("★同じ管理番号の行を1つにまとめない（1ファイル＝1予定に戻る）",
   u'''    const cur = best.get(key);''',
   u'''    const cur = undefined; if(cur === undefined){ best.set(r, { row: r, dated: hasDate(r) ? r : null, n: 1, sts: new Set([stOf(r)]) }); return; }''',
   "smoke_v158_main.js", "main"),
  ("★代表を「いちばん新しい1件」にしない（先に並んだ行のまま）",
   u'''    if(lgRowWhenMs(r) > lgRowWhenMs(cur.row)) cur.row = r;''', u'''    void 0;''', "smoke_v158_main.js", "main"),
  ("重なった数を数えない", u'''    cur.n++;
    cur.sts.add(stOf(r));''',
   u'''    cur.sts.add(stOf(r));''', "smoke_v158_main.js", "main"),
  ("★全暗号化(未復号)の行も数える", u'''    if(!r || !lgLedgerEnabled(r)) return;           // 全暗号化(未復号)は対象外''',
   u'''    if(!r) return;''', "smoke_v158_main.js", "main"),
  ("★新しい方に工事日が無いと予定が消える（工事日のある行を見ない）",
   u'''    if(hasDate(r) && (!cur.dated || lgRowWhenMs(r) > lgRowWhenMs(cur.dated))) cur.dated = r;''',
   u'''    cur.dated = hasDate(cur.row) ? cur.row : null;''', "smoke_v158_main.js", "main"),
  ("鍵が作れない行を1件に潰す", u'''    const key = (!k || k === "f:") ? r : k;''', u'''    const key = k;''', "smoke_v158_main.js", "main"),
  ("状態の食い違いを説明に書かない", u'''    const mixed = pick.sts.size > 1;''', u'''    const mixed = false;''', "smoke_v158_main.js", "main"),
  ("★絞り込みで行が減ると ×N が消える", u'''    const dupN = Math.max(pick.n, (no && dupAll[no]) || 1);''',
   u'''    const dupN = pick.n;''', "smoke_v158_main.js", "main"),
  ("★絞り込み中に、出している予定と違う行に書く", u'''  if(picked && (_listRows || []).indexOf(picked) >= 0) return picked;''',
   u'''  void picked;''', "smoke_v158_main.js", "main"),
  ("控えフォルダの名前を完全一致だけで見る", u'''  if(s.indexOf(DUP_BACKUP_DIR) === 0) return true;''',
   u'''  if(s === DUP_BACKUP_DIR) return true;''', "smoke_v158_main.js", "main"),
  ("紙に「×N 重複」が出る", u'''    body.list-print-mode .cu-dup { display: none !important; }''', u'''''', "smoke_v158_main.js", "main"),
  ("月のマスに ×N を出さない", u'''          + (ev.dupN > 1 ? '<b class="cal-dup-n">×' + ev.dupN + '</b>' : '')
          + (ev.prov ? '<b class="cal-prov-mark">仮</b>' : '')''',
   u'''          + (ev.prov ? '<b class="cal-prov-mark">仮</b>' : '')''', "smoke_v158_main.js", "main"),
  ("今後の予定に ×N を出さない",
   u'''      +   (ev.dupN > 1 ? ' <span class="cu-dup" title="同じ管理番号のファイルが ' + ev.dupN + ' 個あります。「🧩 重複をまとめる」で1つにできます">×' + ev.dupN + ' 重複</span>' : '') + '</td>\'''',
   u'''      + '</td>\'''', "smoke_v158_main.js", "main"),
  ("予定の説明に、重なっていることを書かない",
   u'''  const dLine = (ev.dupN > 1)''', u'''  const dLine = (false)''', "smoke_v158_main.js", "main"),
  # ---- 現場入力：読み返しの読み直し ----
  ("★一瞬読めなかっただけで「保存できていないかも」と言う（読み直さない）",
   u'''  for(let attempt = 0; attempt < 2; attempt++){''', u'''  for(let attempt = 0; attempt < 1; attempt++){''',
   "smoke_v158_genba.js", "genba"),
  ("読み直す前に待たない", u'''    if(attempt) await new Promise(r => setTimeout(r, 700));''', u'''    void 0;''',
   "smoke_v158_genba.js", "genba"),
  ("★中身が合わなくても読み直して、合わないことを知らせない",
   u'''      return ng.length ? ng.join("\\n") : "";
    }catch(e){ lastErr = e; }''',
   u'''      if(!ng.length) return "";
      if(attempt === 0) throw new Error("もう一度");
      return ng.join("\\n");
    }catch(e){ lastErr = e; }''', "smoke_v158_genba.js", "genba"),
  ("★中身の形が違うと saveVerify が投げる（呼び出し側が別の道へ落ちて💾が付く）",
   u'''    }catch(e){ lastErr = e; }          // 読めなかった／中身の形が違った → 少し待ってもう一度''',
   u'''    }catch(e){ if(/is not a function/.test(String(e && e.message))) throw e; lastErr = e; }''',
   "smoke_v158_genba.js", "genba"),
  ("読めなかったときの見出しを「中身が合いません」のままにする",
   u'''  return /^・読み返せませんでした/.test(String(bad || ""))''', u'''  return false && /^・読み返せませんでした/.test(String(bad || ""))''',
   "smoke_v158_genba.js", "genba"),
  ("★工事と打合せを別の行から出す（紙に同じ番号で違う住所が並ぶ）", u'''    const disp = wr || r;''', u'''    const disp = r;''',
   "smoke_v158_main.js", "main"),
  ("★.ics の書き出しで「出した行」の控えを壊す", u'''  const evs = calBuildEvents(rows);
  _calRowPick = keepPick;''', u'''  const evs = calBuildEvents(rows);''', "smoke_v158_main.js", "main"),
  ("月のマスの ×N が紙に出る", u'''    body.list-print-mode .cu-dup,
    body.list-print-mode .cal-dup-n { display: none !important; }''',
   u'''    body.list-print-mode .cu-dup { display: none !important; }''', "smoke_v158_main.js", "main"),
  ("状態が空の古いファイルを「違う」に数える", u'''    if(stOf(r)) cur.sts.add(stOf(r));''', u'''    cur.sts.add(stOf(r));''',
   "smoke_v158_main.js", "main"),
  ("控えを飛ばしたことを知らせない", u'''        if(String(name).trim().indexOf(DUP_BACKUP_DIR) === 0) _bakSkipped = true;   // 読み込み後の知らせに載せる''',
   u'''''', "smoke_v158_main.js", "main"),
  ("★予定を動かす相手が先頭の行のまま",
   u'''  return dated || best;
}''',
   u'''  return (_listRows || []).find(r => subCaseKey(r) === tk) || null;
}''', "smoke_v158_main.js", "main"),
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
