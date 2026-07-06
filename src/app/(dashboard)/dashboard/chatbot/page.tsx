"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../header";
import { RequireAuth } from "@/components/RequireAuth";
import { Send, Bot, User, AlertTriangle, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [started, setStarted] = useState(false);

  const role = (user?.unsafeMetadata?.role as string) ?? "PATIENT";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetch("/api/ai/conversations")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setHistory(data))
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (!started) setStarted(true);

    const userMsg: ChatMsg = { role: "user", content: text, createdAt: new Date().toISOString() };
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
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.response,
          isEmergency: data.isEmergency,
          createdAt: new Date().toISOString(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Maaf, saya sedang bermasalah. Silakan coba lagi nanti.",
          createdAt: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Terjadi kesalahan. Silakan coba lagi.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setStarted(false);
    setInput("");
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
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          {/* Sidebar */}
          <div className={`${showHistory ? "block" : "hidden"} fixed inset-0 z-40 bg-black/50 lg:relative lg:block lg:w-64 lg:shrink-0 lg:bg-transparent`}>
            <div className="flex h-full flex-col rounded-2xl border border-hgm-sapphire/10 bg-white p-4 lg:h-auto lg:shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-hgm-sapphire">Riwayat Chat</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-hgm-slate-grey hover:text-hgm-crimson lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={startNewChat}
                className="mb-4 w-full rounded-xl bg-hgm-sapphire px-4 py-2.5 text-sm font-medium text-white hover:bg-hgm-sapphire/90"
              >
                + Chat Baru
              </button>

              <div className="flex-1 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="p-2 text-xs text-hgm-slate-grey">Belum ada riwayat chat</p>
                ) : (
                  history
                    .filter((m) => m.role === "user")
                    .slice(0, 30)
                    .map((msg, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(msg.content);
                          setShowHistory(false);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-hgm-slate-grey hover:bg-gray-50"
                      >
                        <span className="font-medium text-hgm-dark-bg">{msg.content.slice(0, 50)}{msg.content.length > 50 ? "..." : ""}</span>
                        <p className="mt-0.5 text-[10px]">{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}</p>
                      </button>
                    ))
                )}
              </div>

              <div className="mt-4 rounded-xl border border-hgm-sapphire/10 bg-hgm-cream p-3">
                <p className="text-xs font-medium text-hgm-sapphire">💡 Saran:</p>
                <div className="mt-2 space-y-1">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { sendMessage(s.text); setShowHistory(false); }}
                      className="block w-full rounded-lg px-2 py-1 text-left text-xs text-hgm-slate-grey hover:bg-white"
                    >
                      {s.icon} {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!showHistory && (
            <button
              onClick={() => setShowHistory(true)}
              className="fixed left-4 top-24 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 lg:hidden"
            >
              <MessageSquare className="h-5 w-5 text-hgm-sapphire" />
            </button>
          )}

          {/* Chat Area */}
          <div className="flex flex-1 flex-col rounded-2xl border border-hgm-sapphire/10 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-hgm-sapphire/10 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hgm-sapphire text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-hgm-sapphire">HGM AI</h2>
                <p className="text-xs text-hgm-slate-grey">Asisten Kesehatan Ginjal</p>
              </div>
              {started && (
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-1 rounded-lg border border-hgm-sapphire/20 px-3 py-1.5 text-xs text-hgm-slate-grey hover:bg-gray-50"
                  title="Mulai chat baru"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Baru
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: "65vh" }}>
              {!started ? (
                <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-hgm-sapphire/10">
                    <Bot className="h-8 w-8 text-hgm-sapphire" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-hgm-sapphire">HGM AI</h3>
                    <p className="mt-1 text-sm text-hgm-slate-grey">Tanya apa saja seputar kesehatan ginjal</p>
                  </div>
                  <div className="grid w-full max-w-md grid-cols-2 gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s.text)}
                        className="rounded-xl border border-hgm-sapphire/10 bg-hgm-cream px-4 py-3 text-left text-sm text-hgm-sapphire hover:border-hgm-crimson/30 hover:bg-white"
                      >
                        <span className="text-base">{s.icon}</span>
                        <p className="mt-1 leading-tight">{s.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`mb-4 flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-hgm-crimson" : "bg-hgm-sapphire"}`}>
                        {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-hgm-crimson text-white"
                            : msg.isEmergency
                              ? "border border-red-200 bg-red-50 text-red-800"
                              : "bg-gray-50 text-hgm-dark-bg"
                        }`}
                      >
                        {msg.isEmergency && (
                          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                            <AlertTriangle className="h-4 w-4" /> Gejala Darurat Terdeteksi
                          </div>
                        )}
                        {msg.content.split("\n").map((line, j) => (
                          <p key={j} className={line.startsWith("•") ? "ml-3" : ""}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hgm-sapphire">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-2 text-sm text-hgm-slate-grey">
                        <span className="animate-pulse">Mengetik</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>.</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {isSignedIn ? (
              <>
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
                    className="flex-1 rounded-xl border border-hgm-sapphire/20 px-4 py-3 text-sm focus:border-hgm-crimson focus:outline-none focus:ring-1 focus:ring-hgm-crimson/20"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hgm-crimson text-white shadow-sm hover:bg-hgm-crimson/90 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <RequireAuth label="Login untuk chat dengan HGM AI">
                <div className="flex items-center gap-3 border-t border-hgm-sapphire/10 px-6 py-4">
                  <input
                    type="text"
                    placeholder="Tanya tentang kesehatan ginjal..."
                    className="flex-1 rounded-xl border border-hgm-sapphire/20 px-4 py-3 text-sm"
                    disabled
                  />
                  <button disabled className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-300 text-white">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </RequireAuth>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
