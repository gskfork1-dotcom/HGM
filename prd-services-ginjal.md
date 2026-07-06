# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Fitur Layanan Kesehatan Ginjal — HGM (Hidup Ginjal Muda)
**Dokumen Versi:** 1.0.0  
**Target Platform:** Web (Next.js / TailwindCSS / Turso)  
**Audiens:** Pasien Ginjal (HD & CAPD), Caregiver, Tenaga Medis

---

## 1. Ringkasan Eksekutif

HGM (Hidup Ginjal Muda) adalah platform pendamping premium untuk pasien Hemodialisis (HD) dan Continuous Ambulatory Peritoneal Dialysis (CAPD) di Indonesia. Dokumen ini mendefinisikan seluruh fitur layanan kesehatan ginjal yang perlu dibangun untuk melengkapi platform dari fase awal (landing + academy + admin + dashboard dasar) menuju platform kesehatan menyeluruh.

---

## 2. Peran Pengguna & Hak Akses

| Fitur | SUPER_ADMIN | CONTENT_EDITOR | CAREGIVER | PATIENT |
|-------|:-----------:|:--------------:|:---------:|:-------:|
| Kelola Akun Pengguna | ✅ | ❌ | ❌ | ❌ |
| Atur Konten Edukasi | ✅ | ✅ | ❌ | ❌ |
| Catatan Harian (milik sendiri) | ❌ | ❌ | ✅ | ✅ |
| Catatan Harian (pasien terhubung) | ❌ | ❌ | ✅ | ❌ |
| Jadwal Terapi (milik sendiri) | ❌ | ❌ | ✅ | ✅ |
| Jadwal Terapi (pasien terhubung) | ❌ | ❌ | ✅ | ❌ |
| Ringkasan Kesehatan | ✅ (semua) | ❌ | ✅ (terhubung) | ✅ |
| Manajemen Obat | ❌ | ❌ | ✅ (terhubung) | ✅ |
| Konsultasi Online | ❌ | ❌ | ✅ (terhubung) | ✅ |
| Forum Komunitas | ✅ (moderasi) | ✅ (moderasi) | ✅ | ✅ |
| Laporan Medis | ✅ (semua) | ❌ | ✅ (terhubung) | ✅ |
| Dashboard Analytics | ✅ | ❌ | ❌ | ❌ |
| Notifikasi Darurat | ❌ | ❌ | ✅ | ✅ |

---

## 3. Daftar Lengkap Fitur Layanan Kesehatan Ginjal

### 3.1. CATATAN HARIAN (Daily Health Logs)
**Prioritas:** P0 (Critical) — Wajib untuk MVP layanan kesehatan

#### 3.1.1. Deskripsi
Fitur pencatatan harian yang memungkinkan pasien/caregiver mencatat parameter kesehatan vital setiap hari. Data ini menjadi fondasi untuk ringkasan kesehatan dan laporan medis.

#### 3.1.2. Parameter yang Dicatat
| Parameter | Tipe Data | Satuan | Wajib | Catatan |
|-----------|-----------|--------|:-----:|---------|
| Tekanan Darah Sistolik | Number | mmHg | ✅ | |
| Tekanan Darah Diastolik | Number | mmHg | ✅ | |
| Berat Badan | Number (2 desimal) | kg | ✅ | Krusial untuk HD |
| Asupan Cairan | Number | ml | ✅ | Krusial untuk HD & CAPD |
| Output Urine | Number | ml | ✅ | |
| Suhu Tubuh | Number (1 desimal) | °C | ❌ | |
| Gula Darah | Number | mg/dL | ❌ | Untuk pasien DM |
| Keluhan / Gejala | Text (long) | — | ❌ | Free text |
| Mood / Energi | Enum (1-5) | — | ❌ | Skala Likert |
| Durasi Tidur | Number | jam | ❌ | |
| Kepatuhan Terapi | Boolean | — | ✅ | Apakah terapi dijalani hari ini |

#### 3.1.3. Fitur Tambahan
- **Riwayat 7/14/30 Hari**: Tampilkan grafik tren untuk setiap parameter
- **Ekspor CSV**: Unduh data catatan harian dalam format CSV
- **Target Harian**: Pengguna bisa menetapkan target (misal: asupan cairan max 1000ml/hari) dan sistem memberi warning jika terlampaui
- **Mode Caregiver**: Caregiver bisa mencatatkan data untuk pasien yang dia awasi
- **Pengisian Cepat**: Template pengisian cepat berdasarkan waktu (pagi/siang/malam)

#### 3.1.4. API Endpoints
```
GET    /api/daily-logs              — List logs (filter by date range, patientId)
POST   /api/daily-logs              — Create new log entry
GET    /api/daily-logs/[id]         — Get single log detail
PUT    /api/daily-logs/[id]         — Update log entry
DELETE /api/daily-logs/[id]         — Delete log entry
GET    /api/daily-logs/summary      — Summary stats for a date range
```

