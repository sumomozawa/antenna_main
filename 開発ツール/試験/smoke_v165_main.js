/* 版165（メイン）
   ・保安器の所に「既設2分配器」がある現場（中継せず分配器に接続）を選べる
     → 図面は保安器台のところに黒（既設）で出る／FA中継は出ない
     → 材料にも金額にも出ない（もとからある物）
   ・写真：撮った日時（Exif）を足しても 1枚 約1MB を超えない
     → だから同じ写真を入れ直しても2回目で縮まない＝画質が落ちない */
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
    f: ['faPointOf','buildBOM','rebuild','photoFitForStorage','photoExifToCarry',
        'photoCarryExif','photoExifClearOrientation','photoIsFitSize']
         .filter(n => typeof window[n] !== 'function'),
    opt: Array.from((document.getElementById('fa_splitter') || {options:[]}).options).map(o => o.value),
    ver: APP_VERSION
  }));
  console.log('⓪前提', JSON.stringify(ready));
  ok(ready.f.length === 0, '試験の前提: 無い関数がある → ' + ready.f.join(' / '));
  ok(ready.opt.indexOf('exist_2sp') >= 0,
     '★「既設2分配器（流用）」が選べない → ' + JSON.stringify(ready.opt));
  ok(ready.opt[0] === 'no', '★既定が「なし」でなくなっている → ' + JSON.stringify(ready.opt));
  ok(!!WANT_VER && ready.ver === WANT_VER,
     '★画面の版番号がファイルの APP_VERSION と違う → 画面 ' + ready.ver + ' ／ ファイル ' + WANT_VER);
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); await b.close(); process.exit(1); }

  await page.evaluate(() => {
    window.__set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };
    // 積算の合計（材料＋労務）
    window.__sum = () => (STATE.bom || [])
      .reduce((a, r) => a + (Number(r.material_cost) || 0) * r.qty + (Number(r.labor_cost) || 0) * r.qty, 0);
    // FA接続部の分配器として積んだ行
    window.__faSp = () => (STATE.bom || []).filter(r => String(r.note || '').indexOf('FA接続部') >= 0)
      .map(r => ({ id: r.id, qty: r.qty }));
    // 図面のノード（文字と、新規(new)／既設(exist) の別）
    window.__node = txt => {
      const g = Array.from(document.querySelectorAll('#diagram g.node'))
        .filter(n => (n.textContent || '').replace(/\s+/g, '').indexOf(txt) >= 0)[0];
      if(!g) return null;
      const r = g.querySelector('rect');
      return { text: (g.textContent || '').replace(/\s+/g, ' ').trim(),
               state: r ? r.getAttribute('class') : '', id: g.getAttribute('data-id') };
    };
    // 図面のノードを data-id で探す（同じ字づらの箱が他にもあるため）
    window.__nodeId = id => {
      const g = document.querySelector('#diagram g.node[data-id="' + id + '"]');
      if(!g) return null;
      const r = g.querySelector('rect');
      return { text: (g.textContent || '').replace(/\s+/g, ' ').trim(),
               state: r ? r.getAttribute('class') : '' };
    };
    // CATV＋通常電源の現場にそろえる
    window.__catv = () => {
      __set('work_type', 'catv_to_uhf');
      __set('is_catv', 'yes');
      __set('power_pos', 'tv_back');
      __set('use_fa', 'no');
      __set('fa_splitter_pos', 'instead');
    };
  });

  // ---- ① 既設2分配器を選んでも、材料も金額も増えない ----
  const r1 = await page.evaluate(() => {
    __catv(); __set('fa_splitter', 'no'); rebuild();
    const none = { sum: __sum(), faSp: __faSp() };
    __set('fa_splitter', 'exist_2sp'); rebuild();
    const exist = { sum: __sum(), faSp: __faSp() };
    __set('fa_splitter', 'sp_2cw'); rebuild();
    const neww = { sum: __sum(), faSp: __faSp() };
    __set('fa_splitter', 'exist_2sp'); rebuild();
    return { none, exist, neww };
  });
  console.log('①金額', JSON.stringify(r1));
  ok(r1.exist.sum === r1.none.sum,
     '★既設の分配器なのに金額が増えている（もとからある物にお金が付く） → '
     + r1.none.sum + ' → ' + r1.exist.sum);
  ok(r1.exist.faSp.length === 0,
     '★既設の分配器が使用材料に出ている → ' + JSON.stringify(r1.exist.faSp));
  // ここが上がらないと、上の2つは「そもそも何も効いていない」だけかもしれない
  ok(r1.neww.sum > r1.none.sum && r1.neww.faSp.length === 1,
     '試験の前提: 新規の2分配器WPで金額が増えない → ' + JSON.stringify(r1.neww));

  // ---- ② 図面：保安器台のところに黒（既設）で出て、FA中継は出ない ----
  const r2 = await page.evaluate(() => {
    __catv(); __set('fa_splitter', 'exist_2sp'); __set('use_fa', 'no'); rebuild();
    const exist = { sp: __node('2分配器(既設)'), fa: __node('FA中継') };
    __set('fa_splitter', 'sp_2cw'); rebuild();
    const neww = { sp: __nodeId('sp_2cw'), fa: __node('FA中継') };
    __set('fa_splitter', 'no'); __set('use_fa', 'yes'); rebuild();
    const faOnly = { sp: __node('2分配器(既設)'), fa: __node('FA中継') };
    return { exist, neww, faOnly };
  });
  console.log('②図面', JSON.stringify(r2));
  ok(!!r2.exist.sp, '★図面に既設の2分配器が出ない → ' + JSON.stringify(r2.exist));
  ok(r2.exist.sp && r2.exist.sp.state === 'exist',
     '★既設の2分配器が「新規（赤）」で出ている（新しく買う物に見える） → ' + JSON.stringify(r2.exist.sp));
  ok(!r2.exist.fa, '★中継しない現場なのに FA中継 が図面に出る → ' + JSON.stringify(r2.exist));
  ok(r2.neww.sp && r2.neww.sp.state === 'new',
     '試験の前提: 新規の分配器が赤で出ない → ' + JSON.stringify(r2.neww.sp));
  ok(!!r2.faOnly.fa && !r2.faOnly.sp,
     '試験の前提: これまでどおりの FA中継だけの現場が出ない → ' + JSON.stringify(r2.faOnly));

  // ---- ③ 保存して読み直しても、選んだものが残る ----
  const r3 = await page.evaluate(() => {
    __catv(); __set('fa_splitter', 'exist_2sp'); rebuild();
    const saved = collectState();
    __set('fa_splitter', 'no'); rebuild();
    applyStateData(saved);
    rebuild();
    return { back: document.getElementById('fa_splitter').value, sum: __sum() };
  });
  console.log('③読み直し', JSON.stringify(r3));
  ok(r3.back === 'exist_2sp', '★保存して開き直すと「既設2分配器」が消える → ' + JSON.stringify(r3));

  // ---- ④ 写真：撮った日時を足しても 1MB を超えない（2回目で縮まない） ----
  await page.evaluate(() => {
    const NUL = String.fromCharCode(0);
    window.__photo = (w, h, q) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
      let s = 77; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
        const i = (y * w + x) * 4;
        const v = 128 + Math.sin(x * 0.21) * 60 + Math.cos(y * 0.17) * 50 + (rnd() - 0.5) * 110;
        img.data[i] = v; img.data[i+1] = v * 0.8 + 30; img.data[i+2] = 255 - v; img.data[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return cv.toDataURL('image/jpeg', q == null ? 0.95 : q);
    };
    /* Exif を付ける。pad＝中身の水増し（実機のサムネ入り Exif は 20〜60KB ある）。
       orientKind: 'ok'＝ふつうの向きの印／'long'＝見慣れない書き方（読み切れない）／'none'＝印なし */
    window.__withExif = (dataUri, orient, pad, orientKind) => {
      const model = 'TESTCAM' + NUL;
      const dt = '2026:09:16 08:30:00' + NUL;
      const kind = orientKind || 'ok';
      const ifd0N = (kind === 'none') ? 3 : 4;
      const ifd0Off = 8, ifd0Len = 2 + ifd0N * 12 + 4;
      const exifOff = ifd0Off + ifd0Len, exifN = 1, exifLen = 2 + exifN * 12 + 4;
      const modelOff = exifOff + exifLen;
      const dtOff = modelOff + model.length;
      const padOff = dtOff + dt.length;
      const t = new Uint8Array(padOff + pad);
      const w16 = (o, v) => { t[o] = v & 255; t[o+1] = (v >> 8) & 255; };
      const w32 = (o, v) => { t[o] = v & 255; t[o+1] = (v >> 8) & 255; t[o+2] = (v >> 16) & 255; t[o+3] = (v >>> 24) & 255; };
      t[0] = 0x49; t[1] = 0x49; w16(2, 0x2A); w32(4, ifd0Off);
      w16(ifd0Off, ifd0N);
      let e = ifd0Off + 2;
      w16(e, 0x0110); w16(e+2, 2); w32(e+4, model.length); w32(e+8, modelOff); e += 12;
      if(kind !== 'none'){
        // 'long' は型を LONG(4) にする＝この作りでは書き替えられない
        w16(e, 0x0112); w16(e+2, kind === 'long' ? 4 : 3); w32(e+4, 1); w32(e+8, orient); e += 12;
      }
      w16(e, 0x010E); w16(e+2, 2); w32(e+4, pad); w32(e+8, padOff); e += 12;   // メモ＝水増し
      w16(e, 0x8769); w16(e+2, 4); w32(e+4, 1); w32(e+8, exifOff); e += 12;
      w32(e, 0);
      w16(exifOff, exifN);
      w16(exifOff + 2, 0x9003); w16(exifOff + 4, 2); w32(exifOff + 6, dt.length); w32(exifOff + 10, dtOff);
      w32(exifOff + 14, 0);
      for(let i = 0; i < model.length; i++) t[modelOff + i] = model.charCodeAt(i);
      for(let i = 0; i < dt.length; i++) t[dtOff + i] = dt.charCodeAt(i);
      for(let i = 0; i < pad - 1; i++) t[padOff + i] = 0x41;
      const segLen = 2 + 6 + t.length;
      const seg = new Uint8Array(2 + segLen);
      seg[0] = 0xFF; seg[1] = 0xE1; seg[2] = (segLen >> 8) & 255; seg[3] = segLen & 255;
      const tag = 'Exif' + NUL + NUL;
      for(let i = 0; i < 6; i++) seg[4 + i] = tag.charCodeAt(i);
      seg.set(t, 10);
      const src = photoAllBytes(dataUri);
      const o = new Uint8Array(src.length + seg.length);
      o.set(src.subarray(0, 2), 0); o.set(seg, 2); o.set(src.subarray(2), 2 + seg.length);
      return photoBytesToDataUri(o, 'image/jpeg');
    };
    window.__dim = uri => new Promise(r => { const im = new Image();
      im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r([0,0]); im.src = uri; });
  });

  const r4 = await page.evaluate(async () => {
    const out = [];
    for(const pad of [200, 60000]){
      const src = __withExif(__photo(4032, 3024), 6, pad);
      const one = await photoFitForStorage(src);
      const two = await photoFitForStorage(one);
      out.push({
        pad: pad,
        kb: Math.round(photoBytesOf(one) / 1024),
        over: photoBytesOf(one) > PHOTO_FIT_MAX_BYTES,
        again: two !== one,
        fit: photoIsFitSize(one),
        hasExif: !!photoExifSegment(photoHeadBytes(one, 262144))
      });
    }
    return out;
  });
  console.log('④写真の大きさ', JSON.stringify(r4));
  r4.forEach(x => {
    ok(x.over === false,
       '★撮った日時を足したら 1枚 約1MB を超えた（Exif ' + Math.round(x.pad/1024) + 'KB のとき） → ' + JSON.stringify(x));
    ok(x.again === false,
       '★もう一度入れると また縮む（同じ写真を保存するたび画質が落ちる） → ' + JSON.stringify(x));
    ok(x.fit === true,
       '★「目安の内」と見なされない（同じ写真が2つあるとき、重いほうが残ってしまう） → ' + JSON.stringify(x));
    ok(x.hasExif === true, '★撮った日時が消えた → ' + JSON.stringify(x));
  });

  // ---- ⑤ 向きの印を直せないときは、日時を付けない（写真が横倒しになるより良い） ----
  const r5 = await page.evaluate(async () => {
    const bad = __withExif(__photo(3000, 2250), 6, 400, 'long');   // 見慣れない書き方の向きの印
    const fitBad = await photoFitForStorage(bad);
    const none = __withExif(__photo(3000, 2250), 1, 400, 'none');  // 向きの印がもともと無い
    const fitNone = await photoFitForStorage(none);
    return { badExif: !!photoExifSegment(photoHeadBytes(fitBad, 262144)),
             badOk: photoBytesOf(fitBad) < photoBytesOf(bad) && (await __dim(fitBad))[0] > 0,
             noneExif: !!photoExifSegment(photoHeadBytes(fitNone, 262144)),
             noneOk: photoBytesOf(fitNone) < photoBytesOf(none) };
  });
  console.log('⑤向きの印', JSON.stringify(r5));
  ok(r5.badExif === false,
     '★向きの印を直せないのに日時を付けている（縦の写真が二重に回って横倒しになる） → ' + JSON.stringify(r5));
  ok(r5.badOk === true, '★向きの印が読めない写真が入らなくなった（写真を失う） → ' + JSON.stringify(r5));
  ok(r5.noneExif === true,
     '★向きの印がもともと無い写真で、撮った日時まで捨てている → ' + JSON.stringify(r5));
  ok(r5.noneOk === true, '向きの印が無い写真が縮まない → ' + JSON.stringify(r5));

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v165_main');
})();
