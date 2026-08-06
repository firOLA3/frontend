'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsLoading(true);
    try {
      // Using axios to hit the backend directly and set the cookie
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        password: password
      }, {
        withCredentials: true // Important to save the cookie!
      });

      if (res.data.success) {
        toast.success('Login successful!');
        router.push('/scanner'); // Redirect to scanner as requested
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
              <p className="text-primary-100 mt-2 text-sm">Please authenticate to access the scanner and dashboard.</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-base font-semibold shadow-md shadow-primary-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Secure access required for event staff only.
        </p>
      </div>
    </div>
  );
}
