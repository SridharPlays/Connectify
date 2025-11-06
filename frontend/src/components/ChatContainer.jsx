import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils.js";
import { Trash2 } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedConversation, // Changed
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    listenForDeletedMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    // getMessages is now parameter-free, it uses the store's state
    getMessages(); 
    subscribeToMessages();
    listenForDeletedMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedConversation._id, // Re-run when conversation changes
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    listenForDeletedMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getSenderInfo = (senderId) => {
    if (senderId === authUser._id) {
        return authUser;
    }

    const sender = selectedConversation.participants.find(p => p._id === senderId);
    return sender || { fullName: "User", profilePic: "/avatar.png" }; // Fallback
  };


  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const handleDeleteMessage = (messageId) => {
    deleteMessage(messageId);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isSenderAuthUser = message.senderId._id === authUser._id;
          
          const currentUser = message.senderId; 
          
          const profilePic = currentUser.profilePic;
          const initial = currentUser.fullName
            ? currentUser.fullName[0].toUpperCase()
            : "?";

          return (
            <div
              key={message._id}
              className={`chat ${
                isSenderAuthUser ? "chat-end" : "chat-start"
              }`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border-2 border-slate-500/20 overflow-hidden">
                  {profilePic ? (
                    <img
                      src={profilePic || "/avatar.png"} 
                      alt="profile pic"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-base-300 flex items-center justify-center">
                      <span className="text-xl font-medium select-none">{initial}</span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`chat-bubble ${
                  isSenderAuthUser
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content"
                } flex flex-col relative group`}
              >
                {/* Show sender name in group chats */}
                {!isSenderAuthUser && selectedConversation.isGroupChat && (
                    <div className="text-xs font-bold opacity-60 mb-1">
                        {currentUser.fullName}
                    </div>
                )}
                
                {message.isDeleted ? (
                  <p className="italic text-sm opacity-70">
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </>
                )}

                {isSenderAuthUser && !message.isDeleted && (
                  <div
                    className="absolute top-1/2 translate-y-1/2 -left-5 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    title="Delete Message"
                    onClick={() => handleDeleteMessage(message._id)}
                  >
                    <Trash2 className="text-xs p-1 rounded-full bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors" />
                  </div>
                )}
                
                <div className="hidden group-hover:flex transition-all duration-500 justify-start">
                  <time className="text-[10px] opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;