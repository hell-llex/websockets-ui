import { User } from '../types';

const users = new Map<string, User>();

export const getUsersStore = async (): Promise<User[]> => Array.from(users.values());

export const getUserByIdStore = async (clientId: string): Promise<User | undefined> => {
	return users.get(clientId);
};

export const addUserStore = async (user: User): Promise<void> => {
	users.set(user.clientId, user);
};

export const updateUserStore = async (updatedUser: User): Promise<void> => {
	if (users.has(updatedUser.clientId)) {
		users.set(updatedUser.clientId, updatedUser);
	}
};

export const deleteUserStore = async (userId: string): Promise<void> => {
	users.delete(userId);
};
