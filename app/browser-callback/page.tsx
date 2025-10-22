'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleGoogleCalendarCallback } from '../utils/googleCalendarClient';

export default function BrowserCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    async function run() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('OAuth error:', error);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => router.push('/calander'), 2000);
        return;
      }

      if (code) {
        try {
          setStatus('Connecting to Google Calendar...');
          
          // Get user ID from localStorage
          const userId = localStorage.getItem('userId') || 'demo-user';
          
          // Handle the OAuth callback
          await handleGoogleCalendarCallback(userId);
          
          setStatus('Successfully connected! Redirecting to calendar...');
          setTimeout(() => router.push('/calander'), 1500);
        } catch (error) {
          console.error('OAuth callback error:', error);
          setStatus('Failed to connect. Redirecting...');
          setTimeout(() => router.push('/calander'), 2000);
        }
      } else {
        setStatus('No authorization code received. Redirecting...');
        setTimeout(() => router.push('/calander'), 2000);
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Google Calendar</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
