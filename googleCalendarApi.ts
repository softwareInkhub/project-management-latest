// Google Calendar API integration utilities
// Uses backend endpoints to perform server-side Google Calendar sync without client redirects

import { apiService } from './apiService';

export interface CalendarDateTime {
    dateTime: string;
    timeZone?: string;
}

export interface CalendarEventInput {
	title: string;
	description?: string;
	location?: string;
	start: string | CalendarDateTime; // RFC3339 string or object with timezone
	end: string | CalendarDateTime;   // RFC3339 string or object with timezone
	externalId?: string; // id from our app (e.g., task id)
	attendees?: { email: string; optional?: boolean }[];
	userId?: string; // current user id for server to locate tokens
}

export interface CalendarEventResponse {
	googleEventId: string;
	status: string;
	link?: string;
	meetLink?: string;
	meetPhoneNumber?: string;
}

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function getBaseUrl() {
	const { baseUrl } = apiService.getConfig();
	return baseUrl;
}

export async function getConnectionStatus(): Promise<{ connected: boolean; provider?: string }>
{
	try {
		const res = await fetch(`${getBaseUrl()}/google/calendar/status`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders(),
			},
			credentials: 'include',
		});
		if (!res.ok) return { connected: false };
		const data = await res.json();
		return { connected: !!data.connected, provider: data.provider };
	} catch {
		return { connected: false };
	}
}

export function getConnectUrl(redirectUri?: string) {
	const base = `${getBaseUrl()}/google/calendar/connect`;
	if (!redirectUri) return base;
	const usp = new URLSearchParams({ redirectUri });
	return `${base}?${usp.toString()}`;
}

export async function createEvent(input: CalendarEventInput): Promise<CalendarEventResponse | null> {
    try {
        // Use Next.js API route to ensure proper server-side token handling and timezone payload
        const res = await fetch(`/api/google/calendar/events`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders(),
			},
			credentials: 'include',
			body: JSON.stringify(input),
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function updateEvent(googleEventId: string, input: Partial<CalendarEventInput>): Promise<CalendarEventResponse | null> {
	try {
		const res = await fetch(`${getBaseUrl()}/google/calendar/events/${encodeURIComponent(googleEventId)}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders(),
			},
			credentials: 'include',
			body: JSON.stringify(input),
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function deleteEvent(googleEventId: string): Promise<boolean> {
	try {
		const res = await fetch(`${getBaseUrl()}/google/calendar/events/${encodeURIComponent(googleEventId)}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders(),
			},
			credentials: 'include',
		});
		return res.ok;
	} catch {
		return false;
	}
}


