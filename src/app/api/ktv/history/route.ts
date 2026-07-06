import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const history = await prisma.ktVCalculation.findMany({
    where: { patientId: session.userId },
    orderBy: { calculationDate: "desc" },
    take: limit,
  });

  return NextResponse.json(history);
}
