# otto User Manual

## 📘 Overview
Otto is an intelligent calendar assistant designed for students. It allows users to manage their academic schedules effortlessly using natural language. Users can create events by typing casually into the chat interface. All data is synced to Google Calendar to centralize time management in one place.

**Why use Otto?**
- Simplify calendar management with natural language input
- Seamlessly create, edit, and remove events instantaneously
- Sync everything directly to your Google Calendar

## 🛠️ Installation

### Prerequisites
Make sure the following tools and accounts are set up:
- **Node.js** (version 16 or later)
- **npm** (version 7 or later)
- **Google Account**
- **OpenAI Account**
- **Firebase Account**

### Obtaining API Keys and Credentials

**1. OpenAI API Key:**
   - Go to [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys).
   - Sign in or create an account.
   - Click on "+ Create new secret key".
   - Name your key (e.g., "OttoAppKey") and click "Create secret key".
   - **Important:** Copy the key immediately and store it securely. You will not be able to see it again.

**2. Google Cloud OAuth 2.0 Credentials (for Google Calendar API):**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.
   - In the navigation menu, go to "APIs & Services" > "Enabled APIs & services".
   - Click "+ ENABLE APIS AND SERVICES".
   - Search for "Google Calendar API" and enable it.
   - Go to "APIs & Services" > "Credentials".
   - Click "+ CREATE CREDENTIALS" and select "OAuth client ID".
   - If prompted, configure the "OAuth consent screen":
     - Select "External" for User Type.
     - Fill in the App name (e.g., "Otto Calendar Assistant"), User support email, and Developer contact information.
     - **Scopes:** Click "ADD OR REMOVE SCOPES". Search for and add the `.../auth/calendar` scope (Google Calendar API - See, edit, share, and permanently delete all the calendars you can access using Google Calendar). **Otto only requests access to read and write calendar data.**
     - Add test users if your app is in testing mode.
     - Save and continue.
   - Back on the "Create OAuth client ID" screen:
     - Select "Web application" as the Application type.
     - Name: (e.g., "Otto Web Client").
     - **Authorized JavaScript origins:** Add `http://localhost:5173` (for local development) and your deployed frontend URL if applicable.
     - **Authorized redirect URIs:** Add `http://localhost:5173/auth-success` and `http://localhost:3000/api/auth/google/callback` (for local development) and corresponding deployed URLs if applicable.
     - Click "CREATE".
     - Copy your "Client ID" and "Client Secret". Store them securely.

**3. Firebase Service Account Key:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Create a new project or select an existing one.
   - In your project, go to "Project settings" (click the gear icon next to Project Overview).
   - Go to the "Service accounts" tab.
   - Click on "Generate new private key" and confirm by clicking "Generate key".
   - A JSON file will be downloaded. Rename this file to `serviceAccountKey.json`.

### Clone and Install
```bash
git clone https://github.com/KeejayK/otto.git # Changed from SSH to HTTPS for wider compatibility
cd otto

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### Required Configurations

**Server (`server/.env`):**
Create a `.env` file in the `/server/` directory with the following (replace placeholders with your actual keys):
```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback # Or your deployed server callback
SESSION_SECRET=a_very_strong_random_secret_for_sessions # Generate a strong random string
CLIENT_URL=http://localhost:5173 # Or your deployed client URL
```

**Firebase (`server/serviceAccountKey.json`):**
Place the `serviceAccountKey.json` file you downloaded from Firebase into the `/server/` directory. The content should look like this:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "...",
  "universe_domain": "..."
}
```

**Client (`client/.env.local` or `client/.env`):**
Create a `.env.local` (or `.env`) file in the `client/` directory. You'll need your Firebase project's client-side configuration.
   - In the Firebase Console, go to "Project settings".
   - Under "Your apps", if you haven't registered a web app, click the web icon (`</>`) to "Add app".
   - Give your app a nickname (e.g., "Otto Client") and click "Register app".
   - Firebase will provide you with a `firebaseConfig` object. Copy these values.
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_from_config
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_from_config
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_from_config
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_from_config
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_from_config
VITE_FIREBASE_APP_ID=your_firebase_app_id_from_config
VITE_API_BASE_URL=http://localhost:3000/api # Your backend API URL
```

## 🚀 Running the Software

1.  **Start the backend server:**
    ```bash
    cd server
    npm start
    # Or for development with nodemon (if configured): npm run dev
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

## 🧭 Using Otto

### 1. Creating Events
Use the text input field to type in plain English, e.g.,
> "Study group on Thursday at 5pm in Odegaard."

### 2. Editing Events (WIP)
You'll soon be able to modify events through a conversational interface. (Work in progress)

### 3. Removing Events (WIP)
The ability to remove events through the chat is under development as well. (Work in progress)

### 4. Sync to Google Calendar
Events created in Otto are pushed to your connected Google Calendar.

## 🐛 Reporting a Bug
Please submit all bug reports via our [GitHub Issue Tracker](https://github.com/KeejayK/otto/issues).

### Include the following in your bug report:
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or console output (if applicable)
- Browser and OS info

You can use [this guide](https://github.com/OpenSC/OpenSC/wiki/How-to-write-a-good-bug-report) for tips on how to write a good bug report.

## ⚠️ Known Bugs & Limitations
- Chat feature might be inconsistent at times
- It only fetches the general calendar from Google Calendar for the sake of privacy 
- It can't send invitations as events


Other known issues are tracked [here](https://github.com/KeejayK/otto/issues).

---
*This documentation reflects Otto’s planned end-of-quarter functionality. Some features are work in progress and will be completed before the final release.*
