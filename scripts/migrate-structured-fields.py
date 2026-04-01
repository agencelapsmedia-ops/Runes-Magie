import pandas as pd
import json, sys, io, unicodedata, re

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

def slugify(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def clean_isbn(isbn):
    if pd.isna(isbn) or isbn == '':
        return None
    return str(int(float(isbn))) if isinstance(isbn, (int, float)) else str(isbn).split('.')[0]

updates = []

# Tarots
TAROT_EXCEL = r'C:\Users\Admin\Dropbox\03-Clients_Laps_Media\#1 RUNES ET MAGIE\03-CONTENU\Oracles_et_Tarots.xlsx'
df_t = pd.read_excel(TAROT_EXCEL, sheet_name='Oracles et Tarots')
print(f'Tarots: {len(df_t)} lignes')
for i, row in df_t.iterrows():
    name = str(row['Nom du produit']).strip()
    slug = slugify(name)
    auteur = str(row['Auteur(e)']) if pd.notna(row['Auteur(e)']) else None
    contenu = str(row['Contenu']) if pd.notna(row['Contenu']) else None
    fmt = str(row['Format']) if pd.notna(row['Format']) else None
    isbn = clean_isbn(row.get('ISBN'))
    desc = str(row['Description']) if pd.notna(row['Description']) else ''

    # Clean longDescription: remove the structured info, keep only the real description
    long_desc = f"{name}"
    if auteur:
        long_desc += f" - {auteur}"
    if desc:
        long_desc += f"\n\n{desc}"

    updates.append({
        'slug': slug,
        'author': auteur,
        'content': contenu,
        'format': fmt,
        'isbn': isbn,
        'longDescription': long_desc,
    })

# Oracles
ORACLE_EXCEL = r'C:\Users\Admin\Dropbox\03-Clients_Laps_Media\#1 RUNES ET MAGIE\02-PHOTOS\photos-produits\Oracles\Oracles (1).xlsx'
df_o = pd.read_excel(ORACLE_EXCEL, sheet_name='Oracles')
print(f'Oracles: {len(df_o)} lignes')
for i, row in df_o.iterrows():
    name = str(row['Nom du produit']).strip()
    slug = slugify(name)
    auteur = str(row['Auteur(e)']) if pd.notna(row['Auteur(e)']) else None
    contenu = str(row['Contenu']) if pd.notna(row['Contenu']) else None
    fmt = str(row['Format']) if pd.notna(row['Format']) else None
    isbn = clean_isbn(row.get('ISBN'))
    desc = str(row['Description']) if pd.notna(row['Description']) else ''

    long_desc = f"{name}"
    if auteur:
        long_desc += f" - {auteur}"
    if desc:
        long_desc += f"\n\n{desc}"

    updates.append({
        'slug': slug,
        'author': auteur,
        'content': contenu,
        'format': fmt,
        'isbn': isbn,
        'longDescription': long_desc,
    })

with open(r'scripts/structured-fields.json', 'w', encoding='utf-8') as f:
    json.dump(updates, f, ensure_ascii=False, indent=2)

print(f'\n{len(updates)} produits exportes vers structured-fields.json')
