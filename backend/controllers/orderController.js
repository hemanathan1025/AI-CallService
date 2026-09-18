const Order = require("../models/Order");
const Customer = require("../models/Customer");

// Create a new order for an existing customer
const createOrder = async (req, res) => {
  try {
    const { phone, items, amount } = req.body;

    if (!phone || !items || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Phone, items and amount are required",
      });
    }

    const customer = await Customer.findOne({ phone });

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
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Get orders of a customer
const getCustomerOrders = async (req, res) => {
  try {
    const { phone } = req.params;

    const customer = await Customer.findOne({ phone });

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
    console.error("Get customer orders error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Get all orders
const getAllOrders = async (req, res) => {
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
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Get customer details with all previous orders
const getCustomerDetailsWithOrders = async (req, res) => {
  try {
    const { phone } = req.params;

    const customer = await Customer.findOne({ phone });

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
    console.error("Get customer details error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Create a new customer and their first order
const createNewCustomerOrder = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      email,
      items,
      amount,
    } = req.body;

    if (!name || !phone || !items || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, items and amount are required",
      });
    }

    const existingCustomer = await Customer.findOne({ phone });

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
      phone,
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
    console.error("Create new customer order error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Update order status
const updateOrderStatus = async (req, res) => {
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

    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
