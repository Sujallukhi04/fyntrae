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


## Roles & Permissions

Flexflow supports multiple user roles within an organization, each with different levels of access:

- 👑 **Owner:**  
  - Full access to the organization.
  - Can delete the organization, transfer ownership.
- 🛡️ **Admin:**  
  - Full access to the organization, except for actions reserved for the owner.
- 📊 **Manager:**  
  - Full access to projects, clients, tags, time entries, and reports.
  - Cannot manage the organization or users.
- 👤 **Employee:**  
  - Can track time and use the application, but has no administrative rights.
- 🕳️ **Placeholder:**  
  - Special users that cannot access the organization.
  - used for access that specific memeber time entry 


## Billable Rates Hierarchy

Billable rates in Flexflow determine the price per hour for tracked time and can be set at multiple levels.  
**A lower-level rate always overrides a higher-level rate.**

**Billable rate levels (from highest to lowest priority):**

1. **Project Member:**  
   - A specific user in a specific project.
2. **Project:**  
   - All users in a specific project.
3. **Organization Member:**  
   - A specific user in the organization.
4. **Organization:**  
   - All users in the organization.

> **Note:** Setting the billable rate is optional at all levels.

**How it works:**  
If a billable rate is set for a project member, it overrides the project, organization member, and organization rates.  
If not set, the system checks the next level up.


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

---

## Project Structure

```
flexflow/
  client/   # React frontend
  server/   # Node/Express backend
```

---

## Scripts

### Client

- `npm run dev` – Start the Vite dev server
- `npm run build` – Build for production
- `npm run preview` – Preview production build

### Server

- `npm run dev` – Start the server with hot reload
- `npm run build` – Build the server
- `npm start` – Start the built server

---

## Environment Variables

Both `client` and `server` have `.env.example` files.  
Copy them to `.env` and fill in the required values.


