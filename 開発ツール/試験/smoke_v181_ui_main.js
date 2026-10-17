/* 版181（メイン）：保存まわりの言葉の整理
     ① 画面の上の保存ボタン：「📄 名前を付けて保存」（別のファイルに保存・保存先を選ぶ画面で戸別ファイルを選ばない）・「💾 上書き保存」
        どちらも押す前に何が起きるかが分かる説明（title）
     ② 保存ボタンの横の「？」：開くと「保存ボタンのちがい」。戸別ファイル（管理番号.json）・写し・💾 物件に保存・💾 上書き保存・暗号の戸別 を、本当のことだけで説明する。
        画面からはみ出さない・ほかのメニューを開くと閉じる
     ③ 工事フォルダを選んでいない（書く許可が無い）ときの「💾 物件に保存」の知らせ：「戸別ファイルには書いていません：工事フォルダが選ばれていないか、工事フォルダに書く許可が出ていません」
        （「戸別の個別JSON」「未リンク」と言わない）
     ④ 受付台帳の「この2つは何がちがうの？」：② 戸別ファイルへは「💾 戸別ファイルへ反映」で入る。名前・住所・電話・工事日程予定・状態・備考は「💾 物件に保存」でも入る。
        打合せ・保留・ビラ・同意書・完了書は反映で（「💾 物件に保存」で入るとは言わない）
     ⑤ 画面に出る字（ボタン・説明・知らせ）に、プログラムの言葉（個別JSON・共有物件JSON・IndexedDB・書込み権限付きハンドル など）や
        古いボタンの名前（一括復号・一括平文化・📷 写真を読み直す・「保存」で名前を付けて保存）が残っていない
     ⑥ 写真の取り込み・📉 軽量化のあとの案内は、いま押せるボタンの名前で言う（戸別ファイルとつながっていない画面では「📄 名前を付けて保存」）
   使い方: node smoke_v181_ui_main.js [index.html の file:// URL]　（ONLY=①,③ で場面を絞れる） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const asUrl = s => /^(file|https?):/i.test(s) ? s : url.pathToFileURL(path.resolve(s)).href;
const asPath = s => /^file:/i.test(s) ? url.fileURLToPath(s) : (/^https?:/i.test(s) ? '' : path.resolve(s));
const HTML = asUrl(process.argv[2] || path.join(ROOT, 'antenna_main', 'index.html'));
const HTML_PATH = asPath(HTML);
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const J = o => JSON.stringify(o);

async function openPage(b){
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.goto(HTML); await page.waitForTimeout(1800);
  await page.evaluate(() => { try{ closeMenuView(); }catch(_){} });   // 物件メニューを閉じて、エディタ（画面の上の保存ボタン）を出す
  await page.waitForTimeout(200);
  return { ctx, page, errs };
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  /* ---------- ① 画面の上の保存ボタン ---------- */
  if(want('①')){
    const { ctx, page, errs } = await openPage(b);
    const r = await page.evaluate(() => {
      try{ updateOverwriteSaveBtn(); }catch(_){}
      const s = document.getElementById('btn-save'), o = document.getElementById('btn-save-overwrite');
      return { save: s.textContent, saveTitle: s.title, ow: o.textContent, owTitle: o.title, owOff: o.disabled };
    });
    console.log('①保存ボタン', J(r));
    ok(r.save === '📄 名前を付けて保存', '★①「💾 保存」の名前が「📄 名前を付けて保存」になっていない → ' + r.save);
    ok(/写し/.test(r.saveTitle) && /戸別ファイル（管理番号\.json）を選ばないでください/.test(r.saveTitle) && !/は書き替えません/.test(r.saveTitle),
       '★①📄 名前を付けて保存 の説明が「保存先を選ぶ画面で戸別ファイルを選ばない」と言わない・「書き替えません」と言い切る → ' + r.saveTitle);
    ok(r.ow === '💾 上書き保存', '★①上書きのボタンが「💾 上書き保存」でない → ' + r.ow);
    ok(r.owOff && /📄 名前を付けて保存/.test(r.owTitle), '★①押せない 💾 上書き保存 の説明が、別のファイルへは「📄 名前を付けて保存」と言わない → ' + r.owTitle);
    ok(errs.length === 0, '★①画面でエラー → ' + errs.slice(0, 3).join(' / '));
    await ctx.close();
  }

  /* ---------- ② 「？」保存ボタンのちがい ---------- */
  if(want('②')){
    const { ctx, page } = await openPage(b);
    const before = await page.evaluate(() => {
      const d = document.querySelector('details.save-help');
      const pop = d && d.querySelector('.save-help-pop');
      return { has: !!d, open: !!(d && d.open), shown: !!(pop && pop.getClientRects().length) };
    });
    ok(before.has && !before.open && !before.shown, '★②「？」が無い・はじめから開いている → ' + J(before));
    if(before.has){
      await page.click('details.save-help > summary');
      await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const d = document.querySelector('details.save-help');
        const pop = d.querySelector('.save-help-pop');
        const rc = pop.getBoundingClientRect();
        return { open: d.open, l: Math.round(rc.left), rt: Math.round(rc.right), w: Math.round(rc.width), iw: window.innerWidth,
                 sw: document.documentElement.scrollWidth, text: pop.textContent.replace(/\s+/g, ' ') };
      });
      console.log('②？を開いた', J(r).slice(0, 700));
      ok(r.open && r.w > 0, '★②「？」を押しても開かない → ' + J(r));
      ok(r.l >= 0 && r.rt <= r.iw && r.sw <= r.iw, '★②「保存ボタンのちがい」が画面からはみ出した → ' + J(r));
      ok(/保存ボタンのちがい/.test(r.text), '★②見出し「保存ボタンのちがい」が無い → ' + r.text.slice(0, 120));
      ok(/戸別ファイル（管理番号\.json）/.test(r.text) && /現場のスマホが読むのはこのファイル/.test(r.text), '★②戸別ファイル（現場が読むファイル）の説明が無い → ' + r.text);
      ok(/画面に出ていない写真は消しません/.test(r.text) && !/ファイルにある写真は消しません/.test(r.text), '★②「ファイルにある写真は消しません」と言い切る（画面で消した写真は消える） → ' + r.text);
      ok(/暗号をかけた戸別（\.hyb）は、「💾 物件に保存」では氏名・電話・住所を書き替えず/.test(r.text), '★②暗号の戸別は「💾 物件に保存」で氏名などが入らないことを言わない → ' + r.text);
      ok(/💾 物件に保存/.test(r.text) && /💾 上書き保存/.test(r.text), '★②💾 物件に保存・💾 上書き保存 の説明が無い → ' + r.text);
      ok(/📄 名前を付けて保存＝別のファイルに保存します/.test(r.text) && /工事フォルダの戸別ファイルを選ばないでください/.test(r.text) && !/写し）を作るだけです。工事フォルダの戸別ファイルは書き替えません/.test(r.text),
         '★②📄 名前を付けて保存 の説明が「保存先を選ぶ画面で戸別ファイルを選ばない」と言わない → ' + r.text);
      ok(/現場に渡すときは「💾 物件に保存」/.test(r.text) && /工事フォルダのファイルが付いている戸別は「💾 上書き保存」になります/.test(r.text), '★②物件の一覧から開いた戸別は「💾 物件に保存」（ファイルの付いた戸別は「💾 上書き保存」）、の説明が無い → ' + r.text);
      /* ほかのメニューを開くと閉じる */
      const closed = await page.evaluate(async () => {
        const other = Array.from(document.querySelectorAll('details.uc-menu')).find(d => !d.classList.contains('save-help') && d.getClientRects().length);
        if(!other) return null;
        other.open = true;
        await new Promise(r => setTimeout(r, 150));
        const st = document.querySelector('details.save-help').open;
        other.open = false;
        return st;
      });
      ok(closed === false, '★②ほかのメニューを開いても「保存ボタンのちがい」が開いたまま → ' + J(closed));
    }
    await ctx.close();
  }

  /* ---------- ③ 工事フォルダを選んでいないときの知らせ ---------- */
  if(want('③')){
    const { ctx, page } = await openPage(b);
    const r = await page.evaluate(async () => {
      const row = { fileType: 'plain', file: 'manual:2612UI0001', data: { chosho_mgmt_no: '2612UI0001' } };
      _listRows = [row]; _editingRow = row;
      ensureProjDirHandle = async () => null;
      const msg = await writeCurrentCaseToIndividualFile();
      _listRows = []; _editingRow = null;
      return msg;
    });
    console.log('③工事フォルダなし', J(r));
    ok(/戸別ファイルには書いていません：工事フォルダが選ばれていないか、工事フォルダに書く許可が出ていません/.test(r), '★③工事フォルダを選んでいないときの知らせが「戸別ファイルには書いていません：工事フォルダが選ばれていないか、…書く許可が出ていません」でない → ' + r);
    ok(!/個別JSON|未リンク/.test(r), '★③知らせに「個別JSON」「未リンク」が残っている → ' + r);
    await ctx.close();
  }

  /* ---------- ④ 受付台帳「この2つは何がちがうの？」 ---------- */
  if(want('④')){
    const { ctx, page } = await openPage(b);
    const r = await page.evaluate(() => {
      const box = document.createElement('div'); box.innerHTML = lgSaveStateHtml();
      const h = box.querySelector('details.uc-hint');
      return h ? h.textContent.replace(/\s+/g, ' ') : '';
    });
    console.log('④この2つは何がちがうの', r.slice(0, 400));
    ok(/「💾 戸別ファイルへ反映」を押すと入ります/.test(r) && /名前・住所・電話・工事日程予定・状態・備考は、その戸別を開いて「💾 物件に保存」を押しても入ります/.test(r), '★④② 名前などは「💾 物件に保存」でも入る、と言わない → ' + r);
    ok(/打合せ・保留・ビラ・同意書・完了書と、暗号をかけた戸別の名前・住所・電話は「💾 戸別ファイルへ反映」で/.test(r), '★④② 打合せ・保留・ビラ・同意書・完了書は「💾 物件に保存」では入らない、と言わない → ' + r);
    ok(!/押したときだけ/.test(r), '★④「💾 戸別ファイルへ反映」を押したときだけ、と本当でないことを言う → ' + r);
    await ctx.close();
  }

  /* ---------- ⑤ 画面に出る字にプログラムの言葉・古いボタンの名前が残っていない ---------- */
  if(want('⑤')){
    const src = fs.readFileSync(HTML_PATH, 'utf8');
    /* 画面に出る字＝文字列（"…"・'…'）と HTML の title・ボタンの字。console に出すだけの「[…] …」は除く */
    const lits = [];
    for(const m of src.matchAll(/"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/g)){
      const t = m[1] != null ? m[1] : m[2];
      if(!t || /^\[/.test(t)) continue;
      lits.push(t);
    }
    const BAD = [/個別JSON/, /共有物件JSON/, /保存済のJSON/, /書込み権限付き/, /IndexedDB(?!の取引| open failed)/, /\(localStorage/, /（localStorage/,
                 /工事フォルダ未リンク/, /一括復号/, /一括平文化/, /一括再保存/, /📷 写真を読み直す/, /「保存」で名前を付けて保存/,
                 /物件ファイルに上書き保存しました/, /端末内には保存しましたが/];
    const hits = [];
    for(const re of BAD) for(const t of lits) if(re.test(t)) { hits.push(String(re) + ' ← ' + t.slice(0, 90)); break; }
    console.log('⑤残っている言葉', hits.length, J(hits).slice(0, 600));
    ok(hits.length === 0, '★⑤画面に出る字に、プログラムの言葉・古いボタンの名前が残っている → ' + J(hits));
  }

  /* ---------- ⑥ 写真の取り込み・軽量化のあとの案内 ---------- */
  if(want('⑥')){
    const { ctx, page } = await openPage(b);
    const r = await page.evaluate(() => {
      const none = saveHintForScreen();
      _loadedOrigin = { file: 'C:/工事/2612UI0001.json', fileType: 'plain', fileHandle: {} };
      const file = saveHintForScreen();
      _loadedOrigin = null; try{ updateOverwriteSaveBtn(); }catch(_){}
      return { none, file };
    });
    console.log('⑥案内', J(r));
    ok(/つながっていません/.test(r.none) && /「📄 名前を付けて保存」/.test(r.none) && !/「💾 上書き保存」を押すと/.test(r.none),
       '★⑥戸別ファイルとつながっていない画面で、押せない「💾 上書き保存」で入ると言った → ' + r.none);
    ok(/画面の上の「💾 上書き保存」を押すと、戸別ファイル（管理番号\.json）に入ります/.test(r.file), '★⑥📁 の戸別で「💾 上書き保存」を案内しない → ' + r.file);
    await ctx.close();
  }

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版181（メイン・保存まわりの言葉）');
})().catch(e => { console.log('FAIL（止まった）', e && e.stack || e); process.exit(1); });
