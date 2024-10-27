import { WebSocketMessage } from '../types';
// import { addUserStore, getUsersStore } from './store/userStore';
import { createUserService, validateUserService } from '../service';

export const createUserController = async (data: WebSocketMessage) => {
	const res = await createUserService(data);
	return res;
};

export const validateUserController = async (data: WebSocketMessage) => {
	const res = await validateUserService(data);
	return res;
};
