/* 版170（現場入力）
   ・「📂 1つだけ選ぶ」と「📚 まとめて選ぶ」を分けた（1つ開きたいだけのとき、選ぶ手数を増やさない）
   ・まとめて選んだあと、いま開こうとしている戸別の番号で自動で絞る
     （ここを空にしていたので「数百件から自力で探すしかない」になっていた）
   ・選んだ中にその戸別が無かったら、はっきり言う（Dropbox の取り寄せの案内つき）
   ・端末が名前の後ろに足す分（管理番号_1758…／管理番号 2）は同じ戸別、-01 は別の戸別 */
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

/* 「リスト」フォルダに何百個も入っている、という場面を作る */
const SETUP = `
window.__caseJson = function(no){
  return JSON.stringify({ chosho_mgmt_no: no, work_type:'catv_to_uhf', amplifier:'amp_3u43',
    chosho_cust_name: no + ' の家', editedAt:'2026-09-10T00:00:00.000Z' });
};
/* names の名前でファイルを作って「まとめて選んだ」ことにする */
window.__pickMany = async function(names){
  const dt = new DataTransfer();
  names.forEach(n => dt.items.add(new File([__caseJson(n.replace(/(?:_\\d+| ?\\(\\d+\\)| \\d+)?\\.json(?:\\.txt)?$/,''))],
                                           n, { type:'application/json' })));
  const inp = document.getElementById('import-file');
  inp.files = dt.files;
  inp.dispatchEvent(new Event('change', { bubbles:true }));
  await new Promise(r => setTimeout(r, 700));
};
window.__pickOne = async function(name){
  const dt = new DataTransfer();
  dt.items.add(new File([__caseJson(name.replace(/\\.json$/,''))], name, { type:'application/json' }));
  const inp = document.getElementById('import-one');
  inp.files = dt.files;
  inp.dispatchEvent(new Event('change', { bubbles:true }));
  await new Promise(r => setTimeout(r, 700));
};
/* リストに並ぶ「戸別の行」の番号を読む */
window.__rows = function(){
  return Array.from(document.querySelectorAll('#open-pick-list [data-openpick] .op-no'))
    .map(e => e.textContent.trim());
};
window.__manyNames = function(n, want){
  const a = [];
  for(let i = 1; i <= n; i++) a.push('2621HIN' + String(100 + i) + '.json');
  if(want) a.push(want);
  return a;
};
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{ width: 390, height: 780 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);
  await page.evaluate(SETUP);
  /* 窓は黙って閉じ、出た文を控える */
  await page.evaluate(() => {
    window.__said = [];
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')){
        window.__said.push((document.getElementById('ui-dialog-msg') || {}).textContent || '');
        const okb = document.getElementById('ui-dialog-ok'); if(okb) okb.click();
      }
    }, 40);
    window.__stopDlg = () => clearInterval(t);
  });

  // ---------- ⓪ 前提 ----------
  const ready = await page.evaluate(() => ({
    f: ['openPickIsWanted','openPickMgmtOf','renderOpenPick','renderPcGuard'].filter(n => typeof window[n] !== 'function'),
    one: !!document.getElementById('import-one'),
    many: !!document.getElementById('import-file'),
    btnOne: !!document.getElementById('btn-import-one'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.one === true, '★「1つだけ選ぶ」の入口が無い');
  ok(ready.many === true, '★「まとめて選ぶ」の入口が無い');
  ok(ready.btnOne === true, '★履歴・読込の窓に「1つだけ選んで開く」が無い');
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // ---------- ① 入口の作り（1つだけ／まとめて） ----------
  const r1 = await page.evaluate(() => ({
    oneMulti:  document.getElementById('import-one').multiple,
    manyMulti: document.getElementById('import-file').multiple
  }));
  console.log('①入口の作り', JSON.stringify(r1));
  ok(r1.oneMulti === false, '★「1つだけ選ぶ」なのに複数選べる（選ぶ手数が増えたまま）');
  ok(r1.manyMulti === true, '★「まとめて選ぶ」なのに複数選べない');

  // ---------- ② まとめて選ぶと、その戸別の番号で絞られて1件だけ出る ----------
  const r2 = await page.evaluate(async () => {
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
    __said.length = 0;
    await __pickMany(__manyNames(300, '2621HIN098.json'));
    return { q: document.getElementById('open-pick-q').value,
             rows: __rows(), 全部: _openPick.length,
             hint: (document.getElementById('savedhint') || {}).textContent || '',
             said: __said.slice(), 窓: document.getElementById('draft-modal').classList.contains('open') };
  });
  console.log('②まとめて選ぶ', JSON.stringify({ q:r2.q, rows:r2.rows, 全部:r2.全部, hint:r2.hint, said:r2.said.length, 窓:r2.窓 }));
  ok(r2.全部 === 301, '★試験の前提: 選んだ数が違う → ' + r2.全部);
  ok(r2.窓 === true, '★一覧の窓が開いていない（押して何も起きない）');
  ok(r2.q === '2621HIN098',
     '★いま開こうとしている戸別の番号で絞っていない＝何百個を目で探すことになる → 絞り込み欄 「' + r2.q + '」');
  ok(r2.rows.length === 1 && r2.rows[0] === '2621HIN098',
     '★その戸別だけが出ていない → ' + JSON.stringify(r2.rows.slice(0, 5)) + '（' + r2.rows.length + '件）');
  ok(/2621HIN098/.test(r2.hint), '★何を出したのか知らせていない → ' + r2.hint);
  ok(r2.said.length === 0, '★見つかっているのに窓を出している → ' + r2.said.join(' / '));

  // ---------- ③ 端末が名前の後ろに足していても、同じ戸別として出す ----------
  for(const nm of ['2621HIN098_1758012345678.json', '2621HIN098 2.json', '2621HIN098.json.txt']){
    const r = await page.evaluate(async (nm) => {
      _openPick = [];
      M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
      __said.length = 0;
      await __pickMany(__manyNames(50, nm));
      return { q: document.getElementById('open-pick-q').value, rows: __rows(), said: __said.slice() };
    }, nm);
    console.log('③名前の後ろに足されている（' + nm + '）', JSON.stringify(r));
    ok(r.q === '2621HIN098', '★' + nm + ' を同じ戸別と見ていない（絞り込み欄 「' + r.q + '」）');
    ok(r.rows.length >= 1, '★' + nm + ' が一覧に出ない');
    ok(r.said.length === 0, '★' + nm + ' があるのに「ありません」と出した');
  }

  // ---------- ④ 枝番（-01）は別の戸別。混同しない ----------
  const r4 = await page.evaluate(async () => {
    _openPick = [];
    M = freshModel(); M.chosho_mgmt_no = '2621HIN083'; M._viewOnly = true;
    __said.length = 0;
    await __pickMany(__manyNames(20, '2621HIN083-01.json'));
    return { q: document.getElementById('open-pick-q').value, said: __said.slice() };
  });
  console.log('④枝番は別の戸別', JSON.stringify({ q:r4.q, said:r4.said.length }));
  ok(r4.q === '', '★2621HIN083-01 を 2621HIN083 と同じ戸別だと見ている（別の戸別を開いてしまう）');
  ok(r4.said.length === 1 && /2621HIN083\.json/.test(r4.said[0]),
     '★その戸別が無いのに黙っている → ' + r4.said.join(' / '));

  // ---------- ⑤ 選んだ中に無いときは、はっきり言う ----------
  const r5 = await page.evaluate(async () => {
    _openPick = [];
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
    __said.length = 0;
    await __pickMany(__manyNames(30, null));
    return { q: document.getElementById('open-pick-q').value, said: __said.slice(),
             rows: __rows().length };
  });
  console.log('⑤選んだ中に無い', JSON.stringify({ q:r5.q, rows:r5.rows, said:r5.said }));
  ok(r5.q === '', '★無いのに絞り込んで「当てはまるものがありません」にしている（何も選べない）');
  ok(r5.rows > 0, '★無いときに一覧まで消えている（ほかの戸別も開けない）');
  ok(r5.said.length === 1, '★無いのに黙っている（一覧を目で探しつづけることになる）');
  ok(/2621HIN098\.json/.test(r5.said[0] || ''), '★どの戸別が無いのか言っていない → ' + r5.said[0]);
  ok(/Dropbox/.test(r5.said[0] || ''), '★出てこない時の直し方（取り寄せ）を言っていない → ' + r5.said[0]);

  // ---------- ⑥ その戸別を開きにきたのでなければ、窓は出さない ----------
  const r6 = await page.evaluate(async () => {
    _openPick = [];
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = false;   // 見るだけ ではない
    __said.length = 0;
    await __pickMany(__manyNames(30, null));
    return { said: __said.slice() };
  });
  console.log('⑥見るだけでない時', JSON.stringify(r6));
  ok(r6.said.length === 0, '★ほかの戸別を開きにきただけなのに窓を出している → ' + r6.said.join(' / '));

  // ---------- ⑦ 「1つだけ選ぶ」で選んだファイルがそのまま開く ----------
  const r7 = await page.evaluate(async () => {
    M = freshModel(); M.chosho_mgmt_no = ''; M._viewOnly = false;
    await __pickOne('2622MAB025.json');
    return { no: M.chosho_mgmt_no, fromFile: !!M._fromCaseFile, amp: M.amplifier };
  });
  console.log('⑦1つだけ選ぶ', JSON.stringify(r7));
  ok(r7.no === '2622MAB025', '★1つだけ選んでも開かない → ' + r7.no);
  ok(r7.fromFile === true, '★戸別ファイルを読んだ印が立っていない');

  // ---------- ⑧ 帯のボタン（スマホ） ----------
  const r8 = await page.evaluate(() => {
    const keep = window.showDirectoryPicker;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
    renderPcGuard();
    const T = id => { const e = document.getElementById(id); return e ? e.textContent : null; };
    const o = { load: T('pcg-load'), one: T('pcg-one'), copy: T('pcg-copy'), force: T('pcg-force'),
                dir: T('pcg-dir'),
                loadAlt: (document.getElementById('pcg-load')||{}).className || '',
                msg: (document.querySelector('#pcguard .pcg-msg')||{}).textContent || '',
                order: Array.from(document.querySelectorAll('#pcguard .pcg-btns button')).map(x => x.id) };
    window.showDirectoryPicker = keep;
    return o;
  });
  console.log('⑧帯（スマホ）', JSON.stringify(r8));
  ok(/まとめて/.test(r8.load || ''), '★帯の主役が「まとめて選ぶ」になっていない → ' + r8.load);
  ok(r8.loadAlt.indexOf('alt') < 0, '★「まとめて選ぶ」が主役の見た目になっていない');
  ok(/1つだけ/.test(r8.one || ''), '★帯に「1つだけ選ぶ」が無い → ' + r8.one);
  ok(/コピー/.test(r8.copy || ''), '★帯の「管理番号をコピー」が消えた（版169 の約束）→ ' + r8.copy);
  ok(r8.force !== null, '★「このまま新しく入力する」が消えた');
  ok(r8.dir === null, '★フォルダを掴めない端末に、押しても何も起きないボタンを出している');
  ok(r8.order.indexOf('pcg-load') === 0, '★「まとめて選ぶ」が一番上に無い → ' + r8.order.join(','));
  ok(/すべて選択/.test(r8.msg), '★「すべて選択」すればよいことを書いていない');
  ok(/貼り付け/.test(r8.msg), '★コピーして貼り付けられることを書いていない（版169 の約束）');

  // ---------- ⑨ 帯のボタン（PC）は版168 のまま ----------
  const r9 = await page.evaluate(() => {
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
    renderPcGuard();
    const T = id => { const e = document.getElementById(id); return e ? e.textContent : null; };
    return { dir: T('pcg-dir'), load: T('pcg-load'), one: T('pcg-one'), copy: T('pcg-copy') };
  });
  console.log('⑨帯（PC）', JSON.stringify(r9));
  ok(/フォルダから読み込む/.test(r9.dir || ''), '★PCの「📁 PCのフォルダから読み込む」が消えた（版168 の約束）');
  ok(/ファイルを選んで読み込む/.test(r9.load || ''), '★PCの 📂 の字が変わった → ' + r9.load);
  ok(r9.one === null, '★PCはフォルダから直に読めるのに、ボタンを増やして迷わせている');
  ok(r9.copy === null, '★PCにコピーのボタンを出している（版169 の約束）');

  // ---------- ⑩ 帯の 📚 / 📂 が、それぞれの入口を開く ----------
  const r10 = await page.evaluate(async () => {
    const keep = window.showDirectoryPicker;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    M = freshModel(); M.chosho_mgmt_no = '2621HIN098'; M._viewOnly = true;
    renderPcGuard();
    const hit = [];
    const many = document.getElementById('import-file'), one = document.getElementById('import-one');
    const mk = (el, tag) => { const o = el.click.bind(el); el.click = () => hit.push(tag); };
    mk(many, 'many'); mk(one, 'one');
    document.getElementById('pcg-load').click();
    document.getElementById('pcg-one').click();
    window.showDirectoryPicker = keep;
    return { hit: hit };
  });
  console.log('⑩それぞれの入口', JSON.stringify(r10));
  ok(r10.hit.join(',') === 'many,one',
     '★帯のボタンが別々の入口につながっていない → ' + r10.hit.join(','));

  await page.evaluate(() => { try{ __stopDlg(); }catch(_){} });
  const e2 = errs.filter(x => !/ResizeObserver|NotFound/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版170（現場入力）');
})();
