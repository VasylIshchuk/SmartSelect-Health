---
title: SmartSelect Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
license: mit
---


# 🧠 SmartSelect Health - AI Backend

A robust, multi-modal AI backend designed for preliminary medical diagnostics. This system powers the SmartSelect Health platform, providing intelligent, context-aware interactions through a Hybrid RAG architecture and Dual-Mode AI engine.

> **Note:** This documentation covers the **Backend** portion of the monorepo.

---

## 🏗️ Architecture & Core Features

This backend is built on **FastAPI** and operates on a **Dual-Mode AI Engine**, allowing it to switch between high-performance cloud inference and fallback local execution.

### 🌟 Key Capabilities

* **Hybrid RAG System**: Combines a local vector database (FAISS) with Large Language Model knowledge. It prioritizes retrieved medical data (MedlinePlus) and fills gaps with internal model knowledge, enforcing strict citation rules.
* **Multi-Modal Analysis**: Capable of processing both **Text** (symptoms) and **Images** (visual symptoms) simultaneously to generate more accurate reports.
* **Agentic Tool Use**: The AI does not just "chat"; it uses structured tools (`provide_response`) to decide when to ask follow-up questions and when to generate a final diagnosis report.
* **Security Guardrails**:
* **Semantic Injection Detection**: Blocks jailbreak attempts (e.g., "Ignore previous instructions") by analyzing embedding similarity.
* **Input Sanitization**: Prevents path traversal and scrubbs Markdown from JSON outputs.


* **Dual Deployment Strategy**: optimized Docker configurations for both standard environments and Hugging Face Spaces.

### 🧩 Technical Stack

* **Framework**: FastAPI
* **LLM Provider (Primary)**: Groq API (`meta-llama/llama-4-scout-17b-16e-instruct`)
* **LLM Provider (Fallback)**: Local Hugging Face Model (`EleutherAI/gpt-neo-125M`)
* **Vector Store**: FAISS (Facebook AI Similarity Search)
* **Embeddings**: `all-MiniLM-L6-v2` (SentenceTransformers)

---

## 🚀 Setup & Installation

### Prerequisites

* Python 3.10+
* Docker (optional)
* Groq API Key

### 1. Environment Configuration & API Keys

To run the backend, you need a **Groq API Key**.

1. Go to the **[Groq Cloud Console](https://console.groq.com/keys)**.
2. Log in and click **"Create API Key"**.
3. Copy the generated key string.

Create a `.env` file in the `backend/` root and paste your key:

```ini
GROQ_API_KEY=gsk_your_generated_key_here...

# Optional overrides (defaults are usually sufficient)
MODEL_NAME=mixtral-8x7b-32768
LOCAL_MODEL_NAME=EleutherAI/gpt-neo-125M

```

### 2. Local Installation

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

```

### 3. Build the RAG Knowledge Base (CRITICAL STEP)

Before running the app, you must generate the vector index. The app cannot retrieve medical context without this.

```bash
# Run the ETL script to download data, embed it, and save the .index file
python -m app.scripts.build_rag_index

```

*This will create `data/knowledge_base/medline.index` and `medline_meta.pkl`.*

### 4. Run the Server

```bash
# Run via uvicorn (host 0.0.0.0 is crucial for Docker containers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

```

---

## 🐳 Docker & Deployment

The project uses a sophisticated CI/CD flow to handle deployment limitations on Hugging Face Spaces.

### Local Development (Standard Dockerfile)

A standard `Dockerfile` is pre-configured to set up the complete Python environment, install system dependencies, and expose the necessary ports. You can build and run the container using standard Docker commands, ensuring your `.env` variables are passed through.


### Hugging Face Deployment (CI/CD)

The monorepo includes a GitHub Actions workflow that handles deployment to Hugging Face.

1. **Trigger**: Push to `main` (with backend changes).
2. **The Swap**: The workflow automatically **swaps** the standard `Dockerfile` with `Dockerfile.hf`.
* *Why?* `Dockerfile.hf` is optimized to avoid downloading the entire monorepo history/context, keeping the build light for the specific constraints of HF Spaces.


3. **Push**: The artifacts are pushed to the Hugging Face git repository.

---

## 🔌 API Reference

### `POST /ask`

The primary endpoint for user interaction.

**Headers**: `Content-Type: multipart/form-data`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `message` | string | Yes | The user's current symptom description. |
| `history` | JSON string | No | Previous chat history (for context awareness). |
| `images` | File[] | No | List of image files (analyzed by vision model). |
| `mode` | string | No | `api` (Groq) or `local` (Offline fallback). Default: `api`. |
| `k` | int | No | Number of RAG documents to retrieve. Default: `5`. |

**Response Example (Chat)**:

```json
{
  "status": "chat",
  "message": "I see redness on your finger. How long has it been swollen?"
}

```

**Response Example (Final Report)**:

```json
{
  "status": "complete",
  "report": {
    "diagnosis": "Potential Paronychia",
    "confidence": "High",
    "advice": "Soak in warm water...",
    "sources": ["[ID: 123, SOURCE: medlineplus.gov]"]
  }
}

```

---

## 📂 Project Structure

```text
backend/
├── app/
│   ├── core/              # Config, Logging, Exceptions
│   ├── domain/            # Pydantic Models, Prompts
│   ├── services/
│   │   ├── llm_service.py # Groq + Local Model Logic
│   │   └── rag_service.py # FAISS Vector Search
│   ├── utils/
│   │   ├── guardrails.py  # Security & Injection Protection
│   │   ├── tools.py       # Function Calling Definitions
│   ├── main.py        # FastAPI Entrypoint
├── data/
│   └── knowledge_base/    # Generated .index and .pkl files store here
├── scripts/
│   └── build_rag_index.py # ETL Script for Knowledge Base
├── Dockerfile             # Standard Deployment
├── Dockerfile.hf          # Optimized for Hugging Face Spaces
└── requirements.txt

```

---

## 👥 Authors & Credits

* **Kyrylo Kapinos**: Project Skeleton, Backend Architecture & Infrastructure.
* **Vasyl Ishchuk**: Core Logic Implementation, AI Module Integration, RAG Data Flows & Final Functionality.