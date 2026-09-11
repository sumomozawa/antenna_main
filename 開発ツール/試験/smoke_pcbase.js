/* 版156: 戸別ファイルの控え（_fileBase）で「控え／現場／ファイル」の3つを見比べて融合する。
   ・控えあり … 「現場が直したところ」と「PCが直したところ」を見分ける
   ・控えなし … 受付台帳の控え（_rcSrc）と作りたての既定値を二段目の手がかりにする。
                材料（図面・積算に出る選択）はひとかたまりで決める
   ・この端末でまだ何も入力していない戸別は、そもそも書き替えない（G1）
   ★写真はいかなる経路でも減らない。★工事完了の取り消しは復活しない。 */
const { chromium } = require('playwright-core');
/* Chromium の置き場所。環境変数 CHROME で変えられる。 */
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
/* 3つのリポジトリは隣どうしに置いてある前提（…/antenna_main/開発ツール/試験/ から数える） */
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const HTML = process.argv[2] || FILE('antenna_genba');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:420,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);

  await page.evaluate(() => {
    window.__asked = []; window.__answer = true;
    window.__oc = uiConfirm; window.__oa = uiAlert;
    uiConfirm = async m => { window.__asked.push(m); return window.__answer; };
    uiAlert   = async m => { window.__asked.push(m); return true; };
    window.__mkDir = () => ({ name:'にせ', queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      _files: {},
      async getFileHandle(n, o){ const F = this._files;
        if(!(n in F)){ if(!(o&&o.create)) throw new Error('NF'); F[n]=''; }
        return { getFile: async()=>({ text: async()=>F[n] }),
                 createWritable: async()=>({ write: async(bl)=>{ F[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(this._files)) yield [n, { kind:'file' }]; },
      values: function*(){} });
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
    /* PCが書いた戸別ファイル（中身の濃いもの） */
    window.__pcFile = (no) => ({
      chosho_mgmt_no: no || '300001', chosho_cust_name:'あ様', work_type:'apartment',
      chosho_date:'2026-08-01', chosho_time:'09:30', chosho_meet_at:'2026-07-30 13:00',
      chosho_note:'PCの備考', chosho_cust_tel:'026-111-2222',
      antenna_main:'antenna_u20', tv_count:'2', cable_main_len:'12', remove_safety:'yes', high_work:'yes',
      survey_done:true, survey_done_at:'2026-08-01T00:00:00.000Z',
      work_done:true, work_done_at:'2026-08-02T00:00:00.000Z', chosho_status:'completed',
      asbestos:{ level:'level2', material:'mortar', construction_date:'1998-04-01', contractor_name:'○○工業' },
      qty_overrides:{ u206:2 }, node_offsets:{ amp:{x:1,y:2} }, ag_placement:{ pconly:true },
      measurements:{ channels:['14-2ch'], antenna:[{db:'62',mer:'',ber:''}] },
      chosho_photos:[{label:'PC1',dataUri:window.__png('#c33'),id:'p1'},
                     {label:'PC2',dataUri:window.__png('#3a6'),id:'p2'}]
    });
  });

  // ---- ① 📂 で読み込むと、控えができる ----
  const r1 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile())), '300001.json');
    await new Promise(r => setTimeout(r, 350));
    const b = fileBaseGet(M);
    return { ある: !!b, 番号: b && b.no, ファイル名: b && b.file, 写真: b && b.photos.length,
             アンテナ: b && b.state.antenna_main, 石綿: b && (b.state.asbestos||{}).level,
             控えに写真の中身: !!(b && b.state.chosho_photos),
             画面のアンテナ: M.antenna_main, 画面の写真: (M.chosho_photos||[]).length,
             ファイルから: !!M._fromCaseFile };
  });
  console.log('①控え', JSON.stringify(r1));
  ok(r1.ある && r1.番号 === '300001' && r1.ファイル名 === '300001.json',
     '★📂 で読み込んでも控えができない → ' + JSON.stringify(r1));
  ok(r1.写真 === 2 && r1.控えに写真の中身 === false,
     '控えの写真の持ち方が違う（IDだけのはず） → ' + JSON.stringify(r1));
  ok(r1.アンテナ === 'antenna_u20' && r1.石綿 === 'level2', '控えの中身が違う → ' + JSON.stringify(r1));
  ok(r1.画面のアンテナ === 'antenna_u20' && r1.画面の写真 === 2, '画面にファイルの中身が入らない → ' + JSON.stringify(r1));
  ok(r1.ファイルから, '読み込んだ印が付かない → ' + JSON.stringify(r1));

  // ---- ② 控えあり・現場がPCの間違いを直した（消した・既定値に戻した・完了を取り消した） ----
  const r2 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile())), '300001.json');
    await new Promise(r => setTimeout(r, 350));
    M.tv_count = '5'; syncTvArrays(M);   // TVの台数を現場で直した
    M.antenna_main = 'antenna_u206';     // 作りたての既定値と同じ値に直した
    M.remove_safety = 'no'; M.high_work = 'no'; M.cable_main_len = '5';
    M.chosho_note = ''; M.chosho_time = ''; M.chosho_cust_tel = '';
    M.work_done = false; M.work_done_at = ''; M.chosho_status = 'in_progress';
    M.measurements.antenna[0] = { db:'', mer:'', ber:'' };
    M._touched = true;
    const st = buildState();
    const mg = mergeIntoState(st, __pcFile(), { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:false });
    return { ant: st.antenna_main, rs: st.remove_safety, hw: st.high_work, cable: st.cable_main_len,
             note: st.chosho_note, time: st.chosho_time, tel: st.chosho_cust_tel,
             work: st.work_done === true, at: String(st.work_done_at||''), status: st.chosho_status,
             tv: st.tv_count, rooms: (st.tv_rooms||[]).length,
             meas: (((st.measurements||{}).antenna||[])[0]||{}).db,
             photos: (st.chosho_photos||[]).length, asb: (st.asbestos||{}).level,
             pconly: !!st.ag_placement, qty: Object.keys(st.qty_overrides||{}).length,
             survey: st.survey_done === true, kept: mg.kept.join('・'), conf: mg.conflicts.length };
  });
  console.log('②現場が直した', JSON.stringify(r2));
  ok(r2.ant === 'antenna_u206' && r2.rs === 'no' && r2.hw === 'no' && r2.cable === '5',
     '★現場でPCの間違いを直したのに、既定値と同じだからと戻される（金額に響く） → ' + JSON.stringify(r2));
  ok(r2.note === '' && r2.time === '' && r2.tel === '',
     '★現場で消した備考・時刻・電話が戻る → ' + JSON.stringify(r2));
  ok(r2.work === false && r2.at === '' && r2.status === 'in_progress',
     '★現場で取り消した工事完了が復活する（PCが完了と数え続ける） → ' + JSON.stringify(r2));
  ok(r2.meas === '', '★現場で消した測定値が戻る → ' + r2.meas);
  ok(r2.tv === '5' && r2.rooms === 5,
     '★現場で直したTVの台数が、ファイルの台数で上書きされる → ' + JSON.stringify(r2));
  ok(r2.photos === 2, '★写真が減った → ' + r2.photos);
  ok(r2.asb === 'level2' && r2.pconly && r2.qty === 1 && r2.survey === true,
     '現場が触っていないPCの中身（石綿・PCだけの項目・数量・下見の印）が消えた → ' + JSON.stringify(r2));

  // ---- ③ 控えあり・PCがファイルを直した（現場は触っていない） ----
  const r3 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile())), '300001.json');
    await new Promise(r => setTimeout(r, 350));
    M.chosho_cust_addr = '現場で書いた住所'; M._touched = true;   // 材料は触っていない
    const pc = __pcFile();
    pc.chosho_note = 'PCが書き直した備考'; pc.cable_main_len = '30'; pc.chosho_date = '2026-09-20';
    const st = buildState();
    const mg = mergeIntoState(st, pc, { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:false });
    return { note: st.chosho_note, cable: st.cable_main_len, date: st.chosho_date,
             addr: st.chosho_cust_addr, changed: mg.changed.length, kept: mg.kept.join('・') };
  });
  console.log('③PCが直した', JSON.stringify(r3));
  ok(r3.note === 'PCが書き直した備考' && r3.cable === '30' && r3.date === '2026-09-20',
     '★PCが直した内容を採らない → ' + JSON.stringify(r3));
  ok(r3.addr === '現場で書いた住所', '現場が入れた住所が消えた → ' + JSON.stringify(r3));

  // ---- ④ 控えあり・両方が直した日時は、1件保存のとき聞く（既定はPC） ----
  const r4 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile())), '300001.json');
    await new Promise(r => setTimeout(r, 350));
    M.chosho_date = '2026-09-14'; M._touched = true;             // 現場が直した
    const pcNew = __pcFile(); pcNew.chosho_date = '2026-09-12';  // PCも直した
    const st = buildState();
    const mg = mergeIntoState(st, pcNew, { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:true });
    const pcKept = st.chosho_date;
    window.__asked = []; window.__answer = true;                 // 「この端末を残す」を選ぶ
    await mergeApplyAnswers(st, mg.conflicts);
    return { conf: mg.conflicts.length, key: (mg.conflicts[0]||{}).key,
             pcKept, afterAsk: st.chosho_date, asked: window.__asked.join(' / ') };
  });
  console.log('④競合', JSON.stringify(r4));
  ok(r4.conf === 1 && r4.key === 'chosho_date', '★日時の競合を拾えていない → ' + JSON.stringify(r4));
  ok(r4.pcKept === '2026-09-12', '★競合の既定がPCでない → ' + r4.pcKept);
  ok(r4.afterAsk === '2026-09-14', '★「この端末を残す」を選んでも戻らない → ' + r4.afterAsk);
  ok(/工事日/.test(r4.asked) && /2026-09-12/.test(r4.asked) && /2026-09-14/.test(r4.asked),
     '★どちらの値かを見せずに聞いている → ' + r4.asked);

  /* ---- ⑤ 控えが無いとき ----
     現場が入れたところは現場が勝つ。現場が触っていないところはPCの中身を残す。
     材料（図面・積算に出る選択）はひとかたまり。両方にあるときは1回だけ聞く。 */
  const r5 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = '300001'; M.chosho_note = '現場の備考'; M.cable_main_len = '40';
    M._touched = true;
    const st = buildState();
    const mg = mergeIntoState(st, __pcFile(), { model:M, base:null, mode:'write', others:[], askable:false });
    return { note: st.chosho_note, cable: st.cable_main_len,
             photos: (st.chosho_photos||[]).length, ant: st.antenna_main, tv: st.tv_count,
             time: st.chosho_time, asb: (st.asbestos||{}).level, survey: st.survey_done === true,
             pconly: !!st.ag_placement, qty: Object.keys(st.qty_overrides||{}).length,
             mine: mg.mine.join('・'), kept: mg.kept.join('・'),
             聞く: mg.buildAsk === true, 戻すケーブル: (mg.buildSwap||{}).cable_main_len };
  });
  console.log('⑤控えなし', JSON.stringify(r5));
  ok(r5.note === '現場の備考',
     '★控えが無いと、現場が書いた備考がPCの値で上書きされる → ' + JSON.stringify(r5));
  ok(r5.ant === 'antenna_u20' && r5.tv === '2' && r5.time === '09:30' && r5.asb === 'level2',
     '★PCで選んだ中身（アンテナ・TVの台数・工事の時刻・石綿）が現場の既定値で潰れる → ' + JSON.stringify(r5));
  ok(r5.survey === true, '★PCの工程の印が、触っていない現場の保存で消える → ' + JSON.stringify(r5));
  ok(r5.photos === 2, '★写真が和集合になっていない → ' + r5.photos);
  ok(r5.pconly && r5.qty === 1, 'PCだけの欄（現場に無い欄）が消えた → ' + JSON.stringify(r5));
  ok(/備考/.test(r5.mine), '★置き換わるものを言えていない（確認に出せない） → ' + r5.mine);
  ok(r5.cable === '12' && r5.聞く === true && r5.戻すケーブル === '40',
     '★材料をばらばらに混ぜている／聞かずに決めている → ' + JSON.stringify(r5));

  /* ---- ⑤-2 控えが無くても、受付台帳の控え（_rcSrc）があれば
             「現場がわざと消した・取り消した」が残る ---- */
  const r5b = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = '300001';
    // 受付台帳から開いた形（台帳には時刻10:00・備考・完了の印が入っていた）
    M._rcSrc = { mgmt:'300001', name:'あ様', addr:'', tel:'', date:'2026-08-01', time:'10:00',
                 meet:'', note:'台帳の備考', survey:true, flyer:false, consent:false,
                 compdoc:false, status:'completed' };
    M.chosho_time = '';            // 現場が消した
    M.chosho_note = '';            // 現場が消した
    M.work_done = false; M.work_done_at = ''; M.chosho_status = 'in_progress';  // 現場が取り消した
    M.survey_done = true;          // 台帳のまま（触っていない）
    M.asbestos = Object.assign({}, M.asbestos, { level:'level1', construction_date:'2001-05-01' });
    M._touched = true;
    const st = buildState();
    const mg = mergeIntoState(st, __pcFile(), { model:M, base:null, mode:'write', others:[], askable:false });
    return { time: st.chosho_time, note: st.chosho_note, work: st.work_done === true,
             status: st.chosho_status, survey: st.survey_done === true,
             photos: (st.chosho_photos||[]).length, mine: mg.mine.join('・'),
             石綿: (st.asbestos||{}).level, 建築日: (st.asbestos||{}).construction_date,
             不明: (st.asbestos||{}).date_unknown === true };
  });
  console.log('⑤-2台帳の控え', JSON.stringify(r5b));
  ok(r5b.time === '' && r5b.note === '',
     '★現場が消した工事の時刻・備考が、保存でPCの値に戻る → ' + JSON.stringify(r5b));
  ok(r5b.work === false && r5b.status === 'in_progress',
     '★現場が取り消した工事完了が、控えなしの保存で復活する → ' + JSON.stringify(r5b));
  ok(r5b.survey === true, '触っていない下見の印が消えた → ' + JSON.stringify(r5b));
  ok(r5b.photos === 2, '★写真が和集合になっていない → ' + r5b.photos);
  /* 石綿は建物の判定。ひとかたまりで決める（項目ごとに混ぜると
     「建築年月日が入っているのに日付不明」のような中身になり、みなし含有の諸経費が付く） */
  ok(r5b.石綿 === 'level1' && r5b.建築日 === '2001-05-01' && r5b.不明 === false,
     '★現場が入れた石綿が、項目ごとにPCの判定と混ざる → ' + JSON.stringify(r5b));

  // ---- ⑥ G1: この端末で何も入力していない戸別は、そもそも書かない ----
  const r6 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = '300001';
    const before = isNothingNewHere(M);
    let wrote = false;
    const fake = { name:'にせ', queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(){ wrote = true; throw new Error('書かせない'); }, values: function*(){} };
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
    saveDirGet = async () => fake; saveDirOk = async () => true;
    window.showSaveFilePicker = async () => { wrote = true; throw new Error('書かせない'); };
    const ret = await saveJsonRun();
    saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op;
    M.chosho_photos = [{ label:'現場', dataUri: __png('#36c'), id:'g1' }];
    const after = isNothingNewHere(M);
    return { before, after, wrote, ret, info: (_lastSaveInfo && _lastSaveInfo.title) || '',
             msg: (_lastSaveInfo && _lastSaveInfo.msg) || '' };
  });
  console.log('⑥G1', JSON.stringify(r6));
  ok(r6.before === true && r6.after === false, '★「何も入力していない」の見分けが違う → ' + JSON.stringify(r6));
  ok(r6.wrote === false, '★この端末で何も入力していないのにファイルを書きに行った（PCの中身が消える）');
  ok(/そのまま残しました/.test(r6.info) && /書き替えていません/.test(r6.msg),
     '★書き替えていないことを伝えていない → ' + JSON.stringify(r6));

  // ---- ⑦ 写真の名前と「工事調書に載せる」印 ----
  const r7 = await page.evaluate(() => {
    const a = __png('#c33'), c2 = __png('#3a6');
    const ida = photoContentId(a), idb = photoContentId(c2);
    const mine = () => [{ label:'', dataUri:a, id:ida }, { label:'2枚目', dataUri:c2, id:idb }];
    const th = [{ label:'外観（南）', dataUri:a, id:ida, chosho:true },
                { label:'2枚目', dataUri:c2, id:idb, chosho:true }];
    const noBase = mergePhotosUnion(mine(), th, null);
    const base = { photos:[{id:ida,label:'',chosho:false},{id:idb,label:'2枚目',chosho:false}] };
    const withBase = mergePhotosUnion(mine(), th, base);
    // 控えがあり、現場が名前を直していたら、現場の名前を残す
    const mine2 = [{ label:'現場で直した', dataUri:a, id:ida }];
    const base2 = { photos:[{id:ida,label:'',chosho:false}] };
    const mineWins = mergePhotosUnion(mine2, [{ label:'PCが直した', dataUri:a, id:ida }], base2).map(p=>p.label);
    return { noBase: noBase.map(p => ({ l:p.label, c:!!p.chosho })),
             withBase: withBase.map(p => ({ l:p.label, c:!!p.chosho })), mineWins };
  });
  console.log('⑦写真の印', JSON.stringify(r7));
  ok(r7.noBase.filter(p=>p.c).length === 2 && r7.noBase[0].l === '外観（南）',
     '★控えが無いとき、PCで付けた印と名前を引き継がない → ' + JSON.stringify(r7.noBase));
  ok(r7.withBase.filter(p=>p.c).length === 2 && r7.withBase[0].l === '外観（南）',
     '★控えがあるとき、PCが直した名前と印を採らない → ' + JSON.stringify(r7.withBase));
  ok(r7.mineWins[0] === '現場で直した',
     '★現場が直した写真の名前が、PCの名前で上書きされる → ' + JSON.stringify(r7.mineWins));

  // ---- ⑧ 別の戸別のファイルには書き込まない ----
  const r8 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = '300001'; M._touched = true;
    const st = buildState();
    const mg = mergeIntoState(st, __pcFile('999999'), { model:M, base:null, mode:'write', others:[], askable:false });
    return { stop: mg.stop, reason: mg.reason };
  });
  console.log('⑧別の戸別', JSON.stringify(r8));
  ok(r8.stop === true && /999999/.test(r8.reason),
     '★別の管理番号のファイルに書き込もうとしても止めない → ' + JSON.stringify(r8));

  // ---- ⑨ TVの台数と部屋がちぐはぐにならない ----
  const r9 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = '300001'; M._touched = true;
    const st = buildState();
    mergeIntoState(st, __pcFile(), { model:M, base:null, mode:'write', others:[], askable:false });
    return { n: st.tv_count, rooms: (st.tv_rooms||[]).length, bd: (st.tv_bd||[]).length,
             sp: (st.tv_sp||[]).length, term: (st.tv_term||[]).length, room0: (st.tv_rooms||[])[0] };
  });
  console.log('⑨TVの台数', JSON.stringify(r9));
  ok(String(r9.n) === String(r9.rooms) && r9.rooms === r9.bd && r9.bd === r9.sp && r9.sp === r9.term,
     '★TVの台数と部屋の数が食い違う → ' + JSON.stringify(r9));
  ok(!!r9.room0, '部屋の名前が空になっている → ' + JSON.stringify(r9));

  // ---- ⑩ アパートの石綿は建物で1つ（いつもPCが持ち主） ----
  const r10 = await page.evaluate(async () => {
    const apt = () => { const f = __pcFile(); f.apt_units = '4'; f.apt_idx = '2'; f.apt_bldg = '300001'; return f; };
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(apt())), '300001.json');
    await new Promise(r => setTimeout(r, 300));
    M.asbestos = Object.assign({}, M.asbestos, { level:'level1' });   // 現場で直した
    M._touched = true;
    const st = buildState();
    mergeIntoState(st, apt(), { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:false });
    // 世帯数が state にまだ無い（持ち越しが消えた）ときも、ファイルから見分けられること
    const M2 = freshModel(); ensureModelShape(M2);
    M2.chosho_mgmt_no = '300001'; M2.asbestos = Object.assign({}, M2.asbestos, { level:'level1' });
    M2._touched = true;
    const st2 = buildStateOf(M2);
    mergeIntoState(st2, apt(), { model:M2, base:null, mode:'write', others:[], askable:false });
    return { level: (st.asbestos||{}).level, 世帯数: st.apt_units, level2: (st2.asbestos||{}).level };
  });
  console.log('⑩アパートの石綿', JSON.stringify(r10));
  ok(r10.level === 'level2', '★アパートの石綿が世帯ごとにばらける（建物で1つの決めが崩れる） → ' + JSON.stringify(r10));
  ok(r10.世帯数 === '4', 'アパートの世帯数が戸別ファイルに残らない → ' + r10.世帯数);
  ok(r10.level2 === 'level2',
     '★持ち越しが無いとアパートと見分けられず、石綿が世帯ごとにばらける → ' + r10.level2);

  // ---- ⑪ 同じ戸別の別名ファイル（管理番号.json.txt など）も相手にする ----
  const r11 = await page.evaluate(async () => {
    const dir = window.__mkDir();
    dir._files['300001.json.txt'] = JSON.stringify(__pcFile());
    const cf = await readExistingCaseFiles(dir, '300001.json', '300001');
    // 番号ちがいは拾わない（3000011.json／名前は合うが中の番号が別の戸別）
    dir._files['3000011.json'] = JSON.stringify(__pcFile('3000011'));
    dir._files['300001 古い.json'] = JSON.stringify(__pcFile('999999'));
    _cfIdx = null;
    const cf2 = await readExistingCaseFiles(dir, '300001.json', '300001');
    return { names: cf.names, ある: !!cf.primary, 写真: cf.primary ? (cf.primary.chosho_photos||[]).length : -1,
             names2: cf2.names };
  });
  console.log('⑪別名ファイル', JSON.stringify(r11));
  ok(r11.ある && r11.names.indexOf('300001.json.txt') >= 0,
     '★別名のファイル（.json.txt）を見ていない → ' + JSON.stringify(r11));
  ok(r11.写真 === 2, '別名のファイルから写真を読めていない → ' + r11.写真);
  ok(r11.names2.indexOf('3000011.json') < 0,
     '★番号のちがう戸別（3000011）まで拾ってしまう → ' + JSON.stringify(r11.names2));
  ok(r11.names2.indexOf('300001 古い.json') < 0,
     '★名前は合うが中の管理番号が別の戸別のファイルを混ぜてしまう → ' + JSON.stringify(r11.names2));

  // ---- ⑫ PCのファイルにある写真は、現場では消せない ----
  const r12 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile())), '300001.json');
    await new Promise(r => setTimeout(r, 350));
    const sec = Array.from(document.querySelectorAll('#app .sec')).find(s => s.dataset.sec === 'photos');
    if(sec && !sec.classList.contains('open')){ const h = sec.querySelector('.head'); if(h) h.click(); }
    await new Promise(r => setTimeout(r, 250));
    const before = (M.chosho_photos||[]).length;
    window.__asked = [];
    const del = document.querySelector('[data-photodel]');
    if(del) del.click();
    await new Promise(r => setTimeout(r, 250));
    const afterPc = (M.chosho_photos||[]).length;
    // 現場で撮った写真は消せる
    M.chosho_photos.push({ label:'現場', dataUri: __png('#36c'), id:'g9' });
    refreshPhotos(); await new Promise(r => setTimeout(r, 200));
    const dels = document.querySelectorAll('[data-photodel]');
    if(dels.length) dels[dels.length - 1].click();
    await new Promise(r => setTimeout(r, 250));
    return { before, afterPc, afterMine: (M.chosho_photos||[]).length, asked: window.__asked.join(' / ') };
  });
  console.log('⑫写真の削除', JSON.stringify(r12));
  ok(r12.before === 2 && r12.afterPc === 2,
     '★PCのファイルに入っている写真を、現場で消せてしまう → ' + JSON.stringify(r12));
  ok(/PCのファイルに入っています/.test(r12.asked), '★消せない理由を言わない → ' + r12.asked);
  ok(r12.afterMine === 2, '現場で撮った写真まで消せなくなっている → ' + JSON.stringify(r12));

  // ---- ⑬ 通し: 控えを取って → 現場で直して → 本当に保存 ----
  const r13 = await page.evaluate(async () => {
    const dir = window.__mkDir();
    dir._files['310001.json'] = JSON.stringify(__pcFile('310001'));
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('310001'))), '310001.json');
    await new Promise(r => setTimeout(r, 350));
    M.chosho_note = ''; M.chosho_time = ''; M.cable_main_len = '5';
    M.work_done = false; M.work_done_at = ''; M.chosho_status = 'in_progress';
    M.chosho_photos.push({ label:'現場で撮った', dataUri: __png('#36c'), id:'g1' });
    M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.__answer = true;
    const ret = await saveJsonRun();
    saveDirGet = og; saveDirOk = oo;
    const after = JSON.parse(dir._files['310001.json']);
    return { ret, note: after.chosho_note, time: after.chosho_time, cable: after.cable_main_len,
             work: after.work_done === true, status: after.chosho_status,
             photos: (after.chosho_photos||[]).filter(p=>p&&p.dataUri).length,
             labels: (after.chosho_photos||[]).map(p=>p.label),
             qty: Object.keys(after.qty_overrides||{}).length, pconly: !!after.ag_placement,
             asb: (after.asbestos||{}).level, survey: after.survey_done === true,
             origin: after._origin, 控え: !!fileBaseGet(M),
             控えが漏れた: ('_fileBase' in after),
             端末だけの印: Object.keys(after).filter(k => /^_/.test(k)).sort().join('・'),
             info: (_lastSaveInfo && _lastSaveInfo.msg) || '' };
  });
  console.log('⑬通し', JSON.stringify(r13));
  ok(r13.ret === true, '保存できていない');
  ok(r13.note === '' && r13.time === '' && r13.cable === '5',
     '★現場で消した・直した内容が、保存でPCの値に戻る → ' + JSON.stringify(r13));
  ok(r13.work === false && r13.status === 'in_progress',
     '★現場で取り消した工事完了が、保存で復活する → ' + JSON.stringify(r13));
  ok(r13.photos === 3 && r13.labels.indexOf('現場で撮った') >= 0
     && r13.labels.indexOf('PC1') >= 0 && r13.labels.indexOf('PC2') >= 0,
     '★写真が減った／和集合になっていない → ' + JSON.stringify(r13.labels));
  ok(r13.qty === 1 && r13.pconly && r13.asb === 'level2' && r13.survey === true,
     '★現場が触っていないPCの中身が消えた → ' + JSON.stringify(r13));
  ok(r13.origin === 'genba', '現場入力が書いた印が付いていない → ' + r13.origin);
  ok(r13.控え === true, '★保存したのに控えを取り直していない（次の保存で壊れる）');
  ok(r13.控えが漏れた === false, '★端末の中だけの控え(_fileBase)をファイルへ書き出している');
  /* 端末の中だけの目印を、戸別ファイルへ増やしていないか（PCの取込に居場所が無い欄になる） */
  ok(r13.端末だけの印 === '_appVersion・_origin・_schemaVer',
     '★戸別ファイルに、PCが知らない端末の目印を書き出している → ' + r13.端末だけの印);

  // ---- ⑭ もう一度保存しても、値が行ったり来たりしない ----
  const r14 = await page.evaluate(async () => {
    const dir = window.__mkDir();
    dir._files['320001.json'] = JSON.stringify(__pcFile('320001'));
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('320001'))), '320001.json');
    await new Promise(r => setTimeout(r, 350));
    M.antenna_main = 'antenna_u206'; M.chosho_note = ''; M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    await saveJsonRun();
    const a1 = JSON.parse(dir._files['320001.json']);
    await saveJsonRun();
    const a2 = JSON.parse(dir._files['320001.json']);
    await saveJsonRun();
    const a3 = JSON.parse(dir._files['320001.json']);
    saveDirGet = og; saveDirOk = oo;
    return { ant: [a1.antenna_main, a2.antenna_main, a3.antenna_main],
             note: [a1.chosho_note, a2.chosho_note, a3.chosho_note],
             photos: [(a1.chosho_photos||[]).length, (a2.chosho_photos||[]).length, (a3.chosho_photos||[]).length] };
  });
  console.log('⑭2回3回', JSON.stringify(r14));
  ok(r14.ant.join(',') === 'antenna_u206,antenna_u206,antenna_u206',
     '★保存のたびに値が行ったり来たりする → ' + JSON.stringify(r14.ant));
  ok(r14.note.join('|') === '||', '★消した備考が2回目の保存で戻る → ' + JSON.stringify(r14.note));
  ok(r14.photos.join(',') === '2,2,2', '★保存のたびに写真が増減する → ' + JSON.stringify(r14.photos));

  /* ---- ⑮ フォルダを選べない端末（共有・ダウンロード）では、
             写真が減る保存をさせない（写真IDの副本が知っている） ---- */
  const r15 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('330001'))), '330001.json');
    await new Promise(r => setTimeout(r, 400));
    const ids = await pbaseIds('330001');
    // この端末から写真と控えが消えた形（下書きが容量で落ちた・別の端末で入力した など）
    M.chosho_photos = []; delete M._fileBase;
    M.chosho_note = '現場の備考'; M._touched = true;
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
    saveDirGet = async () => null; saveDirOk = async () => false;
    try{ delete window.showSaveFilePicker; }catch(_){ window.showSaveFilePicker = undefined; }
    const ret = await saveJsonRun();
    saveDirGet = og; saveDirOk = oo; if(op) window.showSaveFilePicker = op;
    return { 副本: ids.length, ret, title: (_lastSaveInfo && _lastSaveInfo.title) || '',
             msg: (_lastSaveInfo && _lastSaveInfo.msg) || '' };
  });
  console.log('⑮共有の道', JSON.stringify(r15));
  ok(r15.副本 === 2, '★写真IDの副本が残っていない（下書きが消えたら守れない） → ' + r15.副本);
  ok(/写真が減る/.test(r15.title),
     '★フォルダを選べない端末で、写真が減る保存を止めていない → ' + JSON.stringify(r15));
  ok(/読み込んで/.test(r15.msg), '直し方を言えていない → ' + r15.msg);

  // ⑯-a 書けたあと、画面と控えが「ファイルに書いた中身」に合う
  const r16a = await page.evaluate(async () => {
    const dir = window.__mkDir(); dir._files['350001.json'] = JSON.stringify(__pcFile('350001'));
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = '350001'; M.chosho_cust_addr = '現場で書いた住所'; M._touched = true;  // 控えなし
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    await saveJsonRun();
    const f1 = JSON.parse(dir._files['350001.json']);
    const b = fileBaseGet(M);
    await saveJsonRun();                      // もう一度保存しても行ったり来たりしない
    const f2 = JSON.parse(dir._files['350001.json']);
    saveDirGet = og; saveDirOk = oo;
    return { ファイルのケーブル: f1.cable_main_len, 画面のケーブル: M.cable_main_len,
             控えのケーブル: b && b.state.cable_main_len, 控えの写真: b ? b.photos.length : -1,
             ファイルの写真: (f1.chosho_photos||[]).length,
             ni_cable: f2.cable_main_len, ni_photos: (f2.chosho_photos||[]).length,
             ni_addr: f2.chosho_cust_addr };
  });
  console.log('⑯-a 書いたあと', JSON.stringify(r16a));
  ok(r16a.ファイルのケーブル === '12' && r16a.画面のケーブル === '12',
     '★ファイルから採った分を画面に入れていない（次の保存で消す） → ' + JSON.stringify(r16a));
  ok(r16a.控えのケーブル === '12', '★書けたあとに控えを取り直していない → ' + JSON.stringify(r16a));
  ok(r16a.控えの写真 === 2 && r16a.ファイルの写真 === 2,
     '★控えの写真が「ファイルに書いた分」になっていない → ' + JSON.stringify(r16a));
  ok(r16a.ni_cable === '12' && r16a.ni_photos === 2 && r16a.ni_addr === '現場で書いた住所',
     '★2回目の保存で中身が行ったり来たりする → ' + JSON.stringify(r16a));

  // ⑯-b 管理番号を変えたら、前の戸別の控えは使わない
  const r16b = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('360001'))), '360001.json');
    await new Promise(r => setTimeout(r, 350));
    const 前 = !!fileBaseGet(M);
    M.chosho_mgmt_no = '360002';
    return { 前, 後: !!fileBaseGet(M) };
  });
  console.log('⑯-b 番号を変えた', JSON.stringify(r16b));
  ok(r16b.前 === true && r16b.後 === false,
     '★管理番号を変えても、前の戸別の控えを使い回す → ' + JSON.stringify(r16b));

  // ⑯-c 控えが無いときは、置き換わるものを1回だけ確かめる（いいえなら書かない）
  const r16c = await page.evaluate(async () => {
    const dir = window.__mkDir(); dir._files['370001.json'] = JSON.stringify(__pcFile('370001'));
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = '370001'; M.chosho_note = '現場の備考'; M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.__asked = []; window.__answer = false;            // 「いいえ」
    const ret = await saveJsonRun();
    const after = JSON.parse(dir._files['370001.json']);
    saveDirGet = og; saveDirOk = oo; window.__answer = true;
    return { ret, asked: window.__asked.join(' / '), 備考: after.chosho_note };
  });
  console.log('⑯-c 控えなしの確認', JSON.stringify(r16c));
  ok(/PCのファイルに中身が入っています/.test(r16c.asked) && /備考/.test(r16c.asked),
     '★控えが無いのに、置き換わるものを確かめない → ' + JSON.stringify(r16c));
  ok(r16c.ret === false && r16c.備考 === 'PCの備考',
     '★「いいえ」を選んでも書いてしまう → ' + JSON.stringify(r16c));

  // ⑯-d 工事完了を取り消したら、状態も「完了」のままにしない（金額では決めない）
  const r16d = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('380001'))), '380001.json');
    await new Promise(r => setTimeout(r, 350));
    M.work_done = false; M.work_done_at = '';      // ★状態は completed のまま置く
    M._touched = true;
    const st = buildState();
    mergeIntoState(st, __pcFile('380001'), { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:false });
    return { work: st.work_done === true, status: st.chosho_status };
  });
  console.log('⑯-d 完了の取り消し', JSON.stringify(r16d));
  ok(r16d.work === false && r16d.status === 'in_progress',
     '★工事完了を取り消したのに、状態が「完了」のまま残る → ' + JSON.stringify(r16d));

  // ⑯-e PCだけの欄は、両方が直していてもPCが持ち主
  const r16e = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = '390001';
    M.misc_fee = 'separate'; M.tax_mode = 'incl'; M._touched = true;
    const st = buildState();
    const old = { chosho_mgmt_no:'390001', work_type:'new', misc_fee:'include', tax_mode:'excl' };
    const base = { v:1, no:'390001', stale:false, photos:[], sig:{},
                   state:{ misc_fee:'both', tax_mode:'both' } };   // 控えとも両方ちがう＝競合
    const mg = mergeIntoState(st, old, { model:M, base:base, mode:'write', others:[], askable:false });
    return { misc: st.misc_fee, tax: st.tax_mode, kept: mg.kept.join('・') };
  });
  console.log('⑯-e PCだけの欄', JSON.stringify(r16e));
  ok(r16e.misc === 'include' && r16e.tax === 'excl',
     '★PCだけの欄（諸経費・税）を現場の内容で上書きする → ' + JSON.stringify(r16e));

  // ⑯-f ガイドの整合取りの分を「現場が直した」と読まない（積算＝金額の穴）
  const r16f = await page.evaluate(async () => {
    const f = __pcFile('3A0001');
    f.antenna_guide = { ver:1, pattern:'hafu',
      parts:{ mastA:{placed:true,product:'M160Z'}, brkA:{placed:true,product:'SB3230'},
              antA:{placed:true,product:'U146'} } };
    f.mount_type = 'side_base_wall';          // ★PCが選んだ取付（ガイドの示す hafu とは別）
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(f)), '3A0001.json');
    await new Promise(r => setTimeout(r, 400));
    const 画面 = M.mount_type;                 // ガイドの整合取りで side_base_hafu になる
    M.chosho_note = '現場の備考'; M._touched = true;
    const st = buildState();
    mergeIntoState(st, JSON.parse(JSON.stringify(f)), { model:M, base:fileBaseGet(M), mode:'write', others:[], askable:false });
    return { 画面, 控え: (fileBaseGet(M)||{state:{}}).state.mount_type, 書く: st.mount_type };
  });
  console.log('⑯-f ガイドの整合', JSON.stringify(r16f));
  ok(r16f.画面 === 'side_base_hafu', '試験の前提: ガイドの整合取りが効いていない → ' + JSON.stringify(r16f));
  ok(r16f.控え === 'side_base_hafu' && r16f.書く === 'side_base_wall',
     '★ガイドの整合取りの分を「現場が直した」と読み、PCが選んだ取付（金額）を書き替える → ' + JSON.stringify(r16f));

  // ⑯-g 管理番号が空のままでも、同じ名前のファイルを読んで写真を和集合にする
  const r16g = await page.evaluate(async () => {
    const dir = window.__mkDir();
    M = freshModel(); ensureModelShape(M);
    M.chosho_photos = [{ label:'前1', dataUri: __png('#c33'), id:'q1' },
                       { label:'前2', dataUri: __png('#3a6'), id:'q2' }];
    M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    const name = currentFileName();
    await saveJsonRun();
    const 前 = ((JSON.parse(dir._files[name]||'{}').chosho_photos)||[]).length;
    M = freshModel(); ensureModelShape(M);
    M.chosho_photos = [{ label:'新1', dataUri: __png('#36c'), id:'q9' }];
    M._touched = true;
    await saveJsonRun();
    saveDirGet = og; saveDirOk = oo;
    const after = JSON.parse(dir._files[name]||'{}');
    return { name, 前, labels: (after.chosho_photos||[]).map(p=>p.label) };
  });
  console.log('⑯-g 番号なしの保存', JSON.stringify(r16g));
  ok(r16g.前 === 2, '試験の前提: 1回目が2枚で書けていない → ' + JSON.stringify(r16g));
  ok(r16g.labels.length === 3 && r16g.labels.indexOf('前1') >= 0 && r16g.labels.indexOf('新1') >= 0,
     '★管理番号が空のまま保存すると、前に同じ名前で保存した写真が消える → ' + JSON.stringify(r16g));

  /* ⑯-i 管理番号を入れないまま、同じ名前のところに「番号つきの戸別」のファイルが
          あったときは書き潰さない（別の戸別だから） */
  const r16i = await page.evaluate(async () => {
    const dir = window.__mkDir();
    M = freshModel(); ensureModelShape(M);
    const name = currentFileName();
    dir._files[name] = JSON.stringify(__pcFile('3C0001'));     // 番号つきの戸別が入っている
    M.chosho_photos = [{ label:'新1', dataUri: __png('#36c'), id:'z1' }];
    M._touched = true;
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.__asked = [];
    await saveJsonRun();
    saveDirGet = og; saveDirOk = oo;
    const after = JSON.parse(dir._files[name]);
    return { 番号: after.chosho_mgmt_no, 写真: (after.chosho_photos||[]).length,
             asked: window.__asked.join(' / ') };
  });
  console.log('⑯-i 番号つきを書き潰さない', JSON.stringify(r16i));
  ok(r16i.番号 === '3C0001' && r16i.写真 === 2,
     '★管理番号を入れないまま、別の戸別（番号つき）のファイルを書き潰した → ' + JSON.stringify(r16i));
  ok(/3C0001/.test(r16i.asked), '★別の戸別だと知らせていない → ' + JSON.stringify(r16i.asked));

  /* ⑯-h 「まとめて保存」でフォルダを選べない端末（共有・ダウンロード）でも、
          写真が減る戸別は渡さない（1件保存と同じ守り方になっているか） */
  const r16h = await page.evaluate(async () => {
    try{ for(const r of (await idbGetAll())||[]) if(r && r.key) await idbDel(r.key); }catch(_){}
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('3B0001'))), '3B0001.json');
    await new Promise(r => setTimeout(r, 400));
    M.chosho_photos = []; delete M._fileBase;
    M.chosho_cust_addr = '現場で書いた住所'; M._touched = true;
    await persistDraft();
    const odp = window.showDirectoryPicker, osh = window.shareFilesSmart;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    let 渡した = [];
    window.shareFilesSmart = async (items) => { 渡した = items.map(i => i.name); return { ok:true, name:渡した, as:"" }; };
    window.__asked = []; window.__answer = true;
    await saveAllDrafts();
    if(odp) window.showDirectoryPicker = odp; window.shareFilesSmart = osh;
    return { 副本: (await pbaseIds('3B0001')).length, 渡した, asked: window.__asked.join(' / ') };
  });
  console.log('⑯-h まとめて共有', JSON.stringify(r16h));
  ok(r16h.副本 === 2, '試験の前提: 写真IDの副本が残っていない → ' + r16h.副本);
  ok(r16h.渡した.indexOf('3B0001.json') < 0,
     '★フォルダを読めない端末の「まとめて保存」で、写真が減る戸別を渡してしまう → ' + JSON.stringify(r16h));
  ok(/写真が減りそうなので/.test(r16h.asked) && /読み込んで/.test(r16h.asked),
     '★渡さなかった理由と直し方を言っていない → ' + JSON.stringify(r16h.asked));

  /* ---- ⑰ 受付台帳で事務所が直した工事日・時刻・打合せ・備考と、
           付けた下見・完了書の○が、現場の「保存」で消えない ---- */
  const r17 = await page.evaluate(async () => {
    const dir = window.__mkDir();
    dir._files['400001.json'] = JSON.stringify({
      chosho_mgmt_no:'400001', work_type:'new', chosho_cust_name:'あ様',
      chosho_date:'2026-08-01', chosho_time:'09:30', chosho_meet_at:'2026-07-28 10:00',
      chosho_note:'前の備考', survey_done:false, compdoc_received:false,
      chosho_status:'in_progress', cable_main_len:'12', _origin:'main' });
    // 事務所が受付台帳で直して書き出した（写真0枚・図面なし・未完了＝【見るだけ】の関門は掛からない）
    receptionSaveRows({ rows:[{ mgmt_no:'400001', name:'あ様', addr:'○市1-1',
      date:'2026-08-05', time:'13:00', meet:'2026-08-03 09:00', note:'事務所が直した備考',
      status:'in_progress', survey:true, compdoc:true, photos:0, has_dwg:false, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]);
    await new Promise(r => setTimeout(r, 600));
    const 取込後 = { date: M.chosho_date, time: M.chosho_time, note: M.chosho_note,
                     survey: M.survey_done === true, compdoc: M.compdoc_received === true };
    M.cable_main_len = '30'; M._touched = true;          // 現場はケーブルの長さだけ入れた
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.__answer = true;
    await saveJsonRun();
    saveDirGet = og; saveDirOk = oo;
    const f = JSON.parse(dir._files['400001.json']);
    return { 取込後, date: f.chosho_date, time: f.chosho_time, meet: f.chosho_meet_at,
             note: f.chosho_note, survey: f.survey_done === true, compdoc: f.compdoc_received === true,
             画面の工事日: M.chosho_date, 画面の下見: M.survey_done === true };
  });
  console.log('⑰台帳の直し', JSON.stringify(r17));
  ok(r17.取込後.date === '2026-08-05' && r17.取込後.survey === true && r17.取込後.compdoc === true,
     '試験の前提: 台帳の直しが画面に入っていない → ' + JSON.stringify(r17.取込後));
  ok(r17.date === '2026-08-05' && r17.time === '13:00' && r17.meet === '2026-08-03 09:00'
     && r17.note === '事務所が直した備考',
     '★事務所が受付台帳で直した工事日・時刻・打合せ・備考が、保存でファイルの古い値に戻る → ' + JSON.stringify(r17));
  ok(r17.survey === true && r17.compdoc === true,
     '★受付台帳で付けた下見・完了書の○が、保存で消える → ' + JSON.stringify(r17));
  ok(r17.画面の工事日 === '2026-08-05' && r17.画面の下見 === true,
     '★保存したあと、画面まで古い値に巻き戻る → ' + JSON.stringify(r17));

  /* ---- ⑱ 「全部保存し直す」も、台帳を入れ直しただけの戸別は書き替えない（G1） ---- */
  const r18 = await page.evaluate(async () => {
    try{ for(const r of (await idbGetAll())||[]) if(r && r.key) await idbDel(r.key); }catch(_){}
    receptionSaveRows({ rows:[{ mgmt_no:'410001', name:'い様', addr:'○市2-2',
      date:'2026-08-10', status:'in_progress', survey:true, photos:2, has_dwg:true, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]);      // 開いただけ（何も入力しない）
    await new Promise(r => setTimeout(r, 600));
    await persistDraft();
    // 事務所が台帳をもう一度直して、現場が取り込み直す
    receptionSaveRows({ rows:[{ mgmt_no:'410001', name:'い様', addr:'○市2-2',
      date:'2026-08-20', note:'台帳の備考', status:'in_progress', survey:true,
      photos:2, has_dwg:true, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    const odp = window.showDirectoryPicker, osh = window.shareFilesSmart;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    let 渡した = [];
    window.shareFilesSmart = async (items) => { 渡した = items.map(i => i.name); return { ok:true, name:渡した, as:"" }; };
    window.__asked = []; window.__answer = true;
    await saveAllDrafts("all");
    if(odp) window.showDirectoryPicker = odp; window.shareFilesSmart = osh;
    const info = await idbGet('no:410001');
    return { 渡した, 入力した印: !!(info && info.model && info.model._touched),
             asked: window.__asked.join(' / ') };
  });
  console.log('⑱全部保存し直す', JSON.stringify(r18));
  ok(r18.入力した印 === false,
     '★台帳を入れ直しただけで「現場で入力した」印を立てている（G1が効かなくなる） → ' + JSON.stringify(r18));
  ok(r18.渡した.indexOf('410001.json') < 0,
     '★この端末で何も入力していない戸別を、写真ごと書き替えて渡してしまう → ' + JSON.stringify(r18));

  /* ---- ⑲ 📂 の読み込みで、現場が入れた工事日・時刻・備考が黙って消えない ---- */
  const r19 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await loadStateInto(JSON.parse(JSON.stringify(__pcFile('420001'))), '420001.json');
    await new Promise(r => setTimeout(r, 400));
    M.chosho_date = '2026-09-20'; M.chosho_time = '15:00'; M.chosho_note = '現場の備考';
    M.cable_main_len = '33'; M._touched = true;
    const f2 = __pcFile('420001');
    f2.chosho_date = '2026-09-09'; f2.chosho_time = '08:00'; f2.chosho_note = 'PCが直した備考';
    window.__asked = [];
    await loadStateInto(JSON.parse(JSON.stringify(f2)), '420001.json');
    await new Promise(r => setTimeout(r, 400));
    return { date: M.chosho_date, time: M.chosho_time, note: M.chosho_note,
             cable: M.cable_main_len, asked: window.__asked.join(' / ') };
  });
  console.log('⑲読み込み直し', JSON.stringify(r19));
  ok(r19.date === '2026-09-20' && r19.time === '15:00' && r19.note === '現場の備考',
     '★読み込み直しで、現場が入れた工事日・時刻・備考が黙ってPCの値に置き換わる → ' + JSON.stringify(r19));
  ok(/違っていました/.test(r19.asked) && /工事日/.test(r19.asked),
     '★違っていたことを知らせていない → ' + JSON.stringify(r19.asked));

  await page.evaluate(() => { uiConfirm = window.__oc; uiAlert = window.__oa; });
  await b.close();
  ok(errs.length === 0, 'ページエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_pcbase');
})();
