'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    credits: 10,
    kobo: 500000,
    price: '₦5,000',
    perAudit: '₦500 / audit',
    highlight: false,
    features: ['10 compliance audits', 'PDF export for each', 'All Nigerian law checks', 'Email support'],
  },
  {
    name: 'Growth',
    credits: 50,
    kobo: 2000000,
    price: '₦20,000',
    perAudit: '₦400 / audit',
    highlight: true,
    features: ['50 compliance audits', 'PDF export for each', 'All Nigerian law checks', 'Priority support', '20% savings vs Starter'],
  },
  {
    name: 'Enterprise',
    credits: 999,
    kobo: 8000000,
    price: '₦80,000',
    perAudit: 'Unlimited',
    highlight: false,
    features: ['Unlimited audits (999 credits)', 'PDF export for each', 'All Nigerian law checks', 'Dedicated support', 'Bulk savings'],
  },
];

export default function BillingPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<{ credits: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(plan: typeof PLANS[0]) {
    if (!session?.user?.email) return;
    setPaying(plan.name);

    // Wait for Paystack script to be available
    let attempts = 0;
    while (!(window as any).PaystackPop && attempts < 20) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }

    if (!(window as any).PaystackPop) {
      alert('Paystack failed to load. Please disable any ad blockers and try again.');
      setPaying(null);
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: session.user.email,
      amount: plan.kobo,
      currency: 'NGN',
      ref: `lawditor_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      metadata: { credits: plan.credits, plan: plan.name },
      callback: async (response: { reference: string }) => {
        try {
          const res = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              credits: plan.credits,
              planName: plan.name,
            }),
          });
          const data = await res.json();
          if (data.success) {
            fetchProfile(); // Refresh UI
            alert(`Successfully topped up ${plan.credits} credits!`);
          } else {
            throw new Error(data.error);
          }
        } catch (e: any) {
          alert('Payment verification failed: ' + e.message);
        } finally {
          setPaying(null);
        }
      },
      onClose: () => setPaying(null),
    });

    handler.openIframe();
  }

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Securing Payment Channel</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-sm font-medium">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-xl">⚖</span>
            <span className="font-black text-xl tracking-tighter">Lawditor</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-6 tracking-tighter">Upgrade Your Arsenal</h1>
          <p className="text-white/40 text-xl max-w-2xl mx-auto leading-relaxed">
            Credits power our deep-scrape legal AI engine. One credit equals one comprehensive Nigerian compliance audit.
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-[40px] p-10 mb-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
           
           <div className="text-center md:text-left">
             <p className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase mb-4">Current Reserves</p>
             <div className="flex items-baseline gap-4 justify-center md:justify-start">
                <span className="text-7xl font-black text-emerald-500 tabular-nums">{profile?.credits ?? 0}</span>
                <span className="text-white/20 font-bold uppercase tracking-widest text-sm">Credits Available</span>
             </div>
           </div>

           <div className="hidden md:block w-[1px] h-20 bg-white/5" />

           <div className="text-center md:text-left">
             <p className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase mb-4">Current Plan</p>
             <p className="text-3xl font-black text-white capitalize">{profile?.plan || 'Free Tier'}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {PLANS.map(plan => (
            <div 
              key={plan.name} 
              className={`relative bg-[#0f0f0f] border rounded-[32px] p-10 flex flex-col transition-all hover:-translate-y-2 ${
                plan.highlight ? 'border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10' : 'border-white/5'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Most Efficient
                </div>
              )}

              <div className="mb-10">
                <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                </div>
                <p className="text-xs text-white/25 font-medium">{plan.perAudit}</p>
              </div>

              <div className="flex-grow space-y-4 mb-10">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm text-white/50 items-start">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePayment(plan)}
                disabled={!!paying}
                className={`w-full py-4 rounded-2xl font-black transition-all ${
                  plan.highlight 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl shadow-emerald-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-white'
                } disabled:opacity-50`}
              >
                {paying === plan.name ? 'Connecting Paystack...' : `Buy ${plan.credits} Credits`}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <InfoCard icon="🔒" title="Secure" text="Powered by Paystack. Enterprise-grade security." />
           <InfoCard icon="🚀" title="Instant" text="Credits applied to your account immediately." />
           <InfoCard icon="♾️" title="Permenent" text="Your credits will never expire. Use anytime." />
           <InfoCard icon="🇳🇬" title="Native" text="Full support for all Nigerian bank cards." />
        </div>
      </main>

      <footer className="py-20 text-center border-t border-white/5">
        <p className="text-white/20 text-xs font-medium tracking-widest uppercase">LAW DITOR — NIGERIA'S SMART COMPLIANCE PARTNER</p>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, text }: any) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl">
      <div className="text-2xl mb-4">{icon}</div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{text}</p>
    </div>
  );
}
