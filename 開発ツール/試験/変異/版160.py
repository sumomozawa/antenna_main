# -*- coding: utf-8 -*-
# 版160 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  # ---- メイン：積算 ----
  (u"★46CHのラインブースターを主系統と同じ行にまとめる",
   u'''  if(input.ch46 && input.line_booster_46) add("booster_ub18l", 1, { note:"46CH系統(三沢局)" });''',
   u'''  if(input.ch46 && input.line_booster_46) add("booster_ub18l", 1);''',
   "smoke_v160_main.js", "main"),
  (u"★主系統の行にも注記を付ける（保存済みの数量の直しが外れる）",
   u'''  if(input.line_booster) add("booster_ub18l", 1);''',
   u'''  if(input.line_booster) add("booster_ub18l", 1, { note:"主系統" });''',
   "smoke_v160_main.js", "main"),
  (u"★46CHアンテナが無いのに計上する",
   u'''  if(input.ch46 && input.line_booster_46) add("booster_ub18l", 1, { note:"46CH系統(三沢局)" });''',
   u'''  if(input.line_booster_46) add("booster_ub18l", 1, { note:"46CH系統(三沢局)" });''',
   "smoke_v160_main.js", "main"),
  (u"★46CHアンテナが無いときも欄が出る",
   u'''          <div class="field ch46-only">
            <label><span data-tip="46CH(三沢局)専用アンテナの直下に入れるラインブースター。''',
   u'''          <div class="field">
            <label><span data-tip="46CH(三沢局)専用アンテナの直下に入れるラインブースター。''',
   "smoke_v160_main.js", "main"),
  (u"★46CHのラインブースターを既定で「あり」にする",
   u'''    line_booster:"yes", line_booster_46:"no", hpf:"hpf_dtf",''',
   u'''    line_booster:"yes", line_booster_46:"yes", hpf:"hpf_dtf",''',
   "smoke_v160_main.js", "main"),

  # ---- メイン：保存・現場との往復 ----
  (u"★選んだ値を保存しない",
   u'''    "amplifier","line_booster","line_booster_46","hpf","outer_splitter","indoor_split",''',
   u'''    "amplifier","line_booster","hpf","outer_splitter","indoor_split",''',
   "smoke_v160_main.js", "main"),
  (u"★現場入力から取り込む欄の一覧に入れない",
   u'''  "amplifier","line_booster","line_booster_46","hpf","outer_splitter","indoor_split","split_all_pass",''',
   u'''  "amplifier","line_booster","hpf","outer_splitter","indoor_split","split_all_pass",''',
   "smoke_v160_main.js", "main"),
  (u"取り込みの見出しが英字のままになる",
   u'''line_booster_46:"ラインブースター(46CH系統)",''', u'''''',
   "smoke_v160_main.js", "main"),
  (u"★保存データから積算をやり直す道で拾わない",
   u'''    line_booster_46: d.line_booster_46 === "yes",''',
   u'''    line_booster_46: false,''',
   "smoke_v160_main.js", "main"),

  # ---- メイン：図面 ----
  (u"★図面に46CHのラインブースターを出さない",
   u'''  if(ant46 && input.line_booster_46){''', u'''  if(false){''',
   "smoke_v160_main.js", "main"),
  (u"★線を箱で割らない（線が箱を突き抜ける）",
   u'''    if(lb46Node) mkWire(svg, [ ant46.bottom, lb46Node.top ], { existing: false, wireKey:"ch46_amp" });''',
   u'''    void 0;''',
   "smoke_v160_main.js", "main"),
  (u"★箱を主系統の縦位置に置く（46CHアンテナの真下にならない）",
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "LB(46ch)\\nUB18L",''',
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, 400, 80, 32, "LB(46ch)\\nUB18L",''',
   "smoke_v160_main.js", "main"),
  (u"箱を横へも動かせる（縦線から外れる）",
   u'''        nodeKey:"lb46", axisLock:"y" });''',
   u'''        nodeKey:"lb46" });''',
   "smoke_v160_main.js", "main"),
  (u"箱の中の字を空にする（何の箱か分からない）",
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "LB(46ch)\\nUB18L",''',
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "",''',
   "smoke_v160_main.js", "main"),

  (u"\u2605\u524d\u306b\u4f5c\u3063\u305f\u30e6\u30fc\u30b6\u30fc\u30d7\u30ea\u30bb\u30c3\u30c8\u3092\u62bc\u3059\u3068\u3001\u524d\u306e\u6238\u5225\u306e\u5024\u304c\u6b8b\u308b",
   u'''  resetLaterAddedFields(p);   // \u7248160\u3088\u308a\u524d\u306b\u4f5c\u3063\u305f\u30e6\u30fc\u30b6\u30fc\u30d7\u30ea\u30bb\u30c3\u30c8\u5bfe\u7b56''',
   u'''  void 0;''',
   "smoke_v160_main.js", "main"),
  (u"\u2605\u53e4\u3044\u6238\u5225\u3092\u958b\u3044\u305f\u3068\u304d\u306e\u53d7\u3051\u76bf\u3092\u5916\u3059",
   u'''  resetLaterAddedFields(s);   // \u7248160\u3088\u308a\u524d\u306b\u4fdd\u5b58\u3057\u305f\u6238\u5225\u5bfe\u7b56''',
   u'''  void 0;''',
   "smoke_v160_main.js", "main"),
  (u"\u2605\u53d7\u3051\u76bf\u306e\u4e00\u89a7\u304b\u308946CH\u306e\u6b04\u3092\u843d\u3068\u3059",
   u'''  line_booster_46: "no"   // \u7248160: 46CH(\u4e09\u6ca2\u5c40)\u7cfb\u7d71\u306e\u30e9\u30a4\u30f3\u30d6\u30fc\u30b9\u30bf\u30fc''',
   u'''  _unused_v160: "no"''',
   "smoke_v160_main.js", "main"),
  (u"\u2605\u56f3\u9762\u306e\u7bb1\u304c\u4e3b\u7cfb\u7d71\u3068\u540c\u3058\u5b57\u306b\u306a\u308b\uff08\u7d19\u3067\u898b\u5206\u3051\u3089\u308c\u306a\u3044\uff09",
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "LB(46ch)\\nUB18L",''',
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "LB\\nUB18L",''',
   "smoke_v160_main.js", "main"),
  (u"\u2605\u6301\u51fa\u6750\u6599\u30fb\u5354\u529b\u4f1a\u793e\u306e\u5185\u8a33\u3067\u3001\u540c\u3058\u540d\u524d\u306e2\u884c\u306b\u306a\u308b",
   u'''      m.disp = (nameCount[m.name] > 1 && m.note) ? (m.name + "\uff08" + m.note + "\uff09") : m.name;''',
   u'''      m.disp = m.name;''',
   "smoke_v160_main.js", "main"),
  (u"\u56f3\u9762\u306e\u7bb1\u306e\u5b57\u304c\u679c\u304b\u3089\u306f\u307f\u51fa\u308b",
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "LB(46ch)\\nUB18L",''',
   u'''    lb46Node = mkNode(svg, ant46Cx - 40, ant46.bottom.y + 26, 80, 32, "\u30e9\u30a4\u30f3\u30d6\u30fc\u30b9\u30bf\u30fc(46ch\u7cfb\u7d71\u30fb\u4e09\u6ca2\u5c40)\\nUB18L",''',
   "smoke_v160_main.js", "main"),

  (u"★古い戸別を取り込むたびに、触っていない項目が「変わった」と並ぶ",
   u'''    const untouchedNew = (k in LATER_ADDED_FIELDS) && !(k in base)
      && String(g[k]) === String(LATER_ADDED_FIELDS[k]);''',
   u'''    const untouchedNew = false;''',
   "smoke_v160_main.js", "main"),
  (u"★現場で直した所まで「変わっていない」ことにする",
   u'''    const untouchedNew = (k in LATER_ADDED_FIELDS) && !(k in base)
      && String(g[k]) === String(LATER_ADDED_FIELDS[k]);''',
   u'''    const untouchedNew = (k in LATER_ADDED_FIELDS);''',
   "smoke_v160_main.js", "main"),

  # ---- 現場入力 ----
  (u"★46CHアンテナが無いときも現場入力に欄が出る",
   u'''    {id:"line_booster_46", type:"seg", label:"ラインブースター（46CH系統）", show:m=>m.ch46!=="no",''',
   u'''    {id:"line_booster_46", type:"seg", label:"ラインブースター（46CH系統）",''',
   "smoke_v160_genba.js", "genba"),
  (u"★現場入力の既定を「あり」にする",
   u'''  line_booster:"yes",line_booster_46:"no",hpf:"hpf_std",''',
   u'''  line_booster:"yes",line_booster_46:"yes",hpf:"hpf_std",''',
   "smoke_v160_genba.js", "genba"),
  (u"★現場で選んだ値をPCへ渡さない",
   u'''    "connector_type","connector_qty","turnbuckle_qty","amplifier","line_booster","line_booster_46","hpf","outer_splitter",''',
   u'''    "connector_type","connector_qty","turnbuckle_qty","amplifier","line_booster","hpf","outer_splitter",''',
   "smoke_v160_genba.js", "genba"),
  (u"★取り込みの突合で「知らない項目」になる",
   u'''
  "connector_type","connector_qty","turnbuckle_qty","amplifier","line_booster","line_booster_46","hpf","outer_splitter",''',
   u'''
  "connector_type","connector_qty","turnbuckle_qty","amplifier","line_booster","hpf","outer_splitter",''',
   "smoke_v160_genba.js", "genba"),
  (u"選べる中身を主系統と違うものにする",
   u'''  line_booster_46:[["no","なし"],["yes","UB18L"]],''',
   u'''  line_booster_46:[["no","なし"],["yes","UB20L"]],''',
   "smoke_v160_genba.js", "genba"),
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
