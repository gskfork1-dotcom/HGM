import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    await client.execute(`PRAGMA foreign_keys = OFF`);

    await client.execute(`
      INSERT OR IGNORE INTO User (id, email, name, role)
      VALUES ('system', 'system@hgm.app', 'System', 'SUPER_ADMIN')
    `);

    await client.execute(`
      INSERT OR IGNORE INTO AppConfiguration (id, logoUrl, landingHeroTitle, landingHeroSub, updatedByUserId)
      VALUES (
        'global_config',
        '/assets/logo-default.svg',
        'Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda',
        'Platform premium pendamping Hemodialisis & CAPD',
        'system'
      )
    `);

    const articles = [
      {
        id: "art-hd-001", title: "Panduan Lengkap Hemodialisis untuk Pemula",
        category: "Hemodialisis",
        htmlBody: `<h2>Apa itu Hemodialisis?</h2><p>Hemodialisis (HD) adalah terapi pengganti ginjal yang menyaring darah menggunakan mesin dialisis. Darah Anda dialirkan ke mesin melalui akses vaskular (fistula atau AV graft), dibersihkan, lalu dikembalikan ke tubuh.</p><h3>Kapan HD Dibutuhkan?</h3><p>HD biasanya dimulai saat fungsi ginjal turun di bawah 15% (eGFR &lt; 15 mL/min/1.73m\u00B2) atau muncul gejala uremia.</p><h3>Frekuensi &amp; Durasi</h3><p>HD dilakukan 2-3 kali seminggu, masing-masing 4-5 jam per sesi.</p><h3>Tips Persiapan</h3><ul><li>Datang tepat waktu sesuai jadwal</li><li>Kenakan pakaian yang nyaman</li><li>Informasikan ke petugas jika ada keluhan</li></ul>`,
        isPublished: 1, authorId: "system"
      },
      {
        id: "art-capd-001", title: "CAPD: Dialisis Mandiri di Rumah",
        category: "CAPD",
        htmlBody: `<h2>Apa itu CAPD?</h2><p>CAPD (Continuous Ambulatory Peritoneal Dialysis) adalah dialisis peritoneal yang dilakukan sendiri di rumah.</p><h3>Keuntungan CAPD</h3><ul><li>Dilakukan di rumah, lebih fleksibel</li><li>Tidak perlu ke rumah sakit 3x/minggu</li></ul><h3>Peringatan Penting</h3><p>Kebersihan adalah kunci! Selalu cuci tangan dan gunakan teknik steril saat mengganti cairan.</p>`,
        isPublished: 1, authorId: "system"
      },
      {
        id: "art-nutrisi-001", title: "Diet Sehat untuk Pasien Ginjal",
        category: "Nutrisi",
        htmlBody: `<h2>Prinsip Diet Ginjal</h2><p>Nutrisi yang tepat sangat penting untuk pasien penyakit ginjal.</p><h3>Batasi Garam</h3><p>Kurangi konsumsi garam &lt; 2000 mg/hari. Hindari makanan olahan dan fast food.</p><h3>Batasi Kalium</h3><p>Hindari pisang, jeruk, kentang, tomat, alpukat dalam jumlah besar.</p><h3>Batasi Fosfor</h3><p>Hindari susu, keju, kacang-kacangan, soda.</p><h3>Cukup Protein</h3><p>1.0-1.2 g/kg BB/hari untuk pasien HD.</p>`,
        isPublished: 1, authorId: "system"
      },
      {
        id: "art-cairan-001", title: "Mengontrol Asupan Cairan untuk Pasien HD",
        category: "Hemodialisis",
        htmlBody: `<h2>Kenapa Cairan Harus Dibatasi?</h2><p>Antara sesi HD, kelebihan cairan menumpuk di tubuh karena ginjal tidak bisa membuangnya.</p><h3>Berapa Batas Cairan Saya?</h3><p>Kenaikan BB antar sesi HD tidak boleh lebih dari 3-4% dari BB kering.</p><h3>Tips Mengatasi Haus</h3><ul><li>Kumur-kumur dengan air dingin</li><li>Hisap permen asam (tanpa gula)</li><li>Gunakan gelas kecil untuk minum</li><li>Kurangi garam agar tidak cepat haus</li></ul>`,
        isPublished: 1, authorId: "system"
      },
      {
        id: "art-obat-001", title: "Mengenal Obat-obatan Pasien Ginjal",
        category: "Obat",
        htmlBody: `<h2>Obat untuk Pasien Ginjal</h2><p>Pasien ginjal biasanya mendapat beberapa obat berikut:</p><h3>1. Antihipertensi</h3><p>Mengontrol tekanan darah. Contoh: Amlodipine, Candesartan.</p><h3>2. Pengikat Fosfat</h3><p>Mengikat fosfor dari makanan. Diminum saat makan.</p><h3>3. Suplemen Zat Besi</h3><p>Untuk mengatasi anemia ginjal.</p><h3>4. Vitamin D Aktif</h3><p>Membantu penyerapan kalsium. Contoh: Calcitriol.</p><h3>5. Erythropoietin (EPO)</h3><p>Suntikan untuk merangsang produksi sel darah merah.</p>`,
        isPublished: 1, authorId: "system"
      },
      {
        id: "art-umum-001", title: "Mitos dan Fakta Seputar Penyakit Ginjal",
        category: "Edukasi",
        htmlBody: `<h2>Mitos vs Fakta</h2><h3>Mitos: Minum obat tekanan darah setiap hari merusak ginjal</h3><p>Fakta: Justru sebaliknya. Tekanan darah yang tidak terkontrol adalah penyebab utama kerusakan ginjal.</p><h3>Mitos: Pasien ginjal tidak boleh makan telur</h3><p>Fakta: Telur adalah sumber protein hewani yang baik dan aman dalam jumlah wajar.</p><h3>Mitos: Semakin banyak minum air, semakin sehat ginjal</h3><p>Fakta: Untuk pasien ginjal stadium lanjut, kelebihan cairan sangat berbahaya.</p>`,
        isPublished: 1, authorId: "system"
      },
    ];

    const insertSql = `INSERT OR IGNORE INTO AcademyArticle (id, title, category, htmlBody, isPublished, authorId, createdAt)
                       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;

    for (const a of articles) {
      await client.execute({ sql: insertSql, args: [a.id, a.title, a.category, a.htmlBody, a.isPublished, a.authorId] });
    }

    console.log(`Seeded ${articles.length} articles`);

    await client.execute(`PRAGMA foreign_keys = ON`);

    console.log("Seed data inserted successfully!");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    client.close();
  }
}

main();
