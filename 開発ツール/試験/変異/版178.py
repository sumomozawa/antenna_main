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
   u'''    rowSeePhotos(row, ph || [], true);                              // このファイルの写真を見せる・読めなければ行の写真だけ（版178）
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
   u'''  if(keep.length) s.chosho_photos = keep.concat(ed);''', u'''  if(false) s.chosho_photos = keep.concat(ed);''', TM, "main", u"⑨b"),
  (u"★画面に入れなかった写真と同じ写真を入れ直すと、二重になる",
   u'''  const keep = h.photos.filter(p => !((p.id && have.has(p.id)) || have.has(photoContentId(p.dataUri))));''',
   u'''  const keep = h.photos.slice();''', TM, "main", u"⑧b"),
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
   u'''      if(_indivWriteNotShown){''', u'''      if(false){''', TM, "main", u"⑯i"),
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
   u'''        rowSeePhotos(target, d.chosho_photos, true); }    // このファイルの写真を見せる（版178）''',
   u'''        }''', TM, "main", u"㉓e"),
  (u"★一度開いた行（写真を持っている）を開き直したとき、見せた写真を覚えない",
   u'''    else rowSeePhotos(target, d && d.chosho_photos);                                                         // 行の写真を見せる（版178）''',
   u'''''', TM, "main", u"㉓g"),
  (u"★図面のある物件の行（縮小版の印が外れた）を、元のファイルへそのまま上書きする",
   u'''                      && (target._fromProject || target.data.chosho_photos_thumb));''',
   u'''                      && (target.data.chosho_photos_thumb));''', TM, "main", u"⑭d"),
  (u"★持ち越すとき、縮小版を覚えていない写真は元に戻さない（開き直したあと縮小版が戸別ファイルに書かれる）",
   u'''      if(o.thumb != null && o.thumb !== p.dataUri) return p;                        // ほかの端末が直した写真は、そのまま''',
   u'''      if(o.thumb !== p.dataUri) return p;''', TM, "main", u"⑫d"),
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
  (u"★📁 の行を開くときファイルを読めなかったのに、前に見せた写真の覚えを残す（上書き保存で写真が全部消える）",
   u'''      else { rowSeePhotos(target, (d && d.chosho_photos) || [], true);   // 読めなかった＝行の写真だけ見せる（ファイルの写真を「画面で消した」としない・版178）''',
   u'''      else {''', TM, "main", u"㊻a"),
  (u"★図面のまだ無い戸別を開くときファイルを読めなかったのに、前に見せた写真の覚えを残す",
   u'''    rowSeePhotos(row, ph || [], true);                              // このファイルの写真を見せる・読めなければ行の写真だけ（版178）''',
   u'''    if(ok) rowSeePhotos(row, ph, true);''', TM, "main", u"㊻b"),
  (u"★図面のまだ無い戸別を開くときファイルを読めなかったら、行が持っている写真（取り込んだ分）も出さない（保存で消える）",
   u'''    ph = ok ? slimRowWithMemPhotos(fr, row).chosho_photos : d.chosho_photos;   // 読めなければ、行が持っている写真（取り込んだ分）だけ（版178）''',
   u'''    ph = ok ? slimRowWithMemPhotos(fr, row).chosho_photos : null;''', TM, "main", u"㊻c"),
  (u"★ファイルの写真を読めないまま開いた戸別でも、戻るときに「行の写真を当てにしてよい」にする（ファイルの写真が消える）",
   u'''    if(!_editingRow._photosPartial){''', u'''    if(true){''', TM, "main", u"㊻c"),
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
   u'''    ph = ok ? slimRowWithMemPhotos(fr, row).chosho_photos : d.chosho_photos;   // 読めなければ、行が持っている写真（取り込んだ分）だけ（版178）''',
   u'''    ph = ok ? fr.chosho_photos : d.chosho_photos;''', TM, "main", u"㊾b"),
  (u"★縮小版を作っているあいだに行の写真が変わっても、縮小版を付ける（足した写真が物件に入らない）",
   u'''  if(now !== src0 && !photosSameSet(now, src0)) return;''', u'''''', TM, "main", u"㊿"),
  (u"★縮小版を付けなかった行を、同じ回で作り直さない（写真なしで物件に保存する）",
   u'''      const again = targets.filter(r => r && !Array.isArray(r._thumbs));''', u'''      const again = [];''', TM, "main", u"㊿"),
  (u"★画面から戻っただけ（写真は同じ）でも縮小版を捨てる（直して戻るたびに写真なしで物件に保存し、まとめると写真が全部消える）",
   u'''  if(now !== src0 && !photosSameSet(now, src0)) return;''', u'''  if(now !== src0) return;''', TM, "main", u"㊿b"),
  (u"★作り直した行に写真の配列が無い（縮小版が物件に入っていない）のに枚数があるとき、この端末の元の写真を戻さない",
   u'''    if(!Array.isArray(r.data.chosho_photos)){
      if(!(Number(r.data.chosho_photo_count) > 0 || r._photoCount > 0)) return;''',
   u'''    if(!Array.isArray(r.data.chosho_photos)){
      return;''', TM, "main", u"㊿c"),
  (u"★💾 反映で別のフォルダを選んで読み直したあと、物件が覚える名前を工事フォルダからの道のりにそろえない（次に縮小版のファイルを作る）",
   u'''  await rowsFileFromProjDir(_listRows);   // 物件が覚える名前は、工事フォルダから見た道のりにそろえる（版178）''',
   u'''''', TM, "main", u"㊸e"),
  (u"★物件の覚えている名前で見つからないとき、工事フォルダの中の「管理番号.json」を探さずに新しく作る（縮小版のファイルが増える）",
   u'''    if(hit.length === 1){ fh = hit[0].fh; photoSrcFh = fh; relpath = hit[0].path; legacyToRemove = ""; }''',
   u'''''', TM, "main", u"㊸f"),
  (u"★付けたファイルの道のりを、付けたときのフォルダから見たまま覚える（次に工事フォルダへ縮小版のファイルを作る）",
   u'''    if(Array.isArray(rp) && rp.length) row.file = rp.join("/");''', u'''    if(false) row.file = rp.join("/");''', TM, "main", u"㊸d"),
  (u"★物件から作った暗号の行（写真を剥がした封筒）を、付いているファイルがあっても剥がした封筒のまま開く（上書き保存で写真なしの .hyb を書く）",
   u'''  if(!row._slim && row.envelope && !fromFile) return row.envelope;''', u'''  if(!row._slim && row.envelope) return row.envelope;''', TM, "main", u"㉕d"),
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
  (u"★届け先の下書きが別のものに替わっていたとき、黙って別の下書きに入れる",
   u'''      toast("⚠ 管理番号 " + (m.chosho_mgmt_no || "") + " の下書きが別のものに替わっていたので、届いた写真は別の下書き（一覧に出ます）に入れました");''',
   u'''''', TG, "genba", u"㉑"),
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
  # ======== メイン：物件から開いた戸別の「💾 保存」（名前を付けて保存）（G） ========
  (u"★物件から開いた戸別でも、ファイルを選ぶ画面で保存する（選んだ戸別ファイルが空にされ、縮小版で書かれる）",
   u'''  // File System Access API 対応ブラウザ (Chrome/Edge): 保存先ダイアログを表示
  if(window.showSaveFilePicker && !fromProj){''',
   u'''  // File System Access API 対応ブラウザ (Chrome/Edge): 保存先ダイアログを表示
  if(window.showSaveFilePicker){''', TM, "main", u"㉗a"),
  (u"★物件から開いた戸別（図面なし）でも、ファイルを選ぶ画面で保存する（戸別ファイルが写真0枚になる）",
   u'''  // File System Access API 対応ブラウザ (Chrome/Edge): 保存先ダイアログを表示
  if(window.showSaveFilePicker && !fromProj){''',
   u'''  // File System Access API 対応ブラウザ (Chrome/Edge): 保存先ダイアログを表示
  if(window.showSaveFilePicker){''', TM, "main", u"㉗b"),
  (u"★物件から開いた戸別かを、縮小版の印だけで見る（写真の無い物件の行で、戸別ファイルの写真が消える）",
   u'''  return !!(row && (row._fromProject || (row.data && row.data.chosho_photos_thumb)));''',
   u'''  return !!(row && ((row.data && row.data.chosho_photos_thumb)));''', TM, "main", u"㉗c"),
  (u"★物件から開いた戸別かを、縮小版の印だけで見る（暗号の物件の行＝印が無い。ハイブリッド保存で .hyb の暗号の写真が消える）",
   u'''  return !!(row && (row._fromProject || (row.data && row.data.chosho_photos_thumb)));''',
   u'''  return !!(row && ((row.data && row.data.chosho_photos_thumb)));''', TM, "main", u"㉘a"),
  (u"★物件から開いたのではない戸別も写しにする（📂 で読んだ戸別を ファイルを選ぶ画面で保存できない）",
   u'''  return !!(row && (row._fromProject || (row.data && row.data.chosho_photos_thumb)));''',
   u'''  return true;''', TM, "main", u"㉗d"),
  (u"★物件から開いたのではない戸別も写しにする（🔐／ハイブリッド保存をファイルを選ぶ画面で保存できない）",
   u'''  return !!(row && (row._fromProject || (row.data && row.data.chosho_photos_thumb)));''',
   u'''  return true;''', TM, "main", u"㉘d"),
  (u"★写しに、画面に入れなかった写真を入れない（図面の無い戸別の写しが写真0枚）",
   u'''  if(fromProj) editorAddHiddenPhotos(s, true);''', u'''''', TM, "main", u"㉗b"),
  (u"★写しの名前を 管理番号.json のままにする（戸別ファイルと同じ名前）",
   u'''(mgmtSafe + (fromProj ? "_写し" : ""))''', u'''(mgmtSafe)''', TM, "main", u"㉗a"),
  (u"★写しの窓で「戸別ファイルへは 💾 物件に保存 で書いてください」と知らせない",
   u'''  const name = prompt((fromProj ? saveStateProjNote(s, mgmtSafe) + "\\n\\n" : "")''',
   u'''  const name = prompt((""''', TM, "main", u"㉗b"),
  (u"★写真の無い写しにも「物件に控えた小さい写真です」と知らせる",
   u'''     : small ? "写真は、物件に控えた小さい写真です（元の写真ではありません）。\\n"''',
   u'''     : true ? "写真は、物件に控えた小さい写真です（元の写真ではありません）。\\n"''', TM, "main", u"㉗c"),
  # ======== メイン：物件から開いた戸別の「🔐 暗号化保存」「ハイブリッド保存」（H） ========
  (u"★物件から開いた戸別でも、ハイブリッド保存はファイルを選ぶ画面で保存する（選んだ .hyb が空にされ、暗号の写真が消える）",
   u'''    envelope = await encryptHybrid(s, password);
  } catch(err){
    alert("暗号化エラー: " + (err.message || err));
    return;
  }
  const content = JSON.stringify(envelope, null, 2);

  if(window.showSaveFilePicker && !fromProj){''',
   u'''    envelope = await encryptHybrid(s, password);
  } catch(err){
    alert("暗号化エラー: " + (err.message || err));
    return;
  }
  const content = JSON.stringify(envelope, null, 2);

  if(window.showSaveFilePicker){''', TM, "main", u"㉘a"),
  (u"★物件から開いた戸別でも、🔐 暗号化保存はファイルを選ぶ画面で保存する（選んだ戸別ファイルが空にされる）",
   u'''    envelope = await encryptJsonString(jsonString, password);
  } catch(err){
    alert("暗号化エラー: " + (err.message || err));
    return;
  }
  const content = JSON.stringify(envelope, null, 2);

  if(window.showSaveFilePicker && !fromProj){''',
   u'''    envelope = await encryptJsonString(jsonString, password);
  } catch(err){
    alert("暗号化エラー: " + (err.message || err));
    return;
  }
  const content = JSON.stringify(envelope, null, 2);

  if(window.showSaveFilePicker){''', TM, "main", u"㉘c"),
  (u"★写しの名前を 管理番号 のままにする（ハイブリッド保存の写しが戸別ファイルと同じ名前の土台）",
   u'''(mgmtSafe + (fromProj ? "_写し" : ""))''', u'''(mgmtSafe)''', TM, "main", u"㉘a"),
  (u"★写真が復元できていない（剥がれている）ことを知らせない",
   u'''    + (_editorPhotosStripped ? "写真は復元できていないので、この写しには入りません（暗号の写真は、工事フォルダの戸別ファイルにあります）。\\n"''',
   u'''    + (false ? "写真は復元できていないので、この写しには入りません（暗号の写真は、工事フォルダの戸別ファイルにあります）。\\n"''', TM, "main", u"㉘a"),
  (u"★暗号の戸別で、行が覚えている名前を見ない（管理番号.antenna.hyb の戸別ファイルを 管理番号.hyb と言う）",
   u'''  const fname = ((hyb || !mgmtSafe) && known) ? known : ((mgmtSafe || "管理番号") + (hyb ? ".hyb" : ".json"));''',
   u'''  const fname = (mgmtSafe || "管理番号") + (hyb ? ".hyb" : ".json");''', TM, "main", u"㉘a"),
  (u"★🔐 暗号化保存の写しに、画面に入れなかった写真を入れない（図面の無い戸別の写しが写真0枚）",
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }   // 写しには画面に入れなかった写真も入れる
  const password = await promptPassword({
    title: "🔐 暗号化保存",''',
   u'''  if(fromProj){ if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }
  const password = await promptPassword({
    title: "🔐 暗号化保存",''', TM, "main", u"㉘c"),
  (u"★ハイブリッド保存で、パスワードの前に知らせて確かめない",
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }   // 写しには画面に入れなかった写真も入れる
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''',
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); }
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''', TM, "main", u"㉘b"),
  (u"★ハイブリッド保存の写しのあと「保存が完了しました」と言う（戸別ファイルに書いたように聞こえる）",
   u'''  alert(fromProj ? ("🔐🔑 写しをダウンロードの場所へ保存しました：" + fname + "\\n戸別ファイルは書き替えていません。")''',
   u'''  alert(false ? ("🔐🔑 写しをダウンロードの場所へ保存しました：" + fname + "\\n戸別ファイルは書き替えていません。")''', TM, "main", u"㉘a"),
  (u"★🔐 暗号化保存の写しのあと「保存が完了しました」と言う",
   u'''  alert(fromProj ? ("🔐 写しをダウンロードの場所へ保存しました：" + fname + "\\n戸別ファイルは書き替えていません。") : "🔐 暗号化保存が完了しました");''',
   u'''  alert("🔐 暗号化保存が完了しました");''', TM, "main", u"㉘c"),

  # ---- （G2）見直しの直し：開いている行が一覧から外れても写しにする・案内するボタン・写しの写真 ----
  (u"★物件から開いた印を画面の側で覚えない（開いている行を 🧹 未施工にすると、💾 保存がファイルを選ぶ画面を開く）",
   u'''  return !!_editorProjRow || rowOpenedFromProject(_editingRow);''',
   u'''  return rowOpenedFromProject(_editingRow);''', TM, "main", u"㉗e"),
  (u"★物件から開いた印を画面の側で覚えない（図面のある戸別で、縮小版が戸別ファイルに書かれる）",
   u'''  return !!_editorProjRow || rowOpenedFromProject(_editingRow);''',
   u'''  return rowOpenedFromProject(_editingRow);''', TM, "main", u"㉗f"),
  (u"★図面のまだ無い物件の行を開くとき、物件から開いた印を立てない",
   u'''    _editorProjRow = rowOpenedFromProject(row) ? row : null;   // 物件から開いた行（版178。行が外れても、保存は写しにする）
''', u'''''', TM, "main", u"㉗e"),
  (u"★図面のある物件の行を開くとき（setLoadedOrigin）、物件から開いた印を立てない",
   u'''  _editorProjRow = rowOpenedFromProject(_editingRow) ? _editingRow : null;   // 物件から開いた行（版178。行が外れても、保存は写しにする）
''', u'''''', TM, "main", u"㉗f"),
  (u"★画面を替えても、物件から開いた印を下ろさない（📂 で読んだ戸別まで写しにされる）",
   u'''  _editorProjRow = null;   // 物件から開いた行の覚えも下ろす（版178）
''', u'''''', TM, "main", u"㉗g"),
  (u"★工事調書のまとめ印刷のあと、物件から開いた印を戻さない",
   u'''_editorHiddenPhotos = savedHidden; _editorProjRow = savedProjRow;''',
   u'''_editorHiddenPhotos = savedHidden;''', TM, "main", u"㉗h"),
  (u"★写しでも、行が外れたときは画面に入れなかった写真を足さない（図面の無い戸別の写しが写真0枚）",
   u'''  if(!s || !h || (!any && h.row !== _editingRow) || !h.photos.length) return s;''',
   u'''  if(!s || !h || h.row !== _editingRow || !h.photos.length) return s;''', TM, "main", u"㉗e"),
  (u"★「💾 物件に保存」が押せないとき（行が外れた）も、その名前へ案内する",
   u'''  const projBtn = !ro && !(_loadedOrigin && _loadedOrigin.fileHandle)''',
   u'''  const projBtn = true || !ro && !(_loadedOrigin && _loadedOrigin.fileHandle)''', TM, "main", u"㉗e"),
  (u"★画面のボタンが「💾 上書き保存」（暗号の行がファイルに結び付いている）でも、「💾 物件に保存」へ案内する",
   u'''  const projBtn = !ro && !(_loadedOrigin && _loadedOrigin.fileHandle)''',
   u'''  const projBtn = !ro''', TM, "main", u"㉘e"),
  (u"★ハイブリッド保存の写しに、画面に入れなかった写真を入れない（図面の無い戸別の写しが写真0枚）",
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }   // 写しには画面に入れなかった写真も入れる
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''',
   u'''  if(fromProj){ if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''', TM, "main", u"㉘c"),

  # ---- （G3）2回目の見直しの直し：📥 のあとも覚える・ボタンを描き直す・外れたあとの名前・復元できていない印・暗号の戸別への案内 ----
  (u"★📥 で開いている戸別へ入れたあと、物件から開いた行の覚えを戻さない（そのあと 🧹 未施工にすると、ファイルを選ぶ画面が開く）",
   u'''    _editorProjRow = (projRow === row || rowOpenedFromProject(row)) ? row : null;
''', u'''''', TM, "main", u"㉗i"),
  (u"★📥 で開いている戸別へ入れたあと、ボタンを描き直さない（押せない「💾 上書き保存」のまま）",
   u'''    try { updateOverwriteSaveBtn(); } catch(_){}   // 「💾 物件に保存」を出し直す（applyStateData のときは行が外れていた）
''', u'''''', TM, "main", u"㉗i"),
  (u"★世帯の削除で開いている行が外れても、ボタンを描き直さない（「💾 物件に保存」が押せるまま）",
   u'''  if(_editingRow === row){ _editingRow = null; try { updateOverwriteSaveBtn(); } catch(_){} }   // ボタンを描き直す（版178）
  try { lgClearTouched([key]); } catch(_){}''',
   u'''  if(_editingRow === row) _editingRow = null;
  try { lgClearTouched([key]); } catch(_){}''', TM, "main", u"㉗j"),
  (u"★受付台帳の「一覧から消す」で開いている行が外れても、ボタンを描き直さない",
   u'''          if(_editingRow === row){ _editingRow = null; try { updateOverwriteSaveBtn(); } catch(_){} }   // ボタンを描き直す（版178）
          projTouch();
          renderListTable();
          if(choice === "file")''',
   u'''          if(_editingRow === row) _editingRow = null;
          projTouch();
          renderListTable();
          if(choice === "file")''', TM, "main", u"㉗k"),
  (u"★行が外れたとき、知らせの戸別ファイルの名前を開いた行から作らない（暗号の戸別を 管理番号.json と言う）",
   u'''  const er = _editingRow, r = er || _editorProjRow;''',
   u'''  const er = _editingRow, r = er;''', TM, "main", u"㉘g"),
  (u"★工事調書のまとめ印刷のあと、「写真が復元できていない」印とバナーを戻さない（💾 上書き保存の確かめが出ない）",
   u'''      _editorPhotosStripped = savedStripped; showPhotoStrippedBanner(savedStripped);''',
   u'''''', TM, "main", u"㉘h"),
  (u"★暗号の戸別へ「💾 物件に保存」を案内するとき、ここで足した写真とお客様の欄が入らないことを言わない",
   u'''    + (projBtn ? (hyb ? "戸別ファイル（" + fname + "）へは「💾 物件に保存」で書いてください（図面・積算が入ります）。\\n"''',
   u'''    + (projBtn ? (false ? "戸別ファイル（" + fname + "）へは「💾 物件に保存」で書いてください（図面・積算が入ります）。\\n"''', TM, "main", u"㉘a"),
  (u"★🔐 暗号化保存の写しで、行が外れたら画面に入れなかった写真を足さない（写しが写真0枚）",
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }   // 写しには画面に入れなかった写真も入れる
  const password = await promptPassword({
    title: "🔐 暗号化保存",''',
   u'''  if(fromProj){ editorAddHiddenPhotos(s); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }
  const password = await promptPassword({
    title: "🔐 暗号化保存",''', TM, "main", u"㉘f"),
  (u"★ハイブリッド保存の写しで、行が外れたら画面に入れなかった写真を足さない（写しが写真0枚）",
   u'''  if(fromProj){ editorAddHiddenPhotos(s, true); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }   // 写しには画面に入れなかった写真も入れる
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''',
   u'''  if(fromProj){ editorAddHiddenPhotos(s); if(!saveStateProjConfirm(s, mgmtSafe, fname)) return; }
  const password = await promptPassword({
    title: "🔐🔑 ハイブリッド暗号化保存 (方式C)",''', TM, "main", u"㉘f"),

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
  (u"★開いている戸別かどうかを管理番号だけで見る（番号の無い新しい戸別に番号を入れた写しへ届かない）",
   u'''  if(mk ? !!(M && M._lastDraftKey === mk && draftSameUid(M, model)) : !!(a && a === b)){   // 同じ戸別を開き直した''',
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
   u'''  const mk = model._lastDraftKey ? draftKeyNow(model._lastDraftKey, model._uid) : "";''',
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
