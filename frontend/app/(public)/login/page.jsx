'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { setUser } from '@/lib/features/user/userSlice';

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.auth.login(email, password);
      dispatch(setUser({ user: data, token: data.token }));
      toast.success(`Welcome back, ${data.name}!`);

      // Redirect based on role
      if (data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800">
            Sign In to <span className="text-red-600">ReDragon</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Access your orders, store dashboard, and settings.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@redragon.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none focus:border-red-500 text-slate-700 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none focus:border-red-500 text-slate-700 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg shadow-red-600/10 active:scale-[0.98] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-red-600 hover:underline font-medium">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
