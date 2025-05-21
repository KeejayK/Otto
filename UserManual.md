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
- **Google Cloud account** (to set up OAuth credentials)
- **Firebase project**
- **OpenAI API key**

### Clone and Install
```bash
git clone git@github.com:KeejayK/otto.git
cd otto
npm install
```

### Required Configurations
Create a `.env` file in `/server/` with the following:
```
OPENAI_API_KEY=your-openai-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Place your Firebase service account credentials in `/server/serviceAccountKey.json`:
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

## 🚀 Running the Software

```bash
npm run dev
```

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
- Chat feature is inconsistent
- Editing an removing events are still under development

All known issues are tracked [here](https://github.com/KeejayK/otto/issues).

---
*This documentation reflects Otto’s planned end-of-quarter functionality. Some features are work in progress and will be completed before the final release.*
