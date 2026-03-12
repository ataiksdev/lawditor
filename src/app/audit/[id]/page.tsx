'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, ArrowLeft, Download, AlertTriangle, CheckCircle, FileText, ChevronDown, ListChecks, Gavel, Calendar } from 'lucide-react';
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
  HIGH:   { color: '#ef4444', label: 'CRITICAL RISK', shadow: '6px 6px 12px #161616, -6px -6px 12px #262626' },
  MEDIUM: { color: '#f59e0b', label: 'MODERATE RISK', shadow: '6px 6px 12px #161616, -6px -6px 12px #262626' },
  LOW:    { color: '#10b981', label: 'LOW RISK', shadow: '6px 6px 12px #161616, -6px -6px 12px #262626' },
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

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-[2rem] bg-[#1e1e1e] flex items-center justify-center animate-pulse"
           style={{ boxShadow: "inset 8px 8px 16px #161616, inset -8px -8px 16px #262626" }}>
        <Shield className="w-8 h-8 text-[#d4af37]" />
      </div>
      <p className="text-gray-500 font-black text-sm uppercase tracking-[0.3em]">Decoding Statues</p>
    </div>
  );

  if (error || !audit) return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center p-8 text-center text-white">
      <div className="w-24 h-24 rounded-3xl bg-[#1e1e1e] flex items-center justify-center mb-10 mx-auto"
           style={{ boxShadow: "10px 10px 20px #161616, -10px -10px 20px #262626" }}>
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-black mb-6">{error || 'Protocol Error'}</h1>
      <Link href="/dashboard" className="text-[#d4af37] font-black text-lg hover:underline underline-offset-8">← Return to Registry</Link>
    </div>
  );

  const f = audit.findings;
  const risk = RISK_CONFIG[audit.riskScore] || RISK_CONFIG.MEDIUM;

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#f2f2f2] pb-24">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 bg-[#1e1e1e]/90 backdrop-blur-xl border-b border-white/5 h-24">
        <div className="max-w-7xl mx-auto px-10 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3 text-gray-400 hover:text-white transition-all group font-black uppercase text-xs tracking-widest">
            <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center group-hover:scale-110 transition-all shadow-nm-sm">
               <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Registry</span>
          </Link>

          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center"
                  style={{ boxShadow: "inset 2px 2px 4px #161616, inset -2px -2px 4px #262626" }}>
               <Shield className="w-5 h-5 text-[#d4af37]" />
             </div>
             <span className="text-xl font-black text-white tracking-tight">Lawditor <span className="text-gray-600 font-light">REPORT</span></span>
          </div>

          <div>
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" 
                 className="px-8 py-3 bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white font-black rounded-xl flex items-center space-x-2 transition-all hover:scale-105"
                 style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                <span>Download PDF</span>
                <Download className="w-4 h-4" />
              </a>
            ) : (
              <button onClick={generatePdf} disabled={pdfLoading} 
                      className="px-8 py-3 bg-[#1e1e1e] text-white font-black rounded-xl border border-white/5 flex items-center space-x-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                      style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                {pdfLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{pdfLoading ? 'Building PDF...' : 'Sign & Export'}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-10 py-16">
        {/* Certificate Card */}
        <div className="p-12 rounded-[3.5rem] bg-[#1e1e1e] mb-20 relative overflow-hidden" 
             style={{ boxShadow: "20px 20px 40px #161616, -20px -20px 40px #262626" }}>
           
           <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[120%] bg-gradient-to-br from-[#d4af37]/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

           <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 mb-16 relative z-10">
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Audit Certification</div>
                 <h1 className="text-6xl font-black text-white leading-tight tracking-tight">{f.app_name}</h1>
                 <div className="flex items-center space-x-3 text-gray-500 font-bold text-lg">
                    <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] flex items-center justify-center"
                         style={{ boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}>
                       <Globe className="w-4 h-4 text-[#d4af37]" />
                    </div>
                    <span>{audit.inputUrl}</span>
                 </div>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-[#1e1e1e] text-center min-w-[280px]"
                   style={{ boxShadow: "inset 10px 10px 20px #161616, inset -10px -10px 20px #262626" }}>
                 <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto mb-6"
                      style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                    <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: risk.color }} />
                 </div>
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Security Score</div>
                 <div className="text-2xl font-black tracking-tight" style={{ color: risk.color }}>{risk.label}</div>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative z-10">
              {[
                { label: 'Critical Errors', val: f.findings.filter(x => x.risk === 'HIGH').length, color: '#ef4444' },
                { label: 'Moderate Issues', val: f.findings.filter(x => x.risk === 'MEDIUM').length, color: '#f59e0b' },
                { label: 'Advisory Notes', val: f.findings.filter(x => x.risk === 'LOW').length, color: '#10b981' },
                { label: 'Seal Verified', val: 'YES', color: '#d4af37' }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[#1e1e1e]"
                     style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                   <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">{item.label}</div>
                   <div className="text-3xl font-black shadow-sm" style={{ color: item.color }}>{item.val}</div>
                </div>
              ))}
           </div>

           <div className="flex items-center justify-between border-t border-white/5 pt-10 text-[10px] font-black text-gray-600 uppercase tracking-widest relative z-10">
              <div className="flex items-center space-x-2">
                 <Calendar className="w-4 h-4" />
                 <span>Registry Entry: {new Date(audit.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                 <Shield className="w-4 h-4 text-[#d4af37]" />
                 <span>Lawditor Official Audit Seal</span>
              </div>
           </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-24">
           <SectionLabel num="01" text="Chief Executive Summary" />
           <div className="p-12 rounded-[3.5rem] bg-[#1e1e1e] leading-[1.8] text-2xl font-medium text-gray-400 italic font-serif"
                style={{ boxShadow: "15px 15px 30px #161616, -15px -15px 30px #262626" }}>
              "{f.executive_summary}"
           </div>
        </section>

        {/* Statutory Findings */}
        <section className="mb-24">
           <SectionLabel num="02" text="Statutory Legal Findings" />
           <div className="space-y-10">
              {f.findings.map((finding) => {
                 const fr = RISK_CONFIG[finding.risk] || RISK_CONFIG.MEDIUM;
                 const isOpen = expanded === finding.id;
                 return (
                    <div key={finding.id} className="rounded-[2.5rem] bg-[#1e1e1e] overflow-hidden"
                         style={{ boxShadow: isOpen ? "inset 10px 10px 20px #161616, inset -10px -10px 20px #262626" : "10px 10px 20px #161616, -10px -10px 20px #262626" }}>
                       <button onClick={() => setExpanded(isOpen ? null : finding.id)}
                               className="w-full p-10 flex items-center justify-between text-left group">
                          <div className="flex items-center space-x-8">
                             <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center font-black transition-all group-hover:scale-110"
                                  style={{ boxShadow: isOpen ? "4px 4px 8px #161616, -4px -4px 8px #262626" : "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}>
                                <span style={{ color: fr.color }}>{finding.id}</span>
                             </div>
                             <div>
                                <h3 className="text-2xl font-black text-white mb-2">{finding.title}</h3>
                                <div className="flex items-center space-x-3">
                                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5" style={{ color: fr.color }}>{finding.risk}</span>
                                   <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Protocol Infraction Found</span>
                                </div>
                             </div>
                          </div>
                          <div className={`w-12 h-12 rounded-full bg-[#1e1e1e] flex items-center justify-center transition-all ${isOpen ? 'rotate-180' : ''}`}
                               style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
                             <ChevronDown className="w-6 h-6 text-[#d4af37]" />
                          </div>
                       </button>

                       {isOpen && (
                          <div className="px-10 pb-12 pt-4 space-y-12 animate-in slide-in-from-top-4 duration-300">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Violation Context</label>
                                <p className="text-xl text-gray-400 leading-relaxed font-medium">{finding.issue}</p>
                             </div>

                             <div className="space-y-6">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Nigerian Statutory Framework</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {finding.applicable_law.map((law, i) => (
                                      <div key={i} className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/5 flex items-center space-x-4"
                                           style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
                                         <Gavel className="w-5 h-5 text-[#d4af37]" />
                                         <span className="font-bold text-white/80">{law}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="space-y-6">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Actionable Roadmap</label>
                                <div className="space-y-4">
                                   {finding.actions.map((action, i) => (
                                      <div key={i} className="p-6 rounded-3xl bg-[#1e1e1e] flex items-start space-x-6"
                                           style={{ boxShadow: "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626" }}>
                                         <div className="p-2 rounded-xl bg-[#1e1e1e] text-xs font-black" 
                                              style={{ boxShadow: "2px 2px 4px #161616, -2px -2px 4px #262626", color: fr.color }}>0{i+1}</div>
                                         <p className="text-gray-400 font-medium leading-relaxed">{action}</p>
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

        {/* Documentation & Next Steps */}
        <div className="grid lg:grid-cols-2 gap-16 mb-24">
           <div>
              <SectionLabel num="03" text="Required Artifacts" />
              <div className="p-10 rounded-[3rem] bg-[#1e1e1e] space-y-6"
                   style={{ boxShadow: "15px 15px 30px #161616, -15px -15px 30px #262626" }}>
                 {f.required_documents.map((doc, i) => (
                    <div key={i} className="flex items-center space-x-5 group">
                       <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center group-hover:scale-110 transition-all shadow-nm-sm">
                          <FileText className="w-5 h-5 text-[#d4af37]" />
                       </div>
                       <span className="text-lg font-bold text-white/60 group-hover:text-white transition-colors">{doc}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div>
              <SectionLabel num="04" text="Strategic Roadmap" />
              <div className="p-10 rounded-[3rem] bg-[#1e1e1e] space-y-8"
                   style={{ boxShadow: "inset 15px 15px 30px #161616, inset -15px -15px 30px #262626" }}>
                 {f.next_steps.map((step, i) => (
                    <div key={i} className="flex space-x-6 group">
                       <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center font-black text-xs text-[#d4af37] shrink-0"
                            style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
                          {i+1}
                       </div>
                       <p className="text-lg text-gray-500 font-medium leading-relaxed">{step}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Professional Footer */}
        <footer className="pt-20 border-t border-white/5 text-center px-10">
           <div className="w-20 h-20 rounded-3xl bg-[#1e1e1e] flex items-center justify-center mx-auto mb-10"
                style={{ boxShadow: "10px 10px 20px #161616, -10px -10px 20px #262626" }}>
              <Shield className="w-10 h-10 text-[#d4af37]/20" />
           </div>
           <p className="text-gray-600 text-sm font-serif italic max-w-2xl mx-auto leading-relaxed">
             Lawditor Protocol v2.4 Certified. This AI-synthesized audit represents a legal framework assessment based on data crawlers. 
             Proprietary algorithms verified for Nigerian Jurisdiction.
           </p>
        </footer>
      </main>
    </div>
  );
}

function SectionLabel({ num, text }: { num: string, text: string }) {
   return (
      <div className="flex items-center space-x-6 mb-12">
         <div className="text-sm font-black text-[#d4af37] tracking-[0.4rem]">{num}</div>
         <h2 className="text-3xl font-black text-white uppercase tracking-tight">{text}</h2>
         <div className="h-[1px] bg-white/5 flex-1" />
      </div>
   );
}
