import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const sessionRecord = await prisma.therapySession.update({
      where: { id },
      data: {
        actualStartTime: body.actualStartTime ? new Date(body.actualStartTime) : undefined,
        actualEndTime: body.actualEndTime ? new Date(body.actualEndTime) : undefined,
        completed: body.completed ?? undefined,
        skipped: body.skipped ?? undefined,
        skipReason: body.skipReason !== undefined ? body.skipReason : undefined,
        preWeight: body.preWeight !== undefined ? Number(body.preWeight) : undefined,
        postWeight: body.postWeight !== undefined ? Number(body.postWeight) : undefined,
        preBP: body.preBP !== undefined ? body.preBP : undefined,
        postBP: body.postBP !== undefined ? body.postBP : undefined,
        symptoms: body.symptoms !== undefined ? body.symptoms : undefined,
        attendantName: body.attendantName !== undefined ? body.attendantName : undefined,
        location: body.location !== undefined ? body.location : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json(sessionRecord);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate sesi terapi" },
      { status: 500 }
    );
  }
}
