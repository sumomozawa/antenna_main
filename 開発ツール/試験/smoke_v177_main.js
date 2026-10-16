/* 版177（メイン）: アンテナ取付ガイドの「柱」のチェックに「CATV支給柱建柱で使用」を足した。
   市で支給された柱を建てて、それにアンテナを取り付ける。柱の長さは 7m／8m／9m から選ぶ。
   積算は 材料費＝根枷＋底キャップ 6,530円（長さによらない）、労務費＝7m 17,700円／8m 20,000円／9m 22,400円。
   保存は長さごとのキー（catvSup7／catvSup8／catvSup9）の true（1つだけ）。画面ではチェック1つ＋長さの選択1つ。
     ⓪ 前提：版番号がファイルと同じ・単価マスターの3行（材料 6,530・労務 17,700／20,000／22,400・本・屋外金物(支持)）・
        ガイドの行の名前 → 単価マスターの対応表。今までの3つ（ポール新設・CATV柱既存・CATV柱移設）の単価は今までどおり
     ① 画面：今までの3つは 版176 と1文字も同じ形で出る。そのあとに枠が1つ（チェック・「CATV支給柱建柱で使用」・
        長さの選択 7m／8m／9m・既定 7m・チェックなし・説明「市で支給された柱を…」）。選択はチェックの label の外。
        柱でないパターン（破風・屋根馬）には出ない
     ② 押す：チェック → 7m の行が1つ（材料 +6,530・労務 +17,700）・積算表は ■ 屋外金物(支持) の下・合計の欄も同じ額。
        長さを 8m／9m に替える → 行が移る（2つの長さが同時に入らない）。外す → 行が無くなる。
        外したまま長さを替えても計上しない。そのあとチェック → 選んでおいた長さで入る。字を押しても切り替わる。
        長さの選択を押しただけではチェックは変わらない。リセットで外れる。
        開いたばかりの 9m の戸別で外す → 長さは 9m のまま（メイン。現場入力は作り直すので 7m に戻るが、外した柱は計上しない）。
        キーボード：長さの選択で ↓ を2回 → 8m → 9m まで行ける（描き直しても押していた欄に戻る）。チェックをスペースで押しても同じ
     ③ 保存データからの積算（buildBOMForData）：長さごとに行が1つ・金額が1回だけ。保存データに2つの長さが true でも行は1つ
        （先の方＝短い方）。柱でないパターンでは乗らない。今までの3つの行（鍵・数量・金額・分類・単位・品名・摘要）は 版176 と同じ
     ④ 費用・協力会社・内訳書（明細）・物件の印刷・発注材料・工事調書：材料 6,530 と労務がそれぞれ1回だけ入る。
        持出材料にチェックすると 6,530 が持出材料に入る。協力会社は標準単価（物件の単価変更は効かない）
     ⑤ アパート：代表（1世帯目）にだけ乗る（2世帯目以降は乗らない＝今までの柱の行と同じ決まり）。編集画面でも同じ
     ⑥ 開く・保存の往復：開くと選んだ長さで出る・保存（collectState）→ 開き直しで同じ長さ・戸別ファイルの中身にも入る。
        別の戸別（ガイド無し・古い柱だけ）を開くと前の長さを持ち越さない（7m・チェックなしに戻る）。
        2つの長さが true の古い／壊れた保存データでも、画面に出る長さと積算の行は同じ1つ
     ⑦ 完了は金額で決めない：柱の金額が乗っていても、受付台帳の「完了」・現場の工事完了が無ければ完了にしない
     ⑧ 閲覧用（antenna_viewer）：メインから作り直してある（ビューア生成.py --check）・同じ選択肢と単価を持ち、開くと長さが出る。
        閲覧用ではキーボード（↓・文字）でも長さの選択が替わらない（画面が積算と食い違わない）。Tab で欄を移るのはできる
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書きを持ち越さない。
   使い方: node smoke_v177_main.js [メイン index.html の file:// URL]　（ONLY=②,⑤ で場面を絞れる）
     （変異試験は壊した写しをここに渡す。⑧のビューア生成の確かめは、いつもの置き場所のメインとビューアを見る。
       VIEWER=ビューアの場所・VIEWER_BLOCK=viewer-block.html の場所 を付けると、そちらを見る＝閲覧用の部分の変異試験） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url'), cp = require('child_process');
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
const MAIN = asUrl(process.argv[2] || path.join(ROOT, 'antenna_main', 'index.html'));
const MAIN_PATH = asPath(MAIN);
const REAL_MAIN = path.join(ROOT, 'antenna_main', 'index.html');
const VIEWER_PATH = process.env.VIEWER || path.join(ROOT, 'antenna_viewer', 'index.html');
const VIEWER_BLOCK = process.env.VIEWER_BLOCK || path.join(ROOT, 'antenna_main', '開発ツール', 'viewer-block.html');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* 場面を絞る（変異試験を速くするため）: ONLY=②,⑤ のように付けると、その記号で始まる場面だけ走らせる */
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

/* 版176 の今までの3つ（画面の形）。チェックしたものには class="on" が付く */
const OLD3 = {
  poleNew:  ['ｶﾗｰM63ﾎﾟｰﾙ（XDDC1263MKA）を新設で計上します。', 'ポール新設'],
  catvKeep: ['既存のCATV柱を、いまの位置のまま使います。', 'CATV柱既存の位置で使用'],
  catvMove: ['既存のCATV柱を移設して使います。', 'CATV柱移設して使用']
};
const oldHtml = on => Object.keys(OLD3).map(k => '<label' + ((on || []).indexOf(k) >= 0 ? ' class="on"' : '') + ' title="' + OLD3[k][0]
  + '"><input type="checkbox" data-opt="' + k + '">' + OLD3[k][1] + '</label>').join('');
/* 版176 の今までの3つの積算の行（id|key|数量|材料|労務|分類|単位|品名|摘要|型番|図の字） */
const OLD_ROWS = {
  poleNew:  'pole_m63|pole_m63|guide:ポール新設|1|30000|17700|support|本|ｶﾗｰM63ﾎﾟｰﾙ|取付ガイド（ポール新設）|XDDC1263MKA|M63ポール',
  catvKeep: 'catv_pole_keep|catv_pole_keep|guide:CATV柱既存の位置で使用|1|0|0|misc|式|CATV柱既存の位置で使用|取付ガイド（CATV柱既存の位置で使用）||CATV柱(既存)',
  catvMove: 'catv_pole_move|catv_pole_move|guide:CATV柱移設して使用|1|0|26500|misc|式|CATV柱移設して使用|取付ガイド（CATV柱移設して使用）||CATV柱(移設)'
};
/* 新しい柱（長さ → キー・単価マスターのID・労務費） */
const SUP = [
  { len: '7m', key: 'catvSup7', id: 'catv_pole_sup7', lab: 17700 },
  { len: '8m', key: 'catvSup8', id: 'catv_pole_sup8', lab: 20000 },
  { len: '9m', key: 'catvSup9', id: 'catv_pole_sup9', lab: 22400 }
];
const MAT = 6530;
const supRow = s => s.id + '|' + s.id + '|guide:CATV支給柱建柱（' + s.len + '）で使用|1|6530|' + s.lab + '|support|本|CATV支給柱建柱 ' + s.len
  + '（根枷・底キャップ）|取付ガイド（CATV支給柱建柱（' + s.len + '）で使用）||CATV支給柱(' + s.len + ')';
