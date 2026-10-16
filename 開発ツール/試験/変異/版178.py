# -*- coding: utf-8 -*-
# 版178 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン・現場入力）
#   ・メイン：物件を開いていて、ファイルのつながっていない戸別に写真を足して「物件に保存」すると、戸別ファイルに
#     縮小版が書かれていた直し。縮小版は物件の保存だけに使い、戸別ファイルにはいつも元の写真を書く。
#     見直しで見つかった道（最新を取り込む・開き直す・まとめる・💾 反映のあとの保存・📄 の行・番号の付け替え・
#     台帳で作った行・画面に入れなかった写真・「小さい写真」の知らせ）も、写真を減らさないように直した。
#   ・現場入力：まとめて保存・全部保存し直す・引き継ぎ・受付台帳の取り込みで、始めに読んだ写しで下書きを書き戻して
#     途中で届いた写真を消していた直し。写真の取り込みの最後の書き込みで、開き直した戸別・別の戸別の下書きを上書きしない。
#   場面を絞って速くする（現場入力は SCENE、メインは ONLY に場面の記号を渡す）。
#   「メイン」「現場」を引数に渡すと分けて走らせられる。名前の一部を渡すとそれだけ走る。
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
TM, TG = "smoke_v178_main.js", "smoke_v178_genba.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)  どのファイル＝ "main"／"genba"。場面＝その試験の場面の記号
THUMB_OLD = u'''  thumbMemoPut(row.file, row.lastModified, thumbs);   // 次にフォルダを読んだ時は作り直さない
'''
THUMB_NEW = THUMB_OLD + u'''  if(!row.fileHandle && !row.srcFile && row.data && Array.isArray(row.data.chosho_photos)){ const d = Object.assign({}, row.data); d.chosho_photos = thumbs; d.chosho_photos_thumb = true; d.chosho_photo_count = thumbs.length; row.data = d; }
'''
CASES = [
  # ======== メイン：縮小版を戸別ファイルに書かない ========
  (u"★物件の保存で、行の写真を縮小版に置き換える（物件に保存で戸別ファイルに縮小版が書かれる）", THUMB_OLD, THUMB_NEW, TM, "main", u"①"),
  (u"★物件の保存で、行の写真を縮小版に置き換える（自動保存のあと・2回目・開き直し）", THUMB_OLD, THUMB_NEW, TM, "main", u"③"),
  (u"★物件の保存で、行の写真を縮小版に置き換える（💾 戸別ファイルへ反映で新しく作る）", THUMB_OLD, THUMB_NEW, TM, "main", u"⑦"),
  (u"★図面のまだ無い戸別を開いたとき「💾 物件に保存」を押せるようにしない",
   u'''    updateOverwriteSaveBtn();       // 「💾 物件に保存」を押せるようにする（版178。図面のある戸別は setLoadedOrigin で出していた）
''', u'''''', TM, "main", u"①"),
  # ======== メイン：ファイルにしか無い写真を落とさない（B） ========
  (u"★いま書くファイルを読んで開いた行でなくても、行の写真だけを書く（写真の無い行で現場の写真が消える）",
   u'''  if(photosKnown && (existingFh || alsoFh)){''',
   u'''  if(false){''', TM, "main", u"⑤a"),
  (u"★行が見せていない写真まで、画面で消したものとして消す（ファイルが付いているだけの行で、ファイルにしか無い写真が消える）",
   u'''    const fresh = (Array.isArray(fb.photos) ? fb.photos : []).filter(p => p && !photoSeenBy(row, p));''',
   u'''    const fresh = [];''', TM, "main", u"⑭c"),
  (u"★画面で消した写真（行が見せた写真）を見分けない（消した写真が戸別ファイルに戻る）",
   u'''  if(p.dataUri) return s.has(p.id || photoContentId(p.dataUri));''',
   u'''  if(p.dataUri) return false;''', TM, "main", u"⑳"),
  (u"★図面のまだ無い戸別を開くとき、ファイルから読んで見せた写真を覚えない（画面で消した写真が戻る）",
   u'''    if(fr && typeof fr === "object") rowSeePhotos(row, ph, true);   // このファイルの写真を見せる（版178）
''', u'''''', TM, "main", u"⑳"),
  (u"★戸別ファイルへ書いたとき、行が持っていた写真を覚えない（足して書いた写真を画面で消しても、ファイルに残る）",
   u'''  if(row.fileType === "plain") rowSeePhotos(row, (row.data || {}).chosho_photos);''',
   u'''  if(false) rowSeePhotos(row, (row.data || {}).chosho_photos);''', TM, "main", u"⑤c"),
  (u"★中身を読めない戸別ファイルでも書く（写真を確かめられない）",
   u'''    if(!fb.read) return null;''', u'''''', TM, "main", u"⑤d"),
  (u"★0バイト・BOM だけのファイルを読めないとする（いつまでも書けない）",
   u'''    if(!t) return { read: true, photos: undefined };''', u'''    if(!t) return { read: false, photos: undefined };''', TM, "main", u"⑤e"),
  (u"★行の知っている写真を見分けない（同じ写真が2枚になる）",
   u'''      if((p.id && known.has(p.id)) || known.has(photoContentId(p.dataUri))) return;   // 行が知っている写真''',
   u'''      if(false) return;''', TM, "main", u"⑤b"),
  (u"★戻ってきた写真を、行の名前だけの枠に入れない（枠と写真が二重になる）",
   u'''      const i = p.id ? out.findIndex(q => q && !q.dataUri && q.id === p.id) : -1;''',
   u'''      const i = -1;''', TM, "main", u"⑩"),
  (u"★ファイルの名前だけの枠（写真IDあり）を落とす",
   u'''      && (p.id ? !out.some(q => q && q.id === p.id)''',
   u'''      && (p.id ? false''', TM, "main", u"⑤a"),
  (u"★ファイルの名前だけの枠（写真IDなし）を落とす",
   u'''                       : !out.some(q => q && String(q.label || "").trim() === String(p.label).trim()))){''',
   u'''                       : false)){''', TM, "main", u"⑩"),
  # ======== メイン：画面に入れなかった写真（C） ========
  (u"★図面のまだ無い物件の行を開くとき、画面に入れなかった写真を覚えない（保存で消える）",
   u'''    _editorHiddenPhotos = row._fromProject
''', u'''    _editorHiddenPhotos = false && row._fromProject
''', TM, "main", u"⑧a"),
  (u"★画面に入れなかった写真を、保存で行へ足さない",
   u'''      if(keep.length) s.chosho_photos = keep.concat(ed);''', u'''      if(false) s.chosho_photos = keep.concat(ed);''', TM, "main", u"⑨b"),
  (u"★画面に入れなかった写真と同じ写真を入れ直すと、二重になる",
   u'''      const keep = _editorHiddenPhotos.photos.filter(p => !((p.id && have.has(p.id)) || have.has(photoContentId(p.dataUri))));''',
   u'''      const keep = _editorHiddenPhotos.photos.slice();''', TM, "main", u"⑧b"),
  (u"★別の物を画面に出しても、画面に入れなかった写真の覚えを消さない（画面で消した写真が戻る）",
   u'''  _editingRow = null;
  _editorHiddenPhotos = null;
''', u'''  _editingRow = null;
''', TM, "main", u"⑨c"),
  (u"★工事調書のまとめ印刷のあと、画面に入れなかった写真の覚えを戻さない",
   u'''_editingRow = savedEditing; _editorHiddenPhotos = savedHidden;''', u'''_editingRow = savedEditing;''', TM, "main", u"⑪"),
  (u"★共有ファイルとまとめたあと、画面に入れなかった写真の覚えを新しい行へ付け替えない",
   u'''      if(_editorHiddenPhotos && _editorHiddenPhotos.row === _editingRow) _editorHiddenPhotos.row = nr;
''', u'''''', TM, "main", u"⑲"),
  # ======== メイン：開き直す・まとめる・最新を取り込むとき元の写真を持ち越す（D） ========
  (u"★まとめる・最新を取り込むとき、元の写真を持ち越さない（縮小版が戸別ファイルに書かれる）",
   u'''    if(keepOrig) rowsOriginalsRestore(_listRows, keepOrig);''', u'''''', TM, "main", u"④a"),
  (u"★🔄 最新を取り込むとき、元の写真を持ち越さない",
   u'''    if(keepOrig) rowsOriginalsRestore(_listRows, keepOrig);''', u'''''', TM, "main", u"⑫a"),
  (u"★ほかの端末が直した写真（回した・軽くした）を、この端末の古い元の写真に戻す",
   u'''      if(o.thumb != null && o.thumb !== p.dataUri) return p;                        // ほかの端末が直した写真は、そのまま''',
   u'''''', TM, "main", u"⑰"),
  (u"★持ち越すとき、作り直した行に無い写真も足す（ほかの端末で消した写真が戻る）",
   u'''    if(up) r.data = Object.assign({}, r.data, { chosho_photos: arr });
  });
}''', u'''    { const ex = Array.from(m.entries()).filter(([k]) => !arr.some(a => a && (a.id || photoContentId(a.dataUri || "")) === k)).map(([k, o]) => ({ id: k, label: "", dataUri: o.dataUri }));
      r.data = Object.assign({}, r.data, { chosho_photos: arr.concat(ex) }); }
  });
}''', TM, "main", u"④c"),
  (u"★台帳で作った行を物件から戻すとき、写真の枚数も縮小版も持たせない（物件から写真が抜ける。どちらか片方あれば抜けない）",
   u'''                 _photoCount: ph ? ph.length : (Number.isInteger(data.chosho_photo_count) ? data.chosho_photo_count : 0),
                 _thumbs: (ph && data.chosho_photos_thumb) ? ph : undefined,
''', u'''''', TM, "main", u"⑬a"),
  (u"★台帳で作った行を物件から戻すとき、写真の枚数も縮小版も持たせない（共有ファイルとまとめたとき）",
   u'''                 _photoCount: ph ? ph.length : (Number.isInteger(data.chosho_photo_count) ? data.chosho_photo_count : 0),
                 _thumbs: (ph && data.chosho_photos_thumb) ? ph : undefined,
''', u'''''', TM, "main", u"⑬b"),
  # ======== メイン：そのほかの道 ========
  (u"★物件の縮小版を持つ行でも、元のファイルへそのまま上書きする（反映のあと、縮小版で原寸を潰す）",
   u'''  _loadedOrigin = (target && target.fileHandle && !thumbRow)''', u'''  _loadedOrigin = (target && target.fileHandle)''', TM, "main", u"⑭a"),
  (u"★管理番号の付け替え先にもうファイルがあっても書く（そのファイルの写真と元のファイルが消える）",
   u'''      if(stop) return stop;''', u'''''', TM, "main", u"⑯a"),
  (u"★付け替え先のファイルに行の知らない写真があっても書く",
   u'''    if(!unknown.length) return "";''', u'''    return "";''', TM, "main", u"⑯a"),
  (u"★ファイルにしか無い写真を足しても、行の写真だけを返す（📄 で読んだ行で、工事フォルダの写真が消える）",
   u'''  return added ? out : rowPhotos;''', u'''  return rowPhotos;''', TM, "main", u"⑮a"),
  (u"★戻ってきた写真に、枠の名前を引き継がない",
   u'''        if(!String(o.label || "").trim() && out[i].label) o.label = out[i].label;''', u'''''', TM, "main", u"⑩"),
  (u"★「小さい写真」を、自分のファイルから読んだ行にも出す（元の小さい写真で 写真を直す が止まる）",
   u'''  if(!(row && row._fromProject) && !(d && d.chosho_photos_thumb)) return false;''', u'''''', TM, "main", u"㉔"),
  (u"★縮小版づくりが動いているあいだの保存で、終わるのを待たない（写真なしで物件に保存する）",
   u'''  for(let i = 0; _projThumbsRun && i < 100; i++){ try { await _projThumbsRun; } catch(_){} }''', u'''''', TM, "main", u"㉖"),
  (u"★暗号の戸別（.hyb）を、写真を剥がした封筒のまま書く（暗号の写真が全部消える）",
   u'''  if(!ph || (ph.iv && ph.ct)) return env;              // 写真が無い・暗号の写真をそのまま持っている''',
   u'''  return env;''', TM, "main", u"㉕a"),
  (u"★暗号の戸別（.hyb）で、鍵の違うファイルの写真を混ぜて書く（ほどけない写真になる）",
   u'''  if(!f || typeof f !== "object" || f.salt !== env.salt || f.iter !== env.iter) return null;''',
   u'''  if(!f || typeof f !== "object") return null;''', TM, "main", u"㉕b"),
  (u"★ファイルが付いている行でも、物件の覚えている名前で探す（同じ番号のファイルをもう1つ作り、縮小版を書く）",
   u'''  const att = !!(row._dir && row._name && !row._detached && row.fileHandle);''', u'''  const att = false;''', TM, "main", u"㉑a"),
  (u"★ファイルが付いている行（図面なし）でも、物件の覚えている名前で探す",
   u'''  const att = !!(row._dir && row._name && !row._detached && row.fileHandle);''', u'''  const att = false;''', TM, "main", u"㉑b"),
  (u"★ファイルを動かした戸別でも、物件の覚えている名前で探す（動かした先に直しが入らない）",
   u'''  const att = !!(row._dir && row._name && !row._detached && row.fileHandle);''', u'''  const att = false;''', TM, "main", u"㉑c"),
  (u"★名前をそろえたあと、行のファイルを付け替えない（2回目の保存が古い名前へ行く）",
   u'''  if(att){ row._name = relpath; row.fileHandle = fh; row.file = (row._dirPath || "") + relpath; }   // 付いているファイル（版178）''',
   u'''  if(att){ }''', TM, "main", u"㉑d"),
  (u"★名前の大文字・小文字だけ違う同じファイルを、別のファイルとして扱う（いつまでも書けない・前は消していた）",
   u'''  try { return !!(await from.isSameEntry(fh)); } catch(_){ return false; }''',
   u'''  return false;''', TM, "main", u"㉒"),
  (u"★同じ管理番号のファイルが2つあるとき、🧩 で1つにする案内を出さない",
   u'''  const twin = !!(sj && tj && no(sj.chosho_mgmt_no) && no(sj.chosho_mgmt_no) === no(tj.chosho_mgmt_no));''',
   u'''  const twin = false;''', TM, "main", u"⑯c"),
  (u"★付け替え先のファイルの写真を土台にしない（行き先の元の写真を縮小版で置き換える）",
   u'''      alsoFh = fh;''', u'''''', TM, "main", u"⑯e"),
  (u"★💾 上書き保存で、開いたあとでファイルに入った写真を残さない（現場が足した写真が消える）",
   u'''      stateObj.chosho_photos = photosKeepFileOnly(stateObj.chosho_photos, late);''', u'''''', TM, "main", u"㉓b"),
  (u"★💾 上書き保存のあと、画面に出ていた写真を覚えない（足して上書きした写真を消しても残る）",
   u'''      if(fmt === "plain" && _editingRow && shownPhotos) rowSeePhotos(_editingRow, shownPhotos);   // 画面に出ていた写真（版178）''',
   u'''''', TM, "main", u"㉓f"),
  (u"★📁 で読んで開いた行（図面あり）で、ファイルから読んで見せた写真を覚えない（画面で消した写真が上書き保存で戻る）",
   u'''      if(fresh){ d = lgOverlayLedger(fresh, target); rowSeePhotos(target, fresh.chosho_photos, true); } }   // このファイルの写真を見せる（版178）''',
   u'''      if(fresh){ d = lgOverlayLedger(fresh, target); } }''', TM, "main", u"㉓e"),
  (u"★一度開いた行（写真を持っている）を開き直したとき、見せた写真を覚えない",
   u'''    else rowSeePhotos(target, d && d.chosho_photos);                                                         // 行の写真を見せる（版178）''',
   u'''''', TM, "main", u"㉓f"),
  (u"★図面のある物件の行（縮小版の印が外れた）を、元のファイルへそのまま上書きする",
   u'''                      && (target._fromProject || target.data.chosho_photos_thumb));''',
   u'''                      && (target.data.chosho_photos_thumb));''', TM, "main", u"⑭d"),
  (u"★持ち越すとき、縮小版を覚えていない写真は元に戻さない（開き直したあと縮小版が戸別ファイルに書かれる）",
   u'''      if(o.thumb != null && o.thumb !== p.dataUri) return p;                        // ほかの端末が直した写真は、そのまま''',
   u'''      if(o.thumb !== p.dataUri) return p;''', TM, "main", u"⑫d"),
  (u"メインの版を上げない（閲覧用と食い違う）",
   u'''const APP_VERSION = "178";''', u'''const APP_VERSION = "177";''', "smoke_v177_main.js", "main", u"⑧"),
  (u"★「小さい写真」を、写真を一覧で開くとき（写真を直す）は印だけで見る",
   u'''      const isThumb = !!(arr && rowHasThumbPhotos(row.data, row)); // 物件埋め込みのサムネイル（中身の大きさで見る・版178）''',
   u'''      const isThumb = !!(arr && row.data.chosho_photos_thumb);''', TM, "main", u"㉔"),
  (u"★「小さい写真」を印だけで見る（開いて保存すると知らせが消える）",
   u'''  return d.chosho_photos.some(p => { if(!p || !p.dataUri) return false; const e = photoLongEdgeOf(p.dataUri); return e > 0 && e <= PROJ_THUMB_MAXPX; });''',
   u'''  return !!d.chosho_photos_thumb;''', TM, "main", u"⑱a"),

  # ======== 現場入力：まとめて保存（E・F） ========
  (u"★まとめて保存（フォルダ）：下書きの中身が変わっていても、写しで書き直す・保存済にする",
   u'''    const lateOther = !keep && !!model && model !== M && !!(opt && opt.wrote) && !draftRecSame(rec, (opt && opt.was) || "");''',
   u'''    const lateOther = false;''', TG, "genba", u"①"),
  (u"★まとめて保存（フォルダ）：写しを作ったときの指紋を渡さない（いつまでも保存済にならない）",
   u'''{ wrote: f.state, was: f.sig }''', u'''{ wrote: f.state }''', TG, "genba", u"②"),
  (u"★まとめて保存（フォルダ）：中身が変わっていた戸別を知らせない",
   u'''    if(lateOther) return "late";''', u'''    if(false) return "late";''', TG, "genba", u"①"),
  (u"★まとめて保存（フォルダ）：開き直した戸別に写真が届いても、保存バーを「保存済」にする",
   u'''if(sentOkM && !lateOther) saveStateFile();''', u'''if(sentOkM) saveStateFile();''', TG, "genba", u"④"),
  (u"★まとめて保存（フォルダ）：中身が変わっていても「保存済」の印を付ける",
   u'''(model !== M ? !lateOther : sentOkM)''', u'''(model !== M ? true : sentOkM)''', TG, "genba", u"①"),
  (u"★まとめて保存（フォルダ）：中身が変わっていても、写しで下書きを書き直す（写真が消える）",
   u'''    if(rec && model && rec.model !== model && !keep && !lateOther){''', u'''    if(rec && model && rec.model !== model && !keep){''', TG, "genba", u"①"),
  (u"★全部保存し直す：始めに読んだ写しに台帳を入れ直す（届いた写真が消える）",
   u'''        const rec = await draftRecNow(byNo[no]);''', u'''        const rec = byNo[no];''', TG, "genba", u"③"),
  (u"★下書きを読み直さない（始めに読んだ写しを返す）",
   u'''  try{ const r = await idbGet(rec.key); if(r && r.model) return r; }catch(_){}''', u'''''', TG, "genba", u"③"),
  (u"★全部保存し直す：書く下書きを管理番号の文字で引き直す（全角の下書きが古い写しのまま書かれる）",
   u'''      for(const k of Object.keys(byNo)) byNo[k] = await draftRecNow(byNo[k]);''',
   u'''      (await idbGetAll() || []).forEach(r => { const k = String((r && r.mgmt) || "").trim(); if(k) byNo[k] = r; });''', TG, "genba", u"③b"),
  # ======== 現場入力：引き継ぎ・台帳の取り込み・写真の取り込み ========
  (u"★引き継ぎ：確かめの窓より前に読んだ写しに印を入れて書き戻す（届いた写真が消える）",
   u'''    const rec = isOpen ? byNo[it.no] : await draftRecNow(byNo[it.no]);''', u'''    const rec = byNo[it.no];''', TG, "genba", u"⑤"),
  (u"★受付台帳の取り込み：始めに読んだ写しに入れて書き戻す（届いた写真が消える）",
   u'''    const rec = await draftRecNow(rec0);''', u'''    const rec = rec0;''', TG, "genba", u"⑥"),
  (u"★写真の取り込みの最後の書き込みで、下書きにしか無い写真を足さない（開き直して足した写真が消える）",
   u'''      mergePhotosInto(m.chosho_photos, prev.model.chosho_photos);''', u'''''', TG, "genba", u"⑦"),
  (u"★写真の取り込みの最後の書き込みを、管理番号のキーへ書く（別の戸別の下書きを置き換える）",
   u'''    const key = m._lastDraftKey ? draftKeyNow(m._lastDraftKey)
      : (m.chosho_mgmt_no ? ("no:"+m.chosho_mgmt_no) : (m._draftId || (m._draftId="tmp:"+Date.now())));''',
   u'''    const key = (m.chosho_mgmt_no ? ("no:"+m.chosho_mgmt_no) : (m._draftId || (m._draftId="tmp:"+Date.now())));''', TG, "genba", u"⑧"),
  (u"★特別記録を閉じたあとでも描き直そうとする（写真の読み終わりで止まる）",
   u'''     描こうとすると、閉じた記録を読もうとして止まっていた。 */
  if(!r) return;
''', u'''     描こうとすると、閉じた記録を読もうとして止まっていた。 */
''', TG, "genba", u"⑨"),
  (u"★下書きのキーを移した先を引かない（番号を直した写しに写真が届かず、誰にも見えない下書きを作る）",
   u'''  for(let i = 0; k && mv.has(k) && i < 50; i++) k = mv.get(k);''', u'''''', TG, "genba", u"⑩"),
  (u"★下書きのキーを移した先を覚えない（開き直して置き直した下書きに写真が届かない）",
   u'''      draftMoves().set(M._lastDraftKey, key); draftMoves().delete(key); }   // 取り込み中の写真の行き先（版178）''',
   u'''      }''', TG, "genba", u"⑩b"),
  (u"★開いている戸別かどうかを管理番号だけで見る（番号の無い新しい戸別に番号を入れた写しへ届かない）",
   u'''  if(mk ? !!(M && M._lastDraftKey === mk) : !!(a && a === b)){   // 同じ戸別を開き直した''',
   u'''  if(!!(a && a === b)){''', TG, "genba", u"⑪"),
  (u"★開き直した画面へ、取り込みの写真をみな足す（画面で消した写真が戻る）",
   u'''    mergePhotosInto(M.chosho_photos, Array.isArray(added) ? added : model.chosho_photos);''',
   u'''    mergePhotosInto(M.chosho_photos, model.chosho_photos);''', TG, "genba", u"⑫b"),
  (u"★写真の取り込みで、下書きに足さずに取り込みの戸別で書き直す（開き直して消した写真が戻る）",
   u'''    if(Array.isArray(added) && prev && prev.model){''', u'''    if(false){''', TG, "genba", u"⑫"),
  (u"★写真の取り込みで、取り込みの戸別で書き直す（開き直して直した備考・保存の印が戻る）",
   u'''    if(Array.isArray(added) && prev && prev.model){''', u'''    if(false){''', TG, "genba", u"⑬"),
  (u"★写真の取り込みで、取り込みの戸別で書き直す（受付台帳で直した名前が戻る）",
   u'''    if(Array.isArray(added) && prev && prev.model){''', u'''    if(false){''', TG, "genba", u"⑭"),
  (u"★写真の取り込みで、版を戻す（ファイルに入っていない写真が保存済みに見える）",
   u'''      pm._rev = Math.max(pm._rev|0, prev.rev|0, m._rev|0) + 1;       // 版は戻さない（ファイルに入っていない＝まとめて保存の対象）''',
   u'''      pm._rev = (m._rev|0) + 1;''', TG, "genba", u"⑬"),
  (u"★取り込みが2つ重なったとき、読んで足して書くのを1つずつにしない（片方の写真が消える）",
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined));''',
   u'''  return await persistModel(model, Array.isArray(added) ? added : undefined);''', TG, "genba", u"⑮"),
  (u"★取り込みが2つ重なったとき（開き直した写しから始めた取り込み）、1つずつにしない（片方の写真が消える）",
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined));''',
   u'''  return await persistModel(model, Array.isArray(added) ? added : undefined);''', TG, "genba", u"⑮b"),
  (u"★取り込みが覚えている下書きのキーの、移った先を引かない（開いている写しに届かない）",
   u'''  const mk = model._lastDraftKey ? draftKeyNow(model._lastDraftKey) : "";''',
   u'''  const mk = model._lastDraftKey || "";''', TG, "genba", u"⑩"),
  (u"★下書きに入れた写真を、まだ入れていない写真として持ち越す（画面で消した写真が戻る）",
   u'''      try{ if(await photoKeepInto(model, pending)) pending=[]; }catch(_){}''',
   u'''      try{ await photoKeepInto(model, pending); }catch(_){}''', TG, "genba", u"⑫b"),
  (u"★引き継ぎで新しい印が無いとき、行の控えを待たずに書く（2つ目からの行が残らない）",
   u'''      await flowShareItemsApply(items, byNo, openNo);''',
   u'''      flowShareItemsApply(items, byNo, openNo);''', TG, "genba", u"⑯"),
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
