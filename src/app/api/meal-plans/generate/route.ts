import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const mealSuggestions: Record<string, string[]> = {
  breakfast: [
    "Nasi tim + telur rebus (rendah fosfor)",
    "Bubur ayam tanpa garam",
    "Roti tawar + selai buah (rendah protein)",
    "Nasi + tempe rebus",
  ],
  lunch: [
    "Ikan tongkol + tahu + sayur bening",
    "Ayam panggang + kentang rebus",
    "Pepes tahu + sayur bayam (rendah kalium)",
    "Ikan gurame rebus + nasi putih",
  ],
  dinner: [
    "Ayam rebus + brokoli kukus",
    "Ikan kakap + tumis kacang panjang",
    "Tahu kukus + sayur sop (tanpa wortel)",
    "Telur dadar + nasi tim",
  ],
  snack: [
    "Apel (rendah kalium)",
    "Semangka (cairan tinggi, hati-hati)",
    "Pisang sedikit + yogurt",
    "Biskuit rendah protein",
  ],
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planDate = body.date ? new Date(body.date) : new Date();
    planDate.setHours(0, 0, 0, 0);

    // Delete existing plans for this date
    await prisma.dailyMealPlan.deleteMany({
      where: {
        patientId: session.userId,
        planDate: { gte: planDate, lt: new Date(planDate.getTime() + 86400000) },
      },
    });

    const meals = ["breakfast", "lunch", "dinner", "snack"];
    const plans = [];

    for (const meal of meals) {
      const suggestions = mealSuggestions[meal] || [];
      const pick = suggestions[Math.floor(Math.random() * suggestions.length)];

      const plan = await prisma.dailyMealPlan.create({
        data: {
          patientId: session.userId,
          planDate,
          mealTime: meal,
          suggestion: pick,
          isGenerated: true,
        },
      });
      plans.push(plan);
    }

    return NextResponse.json(plans, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal generate meal plan" }, { status: 500 });
  }
}
