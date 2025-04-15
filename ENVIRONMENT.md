# WINDSURF Project: Environment Variables Guide

This document lists all required and recommended environment variables (.env settings) for deploying and running the WINDSURF application on DigitalOcean App Platform or any production environment.

---

## 1. Backend (`server/.env`)

| Variable         | Required | Example / Description                                      |
|------------------|----------|-----------------------------------------------------------|
| MONGODB_URI      | Yes      | `mongodb+srv://user:password@cluster.mongodb.net/dbname`  |
| PORT             | Yes      | `8080` (DigitalOcean App Platform default)                |
| JWT_SECRET       | Yes      | `your-very-strong-secret-key`                             |
| JWT_EXPIRE       | Yes      | `60d` (Token expiry, e.g., 60 days)                       |
| NODE_ENV         | Yes      | `production`                                              |
| CLIENT_URL       | Yes      | `https://your-frontend-url`                               |

### Example `server/.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
PORT=8080
JWT_SECRET=your-very-strong-secret-key
JWT_EXPIRE=60d
NODE_ENV=production
CLIENT_URL=https://your-frontend-app.ondigitalocean.app
```

---

## 2. Frontend (`client/.env`)

| Variable           | Required | Example / Description                                     |
|--------------------|----------|----------------------------------------------------------|
| VITE_API_BASE_URL  | Yes      | `https://your-backend-app.ondigitalocean.app/api`        |

### Example `client/.env`:
```
VITE_API_BASE_URL=https://your-backend-app.ondigitalocean.app/api
```

---

## 3. Notes & Best Practices

- **Never commit your .env files to version control.**
- Set all environment variables using the DigitalOcean App Platform dashboard for each service (backend and frontend).
- For local development, create `.env` files in the respective `server/` and `client/` directories.
- Use strong, unique values for secrets (e.g., `JWT_SECRET`).
- Restrict allowed origins using `CLIENT_URL` for CORS in production.
- For MongoDB, use a managed service (e.g., MongoDB Atlas) and restrict access by IP.

---

## 4. Troubleshooting

- If you see CORS errors, double-check that `CLIENT_URL` (backend) and `VITE_API_BASE_URL` (frontend) are set to the correct deployed URLs.
- If authentication fails, ensure the same `JWT_SECRET` is used for signing and verifying tokens.
- For database connection issues, verify your `MONGODB_URI` and network/firewall settings.

---

For further help, see the main README or contact your deployment administrator.
