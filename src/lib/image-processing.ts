/**
 * Traitement d'image côté navigateur — redimensionnement, recadrage, compression.
 *
 * ⚠️ MODULE NAVIGATEUR UNIQUEMENT. Ne jamais l'importer depuis un composant
 * serveur ni depuis une route API : `createImageBitmap`, `document` et
 * `canvas` n'existent pas dans Node.
 *
 * Pourquoi il existe : la photo de profil d'un membre part directement du
 * navigateur vers Supabase Storage. Sans traitement, une photo prise au
 * téléphone (4 à 12 Mo, 4000 × 3000) serait stockée telle quelle et
 * rechargée à chaque affichage d'un avatar de 40 px. Ici l'image est
 * ramenée à 512 px, convertie en WebP et plafonnée à 200 Ko avant de
 * quitter l'appareil.
 *
 * Aucune dépendance : tout passe par les API natives du navigateur.
 */

/** Refus net au-delà de cette taille, avant même de tenter le décodage. */
export const TAILLE_MAX_ENTREE = 10 * 1024 * 1024; // 10 Mo

export interface OptionsTraitement {
  /** largeur / hauteur. 1 = carré. null = conserve les proportions d'origine. */
  ratio?: number | null;
  /** Plus grand côté de l'image produite. Jamais d'agrandissement. */
  maxCote?: number;
  /** Poids visé en octets. La qualité baisse jusqu'à l'atteindre. */
  poidsCible?: number;
  qualiteDepart?: number;
  qualiteMin?: number;
  /** Nom de base du fichier produit (sans extension). */
  nom?: string;
}

export interface ResultatTraitement {
  file: File;
  largeur: number;
  hauteur: number;
  octets: number;
  type: string;
  /** Poids du fichier d'origine — sert à afficher « 2,4 Mo → 84 Ko ». */
  octetsOrigine: number;
}

/** « 84 Ko », « 2,4 Mo » — format québécois, virgule décimale. */
export function formatPoids(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * Le navigateur sait-il *encoder* en WebP ? Safari a longtemps su le lire
 * sans savoir l'écrire — `toDataURL` retombe alors silencieusement sur PNG,
 * ce qui produirait des fichiers bien plus lourds que prévu.
 */
function encodeWebp(canvas: HTMLCanvasElement): boolean {
  try {
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function versBlob(canvas: HTMLCanvasElement, type: string, qualite: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encodage de l’image impossible.'))),
      type,
      qualite,
    );
  });
}

/**
 * Prépare une image pour le téléversement : recadre, redimensionne, compresse.
 *
 * @throws Si le fichier dépasse `TAILLE_MAX_ENTREE`, n'est pas une image, ou
 *         si son format n'est pas décodable par le navigateur (HEIC sur
 *         certains appareils). Les messages sont destinés à l'utilisateur.
 */
export async function traiterImage(
  source: File,
  options: OptionsTraitement = {},
): Promise<ResultatTraitement> {
  const {
    ratio = null,
    maxCote = 512,
    poidsCible = 200_000,
    qualiteDepart = 0.85,
    qualiteMin = 0.5,
    nom = 'image',
  } = options;

  if (!source.type.startsWith('image/')) {
    throw new Error('Ce fichier n’est pas une image. Choisis une photo (JPG, PNG ou WebP).');
  }
  // Garde-fou d'entrée : décoder une photo de 40 Mpx fait geler un téléphone
  // d'entrée de gamme. Mieux vaut refuser tout de suite, et le dire.
  if (source.size > TAILLE_MAX_ENTREE) {
    throw new Error(
      `Cette photo fait ${formatPoids(source.size)}. Choisis-en une plus légère (10 Mo maximum), ` +
        'ou prends-la directement avec ton téléphone.',
    );
  }

  // `imageOrientation: 'from-image'` applique l'orientation EXIF : sans elle,
  // les photos prises à la verticale arrivent couchées.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(
      'Ce format d’image n’est pas pris en charge par ton navigateur. Essaie en JPG, PNG ou WebP.',
    );
  }

  try {
    // ── Recadrage centré au ratio demandé (fenêtre lue dans l'image source) ──
    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;
    if (ratio) {
      const actuel = sw / sh;
      if (actuel > ratio) {
        sw = Math.round(sh * ratio);
        sx = Math.round((bitmap.width - sw) / 2);
      } else if (actuel < ratio) {
        sh = Math.round(sw / ratio);
        sy = Math.round((bitmap.height - sh) / 2);
      }
    }

    let cote = maxCote;
    let blob: Blob | null = null;
    let dw = 0;
    let dh = 0;
    let type = 'image/webp';

    // Jusqu'à 3 passes : si la qualité minimale ne suffit pas à atteindre le
    // poids visé, on réduit les dimensions plutôt que de livrer une bouillie.
    for (let passe = 0; passe < 3; passe += 1) {
      const echelle = Math.min(1, cote / Math.max(sw, sh));
      dw = Math.max(1, Math.round(sw * echelle));
      dh = Math.max(1, Math.round(sh * echelle));

      const canvas = document.createElement('canvas');
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Ton navigateur ne permet pas de traiter les images.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // Aplat de fond : sans lui, les PNG transparents virent au noir une
      // fois aplatis en JPEG/WebP opaque.
      ctx.fillStyle = '#0A0A12';
      ctx.fillRect(0, 0, dw, dh);
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);

      type = encodeWebp(canvas) ? 'image/webp' : 'image/jpeg';

      let qualite = qualiteDepart;
      blob = await versBlob(canvas, type, qualite);
      while (blob.size > poidsCible && qualite > qualiteMin) {
        qualite = Math.round((qualite - 0.1) * 100) / 100;
        blob = await versBlob(canvas, type, qualite);
      }

      if (blob.size <= poidsCible) break;
      cote = Math.round(cote * 0.8);
    }

    if (!blob) throw new Error('Encodage de l’image impossible.');

    const ext = type === 'image/webp' ? 'webp' : 'jpg';
    return {
      file: new File([blob], `${nom}.${ext}`, { type }),
      largeur: dw,
      hauteur: dh,
      octets: blob.size,
      type,
      octetsOrigine: source.size,
    };
  } finally {
    bitmap.close();
  }
}
