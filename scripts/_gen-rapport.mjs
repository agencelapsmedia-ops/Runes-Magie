import { readFileSync, writeFileSync } from 'node:fs'

const d = JSON.parse(readFileSync('./scripts/_export-rdv.json', 'utf8'))
const TESTS = new Set(['jonathanlaplante@rcadistribution.ca', 'jonathanlaplante@live.ca', 'agencelapsmedia@gmail.com'])
const f = (x) => parseFloat(String(x || '').replace(',', '.')) || 0
const $ = (v) => v.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ') + ' $'
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const jourLong = (iso) => { const [a, m, j] = iso.split('-').map(Number); return j + ' ' + MOIS[m - 1] + ' ' + a }

const rows = d.rdv.map((a) => {
  const total = f(a['Montant total'])
  const paye = a['Paiement — statut'] === 'PAID' ? total : (a['Acompte payé le'] ? f(a.Acompte) : 0)
  return {
    date: a.Date, heure: a.Heure, fin: a.Fin,
    cliente: a.Cliente.replace(/\s+/g, ' ').trim(), courriel: a['Courriel cliente'], tel: a['Téléphone'],
    praticienne: a.Praticienne, statut: a.Statut, mode: a['Mode de paiement'], origine: a.Origine,
    total, paye, reste: a.Statut === 'CANCELLED' ? 0 : total - paye,
    acompte: f(a.Acompte), issue: a['Issue séance'],
    test: TESTS.has(a['Courriel cliente']),
  }
})

const reels = rows.filter((r) => !r.test)
const actifs = rows.filter((r) => r.statut !== 'CANCELLED')
const sum = (arr, k) => arr.reduce((s, r) => s + r[k], 0)

const MODES = [
  { cle: 'STRIPE (site)', nom: 'Stripe — réservation en ligne', note: 'acompte de 25 $ à la réservation, solde chargé après la séance', couleur: 'var(--teal)' },
  { cle: 'INTERAC', nom: 'Interac', note: 'rendez-vous saisi à la main', couleur: 'var(--or)' },
  { cle: 'CASH', nom: 'Comptant', note: 'rendez-vous saisi à la main', couleur: 'var(--violet)' },
  { cle: 'STRIPE_LINK', nom: 'Lien Stripe', note: 'saisi à la main, lien de paiement envoyé à la cliente', couleur: 'var(--magenta)' },
]
const parMode = MODES.map((m) => {
  const l = actifs.filter((r) => r.mode === m.cle)
  return { ...m, n: l.length, total: sum(l, 'total'), paye: sum(l, 'paye'), reste: sum(l, 'reste') }
})
const totalActif = sum(actifs, 'total'), payeActif = sum(actifs, 'paye'), resteActif = sum(actifs, 'reste')
const nbManuels = parMode.filter((m) => m.cle !== 'STRIPE (site)').reduce((s, m) => s + m.n, 0)
const nbAnnules = rows.filter((r) => r.statut === 'CANCELLED').length

const clientes = new Map()
for (const r of reels) {
  const c = clientes.get(r.courriel) ?? { nom: r.cliente, n: 0 }
  c.n++; clientes.set(r.courriel, c)
}

const pill = (statut) => {
  const map = { CONFIRMED: ['confirme', 'Confirmé'], COMPLETED: ['termine', 'Terminé'], CANCELLED: ['annule', 'Annulé'] }
  const [cls, txt] = map[statut] ?? ['confirme', statut]
  return '<span class="pill pill--' + cls + '">' + txt + '</span>'
}
const modeCourt = { 'STRIPE (site)': 'Stripe (en ligne)', INTERAC: 'Interac', CASH: 'Comptant', STRIPE_LINK: 'Lien Stripe' }
const issueTxt = { CHARGED: 'solde chargé', GIFTED: 'offert', NO_SHOW: 'absence' }

