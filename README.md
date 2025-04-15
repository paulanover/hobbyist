# Law Office Management System

A secure, responsive web-based system for managing law office operations including client records, case management, billing, and document repositories.

## Features

- **Authentication System**: Secure login with role-based access control
- **Client Management**: Track and manage client information
- **Case Management**: Create and monitor legal cases
- **Billing Management**: Handle invoices and track payments
- **Document Repository**: Store and organize case-related documents
- **Administrative Panel**: Manage users and system settings

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (running locally or accessible via URI)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd law-office-system
```

2. Install dependencies
```bash
npm run install-all
```

3. Set up environment variables
   - Create a `.env` file in the `server` directory (`/Users/pwa/PERSONAL PROJECT/law-office-system/server/.env`)
   - Add the following variables:
```env
# Backend API Port (e.g., 5001) - MUST be different from frontend port
PORT=5001

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/law_office_management

# JWT Secret Key (generate a strong random string)
JWT_SECRET=your_very_secret_jwt_key_here

# Optional: JWT Expiration (e.g., 60d, 8h)
# JWT_EXPIRE=60d

# Optional: Node Environment
# NODE_ENV=development
```
   - **Important:** Ensure `PORT` is set to a value **different** from the frontend port (which is usually 3000).

4. Start the development servers
```bash
# Make sure you are in the main project directory: /Users/pwa/PERSONAL PROJECT/law-office-system/
npm start
```
   - This command starts both the backend API (on the port specified in `server/.env`, e.g., 5001) and the frontend React app (typically on port 3000).

5. Access the application
   - Open your web browser and navigate to the **frontend URL**, which is typically **`http://localhost:3000`**.
   - **Observe Terminal Output:** Check the terminal where you ran `npm start`. Note the exact ports reported for both the server (API) and the client (React App).
   - If the client starts on a different port (e.g., 3001), use that URL instead (`http://localhost:3001`).

## Troubleshooting

- **`localhost:3000` shows "Law Office Management System API"**:
    - This means the backend API is running on port 3000, conflicting with the frontend.
    - Stop all processes (`Ctrl+C`).
    - Edit `server/.env` and set `PORT` to a different value (e.g., `PORT=5001`).
    - Run `npm start` again and check terminal output for correct ports. Access the frontend via its reported port (usually 3000 or 3001).
- **Port 3000 is already in use** (by something *other* than the backend API):
    - The terminal might ask "Something is already running on port 3000. Would you like to run the app on another port instead? (Y/n)". Press `Y`.
    - Note the new port (e.g., 3001) and access the frontend app via `http://localhost:3001`.
    - Alternatively, find and stop the other process using port 3000 before running `npm start`.
- **Login fails / Cannot connect to API**:
    - Ensure the backend server is running (check terminal output for `Server running on port 5001`).
    - Verify the `baseURL` in `client/src/utils/api.js` matches the backend port (e.g., `http://localhost:5001`).
- **Login page appears on an unexpected port (e.g., 5173)**:
    - You might have another development server running from a different project or terminal. Stop that process.
    - Ensure you are running `npm start` from the correct project directory (`/Users/pwa/PERSONAL PROJECT/law-office-system/`).

## Default Admin Account

For initial login, use the following credentials:

- **Email**: admin@anoversandiego.com
- **Password**: AdminPass123!

**Important**: Change this password immediately after first login for security.

## Tech Stack

- **Frontend**: React, React Router, Context API, Ant Design
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Authentication**: JWT, bcryptjs

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

## Contact

For support or inquiries, please contact the system administrator.
