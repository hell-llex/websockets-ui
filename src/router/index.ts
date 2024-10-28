// import { WebSocket } from 'ws';
import {
	addShipsController,
	addUserToRoomController,
	attackController,
	createRoomController,
	createUserController,
	// validateUserController
} from '../controller';
import { getGameRoomByIdStore } from '../store/gameStore';
import { WebSocketMessage } from '../types';

export const router = async (clientId: string, data: WebSocketMessage) => {
	// console.log('data :>> ', data);

	switch (data.type) {
		case 'reg':
			return await createUserController(clientId, data);
			break;
		case 'create_room':
			return await createRoomController(clientId, data);
			break;
		case 'add_user_to_room':
			return await addUserToRoomController(clientId, data);
			break;
		case 'add_ships':
			return await addShipsController(clientId, data);
			break;
		case 'attack':
			const { gameId, indexPlayer } = JSON.parse(data.data);
			const currentGame = await getGameRoomByIdStore(gameId);
			if (currentGame && currentGame.currentPlayer === indexPlayer)
				return await attackController(clientId, data);
			break;
		case 'randomAttack':
			return await attackController(clientId, data); // TODO: добавить позицию
			break;
		default:
			break;
		// case 'reg':
		// 	await createUserController(data.payload);
		// 	break;
		// case 'reg':
		// 	await createUserController(data.payload);
		// 	break;
		// case 'reg':
		// 	await createUserController(data.payload);
		// 	break;

		// case 'validate_user':
		// 	await validateUserController(data.payload);
		// 	break;

		// Обработка других сообщений
	}
};
