const express = require("express");

const {
  createCustomer,
  getCustomerByPhone,
  getAllCustomers,
  recognizeCustomer,
  registerNewCustomer,
} = require("../controllers/customerController");

const router = express.Router();
const { validateCustomer, validatePhoneParam } = require("../middleware/validate");

router.post("/", validateCustomer(), createCustomer);

router.get("/phone/:phone", validatePhoneParam, getCustomerByPhone);

router.get("/recognize/:phone", validatePhoneParam, recognizeCustomer);

router.post("/register", validateCustomer({ addressRequired: true }), registerNewCustomer);

router.get("/", getAllCustomers);

module.exports = router;
