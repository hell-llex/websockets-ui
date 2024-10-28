import {
	addShipsController,
	addUserToRoomController,
	attackController,
	// attackControllerForBot,
	createRoomController,
	createUserController,
	// singleGameController,
} from '../controller';
import { getGameRoomByIdStore } from '../store/gameStore';
import { WebSocketMessage } from '../types';

export const router = async (clientId: string, data: WebSocketMessage) => {
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
			// if ((gameId as String).startsWith('bot')) {
			// 	return await attackControllerForBot(clientId, data);
			// }
			const currentGame = await getGameRoomByIdStore(gameId);
			if (currentGame && currentGame.currentPlayer === indexPlayer)
				return await attackController(clientId, data);
			break;
		case 'randomAttack':
			const reqParse = { ...data, data: JSON.parse(data.data) };
			reqParse.data.x = Math.floor(Math.random() * 10);
			reqParse.data.y = Math.floor(Math.random() * 10);
			return await attackController(clientId, { ...reqParse, data: JSON.stringify(reqParse.data) });
			break;
		// case 'single_play':
		// 	// return await addShipsController(clientId, data);
		// 	return await singleGameController(clientId, data);
		// 	break;
		default:
			break;
	}
};
