const Order = require("../models/Order");
const Customer = require("../models/Customer");
const { normalizePhone } = require("../utils/phone");

// Create a new order for an existing customer
const createOrder = async (req, res, next) => {
  try {
    const { phone, items, amount } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!phone || !items || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Phone, items and amount are required",
      });
    }

    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found. Register customer first.",
        isExistingCustomer: false,
      });
    }

    const order = await Order.create({
      customer: customer._id,
      items,
      amount,
    });

    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.lastOrderDate = new Date();

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
      },
      order,
    });
  } catch (error) {
    next(error);
  }
};


// Get orders of a customer
const getCustomerOrders = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const normalizedPhone = normalizePhone(phone);

    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orders = await Order.find({
      customer: customer._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
      },
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};


// Get all orders
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("customer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};


// Get customer details with all previous orders
const getCustomerDetailsWithOrders = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const normalizedPhone = normalizePhone(phone);

    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        isExistingCustomer: false,
      });
    }

    const orders = await Order.find({
      customer: customer._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      isExistingCustomer: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
        totalOrders: customer.totalOrders,
      },
      orderCount: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};


// Create a new customer and their first order
const createNewCustomerOrder = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      email,
      items,
      amount,
    } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!name || !phone || !items || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, items and amount are required",
      });
    }

    const existingCustomer = await Customer.findOne({ phone: normalizedPhone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message:
          "Customer already exists. Use the existing customer order API.",
        isExistingCustomer: true,
      });
    }

    const customer = await Customer.create({
      name,
      phone: normalizedPhone,
      address,
      email,
      totalOrders: 1,
      lastOrderDate: new Date(),
    });

    const order = await Order.create({
      customer: customer._id,
      items,
      amount,
    });

    res.status(201).json({
      success: true,
      message: "New customer and first order created successfully",
      isExistingCustomer: false,
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
  } catch (error) {
    next(error);
  }
};


// Update order status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Use pending, confirmed, completed or cancelled",
      });
    }

    const order = await Order.findById(id).populate("customer");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.status !== status &&
      ["completed", "cancelled"].includes(order.status)
    ) {
      return res.status(409).json({
        success: false,
        message: "Cannot change the status of a closed order",
      });
    }

    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};


// Export all controllers
module.exports = {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  getCustomerDetailsWithOrders,
  createNewCustomerOrder,
  updateOrderStatus,
};
