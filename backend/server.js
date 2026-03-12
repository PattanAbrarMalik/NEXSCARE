require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Map history to Gemini format
    const geminiHistory = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    res.status(500).json({ error: 'Failed to get response from AI. Please check your API key and try again.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'NeuralNexus AI Backend' });
});

app.listen(PORT, () => {
  console.log(`✅ NeuralNexus AI Backend running on http://localhost:${PORT}`);
});
