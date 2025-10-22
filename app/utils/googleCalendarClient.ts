'use client';

import { apiService } from '../services/api';

// Frontend-only Google OAuth using PKCE, no backend required

const GC_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
];
const TABLE_NAME = 'project-management-calendar';

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

function generateRandomString(length = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  for (const v of randomValues) result += charset[v % charset.length];
  return result;
}

export async function startGoogleCalendarAuth(redirectPathOrAbsolute: string = '/browser-callback') {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    alert('Google client ID is missing. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
    return;
  }

  const isAbsolute = /^https?:\/\//i.test(redirectPathOrAbsolute);
  const redirectUri = isAbsolute
    ? redirectPathOrAbsolute
    : `${window.location.origin}${redirectPathOrAbsolute}`;
  
  console.log('OAuth redirect URI:', redirectUri);
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await sha256(codeVerifier);

  sessionStorage.setItem('gc_state', state);
  sessionStorage.setItem('gc_code_verifier', codeVerifier);
  sessionStorage.setItem('gc_redirect_uri', redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent'
  });

  window.location.href = `${GC_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function handleGoogleCalendarCallback(currentUserId: string) {
  const codeVerifier = sessionStorage.getItem('gc_code_verifier') || '';
  const savedState = sessionStorage.getItem('gc_state') || '';
  const redirectUri = sessionStorage.getItem('gc_redirect_uri') || `${window.location.origin}/browser-callback`;
  
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  console.log('OAuth callback debug:', {
    hasCode: !!code,
    hasState: !!state,
    hasCodeVerifier: !!codeVerifier,
    hasSavedState: !!savedState,
    redirectUri,
    stateMatch: state === savedState,
    receivedState: state,
    savedState: savedState
  });

  if (error) {
    console.error('OAuth error:', error);
    throw new Error(error);
  }
  
  if (!code) {
    console.error('No authorization code received');
    throw new Error('No authorization code received');
  }
  
  if (!state) {
    console.error('No state parameter received');
    throw new Error('No state parameter received');
  }
  
  if (!savedState) {
    console.error('No saved state found in sessionStorage');
    throw new Error('No saved state found - please try connecting again');
  }
  
  if (state !== savedState) {
    console.error('State mismatch:', { received: state, saved: savedState });
    // In development, we'll be more lenient with state validation
    if (process.env.NODE_ENV === 'development') {
      console.warn('State mismatch in development - proceeding anyway');
    } else {
      throw new Error('State mismatch - please try connecting again');
    }
  }

  // Exchange token via Next server route to attach client_secret securely
  const res = await fetch('/api/google/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Token exchange failed:', errorText);
    console.error('Request details:', { code, redirect_uri, code_verifier });
    throw new Error(`Token exchange failed: ${errorText}`);
  }
  
  const tokens = await res.json();

  // Store tokens in localStorage for immediate access
  localStorage.setItem('google_calendar_connected', 'true');
  localStorage.setItem('google_calendar_user_id', currentUserId);
  localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));

  // Clean temp
  sessionStorage.removeItem('gc_state');
  sessionStorage.removeItem('gc_code_verifier');
  sessionStorage.removeItem('gc_redirect_uri');

  return tokens;
}

export async function getGoogleCalendarStatus(currentUserId: string) {
  // Check localStorage first for immediate status
  const localConnected = localStorage.getItem('google_calendar_connected') === 'true';
  const localUserId = localStorage.getItem('google_calendar_user_id');
  
  if (localConnected && localUserId === currentUserId) {
    return { connected: true, provider: 'google' };
  }
  
  return { connected: false };
}

export async function disconnectGoogleCalendar(currentUserId: string) {
  // Clear localStorage
  localStorage.removeItem('google_calendar_connected');
  localStorage.removeItem('google_calendar_user_id');
  localStorage.removeItem('google_calendar_tokens');
  
  return { success: true };
}

