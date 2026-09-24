# -*- coding: utf-8 -*-
# 版174 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
#   ・主アンテナで受ける局（antenna_stations）
#   ・主系統ラインブースターの場所（line_booster_pos）
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
TM, TG = "smoke_v174_main.js", "smoke_v174_genba.js"
IDS = u'''  const ids = ["work_type","is_catv","high_work","snow_guard","indoor_adj",
'''
AUTH = u'''const GENBA_AUTHORITATIVE_FIELDS = [
  "work_type","is_catv","high_work","snow_guard","indoor_adj",
'''
KNOWN = u'''const GENBA_KNOWN_KEYS = new Set([
  "work_type","is_catv","high_work","snow_guard","indoor_adj",
'''
STR = u'''  const STR_FIELDS = ["work_type","is_catv","high_work","snow_guard","indoor_adj",
'''

# (名前, 壊す前, 壊した後, 試験, どちらのファイル)
CASES = [
  # ---- メイン：保存・往復 ----
  (u"★場所を保存しない（開いて保存すると消える）",
   IDS + u'''    "antenna_stations","line_booster_pos",   // 版174''',
   IDS + u'''    "antenna_stations",   // 版174''', TM, "main"),
  (u"★局の組み合わせを保存しない",
   IDS + u'''    "antenna_stations","line_booster_pos",   // 版174''',
   IDS + u'''    "line_booster_pos",   // 版174''', TM, "main"),
  (u"★現場入力から取り込む欄の一覧に入れない",
   AUTH + u'''  "antenna_stations","line_booster_pos",   // 版174''',
   AUTH + u'''  // 版174''', TM, "main"),
  (u"取り込みの見出しが英字のままになる",
   u'''antenna_stations:"主アンテナで受ける局",line_booster_pos:"ラインブースター(主系統)の場所",''', u'''''', TM, "main"),
  (u"★古い戸別で、前の戸別の「場所」が残る（後から足した欄の一覧に無い）",
   u'''  line_booster_pos: "",   // 版174: ラインブースターの場所（HPFの下）''', u'''''', TM, "main"),
  (u"★古い戸別で、前の戸別の「局の組み合わせ」が残る",
   u'''  antenna_stations: "",   // 版174: 主アンテナで受ける局（いつもどおり）''', u'''''', TM, "main"),
  (u"★組み込みプリセットの既定が「ふだん」でない",
   u'''    ch46:"no", bs_cs:"no",
    bs_antenna_state:"new", bsmix_type:"mixer", bsmix_state:"new",
    antenna_46:"", antenna_50:"", antenna_stations:"", line_booster_pos:"",''',
   u'''    ch46:"no", bs_cs:"no",
    bs_antenna_state:"new", bsmix_type:"mixer", bsmix_state:"new",
    antenna_46:"", antenna_50:"", antenna_stations:"", line_booster_pos:"sp_right",''', TM, "main"),
  (u"★保存データから組み直す道で「場所」を拾わない",
   u'''    line_booster_pos: d.line_booster_pos || "",''', u'''    line_booster_pos: "",''', TM, "main"),
  (u"保存データから組み直す道で「局」を拾わない",
   u'''    antenna_stations: d.antenna_stations || "",''', u'''    antenna_stations: "",''', TM, "main"),
  (u"★画面の「場所」を図面・積算の入口に載せない",
   u'''    line_booster_pos: $("line_booster_pos") || "",''', u'''    line_booster_pos: "",''', TM, "main"),
  (u"★画面の「局」を図面・積算の入口に載せない",
   u'''    antenna_stations: $("antenna_stations") || "",''', u'''    antenna_stations: "",''', TM, "main"),

  # ---- メイン：既定は今までと同じ ----
  (u"★既定なのに主アンテナの見出しが変わる",
   u'''    mainTop2:"八戸14-24+二戸50ch", secondTop:''', u'''    mainTop2:"八戸14-24+二戸50ch ", secondTop:''', TM, "main"),
  (u"★既定なのに付箋に行を足す",
   u'''    aptSecondTop:"46CH", noteLine:"" };''', u'''    aptSecondTop:"46CH", noteLine:"受信: ふだん" };''', TM, "main"),
  (u"★既定なのに14-24chの線の曲がり角がずれる（今と同じ線にならない）",
   u'''        { x: leftFrom.x, y: inY1 },''',
   u'''        { x: leftFrom.x + 1, y: inY1 },''', TM, "main"),

  # ---- メイン：局の組み合わせ ----
  (u"★主アンテナの見出しを変えない",
   u'''    : "主系統\\n" + staL.mainTop2;''', u'''    : "主系統\\n八戸14-24+二戸50ch";''', TM, "main"),
  (u"★2本目の見出しを三沢のままにする",
   u'''        toplabel: staL.secondTop,''', u'''        toplabel:"三沢局\\n46ch 専用",''', TM, "main"),
  (u"★2本目の線の名前を三沢のままにする",
   u'''staL.secondWire + chLen''', u'''"46ch(三沢局)" + chLen''', TM, "main"),
  (u"★2分配の右の線の名前を50chのままにする",
   u'''      mkLabel(svg, rightOut.x + 2, rightOut.y + 10, staL.splitRight, "wire-label");''',
   u'''      mkLabel(svg, rightOut.x + 2, rightOut.y + 10, "50ch", "wire-label");''', TM, "main"),
  (u"2分配の箱の字を変えない",
   u''': staL.spLabel2;''', u''': "2分配\\n(14-24/50別調整)";''', TM, "main"),
  (u"★付箋に「受信」の行を足さない",
   u'''    if(staL.noteLine) lines.push(staL.noteLine);''', u'''    void 0;''', TM, "main"),
  (u"★3本構成・3分配器WPでも局の組み合わせが効く",
   u'''  if(noPair) return Object.assign(def, { applicable:false });''',
   u'''  if(false) return Object.assign(def, { applicable:false });''', TM, "main"),
  (u"★2本目のラインブースターの箱が「LB(46ch)」のまま",
   u'''80, 32, staL.lb46Label,''', u'''80, 32, "LB(46ch)\\nUB18L",''', TM, "main"),
  (u"アパート共用部の図の2本目を46CHのままにする",
   u'''top: stationLayout(input).aptSecondTop });''', u'''top: "46CH" });''', TM, "main"),
  (u"画面の46CHアンテナの見出しを差し替えない",
   u'''    setTxt(document.getElementById("antenna_46_label"), staL.secondFieldLabel);''', u'''    void 0;''', TM, "main"),
  (u"場所の選択肢の局名を差し替えない",
   u'''      setTxt(lbSel.querySelector('option[value="sp_right"]'), staL.lbPosRight);''', u'''      void 0;''', TM, "main"),

  # ---- メイン：ラインブースターの場所 ----
  (u"★分配後にしてもHPFの下に箱が残る（2台に見える）",
   u'''  if(input.line_booster && !lbPos){''', u'''  if(input.line_booster){''', TM, "main"),
  (u"★枝の上に箱を出さない",
   u'''  if(lbPos && outerSp){''', u'''  if(false){''', TM, "main"),
  (u"★枝の箱の左右が逆",
   u'''    const brX = (lbPos === "sp_left") ? outerSp.x + 20 : outerSp.x + outerSp.w - 20;''',
   u'''    const brX = (lbPos === "sp_right") ? outerSp.x + 20 : outerSp.x + outerSp.w - 20;''', TM, "main"),
  (u"★枝の箱を80幅にする（左の枝で屋外の枠にかかる）",
   u'''    lbSpNode = mkNode(svg, brX - 32, outerSp.bottom.y + 26, 64, 32, "LB\\nUB18L",''',
   u'''    lbSpNode = mkNode(svg, brX - 40, outerSp.bottom.y + 26, 80, 32, "LB\\nUB18L",''', TM, "main"),
  (u"★HPFの下で動かした位置を枝の箱に持ち込む（nodeKey を lb にする）",
   u'''        nodeKey:"lb_sp", axisLock:"y" });''', u'''        nodeKey:"lb", axisLock:"y" });''', TM, "main"),
  (u"枝の箱を横にも動かせる（枝の線から外れる）",
   u'''        nodeKey:"lb_sp", axisLock:"y" });''', u'''        nodeKey:"lb_sp" });''', TM, "main"),
  (u"★50chの線を箱で割らない（線が箱を突き抜ける）",
   u'''      if(rightFrom !== rightOut) mkWire(svg, [ rightOut, lbSpNode.top ], { existing: false, wireKey:"main_amp_2" });''',
   u'''      void 0;''', TM, "main"),
  (u"★割った線に別の鍵を付ける（線色の切り替え・積算の判定がばらばら）",
   u'''      if(rightFrom !== rightOut) mkWire(svg, [ rightOut, lbSpNode.top ], { existing: false, wireKey:"main_amp_2" });''',
   u'''      if(rightFrom !== rightOut) mkWire(svg, [ rightOut, lbSpNode.top ], { existing: false, wireKey:"main_amp_2_lb" });''', TM, "main"),
  (u"★14-24chの線を箱で割らない",
   u'''      if(leftFrom !== leftOut)   mkWire(svg, [ leftOut,  lbSpNode.top ], { existing: false, wireKey:"main_amp_1" });''',
   u'''      void 0;''', TM, "main"),
  (u"★3分配でも枝に移す（2分配の無い構成で図面が変わる）",
   u'''    && !input.ch50_separate && input.outer_splitter !== "sp_3cw";''', u'''    && !input.ch50_separate;''', TM, "main"),
  (u"★アパートでも「場所」の欄を出す",
   u'''    const lbPosOn = lbPosApplicable(STATE.input) && !((parseInt(STATE.input.apt_units, 10) || 0) >= 2);''',
   u'''    const lbPosOn = lbPosApplicable(STATE.input);''', TM, "main"),
  (u"★「場所」の欄をいつも出す",
   u'''      el.style.display = lbPosOn ? "" : "none";''', u'''      el.style.display = "";''', TM, "main"),
  (u"★「局」の欄をいつも出す",
   u'''      el.style.display = staL.applicable ? "" : "none";''', u'''      el.style.display = "";''', TM, "main"),

  # ---- 現場入力 ----
  (u"★現場入力の「局」の既定を変える",
   u'''ch46:"yes",antenna_stations:"",bs_cs:"no",''', u'''ch46:"yes",antenna_stations:"hachinohe_misawa",bs_cs:"no",''', TG, "genba"),
  (u"★現場入力の「場所」の既定を変える",
   u'''split_all_pass:"no",line_booster_pos:"",''', u'''split_all_pass:"no",line_booster_pos:"sp_right",''', TG, "genba"),
  (u"★現場で選んだ「場所」をPCへ渡さない",
   STR + u'''    "antenna_stations","line_booster_pos",   // 版174''',
   STR + u'''    "antenna_stations",   // 版174''', TG, "genba"),
  (u"★知っている欄に入れない（画面で直しても保存でPCの値に戻る）",
   KNOWN + u'''  "antenna_stations","line_booster_pos",   // 版174''',
   KNOWN + u'''  // 版174''', TG, "genba"),
  (u"★3本構成・3分配器WPでも「局」の欄が出る",
   u'''  return m.ch46!=="triple" && !(m.amplifier==="amp_3u43" && m.outer_splitter==="sp_3cw");''',
   u'''  return true;''', TG, "genba"),
  (u"★アパートでも「場所」の欄が出る",
   u'''    && m.outer_splitter!=="sp_3cw" && !mIsApt();''', u'''    && m.outer_splitter!=="sp_3cw";''', TG, "genba"),
  (u"★1入力の増幅器でも「場所」の欄が出る",
   u'''  return m.line_booster==="yes" && m.amplifier==="amp_3u43" && m.ch46!=="triple"''',
   u'''  return m.line_booster==="yes" && m.ch46!=="triple"''', TG, "genba"),
  (u"★選択肢の名前を局で変えない",
   u'''     get opts(){ return lbPosOptsFor(M); },''', u'''''', TG, "genba"),
  (u"選べる値がPCと違う",
   u'''["sp_right","分配後 50ch（めんこい）だけ"]''', u'''["sp_r","分配後 50ch（めんこい）だけ"]''', TG, "genba"),
  (u"「局」の値がPCと違う",
   u'''["hachinohe_misawa","八戸＋三沢"]''', u'''["hachinohe_misawa2","八戸＋三沢"]''', TG, "genba"),
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
