/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Check, MessageSquare, Search, Send, Trash2, UserPlus, Users, X, Bell } from "lucide-react";
import toast from "react-hot-toast";

const Avatar = ({ user, size = "size-10" }) => {
  const initial = user.fullName ? user.fullName[0].toUpperCase() : "?";
  const profilePic = user.profilePic;
  
  return (
    <div className={`avatar ${size}`}>
      <div className={`rounded-full border-2 border-base-300/20 overflow-hidden ${size}`}>
        {profilePic ? (
          <img src={profilePic} alt={user.fullName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-base-300 flex items-center justify-center">
            <span className="text-xl font-medium select-none">{initial}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FindUsersTab = () => {
  const [username, setUsername] = useState("");
  const { searchedUsers, searchUsers, sendFriendRequest } = useChatStore();
  const { authUser } = useAuthStore();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!username) return;
    searchUsers(username);
  };

  const getButtonState = (user) => {
    if (user.friends.includes(authUser._id)) {
      return <button className="btn btn-sm btn-disabled">Friends</button>;
    }
    if (user.friendRequestsSent.includes(authUser._id)) {
        return <button className="btn btn-sm btn-disabled">Sent</button>;
    }
     if (user.friendRequestsReceived.includes(authUser._id)) {
        return <button className="btn btn-sm btn-info" onClick={() => toast.error("Check your pending requests to accept.")}>Respond</button>;
    }
    return (
      <button className="btn btn-sm btn-primary" onClick={() => sendFriendRequest(user._id)}>
        <Send className="size-4" /> Add
      </button>
    );
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by username..."
          className="input input-bordered w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          <Search />
        </button>
      </form>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchedUsers.map(user => (
          <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
            <div className="flex items-center gap-3">
              <Avatar user={user} />
              <div>
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-base-content/70">@{user.username}</div>
              </div>
            </div>
            {getButtonState(user)}
          </div>
        ))}
      </div>
    </div>
  );
};

const PendingRequestsTab = () => {
  const { pendingRequests, getPendingRequests, acceptFriendRequest, rejectFriendRequest } = useChatStore();

  useEffect(() => {
    getPendingRequests();
  }, [getPendingRequests]);

  if (pendingRequests.length === 0) {
    return <div className="text-center p-4">No pending requests.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {pendingRequests.map(user => (
        <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div>
              <div className="font-medium">{user.fullName}</div>
              <div className="text-sm text-base-content/70">@{user.username}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-success" onClick={() => acceptFriendRequest(user._id)}>
              <Check />
            </button>
            <button className="btn btn-sm btn-error" onClick={() => rejectFriendRequest(user._id)}>
              <X />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const MyFriendsTab = ({onClose}) => {
    const { friends, getFriends, removeFriend, findOrCreateConversation } = useChatStore();

    useEffect(() => {
        getFriends();
    }, [getFriends]);

    const handleStartChat = (userId) => {
        findOrCreateConversation(userId, onClose);
    };

    const handleRemoveFriend = (userId) => {
        if (window.confirm("Are you sure you want to remove this friend?")) {
            removeFriend(userId);
        }
    };

    if (friends.length === 0) {
        return <div className="text-center p-4">Add some friends to start chatting!</div>;
    }

    return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
        {friends.map(user => (
            <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
            <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div>
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-base-content/70">@{user.username}</div>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="btn btn-sm btn-primary" title="Start Chat" onClick={() => handleStartChat(user._id)}>
                    <MessageSquare className="size-4" />
                </button>
                <button className="btn btn-sm btn-error" title="Remove Friend" onClick={() => handleRemoveFriend(user._id)}>
                    <Trash2 className="size-4" />
                </button>
            </div>
            </div>
        ))}
        </div>
    );
};


const FriendsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("friends");
  const { pendingRequests, getPendingRequests } = useChatStore();

  useEffect(() => {
      getPendingRequests();
  }, [getPendingRequests]);

  const TABS = [
    { id: "friends", label: "My Friends", icon: <Users className="size-5" /> },
    { id: "pending", label: "Requests", icon: <Bell className="size-5" />, badge: pendingRequests.length > 0 ? pendingRequests.length : null },
    { id: "find", label: "Find Users", icon: <UserPlus className="size-5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Friends</h2>
          <button type="button" className="btn btn-ghost btn-circle" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" className="tabs tabs-boxed mb-4">
          {TABS.map(tab => (
            <a
              key={tab.id}
              role="tab"
              className={`tab ${activeTab === tab.id ? "tab-active" : ""} flex-1 relative`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline ml-2">{tab.label}</span>
              {tab.badge && (
                <span className="badge badge-error badge-sm absolute top-1 right-1">{tab.badge}</span>
              )}
            </a>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "friends" && <MyFriendsTab onClose={onClose} />}
          {activeTab === "pending" && <PendingRequestsTab />}
          {activeTab === "find" && <FindUsersTab />}
        </div>
      </div>
    </div>
  );
};

export default FriendsModal;