import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.unsafeMetadata?.role as string) ?? "";

  if (role !== "SUPER_ADMIN" && role !== "CONTENT_EDITOR") {
    redirect("/admin");
  }

  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  });

  const articles = await prisma.academyArticle.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-hgm-cream">
      <AdminHeader
        user={{
          name: user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? "",
          email: user?.emailAddresses[0]?.emailAddress ?? "",
          role,
        }}
        logoUrl={config?.logoUrl}
      />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-hgm-sapphire">
                Artikel Academy
              </h1>
              <p className="mt-1 text-sm text-hgm-slate-grey">
                Kelola konten edukasi HGM Academy.
              </p>
            </div>
            <Link
              href="/admin/articles/new"
              className="rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-hgm-crimson/90"
            >
              + Artikel Baru
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {articles.length === 0 && (
              <p className="rounded-xl border border-hgm-sapphire/10 bg-white p-6 text-center text-sm text-hgm-slate-grey">
                Belum ada artikel. Klik &ldquo;+ Artikel Baru&rdquo; untuk
                memulai.
              </p>
            )}

            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/articles/${article.id}`}
                className="block rounded-xl border border-hgm-sapphire/10 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-hgm-sapphire">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-xs text-hgm-slate-grey">
                      {article.category} &middot;{" "}
                      {article.author.name ?? article.author.email}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      article.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
