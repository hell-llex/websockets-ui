import { GameRoom, Ship, User, UserYourTurn, WebSocketMessage } from '../types';
import { addUserStore, getUserByIdStore, getUsersStore } from '../store/userStore';
import {
	addUserToRoomStore,
	createRoomStore,
	getRoomByIdStore,
	getRoomsStore,
} from '../store/roomStore';
import { generateId } from '../utils';
import {
	addGameRoomStore,
	createTurnManagerStore,
	getGameRoomByIdStore,
	updateShipsToGameRoomStore,
} from '../store/gameStore';
import { getClientByIdStore } from '../store/clientStore';
import { WebSocket } from 'ws';

export const createUserService = async (clientId: string, req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) };
	const res = {
		type: 'reg',
		data: {
			name: reqParse.data.name,
			index: clientId,
			error: false,
			errorText: '',
		},
		id: req.id,
	};
	try {
		const users = await getUsersStore();
		const userExists = users.some((user: User) => user.name === reqParse.data.name);
		if (userExists) {
		} else {
			await addUserStore({ clientId: clientId, ...reqParse.data, wins: 0 });
		}

		return res;
	} catch (error: any) {
		return {
			...res,
			data: {
				name: res.data.name,
				index: clientId,
				error: true,
				errorText: error.message,
			},
		};
	}
};

export const createRoomService = async (clientId: string) => {
	const user = await getUserByIdStore(clientId);
	if (user) await createRoomStore({ name: user.name, index: user.clientId });
};

export const updateWinnersService = async () => {
	const winners = (await getUsersStore()).filter((winner) => winner.wins !== 0);
	return {
		type: 'update_winners',
		data: winners,
		id: 0,
	};
};

export const updateRoomService = async () => {
	const rooms = await getRoomsStore();
	const validRooms = rooms.filter((room) => room.roomUsers.length <= 1);
	return {
		type: 'update_room',
		data: validRooms,
		id: 0,
	};
};

export const addUserToRoomService = async (clientId: string, req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) };
	const user = await getUserByIdStore(clientId);
	if (user)
		return await addUserToRoomStore(reqParse.data.indexRoom, {
			name: user.name,
			index: user.clientId,
		});
};

export const createGameService = async (roomId: string) => {
	const room = await getRoomByIdStore(roomId);
	if (room) {
		const gameRoom = {
			idGame: generateId(),
			roomId: roomId,
			userYourTurn: 1 as UserYourTurn,
			currentPlayer: '',
			roomUsers: room.roomUsers.map((roomUser) => {
				return {
					idPlayer: generateId(),
					name: roomUser.name,
					clientId: roomUser.index,
				};
			}),
		};
		gameRoom.currentPlayer = gameRoom.roomUsers[0].idPlayer;
		await addGameRoomStore(gameRoom.idGame, gameRoom);
		return gameRoom;
	}
};

export const updateShipsService = async (req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) };
	const [gameId, ships, indexPlayer] = [
		reqParse.data.gameId,
		reqParse.data.ships,
		reqParse.data.indexPlayer,
	];
	await updateShipsToGameRoomStore(gameId, ships, indexPlayer);
};

export const checkForStartToGameRoomService = async (req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) }; // TODO: перенести этот двойной парсер в корень и вынести в utils
	const currentGame = await getGameRoomByIdStore(reqParse.data.gameId);
	if (currentGame) {
		return {
			isStartsGame: currentGame.roomUsers.every(
				(roomUser) => roomUser.ships && roomUser.ships?.length !== 0
			),
			currentGame: currentGame,
		};
	}
};

const turnManagerStore = createTurnManagerStore();

export const turnUserService = async (game: GameRoom) => {
	const currentPlayerId = await turnManagerStore(game);
	return currentPlayerId;
};

const getSurroundingCells = (ship: Ship) => {
	const surroundingCells: { x: number; y: number }[] = [];
	const { position, direction, length } = ship;

	const occupiedPositions: { x: number; y: number }[] = [];
	for (let i = 0; i < length; i++) {
		const shipX = direction ? position.x : position.x + i;
		const shipY = direction ? position.y + i : position.y;
		occupiedPositions.push({ x: shipX, y: shipY });
	}

	for (let i = 0; i < length; i++) {
		const shipX = direction ? position.x : position.x + i;
		const shipY = direction ? position.y + i : position.y;

		const potentialSurroundings = [
			{ x: shipX - 1, y: shipY - 1 },
			{ x: shipX - 1, y: shipY },
			{ x: shipX - 1, y: shipY + 1 },
			{ x: shipX, y: shipY - 1 },
			{ x: shipX, y: shipY + 1 },
			{ x: shipX + 1, y: shipY - 1 },
			{ x: shipX + 1, y: shipY },
			{ x: shipX + 1, y: shipY + 1 },
		];

		potentialSurroundings.forEach((cell) => {
			const isOccupied = occupiedPositions.some((pos) => pos.x === cell.x && pos.y === cell.y);
			const isHitPosition = ship.hitPositions?.some(
				(hitPos: { x: number; y: number }) => hitPos.x === cell.x && hitPos.y === cell.y
			);

			if (!isOccupied && !isHitPosition) {
				if (
					!surroundingCells.some(
						(surroundingCell) => surroundingCell.x === cell.x && surroundingCell.y === cell.y
					)
				) {
					surroundingCells.push(cell);
				}
			}
		});
	}

	return surroundingCells;
};

export const attackService = async (_clientId: string, req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) };
	const { gameId, x, y, indexPlayer } = reqParse.data;
	const attackPosition = { x, y };

	const game = await getGameRoomByIdStore(gameId);
	const attackerId = indexPlayer;

	if (game) {
		const opponent = game.roomUsers.find((user) => user.idPlayer !== attackerId);
		if (!opponent) {
			throw new Error('Opponent not found');
		}

		let status: 'miss' | 'killed' | 'shot' = 'miss';
		let sendPosition: { x: number; y: number }[] = [];

		for (const ship of opponent.ships!) {
			const occupiedPositions = [];
			for (let i = 0; i < ship.length; i++) {
				const pos = ship.direction
					? { x: ship.position.x, y: ship.position.y + i } // Вертикально
					: { x: ship.position.x + i, y: ship.position.y }; // Горизонтально
				occupiedPositions.push(pos);
			}

			const positionHit = occupiedPositions.find(
				(pos) => pos.x === attackPosition.x && pos.y === attackPosition.y
			);

			if (positionHit) {
				if (!('hitPositions' in ship)) {
					ship.hitPositions = [];
				}

				ship.hitPositions.push(attackPosition);

				status = ship.hitPositions.length === ship.length ? 'killed' : 'shot';
				sendPosition =
					status === 'killed' ? [attackPosition, ...getSurroundingCells(ship)] : [attackPosition];
				break;
			}
		}

		const clients = (
			await Promise.all(game.roomUsers.map((user) => getClientByIdStore(user.clientId)))
		).flat() as WebSocket[];

		if (status === 'miss') sendPosition = [attackPosition];

		return {
			game,
			clients,
			data: {
				position: attackPosition,
				currentPlayer: attackerId,
				status,
			},
			sendPosition,
		};
	}
};
