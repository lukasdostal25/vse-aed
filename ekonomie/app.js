/* Čtečka učebnice CORE Econ The Economy 2.0: Microeconomics.
   Text 1:1 z učebnice (EN), volitelný český překlad (šifrovaný, jen pro osobní použití),
   doplňky na konci kapitol, vyhledávání, pamatování pozice, offline. */
(() => {
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('econ:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('econ:' + k, JSON.stringify(v)); } catch (e) {} },
};
const pad = n => String(n).padStart(2, '0');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BAR = () => $('.bar').getBoundingClientRect().height;

const state = {
  toc: null,
  secIndex: {},           // id -> {unit, i}
  en: {},                 // unit -> {id: section}
  cs: {},                 // unit -> {id: [segments]} (decrypted)
  extra: {},              // unit -> {html}
  lang: store.get('lang', 'en'),
  key: null,
  cur: null,              // {type:'sec'|'extra'|'home', id, unit}
  seen: store.get('seen', {}),
};

/* ---------------- data ---------------- */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.json();
}
async function loadToc() {
  state.toc = await getJSON('data/toc.json');
  state.toc.forEach(u => u.sections.forEach((s, i) => { state.secIndex[s.id] = { unit: u.unit, i }; }));
}
async function loadUnit(u) {
  if (!state.en[u]) {
    const d = await getJSON(`data/en/u${pad(u)}.json`);
    const m = {}; d.sections.forEach(s => { m[s.id] = s; });
    state.en[u] = m;
  }
  return state.en[u];
}
async function loadExtra(u) {
  if (state.extra[u] === undefined) {
    try { state.extra[u] = await getJSON(`data/extra/u${pad(u)}.json`); } catch (e) { state.extra[u] = null; }
  }
  return state.extra[u];
}
const hasExtra = u => !!(state.toc.find(x => x.unit === u) || {}).extra;

/* ---------------- Czech translation (encrypted) ---------------- */
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let csMeta = null;
async function csInfo() {
  if (!csMeta) { try { csMeta = await getJSON('data/cs/meta.json'); } catch (e) { csMeta = { units: [] }; } }
  return csMeta;
}
async function deriveKey(pw) {
  const meta = await csInfo();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
}
async function decrypt(key, obj) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(obj.iv) }, key, b64(obj.ct));
  return new TextDecoder().decode(pt);
}
async function unlock(pw) {
  const meta = await csInfo();
  const key = await deriveKey(pw);
  if ((await decrypt(key, meta.check)) !== 'ok') throw new Error('bad');
  state.key = key;
  const raw = await crypto.subtle.exportKey('raw', key);
  store.set('k', btoa(String.fromCharCode(...new Uint8Array(raw))));
}
async function restoreKey() {
  const k = store.get('k', null);
  if (!k) return;
  try { state.key = await crypto.subtle.importKey('raw', b64(k), 'AES-GCM', true, ['decrypt']); } catch (e) { state.key = null; }
}
async function loadCs(u) {
  if (state.cs[u] !== undefined) return state.cs[u];
  const meta = await csInfo();
  if (!state.key || !meta.units.includes(u)) return null;
  try {
    const enc = await getJSON(`data/cs/u${pad(u)}.json`);
    state.cs[u] = JSON.parse(await decrypt(state.key, enc));
  } catch (e) { state.cs[u] = null; }
  return state.cs[u];
}
function askPassword() {
  return new Promise(res => {
    const pop = $('#pop');
    pop.innerHTML = `<button class="close" aria-label="Zavřít">×</button><h4>Český překlad</h4>
      <div>Učebnice je pod licencí CC BY-NC-ND, která nedovoluje veřejně šířit překlady. Překlad je proto
      uzamčený jen pro tebe — zadej heslo (stačí jednou, zařízení si ho zapamatuje).</div>
      <input type="password" id="pw" autocomplete="current-password" placeholder="Heslo">
      <div class="row"><button class="btn ghost" data-a="no">Zrušit</button><button class="btn" data-a="ok">Odemknout</button></div>`;
    pop.hidden = false;
    const inp = $('#pw', pop); setTimeout(() => inp.focus(), 50);
    const done = v => { pop.hidden = true; pop.innerHTML = ''; res(v); };
    const go = async () => {
      try { await unlock(inp.value.trim()); done(true); }
      catch (e) { inp.value = ''; inp.placeholder = 'Špatné heslo, zkus znovu'; }
    };
    pop.onclick = e => {
      const a = e.target.dataset.a;
      if (a === 'ok') go(); else if (a === 'no' || e.target.classList.contains('close')) done(false);
    };
    inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  });
}

