# Dashboard Builder & Email Campaigns

A simple **no-code dashboard builder** with **email automation** - like a combination of Retool and Mailchimp!

## 🎯 **What This Project Does**

### **1. Dashboard Builder**
- **Drag & Drop**: Create dashboards by dragging widgets
- **Real-time Collaboration**: Multiple people can edit together
- **Dynamic Theming**: Change colors and fonts instantly
- **Widget Library**: Charts, tables, metrics, text, images

### **2. Email Campaign Engine**
- **Visual Flow Designer**: Draw email sequences like a flowchart
- **Smart Triggers**: Send emails based on user behavior
- **A/B Testing**: Test different email versions
- **Analytics**: Track opens, clicks, conversions

## 🚀 **Quick Start**

```bash
# Install dependencies
npm run setup

# Start the application
npm start
```

Visit `http://localhost:3000` to see the dashboard builder!

## 📊 **How to Use Dashboard Builder**

### **Step 1: Create Dashboard**
1. Click "Dashboard Builder" in sidebar
2. Click "Create New Dashboard"
3. You'll see an empty canvas

### **Step 2: Add Widgets**
1. Click "Add Widget" button
2. Choose widget type (Chart, Table, Metric, etc.)
3. Drag widget to position on canvas
4. Click widget to configure it

### **Step 3: Customize**
1. **Change Colors**: Click palette icon for theme customizer
2. **Resize Widgets**: Drag corners to resize
3. **Move Widgets**: Drag to reposition
4. **Configure Data**: Click widget to set data source

### **Step 4: Collaborate**
- **Real-time Editing**: Multiple users can edit simultaneously
- **Live Chat**: Chat with other users while editing
- **Cursor Tracking**: See where others are working

## 📧 **How to Use Email Campaigns**

### **Step 1: Create Campaign**
1. Click "Email Campaigns" in sidebar
2. Click "Create New Campaign"
3. Click "Flow Designer" tab

### **Step 2: Build Email Flow**
1. **Click "Add Email"** → Creates welcome email
2. **Click "Add Trigger"** → Detects when email is opened
3. **Click "Add Email"** → Creates follow-up email

### **Step 3: Configure Automation**
**Example: "If user opens email, send follow-up"**
1. **Trigger**: Set to "Email Open"
2. **Delay**: Set to "0 hours" (immediate)
3. **Follow-up**: Write your follow-up email content

### **Step 4: Test & Send**
1. Click "Test Campaign"
2. Add your email as subscriber
3. Send test email
4. Open the email to trigger follow-up

## 🎨 **Key Features**

### **Dashboard Builder**
- ✅ **Drag & Drop**: Easy widget placement
- ✅ **Real-time Collaboration**: Multiple users editing
- ✅ **Dynamic Theming**: Live color/font changes
- ✅ **Widget Library**: Charts, tables, metrics
- ✅ **Responsive Design**: Works on all devices

### **Email Campaign Engine**
- ✅ **Visual Flow Designer**: Draw email sequences
- ✅ **Smart Triggers**: Open, click detection
- ✅ **Time Delays**: Wait X hours before sending
- ✅ **A/B Testing**: Test different email versions
- ✅ **Analytics**: Track performance metrics

## 🛠️ **Technology Stack**

**Frontend:**
- React.js (UI framework)
- Material-UI (design system)
- Socket.IO (real-time collaboration)
- React Grid Layout (drag & drop)

**Backend:**
- Node.js + Express (API server)
- MongoDB (database)
- Socket.IO (real-time communication)
- Nodemailer (email sending)

## 🎯 **For Interviewers**

### **What Makes This Special:**
1. **Real-time Collaboration**: Like Google Docs for dashboards
2. **No-code Interface**: Business users can create without coding
3. **Email Automation**: Smart triggers based on user behavior
4. **Simple & Clean**: Easy to understand and use

### **Technical Highlights:**
- **Socket.IO**: Real-time updates across multiple users
- **Drag & Drop**: Intuitive widget placement
- **Dynamic Theming**: Live visual customization
- **Email Tracking**: Open/click detection with analytics

### **Business Value:**
- **Faster Dashboard Creation**: No coding required
- **Team Collaboration**: Multiple people can work together
- **Automated Marketing**: Smart email sequences
- **Data-Driven Decisions**: Real-time analytics

## 🚀 **Demo Scenarios**

### **Dashboard Builder Demo:**
1. Create a new dashboard
2. Add a chart widget
3. Change theme colors
4. Show real-time collaboration
5. Resize and move widgets

### **Email Campaign Demo:**
1. Create email campaign
2. Add "Welcome Email" node
3. Add "Trigger" node (email open)
4. Add "Follow-up Email" node
5. Test the automation

This project demonstrates **full-stack development**, **real-time features**, **user experience design**, and **business automation** - perfect for showing technical and business skills! 🎉 