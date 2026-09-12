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
      mkDir('2026年', [ mkFile('2611SIK076.json', j('2611SIK076')) ]),     // ふつうのサブフォルダは今までどおり読む
      mkDir('.dropbox.cache', [ mkFile('2611SIK075.json', j('2611SIK075')) ]) ]);
    const rows = [], stats = { files:0, dirs:0 };
    await scanDirRecursive(root, '', rows, stats);
    return { rows: rows.map(r => (r._dirPath || '') + r._name).sort(), skip: (stats.skipDirs || []).sort(),
             fn: scanSkipDirName(DUP_BACKUP_DIR), name: DUP_BACKUP_DIR };
  });
  console.log('①控えフォルダ', JSON.stringify(r1));
  ok(r1.fn === true, '★scanSkipDirName が「' + r1.name + '」を飛ばさない');
  ok(r1.rows.join(',') === '2026年/2611SIK076.json,2611SIK075.json',
     '★読み込んだ行が違う（控えを拾っている／ふつうのサブフォルダを読んでいない） → ' + JSON.stringify(r1.rows));
  ok(r1.skip.indexOf(r1.name + '/') >= 0, '飛ばしたフォルダに控えが入っていない → ' + JSON.stringify(r1.skip));

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
  ok(/同じ管理番号のファイルが 5 個/.test(r2.title) && /重複の整理/.test(r2.title),
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

  // ---- ⑥ 版 ----
  const ver = await page.evaluate(() => APP_VERSION);
  ok(ver === '158', '★版番号が158でない → ' + ver);

  await b.close();
  ok(errs.length === 0, '★画面のエラー: ' + errs.slice(0,4).join(' / '));
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS smoke_v158_main');
})();
