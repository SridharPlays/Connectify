import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  selectedConversation: null,
  allUsers: [],
  isConversationsLoading: false,
  isMessagesLoading: false,

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
    if (!selectedConversation) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${selectedConversation._id}`);
      set({ messages: res.data || [] }); 
      } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation, messages } = get();
    if (!selectedConversation) return;

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
                text: newMessage.text || "Image",
                senderId: { fullName: newMessage.senderId.fullName },
                createdAt: newMessage.createdAt,
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

    socket.on("newMessage", (newMessage) => {
      const { selectedConversation } = get();
      if (selectedConversation && newMessage.conversationId === selectedConversation._id) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
      get().updateConversationLatestMessage(newMessage);
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
    set({ selectedConversation: conversation, messages: [] }); // Also reset messages on select
    get().getMessages();
  },
  
  findOrCreateConversation: async (userId, callback) => {
    try {
        const res = await axiosInstance.post(`/conversations/find/${userId}`);
        const newConvo = res.data;
        set(state => {
            const exists = state.conversations.some(c => c._id === newConvo._id);
            if (exists) {
                return {};
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