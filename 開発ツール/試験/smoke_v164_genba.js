/* 版164: 現場入力の手間を2つ減らす。
   ・📂 は まとめて選べる → アプリの中で 管理番号・氏名・住所 で絞り込んで開く
   ・入れる場所の名前は、手で打たずに候補から選ぶ */
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
    f: ['openJsonFile','renderOpenPick','openPickMgmtOf','openPickRowInfo','uiPickName',
        'saveHintHistory','saveHintRemember'].filter(n => typeof window[n] !== 'function'),
    multi: !!(document.getElementById('import-file') || {}).multiple,
    pickModal: !!document.getElementById('pick-modal'),
    q: !!document.getElementById('open-pick-q'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.multi === true, '★📂 でまとめて選べない → ' + JSON.stringify(ready));
  ok(ready.pickModal === true && ready.q === true, '★画面の部品が無い → ' + JSON.stringify(ready));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

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
    window.__case = (mg) => ({ chosho_mgmt_no: mg, work_type:'catv_to_uhf', amplifier:'amp_3u43' });
  });

  // ---- ① まとめて選ぶと一覧に出て、絞り込める ----
  const r1 = await page.evaluate(async () => {
    // 受付台帳を入れておく（氏名・住所も出したい）
    receptionSaveRows({ rows: [
      { mgmt_no:'245001', name:'山田 太郎', addr:'八戸市城下1-1' },
      { mgmt_no:'245002', name:'佐藤 花子', addr:'八戸市根城2-2' },
      { mgmt_no:'245010', name:'鈴木 次郎', addr:'三沢市中央3-3' }
    ], project:'テスト物件', exportedAt:'', appVersion:'' });
    __pickFiles([ __file('245010.json', __case('245010')),
                  __file('245001.json', __case('245001')),
                  __file('245002.json', __case('245002')) ]);
    await new Promise(r => setTimeout(r, 300));
    const shown = () => Array.from(document.querySelectorAll('#open-pick-list .op-row'))
      .map(el => el.textContent.replace(/\s+/g, ' ').trim());
    const all = shown();
    const order0 = Array.from(document.querySelectorAll('#open-pick-list .op-row'))
      .map(el => (el.querySelector('.op-no') || {}).textContent || '');
    document.getElementById('open-pick-q').value = '佐藤';
    document.getElementById('open-pick-q').dispatchEvent(new Event('input', { bubbles:true }));
    const byName = shown();
    document.getElementById('open-pick-q').value = '三沢';
    document.getElementById('open-pick-q').dispatchEvent(new Event('input', { bubbles:true }));
    const byAddr = shown();
    document.getElementById('open-pick-q').value = '245001';
    document.getElementById('open-pick-q').dispatchEvent(new Event('input', { bubbles:true }));
    const byNo = shown();
    return { n: all.length, order: order0,
             hasName: all.some(t => t.indexOf('山田 太郎') >= 0),
             byName, byAddr, byNo, open: document.getElementById('open-pick').style.display };
  });
  console.log('①まとめて選ぶ', JSON.stringify(r1));
  ok(r1.n === 3, '★まとめて選んだファイルが一覧に出ない → ' + JSON.stringify(r1));
  ok(r1.order.join('/') === '245001/245002/245010',
     '★管理番号の順に並んでいない（探しにくい） → ' + JSON.stringify(r1.order));
  ok(r1.hasName === true, '★受付台帳の氏名が出ない → ' + JSON.stringify(r1));
  ok(r1.byName.length === 1 && r1.byName[0].indexOf('245002') >= 0,
     '★氏名で絞り込めない → ' + JSON.stringify(r1.byName));
  ok(r1.byAddr.length === 1 && r1.byAddr[0].indexOf('245010') >= 0,
     '★住所で絞り込めない → ' + JSON.stringify(r1.byAddr));
  ok(r1.byNo.length === 1 && r1.byNo[0].indexOf('245001') >= 0,
     '★管理番号で絞り込めない → ' + JSON.stringify(r1.byNo));

  // ---- ② 一覧から押すと、その戸別が開く ----
  const r2 = await page.evaluate(async () => {
    document.getElementById('open-pick-q').value = '245002';
    document.getElementById('open-pick-q').dispatchEvent(new Event('input', { bubbles:true }));
    const row = document.querySelector('#open-pick-list .op-row');
    row.click();
    for(let i = 0; i < 60 && M.chosho_mgmt_no !== '245002'; i++) await new Promise(r => setTimeout(r, 100));
    return { mgmt: M.chosho_mgmt_no, kept: _openPick.length };
  });
  console.log('②一覧から開く', JSON.stringify(r2));
  ok(r2.mgmt === '245002', '★一覧から押しても開かない → ' + JSON.stringify(r2));
  ok(r2.kept === 3, '一度開いたら一覧が消えてしまう（何戸も回れない） → ' + JSON.stringify(r2));

  // ---- ③ 1つだけ選んだときは、これまでどおりそのまま開く ----
  const r3 = await page.evaluate(async () => {
    _openPick = []; renderOpenPick();
    __pickFiles([ __file('245099.json', __case('245099')) ]);
    for(let i = 0; i < 60 && M.chosho_mgmt_no !== '245099'; i++) await new Promise(r => setTimeout(r, 100));
    return { mgmt: M.chosho_mgmt_no, list: _openPick.length,
             shown: document.getElementById('open-pick').style.display };
  });
  console.log('③1つだけ', JSON.stringify(r3));
  ok(r3.mgmt === '245099', '★1つだけ選んだのに開かない（手数が増えた） → ' + JSON.stringify(r3));
  ok(r3.list === 0 && r3.shown === 'none', '1つだけなのに一覧が出る → ' + JSON.stringify(r3));

  // ---- ④ 入れる場所の名前は、手で打たずに候補から選ぶ ----
  const r4 = await page.evaluate(async () => {
    localStorage.removeItem('genba_savehints_v1');
    saveHintSet('');
    // スマホと同じ状態にする（フォルダを掴めない端末）
    window.__keepDirPicker = window.showDirectoryPicker;
    try { delete window.showDirectoryPicker; } catch(_){ window.showDirectoryPicker = undefined; }
    // 「覚えました」の知らせが出たら閉じる係（出しっぱなしだと止まる）
    const tapOk = () => { const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
      // 名前を書く窓が出たら閉じる（出しっぱなしだと、この試験が待ちっぱなしで固まる）
      const ty = document.getElementById('type-modal');
      if(ty && ty.classList.contains('open')) document.getElementById('type-close').click();
    }, 50); return () => clearInterval(t); };
    const stopOk = tapOk();
    let typed = 0;
    const keepPrompt = window.prompt;
    window.prompt = () => { typed++; return 'てがき'; };
    const seen = { titles: [] };
    // 物件名が候補のいちばん上に出るか
    const p = saveDirChange();
    await new Promise(r => setTimeout(r, 300));
    const modalOpen = document.getElementById('pick-modal').classList.contains('open');
    const rows = Array.from(document.querySelectorAll('#pick-list .pick-row'))
      .map(el => el.querySelector('.pick-main').textContent.trim());
    seen.titles = rows;
    document.querySelectorAll('#pick-list .pick-row')[0].click();   // 物件名を選ぶ
    await Promise.race([p, new Promise(r => setTimeout(r, 8000))]);   // 待ちっぱなしにしない
    const after = saveHintName();
    window.prompt = keepPrompt;
    stopOk();
    return { modalOpen, rows: seen.titles, after, typed,
             hist: saveHintHistory() };
  });
  console.log('④場所の名前を選ぶ', JSON.stringify(r4));
  ok(r4.modalOpen === true, '★候補の窓が出ない（手で打たせている） → ' + JSON.stringify(r4));
  ok(r4.rows[0] === 'テスト物件',
     '★受付台帳の物件名が候補のいちばん上に出ない → ' + JSON.stringify(r4.rows));
  ok(r4.rows.indexOf('自分で書く') >= 0, '★どうしても違う名前のときの逃げ道が無い → ' + JSON.stringify(r4.rows));
  ok(r4.after === 'テスト物件', '★選んだ名前が覚えられていない → ' + JSON.stringify(r4));
  ok(r4.typed === 0, '★候補を選んだのに、手で打つ窓が出た → ' + JSON.stringify(r4));
  ok(r4.hist.indexOf('テスト物件') >= 0, '前に使った名前が次から出ない → ' + JSON.stringify(r4.hist));

  // ---- ⑤ 前に使った名前が候補に出る／「覚えない」も選べる ----
  const r5 = await page.evaluate(async () => {
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
      const ty = document.getElementById('type-modal');
      if(ty && ty.classList.contains('open')) document.getElementById('type-close').click();
    }, 50);
    const p = saveDirChange();
    await new Promise(r => setTimeout(r, 300));
    const rows = Array.from(document.querySelectorAll('#pick-list .pick-row'))
      .map(el => el.querySelector('.pick-main').textContent.trim());
    const off = Array.from(document.querySelectorAll('#pick-list .pick-row'))
      .filter(el => el.querySelector('.pick-main').textContent.trim() === '覚えない')[0];
    if(off) off.click(); else document.getElementById('pick-close').click();
    await Promise.race([p, new Promise(r => setTimeout(r, 8000))]);   // 待ちっぱなしにしない
    clearInterval(t);
    if(window.__keepDirPicker) window.showDirectoryPicker = window.__keepDirPicker;
    return { rows, after: saveHintName() };
  });
  console.log('⑤覚えない', JSON.stringify(r5));
  ok(r5.rows.indexOf('覚えない') >= 0, '★「覚えない」が選べない → ' + JSON.stringify(r5.rows));
  ok(r5.after === '', '★「覚えない」を選んでも名前が残る → ' + JSON.stringify(r5));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v164_genba');
})();
