const crypto = require("crypto");
const Call = require("../models/Call");
const Conversation = require("../models/Conversation");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { processConversation } = require("../services/aiService");

const makeId = () => `CONV-${crypto.randomUUID()}`;

// Create a conversation
const createConversation = asyncHandler(async (req, res) => {
  const { callId, messages = [] } = req.body;

  if (!callId || !Array.isArray(messages)) {
    throw new AppError(
      "callId and an optional messages array are required",
      400
    );
  }

  const call = await Call.findOne({ callId });

  if (!call) {
    throw new AppError("Call not found", 404);
  }

  const conversation = await Conversation.create({
    conversationId: makeId(),
    callId,
    customerId: call.customerId,
    messages,
  });

  res.status(201).json({
    success: true,
    conversation,
  });
});

// Add a message to conversation
const addMessage = asyncHandler(async (req, res) => {
  const { sender, message } = req.body;

  if (
    !["customer", "ai", "shop_owner", "system"].includes(sender) ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new AppError(
      "A valid sender and non-empty message are required",
      400
    );
  }

  const conversation = await Conversation.findOne({
    conversationId: req.params.conversationId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.status === "completed") {
    throw new AppError("Cannot add messages to a completed conversation", 409);
  }

  conversation.messages.push({
    sender,
    message: message.trim(),
  });

  await conversation.save();

  res.status(201).json({
    success: true,
    message: "Message added",
    conversation,
  });
});

// Get conversation
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    conversationId: req.params.conversationId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  res.json({
    success: true,
    conversation,
  });
});

// Get conversation by call ID
const getCallConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    callId: req.params.callId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found for this call", 404);
  }

  res.json({
    success: true,
    conversation,
  });
});

// Send conversation to Python AI service
const processWithAI = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    conversationId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const conversationText = conversation.messages
    .map((msg) => `${msg.sender}: ${msg.message}`)
    .join("\n");

  const aiResult = await processConversation({
    conversation: conversationText,
  });

  res.json({
    success: true,
    conversationId,
    aiResult,
  });
});

module.exports = {
  createConversation,
  addMessage,
  getConversation,
  getCallConversation,
  processWithAI,
};
