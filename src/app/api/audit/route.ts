import Anthropic from '@anthropic-ai/sdk';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/prompts/audit-system.txt'), 'utf8'
);

const riskLevel = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const findingSchema = z.object({
  id: z.string(),
  title: z.string(),
  risk: riskLevel,
  issue: z.string(),
  applicable_law: z.array(z.string()),
  impact: z.string(),
  actions: z.array(z.string()),
});

const auditResponseSchema = z.object({
  app_name: z.string(),
  risk_overall: riskLevel,
  executive_summary: z.string(),
  findings: z.array(findingSchema),
  required_documents: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check user has credits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Step 1: Scrape and summarise the URL
    const scrapeRes = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ 
        role: 'user', 
        content: `Fetch ${url} and return JSON: {app_name, features[], data_collected[], legal_docs_present[], has_payments, cookie_banner}. JSON only.` 
      }], 
    });

    const siteData = scrapeRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Step 2: Audit the site
    const auditRes = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ 
        role: 'user', 
        content: `Site data: ${siteData}\nURL: ${url}\nRun full compliance audit.` 
      }],
    });

    const textBlock = auditRes.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    );

    if (!textBlock) {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    let findingsData;
    try {
      const parsed = JSON.parse(cleaned);
      findingsData = auditResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse audit response', error);
      return NextResponse.json({ error: 'Invalid audit response from AI' }, { status: 502 });
    }

    // Step 3: Save to database & deduct credit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the audit
      const audit = await tx.audit.create({
        data: {
          userId: user.id,
          inputUrl: url,
          status: 'complete',
          findings: findingsData as any,
          riskScore: findingsData.risk_overall,
        }
      });

      // Deduct credit
      await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } }
      });

      return audit;
    });

    return NextResponse.json({ auditId: result.id, findings: findingsData });
  } catch (error: any) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
