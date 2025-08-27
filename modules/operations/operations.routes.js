const express = require('express');
const router = express.Router();
const operationsController = require('./operations.controller');
const auth = require('../../middleware/auth');

// ========================================
// WORKFLOW MANAGEMENT ROUTES
// ========================================

// GET /api/operations/workflows - Get all workflows
router.get('/workflows', auth, operationsController.getWorkflows);

// GET /api/operations/steps/:workflowId - Get process steps for a workflow
router.get('/steps/:workflowId', auth, operationsController.getProcessSteps);

// PUT /api/operations/:id/progress - Update operation progress
router.put('/:id/progress', auth, operationsController.updateProgress);

// ========================================
// RESOURCE MANAGEMENT ROUTES
// ========================================

// GET /api/operations/resources - Get available resources
router.get('/resources', auth, operationsController.getResources);

// ========================================
// PERFORMANCE ANALYTICS ROUTES
// ========================================

// GET /api/operations/performance - Get performance metrics
router.get('/performance', auth, operationsController.getPerformance);

// ========================================
// PROCESS OPTIMIZATION ROUTES
// ========================================

// POST /api/operations/optimize - Optimize processes
router.post('/optimize', auth, operationsController.optimizeProcess);

// ========================================
// SCHEDULING ROUTES
// ========================================

// GET /api/operations/schedule - Get operation schedule
router.get('/schedule', auth, operationsController.getSchedule);

// ========================================
// REPORTS ROUTES
// ========================================

// GET /api/operations/reports - Get operation reports
router.get('/reports', auth, operationsController.getOperationReports);

// ========================================
// ANALYTICS ROUTES
// ========================================

// GET /api/operations/analytics - Get operation analytics
router.get('/analytics', auth, operationsController.getOperationAnalytics);

module.exports = router;
