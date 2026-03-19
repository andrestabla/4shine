import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import { AppDialogProvider } from '@/components/ui/AppDialogProvider';
import { BrandingProvider } from '@/context/BrandingContext';
const FALLBACK_APP_URL = 'https://www.4shine.co';

function resolveMetadataBase(): URL {
  const configured =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    FALLBACK_APP_URL;

  try {
    return new URL(configured);
  } catch {
    return new URL(FALLBACK_APP_URL);
  }
}

export const metadata: Metadata = {
  title: '4Shine Platform',
  description: 'Plataforma ejecutiva de liderazgo y mentoring',
  metadataBase: resolveMetadataBase(),
  icons: {
    icon: '/api/v1/public/favicon',
    shortcut: '/api/v1/public/favicon',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        <BrandingProvider>
          <UserProvider>
            <AppDialogProvider>{children}</AppDialogProvider>
          </UserProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
