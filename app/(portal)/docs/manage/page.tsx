import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  DOCS_MANAGE_PERMISSION,
  DOCS_MANAGE_PERMISSION_UNSCOPED,
} from "../../../permissions";
import DocsUploadClient from "./upload-client";

export const dynamic = "force-dynamic";

export default async function DocsManagePage() {
  const session = await auth();
  const canManage =
    session.has({ role: "org:admin" }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION }) ||
    session.has({ permission: DOCS_MANAGE_PERMISSION_UNSCOPED });

  return (
    <main style={{ minHeight: "calc(100vh - 66px)", padding: "64px 28px 90px", background: "#eff5f6", color: "#163666" }}>
      <div style={{ width: "min(900px, 100%)", margin: "0 auto" }}>
        <div style={{ marginBottom: 34 }}>
          <p style={{ margin: "0 0 9px", color: "#047c97", fontFamily: "Khand, sans-serif", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>
            Docs Hub Administration
          </p>
          <h1 style={{ maxWidth: 760, margin: 0, fontFamily: "Khand, sans-serif", fontSize: "clamp(52px, 8vw, 92px)", fontWeight: 700, letterSpacing: "-.035em", lineHeight: .88, textTransform: "uppercase" }}>
            PDF + Photo Storage
          </h1>
          <p style={{ maxWidth: 720, margin: "24px 0 0", color: "rgba(22,54,102,.72)", fontSize: 17, lineHeight: 1.65 }}>
            Upload client PDFs or images to Webflow Object Storage. Google Docs and Google Sheets can stay as external links in the resource catalog. Uploaded files return an <code>r2://</code> reference for the Resource URL column.
          </p>
          <Link href="/docs" style={{ display: "inline-block", marginTop: 18, color: "#163666", fontFamily: "Khand, sans-serif", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>
            ← Back to Docs Hub
          </Link>
        </div>

        {canManage ? (
          <DocsUploadClient />
        ) : (
          <section style={{ padding: 28, background: "#fff", border: "2px solid #163666" }}>
            <h2 style={{ margin: "0 0 8px", fontFamily: "Khand, sans-serif", fontSize: 34, textTransform: "uppercase" }}>View access only</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Your account can use the Docs Hub, but document uploads require an organization admin or the <code>admin:docs_manage</code> permission.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
