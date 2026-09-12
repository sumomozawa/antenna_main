/* 版158: 書いたあとの読み返しが「読めなかった」ときだけ、少し待って1回だけ読み直す。
   中身が合わないときは待たずにそのまま知らせる。2回とも読めなければ今までどおり知らせる。 */
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

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:420,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);

  const r = await page.evaluate(async () => {
    const st = { chosho_mgmt_no:'S158A', chosho_date:'2026-09-12', chosho_time:'09:00', chosho_cust_name:'あ様', chosho_photos:[] };
    const good = JSON.stringify(st);
    const mk = plan => { let i = 0; return { calls: () => i,
      getFile: async () => { const p = plan[Math.min(i, plan.length - 1)]; i++;
        if(p === 'throw') throw new Error('The requested file could not be read');
        return { text: async () => p }; } }; };
    const t0 = Date.now();
    // (a) 1回目は読めない、2回目は読める → 何も言わない（読み直している）
    const a = mk(['throw', good]);   const ra = await saveVerify(a, st);   const ta = Date.now() - t0;
    // (b) 2回とも読めない → 今までどおり知らせる（読み直しは1回だけ＝呼び出しは2回）
    const bb = mk(['throw', 'throw']); const rb = await saveVerify(bb, st);
    // (c) 中身が合わない → 待たずに1回で知らせる
    const t1 = Date.now();
    const c = mk([JSON.stringify(Object.assign({}, st, { chosho_time:'08:30' }))]); const rc = await saveVerify(c, st); const tc = Date.now() - t1;
    // (d) 1回目が途中までの中身（同期ソフトが書きかけを見せた）→ 読み直して合えば何も言わない
    const d = mk(['{"chosho_mgmt_no":"S158A","chosho_da', good]); const rd = await saveVerify(d, st);
    return { a:{ r:ra, calls:a.calls(), ms:ta }, b:{ r:rb, calls:bb.calls() }, c:{ r:rc, calls:c.calls(), ms:tc }, d:{ r:rd, calls:d.calls() } };
  });
  console.log('①読み直し', JSON.stringify(r));
  ok(r.a.r === '' && r.a.calls === 2, '★一瞬読めなかっただけで「保存できていないかも」と言う → ' + JSON.stringify(r.a));
  ok(r.a.ms >= 500, '読み直す前に待っていない（同期ソフトが掴んでいる間に読んでしまう） → ' + r.a.ms + 'ms');
  ok(/読み返せませんでした/.test(r.b.r) && /もう一度「保存」/.test(r.b.r) && r.b.calls === 2,
     '★2回読めなかったのに知らせない／読み直しが1回で止まらない → ' + JSON.stringify(r.b));
  ok(/工事の時刻/.test(r.c.r) && /08:30/.test(r.c.r) && r.c.calls === 1 && r.c.ms < 400,
     '★中身が合わないのに知らせない／合わないのに待って読み直している → ' + JSON.stringify(r.c));
  ok(r.d.r === '' && r.d.calls === 2, '★書きかけを読んだだけで知らせている → ' + JSON.stringify(r.d));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v158_genba');
})();
