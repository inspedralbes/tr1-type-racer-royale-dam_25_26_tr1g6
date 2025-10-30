const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 5000 });
let sessions = {}; // store participants per room

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch(data.type){
      case 'join':
        if (!sessions[data.room]) sessions[data.room] = [];
        sessions[data.room].push({ ws, name: data.name, reps: 0 });
        broadcast(data.room);
        break;
      case 'update':
        const p = sessions[data.room].find(p => p.ws === ws);
        if (p) p.reps = data.reps;
        broadcast(data.room);
        break;
      case 'leave':
        if (sessions[data.room]) sessions[data.room] = sessions[data.room].filter(p => p.ws !== ws);
        broadcast(data.room);
        break;
    }
  });

  ws.on('close', () => {
    for (let room in sessions) {
      sessions[room] = sessions[room].filter(p => p.ws !== ws);
      broadcast(room);
    }
  });
});

function broadcast(room){
  if (!sessions[room]) return;
  const data = sessions[room].map(p => ({ name: p.name, reps: p.reps }));
  sessions[room].forEach(p => p.ws.send(JSON.stringify({ type:'participants', data })));
}

console.log('WebSocket server running on ws://localhost:5000');
