# 🚀 **BullMQ & Redis Workflow - Complete Process Flow**

## **📊 Main Architecture Overview**

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[User Creates Email Campaign]
        B[User Sends Manual Email]
        C[User Clicks Email Link]
    end
    
    subgraph "Backend API (Express)"
        D[Campaign Routes]
        E[Email Campaign Engine]
        F[Queue Manager]
    end
    
    subgraph "Redis + BullMQ"
        G[Time Delay Queue]
        H[Idle Time Queue]
        I[Email Send Queue]
        J[Behavior Trigger Queue]
        K[(Redis Storage)]
    end
    
    subgraph "Workers (Background Processing)"
        L[Time Delay Worker]
        M[Idle Time Worker]
        N[Email Send Worker]
        O[Behavior Trigger Worker]
    end
    
    subgraph "External Services"
        P[Email Service<br/>Nodemailer]
        Q[(MongoDB)]
    end
    
    A --> D
    B --> E
    C --> D
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    G --> K
    H --> K
    I --> K
    J --> K
    K --> L
    K --> M
    K --> N
    K --> O
    L --> P
    M --> P
    N --> P
    O --> P
    L --> Q
    M --> Q
    N --> Q
    O --> Q
    
    style A fill:#e1f5fe
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style K fill:#ffebee
    style P fill:#f3e5f5
    style Q fill:#e0f2f1
```

## **⚡ Detailed Email Campaign Flow**

```mermaid
sequenceDiagram
    participant User
    participant API as Express API
    participant Engine as Email Campaign Engine
    participant QM as Queue Manager
    participant Redis
    participant Worker as BullMQ Workers
    participant Email as Email Service
    participant DB as MongoDB
    
    Note over User,DB: 1. MANUAL EMAIL SENDING
    User->>API: POST /campaigns/:id/send
    API->>Engine: sendManualEmail(campaignId)
    
    loop For each recipient
        Engine->>Email: Send manual email
        Engine->>DB: Update recipient.manualEmails[]
        Engine->>Engine: scheduleTriggersForManualEmail()
        
        Note over Engine,Redis: 2. TRIGGER SCHEDULING
        Engine->>QM: scheduleTimeDelayTrigger()
        QM->>Redis: Add job with delay: 2 hours
        Engine->>QM: scheduleIdleTimeTrigger()
        QM->>Redis: Add job with delay: 24 hours
    end
    
    Note over Redis,DB: 3. BACKGROUND PROCESSING
    Redis-->>Worker: Time delay job ready (after 2 hours)
    Worker->>DB: Check if already sent
    Worker->>Email: Send follow-up email
    Worker->>DB: Mark timeDelayEmailSent = true
    
    Note over User,DB: 4. USER BEHAVIOR TRACKING
    User->>API: Click email link
    API->>QM: addBehaviorTriggerJob()
    QM->>Redis: Add immediate behavior job
    Redis-->>Worker: Process click behavior
    Worker->>Email: Send click follow-up
    Worker->>DB: Update analytics
    
    Note over Redis,DB: 5. IDLE TIME PROCESSING
    Redis-->>Worker: Idle time job ready (after 24 hours)
    Worker->>DB: Check user activity
    alt User was idle
        Worker->>Email: Send idle reminder
        Worker->>DB: Update idleEmailSent = true
    else User was active
        Worker->>Worker: Skip idle email
    end
```

## **🔧 BullMQ Queue System Architecture**

```mermaid
graph TD
    subgraph "Queue Manager (/services/queueManager.js)"
        A[scheduleTimeDelayTrigger]
        B[scheduleIdleTimeTrigger]
        C[addEmailSendJob]
        D[addBehaviorTriggerJob]
    end
    
    subgraph "Redis Storage"
        E[bull:time-delay-trigger:waiting]
        F[bull:time-delay-trigger:delayed]
        G[bull:idle-time-trigger:waiting]
        H[bull:email-send:waiting]
        I[bull:behavior-trigger:waiting]
        J[Job Data Storage]
    end
    
    subgraph "Workers (/services/workerService.js)"
        K[Time Delay Worker<br/>Concurrency: 5]
        L[Idle Time Worker<br/>Concurrency: 5]
        M[Email Send Worker<br/>Concurrency: 10]
        N[Behavior Trigger Worker<br/>Concurrency: 5]
    end
    
    subgraph "Job Processing Functions"
        O[processTimeDelayTrigger]
        P[processIdleTimeTrigger]
        Q[sendSingleEmail]
        R[handleUserBehavior]
    end
    
    A --> E
    A --> F
    B --> G
    C --> H
    D --> I
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K
    J --> L
    J --> M
    J --> N
    
    K --> O
    L --> P
    M --> Q
    N --> R
    
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style G fill:#dcedc8
    style H fill:#e1f5fe
    style I fill:#fff3e0
    style J fill:#f3e5f5
