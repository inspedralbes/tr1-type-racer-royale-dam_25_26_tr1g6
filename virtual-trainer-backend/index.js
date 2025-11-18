import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import bcrypt from 'bcrypt';
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
const saltRounds = 10;
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

// API endpoint to get results for a specific user
app.get('/api/results/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const allResults = await readResults();
    const userResults = allResults.filter(result => result.userId === userId);
    res.json(userResults);
  } catch (error) {
    console.error('Error reading user results:', error);
    res.status(500).json({ error: 'Failed to read user results' });
  }
});

// API endpoint to save session results
app.post('/api/results', async (req, res) => {
  try {
    const { userId, ...restOfBody } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to save results' });
    }

    const results = await readResults();
    const newResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId, // Store the user ID
      ...restOfBody
    };
    results.push(newResult);
    await saveResults(results);
    res.json({ success: true, id: newResult.id });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

// API endpoint for user registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const users = await readUsers();
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: 'user_' + Date.now().toString(),
      email,
      fullName,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    users.push(user);
    await saveUsers(users);

    res.json({
      success: true,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// API endpoint for user login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.password) { // Check for user and if they have a password (to allow for old/social logins)
      return res.status(401).json({ error: 'Invalid credentials or password not set' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      // Note: We are not saving users here to avoid unnecessary file writes on every login.
      // A more robust system would use a database. For now, we'll rely on the saveUsers in register.

      res.json({
        success: true,
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
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
