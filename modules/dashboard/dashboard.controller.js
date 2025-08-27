const User = require('../user/user.model');
const Wash = require('../wash/wash.model');
const Payment = require('../payment/payment.model');
const WashingPlace = require('../washingPlace/washingPlace.model');
const Package = require('../package/package.model');
const Feedback = require('../feedback/feedback.model');

// ========================================
// DASHBOARD OVERVIEW
// ========================================

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
    try {
        // Get basic statistics
        const totalUsers = await User.countDocuments();
        const totalOrders = await Wash.countDocuments();
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const activeOrders = await Wash.countDocuments({
            status: { $in: ['pending', 'confirmed', 'in_progress'] }
        });
        const totalBranches = await WashingPlace.countDocuments();
        const totalPackages = await Package.countDocuments();

        // Get average rating
        const avgRating = await Feedback.aggregate([
            { $group: { _id: null, average: { $avg: '$rating' } } }
        ]);

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Wash.countDocuments({
            createdAt: { $gte: today }
        });

        const stats = {
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            activeOrders,
            totalBranches,
            totalPackages,
            averageRating: Math.round((avgRating[0]?.average || 0) * 10) / 10,
            todayOrders
        };

        res.json({
            success: true,
            message: 'Dashboard stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/dashboard/overview
exports.getDashboardOverview = async (req, res) => {
    try {
        // Get basic statistics
        const totalUsers = await User.countDocuments();
        const totalOrders = await Wash.countDocuments();
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const activeOrders = await Wash.countDocuments({
            status: { $in: ['pending', 'in_progress'] }
        });
        const totalBranches = await WashingPlace.countDocuments();
        const totalPackages = await Package.countDocuments();

        // Get average rating
        const avgRating = await Feedback.aggregate([
            { $group: { _id: null, average: { $avg: '$rating' } } }
        ]);

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Wash.countDocuments({
            createdAt: { $gte: today }
        });

        const overview = {
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            activeOrders,
            totalBranches,
            totalPackages,
            averageRating: avgRating[0]?.average || 0,
            todayOrders
        };

        res.json({
            success: true,
            message: 'Dashboard overview retrieved successfully',
            data: overview
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/dashboard/live-stats
exports.getLiveStats = async (req, res) => {
    try {
        // Get real-time statistics
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        const hourlyOrders = await Wash.countDocuments({
            createdAt: { $gte: lastHour }
        });

        const hourlyRevenue = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: lastHour }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const liveStats = {
            hourlyOrders,
            hourlyRevenue: hourlyRevenue[0]?.total || 0,
            activeUsers: Math.floor(Math.random() * 50) + 10, // Mock data
            systemStatus: 'healthy',
            lastUpdated: now.toISOString()
        };

        res.json({
            success: true,
            message: 'Live stats retrieved successfully',
            data: liveStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/dashboard/alerts
exports.getDashboardAlerts = async (req, res) => {
    try {
        // Get system alerts
        const alerts = [
            {
                id: 1,
                type: 'warning',
                title: 'مخزون منخفض',
                message: 'المنظفات ستنفد خلال يومين',
                priority: 'medium',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                type: 'info',
                title: 'تحديث النظام',
                message: 'تم تحديث النظام بنجاح',
                priority: 'low',
                timestamp: new Date().toISOString()
            },
            {
                id: 3,
                type: 'error',
                title: 'خطأ في الاتصال',
                message: 'فشل الاتصال بقاعدة البيانات',
                priority: 'high',
                timestamp: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            message: 'Dashboard alerts retrieved successfully',
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/dashboard/quick-actions
exports.getQuickActions = async (req, res) => {
    try {
        const quickActions = [
            {
                id: 1,
                title: 'إضافة طلب جديد',
                icon: 'add-order',
                action: 'create-order',
                color: 'primary'
            },
            {
                id: 2,
                title: 'إضافة عميل',
                icon: 'add-user',
                action: 'create-customer',
                color: 'success'
            },
            {
                id: 3,
                title: 'إضافة فرع',
                icon: 'add-branch',
                action: 'create-branch',
                color: 'info'
            },
            {
                id: 4,
                title: 'إنشاء تقرير',
                icon: 'report',
                action: 'create-report',
                color: 'warning'
            }
        ];

        res.json({
            success: true,
            message: 'Quick actions retrieved successfully',
            data: quickActions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// RECENT ORDERS
// ========================================

// GET /api/dashboard/recent-orders
exports.getRecentOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentOrders = await Wash.find()
            .populate('userId', 'name phone')
            .populate('branchId', 'name city')
            .populate('packageId', 'name price')
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('orderNumber status totalAmount createdAt');

        const formattedOrders = recentOrders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            customerName: order.userId?.name || 'غير محدد',
            customerPhone: order.userId?.phone || 'غير محدد',
            customerAvatar: `https://via.placeholder.com/40`,
            branchName: order.branchId?.name || 'غير محدد',
            packageName: order.packageId?.name || 'غير محدد',
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.json({
            success: true,
            message: 'Recent orders retrieved successfully',
            data: { orders: formattedOrders }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// LIVE TRACKING
// ========================================

// GET /api/dashboard/live-tracking
exports.getLiveTracking = async (req, res) => {
    try {
        const liveOrders = await Wash.find({
            status: { $in: ['pending', 'confirmed', 'in_progress', 'ready_for_pickup'] }
        })
            .populate('userId', 'name phone')
            .populate('branchId', 'name city')
            .populate('packageId', 'name price')
            .sort({ createdAt: -1 })
            .limit(8);

        const formattedLiveOrders = liveOrders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            customerName: order.userId?.name || 'غير محدد',
            customerPhone: order.userId?.phone || 'غير محدد',
            branchName: order.branchId?.name || 'غير محدد',
            packageName: order.packageId?.name || 'غير محدد',
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.json({
            success: true,
            message: 'Live tracking data retrieved successfully',
            data: { orders: formattedLiveOrders }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// BRANCH PERFORMANCE
// ========================================

// GET /api/dashboard/branch-performance
exports.getBranchPerformance = async (req, res) => {
    try {
        const branchPerformance = await WashingPlace.aggregate([
            {
                $lookup: {
                    from: 'washes',
                    localField: '_id',
                    foreignField: 'branchId',
                    as: 'orders'
                }
            },
            {
                $project: {
                    branchId: '$_id',
                    branchName: '$name',
                    city: '$city',
                    totalOrders: { $size: '$orders' },
                    completedOrders: {
                        $size: {
                            $filter: {
                                input: '$orders',
                                cond: { $eq: ['$$this.status', 'completed'] }
                            }
                        }
                    },
                    revenue: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$orders',
                                        cond: { $eq: ['$$this.status', 'completed'] }
                                    }
                                },
                                as: 'order',
                                in: '$$order.totalAmount'
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    growth: { $multiply: [{ $random: {} }, 20] } // Mock growth data
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            message: 'Branch performance data retrieved successfully',
            data: { branches: branchPerformance }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// REVENUE ANALYTICS
// ========================================

// GET /api/dashboard/revenue
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const period = req.query.period || 'month';

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'daily':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - 7);
                dateFilter = { createdAt: { $gte: startOfWeek } };
                break;
            case 'weekly':
                const startOfMonth = new Date(now);
                startOfMonth.setDate(1);
                dateFilter = { createdAt: { $gte: startOfMonth } };
                break;
            case 'monthly':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateFilter = { createdAt: { $gte: startOfYear } };
                break;
        }

        const revenueData = await Payment.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: period === 'daily' ? '%Y-%m-%d' :
                                period === 'weekly' ? '%Y-%U' : '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for charts
        const labels = revenueData.map(item => item._id);
        const data = revenueData.map(item => item.total);

        res.json({
            success: true,
            message: 'Revenue analytics retrieved successfully',
            data: { labels, data }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// CUSTOMER ANALYTICS
// ========================================

// GET /api/dashboard/customer-analytics
exports.getCustomerAnalytics = async (req, res) => {
    try {
        const customerStats = await User.aggregate([
            {
                $lookup: {
                    from: 'washes',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $project: {
                    totalOrders: { $size: '$orders' },
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: '$$order.totalAmount'
                            }
                        }
                    },
                    averageOrderValue: {
                        $cond: {
                            if: { $gt: [{ $size: '$orders' }, 0] },
                            then: {
                                $divide: [
                                    {
                                        $sum: {
                                            $map: {
                                                input: '$orders',
                                                as: 'order',
                                                in: '$$order.totalAmount'
                                            }
                                        }
                                    },
                                    { $size: '$orders' }
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalOrders: { $sum: '$totalOrders' },
                    totalRevenue: { $sum: '$totalSpent' },
                    averageOrderValue: { $avg: '$averageOrderValue' }
                }
            }
        ]);

        res.json({
            success: true,
            message: 'Customer analytics retrieved successfully',
            data: customerStats[0] || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// SYSTEM STATUS
// ========================================

// GET /api/dashboard/system-status
exports.getSystemStatus = async (req, res) => {
    try {
        const systemStatus = {
            database: 'connected',
            api: 'healthy',
            storage: 'available',
            notifications: 'active',
            integrations: 'connected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'System status retrieved successfully',
            data: systemStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// NOTIFICATIONS SUMMARY
// ========================================

// GET /api/dashboard/notifications-summary
exports.getNotificationsSummary = async (req, res) => {
    try {
        const notificationsSummary = {
            unread: 15,
            total: 45,
            urgent: 3,
            today: 8,
            categories: {
                orders: 12,
                customers: 8,
                system: 5,
                payments: 10,
                maintenance: 10
            }
        };

        res.json({
            success: true,
            message: 'Notifications summary retrieved successfully',
            data: notificationsSummary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ========================================
// QUICK STATS
// ========================================

// GET /api/dashboard/quick-stats
exports.getQuickStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const [todayStats, yesterdayStats] = await Promise.all([
            // Today's stats
            Promise.all([
                Wash.countDocuments({ createdAt: { $gte: today } }),
                Payment.aggregate([
                    {
                        $match: {
                            status: 'completed',
                            createdAt: { $gte: today }
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                User.countDocuments({ createdAt: { $gte: today } })
            ]),
            // Yesterday's stats
            Promise.all([
                Wash.countDocuments({
                    createdAt: { $gte: yesterday, $lt: today }
                }),
                Payment.aggregate([
                    {
                        $match: {
                            status: 'completed',
                            createdAt: { $gte: yesterday, $lt: today }
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                User.countDocuments({
                    createdAt: { $gte: yesterday, $lt: today }
                })
            ])
        ]);

        const quickStats = {
            today: {
                orders: todayStats[0],
                revenue: todayStats[1][0]?.total || 0,
                newCustomers: todayStats[2]
            },
            yesterday: {
                orders: yesterdayStats[0],
                revenue: yesterdayStats[1][0]?.total || 0,
                newCustomers: yesterdayStats[2]
            },
            growth: {
                orders: todayStats[0] - yesterdayStats[0],
                revenue: (todayStats[1][0]?.total || 0) - (yesterdayStats[1][0]?.total || 0),
                customers: todayStats[2] - yesterdayStats[2]
            }
        };

        res.json({
            success: true,
            message: 'Quick stats retrieved successfully',
            data: quickStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
