# PRODUCT REQUIREMENT DOCUMENT (PRD) — REVISI FITUR
## HGM (Hidup Ginjal Muda): Forum Diskusi, Analisis Foto, & Berita Ginjal
**Dokumen Versi:** 1.0.0  
**Target Rilis:** Q1 2027  
**Status:** Draf

---

## 1. RINGKASAN EKSEKUTIF

Revisi ini menambahkan empat fitur utama untuk meningkatkan engagement, dukungan sesama pasien, dan kualitas informasi:

1. **Sistem Data Pasien Terpadu** — Setiap pasien yang login tercatat data medisnya dan bisa mengakses semua fitur platform
2. **Forum Diskusi Online** — Menu diskusi antar pasien, caregiver, dan tenaga medis dengan kategori khusus
3. **Upload & Analisis Foto** — Pasien upload foto (luka, exit site, makanan, hasil lab) untuk dianalisis AI dan/atau admin
4. **Berita & Update Seputar Ginjal** — Halaman berita khusus dengan artikel terkini, bisa dishare dan dikomentari

---

## 2. FITUR 1: SISTEM DATA PASIEN TERPADU

### 2.1. Deskripsi

Setiap pasien yang login (via Clerk) akan memiliki profil medis lengkap yang tersimpan di database. Semua data — catatan harian, jadwal terapi, hasil lab, riwayat forum, riwayat chat, analisis foto — terpusat pada satu akun pasien.

### 2.2. Alur Pendaftaran & Data

| Langkah | Proses |
|---------|--------|
| 1 | Pasien login via Clerk (Google OAuth / email) |
| 2 | Redirect ke halaman **Onboarding** |
| 3 | Pasien mengisi: nama lengkap, tanggal lahir, tipe terapi (HD/CAPD), diagnosis, golongan darah, alergi, komorbid, kontak darurat |
| 4 | Data disimpan ke model `User`, `PatientMedicalInfo`, `EmergencyContact` |
| 5 | Pasien diarahkan ke Dashboard |

### 2.3. Profil Pasien (Halaman `/profil`)

| Komponen | Data |
|----------|------|
| **Info Dasar** | Nama, email, nomor telepon, tanggal lahir, jenis kelamin |
| **Info Medis** | Golongan darah, rhesus, diagnosis primer, komorbid, alergi, riwayat operasi ginjal |
| **Terapi** | Tipe (HD/CAPD), rumah sakit/klinik, dokter nefrolog, tanggal mulai terapi, frekuensi HD/minggu |
| **Kontak Darurat** | Nama, relasi, nomor telepon — bisa tambah multiple |
| **Akses Fitur** | Tabel riwayat penggunaan fitur (catatan harian, forum, kalkulator, dll) |

### 2.4. Database Schema (Existing)

Model yang sudah ada dan siap digunakan:

- `User` — id, email, name, role
- `PatientMedicalInfo` — bloodType, rhesus, diagnosis, allergies, comorbidities
- `EmergencyContact` — name, relation, phone, isPrimary

### 2.5. API Endpoints

```
GET    /api/profile              — Data profil pasien + info medis + kontak darurat
PUT    /api/profile              — Update profil dasar
PUT    /api/profile/medical      — Update info medis
POST   /api/profile/emergency    — Tambah kontak darurat
DELETE /api/profile/emergency/[id] — Hapus kontak darurat
GET    /api/profile/usage        — Riwayat penggunaan fitur
```

---

## 3. FITUR 2: FORUM DISKUSI ONLINE

### 3.1. Deskripsi

Forum diskusi khusus pasien ginjal, caregiver, dan tenaga medis. Tempat berbagi pengalaman, bertanya, dukungan moral, dan informasi seputar hidup dengan penyakit ginjal.

### 3.2. Kategori Forum

