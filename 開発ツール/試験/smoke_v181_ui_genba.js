/* 版181（現場入力）：保存まわりの言葉と見た目の整理（利用者と決めたこと）
     ① 見るだけの帯（スマホ）：「📚 ファイルをまとめて読み込んで、この戸別を探す」・すぐ下に一行の説明・
        📮 と「このまま新しく入力する」は閉じた「困ったとき」の中（ふだんのボタンには並べない）
     ② 見るだけの帯（PC）：📁・📂 がふだんのボタン、📮 と「このまま新しく入力する」は「困ったとき」の中
     ③ 履歴・読込の窓：「📚 ファイルをまとめて読み込んで、管理番号で探す」・📮 は閉じた「困ったとき」の中
     ④ 保存が止まったときの窓：📮 は閉じた「困ったとき（どうしても保存できない）」の中。📮 のあとの「📤 共有でも渡す」はそのまま
     ⑤ 受付台帳の絞り込み：「🔍 絞り込みを外して、すべて表示（N件）」は小さい白地のボタン（幅いっぱいの色付きにしない）・押してもファイル・下書きは書かない
     ⑥ 受付台帳の「💾 まだ保存していない N件 をまとめて保存」・すぐ下の一行（読み合わせてから書く）・
        「全部保存し直す」はふだん閉じた中
     ⑦ まとめて保存の確かめの窓：【変わること】【変わらないこと】【保存する戸別】【気をつけること】に分ける・
        ほかの端末の戸別で「上書きすると…写真などはファイルから消えます」と言わない（フォルダの道は読み合わせる）
     ⑧ 幅320px：①③⑤⑥ を「困ったとき」「全部保存し直す」を開いた形で出しても、横にはみ出さない
   使い方: node smoke_v181_ui_genba.js [index.html の file:// URL]　（ONLY=①,⑤ で場面を絞れる） */
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
const HTML = process.argv[2] ? (/^(file|https?):/i.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2])) : FILE('antenna_genba');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const J = o => JSON.stringify(o);

const SETUP = `
  window.__asked = []; window.__alerts = []; window.__answer = false;
  uiConfirm = async m => { window.__asked.push(String(m)); return window.__answer; };
  uiAlert   = async m => { window.__alerts.push(String(m)); return true; };
  window.__sleep = ms => new Promise(r => setTimeout(r, ms));
  window.__clearDrafts = async () => { try{ for(const r of (await idbGetAll())||[]) if(r && r.key) await idbDel(r.key); }catch(_){} };
  window.__ledger = () => ({ rows:[
      { mgmt_no:'U0001', name:'あ様', addr:'○市1-1', date:'2026-10-20', status:'in_progress', photos:5, has_dwg:true, contractor:'A社' },
      { mgmt_no:'U0002', name:'い様', addr:'○市1-2', date:'2026-10-21', status:'in_progress', photos:0, contractor:'A社' },
      { mgmt_no:'U0003', name:'う様', addr:'○市1-3', date:'2026-10-22', status:'in_progress', photos:0, contractor:'B社' },
      { mgmt_no:'U0004', name:'え様', addr:'○市1-4', date:'2026-10-23', status:'in_progress', photos:0, contractor:'B社' } ],
    project:'試験（その１）', exportedAt:new Date().toISOString(), appVersion:'181' });
  /* 横にはみ出していないか */
  window.__over = () => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth });
`;

