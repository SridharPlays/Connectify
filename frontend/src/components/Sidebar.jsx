import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Plus, Users, MessageSquarePlus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import StartChatModal from "./StartChatModal";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showStartChatModal, setShowStartChatModal] = useState(false);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  const getConversationDisplayInfo = (convo) => {
    if (convo.isGroupChat) {
      return {
        name: convo.groupName,
        pic: convo.groupIcon, // Groups can have a pic or just show an initial
        isOnline: false,
      };
    } else {
      const otherUser = convo.participants[0];
      if (!otherUser) return { name: "User", pic: null };

      return {
        name: otherUser.fullName,
        pic: otherUser.profilePic,
        isOnline: onlineUsers.includes(otherUser._id),
      };
    }
  };

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-96 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Conversations</span>
          </div>
          <div className="hidden lg:flex items-center gap-1">
            <button
              className="btn btn-ghost btn-circle btn-sm"
              title="New 1-on-1 Chat"
              onClick={() => setShowStartChatModal(true)}
            >
              <MessageSquarePlus className="size-5" />
            </button>
            <button
              className="btn btn-ghost btn-circle btn-sm"
              title="Create Group"
              onClick={() => setShowGroupModal(true)}
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto w-full py-3">
          {conversations.map((convo) => {
            const { name, pic, isOnline } = getConversationDisplayInfo(convo);
            const initial = name ? name[0].toUpperCase() : "?";
            const latestMessageText = convo.latestMessage?.text;
            const latestMessageSender = convo.latestMessage?.senderId?.fullName?.split(" ")[0];

            return (
              <button
                key={convo._id}
                onClick={() => setSelectedConversation(convo)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${
                    selectedConversation?._id === convo._id
                      ? "bg-base-300"
                      : ""
                  }
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  {/* --- AVATAR LOGIC START --- */}
                  <div className="avatar">
                    <div className="size-12 rounded-full border-2 border-base-300/20 overflow-hidden">
                      {pic ? (
                        <img
                          src={pic}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-base-300 flex items-center justify-center">
                          <span className="text-2xl font-medium select-none">{initial}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* --- AVATAR LOGIC END --- */}

                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-1 ring-green-600"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{name}</div>
                  <div className="text-sm text-base-content/70 truncate">
                    {latestMessageText 
                      ? `${latestMessageSender || '...'} ${latestMessageText}` 
                      : (convo.isGroupChat ? "Group created" : "Chat started")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      
      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} />}
      {showStartChatModal && <StartChatModal onClose={() => setShowStartChatModal(false)} />}
    </>
  );
};
export default Sidebar;