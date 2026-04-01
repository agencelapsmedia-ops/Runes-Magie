import pandas as pd
import json
import os
import re
import unicodedata
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

EXCEL = r'C:\Users\Admin\Dropbox\03-Clients_Laps_Media\#1 RUNES ET MAGIE\02-PHOTOS\photos-produits\Oracles\Oracles (1).xlsx'
PRODUCTS_DIR = r'C:\Users\Admin\Dropbox\03-Clients_Laps_Media\#1 RUNES ET MAGIE\runes-et-magie\public\images\products'
OUTPUT = r'C:\Users\Admin\Dropbox\03-Clients_Laps_Media\#1 RUNES ET MAGIE\runes-et-magie\scripts\oracles-data.json'

def slugify(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_price(price_str):
    match = re.search(r'\$?([\d.]+)', str(price_str))
    return float(match.group(1)) if match else 0

def find_images(product_name, products_dir):
    files = os.listdir(products_dir)
    matching = []
    name_lower = product_name.lower()

    for f in sorted(files):
        f_lower = f.lower()
        ext = os.path.splitext(f_lower)[1]
        if ext not in ['.webp', '.jpg', '.jpeg', '.png']:
            continue
        if f_lower.startswith('screencapture'):
            continue

        f_base = os.path.splitext(f_lower)[0]
        # Match: exact name, name + space + number, name + number
        if (f_base == name_lower or
            f_base.startswith(name_lower + ' ') or
            f_base.startswith(name_lower + '_')):
            matching.append(f'/images/products/{f}')

    if not matching:
        return '/images/products/placeholder-oracle.jpg', []

    # Sort: main image first (shortest name = no number suffix)
    matching.sort(key=len)
    return matching[0], matching

df = pd.read_excel(EXCEL, sheet_name='Oracles')
print(f'Lu {len(df)} oracles du Excel')

products = []
for i, row in df.iterrows():
    name = str(row['Nom du produit']).strip()
    price = parse_price(row['Prix (CAD)'])
    auteur = str(row['Auteur(e)']) if pd.notna(row['Auteur(e)']) else ''
    contenu = str(row['Contenu']) if pd.notna(row['Contenu']) else ''
    fmt = str(row['Format']) if pd.notna(row['Format']) else ''
    parution = str(row['Parution']) if pd.notna(row['Parution']) else ''
    isbn = str(int(row['ISBN'])) if pd.notna(row['ISBN']) and row['ISBN'] != '' else ''
    delai = str(row['Délai expédition']) if pd.notna(row['Délai expédition']) else ''
    desc = str(row['Description']) if pd.notna(row['Description']) else ''

    slug = slugify(name)
    image, images = find_images(name, PRODUCTS_DIR)

    # Build short description
    short_desc = f"{contenu} par {auteur}." if auteur and contenu else name
    if len(short_desc) > 150:
        short_desc = short_desc[:147] + '...'

    # Build long description
    long_parts = [f"{name} - {auteur}" if auteur else name]
    if contenu:
        long_parts.append(f"\nContenu : {contenu}")
    if fmt:
        long_parts.append(f"Format : {fmt}")
    if parution:
        long_parts.append(f"Parution : {parution}")
    if isbn:
        long_parts.append(f"ISBN : {isbn}")
    long_desc = '\n'.join(long_parts)

    # Tags
    tags = ['oracle', 'cartes divinatoires', 'divination']
    if auteur:
        tags.append(auteur.split('/')[0].split('&')[0].strip().lower())

    products.append({
        'slug': slug,
        'name': name,
        'price': price,
        'description': short_desc,
        'longDescription': long_desc,
        'category': 'tarot',
        'image': image,
        'images': images,
        'inStock': True,
        'featured': False,
        'tags': tags,
    })

    img_count = len(images)
    print(f'  {i+1}. {name} - ${price} - {img_count} photos')

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f'\n{len(products)} oracles exportes vers {OUTPUT}')
