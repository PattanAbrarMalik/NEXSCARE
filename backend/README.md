# NeuralNexus AI Backend

Express.js backend server for the NeuralNexus mental health AI chatbot powered by OpenRouter, with Supabase-backed auth and user data.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your OpenRouter and Supabase credentials:
     ```
     OPENROUTER_API_KEY=your_api_key_here
     SUPABASE_URL=https://your-project-ref.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

3. **Start the server:**
   ```bash
   # Production
   npm start

   # Development (with auto-reload)
   npm run dev
   ```

The server will run on `http://localhost:3001` and also bind to your machine's LAN IP so other devices on the same network can reach it at `http://<your-computer-ip>:3001`.

## API Endpoints

### POST /chat
Send a message to the AI chatbot.

**Request:**
```json
{
  "message": "I'm feeling anxious",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi, how are you?" }
  ]
}
```

**Response:**
```json
{
  "reply": "I understand you're feeling anxious..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "service": "NeuralNexus AI Backend"
}
```

## Features

- Mental health-focused conversational AI
- Emotional state detection
- Empathetic and personalized responses
- Crisis intervention guidance
- Conversation history support
- CORS enabled for frontend integration
- Supabase-backed sign up, sign in, and diary storage
