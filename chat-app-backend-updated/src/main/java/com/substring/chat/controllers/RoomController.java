package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.repositories.RoomRepository;
import com.substring.chat.services.RoomService;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin
public class RoomController {
	
	private final SimpMessagingTemplate simpMessagingTemplate;
    private final RoomService roomService;

    public RoomController(RoomService roomService, SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.roomService = roomService;
    }

    // Create Room (Now with Topic + Admin)
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> request) {
        String roomId = UUID.randomUUID().toString();
        
        String adminUser = request.get("adminUser").replaceAll("^\"|\"$","");
        
        if (roomService.findByRoomId(roomId) != null) {
            return ResponseEntity.badRequest().body("Room exists!");
        }

        Room room = roomService.createRoom(roomId, request.get("roomTopic"), adminUser);
        return ResponseEntity.ok(room);
    }
    
 // Delete Room (Admin Only)
    @DeleteMapping("/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId, @RequestParam String requestedBy) {
        Room room = roomService.findByRoomId(roomId);
        if (room == null)
            return ResponseEntity.notFound().build();

        if (!room.getAdminUser().equals(requestedBy)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admin can delete this room!");
        }

        roomService.delete(room);
        simpMessagingTemplate.convertAndSend("/topic/roomDeleted/" + roomId, "Room has been deleted by admin");
        return ResponseEntity.ok("Room deleted!");
    }
    
  //Delete Message(deletes from database)
    @DeleteMapping("/{roomId}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String roomId, @PathVariable String messageId,
            @RequestParam String requestedBy) {
        Room room = roomService.findByRoomId(roomId);
        if (room == null)
            return ResponseEntity.notFound().build();

        if (!room.getAdminUser().equals(requestedBy)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Message> messageToDelete = roomService.findMessageInRoom(roomId, messageId);
        if (messageToDelete.isPresent()) {
            Message msg = messageToDelete.get();
            msg.setDeleted(true);
            roomService.save(room);
            simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, msg);
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.notFound().build();
    }
    
  //get room: join
    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        Room room = roomService.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found!!");
        }
        return ResponseEntity.ok(room);
    }
    
  //get messages of room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size
    ) {
        List<Message> messages = roomService.getMessagesPaginated(roomId, page, size);
        return ResponseEntity.ok(messages);
    }


}
