/**
 * Next.js Middleware for security headers
 *
 * Adds security headers to all responses to protect against common web vulnerabilities.
 * Implements OWASP recommended security headers with nonce-based CSP.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/middleware | Next.js Middleware}
 * @see {@link https://owasp.org/www-project-secure-headers/ | OWASP Secure Headers}
 */

import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Content Security Policy (CSP)
  // Next.js will apply this nonce to its own inline scripts/styles.
  // Inline style attributes (e.g., from next/image) cannot carry nonces, so allow unsafe-inline for styles.
  const styleSrc = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com http://fonts.googleapis.com";

  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: https: http:",
    "font-src 'self' https://fonts.gstatic.com http://fonts.gstatic.com data:",
    "connect-src 'self' https: http:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

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

// Support default export for Next.js proxy convention.
export default middleware;

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
