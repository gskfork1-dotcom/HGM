```python
import os

prd_v2_content = """# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Project Name: HGM (Hidup Ginjal Muda)
**Document Version:** 1.1.0 (Updated: Premium Crimson/Sapphire Theming & Multi-Role Admin Control)  
**Author:** Product Management & AI Engineering Team  
**Target Architecture:** Modern Responsive Web App (Next.js / TailwindCSS)  
**Design Paradigm:** Ultra-Premium, Minimalist, Deep Ruby & Royal Sapphire Aesthetic

---

## 1. Executive Summary & Brand Paradigm

### 1.1. Updated Visual Direction
HGM (Hidup Ginjal Muda) moves away from standard generic medical palettes to an ultra-premium **Crimson Red & Sapphire Blue** ecosystem. 
*   **Sapphire Blue** represents depth, stability, trust, and structural precision (used for core clinical tracking, dashboard layouts, and professional telemetry).
*   **Crimson Red** represents vitality, active blood/circulation health, urgent metrics, and high-end lifestyle energy (used for key interactive states, call-to-actions, and premium accents).

### 1.2. Administrative Expansion
To ensure dynamic content scaling, the system architecture now supports two specialized administrative roles:
1.  **Super Admin (Global Content & Settings Controller):** Total destructive/constructive access to the system, layout configurations, branding, and platform-wide settings.
2.  **Content Editor (Educational & Copy Specialist):** Focused exclusively on creating, modifying, and updating medical content, HGM Academy articles, and landing page marketing copy.

---

## 2. Dynamic User Roles & Permission Matrix


```

## [ User Action / Resource ]        [ Super Admin ]      [ Content Editor ]      [ Patient / Caregiver ]

Read Dashboard / Logs                   Yes                   No                         Yes
Create / Edit Personal Logs             No                    No                         Yes
Create / Edit Academy Articles          Yes                   Yes                        No
Publish Landing Page Copy updates       Yes                   Yes                        No
Modify Site Branding & Logo Assets      Yes                   No                         No
Manage Administrative Accounts          Yes                   No                         No

```

### 2.1. Role 1: Super Admin (System & Brand Overseer)
*   **Capabilities:** Full CRUD access over system-wide features.
*   **Core Responsibilities:** Uploading new SVG/PNG logo variants, editing global styling parameters, injecting legal and compliance updates, monitoring analytics, and configuring tenant credentials.

### 2.2. Role 2: Content Editor (Medical Education Specialist)
*   **Capabilities:** Scoped write/edit permissions confined to the content engine.
*   **Core Responsibilities:** Updating "Myth vs Fact" sequences daily, uploading short instructional video URLs for HGM Academy, editing the marketing headings on the landing page, and updating partner clinic text.

---

## 3. Back-Office Administrative Workspace (UI Requirements)

### 3.1. General Branding Configuration Panel (Super Admin Exclusive)
*   **Logo Management Widget:** Drag-and-drop file uploader area with real-time validation for size and transparency constraints. Allows direct overriding of the main layout logo variable (`hgm_logo_url`).
*   **Theme Value Injector:** Safe CSS/Tailwind runtime overrides for core crimson/sapphire hex values.

### 3.2. Dynamic Landing Page Editor (Super Admin & Content Editor)
*   **Inline Block Editor Canvas:** A clean, zero-clutter dashboard page layout allowing the change of landing page text modules (e.g., Hero Section Title, Product Value Propositions, Testimonials).
*   **Draft to Production Workflow:** Toggle switch states labeled `[ Draft ]` and `[ Publish to Live Landing Page ]`.

### 3.3. HGM Academy Content Pipeline
*   **Article Composer Suite:** Rich text input schema mapping to standard HTML formatting for immediate ingestion by Next.js front-end components.

---

## 4. Front-End Custom UI & High-Fidelity Theme

### 4.1. Updated Color System Configuration (Tailwind Config Ready)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        hgm: {
          sapphire: '#0F2C59',   // Deep Royal Sapphire: Structural/Base Layout Base
          sapphireLight: '#1E40AF', // Interactive Sapphire Components
          crimson: '#BE123C',    // Premium Ruby Crimson: Accentuation, Actions, Vitality
          crimsonGlow: '#FB7185', // Soft Warning State
          darkBg: '#0B0F19',     // Modern Dark Space Background
          cream: '#FDFBF7',      // High-End Ivory White Light Mode Background
          slateGrey: '#64748B'   // Secondary descriptive text
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'sans-serif'],
      }
    }
  }
}

```

