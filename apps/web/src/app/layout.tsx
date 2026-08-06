import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoutForge — Boxing Fixture Management",
  description: "Manage boxing bouts, fighters, and fixtures for Indian clubs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
