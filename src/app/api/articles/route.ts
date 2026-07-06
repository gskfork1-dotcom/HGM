import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const articles = await prisma.academyArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, category, htmlBody, isPublished } = await request.json();

    if (!title || !category || !htmlBody) {
      return NextResponse.json(
        { error: "Semua field diperlukan" },
        { status: 400 }
      );
    }

    const article = await prisma.academyArticle.create({
      data: {
        title,
        category,
        htmlBody,
        isPublished: isPublished ?? false,
        authorId: session.userId,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat artikel" },
      { status: 500 }
    );
  }
}
