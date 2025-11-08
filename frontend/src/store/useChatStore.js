import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // Standard Chat State
  messages: [],
  conversations: [],
  selectedConversation: null,
  isConversationsLoading: false,
  isMessagesLoading: false,
  
  // Friend State
  friends: [],
  pendingRequests: [],
  searchedUsers: [],
  allUsers: [], // Keeping this for group/friend search logic

  // Helper function
  updateConversationInList: (updatedConvo) => {
    // The backend returns all participants, we need to filter out the auth user
    // for consistent frontend display
    const authUserId = useAuthStore.getState().authUser._id;
    const filteredConvo = {
      ...updatedConvo,
      participants: updatedConvo.participants.filter(
        (p) => p._id.toString() !== authUserId.toString()
      ),
    };

    set(state => ({
        conversations: state.conversations.map(c => 
            c._id === filteredConvo._id ? filteredConvo : c
        ),
        // Also update the selectedConversation if it's the one being edited
        selectedConversation: state.selectedConversation?._id === filteredConvo._id 
            ? filteredConvo 
            : state.selectedConversation
    }));
  },

  getAllUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ allUsers: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
      set({ allUsers: [] });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch conversations");
      set({ conversations: [] });
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getMessages: async () => {
    const { selectedConversation } = get();
    if (!selectedConversation) return; // Prevent fetching if no convo is selected

    set({ isMessagesLoading: true });
    try {
      // This API call now marks messages as read on the backend
      const res = await axiosInstance.get(`/messages/${selectedConversation._id}`);
      set({ messages: res.data || [] });
      
      // Mark the conversation as read in the sidebar (optimistic update)
      set(state => ({
        conversations: state.conversations.map(convo => {
          if (convo._id === selectedConversation._id && convo.latestMessage) {
            // Check if authUser is already in readBy
            const authUserId = useAuthStore.getState().authUser._id;
            const alreadyRead = convo.latestMessage.readBy.some(id => id === authUserId || id._id === authUserId);
            if (!alreadyRead) {
                return {
                ...convo,
                latestMessage: {
                    ...convo.latestMessage,
                    readBy: [...convo.latestMessage.readBy, authUserId] 
                }
                };
            }
          }
          return convo;
        })
      }));

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation, messages } = get();
    if (!selectedConversation) return; // Don't send if no convo selected

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, messageData);
      set({ messages: [...messages, res.data] });
      get().updateConversationLatestMessage(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  updateConversationLatestMessage: (newMessage) => {
    set((state) => ({
      conversations: state.conversations
        .map((convo) => {
          if (convo._id === newMessage.conversationId) {
            return {
              ...convo,
              latestMessage: {
                ...newMessage, // Use the full message as latestMessage
                senderId: { fullName: newMessage.senderId.fullName }, // Keep sender simple
              },
            };
          }
          return convo;
        })
        .sort((a, b) => new Date(b.latestMessage?.createdAt || 0) - new Date(a.latestMessage?.createdAt || 0)),
    }));
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage"); // Prevent duplicate listeners
    socket.on("newMessage", (newMessage) => {
      const { selectedConversation } = get();
      
      // Add message to list if chat is open
      if (selectedConversation && newMessage.conversationId === selectedConversation._id) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
      
      // Update latest message in sidebar
      get().updateConversationLatestMessage(newMessage);

      // Show toast if chat is not open
      if (!selectedConversation || newMessage.conversationId !== selectedConversation._id) {
         toast.success(`New message from ${newMessage.senderId.fullName}`);
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation, messages: [] }); // Clear old messages
    if (conversation) {
        get().getMessages(); // This now triggers the "mark as read"
    }
  },
  
  listenForMessagesRead: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not found, can't listen for read messages.");
      return;
    }
    
    socket.off("messagesRead"); // Prevent duplicate listeners
    
    socket.on("messagesRead", ({ conversationId, readByUserId, readByUser }) => {
      set(state => {
        // Update the conversation list
        const newConversations = state.conversations.map(convo => {
          if (convo._id === conversationId && convo.latestMessage) {
            const alreadyRead = convo.latestMessage.readBy.some(id => id === readByUserId || id._id === readByUserId);
            return {
              ...convo,
              latestMessage: {
                ...convo.latestMessage,
                readBy: alreadyRead ? convo.latestMessage.readBy : [...convo.latestMessage.readBy, readByUserId]
              }
            };
          }
          return convo;
        });

        // Update messages in the currently open chat
        if (state.selectedConversation?._id !== conversationId) {
          return { conversations: newConversations }; // Only update sidebar
        }

        const updatedMessages = state.messages.map(message => {
            const alreadyRead = message.readBy.some(user => user._id === readByUserId);
            if (!alreadyRead) {
                return {
                    ...message,
                    readBy: [...message.readBy, readByUser]
                };
            }
            return message;
        });
        
        return { 
          messages: updatedMessages,
          conversations: newConversations
        };
      });
    });
  },

  listenForDeletedMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("messageDeleted");
    socket.on("messageDeleted", (deletedMessage) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === deletedMessage._id
            ? deletedMessage 
            : message
        ),
      }));
    });
  },
  
  // Friend & Group Actions
  
  findOrCreateConversation: async (userId, callback) => {
    try {
        const res = await axiosInstance.post(`/conversations/find/${userId}`);
        const newConvo = res.data;
        set(state => {
            const exists = state.conversations.some(c => c._id === newConvo._id);
            if (exists) {
                return { conversations: state.conversations.map(c => c._id === newConvo._id ? newConvo : c) };
            }
            return { conversations: [newConvo, ...state.conversations] };
        });
        get().setSelectedConversation(newConvo);
        if (callback) callback();
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to start chat");
    }
  },

  createGroup: async (groupData, callback) => {
    try {
        const res = await axiosInstance.post("/conversations/create-group", groupData);
        const newGroup = res.data;
        set(state => ({
            conversations: [newGroup, ...state.conversations]
        }));
        get().setSelectedConversation(newGroup);
        if (callback) callback();
    } catch (error) {
         toast.error(error.response?.data?.message || "Failed to create group");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  searchUsers: async (username) => {
    if (!username.trim()) {
      return set({ searchedUsers: [] });
    }
    try {
      const res = await axiosInstance.get(`/users/search?username=${username}`);
      set({ searchedUsers: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to search users");
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/users/friend-request/send/${userId}`);
      toast.success(res.data.message);
      set(state => ({
        searchedUsers: state.searchedUsers.map(user => 
          user._id === userId 
          ? { ...user, friendRequestsSent: [...(user.friendRequestsSent || []), useAuthStore.getState().authUser._id] } 
          : user
        )
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  },

  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/users/friend-requests/pending");
      set({ pendingRequests: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get requests");
    }
  },

  acceptFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/users/friend-request/accept/${userId}`);
      toast.success(res.data.message);
      set(state => ({
        pendingRequests: state.pendingRequests.filter(req => req._id !== userId),
        friends: [...state.friends, state.pendingRequests.find(req => req._id === userId)],
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/users/friend-request/reject/${userId}`);
      toast.success(res.data.message);
      set(state => ({
        pendingRequests: state.pendingRequests.filter(req => req._id !== userId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  },

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/users/friends");
      set({ friends: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get friends");
    }
  },

  removeFriend: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/users/friend/remove/${userId}`);
      toast.success(res.data.message);
      set(state => ({
        friends: state.friends.filter(friend => friend._id !== userId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
    }
  },
  
  updateGroupDetails: async (conversationId, data) => {
    try {
      const res = await axiosInstance.put(`/conversations/${conversationId}/update`, data);
      get().updateConversationInList(res.data);
      toast.success("Group updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    }
  },

  addParticipant: async (conversationId, userIdToAdd) => {
    try {
      const res = await axiosInstance.put(`/conversations/${conversationId}/add`, { userIdToAdd });
      get().updateConversationInList(res.data);
      toast.success("User added!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add user");
    }
  },

  removeParticipant: async (conversationId, participantId) => {
    try {
      const res = await axiosInstance.put(`/conversations/${conversationId}/remove/${participantId}`);
      get().updateConversationInList(res.data);
      toast.success("User removed!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove user");
    }
  },

  leaveGroup: async (conversationId, callback) => {
    try {
      await axiosInstance.post(`/conversations/${conversationId}/leave`);
      
      set(state => ({
        conversations: state.conversations.filter(c => c._id !== conversationId),
        selectedConversation: state.selectedConversation?._id === conversationId 
          ? null 
          : state.selectedConversation
      }));
      toast.success("You left the group");
      if (callback) callback();

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  }
}));