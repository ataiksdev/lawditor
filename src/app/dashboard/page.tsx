"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  LogOut,
  Zap,
  LayoutDashboard,
  CreditCard,
  Settings
} from "lucide-react";
import Link from "next/link";

interface Audit {
  id: string;
  softwareName: string;
  websiteUrl: string;
  status: string;
  tokenCost: number;
  createdAt: string;
}

interface UserProfile {
  credits: number;
  plan: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-[#d4af37]";
      case "failed": return "text-red-400";
      case "processing": return "text-blue-400";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-[#d4af37]" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "processing":
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/5 border-t-[#d4af37] rounded-full animate-spin" />
          <div className="text-xl font-bold text-white/50 animate-pulse">Initializing Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#f2f2f2] flex">
      {/* Sidebar - Neumorphic Sidebar */}
      <aside className="w-72 bg-[#1e1e1e] border-r border-white/5 flex flex-col p-8 pt-10">
        <div className="flex items-center space-x-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center"
               style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
            <Shield className="w-5 h-5 text-[#d4af37]" />
          </div>
          <span className="text-xl font-black tracking-tight">Lawditor</span>
        </div>

        <nav className="flex-1 space-y-4">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true, href: "/dashboard" },
            { icon: FileText, label: "My Audits", active: false, href: "/dashboard" },
            { icon: CreditCard, label: "Billing", active: false, href: "/billing" },
            { icon: Settings, label: "Api Access", active: false, href: "/dashboard" },
          ].map((item, idx) => (
            <Link key={idx} href={item.href} 
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${item.active ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                  style={item.active ? { boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" } : {}}>
              <item.icon className={`w-5 h-5 ${item.active ? 'text-[#d4af37]' : ''}`} />
              <span className="font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button onClick={() => signOut()} 
                className="flex items-center space-x-4 p-4 rounded-xl text-red-400/60 hover:text-red-400 transition-all font-bold mt-auto"
                style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        {/* Header Section */}
        <header className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Professional Portal</h2>
            <h1 className="text-5xl font-black text-white">
              Welcome, {profile?.name || session?.user?.email?.split('@')[0]}
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className="px-6 py-4 rounded-2xl bg-[#1e1e1e]" 
                  style={{ boxShadow: "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626" }}>
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center">
                 <Zap className="w-3 h-3 text-[#d4af37] mr-1" />
                 Credits Available
               </div>
               <div className="text-2xl font-black text-white flex items-baseline">
                 {profile?.credits}
                 <span className="text-xs text-[#d4af37] ml-2">UNITS</span>
               </div>
             </div>
             
             <Link href="/audit/new" 
                   className="px-8 py-5 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white font-black text-lg flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                   style={{ boxShadow: "10px 10px 20px #161616, -10px -10px 20px #262626" }}>
               <Plus className="w-6 h-6" />
               <span>Initiate Audit</span>
             </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-10 mb-16">
          {[
            { label: "Total Engagements", val: audits.length, icon: FileText, color: "#d4af37" },
            { label: "Active Compliance", val: audits.filter(a => a.status === 'completed').length, icon: CheckCircle, color: "#22c55e" },
            { label: "Account Tier", val: profile?.plan || "Professional", icon: Shield, color: "#3b82f6" },
          ].map((stat, idx) => (
            <div key={idx} className="p-8 rounded-[2rem] bg-[#1e1e1e]" 
                 style={{ boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626" }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center"
                     style={{ boxShadow: "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626" }}>
                  <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                  <div className="text-4xl font-black text-white mt-1">{stat.val}</div>
                </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: stat.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Audits Table - Neumorphic Style */}
        <div className="rounded-[2.5rem] bg-[#1e1e1e]" 
             style={{ boxShadow: "15px 15px 30px #161616, -15px -15px 30px #262626" }}>
          <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white tracking-tight">Protocol History</h2>
            <Link href="/dashboard" className="text-sm font-bold text-[#d4af37] hover:underline">View All Records</Link>
          </div>

          <div className="p-4">
            {audits.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-[#1e1e1e] flex items-center justify-center mx-auto mb-8"
                     style={{ boxShadow: "inset 10px 10px 20px #161616, inset -10px -10px 20px #262626" }}>
                  <FileText className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Registry is Empty</h3>
                <p className="text-gray-600 max-w-sm mx-auto mb-8">No compliance audits have been initiated on this account yet.</p>
                <Link href="/audit/new" className="text-[#d4af37] font-black text-lg hover:underline underline-offset-8">Execute your first professional audit →</Link>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {audits.map((audit) => (
                  <Link key={audit.id} href={`/audit/${audit.id}`} 
                        className="block p-6 rounded-3xl transition-all hover:bg-white/[0.02]"
                        style={{ boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626" }}>
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mr-6"
                           style={{ boxShadow: "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626" }}>
                        {getStatusIcon(audit.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                           <h3 className="text-xl font-black text-white tracking-tight">{audit.softwareName}</h3>
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 ${getStatusColor(audit.status)}`}>
                             {audit.status}
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 font-bold">{audit.websiteUrl}</p>
                      </div>
                      <div className="text-right flex items-center space-x-12">
                         <div className="text-left">
                           <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Engaged on</div>
                           <div className="text-sm font-bold text-gray-400">{new Date(audit.createdAt).toLocaleDateString()}</div>
                         </div>
                         <div className="text-left min-w-[100px]">
                           <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Token Cost</div>
                           <div className="text-sm font-black text-white">{audit.tokenCost} UNITS</div>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center"
                              style={{ boxShadow: "4px 4px 8px #161616, -4px -4px 8px #262626" }}>
                            <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                         </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