```

## **⏰ Time-Based Trigger Flow**

```mermaid
graph LR
    subgraph "T+0: Email Sent"
        A[User Sends Email]
        B[Email Campaign Engine]
        C[Schedule Triggers]
    end
    
    subgraph "T+0+: Immediate Scheduling"
        D[Time Delay Job<br/>Execute in 2 hours]
        E[Idle Time Job<br/>Execute in 24 hours]
        F[Redis Storage<br/>Delayed Jobs]
    end
    
    subgraph "T+2 Hours: Time Delay"
        G[Worker Picks Up Job]
        H[Check Not Already Sent]
        I[Send Follow-up Email]
        J[Update Database]
        K[Schedule Next Trigger]
    end
    
    subgraph "T+24 Hours: Idle Check"
        L[Worker Picks Up Job]
        M{User Activity Check}
        N[Send Idle Email]
        O[Skip - User Active]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    F --> L
    L --> M
    M -->|Idle| N
    M -->|Active| O
    
    style A fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#ffebee
    style F fill:#f3e5f5
    style I fill:#e1f5fe
    style N fill:#ffcdd2
```

## **🎯 Behavior-Triggered Email Flow**

```mermaid
graph TD
    subgraph "User Actions"
        A[User Clicks Email Link]
        B[User Makes Purchase]
        C[User Visits Purchase Page]
        D[User Goes Idle]
    end
    
    subgraph "Tracking & Detection"
        E[Link Tracking<br/>/track/click/:email]
        F[Purchase Tracking<br/>/track/purchase/:email]
        G[Page Visit Tracking<br/>/track/visit/:email]
        H[Idle Time Detection<br/>Scheduled Job]
    end
    
    subgraph "Behavior Queue Processing"
        I[addBehaviorTriggerJob]
        J[Behavior Trigger Queue]
        K[Behavior Worker]
        L[handleUserBehavior]
    end
    
    subgraph "Follow-up Actions"
        M[Send Click Follow-up]
        N[Send Purchase Thank You]
        O[Send Abandonment Email]
        P[Send Idle Reminder]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J
    J --> K
    K --> L
    
    L -->|Click| M
    L -->|Purchase| N
    L -->|Abandonment| O
    L -->|Idle| P
    
    style A fill:#e8f5e8
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#ffebee
    style J fill:#f3e5f5
    style M fill:#dcedc8
    style N fill:#e0f2f1
    style O fill:#ffcdd2
    style P fill:#fce4ec
```

## **🔄 Redis Job Lifecycle**

```mermaid
stateDiagram-v2
    [*] --> Scheduled: Job Created with Delay
    Scheduled --> Waiting: Delay Time Reached
    Waiting --> Active: Worker Picks Up Job
    Active --> Completed: Job Succeeds
    Active --> Failed: Job Fails
    Failed --> Waiting: Retry Attempt
    Failed --> Dead: Max Retries Exceeded
    Completed --> [*]: Job Removed
    Dead --> [*]: Manual Cleanup
    
    note right of Scheduled
        Redis stores with timestamp
        bull:queue:delayed
    end note
    
    note right of Waiting
        Ready for processing
        bull:queue:waiting
    end note
    
    note right of Active
        Being processed by worker
        bull:queue:active
    end note
    
    note right of Failed
        Retry with exponential backoff
        2s → 4s → 8s delays
    end note
```

## **📊 Queue Statistics & Monitoring**

```mermaid
graph TB
    subgraph "Queue Statistics"
        A[getQueueStats Function]
        B[Time Delay Queue Stats]
        C[Idle Time Queue Stats]
        D[Email Send Queue Stats]
        E[Behavior Queue Stats]
    end
    
    subgraph "Metrics Tracked"
        F[Waiting Jobs]
        G[Active Jobs]
        H[Completed Jobs]
        I[Failed Jobs]
        J[Processing Rate]
        K[Success Rate]
    end
    
    subgraph "Redis Data"
        L[bull:queue:waiting.length]
        M[bull:queue:active.length]
        N[bull:queue:completed.length]
        O[bull:queue:failed.length]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    
    B --> F
    B --> G
    B --> H
    B --> I
    C --> F
    C --> G
    C --> H
    C --> I
    D --> F
    D --> G
    D --> H
    D --> I
    E --> F
    E --> G
    E --> H
    E --> I
    
    F --> L
    G --> M
    H --> N
    I --> O
    
    J --> K
    K --> L
    
    style A fill:#e8f5e8
    style F fill:#e1f5fe
    style G fill:#fff3e0
    style H fill:#e0f2f1
    style I fill:#ffcdd2
```

## **🔧 Worker Configuration & Concurrency**

```mermaid
graph LR
    subgraph "Worker Types"
        A[Time Delay Worker<br/>Concurrency: 5]
        B[Idle Time Worker<br/>Concurrency: 5]
        C[Email Send Worker<br/>Concurrency: 10]
        D[Behavior Trigger Worker<br/>Concurrency: 5]
    end
    
    subgraph "Job Processing"
        E[Process 5 Time Delay Jobs]
        F[Process 5 Idle Time Jobs]
        G[Process 10 Email Jobs]
        H[Process 5 Behavior Jobs]
    end
    
    subgraph "Error Handling"
        I[3 Retry Attempts]
        J[Exponential Backoff<br/>2s → 4s → 8s]
        K[Failed Job Storage]
        L[Dead Letter Queue]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J
    J --> K
    K --> L
    
    style A fill:#e8f5e8
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#ffebee
    style I fill:#ffcdd2
    style J fill:#f3e5f5
```