'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function run() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('OAuth error:', error);
        router.push('/dashboard');
        return;
      }

      if (code) {
        // Handle Google Calendar OAuth callback
        try {
          // Extract state from URL to determine which OAuth flow this is for
          const state = searchParams.get('state');
          
          if (state && state.includes('google_calendar')) {
            // This is for Google Calendar integration
            // The googleCalendarClient will handle the callback
            router.push('/calander');
          } else {
            // Default redirect to dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    }

    run();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}