#### 3.1.5. Database Schema

```prisma
model DailyLog {
  id              String   @id @default(cuid())
  patientId       String
  patient         User     @relation(fields: [patientId], references: [id])
  entryDate       DateTime
  systolicBP      Int?
  diastolicBP     Int?
  weight          Float?
  fluidIntake     Int?     // ml
  urineOutput     Int?     // ml
  temperature     Float?
  bloodSugar      Int?     // mg/dL
  symptoms        String?  // keluhan
  mood            Int?     // 1-5
  sleepDuration   Float?   // jam
  therapyAdherence Boolean?
  notes           String?
  recordedById    String   // User id yang mengisi
  recordedBy      User     @relation(fields: [recordedById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([patientId, entryDate])
}
```

---

### 3.2. JADWAL TERAPI (Therapy Schedule)
**Prioritas:** P0 (Critical)

#### 3.2.1. Deskripsi
Manajemen jadwal untuk hemodialisis (biasanya 2-3x/minggu di klinik) dan CAPD (setiap hari di rumah). Dilengkapi pengingat, tracking kepatuhan, dan riwayat sesi.

#### 3.2.2. Tipe Terapi
| Tipe | Frekuensi | Lokasi | Di Input Oleh |
|------|-----------|--------|:------------:|
| Hemodialisis (HD) | 2-3x/minggu | Klinik/Rumah Sakit | Patient/Caregiver |
| CAPD | 4x/hari (setiap 4-6 jam) | Rumah | Patient/Caregiver |
| Konsultasi Dokter | Perjadwal | Klinik/RS | Patient/Caregiver |
| Cek Laboratorium | Perjadwal | Lab/RS | Patient/Caregiver |

#### 3.2.3. Fitur
- **Kalender Terapi**: Tampilan bulanan/mingguan/harian
- **Pengingat**: Notifikasi push H-1, H-1 jam, dan 30 menit sebelum jadwal
- **Konfirmasi Kehadiran**: Check-in setelah sesi selesai
- **Riwayat Sesi**: Catat durasi, lokasi, petugas, keluhan selama sesi
- **Jadwal Rutin**: Pattern recurring (misal: HD setiap Senin-Rabu-Jumat jam 07:00)
- **Export ke Google Calendar / iCal**
- **Mode Caregiver**: Caregiver bisa mengelola jadwal pasien

#### 3.2.4. API Endpoints
```
GET    /api/therapy-schedules       — List schedules (filter by patient, type, date)
POST   /api/therapy-schedules       — Create schedule
PUT    /api/therapy-schedules/[id]  — Update schedule
DELETE /api/therapy-schedules/[id]  — Delete schedule
POST   /api/therapy-sessions        — Check-in / record session completion
GET    /api/therapy-sessions        — Session history
```

#### 3.2.5. Database Schema

```prisma
enum TherapyType {
  HEMODIALYSIS
  CAPD
  DOCTOR_CONSULT
  LAB_CHECK
}

model TherapySchedule {
  id              String      @id @default(cuid())
  patientId       String
  patient         User        @relation(fields: [patientId], references: [id])
  therapyType     TherapyType
  title           String?     // optional custom label
  location        String?     // clinic/hospital name
  notes           String?
  isRecurring     Boolean     @default(false)
  recurringRule   String?     // RRULE or simple "mon,wed,fri"
  startTime       DateTime
  endTime         DateTime?
  durationMinutes Int?
  createdById     String
  createdBy       User        @relation(fields: [createdById], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  sessions        TherapySession[]

  @@index([patientId, startTime])
}

model TherapySession {
  id              String      @id @default(cuid())
  scheduleId      String
  schedule        TherapySchedule @relation(fields: [scheduleId], references: [id])
  patientId       String
  patient         User        @relation(fields: [patientId], references: [id])
  actualStartTime DateTime?
  actualEndTime   DateTime?
  completed       Boolean     @default(false)
  skipped         Boolean     @default(false)
  skipReason      String?
  symptoms        String?
  attendantName   String?     // petugas / perawat
  location        String?
  notes           String?
  confirmedById   String?
  confirmedBy     User?       @relation(fields: [confirmedById], references: [id])
  createdAt       DateTime    @default(now())

  @@index([patientId, scheduleId])
}
```

---

### 3.3. RINGKASAN KESEHATAN (Health Summary)
**Prioritas:** P0 (Critical)

#### 3.3.1. Deskripsi
Dasbor ringkasan kondisi kesehatan pasien berdasarkan data harian, lab, dan sesi terapi. Menampilkan tren, pencapaian target, dan insight otomatis.