const lignes = rows.map((r) => [
  '      <tr' + (r.test ? ' class="essai"' : '') + '>',
  '        <td class="date"><span class="jour">' + esc(jourLong(r.date)) + '</span><span class="heure">' + esc(r.heure) + ' – ' + esc(r.fin) + '</span></td>',
  '        <td class="qui"><span class="nom">' + esc(r.cliente) + (r.test ? ' <span class="tag">essai</span>' : '') + '</span><span class="meta">' + esc(r.courriel.endsWith('interne.invalid') ? 'sans courriel · ' + r.tel : r.courriel) + '</span></td>',
  '        <td class="prat">' + esc(r.praticienne) + '</td>',
  '        <td>' + pill(r.statut) + (r.issue ? '<span class="issue">' + esc(issueTxt[r.issue] ?? r.issue) + '</span>' : '') + '</td>',
  '        <td class="mode"><span class="mode-nom">' + esc(modeCourt[r.mode] ?? r.mode) + '</span><span class="meta">' + (r.origine === 'RDV manuel' ? 'saisi à la main' : 'réservé sur le site') + '</span></td>',
  '        <td class="num">' + $(r.total) + '</td>',
  '        <td class="num num--paye">' + (r.paye ? $(r.paye) : '—') + '</td>',
  '        <td class="num num--reste">' + (r.reste ? $(r.reste) : '—') + '</td>',
  '      </tr>',
].join('\n')).join('\n')

const lignesAbandon = d.orphelins.map((o) => [
  '      <tr>',
  '        <td class="date"><span class="jour">' + esc(jourLong(o.date.slice(0, 10))) + '</span><span class="heure">' + esc(o.date.slice(11)) + '</span></td>',
  '        <td class="qui"><span class="nom">' + esc(o.cliente.replace(/\s+/g, ' ').trim()) + '</span><span class="meta">' + esc(o.courriel) + '</span></td>',
  '        <td>' + esc(o.offre) + '</td>',
  '        <td class="num">' + (o.montant ? $(f(o.montant)) : '—') + '</td>',
  '        <td class="meta">créée le ' + esc(o.cree.slice(0, 10)) + '</td>',
  '      </tr>',
].join('\n')).join('\n')

const barres = parMode.filter((m) => m.n).map((m) => [
  '        <div class="barre" style="--part:' + (m.total / totalActif * 100).toFixed(2) + '%;--teinte:' + m.couleur + '">',
  '          <div class="barre-tete"><span class="barre-nom">' + esc(m.nom) + '</span><span class="barre-chiffre">' + m.n + ' RDV · ' + $(m.total) + '</span></div>',
  '          <div class="barre-piste"><div class="barre-jauge"><div class="barre-paye" style="width:' + (m.paye / m.total * 100).toFixed(2) + '%"></div></div></div>',
  '          <p class="barre-note">' + esc(m.note) + ' — <strong>' + $(m.paye) + ' encaissé</strong>' + (m.reste > 0.01 ? ', ' + $(m.reste) + ' à percevoir' : '') + '</p>',
  '        </div>',
].join('\n')).join('\n')

const dus = actifs.filter((r) => r.reste > 0.01).sort((a, b) => b.reste - a.reste)
const lignesDues = dus.map((r) => [
  '      <tr' + (r.test ? ' class="essai"' : '') + '>',
  '        <td class="date"><span class="jour">' + esc(jourLong(r.date)) + '</span></td>',
  '        <td class="qui"><span class="nom">' + esc(r.cliente) + (r.test ? ' <span class="tag">essai</span>' : '') + '</span></td>',
  '        <td class="mode">' + esc(modeCourt[r.mode] ?? r.mode) + '</td>',
  '        <td class="num">' + $(r.total) + '</td>',
  '        <td class="num num--paye">' + (r.paye ? $(r.paye) : '—') + '</td>',
  '        <td class="num num--reste"><strong>' + $(r.reste) + '</strong></td>',
  '      </tr>',
].join('\n')).join('\n')

