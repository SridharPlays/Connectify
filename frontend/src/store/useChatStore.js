import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [], // Changed from 'users'
  selectedConversation: null, // Changed from 'selectedUser'
  allUsers: [], // New state to hold users for "create group" modal
  isConversationsLoading: false, // Changed from 'isUsersLoading'
  isMessagesLoading: false,

  // Gets all users (for creating new chats/groups)
  getAllUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ allUsers: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  // Gets conversations for the sidebar
  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch conversations");
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  // Gets messages for the selected conversation
  getMessages: async () => {
    const { selectedConversation } = get();
    if (!selectedConversation) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${selectedConversation._id}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Sends a message to the selected conversation
  sendMessage: async (messageData) => {
    const { selectedConversation, messages } = get();
    if (!selectedConversation) return;

    try {
      // The API call returns the populated message
      const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, messageData);
      set({ messages: [...messages, res.data] });
      
      // Update the conversation's latestMessage in the sidebar
      get().updateConversationLatestMessage(res.data);

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Helper to update sidebar on new message
  updateConversationLatestMessage: (newMessage) => {
    set((state) => ({
      conversations: state.conversations
        .map((convo) => {
          if (convo._id === newMessage.conversationId) {
            return {
              ...convo,
              latestMessage: {
                text: newMessage.text || "Image",
                senderId: { fullName: newMessage.senderId.fullName },
                createdAt: newMessage.createdAt,
              },
            };
          }
          return convo;
        })
        .sort((a, b) => new Date(b.latestMessage?.createdAt || 0) - new Date(a.latestMessage?.createdAt || 0)), // Sort by new message
    }));
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedConversation } = get();

      // If this message is for the currently open chat, add it to messages
      if (selectedConversation && newMessage.conversationId === selectedConversation._id) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
      
      // Update the latest message in the sidebar regardless
      get().updateConversationLatestMessage(newMessage);
      
      // Optional: Show a toast notification if the chat is not open
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
    set({ selectedConversation: conversation });
    get().getMessages(); // Fetch messages when a conversation is selected
  },
  
  // This is a new function to handle starting a 1-on-1 chat from the user list
  findOrCreateConversation: async (userId, callback) => {
    try {
        const res = await axiosInstance.post(`/conversations/find/${userId}`);
        const newConvo = res.data;

        // Add to conversations list if not already there
        set(state => {
            const exists = state.conversations.some(c => c._id === newConvo._id);
            if (exists) {
                return {}; // No change needed, just select it
            }
            return { conversations: [newConvo, ...state.conversations] };
        });

        // Select the new conversation
        get().setSelectedConversation(newConvo);
        if (callback) callback(); // e.g., close modal
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to start chat");
    }
  },

  // This is new for creating a group
  createGroup: async (groupData, callback) => {
    try {
        const res = await axiosInstance.post("/conversations/create-group", groupData);
        const newGroup = res.data;

        // Add new group to the top of the list and select it
        set(state => ({
            conversations: [newGroup, ...state.conversations]
        }));
        get().setSelectedConversation(newGroup);
        if (callback) callback(); // e.g., close modal
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

  listenForDeletedMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.warn("Socket not found, can't listen for deleted messages.");
      return;
    }

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
}));