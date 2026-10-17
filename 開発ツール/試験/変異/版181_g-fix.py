# -*- coding: utf-8 -*-
# 版181（組 g-fix）変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（現場入力）
#   ・📮 事務所に預ける（版176 の見直し）：同じ番号の下書き2つの預けの名前・時刻を分ける／端末の中だけかもしれないフォルダに
#     置いたとき「事務所に預けました」と言い切らない／共有をやめたら元の窓を出し直す／何件もダウンロードしたときの注意／
#     フォルダを選ぶ画面を閉じたときに黙らない
#   ・写真の取り込み（版178 の見直し）：切り替えの途中で読み終わった1枚を下書きにもすぐ足す（画面が開いていれば画面ごと書く）／
#     下書きを読んで直して書くところ（保存済の印・台帳の入れ直し・全部保存し直す・📥・📮 の印）を写真の控えと同じ列に並べる／
#     別の下書きに入れた知らせは「履歴」と言う
#   ・追加で直したもの：台帳の印だけの戸別を数えない／引き継いだ印だけで「入力あり」にしない／控えの無い戸別で PCの値が消えるときは
#     まとめて保存で書かない／地図の画面の台帳の取り込みでも下書きへ入れ直す／履歴の ✏️ は回数で／ほかの端末の戸別を保存先を選ぶ画面で
#     書かない／両方で直した欄を言う・PCがあとで直した配線の指定・注記を戻さない／「もう1つ増えます」「上書きします」
#   場面を絞って速くする（SCENE と ONLY に場面の記号を渡す）。名前の一部を引数に渡すとそれだけ走る（「現場」で全部）。
import io, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, "..") + os.sep
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MAIN = os.environ.get("MAIN") or os.path.join(ROOT, "antenna_main", "index.html")
GENBA = os.environ.get("GENBA") or os.path.join(ROOT, "antenna_genba", "index.html")
OUTM = os.path.join(HERE, "mut_main_g-fix.html")
OUTG = os.path.join(HERE, "mut_genba_g-fix.html")
CR = lambda x: x.replace("\r\n", "\n").replace("\n", "\r\n")
LF = lambda x: x.replace("\r\n", "\n")
TG = "smoke_v181_g_fix_genba.js"

