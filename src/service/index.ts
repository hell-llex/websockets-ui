import { User, WebSocketMessage } from '../types';
import { addUserStore, getUsersStore } from '../store/userStore';

export const createUserService = async (req: WebSocketMessage) => {
	const reqParse = { ...req, data: JSON.parse(req.data) };
	const res = {
		type: 'reg',
		data: {
			name: reqParse.data.name,
			index: 0,
			error: false,
			errorText: '',
		},
		id: req.id,
	};
	try {
		const users = await getUsersStore();
		const userExists = users.some((user: User) => user.name === reqParse.data.name);
		if (userExists) {
			// логиним
			// await addUserStore({ id: reqParse.id, ...reqParse.data });
		} else {
			// создаем
			await addUserStore({ id: reqParse.id, ...reqParse.data });
		}

		return { ...res, data: JSON.stringify({ ...res.data, index: users.length }) };
	} catch (error: any) {
		return {
			...res,
			data: JSON.stringify({
				name: res.data.name,
				index: 0,
				error: true,
				errorText: error.message,
			}),
		};
	}
};

export const validateUserService = async (req: WebSocketMessage) => {
	return req;
	// const users = await getUsersStore();
	// const existingUser = users.find(
	// 	(user) => user.name === payload.name && user.password === payload.password
	// );

	// if (existingUser) {
	// 	return { type: 'success', message: 'Пользователь валиден' };
	// } else {
	// 	return { type: 'error', message: 'Неправильные данные пользователя' };
	// }
};
