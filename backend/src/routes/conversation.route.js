import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getConversations, createGroupChat, findOrCreateConversation } from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversations);

router.post("/find/:userId", protectRoute, findOrCreateConversation);

router.post("/create-group", protectRoute, createGroupChat);

export default router;