/* ---------------- UI helpers ---------------- */
function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
}
function setLangButtons() {
  $$('.flag').forEach(b => b.classList.toggle('on', b.dataset.lang === state.lang));
  document.documentElement.lang = state.lang;
}
function applyTheme() {
  const t = store.get('theme', 'auto');
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
function applySize() { document.documentElement.style.setProperty('--fs', store.get('fs', 18) + 'px'); }
function openDrawer(on) {
  $('#drawer').classList.toggle('open', on); $('#scrim').classList.toggle('on', on);
  if (on) { buildToc(); const c = $('.toc-sec.cur'); if (c) c.scrollIntoView({ block: 'center' }); }
}
function renderMath(el) {
  if (!window.renderMathInElement) return;
  try {
    renderMathInElement(el, {
      delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '$$', right: '$$', display: true },
                   { left: '\\(', right: '\\)', display: false }],
      throwOnError: false, ignoredClasses: ['no-math'],
    });
  } catch (e) {}
}
function sectionTitle(id) {
  const ix = state.secIndex[id]; if (!ix) return '';
  return state.toc.find(u => u.unit === ix.unit).sections[ix.i].title;
}
function unitOrder() { return state.toc.filter(u => u.unit > 0).concat(state.toc.filter(u => u.unit === 0)); }
/* reading order: sections of each unit, with the extra page placed before References */
function readingList() {
  const out = [];
  unitOrder().forEach(u => {
    u.sections.forEach(s => {
      if (u.extra && /References$/.test(s.title)) out.push({ type: 'extra', unit: u.unit });
      out.push({ type: 'sec', id: s.id, unit: u.unit });
    });
  });
  return out;
}
const sameItem = (a, b) => a && b && a.type === b.type && (a.type === 'sec' ? a.id === b.id : a.unit === b.unit);
const itemHash = it => it.type === 'sec' ? '#/s/' + it.id : it.type === 'deck' ? '#/d/' + it.id : '#/x/' + it.unit;
const itemTitle = it => it.type === 'sec' ? sectionTitle(it.id) : it.type === 'deck' ? (it.title || 'Prezentace') : `★ Navíc k Unit ${it.unit}`;

/* ---------------- table of contents ---------------- */
function buildToc() {
  const el = $('#toc');
  const cur = state.cur || {};
  el.innerHTML = unitOrder().map(u => {
    const secs = u.sections;
    const seen = secs.filter(s => state.seen[s.id]).length;
    const open = cur.unit === u.unit ? ' open' : '';
    const label = u.unit ? u.title.replace(/^Unit \d+\s*/, '') : 'Glosář a další';
    let items = '';
    secs.forEach(s => {
      if (u.extra && /References$/.test(s.title)) {
        items += `<button class="toc-sec extra${cur.type === 'extra' && cur.unit === u.unit ? ' cur' : ''}" data-go="#/x/${u.unit}">★ Navíc: vysvětlení, příklady, tipy</button>`;
      }
      items += `<button class="toc-sec${state.seen[s.id] ? ' seen' : ''}${cur.id === s.id ? ' cur' : ''}" data-go="#/s/${s.id}">${esc(s.title)}</button>`;
    });
    return `<details class="toc-unit"${open}><summary><span class="num">${u.unit || '≡'}</span><span>${esc(label)}</span>
      <span class="bar-mini">${seen}/${secs.length}</span></summary>${items}</details>`;
  }).join('');
}

/* ---------------- home ---------------- */
function renderHome() {
  state.cur = { type: 'home', tab: 'book' };
  $('#bar-title').textContent = 'The Economy 2.0 · Microeconomics';
  const pos = store.get('pos', null);
  const bpos = store.get('bookpos', null) || pos;
  const cont = bpos && (bpos.type === 'extra' || state.secIndex[bpos.id])
    ? `<button class="continue" data-go="${itemHash(bpos)}" data-pos="book"><small>Pokračovat, kde jsi skončil(a)</small><span>${esc(itemTitle(bpos))}</span></button>` : '';
  const units = state.toc.filter(u => u.unit > 0).map(u => {
    const seen = u.sections.filter(s => state.seen[s.id]).length;
    return `<button class="unit-card" data-go="#/s/${u.sections[0].id}"><div class="u">Unit ${u.unit}</div>
      <div class="t">${esc(u.title.replace(/^Unit \d+\s*/, ''))}</div>
      <div class="meter"><i style="width:${Math.round(100 * seen / u.sections.length)}%"></i></div></button>`;
  }).join('');
  $('#main').innerHTML = `<div class="home">
    <h1>The Economy 2.0: Microeconomics</h1>
    <p class="lead">Kompletní text učebnice CORE Econ 1:1 v angličtině. Vlajkou vpravo nahoře přepneš na český překlad,
    🔍 hledá v celé knize. Na konci každé kapitoly je <b style="color:var(--extra-ink)">★ Navíc</b> — vysvětlení jinými slovy, řešené příklady a tipy.</p>
    ${cont}
    ${units}
    <button class="unit-card" data-go="#/s/50-02-glossary"><div class="u">Glosář</div><div class="t">Všechny pojmy z učebnice</div></button>
    <div class="tools">
      <button class="chip" id="btn-offline">⬇ Stáhnout vše pro offline</button>
    </div>
    <p class="fine">Zdroj: The CORE Econ Team, <i>The Economy 2.0: Microeconomics</i>, CORE Economics Education 2023,
    <a href="https://books.core-econ.org/the-economy/microeconomics/0-3-contents.html" target="_blank" rel="noopener">books.core-econ.org</a>,
    licence <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener">CC BY-NC-ND 4.0</a>.
    Anglický text je převzatý beze změn, obrázky se načítají přímo z CORE. Tato čtečka není oficiální produkt CORE Econ ani jimi není schválena.
    Části označené ★ Navíc nejsou součástí učebnice — jsou to samostatné studijní poznámky. Postup se ukládá jen v tomto zařízení.</p>
  </div>`;
  $('#btn-offline').onclick = downloadAll;
  window.scrollTo(0, 0);
  setProgress();
}

