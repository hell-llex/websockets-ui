import { User, WebSocketMessage } from '../types';
import { WebSocket } from 'ws';
import {
	addUserToRoomService,
	attackService,
	checkForStartToGameRoomService,
	checkWinsPlayerService,
	createGameService,
	createRoomService,
	createUserService,
	turnUserService,
	updateRoomService,
	updateShipsService,
	updateWinnersService,
} from '../service';
import {
	// generateId,
	unicast,
} from '../utils';
import { broadcast } from '../utils';
import { getClientByIdStore, getClientsStoreKey } from '../store/clientStore';
import { getUserByIdStore, getUsersStore, updateUserStore } from '../store/userStore';
import { deleteRoomStore } from '../store/roomStore';
import { deleteGameRoomStore } from '../store/gameStore';

const checkAuthUsers = async (keysArray: string[], usersArray: User[]): Promise<WebSocket[]> => {
	const keysForWs = keysArray.filter((key) => usersArray.some((user) => user.clientId === key));
	const authUsers = await Promise.all(keysForWs.map(async (key) => await getClientByIdStore(key)));
	return authUsers.filter((ws): ws is WebSocket => ws !== undefined);
};

export const createUserController = async (clientId: string, data: WebSocketMessage) => {
	unicast(await getClientByIdStore(clientId), await createUserService(clientId, data));

	const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
	if (authUsers) {
		broadcast(authUsers, await updateRoomService());
		broadcast(authUsers, await updateWinnersService());
	}
};

export const createRoomController = async (clientId: string, _data?: WebSocketMessage) => {
	await createRoomService(clientId);
	const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
	broadcast(authUsers, await updateRoomService());
};

