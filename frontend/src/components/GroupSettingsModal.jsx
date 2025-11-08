import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Check, Loader2, LogOut, Shield, Trash2, UserPlus, X, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ onClose }) => {
  const { 
    selectedConversation, 
    friends, // 1. Get friends
    getFriends, // 1. Get getFriends
    updateGroupDetails, 
    addParticipant, 
    removeParticipant,
    leaveGroup
  } = useChatStore();
  const { authUser } = useAuthStore();

  const [groupName, setGroupName] = useState(selectedConversation.groupName);
  const [selectedImg, setSelectedImg] = useState(null);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [usersToAdd, setUsersToAdd] = useState([]);

  const isAdmin = selectedConversation.groupAdmin === authUser._id;

  // 2. Fetch friends on mount
  useEffect(() => {
    getFriends();
  }, [getFriends]);

  // 3. Filter FRIENDS who are NOT already in the group
  useEffect(() => {
    if (friends.length > 0) {
      const currentParticipantIds = selectedConversation.participants.map(p => p._id);
      
      setUsersToAdd(
        friends.filter(friend => !currentParticipantIds.includes(friend._id))
      );
    }
  }, [friends, selectedConversation.participants]);

  // Handle Group Icon Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateGroupDetails(selectedConversation._id, { groupIconBase64: base64Image });
      setIsUploading(false);
    };
  };

  // Handle Group Name Change
  const handleNameChange = async () => {
    if (!groupName.trim() || groupName === selectedConversation.groupName) {
      return setIsNameEditing(false);
    }
    await updateGroupDetails(selectedConversation._id, { groupName: groupName });
    setIsNameEditing(false);
  };

  // Handle Add Participant
  const handleAddParticipant = async (e) => {
    const userIdToAdd = e.target.value;
    if (!userIdToAdd) return;
    await addParticipant(selectedConversation._id, userIdToAdd);
    e.target.value = ""; // Reset dropdown
  };

  // Handle Remove Participant
  const handleRemoveParticipant = async (participantId) => {
    if (window.confirm("Are you sure you want to remove this user?")) {
      await removeParticipant(selectedConversation._id, participantId);
    }
  };

  // Handle Leave Group
  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedConversation._id, onClose);
    }
  };

  const getAvatar = (user, size = "size-10") => {
    const initial = user.fullName ? user.fullName[0].toUpperCase() : "?";
    return (
      <div className={`avatar ${size}`}>
        <div className={`rounded-full border-2 border-base-300/20 overflow-hidden ${size}`}>
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-base-300 flex items-center justify-center">
              <span className="text-xl font-medium select-none">{initial}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Find the full user object for the admin
  const adminUser = selectedConversation.groupAdmin === authUser._id 
    ? authUser 
    : selectedConversation.participants.find(p => p._id === selectedConversation.groupAdmin);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Group Settings</h2>
          <button type="button" className="btn btn-ghost btn-circle" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Group Info (Pic + Name) */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              {getAvatar({ fullName: groupName, profilePic: selectedImg || selectedConversation.groupIcon }, "size-32")}
              {isAdmin && (
                <label
                  htmlFor="group-avatar-upload"
                  className={`
                    absolute bottom-1 right-1 
                    bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer 
                    transition-all duration-200 ${isUploading ? "animate-pulse" : ""}
                  `}
                >
                  {isUploading ? <Loader2 className="size-5 text-base-200 animate-spin" /> : <Camera className="w-5 h-5 text-base-200" />}
                  <input
                    type="file" id="group-avatar-upload" className="hidden"
                    accept="image/*" onChange={handleImageUpload} disabled={isUploading}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isNameEditing ? (
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              ) : (
                <h3 className="text-xl font-semibold">{groupName}</h3>
              )}
              {isAdmin && (
                <button className="btn btn-ghost btn-circle btn-sm" onClick={isNameEditing ? handleNameChange : () => setIsNameEditing(true)}>
                  {isNameEditing ? <Check /> : <Edit2 className="size-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Add Participants */}
          {isAdmin && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Add Participant</h4>
              <div className="flex items-center gap-2">
                <UserPlus className="size-5" />
                <select className="select select-bordered flex-1" onChange={handleAddParticipant} defaultValue="">
                  <option value="" disabled>Select a friend to add...</option>
                  {usersToAdd.length > 0 ? (
                    usersToAdd.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.fullName} (@{user.username})
                      </option>
                    ))
                  ) : (
                    <option disabled>All friends are in the group</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Member List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">{selectedConversation.participants.length + 1} Members</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              
              {/* Admin (display them first) */}
              {adminUser && (
                <div className="flex items-center justify-between p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAvatar(adminUser)}
                    <span>{adminUser.fullName} {adminUser._id === authUser._id ? "(You)" : ""}</span>
                  </div>
                  <Shield className="size-5 text-success" title="Group Admin" />
                </div>
              )}
              
              {/* Other Participants */}
              {selectedConversation.participants
                .filter(user => user._id !== selectedConversation.groupAdmin) // Filter out admin
                .map(user => (
                  <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
                    <div className="flex items-center gap-3">
                      {getAvatar(user)}
                      <span>{user.fullName} {user._id === authUser._id ? "(You)" : ""}</span>
                    </div>
                    {isAdmin && user._id !== authUser._id && (
                      <button className="btn btn-ghost btn-circle btn-sm text-error" onClick={() => handleRemoveParticipant(user._id)}>
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Leave Group */}
        <div className="border-t border-base-300 pt-4">
          <button className="btn btn-error btn-block" onClick={handleLeaveGroup}>
            <LogOut className="size-5" />
            Leave Group
          </button>
        </div>

      </div>
    </div>
  );
};

export default GroupSettingsModal;