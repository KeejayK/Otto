<!-- src/views/HomeView.vue -->
<template>
  <div class="home-container">
    <div class="chat-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span>Otto</span>
        </div>
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
                Confirm
              </button>
              <button class="cancel-btn" @click="handleConfirmation(false)">
                Cancel
              </button>
            </div>
          </template>
          <template v-else>
            {{ message.content }}
          </template>
        </div>
         
        <!-- In-chat Form: Add Recurring Event -->
        <div v-if="showInChatForm && currentAction === 'Add recurring event'" class="chat-message bot-message in-chat-form compact-form">
          <h4>Add Recurring Event</h4>
          <div class="chat-form">
            <div class="form-group compact">
              <label for="eventName">Event Name</label>
              <input
                id="eventName"
                v-model="formData.eventName"
                type="text"
                placeholder="Enter event name"
                class="form-control"
                required
              />
            </div>
            
            <div class="days-time-container">
              <div class="form-group days-group compact">
                <label>Repeat on</label>
                <div class="days-selector compact">
                  <label v-for="(label, day) in weekDays" :key="day" class="day-checkbox compact">
                    <input
                      v-model="formData.daysOfWeek[day]"
                      type="checkbox"
                    />
                    <span>{{ label }}</span>
                  </label>
                </div>
              </div>
              
              <div class="form-group time-group compact">
                <label>Time</label>
                <div class="time-input-group compact">
                  <input
                    id="startTime"
                    v-model="formData.startTime"
                    type="time"
                    class="form-control time-input"
                  />
                  <span class="time-separator">to</span>
                  <input
                    id="endTime"
                    v-model="formData.endTime"
                    type="time"
                    class="form-control time-input"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group date-range compact">
              <div class="date-from-to">
                <div>
                  <label for="startDate">From</label>
                  <input
                    id="startDate"
                    v-model="formData.startDate"
                    type="date"
                    class="form-control date-input"
                  />
                </div>
                <div>
                  <label for="endDate">Until</label>
                  <input
                    id="endDate"
                    v-model="formData.endDate"
                    type="date"
                    class="form-control date-input"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-actions compact">
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
      
      <!-- Chat input area -->
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

    <!-- If not authenticated, ask them to sign in -->
    <div v-if="!authStore.isAuthenticated" class="calendar-placeholder">
      <div class="auth-prompt">
        <h3>Please sign in to access your calendar</h3>
        <p>Sign in with your Google account to view and manage your calendar events.</p>
        <button class="signin-button-large" @click="navigateToLogin">Sign In with Google</button>
      </div>
    </div>

    <!-- If signed in but no calendarAccess yet, show a “Grant Access” button -->
    <div
      v-else-if="authStore.isAuthenticated && !authStore.hasCalendarAccess"
      class="calendar-placeholder"
    >
      <div class="auth-prompt">
        <h3>Grant Calendar Access</h3>
        <p>Otto needs permission to read your Google Calendar. Please grant access below.</p>
        <button class="signin-button-large" @click="onGrantCalendarAccess">
          Grant Google Calendar Access
        </button>
      </div>
    </div>

    <!-- Once calendarAccess is true, embed the calendar iframe -->
    <div v-else-if="authStore.hasCalendarAccess" class="calendar-wrapper">
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
import { ref, onMounted, nextTick, computed, watch, watchEffect } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { chatApi, calendarApi } from '@/services/api'; // ← import calendarApi here
import { useRouter } from 'vue-router';
import VueMarkdownIt from 'vue3-markdown-it';

const router = useRouter();
const authStore = useAuthStore();
const chatHistoryRef = ref(null);
const userMessage = ref('');
const chatMessages = ref([]);
const iframeKey = ref(0);
const isLoading = ref(false);

// In-chat form state
const showInChatForm = ref(false);
const currentAction = ref('');
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

// Optional: If you want to inspect events returned by calendarApi.listEvents()
const events = ref([]);

// Compute calendar URL based on user's email
const calendarUrl = computed(() => {
  const profile = authStore.getUserProfile();
  if (!profile?.email) return null;
  const encodedEmail = encodeURIComponent(profile.email);
  // Adjust ctz (timezone) or mode if you like
  return `https://calendar.google.com/calendar/embed?src=${encodedEmail}&wkst=1&bgcolor=%23ffffff&ctz=America%2FLos_Angeles&mode=WEEK&showPrint=0&showNav=1&showTitle=0&showCalendars=0&showTz=1`;
});

