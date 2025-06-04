import { defineStore } from 'pinia';
import { loginWithGoogle } from '@/services/auth';
import { auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { processGooglePhotoUrl } from '@/utils/profileHelper';

// Add this at the top of the file with other imports
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    idToken: null,
    accessToken: null,
    calendarAccess: false,
    userProfile: null, // Add userProfile to store user's name and picture
  }),
  actions: {
    async login() {
      const { idToken, accessToken, user } = await loginWithGoogle();
      this.user = user;
      this.idToken = idToken;
      this.accessToken = accessToken;
      
      // Extract and save the user profile information
      if (user) {
        this.userProfile = {
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: processGooglePhotoUrl(user.photoURL),
          uid: user.uid
        };
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/google`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken,
          profile: this.userProfile // Send profile info to the server
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.calendarAccess = data.calendarAccess || false;
      }
    },

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

    async logout() {
      await signOut(auth);
      this.user = null;
      this.idToken = null;
      this.accessToken = null;
      this.calendarAccess = false;
      this.userProfile = null;
    },

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
            uid: this.user.uid
          };
        }
      }
      return this.userProfile?.photoURL;
    },
    
    async refreshToken() {
      // If we have a user but need to refresh the ID token
      if (this.user) {
        try {
          this.idToken = await this.user.getIdToken(true);
          
          // Also refresh the profile photo URL while we're at it
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
      // Force a refresh of the user data from Firebase
      if (this.user) {
        try {
          await this.user.reload();
          
          // Update the userProfile with fresh data
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

    get isAuthenticated() {
      return !!this.user;
    },

    get hasCalendarAccess() {
      return this.calendarAccess;
    },

    initialize() {
      console.log('[AuthStore] initialize() called');
      onAuthStateChanged(auth, async (user) => {
        console.log('[AuthStore] onAuthStateChanged →', user);
        if (user) {
          this.user = user;
          // Ensure idToken is fetched before proceeding
          this.idToken = await user.getIdToken();

          // Store user profile information when session is initialized
          this.userProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: processGooglePhotoUrl(user.photoURL),
            uid: user.uid,
          };

          console.log('[AuthStore] signed in as:', this.userProfile);
        } else {
          console.log('[AuthStore] no user currently signed in');
          this.user = null;
          this.idToken = null;
          this.accessToken = null;
          this.calendarAccess = false;
          this.userProfile = null;
        }
      });
    },
  },
});
