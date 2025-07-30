# Deployment Guide for Vercel

## Environment Variables Setup

Your React app needs to know the correct API URL in production. Follow these steps:

### 1. Set Environment Variable in Vercel

1. Go to your Vercel dashboard
2. Select your project (`delight-loop`)
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://delight-loop.onrender.com`
   - **Environment**: Select all environments (Production, Preview, Development)

### 2. Redeploy Your App

After setting the environment variable, redeploy your app:
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment

### 3. Verify the Fix

After redeployment, your app should now make API calls to:
- ✅ `https://delight-loop.onrender.com/api/auth/register`
- ✅ `https://delight-loop.onrender.com/api/auth/login`
- ✅ `https://delight-loop.onrender.com/api/campaigns/...`

Instead of:
- ❌ `https://delight-loop.vercel.app/api/auth/register`

## How It Works

- **Development**: Uses relative paths (`/api/auth/register`) with proxy
- **Production**: Uses full URL (`https://delight-loop.onrender.com/api/auth/register`)

The `apiService.js` automatically detects the environment and uses the appropriate URL format.

## Troubleshooting

If you still see API calls to the Vercel domain:
1. Make sure the environment variable is set correctly
2. Redeploy the app after setting the variable
3. Clear your browser cache
4. Check the browser's Network tab to confirm API calls are going to the correct domain 