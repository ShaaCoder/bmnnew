'use client';

import { useState } from 'react';
import { useAdmin } from '@/lib/admin-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader as Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AdminLoginPage() {
  const { signIn } = useAdmin();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const { error: err } = await signIn(form.email, form.password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.replace('/admin');
  };

  return (
    <div className="min-h-screen bg-green-950 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg')" }}
        />
        <div className="absolute inset-0 bg-green-950/75" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Image src="/bmn_logo.jpeg" alt="Bharat Advance" width={40} height={40} className="rounded-full object-cover" />
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight">Bharat Advance</p>
              <p className="text-green-500 text-xs tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
              Manage your<br />store with ease
            </h2>
            <p className="text-green-400 text-sm leading-relaxed max-w-xs">
              Full control over products, orders, gallery, and customer queries — all in one place.
            </p>
          </div>
          <div className="flex gap-6">
            {['Products', 'Orders', 'Gallery', 'Contacts'].map((item) => (
              <div key={item} className="text-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1" />
                <p className="text-green-400 text-xs">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/bmn_logo.jpeg" alt="Bharat Advance" width={40} height={40} className="rounded-full object-cover" />
            <p className="font-display font-bold text-white text-xl">Bharat Advance</p>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-green-400 text-sm">Sign in to your admin account to continue.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">&#x26A0;</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-green-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@bharatadvance.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-green-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-green-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-green-800 text-white rounded-xl font-medium hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-green-100 text-center">
              <p className="text-sm text-green-600">
                Don&apos;t have an account?{' '}
                <Link href="/admin/signup" className="font-medium text-green-700 hover:text-green-900 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-green-500 text-xs mt-6">
            <Link href="/" className="hover:text-green-300 transition-colors">
              &#8592; Back to store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
