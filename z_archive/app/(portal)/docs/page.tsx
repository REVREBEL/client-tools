import DocsHome from "../../../portal/docs/app/page";

function getDocsSheetUrl() {
  const sheetId = process.env.DOCS_SPREADSHEET_ID?.trim();
  const sheetGid = process.env.DOCS_SPREADSHEET_GID?.trim();
  if (!sheetId) throw new Error("DOCS_SPREADSHEET_ID is not configured.");
  if (!sheetGid || !/^\d+$/.test(sheetGid)) {
    throw new Error("DOCS_SPREADSHEET_GID must be configured with the numeric Google Sheet tab GID.");
  }
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${sheetGid}`;
}

export default function DocsPage() {
  return <DocsHome sheetUrl={getDocsSheetUrl()} />;
}
