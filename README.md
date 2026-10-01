# Industrial Machine Maintenance API

A starter REST API project for an industrial machine maintenance application. This setup provides the Express server, MongoDB connection, environment configuration, and a health-check endpoint.

## Technologies

- Node.js and Express.js
- MongoDB and Mongoose
- dotenv
- Nodemon
- Docker and Docker Compose

## Project structure

```text
src/
+-- config/       # Application configuration, including MongoDB
+-- controllers/  # HTTP request handlers (for future features)
+-- middlewares/  # Express middleware (for future features)
+-- models/       # Mongoose models (for future features)
+-- routes/       # API routes (for future features)
+-- services/     # Application services (for future features)
+-- app.js        # Express app and health-check route
+-- server.js     # Environment loading, database connection, and server startup
```

## Environment variables

Copy `.env.example` to `.env` for local development and set values for your environment.

- `PORT`: API port (defaults to `3000`).
- `MONGO_URI`: MongoDB connection string. Use `mongodb://mongo:27017/maintenance` from Docker Compose; use `mongodb://localhost:27017/maintenance` when running the API directly against a local MongoDB.
- `JWT_SECRET`: Placeholder for future authentication configuration; authentication is not implemented.

## Start with Docker Compose

```bash
docker compose up
```

The API source directory is mounted into the container, and Nodemon restarts the server when source files change. MongoDB data is stored in the `mongo_data` volume.

## Health check

Once the API is running, request:

```http
GET http://localhost:3000/api/health
```

Response:

```json
{
  "message": "API is running"
}
```
