import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from './ContactForm';

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
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="pt-16 bg-green-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">We&apos;d Love to Hear From You</p>
          <h1 className="font-display text-5xl font-bold text-white">Contact Us</h1>
          <p className="text-green-300/70 mt-3 max-w-xl mx-auto">
            Whether you have a question about a product, an order, or just want to say hello — we&apos;re here for you.
          </p>
        </div>
      </div>

      <ContactForm />

      <Footer />
    </>
  );
}
