# Otto User Manual

Welcome to Otto, your intelligent calendar assistant for students! This guide will help you get Otto set up and running.

## 1. Introduction

### What is Otto?

Otto is a conversational calendar assistant designed to simplify academic scheduling for students. It allows you to manage your schedule using natural language, automatically extract important dates from syllabi and class timetables, and seamlessly sync everything with your Google Calendar.

### Why use Otto?

-   **Simplify Your Schedule**: Stop juggling multiple documents and manually entering dates. Otto streamlines how you manage your academic life.
-   **Conversational Interface**: Interact with your calendar as if you're talking to an assistant. Just tell Otto what you need.
-   **Automatic Date Extraction**: Upload your syllabus or class schedule, and Otto (work in progress) will find deadlines, exam dates, and office hours for you.
-   **Google Calendar Sync**: Keep your Google Calendar effortlessly up-to-date with all your academic events.

## 2. Getting Started

### Prerequisites

Before you install Otto, please ensure you have the following:

*   **Node.js**: Version 18.x or later. You can download it from [nodejs.org](https://nodejs.org/). npm (Node Package Manager) is included with Node.js.
*   **Web Browser**: A modern web browser like Chrome, Firefox, Safari, or Edge.
*   **Google Account**: Required for Google Calendar integration.
*   **Git**: Required to clone the project repository. You can download it from [git-scm.com](https://git-scm.com/).

### Installation

1.  **Clone the Repository**:
    Open your terminal or command prompt and run:
    ```bash
    git clone https://github.com/KeejayK/otto.git
    cd otto
    ```

2.  **Install Dependencies**:
    In the `otto` root directory, install all necessary dependencies for the client and server:
    ```bash
    npm run install:all
    ```

3.  **Environment Configuration**:
    Otto requires some configuration, primarily for the server to connect to Google Calendar and other services.

    *   **Server Configuration**:
        1.  Navigate to the `server` directory: `cd server`
        2.  Copy the example environment file: `cp .env.example .env`
        3.  Edit the newly created `.env` file with your specific credentials:
            *   `GOOGLE_CLIENT_ID`: Your Google Cloud project's OAuth 2.0 Client ID.
            *   `GOOGLE_CLIENT_SECRET`: Your Google Cloud project's OAuth 2.0 Client Secret.
            *   `GOOGLE_REFRESH_TOKEN`: A Google OAuth refresh token that allows Otto to access your calendar. (Setup for this typically involves an initial OAuth consent flow).
            *   `MONGODB_URI`: (Work in Progress) Connection string for your MongoDB database (for user accounts, etc.).
            *   `JWT_SECRET`: (Work in Progress) A secret key for signing JSON Web Tokens for user authentication.
            *   `OPENAI_API_KEY`: (Work in Progress) Your OpenAI API key for advanced natural language processing features.
        4.  Return to the root directory: `cd ..`

    *   **Client Configuration (Optional for current features)**:
        The client currently uses mock data and simulated authentication. For future Firebase integration:
        1.  Navigate to the `client` directory: `cd client`
        2.  Copy the example environment file: `cp .env.example .env`
        3.  Edit the `client/.env` file with your Firebase project configuration if you intend to connect it to a live Firebase backend. Variables should be prefixed with `VITE_`.
        4.  Return to the root directory: `cd ..`

    *(Detailed instructions on obtaining Google Cloud credentials and setting up Firebase are beyond this manual but can be found in their respective official documentations. For Google Calendar API, you'll need to enable it in your Google Cloud Console and set up OAuth 2.0 credentials.)*

## 3. Running Otto

To run Otto in development mode (which starts both the backend server and the frontend client):

1.  Open your terminal in the root `otto` directory.
2.  Run the command:
    ```bash
    npm run dev
    ```
3.  This will typically:
    *   Start the backend server on `http://localhost:3000`.
    *   Start the frontend Vite development server, usually on `http://localhost:5173` (the exact port will be shown in your terminal).
4.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

## 4. Using Otto

Once Otto is running, you can interact with it through your web browser.

### Logging In

*   When you first open Otto, you'll see a login page.
*   Click the "Sign in with Google" button.
*   **(Work in Progress)**: Currently, this will redirect you to the home page for demo purposes. The full Google OAuth 2.0 sign-in flow is under development. In the final version, this will securely authenticate you with your Google account and request permission to access your Google Calendar.

### Main Interface (Home View)

The home view is divided into two main panels:

*   **Chat Panel (Left)**: This is where you interact with Otto.
    *   **Chat Input**: Type messages or commands for Otto at the bottom of the chat panel (e.g., "Add a meeting tomorrow at 2 PM").
    *   **Quick Actions**: Above the chat history, you can find quick action buttons for common tasks:
        *   "Events this week"
        *   "Add new class"
        *   "Add new event"
        *   "Change current event"
        **(Work in Progress)**: Current responses to chat messages and quick actions are largely simulated. Full natural language understanding and action fulfillment are under development.
    *   **File Upload (Syllabus Parsing)**:
        *   Click the paperclip icon (📎) next to the chat input field.
        *   Select an image file (e.g., PNG, JPG) or a PDF file of your syllabus or class schedule.
        *   Otto will indicate that the file is selected and "uploaded".
        **(Work in Progress)**: The backend includes OCR capabilities to extract text from images and PDFs. The subsequent parsing of this text to identify events (assignments, exams, office hours) and suggest adding them to your calendar is a core feature under active development. Currently, the frontend simulates a successful analysis and prompts.

*   **Calendar Panel (Right)**:
    *   This panel displays an embedded view of your primary Google Calendar.
    *   You can see your existing events and (once fully implemented) events added or modified via Otto.

### Feature Details

*   **Natural Language Event Creation/Editing**:
    **(Work in Progress)** The goal is to allow you to type commands like "Schedule a study session for CSE101 next Tuesday from 3 to 5 PM" or "Reschedule my doctor's appointment to Friday." Otto will then process this and update your calendar.

*   **Syllabus and Timetable Processing**:
    **(Work in Progress)** After uploading a syllabus or timetable, Otto aims to:
    1.  Perform Optical Character Recognition (OCR) if it's an image or scanned PDF.
    2.  Analyze the extracted text to identify key dates, event types (lectures, labs, assignments, exams), times, and locations.
    3.  Present these identified events to you for confirmation.
    4.  Add confirmed events to your Google Calendar.

*   **Google Calendar Integration**:
    *   Events created or modified through Otto will be synced to your primary Google Calendar.
    *   The embedded calendar view provides a direct look at your schedule.

## 5. Troubleshooting

*   **Server doesn't start / Port conflicts**:
    *   Ensure no other application is using port 3000 (for the server) or 5173 (for the client). You can modify the port in `server/server.js` or Vite configuration if needed.
    *   Check the terminal for error messages. Missing `.env` file or incorrect values in it (especially Google credentials) can prevent the server from starting correctly.
*   **Client shows errors or doesn't load**:
    *   Ensure the backend server is running.
    *   Check your browser's developer console for error messages.

## 6. Reporting Bugs

If you encounter a bug, we appreciate your help in reporting it!

1.  **Where to Report**: Please report bugs on our GitHub Issues page:
    [https://github.com/KeejayK/otto/issues](https://github.com/KeejayK/otto/issues)

2.  **What to Include in Your Report**:
    To help us understand and fix the bug quickly, please include:
    *   **A clear and descriptive title**.
    *   **Steps to reproduce the bug**: Be as specific as possible.
    *   **What you expected to happen**.
    *   **What actually happened**: Include any error messages.
    *   **Screenshots or screen recordings** (if applicable and helpful).
    *   **Your environment**:
        *   Operating System (e.g., Windows 10, macOS Sonoma)
        *   Browser and version (e.g., Chrome 123)
        *   Node.js version (if relevant to the bug)
    *   For more tips on writing good bug reports, you can refer to resources like [this example from Testlio](https://testlio.com/blog/how-to-write-a-good-bug-report-a-comprehensive-guide/).

## 7. Known Bugs and Limitations

*   For an up-to-date list of known bugs and current limitations, please refer to our **[GitHub Issues Tracker](https://github.com/KeejayK/otto/issues)**.
*   **Major Work-in-Progress Areas**:
    *   Full Natural Language Processing for chat interactions.
    *   Complete syllabus/timetable parsing and intelligent event extraction.
    *   Robust Google OAuth 2.0 authentication flow.
    *   User account management and persistence (MongoDB integration).
    *   Many frontend interactions currently use mock data or simulated API responses.

Thank you for using Otto! We are actively working to improve it and add more features.