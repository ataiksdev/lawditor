import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference, credits, planName } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    // 1. Verify payment with Paystack API
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { 
        headers: { 
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` 
        } 
      }
    );

    const { data } = await verifyRes.json();
    
    if (!data || data.status !== 'success') {
      return NextResponse.json({ error: 'Payment failed verification' }, { status: 400 });
    }

    // 2. Add credits to the user account in Prisma
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        credits: { increment: credits },
        plan: planName || undefined
      }
    });

    return NextResponse.json({ 
      success: true, 
      newBalance: updatedUser.credits 
    });
  } catch (error: any) {
    console.error("Billing verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
