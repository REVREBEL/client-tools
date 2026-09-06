import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDocsMediaBucket, safeMediaKey } from "../../../../lib/docs-media";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Authentication required.", { status: 401 });

  const { key: keySegments } = await params;
  const key = safeMediaKey(keySegments);
  if (!key) return new NextResponse("Invalid file key.", { status: 400 });

  try {
    const bucket = await getDocsMediaBucket();
    const object = await bucket.get(key);
    if (!object) return new NextResponse("File not found.", { status: 404 });

    const contentType = object.httpMetadata?.contentType || "application/octet-stream";
    const fileName = key.split("/").at(-1) || "resource";
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName.replace(/["\\]/g, "")}"`,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The file could not be loaded." },
      { status: 503 },
    );
  }
}
