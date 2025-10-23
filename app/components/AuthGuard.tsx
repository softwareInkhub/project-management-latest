'use client';

import { useEffect, useState } from 'react';
import { SSOUtils } from '../utils/sso-utils';

// Global singleton to prevent multiple auth checks
let globalAuthChecked = false;
let globalIsAuthenticated = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(() => !globalAuthChecked);
  const [isAuthenticated, setIsAuthenticated] = useState(() => globalIsAuthenticated);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip if already checked
      if (globalAuthChecked) {
        setIsAuthenticated(globalIsAuthenticated);
        setIsChecking(false);
        return;
      }

      console.log('[AuthGuard] Starting authentication check...');
      
      // For localhost development, check URL hash first
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('[AuthGuard] Found tokens in URL hash, processing...');
          
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const idToken = params.get('id_token');
          
          if (accessToken && idToken) {
            console.log('[AuthGuard] Storing tokens from URL hash...');
            
            // Store tokens in localStorage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('id_token', idToken);
            
            // Parse user info from ID token
            try {
              const idTokenParts = idToken.split('.');
              if (idTokenParts.length === 3) {
                const payload = JSON.parse(atob(idTokenParts[1]));
                console.log('[AuthGuard] User info from token:', payload.email);
                
                // Store user info
                localStorage.setItem('user', JSON.stringify({
                  sub: payload.sub,
                  email: payload.email,
                  username: payload['cognito:username'],
                  email_verified: payload.email_verified,
                }));
                localStorage.setItem('user_id', payload.sub);
                localStorage.setItem('userId', payload.sub);
                localStorage.setItem('user_email', payload.email);
                localStorage.setItem('user_name', payload['cognito:username']);
                localStorage.setItem('cognitoUsername', payload['cognito:username']);
                localStorage.setItem('userRole', 'user');
                localStorage.setItem('userPermissions', JSON.stringify(['read:own']));
              }
            } catch (error) {
              console.error('[AuthGuard] Failed to parse ID token:', error);
            }
            
            // Sync tokens to httpOnly cookies for middleware
            try {
              console.log('[AuthGuard] Syncing tokens to httpOnly cookies...');
              await fetch('/api/auth/sync-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, idToken })
              });
              console.log('[AuthGuard] ✅ Tokens synced to httpOnly cookies');
            } catch (error) {
              console.error('[AuthGuard] ⚠️ Failed to sync tokens to cookies:', error);
              // Continue anyway - localStorage auth will work
            }
            
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            console.log('[AuthGuard] Cleaned URL hash');
            
            // Set authenticated state
            globalAuthChecked = true;
            globalIsAuthenticated = true;
            setIsAuthenticated(true);
            setIsChecking(false);
            console.log('[AuthGuard] Authentication successful from URL hash!');
            console.log('[AuthGuard] Stored user data:', {
              userId: localStorage.getItem('userId'),
              userEmail: localStorage.getItem('user_email'),
              userName: localStorage.getItem('user_name')
            });
            return;
          }
        }
      }
      
      try {
        // Use SSOUtils to check authentication
        const { isAuthenticated: authResult, user } = await SSOUtils.initialize();
        
        console.log('[AuthGuard] Auth result:', { isAuthenticated: authResult, user: user?.email });
        
        // Update global state
        globalAuthChecked = true;
        globalIsAuthenticated = authResult;
        
        // Update component state
        setIsAuthenticated(authResult);
        setIsChecking(false);
        
        if (!authResult) {
          console.log('[AuthGuard] Not authenticated, redirecting to login...');
          // Redirect to SSO login
          SSOUtils.redirectToLogin();
        } else {
          console.log('[AuthGuard] Authenticated successfully!');
        }
      } catch (error) {
        console.error('[AuthGuard] Auth check failed:', error);
        
        // On error, redirect to login
        globalAuthChecked = true;
        globalIsAuthenticated = false;
        setIsAuthenticated(false);
        setIsChecking(false);
        
        SSOUtils.redirectToLogin();
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

