import { prisma } from '@/lib/db';
import {
  DEFAULT_HEADER_LINKS,
  DEFAULT_FOOTER_LINKS,
  type MenuLink,
} from '@/lib/menu-defaults';

export interface MenuPayload {
  header: MenuLink[];
  footer: MenuLink[];
}

/**
 * Menu visible, groupé par emplacement, pour la navbar et le footer.
 *
 * Repli de sécurité : si une location n'a AUCUN item en base (non semée
 * ou table absente), on renvoie les liens par défaut — pour ne jamais
 * afficher de menu vide en production. En revanche, si des items existent
 * mais sont tous masqués, on respecte ce choix (liste vide).
 */
export async function getVisibleMenu(): Promise<MenuPayload> {
  try {
    const all = await prisma.menuItem.findMany({
      orderBy: [{ sortOrder: 'asc' }],
    });

    const toLinks = (items: typeof all): MenuLink[] =>
      items
        .filter((i) => i.isVisible)
        .map((i) => ({ label: i.label, href: i.href, openInNewTab: i.openInNewTab }));

    const headerAll = all.filter((i) => i.location === 'HEADER');
    const footerAll = all.filter((i) => i.location === 'FOOTER');

    return {
      header: headerAll.length === 0 ? DEFAULT_HEADER_LINKS : toLinks(headerAll),
      footer: footerAll.length === 0 ? DEFAULT_FOOTER_LINKS : toLinks(footerAll),
    };
  } catch {
    // En cas d'erreur base, on garde le site navigable avec les liens par défaut.
    return { header: DEFAULT_HEADER_LINKS, footer: DEFAULT_FOOTER_LINKS };
  }
}
