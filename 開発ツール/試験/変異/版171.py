# -*- coding: utf-8 -*-
# 版171 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   版171 は「版166〜170（1人で作った分）の見直しで見つかった抜け」を直した版。
#     A-1 台帳が空欄の 工事日・時刻・打合せ を、ファイルごと消していた
#     A-2 台帳を入れ直したあと画面を描き直していなかった（工事完了が黙って落ちる道）
#     B   コピーの予備の道が、写せていないのに「コピーしました」と出していた
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
  (u"★A-1 台帳が空欄なら消さない、をやめる（現場が決めた工事日がファイルごと消える）",
   u'''    } else if(!v && (!blankWins || keepBlank)){''',
   u'''    } else if(!v && !blankWins){''',
   "smoke_v168_genba.js", "genba"),
  (u"★A-1 読み込んだ直後なのに「空欄では消さない」を渡さない",
   u'''  if(row){ try{ receptionApplyToModel(M, row, { keepBlank: keepBlank }); }
           catch(e){ console.warn("台帳の入れ直しに失敗", e); } }''',
   u'''  if(row){ try{ receptionApplyToModel(M, row); }
           catch(e){ console.warn("台帳の入れ直しに失敗", e); } }''',
   "smoke_v168_genba.js", "genba"),
  (u"★A-1 いつでも「空欄では消さない」にする（事務所が消した工事日が現場に残る）",
   u'''  const keepBlank = !(wasTouched && rcSrc);      // 控えを捨てる＝ファイルの値が土台。空欄では消さない''',
   u'''  const keepBlank = false;''',
   "smoke_v168_genba.js", "genba"),
  (u"★A-2 台帳を入れ直したあと画面を描き直さない（工程のボタンが逆に動く・工事完了が落ちる）",
   u'''  try{ render(); }catch(e){ console.warn("描き直しに失敗", e); try{ renderPcGuard(); }catch(_){} }''',
   u'''  try{ renderPcGuard(); }catch(_){}''',
   "smoke_v168_genba.js", "genba"),
  (u"★B コピーの予備の道で、写す元へ焦点を移さない（写せていないのに成功と答える）",
   u'''    ta.focus();
    try{ ta.setSelectionRange(0, s.length); }catch(_){}''',
   u'''    try{ ta.setSelectionRange(0, s.length); }catch(_){}''',
   "smoke_v169_genba.js", "genba"),
  (u"★B コピーのあと、打っていた欄へ戻さない（打ちかけの字が続けられない）",
   u'''    try{
      if(act && act !== document.body && act.focus){
        act.focus();
        if(ss != null && act.setSelectionRange) act.setSelectionRange(ss, se);
      }
    }catch(_){}''',
   u'''    void 0;''',
   "smoke_v169_genba.js", "genba"),
  (u"★B 予備の道でも「写せた」と言い切る（確かめようが無いのに）",
   u'''    toast(no + " をコピーしました。出てこないときは、この番号を手で入れてください");''',
   u'''    toast(no + " をコピーしました。ファイルを選ぶ画面の検索に貼り付けられます");''',
   "smoke_v169_genba.js", "genba"),
  (u"★C 控えなど「_」で始まるフォルダの中まで読みに行く（古いファイルが土台になる）",
   u'''      if(/^_/.test(name)) continue;                  // 控えなどの作業用フォルダは見ない''',
   u'''      if(false) continue;''',
   "smoke_v168_genba.js", "genba"),
  # ↓ この2つは対になっている（先に見る枝と、そのあとの「もう見た」の飛ばし）。
  #   片方だけ消すと、覚えているフォルダが飛ばされて見つからなくなる。
  (u"★C 前に当たったフォルダを先に見ない（覚えている所が飛ばされて、見つからなくなる）",
   u'''  if(_caseDirHit && _caseDirHit !== dir){
    const h0 = await look(_caseDirHit);
    if(h0) return h0;
  }''',
   u'''  void 0;''',
   "smoke_v168_genba.js", "genba"),
  (u"★C 直下で当たったフォルダを覚えない（次も総なめになる）",
   u'''  if(h1){ _caseDirHit = dir; return h1; }''',
   u'''  if(h1) return h1;''',
   "smoke_v168_genba.js", "genba"),
  (u"★C 予定カレンダーの行を block にしない（版167 の直しを、今度こそ捕まえる）",
   u'''  .cal-ev .cal-ev-t{display:block; font-weight:700; font-size:14px;''',
   u'''  .cal-ev .cal-ev-t{font-weight:700; font-size:14px;''',
   "smoke_v167_genba.js", "genba"),
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
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:120] for x in last))
print("=== 赤 %d / %d ===" % (red, n_run))
