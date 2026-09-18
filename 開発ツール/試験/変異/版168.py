# -*- coding: utf-8 -*-
# 版168 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版168 は「PCで開いたとき、戸別ファイルを手で探させない」版。
#   掴んでいるフォルダの中の 管理番号.json を、その場で読む。
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
  (u"★台帳から開いても、フォルダを見に行かない（今までどおり手で探させる）",
   u'''  if(await pcGuardAutoLoad()) toast("受付台帳から開きました（PCのファイルも読みました）");
  else toast("受付台帳から開きました");''',
   u'''      toast("受付台帳から開きました");''',
   "smoke_v168_genba.js", "genba"),
  (u"★下書きの続きを開いたときだけ、フォルダを見に行かない",
   u'''      if(await pcGuardAutoLoad()) toast("下書きの続きを開きました（PCのファイルも読みました）");
      else toast("下書きの続きを開きました");''',
   u'''      toast("下書きの続きを開きました");''',
   "smoke_v168_genba.js", "genba"),
  (u"★すぐ下のフォルダ（リスト）を見ない（ルート直下にしか無いと決めつける）",
   u'''  let looked = 0;
  try{
    for await (const [name, h] of dir.entries()){''',
   u'''  let looked = 0;
  if(dir) return null;
  try{
    for await (const [name, h] of dir.entries()){''',
   "smoke_v168_genba.js", "genba"),
  (u"★許可が切れていても、勝手に聞き直す（押してもいないのに窓が出る）",
   u'''    return (await saveDirOk(dir, false)) ? dir : null;''',
   u'''    return (await saveDirOk(dir, true)) ? dir : null;''',
   "smoke_v168_genba.js", "genba"),
  (u"★読めていないのに【見るだけ】を解く",
   u'''  if(!hit) return false;
  /* ★控え(_rcSrc)を持ち越すのは、現場で入力したときだけ★''',
   u'''  if(!hit){ M._viewOnly = false; return false; }
  /* ★控え(_rcSrc)を持ち越すのは、現場で入力したときだけ★''',
   "smoke_v168_genba.js", "genba"),
  (u"★中の管理番号を確かめずに、名前が合うファイルを読む",
   u'''    if(draftNoKey(j.chosho_mgmt_no) !== no) continue;      // ★中の管理番号でふるう（最後の砦）''',
   u'''    if(false) continue;      // ★中の管理番号でふるう（最後の砦）''',
   "smoke_v168_genba.js", "genba"),
  (u"★読み込んだあと、受付台帳の内容を入れ直さない（事務所が直した工事日が入らない）",
   u'''  if(row){ try{ receptionApplyToModel(M, row, { keepBlank: keepBlank }); }
           catch(e){ console.warn("台帳の入れ直しに失敗", e); } }''',
   u'''  if(false){ try{ receptionApplyToModel(M, row, { keepBlank: keepBlank }); }
           catch(e){ console.warn("台帳の入れ直しに失敗", e); } }''',
   "smoke_v168_genba.js", "genba"),
  (u"★現場で入力した戸別でも、台帳の控えを捨てる（現場の入力が台帳で潰れる）",
   u'''  if(wasTouched && rcSrc) M._rcSrc = rcSrc;
  else delete M._rcSrc;''',
   u'''  delete M._rcSrc;''',
   "smoke_v168_genba.js", "genba"),
  (u"★フォルダを掴める端末なのに、フォルダから読むボタンを出さない",
   u'''  const canDir = !!window.showDirectoryPicker;''',
   u'''  const canDir = false;''',
   "smoke_v168_genba.js", "genba"),
  (u"★フォルダを掴めない端末にも、押しても何も起きないボタンを出す",
   u'''    +   (canDir
         ? ('<button type="button" id="pcg-dir">📁 PCのフォルダから読み込む\'''',
   u'''    +   (true
         ? ('<button type="button" id="pcg-dir">📁 PCのフォルダから読み込む\'''',
   "smoke_v168_genba.js", "genba"),
  (u"★保存の関門で、フォルダから読めるのに止める（手で探させる）",
   u'''  if(await pcGuardAutoLoad()){
    toast("PCのファイルを読み込みました。そのまま保存します");
    return true;
  }''',
   u'''  if(false){
    toast("PCのファイルを読み込みました。そのまま保存します");
    return true;
  }''',
   "smoke_v168_genba.js", "genba"),
  (u"★保存の関門で、読めていないのに通す（PCの写真が消える）",
   u'''  if(await pcGuardAutoLoad()){
    toast("PCのファイルを読み込みました。そのまま保存します");
    return true;
  }''',
   u'''  {
    await pcGuardAutoLoad();
    return true;
  }''',
   "smoke_v168_genba.js", "genba"),
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
