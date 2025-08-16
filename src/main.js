// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import googleLogin from 'vue3-google-login';

import './index.css';

const app = createApp(App);

app.use(router);

// Initialize Google Sign-In
app.use(googleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
});

app.mount('#app');
