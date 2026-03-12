'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  inputUrl: string;
  riskScore: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  createdAt: string;
  pdfPath: string | null;
  findings: {
    app_name: string;
    risk_overall: 'HIGH' | 'MEDIUM' | 'LOW';
    executive_summary: string;
    findings: Finding[];
    required_documents: string[];
    next_steps: string[];
  };
}

const RISK_CONFIG = {
  HIGH:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#fca5a5' },
  MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#fcd34d' },
  LOW:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#6ee7b7' },
};

export default function AuditReport() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const { data: session, status } = useSession();

  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchAudit();
    }
  }, [status, auditId, router]);

  async function fetchAudit() {
    try {
      const res = await fetch(`/api/audit/${auditId}`);
      if (!res.ok) throw new Error("Report not found or unauthorized");
      const data = await res.json();
      setAudit(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generatePdf() {
    if (!audit) return;
    setPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
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

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Fetching Legal Data</p>
    </div>
  );

  if (error || !audit) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center text-white">
      <div className="text-4xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold mb-4">{error || 'Something went wrong.'}</h1>
      <Link href="/dashboard" className="text-emerald-400 font-bold hover:underline">← Return to dashboard</Link>
    </div>
  );

  const f = audit.findings;
  const risk = RISK_CONFIG[audit.riskScore] || RISK_CONFIG.MEDIUM;
  const counts = {
    HIGH: f.findings.filter(x => x.risk === 'HIGH').length,
    MEDIUM: f.findings.filter(x => x.risk === 'MEDIUM').length,
    LOW: f.findings.filter(x => x.risk === 'LOW').length,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-[serif]">
      {/* Dynamic Header */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-sm font-medium">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">⚖</span>
            <span className="font-extrabold text-lg tracking-tight">Lawditor</span>
          </div>
          <div className="flex items-center gap-4">
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-emerald-500 text-black font-black rounded-xl shadow-lg shadow-emerald-500/10 text-sm">
                Download PDF
              </a>
            ) : (
              <button 
                onClick={generatePdf} 
                disabled={pdfLoading} 
                className="px-6 py-2.5 bg-white/5 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-sm disabled:opacity-50"
              >
                {pdfLoading ? 'Building Report...' : 'Export PDF'}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Report Hero */}
        <div className="bg-[#0f0f0f] border rounded-[40px] p-10 mb-12 shadow-2xl relative overflow-hidden" style={{ borderColor: risk.border }}>
          <div className="absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none opacity-20 -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: risk.color }} />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-3">Audit Certificate</p>
              <h1 className="text-5xl font-black mb-2 tracking-tight text-white">{f.app_name}</h1>
              <p className="text-white/40 text-lg">{audit.inputUrl}</p>
            </div>
            <div className="px-8 py-5 rounded-3xl border flex items-center gap-4 bg-black/40 backdrop-blur-md" style={{ borderColor: risk.border }}>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: risk.color }} />
              <span className="text-sm font-black tracking-widest uppercase" style={{ color: risk.color }}>{audit.riskScore} RISK OVERALL</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <Pill label="High Risk" count={counts.HIGH} color={RISK_CONFIG.HIGH.color} />
            <Pill label="Medium Risk" count={counts.MEDIUM} color={RISK_CONFIG.MEDIUM.color} />
            <Pill label="Low Risk" count={counts.LOW} color={RISK_CONFIG.LOW.color} />
            <Pill label="Total Findings" count={f.findings.length} color="#64748b" />
          </div>

          <p className="text-white/20 text-xs font-medium tracking-wide">
            AUDIT FINALIZED ON: {formatDate(audit.createdAt).toUpperCase()}
          </p>
        </div>

        {/* Executive Summary */}
        <section className="mb-16">
          <SectionHeader number="01" title="Special Executive Review" />
          <div className="bg-[#0f0f0f] border border-white/5 p-10 rounded-[40px] shadow-lg">
             <p className="text-xl text-white/70 leading-[1.8] font-medium italic">"{f.executive_summary}"</p>
          </div>
        </section>

        {/* Findings */}
        <section className="mb-16">
          <SectionHeader number="02" title="Detailed Statutory Violations" />
          <div className="space-y-4">
            {f.findings.map((finding) => {
              const fr = RISK_CONFIG[finding.risk] || RISK_CONFIG.MEDIUM;
              const isOpen = expanded === finding.id;
              return (
                <div 
                  key={finding.id} 
                  className={`bg-[#0f0f0f] border rounded-[28px] overflow-hidden transition-all ${isOpen ? 'ring-1' : ''}`}
                  style={{ ringColor: fr.border, borderColor: isOpen ? fr.border : 'rgba(255,255,255,0.05)' }}
                >
                  <button 
                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpanded(isOpen ? null : finding.id)}
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black p-2 rounded-lg bg-white/5 w-10 text-center" style={{ color: fr.color }}>{finding.id}</span>
                      <h3 className="text-lg font-bold text-white/90">{finding.title}</h3>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-black px-4 py-1.5 rounded-full border tracking-widest uppercase" style={{ backgroundColor: fr.bg, borderColor: fr.border, color: fr.text }}>
                        {finding.risk}
                      </span>
                      <span className={`text-xl transition-all ${isOpen ? 'rotate-180' : ''}`}>↓</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-8 pb-8 pt-4 border-t border-white/5 space-y-8 bg-black/20">
                      <DetailBlock label="The Infraction" value={finding.issue} />
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/25 uppercase tracking-widest">Statutory Framework</label>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {finding.applicable_law.map((law, i) => (
                             <li key={i} className="text-sm text-emerald-400/70 py-2 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                               <span className="font-bold mr-2 text-emerald-500">§</span> {law}
                             </li>
                           ))}
                         </ul>
                      </div>

                      <DetailBlock label="Potential Liability / Risk" value={finding.impact} />

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/25 uppercase tracking-widest">Remediation Roadmap</label>
                        <div className="space-y-3">
                          {finding.actions.map((action, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black shrink-0" style={{ color: fr.color }}>{i+1}</span>
                              <p className="text-sm text-white/60 leading-relaxed">{action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section>
              <SectionHeader number="03" title="Documents Required" />
              <div className="bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 space-y-4">
                {f.required_documents.map((doc, i) => (
                  <div key={i} className="flex gap-4 text-white/60 items-center">
                    <div className="w-5 h-5 border border-white/10 rounded flex items-center justify-center text-[10px]">☐</div>
                    <span className="text-sm font-medium">{doc}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeader number="04" title="Strategic Next Steps" />
              <div className="bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 space-y-6">
                {f.next_steps.map((step, i) => (
                   <div key={i} className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-emerald-400 shrink-0">{i+1}</span>
                      <p className="text-sm text-white/60 leading-relaxed">{step}</p>
                   </div>
                ))}
              </div>
            </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
           <p className="text-white/20 text-xs italic tracking-wide max-w-2xl mx-auto">
             Disclaimer: This is an AI-generated regulatory compliance report for guidance purposes only. Consult with a qualified Nigerian Legal Professional (NBA) for formal advisory.
           </p>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ number, title }: any) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="text-sm font-black text-emerald-500 tracking-[0.2em]">{number}</span>
      <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
      <div className="h-[1px] bg-white/5 flex-grow" />
    </div>
  );
}

function Pill({ label, count, color }: any) {
  return (
    <div className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3">
       <span className="text-xl font-black tabular-nums" style={{ color }}>{count}</span>
       <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function DetailBlock({ label, value }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/25 uppercase tracking-widest">{label}</label>
      <p className="text-sm text-white/60 leading-relaxed">{value}</p>
    </div>
  );
}
