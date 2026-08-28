import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pottery Shop",
    template: "%s | Pottery Shop",
  },
  description:
    "A playful collection of handmade pottery, with product galleries and a demo checkout.",
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
          <Link className="wordmark" href="/" aria-label="Pottery Shop home">
            <span>INSERT STUDIO NAME</span>
            <small>handmade pottery</small>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/">Shop all <sup>07</sup></Link>
            <Link href="/about">About the potter</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>Small-batch pottery, made by hand.</p>
          <p>Temporary storefront · Ready for your real details</p>
        </footer>
      </body>
    </html>
  );
}
