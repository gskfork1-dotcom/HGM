"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";

type DailyLog = {
  id: string;
  entryDate: string;
  systolicBP: number | null;
  diastolicBP: number | null;
  weight: number | null;
  fluidIntake: number | null;
  urineOutput: number | null;
  temperature: number | null;
  bloodSugar: number | null;
  symptoms: string | null;
  mood: number | null;
  sleepDuration: number | null;
  therapyAdherence: boolean | null;
  notes: string | null;
};

const emptyForm = {
  entryDate: new Date().toISOString().split("T")[0],
  systolicBP: "",
  diastolicBP: "",
  weight: "",
  fluidIntake: "",
  urineOutput: "",
  temperature: "",
  bloodSugar: "",
  symptoms: "",
  mood: "",
  sleepDuration: "",
  therapyAdherence: "",
  notes: "",
};

export default function CatatanHarianPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    stats: Record<string, { avg: number | null; min: number | null; max: number | null }>;
    therapyAdherence: { percentage: number | null };
  } | null>(null);

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-logs?limit=30");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-logs/summary?days=30");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    fetchLogs();
    fetchSummary();
  }, [isLoaded, user, router, fetchLogs, fetchSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      entryDate: form.entryDate,
    };
    if (form.systolicBP) payload.systolicBP = Number(form.systolicBP);
    if (form.diastolicBP) payload.diastolicBP = Number(form.diastolicBP);
    if (form.weight) payload.weight = Number(form.weight);
    if (form.fluidIntake) payload.fluidIntake = Number(form.fluidIntake);
    if (form.urineOutput) payload.urineOutput = Number(form.urineOutput);
    if (form.temperature) payload.temperature = Number(form.temperature);
    if (form.bloodSugar) payload.bloodSugar = Number(form.bloodSugar);
    if (form.symptoms) payload.symptoms = form.symptoms;
    if (form.mood) payload.mood = Number(form.mood);
    if (form.sleepDuration) payload.sleepDuration = Number(form.sleepDuration);
    if (form.therapyAdherence !== "") payload.therapyAdherence = form.therapyAdherence === "true";
    if (form.notes) payload.notes = form.notes;

    try {
      const url = editingId
        ? `/api/daily-logs/${editingId}`
        : "/api/daily-logs";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal menyimpan");
      }

      setForm(emptyForm);
      setEditingId(null);
      fetchLogs();
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log: DailyLog) => {
    setForm({
      entryDate: log.entryDate.split("T")[0],
      systolicBP: log.systolicBP?.toString() ?? "",
      diastolicBP: log.diastolicBP?.toString() ?? "",
      weight: log.weight?.toString() ?? "",
      fluidIntake: log.fluidIntake?.toString() ?? "",
      urineOutput: log.urineOutput?.toString() ?? "",
      temperature: log.temperature?.toString() ?? "",
      bloodSugar: log.bloodSugar?.toString() ?? "",
      symptoms: log.symptoms ?? "",
      mood: log.mood?.toString() ?? "",
      sleepDuration: log.sleepDuration?.toString() ?? "",
      therapyAdherence: log.therapyAdherence === null ? "" : log.therapyAdherence ? "true" : "false",
      notes: log.notes ?? "",
    });
    setEditingId(log.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    try {
      const res = await fetch(`/api/daily-logs/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLogs();
        fetchSummary();
      }
    } catch {
      // ignore
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
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
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">Catatan Harian</h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Catat parameter kesehatan harian Anda untuk monitoring yang lebih baik.
          </p>

          {summary && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="TD Rata-rata"
                value={
                  summary.stats.systolicBP?.avg != null && summary.stats.diastolicBP?.avg != null
                    ? `${summary.stats.systolicBP.avg}/${summary.stats.diastolicBP.avg}`
                    : "—"
                }
                unit="mmHg"
              />
              <SummaryCard
                label="Berat Badan"
                value={summary.stats.weight?.avg?.toString() ?? "—"}
                unit="kg"
              />
              <SummaryCard
                label="Asupan Cairan"
                value={summary.stats.fluidIntake?.avg?.toString() ?? "—"}
                unit="ml/hari"
              />
              <SummaryCard
                label="Kepatuhan Terapi"
                value={summary.therapyAdherence.percentage != null ? `${summary.therapyAdherence.percentage}%` : "—"}
                unit=""
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-hgm-sapphire">
              {editingId ? "Edit Catatan" : "Catatan Baru"}
            </h2>

            {error && (
              <p className="mt-2 text-sm text-hgm-crimson">{error}</p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Tanggal" required>
                <input
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  required
                />
              </Field>

              <Field label="TD Sistolik" unit="mmHg">
                <input
                  type="number"
                  value={form.systolicBP}
                  onChange={(e) => setForm({ ...form, systolicBP: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="120"
                />
              </Field>

              <Field label="TD Diastolik" unit="mmHg">
                <input
                  type="number"
                  value={form.diastolicBP}
                  onChange={(e) => setForm({ ...form, diastolicBP: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="80"
                />
              </Field>

              <Field label="Berat Badan" unit="kg">
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="65.5"
                />
              </Field>

              <Field label="Asupan Cairan" unit="ml">
                <input
                  type="number"
                  value={form.fluidIntake}
                  onChange={(e) => setForm({ ...form, fluidIntake: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="1000"
                />
              </Field>

              <Field label="Output Urine" unit="ml">
                <input
                  type="number"
                  value={form.urineOutput}
                  onChange={(e) => setForm({ ...form, urineOutput: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="500"
                />
              </Field>

              <Field label="Suhu Tubuh" unit="°C">
                <input
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="36.5"
                />
              </Field>

              <Field label="Gula Darah" unit="mg/dL">
                <input
                  type="number"
                  value={form.bloodSugar}
                  onChange={(e) => setForm({ ...form, bloodSugar: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="110"
                />
              </Field>

              <Field label="Durasi Tidur" unit="jam">
                <input
                  type="number"
                  step="0.5"
                  value={form.sleepDuration}
                  onChange={(e) => setForm({ ...form, sleepDuration: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="7"
                />
              </Field>

              <Field label="Mood">
                <select
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="1">1 — Sangat Buruk</option>
                  <option value="2">2 — Buruk</option>
                  <option value="3">3 — Biasa</option>
                  <option value="4">4 — Baik</option>
                  <option value="5">5 — Sangat Baik</option>
                </select>
              </Field>

              <Field label="Kepatuhan Terapi">
                <select
                  value={form.therapyAdherence}
                  onChange={(e) => setForm({ ...form, therapyAdherence: e.target.value })}
                  className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="true">Ya, menjalani</option>
                  <option value="false">Tidak menjalani</option>
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-hgm-sapphire">Gejala / Keluhan</label>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                placeholder="Sesak napas, bengkak di kaki, dll."
              />
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-hgm-sapphire">Catatan</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                placeholder="Catatan tambahan..."
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-hgm-sapphire/20 px-6 py-2 text-sm font-medium text-hgm-slate-grey hover:bg-gray-50"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-hgm-sapphire">Riwayat Catatan</h2>
            {loading ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">Memuat...</p>
            ) : logs.length === 0 ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">
                Belum ada catatan. Mulai catat perkembangan harian Anda.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-hgm-sapphire/10 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-hgm-sapphire">
                        {new Date(log.entryDate).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(log)}
                          className="text-xs text-hgm-crimson hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-xs text-hgm-slate-grey hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-hgm-slate-grey">
                      {log.systolicBP && log.diastolicBP && (
                        <span>TD: {log.systolicBP}/{log.diastolicBP} mmHg</span>
                      )}
                      {log.weight && <span>BB: {log.weight} kg</span>}
                      {log.fluidIntake != null && <span>Cairan: {log.fluidIntake} ml</span>}
                      {log.urineOutput != null && <span>Urine: {log.urineOutput} ml</span>}
                      {log.bloodSugar && <span>GDS: {log.bloodSugar} mg/dL</span>}
                      {log.temperature && <span>Suhu: {log.temperature}°C</span>}
                      {log.therapyAdherence != null && (
                        <span>
                          Terapi: {log.therapyAdherence ? "✅" : "❌"}
                        </span>
                      )}
                      {log.mood && <span>Mood: {log.mood}/5</span>}
                    </div>
                    {log.symptoms && (
                      <p className="mt-1 text-sm text-hgm-crimson">
                        Keluhan: {log.symptoms}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  unit,
  required,
  children,
}: {
  label: string;
  unit?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-hgm-sapphire">
        {label}
        {required && <span className="text-hgm-crimson">*</span>}
        {unit && <span className="ml-1 text-xs text-hgm-slate-grey">({unit})</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-hgm-sapphire/10 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-hgm-slate-grey">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-hgm-sapphire">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-hgm-slate-grey">{unit}</span>}
      </p>
    </div>
  );
}
