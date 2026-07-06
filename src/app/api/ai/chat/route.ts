import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const emergencyKeywords = [
  "sesak", "napas", "susah napas", "sesak napas", "tidak bisa napas",
  "jantung berdebar", "debar", "nyeri dada", "sakit dada",
  "demam", "panas tinggi", "kemerahan", "bengkak", "exit site",
  "muntah", "diare", "kejang", "pingsan", "tidak sadar",
  "bb naik", "berat badan naik", "bengkak kaki",
  "kram parah", "perdarahan", "darah",
];

const emergencyResponse = `⚠️ **Deteksi Gejala Darurat**

Gejala yang Anda sebutkan memerlukan penanganan medis segera.

• Jika sesak napas disertai BB naik drastis → Segera hubungi unit dialisis Anda
• Jika demam + kemerahan di area exit site → Segera ke IGD
• Jika nyeri dada atau jantung berdebar → Segera ke UGD

📞 **Hubungi kontak darurat Anda atau pergi ke IGD terdekat sekarang.**

*Chatbot ini tidak menggantikan diagnosis medis profesional.*`;

const knowledgeBase: Record<string, string> = {
  "apa itu hd": "Hemodialisis (HD) adalah terapi pengganti ginjal yang menyaring darah menggunakan mesin dialisis. Darah Anda dialirkan ke mesin melalui akses vaskular ( fistula atau AV graft), dibersihkan, lalu dikembalikan ke tubuh. Biasanya dilakukan 2-3 kali seminggu, masing-masing 4-5 jam.",
  "apa itu capd": "CAPD (Continuous Ambulatory Peritoneal Dialysis) adalah dialisis peritoneal yang dilakukan sendiri di rumah. Cairan dialisat dimasukkan ke rongga perut melalui kateter, dibiarkan beberapa jam, lalu dikeluarkan. Dilakukan 3-5 kali sehari, setiap sesi 30-40 menit.",
  "pantangan": "Pantangan umum pasien ginjal: 1) Makanan tinggi garam (tepung asin, ikan asin, fast food), 2) Makanan tinggi kalium (pisang, jeruk, kentang, tomat, alpukat), 3) Makanan tinggi fosfor (susu, keju, kacang-kacangan, soda), 4) Minum berlebihan jika dilarang. Konsultasikan dengan ahli gizi untuk diet personal.",
  "apa itu ktv": "Kt/V adalah indikator kecukupan dialisis. K = urea clearance (mL/menit), t = waktu dialisis (menit), V = volume distribusi urea dalam tubuh. Target Kt/V: ≥ 1.4 ideal, ≥ 1.2 minimum (HD 3x/minggu). Untuk HD 2x/minggu, target ≥ 1.8 sesuai rekomendasi PERNEFRI.",
  "makanan": "Makanan yang dianjurkan untuk pasien ginjal: nasi putih, telur rebus, ikan tongkol, ayam tanpa kulit, tempe, tahu, sayur bening (kangkung, bayam dalam jumlah terbatas), apel, semangka (terbatas). Hindari: pisang, jeruk, kentang, susu, keju, kacang-kacangan, makanan asin.",
  "obat": "Pasien ginjal biasanya mendapat beberapa obat: 1) Antihipertensi (tekanan darah), 2) Pengikat fosfat (diminum saat makan), 3) Suplemen zat besi, 4) Vitamin D aktif, 5) Erythropoietin (suntikan untuk anemia). Minum obat sesuai jadwal yang diberikan dokter.",
  "bb naik": "Kenaikan berat badan antar sesi HD sebaiknya tidak lebih dari 3-4% dari berat badan kering. Misal BB kering 60 kg, kenaikan maksimal 1.8-2.4 kg. Jika lebih, laporkan ke dokter. Batasi asupan cairan dan garam untuk mengontrol kenaikan BB.",
  "kreatinin": "Kreatinin adalah produk limbah dari otot. Kadar kreatinin tinggi menandakan penurunan fungsi ginjal. Nilai normal: 0.6-1.2 mg/dL. Pada pasien CKD stadium lanjut, kreatinin bisa mencapai 5-15 mg/dL. Yang penting adalah trennya, bukan angka absolut.",
};

function findKnowledgeAnswer(message: string): string | null {
  const msg = message.toLowerCase();
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    const keywords = key.split(" ");
    if (keywords.some((k) => msg.includes(k))) {
      return answer;
    }
  }
  return null;
}

function isEmergency(message: string): boolean {
  const msg = message.toLowerCase();
  return emergencyKeywords.some((k) => msg.includes(k));
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.userId ?? null;

  try {
    const { message, context } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Pesan diperlukan" }, { status: 400 });
    }

    // Save user message (only if logged in)
    if (userId) {
      await prisma.chatMessage.create({
        data: {
          userId,
          role: "user",
          content: message,
          context: context ? JSON.stringify(context) : null,
          isEmergency: isEmergency(message),
        },
      });
    }

    // Emergency detection
    if (isEmergency(message)) {
      if (userId) {
        await prisma.chatMessage.create({
          data: { userId, role: "assistant", content: emergencyResponse, isEmergency: true },
        });
      }
      return NextResponse.json({ response: emergencyResponse, isEmergency: true });
    }

    // Try knowledge base first
    const kbAnswer = findKnowledgeAnswer(message);

    // Try OpenRouter first, then OpenAI
    const llmKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const llmBaseUrl = process.env.OPENROUTER_BASE_URL || "https://api.openai.com/v1";
    const llmModel = process.env.OPENROUTER_MODEL || (process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "openrouter/free");

    if (llmKey) {
      try {
        const systemPrompt = `Kamu adalah asisten kesehatan ginjal Indonesia bernama "HGM AI". 
Gunakan bahasa Indonesia yang hangat dan mudah dipahami.

Aturan:
1. Jangan pernah memberikan diagnosis medis
2. Jika gejala darurat, arahkan ke IGD
3. Jawab singkat, padat, jelas (max 3 paragraf)
4. Jika tidak tahu, sarankan konsultasi ke nefrolog
5. Jangan menggantikan saran dokter

${context ? `Data pasien: ${JSON.stringify(context)}` : ""}`;

        const res = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${llmKey}`,
            ...(process.env.OPENROUTER_API_KEY ? {
              "HTTP-Referer": "https://hgm-blond.vercel.app",
              "X-Title": "HGM - Hidup Ginjal Muda",
            } : {}),
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            max_tokens: 500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || kbAnswer || "Maaf, saya tidak bisa menjawab saat ini. Silakan konsultasi dengan dokter Anda.";

          if (userId) {
            await prisma.chatMessage.create({
              data: { userId, role: "assistant", content: reply, metadata: JSON.stringify({ model: llmModel, tokens: data.usage?.total_tokens }) },
            });
          }

          return NextResponse.json({ response: reply, model: llmModel });
        }
      } catch {
        // Fallback to knowledge base
      }
    }

    // Knowledge base / fallback response
    const reply = kbAnswer || "Maaf, saya belum bisa menjawab pertanyaan itu. Silakan tanyakan ke dokter atau tim medis Anda, atau baca artikel di HGM Academy untuk informasi lebih lanjut.";

    if (userId) {
      await prisma.chatMessage.create({
        data: { userId, role: "assistant", content: reply },
      });
    }

    return NextResponse.json({ response: reply, model: "knowledge-base" });
  } catch {
    return NextResponse.json({ error: "Gagal memproses pesan" }, { status: 500 });
  }
}