| Kategori | Slug | Deskripsi |
|----------|------|-----------|
| Umum | umum | Diskusi bebas seputar penyakit ginjal |
| Nutrisi & Diet | nutrisi | Resep, tips makan, pengalaman diet ginjal |
| Hemodialisis | hemodialisis | Pengalaman HD, akses vaskular, efek samping |
| CAPD | capd | Tips CAPD, exit site, masalah kateter |
| Psikologi | psikologi | Kesehatan mental, dukungan moral, motivasi |
| Transplantasi | transplantasi | Pengalaman transplantasi, waiting list, pasca-op |
| Obat & Lab | obat-lab | Diskusi obat, hasil lab, interpretasi |
| Cerita & Motivasi | cerita | Berbagi kisah inspiratif dan perjuangan |

### 3.3. Fitur

#### 3.3.1. Thread & Reply

- **Buat Thread**: Judul, konten (rich text), kategori, opsi anonim
- **Reply**: Balas thread, opsi anonim, rich text
- **Best Answer**: Penulis thread bisa menandai satu reply sebagai jawaban terbaik
- **Upvote**: Upvote reply yang bermanfaat
- **View Count**: Hitung jumlah views per thread
- **Lock Thread**: Admin bisa mengunci thread jika perlu
- **Pin Thread**: Admin bisa pin thread penting ke atas

#### 3.3.2. Fitur Sosial

| Fitur | Deskripsi |
|-------|-----------|
| **Anonymous Posting** | Opsi sembunyikan identitas saat posting (nama diganti "Anonim") |
| **Bookmark** | Simpan thread untuk dibaca nanti |
| **Search** | Cari thread berdasarkan judul, konten, kategori |
| **Filter** | Filter: kategori, terbaru, terpopuler, belum terjawab |
| **Tag Ahli** | Mention @admin atau @dokter untuk jawaban profesional |
| **Share** | Bagikan thread ke WhatsApp, Telegram |

#### 3.3.3. Moderasi Admin

| Aksi Admin | Hak |
|------------|-----|
| Hapus thread/reply | SUPER_ADMIN, CONTENT_EDITOR |
| Lock thread | SUPER_ADMIN |
| Pin thread | SUPER_ADMIN, CONTENT_EDITOR |
| Edit thread/reply | SUPER_ADMIN |
| Ban user dari forum | SUPER_ADMIN |

### 3.4. Database Schema (Existing — Siap Pakai)

```prisma
model ForumCategory {
  id           String        @id @default(cuid())
  name         String
  slug         String        @unique
  description  String?
  order        Int           @default(0)
  createdAt    DateTime      @default(now())
  forumThreads ForumThread[]
}

model ForumThread {
  id          String        @id @default(cuid())
  categoryId  String
  category    ForumCategory @relation(fields: [categoryId], references: [id])
  title       String
  content     String        // HTML
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  isAnonymous Boolean       @default(false)
  isPinned    Boolean       @default(false)
  isLocked    Boolean       @default(false)
  viewCount   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  replies     ForumReply[]
}

model ForumReply {
  id           String      @id @default(cuid())
  threadId     String
  thread       ForumThread @relation(fields: [threadId], references: [id])
  content      String      // HTML
  authorId     String
  author       User        @relation(fields: [authorId], references: [id])
  isAnonymous  Boolean     @default(false)
  isBestAnswer Boolean     @default(false)
  upvoteCount  Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  @@index([threadId])
}
```

### 3.5. API Endpoints

```
// Kategori
GET    /api/forum/categories              — List kategori

// Thread
GET    /api/forum/threads                 — List threads (filter: category, sort, search, page)
POST   /api/forum/threads                 — Buat thread baru
GET    /api/forum/threads/[id]            — Detail thread + replies
PUT    /api/forum/threads/[id]            — Update thread (author/admin only)
DELETE /api/forum/threads/[id]            — Hapus thread (author/admin only)
PUT    /api/forum/threads/[id]/pin        — Pin thread (admin only)
PUT    /api/forum/threads/[id]/lock       — Lock thread (admin only)
GET    /api/forum/threads/[id]/views      — Increment view count

// Reply
POST   /api/forum/replies                 — Tambah reply
PUT    /api/forum/replies/[id]            — Edit reply (author/admin only)
DELETE /api/forum/replies/[id]            — Hapus reply (author/admin only)
PUT    /api/forum/replies/[id]/best       — Tandai best answer (author thread only)
PUT    /api/forum/replies/[id]/upvote     — Upvote reply

// Bookmark
POST   /api/forum/bookmarks              — Bookmark thread
DELETE /api/forum/bookmarks/[threadId]   — Hapus bookmark
GET    /api/forum/bookmarks              — List bookmark user
```

