/**
 * Téléversement Supabase Storage côté serveur (rendus de gabarits, vidéos).
 * Même bucket public `products` que la médiathèque (src/lib/supabase.ts) —
 * les URLs produites passent la validation SUPABASE_PUBLIC_URL_REGEX.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const BUCKET = 'products';

function client() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Téléverse un PNG rendu et retourne son URL publique. */
export async function televerserRenduPng(
  png: Buffer,
  organizationId: string,
  nom: string,
): Promise<string> {
  const supabase = client();
  const mois = new Date().toISOString().slice(0, 7); // AAAA-MM
  const nomSur = nom.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const chemin = `social/rendus/${organizationId}/${mois}/${Date.now()}-${nomSur}.png`;

  const { error } = await supabase.storage.from(BUCKET).upload(chemin, png, {
    cacheControl: '31536000',
    upsert: false,
    contentType: 'image/png',
  });
  if (error) throw new Error(`Échec du téléversement du visuel : ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
}
