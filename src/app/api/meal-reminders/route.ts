import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminders = await prisma.mealReminder.findMany({
    where: { patientId: session.userId },
    orderBy: { time: "asc" },
  });

  return NextResponse.json(reminders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.mealTime || !body.time) {
      return NextResponse.json({ error: "mealTime dan time diperlukan" }, { status: 400 });
    }

    const reminder = await prisma.mealReminder.create({
      data: {
        patientId: session.userId,
        mealTime: body.mealTime,
        time: body.time,
        isActive: body.isActive ?? true,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengingat" }, { status: 500 });
  }
}
