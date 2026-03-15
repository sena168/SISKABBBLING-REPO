# First User Bootstrap Guide

## The Chicken-and-Egg Problem

The SPM-01 system uses Firebase Authentication to verify users, but also requires a corresponding row in the `users` table with a `firebase_uid` and `role` before a user can access the API.

This creates a bootstrap challenge: the first admin user needs to exist in the database before they can log in, but they can't be created through the webapp because they're not authenticated yet.

## Solution: Manual Seed

You must manually insert the first admin user into your Neon PostgreSQL database **before** attempting to log in.

### Step 1: Get Your Firebase UID

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users** tab
4. Find your Google account (the one you'll use as admin)
5. Copy the **User UID** value (it looks like: `U7aBcD3EfGhIjKlMnOpQrStUvWx`)

### Step 2: Insert Admin User in Neon

Run this SQL in your Neon dashboard (SQL Editor) or any PostgreSQL client:

```sql
INSERT INTO users (email, display_name, firebase_uid, role, is_active, created_at, updated_at)
VALUES (
  'admin@yourcompany.com',
  'Admin Name',
  'PASTE_YOUR_FIREBASE_UID_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

Replace:

- `admin@yourcompany.com` with your admin email
- `Admin Name` with your full name
- `PASTE_YOUR_FIREBASE_UID_HERE` with the UID from Step 1

### Step 3: Verify the Insert

```sql
SELECT * FROM users WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

You should see the admin row with `role = 'admin'`.

### Step 4: Test Login

Now you can:

1. Deploy the app to Vercel (or run locally)
2. Visit the login page (will be created by the frontend agent)
3. Sign in with Google
4. The backend will find your user row by `firebase_uid` and grant admin access

## Creating Additional Users

After the first admin exists, you can create additional users through:

1. **POST /api/users** endpoint (requires admin or leader role)
2. Or manually via SQL in Neon

When creating users via the API, they will have a `NULL` `firebase_uid` initially. When they first log in with Google, Firebase Auth will create the auth record, and you should update the user row with their `firebase_uid` so future logins work.

## Important Notes

- The `firebase_uid` must exactly match the UID from Firebase Authentication
- The `role` field determines what API endpoints the user can access
- `is_active = false` will prevent login even if the Firebase token is valid
- Never commit your `.env.local` file to git — it contains secrets
