import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal"]
});

const bodyFont = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal"]
});

const monoFont = Noto_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  style: ["normal"]
});

export const metadata: Metadata = {
  title: "Jarvis Second Brain",
  description: "Single-user second brain for tasks, scripts, and operational memory."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-bg text-text antialiased selection:bg-primary/20 selection:text-primary ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
        <div className="liquid-bg">
          <div className="liquid-blob blob-1"></div>
          <div className="liquid-blob blob-2"></div>
          <div className="liquid-blob blob-3"></div>
        </div>
        <ToastProvider>
          <div className="relative z-10">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
