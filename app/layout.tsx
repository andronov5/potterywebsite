import type { Metadata } from "next";
import Link from "next/link";
import { brand } from './lib/brand';
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Pottery by Natalie. Matcha bowls, kitchen pieces, slow feeders, and trinket trays. Made by hand.",
  icons: {
    icon: brand.logo,
    shortcut: brand.logo,
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
          <Link className="wordmark" href="/" aria-label={`${brand.name} home`}>
            <span className="brand-logo"><img src={brand.logo} alt="" width="2000" height="2000" /></span>
            <span className="brand-name">{brand.name}</span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/">Shop all</Link>
            <Link href="/about">About the potter</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>{brand.tagline}</p>
          <div><Link href="/about#contact">Contact Natalie</Link><Link href="/admin">Studio login</Link></div>
        </footer>
      </body>
    </html>
  );
}
