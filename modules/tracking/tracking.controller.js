const Wash = require('../wash/wash.model');
const WashingPlace = require('../washingPlace/washingPlace.model');
const User = require('../user/user.model');

// ========================================
// LIVE ORDER TRACKING
// ========================================

// GET /api/tracking/live-orders
exports.getLiveOrders = async (req, res) => {
  try {
    const liveOrders = await Wash.find({
      status: { $in: ['pending', 'in_progress', 'ready_for_pickup'] }
    })
    .populate('user', 'name phone')
    .populate('washingPlace', 'name city location')
    .populate('package', 'name price')
    .sort({ createdAt: -1 })
    .limit(20);

    const formattedLiveOrders = liveOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'غير محدد',
      customerPhone: order.user?.phone || 'غير محدد',
      branchName: order.washingPlace?.name || 'غير محدد',
      branchLocation: order.washingPlace?.location || null,
      packageName: order.package?.name || 'غير محدد',
      totalAmount: order.totalAmount,
      status: order.status,
      estimatedCompletion: order.estimatedCompletion,
      currentStep: getCurrentStep(order.status),
      progress: getProgressPercentage(order.status),
      createdAt: order.createdAt,
      lastUpdated: order.updatedAt
    }));

    res.json({
      success: true,
      message: 'Live orders retrieved successfully',
      data: { orders: formattedLiveOrders }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/tracking/map-data
exports.getMapData = async (req, res) => {
  try {
    // Get all branches with their locations
    const branches = await WashingPlace.find({}, 'name city location coordinates');
    
    // Get active orders with their locations
    const activeOrders = await Wash.find({
      status: { $in: ['pending', 'in_progress'] }
    })
    .populate('washingPlace', 'name location coordinates')
    .populate('user', 'name phone');

    const mapData = {
      branches: branches.map(branch => ({
        id: branch._id,
        name: branch.name,
        city: branch.city,
        location: branch.location,
        coordinates: branch.coordinates || { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh
        type: 'branch',
        status: 'active'
      })),
      orders: activeOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'غير محدد',
        customerPhone: order.user?.phone || 'غير محدد',
        branchName: order.washingPlace?.name || 'غير محدد',
        location: order.washingPlace?.location || null,
        coordinates: order.washingPlace?.coordinates || { lat: 24.7136, lng: 46.6753 },
        status: order.status,
        type: 'order',
        estimatedCompletion: order.estimatedCompletion
      }))
    };

    res.json({
      success: true,
      message: 'Map data retrieved successfully',
      data: mapData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/tracking/:orderId/history
exports.getTrackingHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Wash.findById(orderId)
      .populate('user', 'name phone')
      .populate('washingPlace', 'name city')
      .populate('package', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate tracking history based on order status
    const trackingHistory = generateTrackingHistory(order);

    res.json({
      success: true,
      message: 'Tracking history retrieved successfully',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.user?.name || 'غير محدد',
          customerPhone: order.user?.phone || 'غير محدد',
          branchName: order.washingPlace?.name || 'غير محدد',
          packageName: order.package?.name || 'غير محدد',
          totalAmount: order.totalAmount,
          status: order.status
        },
        history: trackingHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/tracking/:orderId/update
exports.updateTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, estimatedCompletion } = req.body;

    const order = await Wash.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status and tracking info
    order.status = status;
    order.estimatedCompletion = estimatedCompletion;
    order.trackingNotes = notes;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Tracking updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        estimatedCompletion: order.estimatedCompletion,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/tracking/analytics
exports.getTrackingAnalytics = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
    }

    const analytics = await Wash.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageTime: {
            $avg: {
              $subtract: ['$updatedAt', '$createdAt']
            }
          }
        }
      }
    ]);

    const trackingAnalytics = {
      period,
      totalOrders: analytics.reduce((sum, item) => sum + item.count, 0),
      statusBreakdown: analytics.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          averageTime: item.averageTime ? Math.round(item.averageTime / (1000 * 60)) : 0 // Convert to minutes
        };
        return acc;
      }, {}),
      performance: {
        averageCompletionTime: 35, // Mock data
        onTimeDelivery: 92,
        customerSatisfaction: 4.5
      }
    };

    res.json({
      success: true,
      message: 'Tracking analytics retrieved successfully',
      data: trackingAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// REAL-TIME TRACKING
// ========================================

// GET /api/tracking/real-time/orders
exports.getRealTimeOrders = async (req, res) => {
  try {
    const realTimeOrders = await Wash.find({
      status: { $in: ['in_progress', 'ready_for_pickup'] }
    })
    .populate('user', 'name phone')
    .populate('washingPlace', 'name city')
    .populate('package', 'name price')
    .sort({ updatedAt: -1 })
    .limit(10);

    const formattedRealTimeOrders = realTimeOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'غير محدد',
      customerPhone: order.user?.phone || 'غير محدد',
      branchName: order.washingPlace?.name || 'غير محدد',
      packageName: order.package?.name || 'غير محدد',
      status: order.status,
      currentStep: getCurrentStep(order.status),
      progress: getProgressPercentage(order.status),
      estimatedCompletion: order.estimatedCompletion,
      lastUpdated: order.updatedAt
    }));

    res.json({
      success: true,
      message: 'Real-time orders retrieved successfully',
      data: { orders: formattedRealTimeOrders }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// BRANCH TRACKING
// ========================================

// GET /api/tracking/branch/:branchId
exports.getBranchTracking = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const branchOrders = await Wash.find({
      washingPlace: branchId,
      status: { $in: ['pending', 'in_progress', 'ready_for_pickup'] }
    })
    .populate('user', 'name phone')
    .populate('package', 'name price')
    .sort({ createdAt: -1 });

    const branch = await WashingPlace.findById(branchId);
    
    const branchTracking = {
      branch: {
        _id: branch._id,
        name: branch.name,
        city: branch.city,
        location: branch.location,
        status: 'active'
      },
      orders: branchOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'غير محدد',
        customerPhone: order.user?.phone || 'غير محدد',
        packageName: order.package?.name || 'غير محدد',
        status: order.status,
        currentStep: getCurrentStep(order.status),
        progress: getProgressPercentage(order.status),
        estimatedCompletion: order.estimatedCompletion,
        createdAt: order.createdAt
      })),
      summary: {
        totalOrders: branchOrders.length,
        pending: branchOrders.filter(o => o.status === 'pending').length,
        inProgress: branchOrders.filter(o => o.status === 'in_progress').length,
        readyForPickup: branchOrders.filter(o => o.status === 'ready_for_pickup').length
      }
    };

    res.json({
      success: true,
      message: 'Branch tracking data retrieved successfully',
      data: branchTracking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getCurrentStep(status) {
  const steps = {
    'pending': 'في انتظار البدء',
    'in_progress': 'قيد التنفيذ',
    'ready_for_pickup': 'جاهز للاستلام',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };
  return steps[status] || 'غير محدد';
}

function getProgressPercentage(status) {
  const progress = {
    'pending': 0,
    'in_progress': 50,
    'ready_for_pickup': 90,
    'completed': 100,
    'cancelled': 0
  };
  return progress[status] || 0;
}

function generateTrackingHistory(order) {
  const history = [
    {
      id: 1,
      step: 'تم إنشاء الطلب',
      description: 'تم استلام طلبك بنجاح',
      status: 'completed',
      timestamp: order.createdAt,
      icon: 'order-created'
    }
  ];

  if (order.status !== 'pending') {
    history.push({
      id: 2,
      step: 'تم بدء العمل',
      description: 'بدأ فريق العمل في معالجة طلبك',
      status: 'completed',
      timestamp: new Date(order.createdAt.getTime() + 5 * 60 * 1000), // 5 minutes after creation
      icon: 'work-started'
    });
  }

  if (order.status === 'in_progress' || order.status === 'ready_for_pickup' || order.status === 'completed') {
    history.push({
      id: 3,
      step: 'قيد التنفيذ',
      description: 'جاري غسيل وتنظيف السيارة',
      status: 'completed',
      timestamp: new Date(order.createdAt.getTime() + 10 * 60 * 1000), // 10 minutes after creation
      icon: 'in-progress'
    });
  }

  if (order.status === 'ready_for_pickup' || order.status === 'completed') {
    history.push({
      id: 4,
      step: 'جاهز للاستلام',
      description: 'تم الانتهاء من غسيل السيارة وجاهز للاستلام',
      status: 'completed',
      timestamp: new Date(order.createdAt.getTime() + 35 * 60 * 1000), // 35 minutes after creation
      icon: 'ready'
    });
  }

  if (order.status === 'completed') {
    history.push({
      id: 5,
      step: 'تم التسليم',
      description: 'تم تسليم السيارة للعميل',
      status: 'completed',
      timestamp: order.updatedAt,
      icon: 'delivered'
    });
  }

  if (order.status === 'cancelled') {
    history.push({
      id: 6,
      step: 'تم الإلغاء',
      description: 'تم إلغاء الطلب',
      status: 'cancelled',
      timestamp: order.updatedAt,
      icon: 'cancelled'
    });
  }

  return history;
}
