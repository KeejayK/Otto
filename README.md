# otto

**Keejay, Judy, Jiahao, Aaron, Braden, Joel**

## 📘 Overview

otto is an intelligent calendar assistant built for students. Speak naturally to manage your schedule - add, edit or remove events directly through conversation. otto helps students streamline academic scheduling by using natural language processing and integrates seamlessly with Google Calendar.

### We aim to:

- **Simplify academic scheduling** by creating a streamlined solution that understands how students actually work
- **Redefine** how students manage their academic schedules with a conversational interface purpose-built for college life
- Make calendar management feel **as easy as texting a friend**

### We'll achieve these goals by: 

- Leveraging natural language processing for calendar commands
- Integrating directly with Google Calendar for automatic event updates

## 🎯 Core Features

- **Natural Language Event Creation:** Add events by typing in plain English
- **Conversational Event Editing:** Modify existing events through natural chat interactions
- **Smart Event Removal:** Delete events just by asking otto
- **Google Calendar Integration:** One-way sync that pushes otto events to Google Calendar.

## 🛠️ Tech Stack

- **Frontend**: Vue.js + CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **NLP**: OpenAI GPT4 API, Langchain,
- **Calendar Integration** Google Calendar API, OAuth 2.0

### Dependencies

- Node.js (v16 or later)
- npm (v7 or later)
- Google Cloud account for OAuth credentials
- Firebase project
- OpenAI API key

## 🚀 Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd otto
    ```

2.  **Install server dependencies:**
    ```bash
    cd server
    npm install
    cd ..
    ```

3.  **Install client dependencies:**
    ```bash
    cd client
    npm install
    cd ..
    ```

4.  **Set up Firebase:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Obtain your Firebase project configuration (apiKey, authDomain, projectId, etc.).
    *   Download your service account key JSON file for the backend. Rename it to `serviceAccountKey.json` and place it in the `server/` directory.
    *   Enable Firestore database in your Firebase project.

5.  **Set up Google Cloud for OAuth:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create or select a project.
    *   Enable the Google Calendar API.
    *   Create OAuth 2.0 credentials (Client ID and Client Secret).
    *   Configure the Authorized redirect URIs. For local development, this will likely be `http://localhost:5173/auth-success` (or your client's port) and potentially `http://localhost:3000/api/auth/google/callback` (or your server's callback URL).

6.  **Set up OpenAI API Key:**
    *   Obtain an API key from [OpenAI](https://platform.openai.com/account/api-keys).

## ⚙️ Environment Variables

You will need to configure environment variables for both the client and server.

### Server (`server/.env`)

Create a `.env` file in the `server/` directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback # Or your deployed callback URL
SESSION_SECRET=a_strong_random_secret_key_for_sessions
CLIENT_URL=http://localhost:5173 # Or your deployed client URL

# Firebase Admin SDK (serviceAccountKey.json is used directly, but if you had other config here)
# FIREBASE_PROJECT_ID=your_firebase_project_id
```
*Note: The `server/checkConfig.js` file checks for some of these variables.*

### Client (`client/.env.local` or `client/.env`)

Create a `.env.local` (or `.env`) file in the `client/` directory for your Firebase client configuration (if you're using environment variables for this, otherwise it might be directly in `src/firebase.js`):

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_API_BASE_URL=http://localhost:3000/api # Server API URL
```
*Ensure your `client/src/firebase.js` is configured to use these environment variables if you set them up this way.*

## ▶️ Running the Application

1.  **Start the backend server:**
    ```bash
    cd server
    npm start 
    # Or for development with nodemon if configured: npm run dev
    ```
    The server will typically run on `http://localhost:3000`.

2.  **Start the frontend client:**
    Open a new terminal.
    ```bash
    cd client
    npm run dev
    ```
    The client will typically run on `http://localhost:5173`.

3.  Open your browser and navigate to `http://localhost:5173`.

## ✅ Running Tests

### Server Tests
```bash
cd server
npm test
```

### Client Tests
```bash
cd client
npm test 
```

## 📂 Project Structure Overview

```
otto/
├── client/               # Vue.js frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/   # (Assumed, common practice)
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   ├── views/
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── firebase.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/               # Node.js Express backend application
│   ├── middleware/
│   ├── routes/
│   │   └── backup/
│   ├── services/
│   │   └── nlp/
│   ├── tests/
│   ├── app.js
│   ├── firebase.js       # Server-side Firebase admin setup
│   ├── package.json
│   └── server.js
├── .gitignore
├── DeveloperDoc.md
├── README.md
└── ... (other root level config files)
```

## 📜 Documentation

- [Developer Documentation](https://github.com/KeejayK/otto/blob/main/DeveloperDoc.md)
- [User Manual](https://github.com/KeejayK/otto/blob/main/UserManual.md)