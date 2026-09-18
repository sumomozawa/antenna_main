# -*- coding: utf-8 -*-
# 版169 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版169 は「管理番号をひと押しでコピーできる」版。
#   スマホは端末の「ファイルを選ぶ」画面の検索欄に貼り付けて戸別ファイルを探す。
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
  (u"★上の帯の管理番号に 📋 を出さない（押せることが分からない）",
   u'''  if(no){
    const c = document.createElement("span");
    c.className = "mgmt-c"; c.textContent = "📋";
    el.appendChild(c);
  }''',
   u'''  if(false){
    const c = document.createElement("span");
    c.className = "mgmt-c"; c.textContent = "📋";
    el.appendChild(c);
  }''', "smoke_v169_genba.js", "genba"),
  (u"★管理番号が空でも 📋 を出す（押しても何も起きない）",
   u'''  if(no){
    const c = document.createElement("span");''',
   u'''  if(true){
    const c = document.createElement("span");''', "smoke_v169_genba.js", "genba"),
  (u"★番号と 📋 をひとつながりにする（長い番号だと 📋 まで「…」で切れる）",
   u'''  header .mgmt .mgmt-n{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  header .mgmt .mgmt-c{flex:none; font-size:11px; opacity:.8;}''',
   u'''  header .mgmt .mgmt-n{}
  header .mgmt .mgmt-c{font-size:11px; opacity:.8;}''', "smoke_v169_genba.js", "genba"),
  (u"★上の帯の管理番号を押しても、コピーしない",
   u'''document.getElementById("hdr-mgmt").addEventListener("click", copyMgmtNo);''',
   u'''void 0;''', "smoke_v169_genba.js", "genba"),
  (u"★今どきの道（navigator.clipboard）を使わず、古い道だけにする",
   u'''  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(s); return "api";
    }
  }catch(e){ console.warn("この道では写せませんでした（別の道を試します）", e); }
  return copyTextSync(s) ? "sync" : false;   // 古い端末・https でない開き方のとき''',
   u'''  return copyTextSync(s) ? "sync" : false;''', "smoke_v169_genba.js", "genba"),
  (u"★古い端末（navigator.clipboard が無い）で、もう一つの道へ落ちない",
   u'''  }catch(e){ console.warn("この道では写せませんでした（別の道を試します）", e); }
  return copyTextSync(s) ? "sync" : false;   // 古い端末・https でない開き方のとき''',
   u'''  }catch(e){ console.warn("この道では写せませんでした（別の道を試します）", e); }
  return false;''', "smoke_v169_genba.js", "genba"),
  (u"★今どきの道が転んだら、そのまま落ちる（受け止めない）",
   u'''    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(s); return "api";
    }
  }catch(e){ console.warn("この道では写せませんでした（別の道を試します）", e); }''',
   u'''    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(s); return "api";
    }
  }catch(e){ throw e; }''', "smoke_v169_genba.js", "genba"),
  (u"★写せなかったのに「コピーしました」と出す",
   u'''  const how = await copyText(no);
  if(how === "api"){''',
   u'''  const how = "api";
  if(how === "api"){''', "smoke_v169_genba.js", "genba"),
  (u"★写せなかったときに黙る（番号を画面に出さない）",
   u'''  await uiAlert("この端末では、押してコピーすることができませんでした。\\n\\n"
    + "お手数ですが、次の番号を手で入れてください。\\n\\n" + no);
  return false;''',
   u'''  return false;''', "smoke_v169_genba.js", "genba"),
  (u"★管理番号が空のときに黙る（押しても何も起きない）",
   u'''  if(!no){ toast("管理番号がまだ入っていません"); return false; }''',
   u'''  if(!no){ return false; }''', "smoke_v169_genba.js", "genba"),
  (u"★コピーしたあと、次に何をすればよいか出さない",
   u'''    toast(no + " をコピーしました。ファイルを選ぶ画面の検索に貼り付けられます");''',
   u'''    toast(no + " をコピーしました");''', "smoke_v169_genba.js", "genba"),
  (u"★スマホの帯に「📋 管理番号をコピー」を出さない",
   u'''    +   (canDir ? "" : \'<button type="button" id="pcg-copy" class="alt">📋 管理番号をコピー（探す画面に貼り付け）</button>\')''',
   u'''    +   ""''', "smoke_v169_genba.js", "genba"),
  (u"★フォルダから直に読めるPCにも、コピーのボタンを出して迷わせる",
   u'''    +   (canDir ? "" : \'<button type="button" id="pcg-copy" class="alt">📋 管理番号をコピー（探す画面に貼り付け）</button>\')''',
   u'''    +   \'<button type="button" id="pcg-copy" class="alt">📋 管理番号をコピー（探す画面に貼り付け）</button>\'''',
   "smoke_v169_genba.js", "genba"),
  (u"★帯のコピーのボタンを押しても、コピーしない",
   u'''  const c = document.getElementById("pcg-copy");
  if(c) c.addEventListener("click", copyMgmtNo);''',
   u'''  void 0;''', "smoke_v169_genba.js", "genba"),
  (u"★帯に、貼り付けて探せることを書かない",
   u'''           + "<br>1つずつ探すときは、📋 で番号をコピーして、ファイルを選ぶ画面の検索に貼り付けてください。")''',
   u'''           + "")''', "smoke_v169_genba.js", "genba"),
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
