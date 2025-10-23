# 🚨 EMERGENCY DEBUG - Stuck on Loading Screen

## Your Symptoms
✅ AuthGuard completes successfully  
✅ localStorage has user data  
✅ Cookies are set  
❌ **BUT** stuck on loading screen at pm.brmh.in

## 🔍 Root Cause Analysis

The loading screen you're seeing is likely from **one of these components**:
1. `AuthGuard.tsx` - "Checking authentication..."
2. `page.tsx` (root) - "Redirecting to Dashboard..."  
3. `Dashboard` - "Loading dashboard..." or "Loading dashboard data..."

## 🧪 Run This in Browser Console RIGHT NOW

Open browser console on `pm.brmh.in` and run this:

```javascript
// === DIAGNOSTIC SCRIPT ===
console.clear();
console.log('🔍 === AUTHENTICATION DIAGNOSTIC ===\n');

// 1. Check localStorage
console.log('📦 LocalStorage:');
console.log('  user_id:', localStorage.getItem('user_id'));
console.log('  user_email:', localStorage.getItem('user_email'));
console.log('  user:', localStorage.getItem('user'));

// 2. Check cookies
console.log('\n🍪 Cookies:');
document.cookie.split(';').forEach(c => console.log('  ' + c.trim()));

// 3. Check which component is rendering
console.log('\n📍 Current State:');
console.log('  URL:', window.location.href);
console.log('  Page visible:', document.querySelector('[class*="Dashboard"]') ? 'Dashboard' : 'Unknown');

// 4. Force redirect test
console.log('\n🚀 Testing redirect...');
setTimeout(() => {
  console.log('Redirecting to /diagnostic for detailed analysis...');
  window.location.href = '/diagnostic';
}, 2000);
```

## 📊 What To Look For

### Scenario 1: No "[Home Page] 🏠 Component mounted" log
**Problem:** Root page.tsx isn't rendering  
**Cause:** AuthGuard might be stuck in loading state

**Fix:** Run in console:
```javascript
// Force bypass AuthGuard
localStorage.setItem('userId', localStorage.getItem('user_id'));
localStorage.setItem('user_email', localStorage.getItem('user_email'));
window.location.href = '/Dashboard';
```

### Scenario 2: See "[Home Page]" logs but no redirect
**Problem:** Redirect is blocked or failing  
**Cause:** JavaScript error or navigation blocker

**Fix:** Run in console:
```javascript
// Manual redirect
window.location.href = '/Dashboard';
```

### Scenario 3: Dashboard loads but shows loading spinner
**Problem:** Dashboard waiting for data  
**Cause:** API call hanging or user state not propagating

**Fix:** Check Network tab for hanging requests

## 🎯 Quick Fix: Force Dashboard Load

Run this in console:

```javascript
// Ensure all user data is present
const userId = localStorage.getItem('user_id');
const userEmail = localStorage.getItem('user_email');

if (userId && userEmail) {
  console.log('✅ User data present, forcing Dashboard load...');
  
  // Ensure userRole and permissions exist
  if (!localStorage.getItem('userRole')) {
    localStorage.setItem('userRole', 'user');
  }
  if (!localStorage.getItem('userPermissions')) {
    localStorage.setItem('userPermissions', JSON.stringify(['read:own']));
  }
  if (!localStorage.getItem('user_name')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user_name', user['cognito:username'] || 'User');
  }
  if (!localStorage.getItem('cognitoUsername')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('cognitoUsername', user['cognito:username'] || 'User');
  }
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId);
  }
  
  console.log('✅ All user data verified, redirecting...');
  window.location.href = '/Dashboard';
} else {
  console.error('❌ Missing user data!');
  console.log('Available keys:', Object.keys(localStorage));
}
```

## 🔧 Nuclear Option: Complete Reset

If nothing works, run this:

```javascript
// 1. Clear everything
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.brmh.in");
});

// 2. Redirect to login
window.location.href = 'https://auth.brmh.in/login?next=' + encodeURIComponent(window.location.origin);
```

## 📱 Try Direct Navigation

Instead of relying on the root page redirect, try going directly to:

1. **Diagnostic Page:** `https://pm.brmh.in/diagnostic`
2. **Dashboard:** `https://pm.brmh.in/Dashboard`
3. **Debug Auth:** `https://pm.brmh.in/debug-auth`

If any of these load successfully, the issue is with the root page redirect logic.

## 🔬 Check Browser Console

Look for these specific errors:

### ❌ React Hydration Error
```
Warning: Text content did not match. Server: "..." Client: "..."
```
**Fix:** Clear cache and hard reload (Ctrl+Shift+R)

### ❌ Navigation Error
```
Error: Navigation was aborted
```
**Fix:** Disable browser extensions, try incognito

### ❌ Cookie/CORS Error
```
Access to fetch ... has been blocked by CORS policy
```
**Fix:** Check middleware logs, verify cookies have correct domain

## 📞 Send Me This Info

If still stuck, run this and send me the output:

```javascript
console.log('=== COMPLETE DIAGNOSTIC ===');
console.log('URL:', window.location.href);
console.log('User in LS:', localStorage.getItem('user_id') ? 'YES' : 'NO');
console.log('Email in LS:', localStorage.getItem('user_email') || 'MISSING');
console.log('auth_valid cookie:', document.cookie.includes('auth_valid') ? 'YES' : 'NO');
console.log('Page content:', document.body.innerText.substring(0, 200));
console.log('Loading spinner:', document.querySelector('.animate-spin') ? 'VISIBLE' : 'NOT VISIBLE');
console.log('Which text on screen:', 
  document.body.innerText.includes('Checking authentication') ? 'AuthGuard loading' :
  document.body.innerText.includes('Redirecting') ? 'Home page loading' :
  document.body.innerText.includes('dashboard') ? 'Dashboard loading' :
  'Unknown'
);
```

## 🎯 Expected vs Actual

| What Should Happen | What's Actually Happening |
|-------------------|---------------------------|
| AuthGuard completes → ✅ | You're seeing this ✅ |
| page.tsx mounts → Logs | Not seeing logs? ❌ |
| page.tsx redirects → Dashboard | Not happening? ❌ |
| Dashboard mounts → Logs | Not seeing logs? ❌ |
| Dashboard loads data → Renders | Stuck here? ❌ |

## 🚀 Temporary Workaround

While I fix the root cause, you can:

1. **Bookmark Dashboard directly:**  
   `https://pm.brmh.in/Dashboard`

2. **Or create a redirect:**  
   Deploy a simple `vercel.json`:
   ```json
   {
     "redirects": [
       {
         "source": "/",
         "destination": "/Dashboard",
         "permanent": false
       }
     ]
   }
   ```

---

**Run the diagnostic script above and tell me:**
1. Which text is showing on the loading screen?
2. Do you see "[Home Page]" logs in console?
3. Does clicking "Go to Dashboard Now" button work?

