/* 版162: 受付台帳から「📉 写真を軽くする」でまとめて縮める。
   ・写真は1枚も減らさない。名前・並び順・調書の印・空の枠はそのまま
   ・すでに軽い写真には触らない（何度押しても縮み続けない）
   ・書いたら読み返して確かめる。合わなければ元に戻す
   ・読み返せなかった／外から変わっていた ときは、戻さずに名指しで知らせる
   ・触らない戸別（暗号化・サムネだけ・元ファイルなし・いま開いている・管理番号が重なる） */
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
const MAIN = process.argv[2] || FILE('antenna_main');
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const WANT_VER = (function(){ try{
  const f = decodeURIComponent(String(MAIN).replace(/^file:\/\//, ''));
  const m = fs.readFileSync(f, 'utf8').match(/const APP_VERSION = "(\d+)"/);
  return m ? m[1] : '';
}catch(_){ return ''; } })();

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:1400,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(MAIN); await page.waitForTimeout(6000);

  // ---- ⓪ 前提 ----
  const ready = await page.evaluate(() => ({
    f: ['photoSlimWhy','photoSlimCase','photoSlimRun','photoSlimButton','photoSlimReadText',
        'photoSlimPrint','photoSlimSyncRow','photoFitForStorage'].filter(n => typeof window[n] !== 'function'),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // 作り物のフォルダ（File System Access API の代わり）
  await page.evaluate(() => {
    window.__photo = (w, h, noise) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
      let seed = 4242;
      const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
        const i = (y * w + x) * 4;
        const band = y < h * 0.4 ? 205 : (y < h * 0.62 ? 125 : 95);
        const tex = Math.sin(x * 0.02) * 18 + Math.sin(y * 0.03) * 14 + (rnd() - 0.5) * (noise == null ? 30 : noise);
        img.data[i] = Math.max(0, Math.min(255, band + tex + 18));
        img.data[i+1] = Math.max(0, Math.min(255, band + tex + 8));
        img.data[i+2] = Math.max(0, Math.min(255, band + tex));
        img.data[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return cv.toDataURL('image/jpeg', 0.92);
    };
    // 書き込みを覗ける、作り物のファイル
    window.__mkFile = (name, text) => {
      const st = { name, text, writes: 0, failWrite: false, failRead: 0, mutateAfterWrite: null };
      const fh = {
        _st: st,
        async getFile(){
          if(st.failRead > 0){ st.failRead--; throw new Error('掴まれています'); }
          return { text: async () => st.text, lastModified: 1, size: st.text.length };
        },
        async createWritable(){
          if(st.failWrite) throw new Error('書けません');
          let buf = '';
          return {
            async write(x){ buf += String(x); },
            async close(){
              st.writes++;
              st.text = (typeof st.mutateAfterWrite === 'function') ? st.mutateAfterWrite(buf) : buf;
            }
          };
        }
      };
      return fh;
    };
    window.__mkDir = files => ({
      name: '工事フォルダ',
      async queryPermission(){ return 'granted'; },
      async requestPermission(){ return 'granted'; },
      async getFileHandle(n){ if(!files[n]) throw new Error('ありません'); return files[n]; }
    });
    window.__case = (mg, photos) => JSON.stringify({
      chosho_mgmt_no: mg, amplifier: 'amp_3u43', chosho_photos: photos
    }, null, 2);
    window.__photoRows = arr => arr.map(p => ({ label: p.label, dataUri: p.uri, id: p.id, chosho: p.chosho }));
  });

  // ---- ① 1戸別：大きい写真だけ縮み、枚数・名前・並び・印はそのまま ----
  const r1 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30), big2 = __photo(3000, 4000, 30);
    const small = __photo(900, 700, 20);
    const photos = [
      { label:'施工前', dataUri: big,   id:'pA_1', chosho:true },
      { label:'施工中', dataUri: small, id:'pB_2' },
      { label:'',       dataUri: null,  id:'pC_3' },          // 空の枠
      { label:'施工完了', dataUri: big2, id:'pD_4' }
    ];
    const text0 = JSON.stringify({ chosho_mgmt_no:'V162A', amplifier:'amp_3u43', chosho_photos: photos,
                                   chosho_cust_name:'山田', editedAt:'2026-01-01T00:00:00.000Z' }, null, 2);
    const fh = __mkFile('V162A.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162A.json': fh }), _name:'V162A.json',
                  fileHandle: fh, _photoCount: 3, data:{ chosho_mgmt_no:'V162A' } };
    const before = JSON.parse(text0);
    const res = await photoSlimCase(row);
    const after = JSON.parse(fh._st.text);
    const kb = a => a.filter(p => p && p.dataUri).map(p => Math.round(photoBytesOf(p.dataUri)/1024));
    return {
      kind: res.kind, changed: res.changed, writes: fh._st.writes,
      nBefore: before.chosho_photos.filter(p => p && p.dataUri).length,
      nAfter: after.chosho_photos.filter(p => p && p.dataUri).length,
      lenAfter: after.chosho_photos.length,
      labels: after.chosho_photos.map(p => p.label),
      ids: after.chosho_photos.map(p => p.id),
      chosho: after.chosho_photos.map(p => !!p.chosho),
      kbBefore: kb(before.chosho_photos), kbAfter: kb(after.chosho_photos),
      smallSame: after.chosho_photos[1].dataUri === before.chosho_photos[1].dataUri,
      name: after.chosho_cust_name, edited: after.editedAt
    };
  });
  console.log('①1戸別', JSON.stringify(r1));
  ok(r1.kind === 'ok' && r1.writes === 1, '★1戸別を軽くできない → ' + JSON.stringify(r1));
  ok(r1.nAfter === r1.nBefore && r1.lenAfter === 4,
     '★写真が減った／空の枠が消えた → ' + JSON.stringify(r1));
  ok(r1.labels.join('/') === '施工前/施工中//施工完了', '★名前・並びが変わった → ' + JSON.stringify(r1.labels));
  ok(r1.ids.join('/') === 'pA_1/pB_2/pC_3/pD_4', '★写真の見分けが変わった → ' + JSON.stringify(r1.ids));
  ok(r1.chosho.join('/') === 'true/false/false/false', '★工事調書に載せる印が変わった → ' + JSON.stringify(r1.chosho));
  ok(r1.kbAfter[0] * 1024 <= 1024 * 1024 && r1.kbAfter[2] * 1024 <= 1024 * 1024,
     '★大きい写真が軽くなっていない → ' + JSON.stringify(r1));
  ok(r1.smallSame === true,
     '★もともと軽い写真まで作り直している（押すたびに画質が落ちる） → ' + JSON.stringify(r1));
  ok(r1.name === '山田' && r1.edited === '2026-01-01T00:00:00.000Z',
     '★写真以外（氏名・更新日時）に触っている → ' + JSON.stringify(r1));

  // ---- ② もう一度押しても、もう書かない ----
  const r2 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162B', [{ label:'施工前', dataUri: big, id:'pE_1' }]);
    const fh = __mkFile('V162B.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162B.json': fh }), _name:'V162B.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162B' } };
    const a = await photoSlimCase(row);
    const t1 = fh._st.text;
    const bb = await photoSlimCase(row);
    return { first: a.kind, second: bb.kind, writes: fh._st.writes, same: fh._st.text === t1 };
  });
  console.log('②2回押す', JSON.stringify(r2));
  ok(r2.first === 'ok' && r2.second === 'same',
     '★2回目も縮めている（押すたびに画質が落ちる） → ' + JSON.stringify(r2));
  ok(r2.writes === 1 && r2.same === true, '★2回目に書き込んでいる → ' + JSON.stringify(r2));

  // ---- ③ 書く直前にファイルが外から変わっていたら、書かない ----
  const r3 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162C', [{ label:'施工前', dataUri: big, id:'pF_1' }]);
    const fh = __mkFile('V162C.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162C.json': fh }), _name:'V162C.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162C' } };
    // 縮めている途中で、別の端末がこのファイルを保存した
    const keep = photoFitForStorage;
    let out;
    try {
      photoFitForStorage = async u => { fh._st.text = __case('V162C', [
        { label:'施工前', dataUri: big, id:'pF_1' }, { label:'追加', dataUri: __photo(800,600,20), id:'pG_2' }]);
        return keep(u); };
      out = await photoSlimCase(row);
    } finally { photoFitForStorage = keep; }
    const after = JSON.parse(fh._st.text);
    return { kind: out.kind, writes: fh._st.writes, n: after.chosho_photos.length };
  });
  console.log('③書く前に外から変わった', JSON.stringify(r3));
  ok(r3.kind === 'other' && r3.writes === 0,
     '★書く直前にファイルが変わっていたのに書いている（相手の保存を消す） → ' + JSON.stringify(r3));
  ok(r3.n === 2, '★相手が足した写真が消えた → ' + JSON.stringify(r3));

  // ---- ④ 書いたあと読み返して写真が減っていたら、元に戻す ----
  const r4 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162D', [{ label:'施工前', dataUri: big, id:'pH_1' },
                                   { label:'施工完了', dataUri: __photo(3000,4000,30), id:'pI_2' }]);
    const fh = __mkFile('V162D.json', text0);
    // 書いたものが壊れる（写真が1枚落ちる）。元に戻す書き込みは壊さない
    let once = false;
    fh._st.mutateAfterWrite = buf => {
      if(once) return buf;
      once = true;
      const j = JSON.parse(buf); j.chosho_photos = j.chosho_photos.slice(0, 1);
      return JSON.stringify(j, null, 2);
    };
    const row = { fileType:'plain', _dir: __mkDir({ 'V162D.json': fh }), _name:'V162D.json',
                  fileHandle: fh, _photoCount: 2, data:{ chosho_mgmt_no:'V162D' } };
    const out = await photoSlimCase(row);
    const after = JSON.parse(fh._st.text);
    return { kind: out.kind, n: after.chosho_photos.length, restoredSame: fh._st.text === text0 };
  });
  console.log('④読み返しで減っていた', JSON.stringify(r4));
  ok(r4.kind === 'restored', '★写真が減ったのに元に戻していない → ' + JSON.stringify(r4));
  ok(r4.n === 2 && r4.restoredSame === true,
     '★元に戻した中身が元と違う（写真を失っている） → ' + JSON.stringify(r4));

  // ---- ⑤ 書いたあと別の端末が保存していたら、元に戻さない ----
  const r5 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const extra = __photo(800, 600, 20);
    const text0 = __case('V162E', [{ label:'施工前', dataUri: big, id:'pJ_1' }]);
    const fh = __mkFile('V162E.json', text0);
    // 書いた直後に、別の端末が写真を1枚足して保存した
    fh._st.mutateAfterWrite = buf => {
      const j = JSON.parse(buf);
      j.chosho_photos = j.chosho_photos.concat([{ label:'現場から', dataUri: extra, id:'pK_2' }]);
      return JSON.stringify(j, null, 2);
    };
    const row = { fileType:'plain', _dir: __mkDir({ 'V162E.json': fh }), _name:'V162E.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162E' } };
    const out = await photoSlimCase(row);
    const after = JSON.parse(fh._st.text);
    return { kind: out.kind, n: after.chosho_photos.length,
             hasExtra: after.chosho_photos.some(p => p.id === 'pK_2') };
  });
  console.log('⑤書いた直後に別の端末が保存', JSON.stringify(r5));
  ok(r5.kind === 'other', '★別の端末の保存を「壊れている」と見なしている → ' + JSON.stringify(r5));
  ok(r5.hasExtra === true && r5.n === 2,
     '★元に戻して、別の端末が足した写真を消している → ' + JSON.stringify(r5));

  // ---- ⑥ 書いたあと読み返せないときは、戻さず名指しで知らせる ----
  const r6 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162F', [{ label:'施工前', dataUri: big, id:'pL_1' }]);
    const fh = __mkFile('V162F.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162F.json': fh }), _name:'V162F.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162F' } };
    const orig = fh.getFile.bind(fh);
    let n = 0;
    fh.getFile = async () => { n++; if(n > 2) throw new Error('掴まれています'); return orig(); };
    const out = await photoSlimCase(row);
    const j = JSON.parse(fh._st.text);
    return { kind: out.kind, why: out.why, n: j.chosho_photos.length, writes: fh._st.writes };
  });
  console.log('⑥読み返せない', JSON.stringify(r6));
  ok(r6.kind === 'unverified',
     '★読み返せなかったのに、確かめたことにしている → ' + JSON.stringify(r6));
  ok(r6.writes === 1 && r6.n === 1,
     '★読み返せないときに元へ書き戻して、別の端末の保存を潰している → ' + JSON.stringify(r6));

  // ---- ⑦ 触らない戸別の見分け ----
  const r7 = await page.evaluate(() => {
    const fh = __mkFile('x.json', '{}');
    const dir = __mkDir({ 'x.json': fh });
    const base = () => ({ fileType:'plain', _dir: dir, _name:'x.json', fileHandle: fh,
                          _photoCount: 3, data:{ chosho_mgmt_no:'X1' } });
    const dup = new Set(['DUP1']);
    const mk = o => Object.assign(base(), o);
    const open = base(); _editingRow = open;
    const out = {
      ok:        photoSlimWhy(base(), dup),
      enc:       photoSlimWhy(mk({ fileType:'hybrid' }), dup),
      thumb:     photoSlimWhy(mk({ _fromProject:true }), dup),
      thumb2:    photoSlimWhy(mk({ data:{ chosho_mgmt_no:'X1', chosho_photos_thumb:true } }), dup),
      nofile:    photoSlimWhy(mk({ _dir:null }), dup),
      detached:  photoSlimWhy(mk({ _detached:true }), dup),
      nophoto:   photoSlimWhy(mk({ _photoCount:0 }), dup),
      dupmg:     photoSlimWhy(mk({ data:{ chosho_mgmt_no:'DUP1' } }), dup),
      editing:   photoSlimWhy(open, dup)
    };
    _editingRow = null;
    return out;
  });
  console.log('⑦触らない戸別', JSON.stringify(r7));
  ok(r7.ok === '', '★ふつうの戸別まで飛ばしている → ' + JSON.stringify(r7));
  ['enc','thumb','thumb2','nofile','detached','nophoto','dupmg','editing'].forEach(k => {
    ok(!!r7[k], '★' + k + ' の戸別を触ってしまう → ' + JSON.stringify(r7));
  });

  // ---- ⑧ 小さい写真しか無いファイルは、開いても書かない ----
  const r8 = await page.evaluate(async () => {
    const small = __photo(512, 384, 20);
    const text0 = JSON.stringify({ chosho_mgmt_no:'V162G', chosho_photos_thumb:true,
      chosho_photos:[{ label:'施工前', dataUri: small, id:'pM_1' }] }, null, 2);
    const fh = __mkFile('V162G.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162G.json': fh }), _name:'V162G.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162G' } };
    const out = await photoSlimCase(row);
    return { kind: out.kind, why: out.why, writes: fh._st.writes };
  });
  console.log('⑧ファイル側がサムネ', JSON.stringify(r8));
  ok(r8.kind === 'skip' && r8.writes === 0,
     '★小さい写真しか無いファイルを書き替えている（原寸を潰す） → ' + JSON.stringify(r8));

  // ---- ⑨ 見分けの無い写真には、縮める前に見分けを付ける ----
  const r9 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162H', [{ label:'施工前', dataUri: big }]);   // id が無い
    const wantId = photoContentId(big);
    const fh = __mkFile('V162H.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162H.json': fh }), _name:'V162H.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162H' } };
    const out = await photoSlimCase(row);
    const after = JSON.parse(fh._st.text);
    return { kind: out.kind, id: after.chosho_photos[0].id, wantId: wantId };
  });
  console.log('⑨見分けを付ける', JSON.stringify(r9));
  ok(r9.kind === 'ok' && r9.id === r9.wantId,
     '★見分けの無い写真を、縮めたあとの中身から付けている（現場取込で2枚になる） → ' + JSON.stringify(r9));

  // ---- ⑩ 縮めた結果が開けない写真なら、元のまま残して書かない ----
  const r10 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const text0 = __case('V162I', [{ label:'施工前', dataUri: big, id:'pN_1' }]);
    const fh = __mkFile('V162I.json', text0);
    const row = { fileType:'plain', _dir: __mkDir({ 'V162I.json': fh }), _name:'V162I.json',
                  fileHandle: fh, _photoCount: 1, data:{ chosho_mgmt_no:'V162I' } };
    // 小さくはなるが、画像として開けないものが返ってきた想定
    const junk = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
    const keep = photoFitForStorage;
    let out;
    try { photoFitForStorage = async () => junk; out = await photoSlimCase(row); }
    finally { photoFitForStorage = keep; }
    const after = JSON.parse(fh._st.text);
    return { kind: out.kind, writes: fh._st.writes,
             same: after.chosho_photos[0].dataUri === big, noShrink: out.noShrink };
  });
  console.log('⑩開けない写真になった', JSON.stringify(r10));
  ok(r10.writes === 0 && r10.same === true,
     '★縮めた結果が開けない写真でも、確かめずに書き込んでいる（写真が白い枠になる） → ' + JSON.stringify(r10));
  ok(r10.kind === 'same' && r10.noShrink === 1,
     '縮められなかったことを数えていない → ' + JSON.stringify(r10));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v162_main');
})();
