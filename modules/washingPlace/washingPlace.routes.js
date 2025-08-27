const express = require('express');
const router = express.Router();
const washingPlaceController = require('./washingPlace.controller');
const auth = require('../../middleware/auth');
const feedbackController = require('../feedback/feedback.controller');

router.post('/', washingPlaceController.createWashingPlace);
router.get('/', washingPlaceController.getWashingPlaces);
router.get('/nearest', washingPlaceController.getNearestWashingPlaces);

// ========================================
// MISSING BRANCH MANAGEMENT ROUTES
// ========================================

// Get branches by city
router.get('/city/:city', washingPlaceController.getWashingPlacesByCity);

router.get('/:id/feedbacks', washingPlaceController.getFeedbacksForWashingPlace);
router.get('/:id', washingPlaceController.getWashingPlace);
router.put('/:id', auth, washingPlaceController.updateWashingPlace);
router.delete('/:id', auth, washingPlaceController.deleteWashingPlace);

module.exports = router; 