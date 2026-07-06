import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await prisma.appConfiguration.findUnique({
    where: { id: "global_config" },
  });

  const heroTitle =
    config?.landingHeroTitle ??
    "Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda";
  const heroSubtitle =
    config?.landingHeroSub ??
    "Platform premium pendamping Hemodialisis & CAPD";

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-hgm-dark-bg via-hgm-dark-bg to-hgm-sapphire">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-hgm-sapphire/30 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-6 text-lg leading-8 text-hgm-slate-grey sm:text-xl">
                {heroSubtitle}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-hgm-crimson px-6 py-3 text-base font-semibold text-white shadow-lg shadow-hgm-crimson/30 transition-all hover:bg-hgm-crimson/90 hover:shadow-xl hover:shadow-hgm-crimson/40"
                >
                  Mulai Sekarang
                </Link>
                <Link
                  href="/academy"
                  className="rounded-lg border border-white/20 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  Jelajahi Academy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-hgm-cream py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-hgm-sapphire">
              Kenapa HGM?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-hgm-slate-grey">
              Platform terintegrasi untuk pasien ginjal, caregiver, dan tenaga medis.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Monitoring Mandiri",
                  desc: "Catat dan pantau perkembangan terapi harian Anda secara real-time.",
                },
                {
                  title: "Edukasi Terpercaya",
                  desc: "Akses artikel dan video edukasi dari tenaga medis profesional.",
                },
                {
                  title: "Komunitas Supportif",
                  desc: "Terhubung dengan sesama pejuang ginjal dan caregiver.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-hgm-crimson">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-hgm-cream py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-hgm-sapphire">
              Alat Interaktif
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-hgm-slate-grey">
              Coba kalkulator dan alat bantu terapi ginjal secara gratis.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Link
                href="/dashboard/kalkulator-ktv"
                className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-hgm-crimson/30"
              >
                <h3 className="text-lg font-semibold text-hgm-crimson">Kalkulator Kt/V</h3>
                <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                  Hitung adequacy dialisis Anda dengan kalkulator Kt/V berbasis standar medis.
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-hgm-sapphire group-hover:text-hgm-crimson">
                  Coba Sekarang &rarr;
                </span>
              </Link>
              <Link
                href="/dashboard/pengingat-makan"
                className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-hgm-crimson/30"
              >
                <h3 className="text-lg font-semibold text-hgm-crimson">Pengingat Makan</h3>
                <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                  Atur jadwal makan dan pantau asupan nutrisi harian Anda.
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-hgm-sapphire group-hover:text-hgm-crimson">
                  Coba Sekarang &rarr;
                </span>
              </Link>
              <Link
                href="/dashboard/chatbot"
                className="group rounded-xl border border-hgm-sapphire/10 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-hgm-crimson/30"
              >
                <h3 className="text-lg font-semibold text-hgm-crimson">Chatbot AI</h3>
                <p className="mt-2 text-sm leading-6 text-hgm-slate-grey">
                  Tanya jawab seputar terapi ginjal dengan asisten AI.
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-hgm-sapphire group-hover:text-hgm-crimson">
                  Coba Sekarang &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-hgm-sapphire">
              Testimoni
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Siti Rahmawati",
                  role: "Pasien HD",
                  text: "HGM membantu saya mencatat jadwal hemodialisis dengan mudah. Sangat membantu!",
                },
                {
                  name: "Dr. Andi Pratama",
                  role: "Nefrolog",
                  text: "Platform ini memudahkan saya memantau perkembangan pasien dari jarak jauh.",
                },
                {
                  name: "Budi Santoso",
                  role: "Caregiver",
                  text: "Sebagai caregiver, HGM memberi saya panduan merawat anggota keluarga di rumah.",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-hgm-sapphire/10 bg-hgm-cream p-6"
                >
                  <p className="text-sm italic leading-6 text-hgm-slate-grey">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-hgm-sapphire">
                      {t.name}
                    </p>
                    <p className="text-xs text-hgm-slate-grey">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
