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
  const log = await prisma.dailyLog.findUnique({ where: { id } });

  if (!log) {
    return NextResponse.json(
      { error: "Catatan tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(log);
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
    const log = await prisma.dailyLog.update({
      where: { id },
      data: {
        systolicBP: body.systolicBP !== undefined ? Number(body.systolicBP) : undefined,
        diastolicBP: body.diastolicBP !== undefined ? Number(body.diastolicBP) : undefined,
        weight: body.weight !== undefined ? Number(body.weight) : undefined,
        fluidIntake: body.fluidIntake !== undefined ? Number(body.fluidIntake) : undefined,
        urineOutput: body.urineOutput !== undefined ? Number(body.urineOutput) : undefined,
        temperature: body.temperature !== undefined ? Number(body.temperature) : undefined,
        bloodSugar: body.bloodSugar !== undefined ? Number(body.bloodSugar) : undefined,
        symptoms: body.symptoms !== undefined ? body.symptoms : undefined,
        mood: body.mood !== undefined ? Number(body.mood) : undefined,
        sleepDuration: body.sleepDuration !== undefined ? Number(body.sleepDuration) : undefined,
        therapyAdherence: body.therapyAdherence !== undefined ? body.therapyAdherence : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json(log);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate catatan harian" },
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
    await prisma.dailyLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus catatan harian" },
      { status: 500 }
    );
  }
}
