import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Aniversario Palacio de Hierro",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-black text-white min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
