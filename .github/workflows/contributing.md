# Contributing to Otto

Thank you for your interest in contributing to Otto! We're excited to have you join our community. These guidelines will help you get started with the project.

## 📜 Table of Contents

-   [Obtaining the Source Code](#obtaining-the-source-code)
-   [Directory Structure](#directory-structure)
-   [Setting Up the Development Environment](#setting-up-the-development-environment)
-   [Building the Software](#building-the-software)
-   [Running the Software](#running-the-software)
-   [Testing the Software](#testing-the-software)
    -   [Running Existing Tests](#running-existing-tests)
    -   [Adding New Tests](#adding-new-tests)
-   [Building a Release](#building-a-release)
-   [Coding Conventions](#coding-conventions)
-   [Submitting Contributions](#submitting-contributions)

##  Obtaining the Source Code

1.  Clone the repository:
    ```bash
    git clone git@github.com:KeejayK/otto.git
    cd otto
    ```

## Directory Structure

The project is organized into a monorepo structure with a client (frontend) and a server (backend).

```
otto/
├── .github/                # GitHub Actions workflows (CI/CD)
├── client/                 # Vue.js frontend application
│   ├── public/             # Static assets (served as-is)
│   ├── src/                # Frontend source code
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # Reusable Vue components (if any)
│   │   ├── router/         # Vue Router configuration (index.js)
│   │   ├── services/       # API service integrations (api.js)
│   │   ├── stores/         # Pinia state management stores (auth.js)
│   │   ├── views/          # Page-level Vue components
│   │   ├── App.vue         # Root Vue component
│   │   ├── main.js         # Vue app entry point
│   │   └── style.css       # Global stylesheets
│   ├── tests/              # Frontend tests (e.g., ui.test.js)
│   ├── .env.example        # Example environment variables for client
│   ├── .gitignore          # Git ignore rules for client
│   ├── index.html          # Main HTML file for client
│   ├── package.json        # Client dependencies and scripts
│   └── vite.config.js      # Vite build configuration for client
├── dist/                   # Build output directory for the client (generated)
├── functions/              # Firebase Cloud Functions source (if used)
├── server/                 # Node.js/Express backend application
│   ├── models/             # Mongoose models (e.g., User.js)
│   ├── routes/             # API route definitions (auth.js, calendar.js, etc.)
│   ├── services/           # Business logic (e.g., OCR services)
│   ├── tests/              # Backend tests (Jest)
│   │   └── fixtures/       # Test fixture files (e.g., sample images)
│   ├── .env.example        # Example environment variables for server
│   ├── app.js              # Express application setup
│   ├── package.json        # Server dependencies and scripts
│   └── server.js           # Server entry point
├── .firebaserc             # Firebase project configuration
├── .gitignore              # Global Git ignore rules
├── .prettierrc             # Prettier code formatting configuration
├── eslint.config.cjs       # ESLint configuration
├── firebase.json           # Firebase hosting and functions configuration
├── jest.config.js          # Jest test runner configuration (for root)
├── package.json            # Root project dependencies and scripts
├── README.md               # Project overview and user documentation
└── vite.config.js          # Vite configuration (seems to be a duplicate or for root, primary is in client/)
```

## Setting Up the Development Environment

1.  **Prerequisites**:
    *   Node.js (v18 or later recommended, as per CI)
    *   npm (comes with Node.js)
    *   Google Cloud account (for Google Calendar API credentials)
    *   Firebase project (for potential Firebase services like Auth, Firestore)
    *   OpenAI API key (for NLP features)

2.  **Install Dependencies**:
    From the root `otto/` directory, run the `install:all` script. This will install dependencies for the root project, the client, and the server.
    ```bash
    npm run install:all
    ```
    Alternatively, you can install them step-by-step:
    ```bash
    npm install # Installs root dependencies
    cd client
    npm install # Installs client dependencies
    cd ../server
    npm install # Installs server dependencies
    cd ..
    ```

3.  **Environment Variables**:
    *   **Server**: Create a `.env` file in the `server/` directory by copying `server/.env.example`. Fill in the necessary API keys and configuration values (e.g., `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `OPENAI_API_KEY`).
    *   **Client**: If your client application requires environment variables (e.g., Firebase config), create a `.env` file in the `client/` directory by copying `client/.env.example` and fill in the values. Vite uses `VITE_` prefix for environment variables exposed to the client.

## Building the Software

*   **Frontend (Client)**: To build the client application for production, run the following command from the root directory:
    ```bash
    npm run build
    ```
    This command executes `cd client && npm run build`, and the output will be placed in the `dist/` directory.

*   **Backend (Server)**: The server is a Node.js application and doesn't require a separate build step beyond installing its dependencies (`npm install` in the `server/` directory, which is handled by `npm run install:all`).

## Running the Software

*   **Development Mode**: To run both the client and server concurrently in development mode with hot-reloading:
    From the root directory:
    ```bash
    npm run dev
    ```
    This will typically start:
    *   The backend server (e.g., on `http://localhost:3000`)
    *   The frontend Vite development server (e.g., on `http://localhost:5173`)

*   **Running Server Independently**:
    ```bash
    cd server
    npm start # Or npm run dev for nodemon
    ```

*   **Running Client Independently**:
    ```bash
    cd client
    npm run dev
    ```

## Testing the Software

### Running Existing Tests

*   **Backend Tests**: Backend tests are written using Jest and Supertest. To run them, navigate to the `server/` directory or use the root script:
    From the root directory:
    ```bash
    npm test
    ```
    This command executes `cd server && npm test`.
    To run server tests with watch mode or coverage:
    ```bash
    cd server
    npm run test:watch
    npm run test:coverage
    ```

*   **Frontend Tests**: Frontend tests are located in `client/tests/`. While a `jest.config.js` at the root is set up to handle `.vue` files, specific scripts for running only client tests might need to be added to `client/package.json` or the root `package.json` if desired. Currently, `npm test` from the root only runs server tests.

### Adding New Tests

*   **Backend Tests**:
    *   Place new test files in the `server/tests/` directory.
    *   Follow the naming convention: `[filename].test.js` (e.g., `myfeature.test.js`).
    *   Use Jest for assertions and test structure.
    *   For API endpoint testing, use `supertest` as shown in existing tests like [`server/tests/calendar.test.js`](./server/tests/calendar.test.js).

*   **Frontend Tests**:
    *   Place new test files in the `client/tests/` directory.
    *   Follow the naming convention: `[filename].test.js` or `[ComponentName].spec.js`.
    *   Use Jest and Vue Test Utils (or other relevant libraries configured with `@vue/vue3-jest`).

## Building a Release

Building a release involves preparing the software for deployment.

1.  **Version Update (Manual)**:
    *   Before creating a release, consider updating the version number in relevant `package.json` files (root, `client/package.json`, `server/package.json`). This is a manual step.
    *   Update any version numbers mentioned in documentation if applicable.

2.  **Build Frontend**:
    Run the build script for the client application from the root directory:
    ```bash
    npm run build
    ```
    This generates the static assets in the `dist/` directory. This `dist` folder is what you would typically deploy for the frontend (e.g., to Firebase Hosting as configured in [`firebase.json`](./firebase.json)).

3.  **Prepare Backend**:
    The backend doesn't have a "build" step in the same way the frontend does. Ensure all dependencies are installed:
    ```bash
    cd server
    npm install --production # Or ensure node_modules are packaged if deploying.
    ```
    The server code is run directly by Node.js.

4.  **Sanity Checks (Manual)**:
    *   Ensure all tests pass (`npm test` from root).
    *   Run the application locally using the production build (if possible) or in a staging environment.
    *   Verify key functionalities.
    *   Check that environment variables for the production/release environment are correctly configured.

5.  **Deployment**:
    *   Deploy the `dist/` folder for the frontend.
    *   Deploy the `server/` folder (along with its `node_modules` or a packaged version) for the backend.
    *   If using Firebase Functions, deploy them using Firebase CLI.

## Coding Conventions

*   **Formatting**: This project uses Prettier for code formatting. Ensure your code is formatted before committing. You can run the formatter with:
    ```bash
    npm run format:fix
    ```
    To check formatting:
    ```bash
    npm run format
    ```
*   **Linting**: This project uses ESLint for identifying and reporting on patterns in JavaScript and Vue files. Run the linter with:
    ```bash
    npm run lint
    ```
    Please address any linting errors or warnings before submitting contributions. Configuration can be found in [`eslint.config.cjs`](./eslint.config.cjs).

## Submitting Contributions

1.  **Fork the Repository**: Create your own fork of the `KeejayK/otto` repository.
2.  **Create a Branch**: Create a new branch in your fork for your feature or bug fix (e.g., `git checkout -b feature/my-new-feature` or `git checkout -b fix/issue-123`).
3.  **Make Changes**: Implement your changes, adhering to the coding conventions and adding tests where appropriate.
4.  **Test Your Changes**: Ensure all existing tests pass and any new tests you've added also pass.
5.  **Commit Your Changes**: Write clear and concise commit messages.
6.  **Push to Your Fork**: Push your changes to your forked repository.
    ```bash
    git push origin feature/my-new-feature
    ```
7.  **Open a Pull Request (PR)**:
    *   Navigate to the original `KeejayK/otto` repository on GitHub.
    *   Open a new Pull Request from your branch to the appropriate target branch in the main repository (e.g., `dev` or `main`, please check project conventions).
    *   Provide a clear description of your changes in the PR. Reference any relevant issues.
    *   The CI pipeline (defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) will automatically run checks on your PR. Ensure these pass.