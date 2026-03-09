// src/app/api/audit/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/prompts/audit-system.txt'), 'utf8'
);

export async function POST(req: Request) {
    const { url, userId } = await req.json();

    // Check user has credits
    const { data: profile } = await supabase
        .from('profiles').select('credits').eq('id', userId).single();
    if (!profile || profile.credits < 1)
        return Response.json({ error: 'No credits' }, { status: 402 });

    // Step 1: Scrape and summarise the URL
    const scrapeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
            role: 'user', content:
                `Fetch ${url} and return JSON: {app_name, features[], data_collected[],` +
                `legal_docs_present[], has_payments, cookie_banner}. JSON only.`
        }],
    });
    const siteData = scrapeRes.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('');

    // Step 2: Full compliance analysis
    const auditRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
            role: 'user', content:
                `Site data: ${siteData}\nURL: ${url}\nRun full compliance audit.`
        }],
    });

    // ✅ Narrow the type — find the first text block explicitly
    const textBlock = auditRes.content.find(
        (b): b is Anthropic.TextBlock => b.type === 'text'
    );
    if (!textBlock) {
        return Response.json({ error: 'No text response from AI' }, { status: 500 });
    }
    const raw = textBlock.text.replace(/```json|```/g, '').trim();
    const findings = JSON.parse(raw);

    // Save to database & deduct credit
    const { data: audit } = await supabase.from('audits').insert({
        user_id: userId,
        input_url: url,
        status: 'complete',
        findings,
        risk_score: findings.risk_overall,
    }).select().single();

    await supabase.from('profiles')
        .update({ credits: profile.credits - 1 }).eq('id', userId);

    return Response.json({ auditId: audit.id, findings });
}