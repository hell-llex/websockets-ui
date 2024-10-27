// types.ts
export interface User {
	id: string;
	name: string;
	password: string;
}

export interface CreateUserPayload {
	name: string;
	password: string;
}

export interface ValidateUserPayload {
	name: string;
	password: string;
}

export interface WebSocketMessage {
	type: string;
	data?: any; // Можно сделать более строгим, если нужно
	id: number;
}
