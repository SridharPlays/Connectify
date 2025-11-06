import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

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

    // If not, create a new 1-on-1 conversation
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