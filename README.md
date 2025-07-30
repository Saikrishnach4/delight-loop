# 🚀 Delight Loop - Collaborative Dashboard Builder & Email Campaign Engine

A comprehensive MERN stack application featuring a collaborative no-code dashboard builder with an intelligent email campaign engine. Built with real-time collaboration, advanced email automation, and modern UI/UX.

## 🌟 Live Demo

- **Frontend**: [https://delight-loop.vercel.app](https://delight-loop.vercel.app)
- **Backend API**: [https://delight-loop.onrender.com](https://delight-loop.onrender.com)

## 📂 Repository

- **GitHub**: [https://github.com/Saikrishnach4/delight-loop.git](https://github.com/Saikrishnach4/delight-loop.git)
- **Production Branch**: `prod`
- **Deployment**: [https://delight-loop.vercel.app/](https://delight-loop.vercel.app/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Email Campaign Engine](#-email-campaign-engine)
- [Dashboard Builder Features](#-dashboard-builder-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 Dashboard Builder
- **No-Code Interface**: Drag-and-drop dashboard creation
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Widget Library**: Charts, tables, metrics, images, and text widgets
- **Responsive Design**: Works on desktop and mobile
- **Theme Customization**: Custom colors and styling
- **Export/Import**: Save and share dashboard configurations

### 📧 Email Campaign Engine
- **Behavior-Based Triggers**: Click, idle, purchase, and abandonment tracking
- **Time-Delay Automation**: Schedule follow-up emails
- **Smart Analytics**: Track opens, clicks, purchases, and revenue
- **Template System**: Pre-built email templates
- **A/B Testing**: Test different email variations
- **Purchase Tracking**: Complete e-commerce integration

### 🔐 Authentication & Security
- **JWT Authentication**: Secure user sessions
- **Protected Routes**: Role-based access control
- **Password Hashing**: bcrypt encryption
- **CORS Protection**: Cross-origin security

### 📊 Real-time Features
- **Socket.IO Integration**: Live collaboration updates
- **Live Analytics**: Real-time campaign performance
- **Instant Notifications**: User activity alerts

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Socket.IO Client** - Real-time communication
- **React Grid Layout** - Drag-and-drop functionality
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Zustand** - State management
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time server
- **JWT** - Authentication
- **BullMQ** - Job queues
- **Redis** - Caching & queues
- **Nodemailer** - Email service


### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Cloud database
- **Redis Cloud** - Cloud caching

## 🏗 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                        │                        │
├─ Material-UI          ├─ Express.js            ├─ MongoDB Atlas
├─ Socket.IO Client     ├─ Socket.IO Server      ├─ Redis Cloud
├─ React Router         ├─ JWT Auth              ├─ Email Service
├─ Recharts             ├─ BullMQ Queues         └─ File Storage
└─ Zustand State        └─ Mongoose ODM
```

## 📁 Project Structure

```
delight-loop/
├── my-app/                    # React Frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── DashboardCanvas.js
│   │   │   ├── Widget.js
│   │   │   ├── widgets/      # Widget components
│   │   │   └── Collaboration/
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── DashboardBuilder.js
│   │   │   ├── EmailCampaigns.js
│   │   │   └── CampaignAnalytics.js
│   │   ├── context/         # React contexts
│   │   ├── services/        # API services
│   │   └── App.js
│   └── package.json
├── server/                   # Node.js Backend
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── socket/              # Socket.IO handlers
│   └── index.js
└── README.md
```

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (local or Redis Cloud)
- **Email Service** (Gmail, SendGrid, etc.)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Saikrishnach4/delight-loop.git
cd delight-loop

# Switch to production branch
git checkout prod
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../my-app
npm install
```

### 3. Environment Setup

Create `.env` files in both `server/` and `my-app/` directories:

#### Backend Environment (`server/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/delight-loop
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delight-loop

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail

# Redis Configuration
REDIS_URL=redis://localhost:6379
# OR for Redis Cloud:
# REDIS_URL=redis://username:password@host:port

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Base URL for tracking
BASE_URL=http://localhost:5000
```

#### Frontend Environment (`my-app/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup

#### MongoDB Setup

1. **Local MongoDB:**
   ```bash
   # Install MongoDB locally
   # Start MongoDB service
   mongod
   ```

2. **MongoDB Atlas:**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get connection string
   - Update `MONGODB_URI` in `.env`

#### Redis Setup

1. **Local Redis:**
   ```bash
   # Install Redis locally
   # Start Redis service
   redis-server
   ```

2. **Redis Cloud:**
   - Create account at [Redis Cloud](https://redis.com/try-free/)
   - Create a new database
   - Get connection string
   - Update `REDIS_URL` in `.env`

### 5. Email Service Setup

#### Gmail Setup (Recommended for development)

1. Enable 2-factor authentication
2. Generate App Password
3. Update `.env` with your credentials

#### Alternative Email Services

- **SendGrid**: Use API key instead of password
- **Mailgun**: Use API key and domain
- **AWS SES**: Use AWS credentials

## 🏃‍♂️ Running the Application

### Development Mode

#### Option 1: Run Both Together (Recommended)

```bash
# From the root directory
cd server
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) simultaneously.

#### Option 2: Run Separately

```bash
# Terminal 1 - Backend
cd server
npm run server

# Terminal 2 - Frontend
cd my-app
npm start
```

### Production Mode

```bash
# Build frontend
cd my-app
npm run build

# Start production server
cd ../server
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Dashboard Endpoints

```http
GET /api/dashboards
POST /api/dashboards
GET /api/dashboards/:id
PUT /api/dashboards/:id
DELETE /api/dashboards/:id
```

### Email Campaign Endpoints

```http
GET /api/campaigns
POST /api/campaigns
GET /api/campaigns/:id
PUT /api/campaigns/:id
DELETE /api/campaigns/:id
POST /api/campaigns/:id/send
GET /api/campaigns/:id/analytics
```

### Widget Endpoints

```http
GET /api/widgets
POST /api/widgets
PUT /api/widgets/:id
DELETE /api/widgets/:id
```

### Collaboration Endpoints

```http
POST /api/collaboration/join
POST /api/collaboration/leave
GET /api/collaboration/users/:dashboardId
```

## 📧 Email Campaign Engine

### Behavior Triggers

The email campaign engine supports multiple behavior-based triggers:

#### 1. Click Triggers
- **Trigger**: User clicks a link in the email
- **Action**: Send follow-up email
- **Tracking**: Via modified links with tracking parameters

#### 2. Idle Triggers
- **Trigger**: User doesn't interact within specified time
- **Action**: Send reminder email
- **Configuration**: Set idle time (minutes)

#### 3. Purchase Triggers
- **Trigger**: User makes a purchase
- **Action**: Send thank you email
- **Data**: Track purchase amount and order details

#### 4. Abandonment Triggers
- **Trigger**: User visits purchase page but doesn't buy
- **Action**: Send recovery email
- **Tracking**: Via purchase page visit pixel

### Time-Delay Triggers

- **Immediate**: Send email right away
- **Delayed**: Send after specified time interval
- **Sequential**: Send series of emails with delays

### Analytics & Tracking

- **Click Rate**: Percentage of recipients who clicked
- **Purchase Rate**: Percentage who made purchases
- **Revenue Tracking**: Total revenue generated
- **Behavior Analysis**: User interaction patterns

## 🎨 Dashboard Builder Features

### Widget Types

1. **Chart Widget**
   - Line, bar, pie, area charts
   - Real-time data updates
   - Customizable colors and styles

2. **Table Widget**
   - Sortable columns
   - Pagination
   - Export functionality

3. **Metric Widget**
   - Key performance indicators
   - Trend indicators
   - Custom formatting

4. **Image Widget**
   - Upload and display images
   - Responsive sizing
   - Alt text support

5. **Text Widget**
   - Rich text editor
   - Markdown support
   - Custom styling

### Collaboration Features

- **Real-time Editing**: Multiple users can edit simultaneously
- **User Presence**: See who's currently editing
- **Change Tracking**: View recent changes
- **Conflict Resolution**: Automatic merge of changes

### Customization Options

- **Theme Colors**: Custom primary/secondary colors
- **Layout**: Responsive grid system
- **Widget Styling**: Individual widget customization
- **Dashboard Settings**: Global configuration

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from my-app directory
   cd my-app
   vercel
   ```

2. **Environment Variables**
   - Set `REACT_APP_API_URL` to your backend URL
   - Configure build settings

3. **Production Deployment**
   - **Live URL**: [https://delight-loop.vercel.app/](https://delight-loop.vercel.app/)
   - **Branch**: `prod` (production branch)
   - **Auto-deploy**: Enabled for `prod` branch

### Backend Deployment (Render)

1. **Create Render Account**
   - Sign up at [Render.com](https://render.com)

2. **Connect Repository**
   - Link your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**
   - Add all variables from `server/.env`
   - Update URLs for production

### Database Setup

1. **MongoDB Atlas**
   - Create production cluster
   - Set up network access
   - Create database user

2. **Redis Cloud**
   - Create production database
   - Configure connection settings

### Email Service Setup

1. **Production Email Service**
   - Use SendGrid or similar for production
   - Configure domain authentication
   - Set up SPF/DKIM records

### Final Configuration

1. **Update URLs**
   - Frontend: Update API URL
   - Backend: Update CORS origins
   - Tracking: Update base URLs

2. **SSL/HTTPS**
   - Ensure all URLs use HTTPS
   - Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Review the documentation
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Material-UI for the component library
- Socket.IO for real-time functionality
- BullMQ for job queue management
- MongoDB for the database solution

---

**Built with ❤️ using the MERN stack** 