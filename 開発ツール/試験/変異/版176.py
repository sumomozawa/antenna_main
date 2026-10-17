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
   u'''        M._fileBase.rd = pcHitLooksPc(raw, row0);''', u'''''', TG, "genba", u"㉘a"),
  (u"端末の中だけのフォルダに書いた控えも当てにする",
   u'''  return !!(d && !saveDirMaybeDevice(d));''', u'''  return true;''', TG, "genba", u"㉘b"),
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
  (u"帯（の困ったとき）に「📮 事務所に預ける」を出さない",
   u'''    +     '<button type="button" id="pcg-side" class="side">📮 事務所に預ける（別のファイルで送る・PCのファイルはそのまま）</button>\'''',
   u'''    +     \'\'''', TG, "genba", u"⑪"),
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
   u'''_fileBase:1, _side:1 };''', u'''_fileBase:1 };''', TG, "genba", u"⑭a"),
  (u"フォルダのファイルの _side を見比べに入れる（MERGE_NEVER）",
   u'''  "_side","_sideMerged"]);''', u'''  ]);''', TG, "genba", u"⑭b"),
  (u"事務所でまとめた覚え（_sideMerged）を残さない",
   u'''  if(Array.isArray(old._sideMerged) && old._sideMerged.length){''', u'''  if(false){''', TG, "genba", u"⑭b"),
  (u"中身に _side がある別名のファイルも読み合わせに使う",
   u'''    if(n !== fname && isSideData(j)) continue;''', u'''''', TG, "genba", u"⑮"),
  (u"フォルダの戸別ファイルの数に預けを数える",
   u''' && !isSideName(name)) n++;''', u''') n++;''', TG, "genba", u"⑮"),
  (u"写真が台帳より少なくても PCのファイルとみる",
   u'''  if(h.photos > 0 && u.photos < h.photos) return false;''', u'''''', TG, "genba", u"⑯a"),
  (u"完了の印が無くても PCのファイルとみる",
   u'''  if(row.work_done === true && !u.done) return false;''', u'''''', TG, "genba", u"⑯b"),
  (u"預け（_side）も PCのファイルとみる",
   u'''  if(isSideData(data)) return false;
  const h = rcPcHas(row);''', u'''  const h = rcPcHas(row);''', TG, "genba", u"⑯b"),
  (u"見つけたファイルが PCらしいかを見ない",
   u'''    if(!pcHitLooksPc(hit.data, row0, hit.others)){''', u'''    if(false){''', TG, "genba", u"⑯a"),
  (u"まとめて保存が見るだけを見ない",
   u'''    f.guard = pcGuardNeeded(f.model, row) ? "viewonly" : "";''', u'''    f.guard = "";''', TG, "genba", u"⑰"),
  (u"まとめて保存の最初の確かめで見るだけを言わない",
   u'''otherTxt + outsideTxt + missTxt + guardTxt''', u'''otherTxt + outsideTxt + missTxt''', TG, "genba", u"⑰"),
  (u"まとめて保存の最後に、書けなかった分を言わない",
   u'''「（N件は失敗）」の一言だけだった。
     ★端末の中だけかもしれないフォルダに書いた分も、ここで「📮 事務所にも届ける」を選べる（任意）★ */
  bulkOfferAll((devDir && okNos.length) ? {''',
   u'''「（N件は失敗）」の一言だけだった。
     ★端末の中だけかもしれないフォルダに書いた分も、ここで「📮 事務所にも届ける」を選べる（任意）★ */
  ((devDir && okNos.length) ? {''', TG, "genba", u"⑰"),
  (u"まとめて保存：フォルダに本物があっても見るだけを預けに回す",
   u'''        if(f.guard === "mode" || (f.guard && !(cf0.primary && pcHitLooksPc(cf0.primary, rcRowOf(draftNoKey(f.no)), cf0.others)))){''',
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
   u'''      + "迷ったときは「いいえ」を選び、同じ「困ったとき」の中の「📮 事務所に預ける」にしてください。\\n\\n"''',
   u'''      + "がPCのファイルから消えます。\\n\\n"''', TG, "genba", u"㉙"),
  (u"選ぶ窓の説明を折り返さない（長い預けの名前）",
   u'''  #pick-note{ overflow-wrap:anywhere; }''', u'''''', TG, "genba", u"㉚c"),
  (u"結果の窓に高さの上限が無い（下のボタンに指が届かない）",
   u'''    max-height:calc(100vh - 48px); max-height:calc(100dvh - 48px); overflow:auto; box-sizing:border-box;}''', u'''}''', TG, "genba", u"㉚b"),
  (u"履歴の 📮 ボタンを1行にしない",
   u'''font-size:13.5px; font-family:inherit; white-space:normal;}''', u'''font-size:13.5px; font-family:inherit; white-space:nowrap; width:auto; display:inline-block;}''', TG, "genba", u"㉚b"),

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
          const sm = sideFileMeta(pathPrefix, name, dirHandle, handle, file);''', u'''        if(false){
          const sm = sideFileMeta(pathPrefix, name, dirHandle, handle, file);''', TM, "main", "①"),
  (u"★📁 で読んだあと、預けを覚えない・知らせない",
   u'''    { const sd = sideLoadNote(stats);                       // 📮 現場から預かったファイル（版176）
      if(sd) _missLastNote''', u'''    { const sd = "";
      if(sd) _missLastNote''', TM, "main", "①"),
  (u"★読み直したあと、預けを覚えない・知らせない",
   u'''  { const sd = sideLoadNote(stats);                         // 📮 現場から預かったファイル（版176）
    if(sd) _missLastNote = (_missLastNote ? (_missLastNote + " ／ ") : "") + sd; }
  renderListTable();
  missShowNote();
  return true;
}''', u'''  renderListTable();
  missShowNote();
  return true;
}''', TM, "main", u"①"),
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
   u'''      const reloaded = editing ? false : await listReloadFolder(gone);''', u'''      const reloaded = true;''', TM, "main", u"⑪"),

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
   u'''  "_sideMerged"                      // 📮 どの預けをまとめたか（版176。二度まとめないための印）''', u'''  "_unused_"''', TM, "main", "⑯"),

  # ======== 現場入力（2回目・3回目の見直しの直し） ========
  (u"★📮 の印：渡す前に読んだ写しで下書きを書き戻す（渡しているあいだに入った写真が消える）",
   u'''        if(rec.model){ rec.model._sideAt = t; rec.model._sideHow = model._sideHow; }''',
   u'''        rec.model = model; rec.sig = nowSig;''', TG, "genba", u"㉝"),
  (u"★📮 の印：中身が変わっていても渡した扱いにする",
   u'''      if(fresh){ rec.fileSavedAt = t; rec.fileRev = (rec.rev | 0); }''',
   u'''      { rec.fileSavedAt = t; rec.fileRev = (rec.rev | 0); }''', TG, "genba", u"㉝"),
  (u"📮 の印：下書きが渡したものと同じでも渡した扱いにしない",
   u'''  if(rec.sig === sig) return true;''', u'''  return false;''', TG, "genba", u"㉝"),
  (u"★共有で渡す道：端末の中だけのフォルダに書いたあとの控えも当てにする（いつもの名前で渡す）",
   u'''  return !!(b && !b.stale && (b.rd || b.pc));''', u'''  return !!(b && !b.stale);''', TG, "genba", u"㉞a"),
  (u"★共有で渡す道：「リスト」に書いただけの控えも当てにする（第2回の tr に戻す・いつもの名前で渡す）",
   u'''  return !!(b && !b.stale && (b.rd || b.pc));''', u'''  return !!(b && !b.stale && (b.rd || b.pc || b.from === "list"));''', TG, "genba", u"㉞e"),
  (u"★共有で渡す道：📂 で読んだあと その2 に書いた控えを当てにしない（読んでいるのに預けの名前）",
   u'''  return !!(b && !b.stale && (b.rd || b.pc));''', u'''  return !!(b && !b.stale && b.rd);''', TG, "genba", u"㉞b"),
  (u"読んだあとに書いた控えに印（pc）を受け継がない",
   u'''  if(model._fileBase && prevPc) model._fileBase.pc = true;''', u'''  (0);''', TG, "genba", u"㉞b"),
  (u"読んで取った控え（rd）のあとに書いても、印（pc）を受け継がない（pc のあとだけ受け継ぐ）",
   u'''  const prevPc = !!(pb0 && !pb0.stale && (pb0.rd || pb0.pc));''', u'''  const prevPc = !!(pb0 && !pb0.stale && pb0.pc);''', TG, "genba", u"㉞b"),
  (u"★書いた先の名前・親から当てにできる控えの印を作る（第2回の tr に戻す）",
   u'''  if(model._fileBase && prevPc) model._fileBase.pc = true;''',
   u'''  if(model._fileBase && (prevPc || (from === "list" && _saveDir && (saveDirParentOf(_saveDir) || saveDirIsListName(_saveDir.name))))) model._fileBase.pc = true;''', TG, "genba", u"㉞e"),
  (u"★直した欄（touched）を決めるとき、「リスト」に書いただけの控えを、フォルダを忘れたあとも当てにする",
   u'''  if(b.rd) return true;''', u'''  if(b.rd || b.from === "list") return true;''', TG, "genba", u"㉞f"),
  (u"★直した欄（touched）を決めるとき、読んだあと端末の中のフォルダに書いた控え（pc）を当てにする",
   u'''  if(b.rd) return true;''', u'''  if(b.rd || b.pc) return true;''', TG, "genba", u"㉞b"),
  (u"★まとめて保存（共有で渡す道）：PCのファイルを読んでいない戸別も いつもの名前で渡す",
   u'''        if(!sideBaseOk(files[i].model)){ sideFs.unshift(files[i]); files.splice(i, 1); }''',
   u'''        if(false){ sideFs.unshift(files[i]); files.splice(i, 1); }''', TG, "genba", u"㉞c"),
  (u"まとめて保存（共有で渡す道）：預けで渡した分に 📮 の印を付けない",
   u'''    for(const it of sideDone) await markDraftSidedFor(it.model, shared ? "share" : "dl", it.sig);''',
   u'''    // (消した)''', TG, "genba", u"㉞c"),
  (u"★まとめて保存（共有）：渡したあと、写しで下書きを書き戻す（渡しているあいだに入った写真が消える）",
   u'''    if(await markDraftSavedFor(f.key, f.model, dir ? { wrote: f.state, was: f.sig } : { keep: true, sig: f.sig }) === "late") lateNos.push(f.no);''',   # 版178 で was を足した
   u'''    if(await markDraftSavedFor(f.key, f.model) === "late") lateNos.push(f.no);''', TG, "genba", u"㉞d"),
  (u"★いつもの名前のファイルから、事務所でまとめた覚え（_sideMerged）を落とす",
   u'''  const PASS_NG = { type:1, rows:1, sheets:1, _fileBase:1, _side:1 };''',
   u'''  const PASS_NG = { type:1, rows:1, sheets:1, _fileBase:1, _side:1, _sideMerged:1 };''', TG, "genba", u"㉟"),
  (u"預けのファイルを開いたとき、その _sideMerged を持ち越す",
   u'''    if(own !== undefined) m._passthrough._sideMerged = own; else delete m._passthrough._sideMerged;''',
   u'''    if(own !== undefined) m._passthrough._sideMerged = own;''', TG, "genba", u"⑬a"),
  (u"預けのファイルに _sideMerged を入れる",
   u'''  delete st._side; delete st._sideMerged;''', u'''  delete st._side;''', TG, "genba", u"㉟"),
  (u"★まとめて保存：フォルダを選ぶ画面を閉じたら黙って終わる（版175 に戻す）",
   u'''      if(e && e.name === "AbortError"){
        /* ★自分で閉じたときも、黙って終わらない★''',
   u'''      if(e && e.name === "AbortError"){ return;
        /* ★自分で閉じたときも、黙って終わらない★''', TG, "genba", u"⑲a"),
  (u"まとめて保存：閉じたときの窓に「📤 フォルダを覚えるのをやめる」を出さない",
   u'''          { extra: [{ label: now0 ? "📤 フォルダを覚えるのをやめる（共有で渡す）" : "📤 フォルダを選ばずに、共有で渡す", value: "forget", kind: "side",''',
   u'''          { extra: [], x: [{ label: now0 ? "📤 フォルダを覚えるのをやめる（共有で渡す）" : "📤 フォルダを選ばずに、共有で渡す", value: "forget", kind: "side",''', TG, "genba", u"⑲a"),
  (u"まとめて保存：閉じたときの「📤」でフォルダを忘れない",
   u'''                      run: async () => { await saveDirForget();''', u'''                      run: async () => { (0);''', TG, "genba", u"⑲a"),
  (u"まとめて保存の知らせ：ほかのボタン（📤）を押しても何もしない",
   u'''    if(ex){ if(typeof ex.run === "function") await ex.run(); return; }''', u'''    if(ex){ return; }''', TG, "genba", u"⑲a"),
  (u"★まとめて保存：共有の画面を閉じたら黙って終わる（版175 に戻す）",
   u'''        bulkOfferAll({ pre: [{ label: "共有をやめた戸別", fs: items.map(x => x.f || x), why: "cancel" }],''',
   u'''        bulkOfferAll({ pre: [],''', TG, "genba", u"㊱"),
  (u"★「それでも、このまま保存しますか？」→ いいえ で黙って閉じる（覚えているフォルダの道）",
   u'''"それでも、このまま保存しますか？"))){ _lastSaveInfo = saveKeepPcInfo(fname); return true; }''',
   u'''"それでも、このまま保存しますか？"))) return false;''', TG, "genba", u"㊲a"),
  (u"★「それでも、このまま保存しますか？」→ いいえ で黙って閉じる（保存先を選ぶ画面の道）",
   u'''"それでも、このまま保存しますか？"))){ _lastSaveInfo = saveKeepPcInfo(handle.name || fname); return true; }''',
   u'''"それでも、このまま保存しますか？"))) return false;''', TG, "genba", u"㊲b"),
  (u"★見るだけの帯（工事完了）が「ここで保存すると…PCのファイルから消えます」と言う（版175 に戻す）",
   u'''          ? "直すときは、PCでお願いします。ここで「保存」を押しても、PCのファイルは書き替えません。"''',
   u'''          ? "直すときは、PCでお願いします。ここで保存すると、上の中身はPCのファイルから消えます。"''', TG, "genba", u"㊳"),
  (u"★見るだけの帯が「このまま保存すると…PCのファイルから消えます」と言う（版175 に戻す）",
   u'''          : "ここで「保存」を押しても、PCのファイルは書き替えません。")''',
   u'''          : "このまま保存すると、上の中身はPCのファイルから消えます。")''', TG, "genba", u"㊳"),
  (u"★端末の中だけかもしれないフォルダに書いても、緑の「保存しました」を勝手に閉じる（⚠・📮 なし）",
   u'''      const devOnly = saveDirMaybeDevice(dir);''',
   u'''      const devOnly = false;''', TG, "genba", u"㊴a"),
  (u"リストに書いたときも ⚠・📮 を出す（緑の知らせが閉じない）",
   u'''  return !(saveDirParentOf(dir) || saveDirIsListName(dir && dir.name));
}''',
   u'''  return true;
}''', TG, "genba", u"㊴b"),
  (u"結果の窓：📮 のボタンの字（事務所にも届ける）を使わない",
   u'''((info && info.escLabel) ? esc(info.escLabel) : (also ? "📤 共有でも渡す" : "📮 別の名前で事務所に預ける"))''',
   u'''(also ? "📤 共有でも渡す" : "📮 別の名前で事務所に預ける")''', TG, "genba", u"㊴a"),
  (u"★まとめて保存：端末の中だけかもしれないフォルダに書いた分を 📮 で届けられない",
   u'''    devDir = saveDirMaybeDevice(dir);''',
   u'''    devDir = false;''', TG, "genba", u"㊴c"),
  (u"まとめて保存の知らせ：書いた分（任意の組）の 📮 を出さない",
   u'''  if(k) items.push({ label: n ? ("📮 書いた " + k + "件も合わせて事務所に届ける（共有など）") : ("📮 書いた " + k + "件を事務所にも届ける（共有など）"),''',
   u'''  if(false) items.push({ label: n ? ("📮 書いた " + k + "件も合わせて事務所に届ける（共有など）") : ("📮 書いた " + k + "件を事務所にも届ける（共有など）"),''', TG, "genba", u"㊴c"),
  (u"★PCのファイルらしいかを、同じ戸別の別名ファイルを入れずに決める（版176 第1回に戻す）",
   u'''  const u = pcHitUnion(data, others);''', u'''  const u = pcHitUnion(data, []);''', TG, "genba", u"㊵a"),
  (u"1件の保存（pcGuardAutoLoad）で、別名ファイルを渡さない",
   u'''    if(!pcHitLooksPc(hit.data, row0, hit.others)){''', u'''    if(!pcHitLooksPc(hit.data, row0)){''', TG, "genba", u"㊵a"),
  (u"PCのフォルダから探すとき（caseFileFromDir）、別名ファイルを返さない",
   u'''    return { data: cf.primary, others: cf.others || [], name: cf.pick || fname, dir: d, count: (cf.names || []).length };''',
   u'''    return { data: cf.primary, name: cf.pick || fname, dir: d, count: (cf.names || []).length };''', TG, "genba", u"㊵a"),
  (u"別名ファイルの工事完了の印を見ない",
   u'''  const done = all.some(o => !!o && (o.work_done === true || String(o.chosho_status || "") === "completed"));''',
   u'''  const done = !!data && (data.work_done === true || String(data.chosho_status || "") === "completed");''', TG, "genba", u"㊵a"),
  (u"★まとめて保存で、別名ファイルを入れずに PCのファイルらしいかを決める",
   u'''pcHitLooksPc(cf0.primary, rcRowOf(draftNoKey(f.no)), cf0.others)''',
   u'''pcHitLooksPc(cf0.primary, rcRowOf(draftNoKey(f.no)))''', TG, "genba", u"㊵b"),
  (u"★フォルダを覚えていないときの「📤 共有で渡す」が渡さず、「覚えるのをやめました」と言う（第2回に戻す）",
   u'''                        if(!now0) return await saveAllDrafts(mode);''', u'''''', TG, "genba", u"⑲c"),
  (u"まとめて保存（その2 に書いた）の「あとで」が「もう一度まとめて保存からできます」と言う",
   u'''    later: "あとで", laterSub: "あとで渡すときは、「履歴」の「📮 選んで事務所に預ける（保存済みも）」から選べます" } : null);''',
   u'''    } : null);''', TG, "genba", u"㊴c"),
  (u"選ぶ窓の題（長いフォルダ名）を折り返さない",
   u'''  #pick-title{ overflow-wrap:anywhere; }''', u'''''', TG, "genba", u"㉚d"),

  # ======== メイン（2回目・3回目の見直しの直し） ========
  (u"★開いている物件の行を、ファイルの中身で置き換える（物件だけの直し・工事完了が消える）",
    u'''  r.data = d;
  r._amtCache = undefined; r._bomCache = undefined;''',
    u'''  r.data = Object.assign({}, a.m.fields, { chosho_photos: r.data.chosho_photos });
  r._amtCache = undefined; r._bomCache = undefined;''', TM, "main", u"⑲"),
  (u"★開いている物件の行に預けを入れない（あとの「物件に保存」で工事完了・現場の入力・まとめた印が消える）",
    u'''  r.data = d;
  r._amtCache = undefined; r._bomCache = undefined;''',
    u'''  r._amtCache = undefined; r._bomCache = undefined;''', TM, "main", u"⑲"),
  (u"★行に入れたのに「まだ振り分ける前の中身のまま」と言う",
   u'''const mine = res.adopt.filter(a => a && a.m && done.indexOf(a) < 0 && (''',
   u'''const mine = res.adopt.filter(a => a && a.m && (''', TM, "main", u"⑲"),
  (u"★開いている物件の行に入れても、済みの印を受付台帳に入れない",
    u'''  mg.report.flagsOn.forEach(f => { fl[f] = true; });
  try { flowAdoptRow(r, fl); } catch(_){}''',
    u'''  mg.report.flagsOn.forEach(f => { fl[f] = true; });''', TM, "main", u"⑲a"),
  (u"★開いている物件の行の写真を、合わせたときに落とす",
    u'''  if(r.data.chosho_photos !== undefined) d.chosho_photos = r.data.chosho_photos;''', u'''''', TM, "main", u"⑲a"),
  (u"★開いている物件の行の写真の枚数を、多い方にしない",
   u'''d.chosho_photo_count = Math.max(+r.data.chosho_photo_count || 0, a.m.photos);''',
   u'''d.chosho_photo_count = r.data.chosho_photo_count;''', TM, "main", u"⑲a"),
  (u"★別の物件へまとめた預けを、開いている物件の同じ管理番号の行に入れる",
    u'''  if(a.p.name) return sideProjSame(_currentProject.name, a.p.name);''',
    u'''  if(a.p.name) return true;''', TM, "main", u"⑲c"),
  (u"★まとめた結果に、預けの中身（行に入れる元）を付けない",
   u'''                   photos: sidePhotoIds(merged).length, flagsOn: mg.report.flagsOn.slice(),
                   S: Object.assign({}, S2, { chosho_photos: undefined }), side, stamp };''',
   u'''                   photos: sidePhotoIds(merged).length, flagsOn: mg.report.flagsOn.slice() };''', TM, "main", u"⑲a"),
  (u"★リストの外にその戸別のファイルがあっても新しく置く",
   u'''  if(other.length) return { act: "hold", why: sideElsewhereWhy(other[0], p, it.no) };''', u'''''', TM, "main", u"⑳a"),
  (u"★物件フォルダの中のファイルを、リストのすぐ下しか覚えない",
   u'''  const owner = inList || proj || inProj || null;''', u'''  const owner = inList || null;''', TM, "main", u"⑳a"),
  (u"★物件フォルダの中のフォルダ（完了 など）へ、どの物件の中かを渡さない",
   u'''(proj && h === ls[1]) ? proj : null, proj || inProj); }''', u'''(proj && h === ls[1]) ? proj : null, null); }''', TM, "main", u"⑳a"),
  (u"★リストの外にあるとき、📁 の一覧しか見ない「📂」「🧩」を勧める（できない手順）",
    u'''    + "エクスプローラで " + where + " を " + String((p && p.folder) ? (p.folder + "/") : "") + "リスト へ移してから、もう一度押してください";''',
    u'''    + "先に「📂 1つのフォルダにそろえる」や「🧩 重複をまとめる」で リスト の中の1つにまとめてから、もう一度押してください";''', TM, "main", u"⑳a"),
  (u"★0KB のファイルも「その戸別のファイル」と数える（置けるものを止める）",
   u'''    if(x.size === 0) x.empty = true;''', u'''''', TM, "main", u"⑳a"),
  (u"★名前の変わった預け（中に _side）自身を「その戸別のファイル」と数える",
   u'''    if(!m.state && m.side){ m.isSide = true; acc.side.push(m); }''', u'''    if(!m.state && m.side){ acc.side.push(m); }''', TM, "main", u"⑳a"),
  (u"★.json.txt を その戸別のファイルとして覚えない",
   u'''    if(owner && isCaseFileName(nm)){''', u'''    if(owner && /\\.(json|hyb|enc)$/i.test(nm)){''', TM, "main", u"⑳b"),
  (u"★リストの外にある同じ戸別を、迷子に並べない",
   u'''    sideFilesOf(acc, no).forEach(x => {
      if(ps.indexOf(x.proj) >= 0) return;''', u'''    [].forEach(x => {
      if(ps.indexOf(x.proj) >= 0) return;''', TM, "main", u"⑳c"),
  (u"★行き先を決めるとき、リストの外の同じ戸別を数えない（2つの物件にあるのに片方へまとめる）",
   u'''  sideFilesOf(acc, it.no).forEach(x => { if(!(x.direct && sideCanonNo(x.name))) addP(x.proj); });''', u'''''', TM, "main", u"⑳c"),
  (u"★預けの台帳と「その」の番号が違う物件へも ②③ で決める",
   u'''  const fits = p => !sono || (p.name ? (!pjSonoNo(p.name) || pjSonoNo(p.name) === sono) : false);''', u'''  const fits = p => true;''', TM, "main", u"㉑"),
  (u"★名前の分からない「リスト」を、その番号のある預けに ②③ で合わせる（その２/リスト の紛れた写しへまとめる）",
   u'''  const fits = p => !sono || (p.name ? (!pjSonoNo(p.name) || pjSonoNo(p.name) === sono) : false);''',
   u'''  const fits = p => !sono || !pjSonoNo(p.name) || pjSonoNo(p.name) === sono;''', TM, "main", u"㉑c"),
  (u"★「リスト」だけを選んだとき、上のフォルダ（📁・工事フォルダ）から物件の名前を引かない",
   u'''      const pn = await sideListOwnerName(root);''', u'''      const pn = "";''', TM, "main", u"㉑e"),
  (u"★上のフォルダから引くとき、いつも上のフォルダ自身の名前にする（物件情報_調書 の中の その２ が分からない）",
   u'''    const nm = String(rel.length >= 2 ? rel[rel.length - 2] : (c.name || "")).trim();''',
   u'''    const nm = String(c.name || "").trim();''', TM, "main", u"㉑f"),
  (u"★「リスト」だけを選んで物件が分からないとき、どうすればよいか言わない",
   u'''  if(!p.name) return "。「リスト」だけを選んだので、''', u'''  if(false) return "。「リスト」だけを選んだので、''', TM, "main", u"㉑c"),
  (u"★物件フォルダ1つだけを選んだとき、上のフォルダを選ぶよう言わない",
   u'''+ (lg ? ("（現場の台帳: " + lg + "）") : "") + sideSortRootHint(it, acc) };''', u'''+ (lg ? ("（現場の台帳: " + lg + "）") : "") };''', TM, "main", u"㉑"),
  (u"★一覧を読み直せなかったのに、知らせで言わない",
   u'''      if(reloaded !== true){''', u'''      if(false){''', TM, "main", u"㉒"),
  (u"★読み直したかを返さない（読み直せても「まだ前の中身」と言う）",
   u'''  renderListTable();
  missShowNote();
  return true;
}''', u'''  renderListTable();
  missShowNote();
}''', TM, "main", u"㉒"),
  (u"★📥：預けの注意を出さない",
   u'''        sideWarn = sideImportWarn(side, matchType);''', u'''        sideWarn = "";''', TM, "main", u"㉓"),
  (u"★📥：別の物件の預けでも注意しない",
   u'''  if(cur && sp && pjDiffers(sp, cur))''', u'''  if(false)''', TM, "main", u"㉓"),
  (u"★📥：台帳に無い戸別の預けでも注意しない",
   u'''  if(matchType === "new")
    return "この管理番号は、"''', u'''  if(false)
    return "この管理番号は、"''', TM, "main", u"㉓"),
  (u"★📥：注意のときも「スキップ」を選んでおかない",
   u'''    if(wAll) wAll.style.display = "none";
    try { bSkip.focus(); } catch(_){}''', u'''    if(wAll) wAll.style.display = "none";''', TM, "main", u"㉓"),
  (u"★📥：「残りも確かめなしで」なら、別の物件の預けも窓を出さずに取り込む",
   u'''      if(applyAllDefault && !sideWarn){''', u'''      if(applyAllDefault){''', TM, "main", u"㉓"),
  (u"★📥：現場の台帳を見せない",
   u'''      (sideLg ? ("<div>現場の台帳: <b>" + escapeHtml(sideLg) + "</b></div>") : "")''', u'''      ""''', TM, "main", u"㉓"),
  (u"★📥：注意で変えたボタンを元に戻さない",
   u'''        bImp.style.cssText = keepUi.imp; bImp.textContent = keepUi.impT;''', u'''''', TM, "main", u"㉓"),
  (u"★手で選んだ行き先に 管理番号.json があっても、まとめない",
   u'''    return { act: "merge", p, ce: json };''',
   u'''    return (it.decided && destIdx === it.decided.dest) ? { act: "merge", p, ce: json } : { act: "hold", why: "手で選んだ先" };''', TM, "main", u"㉔"),

  # ======== 4回目（Android のフォルダ・共有の案内） ========
  (u"★Android でも、名前が「リスト」なら端末の中と見ない（⚠・📮 を出さない）",
   u'''  if(isAndroidLike()) return true;''', u'''''', TG, "genba", u"㊴d"),
  (u"共有の案内を、Dropbox に無い物件の正式名で言う",
   u'''  if(n) return "その" + String(n).replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)) + " ＞ リスト";''', u'''''', TG, "genba", u"㊴c"),

  # ======== 現場（3回目の見直しの直し） ========
  (u"★PC版のサイトを開いた Android タブレット（Linux＋指で触れる）を Android と見ない",
   u'''  return /Linux/i.test(ua) && !/CrOS/i.test(ua) && touch > 0;''', u'''  return false;''', TG, "genba", u"㊶a"),
  (u"★指で触れる画面を見ない（Linux のPCまで Android と見る）",
   u'''  return /Linux/i.test(ua) && !/CrOS/i.test(ua) && touch > 0;''', u'''  return /Linux/i.test(ua) && !/CrOS/i.test(ua);''', TG, "genba", u"㊶b"),
  (u"userAgentData の platform（Android）を見ない",
   u'''  try{ if(navigator.userAgentData && /Android/i.test(String(navigator.userAgentData.platform || ""))) return true; }catch(_){}''', u'''''', TG, "genba", u"㊶b"),
  (u"★Windows のPCも Android と見る（PCの「リスト」に書いても ⚠ を出す）",
   u'''  if(/Android/i.test(ua)) return true;''', u'''  if(/Android|Windows/i.test(ua)) return true;''', TG, "genba", u"㊴b"),
  (u"★書いたあとの控えを、前のフォルダのもの（印が違う）でも当てにする",
   u'''  if(b.from !== "list" || !b.ep || b.ep !== _saveDirEp) return false;''', u'''  if(b.from !== "list") return false;''', TG, "genba", u"㊷b"),
  (u"★Android の端末の中の「リスト」に書いた控えを当てにする",
   u'''  return !!(d && !saveDirMaybeDevice(d));''', u'''  return !!(d && (saveDirParentOf(d) || saveDirIsListName(d.name)));''', TG, "genba", u"㊷a"),
  (u"★📂 で読んだファイルが PCらしくなくても、PCのファイルを読んだことにする",
   u'''        M._fileBase.rd = pcHitLooksPc(raw, row0);''', u'''        M._fileBase.rd = true;''', TG, "genba", u"㊸a"),
  (u"★読んだかどうかを別名ファイルも合わせて決める（写真3枚のファイルを読んだだけで PCのファイル扱い）",
   u'''        M._fileBase.rd = pcHitLooksPc(raw, row0);''', u'''        M._fileBase.rd = pcHitLooksPc(raw, row0, opt && opt.others);''', TG, "genba", u"㊸b"),
  (u"★別名ファイルにしかない写真を、写真の歯止めに入れない",
   u'''  try{ await loadStateInto(hit.data, hit.name, { others: hit.others }); }''', u'''  try{ await loadStateInto(hit.data, hit.name); }''', TG, "genba", u"㊸b"),
  (u"★フォルダに書いたときの まとめた覚え（_sideMerged）をモデルに入れない（共有で渡すファイルから落ちる）",
   u'''  if(st && Array.isArray(st._sideMerged)){ model._passthrough = model._passthrough || {}; model._passthrough._sideMerged = st._sideMerged.slice(); }''',
   u'''''', TG, "genba", u"㊹"),
  (u"共有で渡す道でも、入れる場所を物件の正式名で言う",
   u'''  const n = (proj && pp.outer === proj) ? pjSonoNo(proj) : "";''', u'''  const n = "";''', TG, "genba", u"㊺"),
  (u"保存バーの「📤 共有で渡す（…）」を物件の正式名で言う",
   u'''  const hintPP = saveHintShowParts();''', u'''  const hintPP = saveHintParts();''', TG, "genba", u"㊺"),
  (u"取り込みのあとの窓の「📤 フォルダを覚えるのをやめて、共有で渡す」の説明を物件の正式名で言う",
   u'''共有なら Dropbox の「" + sideListPlace() + "」を選べます"''', u'''共有なら Dropbox の「" + mm.proj + " ＞ リスト」を選べます"''', TG, "genba", u"㊺"),
  (u"「フォルダを覚えるのをやめました」を物件の正式名で言う",
   u'''  const h = saveHintShowLabel();''', u'''  const h = saveHintLabel();''', TG, "genba", u"㊺"),
  (u"共有で渡したあとの案内（★入れる場所★）を物件の正式名で言う",
   u'''  const pp = saveHintShowParts();         // 共有で渡す道は''', u'''  const pp = saveHintParts();         // 共有で渡す道は''', TG, "genba", u"㊺"),
  (u"保存中の「入れる所」を物件の正式名で言う",
   u'''  try{ where = saveDirPlace() || saveHintShowLabel(); }catch(_){}''', u'''  try{ where = saveDirPlace() || saveHintLabel(); }catch(_){}''', TG, "genba", u"㊺"),
  (u"★まとめて保存（共有）：いま開いている戸別は、中身が変わっても「保存済」にする",
   u'''    const sentOkM = (!sentSig || stateSig(M) === sentSig) && !lateM;''', u'''    const sentOkM = !lateM;''', TG, "genba", u"㊻a"),
  (u"★まとめて保存（共有）：渡した中身の指紋を渡さない",
   u'''{ keep: true, sig: f.sig }''', u'''{ keep: true }''', TG, "genba", u"㊻a"),
  (u"★まとめて保存（共有）：中身が変わっても、保存バーを「保存済」にする",
   u'''delete M._otherFile; if(sentOkM && !lateOther) saveStateFile(); }''', u'''delete M._otherFile; if(!lateOther) saveStateFile(); }''', TG, "genba", u"㊻a"),   # 版178 で !lateOther を足した
  (u"★1件の保存（共有）：中身が変わっても「保存済」にする",
   u'''      if(same0){ await markDraftSaved(); saveStateFile(); }''', u'''      { await markDraftSaved(); saveStateFile(); }''', TG, "genba", u"㊻b"),
  (u"1件の保存（共有）：中身が変わって、まだ渡していない分があることを言わない",
   u'''        + (same0 ? "" :''', u'''        + (true ? "" :''', TG, "genba", u"㊻b"),

  # ======== 現場（4回目の見直しの直し） ========
  (u"★1件の保存（共有）：渡す中身の指紋を、中身を作ったときでなく渡す直前に取る（下書きを書くあいだに入った写真まで「渡した」にする）",
   u'''    const sig0 = sigBuilt;''', u'''    const sig0 = stateSig(M);''', TG, "genba", u"㊼"),
  (u"★保存の途中で入った写真を見分けない（書いた中身に無い写真があっても「無い」と答える）",
   u'''  return (((model || {}).chosho_photos) || []).some(p => p && p.dataUri && !have.has(String(p.id || photoContentId(p.dataUri))));''',
   u'''  return false;''', TG, "genba", u"㊽a"),
  (u"★フォルダに書いた保存：保存の途中で入った写真があっても「保存済」にする",
   u'''      await persistDraft(); if(!late){ await markDraftSaved(); saveStateFile(); }''',
   u'''      await persistDraft(); { await markDraftSaved(); saveStateFile(); }''', TG, "genba", u"㊽a"),
  (u"フォルダに書いた保存：保存の途中で入った写真がまだ渡っていないことを言わない",
   u'''        + (late ? ("\\n\\n" + saveLateLine()) : "")''', u'''        + ""''', TG, "genba", u"㊽a"),
  (u"フォルダに書いた保存：保存の途中で入った写真があっても、緑の「保存しました」で勝手に閉じる",
   u'''        warn: late, stay: devOnly,''', u'''        warn: false, stay: devOnly,''', TG, "genba", u"㊽a"),
  (u"★保存先を選ぶ画面で書いた保存：保存の途中で入った写真があっても「保存済」にする",
   u'''      if(!lateP){ await markDraftSaved(); saveStateFile(); }''', u'''      { await markDraftSaved(); saveStateFile(); }''', TG, "genba", u"㊽b"),
  (u"保存先を選ぶ画面で書いた保存：保存の途中で入った写真がまだ渡っていないことを言わない",
   u'''        + (lateP ? ("\\n\\n" + saveLateLine()) : ""), warn: lateP };''', u'''        , warn: false };''', TG, "genba", u"㊽b"),
  (u"★ダウンロードの保存：保存の途中で入った写真があっても「保存済」にする",
   u'''  if(!lateD){ await markDraftSaved(); saveStateFile(); }''', u'''  { await markDraftSaved(); saveStateFile(); }''', TG, "genba", u"㊽c"),
  (u"ダウンロードの保存：保存の途中で入った写真がまだ渡っていないことを言わない",
   u'''    + (lateD ? ("\\n\\n" + saveLateLine()) : ""), warn: true };''', u'''    , warn: true };''', TG, "genba", u"㊽c"),
  (u"★まとめて保存（フォルダ）：書いた中身を渡さない（保存の途中で入った写真があっても「保存済」にする）",
   u'''dir ? { wrote: f.state, was: f.sig } : { keep: true, sig: f.sig }''', u'''dir ? null : { keep: true, sig: f.sig }''', TG, "genba", u"㊽d"),   # 版178 で was を足した
  (u"★まとめて保存（フォルダ）：いま開いている戸別に保存の途中で入った写真を見ない",
   u'''    const lateM = !!(opt && opt.wrote) && model === M && photosLateVs(opt.wrote, M);''', u'''    const lateM = false;''', TG, "genba", u"㊽d"),
  (u"まとめて保存：保存の途中で写真が入った戸別を知らせない",
   u'''  if(lateNos.length) await uiAlert(''', u'''  if(false) await uiAlert(''', TG, "genba", u"㊽d"),
  (u"まとめて保存：「保存済」にしなかったことを返さない（知らせが出ない）",
   u'''    return (model === M && !sentOkM) ? "late" : "ok";''', u'''    return "ok";''', TG, "genba", u"㊽d"),
  (u"★iPhone（共有で渡す道でない）では、入れる場所を物件の正式名で言う（📮 の「その１ ＞ リスト」と食い違う）",
   u'''  if(!pp.outer || pp.inner !== "リスト") return pp;''', u'''  if(saveRoute() !== "share" || !pp.outer || pp.inner !== "リスト") return pp;''', TG, "genba", u"㊾"),
  (u"iPhone の保存バーの「📁 … ＞ リスト に入れる」を物件の正式名で言う",
   u'''  const hintPP = saveHintShowParts();''', u'''  const hintPP = saveHintParts();''', TG, "genba", u"㊾"),

  # ======== メイン（3回目の見直しの直し） ========
  (u"★工事フォルダが選んだ「リスト」そのものでも、開いている物件のリストと分からない",
   u'''    if(Array.isArray(rel) && !rel.length && ci < nProj && _currentProject && String(_currentProject.name || "").trim())
      return { name: String(_currentProject.name).trim(), folder: "" };''', u'''''', TM, "main", u"㉕a"),
  (u"★📁 で読んだだけの「リスト」そのものも、開いている物件のリストにする（紛れた写しへまとめる）",
   u'''    if(Array.isArray(rel) && !rel.length && ci < nProj && _currentProject''',
   u'''    if(Array.isArray(rel) && !rel.length && _currentProject''', TM, "main", u"㉕a"),
  (u"★覚えてある工事フォルダ（:dir）が選んだ「リスト」そのものでも、開いている物件のリストと分からない",
   u'''  const nProj = cands.length;                    // ここまでが、開いている物件の工事フォルダ''',
   u'''  const nProj = _projDirHandle ? 1 : 0;''', TM, "main", u"㉕a2"),
  (u"★物件の名前を、フォルダの名前として場所に書く",
   u'''top.folder = pn.folder || "";''', u'''top.folder = pn.name;''', TM, "main", u"㉕a"),
  (u"★名前の分からない「リスト」へ手で選んでまとめたとき、預けの物件で開いている物件と見ない（行が前のまま）",
    u'''  return sideProjSame(_currentProject.name, pj) || !pjDiffers(pj, _currentProject.name);''',
    u'''  return false;''', TM, "main", u"㉕b"),
  (u"★読み直しを断られたとき、その戸別ファイルの行に入れない",
   u'''        const done = await sideAdoptRows(res, async (r, a) => {
          if(r.fileHandle && a.m.fh){''', u'''        const done = [];
        if(0) await sideAdoptRows(res, async (r, a) => {
          if(r.fileHandle && a.m.fh){''', TM, "main", u"㉖e"),
  (u"★読み直しを断られたとき、同じ戸別ファイルの行を見分けない",
   u'''            try { if(await r.fileHandle.isSameEntry(a.m.fh)) return true; } catch(_){}''', u'''''', TM, "main", u"㉖e"),
  (u"★読み直しを断られたとき、行の無い戸別があっても「まだ前の中身」と言わない",
   u'''        tail += (left ? (''', u'''        tail += (false ? (''', TM, "main", u"㉖e"),
  (u"★読み直しを断られたとき、片付けた預けを一覧の外の覚えに残す",
   u'''        if(res.gone.length) _sideFiles = ''', u'''        if(0) _sideFiles = ''', TM, "main", u"㉖e"),
  (u"★まとめた戸別ファイルの写真を、行に持たせない（開いて保存すると消える）",
   u'''  if(ph !== true){''', u'''  if(false){''', TM, "main", u"㉖a"),
  (u"★行の写真と和集合にしない（行にしか無い写真が消える）",
   u'''  const merged = mergeGenbaPhotos(base, fp, { dropKeys: [], mainThumb: !!r.data.chosho_photos_thumb }, null);''',
   u'''  const merged = fp.slice();''', TM, "main", u"㉖b"),
  (u"★アパートの世帯：まとめた戸別ファイルの写真を行に持たせない",
   u'''  if(ph !== true){''', u'''  if(false){''', TM, "main", u"㉖d"),
  (u"★物件から開いた行（サムネ）にも、戸別ファイルの写真を常駐させる",
   u'''  if((r._fromProject || r.data.chosho_photos_thumb) && !r.fileHandle && !r.srcFile) return true;''', u'''''', TM, "main", u"⑲a"),
  (u"★まとめたとき、まとめた戸別ファイルを渡さない",
   u'''    out.merged.fh = ce.fh;''', u'''    out.merged.fhX = ce.fh;''', TM, "main", u"㉖a"),
  (u"★新しく置いたとき、置いた戸別ファイルを渡さない",
   u'''  out.merged.fh = fh;''', u'''  out.merged.fhX = fh;''', TM, "main", u"㉖c"),
  (u"★図面のまだ無い戸別を開くとき、行の写真を画面に入れない",
   u'''    base.chosho_photos = preset;''', u'''    base.chosho_photos = [];''', TM, "main", u"㉖c"),   # 版178 で開けなかったときに止まる行を足した
  # 「★図面のまだ無い戸別を開くとき、物件の保存でサムネにした写真を画面に入れない」は版178 で外した
  # （版178 から物件の保存で行の写真をサムネに置き換えないので、壊しても同じ動き＝見分けようが無い）
  (u"★図面のまだ無い戸別を開くとき、常駐させない写真を元のファイルから読まない",
   u'''  if(row._slim && (row.fileHandle || row.srcFile)){
    const rr = await rereadRowSourceWhy(row);''', u'''  if(false){
    const rr = { data: null, why: "none" };''', TM, "main", u"㉖f"),   # 版178 で見せた写真を覚える行を足した（else が続くので if だけ壊す）
  (u"★新しく置けないとき、どうすれば置けるか言わない",
   u'''      + sideSortNewHint(it, acc, p) };''', u'''      };''', TM, "main", u"㉗a"),
  (u"★上のフォルダを選んでいても「上のフォルダを選ぶと置けます」と言う",
   u'''  if(!proj || !p || !acc || !(p.dir === acc.root || p.list === acc.root)) return "";''',
   u'''  if(!proj || !p || !acc) return "";''', TM, "main", u"㉗a"),
  (u"★開いたままの戸別に「保存して閉じてください」と言う（閉じる操作が無い）",
   u'''  if(rows.some(r => r === _editingRow)) return "この戸別は いま開いたままです。まだ保存していなければ 💾 で保存し、"
    + "ほかの戸別を開くか ページを読み込み直してから、もう一度押してください";''',
   u'''  if(rows.some(r => r === _editingRow)) return "いま開いて直している途中です（先に保存して閉じてください）";''', TM, "main", u"㉗b"),
  (u"★「リスト」を選んだとき、場所に「リスト/」を書かない",
   u'''    ? (String(p.folder ? (p.folder + "/") : "") + "リスト/" + rel)''',
   u'''    ? (String(p.folder ? (p.folder + "/") : "") + rel)''', TM, "main", u"㉗c"),
  (u"★リストの中のフォルダにあっても「リスト の外」と言う",
   u'''(inList ? "リスト の中のフォルダ" : "リスト の外")''', u'''"リスト の外"''', TM, "main", u"㉗c"),
  (u"★物件のフォルダを選んだとき、リストの中のフォルダを見分けない",
   u'''(!!lp && String((x && x.path) || "").indexOf(lp) === 0)''', u'''false''', TM, "main", u"㉗c"),

  # ======== メイン（4回目の見直しの直し） ========
  (u"★預けの物件の名前が空だと、名前の分からないリストへまとめても開いている物件の行に入れない（あとの保存で工事完了が外れる）",
   u'''  if(!pj) return true;''', u'''  if(!pj) return false;''', TM, "main", u"㉕d"),
  (u"★預けの物件の名前が空のとき、現場で開いていた台帳の名前で決める（Android で その２ を開いたままだと入らない）",
   u'''  if(!pj) return true;''',
   u'''  if(!pj) return sideProjSame(_currentProject.name, String((a.m.side && a.m.side.ledger) || ""));''', TM, "main", u"㉕d2"),
  (u"★預けの物件が その２ とはっきり分かるのに、名前の分からないリストへ手で選んでまとめると その１ の行に入れる",
   u'''  return sideProjSame(_currentProject.name, pj) || !pjDiffers(pj, _currentProject.name);''',
   u'''  return true;''', TM, "main", u"㉕e"),
  (u"★物件に保存で、行の知らない預けの済みの印・状態・まとめた印を戸別ファイルへ引き継がない（工事完了が外れる）",
   u'''      sideKept = sideKeepFileMarks(contentObj, sideFile);''', u'''      sideKept = null;''', TM, "main", u"㉙"),
  (u"★行に入れられなかった預け（その２ と分かる）の済みの印を、物件に保存で戸別ファイルから外す",
   u'''      sideKept = sideKeepFileMarks(contentObj, sideFile);''', u'''      sideKept = null;''', TM, "main", u"㉕e"),
  (u"★行の知っている印だけの戸別ファイルでも済みの印を引き継ぐ（事務所が外した工事完了を戻してしまう）",
   u'''  const unk = fm.filter(x => dm.indexOf(x) < 0);
  if(!unk.length) return null;''', u'''  const unk = fm.filter(x => dm.indexOf(x) < 0);''', TM, "main", u"㉙"),
  (u"★戸別ファイルの状態（完了）を進む方向に引き継がない",
   u'''  if(fr > dr){ data.chosho_status = file.chosho_status; out.status = file.chosho_status; }''', u'''''', TM, "main", u"㉙"),
  (u"★戸別ファイルの工事完了の日付を引き継がない",
   u'''    if(sideIsEmptyVal(data[at]) && !sideIsEmptyVal(file[at])) data[at] = file[at];''', u'''''', TM, "main", u"㉙"),
  (u"★戸別ファイルのまとめた印を引き継がない（次の保存でまた前の中身を書く）",
   u'''  data._sideMerged = dm.concat(unk).slice(-200);''', u'''''', TM, "main", u"㉙"),
  (u"★引き継いだ印・状態を行に入れない（物件・受付台帳は前のまま）",
   u'''    const k2 = sideKeepFileMarks(row.data, sideFile);''',
   u'''    const k2 = sideKeepFileMarks(Object.assign({}, row.data), sideFile);''', TM, "main", u"㉙"),
  (u"★引き継いだ状態を開いている画面に入れない（開いたままもう一度保存すると外れる）",
   u'''      if(el && el.value !== k2.status) el.value = k2.status;''', u'''''', TM, "main", u"㉙"),
  (u"★戸別ファイルから済みの印・状態を引き継いだことを知らせない",
   u'''  renamedNote += sideKeptNote + thumbKeptNote + hybNote;''', u'''  renamedNote += thumbKeptNote + hybNote;''', TM, "main", u"㉙"),   # 版178 で縮小版の知らせ（thumbKeptNote）・版181 で .hyb の写真の知らせ（hybNote）を足した
  (u"★物件の行のときも、振り分けたあと 📁 のフォルダを読み直す（物件の戸別・物件だけの直しが消える）",
   u'''      related = false;
      if(res.gone.length){                       // 片付けた預けは''', u'''      if(res.gone.length){                       // 片付けた預けは''', TM, "main", u"㉘a"),
  (u"★物件の行のとき、上のフォルダを選ぶと 📁 のフォルダを読み直す（物件の戸別・物件だけの直しが消える）",
   u'''      related = false;
      if(res.gone.length){                       // 片付けた預けは''', u'''      if(res.gone.length){                       // 片付けた預けは''', TM, "main", u"㉘b"),
  (u"★物件に 📁 を取り込んでいる（行がファイルを持つ）のに、振り分けたあと読み直さない",
   u'''    if(related && _currentProject && !(pjRows.some(r => r.fileHandle) && pjRows.every(r => r.fileHandle))){''',
   u'''    if(related && _currentProject){''', TM, "main", u"㉘c"),
  (u"★ファイルを持つ行が1つでもあれば読み直す（台帳で作って反映した行で、物件の行を置き換える）",
   u'''    if(related && _currentProject && !(pjRows.some(r => r.fileHandle) && pjRows.every(r => r.fileHandle))){''',
   u'''    if(related && _currentProject && !(Array.isArray(_listRows) ? _listRows : []).some(r => r && r.fileHandle)){''', TM, "main", u"㉘a"),
  (u"★台帳で作った行しか無い物件でも読み直す（覚えていた別の物件のフォルダの戸別が入る）",
   u'''    if(related && _currentProject && !(pjRows.some(r => r.fileHandle) && pjRows.every(r => r.fileHandle))){''',
   u'''    if(related && _currentProject && pjRows.some(r => !r.fileHandle)){''', TM, "main", u"㉘d"),
  (u"★台帳で作った行（ファイル無し）があると、物件に 📁 を取り込んでいても読み直さない",
   u'''    const pjRows = (Array.isArray(_listRows) ? _listRows : []).filter(r => r && !r._manual);''',
   u'''    const pjRows = (Array.isArray(_listRows) ? _listRows : []).filter(r => r);''', TM, "main", u"㉘c"),
  (u"★読み直さないとき、片付けた預けを一覧の外の覚え（_sideFiles）に残す",
   u'''        _sideFiles = (Array.isArray(_sideFiles) ? _sideFiles : []).filter(sf => !sf || gone0.indexOf(sf.file) < 0);''', u'''''', TM, "main", u"㉘a"),
  (u"★新しい戸別を置いた知らせで、物件の名前をフォルダの名前のように書く",
   u'''          const w = (a.p && a.p.folder) ? (a.p.folder + " ＞ リスト")''',
   u'''          const w = (a.p && a.p.name) ? (a.p.name + " ＞ リスト")''', TM, "main", u"㉕a"),
  (u"★読み直しを断られたとき、印を外しただけの戸別（行が無い）を「まだ前の中身」に数えない",
   u'''        const left = res.adopt.filter(a => a && a.m && done.indexOf(a) < 0).length;''',
   u'''        const left = res.adopt.filter(a => a && a.m && a.m.S && done.indexOf(a) < 0).length;''', TM, "main", u"㉚"),

  # ======== メイン（5回目の見直しの直し） ========
  (u"★🧹 未施工 で、まとめた預けの印（_sideMerged）を落とす（次の物件に保存で工事完了がまた付く）",
   u'''  "_sideMerged"
];''', u'''];''', TM, "main", u"㉛"),
  (u"★ほかの戸別を書くときも、画面に開いている戸別の「状態」を合わせる（取込で別の戸別が完了になる）",
   u'''    if(k2 && k2.status && _editingRow === row && !_indivWriteNotShown){''',
   u'''    if(k2 && k2.status && _editingRow === row){''', TM, "main", u"㉜"),
  (u"★📥 で戸別を書くときに、画面に出ていない戸別だと印を付けない",
   u'''  try { _editingRow=row; _indivWriteNotShown = (prev !== row);''',
   u'''  try { _editingRow=row; _indivWriteNotShown = false;''', TM, "main", u"㉜"),
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
