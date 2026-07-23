import './globals.css';
import type { Metadata } from 'next';

const SITE_URL = 'https://bharat-advance.netlify.app';
const SITE_NAME = 'Bharat Advance';
const SITE_DESCRIPTION =
  'Bharat Advance — Your trusted partner for premium quality products. Shop electronics, home decor, fashion, and more with GST-compliant billing delivered across India.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Premium Quality Products`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Bharat Advance', 'premium products', 'online shopping India',
    'GST invoice', 'quality products', 'Delhi', 'e-commerce India',
    'BMN Enterprises',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Premium Quality Products`,
    description: SITE_DESCRIPTION,
    images: [{ url: '/bmn_logo.jpeg', width: 800, height: 800, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Premium Quality Products`,
    description: SITE_DESCRIPTION,
    images: ['/bmn_logo.jpeg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/bmn_logo.jpeg',
    apple: '/bmn_logo.jpeg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bharat Advance',
    url: 'https://bharat-advance.netlify.app',
    logo: 'https://bharat-advance.netlify.app/bmn_logo.jpeg',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9990188783',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Vijay Vihar Phase II, Vijay Vihar, Sector 4',
      addressLocality: 'Rohini',
      addressRegion: 'Delhi',
      postalCode: '110085',
      addressCountry: 'IN',
    },
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
