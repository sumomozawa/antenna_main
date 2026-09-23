# -*- coding: utf-8 -*-
# 版165 変異試験: 1箇所ずつ壊して、試験が赤くなるか確かめる（メインと現場入力）
#
# ここに入れていない直し（わざと外したもの）
#  ・photoFitForStorage の最後の「足したあとで大きさを確かめる」
#    → 手前で Exif のぶんを空けているので、ここだけ壊しても出来上がりは目安の内に収まる。
#      逆に「空ける」ほうを壊すと、この確かめが働いて Exif を捨てる＝日時が消えるので赤くなる。
#      つまり2つで1つの砦。下の「★撮った日時のぶんを空けずに縮める」で両方を見ている。
#  ・「既設2分配器のときは積算に足さない」の if
#    → exist_2sp は部材表（PARTS）に無いので、足そうとしても何も起きない（到達不能）。
#      代わりに「既設かどうかの見分け」を壊して、図面と金額の両方で見る。
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
  # ---- 保安器の所の既設2分配器 ----
  (u"★「既設2分配器（流用）」を選べなくする",
   u'''              <option value="exist_2sp">既設2分配器（流用・費用なし）</option>\r\n''',
   u'''''', "smoke_v165_main.js", "main"),
  (u"★既設かどうかを見分けない（もとからある物にお金が付く）",
   u'''  const spExisting = (sp === FA_SP_EXISTING);''',
   u'''  const spExisting = false;''', "smoke_v165_main.js", "main"),
  (u"★既設の分配器を「新規（赤）」で図面に出す",
   u'''        { id: faPt.spExisting ? "" : faPt.sp, existing: faPt.spExisting,''',
   u'''        { id: faPt.sp, existing: false,''', "smoke_v165_main.js", "main"),
  (u"★図面に「既設」と書かない（新しく買う物に見える）",
   u'''      const faSpLabel = faPt.spExisting ? "2分配器\\n(既設)"''',
   u'''      const faSpLabel = false ? "2分配器\\n(既設)"''', "smoke_v165_main.js", "main"),
  (u"★現場入力で「既設2分配器（流用）」を選べなくする",
   u'''["exist_2sp","既設2分配器（流用）"],''', u'''''',
   "smoke_v165_genba.js", "genba"),

  # ---- 写真：撮った日時のぶんを空けてから縮める ----
  (u"★撮った日時のぶんを空けずに縮める（1MBを超える／保存のたび画質が落ちる）",
   u'''  const room = PHOTO_FIT_MAX_BYTES - (carry ? carry.length : 0);''',
   u'''  const room = PHOTO_FIT_MAX_BYTES;''', "smoke_v165_main.js", "main"),
  (u"★向きの印を直せないのに、日時を付ける（縦の写真が横倒しになる）",
   u'''    if(!photoExifClearOrientation(seg)) return outDataUri; // 向きを直せない＝付けない（横倒しになる）''',
   u'''    photoExifClearOrientation(seg);''', "smoke_v165_main.js", "main"),
  (u"★見慣れない書き方の向きの印を、そのまま書き替える",
   u'''        if(u16(e + 2) !== 3 || u32(e + 4) !== 1) return false;   // 見慣れない書き方＝触らない''',
   u'''        void 0;''', "smoke_v165_main.js", "main"),
  (u"★向きの印がもともと無い写真で、撮った日時まで捨てる",
   u'''    return true;                                    // 向きの印がもともと無い＝そのままでよい''',
   u'''    return false;''', "smoke_v165_main.js", "main"),

  # ---- 現場入力：絞り込みの重さと、名前の書き方 ----
  (u"★絞り込みのたびに受付台帳の索引を作り直す（何百個も選ぶと固まる）",
   u'''  const idx = (function(){ try{ return mapRowIndex(); }catch(_){ return {}; } })();''',
   u'''  const idx = null;''', "smoke_v165_genba.js", "genba"),
  (u"★多いときも全部出す（画面が重くなる）",
   u'''  const show = hit.slice(0, OPEN_PICK_SHOW_MAX);''',
   u'''  const show = hit;''', "smoke_v165_genba.js", "genba"),
  (u"★出していない分があることを黙っている",
   u'''  + (rest > 0 ? ('<div class="info">ほかに ' + rest + ' 個あります。上の欄に 管理番号・氏名・住所 を入れて絞ってください。</div>') : "");''',
   u'''  + "";''', "smoke_v165_genba.js", "genba"),
  (u"★「自分で書く」を端末の窓に戻す（ホーム画面アプリでは何も起きない）",
   u'''      v = await uiTypeName("\U0001F4C1 入れる場所の名前",
        "候補に無いときだけ、ここに書いてください。<br>例： 物件A/リスト（「/」で区切ると、中のフォルダまで出します）", now);''',
   u'''      v = window.prompt("入れる場所の名前", now);''',
   "smoke_v165_genba.js", "genba"),
  (u"★書くのをやめたのに、覚えていた名前を消す",
   u'''      if(v === null) return;                   // やめた（覚えている名前はそのまま）''',
   u'''      if(v === null) v = "";''', "smoke_v165_genba.js", "genba"),

  # ---- 写真の Exif（小さい見本・大きさの書き置き） ----
  (u"★元の写真の小さい見本（サムネイル）を持ち越す（回す前の絵が残る）",
   u'''    seg[nx] = 0; seg[nx + 1] = 0; seg[nx + 2] = 0; seg[nx + 3] = 0;''',
   u'''    void nx;''', "smoke_v165_main.js", "main"),
  (u"★Exif の「絵の大きさ」を、縮める前のままにする",
   u'''    if(px) photoExifSetPixelSize(seg, px[0], px[1]);       // 大きさの書き置きも、縮めたあとに合わせる''',
   u'''    void px;''', "smoke_v165_main.js", "main"),

  # ---- 📉 まとめて軽くする：並びの見張り ----
  (u"★縮めている間に並びが変わっても、そのまま書く",
   u'''  if(print1 !== photoSlimPrint(photos)) return { kind:"fail", why:"写真の並びが変わりました（何も書いていません）" };''',
   u'''  void print1;''', "smoke_v165_main.js", "main"),

  # ---- 現場入力：📂 の選り分け・知らせ・二重タップ・全角・行き止まり ----
  (u"★戸別ファイルでないもの（写真・メモ）まで一覧に並べる",
   u'''  let fs = all.filter(f => openPickIsJson(f.name));''',
   u'''  let fs = all;''', "smoke_v165_genba.js", "genba"),
  (u"★一覧から外したものがあることを黙っている",
   u'''  toast(fs.length + "個から探せます" + (away ? ("（戸別ファイルでない " + away + " 個は外しました）") : ""));''',
   u'''  toast(fs.length + "個から探せます");''', "smoke_v165_genba.js", "genba"),
  (u"★全角の数字を半角にそろえずに探す（スマホで0件になる）",
   u'''  const q = toHalfWidthAn(String((document.getElementById("open-pick-q") || {}).value || "").trim()).toLowerCase();''',
   u'''  const q = String((document.getElementById("open-pick-q") || {}).value || "").trim().toLowerCase();''',
   "smoke_v165_genba.js", "genba"),
  (u"★中身がかたまりでないJSONを、そのまま先へ進める（黙って落ちる）",
   u'''    if(!data || typeof data !== "object" || Array.isArray(data)){''',
   u'''    if(false){''', "smoke_v165_genba.js", "genba"),
  (u"★続けて押すと、押した順と違う戸別が開く",
   u'''  if(_openBusy) return;''', u'''  void 0;''',
   "smoke_v165_genba.js", "genba"),
  (u"★窓が閉じたまま一覧を出す（押しても何も起きない行き止まり）",
   u'''  if(dm && !dm.classList.contains("open")){
    try{ await openDraftModal(); }catch(_){ dm.classList.add("open"); }
  }''',
   u'''  void dm;''', "smoke_v165_genba.js", "genba"),
  (u"★フォルダの窓を出せなかったとき、黙って戻る",
   u'''    return await saveDirChange("nameonly");''', u'''    return;''',
   "smoke_v165_genba.js", "genba"),
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
