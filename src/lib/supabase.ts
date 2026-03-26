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
