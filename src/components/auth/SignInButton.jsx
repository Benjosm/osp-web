import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import AppleSignin from 'apple-signin-react';
import { jwtDecode } from 'jwt-decode';
import './SignInButton.css';

const SignInButton = () => {
  const [provider, setProvider] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // Optional: for immediate UI access to user data

  // Google OAuth Login Hook
  // Function to send token to backend
  const sendTokenToBackend = async (provider, idToken) => {
    try {
      const response = await fetch('/api/v1/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, idToken }),
      });
  
      if (!response.ok) {
        let errorMessage = 'Invalid credentials or provider mismatch.';
        if (response.status === 400 || response.status === 401) {
          errorMessage = 'Invalid credentials or provider mismatch.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
      console.log('Authentication successful', data);
  
      // Store tokens in localStorage
      localStorage.setItem('auth.accessToken', data.accessToken);
      localStorage.setItem('auth.refreshToken', data.refreshToken);
  
      // Decode access token to extract user info
      const decoded = jwtDecode(data.accessToken);
      const { sub, email, exp } = decoded;
      console.log('Decoded user info:', { sub, email, exp });
  
      // Optionally store user info in state (could be replaced with context or Redux later)
      setUserInfo({ sub, email, exp });
  
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      // Handle network errors
      if (!navigator.onLine) {
        alert('Network error. Please check your connection and try again.');
      } else if (error.message.startsWith('HTTP error!')) {
        alert(error.message);
      } else {
        // Specific messages already handled for 400/401/500
        alert(error.message);
      }
  
      // Clear any sensitive temporary data
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
      // Clear idToken if stored temporarily (currently passed directly, so not stored)
      // This is a precaution in case future flow changes introduce temp storage
    }
  };
  
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google Login Success:', tokenResponse);
      if (tokenResponse.credential) {
        sendTokenToBackend('google', tokenResponse.credential);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
    },
    scope: process.env.REACT_APP_GOOGLE_SCOPES || 'email profile openid',
  });
  
  // Handle Apple Sign-In response
  const handleAppleSignIn = (response) => {
    console.log('Apple Sign-In Response:', response);
    if (response.authorization?.id_token) {
      sendTokenToBackend('apple', response.authorization.id_token);
    }
  };

  const handleProviderSelect = (selectedProvider) => {
    setProvider(selectedProvider);
    if (selectedProvider === 'google') {
      googleLogin();
    }
  };

  return (
    <div className="signin-container">
      {!provider ? (
        <div className="provider-select">
          <h3>Sign in with your social account</h3>
          <button
            className="signin-button google"
            onClick={() => handleProviderSelect('google')}
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </button>
          <AppleSignin
            authProps={{
              client_id: process.env.REACT_APP_APPLE_CLIENT_ID,
              redirect_uri: process.env.REACT_APP_APPLE_REDIRECT_URI,
              scope: process.env.REACT_APP_APPLE_SCOPES,
              response_mode: 'form_post',
            }}
            className="apple-signin-button"
            buttonStyle="white-outline"
            badge={false}
            showFullName
            onComplete={handleAppleSignIn}
            onError={(error) => console.error('Apple Sign-In Error:', error)}
          />
        </div>
      ) : null}
    </div>
  );
};

// Wrapper to provide Google OAuth Client ID
const SignInButtonWrapper = () => (
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
    <SignInButton />
  </GoogleOAuthProvider>
);

export default SignInButtonWrapper;
