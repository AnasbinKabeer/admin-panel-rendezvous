import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Rendezvous Admin",
  description: "Rendezvous 2026 Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body>

        {children}

      </body>
    </html>
  );
}