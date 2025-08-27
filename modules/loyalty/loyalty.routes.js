const express = require('express');
const router = express.Router();
const loyaltyController = require('./loyalty.controller');
const auth = require('../../middleware/auth');

// ========================================
// LOYALTY POINTS ROUTES
// ========================================

// GET /api/loyalty/points - Get points system or user points
router.get('/points', auth, loyaltyController.getPointsSystem);

// POST /api/loyalty/points/earn - Earn points
router.post('/points/earn', auth, loyaltyController.earnPoints);

// POST /api/loyalty/points/redeem - Redeem points
router.post('/points/redeem', auth, loyaltyController.redeemPoints);

// ========================================
// REWARDS ROUTES
// ========================================

// GET /api/loyalty/rewards - Get available rewards
router.get('/rewards', auth, loyaltyController.getRewards);

// POST /api/loyalty/rewards/redeem - Redeem reward
router.post('/rewards/redeem', auth, loyaltyController.redeemReward);

// ========================================
// LOYALTY LEVELS ROUTES
// ========================================

// GET /api/loyalty/levels - Get loyalty levels
router.get('/levels', auth, loyaltyController.getLoyaltyLevels);

// ========================================
// DISCOUNTS ROUTES
// ========================================

// GET /api/loyalty/discounts - Get available discounts
router.get('/discounts', auth, loyaltyController.getDiscounts);

// ========================================
// MEMBERSHIP ROUTES
// ========================================

// GET /api/loyalty/memberships - Get memberships
router.get('/memberships', auth, loyaltyController.getMemberships);

// POST /api/loyalty/memberships/subscribe - Subscribe to membership
router.post('/memberships/subscribe', auth, loyaltyController.subscribeMembership);

// ========================================
// REPORTS ROUTES
// ========================================

// GET /api/loyalty/reports - Get loyalty reports
router.get('/reports', auth, loyaltyController.getLoyaltyReports);

// ========================================
// STATISTICS ROUTES
// ========================================

// GET /api/loyalty/statistics - Get loyalty statistics
router.get('/statistics', auth, loyaltyController.getLoyaltyStatistics);

module.exports = router;
