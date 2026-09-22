const mongoose = require("mongoose");
const callSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  phone: { type: String, required: true, trim: true, index: true },
  status: { type: String, enum: ["incoming", "active", "completed", "failed", "cancelled"], default: "incoming" },
  startTime: { type: Date, default: Date.now }, endTime: Date, duration: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model("Call", callSchema);
