"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ArticleFormProps = {
  article?: {
    id: string;
    title: string;
    category: string;
    htmlBody: string;
    isPublished: boolean;
  };
};

const categories = ["Nutrisi", "Gaya Hidup", "Terapi", "Psikologi", "Umum"];

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: article?.title ?? "",
    category: article?.category ?? "Nutrisi",
    htmlBody: article?.htmlBody ?? "",
    isPublished: article?.isPublished ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = article
        ? `/api/articles/${article.id}`
        : "/api/articles";
      const method = article ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/articles");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Gagal menyimpan artikel.");
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-hgm-sapphire/10 bg-white p-6"
    >
      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          Judul Artikel
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          Kategori
        </label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-hgm-sapphire">
          Konten (HTML)
        </label>
        <textarea
          required
          rows={12}
          value={form.htmlBody}
          onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm font-mono outline-none focus:border-hgm-crimson focus:ring-1 focus:ring-hgm-crimson"
          placeholder="<h2>Sub judul</h2><p>Isi artikel...</p>"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublished"
          checked={form.isPublished}
          onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          className="h-4 w-4 rounded border-hgm-sapphire/20 text-hgm-crimson focus:ring-hgm-crimson"
        />
        <label htmlFor="isPublished" className="text-sm text-hgm-sapphire">
          Publish langsung
        </label>
      </div>

      {error && <p className="text-sm text-hgm-crimson">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-hgm-crimson/90 disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : article ? "Update Artikel" : "Simpan Artikel"}
      </button>
    </form>
  );
}
