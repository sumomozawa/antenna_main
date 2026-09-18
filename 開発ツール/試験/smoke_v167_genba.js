/* 版167（現場入力）
   ★「測ったら入った」では足りない★
   実機（iPhone）の日本語フォントは試験機より広い。版166 の作りでも、
   字が 15% 広い端末では 320px の画面で保存バーが 1px はみ出していた。
   そこで「どんな字の幅でも、はみ出しようがない」作りにしたことを確かめる。

   ・上部（上の帯・保存バー）は、字を 180% まで太らせてもはみ出さない
   ・狭い画面では、保存先は1行をまるごと使う（切らずに全部見せる）
   ・予定カレンダーの行が、切れずに画面の外へ出ていたのを直した
   ・いろいろな場面（台帳・履歴・📂の一覧・カレンダー・守りの帯・知らせの窓）を
     総当たりで見て、画面より右へ出ている物が1つも無い */
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
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(HTML).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

const LONG_PROJ = '令和８年度戸別受信設備設置工事（その２）';

/* 画面で使う道具（どの幅でも同じものを入れる） */
const TOOLS = () => {
  /* はみ出し止め（overflow-x:clip）を外して「本当に広い物」を見る。
     止めたままだと、はみ出していても画面の幅に見えてしまう。 */
  const st = document.createElement('style'); st.id = '__noclip';
  st.textContent = 'html,body{overflow-x:visible !important;}';
  document.head.appendChild(st);
  window.__fontStyle = document.createElement('style');
  document.head.appendChild(window.__fontStyle);
  window.__font = pct => {
    window.__fontStyle.textContent = pct === 100 ? ''
      : ('header, .savebar{ font-size:' + pct + '% !important; }'
         + ' header *, .savebar *{ font-size:inherit !important; }');
  };
  window.__over = tag => {
    const w = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      if(!el.getClientRects().length) return;
      const r = el.getBoundingClientRect();
      if(r.width <= 0 || r.height <= 0) return;
      if(r.right > w + 1 || r.left < -1){
        const p = el.parentElement;
        if(p && p !== document.body){
          const pr = p.getBoundingClientRect();
          if(pr.right >= r.right - 1 && pr.left <= r.left + 1) return;   // 親も同じ＝親だけ言う
        }
        out.push({ 場面: tag, cls: String(el.className || '').slice(0, 30) || el.tagName.toLowerCase(),
                   id: el.id || '', 右端: Math.round(r.right), 画面: w,
                   字: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26) });
      }
    });
    return out.slice(0, 6);
  };
  window.__topOver = () => {
    const bar = document.getElementById('savebar');
    const hd = document.querySelector('header');
    return { 帯: Math.max(0, bar.scrollWidth - bar.clientWidth),
             上: Math.max(0, hd.scrollWidth - hd.clientWidth),
             ページ: document.documentElement.scrollWidth,
             画面: document.documentElement.clientWidth };
  };
  window.__seed = () => {
    const rows = [];
    for(let i = 1; i <= 40; i++){
      rows.push({ mgmt_no: String(2621000 + i), name: '長野原町 太郎' + i,
        addr: '青森県三沢市大字三沢字園沢' + i + '-' + i + ' コーポ浅間隠山北麓 ' + i + '0' + i + '号室',
        /* ★日付は必ず「今日」★ openCalModal は開くたび _calPick = todayStr() なので、
           固定の日にすると翌日から1行も描かれず、この場面が何も確かめなくなる。 */
        tel: '0176-00-00' + (10 + i), date: todayStr(), time: ('0' + (8 + i % 9)).slice(-2) + ':00',
        contractor: '株式会社ながいなまえの電気工事店' + (i % 3),
        status: i % 3 === 0 ? 'completed' : 'in_progress',
        photos: i % 2, has_dwg: i % 2, survey: i % 2 ? 'done' : '',
        flyer: i % 2 ? 'done' : '', hold: i % 7 === 0,
        note: 'これは長い備考です。留守・犬あり・隣家の許可が必要・裏の物置の上に上がる必要あり' });
    }
    /* 予定カレンダーの行がいちばん長くなる形（アパートの建物名＋部屋＋長い氏名）を1件混ぜる */
    rows.push({ mgmt_no: '2621999', name: '長野原町大字応桑字浅間隠山北麓 太郎右衛門',
      addr: '青森県三沢市大字三沢字園沢128-3 コーポ浅間隠山北麓ながいなまえ棟 302号室',
      tel: '0176-00-0099', date: todayStr(), time: '17:00',
      contractor: '株式会社ながいなまえの電気工事店',
      status: 'in_progress', photos: 3, has_dwg: 1, survey: 'done', flyer: 'done',
      apt_units: 6, apt_idx: 3, apt_bldg: 'コーポ浅間隠山北麓ながいなまえ棟',
      note: 'これは長い備考です。留守・犬あり・隣家の許可が必要' });
    receptionSaveRows({ rows: rows, project: '令和８年度戸別受信設備設置工事（その２）',
                        exportedAt: '2026-09-17T00:00:00.000Z', appVersion: '167' });
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  let checkedVer = '';

  for(const W of [320, 390]){
    const ctx = await b.newContext({ viewport:{ width:W, height:780 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { const t = m.text();
      if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
    page.on('dialog', d => d.accept().catch(()=>{}));
    await page.goto(HTML); await page.waitForTimeout(2500);

    checkedVer = await page.evaluate(() => APP_VERSION);
    await page.evaluate(TOOLS);

    // ---- ① 字が広い端末でも、上部がはみ出さない ----
    const r1 = await page.evaluate(async (long) => {
      try { delete window.showDirectoryPicker; } catch(_){ window.showDirectoryPicker = undefined; }
      __seed();
      saveHintSet(long);
      M.chosho_mgmt_no = '2621MNT051';
      M.survey = 'done'; M.flyer = 'done';
      _save.fileAt = Date.now(); _save.savedAt = Date.now();
      updateHeader(); renderSaveBar();
      const out = [];
      for(const pct of [100, 115, 130, 150, 180]){
        __font(pct);
        await new Promise(r => setTimeout(r, 90));
        out.push(Object.assign({ 字: pct }, __topOver()));
      }
      __font(100);
      await new Promise(r => setTimeout(r, 90));
      return out;
    }, LONG_PROJ);
    console.log('①字の幅 画面' + W, JSON.stringify(r1));
    r1.forEach(x => {
      ok(x.帯 === 0,
         '★字が ' + x.字 + '% の端末で、保存バーが画面からはみ出す（' + W + 'px の画面で '
         + x.帯 + 'px） → ' + JSON.stringify(x));
      ok(x.上 === 0,
         '★字が ' + x.字 + '% の端末で、上の帯が画面からはみ出す（' + W + 'px の画面で '
         + x.上 + 'px） → ' + JSON.stringify(x));
    });

    // ---- ② 狭い画面では、保存先は1行をまるごと使う（切らずに全部見せる） ----
    if(W <= 460){
      const r2 = await page.evaluate(() => {
        const bar = document.getElementById('savebar');
        const d = bar.querySelector('.sb-dest');
        const n = bar.querySelector('.sb-dest-n');
        const f = bar.querySelector('.sb-file');
        return { destW: Math.round(d.getBoundingClientRect().width),
                 barW: bar.clientWidth,
                 // 保存先が「保存済…」より下の行にある＝1行をまるごと使っている
                 destTop: Math.round(d.getBoundingClientRect().top),
                 fileTop: f ? Math.round(f.getBoundingClientRect().top) : -1,
                 nameCut: !!n && n.scrollWidth > n.clientWidth + 1,
                 rows: Math.round(bar.getBoundingClientRect().height) };
      });
      console.log('②保存先の行 画面' + W, JSON.stringify(r2));
      ok(r2.destTop > r2.fileTop,
         '★狭い画面で、保存先が1行をまるごと使っていない → ' + JSON.stringify(r2));
      ok(r2.destW > r2.barW * 0.7,
         '★保存先の行が細い（名前が読めない） → ' + JSON.stringify(r2));
      /* いちばん狭い端末（320px）では、20文字を超える物件名は1行に入り切らない。
         そこは「…」で切れてよい（全部の名前は押したときの説明と、保存のあとの知らせに出る）。
         ふつうの大きさの端末（390px 以上）では切らずに出せること。 */
      ok(W < 390 || r2.nameCut === false,
         '★1行まるごと使っているのに、まだ名前が切れている → ' + JSON.stringify(r2));
    }

    // ---- ③ どの場面でも、画面より右へ出ている物が1つも無い ----
    const scenes = [];
    const add = a => { if(a && a.length) scenes.push(...a); };
    add(await page.evaluate(() => __over('起動直後・戸別を開いた状態')));
    add(await page.evaluate(async () => {
      document.querySelectorAll('.sec').forEach(s => s.classList.add('open'));
      await new Promise(r => setTimeout(r, 250));
      return __over('節を全部開く');
    }));
    add(await page.evaluate(async () => {
      M._viewOnly = true; renderPcGuard();
      await new Promise(r => setTimeout(r, 180));
      const a = __over('PCの守りの帯');
      M._viewOnly = false; renderPcGuard();
      return a;
    }));
    add(await page.evaluate(async () => {
      await openReceptionModal();
      await new Promise(r => setTimeout(r, 450));
      const a = __over('受付台帳');
      document.getElementById('reception-modal').classList.remove('open');
      return a;
    }));
    add(await page.evaluate(async () => {
      await openDraftModal();
      await new Promise(r => setTimeout(r, 350));
      const inp = document.getElementById('import-file');
      const dt = new DataTransfer();
      for(let i = 1; i <= 5; i++){
        dt.items.add(new File([JSON.stringify({ chosho_mgmt_no: String(2621000 + i),
          work_type:'catv_to_uhf', amplifier:'amp_3u43' })], String(2621000 + i) + '.json',
          { type:'application/json' }));
      }
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(r => setTimeout(r, 550));
      const a = __over('履歴＋📂の一覧');
      closeDraftModal();
      return a;
    }));
    add(await page.evaluate(async () => {
      await openCalModal();
      await new Promise(r => setTimeout(r, 450));
      const a = __over('予定カレンダー');
      /* ★この場面がちゃんと中身を持っているか、その場で控える★
         行が0個だと「はみ出し なし」で緑になってしまい、何も確かめていないことになる。 */
      const evs = Array.from(document.querySelectorAll('.cal-ev'));
      const w = document.documentElement.clientWidth;
      window.__cal = {
        件数: evs.length,
        /* 行の枠だけでなく、中の字（題・そえ字）まで見る。
           span のままだと「…」が効かず、枠は画面に収まっているのに字だけ外へ出る。 */
        はみ出し: evs.filter(e => {
          const rs = [e].concat(Array.from(e.querySelectorAll('.cal-ev-t, .cal-ev-s')));
          return rs.some(x => x.getBoundingClientRect().right > w + 1);
        }).length,
        切れる: evs.filter(e => { const t = e.querySelector('.cal-ev-t');
                                 return t && t.scrollWidth > t.clientWidth; }).length,
        block: evs.every(e => { const t = e.querySelector('.cal-ev-t'), u = e.querySelector('.cal-ev-s');
          return (!t || getComputedStyle(t).display === 'block')
              && (!u || getComputedStyle(u).display === 'block'); })
      };
      document.getElementById('cal-modal').classList.remove('open');
      return a;
    }));
    {
      const c = await page.evaluate(() => window.__cal);
      console.log('　予定カレンダーの中身 画面' + W, JSON.stringify(c));
      ok(c && c.件数 > 0,
         '★予定カレンダーに行が1つも出ていない（この場面は何も確かめていない）→ ' + JSON.stringify(c));
      ok(c && c.はみ出し === 0,
         '★予定カレンダーの行が画面の外へ出ている（' + (c && c.はみ出し) + '件）');
      ok(c && c.切れる > 0,
         '★試験の前提: 長い行が「…」で切られる形になっていない（切れる行が無い）');
      ok(c && c.block === true,
         '★予定カレンダーの行が block になっていない（span には「…」が効かず、画面の外へ出る）');
    }
    add(await page.evaluate(async () => {
      const t = setInterval(() => {
        const m = document.getElementById('ui-dialog');
        if(m && m.classList.contains('open')) document.getElementById('ui-dialog-ok').click();
      }, 50);
      const p = saveDirChange();
      await new Promise(r => setTimeout(r, 350));
      const a = __over('入れる場所を選ぶ窓');
      document.getElementById('pick-close').click();
      await Promise.race([p, new Promise(r => setTimeout(r, 2000))]);
      clearInterval(t);
      return a;
    }));
    add(await page.evaluate(async () => {
      const p = uiAlert('保存しました\n\n2621MNT051.json\n写真 15枚 ふくむ 8.2MB\n\n'
        + '★入れる場所： 「令和８年度戸別受信設備設置工事（その２）」フォルダ★\nここに入れないと、PCが読み込めません。');
      await new Promise(r => setTimeout(r, 250));
      const a = __over('知らせの窓');
      document.getElementById('ui-dialog-ok').click();
      await p;
      return a;
    }));
    console.log('③総当たり 画面' + W, scenes.length ? JSON.stringify(scenes) : 'はみ出し なし');
    ok(scenes.length === 0,
       '★画面より右へ出ている物がある（' + W + 'px の画面） → ' + JSON.stringify(scenes));

    ok(errs.length === 0, '★画面のエラー（' + W + 'px）: ' + errs.slice(0,3).join(' / '));
    await ctx.close();
  }

  ok(!!WANT_VER && checkedVer === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + checkedVer + ' ／ ファイル ' + WANT_VER);

  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v167_genba');
})();
