import { defineStore } from 'pinia';
import { loginWithGoogle } from '@/services/auth';
import { auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Add this at the top of the file with other imports
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// 
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    idToken: null,
    accessToken: null,
    calendarAccess: false,
  }),
  actions: {
    // Initialize the store and set up auth state listener
    async login() {
      const { idToken, accessToken, user } = await loginWithGoogle();
      this.user = user;
      this.idToken = idToken;
      this.accessToken = accessToken;

      // Send tokens to backend to verify and check calendar access
      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      // Update calendar access based on backend response
      if (response.ok) {
        const data = await response.json();
        this.calendarAccess = data.calendarAccess || false;
      }
    },

    // Request calendar access from the backend
    async requestCalendarAccess() {
      if (!this.user || this.calendarAccess) return;

      try {
        const response = await fetch(
          'http://localhost:3000/api/auth/calendar-access',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.idToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          this.calendarAccess = true;
        }
      } catch (error) {
        console.error('Failed to request calendar access:', error);
        throw error;
      }
    },

    // Logout the user and clear state
    async logout() {
      await signOut(auth);
      this.user = null;
      this.idToken = null;
      this.accessToken = null;
      this.calendarAccess = false;
    },

    // Retrieve the user profile
    getUserProfile() {
      return this.user;
    },

    // Check if the user is authenticated
    get isAuthenticated() {
      return !!this.user;
    },

    // Returns true if user has calendar access
    get hasCalendarAccess() {
      return this.calendarAccess;
    },

    // Initialize the store and set up auth state listener
    initialize() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user;
          this.idToken = await user.getIdToken();
          // Don't automatically request calendar access
          // Let components request it when needed
        } else {
          this.user = null;
          this.idToken = null;
          this.accessToken = null;
          this.calendarAccess = false;
        }
      });
    },
  },
});
