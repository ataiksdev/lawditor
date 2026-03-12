'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
      } else {
        const loginRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (loginRes?.ok) {
          router.push('/dashboard');
        } else {
          setIsLogin(true);
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-12">
        <div
          className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center"
          style={{
            boxShadow: "8px 8px 16px #161616, -8px -8px 16px #262626",
          }}
        >
          <Shield className="w-8 h-8 text-[#d4af37]" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Lawditor</h1>
      </div>

      <div
        className="w-full max-w-[480px] p-10 rounded-[2.5rem] bg-[#1e1e1e]"
        style={{
          boxShadow: "15px 15px 30px #161616, -15px -15px 30px #262626",
        }}
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400">
            {isLogin ? "Enter your credentials to continue" : "Join the professional audit platform"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {!isLogin && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center px-4">
                <User className="w-4 h-4 mr-2" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1e1e] border-none rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-gray-600"
                style={{
                    boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626",
                }}
                placeholder="Chief John Doe"
                required
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center px-4">
              <Mail className="w-4 h-4 mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e1e1e] border-none rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                  boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626",
              }}
              placeholder="barrister@example.com"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center px-4">
              <Lock className="w-4 h-4 mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e1e1e] border-none rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                  boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626",
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div 
              className="p-4 rounded-xl bg-[#1e1e1e] text-red-400 text-sm text-center font-medium"
              style={{ boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl text-lg font-black transition-all bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white disabled:opacity-50 flex items-center justify-center space-x-2"
            style={{
                boxShadow: "8px 8px 16px #161616, -8px -8px 16px #262626",
            }}
          >
            {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    <span>{isLogin ? "Sign In" : "Registration"}</span>
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-[#d4af37] transition-colors font-bold"
          >
            {isLogin ? "New to Lawditor? Build Your Account" : "Access Your Existing Dashboard"}
          </button>
          
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
