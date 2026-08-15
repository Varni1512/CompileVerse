<div align="center">
  <h1>CompileVerse ✨</h1>
  <p><strong>Your AI-Powered Intelligent Code Companion</strong></p>
  
  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
    <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" /></a>
  </p>
  
  <p>
    <a href="https://compileverse.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20Now!-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
  </p>
</div>

<hr />

## 📖 Overview

**CompileVerse** is an advanced, AI-driven online integrated development environment (IDE). Designed for developers, educators, and students, it provides a seamless and highly optimized environment for coding, testing, and debugging. By integrating **Lightning-Fast AI (via Groq)** and robust native execution runtimes, CompileVerse elevates the standard online coding experience into a professional-grade assistant.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| 🌍 **Multi-Language Support** | Write and execute code natively in **C++, Java, and Python** in isolated environments. |
| 🧠 **AI Code Review** | Instant, context-aware code reviews providing optimization suggestions and best practices. |
| ⏱️ **Complexity Analysis** | Automatically calculates and breaks down the **Time and Space Complexity** (Big-O) of your logic. |
| 🐞 **AI Error Explanation** | Say goodbye to cryptic stack traces. Our AI analyzes your runtime errors and explains how to fix them. |
| 📝 **Multi-Test Case Suite** | Validate your algorithms against multiple custom inputs and expected outputs simultaneously. |
| 🎨 **Advanced IDE Experience** | Features Monaco Editor, Auto-Save, Multiple Themes, Keyboard Shortcuts, and One-Click Code Download. |
| 🧹 **Native Code Formatting** | Built-in industry-standard formatters (`black` for Python, `clang-format` for C/C++/Java). |
| 🛡️ **Admin Dashboard** | Built-in analytics and AI rate-limiting management for server administrators. |

---

## 🏗️ System Architecture

CompileVerse uses a modern client-server architecture:

- **Frontend (React + Vite)**: A highly responsive UI utilizing Tailwind CSS and Monaco Editor. Handles state management, local storage persistence, and API orchestration.
- **Backend (Node.js + Express)**: A secure execution engine. It accepts code payloads, securely spawns child processes for native compilation/execution, and interacts with the Groq API for AI capabilities.
- **Database (MongoDB)**: Stores execution analytics, AI usage metrics, and IP-based rate limiting configurations.

### Core API Endpoints

- `POST /run` - Executes a single file and returns stdout/stderr.
- `POST /run-tests` - Executes code against an array of test cases.
- `POST /analyze` - Analyzes time/space complexity of the provided code.
- `POST /ai-review` - Streams an intelligent code review using LLM context.
- `POST /explain-error` - Provides a human-readable explanation of runtime/compilation errors.

---

## 🛠️ Tech Stack & Dependencies

### Client Side
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Lucide Icons
- **Editor**: Monaco Editor (`@monaco-editor/react`)

### Server Side
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Security & Optimization**: Helmet, Express Rate Limit, CORS
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Groq API (LLaMA 3)

### Environment Tools
- **Containerization**: Docker
- **Compilers/Interpreters**: GCC (C/C++), JDK (Java), Python 3
- **Formatters**: `clang-format`, `black`

---

## ⚙️ Local Development Setup

To run CompileVerse locally, follow the steps below.

### 1. Prerequisites
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) (Recommended for backend)

### 2. Clone the Repository
```bash
git clone https://github.com/Varni1512/CompileVerse.git
cd CompileVerse
```

### 3. Backend Setup (Docker - Recommended)
Using Docker ensures that all compilers and formatters are perfectly configured and sandboxed.

```bash
cd backend
touch .env
```

**Environment Variables (`backend/.env`)**
Add the following to your `.env` file:
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_connection_string
ADMIN_PASSWORD=your_secure_admin_password
CORS_ORIGIN=*
```

**Build and Start the Container:**
```bash
# Build the image
docker build -t compileverse-backend .

# Run the container
docker run -d -p 8000:8000 --env-file .env --name compileverse-backend-container compileverse-backend
```
*The API will be available at `http://localhost:8000`.*

### 4. Frontend Setup

Open a new terminal window at the project root.

```bash
cd frontend
npm install
npm run dev
```
*The web interface will be available at `http://localhost:5173`.*

---

## 🤝 Contributing

We welcome contributions to CompileVerse! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

This project is open-source and available under the standard MIT License.

---
<div align="center">
  <b>Designed and Developed with ❤️ by Varnikumar Patel</b>
</div>
