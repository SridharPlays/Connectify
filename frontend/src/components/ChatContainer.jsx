import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils.js";
import { Trash2, Check, CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    listenForDeletedMessages,
    listenForMessagesRead,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(); 
    subscribeToMessages();
    listenForDeletedMessages();
    listenForMessagesRead();
    
    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedConversation._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    listenForDeletedMessages,
    listenForMessagesRead,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
          if (!message || !message.senderId) {
             console.warn("Skipping rendering a malformed message:", message);
             return null; // Skip rendering if message is invalid
          }

          const isSenderAuthUser = message.senderId._id === authUser._id;
          const currentUser = message.senderId; 
          const profilePic = currentUser.profilePic;
          const initial = currentUser.fullName ? currentUser.fullName[0].toUpperCase() : "?";

          // Read Receipt Logic 
          let readStatusIcon = null;
          if (isSenderAuthUser && !message.isDeleted) {
            const readByOthers = message.readBy.filter(
              (user) => user._id !== authUser._id
            );
            
            if (selectedConversation.isGroupChat) {
                // Group Chat: Seen by all (blue) or at least 1 (grey)
                const isReadByAll = readByOthers.length === selectedConversation.participants.length;
                if (isReadByAll) {
                    readStatusIcon = <CheckCheck className="size-4 text-blue-500" />;
                } else if (readByOthers.length > 0) {
                    readStatusIcon = <CheckCheck className="size-4" />;
                } else {
                    readStatusIcon = <Check className="size-4" />; // Sent
                }
            } else {
                // 1-on-1 Chat: Seen (blue) or Sent (grey)
                if (readByOthers.length > 0) {
                    readStatusIcon = <CheckCheck className="size-4 text-blue-500" />; // Read
                } else {
                    readStatusIcon = <Check className="size-4" />; // Sent
                }
            }
          }

          return (
            <div
              key={message._id || index}
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
                
                <div className="flex items-center gap-1 justify-end transition-all duration-500 mt-1">
                  <time className="text-[10px] opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {isSenderAuthUser && !message.isDeleted && readStatusIcon}
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