"""SVG mock-ups of the Czech Excel (Microsoft 365) interface for step-by-step guides.

Everything is drawn at phone scale (viewBox width 360) so labels stay readable on an iPhone.
The element the reader should click is outlined in red and numbered.
"""
import html

GREEN, RED, INK, MUTED = '#1d6f42', '#e81123', '#222', '#666'
TABS = ['Soubor', 'Domů', 'Vložení', 'Kreslení', 'Rozložení stránky', 'Vzorce', 'Data', 'Revize', 'Zobrazení']
E = html.escape

def _svg(w, h, body):
    return ('<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, -apple-system, Arial, sans-serif" font-size="12">'
            '<rect width="%d" height="%d" fill="#fff"/>%s</svg>') % (w, h, w, h, body)

def _badge(x, y, n):
    return '<circle cx="%.1f" cy="%.1f" r="9" fill="%s"/><text x="%.1f" y="%.1f" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">%s</text>' % (x, y, RED, x, y + 4, n)

def _hi(x, y, w, h, n=1):
    return '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="5" fill="none" stroke="%s" stroke-width="2.5"/>%s' % (x - 2, y - 2, w + 4, h + 4, RED, _badge(x + w, y, n) if n else '')

def tabs_row(active, ctx=(), W=360, y=0):
    """Ribbon tab strip; shows a window of tabs around the active one (Excel has more tabs than fit on a phone)."""
    allt = TABS + list(ctx)
    i = allt.index(active)
    lo = max(0, min(i - 1, len(allt) - 4))
    out = ['<rect x="0" y="%d" width="%d" height="32" fill="#f3f3f3"/>' % (y, W)]
    x = 8
    if lo > 0:
        out.append('<text x="%d" y="%d" fill="%s">…</text>' % (x, y + 21, MUTED)); x += 18
    for t in allt[lo:]:
        w = 7.2 * len(t) + 16
        if x + w > W - 4:
            out.append('<text x="%d" y="%d" fill="%s">…</text>' % (x, y + 21, MUTED)); break
        isc = t in ctx
        if t == active:
            out.append('<rect x="%.1f" y="%d" width="%.1f" height="30" fill="#fff" stroke="#d6d6d6"/>' % (x, y + 2, w))
            out.append('<rect x="%.1f" y="%d" width="%.1f" height="3" fill="%s"/>' % (x + 6, y + 27, w - 12, GREEN))
        out.append('<text x="%.1f" y="%d" text-anchor="middle" fill="%s"%s>%s</text>' % (
            x + w / 2, y + 21, GREEN if (t == active or isc) else INK, ' font-weight="700"' if t == active else '', E(t)))
        x += w
    return ''.join(out)

def ribbon(active, groups, hi=None, ctx=(), n=0, W=360):
    """groups: [(group label, [(button label, icon), ...]), ...]; hi = label of the button to click."""
    out = [tabs_row(active, ctx, W)]
    out.append('<rect x="0" y="32" width="%d" height="96" fill="#fff" stroke="#e1e1e1"/>' % W)
    x = 6
    for gname, btns in groups:
        x0 = x
        for lab, ico in btns:
            lines = lab.split('\n')
            w = max(54, 6.4 * max(len(l) for l in lines) + 10)
            out.append('<text x="%.1f" y="70" text-anchor="middle" font-size="22">%s</text>' % (x + w / 2, ico))
            for k, l in enumerate(lines):
                out.append('<text x="%.1f" y="%d" text-anchor="middle" font-size="10.5" fill="%s">%s</text>' % (x + w / 2, 88 + 12 * k, INK, E(l)))
            if hi == lab.replace('\n', ' '):
                out.append(_hi(x + 1, 44, w - 2, 66, n))
            x += w + 4
        out.append('<text x="%.1f" y="123" text-anchor="middle" font-size="9.5" fill="%s">%s</text>' % ((x0 + x) / 2, MUTED, E(gname)))
        out.append('<line x1="%.1f" x2="%.1f" y1="40" y2="122" stroke="#e1e1e1"/>' % (x + 1, x + 1))
        x += 8
    return _svg(W, 130, ''.join(out))

