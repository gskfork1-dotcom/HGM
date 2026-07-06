import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../header";
import { ConfigForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.unsafeMetadata?.role as string) ?? "";

  if (role !== "SUPER_ADMIN") redirect("/admin");

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
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">
            Konfigurasi Branding
          </h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Kelola pengaturan visual platform (Super Admin only).
          </p>
          <div className="mt-8">
            <ConfigForm
              logoUrl={config?.logoUrl ?? "/assets/logo-default.svg"}
              heroTitle={
                config?.landingHeroTitle ??
                "Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda"
              }
              heroSubtitle={
                config?.landingHeroSub ??
                "Platform premium pendamping Hemodialisis & CAPD"
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
