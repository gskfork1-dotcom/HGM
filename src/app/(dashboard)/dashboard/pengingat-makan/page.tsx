"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";

type MealReminder = {
  id: string;
  mealTime: string;
  time: string;
  isActive: boolean;
  notes: string | null;
};

type MealPlan = {
  id: string;
  mealTime: string;
  suggestion: string | null;
  isConsumed: boolean | null;
  foodItem?: { name: string } | null;
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "🍚 Sarapan",
  lunch: "🍽 Makan Siang",
  dinner: "🍲 Makan Malam",
  snack: "🥜 Snack",
  snack1: "🥜 Snack Pagi",
  snack2: "🥜 Snack Sore",
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍪",
};

export default function PengingatMakanPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"reminder" | "plan">("reminder");

  const [form, setForm] = useState({ mealTime: "breakfast", time: "06:00", notes: "" });

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  const fetchData = useCallback(async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        fetch("/api/meal-reminders"),
        fetch("/api/meal-plans"),
      ]);
      if (rRes.ok) setReminders(await rRes.json());
      if (pRes.ok) setMealPlan(await pRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    fetchData();
  }, [isLoaded, user, router, fetchData]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/meal-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ mealTime: "breakfast", time: "06:00", notes: "" });
        fetchData();
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/meal-reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchData();
    } catch { /* ignore */ }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Hapus pengingat ini?")) return;
    try {
      await fetch(`/api/meal-reminders/${id}`, { method: "DELETE" });
      fetchData();
    } catch { /* ignore */ }
  };

  const handleGeneratePlan = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/meal-plans/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (res.ok) fetchData();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-hgm-cream">
      <DashboardHeader
        user={{
          name: user.fullName ?? user.emailAddresses[0]?.emailAddress ?? "",
          email: user.emailAddresses[0]?.emailAddress ?? "",
          role,
        }}
      />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">Pengingat Makan & Nutrisi</h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Atur jadwal makan sesuai diet ginjal Anda.
          </p>

          <div className="mt-6 flex gap-4">
            <button onClick={() => setTab("reminder")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "reminder" ? "bg-hgm-crimson text-white" : "border border-hgm-sapphire/20 text-hgm-slate-grey"}`}>
              ⏰ Pengingat Makan
            </button>
            <button onClick={() => setTab("plan")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "plan" ? "bg-hgm-crimson text-white" : "border border-hgm-sapphire/20 text-hgm-slate-grey"}`}>
              📋 Rencana Makan Hari Ini
            </button>
          </div>

          {tab === "reminder" && (
            <>
              <form onSubmit={handleAddReminder} className="mt-6 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
                <h2 className="text-lg font-semibold text-hgm-sapphire">Tambah Pengingat</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Waktu Makan</span>
                    <select value={form.mealTime} onChange={(e) => setForm({ ...form, mealTime: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none">
                      {Object.entries(MEAL_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Jam</span>
                    <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" required />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Catatan</span>
                    <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" placeholder="Misal: minum obat dulu" />
                  </label>
                </div>
                <button type="submit" disabled={saving}
                  className="mt-4 rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Tambah Pengingat"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {loading ? (
                  <p className="text-sm text-hgm-slate-grey">Memuat...</p>
                ) : reminders.length === 0 ? (
                  <p className="text-sm text-hgm-slate-grey">Belum ada pengingat. Tambah pengingat makan Anda.</p>
                ) : (
                  reminders.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-hgm-sapphire/10 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleReminder(r.id, r.isActive)}
                          className={`h-5 w-5 rounded border-2 ${r.isActive ? "bg-hgm-crimson border-hgm-crimson" : "border-hgm-slate-grey"}`}>
                          {r.isActive && <span className="flex items-center justify-center text-xs text-white">✓</span>}
                        </button>
                        <div>
                          <p className="text-sm font-medium text-hgm-sapphire">{MEAL_LABELS[r.mealTime] || r.mealTime}</p>
                          <p className="text-xs text-hgm-slate-grey">⏰ {r.time}{r.notes ? ` · ${r.notes}` : ""}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteReminder(r.id)} className="text-xs text-hgm-slate-grey hover:text-hgm-crimson">Hapus</button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {tab === "plan" && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-hgm-sapphire">
                  Menu Hari Ini — {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </h2>
                <button onClick={handleGeneratePlan} disabled={saving}
                  className="rounded-lg bg-hgm-crimson px-4 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50">
                  {saving ? "..." : "🔄 Generate Menu"}
                </button>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-hgm-slate-grey">Memuat...</p>
              ) : mealPlan.length === 0 ? (
                <div className="mt-4 rounded-xl border border-hgm-sapphire/10 bg-white p-8 text-center">
                  <p className="text-3xl">🍽️</p>
                  <p className="mt-2 text-sm text-hgm-slate-grey">Belum ada rencana makan untuk hari ini.</p>
                  <button onClick={handleGeneratePlan} disabled={saving}
                    className="mt-3 rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50">
                    Generate Menu Hari Ini
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {["breakfast", "lunch", "dinner", "snack"].map((mealTime) => {
                    const plan = mealPlan.find((p) => p.mealTime === mealTime);
                    return (
                      <div key={mealTime} className="rounded-xl border border-hgm-sapphire/10 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-hgm-sapphire">
                            {MEAL_ICONS[mealTime] || "🍽"} {MEAL_LABELS[mealTime] || mealTime}
                          </span>
                          {plan?.isConsumed === true && <span className="text-xs text-green-600">✅ Dimakan</span>}
                        </div>
                        <p className="mt-1 text-sm text-hgm-slate-grey">{plan?.suggestion || "Belum ada rekomendasi"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
