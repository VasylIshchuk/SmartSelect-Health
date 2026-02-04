# SmartSelect Health - Frontend

This directory contains the **Frontend** application for the **SmartSelect Health** platform. It is a modern, responsive web application built with **Next.js 16 (App Router)** and **TypeScript**, designed to facilitate interaction between Patients, Doctors, and Administrators.

## 🛠 Tech Stack

**Core Framework**

* **Next.js 16:** App Router architecture for server-side rendering and routing.
* **React 19:** Utilizing the latest React features and hooks.
* **TypeScript:** Strictly typed codebase for reliability.

**Styling & UI**

* **Tailwind CSS v4:** Utility-first CSS framework (configured via PostCSS).
* **Lucide React:** Iconography.
* **Sonner:** Toast notifications.
* **Victory:** Data visualization and charts (for Admin/Doctor dashboards).

**State & Data**

* **Supabase:** Authentication (Auth) and Database (PostgreSQL).
* **Zod & React Hook Form:** Form validation and handling.
* **SWR / Custom Hooks:** Data fetching and state management.

---

## 🚀 Features & Architecture

The application is divided into three distinct role-based portals, managed via Route Groups `(dashboard)`:

### 1. Patient Portal

* **Dashboard:** Quick actions and upcoming appointment overview.
* **AI Interview:** An interactive chat interface where patients describe symptoms. It supports image attachments and generates a preliminary medical report.
* **Appointments:** Booking flow and history view.

### 2. Doctor Portal

* **Dashboard:** Overview of daily consultations.
* **Availability Manager:** Tools to set working hours and availability slots.
* **Consultations:** Interface for reviewing patient reports and conducting appointments.

### 3. Admin Panel

* **User Management:** Add and update Doctor profiles.
* **Statistics:** Platform usage analytics.

---

## 📂 Project Structure

```bash
frontend/
├── Dockerfile              # Docker configuration for local dev
├── schema.sql              # Database structure (Tables, RLS, Triggers)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Server-side Route Handlers
│   │   │   └── app-logger/ # Logging endpoint (router.ts)
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   ├── login/          # Auth pages
│   │   └── register/
│   ├── components/         # Reusable UI components
│   ├── lib/                # Shared utilities & configuration
│   │   ├── supabase.ts     # Supabase Client initialization
│   │   ├── supabaseAdmin.ts
│   │   └── logger.ts       # Logger utilities
│   ├── data/               # Static data and constants
│   ├── hooks/              # Custom React Hooks (Business Logic)
│   └── types/              # TypeScript definitions
└── package.json

```

---

## ⚡ Getting Started

### Prerequisites

* Node.js v20+
* Yarn or npm
* Docker (optional, for containerized run)


## 🗄 Database Setup

To ensure the application functions correctly, you must apply the database schema to your Supabase project.

1. **Locate the Schema File:** Find the `schema.sql` file in the root directory of this project.
2. **Open Supabase Dashboard:** Navigate to your project in Supabase.
3. **Go to SQL Editor:** Click on the **SQL Editor** icon in the left sidebar.
4. **Run Query:**
* Create a generic "New Query".
* Copy the entire content of `schema.sql`.
* Paste it into the editor and click **Run**.



This process will create the necessary tables (`profiles`, `appointments`, `reports`, `doctors`, `availability`), enable Row Level Security (RLS) policies, and set up the required triggers for user registration.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory. You need to retrieve these keys from your Supabase Project Settings.

### How to find your keys:

1. Go to your **Supabase Dashboard**.
2. Click on **Settings** -> **API Keys**.
3. **Project URL:** Copy the URL from the "Project URL" section.
4. **Anon Key:** Copy the key labeled `anon` `public`.
5. **Service Role Key:** Copy the key labeled `service_role` `secret`.

### Configuration File (`.env.local`)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-long-service-role-secret-key-here

# API Service
NEXT_PUBLIC_API_URL=http://localhost:8000

API_URL_INTERNAL=http://localhost:8000
DOCKER_API_URL_INTERNAL=http://backend:8000

```

> **⚠️ Security Note:** Never commit `.env.local` to version control. The `SUPABASE_SERVICE_ROLE_KEY` has full administrative access to your database and should only be used in server-side API routes (found in `src/app/api`).

---


1. **Clone the repository** and navigate to the frontend directory:
```bash
cd frontend

```


2. **Install dependencies**:
```bash
yarn install --frozen-lockfile

```


3. **Run the development server**:
```bash
yarn dev

```


The app will be available at `http://localhost:3000`.

---


## 🧠 Core Logic & Modules

### Authentication Module

* **Logic File:** `src/hooks/useAuth.ts`
* **Implementation:**
* Uses **Supabase Auth** for session management.
* **Registration:** Automatically creates a corresponding entry in the `profiles` table with the role `patient`.
* **Login Redirection:** Upon successful login, the hook checks the user's role (`admin`, `doctor`, `patient`) from the database and routes them to their specific dashboard automatically.
* **Password Management:** Includes full flows for Reset Password and Update Password.



### AI Interview & Chat System

* **Logic File:** `src/hooks/useChatLogic.ts`
* **Implementation:**
* **Session Persistence:** Chat history and state are saved in `sessionStorage` (`chatSession`) to prevent data loss on refresh.
* **Multi-modal Input:** Supports text input and file attachments (images) for symptom analysis.
* **API Integration:** Sends history and files to an external Python/AI backend via `FormData`.
* **Report Generation:** Handles the `complete` status from the AI to generate and display an `AiReportData` summary card at the end of the interview.



---

## 🐳 Docker & Deployment

The project uses a standard **Dockerfile** optimized for local development and consistency across the team.

### Dockerfile Overview

* **Base Image:** `node:20-alpine` (Lightweight Linux).
* **Ports:** Exposes port `3000`.
* **Command:** Runs `yarn dev`.

### Running with Docker

You can build and run the container manually or via the root Makefile.

```bash
# Build the image
docker build -t smartselect-frontend .

# Run the container
docker run -p 3000:3000 smartselect-frontend

```

---

## 👥 Authors & Ownership

This frontend architecture involves distinct feature ownership:

| Feature / Domain | Responsible Developer | Description |
| --- | --- | --- |
| **Authentication & Admin** | **Kyrylo Kapinos** | Implemented Login, Registration, Password Reset flows, and the Admin Panel for managing doctors and platform statistics. |
| **Dashboards & Patient/Doctor** | **Vasyl Ishchuk** | Implemented the Patient and Doctor Dashboards, the AI Chat Interview logic, Appointment booking, and Availability management. |