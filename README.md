# SAT Prep Pro

SAT Success Study Companion is a React + TypeScript SAT preparation application originally exported from Google AI Studio.

## Original project

The original source archive is `remix-sat-success-study-companion.zip`. The application uses Vite, React, Tailwind CSS, Firebase, an Express server, and Google Gemini integration. **This repository does not yet contain the application source code.** Do not deploy it as a working app until the original source is uploaded and tested.

## Import the original source

Extract `remix-sat-success-study-companion.zip` on your computer, then upload the extracted project files and folders into the root of this repository (not the ZIP file alone). Preserve `src/`, `public/`, `server.ts`, `package.json`, `index.html`, `tsconfig.json`, and the remaining configuration files. Never commit `.env` files, API keys, or service credentials.

## Build and test

```bash
npm install
npm run lint
npm run build
npm run dev
```

The original project uses a Node/Express server, so deployment must support its backend or separate the backend appropriately. A static-only deployment may break server routes and AI functionality.

## Fix scope

Preserve existing lessons, questions, user accounts, Firebase integration, design, and AI functionality. Fix the desktop sidebar behavior and dashboard overflow only after testing the original application.
