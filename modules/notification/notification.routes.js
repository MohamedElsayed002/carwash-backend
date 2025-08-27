const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const auth = require('../../middleware/auth');

// All routes require authentication
router.use(auth);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Get notification settings
router.get('/settings', notificationController.getNotificationSettings);

// Update notification settings
router.put('/settings', notificationController.updateNotificationSettings);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Create notification (for internal use - might need admin auth)
router.post('/', notificationController.createNotification);

module.exports = router;
