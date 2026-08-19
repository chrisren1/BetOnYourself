import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bet On Yourself",
  description: "The accountability app where you bet on yourself.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
