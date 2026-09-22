const crypto = require("crypto");
const Call = require("../models/Call");
const Conversation = require("../models/Conversation");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const makeId = () => `CONV-${crypto.randomUUID()}`;
const createConversation = asyncHandler(async (req, res) => {
  const { callId, messages = [] } = req.body;
  if (!callId || !Array.isArray(messages)) throw new AppError("callId and an optional messages array are required", 400);
  const call = await Call.findOne({ callId });
  if (!call) throw new AppError("Call not found", 404);
  const conversation = await Conversation.create({ conversationId: makeId(), callId, customerId: call.customerId, messages });
  res.status(201).json({ success: true, conversation });
});
const addMessage = asyncHandler(async (req, res) => {
  const { sender, message } = req.body;
  if (!["customer", "ai", "shop_owner", "system"].includes(sender) || typeof message !== "string" || !message.trim()) throw new AppError("A valid sender and non-empty message are required", 400);
  const conversation = await Conversation.findOne({ conversationId: req.params.conversationId });
  if (!conversation) throw new AppError("Conversation not found", 404);
  conversation.messages.push({ sender, message: message.trim() }); await conversation.save();
  res.status(201).json({ success: true, message: "Message added", conversation });
});
const getConversation = asyncHandler(async (req, res) => { const conversation = await Conversation.findOne({ conversationId: req.params.conversationId }); if (!conversation) throw new AppError("Conversation not found", 404); res.json({ success: true, conversation }); });
const getCallConversation = asyncHandler(async (req, res) => { const conversation = await Conversation.findOne({ callId: req.params.callId }); if (!conversation) throw new AppError("Conversation not found for this call", 404); res.json({ success: true, conversation }); });
module.exports = { createConversation, addMessage, getConversation, getCallConversation };
