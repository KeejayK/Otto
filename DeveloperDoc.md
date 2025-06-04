# otto Developer Documentation

## 📦 Source Code Access

To obtain the full source code:

```bash
git clone git@github.com:KeejayK/otto.git
```

There are no submodules or external repositories to pull. All project components are contained within this single repository.

---

## 🗂️ Project Directory Structure

```text
otto/
├── client/                  # Frontend code (Vue.js + CSS)
│   ├── public/              # Public static files
│   ├── src/                 # Vue components and assets
│   └── ...
├── server/                  # Backend code (Node.js + Express)
│   ├── routes/              # Express route definitions
│   ├── services/            # NLP, calendar, and parsing logic
│   ├── serviceAccountKey.json  # Firebase service account credentials
│   ├── .env                 # Environment variables
│   └── ...
├── tests/                   # Test files
├── .github/                 # GitHub workflows
├── package.json             # Project metadata and scripts
├── README.md                # README file
├── UserManual.md            # User Documentation
└── DeveloperDoc.md          # Developer documentation
```

---

## ⚙️ Build Instructions

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
   - Name your key (e.g., "OttoDevKey") and click "Create secret key".
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
     - Fill in the App name (e.g., "Otto Calendar Assistant (Dev)"), User support email, and Developer contact information.
     - **Scopes:** Click "ADD OR REMOVE SCOPES". Search for and add the `https://www.googleapis.com/auth/calendar` scope. This scope allows the application to see, edit, share, and permanently delete all the calendars the user can access using Google Calendar. **It's crucial to inform users that Otto only uses this to read and write event data to their primary calendar and does not share or delete calendars.**
     - Add test users (your Google accounts) during development, as the app will be in "testing" mode and only accessible to these users until published.
     - Save and continue.
   - Back on the "Create OAuth client ID" screen:
     - Select "Web application" as the Application type.
     - Name: (e.g., "Otto Web Client Dev").
     - **Authorized JavaScript origins:** Add `http://localhost:5173` (for local client development).
     - **Authorized redirect URIs:** Add `http://localhost:5173/auth-success` (client-side redirect) and `http://localhost:3000/api/auth/google/callback` (server-side redirect for token exchange).
     - Click "CREATE".
     - Copy your "Client ID" and "Client Secret". Store them securely.

**3. Firebase Service Account Key:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Create a new project or select an existing one for development.
   - In your project, go to "Project settings" (click the gear icon next to Project Overview).
   - Go to the "Service accounts" tab.
   - Click on "Generate new private key" and confirm by clicking "Generate key".
   - A JSON file will be downloaded. Rename this file to `serviceAccountKey.json`.

### Install Dependencies

Clone the repository if you haven't already:
```bash
git clone https://github.com/KeejayK/otto.git # Changed from SSH to HTTPS
cd otto
```

Install dependencies for both client and server:
```bash
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

**Server Environment Variables (`server/.env`):**
Create a `.env` file in the `/server/` directory. Populate it with the credentials you obtained:
```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=generate_a_strong_random_string_for_session_secret # e.g., using a password generator
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK serviceAccountKey.json is used directly by server/firebase.js
# No specific env var needed for it unless you change the loading mechanism.
```

**Firebase Service Account Key (`server/serviceAccountKey.json`):**
Place the `serviceAccountKey.json` file (downloaded in step 3 above) directly into the `/server/` directory.

**Client Environment Variables (`client/.env.local` or `client/.env`):**
Create a `.env.local` (or `.env`) file in the `client/` directory. You'll need your Firebase project's client-side configuration details.
   - In the Firebase Console, go to your project's "Project settings".
   - In the "General" tab, under "Your apps", if you haven't registered a web app, click the web icon (`</>`) to "Add app".
   - Give your app a nickname (e.g., "Otto Client Dev") and click "Register app".
   - Firebase will provide you with a `firebaseConfig` object containing keys like `apiKey`, `authDomain`, etc. Use these values here:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_from_config
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_from_config
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_from_config
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_from_config
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_from_config
VITE_FIREBASE_APP_ID=your_firebase_app_id_from_config
VITE_API_BASE_URL=http://localhost:3000/api # Backend API URL for the client to use
```
Ensure your `client/src/firebase.js` is set up to use these Vite environment variables (e.g., `import.meta.env.VITE_FIREBASE_API_KEY`).

