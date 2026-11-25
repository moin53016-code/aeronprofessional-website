
import type { Metadata, Viewport } from 'next';
import './globals.css';

// GLOBAL WEBSITE METADATA

export const metadata: Metadata = {
  title: {
    default:
      'AERON PROFESSIONAL',

    template:
      '%s | AERON PROFESSIONAL',
  },

  description:
    'Discover professional-inspired hair dryers, straighteners, trimming tools and salon styling essentials from AERON PROFESSIONAL.',

  applicationName:
    'AERON PROFESSIONAL',

  // GLOBAL WEBSITE ICONS

  icons: {
    icon: [
      {
        url: '/aeron-favicon.ico?v=2',
        type: 'image/x-icon',
        sizes: '16x16 32x32 48x48',
      },
      {
        url: '/aeron-icon.png?v=2',
        type: 'image/png',
        sizes: '512x512',
      },
    ],

    shortcut: [
      {
        url: '/aeron-favicon.ico?v=2',
        type: 'image/x-icon',
      },
    ],

    apple: [
      {
        url: '/aeron-apple-icon.png?v=2',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

// GLOBAL VIEWPORT CONFIGURATION

export const viewport: Viewport = {
  width: 'device-width',

  initialScale: 1,

  themeColor: '#171717',
};

// ROOT WEBSITE LAYOUT

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {children}
      </body>
    </html>
  );
}
