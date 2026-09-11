/* 版157: 現場入力（スマホ）の「保存」まわりの直しを8つ見る。
   ①保存先を選ぶ窓の道で、中身を読めたのに融合が落ちたら書かずに止める
   ②融合したとき「材料をどちらにしたか」の一言が消えない
   ③保存先を選ぶ窓に id:"genba-save" を渡している（戸別・特別記録とも）
   ④覚えているフォルダの許可が切れていたら、保存のあとの知らせに書く（窓・共有・ダウンロード）
   ⑤共有で渡した 管理番号.json.txt も、フォルダから読めるようになった
   ⑥まとめて保存で、フォルダを選ぶ窓がやめた以外の理由で開けなければ、そこで止まる
   ⑦まとめて保存を共有／ダウンロードで渡したら、押すまで消えない知らせが出る
   ⑧特別記録も、書いたあと読み返して確かめる／写真の✕は一度確かめる */
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
    window.__asked = []; window.__alerts = []; window.__answer = true; window.__toasts = [];
    uiConfirm = async m => { window.__asked.push(String(m)); return window.__answer; };
    uiAlert   = async m => { window.__alerts.push(String(m)); return true; };
    window.__ot = toast; toast = m => { window.__toasts.push(String(m)); window.__ot(m); };
    window.__png = c => { const cv=document.createElement('canvas'); cv.width=8; cv.height=6;
      const x=cv.getContext('2d'); x.fillStyle=c; x.fillRect(0,0,8,6); return cv.toDataURL('image/png'); };
    /* 覚えているフォルダのふり。opt.rot は「書いた中身をわざと壊して返す」（読み返しの試験用）。 */
    window.__mkDir = (name, opt) => ({ name: name || 'リスト', _files: {}, _opt: opt || {},
      queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      async getFileHandle(n, o){ const F = this._files, O = this._opt;
        if(!(n in F)){ if(!(o&&o.create)) throw new Error('NF'); F[n]=''; }
        return { getFile: async()=>{ if(O.blind) throw new Error('読めない端末');
                   return { text: async()=>(O.rot ? O.rot(F[n]) : F[n]) }; },
                 createWritable: async()=>({ write: async(bl)=>{ F[n]= typeof bl==='string'?bl:await bl.text(); }, close: async()=>{} }) }; },
      entries: async function*(){ for(const n of Object.keys(this._files)) yield [n, { kind:'file' }]; },
      values: function*(){} });
    /* 「保存先を選ぶ窓」が返すファイル1つぶんのふり。中身は box.txt に出入りする。 */
    window.__mkFile = (name, box) => ({ name: name,
      getFile: async()=>({ text: async()=>box.txt }),
      createWritable: async()=>({ write: async(bl)=>{ box.txt = (typeof bl==='string'?bl:await bl.text()); box.wrote=(box.wrote|0)+1; },
                                  close: async()=>{} }) });
    window.__basic = (no) => { M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = no; M.chosho_cust_name = 'あ様'; M.chosho_date = '2026-09-10';
      M.cable_main_len = '21'; M._touched = true; };
    window.__clearDrafts = async () => {
      try{ for(const r of (await idbGetAll())||[]) if(r && r.key) await idbDel(r.key); }catch(_){}
    };
    /* 💾（JSON書出済）が付いたかどうか。markDraftSaved を数え、下書きの印も見る。 */
    window.__countSaved = async () => {
      let n = 0;
      try{ for(const r of (await idbGetAll())||[]) if(r && r.fileSavedAt) n++; }catch(_){}
      return n;
    };
  });

  // ---- ① 窓の道：中身を読めたのに融合が落ちたら、1バイトも書かずに止める ----
  const r1 = await page.evaluate(async () => {
    const out = [];
    /* (a) 写真の確かめ（photoLossVsFiles）が落ちる (b) 融合（mergeIntoState）が落ちる */
    for(const how of ['photoLossVsFiles', 'mergeIntoState']){
      const no = (how === 'photoLossVsFiles') ? 'V5711' : 'V5712';
      const pc = { chosho_mgmt_no:no, work_type:'new', chosho_cust_name:'PCの名前',
        chosho_note:'PCの備考', chosho_date:'2026-08-01',
        chosho_photos:[{ label:'PCの写真', dataUri:__png('#c33'), id:'pc1' }],
        qty_overrides:{ u206:3 }, survey_done:true, _origin:'main' };
      const box = { txt: JSON.stringify(pc), wrote: 0 };
      const before = box.txt;
      __basic(no);
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      const oPL = window.photoLossVsFiles, oMI = window.mergeIntoState;
      let mds = 0; const oMD = window.markDraftSaved;
      markDraftSaved = async () => { mds++; return oMD(); };
      saveDirGet = async () => null; saveDirOk = async () => false;
      window.showSaveFilePicker = async () => __mkFile(no + '.json', box);
      if(how === 'photoLossVsFiles') photoLossVsFiles = () => { throw new Error('わざと落とす'); };
      else                          mergeIntoState   = () => { throw new Error('わざと落とす'); };
      window.__answer = true; window.__toasts = [];
      let ret = null;
      try{ ret = await saveJsonRun(); }
      finally{
        photoLossVsFiles = oPL; mergeIntoState = oMI; markDraftSaved = oMD;
        saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op;
      }
      out.push({ how, ret, wrote: box.wrote, same: (box.txt === before), mds,
                 title: (_lastSaveInfo && _lastSaveInfo.title) || '',
                 warn: !!(_lastSaveInfo && _lastSaveInfo.warn),
                 toasts: window.__toasts.slice() });
    }
    return out;
  });
  console.log('①融合が落ちたら書かない', JSON.stringify(r1));
  r1.forEach(x => {
    ok(x.same === true && x.wrote === 0,
       '★読めたのに融合が落ちた（' + x.how + '）のに書いてしまう → ' + JSON.stringify(x));
    ok(x.warn === true && /保存を止めました/.test(x.title),
       '★止めたことを知らせていない（' + x.how + '） → ' + JSON.stringify(x));
    ok(x.mds === 0,
       '★書いていないのに💾を付けている（' + x.how + '）＝まとめて保存から外れる → ' + JSON.stringify(x));
    ok(x.ret === true, '止めたときは保存の入口へ戻す（' + x.how + '） → ' + x.ret);
  });

  // ---- ② 融合したときの「材料をどちらにしたか」の一言が消えない ----
  const r2 = await page.evaluate(async () => {
    const out = [];
    /* PCのファイルに下見の内容（survey_done＋材料）が入っていて、こちらも材料を触っている。
       さらにPCにしか無い写真があるので kept（ファイルの値を残した欄）も出る。 */
    for(const ans of [true, false]){
      const no = ans ? 'V5721' : 'V5722';
      const pc = { chosho_mgmt_no:no, work_type:'new', survey_done:true,
        chosho_photos:[{ label:'PCの写真', dataUri:__png('#3a6'), id:'pc2' }],
        ant_type:'20', ant_mount:'wall', cable_main_len:'99', splitter_count:'3',
        _origin:'main' };
      const box = { txt: JSON.stringify(pc), wrote: 0 };
      __basic(no);
      M.chosho_photos = [{ label:'現場で撮った', dataUri: __png('#36c'), id:'g2' }];
      const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
      saveDirGet = async () => null; saveDirOk = async () => false;
      window.showSaveFilePicker = async () => __mkFile(no + '.json', box);
      window.__answer = ans; window.__asked = [];
      const ret = await saveJsonRun();
      saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op;
      const f = JSON.parse(box.txt || '{}');
      out.push({ ans, ret, msg: (_lastSaveInfo && _lastSaveInfo.msg) || '',
                 title: (_lastSaveInfo && _lastSaveInfo.title) || '',
                 photos: (f.chosho_photos||[]).length,
                 labels: (f.chosho_photos||[]).map(p => p.label).sort().join('・'),
                 cable: f.cable_main_len,
                 asked: window.__asked.join(' / ') });
    }
    return out;
  });
  console.log('②材料の一言', JSON.stringify(r2));
  r2.forEach(x => {
    ok(/材料は/.test(x.msg),
       '★融合したのに「材料をどちらにしたか」を言っていない（答え=' + x.ans + '） → ' + JSON.stringify(x));
    ok(/ファイルに入っていた/.test(x.msg),
       '★「ファイルに入っていたものを残した」が消えた（答え=' + x.ans + '） → ' + JSON.stringify(x));
    ok(x.photos === 2 && /PCの写真/.test(x.labels) && /現場で撮った/.test(x.labels),
       '★融合で写真が和集合になっていない（答え=' + x.ans + '） → ' + JSON.stringify(x));
    ok(/材料を/.test(x.asked), '★材料をどちらにするか聞いていない（答え=' + x.ans + '） → ' + x.asked);
  });
  ok(r2[0].cable === '21', '★「この端末の内容にする」と答えたのに材料が入っていない → ' + r2[0].cable);
  ok(r2[1].cable === '99', '★「いいえ」と答えたのにPCの材料を書き替えた → ' + r2[1].cable);

  // ---- ③ 保存先を選ぶ窓は id:"genba-save"（フォルダの窓と同じ場所から開く） ----
  const r3 = await page.evaluate(async () => {
    const seen = [];
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
    saveDirGet = async () => null; saveDirOk = async () => false;
    // 戸別の「保存」
    const box = { txt:'', wrote:0 };
    window.showSaveFilePicker = async (o) => { seen.push(o || {}); return __mkFile('V5731.json', box); };
    __basic('V5731');
    await saveJsonRun();
    // 特別記録の「保存」
    const rec = spBlank(); rec.id = spNewId(); rec.key = spKey(rec.id);
    rec.title = '資材検収の試験'; rec.photos = [{ label:'納品書', dataUri:__png('#36c'), id:'s1' }];
    const box2 = { txt:'', wrote:0 };
    window.showSaveFilePicker = async (o) => { seen.push(o || {}); return __mkFile(spFileName(rec), box2); };
    const sres = await spSaveFile(rec);
    saveDirGet = og; saveDirOk = oo; window.showSaveFilePicker = op;
    try{ await idbDel(rec.key); }catch(_){}
    return { ids: seen.map(o => o.id || '(無し)'), names: seen.map(o => o.suggestedName || ''),
             spOk: !!(sres && sres.ok) };
  });
  console.log('③窓のid', JSON.stringify(r3));
  ok(r3.ids.length === 2, '★保存先を選ぶ窓が2回（戸別・特別記録）出ていない → ' + JSON.stringify(r3));
  ok(r3.ids.join(',') === 'genba-save,genba-save',
     '★窓に id:"genba-save" を渡していない（毎回たどり直しになる） → ' + JSON.stringify(r3.ids));
  ok(r3.spOk === true, '特別記録が保存先を選ぶ窓で保存できていない → ' + JSON.stringify(r3));

  // ---- ④ 覚えているフォルダの許可が切れていたら、保存のあとの知らせに書く ----
  const r4 = await page.evaluate(async () => {
    const out = {};
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker, osh = window.shareFilesSmart;
    const lapsed = __mkDir('リスト');
    // 覚えてはいるが、書く許可が切れている（ask=false では false）
    saveDirGet = async () => lapsed;
    saveDirOk = async (h, ask) => false;
    // (a) 保存先を選ぶ窓の道
    {
      const box = { txt:'', wrote:0 };
      window.showSaveFilePicker = async () => __mkFile('V5741.json', box);
      __basic('V5741');
      await saveJsonRun();
      out.pick = { title:(_lastSaveInfo&&_lastSaveInfo.title)||'', msg:(_lastSaveInfo&&_lastSaveInfo.msg)||'' };
    }
    // (b) 共有の道
    {
      try{ delete window.showSaveFilePicker; }catch(_){ window.showSaveFilePicker = undefined; }
      window.shareFilesSmart = async (items) => ({ ok:true, as:'', name:[items[0].name] });
      __basic('V5742');
      await saveJsonRun();
      out.share = { title:(_lastSaveInfo&&_lastSaveInfo.title)||'', msg:(_lastSaveInfo&&_lastSaveInfo.msg)||'' };
    }
    // (c) ダウンロードの道
    {
      window.shareFilesSmart = async () => ({ ok:false, aborted:false, name:[] });
      let dl = 0;
      const oc = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){ if(this.download) dl++; else oc.call(this); };
      __basic('V5743');
      await saveJsonRun();
      HTMLAnchorElement.prototype.click = oc;
      out.dl = { n:dl, title:(_lastSaveInfo&&_lastSaveInfo.title)||'', msg:(_lastSaveInfo&&_lastSaveInfo.msg)||'' };
    }
    saveDirGet = og; saveDirOk = oo; if(op) window.showSaveFilePicker = op; window.shareFilesSmart = osh;
    // フォルダへは1件も書いていない（許可が無いので触らない）
    out.intoDir = Object.keys(lapsed._files);
    return out;
  });
  console.log('④許可切れの知らせ', JSON.stringify({
    pick:r4.pick.title, share:r4.share.title, dl:r4.dl.title, n:r4.dl.n, intoDir:r4.intoDir,
    msgs:[r4.pick.msg, r4.share.msg, r4.dl.msg].map(m => /許可が切れていました/.test(m) && /📁 変更/.test(m)) }));
  ok(r4.intoDir.length === 0, '★許可が切れているフォルダへ書いている → ' + JSON.stringify(r4.intoDir));
  ok(r4.dl.n === 1, 'ダウンロードの道に入っていない → ' + r4.dl.n);
  [['窓', r4.pick], ['共有', r4.share], ['ダウンロード', r4.dl]].forEach(([nm, x]) => {
    ok(/許可が切れていました/.test(x.msg),
       '★' + nm + 'の道で「覚えているフォルダの許可が切れていた」と言っていない → ' + JSON.stringify(x));
    ok(/📁 変更/.test(x.msg),
       '★' + nm + 'の道で「📁 変更」で選び直せると言っていない → ' + JSON.stringify(x));
  });

  // ---- ⑤ 共有で渡した 管理番号.json.txt も、フォルダから読めるようになった ----
  const r5 = await page.evaluate(async () => {
    const names = ['S9001.json.txt', 'S9002.json', 'メモ.txt'];
    const dir = { name:'リスト',
      queryPermission: async()=>'granted', requestPermission: async()=>'granted',
      values: async function*(){ for(const n of names) yield { kind:'file', name:n }; } };
    const og = saveDirGet, oo = saveDirOk;
    saveDirGet = async () => dir; saveDirOk = async () => true;
    const got = await flowShareDirFiles();
    // 許可が下りないフォルダは null（ファイルを選んでもらう道へ落ちる）
    saveDirOk = async () => false;
    const ng = await flowShareDirFiles();
    saveDirGet = og; saveDirOk = oo;
    return { got: (got||[]).map(x => x.name), ng: ng };
  });
  console.log('⑤.json.txtも読む', JSON.stringify(r5));
  ok(r5.got.join(',') === 'S9001.json.txt,S9002.json',
     '★共有で渡した .json.txt を読めていない／関係ないファイルを拾っている → ' + JSON.stringify(r5.got));
  ok(r5.ng === null, '許可が下りないフォルダで null を返していない → ' + JSON.stringify(r5.ng));

  // ---- ⑥ まとめて保存：フォルダの窓が開けなければ、そこで止まる ----
  const r6 = await page.evaluate(async () => {
    const out = {};
    const mk = async (no) => {
      await __clearDrafts();
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = no; M.chosho_cust_name = 'か様'; M.cable_main_len = '15';
      M._touched = true; await persistDraft();
    };
    const run = async (thrown) => {
      const odp = window.showDirectoryPicker, og = saveDirGet, oo = saveDirOk, osh = window.shareFilesSmart;
      const onav = navigator.share;
      let share = 0, dl = 0;
      window.showDirectoryPicker = async () => { throw thrown(); };
      saveDirGet = async () => { out.dirGet = true; return null; };
      saveDirOk = async () => true;
      window.shareFilesSmart = async () => { share++; return { ok:true, as:'', name:['x'] }; };
      try{ Object.defineProperty(navigator, 'share', { configurable:true, value: async () => { share++; } }); }catch(_){}
      const oc = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){ if(this.download) dl++; else oc.call(this); };
      window.__asked = []; window.__alerts = []; window.__answer = true;
      await saveAllDrafts();
      HTMLAnchorElement.prototype.click = oc;
      window.showDirectoryPicker = odp; saveDirGet = og; saveDirOk = oo; window.shareFilesSmart = osh;
      try{ Object.defineProperty(navigator, 'share', { configurable:true, value: onav }); }catch(_){}
      return { share, dl, alerts: window.__alerts.join(' / '), saved: await __countSaved() };
    };
    await mk('V5761');
    out.err = await run(() => new Error('開けない'));
    await mk('V5762');
    out.abort = await run(() => { const e = new Error('やめた'); e.name = 'AbortError'; return e; });
    await __clearDrafts();
    return out;
  });
  console.log('⑥窓が開けない', JSON.stringify(r6));
  ok(r6.err.share === 0 && r6.err.dl === 0,
     '★フォルダの窓が開けないのに、共有やダウンロードへ落ちている → ' + JSON.stringify(r6.err));
  ok(/保存先のフォルダを選べませんでした/.test(r6.err.alerts),
     '★フォルダを選べなかったことを知らせていない → ' + JSON.stringify(r6.err.alerts));
  ok(r6.err.saved === 0, '★書いていないのに💾を付けている → ' + r6.err.saved);
  ok(r6.abort.share === 0 && r6.abort.dl === 0,
     '★自分で閉じたのに、共有やダウンロードへ落ちている → ' + JSON.stringify(r6.abort));
  ok(r6.abort.alerts === '', '★自分で閉じただけなのに知らせを出している → ' + JSON.stringify(r6.abort.alerts));
  ok(r6.abort.saved === 0, '★書いていないのに💾を付けている（自分で閉じた） → ' + r6.abort.saved);

  // ---- ⑦ まとめて保存を共有／ダウンロードで渡したら、押すまで消えない知らせ ----
  const r7 = await page.evaluate(async () => {
    const out = {};
    saveHintSet('リスト');                     // 「★入れる場所」を出せるようにする
    const mk = async (no) => {
      await __clearDrafts();
      M = freshModel(); ensureModelShape(M);
      M.chosho_mgmt_no = no; M.chosho_cust_name = 'き様'; M.cable_main_len = '18';
      M._touched = true; await persistDraft();
    };
    const run = async (sr) => {
      const odp = window.showDirectoryPicker, og = saveDirGet, osh = window.shareFilesSmart;
      let dl = 0, names = [];
      try{ delete window.showDirectoryPicker; }catch(_){ window.showDirectoryPicker = undefined; }
      saveDirGet = async () => null;
      window.shareFilesSmart = async (items) => { names = items.map(i => i.name); return sr(items); };
      const oc = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){ if(this.download){ dl++; names.push(this.download); } else oc.call(this); };
      window.__asked = []; window.__alerts = []; window.__answer = true; window.__toasts = [];
      await saveAllDrafts();
      HTMLAnchorElement.prototype.click = oc;
      if(odp) window.showDirectoryPicker = odp; saveDirGet = og; window.shareFilesSmart = osh;
      return { dl, names, alerts: window.__alerts.join(' / '), toasts: window.__toasts.slice(),
               saved: await __countSaved() };
    };
    await mk('V5771');
    out.share = await run(items => ({ ok:true, as:'txt', name: items.map(i => i.name + '.txt') }));
    await mk('V5772');
    out.dl = await run(() => ({ ok:false, aborted:false, name:[] }));
    await __clearDrafts();
    saveHintSet('');
    return out;
  });
  console.log('⑦共有／ダウンロードの知らせ', JSON.stringify(r7));
  ok(/共有で渡しました/.test(r7.share.alerts) && /1 件/.test(r7.share.alerts),
     '★共有で渡したことと件数を、押すまで消えない知らせで出していない → ' + JSON.stringify(r7.share.alerts));
  ok(/\.txt が付きます/.test(r7.share.alerts),
     '★名前の最後に .txt が付く注意を出していない → ' + JSON.stringify(r7.share.alerts));
  ok(/★入れる場所/.test(r7.share.alerts),
     '★入れる場所（フォルダの名前）を出していない → ' + JSON.stringify(r7.share.alerts));
  ok(r7.share.saved === 1, '共有で渡したのに💾が付いていない → ' + r7.share.saved);
  ok(r7.dl.dl === 1 && /V5772\.json/.test(r7.dl.names.join(',')),
     '★共有できないときにダウンロードへ落ちていない → ' + JSON.stringify(r7.dl));
  ok(/ダウンロード/.test(r7.dl.alerts) && /全部保存し直す/.test(r7.dl.alerts),
     '★ダウンロードに入れたことと、やり直し方を知らせていない → ' + JSON.stringify(r7.dl.alerts));
  ok(/★入れる場所/.test(r7.dl.alerts),
     '★ダウンロードの知らせに入れる場所が無い → ' + JSON.stringify(r7.dl.alerts));

  // ---- ⑧ 特別記録：書いたあと読み返して確かめる／写真の✕は一度確かめる ----
  const r8 = await page.evaluate(async () => {
    const out = {};
    const mkRec = () => { const r = spBlank(); r.id = spNewId(); r.key = spKey(r.id);
      r.kind = 'material_in'; r.title = '20素子アンテナ 100基 検収'; r.date = '2026-09-11';
      r.photos = [{ label:'納品書', dataUri:__png('#ca0'), id:'sp1' }];
      r.rev = 1; return r; };
    const og = saveDirGet, oo = saveDirOk, op = window.showSaveFilePicker;
    saveDirOk = async () => true;
    try{ delete window.showSaveFilePicker; }catch(_){ window.showSaveFilePicker = undefined; }
    // (a) 書いた中身をわざと壊して返すフォルダ → ok:false / warn:true、✏️ は消えない
    {
      const liar = __mkDir('うそつき', { rot: t => {
        const o = JSON.parse(t || '{}'); o.chosho_photos = []; return JSON.stringify(o); } });
      saveDirGet = async () => liar;
      const rec = mkRec();
      const res = await spSaveFile(rec);
      out.bad = { ok: !!(res && res.ok), warn: !!(res && res.warn), title: (res && res.title) || '',
                  fileSavedAt: rec.fileSavedAt || 0, stale: spStale(rec),
                  wrote: Object.keys(liar._files).length };
      try{ await idbDel(rec.key); }catch(_){}
    }
    // (b) 壊さないフォルダ → ok:true、✏️ が消える
    {
      const good = __mkDir('リスト');
      saveDirGet = async () => good;
      const rec = mkRec();
      const res = await spSaveFile(rec);
      const f = JSON.parse(good._files[Object.keys(good._files)[0]] || '{}');
      out.good = { ok: !!(res && res.ok), warn: !!(res && res.warn),
                   fileSavedAt: (rec.fileSavedAt || 0) > 0, stale: spStale(rec),
                   photos: (f.chosho_photos || []).length, rtype: f._recordType };
      try{ await idbDel(rec.key); }catch(_){}
    }
    saveDirGet = og; saveDirOk = oo; if(op) window.showSaveFilePicker = op;
    // (c) 写真の✕ は uiConfirm で一度確かめる（「いいえ」なら減らない）
    {
      const rec = mkRec();
      rec.photos = [{ label:'納品書', dataUri:__png('#939'), id:'sp9' },
                    { label:'荷姿・全体', dataUri:__png('#393'), id:'sp8' }];
      _spCur = rec;
      const host = document.getElementById('sp-body');
      renderSpecialEdit(host);
      window.__asked = []; window.__answer = false;
      host.querySelector('[data-sp-photodel="0"]').click();
      await new Promise(r => setTimeout(r, 250));
      out.no = { asked: window.__asked.join(' / '), n: rec.photos.length };
      window.__asked = []; window.__answer = true;
      document.getElementById('sp-body').querySelector('[data-sp-photodel="0"]').click();
      await new Promise(r => setTimeout(r, 250));
      out.yes = { asked: window.__asked.join(' / '), n: rec.photos.length,
                  left: (rec.photos[0] || {}).label || '' };
      _spCur = null;
      try{ await idbDel(rec.key); }catch(_){}
    }
    await __clearDrafts();
    return out;
  });
  console.log('⑧特別記録', JSON.stringify(r8));
  ok(r8.bad.ok === false && r8.bad.warn === true,
     '★特別記録で中身が落ちていても「保存しました」と言う → ' + JSON.stringify(r8.bad));
  ok(r8.bad.fileSavedAt === 0 && r8.bad.stale === true,
     '★読み返して合わないのに ✏️（未保存）が消えている → ' + JSON.stringify(r8.bad));
  ok(r8.bad.wrote === 1, '書き込み自体はする（読み返しで捕まえる） → ' + JSON.stringify(r8.bad));
  ok(r8.good.ok === true && r8.good.fileSavedAt === true && r8.good.stale === false,
     '★ちゃんと書けたのに「保存済」にならない → ' + JSON.stringify(r8.good));
  ok(r8.good.photos === 1 && r8.good.rtype === 'special',
     '特別記録の中身が入っていない → ' + JSON.stringify(r8.good));
  ok(/この写真を消します/.test(r8.no.asked),
     '★特別記録の写真の✕で確かめていない（押し間違いで消える） → ' + JSON.stringify(r8.no));
  ok(r8.no.n === 2, '★「いいえ」なのに写真が減った → ' + JSON.stringify(r8.no));
  ok(r8.yes.n === 1 && r8.yes.left === '荷姿・全体',
     '★「はい」でも写真が消えない／違う写真が消えた → ' + JSON.stringify(r8.yes));

  await page.evaluate(() => { toast = window.__ot; });
  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v157_genba');
})();
