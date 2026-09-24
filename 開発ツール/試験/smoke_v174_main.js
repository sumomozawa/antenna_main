/* 版174: 主アンテナで受ける局（antenna_stations）と、主系統ラインブースターの場所（line_booster_pos）（メイン）。
   ・どちらも既定（""）なら、図面・積算・画面は今までと同じ（位置も字も）
   ・どの値にしても、積算の行（鍵・数量・金額）は1つも変わらない
   ・場所を「分配後」にすると、箱が2分配の片方の枝の上に移り、その線が箱で割れる（鍵は今までのまま）
   ・局の組み合わせを変えると、図面の見出し・線の名前・分配器の字・付箋に1行・画面の局名が変わる
   ・選べない構成（3本構成・3分配・1入力の増幅器・ラインブースター無し・アパート）では欄が隠れ、値は残るが図面に効かない
   ・保存・開き直し・古い戸別・プリセット・現場取込・保存データからの積算で値が化けない */
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

  // ---- ⓪ 前提 ----
  const ready = await page.evaluate(() => ({
    f: ['stationLayout','lbPosApplicable','lbPosOf','getInputs','buildBOM','buildBOMForData','convertSavedToInput',
        'collectState','collectStateForPreset','blankCaseState','applyStateData','applyPresetData','applyPreset',
        'rebuild','renderDiagram','genbaMergeCaseData','renderChosho','choshoDiagramForPrint']
         .filter(n => typeof window[n] !== 'function'),
    sta: Array.from((document.getElementById('antenna_stations') || { options: [] }).options).map(o => o.value).join('/'),
    lbp: Array.from((document.getElementById('line_booster_pos') || { options: [] }).options).map(o => o.value).join('/'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.sta === '/hachinohe_misawa/ninohe_misawa', '★「主アンテナで受ける局」の選択肢がおかしい（現場入力と値が違う） → ' + ready.sta);
  ok(ready.lbp === '/sp_right/sp_left', '★「ラインブースターの場所」の選択肢がおかしい（現場入力と値が違う） → ' + ready.lbp);
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    window.__set = (id, v) => { const el = document.getElementById(id); if(el){ el.value = v; } };
    // 新しい戸別に戻す。blankCaseState はアパートの欄（世帯数）を持たないので、戸建てへ明示的に戻す
    window.__fresh = (c) => { applyStateData(blankCaseState()); STATE.nodeOffsets = {}; STATE.wireOverrides = {};
      __set('apt_units', ''); __set('apt_common', 'no');
      for(const k in (c || {})) __set(k, c[k]); rebuild(); };
    window.__d = k => document.querySelector('#diagram g.node[data-nodekey="' + k + '"]');
    window.__at = (k, a) => { const g = __d(k); return g ? g.getAttribute(a) : null; };
    window.__txt = k => { const g = __d(k); return g ? Array.from(g.querySelectorAll('text')).map(t => t.textContent) : null; };
    window.__wires = k => Array.from(document.querySelectorAll('#diagram path[data-wire-key="' + k + '"]:not(.wire-hit)'))
      .map(p => p.getAttribute('d'));
    window.__labels = () => Array.from(document.querySelectorAll('#diagram text.wire-label')).map(t => t.textContent);
    window.__note = () => Array.from(document.querySelectorAll('#diagram g.draggable-box text'))
      .map(t => ({ s: t.textContent, w: Math.round(t.getComputedTextLength()) }));
    window.__shown = id => { const el = document.getElementById(id); const f = el && el.closest('.field');
      return !!f && getComputedStyle(f).display !== 'none'; };
    window.__bomSig = () => (STATE.bom || []).map(r => [r.key, r.qty, r.material_cost, r.labor_cost].join('|')).join('\n')
      + '\n#' + ((document.getElementById('totals') || {}).textContent || '');
  });

  // ---- ① 既定（""）の図面は今までと同じ位置・同じ字 ----
  const r1 = await page.evaluate(() => {
    __fresh({ ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', hpf:'hpf_std', line_booster_46:'no', att_main:'no' });
    const st = collectState();
    const out = {
      keys: [st.antenna_stations, st.line_booster_pos],
      lb: [__at('lb','data-x'), __at('lb','data-y'), __at('lb','data-w')], lbSp: !!__d('lb_sp'),
      sp: __at('outer_sp','data-y'), a1: __wires('main_amp_1'), a2: __wires('main_amp_2'),
      trunk: [0,1,2].map(i => __wires('main_trunk_' + i).length),
      main: __txt('ant_main'), a46: __txt('ant_46'), spT: __txt('outer_sp'), labels: __labels(),
      note: __note().map(x => x.s),
      ui: [document.getElementById('antenna_46_label').textContent, document.getElementById('cable_ch46_hint').textContent,
           Array.from(document.getElementById('line_booster_pos').options).map(o => o.textContent).join('/')]
    };
    // 前の戸別でHPFの下の箱を動かしていたら、今までどおりその位置に出る
    STATE.nodeOffsets = { lb: { dx: 7, dy: 9 } }; rebuild();
    out.moved = (__d('lb') || { getAttribute: () => '' }).getAttribute('transform');
    STATE.nodeOffsets = {}; rebuild();
    return out;
  });
  console.log('①既定', JSON.stringify(r1));
  ok(r1.keys[0] === '' && r1.keys[1] === '', '★新しい戸別の既定が "" でない → ' + JSON.stringify(r1.keys));
  ok(r1.lb.join(',') === '40,177,80' && r1.lbSp === false,
     '★既定なのにラインブースターの箱がHPFの下に無い（または位置が変わった） → ' + JSON.stringify(r1));
  ok(r1.sp === '223', '★既定なのに2分配の位置が変わった → ' + r1.sp);
  ok(r1.a1.length === 1 && r1.a1[0] === 'M 55,263 L 55,312 L 194,312 A 6,6 0 0,1 206,312 L 460,312'
     && r1.a2.length === 1 && r1.a2[0] === 'M 105,263 L 105,326 L 194,326 A 6,6 0 0,1 206,326 L 460,326',
     '★既定なのに2分配から増幅器への線が変わった → ' + JSON.stringify([r1.a1, r1.a2]));
  ok(r1.trunk.join(',') === '1,1,1', '★既定なのに アンテナ→HPF→LB→2分配 の線の数が変わった → ' + r1.trunk);
  ok(JSON.stringify(r1.main.slice(1)) === '["主系統","八戸14-24+二戸50ch"]'
     && JSON.stringify(r1.a46.slice(1)) === '["三沢局","46ch 専用"]',
     '★既定なのにアンテナの見出しが変わった → ' + JSON.stringify([r1.main, r1.a46]));
  ok(JSON.stringify(r1.spT) === '["2分配","(14-24/50別調整)"]', '★既定なのに2分配の字が変わった → ' + JSON.stringify(r1.spT));
  ok(['14-24ch','50ch','46ch(三沢局) 5m'].every(s => r1.labels.indexOf(s) >= 0),
     '★既定なのに線の名前が変わった → ' + JSON.stringify(r1.labels));
  ok(!r1.note.some(s => /^受信/.test(s)), '★既定なのに取付構成の付箋に「受信」の行が出る → ' + JSON.stringify(r1.note));
  ok(r1.ui.join(' | ') === '46CH(三沢局) | 三沢局U206→増幅器46ch入力 | HPFの下（ふだん）/分配後 50ch(めんこい)/分配後 14-24ch(八戸)',
     '★既定なのに画面の局名・選択肢の字が変わった → ' + JSON.stringify(r1.ui));
  ok(r1.moved === 'translate(7,9)', '★前の戸別で動かしたラインブースターの位置が、既定のときに効かなくなった → ' + r1.moved);

  // ---- ② どの値にしても、積算の行（鍵・数量・金額）と合計は1つも変わらない ----
  const r2 = await page.evaluate(() => {
    const CFG = [
      { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', line_booster_46:'yes' },
      { ch46:'no', amplifier:'amp_3u43', outer_splitter:'sp_2cdw', line_booster:'yes', hpf:'no', att_main:'att_w6' },
      { ch46:'triple', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes' },
      { ch46:'no', amplifier:'amp_3u43', outer_splitter:'sp_3cw', line_booster:'yes' },
      { ch46:'yes', amplifier:'amp_1u45', outer_splitter:'sp_2cw', line_booster:'yes', bs_cs:'yes' },
      { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'no', outer_wire:'new' },
      { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', apt_units:'3', apt_common:'yes' },
    ];
    const VALS = [];
    for(const s of ['', 'hachinohe_misawa', 'ninohe_misawa']) for(const p of ['', 'sp_right', 'sp_left'])
      VALS.push({ antenna_stations: s, line_booster_pos: p });
    const bad = [];
    CFG.forEach((c, i) => {
      let base = null, baseData = null;
      VALS.forEach(v => {
        __fresh(Object.assign({}, c, v));
        const sig = __bomSig();
        const d = collectState();
        const sd = buildBOMForData(d, {}).map(r => [r.key, r.qty, r.material_cost, r.labor_cost].join('|')).join('\n');
        if(base === null){ base = sig; baseData = sd; }
        else if(sig !== base || sd !== baseData) bad.push(i + ':' + JSON.stringify(v));
      });
    });
    return { bad, n: CFG.length * VALS.length };
  });
  console.log('②積算は不変', JSON.stringify(r2));
  ok(r2.bad.length === 0, '★新しい欄の値で積算・金額が変わる（金額は絶対に変えない決まり） → ' + r2.bad.slice(0, 4).join(' / '));

  // ---- ③ 場所＝分配後：箱が2分配の片方の枝の上に移り、線が箱で割れる（鍵は同じ） ----
  const r3 = await page.evaluate(() => {
    const base = { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', hpf:'hpf_std' };
    const one = pos => {
      __fresh(Object.assign({}, base, { line_booster_pos: pos }));
      const g = __d('lb_sp');
      return { lb: !!__d('lb'), sp: [__at('outer_sp','data-y'), __at('outer_sp','data-h')],
               x: __at('lb_sp','data-x'), y: __at('lb_sp','data-y'), w: __at('lb_sp','data-w'), lock: __at('lb_sp','data-axislock'),
               txt: g ? g.textContent.replace(/\s+/g, ' ').trim() : '', edit: g ? g.getAttribute('data-editable') : null,
               a1: __wires('main_amp_1'), a2: __wires('main_amp_2'), trunk: [0,1,2].map(i => __wires('main_trunk_' + i).length),
               rows: (STATE.bom || []).filter(r => r.id === 'booster_ub18l').map(r => r.key) };
    };
    const right = one('sp_right'), left = one('sp_left');
    // 線色の切り替え：割れた2本とも同じ鍵で一緒に黒になる
    __fresh(Object.assign({}, base, { line_booster_pos: 'sp_right' }));
    STATE.wireOverrides = { main_amp_2: true }; rebuild();
    const cls = Array.from(document.querySelectorAll('#diagram path[data-wire-key="main_amp_2"]:not(.wire-hit)')).map(p => p.getAttribute('class'));
    // HPFの下で動かした位置（lb）は、枝の上の箱へ持ち込まない。枝の箱は縦にだけ動く
    STATE.wireOverrides = {}; STATE.nodeOffsets = { lb: { dx: 30, dy: 40 }, lb_sp: { dx: 50, dy: 5 } }; rebuild();
    const moved = { tf: (__d('lb_sp') || { getAttribute: () => '' }).getAttribute('transform'), a2: __wires('main_amp_2') };
    STATE.nodeOffsets = {}; rebuild();
    return { right, left, cls, moved };
  });
  console.log('③分配後', JSON.stringify(r3));
  ok(r3.right.lb === false && r3.right.x === '73' && r3.right.w === '64' && r3.right.lock === 'y',
     '★「分配後 50ch」にしたのに、箱が右の枝（50ch）の上に移らない → ' + JSON.stringify(r3.right));
  ok(+r3.right.y > (+r3.right.sp[0] + +r3.right.sp[1]) && +r3.right.y < 300,
     '★枝の箱が2分配の下（増幅器より上）に無い → ' + JSON.stringify(r3.right));
  ok(r3.right.sp[0] === '177', '★箱がHPFの下から抜けたのに、2分配が上へ詰まらない → ' + JSON.stringify(r3.right.sp));
  ok(r3.right.a2.length === 2 && r3.right.a1.length === 1,
     '★50chの線が箱で割れていない（箱を突き抜ける）／14-24chの線まで割れた → ' + JSON.stringify([r3.right.a1, r3.right.a2]));
  ok(r3.right.trunk.join(',') === '1,1,0', '★主系統の縦の線の数がおかしい（HPF→2分配の1本になるはず） → ' + r3.right.trunk);
  ok(r3.left.x === '23' && r3.left.a1.length === 2 && r3.left.a2.length === 1,
     '★「分配後 14-24ch」にしたのに、箱が左の枝の上に移らない／線が割れない → ' + JSON.stringify(r3.left));
  ok(+r3.left.x >= 21, '★左の枝の箱が屋外の枠の線にかかる → ' + r3.left.x);
  ok(/LB/.test(r3.right.txt) && /UB18L/.test(r3.right.txt) && r3.right.edit === 'true',
     '★枝の箱の字がおかしい／押しても選び直せない → ' + JSON.stringify(r3.right));
  ok(JSON.stringify(r3.right.rows) === '["booster_ub18l|"]' && JSON.stringify(r3.left.rows) === '["booster_ub18l|"]',
     '★場所を変えたら積算のラインブースターの行（鍵）が変わった → ' + JSON.stringify([r3.right.rows, r3.left.rows]));
  ok(r3.cls.length === 2 && r3.cls.every(c => /\bexist\b/.test(c)),
     '★割れた2本の線が一緒に黒（既存）にならない（鍵が違う） → ' + JSON.stringify(r3.cls));
  ok(!r3.moved.tf || r3.moved.tf === 'translate(0,5)',
     '★HPFの下で動かした位置が枝の箱に持ち込まれる／枝の箱が横にずれる → ' + JSON.stringify(r3.moved));

  // ---- ④ 選べない構成では欄が隠れ、値は残るが図面に効かない ----
  const r4 = await page.evaluate(() => {
    const out = {};
    const CASES = {
      std:    { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes' },
      one:    { ch46:'no', amplifier:'amp_3u43', outer_splitter:'sp_2cdw', line_booster:'yes' },
      triple: { ch46:'triple', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes' },
      sp3:    { ch46:'no', amplifier:'amp_3u43', outer_splitter:'sp_3cw', line_booster:'yes' },
      amp1:   { ch46:'yes', amplifier:'amp_1u45', outer_splitter:'sp_2cw', line_booster:'yes' },
      lbNo:   { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'no' },
      apt:    { ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', apt_units:'3', apt_common:'yes' }
    };
    for(const k in CASES){
      __fresh(Object.assign({}, CASES[k], { line_booster_pos: '' }));
      const svg0 = document.getElementById('diagram').outerHTML;
      __fresh(Object.assign({}, CASES[k], { line_booster_pos: 'sp_right', antenna_stations: '' }));
      const svg1 = document.getElementById('diagram').outerHTML;
      out[k] = { lbp: __shown('line_booster_pos'), sta: __shown('antenna_stations'), same: svg0 === svg1,
                 kept: collectState().line_booster_pos };
    }
    // 知らない値は「HPFの下」として描く（落ちない）
    __fresh(Object.assign({}, CASES.std, { line_booster_pos: '' }));
    const s0 = document.getElementById('diagram').outerHTML;
    const el = document.getElementById('line_booster_pos'); const o = document.createElement('option');
    o.value = 'zzz'; el.appendChild(o); el.value = 'zzz'; rebuild();
    out.unknownSame = document.getElementById('diagram').outerHTML === s0; o.remove();
    return out;
  });
  console.log('④出し分け', JSON.stringify(r4));
  ok(r4.std.lbp && r4.one.lbp && !r4.std.same && !r4.one.same,
     '★2分配がある構成で「ラインブースターの場所」が出ない／選んでも図面が変わらない → ' + JSON.stringify([r4.std, r4.one]));
  ['triple','sp3','amp1','lbNo','apt'].forEach(k => {
    ok(r4[k].lbp === false, '★2分配の無い構成（' + k + '）なのに「ラインブースターの場所」が出る → ' + JSON.stringify(r4[k]));
    ok(r4[k].same === true, '★2分配の無い構成（' + k + '）なのに、場所の値で図面が変わる → ' + JSON.stringify(r4[k]));
    ok(r4[k].kept === 'sp_right', '隠れている欄の値が保存で消える（' + k + '） → ' + JSON.stringify(r4[k]));
  });
  ok(r4.std.sta && r4.one.sta && r4.amp1.sta && r4.apt.sta && !r4.triple.sta && !r4.sp3.sta,
     '★「主アンテナで受ける局」の出し分けがおかしい（3本構成・3分配器WPだけ隠す） → ' + JSON.stringify(r4));
  ok(r4.unknownSame === true, '知らない値のとき「HPFの下」として描かない → ' + r4.unknownSame);

  // ---- ⑤ 局の組み合わせ：見出し・線・分配器・付箋・画面の局名 ----
  const r5 = await page.evaluate(() => {
    const one = (st, extra) => {
      __fresh(Object.assign({ ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes',
                              line_booster_46:'yes', high_work:'yes' }, extra || {}, { antenna_stations: st }));
      const mainTop = Array.from((__d('ant_main') || { querySelectorAll: () => [] }).querySelectorAll('text'));
      const lb46 = Array.from((__d('lb46') || { querySelectorAll: () => [] }).querySelectorAll('text'));
      return { main: mainTop.map(t => t.textContent), mainW: mainTop.map(t => Math.round(t.getComputedTextLength())),
               a46: __txt('ant_46'), sp: __txt('outer_sp'), labels: __labels(), note: __note(),
               lb46: lb46.map(t => t.textContent), lb46W: Math.max(0, ...lb46.map(t => t.getComputedTextLength())),
               ui: [document.getElementById('antenna_46_label').textContent, document.getElementById('cable_ch46_hint').textContent,
                    Array.from(document.getElementById('line_booster_pos').options).map(o => o.textContent).join('/')] };
    };
    return { hm: one('hachinohe_misawa'), nm: one('ninohe_misawa'),
             oneHm: one('hachinohe_misawa', { ch46:'no' }), triNm: one('ninohe_misawa', { ch46:'triple' }),
             def: one('') };
  });
  console.log('⑤局の組み合わせ', JSON.stringify(r5));
  const noteHas = (r, s) => r.note.some(x => x.s === s && x.w <= 179);
  ok(r5.hm.main[2] === '八戸14-24+三沢46ch' && r5.hm.mainW[2] <= 104, '★八戸＋三沢で主アンテナの見出しが変わらない（または幅が広すぎる） → ' + JSON.stringify(r5.hm.main));
  ok(JSON.stringify(r5.hm.a46.slice(1)) === '["二戸局","50ch 専用"]', '★八戸＋三沢で2本目の見出しが三沢のまま → ' + JSON.stringify(r5.hm.a46));
  ok(r5.hm.labels.indexOf('50ch(二戸局) 5m') >= 0 && r5.hm.labels.indexOf('46ch(三沢局) 5m') < 0,
     '★八戸＋三沢で2本目の線の名前が三沢のまま → ' + JSON.stringify(r5.hm.labels));
  ok(r5.hm.labels.indexOf('14-24ch') >= 0 && r5.hm.labels.indexOf('46ch') >= 0, '★八戸＋三沢で2分配の線の名前が変わらない → ' + JSON.stringify(r5.hm.labels));
  ok(JSON.stringify(r5.hm.sp) === '["2分配","(14-24/46別調整)"]', '八戸＋三沢で2分配の字が変わらない → ' + JSON.stringify(r5.hm.sp));
  ok(noteHas(r5.hm, '受信: 八戸+三沢が1本、二戸は別'), '★八戸＋三沢で付箋に「受信」の行が無い（または幅が広すぎる） → ' + JSON.stringify(r5.hm.note));
  ok(r5.hm.lb46[0] === 'LB(50ch)', '★2本目が二戸局なのに、2本目のラインブースターの箱が「LB(46ch)」のまま → ' + JSON.stringify(r5.hm.lb46));
  ok(r5.hm.ui.join(' | ') === '2本目 50CH(二戸局) | 二戸局U206→増幅器50ch入力 | HPFの下（ふだん）/分配後 46ch(三沢)/分配後 14-24ch(八戸)',
     '★八戸＋三沢で画面の局名・場所の選択肢の字が変わらない → ' + JSON.stringify(r5.hm.ui));
  ok(r5.nm.main[2] === '二戸50+三沢46ch' && JSON.stringify(r5.nm.a46.slice(1)) === '["八戸局","14-24ch 専用"]'
     && r5.nm.labels.indexOf('14-24ch(八戸局) 5m') >= 0 && r5.nm.labels.indexOf('50ch') >= 0 && r5.nm.labels.indexOf('46ch') >= 0
     && JSON.stringify(r5.nm.sp) === '["2分配","(50/46別調整)"]' && noteHas(r5.nm, '受信: 二戸+三沢が1本、八戸は別'),
     '★めんこい＋三沢の図面の字がおかしい → ' + JSON.stringify(r5.nm));
  ok(r5.nm.lb46[0] === 'LB(14-24ch)' && r5.nm.lb46W <= 78, '★めんこい＋三沢で2本目のラインブースターの箱の字がおかしい／はみ出す → ' + JSON.stringify([r5.nm.lb46, r5.nm.lb46W]));
  ok(r5.nm.ui[2] === 'HPFの下（ふだん）/分配後 46ch(三沢)/分配後 50ch(めんこい)', '★めんこい＋三沢で場所の選択肢の字が変わらない → ' + r5.nm.ui[2]);
  ok(r5.oneHm.main[2] === '八戸14-24+三沢46ch' && noteHas(r5.oneHm, '受信: 八戸+三沢を1本で') && !r5.oneHm.a46,
     '★1本構成の八戸＋三沢の字がおかしい → ' + JSON.stringify(r5.oneHm));
  ok(JSON.stringify(r5.triNm.main.slice(1)) === '["八戸局","14-24ch 専用"]' && JSON.stringify(r5.triNm.a46.slice(1)) === '["三沢局","46ch 専用"]'
     && !r5.triNm.note.some(x => /^受信/.test(x.s)) && r5.triNm.lb46[0] === 'LB(46ch)',
     '★3本構成なのに局の組み合わせで字が変わる → ' + JSON.stringify(r5.triNm));
  ok(!r5.def.note.some(x => /^受信/.test(x.s)) && r5.def.lb46[0] === 'LB(46ch)', '既定に戻しても字が戻らない → ' + JSON.stringify(r5.def));

  // ---- ⑥ アパート共用部の図の2本目 ----
  const r6 = await page.evaluate(() => ['', 'hachinohe_misawa', 'ninohe_misawa'].map(st => {
    __fresh({ ch46:'yes', apt_units:'3', apt_common:'yes', antenna_stations: st });
    const t = __txt('apt_ant_1'); return t ? t[t.length - 1] : null;
  }));
  console.log('⑥アパート', JSON.stringify(r6));
  ok(JSON.stringify(r6) === '["46CH","50CH","14-24CH"]', '★アパート共用部の図の2本目の見出しが局の組み合わせに合わない → ' + JSON.stringify(r6));

  // ---- ⑦ 保存・開き直し・古い戸別・プリセット ----
  const r7 = await page.evaluate(() => {
    const out = {};
    __fresh({ antenna_stations:'hachinohe_misawa', line_booster_pos:'sp_right' });
    const st = collectState(); out.saved = [st.antenna_stations, st.line_booster_pos];
    applyStateData(Object.assign(blankCaseState(), { antenna_stations:'ninohe_misawa', line_booster_pos:'sp_left' })); rebuild();
    out.reopen = [document.getElementById('antenna_stations').value, document.getElementById('line_booster_pos').value, !!__d('lb_sp')];
    const old = blankCaseState(); delete old.antenna_stations; delete old.line_booster_pos;   // 版173 以前の戸別
    applyStateData(old); rebuild();
    out.old = [document.getElementById('antenna_stations').value, document.getElementById('line_booster_pos').value,
               ('antenna_stations' in old) || ('line_booster_pos' in old)];
    const st2 = collectState(); out.oldSaved = [st2.antenna_stations, st2.line_booster_pos];
    out.presets = Object.keys(PRESETS).map(k => k + ':' + JSON.stringify([PRESETS[k].antenna_stations, PRESETS[k].line_booster_pos])).join(' ');
    out.blank = [blankCaseState().antenna_stations, blankCaseState().line_booster_pos];
    __fresh({ antenna_stations:'ninohe_misawa', line_booster_pos:'sp_left' });
    const up = collectStateForPreset(); delete up.antenna_stations; delete up.line_booster_pos;   // 版173 以前のユーザープリセット
    __set('antenna_stations', 'ninohe_misawa'); __set('line_booster_pos', 'sp_left');
    applyPresetData(up);
    out.userPreset = [document.getElementById('antenna_stations').value, document.getElementById('line_booster_pos').value];
    __set('antenna_stations', 'ninohe_misawa'); __set('line_booster_pos', 'sp_left');
    applyPreset('standard');
    out.builtin = [document.getElementById('antenna_stations').value, document.getElementById('line_booster_pos').value];
    out.later = [LATER_ADDED_FIELDS.antenna_stations, LATER_ADDED_FIELDS.line_booster_pos];
    return out;
  });
  console.log('⑦保存', JSON.stringify(r7));
  ok(r7.saved.join(',') === 'hachinohe_misawa,sp_right', '★選んだ値が保存されない（開いて保存すると消える） → ' + JSON.stringify(r7.saved));
  ok(r7.reopen.join(',') === 'ninohe_misawa,sp_left,true', '★保存した値を開き直すと戻らない → ' + JSON.stringify(r7.reopen));
  ok(r7.old.join(',') === ',,false', '★古い戸別を開いたのに、前の戸別の値が残る → ' + JSON.stringify(r7.old));
  ok(r7.oldSaved.join(',') === ',', '古い戸別を保存し直したときの値がおかしい → ' + JSON.stringify(r7.oldSaved));
  ok(!/undefined|hachinohe|ninohe|sp_/.test(r7.presets), '★組み込みプリセットの既定が "" でない／抜けている → ' + r7.presets);
  ok(r7.blank.join(',') === ',', '★新しい戸別の既定が "" でない → ' + JSON.stringify(r7.blank));
  ok(r7.userPreset.join(',') === ',', '★前に作ったユーザープリセットを押すと、前の戸別の値が残る → ' + JSON.stringify(r7.userPreset));
  ok(r7.builtin.join(',') === ',', '組み込みプリセットで "" に戻らない → ' + JSON.stringify(r7.builtin));
  ok(r7.later.join(',') === ',', '★後から足した欄の一覧（LATER_ADDED_FIELDS）に入っていない → ' + JSON.stringify(r7.later));

  // ---- ⑧ 現場取込 ----
  const r8 = await page.evaluate(() => {
    const mainOld = { chosho_mgmt_no:'V174', amplifier:'amp_3u43', ch46:'yes', line_booster:'yes' };
    const q = genbaMergeCaseData(mainOld, Object.assign({}, mainOld, { antenna_stations:'', line_booster_pos:'' }), {});
    const l = genbaMergeCaseData(mainOld, Object.assign({}, mainOld, { antenna_stations:'ninohe_misawa', line_booster_pos:'sp_left' }), {});
    const back = genbaMergeCaseData(Object.assign({}, mainOld, { antenna_stations:'ninohe_misawa', line_booster_pos:'sp_left' }),
                                    Object.assign({}, mainOld, { antenna_stations:'', line_booster_pos:'' }), {});
    const none = genbaMergeCaseData(Object.assign({}, mainOld, { line_booster_pos:'sp_left' }), mainOld, {});
    return { quiet: q.report.technical.filter(k => /antenna_stations|line_booster_pos/.test(k)),
             loud: l.report.technical.filter(k => /antenna_stations|line_booster_pos/.test(k)),
             v: [l.merged.antenna_stations, l.merged.line_booster_pos], back: [back.merged.antenna_stations, back.merged.line_booster_pos],
             keepWhenMissing: none.merged.line_booster_pos,
             auth: ['antenna_stations','line_booster_pos'].map(k => GENBA_AUTHORITATIVE_FIELDS.indexOf(k) >= 0),
             hard: ['antenna_stations','line_booster_pos'].map(k => (typeof GENBA_HARD_KEEP_MAIN !== 'undefined') && GENBA_HARD_KEEP_MAIN.indexOf(k) >= 0),
             labels: [GENBA_TECH_LABELS.antenna_stations, GENBA_TECH_LABELS.line_booster_pos] };
  });
  console.log('⑧現場取込', JSON.stringify(r8));
  ok(r8.auth.every(Boolean), '★現場入力から取り込む欄の一覧に入っていない → ' + JSON.stringify(r8.auth));
  ok(!r8.hard.some(Boolean), 'PCの値を守る欄に入っている（現場で直しても取り込まれない） → ' + JSON.stringify(r8.hard));
  ok(r8.quiet.length === 0, '★古い戸別を取り込むたびに、触っていない項目が「変わった」と並ぶ → ' + JSON.stringify(r8.quiet));
  ok(r8.loud.length === 2 && r8.v.join(',') === 'ninohe_misawa,sp_left', '★現場で選んだ値が取り込まれない／変わった項目に出ない → ' + JSON.stringify(r8));
  ok(r8.back.join(',') === ',', '現場で「ふだん」に戻したのが取り込まれない → ' + JSON.stringify(r8.back));
  ok(r8.keepWhenMissing === 'sp_left', '古い現場入力（鍵なし）を取り込むとPCの値が消える → ' + r8.keepWhenMissing);
  ok(r8.labels.every(s => !!s && !/[a-z_]/.test(s)), '★取り込みの見出しに英字のままの名前が出る → ' + JSON.stringify(r8.labels));

  // ---- ⑨ 保存データから積算をやり直す道 ----
  const r9 = await page.evaluate(() => {
    const d = Object.assign({}, PRESETS.standard, { antenna_stations:'hachinohe_misawa', line_booster_pos:'sp_right' });
    const i1 = convertSavedToInput(d);
    const old = Object.assign({}, PRESETS.standard); delete old.antenna_stations; delete old.line_booster_pos;
    const i0 = convertSavedToInput(old);
    return [i1.antenna_stations, i1.line_booster_pos, i0.antenna_stations, i0.line_booster_pos];
  });
  console.log('⑨保存→積算の道', JSON.stringify(r9));
  ok(r9.join(',') === 'hachinohe_misawa,sp_right,,', '★保存データから組み直す道で値を拾わない／古い戸別で "" にならない → ' + JSON.stringify(r9));

  // ---- ⑩ 人が選び直したとき（change の道）に図面が組み直る ----
  await page.evaluate(() => { __fresh({ ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes' }); });
  try { await page.evaluate(() => { const d = document.getElementById('line_booster_pos').closest('details'); if(d) d.open = true; }); } catch(_){}
  await page.selectOption('#line_booster_pos', 'sp_right');
  await page.selectOption('#antenna_stations', 'ninohe_misawa');
  const r10 = await page.evaluate(() => ({ lbSp: !!__d('lb_sp'), main: __txt('ant_main'), mark: STATE.input.line_booster_pos }));
  console.log('⑩選び直し', JSON.stringify(r10));
  ok(r10.lbSp === true && r10.main[2] === '二戸50+三沢46ch' && r10.mark === 'sp_right',
     '★画面で選び直しても図面が組み直らない → ' + JSON.stringify(r10));

  // ---- ⑪ 工事調書（印刷用の写し）でも落ちない・枝の箱が載る ----
  const r11 = await page.evaluate(() => {
    __fresh({ ch46:'yes', amplifier:'amp_3u43', outer_splitter:'sp_2cw', line_booster:'yes', line_booster_46:'yes',
              antenna_stations:'hachinohe_misawa', line_booster_pos:'sp_left' });
    try { renderChosho(); const pr = choshoDiagramForPrint(document.getElementById('diagram'));
      return { ok: true, lbSp: !!pr.svg.querySelector('g.node[data-nodekey="lb_sp"]'),
               note: /受信: 八戸\+三沢が1本/.test(pr.svg.textContent) }; }
    catch(e){ return { ok: false, e: String(e && e.message) }; }
  });
  console.log('⑪工事調書', JSON.stringify(r11));
  ok(r11.ok && r11.lbSp && r11.note, '★工事調書の系統図に、枝の箱・受信の行が載らない（または落ちる） → ' + JSON.stringify(r11));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v174_main');
})();
