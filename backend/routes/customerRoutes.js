const express = require("express");

const {
  createCustomer,
  getCustomerByPhone,
  getAllCustomers,
  recognizeCustomer,
  registerNewCustomer,
} = require("../controllers/customerController");

const router = express.Router();

router.post("/", createCustomer);

router.get("/phone/:phone", getCustomerByPhone);

router.get("/recognize/:phone", recognizeCustomer);

router.post("/register", registerNewCustomer);

router.get("/", getAllCustomers);

module.exports = router;