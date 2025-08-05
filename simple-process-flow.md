# 📈 **Simple Step-by-Step BullMQ Process Flow**

## **🚀 Complete Email Campaign Process (Linear Flow)**

```mermaid
flowchart TD
    Start([👤 User Starts Email Campaign]) --> A[📝 Create Campaign with Triggers]
    
    A --> B[📧 Send Manual Email to Recipients]
    
    B --> C{📋 Which Triggers Enabled?}
    
    C -->|Time Delay| D[⏰ Schedule Time Delay Job<br/>Execute in X hours/days]
    C -->|Idle Time| E[😴 Schedule Idle Time Job<br/>Execute in Y hours]
    C -->|Behavior| F[🎯 Setup Behavior Tracking<br/>Links & Purchase Pages]
    
    D --> Redis1[(🔴 Redis Storage<br/>Time Delay Queue)]
    E --> Redis2[(🔴 Redis Storage<br/>Idle Time Queue)]
    F --> G[🔗 User Receives Email with<br/>Tracking Links]
    
    Redis1 --> H[⏰ Time Delay Worker<br/>Processes Job After Delay]
    Redis2 --> I[😴 Idle Time Worker<br/>Processes Job After Delay]
    G --> J{🖱️ User Action?}
    
    H --> K[📧 Send Time Delay<br/>Follow-up Email]
    I --> L{💤 User Still Idle?}
    
    L -->|Yes| M[📧 Send Idle<br/>Reminder Email]
    L -->|No| N[⏭️ Skip Idle Email<br/>User Was Active]
    
    J -->|Click Link| O[🎯 Trigger Behavior Job<br/>Immediate Processing]
    J -->|Make Purchase| P[💳 Trigger Purchase Job<br/>Immediate Processing]
    J -->|No Action| Q[⏳ Wait for Scheduled Jobs]
    
    O --> Redis3[(🔴 Redis Storage<br/>Behavior Queue)]
    P --> Redis3
    
    Redis3 --> R[🎯 Behavior Worker<br/>Processes Immediately]
    
    R --> S[📧 Send Behavior-Based<br/>Follow-up Email]
    
    K --> T[📊 Update Database<br/>Analytics & Status]
    M --> T
    S --> T
    N --> T
    
    T --> End([✅ Campaign Processing Complete])
    Q --> H
    Q --> I
    
    style Start fill:#e8f5e8
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style Redis1 fill:#ffebee
    style Redis2 fill:#ffebee
    style Redis3 fill:#ffebee
    style K fill:#dcedc8
    style M fill:#dcedc8
    style S fill:#dcedc8
    style End fill:#e0f2f1
```

## **⚡ Real-Time Example: Welcome Email Campaign**

```mermaid
gantt
    title Email Campaign Timeline Example
    dateFormat X
    axisFormat %H:%M
    
    section Email Sending
    Send Welcome Email                    :milestone, m1, 0, 0m
    
    section Time Delay Trigger
    Schedule 2-Hour Follow-up             :active, td1, 0, 1m
    Execute Time Delay Job                :milestone, m2, 120, 0m
    Send Follow-up Email                  :active, td2, 120, 5m
    
    section Idle Time Trigger
    Schedule 24-Hour Idle Check           :active, it1, 0, 1m
    Execute Idle Check Job                :milestone, m3, 1440, 0m
    Send Idle Email (if needed)           :active, it2, 1440, 5m
    
    section User Behavior
    User Clicks Link (anytime)            :crit, ub1, 30, 1m
    Process Click Behavior Job            :active, ub2, 31, 2m
    Send Click Follow-up                  :active, ub3, 33, 5m
```

## **🔧 Technical Implementation Flow**

```mermaid
flowchart LR
    subgraph "1️⃣ Job Creation"
        A[Queue Manager] --> B[Create Job with Data]
        B --> C[Set Delay/Priority]
        C --> D[Store in Redis]
    end
    
    subgraph "2️⃣ Redis Storage"
        D --> E[bull:queue:delayed<br/>Sorted by execution time]
        E --> F[bull:queue:waiting<br/>Ready for processing]
        F --> G[bull:queue:active<br/>Being processed]
    end
    
    subgraph "3️⃣ Worker Processing"
        G --> H[Worker Picks Up Job]
        H --> I[Execute Job Function]
        I --> J{Success?}
        J -->|Yes| K[Mark as Completed]
        J -->|No| L[Retry with Backoff]
        L --> F
    end
    
    subgraph "4️⃣ Job Completion"
        K --> M[Update Database]
        M --> N[Send Email]
        N --> O[Update Analytics]
        O --> P[Schedule Next Trigger]
    end
    
    style A fill:#e8f5e8
    style E fill:#ffebee
    style F fill:#fff3e0
    style G fill:#e1f5fe
    style K fill:#e0f2f1
    style L fill:#ffcdd2
```

## **📊 Queue Priority & Processing Order**

```mermaid
graph TD
    subgraph "Queue Priorities"
        A[Behavior Triggers<br/>🔥 IMMEDIATE<br/>Priority: 1]
        B[Email Send Jobs<br/>📧 HIGH<br/>Priority: 2]
        C[Time Delay Triggers<br/>⏰ SCHEDULED<br/>Priority: 3]
        D[Idle Time Triggers<br/>😴 LOW<br/>Priority: 4]
    end
    
    subgraph "Worker Allocation"
        E[Behavior Worker<br/>Concurrency: 5<br/>Fast Response]
        F[Email Send Worker<br/>Concurrency: 10<br/>High Throughput]
        G[Time Delay Worker<br/>Concurrency: 5<br/>Scheduled Processing]
        H[Idle Time Worker<br/>Concurrency: 5<br/>Background Processing]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    style A fill:#ff5722
    style B fill:#ff9800
    style C fill:#2196f3
    style D fill:#9e9e9e
```

## **🔄 Error Handling & Retry Logic**

```mermaid
flowchart TD
    A[Job Starts Processing] --> B{Job Executes Successfully?}
    
    B -->|✅ Success| C[Mark as Completed]
    B -->|❌ Error| D[Check Retry Count]
    
    D --> E{Retries < 3?}
    E -->|Yes| F[Wait with Exponential Backoff<br/>2s → 4s → 8s]
    E -->|No| G[Move to Dead Letter Queue]
    
    F --> H[Retry Job Execution]
    H --> B
    
    C --> I[Remove from Queue]
    G --> J[Manual Investigation Required]
    
    style A fill:#e8f5e8
    style C fill:#e0f2f1
    style D fill:#fff3e0
    style G fill:#ffcdd2
    style J fill:#ff5722
```

## **💾 Redis Data Structure Example**

```
📁 Redis Keys for BullMQ:

🔑 bull:time-delay-trigger:id          → "1001" (next job ID)
🔑 bull:time-delay-trigger:waiting     → [] (list of waiting job IDs)
🔑 bull:time-delay-trigger:delayed     → {score: timestamp, value: jobId}
🔑 bull:time-delay-trigger:active      → [] (currently processing jobs)
🔑 bull:time-delay-trigger:completed   → [] (finished jobs)
🔑 bull:time-delay-trigger:failed      → [] (failed jobs)

📋 Individual Job Data:
🔑 bull:time-delay-trigger:jobs:1001   → {
    "id": "1001",
    "data": {
        "campaignId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "recipientEmail": "user@example.com",
        "manualEmailIndex": 0
    },
    "delay": 7200000,
    "timestamp": 1640995200000,
    "attempts": 0
}
```