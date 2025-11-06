import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req,res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: { $ne: loggedInUserId}}).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {       
        console.error("Error in GetUser Function", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    } 
};

export const getMessages = async (req,res) => {
    try {
        const { conversationId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId,
        });

        if (!conversation) {
            return res.status(403).json({ message: "Not authorized to view these messages." });
        }

        const messages = await Message.find({
            conversationId: conversationId,
        }).populate("senderId", "fullName profilePic");

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in GetMessage Controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export const sendMessage = async (req,res) => {
    try {
        const { text, image } = req.body;
        const { conversationId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // Find the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const newMessage = new Message( {
            senderId,
            conversationId,
            text,
            image: imageUrl,
        });

        await Promise.all([
            newMessage.save(),
            Conversation.findByIdAndUpdate(conversationId, {
                latestMessage: newMessage._id,
            })
        ]);
        
        // Populate sender info for the socket event
        const messageWithSender = await newMessage.populate("senderId", "fullName profilePic");

        // Socket IO: Emit message to all participants in the room
        conversation.participants.forEach(participantId => {
            const socketId = getReceiverSocketId(participantId.toString());
            if (socketId) {
                io.to(socketId).emit("newMessage", messageWithSender);
            }
        });

        res.status(201).json(messageWithSender);
    } catch (error) {
        console.log("Error in SendMessage Controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const senderId = req.user._id;

    // Find the message
    const message = await Message.findOne({
      _id: messageId,
      senderId: senderId,
    });

    if (!message) {
      return res.status(404).json({ message: "Deletion Failed!" });
    }

    // Find the conversation this message belongs to
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
    }

    message.text = null;
    message.image = null;
    message.isDeleted = true;

    await message.save();
    
    conversation.participants.forEach(participantId => {
        const socketId = getReceiverSocketId(participantId.toString());
        if (socketId) {
            io.to(socketId).emit("messageDeleted", message);
        }
    });

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    console.log("Error in DeleteMessage Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};