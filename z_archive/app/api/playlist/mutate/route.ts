import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  PLAYLIST_EDIT_PERMISSION,
  PLAYLIST_EDIT_PERMISSION_UNSCOPED,
} from "../../../permissions";

export const dynamic = "force-dynamic";

type SetupCell = {
  column?: number;
  value?: unknown;
};

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
    action?: "updateRow" | "insertRow" | "updateSetupCells";
    rowNumber?: number;
    values?: Record<string, unknown>;
    cells?: SetupCell[];
  };
  if (!body.action || !["updateRow", "insertRow", "updateSetupCells"].includes(body.action)) {
    return NextResponse.json({ error: "Unsupported Playlist action." }, { status: 400 });
  }

  if (body.action === "updateSetupCells") {
    if (typeof body.rowNumber !== "number" || !Number.isInteger(body.rowNumber) || body.rowNumber < 2) {
      return NextResponse.json({ error: "A valid Setup rowNumber is required." }, { status: 400 });
    }
    if (!Array.isArray(body.cells) || body.cells.length === 0) {
      return NextResponse.json({ error: "At least one Setup cell update is required." }, { status: 400 });
    }
    const invalidCell = body.cells.some(
      (cell) => typeof cell.column !== "number" || !Number.isInteger(cell.column) || cell.column < 1 || cell.column > 100,
    );
    if (invalidCell) {
      return NextResponse.json({ error: "Setup cell columns must be between 1 and 100." }, { status: 400 });
    }
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
        cells: body.cells || [],
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