### 3.6. UI/UX

```
┌─ Forum Komunitas ──────────────────────┐
│                                         │
│  [Cari thread...]              [+Thread]│
│                                         │
│  Kategori:                              │
│  [Umum] [HD] [CAPD] [Nutrisi] [...]    │
│                                         │
│  Filter: ○ Terbaru ● Populer ○         │
│           Belum Terjawab                │
│                                         │
│ ┌─ Thread ──────────────────────────┐   │
│ │ 📌 [Pin] Tips Mengatasi Haus      │   │
│ │     saat HD — oleh Admin          │   │
│ │     💬 12 ⭐ 5 🔥 1.2k           │   │
│ ├────────────────────────────────────┤   │
│ │ ❓ BB naik 3kg setelah libur HD   │   │
│ │     — oleh Anonim                  │   │
│ │     💬 8 ⭐ 2 🔥 340              │   │
│ ├────────────────────────────────────┤   │
│ │ 💊 Pengalaman minum pengikat      │   │
│ │     fosfat — oleh Budi S.          │   │
│ │     💬 23 ⭐ 12 🔥 890            │   │
│ └────────────────────────────────────┘   │
│                                         │
│  Halaman: < 1 2 3 ... 10 >              │
└─────────────────────────────────────────┘
```

### 3.7. Halaman

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Forum Home | `/forum` | Daftar thread + sidebar kategori |
| Detail Thread | `/forum/[id]` | Thread + replies |
| Buat Thread | `/forum/buat` | Form create thread |
| Edit Thread | `/forum/[id]/edit` | Form edit thread |
| Forum Admin | `/admin/forum` | Moderasi threads & replies |

---

## 4. FITUR 3: UPLOAD & ANALISIS FOTO

### 4.1. Deskripsi

Pasien dapat mengunggah foto (luka, exit site kateter, makanan, hasil lab, resep obat) yang akan dianalisis oleh AI dan/atau admin. Memberikan insight cepat dan rekomendasi tindakan.

### 4.2. Tipe Upload

| Tipe | Contoh | Analisis AI | Analisis Admin |
|:----:|--------|:-----------:|:--------------:|
| **Luka/Eksit Site** | Foto luka, kemerahan, bengkak | Deteksi infeksi, peradangan | ✅ konfirmasi |
| **Makanan** | Foto makanan yang akan dimakan | Identifikasi makanan, estimasi nutrisi (Na, K, P) | ❌ |
| **Hasil Lab** | Foto hasil lab (kertas/fotocopy) | OCR baca nilai lab, flag nilai abnormal | ✅ verifikasi |
| **Resep Obat** | Foto resep/box obat | OCR baca nama obat, dosis | ✅ verifikasi |
| **Dokumen** | Surat rujukan, surat kontrol | OCR teks | ❌ |

### 4.3. Fitur

#### 4.3.1. Upload & Pemrosesan

| Langkah | Proses |
|---------|--------|
| 1 | Pasien pilih tipe upload, ambil foto (kamera/gallery) |
| 2 | File diupload ke server → disimpan sementara |
| 3 | **Analisis AI** (otomatis): |
|    | - Untuk **luka**: deteksi kemerahan, bengkak, nanah → skor infeksi |
|    | - Untuk **makanan**: klasifikasi makanan, estimasi kandungan Na/K/P |
|    | - Untuk **lab/obat**: OCR ekstrak teks, strukturkan data |
| 4 | Hasil AI ditampilkan ke pasien dalam <30 detik |
| 5 | Jika perlu **verifikasi admin**: masuk ke antrian admin panel |
| 6 | Admin review, beri komentar/konfirmasi, kirim notifikasi ke pasien |

#### 4.3.2. Informasi yang Ditampilkan

