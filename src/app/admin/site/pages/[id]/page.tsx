import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getTemplate } from '@/lib/page-templates';
import { mergeWithDefaults } from '@/lib/page-content';
import PageEditor from './PageEditor';

export const dynamic = 'force-dynamic';

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.sitePage.findUnique({ where: { id } });
  if (!page) notFound();

  const template = getTemplate(page.template);
  const values = mergeWithDefaults(page.template, page.content);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/admin/site/pages"
          style={{ fontSize: '0.8rem', color: '#6B3FA0', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          ← Pages du site
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', margin: '8px 0 4px' }}>
          ✎ {page.title}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Modèle : <strong>{template?.label ?? page.template}</strong>
        </p>
      </div>

      {!template ? (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '16px', borderRadius: '8px' }}>
          Le modèle « {page.template} » de cette page est introuvable dans le code.
        </div>
      ) : (
        <PageEditor
          id={page.id}
          template={page.template}
          isSystem={page.isSystem}
          initialTitle={page.title}
          initialSlug={page.slug}
          initialMetaTitle={page.metaTitle ?? ''}
          initialMetaDescription={page.metaDescription ?? ''}
          initialValues={values}
        />
      )}
    </div>
  );
}
