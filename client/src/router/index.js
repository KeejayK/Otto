import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { auth } from '@/firebase';

// Import views
import LoginView from '@/views/LoginView.vue';
import HomeView from '@/views/HomeView.vue';

// Define application routes
const routes = [
  {
    path: '/',
    redirect: '/login', // Redirect root to login
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView, // Loign view
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView, // Home view
    meta: { requiresAuth: true }, // Requires authentication
  },
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication status
router.beforeEach((to, from, next) => {
  const firebaseUser = auth.currentUser; // Get the current Firebase user

  // If the route requires authentication and the user is not logged in, redirect to login
  if (to.meta.requiresAuth && !firebaseUser) {
    return next({ name: 'login' });
  }
  // If the user is logged in and tries to access the login page, redirect to home
  if (to.name === 'login' && firebaseUser) {
    return next({ name: 'home' });
  }

  // Otherwise, proceed to the requested route
  next();
});

export default router; // Export the router instance
