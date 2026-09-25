const router = require("express").Router();

const c = require("../controllers/callController");

const {
  getCallConversation,
} = require("../controllers/conversationController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const {
  validateCall,
  validateOrder,
} = require("../middleware/validate");


// Create / continue incoming call
router.post(
  "/",
  validateCall,
  validateOrder,
  c.incoming
);


// Incoming call
router.post(
  "/incoming",
  validateCall,
  validateOrder,
  c.incoming
);


// AI order extraction + confirmation
router.post(
  "/ai/extract-order",
  c.extractOrder
);


// Get all calls
router.get(
  "/",
  requireAuth,
  requireRole("shop_owner", "admin"),
  c.listCalls
);


// Get call conversation
router.get(
  "/:callId/conversation",
  requireAuth,
  requireRole("shop_owner", "admin"),
  getCallConversation
);


// Get single call
router.get(
  "/:callId",
  requireAuth,
  requireRole("shop_owner", "admin"),
  c.getCall
);


// Update call status
router.put(
  "/:callId/status",
  requireAuth,
  requireRole("shop_owner", "admin"),
  c.updateCallStatus
);


// End call
router.put(
  "/:callId/end",
  requireAuth,
  requireRole("shop_owner", "admin"),
  c.endCall
);


module.exports = router;