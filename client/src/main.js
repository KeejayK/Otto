import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';


// Import global styles
import './style.css';

const app = createApp(App);

// Use Pinia for state management
app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

// Use Vue Router
app.use(router);

app.mount('#app');