**Upload Luka:**
```
🔴 Analisis Luka — 12 Jan 2027 14:30
├── Deteksi: Kemerahan area 3cm × 2cm
├── Skor Infeksi: 🟡 Ringan (40%)
├── Rekomendasi: Bersihkan dengan antiseptik,
│   pantau 24 jam. Jika memburuk, segera ke RS.
└── Status: ✅ Sudah diverifikasi admin
    └── Catatan Admin: "Tidak ada tanda infeksi
        serius. Lanjutkan perawatan rutin."
```

**Upload Makanan:**
```
🍽 Makanan Terdeteksi: Nasi + Ikan Bakar + Sayur Bayam
├── Estimasi Nutrisi:
│   ├── Kalori: 450 kcal
│   ├── Natrium: 380 mg 🟢 (Aman)
│   ├── Kalium: 520 mg 🟡 (Hati-hati)
│   └── Fosfor: 280 mg 🟢 (Aman)
└── Catatan: Batasi porsi sayur bayam (tinggi kalium)
```

### 4.4. Database Schema (New Models)

```prisma
enum PhotoType {
  WOUND
  FOOD
  LAB_RESULT
  PRESCRIPTION
  DOCUMENT
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  NEEDS_REVIEW
  VERIFIED
  REJECTED
}

model PhotoUpload {
  id             String         @id @default(cuid())
  patientId      String
  patient        User           @relation(fields: [patientId], references: [id])
  photoType      PhotoType
  imageUrl       String         // path ke file
  thumbnailUrl   String?        // thumbnail
  description    String?        // optional note from patient
  status         AnalysisStatus @default(PENDING)
  aiResult       String?        // JSON: hasil analisis AI
  aiConfidence   Float?         // 0-1
  aiProcessedAt  DateTime?
  adminNotes     String?        // catatan admin
  reviewedById   String?        // admin yang review
  reviewedBy     User?          @relation(fields: [reviewedById], references: [id])
  reviewedAt     DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([patientId, photoType])
  @@index([status])
}

model PhotoComment {
  id          String      @id @default(cuid())
  photoId     String
  photo       PhotoUpload @relation(fields: [photoId], references: [id])
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  content     String      // HTML
  isAdmin     Boolean     @default(false)
  createdAt   DateTime    @default(now())

  @@index([photoId])
}
```

### 4.5. API Endpoints

```
POST   /api/photos/upload              — Upload foto (multipart)
GET    /api/photos                     — List foto pasien (filter: type, status)
GET    /api/photos/[id]                — Detail foto + hasil analisis
DELETE /api/photos/[id]                — Hapus foto

// Admin
GET    /api/admin/photos               — List semua foto (filter: status, type)
PUT    /api/admin/photos/[id]/review   — Review: verifikasi/tolak + komentar

// Komentar
POST   /api/photos/[id]/comments       — Tambah komentar
GET    /api/photos/[id]/comments       — List komentar
```

### 4.6. Integrasi AI untuk Analisis Foto

| Tipe | Provider | Metode |
|:----:|----------|--------|
| Luka | OpenAI Vision / Claude Vision | Prompt: "Analisis foto luka ini: deteksi kemerahan, bengkak, nanah. Beri skor 0-100." |
| Makanan | OpenAI Vision / Claude Vision | Prompt: "Identifikasi makanan dalam foto. Estimasi kandungan natrium, kalium, fosfor." |
| Lab/Obat | OCR (Tesseract/Google Vision) + LLM | Ekstrak teks → LLM strukturkan data |

**Catatan:** Analisis AI bersifat *assistive* — tidak menggantikan diagnosis medis. Setiap hasil harus ditampilkan dengan disclaimer.

### 4.7. UI/UX

