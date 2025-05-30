<template>
  <div class="login-root">
    <div class="login-left">
      <div class="login-card">
        <div class="login-logo">
          <img src="@/assets/logo.png" alt="Otto" />
        </div>
        <h1 class="login-title">Welcome to Otto</h1>
        <p class="login-subtitle">Your AI Calendar Assistant</p>
        <button class="login-button" :disabled="isLoading" @click="loginWithGoogle">
          <span v-if="isLoading" class="loading-spinner"></span>
          <img v-else src="@/assets/google-logo.svg" alt="Google" class="google-icon" />
          <span>{{ isLoading ? 'Signing in...' : 'Sign in with Google' }}</span>
        </button>
        <p class="login-info">
          Otto needs access to your Google Calendar to help you manage your schedule.
        </p>
        <div class="login-features">
          <div class="feature">
            <span class="feature-icon">📅</span>
            <span>Smart Scheduling</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🤖</span>
            <span>AI Powered</span>
          </div>
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <span>Time Saving</span>
          </div>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-hero-text">
        <div class="tagline">Otto AI</div>
        <h2>Smarter Scheduling Starts with Otto</h2>
        <p>Otto helps you create, organize, and experience your calendar like never before.</p>
        <div class="hero-benefits">
          <div class="benefit">
            <div class="benefit-dot"></div>
            <span>Intelligent event scheduling</span>
          </div>
          <div class="benefit">
            <div class="benefit-dot"></div>
            <span>Natural language processing</span>
          </div>
          <div class="benefit">
            <div class="benefit-dot"></div>
            <span>Seamless Google Calendar integration</span>
          </div>
        </div>
      </div>
      <div class="login-hero-img">
        <div class="img-wrapper">
          <img src="@/assets/calendar.png" alt="Calendar Image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(false);

const loginWithGoogle = async () => {
  isLoading.value = true;
  try {
    await authStore.login();
    router.push('/home');
  } catch (error) {
    console.error('Login error:', error);
    alert('Google Sign-In failed. Please try again.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-root {
  display: flex;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: linear-gradient(120deg, #f0f7ff 0%, #e6f0fd 100%);
}

.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #dbeeff 0%, #cfe4e4 100%);
  padding: 1rem 0;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10.5%);
  background-size: 20px 20px;
  opacity: 0.4;
  z-index: 1;
  transform: rotate(15deg);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 1.8rem 2rem 1.2rem 2rem;
  background: white;
  border-radius: 24px;
  box-shadow:
    0 12px 28px rgba(66, 153, 225, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
  border: 1px solid rgba(226, 232, 240, 0.8);
  position: relative;
  z-index: 2;
  animation: fadeIn 0.8s ease-out;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow:
    0 15px 35px rgba(66, 153, 225, 0.15),
    0 3px 10px rgba(0, 0, 0, 0.07);
  transform: translateY(-3px);
}

.login-logo {
  width: 100px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoFloat 3s infinite ease-in-out;
}

.login-logo img {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 2px 8px rgba(66, 153, 225, 0.2));
}

.login-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e40af;
  margin-bottom: 0.25rem;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.login-subtitle {
  color: #4a5568;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  font-weight: 500;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.95rem 1.5rem;
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
  margin-bottom: 1rem;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.login-button:disabled {
  background: linear-gradient(90deg, #64748b 0%, #94a3b8 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 6px rgba(100, 116, 139, 0.25);
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
  transform: translateY(-2px);
}

.login-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.login-button::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 100%;
  top: 0;
  left: -100px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: shimmer 2.5s infinite;
}

.google-icon {
  width: 1.5rem;
  height: 1.5rem;
  background: white;
  border-radius: 50%;
  padding: 0.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.login-info {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #64748b;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  box-shadow: inset 0 1px 2px rgba(66, 153, 225, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.login-features {
  display: flex;
  justify-content: space-around;
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.9rem;
  color: #64748b;
  gap: 0.5rem;
  transition: transform 0.15s ease;
}

.feature:hover {
  transform: translateY(-2px);
  color: #0369a1;
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
}

.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #e3e9f7 0%, #f0f9ff 100%);
  padding: 1rem 2rem;
  position: relative;
  overflow-y: auto;
}

.login-right::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}

.login-hero-text {
  max-width: 400px;
  margin-bottom: 0.8rem;
  text-align: left;
  position: relative;
  z-index: 2;
}

.tagline {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: rgba(14, 165, 233, 0.12);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.login-hero-text h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #0369a1;
  margin-bottom: 0.8rem;
  line-height: 1.2;
  letter-spacing: -0.5px;
  position: relative;
}

.login-hero-text p {
  color: #475569;
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.hero-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  color: #334155;
}

.benefit-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(90deg, #0284c7, #0ea5e9);
}

.login-hero-img {
  width: 320px;
  max-width: 90vw;
  margin: 1.5rem auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.img-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  box-shadow:
    0 10px 20px rgba(14, 165, 233, 0.12),
    0 5px 10px rgba(0, 0, 0, 0.06);
  transform: perspective(1000px) rotateY(1deg) rotateX(1deg);
  transition: all 0.5s ease;
}

.img-wrapper:hover {
  transform: perspective(1000px) rotateY(-1deg) rotateX(-1deg);
}

.login-hero-img img {
  width: 100%;
  border-radius: 12px;
  background: transparent;
  box-shadow: none;
  transition: transform 0.5s ease;
}

.login-hero-img img:hover {
  transform: scale(1.03);
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes shimmer {
  0% {
    left: -100px;
  }
  100% {
    left: 200%;
  }
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .login-hero-img {
    width: 280px;
  }
  
  .login-hero-text {
    max-width: 350px;
  }
}

@media (max-width: 900px) {
  .login-root {
    flex-direction: column;
  }
  
  .login-left, .login-right {
    flex: unset;
    width: 100%;
    min-height: auto;
    padding: 1.5rem 1rem;
    height: 50vh;
  }
  
  .login-hero-img {
    width: 220px;
    margin-top: 1rem;
  }
  
  .login-hero-text {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .benefit {
    justify-content: center;
  }
  
  .hero-benefits {
    align-items: center;
  }
  
  .login-card {
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .login-title {
    font-size: 1.5rem;
  }
  
  .login-hero-text h2 {
    font-size: 1.4rem;
  }
  
  .login-card {
    padding: 1.5rem 1.2rem;
  }
  
  .login-features {
    flex-direction: column;
    gap: 0.7rem;
  }
  
  .feature {
    flex-direction: row;
    gap: 0.5rem;
  }
  
  .login-hero-img {
    width: 200px;
  }
  
  .benefit {
    font-size: 0.85rem;
  }
}
</style>
