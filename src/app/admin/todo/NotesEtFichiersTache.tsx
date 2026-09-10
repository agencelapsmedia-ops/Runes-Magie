'use client';

import { useEffect, useState } from 'react';
import { uploadFile } from '@/lib/supabase';

/**
 * Notes signées + fichiers joints d'une tâche to-do.
 *
 * Bloc autonome : il charge lui-même le détail de la tâche (`GET /api/admin/todos/[id]`)
 * et parle aux routes `[id]/notes` et `[id]/attachments`. Utilisé dans la fenêtre
 * « Modifier la tâche » de `/admin/todo` et dans la fiche rapide ouverte depuis le
 * kanban intégré à `/admin/lapsmedia` — même comportement aux deux endroits.
 */

export interface TodoNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}
export interface TodoAttachment {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

/**
 * Qui peut signer une note. Demande d'Annabelle (2026-09-10) : savoir d'un coup
 * d'œil si la note vient de Noctura ou d'Odalguir. Liste volontairement courte et
 * modifiable ici ; le dernier choix est mémorisé dans le navigateur.
 */
export const AUTEURS_NOTES = ['Noctura', 'Odalguir'];
const CLE_AUTEUR = 'todo-note-auteur';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  background: '#fff',
  color: '#1F2937',
  fontSize: '0.9rem',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotesEtFichiersTache({
  taskId,
  onChange,
}: {
  taskId: string;
  /** Appelé après chaque ajout/retrait, pour rafraîchir les compteurs 📝/📎 du parent. */
  onChange?: () => void;
}) {
  const [notes, setNotes] = useState<TodoNote[]>([]);
  const [attachments, setAttachments] = useState<TodoAttachment[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState<string>(AUTEURS_NOTES[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auteur mémorisé d'une visite à l'autre (chaque poste garde le sien).
  useEffect(() => {
    try {
      const memo = window.localStorage.getItem(CLE_AUTEUR);
      if (memo && AUTEURS_NOTES.includes(memo)) setNoteAuthor(memo);
    } catch { /* stockage indisponible : on garde le défaut */ }
  }, []);
  function choisirAuteur(nom: string) {
    setNoteAuthor(nom);
    try { window.localStorage.setItem(CLE_AUTEUR, nom); } catch { /* idem */ }
  }

  async function charger() {
    try {
      const res = await fetch(`/api/admin/todos/${taskId}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notes ?? []);
      setAttachments(data.attachments ?? []);
    } catch {
      /* non bloquant */
    }
  }
  useEffect(() => {
    setNotes([]); setAttachments([]); setNoteText(''); setError(null);
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `charger` ne dépend que de taskId
  }, [taskId]);

  async function apresChangement() {
    await charger();
    onChange?.();
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await fetch(`/api/admin/todos/${taskId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteText.trim(), author: noteAuthor }),
    });
    if (res.ok) {
      setNoteText('');
      await apresChangement();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Échec de l’ajout de la note.');
    }
  }

  async function removeNote(noteId: string) {
    await fetch(`/api/admin/todos/${taskId}/notes?noteId=${noteId}`, { method: 'DELETE' });
    await apresChangement();
  }

  async function addFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file, 'todo');
      const res = await fetch(`/api/admin/todos/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, url }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Échec de l’enregistrement du fichier.');
      }
      await apresChangement();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec du téléversement.');
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(attachmentId: string) {
    await fetch(`/api/admin/todos/${taskId}/attachments?attachmentId=${attachmentId}`, { method: 'DELETE' });
    await apresChangement();
  }

  return (
    <div>
      {/* Notes */}
      <p style={{ fontSize: '0.78rem', color: '#4B5563', fontWeight: 700, margin: '0 0 8px' }}>📝 Notes</p>
      {notes.length === 0 && <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '0 0 8px' }}>Aucune note pour l&apos;instant.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px', maxHeight: '180px', overflowY: 'auto' }}>
        {notes.map((n) => (
          <div key={n.id} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1F2937', whiteSpace: 'pre-line' }}>{n.content}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: '#9CA3AF' }}>
                {n.author && <span style={{ color: '#6B3FA0', fontWeight: 700 }}>{n.author} · </span>}
                {fmtDate(n.createdAt)}
              </p>
            </div>
            <button type="button" onClick={() => removeNote(n.id)} aria-label="Supprimer la note" style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      {/* Qui signe la note : menu déroulant, dernier choix mémorisé pour les prochaines. */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.72rem', color: '#6B7280' }}>
        Note ajoutée par
        <select
          value={noteAuthor}
          onChange={(e) => choisirAuteur(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600, color: '#6B3FA0' }}
        >
          {AUTEURS_NOTES.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          placeholder="Écrire une note…"
          style={{ ...inputStyle, resize: 'vertical', flex: 1 }}
        />
        <button type="button" onClick={addNote} disabled={!noteText.trim()} style={{ padding: '8px 14px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', opacity: noteText.trim() ? 1 : 0.5 }}>
          Ajouter
        </button>
      </div>

      {/* Fichiers */}
      <p style={{ fontSize: '0.78rem', color: '#4B5563', fontWeight: 700, margin: '16px 0 8px' }}>📎 Fichiers joints</p>
      {attachments.length === 0 && <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '0 0 8px' }}>Aucun fichier pour l&apos;instant.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        {attachments.map((a) => (
          <div key={a.id} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: '#6B3FA0', fontWeight: 600, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📄 {a.name}
            </a>
            <button type="button" onClick={() => removeFile(a.id)} aria-label="Retirer le fichier" style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <label style={{ display: 'inline-block', padding: '8px 14px', background: '#fff', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
        {uploading ? 'Téléversement…' : '📤 Joindre un fichier'}
        <input
          type="file"
          accept={ACCEPT}
          disabled={uploading}
          onChange={(e) => { addFile(e.target.files?.[0]); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
      </label>
      <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#9CA3AF' }}>Images, PDF, Word, Excel… (10 Mo max)</span>

      {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '10px 0 0' }}>{error}</p>}
    </div>
  );
}
