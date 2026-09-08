// src/app/api/opt-out/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, optOut } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const isOptingOut = Boolean(optOut);

    // Communicate with Google Sheets API or database
    const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API_URL;

    if (GOOGLE_SHEETS_API) {
      await fetch(GOOGLE_SHEETS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateOptOut',
          email: cleanEmail,
          optOut: isOptingOut,
        }),
      });
    }

    const message = isOptingOut
      ? 'You have been opted out of automated email updates.'
      : 'You have successfully resubscribed to updates.';

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      isOptedOut: isOptingOut,
      message,
    });
  } catch (error: any) {
    console.error('Opt-out API processing error:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email') || '';
  const action = searchParams.get('action') || '';

  const redirectUrl = new URL('/opt-out', request.url);
  if (email) redirectUrl.searchParams.set('email', email);
  if (action) redirectUrl.searchParams.set('action', action);

  return NextResponse.redirect(redirectUrl);
}