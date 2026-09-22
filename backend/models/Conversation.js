const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({ sender: { type: String, enum: ["customer", "ai", "shop_owner", "system"], required: true }, message: { type: String, required: true, trim: true, maxlength: 5000 }, timestamp: { type: Date, default: Date.now } }, { _id: false });
const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  callId: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  messages: { type: [messageSchema], default: [] }, status: { type: String, enum: ["active", "completed"], default: "active" },
}, { timestamps: true });
module.exports = mongoose.model("Conversation", conversationSchema);
