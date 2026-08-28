import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About the Potter",
  description: "Meet the maker behind the pottery studio.",
};

export default function AboutPage() {
  return (
    <main id="main-content" className="about-page">
      <section className="about-grid">
        <div className="potter-photo">
          <img
            src="/placeholders/potter.svg"
            alt="Temporary portrait placeholder for the potter"
            width="1200"
            height="1400"
          />
          <span>Replace with your portrait</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">About the potter · Temporary copy</p>
          <h1>Meet the hands behind the clay.</h1>
          <div className="about-lede">
            <p>
              Hi, I’m <strong>insert your name here</strong>. This is where you
              can tell visitors how you found pottery, what inspires your work,
              and what makes each piece special.
            </p>
          </div>
          <div className="about-notes">
            <section>
              <span>01</span>
              <h2>Your process</h2>
              <p>
                Insert a short description of how you design, form, glaze, and
                fire your pottery. You can also describe your favorite materials.
              </p>
            </section>
            <section>
              <span>02</span>
              <h2>Your studio</h2>
              <p>
                Insert your location and a few details about the space where you
                make your work, whether that is a home studio or a shared kiln room.
              </p>
            </section>
          </div>
          <Link className="ink-button about-shop-link" href="/">
            Browse the collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <aside className="about-quote">
        “Insert a short sentence here about why you love making pottery.”
      </aside>
    </main>
  );
}
