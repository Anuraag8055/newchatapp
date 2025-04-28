package com.substring.chat.services;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.playload.MessageRequest;

@Service
public class ChatServiceImpl implements ChatService {
	 private final RoomService roomService;
	    private final SimpMessagingTemplate messagingTemplate;

	    public ChatServiceImpl(RoomService roomService, SimpMessagingTemplate messagingTemplate) {
	        this.roomService = roomService;
	        this.messagingTemplate = messagingTemplate;
	    }

	    @Override
	    public Message handleSendMessage(MessageRequest request) {
	        Message message = new Message(request.getSender(), request.getContent());
	        Room room = roomService.addMessageToRoom(request.getRoomId(), message);
	        if (room != null) {
	            return message;
	        }
	        throw new RuntimeException("Failed to send message - room not found");
	    }

	    @Override
	    public void broadcastRoomUsers(String roomId, List<String> users) {
	        messagingTemplate.convertAndSend("/topic/roomUsers/" + roomId, users);
	    }
}
