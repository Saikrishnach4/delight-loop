# 🛒 Purchase Campaign System - Complete Flow Chart

## 📊 System Overview Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PURCHASE CAMPAIGN SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CAMPAIGN CREATION & CONFIGURATION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Create New Purchase Campaign                                              │
│ • Configure Campaign Details (Name, Description)                           │
│ • Set Email Template (Subject, Body)                                       │
│ • Add Recipients (Email, Name)                                             │
│ • Configure Purchase Campaign Settings:                                    │
│   - Purchase Campaign Type (All/Selected/Filtered)                         │
│   - Purchase Button Text & Amount                                          │
│   - Selected Recipients (if applicable)                                    │
│   - Filter Criteria (if applicable)                                        │
│ • Configure Behavior Triggers:                                             │
│   - Idle Trigger (Enabled/Disabled, Minutes)                              │
│   - Open/Click/Purchase/Abandonment Triggers                               │
│   - Follow-up Email Content                                                │
│ • Save Campaign                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PURCHASE CAMPAIGN SENDING PROCESS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User clicks "🛒 Send Purchase Campaign"                                  │
│ • System validates campaign settings                                        │
│ • For each target recipient:                                               │
│   ├─ Create purchase email content                                         │
│   ├─ Add tracking (open/click tracking)                                    │
│   ├─ Add purchase button with custom text/amount                           │
│   ├─ Send email via email service                                          │
│   ├─ Add to manualEmails array with hasLinks=true                         │
│   ├─ Add to purchaseCampaigns array                                        │
│   ├─ Call scheduleTriggersForManualEmail()                                 │
│   └─ Schedule idle trigger in Redis/BullMQ                                 │
│ • Save campaign with updated recipient data                                │
│ • Return success response with trigger summary                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. IDLE TRIGGER SCHEDULING                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • scheduleTriggersForManualEmail() called                                  │
│ • Check for idle triggers in behaviorTriggers                              │
│ • If idle trigger enabled AND (hasLinks=true OR isPurchaseCampaign=true):  │
│   ├─ Calculate idle time (minutes * 60 * 1000)                            │
│   ├─ Call queueManager.scheduleIdleTimeTrigger()                          │
│   ├─ Schedule job in Redis/BullMQ                                          │
│   └─ Log trigger scheduling                                                │
│ • Return trigger summary                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. USER INTERACTION FLOW                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   User Receives │    │   User Opens    │    │   User Clicks   │         │
│  │ Purchase Email  │    │   Email         │    │ Purchase Button │         │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘         │
│            │                      │                      │                 │
│            ▼                      ▼                      ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Track as "Open" │    │ Track as "Open" │    │ Track as "Click"│         │
│  │ Update Analytics│    │ Update Analytics│    │ Update Analytics│         │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘         │
│            │                      │                      │                 │
│            ▼                      ▼                      ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Check Behavior  │    │ Check Behavior  │    │ Redirect to     │         │
│  │ Triggers        │    │ Triggers        │    │ Purchase Page   │         │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘         │
│            │                      │                      │                 │
│            ▼                      ▼                      ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Send Follow-up  │    │ Send Follow-up  │    │ Track Purchase  │         │
│  │ Email (if any)  │    │ Email (if any)  │    │ Page Visit      │         │
│  └─────────────────┘    └─────────────────┘    └─────────┬───────┘         │
│                                                          │                 │
│                                                          ▼                 │
│                                                 ┌─────────────────┐        │
│                                                 │ Purchase Page   │        │
│                                                 │ with "Purchase  │        │
│                                                 │ Now" Button     │        │
│                                                 └─────────┬───────┘        │
│                                                          │                 │
│                                                          ▼                 │
│                                                 ┌─────────────────┐        │
│                                                 │ User Clicks     │        │
│                                                 │ "Purchase Now"  │        │
│                                                 │ on Purchase Page│        │
│                                                 └─────────┬───────┘        │
│                                                          │                 │
│                                                          ▼                 │
│                                                 ┌─────────────────┐        │
│                                                 │ Track as        │        │
│                                                 │ "Purchase"      │        │
│                                                 │ Send Thank You  │        │
│                                                 │ Email           │        │
│                                                 └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. IDLE TRIGGER EXECUTION                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ • After configured time (e.g., 30 minutes):                                │
│   ├─ BullMQ processes idle job                                             │
│   ├─ Call workerService.processIdleTimeTrigger()                          │
│   ├─ Check if campaign is active                                           │
│   ├─ Check if recipient is active                                          │
│   ├─ Check if manual email exists                                          │
│   ├─ Check if idle email already sent                                      │
│   ├─ Check if user has already interacted (open/click)                    │
│   ├─ Check if email has links OR is purchase campaign                     │
│   ├─ Find idle trigger configuration                                       │
│   ├─ Send idle reminder email                                              │
│   ├─ Mark idleEmailSent as true                                            │
│   └─ Update analytics                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. ANALYTICS & TRACKING                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ • All interactions tracked in database:                                    │
│   ├─ Email opens (with tracking pixel)                                     │
│   ├─ Link clicks (with click tracking)                                     │
│   ├─ Purchase page visits                                                  │
│   ├─ Purchase completions                                                  │
│   ├─ Idle reminder emails sent                                             │
│   ├─ Time spent on purchase page                                           │
│   └─ Abandonment tracking                                                  │
│ • Analytics dashboard shows:                                               │
│   ├─ Total emails sent                                                     │
│   ├─ Open rates                                                            │
│   ├─ Click rates                                                           │
│   ├─ Purchase rates                                                        │
│   ├─ Revenue generated                                                     │
│   └─ Idle trigger performance                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Detailed Idle Trigger Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IDLE TRIGGER FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PURCHASE EMAIL SENT                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Email sent to recipient                                                  │
│ • Added to manualEmails array with hasLinks=true                          │
│ • scheduleTriggersForManualEmail() called                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. IDLE TRIGGER SCHEDULED                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Check: idle trigger enabled?                                             │
│ • Check: hasLinks=true OR isPurchaseCampaign=true?                        │
│ • If YES: Schedule idle job in Redis/BullMQ                               │
│ • If NO: No idle trigger scheduled                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. WAIT PERIOD (e.g., 30 minutes)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User receives email but doesn't open/click                               │
│ • Idle timer counts down                                                   │
│ • No user interaction detected                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. IDLE TRIGGER FIRES                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ • BullMQ processes idle job                                                │
│ • processIdleTimeTrigger() called                                          │
│ • Check: campaign active?                                                  │
│ • Check: recipient active?                                                 │
│ • Check: manual email exists?                                              │
│ • Check: idle email already sent?                                          │
│ • Check: user has interacted?                                              │
│ • Check: email has links OR is purchase campaign?                         │
│ • If ALL checks pass: Send idle reminder email                            │
│ • Mark idleEmailSent = true                                                │
│ • Update analytics                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. IDLE REMINDER EMAIL SENT                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Idle reminder email sent to user                                         │
│ • Contains reminder message + purchase button                              │
│ • User gets another chance to purchase                                     │
│ • Complete tracking and analytics                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ✅ Implementation Verification Checklist

