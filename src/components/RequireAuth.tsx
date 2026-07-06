"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Lock } from "lucide-react";

export function RequireAuth({ children, label }: { children: React.ReactNode; label?: string }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;
  if (isSignedIn) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border border-hgm-sapphire/10 bg-white/95 p-6 text-center shadow-lg backdrop-blur">
          <Lock className="mx-auto h-8 w-8 text-hgm-sapphire" />
          <p className="mt-3 text-sm font-semibold text-hgm-sapphire">
            {label ?? "Fitur ini perlu login"}
          </p>
          <p className="mt-1 text-xs text-hgm-slate-grey">
            Silakan login atau daftar untuk menggunakan fitur ini.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-hgm-sapphire/20 px-4 py-2 text-sm font-medium text-hgm-sapphire hover:bg-gray-50"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
