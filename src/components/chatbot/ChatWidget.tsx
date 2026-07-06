"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Lock } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  isEmergency?: boolean;
};

const quickReplies = [
  "Apa itu HD?",
  "Apa itu Kt/V?",
  "Pantangan makanan ginjal",
  "BB naik setelah HD",
];

export function ChatWidget() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Halo! Saya asisten HGM. Ada yang bisa saya bantu tentang kesehatan ginjal Anda?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        const assistantMsg: ChatMsg = {
          role: "assistant",
          content: data.response,
          isEmergency: data.isEmergency,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, saya sedang bermasalah. Silakan coba lagi." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-hgm-crimson text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col rounded-2xl border border-hgm-sapphire/10 bg-white shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center gap-2 rounded-t-2xl bg-hgm-sapphire px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              H
            </div>
            <div>
              <p className="text-sm font-semibold">HGM AI</p>
              <p className="text-xs text-white/70">Asisten Kesehatan Ginjal</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "400px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-hgm-crimson text-white"
                      : msg.isEmergency
                        ? "bg-red-50 border border-red-200 text-red-800"
                        : "bg-gray-100 text-hgm-dark-bg"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={line.startsWith("•") ? "ml-2" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-hgm-slate-grey">
                  Mengetik...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {isSignedIn ? (
            <>
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="rounded-full border border-hgm-sapphire/20 px-2.5 py-1 text-xs text-hgm-sapphire hover:bg-hgm-sapphire/5"
                  >
                    {qr}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-hgm-sapphire/10 px-4 py-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Tanya sesuatu..."
                  className="flex-1 rounded-lg border border-hgm-sapphire/20 px-3 py-2 text-sm focus:border-hgm-crimson focus:outline-none"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-hgm-crimson text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link href="/sign-in" className="flex items-center justify-center gap-2 border-t border-hgm-sapphire/10 px-4 py-4 text-sm font-medium text-hgm-crimson hover:underline">
              <Lock className="h-4 w-4" /> Login untuk chat
            </Link>
          )}
        </div>
      )}
    </>
  );
}
