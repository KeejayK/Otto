<template>
  <div class="app-container">
    <header v-if="!isLoginPage" class="app-header">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Otto" />
      </div>
      <div v-if="isLoggedIn" class="user-profile">
        <div ref="profileDropdownRef" class="profile-container" @click="toggleDropdown">
          <span class="user-name">{{ userName }}</span>
          <img
            :src="userPhoto"
            alt="Profile"
            class="avatar"
            @error="handleAvatarError"
          />
          <span class="dropdown-arrow" :class="{ 'dropdown-arrow-open': isDropdownOpen }">▼</span>
          
          <!-- Dropdown menu -->
          <div v-if="isDropdownOpen" class="profile-dropdown">
            <div class="dropdown-item" @click="logout">
              <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main" :class="{ 'no-header': isLoginPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import defaultAvatar from '@/assets/default-avatar.svg';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.isAuthenticated);
const isLoginPage = computed(() => route.name === 'login');
const userName = computed(() => {
  const profile = authStore.getUserProfile();
  return profile?.displayName || 'User';
});
const userPhoto = computed(() => {
  // Use refreshProfilePhoto to ensure we have the correctly formatted photo URL
  const photoURL = authStore.refreshProfilePhoto();
  return photoURL || defaultAvatar;
});

onMounted(async () => {
  // Check if user is already logged in
  authStore.initialize();
  
  // After a short delay, reload the user profile to ensure we have the latest data
  setTimeout(async () => {
    if (authStore.isAuthenticated) {
      await authStore.reloadUserProfile();
    }
  }, 1500);
});

const isDropdownOpen = ref(false);
const profileDropdownRef = ref(null);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Function to handle avatar image load errors
const handleAvatarError = (event) => {
  console.warn('Avatar image failed to load:', event);
  
  // Use default avatar when Google photo fails to load
  event.target.src = defaultAvatar;
  
  // Try to reload the user profile after a short delay
  if (authStore.isAuthenticated) {
    setTimeout(() => authStore.reloadUserProfile(), 500);
  }
};

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
    if (profileDropdownRef.value && !profileDropdownRef.value.contains(event.target)) {
      isDropdownOpen.value = false;
    }
  });
});

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style>
/* App styles */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-gray-50);
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
  padding: 0.5rem 2rem;
  background-color: white;
  box-shadow: var(--shadow-md);
  height: 4rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo img {
  height: 2.8rem;
  transition: transform 0.3s ease;
}

.logo img:hover {
  transform: scale(1.05);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.user-name {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.profile-container:hover .user-name {
  color: var(--color-primary);
}

.avatar {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: var(--border-radius-full);
  object-fit: cover;
  border: 2px solid var(--color-gray-200);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.profile-container:hover .avatar {
  border-color: var(--color-primary-light);
  transform: scale(1.05);
}

/* Styles for logout button removed as it's now part of the dropdown */

.app-main {
  flex: 1;
  padding: 1.25rem;
  background: linear-gradient(145deg, var(--color-gray-50) 0%, var(--color-gray-100) 100%);
}

.app-main.no-header {
  padding-top: 0;
}

/* Global button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(120deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-outline {
  background-color: white;
  color: var(--color-primary);
  border: 1px solid var(--color-primary-light);
}

.btn-outline:hover {
  background-color: var(--color-gray-50);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Profile Dropdown Styles */
.profile-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-gray-100);
  border: 1px solid transparent;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.profile-container:hover {
  background-color: var(--color-gray-200);
  border-color: var(--color-primary-light);
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: var(--color-gray-500);
  transition: transform 0.2s ease;
  margin-left: 0.1rem;
}

.dropdown-arrow-open {
  transform: rotate(180deg);
  color: var(--color-primary);
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.75rem;
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  width: 200px;
  z-index: 100;
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  animation: dropdownFadeIn 0.2s ease-out;
  animation: dropdown-fade 0.2s ease-out;
  border: 1px solid #e2e8f0;
}

.dropdown-item {
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  color: var(--color-gray-700);
  font-weight: 500;
  font-size: 0.95rem;
  position: relative;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, var(--color-gray-100) 0%, white 100%);
  color: var(--color-primary);
}

.dropdown-item:active {
  transform: scale(0.98);
}

.dropdown-icon {
  width: 18px;
  height: 18px;
  color: var(--color-gray-500);
  transition: all 0.2s ease;
}

.dropdown-item:hover .dropdown-icon {
  color: var(--color-primary);
  transform: translateX(2px);
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
