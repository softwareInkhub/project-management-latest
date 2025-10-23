# Production Deployment Guide - pm.brmh.in

## 🔧 Issue Fixed

**Problem:** Authentication cookies from `auth.brmh.in` were not accessible by `pm.brmh.in`, causing infinite login loops in production.

**Solution:** Added an API route (`/api/auth/sync-tokens`) that converts localStorage tokens into httpOnly cookies with the correct domain (`.brmh.in`).

## 🚀 How Authentication Works Now

### 1. **Initial Login Flow**
```
User → auth.brmh.in (SSO) → pm.brmh.in#access_token=xxx&id_token=xxx
```

### 2. **Token Sync Process**
```javascript
AuthGuard detects tokens in URL hash
  ↓
Stores in localStorage (access_token, id_token, user data)
  ↓
Calls /api/auth/sync-tokens API
  ↓
API sets httpOnly cookies with domain=.brmh.in
  ↓
Middleware can now validate authentication
```

### 3. **Subsequent Requests**
```
Browser → pm.brmh.in (with cookies)
  ↓
Middleware checks cookies
  ↓
✅ auth_valid cookie found → Allow access
```

## 📋 Deployment Checklist

### Vercel Configuration

1. **Environment Variables** (Settings → Environment Variables)
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://brmh.in
   NEXT_PUBLIC_NAMESPACE_ID=779f7250-b99e-46ca-9462-2e1008a365b8
   NEXT_PUBLIC_NAMESPACE_NAME=BRMH Project Management
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-secret
   ```

2. **Domain Configuration**
   - Custom Domain: `pm.brmh.in`
   - SSL: Enabled (automatic)

3. **Deploy**
   ```bash
   git add .
   git commit -m "Fix: Production authentication with cross-domain cookies"
   git push origin main
   ```

## 🧪 Testing Authentication

### 1. Clear Browser State
```javascript
// In browser console
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### 2. Test Login Flow
1. Navigate to `https://pm.brmh.in`
2. Should redirect to `https://auth.brmh.in/login`
3. Login with credentials
4. Should redirect back to `https://pm.brmh.in/Dashboard`

### 3. Verify Cookies
Go to `https://pm.brmh.in/debug-auth` and check:

**Expected LocalStorage:**
- ✅ `user_id` present
- ✅ `user_email` present
- ✅ `access_token` present
- ✅ `id_token` present

**Expected Cookies (check DevTools → Application → Cookies):**
- ✅ `access_token` (httpOnly, domain: .brmh.in)
- ✅ `id_token` (httpOnly, domain: .brmh.in)
- ✅ `auth_valid` (NOT httpOnly, domain: .brmh.in)

### 4. Check Console Logs
Look for these success messages:
```
[AuthGuard] Storing tokens from URL hash...
[AuthGuard] Syncing tokens to httpOnly cookies...
[AuthGuard] ✅ Tokens synced to httpOnly cookies
[Project Management Middleware] ✅ User authenticated via auth_valid cookie
```

## 🐛 Troubleshooting

### Issue: Still redirecting to login after successful authentication

**Cause:** Cookies not being set correctly

**Debug Steps:**
1. Check browser console for errors
2. Verify `/api/auth/sync-tokens` is being called
3. Check Network tab → Response headers should show `Set-Cookie`
4. Verify cookies have `domain=.brmh.in`

**Fix:**
- Clear all cookies and localStorage
- Try in incognito/private window
- Check Vercel logs for errors

### Issue: `auth_valid` cookie not found

**Cause:** API route not executed or failed

**Debug:**
```javascript
// In browser console after login
fetch('/api/auth/sync-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: localStorage.getItem('access_token'),
    idToken: localStorage.getItem('id_token')
  })
}).then(r => r.json()).then(console.log);
```

### Issue: Cookies cleared on page refresh

**Cause:** Cookie settings incorrect

**Fix:** Verify in `app/api/auth/sync-tokens/route.ts`:
- `sameSite: 'lax'` (not 'strict')
- `secure: true` in production
- `domain: '.brmh.in'` in production

## 🔒 Security Notes

### httpOnly Cookies
- `access_token` and `id_token` are httpOnly → Cannot be accessed by JavaScript
- Prevents XSS attacks from stealing tokens
- Only middleware can read them

### Cookie Domain
- Set to `.brmh.in` (note the leading dot)
- Allows cookies to be shared across:
  - `auth.brmh.in`
  - `pm.brmh.in`
  - `*.brmh.in`

### Token Expiration
- Cookies expire after 24 hours
- Refresh logic should be implemented for longer sessions

## 📊 Monitoring

### Key Metrics to Watch
1. Authentication success rate
2. Token sync failures (check Vercel logs)
3. Middleware redirects (should be minimal after login)

### Vercel Logs
```bash
vercel logs pm-brmh-in --since 1h
```

Look for:
- `[AuthGuard]` messages
- `[Project Management Middleware]` messages
- `[Sync Tokens]` messages

## 🔄 Future Improvements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Session Management**: Track active sessions in backend
3. **Better Error Handling**: More specific error messages for users
4. **Analytics**: Track authentication failures and reasons

## 📞 Support

If authentication issues persist:
1. Check Vercel deployment logs
2. Verify SSO service (`auth.brmh.in`) is working
3. Test in different browsers
4. Contact backend team if SSO is not responding

