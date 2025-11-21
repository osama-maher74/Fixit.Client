# Profile Page Troubleshooting Guide

## 🔍 How to Debug Profile Issues

### **Step 1: Check if Email is Stored After Login**

1. **Open Browser DevTools** (F12)
2. **Login** to your application
3. **Go to Console tab** - You should see:
   ```
   Auth response received: {...}
   Storing user: {...}
   ```
4. **Go to Application tab → Local Storage**
5. **Verify these keys exist:**
   - `auth_token` - Should have a JWT token
   - `current_user` - Should be a JSON object with user data
   - `email` - ✅ **This is critical!** Should contain the user's email

### **Step 2: Navigate to Profile Page**

1. **Click the profile icon** in the navbar (or go to `/profile`)
2. **Check Console** - You should see:
   ```
   Profile Component - Email from localStorage: user@example.com
   Profile Component - All localStorage: {email: "user@example.com", ...}
   ClientService - getCurrentUserProfile called
   ClientService - Email from localStorage: user@example.com
   ClientService - Making API call to: https://your-api.com/Client/GetByEmail
   ClientService - With email: user@example.com
   ClientService - Full URL with params: https://your-api.com/Client/GetByEmail?email=user@example.com
   ```

3. **Check Network tab** - Should show:
   - **Request:** `GET /Client/GetByEmail?email=user@example.com`
   - **Status:** `200 OK` (if successful)

### **Step 3: Check Backend Response**

In the **Network tab**, click on the request and check:

**Response should be:**
```json
{
  "id": 1,
  "fName": "John",
  "lName": "Doe",
  "location": "New York",
  "phoneNumber": "1234567890",
  "profileImage": null,
  "gender": 0,
  "totalRequests": 5
}
```

---

## ❌ Common Issues and Solutions

### **Issue 1: No email in localStorage**

**Symptoms:**
```
ClientService - No email found in localStorage!
```

**Solution:**
The auth service now stores email when you login. Make sure you:
1. **Logout** completely
2. **Login again** (this will store the email)
3. **Check Application → Local Storage** to verify `email` key exists

---

### **Issue 2: Email stored but API not called**

**Symptoms:**
- Email exists in localStorage
- But no network request visible in Network tab

**Possible Causes:**
1. **Auth guard blocked access** - Check console for navigation errors
2. **Environment API URL wrong** - Check `environment.ts` file
3. **Component not mounting** - Check for component errors

**Solution:**
```typescript
// Check environment.ts
export const environment = {
  apiUrl: 'https://your-api-domain.com/api' // ✅ Correct format
};
```

---

### **Issue 3: API returns 400/404/500 error**

**Symptoms:**
```
Profile Component - Error status: 400
Profile Component - Error message: Bad Request
```

**Possible Causes:**
1. **Backend expects different parameter name** (e.g., `Email` instead of `email`)
2. **Email format invalid**
3. **User not found in database**
4. **CORS issue**

**Solution:**
Check the Network tab → Request → Query String Parameters:
- Should be: `?email=user@example.com`
- If backend expects PascalCase: Update the service to use `Email` param

---

### **Issue 4: CORS Error**

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Backend needs to allow your frontend origin. Check your .NET API CORS configuration.

---

## 🐛 Debug Checklist

Run through this checklist:

- [ ] User is logged in (check `isAuthenticated` in auth service)
- [ ] `email` exists in localStorage
- [ ] `auth_token` exists in localStorage
- [ ] Profile route is accessible (not blocked by auth guard)
- [ ] Console shows "Making API call" message
- [ ] Network tab shows GET request to `/Client/GetByEmail`
- [ ] Backend returns 200 status
- [ ] Response contains valid client data

---

## 📝 Console Logs You Should See

### **On Login:**
```
Auth response received: {token: "...", user: {...}}
Storing user: {id: "...", email: "user@example.com", ...}
User authenticated, isAuthenticated: true
```

### **On Profile Load:**
```
Profile Component - Email from localStorage: user@example.com
Profile Component - All localStorage: {...}
ClientService - getCurrentUserProfile called
ClientService - Email from localStorage: user@example.com
ClientService - Making API call to: https://api.com/Client/GetByEmail
ClientService - With email: user@example.com
ClientService - Full URL with params: https://api.com/Client/GetByEmail?email=user@example.com
Profile Component - Profile data received: {...}
```

---

## 🔧 Manual Testing

### **Test 1: Fresh Login**
1. Clear localStorage (Application → Clear site data)
2. Login with valid credentials
3. Check localStorage has `email` key
4. Navigate to `/profile`
5. Verify profile loads

### **Test 2: Page Refresh**
1. Login and navigate to profile
2. Refresh the page (F5)
3. Profile should reload successfully

### **Test 3: Direct URL Access**
1. Login
2. Navigate to home
3. Type `/profile` in URL bar
4. Profile should load (not redirect to login)

### **Test 4: Not Logged In**
1. Logout (or clear localStorage)
2. Try accessing `/profile`
3. Should redirect to `/login`

---

## 🛠️ Backend Verification

Verify your backend accepts the request:

```http
GET /api/Client/GetByEmail?email=user@example.com
```

**Expected Response:**
```json
{
  "id": 1,
  "fName": "John",
  "lName": "Doe",
  "location": "New York",
  "phoneNumber": "1234567890",
  "profileImage": null,
  "gender": 0,
  "totalRequests": 5
}
```

---

## 📞 Still Not Working?

If you've gone through all the steps and it's still not working:

1. **Share the console output** - Copy all console messages
2. **Share the Network tab** - Show the request/response
3. **Share localStorage contents** - Show all keys/values
4. **Share environment.ts** - Verify API URL is correct

---

## ✅ Success Indicators

You know it's working when:
- ✅ Profile icon appears in navbar when logged in
- ✅ Clicking icon navigates to `/profile`
- ✅ Loading spinner shows briefly
- ✅ Profile data displays correctly
- ✅ Default avatar shows if no profile image
- ✅ No console errors
- ✅ Network request shows 200 OK

---

**Last Updated:** 2025-11-21
**Version:** 1.0
