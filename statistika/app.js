/* Portál 4ST102 Úvod do statistiky. Obsah je v content/*.html, tady je jen navigace a interaktivní prvky. */
const SECTIONS = [
  { file: 'promenne', title: 'Poznávání proměnných', sub: 'Typy proměnných a dat na všech listech úvodního Excelu', group: 'Základ' },
  { file: 'sber', title: 'Odkud se data berou', sub: 'Zdroje dat, výběr respondentů a chyby šetření', group: 'Základ' },
  { file: 'cv1', title: 'Cvičení 1: Excel a grafy', sub: 'Základní práce s daty a volba grafu', group: 'Cvičení' },
  { file: 'cv2', title: 'Cvičení 2: Četnosti a poloha', sub: 'Tabulky četností, kvartily a vážený průměr', group: 'Cvičení' },
  { file: 'cv3', title: 'Cvičení 3: Průměry a variabilita', sub: 'Harmonický a geometrický průměr, rozptyl, rozklad rozptylu', group: 'Cvičení' },
  { file: 'cv4', title: 'Cvičení 4: Závislost', sub: 'Korelace, kontingenční koeficienty a regrese', group: 'Cvičení' }
];
const TOOLS = [
  { hash: '#/trener', title: 'Trenažér', sub: 'Typové příklady: zadání, data, nápověda a řešení' },
  { hash: '#/test', title: 'Test nanečisto', sub: 'Otázky s časomírou, vyhodnocením a vysvětlením' },
  { hash: '#/pruvodce', title: 'Rozhodovací průvodce', sub: 'Jaký graf, průměr nebo míru závislosti zvolit' },
  { hash: '#/s/tahak', title: 'Tahák se vzorci', sub: 'Vzorec, použití a funkce v Excelu na jednom místě' },
  { hash: '#/s/vycuc', title: 'Finální výcuc', sub: 'Co umět, na co si dát pozor a proč' }
];
const TOPICS = { typy: 'Proměnné a grafy', cetnosti: 'Četnosti', prumery: 'Průměry', variabilita: 'Variabilita', zavislost: 'Závislost', sber: 'Sběr dat' };
const store = {
  get(k, d) { try { const v = localStorage.getItem('st_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('st_' + k, JSON.stringify(v)); } catch (e) {} }
};
const view = document.getElementById('view');
const cache = {};
async function load(file) {
  if (cache[file]) return cache[file];
  const r = await fetch('content/' + file + '.html');
  if (!r.ok) throw new Error(file);
  const doc = document.createElement('template');
  doc.innerHTML = await r.text();
  return cache[file] = doc.content;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function setTitle(t) { document.getElementById('bar-title').textContent = t; document.title = t === 'Statistika' ? 'Statistika · portál' : t + ' · Statistika'; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function math(el) {
  if (!window.renderMathInElement) return;
  renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
  // dlouhé vzorce v textu by na telefonu přetekly, dostanou vlastní posuvný řádek
  el.querySelectorAll('.katex').forEach(k => {
    const tex = k.querySelector('annotation');
    if (tex && tex.textContent.length > 34 && !k.closest('.katex-display, table')) k.classList.add('wide');
  });
}

/* ---------- grafy ---------- */
const W = 340;
function nf(v) { return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('cs-CZ') : String(+(+v).toFixed(2)).replace('.', ','); }
function barChart(labels, vals, gap, hl) {
  const H = 170, L = 8, B = 28, T = 18, max = Math.max(...vals), bw = (W - 2 * L) / vals.length;
  let s = '';
  vals.forEach((v, i) => {
    const h = (H - B - T) * v / max, x = L + i * bw + gap / 2, y = H - B - h;
    s += `<rect class="${hl === i ? 'hl' : 'mk'}" x="${x}" y="${y}" width="${Math.max(bw - gap, 1)}" height="${h}" rx="${gap ? 3 : 0}"><title>${esc(labels[i])}: ${nf(v)}</title></rect>`;
    if (gap || vals.length <= 8) s += `<text class="tx" x="${x + (bw - gap) / 2}" y="${y - 4}" text-anchor="middle">${nf(v)}</text>`;
    s += `<text class="tx" x="${L + i * bw + bw / 2}" y="${H - 12}" text-anchor="middle">${esc(labels[i])}</text>`;
  });
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img"><line class="ax" x1="${L}" x2="${W - L}" y1="${H - B}" y2="${H - B}"/>${s}</svg>`;
}
function scale(a, b, c, d) { return v => c + (v - a) * (d - c) / (b - a || 1); }
function lineChart(xs, ys, y0) {
  const H = 180, L = 34, B = 26, T = 12, R = 10;
  const mn = y0 !== undefined ? y0 : Math.min(...ys), mx = Math.max(...ys);
  const X = scale(Math.min(...xs), Math.max(...xs), L, W - R), Y = scale(mn, mx, H - B, T);
  const pts = xs.map((x, i) => X(x) + ',' + Y(ys[i])).join(' ');
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img"><line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><text class="tx" x="${L - 4}" y="${H - B}" text-anchor="end">${nf(mn)}</text><text class="tx" x="${L - 4}" y="${T + 8}" text-anchor="end">${nf(mx)}</text><polyline class="ln" points="${pts}"/>${xs.map((x, i) => `<circle class="mk" cx="${X(x)}" cy="${Y(ys[i])}" r="4"><title>${x}: ${nf(ys[i])}</title></circle>`).join('')}<text class="tx" x="${L}" y="${H - 8}">${xs[0]}</text><text class="tx" x="${W - R}" y="${H - 8}" text-anchor="end">${xs[xs.length - 1]}</text></svg>`;
}
function scatter(pts, opt) {
  opt = opt || {};
  const H = opt.h || 210, L = 34, B = 26, T = 10, R = 10, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = scale(x0, x1, L + 4, W - R - 4), Y = scale(y0, y1, H - B - 4, T + 4);
  let s = pts.map(p => `<circle class="mk" cx="${X(p[0])}" cy="${Y(p[1])}" r="${opt.r || 3}" opacity=".8"><title>${nf(p[0])}; ${nf(p[1])}</title></circle>`).join('');
  if (opt.line) s += `<line class="ot" x1="${X(x0)}" y1="${Y(opt.line[0] + opt.line[1] * x0)}" x2="${X(x1)}" y2="${Y(opt.line[0] + opt.line[1] * x1)}"/>`;
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img"><line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/><text class="tx" x="${L}" y="${H - 8}">${nf(x0)}</text><text class="tx" x="${W - R}" y="${H - 8}" text-anchor="end">${nf(x1)}</text><text class="tx" x="${L - 4}" y="${H - B}" text-anchor="end">${nf(y0)}</text><text class="tx" x="${L - 4}" y="${T + 8}" text-anchor="end">${nf(y1)}</text>${s}</svg>`;
}
function boxChart(a) { // [min, dolní vous, Q1, medián, Q3, horní vous, max]
  const [mn, wl, q1, md, q3, wh, mx] = a, H = 96, X = scale(mn, mx, 18, W - 18), y = 38, h = 30, m = y + h / 2;
  const lb = (v, t, yy) => `<text class="tx" x="${X(v)}" y="${yy}" text-anchor="middle">${t}</text>`;
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img"><line class="ot" x1="${X(wl)}" x2="${X(q1)}" y1="${m}" y2="${m}"/><line class="ot" x1="${X(q3)}" x2="${X(wh)}" y1="${m}" y2="${m}"/><line class="ot" x1="${X(wl)}" x2="${X(wl)}" y1="${y + 6}" y2="${y + h - 6}"/><line class="ot" x1="${X(wh)}" x2="${X(wh)}" y1="${y + 6}" y2="${y + h - 6}"/><rect x="${X(q1)}" y="${y}" width="${X(q3) - X(q1)}" height="${h}" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><line x1="${X(md)}" x2="${X(md)}" y1="${y}" y2="${y + h}" stroke="var(--accent)" stroke-width="3"/>${mn < wl ? `<circle class="hl" cx="${X(mn)}" cy="${m}" r="4"/>` + `<text class="tx" x="${X(mn) - 4}" y="26">odlehlá ${nf(mn)}</text>` : ''}${lb(q1, 'Q₁ ' + nf(q1), 88)}${lb(md, 'medián ' + nf(md), 26)}${lb(q3, 'Q₃ ' + nf(q3), 88)}${lb(wh, nf(wh), 26)}</svg>`;
}
function charts(root) {
  root.querySelectorAll('[data-chart]').forEach(el => {
    const d = JSON.parse(el.dataset.d), k = el.dataset.chart;
    if (k === 'bar') el.innerHTML = barChart(d.l, d.v, 10, d.hl);
    if (k === 'hist') el.innerHTML = barChart(d.l, d.v, 0, d.hl);
    if (k === 'line') el.innerHTML = lineChart(d.x, d.y, d.y0);
    if (k === 'scatter') el.innerHTML = scatter(d.p, d);
    if (k === 'box') el.innerHTML = boxChart(d);
  });
  root.querySelectorAll('[data-saurus]').forEach(async el => {
    const data = await (await fetch('data/datasets.json')).json();
    el.innerHTML = `<div class="chips">${Object.keys(data).map(k => `<button class="chip" data-k="${k}">${k}</button>`).join('')}</div><div class="plot"></div>`;
    const show = k => {
      el.querySelector('.plot').innerHTML = scatter(data[k], { r: 2.5, h: 240 });
      el.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.k === k));
    };
    el.addEventListener('click', e => { if (e.target.dataset.k) show(e.target.dataset.k); });
    show('4');
  });
}

/* ---------- poznej proměnnou ---------- */
const VAR = { nominal: 'Nominální', ordinal: 'Ordinální', diskretni: 'Diskrétní', spojita: 'Spojitá' };
function varGuess(root) {
  root.querySelectorAll('.vg').forEach(el => {
    const a = el.dataset.a, why = el.querySelector('.why');
    const opts = document.createElement('div');
    opts.className = 'opts';
    opts.innerHTML = Object.keys(VAR).map(k => `<button data-k="${k}">${VAR[k]}</button>`).join('');
    el.insertBefore(opts, why);
    opts.addEventListener('click', e => {
      const k = e.target.dataset.k;
      if (!k || el.classList.contains('ans')) return;
      el.classList.add('ans');
      opts.querySelector(`[data-k="${a}"]`).classList.add('right');
      if (k !== a) e.target.classList.add('wrong');
    });
  });
}

/* ---------- stránky ---------- */
function home() {
  setTitle('Statistika');
  let h = `<div class="crumb"><a href="../">← Všechny předměty</a></div><h1>4ST102 Úvod do statistiky</h1><p class="sub">Teorie a postupy ze cvičení, vysvětlené a připravené na čtení v telefonu.</p>`;
  const last = store.get('last', null);
  if (last) h += `<a class="card hi" href="${esc(last.hash)}"><b>Pokračovat</b><span>${esc(last.title)}</span></a>`;
  ['Základ', 'Cvičení'].forEach(g => {
    h += `<div class="group-title">${g}</div><div class="grid">` + SECTIONS.filter(s => s.group === g).map(s => `<a class="card" href="#/s/${s.file}"><b>${s.title}</b><span>${s.sub}</span></a>`).join('') + '</div>';
  });
  h += `<div class="group-title">Procvičení a opakování</div><div class="grid">` + TOOLS.map(t => `<a class="card" href="${t.hash}"><b>${t.title}</b><span>${t.sub}</span></a>`).join('') + '</div>';
  h += `<p class="src" style="margin-top:28px">Vlastní studijní pomůcka, ne oficiální materiál předmětu. Vychází ze cvičení, úvodní prezentace a studijních textů J. Horníčka (<a href="https://horj31.github.io/stats-courses/4st102/">CC BY-SA 4.0</a>).</p>`;
  view.innerHTML = h;
}
async function sectionList(file) {
  const c = await load(file), meta = SECTIONS.find(s => s.file === file) || { title: (TOOLS.find(t => t.hash === '#/s/' + file) || {}).title, sub: (TOOLS.find(t => t.hash === '#/s/' + file) || {}).sub };
  setTitle(meta.title);
  const ls = [...c.querySelectorAll('section[data-id]')], done = store.get('done', {});
  view.innerHTML = `<div class="crumb"><a href="#/">← Přehled</a></div><h1>${meta.title}</h1><p class="sub">${meta.sub}</p><div class="grid">` +
    ls.map(l => `<a class="card ${done[file + '/' + l.dataset.id] ? 'done' : ''}" href="#/l/${file}/${l.dataset.id}"><b>${l.dataset.title}</b><span>${l.dataset.sub || ''}</span></a>`).join('') + '</div>';
}
async function lesson(file, id) {
  const c = await load(file), ls = [...c.querySelectorAll('section[data-id]')], i = ls.findIndex(l => l.dataset.id === id);
  if (i < 0) return sectionList(file);
  const l = ls[i], key = file + '/' + id, meta = SECTIONS.find(s => s.file === file) || { title: (TOOLS.find(t => t.hash === '#/s/' + file) || {}).title };
  setTitle(l.dataset.title);
  store.set('last', { hash: location.hash, title: l.dataset.title });
  const p = ls[i - 1], n = ls[i + 1], done = store.get('done', {});
  view.innerHTML = `<div class="crumb"><a href="#/s/${file}">← ${meta.title}</a></div><h1>${l.dataset.title}</h1><p class="sub">${l.dataset.sub || ''}</p><div id="body">${l.innerHTML}</div>
    <button class="btn markbtn ${done[key] ? '' : 'primary'}" id="mark">${done[key] ? 'Prošlé ✓' : 'Označit jako prošlé'}</button>
    <div class="pager">${p ? `<a href="#/l/${file}/${p.dataset.id}"><small>← Předchozí</small>${p.dataset.title}</a>` : ''}${n ? `<a class="next" href="#/l/${file}/${n.dataset.id}"><small>Další →</small>${n.dataset.title}</a>` : ''}</div>`;
  const body = view.querySelector('#body');
  charts(body); varGuess(body); math(body);
  document.getElementById('mark').onclick = e => {
    const d = store.get('done', {}); d[key] = !d[key]; store.set('done', d);
    e.target.textContent = d[key] ? 'Prošlé ✓' : 'Označit jako prošlé'; e.target.classList.toggle('primary', !d[key]);
  };
}

/* ---------- trenažér ---------- */
let tr = { topic: 'vse', list: [], i: 0 };
async function trainer() {
  setTitle('Trenažér');
  const c = await load('trener'), all = [...c.querySelectorAll('article')];
  const pick = t => { tr.topic = t; tr.list = all.filter(a => t === 'vse' || a.dataset.topic === t); tr.i = 0; draw(); };
  function draw() {
    const a = tr.list[tr.i], known = store.get('known', {}), n = all.filter(x => known[x.dataset.id]).length;
    view.innerHTML = `<div class="crumb"><a href="#/">← Přehled</a></div><h1>Trenažér</h1><p class="sub">Nejdřív si to zkus promyslet, klidně s kalkulačkou. Teprve pak si rozklikni řešení. Umíš ${n} z ${all.length} příkladů.</p>
      <div class="chips"><button class="chip ${tr.topic === 'vse' ? 'on' : ''}" data-t="vse">Vše</button>${Object.keys(TOPICS).filter(t => all.some(x => x.dataset.topic === t)).map(t => `<button class="chip ${tr.topic === t ? 'on' : ''}" data-t="${t}">${TOPICS[t]}</button>`).join('')}</div>
      <div class="tc"><div class="count">${tr.i + 1} / ${tr.list.length} · ${TOPICS[a.dataset.topic]}${known[a.dataset.id] ? ' · umíš ✓' : ''}</div><h2 style="margin-top:6px">${a.dataset.title}</h2>${a.innerHTML}</div>
      <div class="row"><button class="btn" id="pv" ${tr.i ? '' : 'disabled'}>←</button><button class="btn" id="kn">${known[a.dataset.id] ? 'Ještě neumím' : 'Tohle umím'}</button><span class="grow"></span><button class="btn" id="rnd">Náhodně</button><button class="btn primary" id="nx" ${tr.i < tr.list.length - 1 ? '' : 'disabled'}>Další →</button></div>`;
    view.querySelectorAll('.chip').forEach(b => b.onclick = () => pick(b.dataset.t));
    const go = i => { tr.i = i; draw(); scrollTo(0, 0); };
    view.querySelector('#pv').onclick = () => go(tr.i - 1);
    view.querySelector('#nx').onclick = () => go(tr.i + 1);
    view.querySelector('#rnd').onclick = () => go(Math.floor(Math.random() * tr.list.length));
    view.querySelector('#kn').onclick = () => { const k = store.get('known', {}); k[a.dataset.id] = !k[a.dataset.id]; store.set('known', k); draw(); };
    charts(view); math(view);
  }
  pick(tr.topic);
}

/* ---------- test ---------- */
let testTimer = null;
async function testPage() {
  clearInterval(testTimer);
  setTitle('Test nanečisto');
  const c = await load('test'), all = [...c.querySelectorAll('.qq')], best = store.get('best', null);
  view.innerHTML = `<div class="crumb"><a href="#/">← Přehled</a></div><h1>Test nanečisto</h1><p class="sub">Náhodný výběr z ${all.length} otázek napříč cvičeními. Výpočty si dělej na papír s kalkulačkou, jako v testu. Skutečný test může vypadat jinak, tvar otázek je můj odhad.</p>
    ${best !== null ? `<p class="count">Nejlepší výsledek: ${best} %</p>` : ''}
    <div class="grid"><button class="btn primary" data-n="10" data-m="15">Rychlý test: 10 otázek, 15 minut</button><button class="btn" data-n="20" data-m="30">Plný test: 20 otázek, 30 minut</button></div>
    <p class="src">Hodnocení v předmětu: známka 3 od 60 %, známka 2 od 75 %, známka 1 od 90 %. Oba testy mají stejnou váhu a průběžný nejde opravit.</p>`;
  view.querySelectorAll('[data-n]').forEach(b => b.onclick = () => runTest(all, +b.dataset.n, +b.dataset.m));
}
function runTest(all, n, min) {
  const topics = shuffle(all); const qs = topics.slice(0, n), ans = {};
  let end = Date.now() + min * 60000;
  view.innerHTML = `<div class="row" style="position:sticky;top:calc(var(--bar-h) + env(safe-area-inset-top));background:var(--bg);padding:6px 0;margin-top:0;z-index:5"><span class="timer" id="tm"></span><span class="grow"></span><button class="btn primary" id="fin">Vyhodnotit</button></div>` +
    qs.map((q, i) => `<div class="qq" data-i="${i}"><h3>${i + 1}. otázka</h3>${q.querySelector('.st').innerHTML}${[...q.querySelectorAll('li')].map((o, j) => `<button class="qopt" data-j="${j}">${o.innerHTML}</button>`).join('')}<div class="box tip why" hidden>${q.querySelector('.ex').innerHTML}</div></div>`).join('');
  const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); document.getElementById('tm').textContent = '⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (!s) finish(); };
  view.addEventListener('click', pickOpt);
  function pickOpt(e) {
    const b = e.target.closest('.qopt'); if (!b || view.dataset.fin === '1') return;
    const q = b.closest('.qq'); ans[q.dataset.i] = +b.dataset.j;
    q.querySelectorAll('.qopt').forEach(x => x.classList.toggle('sel', x === b));
  }
  function finish() {
    clearInterval(testTimer); view.dataset.fin = '1'; view.removeEventListener('click', pickOpt);
    let ok = 0;
    view.querySelectorAll('.qq').forEach(q => {
      const i = q.dataset.i, right = +qs[i].dataset.a;
      if (ans[i] === right) ok++;
      q.querySelectorAll('.qopt').forEach((o, j) => { o.classList.remove('sel'); if (j === right) o.classList.add('right'); else if (j === ans[i]) o.classList.add('wrong'); });
      q.querySelector('.why').hidden = false;
    });
    const pct = Math.round(ok / qs.length * 100), best = store.get('best', null);
    if (best === null || pct > best) store.set('best', pct);
    const r = document.createElement('div');
    r.innerHTML = `<div class="score">${pct} %</div><p class="sub">${ok} správně z ${qs.length}. ${pct >= 90 ? 'To by byla jednička.' : pct >= 75 ? 'To by byla dvojka.' : pct >= 60 ? 'To by byla trojka.' : 'Pod 60 % by to na známku nestačilo.'} Vysvětlení je u každé otázky.</p><a class="btn" href="#/test" id="again">Nový test</a>`;
    view.prepend(r);
    view.querySelector('.row').remove(); scrollTo(0, 0); math(view);
  }
  document.getElementById('fin').onclick = finish;
  view.dataset.fin = '0'; tick(); testTimer = setInterval(tick, 1000); math(view); scrollTo(0, 0);
}

/* ---------- průvodce ---------- */
const TREE = {
  start: { q: 'Co potřebuješ vybrat?', o: [['Jaký graf nakreslit', 'g'], ['Jakou míru polohy použít', 'p'], ['Jakou míru variability použít', 'v'], ['Jak změřit závislost dvou proměnných', 'z'], ['Co je to za proměnnou', 'typ']] },
  typ: { q: 'Má proměnná hodnoty, které jsou opravdu počet nebo měřená veličina?', o: [['Ano, odečítání dává smysl', 'typ2'], ['Ne, jsou to kategorie (i když třeba zapsané čísly)', 'typ3']] },
  typ2: { q: 'Může mezi dvěma hodnotami ležet další hodnota?', o: [['Ne, jen oddělené hodnoty, typicky počty', 'R:Diskrétní kvantitativní|Příklad: počet sourozenců. Nemůžeš mít 2,5 sourozence, ale průměr 1,1 sourozence klidně vyjít může.'], ['Ano, jakákoli hodnota z intervalu', 'R:Spojitá kvantitativní|Příklad: výška, hmotnost, výdaje. Peníze se v praxi berou jako spojité, i když jsou zaokrouhlené na koruny.']] },
  typ3: { q: 'Dají se kategorie přirozeně seřadit?', o: [['Ano', 'R:Ordinální kvalitativní|Příklad: vzdělání, spokojenost 1–5. Pořadí znáš, ale nevíš přesně o kolik se hodnoty liší, takže průměr korektně použít nejde.'], ['Ne', 'R:Nominální kvalitativní|Příklad: pohlaví, kraj, barva. Oblíbená barva pořadí nevytváří, pořadí musí být přirozené.']] },
  g: { q: 'Co chceš ukázat?', o: [['Jednu kategorickou nebo diskrétní proměnnou', 'R:Sloupcový graf|Výsečový se nedoporučuje: oko hůř porovnává úhly než výšky sloupců. V Excelu: Vložení → Sloupcový nebo kruhový graf.'], ['Tvar rozdělení spojité proměnné', 'R:Histogram|Sloupce se dotýkají, protože intervaly na sebe navazují. U výstupu z Analýzy dat nastav šířku mezery na 0 %.'], ['Medián, kvartily a odlehlé hodnoty', 'R:Krabicový graf|Odlehlé jsou hodnoty mimo interval ⟨Q₁ − 1,5·IQR; Q₃ + 1,5·IQR⟩.'], ['Vývoj v čase', 'R:Spojnicový graf|Pozor na uříznutou osu y, která malou změnu opticky zvětší.'], ['Vztah dvou číselných proměnných', 'R:Bodový graf (x-y)|Nezávislou proměnnou dej na osu x. Před výpočtem korelace se na něj vždy podívej.'], ['Vztah dvou kategorických proměnných', 'R:Kontingenční tabulka a skupinový sloupcový graf|Srovnávej relativní četnosti, pokud mají skupiny různou velikost.']] },
  p: { q: 'Jaký je typ proměnné?', o: [['Nominální', 'R:Modus|Nic jiného nemá smysl: kategorie nejde seřadit ani sčítat.'], ['Ordinální', 'R:Medián nebo modus|Kvantily ano, průměr ne, protože vzdálenosti mezi hodnotami nejsou definované.'], ['Kvantitativní', 'p2']] },
  p2: { q: 'Co průměruješ?', o: [['Běžné hodnoty, jejichž součet dává smysl', 'p3'], ['Poměrový ukazatel (km/h, Kč/kg, obyv./km²)', 'p4'], ['Koeficienty růstu nebo procentní změny v čase', 'R:Geometrický průměr|$\\bar{x}_G=\\sqrt[n]{k_1\\cdots k_n}$, odečti 1 a máš průměrné tempo. Ze začátku a konce: $\\sqrt[n]{y_n/y_0}$, kde n je počet změn, ne počet let v řadě.']] },
  p3: { q: 'Je rozdělení přibližně symetrické, bez extrémů?', o: [['Ano', 'R:Aritmetický průměr|Mají-li hodnoty různou váhu nebo znáš jen skupinové průměry, použij vážený průměr.'], ['Ne, jsou tam extrémy nebo šikmost', 'R:Medián|Typicky mzdy a ceny. Pravostranně zešikmené: průměr je větší než medián.']] },
  p4: { q: 'Co je u pozorování společné nebo známé jako váha?', o: [['Čitatel (stejná dráha, známí obyvatelé)', 'R:Harmonický průměr|Vahami jsou hodnoty čitatele. Bezpečná kontrola: celkový čitatel / celkový jmenovatel.'], ['Jmenovatel (stejný čas, známá rozloha)', 'R:Vážený aritmetický průměr|Vahami jsou hodnoty jmenovatele. Stejná kontrola: celkový čitatel / celkový jmenovatel.'], ['Nic z toho neznám', 'R:Nejde to spočítat|Bez vah správný průměr poměrového ukazatele nezjistíš. Přesně na to míří list 04_Harmonický průměr.']] },
  v: { q: 'Co potřebuješ?', o: [['Porovnat skupiny s různým průměrem nebo jednotkami', 'R:Variační koeficient|$V=s/\\bar{x}$. Směrodatné odchylky porovnávej přímo jen při stejných průměrech.'], ['Popsat rozptýlení v původních jednotkách', 'R:Směrodatná odchylka|Rozptyl vychází ve čtvercových jednotkách a nevykládá se.'], ['Odolnost vůči extrémům', 'R:Mezikvartilové rozpětí nebo MAD|Rozpětí závisí jen na minimu a maximu, proto je na extrémy naopak velmi citlivé.'], ['Znám jen průměry a odchylky za skupiny', 'R:Rozklad rozptylu|Celkový rozptyl = vnitroskupinový + meziskupinový.']] },
  z: { q: 'Jaké proměnné máš?', o: [['Dvě kategorické', 'R:Kontingenční tabulka, G (χ²), koeficient C a V|Měří sílu, ne směr. Vzorec pro očekávanou četnost: řádkový součet × sloupcový součet / n.'], ['Kategorickou a číselnou', 'R:Rozklad rozptylu a poměr determinace P²|P² = meziskupinový rozptyl / celkový rozptyl.'], ['Dvě pořadí nebo ordinální proměnné', 'R:Spearman nebo Kendall|Spearman z rozdílů pořadí, Kendall ze souhlasných a nesouhlasných dvojic.'], ['Dvě číselné', 'z2']] },
  z2: { q: 'Jak vypadá bodový graf?', o: [['Přibližně přímka, bez extrémů', 'R:Pearsonův koeficient r|Měří lineární závislost. Pro popis vztahu přidej regresní přímku a r².'], ['Monotónní křivka nebo extrémní hodnoty', 'R:Spearmanův koeficient|Pracuje s pořadím, takže jedna extrémní hodnota mu tolik nevadí.'], ['Oblouk, nahoru a zase dolů', 'R:Ani Pearson, ani Spearman|Závislost není lineární ani monotónní, oba koeficienty ji nezachytí. Ukazuje to graf, ne číslo.']] }
};
function guide(node, path) {
  setTitle('Rozhodovací průvodce');
  path = path || [];
  const n = TREE[node];
  view.innerHTML = `<div class="crumb"><a href="#/">← Přehled</a></div><h1>Rozhodovací průvodce</h1><p class="sub">Odpovídej na otázky, dostaneš doporučení a důvod.</p><h2>${n.q}</h2><div class="grid">${n.o.map((o, i) => `<button class="btn" style="text-align:left" data-i="${i}">${o[0]}</button>`).join('')}</div>${path.length ? '<div class="row"><button class="btn" id="bk">← Zpět</button></div>' : ''}`;
  view.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const t = n.o[+b.dataset.i][1];
    if (t.startsWith('R:')) {
      const [title, why] = t.slice(2).split('|');
      view.innerHTML = `<div class="crumb"><a href="#/">← Přehled</a></div><h1>Rozhodovací průvodce</h1><div class="box tip"><h4>Doporučení</h4><p style="font:700 20px/1.3 var(--sans)">${title}</p><p>${why}</p></div><div class="row"><button class="btn" id="bk2">← Zpět</button><button class="btn primary" id="rs">Znovu od začátku</button></div>`;
      view.querySelector('#bk2').onclick = () => guide(node, path);
      view.querySelector('#rs').onclick = () => guide('start');
      math(view);
    } else guide(t, path.concat(node));
  });
  const bk = view.querySelector('#bk');
  if (bk) bk.onclick = () => guide(path[path.length - 1], path.slice(0, -1));
}

