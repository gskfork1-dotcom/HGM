import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HGM - Hidup Ginjal Muda",
  description: "Platform premium pendamping Hemodialisis & CAPD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="id"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="relative min-h-full flex flex-col" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