const CSS = `
:root{
  --violet:#2D1B4E; --or:#C9A84C; --bronze:#8A6410; --teal:#1A8A7D; --magenta:#C41D6E;
  --fond:#F5F0E8; --surface:#FBF8F2; --surface2:#EFE7D9; --trait:#DCD0B8;
  --texte:#1C1726; --texte-doux:#5C5468; --texte-faible:#8A8194;
  --ombre:0 1px 2px rgba(45,27,78,.06), 0 8px 24px -16px rgba(45,27,78,.25);
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --fond:#0A0A12; --surface:#15131F; --surface2:#1E1B2C; --trait:#2E2942;
    --texte:#EDE6D8; --texte-doux:#A79FB4; --texte-faible:#7A7288;
    --or:#D8B95E; --bronze:#C9A84C; --teal:#3FBFAE; --magenta:#E2568F; --violet:#B79BE8;
    --ombre:0 1px 2px rgba(0,0,0,.4), 0 10px 30px -18px rgba(0,0,0,.9);
  }
}
:root[data-theme="dark"]{
  --fond:#0A0A12; --surface:#15131F; --surface2:#1E1B2C; --trait:#2E2942;
  --texte:#EDE6D8; --texte-doux:#A79FB4; --texte-faible:#7A7288;
  --or:#D8B95E; --bronze:#C9A84C; --teal:#3FBFAE; --magenta:#E2568F; --violet:#B79BE8;
  --ombre:0 1px 2px rgba(0,0,0,.4), 0 10px 30px -18px rgba(0,0,0,.9);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--fond); color:var(--texte);
  font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:19px; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.page{max-width:1180px; margin:0 auto; padding:0 24px 96px; display:flex; flex-direction:column; gap:56px}

.masthead{padding:56px 0 0; display:flex; flex-direction:column; gap:16px}
.eyebrow{font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:var(--or); margin:0}
.masthead h1{font-family:'Cinzel',Georgia,serif; font-weight:700; font-size:clamp(32px,5vw,50px); line-height:1.1; margin:0; text-wrap:balance}
.chapeau{margin:0; max-width:62ch; color:var(--texte-doux); font-size:20px}
.filet{height:2px; background:linear-gradient(90deg,var(--or),transparent 72%); border:0; margin:6px 0 0}

.tuiles{display:grid; grid-template-columns:repeat(auto-fit,minmax(215px,1fr)); gap:16px; margin:0}
.tuile{background:var(--surface); border:1px solid var(--trait); border-radius:4px; padding:20px 22px 20px 25px; display:flex; flex-direction:column; gap:6px; box-shadow:var(--ombre); position:relative; overflow:hidden}
.tuile::before{content:""; position:absolute; top:0; bottom:0; left:0; width:3px; background:var(--accent,var(--or))}
.tuile--paye{--accent:var(--teal)} .tuile--reste{--accent:var(--bronze)}
.tuile dt{font-family:'Cinzel',Georgia,serif; font-size:11px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--texte-faible); margin:0}
.tuile dd{margin:0; font-family:'Philosopher',system-ui,sans-serif; font-size:34px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; color:var(--accent,var(--texte))}
.tuile p{margin:0; font-size:16px; color:var(--texte-doux); line-height:1.4}

section{display:flex; flex-direction:column; gap:20px}
h2{font-family:'Cinzel',Georgia,serif; font-size:15px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; margin:0; display:flex; align-items:center; gap:14px}
h2::after{content:""; flex:1; height:1px; background:var(--trait)}
.intro{margin:-8px 0 0; max-width:70ch; color:var(--texte-doux)}

.modes{display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:22px}
.barre{display:flex; flex-direction:column; gap:8px}
.barre-tete{display:flex; justify-content:space-between; align-items:baseline; gap:12px}
.barre-nom{font-family:'Cinzel',Georgia,serif; font-size:13px; font-weight:600; letter-spacing:.05em}
.barre-chiffre{font-family:'Philosopher',system-ui,sans-serif; font-variant-numeric:tabular-nums; font-size:15px; color:var(--texte-doux); white-space:nowrap}
.barre-piste{height:10px; background:var(--surface2); border-radius:2px; overflow:hidden}
.barre-jauge{height:100%; width:var(--part); background:color-mix(in srgb, var(--teinte) 26%, transparent)}
.barre-paye{height:100%; background:var(--teinte)}
.barre-note{margin:0; font-size:16px; color:var(--texte-doux); line-height:1.4}
.barre-note strong{color:var(--texte); font-weight:600}

.cadre{border:1px solid var(--trait); border-radius:4px; background:var(--surface); box-shadow:var(--ombre); overflow-x:auto}
table{width:100%; border-collapse:collapse; font-size:16px; min-width:820px}
thead th{position:sticky; top:0; z-index:1; background:var(--surface2); text-align:left; font-family:'Cinzel',Georgia,serif; font-size:10.5px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--texte-doux); padding:11px 14px; border-bottom:1px solid var(--trait); white-space:nowrap}
thead th.num{text-align:right}
tbody td{padding:11px 14px; border-bottom:1px solid color-mix(in srgb, var(--trait) 55%, transparent); vertical-align:top}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:color-mix(in srgb, var(--or) 8%, transparent)}
tr.essai{opacity:.48}
.date .jour{display:block; font-family:'Philosopher',system-ui,sans-serif; font-size:15px; white-space:nowrap}
.date .heure{display:block; font-family:'Philosopher',system-ui,sans-serif; font-variant-numeric:tabular-nums; font-size:14px; color:var(--texte-faible); white-space:nowrap}
.qui{min-width:190px}
.qui .nom{display:block; font-weight:600; font-size:18px; line-height:1.25}
.meta{display:block; font-size:14px; color:var(--texte-faible); font-family:'Philosopher',system-ui,sans-serif; word-break:break-word}
.prat{font-size:16px; color:var(--texte-doux); min-width:130px}
.mode-nom{display:block; font-size:16px; white-space:nowrap}
.num{text-align:right; font-family:'Philosopher',system-ui,sans-serif; font-variant-numeric:tabular-nums; white-space:nowrap; font-size:16px}
.num--paye{color:var(--teal)}
.num--reste{color:var(--bronze)}
.tag{font-family:'Cinzel',Georgia,serif; font-size:9px; letter-spacing:.12em; text-transform:uppercase; border:1px solid var(--trait); padding:1px 5px; border-radius:2px; color:var(--texte-faible); vertical-align:middle; font-weight:600}
.pill{display:inline-block; font-family:'Cinzel',Georgia,serif; font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; padding:3px 9px; border-radius:2px; white-space:nowrap; border:1px solid; background:transparent}
.pill--confirme{color:var(--violet); border-color:color-mix(in srgb, var(--violet) 45%, transparent)}
.pill--termine{color:var(--teal); border-color:color-mix(in srgb, var(--teal) 45%, transparent)}
.pill--annule{color:var(--magenta); border-color:color-mix(in srgb, var(--magenta) 45%, transparent)}
.issue{display:block; margin-top:4px; font-size:13px; color:var(--texte-faible); font-family:'Philosopher',system-ui,sans-serif}
tfoot td{padding:13px 14px; border-top:2px solid var(--trait); font-family:'Philosopher',system-ui,sans-serif; font-variant-numeric:tabular-nums; font-weight:700; background:var(--surface2); text-align:right}
tfoot .libelle{font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:600; text-align:left}

.notes{display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px}
.note{background:var(--surface); border:1px solid var(--trait); border-left:3px solid var(--or); border-radius:4px; padding:16px 18px}
.note h3{font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; margin:0 0 6px}
.note p{margin:0; font-size:16.5px; color:var(--texte-doux); line-height:1.45}
footer{border-top:1px solid var(--trait); padding-top:20px; font-size:15px; color:var(--texte-faible); font-family:'Philosopher',system-ui,sans-serif}
@media (max-width:640px){ body{font-size:18px} .page{padding:0 16px 64px; gap:44px} .masthead{padding-top:36px} }
`

