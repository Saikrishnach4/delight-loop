# 🛒 Purchase Campaign System

## Overview
The Purchase Campaign System allows you to **select specific users** to send purchase links to, rather than sending purchase links to everyone. This enables targeted marketing campaigns based on user behavior and preferences.

## 🎯 Key Features

### **1. User Selection Methods**
- ✅ **All Recipients** - Send to all active recipients
- ✅ **Selected Recipients** - Manually select specific users
- ✅ **Filtered Recipients** - Target based on behavior criteria
- ✅ **No Campaign** - Disable purchase campaigns

### **2. Smart Filtering**
- ✅ **Opens** - Users who opened emails
- ✅ **Clicks** - Users who clicked links
- ✅ **Purchases** - Users who made purchases
- ✅ **Inactive** - Users who haven't engaged
- ✅ **New** - New recipients only

### **3. Campaign Configuration**
- ✅ **Custom Purchase Amount** - Set your own price
- ✅ **Custom Button Text** - Personalized call-to-action
- ✅ **Tracking Integration** - Complete analytics
- ✅ **Follow-up Triggers** - Automated responses

## 🚀 How to Use

### **Step 1: Configure Campaign Settings**
1. Go to **Campaign Builder**
2. Scroll to **"Purchase Campaign Settings"** section
3. Select **Purchase Campaign Type**:
   - `None` - No purchase campaign
   - `All` - Send to all active recipients
   - `Selected` - Manually select recipients
   - `Filtered` - Use behavior-based filtering

### **Step 2: Select Recipients**

#### **Option A: All Recipients**
```javascript
purchaseCampaignType: 'all'
// Sends to all active recipients in the campaign
```

#### **Option B: Selected Recipients**
```javascript
purchaseCampaignType: 'selected'
selectedPurchaseRecipients: ['user1@example.com', 'user2@example.com']
// Manually select specific users
```

#### **Option C: Filtered Recipients**
```javascript
purchaseCampaignType: 'filtered'
purchaseFilter: {
  type: 'opens', // 'opens', 'clicks', 'purchases', 'inactive', 'new'
  threshold: 1
}
// Target based on user behavior
```

### **Step 3: Customize Campaign**
- **Purchase Link Text**: Customize button text
- **Purchase Amount**: Set your product price
- **Email Content**: Personalized messaging

### **Step 4: Send Campaign**
Click **"Send Purchase Campaign"** button to send emails to selected recipients.

## 📊 Database Schema

### **Campaign Settings**
```javascript
// Purchase Campaign Settings
purchaseCampaignType: {
  type: String,
  enum: ['none', 'all', 'selected', 'filtered'],
  default: 'none'
},
selectedPurchaseRecipients: [String], // Array of email addresses
purchaseFilter: {
  type: {
    type: String,
    enum: ['opens', 'clicks', 'purchases', 'inactive', 'new'],
    default: 'opens'
  },
  threshold: { type: Number, default: 1 }
},
purchaseLinkText: {
  type: String,
  default: '🛒 Purchase Now - $99.99'
},
purchaseAmount: {
  type: Number,
  default: 99.99
}
```

### **Recipient Tracking**
```javascript
purchaseCampaigns: [{ // Track purchase campaigns sent to this recipient
  sentAt: Date,
  campaignType: String,
  purchaseAmount: Number,
  purchaseLinkText: String
}]
```

## 🔗 API Endpoints

### **Send Purchase Campaign**
```http
POST /api/campaigns/:id/send-purchase-campaign
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase campaign sent to 5 recipients",
  "sentCount": 5,
  "failedEmails": [],
  "totalRecipients": 5
}
```

## 🎨 Frontend Implementation

### **Campaign Builder UI**
- ✅ **Purchase Campaign Type** dropdown
- ✅ **Recipient Selection** table with checkboxes
- ✅ **Filter Configuration** for behavior-based targeting
- ✅ **Campaign Customization** fields
- ✅ **Send Campaign** button

### **User Selection Interface**
```javascript
// All Recipients
<Box>
  <Typography variant="h6" color="primary">
    {activeRecipients.length} recipients
  </Typography>
  <Typography variant="body2" color="text.secondary">
    will receive purchase links
  </Typography>
</Box>

// Selected Recipients
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox /* Select All Logic */ />
        </TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Individual recipient rows with checkboxes */}
    </TableBody>
  </Table>
</TableContainer>

// Filtered Recipients
<Box>
  <Typography variant="h6" color="primary">
    {filteredRecipients.length} recipients
  </Typography>
  <Typography variant="body2" color="text.secondary">
    will receive purchase links based on your filter
  </Typography>
</Box>
```

## 🔍 Filtering Logic

### **Opens Filter**
```javascript
// Users who opened emails
recipients.filter(r => 
  r.manualEmails && r.manualEmails.some(email => email.opened)
)
```

