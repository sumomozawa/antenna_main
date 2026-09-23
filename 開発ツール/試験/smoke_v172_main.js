/* 版172（メイン）：「🧩 重複をまとめる」は、消す前にほかのファイルにしか無い写真を残す方へ足す。
   現場入力の版172は、保存のときに物件のすぐ下の古い写しを読まない（利用者の決め 2026-09-23）。
   そこにしか無い写真は、この 🧩 でリストへまとめる。消す前に和集合にして、読み返して確かめてから消すこと。
   A 物件のすぐ下（d1,b1）とリスト（d1,d2,d3）→ リストを残す。b1 が残す方に入る
   B 物件のすぐ下（d1,b1,b2）とリスト（d1,dNEW）→ すぐ下を残す。dNEW が残す方に入る
   C 同じフォルダの X.json（d1,u1）と X_長い数字.json（d1,d2,d3）→ 名前を付け直すとき、u1 が消えない
   使い方: node smoke_v172_main.js [file:///…/antenna_main/index.html]
   組の中身（写真入りの戸別ファイル）は smoke_v172_main.data.json */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = (function(){ for(const d of fs.readdirSync('/opt/pw-browsers')){ const c='/opt/pw-browsers/'+d+'/chrome-linux/chrome'; if(fs.existsSync(c)) return c; } })();
