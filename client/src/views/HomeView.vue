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
  const profile = authStore.getUserProfile();
  if (!profile?.email) return null;

  const encodedEmail = encodeURIComponent(profile.email);
  
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
  const messageText = isConfirmed ? 'yes' : 'no';
  const lastMessage = chatMessages.value[chatMessages.value.length - 1]?.content || '';
  const isDeleteConfirmation = lastMessage.includes('delete') || lastMessage.includes('Delete');
  
  // For deletion confirmations, don't show the "yes" in the chat
  if (!(isConfirmed && isDeleteConfirmation)) {
    chatMessages.value.push({
      role: 'user',
      content: messageText,
    });
  }
  
  // Direct API call instead of using sendMessage
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
    // Send the delete command directly to the API - but don't display the technical command
    const messageText = `Delete event with ID ${eventId}`;
    const response = await chatApi.sendMessage(messageText);
    console.log('Response from chatApi:', response);
    
    // Add the bot's response to the chat
    chatMessages.value.push({
      role: 'assistant',
      content: response.data.message,
    });
    
    // Refresh the calendar if event was deleted
    if (response.data.type === 'delete') {
      iframeKey.value += 1;
      await nextTick();
    }
    
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
const submitForm = async () => {
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
    prompt = `Add a recurring event called "${formData.value.eventName}" on ${daysStr} from ${formData.value.startTime} to ${formData.value.endTime} starting from ${formData.value.startDate} until ${formData.value.endDate}`;
    
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
      prompt += ` with recurrence ${recurrenceRule}`;
    } catch (e) {
      console.error('Error processing recurring event:', e);
    }
  }
  
  // Send the detailed command to the API without showing it in the chat
  const messageText = prompt;
  userMessage.value = '';
  isLoading.value = true;

  // No need to add the user message to chat again since we already did that with userPromptDisplay
  
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
    await scrollToBottom();
  }
};

// Handle quick action button clicks
const handleQuickAction = (action) => {
  if (action === 'See events this week') {
    // Set message and send to API
    chatMessages.value.push({
      role: 'user',
      content: action
    });
    
    // Now use the direct API sending method
    const messageText = action;
    userMessage.value = '';
    isLoading.value = true;
    
    // Call API and handle response
    chatApi.sendMessage(messageText)
      .then((response) => {
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
    
    // Use the same direct API method as above
    const messageText = action;
    userMessage.value = '';
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
  padding: 1.5rem;
  box-sizing: border-box;
  background: linear-gradient(120deg, #f0f7ff 0%, #e6f0fd 100%);
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
  padding: 1.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

input[type="text"],
input[type="date"],
input[type="time"],
textarea {
  width: 100%;
  padding: 0.85rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
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
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 1;
}

.auth-prompt {
  text-align: center;
  padding: 2.5rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(66, 153, 225, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08);
  max-width: 80%;
  z-index: 2;
  position: relative;
  animation: fadeIn 0.8s ease-out;
}

.auth-prompt h3 {
  color: #1e40af;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.signin-button-large {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.75rem;
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
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(66, 153, 225, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: all 0.3s ease;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(66, 153, 225, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 3rem);
  transition: all 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.panel-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #f5f7fa 0%, #e3e9f7 100%);
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
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
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: #f8fafc;
  border-top: 1px solid #edf2f7;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
  color: #0284c7;
  border-color: #bae6fd;
}

.action-pill.clear-history {
  background-color: #fff5f5;
  color: #e53e3e;
  border-color: #fed7d7;
}

.action-pill.clear-history:hover:not([disabled]) {
  background-color: #fed7d7;
  transform: translateY(-2px);
}

.action-pill.clear-history[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.pill-icon {
  font-size: 1.1rem;
  display: inline-block;
}

.chat-history {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100% - 200px);
  scroll-behavior: smooth;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.chat-message {
  padding: 1rem 1.25rem;
  border-radius: 16px;
  max-width: 85%;
  word-break: break-word;
  line-height: 1.5;
  animation: fadeIn 0.3s ease-out;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.thinking {
  padding: 0.75rem 1.25rem;
  box-shadow: none;
}

.dot-animation {
  display: inline-block;
  position: relative;
  width: 60px;
  height: 20px;
}

.dot-animation::before {
  content: '...';
  display: inline-block;
  animation: dotAnimation 1.5s infinite;
  font-size: 24px;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #0284c7, #0ea5e9);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
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
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100px;
  }
  100% {
    left: 200%;
  }
}

.user-message {
  align-self: flex-end;
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.bot-message {
  align-self: flex-start;
  background-color: white;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Global rule to ensure ALL elements within bot messages have consistent font size */
.bot-message * {
  font-size: 1rem;
}

.system-message {
  align-self: center;
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px dashed #bae6fd;
  font-size: 0.925rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  max-width: 80%;
}

.in-chat-form {
  max-width: 90%;
  padding: 1.25rem;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
}

.in-chat-form h4 {
  margin-top: 0;
  color: #0369a1;
  font-size: 1.1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.chat-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #edf2f7;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.chat-input-wrapper {
  display: flex;
  flex: 1;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) inset;
}

.chat-input-wrapper:focus-within {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.chat-input {
  flex: 1;
  padding: 0.85rem 1.25rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
  color: #334155;
}

.chat-input::placeholder {
  color: #94a3b8;
}

.send-button {
  background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
  position: relative;
  overflow: hidden;
}

.send-button::after {
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

.send-button:hover:not([disabled]) {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.35);
}

.send-button:active:not([disabled]) {
  transform: translateY(0);
}

.send-button[disabled] {
  background: linear-gradient(90deg, #64748b 0%, #94a3b8 100%);
  cursor: not-allowed;
  box-shadow: 0 2px 6px rgba(100, 116, 139, 0.25);
}

.calendar-panel {
  background-color: white;
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(66, 153, 225, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 3rem);
}

/* Unified consistent styles for event list */
.bot-message h2 {
  margin-top: 0;
  color: #1e40af;
  font-size: 1.2rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, #1e40af, #0097b2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  display: inline-block;
}

.bot-message h3 {
  color: #334155;
  font-size: 1.05rem;
  margin-top: 2.5rem;
  margin-bottom: 1.2rem;
  font-weight: 600;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.bot-message ul {
  margin-top: 0.75rem;
  margin-left: 0;
  padding-left: 0;
  list-style-type: none;
  border-bottom: 1px solid #f1f5f9;
}

.bot-message li {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  line-height: 1.5;
  font-size: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.bot-message li:hover {
  border-color: #bae6fd;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  transform: translateY(-2px);
}

/* Make events appear as a single line with consistent font */
.bot-message li strong {
  font-weight: 600;
  color: #0369a1;
  margin-right: 1.5rem;
  font-size: 1rem;
}

/* Button styling for event actions */
.bot-message a {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-left: 0.5rem;
  font-size: 0.85rem !important;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.bot-message a:hover {
  background-color: #f8fafc;
  color: #0284c7;
  border-color: #bae6fd;
}

/* Media queries for responsiveness */
@media (max-width: 1024px) {
  .home-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .chat-panel, .calendar-wrapper {
    height: calc(50vh - 2rem);
    max-height: none;
  }
  
  .calendar-placeholder {
    height: calc(50vh - 2rem);
  }
}

@media (max-width: 640px) {
  .home-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .chat-message {
    max-width: 90%;
    padding: 0.75rem 1rem;
  }
  
  .action-pill {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .chat-input-container {
    padding: 0.75rem 1rem;
  }
  
  .send-button {
    padding: 0.75rem 1.2rem;
  }
  
  .auth-prompt {
    padding: 1.5rem;
  }
}
</style>