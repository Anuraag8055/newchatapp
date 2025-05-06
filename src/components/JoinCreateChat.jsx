import React, { useState } from "react";
import chatIcon from "../assets/chat.png";
import toast from "react-hot-toast";
import { createRoomApi,validateRoomApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";

const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    //roomId: "",
    userName: "",
    roomTopic: "",
    action:null
  });

  const { setRoomId, setCurrentUser, setConnected } = useChatContext();
  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (!detail.userName) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    return true;
  }

  async function joinChat() {
    if (!validateForm()) return;
    try {
      const room = await validateRoomApi(detail.roomId);
      //toast.success("Joined Room");
      setCurrentUser(detail.userName);
      setRoomId(room.roomId);
      setConnected(true);
      sessionStorage.setItem("username", detail.userName);
      navigate(`/chat/${room.roomId}`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Error joining room");
      }
    }
  }

  async function createRoom() {
    if (!validateForm()) return;
    try {
      const response = await createRoomApi({
        //roomId: detail.roomId,
        roomTopic: detail.roomTopic,
        adminUser: detail.userName,
      });
      toast.success("Room Created");
      setCurrentUser(detail.userName);
      setRoomId(response.roomId);
      setConnected(true);
      sessionStorage.setItem("username", detail.userName);
      navigate(`/chat/${response.roomId}`, {
        state: { isAdmin: true } // Flag for immediate access
      });
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("Room already exists!");
      } else {
        toast.error("Error creating room");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <img src={chatIcon} alt="Chat Icon" className="w-16 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">
            {detail.action
              ? detail.action === "join"
                ? "Join a Room"
                : "Create a Room"
              : "Join or Create a Room"}
          </h2>
        </div>

        {!detail.action ? (
          <div className="flex justify-between gap-4">
            <button
              onClick={() => setDetail((prev) => ({ ...prev, action: "join" }))}
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
            >
              Join Room
            </button>
            <button
              onClick={() =>
                setDetail((prev) => ({ ...prev, action: "create" }))
              }
              className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition"
            >
              Create Room
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="userName"
                value={detail.userName}
                onChange={handleFormInputChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
              />
            </div>

            {detail.action === "join" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room ID
                </label>
                <input
                  type="text"
                  name="roomId"
                  value={detail.roomId}
                  onChange={handleFormInputChange}
                  placeholder="Enter room ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Topic (optional)
                </label>
                <input
                  type="text"
                  name="roomTopic"
                  value={detail.roomTopic}
                  onChange={handleFormInputChange}
                  placeholder="e.g., Project Discussion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
                />
              </div>
            )}

            <div className="flex justify-between gap-4">
              <button
                onClick={() =>
                  setDetail((prev) => ({
                    ...prev,
                    action: null,
                    roomId: "",
                    roomTopic: "",
                  }))
                }
                className="w-1/3 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md transition"
              >
                Back
              </button>
              <button
                onClick={detail.action === "join" ? joinChat : createRoom}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
              >
                {detail.action === "join" ? "Join Room" : "Create Room"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinCreateChat;