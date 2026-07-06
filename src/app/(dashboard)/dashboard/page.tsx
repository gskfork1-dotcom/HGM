import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "./header";
import { DashboardContent } from "./content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-hgm-cream">
      <DashboardHeader
        user={{
          name: user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? "",
          email: user?.emailAddresses[0]?.emailAddress ?? "",
          role,
        }}
        logoUrl={config?.logoUrl}
      />
      <DashboardContent role={role} />
    </div>
  );
}
