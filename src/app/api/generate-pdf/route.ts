// src/app/api/generate-pdf/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const execAsync = promisify(exec);
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
const { auditId, findings } = await req.json();

// Write findings to temp file
const tmpIn = `/tmp/audit_${auditId}.json`;
const tmpOut = `/tmp/audit_${auditId}.pdf`;
fs.writeFileSync(tmpIn, JSON.stringify(findings));

// Call your Python ReportLab script
await execAsync(`python3 scripts/generate_report.py ${tmpIn} ${tmpOut}`);

// Upload PDF to Supabase Storage
const pdfBuffer = fs.readFileSync(tmpOut);
await supabase.storage.from('reports')
.upload(`${auditId}/report.pdf`, pdfBuffer, { contentType: 'application/pdf' });

// Create a signed download URL (valid 1 hour)
const { data } = await supabase.storage.from('reports')
.createSignedUrl(`${auditId}/report.pdf`, 3600);

// Save path to audit record
await supabase.from('audits')
.update({ pdf_path: `${auditId}/report.pdf` }).eq('id', auditId);
return Response.json({ downloadUrl: data?.signedUrl });
}