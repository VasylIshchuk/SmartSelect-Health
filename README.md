# 🏥 SmartSelect Health Manager (Monorepo)

**SmartSelect Health** is a comprehensive medical diagnostic platform powered by Artificial Intelligence. It features a dual-mode AI engine (Cloud/Local LLMs + RAG) for symptom analysis and a full-featured web interface for Patients, Doctors, and Administrators.

---

## 🌐 Live Demo (No Installation Required)

You can explore the application immediately without setting up a local environment. The project is deployed using a hybrid cloud architecture:

* **🖥️ Frontend Application:** **[Launch on Vercel](https://www.google.com/search?q=https://smartselect-health-frontend.vercel.app)**
* **🧠 AI Backend API:** **[View on Hugging Face Spaces](https://www.google.com/search?q=https://huggingface.co/spaces/VasylIshchuk/smartselect-health-ai-backend)**

> **Note:** The live environment is fully functional. You can log in as a patient to test the AI diagnostic interview or as an administrator to manage the clinic.

---

## 🛠️ Local Development (Docker & Make)

This is the recommended way to run the project for development. The entire stack (Database, Backend, Frontend) is containerized and orchestrated via **Docker Compose**.

### 1. Prerequisites

Before you begin, ensure you have the following installed:

* **[Docker Desktop](https://www.google.com/search?q=https://www.docker.com/products/docker-desktop)** (Ensure the Docker daemon is running)
* **[Make](https://www.google.com/search?q=https://www.gnu.org/software/make/)** (Standard on Linux/macOS; for Windows use WSL2 or Git Bash)


#### 🐧 For Windows Users (WSL2)

If you are on Windows, we **strongly recommend** using WSL2 (Windows Subsystem for Linux) instead of PowerShell or Command Prompt. This allows you to run the `Makefile` natively without compatibility issues.

1. **Install Ubuntu:** Open the Microsoft Store and install "Ubuntu".
2. **Open Terminal:** Launch the Ubuntu terminal.
3. **Navigate to Project:** Windows files are mounted under `/mnt/c/`.
```bash
# Example: Accessing your project on the C drive
cd /mnt/c/Users/YourName/Documents/SmartSelect-Health

```

### 2. Environment Configuration

The application requires specific API keys to function (Database connection and AI Provider).

1. **Initialize the configuration file:**
Run the following command to create your `.env` file from the template.
```bash
make setup

```


2. **Fill in the secrets:**
Open the newly created `.env` file in the root directory and populate the variables:
* **Backend / AI:**
* `GROQ_API_KEY`: Required for the primary high-speed LLM. Get it from [Groq Console](https://www.google.com/search?q=https://console.groq.com/).


* **Frontend / Database:**
* `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Public API Key.
* `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Secret Key (required for server-side operations).




> *Tip: You can find Supabase keys in your Project Settings -> API.*



### 3. Start the Application

We use a `Makefile` to simplify Docker commands. To build the images and start the services:

```bash
make start

```

**What happens next?**

1. **Build:** Docker builds the Python (FastAPI) and Node.js (Next.js) images.
2. **Orchestration:** `docker-compose` spins up the containers in detached mode.
3. **Networking:** Internal networking is established between the frontend and backend.

### 4. Access the App

Once the terminal says `✅ System ready!`, access the services at:

* **Frontend (Web App):** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
* **Backend (API Docs):** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)

---

## 🕹️ Management Commands

Use these commands from the root directory to manage the lifecycle of the application.

| Command | Description |
| --- | --- |
| `make help` | Show all available commands. |
| `make setup` | Creates the `.env` file if it doesn't exist. |
| `make start` | Builds images (if changed) and starts the containers in the background. |
| `make stop` | Stops and removes the running containers. |
| `make restart` | Full restart cycle (`stop` followed by `start`). |
| `make logs` | Tail the logs of all containers (Press `Ctrl+C` to exit). |
| `make clean` | **Destructive:** Stops containers and removes images/volumes. Use for a fresh start. |

---

## 📂 Project Structure

This is a Monorepo containing both the AI Backend and the Web Frontend.

```text
.
├── backend/                # Python/FastAPI application
│   ├── app/                # Core logic, LLM services, RAG implementation
│   ├── Dockerfile          # Standard Docker build
│   └── Dockerfile.hf       # Optimized build for Hugging Face Spaces
├── frontend/               # Next.js 16 application
│   ├── src/app/            # App Router (Dashboards, Auth, Chat)
│   └── components/         # UI Components (Doctor/Patient panels)
├── docker-compose.yml      # Orchestration of Backend + Frontend
├── Makefile                # Command shortcuts
└── .env.example            # Template for environment variables

```

*For detailed documentation on specific components, please refer to:*

* **[Backend Documentation](https://www.google.com/search?q=./backend/README.md)** (Architecture, RAG, API Endpoints)
* **[Frontend Documentation](https://www.google.com/search?q=./frontend/README.md)** (Role-based logic, Supabase setup, UI Stack)

---

## 👥 Authors & Credits

**SmartSelect Health** was architected and built by:

### **[Kyrylo Kapinos](https://github.com/kyrylokap)**

* **Backend:** Initial project skeleton, Authentication logic.
* **Frontend:** Authentication flows, Admin Dashboard implementation, Logo design.
* **Database:** Schema and integration for Auth and Admin modules.

### **[Vasyl Ishchuk](https://github.com/VasylIshchuk)**

* **Technical Lead / DevOps:** Dockerization of the stack, CI/CD pipelines, Hugging Face & Vercel integrations.
* **Backend:** Core AI Logic (LLM/RAG), Multi-modal integration, new feature development.
* **Frontend:** Doctor & Patient Dashboards, Chat interfaces.
* **Database:** Schema and logic for Doctor/Patient interactions.