import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const schedule = await prisma.therapySchedule.findUnique({
    where: { id },
    include: { sessions: { orderBy: { actualStartTime: "desc" } } },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "Jadwal tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(schedule);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const schedule = await prisma.therapySchedule.update({
      where: { id },
      data: {
        therapyType: body.therapyType ?? undefined,
        title: body.title !== undefined ? body.title : undefined,
        location: body.location !== undefined ? body.location : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        isRecurring: body.isRecurring ?? undefined,
        recurringRule: body.recurringRule !== undefined ? body.recurringRule : undefined,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : null,
        durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
        isActive: body.isActive ?? undefined,
      },
    });

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate jadwal terapi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.therapySchedule.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menonaktifkan jadwal" },
      { status: 500 }
    );
  }
}
