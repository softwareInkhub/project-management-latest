import { NextRequest, NextResponse } from 'next/server';

/**
 * This endpoint is called by the AuthGuard after storing tokens in localStorage
 * It sets httpOnly cookies so the middleware can validate them
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, idToken } = await request.json();

    if (!accessToken || !idToken) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      );
    }

    console.log('[Sync Tokens] Setting httpOnly cookies for authenticated user');

    const response = NextResponse.json({ success: true });

    // Set httpOnly cookies that middleware can read
    // Use secure: true for production, and domain that matches your app
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      // Set domain to .brmh.in so it works across subdomains
      ...(process.env.NODE_ENV === 'production' && { domain: '.brmh.in' })
    };

    response.cookies.set('access_token', accessToken, cookieOptions);
    response.cookies.set('id_token', idToken, cookieOptions);
    
    // Also set the auth_valid flag for client-side checks
    response.cookies.set('auth_valid', 'true', {
      httpOnly: false, // Client-readable
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24,
      path: '/',
      ...(process.env.NODE_ENV === 'production' && { domain: '.brmh.in' })
    });

    console.log('[Sync Tokens] ✅ Cookies set successfully');
    return response;

  } catch (error) {
    console.error('[Sync Tokens] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tokens' },
      { status: 500 }
    );
  }
}

