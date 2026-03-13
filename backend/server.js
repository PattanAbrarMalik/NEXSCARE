const express = require('express');
const cors = require('cors');
const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── SUPABASE CLIENT ──────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_URL.includes('your-project-ref') &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase')) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log('✅ Supabase client initialised');
} else {
  console.warn('⚠️  Supabase not configured — fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
}

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
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

// ── NEARBY PLACES (Overpass / OpenStreetMap — no API key required) ──────────
app.get('/api/nearby-places', async (req, res) => {
  const { type, lat, lng } = req.query;
  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);
  const inIndia = latN >= 6.0 && latN <= 38.6 && lngN >= 68.0 && lngN <= 97.5;

  if (!type || !['hospital', 'pharmacy'].includes(type) ||
      isNaN(latN) || isNaN(lngN) ||
      latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
    return res.status(400).json({ error: 'Valid type (hospital|pharmacy), lat, and lng are required' });
  }

  if (!inIndia) {
    return res.status(400).json({ error: 'Nearby map is currently available for India locations only' });
  }

  const amenity = type; // 'hospital' or 'pharmacy'
  const query = `[out:json][timeout:20];(node["amenity"="${amenity}"](around:5000,${latN},${lngN});way["amenity"="${amenity}"](around:5000,${latN},${lngN});relation["amenity"="${amenity}"](around:5000,${latN},${lngN}););out center 20;`;
  const overpassMirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  try {
    var responseData = null;
    var lastError = null;

    for (var i = 0; i < overpassMirrors.length; i++) {
      try {
        const response = await axios.post(
          overpassMirrors[i],
          'data=' + encodeURIComponent(query),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'NeuralNexus/1.0 (nearby places)'
            },
            timeout: 18000
          }
        );

        if (response && response.data && Array.isArray(response.data.elements)) {
          responseData = response.data;
          break;
        }
      } catch (mirrorErr) {
        lastError = mirrorErr;
      }
    }

    if (!responseData) {
      throw lastError || new Error('No Overpass mirror responded with valid data');
    }

    const elements = (responseData.elements || []).filter(el => el.tags && el.tags.name);
    const results = elements.slice(0, 10).map(el => {
      const eLat = el.lat != null ? el.lat : el.center && el.center.lat;
      const eLng = el.lon != null ? el.lon : el.center && el.center.lon;
      const addrParts = [el.tags['addr:housenumber'], el.tags['addr:street'], el.tags['addr:city']].filter(Boolean);
      return {
        name: el.tags.name || el.tags['name:en'] || amenity,
        vicinity: addrParts.join(', ') || el.tags['addr:full'] || '',
        lat: eLat,
        lng: eLng,
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || el.tags['contact:website'] || null,
        opening_hours: el.tags.opening_hours || null,
      };
    }).filter(r => r.lat != null && r.lng != null);

    res.json({ results });
  } catch (err) {
    console.error('Overpass API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch nearby places. Please try again.' });
  }
});

// ── AUTH ROUTES (Supabase-backed) ──────────────────────────
function requireSupabase(res) {
  if (!supabase) {
    res.status(503).json({ error: 'Auth service not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env' });
    return false;
  }
  return true;
}

// POST /auth/signup
app.post('/auth/signup', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { email, password, name } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    // Create user and immediately confirm email (no email verification step)
    const { error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() }
    });
    if (createError) {
      return res.status(400).json({ error: createError.message });
    }
    // Sign in to get session tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }
    const user = sessionData.user;
    res.json({
      access_token: sessionData.session.access_token,
      name: user.user_metadata?.name || name.trim(),
      email: user.email
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Sign up failed. Please try again.' });
  }
});

