// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import SignInPage from '../pages/SignInPage.vue';
import MediaDetailPage from '../pages/MediaDetailPage.vue';
import AccountSettingsPage from '../pages/AccountSettingsPage.vue';

// This function replaces PrivateRoute. It's a "Navigation Guard".
const requireAuth = (to, from, next) => {
  if (!localStorage.getItem('token')) {
    // Redirect to sign-in page if not authenticated
    next({ name: 'SignIn', query: { redirect: to.fullPath } });
  } else {
    // Proceed to the route if authenticated
    next();
  }
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/signin',
    name: 'SignIn',
    component: SignInPage,
  },
  {
    path: '/media/:id', // The :id parameter is defined here
    name: 'MediaDetail',
    component: MediaDetailPage,
    props: true, // Automatically pass route params as props to the component
  },
  {
    path: '/account-settings',
    name: 'AccountSettings',
    component: AccountSettingsPage,
    beforeEnter: requireAuth, // This protects the route
  },
  // Catch-all route to redirect to Home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