const TIP = '市で支給された柱を建てて、それにアンテナを取り付けます。';

/* ページの中で使う道具 */
const SETUP = `
  window.__sig = r => [r.id, r.key, r.qty, r.material_cost, r.labor_cost, r.category, r.unit, r.name, r.note, r.model, r.diagram_label].join('|');
  window.__G = (opts, pattern) => ({ ver: 1, pattern: pattern || 'pole', parts: {}, options: Object.assign({}, opts || {}) });
  /* 戸別を開く（受付台帳・一覧は閉じて、取付ガイドの欄を開いておく） */
  window.__open = (guide, extra) => {
    try { closeMenuView(); } catch(_){}
    try { closeListView(); } catch(_){}
    const s = blankCaseState(); Object.assign(s, extra || {}); s.antenna_guide = guide === undefined ? null : guide;
    applyStateData(s);
    const pn = document.getElementById('ag-guide-panel'); if(pn) pn.open = true;
  };
  window.__guideRows = () => (STATE.bom || []).filter(r => r.src === 'guide').map(__sig);
  window.__supRows = bom => (bom || STATE.bom || []).filter(r => /^catv_pole_sup/.test(r.id)).map(__sig);
  window.__tot = bom => { const t = calcTotals(bom || STATE.bom, 'excl', 'exclude'); return { mat: t.mat, lab: t.lab }; };
  window.__on = () => Object.keys((STATE.antennaGuide || {}).options || {}).filter(k => STATE.antennaGuide.options[k]).sort().join(',');
  window.__ui = () => {
    const host = document.getElementById('ag-host-edit');
    const box = host && host.querySelector('.apw-opts');
    const g = box && box.querySelectorAll('.apw-optgrp');
    const g0 = g && g[0], sel = g0 && g0.querySelector('select'), cb = g0 && g0.querySelector('input[data-opt-group]');
    const lb = g0 && g0.querySelector('label');
    return {
      oldHtml: box ? Array.from(box.querySelectorAll(':scope > label')).map(l => l.outerHTML).join('') : null,
      oldChecked: box ? Array.from(box.querySelectorAll(':scope > label > input')).filter(i => i.checked).map(i => i.getAttribute('data-opt')).join(',') : null,
      order: box ? Array.from(box.children).map(e => e.tagName + (e.classList.contains('apw-optgrp') ? '.grp' : '')).join(',') : null,
      nGrp: g ? g.length : 0,
      grp: g0 ? { on: g0.classList.contains('on'), cb: !!(cb && cb.checked), txt: lb ? lb.textContent : null, title: g0.title,
                  sel: sel ? sel.value : null, opts: sel ? Array.from(sel.options).map(o => o.value + ':' + o.textContent).join('/') : null,
                  selInLabel: !!(sel && sel.closest('label')), cbInLabel: !!(cb && cb.closest('label') === lb) } : null,
      table: host ? Array.from(host.querySelectorAll('.apw-bom-body tr')).map(tr => tr.textContent).filter(t => /柱/.test(t)) : []
    };
  };
  /* 積算表（#estimate-body）：新しい柱の行と、その上の分類の見出し */
  window.__est = () => {
    const out = []; let head = '';
    document.querySelectorAll('#estimate-body tr').forEach(tr => {
      if(tr.classList.contains('category-head')){ head = tr.textContent.trim(); return; }
      const nm = tr.querySelector('td.name');
      if(nm && /CATV支給柱建柱/.test(nm.textContent)){
        const td = Array.from(tr.children).map(t => t.textContent.trim());
        out.push([head, td[0], (tr.querySelector('.qty-input') || {}).value, td[3], td[4], td[5], td[6]].join('|'));
      }
    });
    return out;
  };
  /* 合計の欄（#totals）の材料費合計・労務費合計 */
  window.__totDom = () => {
    const o = {};
    document.querySelectorAll('#totals .total-row').forEach(r => { const s = r.querySelectorAll('span'); if(s.length >= 2) o[s[0].textContent.trim()] = s[1].textContent.trim(); });
    return [o['材料費合計'], o['労務費合計']].join('|');
  };
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
async function openPage(target, label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t.slice(0, 300)); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(target);
  return { ctx, page };
}
async function openMain(label, target){
  const o = await openPage(target || MAIN, label);
  await o.page.waitForFunction(() => typeof applyStateData === 'function' && typeof agWidget !== 'undefined' && !!agWidget
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2000);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await o.page.evaluate(SETUP);
  return o;
}
/* ページの中で走らせる。止まったら { error } を返す（版176 のように欄が無いときも、場面ごとに赤にする） */
async function run(page, fn, arg){
  try { return await page.evaluate(fn, arg); }
  catch(e){ return { error: String((e && e.message) || e).slice(0, 400) }; }
}
/* 画面を押す。無ければ false（待ち続けない） */
async function click(page, sel){
  try { await page.click(sel, { timeout: 3000 }); return true; } catch(_){ return false; }
}
async function pick(page, sel, v){
  try { await page.selectOption(sel, v, { timeout: 3000 }); return true; } catch(_){ return false; }
}
const short = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
const brief = o => JSON.stringify(o === undefined ? null : o).slice(0, 300);
const CB = '#ag-host-edit [data-opt-group="catvSup"]', SEL = '#ag-host-edit [data-opt-len="catvSup"]';

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  if(want('⓪')){
    const { ctx, page } = await openMain('⓪');
    const r = await run(page, () => {
      const P = (src, k) => { const p = src[k]; return p ? [p.name, p.category, p.model, p.material_cost, p.labor_cost, p.unit, p.diagram_label].join('|') : null; };
      const ids = ['catv_pole_sup7', 'catv_pole_sup8', 'catv_pole_sup9', 'pole_m63', 'catv_pole_keep', 'catv_pole_move'];
      const rowsOf = k => renderAntennaGuideBomRows({ ver: 1, pattern: 'pole', parts: {}, options: { [k]: true } })
        .filter(x => x.kind === '柱').map(x => x.product + ':' + x.qty + x.unit + '→' + (AG_POLE_PARTS_ID[x.product] || '(無し)'));
      return { ver: APP_VERSION, def: ids.map(k => P(DEFAULT_PARTS, k)), cur: ids.map(k => P(PARTS, k)),
               map: Object.keys(AG_POLE_PARTS_ID).map(k => k + '=' + AG_POLE_PARTS_ID[k]),
               rows: ['poleNew', 'catvKeep', 'catvMove', 'catvSup7', 'catvSup8', 'catvSup9'].map(rowsOf),
               cat: CATEGORY_LABEL.support };
    });
    console.log('⓪前提', brief(r));
    ok(!r.error, '⓪止まった → ' + r.error);
    if(!r.error){
      ok(!!WANT_VER && r.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r.ver + ' ／ ファイル ' + WANT_VER);
      const want0 = [
        'CATV支給柱建柱 7m（根枷・底キャップ）|support||6530|17700|本|CATV支給柱(7m)',
        'CATV支給柱建柱 8m（根枷・底キャップ）|support||6530|20000|本|CATV支給柱(8m)',
        'CATV支給柱建柱 9m（根枷・底キャップ）|support||6530|22400|本|CATV支給柱(9m)',
        'ｶﾗｰM63ﾎﾟｰﾙ|support|XDDC1263MKA|30000|17700|本|M63ポール',
        'CATV柱既存の位置で使用|misc||0|0|式|CATV柱(既存)',
        'CATV柱移設して使用|misc||0|26500|式|CATV柱(移設)' ];
      ok(JSON.stringify(r.def.slice(0, 3)) === JSON.stringify(want0.slice(0, 3)),
         '★単価マスター（標準単価）の CATV支給柱建柱 の行が違う（材料 6,530・労務 17,700／20,000／22,400・本・屋外金物(支持)） → ' + short(r.def.slice(0, 3)));
      ok(JSON.stringify(r.cur.slice(0, 3)) === JSON.stringify(want0.slice(0, 3)), '★いまの単価マスター（PARTS）に CATV支給柱建柱 が無い／違う → ' + short(r.cur.slice(0, 3)));
      ok(JSON.stringify(r.def.slice(3)) === JSON.stringify(want0.slice(3)) && JSON.stringify(r.cur.slice(3)) === JSON.stringify(want0.slice(3)),
         '★今までの柱（ポール新設・CATV柱既存・CATV柱移設）の単価が変わった → ' + short(r.def.slice(3)));
      ok(r.cat === '屋外金物(支持)', '分類の名前 → ' + r.cat);
      ok(JSON.stringify(r.rows) === JSON.stringify([
           ['ポール新設:1本→pole_m63'], ['CATV柱既存の位置で使用:1式→catv_pole_keep'], ['CATV柱移設して使用:1式→catv_pole_move'],
           ['CATV支給柱建柱（7m）で使用:1本→catv_pole_sup7'], ['CATV支給柱建柱（8m）で使用:1本→catv_pole_sup8'], ['CATV支給柱建柱（9m）で使用:1本→catv_pole_sup9'] ]),
         '★ガイドの柱の行（名前）が単価マスターへつながらない（その長さが積算に乗らない） → ' + short(r.rows));
    }
    await ctx.close();
  }

  // ---- ① 画面：今までの3つはそのまま・新しい枠が1つ ----
  if(want('①')){
    const { ctx, page } = await openMain('①');
    const r = await run(page, () => {
      const out = {};
      __open(__G({})); out.blank = __ui();
      __open(__G({ catvMove: true })); out.move = __ui();
      out.other = ['hafu', 'hafu2', 'gaiheki', 'tatenarabi', 'yaneuma'].map(p => { __open(__G({ catvSup8: true }, p));
        const u = __ui(); return p + ':' + u.nGrp + ':' + (u.oldHtml || '').length + ':' + __supRows().length; });
      return out;
    });
    console.log('①画面', brief(r));
    ok(!r.error, '①止まった → ' + r.error);
    if(!r.error){
      ok(r.blank.oldHtml === oldHtml([]) && r.move.oldHtml === oldHtml(['catvMove']) && r.move.oldChecked === 'catvMove',
         '★今までの3つ（ポール新設・CATV柱既存・CATV柱移設）の見た目が 版176 と違う → ' + short([r.blank.oldHtml, r.move.oldHtml]));
      ok(r.blank.nGrp === 1 && r.blank.order === 'LABEL,LABEL,LABEL,SPAN.grp', '★「CATV支給柱建柱で使用」の枠が1つ（今までの3つの後ろ）に出ない → ' + short(r.blank));
      const g = r.blank.grp || {};
      ok(g.txt === 'CATV支給柱建柱で使用' && g.title === TIP, '★枠の名前・説明が違う → ' + short(g));
      ok(g.opts === 'catvSup7:7m/catvSup8:8m/catvSup9:9m', '★長さの選択肢が 7m／8m／9m でない → ' + short(g.opts));
      ok(g.cb === false && g.on === false && g.sel === 'catvSup7', '★何も選んでいない戸別で、チェックなし・7m になっていない → ' + short(g));
      ok(g.selInLabel === false && g.cbInLabel === true, '★長さの選択がチェックの label の中にある（長さを選ぶとチェックまで切り替わる） → ' + short(g));
      ok(r.other.every(s => /:0:0:0$/.test(s)), '★柱でないパターンに柱の選択が出る／保存データの柱が乗る → ' + short(r.other));
    }
    await ctx.close();
  }

  // ---- ② 押す：チェック・長さ・外す ----
  if(want('②')){
    const { ctx, page } = await openMain('②');
    const st = () => run(page, () => {
      const t = __tot(); return { on: __on(), rows: __supRows(), d: { mat: t.mat - __t0.mat, lab: t.lab - __t0.lab },
        ui: __ui(), est: __est(), dom: __totDom(), want: (x => '¥' + Math.round(x.mat).toLocaleString() + '|¥' + Math.round(x.lab).toLocaleString())(calcTotals(STATE.bom, STATE.input.tax_mode, STATE.input.misc_fee)) };
    });
    // 0円の柱（CATV柱既存）でガイドを有効にしてから測る（有効にすると、欄から出していた金物がガイドの側へ移るため）
    const r0 = await run(page, () => { __open(__G({ catvKeep: true })); window.__t0 = __tot(); return __guideRows(); });
    ok(!r0.error && r0.length === 1 && r0[0] === OLD_ROWS.catvKeep, '②試験の前提: CATV柱既存 だけの戸別 → ' + short(r0));
    const seq = [];
    let okc = await click(page, CB); let r = await st(); seq.push(['7m', okc, r]);
    console.log('②チェック', brief(r));
    ok(okc && !r.error, '★②「CATV支給柱建柱で使用」のチェックが無い／押せない → ' + short(r.error || r));
    if(okc && !r.error){
      const s = SUP[0];
      ok(r.on === 'catvKeep,catvSup7' && r.rows.length === 1 && r.rows[0] === supRow(s), '★チェックしても 7m の行が1つにならない → ' + short([r.on, r.rows]));
      ok(r.d.mat === MAT && r.d.lab === s.lab, '★7m の金額（材料 +6,530・労務 +17,700）が合計に入らない → ' + short(r.d));
      ok(r.ui.grp.cb && r.ui.grp.on && r.ui.grp.sel === 'catvSup7', '★チェックの見た目が入らない → ' + short(r.ui.grp));
      ok(r.est.length === 1 && r.est[0] === '■ 屋外金物(支持)|CATV支給柱建柱 7m（根枷・底キャップ）取付ガイド（CATV支給柱建柱（7m）で使用）|1|本|¥6,530|¥17,700|¥24,230',
         '★積算表に ■ 屋外金物(支持) の下で 7m の行が出ない → ' + short(r.est));
      ok(r.dom === r.want, '★合計の欄（材料費合計・労務費合計）が積算と合わない → ' + r.dom + ' ／ ' + r.want);
      ok(r.ui.table.indexOf('柱CATV支給柱建柱（7m）で使用1本') >= 0, 'ガイドの部材表に 7m の柱が出ない → ' + short(r.ui.table));
    }
    for(const s of [SUP[1], SUP[2], SUP[0], SUP[2]]){
      const okp = await pick(page, SEL, s.key); r = await st();
      console.log('②長さ ' + s.len, brief([r.on, r.rows, r.d]));
      ok(okp && !r.error && r.on === 'catvKeep,' + s.key && r.rows.length === 1 && r.rows[0] === supRow(s) && r.d.mat === MAT && r.d.lab === s.lab
         && r.ui.grp && r.ui.grp.sel === s.key && r.ui.grp.cb && r.dom === r.want,
         '★チェックしたまま長さを ' + s.len + ' に替えても、行・金額が ' + s.len + ' の1つに移らない（2つの長さが入る等） → ' + short(r.error || [r.on, r.rows, r.d, r.ui.grp]));
      if(!r.error && r.est) ok(r.est.length === 1 && r.est[0].indexOf('■ 屋外金物(支持)|CATV支給柱建柱 ' + s.len) === 0, '★積算表の柱の行が ' + s.len + ' にならない → ' + short(r.est));
    }
    okc = await click(page, CB); r = await st();
    console.log('②外す', brief([r.on, r.rows, r.d]));
    ok(okc && !r.error && r.on === 'catvKeep' && r.rows.length === 0 && r.d.mat === 0 && r.d.lab === 0 && r.est.length === 0
       && r.ui.grp && !r.ui.grp.cb && !r.ui.grp.on && r.dom === r.want,
       '★チェックを外しても柱の行・金額が残る → ' + short(r.error || [r.on, r.rows, r.d, r.est]));
    ok(!r.error && r.ui.grp && r.ui.grp.sel === 'catvSup9', '外したら長さの選択が 9m のまま残らない（選び直しが要る） → ' + short(r.ui && r.ui.grp));
    let okp = await pick(page, SEL, 'catvSup8'); r = await st();
    console.log('②外したまま 8m', brief([r.on, r.rows, r.d]));
    ok(okp && !r.error && r.on === 'catvKeep' && r.rows.length === 0 && r.d.lab === 0 && r.ui.grp && !r.ui.grp.cb && r.ui.grp.sel === 'catvSup8',
       '★チェックなしで長さを替えたら計上された／チェックが入った → ' + short(r.error || [r.on, r.rows, r.ui.grp]));
    okc = await click(page, '#ag-host-edit .apw-optgrp label'); r = await st();
    console.log('②字を押す', brief([r.on, r.rows, r.d]));
    ok(okc && !r.error && r.on === 'catvKeep,catvSup8' && r.rows.length === 1 && r.rows[0] === supRow(SUP[1]) && r.d.lab === SUP[1].lab,
       '★先に選んでおいた長さ（8m）でチェックが入らない／字を押しても切り替わらない → ' + short(r.error || [r.on, r.rows]));
    okc = await click(page, SEL); await page.keyboard.press('Escape').catch(()=>{}); r = await st();
    ok(okc && !r.error && r.on === 'catvKeep,catvSup8' && r.ui.grp && r.ui.grp.cb, '★長さの選択を押しただけでチェックが切り替わった → ' + short(r.error || [r.on, r.ui.grp]));
    okc = await click(page, '#ag-host-edit .apw-btns button[data-act="reset"]'); r = await st();
    ok(okc && !r.error && r.on === '' && r.rows.length === 0 && r.ui.grp && !r.ui.grp.cb, '★リセットで柱の選択が外れない → ' + short(r.error || [r.on, r.rows]));
    // 開いたばかりの 9m の戸別で外す → 長さの選択は 9m のまま（長さを一度も替えていなくても）
    await run(page, () => __open(__G({ catvKeep: true, catvSup9: true })));
    okc = await click(page, CB); r = await st();
    console.log('②開いてすぐ外す', brief([r.on, r.rows, r.ui && r.ui.grp]));
    ok(okc && !r.error && r.on === 'catvKeep' && r.rows.length === 0 && r.ui.grp && !r.ui.grp.cb && r.ui.grp.sel === 'catvSup9',
       '★開いたばかりの 9m の戸別でチェックを外すと、長さが 7m に戻る（メインは選んでいた長さのまま） → ' + short(r.error || [r.on, r.rows, r.ui && r.ui.grp]));
    // キーボード：長さの選択で ↓ を2回 → 8m → 9m（描き直しても、押していた欄に戻る）
    const fa = () => run(page, () => { const a = document.activeElement; if(!a) return '';
      return a.tagName + ':' + ['data-opt-len', 'data-opt-group', 'data-opt'].map(k => a.getAttribute(k)).filter(v => v != null).join(''); });
    await run(page, () => __open(__G({ catvKeep: true, catvSup7: true })));
    let okf = true; try { await page.focus(SEL, { timeout: 3000 }); } catch(_){ okf = false; }
    for(const s of [SUP[1], SUP[2]]){
      await page.keyboard.press('ArrowDown'); r = await st(); const f = await fa();
      console.log('②キーボード ↓ ' + s.len, brief([r.on, r.rows, f]));
      ok(okf && !r.error && r.on === 'catvKeep,' + s.key && r.rows.length === 1 && r.rows[0] === supRow(s) && r.ui.grp && r.ui.grp.cb && r.ui.grp.sel === s.key
         && f === 'SELECT:catvSup',
         '★キーボードで長さの選択の ↓ を押すと、押していた欄から外れる（続けて押して ' + s.len + ' まで行けない） → ' + short(r.error || [r.on, r.rows, f]));
    }
    // チェックをスペースで外す・入れる → 押していた欄のまま・選んでいた長さ（9m）で入る
    await page.keyboard.press('Shift+Tab');
    let f0 = await fa();
    await page.keyboard.press('Space'); r = await st(); let f1 = await fa();
    await page.keyboard.press('Space'); const r2 = await st(); const f2 = await fa();
    console.log('②キーボード スペース', brief([f0, r.on, f1, r2.on, f2]));
    ok(f0 === 'INPUT:catvSup' && !r.error && r.on === 'catvKeep' && r.rows.length === 0 && f1 === 'INPUT:catvSup'
       && !r2.error && r2.on === 'catvKeep,catvSup9' && r2.rows.length === 1 && r2.rows[0] === supRow(SUP[2]) && f2 === 'INPUT:catvSup',
       '★チェックをスペースで外す・入れると、押していた欄から外れる（または 9m で入らない） → ' + short([f0, r.on, f1, r2.error || r2.on, f2]));
    // 今までの3つのチェックも、スペースで押したあと同じ欄のまま
    try { await page.focus('#ag-host-edit [data-opt="poleNew"]', { timeout: 3000 }); } catch(_){}
    await page.keyboard.press('Space'); r = await st(); f1 = await fa();
    ok(!r.error && r.on === 'catvKeep,catvSup9,poleNew' && f1 === 'INPUT:poleNew',
       '★今までのチェック（ポール新設）をスペースで押すと、押していた欄から外れる → ' + short([r.error || r.on, f1]));
    await ctx.close();
  }

  // ---- ③ 保存データからの積算（buildBOMForData） ----
  if(want('③')){
    const { ctx, page } = await openMain('③');
    const r = await run(page, () => {
      __open(null); const d0 = collectState();
      const f = (g, extra) => { const d = JSON.parse(JSON.stringify(d0)); Object.assign(d, extra || {}); d.antenna_guide = g;
        const bom = buildBOMForData(d, {}); const t = __tot(bom);
        return { guide: bom.filter(x => x.src === 'guide').map(__sig), sup: __supRows(bom), mat: t.mat, lab: t.lab }; };
      const z = f(__G({ catvKeep: true }));
      const res = { z: z.guide };
      ['catvSup7', 'catvSup8', 'catvSup9'].forEach(k => { const x = f(__G({ catvKeep: true, [k]: true })); res[k] = { sup: x.sup, dm: x.mat - z.mat, dl: x.lab - z.lab, n: x.guide.length }; });
      const only = f(__G({ catvSup8: true }));          // 柱だけ選んで部品を置いていない戸別も計上する（今までの柱と同じ）
      res.only = { sup: only.sup, n: only.guide.length };
      const two = f(__G({ catvKeep: true, catvSup9: true, catvSup8: true }));
      res.two = { sup: two.sup, dm: two.mat - z.mat, dl: two.lab - z.lab };
      const three = f(__G({ catvKeep: true, catvSup7: true, catvSup8: true, catvSup9: true }));
      res.three = { sup: three.sup, dm: three.mat - z.mat, dl: three.lab - z.lab };
      res.str = f(__G({ catvKeep: true, catvSup9: 1 })).sup;   // true 以外の値（古い・手で直したファイル）でも true と同じ
      res.other = ['hafu', 'yaneuma'].map(p => f(__G({ catvSup8: true }, p)).sup.length);
      // 今までの3つ（版176 と同じ行・同じ差額）
      res.old = {};
      ['poleNew', 'catvKeep', 'catvMove'].forEach(k => { const x = f(__G({ [k]: true })); res.old[k] = { guide: x.guide }; });
      const pn = f(__G({ catvKeep: true, poleNew: true })), mv = f(__G({ catvKeep: true, catvMove: true }));
      res.oldD = [pn.mat - z.mat, pn.lab - z.lab, mv.mat - z.mat, mv.lab - z.lab];
      const all = f(__G({ poleNew: true, catvKeep: true, catvMove: true, catvSup8: true }));
      res.all = { guide: all.guide, dm: all.mat - z.mat, dl: all.lab - z.lab };
      res.active = [antennaGuideActive(__G({ catvSup9: true })), antennaGuideActive(__G({ catvSup9: true }, 'hafu'))];
      return res;
    });
    console.log('③保存データ', brief(r));
    ok(!r.error, '③止まった → ' + r.error);
    if(!r.error){
      SUP.forEach(s => {
        const x = r[s.key];
        ok(x && x.sup.length === 1 && x.sup[0] === supRow(s) && x.dm === MAT && x.dl === s.lab && x.n === 2,
           '★保存データの ' + s.len + ' が1回だけ（材料 +6,530・労務 +' + s.lab + '）乗らない → ' + short(x));
      });
      ok(r.only.sup.length === 1 && r.only.sup[0] === supRow(SUP[1]) && r.only.n === 1, '★部品を置かず柱だけ選んだ戸別で 8m が乗らない → ' + short(r.only));
      ok(r.two.sup.length === 1 && r.two.sup[0] === supRow(SUP[1]) && r.two.dm === MAT && r.two.dl === SUP[1].lab,
         '★保存データに2つの長さ（8m・9m）が true のとき、行が2つになる／短い方（8m）にならない → ' + short(r.two));
      ok(r.three.sup.length === 1 && r.three.sup[0] === supRow(SUP[0]) && r.three.dm === MAT && r.three.dl === SUP[0].lab,
         '★保存データに3つの長さが true のとき、行が1つ（7m）にならない → ' + short(r.three));
      ok(r.str.length === 1 && r.str[0] === supRow(SUP[2]), '保存データの値が true 以外（1）だと乗らない → ' + short(r.str));
      ok(r.other.every(n => n === 0), '★柱でないパターンで保存データの柱が乗る → ' + short(r.other));
      ok(r.active[0] === true && r.active[1] === false, '★柱だけ選んだ戸別がガイド有効にならない（または破風で有効になる） → ' + short(r.active));
      ok(r.old.poleNew.guide.join() === OLD_ROWS.poleNew && r.old.catvKeep.guide.join() === OLD_ROWS.catvKeep && r.old.catvMove.guide.join() === OLD_ROWS.catvMove
         && r.z.join() === OLD_ROWS.catvKeep, '★今までの柱の積算の行が 版176 と違う → ' + short(r.old));
      ok(JSON.stringify(r.oldD) === JSON.stringify([30000, 17700, 0, 26500]), '★今までの柱の金額が 版176 と違う → ' + short(r.oldD));
      ok(r.all.guide.length === 4 && r.all.guide.indexOf(OLD_ROWS.poleNew) >= 0 && r.all.guide.indexOf(OLD_ROWS.catvMove) >= 0 && r.all.guide.indexOf(supRow(SUP[1])) >= 0
         && r.all.dm === 30000 + MAT && r.all.dl === 17700 + 26500 + SUP[1].lab, '★今までの柱と一緒に選ぶと、どちらかが落ちる／二重になる → ' + short(r.all));
    }
    await ctx.close();
  }

  // ---- ④ 費用・協力会社・内訳書・物件の印刷・発注材料・工事調書 ----
  if(want('④')){
    const { ctx, page } = await openMain('④');
    const r = await run(page, async () => {
      __open(null); const d0 = collectState(); d0.chosho_mgmt_no = 'W7A008'; d0.survey_done = true;
      const mk = opts => { const d = JSON.parse(JSON.stringify(d0)); d.antenna_guide = __G(opts); return { file: 'W7A008.json', fileType: 'plain', data: d }; };
      const r0 = mk({ catvKeep: true }), r8 = mk({ catvKeep: true, catvSup8: true });
      const out = {};
      const a0 = getRowBomAggregate(r0), a8 = getRowBomAggregate(r8);
      out.agg = { dm: a8.matSum - a0.matSum, dl: a8.labSum - a0.labSum,
                  it: a8.items.filter(x => /^catv_pole_sup/.test(x.id)).map(x => [x.id, x.qty, x.unitMat, x.unitLab, x.mat, x.lab, x.unit].join('|')) };
      // 協力会社（標準単価）。物件の単価変更（単価マスターの色付き行）は効かない
      const keep = JSON.parse(JSON.stringify(PARTS.catv_pole_sup8 || null));
      if(PARTS.catv_pole_sup8){ PARTS.catv_pole_sup8.labor_cost = 21000; PARTS.catv_pole_sup8.material_cost = 7000; }
      r0._bomCache = undefined; r8._bomCache = undefined;
      const b0 = getRowBomAggregate(r0), b8 = getRowBomAggregate(r8);
      out.proj = [b8.matSum - b0.matSum, b8.labSum - b0.labSum];
      const s0 = computeSubRow(r0, 0), s8 = computeSubRow(r8, 1);
      if(keep) PARTS.catv_pole_sup8 = keep;
      r0._bomCache = undefined; r8._bomCache = undefined;
      out.sub = { pureLab: s8.pureLab - s0.pureLab, total: s8.total - s0.total,
        lab: s8.laborItems.filter(x => /CATV支給柱/.test(x.name)).map(x => [x.name, x.unit, x.qty, x.unitLab, x.lab].join('|')),
        mats: s8.materials.filter(x => /CATV支給柱/.test(x.name)).map(x => [x.lineKey, x.name, x.unit, x.qty, x.unitMat, x.mat].join('|')),
        done: s8.done };
      // 持出材料にチェック → 6,530 が持出材料に入る
      _takeoutMap[s8.takeoutKey] = Object.assign({}, _takeoutMap[s8.takeoutKey] || {}, { 'catv_pole_sup8|guide:CATV支給柱建柱（8m）で使用': true });
      const s8t = computeSubRow(r8, 1);
      out.take = [s8t.takeout, s8t.total - s8.total];
      delete _takeoutMap[s8.takeoutKey];
      // 内訳書（協力会社請求内訳の明細＝一覧表）と、物件の印刷（1戸別の内訳ページ）
      const text = h => { const dv = document.createElement('div'); dv.innerHTML = h; return Array.from(dv.querySelectorAll('tr')).map(t => t.textContent.replace(/\s+/g, '')); };
      out.mx = text(renderSubMatrixPrint({ mxPer: 6, paper: 'A4', orient: 'portrait', project: '試験' }, [s8t])).filter(t => /CATV支給柱/.test(t));
      out.bk = text(renderBukkenCasePrint(s8t)).filter(t => /CATV支給柱/.test(t));
      // 費用（全体費用詳細）・発注材料
      const dv1 = document.createElement('div'); document.body.appendChild(dv1);
      renderListCostDetailMode([r8], dv1);
      out.cost = Array.from(dv1.querySelectorAll('tr')).map(t => t.textContent.replace(/\s+/g, '')).filter(t => /CATV支給柱/.test(t));
      dv1.remove();
      const dv2 = document.createElement('div'); document.body.appendChild(dv2);
      renderListMaterialsMode([r8], dv2);
      out.order = Array.from(dv2.querySelectorAll('tr')).map(t => Array.from(t.children).map(c => c.textContent.trim()).join('|')).filter(t => /CATV支給柱/.test(t));
      dv2.remove();
      // 工事調書の使用材料（材料費が付く＝物として使ったもの）
      __open(r8.data.antenna_guide);
      renderChosho();
      const mv = document.getElementById('chosho-mat-view');
      out.chosho = Array.from(mv.querySelectorAll('.mat-row')).map(x => x.textContent).filter(t => /CATV支給柱/.test(t));
      out.choshoHead = (() => { let head = ''; let found = ''; Array.from(mv.querySelectorAll('.mat-cat-head, .mat-row')).forEach(x => {
        if(x.classList.contains('mat-cat-head')) head = x.textContent; else if(/CATV支給柱/.test(x.textContent)) found = head; }); return found; })();
      return out;
    });
    console.log('④費用・協力会社', brief(r));
    ok(!r.error, '④止まった → ' + r.error);
    if(!r.error){
      ok(r.agg.dm === MAT && r.agg.dl === 20000 && r.agg.it.join() === 'catv_pole_sup8|1|6530|20000|6530|20000|本',
         '★費用の集計（getRowBomAggregate）に 8m の材料 6,530・労務 20,000 が1回だけ入らない → ' + short(r.agg));
      ok(r.proj[0] === 7000 && r.proj[1] === 21000, '試験の前提: 物件の単価変更が費用に効かない → ' + short(r.proj));
      ok(r.sub.pureLab === 20000 && r.sub.total === 20000 && r.sub.lab.join() === 'CATV支給柱建柱 8m（根枷・底キャップ）|本|1|20000|20000',
         '★協力会社の労務費に 8m の 20,000（標準単価）が1回だけ入らない → ' + short(r.sub));
      ok(r.sub.mats.join() === 'catv_pole_sup8|guide:CATV支給柱建柱（8m）で使用|CATV支給柱建柱 8m（根枷・底キャップ）|本|1|6530|6530',
         '★協力会社の持出材料の候補に 根枷・底キャップ 6,530（標準単価）が出ない → ' + short(r.sub.mats));
      ok(r.take[0] === MAT && r.take[1] === MAT, '★持出材料にチェックしても 6,530 が入らない → ' + short(r.take));
      ok(r.mx.length === 2 && /^CATV支給柱建柱8m（根枷・底キャップ）（本）20,000120,000$/.test(r.mx[0]) && /^CATV支給柱建柱8m（根枷・底キャップ）（本）6,53016,530$/.test(r.mx[1]),
         '★内訳書（協力会社請求内訳の明細）に 労務 20,000・持出材料 6,530 が1行ずつ出ない → ' + short(r.mx));
      ok(r.bk.length === 2 && r.bk[0] === 'CATV支給柱建柱8m（根枷・底キャップ）1本¥20,000¥20,000' && r.bk[1] === 'CATV支給柱建柱8m（根枷・底キャップ）1本¥6,530¥6,530',
         '★物件の印刷（内訳ページ）に 労務 20,000・持出材料 6,530 が出ない → ' + short(r.bk));
      ok(r.cost.length >= 1 && r.cost.every(t => /CATV支給柱建柱8m（根枷・底キャップ）/.test(t)) && r.cost.some(t => /¥6,530¥20,000/.test(t)),
         '★費用（全体費用詳細）に 8m の行（材料 6,530・労務 20,000）が出ない → ' + short(r.cost));
      ok(r.order.length === 1 && /^CATV支給柱建柱 8m（根枷・底キャップ）\|.*\|本\|1$/.test(r.order[0]), '★発注材料に 8m の柱（根枷・底キャップ）1本 が出ない → ' + short(r.order));
      ok(r.chosho.length === 1 && /CATV支給柱建柱 8m（根枷・底キャップ）/.test(r.chosho[0]) && /1 本/.test(r.chosho[0]) && r.choshoHead === '■ 屋外金物(支持)',
         '★工事調書の使用材料に ■ 屋外金物(支持) の下で 8m の柱が出ない → ' + short([r.chosho, r.choshoHead]));
      ok(r.sub.done === false, '★柱の金額が乗っただけで協力会社の一覧で「完了」になる → ' + short(r.sub.done));
    }
    await ctx.close();
  }

  // ---- ⑤ アパート：代表にだけ乗る ----
  if(want('⑤')){
    const { ctx, page } = await openMain('⑤');
    const r = await run(page, () => {
      __open(null); const d0 = collectState();
      const f = (opts, extra) => { const d = JSON.parse(JSON.stringify(d0)); Object.assign(d, extra); d.antenna_guide = __G(opts);
        const bom = buildBOMForData(d, {}); const t = __tot(bom); return { sup: __supRows(bom), mat: t.mat, lab: t.lab, pn: bom.filter(x => x.id === 'pole_m63').length }; };
      const out = {};
      for(const common of ['yes', 'no']){
        out[common] = [1, 2, 3].map(i => { const ex = { apt_units: '3', apt_idx: String(i), apt_common: common };
          const z = f({ catvKeep: true }, ex), x = f({ catvKeep: true, catvSup9: true }, ex), p = f({ catvKeep: true, poleNew: true }, ex);
          return { i, sup: x.sup, dm: x.mat - z.mat, dl: x.lab - z.lab, pole: p.pn }; });
      }
      // 編集画面（rebuild）でも同じ
      const ui = [1, 2].map(i => { __open(__G({ catvKeep: true, catvSup9: true }), { apt_units: '3', apt_idx: String(i), apt_common: 'yes' });
        const u = __ui(); return { i, inp: [STATE.input.apt_units, STATE.input.apt_idx], sup: __supRows(), cb: u.grp && u.grp.cb, sel: u.grp && u.grp.sel }; });
      out.ui = ui;
      return out;
    });
    console.log('⑤アパート', brief(r));
    ok(!r.error, '⑤止まった → ' + r.error);
    if(!r.error){
      for(const common of ['yes', 'no']){
        const a = r[common];
        ok(a[0].sup.length === 1 && a[0].sup[0] === supRow(SUP[2]) && a[0].dm === MAT && a[0].dl === SUP[2].lab,
           '★アパート（共用部 ' + common + '）の代表（1世帯目）に 9m の柱が乗らない → ' + short(a[0]));
        ok(a[1].sup.length === 0 && a[1].dm === 0 && a[1].dl === 0 && a[2].sup.length === 0 && a[2].dm === 0 && a[2].dl === 0,
           '★アパート（共用部 ' + common + '）の2世帯目以降にも柱が乗る（建物で1本のはず） → ' + short(a.slice(1)));
        ok(a[0].pole === 1 && a[1].pole === 0 && a[2].pole === 0, '試験の前提: 今までの柱（ポール新設）も代表だけ → ' + short(a.map(x => x.pole)));
      }
      ok(r.ui[0].sup.length === 1 && r.ui[0].sup[0] === supRow(SUP[2]) && r.ui[1].sup.length === 0,
         '★編集画面で、アパートの代表だけに柱が乗る決まりが効かない → ' + short(r.ui));
      ok(r.ui.every(x => x.cb === true && x.sel === 'catvSup9'), '★アパートの2世帯目で柱の選択（9m）が画面に出ない → ' + short(r.ui));
    }
    await ctx.close();
  }

  // ---- ⑥ 開く・保存の往復 ----
  if(want('⑥')){
    const { ctx, page } = await openMain('⑥');
    const r = await run(page, async () => {
      const out = {};
      const view = () => { const u = __ui(); return { oldHtml: u.oldHtml, old: u.oldChecked, grp: u.grp, on: __on(), sup: __supRows(), table: u.table }; };
      __open(__G({ catvMove: true, catvSup9: true })); out.a = view();
      // 保存 → 開き直し（戸別ファイルの中身＝collectState を JSON にしたもの）
      const saved = JSON.stringify(collectState());
      out.savedOpts = JSON.parse(saved).antenna_guide.options;
      __open(null); out.none = view();                       // 別の戸別（ガイド無し）
      try { closeListView(); } catch(_){}
      applyStateData(JSON.parse(saved)); out.back = view();
      // 戸別ファイルへ書く中身（一覧の行から）
      const row = { file: 'W7A009.json', fileType: 'plain', data: JSON.parse(saved), _photosKnown: true };
      const c = await buildIndividualContent(row);
      out.file = JSON.parse(JSON.stringify(c)).antenna_guide;
      // 長さを 8m に替えて保存 → 開き直し
      __open(JSON.parse(saved).antenna_guide);
      return out;
    });
    let r2 = null;
    if(!r.error){
      const okp = await pick(page, SEL, 'catvSup8');
      r2 = await run(page, () => {
        const out = { opts: JSON.parse(JSON.stringify(collectState().antenna_guide.options)) };
        const saved = JSON.stringify(collectState());
        __open(__G({ poleNew: true }));                     // 古い戸別（ポール新設だけ）
        const u = __ui(); out.old = { oldHtml: u.oldHtml, grp: u.grp, sup: __supRows(), rows: __guideRows() };
        applyStateData(JSON.parse(saved)); const u2 = __ui(); out.back = { grp: u2.grp, sup: __supRows() };
        // 2つの長さが true の保存データ（古い・壊れた）→ 画面と積算は同じ1つ
        __open(__G({ catvSup9: true, catvSup8: true })); const u3 = __ui(); out.two = { grp: u3.grp, sup: __supRows(), table: u3.table };
        return out;
      });
      r2.okp = okp;
    }
    console.log('⑥往復', brief(r), brief(r2));
    ok(!r.error, '⑥止まった → ' + r.error);
    if(!r.error){
      ok(r.a.oldHtml === oldHtml(['catvMove']) && r.a.old === 'catvMove', '★古い柱（CATV柱移設）を開いたときの見た目が 版176 と違う → ' + short(r.a.oldHtml));
      ok(r.a.grp && r.a.grp.cb && r.a.grp.on && r.a.grp.sel === 'catvSup9' && r.a.sup.length === 1 && r.a.sup[0] === supRow(SUP[2])
         && r.a.table.indexOf('柱CATV支給柱建柱（9m）で使用1本') >= 0, '★9m の戸別を開いても 9m のチェックが出ない／行が無い → ' + short(r.a));
      ok(r.savedOpts && r.savedOpts.catvSup9 === true && !r.savedOpts.catvSup7 && !r.savedOpts.catvSup8 && r.savedOpts.catvMove === true,
         '★保存の中身に catvSup9 が入らない（または別の長さが入る） → ' + short(r.savedOpts));
      ok(r.none.grp && !r.none.grp.cb && !r.none.grp.on && r.none.grp.sel === 'catvSup7' && r.none.sup.length === 0 && r.none.on === '',
         '★別の戸別（ガイド無し）を開いたのに、前の戸別の長さ・チェックが残る → ' + short(r.none));
      ok(r.back.grp && r.back.grp.cb && r.back.grp.sel === 'catvSup9' && r.back.sup.length === 1 && r.back.sup[0] === supRow(SUP[2]) && r.back.old === 'catvMove',
         '★保存 → 開き直しで 9m に戻らない → ' + short(r.back));
      ok(r.file && r.file.options && r.file.options.catvSup9 === true && r.file.pattern === 'pole', '★戸別ファイルへ書く中身に 9m が入らない → ' + short(r.file));
    }
    ok(r2 && !r2.error && r2.okp, '⑥長さを選べない → ' + short(r2));
    if(r2 && !r2.error){
      ok(r2.opts.catvSup8 === true && !r2.opts.catvSup9 && !r2.opts.catvSup7, '★開いた戸別で長さを 8m に替えて保存すると、9m が残る／8m が入らない → ' + short(r2.opts));
      ok(r2.old.oldHtml === oldHtml(['poleNew']) && r2.old.grp && !r2.old.grp.cb && r2.old.grp.sel === 'catvSup7' && r2.old.sup.length === 0
         && r2.old.rows.join() === OLD_ROWS.poleNew, '★古い戸別（ポール新設だけ）を開くと、見た目・積算が 版176 と違う／前の戸別の長さが残る → ' + short(r2.old));
      ok(r2.back.grp && r2.back.grp.cb && r2.back.grp.sel === 'catvSup8' && r2.back.sup.length === 1 && r2.back.sup[0] === supRow(SUP[1]),
         '★8m で保存 → 開き直しで 8m に戻らない → ' + short(r2.back));
      ok(r2.two.grp && r2.two.grp.cb && r2.two.grp.sel === 'catvSup8' && r2.two.sup.length === 1 && r2.two.sup[0] === supRow(SUP[1])
         && r2.two.table.filter(t => /CATV支給柱/.test(t)).length === 1,
         '★2つの長さが true の保存データで、画面の長さと積算の行が1つにそろわない → ' + short(r2.two));
    }
    await ctx.close();
  }

  // ---- ⑦ 完了は金額で決めない ----
  if(want('⑦')){
    const { ctx, page } = await openMain('⑦');
    const r = await run(page, () => {
      __open(null); const d0 = collectState(); d0.chosho_mgmt_no = 'W7A010';
      const mk = extra => { const d = Object.assign(JSON.parse(JSON.stringify(d0)), extra || {}); d.antenna_guide = __G({ catvSup7: true });
        return { file: 'W7A010.json', fileType: 'plain', data: d }; };
      const plan = mk({}), done1 = mk({ work_done: true }), done2 = mk({ chosho_status: 'completed' });
      const agg = getRowBomAggregate(plan);
      const sp = doneSplitNew(); doneSplitAdd(sp, plan, agg.matSum, agg.labSum); doneSplitAdd(sp, done1, 1, 1);
      return { it: agg.items.filter(x => /^catv_pole_sup/.test(x.id)).map(x => x.id + ':' + x.mat + ':' + x.lab),
               done: [caseWorkDone(plan), caseWorkDone(done1), caseWorkDone(done2)], sub: computeSubRow(plan, 0).done,
               sp: [sp.plan.n, sp.done.n, sp.plan.mat > 0] };
    });
    console.log('⑦完了', brief(r));
    ok(!r.error, '⑦止まった → ' + r.error);
    if(!r.error){
      ok(r.it.join() === 'catv_pole_sup7:6530:17700', '★⑦試験の前提: 7m の柱の金額が乗らない → ' + short(r.it));
      ok(r.done.join() === 'false,true,true' && r.sub === false && r.sp.join() === '1,1,true',
         '★柱の金額が乗っただけで完了と見なす（完了は受付台帳の「完了」・現場の工事完了だけ） → ' + short(r));
    }
    await ctx.close();
  }

  // ---- ⑧ 閲覧用（antenna_viewer） ----
  if(want('⑧')){
    const py = cp.spawnSync('python3', [path.join(ROOT, 'antenna_main', '開発ツール', 'ビューア生成.py'), '--check',
      '--main', REAL_MAIN, '--block', VIEWER_BLOCK, '--out', VIEWER_PATH], { encoding: 'utf8' });
    ok(py.status === 0, '★ビューア（antenna_viewer）がメインから作り直されていない → ' + String(py.stdout || '').split('\n').slice(-3).join(' ') + String(py.stderr || '').slice(0, 300));
    const probe = (p) => run(p, () => {
      const parts = ['catv_pole_sup7', 'catv_pole_sup8', 'catv_pole_sup9'].map(k => JSON.stringify(DEFAULT_PARTS[k] || null));
      const map = JSON.stringify(AG_POLE_PARTS_ID);
      __open(__G({ catvSup8: true }));
      const u = __ui();
      return { ver: APP_VERSION, viewer: !!window.__VIEWER_MODE__, parts, map, grp: u.grp, html: document.querySelector('#ag-host-edit .apw-opts').innerHTML, sup: __supRows() };
    });
    /* 閲覧用でキーボードを使う：Tab で長さの選択へ移れる・↓／文字を押しても長さが替わらない・Tab で次へ移れる。
       ほかの選択欄（宅内調整 #indoor_adj）も同じ */
    const viewerKeys = async p => {
      const out = {};
      const fa = () => run(p, () => { const a = document.activeElement; return a ? a.tagName + ':' + (a.getAttribute('data-opt-len') || a.getAttribute('data-opt-group') || a.id || '') : ''; });
      const now = () => run(p, () => { const s = document.querySelector('#ag-host-edit [data-opt-len="catvSup"]'), ia = document.getElementById('indoor_adj');
        return { sel: s ? s.value : null, on: __on(), sup: __supRows(), ia: ia ? ia.value : null, iaIn: ia ? STATE.input.indoor_adj : null }; });
      out.before = await now();
      try { await p.focus('#ag-host-edit [data-opt-group="catvSup"]', { timeout: 3000 }); } catch(_){ out.noFocus = true; return out; }
      await p.keyboard.press('Tab'); out.tab1 = await fa();
      for(const k of ['ArrowDown', 'ArrowDown', '9', 'ArrowUp', 'End']) await p.keyboard.press(k);
      out.focusSel = await fa();
      out.afterSel = await now();
      await p.keyboard.press('Tab'); out.tab2 = await fa();
      try { await p.focus('#indoor_adj', { timeout: 3000 }); } catch(_){}
      out.focusIa = await fa();
      for(const k of ['ArrowDown', 'ArrowUp', 'n']) await p.keyboard.press(k);
      out.afterIa = await now();
      return out;
    };
    let rv = null, rk = null;
    if(fs.existsSync(VIEWER_PATH)){
      const o = await openMain('⑧viewer', url.pathToFileURL(VIEWER_PATH).href);
      rv = await probe(o.page);
      if(rv && !rv.error) rk = await viewerKeys(o.page);
      await o.ctx.close();
    }
    const om = await openMain('⑧main');
    const rm = await probe(om.page);
    await om.ctx.close();
    console.log('⑧閲覧用', brief(rv), brief(rm && rm.grp));
    ok(rv && !rv.error && rv.viewer, '⑧ビューアが開けない → ' + short(rv));
    if(rv && !rv.error){
      ok(rv.grp && rv.grp.cb && rv.grp.sel === 'catvSup8' && rv.sup.length === 1 && rv.sup[0] === supRow(SUP[1]),
         '★閲覧用で 8m の戸別を開いても、柱の長さ・積算の行が出ない → ' + short(rv));
      ok(rm && !rm.error && JSON.stringify(rm.parts) === JSON.stringify(rv.parts) && rm.map === rv.map && rm.html === rv.html && rm.ver === rv.ver,
         '★試験しているメインと閲覧用で、柱の選択・単価が違う（ビューアを作り直していない） → ' + short([rm && rm.parts, rv.parts]));
      console.log('⑧閲覧用キーボード', brief(rk));
      ok(rk && !rk.error && !rk.noFocus && rk.tab1 === 'SELECT:catvSup' && rk.focusSel === 'SELECT:catvSup' && rk.tab2 !== 'SELECT:catvSup',
         '閲覧用で Tab を押しても長さの選択へ移れない／選択から出られない → ' + short(rk));
      ok(rk && !rk.error && rk.afterSel && rk.afterSel.sel === 'catvSup8' && rk.afterSel.on === 'catvSup8'
         && rk.afterSel.sup.length === 1 && rk.afterSel.sup[0] === supRow(SUP[1]),
         '★閲覧用でキーボード（↓・文字）を押すと長さの選択が替わる（画面が 8m の積算と食い違う） → ' + short(rk && rk.afterSel));
      ok(rk && !rk.error && rk.focusIa === 'SELECT:indoor_adj' && rk.afterIa && rk.before && rk.afterIa.ia === rk.before.ia && rk.afterIa.iaIn === rk.before.iaIn,
         '★閲覧用でキーボードを押すと、ほかの選択欄（宅内調整）が替わる → ' + short(rk && [rk.focusIa, rk.before, rk.afterIa]));
    }
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v177_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
