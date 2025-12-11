# How to Set Up Google Drive Sync

To enable Google Drive sync, you need to create a **Google Cloud Project** and get a **Client ID**. It's free and takes about 2 minutes.

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) and select **"New Project"**.
3. Name it `Borewell Invoice` and click **Create**.

## Step 2: Enable Drive API
1. In the sidebar, go to **APIs & Services > Library**.
2. Search for **"Google Drive API"**.
3. Click on it and click **Enable**.

## Step 3: Configure OAuth Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in the required fields:
   - **App Name**: `Borewell Invoice`
   - **User Support Email**: Select your email.
   - **Developer Contact**: Enter your email.
4. Click **Save and Continue** through the other steps (you don't need to add scopes manually here, the app does it).
5. **Important**: Under **Test Users**, add your own Gmail address so you can log in during testing.

## Step 4: Create Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
3. **Application Type**: Select **Web application**.
4. **Name**: `Local Dev`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:4173`
   - Your production URL (e.g., `https://maniraja5599.github.io`)
6. Click **Create**.

## Step 5: Copy to App
1. You will see a popup with **Your Client ID**.
2. Copy the long string ending in `.apps.googleusercontent.com`.
3. Open the `.env` file in your project folder.
4. Paste it like this:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
   ```
5. Restart the server (`npm run dev`) if it's running.

## Step 6: Deploying to GitHub Pages (Production)

To make it work on your live website (e.g., `https://maniraja5599.github.io/BoreInvoice`), follow these extra steps:

### 1. Add Authorized Origin
1. Go back to [Google Cloud Console](https://console.cloud.google.com/).
2. Go to **APIs & Services > Credentials**.
3. Click on your OAuth Client ID (e.g., "Local Dev" or "Web Client").
4. Under **Authorized JavaScript origins**, click **ADD URI**.
5. Add your GitHub Pages URL: `https://maniraja5599.github.io`
   > **Important**: Do NOT include `/BoreInvoice` or a trailing `/`. Google only accepts the domain.
6. Click **Save**.

### 2. Add Secret to GitHub
1. Go to your GitHub Repository page.
2. Click **Settings** (top bar).
3. In the sidebar, select **Secrets and variables > Actions**.
4. Click **New repository secret** (green button).
5. **Name**: `VITE_GOOGLE_CLIENT_ID`
6. **Secret**: Paste steps 5 (Your Client ID).
7. Click **Add secret**.

