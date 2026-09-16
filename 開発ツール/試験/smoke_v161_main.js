/* 版161: 写真を入れるときに、大きすぎるものだけ自動で軽くする（メイン）。
   ・約1MBを超える写真だけ縮める／もともと小さい写真には1バイトも触らない
   ・枚数は絶対に変えない。開けない写真は元のまま入れる（捨てない）
   ・まとめて取り込み・1枚ずつの欄、どちらの道でも効く */
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
    f: ['photoFitForStorage','photoRenderSmaller','photoBytesOf','bulkImportPhotoFiles',
        'readPhotoFileToEntry','photoContentId'].filter(n => typeof window[n] !== 'function'),
    cap: (typeof PHOTO_FIT_MAX_BYTES === 'number') ? PHOTO_FIT_MAX_BYTES : 0,
    minEdge: (typeof PHOTO_FIT_MIN_EDGE === 'number') ? PHOTO_FIT_MIN_EDGE : 0,
    maxEdge: (typeof PHOTO_FIT_MAX_EDGE === 'number') ? PHOTO_FIT_MAX_EDGE : 0,
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.maxEdge === 2048,
     '★写真の長辺が2048pxでない（工事調書の見え方が変わる） → ' + ready.maxEdge);
  ok(ready.cap >= 500 * 1024 && ready.cap <= 1024 * 1024,
     '★1枚の目安が 500KB〜1MB の外 → ' + ready.cap);
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  // 工事写真に近い、細かい模様のある画像を作る道具を入れておく
  await page.evaluate(() => {
    window.__photo = (w, h, noise) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(w, h);
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
    window.__dim = uri => new Promise(r => { const im = new Image();
      im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r([0,0]); im.src = uri; });
    window.__file = (uri, name) => {
      const bin = atob(uri.slice(uri.indexOf(',') + 1));
      const u8 = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new File([u8], name || 'a.jpg', { type: 'image/jpeg' });
    };
  });

  // ---- ① 大きい写真は目安に収まり、小さい写真には触らない ----
  const r1 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const fit = await photoFitForStorage(big);
    const small = __photo(900, 700, 20);
    const same = await photoFitForStorage(small);
    return { beforeKB: Math.round(photoBytesOf(big)/1024), afterKB: Math.round(photoBytesOf(fit)/1024),
             dim: await __dim(fit),
             smallKB: Math.round(photoBytesOf(small)/1024), untouched: same === small };
  });
  console.log('①大小', JSON.stringify(r1));
  ok(r1.afterKB * 1024 <= ready.cap, '★大きい写真が目安に収まらない → ' + JSON.stringify(r1));
  ok(r1.afterKB < r1.beforeKB, '★大きい写真が軽くなっていない → ' + JSON.stringify(r1));
  ok(Math.max(r1.dim[0], r1.dim[1]) >= ready.minEdge,
     '★縮めすぎて工事調書で粗くなる大きさ → ' + JSON.stringify(r1));
  ok(Math.max(r1.dim[0], r1.dim[1]) === ready.maxEdge,
     '★必要以上に小さくしている（長辺は手で縮めているのと同じ2048pxのはず） → ' + JSON.stringify(r1));
  ok(r1.untouched === true,
     '★もともと小さい写真まで作り直している（保存のたびに画質が落ちる） → ' + JSON.stringify(r1));

  // ---- ② 縦長でも横長でも収まる ----
  const r2 = await page.evaluate(async () => {
    const out = {};
    for(const [w, h, k] of [[4000,3000,'yoko'],[3000,4000,'tate'],[5000,1200,'yokonaga']]){
      const fit = await photoFitForStorage(__photo(w, h, 30));
      out[k] = { kb: Math.round(photoBytesOf(fit)/1024), dim: await __dim(fit) };
    }
    return out;
  });
  console.log('②縦横', JSON.stringify(r2));
  ['yoko','tate','yokonaga'].forEach(k => {
    ok(r2[k].kb * 1024 <= ready.cap, '★' + k + ' が目安に収まらない → ' + JSON.stringify(r2[k]));
    ok(r2[k].dim[0] > 0 && r2[k].dim[1] > 0, '★' + k + ' が画像として開けない → ' + JSON.stringify(r2[k]));
  });

  // ---- ③ 開けない写真は元のまま返す（捨てない） ----
  const r3 = await page.evaluate(async () => {
    const junk = 'data:image/jpeg;base64,' + 'A'.repeat(3 * 1024 * 1024);
    const out = await photoFitForStorage(junk);
    return { same: out === junk, nullSame: (await photoFitForStorage(null)) === null,
             emptySame: (await photoFitForStorage('')) === '' };
  });
  console.log('③開けない写真', JSON.stringify(r3));
  ok(r3.same === true, '★開けない写真を、縮めたつもりで壊している（写真を失う） → ' + JSON.stringify(r3));
  ok(r3.nullSame === true && r3.emptySame === true, '空の写真枠で落ちる → ' + JSON.stringify(r3));

  // ---- ④ まとめて取り込み：枚数は変わらず、大きい写真は軽くなる ----
  const r4 = await page.evaluate(async () => {
    STATE.photos = [];
    const big = __photo(4032, 3024, 30);
    const big2 = __photo(3000, 4000, 30);
    await bulkImportPhotoFiles([__file(big, '1_施工前.jpg'), __file(big2, '2_施工完了.jpg')]);
    const got = STATE.photos.filter(p => p && p.dataUri);
    return { n: got.length,
             kb: got.map(p => Math.round(photoBytesOf(p.dataUri)/1024)),
             srcKB: Math.round(photoBytesOf(big)/1024),
             idOk: got.every(p => p.id && p.id === photoContentId(p.dataUri)),
             labels: got.map(p => p.label) };
  });
  console.log('④まとめて取り込み', JSON.stringify(r4));
  ok(r4.n === 2, '★まとめて取り込みで枚数が合わない → ' + JSON.stringify(r4));
  ok(r4.kb.every(k => k * 1024 <= ready.cap),
     '★まとめて取り込みで写真が軽くならない → ' + JSON.stringify(r4));
  ok(r4.idOk === true,
     '★写真IDが、入れた中身と合っていない（現場入力との突合が外れる） → ' + JSON.stringify(r4));
  ok(r4.labels.join('/') === '1_施工前/2_施工完了',
     'ラベルがファイル名になっていない → ' + JSON.stringify(r4.labels));

  // ---- ⑤ 1枚ずつの欄からでも軽くなる ----
  const r5 = await page.evaluate(async () => {
    STATE.photos = [{ label:'施工前', dataUri:null }];
    const big = __photo(4032, 3024, 30);
    const inp = { files: [__file(big, 'x.jpg')], value: '' };
    readPhotoFileToEntry(inp, 0);
    for(let i = 0; i < 80 && !(STATE.photos[0] && STATE.photos[0].dataUri); i++)
      await new Promise(r => setTimeout(r, 100));
    const p = STATE.photos[0];
    return { has: !!(p && p.dataUri), kb: p && p.dataUri ? Math.round(photoBytesOf(p.dataUri)/1024) : 0,
             srcKB: Math.round(photoBytesOf(big)/1024),
             idOk: !!(p && p.id && p.id === photoContentId(p.dataUri)), n: STATE.photos.length };
  });
  console.log('⑤1枚ずつ', JSON.stringify(r5));
  ok(r5.has === true, '★1枚ずつの欄から写真が入らない → ' + JSON.stringify(r5));
  ok(r5.kb * 1024 <= ready.cap, '★1枚ずつの欄では軽くならない → ' + JSON.stringify(r5));
  ok(r5.idOk === true, '★1枚ずつの欄で写真IDが中身と合わない → ' + JSON.stringify(r5));
  ok(r5.n === 1, '枠が増えている → ' + JSON.stringify(r5));

  // ---- ⑥ もともと2048pxより小さい写真は、引き伸ばさない ----
  const r6 = await page.evaluate(async () => {
    const noise = (w, h, q) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
      let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      for(let i = 0; i < w * h; i++){ const j = i * 4, v = rnd() * 255;
        img.data[j] = v; img.data[j+1] = v; img.data[j+2] = v; img.data[j+3] = 255; }
      ctx.putImageData(img, 0, 0); return cv.toDataURL('image/jpeg', q);
    };
    const src = noise(1600, 1200, 0.95);          // 長辺1600 だが 1MB超
    const fit = await photoFitForStorage(src);
    return { beforeKB: Math.round(photoBytesOf(src)/1024), afterKB: Math.round(photoBytesOf(fit)/1024),
             dim: await __dim(fit), srcDim: await __dim(src) };
  });
  console.log('⑥引き伸ばさない', JSON.stringify(r6));
  ok(Math.max(r6.dim[0], r6.dim[1]) <= Math.max(r6.srcDim[0], r6.srcDim[1]),
     '★もとの写真より大きく引き伸ばしている（重くなるだけで、きれいにはならない） → ' + JSON.stringify(r6));
  ok(r6.afterKB <= r6.beforeKB, '★軽くするはずが重くなっている → ' + JSON.stringify(r6));

  // ---- ⑦ とても細かい写真でも、目安に収まるまで粘る ----
  const r7 = await page.evaluate(async () => {
    const cv = document.createElement('canvas'); cv.width = 4032; cv.height = 3024;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(4032, 3024);
    let s = 11; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for(let i = 0; i < 4032 * 3024; i++){ const j = i * 4, v = rnd() * 255;
      img.data[j] = v; img.data[j+1] = v; img.data[j+2] = v; img.data[j+3] = 255; }
    ctx.putImageData(img, 0, 0);
    const src = cv.toDataURL('image/jpeg', 0.9);
    const fit = await photoFitForStorage(src);
    return { beforeKB: Math.round(photoBytesOf(src)/1024), afterKB: Math.round(photoBytesOf(fit)/1024),
             dim: await __dim(fit) };
  });
  console.log('⑦細かい写真', JSON.stringify(r7));
  ok(r7.afterKB * 1024 <= ready.cap,
     '★とても細かい写真だけ、目安を超えたまま入ってしまう → ' + JSON.stringify(r7));
  ok(Math.max(r7.dim[0], r7.dim[1]) >= ready.minEdge,
     '★とても細かい写真を、工事調書で粗くなるほど小さくしている → ' + JSON.stringify(r7));

  // ---- ⑧ 縦で撮った写真が、横になって入らない（向きの情報を持つJPEG） ----
  const r8 = await page.evaluate(async () => {
    const w = 3000, h = 2250;                      // センサーは横長で記録する
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
    let s = 3; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
      const i = (y * w + x) * 4, v = (y < h / 2 ? 210 : 70) + (rnd() - 0.5) * 60;
      img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const plain = cv.toDataURL('image/jpeg', 0.9);
    // 「右に90度回して見せる」印（Orientation=6）を差し込む＝スマホの縦撮りと同じ形
    const bin = atob(plain.slice(plain.indexOf(',') + 1));
    const src = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) src[i] = bin.charCodeAt(i);
    const app1 = [0xFF,0xE1,0x00,0x22, 0x45,0x78,0x69,0x66,0x00,0x00,
                  0x49,0x49, 0x2A,0x00, 0x08,0x00,0x00,0x00, 0x01,0x00,
                  0x12,0x01, 0x03,0x00, 0x01,0x00,0x00,0x00, 0x06,0x00,0x00,0x00,
                  0x00,0x00,0x00,0x00];
    const arr = new Uint8Array(src.length + app1.length);
    arr.set(src.slice(0, 2), 0); arr.set(app1, 2); arr.set(src.slice(2), 2 + app1.length);
    let str = ''; for(let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
    const withExif = 'data:image/jpeg;base64,' + btoa(str);
    const fit = await photoFitForStorage(withExif);
    const shown = await __dim(withExif), after = await __dim(fit);
    return { shown, after, kb: Math.round(photoBytesOf(fit)/1024),
             tateBefore: shown[1] > shown[0], tateAfter: after[1] > after[0] };
  });
  console.log('⑧写真の向き', JSON.stringify(r8));
  ok(r8.tateBefore === true, '試験の前提: 縦に見える写真が作れていない → ' + JSON.stringify(r8));
  ok(r8.tateAfter === true,
     '★縦で撮った写真が、軽くしたときに横になって入る → ' + JSON.stringify(r8));
  ok(r8.kb * 1024 <= ready.cap, '向きのある写真が目安に収まらない → ' + JSON.stringify(r8));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v161_main');
})();
