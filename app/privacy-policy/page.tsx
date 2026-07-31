import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Bharat Advance',
  description: 'Read our Privacy Policy to understand how Bharat Advance collects, uses, and protects your personal information.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy — Bharat Advance',
    description: 'How Bharat Advance handles your personal data and privacy.',
    url: '/privacy-policy',
  },
};

const COMPANY = 'Bharat Advance';
const COMPANY_EMAIL = 'bmnenterprises22@gmail.com';
const COMPANY_ADDRESS = 'Vijay Vihar Phase II, Vijay Vihar, Sector 4, Rohini, Delhi — 110085';
const EFFECTIVE_DATE = 'July 23, 2026';

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: `We collect information you provide directly when you use our services:

**Personal Identification Information:** Name, email address, phone number, and billing/shipping address when you place an order or contact us.

**Order & Transaction Data:** Product selections, quantities, payment method (we do not store card numbers — payments are processed by secure third-party providers), GST/PAN details you supply for invoicing, and order history.

**Usage Data:** Pages visited, time spent on pages, browser type, device type, IP address, and referral URLs — collected automatically via standard web server logs and analytics tools.

**Communication Data:** Messages, queries, or feedback you submit through our contact form or email.`,
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    content: `We use the information we collect for the following purposes:

- **Order Fulfilment:** Processing orders, issuing GST-compliant tax invoices, and arranging delivery.
- **Customer Support:** Responding to queries, resolving complaints, and providing after-sales assistance.
- **Business Communication:** Sending order confirmations, shipping updates, and important account notices.
- **Legal & Compliance:** Meeting our obligations under Indian law, including the Goods and Services Tax Act and the Information Technology Act, 2000.
- **Service Improvement:** Analysing usage patterns to improve our website, products, and user experience.
- **Marketing (opt-in only):** Sending promotional offers and newsletters — only if you have consented. You can opt out at any time.`,
  },
  {
    id: 'data-sharing',
    title: '3. How We Share Your Information',
    content: `We do not sell, rent, or trade your personal information. We share your data only in the following limited circumstances:

**Service Providers:** Trusted partners who assist us in operating our website, processing payments, and delivering orders (e.g. courier companies, payment gateways). These parties are contractually obligated to keep your information confidential.

**Legal Requirements:** When required by law, court order, or government authority under Indian law.

**Business Transfers:** In the event of a merger, acquisition, or sale of company assets, customer data may be transferred as part of that transaction. You will be notified in advance.

We never share your information with third parties for their own marketing purposes without your explicit consent.`,
  },
  {
    id: 'data-security',
    title: '4. Data Security',
    content: `We implement industry-standard technical and organisational measures to protect your personal data against unauthorised access, loss, misuse, or alteration:

- Encrypted data transmission (HTTPS/TLS) across our website.
- Secure database storage with access controls and row-level security policies.
- Payment card data is never stored on our servers — all transactions are handled by PCI-DSS compliant payment processors.
- Regular security reviews and access audits.

While we take every reasonable precaution, no method of transmission over the Internet is 100% secure. In the unlikely event of a data breach that affects your rights, we will notify you as required by applicable law.`,
  },
  {
    id: 'cookies',
    title: '5. Cookies & Tracking',
    content: `Our website uses cookies and similar technologies to enhance your experience:

**Essential Cookies:** Required for the website to function (e.g. session management, cart). Cannot be disabled.

**Analytics Cookies:** Help us understand how visitors interact with the website so we can improve it. These are anonymised and do not identify you personally.

**Preference Cookies:** Remember your settings (e.g. language, region) across visits.

You can control cookie settings through your browser preferences. Disabling non-essential cookies will not affect your ability to use the website, but some features may be less personalised.`,
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    content: `Under applicable Indian law and international best practice, you have the following rights regarding your personal data:

- **Access:** Request a copy of the personal information we hold about you.
- **Correction:** Request that we correct inaccurate or incomplete data.
- **Deletion:** Request deletion of your personal data, subject to our legal retention obligations.
- **Objection:** Object to the processing of your data for marketing purposes at any time.
- **Portability:** Request your data in a structured, machine-readable format.

To exercise any of these rights, please contact us at the details below. We will respond within 30 days.`,
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    content: `We retain your personal information for as long as necessary to fulfil the purposes described in this policy and to comply with our legal obligations:

- **Order & Invoice Data:** 7 years, as required by Indian GST and accounting regulations.
- **Contact & Support Queries:** 2 years from the date of last contact.
- **Website Analytics:** 13 months in aggregate form.

After the applicable retention period, data is securely deleted or anonymised.`,
  },
  {
    id: 'third-party-links',
    title: '8. Third-Party Links',
    content: `Our website may contain links to third-party websites (e.g. social media platforms, payment providers). This Privacy Policy applies only to our website. We are not responsible for the privacy practices of third-party sites and encourage you to review their policies before providing any personal information.`,
  },
  {
    id: 'children',
    title: '9. Children\'s Privacy',
    content: `Our services are not directed at children under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a child, please contact us immediately and we will delete it promptly.`,
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will update the "Last Updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of our services after changes are posted constitutes your acceptance of the revised policy.`,
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out to us:

**${COMPANY}**
${COMPANY_ADDRESS}

Email: ${COMPANY_EMAIL}

We are committed to resolving privacy concerns promptly and transparently.`,
  },
];

function renderContent(text: string) {
  return text.split('\n\n').map((para, i) => {
    if (para.startsWith('**') && para.split('\n').length === 1) {
      const parts = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-green-700/90 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: parts }} />;
    }
    const lines = para.split('\n').map((line, j) => {
      if (line.startsWith('- ')) {
        const html = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <li key={j} className="text-green-700/90 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <span key={j} className="block text-green-700/90 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
    });
    const hasBullets = para.split('\n').some(l => l.startsWith('- '));
    return hasBullets
      ? <ul key={i} className="list-disc list-inside space-y-1 pl-2">{lines}</ul>
      : <p key={i} className="text-green-700/90 leading-relaxed text-sm">{lines}</p>;
  });
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="pt-16">
        <div className="bg-green-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">
              <Link href="/" className="hover:text-green-300">Home</Link> / Privacy Policy
            </p>
            <h1 className="font-display text-5xl font-bold">Privacy Policy</h1>
            <p className="text-green-300/70 mt-3 max-w-xl">
              Your privacy matters to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-green-400 text-xs mt-4">Last Updated: {EFFECTIVE_DATE}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sticky TOC */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-green-100 p-5 sticky top-24">
              <h2 className="font-display text-sm font-bold text-green-900 uppercase tracking-wider mb-4">Contents</h2>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Intro box */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-10">
              <p className="text-green-700/90 text-sm leading-relaxed">
                This Privacy Policy describes how <strong>{COMPANY}</strong> ("we", "us", or "our") collects, uses,
                stores, and shares your personal information when you visit our website or use our services.
                By using our website, you agree to the terms of this policy. This policy is compliant with the
                <strong> Information Technology Act, 2000</strong> and applicable Indian data protection guidelines.
              </p>
            </div>

            <div className="space-y-10">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-2xl border border-green-100 p-7 scroll-mt-28"
                >
                  <h2 className="font-display text-xl font-bold text-green-900 mb-4 pb-3 border-b border-green-100">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {renderContent(section.content)}
                  </div>
                </section>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-10 bg-green-900 rounded-2xl p-8 text-center">
              <h3 className="font-display text-xl font-bold text-white mb-2">Questions About Your Privacy?</h3>
              <p className="text-green-300/80 text-sm mb-5">
                We take your privacy seriously. If you have any concerns, our team is here to help.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm"
              >
                Contact Us
              </Link>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}
