import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js"; // Import cloudinary for image uploads

// Helper function to check if user is admin
const checkAdmin = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  if (!conversation.isGroupChat) {
    throw new Error("This is not a group chat");
  }
  if (conversation.groupAdmin.toString() !== userId.toString()) {
    throw new Error("You are not the admin of this group");
  }
  return conversation;
};

// EXISTING FUNCTIONS (no change)

export const getConversations = async (req, res) => {
  try {
    const authUserId = req.user._id;

    const conversations = await Conversation.find({ participants: authUserId })
      .populate({
        path: "participants",
        select: "fullName profilePic email",
      })
      .populate({
        path: "latestMessage",
        select: "text senderId createdAt",
        populate: {
          path: "senderId",
          select: "fullName",
        },
      })
      .sort({ updatedAt: -1 });

    conversations.forEach((convo) => {
      convo.participants = convo.participants.filter(
        (p) => p._id.toString() !== authUserId.toString()
      );
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversations: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const findOrCreateConversation = async (req, res) => {
  try {
    const authUserId = req.user._id;
    const { userId: otherUserId } = req.params;

    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: [authUserId, otherUserId] },
    }).populate("participants", "fullName profilePic email");

    if (conversation) {
        conversation.participants = conversation.participants.filter(
            (p) => p._id.toString() !== authUserId.toString()
        );
        return res.status(200).json(conversation);
    }

    const newConversation = new Conversation({
      participants: [authUserId, otherUserId],
      isGroupChat: false,
    });

    await newConversation.save();
    
    let newConvo = await Conversation.findById(newConversation._id)
        .populate("participants", "fullName profilePic email");

    newConvo.participants = newConvo.participants.filter(
        (p) => p._id.toString() !== authUserId.toString()
    );

    res.status(201).json(newConvo);
  } catch (error) {
    console.error("Error in findOrCreateConversation: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const createGroupChat = async (req, res) => {
  try {
    const authUserId = req.user._id;
    const { groupName, participants } = req.body;

    if (!groupName || !participants || participants.length < 2) {
      return res.status(400).json({ message: "Group name and at least 2 participants are required." });
    }

    const allParticipants = [authUserId, ...participants];

    const newConversation = new Conversation({
      participants: allParticipants,
      isGroupChat: true,
      groupName: groupName,
      groupAdmin: authUserId,
    });

    await newConversation.save();

    const groupChat = await Conversation.findById(newConversation._id)
      .populate("participants", "fullName profilePic email")
      .populate("groupAdmin", "fullName");

    res.status(201).json(groupChat);
  } catch (error) {
    console.error("Error in createGroupChat: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// NEW FUNCTIONS

/**
 * Update Group Name or Icon
 */
export const updateGroupDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { groupName, groupIconBase64 } = req.body;
    const authUserId = req.user._id;

    const conversation = await checkAdmin(conversationId, authUserId);

    if (groupIconBase64) {
      // User is uploading a new picture
      const uploadResponse = await cloudinary.uploader.upload(groupIconBase64);
      conversation.groupIcon = uploadResponse.secure_url;
    }

    if (groupName) {
      conversation.groupName = groupName;
    }

    await conversation.save();

    // Return the fully populated conversation
    const updatedConvo = await Conversation.findById(conversationId)
      .populate("participants", "fullName profilePic email")
      .populate("groupAdmin", "fullName");
      
    res.status(200).json(updatedConvo);
  } catch (error) {
    console.error("Error in updateGroupDetails: ", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/**
 * Add a participant to the group
 */
export const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userIdToAdd } = req.body;
    const authUserId = req.user._id;

    const conversation = await checkAdmin(conversationId, authUserId);

    if (conversation.participants.includes(userIdToAdd)) {
      return res.status(400).json({ message: "User is already in the group" });
    }

    conversation.participants.push(userIdToAdd);
    await conversation.save();
    
    const updatedConvo = await Conversation.findById(conversationId)
      .populate("participants", "fullName profilePic email")
      .populate("groupAdmin", "fullName");

    res.status(200).json(updatedConvo);
  } catch (error) {
    console.error("Error in addParticipant: ", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/**
 * Remove a participant from the group
 */
export const removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const authUserId = req.user._id;

    const conversation = await checkAdmin(conversationId, authUserId);
    
    if (participantId === authUserId.toString()) {
         return res.status(400).json({ message: "Admin cannot be removed" });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== participantId
    );

    await conversation.save();

    const updatedConvo = await Conversation.findById(conversationId)
      .populate("participants", "fullName profilePic email")
      .populate("groupAdmin", "fullName");

    res.status(200).json(updatedConvo);
  } catch (error) {
    console.error("Error in removeParticipant: ", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/**
 * Leave a group (for any member)
 */
export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const authUserId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.isGroupChat) {
       return res.status(400).json({ message: "Cannot leave a 1-on-1 chat" });
    }
    
    // Check if user is actually a participant
    const isParticipant = conversation.participants.some(id => id.toString() === authUserId.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Handle admin leaving
    if (conversation.groupAdmin.toString() === authUserId.toString()) {
      // Find a new admin (the first participant who is not the current admin)
      const newAdmin = conversation.participants.find(id => id.toString() !== authUserId.toString());
      
      if (newAdmin) {
        conversation.groupAdmin = newAdmin;
      } else {
        // This is the last person leaving
        conversation.groupAdmin = null;
      }
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== authUserId.toString()
    );

    // If last participant leaves, you could optionally delete the group
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      return res.status(200).json({ message: "Successfully left and deleted empty group" });
    }

    await conversation.save();
    res.status(200).json({ message: "Successfully left the group" });

  } catch (error) {
     console.error("Error in leaveGroup: ", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}