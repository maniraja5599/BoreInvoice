import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAuthCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error
          }, window.location.origin);
        }
        window.close();
        return;
      }

      if (code) {
        // Send the authorization code back to the parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_CODE',
            code: code
          }, window.location.origin);
        }
        window.close();
      } else {
        // No code and no error, might be a direct access
        console.log('No authorization code found');
        window.close();
      }
    };

    handleAuthCallback();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-500">
            <svg className="animate-spin h-12 w-12" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authenticating with Google
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete the authentication process...
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
