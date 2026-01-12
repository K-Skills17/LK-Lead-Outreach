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
  title: "LK Reactor Pro - Recupere Pacientes no WhatsApp",
  description: "Transforme contatos inativos em consultas reais com controle, segurança e inteligência. Sistema de reativação de pacientes para clínicas odontológicas.",
  icons: {
    icon: "/lk-reactor-logo.svg",
    apple: "/lk-reactor-logo.svg",
  },
  openGraph: {
    title: "LK Reactor Pro - Recupere Pacientes no WhatsApp",
    description: "Transforme contatos inativos em consultas reais com controle, segurança e inteligência.",
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
