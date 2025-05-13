import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { auth } from '@/firebase';

// Import views
import LoginView from '@/views/LoginView.vue';
import HomeView from '@/views/HomeView.vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const firebaseUser = auth.currentUser;

  if (to.meta.requiresAuth && !firebaseUser) {
    return next({ name: 'login' });
  }
  if (to.name === 'login' && firebaseUser) {
    return next({ name: 'home' });
  }

  next();
});

export default router;
