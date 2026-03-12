import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: { user: true }
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Security check: Only the owner can view the audit
  if (audit.user.email !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized access to this report" }, { status: 403 });
  }

  return NextResponse.json(audit);
}
