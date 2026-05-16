import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Restrict Referer header to same origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 1 year (only sent over HTTPS, safe to include)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

// SCORM serve proxy must be embeddable in our own iframe — omit X-Frame-Options
const scormServeHeaders = securityHeaders.filter(
  (h) => h.key !== "X-Frame-Options",
);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // SCORM content served by the proxy must be frameable by our own page
        source: "/api/v1/scorm/serve/:path*",
        headers: scormServeHeaders,
      },
      {
        // Apply security headers to all other routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