export const addUserToRoomController = async (clientId: string, data: WebSocketMessage) => {
	const roomToGameId = await addUserToRoomService(clientId, data);
	// console.log('roomToGameId :>> ', roomToGameId);
	if (roomToGameId) {
		const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
		broadcast(authUsers, await updateRoomService());
		const game = await createGameService(roomToGameId);
		// console.log('game :>> ', game);
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

	const winnerId = await checkWinsPlayerService(game, clientId, currentPlayer);
	if (winnerId && winnerId.clientId && winnerId.currentPlayer) {
		const userWinner = await getUserByIdStore(winnerId.clientId);
		if (userWinner) {
			await broadcast(clients, {
				type: 'finish',
				data: { winPlayer: winnerId.currentPlayer },
				id: 0,
			});
			userWinner.wins++;
			await updateUserStore(userWinner);
			const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
			broadcast(authUsers, await updateWinnersService());
			await deleteRoomStore(game.roomId);
			await deleteGameRoomStore(game.idGame);
		}
	}
};

// export const singleGameController = async (clientId: string, req: WebSocketMessage) => {
// 	console.log('clientId :>> ', clientId);
// 	console.log('req :>> ', req);

// 	const botId = 'bot' + generateId();

// 	let gameWithBot;

// 	await createUserService(botId, {
// 		type: 'reg',
// 		data: '{"name":"bot","password":"123456"}',
// 		id: 0,
// 	});
// 	// createRoomController(clientId);
// 	await createRoomService(clientId);
// 	// const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
// 	const dataUpdateRoom = await updateRoomService();
// 	// broadcast(authUsers, dataUpdateRoom);
// 	// console.log('dataUpdateRoom :>> ');
// 	const roomId = dataUpdateRoom.data.find((data) => data.roomUsers[0].index === clientId).roomId;

// 	// console.log('roomId :>> ', roomId);
// 	// addUserToRoomController(botId, {
// 	// 	type: 'add_user_to_room',
// 	// 	data: `{"indexRoom":"${roomId}"}`,
// 	// 	id: 0,
// 	// });

// 	const roomToGameId = await addUserToRoomService(botId, {
// 		type: 'add_user_to_room',
// 		data: `{"indexRoom":"${roomId}"}`,
// 		id: 0,
// 	});

// 	if (roomToGameId) {
// 		const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
// 		broadcast(authUsers, await updateRoomService());
// 		gameWithBot = await createGameService(roomToGameId);
// 		// console.log('game :>> ', game);
// 		if (gameWithBot) {
// 			for (let i = 0; i < gameWithBot.roomUsers.length; i++) {
// 				const roomUser = gameWithBot.roomUsers[i];
// 				unicast(await getClientByIdStore(roomUser.clientId), {
// 					type: 'create_game',
// 					data: {
// 						idGame: gameWithBot.idGame,
// 						idPlayer: roomUser.idPlayer,
// 					},
// 					id: 0,
// 				});
// 			}
// 		}
// 	}

// 	const dataForUpdateShips = {
// 		type: 'add_ships',
// 		data: `{"gameId":"${gameWithBot?.idGame}","ships":[{"position":{"x":0,"y":7},"direction":false,"type":"huge","length":4},{"position":{"x":6,"y":1},"direction":false,"type":"large","length":3},{"position":{"x":0,"y":1},"direction":false,"type":"large","length":3},{"position":{"x":5,"y":6},"direction":false,"type":"medium","length":2},{"position":{"x":8,"y":7},"direction":true,"type":"medium","length":2},{"position":{"x":6,"y":3},"direction":true,"type":"medium","length":2},{"position":{"x":2,"y":3},"direction":false,"type":"small","length":1},{"position":{"x":3,"y":5},"direction":true,"type":"small","length":1},{"position":{"x":0,"y":3},"direction":false,"type":"small","length":1},{"position":{"x":0,"y":5},"direction":false,"type":"small","length":1}],"indexPlayer":"${gameWithBot?.roomUsers[1].idPlayer}"}`,
// 		id: 0,
// 	};
// 	await updateShipsService(dataForUpdateShips);

// 	const checkGameRoom = await checkForStartToGameRoomService(dataForUpdateShips);
// 	console.log('checkGameRoom :>> ', checkGameRoom);
// 	if (checkGameRoom && checkGameRoom.isStartsGame) {
// 		const game = checkGameRoom.currentGame;
// 		// for (let i = 0; i < game.roomUsers.length; i++) {
// 		const roomUser = game.roomUsers[0];
// 		unicast(await getClientByIdStore(roomUser.clientId), {
// 			type: 'start_game',
// 			data: {
// 				ships: roomUser.ships,
// 				currentPlayerIndex: roomUser.idPlayer,
// 			},
// 			id: 0,
// 		});
// 		// }
// 		// game.roomUsers.forEach(async (roomUser) =>
// 		unicast(await getClientByIdStore(game.roomUsers[0].clientId), {
// 			type: 'turn',
// 			data: {
// 				currentPlayer: await turnUserService(game),
// 			},
// 			id: 0,
// 		});
// 		// );
// 	}

// 	// const dataToAtackService = {
// 	// 	type: 'attack',
// 	// 	data: `{"x":${Math.floor(Math.random() * 10)},"y":${Math.floor(Math.random() * 10)},"gameId":"${gameWithBot?.idGame}","indexPlayer":"${gameWithBot?.roomUsers[1].idPlayer}"}`,
// 	// 	id: 0,
// 	// };

// 	// const res = await attackService(clientId, dataToAtackService);
// 	// const { game, clients, data, sendPosition } = res!;
// 	// const { status, currentPlayer } = data;

// 	// const determineCurrentPlayer = async (status: string, currentPlayer: string) => {
// 	// 	return status === 'killed' || status === 'shot' ? currentPlayer : await turnUserService(game);
// 	// };

// 	// for (let i = 0; i < sendPosition.length; i++) {
// 	// 	data.position = sendPosition[i];
// 	// 	data.status = sendPosition.length === 1 || !i ? status : 'miss';

// 	// 	console.log('clients :>> ', clients);
// 	// 	await unicast(clients[0], {
// 	// 		type: 'attack',
// 	// 		data: data,
// 	// 		id: 0,
// 	// 	});
// 	// 	// clients.forEach(async (client) =>
// 	// 	unicast(clients[0], {
// 	// 		type: 'turn',
// 	// 		data: {
// 	// 			currentPlayer: await determineCurrentPlayer(
// 	// 				sendPosition.length === 1 ? status : 'shot',
// 	// 				currentPlayer
// 	// 			),
// 	// 		},
// 	// 		id: 0,
// 	// 	});
// 	// 	// );
// 	// }
// };

// // export const attackControllerForBot = async (clientId: string, req: WebSocketMessage) => {
// // 	console.log('clientId :>> ', clientId);
// // 	console.log('req :>> ', req);
// // 	// const dataToAtackService = {
// // 	// 	type: 'attack',
// // 	// 	data: `{"x":${Math.floor(Math.random() * 10)},"y":${Math.floor(Math.random() * 10)},"gameId":"${gameWithBot?.idGame}","indexPlayer":"${gameWithBot?.roomUsers[1].idPlayer}"}`,
// // 	// 	id: 0,
// // 	// };

// // 	// const res = await attackService(clientId, dataToAtackService);
// // 	// const { game, clients, data, sendPosition } = res!;
// // 	// const { status, currentPlayer } = data;

// // 	// const determineCurrentPlayer = async (status: string, currentPlayer: string) => {
// // 	// 	return status === 'killed' || status === 'shot' ? currentPlayer : await turnUserService(game);
// // 	// };

// // 	// for (let i = 0; i < sendPosition.length; i++) {
// // 	// 	data.position = sendPosition[i];
// // 	// 	data.status = sendPosition.length === 1 || !i ? status : 'miss';

// // 	// 	console.log('clients :>> ', clients);
// // 	// 	await unicast(clients[0], {
// // 	// 		type: 'attack',
// // 	// 		data: data,
// // 	// 		id: 0,
// // 	// 	});
// // 	// 	// clients.forEach(async (client) =>
// // 	// 	unicast(clients[0], {
// // 	// 		type: 'turn',
// // 	// 		data: {
// // 	// 			currentPlayer: await determineCurrentPlayer(
// // 	// 				sendPosition.length === 1 ? status : 'shot',
// // 	// 				currentPlayer
// // 	// 			),
// // 	// 		},
// // 	// 		id: 0,
// // 	// 	});
// // 	// 	// );
// // 	// }
// // };
// export const attackControllerForBot = async (clientId: string, req: WebSocketMessage) => {
// 	const res = await attackService(clientId, req);
// 	const { game, clients, data, sendPosition } = res!;
// 	const { status, currentPlayer } = data;

// 	const determineCurrentPlayer = async (status: string, currentPlayer: string) => {
// 		return status === 'killed' || status === 'shot' ? currentPlayer : await turnUserService(game);
// 	};

// 	for (let i = 0; i < sendPosition.length; i++) {
// 		data.position = sendPosition[i];
// 		data.status = sendPosition.length === 1 || !i ? status : 'miss';
// 		await broadcast(clients, {
// 			type: 'attack',
// 			data: data,
// 			id: 0,
// 		});
// 		clients.forEach(async (client) => {
// 			unicast(client, {
// 				type: 'turn',
// 				data: {
// 					currentPlayer: await determineCurrentPlayer(
// 						sendPosition.length === 1 ? status : 'shot',
// 						currentPlayer
// 					),
// 				},
// 				id: 0,
// 			});
// 		});
// 	}

// 	const winnerId = await checkWinsPlayerService(game, clientId, currentPlayer);
// 	if (winnerId && winnerId.clientId && winnerId.currentPlayer) {
// 		const userWinner = await getUserByIdStore(winnerId.clientId);
// 		if (userWinner) {
// 			await broadcast(clients, {
// 				type: 'finish',
// 				data: { winPlayer: winnerId.currentPlayer },
// 				id: 0,
// 			});
// 			console.log(userWinner.wins);
// 			userWinner.wins++;
// 			console.log(userWinner.wins);
// 			await updateUserStore(userWinner);
// 			const authUsers = await checkAuthUsers(await getClientsStoreKey(), await getUsersStore());
// 			broadcast(authUsers, await updateWinnersService());
// 			await deleteRoomStore(game.roomId);
// 			await deleteGameRoomStore(game.idGame);
// 		}
// 	} else if (currentPlayer.startsWith('bot')) {
// 		// Логика для бота
// 		const botClientId = currentPlayer; // ID бота
// 		const attackData = {
// 			x: Math.floor(Math.random() * 10),
// 			y: Math.floor(Math.random() * 10),
// 			gameId: game.idGame,
// 			indexPlayer: currentPlayer,
// 		};

// 		// Выполнение атаки ботом
// 		const botAttackResponse = await attackService(botClientId, {
// 			type: 'attack',
// 			data: JSON.stringify(attackData),
// 			id: 0,
// 		});

// 		// Обработка ответа бота
// 		const botRes = botAttackResponse!.data;
// 		if (botRes) {
// 			broadcast(clients, {
// 				type: 'attack',
// 				data: botRes,
// 				id: 0,
// 			});
// 		}
// 	}
// };
