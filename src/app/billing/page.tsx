'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Zap, CheckCircle, Shield, Rocket, Infinity, LocateFixed, Loader, ArrowRight } from 'lucide-react';

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
  const [profile, setProfile] = useState<{ credits: number; plan: string; name: string } | null>(null);
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
            fetchProfile(); 
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
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-[2rem] bg-[#1e1e1e] flex items-center justify-center animate-pulse"
           style={{ boxShadow: "inset 8px 8px 16px #161616, inset -8px -8px 16px #262626" }}>
        <CreditCard className="w-8 h-8 text-[#d4af37]" />
      </div>
      <p className="text-gray-500 font-black text-sm uppercase tracking-[0.3em]">Opening Secure Vault</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#f2f2f2] p-8 md:p-12 lg:p-24">
      {/* Navigation */}
      <Link href="/dashboard" 
            className="inline-flex items-center space-x-3 mb-16 text-gray-400 hover:text-white transition-all font-black text-sm uppercase tracking-widest group">
        <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center transition-all group-hover:scale-110 shadow-nm-sm"
             style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span>Dashboard</span>
      </Link>

      <div className="max-w-7xl mx-auto">
        <header className="mb-24 text-center">
           <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Capital Allocation</h2>
           <h1 className="text-7xl font-black text-white leading-tight tracking-tight mb-8">
             Scale Your <br />
             <span className="text-[#d4af37]">Audit Reserves</span>
           </h1>
           <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
             Credits fuel our proprietary legal AI engine. Acquire premium units 
             for high-fidelity Nigerian compliance auditing.
           </p>
        </header>

        {/* Current Assets Card */}
        <div className="p-16 rounded-[4rem] bg-[#1e1e1e] mb-20 flex flex-col md:flex-row items-center justify-between gap-12"
             style={{ boxShadow: "20px 20px 40px #161616, -20px -20px 40px #262626" }}>
           
           <div className="flex items-center space-x-10">
              <div className="w-24 h-24 rounded-[2rem] bg-[#1e1e1e] flex items-center justify-center"
                   style={{ boxShadow: "inset 8px 8px 16px #161616, inset -8px -8px 16px #262626" }}>
                 <Zap className="w-12 h-12 text-[#d4af37]" />
              </div>
              <div>
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Available Capacity</div>
                 <div className="flex items-baseline space-x-3">
                    <div className="text-7xl font-black text-white tracking-tighter">{profile?.credits || 0}</div>
                    <div className="text-xl font-black text-[#d4af37]">UNITS</div>
                 </div>
              </div>
           </div>

           <div className="h-20 w-[1px] bg-white/5 hidden md:block" />

           <div className="text-center md:text-right">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Protocol Tier</div>
              <div className="text-4xl font-black text-white tracking-tight capitalize">{profile?.plan || 'Professional'}</div>
              <div className="text-xs font-bold text-gray-600 mt-1">LIFETIME ACCESS GRANTED</div>
           </div>
        </div>

        {/* Pricing Matrix */}
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          {PLANS.map((plan) => (
            <div key={plan.name} className="flex flex-col">
               <div className={`p-10 rounded-[3rem] bg-[#1e1e1e] flex flex-col h-full relative border-none`}
                    style={{ 
                        boxShadow: plan.highlight ? "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626" : "12px 12px 24px #161616, -12px -12px 24px #262626" 
                    }}>
                  
                  {plan.highlight && (
                    <div className="absolute top-8 right-8">
                       <CheckCircle className="w-6 h-6 text-[#d4af37]" />
                    </div>
                  )}

                  <div className="mb-12">
                     <div className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.3em] mb-4">{plan.name} Package</div>
                     <div className="text-5xl font-black text-white mb-2">{plan.price}</div>
                     <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">{plan.perAudit}</div>
                  </div>

                  <div className="space-y-6 mb-12 flex-1">
                     {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center space-x-4 group">
                           <div className="w-6 h-6 rounded-lg bg-[#1e1e1e] flex items-center justify-center shrink-0"
                                style={{ boxShadow: "inset 2px 2px 4px #161616, inset -2px -2px 4px #262626" }}>
                              <CheckCircle className="w-3 h-3 text-[#d4af37]" />
                           </div>
                           <span className="text-sm font-bold text-gray-500 group-hover:text-gray-300 transition-colors tracking-tight">{f}</span>
                        </div>
                     ))}
                  </div>

                  <button 
                    onClick={() => handlePayment(plan)}
                    disabled={!!paying}
                    className="w-full py-5 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white font-black text-lg transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center space-x-3 disabled:opacity-50"
                    style={{ boxShadow: "8px 8px 16px #161616, -8px -8px 16px #262626" }}>
                    {paying === plan.name ? (
                       <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                       <>
                        <span>Acquire {plan.credits} Units</span>
                        <ArrowRight className="w-5 h-5" />
                       </>
                    )}
                  </button>
               </div>
            </div>
          ))}
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { icon: Shield, title: "Secured", desc: "Paystack-powered 256-bit encryption" },
             { icon: Rocket, title: "Instant", desc: "Credits activated within 400ms" },
             { icon: Infinity, title: "Perpetual", desc: "Audit units never expire" },
             { icon: LocateFixed, title: "Localized", desc: "Optimized for Nigerian Naira" }
           ].map((item, idx) => (
             <div key={idx} className="p-8 rounded-3xl bg-[#1e1e1e] text-center"
                  style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mx-auto mb-6"
                     style={{ boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}>
                   <item.icon className="w-5 h-5 text-[#d4af37]" />
                </div>
                <h4 className="font-black text-white mb-2">{item.title}</h4>
                <p className="text-xs font-bold text-gray-600 leading-relaxed tracking-tight">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
