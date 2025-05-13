<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <img src="@/assets/logo.png" alt="Otto" />
      </div>

      <h1 class="login-title">Welcome to Otto</h1>
      <p class="login-subtitle">Your AI Calendar Assistant</p>

      <button @click="loginWithGoogle" class="login-button">
        <img src="@/assets/google-logo.svg" alt="Google" class="google-icon" />
        Sign in with Google
      </button>

      <p class="login-info">
        Otto needs access to your Google Calendar to help you manage your
        schedule.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router    = useRouter();
const authStore = useAuthStore();

const loginWithGoogle = async () => {
  try {
    await authStore.login();
    router.push('/home');
  } catch (error) {
    console.error('Login error:', error);
    alert('Google Sign-In failed. Please try again.');
  }
};
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 15px rgba(0, 0, 0, 0.03);
  text-align: center;
}

.login-logo {
  width: 120px;
  margin: 0 auto 2rem;
}

.login-logo img {
  width: 100%;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #718096;
  margin-bottom: 2.5rem;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.login-button:hover {
  background-color: #f7fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
}

.login-info {
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #718096;
}
</style>
