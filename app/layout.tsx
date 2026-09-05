import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Natalie’s Pottery | Handmade in Denver",
    template: "%s | Natalie’s Pottery",
  },
  description:
    "Handmade pottery by Natalie in Denver, Colorado. Explore matcha bowls, kitchen pieces, slow feeders, and small treasures for your home.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="Natalie’s Pottery home">
            <span>Natalie’s Pottery</span>
            <small>Made by hand, in Denver</small>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/">Shop all</Link>
            <Link href="/about">About the potter</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>Small-batch pottery, made by hand.</p>
          <div><Link href="/about#contact">Contact Natalie</Link><Link href="/admin">Studio login</Link></div>
        </footer>
      </body>
    </html>
  );
}
