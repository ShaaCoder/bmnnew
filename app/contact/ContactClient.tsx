'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('contacts').insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong. Please try again.');
    } else {
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Address',
      value: 'Vijay Vihar Phase II, Vijay Vihar, Sector 4, Rohini, Delhi — 110085',
    },
    { icon: Phone, label: 'Phone', value: '9990188783' },
    { icon: Mail, label: 'Email', value: 'bmnenterprises22@gmail.com' },
  ];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="pt-16 bg-green-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">We'd Love to Hear From You</p>
          <h1 className="font-display text-5xl font-bold text-white">Contact Us</h1>
          <p className="text-green-300/70 mt-3 max-w-xl mx-auto">
            Whether you have a question about a product, an order, or just want to say hello — we're here for you.
          </p>
        </div>
      </div>

      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-display text-2xl font-bold text-green-900">Get in Touch</h2>
              <p className="text-green-600 text-sm leading-relaxed">
                Our team is available Monday to Saturday, 10 AM – 7 PM IST. We typically respond within 24 hours.
              </p>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-green-800 mt-0.5 font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* GSTIN badge */}
              <div className="bg-green-900 rounded-2xl p-5 text-green-100">
                <p className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">Business Details</p>
                <p className="text-sm font-semibold">Bharat Advance</p>
                <p className="text-xs text-green-300 mt-1">GSTIN: 07DQNPR1437Q1ZZ</p>
                <p className="text-xs text-green-300">PAN: DQNPR1437Q</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-green-100 p-8 shadow-sm">
              {sent ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-green-900">Message Sent!</h3>
                  <p className="text-green-600 text-sm max-w-xs">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-2 px-6 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-display text-xl font-bold text-green-900 mb-6">Send Us a Message</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Full Name *</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/50 text-green-900 placeholder:text-green-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/50 text-green-900 placeholder:text-green-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/50 text-green-900 placeholder:text-green-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us how we can help…"
                      className="w-full px-4 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/50 text-green-900 placeholder:text-green-300 resize-none"
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-600 text-white font-medium px-6 py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
