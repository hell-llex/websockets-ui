import { WebSocketMessage } from '../types';
import {
	addUserToRoomService,
	attackService,
	checkForStartToGameRoomService,
	createGameService,
	createRoomService,
	createUserService,
	turnUserService,
	updateRoomService,
	updateShipsService,
	updateWinnersService,
} from '../service';
import { unicast } from '../utils';
import { broadcast } from '../utils';
import { getClientByIdStore, getClientsStore } from '../store/clientStore';

export const createUserController = async (clientId: string, data: WebSocketMessage) => {
	unicast(await getClientByIdStore(clientId), await createUserService(clientId, data));
	broadcast(await getClientsStore(), await updateRoomService());
	broadcast(await getClientsStore(), await updateWinnersService());
};

export const createRoomController = async (clientId: string, _data?: WebSocketMessage) => {
	await createRoomService(clientId);
	broadcast(await getClientsStore(), await updateRoomService());
};

export const addUserToRoomController = async (clientId: string, data: WebSocketMessage) => {
	const roomToGameId = await addUserToRoomService(clientId, data);
	if (roomToGameId) {
		broadcast(await getClientsStore(), await updateRoomService());
		const game = await createGameService(roomToGameId);
		if (game) {
			for (let i = 0; i < game.roomUsers.length; i++) {
				const roomUser = game.roomUsers[i];
				unicast(await getClientByIdStore(roomUser.clientId), {
					type: 'create_game',
					data: {
						idGame: game.idGame,
						idPlayer: roomUser.idPlayer,
					},
					id: 0,
				});
			}
		}
	}
};

export const addShipsController = async (_clientId: string, data: WebSocketMessage) => {
	await updateShipsService(data);

	const checkGameRoom = await checkForStartToGameRoomService(data);

	if (checkGameRoom && checkGameRoom.isStartsGame) {
		const game = checkGameRoom.currentGame;
		for (let i = 0; i < game.roomUsers.length; i++) {
			const roomUser = game.roomUsers[i];
			unicast(await getClientByIdStore(roomUser.clientId), {
				type: 'start_game',
				data: {
					ships: roomUser.ships,
					currentPlayerIndex: roomUser.idPlayer,
				},
				id: 0,
			});
		}
		game.roomUsers.forEach(async (roomUser) =>
			unicast(await getClientByIdStore(roomUser.clientId), {
				type: 'turn',
				data: {
					currentPlayer: await turnUserService(game),
				},
				id: 0,
			})
		);
	}
};

export const attackController = async (clientId: string, req: WebSocketMessage) => {
	const res = await attackService(clientId, req);
	const { game, clients, data, sendPosition } = res!;
	const { status, currentPlayer } = data;

	const determineCurrentPlayer = async (status: string, currentPlayer: string) => {
		return status === 'killed' || status === 'shot' ? currentPlayer : await turnUserService(game);
	};

	for (let i = 0; i < sendPosition.length; i++) {
		data.position = sendPosition[i];
		data.status = sendPosition.length === 1 || !i ? status : 'miss';

		await broadcast(clients, {
			type: 'attack',
			data: data,
			id: 0,
		});
		clients.forEach(async (client) =>
			unicast(client, {
				// TODO: исправить бак когда умирает корабль срабатывает дважды
				type: 'turn',
				data: {
					currentPlayer: await determineCurrentPlayer(
						sendPosition.length === 1 ? status : 'shot',
						currentPlayer
					),
				},
				id: 0,
			})
		);
	}
};