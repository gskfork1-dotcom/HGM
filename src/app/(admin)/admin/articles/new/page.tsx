import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../../header";
import { ArticleForm } from "../form";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
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
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">
            Artikel Baru
          </h1>
          <div className="mt-8">
            <ArticleForm />
          </div>
        </div>
      </main>
    </div>
  );
}
