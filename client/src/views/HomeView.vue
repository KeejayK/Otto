<template>
  <div class="home-container">
    <div class="chat-panel">
      <div class="panel-header">
        <h2 class="panel-title">otto</h2>
        <div class="quick-actions-toggle" @click="toggleQuickActions">
          <span>Quick Actions</span>
          <span class="toggle-icon">{{ isQuickActionsOpen ? '▲' : '▼' }}</span>
        </div>
      </div>

      <div class="quick-actions-menu" v-if="isQuickActionsOpen">
        <button
          class="action-btn"
          @click="handleQuickAction('See events this week')"
        >
          <div class="action-icon">📅</div>
          Events this week
        </button>

        <button class="action-btn" @click="handleQuickAction('Add new class')">
          <div class="action-icon">🎓</div>
          Add new class
        </button>

        <button class="action-btn" @click="handleQuickAction('Add new event')">
          <div class="action-icon">📌</div>
          Add new event
        </button>

        <button
          class="action-btn"
          @click="handleQuickAction('Change current event')"
        >
          <div class="action-icon">🔄</div>
          Change current event
        </button>
      </div>

      <div class="chat-history" ref="chatHistoryRef">
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
          {{ message.content }}
        </div>
      </div>

      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <input
            type="text"
            v-model="userMessage"
            @keydown.enter="sendMessage"
            placeholder="Message Otto"
            class="chat-input"
          />
          <button @click="openFileUpload" class="upload-button">
            <span class="icon-clip">📎</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            accept="image/*,.pdf"
            style="display: none"
          />
        </div>
        <button @click="sendMessage" class="send-button">Send</button>
      </div>
    </div>

    <div class="calendar-panel">
      <iframe
        src="https://calendar.google.com/calendar/embed?src=primary&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&mode=WEEK&showPrint=0&showNav=1&showTitle=0&showCalendars=0&showTz=1"
        style="border: 0"
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
      >
      </iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const chatHistoryRef = ref(null);
const userMessage = ref('');
const chatMessages = ref([]);
const fileInput = ref(null);
const selectedFile = ref(null);
const isQuickActionsOpen = ref(false);

// Toggle quick actions menu
const toggleQuickActions = () => {
  isQuickActionsOpen.value = !isQuickActionsOpen.value;
};

// Handle quick action button clicks
const handleQuickAction = (action) => {
  userMessage.value = action;
  sendMessage();
  isQuickActionsOpen.value = false; // Close quick actions after selection
};

// Open file upload dialog
const openFileUpload = () => {
  fileInput.value.click();
};

// Handle file selection
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
  if (selectedFile.value) {
    // Notify user that a file is selected
    chatMessages.value.push({
      role: 'user',
      content: `Selected file: ${selectedFile.value.name}`,
    });

    // Automatically upload the file
    uploadFile();

    // Scroll to bottom
    scrollToBottom();
  }
};

// Upload file
const uploadFile = async () => {
  if (!selectedFile.value) return;

  try {
    chatMessages.value.push({
      role: 'system',
      content: `Uploading ${selectedFile.value.name}...`,
    });

    // Simulate a response
    setTimeout(() => {
      chatMessages.value.push({
        role: 'assistant',
        content: `I've analyzed your ${selectedFile.value.name}. I found several important dates. Would you like me to add them to your calendar?`,
      });

      // Clear the file input
      fileInput.value.value = '';
      selectedFile.value = null;

      // Scroll to bottom
      scrollToBottom();
    }, 1500);
  } catch (error) {
    console.error('Error uploading file:', error);
    chatMessages.value.push({
      role: 'system',
      content: `Failed to upload file. Please try again.`,
    });
    scrollToBottom();
  }
};

// Send message
const sendMessage = async () => {
  const message = userMessage.value.trim();
  if (!message) return;

  // Add user message to chat
  chatMessages.value.push({
    role: 'user',
    content: message,
  });

  // Clear input
  userMessage.value = '';

  // Scroll to bottom
  await scrollToBottom();

  // Simulate response
  setTimeout(() => {
    let response = '';

    if (message.toLowerCase().includes('add new class')) {
      response =
        "I'd be happy to add a new class. Please tell me the class name, schedule (days and times), and location.";
    } else if (message.toLowerCase().includes('add new event')) {
      response =
        "I'll help you add a new event. What's the name, date, time, and location?";
    } else if (message.toLowerCase().includes('see events')) {
      response =
        'Here are your events for this week: \n- CSE 451 Lecture (Mon, Wed, Fri 10:30-11:20am)\n- Study Group (Tuesday 2-4pm)\n- Project Deadline (Friday 11:59pm)';
    } else if (message.toLowerCase().includes('change')) {
      response = 'Which event would you like to change?';
    } else {
      response =
        "I'm Otto, your calendar assistant. I can help you manage your schedule. Try asking me to add an event, check your schedule, or upload your class schedule.";
    }

    chatMessages.value.push({
      role: 'assistant',
      content: response, // Simulated response
    });

    scrollToBottom();
  }, 800);
};

// Scroll chat to bottom
const scrollToBottom = async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
};

onMounted(() => {
  // Add welcome message
  console.log('HomeView mounted');
  chatMessages.value.push({
    role: 'assistant',
    content:
      "Hi there! I'm Otto, your calendar assistant. How can I help you today?",
  });

  // Set initial scroll position
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
  background-color: #f7fafc;
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

.quick-actions-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #ebf8ff;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #3182ce;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-actions-toggle:hover {
  background-color: #bee3f8;
}

.toggle-icon {
  font-size: 0.75rem;
}

.quick-actions-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #edf2f7;
  max-height: 300px;
  overflow-y: auto;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 300px;
    opacity: 1;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex: 1 1 calc(50% - 0.75rem);
  min-width: 150px;
}

.action-btn:hover {
  border-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #ebf8ff;
  color: #3182ce;
  font-size: 1rem;
}

.chat-history {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: calc(100% - 180px);
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

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  color: #a0aec0;
  cursor: pointer;
  transition: color 0.2s;
}

.upload-button:hover {
  color: #4299e1;
}

.icon-clip {
  font-size: 1.25rem;
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

.send-button:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(66, 153, 225, 0.4);
}

.send-button:active {
  transform: translateY(0);
}

.calendar-panel {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 2rem);
}

/* Responsive styles */
@media (max-width: 1200px) {
  .home-container {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .home-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .action-btn {
    flex: 1 1 100%;
  }
}
</style>
