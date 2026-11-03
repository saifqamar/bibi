import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Bibi — audio stories and dramas", template: "%s · Bibi" },
  description:
    "Serialised audio stories and dramas, written with AI assistance and shaped by human writers.",
  openGraph: { siteName: "Bibi", type: "website" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:p-3"
        >
          Skip to content
        </a>
        <header className="border-b border-border">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
          >
            <Link href="/" className="text-xl font-bold">
              Bibi
            </Link>
            <a href="bibi://" className="text-sm font-semibold text-primary">
              Open the app
            </a>
          </nav>
        </header>
        <main id="main" className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
          Every Bibi story is written with AI assistance and shaped by a human
          writer.
        </footer>
      </body>
    </html>
  );
}