const html = `<title>Registre des rendez-vous</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Philosopher:wght@400;700&display=swap">
<style>${CSS}</style>

<div class="page">
  <header class="masthead">
    <p class="eyebrow">Runes &amp; Magie · plateforme de soins holistiques</p>
    <h1>Registre des rendez-vous</h1>
    <p class="chapeau">Tous les rendez-vous enregistrés depuis l'ouverture de la plateforme, du 2 juin au 16 septembre 2026 — cliente, praticienne, statut, mode de paiement et sommes encaissées. Heures de l'Est.</p>
    <hr class="filet">
  </header>

  <section>
    <h2>En un coup d'œil</h2>
    <dl class="tuiles">
      <div class="tuile"><dt>Rendez-vous</dt><dd>${rows.length}</dd><p>dont ${reels.length} de vraies clientes et ${rows.length - reels.length} tests de l'agence</p></div>
      <div class="tuile"><dt>Clientes distinctes</dt><dd>${clientes.size}</dd><p>tests exclus · ${nbManuels} rendez-vous saisis à la main</p></div>
      <div class="tuile tuile--paye"><dt>Encaissé</dt><dd>${$(payeActif)}</dd><p>acomptes Stripe, soldes chargés, comptant et Interac marqués reçus</p></div>
      <div class="tuile tuile--reste"><dt>À percevoir</dt><dd>${$(resteActif)}</dd><p>sur ${$(totalActif)} facturables — les ${nbAnnules} annulations sont exclues</p></div>
    </dl>
  </section>

  <section>
    <h2>Par mode de paiement</h2>
    <p class="intro">La largeur de chaque barre est la part du chiffre d'affaires ; la portion pleine est ce qui est réellement entré.</p>
    <div class="modes">
${barres}
    </div>
  </section>

  <section>
    <h2>Les ${rows.length} rendez-vous</h2>
    <div class="cadre">
      <table>
        <thead><tr>
          <th scope="col">Date</th><th scope="col">Cliente</th><th scope="col">Praticienne</th>
          <th scope="col">Statut</th><th scope="col">Mode de paiement</th>
          <th scope="col" class="num">Montant</th><th scope="col" class="num">Encaissé</th><th scope="col" class="num">Reste</th>
        </tr></thead>
        <tbody>
${lignes}
        </tbody>
        <tfoot><tr>
          <td colspan="5" class="libelle">Total — hors annulations</td>
          <td>${$(totalActif)}</td><td>${$(payeActif)}</td><td>${$(resteActif)}</td>
        </tr></tfoot>
      </table>
    </div>
  </section>

  <section>
    <h2>Sommes à percevoir — ${dus.length} rendez-vous</h2>
    <p class="intro">Pour une réservation en ligne, seul l'acompte de 25 $ part à la réservation : le solde n'est chargé que lorsque la praticienne clique « Terminer » après la séance. Les Interac et liens Stripe listés ici n'ont jamais été marqués reçus dans le tableau de bord.</p>
    <div class="cadre">
      <table>
        <thead><tr><th scope="col">Date</th><th scope="col">Cliente</th><th scope="col">Mode</th><th scope="col" class="num">Montant</th><th scope="col" class="num">Encaissé</th><th scope="col" class="num">Reste</th></tr></thead>
        <tbody>
${lignesDues}
        </tbody>
        <tfoot><tr><td colspan="5" class="libelle">Total à percevoir</td><td>${$(sum(dus, 'reste'))}</td></tr></tfoot>
      </table>
    </div>
  </section>

  <section>
    <h2>Réservations abandonnées — ${d.orphelins.length}</h2>
    <p class="intro">Créneaux choisis sur le site puis jamais payés : la cliente a quitté avant Stripe. Ils n'ont jamais donné de vrai rendez-vous et ne comptent nulle part ailleurs dans ce registre.</p>
    <div class="cadre">
      <table>
        <thead><tr><th scope="col">Créneau visé</th><th scope="col">Cliente</th><th scope="col">Service</th><th scope="col" class="num">Montant</th><th scope="col">Trace</th></tr></thead>
        <tbody>
${lignesAbandon}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>À savoir en lisant ces chiffres</h2>
    <div class="notes">
      <div class="note"><h3>Deux temps de paiement</h3><p>Une réservation en ligne prélève 25 $ d'acompte tout de suite ; le solde est chargé sur la carte enregistrée quand la praticienne termine la séance. Trois séances seulement ont vu leur solde chargé.</p></div>
      <div class="note"><h3>Comptant et Interac</h3><p>Ce sont des rendez-vous saisis à la main. Le site n'encaisse rien : « encaissé » veut dire que quelqu'un a marqué le paiement reçu dans le tableau de bord.</p></div>
      <div class="note"><h3>Comptes en double</h3><p>Quatre clientes existent sous deux comptes — Brigitte Vaillancourt, Sara Hamraoui, Anne-Marie Gagnon et Maude Lafrenière. Les adresses en <em>@interne.invalid</em> sont générées pour les rendez-vous pris par téléphone.</p></div>
      <div class="note"><h3>Rendez-vous d'essai</h3><p>Onze rendez-vous appartiennent aux comptes de l'agence. Ils restent affichés en pâle pour que les totaux correspondent à la base, mais ce ne sont pas de vraies ventes.</p></div>
    </div>
  </section>

  <footer>Extrait de la base de production Supabase le 19 août 2026 · ${rows.length} rendez-vous, ${d.orphelins.length} réservations abandonnées · fuseau America/Toronto</footer>
</div>`

writeFileSync(process.argv[2], html, 'utf8')
console.log('OK — ' + html.length + ' octets')
