import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lawditor — Nigerian Legal Compliance Audits",
  description: "AI-powered compliance audits for Nigerian web apps. NDPA, FCCPA, CAMA and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          * { box-sizing: border-box; }
          a { color: inherit; }
        `}</style>
      </body>
    </html>
  );
}
