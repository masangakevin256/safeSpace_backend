# SafeSpace+ Backend

SafeSpace+ is a digital sanctuary designed to bridge the gap between mental health support and technology. This backend serves as the engine for the platform, enabling secure communication, AI-assisted safety monitoring, and seamless management of counseling sessions.

## Core Features

Our backend is built with three main pillars in mind: **Security**, **Safety**, and **Accessibility**.

### 1. Advanced Security & Access Control
- **Role-Based Permissions**: Strict access control for Users, Counselors, and Admins.
- **Secure Auth**: JWT-based authentication with refresh token rotation and `httpOnly` cookie storage.
- **Data Privacy**: Built-in safeguards in our controllers ensure sensitive personal data is never over-exposed in API responses.

### 2. Intelligent Safety Monitoring
- **Integrated AI**: Uses HuggingFace's Llama-3 models to analyze user check-ins for emotional risk.
- **Safety Flags**: System-wide event triggers that alert counselors if a user shows critical signs of distress.
- **Pulse Tracking**: A dynamic "Pulse Level" system that helps counselors quickly identify which users might need immediate care.

### 3. Real-time Communication
- **Live Chat**: Instant messaging powered by **Socket.IO** for active counseling sessions.
- **Managed Sessions**: A robust session queue system with auto-assignment logic to match users with available counselors efficiently.
- **Smart Notifications**: Multi-channel notification system (In-app and Email via SendGrid) to keep users and counselors connected.

## The Technical Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js (v5+)
- **Database**: PostgreSQL (pg-node)
- **AI Engine**: HuggingFace Inference API
- **Real-time**: Socket.IO
- **Email Service**: SendGrid (@sendgrid/mail)
- **Utilities**: `bcrypt` for hashing, `jsonwebtoken` for security, `date-fns` for time management.

## Project Structure

To keep things organized, we follow a modular pattern:
- **`app.js` & `server.js`**: The entry points that bootstrap our logic and real-time sockets.
- **`controller/`**: The core logic—where sessions are created, AI is queried, and users are managed.
- **`routes/`**: Clean, resource-based API endpoints.
- **`middlewares/`**: Our defensive layer—handling authentication, role checks, and event logging.
- **`config/`**: Centralized settings for database connections and security whitelists.
- **`utils/`**: Helper modules for system-wide tasks like sending emails and socket initialization.

## Getting Started

### Prerequisites
- Node.js installed on your machine.
- A PostgreSQL database (Local or Cloud).
- API Keys for SendGrid and HuggingFace.

### Installation

1.  **Clone the repository** and install dependencies:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file in the root directory and fill in your credentials:
    ```env
    PORT=3000
    DATABASE_URI=your_postgresql_uri
    ACCESS_TOKEN_SECRET=your_secret_key
    REFRESH_TOKEN_SECRET=your_refresh_secret
    SENDGRID_API_KEY=your_sendgrid_key
    EMAIL_FROM=your_sender_address
    HUGGING_FACE_API_KEYS=your_huggingface_token
    ```

3.  **Run the application**:
    - **Development**: `npm run dev` (starts with Nodemon)
    - **Production**: `npm start`

---
*SafeSpace+ Backend — Empowering support through technology.*
