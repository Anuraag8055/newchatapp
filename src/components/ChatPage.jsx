import React, { useEffect, useRef, useState } from "react";
import { MdSend } from "react-icons/md";
import { ClipboardCopy } from 'lucide-react';
import useChatContext from "../context/ChatContext";
import { useNavigate, useParams } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL, httpClient } from "../config/AxiosHelper";
import { getMessagess, getRoomApi } from "../services/RoomService";
import { timeAgo } from "../config/helper";




const ChatPage = () => {
  const {
    // roomId,
     currentUser,
     connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [room, setRoom] = useState(null);
  
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const {roomId}= useParams()
  //const [loading, setLoading] = useState(true);
  // to check roomid exists before joing through url
  useEffect(() => {
    const setup = async () => {
      console.log("🔍 Checking room:", roomId);
      try {
        const data = await getRoomApi(roomId);
        console.log("✅ Room fetched:", data);
  
        setRoomId(roomId);
  
        let user = sessionStorage.getItem("username");
        console.log(user);
        if (!user) {
          user = prompt("Enter your username to join the chat:");
          if (!user || user.trim() === "") {
            console.log("after entering username"+user);
            navigate("/");
            return;
          }
          sessionStorage.setItem("username", user);
        }
  
        setCurrentUser(user);
        setConnected(true);
        //setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch room:", err?.response || err);
        navigate("/404");
      }
    };
  
    if (roomId) {
      setup();
    }
  }, [roomId, navigate, setRoomId, setCurrentUser, setConnected]);

  // Check connection and redirect if not connected
  // useEffect(() => {
  //   if (!connected && !loading) {
  //     navigate("/");
  //   }
  // }, [connected, loading, navigate]);

  // Load messages and room data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [messagesData, roomData] = await Promise.all([
          getMessagess(roomId),
          httpClient.get(`/api/v1/rooms/${roomId}`).then(res => res.data),
        ]);
        setMessages(messagesData);
        setRoom(roomData);
      } catch (error) {
        toast.error("Failed to load room data");
      }
    };

    if (connected) {
      loadData();
    }
  }, [roomId, connected]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // WebSocket connection and subscriptions
  useEffect(() => {
    if (!connected) return;

    const sock = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(sock);

    client.connect({}, () => {
      setStompClient(client);
      toast.success("Connected to chat");

      // Subscribe to messages
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages((prev) => {
          const existingMessageIndex = prev.findIndex((msg) => msg.id === newMessage.id);

          if (existingMessageIndex !== -1) {
            // Update the existing message if it's already present in the state
            const updatedMessages = [...prev];
            updatedMessages[existingMessageIndex] = newMessage;
            return updatedMessages;
          } else {
            // Add the new message if it's not already in the state
            return [...prev, newMessage];
          }
        });
      });

      // Subscribe to updates on online users
      client.subscribe(`/topic/roomUsers/${roomId}`, (message) => {
        setOnlineUsers(JSON.parse(message.body));
      });
      
      client.send(`/app/join/${roomId}`, {}, currentUser);
      
      client.subscribe(`/topic/roomDeleted/${roomId}`, () => {
        toast.error("This room has been deleted by the admin");
      
        handleLogout();
      
        setTimeout(() => {
          window.location.reload(); // Give toast a moment to show
        }, 2000); // wait 2 seconds
      });

      

      
    }); 

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, [roomId, currentUser, connected]);
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stompClient && stompClient.connected) {
        stompClient.send(`/app/leave/${roomId}`, {}, currentUser);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stompClient, roomId, currentUser]);

  const sendMessage = () => {
    if (input.trim() && stompClient && connected) {
      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
      };

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
      setInput("");
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await httpClient.delete(
        `/api/v1/rooms/${roomId}/messages/${messageId}?requestedBy=${currentUser}`
      );
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, deleted: true } : m
        )
      );
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };
  

  const handleLogout = () => {
    if (stompClient && stompClient.connected) {
    stompClient.send(`/app/leave/${roomId}`, {}, currentUser); // 👈 notify server
    stompClient.disconnect(); // 👈 then disconnect
  }
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
    
   
  };
  const copyRoomLink = () => {
    const url = `${window.location.origin}/chat/${roomId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success("Link copied!"))
        .catch(() => toast.error("Failed to copy"));
    } else {
      // Fallback for browsers that don't support Clipboard API in non-HTTPS contexts
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white shadow-md rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-gray-800">
              Room: <span className="text-blue-600">{roomId}</span>
              <span className="ml-2">
                <button onClick={copyRoomLink} title="Copy room link">
                  <ClipboardCopy className="w-5 h-5 text-blue-500 hover:text-blue-700" />
                </button>
              </span>
            </h1>
            <p className="text-sm text-gray-600">
              Topic:{" "}
              <span className="text-blue-500">
                {room?.roomTopic || "General"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm text-gray-700 font-medium">
              User:{" "}
              <span className="text-green-600 font-semibold">
                {currentUser}
                {room?.adminUser === currentUser && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </span>
            </h2>
            {room?.adminUser === currentUser && (
              <button
                onClick={async () => {
                  try {
                    await httpClient.delete(
                      `/api/v1/rooms/${roomId}?requestedBy=${currentUser}`
                    );
                    navigate("/");
                  } catch {
                    toast.error("Only admin can delete the room");
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-full"
              >
                Delete Room
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-full"
            >
              Leave Room
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6 px-6 py-4 bg-gray-50">
          {/* Chat Messages */}
          <div className="w-full md:w-3/4 h-[420px] overflow-y-auto space-y-4 p-4 rounded-lg bg-white shadow-inner">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === currentUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`relative p-3 rounded-xl max-w-xs md:max-w-md ${
                    message.sender === currentUser
                      ? "bg-green-700"
                      : "bg-gray-800"
                  }`}
                >
                  {room?.adminUser === currentUser && !message.deleted && (
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      title="Delete message"
                    >
                      ×
                    </button>
                  )}
                  <div className="flex gap-3">
                    {!message.deleted && (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={`https://avatar.iran.liara.run/public/?username=${message.sender}`}
                        alt={message.sender}
                      />
                    )}
                    <div>
                      {message.deleted ? (
                        <p className="text-sm italic text-gray-400">
                          This message was deleted by an admin.
                        </p>
                      ) : (
                        <>
                          <p className="font-bold text-sm text-white flex items-center gap-1">
                            {message.sender}
                            {room?.adminUser === message.sender && (
                              <span className="text-xs bg-blue-500 px-1 rounded">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-white text-sm">
                            {message.content}
                          </p>
                        </>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        {timeAgo(message.timeStamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reserved space for other future sections like online users */}
          <div className="w-full md:w-1/4 p-4 bg-white shadow-inner rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Online Users:
            </h3>
            <ul>
              {onlineUsers.map((user, index) => (
                <li key={index} className="text-sm text-gray-700 ">
                  <span>{user}</span>
                  {room?.adminUser === user && (
                    <span className="text-xs text-white bg-blue-500 px-1 rounded">
                      Admin
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Message Input */}
        <div className="w-full px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-transparent focus:outline-none text-sm px-2 py-1 text-white-700"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full disabled:opacity-50"
            >
              <MdSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default ChatPage;