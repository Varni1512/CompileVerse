<div align="center">
  <h1>CompileVerse ✨</h1>
  <p><strong>Your AI-Powered Intelligent Code Companion & Autonomous Agentic IDE</strong></p>
  
  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://js.langchain.com/"><img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" /></a>
    <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq_LLaMA_3.3-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>
  
  <p>
    <a href="https://compileverse.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20Now!-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
  </p>
</div>

<hr />

## 📖 Overview

**CompileVerse** is an advanced, production-grade AI-powered online integrated development environment (IDE). Designed for software engineers, competitive programmers, and students, it elevates standard browser compilers into an **Autonomous Agentic Coding Assistant**.

Powered by a **LangChain Retrieval-Augmented Generation (RAG) pipeline**, **Groq LLaMA-3.3**, **Voice AI (STT & TTS)**, and **Sandboxed Native Execution Runtimes**, CompileVerse diagnoses runtime errors, calculates computational complexities, tests edge cases autonomously with tool calling, and provides verified, hallucination-free code tutoring.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| 📚 **LangChain RAG Knowledge Base** | Vector search over official C++ STL, Python, Java standard libraries, and DSA algorithmic patterns to ground AI tutoring in verified documentation. |
| 🎙️ **Voice AI Assistant (STT & TTS)** | Hands-free coding mentorship with real-time Speech-to-Text voice recognition and educational speech synthesis with natural audio filtering. |
| 🛠️ **Autonomous Agentic Tool Calling** | Equipped with LangChain function calling (`executeCodeTool`, `searchDocsTool`), enabling the AI to test code, verify outputs, and diagnose runtime bugs autonomously. |
| 🛡️ **Strict Mentor Guardrails** | Non-negotiable context and language boundaries: strictly declines cross-language drift and unrelated queries to prevent hallucinations. |
| 🎚️ **Draggable & Resizable Panels** | Vertical divider handle allowing smooth panel resizing and a 1-click collapse button to expand the AI Tutor to full 100% height. |
| 🌍 **Multi-Language Sandbox** | Write and execute code natively in **C++, Java, and Python** in isolated execution runtimes. |
| 🧠 **AI Code Review & Mentor** | Context-aware tutoring providing step-by-step hints, concept breakdowns, and bug diagnosis without spoon-feeding solutions. |
| ⏱️ **Complexity Analysis** | Instantly calculates and breaks down the **Time and Space Complexity** (Big-O notation) of your algorithm. |
| 🐞 **RAG-Backed Error Debugger** | Analyzes compiler errors, NPEs, segmentation faults, and out-of-bounds traps with corresponding official documentation fixes. |
| 📝 **Multi-Test Case Suite** | Validate algorithms against multiple custom inputs and expected outputs simultaneously with batch imports. |
| 🎨 **Advanced IDE Experience** | Powered by Monaco Editor, dynamic themes, keyboard shortcuts, fast copy, and one-click file download. |
| 🛡️ **Admin Analytics Dashboard** | Built-in analytics, per-IP rate limiting, and real-time execution metrics accessible via `#dashboard`. |

---

## 🏗️ System Architecture

CompileVerse operates on a modular, agentic client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│   Monaco Editor • Voice AI (STT/TTS) • Resizable Layout     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend Gateway (Express.js)               │
│   Rate Limiter • Security & CORS • Child Process Sandbox    │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│   LangChain RAG & Agent Hub  │     │   Native Execution Engine    │
│  - Vector Space Retriever    │     │  - C++ (g++) / Java (JDK)    │
│  - Curated Docs Knowledge    │     │  - Python 3 Runtime          │
│  - ChatGroq (LLaMA-3.3)      │     │  - Timeout & Memory Bounds   │
│  - Tools (executeCodeTool)   │     │  - Multi-Test Case Runner    │
└──────────────────────────────┘     └──────────────────────────────┘
```

### Core API Endpoints

- `POST /run` - Executes a single program and returns stdout/stderr with execution timing.
- `POST /run-tests` - Executes code against an array of test cases simultaneously.
- `POST /analyze` - Calculates Big-O Time & Space complexity.
- `POST /ai-review` - Triggers the LangChain RAG & Agentic Tool Calling pipeline.
- `POST /explain-error` - RAG-grounded compiler/runtime error explanation.
- `POST /api/admin/login` - Admin authentication for usage controls and rate limiting.

---

## 🛠️ Tech Stack & Dependencies

### Client Side
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Lucide Icons
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Voice AI**: Web SpeechRecognition (STT), Web SpeechSynthesis (TTS)

### Server Side & AI Pipeline
- **Runtime**: Node.js v18+ & Express.js
- **AI Orchestration**: **LangChain** (`@langchain/core`, `@langchain/groq`)
- **LLM Engine**: **Groq API** (`llama-3.3-70b-versatile`)
- **RAG Architecture**: Vector Space TF-IDF / Cosine Similarity Retriever over curated official documentation
- **Database**: MongoDB (Mongoose) for rate limiting & execution analytics
- **Security & Sandbox**: Helmet, Express Rate Limit, isolated child process temp sandboxes

---

## ⚙️ Local Development Setup

To run CompileVerse locally:

### 1. Prerequisites
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v18+)

### 2. Clone the Repository
```bash
git clone https://github.com/Varni1512/CompileVerse.git
cd CompileVerse/CompileVerse-main
```

### 3. Backend Setup
```bash
cd backend
npm install
```

**Configure Environment Variables (`backend/.env`):**
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_ID=llama-3.3-70b-versatile
MONGODB_URI=your_mongodb_connection_string
ADMIN_PASSWORD=admin123
```

**Start the Backend:**
```bash
npm run dev
# or: node index.js
```
*Backend runs on `http://localhost:8000`.*

### 4. Frontend Setup

Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📜 License

This project is open-source and available under the MIT License.

---
<div align="center">
  <b>Designed and Developed with ❤️ by Varnikumar Patel</b>
</div>
