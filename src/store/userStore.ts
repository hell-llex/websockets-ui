// store/userStore.ts
import { User } from '../types';

let users: User[] = [];

export const getUsersStore = async (): Promise<User[]> => users;

export const addUserStore = async (user: User): Promise<void> => {
	users.push(user);
};

export const updateUserStore = async (updatedUser: User): Promise<void> => {
	const index = users.findIndex((u) => u.id === updatedUser.id);
	if (index !== -1) {
		users[index] = updatedUser;
	}
};

export const deleteUserStore = async (userId: string): Promise<void> => {
	users = users.filter((u) => u.id !== userId);
};
