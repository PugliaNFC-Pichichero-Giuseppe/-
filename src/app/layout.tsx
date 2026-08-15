import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recensioni Smart — instrada solo le recensioni migliori",
  description:
    "Raccogli la valutazione del cliente, manda su Google solo chi ti dà 4-5 stelle e ricevi il resto come feedback privato.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this rule targets Pages Router's pages/_document; the root layout is App Router's correct place for a global font link */}
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Archivo:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
