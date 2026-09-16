/* 版160: 46CH(三沢局)系統のラインブースター（メイン）。
   ・46CHアンテナがあるときだけ選べる／既定は「なし」
   ・積算は主系統のぶんと別の行（注記で分ける＝数量の手直しが混ざらない）
   ・図面は46CHの縦線の上に箱が出て、線が箱で割れる
   ・保存・現場との往復・古い戸別の開き直しで値が化けない／金額が動かない */
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

  // ---- ⓪ 前提 ----
  const ready = await page.evaluate(() => ({
    f: ['getInputs','buildBOM','buildBOMForData','convertSavedToInput','collectState',
        'blankCaseState','applyStateData','rebuild','renderDiagram']
         .filter(n => typeof window[n] !== 'function'),
    g: ['ch46','line_booster','line_booster_46','antenna_46'].filter(id => !document.getElementById(id)),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.g.length === 0, '★46CH用のラインブースターの欄が無い → ' + ready.g.join(' / '));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    window.__set = (id, v) => { const el = document.getElementById(id); if(el){ el.value = v; } };
    window.__lb = () => (STATE.bom || []).filter(r => r.id === 'booster_ub18l')
      .map(r => ({ key: r.key, note: r.note, qty: r.qty }));
    window.__d = k => document.querySelector('#diagram g.node[data-nodekey="' + k + '"]');
    // 見える線だけ数える（同じ線に透明な当たり判定 .wire-hit が重なっている）
    window.__wires = k => Array.from(document.querySelectorAll('#diagram path[data-wire-key="' + k + '"]:not(.wire-hit)'))
      .map(p => (p.getAttribute('d') || '').split(/\s+/).slice(0, 2).join(' '));
  });

  // ---- ① 主系統と46CHで、積算の行が分かれる ----
  const r1 = await page.evaluate(() => {
    __set('ch46','yes'); __set('line_booster','yes'); __set('line_booster_46','yes'); rebuild();
    const both = __lb();
    __set('line_booster','no'); rebuild();
    const only46 = __lb();
    __set('line_booster','yes'); __set('line_booster_46','no'); rebuild();
    const onlyMain = __lb();
    return { both, only46, onlyMain };
  });
  console.log('①積算の行', JSON.stringify(r1));
  ok(r1.both.length === 2, '★46CHのラインブースターが積算に出ない（1台にまとまっている） → ' + JSON.stringify(r1.both));
  ok(r1.both.map(x => x.key).sort().join(' / ') === 'booster_ub18l| / booster_ub18l|46CH系統(三沢局)',
     '★主系統のぶんと46CHのぶんが同じ鍵になっている（数量の手直しが混ざる） → ' + JSON.stringify(r1.both));
  ok(r1.only46.length === 1 && r1.only46[0].note === '46CH系統(三沢局)',
     '主系統だけ「なし」にしたときの行がおかしい → ' + JSON.stringify(r1.only46));
  ok(r1.onlyMain.length === 1 && r1.onlyMain[0].note === '',
     '46CHだけ「なし」にしたときの行がおかしい（主系統の注記は空のまま） → ' + JSON.stringify(r1.onlyMain));

  // ---- ② 46CHアンテナが無いときは、選んであっても計上しない・欄も隠れる ----
  const r2 = await page.evaluate(() => {
    __set('ch46','yes'); __set('line_booster','yes'); __set('line_booster_46','yes'); rebuild();
    const shownYes = getComputedStyle(document.getElementById('line_booster_46').closest('.field')).display;
    __set('ch46','no'); rebuild();
    const rows = __lb();
    const shownNo = getComputedStyle(document.getElementById('line_booster_46').closest('.field')).display;
    __set('ch46','yes'); rebuild();
    return { rows, shownYes, shownNo, back: __lb().length };
  });
  console.log('②1本構成', JSON.stringify(r2));
  ok(r2.rows.length === 1 && r2.rows[0].note === '',
     '★46CHアンテナが無いのに、46CH用のラインブースターを計上している → ' + JSON.stringify(r2.rows));
  ok(r2.shownNo === 'none' && r2.shownYes !== 'none',
     '★46CHアンテナが無いときに欄が隠れない（または有るときに出ない） → ' + JSON.stringify(r2));
  ok(r2.back === 2, '46CHアンテナを戻したら計上し直さない → ' + r2.back);

  // ---- ③ 数量の手直しが主系統と混ざらない ----
  const r3 = await page.evaluate(() => {
    __set('ch46','yes'); __set('line_booster','yes'); __set('line_booster_46','yes');
    const keep = STATE.qtyOverrides;
    STATE.qtyOverrides = Object.assign({}, keep || {}, { 'booster_ub18l|': 2 });
    rebuild();
    const rows = __lb();
    STATE.qtyOverrides = keep; rebuild();
    return { main: (rows.filter(r => r.note === '')[0]||{}).qty, ch46: (rows.filter(r => r.note !== '')[0]||{}).qty };
  });
  console.log('③数量の手直し', JSON.stringify(r3));
  ok(r3.main === 2 && r3.ch46 === 1,
     '★積算表で主系統の数量を直すと、46CHのぶんまで一緒に動く → ' + JSON.stringify(r3));

  // ---- ④ 保存の並び・既定・現場との往復の登録 ----
  const r4 = await page.evaluate(() => {
    __set('ch46','yes'); __set('line_booster_46','yes'); rebuild();
    const st = collectState();
    return { saved: ('line_booster_46' in st), value: st.line_booster_46,
             presets: Object.keys(PRESETS).map(k => k + ':' + PRESETS[k].line_booster_46).join(' / '),
             blank: blankCaseState().line_booster_46,
             genba: (GENBA_AUTHORITATIVE_FIELDS || []).indexOf('line_booster_46') >= 0,
             label: (typeof GENBA_TECH_LABELS === 'object') ? GENBA_TECH_LABELS.line_booster_46 : '' };
  });
  console.log('④保存・既定', JSON.stringify(r4));
  ok(r4.saved === true && r4.value === 'yes',
     '★選んだ値が保存されない（開いて保存すると消える） → ' + JSON.stringify(r4));
  ok(!/:(undefined|yes)/.test(r4.presets),
     '★プリセットの既定が「なし」でない／抜けている（前のお客様の値が残る） → ' + r4.presets);
  ok(r4.blank === 'no', '★新しい戸別の既定が「なし」でない → ' + r4.blank);
  ok(r4.genba === true, '★現場入力から取り込む欄の一覧に入っていない → ' + r4.genba);
  ok(!!r4.label && !/[a-z_]/.test(String(r4.label)),
     '★取り込みの見出しに英字のままの名前が出る → ' + JSON.stringify(r4.label));

  // ---- ⑤ 保存データから積算をやり直す道でも同じ台数になる ----
  const r5 = await page.evaluate(() => {
    const d = Object.assign({}, PRESETS.ch46, { ch46:'yes', line_booster:'yes', line_booster_46:'yes' });
    const inp = convertSavedToInput(d);
    const n2 = buildBOMForData(d, {}).filter(r => r.id === 'booster_ub18l').length;
    const old = Object.assign({}, PRESETS.ch46, { ch46:'yes', line_booster:'yes' });
    delete old.line_booster_46;                       // 版159 以前に保存した戸別
    const bomOld = buildBOMForData(old, {});
    const bomNo = buildBOMForData(Object.assign({}, old, { line_booster_46:'no' }), {});
    const sum = bom => bom.reduce((s, r) => s + (r.material_cost + r.labor_cost) * r.qty, 0);
    return { flag: inp.line_booster_46, n2, nOld: bomOld.filter(r => r.id === 'booster_ub18l').length,
             same: sum(bomOld) === sum(bomNo) };
  });
  console.log('⑤保存→積算', JSON.stringify(r5));
  ok(r5.flag === true && r5.n2 === 2,
     '★一覧や全体費用の金額だけ、46CHのラインブースターを数えない → ' + JSON.stringify(r5));
  ok(r5.nOld === 1 && r5.same === true,
     '★前に保存した戸別の金額が動いてしまう → ' + JSON.stringify(r5));

  // ---- ⑥ 古い戸別を開いたとき、前の戸別の値が残らない ----
  const r6 = await page.evaluate(() => {
    __set('line_booster_46','yes');
    const s = blankCaseState(); delete s.line_booster_46;      // 版159 以前の戸別
    applyStateData(s);
    return { v: document.getElementById('line_booster_46').value };
  });
  console.log('⑥古い戸別', JSON.stringify(r6));
  ok(r6.v === 'no', '★古い戸別を開いたのに、前の戸別の「あり」が残る（黙って金額が乗る） → ' + JSON.stringify(r6));

  // ---- ⑦ 図面：46CHの縦線の上に箱が出て、線が箱で割れる ----
  const r7 = await page.evaluate(() => {
    __set('ch46','yes'); __set('line_booster','yes'); __set('line_booster_46','yes'); rebuild();
    const g = __d('lb46'), lb = __d('lb'), a46 = __d('ant_46');
    const on = { has: !!g, x: g && g.getAttribute('data-x'), y: g && g.getAttribute('data-y'),
                 lock: g && g.getAttribute('data-axislock'), wires: __wires('ch46_amp'),
                 a46Bottom: a46 && (+a46.getAttribute('data-y') + +a46.getAttribute('data-h')),
                 lbY: lb && lb.getAttribute('data-y') };
    __set('line_booster_46','no'); rebuild();
    const lb2 = __d('lb');
    const off = { has: !!__d('lb46'), wires: __wires('ch46_amp'), lbY: lb2 && lb2.getAttribute('data-y') };
    return { on, off };
  });
  console.log('⑦図面', JSON.stringify(r7));
  ok(r7.on.has === true && r7.on.x === '160' && r7.on.lock === 'y',
     '★46CHのラインブースターが図面に出ない（または場所がおかしい） → ' + JSON.stringify(r7.on));
  ok(r7.on.wires.length === 2, '★線が箱で割れていない（箱を突き抜ける） → ' + JSON.stringify(r7.on.wires));
  ok(+r7.on.y > r7.on.a46Bottom && +r7.on.y < 300,
     '★46CHのラインブースターが、46CHアンテナの真下（増幅器より上）に無い → ' + JSON.stringify(r7.on));
  ok(r7.off.has === false && r7.off.wires.length === 1,
     '「なし」に戻したのに図面に残る → ' + JSON.stringify(r7.off));
  ok(r7.on.lbY === r7.off.lbY,
     '★46CHのぶんを入り切りすると、主系統のラインブースターの位置まで動く → ' + JSON.stringify([r7.on.lbY, r7.off.lbY]));

  // ---- ⑧ 図面の箱から選び直せる（入力欄とつながっている） ----
  const r8 = await page.evaluate(() => {
    __set('line_booster_46','yes'); rebuild();
    const g = __d('lb46');
    return { txt: g ? (g.textContent || '').replace(/\s+/g, ' ').trim() : '' };
  });
  console.log('⑧図面の箱', JSON.stringify(r8));
  ok(/LB/.test(r8.txt) && /UB18L/.test(r8.txt), '★図面の箱の字がおかしい → ' + JSON.stringify(r8));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v160_main');
})();
