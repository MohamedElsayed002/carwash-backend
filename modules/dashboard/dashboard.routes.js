const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const auth = require('../../middleware/auth');

// ========================================
// DASHBOARD OVERVIEW ROUTES
// ========================================

// GET /api/dashboard/stats - Dashboard statistics
router.get('/stats', auth, dashboardController.getDashboardStats);

// GET /api/dashboard/overview - Dashboard overview statistics
router.get('/overview', auth, dashboardController.getDashboardOverview);

// GET /api/dashboard/live-stats - Real-time statistics
router.get('/live-stats', auth, dashboardController.getLiveStats);

// GET /api/dashboard/alerts - System alerts
router.get('/alerts', auth, dashboardController.getDashboardAlerts);

// GET /api/dashboard/quick-actions - Quick action buttons
router.get('/quick-actions', auth, dashboardController.getQuickActions);

// GET /api/dashboard/quick-stats - Quick statistics (today vs yesterday)
router.get('/quick-stats', auth, dashboardController.getQuickStats);

// ========================================
// RECENT ORDERS ROUTES
// ========================================

// GET /api/dashboard/recent-orders - Recent orders list
router.get('/recent-orders', auth, dashboardController.getRecentOrders);

// ========================================
// LIVE TRACKING ROUTES
// ========================================

// GET /api/dashboard/live-tracking - Live order tracking
router.get('/live-tracking', auth, dashboardController.getLiveTracking);

// ========================================
// BRANCH PERFORMANCE ROUTES
// ========================================

// GET /api/dashboard/branch-performance - Branch performance analytics
router.get('/branch-performance', auth, dashboardController.getBranchPerformance);

// ========================================
// REVENUE ANALYTICS ROUTES
// ========================================

// GET /api/dashboard/revenue - Revenue analytics
router.get('/revenue', auth, dashboardController.getRevenueAnalytics);

// ========================================
// CUSTOMER ANALYTICS ROUTES
// ========================================

// GET /api/dashboard/customer-analytics - Customer analytics
router.get('/customer-analytics', auth, dashboardController.getCustomerAnalytics);

// ========================================
// SYSTEM STATUS ROUTES
// ========================================

// GET /api/dashboard/system-status - System health status
router.get('/system-status', auth, dashboardController.getSystemStatus);

// ========================================
// NOTIFICATIONS SUMMARY ROUTES
// ========================================

// GET /api/dashboard/notifications-summary - Notifications summary
router.get('/notifications-summary', auth, dashboardController.getNotificationsSummary);

module.exports = router;
