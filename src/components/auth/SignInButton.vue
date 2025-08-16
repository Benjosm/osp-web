<!-- src/components/SignInButton.vue -->
<template>
  <div class="signin-container">
    <h3>Sign in with your social account</h3>
    <!-- Google Sign In -->
    <GoogleSignInButton @success="handleGoogleSuccess" @error="handleGoogleError" />
    
    <!-- Apple Sign In -->
    <button id="appleid-signin" class="apple-signin-button" @click.prevent></button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { GoogleSignInButton, decodeCredential } from "vue3-google-signin";

const router = useRouter();

const sendTokenToBackend = async (provider, idToken) => {
  try {
    const response = await fetch('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, idToken }),
    });

    if (!response.ok) throw new Error('Authentication failed.');
    
    const data = await response.json();
    localStorage.setItem('auth.accessToken', data.accessToken);
    localStorage.setItem('auth.refreshToken', data.refreshToken);

    router.push('/account-settings');
  } catch (error) {
    console.error('Backend sign-in error:', error);
    alert(error.message || 'An error occurred during sign-in.');
  }
};

// --- Google Handler ---
const handleGoogleSuccess = (response) => {
  const { credential } = response;
  console.log('Google credential:', credential);
  sendTokenToBackend('google', credential);
};

const handleGoogleError = (error) => {
  console.error("Google Sign-In Error", error);
};

// --- Apple Handler ---
onMounted(() => {
  // Dynamically load the Apple JS script
  const script = document.createElement('script');
  script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    // Configure Apple Sign In
    AppleID.auth.init({
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
      scope: 'name email',
      redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI,
      state: 'origin:web',
      usePopup: true,
    });

    // Add event listener to our button
    document.getElementById('appleid-signin').addEventListener('click', async () => {
      try {
        const data = await AppleID.auth.signIn();
        if (data.authorization?.id_token) {
          sendTokenToBackend('apple', data.authorization.id_token);
        }
      } catch (error) {
        console.error('Apple Sign-In Error:', error);
      }
    });
  };
});
</script>

<style scoped>
.signin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

.provider-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.signin-button {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.signin-button:hover {
  background-color: #f5f5f5;
}

.signin-button.google svg {
  width: 18px;
  height: 18px;
}

.apple-signin-button {
  width: 100% !important;
  margin: 0 !important;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background-color: white;
  color: #3c4043;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.apple-signin-button:hover {
  background-color: #f8f9fa;
  border-color: #c6c6c6;
}

.signin-button.google {
  border: 1px solid #dadce0;
  color: #3c4043;
  background-color: white;
}

.signin-button.google:hover {
  background-color: #f8f9fa;
  border-color: #c6c6c6;
}

</style>
