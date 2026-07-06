"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";
import { RequireAuth } from "@/components/RequireAuth";

type TherapySchedule = {
  id: string;
  therapyType: string;
  title: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  isRecurring: boolean;
  recurringRule: string | null;
  notes: string | null;
  sessions: TherapySession[];
};

type TherapySession = {
  id: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  completed: boolean;
  skipped: boolean;
  skipReason: string | null;
  preWeight: number | null;
  postWeight: number | null;
  symptoms: string | null;
  notes: string | null;
};

const emptyForm = {
  therapyType: "HEMODIALYSIS",
  title: "",
  location: "",
  startTime: "",
  endTime: "",
  durationMinutes: "",
  notes: "",
  isRecurring: false,
  recurringRule: "",
};

const THERAPY_LABELS: Record<string, string> = {
  HEMODIALYSIS: "Hemodialisis (HD)",
  CAPD: "CAPD",
  DOCTOR_CONSULT: "Konsultasi Dokter",
  LAB_CHECK: "Cek Laboratorium",
};

export default function JadwalTerapiPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [schedules, setSchedules] = useState<TherapySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCheckin, setShowCheckin] = useState<string | null>(null);
  const [checkinForm, setCheckinForm] = useState({
    completed: true,
    skipped: false,
    skipReason: "",
    preWeight: "",
    postWeight: "",
    preBP: "",
    postBP: "",
    symptoms: "",
    notes: "",
  });

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/therapy-schedules");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSchedules(data);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetchSchedules();
    } else {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchSchedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      therapyType: form.therapyType,
      title: form.title || null,
      location: form.location || null,
      startTime: form.startTime,
      endTime: form.endTime || null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      notes: form.notes || null,
      isRecurring: form.isRecurring,
      recurringRule: form.recurringRule || null,
    };

    try {
      const url = editingId
        ? `/api/therapy-schedules/${editingId}`
        : "/api/therapy-schedules";
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
      fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (schedule: TherapySchedule) => {
    setForm({
      therapyType: schedule.therapyType,
      title: schedule.title ?? "",
      location: schedule.location ?? "",
      startTime: schedule.startTime.slice(0, 16),
      endTime: schedule.endTime ? schedule.endTime.slice(0, 16) : "",
      durationMinutes: schedule.durationMinutes?.toString() ?? "",
      notes: schedule.notes ?? "",
      isRecurring: schedule.isRecurring,
      recurringRule: schedule.recurringRule ?? "",
    });
    setEditingId(schedule.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Nonaktifkan jadwal ini?")) return;
    try {
      await fetch(`/api/therapy-schedules/${id}`, { method: "DELETE" });
      fetchSchedules();
    } catch {
      // ignore
    }
  };

  const handleCheckin = async (scheduleId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          ...checkinForm,
          preWeight: checkinForm.preWeight ? Number(checkinForm.preWeight) : null,
          postWeight: checkinForm.postWeight ? Number(checkinForm.postWeight) : null,
        }),
      });

      if (!res.ok) throw new Error("Gagal check-in");

      setShowCheckin(null);
      setCheckinForm({
        completed: true,
        skipped: false,
        skipReason: "",
        preWeight: "",
        postWeight: "",
        preBP: "",
        postBP: "",
        symptoms: "",
        notes: "",
      });
      fetchSchedules();
    } catch {
      setError("Gagal check-in sesi terapi");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingSchedules = schedules.filter(
    (s) => s.startTime >= today
  );
  const pastSchedules = schedules.filter(
    (s) => s.startTime < today
  );

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-hgm-cream">
      <DashboardHeader
        user={user ? {
          name: user.fullName ?? user.emailAddresses[0]?.emailAddress ?? "",
          email: user.emailAddresses[0]?.emailAddress ?? "",
          role,
        } : null}
      />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold text-hgm-sapphire">Jadwal Terapi</h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Kelola jadwal hemodialisis, CAPD, konsultasi, dan cek laboratorium.
          </p>

          <RequireAuth label="Login untuk mengelola jadwal terapi">
          <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-hgm-sapphire">
              {editingId ? "Edit Jadwal" : "Tambah Jadwal"}
            </h2>

            {error && (
              <p className="mt-2 text-sm text-hgm-crimson">{error}</p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">
                  Tipe Terapi <span className="text-hgm-crimson">*</span>
                </span>
                <select
                  value={form.therapyType}
                  onChange={(e) => setForm({ ...form, therapyType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  required
                >
                  {Object.entries(THERAPY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">Judul (opsional)</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="Misal: HD Rutin RS Premier"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">Lokasi</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="Nama RS / Klinik"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">
                  Waktu Mulai <span className="text-hgm-crimson">*</span>
                </span>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">Waktu Selesai</span>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">Durasi (menit)</span>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="240"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="h-4 w-4 rounded border-hgm-sapphire/20 text-hgm-crimson"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-hgm-sapphire">
                Jadwal Berulang
              </label>
            </div>

            {form.isRecurring && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-hgm-sapphire">
                  Aturan Perulangan
                </label>
                <input
                  type="text"
                  value={form.recurringRule}
                  onChange={(e) => setForm({ ...form, recurringRule: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  placeholder="Setiap Senin, Rabu, Jumat"
                />
              </div>
            )}

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
          </RequireAuth>

          {/* Check-in Modal */}
          {showCheckin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6">
                <h3 className="text-lg font-semibold text-hgm-sapphire">Check-in Sesi Terapi</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Selesai?</span>
                    <select
                      value={checkinForm.completed ? "true" : "false"}
                      onChange={(e) => setCheckinForm({ ...checkinForm, completed: e.target.value === "true" })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                    >
                      <option value="true">Ya, selesai</option>
                      <option value="false">Tidak selesai</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Skip?</span>
                    <select
                      value={checkinForm.skipped ? "true" : "false"}
                      onChange={(e) => setCheckinForm({ ...checkinForm, skipped: e.target.value === "true" })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                    >
                      <option value="false">Tidak</option>
                      <option value="true">Ya, dilewati</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">BB Sebelum (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={checkinForm.preWeight}
                      onChange={(e) => setCheckinForm({ ...checkinForm, preWeight: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                      placeholder="65.5"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">BB Sesudah (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={checkinForm.postWeight}
                      onChange={(e) => setCheckinForm({ ...checkinForm, postWeight: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                      placeholder="63.0"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">TD Sebelum</span>
                    <input
                      type="text"
                      value={checkinForm.preBP}
                      onChange={(e) => setCheckinForm({ ...checkinForm, preBP: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                      placeholder="140/90"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">TD Sesudah</span>
                    <input
                      type="text"
                      value={checkinForm.postBP}
                      onChange={(e) => setCheckinForm({ ...checkinForm, postBP: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                      placeholder="120/80"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-hgm-sapphire">Gejala / Keluhan</label>
                  <textarea
                    value={checkinForm.symptoms}
                    onChange={(e) => setCheckinForm({ ...checkinForm, symptoms: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                    placeholder="Kram, mual, pusing, dll."
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-sm font-medium text-hgm-sapphire">Catatan</label>
                  <textarea
                    value={checkinForm.notes}
                    onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                    placeholder="Catatan tambahan..."
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-sm font-medium text-hgm-sapphire">Alasan Skip</label>
                  <input
                    type="text"
                    value={checkinForm.skipReason}
                    onChange={(e) => setCheckinForm({ ...checkinForm, skipReason: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm"
                    placeholder="Misal: sakit, ada keperluan"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleCheckin(showCheckin)}
                    disabled={saving}
                    className="rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Check-in"}
                  </button>
                  <button
                    onClick={() => setShowCheckin(null)}
                    className="rounded-lg border border-hgm-sapphire/20 px-6 py-2 text-sm font-medium text-hgm-slate-grey hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Schedules */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-hgm-sapphire">
              Jadwal Mendatang
            </h2>
            {loading ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">Memuat...</p>
            ) : upcomingSchedules.length === 0 ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">
                Belum ada jadwal. Tambah jadwal terapi Anda.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-hgm-sapphire/10 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-hgm-sapphire/10 px-2 py-0.5 text-xs font-medium text-hgm-sapphire">
                          {THERAPY_LABELS[s.therapyType] ?? s.therapyType}
                        </span>
                        {s.title && (
                          <span className="ml-2 text-sm font-medium text-hgm-sapphire">
                            {s.title}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCheckin(s.id)}
                          className="text-xs font-medium text-hgm-crimson hover:underline"
                        >
                          Check-in
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-xs text-hgm-slate-grey hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs text-hgm-slate-grey hover:underline"
                        >
                          Nonaktifkan
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-hgm-slate-grey">
                      <span>
                        {new Date(s.startTime).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.location && <span>📍 {s.location}</span>}
                      {s.durationMinutes && <span>⏱ {s.durationMinutes} menit</span>}
                      {s.isRecurring && <span>🔄 Berulang</span>}
                    </div>
                    {s.sessions && s.sessions.length > 0 && (
                      <div className="mt-2 border-t border-hgm-sapphire/5 pt-2">
                        <p className="text-xs font-medium text-hgm-slate-grey">
                          Riwayat Sesi ({s.sessions.length}):
                        </p>
                        <div className="mt-1 space-y-1">
                          {s.sessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center gap-2 text-xs text-hgm-slate-grey">
                              <span>{session.completed ? "✅" : session.skipped ? "⏭️" : "⏳"}</span>
                              <span>
                                {session.actualStartTime
                                  ? new Date(session.actualStartTime).toLocaleDateString("id-ID")
                                  : "—"}
                              </span>
                              {session.preWeight != null && session.postWeight != null && (
                                <span>BB: {session.preWeight} → {session.postWeight} kg</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Schedules */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-hgm-sapphire">
              Jadwal Lalu
            </h2>
            <div className="mt-4 space-y-3">
              {pastSchedules.length === 0 ? (
                <p className="text-sm text-hgm-slate-grey">Tidak ada.</p>
              ) : (
                pastSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-hgm-sapphire/10 bg-white p-4 opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-hgm-sapphire/10 px-2 py-0.5 text-xs font-medium text-hgm-sapphire">
                          {THERAPY_LABELS[s.therapyType] ?? s.therapyType}
                        </span>
                        {s.title && (
                          <span className="ml-2 text-sm font-medium text-hgm-sapphire">
                            {s.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-hgm-slate-grey">
                      {new Date(s.startTime).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
