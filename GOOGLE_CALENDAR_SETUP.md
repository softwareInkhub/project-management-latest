# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your project management app.

## Prerequisites

1. A Google Cloud Project
2. Google Calendar API enabled
3. OAuth 2.0 credentials configured

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in required fields:
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (your email addresses)
6. Save and continue

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Select **Web application**
4. Configure:
   - Name: Your app name
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000/browser-callback` (for development)
     - `https://yourdomain.com/oauth2callback` (for production)
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in your project root (copy from `.env.local.example`)
2. Add your Google OAuth credentials:

```env
# Google Calendar OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Restart Your Development Server

```bash
npm run dev
```

## How to Use

### Connecting Google Calendar

1. Navigate to the Calendar page (`/calander`)
2. Click **"Connect Google Calendar"** button
3. Sign in with your Google account
4. Grant permissions to access your calendar
5. You'll be redirected back to the calendar page

### Creating Events

1. Click **"New Event"** button
2. Fill in event details:
   - Title (required)
   - Description
   - Date (required)
   - Start time (required)
   - End time (required)
   - Location
3. Click **"Create Event"**

If connected to Google Calendar:
- Event will be created in your Google Calendar
- A Google Meet link will be automatically generated
- You'll receive the Meet link in the confirmation

### Disconnecting

Click **"Disconnect"** button to remove Google Calendar integration.

## Features

✅ OAuth 2.0 PKCE flow (secure, no backend required)  
✅ Automatic Google Meet link generation  
✅ Event sync with Google Calendar  
✅ Minimal, clean UI  
✅ Mobile responsive  

## Troubleshooting

### "Client ID is missing" error
- Make sure you've set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
- Restart your development server after adding the environment variable

### OAuth redirect URI mismatch
- Verify that your redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes
- Ensure you're using the correct protocol (http vs https)

### Token exchange failed
- Verify `GOOGLE_CLIENT_SECRET` is set correctly
- Check that your OAuth consent screen is published (or in testing mode with your email added)

### API not enabled
- Make sure Google Calendar API is enabled in Google Cloud Console

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env.local` to version control** - it contains secrets
2. Keep `GOOGLE_CLIENT_SECRET` secure on the server only
3. Tokens are stored in localStorage for demo - consider using httpOnly cookies for production
4. Regularly rotate your OAuth credentials
5. Use environment-specific credentials (dev vs production)

## Production Deployment

For production:

1. Update authorized URIs in Google Cloud Console with your production domain
2. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
3. Use proper secret management
4. Consider implementing refresh token rotation
5. Add proper error handling and user notifications

## API Endpoints

The integration creates these API routes:

- `POST /api/google/token` - Exchange authorization code for tokens
- `POST /api/google/calendar/events` - Create calendar event with Google Meet

## Files Structure

```
app/
├── calander/
│   └── page.tsx                    # Calendar UI
├── oauth2callback/
│   └── page.tsx                    # OAuth callback handler
├── utils/
│   ├── googleCalendarClient.ts    # OAuth client utilities
│   └── googleCalendarApi.ts       # Calendar API utilities
└── api/
    └── google/
        ├── token/
        │   └── route.ts           # Token exchange endpoint
        └── calendar/
            └── events/
                └── route.ts       # Calendar events endpoint
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review [Google Calendar API documentation](https://developers.google.com/calendar/api)
3. Check [OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)

## License

This integration is part of your project management application.

