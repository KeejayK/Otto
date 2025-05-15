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
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.idToken) {
    config.headers.Authorization = `Bearer ${authStore.idToken}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Calendar API
export const calendarApi = {
  getEvents: async () => {
    const res = await api.get('/calendar/events');
    return res.data;
  },
  createEvent: async (event) => {
    const res = await api.post('/calendar/add-event', event);
    return res.data;      // { htmlLink: '…' }
  },
  updateEvent: async (eventId, event) => {
    const res = await api.put(`/calendar/events/${eventId}`, event);
    return res.data;
  },
  deleteEvent: async (eventId) => {
    const res = await api.delete(`/calendar/delete-event/${eventId}`);
    return res.data;
  },
};

// Chat API
export const chatApi = {
  getHistory: async () => {
    const res = await api.get('/chat/history');
    return res.data;      // array of { id, message, role, timestamp }
  },
  sendMessage: async (message) => {
    const res = await api.post('/chat', { message });
    return { data: res.data };      // { message: 'Event created', calendarLink: '…', type }
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
