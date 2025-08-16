<template>
  <div class="signin-page">
    <div class="signin-panel">
      <div class="signin-header">
        <h2>Welcome Back</h2>
        <p>Sign in with one of the providers below.</p>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="social-signin-container">

        <GoogleLogin :callback="handleGoogleLoginSuccess">
          <button 
            class="social-button google-button"
            :disabled="loading"
          >
            <img src="../assets/icons/google_logo.svg" alt="Google logo" class="icon" />
            <span>Sign in with Google</span>
          </button>
        </GoogleLogin>

        <div class="separator"><span>OR</span></div>

        <!-- Apple Sign In -->
        <button
          id="appleid-signin-button"
          class="social-button apple-button"
          @click="handleAppleSignIn"
          :disabled="loading"
        >
          <img src="../assets/icons/apple_logo_white.svg" alt="Apple logo" class="icon" />
          <span>Sign in with Apple</span>
        </button>
      </div>
      
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Signing in, please wait...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../services/apiClient';

const router = useRouter();
const loading = ref(false);
const error = ref(null);

const sendTokenToBackend = async (provider, idToken) => {
  loading.value = true;
  error.value = null;
  try {
    // Use the new apiClient
    const data = await apiClient.post('/auth/signin', { 
      provider, 
      token: idToken
    });

    // Store tokens using the keys our apiClient expects
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);

    router.push('/');
  } catch (err) {
    console.error('Backend sign-in error:', err);
    // err.data.detail is where FastAPI often puts the error message
    error.value = err.data?.detail || err.message || 'Authentication failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

// --- Google Handler ---
// This function is the callback for the <GoogleLogin> component
const handleGoogleLoginSuccess = (response) => {
  const { code } = response;
  if (code) {
    // The credential is the idToken (JWT) your backend expects
    sendTokenToBackend('google', code);
  } else {
    // The component's promise might also catch errors, but this is a fallback.
    handleGoogleLoginError(response);
  }
};

const handleGoogleLoginError = (errorResponse) => {
  error.value = "Google sign-in failed. Please try again.";
  console.error("Google Sign-In Error:", errorResponse);
};

// --- Apple Handler ---
const handleAppleSignIn = async () => {
  if (loading.value) return;
  if (typeof AppleID === 'undefined') {
      error.value = "Apple Sign-In is not available. Please try again later.";
      return;
  }
  try {
    const data = await AppleID.auth.signIn();
    if (data.authorization?.id_token) {
      sendTokenToBackend('apple', data.authorization.id_token);
    }
  } catch (err) {
    console.error('Apple Sign-In Error:', err);
    error.value = "An error occurred with Apple Sign-In. Please try again.";
  }
};

onMounted(() => {
  // Apple Sign-In initialization
  if (document.getElementById('apple-auth-script')) return;
  const script = document.createElement('script');
  script.id = 'apple-auth-script';
  script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    try {
      AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI,
        state: 'origin:web',
        usePopup: true,
      });
    } catch (e) {
      console.error("Failed to initialize AppleID Auth:", e);
    }
  };
  document.head.appendChild(script);
});
</script>

<style scoped>
.signin-page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

.signin-panel {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  box-sizing: border-box;
}

.signin-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #1c1e21;
}

.signin-header p {
  margin: 0 0 32px;
  font-size: 16px;
  color: #606770;
}

.social-signin-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.social-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: background-color 0.2s, border-color 0.2s, opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
  border-radius: 6px;
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.apple-button {
  background-color: #000000;
  color: #ffffff;
  border: 1px solid #000000;
}

.apple-button:hover:not(:disabled) {
  background-color: #333333;
  border-color: #333333;
}

.google-button {
  background-color: #ffffff;
  color: #3c4043;
  border: 1px solid #d0d5d9;
}

.google-button:hover:not(:disabled) {
  background-color: #f5f6f7;
  border-color: #b0b5b9;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
  color: #a0a0a0;
  margin: 8px 0;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.separator span {
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
}

.error-message {
  padding: 12px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
  font-size: 14px;
  margin-bottom: 24px;
  text-align: center;
}

.loading-indicator {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #606770;
}

.loading-indicator p {
  margin: 0;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f0f2f5;
  border-top: 3px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .signin-panel {
    padding: 32px 24px;
    margin: 0;
    border-radius: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .signin-header h2 {
    font-size: 24px;
  }
}
</style>
