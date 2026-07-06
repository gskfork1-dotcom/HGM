"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";

type KtVCalc = {
  id: string;
  calculationDate: string;
  mode: string;
  ktvResult: number;
  status: string;
  urr?: number;
};

export default function KalkulatorKtvPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [mode, setMode] = useState<"lengkap" | "kasar">("kasar");
  const [result, setResult] = useState<{ ktv: number; status: string; urr?: number } | null>(null);
  const [history, setHistory] = useState<KtVCalc[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mode Kasar
  const [qb, setQb] = useState("300");
  const [qd, setQd] = useState("500");
  const [durasi, setDurasi] = useState("4");
  const [bbPost, setBbPost] = useState("");
  const [bbPre, setBbPre] = useState("");
  const [usia, setUsia] = useState("");
  const [tinggi, setTinggi] = useState("");
  const [jk, setJk] = useState<"L" | "P">("L");

  // Mode Lengkap
  const [bunPre, setBunPre] = useState("");
  const [bunPost, setBunPost] = useState("");

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/ktv/history?limit=20");
      if (res.ok) setHistory(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    fetchHistory();
  }, [isLoaded, user, router, fetchHistory]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setResult(null);

    const payload: Record<string, unknown> = { mode };

    if (mode === "lengkap") {
      if (!bunPre || !bunPost || !durasi || !bbPost) {
        setError("BUN Pre, BUN Post, durasi, dan BB Post harus diisi");
        setSaving(false);
        return;
      }
      payload.bunPre = Number(bunPre);
      payload.bunPost = Number(bunPost);
      payload.durationHours = Number(durasi);
      payload.weightPost = Number(bbPost);
      if (bbPre) payload.weightPre = Number(bbPre);
    } else {
      if (!qb || !durasi || !bbPost) {
        setError("QB, durasi, dan BB Post harus diisi");
        setSaving(false);
        return;
      }
      payload.qb = Number(qb);
      payload.qd = Number(qd || 500);
      payload.durationHours = Number(durasi);
      payload.weightPost = Number(bbPost);
      if (bbPre) payload.weightPre = Number(bbPre);
      if (usia) payload.age = Number(usia);
      if (tinggi) payload.height = Number(tinggi);
      payload.gender = jk;
    }

    try {
      const res = await fetch("/api/ktv/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal menghitung");
      }

      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghitung");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !user) return null;

  const statusColor: Record<string, string> = {
    optimal: "bg-green-100 text-green-700 border-green-300",
    adequate: "bg-yellow-100 text-yellow-700 border-yellow-300",
    inadequate: "bg-red-100 text-red-700 border-red-300",
  };

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
          <h1 className="text-2xl font-bold text-hgm-sapphire">Kalkulator Kt/V</h1>
          <p className="mt-1 text-sm text-hgm-slate-grey">
            Hitung estimasi kecukupan dialisis Anda.
          </p>

          <form onSubmit={handleCalculate} className="mt-6 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
            <div className="flex gap-4">
              <button type="button" onClick={() => setMode("kasar")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "kasar" ? "bg-hgm-crimson text-white" : "border border-hgm-sapphire/20 text-hgm-slate-grey"}`}>
                ⚡ Mode Kasar (tanpa BUN)
              </button>
              <button type="button" onClick={() => setMode("lengkap")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "lengkap" ? "bg-hgm-crimson text-white" : "border border-hgm-sapphire/20 text-hgm-slate-grey"}`}>
                🧪 Mode Lengkap (dengan BUN)
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">Durasi Dialisis <span className="text-hgm-crimson">*</span></span>
                <div className="mt-1 flex">
                  <input type="number" step="0.5" value={durasi} onChange={(e) => setDurasi(e.target.value)}
                    className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" placeholder="4" required />
                  <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">jam</span>
                </div>
              </label>

              {mode === "kasar" && (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">QB (Blood Flow Rate) <span className="text-hgm-crimson">*</span></span>
                    <div className="mt-1 flex">
                      <input type="number" value={qb} onChange={(e) => setQb(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" required />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">mL/min</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">QD (Dialysate Flow)</span>
                    <div className="mt-1 flex">
                      <input type="number" value={qd} onChange={(e) => setQd(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">mL/min</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Usia</span>
                    <div className="mt-1 flex">
                      <input type="number" value={usia} onChange={(e) => setUsia(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" placeholder="45" />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">tahun</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Tinggi Badan</span>
                    <div className="mt-1 flex">
                      <input type="number" value={tinggi} onChange={(e) => setTinggi(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" placeholder="165" />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">cm</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">Jenis Kelamin</span>
                    <div className="mt-1 flex gap-3">
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" name="jk" checked={jk === "L"} onChange={() => setJk("L")} className="text-hgm-crimson" /> Laki-laki
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" name="jk" checked={jk === "P"} onChange={() => setJk("P")} className="text-hgm-crimson" /> Perempuan
                      </label>
                    </div>
                  </label>
                </>
              )}

              {mode === "lengkap" && (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">BUN Pre-dialisis <span className="text-hgm-crimson">*</span></span>
                    <div className="mt-1 flex">
                      <input type="number" value={bunPre} onChange={(e) => setBunPre(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" required />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">mg/dL</span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-hgm-sapphire">BUN Post-dialisis <span className="text-hgm-crimson">*</span></span>
                    <div className="mt-1 flex">
                      <input type="number" value={bunPost} onChange={(e) => setBunPost(e.target.value)}
                        className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" required />
                      <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">mg/dL</span>
                    </div>
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">BB Sesudah Dialisis <span className="text-hgm-crimson">*</span></span>
                <div className="mt-1 flex">
                  <input type="number" step="0.1" value={bbPost} onChange={(e) => setBbPost(e.target.value)}
                    className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" required />
                  <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">kg</span>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-hgm-sapphire">BB Sebelum Dialisis</span>
                <div className="mt-1 flex">
                  <input type="number" step="0.1" value={bbPre} onChange={(e) => setBbPre(e.target.value)}
                    className="w-full rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none" />
                  <span className="ml-2 flex items-center text-sm text-hgm-slate-grey">kg</span>
                </div>
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-hgm-crimson">{error}</p>}

            <button type="submit" disabled={saving}
              className="mt-4 rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90 disabled:opacity-50">
              {saving ? "Menghitung..." : "Hitung Kt/V"}
            </button>
          </form>

          {result && (
            <div className={`mt-6 rounded-xl border-2 p-6 ${statusColor[result.status]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide">spKt/V</p>
                  <p className="text-4xl font-bold">{result.ktv}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {result.status === "optimal" ? "🟢 Optimal" : result.status === "adequate" ? "🟡 Adekuat" : "🔴 Tidak Adekuat"}
                  </p>
                  <p className="text-sm">Target: ≥ 1.2 (KDOQI) / ≥ 1.4 (ideal)</p>
                  {result.urr != null && <p className="mt-1 text-sm">URR: {result.urr}%</p>}
                </div>
              </div>
              <p className="mt-3 text-xs opacity-70">
                ⚠️ Nilai ini adalah estimasi. Konsultasikan dengan nefrolog Anda.
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-hgm-sapphire">Riwayat Kt/V</h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">Belum ada riwayat perhitungan.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-xl border border-hgm-sapphire/10 bg-white p-4">
                    <div>
                      <span className="text-sm font-medium text-hgm-sapphire">
                        Kt/V: {h.ktvResult}
                      </span>
                      <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[h.status]?.split(" ")[0]} ${statusColor[h.status]?.split(" ")[1]}`}>
                        {h.status}
                      </span>
                    </div>
                    <span className="text-xs text-hgm-slate-grey">
                      {new Date(h.calculationDate).toLocaleDateString("id-ID")}
                    </span>
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
