<template>
  <div class="home-container">
    <div class="chat-panel">
      <div class="panel-header">
        <h2 class="panel-title">otto</h2>
        <div class="panel-actions">
          <div v-if="!authStore.isAuthenticated" class="auth-status">
            <button class="signin-button" @click="navigateToLogin">Sign In</button>
          </div>
        </div>
      </div>

      <div ref="chatHistoryRef" class="chat-history">
        <div
          v-for="(message, index) in chatMessages"
          :key="index"
          :class="[
            'chat-message',
            message.role === 'user'
              ? 'user-message'
              : message.role === 'system'
                ? 'system-message'
                : 'bot-message',
          ]"
        >
          <template v-if="message.role === 'assistant'">
            <VueMarkdownIt :source="message.content" @click.native="handleMarkdownLinkClick" />
            <!-- Confirmation buttons for event operations -->
            <div v-if="isConfirmationMessage(message.content)" class="confirmation-buttons">
              <button class="confirm-btn" @click="handleConfirmation(true)">
                <span class="button-icon">✅</span>
                Confirm
              </button>
              <button class="cancel-btn" @click="handleConfirmation(false)">
                <span class="button-icon">❌</span>
                Cancel
              </button>
            </div>
          </template>
          <template v-else>
            {{ message.content }}
          </template>
        </div>
         
        <!-- In-chat Form: Add Recurring Event -->
        <div v-if="showInChatForm && currentAction === 'Add recurring event'" class="chat-message bot-message in-chat-form">
          <h4>Add Recurring Event</h4>
          <div class="chat-form">
            <div class="form-group">
              <label for="eventName">Event Name:</label>
              <input
                id="eventName"
                v-model="formData.eventName"
                type="text"
                placeholder="Enter event name"
                class="form-control"
                required
              />
            </div>
            
            <div class="form-group">
              <label>Days:</label>
              <div class="days-selector">
                <label v-for="(label, day) in weekDays" :key="day" class="day-checkbox">
                  <input
                    v-model="formData.daysOfWeek[day]"
                    type="checkbox"
                  />
                  <span>{{ label }}</span>
                </label>
              </div>
            </div>
            
            <div class="form-group form-row">
              <div>
                <label>Time:</label>
                <div class="time-input-group">
                  <input
                    id="startTime"
                    v-model="formData.startTime"
                    type="time"
                    class="form-control"
                  />
                  <span>to</span>
                  <input
                    id="endTime"
                    v-model="formData.endTime"
                    type="time"
                    class="form-control"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group form-row">
              <div>
                <label>Start Date:</label>
                <input
                  id="startDate"
                  v-model="formData.startDate"
                  type="date"
                  class="form-control"
                />
              </div>
              <div>
                <label>End Date:</label>
                <input
                  id="endDate"
                  v-model="formData.endDate"
                  type="date"
                  class="form-control"
                />
              </div>
            </div>
            
            <div class="form-actions">
              <button class="form-cancel-btn" @click="cancelInChatForm">Cancel</button>
              <button class="form-submit-btn" @click="submitForm">Create Event</button>
            </div>
          </div>
        </div>
        
        <!-- In-chat Form: Change Event -->
        <div v-if="showInChatForm && currentAction === 'Change current event'" class="chat-message bot-message in-chat-form">
          <h4>Change Event</h4>
          <div class="chat-form">
            <div class="form-group">
              <label for="eventName">Event Name:</label>
              <input
                id="eventName"
                v-model="formData.eventName"
                type="text"
                placeholder="Name of event to change"
                class="form-control"
                required
              />
            </div>
            
            <div class="form-group form-row">
              <div>
                <label for="startDate">New Date:</label>
                <input
                  id="startDate"
                  v-model="formData.startDate"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
              
              <div>
                <label>New Time:</label>
                <div class="time-input-group">
                  <input
                    id="startTime"
                    v-model="formData.startTime"
                    type="time"
                    class="form-control"
                  />
                  <span>to</span>
                  <input
                    id="endTime"
                    v-model="formData.endTime"
                    type="time"
                    class="form-control"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="location">New Location (optional):</label>
              <input
                id="location"
                v-model="formData.location"
                type="text"
                placeholder="Enter location"
                class="form-control"
              />
            </div>
            
            <div class="form-actions">
              <button class="form-cancel-btn" @click="cancelInChatForm">Cancel</button>
              <button class="form-submit-btn" @click="submitForm">Update Event</button>
            </div>
          </div>
        </div>
        
        <div v-if="isLoading" class="chat-message bot-message thinking">
          <span class="dot-animation"></span>
        </div>
      </div>
      
      <!-- Action Panel -->
      <div class="action-panel">
        <button class="action-pill" @click="handleQuickAction('See events this week')">
          <span class="pill-icon">📅</span>
          <span>Events this week</span>
        </button>
        <button class="action-pill" @click="openInChatForm('Add recurring event')">
          <span class="pill-icon">🔁</span>
          <span>Add recurring</span>
        </button>
        <button class="action-pill clear-history" :disabled="isClearing" @click="clearChatHistory">
          <span class="pill-icon">🗑️</span>
          <span>{{ isClearing ? 'Clearing...' : 'Clear Chat' }}</span>
        </button>
      </div>
      
      <!-- Quick Actions Menu removed as requested -->
      
      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <input
            v-model="userMessage"
            type="text"
            placeholder="Message Otto"
            class="chat-input"
            :disabled="isLoading"
            @keydown.enter="sendMessage"
          />
        </div>
        <button class="send-button" :disabled="isLoading" @click="sendMessage">
          {{ isLoading ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </div>

    <div v-if="!authStore.isAuthenticated" class="calendar-placeholder">
      <div class="auth-prompt">
        <h3>Please sign in to access your calendar</h3>
        <p>Sign in with your Google account to view and manage your calendar events.</p>
        <button class="signin-button-large" @click="navigateToLogin">Sign In with Google</button>
      </div>
    </div>
    <div v-else-if="calendarUrl" class="calendar-wrapper">
      <iframe
        ref="calendarIframe"
        :key="iframeKey"
        :src="calendarUrl"
        style="border: 0"
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { chatApi } from '@/services/api'; // Import the existing chatApi
import { useRouter } from 'vue-router';
import VueMarkdownIt from 'vue3-markdown-it';


const router = useRouter();
const authStore = useAuthStore();
const chatHistoryRef = ref(null);
const userMessage = ref('');
const chatMessages = ref([]);
const iframeKey = ref(0);
const isLoading = ref(false);
const isClearing = ref(false);

// In-chat form state
const showInChatForm = ref(false);
const currentAction = ref('');
const activeFormId = ref(null);
const formData = ref({
  eventName: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  daysOfWeek: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  },
  description: ''
});

// Compute calendar URL based on user's email
const calendarUrl = computed(() => {
  if (!authStore.user?.email) return null;

  const encodedEmail = encodeURIComponent(authStore.user.email);
  
  return `https://calendar.google.com/calendar/embed?src=${encodedEmail}&wkst=1&bgcolor=%23ffffff&ctz=America%2FLos_Angeles&mode=WEEK&showPrint=0&showNav=1&showTitle=0&showCalendars=0&showTz=1`;
});

// Function to check if a message is requesting confirmation
const isConfirmationMessage = (message) => {
  return message && (
    message.includes('Please confirm:') ||
    message.includes('**Please confirm:**') ||
    message.includes('Confirm the following event:')
  );
};

// Handle confirmation button clicks
const handleConfirmation = (isConfirmed) => {
  if (isConfirmed) {
    // For event deletion, we want to avoid showing "yes" in the chat
    // Check if the message contains a delete confirmation
    const lastMessage = chatMessages.value[chatMessages.value.length - 1]?.content || '';
    const isDeleteConfirmation = lastMessage.includes('delete') || lastMessage.includes('Delete');
    
    if (isDeleteConfirmation) {
      // Don't show "yes" in the chat, just send it to the server
      userMessage.value = 'yes';
      
      // Skip adding the user message to the chat in sendMessage
      showInChatForm.value = true; // Trick sendMessage into not showing user input
      sendMessage();
      showInChatForm.value = false; // Reset after sending
    } else {
      // For other confirmations, use the normal flow
      userMessage.value = 'yes';
      sendMessage();
    }
  } else {
    // Send 'no' as user message
    userMessage.value = 'no';
    sendMessage();
  }
};

// Redirect to login page
const navigateToLogin = () => {
  router.push('/login');
};

// Send message function
const sendMessage = async () => {
  if (!userMessage.value.trim() || isLoading.value) return;

  const messageText = userMessage.value;
  userMessage.value = '';
  isLoading.value = true;

  // Add user message to chat only if we're not handling a form submission
  // (for forms, we already added the nicely formatted user message)
  if (!showInChatForm.value) {
    chatMessages.value.push({
      role: 'user',
      content: messageText,
    });
  }

  // Scroll as soon as user sends a message
  await scrollToBottom();

  try {
    const response = await chatApi.sendMessage(messageText);
    console.log('Response from chatApi:', response);

    // Handle authentication requirements
    if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message + " Would you like to sign in now?",
      });
      
      // Add sign-in prompt as system message
      chatMessages.value.push({
        role: 'system',
        content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
      });
    } else {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message,
      });

      // once event is pushed, refresh calendar iframe
      if (['create', 'update', 'delete'].includes(response.data.type)) {
        iframeKey.value += 1;
        await nextTick();
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    chatMessages.value.push({
      role: 'system',
      content: 'Sorry, I encountered an error. Please try again.',
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// Send delete command without showing the technical message to the user
const sendDeleteCommand = async (eventId) => {
  isLoading.value = true;
  
  // Add a user message that's more user-friendly
  chatMessages.value.push({
    role: 'user',
    content: 'Delete this event',
  });
  
  // Scroll down to show the message
  await scrollToBottom();
  
  try {
    // Send the delete command directly to the API
    const response = await chatApi.sendMessage(`Delete event with ID ${eventId}`);
    console.log('Response from chatApi:', response);
    
    // Add the bot's response to the chat
    chatMessages.value.push({
      role: 'assistant',
      content: response.data.message,
    });
    
    // Scroll down to show the response
    await scrollToBottom();
  } catch (error) {
    console.error('Error in sendDeleteCommand:', error);
    chatMessages.value.push({
      role: 'system',
      content: 'Sorry, there was an error processing your request.',
    });
  } finally {
    isLoading.value = false;
  }
};

// Days of the week mapping
const weekDays = {
  monday: 'M',
  tuesday: 'T',
  wednesday: 'W',
  thursday: 'T',
  friday: 'F',
  saturday: 'S',
  sunday: 'S'
};

// Get form title based on current action
const getFormTitle = () => {
  return currentAction.value;
};

// Open in-chat form
const openInChatForm = (action) => {
  currentAction.value = action;
  showInChatForm.value = true;
  
  // Add assistant message prompting for the form
  let formPrompt = "";
  if (action === "Add new event") {
    formPrompt = "Please fill out the details for your new event:";
  } else if (action === "Add recurring event") {
    formPrompt = "Let's set up your recurring event. Please fill out the details:";
  } else if (action === "Change current event") {
    formPrompt = "Please provide the name of the event you'd like to change and the new details:";
  }
  
  chatMessages.value.push({
    role: 'assistant',
    content: formPrompt
  });
  
  // Reset form data with defaults for easier entry
  formData.value = {
    eventName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    daysOfWeek: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    description: ''
  };
  
  // Scroll to show the form
  nextTick(() => {
    scrollToBottom();
  });
};

// Cancel in-chat form
const cancelInChatForm = () => {
  showInChatForm.value = false;
  chatMessages.value.push({
    role: 'assistant',
    content: "Form canceled. How else can I help you today?"
  });
};

// Submit form data
const submitForm = () => {
  if (!formData.value.eventName) {
    // Add validation message in chat instead of alert
    chatMessages.value.push({
      role: 'system',
      content: 'Please enter an event name to continue.'
    });
    scrollToBottom();
    return;
  }
  
  let prompt = '';
  let userPromptDisplay = ''; // This is what will be shown as user message
  
  if (currentAction.value === 'Add recurring event') {
    // Build prompt for recurring event
    const selectedDays = Object.entries(formData.value.daysOfWeek)
      .filter(([_, selected]) => selected)
      .map(([day]) => day);
    
    if (selectedDays.length === 0) {
      // Add validation message in chat
      chatMessages.value.push({
        role: 'system',
        content: 'Please select at least one day of the week.'
      });
      scrollToBottom();
      return;
    }
    
    // Map selected days to RRULE format (MO, TU, WE, etc.)
    const dayMap = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };
    
    // Convert selected days to BYDAY values for RRULE
    const byDayValues = selectedDays.map(day => dayMap[day.toLowerCase()]);
    
    // Format the end date in RRULE format (YYYYMMDD)
    const untilDate = formData.value.endDate.replace(/-/g, '');
    
    // Create an RRULE string for Google Calendar
    const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDayValues.join(',')};UNTIL=${untilDate}T235959Z`;
    
    const daysStr = selectedDays.join(', ');
    prompt = `Add a recurring event called "${formData.value.eventName}" on ${daysStr} from ${formData.value.startTime} to ${formData.value.endTime} starting from ${formData.value.startDate} until ${formData.value.endDate} with recurrence rule ${rrule}`;
    
    // Simplified display for user message
    userPromptDisplay = `Add recurring event: "${formData.value.eventName}" on ${daysStr}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.description) {
      prompt += ` with description "${formData.value.description}"`;
    }
  } else if (currentAction.value === 'Add new event') {
    // Build prompt for single event
    prompt = `Add an event called "${formData.value.eventName}" on ${formData.value.startDate} from ${formData.value.startTime} to ${formData.value.endTime}`;
    
    // Simplified display for user message
    userPromptDisplay = `Add event: "${formData.value.eventName}" on ${formData.value.startDate}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.location) {
      prompt += ` at ${formData.value.location}`;
      userPromptDisplay += ` at ${formData.value.location}`;
    }
    
    if (formData.value.description) {
      prompt += ` with description "${formData.value.description}"`;
    }
  } else if (currentAction.value === 'Change current event') {
    // For changing events, we need the event name and new details
    prompt = `Change the event "${formData.value.eventName}" to ${formData.value.startDate} from ${formData.value.startTime} to ${formData.value.endTime}`;
    
    // Simplified display for user message
    userPromptDisplay = `Change event: "${formData.value.eventName}" to ${formData.value.startDate}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.location) {
      prompt += ` at ${formData.value.location}`;
      userPromptDisplay += ` at ${formData.value.location}`;
    }
  }
  
  // Hide the form
  showInChatForm.value = false;
  
  // Display the simplified command as user message
  chatMessages.value.push({
    role: 'user',
    content: userPromptDisplay
  });
  
  // For recurring events, construct proper recurrence rules
  if (currentAction.value === 'Add recurring event') {
    try {
      // Map selected days to RRULE format (MO, TU, WE, etc.)
      const dayMap = {
        monday: 'MO',
        tuesday: 'TU',
        wednesday: 'WE',
        thursday: 'TH',
        friday: 'FR',
        saturday: 'SA',
        sunday: 'SU'
      };
      
      const selectedDays = Object.entries(formData.value.daysOfWeek)
        .filter(([_, selected]) => selected)
        .map(([day]) => day);
        
      // Convert selected days to BYDAY values for RRULE
      const byDayValues = selectedDays.map(day => dayMap[day.toLowerCase()]);
      
      // Format the end date in RRULE format (YYYYMMDD)
      const untilDate = formData.value.endDate.replace(/-/g, '');
      
      // Create the RRULE string for Google Calendar
      const recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${byDayValues.join(',')};UNTIL=${untilDate}T235959Z`;
      
      // Add recurrence information to the prompt
      prompt += ` with recurrence rule "${recurrenceRule}"`;
    } catch (e) {
      console.error('Error processing recurring event:', e);
    }
  }
  
  // Send the detailed command to the API
  userMessage.value = prompt;
  sendMessage();
};

// Handle quick action button clicks
const handleQuickAction = (action) => {
  if (action === 'See events this week') {
    // Set message and send to API
    userMessage.value = action;
    sendMessage();
  } else if (action === 'Add new event' || action === 'Add recurring event') {
    openInChatForm(action);
  } else {
    chatMessages.value.push({
      role: 'user',
      content: action
    });
    
    userMessage.value = action;
    sendMessage();
  }
};

// Scroll chat to bottom
const scrollToBottom = async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
};

// Function to clear chat history
const clearChatHistory = async () => {
  try {
    isClearing.value = true;
    await chatApi.clearHistory();
    chatMessages.value = [{
      role: 'assistant',
      content: "Chat history has been cleared. How can I help you today?",
    }];
    scrollToBottom();
  } catch (error) {
    console.error('Error clearing chat history:', error);
    chatMessages.value.push({
      role: 'system',
      content: 'Failed to clear chat history. Please try again.',
    });
  } finally {
    isClearing.value = false;
  }
};

// Handle markdown link clicks for event actions
const handleMarkdownLinkClick = (event) => {
  // Check if the click was on a link or its child element (like the icon)
  let target = event.target;
  // If we clicked on an icon or span inside the link, traverse up to find the link
  while (target && target.tagName !== 'A' && target.parentElement) {
    target = target.parentElement;
  }
  
  if (target && target.tagName === 'A') {
    const href = target.getAttribute('href');
    
    // Check if this is a command link
    if (href && href.startsWith('command:')) {
      event.preventDefault();
      const [command, action, eventId] = href.split(':');
      
      if (action === 'edit') {
        // Open edit form for the event
        openInChatForm('Change current event');
        formData.value.eventName = target.dataset.eventName || '';
        userMessage.value = `Change event with ID ${eventId}`;
      } else if (action === 'delete') {
        // Send delete command without showing it to the user
        sendDeleteCommand(eventId);
      }
    }
  }
};

// Watch for auth state changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    // Reload the calendar when user authenticates
    iframeKey.value += 1;
  }
});

onMounted(() => {
  console.log('HomeView mounted');
  chatMessages.value.push({
    role: 'assistant',
    content:
      "Hi there! I'm Otto, your calendar assistant. How can I help you today?",
  });
  scrollToBottom();
});
</script>

<style scoped>
.home-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  height: 100vh;
  width: 100%;
  max-height: 100vh;
  overflow: hidden;
  padding: 1rem;
  box-sizing: border-box;
}

/* Confirmation Button Styles */
.confirmation-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.confirm-btn, .cancel-btn {
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-icon {
  font-size: 16px;
}

.confirm-btn {
  background-color: #4285f4;
  color: white;
}

.confirm-btn:hover {
  background-color: #3b78e7;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.cancel-btn {
  background-color: #f1f3f4;
  color: #5f6368;
}

.cancel-btn:hover {
  background-color: #e8eaed;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.confirm-btn:active, .cancel-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Form Modal Styles */
.form-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
}

.form-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.form-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row > div {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="date"],
input[type="time"],
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus,
textarea:focus {
  border-color: #4a85f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(74, 133, 246, 0.2);
}

.days-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-checkbox {
  display: inline-flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  user-select: none;
}

.day-checkbox input {
  margin-right: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.5rem;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.submit-btn {
  background-color: #4a85f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.submit-btn:hover {
  background-color: #3b76e1;
}

.cancel-btn:hover {
  background-color: #e5e5e5;
}

.calendar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f7fafc;
  color: #718096;
  font-size: 1.1rem;
}

.auth-prompt {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 80%;
}

.auth-prompt h3 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.signin-button-large {
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.2s;
}

.signin-button-large:hover {
  background-color: #3367D6;
}

.auth-status {
  display: flex;
  align-items: center;
}

.signin-button {
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.signin-button:hover {
  background-color: #3367D6;
}

.calendar-wrapper {
  height: 100%;
  width: 100%;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 2rem);
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-panel {
  display: flex;
  justify-content: right;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #edf2f7;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f7fafc;
  color: #3182ce;
  border-color: #bee3f8;
}

.action-pill.clear-history {
  background-color: #fff5f5;
  color: #e53e3e;
  border-color: #fed7d7;
}

.action-pill.clear-history:hover:not([disabled]) {
  background-color: #fed7d7;
}

.action-pill.clear-history[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.pill-icon {
  font-size: 0.9rem;
  display: inline-block;
  margin-right: 2px;
}

/* Toggle icon removed as no longer needed */

/* Quick actions menu styles removed as they are no longer needed */

.chat-history {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: calc(100% - 200px);
  scroll-behavior: smooth;
}

.chat-message {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  max-width: 80%;
  word-break: break-word;
  line-height: 1.5;
  animation: fadeIn 0.3s ease-out;
}

.thinking {
  padding: 0.5rem 1rem;
}

.dot-animation {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 16px;
}

.dot-animation::before {
  content: '...';
  display: inline-block;
  animation: dotAnimation 1.5s infinite;
  font-size: 20px;
  letter-spacing: 2px;
}

@keyframes dotAnimation {
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
  100% { content: '.'; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  align-self: flex-end;
  background-color: #4299e1;
  color: white;
  border-bottom-right-radius: 4px;
}

.bot-message {
  align-self: flex-start;
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #edf2f7;
  border-bottom-left-radius: 4px;
  font-size: 1rem; /* Set base font size for all content in bot messages */
}

/* Global rule to ensure ALL elements within bot messages have consistent font size */
.bot-message * {
  font-size: 1rem;
}

.system-message {
  align-self: center;
  background-color: #f7fafc;
  color: #718096;
  border: 1px dashed #e2e8f0;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.chat-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #edf2f7;
  background-color: white;
}

.chat-input-wrapper {
  display: flex;
  flex: 1;
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.2s;
}

.chat-input-wrapper:focus-within {
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  outline: none;
  color: #2d3748;
}

.chat-input::placeholder {
  color: #a0aec0;
}

.send-button {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
}

.send-button:hover:not([disabled]) {
  background-color: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(66, 153, 225, 0.4);
}

.send-button:active:not([disabled]) {
  transform: translateY(0);
}

.send-button[disabled] {
  background-color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
}

.calendar-panel {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 2rem);
}

/* Unified consistent styles for event list - all font sizes set to 1rem for consistency */
.bot-message h2 {
  margin-top: 0;
  color: #2d3748;
  font-size: 1.1rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.bot-message h3 {
  color: #4a5568;
  font-size: 1rem;
  margin-top: 2.5rem;
  margin-bottom: 1.2rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.bot-message ul {
  margin-top: 0.5rem;
  margin-left: 0;
  padding-left: 0;
  list-style-type: none;
  border-bottom: 1px solid #f5f5f5;
}

.bot-message li {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f5f5f5;
  line-height: 1.5;
  font-size: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  padding-left: 0.5rem;
}

/* Make events appear as a single line with consistent font */
.bot-message li strong {
  font-weight: 600;
  color: #2d3748;
  margin-right: 1.5rem;
  font-size: 1rem;
}

/* Ensure all text content has consistent font size */
.bot-message li *:not(a) {
  font-size: 1rem !important;
}

/* Style the day number and abbreviation to match the image */
.bot-message h3 {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
}

/* Style day numbers to be prominent */
.bot-message h3::first-letter {
  font-size: 1.2rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

/* Target vue3-markdown-it rendered content */
.bot-message .vue3-markdown-it p,
.bot-message .vue3-markdown-it span,
.bot-message .vue3-markdown-it a,
.bot-message .vue3-markdown-it strong,
.bot-message .vue3-markdown-it em,
.bot-message .vue3-markdown-it code {
  font-size: 1rem !important;
}

/* Specifically target any elements that might be used for dates and times */
.bot-message time,
.bot-message .time,
.bot-message .date {
  font-size: 1rem !important;
}

/* Event spacing similar to the calendar view */
.bot-message li {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

/* Button styling for event actions */
.bot-message a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  color: #3182ce;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 28px;
  height: 28px;
  text-align: center;
  position: relative;
}

.bot-message a:hover {
  background-color: #f0f4f8;
  transform: translateY(-1px);
}

/* Delete button styling */
.bot-message a[href^="command:delete"] {
  color: #e53e3e;
}

.bot-message a[href^="command:delete"]:hover {
  background-color: #fff5f5;
}

/* Edit button styling */
.bot-message a[href^="command:edit"] {
  color: #3182ce;
}

.bot-message a[href^="command:edit"]:hover {
  background-color: #ebf8ff;
}

/* Action icon button styles */
.action-icon {
  font-size: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 28px;
  height: 28px;
}

/* Tooltip styling */
.tooltip {
  position: relative;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
}

.tooltip:hover::after {
  opacity: 1;
  visibility: visible;
}

/* Event action buttons container */
.event-actions {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  gap: 0.25rem;
}
</style>