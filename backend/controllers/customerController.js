const Customer = require("../models/Customer");
const { normalizePhone } = require("../utils/phone");

// Create a new customer
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Check whether customer already exists
    const existingCustomer = await Customer.findOne({ phone: normalizedPhone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name,
      phone: normalizedPhone,
      address,
      email,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};


// Recognize customer using phone number
const recognizeCustomer = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const normalizedPhone = normalizePhone(phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const customer = await Customer.findOne({ phone: normalizedPhone });

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
    next(error);
  }
};


// Find customer using phone number
const getCustomerByPhone = async (req, res, next) => {
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

    res.status(200).json({
      success: true,
      message: "Customer found",
      customer,
    });
  } catch (error) {
    next(error);
  }
};


// Get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    next(error);
  }
};


// Register a new customer from the call
const registerNewCustomer = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      email,
    } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and address are required",
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone: normalizedPhone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name,
      phone: normalizedPhone,
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
    next(error);
  }
};


module.exports = {
  createCustomer,
  recognizeCustomer,
  getCustomerByPhone,
  getAllCustomers,
  registerNewCustomer,
};
