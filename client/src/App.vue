<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Otto" />
      </div>
      <!-- <div v-if="isLoggedIn" class="user-profile">
        <span class="user-name">{{ userName }}</span>
        <img
          :src="userPhoto || '@/assets/default-avatar.svg'"
          alt="Profile"
          class="avatar"
        />
      </div> -->
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.isAuthenticated);
const userName = computed(
  () => authStore.getUserProfile?.displayName || 'User',
);
const userPhoto = computed(() => authStore.getUserProfile?.photoURL);

onMounted(async () => {
  // Check if user is already logged in
  await authStore.initialize();
});

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style>
/* Reset styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: #333;
  background-color: #f5f7fa;
}

/* Main layout */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.logo img {
  height: 8rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-weight: 500;
  color: #4a5568;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.logout-btn {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  color: #4299e1;
}

.app-main {
  flex: 1;
  padding: 2rem;
}

/* Global button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4299e1;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #3182ce;
}

.btn-outline {
  background-color: white;
  color: #4299e1;
  border: 1px solid #4299e1;
}

.btn-outline:hover {
  background-color: #ebf8ff;
}
</style>
