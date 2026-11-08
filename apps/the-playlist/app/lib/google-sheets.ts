type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

type AccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeJson(value: unknown) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeServiceAccount(raw: string) {
  try {
    return JSON.parse(raw) as ServiceAccountCredentials;
  } catch {
    try {
      return JSON.parse(atob(raw)) as ServiceAccountCredentials;
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT must contain the service-account JSON.");
    }
  }
}

function pemToBytes(pem: string) {
  const normalized = pem
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("The Google service-account secret is not configured.");
  const credentials = decodeServiceAccount(raw);
  const clientEmail = credentials.client_email || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = credentials.private_key;
  if (!clientEmail || !privateKey) throw new Error("The Google service-account JSON is incomplete.");
  return {
    clientEmail,
    privateKey,
    tokenUri: credentials.token_uri || "https://oauth2.googleapis.com/token",
  };
}

async function createAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.value;

  const credentials = getServiceAccount();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "RS256", typ: "JWT" });
  const payload = encodeJson({
    iss: credentials.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: credentials.tokenUri,
    iat: issuedAt,
    exp: issuedAt + 3600,
  });
  const unsignedToken = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(credentials.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken),
  );
  const assertion = `${unsignedToken}.${base64Url(new Uint8Array(signature))}`;

  const response = await fetch(credentials.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as AccessTokenResponse;
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || result.error || "Google rejected the service-account credentials.");
  }

  cachedAccessToken = {
    value: result.access_token,
    expiresAt: Date.now() + Math.max(300, result.expires_in || 3600) * 1000,
  };
  return result.access_token;
}

async function loadSheetRows(spreadsheetId: string, sheetName: string) {
  const accessToken = await createAccessToken();
  const endpoint =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(sheetName)}` +
    "?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING";
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Sheets API request failed (${response.status}): ${detail.slice(0, 160)}`);
  }

  const payload = (await response.json()) as { values?: unknown[][] };
  return (payload.values || []).map((row) => row.map((value) => String(value ?? "")));
}

export type PlaylistRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type PlaylistData = {
  configured: boolean;
  headers: string[];
  rows: PlaylistRow[];
  syncedAt: string | null;
  error?: string;
};

export type WorkspaceTeamMember = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  emailOptOut: boolean;
};

export type WorkspaceColorSetting = {
  rowNumber: number;
  label: string;
  backgroundColor: string;
  fontColor: string;
};

export type WorkspaceSetupColumns = {
  projectName: number;
  teamFirstName: number;
  teamLastName: number;
  teamFullName: number;
  teamEmail: number;
  teamEmailOptOut: number;
  statusName: number;
  statusBackground: number;
  statusFont: number;
  priorityName: number;
  priorityBackground: number;
  priorityFont: number;
};

export type WorkspaceSetupData = {
  configured: boolean;
  projectName: string;
  dashboardUrl: string;
  teamMembers: WorkspaceTeamMember[];
  statuses: WorkspaceColorSetting[];
  priorities: WorkspaceColorSetting[];
  nextTeamRow: number;
  nextStatusRow: number;
  nextPriorityRow: number;
  columns: WorkspaceSetupColumns;
  syncedAt: string | null;
  error?: string;
};

function headerIndex(headers: string[], names: string[], fallback: number) {
  const normalized = headers.map((header) => header.trim().toUpperCase());
  for (const name of names) {
    const index = normalized.indexOf(name.toUpperCase());
    if (index >= 0) return index;
  }
  return fallback;
}

function rowCell(rows: string[][], rowIndex: number, columnIndex: number) {
  return rows[rowIndex]?.[columnIndex]?.trim() || "";
}

function nextOpenRow(rows: string[][], columnIndex: number) {
  for (let index = 1; index < rows.length; index += 1) {
    if (!rowCell(rows, index, columnIndex)) return index + 1;
  }
  return Math.max(2, rows.length + 1);
}

export async function loadPlaylistData(): Promise<PlaylistData> {
  const spreadsheetId = process.env.PLAYLIST_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    return { configured: false, headers: [], rows: [], syncedAt: null };
  }

  try {
    const sheetName = process.env.PLAYLIST_DATA_SHEET || "Action Items";
    const values = await loadSheetRows(spreadsheetId, sheetName);
    const headers = (values.shift() || []).map((value) => value.trim());
    const rows = values
      .map((row, index) => ({
        rowNumber: index + 2,
        values: Object.fromEntries(headers.map((header, column) => [header, row[column] || ""])),
      }))
      .filter((row) => row.values["ACTION ITEM"] || row.values["TACTICAL ITEM"] || row.values["ITEM SORT"]);

    return { configured: true, headers, rows, syncedAt: new Date().toISOString() };
  } catch (error) {
    return {
      configured: true,
      headers: [],
      rows: [],
      syncedAt: null,
      error: error instanceof Error ? error.message : "The Playlist could not be loaded.",
    };
  }
}

