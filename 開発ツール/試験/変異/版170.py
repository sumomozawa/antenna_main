# -*- coding: utf-8 -*-
# 版170 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版170 は「1つだけ選ぶ／まとめて選ぶ を分け、まとめて選んだらその戸別だけを出す」版。
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
  (u"★まとめて選んでも、その戸別の番号で絞らない（何百個を目で探すことになる）",
   u'''  const q = document.getElementById("open-pick-q"); if(q) q.value = found ? want : "";''',
   u'''  const q = document.getElementById("open-pick-q"); if(q) q.value = "";''',
   "smoke_v170_genba.js", "genba"),
  (u"★その戸別が無くても、番号で絞ってしまう（一覧が空になって何も選べない）",
   u'''  const q = document.getElementById("open-pick-q"); if(q) q.value = found ? want : "";''',
   u'''  const q = document.getElementById("open-pick-q"); if(q) q.value = want;''',
   "smoke_v170_genba.js", "genba"),
  (u"★選んだ中にその戸別が無くても、黙っている",
   u'''    if(want && M && M._viewOnly){
      await uiAlert("選んだ " + fs.length + "個 の中に、この戸別のファイルがありませんでした。\\n\\n"''',
   u'''    if(false){
      await uiAlert("選んだ " + fs.length + "個 の中に、この戸別のファイルがありませんでした。\\n\\n"''',
   "smoke_v170_genba.js", "genba"),
  (u"★ほかの戸別を開きにきただけでも「ありません」の窓を出す",
   u'''    if(want && M && M._viewOnly){''',
   u'''    if(want){''',
   "smoke_v170_genba.js", "genba"),
  (u"★出てこない時の直し方（Dropbox で取り寄せる）を言わない",
   u'''        + "Dropbox などをお使いのときは、いちどそのファイルを Dropbox のアプリで開いて\\n"
        + "端末に取り寄せておかないと、「ファイルを選ぶ」画面に出てこないことがあります。\\n\\n"
        + "Dropbox でそのファイルを開いてから、もう一度「📚 まとめて選ぶ」をお試しください。");''',
   u'''        + "もう一度お試しください。");''',
   "smoke_v170_genba.js", "genba"),
  (u"★端末が名前の後ろに足した分（管理番号_1758…）を別の戸別だと見る",
   u'''  if(m.indexOf(w) !== 0) return false;
  return /^(?:_\\d+| ?\\(\\d+\\)| \\d+)$/.test(m.slice(w.length));''',
   u'''  return false;''',
   "smoke_v170_genba.js", "genba"),
  (u"★枝番（2621HIN083-01）を 2621HIN083 と同じ戸別だと見る（別の戸別を開く）",
   u'''  return /^(?:_\\d+| ?\\(\\d+\\)| \\d+)$/.test(m.slice(w.length));''',
   u'''  return true;''',
   "smoke_v170_genba.js", "genba"),
  (u"★「1つだけ選ぶ」の入口でも複数選べるようにする（選ぶ手数が増えたまま）",
   u'''    <input type="file" id="import-one" accept=".json,application/json,*/*" style="display:none;">''',
   u'''    <input type="file" id="import-one" accept=".json,application/json,*/*" multiple style="display:none;">''',
   "smoke_v170_genba.js", "genba"),
  (u"★「1つだけ選ぶ」で選んでも開かない",
   u'''document.getElementById("import-one").addEventListener("change", async e=>{
  const f = (e.target.files || [])[0]; e.target.value = "";
  if(f) await openJsonFile(f);
});''',
   u'''document.getElementById("import-one").addEventListener("change", async e=>{
  e.target.value = "";
});''',
   "smoke_v170_genba.js", "genba"),
  (u"★履歴・読込の窓から「1つだけ選んで開く」を無くす",
   u'''    <button id="btn-import-one" style="width:100%; padding:13px; border:1px solid #b0bec5; border-radius:11px; background:#fff; color:#37474f; font-weight:700; font-size:14px; margin-bottom:10px;">📂 1つだけ選んで開く</button>''',
   u'''''',
   "smoke_v170_genba.js", "genba"),
  (u"★帯（スマホ）から「1つだけ選ぶ」を無くす",
   u'''    +   (canDir ? "" : \'<button type="button" id="pcg-one" class="alt">📂 1つだけ選ぶ</button>\')''',
   u'''    +   ""''',
   "smoke_v170_genba.js", "genba"),
  (u"★フォルダから直に読めるPCにも「1つだけ選ぶ」を出して迷わせる",
   u'''    +   (canDir ? "" : \'<button type="button" id="pcg-one" class="alt">📂 1つだけ選ぶ</button>\')''',
   u'''    +   \'<button type="button" id="pcg-one" class="alt">📂 1つだけ選ぶ</button>\'''',
   "smoke_v170_genba.js", "genba"),
  (u"★帯（スマホ）の主役を「まとめて選ぶ」にしない",
   u'''    +     (canDir ? "📂 ファイルを選んで読み込む" : "📚 まとめて選んで、この戸別を出す") + \'</button>\'''',
   u'''    +     "📂 ファイルを選んで読み込む" + \'</button>\'''',
   "smoke_v170_genba.js", "genba"),
  (u"★帯の「1つだけ選ぶ」が、まとめて選ぶ入口につながっている",
   u'''    const inp = document.getElementById("import-one");
    if(inp){ inp.value = ""; inp.click(); }               // ここも間に await を挟まない''',
   u'''    const inp = document.getElementById("import-file");
    if(inp){ inp.value = ""; inp.click(); }''',
   "smoke_v170_genba.js", "genba"),
  (u"★帯に「すべて選択」すればよいことを書かない",
   u'''         : "<br>📚 を押して、ファイルを選ぶ画面で <b>すべて選択</b>（または今日回るぶん）を選ぶと、"
           + "この戸別のファイルだけを出します。何百個を目で探さなくて済みます。"''',
   u'''         : ""''',
   "smoke_v170_genba.js", "genba"),
  (u"★見つけたことを知らせない（何を出したのか分からない）",
   u'''    toast(fs.length + "個から " + want + " を出しました");''',
   u'''    toast("開けます");''',
   "smoke_v170_genba.js", "genba"),
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
