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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 90);

  const where: Record<string, unknown> = { patientId };
  if (from || to) {
    where.entryDate = {};
    if (from) (where.entryDate as Record<string, string>).gte = new Date(from).toISOString();
    if (to) (where.entryDate as Record<string, string>).lte = new Date(to).toISOString();
  }

  const logs = await prisma.dailyLog.findMany({
    where,
    orderBy: { entryDate: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const patientId = body.patientId ?? session.userId;

    if (!body.entryDate) {
      return NextResponse.json(
        { error: "Tanggal entri diperlukan" },
        { status: 400 }
      );
    }

    const log = await prisma.dailyLog.create({
      data: {
        patientId,
        entryDate: new Date(body.entryDate),
        systolicBP: body.systolicBP ? Number(body.systolicBP) : null,
        diastolicBP: body.diastolicBP ? Number(body.diastolicBP) : null,
        weight: body.weight ? Number(body.weight) : null,
        fluidIntake: body.fluidIntake ? Number(body.fluidIntake) : null,
        urineOutput: body.urineOutput ? Number(body.urineOutput) : null,
        temperature: body.temperature ? Number(body.temperature) : null,
        bloodSugar: body.bloodSugar ? Number(body.bloodSugar) : null,
        symptoms: body.symptoms ?? null,
        mood: body.mood ? Number(body.mood) : null,
        sleepDuration: body.sleepDuration ? Number(body.sleepDuration) : null,
        therapyAdherence: body.therapyAdherence ?? null,
        notes: body.notes ?? null,
        recordedById: session.userId,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan catatan harian" },
      { status: 500 }
    );
  }
}
