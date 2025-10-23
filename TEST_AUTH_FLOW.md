# 🧪 Authentication Flow Testing Guide

## What Was Fixed

### ❌ Original Issues
1. **Loading screen stuck** - Root page didn't wait for auth check before redirecting
2. **Dashboard stuck** - Required `isAuthenticated` flag which was slow to update
3. **Missing localStorage data** - Page refreshes lost user data from localStorage
4. **Race condition** - useAuth hook didn't detect when AuthGuard updated localStorage

### ✅ Fixes Applied
1. **Root page** - Now uses direct `window.location.href` for reliable redirect
2. **Dashboard** - Now checks for `user` object (available immediately from localStorage)
3. **AuthGuard** - Now ensures localStorage is populated on every auth check
4. **useAuth hook** - Now listens for custom events when AuthGuard syncs data
5. **SSOUtils.getUser()** - Now checks localStorage first before parsing tokens

## 🚀 Deploy These Changes

```bash
git add .
git commit -m "fix: resolve loading screen and state sync issues"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

## ✅ Testing Steps

### Test 1: Fresh Login (Clear State)

1. **Open DevTools Console**
   - Open browser DevTools (F12)
   - Go to Console tab

2. **Clear All State**
   ```javascript
   // Run in console
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

3. **Visit pm.brmh.in**
   ```
   Expected: Redirect to auth.brmh.in/login
   ```

4. **Login**
   ```
   Expected: Redirect back to pm.brmh.in
   ```

5. **Check Console Logs**
   ```
   ✅ [AuthGuard] Storing tokens from URL hash...
   ✅ [AuthGuard] Syncing tokens to httpOnly cookies...
   ✅ [AuthGuard] ✅ Tokens synced to httpOnly cookies
   ✅ [AuthGuard] ✅ User data synced to localStorage
   ✅ [Home] Redirecting to Dashboard...
   ✅ [Dashboard] useEffect triggered
   ✅ Dashboard loads
   ```

6. **Check localStorage** (DevTools → Application → Local Storage)
   ```
   ✅ user_id: [your-id]
   ✅ user_email: [your-email]
   ✅ user: [full-user-object]
   ```

7. **Check Cookies** (DevTools → Application → Cookies → pm.brmh.in)
   ```
   ✅ access_token (httpOnly, domain: .brmh.in)
   ✅ id_token (httpOnly, domain: .brmh.in)
   ✅ auth_valid (NOT httpOnly, domain: .brmh.in)
   ```

### Test 2: Page Refresh (Existing Session)

1. **Refresh the page** (F5 or Cmd+R)
   ```
   Expected: Dashboard loads immediately, NO redirect to login
   ```

2. **Check Console Logs**
   ```
   ✅ [AuthGuard] Starting authentication check...
   ✅ [SSO] isAuthenticated check: {hasAuthValid: true}
   ✅ [SSO] Authenticated via auth flags
   ✅ [AuthGuard] Auth result: {isAuthenticated: true, user: 'your-email'}
   ✅ [AuthGuard] Authenticated successfully!
   ✅ [useAuth] User authenticated: your-email
   ✅ [Dashboard] useEffect triggered: {isAuthenticated: true, user: 'your-email'}
   ```

3. **Check Performance**
   ```
   Dashboard should load in < 2 seconds
   No spinning loader
   No redirect loops
   ```

### Test 3: New Tab (Same Browser)

1. **Open new tab** → Navigate to `pm.brmh.in`
   ```
   Expected: Loads directly to Dashboard (no login)
   ```

2. **Check Console**
   ```
   ✅ [SSO] Authenticated via auth flags
   ✅ Dashboard loads
   ```

### Test 4: Direct Page Access

1. **Visit** `pm.brmh.in/task`
   ```
   Expected: Loads task page directly (no redirect to root or login)
   ```

2. **Visit** `pm.brmh.in/project`
   ```
   Expected: Loads project page directly
   ```

### Test 5: Logout and Re-login

1. **Click Logout** (in Sidebar)
   ```
   Expected: Redirect to auth.brmh.in/login
   ```

2. **Check State**
   ```
   localStorage should be empty
   All cookies should be cleared
   ```

3. **Login Again**
   ```
   Expected: Same as Test 1
   ```

## 🐛 Troubleshooting

### Still seeing loading screen?

**Check these in order:**

1. **Console Logs**
   ```javascript
   // What do you see?
   [AuthGuard] Starting authentication check... ← Should see this
   [AuthGuard] Authenticated successfully!     ← Should see this
   [Home] Redirecting to Dashboard...         ← Should see this
   [Dashboard] useEffect triggered            ← Should see this
   ```

2. **Network Tab**
   ```
   Check for:
   - /auth/me request (should be 200 OK or 304 Not Modified)
   - /api/auth/sync-tokens request (should be 200 OK)
   ```

