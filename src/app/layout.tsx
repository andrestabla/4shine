import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { AppDialogProvider } from "@/components/ui/AppDialogProvider";
import { BrandingProvider } from "@/context/BrandingContext";
import { loadServerBranding } from "@/lib/server-branding";
import { brandingCssVariables } from "@/lib/branding";
import { findBrandingFont } from "@/features/administracion/types";


const FALLBACK_APP_URL = "https://www.4shine.co";
const ALWAYS_PRELOADED_FONTS = ['Manrope', 'Outfit', 'Raleway', 'Urbanist', 'Montserrat'];

function resolveMetadataBase(): URL {
  const configured =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL;

  try {
    return new URL(configured);
  } catch {
    return new URL(FALLBACK_APP_URL);
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadServerBranding();
  const platformName = settings.platformName?.trim() || '4Shine';
  const faviconVersion = settings.updatedAt
    ? new Date(settings.updatedAt).getTime()
    : 0;

  return {
    title: platformName,
    description: 'Plataforma ejecutiva de liderazgo y mentoring',
    metadataBase: resolveMetadataBase(),
    icons: {
      icon: `/api/v1/public/favicon?v=${faviconVersion}`,
      shortcut: `/api/v1/public/favicon?v=${faviconVersion}`,
    },
    alternates: {
      canonical: '/',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, tokens } = await loadServerBranding();
  const cssVars = brandingCssVariables(tokens);
  const activeFont = findBrandingFont(settings.typography);

  const preloadedFamilies = Array.from(
    new Set([activeFont.value, ...ALWAYS_PRELOADED_FONTS]),
  )
    .map((name) => {
      const matched = findBrandingFont(name);
      return matched.googleFamily;
    })
    .join('&family=');

  const cssVarString = Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');

  return (
    <html
      lang="es"
      style={{ ...(cssVars as React.CSSProperties) }}
      data-brand-login-layout={tokens.layout.loginLayout}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${preloadedFamilies}&display=swap`}
        />
        <style
          // Re-aplica las variables como :root para que también ganen
          // sobre las defaults definidas en globals.css.
          dangerouslySetInnerHTML={{ __html: `:root { ${cssVarString} }` }}
        />
        {settings.customCss ? (
          <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
        ) : null}
      </head>
      <body
        suppressHydrationWarning={true}
        style={{ fontFamily: tokens.typography.cssStack }}
      >
        <BrandingProvider>
          <UserProvider>
            <AppDialogProvider>
              {children}
            </AppDialogProvider>
          </UserProvider>
        </BrandingProvider>

      </body>
    </html>
  );
}
