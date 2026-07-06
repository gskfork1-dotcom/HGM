# PRD Fitur V2 — Kalkulator Kt/V, Pengingat Makan, AI Chatbot
## HGM (Hidup Ginjal Muda)
**Versi:** 2.0.0  
**Target Rilis:** Q4 2026

---

## 1. RINGKASAN

Tiga fitur utama untuk meningkatkan manfaat klinis dan engagement pasien:
1. **Kalkulator Kt/V Kasar** — Estimasi kecukupan dialisis tanpa harus nunggu hasil lab
2. **Pengingat Makan & Nutrisi** — Jadwal makan sesuai diet ginjal dengan notifikasi
3. **AI Chatbot** — Asisten kesehatan berbasis AI untuk edukasi, tanya jawab, dan pengingat

---

## 2. KALKULATOR KT/V KASAR

### 2.1. Deskripsi

Fitur kalkulator untuk menghitung estimasi Kt/V (indikator kecukupan dialisis) berdasarkan parameter terapi yang dimasukkan pasien. Terdapat dua mode: **Lengkap** (dengan BUN) dan **Kasar** (tanpa BUN, hanya parameter terapi).

### 2.2. Target Pengguna
- Pasien HD yang ingin memantau kecukupan dialisis mandiri
- Perawat/dokter untuk skrining cepat

### 2.3. Parameter Input

#### Mode Lengkap (dengan BUN)
| Parameter | Satuan | Contoh |
|-----------|--------|--------|
| BUN Pre-dialisis | mg/dL | 80 |
| BUN Post-dialisis | mg/dL | 28 |
| Durasi Dialisis | jam | 4 |
| Berat Badan Sebelum (BB Pre) | kg | 65 |
| Berat Badan Sesudah (BB Post) | kg | 62.5 |

#### Mode Kasar (tanpa BUN)
| Parameter | Satuan | Contoh |
|-----------|--------|--------|
| QB (Blood Flow Rate) | mL/min | 300 |
| QD (Dialysate Flow Rate) | mL/min | 500 |
| Durasi Dialisis | jam | 4 |
| Berat Badan Sesudah (BB Post) | kg | 62.5 |
| Kehilangan Cairan (UF) | L | 2.5 |
| Usia | tahun | 45 |
| Tinggi Badan | cm | 165 |
| Jenis Kelamin | L/P | L |

### 2.4. Rumus yang Digunakan

#### Mode Lengkap — Daugirdas 2nd Generation (Standar PERNEFRI)
```
spKt/V = -ln(R - 0.008 × t) + (4 - 3.5 × R) × (UF / W)
```
| Variabel | Arti |
|----------|------|
| R | BUN Post / BUN Pre (rasio) |
| t | Durasi dialisis (jam) |
| UF | BB Pre - BB Post (kg = liter) |
| W | BB Post (kg) |

#### Mode Kasar — Parameter-Based Estimation
```
Kt/V ≈ (K × t_menit) / (V × 1000)
```
| Variabel | Arti | Cara Hitung |
|----------|------|-------------|
| K | Estimasi urea clearance (mL/min) | Tabel lookup berdasarkan QB & QD |
| t_menit | Durasi dialisis (menit) | t × 60 |
| V | Total body water (L) | Watson Formula |

**Tabel Estimasi K:**

| QB (mL/min) | QD (mL/min) | K (mL/min) |
|:-----------:|:-----------:|:----------:|
| 200 | 500 | QB × 0.80 = 160 |
| 250 | 500 | QB × 0.79 = 198 |
| 300 | 500 | QB × 0.78 = 234 |
| 350 | 500 | QB × 0.75 = 263 |
| 400 | 500 | QB × 0.70 = 280 |
| 300 | 800 | QB × 0.82 = 246 |
| 350 | 800 | QB × 0.80 = 280 |

Jika QD antara nilai di atas, lakukan interpolasi linear.

**Watson Formula:**
```
Pria:   V = 2.447 - 0.09516 × usia + 0.1074 × tinggi + 0.3362 × BB
Wanita: V = -2.097 + 0.1069 × tinggi + 0.2466 × BB
```
(usia dalam tahun, tinggi dalam cm, BB dalam kg)

### 2.5. Interpretasi Hasil

