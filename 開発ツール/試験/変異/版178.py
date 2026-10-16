# -*- coding: utf-8 -*-
# 版178 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン・現場入力）
#   ・メイン：物件を開いていて、ファイルのつながっていない戸別に写真を足して「物件に保存」すると、戸別ファイルに
#     縮小版が書かれていた直し。縮小版は物件の保存だけに使い、戸別ファイルにはいつも元の写真を書く。
#     見直しで見つかった道（最新を取り込む・開き直す・まとめる・💾 反映のあとの保存・📄 の行・番号の付け替え・
#     台帳で作った行・画面に入れなかった写真・「小さい写真」の知らせ）も、写真を減らさないように直した。
#   ・現場入力：まとめて保存・全部保存し直す・引き継ぎ・受付台帳の取り込みで、始めに読んだ写しで下書きを書き戻して
#     途中で届いた写真を消していた直し。写真の取り込みの最後の書き込みで、開き直した戸別・別の戸別の下書きを上書きしない。
#     特別記録の写真の取り込みも、取り込みを始めた記録を丸ごと書かない（端末の記録を読み直して、新しく読んだ写真だけを足す）。
#     特別記録の「保存」も、書き出しているあいだに中身が変わったら「保存済」にしない・印を付けるときに記録を丸ごと書かない。
#     特別記録の物は「見た」写真を覚え、書く前に端末の記録のまだ見ていない写真を足す（どの書き込みでも写真を消さない）。
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
   u'''    rowSeePhotos(row, ph || [], true);                              // このファイルの写真を見せる（版178）
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
   u'''      if(false) return;''', TM, "main", u"⑩"),   # 2回目の見直しで、⑤b は「見せた写真」で先にふるわれるようになった（⑩ のファイルが付いているだけの行で見る）
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
   u'''      if(o.thumb != null){ if(o.thumb !== p.dataUri || o.dataUri === p.dataUri) return p; }   // ほかの端末が直した写真は、そのまま''',
   u'''      if(o.thumb != null){ if(o.dataUri === p.dataUri) return p; }''', TM, "main", u"⑰"),
  (u"★縮小版を覚えているのに大きさで比べる（元の写真のほうが短い PNG の図・画面写しを、縮小版のまま残す）",
   u'''      if(o.thumb != null){ if(o.thumb !== p.dataUri || o.dataUri === p.dataUri) return p; }   // ほかの端末が直した写真は、そのまま''',
   u'''      if(o.thumb != null){ if(o.thumb !== p.dataUri || !(String(o.dataUri).length > String(p.dataUri).length)) return p; }''', TM, "main", u"⑰b"),
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
   u'''    if(!unknown.length && (real.length || sameName)) return "";''', u'''    return "";''', TM, "main", u"⑯a"),
  (u"★写真の無いほかのお宅のファイル（番号の打ち間違い）に、聞かずにこのお宅の中身を書いて、元のファイルを消す",
   u'''    if(!unknown.length && (real.length || sameName)) return "";''', u'''    if(!unknown.length) return "";''', TM, "main", u"⑯f"),
  (u"★写真の無いファイルでも、同じお宅（名前が同じ）なら聞かずに合わせて書く、をしない",
   u'''    if(!unknown.length && (real.length || sameName)) return "";''', u'''    if(!unknown.length && real.length) return "";''', TM, "main", u"⑯g"),
  (u"★住所が同じなら同じお宅とみなす（アパートの別の世帯のファイルに、聞かずに書く）",
   u'''    const sameName = !!(nm(tj.chosho_cust_name) && nm(tj.chosho_cust_name) === nm(d.chosho_cust_name));''',
   u'''    const sameName = !!((nm(tj.chosho_cust_name) && nm(tj.chosho_cust_name) === nm(d.chosho_cust_name)) || (nm(tj.chosho_cust_addr) && nm(tj.chosho_cust_addr) === nm(d.chosho_cust_addr)));''', TM, "main", u"⑯j"),
  (u"★同じお宅か聞いて「キャンセル」でも書く",
   u'''      if(ok) return "";''', u'''      return "";''', TM, "main", u"⑯h"),
  (u"★まとめて書いているとき（📥・諸経費のそろえ直し）にも、同じお宅かを聞く（聞けないのに書く）",
   u'''      if(_indivWriteNotShown && !(sj && no2 && toHalfWidthAn(String(sj.chosho_mgmt_no || "")).trim().toUpperCase() === no2.toUpperCase())){''',
   u'''      if(false){''', TM, "main", u"⑯i"),
  (u"★まとめて書いているとき、同じ管理番号のファイルが2つあると「同じお宅ですか」と聞く（聞けないのに、OK で別のファイルへ書く）",
   u'''      if(!_indivWriteNotShown){   // まとめて書いているとき（📥・諸経費のそろえ直し）は聞かない＝下で断る（版178）''',
   u'''      if(true){''', TM, "main", u"⑯k"),
  (u"★まとめて書いているとき、同じ管理番号のファイルが2つあっても 🧩 で1つにする案内を出さない",
   u'''      if(_indivWriteNotShown && !(sj && no2 && toHalfWidthAn(String(sj.chosho_mgmt_no || "")).trim().toUpperCase() === no2.toUpperCase())){''',
   u'''      if(_indivWriteNotShown){''', TM, "main", u"⑯k"),
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
  # ★付いているファイルへ書く★ 4回目の見直しで「工事フォルダの中の 管理番号.json を探す」が入り、㉑a・b・c（同じ名前のファイル）は
  #  ここを壊しても探して同じファイルへ行く（写真は守られる）。名前の違う付いたファイル（㉑d：Android の名前）で見る。
  (u"★ファイルが付いている行でも、物件の覚えている名前で探す（名前の違う付いたファイルを見ず、同じ番号のファイルをもう1つ作って縮小版を書く）",
   u'''  const att = !!(row._dir && row._name && !row._detached && row.fileHandle);''', u'''  const att = false;''', TM, "main", u"㉑d"),
  (u"★名前をそろえたあと、行のファイルを付け替えない（2回目の保存が古い名前へ行く）",
   u'''    row._name = relpath; row.fileHandle = fh;
    let rp = null;''',
   u'''    let rp = null;''', TM, "main", u"㉑d"),
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
   u'''      rowSeePhotos(target, (d && d.chosho_photos) || [], true); }    // このファイルの写真を見せる（版178）''',
   u'''      }''', TM, "main", u"㉓e"),
  (u"★一度開いた行（写真を持っている）を開き直したとき、見せた写真を覚えない",
   u'''    else rowSeePhotos(target, d && d.chosho_photos);                                                         // 行の写真を見せる（版178）''',
   u'''''', TM, "main", u"㉓g"),
  (u"★図面のある物件の行（縮小版の印が外れた）を、元のファイルへそのまま上書きする",
   u'''                      && (target._fromProject || target.data.chosho_photos_thumb));''',
   u'''                      && (target.data.chosho_photos_thumb));''', TM, "main", u"⑭d"),
  (u"★持ち越すとき、縮小版を覚えていない写真は元に戻さない（開き直したあと縮小版が戸別ファイルに書かれる）",
   u'''      else if(!(String(o.dataUri).length > String(p.dataUri).length)                     // 縮小版を覚えていない：元の写真（縮小版より大きい）だけ。''',
   u'''      else if(true''', TM, "main", u"⑫d"),
  (u"★縮小版を覚えていないとき、元の写真が PNG で作り直した写真が JPEG（縮小版）でも、大きさだけで決める（短い PNG の図を縮小版のまま残す）",
   u'''              && !(!/^data:image\\/jpeg/i.test(String(o.dataUri)) && /^data:image\\/jpeg/i.test(String(p.dataUri)))) return p;''',
   u'''              ) return p;''', TM, "main", u"⑫e"),
  # ======== メイン：3回目の見直しの直し ========
  (u"★名前の大文字・小文字だけ違う管理番号に直すと、書いたファイルを「古い名前」として消す（Windows・Mac で写真ごと無くなる）",
   u'''  if(legacyToRemove && nameKey(relpath) === nameKey(legacyToRemove)){ relpath = oldRel; legacyToRemove = ""; }''', u'''''', TM, "main", u"㉒"),
  (u"★付いているファイルが無くなっていても（ほかのPCでまとめた）、同じフォルダの「管理番号.json」に付け直さない（いつまでも書けない）",
   u'''    try { await row.fileHandle.getFile(); } catch(e){ gone = !!(e && e.name === "NotFoundError"); }''', u'''''', TM, "main", u"㊸a"),
  (u"★付いているファイルが無く、付け直す先も無いのに書く（同じ番号のファイルを作り、縮小版を書く）",
   u'''      if(!nh){''', u'''      if(false){''', TM, "main", u"㊸b"),
  (u"★暗号の戸別を 💾 上書き保存 したあと、行の封筒を新しいものにしない（あとで「鍵が違う」で書けない）",
   u'''        _editingRow.envelope = env;''', u'''''', TM, "main", u"㉕c"),
  (u"★写真IDの無い名前だけの枠を、見せた写真として覚えない（画面で消した枠が戻る）",
   u'''    else if(p && String(p.label || "").trim()) s.add("l:" + String(p.label).trim());   // 名前だけの枠（写真IDなし）''', u'''''', TM, "main", u"㊹"),
  (u"★物件の行を作り直したとき、見せた写真の覚えを持ち越さない（画面で消した写真が上書き保存で消えない）",
   u'''    if(keepSeen) rowsSeenRestore(_listRows, keepSeen);''', u'''''', TM, "main", u"㊺"),
  # 「ファイルを読めないまま開く（_photosPartial）」は6回目の見直しで外した（開かずに知らせる）。前の ㊻a・㊻c・㊻d の件は外し、下の件に替えた。
  (u"★図面のある戸別を、写真のあるファイルを読めないまま開く（写真の出ない画面。足した写真が物件に入らない）",
   u'''      if(!fresh && rr.why !== "none"){ editorUnreadableRefuse(target, rr.why); return false; }   // 写真のあるファイルを読めないまま開かない（版178）''',
   u'''''', TM, "main", u"㊻a,㊻d,㊻f"),
  (u"★図面のまだ無い戸別を、写真のあるファイルを読めないまま開く",
   u'''    if(!fr && rr.why !== "none"){ editorUnreadableRefuse(row, rr.why); return null; }   // 写真のあるファイルを読めないまま開かない（版178）''',
   u'''''', TM, "main", u"㊻c,㊻d"),
  (u"★図面のまだ無い戸別を開けなかったのに、そのまま写真なしで開く",
   u'''    if(preset === null){ _asbEdited = asbWas; return; }   // ファイルを読めず開かなかった＝いまの画面のまま（版178）''',
   u'''    if(false){ _asbEdited = asbWas; return; }''', TM, "main", u"㊻c,㊻f"),
  (u"★図面のある戸別を開けなかったのに、いま開いている画面にその戸別の備考などを入れる",
   u'''    if((await listLoadRow(row)) === false){ _asbEdited = asbWas; return; }   // ファイルを読めず開かなかった＝いまの画面のまま（版178）''',
   u'''    await listLoadRow(row);''', TM, "main", u"㊻f"),
  (u"★図面のある戸別を開けなかったのに、いま開いている戸別の石綿を直した印を消す",
   u'''    if((await listLoadRow(row)) === false){ _asbEdited = asbWas; return; }   // ファイルを読めず開かなかった＝いまの画面のまま（版178）''',
   u'''    if((await listLoadRow(row)) === false){ return; }''', TM, "main", u"㊻f"),
  (u"★図面のまだ無い戸別を開けなかったのに、いま開いている戸別の石綿を直した印を消す",
   u'''    if(preset === null){ _asbEdited = asbWas; return; }   // ファイルを読めず開かなかった＝いまの画面のまま（版178）''',
   u'''    if(preset === null){ return; }''', TM, "main", u"㊻f"),
  (u"★開いている戸別へ 📥 したあと読み直せないと、行の写真（取り込んだ分）だけを画面に出す（戻ると行・物件がその分だけになる）",
   u'''        let cur = null; try { cur = collectState().chosho_photos; } catch(_){}''',
   u'''        let cur = null;''', TM, "main", u"㊻e"),
  (u"★💾 上書き保存で元ファイルを読み直せなくても書く（開いたあとで現場が足した写真が消える）",
   u'''    if(!readOk && readWhy !== "empty"){''', u'''    if(false){''', TM, "main", u"㊼"),
  (u"★💾 上書き保存の元ファイルが無くなっていても（ほかのPCが名前を変えた）、同じフォルダの「管理番号.json」に付け直さない（いつまでも書けない）",
   u'''      if(rr.why === "notfound" && (await overwriteReattach(origin, _editingRow, fmt)))''', u'''      if(false)''', TM, "main", u"㊼b"),
  (u"★元ファイルが壊れているとき、この画面の中身で書き直すかを聞かない（いつまでも書けない）",
   u'''      if(readWhy === "broken"){''', u'''      if(false){''', TM, "main", u"㊼c"),
  (u"★開いている戸別のファイルの名前を付け替えても、💾 上書き保存 の行き先を付け替えない（次が無い名前へ行く）",
   u'''  if(legacyRemoved && photoSrcFh && _loadedOrigin && _loadedOrigin.fileHandle && (await indivSameFile(_loadedOrigin.fileHandle, photoSrcFh))){''',
   u'''  if(false){''', TM, "main", u"㊼d"),
  (u"★開いている戸別へ 📥 現場取込 したあと、見せた写真の覚えを入れ直さない（ファイルにある写真が保存で消える）",
   u'''      if(fr && typeof fr === "object") shown = Object.assign({}, row.data, { chosho_photos: slimRowWithMemPhotos(fr, row).chosho_photos });''',
   u'''''', TM, "main", u"㊽"),
  (u"★開いている戸別へ 📥 したあと、見せた写真の覚えを入れ直す（前に画面で消した写真が、次の保存で戻る）",
   u'''    if(row.fileType === "plain") rowSeePhotos(row, (shown || {}).chosho_photos, wasSlim);''',
   u'''    if(row.fileType === "plain") rowSeePhotos(row, (shown || {}).chosho_photos, true);''', TM, "main", u"㊽b"),
  (u"★常駐させない行に 📥 して戸別ファイルへ書けても、行を「ファイルから読む」に戻さない（一覧・物件・工事調書に現場の写真しか出ない）",
   u'''  if(wasSlim && row.fileType === "plain" && row.fileHandle && /個別JSONも更新しました/.test(String(note || ""))){''',
   u'''  if(false){''', TM, "main", u"㊽c"),
  (u"★常駐させない行に取り込んだ写真を、開いたとき画面に出さない（開いて保存すると取り込んだ写真が消える）",
   u'''        d = slimRowWithMemPhotos(d, target);''', u'''''', TM, "main", u"㊾a"),
  (u"★図面のまだ無い戸別でも、取り込んだ写真を開いたとき画面に出さない",
   u'''    if(fr) ph = slimRowWithMemPhotos(fr, row).chosho_photos;        // ファイルの写真＋行にだけある写真（取り込んだ分。版178）''',
   u'''    if(fr) ph = fr.chosho_photos;''', TM, "main", u"㊾b"),
  (u"★縮小版を作っているあいだに行の写真が変わっても、縮小版を付ける（足した写真が物件に入らない）",
   u'''  if(now !== src0 && !photosSameSet(now, src0)){ row._thumbsRetry = true; return; }''', u'''''', TM, "main", u"㊿"),
  (u"★縮小版を付けなかった行を、同じ回で作り直さない（写真なしで物件に保存する）",
   u'''      const again = (_listRows || []).filter(r => r && r.fileType === "plain"
        && (r._thumbsRetry || (targets.indexOf(r) >= 0 && !Array.isArray(r._thumbs))));''', u'''      const again = [];''', TM, "main", u"㊿"),
  (u"★画面から戻っただけ（写真は同じ）でも縮小版を捨てる（直して戻るたびに写真なしで物件に保存し、まとめると写真が全部消える）",
   u'''  if(now !== src0 && !photosSameSet(now, src0)){ row._thumbsRetry = true; return; }''', u'''  if(now !== src0){ row._thumbsRetry = true; return; }''', TM, "main", u"㊿b"),
  (u"★作り直した行に写真の配列が無い（縮小版が物件に入っていない）のに枚数があるとき、この端末の元の写真を戻さない",
   u'''    if(!Array.isArray(r.data.chosho_photos)){
      if(!(Number(r.data.chosho_photo_count) > 0 || r._photoCount > 0)) return;''',
   u'''    if(!Array.isArray(r.data.chosho_photos)){
      return;''', TM, "main", u"㊿c"),
  (u"★💾 反映で別のフォルダを選んで読み直したあと、物件が覚える名前を工事フォルダからの道のりにそろえない（次に縮小版のファイルを作る）",
   u'''  await rowsFileFromProjDir(_listRows);   // 物件が覚える名前は、工事フォルダから見た道のりにそろえる（版178）''',
   u'''''', TM, "main", u"㊸e"),
  # 「物件の覚えている名前で見つからないとき、工事フォルダの中の 管理番号.json を探す」は5回目の見直しで外した
  #  （控えのフォルダを数える・現場のファイルを確かめずに上書きする）。そのため ㊸f の件も外した。
  (u"★付けたファイルの道のりを、付けたときのフォルダから見たまま覚える（次に工事フォルダへ縮小版のファイルを作る）",
   u'''    if(Array.isArray(rp) && rp.length) row.file = rp.join("/");''', u'''    if(false) row.file = rp.join("/");''', TM, "main", u"㊸d"),
  # 「物件から作った暗号の行を、付いているファイルの暗号の部分で開く」は5回目の見直しで外した（まとめて復号のあと古い図面で開いた）。㉕d の件も外した。
  (u"★開いている戸別へ 📥 したあと、元ファイルの行き先を戻さない（「💾 上書き保存」が押せないまま）",
   u'''    if(keepOrigin && keepOrigin.fileHandle && !_loadedOrigin) _loadedOrigin = keepOrigin;''', u'''''', TM, "main", u"㊽b"),
  # 「読めないまま開いた戸別で、写真の枚数を画面の枚数で上書きする」の件（㊻d）は、読めないまま開かなくなったので外した（6回目の見直し）。
  (u"★💾 反映 で別のフォルダを選んだとき、工事フォルダをまだ掴んでいないと、覚えている工事フォルダで道のりを引かない",
   u'''  if(!pd && _currentProject){ try { pd = await projHandleGet(_currentProject.id + ":dir"); } catch(_){ pd = null; } }   // 覚えている工事フォルダ（道のりを引くだけ）''',
   u'''''', TM, "main", u"㊸g"),
  # ======== 現場入力：3回目の見直しの直し ========
  (u"★下書きの引っ越しの覚えを、別の下書きでも引く（別のお宅の下書きに写真が入る）",
   u'''    if(uid && e.uid && e.uid !== uid) break;           // 別の下書きの引っ越し＝引かない''', u'''''', TG, "genba", u"⑳"),
  (u"★下書きを書いたキーの、前の引っ越しの覚えを捨てない（別のお宅の下書きに写真が入る）",
   u'''      if(!e || !e.uid || e.uid === M._uid) draftMoves().delete(key); }   // ★別の下書きの引っ越しの覚えは残す（捨てると、その下書きの写真が迷子になる）''',
   u'''      }''', TG, "genba", u"⑳b"),
  (u"★別の下書きの引っ越しの覚えまで捨てる（番号を直した戸別の写真が、前の番号の別の下書きへ行く）",
   u'''      if(!e || !e.uid || e.uid === M._uid) draftMoves().delete(key); }   // ★別の下書きの引っ越しの覚えは残す（捨てると、その下書きの写真が迷子になる）''',
   u'''      draftMoves().delete(key); }''', TG, "genba", u"㉔"),
  (u"★同じ管理番号のファイルを読み込んだとき、下書きを見分ける印を引き継がない（取り込み中の残りの写真が別の下書きへ行き、保存済に見える）",
   u'''    if(M._uid) m._uid = M._uid;   // 同じ下書きの印（版178。替わると、取り込み中の残りの写真が別の下書きへ行き、保存済に見えてしまう）''',
   u'''''', TG, "genba", u"㉓"),
  (u"★届け先の下書きが別のものに替わっていたとき、黙って別の下書きに入れる（測定値のCSV）",
   u'''  await persistMovedNotice(tag);                // 別の下書きに入れたときは窓で知らせる（版178）''',
   u'''''', TG, "genba", u"㉑"),
  (u"★届け先の下書きが別のものに替わっていたとき、黙って別の下書きに入れる（写真の取り込み）",
   u'''  if(fail) toast(fail+"枚は読み込めませんでした（別の写真でお試しください）");   // 大事な知らせを最後に
  await persistMovedNotice(tag);''',
   u'''  if(fail) toast(fail+"枚は読み込めませんでした（別の写真でお試しください）");   // 大事な知らせを最後に''', TG, "genba", u"㉕"),
  # ======== 現場入力：6回目の見直しの直し（知らせの窓は横取りしない・その取り込みの最後に） ========
  (u"★取り込みの知らせが、出ている窓（保存の「このまま保存しますか？」など）を横取りする（保存が「保存中…」のまま止まる）",
   u'''    if(!(modal && modal.classList.contains("open")) && !_saving && !uiDialog._notice){''',
   u'''    if(!_saving && !uiDialog._notice){''', TG, "genba", u"㉖"),
  (u"★保存しているあいだにも、取り込みの知らせを出す",
   u'''    if(!(modal && modal.classList.contains("open")) && !_saving && !uiDialog._notice){''',
   u'''    if(!(modal && modal.classList.contains("open")) && !uiDialog._notice){''', TG, "genba", u"㉖"),
  (u"★知らせが出ているあいだに来たほかの窓が、知らせを上書きする（その窓の答えも、知らせの終わりも来ない）",
   u'''  if(uiDialog._notice) return uiDialog._notice.then(() => uiDialog(msg, isConfirm, okLabel));''',
   u'''''', TG, "genba", u"㉗"),
  (u"★ほかの取り込みの終わりに、別の取り込みの知らせを出す（残りの写真が届く前に保存させる）",
   u'''  const mv = all.filter(x => x.tag === (tag || null));     // この取り込みの分だけ（ほかの取り込みの分は、その取り込みの最後に）''',
   u'''  const mv = all;''', TG, "genba", u"㉘"),
  (u"★写真の取り込みで、別の下書きに入れた覚えに取り込みの印を付けない（知らせが出ない）",
   u'''      try{ if(await photoKeepInto(model, pending, tag)) pending=[]; }catch(_){}''',
   u'''      try{ if(await photoKeepInto(model, pending)) pending=[]; }catch(_){}''', TG, "genba", u"㉕,㉘"),
  (u"★写真の取り込みで、取り込みの印を下書きへ書くところまで渡さない（知らせが出ない）",
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined, tag));''',
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined));''', TG, "genba", u"㉕,㉘"),
  (u"★測定値の CSV で、別の下書きに入れた覚えに取り込みの印を付けない（知らせが出ない）",
   u'''  else { await persistModel(model, undefined, tag); }   // 別戸別へ切替済み→読込元を直接確定保存（混入/喪失防止）''',
   u'''  else { await persistModel(model); }''', TG, "genba", u"㉑"),
  (u"★取り込みの書き込みで、別の下書き（印が違う）を置き換える",
   u'''    if(prev && prev.model && !draftSameUid(prev.model, m)){''', u'''    if(false){''', TG, "genba", u"㉑"),
  (u"★書いているあいだに開き直された写しに、書いた写真を足さない（写しを控えると写真が消える）",
   u'''      if(M && M !== m && M._lastDraftKey === key && draftSameUid(M, pm) && Array.isArray(M.chosho_photos)''',
   u'''      if(false && M''', TG, "genba", u"㉒"),
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
  (u"★測定値のCSVの取り込みの書き込みで、下書きにしか無い写真を足さない（開き直して足した写真が消える）",
   u'''      mergePhotosInto(m.chosho_photos, prev.model.chosho_photos);''', u'''''', TG, "genba", u"⑦b"),
  (u"★写真の取り込みの最後の書き込みを、管理番号のキーへ書く（別の戸別の下書きを置き換える）",
   u'''    let key = m._lastDraftKey ? draftKeyNow(m._lastDraftKey, m._uid)
      : (m.chosho_mgmt_no ? ("no:"+m.chosho_mgmt_no) : (m._draftId || (m._draftId="tmp:"+Date.now())));''',
   u'''    let key = (m.chosho_mgmt_no ? ("no:"+m.chosho_mgmt_no) : (m._draftId || (m._draftId="tmp:"+Date.now())));''', TG, "genba", u"⑧"),
  (u"★特別記録を閉じたあとでも描き直そうとする（写真の読み終わりで止まる）",
   u'''     描こうとすると、閉じた記録を読もうとして止まっていた。 */
  if(!r) return;
''', u'''     描こうとすると、閉じた記録を読もうとして止まっていた。 */
''', TG, "genba", u"⑨"),
  (u"★下書きのキーを移した先を引かない（番号を直した写しに写真が届かず、誰にも見えない下書きを作る）",
   u'''    k = e.to;''', u'''    break;''', TG, "genba", u"⑩"),
  (u"★下書きのキーを移した先を覚えない（開き直して置き直した下書きに写真が届かない）",
   u'''      draftMoves().set(M._lastDraftKey, { to: key, uid: M._uid }); }   // 取り込み中の写真の行き先（版178）''',
   u'''      }''', TG, "genba", u"⑩b"),
  # 「開いている戸別かどうかを管理番号だけで見る」は外した（3回目の見直し）。persistModel が自分で移った先を引き、
  #  開き直した画面の写しにも足すようになったので、photoKeepInto の見分けを壊しても同じ結果（⑪ は緑のまま＝写真は届く）。
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
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined, tag));''',
   u'''  return await persistModel(model, Array.isArray(added) ? added : undefined, tag);''', TG, "genba", u"⑮"),
  (u"★取り込みが2つ重なったとき（開き直した写しから始めた取り込み）、1つずつにしない（片方の写真が消える）",
   u'''  return await photoKeepQueue(() => persistModel(model, Array.isArray(added) ? added : undefined, tag));''',
   u'''  return await persistModel(model, Array.isArray(added) ? added : undefined, tag);''', TG, "genba", u"⑮b"),
  # 「取り込みが覚えている下書きのキーの、移った先を引かない」も同じ理由で外した（persistModel が引く）。
  (u"★下書きに入れた写真を、まだ入れていない写真として持ち越す（画面で消した写真が戻る）",
   u'''      try{ if(await photoKeepInto(model, pending, tag)) pending=[]; }catch(_){}''',
   u'''      try{ await photoKeepInto(model, pending, tag); }catch(_){}''', TG, "genba", u"⑫b"),
  (u"★引き継ぎで新しい印が無いとき、行の控えを待たずに書く（2つ目からの行が残らない）",
   u'''      await flowShareItemsApply(items, byNo, openNo);''',
   u'''      flowShareItemsApply(items, byNo, openNo);''', TG, "genba", u"⑯"),
  # ======== メイン：7回目の直し（物件の覚えている名前が古い戸別を、縮小版のファイルにしない） ========
  # ======== メイン：物件の覚えている名前が古い戸別を、縮小版のファイルにしない（7回目の見直し） ========
  (u"★古い名前で元のファイルが見つからないとき、工事フォルダの中の元の写真を使わない（縮小版のファイルを作る）",
   u'''  if(created && !photoSrcFh && row.fileType === "plain" && ((row.data && row.data.chosho_photos_thumb) || row._fromProject)){''',
   u'''  if(false){''', TM, "main", u"㊸ha"),
  (u"★見つけた元の写真を、縮小版の代わりに使わない（📥 現場取込）",
   u'''    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))
      ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;''',
   u'''    return p;''', TM, "main", u"㊸hc"),
  (u"★見つけた元の写真を、縮小版の代わりに使わない（協力会社諸経費のそろえ直し）",
   u'''    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))
      ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;''',
   u'''    return p;''', TM, "main", u"㊸hd"),
  (u"★同じ管理番号のファイルを読めなかったことを覚えない（行の写真がみな縮小版でも、縮小版のファイルを作る）",
   u'''    if(!fb.read){ unread.push({ path: it.path, file: true }); continue; }''',
   u'''    if(!fb.read) continue;''', TM, "main", u"㊸ia"),
  (u"★同じ管理番号のファイルを読めなかったことを覚えない（途中で切れた Android の名前のファイル）",
   u'''    if(!fb.read){ unread.push({ path: it.path, file: true }); continue; }''',
   u'''    if(!fb.read) continue;''', TM, "main", u"㊸o"),
  (u"★開けないフォルダを覚えない（本当のファイルのある リスト を開けなくても、縮小版のファイルを作る）",
   u'''    } catch(_){ unread.push({ path: pre, file: false }); }''',
   u'''    } catch(_){}''', TM, "main", u"㊸ib"),
  (u"★開けないフォルダが1つでもあると、探すのをやめて断る（関係の無いフォルダ1つで作れない・📁 の読み込みと違う）",
   u'''  await walk(dir, "");''',
   u'''  await walk(dir, ""); if(unread.length) return { ok: false, walked: true, file: false, why: "工事フォルダの中を見られませんでした" };''', TM, "main", u"㊸id"),
  (u"★読めないファイルが1つでもあると、読めたファイルの元の写真も使わない（切れた Android の名前のファイルで、G が小さいまま）",
   u'''    if(!fb.read){ unread.push({ path: it.path, file: true }); continue; }''',
   u'''    if(!fb.read) return { ok: false, walked: true, file: true, why: "工事フォルダの中の " + it.path + " を読めませんでした" };''', TM, "main", u"㊸n"),
  (u"★読めなかった所を覚えていても使わない（確かめられないまま縮小版のファイルを作る）",
   u'''  if(unread.length && obj.chosho_photos.some(small)){''',
   u'''  if(false){''', TM, "main", u"㊸ia"),
  (u"★元の写真がみな見つかっても、読めなかった所があると「小さいまま入れた」とする",
   u'''  if(unread.length && obj.chosho_photos.some(small)){''',
   u'''  if(unread.length){''', TM, "main", u"㊸id"),
  (u"★確かめられなかったのに、作らなかったことを知らせない",
   u'''        return "\\n\\u26a0 戸別の個別JSONは作っていません：" + up.why + "。\\n"''',
   u'''        return "" + "\\n"''', TM, "main", u"㊸ia"),
  (u"★読めないファイルと開けないフォルダで、知らせる直し方を取り違える",
   u'''             + (up.file''',
   u'''             + (!up.file''', TM, "main", u"㊸o"),
  (u"★行に元の大きさの写真があっても断る（画面で足した P の原寸が、どこにも残らない）",
   u'''      if(!orig){''',
   u'''      if(true){''', TM, "main", u"㊸n"),
  (u"★行の写真がみな縮小版でも断らない（確かめられないまま縮小版のファイルを作る）",
   u'''      if(!orig){''',
   u'''      if(false){''', TM, "main", u"㊸o"),
  (u"★縮小版のまま入れたことを知らせない",
   u'''  renamedNote += sideKeptNote + thumbKeptNote;''',
   u'''  renamedNote += sideKeptNote;''', TM, "main", u"㊸n"),
  (u"★縮小版のまま入れた知らせに ⚠ を付ける（📥 の知らせで、書けた戸別を「書けていません」に数える）",
   u'''      thumbKeptNote = "\\n※ " + up.why''',
   u'''      thumbKeptNote = "\\n\\u26a0 " + up.why''', TM, "main", u"㊸ic"),
  (u"★控えのフォルダ・写真のフォルダまで見に行く（📁 の読み込みと違う）",
   u'''        if(h.kind === "directory"){ if(!scanSkipDirName(name)) await walk(h, pre + name + "/"); }''',
   u'''        if(h.kind === "directory"){ await walk(h, pre + name + "/"); }''', TM, "main", u"㊸j"),
  (u"★付け替える前の番号のファイルを探さない（縮小版のファイルを作る）",
   u'''    const up = await indivThumbOriginals(dir, [mg].concat(/^戸別$/.test(oldNo) ? [] : [oldNo]), contentObj);''',
   u'''    const up = await indivThumbOriginals(dir, [mg], contentObj);''', TM, "main", u"㊸k"),
  (u"★見つけたファイルの写真をみな足す（ほかのお宅の写真が入る）",
   u'''      if(!q || !q.id || !q.dataUri || !need.has(q.id)) return;
      const c = { p: q, from: "file", thumb: false }, b = best.get(q.id);
      best.set(q.id, b ? pickBetterPhoto(b, c) : c);
    });
  }
  obj.chosho_photos = arr.map(p => {
    if(!small(p)) return p;
    const b = best.get(p.id);
    /* 縮小版より大きい・または物件の縮小版でない（PNG の図など＝元の写真）ときに使う（版178） */
    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))
      ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;
  });''',
   u'''      if(!q || !q.id || !q.dataUri) return;
      const c = { p: q, from: "file", thumb: false }, b = best.get(q.id);
      best.set(q.id, b ? pickBetterPhoto(b, c) : c);
    });
  }
  obj.chosho_photos = arr.map(p => {
    if(!small(p)) return p;
    const b = best.get(p.id);
    /* 縮小版より大きい・または物件の縮小版でない（PNG の図など＝元の写真）ときに使う（版178） */
    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))
      ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;
  }).concat(Array.from(best.entries()).filter(([k]) => !arr.some(p => p && p.id === k)).map(([k, b]) => ({ id: k, label: "", dataUri: b.p.dataUri })));''',
   TM, "main", u"㊸k"),
  (u"★名前の通りの「管理番号.json」しか探さない（Android の名前を見落とす）",
   u'''keys.has(key(junkNoFromName(name))))''',
   u'''keys.has(key(name.replace(/\\.json(\\.txt)?$/i, ""))))''', TM, "main", u"㊸l"),
  (u"★縮小版の無い行でも工事フォルダの中を見て回る",
   u'''  if(!arr.some(small)) return { ok: true, walked: false };''',
   u'''''', TM, "main", u"㊸ma"),
  (u"★探す管理番号が無くても見て回る（関係の無いフォルダを開けないだけで、番号の無い戸別のファイルを作らない）",
   u'''  if(!keys.size) return { ok: true, walked: false };''',
   u'''''', TM, "main", u"㊸mb"),
  (u"★同じ写真がいくつもあるとき、pickBetterPhoto でなく長辺の大きいほうを選ぶ（物差しが2つ・撮りっぱなしの重い写真が入る）",
   u'''      best.set(q.id, b ? pickBetterPhoto(b, c) : c);''',
   u'''      best.set(q.id, (b && photoLongEdgeOf(b.p.dataUri) >= photoLongEdgeOf(q.dataUri)) ? b : c);''', TM, "main", u"㊸q"),
  (u"★見つけた写真が縮小版より小さくても置き換える",
   u'''    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))
      ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;''',
   u'''    return b ? Object.assign({}, p, { dataUri: b.p.dataUri }) : p;''', TM, "main", u"㊸q"),
  (u"★見て回っているあいだに届いたファイルを、確かめずに上書きする（現場の写真が消える）",
   u'''      if(now) return "\\n\\u26a0 戸別の個別JSONは書いていません：''',
   u'''      if(false) return "\\n\\u26a0 戸別の個別JSONは書いていません：''', TM, "main", u"㊸p"),
  (u"★見て回ったことを伝えない（届いたファイルを確かめずに上書きする）",
   u'''  return { ok: true, walked: true };''',
   u'''  return { ok: true, walked: false };''', TM, "main", u"㊸p"),
  # ======== メイン：7回目の直し（暗号の物件の行を上書き保存しても写真を残す） ========
  # ======== メイン：暗号の戸別（.hyb）を、写真の出ていない画面から 💾 上書き保存しても写真を残す（7回目の見直し） ========
  (u"★写真の出ていない画面で、元ファイルの写真に足さずに書く（.hyb が画面の写真だけになる）",
   u'''        stateObj.chosho_photos = photosKeepFileOnly(filePh, added);
''', u'''''', TM, "main", u"㉕e"),
  (u"★写真の出ていない画面で、元ファイルをほどかない（ほどけないとして断る・直しが入らない）",
   u'''          if(_editorPhotosStripped){ try { fileDec = await decryptHybrid(fresh, pw); } catch(_){ fileDec = null; } }
''', u'''''', TM, "main", u"㉕e"),
  (u"★元ファイルに暗号の写真があっても、取り出さずに書く（ほどけない .hyb を写真なしで書く）",
   u'''      if(fp && fp.iv && fp.ct){''', u'''      if(false){''', TM, "main", u"㉕g"),
  (u"★元ファイルの写真の部分が壊れている（ほどくと写真が外れる）のに書く",
   u'''        if(!(fileDec && !fileDec._photosStripped)){''', u'''        if(!fileDec){''', TM, "main", u"㉕gbad"),
  (u"★写真の出ている画面でも、元ファイルの写真に足して書く（画面で消した写真が戻る）",
   u'''    if(fmt === "hybrid" && _editorPhotosStripped && readOk){''', u'''    if(fmt === "hybrid" && readOk){''', TM, "main", u"㉕i"),
  (u"★写真の出ていない画面で、画面で足した写真を書かない",
   u'''photosKeepFileOnly(filePh, added);''', u'''photosKeepFileOnly(filePh, []);''', TM, "main", u"㉕enew"),
  (u"★元ファイルの写真が古い形 {before, after} のとき、そのまま使う（A・B が消える）",
   u'''        const filePh = Array.isArray(fileDec.chosho_photos) ? fileDec.chosho_photos : migratePhotosShape(fileDec.chosho_photos);''',
   u'''        const filePh = fileDec.chosho_photos;''', TM, "main", u"㉕eold"),
  (u"★読み直した元ファイルを取っておかない（.hyb の形か確かめられない＝いつも断る）",
   u'''          prev = fresh.plain; fileEnv = fresh;''', u'''          prev = fresh.plain;''', TM, "main", u"㉕e"),
  (u"★先に「写真が失われます」と聞く（前のまま）",
   u'''  // 写真が出ていない画面（写真を剥がした封筒で開いた）は、元ファイルを読み直したあとで、その写真に足して書く（版178。下）
''',
   u'''  if(_editorPhotosStripped){
    if(!confirm("⚠ この戸別の写真は復元できていません（共有物件由来などで剥がれています）。\\n\\nこのまま上書き保存すると、元ファイルに入っていた写真が失われます。\\n\\nそれでも上書きしますか？\\n（写真を残したい場合はキャンセルし、元の個別ファイル(.hyb)から開き直してください）")) return;
  }
''', TM, "main", u"㉕enew"),
  (u"★帯が「写真が失われます」のまま",
   u'''「💾 上書き保存」では、元の写真はそのまま残し、ここで足した写真を足して書きます（ここで写真を消しても、元のファイルからは消えません）。";''',
   u'''このまま上書き保存／再暗号化すると、元ファイルの写真が失われます。写真が必要な場合は元の個別ファイル(.hyb)から開き直してください。";''',
   TM, "main", u"㉕enew"),
  (u"★写真の出ていない画面で、壊れた .hyb をこの画面の中身で書き直すか聞く（OK で写真がみな消える）",
   u'''      if(readWhy === "broken" && fmt === "hybrid" && _editorPhotosStripped){''', u'''      if(false){''', TM, "main", u"㉕o"),
  (u"★付いているファイルが暗号（.hyb）の形でなくても書く（平文の 管理番号.json の写真が消える）",
   u'''      if(detectEncFormat(fileEnv) !== "hybrid"){''', u'''      if(false){''', TM, "main", u"㉕l"),
  (u"★まとめ印刷のあと、写真の出ていない画面の印を戻さない",
   u'''      if(savedStripped){ _editorPhotosStripped = true; showPhotoStrippedBanner(true); }   // 写真の出ていない画面のまま（版178）
''', u'''''', TM, "main", u"㉕k"),
  (u"★まとめ印刷のあと、写真の出ている画面にも「写真が出ていません」の印を立てる（画面で消した写真が戻る）",
   u'''      if(savedStripped){''', u'''      if(true){''', TM, "main", u"㉕kshown"),
  (u"★開いている暗号の戸別へ 📥 したあと、写真の出ていない画面の印を立てない（取り込んだ写真だけで書く）",
   u'''    if(row.fileType === "hybrid" && (wasSlim || keepStripped)){''', u'''    if(false){''', TM, "main", u"㉕j"),
  (u"★📥 の前から写真の出ていない画面だったのを見ない",
   u'''(wasSlim || keepStripped)){''', u'''(wasSlim)){''', TM, "main", u"㉕jstrip"),
  (u"★平文の戸別へ 📥 しても、写真の出ていない画面の印・帯を出す",
   u'''    if(row.fileType === "hybrid" && (wasSlim || keepStripped)){''', u'''    if((wasSlim || keepStripped)){''', TM, "main", u"㉕jplain"),
  (u"★開いている .enc の戸別へ 📥 したあと、上書き保存の行き先を戻す（取り込んだ写真だけで .enc を書く）",
   u'''    if(row.fileType === "full" && wasSlim) _loadedOrigin = null;
''', u'''''', TM, "main", u"㉕n"),
  (u"★開き直すとき、行にだけある写真を画面に出さない（足して一覧へ戻った写真が消える）",
   u'''  full.chosho_photos = ph.slice();''', u'''''', TM, "main", u"㉕m"),
  (u"★開き直したとき、行にだけある写真を行から外す（何もせずに戻ってもう一度開くと消える）",
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = rowPh; // 一覧側は写真を保持しない（行にだけある写真は持ったまま。版178）''',
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = null;''', TM, "main", u"㉕m"),
  # 8回目の見直しの直しで形が変わった：開いても行の「ファイルから読む」（_slim）は開く前のまま（wasSlim）。
  #   壊し方は「開くと、ファイルから読む形に替える」（次に開くと、まだファイルに無い直しをファイルの古い中身で戻す：㉕t）
  (u"★開き直したとき、行をファイルから読む形に替える（見るだけで戻ってもう一度開くと、直した増幅器 1U がファイルの古い 3U に戻る）",
   u'''        target.data = lite; target.unlocked = true; target._slim = wasSlim;
''', u'''        target.data = lite; target.unlocked = true; target._slim = true;
''', TM, "main", u"㉕t"),
  (u"★パスワードを聞いて開き直すとき、行にだけある写真を画面に出さない",
   u'''      const rowPh = hybRowPhotosToShow(full, target);   // 行にだけある写真を画面に出す（版178）
      const lite = Object.assign({}, full); lite.chosho_photos = rowPh;
''', u'''      const rowPh = null;
      const lite = Object.assign({}, full); lite.chosho_photos = rowPh;
''', TM, "main", u"㉕mpw"),
  # 上と同じ（8回目の見直し）：パスワードを聞いて開いたときも、開く前のまま
  (u"★パスワードを聞いて開き直したとき、行をファイルから読む形に替える（次に開くと、直した増幅器 1U がファイルの古い 3U に戻る）",
   u'''      target.data = lite; target.unlocked = true; target._slim = wasSlim;   // 上と同じ（版178）''',
   u'''      target.data = lite; target.unlocked = true; target._slim = true;''', TM, "main", u"㉕tpw"),
  # （8回目の見直し）ファイルからほどいたときも行の写真を出す（ファイルの写真に足す）のが正しい形になった。壊し方は「足さずに置き換える」
  (u"★ファイルからほどいたとき、ファイルの写真を行の写真で置き換える（ファイルの写真が画面から消える）",
   u'''  full.chosho_photos = photosKeepFileOnly(base, ph.filter(p => p && p.dataUri));''',
   u'''  full.chosho_photos = ph.slice();''', TM, "main", u"㉕p"),
  # （8回目の見直し）写真を剥がした封筒で開いたときは、行の写真をいつも出す（当てにしてよい印を見ない）のが正しい形になった
  (u"★写真を剥がした封筒で開いたとき、行の写真を当てにしてよいときだけ出す（印の無い行の写真＝📥 で入れた写真を出さない）",
   u'''  if(full._photosStripped){
''', u'''  if(full._photosStripped){
    if(!target._photosKnown) return null;
''', TM, "main", u"㉕p"),
  (u"★名前だけの枠しか無い行でも、行の写真として出す",
   u'''  if(!Array.isArray(ph) || !ph.some(p => p && p.dataUri)) return null;''', u'''  if(!Array.isArray(ph)) return null;''', TM, "main", u"㉕p"),
  # ======== メイン：7回目の直し（📥で入れた写真だけが物件の写真になるのを直す） ========
  # ======== メイン：📥 で入れた写真だけが物件の写真になる（常駐させない行・戸別ファイルへ書けなかった） ========
  (u"★常駐させない行の物件の縮小版を、行の写真（📥 で入れた分）だけで作る（ファイルを読まない）",
   u'''  if(row._slim && (row.fileHandle || row.srcFile)){
    own = !!(arr && arr.some(p => p && p.dataUri));''',
   u'''  if(false){
    own = !!(arr && arr.some(p => p && p.dataUri));''', TM, "main", u"㊾ch"),
  (u"★常駐させない行の物件の縮小版を、行の写真（📥 で入れた分）だけで作る（まとめで作り直した行も G だけ）",
   u'''  if(row._slim && (row.fileHandle || row.srcFile)){
    own = !!(arr && arr.some(p => p && p.dataUri));''',
   u'''  if(false){
    own = !!(arr && arr.some(p => p && p.dataUri));''', TM, "main", u"㊾fa"),
  (u"★常駐させない行の物件の縮小版を、ファイルの写真だけで作る（📥 で入れた写真が物件に入らない）",
   u'''      const ph = slimRowWithMemPhotos(full, row).chosho_photos;''',
   u'''      const ph = full.chosho_photos;''', TM, "main", u"㊾ch"),
  (u"★常駐させない行の物件の縮小版を、ファイルの写真だけで作る（アパートでまとめた世帯の写真が物件から消える）",
   u'''      const ph = slimRowWithMemPhotos(full, row).chosho_photos;''',
   u'''      const ph = full.chosho_photos;''', TM, "main", u"㊾h"),
  (u"★縮小版を作るときファイルを読めないと、行の写真（📥 で入れた分）を足さない（物件から G が消える）",
   u'''      prev = Array.isArray(row._thumbs) ? row._thumbs : [];   // 読めない：前の縮小版に、行の写真の縮小版を足す（下）''',
   u'''      return;''', TM, "main", u"㊾e"),
  (u"★ファイルを読めないとき、前の縮小版を土台にしない（行の写真だけで作る。ほかの端末の保存とまとめると物件が G だけのまま）",
   u'''      prev = Array.isArray(row._thumbs) ? row._thumbs : [];   // 読めない：前の縮小版に、行の写真の縮小版を足す（下）''',
   u'''      prev = [];''', TM, "main", u"㊾ja"),
  (u"★ファイルを読めないとき、前の縮小版を土台にしない（📄 の行で書けたあと、物件が G だけになる）",
   u'''      prev = Array.isArray(row._thumbs) ? row._thumbs : [];   // 読めない：前の縮小版に、行の写真の縮小版を足す（下）''',
   u'''      prev = [];''', TM, "main", u"㊾k"),
  (u"★読めないとき前の縮小版に足すのに、同じ写真を見分けない（読めないまま保存するたびに G が増える）",
   u'''  if(prev) thumbs = photosKeepFileOnly(prev, thumbs);''',
   u'''  if(prev) thumbs = prev.concat(thumbs);''', TM, "main", u"㊾e"),
  (u"★読めない・行の写真も無いときにも縮小版を作り直したことにする（読めるようになっても作り直さない）",
   u'''      if(!own) return;                // 読めない・行の写真も無い → 前の縮小版のまま（無ければ作らない＝枚数だけ）
''', u'''''', TM, "main", u"㊾db"),
  (u"★ファイルを読めずに作った縮小版に印を付けない（読めるようになっても作り直さない）",
   u'''  row._thumbsNoFile = own && !both;                   // ファイルを読めずに作った（版178。次の保存でまた読む）
''', u'''''', TM, "main", u"㊾ib"),
  (u"★物件の保存で、ファイルを読まずに作った縮小版の行を拾わない（読めないあいだ G が物件に入らない）",
   u'''    && (!Array.isArray(r._thumbs) || r._thumbsNoFile)''',
   u'''    && !Array.isArray(r._thumbs)''', TM, "main", u"㊾e"),
  (u"★ファイルを読まずに作った縮小版があると、縮小版を作り直さない（入口で戻る）",
   u'''  if(!row || row.fileType !== "plain" || (Array.isArray(row._thumbs) && !row._thumbsNoFile)) return;''',
   u'''  if(!row || row.fileType !== "plain" || Array.isArray(row._thumbs)) return;''', TM, "main", u"㊾e"),
  (u"★ファイルを読まずに作った縮小版があると、作り直した縮小版を付けない（付ける前に戻る）",
   u'''  if(Array.isArray(row._thumbs) && !row._thumbsNoFile) return;''',
   u'''  if(Array.isArray(row._thumbs)) return;''', TM, "main", u"㊾e"),
  (u"★ファイルを読めずに作った縮小版を、このファイルの縮小版として覚える（読み直すとファイルの写真の代わりに入る）",
   u'''  if(row._thumbsNoFile) return;
  thumbMemoPut(row.file, row.lastModified, thumbs);''',
   u'''  thumbMemoPut(row.file, row.lastModified, thumbs);''', TM, "main", u"㊾ib"),
  (u"★📥 で常駐させない行の物件の縮小版を捨てる（読めないとき物件が G だけになる）",
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=keepTh;''',
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=undefined;''', TM, "main", u"㊾ja"),
  (u"★📥 で常駐させない行の物件の縮小版を捨てる（写真の無い取り込みで、読めないとき物件が写真なしになる）",
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=keepTh;''',
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=undefined;''', TM, "main", u"㊾jc"),
  (u"★📥 で常駐させない行の物件の縮小版を捨てる（📄 の行で書けたあと、物件が G だけになる）",
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=keepTh;''',
   u'''    row._amtCache=undefined; row._bomCache=undefined; row._thumbs=undefined;''', TM, "main", u"㊾k"),
  (u"★📥 で残した物件の縮小版に、作り直す印を付けない（ファイルの写真だけのまま G が物件に入らない）",
   u'''    if(keepTh){ row._thumbsNoFile = true; row._thumbsRetry = true; }''',
   u'''    if(keepTh){ row._thumbsRetry = true; }''', TM, "main", u"㊾ja"),
  (u"★📥 で常駐させない行の枚数を、取り込んだ写真の数にする（写真の無い取り込みで一覧が「なし」）",
   u'''    row._photoCount = (row._slim && row.fileType === "plain") ? (row._photoCount > 0 ? row._photoCount : 0)
      : (row._slim ? (n ? Math.max(n, row._photoCount) : row._photoCount) : n); }''',
   u'''    row._photoCount = n; }''', TM, "main", u"㊾da"),
  (u"★📥 で常駐させない行の枚数に、取り込んだ写真の数を足す（🧩 重複をまとめる が古いほうを残す方に選ぶ）",
   u'''    row._photoCount = (row._slim && row.fileType === "plain") ? (row._photoCount > 0 ? row._photoCount : 0)
