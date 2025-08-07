# AI-Powered Lead Enrichment System Architecture

## System Overview

This chart illustrates the complete architecture of the POC lead enrichment and scoring system, showing the data flow from initial contact form submission through AI-powered enrichment to final lead classification and routing.

## Architecture Diagram

```mermaid
graph TD
    %% User Interface Layer
    A[Contact Form] --> B[Server Action]
    A --> C[Console Component]
    
    %% Form Processing
    B --> D[Lead Validation & Storage]
    D --> E[(Neon Database)]
    D --> F[Vercel KV Queue]
    
    %% Database Tables
    E --> G[leads table]
    E --> H[companies table]
    E --> I[enrichment_logs table]
    E --> J[lead_activities table]
    
    %% Background Processing
    F --> K[Vercel Cron Job]
    K --> L[AI Enrichment Agent]
    
    %% AI Agent & External APIs
    L --> M[Exa API<br/>Company Intelligence]
    L --> N[Firecrawl<br/>Website Analysis]
    L --> O[OpenAI GPT-4<br/>Intent Analysis]
    L --> P[Perplexity Sonar<br/>Competitive Intel]
    
    %% Data Processing
    M --> Q[Data Synthesis]
    N --> Q
    O --> Q
    P --> Q
    
    %% Scoring System
    Q --> R[Weighted Scoring<br/>0-100 Points]
    R --> S[Firmographic 35%]
    R --> T[Behavioral 25%]
    R --> U[Intent Signals 25%]
    R --> V[Technographic 15%]
    
    %% Classification
    S --> W[Lead Classification]
    T --> W
    U --> W
    V --> W
    
    %% Lead Routing
    W --> X{Score & Criteria}
    X -->|70+ Points| Y[SQL: Sales Qualified]
    X -->|40-69 Points| Z[MQL: Marketing Qualified]
    X -->|<40 Points| AA[Unqualified]
    
    %% Actions
    Y --> BB[Sales Notification]
    Z --> CC[Marketing Nurture]
    AA --> DD[Newsletter Signup]
    
    %% Console Updates
    K --> EE[Progress Updates]
    L --> EE
    Q --> EE
    W --> EE
    EE --> C
    
    %% Caching Layer
    FF[Cache Layer<br/>Vercel KV] --> M
    FF --> N
    FF --> O
    FF --> P
    
    %% Error Handling & Retry
    GG[Retry Logic<br/>Exponential Backoff] --> L
    HH[Circuit Breaker] --> L
    
    %% Mock Data for POC
    II[Mock Behavioral<br/>Data Switch] --> B
    
    %% Styling
    classDef primary fill:#1a1a1a,stroke:#60a5fa,color:#ffffff
    classDef database fill:#1a1a1a,stroke:#10b981,color:#ffffff
    classDef external fill:#1a1a1a,stroke:#f59e0b,color:#ffffff
    classDef processing fill:#1a1a1a,stroke:#8b5cf6,color:#ffffff
    classDef classification fill:#1a1a1a,stroke:#ef4444,color:#ffffff
    
    class A,B,C primary
    class E,G,H,I,J,F,FF database
    class M,N,O,P external
    class K,L,Q,R,GG,HH processing
    class W,X,Y,Z,AA,BB,CC,DD classification
```

## Key Components

### 1. User Interface (Blue)
- **Contact Form**: Initial lead capture interface
- **Server Action**: Next.js server action for form processing
- **Console Component**: POC demonstration interface showing real-time progress

### 2. Database Layer (Green)
- **Neon Database**: PostgreSQL database with Drizzle ORM
- **Core Tables**: leads, companies, enrichment_logs, lead_activities
- **Vercel KV**: Queue system and caching layer

### 3. External APIs (Orange)
- **Exa API**: Company intelligence and recent signals
- **Firecrawl**: Website analysis and tech stack detection
- **OpenAI GPT-4**: Intent analysis and data synthesis
- **Perplexity Sonar**: Competitive intelligence and market data

### 4. Processing Layer (Purple)
- **Vercel Cron**: Background job processing
- **AI Enrichment Agent**: Orchestrates multiple API calls
- **Data Synthesis**: Combines and analyzes enriched data
- **Weighted Scoring**: Multi-factor scoring algorithm

### 5. Classification & Routing (Red)
- **Lead Classification**: SQL/MQL/UNQUALIFIED determination
- **Routing Logic**: Automated lead assignment based on score
- **Actions**: Sales notifications, marketing sequences, newsletter signup

## Data Flow

1. **Lead Capture**: User submits contact form
2. **Immediate Storage**: Lead data stored in database, job queued
3. **Background Enrichment**: AI agent processes lead using multiple APIs
4. **Data Synthesis**: Combined data analysis and scoring
5. **Classification**: Lead categorized based on score and criteria
6. **Routing**: Automatic assignment to appropriate sales/marketing flow
7. **Console Updates**: Real-time progress shown in POC interface

## POC-Specific Features

- **Mock Behavioral Data**: Switch to inject sample engagement data
- **Console Component**: Live demonstration of enrichment process
- **Simplified Architecture**: Focused on core functionality for proof of concept
- **Cost Optimization**: Intelligent caching and rate limiting built-in

## Performance Characteristics

- **Immediate Response**: Lead captured in <100ms
- **Asynchronous Processing**: Enrichment runs in background
- **Fault Tolerance**: Circuit breakers and retry logic
- **Scalable Design**: Queue-based processing with caching
