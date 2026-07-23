import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bharat Advance — Premium Products',
  description: 'Bharat Advance — Your trusted partner for quality products.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
