import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Data storage directories
const dataDir = path.join(__dirname, 'data');
const resultsFile = path.join(dataDir, 'results.json');
const exercisesFile = path.join(dataDir, 'exercises.json');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
await fs.mkdir(dataDir, { recursive: true }).catch(() => {});

// Helper function to read exercises
async function readExercises() {
  try {
    const data = await fs.readFile(exercisesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper function to read results
async function readResults() {
  try {
    const data = await fs.readFile(resultsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper function to save results
async function saveResults(results) {
  try {
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Error saving results:', err);
  }
}

// Helper function to read users
async function readUsers() {
  try {
    const data = await fs.readFile(usersFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper function to save users
async function saveUsers(users) {
  try {
    await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// API endpoint to get all exercises
app.get('/api/exercises', async (req, res) => {
  try {
    const exercises = await readExercises();
    res.json(exercises);
  } catch (error) {
    console.error('Error reading exercises:', error);
    res.status(500).json({ error: 'Failed to read exercises' });
  }
});

// API endpoint to get a specific exercise by ID
app.get('/api/exercises/:id', async (req, res) => {
  try {
    const exercises = await readExercises();
    const exercise = exercises.find(e => e.id === parseInt(req.params.id));
    if (exercise) {
      res.json(exercise);
    } else {
      res.status(404).json({ error: 'Exercise not found' });
    }
  } catch (error) {
    console.error('Error reading exercise:', error);
    res.status(500).json({ error: 'Failed to read exercise' });
  }
});

// API endpoint to get all results
app.get('/api/results', async (req, res) => {
  try {
    const results = await readResults();
    res.json(results);
  } catch (error) {
    console.error('Error reading results:', error);
    res.status(500).json({ error: 'Failed to read results' });
  }
});

// API endpoint to save session results
app.post('/api/results', async (req, res) => {
  try {
    const results = await readResults();
    const newResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    results.push(newResult);
    await saveResults(results);
    res.json({ success: true, id: newResult.id });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

// API endpoint for user login/registration
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, fullName, provider } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and fullName are required' });
    }

    const users = await readUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      // Create new user
      user = {
        id: 'user_' + Date.now().toString(),
        email,
        fullName,
        provider,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(user);
      await saveUsers(users);
    } else {
      // Update last login
      user.lastLogin = new Date().toISOString();
      await saveUsers(users);
    }

    res.json({
      success: true,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// API endpoint to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await readUsers();
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let sessions = {}; // { sessionId: { participants: [ws, ws,...], data: {}, createdAt, exercise } }

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, sessionId, participantId, payload } = data;

      switch (type) {
        case 'join':
          if (!sessions[sessionId]) {
            sessions[sessionId] = {
              participants: [],
              data: {},
              createdAt: new Date().toISOString(),
              exercise: payload?.exercise || 'Unknown'
            };
          }
          sessions[sessionId].participants.push({ ws, participantId, name: payload?.name });
          ws.sessionId = sessionId;
          ws.participantId = participantId;

          // 1. Broadcast to all participants that a new participant has joined
          broadcastToSession(sessionId, {
            type: 'participant_joined',
            participantId,
            name: payload?.name,
            participants: sessions[sessionId].participants.map(p => ({ id: p.participantId, name: p.name }))
          });

          // 2. Send the current session state (leaderboard and participants) to the newly joined participant
          const currentLeaderboard = sessions[sessionId].participants.map(p => ({
            id: p.participantId,
            name: p.name,
            reps: sessions[sessionId].data[p.participantId] || 0
          }));

          ws.send(JSON.stringify({
            type: 'session_state',
            exercise: sessions[sessionId].exercise,
            leaderboard: currentLeaderboard,
            participants: sessions[sessionId].participants.map(p => ({ id: p.participantId, name: p.name }))
          }));
          break;

        case 'repetition':
          if (sessions[sessionId]) {
            sessions[sessionId].data[participantId] = sessions[sessionId].data[participantId] || 0;
            sessions[sessionId].data[participantId]++;

            broadcastToSession(sessionId, {
              type: 'repetition_update',
              participantId,
              reps: sessions[sessionId].data[participantId],
              quality: payload?.quality || 0.5,
              feedback: payload?.feedback || ''
            });
          }
          break;

        case 'session_end':
          if (sessions[sessionId]) {
            const sessionResult = {
              sessionId,
              exercise: sessions[sessionId].exercise,
              createdAt: sessions[sessionId].createdAt,
              endedAt: new Date().toISOString(),
              participants: sessions[sessionId].participants.map(p => ({
                id: p.participantId,
                name: p.name,
                reps: sessions[sessionId].data[p.participantId] || 0
              }))
            };

            // Save results
            saveResults([sessionResult]).catch(err => console.error('Error saving session result:', err));

            broadcastToSession(sessionId, {
              type: 'session_ended',
              results: sessionResult
            });
            delete sessions[sessionId];
          }
          break;
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.sessionId && sessions[ws.sessionId]) {
      sessions[ws.sessionId].participants = sessions[ws.sessionId].participants.filter(
        p => p.ws !== ws
      );

      broadcastToSession(ws.sessionId, {
        type: 'participant_left',
        participantId: ws.participantId,
        participants: sessions[ws.sessionId].participants.map(p => ({ id: p.participantId, name: p.name }))
      });

      if (sessions[ws.sessionId].participants.length === 0) {
        delete sessions[ws.sessionId];
      }
    }
  });
});

function broadcastToSession(sessionId, message) {
  if (sessions[sessionId]) {
    sessions[sessionId].participants.forEach(({ ws }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
