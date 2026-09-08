import csv, sys, re, json, unicodedata, os
csv.field_size_limit(sys.maxsize)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from teams_registry import TEAMS

SRC = 'products_export.csv'  # exporte do Shopify Admin > Produtos > Exportar, e coloque aqui com este nome
OUT_JS = '../src/js/products-catalog.js'
OUT_TEAMS_JS = '../src/js/teams.js'

EXCLUDE_KW = re.compile(r'\b(patch|patches|cartas?|chaveiros?|chuteiras?)\b', re.I)
PRONTA_ENTREGA = re.compile(r'pronta\s*entrega', re.I)
BALL_START = re.compile(r'^\s*\[?bola\b', re.I)
PHONE_JUNK = re.compile(r'\+?\d{2}\s?\d{4,5}[\-‑]\d{4}')

FEATURED_CLUBS = [
    'flamengo', 'corinthians', 'palmeiras',
    'real madrid', 'barcelona', 'milan', 'psg', 'paris saint',
    'manchester united',
]
RECENT_SEASON = re.compile(r'26/27|25/26|2026/27|2025/26|\b2026\b|\b27\b', re.I)

# times/selecoes com logo — cada alias vira um regex \bALIAS\b; ordem importa
# (nomes específicos antes de genéricos, ver teams_registry.py)
TEAM_PATTERNS = [
    (team['slug'], team['scope'], [re.compile(r'\b' + re.escape(a) + r'\b') for a in team['aliases']])
    for team in TEAMS
]


def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def norm(s):
    return strip_accents(s or '').lower()


def brl(value):
    n = float(value)
    s = f"{n:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    return f"R$ {s}"


def esc(s):
    return (s or '').replace('\\', '\\\\').replace("'", "\\'")


def guess_category(tags_l, title_l):
    if 'selecoes' in tags_l or 'selecao' in tags_l or 'selecao' in title_l:
        return 'Seleções'
    if 'internacionais' in tags_l or 'internacional' in tags_l:
        return 'Clubes internacionais · Torcedor'
    if 'nacionais' in tags_l:
        return 'Clubes nacionais · Torcedor'
    return 'Camisas de time'


def guess_kind(title_l):
    bits = []
    if 'retro' in title_l or 'retrô' in title_l:
        bits.append('Retrô')
    if 'jogador' in title_l:
        bits.append('Jogador')
    elif 'torcedor' in title_l:
        bits.append('Torcedor')
    if 'feminin' in title_l:
        bits.append('Feminina')
    if 'infantil' in title_l:
        bits.append('Infantil')
    if 'manga longa' in title_l:
        bits.append('Manga longa')
    if not bits:
        bits.append('Torcedor')
    return ' · '.join(bits)


def guess_gender(title_l):
    if 'infantil' in title_l:
        return 'infantil'
    if 'feminin' in title_l:
        return 'feminino'
    return 'masculino'


def match_team(title_l):
    for slug, scope, patterns in TEAM_PATTERNS:
        for p in patterns:
            if p.search(title_l):
                return slug, scope
    return None, None


rows_by_handle = {}
order = []
with open(SRC, newline='', encoding='utf-8') as f:
    r = csv.DictReader(f)
    for row in r:
        h = row.get('Handle', '').strip()
        if not h:
            continue
        if h not in rows_by_handle:
            rows_by_handle[h] = []
            order.append(h)
        rows_by_handle[h].append(row)

products = []
excluded = {}
team_counts = {}

for h in order:
    rows = rows_by_handle[h]
    main = rows[0]
    title = main.get('Title', '').strip()
    if not title:
        continue
    status = main.get('Status', '').strip()
    cat = main.get('Product Category', '').strip()
    tags_raw = main.get('Tags', '')
    tags_l = norm(tags_raw)
    title_l = norm(title)

    reason = None
    if status != 'active':
        reason = 'status'
    elif EXCLUDE_KW.search(title) or EXCLUDE_KW.search(tags_raw):
        reason = 'keyword'
    elif PRONTA_ENTREGA.search(title) or PRONTA_ENTREGA.search(tags_raw):
        reason = 'pronta-entrega'
    elif BALL_START.search(title):
        reason = 'bola'
    elif cat.startswith('Mídia'):
        reason = 'midia'
    elif PHONE_JUNK.search(title):
        reason = 'phone-junk'
    elif title_l.startswith('pendencia'):
        reason = 'pendencia'
    elif title_l.startswith('video'):
        reason = 'video-junk'

    if reason:
        excluded[reason] = excluded.get(reason, 0) + 1
        continue

    imgs = []
    seen_src = set()
    for row in sorted(rows, key=lambda x: (x.get('Image Position') or '999')):
        src = (row.get('Image Src') or '').strip()
        if src and src not in seen_src:
            seen_src.add(src)
            alt = (row.get('Image Alt Text') or '').strip() or title
            imgs.append({'src': src, 'alt': alt})
    if not imgs:
        excluded['no-image'] = excluded.get('no-image', 0) + 1
        continue
    imgs = imgs[:6]

    prices = []
    for row in rows:
        vp = (row.get('Variant Price') or '').strip()
        if vp:
            try:
                prices.append(float(vp))
            except ValueError:
                pass
    if not prices:
        excluded['no-price'] = excluded.get('no-price', 0) + 1
        continue
    price_min = min(prices)

    opt1name = norm(main.get('Option1 Name', ''))
    sizes = []
    if 'tamanho' in opt1name or 'idade' in opt1name:
        seen_sz = set()
        for row in rows:
            v = (row.get('Option1 Value') or '').strip()
            if v and v.lower() != 'default title' and v not in seen_sz:
                seen_sz.add(v)
                sizes.append(v)
        if sizes and all(s.isdigit() for s in sizes):
            sizes.sort(key=lambda s: int(s))
    if not sizes:
        sizes = ['P', 'M', 'G', 'GG']

    is_featured_club = any(c in title_l or c in tags_l for c in FEATURED_CLUBS)
    is_recent = bool(RECENT_SEASON.search(title)) or bool(RECENT_SEASON.search(tags_raw))
    score = (2 if is_featured_club else 0) + (1 if is_recent else 0)

    category = guess_category(tags_l, title_l)
    kind = guess_kind(title_l)
    gender = guess_gender(title_l)

    # tabela infantil oficial: 2 ao 12 — sobrescreve tamanhos em letra (P/M/G) ou ausentes
    if gender == 'infantil' and not (sizes and all(s.isdigit() for s in sizes)):
        sizes = ['2', '4', '6', '8', '10', '12']

    team_slug, team_scope = match_team(title_l)
    if team_slug:
        team_counts[team_slug] = team_counts.get(team_slug, 0) + 1
        scope = team_scope
    else:
        if category == 'Seleções':
            scope = 'selecao'
        elif category.startswith('Clubes internacionais'):
            scope = 'internacional'
        elif category.startswith('Clubes nacionais'):
            scope = 'nacional'
        else:
            scope = None

    description = [
        'Tecido esportivo padrão do fornecedor, mesmo modelo das lojas oficiais.',
        'Tamanhos disponíveis: ' + ', '.join(sizes) + '.',
        'Personalização com nome e número: +R$ 20 por peça.',
    ]

    products.append({
        'slug': h,
        'name': title,
        'category': category,
        'kind': kind,
        'tags_raw': tags_raw,
        'images': imgs,
        'price_min': price_min,
        'sizes': sizes,
        'description': description,
        'score': score,
        'featured': is_featured_club,
        'team': team_slug,
        'scope': scope,
        'gender': gender,
    })

