# Online Bookstore Project Setup Guide

This project consists of four main components: Backend, Frontend, Chatbot Service, and Recommendation Service. Here are the instructions to install and run each component.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Python](https://www.python.org/) (version 3.9 or later)
- [pip](https://pip.pypa.io/en/stable/installation/)

## 1. Backend (NestJS)

The backend is responsible for handling business logic, database management, and providing APIs for the frontend.

1.  **Navigate to the backend directory:**

    ```bash
    cd online-bookstore/backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the backend server (development mode):**
    ```bash
    npm run start:dev
    ```
    The server will run at `http://localhost:3000`.

## 2. Frontend (React)

The frontend is the user interface of the web application.

1.  **Navigate to the frontend directory:**

    ```bash
    cd online-bookstore/frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the frontend application:**
    ```bash
    npm start
    ```
    The application will automatically open in your browser at `http://localhost:3000`. (Note: If the backend is also running on port 3000, React will prompt you to switch to another port, like 3001).

## 3. Chatbot Service (Python - FastAPI)

This service provides an intelligent chatbot feature for users.

1.  **Navigate to the chat directory:**

    ```bash
    cd online-bookstore/chat
    ```

2.  **Install Python dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the chatbot server:**
    ```bash
    uvicorn chat_api:app --port 8000 --reload
    ```
    The service will run at `http://localhost:8000`.

## 4. Recommendation System (Python - FastAPI)

This service provides book recommendations to users based on their behavior.

1.  **Navigate to the recommend_system directory:**

    ```bash
    cd online-bookstore/recommend_system
    ```

2.  **Install Python dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the recommendation server:**
    ```bash
    uvicorn main:app --port 8081 --reload
    ```
    The service will run at `http://localhost:8081`.

---

**Default Port Summary:**

- **Backend:** `30001`
- **Frontend:** `3000`
- **Chatbot:** `8000`
- **Recommendation:** `8081`

You need to ensure all four services are running for the application to be fully functional.
