const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const auth = require('../../middleware/auth');

// All routes require authentication
router.use(auth);

// Get sales report
router.get('/sales', reportsController.getSalesReport);

// Get customer report
router.get('/customers', reportsController.getCustomerReport);

// Get employee report
router.get('/employees', reportsController.getEmployeeReport);

// Get financial report
router.get('/financial', reportsController.getFinancialReport);

// Export report
router.get('/export/:type', reportsController.exportReport);

module.exports = router;
