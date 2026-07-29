# UptimeGuard - Cloud-based Service Availability Monitoring and Incident Management System

## Overview

UptimeGuard is a Node.js + MongoDB + React system that continuously monitors registered services/applications for uptime and performance, automatically detects outages, opens and manages incidents through their full lifecycle, and notifies administrators via email (and optionally SMS for critical incidents).

## Features

- **HTTP/HTTPS Status Checks** - Monitor web services with configurable expected status codes
- **TCP Connect Checks** - Reachability testing (in place of ICMP ping)
- **API Health Checks** - Validate health endpoint responses with optional auth headers
- **SSL Certificate Monitoring** - Track certificate expiry dates
- **Automatic Incident Detection** - Consecutive-failure thresholds to prevent false alarms
- **Incident Lifecycle** - Open → Acknowledge → Resolve with full timeline tracking
- **Flapping Detection** - Prevents alert storms during unstable service behavior
- **Maintenance Windows** - Suppress false alarms during planned downtime
- **Email Alerts** - Via Brevo transactional API
- **SMS Alerts** - Optional, critical-severity only (via Termii/Twilio)
- **Escalation** - Automatic escalation for unacknowledged incidents
- **Real-time Dashboard** - Socket.io-powered live updates
- **SLA/Uptime Reporting** - Per-service uptime percentage over selectable periods
- **Public Status Page** - Unauthenticated system status overview

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io, Axios, JWT, Bcrypt  
**Frontend:** React (Vite), Tailwind CSS, Recharts, Socket.io-client  
**Deployment:** Render (backend), Vercel (frontend), MongoDB Atlas (database)  
**External APIs:** Brevo (email), Termii/Twilio (SMS)

## Architecture

```
React Client <-> Express API + Socket.io <-> [Check Engine + Scheduler] + MongoDB
                                              ↕
                                        Brevo (Email)
                                          SMS API
```

## Project Structure

```
uptimeguard/
├── backend/
│   ├── src/
│   │   ├── config/          (db.js, env.js)
│   │   ├── models/          (User, Service, CheckResult, Incident, etc.)
│   │   ├── controllers/     (auth, user, service, incident, dashboard, public)
│   │   ├── routes/          (API route definitions)
│   │   ├── services/
│   │   │   ├── checkEngine/ (httpCheck, tcpCheck, apiHealthCheck, sslCheck, runner)
│   │   │   ├── schedulerService.js
│   │   │   ├── incidentService.js
│   │   │   ├── alertService.js
│   │   │   ├── slaService.js
│   │   │   ├── auditService.js
│   │   │   └── encryptionService.js
│   │   ├── sockets/         (socketHandlers.js)
│   │   ├── middleware/      (auth, rbac, rateLimit)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      (Layout, ServiceCard, IncidentCard, UptimeChart)
│   │   ├── pages/           (Login, Dashboard, Services, Incidents, SLA, Admin, Public)
│   │   ├── hooks/           (useSocket, useServices, useIncidents)
│   │   ├── services/api.js
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Brevo account with API key (for email alerts)
- (Optional) Termii/Twilio account with API key (for SMS alerts)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd uptimeguard
   ```

2. Backend setup:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secret, and API keys
   npm run dev
   ```

3. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Environment Variables

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT tokens |
| BREVO_API_KEY | Brevo transactional email API key |
| SMS_API_KEY | Termii/Twilio API key (optional) |
| FIELD_ENCRYPTION_KEY | Key for encrypting health-check auth headers |
| PORT | Backend server port (default: 4000) |
| CORS_ALLOWED_ORIGIN | Frontend URL for CORS (default: http://localhost:5173) |

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/users/me | Current user profile |
| PATCH | /api/users/me/notification-preferences | Update notification preferences |
| GET | /api/services | List monitored services |
| POST | /api/services | Register a new service |
| PATCH | /api/services/:id | Update service config |
| DELETE | /api/services/:id | Delete a service |
| GET | /api/services/:id/checks | Service check history |
| GET | /api/services/:id/sla | Service SLA report |
| POST | /api/services/:id/maintenance-windows | Schedule maintenance |
| GET | /api/incidents | List incidents (filterable) |
| PATCH | /api/incidents/:id/acknowledge | Acknowledge incident |
| PATCH | /api/incidents/:id/resolve | Resolve incident |
| PATCH | /api/incidents/:id/root-cause | Update root cause note |
| GET | /api/dashboard/summary | Dashboard overview |
| GET | /api/public/status | Public status page data |

## Design Decisions

- **TCP Connect instead of ICMP Ping**: ICMP requires raw sockets/elevated permissions unavailable in typical cloud hosting environments
- **Per-service `setInterval` Scheduling**: Simpler to reason about than a job-queue-based approach for this project scope
- **Email-always, SMS-critical-only**: Cost-conscious design - email is free, SMS incurs per-message costs
- **Severity Snapshotted on Incident**: Prevents retroactive severity changes on in-progress incidents
- **Consecutive Failure/Success Thresholds**: Prevents false alarms from transient blips
- **Flapping Detection**: Cooldown period prevents re-flagging until the service stabilizes