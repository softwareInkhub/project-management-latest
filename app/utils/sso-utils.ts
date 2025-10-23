/**
 * Shared SSO utilities for all *.brmh.in domains
 * This file can be copied to other apps or published as a package
 */

export interface SSOTokens {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  }
  
  export interface SSOUser {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }
  
  export class SSOUtils {
    private static readonly AUTH_DOMAIN = 'https://auth.brmh.in';
    private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';
    private static readonly COOKIE_DOMAIN = '.brmh.in';
  
    /**
     * Check if user is authenticated via cookies (primary method for SSO)
     * Note: Since backend cookies are httpOnly, we rely on the auth_valid flag set by middleware
     */
    static isAuthenticated(): boolean {
      if (typeof document === 'undefined') return false;
      
      const cookies = this.getCookies();
      
      // Log for debugging
      const hasAuthValid = !!cookies.auth_valid;
      const hasAuthValidLocal = !!cookies.auth_valid_local;
      const hasAccessToken = !!cookies.access_token;
      const hasIdToken = !!cookies.id_token;
      
      console.log('[SSO] isAuthenticated check:', {
        hasAuthValid,
        hasAuthValidLocal,
        hasAccessToken,
        hasIdToken,
        allCookieNames: Object.keys(cookies)
      });
      
      // Primary check: auth_valid flag set by middleware (since tokens are httpOnly)
      // Also check for auth_valid_local which is set after successful sync
      if (cookies.auth_valid || cookies.auth_valid_local) {
        console.log('[SSO] Authenticated via auth flags');
        return true;
      }
      
      // Fallback: check if tokens are directly readable (backward compatibility)
      if (cookies.access_token || cookies.id_token) {
        console.log('[SSO] Authenticated via readable tokens');
        return true;
      }
      
      console.log('[SSO] Not authenticated - no auth flags or tokens found');
      return false;
    }
  
    /**
     * Get all auth cookies
     */
    static getCookies(): Record<string, string> {
      if (typeof document === 'undefined') return {};
      
      return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
    }
  
    /**
     * Get tokens from cookies (or localStorage for httpOnly cookies)
     * Note: Since backend cookies are httpOnly, we can't read them directly
     * We rely on localStorage after sync or backend endpoints
     */
    static getTokens(): SSOTokens {
      const cookies = this.getCookies();
      
      // Try cookies first (if they're not httpOnly)
      const cookieTokens = {
        accessToken: cookies.access_token,
        idToken: cookies.id_token,
        refreshToken: cookies.refresh_token,
      };
      
      // If cookies are present, return them
      if (cookieTokens.accessToken || cookieTokens.idToken) {
        return cookieTokens;
      }
      
      // Fallback to localStorage (populated by syncTokensFromCookies on server-side or after successful auth)
      if (typeof localStorage !== 'undefined') {
        return {
          accessToken: localStorage.getItem('access_token') || undefined,
          idToken: localStorage.getItem('id_token') || undefined,
          refreshToken: localStorage.getItem('refresh_token') || undefined,
        };
      }
      
      return {};
    }
  
    /**
     * Get user info from ID token or localStorage
     */
    static getUser(): SSOUser | null {
      // First, try to get from localStorage (faster and works on subsequent visits)
      if (typeof localStorage !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.sub && user.email) {
              console.log('[SSO] Found user in localStorage:', user.email);
              return user;
            }
          } catch (error) {
            console.warn('[SSO] Failed to parse stored user:', error);
          }
        }
      }
      
      // Fallback: parse from ID token
      const tokens = this.getTokens();
      if (!tokens.idToken) {
        console.log('[SSO] No user in localStorage and no ID token');
        return null;
      }
  
      try {
        const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
        console.log('[SSO] Parsed user from ID token:', payload.email);
        return {
          sub: payload.sub,
          email: payload.email,
          email_verified: payload.email_verified,
          name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          given_name: payload.given_name,
          family_name: payload.family_name,
          picture: payload.picture,
        };
      } catch (error) {
        console.error('[SSO] Failed to parse ID token:', error);
        return null;
      }
    }
  
    /**
     * Sync tokens from cookies to localStorage (for apps that expect localStorage)
     * Since cookies are httpOnly, we fetch user info from backend /auth/me endpoint
     */
    static async syncTokensFromCookies(): Promise<void> {
      return this.syncTokensToLocalStorage();
    }
  
    /**
     * Sync tokens from cookies to localStorage (for apps that expect localStorage)
     * Since cookies are httpOnly, we fetch user info from backend /auth/me endpoint
     */
    static async syncTokensToLocalStorage(): Promise<void> {
      if (typeof window === 'undefined') return;
  
      try {
        // Since cookies are httpOnly, we can't read them directly
        // Instead, call the backend /auth/me endpoint which will use the httpOnly cookies
        const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include', // Important: sends httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          
          if (user) {
            // Store user info in localStorage (use both formats for compatibility)
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('user_id', user.sub);
            localStorage.setItem('userId', user.sub); // Also set userId for compatibility
            if (user.email) localStorage.setItem('user_email', user.email);
            if (user.name) localStorage.setItem('user_name', user.name);
            if (user['cognito:username']) localStorage.setItem('cognitoUsername', user['cognito:username']);
            
            // Set user role and permissions
            localStorage.setItem('userRole', 'user');
            localStorage.setItem('userPermissions', JSON.stringify(['read:own']));
            
            // Set a local flag that we've synced successfully
            const cookieDomain = window.location.hostname.includes('brmh.in') ? '; domain=.brmh.in' : '';
            const cookieSecure = window.location.protocol === 'https:' ? '; secure' : '';
            document.cookie = `auth_valid_local=1; path=/${cookieDomain}${cookieSecure}; samesite=lax; max-age=${60 * 60 * 24 * 7}`; // 7 days
            
            console.log('[SSO] Successfully synced user info from backend');
          }
        } else {
          console.warn('[SSO] Failed to fetch user info from backend:', response.status);
        }
      } catch (error) {
        console.error('[SSO] Failed to sync tokens from backend:', error);
      }
    }
  
    /**
     * Get cookie value by name
     */
    static getCookieValue(name: string): string | undefined {
      const cookies = this.getCookies();
      return cookies[name];
    }
  
    /**
     * Redirect to auth.brmh.in for login
     */
    static redirectToLogin(returnUrl?: string): void {
      const currentUrl = returnUrl || (typeof window !== 'undefined' ? window.location.href : '');
      const loginUrl = new URL('/login', this.AUTH_DOMAIN);
      if (currentUrl) {
        loginUrl.searchParams.set('next', currentUrl);
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = loginUrl.toString();
      }
    }
  
    /**
     * Logout and redirect to auth.brmh.in
     */
    static async logout(returnUrl?: string): Promise<void> {
      const tokens = this.getTokens();
      
      // Call backend logout endpoint
      try {
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        });
      } catch (error) {
        console.error('[SSO] Logout API call failed:', error);
      }
  
      // Clear cookies
      this.clearCookies();
  
      // Clear localStorage (for backward compatibility)
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'access_token', 'id_token', 'refresh_token',
          'accessToken', 'idToken', 'refreshToken',
          'user', 'user_id', 'user_email', 'user_name'
        ];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignore errors
          }
        });
      }
  
      // Redirect to auth domain
      const logoutUrl = new URL('/login', this.AUTH_DOMAIN);
      if (returnUrl) {
        logoutUrl.searchParams.set('next', returnUrl);
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = logoutUrl.toString();
      }
    }
  
    /**
     * Clear all auth cookies
     */
    static clearCookies(): void {
      if (typeof document === 'undefined') return;
  
      const cookiesToClear = ['access_token', 'id_token', 'refresh_token', 'auth_valid', 'auth_valid_local'];
      cookiesToClear.forEach(cookieName => {
        // Clear for current domain
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        // Clear for .brmh.in domain with both lax and none sameSite
        document.cookie = `${cookieName}=; domain=${this.COOKIE_DOMAIN}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
        document.cookie = `${cookieName}=; domain=${this.COOKIE_DOMAIN}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=none`;
      });
    }
  
    /**
     * Fetch user profile from backend
     */
    static async fetchUserProfile(backendUrl?: string): Promise<any> {
      const baseUrl = backendUrl || this.API_BASE_URL;
      const tokens = this.getTokens();
      const accessToken = tokens.accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
      
      if (!accessToken) {
        throw new Error('No access token available');
      }
  
      try {
        const response = await fetch(`${baseUrl}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired, try to refresh
            const refreshed = await this.refreshTokens();
            if (!refreshed) {
              throw new Error('Authentication expired');
            }
            // Retry with new token
            return this.fetchUserProfile(backendUrl);
          }
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }
  
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('[SSO] Failed to fetch user profile:', error);
        throw error;
      }
    }
  
    /**
     * Refresh tokens
     */
    static async refreshTokens(): Promise<boolean> {
      const tokens = this.getTokens();
      if (!tokens.refreshToken) return false;
  
      try {
        const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        });
  
        if (response.ok) {
          // Tokens should be updated via cookies by the backend
          return true;
        }
        return false;
      } catch (error) {
        console.error('[SSO] Token refresh failed:', error);
        return false;
      }
    }
  
  /**
   * Initialize SSO for an app (call this on app startup)
   * Works with httpOnly cookies set by backend
   */
  static async initialize(): Promise<{ isAuthenticated: boolean; user: SSOUser | null }> {
    // For localhost development, check localStorage first
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('[SSO] Localhost detected, checking localStorage for development tokens');
      
      const storedAccessToken = localStorage.getItem('access_token');
      const storedIdToken = localStorage.getItem('id_token');
      
      if (storedAccessToken && storedIdToken) {
        console.log('[SSO] Found development tokens in localStorage');
        
        // Parse user from ID token
        const user = this.getUser();
        if (user) {
          return { isAuthenticated: true, user };
        }
      }
    }
    
    // Check if authenticated via auth_valid flag (set by middleware for httpOnly cookies)
    const isAuthenticated = this.isAuthenticated();
    
    if (isAuthenticated) {
      // Sync user info from backend (since cookies are httpOnly)
      await this.syncTokensToLocalStorage();
      
      // Get user from localStorage after sync
      const userFromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      let user: SSOUser | null = null;
      
      if (userFromStorage) {
        try {
          user = JSON.parse(userFromStorage);
        } catch (e) {
          console.error('[SSO] Failed to parse user from localStorage:', e);
        }
      }
      
      // Fallback: try to parse from ID token if available
      if (!user) {
        user = this.getUser();
      }
      
      return { isAuthenticated: true, user };
    }

    return { isAuthenticated: false, user: null };
  }
  
    /**
     * Validate token with backend
     * Works with httpOnly cookies - no token parameter needed
     */
    static async validateToken(token?: string): Promise<boolean> {
      try {
        // If a specific token is provided, use it
        if (token) {
          const response = await fetch(`${this.API_BASE_URL}/auth/validate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          return response.ok;
        }
        
        // Otherwise, rely on httpOnly cookies sent automatically
        const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include', // Sends httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response.ok;
      } catch (error) {
        console.error('[SSO] Token validation failed:', error);
        return false;
      }
    }
  }
  
  // Export for backward compatibility
  export const AuthService = SSOUtils;
  
  
  