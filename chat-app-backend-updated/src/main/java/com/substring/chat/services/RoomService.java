package com.substring.chat.services;

import java.util.List;
import java.util.Optional;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;

public interface RoomService {
	Room findByRoomId(String roomId);
	Room save(Room room);
	Room createRoom(String roomId, String roomTopic, String adminUser);
	void delete(Room room);
	Optional<Message> findMessageInRoom(String roomId, String messageId);
	List<Message> getMessagesPaginated(String roomId, int page, int size);
	Room addMessageToRoom(String roomId, Message message);
	List<String> getConnectedUsers(String roomId);
	Room addUserToRoom(String roomId, String username);
	Room removeUserFromRoom(String roomId, String username);

}
