import {
	createUserController,
	// validateUserController
} from '../controller';
import { WebSocketMessage } from '../types';

export const router = async (data: WebSocketMessage) => {
	console.log('data :>> ', data);

	switch (data.type) {
		case 'reg':
			return await createUserController(data);
			break;
		case 'reg':
			return await createUserController(data);
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