async function openPage(b, label, vp){
  const ctx = await b.newContext({ viewport: vp || { width: 390, height: 820 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text(); if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.goto(HTML); await page.waitForTimeout(2200);
  await page.evaluate(SETUP);
  return { ctx, page, errs };
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  /* ---------- ① 見るだけの帯（スマホ） ---------- */
  if(want('①')){
    const { ctx, page, errs } = await openPage(b, '①');
    const r = await page.evaluate(() => {
      const keep = window.showDirectoryPicker;
      try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
      M = freshModel(); M.chosho_mgmt_no = 'U0001'; M._viewOnly = true;
      renderPcGuard();
      const g = document.getElementById('pcguard');
      const main = Array.from(g.querySelectorAll(':scope > .pcg-btns button')).map(x => x.id);
      const tr = g.querySelector('details.pcg-trouble');
      const inTr = tr ? Array.from(tr.querySelectorAll('button')).map(x => x.id) : [];
      const load = document.getElementById('pcg-load');
      const sub = load && load.nextElementSibling && load.nextElementSibling.classList.contains('pcg-sub') ? load.nextElementSibling.textContent : '';
      const o = { main, inTr, open: !!(tr && tr.open), summary: tr ? tr.querySelector('summary').textContent : '',
                  load: load ? load.textContent : '', sub, text: g.textContent };
      window.showDirectoryPicker = keep;
      return o;
    });
    console.log('①帯（スマホ）', J(r).slice(0, 600));
    ok(r.load === '📚 ファイルをまとめて読み込んで、この戸別を探す', '★①📚 の字が決めた字でない → ' + r.load);
    ok(/すべて選択/.test(r.sub) && /探して/.test(r.sub) && /押すと開きます/.test(r.sub), '★①📚 のすぐ下に、何が起きるかの一行が無い → ' + r.sub);
    ok(r.main[0] === 'pcg-load' && r.main.indexOf('pcg-side') < 0 && r.main.indexOf('pcg-force') < 0, '★①📮・このまま新しく入力する がふだんのボタンに並んでいる → ' + J(r.main));
    ok(r.inTr.indexOf('pcg-side') >= 0 && r.inTr.indexOf('pcg-force') >= 0, '★①「困ったとき」に 📮・このまま新しく入力する が無い → ' + J(r.inTr));
    ok(r.open === false && /困ったとき/.test(r.summary), '★①「困ったとき」がはじめから開いている → ' + J([r.open, r.summary]));
    ok(!/入力して事務所に預ける/.test(r.text) && /別のファイルで送る/.test(r.text), '★①📮 の字が分かりにくいまま（入力して事務所に預ける）→ ' + r.text.slice(0, 300));
    ok(errs.length === 0, '★①画面でエラー → ' + errs.slice(0, 3).join(' / '));
    await ctx.close();
  }

  /* ---------- ② 見るだけの帯（PC） ---------- */
  if(want('②')){
    const { ctx, page } = await openPage(b, '②');
    const r = await page.evaluate(() => {
      M = freshModel(); M.chosho_mgmt_no = 'U0001'; M._viewOnly = true;
      renderPcGuard();
      const g = document.getElementById('pcguard');
      const main = Array.from(g.querySelectorAll(':scope > .pcg-btns button')).map(x => x.id);
      const tr = g.querySelector('details.pcg-trouble');
      return { main, inTr: tr ? Array.from(tr.querySelectorAll('button')).map(x => x.id) : [], open: !!(tr && tr.open) };
    });
    console.log('②帯（PC）', J(r));
    ok(r.main.join(',') === 'pcg-dir,pcg-load', '★②PCのふだんのボタンが 📁・📂 でない → ' + J(r.main));
    ok(r.inTr.join(',') === 'pcg-side,pcg-force' && r.open === false, '★②PCの「困ったとき」の中身が違う・開いている → ' + J(r));
    await ctx.close();
  }

  /* ---------- ③ 履歴・読込の窓 ---------- */
  if(want('③')){
    const { ctx, page } = await openPage(b, '③');
    const r = await page.evaluate(async () => {
      await __clearDrafts();
      M = freshModel(); M.chosho_mgmt_no = 'U0002'; M.chosho_note = 'x'; M._touched = true; await persistDraft();
      await openDraftModal(); await __sleep(400);
      const info = (document.querySelector('#draft-modal .info') || {}).textContent || '';
      const imp = (document.getElementById('btn-import') || {}).textContent || '';
      const sb = document.getElementById('d-sidesel');
      const tr = sb && sb.closest('details');
      return { info, imp, inTr: !!(tr && tr.classList.contains('d-trouble')), open: !!(tr && tr.open),
               trText: tr ? tr.textContent : '' };
    });
    console.log('③履歴の窓', J(r).slice(0, 500));
    ok(r.imp === '📚 ファイルをまとめて読み込んで、管理番号で探す', '★③履歴の 📚 の字が帯とそろっていない → ' + r.imp);
    ok(!/📮 選んで事務所に預ける＝/.test(r.info), '★③履歴の説明の先頭に 📮 の説明が出ている（ふだんの人は使わない）→ ' + r.info.slice(0, 200));
    ok(r.inTr && r.open === false && /別の名前のファイル/.test(r.trText), '★③📮 選んで事務所に預ける が閉じた「困ったとき」の中に無い → ' + J(r));
    await ctx.close();
  }

  /* ---------- ④ 保存が止まったときの窓 ---------- */
  if(want('④')){
    const { ctx, page } = await openPage(b, '④');
    const r = await page.evaluate(async () => {
      const out = {};
      saveOverlayShow(''); saveOverlayDone({ title: '保存していません', msg: '読み返しが合いませんでした', warn: true, escape: 'verify' });
      let s = document.getElementById('save-ov-side'), d = s && s.closest('details');
      out.stop = { btn: !!s, inTr: !!(d && d.classList.contains('save-ov-trouble')), open: !!(d && d.open),
                   sum: d ? d.querySelector('summary').textContent : '' };
      saveOverlayHide();
      saveOverlayShow(''); saveOverlayDone({ title: '📮 事務所に預けました', msg: 'x', escape: 'share-also', stay: true });
      s = document.getElementById('save-ov-side'); d = s && s.closest('details');
      out.also = { btn: s ? s.textContent : '', inTr: !!d };
      saveOverlayHide();
      return out;
    });
    console.log('④保存の窓', J(r));
    ok(r.stop.btn && r.stop.inTr && r.stop.open === false && /困ったとき/.test(r.stop.sum), '★④保存が止まったときの 📮 が、閉じた「困ったとき」の中に無い → ' + J(r.stop));
    ok(/共有でも渡す/.test(r.also.btn) && r.also.inTr === false, '★④📮 のあとの「📤 共有でも渡す」までしまっている → ' + J(r.also));
    await ctx.close();
  }

  /* ---------- ⑤ 受付台帳の絞り込み「すべて表示」 ---------- */
  if(want('⑤')){
    const { ctx, page } = await openPage(b, '⑤');
    const r = await page.evaluate(async () => {
      await __clearDrafts();
      receptionSaveRows(__ledger());
      openReceptionModal(); await __sleep(300);
      rcCtrSet('A社'); renderReceptionCtr(); receptionRerender(); await __sleep(300);
      const btn = document.getElementById('rc-showall');
      const host = document.getElementById('reception-list');
      const cs = btn ? getComputedStyle(btn) : null;
      const o = { txt: btn ? btn.textContent : '', w: btn ? btn.getBoundingClientRect().width : 0,
                  hw: host ? host.getBoundingClientRect().width : 0,
                  bg: cs ? cs.backgroundColor : '', rows0: host.querySelectorAll('.draft').length };
      let puts = 0; const oPut = idbPut; idbPut = async (...a) => { puts++; return oPut(...a); };
      if(btn) btn.click(); await __sleep(300);
      idbPut = oPut;
      o.after = { ctr: _rcCtr, flt: _rcFilter, rows: host.querySelectorAll('.draft').length, puts };
      return o;
    });
    console.log('⑤すべて表示', J(r));
    ok(/^🔍 絞り込みを外して、すべて表示（4件）$/.test(r.txt), '★⑤「すべて出す」の字のまま（何をどこへ出すか分からない）→ ' + r.txt);
    ok(r.w > 0 && r.w < r.hw * 0.9, '★⑤「すべて表示」が幅いっぱいの大きいボタン（大げさに見える）→ ' + J([r.w, r.hw]));
    ok(/255, 255, 255/.test(r.bg), '★⑤「すべて表示」が色付きの塗りつぶし（保存のボタンと同じ重さに見える）→ ' + r.bg);
    ok(r.after.ctr === 'all' && r.after.flt === 'all' && r.after.rows > r.rows0 && r.after.puts === 0,
       '★⑤押しても絞り込みが外れない・下書きを書いた → ' + J([r.rows0, r.after]));
    await ctx.close();
  }

  /* ---------- ⑥ まとめて保存の帯・全部保存し直す ---------- */
  if(want('⑥')){
    const { ctx, page } = await openPage(b, '⑥');
    const r = await page.evaluate(async () => {
      await __clearDrafts();
      receptionSaveRows(__ledger());
      const rows = getReceptionRows();
      await openFromReception(rows[1]); await __sleep(400);
      M.cable_main_len = '27'; M._touched = true; await persistDraft();
      await refreshDraftInfo(true);
      openReceptionModal(); await __sleep(300);
      rcCtrSet('all'); receptionRerender(); await __sleep(300);
      const sv = document.getElementById('rc-saveall');
      const sub = document.querySelector('.rc-warn .rc-warn-sub');
      const redo = document.querySelector('details.rc-redo');
      const s2 = document.getElementById('rc-saveall2');
      return { sv: sv ? sv.textContent : '', lab: sv ? sv.dataset.label : '', sub: sub ? sub.textContent : '',
               warn: (document.querySelector('.rc-warn') || {}).textContent || '',
               redo: !!redo, open: !!(redo && redo.open), sum: redo ? redo.querySelector('summary').textContent : '',
               s2: s2 ? s2.textContent : '', s2in: !!(s2 && redo && redo.contains(s2)) };
    });
    console.log('⑥まとめて保存の帯', J(r).slice(0, 700));
    ok(/^💾 まだ保存していない 1件 をまとめて保存$/.test(r.sv) && r.lab === r.sv, '★⑥まとめて保存のボタンの字が決めた字でない → ' + J([r.sv, r.lab]));
    ok(/読み合わせてから書きます/.test(r.sub) && /PCの写真は消しません/.test(r.sub), '★⑥まとめて保存のすぐ下に、押すと何が起きるかの一行が無い → ' + r.sub);
    ok(!/写真以外の入力はPCへ渡りません/.test(r.warn), '★⑥「写真以外の入力はPCへ渡りません」（本当でない）と言う → ' + r.warn);
    ok(r.redo && r.open === false && /ファイルが無い/.test(r.sum) && /0KB/.test(r.sum), '★⑥「全部保存し直す」がふだん閉じていない・見出しで使いどころが分からない → ' + J([r.redo, r.open, r.sum]));
    ok(/全部保存し直す/.test(r.s2) && /時間がかかります/.test(r.s2) && r.s2in, '★⑥「全部保存し直す」のボタンが閉じた中に無い・重いと言わない → ' + J([r.s2, r.s2in]));
    await ctx.close();
  }

  /* ---------- ⑦ まとめて保存の確かめの窓 ---------- */
  if(want('⑦')){
    const { ctx, page } = await openPage(b, '⑦');
    const r = await page.evaluate(async () => {
      await __clearDrafts();
      receptionSaveRows(__ledger());
      const rows = getReceptionRows();
      await openFromReception(rows[2]); await __sleep(400);
      M.cable_main_len = '27'; M._touched = true; M._otherFile = 'ほかの端末'; await persistDraft();
      await refreshDraftInfo(true);
      window.__asked = []; window.__answer = false;      // 確かめの窓で「いいえ」（何も書かない）
      await saveAllDrafts('unsaved');
      return { said: window.__asked[0] || '' };
    });
    console.log('⑦確かめの窓', r.said.slice(0, 600));
    ok(/^1件をまとめて保存します。/.test(r.said), '★⑦確かめの窓の頭が違う → ' + r.said.slice(0, 80));
    ['【変わること】', '【変わらないこと】', '【保存する戸別】', '【気をつけること】'].forEach(h =>
      ok(r.said.indexOf(h) >= 0, '★⑦確かめの窓に ' + h + ' が無い（何がどう変わるか読み取れない）→ ' + r.said.slice(0, 300)));
    ok(r.said.indexOf('【変わること】') < r.said.indexOf('【変わらないこと】') && r.said.indexOf('【変わらないこと】') < r.said.indexOf('【保存する戸別】'),
       '★⑦確かめの窓の並びが違う');
    ok(/読み合わせ/.test(r.said) && /PCの写真は消えません/.test(r.said), '★⑦フォルダの道なのに、読み合わせて写真が消えないことを言わない');
    ok(!/その端末で撮った写真などはファイルから消えます/.test(r.said) && /ほかの端末も保存している戸別/.test(r.said),
       '★⑦ほかの端末の戸別で「写真などはファイルから消えます」（本当でない）と言う → ' + r.said);
    await ctx.close();
  }

  /* ---------- ⑧ 幅320px ---------- */
  if(want('⑧')){
    const { ctx, page } = await openPage(b, '⑧', { width: 320, height: 640 });
    const r = await page.evaluate(async () => {
      const out = {};
      const keep = window.showDirectoryPicker;
      try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
      M = freshModel(); M.chosho_mgmt_no = 'R8MISAWAKITA2612MKM0130001APT0203BLDGSOUTHWING'; M._viewOnly = true;
      renderPcGuard();
      const tr = document.querySelector('#pcguard details.pcg-trouble'); if(tr) tr.open = true; await __sleep(150);
      out.band = __over();
      window.showDirectoryPicker = keep;
      await __clearDrafts();
      receptionSaveRows(__ledger());
      const rows = getReceptionRows();
      await openFromReception(rows[1]); await __sleep(400);
      M.cable_main_len = '27'; M._touched = true; await persistDraft(); await refreshDraftInfo(true);
      openReceptionModal(); await __sleep(300);
      rcCtrSet('A社'); receptionRerender(); await __sleep(300);
      const rd = document.querySelector('details.rc-redo'); if(rd) rd.open = true; await __sleep(150);
      out.ledger = __over();
      const btns = ['rc-showall', 'rc-saveall', 'rc-saveall2'].map(id => { const e = document.getElementById(id); const q = e && e.getBoundingClientRect(); return q ? [id, Math.round(q.left), Math.round(q.right)] : [id, null]; });
      out.btns = btns;
      document.getElementById('reception-modal').classList.remove('open');
      await openDraftModal(); await __sleep(400);
      const dt = document.querySelector('#draft-list details.d-trouble'); if(dt) dt.open = true; await __sleep(150);
      out.drafts = __over();
      return out;
    });
    console.log('⑧幅320', J(r));
    ok(r.band.sw <= r.band.iw, '★⑧見るだけの帯（困ったときを開いた形）が横にはみ出した → ' + J(r.band));
    ok(r.ledger.sw <= r.ledger.iw && r.btns.every(x => x[1] === null || (x[1] >= 0 && x[2] <= 320)), '★⑧受付台帳の帯のボタンが横にはみ出した → ' + J([r.ledger, r.btns]));
    ok(r.drafts.sw <= r.drafts.iw, '★⑧履歴の窓（困ったときを開いた形）が横にはみ出した → ' + J(r.drafts));
    await ctx.close();
  }

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版181（現場入力・保存まわりの言葉と見た目）');
})().catch(e => { console.log('FAIL（止まった）', e && e.stack || e); process.exit(1); });
