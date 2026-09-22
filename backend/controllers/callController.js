const crypto = require("crypto");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Call = require("../models/Call");
const Conversation = require("../models/Conversation");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { callStatuses } = require("../middleware/validate");
const makeCallId = () => `CALL-${crypto.randomUUID()}`;
const makeConversationId = () => `CONV-${crypto.randomUUID()}`;

// Complete incoming call flow
const handleIncomingCall = asyncHandler(async (req, res) => {
    const {
      phone,
      name,
      address,
      email,
      items,
      amount,
    } = req.body;

    // Phone number is required
    if (!phone) {
      throw new AppError("Phone number is required", 400);
    }

    // Find customer by phone number
    let customer = await Customer.findOne({ phone });
    const isExistingCustomer = Boolean(customer);
    const call = await Call.create({ callId: req.body.callId || makeCallId(), phone, customerId: customer?._id });
    const conversation = await Conversation.create({ conversationId: makeConversationId(), callId: call.callId, customerId: customer?._id });

    // ==========================================
    // NEW CUSTOMER
    // ==========================================
    if (!customer) {
      // Customer details/order not provided yet
      if (!name || !address || !items || amount === undefined) {
        return res.status(200).json({
          success: true,
          isExistingCustomer: false,
          message: "New customer",
          nextStep: "Collect customer details and order",
          phone, callId: call.callId, conversationId: conversation.conversationId,
        });
      }

      // Create customer
      let createdCustomer = true;
      try { customer = await Customer.create({ name, phone, address, email, totalOrders: 1, lastOrderDate: new Date() }); }
      catch (error) { if (error.code !== 11000) throw error; createdCustomer = false; customer = await Customer.findOne({ phone }); }
      call.customerId = customer._id;
      conversation.customerId = customer._id;
      await Promise.all([call.save(), conversation.save()]);

      // Create first order
      const order = await Order.create({
        customer: customer._id,
        items,
        amount, callId: call.callId,
      });
      if (!createdCustomer) await Customer.updateOne({ _id: customer._id }, { $inc: { totalOrders: 1 }, $set: { lastOrderDate: new Date() } });

      return res.status(201).json({
        success: true, callId: call.callId, conversationId: conversation.conversationId, customerId: customer._id,
        isExistingCustomer: false,
        message: "New customer and first order created successfully",

        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          email: customer.email,
          totalOrders: customer.totalOrders,
        },

        order,
      });
    }

    // ==========================================
    // EXISTING CUSTOMER
    // ==========================================

    // Get previous orders
    const previousOrders = await Order.find({
      customer: customer._id,
    }).sort({ createdAt: -1 });

    // If order information is not provided
    if (!items || amount === undefined) {
      return res.status(200).json({
          success: true, callId: call.callId, conversationId: conversation.conversationId, customerId: customer._id,
        isExistingCustomer: true,
        message: "Existing customer recognized",
        nextStep: "Collect new order",

        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          email: customer.email,
          totalOrders: customer.totalOrders,
          lastOrderDate: customer.lastOrderDate,
        },

        previousOrders,
      });
    }

    // Create new order
    const order = await Order.create({
      customer: customer._id,
      items,
      amount, callId: call.callId,
    });

    // Update customer information
    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.lastOrderDate = new Date();

    await customer.save();

    return res.status(201).json({
      success: true, callId: call.callId, conversationId: conversation.conversationId, customerId: customer._id,
      isExistingCustomer: true,
      message: "New order created for existing customer",

      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
        totalOrders: customer.totalOrders,
        lastOrderDate: customer.lastOrderDate,
      },

      order,

      previousOrderCount: previousOrders.length,
    });
});

const listCalls = asyncHandler(async (req, res) => { const calls = await Call.find().populate("customerId", "name phone").sort({ createdAt: -1 }); res.json({ success: true, count: calls.length, calls }); });
const getCall = asyncHandler(async (req, res) => { const call = await Call.findOne({ callId: req.params.callId }).populate("customerId", "name phone address email"); if (!call) throw new AppError("Call not found", 404); res.json({ success: true, call }); });
const updateCallStatus = asyncHandler(async (req, res) => { const { status } = req.body; if (!callStatuses.includes(status)) throw new AppError("Invalid call status", 400); const call = await Call.findOneAndUpdate({ callId: req.params.callId }, { status }, { new: true }); if (!call) throw new AppError("Call not found", 404); res.json({ success: true, message: "Call status updated", call }); });
const endCall = asyncHandler(async (req, res) => { const call = await Call.findOne({ callId: req.params.callId }); if (!call) throw new AppError("Call not found", 404); call.endTime = new Date(); call.duration = Math.max(0, Math.round((call.endTime - call.startTime) / 1000)); call.status = "completed"; await call.save(); await Conversation.updateOne({ callId: call.callId }, { status: "completed" }); res.json({ success: true, message: "Call ended", call }); });

module.exports = {
  handleIncomingCall,
  incoming: handleIncomingCall,
  listCalls,
  getCall,
  updateCallStatus,
  endCall,
};
