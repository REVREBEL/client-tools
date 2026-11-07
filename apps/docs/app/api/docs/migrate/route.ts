import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  DOCS_MANAGE_PERMISSION,
  DOCS_MANAGE_PERMISSION_UNSCOPED,
} from "../../../permissions";
import { getDocsMediaBucket } from "../../../lib/docs-media";

export const dynamic = "force-dynamic";

const RESOURCE_FILES = [
  "agoda-test-booking.pdf",
  "campaign-pages-seo.pdf",
  "group-assessment.pdf",
  "hopper-test-booking.pdf",
  "international-rate-visibility.pdf",
  "layout-recommendations.pdf",
  "metasearch-test-booking.pdf",
  "product-conversion-strategy.pdf",
  "rate-linking-review.pdf",
  "rooms-page-copy.pdf",
  "segment-code-library.pdf",
  "segmentation-setup.pdf",
  "source-tracking-setup.pdf",
  "strategy-playlist.pdf",
  "wholesale-price-test.pdf",
] as const;

const PHOTO_FILES = [
  "bathroom-makeup-bold.jpg",
  "bathroom-makeup-natural.jpg",
  "cabin-desk-reading-woman.jpg",
  "cabin-endcap-feet-1.jpg",
  "cabin-endcap-feet-2.png",
  "cabin-story-1.jpg",
  "cabin-story-2-pajamas.jpg",
  "cabin-story-2.jpg",
  "cabin-story-4.jpg",
  "cabin-story-5.jpg",
  "cabin-story-6.jpg",
  "cabin-story-7.jpg",
  "cabin-story-8.jpeg",
  "cabin-with-desk.png",
  "exterior-backalley-table.jpg",
  "exterior-ice-cream-truck.jpg",
  "exterior-outdoor-couple-v1.png",
  "exterior-outdoor-couple-v2-alt.jpg",
  "exterior-outdoor-couple-v2.jpg",
  "interior-hallway-dancing.jpg",
  "lobby-donut-friends.jpg",
] as const;

const BATCH_SIZE = 3;
const SOURCE_ROOT = "https://raw.githubusercontent.com/REVREBEL/client-tools/main/portal/docs/public";

function contentType(fileName: string) {
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const canManage =
    session.has({ role: "org:admin" }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION_UNSCOPED });
  if (!canManage) return NextResponse.json({ error: "Document management permission is required." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { folder?: "resources" | "photos"; offset?: number } | null;
  const folder = body?.folder === "photos" ? "photos" : "resources";
  const files = folder === "photos" ? PHOTO_FILES : RESOURCE_FILES;
  const offset = Math.max(0, Math.floor(Number(body?.offset) || 0));
  const batch = files.slice(offset, offset + BATCH_SIZE);

  if (!batch.length) {
    return NextResponse.json({ folder, imported: [], failed: [], done: true, nextOffset: null, total: files.length });
  }

  try {
    const bucket = await getDocsMediaBucket();
    const results = await Promise.all(
      batch.map(async (fileName) => {
        const sourceUrl = `${SOURCE_ROOT}/${folder}/${encodeURIComponent(fileName)}`;
        try {
          const response = await fetch(sourceUrl, { cache: "no-store" });
          if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
          const bytes = await response.arrayBuffer();
          const key = `${folder}/${fileName}`;
          await bucket.put(key, bytes, { httpMetadata: { contentType: contentType(fileName) } });
          return { ok: true as const, fileName, key, bytes: bytes.byteLength };
        } catch (error) {
          return {
            ok: false as const,
            fileName,
            error: error instanceof Error ? error.message : "Import failed",
          };
        }
      }),
    );

    const nextOffset = offset + batch.length;
    return NextResponse.json({
      folder,
      imported: results.filter((result) => result.ok),
      failed: results.filter((result) => !result.ok),
      done: nextOffset >= files.length,
      nextOffset: nextOffset >= files.length ? null : nextOffset,
      total: files.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Existing assets could not be imported." },
      { status: 503 },
    );
  }
}
