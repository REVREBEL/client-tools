import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  DOCS_MANAGE_PERMISSION,
  DOCS_MANAGE_PERMISSION_UNSCOPED,
} from "../../../permissions";
import { docsMediaHref, getDocsMediaBucket } from "../../../lib/docs-media";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["resources", "photos"]);

function safeFileName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return normalized || `upload-${Date.now()}`;
}

function allowedFile(file: File) {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const canManage =
    session.has({ role: "org:admin" }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION_UNSCOPED });
  if (!canManage) return NextResponse.json({ error: "Document management permission is required." }, { status: 403 });

  const formData = await request.formData();
  const upload = formData.get("file");
  const requestedFolder = String(formData.get("folder") || "resources").toLowerCase();
  const folder = ALLOWED_FOLDERS.has(requestedFolder) ? requestedFolder : "resources";

  if (!(upload instanceof File)) {
    return NextResponse.json({ error: "Attach a PDF or image in the file field." }, { status: 400 });
  }
  if (!allowedFile(upload)) {
    return NextResponse.json({ error: "Only PDF and image uploads are supported." }, { status: 415 });
  }
  if (upload.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 413 });
  }

  const fileName = safeFileName(upload.name);
  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
    const bucket = await getDocsMediaBucket();
    const result = await bucket.put(key, upload.stream(), {
      httpMetadata: { contentType: upload.type || "application/octet-stream" },
    });
    if (!result) return NextResponse.json({ error: "Object Storage rejected the upload." }, { status: 412 });

    return NextResponse.json(
      {
        key,
        sourceRef: `r2://${key}`,
        href: docsMediaHref(key),
        size: upload.size,
        contentType: upload.type,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 503 },
    );
  }
}
