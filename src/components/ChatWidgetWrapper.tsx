"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chatbot/ChatWidget").then((m) => ({ default: m.ChatWidget })),
  { ssr: false }
);

export function ChatWidgetWrapper() {
  return <ChatWidget />;
}
