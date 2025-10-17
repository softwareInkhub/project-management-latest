'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Global singleton to prevent multiple redirects
let globalHasRedirected = false;

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      // Check if user is authenticated by looking at localStorage
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('user_email');
      
      if (userId && userEmail) {
        console.log('[Home] User is authenticated, redirecting to Dashboard...');
        setIsAuthenticated(true);
        setIsChecking(false);
        
        // Only redirect once using global flag
        if (!globalHasRedirected) {
          globalHasRedirected = true;
          router.replace('/Dashboard');
        }
      } else {
        // Check again after a short delay
        setTimeout(checkAuthAndRedirect, 500);
      }
    };

    // Start checking after a short delay to let AuthGuard process
    const timer = setTimeout(checkAuthAndRedirect, 200);
    
    return () => clearTimeout(timer);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
