/* 版156: PCに中身がある戸別の【見るだけ】の関門（版155の本体）と、
   受付台帳との往復（工事の時刻・工程の印）、現場が書き出す欄の取りこぼし（メインと突き合わせ）。 */
const { chromium } = require('playwright-core');
/* Chromium の置き場所。環境変数 CHROME で変えられる。 */
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
/* 3つのリポジトリは隣どうしに置いてある前提（…/antenna_main/開発ツール/試験/ から数える） */
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const GENBA = process.argv[2] || FILE('antenna_genba');
const MAIN  = process.argv[3] || FILE('antenna_main');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:420,height:900} });
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { const t = m.text();
      if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
    p.on('dialog', d => d.accept().catch(()=>{})); };
  const page = await ctx.newPage(); watch(page);
  await page.goto(GENBA); await page.waitForTimeout(2500);

  await page.evaluate(() => {
    window.__asked = []; window.__answer = true;
    uiConfirm = async m => { window.__asked.push(String(m)); return window.__answer; };
    uiAlert   = async m => { window.__asked.push(String(m)); return true; };
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
    window.__rows = (extra) => {
      receptionSaveRows({ rows:[
        { mgmt_no:'G0001', name:'あ様', addr:'○市1-1', date:'2026-09-10', status:'in_progress',
          photos:6, has_dwg:true, work_done:false },
        { mgmt_no:'G0002', name:'い様', addr:'○市1-2', date:'2026-09-11', status:'completed',
          photos:3, has_dwg:true, work_done:false },
        { mgmt_no:'G0003', name:'う様', addr:'○市1-3', date:'2026-09-12', status:'in_progress',
          photos:0, has_dwg:false, work_done:false },
        { mgmt_no:'G0004', name:'え様', addr:'○市1-4', status:'in_progress',
          photos:-1, has_dwg:false, work_done:false }].concat(extra || []),
        project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    };
  });

  // ---- ① 台帳に「PCに何が入っているか」が届く ----
  const r1 = await page.evaluate(() => {
    __rows();
    const rows = getReceptionRows();
    return { n: rows.length, p1: rows[0].photos, d1: rows[0].has_dwg === true,
             p4: rows[3].photos, has: rows.map(r => rcPcHas(r).any),
             done2: rcPcHas(rows[1]).done === true };
  });
  console.log('①台帳', JSON.stringify(r1));
  ok(r1.n === 4 && r1.p1 === 6 && r1.d1 === true,
     '★写真の枚数・図面ありが台帳から届いていない → ' + JSON.stringify(r1));
  ok(r1.p4 === -1, '★「枚数が分からない」(-1) が落ちる → ' + r1.p4);
  ok(JSON.stringify(r1.has) === JSON.stringify([true, true, false, true]),
     '★「PCに中身あり」の見分けが違う → ' + JSON.stringify(r1.has));
  ok(r1.done2 === true, '★工事完了の戸別を見分けられない → ' + r1.done2);

  // ---- ② PCに中身がある戸別は【見るだけ】。保存しない・撮影も押せない ----
  const r2 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await new Promise(r => setTimeout(r, 500));
    const band = document.querySelector('.pcg-ttl');
    const what = document.querySelector('.pcg-what');
    const cam = document.getElementById('cam-btn'), pick = document.getElementById('pick-btn');
    const cs = el => el ? getComputedStyle(el).pointerEvents : '(無し)';
    window.__asked = [];
    const okSave = await pcGuardBeforeSave();
    return { viewOnly: !!M._viewOnly, body: document.body.classList.contains('viewonly'),
             band: band ? band.textContent : '(無し)', what: what ? what.textContent : '(無し)',
             cam: cs(cam), pick: cs(pick), okSave, asked: window.__asked.join(' / ') };
  });
  console.log('②見るだけ', JSON.stringify(r2));
  ok(r2.viewOnly === true && r2.body === true, '★見るだけになっていない → ' + JSON.stringify(r2));
  ok(/中身があります/.test(r2.band), '★帯が出ていない → ' + r2.band);
  ok(/写真/.test(r2.what), '★何が入っているかを出していない → ' + r2.what);
  ok(r2.cam === 'none' && r2.pick === 'none', '★見るだけでも撮影・選択を押せる → ' + JSON.stringify(r2));
  ok(r2.okSave === false && /見るだけ/.test(r2.asked),
     '★見るだけなのに保存してしまう → ' + JSON.stringify(r2));

  // ---- ③ 工事完了の戸別は、もっと強く言う ----
  const r3 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[1]); await new Promise(r => setTimeout(r, 500));
    const t = document.querySelector('.pcg-ttl'), w = document.querySelector('.pcg-what');
    return { ttl: t ? t.textContent : '(無し)', what: w ? w.textContent : '(無し)' };
  });
  console.log('③完了', JSON.stringify(r3));
  ok(/工事が終わっている/.test(r3.ttl), '★完了の戸別でもふつうの見出しになっている → ' + r3.ttl);
  ok(/工事完了/.test(r3.what), '★完了が入っていることを出していない → ' + r3.what);

  // ---- ④ PCに中身が無い戸別は、今までどおり入力できる ----
  const r4 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[2]); await new Promise(r => setTimeout(r, 500));
    return { viewOnly: !!M._viewOnly, band: !!document.querySelector('.pcg-ttl'),
             body: document.body.classList.contains('viewonly') };
  });
  console.log('④中身なし', JSON.stringify(r4));
  ok(r4.viewOnly === false && r4.band === false && r4.body === false,
     '★PCに中身が無い戸別まで止めている → ' + JSON.stringify(r4));

  // ---- ⑤ 📂 で読み込めば編集できる。読み込んだ中身も入る ----
  const r5 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await new Promise(r => setTimeout(r, 500));
    const before = !!M._viewOnly;
    await loadStateInto({ chosho_mgmt_no:'G0001', work_type:'new', chosho_cust_name:'あ様',
      chosho_photos:[{label:'PC1',dataUri:__png('#c33'),id:'p1'},{label:'PC2',dataUri:__png('#3a6'),id:'p2'}],
      qty_overrides:{ u206:4 }, survey_done:true, _origin:'main' }, 'G0001.json');
    await new Promise(r => setTimeout(r, 450));
    return { before, after: !!M._viewOnly, body: document.body.classList.contains('viewonly'),
             photos: (M.chosho_photos||[]).length, base: !!fileBaseGet(M),
             fromFile: !!M._fromCaseFile };
  });
  console.log('⑤読み込み', JSON.stringify(r5));
  ok(r5.before === true && r5.after === false && r5.body === false,
     '★戸別ファイルを読み込んでも見るだけのまま → ' + JSON.stringify(r5));
  ok(r5.photos === 2 && r5.base === true && r5.fromFile === true,
     '★読み込んだのに写真・控えが入っていない → ' + JSON.stringify(r5));

  // ---- ⑥ 「このまま入力する」は、消えるものを並べて確かめてから ----
  const r6 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[1]); await new Promise(r => setTimeout(r, 500));
    window.__asked = []; window.__answer = false;          // まず断る
    const no = await pcGuardForceAsk();
    const stillView = !!M._viewOnly;
    window.__answer = true;                                 // つぎは了解する
    await pcGuardForceAsk();
    await new Promise(r => setTimeout(r, 250));
    const ack = window.__asked.join(' / ');
    // 一度了解したら、開くたびに聞かない
    window.__asked = [];
    const again = await pcGuardNeeded(M, rcRowOf('G0002'));
    return { no, stillView, nowView: !!M._viewOnly, ack, again: !!again };
  });
  console.log('⑥このまま入力', JSON.stringify(r6));
  ok(r6.stillView === true, '★断っても見るだけが外れてしまう → ' + JSON.stringify(r6));
  ok(r6.nowView === false, '★了解しても入力できるようにならない → ' + JSON.stringify(r6));
  ok(/消えます/.test(r6.ack) && /写真/.test(r6.ack),
     '★何が消えるかを並べずに進めている → ' + JSON.stringify(r6.ack));
  ok(r6.again === false, '★一度了解した戸別を、開くたびに止めている → ' + r6.again);

  // ---- ⑦ 受付台帳との往復：工事の時刻と工程の印 ----
  const r7 = await page.evaluate(async () => {
    // 台帳に時刻・下見の○が入って戻ってきた
    __rows([{ mgmt_no:'G0009', name:'か様', addr:'○市9-9', date:'2026-10-01', time:'14:00',
              status:'in_progress', survey:true, photos:0, has_dwg:false, work_done:false }]);
    M = freshModel(); ensureModelShape(M);
    const row = rcRowOf('G0009');
    await openFromReception(row); await new Promise(r => setTimeout(r, 500));
    const got = { time: M.chosho_time, survey: M.survey_done === true, date: M.chosho_date };
    // 現場で時刻を直す → 台帳を取り込み直しても、現場の直しが残る
    M.chosho_time = '16:30'; M._touched = true;
    receptionApplyToModel(M, rcRowOf('G0009'));
    const kept = { time: M.chosho_time };
    // 事務所が台帳の時刻を直した → こちらも入れ直す
    __rows([{ mgmt_no:'G0009', name:'か様', addr:'○市9-9', date:'2026-10-01', time:'09:00',
              status:'in_progress', survey:true, photos:0, has_dwg:false, work_done:false }]);
    receptionApplyToModel(M, rcRowOf('G0009'));
    return { got, kept, after: M.chosho_time };
  });
  console.log('⑦台帳の往復', JSON.stringify(r7));
  ok(r7.got.time === '14:00' && r7.got.survey === true && r7.got.date === '2026-10-01',
     '★台帳の時刻・下見の○が入っていない → ' + JSON.stringify(r7.got));
  ok(r7.kept.time === '16:30',
     '★台帳が変わっていないのに、現場で直した時刻が戻る → ' + JSON.stringify(r7.kept));
  ok(r7.after === '09:00',
     '★事務所が台帳で直した時刻が入らない → ' + r7.after);

  // ---- ⑧ 現場が書き出す欄は、すべてPCの取込に居場所がある ----
  const main = await ctx.newPage(); watch(main);
  await main.goto(MAIN); await main.waitForTimeout(3000);
  const gKeys = await page.evaluate(() => Array.from(GENBA_KNOWN_KEYS));
  const mLists = await main.evaluate(() => ({
    auth: (typeof GENBA_AUTHORITATIVE_FIELDS !== 'undefined') ? GENBA_AUTHORITATIVE_FIELDS.slice() : [],
    hard: (typeof GENBA_HARD_KEEP_MAIN !== 'undefined') ? GENBA_HARD_KEEP_MAIN.slice() : [],
    cust: (typeof GENBA_CUSTOMER_FIELDS !== 'undefined') ? GENBA_CUSTOMER_FIELDS.slice() : [] }));
  const mSet = new Set([].concat(mLists.auth, mLists.hard, mLists.cust));
  /* 中身ではない印（ファイルの目印・台帳が持ち主の欄・写真そのもの）は、PCの取込の
     並びに入っていなくてよい。ここに挙げたもの以外が漏れていたら、PCで落ちる欄になる。 */
  const NOTCONTENT = new RegExp([
    '^_',                       // ファイルの目印・端末の中だけの控え
    '^apt_', '^compdoc_waived', // 受付台帳（マンション管理）が持ち主
    '^chosho_photo',            // 写真そのもの・PC物件の控え用メタ（現場は書き出さない）
    '^editedAt$', '^meas_show$',// 中身ではない
    '^chosho_mgmt_no$',         // 戸別を見分ける鍵。値として取り込むものではない
    '^chosho_date$', '^chosho_time$', '^chosho_meet_at$', '^chosho_status$'  // 受付台帳が持ち主
  ].join('|'));
  const orphan = gKeys.filter(k => !mSet.has(k) && !NOTCONTENT.test(k));
  console.log('⑧欄の突き合わせ', JSON.stringify({ 現場: gKeys.length, PC: mSet.size, 漏れ: orphan }));
  ok(mSet.size > 40, '試験の前提: PCの取込の並びが読めていない → ' + mSet.size);
  ok(orphan.length === 0, '★現場が書き出すのにPCの取込が見ていない欄: ' + orphan.join(' / '));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v156_guard');
})();