| spKt/V | Status | Warna | Keterangan |
|:------:|:------:|:-----:|------------|
| ≥ 1.4 | Optimal | 🟢 Hijau | Kecukupan dialisis baik (HD 3×/minggu) |
| 1.2 – 1.39 | Adekuat | 🟡 Kuning | Masih dalam batas target (KDOQI) |
| < 1.2 | Tidak Adekuat | 🔴 Merah | Perlu evaluasi dosis dialisis |
| ≥ 1.8 | Optimal | 🟢 Hijau | Target untuk HD 2×/minggu (PERNEFRI) |
| 1.4 – 1.79 | Adekuat | 🟡 Kuning | Target untuk HD 2×/minggu |
| < 1.4 | Tidak Adekuat | 🔴 Merah | Untuk HD 2×/minggu |

**Catatan:** Hasil mode **Kasar** adalah estimasi dan tidak menggantikan Kt/V lab.
Tampilkan disclaimer: *"Nilai ini adalah estimasi kasar. Konsultasikan dengan nefrolog Anda untuk evaluasi akurat."*

### 2.6. Riwayat & Grafik

- Semua hasil perhitungan tersimpan di riwayat
- Tampilkan grafik tren Kt/V dari waktu ke waktu
- Target line (1.2 dan 1.4) pada grafik
- Bisa ekspor PDF laporan Kt/V

### 2.7. Database Schema

```prisma
model KtVCalculation {
  id              String   @id @default(cuid())
  patientId       String
  calculationDate DateTime @default(now())
  mode            String   // "lengkap" or "kasar"

  // Mode Lengkap
  bunPre          Float?
  bunPost         Float?

  // Mode Kasar
  qb              Int?
  qd              Int?

  // Shared
  durationHours   Float
  weightPre       Float?
  weightPost      Float
  uf              Float?   // calculated or input
  age             Int?     // for Watson
  height          Int?     // for Watson
  gender          String?  // L/P for Watson

  // Result
  ktvResult       Float
  urr             Float?   // urea reduction ratio (only in lengkap mode)
  status          String   // optimal, adequate, inadequate
  notes           String?

  createdAt       DateTime @default(now())

  @@index([patientId, calculationDate])
}
```

### 2.8. API Endpoints

```
POST /api/ktv/calculate    — Hitung Kt/V (body: mode + parameters)
GET  /api/ktv/history      — Riwayat perhitungan (filter by patientId, date range)
GET  /api/ktv/[id]         — Detail perhitungan
DELETE /api/ktv/[id]       — Hapus riwayat
```

### 2.9. UI/UX

