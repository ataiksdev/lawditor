"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, FileCode, Zap, CheckCircle, ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#f2f2f2]">
      {/* Header */}
      <header className="bg-[#1e1e1e] border-b border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center"
                style={{
                  boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626",
                }}
              >
                <Shield className="w-6 h-6 text-[#d4af37]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Lawditor</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl text-gray-400 font-medium transition-all"
                style={{
                  boxShadow:
                    "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl font-bold transition-all bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white"
                style={{
                  boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626",
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div
            className="inline-block mb-8 px-6 py-2 rounded-full bg-[#1e1e1e]"
            style={{
              boxShadow:
                "inset 4px 4px 8px #161616, inset -4px -4px 8px #262626",
            }}
          >
            <span className="text-sm font-semibold text-[#d4af37] uppercase tracking-widest">
              AI-Powered Legal Compliance
            </span>
          </div>
          <h2 className="text-7xl font-black text-white mb-8 leading-tight">
            Professional Software
            <br />
            Auditing Platform
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Enterprise-grade legal compliance analysis for Nigerian web applications. 
            Ensure NDPA, FCCPA, and CAMA compliance with AI-driven precision.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-3 px-10 py-5 rounded-2xl text-xl font-bold transition-all bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white group"
            style={{
              boxShadow: "10px 10px 20px #161616, -10px -10px 20px #262626",
            }}
          >
            <span>Start Free Audit</span>
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-12">
          <div
            className="p-10 rounded-[2.5rem] bg-[#1e1e1e]"
            style={{
              boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-8"
              style={{
                boxShadow:
                  "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626",
              }}
            >
              <FileCode className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Deep Tech Analysis
            </h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Advanced AI-driven analysis of your landing page and functionality for comprehensive
              legal compliance assessment.
            </p>
          </div>

          <div
            className="p-10 rounded-[2.5rem] bg-[#1e1e1e]"
            style={{
              boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-8"
              style={{
                boxShadow:
                  "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626",
              }}
            >
              <Shield className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Nigerian Frameworks
            </h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Specific verification for Nigerian standards including NDPA, FCCPA, 
              NITDA Guidelines, and CAMA 2020.
            </p>
          </div>

          <div
            className="p-10 rounded-[2.5rem] bg-[#1e1e1e]"
            style={{
              boxShadow: "12px 12px 24px #161616, -12px -12px 24px #262626",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-8"
              style={{
                boxShadow:
                  "inset 6px 6px 12px #161616, inset -6px -6px 12px #262626",
              }}
            >
              <Zap className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Instant Legal AI
            </h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Receive detailed compliance reports with actionable remediation advice
              and professional PDF exports in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-black text-white text-center mb-20 uppercase tracking-[0.2em]">
          Professional Workflow
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Setup", desc: "Create your account with 50 starter credits" },
            { step: "02", title: "Input", desc: "Submit your app URL for crawl & analysis" },
            { step: "03", title: "Audit", desc: "Claude 3.5 Sonnet performs deep evaluation" },
            { step: "04", title: "Export", desc: "Download professional PDF compliance report" }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white flex items-center justify-center mx-auto mb-8 text-3xl font-black"
                style={{
                  boxShadow: "8px 8px 16px #161616, -8px -8px 16px #262626",
                }}
              >
                {item.step}
              </div>
              <h4 className="font-bold text-white mb-4 text-xl">
                {item.title}
              </h4>
              <p className="text-gray-400 text-base leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div
          className="p-16 rounded-[3rem] bg-[#1e1e1e] text-center"
          style={{
            boxShadow: "20px 20px 40px #161616, -20px -20px 40px #262626",
          }}
        >
          <h2 className="text-5xl font-black text-white mb-6">
            Ready to Ensure Compliance?
          </h2>
          <p className="text-2xl text-gray-400 mb-12">
            Join the forward-thinking tech teams who trust Lawditor
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-3 px-12 py-6 rounded-2xl text-2xl font-bold transition-all bg-gradient-to-br from-[#d4af37] to-[#c5a028] text-white"
            style={{
              boxShadow: "10px 10px 20px #161616, -10px -10px 20px #262626",
            }}
          >
            <span>Begin Your Audit</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div
                className="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center"
                style={{
                  boxShadow: "6px 6px 12px #161616, -6px -6px 12px #262626",
                }}
              >
                <Shield className="w-6 h-6 text-[#d4af37]" />
              </div>
              <span className="text-2xl font-bold text-white">Lawditor</span>
            </div>
            <p className="text-gray-500 text-lg mb-8">
              The Enterprise AI Standard for Nigerian Compliance.
            </p>
            <div className="text-gray-600 text-sm font-medium">
              © 2026 Lawditor. Built for the future of Nigerian Law.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}