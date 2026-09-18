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

router.get("/", getAllOrders);

router.post("/", createOrder);

router.get("/customer/:phone", getCustomerOrders);

router.get(
  "/customer/:phone/details",
  getCustomerDetailsWithOrders
);

router.post("/new-customer", createNewCustomerOrder);

router.put("/:id/status", updateOrderStatus);

module.exports = router;