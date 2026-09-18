/* 版169（現場入力）
   管理番号をひと押しでコピーできること。
     ・上の帯の管理番号を押すとコピーできる（📋 が出ている＝押せることが分かる）
     ・PCの守りの帯には「📋 管理番号をコピー」が出る（フォルダを掴めない端末だけ）
     ・長い管理番号でも 📋 は「…」で消えない（押せる所の目印だから）
     ・管理番号が空のときは、押しても何も起きたふりをしない
     ・上部は今までどおり、字を 180% にしても横にはみ出さない（版166・版167 の約束） */
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

const LONG_NO = '2621HIN101-01-ながいばんごうのれい';

/* ★この試験だけは http で開く★
   コピーの貼り付け先（クリップボード）を読み返して確かめるには、
   ブラウザに「読み書きしてよい」と言っておく必要がある。それは file:// では効かない。
   中身は同じ1枚のHTMLで、外から何も読み込まないので、開き方を変えても動きは変わらない。 */
const http = require('http');
function serve(file){
  return new Promise(res => {
    const html = fs.readFileSync(decodeURIComponent(String(file).replace(/^file:\/\//, '')));
    const srv = http.createServer((q, s) => {
      s.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' }); s.end(html);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv: srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}

(async () => {
  const web = await serve(HTML);
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width: 320, height: 690 }, deviceScaleFactor: 2 });
  try{ await ctx.grantPermissions(['clipboard-read','clipboard-write'], { origin: web.url }); }catch(_){}
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(web.url); await page.waitForTimeout(2500);

  /* ★窓（uiAlert/uiConfirm）は、出たら黙って閉じる★
     これが無いと、本文を壊したとき（変異試験）に窓が開いたまま待ち続けて終わらない。
     出た文は __said に控えて、あとで中身を確かめる。 */
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
    /* 待ちっぱなしにしない（壊れた本文でも必ず返る） */
    window.__race = p => Promise.race([p, new Promise(r => setTimeout(() => r('TIMEOUT'), 5000))]);
  });

  // ---------- ⓪ 前提 ----------
  const ready = await page.evaluate(() => ({
    f: ['copyTextSync','copyText','copyMgmtNo','updateHeader','renderPcGuard']
        .filter(n => typeof window[n] !== 'function'),
    hdr: !!document.getElementById('hdr-mgmt'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.hdr === true, '試験の前提: 上の帯の管理番号が無い');
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // ---------- ① 管理番号が空のとき ----------
  const r1 = await page.evaluate(() => {
    M.chosho_mgmt_no = ''; updateHeader();
    const el = document.getElementById('hdr-mgmt');
    return { empty: el.classList.contains('empty'),
             clip: !!el.querySelector('.mgmt-c'),
             txt: (el.querySelector('.mgmt-n') || {}).textContent || '' };
  });
  console.log('①管理番号が空', JSON.stringify(r1));
  ok(r1.empty === true, '★空なのに「空」の見た目になっていない');
  ok(r1.clip === false, '★コピーできないのに 📋 を出している（押しても何も起きない）');
  ok(/未入力/.test(r1.txt), '★空のときの字が違う → ' + r1.txt);

  const r1b = await page.evaluate(async () => {
    const got = await __race(copyMgmtNo());
    return { got: got, hint: (document.getElementById('savedhint') || {}).textContent || '' };
  });
  console.log('①押したとき', JSON.stringify(r1b));
  ok(r1b.got === false, '★管理番号が空なのに、コピーしたことになっている');
  ok(/管理番号/.test(r1b.hint), '★空のとき、理由を知らせていない → ' + r1b.hint);

  // ---------- ② 管理番号があるとき：📋 が出て、押すとコピーできる ----------
  const r2 = await page.evaluate(async () => {
    M.chosho_mgmt_no = '2621HIN101'; updateHeader();
    const el = document.getElementById('hdr-mgmt');
    const before = { clip: !!el.querySelector('.mgmt-c'),
                     n: (el.querySelector('.mgmt-n') || {}).textContent || '',
                     title: el.title || '' };
    el.click();                       // ★押す（実際に使われる道）
    await new Promise(r => setTimeout(r, 250));
    let pasted = '';
    try{ pasted = await navigator.clipboard.readText(); }catch(e){ pasted = 'ERR:' + e.message; }
    return Object.assign(before, { pasted: pasted,
      hint: (document.getElementById('savedhint') || {}).textContent || '' });
  });
  console.log('②管理番号があるとき', JSON.stringify(r2));
  ok(r2.clip === true, '★押せることが分かる目印（📋）が出ていない');
  ok(r2.n === '2621HIN101', '★番号の字が違う → ' + r2.n);
  ok(/コピー/.test(r2.title), '★押したら何が起きるかの説明が無い → ' + r2.title);
  ok(r2.pasted === '2621HIN101', '★押しても管理番号がコピーされていない → ' + r2.pasted);
  ok(/2621HIN101/.test(r2.hint) && /貼り付け/.test(r2.hint),
     '★コピーしたあと、次に何をすればよいか出していない → ' + r2.hint);

  /* ---------- ③ 古い端末（navigator.clipboard が無い）でも、ほんとうに写せる ----------
     ★版171 で直した所★ ここは「押しても写せていないのに『コピーしました』と出る」
     という嘘が出ていた（焦点を移していなかったため）。貼り付け先を読み返して確かめる。 */
  const r3 = await page.evaluate(async () => {
    const rt = navigator.clipboard.readText.bind(navigator.clipboard);
    await navigator.clipboard.writeText('__まだ__');
    const keep = navigator.clipboard;
    try{ Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); }catch(_){}
    let got = false, err = '';
    try{ got = await copyText('2622MAB025'); }catch(e){ err = String(e && e.message); }
    try{ Object.defineProperty(navigator, 'clipboard', { value: keep, configurable: true }); }catch(_){}
    let pasted = ''; try{ pasted = await rt(); }catch(e){ pasted = 'ERR'; }
    return { got: got, err: err, pasted: pasted, sync: typeof copyTextSync === 'function' };
  });
  console.log('③古い端末の道', JSON.stringify(r3));
  ok(r3.sync === true, '★もう一つの道（古い端末むけ）が無い');
  ok(r3.err === '', '★古い端末の道で転んだ → ' + r3.err);
  ok(r3.got === 'sync', '★navigator.clipboard の無い端末で、コピーの道が1つも働かない → ' + r3.got);
  ok(r3.pasted === '2622MAB025',
     '★古い端末の道が「写した」と答えるのに、貼り付け先が変わっていない（嘘の知らせ）→ ' + r3.pasted);

  // ---------- ③b 今どきの道が転んでも、もう一つの道へ落ちる ----------
  const r3b = await page.evaluate(async () => {
    await navigator.clipboard.writeText('__まだ__');
    const keep = navigator.clipboard.writeText;
    navigator.clipboard.writeText = () => Promise.reject(new Error('だめ'));
    let got = false, err = '';
    try{ got = await copyText('2622MAB025'); }catch(e){ err = String(e && e.message); }
    navigator.clipboard.writeText = keep;
    let pasted = ''; try{ pasted = await navigator.clipboard.readText(); }catch(e){ pasted = 'ERR'; }
    return { got: got, err: err, pasted: pasted };
  });
  console.log('③b今どきの道が転んだとき', JSON.stringify(r3b));
  ok(r3b.err === '', '★今どきの道が転ぶと、そのまま落ちる → ' + r3b.err);
  ok(r3b.got === 'sync', '★今どきの道が転んだとき、もう一つの道を試していない → ' + r3b.got);
  ok(r3b.pasted === '2622MAB025', '★落ちた先でも写せていない → ' + r3b.pasted);

  /* ---------- ③c 打ちかけの欄へ、焦点も打っていた場所も戻る ----------
     コピーの予備の道は、画面に見えない入力欄をいったん置いて写す。
     戻さないと、備考を打っている途中で 📋 を押したときに、
     打つ場所が飛んだり、日本語の変換が落ちたりする。 */
  const r3c = await page.evaluate(async () => {
    const ta = document.createElement('textarea');
    ta.id = '__typing'; ta.value = '留守・犬あり・裏の物置';
    document.body.appendChild(ta);
    ta.focus(); ta.setSelectionRange(3, 3);
    const keep = navigator.clipboard;
    try{ Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); }catch(_){}
    M.chosho_mgmt_no = '2621HIN101'; updateHeader();
    __said.length = 0;
    await __race(copyMgmtNo());
    try{ Object.defineProperty(navigator, 'clipboard', { value: keep, configurable: true }); }catch(_){}
    const o = { back: document.activeElement === ta, pos: [ta.selectionStart, ta.selectionEnd],
                val: ta.value, hint: (document.getElementById('savedhint') || {}).textContent || '' };
    ta.remove();
    return o;
  });
  console.log('③c打ちかけの欄へ戻る', JSON.stringify(r3c));
  ok(r3c.back === true, '★コピーしたあと、打っていた欄に焦点が戻らない（打ちかけの字が続けられない）');
  ok(r3c.pos[0] === 3 && r3c.pos[1] === 3, '★打っていた場所が飛んだ → ' + JSON.stringify(r3c.pos));
  ok(r3c.val === '留守・犬あり・裏の物置', '★打ちかけの字が変わった → ' + r3c.val);
  ok(/手で入れて/.test(r3c.hint),
     '★予備の道なのに「写せた」と言い切っている（確かめようが無いのに）→ ' + r3c.hint);

  // ---------- ④ 長い管理番号でも 📋 は消えない ----------
  const r4 = await page.evaluate((LONG) => {
    M.chosho_mgmt_no = LONG; M.survey = 'done'; updateHeader();
    const el = document.getElementById('hdr-mgmt');
    const c = el.querySelector('.mgmt-c'), n = el.querySelector('.mgmt-n');
    const hd = document.querySelector('header'), ttl = document.querySelector('header .ttl');
    const cr = c ? c.getBoundingClientRect() : null;
    return { clipW: cr ? Math.round(cr.width) : 0,
             clipRight: cr ? Math.round(cr.right) : 0,
             見える右端: Math.round(ttl.getBoundingClientRect().right),
             画面: document.documentElement.clientWidth,
             番号が切れる: n ? (n.scrollWidth > n.clientWidth) : false,
             上はみ出し: Math.max(0, hd.scrollWidth - hd.clientWidth) };
  }, LONG_NO);
  console.log('④長い管理番号', JSON.stringify(r4));
  ok(r4.clipW > 0, '★長い番号だと 📋 が消える（押せることが分からなくなる）');
  ok(r4.clipRight <= r4.見える右端,
     '★📋 が見えている所の外へ押し出された（長い番号だと 📋 が見えない）→ 📋の右端 '
     + r4.clipRight + ' ／ 見える右端 ' + r4.見える右端);
  ok(r4.clipRight <= r4.画面, '★📋 が画面の外に出ている → 右端 ' + r4.clipRight + ' ／ 画面 ' + r4.画面);
  ok(r4.番号が切れる === true,
     '★「…」で切れるのが番号ではない（番号が伸びて 📋 を押し出す作りになっている）');
  ok(r4.上はみ出し === 0, '★上の帯が横にはみ出した（' + r4.上はみ出し + 'px）');

  // ---------- ⑤ 守りの帯（フォルダを掴めない端末＝スマホ） ----------
  const r5 = await page.evaluate(async () => {
    const keep = window.showDirectoryPicker;
    try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    renderPcGuard();
    const btn = document.getElementById('pcg-copy');
    const o = { copy: !!btn, label: btn ? btn.textContent : '',
                msg: (document.querySelector('#pcguard .pcg-msg') || {}).textContent || '' };
    try{ await navigator.clipboard.writeText('__まだ__'); }catch(_){}
    if(btn) btn.click();
    await new Promise(r => setTimeout(r, 250));
    try{ o.pasted = await navigator.clipboard.readText(); }catch(e){ o.pasted = 'ERR'; }
    window.showDirectoryPicker = keep;
    return o;
  });
  console.log('⑤帯のコピー（スマホ）', JSON.stringify(r5));
  ok(r5.copy === true, '★スマホの帯に「📋 管理番号をコピー」が無い');
  ok(/コピー/.test(r5.label), '★ボタンの字が違う → ' + r5.label);
  ok(/貼り付け/.test(r5.msg), '★帯に、貼り付けて探せることを書いていない');
  ok(r5.pasted === '2621HIN101', '★帯のボタンを押してもコピーされていない → ' + r5.pasted);

  // ---------- ⑥ フォルダを掴める端末（PC）では出さない ----------
  const r6 = await page.evaluate(() => {
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; M._viewOnly = true;
    renderPcGuard();
    return { copy: !!document.getElementById('pcg-copy'),
             dir: !!document.getElementById('pcg-dir') };
  });
  console.log('⑥帯（PC）', JSON.stringify(r6));
  ok(r6.dir === true, '★PCの帯に「📁 PCのフォルダから読み込む」が無い（版168 の約束）');
  ok(r6.copy === false, '★PCではフォルダから直に読めるのに、コピーのボタンまで出して迷わせている');

  // ---------- ⑦ 上部は、字を太らせても横にはみ出さない（版166・版167 の約束） ----------
  const r7 = await page.evaluate(async (LONG) => {
    M = freshModel(); M._viewOnly = false; renderPcGuard();
    M.chosho_mgmt_no = LONG; M.survey = 'done'; M.flyer = 'done';
    try{ saveHintSet('令和８年度戸別受信設備設置工事（その２）'); }catch(_){}
    _save.fileAt = Date.now(); _save.savedAt = Date.now();
    updateHeader(); renderSaveBar();
    const st = document.createElement('style'); document.head.appendChild(st);
    const out = [];
    for(const pct of [100, 130, 180]){
      st.textContent = 'html,body{overflow-x:visible !important;}'
        + ' header, .savebar{ font-size:' + pct + '% !important; }'
        + ' header *, .savebar *{ font-size:inherit !important; }';
      await new Promise(r => setTimeout(r, 120));
      const hd = document.querySelector('header'), bar = document.getElementById('savebar');
      out.push({ 字: pct,
        上: Math.max(0, hd.scrollWidth - hd.clientWidth),
        帯: Math.max(0, bar.scrollWidth - bar.clientWidth),
        ページ: document.documentElement.scrollWidth,
        画面: document.documentElement.clientWidth });
    }
    st.remove();
    return out;
  }, LONG_NO);
  console.log('⑦字を太らせる', JSON.stringify(r7));
  r7.forEach(x => {
    ok(x.上 === 0, '★字が ' + x.字 + '% の端末で、上の帯が画面からはみ出す（' + x.上 + 'px）');
    ok(x.帯 === 0, '★字が ' + x.字 + '% の端末で、保存バーが画面からはみ出す（' + x.帯 + 'px）');
    ok(x.ページ <= x.画面, '★字が ' + x.字 + '% の端末で、ページが画面より広い（' + x.ページ + '／' + x.画面 + '）');
  });

  // ---------- ⑧ どちらの道でも写せなかったときは、番号を画面に出す ----------
  const r8 = await page.evaluate(async () => {
    M = freshModel(); M.chosho_mgmt_no = '2621HIN101'; updateHeader();
    const keepC = navigator.clipboard.writeText;
    const keepE = document.execCommand;
    navigator.clipboard.writeText = () => Promise.reject(new Error('だめ'));
    document.execCommand = () => false;
    __said.length = 0;
    const got = await __race(copyMgmtNo());
    navigator.clipboard.writeText = keepC;
    document.execCommand = keepE;
    return { got: got, said: __said.join(' / ') };
  });
  console.log('⑧どちらでも写せないとき', JSON.stringify(r8));
  ok(r8.got === false, '★写せていないのに、コピーしたことになっている（貼り付けても何も出ない）');
  ok(/2621HIN101/.test(r8.said),
     '★写せなかったのに黙っている（番号を手で入れようにも読めない） → ' + r8.said);

  await page.evaluate(() => { try{ __stopDlg(); }catch(_){} });
  const e2 = errs.filter(x => !/ResizeObserver|NotFound/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));

  await b.close();
  try{ web.srv.close(); }catch(_){}
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版169（現場入力）');
})();
