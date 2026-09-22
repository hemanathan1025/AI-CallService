const express = require("express");

const {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  getCustomerDetailsWithOrders,
  createNewCustomerOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();
const { requireOrderFields, validateOrder, validatePhoneParam, validateObjectId } = require("../middleware/validate");

router.get("/", getAllOrders);

router.post("/", requireOrderFields, createOrder);

router.get("/customer/:phone", validatePhoneParam, getCustomerOrders);

router.get(
  "/customer/:phone/details",
  validatePhoneParam, getCustomerDetailsWithOrders
);

router.post("/new-customer", validateOrder, createNewCustomerOrder);

router.put("/:id/status", validateObjectId("id"), validateOrder, updateOrderStatus);

module.exports = router;
