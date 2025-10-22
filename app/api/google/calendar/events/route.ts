import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, location, start, end, attendees, accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar' },
        { status: 401 }
      );
    }

    // Build event object
    const event: any = {
      summary: title,
      description,
      location,
      start: typeof start === 'string' ? { dateTime: start } : start,
      end: typeof end === 'string' ? { dateTime: end } : end,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map((a: any) => ({ 
        email: a.email, 
        optional: a.optional || false 
      }));
    }

    // Create event in Google Calendar
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: response.status }
      );
    }

    const createdEvent = await response.json();

    return NextResponse.json({
      googleEventId: createdEvent.id,
      status: createdEvent.status,
      link: createdEvent.htmlLink,
      meetLink: createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri,
      meetPhoneNumber: createdEvent.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'phone')?.uri,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