#### 3.3.2. Komponen Ringkasan
| Komponen | Sumber Data | Visualisasi |
|----------|-------------|-------------|
| Rata-rata TD 7/30 hari | DailyLog | Angka + indikator normal/tinggi |
| Rata-rata BB 7/30 hari | DailyLog | Grafik garis + delta BB antar sesi |
| Total asupan cairan vs target | DailyLog | Progress bar (real-time harian) |
| Kepatuhan terapi (%) | TherapySession | Donut chart + streak |
| Tren GFR / Creatinine | LabResult | Grafik garis |
| Level Albumin | LabResult | Angka + indikator |
| Hasil Lab Terbaru | LabResult | Tabel |
| Riwayat Masuk RS | HospitalRecord | Timeline |

#### 3.3.3. Insight Otomatis (AI-driven)
- "Berat badan Anda naik 2.5kg sejak sesi HD terakhir — melebihi batas amat 2kg"
- "Tekanan darah cenderung tinggi dalam 7 hari terakhir — konsultasikan dengan nefrolog"
- "Kepatuhan terapi Anda 100% minggu ini! Pertahankan!"
- "Asupan cairan kemarin 1500ml — melebihi target harian 1000ml"

#### 3.3.4. API Endpoints
```
GET /api/health-summary/:patientId        — Full summary
GET /api/health-summary/:patientId/trends — Trend data for charts
GET /api/health-summary/:patientId/insights — AI-generated insights
```

---

### 3.4. MANAJEMEN OBAT (Medication Management)
**Prioritas:** P1 (High)

#### 3.4.1. Deskripsi
Manajemen daftar obat yang dikonsumsi pasien ginjal, dosis, jadwal minum, dan pengingat. Pasien ginjal biasanya memiliki banyak obat (antihipertensi, pengikat fosfat, suplemen zat besi, vitamin D, dll).

#### 3.4.2. Fitur
- **Daftar Obat**: Nama, dosis, frekuensi, waktu minum, catatan (sebelum/sesudah makan)
- **Pengingat Minum Obat**: Notifikasi push sesuai jadwal
- **Riwayat Konsumsi**: Log minum obat (dicatat manual atau QR code pada blister)
- **Stok Obat**: Tracking sisa obat, pengingat refill
- **Interaksi Obat**: Warning jika obat baru berpotensi interaksi (data statis awal)
- **Mode Caregiver**: Caregiver bisa manage obat pasien

#### 3.4.3. Kategori Obat Ginjal
| Kategori | Contoh | Catatan |
|----------|--------|---------|
| Antihipertensi | Amlodipine, Candesartan | Hampir semua pasien ginjal |
| Pengikat Fosfat | Calcium Carbonate, Sevelamer | Diminum saat makan |
| Suplemen Besi | Ferrous Sulfate, Iron Sucrose | Untuk anemia ginjal |
| Vitamin D | Calcitriol | Untuk tulang |
| Erythropoietin (ESA) | EPO, Darbepoetin | Suntikan, jadwal khusus |
| Diuretik | Furosemide | Untuk kelebihan cairan |
| Obat Lain | Insulin (DM), dll | Komorbid |

#### 3.4.4. Database Schema

```prisma
model Medication {
  id              String   @id @default(cuid())
  patientId       String
  patient         User     @relation(fields: [patientId], references: [id])
  name            String
  category        String?  // antihypertensive, phosphate-binder, iron, vitamin-d, esa, diuretic, other
  dosage          String   // e.g. "10mg", "500mg"
  frequency       String   // e.g. "1×/hari", "3×/hari"
  times           String   // JSON array of times: ["06:00","18:00"]
  withFood        Boolean  @default(false)
  notes           String?
  currentStock    Int?     // remaining pills/tablets
  stockAlertAt    Int?     // notify when stock below this
  isActive        Boolean  @default(true)
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  logs            MedicationLog[]

  @@index([patientId])
}

model MedicationLog {
  id             String     @id @default(cuid())
  medicationId   String
  medication     Medication @relation(fields: [medicationId], references: [id])
  patientId      String
  takenAt        DateTime
  taken          Boolean    @default(true)
  skippedReason  String?
  notes          String?
  recordedById   String
  recordedBy     User       @relation(fields: [recordedById], references: [id])
  createdAt      DateTime   @default(now())

  @@index([medicationId, takenAt])
}
```

---

### 3.5. HASIL LABORATORIUM (Lab Results)
**Prioritas:** P1 (High)

#### 3.5.1. Deskripsi
Pencatatan dan visualisasi hasil pemeriksaan laboratorium berkala pasien ginjal. Data ini sangat penting untuk monitoring progres penyakit dan efektivitas terapi.

#### 3.5.2. Parameter Lab Ginjal
| Parameter | Satuan | Frekuensi Pengecekan | Catatan |
|-----------|--------|:--------------------:|---------|
| Ureum / BUN | mg/dL | Bulanan | Indikator fungsi ginjal |
| Creatinine | mg/dL | Bulanan | Indikator fungsi ginjal |
| eGFR | ml/min/1.73m² | Bulanan | Dihitung dari kreatinin |
| Kalium (K+) | mEq/L | Bulanan | Risiko hiperkalemia |
| Natrium (Na+) | mEq/L | Bulanan | |
| Fosfor (P) | mg/dL | Bulanan | Risiko hiperfosfatemia |
| Kalsium (Ca) | mg/dL | Bulanan | |
| Albumin | g/dL | Bulanan | Status nutrisi |
| Hemoglobin | g/dL | Bulanan | Anemia ginjal |
| Ferritin | ng/mL | 3 bulanan | Status zat besi |
| PTH | pg/mL | 3 bulanan | Tulang |
| Bicarbonate | mEq/L | Bulanan | Asidosis metabolik |
| HbA1c | % | 3 bulanan | Jika DM |
| GDP/GDS | mg/dL | Bulanan | Jika DM |

