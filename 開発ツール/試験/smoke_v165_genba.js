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
    f: ['uiTypeName','renderOpenPick','openPickRowInfo','mapRowIndex','photoExifToCarry',
        'openPickIsJson','openJsonFile','photoPixelSizeOf','photoExifSetPixelSize']
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
    window.__case = mg => ({ chosho_mgmt_no: mg, work_type:'catv_to_uhf', amplifier:'amp_3u43' });
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

  // ---- ⑤ 戸別ファイルでないもの（写真・メモ）は一覧に混ぜない ----
  const r5 = await page.evaluate(async () => {
    _openPick = []; renderOpenPick();
    const blob = (name, body) => new File([body], name, { type:'application/octet-stream' });
    __pickFiles([ __file('245201.json', __case('245201')),
                  blob('IMG_0001.jpg', 'xx'),
                  blob('メモ.txt', 'yy'),
                  __file('245202.json.txt', __case('245202')) ]);
    await new Promise(r => setTimeout(r, 400));
    const nos = Array.from(document.querySelectorAll('#open-pick-list .op-row'))
      .map(el => (el.querySelector('.op-no') || {}).textContent || '');
    const hint = (document.getElementById('savedhint') || {}).textContent || '';
    return { n: _openPick.length, nos, hint };
  });
  console.log('⑤戸別ファイルだけ', JSON.stringify(r5));
  ok(r5.n === 2 && r5.nos.join('/') === '245201/245202',
     '★写真やメモまで一覧に並んでいる（押すと訳の分からない文が出る） → ' + JSON.stringify(r5));
  ok(r5.hint.indexOf('2 個は外しました') >= 0,
     '★外したものがあることを知らせていない → ' + JSON.stringify(r5.hint));

  // ---- ⑥ 全角の数字で絞り込んでも当たる ----
  const r6 = await page.evaluate(async () => {
    const q = document.getElementById('open-pick-q');
    q.value = '２４５２０２';                    // 全角（スマホの日本語キーボード）
    q.dispatchEvent(new Event('input', { bubbles:true }));
    const zen = Array.from(document.querySelectorAll('#open-pick-list .op-row'))
      .map(el => (el.querySelector('.op-no') || {}).textContent || '');
    q.value = '';
    q.dispatchEvent(new Event('input', { bubbles:true }));
    return { zen };
  });
  console.log('⑥全角の数字', JSON.stringify(r6));
  ok(r6.zen.length === 1 && r6.zen[0] === '245202',
     '★全角の数字で絞り込むと0件になる → ' + JSON.stringify(r6));

  // ---- ⑦ 中身が戸別でないJSONを押しても、必ず日本語で知らせる ----
  const r7 = await page.evaluate(async () => {
    const seen = [];
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')){
        seen.push(String(document.getElementById('ui-dialog-msg').textContent || ''));
        document.getElementById('ui-dialog-ok').click();
      }
    }, 30);
    const f = (name, body) => new File([body], name, { type:'application/json' });
    await openJsonFile(f('245301.json', 'null'));          // 中身が null
    await openJsonFile(f('245302.json', '[1,2,3]'));       // かたまりでない
    await openJsonFile(f('245303.json', 'これはJSONではありません'));
    clearInterval(t);
    const want = ['245301.json', '245302.json', '245303.json'];
    return { n: seen.length, ja: seen.every(x => /ではないようです|読めませんでした/.test(x)),
             named: seen.every((x, i) => x.indexOf(want[i] || '') >= 0),
             msgs: seen.map(x => x.split('\n')[0]) };
  });
  console.log('⑦戸別でないJSON', JSON.stringify(r7));
  ok(r7.n === 3, '★戸別でないファイルを押しても、何も知らせずに止まる → ' + JSON.stringify(r7));
  ok(r7.ja === true, '★知らせの文が日本語になっていない → ' + JSON.stringify(r7.msgs));
  ok(r7.named === true,
     '★どのファイルのことか言っていない（英語の中身がそのまま出ている） → ' + JSON.stringify(r7.msgs));

  // ---- ⑧ 一覧を続けて押しても、開くのは最初の1つだけ ----
  const r8 = await page.evaluate(async () => {
    const a = __file('245401.json', __case('245401'));
    const b = __file('245402.json', __case('245402'));
    const p1 = openJsonFile(a);
    const p2 = openJsonFile(b);          // 指が滑って続けて押した
    await Promise.all([p1, p2]);
    await new Promise(r => setTimeout(r, 200));
    return { mgmt: M.chosho_mgmt_no };
  });
  console.log('⑧続けて押す', JSON.stringify(r8));
  ok(r8.mgmt === '245401',
     '★続けて押すと、押した順と違う戸別が開く（思っていたのと違う戸別に入力してしまう） → '
     + JSON.stringify(r8));

  // ---- ⑨ 「履歴・読込」の窓が閉じていても、一覧はちゃんと見える ----
  const r9 = await page.evaluate(async () => {
    closeDraftModal();
    _openPick = []; renderOpenPick();
    __pickFiles([ __file('245501.json', __case('245501')),
                  __file('245502.json', __case('245502')) ]);
    for(let i = 0; i < 60; i++){
      if(document.getElementById('draft-modal').classList.contains('open')) break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 200));
    return { open: document.getElementById('draft-modal').classList.contains('open'),
             rows: document.querySelectorAll('#open-pick-list .op-row').length };
  });
  console.log('⑨窓が閉じているとき', JSON.stringify(r9));
  ok(r9.open === true,
     '★窓が閉じたまま一覧を出している（押しても何も起きない行き止まり） → ' + JSON.stringify(r9));
  ok(r9.rows === 2, '★窓は開いたのに一覧が出ていない → ' + JSON.stringify(r9));

  // ---- ⑩ フォルダの窓を出せなかったときも、名前だけは覚えられる ----
  const r10 = await page.evaluate(async () => {
    const keepDir = window.showDirectoryPicker;
    window.showDirectoryPicker = () => { const e = new Error('だめ'); e.name = 'SecurityError'; throw e; };
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
    }, 40);
    const p = saveDirChange();
    let opened = false;
    for(let i = 0; i < 60; i++){
      if(document.getElementById('pick-modal').classList.contains('open')){ opened = true; break; }
      await new Promise(r => setTimeout(r, 100));
    }
    if(opened){
      const row = Array.from(document.querySelectorAll('#pick-list .pick-row'))
        .filter(el => el.querySelector('.pick-main').textContent.trim() === 'テスト物件')[0];
      if(row) row.click(); else document.getElementById('pick-close').click();
    }
    await p;
    clearInterval(t);
    window.showDirectoryPicker = keepDir;
    return { opened, after: saveHintName() };
  });
  console.log('⑩窓が出せない端末', JSON.stringify(r10));
  ok(r10.opened === true,
     '★フォルダの窓を出せないと、名前の窓にも来られず何も起きない → ' + JSON.stringify(r10));
  ok(r10.after === 'テスト物件', '★選んだ名前が覚えられていない → ' + JSON.stringify(r10));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v165_genba');
})();
