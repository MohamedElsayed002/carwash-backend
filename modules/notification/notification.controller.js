const Notification = require('./notification.model');
const User = require('../user/user.model');

// GET /api/notifications (Get user notifications)
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unread = false, type } = req.query;
        const skip = (page - 1) * limit;

        const filter = { user: req.user._id };
        if (unread === 'true') {
            filter.read = false;
        }
        if (type) {
            filter.type = type;
        }

        const notifications = await Notification.find(filter)
            .populate('relatedWash relatedPayment relatedPackage')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            read: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                },
                unreadCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/notifications/:id/read (Mark notification as read)
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        ).populate('relatedWash relatedPayment relatedPackage');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/notifications/read-all (Mark all notifications as read)
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: {
                updatedCount: result.modifiedCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE /api/notifications/:id (Delete notification)
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/notifications/settings (Get notification settings)
exports.getNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notificationSettings');

        // Default settings if none exist
        const defaultSettings = {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            orderUpdates: true,
            paymentUpdates: true,
            promotionalNotifications: false,
            feedbackReminders: true
        };

        const settings = user.notificationSettings || defaultSettings;

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/notifications/settings (Update notification settings)
exports.updateNotificationSettings = async (req, res) => {
    try {
        const {
            emailNotifications,
            smsNotifications,
            pushNotifications,
            orderUpdates,
            paymentUpdates,
            promotionalNotifications,
            feedbackReminders
        } = req.body;

        const settings = {
            emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
            smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
            pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
            orderUpdates: orderUpdates !== undefined ? orderUpdates : true,
            paymentUpdates: paymentUpdates !== undefined ? paymentUpdates : true,
            promotionalNotifications: promotionalNotifications !== undefined ? promotionalNotifications : false,
            feedbackReminders: feedbackReminders !== undefined ? feedbackReminders : true
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { notificationSettings: settings },
            { new: true }
        ).select('notificationSettings');

        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            data: user.notificationSettings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/notifications (Create notification - for internal use)
exports.createNotification = async (req, res) => {
    try {
        const {
            userId,
            title,
            message,
            type = 'system',
            relatedWash,
            relatedPayment,
            relatedPackage,
            data,
            priority = 'medium',
            expiresAt
        } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'User ID, title, and message are required'
            });
        }

        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            relatedWash,
            relatedPayment,
            relatedPackage,
            data,
            priority,
            expiresAt
        });

        await notification.save();
        await notification.populate('relatedWash relatedPayment relatedPackage');

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
