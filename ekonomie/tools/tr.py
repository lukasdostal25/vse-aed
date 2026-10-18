"""Translation workflow helpers.

  python3 tr.py prep WORK U     -> WORK/uNN.src.txt   (lines "s.t|segment", tags with attributes shortened to <xN>)
  python3 tr.py pack WORK APP   -> APP/data/cs/uNN.json (encrypted), APP/data/cs/meta.json

WORK/uNN.cs.txt holds the translations in the same "s.t|text" format. Plain-text translations never go
into the repository: the book is CC BY-NC-ND, so the Czech version is published only encrypted.
Password: env ECON_PW. Requires: cryptography.
"""
import base64, json, os, re, sys, html

TAG = re.compile(r'<(/?)([a-zA-Z0-9]+)((?:\s[^<>]*?)?)(/?)>')

def shorten(seg):
    out, stack, table, k = [], [], {}, 0
    pos = 0
    for m in TAG.finditer(seg):
        out.append(seg[pos:m.start()]); pos = m.end()
        close, name, attrs, selfc = m.group(1), m.group(2).lower(), m.group(3).strip(), m.group(4)
        if close:
            if stack and stack[-1][0] == name:
                _, key = stack.pop()
                out.append('</%s>' % key if key else '</%s>' % name)
            else:
                out.append(m.group(0))
            continue
        if not attrs or name in ('br',):
            out.append('<%s%s>' % (name, '/' if selfc else '') if name != 'br' else '<br>')
            if not selfc and name not in ('br', 'img', 'hr'):
                stack.append((name, None))
            continue
        k += 1; key = 'x%d' % k
        table[key] = (m.group(0), name)
        if selfc or name in ('img', 'hr'):
            out.append('<%s/>' % key)
        else:
            out.append('<%s>' % key); stack.append((name, key))
    out.append(seg[pos:])
    return ''.join(out), table

def restore(text, table):
    def rep(m):
        close, key, selfc = m.group(1), m.group(2), m.group(3)
        if key not in table:
            raise ValueError('unknown placeholder ' + key)
        open_tag, name = table[key]
        if close:
            return '</%s>' % name
        return open_tag
    return re.sub(r'<(/?)(x\d+)(/?)>', rep, text)

def plain(seg):
    t = re.sub(r'\\\(.*?\\\)|\\\[.*?\\\]', ' ', seg, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return html.unescape(t)

def auto(seg):
    """Return a translation for segments that need none (numbers, maths) or follow a fixed pattern."""
    p = plain(seg)
    if not re.search(r'[A-Za-z]{2,}', p):
        return seg
    m = re.fullmatch(r'<strong>Question (\d+\.\d+)</strong> Choose the correct answer\(s\)', seg.strip())
    if m:
        return '<strong>Otázka %s</strong> Vyberte správnou odpověď (odpovědi)' % m.group(1)
    return None

def load_unit(raw, u):
    return json.load(open(os.path.join(raw, 'u%02d.json' % u)))

def prep(work, raw, u):
    d = load_unit(raw, u)
    lines = []
    for si, s in enumerate(d['sections']):
        if s['title'].endswith('References') or s['id'] == '50-03-bibliography':
            continue
        for t, seg in enumerate(s['segs']):
            if auto(seg) is not None:
                continue
            short, _ = shorten(seg)
            lines.append('%d.%d|%s' % (si, t, short))
    os.makedirs(work, exist_ok=True)
    open(os.path.join(work, 'u%02d.src.txt' % u), 'w').write('\n'.join(lines) + '\n')
    print(u, len(lines), 'segments', sum(len(l.split()) for l in lines), 'words')

def parse(path):
    out = {}
    for ln in open(path, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln.strip() or ln.startswith('#'):
            continue
        k, _, v = ln.partition('|')
        out[k.strip()] = v.strip()
    return out

def build(work, raw, u, strict=False):
    d = load_unit(raw, u)
    tr = parse(os.path.join(work, 'u%02d.cs.txt' % u))
    res, missing, bad = {}, [], []
    for si, s in enumerate(d['sections']):
        arr = []
        for t, seg in enumerate(s['segs']):
            a = auto(seg)
            key = '%d.%d' % (si, t)
            if a is not None:
                arr.append(a); continue
            if key not in tr:
                arr.append(None)
                if not (s['title'].endswith('References') or s['id'] == '50-03-bibliography'):
                    missing.append(key)
                continue
            short, table = shorten(seg)
            try:
                txt = restore(tr[key], table)
            except ValueError as e:
                bad.append((key, str(e))); arr.append(None); continue
            # sanity: same placeholders and same number of maths
            ph_src = sorted(re.findall(r'<(x\d+)/?>', short)); ph_tr = sorted(re.findall(r'<(x\d+)/?>', tr[key]))
            if ph_src != ph_tr:
                bad.append((key, 'placeholders %s vs %s' % (ph_src, ph_tr)))
            if seg.count('\\(') != txt.count('\\(') or seg.count('\\[') != txt.count('\\['):
                bad.append((key, 'math count'))
            arr.append(txt)
        res[s['id']] = arr
    return res, missing, bad

def encrypt(key, data):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, data.encode('utf-8'), None)
    return {'iv': base64.b64encode(iv).decode(), 'ct': base64.b64encode(ct).decode()}

def pack(work, raw, app):
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    pw = os.environ['ECON_PW']
    outdir = os.path.join(app, 'data', 'cs'); os.makedirs(outdir, exist_ok=True)
    mpath = os.path.join(outdir, 'meta.json')
    meta = json.load(open(mpath)) if os.path.exists(mpath) else None
    if not meta:
        meta = {'salt': base64.b64encode(os.urandom(16)).decode(), 'iter': 200000, 'units': []}
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=base64.b64decode(meta['salt']), iterations=meta['iter']).derive(pw.encode())
    meta['check'] = encrypt(key, 'ok')
    units = set(meta['units'])
    for f in sorted(os.listdir(work)):
        m = re.fullmatch(r'u(\d\d)\.cs\.txt', f)
        if not m:
            continue
        u = int(m.group(1))
        res, missing, bad = build(work, raw, u)
        for b in bad:
            print('  BAD', u, b)
        print('unit', u, 'missing', len(missing), missing[:12])
        json.dump(encrypt(key, json.dumps(res, ensure_ascii=False, separators=(',', ':'))),
                  open(os.path.join(outdir, 'u%02d.json' % u), 'w'))
        units.add(u)
    meta['units'] = sorted(units)
    json.dump(meta, open(mpath, 'w'))

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prep':
        prep(sys.argv[2], sys.argv[3], int(sys.argv[4]))
    elif cmd == 'check':
        res, missing, bad = build(sys.argv[2], sys.argv[3], int(sys.argv[4]))
        print('missing', len(missing), missing[:40]); [print('BAD', b) for b in bad]
    elif cmd == 'pack':
        pack(sys.argv[2], sys.argv[3], sys.argv[4])
