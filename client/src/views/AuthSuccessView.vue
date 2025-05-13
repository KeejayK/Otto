<template>
  <div class="auth-success">
    <div class="loading-spinner"></div>
    <p>Logging you in...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // For demo purposes, just redirect to home after a short delay
  setTimeout(() => {
    router.replace('/');
  }, 1500);
});
</script>

<style scoped>
.auth-success {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 8rem);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

p {
  font-size: 1.25rem;
  color: #4a5568;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