**Layout kalkulator:**
```
┌─ Kalkulator Kt/V ─────────────────────┐
│ ○ Mode Lengkap  ● Mode Kasar          │
│                                        │
│ ┌─ Input ──────────────────────────┐  │
│ │ QB: [300]     mL/min             │  │
│ │ QD: [500]     mL/min             │  │
│ │ Durasi: [4]   jam                │  │
│ │ BB Post: [62.5]  kg              │  │
│ │ Cairan hilang (UF): [2.5]  L     │  │
│ │ Usia: [45]   tahun               │  │
│ │ Tinggi: [165]  cm                │  │
│ │ JK: ● Laki-laki ○ Perempuan      │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [Hitung Kt/V]                          │
│                                        │
│ ┌─ Hasil ─────────────────────────┐   │
│ │ 📊 spKt/V: 1.45  🟢 Optimal     │   │
│ │ 📈 Target: ≥ 1.2                │   │
│ │ ℹ️ Estimasi berdasarkan          │   │
│ │ parameter terapi. Konsultasikan  │   │
│ │ dengan dokter Anda.              │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌─ Riwayat ───────────────────────┐   │
│ │ 📅 01/06 — 1.45 🟢              │   │
│ │ 📅 25/05 — 1.32 🟡              │   │
│ │ 📅 18/05 — 1.18 🔴              │   │
│ │ [Lihat Grafik Tren →]           │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

---

## 3. PENGINGAT MAKAN & NUTRISI

### 3.1. Deskripsi

Sistem pengingat makan yang cerdas berdasarkan jadwal terapi, diet ginjal, dan preferensi pasien. Terintegrasi dengan modul Manajemen Nutrisi dari PRD sebelumnya.

### 3.2. Fitur

#### 3.2.1. Jadwal Makan Personal
- Waktu makan: Sarapan, Makan Siang, Makan Malam, Snack (×2)
- Disesuaikan dengan jadwal HD (makan sebelum HD, saat HD, setelah HD)
- Rekomendasi menu berdasarkan waktu dan kondisi

#### 3.2.2. Pengingat Cerdas

| Trigger | Waktu | Notifikasi |
|---------|-------|------------|
| Jadwal makan rutin | 30 menit sebelum | "Waktunya sarapan. Hari ini kami rekomendasikan bubur ayam tanpa garam." |
| Sebelum HD | 2 jam sebelum | "Minum obat pengikat fosfat 30 menit sebelum makan." |
| Sesudah HD | 30 menit setelah | "Segera makan tinggi protein untuk mengganti asam amino yang hilang." |
| Minum obat | Sesuai jadwal obat | "Jangan lupa minum Calcium Carbonate saat makan." |
| Batas cairan | Jika mendekati batas | "Asupan cairan hari ini sudah 800ml. Batas Anda 1000ml/hari." |
| Cek lab | H-1 | "Besok cek lab, puasa 8 jam sebelumnya." |

#### 3.2.3. Rekomendasi Menu Harian

Berdasarkan:
- Hari dalam siklus HD (hari HD vs non-HD)
- Kebutuhan nutrisi (protein, sodium, kalium, fosfor, cairan)
- Database makanan dari modul FoodItem
- Musim/ketersediaan bahan makanan lokal

**Contoh Rekomendasi:**
```
Hari ini jadwal HD (sesi 1)
├── 🍚 Sarapan (06:00): Nasi tim + telur rebus (rendah fosfor)
├── 💧 Minum obat pengikat fosfat (06:30)
├── 🏥 HD (07:00-11:00)
├── 🍽 Makan Siang (11:30): Ikan tongkol + tahu + sayur bening
├── 🥜 Snack (15:00): Buah apel (rendah kalium)
├── 💊 Obat malam
└── 🍲 Makan Malam (18:00): Ayam panggang + kentang rebus
```

#### 3.2.4. Mode Caregiver
- Caregiver bisa set pengingat makan untuk pasien
- Notifikasi dikirim ke caregiver dan pasien

### 3.3. Database Schema (Additions)

```prisma
model MealReminder {
  id            String   @id @default(cuid())
  patientId     String
  mealTime      String   // breakfast, lunch, dinner, snack1, snack2
  time          String   // HH:mm format
  isActive      Boolean  @default(true)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model DailyMealPlan {
  id          String      @id @default(cuid())
  patientId   String
  planDate    DateTime
  mealTime    String      // breakfast, lunch, dinner, snack
  foodItemId  String?
  foodItem    FoodItem?   @relation(fields: [foodItemId], references: [id])
  suggestion  String?     // free text suggestion
  isGenerated Boolean     @default(false)
  isConsumed  Boolean?    // marked by patient
  consumedAt  DateTime?
  createdAt   DateTime    @default(now())

  @@index([patientId, planDate])
}
```

### 3.4. API Endpoints

```
GET    /api/meal-reminders          — List reminders for patient
POST   /api/meal-reminders          — Create/update reminders
PUT    /api/meal-reminders/[id]     — Update single reminder
DELETE /api/meal-reminders/[id]     — Delete reminder

GET    /api/meal-plans              — Get meal plan for today/date
POST   /api/meal-plans/generate     — Generate meal plan (AI/rule-based)
PUT    /api/meal-plans/[id]/consume — Mark meal as consumed
```

---

## 4. AI CHATBOT — ASISTEN KESEHATAN GINJAL

### 4.1. Deskripsi

Asisten AI berbasis chatbot yang membantu pasien ginjal menjawab pertanyaan seputar penyakit ginjal, terapi, nutrisi, obat-obatan, dan interpretasi data kesehatan pribadi mereka.

### 4.2. Target Pengguna
- Pasien ginjal yang ingin bertanya cepat tanpa harus ke dokter
- Caregiver yang butuh panduan perawatan
- Pengguna baru yang butuh orientasi fitur platform

### 4.3. Kemampuan Chatbot

#### 4.3.1. Edukasi & Informasi
| Topik | Contoh Pertanyaan |
|-------|------------------|
| Penyakit Ginjal | "Apa itu CKD stadium 4?" |
| Terapi HD | "Kenapa saya harus HD 3x seminggu?" |
| Terapi CAPD | "Apa itu CAPD dan bagaimana cara kerjanya?" |
| Nutrisi | "Makanan apa yang tinggi fosfor?" |
| Obat | "Kapan waktu terbaik minum pengikat fosfat?" |
| Gejala | "Kenapa kaki saya bengkak setelah HD?" |
| Hasil Lab | "Apa artinya kreatinin saya 8 mg/dL?" |

#### 4.3.2. Personal (Context-Aware)
| Fitur | Deskripsi |
|-------|-----------|
| Data Terintegrasi | Chatbot bisa akses (dengan izin) data pasien: catatan harian, jadwal, hasil lab, obat |
| Status Kesehatan | "Bagaimana tekanan darah saya minggu ini?" |
| Interpretasi Lab | "Apa artinya kalium saya 5.8?" |
| Rekomendasi | "Apa yang harus saya lakukan karena BB naik 3kg?" |
| Pengingat | "Ingatkan saya minum obat jam 8 malam" |

#### 4.3.3. Triage Darurat
Deteksi pertanyaan darurat dan beri respons cepat:
> "Saya sesak napas dan berat badan naik 4kg"
> ⚠️ **Deteksi Darurat**: Gejala overload cairan.
> Segera hubungi dokter atau pergi ke IGD terdekat.
> Kontak darurat: [nama] - [telepon]

**Gejala Darurat yang Dideteksi:**
| Gejala | Kemungkinan | Tindakan |
|--------|-------------|----------|
| Sesak napas + BB naik drastis | Overload cairan | Segera HD |
| Jantung berdebar + lemas | Hiperkalemia | UGD |
| Nyeri dada saat HD | Hipotensi / kram | Laporkan ke perawat |
| Demam + kemerahan exit site | Infeksi CAPD | Segera ke RS |
| Muntah + diare | Dehidrasi / uremia | Konsultasi dokter |

### 4.4. Arsitektur Teknis

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Chat UI     │────▶│  API Route   │────▶│  AI Provider │
│  (React)     │◀────│  Next.js     │◀────│  (OpenAI /   │
└──────────────┘     └──────┬───────┘     │  Claude /    │
                            │              │  Gemini)     │
                     ┌──────▼───────┐     └──────────────┘
                     │  System       │
                     │  Prompt       │
                     │  + Context    │
                     │  + RAG (DB)   │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  Vector DB   │
                     │  (Edukasi,   │
                     │  Artikel,    │
                     │  Panduan)    │
                     └──────────────┘
```

#### 4.4.1. Komponen

| Komponen | Teknologi | Catatan |
|----------|-----------|---------|
| AI Provider | OpenAI GPT-4o / Claude Sonnet | Pilih berdasarkan biaya & kualitas |
| System Prompt | Template terstruktur | Role: "Asisten kesehatan ginjal Indonesia" |
| RAG Pipeline | Retrieval-Augmented Generation | Search artikel, FAQ, panduan dari DB |
| Context Window | Data pasien + 10 chat terakhir | Privacy: hanya dikirim dengan izin |
| Streaming | Server-Sent Events (SSE) | Real-time response |
| Rate Limit | 30 msg/jam/user | Cegah abuse |
| Content Filter | Filter kata kunci + moderation API | Cegah advice berbahaya |

#### 4.4.2. System Prompt (Template)
```
Kamu adalah asisten kesehatan untuk pasien ginjal Indonesia yang bernama "HGM AI".
Gunakan bahasa Indonesia yang hangat, mudah dipahami, dan tidak menakut-nakuti.

Aturan:
1. Jangan pernah memberikan diagnosis medis.
2. Jangan menggantikan saran dokter.
3. Jika pertanyaan bersifat darurat, segera arahkan ke IGD.
4. Gunakan data pasien (jika tersedia) untuk personalisasi.
5. Rujuk ke artikel HGM Academy untuk edukasi lanjutan.
6. Jawab dengan singkat, padat, jelas (max 3 paragraf).
7. Jika tidak tahu, akui dan sarankan konsultasi ke nefrolog.

Data pasien saat ini (hanya jika relevan):
- Role: {role}
- Usia: {age}
- Jadwal HD: {schedule}
- Obat: {medications_summary}
```

### 4.5. Database Schema

```prisma
model ChatMessage {
  id          String   @id @default(cuid())
  userId      String
  role        String   // "user" or "assistant"
  content     String
  context     String?  // JSON: data pasien yang dikirim ke AI
  hasData     Boolean  @default(false) // apakah menyertakan data pribadi
  metadata    String?  // JSON: tokens, model, latency
  isEmergency Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}

model AiConversation {
  id        String   @id @default(cuid())
  userId    String
  threadId  String   // external AI thread ID
  title     String?  // auto-generated from first message
  messageCount Int   @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

### 4.6. API Endpoints

```
POST /api/ai/chat        — Send message, get response (streaming)
GET  /api/ai/conversations — List conversations
GET  /api/ai/conversations/[id]/messages — Get messages
DELETE /api/ai/conversations/[id] — Delete conversation
```

### 4.7. UI/UX Chatbot

```
┌─ 💬 HGM AI ──────────────────────────┐
│                                       │
│  👋 Halo! Saya asisten HGM.          │
│  Ada yang bisa saya bantu?           │
│                                       │
│  Saya bisa bantu:                    │
│  • Tanya tentang penyakit ginjal     │
│  • Interpretasi hasil lab            │
│  • Rekomendasi makanan               │
│  • Cek data kesehatan Anda           │
│                                       │
│ ┌──────────────────────────────────┐  │
│ │ Kenapa kaki saya bengkak         │  │
│ │ setelah HD?                      │  │
│ └──────────────────────────────────┘  │
│                                       │
│ ┌─ User ──────────────────────────┐   │
│ │ Kenapa kaki saya bengkak        │   │
│ │ setelah HD?                     │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─ HGM AI ───────────────────────┐   │
│ │ Pembengkakan kaki setelah HD   │   │
│ │ bisa disebabkan oleh:          │   │
│ │                                │   │
│ │ 1. Kelebihan cairan — BB naik  │   │
│ │    >2kg dari BB kering         │   │
│ │ 2. Asupan garam berlebih       │   │
│ │ 3. Masalah akses vaskular      │   │
│ │                                │   │
│ │ ✅ Cek BB Anda hari ini        │   │
│ │ 📖 Baca: Manajemen Cairan      │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─ [Ketik pesan...] [➤] ─────────┐   │
└───────────────────────────────────────┘
```

### 4.8. Keamanan & Privasi

| Aspek | Implementasi |
|-------|-------------|
| Data Pribadi | Hanya dikirim ke AI dengan consent eksplisit |
| Opt-in | "Izinkan HGM AI mengakses data kesehatan Anda?" |
| Audit Log | Semua data yang dikirim ke AI tercatat |
| Data Retention | Chat history disimpan 90 hari |
| Content Filter | Moderasi otomatis untuk pertanyaan berbahaya |
| Rate Limit | 30 pesan/jam/user gratis |
| Premium | 100+ pesan/jam untuk tier berbayar (masa depan) |

---

## 5. PRIORITAS IMPLEMENTASI

| Prioritas | Fitur | Estimasi |
|:---------:|-------|:--------:|
| P0 | Kalkulator Kt/V Mode Lengkap (Daugirdas) | 1 minggu |
| P0 | Kalkulator Kt/V Mode Kasar | 1 minggu |
| P1 | Riwayat & Grafik Tren Kt/V | 3 hari |
| P1 | Pengingat Makan dasar (waktu tetap) | 3 hari |
| P2 | Pengingat Makan cerdas (integrasi jadwal HD) | 1 minggu |
| P2 | AI Chatbot dasar (Q&A statis / rule-based) | 1 minggu |
| P3 | AI Chatbot dengan RAG (artikel Academy) | 2 minggu |
| P3 | AI Chatbot personal (integrasi data pasien) | 2 minggu |
| P3 | Rekomendasi menu harian otomatis | 1 minggu |

---

## 6. INTEGRASI DENGAN FITUR EKSISTING

| Fitur Baru | Terintegrasi Dengan |
|-----------|-------------------|
| Kt/V Calculator | Catatan Harian (BB), Jadwal Terapi (durasi sesi) |
| Pengingat Makan | Manajemen Nutrisi (FoodItem, FoodDiary), Jadwal Terapi, Manajemen Obat |
| AI Chatbot | Academy (artikel untuk RAG), Catatan Harian, Hasil Lab, Forum |

---

## 7. METRIK KEBERHASILAN

| Fitur | KPI | Target 3 Bulan |
|-------|-----|:--------------:|
| Kt/V Calculator | Jumlah perhitungan per pasien/bulan | ≥ 4× (1×/minggu) |
| Kt/V Calculator | Pasien dengan Kt/V < 1.2 yang konsultasi | ≥ 50% |
| Pengingat Makan | Kepatuhan makan sesuai jadwal | ≥ 70% |
| AI Chatbot | Rata-rata sesi chat per hari | ≥ 5 menit/user |
| AI Chatbot | User satisfaction rating | ≥ 4/5 |
| AI Chatbot | Deteksi darurat → tindakan | ≥ 90% akurat |