#### 3.5.3. Fitur
- Input hasil lab (manual / upload foto)
- Grafik tren per parameter
- Rentang normal per parameter (flag merah/kuning/hijau)
- Notifikasi jika nilai kritis
- Ekspor PDF laporan lab
- Target rekomendasi (berdasarkan guideline KDIGO/PERNEFRI)

#### 3.5.4. Database Schema

```prisma
model LabResult {
  id           String   @id @default(cuid())
  patientId    String
  patient      User     @relation(fields: [patientId], references: [id])
  testDate     DateTime
  labName      String?  // nama laboratorium
  notes        String?
  recordedById String
  recordedBy   User     @relation(fields: [recordedById], references: [id])
  createdAt    DateTime @default(now())

  parameters   LabParameter[]

  @@index([patientId, testDate])
}

model LabParameter {
  id          String    @id @default(cuid())
  labResultId String
  labResult   LabResult @relation(fields: [labResultId], references: [id])
  name        String    // e.g. "ureum", "creatinine", "kalium"
  value       Float
  unit        String
  normalMin   Float?    // rentang normal bawah
  normalMax   Float?    // rentang normal atas
  isCritical  Boolean?  // flag jika di luar rentang aman
  createdAt   DateTime  @default(now())

  @@index([labResultId])
}
```

---

### 3.6. FORUM KOMUNITAS (Community Forum)
**Prioritas:** P1 (High)

#### 3.6.1. Deskripsi
Forum diskusi untuk pasien ginjal, caregiver, dan tenaga medis. Tempat berbagi pengalaman, bertanya, dan mendapatkan dukungan.

#### 3.6.2. Fitur
- **Kategori Forum**: Umum, Nutrisi, HD, CAPD, Psikologi, Transplantasi
- **Thread & Reply**: Posting pertanyaan/cerita, reply dari pengguna lain
- **Upvote / Best Answer**: Untuk menandai jawaban terbaik
- **Tag Ahli**: Menandai tenaga medis jika perlu jawaban profesional
- **Bookmark**: Simpan thread penting
- **Search & Filter**: Cari thread berdasarkan kategori, tag, popularitas
- **Moderasi Admin**: Hapus/lapor konten tidak pantas
- **Anonymous Posting**: Opsi anonim untuk privasi

#### 3.6.3. Database Schema

```prisma
model ForumCategory {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}

model ForumThread {
  id           String          @id @default(cuid())
  categoryId   String
  category     ForumCategory   @relation(fields: [categoryId], references: [id])
  title        String
  content      String          // HTML
  authorId     String
  author       User            @relation(fields: [authorId], references: [id])
  isAnonymous  Boolean         @default(false)
  isPinned     Boolean         @default(false)
  isLocked     Boolean         @default(false)
  viewCount    Int             @default(0)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  replies      ForumReply[]
}

model ForumReply {
  id         String      @id @default(cuid())
  threadId   String
  thread     ForumThread @relation(fields: [threadId], references: [id])
  content    String      // HTML
  authorId   String
  author     User        @relation(fields: [authorId], references: [id])
  isAnonymous Boolean    @default(false)
  isBestAnswer Boolean   @default(false)
  upvoteCount Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([threadId])
}
```

---

### 3.7. KONSULTASI ONLINE (Teleconsultation)
**Prioritas:** P2 (Medium)

#### 3.7.1. Deskripsi
Fitur konsultasi dengan tenaga medis (nefrolog, perawat dialisis, ahli gizi) secara online melalui chat atau video call.

#### 3.7.2. Fitur
- **Daftar Tenaga Medis**: Profil nefrolog, perawat, ahli gizi yang terdaftar
- **Jadwal Praktik**: Lihat ketersediaan dan booking slot
- **Chat Konsultasi**: Chat real-time dengan dokter
- **Video Call**: Integrasi WebRTC / third-party (Daily, Whereby, dll)
- **Riwayat Konsultasi**: Semua riwayat chat/konsultasi tersimpan
- **Resep Digital**: Dokter bisa memberikan resep digital (terintegrasi Manajemen Obat)
- **Catatan Medis**: Dokter bisa menambahkan catatan ke rekam medis pasien

#### 3.7.3. Database Schema

