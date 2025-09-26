# CompileVerse ✨ - Your AI-Powered Coding Companion

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B7?style=for-the-badge&logo=google&logoColor=white)](https://gemini.google.com/)

CompileVerse is not just another online code compiler. It's an intelligent coding environment designed to help you write better, more efficient code by leveraging the power of Google's Gemini AI.

## 👁️ Live Preview

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now!-brightgreen?style=for-the-badge&logo=vercel)](https://compileverse.vercel.app/)

---

## 📸 Project Screenshot

Here's a glimpse of CompileVerse in action:

![CompileVerse Screenshot](CompileVerse.png)

---

## 🌟 Core Features

-   **Multi-Language Support**: Compile and run code in **Java, C++, Python, and C**.
-   **AI-Powered Complexity Analysis**: Instantly get the accurate **Time and Space Complexity** for every execution.
-   **AI Code Review**: Click "AI-Review" to receive an optimized version of your code, complete with its own complexity analysis. Learn best practices on the fly!
-   **User-Friendly Interface**:
    -   **Code Download**: Easily save your code files locally.
    -   **One-Click Copy**: Copy your code or the output with a single click.
    -   **Light & Dark Mode**: Switch between themes for your comfort.

## 🛠️ Tech Stack

-   **Frontend**: React, Tailwind CSS
-   **Backend**: Node.js, Express.js
-   **AI Integration**: Google Gemini API
-   **Containerization**: Docker

## 🚀 Getting Started

Follow these steps in order to get the project running on your local machine.

### **Step 1: Clone the Repository**
First, clone the project repository from GitHub and navigate into the project directory.

```sh
git clone https://github.com/Varni1512/CompileVerse.git
cd CompileVerse
```
Now that you have the code, you can proceed to set up the backend and frontend.

### **Step 2: Set up the Backend (Choose ONE option)**
From the `CompileVerse` root directory, you can set up the backend.

#### **Option A: Run with Docker (Recommended)**
This method uses Docker to run the backend in a containerized environment, which includes all necessary compilers (C, C++, Java) and runtimes (Python).

##### **Prerequisites**
- Docker

##### **Setup**
1.  **Navigate to the backend directory:**
    ```sh
    cd backend
    ```

2.  **Create the `Dockerfile`:**
    Create a file named `Dockerfile` in the `backend` directory with the following content:
    ```Dockerfile
    # Use an official Node.js runtime as a parent image.
    # Using 'slim' is a good practice for smaller image sizes.
    FROM node:20-slim

    # Install all necessary compilers and runtimes in one layer.
    # build-essential: Installs gcc (for C) and g++ (for C++).
    # openjdk-17-jdk: Installs the Java Development Kit (JDK).
    # python3: Installs the Python 3 runtime.
    RUN apt-get update && apt-get install -y build-essential openjdk-17-jdk python3 && \
        # Clean up the apt cache to keep the image size down
        rm -rf /var/lib/apt/lists/*

    # Set the working directory inside the container
    WORKDIR /app

    # Copy package.json and package-lock.json first to leverage Docker's layer caching.
    COPY package*.json ./

    # Install Node.js dependencies
    RUN npm install

    # Copy the rest of your application's source code into the container
    COPY . .

    # Make the app port available to the world outside this container
    EXPOSE 8000

    # Define the command to run your app
    CMD ["node", "index.js"]
    ```

3.  **Create a `.env` file in the `backend` directory:**
    ```sh
    touch .env
    ```
    Add your Gemini API key to this file:
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Build and Run the Docker Container:**
    From inside the `backend` directory, run the following commands:
    ```sh
    # Build the Docker image
    docker build -t compileverse-backend .

    # Run the container from the image
    docker run -d -p 8000:8000 --env-file .env --name compileverse-backend-container compileverse-backend
    ```
The backend server will now be running at `http://localhost:8000`.

---
#### **Option B: Run Manually**
This method requires you to have Node.js and all language compilers (GCC, G++, JDK, Python) installed on your local machine.

1.  **Navigate to the backend directory:**
    ```sh
    cd backend
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Create a `.env` file and add your API key:**
    ```sh
    touch .env
    ```
    Your `backend/.env` file should contain: `GEMINI_API_KEY=YOUR_API_KEY_HERE`
4.  **Start the server:**
    ```sh
    npx nodemon index.js
    ```
The backend server will start on `http://localhost:8000`.

---
### **Step 3: Set up the Frontend**
After your backend is running, open a **new terminal window**. From the `CompileVerse` root directory, set up the frontend.

1.  **Navigate to the frontend directory:**
    ```sh
    # Make sure you are in the root 'CompileVerse' directory first
    cd frontend
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Start the development server:**
    ```sh
    npm run dev
    ```
The frontend will be available at `http://localhost:5173` and will connect to your running backend.

## 🔮 Future Roadmap

-   **Fixie**: An interactive AI chatbot that guides you through coding problems. It will access your code to give hints and explanations without providing the final answer, acting as a true programming tutor.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request to make CompileVerse even better.

---
Made with ❤️ by Varnikumar Patel
