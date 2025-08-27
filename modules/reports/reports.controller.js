const Wash = require('../wash/wash.model');
const Payment = require('../payment/payment.model');
const User = require('../user/user.model');
const UserPackage = require('../package/userPackage.model');
const WashingPlace = require('../washingPlace/washingPlace.model');
const mongoose = require('mongoose');

// GET /api/reports/sales (Get sales report)
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, branchId, groupBy = 'day' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    const matchStage = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    };
    
    if (branchId) {
      matchStage.washingPlace = mongoose.Types.ObjectId(branchId);
    }
    
    let groupFormat;
    switch (groupBy) {
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }
    
    const salesData = await Wash.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const summary = await Wash.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        salesData,
        summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/reports/customers (Get customer report)
exports.getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const customerStats = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'washes',
          localField: '_id',
          foreignField: 'user',
          as: 'washes'
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user',
          as: 'payments'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          totalOrders: { $size: '$washes' },
          totalSpent: { $sum: '$payments.amount' },
          avgOrderValue: { 
            $cond: [
              { $gt: [{ $size: '$washes' }, 0] },
              { $divide: [{ $sum: '$payments.amount' }, { $size: '$washes' }] },
              0
            ]
          },
          lastOrder: { $max: '$washes.createdAt' },
          registrationDate: '$createdAt'
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    const summary = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'washes',
          localField: '_id',
          foreignField: 'user',
          as: 'washes'
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { 
            $sum: { $cond: [{ $gt: [{ $size: '$washes' }, 0] }, 1, 0] } 
          },
          avgOrdersPerCustomer: { $avg: { $size: '$washes' } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        customers: customerStats,
        summary: summary[0] || { totalCustomers: 0, activeCustomers: 0, avgOrdersPerCustomer: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/reports/employees (Get employee report)
exports.getEmployeeReport = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    
    const matchStage = {
      role: 'owner'
    };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const employeeStats = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'washes',
          localField: '_id',
          foreignField: 'owner',
          as: 'completedWashes'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          totalWashes: { $size: '$completedWashes' },
          totalRevenue: { $sum: '$completedWashes.totalAmount' },
          avgWashesPerDay: { 
            $cond: [
              { $gt: [{ $size: '$completedWashes' }, 0] },
              { $divide: [{ $size: '$completedWashes' }, 30] }, // Assuming 30 days
              0
            ]
          },
          lastActivity: { $max: '$completedWashes.createdAt' }
        }
      },
      { $sort: { totalWashes: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        employees: employeeStats,
        summary: {
          totalEmployees: employeeStats.length,
          totalWashes: employeeStats.reduce((sum, emp) => sum + emp.totalWashes, 0),
          totalRevenue: employeeStats.reduce((sum, emp) => sum + emp.totalRevenue, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/reports/financial (Get financial report)
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    const matchStage = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    };
    
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    }
    
    const financialData = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' },
          revenueByMethod: {
            $push: {
              method: '$method',
              amount: '$amount'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const summary = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' },
          revenueByMethod: {
            $push: {
              method: '$method',
              amount: '$amount'
            }
          }
        }
      }
    ]);
    
    // Process payment method breakdown
    const methodBreakdown = {};
    if (summary[0] && summary[0].revenueByMethod) {
      summary[0].revenueByMethod.forEach(item => {
        if (!methodBreakdown[item.method]) {
          methodBreakdown[item.method] = 0;
        }
        methodBreakdown[item.method] += item.amount;
      });
    }
    
    res.json({
      success: true,
      data: {
        financialData,
        summary: {
          ...summary[0],
          revenueByMethod: methodBreakdown
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/reports/export/:type (Export report)
exports.exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    let data;
    switch (type) {
      case 'sales':
        data = await getSalesData(startDate, endDate);
        break;
      case 'customers':
        data = await getCustomerData(startDate, endDate);
        break;
      case 'financial':
        data = await getFinancialData(startDate, endDate);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${startDate}_${endDate}.csv"`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data,
      exportInfo: {
        type,
        startDate,
        endDate,
        format,
        exportedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Helper functions for export
async function getSalesData(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'completed'
  };
  
  return await Wash.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $lookup: {
        from: 'washingplaces',
        localField: 'washingPlace',
        foreignField: '_id',
        as: 'branch'
      }
    },
    {
      $project: {
        orderId: '$_id',
        customerName: { $arrayElemAt: ['$customer.name', 0] },
        customerEmail: { $arrayElemAt: ['$customer.email', 0] },
        branchName: { $arrayElemAt: ['$branch.name', 0] },
        totalAmount: 1,
        status: 1,
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
}

async function getCustomerData(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  return await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'washes',
        localField: '_id',
        foreignField: 'user',
        as: 'orders'
      }
    },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'user',
        as: 'payments'
      }
    },
    {
      $project: {
        customerId: '$_id',
        name: 1,
        email: 1,
        phone: 1,
        totalOrders: { $size: '$orders' },
        totalSpent: { $sum: '$payments.amount' },
        registrationDate: '$createdAt',
        lastOrder: { $max: '$orders.createdAt' }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
}

async function getFinancialData(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'completed'
  };
  
  return await Payment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $project: {
        paymentId: '$_id',
        customerName: { $arrayElemAt: ['$customer.name', 0] },
        amount: 1,
        method: 1,
        status: 1,
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}
