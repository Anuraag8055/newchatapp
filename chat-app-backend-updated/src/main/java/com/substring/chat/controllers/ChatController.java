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
import java.util.Map;
import java.util.UUID;

@Controller
@CrossOrigin
public class ChatController {


	private final RoomService roomService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(RoomService roomService, ChatService chatService,SimpMessagingTemplate messagingTemplate) {
        this.roomService = roomService;
        this.chatService = chatService;
		this.messagingTemplate = messagingTemplate;
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
    
 // User requests to join
    @MessageMapping("/requestJoin/{roomId}")
    public void handleJoinRequest(
        @DestinationVariable String roomId, 
        @Payload String username
    ) {
        Room room = roomService.findByRoomId(roomId);
        if (room != null) {
            room.addPendingUser(username);
            roomService.save(room);
            
            // Notify admin
//            messagingTemplate.convertAndSendToUser(
//                room.getAdminUser(), 
//                "/queue/joinRequests", 
//                Map.of(
//                    "roomId", roomId,
//                    "username", username
//                )
//            );
            messagingTemplate.convertAndSend(
                    "/topic/admin-joinRequests/" + room.getAdminUser(), // Unique channel per admin
                    Map.of("roomId", roomId, "username", username)
                );
            // Debug log
            System.out.println("Sent join request to admin: " + room.getAdminUser());
        }
    }

    // Admin approves/rejects
    @MessageMapping("/handleRequest/{roomId}")
    public void handleRequestDecision(
        @DestinationVariable String roomId,
        @Payload Map<String, Object> payload
    ) {
        String username = (String) payload.get("username");
        boolean approved = (Boolean) payload.get("approved");
        Room room = roomService.findByRoomId(roomId);
        
        if (approved) {
           room= roomService.addUserToRoom(roomId, username);
            chatService.broadcastRoomUsers(roomId, room.getConnectedUsers());
        }
        
        // Notify user
        messagingTemplate.convertAndSend(
            "/topic/joinStatus/" + username, 
            Map.of(
                "approved", approved,
                "roomId", roomId
            )
        );
        
        // Remove from pending
       
        room.removePendingUser(username);
        roomService.save(room);
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
