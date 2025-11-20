import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YTDlpWrap from 'yt-dlp-exec';
import { spawn } from 'child_process';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: 'localhost',
    user: 'fittoni_user',
    password: 'Jugador203',
    database: 'fittoni_db'
};

let db;
try {
    db = await mysql.createPool(dbConfig);
    console.log('[Database] Connected successfully to MySQL.');
} catch (error) {
    console.error('[Database] Failed to connect to MySQL:', error);
    process.exit(1);
}

const tempDir = path.resolve(__dirname, 'temp');
await fs.mkdir(tempDir, { recursive: true }).catch(() => {});

app.get('/api/exercises', async (req, res) => {
  try {
    const [exercises] = await db.query('SELECT * FROM exercises');
    res.json(exercises);
  } catch (error) {
    console.error('Error reading exercises from DB:', error);
    res.status(500).json({ error: 'Failed to read exercises' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    const apiKey = process.env.ZEROBOUNCE_API_KEY;
    if (apiKey) {
        const validationResponse = await axios.get(`https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`);
        if (validationResponse.data.status !== "valid") {
            return res.status(400).json({ error: 'La dirección de correo electrónico no parece ser válida.' });
        }
    }
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query('INSERT INTO users (email, password_hash, full_name, provider) VALUES (?, ?, ?, ?)', [email, passwordHash, fullName, 'email']);
    res.status(201).json({ success: true, id: result.insertId, fullName, message: 'Cuenta creada con éxito.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error del servidor durante el registro.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    res.json({ success: true, id: user.id, email: user.email, fullName: user.full_name, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    const [userRows] = await db.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const fullName = userRows[0].full_name;

    const [lifetimeStats] = await db.query(
      `SELECT COUNT(id) AS totalSessions, SUM(total_reps) AS totalReps FROM session_participants WHERE user_id = ?`,
      [userId]
    );

    const [muscleBreakdown] = await db.query(
      `SELECT e.body_part AS muscleGroup, COUNT(s.id) AS sessionCount, SUM(p.total_reps) AS totalRepsInGroup
       FROM session_participants p
       JOIN sessions s ON p.session_id = s.id
       JOIN exercises e ON s.exercise_id = e.id
       WHERE p.user_id = ? AND e.body_part IS NOT NULL
       GROUP BY e.body_part
       ORDER BY sessionCount DESC, totalRepsInGroup DESC`,
      [userId]
    );

    const [favoriteExercise] = await db.query(
      `SELECT e.name AS exerciseName, COUNT(s.id) AS sessionCount
       FROM session_participants p
       JOIN sessions s ON p.session_id = s.id
       JOIN exercises e ON s.exercise_id = e.id
       WHERE p.user_id = ?
       GROUP BY e.name
       ORDER BY sessionCount DESC
       LIMIT 1`,
      [userId]
    );

    const statsResponse = {
      fullName: fullName,
      lifetime: {
        totalSessions: parseInt(lifetimeStats[0].totalSessions) || 0,
        totalReps: parseInt(lifetimeStats[0].totalReps) || 0,
        favoriteExercise: favoriteExercise.length > 0 ? favoriteExercise[0].exerciseName : 'N/A'
      },
      muscleBreakdown: muscleBreakdown
    };

    res.json(statsResponse);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Server error while fetching stats.' });
  }
});

app.post('/api/process-youtube-video', async (req, res) => {
  const { youtubeId } = req.body;
  if (!youtubeId || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    return res.status(400).json({ error: 'Se requiere un ID de YouTube válido.' });
  }
  const videoPath = path.join(tempDir, `${youtubeId}.mp4`);
  try {
    await YTDlpWrap.exec([ `https://www.youtube.com/watch?v=${youtubeId}`, '-f', 'best[ext=mp4][height<=480]', '-o', videoPath ]);
    const pythonProcess = spawn('python', ['process_video.py', videoPath]);
    let jsonData = '';
    pythonProcess.stdout.on('data', (data) => { jsonData += data.toString(); });
    await new Promise((resolve, reject) => {
      let errorData = '';
      pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });
      pythonProcess.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Python script failed: ${errorData}`));
        resolve();
      });
      pythonProcess.on('error', (err) => reject(err));
    });
    const poseTemplate = JSON.parse(jsonData);
    if (poseTemplate.error) throw new Error(poseTemplate.error);
    res.json({ poseTemplate });
  } catch (error) {
    console.error('[Processor] Failed:', error.message);
    res.status(500).json({ error: 'No se pudo procesar el video.' });
  } finally {
    try { await fs.unlink(videoPath); } catch (err) {}
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let sessions = {};

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, sessionId, participantId, payload } = data;
      switch (type) {
        case 'join':
          if (!sessions[sessionId]) {
            sessions[sessionId] = { participants: [], data: {}, createdAt: new Date().toISOString(), exercise: payload?.exercise || 'Unknown', referenceData: null };
          }
          sessions[sessionId].participants.push({ ws, participantId, name: payload?.name });
          ws.sessionId = sessionId;
          ws.participantId = participantId;
          const leaderboard = {};
          sessions[sessionId].participants.forEach(p => { leaderboard[p.participantId] = { id: p.participantId, name: p.name, reps: sessions[sessionId].data[p.participantId] || 0 }; });
          ws.send(JSON.stringify({ type: 'session_info', payload: { exercise: sessions[sessionId].exercise, leaderboard, referenceData: sessions[sessionId].referenceData }}));
          broadcastToSession(sessionId, { type: 'leaderboard_update', payload: { leaderboard } });
          break;
        case 'share_reference_data':
          if (sessions[sessionId]) {
            sessions[sessionId].referenceData = payload;
            broadcastToSession(sessionId, { type: 'reference_data_update', payload }, ws);
          }
          break;
        case 'rep_update':
          if (sessions[sessionId] && sessions[sessionId].data) {
            sessions[sessionId].data[participantId] = (sessions[sessionId].data[participantId] || 0) + 1;
            const participant = sessions[sessionId].participants.find(p => p.participantId === participantId);
            const updatedEntry = { id: participantId, name: participant ? participant.name : 'Unknown', reps: sessions[sessionId].data[participantId], quality: payload?.quality || 0.5, feedback: payload?.feedback || '' };
            broadcastToSession(sessionId, { type: 'leaderboard_update', payload: { leaderboard: { [participantId]: updatedEntry } } });
          }
          break;
        case 'session_end':
  if (sessions[sessionId]) {
    console.log(`[DB Save - Step 1] Sesión finalizada recibida: ${sessionId}`);
    const sessionData = sessions[sessionId];
    
    (async () => {
      try {
        const exerciseData = payload.exercise;
        if (!exerciseData || !exerciseData.name) {
          throw new Error("Datos del ejercicio no recibidos.");
        }
        console.log(`[DB Save - Step 2] Datos del ejercicio:`, exerciseData);

        // 1. Buscar o crear el ejercicio
        let [exerciseRows] = await db.query('SELECT id FROM exercises WHERE name = ?', [exerciseData.name]);
        let exerciseId;
        if (exerciseRows.length === 0) {
          const [insertResult] = await db.query(
            'INSERT INTO exercises (name, description, youtube_id, body_part, target_muscle, equipment, gif_url) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [
              exerciseData.name, exerciseData.description || null, exerciseData.youtube_id || null,
              exerciseData.bodyPart || null, exerciseData.target || null, exerciseData.equipment || null, exerciseData.gifUrl || null
            ]
          );
          exerciseId = insertResult.insertId;
        } else {
          exerciseId = exerciseRows[0].id;
        }

        // 2. Crear la sesión en la tabla 'sessions'
        const creator = sessionData.participants.find(p => p.participantId === participantId);
        if (!creator) throw new Error("No se encontró al creador.");
        const [userRows] = await db.query('SELECT id FROM users WHERE full_name = ?', [creator.name]);
        if (userRows.length === 0) throw new Error(`Usuario "${creator.name}" no encontrado.`);
        const creatorId = userRows[0].id;
        
        const [sessionInsertResult] = await db.query(
          'INSERT INTO sessions (exercise_id, creator_id, guid) VALUES (?, ?, ?)',
          [exerciseId, creatorId, sessionId]
        );
        const sessionIdInDb = sessionInsertResult.insertId;
        console.log(`[DB Save - Step 3] Sesión creada en BD con ID: ${sessionIdInDb}`);

        // 3. Crear las entradas en 'session_participants'
        for (const p of sessionData.participants) {
          const totalReps = sessionData.data[p.participantId] || 0;
          const [pUserRows] = await db.query('SELECT id FROM users WHERE full_name = ?', [p.name]);
          if (pUserRows.length > 0) {
            const participantUserId = pUserRows[0].id;
            await db.query(
              'INSERT INTO session_participants (session_id, user_id, total_reps) VALUES (?, ?, ?)',
              [sessionIdInDb, participantUserId, totalReps]
            );
          }
        }
        
        console.log(`[DB Save - Step 4] ¡Éxito! Resultados guardados.`);
      } catch (dbError) {
        console.error('[Database] ERROR FATAL al guardar resultados:', dbError);
      } finally {
        delete sessions[sessionId];
      }
    })();
  }
  break;
      }
    } catch (err) { console.error('WS message error:', err); }
  });
  ws.on('close', () => {
    if (ws.sessionId && sessions[ws.sessionId]) {
      sessions[ws.sessionId].participants = sessions[ws.sessionId].participants.filter(p => p.ws !== ws);
      if (sessions[ws.sessionId].participants.length > 0) {
        broadcastToSession(ws.sessionId, { type: 'participant_left', payload: { participantId: ws.participantId } });
      } else {
        delete sessions[ws.sessionId];
      }
    }
  });
});

function broadcastToSession(sessionId, message, excludeWs = null) {
  if (sessions[sessionId] && sessions[sessionId].participants) {
    sessions[sessionId].participants.forEach(({ ws }) => {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));