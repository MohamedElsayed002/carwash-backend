const express = require("express");
const router = express.Router();
const washController = require("./wash.controller");
const auth = require("../../middleware/auth");

router.post("/", auth, washController.createWash);
router.get("/", auth, washController.getWashes);
router.get("/by-owner", auth, washController.getWashesByOwner);
router.post("/scan-barcode", auth, washController.scanBarcodeAndDeductWash);

// ========================================
// MISSING ORDER MANAGEMENT ROUTES
// ========================================

// Get washes for specific user
router.get("/user/:userId", auth, washController.getWashesByUserId);

// Update wash status
router.put("/:id/status", auth, washController.updateWashStatus);

// Cancel wash
router.put("/:id/cancel", auth, washController.cancelWash);

router.get("/:id", auth, washController.getWash);
router.put("/:id", auth, washController.updateWash);
router.delete("/:id", auth, washController.deleteWash);

module.exports = router;
