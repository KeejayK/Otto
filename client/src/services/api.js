// For a real app, you would use axios or fetch to make API calls
// For this frontend demo, we'll simulate API responses

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock calendar events
const mockEvents = [
  {
    id: '1',
    summary: 'CSE 451 Lecture',
    description: 'Operating Systems lecture',
    start: {
      dateTime: '2025-04-29T10:30:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2025-04-29T11:20:00',
      timeZone: 'America/Los_Angeles',
    },
    location: 'CSE Building 105',
  },
  {
    id: '2',
    summary: 'Project Team Meeting',
    description: 'Weekly team meeting to discuss progress',
    start: {
      dateTime: '2025-04-30T14:00:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2025-04-30T16:00:00',
      timeZone: 'America/Los_Angeles',
    },
    location: 'Library Study Room 3',
  },
  {
    id: '3',
    summary: 'CSE 451 Project Deadline',
    description: 'Submit final project',
    start: {
      dateTime: '2025-05-02T23:59:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2025-05-02T23:59:00',
      timeZone: 'America/Los_Angeles',
    },
    location: '',
  },
];

// Function to add a Google Calendar event
export const addGoogleCalendarEvent = async (event) => {
  try {
    const response = await fetch('http://localhost:3000/add-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      throw new Error('Error creating event');
    }
    return await response.text();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Function to delete a Google Calendar event
export const deleteGoogleCalendarEvent = async (eventId) => {
  try {
    const response = await fetch(`http://localhost:3000/delete-event/${eventId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting event');
    }
    return await response.text();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Calendar API calls
export const calendarApi = {
  // Get events
  getEvents: async () => {
    await delay(500);
    return { data: mockEvents };
  },

  // Create event
  createEvent: async (event) => {
    await delay(500);
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9),
      ...event,
    };
    return { data: newEvent };
  },

  // Update event
  updateEvent: async (eventId, event) => {
    await delay(500);
    return { data: { id: eventId, ...event } };
  },

  // Delete event
  deleteEvent: async (eventId) => {
    await delay(500);
    return { data: { success: true } };
  },
};

// Mock chat history
const mockChatHistory = [
  {
    id: '1',
    message: 'Hello! How can I help you today?',
    role: 'assistant',
    timestamp: new Date('2025-04-29T09:00:00'),
  },
  {
    id: '2',
    message: 'I need to schedule a meeting with my project team',
    role: 'user',
    timestamp: new Date('2025-04-29T09:01:00'),
  },
  {
    id: '3',
    message:
      'I can help with that. When would you like to schedule the meeting?',
    role: 'assistant',
    timestamp: new Date('2025-04-29T09:01:30'),
  },
];

// Chat API calls
export const chatApi = {
  // Get chat history
  getHistory: async () => {
    await delay(500);
    return { data: mockChatHistory };
  },

  // Send message
  sendMessage: async (message) => {
    await delay(500);

    let response = "I'm sorry, I don't understand. Can you be more specific?";

    if (
      message.toLowerCase().includes('schedule') ||
      message.toLowerCase().includes('meeting')
    ) {
      response =
        'I can help you schedule a meeting. What day and time works for you?';
    } else if (
      message.toLowerCase().includes('deadline') ||
      message.toLowerCase().includes('due')
    ) {
      response =
        "I can help you set a deadline. What's the project and when is it due?";
    } else if (
      message.toLowerCase().includes('class') ||
      message.toLowerCase().includes('lecture')
    ) {
      response =
        'I can add your class schedule. What course are you taking and when does it meet?';
    }

    return { data: { message: response } };
  },
};

// Mock syllabi
const mockSyllabi = [
  {
    id: '1',
    courseName: 'CSE 451 - Operating Systems',
    fileName: 'CSE451_Syllabus.pdf',
    uploadedAt: new Date('2025-04-20T14:30:00'),
    processingStatus: 'completed',
    eventCount: 15,
  },
];

// Syllabus API calls
export const syllabusApi = {
  // Get all syllabi
  getSyllabi: async () => {
    await delay(500);
    return { data: mockSyllabi };
  },

  // Get syllabus details
  getSyllabusDetails: async (id) => {
    await delay(500);
    return {
      data: {
        ...mockSyllabi[0],
        content: 'Sample syllabus content for CSE 451 - Operating Systems...',
        parsedEvents: [
          {
            eventType: 'assignment',
            title: 'Assignment 1',
            description: 'Threading',
            dueDate: '2025-05-10',
            dueTime: '23:59',
            location: '',
          },
          {
            eventType: 'exam',
            title: 'Midterm Exam',
            description: 'Covers weeks 1-5',
            dueDate: '2025-05-20',
            dueTime: '14:30',
            location: 'CSE 101',
          },
          {
            eventType: 'project',
            title: 'Final Project',
            description: 'Implement a virtual memory system',
            dueDate: '2025-06-10',
            dueTime: '23:59',
            location: '',
          },
        ],
      },
    };
  },

  // Parse syllabus text
  parseSyllabusText: async (syllabusText, courseName) => {
    await delay(1500);
    return {
      data: {
        syllabusId: Math.random().toString(36).substring(2, 9),
        events: [
          {
            eventType: 'assignment',
            title: 'Assignment 1',
            description: 'Threading',
            dueDate: '2025-05-10',
            dueTime: '23:59',
            location: '',
          },
          {
            eventType: 'exam',
            title: 'Midterm Exam',
            description: 'Covers weeks 1-5',
            dueDate: '2025-05-20',
            dueTime: '14:30',
            location: 'CSE 101',
          },
        ],
      },
    };
  },

  // Upload syllabus file
  uploadSyllabus: async (formData) => {
    await delay(2000);
    return {
      data: {
        syllabusId: Math.random().toString(36).substring(2, 9),
        events: [
          {
            eventType: 'assignment',
            title: 'Assignment 1',
            description: 'Threading',
            dueDate: '2025-05-10',
            dueTime: '23:59',
            location: '',
          },
          {
            eventType: 'exam',
            title: 'Midterm Exam',
            description: 'Covers weeks 1-5',
            dueDate: '2025-05-20',
            dueTime: '14:30',
            location: 'CSE 101',
          },
        ],
      },
    };
  },

  // Add events from syllabus to calendar
  addToCalendar: async (syllabusId, eventIds) => {
    await delay(1000);
    return {
      data: {
        success: true,
        added: eventIds.length,
        failed: 0,
        events: eventIds.map((_, i) => ({
          original: {
            eventType: 'assignment',
            title: `Event ${i}`,
            dueDate: '2025-05-10',
          },
          googleEventId: Math.random().toString(36).substring(2, 9),
        })),
      },
    };
  },
};

export default {
  calendar: calendarApi,
  chat: chatApi,
  syllabus: syllabusApi,
};
