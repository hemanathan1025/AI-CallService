const router = require("express").Router();
const c = require("../controllers/callController");
const { getCallConversation } = require("../controllers/conversationController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateCall, validateOrder } = require("../middleware/validate");
router.post("/", validateCall, validateOrder, c.incoming);
router.post("/incoming", validateCall, validateOrder, c.incoming);
router.get("/", requireAuth, requireRole("shop_owner", "admin"), c.listCalls);
router.get("/:callId/conversation", requireAuth, requireRole("shop_owner", "admin"), getCallConversation);
router.get("/:callId", requireAuth, requireRole("shop_owner", "admin"), c.getCall);
router.put("/:callId/status", requireAuth, requireRole("shop_owner", "admin"), c.updateCallStatus);
router.put("/:callId/end", requireAuth, requireRole("shop_owner", "admin"), c.endCall);

module.exports = router;
