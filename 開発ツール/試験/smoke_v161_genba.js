/* 版161: 写真を撮った・選んだときに、大きすぎるものだけ自動で軽くする（現場入力）。
   ・約1MBを超える写真だけ縮める／もともと小さい写真には1バイトも触らない
   ・枚数は絶対に変えない。開けない写真は元のまま入れる（捨てない）
   ・戸別の写真と、特別記録の写真の両方で効く */
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

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:420,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(HTML); await page.waitForTimeout(2500);

  // ---- ⓪ 前提 ----
  const ready = await page.evaluate(() => ({
    f: ['photoFitForStorage','photoRenderSmaller','photoBytesOf','handlePhotoFiles','photoContentId']
         .filter(n => typeof window[n] !== 'function'),
    cap: (typeof PHOTO_FIT_MAX_BYTES === 'number') ? PHOTO_FIT_MAX_BYTES : 0,
    minEdge: (typeof PHOTO_FIT_MIN_EDGE === 'number') ? PHOTO_FIT_MIN_EDGE : 0,
    maxEdge: (typeof PHOTO_FIT_MAX_EDGE === 'number') ? PHOTO_FIT_MAX_EDGE : 0,
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.maxEdge === 2048,
     '★写真の長辺が2048pxでない（工事調書の見え方が変わる） → ' + ready.maxEdge);
  ok(ready.cap >= 500 * 1024 && ready.cap <= 1024 * 1024, '★1枚の目安が 500KB〜1MB の外 → ' + ready.cap);
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

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
    window.__file = (uri, name) => {
      const bin = atob(uri.slice(uri.indexOf(',') + 1));
      const u8 = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new File([u8], name || 'a.jpg', { type: 'image/jpeg' });
    };
  });

  // ---- ① 大きい写真は目安に収まり、小さい写真には触らない（PCと同じふるまい） ----
  const r1 = await page.evaluate(async () => {
    const big = __photo(4032, 3024, 30);
    const fit = await photoFitForStorage(big);
    const small = __photo(900, 700, 20);
    const dim = await new Promise(r => { const im = new Image();
      im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r([0,0]); im.src = fit; });
    return { beforeKB: Math.round(photoBytesOf(big)/1024), afterKB: Math.round(photoBytesOf(fit)/1024),
             dim, untouched: (await photoFitForStorage(small)) === small };
  });
  console.log('①大小', JSON.stringify(r1));
  ok(r1.afterKB * 1024 <= ready.cap, '★大きい写真が目安に収まらない → ' + JSON.stringify(r1));
  ok(r1.afterKB < r1.beforeKB, '★大きい写真が軽くなっていない → ' + JSON.stringify(r1));
  ok(Math.max(r1.dim[0], r1.dim[1]) >= ready.minEdge, '★縮めすぎ → ' + JSON.stringify(r1));
  ok(Math.max(r1.dim[0], r1.dim[1]) === ready.maxEdge,
     '★必要以上に小さくしている（長辺は手で縮めているのと同じ2048pxのはず） → ' + JSON.stringify(r1));
  ok(r1.untouched === true, '★もともと小さい写真まで作り直している → ' + JSON.stringify(r1));

  // ---- ② 撮る／選ぶ：枚数は変わらず、軽くなり、IDが中身と合う ----
  const r2 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'V161';
    const big = __photo(4032, 3024, 30), big2 = __photo(3000, 4000, 30);
    const srcKB = Math.round(photoBytesOf(big)/1024);
    await handlePhotoFiles([__file(big, 'a.jpg'), __file(big2, 'b.jpg')]);
    const got = (M.chosho_photos || []).filter(p => p && p.dataUri);
    return { n: got.length, srcKB,
             kb: got.map(p => Math.round(photoBytesOf(p.dataUri)/1024)),
             idOk: got.every((p, i) => p.id && p.id === photoContentId(i === 0 ? big : big2)),
             labels: got.map(p => p.label) };
  });
  console.log('②撮る・選ぶ', JSON.stringify(r2));
  ok(r2.n === 2, '★撮った枚数と入った枚数が合わない → ' + JSON.stringify(r2));
  ok(r2.kb.every(k => k * 1024 <= ready.cap), '★撮った写真が軽くならない → ' + JSON.stringify(r2));
  ok(r2.kb.every(k => k < r2.srcKB), '★元より軽くなっていない → ' + JSON.stringify(r2));
  ok(r2.idOk === true,
     '★写真IDが、入れた中身と合っていない（PCとの突合が外れて写真が二重になる） → ' + JSON.stringify(r2));
  ok(r2.labels[0] === '施工前', 'ラベルの採番が変わっている → ' + JSON.stringify(r2.labels));

  // ---- ③ 開けない写真でも、枚数を減らさずそのまま入れる ----
  const r3 = await page.evaluate(async () => {
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'V161B';
    const junk = 'data:image/jpeg;base64,' + 'A'.repeat(2 * 1024 * 1024);
    const kept = (await photoFitForStorage(junk)) === junk;
    const good = __photo(1000, 800, 20);
    await handlePhotoFiles([__file(good, 'ok.jpg')]);
    return { kept, n: (M.chosho_photos || []).filter(p => p && p.dataUri).length };
  });
  console.log('③開けない写真', JSON.stringify(r3));
  ok(r3.kept === true, '★開けない写真を壊して入れている（写真を失う） → ' + JSON.stringify(r3));
  ok(r3.n === 1, '枚数が合わない → ' + JSON.stringify(r3));

  // ---- ④ 特別記録（資材検収などの写真）でも軽くなる ----
  const r4 = await page.evaluate(async () => {
    if(typeof openSpecialModal !== 'function' || typeof spBlank !== 'function') return { skip: true };
    await openSpecialModal();
    _spCur = spBlank();
    await renderSpecial();
    const inp = document.getElementById('sp-pick');
    if(!inp) return { noInput: true };
    const big = __photo(4032, 3024, 30);
    const srcKB = Math.round(photoBytesOf(big)/1024);
    const dt = new DataTransfer(); dt.items.add(__file(big, 'sp.jpg'));
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    for(let i = 0; i < 100 && !((_spCur.photos || []).length); i++)
      await new Promise(r => setTimeout(r, 100));
    const got = (_spCur.photos || []).filter(p => p && p.dataUri);
    const out = { n: got.length, srcKB,
                  kb: got.map(p => Math.round(photoBytesOf(p.dataUri)/1024)),
                  idOk: got.every(p => p.id && p.id === photoContentId(big)) };
    closeSpecialModal();
    return out;
  });
  console.log('④特別記録', JSON.stringify(r4));
  if(!r4.skip && !r4.noInput){
    ok(r4.n === 1, '★特別記録に写真が入らない → ' + JSON.stringify(r4));
    ok(r4.kb.every(k => k * 1024 <= ready.cap),
       '★特別記録の写真だけ軽くならない（資材検収の写真でファイルが重くなる） → ' + JSON.stringify(r4));
    ok(r4.idOk === true, '★特別記録の写真IDが中身と合わない → ' + JSON.stringify(r4));
  }

  // ---- ⑤ 読み込み中に同じ戸別を開き直しても、写真が消えない ----
  const r5 = await page.evaluate(async () => {
    if(typeof photoKeepInto !== 'function') return { skip: true };
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'RACE1';
    const model = M;
    const a = __photo(1200, 900, 20), bb = __photo(1100, 800, 20);
    model.chosho_photos.push({ label:'施工前', dataUri: a, id: photoContentId(a) });
    // 読んでいる途中で、同じ戸別を控えから開き直した（M が別のものに入れ替わる）
    const reopened = freshModel(); ensureModelShape(reopened);
    reopened.chosho_mgmt_no = 'RACE1';
    reopened._lastDraftKey = 'no:RACE1';
    M = reopened;
    // 残りの写真が読み終わった
    model.chosho_photos.push({ label:'施工完了', dataUri: bb, id: photoContentId(bb) });
    await photoKeepInto(model);
    const onScreen = (M.chosho_photos || []).filter(p => p && p.dataUri);
    // そのあと画面から保存する（ここで消えていた）
    await saveDraft();
    const kept = (M.chosho_photos || []).filter(p => p && p.dataUri);
    return { onScreen: onScreen.length, kept: kept.length,
             ids: kept.map(p => p.id).sort().join('/'),
             want: [photoContentId(a), photoContentId(bb)].sort().join('/') };
  });
  console.log('⑤開き直し', JSON.stringify(r5));
  if(!r5.skip){
    ok(r5.onScreen === 2,
       '★読み込み中に同じ戸別を開き直すと、入れたはずの写真が画面に入らない → ' + JSON.stringify(r5));
    ok(r5.kept === 2 && r5.ids === r5.want,
       '★そのあと保存すると、読み込んだ写真が消える → ' + JSON.stringify(r5));
  }

  // ---- ⑥ 別の戸別へ移ったときは、読込元のほうへ確定保存する（混ざらない） ----
  const r6 = await page.evaluate(async () => {
    if(typeof photoKeepInto !== 'function') return { skip: true };
    M = freshModel(); ensureModelShape(M); M.chosho_mgmt_no = 'RACE2';
    const model = M;
    const a = __photo(1000, 800, 20);
    model.chosho_photos.push({ label:'施工前', dataUri: a, id: photoContentId(a) });
    const other = freshModel(); ensureModelShape(other); other.chosho_mgmt_no = 'RACE3';
    M = other;
    await photoKeepInto(model);
    return { other: (M.chosho_photos || []).filter(p => p && p.dataUri).length,
              src: (model.chosho_photos || []).filter(p => p && p.dataUri).length };
  });
  console.log('⑥別の戸別へ移った', JSON.stringify(r6));
  if(!r6.skip){
    ok(r6.other === 0, '★別の戸別に写真が混ざった → ' + JSON.stringify(r6));
    ok(r6.src === 1, '読込元から写真が消えた → ' + JSON.stringify(r6));
  }

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v161_genba');
})();
