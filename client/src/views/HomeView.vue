<template>
    <div class="home-container">
      <div class="chat-panel">
        <h2 class="panel-title">Quick Actions</h2>
        
        <div class="quick-actions">
          <button class="action-btn" @click="handleQuickAction('See events this week')">
            <div class="action-icon">+</div>
            See events this week
          </button>
          
          <button class="action-btn" @click="handleQuickAction('Add new class')">
            <div class="action-icon">+</div>
            Add new class
          </button>
          
          <button class="action-btn" @click="handleQuickAction('Add new event')">
            <div class="action-icon">+</div>
            Add new event
          </button>
          
          <button class="action-btn" @click="handleQuickAction('Change current event')">
            <div class="action-icon">+</div>
            Change current event
          </button>
        </div>
        
        <div class="chat-history" ref="chatHistoryRef">
          <div v-for="(message, index) in chatMessages" :key="index" 
               :class="['chat-message', message.role === 'user' ? 'user-message' : 'bot-message']">
            {{ message.content }}
          </div>
        </div>
        
        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <input 
              type="text" 
              v-model="userMessage" 
              @keydown.enter="sendMessage"
              placeholder="Message otto" 
              class="chat-input" 
            />
            <button @click="openFileUpload" class="upload-button">📎</button>
            <input 
              ref="fileInput"
              type="file"
              @change="handleFileUpload"
              accept="image/*,.pdf"
              style="display: none;"
            />
          </div>
          <button @click="sendMessage" class="send-button">
            Send
          </button>
        </div>
      </div>
      
      <div class="calendar-panel">
        <iframe 
          src="https://calendar.google.com/calendar/embed?src=primary&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&mode=WEEK&showPrint=0&showNav=1&showTitle=0&showCalendars=0&showTz=1" 
          style="border: 0" 
          width="100%" 
          height="100%" 
          frameborder="0" 
          scrolling="no">
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
  
  // Handle quick action button clicks
  const handleQuickAction = (action) => {
    userMessage.value = action;
    sendMessage();
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
        content: `Selected file: ${selectedFile.value.name}`
      });
      
      // Automatically upload the file
      uploadFile();
    }
  };
  
  // Upload file
  const uploadFile = async () => {
    if (!selectedFile.value) return;
    
    try {
      chatMessages.value.push({
        role: 'system',
        content: `Uploading ${selectedFile.value.name}...`
      });
      
      // Simulate a response
      setTimeout(() => {
        chatMessages.value.push({
          role: 'assistant',
          content: `I've analyzed your ${selectedFile.value.name}. I found several important dates. Would you like me to add them to your calendar?`
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
        content: `Failed to upload file. Please try again.`
      });
    }
  };
  
  // Send message
  const sendMessage = async () => {
    const message = userMessage.value.trim();
    if (!message) return;
    
    // Add user message to chat
    chatMessages.value.push({
      role: 'user',
      content: message
    });
    
    // Clear input
    userMessage.value = '';
    
    // Scroll to bottom
    await scrollToBottom();
    
    // Simulate response
    setTimeout(() => {
      let response = '';
      
      if (message.toLowerCase().includes('add new class')) {
        response = "I'd be happy to add a new class. Please tell me the class name, schedule (days and times), and location.";
      } else if (message.toLowerCase().includes('add new event')) {
        response = "I'll help you add a new event. What's the name, date, time, and location?";
      } else if (message.toLowerCase().includes('see events')) {
        response = "Here are your events for this week: \n- CSE 451 Lecture (Mon, Wed, Fri 10:30-11:20am)\n- Study Group (Tuesday 2-4pm)\n- Project Deadline (Friday 11:59pm)";
      } else if (message.toLowerCase().includes('change')) {
        response = "Which event would you like to change?";
      } else {
        response = "I'm Otto, your calendar assistant. I can help you manage your schedule. Try asking me to add an event, check your schedule, or upload a syllabus.";
      }
      
      chatMessages.value.push({
        role: 'assistant',
        content: response
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
      content: "Hi there! I'm Otto, your calendar assistant. How can I help you today?"
    });
  });
  </script>
  
  <style scoped>
    .home-container {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 2rem;
    height: 100%;
    width: 100%;
    }
    
  .chat-panel {
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    height: 100%;
  }
  
  .panel-title {
    font-size: 1.25rem;
    font-weight: 500;
    color: #4a5568;
    padding: 1.5rem;
    margin: 0;
    border-bottom: 1px solid #edf2f7;
  }
  
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    text-align: left;
  }
  
  .action-btn:hover {
    border-color: #cbd5e0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #4299e1;
    color: white;
  }
  
  .chat-history {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .chat-message {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    max-width: 80%;
    word-break: break-word;
  }
  
  .user-message {
    align-self: flex-end;
    background-color: #4299e1;
    color: white;
  }
  
  .bot-message {
    align-self: flex-start;
    background-color: #f7fafc;
    color: #4a5568;
    border: 1px solid #edf2f7;
  }
  
  .chat-input-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #edf2f7;
  }
  
  .chat-input-wrapper {
    display: flex;
    flex: 1;
    background-color: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .chat-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    outline: none;
  }
  
  .upload-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0.5rem;
    color: #a0aec0;
    cursor: pointer;
  }
  
  .upload-button:hover {
    color: #4299e1;
  }
  
  .send-button {
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .send-button:hover {
    background-color: #3182ce;
  }
  
  .calendar-panel {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    height: 100%;
  }
  </style>