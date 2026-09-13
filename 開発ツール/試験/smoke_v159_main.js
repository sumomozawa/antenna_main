/* 版159: 戸別ファイルへ書き戻すときの写真の扱い。
   ・行が原寸の写真を持っているとき（📥 現場取込 で統合した分など）は、元のファイルと和集合にする
   ・行の写真が当てにならないとき（サムネ・持っていない）は、今までどおり元のファイルの写真を残す
   ・元のファイルを読めなかったときは、書かない（確かめられなければ何も消さない） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const MAIN = process.argv[2] || FILE('antenna_main');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* 版番号は上げるたびに試験を直さなくてよいように、読み込むファイルから拾う */
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(MAIN).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();


(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:1400,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(MAIN); await page.waitForTimeout(6000);

  await page.evaluate(() => {
    // 大きさの違う「写真」を作る（中身は問わない。dataUri の長さで高画質かどうかを見分ける作り）
    window.__ph = (id, label, n) => ({ id, label, dataUri: 'data:image/jpeg;base64,' + 'A'.repeat(n) });
    window.__fh = json => ({ getFile: async () => ({ text: async () => json }) });
    window.__bad = () => ({ getFile: async () => { throw new Error('読めない'); } });
    window.__ids = arr => (arr || []).map(p => p && p.id).join(',');
  });

  // ---- ① 現場取込の筋：行が持っている原寸の写真が、元のファイルの写真と和集合になる ----
  const r1 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_mgmt_no:'K001', chosho_photos:[ __ph('pc1','PCで撮った',900) ] });
    const row = { fileType:'plain', file:'K001.json',
      data: { chosho_mgmt_no:'K001', chosho_cust_name:'あ様',
              chosho_photos: [ __ph('pc1','PCで撮った',900), __ph('g1','現場で撮った',800) ] } };   // 取込で統合した中身
    const out = await buildIndividualContent(row, __fh(file));
    return { n: (out.chosho_photos||[]).length, ids: __ids(out.chosho_photos), name: out.chosho_cust_name };
  });
  console.log('①和集合', JSON.stringify(r1));
  ok(r1.n === 2 && /pc1/.test(r1.ids) && /g1/.test(r1.ids),
     '★取り込んだ現場の写真が、戸別ファイルに書かれない → ' + JSON.stringify(r1));

  // ---- ② 同じ写真が両方にあるときは1枚にまとまり、高画質の方が残る ----
  const r2 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',5000) ] });        // ファイル側が高画質
    const row = { fileType:'plain', data:{ chosho_photos:[ __ph('pc1','現場',300), __ph('g1','現場で撮った',800) ] } };
    const out = await buildIndividualContent(row, __fh(file));
    const p1 = (out.chosho_photos||[]).filter(p => p.id === 'pc1')[0] || {};
    return { n: (out.chosho_photos||[]).length, len: (p1.dataUri||'').length };
  });
  console.log('②重複は1枚・高画質', JSON.stringify(r2));
  ok(r2.n === 2, '★同じ写真が2枚に増えている → ' + JSON.stringify(r2));
  ok(r2.len > 4000, '★高画質の方（ファイルの原寸）が残っていない → ' + JSON.stringify(r2));

  // ---- ③ 行が写真を持っていない（一覧の行＝_slim）→ 元のファイルの写真をそのまま残す ----
  const r3 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',900), __ph('pc2','PC2',900) ] });
    const row = { fileType:'plain', _slim:true, data:{ chosho_mgmt_no:'K003', chosho_photos: null } };
    const out = await buildIndividualContent(row, __fh(file));
    return { n: (out.chosho_photos||[]).length, ids: __ids(out.chosho_photos) };
  });
  console.log('③写真を持たない行', JSON.stringify(r3));
  ok(r3.n === 2 && r3.ids === 'pc1,pc2', '★写真を持たない行の書き戻しで、ファイルの写真が減った → ' + JSON.stringify(r3));

  // ---- ④ 行の写真がサムネ（物件由来）→ サムネでファイルの原寸を上書きしない ----
  const r4 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',5000) ] });
    const rowA = { fileType:'plain', data:{ chosho_photos:[ __ph('pc1','PC',120) ], chosho_photos_thumb:true, chosho_photo_count:1 } };
    const rowB = { fileType:'plain', _fromProject:true, data:{ chosho_photos:[ __ph('pc1','PC',120) ] } };
    // 写真IDを持たない古い写真のサムネ（突合の鍵が無い）→ 足してはいけない（同じ写真が2枚になる）
    const rowC = { fileType:'plain', _fromProject:true, data:{ chosho_photos:[ { label:'PC', dataUri:'data:image/jpeg;base64,' + 'A'.repeat(120) } ] } };
    // エディタで開いた印が付いていても、中身がサムネなら原寸を上書きしない
    const rowD = { fileType:'plain', _photosKnown:true, _fromProject:true, data:{ chosho_photos:[ __ph('pc1','PC',120) ] } };
    const a = await buildIndividualContent(rowA, __fh(file));
    const b = await buildIndividualContent(rowB, __fh(file));
    const c = await buildIndividualContent(rowC, __fh(file));
    const d = await buildIndividualContent(rowD, __fh(file));
    return { aLen: ((a.chosho_photos||[])[0]||{}).dataUri.length, aThumb: ('chosho_photos_thumb' in a),
             bLen: ((b.chosho_photos||[])[0]||{}).dataUri.length,
             cN: (c.chosho_photos||[]).length, cLen: ((c.chosho_photos||[])[0]||{}).dataUri.length,
             dN: (d.chosho_photos||[]).length, dLen: ((d.chosho_photos||[])[0]||{}).dataUri.length };
  });
  console.log('④サムネの行', JSON.stringify(r4));
  ok(r4.aLen > 4000 && r4.bLen > 4000, '★サムネで戸別ファイルの原寸写真を上書きしている → ' + JSON.stringify(r4));
  ok(r4.aThumb === false, '物件専用の印がファイルに残る → ' + JSON.stringify(r4));
  ok(r4.cN === 1 && r4.cLen > 4000,
     '★写真IDを持たないサムネを足してしまい、同じ写真が2枚になる → ' + JSON.stringify(r4));
  ok(r4.dN === 1 && r4.dLen > 4000,
     '★サムネの行に「開いて書き戻す」印が付いていると、原寸をサムネで上書きする → ' + JSON.stringify(r4));

  // ---- ⑤ 元のファイルを読めなかったら、書かない ----
  const r5 = await page.evaluate(async () => {
    const row = { fileType:'plain', data:{ chosho_mgmt_no:'K005', chosho_photos:[ __ph('g1','現場',800) ] } };
    const out = await buildIndividualContent(row, __bad());
    const row2 = { fileType:'plain', _slim:true, data:{ chosho_mgmt_no:'K005', chosho_photos:null } };
    const out2 = await buildIndividualContent(row2, __bad());
    return { out: out === null, out2: out2 === null };
  });
  console.log('⑤読めないファイル', JSON.stringify(r5));
  ok(r5.out === true && r5.out2 === true,
     '★もとのファイルを読めないのに上書きしている（写真を丸ごと失う） → ' + JSON.stringify(r5));

  // ---- ⑥ 新しいファイル（相手がいない）→ 行の写真をそのまま書く ----
  const r6 = await page.evaluate(async () => {
    const row = { fileType:'plain', data:{ chosho_mgmt_no:'K006', chosho_photos:[ __ph('g1','現場',800) ] } };
    const out = await buildIndividualContent(row, null);
    const row2 = { fileType:'plain', _slim:true, data:{ chosho_mgmt_no:'K006', chosho_photos:null } };
    const out2 = await buildIndividualContent(row2, null);
    return { n: (out.chosho_photos||[]).length, has2: ('chosho_photos' in out2) };
  });
  console.log('⑥新しいファイル', JSON.stringify(r6));
  ok(r6.n === 1, '★新しいファイルに写真が書かれない → ' + JSON.stringify(r6));
  ok(r6.has2 === false, '写真を持たない行で、空の写真欄を書いている → ' + JSON.stringify(r6));

  // ---- ⑦ エディタで開いて書き戻すときは、行の写真がそのまま（📉 写真を軽量化 が効く） ----
  const r7 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',5000) ] });          // 原寸
    const row = { fileType:'plain', _photosKnown:true, data:{ chosho_photos:[ __ph('pc1','PC',400) ] } };  // 軽量化した
    const out = await buildIndividualContent(row, __fh(file));
    return { n: (out.chosho_photos||[]).length, len: ((out.chosho_photos||[])[0]||{}).dataUri.length };
  });
  console.log('⑦軽量化', JSON.stringify(r7));
  ok(r7.n === 1 && r7.len < 1000, '★軽量化した写真が、書き戻しで原寸に戻ってしまう → ' + JSON.stringify(r7));

  // ---- ⑧ 書いたあとの読み返しは、統合した中身（＝実際に書いた中身）と比べる ----
  const r8 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_mgmt_no:'K008', chosho_photos:[ __ph('pc1','PC',900) ] });
    const row = { fileType:'plain', data:{ chosho_mgmt_no:'K008',
      chosho_photos:[ __ph('pc1','PC',900), __ph('g1','現場',800) ] } };
    const out = await buildIndividualContent(row, __fh(file));
    const good = await caseFileVerify(__fh(JSON.stringify(out)), out);        // 書けた場合
    const bad  = await caseFileVerify(__fh(file), out);                       // 1枚しか入らなかった場合
    return { good, bad };
  });
  console.log('⑧読み返し', JSON.stringify(r8));
  ok(r8.good === '', '正しく書けたのに「合わない」と言う → ' + JSON.stringify(r8.good));
  ok(/写真の枚数/.test(r8.bad), '★写真が入りきらなかったのに気づけない → ' + JSON.stringify(r8.bad));

  // ---- ⑧-2 0バイト・BOM付き・壊れたファイル ----
  const r82 = await page.evaluate(async () => {
    const row = () => ({ fileType:'plain', data:{ chosho_mgmt_no:'K082', chosho_photos:[ __ph('g1','現場',800) ] } });
    const slim = () => ({ fileType:'plain', _slim:true, data:{ chosho_mgmt_no:'K082', chosho_photos:null } });
    const zero = await buildIndividualContent(row(), __fh(''));                       // 0バイト（前の保存が切れた残り）
    const zeroSlim = await buildIndividualContent(slim(), __fh('   '));
    const bom = await buildIndividualContent(row(), __fh('\uFEFF' + JSON.stringify({ chosho_photos:[ __ph('pc1','PC',900) ] })));
    const broken = await buildIndividualContent(row(), __fh('{壊れている'));
    return { zero: zero && (zero.chosho_photos||[]).length, zeroSlim: zeroSlim && ('chosho_photos' in zeroSlim),
             bom: bom && __ids(bom.chosho_photos), broken: broken === null };
  });
  console.log('⑧-2 0バイト・BOM・壊れ', JSON.stringify(r82));
  ok(r82.zero === 1, '★0バイトのファイルがあると、その戸別が二度と書けなくなる → ' + JSON.stringify(r82));
  ok(r82.zeroSlim === false, '0バイトのファイルに、空の写真欄を書いている → ' + JSON.stringify(r82));
  ok(r82.bom === 'pc1,g1', '★先頭に目印（BOM）が付いたファイルだと書けなくなる → ' + JSON.stringify(r82));
  ok(r82.broken === true, '★中身のある壊れたファイルを上書きしている（中の写真を失う） → ' + JSON.stringify(r82));

  // ---- ⑧-3 物件から開いた行（サムネ）でも、取り込んだ現場の写真は入る ----
  const r83 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',5000) ] });
    const proj = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ __ph('pc1','PC',120), __ph('g1','現場',9000) ], chosho_photos_thumb:true } };
    const noId = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ { label:'PC', dataUri:'data:image/jpeg;base64,' + 'A'.repeat(120) }, __ph('g1','現場',9000) ],
             chosho_photos_thumb:true } };
    // 元のファイルの写真が小さい（512px以下のPNGなど）と、サムネの方が長いことがある
    const small = JSON.stringify({ chosho_photos:[ __ph('pc1','PC',100) ] });
    const bigThumb = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ __ph('pc1','PC',3000) ], chosho_photos_thumb:true } };
    const s1 = await buildIndividualContent(bigThumb, __fh(small));
    // PCで一度消した枠（名前と写真IDだけ残る）があっても、現場から入れ直せる
    const delSlot = JSON.stringify({ chosho_photos:[ { label:'玄関前', dataUri:null, id:'g1' }, __ph('pc1','PC',5000) ] });
    const back = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ __ph('g1','現場',9000) ], chosho_photos_thumb:true } };
    const d1 = await buildIndividualContent(back, __fh(delSlot));
    // 戻ってきた写真に名前が無いときは、枠に付けていた名前を引き継ぐ
    const backNoName = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ { label:'', dataUri:'data:image/jpeg;base64,' + 'A'.repeat(9000), id:'g1' } ], chosho_photos_thumb:true } };
    const d3 = await buildIndividualContent(backNoName, __fh(delSlot));
    // ファイル側の写真に写真IDが無い（古いファイル）ときも、同じ写真を2枚にしない
    const noIdFile = JSON.stringify({ chosho_photos:[ { label:'PC', dataUri:'data:image/jpeg;base64,' + 'A'.repeat(5000) } ] });
    const sameThumb = { fileType:'plain', _fromProject:true,
      data:{ chosho_photos:[ { label:'PC', dataUri:'data:image/jpeg;base64,' + 'A'.repeat(120),
                               id: photoContentId('data:image/jpeg;base64,' + 'A'.repeat(5000)) } ], chosho_photos_thumb:true } };
    const d2 = await buildIndividualContent(sameThumb, __fh(noIdFile));
    const a = await buildIndividualContent(proj, __fh(file));
    const c = await buildIndividualContent(noId, __fh(file));
    const big = (o, id) => (((o.chosho_photos||[]).filter(p => p.id === id)[0]||{}).dataUri||'').length;
    return { ids: __ids(a.chosho_photos), pc1: big(a,'pc1'), g1: big(a,'g1'),
             cN: (c.chosho_photos||[]).length, cIds: __ids(c.chosho_photos),
             sN: (s1.chosho_photos||[]).length, sLen: big(s1,'pc1'),
             dBack: big(d1,'g1'), dN: (d1.chosho_photos||[]).length,
             d3Label: (((d3.chosho_photos||[]).filter(p => p.id === 'g1')[0])||{}).label,
             d2N: (d2.chosho_photos||[]).length, d2Len: ((d2.chosho_photos||[])[0]||{}).dataUri.length };
  });
  console.log('⑧-3 物件から開いた行', JSON.stringify(r83));
  ok(r83.ids === 'pc1,g1', '★物件だけを開いて取り込むと、現場の写真が戸別ファイルへ入らない → ' + JSON.stringify(r83));
  ok(r83.pc1 > 4000, '★サムネがファイルの原寸を上書きしている → ' + JSON.stringify(r83));
  ok(r83.g1 > 8000, '現場の写真が縮んで書かれている → ' + JSON.stringify(r83));
  ok(r83.cN === 2 && r83.cIds === 'pc1,g1',
     '★写真IDを持たない古いサムネを足して、同じ写真が2枚になる → ' + JSON.stringify(r83));
  ok(r83.sN === 1 && r83.sLen === 123,
     '★ファイルの写真（小さいPNGなど）が、物件のサムネで置き換わる → ' + JSON.stringify(r83));
  ok(r83.dBack > 8000, '★PCで一度消した写真を、現場から入れ直せない → ' + JSON.stringify(r83));
  ok(r83.dN === 2, '★写真が戻ってきたのに、空の枠がそのまま残る → ' + JSON.stringify(r83));
  ok(r83.d3Label === '玄関前', '★枠に付けていた名前が、写真が戻ったときに消える → ' + JSON.stringify(r83));
  ok(r83.d2N === 1 && r83.d2Len > 4000,
     '★写真IDの無い古いファイルで、同じ写真が2枚になる／サムネで置き換わる → ' + JSON.stringify(r83));

  // ---- ⑧-4 名前だけ付けた空の枠は消さない ----
  const r84 = await page.evaluate(async () => {
    const file = JSON.stringify({ chosho_photos:[ { label:'玄関前', dataUri:null }, __ph('pc1','PC',900) ] });
    const row = { fileType:'plain', data:{ chosho_photos:[ __ph('g1','現場',800) ] } };
    const out = await buildIndividualContent(row, __fh(file));
    // 2回目の書き戻し（1回目の結果がファイルになった状態）でも増えない
    const out2 = await buildIndividualContent(row, __fh(JSON.stringify(out)));
    /* 足せる写真が1枚も無かったとき（中身が写真の形をしていない）も増えない */
    const odd = { fileType:'plain', data:{ chosho_photos:[ { label:'変なもの', dataUri:'blob:xyz' } ] } };
    const o1 = await buildIndividualContent(odd, __fh(file));
    const o2 = await buildIndividualContent(odd, __fh(JSON.stringify(o1)));
    const o3 = await buildIndividualContent(odd, __fh(JSON.stringify(o2)));
    return { labels: (out.chosho_photos||[]).map(p => p.label).join('|'),
             labels2: (out2.chosho_photos||[]).map(p => p.label).join('|'),
             odd1: (o1.chosho_photos||[]).length, odd3: (o3.chosho_photos||[]).length };
  });
  console.log('⑧-4 空の枠', JSON.stringify(r84));
  ok(/玄関前/.test(r84.labels), '★名前だけ付けた写真の枠（玄関前）が消える → ' + JSON.stringify(r84));
  ok(r84.labels2 === r84.labels, '★書き戻すたびに空の枠が増えていく → ' + JSON.stringify(r84));
  ok(r84.odd1 === r84.odd3, '★足せる写真が無かったとき、書き戻すたびに空の枠が倍に増えていく → ' + JSON.stringify(r84));

  // ---- ⑨ 書き戻しに失敗したら、取り込みのまとめで必ず知らせる ----
  const r9 = await page.evaluate(async () => {
    const oe = window.ensureProjDirHandle, op = _currentProject, ol = _listRows, oed = _editingRow;
    let note = '(呼ばれず)';
    try{
      const row = { fileType:'plain', data:{ chosho_mgmt_no:'K009' } };
      _currentProject = { id:'p1', name:'試験' }; _listRows = [row];
      window.ensureProjDirHandle = async () => { throw new Error('フォルダを掴めない'); };
      note = await _genbaWriteRowIndividual(row);
    } finally { window.ensureProjDirHandle = oe; _currentProject = op; _listRows = ol; _editingRow = oed; }
    // 物件は開いているが工事フォルダを掴めていない（選ぶ画面をやめた等）→ 1件も書けていない
    const oe2 = window.ensureProjDirHandle, op2 = _currentProject, ol2 = _listRows, oed2 = _editingRow;
    let nolink = '(呼ばれず)', nolink2 = '', quiet = '', asked = 0, asked2 = 0, other = false, resetOk = false;
    try{
      const row2 = { fileType:'plain', data:{ chosho_mgmt_no:'K009B' } };
      _currentProject = { id:'p1', name:'試験' }; _listRows = [row2];
      window.ensureProjDirHandle = async () => { asked++; return null; };
      _genbaNoDir = false;
      nolink = await _genbaWriteRowIndividual(row2, true);
      nolink2 = await _genbaWriteRowIndividual(row2, true);     // 同じ取り込みの2件目は聞き直さない
      asked2 = asked;                                     // ここまでで何回フォルダを聞いたか
      // 取り込み以外（協力会社諸経費のそろえ直しなど）は、前の取り込みの印を引きずらない
      const askedBefore = asked;
      await _genbaWriteRowIndividual(row2);
      other = (asked > askedBefore);
      // 次の取り込みでは、もう一度フォルダを試す（genbaImportFlow が印を戻す）
      resetOk = /_genbaNoDir\s*=\s*false/.test(String(genbaImportFlow));
      _editingRow = row2; quiet = await writeCurrentCaseToIndividualFile();   // 普段の保存は静かなまま
      _genbaNoDir = false;
    } finally { window.ensureProjDirHandle = oe2; _currentProject = op2; _listRows = ol2; _editingRow = oed2; }
    const src = String(genbaImportFlow);
    return { note: String(note), nolink: String(nolink), nolink2: String(nolink2), quiet: String(quiet), asked: asked2, other, resetOk,
             surfaced: /if\(wnote[\s\S]{0,80}notes\.push/.test(src),
             counted: /ngWrite/.test(src), noProj: /物件を開いていない/.test(src) };
  });
  console.log('⑨書き戻しの失敗', JSON.stringify(r9));
  ok(/⚠/.test(r9.note) && /書き戻し/.test(r9.note),
     '★戸別ファイルへ書き戻せなかったのに、取り込みは何も言わない → ' + JSON.stringify(r9.note));
  ok(r9.surfaced === true, '★書き戻しの失敗が、取り込みのまとめの知らせに出ない → ' + JSON.stringify(r9.surfaced));
  ok(/⚠/.test(r9.nolink) && /工事フォルダ/.test(r9.nolink),
     '★工事フォルダを掴めていないのに、1件も書けていないことを知らせない → ' + JSON.stringify(r9.nolink));
  ok(r9.nolink2 === r9.nolink && r9.asked === 1,
     '★工事フォルダを掴めなかったのに、戸別ごとに何度も選ぶ画面を出す → ' + JSON.stringify({ n2:r9.nolink2, asked:r9.asked }));
  ok(/工事フォルダ未リンク/.test(r9.quiet) && !/⚠/.test(r9.quiet),
     '★普段の保存（物件へ保存）でも ⚠ が出るようになっている → ' + JSON.stringify(r9.quiet));
  ok(r9.other === true,
     '★取り込み以外の書き戻しまで、前の取り込みの「掴めなかった」印で素通りする → ' + JSON.stringify(r9.other));
  ok(r9.resetOk === true, '★次の取り込みでも、フォルダを掴みに行かない（印を戻していない） → ' + JSON.stringify(r9.resetOk));
  ok(r9.counted === true && r9.noProj === true,
     '★取り込みのまとめに「書けていない件数」「物件を開いていない」の知らせが無い → ' + JSON.stringify(r9));

  // ---- ⑩ 読めないファイルは、書かずに理由を伝える（通しで） ----
  const r10 = await page.evaluate(async () => {
    const oe = window.ensureProjDirHandle, orr = window.resolveFileHandleInDir,
          op = _currentProject, ol = _listRows, oed = _editingRow;
    let wrote = 0, msg = '';
    try{
      const row = { fileType:'plain', file:'K010.json', data:{ chosho_mgmt_no:'K010', chosho_photos:null } };
      _currentProject = { id:'p1', name:'試験' }; _listRows = [row]; _editingRow = row;
      window.ensureProjDirHandle = async () => ({ name:'工事フォルダ' });
      window.resolveFileHandleInDir = async () => ({
        queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFile: async () => { throw new Error('読めない'); },
        createWritable: async () => ({ write: async () => { wrote++; }, close: async () => {} }) });
      msg = await writeCurrentCaseToIndividualFile();
    } finally {
      window.ensureProjDirHandle = oe; window.resolveFileHandleInDir = orr;
      _currentProject = op; _listRows = ol; _editingRow = oed;
    }
    return { wrote, msg: String(msg) };
  });
  console.log('⑩読めないファイルへの書き戻し', JSON.stringify(r10));
  ok(r10.wrote === 0, '★もとのファイルを読めないのに書き込んでいる → ' + JSON.stringify(r10));
  ok(/⚠/.test(r10.msg) && /読めません/.test(r10.msg),
     '★読めなかったのに、書き替えていないことを伝えていない → ' + JSON.stringify(r10.msg));

  // ---- ⑪ 書き戻し先のファイルに入っている写真を、通しで守る ----
  const r11 = await page.evaluate(async () => {
    const oe = window.ensureProjDirHandle, orr = window.resolveFileHandleInDir,
          op = _currentProject, ol = _listRows, oed = _editingRow;
    let written = null;
    try{
      // 旧名を持たない行（取込で新しく作った行など）＋ 書き込み先には既に写真入りのファイルがある
      const row = { fileType:'plain', file:'manual:abc',
        data:{ chosho_mgmt_no:'K011', chosho_photos:[ __ph('g1','現場',800) ] } };
      _currentProject = { id:'p1', name:'試験' }; _listRows = [row]; _editingRow = row;
      let body = JSON.stringify({ chosho_mgmt_no:'K011', chosho_photos:[ __ph('pc1','PC',5000) ] });
      window.ensureProjDirHandle = async () => ({ name:'工事フォルダ' });
      window.resolveFileHandleInDir = async () => ({
        queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFile: async () => ({ text: async () => body }),
        createWritable: async () => ({ write: async (txt) => { body = String(txt); written = body; }, close: async () => {} }) });
      await writeCurrentCaseToIndividualFile();
    } finally {
      window.ensureProjDirHandle = oe; window.resolveFileHandleInDir = orr;
      _currentProject = op; _listRows = ol; _editingRow = oed;
    }
    let ids = '(書いていない)';
    try{ ids = __ids(JSON.parse(written).chosho_photos); }catch(_){}
    return { ids };
  });
  console.log('⑪書き込み先の写真', JSON.stringify(r11));
  ok(r11.ids === 'pc1,g1', '★書き込み先のファイルに入っていた写真が、書き戻しで消える → ' + JSON.stringify(r11));

  // ---- ⑫ 版 ----
  const ver = await page.evaluate(() => APP_VERSION);
  ok(!!WANT_VER && ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ver + ' ／ ファイル ' + WANT_VER);

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v159_main');
})();
