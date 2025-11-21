import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js"
import { getMessages, sendMessage, deleteMessage, getUsersForSidebar, markMessagesAsRead } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar)

router.get("/:conversationId", protectRoute, getMessages)

router.post("/send/:conversationId", protectRoute, sendMessage)

router.delete("/delete/:id",protectRoute, deleteMessage);

router.put("/mark-as-read/:conversationId", protectRoute, markMessagesAsRead);

export default router;