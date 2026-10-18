"""Build encrypted slide decks for the portal.

  python3 deck.py en   STEXT/deck.txt            -> print cleaned English markup per slide (for translating)
  python3 deck.py build ID KIND TITLE SLIDES_DIR STEXT/deck.txt SRC/deck.cs.txt APP [LABEL]

Markup (used both for the English text pulled from the PDF and for translations / extra slides):
  first line = slide title; "• " bullet, "- " sub-bullet, other lines = paragraphs; raw HTML lines pass through.
In SRC/deck.cs.txt:   "=== N" starts the Czech text of original slide N,
                      "+++ Title" starts an extra slide (inserted after the last original slide above it),
                      "%%% Title" starts an Excel block (same placement rule).
Images are encrypted with the same key as the Czech translation (env ECON_PW, salt from data/cs/meta.json).
"""
import base64, html, io, json, os, re, sys

NOISE = re.compile(r'^(fis\.vse\.cz/english|fis\.en\.vse|\d{1,3})$')

def split_pages(path):
    pages, cur, n = {}, [], None
    for ln in open(path, encoding='utf-8'):
        ln = ln.rstrip('\n').replace('\x0c', '')
        m = re.match(r'^=====(\d+)$', ln)
        if m:
            if n is not None:
                pages[n] = cur
            n, cur = int(m.group(1)), []
        else:
            cur.append(ln)
    if n is not None:
        pages[n] = cur
    return pages

def clean_en(lines):
    out = []
    for ln in lines:
        s = ln.strip().replace('\x0c', '')
        if not s or NOISE.match(s):
            if out and out[-1] != '':
                out.append('')
            continue
        if s[0] in '•▪●' or s.startswith('o '):
            out.append(('- ' if s[0] == '▪' or s.startswith('o ') else '• ') + s[1:].strip())
        elif re.match(r'^\d+\.\s', s):
            out.append(s)
        elif out and out[-1] not in ('',) and not out[-1].endswith(('.', ':', '?', '!')) and s[0].islower():
            out[-1] += ' ' + s
        elif out and out[-1].startswith(('• ', '- ')) and not out[-1].endswith(('.', ':', '?')):
            out[-1] += ' ' + s
        else:
            out.append(s)
    txt = '\n'.join(out).strip()
    return re.sub(r'\n{2,}', '\n', txt)

def markup_html(text, title=True):
    lines = [l for l in text.strip().split('\n') if l.strip() != '']
    if not lines:
        return '', ''
    t = ''
    if title and not lines[0].lstrip().startswith(('•', '-', '<')):
        t = lines.pop(0).strip()
    out, lst = [], None
    def close():
        nonlocal lst
        if lst:
            out.append('</ul>' if lst == 'ul' else '</ul></li></ul>')
        lst = None
    for l in lines:
        s = l.strip()
        if s.startswith('• '):
            if lst == 'sub':
                out.append('</ul></li>')
                lst = 'ul'
            if lst != 'ul':
                close(); out.append('<ul>'); lst = 'ul'
            out.append('<li>' + s[2:])
            out.append('</li>')
        elif s.startswith('- '):
            if lst == 'ul':
                out.pop()  # reopen last li
                out.append('<ul>'); lst = 'sub'
            elif lst != 'sub':
                close(); out.append('<ul><li><ul>'); lst = 'sub'
            out.append('<li>' + s[2:] + '</li>')
        elif s.startswith('<'):
            close(); out.append(s)
        else:
            close(); out.append('<p>' + s + '</p>')
    close()
    return t, ''.join(out)

def parse_src(path):
    blocks, cur = [], None
    for ln in open(path, encoding='utf-8'):
        ln = ln.rstrip('\n')
        m = re.match(r'^(===|\+\+\+|%%%)\s*(.*)$', ln)
        if m:
            cur = {'k': {'===': 'orig', '+++': 'extra', '%%%': 'excel'}[m.group(1)], 'h': m.group(2).strip(), 'body': []}
            blocks.append(cur)
        elif cur is not None:
            cur['body'].append(ln)
    return blocks

