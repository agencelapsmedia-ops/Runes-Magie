'use client';

/**
 * Visionneuse PDF protégée (module Formations) :
 *  - rendu page par page en <canvas> via pdf.js (aucun lien vers le fichier) ;
 *  - filigrane personnalisé superposé sur chaque page ;
 *  - sélection de texte, clic droit et copier-coller désactivés dans la zone.
 * Rappel : la sécurité RÉELLE est la route API (session + cours complété) —
 * ces protections frontend ne font que décourager la redistribution.
 */
import { useEffect, useRef, useState } from 'react';

export default function ProtectedPdfViewer({ docId, watermark }: { docId: string; watermark: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const res = await fetch(`/api/membre/formations/document/${docId}`);
        if (!res.ok) throw new Error('fetch');
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const width = Math.min(container.clientWidth || 800, 900);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * (window.devicePixelRatio > 1 ? 1.5 : 1);
          const viewport = page.getViewport({ scale });

          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;margin:0 auto 20px;box-shadow:0 4px 24px rgba(0,0,0,0.4);line-height:0;';
          wrap.style.width = `${viewport.width / (window.devicePixelRatio > 1 ? 1.5 : 1)}px`;
          wrap.style.maxWidth = '100%';

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.cssText = 'width:100%;height:auto;display:block;';
          wrap.appendChild(canvas);

          // Filigrane superposé (répété en diagonale, discret mais dissuasif)
          const wm = document.createElement('div');
          wm.style.cssText =
            'position:absolute;inset:0;display:flex;flex-wrap:wrap;align-content:space-around;justify-content:space-around;overflow:hidden;pointer-events:none;';
          for (let k = 0; k < 6; k++) {
            const span = document.createElement('span');
            span.textContent = watermark;
            span.style.cssText =
              'transform:rotate(-28deg);font-family:Georgia,serif;font-size:15px;color:rgba(74,45,122,0.16);white-space:nowrap;padding:30px;';
            wm.appendChild(span);
          }
          wrap.appendChild(wm);
          container.appendChild(wrap);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        }
        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    render();
    return () => { cancelled = true; };
  }, [docId, watermark]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {status === 'loading' && (
        <p className="text-[0.85rem] text-parchemin/60">Ouverture du document…</p>
      )}
      {status === 'error' && (
        <p className="text-[0.85rem]" style={{ color: '#f87171' }}>
          Impossible d’ouvrir le document. Réessaie, ou écris-nous à info@runesetmagie.ca.
        </p>
      )}
      <div ref={containerRef} />
      {status === 'ready' && pageCount > 0 && (
        <p className="mt-2 text-center text-[0.72rem] text-parchemin/40">
          {pageCount} page{pageCount > 1 ? 's' : ''} · Document protégé — consultation seulement.
        </p>
      )}
    </div>
  );
}
