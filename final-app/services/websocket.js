import { WebSocketServer } from 'ws';
import SessionResult from '../models/sessionResult.js'; // Importa el modelo

let sessions = {}; // Sigue siendo en memoria para sesiones activas

function broadcastToSession(sessionId, message) {
  if (sessions[sessionId]) {
    sessions[sessionId].participants.forEach(({ ws }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket conectado');

    ws.on('message', async (message) => { // Marcado como async
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
                exercise: payload?.exercise || 'Unknown',
              };
            }
            sessions[sessionId].participants.push({ ws, participantId, name: payload?.name });
            ws.sessionId = sessionId;
            ws.participantId = participantId;

            broadcastToSession(sessionId, {
              type: 'participant_joined',
              participantId,
              name: payload?.name,
              participants: sessions[sessionId].participants.map((p) => ({ id: p.participantId, name: p.name })),
            });

            const currentLeaderboard = sessions[sessionId].participants.map((p) => ({
              id: p.participantId,
              name: p.name,
              reps: sessions[sessionId].data[p.participantId] || 0,
            }));

            ws.send(JSON.stringify({
              type: 'session_state',
              exercise: sessions[sessionId].exercise,
              leaderboard: currentLeaderboard,
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
                feedback: payload?.feedback || '',
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
                participants: sessions[sessionId].participants.map((p) => ({
                  id: p.participantId,
                  name: p.name,
                  reps: sessions[sessionId].data[p.participantId] || 0,
                })),
              };

              // ¡¡CAMBIO IMPORTANTE: Guardar en MongoDB!!
              try {
                const resultDocument = new SessionResult(sessionResult);
                await resultDocument.save();
                console.log('Resultado de sesión guardado en MongoDB');
              } catch (dbError) {
                console.error('Error guardando resultado de sesión en MongoDB:', dbError);
              }

              broadcastToSession(sessionId, {
                type: 'session_ended',
                results: sessionResult,
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
          (p) => p.ws !== ws
        );

        broadcastToSession(ws.sessionId, {
          type: 'participant_left',
          participantId: ws.participantId,
          participants: sessions[ws.sessionId].participants.map((p) => ({ id: p.participantId, name: p.name })),
        });

        if (sessions[ws.sessionId].participants.length === 0) {
          delete sessions[ws.sessionId];
        }
      }
    });
  });

  console.log('Servidor WebSocket inicializado');
};

export default initializeWebSocket;