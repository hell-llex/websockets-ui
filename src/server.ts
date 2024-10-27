import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from './types';
import { router } from './router';
import { getUsersStore } from './store/userStore';

const PORT = 3000;

// Создаем WebSocket сервер
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

// Хранение клиентов
// const clients: Set<WebSocket> = new Set();

wss.on('connection', async (ws: WebSocket) => {
	ws.on('message', async (message) => {
		console.log('message :>> ', message);
		const data: WebSocketMessage = JSON.parse(message.toString());

		const res = await router(data);

		console.log('await getUsersStore(); :>> ', await getUsersStore());
		console.log('---------\nres :>> ', res);

		ws.send(JSON.stringify(res));
	});

	console.log('Client connected');

	// Добавляем клиента в набор
	// clients.add(ws);

	// Обработка входящих сообщений
	// ws.on('message', async (req: string) => {
	// 	const message = await JSON.parse(req);
	// 	console.log(`Received: `, await JSON.parse(message.data));
	// 	// Здесь можно обрабатывать сообщения и отправлять ответы
	// });

	// Обработка отключения клиента
	ws.on('close', () => {
		console.log('Client disconnected');
		// clients.delete(ws);
	});
});

// Функция для отправки сообщения всем подключенным клиентам
// function broadcast(message: string) {
// 	clients.forEach((client) => {
// 		if (client.readyState === WebSocket.OPEN) {
// 			client.send(message);
// 		}
// 	});
// }
