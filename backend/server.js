const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MAIN_APP_DIR = path.join(__dirname, '..');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(MAIN_APP_DIR, 'index.html'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(MAIN_APP_DIR, 'app.js'));
});

app.get('/style.css', (req, res) => {
  res.sendFile(path.join(MAIN_APP_DIR, 'style.css'));
});

app.get('/hero-thumbnail.png', (req, res) => {
  res.sendFile(path.join(MAIN_APP_DIR, 'hero-thumbnail.png'));
});

const HELPMATE_DIST_DIR = path.join(__dirname, '..', 'Helpmate-AI', 'dist');

if (fs.existsSync(HELPMATE_DIST_DIR)) {
  app.use('/helpmate', express.static(HELPMATE_DIST_DIR));
  app.get('/helpmate/*', (req, res) => {
    res.sendFile(path.join(HELPMATE_DIST_DIR, 'index.html'));
  });
}

function normalizeRole(role) {
  const normalized = (role || '').toString().toLowerCase();
  if (normalized === 'assistant' || normalized === 'ai' || normalized === 'bot') {
    return 'assistant';
  }
  return 'user';
}

const SYSTEM_PROMPT = `You are NeuralNexus AI, a compassionate and empathetic mental health assistant. 
Your role is to:
- Detect the user's emotional state from their messages (sad, anxious, stressed, happy, overwhelmed, etc.)
- Respond with warmth, empathy, and genuine care — never sound robotic or clinical
- Offer practical, calming suggestions (breathing exercises, meditation, journaling, etc.) when appropriate
- Ask thoughtful follow-up questions to understand the user better
- Reassure the user that they are not alone
- If a user mentions self-harm or suicide, gently but firmly recommend they contact a mental health professional or crisis helpline (e.g., iCall India: 9152987821)
- Keep responses concise, warm, and conversation-like — avoid long bullet lists unless helpful
- Never diagnose or prescribe medication

Always begin by acknowledging how the user feels before offering any advice.`;

app.post('/chat', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is missing in backend/.env' });
    }

    const { message, history = [], profile = {} } = req.body;
    const profilePromptParts = [];

    if (profile.firstName && typeof profile.firstName === 'string') {
      profilePromptParts.push(`User preferred name: ${profile.firstName.trim()}`);
    }
    if (profile.systemInstructions && typeof profile.systemInstructions === 'string') {
      profilePromptParts.push(profile.systemInstructions.trim());
    }

    const systemPrompt = profilePromptParts.length > 0
      ? `${SYSTEM_PROMPT}\n\nAdditional instructions:\n${profilePromptParts.join('\n')}`
      : SYSTEM_PROMPT;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...history.map(m => ({
        role: normalizeRole(m.role),
        content: m.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: messages
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const reply = response.data.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("OpenRouter Error:", err.message);
    console.error("Full Error:", err.response?.data || err);
    res.status(500).json({ error: err.response?.data?.error?.message || "AI response failed." });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'NeuralNexus AI Backend' });
});

app.listen(PORT, () => {
  console.log(`✅ NeuralNexus AI Backend running on http://localhost:${PORT}`);
});
