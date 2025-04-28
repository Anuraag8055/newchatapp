package com.substring.chat.services;

import java.util.List;

import com.substring.chat.entities.Message;
import com.substring.chat.playload.MessageRequest;

public interface ChatService {
	Message handleSendMessage(MessageRequest request);
    void broadcastRoomUsers(String roomId, List<String> users);
}
