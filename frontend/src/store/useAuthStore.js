import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js"
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === 'development' ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    isCheckingAuth: true,
    socket: null,

    checkAuth: async () => {
        try {
            const response = await axiosInstance.get("/auth/check");

            set({ authUser: response.data })
            get().connectSocket();
        } catch (error) {
            console.log("Error in CheckAuth", error.message)
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
            return { success: true };
        } catch (error) {
            // Return error data to the component so it can handle specific flags like showReset
            toast.error(error.response.data.message);
            return { success: false, error: error.response.data };
        } finally {
            set({ isLoggingIn: false });
        }
    },


    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },
    
    sendPasswordReset: async (email) => {
        try {
            const res = await axiosInstance.post("/auth/forgot-password", { email });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send reset link");
        }
    },

    resetPassword: async (token, newPassword) => {
        set({ isLoggingIn: true }); // Reusing loading state for convenience
        try {
            const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password: newPassword });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password");
            return false;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();
    
        set({socket: socket})

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds })
        })
    },

    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect();
    }
}))