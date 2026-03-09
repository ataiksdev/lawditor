'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
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
  const [user,    setUser]    = useState<any>(null);
  const [profile, setProfile] = useState<{ credits: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const { data: prof } = await supabase
        .from('profiles').select('credits,plan').eq('id', user.id).single();
      setProfile(prof);
      setLoading(false);
    })();
  }, [router]);

  async function handlePayment(plan: typeof PLANS[0]) {
    if (!user) return;
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
      key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email:    user.email,
      amount:   plan.kobo,
      currency: 'NGN',
      ref:      `lawditor_${Date.now()}_${user.id.slice(0,8)}`,
      metadata: { userId: user.id, credits: plan.credits, plan: plan.name },
      callback: async (response: { reference: string }) => {
        try {
          const res = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              credits:   plan.credits,
              userId:    user.id,
            }),
          });
          const data = await res.json();
          if (data.success) {
            // Refresh credits display
            const supabase = createClient();
            const { data: prof } = await supabase
              .from('profiles').select('credits,plan').eq('id', user.id).single();
            setProfile(prof);
          }
        } catch {
          alert('Payment verification failed. Contact support with your reference: ' + response.reference);
        } finally {
          setPaying(null);
        }
      },
      onClose: () => setPaying(null),
    });

    handler.openIframe();
  }

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner} />
      <p style={styles.loadText}>Loading billing…</p>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <Link href="/dashboard" style={styles.backLink}>← Dashboard</Link>
          <div style={styles.logo}><span>⚖</span><span style={styles.logoText}>Lawditor</span></div>
          <div />
        </div>
      </nav>

      <main style={styles.main}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Top Up Credits</h1>
          <p style={styles.pageSubtitle}>
            Each credit = one full compliance audit. Credits never expire.
          </p>
        </div>

        {/* ── Current balance ──────────────────────────────────── */}
        <div style={styles.balanceCard}>
          <div style={styles.balanceLeft}>
            <p style={styles.balanceLabel}>Current Balance</p>
            <p style={styles.balanceValue}>{profile?.credits ?? 0}</p>
            <p style={styles.balanceSub}>credits remaining</p>
          </div>
          <div style={styles.balanceDivider} />
          <div style={styles.balanceRight}>
            <p style={styles.balanceLabel}>Plan</p>
            <p style={styles.planName}>{profile?.plan ?? 'free'}</p>
            <p style={styles.balanceSub}>
              {profile?.credits === 0
                ? '⚠ You have no credits — top up to run audits'
                : profile?.credits === 1
                ? '1 audit remaining'
                : `${profile?.credits} audits remaining`}
            </p>
          </div>
        </div>

        {/* ── Plan cards ──────────────────────────────────────── */}
        <div style={styles.plansGrid}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              style={{
                ...styles.planCard,
                ...(plan.highlight ? styles.planCardHighlight : {}),
              }}
            >
              {plan.highlight && (
                <div style={styles.popularBadge}>Most Popular</div>
              )}

              <div style={styles.planTop}>
                <p style={styles.planNameLabel}>{plan.name}</p>
                <p style={styles.planPrice}>{plan.price}</p>
                <p style={styles.planPerAudit}>{plan.perAudit}</p>
              </div>

              <ul style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={styles.featureItem}>
                    <span style={{
                      ...styles.featureCheck,
                      color: plan.highlight ? '#c9a84c' : '#10b981',
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  ...styles.buyBtn,
                  ...(plan.highlight ? styles.buyBtnHighlight : {}),
                  opacity: paying ? 0.6 : 1,
                }}
                onClick={() => handlePayment(plan)}
                disabled={!!paying}
              >
                {paying === plan.name ? 'Opening Paystack…' : `Buy ${plan.credits} Credits`}
              </button>
            </div>
          ))}
        </div>

        {/* ── FAQ / info ───────────────────────────────────────── */}
        <div style={styles.infoGrid}>
          <InfoCard icon="💳" title="Secure Payments" body="Powered by Paystack. Your card details are never stored on our servers." />
          <InfoCard icon="⏱" title="Credits Never Expire" body="Top up once, use whenever. No monthly subscription, no auto-renewals." />
          <InfoCard icon="🇳🇬" title="Nigerian Naira" body="All prices in NGN. Paystack supports all major Nigerian banks and cards." />
          <InfoCard icon="📧" title="Questions?" body="Email support@lawditor.ng with your transaction reference for any billing issues." />
        </div>
      </main>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoIcon}>{icon}</span>
      <p style={styles.infoTitle}>{title}</p>
      <p style={styles.infoBody}>{body}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#0b0f1a', color: '#e2e8f0', fontFamily: "'Georgia', serif" },
  loadWrap: {
    minHeight: '100vh', background: '#0b0f1a',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  spinner: {
    width: 36, height: 36, border: '3px solid rgba(201,168,76,0.2)',
    borderTop: '3px solid #c9a84c', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadText: { color: '#64748b', fontSize: 14, fontFamily: 'system-ui, sans-serif' },

  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navInner: {
    maxWidth: 1000, margin: '0 auto', padding: '0 24px',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backLink: { fontSize: 14, color: '#94a3b8', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 },
  logoText: { fontWeight: 700, color: '#f1f5f9', fontSize: 18 },

  main: { maxWidth: 1000, margin: '0 auto', padding: '48px 24px 80px' },

  pageHeader: { textAlign: 'center', marginBottom: 40 },
  pageTitle: {
    fontSize: 34, fontWeight: 700, color: '#f1f5f9',
    margin: '0 0 8px', letterSpacing: '-0.02em',
  },
  pageSubtitle: { fontSize: 16, color: '#64748b', margin: 0, fontFamily: 'system-ui, sans-serif' },

  // Balance
  balanceCard: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: 12, padding: '24px 32px', marginBottom: 36, gap: 32, flexWrap: 'wrap',
  },
  balanceLeft: {},
  balanceDivider: { width: 1, height: 56, background: 'rgba(201,168,76,0.15)', flexShrink: 0 },
  balanceRight: {},
  balanceLabel: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 4px', fontFamily: 'system-ui, sans-serif',
  },
  balanceValue: { fontSize: 42, fontWeight: 700, color: '#c9a84c', margin: '0 0 2px', lineHeight: 1 },
  balanceSub: { fontSize: 13, color: '#475569', margin: 0, fontFamily: 'system-ui, sans-serif' },
  planName: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px', textTransform: 'capitalize' },

  // Plans
  plansGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20, marginBottom: 40,
  },
  planCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  },
  planCardHighlight: {
    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.3)',
    boxShadow: '0 0 32px rgba(201,168,76,0.08)',
  },
  popularBadge: {
    position: 'absolute', top: 16, right: 16,
    fontSize: 10, fontWeight: 700, color: '#0b0f1a',
    background: '#c9a84c', padding: '3px 8px', borderRadius: 4,
    letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif',
  },
  planTop: { marginBottom: 20 },
  planNameLabel: {
    fontSize: 12, fontWeight: 700, color: '#c9a84c',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    margin: '0 0 8px', fontFamily: 'system-ui, sans-serif',
  },
  planPrice: { fontSize: 32, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1 },
  planPerAudit: { fontSize: 13, color: '#64748b', margin: 0, fontFamily: 'system-ui, sans-serif' },

  featureList: {
    listStyle: 'none', margin: '0 0 24px', padding: 0,
    display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
  },
  featureItem: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    fontSize: 14, color: '#94a3b8', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
  },
  featureCheck: { flexShrink: 0, fontWeight: 700, marginTop: 1 },

  buyBtn: {
    width: '100%', padding: '13px', borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
    transition: 'opacity 0.15s',
  },
  buyBtnHighlight: {
    background: '#c9a84c', border: '1px solid #c9a84c',
    color: '#0b0f1a',
  },

  // Info cards
  infoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
  },
  infoCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: '20px',
  },
  infoIcon: { fontSize: 22, display: 'block', marginBottom: 10 },
  infoTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 6px' },
  infoBody: { fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' },
};
