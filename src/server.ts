import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from './types';
import { router } from './router';
import { addClientStore, deleteClientStore } from './store/clientStore';
import { generateId } from './utils';

const PORT = 3000;

// Создаем WebSocket сервер
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

wss.on('connection', async (ws: WebSocket) => {
	const clientId = generateId();
	addClientStore(clientId, ws);
	console.log('Client connected');

	ws.on('message', async (message) => {
		const data: WebSocketMessage = JSON.parse(message.toString());
		console.log(`Request ${message.toString()} от ${clientId}`);
		await router(clientId, data);
	});

	ws.on('close', () => {
		console.log('Client disconnected');
		deleteClientStore(clientId);
	});
});
