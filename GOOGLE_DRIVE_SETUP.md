# Google Drive Sync Setup

This application includes Google Drive sync functionality to backup and restore your data. Follow these steps to set it up:

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

## 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/google-auth-callback` (for development)
   - `https://yourdomain.com/google-auth-callback` (for production)
5. Copy the Client ID and Client Secret

## 3. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/google-auth-callback
```

## 4. How It Works

### Data Synced
- All invoices and quotations
- Customer data
- Slab rate configurations
- Service types and settings
- Application preferences

### Features
- **Sync to Drive**: Uploads all your data to a dedicated Google Drive folder
- **Sync from Drive**: Downloads and restores data from Google Drive
- **Automatic Backup**: Creates dated backup files
- **Secure**: Uses OAuth 2.0 for authentication
- **Cross-device**: Access your data from any device

### Usage
1. Go to Settings > Cloud Backup
2. Click "Sync to Drive" to backup your data
3. Click "Sync from Drive" to restore from backup
4. The app will create a folder called "Anjaneya Borewells Data" in your Google Drive

## 5. Security Notes

- Your data is stored in your personal Google Drive
- Only you have access to the backup files
- Authentication tokens are stored locally in your browser
- You can sign out at any time to revoke access

## 6. Troubleshooting

### Authentication Issues
- Make sure your redirect URI matches exactly
- Check that the Google Drive API is enabled
- Verify your client ID and secret are correct

### Sync Issues
- Ensure you have internet connection
- Check that you have sufficient Google Drive storage
- Try signing out and back in if sync fails

### Data Issues
- Always test with a small amount of data first
- Keep local backups before syncing
- The app creates dated backup files, so you can restore from specific dates