def menu(items, hi=None, title=None, n=0, W=360):
    """Drop-down menu. items: [(icon, label)] or ('—', '') for a separator or ('#', heading)."""
    out, y = [], 8
    if title:
        out.append('<text x="12" y="20" font-weight="700" fill="%s">%s</text>' % (INK, E(title))); y = 30
    for ico, lab in items:
        if ico == '—':
            out.append('<line x1="10" x2="%d" y1="%d" y2="%d" stroke="#e1e1e1"/>' % (W - 10, y + 4, y + 4)); y += 9; continue
        if ico == '#':
            out.append('<rect x="4" y="%d" width="%d" height="22" fill="#f3f3f3"/><text x="12" y="%d" font-size="11" font-weight="700" fill="%s">%s</text>' % (y, W - 8, y + 15, MUTED, E(lab))); y += 24; continue
        if lab == hi:
            out.append('<rect x="6" y="%d" width="%d" height="30" fill="#e6f2ea"/>' % (y, W - 12))
        out.append('<text x="16" y="%d" font-size="15">%s</text><text x="44" y="%d" fill="%s">%s</text>' % (y + 21, ico, y + 20, INK, E(lab)))
        if lab == hi:
            out.append(_hi(6, y, W - 12, 30, n))
        y += 32
    return _svg(W, y + 8, '<rect x="2" y="2" width="%d" height="%d" fill="#fff" stroke="#c8c8c8"/>' % (W - 4, y + 4) + ''.join(out))

def swatches(rows, hi=None, title=None, n=0, W=360):
    """Colour-scale gallery. rows: [(label, [colours...])]; draws 3-band squares like Excel's 'Barevné škály'."""
    out, y = [], 10
    if title:
        out.append('<text x="12" y="22" font-weight="700" fill="%s">%s</text>' % (INK, E(title))); y = 34
    x = 12
    for k, (lab, cols) in enumerate(rows):
        for j, c in enumerate(cols):
            out.append('<rect x="%d" y="%d" width="38" height="%.1f" fill="%s"/>' % (x, y + j * 36 / len(cols), 36 / len(cols) + .5, c))
        out.append('<rect x="%d" y="%d" width="38" height="36" fill="none" stroke="#999"/>' % (x, y))
        if lab == hi:
            out.append(_hi(x, y, 38, 36, n))
        x += 48
        if x > W - 50:
            x = 12; y += 46
    if hi:
        out.append('<text x="12" y="%d" fill="%s" font-size="11.5">%s</text>' % (y + 62 if x > 12 else y + 16, MUTED, E('Najetím myší se ukáže název: „' + hi + '“')))
    return _svg(W, (y + 74 if x > 12 else y + 28), ''.join(out))

def charts_gallery(sections, hi=None, n=0, W=360):
    """Chart-type drop-down: sections = [(heading, [(label, kind)])]; kind in line, area, scatter, scatterline, column."""
    out, y = [], 6
    for head, items in sections:
        out.append('<rect x="4" y="%d" width="%d" height="22" fill="#f3f3f3"/><text x="12" y="%d" font-size="11" font-weight="700" fill="%s">%s</text>' % (y, W - 8, y + 15, MUTED, E(head)))
        y += 28; x = 12
        for lab, kind in items:
            out.append('<rect x="%d" y="%d" width="52" height="40" fill="#fff" stroke="#bbb" rx="3"/>' % (x, y))
            out.append(_mini(kind, x, y))
            if lab == hi:
                out.append(_hi(x, y, 52, 40, n))
            x += 62
        y += 50
    if hi:
        out.append('<text x="12" y="%d" fill="%s" font-size="11.5">%s</text>' % (y + 6, MUTED, E('Popisek po najetí: „' + hi + '“')))
        y += 14
    return _svg(W, y + 6, ''.join(out))

