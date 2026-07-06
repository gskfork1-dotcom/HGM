import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "./header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.unsafeMetadata?.role as string) ?? "";

  if (role !== "SUPER_ADMIN" && role !== "CONTENT_EDITOR") {
    redirect("/dashboard");
  }

  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
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
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Kelola konten dan pengaturan platform HGM.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Link
              href="/admin/config"
              className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h3 className="font-semibold text-hgm-crimson group-hover:underline">
                Konfigurasi Branding
              </h3>
              <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                Kelola logo, judul hero, dan pengaturan visual platform.
              </p>
              {role !== "SUPER_ADMIN" && (
                <span className="mt-2 inline-block rounded bg-hgm-sapphire/10 px-2 py-0.5 text-xs text-hgm-sapphire">
                  Super Admin Only
                </span>
              )}
            </Link>

            <Link
              href="/admin/articles"
              className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h3 className="font-semibold text-hgm-crimson group-hover:underline">
                Artikel Academy
              </h3>
              <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                Buat dan kelola artikel edukasi HGM Academy.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
