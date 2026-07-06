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
  const patientId = searchParams.get("patientId") ?? session.userId;
  const days = Math.min(Number(searchParams.get("days")) || 30, 90);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.dailyLog.findMany({
    where: {
      patientId,
      entryDate: { gte: since },
    },
    orderBy: { entryDate: "asc" },
  });

  const numericFields = [
    "systolicBP", "diastolicBP", "weight", "fluidIntake",
    "urineOutput", "temperature", "bloodSugar", "mood", "sleepDuration",
  ] as const;

  const stats: Record<string, { avg: number | null; min: number | null; max: number | null; count: number }> = {};
  for (const field of numericFields) {
    const values = logs
      .map((l) => l[field])
      .filter((v): v is number => v !== null);
    stats[field] = {
      avg: values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      count: values.length,
    };
  }

  const therapyAdherenceTotal = logs.filter((l) => l.therapyAdherence !== null).length;
  const therapyAdherenceYes = logs.filter((l) => l.therapyAdherence === true).length;
  const therapyAdherencePct = therapyAdherenceTotal > 0
    ? Math.round((therapyAdherenceYes / therapyAdherenceTotal) * 100)
    : null;

  return NextResponse.json({
    period: { days, since, totalEntries: logs.length },
    stats,
    therapyAdherence: {
      total: therapyAdherenceTotal,
      completed: therapyAdherenceYes,
      percentage: therapyAdherencePct,
    },
    logs,
  });
}
