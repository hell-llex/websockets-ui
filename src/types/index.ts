export interface User {
	clientId: string;
	name: string;
	password: string;
	wins: number; // count of wins
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
	data?: any;
	id: number;
}

export type RoomUser = {
	name: string;
	index: string;
};

export interface Ship {
	position: {
		x: number;
		y: number;
	};
	hitPositions?: any;
	direction: boolean;
	length: number;
	type: 'small' | 'medium' | 'large' | 'huge';
}

export interface Players {
	clientId: string;
	name: string;
	idPlayer: string;
	ships?: Ship[];
}

export type UserYourTurn = 0 | 1;

export interface GameRoom {
	idGame: string;
	roomUsers: Players[];
	roomId: string;
	userYourTurn: UserYourTurn;
	currentPlayer: string;
}

export interface Room {
	roomId: string;
	roomUsers: RoomUser[];
}
