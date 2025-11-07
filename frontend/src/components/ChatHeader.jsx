import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const getHeaderInfo = () => {
    if (selectedConversation.isGroupChat) {
      return {
        name: selectedConversation.groupName,
        pic: selectedConversation.groupIcon,
        status: `${selectedConversation.participants.length + 1} members`,
      };
    } else {
      const otherUser = selectedConversation.participants[0];
      const isOnline = onlineUsers.includes(otherUser._id);
      return {
        name: otherUser.fullName,
        pic: otherUser.profilePic,
        status: isOnline ? "Online" : "Offline",
      };
    }
  };

  const { name, pic, status } = getHeaderInfo();
  const initial = name ? name[0].toUpperCase() : "?";

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* --- AVATAR LOGIC START --- */}
          <div className="avatar">
            <div className="size-10 rounded-full border-2 border-base-300/20 overflow-hidden">
              {pic ? (
                <img
                  src={pic}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-base-300 flex items-center justify-center">
                  <span className="text-xl font-medium select-none">{initial}</span>
                </div>
              )}
            </div>
          </div>
          {/* --- AVATAR LOGIC END --- */}

          {/* User/Group info */}
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-base-content/70">
              {status}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedConversation(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;