"""Extract CORE Econ microeconomics pages into compact JSON for the app."""
import json, re, sys, os, html
from bs4 import BeautifulSoup, Comment, NavigableString, Tag

SRC = sys.argv[1]; OUT = sys.argv[2]
order = [l.strip() for l in open(os.path.join(SRC, '..', 'list.txt')) if l.strip()]
ids = {f[:-5] for f in order}

TRANS = {'p', 'li', 'h1', 'h2', 'h3', 'h4', 'dt', 'dd', 'td', 'th', 'figcaption', 'blockquote'}
BLOCKY = TRANS | {'ul', 'ol', 'div', 'table', 'dl', 'figure', 'section'}
NO_TRANS_CLS = {'source', 'bibliography-entry', 'figure-source', 'footnotes', 'citation', 'bibliography'}
KEEP_ATTR = {'href', 'src', 'alt', 'id', 'class', 'colspan', 'rowspan', 'data-term', 'data-sec', 'data-anchor',
             'data-gloss', 'data-t', 'start', 'data-link', 'data-ok'}
DROP_CLS = {'figure-buttons', 'video-options', 'share', 'figure-download', 'pagination-marker', 'load-iframe-button',
            'visuallyhidden', 'non-printing-x'}

def rewrite_href(a):
    h = a.get('href', '')
    if not h:
        return
    m = re.match(r'^([0-9a-z-]+)\.html(?:\?[^#]*)?(?:#(.*))?$', h)
    if m and m.group(1) in ids:
        a['data-sec'] = m.group(1)
        if m.group(2):
            a['data-anchor'] = m.group(2)
        a['href'] = '#'
    elif h.startswith('#fn'):
        pass
    elif h.startswith('transcript-') or re.match(r'^[0-9a-z-]+\.html', h):
        a['href'] = 'https://books.core-econ.org/the-economy/microeconomics/' + h
    if m and m.group(1) == '50-02-glossary' and m.group(2):
        a['data-gloss'] = m.group(2)

def decode_q(code):
    i = re.search(r'\D', code).start()
    a = code[i:]; out = []
    for _ in range(i):
        n = len(re.match(r'[aeiou]*', a).group(0)); out.append(n); a = a[2 * n:]
    return out

def clean(content):
    for q in content.find_all(attrs={'data-question-code': True}):
        ok = set(decode_q(q['data-question-code']))
        opts = q.select('ul.mcq-options > li')
        for k, li in enumerate(opts, 1):
            if k in ok:
                li['data-ok'] = '1'
    for c in content.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for t in content.find_all(['script', 'style', 'noscript', 'svg', 'button', 'iframe']):
        t.decompose()
    for t in content.find_all(class_=lambda c: c and any(x in DROP_CLS for x in c.split())):
        t.decompose()
    # videos -> simple link card
    for v in content.find_all('div', class_='video'):
        vid = v.get('data-video-id'); title = v.get('data-title', 'Video')
        desc = v.find(class_='video-description')
        new = BeautifulSoup('<div class="video-card"><a href="https://www.youtube.com/watch?v=%s" target="_blank" rel="noopener"><img src="https://core-media.electricbook.works/the-economy/microeconomics/images/web/youtube-%s.jpg" alt=""><span class="video-title">▶ %s</span></a></div>' % (vid, vid, html.escape(title)), 'html.parser').div
        if desc:
            p = BeautifulSoup('<p>' + desc.decode_contents().strip() + '</p>', 'html.parser').p
            new.append(p)
        v.replace_with(new)
    for img in content.find_all('img'):
        if img.get('data-src'):
            img['src'] = img['data-src']
        if not img.get('src'):
            img.decompose(); continue
        img['loading'] = 'lazy'
    for a in content.find_all('a'):
        rewrite_href(a)
        if a.get('href', '').startswith('http'):
            a['target'] = '_blank'; a['rel'] = 'noopener'
    # interactive graph links
    for fm in content.find_all(class_='figure-more'):
        fm.decompose()
    for t in content.find_all(True):
        for k in list(t.attrs):
            if k not in KEEP_ATTR and k not in ('loading', 'target', 'rel', 'data-video-id'):
                del t.attrs[k]
        if t.name == 'span' and not t.attrs:
            t.unwrap()
    return content

def has_text(t):
    return bool(t.get_text(strip=True))

def mark(content, segs):
    def walk(node, allow):
        for ch in list(node.children):
            if not isinstance(ch, Tag):
                continue
            cls = set(ch.get('class', []))
            a = allow and not (cls & NO_TRANS_CLS)
            if ch.name in TRANS and a and has_text(ch) and not ch.find(lambda x: isinstance(x, Tag) and x.name in BLOCKY):
                ch['data-t'] = str(len(segs))
                segs.append(re.sub(r'\s+', ' ', ch.decode_contents()).strip())
            else:
                walk(ch, a)
    walk(content, True)

def text_of(seg):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', seg))).strip()

units = {}
for f in order:
    sid = f[:-5]
    if sid == '50-05-index':
        continue
    soup = BeautifulSoup(open(os.path.join(SRC, f), encoding='utf-8').read(), 'lxml')
    content = soup.find('div', class_='content')
    clean(content)
    # title
    h2 = content.find('h2'); h1 = content.find('h1')
    if sid[:2].isdigit() and int(sid[:2]) <= 10:
        u = int(sid[:2]); title = (h2 or h1).get_text(' ', strip=True)
    else:
        u = 0; title = (h1 or h2).get_text(' ', strip=True)
    # drop repeated unit h1 on continued pages (keep on opener)
    if u and h1 and not content.find(class_='chapter-opener-wrapper') and h2:
        h1.decompose()
    segs = []
    mark(content, segs)
    body = content.decode_contents()
    body = re.sub(r'\n\s*\n+', '\n', body).strip()
    units.setdefault(u, []).append({'id': sid, 'title': re.sub(r'\s+', ' ', title), 'html': body, 'segs': segs})

APP = sys.argv[3]
os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(APP, 'en'), exist_ok=True)
toc = []; apptoc = []
for u, secs in sorted(units.items()):
    json.dump({'unit': u, 'sections': secs}, open(os.path.join(OUT, 'u%02d.json' % u), 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump({'unit': u, 'sections': [{'id': s['id'], 'title': s['title'], 'html': s['html']} for s in secs]},
              open(os.path.join(APP, 'en', 'u%02d.json' % u), 'w'), ensure_ascii=False, separators=(',', ':'))
    ut = 'Back matter'
    if u:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', secs[0]['html'], re.S)
        ut = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', m.group(1))).strip()
    ex = os.path.exists(os.path.join(APP, 'extra', 'u%02d.json' % u))
    apptoc.append({'unit': u, 'title': ut, 'extra': ex, 'sections': [{'id': s['id'], 'title': s['title']} for s in secs]})
    toc.append({'unit': u, 'sections': [{'id': s['id'], 'title': s['title'], 'n': len(s['segs']),
                                          'words': sum(len(text_of(x).split()) for x in s['segs'])} for s in secs]})
json.dump(toc, open(os.path.join(OUT, 'toc-stats.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(apptoc, open(os.path.join(APP, 'toc.json'), 'w'), ensure_ascii=False, indent=0)
