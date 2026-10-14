# -*- coding: utf-8 -*-
# 版176 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力・メイン）
#   Android のタブレットで Dropbox の「その１」が選べず、見るだけの戸別を保存できなかった直し。
#   ・現場入力：「📮 事務所に預ける」（別の名前で渡す。PCのファイルは書き替えない）・保存が止まったときの逃げ道・
#     預けモード・共有で渡す道（フォルダを覚えるのをやめる）・まとめて保存の預け・読むときに預けを入れない・
#     PCらしくないファイルで見るだけを外さない・320px ではみ出さない
#   ・メイン：預けを行にしない・「📮 預かりを振り分ける」（行き先は証拠だけで決める・控え → 読み直し → 書く → 読み返す
#     → 合わなければ戻す・預けは控えを取ってから片付ける）・📥 で預けを取り込む・戸別ファイルに _side を残さない
#   場面を絞って速くする（現場入力は SCENE、メインは ONLY に場面の記号を渡す）。全部で2時間ほどかかるので、
#   名前の一部を引数に渡して絞るか、「現場」「メイン」を引数に渡して分けて走らせるとよい。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM, TG = "smoke_v176_main.js", "smoke_v176_genba.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)  どのファイル＝ "main"／"genba"。場面＝その試験の場面の記号
CASES = [
  # ======== 現場入力 ========
  (u"預けの名前の決まりを末尾に固定する（端末が足した名前を預けと見ない）",
   u'''const SIDE_NAME_RE = /_(現場預け|振り分け)_\\d{8}-\\d{6}/;''',
   u'''const SIDE_NAME_RE = /_(現場預け|振り分け)_\\d{8}-\\d{6}(?:-\\d+)?\\.json$/;''', TG, "genba", u"⓪"),
  (u"その戸別のファイルを探す名前に、預けを入れる",
   u'''+ e + "(?![^\\\\\\\\/]*_(?:現場預け|振り分け)_\\\\d{8}-\\\\d{6})(?:''', u'''+ e + "(?:''', TG, "genba", u"⓪"),
  (u"預けの名前を変える",
   u'''  return n + "_現場預け_" + sideTimeTag(d) + ".json";''', u'''  return n + "_預け_" + sideTimeTag(d) + ".json";''', TG, "genba", u"⓪"),
  (u"1回の共有に10件より多く入れる",
   u'''const SIDE_SHARE_MAX_FILES = 10;''', u'''const SIDE_SHARE_MAX_FILES = 100;''', TG, "genba", u"㉗a"),
  (u"見るだけの窓から 📮 を外す",
   u'''  const items = [
    { label: "📮 事務所に預ける（PCのファイルは書き替えません）", value: "side", kind: "side",
      sub: "この端末で入れた内容と写真を、別の名前で渡します。事務所で正しい物件のリストへ振り分けて、1つにまとめます" },''',
   u'''  const items = [''', TG, "genba", u"①"),
  (u"見るだけの窓に、親もリストも無いフォルダでも 📁 を出す",
   u'''  if(window.showDirectoryPicker && pcGuardDirUseful()){''', u'''  if(window.showDirectoryPicker){''', TG, "genba", u"①"),
  (u"リストのフォルダでも 📁 を出さない",
   u'''function pcGuardDirUseful(){
  if(!_saveDir) return true;''', u'''function pcGuardDirUseful(){ return false;
  if(!_saveDir) return true;''', TG, "genba", u"㉙"),
  (u"預けで PCのファイルを読んだことにする（見るだけが外れる）",
   u'''  model._sideAt = t; model._sideHow = String(how || "");''',
   u'''  model._sideAt = t; model._sideHow = String(how || ""); model._fromCaseFile = true;''', TG, "genba", u"①"),
  (u"預けで、ほかの端末のファイルの印を消す",
   u'''  model._sideAt = t; model._sideHow = String(how || "");''',
   u'''  model._sideAt = t; model._sideHow = String(how || ""); delete model._otherFile;''', TG, "genba", u"㉖"),
  (u"台帳に無い戸別でも proj に台帳の物件名を入れる",
   u'''           proj: inLedger ? proj : "",''', u'''           proj: proj,''', TG, "genba", u"㉘b"),
  (u"台帳から入れた欄も touched に入れる",
   u'''    if(rcB && baseHas(rcB, k) && baseSame(rcB, k, v)) return;''', u'''''', TG, "genba", u"①"),
  (u"PCのファイルを読んだ控えでも当てにしない（PCの値まで touched に入る）",
   u'''      if(trust ? same : (same && fresh)) return;''', u'''      if(same && fresh) return;''', TG, "genba", u"㉘a"),
  (u"読んで取った控えの印を付けない",
   u'''      if(M._fileBase) M._fileBase.rd = true;''', u'''''', TG, "genba", u"㉘a"),
  (u"端末の中だけのフォルダに書いた控えも当てにする",
   u'''  return !!(d && (saveDirParentOf(d) || saveDirIsListName(d.name)));''', u'''  return true;''', TG, "genba", u"㉘b"),
  (u"足りない写真の枚数を書かない",
   u'''           place: place, lacks: lacks | 0,''', u'''           place: place, lacks: 0,''', TG, "genba", u"⑩"),
  (u"名前が空いているかを確かめない（名前も中身も見ずに書く）",
   u'''    if(taken) continue;
    const fh = await dir.getFileHandle(nm, { create:true });
    let used = false;
    try{
      const f0 = await fh.getFile();
      if(f0){
        if(typeof f0.size === "number") used = f0.size > 0;
        else if(typeof f0.text === "function"){ const t0 = await f0.text(); used = !!(t0 && t0.length); }
      }
    }catch(_){ used = true; }                        // 確かめられない＝その名前は使わない
    if(used) continue;''', u'''    const fh = await dir.getFileHandle(nm, { create:true });''', TG, "genba", u"③"),
  (u"作ったファイルに中身があっても書く",
   u'''    }catch(_){ used = true; }                        // 確かめられない＝その名前は使わない
    if(used) continue;''', u'''    }catch(_){ used = true; }''', TG, "genba", u"③"),
  (u"フォルダに預けたあと「📤 共有でも渡す」を出さない",
   u'''    escape: "share-also", _sideItems: done };''', u'''    escape: "", _sideItems: done };''', TG, "genba", u"②"),
  (u"「📤 共有でも渡す」で、置いた預けを共有しない",
   u'''    if(info && info.escape === "share-also" && info._sideItems && info._sideItems.length){''', u'''    if(false){''', TG, "genba", u"②"),
  (u"共有できない端末でも 📤 を出す",
   u'''    if(canShare) ch.push(''', u'''    if(true) ch.push(''', TG, "genba", u"④"),
  (u"フォルダの無い端末でも 📁 を出す",
   u'''    if(dirName) ch.push(''', u'''    if(true) ch.push(''', TG, "genba", u"④"),
  (u"共有をやめたら黙る（版175 に戻す）",
   u'''    if(sr.aborted){ _lastSaveInfo = saveCancelInfo(fname); return true; }   // ★黙らない★（版176）''',
   u'''    if(sr.aborted) return false;''', TG, "genba", u"⑤a"),
  (u"保存先を選ぶ画面を閉じたら黙る（版175 に戻す）",
   u'''      if(e && e.name==="AbortError"){ _lastSaveInfo = saveCancelInfo(fname); return true; }''',
   u'''      if(e && e.name==="AbortError") return false;''', TG, "genba", u"⑤b"),
  (u"結果の窓に 📮 を出さない",
   u'''  const escWhy = (info && info.escape) ? String(info.escape) : "";''', u'''  const escWhy = "";''', TG, "genba", u"⑥"),
  (u"許可が取れないとき 📮 を出さない",
   u'''"（この端末の入力と写真は、そのまま残っています）", warn: true, escape: "perm" };''',
   u'''"（この端末の入力と写真は、そのまま残っています）", warn: true };''', TG, "genba", u"⑥"),
  (u"書けないとき 📮 を出さない",
   u'''"（この端末の入力と写真は、そのまま残っています）", warn: true, escape: "write" };''',
   u'''"（この端末の入力と写真は、そのまま残っています）", warn: true };''', TG, "genba", u"⑦"),
  (u"読めないとき 📮 を出さない",
   u'''（この端末の入力と写真は、そのまま残っています）", warn: true, escape: "unread" };''',
   u'''（この端末の入力と写真は、そのまま残っています）", warn: true };''', TG, "genba", u"⑧"),
  (u"読み返しが合わないとき 📮 を出さない",
   u'''台帳の「まとめて保存」をお試しください。", warn: true, escape: "verify" };
        toast("⚠ 保存を確かめられませんでした：" + fname);
        try{ const b = fileBaseGet(M); if(b) b.stale = true; }catch(_){}''',
   u'''台帳の「まとめて保存」をお試しください。", warn: true };
        toast("⚠ 保存を確かめられませんでした：" + fname);
        try{ const b = fileBaseGet(M); if(b) b.stale = true; }catch(_){}''', TG, "genba", u"⑨"),
  (u"写真の歯止めで 📮 を出さない",
   u'''msg: photoMissingText(miss), warn: true, escape: "photo" };''', u'''msg: photoMissingText(miss), warn: true };''', TG, "genba", u"⑩"),
  (u"帯に「📮 入力して事務所に預ける」を出さない",
   u'''    +   '<button type="button" id="pcg-side" class="side">📮 入力して事務所に預ける</button>\'''',
   u'''    +   \'\'''', TG, "genba", u"⑪"),
  (u"預けモードにしない",
   u'''  M._sideOnly = pcGuardSig(row) || "on";''', u'''''', TG, "genba", u"⑪"),
  (u"預けモードでも いつもの保存をする",
   u'''    if(M && M._sideOnly && !(await sideModeTryReturn())){''', u'''    if(false){''', TG, "genba", u"⑪"),
  (u"📂 でPCのファイルを読んでも預けモードのまま",
   u'''    if(sideLoad && M._sideOnly) m._sideOnly = M._sideOnly;''', u'''    if(M._sideOnly) m._sideOnly = M._sideOnly;''', TG, "genba", u"⑪"),
  (u"預けモードで保存するとき、PCのファイルを探さない",
   u'''  if(!(M && (M._viewOnly || M._sideOnly))) return false;''', u'''  if(!(M && M._viewOnly)) return false;''', TG, "genba", u"⑫"),
  (u"預けを開いたら PCのファイルを読んだことにする",
   u'''  m._fromCaseFile = !sideLoad;''', u'''  m._fromCaseFile = true;''', TG, "genba", u"⑬"),
  (u"預けから控えを取る",
   u'''    if(!sideLoad && flowShareIsCase(raw) && draftNoKey(raw.chosho_mgmt_no)){''',
   u'''    if(flowShareIsCase(raw) && draftNoKey(raw.chosho_mgmt_no)){''', TG, "genba", u"⑬"),
  (u"預けを開いても預けモードにしない",
   u'''  if(sideLoad && !m._sideOnly){''', u'''  if(false){''', TG, "genba", u"⑬"),
  (u"預けの印（_side・_sideMerged）を持ち越す（PASS_NG）",
   u'''_fileBase:1, _side:1, _sideMerged:1 };''', u'''_fileBase:1 };''', TG, "genba", u"⑭a"),
  (u"フォルダのファイルの _side を見比べに入れる（MERGE_NEVER）",
   u'''  "_side","_sideMerged"]);''', u'''  ]);''', TG, "genba", u"⑭b"),
  (u"事務所でまとめた覚え（_sideMerged）を残さない",
   u'''  if(Array.isArray(old._sideMerged) && old._sideMerged.length){''', u'''  if(false){''', TG, "genba", u"⑭b"),
  (u"中身に _side がある別名のファイルも読み合わせに使う",
   u'''    if(n !== fname && isSideData(j)) continue;''', u'''''', TG, "genba", u"⑮"),
  (u"フォルダの戸別ファイルの数に預けを数える",
   u''' && !isSideName(name)) n++;''', u''') n++;''', TG, "genba", u"⑮"),
  (u"写真が台帳より少なくても PCのファイルとみる",
   u'''  if(h.photos > 0 && n < h.photos) return false;''', u'''''', TG, "genba", u"⑯a"),
  (u"完了の印が無くても PCのファイルとみる",
   u'''  if(row.work_done === true && !(data.work_done === true || String(data.chosho_status || "") === "completed")) return false;''',
   u'''''', TG, "genba", u"⑯b"),
  (u"預け（_side）も PCのファイルとみる",
   u'''  if(isSideData(data)) return false;
  const h = rcPcHas(row);''', u'''  const h = rcPcHas(row);''', TG, "genba", u"⑯b"),
  (u"見つけたファイルが PCらしいかを見ない",
   u'''    if(!pcHitLooksPc(hit.data, row0)){''', u'''    if(false){''', TG, "genba", u"⑯a"),
  (u"まとめて保存が見るだけを見ない",
   u'''    f.guard = pcGuardNeeded(f.model, row) ? "viewonly" : "";''', u'''    f.guard = "";''', TG, "genba", u"⑰"),
  (u"まとめて保存の最初の確かめで見るだけを言わない",
   u'''+ nothingTxt + guardTxt''', u'''+ nothingTxt''', TG, "genba", u"⑰"),
  (u"まとめて保存の最後に、書けなかった分を言わない",
   u'''「（N件は失敗）」の一言だけだった。 */
  bulkOfferAll();''', u'''「（N件は失敗）」の一言だけだった。 */''', TG, "genba", u"⑰"),
  (u"まとめて保存：フォルダに本物があっても見るだけを預けに回す",
   u'''        if(f.guard === "mode" || (f.guard && !(cf0.primary && pcHitLooksPc(cf0.primary, rcRowOf(draftNoKey(f.no)))))){''',
   u'''        if(f.guard === "mode" || f.guard){''', TG, "genba", u"⑱"),
  (u"まとめて保存：窓のエラーで 📮 を出さない",
   u'''        stopOffer("保存先のフォルダを選べませんでした",''', u'''        (() => {})("保存先のフォルダを選べませんでした",''', TG, "genba", u"⑲a"),
  (u"まとめて保存：物件が違うフォルダでやめたら黙る",
   u'''        stopOffer("保存していません",''', u'''        (() => {})("保存していません",''', TG, "genba", u"⑲b"),
  (u"保存バーの 📁 で窓を閉じたら黙る（版175 に戻す）",
   u'''    if(e && e.name === "AbortError") return await saveDirAfterBack("back");''', u'''    if(e && e.name === "AbortError") return;''', TG, "genba", u"⑳"),
  (u"フォルダを忘れても共有で渡す道にしない",
   u'''  saveRouteSet("share");
  const proj = rcProjName();''', u'''  const proj = rcProjName();''', TG, "genba", u"⑳"),
  (u"フォルダを選び直しても共有で渡す道のまま",
   u'''  if(h) saveRouteSet("");''', u'''''', TG, "genba", u"⑳"),
  (u"共有で渡す道でも保存先を選ぶ画面を出す",
   u'''  if(window.showSaveFilePicker && route !== "share"){''', u'''  if(window.showSaveFilePicker){''', TG, "genba", u"⑳"),
  (u"共有で渡す道で、PCのファイルを読んでいなくても いつもの名前で渡す",
   u'''    if(route === "share" && !sideBaseOk(M)) return await saveShareAsSide(fname);''', u'''''', TG, "genba", u"⑳"),
  (u"共有で渡す道で、PCのファイルを読んだ戸別も預けの名前にする",
   u'''    if(route === "share" && !sideBaseOk(M)) return await saveShareAsSide(fname);''',
   u'''    if(route === "share") return await saveShareAsSide(fname);''', TG, "genba", u"㉑"),
  (u"保存バーに「📤 共有で渡す」を出さない",
   u'''  const shareRoute = (saveRoute() === "share" && !dest);''', u'''  const shareRoute = false;''', TG, "genba", u"⑳"),
  (u"取り込みのあとの窓で「フォルダを覚えるのをやめる」が効かない",
   u'''    else if(v === "forget"){ await saveDirForget(); toast("フォルダを覚えるのをやめました。保存は共有で渡します"); }''', u'''''', TG, "genba", u"⑳b"),
  (u"別の戸別のファイル（保存先を選ぶ画面）を知らせだけにする（版175 に戻す）",
   u'''              _lastSaveInfo = { title: "⚠ 別の戸別のファイルなので、保存していません", warn: true, escape: "merge",
                msg: (handle.name || fname) + "\\n\\nそのファイルは " + mgp.reason + "\\n\\nファイル名を確かめてください。保存していません。\\n"
                   + "（この端末の入力と写真は、そのまま残っています）" };''',
   u'''              await uiAlert("そのファイルは " + mgp.reason + "\\n\\nファイル名を確かめてください。保存していません。");''', TG, "genba", u"㉒a"),
  (u"結果が無くても緑の「保存しました」を出す（S14）",
   u'''    if(done && _lastSaveInfo){''', u'''    if(done){''', TG, "genba", u"㉒b"),
  (u"何も入力していない見るだけの戸別にも 📮 を出す",
   u'''  if(isNothingNewHere(M)){
    await uiAlert("この戸別は【見るだけ】です。保存していません。\\n\\n"''',
   u'''  if(false){
    await uiAlert("この戸別は【見るだけ】です。保存していません。\\n\\n"''', TG, "genba", u"㉓"),
  (u"何も入力していない戸別も預ける",
   u'''    const list = models.filter(m => !isNothingNewHere(m));''', u'''    const list = models;''', TG, "genba", u"㉓"),
  (u"物件が違うフォルダに いつもの名前で書く",
   u'''    if(mmP && mmP.held && pcGuardRow()){''', u'''    if(false){''', TG, "genba", u"㉔"),
  (u"履歴の 📮 で預けない",
   u'''    const info = await sideSaveFlow("resend", models);''', u'''    const info = null;''', TG, "genba", u"㉕"),
  (u"履歴に 📮 の印を出さない",
   u'''(sided ? "📮 " : "💾 ")''', u'''"💾 "''', TG, "genba", u"㉕"),
  (u"台帳の一覧に「📮 預け済」を出さない",
   u'''((info.side && info.side === info.fileAt) ? "📮 預け済 " : "保存済 ")''', u'''"保存済 "''', TG, "genba", u"㉕"),
  (u"預けた下書きを消すとき知らせない",
   u'''        + (sidedN ? ("\\n\\n📮 このうち " + sidedN + "件は、事務所に預けた戸別です。\\n"
                     + "預けた戸別は、事務所でまとめ終わるまで消さないでください。") : "")))) return;''',
   u'''        ))) return;''', TG, "genba", u"㉕"),
  (u"ほかの端末が保存した戸別の窓に 📮 を出さない",
   u'''      { label: "📮 事務所に預ける（何も書き替えません）", value: "side", kind: "side", sub: "別の名前で渡します。事務所で1つにまとめます" }''',
   u'''''', TG, "genba", u"㉖"),
  (u"共有に失敗したら、窓に戻らずに終わる",
   u'''      shareNg = !r.aborted;''', u'''      return null;''', TG, "genba", u"㉗b"),
  (u"「このまま新しく入力する」の確かめを「PCのファイルから消えます」に戻す",
   u'''      + "迷ったときは「いいえ」を選び、「📮 入力して事務所に預ける」にしてください。\\n\\n"''',
   u'''      + "がPCのファイルから消えます。\\n\\n"''', TG, "genba", u"㉙"),
  (u"選ぶ窓の説明を折り返さない（長い預けの名前）",
   u'''  #pick-note{ overflow-wrap:anywhere; }''', u'''''', TG, "genba", u"㉚c"),
  (u"結果の窓に高さの上限が無い（下のボタンに指が届かない）",
   u'''    max-height:calc(100vh - 48px); max-height:calc(100dvh - 48px); overflow:auto; box-sizing:border-box;}''', u'''}''', TG, "genba", u"㉚b"),
  (u"履歴の 📮 ボタンを1行にしない",
   u'''  .d-sidesel{flex:1 1 100%; order:3;''', u'''  .d-sidesel{white-space:nowrap; flex:none;''', TG, "genba", u"㉚b"),

  (u"名前だけの窓に「フォルダを覚えるのをやめる」を出さない",
   u'''    if(saveDirName()) add("📤 フォルダを覚えるのをやめる（保存は共有で渡す）", "\\u0000forget",''',
   u'''    if(false) add("📤 フォルダを覚えるのをやめる（保存は共有で渡す）", "\\u0000forget",''', TG, "genba", u"⑳c"),
  (u"見つからない窓に 📮 を出さない",
   u'''  if(can) items.push({ label: "📮 事務所に預ける（PCのファイルは書き替えません）", value: "side", kind: "side",''',
   u'''  if(false) items.push({ label: "📮 事務所に預ける（PCのファイルは書き替えません）", value: "side", kind: "side",''', TG, "genba", u"㉛"),
  (u"見つからないときは知らせだけ（版175 に戻す）",
   u'''  return fin(await pcGuardLoadMissAsk("この戸別のファイルが見つかりませんでした",''',
   u'''  return fin(await uiAlert("この戸別のファイルが見つかりませんでした",''', TG, "genba", u"㉛"),
  (u"見つけたファイルが PCらしくないわけを言わない",
   u'''    + missTxt
''', u'''''', TG, "genba", u"㉛"),
  (u"見るだけの窓の 📂 でファイルを選ぶ画面を開かない",
   u'''    if(inp){ inp.value = ""; inp.click(); }                 // 押した直後に開く（間に待ちを挟まない）''', u'''''', TG, "genba", u"㉜a"),
  (u"見るだけの窓の 📁 で読み込めても保存しない",
   u'''    return !(M && M._viewOnly);                              // 読み込めたら、そのまま保存する''', u'''    return false;''', TG, "genba", u"㉜b"),
  # ======== メイン ========
  # ---- 見つける（読み込み） ----
  (u"★読み込み：名前で分かる預けを行にする",
   u'''      if(SIDE_NAME_RE.test(String(name || ""))){
        let f0 = null;''', u'''      if(false){
        let f0 = null;''', TM, "main", "①"),
  (u"★読み込み：中に _side がある預け（名前が変わったもの）を行にする",
   u'''        if(isSideCaseFile(name, data)){
          stats.files--;''', u'''        if(false){
          stats.files--;''', TM, "main", "①"),
  (u"★📁 で読んだあと、預けを覚えない・知らせない",
   u'''    { const sd = sideLoadNote(stats);                       // 📮 現場から預かったファイル（版176）
      if(sd) _missLastNote''', u'''    { const sd = "";
      if(sd) _missLastNote''', TM, "main", "①"),
  (u"★読み直したあと、預けを覚えない・知らせない",
   u'''  { const sd = sideLoadNote(stats);                         // 📮 現場から預かったファイル（版176）
    if(sd) _missLastNote = (_missLastNote ? (_missLastNote + " ／ ") : "") + sd; }
  renderListTable();
  missShowNote();
}''', u'''  renderListTable();
  missShowNote();
}''', TM, "main", "①"),
  (u"★📄 ファイル：中に _side がある預けを行にする",
   u'''        if(isSideCaseFile(f.name, data)){ sideN++; continue; }''', u'''''', TM, "main", "②"),
  (u"📄 ファイル：預けがあったと言わない",
   u'''    if(sideN && !window.__VIEWER_MODE__){''', u'''    if(false){''', TM, "main", "②"),

  # ---- 合わせ方（sideMergeInto） ----
  (u"★合わせ方：現場で済みにした工程の印を入れない",
   u'''    if(!s[f]) return;
    if(d[f]){''', u'''    if(true) return;
    if(d[f]){''', TM, "main", "③"),
  (u"★合わせ方：touched に入っていれば工程の印を外せる",
   u'''  const never = k => !k || k.charAt(0) === "_" || flagKeys.has(k)''', u'''  const never = k => !k || k.charAt(0) === "_"''', TM, "main", "③"),
  (u"★合わせ方：現場で直していない欄も採る",
   u'''  const touched = (side && Array.isArray(side.touched) && side.touched.length)
    ? side.touched.map(k => String(k)) : null;''', u'''  const touched = Object.keys(s);''', TM, "main", "③"),
  (u"★合わせ方：状態を戻す（進む方向だけでない）",
   u'''    if(gr > mr){ report.status''', u'''    if(gr !== mr){ report.status''', TM, "main", "③"),
  (u"★合わせ方：PCだけの欄（石綿判定など）も預けで変える",
   u'''    || GENBA_HARD_KEEP_MAIN.indexOf(k) >= 0;
  const clone''', u''';
  const clone''', TM, "main", "③"),
  (u"合わせ方：touched の無い古い預けで、空の欄を埋めない",
   u'''  if(!touched || opts.fillEmpty){''', u'''  if(opts.fillEmpty){''', TM, "main", "④"),
  (u"★合わせ方：touched の無い古い預けで、PCに値のある欄を上書きする",
   u'''      if(!sideIsEmptyVal(d[k]) || sideIsEmptyVal(s[k])) return;''', u'''      if(sideIsEmptyVal(s[k])) return;''', TM, "main", "④"),
  (u"合わせ方：PCの工程の日時を預けの日時で上書きする",
   u'''    if(d[f]){ if(sideIsEmptyVal(d[at]) && !sideIsEmptyVal(s[at])) d[at] = s[at]; return; }''',
   u'''    if(d[f]){ if(!sideIsEmptyVal(s[at])) d[at] = s[at]; return; }''', TM, "main", "④"),
  (u"★合わせ方：預けの写真を足さない",
   u'''    const sReal = (Array.isArray(s.chosho_photos) ? s.chosho_photos : []).some(p => p && p.dataUri);''',
   u'''    const sReal = false;''', TM, "main", "③"),
  (u"合わせ方：名前だけの空の写真枠を捨てる",
   u'''      d.chosho_photos = slots.length ? merged.concat(slots) : merged;''', u'''      d.chosho_photos = merged;''', TM, "main", "④"),
  (u"★合わせ方：前にまとめた印を捨てる",
   u'''  d._sideMerged = had.slice(-200);''', u'''  d._sideMerged = stamp ? [stamp] : [];''', TM, "main", "④"),
  (u"★合わせ方：_side を残す",
   u'''  report.stamp = stamp;
  delete d._side;''', u'''  report.stamp = stamp;''', TM, "main", "④"),

  # ---- まとめる（書く・確かめる・消す） ----
  (u"★振り分け：まとめ済みの預けをもう一度まとめる",
   u'''  out.already = Array.isArray(D._sideMerged) && D._sideMerged.indexOf(stamp) >= 0;''', u'''  out.already = false;''', TM, "main", "③"),
  (u"★振り分け：読み返して合わないとき元に戻さない",
   u'''      let restored = false;
      try { const w = await ce.fh.createWritable(); await w.write(T0);''', u'''      let restored = false;
      if(false) try { const w = await ce.fh.createWritable(); await w.write(T0);''', TM, "main", "⑤"),
  (u"★振り分け：写真の id がそろっているか確かめない",
   u'''      if(lost.length) bad = "写真が " + lost.length + " 枚 入っていませんでした";''', u'''''', TM, "main", "⑤b"),
  (u"★振り分け：読み返せないのに元に戻す（他の端末の保存を潰す）",
   u'''    const back = await sideReadText(ce.fh);
    if(back === null){''', u'''    const back = await sideReadText(ce.fh);
    if(back === null){ try { const w = await ce.fh.createWritable(); await w.write(T0); await w.close(); } catch(_){}''', TM, "main", "⑥"),
  (u"★振り分け：行き先の控えが取れなくても書く",
   u'''    if(!bk.ok){ out.why = "行き先の控えを取れませんでした（"''', u'''    if(false){ out.why = "行き先の控えを取れませんでした（"''', TM, "main", "⑦a"),
  (u"★振り分け：控えを取る前に預けを消す",
   u'''async function sideRetire(it){
  const bdir = await sideBackupDirOf(it.dir);''', u'''async function sideRetire(it){
  try { await it.dir.removeEntry(it.name); } catch(_){}
  const bdir = await sideBackupDirOf(it.dir);''', TM, "main", "⑦b"),
  (u"★振り分け：預けの控えが取れなくても預けを消す",
   u'''  if(!bk.ok) return { ok: false, why: "預けの控えを取れなかったので、預けは消していません（" + bk.why + "）" };''', u'''''', TM, "main", "⑦b"),
  (u"★振り分け：書く前に読み直さない（別のPCの保存を潰す）",
   u'''    if(T1 !== T0){''', u'''    if(false){''', TM, "main", "⑧"),

  # ---- 行き先の決め方・すること ----
  (u"★行き先：預けに書いた物件（_side.proj）で決めない",
   u'''    if(c.length === 1) return { dest: P.indexOf(c[0]), how: "proj" };''', u'''''', TM, "main", "⑨"),
  (u"★行き先：管理番号.json のある物件で決めない",
   u'''  if(withFile.length === 1) return { dest: P.indexOf(withFile[0]), how: "file" };''', u'''''', TM, "main", "③"),
  (u"★行き先：管理番号.json が2つの物件にあっても1つに決める",
   u'''  if(withFile.length === 1) return { dest: P.indexOf(withFile[0]), how: "file" };''',
   u'''  if(withFile.length >= 1) return { dest: P.indexOf(withFile[0]), how: "file" };''', TM, "main", "⑩"),
  (u"行き先：このPCの物件で決めない",
   u'''  if(owners.length === 1){''', u'''  if(false){''', TM, "main", "⑨"),
  (u"★行き先：その１ と その２ を番号で見分けない",
   u'''  if(sx || sy) return !!sx && sx === sy;''', u'''  if(sx || sy) return true;''', TM, "main", "⑨"),
  (u"★すること：手で選んだ行き先にも新しく置く",
   u'''  if(!it.decided || destIdx !== it.decided.dest || !it.decided.how)''', u'''  if(false)''', TM, "main", "⑨"),
  (u"★すること：行き先が暗号化でも新しく置く",
   u'''  if(mine.length) return { act: "hold", why: "行き先の戸別ファイルが暗号化されています''', u'''  if(false) return { act: "hold", why: "行き先の戸別ファイルが暗号化されています''', TM, "main", "⑨"),
  (u"すること：0KB を「空」と言わない",
   u'''  if(!(file.size > 0)){ it.state = "empty"; it.why = "中身が空（0KB）です"; return it; }''', u'''''', TM, "main", "⑨"),
  (u"★すること：直している途中の戸別もまとめる",
   u'''function sideSortRowHold(no){''', u'''function sideSortRowHold(no){ return "";''', TM, "main", "⑫"),
  (u"★探す：写真フォルダ・控えのフォルダの中まで探す",
   u'''      if(scanSkipDirName(nm)) continue;
      subs.push([nm, h]);''', u'''      subs.push([nm, h]);''', TM, "main", "③"),
  (u"★探す：読み込んだ一覧の預けと、フォルダで見つけた預けを2回数える",
   u'''      if(same){ dup = true; break; }''', u'''      if(false){ dup = true; break; }''', TM, "main", "⑬"),
  (u"★探す：いつもの名前のファイルを預けとして消す",
   u'''    if(sideCanonNo(it.name)){ if(it.state || !it.side) continue; it.self = true; }''',
   u'''    if(sideCanonNo(it.name)){ if(it.state || !it.side) continue; }''', TM, "main", "⑭"),
  (u"★新しく置いたあと、同じ戸別の次の預けをそこへまとめない",
   u'''      if(r.placed) (acc.canon[it.no] = acc.canon[it.no] || []).push(r.placed);''', u'''''', TM, "main", "⑬"),
  (u"★迷子を知らせない",
   u'''    if(ps.length >= 2) out.push(''', u'''    if(false) out.push(''', TM, "main", "⑩"),
  (u"★振り分けたあと一覧を読み直さない",
   u'''    await listReloadFolder(gone);
    if(_currentProject){ try { projTouch(); } catch(_){} }''', u'''    if(_currentProject){ try { projTouch(); } catch(_){} }''', TM, "main", "⑪"),

  # ---- フォルダの選び方 ----
  (u"★許可を断られたフォルダを忘れない",
   u'''    const nm = String(root.name || "");
    _sideSortRoot = null;''', u'''    const nm = String(root.name || "");''', TM, "main", "⑰"),
  (u"★許可を断られたあと、同じ押しでフォルダを選ぶ画面へ進む",
   u'''        + "もう一度「📮 預かりを振り分ける」を押すと、フォルダを選ぶ画面が出ます。");
      return null;''', u'''        + "もう一度「📮 預かりを振り分ける」を押すと、フォルダを選ぶ画面が出ます。");''', TM, "main", "⑰"),
  (u"フォルダを選ぶ画面を読むだけで開く",
   u'''  const o = { mode: "readwrite", id: "antenna-side-sort" };''', u'''  const o = { mode: "read", id: "antenna-side-sort" };''', TM, "main", "⑰"),
  (u"選ぶ画面を閉じただけで知らせを出す",
   u'''    if(err && err.name === "AbortError") return null;     // 自分で閉じた＝何もしない''', u'''''', TM, "main", "⑰"),
  (u"★閲覧専用でも振り分けを始める",
   u'''  if(window.__VIEWER_MODE__) return;           // 閲覧専用ビューアでは書き替えない''', u'''''', TM, "main", "⑱"),
  (u"閲覧専用でも預けの知らせを出す",
   u'''  if(window.__VIEWER_MODE__ || !_sideFiles.length) return "";''', u'''  if(!_sideFiles.length) return "";''', TM, "main", "⑱"),

  # ---- 📥 現場取込 ----
  (u"★📥：預けでも今までの合わせ方（現場の値で全部上書き）",
   u'''  const sideMode = !!(opts.side);
  const mres = sideMode''', u'''  const sideMode = false;
  const mres = sideMode''', TM, "main", "⑮"),
  (u"★📥：預けを渡さない",
   u'''              side ? { side, sideName: f.name, sideFillEmpty: matchType !== "case" } : {})); done++;''',
   u'''              {})); done++;''', TM, "main", "⑮"),
  (u"★📥：まとめ済みの預けをもう一度取り込む",
   u'''        if(st && had.indexOf(st) >= 0){''', u'''        if(false){''', TM, "main", "⑮"),
  (u"★📥：預けでも似た写真を捨てる選択を出す",
   u'''  const simPairs = sideMode ? [] : await genbaBuildPhotoSimilarPairs(''', u'''  const simPairs = await genbaBuildPhotoSimilarPairs(''', TM, "main", "⑮"),
  (u"★📥：受付台帳の印を預けの値で外す",
   u'''    if(sideMode){                     // 預けは「入れた印」だけを台帳へ（外す方向には動かさない）''', u'''    if(false){''', TM, "main", "⑮"),

  # ---- いつもの名前で書く ----
  (u"★戸別ファイルへ書く中身に _side を残す",
   u'''  delete data._side;          // 📮''', u'''  // (消した)''', TM, "main", "⑯"),
  (u"★💾 戸別ファイルへ反映 で _side を残す",
   u'''      delete json._side;                              // 📮''', u'''      // (消した)''', TM, "main", "⑯"),
  (u"エディタで保存すると、まとめた印を落とす",
   u'''  "_passthrough","_otherFile","_mergedFrom",
  "_sideMerged"''', u'''  "_passthrough","_otherFile","_mergedFrom"''', TM, "main", "⑯"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
_todo = [c for c in CASES if not _only or _only in c[0] or (_only == "現場" and c[4] == "genba") or (_only == "メイン" and c[4] == "main")]

def _run(test, args, scene):
    env = dict(os.environ); env["SCENE"] = scene; env["ONLY"] = scene
    try:
        r = subprocess.run(["node", SP + test] + ["file://" + a for a in args], capture_output=True, text=True, timeout=900, env=env)
    except subprocess.TimeoutExpired:
        return 99, ["- 時間切れ"]
    return r.returncode, [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。使う場面だけで先に確かめて、赤なら止める。
for which, test, src in (("main", TM, MAIN), ("genba", TG, GENBA)):
    sc = ",".join(sorted(set(c[5] for c in _todo if c[4] == which)))
    if not sc: continue
    rc, last = _run(test, [src], sc)
    if rc != 0:
        print("土台が赤（壊す前から試験が通らない）:", test, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        _s.exit(1)
    print("土台 緑:", test, flush=True)

red = 0; n_run = 0; green = []
for name, old, new, test, which, sc in _todo:
    src, OUT = {"genba": (GENBA, OUTG), "main": (MAIN, OUTM)}[which]
    base = io.open(src, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); green.append(name); continue
    n_run += 1
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    rc, last = _run(test, [OUT], sc)
    isred = rc != 0
    if isred: red += 1
    else: green.append(name)
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), "[%s]" % sc, name, "|", " / ".join(x[:110] for x in last[:1]), flush=True)
for p in (OUTM, OUTG):
    if os.path.exists(p): os.remove(p)
print("=== 赤 %d / %d ===" % (red, n_run))
if green: print("検出できなかった・目印が合わない:", " / ".join(green))
