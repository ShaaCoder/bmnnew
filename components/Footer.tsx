import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-green-950 text-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/bmn_logo.jpeg" alt="Bharat Advance" width={44} height={44} className="rounded-full object-cover" />
              <span className="font-display font-bold text-white text-xl">Bharat Advance</span>
            </Link>
            <p className="text-green-300 text-sm leading-relaxed max-w-xs">
              Your trusted partner for quality products. We bring the best of every category right to your doorstep.
            </p>
            <div className="flex gap-4 mt-6">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <div key={i} className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center hover:bg-green-600 cursor-pointer transition-colors duration-200">
                  <Icon className="w-4 h-4" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                { href: '/gallery', label: 'Gallery' },
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
                <span>123 Business Avenue, Commercial District, City - 400001</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-green-300">
                <Phone className="w-4 h-4 text-green-500 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-green-300">
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <span>info@bharatadvance.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-green-400">
            &copy; {new Date().getFullYear()} Bharat Advance. All rights reserved.
          </p>
          <Link href="/admin" className="text-xs text-green-500 hover:text-green-300 transition-colors">
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
