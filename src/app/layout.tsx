import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Content Flow — Gestão de Produção de Conteúdo",
  description:
    "Ferramenta de gerenciamento de produção de conteúdo para marketing de afiliados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "#1A1A1F",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F5F5F5",
            },
          }}
        />
      </body>
    </html>
  );
}
