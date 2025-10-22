import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    clientIdPrefix: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    nodeEnv: process.env.NODE_ENV,
  });
}
