'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_FOOTER_LINKS, type MenuLink } from '@/lib/menu-defaults';

/**
 * Colonne « Navigation » du pied de page, alimentée par le menu géré
 * dans l'admin (/api/menu, location FOOTER). Repli sur les liens par
 * défaut si la base est indisponible.
 */
export default function FooterNav() {
  const [links, setLinks] = useState<MenuLink[]>(DEFAULT_FOOTER_LINKS);

  useEffect(() => {
    let active = true;
    fetch('/api/menu')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.footer)) setLinks(data.footer);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <ul className="flex flex-col gap-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            target={link.openInNewTab ? '_blank' : undefined}
            rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
            className="font-cormorant text-base text-parchemin/60 transition-colors duration-300 hover:text-turquoise-cristal"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