```
┌─ Upload & Analisis Foto ──────────────┐
│                                         │
│  Pilih tipe foto:                       │
│  [🩹 Luka] [🍽 Makanan] [🧪 Hasil Lab] │
│  [💊 Resep] [📄 Dokumen]               │
│                                         │
│  ┌─ Area Upload ─────────────────────┐  │
│  │  📸 Ambil Foto / 📂 Pilih File    │  │
│  │  (Drag & drop atau klik)          │  │
│  │  Maks: 10MB, format: JPG/PNG      │  │
│  └────────────────────────────────────┘  │
│                                         │
│  Deskripsi (opsional):                   │
│  [Ada kemerahan di sekitar exit site...] │
│                                         │
│  [Upload & Analisis]                     │
│                                         │
│  ┌─ Riwayat ─────────────────────────┐  │
│  │ 🩹 12 Jan — Luka — ✅ Sudah       │  │
│  │    diverifikasi admin              │  │
│  │ 🍽 10 Jan — Makanan — ⏳ Selesai │  │
│  │ 🧪 08 Jan — Lab — ⏳ Selesai     │  │
│  │    [Lihat Detail →]                │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 4.8. Halaman

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Upload Foto | `/analisis-foto` | Upload + riwayat |
| Detail Foto | `/analisis-foto/[id]` | Hasil analisis + komentar |
| Admin Review | `/admin/foto` | Queue foto perlu review |

---

## 5. FITUR 4: BERITA & UPDATE SEPUTAR GINJAL

### 5.1. Deskripsi

Halaman berita khusus yang menampilkan artikel-artikel terkini seputar kesehatan ginjal, penelitian terbaru, kebijakan BPJS, event komunitas, dan tips dari tenaga medis.

### 5.2. Kategori Berita

| Kategori | Slug | Contoh |
|----------|------|--------|
| Berita Terkini | terkini | Penemuan obat baru, kebijakan BPJS |
| Penelitian | penelitian | Studi terbaru tentang HD/CAPD |
| Event & Kegiatan | event | Seminar ginjal, webinar, walkathon |
| Tips Kesehatan | tips | Tips puasa untuk pasien ginjal, persiapan HD |
| Kebijakan & BPJS | kebijakan | Update BPJS, JKN, rujukan |
| Kisah Pasien | kisah | Feature story pasien ginjal |

### 5.3. Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Daftar Berita** | Card-style dengan thumbnail, judul, excerpt, tanggal, kategori |
| **Detail Berita** | Artikel lengkap dengan rich text, gambar, share button |
| **Share** | Bagikan ke WhatsApp, Telegram, Twitter, Facebook |
| **Komentar** | Komentar terbatas (login required, moderasi admin) |
| **Search** | Cari berita berdasarkan judul/konten |
| **Filter** | Filter kategori, urutkan terbaru/terpopuler |
| **Highlight** | Berita penting di-mark sebagai "Breaking" / "Highlight" |
| **Notifikasi** | Push notifikasi saat ada berita baru (opsional) |

### 5.4. Database Schema (New Model)

```prisma
model NewsArticle {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  excerpt       String?
  content       String      // HTML
  imageUrl      String?
  category      String      // terkini, penelitian, event, tips, kebijakan, kisah
  source        String?     // sumber berita (jika kutipan)
  sourceUrl     String?     // link sumber asli
  isPublished   Boolean     @default(false)
  isBreaking    Boolean     @default(false)
  isHighlighted Boolean     @default(false)
  viewCount     Int         @default(0)
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  comments NewsComment[]

  @@index([category, isPublished])
  @@index([publishedAt])
}

model NewsComment {
  id        String      @id @default(cuid())
  articleId String
  article   NewsArticle @relation(fields: [articleId], references: [id])
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  content   String
  isApproved Boolean    @default(false) // perlu moderasi
  createdAt DateTime    @default(now())

  @@index([articleId])
}
```

### 5.5. API Endpoints

```
GET    /api/news                     — List berita (filter: category, search, page)
GET    /api/news/[slug]              — Detail berita + increment view count
POST   /api/news                     — Buat berita (admin only)
PUT    /api/news/[id]                — Update berita (admin only)
DELETE /api/news/[id]                — Hapus berita (admin only)

// Komentar
POST   /api/news/[id]/comments       — Tambah komentar (login required)
GET    /api/news/[id]/comments       — List komentar (yang disetujui)

