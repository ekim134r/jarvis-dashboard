import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  style: ["normal", "italic"]
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"]
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  style: ["normal", "italic"]
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
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
