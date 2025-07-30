# 🛒 Purchase Behavior Integration Guide

## Overview
This guide explains how to integrate purchase tracking into your email campaign engine. The system now supports **purchase** as a behavior trigger alongside **open**, **click**, and **idle**.

## 🎯 What's New

### 1. **Purchase Behavior Trigger**
- Track when users make purchases
- Set minimum purchase thresholds
- Send follow-up emails based on purchase behavior
- Track purchase amounts and revenue

### 2. **Enhanced Analytics**
- Total purchases count
- Total revenue tracking
- Purchase rates and metrics
- Individual purchase tracking per recipient

### 3. **E-commerce Integration**
- REST API endpoints for purchase tracking
- Support for multiple currencies
- Order ID tracking
- Flexible purchase amount thresholds

## 📊 Database Schema Updates

### EmailCampaign Model
```javascript
// New behavior trigger type
behaviorTriggers: [{
  behavior: {
    type: String,
    enum: ['open', 'click', 'idle', 'purchase'], // Added 'purchase'
    required: true
  },
  purchaseThreshold: {
    enabled: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  }
}]

// Enhanced recipient tracking
manualEmails: [{
  purchaseFollowUpSent: { type: Boolean, default: false },
  purchased: { type: Boolean, default: false },
  purchasedAt: Date,
  purchaseAmount: { type: Number, default: 0 },
  purchaseCurrency: { type: String, default: 'USD' }
}]

// New analytics fields
analytics: {
  totalPurchases: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}
```

## 🚀 API Endpoints

### 1. **Test Purchase Behavior**
```http
POST /api/campaigns/:id/test-interactions
Content-Type: application/json
Authorization: Bearer <token>

{
  "recipientEmail": "user@example.com",
  "action": "purchase",
  "purchaseAmount": 99.99,
  "purchaseCurrency": "USD"
}
```

### 2. **Track Purchase (E-commerce Integration)**
```http
POST /api/campaigns/:id/track-purchase
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "purchaseAmount": 149.99,
  "purchaseCurrency": "USD",
  "orderId": "ORD-12345"
}
```

## 🛠️ Frontend Integration

### 1. **Campaign Builder**
- Purchase behavior trigger configuration
- Purchase threshold settings
- Currency selection (USD, EUR, GBP, INR)
- Follow-up email templates

### 2. **Analytics Dashboard**
- Purchase metrics display
- Revenue tracking
- Test purchase button
- Purchase history per recipient

## 💡 Usage Examples

### Example 1: Basic Purchase Tracking
```javascript
// Track a purchase
const result = await emailCampaignEngine.handleUserBehavior(
  campaignId,
  'user@example.com',
  'purchase',
  {
    purchaseAmount: 99.99,
    purchaseCurrency: 'USD'
  }
);
```

### Example 2: E-commerce Integration
```javascript
// In your e-commerce checkout
fetch('/api/campaigns/campaign-id/track-purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'customer@example.com',
    purchaseAmount: 199.99,
    purchaseCurrency: 'USD',
    orderId: 'ORD-67890'
  })
});
```

### Example 3: Purchase Threshold Trigger
```javascript
// Configure in campaign builder
{
  behavior: 'purchase',
  enabled: true,
  purchaseThreshold: {
    enabled: true,
    amount: 50.00,
    currency: 'USD'
  },
  followUpEmail: {
    subject: 'Thank you for your purchase!',
    body: 'We appreciate your business...'
  }
}
```

## 🔄 Workflow

### 1. **Purchase Occurs**
1. User makes a purchase on your website
2. E-commerce system calls `/api/campaigns/:id/track-purchase`
3. System records purchase data
4. Analytics are updated

### 2. **Trigger Evaluation**
1. System checks if purchase meets threshold
2. If threshold met, purchase behavior is triggered
3. Follow-up email is scheduled/sent
4. Purchase is marked as processed

### 3. **Analytics Update**
1. Total purchases count increases
2. Revenue is added to campaign total
3. Individual recipient purchase data is updated
4. Dashboard reflects new metrics

## 🧪 Testing

### Test Script
```bash
# Run purchase behavior tests
node test-purchase-behavior.js
```

### Manual Testing
1. Create a campaign with purchase trigger
2. Send emails to recipients
3. Use "Test Purchase" button in analytics
4. Verify follow-up emails are sent
5. Check analytics are updated

## 🔧 Configuration Options

### Purchase Thresholds
- **Disabled**: Triggers on any purchase amount
- **Enabled**: Only triggers if purchase ≥ threshold amount
- **Supported Currencies**: USD, EUR, GBP, INR

### Follow-up Emails
- Custom subject and body
- Sent immediately after purchase
- Only sent once per recipient per campaign
- Can include purchase amount in email content

## 📈 Analytics Insights

### Key Metrics
- **Total Purchases**: Number of purchases made
- **Total Revenue**: Sum of all purchase amounts
- **Purchase Rate**: Purchases / Total Recipients
- **Average Order Value**: Total Revenue / Total Purchases

### Individual Tracking
- Purchase amount per recipient
- Purchase timestamp
- Currency used
- Follow-up email status

## 🚨 Important Notes

### 1. **Data Persistence**
- Purchase data is stored in MongoDB
- Redis queues handle trigger processing
- Analytics are updated in real-time

### 2. **Error Handling**
- Invalid purchase amounts are handled gracefully
- Missing currency defaults to USD
- Failed triggers are logged but don't break the system

### 3. **Performance**
- Purchase tracking is asynchronous
- Redis ensures reliable job processing
- Analytics updates are optimized

## 🔮 Future Enhancements

### Planned Features
- Purchase category tracking
- Multi-currency analytics
- Purchase funnel analysis
- A/B testing for purchase triggers
- Integration with popular e-commerce platforms

### Customization Options
- Custom purchase thresholds per campaign
- Dynamic email content based on purchase amount
- Purchase-based segmentation
- Revenue attribution tracking

---

## 🎉 Summary

Your email campaign engine now supports complete purchase behavior tracking with:

✅ **Purchase behavior triggers**  
✅ **Purchase threshold configuration**  
✅ **Revenue tracking and analytics**  
✅ **E-commerce API integration**  
✅ **Multi-currency support**  
✅ **Frontend UI components**  
✅ **Comprehensive testing tools**  

This completes your **multi-step, action-aware, and adaptive email sequences** that automatically change based on **User behavior (open, click, purchase, idle)** and **Time (X days after last event)**! 🚀 