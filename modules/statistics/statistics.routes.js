/**
 * Statistics Routes
 * راوتس الإحصائيات
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesStatistics,
  getUserStatistics,
  getWashingPlaceStats,
  getPackageStats,
  getFinancialStats,
  getRealTimeStats
} = require('./statisticsController');

// ========================================
// STATISTICS ROUTES
// ========================================

/**
 * @route   GET /api/statistics/dashboard
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/statistics/sales
 * @desc    Get sales statistics with date range
 * @access  Private/Admin
 */
router.get('/sales', getSalesStatistics);

/**
 * @route   GET /api/statistics/users
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get('/users', getUserStatistics);

/**
 * @route   GET /api/statistics/washing-places
 * @desc    Get washing place performance statistics
 * @access  Private/Admin
 */
router.get('/washing-places', getWashingPlaceStats);

/**
 * @route   GET /api/statistics/packages
 * @desc    Get package performance statistics
 * @access  Private/Admin
 */
router.get('/packages', getPackageStats);

/**
 * @route   GET /api/statistics/financial
 * @desc    Get financial statistics
 * @access  Private/Admin
 */
router.get('/financial', getFinancialStats);

/**
 * @route   GET /api/statistics/realtime
 * @desc    Get real-time statistics
 * @access  Private/Admin
 */
router.get('/realtime', getRealTimeStats);

module.exports = router;
