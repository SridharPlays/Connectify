import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getPendingRequests,
    getFriends,
    removeFriend
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/friend-request/send/:userIdToRequest", protectRoute, sendFriendRequest);
router.post("/friend-request/accept/:userIdToAccept", protectRoute, acceptFriendRequest);
router.post("/friend-request/reject/:userIdToReject", protectRoute, rejectFriendRequest);
router.get("/friend-requests/pending", protectRoute, getPendingRequests);
router.get("/friends", protectRoute, getFriends);
router.delete("/friend/remove/:userIdToRemove", protectRoute, removeFriend);

export default router;