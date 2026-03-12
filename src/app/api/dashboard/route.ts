import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // NextAuth stores user email, we use that to find the user in Prisma
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      credits: user.credits,
      plan: user.plan,
      email: user.email,
      name: user.name
    },
    audits: user.audits
  });
}
