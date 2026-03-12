'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewAudit() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function runAudit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }), // NextAuth takes care of userId on the backend
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed to start");
      
      router.push(`/audit/${data.auditId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
       <div className="max-w-2xl mx-auto pt-32 relative">
           {/* Background Decoration */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
           
           <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors mb-12 inline-block text-sm font-medium">
             ← Back to Dashboard
           </Link>

           <div className="mb-12">
             <h1 className="text-5xl font-black mb-4 tracking-tight">Launch New Audit</h1>
             <p className="text-white/40 text-lg leading-relaxed">
               Enter your application URL below. Our AI will conduct a deep analysis of your compliance with CAMA, NDPA, and FCCPA regulations.
             </p>
           </div>

           <div className="space-y-6 relative z-10">
             <div className="space-y-2">
               <label className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase px-1">Application URL</label>
               <input
                 type="url"
                 className="w-full bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 text-xl outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/10"
                 placeholder="https://yourstartup.com"
                 value={url}
                 onChange={e => setUrl(e.target.value)}
                 disabled={loading}
               />
             </div>

             {error && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
                 {error}
               </div>
             )}

             <button
               className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-2xl ${
                 loading 
                   ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                   : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
               }`}
               onClick={runAudit}
               disabled={loading || !url}
             >
               {loading ? (
                 <div className="flex items-center justify-center gap-4">
                   <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                   <span>Analysing Site Compliance...</span>
                 </div>
               ) : 'Run Legal Audit (1 Credit)'}
             </button>

             <p className="text-center text-white/20 text-sm italic">
               Typical analysis time: 60 - 90 seconds
             </p>
           </div>
       </div>
    </div>
  );
}