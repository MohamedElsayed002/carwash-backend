const User = require("../user/user.model");
const Package = require('../package/package.model');
const Payment = require('../payment/payment.model');
const Wash = require('../wash/wash.model');
const Car = require('../car/car.model');
const WashingPlace = require('../washingPlace/washingPlace.model');
const Feedback = require('../feedback/feedback.model');
const UserPackage = require('../package/userPackage.model');

// @desc    Get dashboard statistics
// @route   GET /api/statistics/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPackages,
      totalPayments,
      totalWashes,
      totalCars,
      totalWashingPlaces,
      totalFeedbacks,
      activeUserPackages
    ] = await Promise.all([
      User.countDocuments(),
      Package.countDocuments(),
      Payment.countDocuments(),
      Wash.countDocuments(),
      Car.countDocuments(),
      WashingPlace.countDocuments(),
      Feedback.countDocuments(),
      UserPackage.countDocuments({ status: 'active' })
    ]);

    // Calculate total revenue
    const revenueResult = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent activities
    const recentWashes = await Wash.find()
      .populate('car', 'make model licensePlate')
      .populate('washingPlace', 'name')
      .populate('package', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get package distribution
    const packageStats = await Wash.aggregate([
      {
        $group: {
          _id: '$package',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'packages',
          localField: '_id',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      {
        $unwind: '$packageInfo'
      },
      {
        $project: {
          packageName: '$packageInfo.name',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          packages: totalPackages,
          payments: totalPayments,
          washes: totalWashes,
          cars: totalCars,
          washingPlaces: totalWashingPlaces,
          feedbacks: totalFeedbacks,
          activeUserPackages
        },
        revenue: {
          total: totalRevenue,
          currency: 'SAR'
        },
        recentActivities: recentWashes,
        packageDistribution: packageStats
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get sales statistics with date range
// @route   GET /api/statistics/sales
// @access  Private/Admin
const getSalesStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = { hour: { $hour: '$createdAt' } };
        break;
      case 'week':
        groupFormat = { week: { $week: '$createdAt' } };
        break;
      case 'month':
        groupFormat = { month: { $month: '$createdAt' } };
        break;
      case 'year':
        groupFormat = { year: { $year: '$createdAt' } };
        break;
      default: // day
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...matchStage
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 },
          averageSale: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const totalSales = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...matchStage
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        salesData,
        summary: totalSales[0] || {
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransaction: 0
        },
        timeframe: {
          startDate,
          endDate,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Sales statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/statistics/users
// @access  Private/Admin
const getUserStatistics = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $limit: 30
      }
    ]);

    const activeUsers = await Wash.aggregate([
      {
        $group: {
          _id: '$user',
          washCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userName: '$userInfo.name',
          email: '$userInfo.email',
          washCount: 1,
          lastActivity: '$userInfo.lastLogin'
        }
      },
      {
        $sort: { washCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        roleDistribution: userStats,
        userGrowth,
        topActiveUsers: activeUsers,
        totalUsers: await User.countDocuments()
      }
    });
  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get washing place performance statistics
// @route   GET /api/statistics/washing-places
// @access  Private/Admin
const getWashingPlaceStats = async (req, res) => {
  try {
    const washingPlaceStats = await Wash.aggregate([
      {
        $group: {
          _id: '$washingPlace',
          totalWashes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'washingplaces',
          localField: '_id',
          foreignField: '_id',
          as: 'washingPlaceInfo'
        }
      },
      {
        $unwind: '$washingPlaceInfo'
      },
      {
        $project: {
          washingPlaceName: '$washingPlaceInfo.name',
          location: '$washingPlaceInfo.address',
          totalWashes: 1,
          totalRevenue: 1,
          averageRating: { $ifNull: ['$averageRating', 0] }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Get feedback statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$washingPlace',
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
          positiveFeedbacks: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'washingplaces',
          localField: '_id',
          foreignField: '_id',
          as: 'washingPlaceInfo'
        }
      },
      {
        $unwind: '$washingPlaceInfo'
      },
      {
        $project: {
          washingPlaceName: '$washingPlaceInfo.name',
          averageRating: { $round: ['$averageRating', 2] },
          totalFeedbacks: 1,
          positiveFeedbacks: 1,
          satisfactionRate: {
            $multiply: [
              { $divide: ['$positiveFeedbacks', '$totalFeedbacks'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        washingPlacePerformance: washingPlaceStats,
        feedbackStatistics: feedbackStats
      }
    });
  } catch (error) {
    console.error('Washing place stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get package performance statistics
// @route   GET /api/statistics/packages
// @access  Private/Admin
const getPackageStats = async (req, res) => {
  try {
    const packageStats = await Wash.aggregate([
      {
        $group: {
          _id: '$package',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'packages',
          localField: '_id',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      {
        $unwind: '$packageInfo'
      },
      {
        $project: {
          packageName: '$packageInfo.name',
          packagePrice: '$packageInfo.price',
          totalSales: 1,
          totalRevenue: 1,
          averageRating: { $ifNull: ['$averageRating', 0] },
          popularity: { $multiply: [{ $divide: ['$totalSales', await Wash.countDocuments()] }, 100] }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    const monthlyPackageTrends = await Wash.aggregate([
      {
        $group: {
          _id: {
            package: '$package',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          monthlySales: { $sum: 1 },
          monthlyRevenue: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'packages',
          localField: '_id.package',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      {
        $unwind: '$packageInfo'
      },
      {
        $project: {
          packageName: '$packageInfo.name',
          year: '$_id.year',
          month: '$_id.month',
          monthlySales: 1,
          monthlyRevenue: 1,
          _id: 0
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        packagePerformance: packageStats,
        monthlyTrends: monthlyPackageTrends
      }
    });
  } catch (error) {
    console.error('Package stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get financial statistics
// @route   GET /api/statistics/financial
// @access  Private/Admin
const getFinancialStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const financialData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...matchStage
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const paymentMethodStats = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...matchStage
        }
      },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Calculate growth compared to previous period
    const currentPeriod = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...matchStage
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        financialOverview: financialData,
        paymentMethodAnalysis: paymentMethodStats,
        currentPeriod: currentPeriod[0] || { totalRevenue: 0, transactionCount: 0 },
        timeframe: {
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Financial stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get real-time statistics
// @route   GET /api/statistics/realtime
// @access  Private/Admin
const getRealTimeStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const [
      todayWashes,
      todayRevenue,
      activeWashes,
      pendingPayments,
      newUsersToday
    ] = await Promise.all([
      Wash.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: todayStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Wash.countDocuments({ status: { $in: ['in-progress', 'pending'] } }),
      Payment.countDocuments({ status: 'pending' }),
      User.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: {
          washes: todayWashes,
          revenue: todayRevenue[0]?.total || 0,
          newUsers: newUsersToday
        },
        current: {
          activeWashes,
          pendingPayments
        },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getSalesStatistics,
  getUserStatistics,
  getWashingPlaceStats,
  getPackageStats,
  getFinancialStats,
  getRealTimeStats
};