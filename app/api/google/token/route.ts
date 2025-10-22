import { NextRequest, NextResponse } from 'next/server';

const GC_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirect_uri, code_verifier } = body;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Google OAuth configuration' },
        { status: 500 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GC_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        code_verifier,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      console.error('Request details:', { code, redirect_uri, code_verifier });
      return NextResponse.json(
        { error: `Token exchange failed: ${errorText}` },
        { status: tokenResponse.status }
      );
    }

    const tokens = await tokenResponse.json();
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error in token exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

