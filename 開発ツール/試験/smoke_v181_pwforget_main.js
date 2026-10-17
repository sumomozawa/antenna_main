/* 版181（メイン）：「🗝 パスワードを忘れる」で、まだ戸別ファイルに入っていない写真・直しを一覧から消さない
   ★決まり★ 写真はいかなる経路でも減らさない。
   前は、パスワードを忘れると、ほどいてあった暗号の行（.hyb・.enc）を、ファイルの封筒から作り直して伏せていた。
   そのため 📥 現場取込で入れて、まだ暗号の戸別ファイルに入れられなかった写真・欄（行にだけある）が一覧から消えた。
     ① .hyb の行：📥 で入れて書けていない（_genbaUnsaved）→ 伏せずにそのまま（写真 G・名前が残る）。知らせで件数と管理番号を言う
     ② .hyb の行：何も残っていない → 今までどおり伏せる（名前 ★★★★★・写真なし）
     ③ .enc の行：📥 で入れて書けていない → 伏せずにそのまま
     ④ .hyb の行：受付台帳で直した（_lgEdited）・画面で写真を消した（_photosGone）・📥 の欄（_rowNewer）・
        エディタで直して戻った（_photosKnown＝画面で足した写真は行にだけある）・「💾 物件に保存」で写真を入れられなかった（_hybPhLeft）→ 伏せずにそのまま
     ⑤ 伏せずに残した行が無いときは、知らせを出さない（今までどおり）
   使い方: node smoke_v181_pwforget_main.js [index.html の file:// URL]　（ONLY=① で場面を絞れる） */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), url = require('url');
