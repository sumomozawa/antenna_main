/* 版158: 同じ管理番号のファイルが何個あっても、カレンダー・今後の予定は1件にまとめて「×N」で知らせる。
   🧹 重複の整理 が作る控えフォルダ「_整理前の控え」を、📁 の読み込みが戸別として拾わない。 */
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

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{width:1400,height:900} })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text();
    if(m.type()==='error' && !/Failed to load resource/.test(t)) errs.push('console: ' + t); });
  page.on('dialog', d => d.accept().catch(()=>{}));
  await page.goto(MAIN); await page.waitForTimeout(6000);

  // ---- ① 📁 の読み込みは「_整理前の控え」を戸別として拾わない ----
  const r1 = await page.evaluate(async () => {
    const mkFile = (name, text) => ({ kind:'file', name,
      getFile: async () => ({ name, size: text.length, lastModified: Date.now(), text: async () => text }) });
    const mkDir = (name, entries) => ({ kind:'directory', name,
      entries: async function*(){ for(const e of entries) yield [e.name, e]; },
      values: async function*(){ for(const e of entries) yield e; } });
    const j = n => JSON.stringify({ chosho_mgmt_no: n, chosho_cust_name:'千葉', chosho_date:'2026-09-12', work_type:'new' });
    const root = mkDir('リスト', [
      mkFile('2611SIK075.json', j('2611SIK075')),
      mkDir(DUP_BACKUP_DIR, [ mkFile('2611SIK075.json', j('2611SIK075')), mkFile('2611SIK075-2.json', j('2611SIK075')) ]),
      mkDir(DUP_BACKUP_DIR + ' (1)', [ mkFile('2611SIK075.json', j('2611SIK075')) ]),   // 同期ソフトが名前を足した控えも読まない
      mkDir('2026年', [ mkFile('2611SIK076.json', j('2611SIK076')) ]),     // ふつうのサブフォルダは今までどおり読む
      mkDir('.dropbox.cache', [ mkFile('2611SIK075.json', j('2611SIK075')) ]) ]);
    const rows = [], stats = { files:0, dirs:0 };
    scanProgressStart('試験');
    await scanDirRecursive(root, '', rows, stats);
    const st = document.getElementById('list-status'); const keep = st ? st.textContent : '';
    _missLastNote = ''; missShowNote();
    const note = st ? st.textContent : '';
    const again = _bakSkipped;                       // 一度出したら消える
    if(st) st.textContent = keep;
    return { rows: rows.map(r => (r._dirPath || '') + r._name).sort(), skip: (stats.skipDirs || []).sort(),
             fn: scanSkipDirName(DUP_BACKUP_DIR), name: DUP_BACKUP_DIR, note, again };
  });
  console.log('①控えフォルダ', JSON.stringify(r1));
  ok(r1.fn === true, '★scanSkipDirName が「' + r1.name + '」を飛ばさない');
  ok(r1.rows.join(',') === '2026年/2611SIK076.json,2611SIK075.json',
     '★読み込んだ行が違う（控えを拾っている／ふつうのサブフォルダを読んでいない） → ' + JSON.stringify(r1.rows));
  ok(r1.skip.indexOf(r1.name + '/') >= 0, '飛ばしたフォルダに控えが入っていない → ' + JSON.stringify(r1.skip));
  ok(r1.skip.indexOf(r1.name + ' (1)/') >= 0, '★名前の後ろに何か付いた控えフォルダ（同期ソフトの競合コピー）を読んでいる → ' + JSON.stringify(r1.skip));
  ok(/読み込んでいません/.test(r1.note) && new RegExp(r1.name).test(r1.note) && !/お待ちください/.test(r1.note),
     '★控えを飛ばしたことが、読み込み後の知らせに出ない（または「お待ちください」が残る） → ' + JSON.stringify(r1.note));
  ok(r1.again === false, '一度出した知らせが次も残る → ' + r1.again);

  // ---- ② 同じ管理番号の行が5つあっても、カレンダーの予定は1件・×5 ----
  const r2 = await page.evaluate(() => {
    const mk = (no, editedAt, date, extra) => Object.assign({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: Object.assign({ chosho_mgmt_no: no, chosho_cust_name:'千葉りち子', chosho_date: date, chosho_status:'completed',
                            work_type:'new', editedAt }, extra || {}) });
    const rows = [
      mk('2611SIK075', '2026-09-01T09:00:00', '2026-09-12'),
      mk('2611SIK075', '2026-09-03T09:00:00', '2026-09-12'),
      mk('2611SIK075', '2026-09-05T09:00:00', '2026-09-13'),      // ← いちばん新しい（日付が違う）
      mk('2611SIK075', '2026-09-02T09:00:00', ''),
      mk('2611SIK075', '2026-09-04T09:00:00', '2026-09-12'),
      mk('2611SIK087', '2026-09-01T09:00:00', '2026-09-19', { chosho_status:'in_progress' }),
    ];
    const evs = calBuildEvents(rows).filter(e => e.type !== 'free');
    const a = evs.filter(e => e.tk === 'm:2611SIK075');
    const bb = evs.filter(e => e.tk === 'm:2611SIK087');
    const title = a.length ? calEvTitle(a[0]) : '';
    return { n: evs.length, a: a.map(e => ({ date:e.date, dupN:e.dupN, edited:(e.row.data||{}).editedAt })),
             b: bb.map(e => ({ date:e.date, dupN:e.dupN })), title };
  });
  console.log('②まとめる', JSON.stringify(r2));
  ok(r2.n === 2, '★同じ管理番号の予定が何件も出ている（' + r2.n + ' 件） → ' + JSON.stringify(r2));
  ok(r2.a.length === 1 && r2.a[0].dupN === 5 && r2.a[0].date === '2026-09-13' && /09-05/.test(r2.a[0].edited),
     '★いちばん新しい1件を代表にしていない／重なった数が違う → ' + JSON.stringify(r2.a));
  ok(r2.b.length === 1 && r2.b[0].dupN === 1, '重なっていない戸別に ×N が付く → ' + JSON.stringify(r2.b));
  ok(/同じ管理番号のファイルが 5 個/.test(r2.title) && /重複をまとめる/.test(r2.title),
     '★予定の説明に、重なっていることと直し方が無い → ' + JSON.stringify(r2.title));

  // ---- ③ 月のマスと「今後の予定」に ×N が出る（1行だけ） ----
  const r3 = await page.evaluate(() => {
    const today = lgDateStrToday(0);
    const mk = (no, editedAt) => ({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: { chosho_mgmt_no: no, chosho_cust_name:'千葉りち子', chosho_date: today, chosho_status:'in_progress', work_type:'new', editedAt } });
    const rows = [ mk('2611SIK075', '2026-09-01T09:00:00'), mk('2611SIK075', '2026-09-02T09:00:00'), mk('2611SIK075', '2026-09-03T09:00:00') ];
    const saveRows = _listRows; const saveY = _calY, saveM = _calM;
    _listRows = rows; _calY = null; _calM = null;
    const div = document.createElement('div'); document.body.appendChild(div);
    let up = '', cal = '';
    try{
      up = renderUpcomingSchedule(rows);
      renderListCalendarMode(rows, div);
      cal = div.innerHTML;
    } finally { _listRows = saveRows; _calY = saveY; _calM = saveM; div.remove(); }
    const rowsN = (up.match(/2611SIK075/g) || []).length;
    const dupUp = (up.match(/cu-dup/g) || []).length;
    const chips = (cal.match(/data-tk="m:2611SIK075"/g) || []).length;
    const dupChip = (cal.match(/cal-dup-n">×3</g) || []).length;
    return { rowsN, dupUp, chips, dupChip, upHasX3: /×3 重複/.test(up) };
  });
  console.log('③画面', JSON.stringify(r3));
  ok(r3.rowsN === 1, '★今後の予定に同じ戸別が ' + r3.rowsN + ' 行出ている');
  ok(r3.dupUp === 1 && r3.upHasX3, '★今後の予定に「×3 重複」が出ていない → ' + JSON.stringify(r3));
  ok(r3.chips === 1, '★月のマスに同じ戸別の予定が ' + r3.chips + ' 個出ている');
  ok(r3.dupChip === 1, '★月のマスの予定に ×3 が付いていない → ' + JSON.stringify(r3));

  // ---- ④ 予定を動かす相手も「いちばん新しい1件」 ----
  const r4 = await page.evaluate(() => {
    const mk = (no, editedAt) => ({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: { chosho_mgmt_no: no, chosho_cust_name:'千葉', chosho_date:'2026-09-12', work_type:'new', editedAt } });
    const rows = [ mk('2611SIK075', '2026-09-01T09:00:00'), mk('2611SIK075', '2026-09-09T09:00:00'), mk('2611SIK075', '2026-09-05T09:00:00') ];
    const saveRows = _listRows; _listRows = rows;
    let r; try{ r = calRowByTk('m:2611SIK075'); } finally { _listRows = saveRows; }
    return { edited: r && r.data.editedAt, none: calRowByTk('m:NOPE') };
  });
  console.log('④動かす相手', JSON.stringify(r4));
  ok(/09-09/.test(r4.edited || ''), '★動かす相手が、出している「いちばん新しい1件」でない → ' + JSON.stringify(r4));
  ok(r4.none === null, '無い管理番号で null が返らない → ' + JSON.stringify(r4));

  // ---- ⑤ Google カレンダー書き出し（.ics）も1件 ----
  const r5 = await page.evaluate(() => {
    const mk = (no, editedAt) => ({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: { chosho_mgmt_no: no, chosho_cust_name:'千葉', chosho_date:'2026-09-12', work_type:'new', editedAt } });
    const rows = [ mk('2611SIK075', '2026-09-01T09:00:00'), mk('2611SIK075', '2026-09-02T09:00:00') ];
    const ics = calBuildICS(rows);           // 戻り値は { text, count }
    return { n: (String(ics && ics.text || '').match(/BEGIN:VEVENT/g) || []).length, count: ics && ics.count };
  });
  console.log('⑤ics', JSON.stringify(r5));
  ok(r5.n === 1 && r5.count === 1, '★.ics に同じ戸別の予定が ' + r5.n + ' 件入っている → ' + JSON.stringify(r5));

  // ---- ⑥ いちばん新しいファイルに工事日が無くても、工事予定は消えない ----
  const r6 = await page.evaluate(() => {
    const mk = (no, editedAt, date, st) => ({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: { chosho_mgmt_no: no, chosho_cust_name:'千葉', chosho_date: date, chosho_status: st || 'in_progress', work_type:'new', editedAt } });
    const rows = [ mk('2611SIK075', '2026-09-01T09:00:00', '2026-10-05', 'completed'),
                   mk('2611SIK075', '2026-09-09T09:00:00', '', 'provisional') ];           // ← 新しい方は工事日が空・状態も違う
    const evs = calBuildEvents(rows).filter(e => e.type === 'work');
    const t = evs.length ? calEvTitle(evs[0]) : '';
    // 鍵が作れない行（管理番号も道のりも無い）は別々に出す
    const k = [ { file:'', fileType:'plain', data:{ chosho_cust_name:'甲', chosho_date:'2026-10-06', work_type:'new' } },
                { file:'', fileType:'plain', data:{ chosho_cust_name:'乙', chosho_date:'2026-10-07', work_type:'new' } } ];
    const kev = calBuildEvents(k).filter(e => e.type === 'work');
    // 全暗号化(未復号)は数えない
    const enc = [ mk('2611SIK077', '2026-09-01T09:00:00', '2026-10-08'),
                  Object.assign(mk('2611SIK077', '2026-09-02T09:00:00', '2026-10-09'), { fileType:'full', unlocked:false }) ];
    const eev = calBuildEvents(enc).filter(e => e.type === 'work');
    // 状態が空（古いファイル）と進行中は、どちらも「未完了」なので「違う」に数えない
    // ★mk は空の状態を「進行中」に置き換えるので、ここは状態の欄そのものが無い行を手で作る
    const mkS = (no, editedAt, date, st) => { const r = mk(no, editedAt, date, 'in_progress'); if(st) r.data.chosho_status = st; else delete r.data.chosho_status; return r; };
    const same = calBuildEvents([ mkS('2611SIK078', '2026-09-01T09:00:00', '2026-10-10', ''), mkS('2611SIK078', '2026-09-02T09:00:00', '2026-10-11', 'in_progress') ]).filter(e => e.type === 'work');
    const same2 = calBuildEvents([ mkS('2611SIK079', '2026-09-01T09:00:00', '2026-10-10', 'in_progress'), mkS('2611SIK079', '2026-09-02T09:00:00', '2026-10-11', '') ]).filter(e => e.type === 'work');   // 並びが逆でも
    // 工事と打合せは同じ行から出す（打合せは台帳の控え）
    const oldMeet = getLedger('m:2611SIK075').meetAt;
    setLedger('m:2611SIK075', { meetAt: '2026-10-03T13:00' });
    const both = calBuildEvents(rows).filter(e => e.tk === 'm:2611SIK075');
    setLedger('m:2611SIK075', { meetAt: oldMeet || '' });
    const w = both.find(e => e.type === 'work'), m = both.find(e => e.type === 'meet');
    return { n: evs.length, date: evs[0] && evs[0].date, flag: evs[0] && evs[0].newestNoDate, mixed: evs[0] && evs[0].mixed, dupN: evs[0] && evs[0].dupN,
             title: t, kN: kev.length, kDates: kev.map(e => e.date).sort(), eN: eev.length, eDate: eev[0] && eev[0].date, eDup: eev[0] && eev[0].dupN,
             sameMixed: same[0] && same[0].mixed, sameMixed2: same2[0] && same2[0].mixed, bothN: both.length, sameRow: !!(w && m && w.row === m.row), meetProv: m && m.prov };
  });
  console.log('⑥新しい方に工事日が無い', JSON.stringify(r6));
  ok(r6.n === 1 && r6.date === '2026-10-05', '★いちばん新しいファイルに工事日が無いと、その戸別の工事予定が消える → ' + JSON.stringify(r6));
  ok(r6.flag === true && /工事日が入っていない/.test(r6.title), '★工事日の入っている方を出していることを説明に書いていない → ' + JSON.stringify(r6.title));
  ok(r6.mixed === true && /状態/.test(r6.title), '★ファイルごとに状態が違うことを説明に書いていない → ' + JSON.stringify(r6.title));
  ok(/🧩 重複をまとめる/.test(r6.title) && !/🧹/.test(r6.title), '★説明が無いボタン（🧹）を案内している → ' + JSON.stringify(r6.title));
  ok(r6.kN === 2 && r6.kDates.join(',') === '2026-10-06,2026-10-07', '★管理番号も道のりも無い別々の行が1件に潰れる → ' + JSON.stringify(r6));
  ok(r6.eN === 1 && r6.eDate === '2026-10-08' && r6.eDup === 1, '★全暗号化(未復号)の行を予定や重なった数に入れている → ' + JSON.stringify(r6));
  ok(r6.sameMixed === false && r6.sameMixed2 === false, '★状態が空の古いファイルを「状態が違う」と言っている → ' + JSON.stringify([r6.sameMixed, r6.sameMixed2]));
  ok(r6.bothN === 2 && r6.sameRow === true && r6.meetProv === false,
     '★同じ戸別の工事と打合せが別のファイルの中身（名前・住所・仮・完了）で出る → ' + JSON.stringify({ bothN:r6.bothN, sameRow:r6.sameRow, meetProv:r6.meetProv }));

  // ---- ⑦ 絞り込み中でも、出している予定と書く相手が同じ／重なった数は全体で数える ----
  const r7 = await page.evaluate(() => {
    const mk = (no, editedAt, date) => ({ file: no + '_' + editedAt + '.json', fileType:'plain',
      data: { chosho_mgmt_no: no, chosho_cust_name:'千葉', chosho_date: date, work_type:'new', editedAt } });
    const all = [ mk('2611SIK075', '2026-09-01T09:00:00', '2026-10-01'), mk('2611SIK075', '2026-09-09T09:00:00', '2026-10-02'), mk('2611SIK075', '2026-09-05T09:00:00', '2026-10-03') ];
    const saveRows = _listRows; _listRows = all;
    let out;
    try{
      const evs = calBuildEvents([all[0]]).filter(e => e.type === 'work');   // 🔍 で古い1行だけが残った状態
      const target = calRowByTk('m:2611SIK075');
      calBuildICS(all);                                                       // 📅 .ics 書き出しは全行で予定を作り直す
      const after = calRowByTk('m:2611SIK075');
      out = { n: evs.length, shown: evs[0] && evs[0].row.data.editedAt, dupN: evs[0] && evs[0].dupN, target: target && target.data.editedAt,
              afterIcs: after && after.data.editedAt };
    } finally { _listRows = saveRows; }
    return out;
  });
  console.log('⑦絞り込み中', JSON.stringify(r7));
  ok(r7.n === 1 && r7.shown === r7.target, '★絞り込み中に、出している予定と違うファイルの日付を動かす → ' + JSON.stringify(r7));
  ok(r7.dupN === 3, '★絞り込みで行が減ると、重なった数（×N）が消える → ' + JSON.stringify(r7));
  ok(r7.afterIcs === r7.shown, '★.ics を書き出したあと、予定を動かす相手が別の行に変わる → ' + JSON.stringify(r7));

  // ---- ⑧ 紙（今後の予定の印刷）には「×N 重複」を出さない ----
  await page.emulateMedia({ media: 'print' });          // 印刷用の見た目（@media print）で確かめる
  const r8 = await page.evaluate(() => {
    const sp = document.createElement('span'); sp.className = 'cu-dup'; sp.textContent = '×2 重複';
    const wrap = document.createElement('div'); wrap.className = 'cal-upcoming'; wrap.appendChild(sp); document.body.appendChild(wrap);
    const chip = document.createElement('span'); chip.className = 'cal-ev cal-work';
    const bn = document.createElement('b'); bn.className = 'cal-dup-n'; bn.textContent = '×2'; chip.appendChild(bn); document.body.appendChild(chip);
    document.body.classList.add('list-print-mode');
    const shown = getComputedStyle(sp).display, shownChip = getComputedStyle(bn).display;
    document.body.classList.remove('list-print-mode'); wrap.remove(); chip.remove();
    return { shown, shownChip };
  });
  await page.emulateMedia({ media: 'screen' });
  console.log('⑧印刷', JSON.stringify(r8));
  ok(r8.shown === 'none', '★元請・お客様へ渡す紙に「×N 重複」が出る → ' + JSON.stringify(r8));
  ok(r8.shownChip === 'none', '★月のマスの印刷に赤い ×N が出る → ' + JSON.stringify(r8));

  // ---- ⑨ 版 ----
  const ver = await page.evaluate(() => APP_VERSION);
  ok(ver === '158', '★版番号が158でない → ' + ver);

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v158_main');
})();