// Admin
GET    /api/admin/news               — List semua berita (draft + published)
PUT    /api/admin/news/[id]/publish  — Publish/unpublish
GET    /api/admin/news/comments      — List komentar perlu moderasi
PUT    /api/admin/news/comments/[id] — Approve/tolak komentar
```

### 5.6. UI/UX

```
┌─ Berita Ginjal ───────────────────────┐
│                                         │
│  [Cari berita...]                       │
│                                         │
│  Kategori: [Semua] [Terkini]            │
│  [Penelitian] [Event] [Tips] [Kisah]    │
│                                         │
│  ┌─ Highlight ──────────────────────┐   │
│  │ ⭐ [BREAKING] BPJS naikkan tarif │   │
│  │    dialisis 2027, ini dampaknya  │   │
│  │    — 2 jam lalu • 1.5k dibaca    │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌─ Berita ─────────────────────────┐   │
│  │ 🖼 [Gambar] Penelitian:          │   │
│  │    HD 2x vs 3x seminggu          │   │
│  │    — 5 jam lalu • 890 dibaca     │   │
│  ├────────────────────────────────────┤   │
│  │ 🖼 [Gambar] Tips: Puasa Aman     │   │
│  │    untuk Pasien Ginjal            │   │
│  │    — Kemarin • 2.3k dibaca       │   │
│  ├────────────────────────────────────┤   │
│  │ Kisah: Perjuangan Ibu Ani         │   │
│  │    25 tahun hidup dengan HD       │   │
│  │    — 3 hari lalu • 4.1k dibaca   │   │
│  └────────────────────────────────────┘   │
│                                         │
│  Halaman: < 1 2 3 ... 8 >               │
└─────────────────────────────────────────┘
```

### 5.7. Halaman

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Berita Home | `/berita` | Daftar berita + filter kategori |
| Detail Berita | `/berita/[slug]` | Artikel lengkap + komentar |
| Admin Berita | `/admin/berita` | CRUD berita + moderasi komentar |

---

## 6. STRUKTUR NAVIGASI (TERBARU)

```
HGM — Setelah Revisi Fitur

Beranda (Landing Page)
├── Academy (Artikel Edukasi)
├── Berita Ginjal ← [BARU]
├── Forum Komunitas ← [BARU]
└── Masuk/Daftar

Dashboard
├── Catatan Harian
├── Jadwal Terapi
├── Kalkulator Kt/V
├── Pengingat Makan
├── Chatbot AI
├── Forum Diskusi ← [BARU]
├── Analisis Foto ← [BARU]
└── Profil Saya ← [BARU]

Profil
├── Info Dasar
├── Info Medis
├── Kontak Darurat
└── Riwayat Aktivitas

Admin Panel
├── Branding Config
├── Academy Articles
├── Berita ← [BARU]
├── Forum Moderasi ← [BARU]
└── Review Foto ← [BARU]
```

---

## 7. PRIORITAS IMPLEMENTASI

| Prioritas | Fitur | Estimasi |
|:---------:|-------|:--------:|
| **P0** | Forum: CRUD kategori + thread + reply | 5 hari |
| **P0** | Profil pasien + onboarding + info medis | 3 hari |
| **P1** | Forum: anonymous posting, upvote, best answer | 3 hari |
| **P1** | Berita: CRUD + list + detail + kategori | 4 hari |
| **P1** | Upload foto: upload + simpan + galeri pasien | 3 hari |
| **P2** | Forum: bookmark, search, filter, pagination | 3 hari |
| **P2** | Berita: komentar + moderasi | 2 hari |
| **P2** | Analisis foto AI (luka + makanan) | 5 hari |
| **P3** | Analisis foto OCR untuk lab + obat | 5 hari |
| **P3** | Forum: tag ahli, notifikasi reply | 3 hari |
| **P3** | Berita: notifikasi push berita baru | 2 hari |
| **P3** | Admin queue untuk review foto | 2 hari |
| **P3** | Forum admin: moderasi threads & replies | 2 hari |

---

## 8. INTEGRASI DENGAN FITUR EKSISTING

| Fitur Baru | Terintegrasi Dengan |
|------------|-------------------|
| Profil Pasien | Semua fitur (user ID sebagai foreign key) |
| Forum Diskusi | User, Notification, Admin panel |
| Analisis Foto | AI Chatbot (analisis), Admin panel, Notification |
| Berita | Academy (format artikel serupa), Notification, Share |

---

## 9. DATABASE SCHEMA UPDATE

### 9.1. Model Baru

| Model | Tabel | Fitur |
|-------|-------|-------|
| `PhotoUpload` | foto_upload | Upload & analisis foto |
| `PhotoComment` | foto_komentar | Komentar pada foto |
| `NewsArticle` | berita | Berita ginjal |
| `NewsComment` | berita_komentar | Komentar berita |

### 9.2. Model yang Diubah

| Model | Perubahan | Fitur |
|-------|-----------|-------|
| `User` | (tidak perlu perubahan — sudah punya semua relasi) | — |
| `ForumThread` | (existing — siap pakai) | Forum |
| `ForumReply` | (existing — siap pakai) | Forum |

### 9.3. Prisma Schema (Tambahan)

Tambahkan model berikut ke `prisma/schema.prisma`:

```prisma
enum PhotoType {
  WOUND
  FOOD
  LAB_RESULT
  PRESCRIPTION
  DOCUMENT
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  NEEDS_REVIEW
  VERIFIED
  REJECTED
}