# (名前, 壊す前, 壊した後, 試験, どのファイル, 場面)  どのファイル＝ "main"／"genba"。場面＝その試験の場面の記号
CASES = [
  # ======== 📮 事務所に預ける（版176 の見直し） ========
  (u"★同じ管理番号の下書き2つの預けを、同じ時刻（名前・_side.at）で作る（事務所で2つ目がまとまらない）",
   u'''      for(let i = 0; i < 600 && usedNames.has(sideFileName(m && m.chosho_mgmt_no, new Date(t))); i++) t += 1000;
''', u'''''', TG, "genba", u"①"),
  (u"★端末の中だけかもしれないフォルダに置いただけなのに「📮 事務所に預けました」と言い切る",
   u'''  const dev = !!r.dev;''', u'''  const dev = false;''', TG, "genba", u"②a"),
  (u"★「📤 共有でも渡す」で共有の画面を閉じたら、何も出さずに終わる（「預け済」のまま）",
   u'''      } else { sideShowResult(info); return; }''', u'''      } else return;''', TG, "genba", u"②a"),
  (u"★物件の違う端末の中のフォルダに預けの名前で置いた知らせを ⚠ にしない",
   u'''stay: true, side: true, warn: devP,''', u'''stay: true, side: true, warn: false,''', TG, "genba", u"②c"),
  (u"★履歴から何件もダウンロードしたときに、ブラウザが途中で止めることを言わない",
   u'''sideRestNote(items, done) + sideDlManyNote(done) };''', u'''sideRestNote(items, done) };''', TG, "genba", u"③a"),
  (u"★まとめて保存で預けを何件もダウンロードしたときに、ブラウザが途中で止めることを言わない",
   u'''restNote + (shared ? "" : sideDlManyNote(sideDone)));''', u'''restNote);''', TG, "genba", u"③b"),
  (u"★フォルダを選ぶ画面を閉じたら、いつも何も言わずに終わる（保存の窓からでも）",
   u'''        if(!fromSave && !isAndroidLike()) return null;     // 選ぶのをやめた''', u'''        return null;''', TG, "genba", u"④a"),
  (u"★帯の 📁 でフォルダを選ぶ画面を閉じたら、Android でも何も言わずに終わる",
   u'''        if(!fromSave && !isAndroidLike()) return null;     // 選ぶのをやめた''', u'''        if(!fromSave) return null;''', TG, "genba", u"④b"),
  (u"★PC で帯の 📁 を自分で閉じただけでも窓を出す（出しすぎ）",
   u'''        if(!fromSave && !isAndroidLike()) return null;     // 選ぶのをやめた''', u'''        if(false) return null;''', TG, "genba", u"④c"),
  # ======== 写真の取り込み（版178 の見直し） ========
  (u"★画面に開いている戸別の写真を、400ms あとの控えまで下書きに足さない（切り替えの途中の1枚が消える）",
   u'''    if(adds && model._lastDraftKey) return await photoKeepQueue(() => persistModel(model, added, tag));
    return !adds;''', u'''    return true;''', TG, "genba", u"⑤a,⑤b,⑤c"),
  (u"★開き直した写し（同じ戸別を開き直した）に届いた写真を、下書きにすぐ足さない（そこから移る途中の1枚が消える）",
   u'''    if(adds) return await photoKeepQueue(() => persistModel(model, added, tag));   // 下書きにもすぐ足す（上と同じ・版181）
''', u'''''', TG, "genba", u"⑤r"),
  (u"★写真の控えで、画面に開いている下書きを画面の中身ではなく読んだ下書きで書く（切り替える直前の直しを戻す）",
   u'''      const open = (M && Array.isArray(M.chosho_photos)''', u'''      const open = null && (M && Array.isArray(M.chosho_photos)''', TG, "genba", u"⑤d"),
  (u"★まとめて保存の「保存済」の印付けを、写真の控えと同じ列に並べない",
   u'''function markDraftSavedFor(key, model, opt){ return photoKeepQueue(() => markDraftSavedFor0(key, model, opt)); }''',
   u'''function markDraftSavedFor(key, model, opt){ return markDraftSavedFor0(key, model, opt); }''', TG, "genba", u"⑥a"),
  (u"★受付台帳の入れ直しを、写真の控えと同じ列に並べない",
   u'''    if(await photoKeepQueue(async () => {
    const rec = await draftRecNow(rec0);''', u'''    if(await (async f => f())(async () => {
    const rec = await draftRecNow(rec0);''', TG, "genba", u"⑥b"),
  (u"★全部保存し直すの台帳の入れ直しを、写真の控えと同じ列に並べない",
   u'''        if(await photoKeepQueue(async () => {
        const rec = await draftRecNow(byNo[no]);''', u'''        if(await (async f => f())(async () => {
        const rec = await draftRecNow(byNo[no]);''', TG, "genba", u"⑥c"),
  (u"★📥 の印の引き継ぎ（開いていない戸別）を、写真の控えと同じ列に並べない",
   u'''    if(isOpen) await apply(); else await photoKeepQueue(apply);''', u'''    await apply();''', TG, "genba", u"⑥d"),
  (u"★預けた印付けを、写真の控えと同じ列に並べない",
   u'''  return await photoKeepQueue(() => markDraftSidedFor0(model, how, sentSig));''',
   u'''  return await markDraftSidedFor0(model, how, sentSig);''', TG, "genba", u"⑥e"),
  (u"★別の下書きに入れた知らせが、画面に無い「下書き一覧」を案内する",
   u'''      + "「履歴」に同じ管理番号の下書きが2つ出ています。"''', u'''      + "「下書き一覧」に同じ管理番号の下書きが2つ出ています。"''', TG, "genba", u"⑦"),
  # ======== 追加で直したもの ========
  (u"★受付台帳の印が付いているだけの戸別（開いただけ）を「まだ保存していない」に数える",
   u'''     この端末で付けた印（🚩 工程）は「入力した」（touched）になるので、ここには来ない。 */
  return true;''', u'''     この端末で付けた印（🚩 工程）は「入力した」（touched）になるので、ここには来ない。 */
  return !flowAny(info.flow) || !!info.other;''', TG, "genba", u"⑧"),
  (u"★引き継いだ印だけで「この端末で入力した」にする（開いている戸別・開いていない戸別）",
   u'''  if(changed){ m._rev = (m._rev | 0) + 1; }''', u'''  if(changed){ m._touched = true; m._rev = (m._rev | 0) + 1; }''', TG, "genba", u"⑨a,⑨b"),
  (u"★📥 で開いていない戸別の下書きの「入力あり」を立てる",
   u'''rec.touched = (rec.model._touched !== false);''', u'''rec.touched = true;''', TG, "genba", u"⑨a"),
  (u"★控えの無い戸別で PCのファイルの値が消えるのに、まとめて保存が聞かずに書く",
   u'''            if(lostK.length){''', u'''            if(false){''', TG, "genba", u"⑩a"),
  (u"★PCのファイルの値が台帳と同じ（この端末だけが直した）でも、まとめて保存で書かずに残す（止めすぎ）",
   u'''              if(rcN && baseHas(rcN, k) && nz(rcN.state[k]) === nz(cf0.primary[k])) return false;   // ファイル＝台帳＝この端末だけが直した
''', u'''''', TG, "genba", u"⑩b"),
  (u"★PCのファイルの欄が空（何も消えない）でも、まとめて保存で書かずに残す（止めすぎ）",
   u'''              if(!(k in cf0.primary) || !nz(cf0.primary[k])) return false;              // ファイルの欄が空＝何も消えない''',
   u'''              if(!(k in cf0.primary)) return false;''', TG, "genba", u"⑩b"),
  (u"★地図の画面で台帳を入れても、下書きへ入れ直さない",
   u'''      if(addedLedger){ try{ await receptionApplyToDrafts(); }catch(e){ console.warn("下書きへの反映に失敗", e); } }''', u'''''', TG, "genba", u"⑪"),
  (u"★履歴の ✏️ を時刻で決める（保存のあと別の戸別を開いただけで ✏️）",
   u'''      const badge = d.fileSavedAt ? (editedAfter ? "✏️ " : (sided ? "📮 " : "💾 ")) : "";''',
   u'''      const badge = (d.fileSavedAt && d.fileSavedAt >= (d.savedAt||0)) ? (sided ? "📮 " : "💾 ") : (d.fileSavedAt ? "✏️ " : "");''', TG, "genba", u"⑫"),
  (u"★フォルダを覚えていない PC で、ほかの端末の戸別の確かめが「写真は消えません」と言い、保存先を選ぶ画面の道へ回す",
   u'''  if(!dir0 && route !== "share" && window.showSaveFilePicker){''', u'''  if(false){''', TG, "genba", u"⑬a,⑬b"),
  (u"★確かめの窓を通らない道で、ほかの端末の戸別の保存先を選ぶ画面を開く（2つ目の歯止め）",
   u'''      if(M._otherFile){
        _lastSaveInfo = { title: "⚠ ほかの端末も保存している戸別なので、保存していません"''', u'''      if(false){
        _lastSaveInfo = { title: "⚠ ほかの端末も保存している戸別なので、保存していません"''', TG, "genba", u"⑬a"),
  (u"★両方で直してこの端末の内容にした欄を覚えない（知らせで言わない）",
   u'''      out.both.push(label(k));                                      // 両方で直した＝この端末の内容にした（知らせる・版181）
''', u'''''', TG, "genba", u"⑭a,⑭c"),
  (u"★配線の指定を、控えで3つ見比べない（PCがあとで直した・消した指定が戻る）",
   u'''    if(bMap){''', u'''    if(false && bMap){''', TG, "genba", u"⑭b"),
  (u"★図面の注記を、控えで3つ見比べない（PCがあとで直した・消した注記が戻る）",
   u'''    if(bA && !noId){''', u'''    if(false && bA && !noId){''', TG, "genba", u"⑭b"),
  (u"★フォルダへ書く道でも「同じ戸別のファイルがもう1つ増えます」と言う",
   u'''            + (againByDir ? "（保存先の 管理番号.json を読み合わせてから書き直します。ファイルは増えません）"''',
   u'''            + (false ? "（保存先の 管理番号.json を読み合わせてから書き直します。ファイルは増えません）"''', TG, "genba", u"⑮"),
  (u"★保存バーの 📁 の説明が「管理番号.json を上書きします」と言う",
   u'''      + '」の中の 管理番号.json に書きます（同じ名前のファイルがあれば、読み合わせてから書き直します。PCの写真は残ります）。押すと保存先を選び直せます">📁\\u00a0<span class="sb-dest-n">'
''', u'''      + '」の中の 管理番号.json を上書きします。押すと保存先を選び直せます">📁\\u00a0<span class="sb-dest-n">'
''', TG, "genba", u"⑮"),
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
for which, test, src in (("genba", TG, GENBA),):
    sc = ",".join(sorted(set(x for c in _todo if c[4] == which and c[3] == test for x in c[5].split(","))))
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
