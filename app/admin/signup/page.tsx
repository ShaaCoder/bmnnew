'use client';

import { useState } from 'react';
import { useAdmin } from '@/lib/admin-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader as Loader2, CircleCheck as CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AdminSignupPage() {
  const { signUp } = useAdmin();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const passwordStrength = (p: string) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.confirm) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await signUp(form.email, form.password);
    setLoading(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(() => router.replace('/admin'), 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-display text-2xl font-bold text-green-900 mb-2">Account Created!</h3>
          <p className="text-green-600 text-sm">Redirecting you to the admin panel...</p>
        </div>
      </div>
    );
  }

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
              Create your<br />admin account
            </h2>
            <p className="text-green-400 text-sm leading-relaxed max-w-xs">
              Set up your credentials to start managing the Bharat Advance store and all its content.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'Manage products & categories',
              'Track and update orders',
              'Curate gallery & content',
              'Handle customer enquiries',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-green-300 text-sm">{feat}</p>
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
            <h1 className="font-display text-3xl font-bold text-white mb-2">Create account</h1>
            <p className="text-green-400 text-sm">Set up your admin credentials to get started.</p>
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
                <label className="block text-xs font-medium text-green-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-green-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
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
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-green-100'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600', 'text-green-700'][strength]}`}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-green-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-11 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-green-50 transition ${
                      form.confirm && form.confirm !== form.password
                        ? 'border-red-300 focus:ring-red-300'
                        : form.confirm && form.confirm === form.password
                        ? 'border-green-300 focus:ring-green-300'
                        : 'border-green-200 focus:ring-green-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {form.confirm && form.confirm === form.password && (
                    <CheckCircle className="w-4 h-4 text-green-500 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-green-800 text-white rounded-xl font-medium hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-green-100 text-center">
              <p className="text-sm text-green-600">
                Already have an account?{' '}
                <Link href="/admin/login" className="font-medium text-green-700 hover:text-green-900 transition-colors">
                  Sign in
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
