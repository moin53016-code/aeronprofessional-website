
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AERON PROFESSIONAL | Salon-Grade Styling Tools',
  description:
    'Discover premium professional hair dryers, straighteners, curling tools and salon essentials by AERON PROFESSIONAL.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
