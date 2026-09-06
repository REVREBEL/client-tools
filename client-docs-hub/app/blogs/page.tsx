import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog Content | Now Now Resource Hub",
  description: "Draft blog concepts and supporting content for Now Now NoHo.",
};

const blogConcepts = [
  {
    title: "Living in NoHo",
    subtitle: "A local’s guide to coffee, art + food and downtown NY",
    image: "/blogs/subway-group-friends.jpg",
    alt: "Friends sitting beside a subway entrance and colorful New York mural",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.j7a6duuwuu1p#heading=h.mffzrm8ruafk",
  },
  {
    title: "Stay Where You Play",
    subtitle: "Why NoHo is NYC’s best kept secret for visitors",
    image: "/blogs/bowery-mural-wall.jpg",
    alt: "Travelers exploring a colorful Bowery mural",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.dz8oepm71xzn#heading=h.spi8gl31qfns",
  },
  {
    title: "NoHo Through Time",
    subtitle: "An architectural journey & walkable itinerary",
    image: "/blogs/new-york-street-view.jpg",
    alt: "A wide street view through downtown New York City",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.9a1ehz04awx#heading=h.qukol0iu40qm",
  },
  {
    title: "Beyond the Cobblestones",
    subtitle: "6 surprising secrets of Manhattan’s smallest neighborhood uncovered",
    image: "/blogs/29-east-fourth-street.jpg",
    alt: "Historic architecture at 29 East Fourth Street in Manhattan",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.u13qa9wwgv11#heading=h.cixps0lp53w5",
  },
  {
    title: "The Art of the Solo Journey",
    subtitle: "Why creative travelers are redefining room to breathe",
    image: "/blogs/bleecker-subway-traveler.jpg",
    alt: "A solo traveler entering Bleecker Street subway station",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.7e9259gv1cl9#heading=h.x2hgfcb2mqq6",
  },
  {
    title: "NYC on a Budget",
    subtitle: "How to stay in the heart of the city without sacrificing style",
    image: "/blogs/noho-streets.jpg",
    alt: "A quiet NoHo street lined with historic buildings",
    href: "https://docs.google.com/document/d/1DHwChcj4kPd-o7sjfLGpM38HrJcWF80OxsysTImZBEQ/edit?tab=t.ezpqdk8ado54#heading=h.ov3sdzueomvz",
  },
];

export default function BlogsPage() {
  return (
    <main id="top">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="REVREBEL resource hub home">
          <Image src="/revrebel-logo-blue.svg" alt="REVREBEL" width={1180} height={175} priority />
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href="/#resource-library">Resources</Link>
          <Link href="/campaigns">Campaigns</Link>
          <Link className="current" href="/blogs" aria-current="page">Blogs</Link>
          <Link href="/photos">Photos</Link>
          <form action="/api/logout" method="post">
            <button type="submit">Lock Portal</button>
          </form>
        </nav>
        <span className="property-label">Now Now NoHo</span>
      </header>

      <section className="blog-hero">
        <div className="page-shell blog-hero-grid">
          <div>
            <p className="eyebrow">Content Development</p>
            <h1>Blogs</h1>
          </div>
          <p>Draft editorial concepts built to strengthen organic discovery, introduce the neighborhood, and help travelers picture a stay at Now Now NoHo.</p>
        </div>
      </section>

      <section className="blog-library" aria-labelledby="blog-library-title">
        <div className="page-shell">
          <div className="blog-library-heading">
            <p className="eyebrow">Blog Concepts</p>
            <h2 id="blog-library-title">Explore the Drafts</h2>
          </div>

          <div className="blog-grid">
            {blogConcepts.map((blog) => (
              <article className="blog-card" key={blog.title}>
                <a className="blog-image-link" href={blog.href} target="_blank" rel="noreferrer" aria-label={`View ${blog.title} content`}>
                  <Image src={blog.image} alt={blog.alt} width={1600} height={1000} />
                </a>
                <div className="blog-card-copy">
                  <h3>{blog.title}</h3>
                  <p>{blog.subtitle}</p>
                  <a className="blog-link" href={blog.href} target="_blank" rel="noreferrer">
                    View Content <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="page-shell footer-inner">
          <Image src="/revrebel-logo-white.svg" alt="REVREBEL" width={1180} height={175} />
          <p>Strategy Playlist Resource Hub for Now Now NoHo</p>
          <a href="#top">Back to Top ↑</a>
        </div>
      </footer>
    </main>
  );
}
