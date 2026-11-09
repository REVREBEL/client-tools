// src/app/api/audit-log/route.ts

import { NextRequest, NextResponse } from 'next/server';

export interface AuditLogPayload {
  user: string;
  taskId?: number;
  taskIdentifier: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  summary: string;
  teamLead: string;
  isSystem?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuditLogPayload = await request.json();

    if (!body.taskIdentifier || !body.summary) {
      return NextResponse.json(
        { error: 'Invalid audit log payload. Task identifier and summary are required.' },
        { status: 400 }
      );
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      user: body.user || 'Active User',
      taskIdentifier: body.taskIdentifier,
      fieldChanged: body.fieldChanged || 'GENERAL_EDIT',
      oldValue: body.oldValue || '',
      newValue: body.newValue || '',
      summary: body.summary,
      teamLead: body.teamLead || 'UNASSIGNED',
      isSystem: Boolean(body.isSystem),
    };

    // Forward entry to Google Sheets API / Apps Script backend
    const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API_URL;

    if (GOOGLE_SHEETS_API) {
      await fetch(GOOGLE_SHEETS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'writeAuditLog',
          logEntry,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      log: logEntry,
    });
  } catch (error: any) {
    console.error('Failed to log audit activity:', error);
    return NextResponse.json(
      { error: 'Failed to record audit activity log.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API_URL;

    if (GOOGLE_SHEETS_API) {
      const res = await fetch(GOOGLE_SHEETS_API + "?action=getAuditLogs", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ logs: [] });
  } catch (error: any) {
    console.error('Failed to retrieve audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs.' },
      { status: 500 }
    );
  }
}