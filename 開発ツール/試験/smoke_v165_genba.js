/* 版165（現場入力）
   ・保安器の所の「既設2分配器（流用）」を現場でも選べる
   ・📂 の絞り込みで、受付台帳の索引を1文字ごとに作り直さない（1回の描画で1つ）
   ・多いときは60個まで出し、残りが何個あるかを必ず知らせる
   ・「自分で書く」はアプリの中の窓で書く（ホーム画面アプリでは端末の窓が出ないため） */
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

  const ready = await page.evaluate(() => ({
    f: ['uiTypeName','renderOpenPick','openPickRowInfo','mapRowIndex','photoExifToCarry']
         .filter(n => typeof window[n] !== 'function'),
    typeModal: !!document.getElementById('type-modal'),
    typeInput: !!document.getElementById('type-input'),
    fa: (OPT.fa_splitter || []).map(x => x[0]),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.typeModal && ready.typeInput,
     '★アプリの中で名前を書く窓が無い → ' + JSON.stringify(ready));
  ok(ready.fa.indexOf('exist_2sp') >= 0,
     '★現場で「既設2分配器（流用）」が選べない → ' + JSON.stringify(ready.fa));
  ok(ready.fa[0] === 'no', '★既定が「なし」でなくなっている → ' + JSON.stringify(ready.fa));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // ---- ① 既設2分配器を選んで保存すると、その値がファイルに残る ----
  const r1 = await page.evaluate(() => {
    M.is_catv = 'yes'; M.power_pos = 'tv_back'; M.use_fa = 'no';
    M.fa_splitter = 'exist_2sp';
    const s = buildStateOf(M);
    return { saved: s.fa_splitter, back: modelFromCaseState(s, false).fa_splitter };
  });
  console.log('①保存', JSON.stringify(r1));
  ok(r1.saved === 'exist_2sp' && r1.back === 'exist_2sp',
     '★「既設2分配器」が保存・読み直しで消える → ' + JSON.stringify(r1));

  // ---- ② 絞り込み：受付台帳の索引は1回の描画で1つだけ ----
  await page.evaluate(() => {
    window.__file = (name, obj) =>
      new File([JSON.stringify(obj, null, 2)], name, { type: 'application/json' });
    window.__pickFiles = files => {
      const inp = document.getElementById('import-file');
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    };
  });
  const r2 = await page.evaluate(async () => {
    const rows = [], files = [];
    for(let i = 1; i <= 120; i++){
      const no = String(245000 + i);
      rows.push({ mgmt_no: no, name: '氏名' + i, addr: '八戸市テスト' + i });
      files.push(__file(no + '.json',
        { chosho_mgmt_no: no, work_type: 'catv_to_uhf', amplifier: 'amp_3u43' }));
    }
    receptionSaveRows({ rows: rows, project: 'テスト物件', exportedAt: '', appVersion: '' });
    __pickFiles(files);
    await new Promise(r => setTimeout(r, 400));
    // 索引を作った回数を数える
    const keep = window.mapRowIndex;
    let calls = 0;
    window.mapRowIndex = function(){ calls++; return keep.apply(this, arguments); };
    const q = document.getElementById('open-pick-q');
    q.value = '氏名7';
    q.dispatchEvent(new Event('input', { bubbles: true }));
    const once = calls;
    window.mapRowIndex = keep;
    const shown = document.querySelectorAll('#open-pick-list .op-row').length;
    const note = (document.getElementById('open-pick-list').textContent || '');
    // 何も絞らないとき（120個）の出し方
    q.value = '';
    q.dispatchEvent(new Event('input', { bubbles: true }));
    const all = document.querySelectorAll('#open-pick-list .op-row').length;
    const allNote = (document.getElementById('open-pick-list').textContent || '');
    return { once, shown, hit: /当てはまる 11 個/.test(note), all,
             rest: /ほかに 60 個あります/.test(allNote) };
  });
  console.log('②絞り込み', JSON.stringify(r2));
  ok(r2.once <= 1,
     '★1文字打つたびに受付台帳の索引を何度も作り直している（何百個も選ぶと画面が固まる） → '
     + r2.once + ' 回');
  ok(r2.hit === true, '★氏名で絞り込めていない → ' + JSON.stringify(r2));
  ok(r2.shown === 11, '★絞り込んだ結果の数が合わない → ' + JSON.stringify(r2));
  ok(r2.all === 60, '★多いときに出す数が60個になっていない → ' + JSON.stringify(r2));
  ok(r2.rest === true,
     '★出していない分があることを知らせていない（全部出ていると思い込む） → ' + JSON.stringify(r2));

  // ---- ③ 「自分で書く」はアプリの中の窓（端末の窓は使わない） ----
  const r3 = await page.evaluate(async () => {
    localStorage.removeItem('genba_savehints_v1');
    saveHintSet('');
    window.__keepDirPicker = window.showDirectoryPicker;
    try { delete window.showDirectoryPicker; } catch(_){ window.showDirectoryPicker = undefined; }
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
    }, 50);
    let typed = 0;
    const keepPrompt = window.prompt;
    window.prompt = () => { typed++; return 'てがき'; };
    const p = saveDirChange();
    await new Promise(r => setTimeout(r, 300));
    // 「自分で書く」を押す
    const row = Array.from(document.querySelectorAll('#pick-list .pick-row'))
      .filter(el => el.querySelector('.pick-main').textContent.trim() === '自分で書く')[0];
    row.click();
    await new Promise(r => setTimeout(r, 200));
    const opened = document.getElementById('type-modal').classList.contains('open');
    const el = document.getElementById('type-input');
    const pre = el.value;
    el.value = 'アンテナ工事';
    document.getElementById('type-ok').click();
    await p;
    clearInterval(t);
    window.prompt = keepPrompt;
    if(window.__keepDirPicker) window.showDirectoryPicker = window.__keepDirPicker;
    return { opened, pre, typed, after: saveHintName(), hist: saveHintHistory() };
  });
  console.log('③自分で書く', JSON.stringify(r3));
  ok(r3.opened === true,
     '★「自分で書く」でアプリの中の窓が出ない（ホーム画面アプリでは何も起きない） → ' + JSON.stringify(r3));
  ok(r3.typed === 0, '★端末の打ち込み窓を使っている → ' + JSON.stringify(r3));
  ok(r3.after === 'アンテナ工事', '★書いた名前が覚えられていない → ' + JSON.stringify(r3));
  ok(r3.hist.indexOf('アンテナ工事') >= 0, '書いた名前が次から候補に出ない → ' + JSON.stringify(r3.hist));

  // ---- ④ 「やめる」を押したら、覚えている名前はそのまま ----
  const r4 = await page.evaluate(async () => {
    window.__keepDirPicker = window.showDirectoryPicker;
    try { delete window.showDirectoryPicker; } catch(_){ window.showDirectoryPicker = undefined; }
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
    }, 50);
    const before = saveHintName();
    const p = saveDirChange();
    await new Promise(r => setTimeout(r, 300));
    const row = Array.from(document.querySelectorAll('#pick-list .pick-row'))
      .filter(el => el.querySelector('.pick-main').textContent.trim() === '自分で書く')[0];
    row.click();
    await new Promise(r => setTimeout(r, 200));
    document.getElementById('type-close').click();
    await p;
    clearInterval(t);
    if(window.__keepDirPicker) window.showDirectoryPicker = window.__keepDirPicker;
    return { before, after: saveHintName() };
  });
  console.log('④やめる', JSON.stringify(r4));
  ok(r4.after === r4.before,
     '★「やめる」を押したら、覚えていた名前が消えた → ' + JSON.stringify(r4));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v165_genba');
})();
