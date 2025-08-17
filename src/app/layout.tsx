import type { Metadata } from "next";
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
  title: "Sai Nallani",
  description: "Personal site and blog of Sai Nallani",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/40 z-10">
          <nav className="max-w-4xl mx-auto flex items-center gap-6 px-4 h-14 text-sm font-medium">
            <a href="#home" className="hover:underline">Home</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#blog" className="hover:underline">Blog</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-6 border-t border-gray-200 dark:border-gray-800">
          © {new Date().getFullYear()} Your Name. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