```prisma
model MedicalStaff {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  profession    String   // nephrologist, dialysis-nurse, nutritionist
  licenseNumber String?
  hospital      String?
  bio           String?
  isAvailable   Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model Consultation {
  id             String      @id @default(cuid())
  patientId      String
  patient        User        @relation(fields: [patientId], references: [id])
  staffId        String
  staff          MedicalStaff @relation(fields: [staffId], references: [id])
  scheduledAt    DateTime?
  startedAt      DateTime?
  endedAt        DateTime?
  status         String      // pending, confirmed, in-progress, completed, cancelled
  type           String      // chat, video
  notes          String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  messages       ConsultationMessage[]
}

model ConsultationMessage {
  id              String       @id @default(cuid())
  consultationId  String
  consultation    Consultation @relation(fields: [consultationId], references: [id])
  senderId        String
  sender          User         @relation(fields: [senderId], references: [id])
  content         String
  messageType     String       // text, image, prescription
  createdAt       DateTime     @default(now())

  @@index([consultationId])
}
```

---

### 3.8. MANAJEMEN NUTRISI (Nutrition Management)
**Prioritas:** P2 (Medium)

#### 3.8.1. Deskripsi
Manajemen asupan nutrisi harian yang sesuai dengan diet ginjal (rendah protein, rendah garam, rendah kalium, rendah fosfat, cairan terbatas). Terintegrasi dengan Catatan Harian (asupan cairan).

#### 3.8.2. Fitur
- **Database Makanan**: Daftar makanan lokal Indonesia dengan kandungan nutrisi (proteinn, sodium, kalium, fosfor, kalori)
- **Buku Harian Makanan**: Catat apa yang dimakan setiap hari
- **Nutrient Counter**: Hitung total asupan nutrisi harian vs target
- **Rekomendasi Menu**: Saran menu berdasarkan diet ginjal (resep masakan)
- **Barcode Scanner**: Scan kemasan untuk info nutrisi
- **Cek Keamanan Makanan**: "Apakah ___ aman untuk ginjal?" — fitur tanya cepat
- **Warna Trafik**: Hijau (aman), Kuning (hati-hati), Merah (hindari) untuk setiap makanan

#### 3.8.3. Target Nutrisi Pasien Ginjal (Guideline)
| Nutrisi | Target Harian (HD) | Target Harian (CKD Non-Dialysis) |
|---------|:------------------:|:--------------------------------:|
| Protein | 1.0-1.2 g/kg BB | 0.6-0.8 g/kg BB |
| Natrium | <2000 mg | <2000 mg |
| Kalium | <2000 mg | <3000 mg |
| Fosfor | <800 mg | <800-1000 mg |
| Cairan | 500-1000 ml + output urine | Disesuaikan |

#### 3.8.4. Database Schema

```prisma
model FoodItem {
  id               String   @id @default(cuid())
  name             String
  category         String?  // sayuran, buah, protein, karbohidrat, dll
  servingSize      String?  // e.g. "100g", "1 porsi"
  calories         Int?
  protein          Float?   // g
  sodium           Int?     // mg
  potassium        Int?     // mg
  phosphorus       Int?     // mg
  fluid            Int?     // ml
  isSafeForKidney  String   // safe, caution, avoid
  imageUrl         String?
  createdAt        DateTime @default(now())
}

model FoodDiary {
  id          String       @id @default(cuid())
  patientId   String
  patient     User         @relation(fields: [patientId], references: [id])
  entryDate   DateTime
  mealTime    String       // breakfast, lunch, dinner, snack
  foodItemId  String
  foodItem    FoodItem     @relation(fields: [foodItemId], references: [id])
  portion     Float        // multiplier of servingSize
  notes       String?
  recordedById String
  recordedBy  User         @relation(fields: [recordedById], references: [id])
  createdAt   DateTime     @default(now())

  @@index([patientId, entryDate])
}
```

---

### 3.9. LAPORAN MEDIS (Medical Reports)
**Prioritas:** P2 (Medium)

#### 3.9.1. Deskripsi
Generate laporan kesehatan yang bisa dibagikan ke dokter atau diunduh. Merangkum data dari catatan harian, lab, dan sesi terapi dalam format yang informatif.

#### 3.9.2. Fitur
- **Laporan Bulanan**: Ringkasan 1 bulan — parameter vital, lab, kepatuhan terapi
- **Laporan Pra-Konsultasi**: Siapkan laporan singkat sebelum ke dokter
- **Ekspor PDF**: Cetak/unduh sebagai PDF
- **Share**: Bagikan langsung ke WhatsApp / Email
- **Template Dokter**: Format yang familiar untuk nefrolog Indonesia

#### 3.9.3. API Endpoints
```
GET  /api/reports/monthly/:patientId?year=&month= — Generate monthly report
GET  /api/reports/pre-consultation/:patientId     — Pre-consultation summary
POST /api/reports/generate                        — Generate custom report
```

---

### 3.10. PENGINGAT & NOTIFIKASI (Reminders & Notifications)
**Prioritas:** P1 (High)