### **Campaign Creation & Configuration**
- [ ] ✅ Campaign creation with purchase settings
- [ ] ✅ Email template configuration
- [ ] ✅ Recipient management
- [ ] ✅ Purchase campaign type selection
- [ ] ✅ Purchase button customization
- [ ] ✅ Behavior trigger configuration
- [ ] ✅ Idle trigger setup

### **Purchase Campaign Sending**
- [ ] ✅ Purchase email content creation
- [ ] ✅ Tracking addition (open/click)
- [ ] ✅ Purchase button injection
- [ ] ✅ Email sending via service
- [ ] ✅ manualEmails array update
- [ ] ✅ purchaseCampaigns array update
- [ ] ✅ Trigger scheduling
- [ ] ✅ Redis/BullMQ integration

### **Idle Trigger System**
- [ ] ✅ Idle trigger scheduling
- [ ] ✅ hasLinks flag setting
- [ ] ✅ Purchase campaign detection
- [ ] ✅ BullMQ job scheduling
- [ ] ✅ Idle trigger execution
- [ ] ✅ User interaction checking
- [ ] ✅ Idle reminder email sending
- [ ] ✅ Analytics updates

### **User Interaction Tracking**
- [ ] ✅ Email open tracking
- [ ] ✅ Click tracking
- [ ] ✅ Purchase page visits
- [ ] ✅ Purchase completions
- [ ] ✅ Abandonment tracking
- [ ] ✅ Time spent tracking

### **Analytics & Reporting**
- [ ] ✅ Complete analytics tracking
- [ ] ✅ Purchase metrics
- [ ] ✅ Idle trigger performance
- [ ] ✅ Revenue tracking
- [ ] ✅ User behavior analysis

## 🎯 Expected Behavior

### **When Purchase Campaign is Sent:**
1. ✅ Purchase emails sent to selected recipients
2. ✅ Each email contains purchase button with tracking
3. ✅ Emails added to manualEmails array with hasLinks=true
4. ✅ Idle triggers scheduled for configured time
5. ✅ Complete analytics tracking enabled

### **When User is Idle:**
1. ✅ After configured time (e.g., 30 minutes)
2. ✅ Idle trigger fires automatically
3. ✅ Idle reminder email sent
4. ✅ User gets another chance to purchase
5. ✅ Analytics updated

### **When User Interacts:**
1. ✅ Open/click tracking works
2. ✅ Purchase flow complete
3. ✅ Thank you email sent
4. ✅ Analytics updated
5. ✅ No duplicate idle emails sent

**Please review this flow chart and let me know if any part doesn't match your implementation or if you'd like me to modify anything!** 🎯 