// client/src/stores/auth.js

import { defineStore } from 'pinia';
import { loginWithGoogle } from '@/services/auth';
import { auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { processGooglePhotoUrl } from '@/utils/profileHelper';

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
    userProfile: null,
    isAuthInitialized: false, // Indicates if onAuthStateChanged has completed its first run
    isAuthenticated: false, // Make this a direct state property
  }),
  actions: {
    // Initialize the store and set up auth state listener
    async login() {
      const { idToken, accessToken, user } = await loginWithGoogle();
      this.user = user;
      this.idToken = idToken;
      this.accessToken = accessToken;
      this.isAuthenticated = !!user; // Set directly after login

      if (user) {
        this.userProfile = {
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: processGooglePhotoUrl(user.photoURL),
          uid: user.uid,
        };
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/google`, {
      // Send tokens to backend to verify and check calendar access
      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          profile: this.userProfile,
        }),
      });

      // Update calendar access based on backend response
      if (response.ok) {
        const data = await response.json();
        this.calendarAccess = data.calendarAccess || false;
      }
      this.isAuthInitialized = true;
    },

    // Request calendar access from the backend
    async requestCalendarAccess() {
      if (!this.user || this.calendarAccess) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/calendar-access`,
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
      this.userProfile = null;
      this.isAuthenticated = false; // Set directly after logout
      this.isAuthInitialized = true;
    },

    // Retrieve the user profile
    getUserProfile() {
      return this.userProfile || this.user;
    },

    refreshProfilePhoto() {
      if (this.user && this.user.photoURL) {
        if (this.userProfile) {
          this.userProfile.photoURL = processGooglePhotoUrl(this.user.photoURL);
        } else {
          this.userProfile = {
            displayName: this.user.displayName || '',
            email: this.user.email || '',
            photoURL: processGooglePhotoUrl(this.user.photoURL),
            uid: this.user.uid,
          };
        }
      }
      return this.userProfile?.photoURL;
    },

    async refreshToken() {
      if (this.user) {
        try {
          this.idToken = await this.user.getIdToken(true);
          this.refreshProfilePhoto();
          return true;
        } catch (error) {
          console.error('Error refreshing token:', error);
          return false;
        }
      }
      return false;
    },

    async reloadUserProfile() {
      if (this.user) {
        try {
          await this.user.reload();
          if (this.user.photoURL) {
            this.userProfile = {
              ...this.userProfile,
              displayName: this.user.displayName || this.userProfile?.displayName || '',
              email: this.user.email || this.userProfile?.email || '',
              photoURL: processGooglePhotoUrl(this.user.photoURL),
            };
          }
          return true;
        } catch (error) {
          console.error('Error reloading user profile:', error);
          return false;
        }
      }
      return false;
    },

    // Remove the getter, it's now a state property
    // get isAuthenticated() {
    //   return !!this.user;
    // },

    // Returns true if user has calendar access
    get hasCalendarAccess() {
      return this.calendarAccess;
    },

    // Initialize the store and set up auth state listener
    initialize() {
      console.log('[AuthStore] initialize() called');
      onAuthStateChanged(auth, async (user) => {
        console.log('[AuthStore] onAuthStateChanged →', user);
        if (user) {
          this.user = user;
          this.idToken = await user.getIdToken();

          this.userProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: processGooglePhotoUrl(user.photoURL),
            uid: user.uid,
          };
          // Set isAuthenticated directly
          this.isAuthenticated = true; // Set this AFTER this.user is assigned
          console.log('[AuthStore] signed in as:', this.userProfile);
          console.log(`[AuthStore] isAuthenticated set to: ${this.isAuthenticated}`); // Log to confirm
        } else {
          console.log('[AuthStore] no user currently signed in');
          this.user = null;
          this.idToken = null;
          this.accessToken = null;
          this.calendarAccess = false;
          this.userProfile = null;
          // Set isAuthenticated directly
          this.isAuthenticated = false;
        }
        // Always set isAuthInitialized to true after onAuthStateChanged has run
        this.isAuthInitialized = true;
        console.log(`[AuthStore] isAuthInitialized set to: ${this.isAuthInitialized}`);
      });
    },
  },
});