#### 3.10.1. Deskripsi
Sistem notifikasi terpusat yang mengirim pengingat untuk berbagai aktivitas: minum obat, jadwal terapi, catatan harian, jadwal lab, dll.

#### 3.10.2. Jenis Notifikasi
| Tipe | Trigger | Channel |
|------|---------|---------|
| Pengingat Obat | Sesuai jadwal obat | Push, Email |
| Jadwal Terapi | H-1, H-1 jam, 30 menit | Push, Email |
| Catatan Harian | Pengingat mengisi setiap hari (misal jam 20:00) | Push |
| Jadwal Lab | H-1 | Push |
| Refill Obat | Stok < threshold | Push |
| Hasil Lab Kritis | Input lab dengan flag kritis | Push, Email |
| Artikel Baru | Academy publish | Push |
| Thread Forum | Reply ke thread yang diikuti | Push |
| Konsultasi | Konfirmasi/pengingat | Push, Email |
| Berat Badan Ekstrem | BB naik/turun drastis antar sesi | Push |

#### 3.10.3. Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // medication, therapy, daily-log, lab, stock, critical, article, forum, consultation
  title     String
  body      String?
  data      String?  // JSON payload
  isRead    Boolean  @default(false)
  channel   String   // push, email
  sentAt    DateTime @default(now())
  readAt    DateTime?

  @@index([userId, isRead])
  @@index([userId, sentAt])
}
```

---

### 3.11. FITUR DARURAT (Emergency Features)
**Prioritas:** P2 (Medium)

#### 3.11.1. Deskripsi
Fitur keselamatan untuk situasi darurat yang sering dialami pasien ginjal: sesak napas (overload cairan), hiperkalemia, hipotensi saat HD, dll.

#### 3.11.2. Fitur
- **Tombol Darurat**: Satu tekan untuk notifikasi ke kontak darurat
- **Kontak Darurat**: Daftar kontak (keluarga, klinik, ambulans)
- **Hospital Locator**: Cari RS dengan unit dialisis terdekat (Google Maps API)
- **Panduan Darurat**: Panduan singkat apa yang harus dilakukan berdasarkan gejala
- **Info Medis Cepat**: Akses cepat ke diagnosis, alergi, obat, golongan darah untuk petugas medis (dalam bentuk QR code atau text)
- **Gejala Darurat Checklist**: Deteksi dini gejala serius

#### 3.11.3. Gejala Darurat Ginjal
| Gejala | Kemungkinan | Tindakan |
|--------|-------------|----------|
| Sesak napas, BB naik drastis | Overload cairan | Segera HD |
| Lemas, jantung berdebar | Hiperkalemia | UGD |
| Mual, muntah, BB turun | Uremia | Konsultasi nefrolog |
| Pusing saat/setelah HD | Hipotensi | Baring, infus |
| Demam, kemerahan exit site | Infeksi CAPD | Segera ke RS |

#### 3.11.4. Database Schema

```prisma
model EmergencyContact {
  id          String @id @default(cuid())
  patientId   String
  patient     User   @relation(fields: [patientId], references: [id])
  name        String
  relation    String // spouse, child, sibling, parent, friend
  phone       String
  isPrimary   Boolean @default(false)
  createdAt   DateTime @default(now())
}

