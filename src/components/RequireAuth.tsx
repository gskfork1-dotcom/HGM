"use client";

import { useState } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { Lock, X } from "lucide-react";

export function RequireAuth({ children, label }: { children: React.ReactNode; label?: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const [showModal, setShowModal] = useState(false);

  if (!isLoaded) return null;
  if (isSignedIn) return <>{children}</>;

  return (
    <>
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
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90"
              >
                Login
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg border border-hgm-sapphire/20 px-4 py-2 text-sm font-medium text-hgm-sapphire hover:bg-gray-50"
              >
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-hgm-slate-grey hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
            <SignIn
              routing="hash"
              signUpUrl="/sign-up"
              fallbackRedirectUrl={typeof window !== "undefined" ? window.location.pathname : "/dashboard"}
            />
          </div>
        </div>
      )}
    </>
  );
}
