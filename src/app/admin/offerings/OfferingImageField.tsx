'use client';

import { useState } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';

/**
 * Pont entre ImageUploader (composant contrôlé, client) et le formulaire
 * server-action d'OfferingForm. L'URL retournée par l'upload Supabase est
 * stockée dans un <input type="hidden" name="imageUrl"> pour être soumise
 * nativement avec le reste du formulaire.
 */
export default function OfferingImageField({
  defaultValue = '',
}: {
  defaultValue?: string;
}) {
  const [imageUrl, setImageUrl] = useState(defaultValue);

  return (
    <div>
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <ImageUploader
        label="Image du service (carré, en haut de la carte)"
        value={imageUrl}
        onChange={(url) => setImageUrl(typeof url === 'string' ? url : url[0] ?? '')}
        folder="offerings"
      />
      <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '6px' }}>
        Optionnel — format carré recommandé (ex. 800×800 px). Si aucune image,
        l&apos;emoji / la rune s&apos;affiche à la place.
      </p>
    </div>
  );
}
