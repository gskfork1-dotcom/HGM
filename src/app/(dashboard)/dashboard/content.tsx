"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  Calendar,
  BookOpen,
  Heart,
  Droplets,
  Weight,
  TrendingUp,
  Calculator,
  Utensils,
  MessageCircle,
} from "lucide-react";

type DashboardContentProps = {
  role: string;
  userId: string | null;
};

type HealthSummary = {
  period: { totalEntries: number };
  stats: Record<string, { avg: number | null }>;
  therapyAdherence: { percentage: number | null };
};

export function DashboardContent({ role, userId }: DashboardContentProps) {
  const { user, isLoaded } = useUser();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const signedIn = !!(userId ?? user?.id);

  useEffect(() => {
    if (!isLoaded) return;
    if (!signedIn) { setLoading(false); return; }
    fetch("/api/daily-logs/summary?days=7")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoaded]);

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-hgm-sapphire">Dashboard</h1>
        <p className="mt-1 text-sm text-hgm-slate-grey">
          Selamat datang di portal HGM.
        </p>

        {/* Quick Stats */}
        {!loading && summary && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              label="Catatan 7 Hari"
              value={`${summary.period.totalEntries} entri`}
            />
            <StatCard
              icon={<Heart className="h-5 w-5" />}
              label="TD Rata-rata"
              value={
                summary.stats.systolicBP?.avg != null && summary.stats.diastolicBP?.avg != null
                  ? `${summary.stats.systolicBP.avg}/${summary.stats.diastolicBP.avg}`
                  : "—"
              }
              sub="mmHg"
            />
            <StatCard
              icon={<Weight className="h-5 w-5" />}
              label="BB Rata-rata"
              value={summary.stats.weight?.avg?.toString() ?? "—"}
              sub="kg"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Kepatuhan Terapi"
              value={summary.therapyAdherence.percentage != null ? `${summary.therapyAdherence.percentage}%` : "—"}
            />
          </div>
        )}

        {/* Feature Cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            href="/dashboard/catatan-harian"
            icon={<Activity className="h-6 w-6" />}
            title="Catatan Harian"
            desc="Catat dan pantau perkembangan terapi harian Anda."
            cta="Buka Catatan"
          />
          <FeatureCard
            href="/dashboard/jadwal-terapi"
            icon={<Calendar className="h-6 w-6" />}
            title="Jadwal Terapi"
            desc="Lihat dan kelola jadwal hemodialisis atau CAPD."
            cta="Buka Jadwal"
          />
          <FeatureCard
            href="/dashboard/kalkulator-ktv"
            icon={<Calculator className="h-6 w-6" />}
            title="Kalkulator Kt/V"
            desc="Hitung dosis dialisis dengan metode Daugirdas."
            cta="Hitung Kt/V"
          />
          <FeatureCard
            href="/dashboard/pengingat-makan"
            icon={<Utensils className="h-6 w-6" />}
            title="Pengingat Makan"
            desc="Atur pengingat makan & rencana menu harian ginjal."
            cta="Atur Menu"
          />
          <FeatureCard
            href="/dashboard/chatbot"
            icon={<MessageCircle className="h-6 w-6" />}
            title="HGM AI Chatbot"
            desc="Tanya apa pun tentang kesehatan ginjal."
            cta="Mulai Chat"
          />
          <FeatureCard
            href="/academy"
            icon={<BookOpen className="h-6 w-6" />}
            title="Artikel Terbaru"
            desc="Baca artikel edukasi terbaru dari HGM Academy."
            cta="Baca Artikel"
          />
        </div>

        {/* Health Summary */}
        {signedIn ? (
          <div className="mt-8 rounded-xl border border-hgm-sapphire/10 bg-white p-6">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-hgm-crimson" />
              <h2 className="text-lg font-semibold text-hgm-sapphire">
                Ringkasan Kesehatan
              </h2>
            </div>

            {loading ? (
              <p className="mt-2 text-sm text-hgm-slate-grey">Memuat data...</p>
            ) : summary && summary.period.totalEntries > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <HealthItem
                  label="Tekanan Darah"
                  value={
                    summary.stats.systolicBP?.avg != null && summary.stats.diastolicBP?.avg != null
                      ? `${summary.stats.systolicBP.avg}/${summary.stats.diastolicBP.avg}`
                      : "Belum ada data"
                    }
                  status={getBPStatus(summary.stats.systolicBP?.avg, summary.stats.diastolicBP?.avg)}
                />
                <HealthItem
                  label="Berat Badan"
                  value={summary.stats.weight?.avg != null ? `${summary.stats.weight.avg} kg` : "Belum ada data"}
                  status="normal"
                />
                <HealthItem
                  label="Asupan Cairan"
                  value={summary.stats.fluidIntake?.avg != null ? `${summary.stats.fluidIntake.avg} ml/hari` : "Belum ada data"}
                  status={getFluidStatus(summary.stats.fluidIntake?.avg)}
                />
                <HealthItem
                  label="Kepatuhan Terapi"
                  value={summary.therapyAdherence.percentage != null ? `${summary.therapyAdherence.percentage}%` : "Belum ada data"}
                  status={getAdherenceStatus(summary.therapyAdherence.percentage)}
                />
                <HealthItem
                  label="Output Urine"
                  value={summary.stats.urineOutput?.avg != null ? `${summary.stats.urineOutput.avg} ml/hari` : "Belum ada data"}
                  status="normal"
                />
                <HealthItem
                  label="Gula Darah"
                  value={summary.stats.bloodSugar?.avg != null ? `${summary.stats.bloodSugar.avg} mg/dL` : "Belum ada data"}
                  status={getSugarStatus(summary.stats.bloodSugar?.avg)}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-hgm-slate-grey">
                Mulai isi <Link href="/dashboard/catatan-harian" className="text-hgm-crimson underline">Catatan Harian</Link> untuk melihat ringkasan kesehatan Anda.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-hgm-sapphire/10 bg-white p-6 text-center">
            <Droplets className="mx-auto h-8 w-8 text-hgm-sapphire" />
            <h2 className="mt-3 text-lg font-semibold text-hgm-sapphire">Ringkasan Kesehatan</h2>
            <p className="mt-1 text-sm text-hgm-slate-grey">
              Login untuk melihat ringkasan kesehatan pribadi Anda.
            </p>
            <Link href="/sign-in" className="mt-4 inline-block rounded-lg bg-hgm-crimson px-6 py-2 text-sm font-medium text-white hover:bg-hgm-crimson/90">
              Login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  desc,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link href={href}>
      <div className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-hgm-crimson/30">
        <div className="text-hgm-crimson">{icon}</div>
        <h3 className="mt-3 font-semibold text-hgm-sapphire group-hover:text-hgm-crimson transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">{desc}</p>
        <span className="mt-3 inline-block text-sm font-medium text-hgm-crimson">
          {cta} →
        </span>
      </div>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-hgm-sapphire/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="text-hgm-crimson">{icon}</div>
        <p className="text-xs font-medium uppercase tracking-wide text-hgm-slate-grey">
          {label}
        </p>
      </div>
      <p className="mt-1 text-2xl font-bold text-hgm-sapphire">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-hgm-slate-grey">{sub}</span>}
      </p>
    </div>
  );
}

function HealthItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    normal: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-lg border border-hgm-sapphire/5 bg-hgm-cream p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-hgm-sapphire">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            statusColors[status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {status === "normal" ? "Normal" : status === "warning" ? "Waspada" : status === "danger" ? "Kritis" : "—"}
        </span>
      </div>
      <p className="mt-1 text-base font-semibold text-hgm-dark-bg">{value}</p>
    </div>
  );
}

function getBPStatus(systolic: number | null, diastolic: number | null): string {
  if (!systolic || !diastolic) return "normal";
  if (systolic >= 180 || diastolic >= 120) return "danger";
  if (systolic >= 140 || diastolic >= 90) return "warning";
  return "normal";
}

function getFluidStatus(avg: number | null): string {
  if (!avg) return "normal";
  if (avg >= 2000) return "danger";
  if (avg >= 1500) return "warning";
  return "normal";
}

function getAdherenceStatus(pct: number | null): string {
  if (!pct) return "normal";
  if (pct < 50) return "danger";
  if (pct < 80) return "warning";
  return "normal";
}

function getSugarStatus(avg: number | null): string {
  if (!avg) return "normal";
  if (avg >= 300) return "danger";
  if (avg >= 180) return "warning";
  return "normal";
}
