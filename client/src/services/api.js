import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Calendar API calls
export const calendarApi = {
  // Get events
  getEvents: async () => {
    const response = await api.get('/calendar/events');
    return response.data;
  },

  // Create event
  createEvent: async (event) => {
    const response = await api.post('/calendar/add-event', event);
    return response.data;
  },

  // Update event
  updateEvent: async (eventId, event) => {
    const response = await api.put(`/calendar/events/${eventId}`, event);
    return response.data;
  },

  // Delete event
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/calendar/delete-event/${eventId}`);
    return response.data;
  },
};

// Chat API calls
export const chatApi = {
  // Get chat history
  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },

  // Send message
  sendMessage: async (message) => {
    try {
      const response = await api.post('/chat', { message });
      return {
        data: {
          message: response.data.message,
          calendarLink: response.data.calendarLink,
        },
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

// Syllabus API calls
export const syllabusApi = {
  // Get all syllabi
  getSyllabi: async () => {
    const response = await api.get('/syllabus');
    return response.data;
  },

  // Get syllabus details
  getSyllabusDetails: async (id) => {
    const response = await api.get(`/syllabus/${id}`);
    return response.data;
  },

  // Parse syllabus text
  parseSyllabusText: async (syllabusText, courseName) => {
    const response = await api.post('/syllabus/parse', {
      text: syllabusText,
      courseName,
    });
    return response.data;
  },

  // Upload syllabus file
  uploadSyllabus: async (formData) => {
    const response = await api.post('/syllabus', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Add events from syllabus to calendar
  addToCalendar: async (syllabusId, eventIds) => {
    const response = await api.post(`/syllabus/${syllabusId}/events`, {
      eventIds,
    });
    return response.data;
  },
};

// Auth interceptor to add token to requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default {
  calendar: calendarApi,
  chat: chatApi,
  syllabus: syllabusApi,
  setAuthToken,
};
