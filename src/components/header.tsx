import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function Header() {
  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  });

  const logoUrl = config?.logoUrl ?? "/assets/logo-default.svg";

  return (
    <header className="sticky top-0 z-50 border-b border-hgm-sapphire/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="HGM" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-hgm-sapphire transition-colors hover:text-hgm-crimson"
          >
            Beranda
          </Link>
          <Link
            href="/academy"
            className="text-sm font-medium text-hgm-sapphire transition-colors hover:text-hgm-crimson"
          >
            HGM Academy
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-hgm-crimson/90"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}
