// src/app/billing/page.tsx
'use client';
import { createClient } from '@/lib/supabase-client';
const PLANS = [
{ name:'Starter', credits:10, kobo:500000, label:'■5,000 / 10 audits' },
{ name:'Growth', credits:50, kobo:2000000, label:'■20,000 / 50 audits' },
{ name:'Enterprise', credits:999, kobo:8000000, label:'■80,000 / Unlimited' },
];


async function handlePayment(plan: typeof PLANS[0], email: string) {
    const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: plan.kobo,
        currency: 'NGN',
        ref: `audit_${Date.now()}`,
callback: async (response: { reference: string }) => {
    await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reference: response.reference,
            credits: plan.credits
        }),
    });
    window.location.reload();
},
});
handler.openIframe();
}
