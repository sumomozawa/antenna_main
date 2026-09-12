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
  ("★🧹 の控えフォルダを戸別として読んでしまう", u'''  if(s === DUP_BACKUP_DIR) return true;''', u'''  if(false) return true;''',
   "smoke_v158_main.js", "main"),
  ("★同じ管理番号の行を1つにまとめない（1ファイル＝1予定に戻る）",
   u'''    const cur = best.get(k);
    if(!cur){ best.set(k, { row: r, n: 1 }); return; }
    cur.n++;''',
   u'''    const cur = null; best.set(k + ":" + Math.random(), { row: r, n: 1 }); return;
    cur.n++;''', "smoke_v158_main.js", "main"),
  ("★代表を「いちばん新しい1件」にしない（先に並んだ行のまま）",
   u'''    if(lgRowWhenMs(r) > lgRowWhenMs(cur.row)) cur.row = r;''', u'''    void 0;''', "smoke_v158_main.js", "main"),
  ("重なった数を数えない", u'''    cur.n++;
    if(lgRowWhenMs(r) > lgRowWhenMs(cur.row)) cur.row = r;''',
   u'''    if(lgRowWhenMs(r) > lgRowWhenMs(cur.row)) cur.row = r;''', "smoke_v158_main.js", "main"),
  ("月のマスに ×N を出さない", u'''          + (ev.dupN > 1 ? '<b class="cal-dup-n">×' + ev.dupN + '</b>' : '') + '</span>';''',
   u'''          + '</span>';''', "smoke_v158_main.js", "main"),
  ("今後の予定に ×N を出さない",
   u'''      +   (ev.dupN > 1 ? ' <span class="cu-dup" title="同じ管理番号のファイルが ' + ev.dupN + ' 個あります。🧹 重複の整理 で1つにできます">×' + ev.dupN + ' 重複</span>' : '') + '</td>\'''',
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
   u'''    return ng.length ? ng.join("\\n") : "";
  }
  return "・読み返せませんでした（"''',
   u'''    if(!ng.length) return "";
    if(attempt === 0) continue;
    return ng.join("\\n");
  }
  return "・読み返せませんでした（"''', "smoke_v158_genba.js", "genba"),
  ("★予定を動かす相手が先頭の行のまま",
   u'''    if(!best || lgRowWhenMs(r) > lgRowWhenMs(best)) best = r;
  });
  return best;''',
   u'''    if(!best) best = r;
  });
  return best;''', "smoke_v158_main.js", "main"),
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
