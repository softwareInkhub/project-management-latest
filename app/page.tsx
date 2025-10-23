'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // AuthGuard handles all authentication checks
    // Just redirect to Dashboard immediately - AuthGuard will intercept if not authenticated
    if (!hasRedirected) {
      console.log('[Home] Redirecting to Dashboard...');
      setHasRedirected(true);
      
      // Use window.location for more reliable redirect in production
      if (typeof window !== 'undefined') {
        window.location.href = '/Dashboard';
      } else {
        router.replace('/Dashboard');
      }
    }
  }, [hasRedirected, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