const EXE = process.env.CHROME || (function(){
  for(const d of (function(){ try{ return fs.readdirSync('/opt/pw-browsers'); }catch(_){ return []; } })()){
    const c = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
    if(fs.existsSync(c)) return c;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
})();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const asUrl = s => /^(file|https?):/i.test(s) ? s : url.pathToFileURL(path.resolve(s)).href;
const HTML = asUrl(process.argv[2] || path.join(ROOT, 'antenna_main', 'index.html'));
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
const ONLY = String(process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const want = label => !ONLY.length || ONLY.some(x => String(label).indexOf(x) === 0);
const J = o => JSON.stringify(o);

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.goto(HTML); await page.waitForTimeout(1800);

  /* 行を作って「🗝 パスワードを忘れる」を押し、行の中身と知らせを返す */
  const run = async (rowsSpec) => page.evaluate(async (rowsSpec) => {
    const said = [];
    window.alert = m => { said.push(String(m)); };
    window.confirm = () => true;
    renderListTable = () => {};          // 作り物の行なので、表は描かない
    const hyb = (no, extra) => Object.assign({
      fileType: 'hybrid', unlocked: true, _name: no + '.hyb', file: no + '.hyb',
      envelope: { plain: { chosho_mgmt_no: no, work_type: 'detached' },
                  encrypted_fields: { chosho_cust_name: 'x', chosho_cust_tel: 'x', chosho_photos: 'x' },
                  meta: { sensitive_fields: ['chosho_cust_name', 'chosho_cust_tel', 'chosho_photos'] } },
      data: { chosho_mgmt_no: no, work_type: 'detached', chosho_cust_name: '山田', chosho_cust_tel: '011',
              chosho_photos: [{ id: 'A', data: 'data:image/jpeg;base64,AA==' }, { id: 'G', data: 'data:image/jpeg;base64,AQ==' }] }
    }, extra || {});
    const enc = (no, extra) => Object.assign({
      fileType: 'full', unlocked: true, _name: no + '.enc', file: no + '.enc',
      envelope: { meta: { created_at: '2026-10-01T00:00:00Z' } },
      data: { chosho_mgmt_no: no, chosho_cust_name: '佐藤', chosho_photos: [{ id: 'G', data: 'data:image/jpeg;base64,AQ==' }] }
    }, extra || {});
    _editingRow = null;
    _listRows = rowsSpec.map(s => (s.t === 'enc' ? enc : hyb)(s.no, s.flags));
    _sessionPassword = 'pw-for-test-1234';
    document.getElementById('btn-list-clear-pw').onclick();
    const out = { said, pw: _sessionPassword, rows: {} };
    for(const r of _listRows){
      out.rows[r.envelope && r.envelope.plain ? r.envelope.plain.chosho_mgmt_no : r._name] = {
        unlocked: r.unlocked, name: r.data.chosho_cust_name,
        ph: Array.isArray(r.data.chosho_photos) ? r.data.chosho_photos.map(p => p.id).join(',') : null };
    }
    _listRows = [];
    return out;
  }, rowsSpec);

  if(want('①') || want('②') || want('③')){
    const r = await run([
      { no: 'H001', flags: { _genbaUnsaved: true } },
      { no: 'H002' },
      { no: 'E003', t: 'enc', flags: { _genbaUnsaved: true } },
    ]);
    console.log('①②③', J(r).slice(0, 900));
    ok(r.pw === null, '★パスワードが消えていない → ' + J(r.pw));
    const h1 = r.rows.H001 || {}, h2 = r.rows.H002 || {}, e3 = r.rows['E003.enc'] || {};
    ok(h1.ph === 'A,G' && h1.name === '山田' && h1.unlocked === true, '★①📥 の写真がまだ .hyb に入っていない行を伏せて、写真 G が一覧から消えた → ' + J(h1));
    ok(h2.ph === null && h2.name === '★★★★★' && h2.unlocked === false, '★②何も残っていない .hyb の行を、今までどおり伏せていない → ' + J(h2));
    ok(e3.ph === 'G' && e3.name === '佐藤' && e3.unlocked === true, '★③📥 の写真がまだ .enc に入っていない行を伏せて、写真が一覧から消えた → ' + J(e3));
    const msg = r.said.join('\n');
    ok(/伏せずにそのままにしました/.test(msg) && /2 件/.test(msg) && /H001/.test(msg) && /E003/.test(msg) && /📁 フォルダから読んだ戸別なら、開いて「💾 上書き保存」/.test(msg),
       '★①③伏せずに残した件数・管理番号・どうすれば入るかを知らせない → ' + msg);
    ok(!/H002/.test(msg), '★②伏せた行まで「そのまま」と言った → ' + msg);
  }

  if(want('④')){
    const r = await run([
      { no: 'H011', flags: { _lgEdited: true } },
      { no: 'H012', flags: { _photosGone: new Set() } },
      { no: 'H013', flags: { _rowNewer: ['chosho_cust_tel'] } },
      { no: 'H014', flags: { _photosKnown: true } },
      { no: 'H015', flags: { _hybPhLeft: true } },
    ]);
    console.log('④', J(r).slice(0, 600));
    ok(['H011', 'H012', 'H013', 'H014', 'H015'].every(k => r.rows[k] && r.rows[k].unlocked === true && r.rows[k].ph === 'A,G'),
       '★④台帳で直した・画面で写真を消した・📥 の欄がある・エディタで写真を足して戻った・写真を入れられなかった .hyb の行を伏せて、行の中身が消えた → ' + J(r.rows));
  }

  if(want('⑤')){
    const r = await run([{ no: 'H021' }, { no: 'H022' }]);
    console.log('⑤', J(r).slice(0, 400));
    ok(r.said.length === 0, '★⑤伏せずに残した行が無いのに知らせを出した → ' + J(r.said));
    ok(r.rows.H021 && r.rows.H021.unlocked === false && r.rows.H022 && r.rows.H022.unlocked === false, '★⑤ほどいた行を伏せていない → ' + J(r.rows));
  }

  ok(errs.length === 0, '★画面でエラー → ' + errs.slice(0, 3).join(' / '));
  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版181（メイン・🗝 パスワードを忘れる で写真を消さない）');
})().catch(e => { console.log('FAIL（止まった）', e && e.stack || e); process.exit(1); });