/* ---------------- reader ---------------- */
async function renderSection(id, opts = {}) {
  const ix = state.secIndex[id];
  if (!ix) return renderHome();
  const main = $('#main');
  if (!state.en[ix.unit]) main.innerHTML = '<div class="loading">Načítám…</div>';
  const [unit, cs] = await Promise.all([loadUnit(ix.unit), state.lang === 'cs' ? loadCs(ix.unit) : null]);
  const sec = unit[id];
  state.cur = { type: 'sec', id, unit: ix.unit };
  $('#bar-title').textContent = sec.title;
  main.innerHTML = `<article class="reader">${sec.html}</article>${pagerHtml(state.cur)}${attribHtml(id)}`;
  const art = $('.reader', main);
  if (state.lang === 'cs') applyCs(art, cs && cs[id]);
  enhance(art);
  renderMath(art);
  state.seen[id] = 1; store.set('seen', state.seen);
  afterRender(opts);
}
async function renderExtra(u, opts = {}) {
  const main = $('#main');
  main.innerHTML = '<div class="loading">Načítám…</div>';
  const x = await loadExtra(u);
  state.cur = { type: 'extra', unit: u };
  $('#bar-title').textContent = `★ Navíc · Unit ${u}`;
  const t = state.toc.find(z => z.unit === u);
  main.innerHTML = `<article class="reader extra-page">
    <div class="extra-banner"><span style="font-size:24px">★</span><div><b>Navíc k Unit ${u} — není součástí učebnice</b>
    <small>Moje doplňující poznámky: látka vysvětlená jinými slovy, řešené příklady krok za krokem, tipy a časté chyby.</small></div></div>
    <h1><strong>Unit ${u}</strong>${esc(t.title.replace(/^Unit \d+\s*/, ''))}</h1>
    ${x ? x.html : '<p>Doplňky k této kapitole se připravují.</p>'}</article>${pagerHtml(state.cur)}`;
  const art = $('.reader', main);
  enhance(art);
  renderMath(art);
  afterRender(opts);
}
function pagerHtml(cur) {
  const list = readingList();
  const i = list.findIndex(x => sameItem(x, cur));
  const prev = list[i - 1], next = list[i + 1];
  return `<nav class="pager">${prev ? `<button data-go="${itemHash(prev)}"><small>← Předchozí</small><span>${esc(itemTitle(prev))}</span></button>` : '<span></span>'}
    ${next ? `<button class="next" data-go="${itemHash(next)}"><small>Další →</small><span>${esc(itemTitle(next))}</span></button>` : ''}</nav>`;
}
function attribHtml(id) {
  return `<div class="attrib">© CORE Economics Education 2023, <a href="https://books.core-econ.org/the-economy/microeconomics/${id}.html" target="_blank" rel="noopener">originál této stránky</a>,
    CC BY-NC-ND 4.0.${state.lang === 'cs' ? ' Český překlad je neoficiální, jen pro osobní studium.' : ''}</div>`;
}
function applyCs(art, segs) {
  if (!segs) { toast('Pro tuto stránku zatím překlad není — zobrazuji angličtinu.'); return; }
  $$('[data-t]', art).forEach(el => {
    const s = segs[+el.dataset.t];
    if (s) el.innerHTML = s; else el.classList.add('untranslated');
  });
}

