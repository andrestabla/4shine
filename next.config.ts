import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Restrict Referer header to same origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by the app
  // microphone=(self) habilita getUserMedia({audio:true}) en 4shine.co para
  // los workbooks con grabación de voz. camera/geolocation/payment quedan
  // desactivados por seguridad hasta que algún módulo los necesite.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=()",
  },
  // Force HTTPS for 1 year (only sent over HTTPS, safe to include)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // CSP en modo REPORTE: no bloquea nada todavía, solo registra en la consola
  // del navegador lo que incumpliría la política. Es el paso previo obligado
  // antes de aplicarla de verdad: la plataforma usa estilos en línea, Google
  // Fonts, R2, Pusher y OpenAI, y una CSP estricta de golpe rompería media
  // interfaz. Cuando los informes salgan limpios, se cambia la cabecera a
  // "Content-Security-Policy" y empieza a bloquear.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // 'unsafe-inline'/'unsafe-eval' son necesarios hoy por Next y los estilos
      // en línea; el objetivo a medio plazo es sustituirlos por nonces.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss:",
      // Los paquetes SCORM se embeben desde el propio origen.
      "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // No anunciar el framework: facilita dirigir exploits de versión.
  poweredByHeader: false,
  async redirects() {
    return [
      // La página de afiliados/advisers vive ahora en /advisers
      { source: "/afiliados", destination: "/advisers", permanent: true },
      // Rutas directas a cada pestaña de Planes y precios (deep-link por ancla).
      { source: "/planes-precios-diagnostico", destination: "/planes-precios#diagnostico", permanent: false },
      { source: "/planes-precios-programas", destination: "/planes-precios#programas", permanent: false },
      { source: "/planes-precios-mentorias", destination: "/planes-precios#mentorias", permanent: false },
      { source: "/planes-precios-circulo", destination: "/planes-precios#circulo", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes first
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // SCORM serve proxy: override X-Frame-Options so our own iframe can embed it.
        // This rule runs after the catch-all so SAMEORIGIN overwrites DENY for this path.
        source: "/api/v1/scorm/serve/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
