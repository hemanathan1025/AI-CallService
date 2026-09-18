const Customer = require("../models/Customer");
const Order = require("../models/Order");

// Complete incoming call flow
const handleIncomingCall = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Find customer by phone number
    let customer = await Customer.findOne({ phone });

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
          phone,
        });
      }

      // Create customer
      customer = await Customer.create({
        name,
        phone,
        address,
        email,
        totalOrders: 1,
        lastOrderDate: new Date(),
      });

      // Create first order
      const order = await Order.create({
        customer: customer._id,
        items,
        amount,
      });

      return res.status(201).json({
        success: true,
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
        success: true,
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
      amount,
    });

    // Update customer information
    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.lastOrderDate = new Date();

    await customer.save();

    return res.status(201).json({
      success: true,
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
  } catch (error) {
    console.error("Incoming call error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  handleIncomingCall,
};