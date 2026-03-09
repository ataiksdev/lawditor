'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface Finding {
  id: string;
  title: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  applicable_law: string[];
  impact: string;
  actions: string[];
}

interface AuditData {
  id: string;
  input_url: string;
  risk_score: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  created_at: string;
  pdf_path: string | null;
  findings: {
    app_name: string;
    risk_overall: 'HIGH' | 'MEDIUM' | 'LOW';
    executive_summary: string;
    findings: Finding[];
    required_documents: string[];
    next_steps: string[];
  };
}

const RISK = {
  HIGH:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  text: '#fca5a5' },
  MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fcd34d' },
  LOW:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#6ee7b7' },
};

export default function AuditReport() {
  const params   = useParams();
  const router   = useRouter();
  const auditId  = params.id as string;

  const [audit,      setAudit]      = useState<AuditData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl,     setPdfUrl]     = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) { setError('Audit not found.'); setLoading(false); return; }
      setAudit(data);
      setLoading(false);
    })();
  }, [auditId, router]);

  async function generatePdf() {
    if (!audit) return;
    setPdfLoading(true);
    try {
      const res  = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: audit.id, findings: audit.findings }),
      });
      const data = await res.json();
      if (data.downloadUrl) setPdfUrl(data.downloadUrl);
    } catch {
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-NG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner} />
      <p style={styles.loadText}>Loading audit report…</p>
    </div>
  );

  if (error || !audit) return (
    <div style={styles.loadWrap}>
      <p style={{ color: '#f87171', fontSize: 16 }}>{error || 'Something went wrong.'}</p>
      <Link href="/dashboard" style={styles.backLink}>← Back to dashboard</Link>
    </div>
  );

  const f      = audit.findings;
  const risk   = RISK[f.risk_overall] || RISK.MEDIUM;
  const counts = {
    HIGH:   f.findings.filter(x => x.risk === 'HIGH').length,
    MEDIUM: f.findings.filter(x => x.risk === 'MEDIUM').length,
    LOW:    f.findings.filter(x => x.risk === 'LOW').length,
  };

  return (
    <div style={styles.root}>
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <Link href="/dashboard" style={styles.backLink}>
            ← Dashboard
          </Link>
          <div style={styles.logo}>
            <span>⚖</span>
            <span style={styles.logoText}>Lawditor</span>
          </div>
          <div style={styles.navActions}>
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={styles.pdfDlBtn}>
                ↓ Download PDF
              </a>
            ) : (
              <button onClick={generatePdf} disabled={pdfLoading} style={styles.pdfBtn}>
                {pdfLoading ? 'Generating…' : '↓ Export PDF'}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main style={styles.main}>

        {/* ── Hero header ──────────────────────────────────────── */}
        <div style={{ ...styles.heroCard, borderColor: risk.border, background: risk.bg }}>
          <div style={styles.heroTop}>
            <div>
              <p style={styles.heroLabel}>Compliance Audit Report</p>
              <h1 style={styles.heroTitle}>{f.app_name}</h1>
              <p style={styles.heroUrl}>{audit.input_url}</p>
            </div>
            <div style={{ ...styles.riskBadgeLarge, background: risk.bg, borderColor: risk.border }}>
              <div style={{ ...styles.riskDot, background: risk.color }} />
              <span style={{ ...styles.riskLabel, color: risk.color }}>{f.risk_overall} RISK</span>
            </div>
          </div>

          {/* Risk count pills */}
          <div style={styles.riskPills}>
            {(['HIGH','MEDIUM','LOW'] as const).map(r => (
              <div key={r} style={{ ...styles.riskPill, background: RISK[r].bg, borderColor: RISK[r].border }}>
                <span style={{ ...styles.riskPillNum, color: RISK[r].color }}>{counts[r]}</span>
                <span style={{ ...styles.riskPillLabel, color: RISK[r].text }}>{r}</span>
              </div>
            ))}
            <div style={styles.riskPill}>
              <span style={styles.riskPillNum}>{f.findings.length}</span>
              <span style={styles.riskPillLabel}>TOTAL FINDINGS</span>
            </div>
          </div>

          <p style={styles.heroDate}>Audited {formatDate(audit.created_at)}</p>
        </div>

        {/* ── Executive summary ────────────────────────────────── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionNum}>01</span> Executive Summary
          </h2>
          <p style={styles.summaryText}>{f.executive_summary}</p>
        </section>

        {/* ── Findings ──────────────────────────────────────────── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionNum}>02</span> Detailed Findings
          </h2>
          <div style={styles.findingsList}>
            {f.findings.map((finding) => {
              const fr      = RISK[finding.risk] || RISK.MEDIUM;
              const isOpen  = expanded === finding.id;
              return (
                <div key={finding.id}
                  style={{ ...styles.findingCard, borderColor: isOpen ? fr.border : 'rgba(255,255,255,0.07)' }}
                >
                  {/* Finding header — always visible */}
                  <button
                    style={styles.findingHeader}
                    onClick={() => setExpanded(isOpen ? null : finding.id)}
                  >
                    <div style={styles.findingHeaderLeft}>
                      <span style={{ ...styles.findingId, color: fr.color }}>{finding.id}</span>
                      <span style={styles.findingTitle}>{finding.title}</span>
                    </div>
                    <div style={styles.findingHeaderRight}>
                      <span style={{ ...styles.findingRiskBadge, background: fr.bg, color: fr.text }}>
                        {finding.risk}
                      </span>
                      <span style={{ ...styles.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                        ↓
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={styles.findingBody}>
                      <DetailRow label="Issue" value={finding.issue} />

                      <div style={styles.detailRow}>
                        <p style={styles.detailLabel}>Applicable Law</p>
                        <ul style={styles.lawList}>
                          {finding.applicable_law.map((l, i) => (
                            <li key={i} style={styles.lawItem}>
                              <span style={{ color: fr.color }}>§</span> {l}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <DetailRow label="Impact" value={finding.impact} />

                      <div style={styles.detailRow}>
                        <p style={styles.detailLabel}>Recommended Actions</p>
                        <ol style={styles.actionList}>
                          {finding.actions.map((a, i) => (
                            <li key={i} style={styles.actionItem}>
                              <span style={{ ...styles.actionNum, background: fr.bg, color: fr.color }}>
                                {i + 1}
                              </span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Required documents ───────────────────────────────── */}
        <div style={styles.twoCol}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>03</span> Required Documents
            </h2>
            <ul style={styles.docList}>
              {f.required_documents.map((doc, i) => (
                <li key={i} style={styles.docItem}>
                  <span style={styles.docCheck}>☐</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Next steps ───────────────────────────────────────── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>04</span> Next Steps
            </h2>
            <ol style={styles.stepList}>
              {f.next_steps.map((step, i) => (
                <li key={i} style={styles.stepItem}>
                  <span style={{
                    ...styles.stepNum,
                    background: i < 3 ? 'rgba(239,68,68,0.1)' : i < 6 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: i < 3 ? '#fca5a5' : i < 6 ? '#fcd34d' : '#6ee7b7',
                  }}>
                    {i + 1}
                  </span>
                  <span style={styles.stepText}>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ── Footer disclaimer ─────────────────────────────────── */}
        <div style={styles.disclaimer}>
          <p>⚖ AI-assisted analysis — all findings should be reviewed by a qualified Nigerian lawyer before legal action is taken.</p>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailRow}>
      <p style={styles.detailLabel}>{label}</p>
      <p style={styles.detailValue}>{value}</p>
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
    width: 36, height: 36,
    border: '3px solid rgba(201,168,76,0.2)', borderTop: '3px solid #c9a84c',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadText: { color: '#64748b', fontSize: 14, fontFamily: 'system-ui, sans-serif' },

  // Nav
  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 24px',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backLink: { fontSize: 14, color: '#94a3b8', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 },
  logoText: { fontWeight: 700, color: '#f1f5f9', fontSize: 18 },
  navActions: { display: 'flex', gap: 12 },
  pdfBtn: {
    fontSize: 13, fontWeight: 600, color: '#c9a84c',
    background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },
  pdfDlBtn: {
    fontSize: 13, fontWeight: 600, color: '#0b0f1a',
    background: '#c9a84c', border: 'none',
    borderRadius: 6, padding: '7px 16px', textDecoration: 'none',
    fontFamily: 'system-ui, sans-serif',
  },

  // Main
  main: { maxWidth: 1100, margin: '0 auto', padding: '36px 24px 80px' },

  // Hero
  heroCard: {
    border: '1px solid', borderRadius: 14,
    padding: '28px 32px', marginBottom: 28,
  },
  heroTop: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    margin: '0 0 6px', fontFamily: 'system-ui, sans-serif',
  },
  heroTitle: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' },
  heroUrl: { fontSize: 13, color: '#475569', margin: 0, fontFamily: 'system-ui, sans-serif' },
  riskBadgeLarge: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 10, border: '1px solid',
    flexShrink: 0,
  },
  riskDot: { width: 10, height: 10, borderRadius: '50%' },
  riskLabel: { fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif' },
  riskPills: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  riskPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
  },
  riskPillNum: { fontSize: 18, fontWeight: 700, lineHeight: 1 },
  riskPillLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
    color: '#64748b', fontFamily: 'system-ui, sans-serif',
  },
  heroDate: { fontSize: 12, color: '#334155', margin: 0, fontFamily: 'system-ui, sans-serif' },

  // Sections
  section: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '24px 28px', marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 600, color: '#f1f5f9',
    margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 10,
  },
  sectionNum: {
    fontSize: 11, fontWeight: 700, color: '#c9a84c',
    fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em',
  },
  summaryText: {
    fontSize: 15, color: '#94a3b8', lineHeight: 1.8,
    margin: 0, fontFamily: 'system-ui, sans-serif',
  },

  // Findings
  findingsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  findingCard: {
    border: '1px solid', borderRadius: 10, overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  findingHeader: {
    width: '100%', background: 'rgba(255,255,255,0.02)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', cursor: 'pointer', border: 'none', color: 'inherit',
    textAlign: 'left',
  },
  findingHeaderLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
  findingId: { fontSize: 12, fontWeight: 700, fontFamily: 'system-ui, sans-serif', flexShrink: 0 },
  findingTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  findingHeaderRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  findingRiskBadge: {
    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
    letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif',
  },
  chevron: { color: '#475569', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block' },

  findingBody: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.15)', padding: '0 18px',
  },
  detailRow: { padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  detailLabel: {
    fontSize: 11, fontWeight: 600, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 6px', fontFamily: 'system-ui, sans-serif',
  },
  detailValue: {
    fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.7,
    fontFamily: 'system-ui, sans-serif',
  },
  lawList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 },
  lawItem: { fontSize: 13, color: '#94a3b8', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 },
  actionList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  actionItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: 13, color: '#94a3b8', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6,
  },
  actionNum: {
    flexShrink: 0, width: 22, height: 22, borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
  },

  // Two-col layout
  twoCol: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20,
  },
  docList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  docItem: {
    display: 'flex', gap: 10, fontSize: 14, color: '#94a3b8',
    fontFamily: 'system-ui, sans-serif', lineHeight: 1.6,
  },
  docCheck: { color: '#334155', flexShrink: 0 },
  stepList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  stepItem: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    flexShrink: 0, width: 24, height: 24, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
  },
  stepText: { fontSize: 14, color: '#94a3b8', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 },

  disclaimer: {
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontSize: 12, color: '#334155',
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.6,
  },
};
