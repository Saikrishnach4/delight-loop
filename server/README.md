# Delight Loop - Collaborative Dashboard Builder

A no-code dashboard builder with real-time collaboration and email campaign engine.

## Project Structure
```
delight-loop/
├── server/                 # Backend (Node.js/Express)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Custom middleware
│   ├── socket/            # Socket.IO handlers
│   └── index.js           # Server entry point
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS/SCSS files
│   └── package.json
├── package.json           # Root package.json
└── .env                   # Environment variables
```

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Set up Environment Variables
Create a `.env` file in the root directory with:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delight-loop
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
```

### Step 3: Start Development Servers
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

## Features

### Core Features
- 🔐 User Authentication & Authorization
- 📊 Drag & Drop Dashboard Builder
- 👥 Real-time Collaboration
- 🎨 Dynamic Theming
- 📧 Email Campaign Engine
- 📱 Responsive Design

### Email Campaign Engine
- Multi-step email sequences
- Behavior-based triggers
- Time-based automation
- A/B testing support
- Analytics & reporting

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Frontend**: React, TypeScript, Material-UI
- **Real-time**: Socket.IO
- **Database**: MongoDB
- **Authentication**: JWT 