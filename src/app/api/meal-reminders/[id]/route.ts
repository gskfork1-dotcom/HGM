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
    const reminder = await prisma.mealReminder.update({
      where: { id },
      data: {
        mealTime: body.mealTime ?? undefined,
        time: body.time ?? undefined,
        isActive: body.isActive ?? undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });
    return NextResponse.json(reminder);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate" }, { status: 500 });
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
  await prisma.mealReminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
