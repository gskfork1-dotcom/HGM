import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  });
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await fetch(
    `https://api.clerk.com/v1/users/${session.userId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }
  ).then((r) => r.json());

  const role = user?.unsafe_metadata?.role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { logoUrl, heroTitle, heroSubtitle } = await request.json();

    const config = await prisma.appConfiguration.upsert({
      where: { id: "global_config" },
      update: {
        logoUrl: logoUrl ?? undefined,
        landingHeroTitle: heroTitle ?? undefined,
        landingHeroSub: heroSubtitle ?? undefined,
        updatedByUserId: session.userId,
      },
      create: {
        id: "global_config",
        logoUrl: logoUrl ?? "/assets/logo-default.svg",
        landingHeroTitle: heroTitle ?? "Hidup Ginjal Muda",
        landingHeroSub: heroSubtitle ?? "",
        updatedByUserId: session.userId,
      },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan konfigurasi" },
      { status: 500 }
    );
  }
}
