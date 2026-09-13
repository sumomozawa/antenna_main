# -*- coding: utf-8 -*-
# 版159 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
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
  # ---- メイン：戸別ファイルへの書き戻しと写真 ----
  ("★取り込んだ現場の写真をファイルへ書かない（元のファイルの写真だけにする）",
   u'''      const merged = mergeGenbaPhotos(basePhotos, addable, {}, null);''',
   u'''      const merged = Array.isArray(basePhotos) ? basePhotos : [];''',
   "smoke_v159_main.js", "main"),
  ("★和集合ではなく、行の写真でファイルを上書きする（ファイルの写真が消える）",
   u'''      const merged = mergeGenbaPhotos(basePhotos, addable, {}, null);''',
   u'''      const merged = addable;''', "smoke_v159_main.js", "main"),
  ("★元のファイルを読めなくても上書きする（写真を丸ごと失う）",
   u'''    if(!baseRead) return null;''', u'''    if(false) return null;''', "smoke_v159_main.js", "main"),
  ("★サムネの行でも和集合にする（写真IDの無いサムネが足されて2枚になる）",
   u'''  const thumbish = !!data.chosho_photos_thumb || !!row._fromProject;   // サムネ＝原寸ではない''',
   u'''  const thumbish = false;''', "smoke_v159_main.js", "main"),
  ("★サムネの行に「開いて書き戻す」印が付いていると原寸を上書きする",
   u'''  const photosKnown = !!row._photosKnown && !thumbish;''',
   u'''  const photosKnown = !!row._photosKnown;''', "smoke_v159_main.js", "main"),
  ("★書き戻せなかったことを黙って捨てる",
   u'''    return "\\n\\u26a0 戸別ファイルへの書き戻しに失敗しました（" + ((err && err.message) || err) + "）"; }''',
   u'''    return ""; }''', "smoke_v159_main.js", "main"),
  ("★書き戻しの失敗を、取り込みのまとめの知らせに出さない",
   u'''            if(wnote && /\\u26a0/.test(String(wnote))) notes.push("\\u30fb管理番号 " + mg + "：" + String(wnote).replace(/\\s*\\n\\s*/g, " ").trim()); }''',
   u'''            void wnote; }''', "smoke_v159_main.js", "main"),
  ("読めなかったときに、書かずに理由を伝えるのをやめる",
   u'''  if(!contentObj){''', u'''  if(false && !contentObj){''', "smoke_v159_main.js", "main"),

  ("★0バイト・BOM付きのファイルがあると、その戸別が二度と書けない",
   u'''        const t = String(await (await existingFh.getFile()).text()).replace(/^\\uFEFF/, "").trim();
        if(!t){ basePhotos = undefined; baseRead = true; }        // 空＝失うものが無い
        else { const j = JSON.parse(t); basePhotos = j && j.chosho_photos; baseRead = true; }''',
   u'''        const j = JSON.parse(await (await existingFh.getFile()).text()); basePhotos = j.chosho_photos; baseRead = true;''',
   "smoke_v159_main.js", "main"),
  ("★物件から開いた行（サムネ）で、取り込んだ現場の写真を捨てる",
   u'''      return rowPhotos.filter(x => x && x.id && !baseKeys.has(x.id));''',
   u'''      return [];''', "smoke_v159_main.js", "main"),
  ("★サムネの行で、写真IDを持たないものまで足す（同じ写真が2枚になる）",
   u'''      return rowPhotos.filter(x => x && x.id && !baseKeys.has(x.id));''',
   u'''      return rowPhotos;''', "smoke_v159_main.js", "main"),
  ("★サムネが、元のファイルの写真を置き換える（小さいPNGなど）",
   u'''      return rowPhotos.filter(x => x && x.id && !baseKeys.has(x.id));''',
   u'''      return rowPhotos.filter(x => x && x.id);''', "smoke_v159_main.js", "main"),
  ("★写真を消した枠まで数えて、現場から入れ直せなくする",
   u'''        .filter(x => x && x.dataUri).map(keyOf).filter(Boolean));''',
   u'''        .map(keyOf).filter(Boolean));''', "smoke_v159_main.js", "main"),
  ("写真が戻ってきた枠を、空の枠のまま残す",
   u'''                     && !(x.id && mergedIds.has(x.id)));   // 写真が戻ってきた枠は、枠のまま残さない''',
   u'''                     );''', "smoke_v159_main.js", "main"),
  ("★普段の保存（物件へ保存）でも ⚠ を出す",
   u'''  if(!dir) return "\\n（戸別の個別JSONは更新していません：工事フォルダ未リンク）";''',
   u'''  if(!dir) return "\\n\\u26a0 戸別の個別JSONは更新していません（工事フォルダを掴めていません）。";''',
   "smoke_v159_main.js", "main"),
  ("★工事フォルダを掴めなくても、戸別ごとに聞き直す",
   u'''  if(_genbaNoDir) return noDirNote;          // 1件目で掴めなかった＝残りも同じ。何度も窓を出さない''',
   u'''  void 0;''', "smoke_v159_main.js", "main"),
  ("★足せる写真が無かったとき、空の枠が書き戻すたびに倍に増える",
   u'''        .filter(x => x && !x.dataUri && merged.indexOf(x) < 0''',
   u'''        .filter(x => x && !x.dataUri && true''', "smoke_v159_main.js", "main"),
  ("★工事フォルダを掴めていないのに、取り込みで知らせない",
   u'''        if(note && /工事フォルダ未リンク/.test(note)){ _genbaNoDir = true; return noDirNote; }''',
   u'''        void 0;''', "smoke_v159_main.js", "main"),
  ("取り込みのまとめに、書けていない件数・物件を開いていない知らせを出さない",
   u'''    const ngWrite = notes.filter(t => /\\u26a0/.test(String(t))).length;   // ⚠ が付くのは書き戻せなかった知らせだけ
    alert("📥 現場データ取込 完了\\n\\n取込: "+done+" 件"
      + (ngWrite ? ("（うち " + ngWrite + " 件は戸別ファイルへ書けていません）") : "")
      + " ／ スキップ: "+skipped+" 件"+(failed?(" ／ 失敗: "+failed+" 件"):"")
      + (!_currentProject ? "\\n\\n※ 物件を開いていないので、戸別ファイルへは書き戻していません（この一覧の中だけの取り込みです）。\\n　 受付台帳の「💾 戸別ファイルへ反映」か、戸別を開いて「保存」で書けます。" : "")
      + (notes.length?("\\n\\n"+notes.join("\\n")):""));''',
   u'''    alert("📥 現場データ取込 完了\\n\\n取込: "+done+" 件 ／ スキップ: "+skipped+" 件"+(failed?(" ／ 失敗: "+failed+" 件"):"")+(notes.length?("\\n\\n"+notes.join("\\n")):""));''',
   "smoke_v159_main.js", "main"),
  ("名前だけ付けた空の枠を消す",
   u'''      data.chosho_photos = slots.length ? merged.concat(slots) : merged;''',
   u'''      data.chosho_photos = merged;''', "smoke_v159_main.js", "main"),
  ("★書き込み先のファイルの写真を土台にしない（書き戻しで消える）",
   u'''  if(!photoSrcFh && fh) photoSrcFh = fh;''', u'''  void 0;''', "smoke_v159_main.js", "main"),

  # ---- 現場入力：控え ----
  ("★写真の控えが失敗しても黙っている",
   u'''    if(!persistModel._warned){ persistModel._warned=true;''',
   u'''    if(false){ persistModel._warned=true;''', "smoke_v159_genba.js", "genba"),
  ("いまの戸別の控えが失敗しても、保存バーを赤くしない",
   u'''    if(m === M) saveStateFailed();''', u'''    void 0;''', "smoke_v159_genba.js", "genba"),
  ("別の戸別の失敗で、いまの戸別の保存バーまで赤くする",
   u'''    if(m === M) saveStateFailed();''', u'''    saveStateFailed();''', "smoke_v159_genba.js", "genba"),
  ("一度うまくいったあと、次の失敗を知らせない",
   u'''    persistModel._warned=false;
  }catch(e){
    console.warn("persistModel failed",e);''',
   u'''  }catch(e){
    console.warn("persistModel failed",e);''', "smoke_v159_genba.js", "genba"),
  ("★起動で、申し出の返事を待ってしまう（前回の下書きが読み込まれない）",
   u'''  try{ askPersistentStorage(); }catch(_){}
})();''',
   u'''  try{ await askPersistentStorage(); }catch(_){}
})();''', "smoke_v159_genba.js", "genba"),
  ("別の戸別の控えが失敗したときに、どの戸別かを言わない",
   u'''      toast(no && m !== M''', u'''      toast(false''', "smoke_v159_genba.js", "genba"),
  ("★下書きを消されにくくする申し出をしない",
   u'''    return !!(await st.persist());''', u'''    return false;''', "smoke_v159_genba.js", "genba"),
  ("申し出済みでも毎回申し出る",
   u'''    if(typeof st.persisted === "function" && await st.persisted()) return true;   // もう申し出済み''',
   u'''    void 0;''', "smoke_v159_genba.js", "genba"),
  ("保存のたびに、使っていない控えをもう1つ作る",
   u'''  const json=JSON.stringify(state);
  const fname=currentFileName();''',
   u'''  const json=JSON.stringify(state);
  const blob=new Blob([json],{type:"application/json"});
  const fname=currentFileName();''', "smoke_v159_genba.js", "genba"),
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
