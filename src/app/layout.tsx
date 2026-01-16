import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: {
    default: "Sai Nallani",
    template: "%s — Sai Nallani",
  },
  description: "Personal website of Sai Nallani - CS & Math at Princeton",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
