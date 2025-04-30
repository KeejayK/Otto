import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // For demo purposes, we'll simulate an authenticated user
  const user = ref({
    uid: '123456',
    displayName: 'Charlie Brown',
    email: 'charlie@example.com',
    photoURL: '' // Placeholder for user photo URL
  })
  
  const loading = ref(false)
  const error = ref(null)

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)

  // Get user profile
  const getUserProfile = computed(() => {
    if (!user.value) return null
    
    return {
      uid: user.value.uid,
      displayName: user.value.displayName,
      email: user.value.email,
      photoURL: user.value.photoURL
    }
  })

  // Initialize auth state - in a real app, this would check Firebase auth
  const initialize = async () => {
    // Simulate loading
    loading.value = true
    
    try {
      // In a real app, this would check if user is already logged in
      // with Firebase or another auth provider
      
      // For demo, we'll just use our simulated user
      // No change to user ref needed
      
      return user.value
    } catch (err) {
      error.value = 'Authentication error'
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  // Login - in a real app, this would use Firebase or another auth provider
  const login = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Simulate login success
      // No change to user ref needed as we're already "logged in"
      
      return user.value
    } catch (err) {
      error.value = 'Login failed'
      throw new Error('Login failed')
    } finally {
      loading.value = false
    }
  }

  // Logout - in a real app, this would use Firebase or another auth provider
  const logout = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Simulate logout
      // In a real app, this would sign out from Firebase
      // For demo purposes, we'll keep the user logged in
      
      // user.value = null
      
      return true
    } catch (err) {
      error.value = 'Logout failed'
      throw new Error('Logout failed')
    } finally {
      loading.value = false
    }
  }

  // Get ID token for API calls
  const getIdToken = async () => {
    // In a real app, this would return the Firebase ID token
    return 'demo-token-123456'
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    getUserProfile,
    initialize,
    login,
    logout,
    getIdToken
  }
})