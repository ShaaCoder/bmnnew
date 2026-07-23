import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award, Target, Eye, Users, ArrowRight, Building2,
  Phone, Mail, MapPin, Linkedin, ShieldCheck, Star,
} from 'lucide-react';
import type { TeamMember, Certificate, CompanySettings } from '@/lib/supabase';

export const revalidate = 0;

export default async function AboutPage() {
  const [
    { data: teamRaw },
    { data: certsRaw },
    { data: contentRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    supabase.from('team_members').select('*').order('display_order'),
    supabase.from('certificates').select('*').order('display_order'),
    supabase.from('about_content').select('*'),
    supabase.from('company_settings').select('*').single(),
  ]);

  const team: TeamMember[] = teamRaw || [];
  const certs: Certificate[] = certsRaw || [];
  const settings: CompanySettings | null = settingsRaw || null;

  const content: Record<string, string> = {};
  (contentRaw || []).forEach((row: { key: string; value: string }) => {
    content[row.key] = row.value;
  });

  const companyName = settings?.company_name || 'Bharat Advance';
  const companyAddress = settings?.address || '';
  const companyPhone = settings?.phone || '';
  const companyEmail = settings?.email || '';
  const logoUrl = settings?.logo_url || '/bmn_logo.jpeg';

  const stats = [
    { label: 'Years in Business', value: '5+' },
    { label: 'Happy Customers', value: '10,000+' },
    { label: 'Products Delivered', value: '50,000+' },
    { label: 'Cities Served', value: '100+' },
  ];

  const values = [
    { icon: ShieldCheck, title: 'Integrity', desc: 'Honest pricing, transparent dealings, and genuine products — every single time.' },
    { icon: Star, title: 'Quality', desc: 'We curate only the best, with each product passing our rigorous quality standard.' },
    { icon: Users, title: 'Customer First', desc: 'Every decision we make is guided by what serves our customers best.' },
    { icon: Award, title: 'Excellence', desc: 'We don\'t settle for good enough. We pursue excellence in everything we do.' },
  ];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-green-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/60 via-green-950/80 to-green-950" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
            <Building2 className="w-3.5 h-3.5" />
            Who We Are
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            About{' '}
            <span className="text-green-400">{companyName}</span>
          </h1>
          <p className="text-green-100/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            {content.story || 'A trusted name in quality products, built with passion and dedication from the heart of India.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-green-900/40"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 backdrop-blur-sm text-sm"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white font-display">{value}</div>
                <div className="text-green-300 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            <div className="bg-green-50 rounded-3xl p-8 md:p-10 border border-green-100 flex flex-col">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="font-display text-2xl font-bold text-green-900 mb-4">Our Mission</h2>
              <p className="text-green-700/80 leading-relaxed text-base flex-1">
                {content.mission || 'To deliver premium quality products that improve everyday lives across India.'}
              </p>
            </div>
            <div className="bg-green-900 rounded-3xl p-8 md:p-10 flex flex-col">
              <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-green-300" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-green-200/80 leading-relaxed text-base flex-1">
                {content.vision || "To be India's most trusted multi-category enterprise, known for integrity and quality."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company story */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-3">Our Story</p>
              <h2 className="font-display text-4xl font-bold text-green-900 mb-6 leading-tight">
                Built on Trust,<br />Driven by Quality
              </h2>
              <p className="text-green-700/80 leading-relaxed text-base mb-6">
                {content.story || 'Founded in the heart of Delhi, Bharat Advance began as a small venture with a big dream — to make quality accessible to every Indian.'}
              </p>
              {companyAddress && (
                <div className="flex items-start gap-3 text-sm text-green-700">
                  <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{companyAddress}</span>
                </div>
              )}
              {(companyPhone || companyEmail) && (
                <div className="flex flex-wrap gap-4 mt-3">
                  {companyPhone && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Phone className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{companyPhone}</span>
                    </div>
                  )}
                  {companyEmail && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Mail className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{companyEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-green-900/20">
                <Image
                  src={logoUrl}
                  alt={companyName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-white font-bold text-xl leading-none">5+</div>
                  <div className="text-green-200 text-[10px] mt-0.5 leading-tight">Years<br/>Trusted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">What Drives Us</p>
            <h2 className="font-display text-4xl font-bold text-green-900">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-green-50 hover:bg-green-900 rounded-2xl p-7 border border-green-100 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/20 hover:-translate-y-1"
              >
                <div className="w-11 h-11 bg-green-100 group-hover:bg-green-700 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                  <Icon className="w-5 h-5 text-green-700 group-hover:text-green-200 transition-colors duration-300" />
                </div>
                <h3 className="font-display font-bold text-green-900 group-hover:text-white text-base mb-2 transition-colors duration-300">{title}</h3>
                <p className="text-green-600 group-hover:text-green-300 text-sm leading-relaxed transition-colors duration-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Founder */}
      {team.length > 0 && (
        <section className="py-24 bg-green-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">The People Behind</p>
              <h2 className="font-display text-4xl font-bold text-green-900">Our Team</h2>
            </div>
            <div className={`grid gap-8 ${team.length === 1 ? 'max-w-sm mx-auto' : team.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {team.map((member) => (
                <div key={member.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-green-900/10 transition-all duration-300 hover:-translate-y-1 border border-green-100">
                  <div className="aspect-[4/3] relative bg-green-100 overflow-hidden">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                        <div className="w-20 h-20 rounded-full bg-green-300 flex items-center justify-center">
                          <span className="text-green-800 text-3xl font-bold">{member.name.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display font-bold text-white text-lg leading-tight">{member.name}</h3>
                      <p className="text-green-300 text-sm">{member.role}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    {member.bio && <p className="text-green-700/80 text-sm leading-relaxed">{member.bio}</p>}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-green-600 hover:text-green-900 transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certificates */}
      {certs.length > 0 ? (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">Certified & Recognised</p>
              <h2 className="font-display text-4xl font-bold text-green-900">Our Certificates & Awards</h2>
              <p className="text-green-600 mt-3 max-w-xl mx-auto text-sm">
                Our commitment to quality and excellence is backed by industry-recognised certifications and awards.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {certs.map((cert) => (
                <div key={cert.id} className="group bg-green-50 rounded-2xl overflow-hidden border border-green-100 hover:border-green-300 hover:shadow-lg hover:shadow-green-900/10 transition-all duration-300">
                  {cert.image_url && (
                    <div className="aspect-[3/2] relative bg-white overflow-hidden">
                      <Image
                        src={cert.image_url}
                        alt={cert.title}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className={`p-5 ${!cert.image_url ? 'pt-8 pb-8 text-center' : ''}`}>
                    {!cert.image_url && (
                      <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-green-700" />
                      </div>
                    )}
                    <h3 className="font-display font-bold text-green-900 text-base">{cert.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {cert.issuer && <span className="text-xs text-green-600">{cert.issuer}</span>}
                      {cert.issuer && cert.issued_year && <span className="text-green-300 text-xs">&middot;</span>}
                      {cert.issued_year && <span className="text-xs text-green-500">{cert.issued_year}</span>}
                    </div>
                    {cert.description && <p className="text-green-600/80 text-xs mt-2 leading-relaxed">{cert.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">Certified & Recognised</p>
              <h2 className="font-display text-4xl font-bold text-green-900">Our Certificates & Awards</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'GST Registered Business', issuer: 'Government of India', year: '2022', detail: 'GSTIN: 07DQNPR1437Q1ZZ' },
                { title: 'PAN Verified Entity', issuer: 'Income Tax Department', year: '2022', detail: 'PAN: DQNPR1437Q' },
                { title: 'ISO Quality Compliant', issuer: 'Quality Council of India', year: '2023', detail: 'Committed to international quality standards' },
              ].map((c) => (
                <div key={c.title} className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center hover:border-green-300 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Award className="w-7 h-7 text-green-700" />
                  </div>
                  <h3 className="font-display font-bold text-green-900 text-base mb-1">{c.title}</h3>
                  <p className="text-xs text-green-600">{c.issuer} &middot; {c.year}</p>
                  <p className="text-xs text-green-500 mt-2">{c.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-green-400 mt-8">
              Add your certificates from the Admin panel to display them here.
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-green-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg')" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Ready to Experience the Difference?</h2>
          <p className="text-green-200/80 mb-8 text-base">
            Browse our curated product range or reach out — we are here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-900/30 text-sm"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-8 py-4 rounded-xl transition-colors backdrop-blur-sm text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
