# Commuter Hub 🚆

**Live Demo:** [commuter-hub-frontend.onrender.com](https://commuter-hub-frontend.onrender.com/)

A full-stack Progressive Web App (PWA) built for daily commuters to log train journeys, track cumulative travel expenses, and share real-time route updates.

## Features
* **Progressive Web App (PWA):** Fully installable on mobile devices with a native app-like experience and standalone UI.
* **Real-Time Community Feed:** Utilizes WebSockets for instantaneous, live chat and route updates without page reloads.
* **Trip Analytics:** Dashboard that calculates total trips and cumulative travel expenses dynamically.
* **Responsive Dark Mode UI:** Styled from the ground up using Tailwind CSS v4.

## Tech Stack
* **Frontend:** React, Vite PWA, Tailwind CSS v4
* **Backend:** Node.js, Express.js, Socket.io
* **Database:** MongoDB
* **Deployment:** Render (Separate client/server architecture)

## Run Locally
1. Clone the repository: `git clone https://github.com/manas6265517/commuter-hub.git`
2. Navigate into the backend and install dependencies: `cd backend && npm install`
3. Create a `.env` file in the backend with your `MONGO_URI`
4. Start the backend: `npm run dev`
5. Open a new terminal, navigate to the frontend: `cd frontend && npm install`
6. Start the frontend: `npm run dev`
