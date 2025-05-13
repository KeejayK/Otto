import { defineStore } from 'pinia';
import { loginWithGoogle } from '@/services/auth';
import { auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    idToken: null,
    accessToken: null,
  }),
  actions: {
    async login() {
      const { idToken, accessToken, user } = await loginWithGoogle();
      this.user = user;
      this.idToken = idToken;
      this.accessToken = accessToken;

      await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.idToken = null;
      this.accessToken = null;
    },

    getUserProfile() {
      return this.user;
    },

    get isAuthenticated() {
      return !!this.user;
    },

    initialize() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user;
          this.idToken = await user.getIdToken();
        } else {
          this.user = null;
          this.idToken = null;
          this.accessToken = null;
        }
      });
    },
  },
});
