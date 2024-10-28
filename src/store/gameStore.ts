import { GameRoom } from '../types';

const gameRooms: Map<string, GameRoom> = new Map();

export const getGameRoomsStore = async (): Promise<GameRoom[]> => Array.from(gameRooms.values());

export const getGameRoomByIdStore = async (gameId: string): Promise<GameRoom | undefined> => {
	return gameRooms.get(gameId);
};

export const addGameRoomStore = async (idGame: string, gameRoom: GameRoom): Promise<void> => {
	gameRooms.set(idGame, gameRoom);
};

export const updateShipsToGameRoomStore = async (
	idGame: string,
	ships: any[],
	idPlayer: string
): Promise<void> => {
	const currentGame = await getGameRoomByIdStore(idGame);

	if (gameRooms.has(idGame) && currentGame) {
		currentGame.roomUsers = currentGame.roomUsers.map((roomUser) => {
			if (roomUser.idPlayer === idPlayer) {
				roomUser.ships = ships;
			}
			return roomUser;
		});

		gameRooms.set(idGame, currentGame);
	}
};

export const createTurnManagerStore = () => {
	let turnCounter = 0;

	return async (gameRoom: GameRoom) => {
		if (turnCounter === 2) {
			turnCounter = 0;
		}

		if (turnCounter === 0) {
			gameRoom.userYourTurn = gameRoom.userYourTurn ? 0 : 1;
			gameRoom.currentPlayer = gameRoom.roomUsers[gameRoom.userYourTurn].idPlayer;

			gameRooms.set(gameRoom.idGame, gameRoom);
		}

		turnCounter++;
		return gameRoom.roomUsers[gameRoom.userYourTurn].idPlayer;
	};
};