def _mini(kind, x, y):
    if kind == 'line':
        return '<polyline points="%d,%d %d,%d %d,%d %d,%d %d,%d" fill="none" stroke="#1f5fbf" stroke-width="2"/>' % (x + 6, y + 30, x + 16, y + 20, x + 26, y + 24, x + 36, y + 12, x + 46, y + 16)
    if kind == 'markers':
        return _mini('line', x, y) + ''.join('<circle cx="%d" cy="%d" r="2.5" fill="#1f5fbf"/>' % p for p in ((x + 6, y + 30), (x + 16, y + 20), (x + 26, y + 24), (x + 36, y + 12), (x + 46, y + 16)))
    if kind == 'area':
        return '<polygon points="%d,%d %d,%d %d,%d %d,%d %d,%d %d,%d" fill="#9ec0ea"/>' % (x + 6, y + 34, x + 6, y + 26, x + 20, y + 18, x + 32, y + 22, x + 46, y + 10, x + 46, y + 34)
    if kind == 'scatter':
        return ''.join('<circle cx="%d" cy="%d" r="2.6" fill="#1f5fbf"/>' % p for p in ((x + 10, y + 30), (x + 16, y + 24), (x + 22, y + 27), (x + 28, y + 18), (x + 34, y + 20), (x + 40, y + 12), (x + 44, y + 15)))
    if kind == 'column':
        return ''.join('<rect x="%d" y="%d" width="7" height="%d" fill="#1f5fbf"/>' % (x + 8 + 10 * k, y + 34 - h, h) for k, h in enumerate((14, 22, 10, 26)))
    return ''

def dialog(title, rows, buttons=('OK', 'Storno'), hi=None, n=3, W=360):
    """Simple dialog box. rows: list of (label, value-or-None, highlight?)."""
    out = ['<rect x="2" y="2" width="%d" height="%d" fill="#fff" stroke="#999"/>' % (W - 4, 52 + 34 * len(rows) + 40),
           '<rect x="2" y="2" width="%d" height="30" fill="#f3f3f3"/>' % (W - 4),
           '<text x="12" y="22" font-weight="700" fill="%s">%s</text><text x="%d" y="22" fill="%s">✕</text>' % (INK, E(title), W - 22, MUTED)]
    y = 44
    for lab, val, h in rows:
        out.append('<text x="14" y="%d" fill="%s">%s</text>' % (y + 16, INK, E(lab)))
        if val is not None:
            out.append('<rect x="160" y="%d" width="%d" height="24" fill="#fff" stroke="#8a8a8a"/><text x="166" y="%d" fill="%s">%s</text>' % (y, W - 174, y + 16, INK, E(val)))
            if h:
                out.append(_hi(160, y, W - 174, 24, h))
        elif h:
            out.append(_hi(10, y, W - 24, 24, h))
        y += 34
    x = W - 12
    for b in reversed(buttons):
        w = 8 * len(b) + 28; x -= w
        prim = b == buttons[0]
        out.append('<rect x="%d" y="%d" width="%d" height="26" rx="3" fill="%s" stroke="%s"/><text x="%.1f" y="%d" text-anchor="middle" fill="%s">%s</text>' % (
            x, y + 6, w, GREEN if prim else '#fff', GREEN if prim else '#8a8a8a', x + w / 2, y + 23, '#fff' if prim else INK, E(b)))
        if b == hi:
            out.append(_hi(x, y + 6, w, 26, n))
        x -= 8
    return _svg(W, y + 46, ''.join(out))

def chart_plus(items, hi=None, n=0, W=360, title='Prvky grafu'):
    """The '+' button next to a selected chart and its check-box list."""
    out = ['<rect x="8" y="8" width="196" height="150" fill="#fff" stroke="#bbb"/>',
           '<polyline points="22,130 52,100 82,112 112,70 142,84 172,46 196,58" fill="none" stroke="#1f5fbf" stroke-width="2"/>',
           '<rect x="210" y="10" width="26" height="26" fill="#fff" stroke="#888"/><text x="223" y="29" text-anchor="middle" font-size="20" fill="%s">+</text>' % INK,
           _hi(210, 10, 26, 26, 0)]
    y = 44
    out.append('<rect x="210" y="%d" width="%d" height="%d" fill="#fff" stroke="#bbb"/>' % (y, W - 214, 26 * len(items) + 30))
    out.append('<text x="220" y="%d" font-weight="700" fill="%s">%s</text>' % (y + 18, INK, E(title)))
    y += 28
    for lab, on in items:
        out.append('<rect x="220" y="%d" width="13" height="13" fill="%s" stroke="#666"/>%s<text x="240" y="%d" fill="%s" font-size="11.5">%s</text>' % (
            y + 4, GREEN if on else '#fff', '<path d="M%d %d l3 3 6-7" stroke="#fff" stroke-width="2" fill="none"/>' % (222, y + 10) if on else '', y + 15, INK, E(lab)))
        if lab == hi:
            out.append(_hi(216, y, W - 230, 20, n))
        y += 26
    return _svg(W, max(170, y + 12), ''.join(out))

