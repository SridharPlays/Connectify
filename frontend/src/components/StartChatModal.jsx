import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

const StartChatModal = ({ onClose }) => {
  const { allUsers, getAllUsers, findOrCreateConversation } = useChatStore();

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  const handleUserClick = (userId) => {
    findOrCreateConversation(userId, onClose);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Start a new Chat</h2>
        <p className="text-base-content/70 mb-4">Select a user to start a conversation.</p>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {allUsers.map((user) => {
            const initial = user.fullName ? user.fullName[0].toUpperCase() : "?";
            const profilePic = user.profilePic;

            return (
              <button
                key={user._id}
                className="w-full flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg"
                onClick={() => handleUserClick(user._id)}
              >
                {/* AVATAR LOGIC START */}
                <div className="avatar">
                  <div className="size-10 rounded-full border-2 border-base-300/20 overflow-hidden">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <span className="text-xl font-medium select-none">{initial}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* AVATAR LOGIC END */}
                <span className="label-text">{user.fullName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartChatModal;