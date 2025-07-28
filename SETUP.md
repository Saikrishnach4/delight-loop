# 🚀 Delight Loop - Setup Guide

## 📋 **Prerequisites**

Before running the project, make sure you have:
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🛠️ **Quick Setup**

### 1. **Install Dependencies**
```bash
# Install all dependencies (both root and client)
npm run install-all
```

### 2. **Environment Configuration**
```bash
# Copy the environment example file
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/delight-loop

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Client Configuration
CLIENT_URL=http://localhost:3000

# Email Service Configuration (Optional - for email campaigns)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. **Run the Application**
```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

## 🎯 **Testing the Features**

### **1. Dashboard Builder**
1. **Register/Login** at http://localhost:3000
2. **Create Dashboard** - Click "Create New Dashboard"
3. **Add Widgets** - Use the "+" button to add widgets
4. **Configure Widgets** - Click on widgets to configure them
5. **Real-time Collaboration** - Open multiple browser tabs to test collaboration

### **2. Email Campaign Engine**
1. **Navigate to Campaigns** - Click "Email Campaigns" in the sidebar
2. **Create Campaign** - Click "Create New Campaign"
3. **Design Flow** - Use the Flow Designer tab
4. **Add Email Steps** - Click "Add Email" to create email nodes
5. **Configure Triggers** - Add behavior-based triggers
6. **Test Campaign** - Use the "Test Campaign" button

### **3. Real-Time Collaboration**
1. **Open Multiple Tabs** - Open the same dashboard in different browser tabs
2. **See Cursors** - Move your mouse to see real-time cursor tracking
3. **Chat** - Use the collaboration panel to chat with other users
4. **Live Updates** - Make changes and see them appear instantly

### **4. Dynamic Theming**
1. **Access Theme Customizer** - Look for theme settings in the dashboard
2. **Customize Colors** - Change primary, secondary, and background colors
3. **Adjust Typography** - Modify font family, size, and weight
4. **Export/Import** - Save and load custom themes

## 🔧 **Troubleshooting**

### **Common Issues**

**1. MongoDB Connection Error**
```bash
# Make sure MongoDB is running
mongod

# Or check your connection string in .env
MONGODB_URI=mongodb://localhost:27017/delight-loop
```

**2. Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000 5000

# Or change ports in .env
PORT=5001
CLIENT_URL=http://localhost:3001
```

**3. Dependencies Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf my-app/node_modules my-app/package-lock.json
npm run install-all
```

**4. Socket.IO Connection Issues**
```bash
# Check if backend is running on correct port
# Ensure CORS is properly configured
# Check browser console for connection errors
```

## 📊 **Feature Verification Checklist**

### ✅ **Dashboard Builder**
- [ ] Can create new dashboards
- [ ] Can add widgets (charts, tables, metrics, text, images)
- [ ] Can configure widget properties
- [ ] Can drag and drop widgets
- [ ] Can resize widgets
- [ ] Auto-save works

### ✅ **Real-Time Collaboration**
- [ ] Multiple users can join same dashboard
- [ ] Cursor tracking works
- [ ] Chat messaging works
- [ ] Widget updates sync in real-time
- [ ] User presence indicators work

### ✅ **Email Campaign Engine**
- [ ] Can create new campaigns
- [ ] Flow designer works
- [ ] Can add email nodes
- [ ] Can add trigger nodes
- [ ] Can add condition nodes
- [ ] Can add delay nodes
- [ ] A/B testing panel works
- [ ] Analytics display works

### ✅ **Dynamic Theming**
- [ ] Color customization works
- [ ] Typography settings work
- [ ] Spacing adjustments work
- [ ] Theme export/import works
- [ ] Live preview works

## 🎉 **Success Indicators**

When everything is working correctly, you should see:

1. **Dashboard Builder**: Drag & drop interface with widgets
2. **Real-Time Collaboration**: Cursor indicators and chat messages
3. **Email Campaigns**: Visual flow designer with nodes
4. **Theming**: Color picker and typography controls
5. **Analytics**: Charts and metrics displaying data

## 🚀 **Next Steps**

Once the basic setup is working:

1. **Configure Email Service** - Add your email credentials to send real emails
2. **Add Real Data Sources** - Connect to your databases
3. **Customize Widgets** - Add more widget types
4. **Deploy to Production** - Use the build scripts for deployment

---

**🎯 All assignment requirements have been implemented!** 

The project demonstrates:
- ✅ Component-based canvas system
- ✅ Schema-driven rendering
- ✅ Real-time multiplayer editing
- ✅ State + data flow management
- ✅ Dynamic theming
- ✅ Email campaign engine with behavior-based automation 