/* 版156: 「まとめて保存」と「全部保存し直す」のふるいと知らせ。
   ・この端末で何も入力していない戸別は書き替えない（G1）＝PCの写真・図面・積算を守る
   ・書いた戸別は融合する（写真は和集合・PCの中身は残す）
   ・書かなかったときは理由と直し方を言う */
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

  await page.evaluate(() => {
    window.__asked = []; window.__alerts = []; window.__answer = true;
    uiConfirm = async m => { window.__asked.push(String(m)); return window.__answer; };
    uiAlert   = async m => { window.__alerts.push(String(m)); return true; };
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
    window.__photos = (tag, n) => { const o = []; for(let i=0;i<n;i++)
      o.push({ label: tag + (i+1), dataUri: __png(['#c33','#3a6','#36c','#ca0','#939','#393'][i%6]), id: tag + i }); return o; };
    window.__dir = null;
    window.__mkDir = () => ({ name:'リスト', _files: {},
      queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(n, o){ const F = this._files;
        if(!(n in F)){ if(!(o&&o.create)) throw new Error('NF'); F[n]=''; }
        return { getFile: async()=>({ text: async()=>F[n] }),
                 createWritable: async()=>({ write: async(bl)=>{ F[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(this._files)) yield [n, { kind:'file' }]; },
      values: function*(){} });
    window.__clearDrafts = async () => {
      try{ for(const r of (await idbGetAll())||[]) if(r && r.key) await idbDel(r.key); }catch(_){}
    };
  });

  /* ---- ① 台帳から3件開き、1件だけ入力 → 入力した1件しか書かない ---- */
  const r1 = await page.evaluate(async () => {
    await __clearDrafts();
    const dir = __mkDir();
    dir._files['B0001.json'] = JSON.stringify({ chosho_mgmt_no:'B0001', work_type:'new',
      chosho_cust_name:'あ様', chosho_photos:__photos('P', 5), qty_overrides:{ u206:2 },
      survey_done:true, _origin:'main' });
    dir._files['B0002.json'] = JSON.stringify({ chosho_mgmt_no:'B0002', work_type:'new',
      chosho_cust_name:'い様', chosho_photos:__photos('Q', 3), _origin:'main' });
    receptionSaveRows({ rows:[
      { mgmt_no:'B0001', name:'あ様', addr:'○市1-1', date:'2026-09-10', status:'in_progress',
        photos:5, has_dwg:true, work_done:false, survey:true },
      { mgmt_no:'B0002', name:'い様', addr:'○市1-2', date:'2026-09-11', status:'in_progress',
        photos:3, has_dwg:false, work_done:false },
      { mgmt_no:'B0003', name:'う様', addr:'○市1-3', date:'2026-09-12', status:'in_progress',
        photos:0, has_dwg:false, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    const rows = getReceptionRows();
    for(const r of rows){ await openFromReception(r); await new Promise(x => setTimeout(x, 400)); }
    // いま開いている B0003 にだけ入力する
    M.cable_main_len = '27'; M._touched = true; await persistDraft();
    const og = saveDirGet, oo = saveDirOk, odp = window.showDirectoryPicker;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.showDirectoryPicker = async () => dir;
    window.__asked = []; window.__alerts = []; window.__answer = true;
    await saveAllDrafts();
    saveDirGet = og; saveDirOk = oo; window.showDirectoryPicker = odp;
    const f1 = JSON.parse(dir._files['B0001.json']), f2 = JSON.parse(dir._files['B0002.json']);
    return { files: Object.keys(dir._files).sort(),
             p1: (f1.chosho_photos||[]).length, qty1: Object.keys(f1.qty_overrides||{}).length,
             p2: (f2.chosho_photos||[]).length,
             b3: dir._files['B0003.json'] ? JSON.parse(dir._files['B0003.json']).cable_main_len : '(無し)',
             asked: window.__asked.join(' / '), alerts: window.__alerts.join(' / ') };
  });
  console.log('①ふるい', JSON.stringify(r1));
  ok(r1.files.join(',') === 'B0001.json,B0002.json,B0003.json',
     '★入力した戸別のファイルが作られていない → ' + JSON.stringify(r1.files));
  ok(r1.p1 === 5 && r1.qty1 === 1 && r1.p2 === 3,
     '★開いただけの戸別のPCの写真・積算が消えた → ' + JSON.stringify(r1));
  ok(r1.b3 === '27', '★入力した戸別の内容が書かれていない → ' + r1.b3);
  /* 開いただけの戸別は、一覧に出る前のふるい（isUntouchedHere）で外れる分と、
     書き込みの前の守り（isNothingNewHere）で外れる分がある。どちらでも書かれない。 */
  ok(/何も入力していない戸別 \d+ 件/.test(r1.asked) || !/B000[12]\.json/.test(r1.asked),
     '★触らない戸別のことを言っていない → ' + JSON.stringify(r1.asked));
  /* 版155 の古い脅し文（「その写真は消えます／この端末では外せません」）は、
     版156 では書き替えないので嘘になる。残っていないこと。 */
  ok(!/その写真は消えます/.test(r1.asked) && !/外せません/.test(r1.asked),
     '★もう起きないこと（写真が消える）を書いて怖がらせている → ' + JSON.stringify(r1.asked));

  /* ---- ② 入力した戸別は融合する（PCの写真・下見の印・積算を残す） ---- */
  const r2 = await page.evaluate(async () => {
    await __clearDrafts();
    const dir = __mkDir();
    dir._files['B1001.json'] = JSON.stringify({ chosho_mgmt_no:'B1001', work_type:'new',
      chosho_cust_name:'え様', chosho_photos:__photos('R', 4), qty_overrides:{ u206:7 },
      ag_placement:{ pconly:true }, survey_done:true, chosho_time:'08:30', _origin:'main' });
    receptionSaveRows({ rows:[{ mgmt_no:'B1001', name:'え様', addr:'○市2-1', date:'2026-09-20',
      status:'in_progress', photos:4, has_dwg:true, work_done:false, survey:true }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await new Promise(x => setTimeout(x, 500));
    window.__answer = true;
    await pcGuardForceAsk();                           // 【見るだけ】を外して入力する
    M.chosho_photos = [{ label:'現場で撮った', dataUri: __png('#36c'), id:'g1' }];
    M.chosho_cust_addr = '現場で直した住所'; M._touched = true;
    await persistDraft();
    const og = saveDirGet, oo = saveDirOk, odp = window.showDirectoryPicker;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.showDirectoryPicker = async () => dir;
    window.__asked = []; window.__alerts = [];
    await saveAllDrafts();
    saveDirGet = og; saveDirOk = oo; window.showDirectoryPicker = odp;
    const f = JSON.parse(dir._files['B1001.json']);
    return { photos: (f.chosho_photos||[]).length,
             labels: (f.chosho_photos||[]).map(p=>p.label).sort().join('・'),
             qty: (f.qty_overrides||{}).u206, pconly: !!f.ag_placement,
             survey: f.survey_done === true, time: f.chosho_time,
             addr: f.chosho_cust_addr, origin: f._origin,
             alerts: window.__alerts.join(' / ') };
  });
  console.log('②融合', JSON.stringify(r2));
  ok(r2.photos === 5 && /現場で撮った/.test(r2.labels) && /R1/.test(r2.labels),
     '★まとめて保存で写真が減った（和集合になっていない） → ' + JSON.stringify(r2));
  ok(r2.qty === 7 && r2.pconly && r2.survey === true && r2.time === '08:30',
     '★PCの積算・下見の印・工事の時刻が消えた → ' + JSON.stringify(r2));
  ok(r2.addr === '現場で直した住所', '★現場で入力した住所が入っていない → ' + r2.addr);
  ok(r2.origin === 'genba', '現場入力が書いた印が付いていない → ' + r2.origin);

  /* ---- ③ 「全部保存し直す」… 台帳を写しただけの戸別は触らず、理由を言う ---- */
  const r3 = await page.evaluate(async () => {
    await __clearDrafts();
    const dir = __mkDir();
    dir._files['B2001.json'] = JSON.stringify({ chosho_mgmt_no:'B2001', work_type:'new',
      chosho_cust_name:'お様', chosho_photos:__photos('S', 6), _origin:'main' });
    receptionSaveRows({ rows:[{ mgmt_no:'B2001', name:'お様', addr:'○市3-1', date:'2026-09-25',
      note:'台帳の備考', status:'in_progress', photos:6, has_dwg:true, work_done:false }],
      project:'試験', exportedAt:new Date().toISOString(), appVersion:'156' });
    M = freshModel(); ensureModelShape(M);
    await openFromReception(getReceptionRows()[0]); await new Promise(x => setTimeout(x, 500));
    await persistDraft();
    const og = saveDirGet, oo = saveDirOk, odp = window.showDirectoryPicker;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.showDirectoryPicker = async () => dir;
    window.__asked = []; window.__alerts = []; window.__answer = true;
    await saveAllDrafts("all");
    saveDirGet = og; saveDirOk = oo; window.showDirectoryPicker = odp;
    const f = JSON.parse(dir._files['B2001.json']);
    return { photos: (f.chosho_photos||[]).length, name: f.chosho_cust_name,
             asked: window.__asked.join(' / '), alerts: window.__alerts.join(' / ') };
  });
  console.log('③全部保存し直す', JSON.stringify(r3));
  ok(r3.photos === 6 && r3.name === 'お様',
     '★台帳を写しただけの戸別を書き替えて、PCの写真を消した → ' + JSON.stringify(r3));
  ok(/触りません/.test(r3.alerts) && /消さないよう/.test(r3.alerts),
     '★書かなかった理由とPCの中身が残ることを言っていない → ' + JSON.stringify(r3.alerts));
  /* 作り直す手順も版156 の動きに合っていること（何も入力せず押しても書かれない） */
  ok(/何か1つ入力してから/.test(r3.alerts) && !/その写真は消えます/.test(r3.alerts),
     '★ファイルを作り直す手順が、いまの動きと合っていない → ' + JSON.stringify(r3.alerts));

  /* ---- ④ 「まとめて保存」は必ずフォルダを選ぶ窓を出し、選び直した先へ書く ---- */
  const r4 = await page.evaluate(async () => {
    await __clearDrafts();
    const wrong = __mkDir(); wrong.name = 'まちがい';
    const right = __mkDir(); right.name = '正しい';
    await saveDirSet(wrong);
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = 'B3001'; M.chosho_cust_name = 'か様'; M.cable_main_len = '15';
    M._touched = true; await persistDraft();
    const odp = window.showDirectoryPicker, oo = saveDirOk;
    let picked = 0;
    window.showDirectoryPicker = async () => { picked++; return right; };
    saveDirOk = async () => true;
    window.__asked = []; window.__answer = true;
    await saveAllDrafts();
    const now = saveDirName();
    window.showDirectoryPicker = odp; saveDirOk = oo;
    await saveDirSet(null);
    return { picked, wrong: Object.keys(wrong._files), right: Object.keys(right._files), now,
             asked: window.__asked.join(' / ') };
  });
  console.log('④保存先', JSON.stringify(r4));
  ok(r4.picked === 1, '★まとめて保存でフォルダを選ぶ窓を出していない → ' + r4.picked);
  ok(r4.wrong.length === 0 && r4.right.join(',') === 'B3001.json',
     '★覚えていた（まちがった）フォルダへ書いている → ' + JSON.stringify(r4));
  ok(r4.now === '正しい', '★選び直した先を覚え直していない → ' + r4.now);
  ok(/フォルダを選ぶ画面/.test(r4.asked), '★窓が出ることを先に言っていない → ' + JSON.stringify(r4.asked));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v156_bulk');
})();
