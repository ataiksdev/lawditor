'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface Audit {
  id: string;
  inputUrl: string;
  riskScore: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  createdAt: string;
  findings?: any;
}

interface Profile {
  email: string;
  name: string;
  plan: string;
  credits: number;
}

const RISK_CONFIG = {
  HIGH:   { label: 'HIGH',   dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#fca5a5' },
  MEDIUM: { label: 'MEDIUM', dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  text: '#fcd34d' },
  LOW:    { label: 'LOW',    dot: '#10b981', bg: 'rgba(16,185,129,0.1)',   text: '#6ee7b7' },
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [audits, setAudits]   = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  async function fetchData() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setAudits(data.audits);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    signOut({ callbackUrl: '/login' });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function cleanUrl(url: string) {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const riskCounts = {
    HIGH:   audits.filter(a => a.riskScore === 'HIGH').length,
    MEDIUM: audits.filter(a => a.riskScore === 'MEDIUM').length,
    LOW:    audits.filter(a => a.riskScore === 'LOW').length,
  };

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Initializing Dashboard</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl">⚖</span>
            </div>
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Lawditor</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden md:block text-white/40 text-sm font-medium">{profile?.email}</span>
            <button onClick={handleSignOut} className="px-5 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold transition-all">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h1 className="text-5xl font-black mb-4 tracking-tight">Your Dashboard</h1>
            <p className="text-white/40 text-lg">Manage your Nigerian legal compliance audits and reports.</p>
          </div>
          <Link href="/audit/new" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-center">
            + New Compliance Audit
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard label="Credits" value={profile?.credits ?? 0} accent="#10b981" sub={profile?.plan?.toUpperCase()} />
          <StatCard label="Total Audits" value={audits.length} accent="#3b82f6" sub="ALL TIME" />
          <StatCard label="High Risks" value={riskCounts.HIGH} accent="#ef4444" sub="ACTION REQUIRED" />
          <StatCard label="Compliant" value={riskCounts.LOW + riskCounts.MEDIUM} accent="#f59e0b" sub="LOW/MED RISK" />
        </div>

        {/* Audit List */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Compliance Cycles</h2>
            <span className="text-white/30 text-sm">{audits.length} Reports Found</span>
          </div>

          {audits.length === 0 ? (
            <div className="py-32 text-center">
              <div className="text-5xl mb-6 opacity-20">📋</div>
              <p className="text-white/60 font-medium mb-8">No data available yet</p>
              <Link href="/audit/new" className="text-emerald-400 font-bold hover:underline">Start your first audit →</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {audits.map((audit) => {
                const risk = RISK_CONFIG[audit.riskScore] || RISK_CONFIG.MEDIUM;
                return (
                  <Link key={audit.id} href={`/audit/${audit.id}`} className="group px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-1.5 h-10 rounded-full" style={{ background: risk.dot }} />
                      <div>
                        <p className="text-lg font-bold group-hover:text-emerald-400 transition-colors">{cleanUrl(audit.inputUrl)}</p>
                        <p className="text-white/30 text-sm font-medium">{formatDate(audit.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <span className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border" style={{ background: risk.bg, borderColor: risk.dot, color: risk.text }}>
                        {risk.label}
                      </span>
                      <span className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent, sub }: any) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full translate-x-10 translate-y-[-10px] blur-3xl group-hover:bg-emerald-500/5 transition-all" />
      <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-4">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-5xl font-black tabular-nums" style={{ color: value > 0 ? accent : '#444' }}>{value}</p>
        <p className="text-[10px] font-black text-white/20">{sub}</p>
      </div>
    </div>
  );
}
