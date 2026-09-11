# -*- coding: utf-8 -*-
# 版156 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる
import io, subprocess
import os
HERE = os.path.dirname(os.path.abspath(__file__))        # …/antenna_main/開発ツール/試験/変異
SP = os.path.join(HERE, "..") + os.sep                   # 試験の置き場所
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))   # 3つのリポジトリの親
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUT = os.path.join(HERE, "mut_genba.html")               # 壊した写し（git には入れない）
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")

CASES = [
  # ---- 写真（憲法1）----
  ("★写真の和集合をやめる（PCの写真が消える）",
   '  state.chosho_photos = mergePhotosUnion(state.chosho_photos, old.chosho_photos, base);',
   '  void 0;', "smoke_pcbase.js"),
  ("★控えに写真を載せない（写真の歯止めがまるごと効かなくなる）",
   '    photos: ((st.chosho_photos || (fileObj && fileObj.chosho_photos) || [])).filter(p => p && p.dataUri).map(p => ({',
   '    photos: ((st.chosho_photos || [])).filter(p => p && p.dataUri).map(p => ({', "smoke_pcbase.js"),
  ("★PCのファイルに入っている写真を、現場で消せるようにする",
   '    if(id0 && b0 && b0.photos.some(x => x.id === id0)){',
   '    if(false){', "smoke_pcbase.js"),
  ("写真IDの副本を残さない（下書きが消えたら守れない）",
   '      pbaseSet(M.chosho_mgmt_no, (raw.chosho_photos || []).filter(p => p && p.dataUri)',
   '      if(0) pbaseSet(M.chosho_mgmt_no, (raw.chosho_photos || []).filter(p => p && p.dataUri)', "smoke_pcbase.js"),

  # ---- 書くものが無ければ書かない（G1）----
  ("★この端末で何も入力していない戸別でも書いてしまう",
   '  if(nothingNew){', '  if(false){', "smoke_pcbase.js"),
  ("G1 の判定を _touched を立てたあとに取る（一度も効かなくなる）",
   '  const nothingNew = isNothingNewHere(M);\n  const state=buildState();',
   '  const state=buildState();\n  const nothingNew = (M._touched = true) && isNothingNewHere(M);', "smoke_pcbase.js"),
  ("★まとめて保存で、何も入力していない戸別まで書き替える",
   '    if(isNothingNewHere(rec.model)){ skippedNothing.push(no); return; }',
   '    if(false){ skippedNothing.push(no); return; }', "smoke_pcbase.js"),

  # ---- 控え（3つ見比べ）----
  ("★読み込んでも控えを取らない",
   '      fileBaseSet(M, fileBaseStateOf(raw), fname, raw);',
   '      void 0;', "smoke_pcbase.js"),
  ("★控えがあるのに、現場が直した分をファイルの値で上書きする",
   '      if(mineF !== baseF)       take = "mine";       // 現場が付けた／取り消した',
   '      if(mineF !== baseF)       take = "theirs";', "smoke_pcbase.js"),
  ("★PCが直した分を採らない（PCの直しが現場の値で戻る）",
   '      if(mSame && !tSame){ state[k] = old[k]; out.changed.push(k); out.kept.push(label(k)); return; }',
   '      if(mSame && !tSame){ out.mine.push(label(k)); return; }', "smoke_pcbase.js"),
  ("日時の競合を既定で現場にする（PCの内容が黙って消える）",
   '        if(!opt || opt.mode !== "load"){ state[k] = old[k]; out.changed.push(k); }',
   '        void 0;', "smoke_pcbase.js"),
  ("★書けたあとに控えを取り直さない（次の保存で壊れる）",
   '  fileBaseSet(model, mine, fname, fileObj);',
   '  void 0;', "smoke_pcbase.js"),
  ("★書けたあとにファイルから採った分をモデルへ入れない",
   '  adoptStateIntoModel(model, st, keys);',
   '  void 0;', "smoke_pcbase.js"),
  ("控えを「整えたあと」ではなく生のファイルから作る（金額の穴）",
   '  if(antennaGuideActive(m.antenna_guide)) autoReflectGuideInto(m, m.antenna_guide);\n  const st = buildStateOf(m);',
   '  const st = buildStateOf(m);', "smoke_pcbase.js"),
  ("管理番号が変わっても控えを使い回す",
   '  if(!no || no !== String(b.no || "")){ delete model._fileBase; return null; }',
   '  if(!no) return null;', "smoke_pcbase.js"),

  # ---- 控えが無いときの守り（版155で直した不具合を戻さない）----
  ("★控えが無いとき、台帳の控えで「現場が取り消したか」を見ない",
   '    else if(hasRc)             take = (mineF || baseBoolVal(rcB, st.flag)) ? "mine" : "theirs";',
   '    else if(hasRc)             take = "theirs";', "smoke_pcbase.js"),
  ("★控えが無いとき、PCの工程の印を現場の既定値で消す",
   '    else if(!mineF && theirF)  take = "theirs";',
   '    else if(!mineF && theirF)  take = "mine";', "smoke_pcbase.js"),
  ("★控えが無いとき、台帳の控えで値を見分けない（現場が消した時刻が戻る）",
   '    if(rcB && baseHas(rcB, k)){',
   '    if(false && rcB && baseHas(rcB, k)){', "smoke_pcbase.js"),
  ("★控えが無いとき、PCで選んだ中身を現場の既定値で潰す",
   '    if(mergeUntouchedVal(k, state[k]) && !mergeIsUnset(old[k])){',
   '    if(false){', "smoke_pcbase.js"),
  ("作りたて比べが行き過ぎる（現場で入れた内容まで上書き）",
   '  try{ return JSON.stringify(v) === JSON.stringify(mergeFreshState()[k]); }catch(_){ return false; }',
   '  return true;', "smoke_pcbase.js"),
  ("★控えが無いとき、石綿を「空か」だけで見る（PCの判定が既定値で潰れる）",
   '      } else if(asbMine){ keptMine = true; }            // 控えなし＝現場がこの建物の石綿を入れている',
   '      } else if(false){ keptMine = true; }', "smoke_pcbase.js"),
  ("控えが無いのに、置き換わるものを確かめない",
   '        if(!baseUseValues(base) && (mg.mine.length || mg.conflicts.length)){',
   '        if(false){', "smoke_pcbase.js"),

  # ---- アパート・TV・門番・別名ファイル ----
  ("★アパートの石綿が世帯ごとにばらける",
   '  if(mergeAptUnits(state, old, model, useB ? base : null) >= 2){',
   '  if(aptUnitsOf(state) >= 2){', "smoke_pcbase.js"),
  ("★TVの台数と部屋の数を最後にそろえない",
   '  mergeTvSyncState(state);\n  FLOW_STEPS.forEach(st => { if(!state[st.flag]) state[st.at] = ""; });',
   '  FLOW_STEPS.forEach(st => { if(!state[st.flag]) state[st.at] = ""; });', "smoke_pcbase.js"),
  ("TVの台数と部屋をばらばらに採る",
   '  if(!tvMine && TV_GROUP.some(k => (k in old))){',
   '  if(true){', "smoke_pcbase.js"),
  ("★別の戸別のファイルに書き込むのを止めない",
   '    out.stop = true; out.reason = "別の戸別（" + thNo + "）の内容です";',
   '    out.reason = "";', "smoke_pcbase.js"),
  ("★別名ファイルを中の管理番号でふるわない（別の戸別を混ぜる）",
   '    if(draftNoKey(j.chosho_mgmt_no) !== no) continue;      // ★中の管理番号でふるう（最後の砦）',
   '    void 0;', "smoke_pcbase.js"),
  ("同じ戸別の別名ファイル（.json.txt）を見ない",
   '  (await caseFileIndex(dir)).forEach(n => { if(re.test(n) && names.indexOf(n) < 0) names.push(n); });',
   '  void 0;', "smoke_pcbase.js"),

  # ---- 工事完了（憲法2）----
  ("★現場が取り消した工事完了なのに、状態を完了のままにする",
   '    if(wasOn) state.chosho_status = "in_progress";                  // 現場が取り消したときだけ下げる',
   '    void 0;', "smoke_pcbase.js"),
  ("★PCだけの項目（積算・図面）を現場の中身で消す",
   '    if(isPcOwnedKey(model, k)){                                   // (a) 現場に欄が無い',
   '    if(false){', "smoke_pcbase.js"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
red = 0
for name, old, new, test in CASES:
    if _only and _only not in name: continue
    base = io.open(GENBA, encoding="utf-8", newline="").read()
    o, n = CR(old), CR(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); continue
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    r = subprocess.run(["node", SP + test, "file://" + OUT], capture_output=True, text=True, timeout=900)
    last = [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")][:1]
    isred = r.returncode != 0
    if isred: red += 1
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:110] for x in last))
print("=== 赤 %d / %d ===" % (red, len([c for c in CASES if not _only or _only in c[0]])))
