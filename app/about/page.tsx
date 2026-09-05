import type { Metadata } from "next";
import Link from "next/link";
import { getStudio } from '../lib/catalog';
import { ContactForm } from '../components/contact-form';

export const metadata: Metadata = {
  title: "About the Potter",
  description: "Meet the maker behind the pottery studio.",
};

export const dynamic = 'force-dynamic';
export default async function AboutPage({ searchParams }: { searchParams: Promise<{ piece?: string }> }) {
  const studio = await getStudio();
  const { piece } = await searchParams;
  return (
    <main id="main-content" className="about-page">
      <section className="about-grid">
        <div className="potter-photo">
          <img
            src={studio.portrait_url || "/studio/natalie-portrait.jpg"}
            alt="Natalie, the potter"
            width="1200"
            height="1400"
          />
          <span>Natalie · The potter behind the pieces</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">About the potter</p>
          <h1>Hi, I’m Natalie.</h1>
          <div className="about-lede">
            <p>
              I’m a young potter based in Colorado and a junior in high school.
              I’ve been making pottery for years, right here in Denver.
            </p>
          </div>
          <div className="about-notes">
            <section>
              <span>01</span>
              <h2>Finding my place</h2>
              <p>
                I found comfort in pottery soon after moving halfway across the
                country from New York to Colorado. Working with clay became a way to feel at home.
              </p>
            </section>
            <section>
              <span>02</span>
              <h2>Made in Denver</h2>
              <p>
                Every part of creating my handmade pottery happens in Denver,
                from mixing the clay to glazing the ceramics.
              </p>
            </section>
          </div>
          <Link className="ink-button about-shop-link" href="/">
            Browse the collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section id="contact" className="contact-section">
        <div><p className="eyebrow">Let’s make something personal</p><h2>Get in touch.</h2>
          <p>Have a question about a piece, or an idea for something custom? I’d love to hear it.</p>
          <h3>A note on custom pieces</h3><p>I’m open to custom requests, but I can’t make every design. Each piece will have my own creative spin. Tell me what you have in mind, and we can talk about what’s possible.</p>
          {studio.contact_email && <a className="contact-email" href={`mailto:${studio.contact_email}`}>{studio.contact_email}</a>}
        </div><ContactForm enabled={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)} piece={typeof piece === 'string' ? piece.slice(0, 120) : ''} />
      </section>
    </main>
  );
}
