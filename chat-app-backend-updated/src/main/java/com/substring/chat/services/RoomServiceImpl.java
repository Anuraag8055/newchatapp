package com.substring.chat.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.repositories.RoomRepository;

@Service
public class RoomServiceImpl implements RoomService{
	private final RoomRepository roomRepository;

	public RoomServiceImpl(RoomRepository roomRepository) {
		this.roomRepository = roomRepository;
	}

	@Override
	public Room findByRoomId(String roomId) {
		return roomRepository.findByRoomId(roomId);
	}

	@Override
	public Room save(Room room) {
		return roomRepository.save(room);
	}
	
	@Override
	public Room createRoom(String roomId, String roomTopic, String adminUser) {
		Room room = new Room();
		room.setRoomId(roomId);
		room.setRoomTopic(roomTopic);
		room.setAdminUser(adminUser);
		room.setConnectedUsers(new ArrayList<>(List.of(adminUser)));
		return roomRepository.save(room);
	}

	@Override
	public void delete(Room room) {
		roomRepository.delete(room);
	}

	{/* retrieves a detached Message object.  read only view*/}
	@Override
	public Optional<Message> findMessageInRoom(String roomId, String messageId) {
		Room room = findByRoomId(roomId);
		if (room != null) {
			return room.getMessages().stream().filter(m -> m.getId().equals(messageId)).findFirst();
		}
		return Optional.empty();
	}

	@Override
	public List<Message> getMessagesPaginated(String roomId, int page, int size) {
		Room room = findByRoomId(roomId);
		if (room != null) {
			List<Message> messages = room.getMessages();
			int start = Math.max(0, messages.size() - (page + 1) * size);
			int end = Math.min(messages.size(), start + size);
			return messages.subList(start, end);
		}
		return new ArrayList<>();
	}
	
	@Override
	public Room addMessageToRoom(String roomId, Message message) {
		Room room = findByRoomId(roomId);
		if (room != null) {
			room.getMessages().add(message);
			return roomRepository.save(room);
		}
		return null;
	}


	@Override
	public List<String> getConnectedUsers(String roomId) {
		Room room = findByRoomId(roomId);
		return room != null ? room.getConnectedUsers() : new ArrayList<>();
	}

	@Override
	public Room addUserToRoom(String roomId, String username) {
		Room room = findByRoomId(roomId);
		if (room != null) {
			room.addUser(username);
			return roomRepository.save(room);
		}
		return null;
	}

	@Override
	public Room removeUserFromRoom(String roomId, String username) {
		Room room = findByRoomId(roomId);
		if (room != null) {
			room.removeUser(username);
			return roomRepository.save(room);
		}
		return null;
	}

}
