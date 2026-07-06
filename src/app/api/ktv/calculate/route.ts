import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function calcWatsonV(gender: string, age: number, height: number, weight: number): number {
  if (gender === "L") {
    return 2.447 - 0.09516 * age + 0.1074 * height + 0.3362 * weight;
  }
  return -2.097 + 0.1069 * height + 0.2466 * weight;
}

function estimateK(qb: number, qd: number): number {
  const ratios: [number, number, number][] = [
    [200, 500, 0.80], [250, 500, 0.79], [300, 500, 0.78],
    [350, 500, 0.75], [400, 500, 0.70], [300, 800, 0.82],
    [350, 800, 0.80], [400, 800, 0.76],
  ];
  let best = 0.75;
  for (const [rQb, rQd, rK] of ratios) {
    if (qb >= rQb && qd >= rQd) {
      best = rK;
    }
  }
  return Math.round(qb * best);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mode = body.mode || "kasar";

    let ktv: number;
    let status: string;
    let urr: number | null = null;

    if (mode === "lengkap") {
      const { bunPre, bunPost, durationHours, weightPre, weightPost } = body;
      if (!bunPre || !bunPost || !durationHours || !weightPost) {
        return NextResponse.json({ error: "BUN Pre, BUN Post, durasi, dan BB Post diperlukan" }, { status: 400 });
      }
      const R = bunPost / bunPre;
      const t = Number(durationHours);
      const W = Number(weightPost);
      const UF = weightPre ? Number(weightPre) - W : 0;
      ktv = Number((-Math.log(R - 0.008 * t) + (4 - 3.5 * R) * (UF / W)).toFixed(2));
      urr = Number((((bunPre - bunPost) / bunPre) * 100).toFixed(1));

      await prisma.ktVCalculation.create({
        data: {
          patientId: session.userId, mode, bunPre: Number(bunPre), bunPost: Number(bunPost),
          durationHours: t, weightPre: weightPre ? Number(weightPre) : null, weightPost: W,
          uf: UF, ktvResult: ktv, status: ktv >= 1.4 ? "optimal" : ktv >= 1.2 ? "adequate" : "inadequate",
        },
      });
    } else {
      const { qb, qd, durationHours, weightPost, uf, age, height, gender } = body;
      if (!qb || !durationHours || !weightPost) {
        return NextResponse.json({ error: "QB, durasi, dan BB Post diperlukan" }, { status: 400 });
      }

      const qbNum = Number(qb);
      const qdNum = Number(qd || 500);
      const tMin = Number(durationHours) * 60;
      const W = Number(weightPost);
      const K = estimateK(qbNum, qdNum);
      const V = (age && height && gender)
        ? calcWatsonV(gender, Number(age), Number(height), W)
        : 0.58 * W;

      const Vml = V * 1000;
      ktv = Number(((K * tMin) / Vml).toFixed(2));

      await prisma.ktVCalculation.create({
        data: {
          patientId: session.userId, mode,
          qb: qbNum, qd: qdNum, durationHours: Number(durationHours),
          weightPost: W, uf: uf ? Number(uf) : null,
          age: age ? Number(age) : null, height: height ? Number(height) : null,
          gender: gender || null,
          ktvResult: ktv,
          status: ktv >= 1.4 ? "optimal" : ktv >= 1.2 ? "adequate" : "inadequate",
        },
      });
    }

    status = ktv >= 1.4 ? "optimal" : ktv >= 1.2 ? "adequate" : "inadequate";

    return NextResponse.json({ ktv, status, urr, mode });
  } catch {
    return NextResponse.json({ error: "Gagal menghitung Kt/V" }, { status: 500 });
  }
}
