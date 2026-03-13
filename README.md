# NeuralNexus

NeuralNexus uses a Node.js + Express backend in [backend/server.js](backend/server.js). The backend serves the frontend, exposes the auth and API routes, uses Supabase for auth/data, and calls OpenRouter for AI chat.

## Railway

The app is now safe to deploy on Railway without hardcoded `localhost` API calls.

1. Create a Railway project from this repo.
2. Set the start command to `npm start` if Railway does not detect it automatically.
3. Add these Railway environment variables:
	`OPENROUTER_API_KEY`
	`SUPABASE_URL`
	`SUPABASE_SERVICE_ROLE_KEY`
	`NODE_ENV=production`
4. Deploy. Railway will provide `PORT`; the backend already uses it.

After deploy, open the Railway app URL directly. The frontend will use the same host for API calls.
