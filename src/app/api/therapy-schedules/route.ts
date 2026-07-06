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

  const where: Record<string, unknown> = { patientId, isActive: true };
  if (from || to) {
    where.startTime = {};
    if (from) (where.startTime as Record<string, string>).gte = new Date(from).toISOString();
    if (to) (where.startTime as Record<string, string>).lte = new Date(to).toISOString();
  }

  const schedules = await prisma.therapySchedule.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: { sessions: { orderBy: { actualStartTime: "desc" }, take: 10 } },
  });

  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const patientId = body.patientId ?? session.userId;

    if (!body.therapyType || !body.startTime) {
      return NextResponse.json(
        { error: "Tipe terapi dan waktu mulai diperlukan" },
        { status: 400 }
      );
    }

    const schedule = await prisma.therapySchedule.create({
      data: {
        patientId,
        therapyType: body.therapyType,
        title: body.title ?? null,
        location: body.location ?? null,
        notes: body.notes ?? null,
        isRecurring: body.isRecurring ?? false,
        recurringRule: body.recurringRule ?? null,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : null,
        createdById: session.userId,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan jadwal terapi" },
      { status: 500 }
    );
  }
}
