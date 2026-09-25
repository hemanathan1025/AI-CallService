const crypto = require("crypto");

const Call = require("../models/Call");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Conversation = require("../models/Conversation");

const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const { extractOrderFromAI } = require("../services/aiService");
const { normalizePhone } = require("../utils/phone");

// =====================================================
// GENERATE CALL ID
// =====================================================

const generateCallId = () => {
  return `CALL-${crypto.randomUUID()}`;
};

// =====================================================
// GENERATE CONVERSATION ID
// =====================================================

const generateConversationId = () => {
  return `CONV-${crypto.randomUUID()}`;
};

// =====================================================
// CHECK CONFIRMATION
// =====================================================

const isConfirmationMessage = (message) => {
  const text = message.toLowerCase().trim();

  const patterns = [
    /\byes\b/,
    /\byep\b/,
    /\byup\b/,
    /\bok\b/,
    /\bokay\b/,
    /\bsure\b/,
    /\bconfirm\b/,
    /\bconfirmed\b/,
    /\bplace\s+(the\s+)?order\b/,
    /\bgo\s+ahead\b/,
    /\bdo\s+it\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
};

// =====================================================
// CHECK CANCELLATION
// =====================================================

const isCancellationMessage = (message) => {
  const text = message.toLowerCase().trim();

  const patterns = [
    /\bno\b/,
    /\bcancel\b/,
    /\bcancel\s+(the\s+)?order\b/,
    /\bdon't\s+place\b/,
    /\bdo\s+not\s+place\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
};

// =====================================================
// EXTRACT ORDER USING PYTHON AI
// =====================================================

const extractOrder = asyncHandler(async (req, res) => {
  const { callId, message } = req.body;

  if (!message || typeof message !== "string") {
    throw new AppError(
      "message is required and must be a string",
      400
    );
  }

  if (!callId || typeof callId !== "string") {
    throw new AppError(
      "callId is required",
      400
    );
  }

  // Find conversation
  const conversation = await Conversation.findOne({
    callId,
  });

  if (!conversation) {
    throw new AppError(
      "Conversation not found for this callId",
      404
    );
  }

  // Make sure conversation is active
  if (conversation.status !== "active") {
    throw new AppError(
      "Conversation is already completed",
      409
    );
  }

  // ===================================================
  // ADD CUSTOMER MESSAGE
  // ===================================================

  conversation.messages.push({
    sender: "customer",
    message,
  });

  // ===================================================
  // CUSTOMER CONFIRMATION
  // ===================================================

  if (isConfirmationMessage(message)) {
    // No pending order
    if (!conversation.pendingOrder) {
      conversation.messages.push({
        sender: "ai",
        message: "There is no pending order to confirm.",
      });

      await conversation.save();

      return res.status(400).json({
        success: false,
        type: "confirmation",
        confirmed: false,
        message: "There is no pending order to confirm.",
      });
    }

    // Make sure customer exists
    if (!conversation.customerId) {
      throw new AppError(
        "Customer is not linked to this conversation",
        400
      );
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({
      callId,
    });

    if (existingOrder) {
      conversation.pendingOrder = null;

      conversation.messages.push({
        sender: "ai",
        message: "This order has already been confirmed.",
      });

      await conversation.save();

      return res.status(200).json({
        success: true,
        type: "confirmation",
        confirmed: true,
        order: existingOrder,
        message: "This order has already been confirmed.",
      });
    }

    // =================================================
    // CREATE ORDER
    // =================================================

    const newOrder = await Order.create({
      customer: conversation.customerId,

      callId,

      items: conversation.pendingOrder.items,

      amount: conversation.pendingOrder.amount,

      status: "confirmed",
    });

    // =================================================
    // UPDATE CUSTOMER
    // =================================================

    await Customer.findByIdAndUpdate(
      conversation.customerId,
      {
        $inc: {
          totalOrders: 1,
        },

        lastOrderDate: new Date(),
      }
    );

    // =================================================
    // CLEAR PENDING ORDER
    // =================================================

    conversation.pendingOrder = null;

    // =================================================
    // AI MESSAGE
    // =================================================

    conversation.messages.push({
      sender: "ai",
      message:
        "Your order has been confirmed successfully.",
    });

    await conversation.save();

    return res.status(200).json({
      success: true,
      type: "confirmation",

      confirmed: true,

      cancelled: false,

      order: {
        id: newOrder._id,
        callId: newOrder.callId,
        items: newOrder.items,
        amount: newOrder.amount,
        status: newOrder.status,
      },

      message:
        "Your order has been confirmed successfully.",
    });
  }

  // ===================================================
  // CUSTOMER CANCELLATION
  // ===================================================

  if (isCancellationMessage(message)) {
    if (!conversation.pendingOrder) {
      conversation.messages.push({
        sender: "ai",
        message: "There is no pending order to cancel.",
      });

      await conversation.save();

      return res.status(200).json({
        success: true,
        type: "confirmation",
        confirmed: false,
        cancelled: true,
        message: "There is no pending order to cancel.",
      });
    }

    // Remove pending order
    conversation.pendingOrder = null;

    conversation.messages.push({
      sender: "ai",
      message: "Your order has been cancelled.",
    });

    await conversation.save();

    return res.status(200).json({
      success: true,

      type: "confirmation",

      confirmed: false,

      cancelled: true,

      message: "Your order has been cancelled.",
    });
  }

  // ===================================================
  // SEND MESSAGE TO PYTHON AI
  // ===================================================

  console.log("Sending message to Python AI service:");
  console.log(message);

  const result = await extractOrderFromAI(message);

  // ===================================================
  // IF AI FOUND ORDER
  // ===================================================

  if (
    result &&
    result.order &&
    result.order.items &&
    Number.isFinite(Number(result.order.amount))
  ) {
    const amount = Number(result.order.amount);

    // Convert AI item list to your Order.items string
    let itemsText = "";

    if (Array.isArray(result.order.items)) {
      itemsText = result.order.items
        .map((item) => {
          const quantity = item.quantity || 1;
          const name = item.name || "Unknown item";

          return `${quantity} ${name}`;
        })
        .join(", ");
    } else {
      itemsText = String(result.order.items);
    }

    // =================================================
    // SAVE / UPDATE PENDING ORDER
    // =================================================

    if (conversation.pendingOrder) {
      // Existing pending order
      const existingItems = conversation.pendingOrder.items
        ? conversation.pendingOrder.items
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      // New items from AI
      const newItems = itemsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      // Combine existing + new items
      const combinedItems = [
        ...existingItems,
        ...newItems,
      ];

      // Combine existing + new amount
      const existingAmount = Number(
        conversation.pendingOrder.amount || 0
      );

      const combinedAmount =
        existingAmount + amount;

      conversation.pendingOrder = {
        items: combinedItems.join(", "),
        amount: combinedAmount,
      };
    } else {
      // First order request
      conversation.pendingOrder = {
        items: itemsText,
        amount,
      };
    }

    // =================================================
    // AI CONFIRMATION MESSAGE
    // =================================================

    const finalItems =
      conversation.pendingOrder.items;

    const finalAmount =
      conversation.pendingOrder.amount;

    const aiMessage =
      `You ordered ${finalItems}. ` +
      `Your total price is ₹${finalAmount}. ` +
      `Would you like to confirm the order?`;

    conversation.messages.push({
      sender: "ai",
      message: aiMessage,
    });

    await conversation.save();

    return res.status(200).json({
      success: true,

      type: "order_confirmation",

      confirmed: false,

      cancelled: false,

      callId,

      pendingOrder: {
        items: conversation.pendingOrder.items,
        amount: conversation.pendingOrder.amount,
      },

      message: aiMessage,
    });
  }

  // ===================================================
  // NORMAL AI RESPONSE
  // ===================================================

  const aiMessage =
    result?.message ||
    "I could not understand the order.";

  conversation.messages.push({
    sender: "ai",
    message: aiMessage,
  });

  await conversation.save();

  return res.status(200).json({
    success: true,

    type: result?.type || "unknown",

    confirmed: false,

    cancelled: false,

    callId,

    aiResult: result,

    message: aiMessage,
  });
});

// =====================================================
// INCOMING CALL
// =====================================================

const incoming = asyncHandler(async (req, res) => {
  const {
    phone,
    callId,
    conversationId,
    name,
    address,
    email,
  } = req.body;

  if (!phone) {
    throw new AppError(
      "Phone number is required",
      400
    );
  }

  const normalizedPhone =
    normalizePhone(phone);

  // ===================================================
  // CONTINUE EXISTING CALL
  // ===================================================

  if (callId) {
    const call = await Call.findOne({
      callId,
    });

    if (!call) {
      throw new AppError(
        "Call not found",
        404
      );
    }

    if (
      normalizePhone(call.phone) !==
      normalizedPhone
    ) {
      throw new AppError(
        "Call ID and phone number do not match",
        409
      );
    }

    if (
      call.status === "completed" ||
      call.status === "cancelled"
    ) {
      throw new AppError(
        "This call is already closed",
        409
      );
    }

    call.status = "active";

    await call.save();

    const conversation =
      await Conversation.findOne({
        callId,
      });

    return res.status(200).json({
      success: true,

      isExistingCustomer:
        Boolean(call.customerId),

      callId: call.callId,

      conversationId:
        conversation?.conversationId ||
        conversationId,

      message:
        "Existing call continued",

      nextStep:
        call.customerId
          ? "Continue order"
          : "Collect customer details",
    });
  }

  // ===================================================
  // FIND CUSTOMER
  // ===================================================

  let customer =
    await Customer.findOne({
      phone: normalizedPhone,
    });

  // ===================================================
  // CREATE NEW CUSTOMER IF DETAILS PROVIDED
  // ===================================================

  if (!customer && name) {
    customer =
      await Customer.create({
        name,
        phone: normalizedPhone,
        address,
        email,
      });
  }

  // ===================================================
  // CREATE CALL
  // ===================================================

  const newCallId =
    generateCallId();

  const newConversationId =
    generateConversationId();

  const call =
    await Call.create({
      callId: newCallId,

      customerId:
        customer?._id,

      phone: normalizedPhone,

      status: "active",
    });

  // ===================================================
  // CREATE CONVERSATION
  // ===================================================

  await Conversation.create({
    conversationId:
      newConversationId,

    callId:
      newCallId,

    customerId:
      customer?._id,

    messages: [],

    pendingOrder: null,

    status: "active",
  });

  // ===================================================
  // RESPONSE
  // ===================================================

  if (customer) {
    return res.status(200).json({
      success: true,

      isExistingCustomer: true,

      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
      },

      callId: newCallId,

      conversationId:
        newConversationId,

      message:
        "Existing customer recognized",

      nextStep:
        "Collect new order",
    });
  }

  return res.status(200).json({
    success: true,

    isExistingCustomer: false,

    callId: newCallId,

    conversationId:
      newConversationId,

    message:
      "New customer",

    nextStep:
      "Collect customer details",
  });
});

// =====================================================
// GET ALL CALLS
// =====================================================

const listCalls = asyncHandler(async (req, res) => {
  const calls =
    await Call.find()
      .populate("customerId")
      .sort({
        createdAt: -1,
      });

  res.status(200).json({
    success: true,
    count: calls.length,
    calls,
  });
});

// =====================================================
// GET SINGLE CALL
// =====================================================

const getCall = asyncHandler(async (req, res) => {
  const call =
    await Call.findOne({
      callId: req.params.callId,
    }).populate("customerId");

  if (!call) {
    throw new AppError(
      "Call not found",
      404
    );
  }

  res.status(200).json({
    success: true,
    call,
  });
});

// =====================================================
// UPDATE CALL STATUS
// =====================================================

const updateCallStatus =
  asyncHandler(async (req, res) => {
    const {
      status,
    } = req.body;

    const allowedStatuses = [
      "incoming",
      "active",
      "completed",
      "failed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        "Invalid call status",
        400
      );
    }

    const call =
      await Call.findOne({
        callId: req.params.callId,
      });

    if (!call) {
      throw new AppError(
        "Call not found",
        404
      );
    }

    call.status = status;

    if (
      status === "completed" ||
      status === "failed" ||
      status === "cancelled"
    ) {
      call.endTime = new Date();

      const duration =
        Math.floor(
          (call.endTime -
            call.startTime) /
            1000
        );

      call.duration = duration;
    }

    await call.save();

    res.status(200).json({
      success: true,
      message: "Call status updated",
      call,
    });
  });

// =====================================================
// END CALL
// =====================================================

const endCall =
  asyncHandler(async (req, res) => {
    const call =
      await Call.findOne({
        callId: req.params.callId,
      });

    if (!call) {
      throw new AppError(
        "Call not found",
        404
      );
    }

    if (
      call.status === "completed" ||
      call.status === "cancelled"
    ) {
      throw new AppError(
        "Call is already closed",
        409
      );
    }

    call.status = "completed";

    call.endTime =
      new Date();

    call.duration =
      Math.floor(
        (call.endTime -
          call.startTime) /
          1000
      );

    await call.save();

    const conversation =
      await Conversation.findOne({
        callId:
          call.callId,
      });

    if (conversation) {
      conversation.status =
        "completed";

      await conversation.save();
    }

    res.status(200).json({
      success: true,

      message:
        "Call ended successfully",

      call,
    });
  });

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  incoming,
  extractOrder,
  listCalls,
  getCall,
  updateCallStatus,
  endCall,
};