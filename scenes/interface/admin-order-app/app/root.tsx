import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { LayoutGroup, LazyMotion, domMax } from 'motion/react';
import type { Route } from './+types/root';
import './App.css';
import { clsx } from 'clsx';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Fuzzy+Bubbles:wght@400;700&display=swap',
  },
  {
    rel: 'preload',
    href: '/fonts/ShopifyInterBeta.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="font-sans"
      style={{ fontFamily: 'Shopify Inter, sans-serif' }}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Shopify</title>
        <Meta />
        <Links />
      </head>
      <body
        className={clsx(
          'flex h-dvh flex-col overflow-hidden overscroll-contain bg-[#0a0a0a] bg-radial-[closest-side] from-gray-900 to-[#0a0a0a] text-base text-primary antialiased',
        )}
      >
        <LazyMotion features={domMax}>
          <LayoutGroup>
            <div className="isolate flex h-full">{children}</div>
          </LayoutGroup>
        </LazyMotion>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Something went wrong.';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-white">
      <p>{message}</p>
    </main>
  );
}
