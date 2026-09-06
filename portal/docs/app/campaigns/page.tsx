import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campaign Ideas | Now Now Resource Hub",
  description: "Campaign concepts and activation guidance for Now Now NoHo.",
};

const LIGHTS_OUT_DOC =
  "https://docs.google.com/document/d/1oiMbSP2W2Kz7eT2puiq7KnGzvE5Ln3jebHQMiKldmw8/edit?tab=t.0";
const CABIN_STORY_DOC =
  "https://docs.google.com/document/d/1H29VI4Q5RUwhR9LabJhv1GmpB-PfzWXAXFnishOr1fQ/edit?tab=t.nkxh52mr2blg#heading=h.pot6jbciz4v0";
const LIGHTS_OUT_LIVE =
  "https://now-now-lights-out-git-main-revrebel-18b0f9a7.vercel.app/";

export default function CampaignsPage() {
  return (
    <main id="top">
      <header className="site-header">
        <Link className="brand" href="/docs" aria-label="REVREBEL resource hub home">
          <Image src="/revrebel-logo-blue.svg" alt="REVREBEL" width={1180} height={175} priority />
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/docs">Home</Link>
          <Link href="/docs#resource-library">Resources</Link>
          <Link className="current" href="/docs/campaigns" aria-current="page">Campaigns</Link>
          <Link href="/docs/blogs">Blogs</Link>
          <Link href="/docs/photos">Photos</Link>
          <Link href="/">Client Tools</Link>
        </nav>
        <span className="property-label">Now Now NoHo</span>
      </header>

      <section className="campaign-hero">
        <div className="page-shell campaign-hero-grid">
          <div>
            <p className="eyebrow">Content Development</p>
            <h1>Campaign Ideas</h1>
          </div>
          <p>Brand activations designed to turn Now Now NoHo’s compact cabins, signature details, and solo-travel positioning into memorable guest participation.</p>
        </div>
      </section>

      <section className="campaign-feature campaign-feature-tint" aria-labelledby="lights-out-title">
        <div className="page-shell campaign-feature-grid">
          <div className="campaign-feature-image">
            <Image src="/campaigns/now-now-lights-out.jpg" alt="Friends wearing Now Now sleep masks" width={1920} height={1280} priority />
          </div>
          <div className="campaign-feature-copy">
            <p className="eyebrow">Social Campaign + Guest Ritual</p>
            <h2 id="lights-out-title">Now Now, Lights Out</h2>
            <p>Now Now, Lights Out turns the hotel’s signature sleep mask into a playful guest ritual, social experience, and shippable brand asset.</p>
            <p>Guests are invited to post their “lights out” moment wearing the Now Now sleep mask: in bed, inside the cabin, in the lounge, after a night out in NoHo, or during a morning-after coffee reset.</p>
            <p>The campaign connects directly to Now Now NoHo’s positioning: compact rooms, strong location, stylish design, solo travel, and the idea that guests are here to experience New York — then come back and crash comfortably.</p>
            <div className="campaign-actions">
              <a className="campaign-button" href={LIGHTS_OUT_DOC} target="_blank" rel="noreferrer">Read the Concept <span aria-hidden="true">↗</span></a>
              <a className="campaign-button secondary" href={LIGHTS_OUT_LIVE} target="_blank" rel="noreferrer">View Live Concept <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="campaign-feature" aria-labelledby="cabin-story-title">
        <div className="page-shell campaign-feature-grid">
          <div className="campaign-feature-image campaign-feature-image-cabin">
            <Image src="/campaigns/cabin-story.jpg" alt="Solo traveler relaxing with headphones inside a Now Now cabin" width={1360} height={1824} />
          </div>
          <div className="campaign-feature-copy">
            <p className="eyebrow">Character-Led Storytelling</p>
            <h2 id="cabin-story-title">What’s Your Cabin Story?</h2>
            <p>What’s Your Cabin Story? turns Now Now’s compact sleeper cabins into portals to larger personal stories. A recurring cast of fictional solo travelers is shown inside the same iconic cabin environment, while belongings stored beneath the bed reveal clues about their identities, adventures, and transformations.</p>
            <p>Through cinematic imagery, concise storytelling, and audience participation, the campaign reframes small-space hospitality as a catalyst for expansive experience.</p>
            <p>This creates a strong bridge between the existing brand strategy, audience insight, visual identity, brand messaging, and a scalable brand activation system.</p>
            <div className="campaign-actions">
              <a className="campaign-button" href={CABIN_STORY_DOC} target="_blank" rel="noreferrer">Read the Concept <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="live-concept" aria-labelledby="live-concept-title">
        <div className="page-shell live-concept-grid">
          <div className="live-concept-preview">
            <Image src="/campaigns/lights-out-live-concept.png" alt="Preview of the Now Now, Lights Out live campaign concept" width={591} height={860} />
          </div>
          <div>
            <p className="eyebrow">Interactive Campaign Concept</p>
            <h2 id="live-concept-title">See Lights Out in Action</h2>
            <p>Explore the working campaign experience, including the campaign story, guest participation journey, social proof, sleep-kit extension, and booking path.</p>
            <a className="campaign-button" href={LIGHTS_OUT_LIVE} target="_blank" rel="noreferrer">View the Live Concept <span aria-hidden="true">↗</span></a>
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
