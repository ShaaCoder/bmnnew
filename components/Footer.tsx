import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Youtube,
  Globe,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default async function Footer() {
  const { data: settings } = await supabase.from('company_settings').select('*').maybeSingle();
  const companyName = settings?.company_name || 'Bharat Advance';
  const address = settings?.address || '123 Business Avenue, Commercial District, City — 400001';
  const phone = settings?.phone || '+91 98765 43210';
  const email = settings?.email || 'info@bharatadvance.com';
  const logoUrl = settings?.logo_url || '/bmn_logo.jpeg';
const socialLinks = {
  indiaMart: 'https://www.indiamart.com/bmnenterprises-newdelhi/',
  youtube: 'https://www.youtube.com/@BMNENTERPRISES',
  google: 'https://share.google/4eVadrdCg29ARuHSA',
  instagram: 'https://www.instagram.com/nitin__rathore_0987',
};

const businessPhone = '9582139182';
const businessEmail = 'bharatadvance96@gmail.com';
  return (
    <footer className="bg-green-950 text-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src={logoUrl} alt={companyName} width={44} height={44} className="rounded-full object-cover" unoptimized />
              <span className="font-display font-bold text-white text-xl">{companyName}</span>
            </Link>
            <p className="text-green-300 text-sm leading-relaxed max-w-xs">
              Your trusted partner for quality products. We bring the best of every category right to your doorstep.
            </p>
           <div className="flex flex-wrap gap-3 mt-6">

  <a
    href={socialLinks.indiaMart}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-full bg-green-900 hover:bg-green-600 flex items-center justify-center transition"
    title="IndiaMART"
  >
    <Globe className="w-5 h-5" />
  </a>

  <a
    href={socialLinks.youtube}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-full bg-green-900 hover:bg-red-600 flex items-center justify-center transition"
    title="YouTube"
  >
    <Youtube className="w-5 h-5" />
  </a>

  <a
    href={socialLinks.instagram}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-full bg-green-900 hover:bg-pink-600 flex items-center justify-center transition"
    title="Instagram"
  >
    <Instagram className="w-5 h-5" />
  </a>

  <a
    href={socialLinks.google}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-full bg-green-900 hover:bg-yellow-500 flex items-center justify-center transition"
    title="Google Business"
  >
    <Star className="w-5 h-5" />
  </a>

</div>
          </div>

          <div>
            <h4 className="font-display text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-green-300 hover:text-green-400 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-green-300">
                <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-green-300">
                <Phone className="w-4 h-4 text-green-500 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-green-400 transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2 text-sm text-green-300">
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-green-400 transition-colors">{email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-green-400">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-green-700 text-xs">&middot;</span>
            <Link href="/admin" className="text-xs text-green-500 hover:text-green-300 transition-colors">
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
