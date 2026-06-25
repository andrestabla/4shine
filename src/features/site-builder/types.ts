export type SiteBlockType =
  | 'section'
  | 'hero'
  | 'stats'
  | 'richText'
  | 'textColumns'
  | 'imageText'
  | 'cards'
  | 'features'
  | 'steps'
  | 'testimonials'
  | 'quote'
  | 'team'
  | 'advisors'
  | 'logos'
  | 'gallery'
  | 'pricing'
  | 'faq'
  | 'cta'
  | 'banner'
  | 'video'
  | 'image'
  | 'html'
  | 'divider'
  | 'spacer';

export type SiteBlockProps = Record<string, unknown>;

export interface SiteBlock {
  blockId: string;
  type: SiteBlockType;
  isVisible: boolean;
  props: SiteBlockProps;
}

/** Columna dentro de un bloque 'section' (modelo Sección > Columna > Widget). */
export interface SiteColumn {
  columnId: string;
  blocks: SiteBlock[];
}

export interface SitePageSeo {
  metaTitle?: string;
  metaDescription?: string;
}

export interface SitePage {
  pageId: string;
  pageKey: string;
  title: string;
  slug: string;
  navLabel: string;
  showInNav: boolean;
  navOrder: number;
  isVisible: boolean;
  isSystem: boolean;
  useBuilder: boolean;
  sections: SiteBlock[];
  seo: SitePageSeo;
  createdAt: string;
  updatedAt: string;
}

export interface SitePageSummary {
  pageId: string;
  pageKey: string;
  title: string;
  slug: string;
  navLabel: string;
  showInNav: boolean;
  navOrder: number;
  isVisible: boolean;
  isSystem: boolean;
  useBuilder: boolean;
  sectionsCount: number;
  updatedAt: string;
}

export interface CreateSitePageInput {
  title: string;
  slug: string;
  navLabel?: string;
  showInNav?: boolean;
  isVisible?: boolean;
}

export interface UpdateSitePageInput {
  title?: string;
  slug?: string;
  navLabel?: string;
  showInNav?: boolean;
  navOrder?: number;
  isVisible?: boolean;
  useBuilder?: boolean;
  sections?: SiteBlock[];
  seo?: SitePageSeo;
}