model PatientMedicalInfo {
  id              String @id @default(cuid())
  patientId       String @unique
  patient         User   @relation(fields: [patientId], references: [id])
  bloodType       String? // A, B, AB, O
  rhesus          String? // +/-
  diagnosis       String? // primary kidney disease
  allergies       String? // JSON array or comma separated
  comorbidities   String? // hypertension, diabetes, etc.
  medicationsSummary String? // ringkasan obat
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

### 3.12. EDUKASI VIDEO (Video Academy)
**Prioritas:** P2 (Medium) — Extension dari Academy yang sudah ada

#### 3.12.1. Deskripsi
Konten edukasi dalam bentuk video pendek yang bisa ditonton langsung di platform. Topik meliputi tutorial HD/CAPD, nutrisi, psikologi, mitos vs fakta.

#### 3.12.2. Fitur
- **Video Player**: In-browser video player (embed YouTube/Vimeo atau self-host)
- **Kategori**: Sama dengan Academy artikel
- **Progress Tracking**: Tandai sudah ditonton
- **Transkrip**: Teks pendamping video
- **Download**: Opsi unduh untuk video tertentu
- **Series**: Video bisa dikelompokkan dalam series pembelajaran

#### 3.12.3. Database Schema (Extension ke AcademyArticle)

```prisma
model AcademyVideo {
  id          String   @id @default(cuid())
  title       String
  description String?
  url         String   // URL video (YouTube/Vimeo embed or self-hosted)
  thumbnailUrl String?
  duration    Int?     // seconds
  category    String   // same as AcademyArticle categories
  isPublished Boolean  @default(false)
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  seriesId    String?  // optional grouping
  series      VideoSeries? @relation(fields: [seriesId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model VideoSeries {
  id          String   @id @default(cuid())
  title       String
  description String?
  order       Int
  createdAt   DateTime @default(now())
}

model VideoProgress {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  videoId   String
  video     AcademyVideo @relation(fields: [videoId], references: [id])
  watched   Boolean  @default(false)
  progress  Float?   // 0-100%
  createdAt DateTime @default(now())

  @@unique([userId, videoId])
}
```

---

### 3.13. MYTH VS FACT (Mitos vs Fakta)
**Prioritas:** P2 (Medium)

#### 3.13.1. Deskripsi
Fitur interaktif menampilkan mitos-mitos seputar penyakit ginjal dan terapi yang beredar di masyarakat, dilengkapi penjelasan faktual dari tenaga medis. Bisa dalam format artikel pendek, card swipe (mobile-friendly), atau quiz.

#### 3.13.2. Fitur
- **Card Swipe**: Geser ke kanan untuk fakta, ke kiri untuk mitos berikutnya
- **Explanasi**: Setiap card punya penjelasan medis
- **Daily Myth**: Satu mitos per hari (push notification)
- **Quiz Mode**: Tebak mitos atau fakta
- **Sharing**: Bagikan ke WhatsApp/Media Sosial
- **Rating**: Seberapa berguna informasi ini

#### 3.13.3. Database Schema

```prisma
model MythFact {
  id          String   @id @default(cuid())
  statement   String   // "Makan telur bikin ginjal rusak"
  isMyth      Boolean  // true = ini mitos, false = ini fakta
  explanation String   // HTML penjelasan medis
  source      String?  // referensi / guideline
  imageUrl    String?
  category    String?  // nutrisi, terapi, gaya-hidup
  isPublished Boolean  @default(false)
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

### 3.14. DAFTAR RUMAH SAKIT & KLINIK DIALISIS (Clinic Directory)
**Prioritas:** P3 (Low)

#### 3.14.1. Deskripsi
Direktori rumah sakit dan klinik yang memiliki unit hemodialisis/CAPD, dilengkapi informasi kontak, fasilitas, jam operasional, dan ratings.

#### 3.14.2. Fitur
- **Pencarian**: Berdasarkan kota/kabupaten
- **Filter**: HD, CAPD, BPJS, non-BPJS, 24 jam
- **Detail**: Alamat, telepon, jam, fasilitas, rating
- **Map View**: Tampilan peta
- **Review**: Rating dan review dari pasien
- **Ulasan BPJS**: Informasi apakah menerima BPJS

#### 3.14.3. Database Schema

```prisma
model DialysisClinic {
  id           String   @id @default(cuid())
  name         String
  address      String
  city         String
  province     String
  phone        String?
  latitude     Float?
  longitude    Float?
  hasHD        Boolean  @default(false)
  hasCAPD      Boolean  @default(false)
  acceptsBPJS  Boolean  @default(true)
  is24Hours    Boolean  @default(false)
  facilities   String?  // JSON array
  rating       Float?   // 1-5
  imageUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([city])
}
```

---

### 3.15. TRANSPLANTASI GINJAL (Kidney Transplant Tracker)
**Prioritas:** P3 (Low)

#### 3.15.1. Deskripsi
Fitur untuk pasien yang sedang dalam proses atau sudah menjalani transplantasi ginjal. Tracking persiapan, waiting list, follow-up pasca transplantasi.

#### 3.15.2. Fitur
- **Status Transplantasi**: Pra-transplantasi, waiting list, pasca-transplantasi
- **Checklist Pra-Transplantasi**: Tes kompatibilitas, evaluasi psikologis, dll
- **Tracking Obat Imunosupresan**: Kategori khusus dalam Manajemen Obat
- **Follow-up Schedule**: Jadwal kontrol pasca transplantasi
- **Laporan Fungsi Ginjal Baru**: eGFR, kreatinin, output urine
- **Support Group**: Forum khusus pasien transplantasi

#### 3.15.3. Database Schema

```prisma
model TransplantTracker {
  id                    String   @id @default(cuid())
  patientId             String   @unique
  patient               User     @relation(fields: [patientId], references: [id])
  status                String   // pre-transplant, waiting-list, post-transplant
  transplantDate        DateTime?
  hospital              String?
  donorType             String?  // living-related, living-unrelated, deceased
  bloodTypeMatch        String?
  crossMatchResult      String?  // positive, negative
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

### 3.16. ANALYTICS & INSIGHTS (Admin Dashboard)
**Prioritas:** P3 (Low)

#### 3.16.1. Deskripsi
Dasbor analitik untuk SUPER_ADMIN memantau penggunaan platform, tren data kesehatan pasien (anonim/agregat), dan efektivitas konten edukasi.

#### 3.16.2. Metrik
| Metrik | Deskripsi |
|--------|-----------|
| Total Pengguna Aktif | MAU / WAU / DAU |
| Pasien Terdaftar | Total + tren pertumbuhan |
| Kepatuhan Terapi | Rata-rata kepatuhan semua pasien |
| Artikel Populer | Artikel dengan views terbanyak |
| Forum Aktif | Thread + reply per hari |
| Distribusi Role | % Pasien vs Caregiver |
| Gejala Umum | Top 5 keluhan dari Catatan Harian |
| Rata-rata Parameter | TD, BB, GDS agregat |
| Engagement Harian | Rata-rata sesi per hari per pengguna |

---

## 4. PRIORITAS IMPLEMENTASI

| Fase | Fitur | Timeline Target |
|:----:|-------|:---------------:|
| **Fase 1** (MVP Layanan) | Catatan Harian, Jadwal Terapi, Ringkasan Kesehatan | Q3 2026 |
| **Fase 2** | Manajemen Obat, Hasil Lab, Notifikasi & Pengingat | Q4 2026 |
| **Fase 3** | Forum Komunitas, Edukasi Video, Myth vs Fact | Q1 2027 |
| **Fase 4** | Konsultasi Online, Manajemen Nutrisi, Laporan Medis | Q2 2027 |
| **Fase 5** | Fitur Darurat, Direktori Klinik, Transplantasi Tracker, Analytics | Q3 2027 |

---

## 5. STRUKTUR NAVIGASI (Setelah Semua Fitur)

```
Beranda (Dashboard)
├── Catatan Harian
│   ├── Entri Baru
│   ├── Riwayat
│   └── Grafik & Tren
├── Jadwal Terapi
│   ├── Kalender
│   ├── Tambah Jadwal
│   └── Riwayat Sesi
├── Obat
│   ├── Daftar Obat
│   ├── Tambah Obat
│   └── Riwayat Minum Obat
├── Hasil Lab
│   ├── Input Lab
│   └── Grafik Lab
├── Makanan & Nutrisi
│   ├── Buku Makanan
│   ├── Database Makanan
│   └── Rekomendasi Menu
├── Konsultasi
│   ├── Cari Dokter
│   ├── Jadwal Konsultasi
│   └── Riwayat Konsultasi
├── Forum Komunitas
│   ├── Kategori
│   ├── Thread Saya
│   └── Thread Populer
├── Academy
│   ├── Artikel
│   ├── Video
│   └── Mitos vs Fakta
├── Laporan
│   ├── Laporan Bulanan
│   └── Laporan Pra-Konsultasi
├── Darurat
│   ├── Tombol Darurat
│   ├── Kontak Darurat
│   └── Panduan Darurat
├── Direktori Klinik
└── Transplantasi (jika relevan)
```

---

## 6. INTEGRASI PIHAK KETIGA (Future Consideration)

| Layanan | Tujuan | Prioritas |
|---------|--------|:---------:|
| Google Calendar / iCal | Sinkronisasi jadwal terapi | Medium |
| WhatsApp API | Notifikasi + pengingat | High |
| Google Maps API | Hospital/clinic locator | Medium |
| Telemedicine API (Halodoc/YesDok) | Konsultasi online | Low |
| OCR untuk Hasil Lab | Scan hasil lab dari foto | Low |
| Wearable Integration (Garmin, Fitbit, Apple Health) | Data TD, BB, langkah | Low |
| BPJS API (jika tersedia) | Cek status kepesertaan | Low |

---

## 7. METRIK KEBERHASILAN (KPI)

| Metrik | Target 6 Bulan | Alat Ukur |
|--------|:--------------:|-----------|
| DAU > 30% registered users | >30% | System analytics |
| Catatan Harian diisi >20 hari/bulan | >70% pengguna aktif | DailyLog DB |
| Kepatuhan terapi tercatat | >80% | TherapySession DB |
| Artikel Academy selesai dibaca | >60% buka artikel | Analytics |
| Rating App Store (jika ada) | >4.5 | Play Store / App Store |
| Waktu respons notifikasi darurat | <5 menit | System log |
| Retensi 3 bulan | >60% | User login history |

---

## 8. PERTIMBANGAN KEAMANAN & PRIVASI

| Aspek | Implementasi |
|-------|-------------|
| Enkripsi Data | Data pribadi dan medis dienkripsi at rest (AES-256) |
| RBAC | Role-based access control untuk setiap endpoint |
| Audit Log | Semua akses dan perubahan data tercatat |
| Data Retention | Riwayat medis disimpan min 5 tahun (regulasi) |
| Consent | Persetujuan pengguna untuk penyimpanan data medis |
| GDPR / UU PDP | Kepatuhan terhadap UU Perlindungan Data Pribadi Indonesia |
| Backup | Backup harian database ke secondary storage |
| Rate Limiting | API rate limiting untuk mencegah abuse |

---

## 9. DOKUMENTASI TERKAIT

- `prd.md` — PRD utama (branding, theme, admin, academy)
- `prisma/schema.prisma` — Schema database utama
- `src/app/` — Routes & pages implementation
- `src/components/` — Komponen UI
