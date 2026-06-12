import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { BlockRenderer } from '@/components/site-builder/BlockRenderer';
import { getPublicPageBySlug } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);
  if (!page || !page.isVisible) return {};
  return {
    title: page.seo.metaTitle || page.title,
    description: page.seo.metaDescription || undefined,
  };
}

export default async function BuilderPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);

  if (!page || !page.isVisible || !page.useBuilder || page.sections.length === 0) {
    notFound();
  }

  return (
    <MarketingShell>
      <BlockRenderer sections={page.sections} />
    </MarketingShell>
  );
}
