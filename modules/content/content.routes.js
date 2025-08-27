const express = require('express');
const router = express.Router();
const contentController = require('./content.controller');
const auth = require('../../middleware/auth');

// Public routes (no authentication required)
router.get('/homepage', contentController.getHomepageContent);
router.get('/services', contentController.getServicesContent);
router.get('/packages', contentController.getPackagesContent);
router.get('/:type', contentController.getContentByType);

// Protected routes (authentication required)
router.use(auth);

// Get all content (admin)
router.get('/', contentController.getAllContent);

// Save content
router.post('/homepage', contentController.saveHomepageContent);
router.post('/services', contentController.saveServicesContent);
router.post('/packages', contentController.savePackagesContent);

// Upload image
router.post('/upload-image', contentController.uploadImage);

module.exports = router;
