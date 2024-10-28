import { WebSocket } from 'ws';

const clients: Map<string, WebSocket> = new Map();

export const getClientsStore = async (): Promise<WebSocket[]> => Array.from(clients.values());

export const getClientByIdStore = async (id: string): Promise<WebSocket | undefined> =>
	clients.get(id);

export const addClientStore = async (id: string, ws: WebSocket): Promise<void> => {
	clients.set(id, ws);
};

export const deleteClientStore = async (id: string): Promise<void> => {
	clients.delete(id);
};
