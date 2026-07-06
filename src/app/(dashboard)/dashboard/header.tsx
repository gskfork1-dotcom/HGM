"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

type DashboardHeaderProps = {
  user: { name: string | null; email: string; role: string };
  logoUrl?: string;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/catatan-harian", label: "Catatan Harian" },
  { href: "/dashboard/jadwal-terapi", label: "Jadwal Terapi" },
];

export function DashboardHeader({ user, logoUrl }: DashboardHeaderProps) {
  const pathname = usePathname();
  const isAdmin =
    user.role === "SUPER_ADMIN" || user.role === "CONTENT_EDITOR";

  return (
    <header className="sticky top-0 z-50 border-b border-hgm-sapphire/10 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <img
              src={logoUrl ?? "/assets/logo-default.svg"}
              alt="HGM"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-hgm-crimson"
                      : "text-hgm-sapphire hover:text-hgm-crimson"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-hgm-sapphire hover:text-hgm-crimson"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-hgm-slate-grey md:block">
            {user.name ?? user.email}
          </span>
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          />
        </div>
      </div>
    </header>
  );
}