export async function loadWorkspaceSetupData(): Promise<WorkspaceSetupData> {
  const spreadsheetId = process.env.PLAYLIST_SPREADSHEET_ID?.trim();
  const emptyColumns: WorkspaceSetupColumns = {
    projectName: 1,
    teamFirstName: 4,
    teamLastName: 5,
    teamFullName: 6,
    teamEmail: 7,
    teamEmailOptOut: 8,
    statusName: 14,
    statusBackground: 15,
    statusFont: 16,
    priorityName: 19,
    priorityBackground: 20,
    priorityFont: 21,
  };

  if (!spreadsheetId) {
    return {
      configured: false,
      projectName: "",
      dashboardUrl: "",
      teamMembers: [],
      statuses: [],
      priorities: [],
      nextTeamRow: 2,
      nextStatusRow: 2,
      nextPriorityRow: 2,
      columns: emptyColumns,
      syncedAt: null,
    };
  }

  try {
    const sheetName = process.env.PLAYLIST_SETUP_SHEET || "Setup";
    const rows = await loadSheetRows(spreadsheetId, sheetName);
    const headers = (rows[0] || []).map((value) => value.trim());

    const teamFirstName = headerIndex(headers, ["FIRST NAME"], 3);
    const teamLastName = headerIndex(headers, ["LAST NAME"], 4);
    const teamFullName = headerIndex(headers, ["FULL NAME"], 5);
    const teamEmail = headerIndex(headers, ["EMAIL"], 6);
    const teamEmailOptOut = headerIndex(headers, ["EMAIL OPT OUT"], 7);
    const statusName = headerIndex(headers, ["STATUS"], 13);
    const statusBackground = headerIndex(headers, ["STATUS BG COLOR", "BACKGROUND HEX COLOR"], 14);
    const statusFont = headerIndex(headers, ["STATUS FONT COLOR", "FONT HEX COLOR"], 15);
    const priorityName = headerIndex(headers, ["PRIORITY"], 18);
    const priorityBackground = headerIndex(headers, ["PRIORITY BG COLOR"], 19);
    const priorityFont = headerIndex(headers, ["PRIORITY FONT COLOR"], 20);

    const teamMembers: WorkspaceTeamMember[] = [];
    const statuses: WorkspaceColorSetting[] = [];
    const priorities: WorkspaceColorSetting[] = [];

    for (let index = 1; index < rows.length; index += 1) {
      const fullName = rowCell(rows, index, teamFullName);
      if (fullName) {
        const optOut = rowCell(rows, index, teamEmailOptOut).toUpperCase();
        teamMembers.push({
          rowNumber: index + 1,
          firstName: rowCell(rows, index, teamFirstName),
          lastName: rowCell(rows, index, teamLastName),
          fullName,
          email: rowCell(rows, index, teamEmail),
          emailOptOut: optOut === "TRUE" || optOut === "YES" || optOut === "1",
        });
      }

      const status = rowCell(rows, index, statusName);
      if (status) {
        statuses.push({
          rowNumber: index + 1,
          label: status,
          backgroundColor: rowCell(rows, index, statusBackground),
          fontColor: rowCell(rows, index, statusFont),
        });
      }

      const priority = rowCell(rows, index, priorityName);
      if (priority) {
        priorities.push({
          rowNumber: index + 1,
          label: priority,
          backgroundColor: rowCell(rows, index, priorityBackground),
          fontColor: rowCell(rows, index, priorityFont),
        });
      }
    }

    const columns: WorkspaceSetupColumns = {
      projectName: 1,
      teamFirstName: teamFirstName + 1,
      teamLastName: teamLastName + 1,
      teamFullName: teamFullName + 1,
      teamEmail: teamEmail + 1,
      teamEmailOptOut: teamEmailOptOut + 1,
      statusName: statusName + 1,
      statusBackground: statusBackground + 1,
      statusFont: statusFont + 1,
      priorityName: priorityName + 1,
      priorityBackground: priorityBackground + 1,
      priorityFont: priorityFont + 1,
    };

    return {
      configured: true,
      projectName: rowCell(rows, 1, 0) || "NEW PROJECT",
      dashboardUrl: rowCell(rows, 4, 0),
      teamMembers,
      statuses,
      priorities,
      nextTeamRow: nextOpenRow(rows, teamFullName),
      nextStatusRow: nextOpenRow(rows, statusName),
      nextPriorityRow: nextOpenRow(rows, priorityName),
      columns,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      configured: true,
      projectName: "",
      dashboardUrl: "",
      teamMembers: [],
      statuses: [],
      priorities: [],
      nextTeamRow: 2,
      nextStatusRow: 2,
      nextPriorityRow: 2,
      columns: emptyColumns,
      syncedAt: null,
      error: error instanceof Error ? error.message : "Workspace Setup could not be loaded.",
    };
  }
}
