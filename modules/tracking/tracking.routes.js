const express = require('express');
const router = express.Router();
const trackingController = require('./tracking.controller');
const auth = require('../../middleware/auth');

// ========================================
// LIVE ORDER TRACKING ROUTES
// ========================================

// GET /api/tracking/live-orders - Get live orders
router.get('/live-orders', auth, trackingController.getLiveOrders);

// GET /api/tracking/map-data - Get map data for branches and orders
router.get('/map-data', auth, trackingController.getMapData);

// GET /api/tracking/:orderId/history - Get tracking history for specific order
router.get('/:orderId/history', auth, trackingController.getTrackingHistory);

// POST /api/tracking/:orderId/update - Update tracking status
router.post('/:orderId/update', auth, trackingController.updateTracking);

// GET /api/tracking/analytics - Get tracking analytics
router.get('/analytics', auth, trackingController.getTrackingAnalytics);

// ========================================
// REAL-TIME TRACKING ROUTES
// ========================================

// GET /api/tracking/real-time/orders - Get real-time orders
router.get('/real-time/orders', auth, trackingController.getRealTimeOrders);

// ========================================
// BRANCH TRACKING ROUTES
// ========================================

// GET /api/tracking/branch/:branchId - Get branch-specific tracking
router.get('/branch/:branchId', auth, trackingController.getBranchTracking);

module.exports = router;
