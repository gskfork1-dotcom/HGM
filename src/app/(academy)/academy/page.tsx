import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const articles = await prisma.academyArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-hgm-cream">
        <section className="bg-gradient-to-br from-hgm-dark-bg via-hgm-dark-bg to-hgm-sapphire py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              HGM Academy
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-hgm-slate-grey">
              Pusat edukasi untuk pasien ginjal, caregiver, dan keluarga.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {articles.length === 0 && (
            <p className="text-center text-sm text-hgm-slate-grey">
              Belum ada artikel. Silakan kembali lagi nanti.
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/academy/${article.id}`}
                className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <span className="rounded bg-hgm-crimson/10 px-2 py-0.5 text-xs font-medium text-hgm-crimson">
                  {article.category}
                </span>
                <h3 className="mt-3 font-semibold text-hgm-sapphire group-hover:text-hgm-crimson">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs text-hgm-slate-grey">
                  Oleh {article.author.name ?? "HGM Team"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
