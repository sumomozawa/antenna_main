/* 版177（現場入力）: アンテナ取付ガイドの「柱」のチェックに「CATV支給柱建柱で使用」（長さ 7m／8m／9m）を足した。
   取付ガイドの中身（==ANTENNA-GUIDE-CORE==）はメインと1バイトも違わない写し。現場入力は金額を出さないが、
   選んだ長さは下書き・PCへ渡すファイルに入り、PCの積算に乗る。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ・ガイドの部材表の行の名前）
     ① 柱のパターンに出る：今までの3つは 版176 と1文字も同じ形。そのあとに枠が1つ（チェック・「CATV支給柱建柱で使用」・
        長さ 7m／8m／9m・既定 7m・説明）。柱でないパターンには出ない
     ② 押す：チェック → catvSup7 だけ true。長さを 9m／8m に替える → true が移る（2つ同時に入らない）。外す → 3つとも外れる。
        外したまま長さを選んでからチェック → その長さで入る。今までの3つの選択は動かない。ガイドの部材表に「柱」の行
        （現場入力は押すたびにガイドを作り直すので、外すと長さの選択は 7m に戻る。メインは選んでいた長さのまま。
          外した柱は計上しないので金額は変わらない＝わざとそのままにしてある違い。取付ガイドの中身の optPick の注にも書いた）
     ③ 保存：下書き（この端末の中＝IndexedDB）と、PCへ渡す中身（buildState）に catvSup8 が入る（ほかの長さは入らない）
     ④ 往復：PCへ渡す中身 → 読み直し（modelFromCaseState）・下書きを開き直す・PCのファイルを読み込む（loadStateInto）で
        同じ長さが出る。別の戸別（新しい戸別）に前の長さを持ち越さない。2つの長さが true のデータは1つ（短い方）で出る。
        現場で選んだ中身をPCで開くと、その長さの柱が積算に乗る（メインの単価マスター）
     ⑤ 幅320pxのスマホで横にはみ出さない（チェックした・全部チェックした・何もしない）。長さの選択は枠の中に収まる
     ⑥ 取付ガイドの中身（==ANTENNA-GUIDE-CORE==）がメインと1バイトも違わない（CSS と JS の2か所）。新しい柱が入っている
   使い方: node smoke_v177_genba.js [index.html の file:// URL]
           SCENE=②,⑤ node smoke_v177_genba.js   … 名前にその字が入る場面だけ（⓪ はいつも走る）
     （⑥と④の終わりでは、いつもの置き場所のメインを見る。別の写しと比べるときは MAIN_FOR_CORE=場所 を付ける） */
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
const FILE = n => 'file://' + path.join(ROOT, n, 'index.html');
const HTML = process.argv[2] || FILE('antenna_genba');
const HTML_PATH = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
const MAIN_PATH = process.env.MAIN_FOR_CORE || path.join(ROOT, 'antenna_main', 'index.html');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(HTML_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();
const ONLY = String(process.env.SCENE || '').split(',').map(s => s.trim()).filter(Boolean);

/* 版176 の今までの3つ（画面の形）。チェックしたものには class="on" が付く */
const OLD3 = {
  poleNew:  ['ｶﾗｰM63ﾎﾟｰﾙ（XDDC1263MKA）を新設で計上します。', 'ポール新設'],
  catvKeep: ['既存のCATV柱を、いまの位置のまま使います。', 'CATV柱既存の位置で使用'],
  catvMove: ['既存のCATV柱を移設して使います。', 'CATV柱移設して使用']
};
const oldHtml = on => Object.keys(OLD3).map(k => '<label' + ((on || []).indexOf(k) >= 0 ? ' class="on"' : '') + ' title="' + OLD3[k][0]
  + '"><input type="checkbox" data-opt="' + k + '">' + OLD3[k][1] + '</label>').join('');
const TIP = '市で支給された柱を建てて、それにアンテナを取り付けます。';
const NO = 'W7G001';

/* ページの中で使う道具 */
const SETUP = `
  window.__G = (opts, pattern) => ({ ver: 1, pattern: pattern || 'pole', parts: {}, options: Object.assign({}, opts || {}) });
  /* 新しい戸別にして、取付ガイドを開いて描く */
  window.__fresh = (guide, extra) => {
    M = freshModel(); ensureModelShape(M); Object.assign(M, extra || {});
    if(guide) M.antenna_guide = guide;
    openState.guide = true; render();
  };
  window.__on = m => Object.keys(((m || M).antenna_guide || {}).options || {}).filter(k => (m || M).antenna_guide.options[k]).sort().join(',');
  window.__ui = () => {
    const host = document.getElementById('apw-host-field');
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
                  selInLabel: !!(sel && sel.closest('label')) } : null,
      table: host ? Array.from(host.querySelectorAll('.apw-bom-body tr')).map(tr => tr.textContent).filter(t => /^柱/.test(t)) : []
    };
  };
`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errs = [];
  async function fresh(name, vp){
    const ctx = await b.newContext(Object.assign({ viewport: vp || { width: 390, height: 800 } },
      (vp && vp.width <= 400) || !vp ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror(' + name + '): ' + e.message));
    page.on('console', m => { const t = m.text();
      if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push('console(' + name + '): ' + t); });
    page.on('dialog', d => d.accept().catch(()=>{}));
    await page.goto(HTML); await page.waitForTimeout(1800);
    await page.evaluate(SETUP);
    return { ctx, page };
  }
  /* 1つの場面。途中で止まっても、ほかの場面は続ける */
  async function scene(name, vp, fn){
    if(ONLY.length && name !== '⓪' && !ONLY.some(s => name.indexOf(s) >= 0)) return;
    let c = null;
    try{ c = await fresh(name, vp); await fn(c.page); }
    catch(e){ fails.push('試験が途中で止まった（' + name + '）→ ' + ((e && e.message) || e)); }
    finally{ if(c) await c.ctx.close().catch(()=>{}); }
  }
  const J = o => String(JSON.stringify(o === undefined ? null : o)).slice(0, 900);
  const click = async (page, sel) => { try { await page.click(sel, { timeout: 3000 }); return true; } catch(_){ return false; } };
  const pick = async (page, sel, v) => { try { await page.selectOption(sel, v, { timeout: 3000 }); return true; } catch(_){ return false; } };
  const CB = '#apw-host-field [data-opt-group="catvSup"]', SEL = '#apw-host-field [data-opt-len="catvSup"]';

  /* ---------- ⓪ 前提 ---------- */
  await scene('⓪', null, async page => {
    const r = await page.evaluate(() => ({
      ver: APP_VERSION,
      f: ['freshModel','ensureModelShape','render','buildState','modelFromCaseState','persistDraft','idbGet','loadStateInto',
          'normalizeAntennaGuide','antennaGuideActive','renderAntennaGuideBomRows','createAntennaGuide'].filter(n => typeof window[n] !== 'function'),
      rows: ['catvSup7','catvSup8','catvSup9','poleNew'].map(k => (renderAntennaGuideBomRows({ ver: 1, pattern: 'pole', parts: {}, options: { [k]: true } }) || [])
        .filter(x => x.kind === '柱').map(x => x.product + ':' + x.qty + x.unit).join())
    }));
    console.log('⓪前提', J(r));
    ok(r.f.length === 0, '試験の前提: 無い関数がある → ' + r.f.join(' / '));
    ok(!!WANT_VER && r.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r.ver + ' ／ ファイル ' + WANT_VER);
    ok(r.rows.join('/') === 'CATV支給柱建柱（7m）で使用:1本/CATV支給柱建柱（8m）で使用:1本/CATV支給柱建柱（9m）で使用:1本/ポール新設:1本',
       '★ガイドの部材表に CATV支給柱建柱 の行が出ない／名前がメインの対応表と違う → ' + J(r.rows));
  });

  /* ---------- ① 柱のパターンに出る ---------- */
  await scene('①', null, async page => {
    const r = await page.evaluate(() => {
      const out = {};
      __fresh(__G({})); out.blank = __ui();
      __fresh(__G({ catvKeep: true })); out.keep = __ui();
      out.other = ['hafu', 'hafu2', 'gaiheki', 'tatenarabi', 'yaneuma'].map(p => { __fresh(__G({}, p)); const u = __ui(); return p + ':' + u.nGrp + ':' + (u.oldHtml || '').length; });
      __fresh(null); out.def = __ui();      // ガイドに何も無い新しい戸別（最初は柱のパターン）
      return out;
    });
    console.log('①柱の選択', J(r));
    ok(r.blank.oldHtml === oldHtml([]) && r.keep.oldHtml === oldHtml(['catvKeep']) && r.keep.oldChecked === 'catvKeep',
       '★今までの3つの見た目が 版176 と違う → ' + J([r.blank.oldHtml, r.keep.oldHtml]));
    ok(r.blank.nGrp === 1 && r.blank.order === 'LABEL,LABEL,LABEL,SPAN.grp', '★「CATV支給柱建柱で使用」の枠が1つ（今までの3つの後ろ）に出ない → ' + J(r.blank));
    const g = r.blank.grp || {};
    ok(g.txt === 'CATV支給柱建柱で使用' && g.title === TIP && g.opts === 'catvSup7:7m/catvSup8:8m/catvSup9:9m',
       '★枠の名前・説明・長さの選択肢（7m／8m／9m）が違う → ' + J(g));
    ok(g.cb === false && g.on === false && g.sel === 'catvSup7' && g.selInLabel === false,
       '★何も選んでいないのに、チェックが入る／7m でない／長さの選択がチェックの label の中にある → ' + J(g));
    ok(r.def.nGrp === 1 && r.def.grp && !r.def.grp.cb, '★新しい戸別の取付ガイドに柱の選択が出ない → ' + J(r.def));
    ok(r.other.every(s => /:0:0$/.test(s)), '★柱でないパターンに柱の選択が出る → ' + J(r.other));
  });

  /* ---------- ② 押す ---------- */
  await scene('②', null, async page => {
    const st = () => page.evaluate(() => ({ on: __on(), ui: __ui() }));
    await page.evaluate(() => __fresh(__G({ poleNew: true })));
    const seq = [];
    let k = await click(page, CB); let r = await st(); seq.push(['チェック', k, r.on]);
    ok(k && r.on === 'catvSup7,poleNew' && r.ui.grp && r.ui.grp.cb && r.ui.grp.on && r.ui.grp.sel === 'catvSup7'
       && r.ui.table.indexOf('柱CATV支給柱建柱（7m）で使用1本') >= 0,
       '★チェックしても catvSup7 だけが入らない（またはポール新設が外れる）／部材表に出ない → ' + J([k, r]));
    for(const [key, len] of [['catvSup9', '9m'], ['catvSup8', '8m'], ['catvSup7', '7m'], ['catvSup8', '8m']]){
      k = await pick(page, SEL, key); r = await st(); seq.push([len, k, r.on]);
      ok(k && r.on === key + ',poleNew' && r.ui.grp && r.ui.grp.cb && r.ui.grp.sel === key
         && r.ui.table.filter(t => /CATV支給柱/.test(t)).join() === '柱CATV支給柱建柱（' + len + '）で使用1本',
         '★チェックしたまま長さを ' + len + ' に替えても、' + key + ' だけにならない（2つの長さが入る等） → ' + J([k, r.on, r.ui.grp, r.ui.table]));
    }
    k = await click(page, CB); r = await st(); seq.push(['外す', k, r.on]);
    ok(k && r.on === 'poleNew' && r.ui.grp && !r.ui.grp.cb && !r.ui.grp.on && r.ui.table.join() === '柱ポール新設1本',
       '★チェックを外しても長さが残る（またはポール新設が外れる） → ' + J([k, r]));
    const raw = await page.evaluate(() => JSON.stringify(M.antenna_guide.options));
    ok(!/"catvSup[789]":true/.test(raw), '★外したあとも保存の中身に長さの true が残る → ' + raw);
    // 外したまま長さを選んでからチェック → その長さ
    k = await pick(page, SEL, 'catvSup9'); r = await st(); seq.push(['外したまま9m', k, r.on]);
    ok(k && r.on === 'poleNew' && r.ui.grp && !r.ui.grp.cb, '★チェックなしで長さを選んだだけで入った → ' + J([k, r.on, r.ui.grp]));
    k = await click(page, CB); r = await st(); seq.push(['チェック', k, r.on]);
    ok(k && r.on === 'catvSup9,poleNew' && r.ui.grp && r.ui.grp.sel === 'catvSup9', '★先に選んだ長さ（9m）でチェックが入らない → ' + J([k, r.on, r.ui.grp]));
    // 字を押しても外れる・長さの選択を押しただけでは変わらない
    k = await click(page, SEL); await page.keyboard.press('Escape').catch(()=>{}); r = await st();
    ok(k && r.on === 'catvSup9,poleNew', '★長さの選択を押しただけでチェックが変わった → ' + J([k, r.on]));
    k = await click(page, '#apw-host-field .apw-optgrp label'); r = await st(); seq.push(['字', k, r.on]);
    ok(k && r.on === 'poleNew' && r.ui.grp && !r.ui.grp.cb, '★字を押してもチェックが外れない → ' + J([k, r.on]));
    console.log('②押す', J(seq));
  });

  /* ---------- ③ 保存（下書き・PCへ渡す中身） ---------- */
  await scene('③', null, async page => {
    await page.evaluate(no => __fresh(__G({ catvMove: true }), { chosho_mgmt_no: no, chosho_cust_name: '試験 太郎' }), NO);
    const k1 = await click(page, CB), k2 = await pick(page, SEL, 'catvSup8');
    const r = await page.evaluate(async no => {
      clearTimeout(_persistTimer); await persistDraft();
      const rec = await idbGet('no:' + no);
      const s = buildState();
      return { draft: rec && rec.model && rec.model.antenna_guide ? JSON.parse(JSON.stringify(rec.model.antenna_guide.options)) : null,
               out: JSON.parse(JSON.stringify(s.antenna_guide)), json: JSON.stringify(s).indexOf('"catvSup8":true') >= 0, m: __on() };
    }, NO);
    console.log('③保存', J([k1, k2, r]));
    ok(k1 && k2, '★③チェック・長さの選択が無い／押せない → ' + J([k1, k2]));
    ok(r.m === 'catvMove,catvSup8', '③試験の前提: 画面の選択 → ' + r.m);
    const only8 = o => !!o && o.catvSup8 === true && !o.catvSup7 && !o.catvSup9 && o.catvMove === true;
    ok(only8(r.draft), '★下書き（この端末の中）に catvSup8 が入らない／ほかの長さが入る → ' + J(r.draft));
    ok(r.out && r.out.pattern === 'pole' && only8(r.out.options) && r.json, '★PCへ渡す中身に catvSup8 が入らない／ほかの長さが入る → ' + J(r.out));
  });

  /* ---------- ④ 往復 ---------- */
  let pcState = null;
  await scene('④', null, async page => {
    const r = await page.evaluate(async no => {
      const out = {};
      const view = () => { const u = __ui(); return { on: __on(), grp: u.grp, old: u.oldChecked, table: u.table.filter(t => /CATV支給柱/.test(t)) }; };
      __fresh(__G({ catvKeep: true, catvSup9: true }), { chosho_mgmt_no: no, chosho_cust_name: '試験 太郎' });
      out.a = view();
      const s = JSON.parse(JSON.stringify(buildState()));
      out.pc = s;
      // PCへ渡す中身 → 読み直し
      __fresh(null); out.none = view();                     // 新しい戸別（前の長さを持ち越さない）
      M = modelFromCaseState(JSON.parse(JSON.stringify(s)), true); ensureModelShape(M); openState.guide = true; render(); out.back = view();
      // 下書きを開き直す
      clearTimeout(_persistTimer); await persistDraft();
      __fresh(null);
      const rec = await idbGet('no:' + no);
      M = rec.model; ensureModelShape(M); openState.guide = true; render(); out.draft = view();
      // PCのファイルを読み込む（ファイルから開く）
      const s2 = JSON.parse(JSON.stringify(s)); s2.chosho_mgmt_no = no + 'P'; s2.antenna_guide = __G({ catvSup8: true, poleNew: true });
      __fresh(null);
      await loadStateInto(s2, no + 'P.json'); openState.guide = true; render(); out.file = view();
      // 2つの長さが true（古い・壊れたデータ）→ 1つ（短い方）
      __fresh(__G({ catvSup9: true, catvSup8: true })); out.two = view();
      return out;
    }, NO);
    pcState = r.pc;
    console.log('④往復', J([r.a, r.none, r.back, r.draft, r.file, r.two]));
    const is9 = v => v && v.grp && v.grp.cb && v.grp.sel === 'catvSup9' && v.table.join() === '柱CATV支給柱建柱（9m）で使用1本';
    ok(is9(r.a) && r.a.old === 'catvKeep', '★9m の戸別で 9m のチェック・部材表が出ない → ' + J(r.a));
    ok(r.none.grp && !r.none.grp.cb && r.none.grp.sel === 'catvSup7' && r.none.on === '' && r.none.table.length === 0,
       '★新しい戸別に前の戸別の長さ・チェックが残る → ' + J(r.none));
    ok(is9(r.back) && r.back.old === 'catvKeep', '★PCへ渡す中身を読み直すと 9m に戻らない → ' + J(r.back));
    ok(is9(r.draft), '★下書きを開き直すと 9m に戻らない → ' + J(r.draft));
    ok(r.file && r.file.grp && r.file.grp.cb && r.file.grp.sel === 'catvSup8' && r.file.on === 'catvSup8,poleNew'
       && r.file.table.join() === '柱CATV支給柱建柱（8m）で使用1本', '★PCのファイル（8m）を読み込んでも 8m で出ない → ' + J(r.file));
    ok(r.two.grp && r.two.grp.cb && r.two.grp.sel === 'catvSup8' && r.two.table.join() === '柱CATV支給柱建柱（8m）で使用1本',
       '★2つの長さが true のデータで、画面の長さと部材表が1つ（短い方）にそろわない → ' + J(r.two));
    // 現場で選んだ中身を PC（メイン）で開くと、その長さの柱が積算に乗る
    if(pcState && fs.existsSync(MAIN_PATH)){
      const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
      const pm = await ctx.newPage();
      pm.on('dialog', d => d.accept().catch(()=>{}));
      await pm.goto(url.pathToFileURL(MAIN_PATH).href);
      try { await pm.waitForFunction(() => typeof applyStateData === 'function' && typeof buildBOMForData === 'function' && document.readyState === 'complete', null, { timeout: 30000 }); } catch(_){}
      await pm.waitForTimeout(1500);
      const rm = await pm.evaluate(s => {
        try {
          return buildBOMForData(s, s.qty_overrides || {}).filter(x => /^catv_pole_/.test(x.id)).map(x => [x.id, x.qty, x.material_cost, x.labor_cost].join('|'));
        } catch(e){ return { error: String(e && e.message || e) }; }
      }, pcState);
      await ctx.close();
      console.log('④PCで開く', J(rm));
      ok(Array.isArray(rm) && rm.join() === 'catv_pole_sup9|1|6530|22400,catv_pole_keep|1|0|0',
         '★現場で選んだ 9m を PC で開くと、積算に 9m（材料 6,530・労務 22,400）が1回だけ乗らない → ' + J(rm));
    }
  });

  /* ---------- ⑤ 幅320pxではみ出さない ---------- */
  await scene('⑤', { width: 320, height: 700 }, async page => {
    const meas = () => page.evaluate(() => {
      const host = document.getElementById('apw-host-field');
      const g = host && host.querySelector('.apw-optgrp');
      const w = document.documentElement.clientWidth;
      const bad = [];
      if(host) host.querySelectorAll('.apw-opts > *, .apw-opts select, .apw-opts label, .apw-opts input').forEach(el => {
        const r = el.getBoundingClientRect(); if(r.right > w + 0.5 || r.left < -0.5) bad.push(el.tagName + ':' + el.textContent + ':' + Math.round(r.left) + '-' + Math.round(r.right)); });
      const sel = g && g.querySelector('select'), sr = sel && sel.getBoundingClientRect(), gr = g && g.getBoundingClientRect();
      return { w, sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, bad, on: __on(),
               grp: gr ? [Math.round(gr.left), Math.round(gr.right), Math.round(gr.height)] : null,
               sel: sr ? [Math.round(sr.left), Math.round(sr.right), Math.round(sr.top - gr.top), Math.round(gr.bottom - sr.bottom)] : null };
    });
    const out = [];
    await page.evaluate(() => __fresh(__G({}), { chosho_mgmt_no: '2612MKM013', chosho_cust_name: '三沢市戸別受信設備設置工事の長い名前の方' }));
    out.push(['初め', await meas()]);
    const k1 = await click(page, CB); out.push(['チェック', await meas()]);
    const k2 = await pick(page, SEL, 'catvSup9'); out.push(['9m', await meas()]);
    for(const o of ['poleNew', 'catvKeep', 'catvMove']) await click(page, '#apw-host-field input[data-opt="' + o + '"]');
    out.push(['全部', await meas()]);
    console.log('⑤320px', J(out));
    ok(k1 && k2 && out[3][1].on === 'catvKeep,catvMove,catvSup9,poleNew', '⑤試験の前提: チェック・長さが入らない → ' + J([k1, k2, out[3][1].on]));
    out.forEach(([nm, m]) => {
      ok(m.grp && m.sel, '★幅320px で「CATV支給柱建柱で使用」の枠・長さの選択が無い（' + nm + '） → ' + J(m));
      ok(m.sw <= m.w && m.bw <= m.w && m.bad.length === 0, '★幅320px で横にはみ出す（' + nm + '） → ' + J(m));
      if(m.grp && m.sel) ok(m.sel[0] >= m.grp[0] && m.sel[1] <= m.grp[1] && m.sel[2] >= 0 && m.sel[3] >= 0,
         '★幅320px で長さの選択が枠の外へはみ出す（' + nm + '） → ' + J(m));
      if(m.grp) ok(m.grp[2] <= 44, '幅320px で枠が1行に収まらない（長さの選択が、現場入力のふつうの大きな選択欄の形になっている）（' + nm + '） → ' + J(m));
    });
  });

  /* ---------- ⑥ 取付ガイドの中身がメインと同じ ---------- */
  await scene('⑥', null, async () => {
    const core = t => { const out = []; let i = 0;
      for(;;){ const a = t.indexOf('==ANTENNA-GUIDE-CORE START', i); if(a < 0) break;
        const e = t.indexOf('==ANTENNA-GUIDE-CORE END==', a); if(e < 0) break;
        out.push(t.slice(a, e + 26)); i = e + 26; }
      return out; };
    let cg = [], cm = [];
    try { cg = core(fs.readFileSync(HTML_PATH, 'utf8')); } catch(_){}
    try { cm = core(fs.readFileSync(MAIN_PATH, 'utf8')); } catch(_){}
    console.log('⑥コア', cg.length, cm.length, cg.map((x, k) => x === cm[k]));
    ok(cg.length === 2 && cm.length === 2, '試験の前提: 取付ガイドの中身（CSS と JS）が2か所ずつ無い → 現場 ' + cg.length + ' ／ メイン ' + cm.length);
    ok(cg.length === cm.length && cg.every((x, k) => x === cm[k]), '★取付ガイドの中身（==ANTENNA-GUIDE-CORE==）がメインと1バイトでも違う');
    ok(cg.length === 2 && /catvSup9/.test(cg[1]) && /apw-optgrp/.test(cg[0]), '★取付ガイドの中身に CATV支給柱建柱 が入っていない');
  });

  await b.close();
  ok(errs.length === 0, '★画面でエラーが出た → ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版177（現場入力）');
})();
