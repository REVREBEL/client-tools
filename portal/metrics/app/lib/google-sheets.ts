const DEFAULT_SPREADSHEET_ID = "1MD-PF0GScwSG3m9wTwAzTHjl2kownwFNEppz3VmuyK0";

const SHEET_NAMES_BY_GID: Record<string, string> = {
  "1941800013": "segment_dataset",
  "1319180770": "source_dataset",
};

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
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
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
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("The Google service-account secret is not configured.");
  }

  const credentials = decodeServiceAccount(raw);
  const clientEmail = credentials.client_email || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = credentials.private_key;
  if (!clientEmail || !privateKey) {
    throw new Error("The Google service-account JSON is missing client_email or private_key.");
  }

  return {
    clientEmail,
    privateKey,
    tokenUri: credentials.token_uri || "https://oauth2.googleapis.com/token",
  };
}

async function createAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

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
    throw new Error(
      result.error_description || result.error || "Google rejected the service-account credentials.",
    );
  }

  cachedAccessToken = {
    value: result.access_token,
    expiresAt: Date.now() + Math.max(300, result.expires_in || 3600) * 1000,
  };
  return result.access_token;
}

export function getConfiguredSpreadsheetId() {
  return process.env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
}

export async function loadGoogleSheetValues({
  spreadsheetId,
  gid,
  range = "",
}: {
  spreadsheetId: string;
  gid: string;
  range?: string;
}) {
  if (spreadsheetId !== getConfiguredSpreadsheetId()) {
    throw new Error("This dashboard can only read its configured Google Sheet.");
  }

  const sheetName = SHEET_NAMES_BY_GID[gid];
  if (!sheetName) {
    throw new Error("The requested Google Sheet tab is not configured.");
  }
  if (range && !/^[A-Z]+(?::[A-Z]+)?$/.test(range)) {
    throw new Error("The requested Google Sheet range is invalid.");
  }

  const accessToken = await createAccessToken();
  const sheetRange = range ? `${sheetName}!${range}` : sheetName;
  const endpoint =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(sheetRange)}` +
    "?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING";
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403 || response.status === 404) {
      throw new Error(
        "The service account cannot read the Sheet. Share the Sheet with GOOGLE_CLIENT_EMAIL as a Viewer.",
      );
    }
    throw new Error(`Google Sheets API request failed (${response.status}): ${detail.slice(0, 160)}`);
  }

  const payload = (await response.json()) as { values?: unknown[][] };
  return (payload.values || []).map((row) =>
    row.map((value) => (value === null || value === undefined ? "" : String(value))),
  );
}
