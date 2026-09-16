/* 版160: 46CH(三沢局)系統のラインブースター（現場入力）。
   ・46CHアンテナ（2本／3本）のときだけ欄が出る
   ・既定は「なし」／古い下書き・古い戸別を開いても勝手に「あり」にならない
   ・PCへ渡す中身に入る（取り込みの鍵・書き出しの文字） */
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
/* 版番号は上げるたびに試験を直さなくてよいように、読み込むファイルから拾う */
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
    f: ['freshModel','ensureModelShape','buildState','render','mergeLabelOf']
         .filter(n => typeof window[n] !== 'function'),
    opt: (typeof OPT === 'object' && OPT.line_booster_46) ? OPT.line_booster_46.map(x => x.join(':')).join(' / ') : '',
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.opt === 'no:なし / yes:UB18L',
     '★46CH用のラインブースターの選べる中身がおかしい → ' + ready.opt);
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // ---- ① 46CHアンテナのときだけ欄が出る ----
  const r1 = await page.evaluate(() => {
    const seg = () => document.querySelector('[data-seg="line_booster_46"]');
    const out = {};
    M = freshModel(); ensureModelShape(M);
    M.ch46 = 'yes'; render(); out.yes = !!seg();
    M.ch46 = 'triple'; render(); out.triple = !!seg();
    M.ch46 = 'no'; render(); out.no = !!seg();
    M.ch46 = 'yes'; render();
    // 主系統のすぐ下に並んでいるか（探し回らずに済む）
    const amp = (SECTIONS.find(s => s.id === 'amp') || {}).fields || [];
    const i1 = amp.findIndex(f => f.id === 'line_booster');
    const i2 = amp.findIndex(f => f.id === 'line_booster_46');
    out.order = [i1, i2];
    out.label = (seg() ? (seg().closest('.fld') || {}).textContent : '') || '';
    return out;
  });
  console.log('①欄の出入り', JSON.stringify(r1));
  ok(r1.yes === true && r1.triple === true,
     '★46CHアンテナがあるのに、46CH用のラインブースターの欄が出ない → ' + JSON.stringify(r1));
  ok(r1.no === false, '★1本構成（46CHアンテナ無し）なのに欄が出る → ' + JSON.stringify(r1));
  ok(r1.order[1] === r1.order[0] + 1,
     '主系統のラインブースターのすぐ下に並んでいない → ' + JSON.stringify(r1.order));
  ok(/46CH/.test(r1.label) && !/[a-z_]{6,}/.test(r1.label),
     '★見出しが分かりにくい（英字のまま等） → ' + JSON.stringify(r1.label));

  // ---- ② 押したら入る・戻せる ----
  const r2 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M); M.ch46 = 'yes'; render();
    const push = v => { const btn = document.querySelector('[data-seg="line_booster_46"] button[data-v="' + v + '"]');
      if(btn) btn.click(); return M.line_booster_46; };
    const on = push('yes');
    const onMark = !!document.querySelector('[data-seg="line_booster_46"] button[data-v="yes"].on');
    const off = push('no');
    return { on, onMark, off, main: M.line_booster };
  });
  console.log('②押して入る', JSON.stringify(r2));
  ok(r2.on === 'yes' && r2.off === 'no',
     '★ボタンを押しても入らない／戻せない → ' + JSON.stringify(r2));
  ok(r2.onMark === true, '押したのに選んだ印が付かない → ' + JSON.stringify(r2));
  ok(r2.main === 'yes', '★46CH用を押すと、主系統のラインブースターまで変わる → ' + JSON.stringify(r2));

  // ---- ③ 既定は「なし」／古い中身でも勝手に「あり」にならない ----
  const r3 = await page.evaluate(() => {
    const fresh = freshModel().line_booster_46;
    const old = { chosho_mgmt_no:'V160', ch46:'yes', line_booster:'yes' };   // 版159 以前の下書き・戸別
    ensureModelShape(old);
    return { fresh, old: old.line_booster_46, def: DEFAULTS.line_booster_46, mainDef: DEFAULTS.line_booster };
  });
  console.log('③既定', JSON.stringify(r3));
  ok(r3.fresh === 'no' && r3.def === 'no',
     '★新しい戸別の既定が「なし」でない（黙って金額が乗る） → ' + JSON.stringify(r3));
  ok(r3.old === 'no',
     '★古い戸別を開いたときに「なし」にならない → ' + JSON.stringify(r3));
  ok(r3.mainDef === 'yes', '主系統のラインブースターの既定まで変わっている → ' + r3.mainDef);

  // ---- ④ PCへ渡す中身に入る ----
  const r4 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M); M.ch46 = 'yes'; M.line_booster_46 = 'yes';
    const s = buildState();
    return { out: s.line_booster_46, known: GENBA_KNOWN_KEYS.has('line_booster_46'),
             label: mergeLabelOf('line_booster_46') };
  });
  console.log('④PCへ渡す', JSON.stringify(r4));
  ok(r4.out === 'yes', '★現場で選んでもPCへ渡らない（保存で消える） → ' + JSON.stringify(r4));
  ok(r4.known === true, '★取り込みの突合で「知らない項目」になる → ' + JSON.stringify(r4));
  ok(r4.label === '増幅器・分配器・電源',
     '★取り込みの見出しの分け方がおかしい → ' + JSON.stringify(r4.label));

  // ---- ⑤ 画面のエラー ----
  ok(errs.length === 0, '画面でエラーが出た → ' + errs.slice(0, 3).join(' / '));

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v160_genba');
})().catch(e => { console.log('FAIL 例外: ' + (e && e.message)); process.exit(1); });
