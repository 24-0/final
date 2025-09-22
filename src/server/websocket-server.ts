import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4000 });

wss.on('connection', function connection(ws: WebSocket) {
  console.log('Client connected');

  ws.on('message', function incoming(message: string) {
    console.log('received: %s', message);

    // Broadcast message to all clients
    wss.clients.forEach(function each(client: WebSocket) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:4000');