/* make book elements interactive */
function enhance(art) {
  // step-through figures
  $$('.slides', art).forEach(sl => {
    const figs = $$(':scope > .figure', sl);
    if (figs.length < 2) return;
    const summary = figs[0], steps = figs.slice(1);
    const box = document.createElement('div'); box.className = 'slideshow';
    sl.insertBefore(box, summary.nextSibling);
    steps.forEach(f => box.appendChild(f));
    const nav = document.createElement('div'); nav.className = 'slide-nav';
    nav.innerHTML = `<button aria-label="Předchozí krok">‹</button><div class="dots">${steps.map(() => '<i></i>').join('')}</div>
      <span class="slide-count"></span><button aria-label="Další krok">›</button>`;
    box.appendChild(nav);
    const [bPrev, bNext] = $$('button', nav);
    let k = 0;
    const show = () => {
      steps.forEach((f, j) => { f.hidden = j !== k; });
      $$('.dots i', nav).forEach((d, j) => d.classList.toggle('on', j === k));
      $('.slide-count', nav).textContent = `${k + 1} / ${steps.length}`;
      bPrev.disabled = k === 0; bNext.disabled = k === steps.length - 1;
    };
    bPrev.onclick = () => { if (k > 0) { k--; show(); } };
    bNext.onclick = () => { if (k < steps.length - 1) { k++; show(); } };
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) (dx < 0 ? bNext : bPrev).click();
    });
    summary.hidden = true; // the steps end with the complete figure; summary duplicates the last step
    const cap = $('p.caption', summary);
    if (cap) box.insertBefore(cap.cloneNode(true), box.firstChild).classList.add('caption');
    show();
  });
  // multiple-choice questions
  $$('.question', art).forEach(q => {
    const opts = $$('ul.mcq-options > li', q), fbs = $$('ul.mcq-feedback > li', q);
    if (!opts.length) return;
    opts.forEach((li, i) => {
      if (fbs[i]) { const d = document.createElement('div'); d.className = 'fb'; d.innerHTML = fbs[i].innerHTML; li.appendChild(d); }
      li.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        if (q.classList.contains('revealed')) return;
        li.classList.toggle('picked');
      });
    });
    const btn = document.createElement('button'); btn.className = 'reveal';
    btn.textContent = state.lang === 'cs' ? 'Zkontrolovat' : 'Check answers';
    btn.onclick = () => {
      if (q.classList.contains('revealed')) {
        q.classList.remove('revealed');
        opts.forEach(li => { li.classList.remove('picked'); li.style.borderColor = ''; $('.mark', li)?.remove(); });
        btn.textContent = state.lang === 'cs' ? 'Zkontrolovat' : 'Check answers';
        return;
      }
      q.classList.add('revealed');
      let allRight = true;
      opts.forEach(li => {
        const ok = li.dataset.ok === '1', picked = li.classList.contains('picked');
        if (ok !== picked) allRight = false;
        li.style.borderColor = ok ? 'var(--ok)' : (picked ? 'var(--bad)' : '');
        const m = document.createElement('b'); m.className = 'mark';
        m.style.color = ok ? 'var(--ok)' : 'var(--bad)'; m.textContent = ok ? '✓ ' : (picked ? '✗ ' : '');
        li.insertBefore(m, li.firstChild);
      });
      btn.textContent = (allRight ? (state.lang === 'cs' ? '✓ Správně! ' : '✓ Correct! ') : '') + (state.lang === 'cs' ? 'Zkusit znovu' : 'Try again');
    };
    $('.question-content', q)?.appendChild(btn) || q.appendChild(btn);
  });
  // extensions collapse
  $$('.expandable-box.extension', art).forEach(x => {
    const h = $(':scope > h3', x);
    if (h) h.addEventListener('click', () => x.classList.toggle('open'));
  });
  // key terms -> definition popup
  $$('strong[data-term]', art).forEach(s => s.addEventListener('click', () => showTerm(s.dataset.term)));
}

/* glossary popup */
let glossary = null;
async function showTerm(term) {
  if (!glossary) {
    const u0 = await loadUnit(0);
    const g = document.createElement('div'); g.innerHTML = u0['50-02-glossary'].html;
    glossary = {};
    $$('dt.glossary-term', g).forEach(dt => {
      const dd = dt.nextElementSibling;
      glossary[dt.textContent.trim().toLowerCase()] = { term: dt.textContent.trim(), en: dd ? dd.innerHTML : '', t: dd ? dd.dataset.t : null, tt: dt.dataset.t };
    });
  }
  const key = term.toLowerCase();
  let g = glossary[key] || Object.values(glossary).find(x => x.term.toLowerCase().startsWith(key.replace(/\s*\(.*\)$/, '')));
  // fall back to the definition box on this page
  let html = g ? g.en : '';
  let title = g ? g.term : term;
  if (!g) {
    const dt = $$('.reader dt.definition-term').find(d => d.textContent.trim().toLowerCase() === key);
    if (dt && dt.nextElementSibling) html = dt.nextElementSibling.innerHTML;
  }
  let csHtml = '';
  if (g && state.key) {
    const cs = await loadCs(0);
    const seg = cs && cs['50-02-glossary'];
    if (seg && seg[g.t]) csHtml = `<div style="margin-top:8px;color:var(--ink-2)"><b>${seg[g.tt] || ''}</b> — ${seg[g.t]}</div>`;
  }
  const pop = $('#pop');
  pop.innerHTML = `<button class="close" aria-label="Zavřít">×</button><h4>${esc(title)}</h4><div>${html || 'Definice nenalezena.'}</div>${csHtml}`;
  pop.hidden = false;
  renderMath(pop);
  pop.onclick = e => { if (e.target.classList.contains('close')) pop.hidden = true; };
}