### **Clicks Filter**
```javascript
// Users who clicked links
recipients.filter(r => 
  r.manualEmails && r.manualEmails.some(email => email.clicked)
)
```

### **Purchases Filter**
```javascript
// Users who made purchases
recipients.filter(r => 
  r.manualEmails && r.manualEmails.some(email => email.purchased)
)
```

### **Inactive Filter**
```javascript
// Users who haven't engaged
recipients.filter(r => 
  !r.manualEmails || r.manualEmails.every(email => !email.opened && !email.clicked)
)
```

### **New Filter**
```javascript
// New recipients only
recipients.filter(r => 
  !r.manualEmails || r.manualEmails.length === 0
)
```

## 📧 Email Generation

### **Purchase Email Template**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">{{campaign.name}}</h1>
  <p style="color: #666; line-height: 1.6;">
    Hi {{recipient.name}},<br><br>
    We have an exclusive offer just for you!
  </p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h2 style="color: #2ecc71; margin-top: 0;">Special Offer</h2>
    <p style="color: #666;">
      {{campaign.description}}
    </p>
    <p style="font-size: 24px; color: #2ecc71; font-weight: bold; margin: 20px 0;">
      ${{campaign.purchaseAmount}}
    </p>
  </div>
  
  <p style="color: #666; line-height: 1.6;">
    Don't miss out on this limited-time offer!
  </p>
</div>
```

### **Tracking Integration**
```javascript
// Add tracking and purchase button
const trackedEmailContent = emailService.addTrackingToEmail(
  purchaseEmailContent,
  campaign._id.toString(),
  recipient.email,
  baseUrl
);
```

## 📈 Analytics & Tracking

### **Campaign Metrics**
- ✅ **Sent Count** - Number of emails sent
- ✅ **Failed Emails** - List of failed deliveries
- ✅ **Recipient Selection** - Which users were targeted
- ✅ **Campaign Type** - All/Selected/Filtered

### **Individual Tracking**
- ✅ **Purchase Campaigns** - History per recipient
- ✅ **Campaign Type** - Which type was used
- ✅ **Purchase Amount** - Amount offered
- ✅ **Send Timestamp** - When campaign was sent

## 🧪 Testing

### **Test Script**
```bash
# Run purchase campaign test
node test-purchase-campaign.js
```

### **Manual Testing**
1. **Create Campaign** with purchase settings
2. **Select Recipients** (All/Selected/Filtered)
3. **Send Campaign** to target users
4. **Check Analytics** for results
5. **Monitor Conversions** from purchase links

## 💡 Use Cases

### **1. VIP Customer Campaign**
```javascript
purchaseCampaignType: 'selected'
selectedPurchaseRecipients: ['vip1@example.com', 'vip2@example.com']
purchaseAmount: 149.99
purchaseLinkText: '🛒 VIP Exclusive - $149.99'
```

### **2. Re-engagement Campaign**
```javascript
purchaseCampaignType: 'filtered'
purchaseFilter: {
  type: 'inactive',
  threshold: 1
}
purchaseAmount: 79.99
purchaseLinkText: '🛒 Come Back - Special $79.99'
```

### **3. High-Value Customer Campaign**
```javascript
purchaseCampaignType: 'filtered'
purchaseFilter: {
  type: 'purchases',
  threshold: 1
}
purchaseAmount: 199.99
purchaseLinkText: '🛒 Premium Upgrade - $199.99'
```

### **4. New Customer Campaign**
```javascript
purchaseCampaignType: 'filtered'
purchaseFilter: {
  type: 'new',
  threshold: 1
}
purchaseAmount: 49.99
purchaseLinkText: '🛒 Welcome Offer - $49.99'
```

## 🎯 Benefits

### **Targeted Marketing**
- ✅ **Precise targeting** based on user behavior
- ✅ **Reduced spam** by targeting interested users
- ✅ **Higher conversion rates** with relevant offers
- ✅ **Better ROI** through smart segmentation

### **Flexible Campaigns**
- ✅ **Multiple selection methods** for different needs
- ✅ **Customizable content** and pricing
- ✅ **Behavior-based filtering** for smart targeting
- ✅ **Complete tracking** and analytics

### **User Experience**
- ✅ **Relevant offers** based on user behavior
- ✅ **Personalized messaging** with recipient names
- ✅ **Clear call-to-action** with custom button text
- ✅ **Seamless purchase flow** with tracking

## 🚀 Summary

Your **Purchase Campaign System** now provides:

1. **🎯 Smart User Selection** - Choose who gets purchase links
2. **🔍 Behavior-Based Filtering** - Target based on user actions
3. **📧 Customized Campaigns** - Personalized content and pricing
4. **📊 Complete Tracking** - Monitor results and conversions
5. **🔄 Automated Workflow** - Send campaigns with one click

This creates a **data-driven, targeted marketing system** that maximizes conversions while respecting user preferences! 🎉 