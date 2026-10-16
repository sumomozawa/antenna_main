# -*- coding: utf-8 -*-
# 版177 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン・現場入力）
#   アンテナ取付ガイドの「柱」のチェックに「CATV支給柱建柱で使用」（長さ 7m／8m／9m）を足した直し。
#   ・単価マスター（材料 6,530・労務 17,700／20,000／22,400・本・屋外金物(支持)）と、ガイドの行の名前 → 単価マスターの対応表
#   ・取付ガイドの中身（==ANTENNA-GUIDE-CORE==・メインと現場入力で同じ）：長さ違いの3つを「チェック1つ＋長さの選択1つ」で出す・
#     true にできるのは1つだけ・外すと3つとも外れる・チェックなしで長さを替えても計上しない・別の戸別に長さを持ち越さない
#   ・アパートは代表だけ・完了は金額で決めない・閲覧用も同じ
#   ・描き直したあと、押していた欄（長さの選択・チェック）に戻す＝キーボードで ↓ を続けて押せる（メイン）
#   ・開いたばかりの戸別でチェックを外しても、長さは選んでいたまま（メイン）
#   ・閲覧用ではキーボードでも選択欄が替わらない（viewer-block.html。壊した写しからビューアを作って ⑧ で確かめる）
#   ※ renderOptGroup の「先に true のもの」（!onKey）は壊しても変わらない（buildSceneOptions が先に1つにそろえる）ので、ここには入れない。
#   場面を絞って速くする（現場入力は SCENE、メインは ONLY に場面の記号を渡す）。
#   名前の一部を引数に渡して絞るか、「現場」「メイン」を引数に渡して分けて走らせるとよい。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
VBLOCK = os.environ.get("VBLOCK") or os.path.join(ROOT, "antenna_main", "開発ツール", "viewer-block.html")
VGEN = os.path.join(ROOT, "antenna_main", "開発ツール", "ビューア生成.py")
OUTB = os.path.join(HERE, "mut_viewer-block.html")
OUTV = os.path.join(HERE, "mut_viewer.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM, TG = "smoke_v177_main.js", "smoke_v177_genba.js"

# 取付ガイドの中身（メインと現場入力で同じ）の、よく使う目印
GRP_BRANCH = u'''        if(op.group){
          // 長さ違いの同じ柱（group）は、最初の1つの位置にまとめて枠を1つだけ出す
          if(!grpDone[op.group]){ grpDone[op.group]=true; optsEl.appendChild(renderOptGroup(list, op.group)); }
          return;
        }
'''
ONE_ONLY = u'''      if(on && op.group){ if(grpOn[op.group]) on=false; else grpOn[op.group]=true; }
'''
SET_ON = u'''        members.forEach(function(mb){ scene.options[mb.key]=(mb.key===key); });'''
SET_ON_BAD = u'''        members.forEach(function(mb){ if(mb.key===key) scene.options[mb.key]=true; });'''
SEL_CSS = u'''  .apw-opts .apw-optgrp select{width:auto;min-width:0;max-width:100%;min-height:0;margin:0;padding:1px 4px;
    font:inherit;font-size:13px;font-weight:400;color:#111;background:#fff;border:1px solid #9fc0dd;border-radius:4px;
    -webkit-appearance:menulist;appearance:auto;cursor:pointer;}
'''

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)  どのファイル＝ "main"／"genba"／"viewer"（viewer-block.html）。場面＝その試験の場面の記号
CASES = [
  # ======== メイン：単価マスター・対応表 ========
  (u"★単価マスターの 7m の労務を 17,700 以外にする",
   u'''catv_pole_sup7: { name:"CATV支給柱建柱 7m（根枷・底キャップ）", category:"support", model:"", material_cost: 6530, labor_cost:17700,''',
   u'''catv_pole_sup7: { name:"CATV支給柱建柱 7m（根枷・底キャップ）", category:"support", model:"", material_cost: 6530, labor_cost:17000,''', TM, "main", u"⓪"),
  (u"★9m の材料費（根枷・底キャップ 6,530）を 0 にする",
   u'''catv_pole_sup9: { name:"CATV支給柱建柱 9m（根枷・底キャップ）", category:"support", model:"", material_cost: 6530,''',
   u'''catv_pole_sup9: { name:"CATV支給柱建柱 9m（根枷・底キャップ）", category:"support", model:"", material_cost:    0,''', TM, "main", u"③"),
  (u"★7m の分類を「その他労務」にする（積算表で ■ 屋外金物(支持) の下に出ない）",
   u'''catv_pole_sup7: { name:"CATV支給柱建柱 7m（根枷・底キャップ）", category:"support",''',
   u'''catv_pole_sup7: { name:"CATV支給柱建柱 7m（根枷・底キャップ）", category:"misc",''', TM, "main", u"②"),
  (u"★協力会社の標準単価（8m の労務 20,000）を変える",
   u'''catv_pole_sup8: { name:"CATV支給柱建柱 8m（根枷・底キャップ）", category:"support", model:"", material_cost: 6530, labor_cost:20000,''',
   u'''catv_pole_sup8: { name:"CATV支給柱建柱 8m（根枷・底キャップ）", category:"support", model:"", material_cost: 6530, labor_cost: 2000,''', TM, "main", u"④"),
  (u"★8m の行を 7m の単価につなぐ",
   u'''  "CATV支給柱建柱（8m）で使用": "catv_pole_sup8",''', u'''  "CATV支給柱建柱（8m）で使用": "catv_pole_sup7",''', TM, "main", u"③"),
  (u"★対応表の 9m の名前がガイドの行と違う（9m を選んでも積算に乗らない）",
   u'''  "CATV支給柱建柱（9m）で使用": "catv_pole_sup9"''', u'''  "CATV支給柱建柱(9m)で使用": "catv_pole_sup9"''', TM, "main", u"⑤"),
  (u"★ガイドの 7m の行の名前を変える（対応表につながらない）",
   u'''{key:'catvSup7', label:'CATV支給柱建柱（7m）で使用',''', u'''{key:'catvSup7', label:'CATV支給柱建柱 7m で使用',''', TM, "main", u"⓪"),

  # ======== メイン：取付ガイドの中身（画面・押す） ========
  (u"★長さ違いを枠1つにまとめず、3つのチェックで出す",
   GRP_BRANCH, u'''''', TM, "main", u"①"),
  (u"★長さの選択をチェックの label の中に入れる（長さを選ぶとチェックまで切り替わる）",
   u'''      wrap.appendChild(lb);
      wrap.appendChild(sel);''', u'''      lb.appendChild(sel);
      wrap.appendChild(lb);''', TM, "main", u"①"),
  (u"★柱の説明（市で支給された柱を…）を出さない",
   u'''{key:'catvSup7', label:'CATV支給柱建柱（7m）で使用', unit:'本', group:'catvSup', len:'7m', groupLabel:'CATV支給柱建柱で使用', tip:'市で支給された柱を建てて、それにアンテナを取り付けます。'}''',
   u'''{key:'catvSup7', label:'CATV支給柱建柱（7m）で使用', unit:'本', group:'catvSup', len:'7m', groupLabel:'CATV支給柱建柱で使用', tip:''}''', TM, "main", u"①"),
  (u"★今までの3つの説明（title）が消える",
   u'''        if(op.tip) lb.title=op.tip;
''', u'''''', TM, "main", u"①"),
  (u"★チェックなしで長さを替えても計上する",
   u'''        if(!cb.checked) return;
''', u'''''', TM, "main", u"②"),
  (u"★チェックしたとき、選んでおいた長さを使わない（いつも 7m）",
   u'''        setOn(cb.checked ? sel.value : '');''', u'''        setOn(cb.checked ? head.key : '');''', TM, "main", u"②"),
  (u"★チェックしたまま長さを替えても、行が移らない",
   u'''        setOn(sel.value);
''', u'''''', TM, "main", u"②"),
  (u"★長さを替えると前の長さが残る（2つの長さが true・外しても残る）",
   SET_ON, SET_ON_BAD, TM, "main", u"②"),
  (u"チェックした枠の色（on）を付けない",
   u'''      wrap.className='apw-optgrp'+(onKey?' on':'');''', u'''      wrap.className='apw-optgrp';''', TM, "main", u"②"),

  # ======== メイン：保存データ・開く ========
  (u"★保存データに2つの長さが true だと両方乗る（group で1つだけの決まりを外す）",
   ONE_ONLY, u'''''', TM, "main", u"③"),
  (u"★開いた戸別の長さを選択に出さない（いつも 7m）",
   u'''      sel.value = onKey || (isMember(optPick[group]) ? optPick[group] : head.key);''',
   u'''      sel.value = isMember(optPick[group]) ? optPick[group] : head.key;''', TM, "main", u"⑥"),
  (u"★開いたばかりの戸別でチェックを外すと、長さが 7m に戻る（チェックのときに選んでいた長さを覚えない）",
   u'''      cb.addEventListener('change', function(){
        optPick[group]=sel.value;
''', u'''      cb.addEventListener('change', function(){
''', TM, "main", u"②"),
  (u"★描き直したあと、押していた欄に戻さない（キーボードで長さの ↓ を続けて押せない）",
   u'''      if(fk){ var fn=optsEl.querySelector(fk); if(fn) fn.focus(); }
''', u'''''', TM, "main", u"②"),
  (u"★押していた欄を覚えるとき、長さの選択を見分けない（↓ を押すと欄から外れる）",
   u'''        ['data-opt-len','data-opt-group','data-opt'].some(''', u'''        ['data-opt-group','data-opt'].some(''', TM, "main", u"②"),
  (u"★押していた欄を覚えるとき、今までのチェックを見分けない（スペースで押すと欄から外れる）",
   u'''        ['data-opt-len','data-opt-group','data-opt'].some(''', u'''        ['data-opt-len','data-opt-group'].some(''', TM, "main", u"②"),
  (u"★別の戸別を開いても、前に選んだ長さを持ち越す",
   u'''      optPick={};     // 別の戸別を開いたら覚えた長さは捨てる
''', u'''''', TM, "main", u"⑥"),

  # ======== メイン：アパート・完了・閲覧用 ========
  (u"★アパートの2世帯目以降にも柱を計上する",
   u'''  if(opts && opts.skipApartmentSub) return;
''', u'''''', TM, "main", u"⑤"),
  (u"★金額が乗っていれば完了と見なす",
   u'''  if(d.work_done === true) return true;
  return false;''', u'''  if(d.work_done === true) return true;
  if(((typeof getRowBomAggregate === "function" && getRowBomAggregate(row)) || {}).labSum > 0) return true;
  return false;''', TM, "main", u"⑦"),
  (u"★閲覧用で、選択欄をキーボード（↓・文字）で替えられる（画面が積算と食い違う）",
   u'''        if((t === "keydown" || t === "keypress") && e.target && e.target.tagName === "SELECT" && e.key !== "Tab") e.preventDefault();
''', u'''''', TM, "viewer", u"⑧"),
  (u"閲覧用で、選択欄の Tab まで止める（次の欄へ移れない）",
   u'''e.target.tagName === "SELECT" && e.key !== "Tab") e.preventDefault();''', u'''e.target.tagName === "SELECT") e.preventDefault();''', TM, "viewer", u"⑧"),
  (u"メインの版を上げない（閲覧用と食い違う）",
   u'''const APP_VERSION = "177";''', u'''const APP_VERSION = "176";''', TM, "main", u"⑧"),

  # ======== 現場入力 ========
  (u"★現場入力：8m の行の名前がメインの対応表と違う",
   u'''{key:'catvSup8', label:'CATV支給柱建柱（8m）で使用',''', u'''{key:'catvSup8', label:'CATV支給柱建柱（8ｍ）で使用',''', TG, "genba", u"⓪"),
  (u"★現場入力：長さ違いを枠1つにまとめず、3つのチェックで出す",
   GRP_BRANCH, u'''''', TG, "genba", u"①"),
  (u"★現場入力：チェックなしで長さを替えても入る",
   u'''        if(!cb.checked) return;
''', u'''''', TG, "genba", u"②"),
  (u"★現場入力：外しても長さが残る",
   u'''        setOn(cb.checked ? sel.value : '');''', u'''        if(cb.checked) setOn(sel.value);''', TG, "genba", u"②"),
  (u"現場入力：チェックした枠の色（on）を付けない",
   u'''      wrap.className='apw-optgrp'+(onKey?' on':'');''', u'''      wrap.className='apw-optgrp';''', TG, "genba", u"②"),
  (u"★現場入力：長さを替えると前の長さが残る（下書き・PCへ渡す中身に2つ入る）",
   SET_ON, SET_ON_BAD, TG, "genba", u"③"),
  (u"★現場入力：PCへ渡す中身に柱の選択を入れない",
   u'''  s.antenna_guide=JSON.parse(JSON.stringify(M.antenna_guide||{ver:1,pattern:null,parts:{}}));''',
   u'''  s.antenna_guide=JSON.parse(JSON.stringify(Object.assign({},M.antenna_guide||{ver:1,pattern:null,parts:{}},{options:{}})));''', TG, "genba", u"③"),
  (u"★現場入力：保存データに2つの長さが true だと2つ出る",
   ONE_ONLY, u'''''', TG, "genba", u"④"),
  (u"★現場入力：PCのファイルを読み直しても取付ガイドを入れない",
   u'''  m.antenna_guide=normalizeAntennaGuide(s.antenna_guide);''', u'''  m.antenna_guide={ver:1,pattern:null,parts:{}};''', TG, "genba", u"④"),
  (u"現場入力：長さの選択が、現場入力のふつうの大きな選択欄の形になる（枠が2行になる）",
   SEL_CSS, u'''''', TG, "genba", u"⑤"),
  (u"★現場入力の取付ガイドだけ直す（メインと1バイト違う）",
   u'''{key:'catvSup9', label:'CATV支給柱建柱（9m）で使用', unit:'本', group:'catvSup', len:'9m', groupLabel:'CATV支給柱建柱で使用', tip:'市で支給された柱を建てて、それにアンテナを取り付けます。'}''',
   u'''{key:'catvSup9', label:'CATV支給柱建柱（9m）で使用', unit:'本', group:'catvSup', len:'9m', groupLabel:'CATV支給柱建柱で使用', tip:'市で支給された柱を建てて、それにアンテナを取り付けます。' }''', TG, "genba", u"⑥"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
_todo = [c for c in CASES if not _only or _only in c[0] or (_only == "現場" and c[4] == "genba") or (_only == "メイン" and c[4] in ("main", "viewer"))
         or (_only == "閲覧" and c[4] == "viewer")]

def _run(test, args, scene, extra=None):
    env = dict(os.environ); env["SCENE"] = scene; env["ONLY"] = scene; env.update(extra or {})
    try:
        r = subprocess.run(["node", SP + test] + ["file://" + a for a in args], capture_output=True, text=True, timeout=900, env=env)
    except subprocess.TimeoutExpired:
        return 99, ["- 時間切れ"]
    return r.returncode, [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。使う場面だけで先に確かめて、赤なら止める。
for which, test, src in (("main", TM, MAIN), ("genba", TG, GENBA)):
    sc = ",".join(sorted(set(c[5] for c in _todo if c[4] == which or (which == "main" and c[4] == "viewer"))))
    if not sc: continue
    rc, last = _run(test, [src], sc)
    if rc != 0:
        print("土台が赤（壊す前から試験が通らない）:", test, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        _s.exit(1)
    print("土台 緑:", test, flush=True)

red = 0; n_run = 0; green = []
for name, old, new, test, which, sc in _todo:
    src, OUT = {"genba": (GENBA, OUTG), "main": (MAIN, OUTM), "viewer": (VBLOCK, OUTB)}[which]
    base = io.open(src, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); green.append(name); continue
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    if which == "viewer":
        # 壊した viewer-block.html から、いつものメインでビューアを作り、そのビューアを ⑧ で開く
        g = subprocess.run(["python3", VGEN, "--main", MAIN, "--block", OUTB, "--out", OUTV], capture_output=True, text=True)
        if g.returncode != 0:
            print("SKIP（ビューアを作れない）: %s | %s" % (name, (g.stdout + g.stderr).strip().splitlines()[-1:])); green.append(name); continue
        n_run += 1
        rc, last = _run(test, [MAIN], sc, {"VIEWER": OUTV, "VIEWER_BLOCK": OUTB})
    else:
        n_run += 1
        rc, last = _run(test, [OUT], sc)
    isred = rc != 0
    if isred: red += 1
    else: green.append(name)
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
for p in (OUTM, OUTG, OUTB, OUTV):
    if os.path.exists(p): os.remove(p)
print("=== 赤 %d / %d ===" % (red, n_run))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
