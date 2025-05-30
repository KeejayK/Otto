import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the Firebase ID token on every request
api.interceptors.request.use(async (config) => {
  const authStore = useAuthStore();

  // Debug logs for Google sign-in issues
  console.log('[API] isAuthenticated:', authStore.isAuthenticated);
  console.log('[API] idToken:', authStore.idToken ? '[present]' : '[missing]');

  // If there's a valid ID token, use it
  if (authStore.idToken) {
    config.headers.Authorization = `Bearer ${authStore.idToken}`;
  } else if (authStore.isAuthenticated) {
    // If authenticated but no token, try to refresh it
    try {
      await authStore.refreshToken();
      console.log('[API] Token refreshed:', authStore.idToken ? '[present]' : '[still missing]');
      if (authStore.idToken) {
        config.headers.Authorization = `Bearer ${authStore.idToken}`;
      } else {
        console.warn('[API] Authenticated but no idToken after refresh.');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
    }
  } else {
    console.warn('[API] Not authenticated, no token attached.');
  }

  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      // If we're getting 401s and we think we're logged in, log out
      console.warn('[API] 401 Unauthorized. isAuthenticated:', authStore.isAuthenticated);
      if (authStore.isAuthenticated) {
        authStore.logout();
        console.log('Session expired. Please sign in again.');
      }
    }
    return Promise.reject(error);
  },
);

// Calendar API
export const calendarApi = {
  createEvent: async (event) => {
    const res = await api.post('/calendar/add-event', event);
    return res.data; // { htmlLink: '…' }
  },
  updateEvent: async (eventId, event) => {
    const res = await api.put(`/calendar/modify-event`, { eventId, ...event });
    return res.data;
  },
  deleteEvent: async (eventId) => {
    const res = await api.delete(`/calendar/delete-event/${eventId}`);
    return res.data;
  },
  listEvents: async () => {
    const res = await api.get('/calendar/list-events');
    return res.data;
  },
};

// Chat API
export const chatApi = {
  getHistory: async () => {
    try {
      const res = await api.get('/chat/history');
      return res.data; // array of { id, message, role, timestamp }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return []; // Return empty array on error for graceful degradation
    }
  },
  clearHistory: async () => {
    try {
      const res = await api.delete('/chat/history');
      return res.data; // { message: 'Chat history cleared successfully' }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },
  sendMessage: async (message, context = []) => {
    try {
      const res = await api.post('/chat', { 
        message,
        context: context.slice(-5) // Send last 5 messages for context
      });
      return { data: res.data }; // { message: 'Event created', calendarLink: '…', type }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error.response?.status === 401) {
        return {
          data: {
            message: 'You need to sign in to perform this action.',
            type: 'auth_required'
          }
        };
      }
      throw error;
    }
  },
};

// Syllabus API
export const syllabusApi = {
  getSyllabi: async () => {
    const res = await api.get('/syllabus');
    return res.data;
  },
  getSyllabusDetails: async (id) => {
    const res = await api.get(`/syllabus/${id}`);
    return res.data;
  },
  parseSyllabusText: async (text, courseName) => {
    const res = await api.post('/syllabus/parse', { text, courseName });
    return res.data;
  },
  uploadSyllabus: async (formData) => {
    const res = await api.post('/syllabus', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  addToCalendar: async (syllabusId, eventIds) => {
    const res = await api.post(`/syllabus/${syllabusId}/events`, { eventIds });
    return res.data;
  },
};

export default {
  calendar: calendarApi,
  chat: chatApi,
  syllabus: syllabusApi,
};