watchEffect(() => {
  console.log('calendarUrl →', calendarUrl.value);
});

// When the component mounts, if we already have calendarAccess, load events now
onMounted(() => {
  console.log('HomeView mounted');
  chatMessages.value.push({
    role: 'assistant',
    content:
      "Hi there! I'm Otto, your calendar assistant. How can I help you today?",
  });
  scrollToBottom();

  if (authStore.hasCalendarAccess) {
    _loadCalendarEvents();
  }
});

// Whenever calendarAccess flips from false→true, fetch events and bump the iframe
watch(
  () => authStore.hasCalendarAccess,
  (newVal) => {
    if (newVal) {
      console.log('[HomeView] calendarAccess granted → loading events & reloading iframe');
      _loadCalendarEvents();
      iframeKey.value += 1;
    }
  }
);

// Reload iframe if user just signed in (so that calendar picks up the new session)
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated && authStore.hasCalendarAccess) {
      iframeKey.value += 1;
    }
  }
);

/**
 * Helper: actually call calendarApi.listEvents()
 * so you can see the GET /calendar/v3/… calls in your network tab.
 * (We store results in `events` just so you can inspect them if desired.)
 */
async function _loadCalendarEvents() {
  try {
    const data = await calendarApi.listEvents();
    console.log('[HomeView] calendarApi.listEvents() →', data);
    // If your backend returns { items: [...] }, store them; otherwise keep data directly:
    events.value = data.items || data;
  } catch (err) {
    console.error('[HomeView] Error loading calendar events:', err);
  }
}


// Redirect to login page
const navigateToLogin = () => {
  router.push('/login');
};

// Called when user clicks “Grant Google Calendar Access”
async function onGrantCalendarAccess() {
  try {
    await authStore.requestCalendarAccess();
    // Once requestCalendarAccess() resolves, authStore.calendarAccess → true,
    // the watcher above (→ _loadCalendarEvents + iframeKey++) will run.
  } catch (err) {
    console.error('[HomeView] Failed to get calendar access:', err);
  }
}


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
  const messageText = isConfirmed ? 'Confirm' : 'Cancel';
  const lastMessage = chatMessages.value[chatMessages.value.length - 1]?.content || '';
  const isDeleteConfirmation = lastMessage.includes('delete') || lastMessage.includes('Delete');
  
  // For deletion confirmations, don't show “yes” in chat
  if (!(isConfirmed && isDeleteConfirmation)) {
    chatMessages.value.push({
      role: 'user',
      content: messageText,
    });
  }
  
  isLoading.value = true;
  
  chatApi.sendMessage(messageText)
    .then(response => {
      console.log('Response from chatApi:', response);
      if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
        chatMessages.value.push({
          role: 'assistant',
          content: response.data.message + " Would you like to sign in now?",
        });
        chatMessages.value.push({
          role: 'system',
          content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
        });
      } else {
        chatMessages.value.push({
          role: 'assistant',
          content: response.data.message,
        });
        if (['create', 'update', 'delete'].includes(response.data.type)) {
          iframeKey.value += 1;
        }
      }
    })
    .catch(error => {
      console.error('Error sending confirmation:', error);
      chatMessages.value.push({
        role: 'system',
        content: 'Sorry, I encountered an error processing your confirmation. Please try again.',
      });
    })
    .finally(() => {
      isLoading.value = false;
      scrollToBottom();
    });
};

