import { Room, RoomUser } from '../types';
import { generateId } from '../utils';

const rooms = new Map<string, Room>();

export const getRoomsStore = async (): Promise<Room[]> => {
	return Array.from(rooms.values());
};

export const createRoomStore = async (user: RoomUser): Promise<Room> => {
	const room: Room = { roomId: generateId(), roomUsers: [user] };
	rooms.set(room.roomId, room);
	return room;
};

export const getRoomByIdStore = async (id: string): Promise<Room | undefined> => {
	return rooms.get(id);
};

export const addUserToRoomStore = async (
	roomId: string,
	newUser: RoomUser
): Promise<string | undefined> => {
	const room = rooms.get(roomId);
	if (room && room.roomUsers.length <= 1) {
		room.roomUsers = [...room.roomUsers, newUser];
		rooms.set(roomId, room);
		return room.roomId;
	}
};

export const deleteRoomStore = async (roomId: string): Promise<void> => {
	rooms.delete(roomId);
};