const FILES = JSON.parse(fs.readFileSync(path.join(__dirname, 'smoke_v172_main.data.json'), 'utf8'));
const HTML = process.argv[2] || ('file://' + path.join(path.resolve(__dirname, '..', '..', '..'), 'antenna_main', 'index.html'));
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); };
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args:['--no-sandbox'] });
  const page = await (await b.newContext({ viewport:{ width:1280, height:860 } })).newPage();
  const errs = [], dialogs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('dialog', d => { dialogs.push(d.message().slice(0, 400)); d.accept().catch(()=>{}); });
  await page.goto(HTML); await page.waitForTimeout(3000);
  const out = {};
  for(const sc of ['A', 'B', 'C']){
    dialogs.length = 0;
    const no = 'W9E1' + sc;
    const fx = sc === 'C' ? null : FILES[sc];
    const r = await page.evaluate(async ({ sc, no, rootTxt, listTxt }) => {
      const mk = (name, files, subs) => {
        const d = { kind:'directory', name, __files: files || {}, __subs: subs || {}, __removed: [], __mt: {} };
        const fh = n => ({ kind:'file', name:n,
          getFile: async () => { const t = d.__files[n]; return { name:n, size: new Blob([t]).size, lastModified: d.__mt[n] || Date.parse('2026-09-23T01:00:00Z'), text: async () => t }; },
          createWritable: async () => ({ write: async t => { d.__files[n] = (typeof t === 'string') ? t : await t.text(); d.__mt[n] = Date.now(); }, close: async () => {} }) });
        Object.assign(d, {
          queryPermission: async () => 'granted', requestPermission: async () => 'granted',
          isSameEntry: async o => o === d,
          getFileHandle: async (n, opt) => { if(!(n in d.__files)){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__files[n] = ''; } return fh(n); },
          getDirectoryHandle: async (n, opt) => { if(!d.__subs[n]){ if(!(opt && opt.create)){ const e = new Error('NotFound'); e.name = 'NotFoundError'; throw e; } d.__subs[n] = mk(n); } return d.__subs[n]; },
          removeEntry: async n => { d.__removed.push(n); delete d.__files[n]; },
          entries: () => ({ [Symbol.asyncIterator](){
            const rows = Object.keys(d.__files).map(n => [n, fh(n)]).concat(Object.keys(d.__subs).map(n => [n, d.__subs[n]]));
            let i = 0; return { next: async () => (i < rows.length) ? { value: rows[i++], done:false } : { value: undefined, done: true } };
          } })
        });
        return d;
      };
      const pids = t => { try{ return (JSON.parse(t).chosho_photos || []).filter(p => p && p.dataUri).map(p => p.id).sort().join(','); }catch(_){ return '(無し)'; } };
      const png = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 6; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 8, 6); return cv.toDataURL('image/png'); };
      const ph = (id, c) => ({ id, label:id, dataUri: png(c) });
      let list, root;
      if(sc === 'C'){
        const a = JSON.stringify({ chosho_mgmt_no:no, work_type:'catv_to_uhf', chosho_cust_name:'古い名前',
          chosho_photos:[ ph('d1', '#c33'), ph('u1', '#963') ], editedAt:'2026-09-01T00:00:00.000Z' });
        const bb = JSON.stringify({ chosho_mgmt_no:no, work_type:'catv_to_uhf', chosho_cust_name:'新しい名前', chosho_cust_tel:'0176-00-0000',
          chosho_photos:[ ph('d1', '#c33'), ph('d2', '#3a6'), ph('d3', '#36c') ], editedAt:'2026-09-20T00:00:00.000Z' });
        list = mk('リスト', { [no + '.json']: a, [no + '_5017105541291380094.json']: bb });
        root = mk('物件', {}, { 'リスト': list });
      } else {
        rootTxt = rootTxt.split(rootTxt.match(/W9V10[AB]/)[0]).join(no);
        listTxt = listTxt.split(listTxt.match(/W9V10[AB]/)[0]).join(no);
        list = mk('リスト', { [no + '.json']: listTxt });
        root = mk('物件', { [no + '.json']: rootTxt }, { 'リスト': list });
        root.__mt[no + '.json'] = Date.parse('2026-09-21T00:00:00Z');
      }
      _listDirHandle = root;
      await listReloadFolder();
      const mine = () => (_listRows || []).filter(x => x && x.data && x.data.chosho_mgmt_no === no);
      const o = {};
      o.before_rows = mine().map(x => (x._dirPath || '（すぐ下）') + x._name + ' 写真' + x._photoCount + '枚');
      let shown = '';
      const t = setInterval(() => {
        const m = document.getElementById('dup-modal');
        if(m && m.classList.contains('open')){
          shown = (document.getElementById('dup-body').innerText || '').replace(/\s+/g, ' ');
          document.getElementById('dup-ok').click();
        }
      }, 50);
      try{ await dupCleanupButton(); } finally { clearInterval(t); }
      o.写真は減りません = /写真は減りません/.test(shown);
      o.list_after = Object.keys(list.__files).filter(n => n.indexOf(no) === 0).map(n => n + ':' + pids(list.__files[n]));
      o.root_after = (no + '.json') in root.__files ? pids(root.__files[no + '.json']) : '(消えた)';
      o.after_rows = mine().map(x => (x._dirPath || '（すぐ下）') + x._name + ' 写真' + x._photoCount + '枚');
      if(sc === 'C') o.C名前 = (JSON.parse(list.__files[no + '.json'] || '{}').chosho_cust_name) || '';
      return o;
    }, { sc, no, rootTxt: fx && fx.root, listTxt: fx && fx.list });
    r.alerts = dialogs.map(s => s.replace(/\s+/g, ' ').slice(0, 160));
    out[sc] = r;
  }
  console.log(JSON.stringify(out, null, 1));
  ok(out.A.list_after.join() === 'W9E1A.json:b1,d1,d2,d3' && out.A.root_after === '(消えた)',
     '★🧩 で物件のすぐ下の写しを消すとき、そこにしか無い写真（b1）を残す方へ足していない → ' + JSON.stringify([out.A.list_after, out.A.root_after]));
  ok(out.B.root_after === 'b1,b2,d1,dNEW' && out.B.list_after.length === 0,
     '★🧩 でリストの写しを消すとき、そこにしか無い写真（dNEW）を残す方へ足していない → ' + JSON.stringify([out.B.list_after, out.B.root_after]));
  ok(out.C.list_after.join() === 'W9E1C.json:d1,d2,d3,u1' && out.C.C名前 === '新しい名前',
     '★🧩 で名前を付け直すとき、上書きした「管理番号.json」にしか無い写真（u1）が消えた → ' + JSON.stringify(out.C));
  ok(out.A.写真は減りません === true, '★🧩 の窓に「ほかのファイルにしか無い写真は足す」と出ていない');
  ok(errs.length === 0, '画面のエラー: ' + errs.join(' / '));
  await b.close();
  if(fails.length){ console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PASS 版172 第9回（メイン 🧩 の写真）');
})();
