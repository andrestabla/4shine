export type ProductGroup = 'discovery' | 'mentoring_pack' | 'program';

export interface ProductRecord {
  productCode: string;
  productGroup: ProductGroup;
  name: string;
  headline: string;
  description: string;
  priceAmount: number;
  currencyCode: string;
  sessionsIncluded: number;
  highlightLabel: string | null;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  checkoutUrl: string | null;
  checkoutType: 'payment' | 'whatsapp';
  ctaLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  productCode: string;
  productGroup: ProductGroup;
  name: string;
  headline?: string;
  description?: string;
  priceAmount: number;
  currencyCode?: string;
  sessionsIncluded?: number;
  highlightLabel?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  checkoutUrl?: string | null;
  checkoutType?: 'payment' | 'whatsapp';
  ctaLabel?: string | null;
}

export interface UpdateProductInput {
  productGroup?: ProductGroup;
  name?: string;
  headline?: string;
  description?: string;
  priceAmount?: number;
  currencyCode?: string;
  sessionsIncluded?: number;
  highlightLabel?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  checkoutUrl?: string | null;
  checkoutType?: 'payment' | 'whatsapp';
  ctaLabel?: string | null;
}