// POST /auth/signin
app.post('/auth/signin', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = data.user;
    res.json({
      access_token: data.session.access_token,
      name: user.user_metadata?.name || user.email.split('@')[0],
      email: user.email
    });
  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// POST /auth/signout
app.post('/auth/signout', async (req, res) => {
  // Supabase JWTs expire on their own (~1 h). The client clears its local session.
  // Best-effort: nothing extra needed server-side for a short-lived token.
  res.json({ success: true });
});

async function getRequestUser(req, res) {
  if (!requireSupabase(res)) return null;

  const authHeader = req.headers.authorization || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    res.status(401).json({ error: 'Missing bearer token.' });
    return null;
  }

  const token = tokenMatch[1].trim();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return null;
  }

  return data.user;
}

function isMissingDiaryTable(errorMessage) {
  return /relation .*diary_entries.* does not exist/i.test(errorMessage || '');
}

// GET /api/diary
app.get('/api/diary', async (req, res) => {
  try {
    const user = await getRequestUser(req, res);
    if (!user) return;

    const { data, error } = await supabase
      .from('diary_entries')
      .select('id, entry_text, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (isMissingDiaryTable(error.message)) {
        return res.status(500).json({ error: 'Database table diary_entries is missing. Run backend/sql/001_create_diary_entries.sql in Supabase SQL Editor.' });
      }
      throw error;
    }

    const entries = (data || []).map(function(entry) {
      return {
        id: entry.id,
        date: entry.created_at,
        text: entry.entry_text
      };
    });

    res.json({ entries: entries });
  } catch (err) {
    console.error('Diary fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch diary entries.' });
  }
});

// POST /api/diary
app.post('/api/diary', async (req, res) => {
  try {
    const user = await getRequestUser(req, res);
    if (!user) return;

    const rawText = (req.body && req.body.text) || '';
    const text = rawText.toString().trim();

    if (!text) {
      return res.status(400).json({ error: 'Entry text is required.' });
    }
    if (text.length > 4000) {
      return res.status(400).json({ error: 'Entry is too long. Please keep it under 4000 characters.' });
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        entry_text: text
      })
      .select('id, entry_text, created_at')
      .single();

    if (error) {
      if (isMissingDiaryTable(error.message)) {
        return res.status(500).json({ error: 'Database table diary_entries is missing. Run backend/sql/001_create_diary_entries.sql in Supabase SQL Editor.' });
      }
      throw error;
    }

    res.status(201).json({
      entry: {
        id: data.id,
        date: data.created_at,
        text: data.entry_text
      }
    });
  } catch (err) {
    console.error('Diary save error:', err.message);
    res.status(500).json({ error: 'Failed to save diary entry.' });
  }
});

// DELETE /api/diary/:id
app.delete('/api/diary/:id', async (req, res) => {
  try {
    const user = await getRequestUser(req, res);
    if (!user) return;

    const entryId = req.params.id;
    if (!entryId) {
      return res.status(400).json({ error: 'Entry id is required.' });
    }

    const { error, count } = await supabase
      .from('diary_entries')
      .delete({ count: 'exact' })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      if (isMissingDiaryTable(error.message)) {
        return res.status(500).json({ error: 'Database table diary_entries is missing. Run backend/sql/001_create_diary_entries.sql in Supabase SQL Editor.' });
      }
      throw error;
    }

    if (!count) {
      return res.status(404).json({ error: 'Diary entry not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Diary delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete diary entry.' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NeuralNexus AI Backend',
    supabase: supabase ? 'connected' : 'not configured'
  });
});

function getServerUrls(port) {
  const seen = new Set();
  const urls = [`http://localhost:${port}`];
  const interfaces = os.networkInterfaces();

  Object.keys(interfaces).forEach(function(name) {
    (interfaces[name] || []).forEach(function(details) {
      if (!details || details.family !== 'IPv4' || details.internal) {
        return;
      }
      const url = `http://${details.address}:${port}`;
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    });
  });

  return urls;
}

app.listen(PORT, HOST, () => {
  console.log(`✅ NeuralNexus AI Backend listening on ${HOST}:${PORT}`);
  getServerUrls(PORT).forEach(function(url) {
    console.log(`   ${url}`);
  });
});

// Prevent unhandled rejections/exceptions from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err.message);
});
