import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { withClient } from '@/server/db/pool';
import { getPublicCommunityPost } from '@/features/networking/service';
import { loadServerBranding } from '@/lib/server-branding';

interface PageParams {
  params: Promise<{ postId: string }>;
}

function excerpt(body: string, max = 180): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function normalizeUrl(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return null;
}

function getEmbeddedVideoUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;
    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes('youtu.be')) {
      const id = path.split('/').filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes('vimeo.com')) {
      const id = path.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { postId } = await params;
  const post = await withClient((client) => getPublicCommunityPost(client, postId));

  if (!post) return { title: 'Publicación no disponible', robots: { index: false, follow: false } };

  const { settings } = await loadServerBranding();
  const platformName = settings.platformName?.trim() || '4Shine';
  const description = excerpt(post.body);
  const rawOgImage =
    settings.faviconUrl?.trim() || settings.logoUrl?.trim() || '/branding/4shine-isotipo-amarillo.png';

  return {
    title: `${post.title} · ${platformName}`,
    description,
    alternates: { canonical: `/networking/publicacion/${post.postId}` },
    openGraph: {
      type: 'article',
      siteName: platformName,
      title: post.title,
      description,
      url: `/networking/publicacion/${post.postId}`,
      locale: 'es_CO',
      images: [{ url: rawOgImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [rawOgImage],
    },
  };
}

export default async function PublicCommunityPostPage({ params }: PageParams) {
  const { postId } = await params;
  const post = await withClient((client) => getPublicCommunityPost(client, postId));

  if (!post) notFound();

  const resourceUrl = normalizeUrl(post.resourceUrl);
  const embeddedVideo = resourceUrl ? getEmbeddedVideoUrl(resourceUrl) : null;
  const directVideo = resourceUrl && /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(resourceUrl) ? resourceUrl : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 md:px-6">
      <article className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="p-6">
          <span className="inline-flex items-center rounded-full bg-[#4f2360]/10 px-3 py-1 text-[11px] font-bold text-[#4f2360]">
            Comunidad {post.groupName}
          </span>

          <h1 className="mt-4 text-2xl font-black leading-tight text-[#1a1a1a] md:text-3xl">{post.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            {post.authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.authorAvatarUrl} alt={post.authorName} className="h-10 w-10 rounded-2xl object-cover" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-black text-white"
                style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}
              >
                {(post.authorName[0] ?? 'U').toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">{post.authorName}</p>
              <p className="text-xs text-black/50">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-black/70">{post.body}</p>
        </div>

        {resourceUrl && (
          <div className="border-t border-black/10 px-6 pb-6 pt-4">
            {directVideo ? (
              <video className="w-full rounded-xl border border-black/10" controls preload="metadata">
                <source src={directVideo} />
              </video>
            ) : embeddedVideo ? (
              <div className="overflow-hidden rounded-xl border border-black/10">
                <iframe
                  title={post.title}
                  src={embeddedVideo}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={resourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block truncate rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-[#4f2360] hover:bg-black/[0.02]"
              >
                {resourceUrl}
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-black/[0.02] px-6 py-4">
          <p className="text-xs text-black/50">
            {post.reactionCount} {post.reactionCount === 1 ? 'recomendación' : 'recomendaciones'} · {post.commentCount}{' '}
            {post.commentCount === 1 ? 'comentario' : 'comentarios'}
          </p>
          <Link
            href={`/dashboard/networking/comunidades/${post.groupId}?post=${post.postId}`}
            className="rounded-full bg-[#4f2360] px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            Ver en la comunidad
          </Link>
        </div>
      </article>

      <p className="mt-4 text-center text-xs text-black/50">
        Publicación compartida desde las comunidades de 4Shine.{' '}
        <Link href="/" className="font-semibold text-[#4f2360] hover:underline">
          Conoce la plataforma
        </Link>
      </p>
    </main>
  );
}
