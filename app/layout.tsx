import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FacebookPixel } from '@/components/FacebookPixel';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LK Lead Outreach - Recupere Leads no WhatsApp",
  description: "Transforme contatos inativos em conversões reais com controle, segurança e inteligência. Sistema de cold outreach e follow-up para empresas B2B.",
  icons: {
    icon: "/lk-reactor-logo.svg",
    apple: "/lk-reactor-logo.svg",
  },
  openGraph: {
    title: "LK Lead Outreach - Recupere Leads no WhatsApp",
    description: "Transforme contatos inativos em conversões reais com controle, segurança e inteligência.",
    images: ["/lk-reactor-logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
