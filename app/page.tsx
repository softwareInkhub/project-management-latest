'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.log('[Home Page] 🏠 Component mounted');
    console.log('[Home Page] 📍 Current URL:', window.location.href);
    console.log('[Home Page] 👤 User in localStorage:', localStorage.getItem('user_email'));
    console.log('[Home Page] 🍪 Cookies:', document.cookie);
    
    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('[Home Page] ⏰ Countdown complete, redirecting NOW...');
          window.location.href = '/Dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Dashboard in {countdown}s...</p>
        <p className="mt-2 text-sm text-gray-500">If stuck, check console for errors</p>
        <button
          onClick={() => {
            console.log('[Home Page] 🔘 Manual redirect clicked');
            window.location.href = '/Dashboard';
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Dashboard Now
        </button>
        <button
          onClick={() => {
            console.log('[Home Page] 🔘 Diagnostic page clicked');
            window.location.href = '/diagnostic';
          }}
          className="mt-2 ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Open Diagnostic Page
        </button>
      </div>
    </div>
  );
}
