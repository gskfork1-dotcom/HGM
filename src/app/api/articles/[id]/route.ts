import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.academyArticle.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!article) {
    return NextResponse.json(
      { error: "Artikel tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
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
    const { title, category, htmlBody, isPublished } = await request.json();

    const article = await prisma.academyArticle.update({
      where: { id },
      data: { title, category, htmlBody, isPublished },
    });

    return NextResponse.json(article);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate artikel" },
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
    await prisma.academyArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus artikel" },
      { status: 500 }
    );
  }
}
