import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const CreateGroupModal = ({ onClose }) => {
  // 1. Get friends list instead of allUsers
  const { friends, getFriends, createGroup } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    // 2. Fetch friends on load
    getFriends();
  }, [getFriends]);

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUsers.length < 2) {
      return toast.error("Must select at least 2 friends");
    }
    if (!groupName.trim()) {
      return toast.error("Group name is required");
    }
    
    createGroup({ groupName, participants: selectedUsers }, onClose);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Group Chat</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <h3 className="text-lg font-semibold mb-2">Select Friends</h3>
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {/* 3. Map over friends list */}
            {friends.length === 0 && (
                <p className="text-center text-base-content/70">You need at least 2 friends to create a group.</p>
            )}
            {friends.map((user) => {
              const initial = user.fullName ? user.fullName[0].toUpperCase() : "?";
              const profilePic = user.profilePic;

              return (
                <label key={user._id} className="label cursor-pointer flex items-center justify-start gap-3 p-2 hover:bg-base-200 rounded-lg">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                  />
                  <div className="avatar">
                    <div className="size-8 rounded-full border-2 border-base-300/20 overflow-hidden">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-base-300 flex items-center justify-center">
                          <span className="text-lg font-medium select-none">{initial}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="label-text">{user.fullName} (@{user.username})</span> 
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;