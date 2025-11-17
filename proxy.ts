/**
 * Next.js Proxy for security headers
 *
 * Adds security headers to all responses to protect against common web vulnerabilities.
 * Implements OWASP recommended security headers with nonce-based CSP.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/proxy | Next.js Proxy}
 * @see {@link https://owasp.org/www-project-secure-headers/ | OWASP Secure Headers}
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export default function proxy() {
  // Generate unique nonces for this request
  // Nonces allow specific inline scripts/styles while blocking all others
  const scriptNonce = randomBytes(16).toString('base64');
  const styleNonce = randomBytes(16).toString('base64');

  const response = NextResponse.next();

  // Pass nonces to Next.js so it can add them to inline scripts/styles
  response.headers.set('x-script-nonce', scriptNonce);
  response.headers.set('x-style-nonce', styleNonce);

  // Content Security Policy (CSP)
  // Helps prevent XSS attacks by controlling which resources can be loaded
  // Uses nonces instead of 'unsafe-inline' for better security
  // Next.js will automatically use these nonces for its hydration scripts and streaming styles
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${scriptNonce}'`, // Allow only nonce-tagged scripts
      `style-src 'self' 'nonce-${styleNonce}' https://fonts.googleapis.com`, // Allow nonce-tagged styles + Google Fonts CSS
      "img-src 'self' data: https: http:", // Allow external images (NFTs, avatars, IPFS)
      "font-src 'self' data: https://fonts.gstatic.com", // Allow Google Fonts
      "connect-src 'self' https: http:", // Allow API calls (including IPFS gateways)
      "frame-ancestors 'none'", // Prevent clickjacking
      "base-uri 'self'", // Restrict base URL
      "form-action 'self'", // Restrict form submissions
    ].join('; ')
  );

  // Prevent browsers from MIME-sniffing
  // Protects against drive-by download attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  // Prevents the site from being embedded in iframes
  response.headers.set('X-Frame-Options', 'DENY');

  // Controls how much referrer information is sent
  // Prevents leaking sensitive URLs to third parties
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  // Disables unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict-Transport-Security (HSTS)
  // Forces HTTPS connections (only applies in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// Configure which routes the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