''',
   u'''    row._photoCount = (row._slim && row.fileType === "plain") ? (row._photoCount > 0 ? row._photoCount : 0) + n
''', TM, "main", u"㊾l"),
  (u"★ファイルの写真と合わせた縮小版の枚数を、行の枚数にする（🧩 重複をまとめる が古いほうを残す方に選ぶ）",
   u'''  row._thumbsNoFile = own && !both;                   // ファイルを読めずに作った（版178。次の保存でまた読む）
''', u'''  row._thumbsNoFile = own && !both;                   // ファイルを読めずに作った（版178。次の保存でまた読む）
  if(both) row._photoCount = thumbs.length;
''', TM, "main", u"㊾l"),
  (u"★物件に入れる枚数を、常駐させない行でも行の枚数（ファイルの枚数）だけにする（取り込んだ写真を数えない）",
   u'''  c.chosho_photo_count = (r._slim && Array.isArray(r._thumbs)) ? Math.max(n, r._thumbs.length) : n;''',
   u'''  c.chosho_photo_count = n;''', TM, "main", u"㊾ch"),
  (u"★物件の保存で、ファイルに写真が無い常駐させない行の 📥 の写真を拾わない（物件に G が入らない）",
   u'''(r._photoCount > 0 || (r._slim && r.data && Array.isArray(r.data.chosho_photos) && r.data.chosho_photos.some(p => p && p.dataUri)))''',
   u'''r._photoCount > 0''', TM, "main", u"㊾czero"),
  (u"★📮 振り分けを行に入れるとき、行にだけある写真（📥 で入れて書けなかった分）を足さない",
   u'''    own = slimRowWithMemPhotos(fr, r).chosho_photos;    // 行にだけある写真（📥 で入れて書けなかった分）も足す（版178。落とすと、どこにも残らない）''',
   u'''    own = fr.chosho_photos;''', TM, "main", u"㊾g"),
  (u"★アパートでファイルを持たせた世帯の、物件の縮小版を作り直さない",
   u'''    target._thumbs = undefined;
''', u'''''', TM, "main", u"㊾h"),
  # ======== メイン：7回目・8回目の見直しの直し（古い名前の戸別：断るかどうかは行の写真で・物件にそのまま入る写真だけが「物件の縮小版」・
  #          見つけた同じ写真は、縮小版より大きいか物件の縮小版でないなら使う） ========
  (u"★断るかどうかを、ほかのファイルで見つけた元の写真を入れたあとの写真で決める（G の原寸を画面にしか無い写真と数えて作り、H がずっと縮小版のまま）",
   u'''      const orig = before.some(p => p && p.dataUri && !projThumbLike(p));''',
   u'''      const orig = (contentObj.chosho_photos || []).some(p => p && p.dataUri && !projThumbLike(p));''', TM, "main", u"㊸r"),
  (u"★物件の縮小版そのものかを長辺だけで見る（小さい図の PNG を縮小版と取り違えて断る）",
   u'''  if(!p || !p.id || !p.dataUri || !projThumbAsIs(p.dataUri)) return false;''',
   u'''  if(!p || !p.id || !p.dataUri) return false;''', TM, "main", u"㊸su"),
  (u"★物件の縮小版そのものかを長辺だけで見る（150000字を超える長辺512px の JPEG を縮小版と取り違えて断る）",
   u'''  if(!p || !p.id || !p.dataUri || !projThumbAsIs(p.dataUri)) return false;''',
   u'''  if(!p || !p.id || !p.dataUri) return false;''', TM, "main", u"㊸tu"),
  (u"★物件の縮小版そのものかを長辺だけで見る（見つけた PNG の図を縮小版と取り違えて使わない）",
   u'''  if(!p || !p.id || !p.dataUri || !projThumbAsIs(p.dataUri)) return false;''',
   u'''  if(!p || !p.id || !p.dataUri) return false;''', TM, "main", u"㊸u"),
  (u"★元の写真を探しに見て回るかを長辺だけで見る（PNG の図だけの行でも見て回り、「小さい写真のまま入れた」と知らせる）",
   u'''  const small = p => projThumbLike(p);   // 物件の縮小版そのもの（PNG の図などは元の写真＝探さない）''',
   u'''  const small = p => { if(!p || !p.id || !p.dataUri) return false; const e = photoLongEdgeOf(p.dataUri); return e > 0 && e <= PROJ_THUMB_MAXPX; };''', TM, "main", u"㊸sb"),
  (u"★元の写真を探しに見て回るかを長辺だけで見る（大きい JPEG だけの行でも見て回る）",
   u'''  const small = p => projThumbLike(p);   // 物件の縮小版そのもの（PNG の図などは元の写真＝探さない）''',
   u'''  const small = p => { if(!p || !p.id || !p.dataUri) return false; const e = photoLongEdgeOf(p.dataUri); return e > 0 && e <= PROJ_THUMB_MAXPX; };''', TM, "main", u"㊸tu"),
  (u"★断るかどうかを長辺だけで見る（G の縮小版と小さい図の PNG の行で、PNG を縮小版と取り違えて断る）",
   u'''      const orig = before.some(p => p && p.dataUri && !projThumbLike(p));''',
   u'''      const orig = before.some(p => { if(!p || !p.dataUri) return false; const e = photoLongEdgeOf(p.dataUri); return !(e > 0 && e <= PROJ_THUMB_MAXPX); });''', TM, "main", u"㊸sg"),
  (u"★断るかどうかを長辺だけで見る（G の縮小版と 150000字を超える JPEG の行で断る）",
   u'''      const orig = before.some(p => p && p.dataUri && !projThumbLike(p));''',
   u'''      const orig = before.some(p => { if(!p || !p.dataUri) return false; const e = photoLongEdgeOf(p.dataUri); return !(e > 0 && e <= PROJ_THUMB_MAXPX); });''', TM, "main", u"㊸tg"),
  (u"★物件の縮小版づくりが、縮小版そのものかを見る物差しより大きい JPEG もそのまま物件に入れる（物差しが2つ）",
   u'''    const t = projThumbAsIs(p.dataUri)
      ? p.dataUri''',
   u'''    const t = (p.dataUri.startsWith("data:image/jpeg") && p.dataUri.length < 1500000)
      ? p.dataUri''', TM, "main", u"㊸tu"),
  (u"★物件の縮小版づくりが、大きい JPEG もそのまま物件に入れる（物件に縮小版でなく元の写真が入る）",
   u'''    const t = projThumbAsIs(p.dataUri)
      ? p.dataUri''',
   u'''    const t = (p.dataUri.startsWith("data:image/jpeg") && p.dataUri.length < 1500000)
      ? p.dataUri''', TM, "main", u"①"),
  (u"★物件の縮小版づくりが、縮小版そのものと見る小さい JPEG まで作り直す（物差しが2つ・断ったあと閉じると足した写真が消える）",
   u'''    const t = projThumbAsIs(p.dataUri)
      ? p.dataUri''',
   u'''    const t = (p.dataUri.startsWith("data:image/jpeg") && p.dataUri.length < 1500)
      ? p.dataUri''', TM, "main", u"㊸sj"),
  (u"★見つけた同じ写真を、縮小版より大きいときだけ使う（PNG の図の元の写真を使わず物件の JPEG を入れる・縮小版が残ったと数えて断る）",
   u'''    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri) || !projThumbLike(b.p)))''',
   u'''    return (b && b.p.dataUri !== p.dataUri && (photoLongEdgeOf(b.p.dataUri) > photoLongEdgeOf(p.dataUri)))''', TM, "main", u"㊸u"),
  # 「見つけた写真が行の写真と1文字も違わないときも置き換える」（b.p.dataUri !== p.dataUri を外す）は足さない。
  # 同じ写真IDで中身も同じなら、物件の縮小版そのものかの見立ても長辺も行の写真と同じで、どのみち置き換えない（外しても動きが変わらない）。
  # ======== メイン：7回目・8回目の見直しの直し（縮小版づくりのあいだに 📥 が入った行を、同じ回で作り直す） ========
  # 「遅れて見る所（ensureRowThumbs の終わり）で作り直しの印を付けない」だけの変異は入れない。📥 で縮小版を引き継ぐとき
  #  （applyGenbaMergeToRow）にも同じ印を付けるので、片方だけ外しても試験は緑のまま（引き継いだ縮小版を持ったまま写真が変わる道は
  #  ほかに無い＝二重の備え）。両方を外すと ㊾m が赤くなることは確かめた（8回目の見直し）。遅れて見る所そのものは ㊿・㊿b の件で見る。
  (u"★📥 で縮小版を引き継いだ行に、作り直しの印を付けない（ほかの戸別の縮小版づくりのあいだに入ると同じ回で作り直さず、取り込んだ写真がまとめで消える）",
   u'''    if(keepTh){ row._thumbsNoFile = true; row._thumbsRetry = true; }''',
   u'''    if(keepTh){ row._thumbsNoFile = true; }''', TM, "main", u"㊾m2"),
  (u"★同じ回の作り直しを、縮小版づくりを始めたときに選んだ行だけにする（あいだに 📥 が入った別の戸別を作り直さず、取り込んだ写真がまとめで消える）",
   u'''      const again = (_listRows || []).filter(r => r && r.fileType === "plain"''',
   u'''      const again = targets.filter(r => r && r.fileType === "plain"''', TM, "main", u"㊾m2"),
  (u"★同じ回の作り直しで、作り直しの印の付いた行を拾わない（縮小版を引き継いだ行は作り直さず、取り込んだ写真がまとめで消える）",
   u'''        && (r._thumbsRetry || (targets.indexOf(r) >= 0 && !Array.isArray(r._thumbs))));''',
   u'''        && (targets.indexOf(r) >= 0 && !Array.isArray(r._thumbs)));''', TM, "main", u"㊾m"),
  (u"★作り直せたあとも作り直しの印を消さない（ファイルを読めないあいだ、同じ保存のうちに同じ写真を何度も縮める）",
   u'''  row._thumbs = thumbs;
  row._thumbsRetry = false;
''', u'''  row._thumbs = thumbs;
''', TM, "main", u"㊾m"),
  # ======== メイン：7回目・8回目の見直しの直し（📥 のあとの暗号の戸別の一覧の枚数。㊾n） ========
  (u"★📥 で暗号の常駐させない行（.hyb・.enc）にも「ファイルの枚数のまま」を当てる（分からない（-1）が 0 になり、一覧が「―」で押せない）",
   u'''    row._photoCount = (row._slim && row.fileType === "plain") ? (row._photoCount > 0 ? row._photoCount : 0)
''',
   u'''    row._photoCount = row._slim ? (row._photoCount > 0 ? row._photoCount : 0)
''', TM, "main", u"㊾n"),
  (u"★📥 で写真の無い取り込みのとき、暗号の常駐させない行の分かっている枚数を取り込んだ数（0）にする（🔒 も 💾 上書き保存のあとの 📷 2 も「―」）",
   u'''      : (row._slim ? (n ? Math.max(n, row._photoCount) : row._photoCount) : n); }''',
   u'''      : (row._slim ? (n ? Math.max(n, row._photoCount) : n) : n); }''', TM, "main", u"㊾n"),
  (u"★📥 で写真を取り込んだとき、暗号の常駐させない行の枚数を取り込んだ数だけにする（分かっているファイルの枚数 2 が 1 に減る）",
   u'''      : (row._slim ? (n ? Math.max(n, row._photoCount) : row._photoCount) : n); }''',
   u'''      : (row._slim ? (n ? n : row._photoCount) : n); }''', TM, "main", u"㊾nr"),
  # ======== メイン：8回目の見直しの直し（暗号の戸別 .hyb：開いても「ファイルから読む」に替えない・📷 と書き出しと一括再暗号化は
  #          剥がした封筒ならファイルの写真を読む・暗号の行が持つ写真はいつも出す・💾 のあとは行の写真を捨てる） ========
  (u"★開き直したとき、行をファイルから読む形に替える（物件：3回目に開いて直して戻ると、共有ファイルの増幅器 1U が 3U に戻る）",
   u'''        target.data = lite; target.unlocked = true; target._slim = wasSlim;
''', u'''        target.data = lite; target.unlocked = true; target._slim = true;
''', TM, "main", u"㉕tproj"),
  (u"★📷・📸・📄・🔄 が、剥がした封筒をそのまま読む（直して戻ったあと、写真が出ない・この戸別を飛ばす）",
   u'''async function getEnvelopeForPhotos(row){
  const env = await getFullEnvelope(row);
''', u'''async function getEnvelopeForPhotos(row){
  const env = await getFullEnvelope(row); return env;
''', TM, "main", u"㉕qedit"),
  (u"★📷・📸・📄・🔄 が、剥がした封筒をそのまま読む（物件の行：💾 上書き保存して戻ったあと 📷 に写真が出ない）",
   u'''async function getEnvelopeForPhotos(row){
  const env = await getFullEnvelope(row);
''', u'''async function getEnvelopeForPhotos(row){
  const env = await getFullEnvelope(row); return env;
''', TM, "main", u"㉕mproj"),
  (u"★一覧の 📷 写真のプレビューが、剥がした封筒をそのまま読む（直して戻ったあと「写真が登録されていません」）",
   u'''      const env = await getEnvelopeForPhotos(row);   // 剥がした封筒ならファイルの写真（版178）''',
   u'''      const env = await getFullEnvelope(row);''', TM, "main", u"㉕qedit"),
  (u"★📸 写真の一括書き出しが、剥がした封筒をそのまま読む（直して戻ったあと「鍵がなくスキップ」）",
   u'''    try { env = await getEnvelopeForPhotos(row); } catch(_){}''',
   u'''    try { env = await getFullEnvelope(row); } catch(_){}''', TM, "main", u"㉕qedit"),
  (u"★🔄 一括再暗号化・📄 一括平文化が、剥がした封筒をそのまま読む（直して戻ったあと「写真が出ていないので飛ばした戸別」）",
   u'''        if(sp) env = sp;''', u'''''', TM, "main", u"㉕qedit"),
  # 「📷・📸・📄・🔄 の封筒の暗号でない部分を行から取る」の2件は外した（9回目の見直し）。🔄・📄 は getEnvelopeForPhotos を使わなくなり
  #  （indivHybridEnvelope で、鍵の元が同じときだけファイルの写真を差し込む）、📷・📸 は写真だけを読む＝壊しても見分けようが無い。
  (u"★ファイルからほどいたとき、行にだけある写真を足さない（📥 で入れた写真 G が、開くと消える）",
   u'''  const base = Array.isArray(full.chosho_photos) ? full.chosho_photos : (full.chosho_photos ? migratePhotosShape(full.chosho_photos) : []);
  full.chosho_photos = photosKeepFileOnly(base, ph.filter(p => p && p.dataUri));
  return ph;
}''', u'''  return null;
}''', TM, "main", u"㉕r"),
  (u"★ファイルからほどいたとき、行にだけある写真を足さない（決まりの確かめ）",
   u'''  const base = Array.isArray(full.chosho_photos) ? full.chosho_photos : (full.chosho_photos ? migratePhotosShape(full.chosho_photos) : []);
  full.chosho_photos = photosKeepFileOnly(base, ph.filter(p => p && p.dataUri));
  return ph;
}''', u'''  return null;
}''', TM, "main", u"㉕p"),
  # ㉕uU は10回目の直しで、書けなかった 📥 の行をファイルを読まずに開く（写真を剥がした枝）ようになり、この枝を通らない。
  # 11回目の直しの 📄 ファイルの行（読んだファイルの写真を差し込んでほどく）が通るので、㉕zfg で見る。
  (u"★ファイルからほどいたとき、行にだけある写真を足さない（📄 ファイルの .hyb へ 📥 した G が、開くと消える）",
   u'''  const base = Array.isArray(full.chosho_photos) ? full.chosho_photos : (full.chosho_photos ? migratePhotosShape(full.chosho_photos) : []);
  full.chosho_photos = photosKeepFileOnly(base, ph.filter(p => p && p.dataUri));
  return ph;
}''', u'''  return null;
}''', TM, "main", u"㉕zfg"),
  (u"★ファイルからほどいたときも、ファイルの写真を行の写真で置き換える（📥 で入れた G だけが出て、上書き保存で A・B が消える）",
   u'''  full.chosho_photos = photosKeepFileOnly(base, ph.filter(p => p && p.dataUri));''',
   u'''  full.chosho_photos = ph.slice();''', TM, "main", u"㉕r"),
  (u"★ファイルからほどいて開いたとき、行にだけある写真を行から外す（📥 で入れた G が、もう一度開くと消える）",
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = rowPh; // 一覧側は写真を保持しない（行にだけある写真は持ったまま。版178）''',
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = null;''', TM, "main", u"㉕r"),
  (u"★ファイルを読めずに写真を剥がした封筒で開いたとき、行にだけある写真を行から外す（📥 で入れた G が、次に開くと消える）",
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = rowPh; // 一覧側は写真を保持しない（行にだけある写真は持ったまま。版178）''',
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = null;''', TM, "main", u"㉕uU"),
  (u"★物件の行を写真を剥がした封筒で開いたとき、行にだけある写真を行から外す（📥 で入れた G が、もう一度開くと消える）",
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = rowPh; // 一覧側は写真を保持しない（行にだけある写真は持ったまま。版178）''',
   u'''        const lite = Object.assign({}, full); lite.chosho_photos = null;''', TM, "main", u"㉕uA"),
  (u"★パスワードを聞いて開き直したとき、行にだけある写真を行から外す（もう一度開くと、足して戻った P が消える）",
   u'''      const lite = Object.assign({}, full); lite.chosho_photos = rowPh;
      target.data = lite; target.unlocked = true; target._slim = wasSlim;   // 上と同じ（版178）''',
   u'''      const lite = Object.assign({}, full); lite.chosho_photos = null;
      target.data = lite; target.unlocked = true; target._slim = wasSlim;   // 上と同じ（版178）''', TM, "main", u"㉕mpw"),
  (u"★写真を剥がした封筒で開いたとき、行の写真を当てにしてよいときだけ出す（物件の行に 📥 で入れた写真 G が、開くと消える）",
   u'''  if(full._photosStripped){
''', u'''  if(full._photosStripped){
    if(!target._photosKnown) return null;
''', TM, "main", u"㉕uA"),
  (u"★写真を剥がした封筒で開いたとき、行の写真を当てにしてよいときだけ出す（開くときファイルを読めないと、📥 で入れた写真 G が消える）",
   u'''  if(full._photosStripped){
''', u'''  if(full._photosStripped){
    if(!target._photosKnown) return null;
''', TM, "main", u"㉕uU"),
  (u"★暗号の戸別を 💾 上書き保存したあと、行にだけ持っていた写真を捨てない（画面で消して書いた P が、開き直すと戻る）",
   u'''        _editingRow.data = Object.assign({}, _editingRow.data, { chosho_photos: null });
''', u'''''', TM, "main", u"㉕s"),
  (u"★暗号の戸別を 💾 上書き保存したあと、行にだけ持っていた写真を捨てない（ボタンを押したとき：行に写真が残る）",
   u'''        _editingRow.data = Object.assign({}, _editingRow.data, { chosho_photos: null });
''', u'''''', TM, "main", u"㉕sclick"),
  (u"★暗号の戸別を 💾 上書き保存したあと、行をファイルから読む形にしない（開き直すと写真の出ていない画面・写真が出ない）",
   u'''        _editingRow._slim = true;
''', u'''''', TM, "main", u"㉕s"),
  (u"★暗号の戸別を 💾 上書き保存したあと、行をファイルから読む形にしない（ボタンを押したとき：開き直すと写真が出ない）",
   u'''        _editingRow._slim = true;
''', u'''''', TM, "main", u"㉕sclick"),
  # ======== メイン：9回目の見直しの直し（一括再暗号化は鍵の元が同じときだけファイルの写真を差し込む・書いたら行の封筒も新しく・📥 の現場の欄を暗号の行の封筒にも） ========
  (u"★🔄 一括再暗号化のあと、行の封筒を新しい鍵のものにしない（開くと古い封筒で開き、💾 上書き保存が書けない・物件に古い鍵が残る）",
   u'''        row.envelope = e2;''', u'''''', TM, "main", u"㉕v"),
  # 「鍵の元の違うファイルの写真を差し込む」は、🔄 ではほどけない写真になって結局飛ばす（壊しても同じ結果）。物件に保存の道は ㉕b が見る。
  (u"★🔄 一括再暗号化で、写真の出ていない戸別を飛ばさずに書く（ほかのPCが書き替えた .hyb の写真と中身が、行の古い中身で消える）",
   u'''    if(stateObj && stateObj._photosStripped){''', u'''    if(false){''', TM, "main", u"㉕w"),
  # 飛ばした戸別の知らせの言い方は ㉕w が見る（10回目の直しで bulkPhotoSkipNote の1か所にまとめた。その言い方を壊す変異は下にある）。
  (u"★📥 で暗号の行に入れた現場の欄（増幅器など）を、封筒の暗号でない部分に入れない（開くと古い値・💾 で古い値・物件にも古い値）",
   u'''  if(row.fileType === "hybrid" && row.envelope && merged && typeof merged === "object"){''',
   u'''  if(false){''', TM, "main", u"㉕x"),
  (u"★📥 で暗号の行の封筒に入れるとき、氏名などの暗号の欄まで暗号でない部分に入れる",
   u'''    for(const k in merged){ if(sens.indexOf(k) < 0) np[k] = merged[k]; }''',
   u'''    for(const k in merged){ np[k] = merged[k]; }''', TM, "main", u"㉕x"),
  (u"★暗号の行へ 📥 して戸別ファイルへ書けなかったのに「ファイルから読む」のまま（開くとファイルの古い中身で開き、現場の増幅器が戻る）",
   u'''  if(row.fileType === "hybrid" && row._slim && !/個別JSONも更新しました/.test(String(note || ""))) row._slim = false;''',
   u'''''', TM, "main", u"㉕x"),
  (u"★暗号の行へ 📥 して戸別ファイルへ書けたのに「ファイルから読む」をやめる（開くとファイルの写真が出ない）",
   u'''  if(row.fileType === "hybrid" && row._slim && !/個別JSONも更新しました/.test(String(note || ""))) row._slim = false;''',
   u'''  if(row.fileType === "hybrid" && row._slim) row._slim = false;''', TM, "main", u"㉕rproj"),
  # ======== メイン：10回目の見直しの直し（🔄 で受付台帳の「完了」を物件から消さない・ほかのPCの直しを消さない・知らせを分ける・📄 ファイルの行） ========
  # 11回目の直しで、行の封筒をほどいて書いた行（_slim でない）の「行の封筒のまま」は、書いた中身の暗号でない部分と同じ（壊しても同じ）。
  # ファイルから読む行は、ファイルの中身に受付台帳の欄をかぶせる。そのかぶせを外すと ㉕y が赤くなる。
  (u"★🔄 一括再暗号化で行の封筒を新しくするとき、ファイルから読む行に受付台帳の欄をかぶせない（受付台帳の「完了」が物件から消える）",
   u'''            try { const want = lgwbWanted(row);
                  Object.keys(want).forEach(k => { if(sens.indexOf(k) < 0 && String(np[k] == null ? "" : np[k]) !== String(want[k] == null ? "" : want[k])) np[k] = want[k]; }); } catch(_){}
''', u'''''', TM, "main", u"㉕ykeep,㉕ynewpw"),
  (u"★📁 で重なった暗号の行に「台帳を優先」で台帳の値を入れても、まだ戸別ファイルに入っていない印を付けない（🔄 のあと物件から「完了」が消える）",
   u'''      if(match.fileType === "hybrid"){ match._lgEdited = true; try { lgMarkTouched(match); } catch(_){} }''',
   u'''''', TM, "main", u"㉕yM"),
  (u"★🔄 一括再暗号化で、この端末が直していない受付台帳の欄まで古い写しでかぶせる（ほかのPCが .hyb に入れた「完了」・備考が物件から消え、あとの 💾 物件に保存 で戻る）",
   u'''          if(row._lgEdited || (row._caseId && _editedCaseKeys.has(row._caseId))){''',
   u'''          if(true){''', TM, "main", u"㉕yLst,㉕yLnote"),
  (u"★🔄 一括再暗号化で、ファイルから読む行の物件の封筒を、行の古い中身に新しい鍵の元を付けたものにする（ほかのPCの新しい .hyb を、あとの 💾 物件に保存 が戻す）",
   u'''        if(row._slim){
          const np = Object.assign({}, newData.plain || {});''',
   u'''        if(false){
          const np = Object.assign({}, newData.plain || {});''', TM, "main", u"㉕yS"),
  (u"★🔄 一括再暗号化で書いた戸別を「この端末が直した戸別」にする（ほかのPCが物件で付けた「完了」を、この端末の古い写しで消す）",
   u'''        try { if(_currentProject) projTouch(); } catch(_){}''',
   u'''        try { markCaseEdited(row); } catch(_){}
        try { if(_currentProject) projTouch(); } catch(_){}''', TM, "main", u"㉕z"),
  (u"★ファイルがあとで書き替えられて飛ばした戸別を、ほかの飛ばした戸別と一緒に数える（「開いて 💾 上書き保存」の知らせに混ざる）",
   u'''      if(staleFile) photoSkipStale++; else photoSkip++;''', u'''      photoSkip++;''', TM, "main", u"㉕w"),
  (u"★ファイルの鍵の元が違う（あとで書き替えられた）ことを見分けない",
   u'''staleFile = true;''', u'''staleFile = false;''', TM, "main", u"㉕w"),
  (u"★ファイルがあとで書き替えられていた戸別の知らせを、ほかの飛ばした戸別と同じ言い方にする",
   u'''"  ファイルが、この一覧を読んだあとで書き替えられていた戸別: "''', u'''"  写真が出ていないので飛ばした戸別: "''', TM, "main", u"㉕w"),
  (u"★📄 ファイルで読んだ暗号の行に、読んだファイルの写真を差し込まない（開くと A・B が出ない・一括平文化／再暗号化が飛ばす）",
   u'''  if(row.srcFile) return { getFile: async () => row.srcFile };
''', u'''''', TM, "main", u"㉕zfg,㉕ze"),
  (u"★📄 ファイルで読んだ暗号の行を、写真を剥がした封筒で開く（覚えているパスワード：画面に G だけ・保存の中身から A・B が抜ける）",
   u'''        const env = await hybEnvFromSrcFile(target, await getFullEnvelope(target));
        const full = lgOverlayLedger(await decryptHybrid(env, _sessionPassword), target);''',
   u'''        const env = await getFullEnvelope(target);
        const full = lgOverlayLedger(await decryptHybrid(env, _sessionPassword), target);''', TM, "main", u"㉕zfg"),
  (u"★📄 ファイルで読んだ暗号の行を、写真を剥がした封筒で開く（聞かれたパスワード：画面に G だけ）",
   u'''      const env = await hybEnvFromSrcFile(target, await getFullEnvelope(target));
      const full = lgOverlayLedger(await decryptHybrid(env, pw), target);''',
   u'''      const env = await getFullEnvelope(target);
      const full = lgOverlayLedger(await decryptHybrid(env, pw), target);''', TM, "main", u"㉕zfgpw"),
  (u"★一括平文化・一括再暗号化で、行にだけある写真（画面で足して一覧へ戻った P）を入れない",
   u'''      if(own.length){''', u'''      if(false){''', TM, "main", u"㉕ze"),
  # ======== メイン：11回目の見直しの直し（ファイルから読む行の物件の封筒・マージで新しい鍵を残す・📄 の行で画面の写真を戻さない） ========
  (u"★🔄 で鍵を新しくした戸別を、マージのとき新しい封筒にしない（ほかのPCの保存があると、鍵が物件で前に戻る）",
   u'''  if(rk && rk.size){''', u'''  if(false){''', TM, "main", u"㉕zMkeep,㉕zMnewpw"),
  (u"★🔄 で鍵を新しくした戸別を覚えない（マージで前の鍵に戻る）",
   u'''        try { if(row._caseId && !_editedCaseKeys.has(row._caseId) && !_reencCases.has(row._caseId)) _reencCases.set(row._caseId, hybEnvMark(before)); } catch(_){}''',
   u'''''', TM, "main", u"㉕zMnewpw"),
  (u"★マージのとき、ほかのPCが直した戸別でも 🔄 の新しい封筒にする（ほかのPCが付けた「完了」が消える）",
   u'''      if(dc && dc.caseId === c.caseId && dc.payload && hybEnvMark(dc.payload) === rk.get(c.caseId)) diskCases[idx] = c;''',
   u'''      diskCases[idx] = c;''', TM, "main", u"㉕z"),
  (u"★📄 ファイルの行で、画面で写真を直して戻った行にも、読んだファイルの写真を差し込む（消した写真が戻る・名前が元に戻る）",
   u'''  if(!row || row.fileType !== "hybrid" || row.fileHandle || !row.srcFile || row._photosKnown) return env;''',
   u'''  if(!row || row.fileType !== "hybrid" || row.fileHandle || !row.srcFile) return env;''', TM, "main", u"㉕zk"),
  (u"★一括で行の写真を足すとき、ファイルの写真を先にする（画面で直した名前が、読んだファイルの名前に戻る）",
   u'''        stateObj.chosho_photos = photosKeepFileOnly(own, base);''',
   u'''        stateObj.chosho_photos = photosKeepFileOnly(base, own);''', TM, "main", u"㉕zk"),
  # ======== 現場入力：特別記録の写真の取り込み・「保存」（版178） ========
  # 守りだけの所（いまの道では壊しても試験で見えない）には変異を置かない：spPersist の列（取り込みの書き込みは
  # 開いている記録なら画面の物を書くので重ならない）・✕ のあとも「見た」ままにする（描いたときに見た写真に入っている）・
  # 端末の記録より回数を戻さない（古い物が書くのは「戻る」の直前だけ）・一覧から開いたとき／描いたときの「見た写真」（✕ の直前に作られる）。
  (u"★特別記録の写真の取り込みで、取り込みを始めた記録を丸ごと書く（開き直して消した写真が戻る）",
   u'''        try{ if(await spPhotoKeep(r, pending)) dup++; else if(small) shrunk++; pending = []; }catch(_){ if(small) shrunk++; }''',
   u'''        r.photos.push(...pending); pending = []; try{ await spPersist(r); }catch(_){}''', TG, "genba", u"⑰b"),
  (u"★特別記録の取り込みの終わりに、取り込みを始めた記録を丸ごと書く（もとの直し前の最後の keep。開き直して直した備考が戻る）",
   u'''    if(spCurOf(r)) renderSpecialEdit(host);             // 描き直すのは''',
   u'''    await keep(); if(spCurOf(r)) renderSpecialEdit(host);             // 描き直すのは''', TG, "genba", u"⑰d"),
  (u"★特別記録を書くときに、端末の記録のまだ見ていない写真を足さない（戻る前の控えが、先に並んだ取り込みの写真を消す）",
   u'''  await spMergeUnseen(rec, prev);
  if(bump) rec.rev = (rec.rev | 0) + 1;''',
   u'''  if(bump) rec.rev = (rec.rev | 0) + 1;''', TG, "genba", u"⑰r"),
  (u"★特別記録の開いている記録を、同じ物かどうかだけで見る（開き直した記録の画面に、取り込みの写真が出ない）",
   u'''  return (_spCur && rec && (_spCur === rec || (rec.key && _spCur.key === rec.key))) ? _spCur : null;''',
   u'''  return (_spCur && rec && _spCur === rec) ? _spCur : null;''', TG, "genba", u"⑰"),
  (u"★特別記録の開いている記録を、同じ記録かどうか見ずに使う（取り込みの写真が、ほかの記録に入る）",
   u'''  return (_spCur && rec && (_spCur === rec || (rec.key && _spCur.key === rec.key))) ? _spCur : null;''',
   u'''  return (_spCur && rec) ? _spCur : null;''', TG, "genba", u"⑰p"),
  (u"★特別記録の取り込みの終わりに描き直さない（取り込んだ写真が、開いている記録の画面に出ない）",
   u'''    if(spCurOf(r)) renderSpecialEdit(host);             // 描き直すのは''',
   u'''    if(false) renderSpecialEdit(host);             // 描き直すのは''', TG, "genba", u"⑰"),
  (u"★特別記録の取り込みが一覧で終わっても、一覧を出し直さない（枚数・保存済の印が古い）",
   u'''    else if(!_spCur) await renderSpecial();             // 一覧なら''',
   u'''    else if(false) await renderSpecial();             // 一覧なら''', TG, "genba", u"⑰e"),
  (u"★特別記録の取り込みで、始めの記録の写真をみな足す（一覧で待つあいだに、消した写真が戻る）",
   u'''    if(!mergePhotosInto(prev.photos, phs)) return dup;''',
   u'''    if(!mergePhotosInto(prev.photos, (rec.photos || []).concat(phs))) return dup;''', TG, "genba", u"⑰b2"),
  (u"★特別記録の取り込みの書き込みを1つずつにしない（一覧で同時に入った写真の片方が消える）",
   u'''function spPhotoKeep(rec, phs){
  return spQueue(async () => {''',
   u'''function spPhotoKeep(rec, phs){
  return (fn => fn())(async () => {''', TG, "genba", u"⑰c2"),
  (u"★特別記録を一覧から開くのを、取り込みの書き込みと同じ列に並べない（開くあいだに入った写真が画面に無い）",
   u'''    const rec = await spQueue(async () => {
      const x = (await spList()).filter(x => x.id === b.getAttribute("data-sp-open"))[0];''',
   u'''    const rec = await (fn => fn())(async () => {
      const x = (await spList()).filter(x => x.id === b.getAttribute("data-sp-open"))[0];''', TG, "genba", u"⑰h"),
  (u"★特別記録が端末に無く開いてもいないとき、取り込みの写真を書かない（新しい記録で一覧へ戻ると写真が消える）",
   u'''      await spWrite(rec, true, null);
      return dup;''', u'''      return dup;''', TG, "genba", u"⑰f2"),
  (u"★特別記録が開いていないとき、取り込みで回数を進めない（一覧で待つあいだに入った写真が「保存済」に見える）",
   u'''    prev.rev = Math.max(prev.rev | 0, rec.rev | 0) + 1;''', u'''    prev.rev = prev.rev | 0;''', TG, "genba", u"⑰g2"),
  (u"★特別記録を開いているとき、取り込みで回数を進めない（入った写真が「保存済」に見える）",
   u'''      if(n) await spWrite(cur, true, prev);''', u'''      if(n) await spWrite(cur, false, prev);''', TG, "genba", u"⑰g"),
  (u"★特別記録の取り込みで、開いている記録に足した写真を取り込みの終わりまで控えない（新しい記録の1枚目が端末に無い）",
   u'''      if(n) await spWrite(cur, true, prev);
      else await spWriteIfChanged(cur);''', u'''      /* 書かない */''', TG, "genba", u"⑰f"),
  (u"★特別記録の取り込みで、端末に控えられなかった写真をもう一度控えない（黙って消える）",
   u'''        try{ if(await spPhotoKeep(r, pending)) dup++; else if(small) shrunk++; pending = []; }catch(_){ if(small) shrunk++; }''',
   u'''        try{ if(await spPhotoKeep(r, pending)) dup++; else if(small) shrunk++; }catch(_){ if(small) shrunk++; } pending = [];''', TG, "genba", u"⑰l"),
  (u"★特別記録の取り込みで、ずっと控えられない写真を消える知らせでしか言わない",
   u'''      uiNoticeWhenIdle("⚠ " + pending.length''', u'''      toast("⚠ " + pending.length''', TG, "genba", u"⑰l"),
  (u"★特別記録の取り込みで、控えられなかった写真を ✕ で消していても、もう一度送る（消した写真が戻る）",
   u'''      const add = phs.filter(p => { const k = spPid(p); return k && (p === last || !(seen.has(k) && !have.has(k))); });''',
   u'''      const add = phs.slice();''', TG, "genba", u"⑰t"),
  (u"★特別記録の取り込みの終わりに、開いている記録を控えずに描き直す（取り込みのあいだに打った備考が残らない）",
   u'''    if(cur){ try{ await spQueue(() => spWriteIfChanged(cur)); }catch(_){} }''', u'''''', TG, "genba", u"⑰m"),
  (u"★特別記録の取り込みの終わりに、中身が同じでも書く（同じ写真だけを選ぶと「未保存」になる）",
   u'''    if(cur){ try{ await spQueue(() => spWriteIfChanged(cur)); }catch(_){} }''',
   u'''    if(cur){ try{ await spPersist(cur); }catch(_){} }''', TG, "genba", u"⑰x"),
  (u"★特別記録の取り込みで何も足さなかったときも、回数を進めて書く（同じ写真だけで「未保存」）",
   u'''      else await spWriteIfChanged(cur);''', u'''      else await spWrite(cur, true, prev);''', TG, "genba", u"⑰x"),
  (u"★特別記録の中身が同じかを見ずに書く（同じ写真だけで「未保存」）",
   u'''  if(prev ? spSig(prev) === spSig(rec)''', u'''  if(prev ? false''', TG, "genba", u"⑰x"),
  (u"★特別記録で同じ写真を選んでも、足さなかったと知らせない",
   u'''    if(dup) toast("同じ写真がもう入っているので足しませんでした（" + dup + "枚）");''', u'''''', TG, "genba", u"⑰o"),
  (u"★特別記録の開いている記録に、同じ写真を2枚目として足す",
   u'''      const n = mergePhotosInto(cur.photos, add);''', u'''      cur.photos.push(...add); const n = add.length;''', TG, "genba", u"⑰o"),
  (u"★特別記録の端末の記録にある同じ写真を見分けない（一覧へ戻ったあとの同じ写真を知らせない）",
   u'''    const dup = has(cur && cur.photos) || has(prev && prev.photos) || (!cur && !prev && has(rec.photos));''',
   u'''    const dup = has(cur && cur.photos);''', TG, "genba", u"⑰o"),
  (u"★特別記録の ✕ を、いまの並びの番号で消す（描き直しが遅れると別の写真を消す）",
   u'''    const ph = shown[+b.getAttribute("data-sp-photodel")];''',
   u'''    const ph = (r.photos || [])[+b.getAttribute("data-sp-photodel")];''', TG, "genba", u"⑰s"),
  (u"★特別記録の ✕ のあと、控えを待ってから描き直す（古い並びの ✕ が残る）",
   u'''    if(_spCur === r) renderSpecialEdit(host); // 控えを待たずに描き直す（古い並びの ✕ を押させない）''', u'''''', TG, "genba", u"⑰s"),
  (u"★特別記録の保存済の印を、中身ではなく回数で決める（中身が同じでも「途中で変わった」と言う）",
   u'''        late = !!ok && spSig(cur) !== sig0;''', u'''        late = !!ok && (cur.rev | 0) > rev0;''', TG, "genba", u"⑰w"),
  (u"★特別記録の保存済の印を付けるとき、開いている記録を書かない（あいだに打った備考・控えられなかった写真が端末に残らない）",
   u'''      if(cur){
        await spMergeUnseen(cur, prev);''', u'''      if(false){
        await spMergeUnseen(cur, prev);''', TG, "genba", u"⑰u2"),
  (u"★特別記録の保存済の印を付けるとき、開いている記録を書かない（保存のあいだに打った備考を「保存済」にする）",
   u'''      if(cur){
        await spMergeUnseen(cur, prev);''', u'''      if(false){
        await spMergeUnseen(cur, prev);''', TG, "genba", u"⑰v"),
  (u"★特別記録が開いていないとき、保存の途中で入った写真を見ない（一覧で待つあいだに入った写真が「保存済」）",
   u'''        late = !!ok && spSig(o) !== sig0;''', u'''        late = false;''', TG, "genba", u"⑰z"),
  (u"★特別記録の保存の途中で中身が変わっても、ファイルの回数をいまの回数にする（「保存済」に見える）",
   u'''      else { o.fileRev = Math.min(rev0, o.rev | 0); if((o.rev | 0) <= o.fileRev) o.rev = o.fileRev + 1; }''',
   u'''      else { o.fileRev = o.rev | 0; }''', TG, "genba", u"⑰i"),
  (u"★特別記録の保存で読み返しが合わないのに、保存済の印を付ける",
   u'''      if(!ok) return;
      o.fileSavedAt = at;''', u'''      o.fileSavedAt = at;''', TG, "genba", u"⑰y"),
  (u"★特別記録の保存の印を端末に書けなくても、知らせない・閉じる",
   u'''console.warn("特別記録：保存の印を端末に書けませんでした", e); fail = true; }''',
   u'''console.warn("特別記録：保存の印を端末に書けませんでした", e); }''', TG, "genba", u"⑰u"),
  (u"★特別記録の保存で、開き直した記録にファイル名を控えない（種類を替えて保存すると別のファイルができる）",
   u'''      o.fileName = rec.fileName || o.fileName;''', u'''      if(o === rec) o.fileName = rec.fileName;''', TG, "genba", u"⑰j"),
  (u"★特別記録の保存で、書き出した記録を丸ごと書く（書き出しているあいだに開き直して撮った写真が消える）",
   u'''        await spMergeUnseen(cur, prev);
        late = !!ok && spSig(cur) !== sig0;
        mark(cur, late);
        cur.savedAt = at;
        await idbPut(spRow(cur));''', u'''        late = !!ok && spSig(cur) !== sig0;
        mark(cur, late);
        cur.savedAt = at;
        await idbPut(spRow(rec));''', TG, "genba", u"⑰j"),
  (u"★特別記録の保存済の印を、取り込みの書き込みと同じ列に並べない（印のあいだに入った写真が消える）",
   u'''function spMarkSaved(rec, rev0, sig0, ok){
  return spQueue(async () => {''', u'''function spMarkSaved(rec, rev0, sig0, ok){
  return (fn => fn())(async () => {''', TG, "genba", u"⑰k"),
  (u"★特別記録の保存の途中で中身が変わっても知らせない（もう一度押すことに気づけない）",
   u'''  return (m && m.late) ? ("\\n\\n⚠ 保存の途中で''', u'''  return false ? ("\\n\\n⚠ 保存の途中で''', TG, "genba", u"⑰i"),
  (u"★特別記録の保存の途中で中身が変わっても、記録を閉じる",
   u'''    if(res && res.ok && !res.late){''', u'''    if(res && res.ok){''', TG, "genba", u"⑰i"),
  (u"★特別記録の保存の途中で入った写真を、開いている画面に出さない",
   u'''      if(res.late && spCurOf(r)) renderSpecialEdit(host);''', u'''      if(false) renderSpecialEdit(host);''', TG, "genba", u"⑰i"),
  (u"★特別記録の保存が一覧で終わっても、一覧を出し直さない（「未保存」・枚数が古い）",
   u'''      else if(res.late && !_spCur) await renderSpecial();   // 一覧なら「未保存」を出し直す''',
   u'''      else if(false) await renderSpecial();   // 一覧なら「未保存」を出し直す''', TG, "genba", u"⑰z"),
  (u"★特別記録の保存が終わったら、そのとき開いている記録を閉じる（あいだに開いたほかの記録が閉じる）",
   u'''      if(!_spCur || _spCur === r){ _spCur = null; await renderSpecial(); }''',
   u'''      _spCur = null; await renderSpecial();''', TG, "genba", u"⑰n"),
  (u"★特別記録の保存先を選ぶ画面で、途中で中身が変わっても閉じる・知らせない",
   u'''      return { ok:true, late:m.late, title:"保存しました", msg:(h.name || fname)''',
   u'''      return { ok:true, late:false, title:"保存しました", msg:(h.name || fname)''', TG, "genba", u"⑰y"),
  (u"★特別記録を共有で渡したとき、途中で中身が変わっても閉じる",
   u'''      return { ok:true, late:m.late, title:"共有で渡しました"''', u'''      return { ok:true, late:false, title:"共有で渡しました"''', TG, "genba", u"⑰y"),
  (u"★特別記録をダウンロードに入れたとき、途中で中身が変わっても閉じる",
   u'''  return { ok:true, late:m.late, title:"ダウンロードに入れました"''', u'''  return { ok:true, late:false, title:"ダウンロードに入れました"''', TG, "genba", u"⑰y"),
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
