// src/app/audit/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function NewAudit() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    
    async function runAudit() {
        setLoading(true); setError('');
        try {
            const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userId: user?.id }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    router.push(`/audit/${data.auditId}`);
    } catch (e: any)
     { setError(e.message);
     setLoading(false); }
}

return (
<div className="max-w-2xl mx-auto mt-16 p-8">
<h1 className="text-3xl font-bold mb-2">Run Compliance Audit</h1>
<p className="text-gray-500 mb-8">
Enter your web app URL. Takes 60-90 seconds.
</p>

<input
className="w-full border rounded-lg p-4 text-lg mb-4"
placeholder="https://yourapp.com.ng"
value={url}
onChange={e => setUrl(e.target.value)}
/>
{error && <p className="text-red-600 mb-4">{error}</p>}

<button
className="w-full bg-blue-700 text-white rounded-lg p-4
font-bold disabled:opacity-50 hover:bg-blue-800"
onClick={runAudit} disabled={loading || !url}
>
{loading ? 'Analysing... (60-90s)' : 'Run Audit — 1 Credit'}
</button>
</div>
);
}