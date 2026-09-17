/* 版166（現場入力）
   ・上の帯が横にはみ出して、画面が横に動いたり縮んだりしないこと。
     物件名がそのまま保存先の名前に入るので、長い名前（例
     「令和８年度戸別受信設備設置工事（その２）」）でも画面の幅に収まること。
   ・長くても「変更」は押せる（消えない）／全部の名前は押したときの説明に残る。
   ・上の帯の貼り付き（下へ送っても上に残る）は、はみ出し止めを入れても効いていること。 */
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

/* いちばん狭い部類のスマホ（iPhone SE）で見る。ここで収まれば大きい端末でも収まる */
const W = 320, H = 690;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{ width:W, height:H }, deviceScaleFactor:2 })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);

  const ready = await page.evaluate(() => ({
    f: ['renderSaveBar','saveHintSet','saveHintName'].filter(n => typeof window[n] !== 'function'),
    bar: !!document.getElementById('savebar'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.bar === true, '試験の前提: 保存バーが無い');
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    /* 画面より右へはみ出している「見えている物」を探す。
       見えない物（閉じている窓など）は数えない。 */
    window.__over = () => {
      const w = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('body *').forEach(el => {
        if(!el.getClientRects().length) return;                 // 見えていない
        const r = el.getBoundingClientRect();
        if(r.width <= 0 || r.height <= 0) return;
        if(r.right > w + 1 || r.left < -1){
          out.push({ tag: el.tagName.toLowerCase(),
                     id: el.id || '', cls: String(el.className || '').slice(0, 40),
                     left: Math.round(r.left), right: Math.round(r.right), w: w });
        }
      });
      return out.slice(0, 8);
    };
    window.__hscroll = () => ({
      docW: document.documentElement.scrollWidth,
      bodyW: document.body.scrollWidth,
      clientW: document.documentElement.clientWidth,
      inner: window.innerWidth
    });
  });

  // ---- ① 物件名がそのまま入っても、画面が横に広がらない ----
  const LONG = '令和８年度戸別受信設備設置工事（その２）';
  const r1 = await page.evaluate(async (long) => {
    // 実機と同じく「フォルダを掴めない端末」にする
    try { delete window.showDirectoryPicker; } catch(_){ window.showDirectoryPicker = undefined; }
    M.chosho_mgmt_no = '2621MNT051';
    saveHintSet(long);
    renderSaveBar();
    await new Promise(r => setTimeout(r, 120));
    const bar = document.getElementById('savebar');
    const n = bar.querySelector('.sb-dest-n');
    const x = bar.querySelector('.sb-dest-x');
    return { scroll: __hscroll(), over: __over(),
             barOver: bar.scrollWidth - bar.clientWidth,
             hasName: !!n, nameCut: !!n && n.scrollWidth > n.clientWidth,
             changeShown: !!x && x.getBoundingClientRect().width > 0,
             changeRight: x ? Math.round(x.getBoundingClientRect().right) : -1,
             title: (bar.querySelector('.sb-dest') || {}).title || '' };
  }, LONG);
  console.log('①長い物件名', JSON.stringify(r1));
  ok(r1.scroll.docW <= r1.scroll.clientW,
     '★画面が横に広がっている（横に動く・縮む） → 中身 ' + r1.scroll.docW + 'px ／ 画面 ' + r1.scroll.clientW + 'px');
  ok(r1.over.length === 0,
     '★画面からはみ出している物がある → ' + JSON.stringify(r1.over));
  ok(r1.barOver <= 1,
     '★保存バーの中身が帯の外へはみ出している → ' + r1.barOver + 'px');
  ok(r1.hasName === true, '★保存先の名前が「…」で切れる作りになっていない → ' + JSON.stringify(r1));
  ok(r1.changeShown === true && r1.changeRight <= r1.scroll.clientW,
     '★長い名前で「変更」が押せなくなっている → ' + JSON.stringify(r1));
  ok(r1.title.indexOf(LONG) >= 0,
     '★切った名前の全部が、押したときの説明に残っていない → ' + JSON.stringify(r1.title));

  // ---- ② もっと長い名前でも収まる ----
  const r2 = await page.evaluate(async () => {
    saveHintSet('あ'.repeat(120));
    renderSaveBar();
    await new Promise(r => setTimeout(r, 120));
    return { scroll: __hscroll(), over: __over() };
  });
  console.log('②とても長い名前', JSON.stringify(r2));
  ok(r2.scroll.docW <= r2.scroll.clientW,
     '★とても長い名前で画面が横に広がる → ' + JSON.stringify(r2.scroll));
  ok(r2.over.length === 0, '★はみ出している物がある → ' + JSON.stringify(r2.over));

  // ---- ③ 管理番号・顧客名が長くても、上の帯が広がらない ----
  const r3 = await page.evaluate(async () => {
    saveHintSet('リスト');
    M.chosho_mgmt_no = '2621MNT051234567890ABCDEFGHIJ';
    M.chosho_cust_name = '長野原町大字応桑字浅間隠山北麓';
    updateHeader(); renderSaveBar();
    await new Promise(r => setTimeout(r, 120));
    const h = document.querySelector('header');
    return { scroll: __hscroll(), over: __over(),
             headW: Math.round(h.getBoundingClientRect().width) };
  });
  console.log('③長い管理番号・氏名', JSON.stringify(r3));
  ok(r3.scroll.docW <= r3.scroll.clientW,
     '★長い管理番号・氏名で画面が横に広がる → ' + JSON.stringify(r3.scroll));
  ok(r3.over.length === 0, '★はみ出している物がある → ' + JSON.stringify(r3.over));
  ok(r3.headW <= r3.scroll.clientW + 1,
     '★上の帯が画面より広い（文字が切れて見える） → ' + JSON.stringify(r3));

  // ---- ④ はみ出し止めを入れても、上の帯と保存バーは上に貼り付いたまま ----
  const r4 = await page.evaluate(async () => {
    // 下へ送れるだけの高さを作る
    document.querySelectorAll('.sec').forEach(s => s.classList.add('open'));
    await new Promise(r => setTimeout(r, 120));
    const before = document.documentElement.scrollHeight;
    window.scrollTo(0, 800);
    await new Promise(r => setTimeout(r, 200));
    const h = document.querySelector('header').getBoundingClientRect();
    const sb = document.getElementById('savebar').getBoundingClientRect();
    const y = window.scrollY;
    window.scrollTo(0, 0);
    return { scrolled: y, headTop: Math.round(h.top), barTop: Math.round(sb.top),
             pageH: before, canScrollDown: before > window.innerHeight };
  });
  console.log('④貼り付き', JSON.stringify(r4));
  ok(r4.canScrollDown === true, '試験の前提: 下へ送れる高さが無い → ' + JSON.stringify(r4));
  ok(r4.scrolled > 100, '★下へ送れない（縦の巻き取りが止まっている） → ' + JSON.stringify(r4));
  ok(r4.headTop >= -1 && r4.headTop <= 2,
     '★下へ送ると上の帯が上に残らない → ' + JSON.stringify(r4));
  ok(r4.barTop >= r4.headTop, '★保存バーが上の帯より上に出ている → ' + JSON.stringify(r4));

  // ---- ⑤ 窓（履歴・台帳）を開いても横に広がらない ----
  const r5 = await page.evaluate(async () => {
    const out = {};
    await openDraftModal();
    await new Promise(r => setTimeout(r, 250));
    out.draft = { scroll: __hscroll(), over: __over() };
    closeDraftModal();
    await new Promise(r => setTimeout(r, 120));
    out.after = __hscroll();
    return out;
  });
  console.log('⑤窓を開く', JSON.stringify(r5));
  ok(r5.draft.scroll.docW <= r5.draft.scroll.clientW,
     '★履歴の窓を開くと画面が横に広がる → ' + JSON.stringify(r5.draft.scroll));
  ok(r5.draft.over.length === 0, '★窓の中にはみ出している物がある → ' + JSON.stringify(r5.draft.over));

  // ---- ⑥ 何か1つでも画面より広い物が混ざったとき、最後の歯止めが効く ----
  const r6 = await page.evaluate(async () => {
    const d = document.createElement('div');
    d.id = '__wide';
    d.style.cssText = 'width:900px; height:6px; background:transparent;';
    document.body.appendChild(d);
    await new Promise(r => setTimeout(r, 120));
    const s = __hscroll();
    d.remove();
    return s;
  });
  console.log('⑥最後の歯止め', JSON.stringify(r6));
  ok(r6.docW <= r6.clientW,
     '★画面より広い物が1つ混ざるだけで、画面ごと横に動く（最後の歯止めが無い） → '
     + JSON.stringify(r6));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v166_genba');
})();