/* ---------- směrování ---------- */
async function route() {
  clearInterval(testTimer);
  closeDrawer();
  const p = location.hash.slice(2).split('/');
  try {
    if (p[0] === 's') await sectionList(p[1]);
    else if (p[0] === 'l') await lesson(p[1], p[2]);
    else if (p[0] === 'trener') await trainer();
    else if (p[0] === 'test') await testPage();
    else if (p[0] === 'pruvodce') guide('start');
    else home();
  } catch (e) {
    view.innerHTML = '<h1>Stránku se nepodařilo načíst</h1><p>Zkontroluj připojení k internetu a zkus to znovu.</p><a class="btn" href="#/">Na přehled</a>';
  }
  scrollTo(0, 0);
  drawNav();
}
function drawNav() {
  const cur = location.hash;
  const a = (h, t) => `<a href="${h}" class="${cur === h || cur.startsWith(h.replace('#/s/', '#/l/') + '/') ? 'cur' : ''}">${t}</a>`;
  document.getElementById('drawer').innerHTML = `<a href="../">← Všechny předměty</a>` + a('#/', 'Přehled') + '<h5>Látka</h5>' + SECTIONS.map(s => a('#/s/' + s.file, s.title)).join('') + '<h5>Procvičení</h5>' + TOOLS.map(t => a(t.hash, t.title)).join('');
}
const drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim');
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('btn-menu').onclick = () => { drawer.classList.add('open'); scrim.classList.add('open'); };
scrim.onclick = closeDrawer;
drawer.addEventListener('click', e => { if (e.target.tagName === 'A') closeDrawer(); });
const theme = store.get('theme', null);
if (theme) document.documentElement.dataset.theme = theme;
document.getElementById('btn-theme').onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const t = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('theme', t);
};
addEventListener('hashchange', route);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
route();
