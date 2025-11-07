import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    getConversations, 
    createGroupChat, 
    findOrCreateConversation,
    updateGroupDetails,
    addParticipant,
    removeParticipant,
    leaveGroup
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversations);
router.post("/find/:userId", protectRoute, findOrCreateConversation);
router.post("/create-group", protectRoute, createGroupChat);

router.put("/:conversationId/update", protectRoute, updateGroupDetails);

router.put("/:conversationId/add", protectRoute, addParticipant);

router.put("/:conversationId/remove/:participantId", protectRoute, removeParticipant);

router.post("/:conversationId/leave", protectRoute, leaveGroup);

export default router;