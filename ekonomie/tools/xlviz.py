"""Small helpers that turn spreadsheet data into inline SVG charts and Excel-looking HTML tables."""
import html, math

def _nice(lo, hi, n=5):
    span = hi - lo or 1
    step = 10 ** math.floor(math.log10(span / n))
    for m in (1, 2, 2.5, 5, 10):
        if span / (step * m) <= n:
            step *= m
            break
    a = math.floor(lo / step) * step
    b = math.ceil(hi / step) * step
    ticks, t = [], a
    while t <= b + 1e-9:
        ticks.append(round(t, 10)); t += step
    return a, b, ticks

def _fmt(v, pct=False):
    if pct:
        return ('%.0f %%' % (v * 100)).replace('.', ',')
    if abs(v) >= 1000:
        return '{:,.0f}'.format(v).replace(',', ' ')
    if v == int(v):
        return str(int(v))
    return ('%.2g' % v).replace('.', ',')

COLORS = ['#c8102e', '#1f5fbf', '#1e8a4c', '#e3a82b', '#6c5ba8']

def line_chart(series, title='', xlabel='', ylabel='', W=640, H=320, pct=False, zero=False, xticks=None, bands=None):
    """series: list of (name, [(x, y), ...]); x numeric (e.g. year as float)."""
    L, R, T, B = 56, 12, 28, 40
    xs = [x for _, pts in series for x, _ in pts]; ys = [y for _, pts in series for _, y in pts]
    x0, x1 = min(xs), max(xs)
    y0, y1, yt = _nice(min(ys + ([0] if zero else [])), max(ys))
    sx = lambda x: L + (x - x0) / (x1 - x0) * (W - L - R)
    sy = lambda y: H - B - (y - y0) / (y1 - y0) * (H - T - B)
    out = ['<svg viewBox="0 0 %d %d" class="xl-chart" font-family="sans-serif" font-size="11">' % (W, H),
           '<rect width="100%%" height="100%%" fill="#fff"/>']
    if title:
        out.append('<text x="%d" y="16" font-weight="700" font-size="12">%s</text>' % (L, html.escape(title)))
    for b0, b1 in (bands or []):
        out.append('<rect x="%.1f" y="%d" width="%.1f" height="%d" fill="#f2c4cc" opacity=".45"/>' % (sx(b0), T, sx(b1) - sx(b0), H - T - B))
    for t in yt:
        out.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" stroke="#e5e5e5"/>' % (L, W - R, sy(t), sy(t)))
        out.append('<text x="%d" y="%.1f" text-anchor="end" fill="#555">%s</text>' % (L - 6, sy(t) + 4, _fmt(t, pct)))
    if y0 < 0 < y1:
        out.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" stroke="#888"/>' % (L, W - R, sy(0), sy(0)))
    for t in (xticks or _nice(x0, x1, 7)[2]):
        if x0 <= t <= x1:
            out.append('<text x="%.1f" y="%d" text-anchor="middle" fill="#555">%s</text>' % (sx(t), H - B + 15, str(int(t)) if t == int(t) else _fmt(t)))
    for i, (name, pts) in enumerate(series):
        d = ' '.join('%s%.1f %.1f' % ('M' if j == 0 else 'L', sx(x), sy(y)) for j, (x, y) in enumerate(pts))
        out.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.6"/>' % (d, COLORS[i % 5]))
        if len(series) > 1:
            out.append('<text x="%d" y="%d" fill="%s" font-weight="700">%s</text>' % (W - R - 150, T + 14 + 14 * i, COLORS[i % 5], html.escape(name)))
    if xlabel:
        out.append('<text x="%d" y="%d" text-anchor="middle" fill="#333">%s</text>' % ((L + W - R) / 2, H - 6, html.escape(xlabel)))
    if ylabel:
        out.append('<text transform="translate(12 %d) rotate(-90)" text-anchor="middle" fill="#333">%s</text>' % ((T + H - B) / 2, html.escape(ylabel)))
    out.append('</svg>')
    return ''.join(out)

