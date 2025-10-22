'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleGoogleCalendarCallback } from '../utils/googleCalendarClient';

export default function OAuth2CallbackPage() {
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
          const userId = localStorage.getItem('userId') || 'default-user';
          
          // Handle Google Calendar OAuth callback
          await handleGoogleCalendarCallback(userId);
          
          setStatus('Successfully connected! Redirecting...');
          setTimeout(() => router.push('/calander'), 1000);
        } catch (error) {
          console.error('OAuth callback error:', error);
          setStatus('Connection failed. Redirecting...');
          setTimeout(() => router.push('/calander'), 2000);
        }
      } else {
        setStatus('No authorization code received. Redirecting...');
        setTimeout(() => router.push('/calander'), 2000);
      }
    }

    run();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Google Calendar</h2>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}

