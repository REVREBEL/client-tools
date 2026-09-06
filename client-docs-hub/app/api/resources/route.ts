import { NextResponse } from "next/server";
import { isPortalAuthorized } from "../../lib/auth";

const SHEET_ID = "1DUKyQPbnQuNKJfU40fygxZ1eqNR0SExWgGAK358ulQw";
const SHEET_GID = "1388513406";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}&range=C:K`;

const localFallbacks: Array<[string, string]> = [
  ["segment definition + hierarchy", "/resources/segment-code-library.pdf"],
  ["room type & amenity descriptions", "/resources/rooms-page-copy.pdf"],
  ["campaign pages, seo + organic discovery", "/resources/campaign-pages-seo.pdf"],
  ["channel sources setup", "/resources/source-tracking-setup.pdf"],
  ["segmentation setup", "/resources/segmentation-setup.pdf"],
  ["agoda test booking", "/resources/agoda-test-booking.pdf"],
  ["hopper test booking", "/resources/hopper-test-booking.pdf"],
  ["international rates", "/resources/international-rate-visibility.pdf"],
  ["metasearch test booking", "/resources/metasearch-test-booking.pdf"],
  ["rate linking", "/resources/rate-linking-review.pdf"],
  ["wholesale price test", "/resources/wholesale-price-test.pdf"],
  ["strategy playlist", "/resources/strategy-playlist.pdf"],
  ["enhancing visibility", "/resources/product-conversion-strategy.pdf"],
  ["layout recommendations", "/resources/layout-recommendations.pdf"],
];

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if (character === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(value); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length)) rows.push(row);
      row = []; value = "";
    } else value += character;
  }
  if (value.length || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function clean(value = "") { return value.replace(/\s+/g, " ").trim(); }

function cleanMultiline(value = "") {
  return value.replace(/\r\n?/g, "\n").trim();
}

function fallbackFor(title: string, fileName: string) {
  const source = `${title} ${fileName}`.toLowerCase();
  return localFallbacks.find(([needle]) => source.includes(needle))?.[1] ?? "";
}

function resourceFormat(url: string, fileName: string) {
  const source = `${url} ${fileName}`.toLowerCase();
  if (url.includes("docs.google.com/document")) return "Google Doc";
  if (source.includes(".json")) return "JSON";
  if (source.includes(".js")) return "Code File";
  if (source.includes(".svg")) return "SVG";
  if (source.includes(".md")) return "Markdown";
  if (source.includes(".pdf")) return "PDF";
  return "Resource";
}

export async function GET() {
  if (!(await isPortalAuthorized())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Resource Hub returned ${response.status}`);
    const rows = parseCsv(await response.text());
    const headers = rows.shift()?.map(clean) ?? [];
    const indexOf = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
    const index = {
      active: indexOf("ACTIVE"), title: indexOf("RESOURCE NAME"), description: indexOf("RESOURCE DESCRIPTION"),
      useWhen: indexOf("USE THIS WHEN"), url: indexOf("RESOURCE URL", "RESOUCE URL"), fileName: indexOf("RESOURCE FILE NAME"),
      action: indexOf("RELATED ACTION ITEM"), tactical: indexOf("RELATED TACTICAL ITEM"), strategy: indexOf("RELATED STRATEGY ITEM"),
    };
    const resources = rows
      .filter((row) => clean(row[index.active]).toUpperCase() === "TRUE")
      .map((row, rowIndex) => {
        const title = clean(row[index.title]);
        const fileName = clean(row[index.fileName]);
        const sheetUrl = clean(row[index.url]);
        const href = /^https?:\/\//i.test(sheetUrl) ? sheetUrl : fallbackFor(title, fileName);
        return {
          id: `${rowIndex + 2}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          title, description: cleanMultiline(row[index.description]), useWhen: cleanMultiline(row[index.useWhen]), href, fileName,
          format: resourceFormat(href, fileName), action: index.action >= 0 ? clean(row[index.action]) : "",
          tactical: clean(row[index.tactical]) || "General Resources", strategy: clean(row[index.strategy]) || "General Reference",
        };
      })
      .filter((resource) => resource.title);
    return NextResponse.json(
      { resources, activeCount: resources.length, unassignedCount: resources.filter((resource) => resource.strategy === "General Reference").length, checkedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The resource feed could not be loaded." }, { status: 502 });
  }
}
