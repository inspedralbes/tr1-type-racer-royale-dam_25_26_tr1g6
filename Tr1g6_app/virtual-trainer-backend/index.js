import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import exercisesRouter from './routes/exercises.js';
import resultsRouter from './routes/results.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- API routes ---
app.use('/api/exercises', exercisesRouter);
app.use('/api/results', resultsRouter);
app.use('/api/sessions', sessionsRouter);

// --- Start server ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let sessions = {}; // { sessionId: [ws, ws,...] }

wss.on('connection', (ws, req) => {
  console.log('WebSocket connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, sessionId, payload } = data;

      switch (type) {
        case 'join':
          if (!sessions[sessionId]) sessions[sessionId] = [];
          sessions[sessionId].push(ws);
          ws.sessionId = sessionId;
          break;

        case 'update':
          // broadcast to all in the session
          if (sessions[sessionId]) {
            sessions[sessionId].forEach(client => {
              if (client !== ws && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({ type:'update', payload }));
              }
            });
          }
          break;
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.sessionId && sessions[ws.sessionId]) {
      sessions[ws.sessionId] = sessions[ws.sessionId].filter(c => c !== ws);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