model PhotoUpload {
  id             String         @id @default(cuid())
  patientId      String
  patient        User           @relation(fields: [patientId], references: [id])
  photoType      PhotoType
  imageUrl       String
  thumbnailUrl   String?
  description    String?
  status         AnalysisStatus @default(PENDING)
  aiResult       String?
  aiConfidence   Float?
  aiProcessedAt  DateTime?
  adminNotes     String?
  reviewedById   String?
  reviewedBy     User?          @relation(fields: [reviewedById], references: [id])
  reviewedAt     DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  comments       PhotoComment[]

  @@index([patientId, photoType])
  @@index([status])
}

model PhotoComment {
  id        String      @id @default(cuid())
  photoId   String
  photo     PhotoUpload @relation(fields: [photoId], references: [id])
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  content   String
  isAdmin   Boolean     @default(false)
  createdAt DateTime    @default(now())

  @@index([photoId])
}

model NewsArticle {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  excerpt       String?
  content       String
  imageUrl      String?
  category      String
  source        String?
  sourceUrl     String?
  isPublished   Boolean     @default(false)
  isBreaking    Boolean     @default(false)
  isHighlighted Boolean     @default(false)
  viewCount     Int         @default(0)
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  comments      NewsComment[]

  @@index([category, isPublished])
  @@index([publishedAt])
}

model NewsComment {
  id         String      @id @default(cuid())
  articleId  String
  article    NewsArticle @relation(fields: [articleId], references: [id])
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  content    String
  isApproved Boolean     @default(false)
  createdAt  DateTime    @default(now())

  @@index([articleId])
}
```

---

## 10. KEBUTUHAN TEKNIS & LINGKUNGAN

### 10.1. File Storage

| Kebutuhan | Solusi |
|-----------|--------|
| Upload foto pasien | Vercel Blob / Cloudinary / Uploadthing |
| Maks file size | 10MB per foto |
| Format | JPG, PNG, WebP |
| Thumbnail | Auto-generate 200×200px |
| Retention | 1 tahun (foto bisa dihapus pasien) |

### 10.2. AI / Machine Learning

| Analisis | Teknologi | Catatan |
|----------|-----------|---------|
| Analisis luka | OpenAI Vision API / Claude Vision | Biaya per analisis ~$0.01-0.05 |
| Analisis makanan | OpenAI Vision API / Claude Vision | Biaya per analisis ~$0.01-0.05 |
| OCR lab/obat | Google Vision API / Tesseract.js | Google Vision lebih akurat |
| Disclaimer | Setiap hasil AI wajib disclaimer medis | "Hasil ini hanya referensi" |

### 10.3. Storage & Bandwidth

| Metrik | Estimasi |
|--------|----------|
| Rata-rata upload/hari | 50-100 foto |
| Ukuran rata-rata | 2-5MB |
| Storage bulanan | ~10GB |
| CDN | Vercel Edge / Cloudinary |

---

## 11. DOKUMENTASI TERKAIT

- `prd.md` — PRD utama (branding, theme, admin, academy)
- `prd-features-v2.md` — PRD V2 (Kt/V, Pengingat Makan, Chatbot)
- `prd-services-ginjal.md` — PRD layanan kesehatan (catatan harian, jadwal terapi, dll)
- `prisma/schema.prisma` — Schema database utama
