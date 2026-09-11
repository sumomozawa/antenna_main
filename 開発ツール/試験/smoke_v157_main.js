/* 版157: メイン（PC）の版157の直しを4つ見る。
   ① アパートの説明欄の「気づき」（電源部位置の注意・共用部なしの分配器・分配器の空き口数）
   ② その直しで金額（積算）が動いていないこと＝共用部ボックスの「いまの決まり」
   ③ 受付台帳の「ビラ」の列が「ビラ済」になり、説明に意味が書かれている
   ④ Excel の取り込みで「ビラ済」「ビラ」どちらの見出しでも拾える
   ⑤ 印刷の列名も「ビラ済」
   走らせ方: node smoke_v157_main.js  （別の場所のメインを見るときは引数でファイルのURLを渡す） */
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
const MAIN = process.argv[2] || FILE('antenna_main');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:1280,height:900} });
  const errs = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  /* メインは4万行を超えるので、読み込みは長めに待つ。 */
  await page.goto(MAIN); await page.waitForTimeout(6000);

  const ready = await page.evaluate(() => ({
    ver: (typeof APP_VERSION !== 'undefined') ? String(APP_VERSION) : '',
    f: ['aptNoteHtml','aptSyncUi','aptSplitterPlan','aptBoxPartsId','buildBOMForData',
        'createManualRow','renderListLedgerMode','lgXlsxAsLedgerPayload']
         .filter(n => typeof window[n] !== 'function'),
    g: ['apt_units','apt_idx','apt_common','apt_bldg','power_pos','is_catv','chosho_mgmt_no']
         .filter(id => !document.getElementById(id))
  }));
  console.log('⓪読み込み', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: メインに無い関数がある → ' + ready.f.join(' / '));
  ok(ready.g.length === 0, '試験の前提: メインに無い入力欄がある → ' + ready.g.join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    /* アパートの欄へ値を入れてから説明を作らせる（aptNoteHtml は画面の欄を読む）。
       欄は「世帯数を選ばないと隠れている」が、隠れていても値は入れられる。 */
    window.__aptNote = o => {
      const set = (id, v) => { const e = document.getElementById(id); e.value = v; };
      set('chosho_mgmt_no', o.mgmt || 'V1570001');
      set('apt_bldg', '');
      set('apt_units', String(o.units));
      set('apt_common', o.common || 'yes');
      set('is_catv', o.catv || 'no');
      set('power_pos', o.pos || 'tv_back');
      aptSyncUi();                       // 「何世帯目」の選択肢を世帯数に合わせて作り直させる
      set('apt_idx', String(o.idx || 1));
      return aptNoteHtml(o.units);
    };
    /* 積算。保存データの形からそのまま組める buildBOMForData を使う。 */
    window.__bom = o => {
      const d = Object.assign({
        work_type:'new', amplifier:'uhf_b', is_catv:'no', antenna_main:'u206', ch46:'no',
        tv_count:'1', indoor_split:'unknown', box_consent:'yes', cable_vvf_len:'5',
        chosho_mgmt_no:'V1570001', power_pos:'outside',
        apt_units:'5', apt_idx:'1', apt_common:'yes' }, o || {});
      const bom = buildBOMForData(d, {});
      const box = bom.filter(i => /^box_/.test(i.id));
      return { boxes: box.map(i => i.id), qty: box.map(i => i.qty),
               note: box.map(i => i.note || '').join(' / '),
               total: calcTotals(bom, 'excl', 'exclude').total, rows: bom.length };
    };
  });

  // ---- ① 共用部あり・代表で、電源部位置が「外部」でないときだけ注意が出る ----
  const r1 = await page.evaluate(() => {
    const has = h => /ボックス本体が金額に入りません/.test(h);
    const rep   = __aptNote({ units:5, common:'yes', idx:1, pos:'tv_back' });
    const repNS = __aptNote({ units:5, common:'yes', idx:1, pos:'near_splitter' });
    const out   = __aptNote({ units:5, common:'yes', idx:1, pos:'outside' });
    const sub   = __aptNote({ units:5, common:'yes', idx:2, pos:'tv_back' });
    const none  = __aptNote({ units:5, common:'no',  idx:1, pos:'tv_back' });
    return { 代表_背面: has(rep), 代表_分配器直下: has(repNS), 代表_外部: has(out),
             二世帯目: has(sub), 共用部なし: has(none),
             注意の中身: (/※[^<]*/.exec(rep.replace(/<[^>]*>/g, '')) || [''])[0].slice(0, 60) };
  });
  console.log('①電源部位置の注意', JSON.stringify(r1));
  ok(r1.代表_背面 === true && r1.代表_分配器直下 === true,
     '★共用部あり・代表で電源部位置が「外部」でないのに、ボックス本体が金額に入らない注意が出ない → '
     + JSON.stringify(r1));
  ok(r1.代表_外部 === false,
     '★電源部位置を「外部」にしても注意が出たままになる（直す先が分からなくなる） → ' + JSON.stringify(r1));
  ok(r1.二世帯目 === false,
     '★2世帯目（ボックスを計上しない世帯）にまで注意を出している → ' + JSON.stringify(r1));
  ok(r1.共用部なし === false,
     '★共用部なし（ボックスを使わない）にまで注意を出している → ' + JSON.stringify(r1));
  ok(/電源部の位置/.test(r1.注意の中身),
     '★注意の文に「電源部の位置」が無い（何を直せばよいか分からない） → ' + r1.注意の中身);

  // ---- ② 共用部なしのときは「分配器は自動では入れていない」と書く／分配器の空き口数 ----
  const r2 = await page.evaluate(() => {
    const strip = h => h.replace(/<[^>]*>/g, '');
    const none = strip(__aptNote({ units:5, common:'no', idx:1, pos:'tv_back' }));
    const yes  = strip(__aptNote({ units:5, common:'yes', idx:1, pos:'outside' }));
    /* 空き口が出る世帯数は「分配器の組み合わせ」で決まるので、決め打ちせず
       いまの組み合わせから「空きが出る世帯数」と「ぴったりの世帯数」を選ぶ。 */
    let spare = 0, exact = 0;
    for(let u = 2; u <= 12; u++){
      const p = aptSplitterPlan(u);
      if(!spare && p.ports - u === 1) spare = u;
      if(!exact && u >= 3 && p.ports - u === 0) exact = u;
    }
    /* 分配器の組み合わせを書いている行だけを取り出す（ボックスの説明にも「分配器」が出るため） */
    const planLine = h => (h.split('<br>').map(x => x.replace(/<[^>]*>/g, ''))
                            .filter(x => /^分配器は/.test(x))[0] || '');
    const hs = __aptNote({ units:spare, common:'yes', idx:1, pos:'outside' });
    const he = __aptNote({ units:exact, common:'yes', idx:1, pos:'outside' });
    return { 共用部なしの一言: /増幅器から各世帯へ分ける分配器は、自動では入れていません/.test(none),
             共用部なしに電源部一式: /電源部 BPS6W/.test(none),
             共用部ありに一言の文字: /自動では入れていません/.test(yes),
             空きが出る世帯数: spare, 空き表示: /空き 1 口/.test(planLine(hs)),
             ぴったりの世帯数: exact, ぴったりに空きの文字: /空き/.test(planLine(he)),
             組み合わせ: planLine(hs).slice(0, 48) };
  });
  console.log('②共用部なしと空き口数', JSON.stringify(r2));
  ok(r2.共用部なしの一言 === true,
     '★共用部なしで「増幅器から各世帯へ分ける分配器は、自動では入れていません」が出ない'
     + '（入っていないことが隠れる） → ' + JSON.stringify(r2));
  ok(r2.共用部なしに電源部一式 === true,
     '★共用部なしの説明から、世帯ごとの電源部一式が消えている → ' + JSON.stringify(r2));
  ok(r2.共用部ありに一言の文字 === false,
     '★共用部あり（分配器を自動で入れている）でも「入れていません」と書いている → ' + JSON.stringify(r2));
  ok(r2.空きが出る世帯数 > 0 && r2.ぴったりの世帯数 > 0,
     '試験の前提: 分配器の組み合わせが読めていない → ' + JSON.stringify(r2));
  ok(r2.空き表示 === true,
     '★' + r2.空きが出る世帯数 + '世帯（口が1つ余る）で「空き 1 口」が出ない → ' + JSON.stringify(r2));
  ok(r2.ぴったりに空きの文字 === false,
     '★' + r2.ぴったりの世帯数 + '世帯（余り無し）なのに「空き」が出ている → ' + JSON.stringify(r2));

  // ---- ③ 金額（積算）のいまの決まり：共用部ボックスは「外部・代表」のときだけ乗る ----
  const r3 = await page.evaluate(() => {
    const boxName = u => { const p = PARTS[aptBoxPartsId(u)]; return p ? p.name : ''; };
    return {
      外部代表5: __bom({}),
      背面代表5: __bom({ power_pos:'tv_back' }),
      分配器直下5: __bom({ power_pos:'near_splitter' }),
      外部2世帯目: __bom({ apt_idx:'2' }),
      外部代表6: __bom({ apt_units:'6' }),
      戸建て外部: __bom({ apt_units:'', apt_idx:'', apt_common:'' }),
      説明のボックス名5: boxName(5), 説明のボックス名6: boxName(6),
      説明に出る名前5: /OPBOX OP14-33A/.test(__aptNote({ units:5, common:'yes', idx:1, pos:'outside' })),
      説明に出る名前6: /OPBOX OP20-65A/.test(__aptNote({ units:6, common:'yes', idx:1, pos:'outside' }))
    };
  });
  console.log('③共用部ボックスの決まり', JSON.stringify({
    外部代表5: r3.外部代表5.boxes, 背面代表5: r3.背面代表5.boxes, 分配器直下5: r3.分配器直下5.boxes,
    外部2世帯目: r3.外部2世帯目.boxes, 外部代表6: r3.外部代表6.boxes, 戸建て外部: r3.戸建て外部.boxes,
    金額: { 外部代表5: r3.外部代表5.total, 背面代表5: r3.背面代表5.total, 外部2世帯目: r3.外部2世帯目.total }
  }));
  ok(r3.外部代表5.boxes.join(',') === 'box_op14_33a' && r3.外部代表5.qty.join(',') === '1',
     '★共用部あり・代表・外部で、共用部ボックス（2〜5世帯＝OP14-33A）が積算に乗らない → '
     + JSON.stringify(r3.外部代表5));
  ok(/共用部ボックス/.test(r3.外部代表5.note),
     '★共用部ボックスの行に「共用部ボックス」と書いていない（何のボックスか分からない） → '
     + r3.外部代表5.note);
  ok(r3.外部代表6.boxes.join(',') === 'box_op20_65a',
     '★6世帯以上で大きいボックス（OP20-65A）にならない → ' + JSON.stringify(r3.外部代表6));
  ok(r3.背面代表5.boxes.length === 0 && r3.分配器直下5.boxes.length === 0,
     '★電源部位置が「外部」でないのにボックスが金額に乗っている（説明欄の注意と食い違う） → '
     + JSON.stringify({ 背面: r3.背面代表5.boxes, 直下: r3.分配器直下5.boxes }));
  ok(r3.外部2世帯目.boxes.length === 0,
     '★2世帯目にも共用部ボックスが乗っている（建物に1つのものが二重になる） → '
     + JSON.stringify(r3.外部2世帯目));
  ok(r3.戸建て外部.boxes.join(',') === 'box_op14',
     '★戸建ての外部電源ボックスが、アパート用のボックスに化けている → ' + JSON.stringify(r3.戸建て外部));
  ok(r3.背面代表5.total < r3.外部代表5.total,
     '試験の前提: 外部電源の分が金額に出ていない → ' + JSON.stringify({ 外部: r3.外部代表5.total, 背面: r3.背面代表5.total }));
  ok(r3.説明に出る名前5 === true && r3.説明に出る名前6 === true
     && r3.説明のボックス名5 === 'OPBOX OP14-33A' && r3.説明のボックス名6 === 'OPBOX OP20-65A',
     '★説明欄に出すボックス名と、積算のボックスがずれている → ' + JSON.stringify({
        名5: r3.説明のボックス名5, 名6: r3.説明のボックス名6,
        出5: r3.説明に出る名前5, 出6: r3.説明に出る名前6 }));

  // ---- ④ 受付台帳の列の見出しが「ビラ済」。説明に意味が書かれている ----
  const r4 = await page.evaluate(() => {
    const row = createManualRow({ chosho_mgmt_no:'V1570001', chosho_cust_name:'あ様',
                                  chosho_cust_addr:'○市1-1', chosho_status:'in_progress' }, 'manual');
    const div = document.createElement('div');
    div.id = '__v157ledger'; document.body.appendChild(div);
    renderListLedgerMode([row], div);
    const th = div.querySelector('th[data-col="flyer"]');
    const ths = Array.from(div.querySelectorAll('th[data-col]')).map(t => t.getAttribute('data-col'));
    return { 見出し: th ? th.textContent.trim() : '(無し)',
             説明: th ? String(th.getAttribute('title') || '') : '(無し)',
             列の並び: ths.join(','), 行数: div.querySelectorAll('tbody tr.lg-row').length };
  });
  console.log('④受付台帳のビラの列', JSON.stringify(r4));
  ok(r4.行数 >= 1, '試験の前提: 受付台帳が描けていない → ' + JSON.stringify(r4));
  ok(/^ビラ済/.test(r4.見出し),
     '★受付台帳のビラの列の見出しが「ビラ済」になっていない → ' + r4.見出し);
  ok(/配り終えた戸別に○/.test(r4.説明),
     '★説明に「配り終えた戸別に○」が無い（○の意味が分からない） → ' + r4.説明);
  ok(/これから配る戸別[^。]*配らなくてよい戸別[^。]*どちらも空欄/.test(r4.説明.replace(/\n/g, '')),
     '★説明に「空欄は、これから配る戸別と配らなくてよい戸別の両方」が無い'
     + '（空欄を未配布と読み違える） → ' + r4.説明);
  ok(/flyer/.test(r4.列の並び), '試験の前提: ビラの列が台帳に無い → ' + r4.列の並び);

  // ---- ⑤ Excel の取り込み：見出しが「ビラ済」でも「ビラ」でも、ビラの列として拾う ----
  const r5 = await page.evaluate(() => {
    const sheet = lab => ([
      { A:'管理番号', B:'名前', C:'状態', D:'打合せ予定', E:lab, F:'完了' },
      { A:'V1570001', B:'あ様', C:'受付済', D:'', E:'○', F:'' },
      { A:'V1570002', B:'い様', C:'受付済', D:'', E:'',  F:'' }]);
    const one = lab => { const p = lgXlsxAsLedgerPayload(sheet(lab), 'れい.xlsx');
      return p ? { n:p.rows.length, a:p.rows[0].flyer, b:p.rows[1].flyer } : null; };
    return { 別名: LGX_ALIAS.flyer.slice(), 新: one('ビラ済'), 旧: one('ビラ'),
             旧の書き方も: one('ビラ配布') };
  });
  console.log('⑤Excelの取り込み', JSON.stringify(r5));
  ok(r5.別名.indexOf('ビラ済') >= 0 && r5.別名.indexOf('ビラ') >= 0,
     '★Excel の見出しの別名に「ビラ済」「ビラ」の両方が無い → ' + JSON.stringify(r5.別名));
  ok(r5.新 && r5.新.a === true && r5.新.b === false,
     '★見出しが「ビラ済」の Excel からビラの○を拾えない → ' + JSON.stringify(r5.新));
  ok(r5.旧 && r5.旧.a === true && r5.旧.b === false,
     '★前の書き出し（見出しが「ビラ」）の Excel からビラの○を拾えない → ' + JSON.stringify(r5.旧));
  ok(r5.旧の書き方も && r5.旧の書き方も.a === true,
     '★見出しが「ビラ配布」の Excel からビラの○を拾えない → ' + JSON.stringify(r5.旧の書き方も));

  // ---- ⑥ 印刷の列名も「ビラ済」 ----
  const r6 = await page.evaluate(() => {
    const f = LG_PRINT_COLS.filter(c => c.key === 'flyer')[0] || null;
    const x = (typeof LG_XLSX_COLS !== 'undefined')
      ? LG_XLSX_COLS.map(c => c.label).filter(l => /ビラ/.test(l)) : ['(無し)'];
    return { 印刷: f ? f.label : '(無し)', 印刷の幅: f ? f.def : null,
             列の数: LG_PRINT_COLS.length, Excel書き出し: x };
  });
  console.log('⑥印刷の列名', JSON.stringify(r6));
  ok(r6.印刷 === 'ビラ済', '★印刷の列名が「ビラ済」になっていない → ' + r6.印刷);
  ok(r6.Excel書き出し.join(',') === 'ビラ済',
     '★Excel へ書き出す見出しが「ビラ済」になっていない（読み戻しと食い違う） → '
     + JSON.stringify(r6.Excel書き出し));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v157_main');
})();
