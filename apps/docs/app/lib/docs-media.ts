import { getCloudflareContext } from "@opennextjs/cloudflare";

type StoredObject = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  size?: number;
  etag?: string;
};

type PutResult = {
  key: string;
  size: number;
  uploaded: Date;
};

type DocsMediaBucket = {
  get(key: string): Promise<StoredObject | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Blob | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<PutResult | null>;
  delete(key: string): Promise<void>;
};

export async function getDocsMediaBucket(): Promise<DocsMediaBucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { DOCS_MEDIA?: DocsMediaBucket }).DOCS_MEDIA;
  if (!bucket) {
    throw new Error("DOCS_MEDIA Object Storage binding is not available.");
  }
  return bucket;
}

export function safeMediaKey(segments: string[]) {
  const decoded = segments.map((segment) => decodeURIComponent(segment).trim()).filter(Boolean);
  if (!decoded.length || decoded.some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) {
    return null;
  }
  return decoded.join("/");
}

export function docsMediaHref(key: string) {
  return `/api/docs/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}
