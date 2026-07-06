"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type AdminHeaderProps = {
  user: { name: string | null; email: string; role: string };
  logoUrl?: string;
};

export function AdminHeader({ user, logoUrl }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-hgm-sapphire/10 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin">
            <img
              src={logoUrl ?? "/assets/logo-default.svg"}
              alt="HGM"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-hgm-sapphire hover:text-hgm-crimson"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-hgm-crimson"
            >
              Admin Panel
            </Link>
            <Link
              href="/admin/config"
              className="text-sm text-hgm-sapphire hover:text-hgm-crimson"
            >
              Branding
            </Link>
            <Link
              href="/admin/articles"
              className="text-sm text-hgm-sapphire hover:text-hgm-crimson"
            >
              Artikel
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-hgm-slate-grey md:block">
            {user.name ?? user.email}
            <span className="ml-2 rounded bg-hgm-crimson/10 px-1.5 py-0.5 text-xs text-hgm-crimson">
              {user.role === "SUPER_ADMIN" ? "Super Admin" : "Editor"}
            </span>
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