def scatter(groups, title='', xlabel='', ylabel='', W=640, H=320, fit=False, logx=False):
    """groups: list of (name, [(x, y), ...])."""
    L, R, T, B = 60, 12, 28, 40
    tx = (lambda v: math.log10(v)) if logx else (lambda v: v)
    xs = [tx(x) for _, pts in groups for x, _ in pts]; ys = [y for _, pts in groups for _, y in pts]
    x0, x1, xt = _nice(min(xs), max(xs), 6); y0, y1, yt = _nice(min(ys), max(ys))
    sx = lambda x: L + (tx(x) - x0) / (x1 - x0) * (W - L - R)
    sy = lambda y: H - B - (y - y0) / (y1 - y0) * (H - T - B)
    out = ['<svg viewBox="0 0 %d %d" class="xl-chart" font-family="sans-serif" font-size="11">' % (W, H), '<rect width="100%" height="100%" fill="#fff"/>']
    if title:
        out.append('<text x="%d" y="16" font-weight="700" font-size="12">%s</text>' % (L, html.escape(title)))
    for t in yt:
        out.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" stroke="#e5e5e5"/>' % (L, W - R, sy(t), sy(t)))
        out.append('<text x="%d" y="%.1f" text-anchor="end" fill="#555">%s</text>' % (L - 6, sy(t) + 4, _fmt(t)))
    for t in xt:
        v = 10 ** t if logx else t
        out.append('<text x="%.1f" y="%d" text-anchor="middle" fill="#555">%s</text>' % (L + (t - x0) / (x1 - x0) * (W - L - R), H - B + 15, _fmt(v)))
    for i, (name, pts) in enumerate(groups):
        c = COLORS[i % 5] if len(groups) > 1 else '#1f5fbf'
        for x, y in pts:
            out.append('<circle cx="%.1f" cy="%.1f" r="3" fill="%s" fill-opacity=".7"/>' % (sx(x), sy(y), c))
        if len(groups) > 1:
            out.append('<text x="%d" y="%d" fill="%s" font-weight="700">● %s</text>' % (W - R - 120, T + 14 + 14 * i, c, html.escape(name)))
    if fit:
        P = [(tx(x), y) for _, pts in groups for x, y in pts]
        mx = sum(p[0] for p in P) / len(P); my = sum(p[1] for p in P) / len(P)
        b = sum((p[0] - mx) * (p[1] - my) for p in P) / sum((p[0] - mx) ** 2 for p in P); a = my - b * mx
        X0, X1 = min(p[0] for p in P), max(p[0] for p in P)
        f = lambda X: L + (X - x0) / (x1 - x0) * (W - L - R)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#c8102e" stroke-width="1.5" stroke-dasharray="5 3"/>' % (f(X0), sy(a + b * X0), f(X1), sy(a + b * X1)))
    if xlabel:
        out.append('<text x="%d" y="%d" text-anchor="middle" fill="#333">%s</text>' % ((L + W - R) / 2, H - 6, html.escape(xlabel)))
    if ylabel:
        out.append('<text transform="translate(12 %d) rotate(-90)" text-anchor="middle" fill="#333">%s</text>' % ((T + H - B) / 2, html.escape(ylabel)))
    out.append('</svg>')
    return ''.join(out)

def col(i):
    s = ''
    i += 1
    while i:
        i, r = divmod(i - 1, 26); s = chr(65 + r) + s
    return s

def sheet(rows, start_row=1, start_col=0, formula=None, sel=None, colors=None, sheet_name=None, fmt=None):
    """Excel-looking table. rows = list of lists. colors = dict {(r,c): css colour}. sel = (r,c) highlighted cell."""
    n = max(len(r) for r in rows)
    h = ['<div class="xl">']
    if sheet_name:
        h.append('<div class="xl-tabs"><span>%s</span></div>' % html.escape(sheet_name))
    if formula:
        h.append('<div class="xl-fx"><b>%s</b><i>fx</i><code>%s</code></div>' % (html.escape(formula[0]), html.escape(formula[1])))
    h.append('<div class="xl-scroll"><table class="xl-grid"><tr><th></th>%s</tr>' % ''.join('<th>%s</th>' % col(start_col + j) for j in range(n)))
    for i, r in enumerate(rows):
        h.append('<tr><th>%d</th>' % (start_row + i))
        for j in range(n):
            v = r[j] if j < len(r) else ''
            st = []
            if colors and (i, j) in colors:
                st.append('background:%s' % colors[(i, j)])
            cls = ' class="sel"' if sel == (i, j) else ''
            if isinstance(v, float):
                v = (fmt or (lambda x: ('%.4g' % x).replace('.', ',')))(v)
            sv = str(v) if v is not None else ''
            if sv and not any(ch.isdigit() for ch in sv[:1] + sv[-1:]) and not sv.startswith(('-', '−', '…')):
                st.append('text-align:left')
            h.append('<td%s%s>%s</td>' % (cls, ' style="%s"' % ';'.join(st) if st else '', html.escape(sv)))
        h.append('</tr>')
    h.append('</table></div></div>')
    return ''.join(h)

def scale_color(v, lo, hi):
    """Excel-like red–yellow–green colour scale."""
    t = 0 if hi == lo else max(0, min(1, (v - lo) / (hi - lo)))
    if t < .5:
        a, b, u = (248, 105, 107), (255, 235, 132), t / .5
    else:
        a, b, u = (255, 235, 132), (99, 190, 123), (t - .5) / .5
    return 'rgb(%d,%d,%d)' % tuple(round(a[k] + (b[k] - a[k]) * u) for k in range(3))
