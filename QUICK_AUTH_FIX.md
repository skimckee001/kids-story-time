# Quick Authentication Fix & Testing Guide

## 🔴 IMPORTANT: Test Accounts Don't Exist in Database
The accounts like `basic@test.com` are **NOT real accounts**. They were placeholders for mock testing only.

## ✅ Solution 1: Use Dev Mode (Easiest - No Login Required)

Open browser console at http://localhost:3000 and run:
```javascript
// Enable dev mode
localStorage.setItem('devMode', 'true');
location.reload();
```

Look for the purple 🧪 button in bottom-right corner. Click it to switch tiers instantly without logging in.

## ✅ Solution 2: Create Mock User (No Database Required)

Open browser console and run:
```javascript
// Create a mock user session
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  tier: 'story-pro'  // Change to any tier you want
};
localStorage.setItem('mockUser', JSON.stringify(mockUser));
localStorage.setItem('subscriptionTier', 'story-pro');
location.reload();
```

Available tiers:
- `try-now` - Guest mode
- `reader-free` - Free account
- `story-pro` - $4.99/month
- `read-to-me-promax` - $6.99/month  
- `family-plus` - $7.99/month

## ✅ Solution 3: Create Real Test Account

1. Click "Sign In" button in header
2. Click "Sign Up" tab
3. Create a new account:
   - Email: your-test@example.com
   - Password: TestPass123!
   - Parent Name: Test User
   - ✅ Check terms agreement
4. Click "Create Account"
5. **Note**: Email verification is currently bypassed, so you can use immediately

## 🔍 How to Check if You're Signed In

Open browser console and run:
```javascript
// Check current user
localStorage.getItem('mockUser');
localStorage.getItem('subscriptionTier');
```

## 🚪 How to Sign Out

### If you used Mock User:
```javascript
// Clear mock user
localStorage.removeItem('mockUser');
localStorage.removeItem('subscriptionTier');
localStorage.removeItem('devMode');
location.reload();
```

### If you created a real account:
1. Look for the profile icon (👤) in the top-right corner
2. Click on it to open the menu
3. Click "🚪 Sign Out"

**Note**: If you don't see the profile icon, you're not signed in!

## 🐛 Troubleshooting Sign Out Button Not Visible

The sign out button only appears when:
1. You have a real authenticated user (not mock)
2. You click on the profile icon (👤) in the header

If using mock user, just clear localStorage as shown above.

## 📝 Quick Test Flow

1. **Clear everything first:**
```javascript
localStorage.clear();
location.reload();
```

2. **Enable dev mode:**
```javascript
localStorage.setItem('devMode', 'true');
location.reload();
```

3. **Use the purple 🧪 button to test different tiers**

4. **When done testing:**
```javascript
localStorage.clear();
location.reload();
```

## ⚠️ Current Issues
- Email verification is not working (but accounts work without it)
- The "Sign Out" button only shows for real authenticated users
- Mock users need to use localStorage.clear() to "sign out"

---
Last Updated: September 4, 2025