'use client';

import { apiService } from './apiService';
import { env } from '../config/environment';

// Frontend-only Google OAuth using PKCE, no backend required

const GC_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GC_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/meetings.space.created'
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
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;
  const codeVerifier = sessionStorage.getItem('gc_code_verifier') || '';
  const savedState = sessionStorage.getItem('gc_state') || '';
  const redirectUri = sessionStorage.getItem('gc_redirect_uri') || `${window.location.origin}/authPage/browser-callback`;

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) throw new Error(error);
  if (!code || !state || state !== savedState) throw new Error('Invalid OAuth response');

  // Exchange token via Next server route to attach client_secret securely
  const res = await fetch('/api/google/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const tokens = await res.json();

  // Store tokens in CRUD table
  const item = {
    id: currentUserId,
    provider: 'google',
    connectedAt: new Date().toISOString(),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
    expiry_date: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
    scope: tokens.scope || SCOPES.join(' '),
  } as Record<string, any>;

  // Upsert using existing CRUD API
  // Try update first, then create
  const update = await apiService.updateItem<Record<string, any>>(TABLE_NAME, item.id, item);
  if (!update.success) {
    await apiService.createItem<Record<string, any>>(TABLE_NAME, item);
  }

  // Also store in localStorage for immediate access
  localStorage.setItem('google_calendar_connected', 'true');
  localStorage.setItem('google_calendar_user_id', currentUserId);

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
    // Also verify with backend
    const r = await apiService.getItem<any>(TABLE_NAME, currentUserId);
    if (r.success && r.data) {
      const data = r.data as any;
      return { connected: !!(data.refresh_token || data.access_token), provider: 'google', data };
    }
  }
  
  // Fallback to backend check
  const r = await apiService.getItem<any>(TABLE_NAME, currentUserId);
  if (!r.success || !r.data) return { connected: false };
  const data = r.data as any;
  return { connected: !!(data.refresh_token || data.access_token), provider: 'google', data };
}

export async function disconnectGoogleCalendar(currentUserId: string) {
  // Clear localStorage
  localStorage.removeItem('google_calendar_connected');
  localStorage.removeItem('google_calendar_user_id');
  
  // Soft disconnect: remove tokens fields
  return apiService.updateItem<any>(TABLE_NAME, currentUserId, {
    access_token: '',
    refresh_token: '',
    expiry_date: null,
  });
}


