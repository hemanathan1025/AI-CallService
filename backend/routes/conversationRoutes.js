const router = require("express").Router();
const { createConversation, addMessage, getConversation } = require("../controllers/conversationController");
const { requireAuth, requireRole } = require("../middleware/auth");
router.post("/", requireAuth, requireRole("shop_owner", "admin"), createConversation);
router.post("/:conversationId/messages", requireAuth, requireRole("shop_owner", "admin"), addMessage);
router.get("/:conversationId", requireAuth, requireRole("shop_owner", "admin"), getConversation);
module.exports = router;
