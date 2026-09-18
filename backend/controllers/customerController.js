const Customer = require("../models/Customer");

// Create a new customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Check whether customer already exists
    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      address,
      email,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Recognize customer using phone number
const recognizeCustomer = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const customer = await Customer.findOne({ phone });

    // Customer does not exist
    if (!customer) {
      return res.status(200).json({
        success: true,
        isExistingCustomer: false,
        message: "New customer",
      });
    }

    // Customer exists
    res.status(200).json({
      success: true,
      isExistingCustomer: true,
      message: "Existing customer recognized",
      customer,
    });

  } catch (error) {
    console.error("Recognize customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Find customer using phone number
const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer found",
      customer,
    });
  } catch (error) {
    console.error("Find customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Register a new customer from the call
const registerNewCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      email,
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and address are required",
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      address,
      email,
      totalOrders: 0,
    });

    res.status(201).json({
      success: true,
      message: "New customer registered successfully",
      customer,
    });

  } catch (error) {
    console.error("Register customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  createCustomer,
  recognizeCustomer,
  getCustomerByPhone,
  getAllCustomers,
  registerNewCustomer,
};