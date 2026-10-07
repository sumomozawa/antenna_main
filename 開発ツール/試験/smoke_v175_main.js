/* 版175（メイン＋受付台帳.html）
   その１の工事の人から「受付台帳を読み込んだら、その２になっている」と言われた。
   アプリの中に「その２」と決め打ちした所は無く、PC が前の物件（その２）の名前・地図・履行報告を
   持ち越したまま、その１ の台帳を書き出していた。メイン側の直しを場面ごとに確かめる。
     ⓪ 前提（関数がそろっている・版番号がファイルと同じ）
     ① 地図：その２ の地図を一度読み込んだあと、物件を その１ に替えて「現場用」を作ると、
        その１ の地図だけが入る（その２ の建物が入らない）。戻すと その２ だけ。切り離すとどちらも入らない
     ② その２ を開いたまま、名前の違うフォルダ（その１）を読み込もうとすると、最初の確認に ⚠ と両方の名前が出る。
        「リスト」・同じ名前（全角半角・かっこ違い）・「物件A」・名前なし では ⚠ を出さない（脅さない）
     ③ その２ を開いたまま「新しい物件」を作ると、名前の欄は空で始まり、新しい物件の履行報告に その２ の工事名が残らない。
        物件を開いていないときは、読み込んだフォルダの名前が最初から入る（今までどおり）
     ④ 物件を開かずに「現場用」「受付台帳」を書き出すと、知らせに「物件名が入っていません」。物件を開いていれば出ない
     ⑤ 履行報告：工事名の見本に「その２」を出さない。その１ の物件で初期値（その２ の数字）のままなら知らせる。
        その２ の物件・数字を直したあと・物件なし では知らせない
     ⑥ 受付台帳.html：その２ の名前を覚えた台帳に その１ の台帳ファイルを取り込むと聞く（OK＝その１ に替わり、書き出しも その１。
        キャンセル＝そのまま）。名前が空なら黙って入れる。同じ名前なら聞かない
     ⑦ メインの中に入れてある受付台帳（🌐 HTML のひな型）が 受付台帳.html と同じ（台帳埋込.py を流し忘れていない）
     ⑧ 物件名の見比べ（pjDiffers）：かっこ・全角半角は見ない／「その１」「その２」は番号で決める／片方だけ番号＝分からない
   ★場面ごとに新しいブラウザの入れ物（newContext）を使う★ 前の場面の覚え書き（localStorage・IndexedDB）を持ち越さない。
   使い方: node smoke_v175_main.js [メイン index.html の file:// URL] [受付台帳.html の file:// URL か場所]
     （⑦は いつも置き場所の 受付台帳.html と比べる。別の写しと比べるときは LEDGER_FOR_EMBED=場所 を付ける） */
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
/* 引数は file:// でも、ふつうの場所でもよい */
const asUrl = s => /^(file|https?):/i.test(s) ? s : url.pathToFileURL(path.resolve(s)).href;
const asPath = s => /^file:/i.test(s) ? url.fileURLToPath(s) : (/^https?:/i.test(s) ? '' : path.resolve(s));
const MAIN = asUrl(process.argv[2] || path.join(ROOT, 'antenna_main', 'index.html'));
const LEDGER = asUrl(process.argv[3] || path.join(ROOT, 'antenna_main', '受付台帳.html'));
const MAIN_PATH = asPath(MAIN), LEDGER_PATH = asPath(LEDGER);
/* ⑦で比べる相手は、いつも置き場所の 受付台帳.html（変異で壊した写しを③の引数で渡しても、⑦は赤くならない＝⑥だけで見分けられる）。
   ⑦そのものを壊して確かめるときは LEDGER_FOR_EMBED にその写しの場所を入れる */