### Build Frontend (Optional for Dev, Needed for Prod)
```bash
cd client
npm run build
```

---

## 🧪 Testing Instructions

### Install Clean Dependencies (if you suspect issues with node_modules)
```bash
npm ci
```

### Run Linter
```bash
npm run lint
```

### Check Code Formatting
```bash
npm run format
```

### Run Tests

**Server-side Tests (Jest):**
Located in `server/tests/`. These typically test API endpoints, services, and utility functions.
```bash
cd server
npm test
```

**Client-side Tests (Jest/Vue Test Utils):**
Located in `client/tests/`. These test Vue components and client-side logic.
```bash
cd client
npm test 
# or specific script if defined e.g. npm run test:unit
```

---

## ➕ Adding New Tests

### Test Structure
- **Server-side (Node.js/Express with Jest):**
  - Place unit or integration tests in the corresponding `server/tests/` folder.
  - Use a consistent naming format: `moduleName.test.js` (e.g., `calendar.test.js`, `nlpService.test.js`).
  - **Example (`server/tests/exampleService.test.js`):**
    ```javascript
    // server/services/exampleService.js
    // const add = (a, b) => a + b;
    // module.exports = { add };

    // server/tests/exampleService.test.js
    const { add } = require('../services/exampleService'); // Adjust path as needed

    describe('ExampleService', () => {
      describe('add', () => {
        it('should return the sum of two numbers', () => {
          expect(add(2, 3)).toBe(5);
        });

        it('should handle negative numbers', () => {
          expect(add(-1, -1)).toBe(-2);
        });
      });
    });
    ```

- **Client-side (Vue.js with Vue Test Utils & Jest):**
  - Place component tests in `client/tests/` or alongside components in `client/src/components/tests/` or `client/src/views/tests/`.
  - Naming: `ComponentName.spec.js` or `ComponentName.test.js`.
  - **Example (`client/src/components/tests/MyButton.spec.js`):**
    Assume you have a simple button component `client/src/components/MyButton.vue`:
    ```vue
    <!-- MyButton.vue -->
    <template>
      <button @click="handleClick">{{ label }}</button>
    </template>

    <script setup>
    import { defineProps, defineEmits } from 'vue';

    defineProps({
      label: {
        type: String,
        default: 'Click me'
      }
    });

    const emit = defineEmits(['clicked']);

    const handleClick = () => {
      emit('clicked', 'Button was clicked!');
    };
    </script>
    ```

    Then the test `client/src/components/tests/MyButton.spec.js` would be:
    ```javascript
    import { mount } from '@vue/test-utils';
    import MyButton from '../MyButton.vue'; // Adjust path as needed

    describe('MyButton.vue', () => {
      it('renders props.label when passed', () => {
        const label = 'Submit';
        const wrapper = mount(MyButton, {
          props: { label }
        });
        expect(wrapper.text()).toMatch(label);
      });

      it('emits a "clicked" event with payload when clicked', async () => {
        const wrapper = mount(MyButton);
        await wrapper.trigger('click');
        expect(wrapper.emitted().clicked).toBeTruthy();
        expect(wrapper.emitted().clicked[0]).toEqual(['Button was clicked!']);
      });

      it('renders default label if none is provided', () => {
        const wrapper = mount(MyButton);
        expect(wrapper.text()).toMatch('Click me');
      });
    });
    ```

### Running a Single Test File
- **Jest (Server or Client):**
  You can run a specific test file by providing its path to the `npm test` command (you might need to adjust the command based on your `package.json` scripts or use `npx jest` directly).
  ```bash
  # From server directory
  cd server
  npm test tests/calendar.test.js 
  # or npx jest tests/calendar.test.js

  # From client directory
  cd client
  npm test tests/ui.test.js 
  # or npx jest tests/ui.test.js (if jest is configured for client tests)
  ```

---

## 🚀 Building a Release

To package and release a new version of Otto:

1. **Update version numbers** in `package.json` and optionally tag the commit with `git tag vX.Y.Z`
2. **Run sanity checks**:
    - `npm run lint`
    - `npm run test`
    - `npm run build`
3. **Push changes and tag**
```bash
git add .
git commit -m "Release vX.Y.Z"
git push origin main --tags
```
4. Create a release on GitHub using the tagged commit.

---
