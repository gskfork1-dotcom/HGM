"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";
import { RequireAuth } from "@/components/RequireAuth";
import { Send, Bot, User, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  isEmergency?: boolean;
  createdAt?: string;
};

const suggestions = [
  { icon: "🩺", text: "Apa itu hemodialisis?" },
  { icon: "📊", text: "Apa itu Kt/V?" },
  { icon: "🥗", text: "Pantangan makanan ginjal" },
  { icon: "⚖️", text: "BB naik setelah HD" },
  { icon: "💊", text: "Fungsi obat pengikat fosfat" },
  { icon: "🆘", text: "Saya sesak napas" },
];

export default function ChatbotPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Halo! Saya **HGM AI** — asisten kesehatan ginjal Anda.\n\nSaya bisa membantu:\n• Menjawab pertanyaan seputar penyakit ginjal & terapi\n• Memberikan informasi nutrisi & diet ginjal\n• Interpretasi hasil lab & Kt/V\n• Deteksi gejala darurat\n\nAda yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetchHistory();
    }
  }, [isLoaded, isSignedIn, fetchHistory]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response, isEmergency: data.isEmergency }]);
        fetchHistory();
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, saya sedang bermasalah. Silakan coba lagi nanti." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Terjadi kesalahan. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

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
      <main className="flex flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl gap-6">
          {/* Sidebar - History */}
          <div className="hidden w-64 shrink-0 lg:block">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center gap-2 rounded-xl border border-hgm-sapphire/10 bg-white px-4 py-3 text-sm font-medium text-hgm-sapphire"
            >
              <MessageSquare className="h-4 w-4" />
              Riwayat Chat
            </button>
            {showHistory && (
              <div className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-hgm-sapphire/10 bg-white p-2">
                {history.length === 0 ? (
                  <p className="p-2 text-xs text-hgm-slate-grey">Belum ada riwayat</p>
                ) : (
                  history.slice(0, 30).map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(msg.content)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-hgm-slate-grey hover:bg-gray-50"
                    >
                      <span className="font-medium">{msg.role === "user" ? "🧑 Anda: " : "🤖 HGM: "}</span>
                      {msg.content.slice(0, 60)}...
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-hgm-sapphire/10 bg-white p-4">
              <p className="text-xs font-medium text-hgm-sapphire">💡 Coba tanya:</p>
              <div className="mt-2 space-y-1.5">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-hgm-slate-grey hover:bg-gray-50"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col rounded-2xl border border-hgm-sapphire/10 bg-white shadow-sm">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-hgm-sapphire/10 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hgm-sapphire text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-hgm-sapphire">HGM AI</h2>
                <p className="text-xs text-hgm-slate-grey">Asisten Kesehatan Ginjal</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: "60vh" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`mb-4 flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-hgm-crimson" : "bg-hgm-sapphire"}`}>
                    {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-hgm-crimson text-white"
                        : msg.isEmergency
                          ? "border border-red-200 bg-red-50 text-red-800"
                          : "bg-gray-50 text-hgm-dark-bg"
                    }`}
                  >
                    {msg.isEmergency && (
                      <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-red-600">
                        <AlertTriangle className="h-4 w-4" /> Gejala Darurat Terdeteksi
                      </div>
                    )}
                    {msg.content.split("\n").map((line, j) => (
                      <p key={j} className={line.startsWith("•") ? "ml-3" : ""}>
                        {line}
                      </p>
                    ))}
                    {msg.role === "user" && (
                      <Link href="/dashboard" className="mt-2 inline-block text-xs text-white/70 hover:underline">
                        Buka Dashboard →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hgm-sapphire">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-2 text-sm text-hgm-slate-grey">
                    <span className="animate-pulse">Mengetik...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <RequireAuth label="Login untuk chat dengan HGM AI">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 border-t border-hgm-sapphire/10 px-6 py-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  className="rounded-full border border-hgm-sapphire/20 px-3 py-1 text-xs text-hgm-sapphire hover:bg-hgm-sapphire/5"
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 border-t border-hgm-sapphire/10 px-6 py-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Tanya tentang kesehatan ginjal..."
                className="flex-1 rounded-xl border border-hgm-sapphire/20 px-4 py-3 text-sm focus:border-hgm-crimson focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-hgm-crimson text-white shadow-sm hover:bg-hgm-crimson/90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            </RequireAuth>
          </div>
        </div>
      </main>
    </div>
  );
}
