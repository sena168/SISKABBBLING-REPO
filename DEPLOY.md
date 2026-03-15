# Deploy to Vercel

This guide covers deploying the SPM-01 backend to Vercel.

## Prerequisites

- ✅ Neon PostgreSQL database with tables created
- ✅ Firebase project configured
- ✅ GitHub repository connected to Vercel
- ✅ First admin user seeded in the database (see BOOTSTRAP.md)

## Step 1: Push Code to GitHub

From the `spm01-webapp` directory:

```bash
git init
git add .
git commit -m "Initial commit - SPM-01 backend"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your GitHub repository
4. Click **Deploy**

## Step 3: Configure Environment Variables in Vercel

During deployment or after deployment in Project Settings → Environment Variables, add all variables from your `.env.local` file:

### Required Variables

**Neon Database:**

```
NEON_DATABASE_URL = postgresql://username:password@host/neondb?sslmode=require
```

**Firebase Admin SDK (Server-side):**

```
FIREBASE_PROJECT_ID = your-firebase-project-id
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

**Important:** For `FIREBASE_PRIVATE_KEY`, paste the ENTIRE key including the BEGIN/END lines. Vercel's environment variable input accepts literal newlines. If you have `\n` escape sequences, convert them to actual newlines.

**Firebase Web App Config (Public):**

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-firebase-project-id
```

**Optional:**

```
N8N_BACKUP_WEBHOOK_URL = https://your-n8n-instance.com/webhook/backup
```

## Step 4: Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete
3. Check build logs for any errors

## Step 5: Test the Deployment

### 5.1 Check Homepage

Visit `https://your-project.vercel.app` — you should see "SPM-01 Backend" message (placeholder for now).

### 5.2 Test Health API (Unauthenticated)

```bash
curl -X GET https://your-project.vercel.app/api/health \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

Should return JSON with health status or 401 if no token provided.

### 5.3 Get a Firebase ID Token

To test authenticated endpoints, you need a Firebase ID token:

**Option A: From browser console (after login page is ready)**

```javascript
const token = await firebase.auth().currentUser.getIdToken();
```

**Option B: Use Firebase Admin to generate a custom token** (for testing)

### 5.4 Test Events API

```bash
curl -X GET "https://your-project.vercel.app/api/events?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

Should return paginated events or 403 if your role lacks permission.

## Step 6: Verify Role-Based Access

Log in as different users and test:

| Role        | Events        | History | Export | User Mgmt | Health | Backup |
| ----------- | ------------- | ------- | ------ | --------- | ------ | ------ |
| admin       | ✅ all        | ✅      | ✅     | ✅        | ✅     | ✅     |
| leader      | ✅ all        | ✅      | ✅     | ✅        | ✅     | ❌     |
| member      | ✅ all        | ✅      | ❌     | ❌        | ✅     | ❌     |
| stakeholder | ✅ final only | ❌      | ❌     | ❌        | ✅     | ❌     |

## Troubleshooting

### Build Fails with "Module not found"

- Ensure all dependencies are in `package.json`
- Check that `node_modules` is not committed

### 401 Unauthorized on Every Request

- Verify `FIREBASE_PRIVATE_KEY` is correctly formatted with literal newlines
- Check that the user exists in the `users` table with matching `firebase_uid`
- Ensure the Firebase token is valid and not expired

### 403 Forbidden

- Check the user's `role` in the database
- Verify the endpoint's role requirements

### Database Connection Errors

- Verify `NEON_DATABASE_URL` is correct
- Ensure Neon database is active (not paused)
- Check that the connection string includes `?sslmode=require`

### Vercel Environment Variables Not Recognized

- Variables must be added in Vercel dashboard, not just in `.env.local`
- Redeploy after adding new variables
- Server-only variables (no `NEXT_PUBLIC_` prefix) are only available in API routes

## Next Steps

After backend deployment is confirmed working, the **Frontend Agent** will:

- Build the login page
- Create role-specific dashboards
- Connect to these API endpoints

Handoff information for the frontend agent:

- **Vercel Project URL:** `https://your-project.vercel.app`
- **GitHub Repo:** `https://github.com/yourusername/your-repo`
- **Confirmed Working API Routes:** List which ones you tested
- **First Admin User Exists:** YES
- **Firebase Project ID:** `your-firebase-project-id`
