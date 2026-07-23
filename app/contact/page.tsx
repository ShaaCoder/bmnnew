import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us — Get in Touch',
  description: 'Have a question or need help? Contact Bharat Advance by phone, email, or our contact form. Based in Delhi — serving all of India.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Us — Bharat Advance',
    description: 'Reach out to us for product queries, order support, or business enquiries.',
    url: '/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