def pane(title, rows, hi=None, n=0, W=360):
    """Side pane such as 'Formát osy'. rows: (kind, label, value) kind in check, radio, field, head."""
    out = ['<rect x="2" y="2" width="%d" height="%d" fill="#fff" stroke="#bbb"/>' % (W - 4, 40 + 30 * len(rows)),
           '<text x="12" y="24" font-weight="700" font-size="14" fill="%s">%s</text>' % (INK, E(title))]
    y = 38
    for kind, lab, val in rows:
        if kind == 'head':
            out.append('<text x="12" y="%d" font-weight="700" fill="%s">▾ %s</text>' % (y + 16, GREEN, E(lab)))
        elif kind == 'check':
            out.append('<rect x="14" y="%d" width="14" height="14" fill="%s" stroke="#666"/>' % (y + 5, GREEN if val else '#fff'))
            if val:
                out.append('<path d="M16 %d l3 3 7-8" stroke="#fff" stroke-width="2" fill="none"/>' % (y + 12))
            out.append('<text x="36" y="%d" fill="%s">%s</text>' % (y + 17, INK, E(lab)))
        elif kind == 'radio':
            out.append('<circle cx="21" cy="%d" r="7" fill="#fff" stroke="#666"/>%s<text x="36" y="%d" fill="%s">%s</text>' % (
                y + 12, '<circle cx="21" cy="%d" r="3.5" fill="%s"/>' % (y + 12, GREEN) if val else '', y + 17, INK, E(lab)))
        elif kind == 'field':
            out.append('<text x="14" y="%d" fill="%s">%s</text><rect x="190" y="%d" width="%d" height="22" fill="#fff" stroke="#8a8a8a"/><text x="196" y="%d" fill="%s">%s</text>' % (
                y + 17, INK, E(lab), y + 2, W - 204, y + 18, INK, E(val or '')))
        if lab == hi:
            out.append(_hi(10, y + 1, W - 24, 24, n))
        y += 30
    return _svg(W, y + 10, ''.join(out))

def keys(*ks):
    return ' + '.join('<kbd>%s</kbd>' % E(k) for k in ks)

def step(no, title, body, why=None):
    return '<section class="g-step"><h3><span class="g-n">%s</span>%s</h3>%s%s</section>' % (
        no, title, body, '<div class="g-why"><b>Proč:</b> %s</div>' % why if why else '')

def guide(title, steps, btn=None):
    return '<div class="xl-guide" data-title="%s"%s>%s</div>' % (E(title), ' data-btn="%s"' % E(btn) if btn else '', ''.join(steps))

def goal(cil, proc, graf=None, vysledek=None):
    h = '<dl class="xl-goal"><dt>Cíl</dt><dd>%s</dd><dt>Co počítáme a proč</dt><dd>%s</dd>' % (cil, proc)
    if graf:
        h += '<dt>Proč tento typ grafu</dt><dd>%s</dd>' % graf
    if vysledek:
        h += '<dt>Co máš na konci mít</dt><dd>%s</dd>' % vysledek
    return h + '</dl>'

def wb_buttons(*files):
    """files: (deck, file stem, label)."""
    return '<div class="xl-actions">%s</div>' % ''.join(
        '<button class="xl-btn ghost" data-wb="%s/wb_%s" data-title="%s.xlsx">📗 %s</button>' % (d, f, f, E(lab)) for d, f, lab in files)
