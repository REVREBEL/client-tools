import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Photo Gallery | Now Now Resource Hub",
  description: "Downloadable campaign and neighborhood photography for Now Now NoHo.",
};

type Photo = {
  title: string;
  fileName: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

const cabinPhotos: Photo[] = [
  { title: "Cabin Story 1", fileName: "Cabin Story 1.jpg", src: "/photos/cabin-story-1.jpg", alt: "Traveler reading inside a warmly lit sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 2 — Pajamas", fileName: "Cabin Story 2 Pajamas.jpg", src: "/photos/cabin-story-2-pajamas.jpg", alt: "Traveler relaxing in pajamas with headphones inside a sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 2", fileName: "Cabin Story 2.jpg", src: "/photos/cabin-story-2.jpg", alt: "Traveler wearing headphones and jeans inside a sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 4", fileName: "Cabin Story 4.jpg", src: "/photos/cabin-story-4.jpg", alt: "Drag performer reading inside a sleeper cabin with a travel suitcase", width: 2048, height: 1136 },
  { title: "Cabin Story 5", fileName: "Cabin Story 5.jpg", src: "/photos/cabin-story-5.jpg", alt: "Creative traveler writing in a journal inside a sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 6", fileName: "Cabin Story 6.jpg", src: "/photos/cabin-story-6.jpg", alt: "Traveler working on a laptop inside a sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 7", fileName: "Cabin Story 7.jpg", src: "/photos/cabin-story-7.jpg", alt: "Traveler listening to music inside a sleeper cabin", width: 2048, height: 1136 },
  { title: "Cabin Story 8", fileName: "Cabin Story 8.jpeg", src: "/photos/cabin-story-8.jpeg", alt: "Traveler enjoying ice cream inside a sleeper cabin", width: 2048, height: 1136 },
];

const exteriorPhotos: Photo[] = [
  { title: "Exterior Back Alley Table", fileName: "Exterior Backalley Table.jpg", src: "/photos/exterior-backalley-table.jpg", alt: "Friends raising drinks at a table beneath alley string lights", width: 1365, height: 2048 },
  { title: "Exterior Ice Cream Truck", fileName: "Exterior Ice Cream Truck.jpg", src: "/photos/exterior-ice-cream-truck.jpg", alt: "Traveler buying ice cream from a truck on a downtown New York street", width: 1365, height: 2048 },
  { title: "Exterior Outdoor Couple — Landscape", fileName: "Exterior Outdoor Couple_v1.png", src: "/photos/exterior-outdoor-couple-v1.png", alt: "Couple crossing the street outside Now Now NoHo at dusk", width: 2048, height: 1649 },
  { title: "Exterior Outdoor Couple — Portrait", fileName: "Exterior Outdoor Couple_v2.jpg", src: "/photos/exterior-outdoor-couple-v2.jpg", alt: "Portrait view of a couple crossing the street outside Now Now NoHo", width: 1529, height: 2048 },
  { title: "Exterior Outdoor Couple — Alternate", fileName: "Exterior Outdoor Couple_v2(1).jpg", src: "/photos/exterior-outdoor-couple-v2-alt.jpg", alt: "Alternate portrait view of a couple crossing the street outside Now Now NoHo", width: 1529, height: 2048 },
];

const hotelPhotos: Photo[] = [
  { title: "Bathroom Makeup — Bold", fileName: "Bathroom Makeup Bold(1).jpg", src: "/photos/bathroom-makeup-bold.jpg", alt: "Guest applying bold makeup in the shared bathroom mirror", width: 2048, height: 1649 },
  { title: "Bathroom Makeup — Natural", fileName: "Bathroom Makeup Normal(1).jpg", src: "/photos/bathroom-makeup-natural.jpg", alt: "Guest applying natural makeup in the shared bathroom mirror", width: 2048, height: 1649 },
  { title: "Cabin Desk Reading", fileName: "Cabin Desk Reading Woman.jpg", src: "/photos/cabin-desk-reading-woman.jpg", alt: "Guest reading at a compact desk inside a colorful cabin", width: 1528, height: 2048 },
  { title: "Cabin Endcap Feet 1", fileName: "Cabin Endcap Feet 1.jpg", src: "/photos/cabin-endcap-feet-1.jpg", alt: "Guest relaxing in a cabin with patterned socks and New York guidebooks", width: 1529, height: 2048 },
  { title: "Cabin Endcap Feet 2", fileName: "Cabin Endcap Feet 2.png", src: "/photos/cabin-endcap-feet-2.png", alt: "Guest relaxing in a cabin with red patterned socks", width: 1448, height: 1086 },
  { title: "Cabin With Desk", fileName: "Cabin with Desk.png", src: "/photos/cabin-with-desk.png", alt: "Empty sleeper cabin with a built-in desk and warm wood details", width: 670, height: 359 },
  { title: "Lobby Donut Friends", fileName: "Lobby Donut Friends.jpg", src: "/photos/lobby-donut-friends.jpg", alt: "Two friends enjoying coffee and donuts in the hotel lobby", width: 2048, height: 1143 },
  { title: "Hallway Dancing", fileName: "Interior Hallways Dancing.jpg", src: "/photos/interior-hallway-dancing.jpg", alt: "Guest dancing with headphones in a Now Now NoHo hallway", width: 1545, height: 2048 },
];

const photoCount = cabinPhotos.length + hotelPhotos.length + exteriorPhotos.length;

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <article className="photo-card">
      <a className="photo-image-link" href={photo.src} target="_blank" rel="noreferrer" aria-label={`View ${photo.title} full size`}>
        <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
      </a>
      <div className="photo-card-footer">
        <div>
          <h3>{photo.title}</h3>
          <span>High-resolution image</span>
        </div>
        <div className="photo-actions">
          <a href={photo.src} target="_blank" rel="noreferrer">View Full Size</a>
          <a className="photo-download" href={photo.src} download={photo.fileName}>Download Photo ↓</a>
        </div>
      </div>
    </article>
  );
}

