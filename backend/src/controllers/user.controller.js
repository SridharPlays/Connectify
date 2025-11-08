import User from "../models/user.model.js";
import mongoose from "mongoose";

/**
 * Search for users by username
 */
export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    const authUserId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username query is required" });
    }

    // Find users whose username matches the query, are not the user themselves,
    // and are not already friends.
    const users = await User.find({
      username: { $regex: username, $options: "i" },
      _id: { $ne: authUserId },
    }).select("fullName username profilePic friends friendRequestsSent friendRequestsReceived");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const { userIdToRequest } = req.params;
    const authUserId = req.user._id;

    if (userIdToRequest === authUserId.toString()) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    const [authUser, userToRequest] = await Promise.all([
      User.findById(authUserId),
      User.findById(userIdToRequest),
    ]);

    if (!userToRequest) {
      return res.status(404).json({ message: "User not found" });
    }

    if (authUser.friends.includes(userIdToRequest)) {
      return res.status(400).json({ message: "You are already friends" });
    }
    
    if (authUser.friendRequestsSent.includes(userIdToRequest)) {
        return res.status(400).json({ message: "Friend request already sent" });
    }
    
    if (authUser.friendRequestsReceived.includes(userIdToRequest)) {
        return res.status(400).json({ message: "This user has already sent you a request. Check your pending requests." });
    }

    // Add to recipient's received list and sender's sent list
    userToRequest.friendRequestsReceived.push(authUserId);
    authUser.friendRequestsSent.push(userIdToRequest);

    await Promise.all([userToRequest.save(), authUser.save()]);

    // TODO: Emit a socket event here to notify the user in real-time

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error in sendFriendRequest: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userIdToAccept } = req.params;
    const authUserId = req.user._id;

    const [authUser, userToAccept] = await Promise.all([
      User.findById(authUserId),
      User.findById(userIdToAccept),
    ]);

    if (!userToAccept) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if a request was actually received
    if (!authUser.friendRequestsReceived.includes(userIdToAccept)) {
      return res.status(400).json({ message: "No friend request found from this user" });
    }

    // Perform the "accept" logic
    // 1. Remove from authUser's received list
    authUser.friendRequestsReceived = authUser.friendRequestsReceived.filter(
      (id) => id.toString() !== userIdToAccept
    );
    // 2. Add to authUser's friends list
    authUser.friends.push(userIdToAccept);

    // 3. Remove from userToAccept's sent list
    userToAccept.friendRequestsSent = userToAccept.friendRequestsSent.filter(
      (id) => id.toString() !== authUserId.toString()
    );
    // 4. Add to userToAccept's friends list
    userToAccept.friends.push(authUserId);

    await Promise.all([authUser.save(), userToAccept.save()]);
    
    // TODO: Emit socket event to both users

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userIdToReject } = req.params;
    const authUserId = req.user._id;
    
    const [authUser, userToReject] = await Promise.all([
        User.findById(authUserId),
        User.findById(userIdToReject),
    ]);
        
    if (!userToReject) {
        return res.status(404).json({ message: "User not found" });
    }

    // 1. Remove from authUser's received list
    authUser.friendRequestsReceived = authUser.friendRequestsReceived.filter(
      (id) => id.toString() !== userIdToReject
    );

    // 2. Remove from userToReject's sent list
    userToReject.friendRequestsSent = userToReject.friendRequestsSent.filter(
      (id) => id.toString() !== authUserId.toString()
    );

    await Promise.all([authUser.save(), userToReject.save()]);

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get all pending friend requests for the auth user
 */
export const getPendingRequests = async (req, res) => {
  try {
    const authUserId = req.user._id;
    
    const user = await User.findById(authUserId)
      .populate("friendRequestsReceived", "fullName username profilePic")
      .select("friendRequestsReceived");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friendRequestsReceived);
  } catch (error) {
    console.error("Error in getPendingRequests: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get all friends for the auth user
 */
export const getFriends = async (req, res) => {
  try {
    const authUserId = req.user._id;

    const user = await User.findById(authUserId)
      .populate("friends", "fullName username profilePic")
      .select("friends");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getFriends: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (req, res) => {
  try {
    const { userIdToRemove } = req.params;
    const authUserId = req.user._id;

    const [authUser, userToRemove] = await Promise.all([
      User.findById(authUserId),
      User.findById(userIdToRemove),
    ]);

    if (!userToRemove) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Remove from authUser's friends list
    authUser.friends = authUser.friends.filter(
      (id) => id.toString() !== userIdToRemove
    );
    // 2. Remove from userToRemove's friends list
    userToRemove.friends = userToRemove.friends.filter(
      (id) => id.toString() !== authUserId.toString()
    );

    await Promise.all([authUser.save(), userToRemove.save()]);

    // TODO: Optionally delete the 1-on-1 conversation

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error in removeFriend: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};