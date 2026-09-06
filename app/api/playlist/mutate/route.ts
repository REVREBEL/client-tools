import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  PLAYLIST_EDIT_PERMISSION,
  PLAYLIST_EDIT_PERMISSION_UNSCOPED,
} from "../../../permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const canEdit =
    session.has({ role: "org:admin" }) ||
    session.has({ permission: PLAYLIST_EDIT_PERMISSION }) ||
    session.has({ permission: PLAYLIST_EDIT_PERMISSION_UNSCOPED });
  if (!canEdit) return NextResponse.json({ error: "Playlist edit permission is required." }, { status: 403 });

  const endpoint = process.env.PLAYLIST_APPS_SCRIPT_URL?.trim();
  const token = process.env.PLAYLIST_APPS_SCRIPT_TOKEN?.trim();
  if (!endpoint || !token) {
    return NextResponse.json(
      { error: "PLAYLIST_APPS_SCRIPT_URL and PLAYLIST_APPS_SCRIPT_TOKEN must be configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    action?: "updateRow" | "insertRow";
    rowNumber?: number;
    values?: Record<string, unknown>;
  };
  if (!body.action || !["updateRow", "insertRow"].includes(body.action)) {
    return NextResponse.json({ error: "Unsupported Playlist action." }, { status: 400 });
  }

  const user = await currentUser();
  const requestedBy = user?.primaryEmailAddress?.emailAddress || session.userId;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        action: body.action,
        rowNumber: body.rowNumber,
        values: body.values || {},
        requestedBy,
      }),
      cache: "no-store",
      redirect: "follow",
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; status?: number } | null;
    if (!response.ok || !result?.ok) {
      return NextResponse.json(
        { error: result?.error || `Apps Script mutation failed (${response.status}).` },
        { status: result?.status && result.status >= 400 ? result.status : 502 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The Playlist workflow bridge failed." },
      { status: 502 },
    );
  }
}
