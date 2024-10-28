import { WebSocketMessage } from '../types';
import { WebSocket } from 'ws';
import crypto from 'crypto';

export const generateId = () => String(crypto.randomBytes(10).toString('hex')); // длина ID в 16 байт, hex представление

export const unicast = async (wsS: WebSocket | undefined, res: WebSocketMessage) => {
	if (wsS) return wsS.send(JSON.stringify({ ...res, data: JSON.stringify(res.data) }));
};

export const broadcast = async (clients: WebSocket[], res: WebSocketMessage) => {
	clients.forEach((client: { readyState: number; send: (arg0: string) => void }) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ ...res, data: JSON.stringify(res.data) }));
		}
	});
};
