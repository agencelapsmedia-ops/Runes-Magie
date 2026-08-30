import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getOrganisation, resoudreOrgId } from '@/lib/organizations';
import { rendreGabarit, type DonneesGabarit } from '@/lib/social-render';
import { GABARITS_VISUELS_CLES } from '@/lib/social-render/registry';
import { televerserRenduPng } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/social/render — { templateKey, format, donnees, organizationId }
 * Rend le gabarit aux couleurs de la marque, téléverse le PNG et retourne l'URL
 * publique (utilisable telle quelle dans les images d'une publication).
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const templateKey = typeof body.templateKey === 'string' ? body.templateKey : '';
  const format = typeof body.format === 'string' ? body.format : 'PORTRAIT';

  if (!GABARITS_VISUELS_CLES.includes(templateKey)) {
    return NextResponse.json({ error: 'Gabarit inconnu.' }, { status: 400 });
  }

  const donneesBrutes =
    typeof body.donnees === 'object' && body.donnees !== null ? (body.donnees as Record<string, unknown>) : {};
  const donnees: DonneesGabarit = {};
  for (const [cle, valeur] of Object.entries(donneesBrutes)) {
    if (typeof valeur === 'string' && /^[a-zA-Z]+$/.test(cle)) donnees[cle] = valeur.slice(0, 500);
  }

  const organizationId = await resoudreOrgId(body.organizationId);
  const org = await getOrganisation(organizationId);
  if (!org) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

  try {
    const rendu = await rendreGabarit(templateKey, format, donnees, org.charte, org.name);
    const url = await televerserRenduPng(rendu.png, organizationId, templateKey.toLowerCase());
    return NextResponse.json({ url, largeur: rendu.largeur, hauteur: rendu.hauteur });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Échec du rendu du visuel.' },
      { status: 502 },
    );
  }
}
