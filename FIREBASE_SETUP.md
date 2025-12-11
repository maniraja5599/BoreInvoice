# How to Set Up Firebase (Real-Time Sync)

We are switching to Firebase to give you **instant sync** and **persistent login**. Follow these steps to get your keys.

## Step 1: Create Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Create a project"** (or "Add project").
3. Name it `Borewell Invoice` and continue.
4. Disable Google Analytics (not needed) and click **Create Project**.

## Step 2: Enable Authentication (Login)
1. In the left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Select **Google** from the providers list.
4. Click **Enable**.
5. Select your support email.
6. Click **Save**.

## Step 3: Enable Firestore (Database)
1. In the left sidebar, click **Build > Firestore Database**.
2. Click **Create Database**.
3. Choose a location (e.g., `asia-south1` or `us-central1` - doesn't matter much).
4. **Important**: Start in **Test Mode**.
5. Click **Create**.

## Step 4: Get Configuration
1. Click the **Gear Icon** (Project Settings) next to "Project Overview" in the top left.
2. Scroll down to "Your apps" and click the **Web icon (`</>`)**.
3. App nickname: `Borewell Web`.
4. Click **Register app**.
5. You will see a code block with `firebaseConfig`. **Copy these values**:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Step 5: Update Your App
Open your `.env` file and paste them like this:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 6: Configure Deployment (GitHub)
For the app to work on your website (`https://maniraja5599.github.io`), you must add these keys to GitHub.

1. Go to your GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Add each of these 6 secrets (copy values from your `.env` or Firebase console):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Once added, the next deployment will pick them up automatically.