def key_from(app):
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    meta = json.load(open(os.path.join(app, 'data', 'cs', 'meta.json')))
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=base64.b64decode(meta['salt']),
                      iterations=meta['iter']).derive(os.environ['ECON_PW'].encode())

def enc(key, data):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = os.urandom(12)
    return iv, AESGCM(key).encrypt(iv, data, None)

def build(did, kind, title, sdir, stext, src, app, label=None, title_cs=None, intro=None):
    from PIL import Image
    key = key_from(app)
    pages = split_pages(stext)
    blocks = parse_src(src) if os.path.exists(src) else []
    pj = src.replace('.cs.txt', '.parts.json')
    if os.path.exists(pj):
        parts = json.load(open(pj, encoding='utf-8'))
        for b in blocks:
            b['body'] = [re.sub(r'\{\{(\w+)\}\}', lambda m: parts[m.group(1)], l) for l in b['body']]
    cs = {int(b['h'].split()[0]): '\n'.join(b['body']) for b in blocks if b['k'] == 'orig'}
    extras = {}
    last = 0
    order = []
    for b in blocks:
        if b['k'] == 'orig':
            last = int(b['h'].split()[0])
        else:
            extras.setdefault(last, []).append(b)
    outdir = os.path.join(app, 'data', 'decks', did)
    os.makedirs(outdir, exist_ok=True)
    imgs = sorted(f for f in os.listdir(sdir) if f.endswith('.png')) if sdir != '-' else [None] * len(pages)
    slides = []
    def add_extras(n):
        for b in extras.get(n, []):
            body = '\n'.join(b['body']).strip()
            slides.append({'k': b['k'], 'title': b['h'], 'html': markup_html(body, title=False)[1] if not body.startswith('<') else body})
    add_extras(0)
    for i, f in enumerate(imgs, 1):
        if f:
            im = Image.open(os.path.join(sdir, f)).convert('RGB')
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=78, method=6)
            iv, ct = enc(key, buf.getvalue())
            open(os.path.join(outdir, '%02d.bin' % i), 'wb').write(iv + ct)
        en_t, en_h = markup_html(clean_en(pages.get(i, [])))
        sl = {'k': 'orig', 'no': i, 'title': en_t, 'en': en_h}
        if f:
            sl['img'] = '%s/%02d.bin' % (did, i)
        if i in cs:
            ct_t, ct_h = markup_html(cs[i])
            sl['title_cs'] = ct_t; sl['cs'] = ct_h
        slides.append(sl)
        add_extras(i)
    deck = {'id': did, 'title': title, 'title_cs': title_cs, 'intro': intro, 'enc': True, 'slides': slides}
    iv, ct = enc(key, json.dumps(deck, ensure_ascii=False).encode())
    json.dump({'iv': base64.b64encode(iv).decode(), 'ct': base64.b64encode(ct).decode()},
              open(os.path.join(app, 'data', 'decks', did + '.json'), 'w'))
    # register in portal.json
    pp = os.path.join(app, 'data', 'portal.json')
    portal = json.load(open(pp))
    lst = [d for d in portal[kind] if d['id'] != did]
    lst.append({'id': did, 'title': title, 'label': label, 'n': len(imgs), 'extra': sum(1 for s in slides if s['k'] != 'orig')})
    portal[kind] = sorted(lst, key=lambda d: d['id'])
    json.dump(portal, open(pp, 'w'), ensure_ascii=False, indent=1)
    print(did, len(imgs), 'slides,', len(cs), 'translated,', sum(len(v) for v in extras.values()), 'extra')

if __name__ == '__main__':
    if sys.argv[1] == 'en':
        for n, lines in sorted(split_pages(sys.argv[2]).items()):
            print('=== %d' % n); print(clean_en(lines))
    elif sys.argv[1] == 'build':
        a = sys.argv[2:]
        build(*a[:7], label=a[7] if len(a) > 7 else None)
