'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin, Clock, Loader as Loader2, CircleCheck as CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: dbErr } = await supabase.from('contact_queries').insert(form);
    setLoading(false);
    if (dbErr) { setError('Failed to send. Please try again.'); return; }
    setSuccess(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <div className="bg-green-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">
              <Link href="/" className="hover:text-green-300">Home</Link> / Contact
            </p>
            <h1 className="font-display text-5xl font-bold">Contact Us</h1>
            <p className="text-green-300/70 mt-3 max-w-lg">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-green-900 mb-6">Get In Touch</h2>
                {[
                  { icon: MapPin, title: 'Address', value: '123 Business Avenue,\nCommercial District, City - 400001' },
                  { icon: Phone, title: 'Phone', value: '+91 98765 43210' },
                  { icon: Mail, title: 'Email', value: 'info@bharatadvance.com' },
                  { icon: Clock, title: 'Business Hours', value: 'Mon – Sat: 9am – 6pm\nSunday: Closed' },
                ].map(({ icon: Icon, title, value }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 text-sm">{title}</p>
                      <p className="text-green-600/70 text-sm whitespace-pre-line mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-green-100 p-8 shadow-sm">
              {success ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-green-900 mb-2">Message Sent!</h3>
                  <p className="text-green-600/70">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-6 px-6 py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-green-900 mb-6">Send a Message</h3>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1.5">Full Name *</label>
                      <input
                        name="name" value={form.name} onChange={handleChange}
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1.5">Email *</label>
                      <input
                        name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="email@example.com"
                        className="w-full px-4 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1.5">Phone</label>
                      <input
                        name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+91 00000 00000"
                        className="w-full px-4 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1.5">Subject</label>
                      <input
                        name="subject" value={form.subject} onChange={handleChange}
                        placeholder="What is this regarding?"
                        className="w-full px-4 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 transition"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1.5">Message *</label>
                      <textarea
                        name="message" value={form.message} onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        rows={5}
                        className="w-full px-4 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 transition resize-none"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-green-800 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