export default function PhotosPage() {
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
          <Link href="/blogs">Blogs</Link>
          <Link className="current" href="/photos" aria-current="page">Photos</Link>
          <form action="/api/logout" method="post">
            <button type="submit">Lock Portal</button>
          </form>
        </nav>
        <span className="property-label">Now Now NoHo</span>
      </header>

      <section className="photo-hero">
        <div className="page-shell photo-hero-grid">
          <div>
            <p className="eyebrow">Campaign Image Library</p>
            <h1>Photo Gallery</h1>
          </div>
          <div className="photo-hero-actions">
            <p>{photoCount} high-resolution images for campaign development, presentations, social concepts, and implementation reference.</p>
            <a href="/photos/now-now-photo-gallery.zip" download="Now Now Photo Gallery.zip">Download All Photos <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className="photo-library">
        <div className="page-shell">
          <div className="photo-section-heading">
            <div>
              <p className="eyebrow">What’s Your Cabin Story?</p>
              <h2>Cabin Stories</h2>
            </div>
            <span>8 Photos</span>
          </div>
          <div className="photo-grid">
            {cabinPhotos.map((photo) => <PhotoCard photo={photo} key={photo.src} />)}
          </div>

          <div className="photo-section-heading photo-section-heading-spaced">
            <div>
              <p className="eyebrow">Hotel & Guest Moments</p>
              <h2>Spaces in Use</h2>
            </div>
            <span>{hotelPhotos.length} Photos</span>
          </div>
          <div className="photo-grid photo-grid-natural">
            {hotelPhotos.map((photo) => <PhotoCard photo={photo} key={photo.src} />)}
          </div>

          <div className="photo-section-heading photo-section-heading-spaced">
            <div>
              <p className="eyebrow">Neighborhood Moments</p>
              <h2>Exterior Stories</h2>
            </div>
            <span>{exteriorPhotos.length} Photos</span>
          </div>
          <div className="photo-grid photo-grid-natural">
            {exteriorPhotos.map((photo) => <PhotoCard photo={photo} key={photo.src} />)}
          </div>
        </div>
      </section>

      <section className="photo-download-all">
        <div className="page-shell">
          <p className="eyebrow">Complete Image Set</p>
          <h2>Download the Full Gallery</h2>
          <p>One ZIP file containing the complete Cabin Stories, hotel moments, and exterior campaign image collection.</p>
          <a href="/photos/now-now-photo-gallery.zip" download="Now Now Photo Gallery.zip">Download All {photoCount} Photos <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="photo-provenance" aria-labelledby="photo-provenance-heading">
        <div className="page-shell photo-provenance-grid">
          <div>
            <p className="eyebrow">Image Use & Content Credentials</p>
            <h2 id="photo-provenance-heading">Adobe Firefly Provenance</h2>
          </div>
          <div className="photo-provenance-copy">
            <p>These images were created by REVREBEL for Now Now NoHo using Adobe Firefly. Adobe Firefly is designed for commercially safe creative use because its training approach is based on licensed content, Adobe Stock, openly licensed material, and public-domain content where copyright has expired.</p>
            <p>The images have also been registered through Adobe Content Authenticity. This provides a record of how the files were created and helps document their origin, creation method, and content credentials. It does not replace legal review, but it gives Now Now NoHo a clearer provenance trail for internal use, publishing, and future reference.</p>
            <p className="photo-approval">The files are approved for use by Now Now NoHo as needed.</p>
            <div className="photo-reference-links" aria-label="Adobe documentation">
              <a href="https://drive.google.com/drive/folders/1xCkDEqvQVtXmP4ekx4H5FmYspmvzrZpZ" target="_blank" rel="noreferrer">
                <span>Content Credentials</span>
                Adobe Content Authenticity Record <b aria-hidden="true">↗</b>
              </a>
              <a href="https://drive.google.com/file/d/1rQgUh_ut-StgGrS4iBNomqSN-cfuNrld/view?usp=drivesdk" target="_blank" rel="noreferrer">
                <span>Adobe Reference</span>
                Firefly Legal FAQ — Enterprise Customers <b aria-hidden="true">↗</b>
              </a>
              <a href="https://drive.google.com/file/d/1jhSCd6NYYLEnPXYubB1We-RYKauPyvoa/view?usp=drivesdk" target="_blank" rel="noreferrer">
                <span>Adobe Reference</span>
                Adobe Firefly Product Description <b aria-hidden="true">↗</b>
              </a>
            </div>
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