/* ---------------- position memory ---------------- */
function topAnchor() {
  const bar = BAR();
  const els = $$('#main [data-t], #main .extra > *, #main .reader > *');
  for (const el of els) {
    if (el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > bar + 4) return { el, off: r.top - bar };
  }
  return null;
}
function anchorKey(el) {
  if (el.dataset.t != null) return { t: +el.dataset.t };
  const all = $$('#main .reader > *, #main .extra > *');
  return { n: all.indexOf(el) };
}
function findAnchor(a) {
  if (!a) return null;
  if (a.t != null) return $(`#main [data-t="${a.t}"]`);
  if (a.n != null) return $$('#main .reader > *, #main .extra > *')[a.n] || null;
  return null;
}
function savePos() {
  const cur = state.cur;
  if (!cur || cur.type === 'home') return;
  const a = topAnchor();
  const pos = { type: cur.type, id: cur.id, unit: cur.unit, a: a ? anchorKey(a.el) : null, off: a ? Math.round(a.off) : 0, y: Math.round(scrollY) };
  store.set('pos', pos);
  if (cur.type !== 'deck') store.set('bookpos', pos);
  if (cur.type === 'deck') pos.title = cur.title;
  const per = store.get('secpos', {}); per[cur.type === 'sec' ? cur.id : cur.type === 'deck' ? 'd:' + cur.id : 'x' + cur.unit] = pos; store.set('secpos', per);
}
let saveT = null;
function onScroll() {
  setProgress();
  clearTimeout(saveT); saveT = setTimeout(savePos, 250);
}
function setProgress() {
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (h > 0 && state.cur && state.cur.type !== 'home' ? Math.min(100, 100 * scrollY / h) : 0) + '%';
}
function scrollToAnchor(a, off = 0, flash = false) {
  const el = findAnchor(a);
  if (!el) return false;
  // reveal the element if it sits inside a hidden slide or collapsed extension
  const fig = el.closest('.slideshow .figure[hidden]');
  if (fig) { const box = fig.closest('.slideshow'); const figs = $$(':scope > .figure', box); const k = figs.indexOf(fig);
    for (let i = 0; i < k; i++) $('.slide-nav button:last-child', box).click(); }
  const ext = el.closest('.expandable-box.extension'); if (ext) ext.classList.add('open');
  const y = el.getBoundingClientRect().top + scrollY - BAR() - off;
  window.scrollTo(0, Math.max(0, y));
  if (flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  return true;
}
function afterRender(opts) {
  const restore = () => {
    if (opts.anchorId) {
      const el = document.getElementById(opts.anchorId);
      if (el) { el.closest('.expandable-box.extension')?.classList.add('open'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - BAR() - 10); }
    } else if (opts.a) {
      if (!scrollToAnchor(opts.a, opts.off || 0, !!opts.flash)) window.scrollTo(0, opts.y || 0);
    } else window.scrollTo(0, 0);
    setProgress();
  };
  restore();
  // images load lazily and shift layout; re-apply once fonts/images settle
  if (opts.a || opts.anchorId) { setTimeout(restore, 120); setTimeout(restore, 600); }
  if (state.cur.type === 'sec' || state.cur.type === 'extra') setTimeout(savePos, 700);
  $('#pop').hidden = true;
}

/* ---------------- routing ---------------- */
let pendingOpts = null;
async function route() {
  const h = location.hash;
  const opts = pendingOpts || {}; pendingOpts = null;
  let m;
  if ((m = h.match(/^#\/s\/([^/?#]+)(?:\/(.+))?$/))) {
    const id = decodeURIComponent(m[1]);
    if (m[2]) opts.anchorId = decodeURIComponent(m[2]);
    if (!opts.a && !opts.anchorId && opts.fromNav !== true) {
      const per = store.get('secpos', {})[id]; if (per && opts.resume) Object.assign(opts, per);
    }
    await renderSection(id, opts);
  } else if ((m = h.match(/^#\/x\/(\d+)/))) {
    await renderExtra(+m[1], opts);
  } else if (h === '#/book') {
    renderHome();
  } else if ((m = h.match(/^#\/(lec|sem|hw)$/))) {
    await renderDeckList(m[1]);
  } else if ((m = h.match(/^#\/d\/([^/?#]+)/))) {
    await renderDeck(decodeURIComponent(m[1]), opts);
  } else {
    await renderHub();
  }
  setTabs();
  openDrawer(false);
}
function go(hash, opts) {
  pendingOpts = opts || null;
  if (location.hash === hash) route(); else location.hash = hash;
}

/* ---------------- language switch ---------------- */
async function setLang(lang) {
  if (lang === state.lang) return;
  if (lang === 'cs') {
    if (!state.key) {
      const meta = await csInfo();
      if (!meta.units.length && !(await portalInfo()).locked) { toast('Český překlad se teprve připravuje.'); return; }
      if (!(await askPassword())) return;
    }
  }
  const a = topAnchor();
  const keep = a ? { a: anchorKey(a.el), off: a.off } : null;
  state.lang = lang; store.set('lang', lang); setLangButtons();
  const cur = state.cur;
  if (cur && cur.type === 'sec') await renderSection(cur.id, keep || {});
  else if (cur && cur.type === 'extra') await renderExtra(cur.unit, keep || {});
  else if (cur && cur.type === 'deck') await renderDeck(cur.id, keep || {});
}

/* ---------------- search ---------------- */
let searchIndex = null; // [{id, unit, t, en, cs}]
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
async function buildIndex() {
  const units = unitOrder().map(u => u.unit);
  await Promise.all(units.map(u => loadUnit(u).catch(() => null)));
  if (state.key) await Promise.all(units.map(u => loadCs(u).catch(() => null)));
  const idx = [];
  const tmp = document.createElement('div');
  units.forEach(u => {
    const secs = state.en[u]; if (!secs) return;
    const cs = state.cs[u] || {};
    Object.values(secs).forEach(sec => {
      if (sec.id === '50-03-bibliography') return;
      tmp.innerHTML = sec.html;
      $$('[data-t]', tmp).forEach(el => {
        const t = +el.dataset.t;
        const en = strip(el.innerHTML);
        const c = cs[sec.id] && cs[sec.id][t] ? strip(cs[sec.id][t]) : '';
        idx.push({ id: sec.id, unit: u, t, en, cs: c, n: norm(en + ' \u0001 ' + c) });
      });
    });
  });
  searchIndex = idx;
}
function snippet(text, q) {
  const n = norm(text); const i = n.indexOf(q);
  if (i < 0) return esc(text.slice(0, 160));
  const s = Math.max(0, i - 60), e = Math.min(text.length, i + q.length + 100);
  return (s ? '…' : '') + esc(text.slice(s, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, e)) + (e < text.length ? '…' : '');
}
async function doSearch(qs) {
  const box = $('#results');
  const q = norm(qs.trim());
  if (q.length < 2) { box.innerHTML = '<div class="search-note">Napiš aspoň 2 znaky. Hledá se v anglickém textu' + (state.key ? ' i v českém překladu' : '') + '.</div>'; return; }
  if (!searchIndex) { box.innerHTML = '<div class="search-note">Připravuji vyhledávání…</div>'; await buildIndex(); }
  if (norm($('#q').value.trim()) !== q) return;
  const hits = [];
  for (const r of searchIndex) {
    if (r.n.includes(q)) { hits.push(r); if (hits.length >= 150) break; }
  }
  if (!hits.length) { box.innerHTML = '<div class="search-note">Nic nenalezeno.</div>'; return; }
  box.innerHTML = `<div class="search-note">${hits.length >= 150 ? '150+' : hits.length} výsledků</div>` + hits.map((r, i) => {
    const inEn = norm(r.en).includes(q);
    const txt = inEn ? r.en : r.cs;
    return `<button class="res" data-i="${i}"><div class="res-sec">${esc(sectionTitle(r.id))}${inEn ? '' : ' · CZ'}</div><div class="res-txt">${snippet(txt, q)}</div></button>`;
  }).join('');
  box.onclick = e => {
    const b = e.target.closest('.res'); if (!b) return;
    const r = hits[+b.dataset.i];
    closeSearch();
    go('#/s/' + r.id, { a: { t: r.t }, off: 60, flash: true });
  };
}
function openSearch() {
  $('#search').hidden = false;
  const q = $('#q'); q.focus(); q.select();
  if (!q.value) doSearch('');
}
function closeSearch() { $('#search').hidden = true; $('#q').blur(); }

/* ---------------- offline ---------------- */
async function downloadAll() {
  const btn = $('#btn-offline');
  const urls = ['data/toc.json', ...state.toc.map(u => `data/en/u${pad(u.unit)}.json`)];
  state.toc.forEach(u => { if (u.extra) urls.push(`data/extra/u${pad(u.unit)}.json`); });
  const meta = await csInfo();
  meta.units.forEach(u => urls.push(`data/cs/u${pad(u)}.json`));
  let done = 0;
  btn.disabled = true;
  for (const u of urls) { try { await fetch(u); } catch (e) {} done++; btn.textContent = `⬇ Stahuji text… ${done}/${urls.length}`; }
  // figures
  await Promise.all(state.toc.map(u => loadUnit(u.unit).catch(() => null)));
  const imgs = new Set();
  Object.values(state.en).forEach(m => Object.values(m).forEach(s => {
    for (const x of s.html.matchAll(/src="(https:\/\/core-media[^"]+)"/g)) imgs.add(x[1]);
  }));
  const list = [...imgs]; let k = 0;
  const worker = async () => {
    while (k < list.length) {
      const u = list[k++];
      try { await fetch(u, { mode: 'no-cors' }); } catch (e) {}
      btn.textContent = `⬇ Stahuji obrázky… ${k}/${list.length}`;
    }
  };
  await Promise.all([1, 2, 3, 4, 5, 6].map(worker));
  btn.textContent = '✓ Vše uloženo pro offline';
}

/* ---------------- events ---------------- */
function bind() {
  $('#btn-menu').onclick = () => openDrawer(true);
  $('#btn-close-drawer').onclick = () => openDrawer(false);
  $('#scrim').onclick = () => openDrawer(false);
  $('#btn-search').onclick = openSearch;
  $('#btn-close-search').onclick = closeSearch;
  let qt = null;
  $('#q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => doSearch(e.target.value), 200); });
  $('#btn-home').onclick = () => go('#/');
  $$('.tab').forEach(t => t.onclick = () => go(t.dataset.href));
  $('#btn-theme').onclick = () => {
    const order = ['auto', 'light', 'dark']; const t = store.get('theme', 'auto');
    const n = order[(order.indexOf(t) + 1) % 3]; store.set('theme', n); applyTheme();
    toast({ auto: 'Motiv: podle systému', light: 'Motiv: světlý', dark: 'Motiv: tmavý' }[n]);
  };
  $('#btn-size').onclick = () => {
    const sizes = [16, 17, 18, 19, 20, 22]; const f = store.get('fs', 18);
    const n = sizes[(sizes.indexOf(f) + 1) % sizes.length]; store.set('fs', n); applySize(); toast('Velikost písma: ' + n + ' px');
  };
  $$('.flag').forEach(b => b.onclick = () => setLang(b.dataset.lang));
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); const h = g.dataset.go; const c = g.closest('.continue'); go(h, c ? { ...(store.get(c.dataset.pos === 'book' ? 'bookpos' : 'pos', {})) } : {}); return; }
    const a = e.target.closest('a[data-sec]');
    if (a) {
      e.preventDefault();
      const sec = a.dataset.sec, anc = a.dataset.anchor;
      if (sec === '50-02-glossary' && anc) {
        const term = a.textContent.trim(); showTerm(term); return;
      }
      go('#/s/' + sec + (anc ? '/' + encodeURIComponent(anc) : ''));
      return;
    }
    const fn = e.target.closest('a[href^="#fn"]');
    if (fn) {
      e.preventDefault();
      const t = document.getElementById(fn.getAttribute('href').slice(1));
      if (t) {
        const pop = $('#pop'); pop.innerHTML = `<button class="close">×</button>${t.innerHTML}`; pop.hidden = false;
        pop.onclick = ev => { if (ev.target.classList.contains('close')) pop.hidden = true; };
      }
    }
    if (!e.target.closest('#pop') && !e.target.closest('strong[data-term]')) $('#pop').hidden = true;
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') savePos(); });
  addEventListener('pagehide', savePos);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); openDrawer(false); $('#pop').hidden = true; }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); openSearch(); }
  });
}

/* ---------------- portal: hub, lecture slides, seminars, homework ---------------- */
const KINDS = {
  lec: { name: 'Přednášky', one: 'Přednáška', icon: '▤', hint: 'Slidy z přednášek 1:1, s českým překladem textu a mými vloženými slidy ★.' },
  sem: { name: 'Cvičení', one: 'Cvičení', icon: '▦', hint: 'Prezentace ze cvičení a excelové úlohy: data, vzorce a graf řešení.' },
  hw:  { name: 'Domácí úkoly', one: 'Domácí úkol', icon: '✎', hint: 'Zadání domácích úkolů k procvičení, upozornění na záludnosti a nové podobné úlohy.' },
};
let portal = null;
async function portalInfo() {
  if (!portal) { try { portal = await getJSON('data/portal.json'); } catch (e) { portal = { locked: false, lec: [], sem: [], hw: [] }; } }
  return portal;
}
function setTabs() {
  const c = state.cur || {};
  const tab = c.tab || (c.type === 'sec' || c.type === 'extra' ? 'book' : 'hub');
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
}
async function renderHub() {
  state.cur = { type: 'home', tab: 'hub' };
  $('#bar-title').textContent = 'Ekonomie · studijní portál';
  const p = await portalInfo();
  const pos = store.get('pos', null);
  const okPos = pos && (pos.type === 'extra' || pos.type === 'deck' || state.secIndex[pos.id]);
  const seen = Object.keys(state.seen).length, total = Object.keys(state.secIndex).length;
  const card = (href, icon, name, sub, meter) => `<button class="unit-card hub-card" data-go="${href}"><div class="hub-ico">${icon}</div>
    <div><div class="t">${name}</div><div class="hub-sub">${sub}</div>${meter != null ? `<div class="meter"><i style="width:${meter}%"></i></div>` : ''}</div></button>`;
  const cnt = k => p[k].length ? `${p[k].length} ${p[k].length === 1 ? 'položka' : p[k].length < 5 ? 'položky' : 'položek'}` : 'připravuje se';
  $('#main').innerHTML = `<div class="home">
    <h1>Principles of Economics</h1>
    <p class="lead">Všechno k předmětu na jednom místě. Vlajka vpravo nahoře přepíná EN/CZ všude, 🔍 hledá v učebnici,
    a aplikace si pamatuje, kde jsi skončil(a).</p>
    ${okPos ? `<button class="continue" data-go="${itemHash(pos)}" data-pos="all"><small>Pokračovat, kde jsi skončil(a)</small><span>${esc(itemTitle(pos))}</span></button>` : ''}
    ${card('#/book', '📖', 'Učebnice', 'The Economy 2.0: Microeconomics · 10 kapitol + ★ Navíc', Math.round(100 * seen / total))}
    ${card('#/lec', KINDS.lec.icon, 'Přednášky', cnt('lec'))}
    ${card('#/sem', KINDS.sem.icon, 'Cvičení', cnt('sem'))}
    ${card('#/hw', KINDS.hw.icon, 'Domácí úkoly', cnt('hw'))}
  </div>`;
  window.scrollTo(0, 0); setProgress();
}
async function renderDeckList(kind) {
  state.cur = { type: 'home', tab: kind };
  const K = KINDS[kind], p = await portalInfo();
  $('#bar-title').textContent = K.name;
  const per = store.get('secpos', {});
  const items = p[kind].map(d => {
    const seenN = (store.get('deckseen', {})[d.id] || []).length;
    return `<button class="unit-card" data-go="#/d/${d.id}"><div class="u">${esc(d.label || K.one)}</div><div class="t">${esc(d.title)}</div>
      <div class="hub-sub">${d.n ? d.n + ' slidů' : ''}${d.extra ? ` · ${d.extra} ★ navíc` : ''}${per['d:' + d.id] ? ' · rozpracováno' : ''}</div>
      ${d.n ? `<div class="meter"><i style="width:${Math.round(100 * Math.min(1, seenN / d.n))}%"></i></div>` : ''}</button>`;
  }).join('');
  $('#main').innerHTML = `<div class="home"><h1>${K.name}</h1><p class="lead">${K.hint}</p>
    ${items || `<div class="extra"><span class="tag">Připravuje se</span><p>Sem přijdou ${K.name.toLowerCase()}, jakmile nahraješ podklady.</p></div>`}
    ${kind === 'hw' && p.hw_note ? `<p class="fine">${esc(p.hw_note)}</p>` : ''}
    ${p.locked ? '<p class="fine">Materiály z VŠE jsou autorské dílo vyučujících, proto jsou zašifrované a otevřou se jen s tvým heslem.</p>' : ''}</div>`;
  window.scrollTo(0, 0); setProgress();
}
const deckCache = {}, blobCache = {};
async function loadDeck(id) {
  if (deckCache[id]) return deckCache[id];
  let d = await getJSON(`data/decks/${id}.json`);
  if (d.ct) {
    if (!state.key && !(await askPassword())) return null;
    d = JSON.parse(await decrypt(state.key, d));
  }
  deckCache[id] = d;
  return d;
}
async function slideImg(d, src) {
  if (!d.enc) return src;
  if (blobCache[src]) return blobCache[src];
  const buf = new Uint8Array(await (await fetch('data/decks/' + src)).arrayBuffer());
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, state.key, buf.slice(12));
  return (blobCache[src] = URL.createObjectURL(new Blob([pt], { type: src.endsWith('.png') ? 'image/png' : 'image/webp' })));
}
function slideHtml(sl, i, lang) {
  const cs = lang === 'cs' && sl.cs;
  const tag = { extra: '★ Navíc – není z originálu', excel: 'Excel' }[sl.k] || '';
  const num = sl.k === 'orig' ? `<span class="slide-no">${sl.no || i + 1}</span>` : '';
  const title = sl.k === 'orig' ? (cs ? sl.title_cs : sl.title) : sl.title;
  let text = '';
  if (sl.k === 'orig') {
    if (cs) text = `<div class="slide-text">${sl.title_cs ? `<h4>${sl.title_cs}</h4>` : ''}${sl.cs}</div>`;
    else if (sl.en && !sl.img) text = `<div class="slide-text">${sl.title ? `<h4>${sl.title}</h4>` : ''}${sl.en}</div>`;
    else if (sl.en) text = `<details class="slide-en"><summary>Text slidu</summary><div class="slide-text">${sl.en}</div></details>`;
  }
  return `<section class="slide slide-${sl.k}" data-t="${i}">
    <div class="slide-head">${num}${tag ? `<span class="tag">${tag}</span>` : ''}${title && sl.k !== 'orig' ? `<b>${title}</b>` : ''}</div>
    ${sl.img ? `<div class="slide-img"><img data-src="${esc(sl.img)}" alt="${esc(sl.title || 'Slide ' + (sl.no || i + 1))}"></div>` : ''}
    ${text}
    ${sl.html ? `<div class="slide-html">${sl.html}</div>` : ''}
  </section>`;
}
async function renderDeck(id, opts = {}) {
  const main = $('#main');
  main.innerHTML = '<div class="loading">Načítám…</div>';
  const p = await portalInfo();
  let kind = 'lec', meta = null;
  for (const k of Object.keys(KINDS)) { const f = p[k].find(x => x.id === id); if (f) { kind = k; meta = f; } }
  const d = await loadDeck(id).catch(() => null);
  if (!d) { main.innerHTML = '<div class="loading">Tento materiál se nepodařilo otevřít.</div>'; return; }
  state.cur = { type: 'deck', id, tab: kind, title: d.title };
  $('#bar-title').textContent = d.title;
  const lang = state.lang;
  main.innerHTML = `<article class="reader deck">
    <h1><strong>${esc((meta && meta.label) || KINDS[kind].one)}</strong>${esc((lang === 'cs' && d.title_cs) || d.title)}</h1>
    ${d.intro ? `<p class="subheadline">${d.intro}</p>` : ''}
    ${d.slides.map((sl, i) => slideHtml(sl, i, lang)).join('')}
  </article>
  <nav class="pager"><button data-go="#/${kind}"><small>← Zpět</small><span>${KINDS[kind].name}</span></button></nav>`;
  const art = $('.reader', main);
  // decrypt / load images lazily as they approach the viewport
  const io = new IntersectionObserver(es => es.forEach(async e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    try { e.target.src = await slideImg(d, e.target.dataset.src); } catch (err) {}
  }), { rootMargin: '1200px 0px' });
  $$('img[data-src]', art).forEach(im => io.observe(im));
  renderMath(art);
  enhance(art);
  // remember which slides were seen
  const seenAll = store.get('deckseen', {}); const set = new Set(seenAll[id] || []);
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { set.add(+e.target.dataset.t); seenAll[id] = [...set]; store.set('deckseen', seenAll); }
  }), { threshold: 0.5 });
  $$('.slide', art).forEach(s => so.observe(s));
  afterRender(opts);
}

/* ---------------- boot ---------------- */
async function boot() {
  applyTheme(); applySize();
  bind();
  try { await loadToc(); } catch (e) { $('#main').innerHTML = '<div class="loading">Nepodařilo se načíst obsah. Jsi online?</div>'; return; }
  await restoreKey();
  if (state.lang === 'cs' && !state.key) state.lang = 'en';
  setLangButtons();
  // reopen exactly where the reader left off
  const pos = store.get('pos', null);
  if (!location.hash || location.hash === '#' ) {
    if (pos && (pos.type === 'extra' || pos.type === 'deck' || state.secIndex[pos.id])) {
      pendingOpts = { a: pos.a, off: pos.off, y: pos.y };
      history.replaceState(null, '', itemHash(pos));
    }
  } else if (pos && location.hash === itemHash(pos)) {
    pendingOpts = { a: pos.a, off: pos.off, y: pos.y };
  }
  await route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
})();
