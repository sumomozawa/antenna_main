# -*- coding: utf-8 -*-
# 版175 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メイン・現場入力・受付台帳.html）
#   その１の工事の人に「受付台帳を読み込んだら、その２になっている」と言われた直し。
#   ・物件名の見比べ（pjDiffers：かっこ・全角半角は見ない／その番号で決める／片方だけ番号＝分からない）
#   ・現場入力：物件名の無い台帳・保存先が物件と違うときの知らせと窓・「このままでよい」の覚え書き・帯の ⚠・
#     📁 の候補・取り込みの知らせ・別の物件の地図・会社の絞り込み・起動のときの台帳の新旧・まとめて保存
#   ・メイン：現場用の地図・名前の違うフォルダの知らせ・新しい物件・物件名の無い書き出し・履行報告の その２
#   ・受付台帳.html：取り込んだファイルの物件名を使う
#   受付台帳.html を壊すときは、壊した写しを smoke_v175_main.js の3つ目の引数で渡す（2つ目は本物のメイン）。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
LG = os.environ.get("LG") or os.path.join(ROOT, "antenna_main", "受付台帳.html")
OUTM = os.path.join(HERE, "mut_main.html")
OUTG = os.path.join(HERE, "mut_genba.html")
OUTL = os.path.join(HERE, "mut_lg.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TM, TG = "smoke_v175_main.js", "smoke_v175_genba.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル)  どのファイル＝ "main"／"genba"／"lg"（受付台帳.html）
CASES = [
  # ---- 現場入力：物件名の見比べ ----
  (u"★現場：「その１」「その２」を番号で決めない",
   u'''  if(sx && sy) return sx !== sy;                     // その１ と その２ は別の物件
''', u'''''', TG, "genba"),
  (u"★現場：片方だけ番号でも「違う」と言う（物件A で脅す）",
   u'''  if(sx || sy) return false;                         // 片方にだけ番号がある＝分からない（脅さない）
''', u'''''', TG, "genba"),
  (u"★現場：かっこ・全角半角をそろえない",
   u'''  return String(s == null ? "" : s).normalize("NFKC")
    .replace(''', u'''  return String(s == null ? "" : s)
    .replace(''', TG, "genba"),
  (u"現場：漢数字の「その二」を読まない",
   u'''  if(t < 0) return String(d(v));''', u'''  if(t < 0) return v;''', TG, "genba"),
  (u"現場：漢数字の「その十一」「その二十」を「その十」と読む（版175 見直し）",
   u'''  return String((t > 0 ? d(v[0]) : 1) * 10 + (v.length > t + 1 ? d(v[t + 1]) : 0));''', u'''  return "10";''', TG, "genba"),
  (u"現場：片方がもう片方の一部でも「違う」と言う",
   u'''  return !(x.indexOf(y) >= 0 || y.indexOf(x) >= 0);  // 片方がもう片方の一部なら同じ物件とみる''',
   u'''  return true;''', TG, "genba"),

  # ---- 現場入力：入れる場所を追いかける ----
  (u"★現場：物件名の無い台帳で、自動の「その２/リスト」を残す（版174 に戻す）",
   u'''  if(!newProj){
    const cur0 = saveHintName();''',
   u'''  if(!newProj) return "";
  if(false){
    const cur0 = saveHintName();''', TG, "genba"),
  (u"★現場：物件名の無い台帳で、自分で選んだ名前まで「リスト」に戻す",
   u'''    if(!was) return "";
    saveHintSet("リスト");''', u'''    saveHintSet("リスト");''', TG, "genba"),
  (u"★現場：物件名の無い台帳で「リスト」に戻しても、追いかける印を付けない",
   u'''    try{ localStorage.setItem(LS_SAVEHINT_AUTO, "リスト"); }catch(_){}
''', u'''''', TG, "genba"),
  (u"★現場：名前だけ覚えた PC は物件を追いかけない（版174 に戻す）",
   u'''  if(window.showDirectoryPicker && !saveHintName()) return "";''',
   u'''  if(window.showDirectoryPicker) return "";''', TG, "genba"),

  # ---- 現場入力：保存先が物件と違うか ----
  (u"★現場：保存先の名前を物件と見比べない（いつも「違う」）",
   u'''  if(!savePlaceDiffers(pp, proj)) return null;        // 「リスト」だけ＝どの物件でも正しい
''', u'''''', TG, "genba"),
  (u"★現場：名前1つ（「その２」・物件のフォルダそのもの）は見比べない（版175 見直し）",
   u'''  return pjSonoDiffers(nm, proj);''', u'''  return false;''', TG, "genba"),
  (u"★現場：「このままでよい」と答えた物件でも、また聞く",
   u'''  if(savePlaceOkFor(proj, held)) return null;         // 「このままでよい」と答えた物件
''', u'''''', TG, "genba"),
  (u"★現場：スマホで「いまのまま」を選んでも覚えない",
   u'''    } else if(v === "keep") savePlaceOkSet(mm.proj);
  }
  renderSaveBar();''',
   u'''    }
  }
  renderSaveBar();''', TG, "genba"),
  (u"★現場：PCで「このフォルダのままにする」を選んでも覚えない",
   u'''    if(v === "keep") savePlaceOkSet(mm.proj);
  } else {''',
   u'''    void 0;
  } else {''', TG, "genba"),
  (u"★現場：答えた物件を見ない（別の物件でも、もう聞かない）",
   u'''  return !!(o && o.proj && pjNameKey(o.proj) === pjNameKey(proj) && o.place === savePlaceNow(held));''',
   u'''  return !!(o && o.proj && o.place === savePlaceNow(held));''', TG, "genba"),
  (u"★現場：保存先を変えても前の答えを使う",
   u'''  return !!(o && o.proj && pjNameKey(o.proj) === pjNameKey(proj) && o.place === savePlaceNow(held));''',
   u'''  return !!(o && o.proj && pjNameKey(o.proj) === pjNameKey(proj));''', TG, "genba"),
  (u"★現場：📁 で名前を選んでも、この物件の答えとして覚えない",
   u'''      if(got && proj && !saveDirName()) savePlaceOkSet(proj);
''', u'''''', TG, "genba"),
  (u"★現場：フォルダを覚えた PC で名前だけ選ぶと、フォルダの ⚠ まで消す（版175 見直し）",
   u'''      if(got && proj && !saveDirName()) savePlaceOkSet(proj);''', u'''      if(got && proj) savePlaceOkSet(proj);''', TG, "genba"),
  (u"★現場：📁 でフォルダを選んだあと、物件と違っても確かめない",
   u'''  await savePlaceConfirmAfterPick("later");
}''', u'''
}''', TG, "genba"),
  (u"★現場：まとめて保存で、別の物件のフォルダを選んでも確かめない（版175 見直し）",
   u'''      if(!(await savePlaceConfirmAfterPick("stop"))){ await saveDirRestore(keepDir); setBusy(false); return; }
''', u'''''', TG, "genba"),
  (u"★現場：まとめて保存の確かめで「キャンセル」しても書く（版175 見直し）",
   u'''if(!(await savePlaceConfirmAfterPick("stop"))){ await saveDirRestore(keepDir); setBusy(false); return; }''',
   u'''if(!(await savePlaceConfirmAfterPick("stop"))){ }''', TG, "genba"),
  (u"★現場：まとめて保存で断ったフォルダを、保存先として覚えたままにする（版175 2回目の見直し）",
   u'''{ await saveDirRestore(keepDir); setBusy(false); return; }''', u'''{ setBusy(false); return; }''', TG, "genba"),
  (u"★現場：断ったあと、保存先の印（ep）を戻さない（前の控えが使えなくなる）（版175 2回目の見直し）",
   u'''  _saveDir = k.dir; _saveDirPar = k.par; _saveDirEp = k.ep;''', u'''  _saveDir = k.dir; _saveDirPar = k.par;''', TG, "genba"),
  (u"現場：まとめて保存の前の確かめで、前回のフォルダが物件と違うと言わない（版175 見直し）",
   u'''return (m0 && m0.held) ? (''', u'''return false ? (''', TG, "genba"),
  (u"★現場：フォルダの確かめで OK でも答えを覚えない",
   u'''  if(ok) savePlaceOkSet(mm.proj);
''', u'''''', TG, "genba"),
  # ---- 現場入力：取り込んだあとの窓 ----
  (u"★現場：受付台帳ファイルを取り込んだあと、保存先を確かめない",
   u'''      try{ await savePlaceCheckAfterImport(); }catch(e){ console.warn("保存先の確かめに失敗", e); }''', u'''''', TG, "genba"),
  (u"★現場：地図の窓から（地図なし）台帳を入れたあと、確かめない",
   u'''        toast("受付台帳を取り込みました（" + addedLedger + "件）");
        try{ await savePlaceCheckAfterImport(); }catch(_){}''',
   u'''        toast("受付台帳を取り込みました（" + addedLedger + "件）");''', TG, "genba"),
  (u"★現場：地図の窓から（地図あり）台帳を入れたあと、確かめない",
   u'''  if(addedLedger){ try{ await savePlaceCheckAfterImport(); }catch(_){} }''', u'''''', TG, "genba"),
  (u"★現場：おすすめ（物件 ＞ リスト）を選んでも、追いかける印を付けない",
   u'''      try{ localStorage.setItem(LS_SAVEHINT_AUTO, target); }catch(_){}   // 物件が変わったら、また追いかける
''', u'''''', TG, "genba"),
  (u"★現場：窓で選んだあと帯を描き直さない（⚠ が残る）",
   u'''    } else if(v === "keep") savePlaceOkSet(mm.proj);
  }
  renderSaveBar();
}''',
   u'''    } else if(v === "keep") savePlaceOkSet(mm.proj);
  }
}''', TG, "genba"),

  # ---- 現場入力：帯・📁 の候補・案内 ----
  (u"★現場：帯に other（色）を付けない",
   u'''  const mmCls = mm ? " other" : "";''', u'''  const mmCls = "";''', TG, "genba"),
  (u"★現場：帯に「⚠ 物件が違う」を出さない",
   u'''  const mmTag = mm ? "⚠ 物件が違う" : "変更";''', u'''  const mmTag = "変更";''', TG, "genba"),
  (u"現場：帯の説明（押す前の吹き出し）に物件を出さない",
   u'''  const mmTip = mm ? ("受付台帳の物件「" + esc(mm.proj) + "」とは違う名前です。") : "";''',
   u'''  const mmTip = "";''', TG, "genba"),
  (u"★現場：帯の ⚠ の札をうんと長くする（320px で横にはみ出す）",
   u'''  const mmTag = mm ? "⚠ 物件が違う" : "変更";''',
   u'''  const mmTag = mm ? "⚠ 物件が違う（受付台帳の物件とは違う名前のフォルダです）" : "変更";''', TG, "genba"),
  (u"★現場：📁 の「前に使った名前」に別の物件（その２）も出す",
   u'''    saveHintHistory().filter(notBare).filter(sameProj).forEach(''',
   u'''    saveHintHistory().filter(notBare).forEach(''', TG, "genba"),
  (u"★現場：同じ名前を選び直すと、追いかける印を消す",
   u'''        : (got === now && prevAuto !== null && prevAuto !== "\\u0000off") ? prevAuto
''', u'''''', TG, "genba"),
  (u"現場：📁 の「いま覚えている名前」に ⚠ を添えない",
   u'''nowOther ? "いま覚えている名前（⚠ 受付台帳の物件と違います）" : "いま覚えている名前"''',
   u'''"いま覚えている名前"''', TG, "genba"),
  (u"現場：保存のあとの案内で ⚠ を言わない",
   u'''」フォルダのすぐ下には入れません。管理番号.json が並んでいるフォルダです）"
    + (mm ? (''', u'''」フォルダのすぐ下には入れません。管理番号.json が並んでいるフォルダです）"
    + (false ? (''', TG, "genba"),
  (u"現場：名前1つの入れる場所で、保存のあとの案内に ⚠ を言わない（版175 見直し）",
   u'''」フォルダ★\\n（管理番号.json が並んでいるフォルダです）"
    + (mm ? (''', u'''」フォルダ★\\n（管理番号.json が並んでいるフォルダです）"
    + (false ? (''', TG, "genba"),
  (u"★現場：聞く窓・知らせの窓が地図の画面の裏に隠れる（版175 見直し）",
   u'''  #pick-modal, #type-modal, #ui-dialog{ z-index:10000; }
''', u'''''', TG, "genba"),
  (u"★現場：聞く窓が「保存中…」の暗幕より下（保存の途中の質問に答えられない）（版175 2回目の見直し）",
   u'''  #pick-modal, #type-modal, #ui-dialog{ z-index:10000; }''', u'''  #pick-modal, #type-modal, #ui-dialog{ z-index:120; }''', TG, "genba"),
  (u"現場：知らせ（トースト）が地図の画面の裏に隠れる（版175 2回目の見直し）",
   u'''opacity:0; z-index:115; pointer-events:none;''', u'''opacity:0; z-index:70; pointer-events:none;''', TG, "genba"),
  (u"★現場：取り込んだあと帯を描き直さない（物件が合っても ⚠ が残る）（版175 見直し）",
   u'''  try{ renderSaveBar(); }catch(_){}   // 物件が替わると ⚠ の有無も変わるので、いつも描き直す（版175）
''', u'''''', TG, "genba"),
  (u"★現場：物件のフォルダそのものを覚えた PC で、帯に ⚠ を出さない（版175 見直し）",
   u'''    ? '<button type="button" class="sb-dest' + mmCls + '" id="sb-dest" title="' + mmTip + '「保存」を押すと、「' + esc(dest)''',
   u'''    ? '<button type="button" class="sb-dest" id="sb-dest" title="' + mmTip + '「保存」を押すと、「' + esc(dest)''', TG, "genba"),
  (u"★現場：名前1つの入れる場所で、帯に ⚠ を出さない（版175 見直し）",
   u'''      ? '<button type="button" class="sb-dest' + mmCls + '" id="sb-dest" title="' + mmTip + '入れる場所： 「' + esc(saveHintName())''',
   u'''      ? '<button type="button" class="sb-dest" id="sb-dest" title="' + mmTip + '入れる場所： 「' + esc(saveHintName())''', TG, "genba"),
  # ---- 現場入力：取り込みの知らせ ----
  (u"★現場：知らせに「前の物件から替わりました」を出さない",
   u'''((beforeProj && pjDiffers(beforeProj, project)) ? "\\n（前に取り込んでいた物件から替わりました）" : "")''', u'''""''', TG, "genba"),
  (u"★現場：知らせに「物件名が入っていません」を出さない",
   u'''            : "\\n物件：（この受付台帳には物件名が入っていません）")''', u'''            : "")''', TG, "genba"),
  (u"★現場：PCの知らせに「保存先：」を出さない",
   u'''        + (saveDirName() ? ("\\n保存先：「"+(saveDirPlace() || saveDirName())+"」")''',
   u'''        + (saveDirName() ? ""''', TG, "genba"),
  (u"★現場：知らせに ⚠（保存先が物件と違う）を出さない",
   u'''        + (savePlaceMismatch() ? ("\\n⚠ " + (saveDirName() ? "保存先" : "入れる場所") + "が、この物件と違います（このあと選べます）") : "")''', u'''''', TG, "genba"),
  (u"現場：知らせに ⚠（物件名が無いので確かめて）を出さない",
   u'''        + ((!project && !saveDirName() && !window.showDirectoryPicker && saveHintParts().outer) ? "\\n⚠ 物件名が無いので、入れる場所が合っているか確かめてください" : "")''', u'''''', TG, "genba"),

  # ---- 現場入力：別の物件の地図 ----
  (u"★現場：知らせに「この端末の地図は別の物件」を出さない",
   u'''        + ((!gotMap && mapPackOtherProj()) ? "\\n⚠ この端末の地図は、別の物件のものです（このファイルに地図は入っていませんでした）" : "")''', u'''''', TG, "genba"),
  (u"★現場：地図の見出しに「⚠ 別の物件の地図」を付けない",
   u'''function mapSubText(t){ return (mapPackOtherProj() ? "⚠ 別の物件の地図／" : "") + (t || ""); }''',
   u'''function mapSubText(t){ return (t || ""); }''', TG, "genba"),
  (u"★現場：地図の物件を受付台帳と見比べない（同じ物件の地図でも ⚠）",
   u'''  return !!(mp && pjDiffers(mp, rcProjName()));''', u'''  return !!mp;''', TG, "genba"),

  # ---- 現場入力：会社の絞り込み・起動・まとめて保存 ----
  (u"★現場：前の物件の会社で絞り込んだまま（一覧が全部隠れる）",
   u'''  try{ if(norm.length && _rcCtr !== "all" && !norm.some(r => rcCtrOf(r) === _rcCtr)) rcCtrSet("all"); }catch(_){}''', u'''''', TG, "genba"),
  (u"★現場：新しい台帳に居る会社でも絞り込みを外す",
   u'''!norm.some(r => rcCtrOf(r) === _rcCtr)) rcCtrSet("all");''', u'''true) rcCtrSet("all");''', TG, "genba"),
  (u"★現場：起動のとき「| 0」で新旧を比べる（古い その２ の台帳が戻る）",
   u'''    const a = Number(rec.data.importedAt) || 0, b = (cur && Number(cur.importedAt)) || 0;''',
   u'''    const a = rec.data.importedAt | 0, b = (cur && cur.importedAt | 0) || 0;''', TG, "genba"),
  (u"★現場：まとめて保存の前に、いまの台帳に無い戸別を言わない",
   u'''head + listTxt + otherTxt + outsideTxt + missTxt''', u'''head + listTxt + otherTxt + missTxt''', TG, "genba"),
  (u"現場：台帳にある戸別まで「台帳に無い」と言う",
   u'''files.filter(f => !rcNoSet[draftNoKey(f.no)])''', u'''files.filter(f => true)''', TG, "genba"),

  # ---- メイン：物件名の見比べ ----
  (u"★メイン：「その１」「その２」を番号で決めない",
   u'''  if(sx && sy) return sx !== sy;                     // その１ と その２ は別の物件
''', u'''''', TM, "main"),
  (u"★メイン：片方だけ番号でも「違う」と言う",
   u'''  if(sx || sy) return false;                         // 片方にだけ番号がある＝分からない（脅さない）
''', u'''''', TM, "main"),
  (u"★メイン：かっこ・全角半角をそろえない",
   u'''  return String(s == null ? "" : s).normalize("NFKC")
    .replace(''', u'''  return String(s == null ? "" : s)
    .replace(''', TM, "main"),
  (u"メイン：漢数字の「その一」「その二」を読まない",
   u'''  const m = /その([0-9]+|[一二三四五六七八九]?十[一二三四五六七八九]?|[一二三四五六七八九])/.exec''', u'''  const m = /その([0-9]+)/.exec''', TM, "main"),
  (u"メイン：漢数字の「その十一」「その二十」を「その十」と読む（版175 見直し）",
   u'''  return String((t > 0 ? d(v[0]) : 1) * 10 + (v.length > t + 1 ? d(v[t + 1]) : 0));''', u'''  return "10";''', TM, "main"),
  (u"★メイン：前の物件の保存が終わらないうちに、新しい物件に替える（版175 2回目の見直し）",
   u'''      try { rtJoinForCurrentProject(); } catch(_){}
      return;''', u'''      try { rtJoinForCurrentProject(); } catch(_){}''', TM, "main"),
  (u"★メイン：新しい物件の持出明細PDFの見出しに、前の物件の工事名を残す（版175 2回目の見直し）",
   u'''      if(sp && sp.project){ sp.project = ""; lsSet(SFP_PREF_KEY, JSON.stringify(sp)); }''', u'''''', TM, "main"),
  (u"★メイン：空の新しい物件に履行報告を入れない（開き直すと端末の控えが戻る）（版175 2回目の見直し）",
   u'''    try { p.hakou = hkCapture(); } catch(_){}''', u'''''', TM, "main"),
  (u"★メイン：取り込みの途中で物件が替わっても、前の物件を入れる（画面が その２ に戻る）（版175 2回目の見直し）",
   u'''    if(!_currentProject || _currentProject.id !== pullPid || _projFileHandle !== fh) return;''', u'''''', TM, "main"),
  (u"★メイン：再接続の途中で物件が替わっても、前の物件の共有ファイルをつなぐ（版175 2回目の見直し）",
   u'''  if(loadedProject && loadedProject.id && (!_currentProject || _currentProject.id !== loadedProject.id)) return "stale";''', u'''''', TM, "main"),
  (u"メイン：片方がもう片方の一部でも「違う」と言う",
   u'''  return !(x.indexOf(y) >= 0 || y.indexOf(x) >= 0);  // 片方がもう片方の一部なら同じ物件とみる''',
   u'''  return true;''', TM, "main"),

  # ---- メイン：現場用の地図 ----
  (u"★メイン：物件が替わっても地図のシートを読み直さない（その２ の地図が その１ の現場用に入る）",
   u'''    if(!sheets || !sheets.length || sheetsCtx !== ctxNow){''', u'''    if(!sheets || !sheets.length){''', TM, "main"),
  (u"メイン：物件が替わっても、前の物件のシートを開いたままにする",
   u'''      if(sheetsCtx !== ctxNow){ current = null; sheets = []; }''', u'''      if(sheetsCtx !== ctxNow){ sheets = []; }''', TM, "main"),

  # ---- メイン：名前の違うフォルダ ----
  (u"★メイン：名前の違うフォルダでも ⚠ を出さない",
   u'''  const other = !!(fn && fn.normalize("NFKC") !== "リスト" && pjDiffers(fn, _currentProject.name));''',
   u'''  const other = false;''', TM, "main"),
  (u"メイン：「リスト」というフォルダも物件名と比べる（番号の無い物件で脅す）",
   u'''  const other = !!(fn && fn.normalize("NFKC") !== "リスト" && pjDiffers(fn, _currentProject.name));''',
   u'''  const other = !!(fn && pjDiffers(fn, _currentProject.name));''', TM, "main"),
  (u"★メイン：📁 フォルダの道で、フォルダの名前を渡さない",
   u'''  const loadMode = resolveListLoadWithProject(dirHandle && dirHandle.name);''',
   u'''  const loadMode = resolveListLoadWithProject();''', TM, "main"),

  # ---- メイン：新しい物件 ----
  (u"★メイン：物件を開いたまま新しい物件を作ると、名前の欄に その２ が入っている",
   u'''hadProj ? "" : (_listSelectedFolderName || "")''', u'''_listSelectedFolderName || ""''', TM, "main"),
  (u"メイン：物件を開いていないときも、名前の欄にフォルダ名を入れない（今までと違う）",
   u'''hadProj ? "" : (_listSelectedFolderName || "")''', u'''""''', TM, "main"),
  (u"メイン：一覧を入れるかの確認で、開いている物件の名前を言わない",
   u'''    absorb = confirm(hadProj''', u'''    absorb = confirm(false''', TM, "main"),
  (u"★メイン：新しい物件に、前の物件（その２）の履行報告を持ち込む",
   u'''    if(fresh){ try { hkAdopt({}); } catch(_){} }''', u'''    if(false){ try { hkAdopt({}); } catch(_){} }''', TM, "main"),
  (u"★メイン：物件なしで新しい物件を作るとき、端末に残った その２ の履行報告を持ち込む（版175 見直し）",
   u'''    let fresh = hadProj;
    if(!fresh){''', u'''    let fresh = hadProj;
    if(false){''', TM, "main"),
  (u"メイン：物件なしで新しい物件を作るとき、工事名の無い端末の履行報告まで捨てる（版175 見直し）",
   u'''fresh = !!(dn && pjDiffers(dn, p.name));''', u'''fresh = true;''', TM, "main"),
  (u"★メイン：履行報告の欠けた所を埋めない（新しい物件の履行報告の画面が開けない）（版175 見直し）",
   u'''  if(!_hk){
    let o = null;''', u'''  if(_hk) return _hk;
  if(!_hk){
    let o = null;''', TM, "main"),
  (u"★メイン：新しい物件を作る前に、開いていた物件の直しを保存しない（版175 見直し）",
   u'''    if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; try { await projSaveNow(); } catch(_){} }''',
   u'''    if(_projSaveTimer){ clearTimeout(_projSaveTimer); _projSaveTimer = null; }''', TM, "main"),
  (u"★メイン：新しい物件が、前の物件の共有ファイルのつながりを持ったまま（版175 見直し）",
   u'''    _projFileHandle = null; _projDirHandle = null; _projPendingHandle = null;
''', u'''''', TM, "main"),
  # ---- メイン：物件名の無い書き出し ----
  (u"★メイン：物件名の無い書き出しでも知らせない",
   u'''  if(String(proj || "").trim()) return "";
  return "\\n\\n⚠''', u'''  return "";
  return "\\n\\n⚠''', TM, "main"),
  (u"メイン：物件を開いていても「物件名が入っていません」と言う",
   u'''  if(String(proj || "").trim()) return "";
  return "\\n\\n⚠''', u'''  return "\\n\\n⚠''', TM, "main"),
  (u"★メイン：「📦 現場用」の知らせに付けない",
   u'''      + "1回の取り込みで、受付台帳と地図の両方が入ります。"
      + genbaNoProjNote(ledger.project));''',
   u'''      + "1回の取り込みで、受付台帳と地図の両方が入ります。");''', TM, "main"),
  (u"メイン：受付台帳の書き出し（ダウンロード）の知らせに付けない",
   u'''「🗒 受付台帳」から取り込んでください。" + genbaNoProjNote(projName));''',
   u'''「🗒 受付台帳」から取り込んでください。");''', TM, "main"),
  (u"メイン：受付台帳の書き出し（保存先を選ぶ）の知らせに付けない",
   u'''「📥 台帳を取り込み」から取り込む" + genbaNoProjNote(projName));''',
   u'''「📥 台帳を取り込み」から取り込む");''', TM, "main"),

  # ---- メイン：履行報告 ----
  (u"★メイン：履行報告の工事名の見本を「その２」に戻す",
   u'''placeholder="' + escapeHtml((typeof _currentProject !== "undefined" && _currentProject && _currentProject.name) || "例：〇〇地区 アンテナ改修工事") + '"''',
   u'''placeholder="令和８年度戸別受信設備設置工事（その２）"''', TM, "main"),
  (u"★メイン：履行報告の初期値（その２ の数字）の知らせを出さない",
   u'''+ (hkSono2Left(h).length ? (''', u'''+ (false ? (''', TM, "main"),
  (u"メイン：その２ の物件でも初期値の知らせを出す",
   u'''  if(pjSonoNo(pjNameKey(_currentProject.name)) === "2") return [];
''', u'''''', TM, "main"),
  (u"メイン：請負金額を直しても、知らせが「請負金額」を言う",
   u'''  if(hd.net === 27200000) out.push("請負金額");''', u'''  out.push("請負金額");''', TM, "main"),
  (u"メイン：請負金額・着手・完成を直しても知らせが消えない（版175 見直し）",
   u'''  if(!out.length) return out;''', u'''  if(!out.length) out.push("着手");''', TM, "main"),
  (u"メイン：知らせが「段階の予定」を言わない（版175 見直し）",
   u'''  if(!Object.keys(sp).some(k => sp[k] && (sp[k].from || sp[k].to))) out.push("段階の予定");''', u'''''', TM, "main"),
  (u"★メイン：共有ファイルから同じ物件を開き直しても、現場用に前の地図の中身が入る（版175 見直し）",
   u'''    } finally { window.__mapRestoring = __wasRestoring; sheetsCtx = ""; }''',
   u'''    } finally { window.__mapRestoring = __wasRestoring; }''', TM, "main"),
  # ---- 受付台帳.html ----
  (u"★台帳：取り込んだファイルの物件名を使わない（その２ のまま書き出す）",
   u'''      if(!cur){ _projName = fp; touch(); }''', u'''      if(!cur){ }''', TM, "lg"),
  (u"★台帳：物件名を替えても保存しない（開き直すと その２ に戻る）",
   u'''        _projName = fp; touch();
      }''', u'''        _projName = fp;
      }''', TM, "lg"),
  (u"台帳：違う物件名でも聞かずに替える",
   u'''        if(!confirm("取り込むファイルの物件は「"''', u'''        if(false && !confirm("取り込むファイルの物件は「"''', TM, "lg"),
  (u"★台帳：別の工事の台帳で「キャンセル」しても取り込む（版175 見直し）",
   u'''キャンセル＝取り込まない")) return;''', u'''キャンセル＝取り込まない")) {}''', TM, "lg"),
  (u"★台帳：片方にだけ番号があるとき、物件名を変えるか聞かない（その２ の名前が黙って残る）（版175 2回目の見直し）",
   u'''      else if(pjNameKey(fp) !== pjNameKey(cur)){''', u'''      else if(false){''', TM, "lg"),
  (u"台帳：書き方が違うだけ（同じ物件）でも聞く（版175 見直し）",
   u'''      else if(pjDiffers(fp, cur)){''', u'''      else if(true){''', TM, "lg"),
  (u"台帳：物件名が空でも聞く",
   u'''      if(!cur){ _projName = fp; touch(); }
      else if(pjDiffers(fp, cur)){''', u'''      if(false){ }
      else if(true){''', TM, "lg"),
  (u"台帳：同じ物件名でも聞く",
   u'''if(fp && fp !== cur){''', u'''if(fp){''', TM, "lg"),
]

