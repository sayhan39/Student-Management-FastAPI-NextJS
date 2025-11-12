# Student and Class Management application using FastAPI + Next.js

This project is a monorepo containing a FastAPI backend and a Next.js frontend.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Python 3.8+
*   Node.js and npm

### Server (FastAPI)

1.  Navigate to the `server` directory:
    ```sh
    cd server
    ```
2.  Create a virtual environment:
    ```sh
    python -m venv .venv
    ```
3.  Activate the virtual environment:
    *   On Windows:
        ```sh
        .venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```sh
        source .venv/bin/activate
        ```
4.  Install the required dependencies:
    ```sh
    pip install -r src/requirements.txt
    ```
5.  Run the FastAPI server:
    ```sh
    uvicorn src.app:app --reload
    ```

The server will be running at `http://127.0.0.1:8000`.

### Client (Next.js)

1.  Navigate to the `client` directory:
    ```sh
    cd client
    ```
2.  Install the required dependencies:
    ```sh
    npm install
    ```
3.  Run the Next.js development server:
    ```sh
    npm run dev
    ```

The client will be running at `http://localhost:3000`.
