"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConfigFormProps = {
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
};

export function ConfigForm({ logoUrl, heroTitle, heroSubtitle }: ConfigFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({ logoUrl, heroTitle, heroSubtitle });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Konfigurasi berhasil disimpan!");
        router.refresh();
      } else {
        setMessage("Gagal menyimpan konfigurasi.");
      }
    } catch {
      setMessage("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          URL Logo
        </label>
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
        />
        <p className="mt-1 text-xs text-hgm-slate-grey">
          Path atau URL gambar logo (SVG/PNG).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          Judul Hero (Landing Page)
        </label>
        <input
          type="text"
          value={form.heroTitle}
          onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          Subtitle Hero (Landing Page)
        </label>
        <input
          type="text"
          value={form.heroSubtitle}
          onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
        />
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("berhasil") ? "text-green-600" : "text-hgm-crimson"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-hgm-crimson/90 disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
      </button>
    </form>
  );
}
