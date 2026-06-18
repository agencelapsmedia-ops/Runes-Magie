import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'products';

/**
 * Upload an image to Supabase Storage
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, folder = 'general'): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Liste les images du stockage (médiathèque). Parcourt le bucket sur deux
 * niveaux de dossiers et retourne les URLs publiques, les plus récentes d'abord.
 */
export async function listImages(limit = 300): Promise<string[]> {
  const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
  const publicUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  type Entry = { name: string; updated: string };
  const found: Entry[] = [];

  const listFolder = async (prefix: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: 'updated_at', order: 'desc' },
    });
    if (error || !data) return;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      // Un dossier n'a pas de métadonnées de fichier.
      const isFolder = !item.id && !item.metadata;
      if (isFolder) {
        await listFolder(path);
      } else if (IMAGE_EXT.test(item.name)) {
        found.push({ name: path, updated: item.updated_at ?? item.created_at ?? '' });
      }
    }
  };

  await listFolder('');
  found.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  return found.slice(0, limit).map((e) => publicUrl(e.name));
}

/**
 * Delete an image from Supabase Storage
 * @param url The public URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  // Extract the path from the full URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/products/folder/filename.jpg
  const match = url.match(/\/storage\/v1\/object\/public\/products\/(.+)$/);
  if (!match) return;

  const path = match[1];
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error('Delete failed:', error.message);
  }
}
