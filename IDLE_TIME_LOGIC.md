# 🕐 **IDLE TIME LOGIC IMPLEMENTATION**

## 🎯 **Overview**

The idle time checking logic has been updated to ensure that **idle time starts counting when ANY email sent to the user contains links:**

1. **Original Email Template** (contains links) 
2. **Time Delay Follow-up Email** (contains links)

## 🔄 **Flow Logic**

### **Before (Old Logic):**
- Idle time would start counting immediately after any manual email was sent
- This could lead to premature idle emails being sent

### **After (New Logic):**
- Idle time starts counting when:
  - ✅ Original email template contains links, OR
  - ✅ Time delay follow-up email contains links
- This ensures idle emails are only sent after users have received emails with actionable content (links)

## 📋 **Implementation Details**

### **1. Email Template Detection**
```javascript
// Check if email template contains links
const emailContent = campaign.emailTemplate.body || '';
const hasLinks = emailContent.includes('<a href=') || emailContent.includes('http://') || emailContent.includes('https://');

// Mark email as having passed through Email Template
recipient.manualEmails.push({
  hasLinks: hasLinks,  // This enables idle time checking
  // ... other properties
});
```

### **2. Time Delay Trigger Detection**
```javascript
// When time delay email is sent
recipient.manualEmails[emailData.manualEmailIndex].timeDelayEmailSent = true;
recipient.manualEmails[emailData.manualEmailIndex].hasLinks = true; // Enable idle tracking
```

### **3. Idle Time Logic**
```javascript
// Check if ANY email sent to the user contains links
const originalEmailHasLinks = manualEmail.hasLinks;
const timeDelayEmailSent = manualEmail.timeDelayEmailSent;
const timeDelayFollowUpHasLinks = campaign.timeDelayTrigger?.enabled && 
                                 campaign.timeDelayTrigger?.followUpEmail?.body && 
                                 (campaign.timeDelayTrigger.followUpEmail.body.includes('<a href=') || 
                                  campaign.timeDelayTrigger.followUpEmail.body.includes('http://') || 
                                  campaign.timeDelayTrigger.followUpEmail.body.includes('https://'));

// Start idle time if ANY email contains links
const anyEmailHasLinks = originalEmailHasLinks || (timeDelayEmailSent && timeDelayFollowUpHasLinks);

if (!anyEmailHasLinks) {
  // Skip idle checking - no emails contain links
  continue;
}
```

## 🧪 **Testing Scenarios**

### **Scenario 1: Email with Links**
1. Create campaign with email template containing links
2. Send manual email
3. **Expected**: Idle time checking starts immediately
4. **Log**: "Email contains links - email has passed through Email Template"

### **Scenario 2: Email without Links + Time Delay Trigger with Links**
1. Create campaign with email template (no links) + time delay trigger with follow-up email containing links
2. Send manual email
3. Wait for time delay trigger to send follow-up
4. **Expected**: Idle time checking starts after follow-up email (because it contains links)
5. **Log**: "idle time checking enabled because links found in: Time Delay Follow-up Email"

### **Scenario 3: Email without Links + Time Delay Trigger without Links**
1. Create campaign with email template (no links) + time delay trigger with follow-up email (no links)
2. Send manual email
3. Wait for time delay trigger to send follow-up
4. **Expected**: Idle time checking never starts (because neither email contains links)
5. **Log**: "no emails sent to this user contain links"

### **Scenario 4: Email without Links + No Time Delay Trigger**
1. Create campaign with email template (no links) + no time delay trigger
2. Send manual email
3. **Expected**: Idle time checking never starts
4. **Log**: "no emails sent to this user contain links"

## 📊 **Console Logging**

The system now provides detailed logging to track the flow:

```
📋 IDLE TIME LOGIC: Checking emails where ANY email sent to the user contains links (original email OR time delay follow-up)

📧 Email contains links - email has passed through Email Template
📧 Idle time checking will now be enabled for user@example.com (manual email 1)

✅ user@example.com (manual email 1) - idle time checking enabled because links found in: Original Email Template

📋 IDLE TIME SUMMARY: Completed checking all campaigns for idle time triggers
📋 Remember: Idle time starts counting when ANY email sent to the user contains links (original email OR time delay follow-up)
```

## 🔧 **Files Modified**

1. **`server/services/emailCampaignEngine.js`**
   - Updated `checkIdleTimeTriggers()` method
   - Updated `checkTimeTriggers()` method  
   - Updated `sendManualEmail()` method
   - Updated `sendManualEmailToRecipients()` method
   - Added comprehensive logging

## 🚀 **How to Test**

### **Step 1: Start the Application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd my-app
npm start
```

### **Step 2: Test Email Template with Links**
1. Create a new email campaign
2. Add links to the email template body (e.g., `<a href="https://example.com">Click here</a>`)
3. Add recipients and activate the campaign
4. Send manual email
5. Check console logs for: "Email contains links - email has passed through Email Template"

### **Step 3: Test Time Delay Trigger**
1. Create a new email campaign (no links in template)
2. Enable time delay trigger (set minutes to 1 for testing)
3. Add recipients and activate the campaign
4. Send manual email
5. Wait for time delay trigger to send follow-up
6. Check console logs for: "Time delay email sent - email has now passed through Time Delay Trigger"

### **Step 4: Test Idle Time Trigger**
1. Create a new email campaign with either:
   - Links in email template, OR
   - Time delay trigger enabled
2. Enable idle time trigger (set minutes to 1 for testing)
3. Add recipients and activate the campaign
4. Send manual email
5. Wait for idle time to trigger
6. Check console logs for idle time processing

## ✅ **Expected Results**

- **Original email with links**: Idle time starts immediately
- **Original email without links + time delay follow-up with links**: Idle time starts after follow-up email
- **Original email without links + time delay follow-up without links**: No idle time checking
- **Original email without links + no time delay**: No idle time checking
- **Clear console logging**: Shows exactly which email(s) contain links and enable idle time checking

## 🎉 **Success Indicators**

When the logic is working correctly, you should see:

1. **Clear logging** showing which email(s) contain links and enable idle time checking
2. **Proper timing** - idle emails only sent after emails with actionable content (links)
3. **No premature idle emails** for emails without any links
4. **Consistent behavior** across all email sending methods

**🎯 The idle time logic now properly starts when ANY email sent to the user contains links!** 