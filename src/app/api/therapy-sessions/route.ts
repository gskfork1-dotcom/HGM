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
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const sessions = await prisma.therapySession.findMany({
    where: { patientId },
    orderBy: { actualStartTime: "desc" },
    take: limit,
    include: { schedule: { select: { therapyType: true, title: true } } },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.scheduleId) {
      return NextResponse.json(
        { error: "ID jadwal diperlukan" },
        { status: 400 }
      );
    }

    // Verify schedule exists and belongs to user
    const schedule = await prisma.therapySchedule.findUnique({
      where: { id: body.scheduleId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    const sessionRecord = await prisma.therapySession.create({
      data: {
        scheduleId: body.scheduleId,
        patientId: schedule.patientId,
        actualStartTime: body.actualStartTime ? new Date(body.actualStartTime) : null,
        actualEndTime: body.actualEndTime ? new Date(body.actualEndTime) : null,
        completed: body.completed ?? true,
        skipped: body.skipped ?? false,
        skipReason: body.skipReason ?? null,
        preWeight: body.preWeight ? Number(body.preWeight) : null,
        postWeight: body.postWeight ? Number(body.postWeight) : null,
        preBP: body.preBP ?? null,
        postBP: body.postBP ?? null,
        symptoms: body.symptoms ?? null,
        attendantName: body.attendantName ?? null,
        location: body.location ?? null,
        notes: body.notes ?? null,
        confirmedById: session.userId,
      },
    });

    return NextResponse.json(sessionRecord, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan sesi terapi" },
      { status: 500 }
    );
  }
}
