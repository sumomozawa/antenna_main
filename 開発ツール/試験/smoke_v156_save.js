/* 版156: 1件ずつの「保存」の4つの道を通しで見る。
   ①覚えているフォルダ ②保存先を選ぶ窓 ③共有 ④ダウンロード
   ＋ 全角の管理番号・同じ番号の下書きが2つ・連打・変更が無いときの念押し・保存先の選び直し */
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
    window.__asked = []; window.__answer = true; window.__toasts = [];
    uiConfirm = async m => { window.__asked.push(m); return window.__answer; };
    uiAlert   = async m => { window.__asked.push(m); return true; };
    window.__ot = toast; toast = m => { window.__toasts.push(String(m)); window.__ot(m); };
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
    window.__mkDir = (name, opt) => ({ name: name || 'リスト', _files: {}, _opt: opt || {},
      queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(n, o){ const F = this._files, O = this._opt;
        if(!(n in F)){ if(!(o&&o.create)) throw new Error('NF'); F[n]=''; }
        return { getFile: async()=>{ if(O.blind) throw new Error('読めない端末');
                   return { text: async()=>(O.rot ? O.rot(F[n]) : F[n]) }; },
                 createWritable: async()=>({ write: async(bl)=>{ F[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(this._files)) yield [n, { kind:'file' }]; },
      values: function*(){} });
    window.__basic = (no) => { M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = no; M.chosho_cust_name = 'あ様'; M.chosho_date = '2026-09-10';
      M.cable_main_len = '21'; M._touched = true; };
  });

  // ---- ① 覚えているフォルダへ上書きする（2回押してもファイルは増えない） ----
  const r1 = await page.evaluate(async () => {
    const dir = __mkDir('リスト');
    __basic('S10001');
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker, odp = window.showDirectoryPicker;
    let picked = 0;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    window.showSaveFilePicker = async () => { picked++; throw new Error('出さない'); };
    window.showDirectoryPicker = async () => { picked++; throw new Error('出さない'); };
    window.__toasts = [];
    await saveJsonRun();
    const one = Object.keys(dir._files).slice();
    await saveJsonRun();
    saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op; window.showDirectoryPicker = odp;
    const f = JSON.parse(dir._files['S10001.json'] || '{}');
    return { one, two: Object.keys(dir._files), picked, cable: f.cable_main_len,
             where: (_lastSaveInfo && _lastSaveInfo.msg) || '', toasts: window.__toasts.slice() };
  });
  console.log('①フォルダ', JSON.stringify(r1));
  ok(r1.one.join(',') === 'S10001.json', '★覚えているフォルダへ書けていない → ' + JSON.stringify(r1.one));
  ok(r1.two.length === 1, '★2回保存するとファイルが増える → ' + JSON.stringify(r1.two));
  ok(r1.picked === 0, '★フォルダを覚えているのに窓を出している → ' + r1.picked);
  ok(r1.cable === '21', '書いた中身が入っていない → ' + r1.cable);
  ok(/リスト/.test(r1.where), '★どこへ入れたかを知らせていない → ' + r1.where);

  // ---- ② フォルダが無ければ「保存先を選ぶ窓」。選んだファイルの中身も読んで融合する ----
  const r2 = await page.evaluate(async () => {
    const files = { 'S20001.json': JSON.stringify({ chosho_mgmt_no:'S20001', work_type:'new',
      chosho_note:'PCの備考', chosho_photos:[{label:'PC1',dataUri:__png('#c33'),id:'p1'}],
      qty_overrides:{ u206:3 }, survey_done:true, _origin:'main' }) };
    __basic('S20001');
    M.chosho_photos = [{ label:'現場', dataUri: __png('#36c'), id:'g1' }];
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
    saveDirGet = async () => null; saveDirOk = async () => false;
    let opened = 0;
    window.showSaveFilePicker = async () => { opened++;
      return { name:'S20001.json',
        getFile: async()=>({ text: async()=>files['S20001.json'] }),
        createWritable: async()=>({ write: async(bl)=>{ files['S20001.json']= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; };
    window.__answer = true;
    const ret = await saveJsonRun();
    saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op;
    const f = JSON.parse(files['S20001.json']);
    return { ret, opened, photos: (f.chosho_photos||[]).length,
             labels: (f.chosho_photos||[]).map(p=>p.label).sort().join('・'),
             qty: Object.keys(f.qty_overrides||{}).length, survey: f.survey_done === true,
             info: (_lastSaveInfo && _lastSaveInfo.title) || '' };
  });
  console.log('②選ぶ窓', JSON.stringify(r2));
  ok(r2.opened === 1 && r2.ret === true, '★保存先を選ぶ窓が出ない → ' + JSON.stringify(r2));
  ok(r2.photos === 2 && /PC1/.test(r2.labels) && /現場/.test(r2.labels),
     '★選んだファイルの写真が消えた（和集合になっていない） → ' + JSON.stringify(r2));
  ok(r2.qty === 1 && r2.survey === true,
     '★選んだファイルにあったPCの中身が消えた → ' + JSON.stringify(r2));

  // ---- ③ フォルダも窓も無い端末 → 共有。中身は融合後のものを渡す ----
  const r3 = await page.evaluate(async () => {
    __basic('S30001');
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker, osh = window.shareFilesSmart;
    saveDirGet = async () => null; saveDirOk = async () => false;
    try{ delete window.showSaveFilePicker; }catch(_){ window.showSaveFilePicker = undefined; }
    let got = null;
    window.shareFilesSmart = async (items) => { got = items[0]; return { ok:true, name:[items[0].name], as:"" }; };
    const ret = await saveJsonRun();
    saveDirGet = og; saveDirOk = oo; if(op) window.showSaveFilePicker = op; window.shareFilesSmart = osh;
    const o = got ? JSON.parse(got.text) : {};
    return { ret, name: got && got.name, cable: o.cable_main_len, no: o.chosho_mgmt_no,
             title: (_lastSaveInfo && _lastSaveInfo.title) || '' };
  });
  console.log('③共有', JSON.stringify(r3));
  ok(r3.ret === true && r3.name === 'S30001.json' && r3.cable === '21' && r3.no === 'S30001',
     '★共有で渡す中身が違う → ' + JSON.stringify(r3));
  ok(/共有/.test(r3.title), '★共有で渡したと知らせていない → ' + r3.title);

  // ---- ④ 共有もできない端末 → ダウンロード。はっきり「別の場所」と言う ----
  const r4 = await page.evaluate(async () => {
    __basic('S40001');
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker, osh = window.shareFilesSmart;
    saveDirGet = async () => null; saveDirOk = async () => false;
    try{ delete window.showSaveFilePicker; }catch(_){ window.showSaveFilePicker = undefined; }
    window.shareFilesSmart = async () => ({ ok:false, aborted:false, name:[] });
    let dl = 0, dlName = '';
    const oc = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(){ if(this.download){ dl++; dlName = this.download; } else oc.call(this); };
    const ret = await saveJsonRun();
    HTMLAnchorElement.prototype.click = oc;
    saveDirGet = og; saveDirOk = oo; if(op) window.showSaveFilePicker = op; window.shareFilesSmart = osh;
    return { ret, dl, dlName, title: (_lastSaveInfo && _lastSaveInfo.title) || '',
             msg: (_lastSaveInfo && _lastSaveInfo.msg) || '' };
  });
  console.log('④ダウンロード', JSON.stringify(r4));
  ok(r4.dl === 1 && r4.dlName === 'S40001.json', '★ダウンロードに落ちていない → ' + JSON.stringify(r4));
  ok(/ダウンロード/.test(r4.title) && /フォルダへ移して/.test(r4.msg),
     '★「PCが読むフォルダとは別」と言っていない → ' + JSON.stringify(r4));

  // ---- ⑤ 全角の管理番号も、ファイル名と中身は半角にそろえる ----
  const r5 = await page.evaluate(() => {
    M = freshModel(); ensureModelShape(M);
    M.chosho_mgmt_no = 'Ｓ５０００１'; M._touched = true;
    hanFixField('chosho_mgmt_no');
    return { name: currentFileName(), inFile: buildState().chosho_mgmt_no };
  });
  console.log('⑤全角', JSON.stringify(r5));
  ok(r5.name === 'S50001.json' && r5.inFile === 'S50001',
     '★全角の管理番号が半角にそろわない（PCで別の戸別になる） → ' + JSON.stringify(r5));

  // ---- ⑥ 書いたあと読み返して確かめる。合わなければ💾を付けない ----
  const r6 = await page.evaluate(async () => {
    const liar = __mkDir('うそつき', { rot: t => { const o = JSON.parse(t||'{}'); o.chosho_cust_name = ''; o.chosho_date = ''; return JSON.stringify(o); } });
    __basic('S60001');
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => liar; saveDirOk = async () => true;
    await saveJsonRun();
    const bad = { title: (_lastSaveInfo && _lastSaveInfo.title) || '', warn: !!(_lastSaveInfo && _lastSaveInfo.warn) };
    const blind = __mkDir('読めない', { blind: true });
    __basic('S60002');
    saveDirGet = async () => blind; saveDirOk = async () => true;
    await saveJsonRun();
    const b2 = { title: (_lastSaveInfo && _lastSaveInfo.title) || '',
                 wrote: Object.keys(blind._files) };
    saveDirGet = og; saveDirOk = oo;
    return { bad, b2 };
  });
  console.log('⑥読み返し', JSON.stringify(r6));
  ok(/保存できていない/.test(r6.bad.title) && r6.bad.warn === true,
     '★中身が落ちていても「保存しました」と言う → ' + JSON.stringify(r6.bad));
  ok(r6.b2.wrote.indexOf('S60002.json') >= 0,
     '読めない端末でも書き込み自体はする → ' + JSON.stringify(r6.b2));

  // ---- ⑦ 連打しても1回だけ／変更が無ければ念押しする ----
  const r7 = await page.evaluate(async () => {
    const dir = __mkDir('リスト');
    __basic('S70001');
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    await saveJson();                      // ★ボタンの道（念押しはここにある）
    await new Promise(r => setTimeout(r, 300));
    const st1 = saveButtonState();
    // 2回目：中身が変わっていない → 念押しして、断れば書かない
    window.__asked = []; window.__answer = false;
    const before = JSON.stringify(dir._files);
    await saveJson();
    await new Promise(r => setTimeout(r, 300));
    const same = JSON.stringify(dir._files) === before;
    // 3回目：入力を変えたら、念押しなしで書ける
    window.__asked = []; window.__answer = true;
    M.cable_main_len = '33'; saveDraft();
    await new Promise(r => setTimeout(r, 300));
    await saveJson();
    await new Promise(r => setTimeout(r, 300));
    const f = JSON.parse(dir._files['S70001.json'] || '{}');
    saveDirGet = og; saveDirOk = oo;
    return { st1, asked: window.__asked.join(' / '), same, files: Object.keys(dir._files),
             cable: f.cable_main_len };
  });
  console.log('⑦念押し', JSON.stringify(r7));
  ok(r7.st1 === 'saved', '★保存したあとのボタンが「保存済み」になっていない → ' + r7.st1);
  ok(r7.same === true, '★変更が無いのに念押しせず書いてしまう／断ったのに書いている → ' + JSON.stringify(r7));
  ok(r7.files.length === 1 && r7.cable === '33',
     '★入力を変えたあとの保存が入っていない／ファイルが増えた → ' + JSON.stringify(r7));

  // ---- ⑧ 保存先を選び直せる（保存バーの📁） ----
  const r8 = await page.evaluate(async () => {
    const first = __mkDir('まちがい'), third = __mkDir('三つ目');
    await saveDirSet(first);
    renderSaveBar(); await new Promise(r => setTimeout(r, 150));
    const btn = document.getElementById('sb-dest');
    const odp = window.showDirectoryPicker;
    let opened = 0;
    window.showDirectoryPicker = async () => { opened++; return third; };
    if(btn) btn.click();
    await new Promise(r => setTimeout(r, 400));
    const name = saveDirName();
    // 選び直した先へ「保存」1件が入る
    __basic('S80001');
    const oo = saveDirOk; saveDirOk = async () => true;
    await saveJsonRun();
    saveDirOk = oo; window.showDirectoryPicker = odp;
    await saveDirSet(null);
    return { opened, name, into: Object.keys(third._files), wrongEmpty: Object.keys(first._files).length === 0 };
  });
  console.log('⑧保存先の選び直し', JSON.stringify(r8));
  ok(r8.opened === 1 && r8.name === '三つ目', '★保存先を選び直せない → ' + JSON.stringify(r8));
  ok(r8.into.join(',') === 'S80001.json' && r8.wrongEmpty,
     '★選び直した先へ入らない（前の所に書いている） → ' + JSON.stringify(r8));

  await page.evaluate(() => { toast = window.__ot; });
  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v156_save');
})();
