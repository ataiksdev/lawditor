'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface Audit {
  id: string;
  input_url: string;
  risk_score: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  created_at: string;
  findings?: { app_name?: string; executive_summary?: string };
}

interface Profile {
  plan: string;
  credits: number;
}

const RISK_CONFIG = {
  HIGH:   { label: 'HIGH',   dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#fca5a5' },
  MEDIUM: { label: 'MEDIUM', dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  text: '#fcd34d' },
  LOW:    { label: 'LOW',    dot: '#10b981', bg: 'rgba(16,185,129,0.1)',   text: '#6ee7b7' },
};

export default function Dashboard() {
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [audits, setAudits]   = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const [{ data: prof }, { data: auds }] = await Promise.all([
        supabase.from('profiles').select('plan,credits').eq('id', user.id).single(),
        supabase.from('audits')
          .select('id,input_url,risk_score,status,created_at,findings')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setProfile(prof);
      setAudits(auds || []);
      setLoading(false);
    })();
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
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
    HIGH:   audits.filter(a => a.risk_score === 'HIGH').length,
    MEDIUM: audits.filter(a => a.risk_score === 'MEDIUM').length,
    LOW:    audits.filter(a => a.risk_score === 'LOW').length,
  };

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner} />
      <p style={styles.loadText}>Loading your workspace…</p>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* ── Top nav ─────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>⚖</span>
            <span style={styles.logoText}>Lawditor</span>
          </div>
          <div style={styles.navRight}>
            <span style={styles.navEmail}>{user?.email}</span>
            <button onClick={signOut} style={styles.signOutBtn}>Sign out</button>
          </div>
        </div>
      </nav>

      <main style={styles.main}>
        {/* ── Header row ──────────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>Your compliance audit workspace</p>
          </div>
          <Link href="/audit/new" style={styles.newAuditBtn}>
            <span style={styles.plusIcon}>+</span>
            New Audit
          </Link>
        </div>

        {/* ── Stats row ───────────────────────────────────────── */}
        <div style={styles.statsRow}>
          <StatCard
            label="Credits Remaining"
            value={profile?.credits ?? 0}
            sub={profile?.plan === 'free' ? 'Free plan' : `${profile?.plan} plan`}
            accent="#c9a84c"
            action={<Link href="/billing" style={styles.upgradeLink}>Top up →</Link>}
          />
          <StatCard label="Total Audits"   value={audits.length}       sub="all time"    accent="#60a5fa" />
          <StatCard label="High Risk"       value={riskCounts.HIGH}     sub="need action" accent="#f87171" />
          <StatCard label="Resolved / Low"  value={riskCounts.LOW}      sub="compliant"   accent="#34d399" />
        </div>

        {/* ── Audit list ──────────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Audits</h2>
            <span style={styles.sectionCount}>{audits.length} total</span>
          </div>

          {audits.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p style={styles.emptyTitle}>No audits yet</p>
              <p style={styles.emptySub}>Run your first compliance audit to see results here.</p>
              <Link href="/audit/new" style={styles.emptyBtn}>Run your first audit →</Link>
            </div>
          ) : (
            <div style={styles.auditList}>
              {audits.map((audit, i) => {
                const risk = RISK_CONFIG[audit.risk_score] || RISK_CONFIG.MEDIUM;
                const appName = audit.findings?.app_name || cleanUrl(audit.input_url);
                return (
                  <Link key={audit.id} href={`/audit/${audit.id}`} style={styles.auditRow}>
                    <div style={styles.auditLeft}>
                      <div style={{ ...styles.riskDot, background: risk.dot }} />
                      <div>
                        <p style={styles.auditName}>{appName}</p>
                        <p style={styles.auditUrl}>{cleanUrl(audit.input_url)}</p>
                      </div>
                    </div>
                    <div style={styles.auditRight}>
                      <span style={{ ...styles.riskBadge, background: risk.bg, color: risk.text }}>
                        {risk.label}
                      </span>
                      <span style={styles.auditDate}>{formatDate(audit.created_at)}</span>
                      <span style={styles.auditArrow}>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, accent, action }: {
  label: string; value: number; sub: string; accent: string; action?: React.ReactNode;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statAccentBar, background: accent }} />
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: accent }}>{value}</p>
      <div style={styles.statFooter}>
        <p style={styles.statSub}>{sub}</p>
        {action}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0b0f1a',
    color: '#e2e8f0',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  loadWrap: {
    minHeight: '100vh', background: '#0b0f1a',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(201,168,76,0.2)',
    borderTop: '3px solid #c9a84c',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadText: { color: '#64748b', fontSize: 14, fontFamily: 'system-ui, sans-serif' },

  // Nav
  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(11,15,26,0.95)',
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 24px',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { fontSize: 20 },
  logoText: {
    fontSize: 18, fontWeight: 700, color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navEmail: { fontSize: 13, color: '#64748b', fontFamily: 'system-ui, sans-serif' },
  signOutBtn: {
    fontSize: 13, color: '#94a3b8', background: 'none', border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },

  // Main
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' },

  pageHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 36, flexWrap: 'wrap', gap: 16,
  },
  pageTitle: {
    fontSize: 30, fontWeight: 700, color: '#f1f5f9',
    margin: 0, letterSpacing: '-0.02em',
  },
  pageSubtitle: { fontSize: 15, color: '#64748b', margin: '4px 0 0', fontFamily: 'system-ui, sans-serif' },
  newAuditBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#c9a84c', color: '#0b0f1a',
    padding: '11px 20px', borderRadius: 8,
    fontWeight: 700, fontSize: 14, textDecoration: 'none',
    letterSpacing: '0.01em', fontFamily: 'system-ui, sans-serif',
    transition: 'opacity 0.15s',
  },
  plusIcon: { fontSize: 18, lineHeight: 1 },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginBottom: 36,
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '20px 24px',
    position: 'relative', overflow: 'hidden',
  },
  statAccentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '2px 2px 0 0',
  },
  statLabel: {
    fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: 'system-ui, sans-serif',
  },
  statValue: {
    fontSize: 36, fontWeight: 700, margin: '0 0 4px', lineHeight: 1,
  },
  statFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statSub: { fontSize: 12, color: '#475569', margin: 0, fontFamily: 'system-ui, sans-serif' },
  upgradeLink: {
    fontSize: 12, color: '#c9a84c', textDecoration: 'none', fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
  },

  // Section
  section: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  sectionCount: { fontSize: 13, color: '#475569', fontFamily: 'system-ui, sans-serif' },

  // Audit rows
  auditList: { display: 'flex', flexDirection: 'column' },
  auditRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', textDecoration: 'none', color: 'inherit',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.15s',
    cursor: 'pointer',
  },
  auditLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
  riskDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  auditName: {
    fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320,
  },
  auditUrl: {
    fontSize: 12, color: '#475569', margin: 0,
    fontFamily: 'system-ui, sans-serif',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320,
  },
  auditRight: { display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 },
  riskBadge: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
    letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif',
  },
  auditDate: { fontSize: 12, color: '#475569', fontFamily: 'system-ui, sans-serif' },
  auditArrow: { fontSize: 16, color: '#334155' },

  // Empty state
  emptyState: {
    padding: '64px 24px', textAlign: 'center', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: '#94a3b8', margin: 0 },
  emptySub: { fontSize: 14, color: '#475569', margin: '4px 0 16px', fontFamily: 'system-ui, sans-serif' },
  emptyBtn: {
    fontSize: 14, color: '#c9a84c', textDecoration: 'none',
    fontWeight: 600, fontFamily: 'system-ui, sans-serif',
  },
};
