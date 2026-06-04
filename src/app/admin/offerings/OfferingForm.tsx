import DeleteOfferingButton from './DeleteOfferingButton';
import SubmitButton from './SubmitButton';
import OfferingImageField from './OfferingImageField';
import RunePicker from './RunePicker';

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
}

interface OfferingFormProps {
  action: (formData: FormData) => void | Promise<void>;
  practitioners: Practitioner[];
  categories?: { id: string; name: string; depth: number }[];
  cancelHref: string;
  submitLabel: string;
  offeringId?: string;
  defaults?: {
    name?: string;
    type?: string;
    description?: string;
    longDescription?: string;
    durationMinutes?: number;
    capacity?: number;
    price?: number;
    priceForTwo?: number | null;
    pricePackage?: number | null;
    pricePackageMsrp?: number | null;
    numSessions?: number | null;
    emoji?: string;
    imageUrl?: string | null;
    categoryId?: string | null;
    sortOrder?: number;
    isFeatured?: boolean;
    isActive?: boolean;
    modes?: string[];
    primaryPractitionerId?: string;
    additionalPractitionerIds?: string[];
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: '#1F2937',
  background: '#FFFFFF',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
  fontFamily: 'var(--font-cinzel, serif)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function OfferingForm({
  action,
  practitioners,
  categories = [],
  cancelHref,
  submitLabel,
  offeringId,
  defaults = {},
}: OfferingFormProps) {
  const selectedIds = new Set<string>([
    ...(defaults.primaryPractitionerId ? [defaults.primaryPractitionerId] : []),
    ...(defaults.additionalPractitionerIds ?? []),
  ]);
  const modes = new Set<string>(defaults.modes ?? ['IN_PERSON']);

  return (
    <form
      action={action}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '32px',
        display: 'grid',
        gap: '20px',
        maxWidth: '780px',
      }}
    >
      {/* Nom */}
      <div>
        <label style={labelStyle} htmlFor="name">Nom du service *</label>
        <input id="name" name="name" type="text" required defaultValue={defaults.name ?? ''} style={inputStyle} placeholder="Ex: Le Soin Rituel" />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle} htmlFor="description">Description courte</label>
        <textarea id="description" name="description" rows={3} defaultValue={defaults.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="longDescription">Description longue (page détail)</label>
        <textarea id="longDescription" name="longDescription" rows={5} defaultValue={defaults.longDescription ?? ''} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Catégorie (pilote les sliders de l'accueil) */}
      <div>
        <label style={labelStyle} htmlFor="categoryId">Catégorie</label>
        <select id="categoryId" name="categoryId" defaultValue={defaults.categoryId ?? ''} style={inputStyle}>
          <option value="">— Aucune catégorie —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.depth > 0 ? '  ↳ ' : ''}{c.name}</option>
          ))}
        </select>
        <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
          Gérées dans Services → Catégories de services. Détermine dans quel slider de l&apos;accueil le service apparaît.
        </p>
      </div>

      {/* Image du service (carte + page détail) */}
      <OfferingImageField defaultValue={defaults.imageUrl ?? ''} />

      {/* Praticien·ne·s — multi-select */}
      <div>
        <label style={labelStyle}>Praticien·ne·s qui offrent ce service *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: '12px', background: '#F9FAFB', borderRadius: '6px' }}>
          {practitioners.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#1F2937', fontWeight: 500 }}>
              <input
                type="checkbox"
                name="practitionerIds"
                value={p.id}
                defaultChecked={selectedIds.has(p.id)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#1F2937' }}>{p.firstName}{p.lastName ? ` ${p.lastName}` : ''}</span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
          Le premier coché sera le « propriétaire » du service. Les autres seront listés comme alternatives.
        </p>
      </div>

      {/* Modes */}
      <div>
        <label style={labelStyle}>Modes de prestation *</label>
        <div style={{ display: 'flex', gap: '20px', padding: '12px', background: '#F9FAFB', borderRadius: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1F2937', fontWeight: 500 }}>
            <input type="checkbox" name="modeInPerson" defaultChecked={modes.has('IN_PERSON')} style={{ width: '18px', height: '18px' }} />
            <span style={{ color: '#1F2937' }}>Présentiel</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1F2937', fontWeight: 500 }}>
            <input type="checkbox" name="modeVirtual" defaultChecked={modes.has('VIRTUAL')} style={{ width: '18px', height: '18px' }} />
            <span style={{ color: '#1F2937' }}>Virtuel (Zoom/Daily.co)</span>
          </label>
        </div>
      </div>

      {/* Prix */}
      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '16px' }}>
        <p style={{ ...labelStyle, marginTop: 0 }}>Tarifs ($ CAD)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }} htmlFor="price">Prix par personne *</label>
            <input id="price" name="price" type="number" step="0.01" min={0} required defaultValue={defaults.price ?? ''} style={inputStyle} placeholder="89.99" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }} htmlFor="priceForTwo">Prix pour 2 personnes (optionnel)</label>
            <input id="priceForTwo" name="priceForTwo" type="number" step="0.01" min={0} defaultValue={defaults.priceForTwo ?? ''} style={inputStyle} placeholder="149.99" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }} htmlFor="numSessions">Nombre de séances dans forfait</label>
            <input id="numSessions" name="numSessions" type="number" min={0} defaultValue={defaults.numSessions ?? ''} style={inputStyle} placeholder="20" />
          </div>
          <div></div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }} htmlFor="pricePackage">Prix du forfait complet</label>
            <input id="pricePackage" name="pricePackage" type="number" step="0.01" min={0} defaultValue={defaults.pricePackage ?? ''} style={inputStyle} placeholder="1499" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }} htmlFor="pricePackageMsrp">Valeur du forfait (avant rabais)</label>
            <input id="pricePackageMsrp" name="pricePackageMsrp" type="number" step="0.01" min={0} defaultValue={defaults.pricePackageMsrp ?? ''} style={inputStyle} placeholder="1799.80" />
          </div>
        </div>
      </div>

      {/* Durée + capacité */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="durationMinutes">Durée (min) *</label>
          <input id="durationMinutes" name="durationMinutes" type="number" min={15} required defaultValue={defaults.durationMinutes ?? 60} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="capacity">Capacité (places)</label>
          <input id="capacity" name="capacity" type="number" min={1} defaultValue={defaults.capacity ?? 1} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sortOrder">Ordre d&apos;affichage</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={defaults.sortOrder ?? 0} style={inputStyle} />
        </div>
      </div>

      {/* Emoji / Rune — sélecteur visuel des 24 runes */}
      <div>
        <label style={labelStyle}>Emoji / Rune (icône du service)</label>
        <RunePicker defaultValue={defaults.emoji ?? '*'} />
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1F2937', fontWeight: 500 }}>
          <input type="checkbox" name="isFeatured" defaultChecked={defaults.isFeatured ?? false} style={{ width: '18px', height: '18px' }} />
          <span style={{ color: '#1F2937' }}>À la une (vedette sur la homepage)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1F2937', fontWeight: 500 }}>
          <input type="checkbox" name="isActive" defaultChecked={defaults.isActive ?? true} style={{ width: '18px', height: '18px' }} />
          <span style={{ color: '#1F2937' }}>Service actif (visible publiquement)</span>
        </label>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
        <div>
          {offeringId && <DeleteOfferingButton offeringId={offeringId} />}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href={cancelHref} style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)' }}>
            Annuler
          </a>
          <SubmitButton label={submitLabel} />
        </div>
      </div>
    </form>
  );
}