3. **localStorage Data**
   ```javascript
   // Run in console
   console.log({
     user_id: localStorage.getItem('user_id'),
     user_email: localStorage.getItem('user_email'),
     user: localStorage.getItem('user')
   });
   ```

4. **Cookies**
   ```javascript
   // Run in console
   console.log(document.cookie);
   // Should see: auth_valid=true
   ```

### Specific Error: "Checking authentication..." forever

**Cause:** AuthGuard is stuck in loading state

**Fix:**
```javascript
// Run in console
localStorage.clear();
location.reload();
```

Then login again.

### Specific Error: "Loading dashboard..." forever

**Cause:** useAuth not detecting user from localStorage

**Debug:**
```javascript
// Run in console
console.log('Has user data?', !!localStorage.getItem('user_id'));
console.log('User email:', localStorage.getItem('user_email'));
```

**If no data:**
- Your SSO backend `/auth/me` might not be working
- Check Network tab for failed requests
- Try logging in again

### Specific Error: Infinite redirect loop

**Cause:** Middleware redirecting even with valid cookies

**Debug:**
```javascript
// Check cookies in console
document.cookie.split(';').forEach(c => console.log(c.trim()));
```

**Should see:**
- `auth_valid=true`

**If missing:**
- Clear everything and login again
- Check if /api/auth/sync-tokens succeeded

## 📊 Expected Console Flow

### On Fresh Login:
```
[AuthGuard] Starting authentication check...
[AuthGuard] Found tokens in URL hash, processing...
[AuthGuard] Storing tokens from URL hash...
[AuthGuard] User info from token: your@email.com
[AuthGuard] Syncing tokens to httpOnly cookies...
[Sync Tokens] Setting httpOnly cookies for authenticated user
[Sync Tokens] ✅ Cookies set successfully
[AuthGuard] ✅ Tokens synced to httpOnly cookies
[AuthGuard] Cleaned URL hash
[AuthGuard] Authentication successful from URL hash!
[AuthGuard] Stored user data: {userId: "...", userEmail: "...", userName: "..."}
[Home] Redirecting to Dashboard...
[Dashboard] useEffect triggered: {isAuthenticated: true, user: "your@email.com"}
🔄 Fetching dashboard data...
✅ Dashboard data loaded successfully
```

### On Page Refresh:
```
[AuthGuard] Starting authentication check...
[SSO] isAuthenticated check: {hasAuthValid: true, ...}
[SSO] Authenticated via auth flags
[SSO] Found user in localStorage: your@email.com
[AuthGuard] Auth result: {isAuthenticated: true, user: "your@email.com"}
[AuthGuard] Authenticated successfully!
[useAuth] User authenticated: your@email.com
[Home] Redirecting to Dashboard...
[Dashboard] useEffect triggered: {isAuthenticated: true, user: "your@email.com"}
🔄 Fetching dashboard data...
✅ Dashboard data loaded successfully
```

## ✅ Success Criteria

- [ ] Fresh login completes in < 5 seconds
- [ ] Page refresh loads Dashboard in < 2 seconds
- [ ] No "Loading..." screen stuck
- [ ] No redirect loops
- [ ] User data persists across page refreshes
- [ ] All pages accessible (Dashboard, Tasks, Projects, etc.)
- [ ] Logout clears all data and redirects to login

## 🎯 Quick Health Check

Run this in browser console on `pm.brmh.in/debug-auth`:

```javascript
console.log('🔍 Auth Health Check:');
console.log('✅ User ID:', localStorage.getItem('user_id') ? 'Present' : '❌ Missing');
console.log('✅ User Email:', localStorage.getItem('user_email') ? 'Present' : '❌ Missing');
console.log('✅ Auth Cookie:', document.cookie.includes('auth_valid') ? 'Present' : '❌ Missing');
console.log('✅ All Good!', 
  localStorage.getItem('user_id') && 
  localStorage.getItem('user_email') && 
  document.cookie.includes('auth_valid')
);
```

**Expected Output:**
```
🔍 Auth Health Check:
✅ User ID: Present
✅ User Email: Present
✅ Auth Cookie: Present
✅ All Good! true
```

## 🆘 Emergency Debugging

If nothing works, run this complete diagnostic:

```javascript
console.log('=== DIAGNOSTIC REPORT ===');
console.log('URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Protocol:', window.location.protocol);
console.log('\n--- LocalStorage ---');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key + ':', localStorage.getItem(key));
}
console.log('\n--- Cookies ---');
document.cookie.split(';').forEach(c => console.log(c.trim()));
console.log('\n--- Network Test ---');
fetch('/api/auth/sync-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    accessToken: localStorage.getItem('access_token') || 'test',
    idToken: localStorage.getItem('id_token') || 'test'
  })
}).then(r => r.json()).then(d => console.log('Sync test:', d));
```

Send this output if you need help debugging!

