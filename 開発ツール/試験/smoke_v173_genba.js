/* 版173（現場入力）
   #20 PCのエディタで保存しただけのファイルを「下見済み」と読み違えない
       メインは作りたての戸別でも tv_power（現場に欄が無い）を必ず書き、side_base_2・mast・mast_2 の既定値が
       現場入力と違う。これだけで「ファイルに下見の内容が入っている」と読むと、現場が下見を入れて保存したとき
       1件保存で「PCに下見の内容が入っています」と聞かれ（「いいえ」で現場の下見がPCの既定値に置き換わる）、
       まとめて保存では書かずに残る。
   #21 まとめて保存の知らせに、取っていない「TVの台数・部屋」を出さない（値が違うときだけ取って知らせる）。
   ※ メインの既定値が変わったら現場入力の MERGE_MAIN_FRESH も合わせること（① が見張る）。 */
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
const MAIN = process.argv[3] || FILE('antenna_main');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
/* にせのフォルダなどの道具は smoke_v172_genba.js と同じもの */
const SRC172 = fs.readFileSync(path.join(__dirname, 'smoke_v172_genba.js'), 'utf8');
const SETUP = SRC172.slice(SRC172.indexOf('const SETUP = `') + 'const SETUP = `'.length,
                           SRC172.indexOf('`;', SRC172.indexOf('const SETUP = `')));

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{ width: 1280, height: 860 } });
  // メインで作りたての戸別を書き出す（PCのエディタで保存しただけのファイル）
  const pm = await ctx.newPage(); pm.on('dialog', d => d.accept().catch(()=>{}));
  await pm.goto(MAIN); await pm.waitForTimeout(3000);
  const mainFresh = await pm.evaluate(() => { const s = collectState(); delete s.chosho_photos; return s; });
  await pm.close();

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text(); if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);
  await page.evaluate(SETUP);
  await page.evaluate(() => {
    window.__said = []; window.__toasts = [];
    const t = setInterval(() => {
      const m = document.getElementById('ui-dialog');
      if(m && m.classList.contains('open')){
        const bb = document.getElementById('ui-dialog-msg');
        window.__said.push(bb ? bb.textContent : '');
        const okb = document.getElementById('ui-dialog-ok'); if(okb) okb.click();
      }
    }, 40);
    window.__stopDlg = () => clearInterval(t);
    window.__ot = toast; toast = m => { window.__toasts.push(String(m)); try{ window.__ot(m); }catch(_){} };
    window.__bulk = async d => { const odp = window.showDirectoryPicker; window.showDirectoryPicker = async () => d;
      __said.length = 0; try{ await __T(saveAllDrafts(), 12000); } finally { window.showDirectoryPicker = odp; } };
  });

  /* ---------- ① 見張り：メインの作りたての値は、どれも「まだ誰も下見で入れていない値」と読むこと ----------
     メインの既定値を変えて、現場入力の MERGE_MAIN_FRESH を合わせ忘れると、ここが赤くなる。 */
  const r1 = await page.evaluate(main => {
    const bad = Object.keys(main).filter(k => isBuildKey(k) && !mergeFileUntouchedVal(k, main[k]))
                                 .map(k => k + '=' + JSON.stringify(main[k]));
    const stale = Object.keys(MERGE_MAIN_FRESH).filter(k => JSON.stringify(main[k]) !== JSON.stringify(MERGE_MAIN_FRESH[k]))
                                 .map(k => k + ' 表=' + MERGE_MAIN_FRESH[k] + ' メイン=' + JSON.stringify(main[k]));
    return { bad, stale, 版: APP_VERSION };
  }, mainFresh);
  console.log('①見張り', JSON.stringify(r1));
  ok(r1.bad.length === 0, '★メインの作りたての値を「下見の内容」と読む欄がある（MERGE_MAIN_FRESH を合わせる）→ ' + r1.bad.join(', '));
  ok(r1.stale.length === 0, '★MERGE_MAIN_FRESH がメインの既定値と合っていない → ' + r1.stale.join(', '));

  /* ---------- ② PCのエディタで保存しただけのファイル＋現場の下見 → 聞かずに・残さずに現場の材料で書く ---------- */
  const r2 = await page.evaluate(async main => {
    const o = {};
    for(const path of ['single', 'bulk']){
      __noDir(); await __clearDrafts();
      const no = path === 'single' ? 'Z173A01' : 'Z173A02';
      const pc = Object.assign({}, main, { chosho_mgmt_no:no, chosho_cust_name:'PCで入れた 太郎',
        editedAt:'2026-09-20T00:00:00.000Z' });
      delete pc.survey_done; delete pc.survey_done_at;               // メインが工程の印を持っていないファイル
      const list = __mkdir('リスト', { [no + '.json']: JSON.stringify(pc) }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      await saveDirSet(list, root);
      __mine(no);                                                    // この端末で下見を入れた（PCのファイルは読んでいない）
      M.amplifier = 'amp_2u43'; M.cable_main_len = '12'; M.survey_done = true;
      await persistDraft();
      __said.length = 0;
      if(path === 'single') await __T(saveJsonRun(), 8000); else await __bulk(list);
      const j = JSON.parse(list.__files[no + '.json'] || '{}');
      o[path] = { 増幅器: j.amplifier, 長さ: j.cable_main_len,
        材料を聞いた: __said.filter(s => /下見の内容/.test(s)).length,
        残した: __said.some(s => new RegExp(no).test(s) && /書いていません/.test(s)) };
    }
    return o;
  }, mainFresh);
  console.log('②PCで保存しただけのファイル', JSON.stringify(r2));
  ok(r2.single.材料を聞いた === 0 && r2.single.増幅器 === 'amp_2u43' && r2.single.長さ === '12',
     '★（1件保存）PCで保存しただけのファイルを下見済みと読み、材料を聞いた／現場の下見が入らない → ' + JSON.stringify(r2.single));
  ok(r2.bulk.残した === false && r2.bulk.増幅器 === 'amp_2u43' && r2.bulk.長さ === '12',
     '★（まとめて保存）PCで保存しただけのファイルを下見済みと読み、書かずに残した → ' + JSON.stringify(r2.bulk));

  /* ---------- ③ 本当に下見の内容が入っているファイル → 今までどおり聞く／書かずに残す（緩めすぎない） ---------- */
  const r3 = await page.evaluate(async main => {
    const o = {};
    for(const [path, key] of [['single', 'mark'], ['bulk', 'mark'], ['single', 'value']]){
      __noDir(); await __clearDrafts();
      const no = 'Z173B' + (path === 'single' ? 'S' : 'B') + key;
      const pc = Object.assign({}, main, { chosho_mgmt_no:no, editedAt:'2026-09-20T00:00:00.000Z' });
      if(key === 'mark'){ pc.survey_done = true; pc.amplifier = 'amp_3u43'; }
      else { delete pc.survey_done; pc.amplifier = 'amp_4u43'; }      // 下見の印は無いが、作りたてと違う材料がある
      const list = __mkdir('リスト', { [no + '.json']: JSON.stringify(pc) }, {});
      const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
      await saveDirSet(list, root);
      __mine(no); M.amplifier = 'amp_2u43'; await persistDraft();
      __said.length = 0;
      if(path === 'single') await __T(saveJsonRun(), 8000); else await __bulk(list);
      o[path + '_' + key] = { 材料を聞いた: __said.filter(s => /下見の内容/.test(s)).length,
        残した: __said.some(s => new RegExp(no).test(s) && /書いていません/.test(s)) };
    }
    return o;
  }, mainFresh);
  console.log('③本当に下見が入っているファイル', JSON.stringify(r3));
  ok(r3.single_mark.材料を聞いた === 1, '★（1件保存）下見済みの印があるファイルなのに材料を聞かない → ' + JSON.stringify(r3.single_mark));
  ok(r3.bulk_mark.残した === true, '★（まとめて保存）下見済みの印があるファイルで、この端末の材料を捨てて書いた → ' + JSON.stringify(r3.bulk_mark));
  ok(r3.single_value.材料を聞いた === 1, '★（1件保存）作りたてと違う材料が入ったファイルなのに材料を聞かない → ' + JSON.stringify(r3.single_value));

  /* ---------- ④ #21 まとめて保存の知らせ：TVの台数・部屋は、PCが直したときだけ出す ---------- */
  const r4 = await page.evaluate(async () => {
    const o = {};
    __noDir(); await __clearDrafts();
    const no = 'Z173C01';
    const list = __mkdir('リスト', { [no + '.json']: __caseJson(no, { tv_count:'2', tv_rooms:['居間', '寝室'],
      tv_bd:[false, false], tv_sp:['no', 'no'], tv_term:['', ''] }) }, {});   // メイン・現場入力が書く形
    const root = __mkdir('物件', { '現場用_物件.json':'{}' }, { 'リスト': list });
    await saveDirSet(list, root);
    M = freshModel(); M.chosho_mgmt_no = no; M._viewOnly = true;
    o.got = await __T(pcGuardAutoLoad());
    M.chosho_cust_tel = '0176-73-0001'; M._touched = true; await persistDraft();
    await __bulk(list);
    o.回目1_TV = __said.some(s => /TVの台数・部屋/.test(s));
    o.回目1_電話 = (JSON.parse(list.__files[no + '.json']).chosho_cust_tel);
    // PCがTVを3台に直す
    const j = JSON.parse(list.__files[no + '.json']);
    j.tv_count = '3'; j.tv_rooms = ['居間', '寝室', '子供部屋']; j.tv_bd = [false, false, false];
    j.tv_sp = ['no', 'no', 'no']; j.tv_term = ['', '', ''];
    j.editedAt = new Date(Date.now() + 60000).toISOString();
    list.__files[no + '.json'] = JSON.stringify(j);
    M.chosho_cust_addr = '現場で直した住所'; M._touched = true; await persistDraft();
    await __bulk(list);
    const j2 = JSON.parse(list.__files[no + '.json']);
    o.回目2_TV = __said.some(s => /TVの台数・部屋/.test(s));
    o.回目2_台数 = j2.tv_count; o.回目2_住所 = j2.chosho_cust_addr;
    return o;
  });
  console.log('④TVの台数の知らせ', JSON.stringify(r4));
  ok(r4.got === true && r4.回目1_電話 === '0176-73-0001', '試験の前提: 読み込み・まとめて保存ができていない → ' + JSON.stringify(r4));
  ok(r4.回目1_TV === false, '★PCが何も直していないのに「TVの台数・部屋」を残したと知らせた');
  ok(r4.回目2_TV === true && r4.回目2_台数 === '3' && r4.回目2_住所 === '現場で直した住所',
     '★PCが直したTVの台数を取っていない、または知らせていない → ' + JSON.stringify(r4));

  await page.evaluate(() => { try{ __stopDlg(); }catch(_){} });
  const e2 = errs.filter(x => !/ResizeObserver|NotFound|DataCloneError|could not be cloned/.test(x));
  ok(e2.length === 0, '★画面でエラーが出た → ' + e2.slice(0, 4).join(' / '));
  /* 版番号は上げるたびに試験を直さなくてよいように、読み込むファイルから拾う（版174 で直した） */
  const WANT_VER = (function(){ try{
    const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
    const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
    return m ? m[1] : '';
  }catch(_){ return ''; } })();
  ok(!!WANT_VER && r1.版 === WANT_VER, '試験の前提: 画面の版がファイルの APP_VERSION と違う → 画面 ' + r1.版 + ' ／ ファイル ' + WANT_VER);
  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版173（現場入力）');
})();