### 4.2. Updated Landing Page Layout Matrix

* **The Hero Zone:** Deep gradient backdrop sweeping smoothly from `#0B0F19` into a soft, glowing background perimeter mesh of `#0F2C59`. Main call-to-actions are styled in brilliant crimson solid fill buttons (`bg-hgm-crimson text-white hover:bg-opacity-90`).
* **The Interface Header:** Dynamically reads `hgm_logo_url` from the database. Falls back seamlessly to an inline SVG text-mark design if no file upload is present.

---

## 5. Technical Data Model Architecture (Supabase / Prisma Schema)

```prisma
enum UserRole {
  PATIENT
  CAREGIVER
  CONTENT_EDITOR
  SUPER_ADMIN
}

model User {
  id           String     @id @default(uuid())
  email        String     @unique
  role         UserRole   @default(PATIENT)
  createdAt    DateTime   @default(now())
}

model AppConfiguration {
  id              String   @id @default("global_config")
  logoUrl         String   @default("/assets/logo-default.svg")
  landingHeroTitle String  @default("Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda")
  landingHeroSub   String  @default("Platform premium pendamping Hemodialisis & CAPD")
  updatedAt       DateTime @updatedAt
  updatedByUserId String
}

model AcademyArticle {
  id         String   @id @default(uuid())
  title      String
  category   String   // "Nutrisi", "Gaya Hidup", etc.
  htmlBody   String
  isPublished Boolean  @default(false)
  authorId   String
  createdAt  DateTime @default(now())
}

```

"""

file_name = "prd.md"
with open(file_name, "w", encoding="utf-8") as f:
f.write(prd_v2_content)

print(f"File {file_name} updated successfully with new structural assets.")

```

```text?code_stdout&code_event_index=1
File prd.md updated successfully with new structural assets.


```

Dokumen **PRD (Product Requirement Document)** pada file `prd.md` telah berhasil diperbarui secara komprehensif sesuai dengan instruksi Anda.

### Ringkasan Pembaruan di `prd.md`:

1. **Premium Palette (Merah & Biru):** Mengonfigurasi palet warna modern berbasis *Sapphire Blue* (`#0F2C59`) untuk basis medis tepercaya/elegan, dan *Ruby Crimson Red* (`#BE123C`) sebagai warna vitalitas darah sehat serta elemen interaksi premium (tombol CTA, logo, dan status kritis).
2. **2 Role Admin Spesifik:**
* **Super Admin:** Mengontrol penuh konfigurasi situs global, manajemen logo, penggantian parameter visual, dan manajemen akun admin lainnya.
* **Content Editor:** Berfokus penuh pada manajemen teks pemasaran *landing page* dan penyusunan modul edukasi di *HGM Academy*.


3. **Dynamic Landing Page Control:** Skema pengaturan agar admin bisa mengganti aset logo (`logoUrl`) dan tulisan di halaman utama secara dinamis langsung dari *back-office*.
4. **Database & Tailwind Config Ready:** Menyediakan struktur data prisma schema (`UserRole`, `AppConfiguration`, `AcademyArticle`) dan kustomisasi variabel Tailwind agar AI pengembang web langsung memahami logika hak akses saat memproses kode aplikasinya.

Anda bisa langsung menggunakan file `prd.md` yang telah diperbarui ini pada perangkat lunak generator AI Anda!