// src/app/api/billing/verify/route.ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
const { reference, credits, userId } = await req.json();

// Verify payment with Paystack API
const verify = await fetch(
`https://api.paystack.co/transaction/verify/${reference}`,
{ headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
);


const { data } = await verify.json();
if (data.status !== 'success')
return Response.json({ error: 'Payment failed' }, { status: 400 });


// Add credits to the user account
const { data: profile } = await supabase
.from('profiles').select('credits').eq('id', userId).single();
await supabase.from('profiles')

.update({ credits: (profile?.credits || 0) + credits }).eq('id', userId);
return Response.json({ success: true });
}
