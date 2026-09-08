// src/app/api/sheets/route.ts

import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// Configure Google OAuth2 Service Account authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const PLAYLIST_SPREADSHEET_ID = process.env.PLAYLIST_SPREADSHEET_ID;
const RANGE = 'Action Items!A:Z';

/**
 * GET Handler: Fetches all rows from Google Sheets.
 */
export async function GET() {
  try {
    if (!PLAYLIST_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'PLAYLIST_SPREADSHEET_ID environment variable is not configured.' },
        { status: 500 }
      );
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PLAYLIST_SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];

    // Map rows to match the expected state format in page.tsx
    const formattedData = rows.map((row, index) => ({
      index_: index,
      row: row,
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Failed to fetch Google Sheets data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheet data: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Appends a new action item row to the sheet.
 */
export async function POST(request: NextRequest) {
  try {
    if (!PLAYLIST_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'PLAYLIST_SPREADSHEET_ID environment variable is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { payload, updateArray } = body;

    let newRowValues: any[] = [];

    if (updateArray && Array.isArray(updateArray)) {
      newRowValues = updateArray;
    } else if (payload) {
      newRowValues = [
        "", // Col 0
        "", // Col 1
        payload.sort || "", // Col 2: ITEM SORT
        "", // Col 3
        "", // Col 4
        payload.strategy || "", // Col 5: STRATEGY
        payload.tactical || "", // Col 6: TACTICAL
        payload.lead || "Unassigned", // Col 7: TEAM LEAD
        payload.action || "", // Col 8: ACTION ITEM
        payload.actionDescription || "", // Col 9: DESCRIPTION
        payload.notes || "", // Col 10: NOTES
        payload.coreFunction ? "TRUE" : "FALSE", // Col 11: CORE FUNCTION
        payload.dueDate || "", // Col 12: DUE DATE
        payload.rank || "000", // Col 13: RANK
        payload.priority || "", // Col 14: PRIORITY
        payload.status || "NOT STARTED", // Col 15: STATUS
        payload.dependency || "", // Col 16: DEPENDENCY
      ];
    } else {
      return NextResponse.json(
        { error: 'Missing row payload or updateArray in request body.' },
        { status: 400 }
      );
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: PLAYLIST_SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRowValues],
      },
    });

    return NextResponse.json({
      success: true,
      updatedRange: response.data.updates?.updatedRange,
    });
  } catch (error: any) {
    console.error('Failed to append row to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to insert row: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT Handler: Overwrites a specific target row index in the sheet.
 */
export async function PUT(request: NextRequest) {
  try {
    if (!PLAYLIST_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'PLAYLIST_SPREADSHEET_ID environment variable is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { index_, updateArray } = body;

    if (index_ === undefined || index_ === null || !Array.isArray(updateArray)) {
      return NextResponse.json(
        { error: 'Row index (index_) and updateArray are required for updates.' },
        { status: 400 }
      );
    }

    // Google Sheets rows are 1-indexed. index_ corresponds to 0-based array position.
    const targetRowNumber = Number(index_) + 1;
    const targetRange = "Action Items!A" + targetRowNumber + ":Z" + targetRowNumber;

    await sheets.spreadsheets.values.update({
      spreadsheetId: PLAYLIST_SPREADSHEET_ID,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updateArray],
      },
    });

    return NextResponse.json({
      success: true,
      updatedRow: targetRowNumber,
    });
  } catch (error: any) {
    console.error('Failed to update Google Sheets row:', error);
    return NextResponse.json(
      { error: 'Failed to update row: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE Handler: Clears a specific row's content in the sheet.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!PLAYLIST_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'PLAYLIST_SPREADSHEET_ID environment variable is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { index_ } = body;

    if (index_ === undefined || index_ === null) {
      return NextResponse.json(
        { error: 'Row index (index_) is required to clear a row.' },
        { status: 400 }
      );
    }

    const targetRowNumber = Number(index_) + 1;
    const targetRange = "Action Items!A" + targetRowNumber + ":Z" + targetRowNumber;

    await sheets.spreadsheets.values.clear({
      spreadsheetId: PLAYLIST_SPREADSHEET_ID,
      range: targetRange,
    });

    return NextResponse.json({
      success: true,
      clearedRow: targetRowNumber,
    });
  } catch (error: any) {
    console.error('Failed to clear Google Sheets row:', error);
    return NextResponse.json(
      { error: 'Failed to delete row: ' + error.message },
      { status: 500 }
    );
  }
}