package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.playload.MessageRequest;
import com.substring.chat.repositories.RoomRepository;
import com.substring.chat.services.ChatService;
import com.substring.chat.services.RoomService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Controller
@CrossOrigin
public class ChatController {


	private final RoomService roomService;
    private final ChatService chatService;

    public ChatController(RoomService roomService, ChatService chatService) {
        this.roomService = roomService;
        this.chatService = chatService;
    }
    
  //for sending and receiving messages
    @MessageMapping("/sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            @RequestBody MessageRequest request
    ) {
        return chatService.handleSendMessage(request);
    }
    
    //userJoin
    @MessageMapping("/join/{roomId}")
    public Room handleUserJoin(
            @DestinationVariable String roomId,
            @Payload String username
    ) {
        Room room = roomService.addUserToRoom(roomId, username);
        if (room != null) {
            chatService.broadcastRoomUsers(roomId, room.getConnectedUsers());
            return room;
        }
        throw new RuntimeException("Room not found!");
    }
    
    //userLeave
    @MessageMapping("/leave/{roomId}")
    public Room leaveRoom(
            @DestinationVariable String roomId,
            @Payload String username
    ) {
        Room room = roomService.removeUserFromRoom(roomId, username);
        if (room != null) {
            chatService.broadcastRoomUsers(roomId, room.getConnectedUsers());
            return room;
        }
        throw new RuntimeException("Room not found!");
    }
    

    
}
