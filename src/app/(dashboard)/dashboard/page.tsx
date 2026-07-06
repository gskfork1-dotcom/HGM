import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "./header";
import { DashboardContent } from "./content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const clerkUser = session?.userId ? await currentUser() : null;
  const role = (clerkUser?.unsafeMetadata?.role as string) ?? "PATIENT";
  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  }).catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-hgm-cream">
      <DashboardHeader
        user={clerkUser ? {
          name: clerkUser.fullName ?? clerkUser.emailAddresses[0]?.emailAddress ?? "",
          email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
          role,
        } : null}
        logoUrl={config?.logoUrl}
      />
      <DashboardContent role={role} userId={session?.userId ?? null} />
    </div>
  );
}
