'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, Globe, Terminal, ArrowLeft, Zap, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function NewAuditPage() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start audit. Check your credits.");
        setLoading(false);
      } else {
        router.push(`/audit/${data.id}`);
      }
    } catch (err) {
      setError("A network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#f2f2f2] p-8 md:p-12 lg:p-24">
      {/* Navigation */}
      <Link href="/dashboard" 
            className="inline-flex items-center space-x-3 mb-16 text-gray-400 hover:text-white transition-all font-black text-sm uppercase tracking-widest group">
        <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center transition-all group-hover:scale-110"
             style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span>Back to Registry</span>
      </Link>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,400px] gap-20">
        <div>
           <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] flex items-center justify-center"
                   style={{ boxShadow: "8px 8px 16px #161616, -8px -8px 16px #262626" }}>
                <Shield className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                Initiate Legal <br />
                <span className="text-[#d4af37]">Compliance Protocol</span>
              </h1>
           </div>

           <p className="text-xl text-gray-500 max-w-xl leading-relaxed mb-12">
             Submit your application URL for a comprehensive legal audit against 
             Nigerian frameworks (NDPA, FCCPA, NITDA, CAMA).
           </p>

           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                 <label className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] px-4 flex items-center">
                   <Terminal className="w-4 h-4 mr-2" />
                   Software or Platform Name
                 </label>
                 <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Flutterwave Checkout"
                  className="w-full bg-[#1e1e1e] border-none rounded-3xl px-8 py-6 text-xl text-white font-bold focus:outline-none placeholder:text-gray-700"
                  style={{ boxShadow: "inset 8px 8px 16px #161616, inset -8px -8px 16px #262626" }}
                  required
                />
              </div>

              <div className="space-y-4">
                 <label className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] px-4 flex items-center">
                   <Globe className="w-4 h-4 mr-2" />
                   Target Application URL
                 </label>
                 <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#1e1e1e] border-none rounded-3xl px-8 py-6 text-xl text-white font-bold focus:outline-none placeholder:text-gray-700"
                  style={{ boxShadow: "inset 8px 8px 16px #161616, inset -8px -8px 16px #262626" }}
                  required
                />
              </div>

              {error && (
                <div 
                  className="p-6 rounded-2xl bg-[#1e1e1e] text-red-400 font-bold flex items-center space-x-3 transition-all animate-in fade-in slide-in-from-top-4"
                  style={{ boxShadow: "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626" }}
                >
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-4 px-12 py-6 rounded-3xl bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white font-black text-2xl transition-all hover:scale-[1.03] active:scale-[0.97] group disabled:opacity-50"
                style={{ boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626" }}
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Execute Audit</span>
                    <Zap className="w-6 h-6 transition-all group-hover:rotate-12" />
                  </>
                )}
              </button>
           </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-10">
           <div className="p-8 rounded-[2.5rem] bg-[#1e1e1e]" 
                style={{ boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626" }}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-[#d4af37]" />
                Audit Parameters
              </h3>
              <ul className="space-y-6">
                 {[
                   { label: "Token Requirement", val: "10 Units", icon: Zap },
                   { label: "Analysis Time", val: "≈ 45 Seconds", icon: Clock },
                   { label: "Deep Crawl", val: "Enabled", icon: CheckCircle },
                 ].map((p, idx) => (
                    <li key={idx} className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center"
                            style={{ boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}>
                         <p.icon className="w-4 h-4 text-[#d4af37]" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">{p.label}</div>
                          <div className="font-bold text-white">{p.val}</div>
                       </div>
                    </li>
                 ))}
              </ul>
           </div>

           <div className="p-10 rounded-[2.5rem] bg-[#1e1e1e] text-center" 
                style={{ boxShadow: "inset 12px 12px 24px #161616, inset -12px -12px 24px #262626" }}>
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-gray-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-400 mb-2 tracking-tight">Enterprise Standard</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Lawditor uses deep-scanning to evaluate accessibility, privacy protocols and consumer protection.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}