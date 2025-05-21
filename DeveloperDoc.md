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
- **Google Cloud account** (to set up OAuth credentials)
- **Firebase project**
- **OpenAI API key**

### Install
```bash
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

### Build Frontend
```bash
cd client
npm run build
```

---

## 🧪 Testing Instructions

### Install Clean Dependencies
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
```bash
npm run test
```


---

## ➕ Adding New Tests

### Test Structure
- Place unit or integration tests in the corresponding `/tests` folder.
- Use a consistent naming format: `componentName.test.js`


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
