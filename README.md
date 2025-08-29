# Flexflow

**Flexflow** is a modern, full-featured time tracking and project management platform.  
It helps teams and organizations track time, manage projects, assign tasks, and handle clients with ease.

## Features

- ⏱️ **Time Tracking:** Track your time with a modern and easy-to-use interface.
- 📁 **Projects:** Create and manage projects, and assign project members.
- ✅ **Tasks:** Create and manage tasks, and assign tasks to projects.
- 👥 **Clients:** Create and manage clients, and assign clients to projects.
- 💵 **Billable Rates:** Set billable rates for projects, project members, organization members, and organizations.
- 🏢 **Multiple Organizations:** Create and manage multiple organizations with one account.
- 🛡️ **Roles and Permissions:** Fine-grained control for creating and managing organizations and access.
- 🚀 **Future Enhancement:**
  - 🔄 **Import:** Import your time tracking data from other applications (Supported: Toggl, Clockify, Timeentry CSV).

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Other:** JWT Auth, Zod validation, Lucide Icons

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL (or compatible database)

### Clone the Repository

```sh
git clone https://github.com/Sujallukhi04/flexflow.git
cd flexflow
```

### 1. Setup the Server

```sh
cd server
cp .env.example .env
# Edit .env with your database credentials

npm install
npx prisma migrate dev
npm run dev
```

### 2. Setup the Client

```sh
cd ../client
cp .env.example .env
# Edit .env if needed (API URL, etc.)

npm install
npm run dev
```