const EMBED_LEDGER_PATH = process.env.LEDGER_FOR_EMBED || path.join(ROOT, 'antenna_main', '受付台帳.html');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const WANT_VER = (function(){ try{
  const m = fs.readFileSync(MAIN_PATH, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

/* 試験で使う物件の名前（利用者の物件名と同じ書き方） */
const P1N = '令和８年度戸別受信設備設置工事（その１）';
const P2N = '令和８年度戸別受信設備設置工事（その２）';
const NO1 = '2611BBB001', NO2 = '2612AAA001';

/* ページの中で使う道具（物件と地図シートを作って入れる） */
const SETUP = `
  window.__proj = (id, name, nos, extra) => {
    const now = new Date().toISOString();
    return Object.assign({ schema: PROJ_SCHEMA, id, name, createdAt: now, updatedAt: now,
      cases: (nos || []).map((no, i) => ({ caseId: id + '_c' + i, file: 'manual:' + id + '_' + i, lastModified: 0,
        payload: { chosho_mgmt_no: no, chosho_cust_name: '試験 ' + no, chosho_cust_addr: '三沢市' + i,
                   chosho_status: 'in_progress', work_type: '', _manual: true, _origin: 'manual' } })),
      ledger: {}, takeout: {}, review: {} }, extra || {});
  };
  /* 地図のシート（建物1つ＝管理番号1つにつないだもの）を、その物件のシートとして入れる */
  window.__sheet = (pid, name, no) => ({ id: 'map_' + pid, uid: 'sheet_' + pid, _zentai: false, projectId: pid, name,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', bg: null, print: null, view: { scale:1, tx:0, ty:0 },
    layers: { road:{visible:true,color:'#1976d2',vector:true,objects:[]}, boundary:{visible:true,color:'#8e24aa',objects:[]},
      building:{visible:true,color:'#2e7d32',objects:[{ id:'b_'+pid, type:'building', points:[[0,0],[100,0],[100,100],[0,100]], linkMgmtNo: no }]},
      chome:{visible:true,color:'#e53935',objects:[]}, label:{visible:true,objects:[]} } });
  window.__putSheets = async (list) => {
    const db = await projOpenDb();
    await new Promise((res, rej) => { const tx = db.transaction('mapSheets', 'readwrite'); const st = tx.objectStore('mapSheets');
      list.forEach(s => st.put(s)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  };
  window.__marks = pack => (pack || []).reduce((a, s) => a.concat(Object.keys(s.marks || {})), []).sort();
  /* 保存先を選ぶ窓の代わり（書いた中身を覚えておく）。false を渡すと窓が無い端末（ダウンロードへ落ちる道）にする */
  window.__saved = [];
  window.__savePicker = on => {
    if(!on){ window.showSaveFilePicker = undefined; return; }
    window.showSaveFilePicker = async (opts) => ({ name: opts && opts.suggestedName,
      createWritable: async () => { let buf = ''; return { write: async t => { buf += (typeof t === 'string') ? t : await t.text(); },
        close: async () => { window.__saved.push({ name: opts && opts.suggestedName, text: buf }); } }; } });
  };
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const errs = [];
/* 新しい入れ物でページを開く。出た窓（alert/confirm/prompt）は said に残し、answers の順に答える
   （true＝OK／false＝キャンセル／文字＝prompt にその文字を入れて OK。answers が空なら OK＝既定のまま） */
async function openPage(target, label){
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const said = [], answers = [];
  page.on('pageerror', e => errs.push(label + ' pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type() === 'error' && !/Failed to load resource/.test(t)) errs.push(label + ' console: ' + t); });
  page.on('dialog', d => {
    const a = answers.length ? answers.shift() : true;
    said.push({ type: d.type(), msg: d.message(), def: d.defaultValue() });
    if(a === false) d.dismiss().catch(()=>{});
    else if(d.type() === 'prompt') d.accept(typeof a === 'string' ? a : d.defaultValue()).catch(()=>{});
    else d.accept().catch(()=>{});
  });
  page.on('download', dl => { dl.cancel().catch(()=>{}); });
  await page.goto(target);
  return { ctx, page, said, answers };
}
async function openMain(label){
  const o = await openPage(MAIN, label);
  await o.page.waitForFunction(() => typeof applyProject === 'function' && typeof window.mapCollectViewerPack === 'function'
    && document.readyState === 'complete', null, { timeout: 30000 });
  await sleep(2500);   // 起動の続き（保存の読み戻しなど）が済むのを待つ
  await o.page.evaluate(SETUP);
  o.said.length = 0;
  return o;
}

(async () => {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

  // ---- ⓪ 前提 ----
  {
    const { ctx, page } = await openMain('⓪');
    const r0 = await page.evaluate(() => ({
      f: ['applyProject','projIdbPut','projIdbGet','projOpenDb','projSaveNow','detachProject','createProjectFlow',
          'resolveListLoadWithProject','listSelectFolder','exportGenbaSet','exportReceptionLedgerForGenba',
          'buildReceptionLedgerPayload','hkLoad','openListView','closeMenuView','setListMode']
           .filter(n => typeof window[n] !== 'function')
         .concat(['mapCollectViewerPack','openMapView','closeMapView'].filter(n => typeof window[n] !== 'function')),
      ver: APP_VERSION
    }));
    console.log('⓪前提', JSON.stringify(r0));
    ok(r0.f.length === 0, '試験の前提: 無い関数がある → ' + r0.f.join(' / '));
    ok(!!WANT_VER && r0.ver === WANT_VER, '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + r0.ver + ' ／ ファイル ' + WANT_VER);
    await ctx.close();
    if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await browser.close(); process.exit(1); }
  }

  // ---- ① 地図：物件を替えたら、現場用に入る地図も替わる ----
  {
    const { ctx, page, said } = await openMain('①');
    const r1 = await page.evaluate(async ({ P1N, P2N, NO1, NO2 }) => {
      await __putSheets([ __sheet('pjS2', 'A地区（その２）の地図', NO2), __sheet('pjS1', 'B地区（その１）の地図', NO1) ]);
      const P2 = __proj('pjS2', P2N, [NO2]), P1 = __proj('pjS1', P1N, [NO1]);
      await projIdbPut(P2); await projIdbPut(P1);
      await applyProject(P2, { silent: true });
      // その２ で地図画面を開いて閉じる（＝シートを読み込んだ状態にする）
      openMapView(); await new Promise(r => setTimeout(r, 1500));
      closeMapView(); await new Promise(r => setTimeout(r, 300));
      const at2 = __marks(await window.mapCollectViewerPack());
      // その１ に替える → 現場用の地図
      await applyProject(P1, { silent: true });
      const at1 = __marks(await window.mapCollectViewerPack());
      // 地図の画面に残っているシート（閉じていても中で開いている1枚）。その２ のシートを開いたままにしない
      const at1Dom = [...document.querySelectorAll('#map-layer-building [data-obj-id]')].map(e => e.getAttribute('data-obj-id'));
      // 「📦 現場用」の書き出しそのもの（保存先を選ぶ窓の道）
      __savePicker(true); __saved.length = 0;
      await exportGenbaSet();
      let set = null; try { set = JSON.parse((__saved[0] || {}).text || 'null'); } catch(_){}
      const setMarks = set && set.map ? __marks(set.map.sheets) : [];
      // その２ へ戻す → その２ だけ
      await applyProject(P2, { silent: true });
      const back2 = __marks(await window.mapCollectViewerPack());
      // 切り離す（物件なし）→ どちらの物件の建物も入らない
      detachProject();
      const local = __marks(await window.mapCollectViewerPack());
      return { at2, at1, at1Dom, back2, local, setProj: set && set.project, setLedgerProj: set && set.ledger && set.ledger.project,
               setMarks, setSheets: set && set.map ? set.map.sheets.map(s => s.name) : null };
    }, { P1N, P2N, NO1, NO2 });
    console.log('①地図', JSON.stringify(r1));
    ok(r1.at2.join(',') === NO2, '試験の前提: その２ の地図が読めていない → ' + JSON.stringify(r1.at2));
    ok(r1.at1.join(',') === NO1, '★物件を その１ に替えても、現場用の地図が その２ のまま（その１ の建物が入らない／その２ の建物が入る） → ' + JSON.stringify(r1.at1));
    ok(r1.at1Dom.indexOf('b_pjS2') < 0 && r1.at1Dom.indexOf('b_pjS1') >= 0,
       '★物件を その１ に替えて現場用の地図を作ったあとも、地図の中で その２ のシートが開いたまま → ' + JSON.stringify(r1.at1Dom));
    ok(r1.setProj === P1N && r1.setLedgerProj === P1N, '現場用ファイルの物件名が その１ でない → ' + JSON.stringify([r1.setProj, r1.setLedgerProj]));
    ok(r1.setMarks.join(',') === NO1, '★「📦 現場用」のファイルに その２ の地図が入る → ' + JSON.stringify({ marks: r1.setMarks, sheets: r1.setSheets }));
    ok(r1.back2.join(',') === NO2, '★その２ に戻しても、地図が その１ のまま → ' + JSON.stringify(r1.back2));
    ok(r1.local.indexOf(NO1) < 0 && r1.local.indexOf(NO2) < 0, '★物件を切り離したのに、物件の地図が現場用に入る → ' + JSON.stringify(r1.local));
    await ctx.close();
  }

  // ---- ② フォルダの名前が、開いている物件と違うときの知らせ ----
  {
    const { ctx, page, said, answers } = await openMain('②');
    await page.evaluate(async ({ P2N, NO2 }) => {
      const P2 = __proj('pjF2', P2N, [NO2]); await projIdbPut(P2); await applyProject(P2, { silent: true });
    }, { P2N, NO2 });
    const cases = [
      ['その１', P1N, true],
      ['その１（半角・かっこ違い）', '令和8年度戸別受信設備設置工事(その1)', true],
      ['リスト', 'リスト', false],
      ['同じ名前', P2N, false],
      ['同じ名前（半角・かっこ違い）', '令和8年度 戸別受信設備設置工事(その2)', false],
      ['物件A', '物件A', false],
      ['名前なし', undefined, false],
      ['空', '', false]
    ];
    const r2 = {};
    for(const [lab, fn, want] of cases){
      said.length = 0; answers.length = 0; answers.push(true);   // 最初の確認で OK（＝取り込む。何も読まない）
      const mode = await page.evaluate(fn => resolveListLoadWithProject(fn), fn);
      const m = (said[0] || {}).msg || '';
      r2[lab] = { mode, n: said.length, warn: /^⚠/.test(m), head: m.split('\n')[0] };
      if(want){
        ok(mode === 'absorb' && said.length === 1, '試験の前提: OK で取り込みにならない → ' + lab + ' ' + JSON.stringify(r2[lab]));
        ok(/^⚠/.test(m), '★その２ を開いたまま 別の名前のフォルダ（' + lab + '）を読み込んでも、最初の確認に ⚠ が出ない → ' + JSON.stringify(m.slice(0, 120)));
        ok(m.indexOf('「' + fn + '」') >= 0 && m.indexOf('「' + P2N + '」') >= 0,
           '★⚠ の知らせに、選んだフォルダと開いている物件の名前が両方出ない → ' + JSON.stringify(m.slice(0, 200)));
        ok(/切り離して読み込む/.test(m) && /キャンセル/.test(m), '⚠ の知らせに「キャンセル → 切り離して読み込む」の案内が無い → ' + JSON.stringify(m.slice(0, 200)));
      } else {
        ok(mode === 'absorb' && said.length === 1 && !/^⚠/.test(m) && m.indexOf('⚠') < 0,
           '★「' + lab + '」のフォルダで ⚠ が出る（見当違いで脅す） → ' + JSON.stringify(r2[lab]));
      }
    }
    // 番号の無い物件名のとき：「リスト」は物件の中のフォルダなので比べない。名前の一部なら同じ物件とみる
    await page.evaluate(async () => { const PA = __proj('pjFA', 'A地区 アンテナ改修工事', ['2613CCC001']); await projIdbPut(PA); await applyProject(PA, { silent: true }); });
    for(const [lab, fn, want] of [['番号なし物件に「リスト」', 'リスト', false], ['番号なし物件に「Ａ地区」', 'Ａ地区', false],
                                  ['番号なし物件に「B地区 アンテナ改修工事」', 'B地区 アンテナ改修工事', true]]){
      said.length = 0; answers.length = 0; answers.push(true);
      const mode = await page.evaluate(fn => resolveListLoadWithProject(fn), fn);
      const m = (said[0] || {}).msg || '';
      r2[lab] = { mode, n: said.length, warn: /^⚠/.test(m) };
      ok(mode === 'absorb' && said.length === 1 && /^⚠/.test(m) === want,
         (want ? '★別の物件のフォルダ（' : '★見当違いで ⚠ が出る（') + lab + '） → ' + JSON.stringify(m.slice(0, 120)));
    }
    await page.evaluate(async () => { await applyProject(await projIdbGet('pjF2'), { silent: true }); });
    // 「📁 フォルダ」の道（選んだフォルダの名前が渡っているか）。キャンセル→キャンセル＝中止なので何も読まない
    said.length = 0; answers.length = 0; answers.push(false, false);
    const r2b = await page.evaluate(async (P1N) => {
      const keep = window.showDirectoryPicker;
      window.showDirectoryPicker = async () => ({ kind: 'directory', name: P1N });
      try { await listSelectFolder(); } finally { window.showDirectoryPicker = keep; }
      return { proj: _currentProject && _currentProject.name, rows: _listRows.length };
    }, P1N);
    const mb = (said[0] || {}).msg || '';
    r2.folder = { first: mb.split('\n')[0], n: said.length, after: r2b };
    console.log('②フォルダの名前', JSON.stringify(r2));
    ok(/^⚠/.test(mb) && mb.indexOf(P1N) >= 0, '★「📁 フォルダ」で その１ のフォルダを選んでも、⚠ が出ない（フォルダの名前が渡っていない） → ' + JSON.stringify(mb.slice(0, 160)));
    ok(said.length === 2 && r2b.proj === P2N && r2b.rows === 1, 'キャンセル→キャンセル で中止にならない → ' + JSON.stringify(r2.folder));
    await ctx.close();
  }

  // ---- ③ 新しい物件：その２ の名前と履行報告を持ち込まない ----
  {
    const { ctx, page, said, answers } = await openMain('③');
    const NEWN = '新しい工事（その１）';
    answers.push(NEWN, false);   // prompt に新しい名前／「一覧を入れますか？」はキャンセル（＝空の物件）
    const r3 = await page.evaluate(async ({ P2N, NO2, NEWN }) => {
      const P2 = __proj('pjN2', P2N, [NO2], { hakou: { head: { name: P2N, net: 27200000 }, rate:{}, src:{}, manual:{}, snap:{}, span:{} } });
      await projIdbPut(P2); await applyProject(P2, { silent: true });
      const before = { hk: hkLoad().head.name, folder: _listSelectedFolderName };
      await createProjectFlow();
      await new Promise(r => setTimeout(r, 300));
      const h = hkLoad();
      const head = (h && h.head && typeof h.head === 'object') ? h.head : null;
      await projSaveNow();
      const saved = await projIdbGet(_currentProject.id);
      const old = await projIdbGet('pjN2');
      const sh = saved && saved.hakou;
      return { before, name: _currentProject.name, newId: _currentProject.id,
               hk: head ? (head.name || '') : '(頭なし)', net: head ? head.net : '(頭なし)',
               subs: ['rate','src','manual','snap','span'].filter(k => !h || !h[k] || typeof h[k] !== 'object'),
               savedHk: !sh ? '(履行報告なし)' : (sh.head ? (sh.head.name || '') : '(頭なし)'),
               savedNet: sh && sh.head ? sh.head.net : null,
               ledgerProj: buildReceptionLedgerPayload().project, rows: _listRows.length,
               oldHk: old && old.hakou && old.hakou.head && old.hakou.head.name };
    }, { P2N, NO2, NEWN });
    // 新しい物件で履行報告の画面が開ける（工事名は空・見本は新しい物件名）
    const r3v = await page.evaluate(() => {
      try { closeMenuView(); openListView(); setListMode('progress'); return ''; } catch(e){ return String(e && e.message); }
    });
    let r3view = null;
    try { await page.waitForSelector('#hk-name', { timeout: 8000 });
      r3view = await page.evaluate(() => ({ val: document.getElementById('hk-name').value, ph: document.getElementById('hk-name').getAttribute('placeholder') }));
    } catch(_){}
    const s3 = said.map(x => ({ type: x.type, def: x.def, msg: x.msg.slice(0, 80) }));
    console.log('③新しい物件', JSON.stringify({ r3, said: s3, view: r3view, viewErr: r3v }));
    ok(r3.before.hk === P2N && r3.before.folder === P2N, '試験の前提: その２ の履行報告・フォルダ名が入っていない → ' + JSON.stringify(r3.before));
    ok(said[0] && said[0].type === 'prompt' && said[0].def === '',
       '★物件を開いたまま「新しい物件」を押すと、名前の欄に前の物件の名前が最初から入っている → ' + JSON.stringify(said[0] && said[0].def));
    ok(said[1] && said[1].type === 'confirm' && said[1].msg.indexOf('「' + P2N + '」') >= 0,
       '「一覧を入れますか？」に、いま開いている物件の名前が出ない → ' + JSON.stringify(said[1] && said[1].msg.slice(0, 120)));
    ok(r3.name === NEWN && r3.newId !== 'pjN2' && r3.ledgerProj === NEWN && r3.rows === 0,
       '試験の前提: 新しい物件が空で作られていない → ' + JSON.stringify(r3));
    ok(r3.hk === '' || r3.hk === '(頭なし)', '★新しい物件の履行報告に、前の物件（その２）の工事名が残る → ' + JSON.stringify(r3.hk));
    ok(r3.net === 27200000 && r3.subs.length === 0,
       '★新しい物件の履行報告が空っぽ（初期値が入っていない）→ 履行報告の画面が開けない → ' + JSON.stringify({ net: r3.net, 無い: r3.subs }));
    ok(r3.savedHk !== P2N, '★保存した新しい物件に、その２ の工事名が入る → ' + JSON.stringify(r3.savedHk));
    ok(r3.savedHk !== '(頭なし)', '★保存した新しい物件の履行報告が空（{}）で、開き直しても履行報告の画面が開けない → ' + JSON.stringify({ savedHk: r3.savedHk }));
    ok(r3v === '' && !!r3view && r3view.val === '' && r3view.ph === NEWN,
       '★新しい物件で履行報告の画面が開けない（または前の物件の工事名が出る） → ' + JSON.stringify({ err: r3v, view: r3view }));
    ok(r3.oldHk === P2N, '★その２ の物件の履行報告が消える → ' + JSON.stringify(r3.oldHk));
    await ctx.close();
  }
  {
    // 物件を開いていないとき：読み込んだフォルダの名前が最初から入る（今までどおり）
    const { ctx, page, said, answers } = await openMain('③b');
    answers.push(false);   // prompt をキャンセル（何も作らない）
    const r3b = await page.evaluate(async () => {
      _listSelectedFolderName = 'B地区フォルダ（その１）';
      await createProjectFlow();
      return { proj: _currentProject };
    });
    console.log('③b物件なしで新しい物件', JSON.stringify({ r3b, said: said.map(x => ({ type: x.type, def: x.def })) }));
    ok(said[0] && said[0].type === 'prompt' && said[0].def === 'B地区フォルダ（その１）',
       '物件を開いていないとき、読み込んだフォルダの名前が名前の欄に入らない（今までと違う） → ' + JSON.stringify(said[0] && said[0].def));
    ok(r3b.proj === null, 'prompt をキャンセルしたのに物件が作られる → ' + JSON.stringify(r3b.proj));
    await ctx.close();
  }

  // ---- ④ 物件を開かずに書き出すと「物件名が入っていません」 ----
  {
    const { ctx, page, said } = await openMain('④');
    const NOTE = /物件名が入っていません/;
    const run = async (fn, picker) => {
      said.length = 0;
      const r = await page.evaluate(async ({ fn, picker }) => {
        __savePicker(picker); __saved.length = 0;
        await window[fn]();
        let p = null; try { p = JSON.parse((__saved[0] || {}).text || 'null'); } catch(_){}
        return { proj: p ? p.project : '(窓なし＝ダウンロード)' };
      }, { fn, picker });
      const al = said.filter(x => x.type === 'alert').map(x => x.msg);
      return { proj: r.proj, n: al.length, note: al.some(m => NOTE.test(m)), last: (al[al.length - 1] || '').slice(-120) };
    };
    // 物件なし：台帳の行だけある（フォルダを読み込んだだけ）
    await page.evaluate((NO1) => {
      _listRows = [{ file: NO1 + '.json', fileType: 'plain', lastModified: 0,
        data: { chosho_mgmt_no: NO1, chosho_cust_name: '試験 太郎', chosho_cust_addr: '三沢市', chosho_status: 'in_progress' } }];
    }, NO1);
    const a1 = await run('exportGenbaSet', true);
    const a2 = await run('exportGenbaSet', false);
    const a3 = await run('exportReceptionLedgerForGenba', true);
    const a4 = await run('exportReceptionLedgerForGenba', false);
    // 物件あり（その１）
    await page.evaluate(async ({ P1N, NO1 }) => { const P1 = __proj('pjE1', P1N, [NO1]); await projIdbPut(P1); await applyProject(P1, { silent: true }); }, { P1N, NO1 });
    const b1 = await run('exportGenbaSet', true);
    const b2 = await run('exportGenbaSet', false);
    const b3 = await run('exportReceptionLedgerForGenba', true);
    const b4 = await run('exportReceptionLedgerForGenba', false);
    console.log('④物件名なしの書き出し', JSON.stringify({ a1, a2, a3, a4, b1, b2, b3, b4 }));
    ok(a1.n === 1 && a1.proj === '', '試験の前提: 物件なしの現場用が書き出せていない → ' + JSON.stringify(a1));
    ok(a1.note, '★物件を開かずに「📦 現場用」を書き出しても、物件名が入っていないと言わない（保存先を選ぶ道） → ' + JSON.stringify(a1));
    ok(a2.note, '★物件を開かずに「📦 現場用」を書き出しても、物件名が入っていないと言わない（ダウンロードの道） → ' + JSON.stringify(a2));
    ok(a3.note, '★物件を開かずに「受付台帳」を書き出しても、物件名が入っていないと言わない（保存先を選ぶ道） → ' + JSON.stringify(a3));
    ok(a4.note, '★物件を開かずに「受付台帳」を書き出しても、物件名が入っていないと言わない（ダウンロードの道） → ' + JSON.stringify(a4));
    ok(b1.proj === P1N && b3.proj === P1N, '試験の前提: 物件ありの書き出しに物件名が入っていない → ' + JSON.stringify([b1.proj, b3.proj]));
    ok([b1, b2, b3, b4].every(x => x.n === 1 && !x.note), '★物件を開いているのに「物件名が入っていません」と出る → ' + JSON.stringify([b1, b2, b3, b4]));
    await ctx.close();
  }

  // ---- ⑤ 履行報告：「その２」の見本・初期値 ----
  {
    const { ctx, page } = await openMain('⑤');
    const look = async () => {
      await page.evaluate(() => { closeMenuView(); openListView(); setListMode('progress'); });
      await page.waitForSelector('#hk-name', { timeout: 15000 });
      await sleep(300);
      return page.evaluate(() => ({
        ph: document.getElementById('hk-name').getAttribute('placeholder'),
        val: document.getElementById('hk-name').value,
        init: !!document.querySelector('.hk-init'),
        initText: (document.querySelector('.hk-init') || {}).textContent || '',
        fn: (typeof hkHeadIsSono2Default === 'function') ? hkHeadIsSono2Default(hkLoad()) : '(関数なし)',
        net: hkLoad().head.net
      }));
    };
    const r5 = {};
    r5.none = await look();   // 物件なし
    await page.evaluate(async ({ P1N, NO1 }) => { const P1 = __proj('pjH1', P1N, [NO1]); await projIdbPut(P1); await applyProject(P1, { silent: true }); }, { P1N, NO1 });
    r5.p1 = await look();
    // 請負金額を直す（画面の欄に打つ）→ 知らせが消える
    await page.fill('#hk-net', '15000000');
    await page.dispatchEvent('#hk-net', 'change');
    await sleep(500);
    r5.p1net = await look();
    await page.evaluate(async ({ P2N, NO2 }) => { const P2 = __proj('pjH2', P2N, [NO2]); await projIdbPut(P2); await applyProject(P2, { silent: true }); }, { P2N, NO2 });
    r5.p2 = await look();
    console.log('⑤履行報告', JSON.stringify(r5));
    // 見本は「開いている物件の名前」か「例：…」。その２ の物件なら その２ と出るのは正しい
    for(const k of ['none', 'p1']){
      ok(!/その[2２]/.test(r5[k].ph || ''), '★履行報告の工事名の見本に「その２」が出る（' + k + '） → ' + JSON.stringify(r5[k].ph));
    }
    ok(r5.p1.ph === P1N, '物件を開いているのに、工事名の見本が物件名でない → ' + JSON.stringify(r5.p1.ph));
    ok(r5.p1.val === '', '試験の前提: その１ の工事名が空でない → ' + JSON.stringify(r5.p1.val));
    ok(r5.p1.net === 27200000, '試験の前提: その１ の請負金額が初期値でない → ' + JSON.stringify(r5.p1.net));
    ok(r5.p1.fn === true && r5.p1.init, '★その１ の物件で、請負金額などが その２ の初期値のままなのに知らせない → ' + JSON.stringify(r5.p1));
    ok(/その２/.test(r5.p1.initText) && /直して/.test(r5.p1.initText), '知らせの文に「その２の初期値」「直して」が無い → ' + JSON.stringify(r5.p1.initText));
    ok(r5.p1net.net === 15000000 && r5.p1net.fn === false && !r5.p1net.init, '★請負金額を直したのに、まだ初期値のままと知らせる → ' + JSON.stringify(r5.p1net));
    ok(r5.p2.net === 27200000 && r5.p2.fn === false && !r5.p2.init, '★その２ の物件で「その２ の初期値のまま」と知らせる（その２ では正しい数字） → ' + JSON.stringify(r5.p2));
    ok(r5.none.fn === false && !r5.none.init, '物件を開いていないのに知らせる → ' + JSON.stringify(r5.none));
    await ctx.close();
  }

  // ---- ⑥ 受付台帳.html：取り込んだファイルの物件名を使う ----
  {
    const fileOf = (project) => ({ name: '受付台帳_試験.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ type: 'antenna_reception_ledger', version: 5, project,
        rows: [{ mgmt_no: NO1, name: '山田 一郎', addr: '三沢市1', status: 'in_progress' }] })) });
    const importVia = async (page, project) => {
      const fcP = page.waitForEvent('filechooser');
      await page.click('#btn-import');
      const fc = await fcP; await fc.setFiles(fileOf(project));
      await page.waitForFunction(no => buildLedgerFile().rows.some(x => x.mgmt_no === no), NO1, { timeout: 10000 });
      await sleep(600);   // 自動保存（0.3秒後）が済むのを待つ
    };
    const state = page => page.evaluate(() => ({ field: document.getElementById('proj-name').value, out: buildLedgerFile().project,
                                                 rows: buildLedgerFile().rows.map(x => x.mgmt_no) }));
    const openLedger = async (label, name) => {
      const o = await openPage(LEDGER, label);
      await o.page.waitForFunction(() => typeof buildLedgerFile === 'function' && !!document.getElementById('proj-name'), null, { timeout: 15000 });
      await sleep(800);
      if(name){
        // その２ の名前で使っていた台帳（この端末に保存して開き直す）
        await o.page.fill('#proj-name', name);
        await o.page.evaluate(() => saveNow(true));
        await o.page.reload();
        await o.page.waitForFunction(() => typeof buildLedgerFile === 'function', null, { timeout: 15000 });
        await sleep(800);
      }
      o.said.length = 0;
      return o;
    };
    const r6 = {};
    // A. その２ → その１ を取り込む → 聞かれる → OK
    {
      const { ctx, page, said, answers } = await openLedger('⑥A', P2N);
      r6.before = await state(page);
      answers.push(true);
      await importVia(page, P1N);
      r6.A = Object.assign(await state(page), { said: said.map(x => x.type + ':' + x.msg.slice(0, 120)) });
      await page.reload(); await page.waitForFunction(() => typeof buildLedgerFile === 'function'); await sleep(800);
      r6.Areload = await state(page);
      await ctx.close();
    }
    // B. その２ → その１ を取り込む → 聞かれる → キャンセル（そのまま）
    {
      const { ctx, page, said, answers } = await openLedger('⑥B', P2N);
      answers.push(false);
      await importVia(page, P1N);
      r6.B = Object.assign(await state(page), { said: said.map(x => x.type) });
      await ctx.close();
    }
    // C. 名前が空 → 黙って入れる
    {
      const { ctx, page, said } = await openLedger('⑥C', '');
      await importVia(page, P1N);
      r6.C = Object.assign(await state(page), { said: said.map(x => x.type + ':' + x.msg.slice(0, 60)) });
      await ctx.close();
    }
    // D. 同じ名前 → 聞かない
    {
      const { ctx, page, said } = await openLedger('⑥D', P1N);
      await importVia(page, P1N);
      r6.D = Object.assign(await state(page), { said: said.map(x => x.type) });
      await ctx.close();
    }
    // E. ファイルに物件名が無い → 今の名前のまま・聞かない
    //    つづけて、同じ行の その１ のファイルを取り込む（行は何も変わらない）→ OK → 開き直しても その１（名前だけでも保存する）
    {
      const { ctx, page, said, answers } = await openLedger('⑥E', P2N);
      await importVia(page, '');
      r6.E = Object.assign(await state(page), { said: said.map(x => x.type) });
      said.length = 0; answers.length = 0; answers.push(true);
      await importVia(page, P1N);
      r6.E2 = Object.assign(await state(page), { said: said.map(x => x.type) });
      await page.reload(); await page.waitForFunction(() => typeof buildLedgerFile === 'function'); await sleep(800);
      r6.E2reload = await state(page);
      await ctx.close();
    }
    console.log('⑥受付台帳.html', JSON.stringify(r6));
    ok(r6.before.field === P2N && r6.before.out === P2N, '試験の前提: 受付台帳.html が その２ の名前を覚えていない → ' + JSON.stringify(r6.before));
    const qa = (r6.A.said || []).filter(s => /^confirm:/.test(s));
    ok(qa.length === 1 && qa[0].indexOf(P1N) >= 0 && qa[0].indexOf(P2N) >= 0,
       '★その２ の台帳に その１ のファイルを取り込んでも、物件名を変えるか聞かない（両方の名前を出して） → ' + JSON.stringify(r6.A.said));
    ok(r6.A.field === P1N && r6.A.out === P1N, '★OK を押しても、物件名の欄・書き出す台帳の物件名が その１ にならない → ' + JSON.stringify(r6.A));
    ok(r6.A.rows.join(',') === NO1, '取り込んだ行が入っていない → ' + JSON.stringify(r6.A.rows));
    ok(r6.Areload.field === P1N && r6.Areload.out === P1N, '★開き直すと物件名が その２ に戻る（この端末に保存していない） → ' + JSON.stringify(r6.Areload));
    ok(r6.B.said.join(',') === 'confirm' && r6.B.field === P2N && r6.B.out === P2N, '★「キャンセル＝いまのまま」の道：聞かれない／物件名が変わる → ' + JSON.stringify(r6.B));
    ok(r6.B.rows.join(',') === NO1, 'キャンセルしたら行まで取り込まれない（物件名だけの問い） → ' + JSON.stringify(r6.B.rows));
    ok(r6.C.said.length === 0, '★物件名が空の台帳で、聞かなくてよいのに聞く → ' + JSON.stringify(r6.C.said));
    ok(r6.C.field === P1N && r6.C.out === P1N, '★物件名が空の台帳に取り込んでも、ファイルの物件名が入らない → ' + JSON.stringify(r6.C));
    ok(r6.D.said.length === 0 && r6.D.field === P1N, '同じ物件名なのに聞く → ' + JSON.stringify(r6.D));
    ok(r6.E.said.length === 0 && r6.E.field === P2N && r6.E.out === P2N, '物件名の無いファイルで、今の物件名が消える／聞かれる → ' + JSON.stringify(r6.E));
    ok(r6.E2.said.join(',') === 'confirm' && r6.E2.field === P1N, '★行が同じ その１ のファイルで、物件名を変えるか聞かない／変わらない → ' + JSON.stringify(r6.E2));
    ok(r6.E2reload.field === P1N && r6.E2reload.out === P1N, '★物件名だけ変えたとき、この端末に保存していない（開き直すと その２ に戻る） → ' + JSON.stringify(r6.E2reload));
  }

  // ---- ⑦ メインに入れてある受付台帳が 受付台帳.html と同じ ----
  {
    let same = null, why = '';
    try {
      const mainTxt = fs.readFileSync(MAIN_PATH, 'utf8');
      const m = mainTxt.match(/<script type="text\/plain" id="ledger-app-template" data-encoding="base64">([\s\S]*?)<\/script>/);
      if(!m) why = 'メインに受付台帳のひな型が無い';
      else {
        let led = fs.readFileSync(EMBED_LEDGER_PATH);
        if(led[0] === 0xef && led[1] === 0xbb && led[2] === 0xbf) led = led.slice(3);
        const emb = Buffer.from(m[1].replace(/\s+/g, ''), 'base64');
        same = Buffer.compare(emb, led) === 0;
        if(!same) why = 'ひな型 ' + emb.length + ' バイト ／ 受付台帳.html ' + led.length + ' バイト';
      }
    } catch(e){ why = String(e && e.message); }
    // 道具（台帳埋込.py --check）でも確かめる。最新＝0
    const py = cp.spawnSync('python3', [path.join(ROOT, 'antenna_main', '開発ツール', '台帳埋込.py'), '--check',
      '--main', MAIN_PATH, '--ledger', EMBED_LEDGER_PATH], { encoding: 'utf8' });
    console.log('⑦ひな型', JSON.stringify({ same, why, py: py.status }));
    ok(same === true, '★メインの中の受付台帳（🌐 HTML のひな型）が 受付台帳.html と違う（台帳埋込.py を流していない） → ' + why);
    ok(py.status === 0, '★台帳埋込.py --check が「古い」と言う → 終了番号 ' + py.status + ' ' + String(py.stdout || '').split('\n').slice(-3).join(' ') + String(py.stderr || ''));
  }

  // ---- ⑧ 物件名の見比べ ----
  {
    const { ctx, page } = await openMain('⑧');
    const r8 = await page.evaluate(({ P1N, P2N }) => {
      if(typeof pjDiffers !== 'function') return null;
      const T = [
        [P1N, P2N, true],
        ['令和8年度戸別受信設備設置工事(その1)', P2N, true],
        ['令和8年度 戸別受信設備設置工事(その2)', P2N, false],
        ['工事（その一）', '工事（その１）', false],
        ['工事（その二）', '工事（その１）', true],
        ['工事（その10）', '工事（その１）', true],
        ['物件A', P2N, false],          // 片方にだけ番号＝分からない（脅さない）
        [P1N, '物件A', false],
        ['', P2N, false], [P2N, '', false], [null, undefined, false],
        ['A地区 アンテナ改修工事', 'B地区 アンテナ改修工事', true],
        ['A地区', 'A地区 アンテナ改修工事', false]   // 片方がもう片方の一部＝同じ物件とみる
      ];
      return T.map(([a, b, w]) => ({ a, b, w, got: pjDiffers(a, b) })).filter(x => x.got !== x.w);
    }, { P1N, P2N });
    console.log('⑧物件名の見比べ', JSON.stringify(r8));
    ok(r8 !== null, '★物件名を見比べる仕組み（pjDiffers）が無い');
    ok(!r8 || r8.length === 0, '★物件名の見比べが違う → ' + JSON.stringify(r8));
    await ctx.close();
  }

  await browser.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0, 4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v175_main');
})().catch(async e => {
  console.log('FAIL 試験そのものが止まった: ' + (e && e.stack || e));
  try { if(browser) await browser.close(); } catch(_){}
  process.exit(1);
});
