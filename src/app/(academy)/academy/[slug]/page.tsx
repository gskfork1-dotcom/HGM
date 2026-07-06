import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.academyArticle.findUnique({
    where: { id: slug },
    include: { author: { select: { name: true } } },
  });

  if (!article || !article.isPublished) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-hgm-cream">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="rounded bg-hgm-crimson/10 px-2 py-0.5 text-xs font-medium text-hgm-crimson">
              {article.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold text-hgm-sapphire">
              {article.title}
            </h1>
            <p className="mt-2 text-sm text-hgm-slate-grey">
              Oleh {article.author.name ?? "HGM Team"}
            </p>
          </div>
          <div
            className="prose prose-hgm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.htmlBody }}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
