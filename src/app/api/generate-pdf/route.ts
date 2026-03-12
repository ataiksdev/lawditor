import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { auditId, findings } = await req.json();

    if (!auditId || !findings) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. Prepare temp paths for Python script
    const tmpIn = path.join(os.tmpdir(), `audit_in_${auditId}.json`);
    const tmpOut = path.join(os.tmpdir(), `audit_out_${auditId}.pdf`);
    
    fs.writeFileSync(tmpIn, JSON.stringify(findings));

    // 2. Execute Python ReportLab script
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    try {
      await execAsync(`${pythonCmd} scripts/generate_report.py "${tmpIn}" "${tmpOut}"`);
    } catch (pyErr: any) {
      console.error("Python Error:", pyErr.stderr);
      return NextResponse.json({ error: "PDF Generation Engine failed" }, { status: 500 });
    }

    // 3. Move file to public storage (for MVP/Local testing)
    const publicDir = path.join(process.cwd(), 'public', 'reports');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const publicPath = path.join(publicDir, `${auditId}.pdf`);
    fs.copyFileSync(tmpOut, publicPath);

    // 4. Update Database record via Prisma
    const downloadUrl = `/reports/${auditId}.pdf`;
    
    await prisma.audit.update({
      where: { id: auditId },
      data: { pdfPath: downloadUrl }
    });

    // 5. Cleanup temp files
    try {
      fs.unlinkSync(tmpIn);
      fs.unlinkSync(tmpOut);
    } catch (e) {
      console.warn("Temp cleanup failed:", e);
    }

    return NextResponse.json({ downloadUrl });
  } catch (error: any) {
    console.error("PDF Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}