# AI Call Assistant

## Backend setup and deployment

1. Run `cd backend` and `npm install`.
2. Copy `.env.example` to `.env`, then set `MONGO_URI` to your MongoDB Atlas connection string and set a long random `JWT_SECRET`. Never commit this file.
3. For development run `npm run dev`. For production set `NODE_ENV=production` and run `npm start`.
4. In production set `PORT`, `CORS_ORIGIN` (your frontend origin), `MONGO_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, and any voice-provider credentials through the host's environment-variable settings.
5. MongoDB Atlas must allow the deployed server IP/network and have a database user with the required permissions. Configure the voice provider's incoming-call webhook as `POST /api/calls/incoming`.

The AI bridge uses `AI_SERVICE_URL`; it is intentionally not a bundled provider. Set `AI_MOCK_MODE=true` for local interface testing without the Python service.