// Send message function
const sendMessage = async () => {
  if (!userMessage.value.trim() || isLoading.value) return;

  const messageText = userMessage.value;
  userMessage.value = '';
  isLoading.value = true;

  chatMessages.value.push({
    role: 'user',
    content: messageText,
  });

  // Scroll immediately after user message
  await scrollToBottom();

  try {
    const response = await chatApi.sendMessage(messageText);
    console.log('Response from chatApi:', response);

    if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message + " Would you like to sign in now?",
      });
      chatMessages.value.push({
        role: 'system',
        content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
      });
    } else {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message,
      });

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
  
  await scrollToBottom();
  
  try {
    const messageText = `Delete event with ID ${eventId}`;
    const response = await chatApi.sendMessage(messageText);
    console.log('Response from chatApi:', response);
    
    chatMessages.value.push({
      role: 'assistant',
      content: response.data.message,
    });
    
    if (response.data.type === 'delete') {
      iframeKey.value += 1;
      await nextTick();
    }
    
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

// Open in-chat form
const openInChatForm = (action) => {
  currentAction.value = action;
  showInChatForm.value = true;
  
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
  
  formData.value = {
    eventName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
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
  
  nextTick(scrollToBottom);
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
const submitForm = async () => {
  if (!formData.value.eventName) {
    chatMessages.value.push({
      role: 'system',
      content: 'Please enter an event name to continue.'
    });
    scrollToBottom();
    return;
  }
  
  let prompt = '';
  let userPromptDisplay = '';
  
  if (currentAction.value === 'Add recurring event') {
    const selectedDays = Object.entries(formData.value.daysOfWeek)
      .filter(([_, selected]) => selected)
      .map(([day]) => day);
    
    if (selectedDays.length === 0) {
      chatMessages.value.push({
        role: 'system',
        content: 'Please select at least one day of the week.'
      });
      scrollToBottom();
      return;
    }
    
    const dayMap = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };
    const byDayValues = selectedDays.map(day => dayMap[day.toLowerCase()]);
    const untilDate = formData.value.endDate.replace(/-/g, '');
    const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDayValues.join(',')};UNTIL=${untilDate}T235959Z`;
    
    const daysStr = selectedDays.join(', ');
    prompt = `Add a recurring event called "${formData.value.eventName}" on ${daysStr} from ${formData.value.startTime} to ${formData.value.endTime} starting from ${formData.value.startDate} until ${formData.value.endDate}`;
    userPromptDisplay = `Add recurring event: "${formData.value.eventName}" on ${daysStr}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.description) {
      prompt += ` with description "${formData.value.description}"`;
    }
    prompt += ` with recurrence ${rrule}`;
  }
  else if (currentAction.value === 'Add new event') {
    prompt = `Add an event called "${formData.value.eventName}" on ${formData.value.startDate} from ${formData.value.startTime} to ${formData.value.endTime}`;
    userPromptDisplay = `Add event: "${formData.value.eventName}" on ${formData.value.startDate}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.location) {
      prompt += ` at ${formData.value.location}`;
      userPromptDisplay += ` at ${formData.value.location}`;
    }
    if (formData.value.description) {
      prompt += ` with description "${formData.value.description}"`;
    }
  }
  else if (currentAction.value === 'Change current event') {
    prompt = `Change the event "${formData.value.eventName}" to ${formData.value.startDate} from ${formData.value.startTime} to ${formData.value.endTime}`;
    userPromptDisplay = `Change event: "${formData.value.eventName}" to ${formData.value.startDate}, ${formData.value.startTime}-${formData.value.endTime}`;
    
    if (formData.value.location) {
      prompt += ` at ${formData.value.location}`;
      userPromptDisplay += ` at ${formData.value.location}`;
    }
  }
  
  showInChatForm.value = false;
  chatMessages.value.push({
    role: 'user',
    content: userPromptDisplay
  });
  
  const messageText = prompt;
  isLoading.value = true;

  try {
    const response = await chatApi.sendMessage(messageText);
    console.log('Response from chatApi:', response);

    if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message + " Would you like to sign in now?",
      });
      chatMessages.value.push({
        role: 'system',
        content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
      });
    } else {
      chatMessages.value.push({
        role: 'assistant',
        content: response.data.message,
      });

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
    await scrollToBottom();
  }
};

// Handle quick action button clicks
const handleQuickAction = (action) => {
  if (action === 'See events this week') {
    chatMessages.value.push({
      role: 'user',
      content: action
    });
    
    const messageText = action;
    isLoading.value = true;
    
    chatApi.sendMessage(messageText)
      .then((response) => {
        console.log('Response from chatApi:', response);
        if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.message + " Would you like to sign in now?",
          });
          chatMessages.value.push({
            role: 'system',
            content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
          });
        } else {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.message,
          });
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        chatMessages.value.push({
          role: 'system',
          content: 'Sorry, I encountered an error. Please try again.',
        });
      })
      .finally(() => {
        isLoading.value = false;
        scrollToBottom();
      });
  } else if (action === 'Add new event' || action === 'Add recurring event') {
    openInChatForm(action);
  } else {
    chatMessages.value.push({
      role: 'user',
      content: action
    });
    
    const messageText = action;
    isLoading.value = true;
    
    chatApi.sendMessage(messageText)
      .then(response => {
        console.log('Response from chatApi:', response);
        
        if (response.data.type === 'auth_required' && !authStore.isAuthenticated) {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.message + " Would you like to sign in now?",
          });
          chatMessages.value.push({
            role: 'system',
            content: 'You need to be signed in to use calendar features. Click the Sign In button at the top to continue.',
          });
        } else {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.message,
          });
          if (['create', 'update', 'delete'].includes(response.data.type)) {
            iframeKey.value += 1;
          }
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        chatMessages.value.push({
          role: 'system',
          content: 'Sorry, I encountered an error. Please try again.',
        });
      })
      .finally(() => {
        isLoading.value = false;
        scrollToBottom();
      });
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
  let target = event.target;
  while (target && target.tagName !== 'A' && target.parentElement) {
    target = target.parentElement;
  }
  
  if (target && target.tagName === 'A') {
    const href = target.getAttribute('href');
    if (href && href.startsWith('command:')) {
      event.preventDefault();
      const [command, action, eventId] = href.split(':');
      
      if (action === 'edit') {
        openInChatForm('Change current event');
        formData.value.eventName = target.dataset.eventName || '';
        userMessage.value = `Change event with ID ${eventId}`;
      } else if (action === 'delete') {
        sendDeleteCommand(eventId);
      }
    }
  }
};
</script>

<style scoped>
.home-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.25rem;
  height: calc(100vh - 4rem);
  width: 100%;
  max-height: calc(100vh - 4rem);
  overflow: hidden;
  padding: 1rem;
  box-sizing: border-box;
  background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-gray-100) 100%);
}

/* Confirmation Button Styles */
.confirmation-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.confirm-btn, .cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirm-btn {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.confirm-btn:hover {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
  transform: translateY(-2px);
}

.cancel-btn:hover {
  background-color: #e5e5e5;
  color: #333;
  transform: translateY(-2px);
}

.confirm-btn:active, .cancel-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Form Modal Styles */
/* (Unchanged from before) */  
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
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(66, 153, 225, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(90deg, #f5f7fa 0%, #e3e9f7 100%);
  border-bottom: 1px solid #e0e0e0;
  border-radius: 16px 16px 0 0;
}

.form-header h3 {
  margin: 0;
  color: #1e40af;
  font-weight: 700;
  font-size: 1.25rem;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #0ea5e9;
  transform: rotate(90deg);
}

.form-body {
  padding: 0.9rem;
}

.form-group {
  margin-bottom: 0.8rem;
}

.form-row {
  display: flex;
  gap: 1.25rem;
}

.form-row > div {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 600;
  color: #334155;
  font-size: 0.85rem;
}

input[type="text"],
input[type="date"],
input[type="time"],
textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus {
  border-color: #0ea5e9;
  outline: none;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.days-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0.5rem;
}

.day-checkbox {
  display: inline-flex;
  align-items: center;
  background-color: #f8fafc;
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  user-select: none;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.day-checkbox:hover {
  background-color: #f0f9ff;
  border-color: #bae6fd;
}

.day-checkbox input {
  margin-right: 5px;
  accent-color: #0ea5e9;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 2rem;
}

.form-cancel-btn {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.25s;
}

.form-submit-btn {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.form-submit-btn:hover {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
  transform: translateY(-2px);
}

.form-cancel-btn:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.calendar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: white;
  color: #64748b;
  font-size: 1.1rem;
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(66, 153, 225, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.calendar-placeholder::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM36 0V4h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 1;
}

.auth-prompt {
  text-align: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(66, 153, 225, 0.15), 0 4px 10px rgba(0, 0, 0, 0.08);
  max-width: 80%;
  z-index: 2;
  position: relative;
  animation: fadeIn 0.8s ease-out;
}

.auth-prompt h3 {
  color: #1e40af;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.signin-button-large {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
  position: relative;
  overflow: hidden;
}

.signin-button-large::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 100%;
  top: 0;
  left: -100px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: shimmer 2.5s infinite;
}

.signin-button-large:hover {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
  transform: translateY(-2px);
}

.auth-status {
  display: flex;
  align-items: center;
}

.signin-button {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.signin-button:hover {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
  transform: translateY(-2px);
}

.calendar-wrapper {
  height: 100%;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(66, 153, 225, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: all 0.3s ease;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  transition: all 0.3s ease;
  border: 1px solid var(--color-gray-200);
}

/* (Remaining styles unchanged…) */
</style>
