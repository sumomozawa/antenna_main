/* 版174: 主アンテナで受ける局（antenna_stations）と、主系統ラインブースターの場所（line_booster_pos）（現場入力）。
   ・既定はどちらも ""（ふだん）。古い下書き・古い戸別を開いても勝手に変わらない
   ・選べない構成（3本構成・3分配・1入力の増幅器・ラインブースター無し・アパート）では欄が出ない（値は消さない）
   ・場所の選択肢の名前は局の組み合わせで変わる（値は固定＝PCと同じ）
   ・PCへ渡す中身に入る（知っている欄・書き出しの文字）。融合の呼び名も付く
   ・幅320pxのスマホで横にはみ出さない */
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
const HTML = process.argv[2] || FILE('antenna_genba');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:420,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);

  // ---- ⓪ 前提 ----
  const ready = await page.evaluate(() => ({
    f: ['freshModel','ensureModelShape','buildState','render','modelFromCaseState','mergeLabelOf','isBuildKey',
        'staShown','lbPosShown','lbPosOptsFor'].filter(n => typeof window[n] !== 'function'),
    sta: (OPT.antenna_stations || []).map(x => x[0]).join('/'),
    lbp: (OPT.line_booster_pos || []).map(x => x[0]).join('/'),
    def: [DEFAULTS.antenna_stations, DEFAULTS.line_booster_pos],
    known: ['antenna_stations','line_booster_pos'].map(k => GENBA_KNOWN_KEYS.has(k)),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.sta === '/hachinohe_misawa/ninohe_misawa', '★「主アンテナで受ける局」の値がPCと違う → ' + ready.sta);
  ok(ready.lbp === '/sp_right/sp_left', '★「ラインブースターの場所」の値がPCと違う → ' + ready.lbp);
  ok(ready.def[0] === '' && ready.def[1] === '', '★既定が "" でない → ' + JSON.stringify(ready.def));
  ok(ready.known.every(Boolean), '★知っている欄に入っていない（画面で直しても保存でPCの値に戻る） → ' + JSON.stringify(ready.known));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    window.__seg = id => document.querySelector('[data-seg="' + id + '"]');
    window.__btns = id => __seg(id) ? Array.from(__seg(id).querySelectorAll('button'))
      .map(x => x.getAttribute('data-v') + ':' + x.textContent + (x.classList.contains('on') ? '*' : '')) : null;
    window.__base = () => { M = freshModel(); ensureModelShape(M);
      Object.assign(M, { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes' });
      openState.antenna = true; openState.amp = true; render(); };
  });

  // ---- ① 欄が出る・並び・既定 ----
  const r1 = await page.evaluate(() => {
    __base();
    const ant = (SECTIONS.find(s => s.id === 'antenna') || {}).fields || [];
    const amp = (SECTIONS.find(s => s.id === 'amp') || {}).fields || [];
    const bs = buildState();
    return { sta: __btns('antenna_stations'), lbp: __btns('line_booster_pos'),
             orderSta: [ant.findIndex(f => f.id === 'ch46'), ant.findIndex(f => f.id === 'antenna_stations')],
             orderLb: [amp.findIndex(f => f.id === 'line_booster'), amp.findIndex(f => f.id === 'line_booster_46'),
                       amp.findIndex(f => f.id === 'line_booster_pos')],
             out: [bs.antenna_stations, bs.line_booster_pos],
             labels: [ (__seg('antenna_stations') && __seg('antenna_stations').closest('.fld').querySelector('label').textContent) || '',
                       (__seg('line_booster_pos') && __seg('line_booster_pos').closest('.fld').querySelector('label').textContent) || '' ] };
  });
  console.log('①既定', JSON.stringify(r1));
  ok(JSON.stringify(r1.sta) === '[":八戸＋めんこい（ふだん）*","hachinohe_misawa:八戸＋三沢","ninohe_misawa:めんこい＋三沢"]',
     '★「主アンテナで受ける局」の既定・並びがおかしい → ' + JSON.stringify(r1.sta));
  ok(JSON.stringify(r1.lbp) === '[":HPFの下（ふだん）*","sp_right:分配後 50ch（めんこい）だけ","sp_left:分配後 14-24ch（八戸）だけ"]',
     '★「ラインブースターの場所」の既定・並びがおかしい → ' + JSON.stringify(r1.lbp));
  ok(r1.orderSta[1] === r1.orderSta[0] + 1, 'UHFアンテナ本数のすぐ下に並んでいない → ' + JSON.stringify(r1.orderSta));
  ok(r1.orderLb[1] === r1.orderLb[0] + 1 && r1.orderLb[2] === r1.orderLb[1] + 1,
     'ラインブースターの欄の並びがおかしい（主系統→46CH系統→場所） → ' + JSON.stringify(r1.orderLb));
  ok(r1.out.join(',') === ',', '★PCへ渡す中身の既定が "" でない → ' + JSON.stringify(r1.out));
  ok(/主系統/.test(r1.labels[1]) && /場所/.test(r1.labels[1]) && /主アンテナ/.test(r1.labels[0]) && !r1.labels.some(s => /[a-z_]{6,}/.test(s)),
     '★見出しが分かりにくい（どのラインブースターの場所か分からない・英字のまま等） → ' + JSON.stringify(r1.labels));

  // ---- ② 出し分け（値は消さない） ----
  const r2 = await page.evaluate(() => {
    const vis = () => ({ sta: !!__seg('antenna_stations'), lbp: !!__seg('line_booster_pos') });
    const out = {};
    __base(); M.antenna_stations = 'ninohe_misawa'; M.line_booster_pos = 'sp_left'; render(); out.std = vis();
    M.ch46 = 'no'; render(); out.one = vis();
    M.ch46 = 'triple'; render(); out.triple = vis();
    M.ch46 = 'no'; M.outer_splitter = 'sp_3cw'; render(); out.sp3 = vis();
    M.outer_splitter = 'sp_2cw'; M.amplifier = 'amp_1u45'; render(); out.amp1 = vis();
    M.amplifier = 'amp_3u43'; M.line_booster = 'no'; render(); out.lbNo = vis();
    M.line_booster = 'yes'; M._passthrough = Object.assign({}, M._passthrough || {}, { apt_units:'3', apt_idx:'1' }); render(); out.apt = vis();
    M._passthrough = {}; render();
    const bs = buildState(); out.kept = [M.antenna_stations, M.line_booster_pos, bs.antenna_stations, bs.line_booster_pos];
    return out;
  });
  console.log('②出し分け', JSON.stringify(r2));
  ok(r2.std.sta && r2.std.lbp && r2.one.sta && r2.one.lbp, '★2分配がある構成で欄が出ない → ' + JSON.stringify(r2));
  ok(!r2.triple.sta && !r2.triple.lbp && !r2.sp3.sta && !r2.sp3.lbp, '★3本構成・3分配器WPなのに欄が出る → ' + JSON.stringify(r2));
  ok(r2.amp1.sta && !r2.amp1.lbp && r2.lbNo.sta && !r2.lbNo.lbp && r2.apt.sta && !r2.apt.lbp,
     '★1入力の増幅器・ラインブースター無し・アパートなのに「ラインブースターの場所」が出る → ' + JSON.stringify(r2));
  ok(r2.kept.join(',') === 'ninohe_misawa,sp_left,ninohe_misawa,sp_left', '隠れた欄の値が消える → ' + JSON.stringify(r2.kept));

  // ---- ③ 押して入る・PCへ渡る・選択肢の名前が局で変わる ----
  const r3 = await page.evaluate(() => {
    __base();
    const click = (id, v) => { const x = __seg(id) && __seg(id).querySelector('button[data-v="' + v + '"]'); if(x) x.click(); };
    click('line_booster_pos', 'sp_right');
    const a = { v: M.line_booster_pos, on: __btns('line_booster_pos'), out: buildState().line_booster_pos };
    click('antenna_stations', 'hachinohe_misawa');
    const hm = { v: M.antenna_stations, lbp: __btns('line_booster_pos'), out: buildState().antenna_stations };
    click('antenna_stations', 'ninohe_misawa');
    const nm = { lbp: __btns('line_booster_pos') };
    click('antenna_stations', ''); click('line_booster_pos', '');
    return { a, hm, nm, back: [M.antenna_stations, M.line_booster_pos] };
  });
  console.log('③押す', JSON.stringify(r3));
  ok(r3.a.v === 'sp_right' && r3.a.out === 'sp_right' && r3.a.on[1].endsWith('*'), '★押しても値が入らない／PCへ渡らない → ' + JSON.stringify(r3.a));
  ok(r3.hm.v === 'hachinohe_misawa' && r3.hm.out === 'hachinohe_misawa', '★局の組み合わせが入らない／PCへ渡らない → ' + JSON.stringify(r3.hm));
  ok(JSON.stringify(r3.hm.lbp) === '[":HPFの下（ふだん）","sp_right:分配後 46ch（三沢）だけ*","sp_left:分配後 14-24ch（八戸）だけ"]',
     '★八戸＋三沢で場所の選択肢の名前が変わらない（値が変わってはいけない） → ' + JSON.stringify(r3.hm.lbp));
  ok(JSON.stringify(r3.nm.lbp) === '[":HPFの下（ふだん）","sp_right:分配後 46ch（三沢）だけ*","sp_left:分配後 50ch（めんこい）だけ"]',
     '★めんこい＋三沢で場所の選択肢の名前が変わらない → ' + JSON.stringify(r3.nm.lbp));
  ok(r3.back.join(',') === ',', '「ふだん」に戻せない → ' + JSON.stringify(r3.back));

  // ---- ④ 往復（PCのファイル ⇄ 現場入力）・古い下書き ----
  const r4 = await page.evaluate(() => {
    __base(); M.antenna_stations = 'ninohe_misawa'; M.line_booster_pos = 'sp_left';
    const s = buildState();
    const m2 = modelFromCaseState(s, true);
    const old = Object.assign({}, s); delete old.antenna_stations; delete old.line_booster_pos;   // 版173 以前の戸別
    const m3 = modelFromCaseState(old, true); ensureModelShape(m3);
    const draft = freshModel(); delete draft.antenna_stations; delete draft.line_booster_pos; ensureModelShape(draft);   // 古い下書き
    M = m3; const out3 = buildState();
    return { m2: [m2.antenna_stations, m2.line_booster_pos], pass: Object.keys(m2._passthrough || {}).filter(k => /antenna_stations|line_booster_pos/.test(k)),
             m3: [m3.antenna_stations, m3.line_booster_pos], draft: [draft.antenna_stations, draft.line_booster_pos],
             out3: ['antenna_stations' in out3, 'line_booster_pos' in out3, out3.antenna_stations, out3.line_booster_pos] };
  });
  console.log('④往復', JSON.stringify(r4));
  ok(r4.m2.join(',') === 'ninohe_misawa,sp_left' && r4.pass.length === 0,
     '★PCで選んだ値を現場入力が読まない（知らない欄として素通し） → ' + JSON.stringify(r4));
  ok(r4.m3.join(',') === ',' && r4.draft.join(',') === ',', '★古い戸別・古い下書きで既定が "" にならない → ' + JSON.stringify(r4));
  ok(r4.out3.join(',') === 'true,true,,', '★古い戸別を保存したとき "" を書かない（PCへ「ふだん」が伝わらない） → ' + JSON.stringify(r4.out3));

  // ---- ⑤ 融合（重複をまとめる）の扱い ----
  const r5 = await page.evaluate(() => ({
    lab: [mergeLabelOf('antenna_stations'), mergeLabelOf('line_booster_pos')],
    build: [isBuildKey('antenna_stations'), isBuildKey('line_booster_pos')],
    never: ['antenna_stations','line_booster_pos'].some(k => MERGE_NEVER.has(k) || MERGE_PC_ONLY.has(k))
  }));
  console.log('⑤融合', JSON.stringify(r5));
  ok(r5.lab.join(',') === 'アンテナ・取付,増幅器・分配器・電源', '融合の呼び名がおかしい → ' + JSON.stringify(r5.lab));
  ok(r5.build.every(Boolean) && !r5.never, '★融合で中身として扱われない → ' + JSON.stringify(r5));

  // ---- ⑥ 幅320pxで横にはみ出さない（字の長い組み合わせで） ----
  const ctx = await b.newContext({ viewport:{ width:320, height:700 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errs.push('pageerror(320): ' + e.message));
  p2.on('dialog', d => d.accept().catch(()=>{}));
  await p2.goto(HTML); await p2.waitForTimeout(2500);
  const r6 = await p2.evaluate(() => {
    const out = [];
    for(const st of ['', 'hachinohe_misawa', 'ninohe_misawa']){
      M = freshModel(); ensureModelShape(M);
      Object.assign(M, { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', antenna_stations: st, line_booster_pos:'sp_right' });
      openState.antenna = true; openState.amp = true; render();
      const w = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll('[data-seg="antenna_stations"] button, [data-seg="line_booster_pos"] button').forEach(el => {
        const r = el.getBoundingClientRect(); if(r.right > w + 0.5 || r.left < -0.5) bad.push(el.textContent);
      });
      out.push({ st, sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, w, bad,
                 n: document.querySelectorAll('[data-seg="line_booster_pos"] button').length });
    }
    return out;
  });
  console.log('⑥320px', JSON.stringify(r6));
  ok(r6.every(x => x.n === 3 && x.sw <= x.w && x.bw <= x.w && x.bad.length === 0),
     '★幅320pxのスマホで横にはみ出す（画面が横に動く） → ' + JSON.stringify(r6));
  await ctx.close();

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v174_genba');
})();
