"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<"PATIENT" | "CAREGIVER">("PATIENT");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await user.update({
        unsafeMetadata: { role },
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hgm-dark-bg via-hgm-dark-bg to-hgm-sapphire px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-hgm-sapphire">
            Selamat Datang!
          </h1>
          <p className="mt-2 text-sm text-hgm-slate-grey">
            Pilih peran Anda di platform HGM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("PATIENT")}
              className={`flex-1 rounded-xl border-2 p-4 text-center transition-colors ${
                role === "PATIENT"
                  ? "border-hgm-crimson bg-hgm-crimson/5"
                  : "border-hgm-sapphire/10 hover:border-hgm-sapphire/30"
              }`}
            >
              <p className="font-semibold text-hgm-sapphire">Pasien</p>
              <p className="mt-1 text-xs text-hgm-slate-grey">
                Saya menjalani terapi ginjal
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("CAREGIVER")}
              className={`flex-1 rounded-xl border-2 p-4 text-center transition-colors ${
                role === "CAREGIVER"
                  ? "border-hgm-crimson bg-hgm-crimson/5"
                  : "border-hgm-sapphire/10 hover:border-hgm-sapphire/30"
              }`}
            >
              <p className="font-semibold text-hgm-sapphire">Caregiver</p>
              <p className="mt-1 text-xs text-hgm-slate-grey">
                Saya merawat pasien ginjal
              </p>
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-hgm-crimson/90 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Lanjutkan"}
          </button>
        </form>
      </div>
    </div>
  );
}