products.sort(key=lambda p: (-p['score'], p['name']))

print('kept:', len(products), file=sys.stderr)
print('excluded:', excluded, file=sys.stderr)
print('times identificados:', len(team_counts), 'de', len(TEAMS), 'no registro —', sum(team_counts.values()), 'produtos com time', file=sys.stderr)

lines = []
lines.append('// Gerado a partir da exportação de produtos do Shopify (products_export_1.csv).')
lines.append('// Não controla estoque — mostra nome, imagens e preço de referência por peça.')
lines.append('// Times em destaque (mais recentes/26-27) aparecem primeiro; o resto segue por ordem alfabética.')
lines.append('// Para reprocessar a partir de uma nova exportação, veja build_products_js.py (fora deste projeto).')
lines.append('(function(){')
lines.append('  var IMPORTED = {};')

for p in products:
    slug = esc(p['slug'])
    name = esc(p['name'])
    category = esc(p['category'])
    kind = esc(p['kind'])
    sizes_js = ', '.join("'" + esc(s) + "'" for s in p['sizes'])
    price_val = brl(p['price_min'])
    imgs_js = ', '.join(
        "{ src: '" + esc(img['src']) + "', alt: '" + esc(img['alt']) + "', caption: 'Foto " + str(i + 1) + "' }"
        for i, img in enumerate(p['images'])
    )
    desc_js = ', '.join("'" + esc(d) + "'" for d in p['description'])
    if all(s.isdigit() for s in p['sizes']) and len(p['sizes']) > 1:
        sizes_summary = p['sizes'][0] + '–' + p['sizes'][-1]
    else:
        sizes_summary = '/'.join(p['sizes'][:2]) + ('–' + p['sizes'][-1] if len(p['sizes']) > 2 else '')
    tags_display = kind + ' · Tam. ' + sizes_summary
    team_js = "'" + esc(p['team']) + "'" if p['team'] else 'null'
    scope_js = "'" + esc(p['scope']) + "'" if p['scope'] else 'null'

    lines.append(
        "  IMPORTED['" + slug + "'] = { slug: '" + slug + "', name: '" + name + "', category: '" + category +
        "', tags: '" + esc(tags_display) + "', featured: " + ('true' if p['featured'] else 'false') +
        ", team: " + team_js + ", scope: " + scope_js + ", gender: '" + esc(p['gender']) + "'" +
        ", images: [" + imgs_js + "], price: [{ range: 'A partir de 10 peças', value: '" +
        price_val + "', min: 10 }], sizes: [" + sizes_js + "], description: [" + desc_js + "] };"
    )

lines.append('  window.DA_IMPORTED_PRODUCTS = IMPORTED;')
lines.append('})();')

with open(OUT_JS, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print('wrote', OUT_JS, file=sys.stderr)
print('size bytes:', os.path.getsize(OUT_JS), file=sys.stderr)

# ---- teams.js: registro de times pro filtro (nome, escudo, escopo) ----
teams_lines = []
teams_lines.append('// Registro de times/seleções (nome, escudo, escopo) usado pelo filtro do catálogo.')
teams_lines.append('// Gerado por build_products_js.py a partir de teams_registry.py.')
teams_lines.append('window.DA_TEAMS = [')
for team in TEAMS:
    teams_lines.append(
        "  { slug: '" + esc(team['slug']) + "', name: '" + esc(team['name']) + "', scope: '" + esc(team['scope']) +
        "', logo: 'src/img/teams/" + esc(team['logo']) + "', count: " + str(team_counts.get(team['slug'], 0)) + " },"
    )
teams_lines.append('];')

with open(OUT_TEAMS_JS, 'w', encoding='utf-8') as f:
    f.write('\n'.join(teams_lines) + '\n')

print('wrote', OUT_TEAMS_JS, file=sys.stderr)