import sys as _s
_only = _s.argv[1] if len(_s.argv) > 1 else ""
_todo = [c for c in CASES if not _only or _only in c[0]]

def _run(test, args):
    r = subprocess.run(["node", SP + test] + ["file://" + a for a in args], capture_output=True, text=True, timeout=900)
    return r, [l for l in (r.stdout + r.stderr).splitlines() if l.startswith("- ")]

# 土台（壊す前）が緑でなければ、壊したときの赤は当てにならない。先に確かめて、赤なら止める。
_need = []
if any(c[4] in ("main", "lg") for c in _todo): _need.append((TM, [MAIN, LG]))
if any(c[4] == "genba" for c in _todo): _need.append((TG, [GENBA]))
for test, args in _need:
    r, last = _run(test, args)
    if r.returncode != 0:
        print("土台が赤（壊す前から試験が通らない）:", test, "|", " / ".join(x[:160] for x in last[:3]))
        print("=== 土台が赤のため止めました ===")
        _s.exit(1)
    print("土台 緑:", test)

red = 0; n_run = 0
for name, old, new, test, which in _todo:
    n_run += 1
    src, OUT = {"genba": (GENBA, OUTG), "main": (MAIN, OUTM), "lg": (LG, OUTL)}[which]
    base = io.open(src, encoding="utf-8", newline="").read()
    fix = CR if "\r\n" in base else LF          # 受付台帳.html は LF のまま
    o, n = fix(old), fix(new)
    if base.count(o) != 1:
        print("SKIP（目印 %d 件）: %s" % (base.count(o), name)); continue
    io.open(OUT, "w", encoding="utf-8", newline="").write(base.replace(o, n))
    args = [MAIN, OUT] if which == "lg" else [OUT]
    r, last = _run(test, args)
    isred = r.returncode != 0
    if isred: red += 1
    print(("赤 ✓" if isred else "緑 ✗（検出できていない）"), name, "|", " / ".join(x[:110] for x in last[:1]))
print("=== 赤 %d / %d ===" % (red, n_run))
