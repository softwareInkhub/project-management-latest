// Google Calendar API integration utilities

export interface CalendarDateTime {
  dateTime: string;
  timeZone?: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start: string | CalendarDateTime;
  end: string | CalendarDateTime;
  externalId?: string;
  attendees?: { email: string; optional?: boolean }[];
  userId?: string;
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

export async function createEvent(input: CalendarEventInput): Promise<CalendarEventResponse | null> {
  try {
    // Get Google Calendar access token from localStorage
    const tokensStr = localStorage.getItem('google_calendar_tokens');
    if (!tokensStr) {
      console.error('No Google Calendar tokens found');
      return null;
    }
    
    const tokens = JSON.parse(tokensStr);
    const accessToken = tokens.access_token;
    
    if (!accessToken) {
      console.error('No access token found in Google Calendar tokens');
      return null;
    }

    const res = await fetch('/api/google/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        accessToken,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to create calendar event:', errorText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateEvent(googleEventId: string, input: Partial<CalendarEventInput>): Promise<CalendarEventResponse | null> {
  try {
    const res = await fetch(`/api/google/calendar/events/${encodeURIComponent(googleEventId)}`, {
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
    const res = await fetch(`/api/google/calendar/events/${encodeURIComponent(googleEventId)}`, {
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

