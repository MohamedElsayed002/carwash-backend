const UserPackage = require('./userPackage.model');
const User = require('../user/user.model');
const Package = require('./package.model');

// Get all user packages for the current user
exports.getUserPackages = async (req, res) => {
  try {
    const userPackages = await UserPackage.find({ user: req.user._id })
      .populate('package')
      .sort({ createdAt: -1 });

    res.json(userPackages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a specific user package by ID
exports.getUserPackage = async (req, res) => {
  try {
    const userPackage = await UserPackage.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('package');

    if (!userPackage) {
      return res.status(404).json({ error: 'User package not found' });
    }

    res.json(userPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get active user packages (not expired)
exports.getActiveUserPackages = async (req, res) => {
  try {
    const now = new Date();
    const activeUserPackages = await UserPackage.find({
      user: req.user._id,
      status: 'active',
      expiry: { $gt: now }
    })
      .populate('package')
      .sort({ createdAt: -1 });

    res.json(activeUserPackages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user package (e.g., mark as used, update washes left)
exports.updateUserPackage = async (req, res) => {
  try {
    const { washesLeft, status, expiry } = req.body;

    const userPackage = await UserPackage.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { washesLeft, status, expiry },
      { new: true }
    ).populate('package');

    if (!userPackage) {
      return res.status(404).json({ error: 'User package not found' });
    }

    res.json(userPackage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Use a wash from user package
exports.useWash = async (req, res) => {
  try {
    const userPackage = await UserPackage.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    });

    if (!userPackage) {
      return res.status(404).json({ error: 'User package not found or not active' });
    }

    if (userPackage.washesLeft <= 0) {
      return res.status(400).json({ error: 'No washes left in this package' });
    }

    // Check if package is expired
    if (userPackage.expiry < new Date()) {
      userPackage.status = 'expired';
      await userPackage.save();
      return res.status(400).json({ error: 'Package has expired' });
    }

    // Use one wash
    userPackage.washesLeft -= 1;

    // If no washes left, mark as used
    if (userPackage.washesLeft === 0) {
      await User.findByIdAndUpdate(req.user._id, { isPaid: false });
      console.log(`✅ Updated user ${req.user._id} isPaid status to false after package expiration`);
      userPackage.status = 'used';
    }

    await userPackage.save();

    res.json({
      message: 'Wash used successfully',
      washesLeft: userPackage.washesLeft,
      status: userPackage.status,
      userPackage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user package statistics
exports.getUserPackageStats = async (req, res) => {
  try {
    const now = new Date();

    const stats = await UserPackage.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalPackages: { $sum: 1 },
          activePackages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $gt: ['$expiry', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalWashes: { $sum: '$washesLeft' },
          expiredPackages: {
            $sum: {
              $cond: [
                { $lt: ['$expiry', now] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPackages: 0,
      activePackages: 0,
      totalWashes: 0,
      expiredPackages: 0
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Test endpoint - get user package by ID without authentication (for testing)
exports.getUserPackageById = async (req, res) => {
  try {
    const userPackage = await UserPackage.findById(req.params.id)
      .populate('package')
      .populate('user');

    if (!userPackage) {
      return res.status(404).json({ error: 'User package not found' });
    }

    res.json(userPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Debug endpoint - show current user info
exports.getCurrentUserInfo = async (req, res) => {
  try {
    res.json({
      currentUser: req.user,
      message: 'Current user information'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user packages by user ID (no authentication required)
exports.getUserPackagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userPackages = await UserPackage.find({ user: userId })
      .populate('package')
      .populate('user')
      .sort({ createdAt: -1 });

    res.json(userPackages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================================
// MISSING USER PACKAGE ENDPOINTS
// ========================================

// POST /api/user-package (Purchase package)
exports.purchasePackage = async (req, res) => {
  try {
    const { packageId, carSize, paymentMethod } = req.body;

    if (!packageId || !carSize) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and car size are required'
      });
    }

    // Validate car size
    const validCarSizes = ['small', 'medium', 'large'];
    if (!validCarSizes.includes(carSize)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid car size. Must be small, medium, or large'
      });
    }

    // Check if package exists
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Generate unique barcode
    const barcode = `PKG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiry date (default 1 year from now)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Create user package
    const userPackage = new UserPackage({
      user: req.user._id,
      package: packageId,
      carSize,
      barcode,
      washesLeft: package.washes || 1,
      expiry,
      status: 'active'
    });

    await userPackage.save();
    await userPackage.populate('package');

    // Update user's isPaid status to true when package is purchased
    try {
      await User.findByIdAndUpdate(req.user._id, { isPaid: true });
      console.log(`✅ Updated user ${req.user._id} isPaid status to true after package purchase`);
    } catch (userUpdateError) {
      console.error('❌ Error updating user isPaid status after package purchase:', userUpdateError);
    }

    res.status(201).json({
      success: true,
      message: 'Package purchased successfully',
      data: userPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/user-package/:id/use (Use package wash)
exports.usePackage = async (req, res) => {
  try {
    const userPackage = await UserPackage.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    }).populate('package');

    if (!userPackage) {
      return res.status(404).json({
        success: false,
        message: 'User package not found or not active'
      });
    }

    if (userPackage.washesLeft <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No washes left in this package'
      });
    }

    // Check if package is expired
    if (userPackage.expiry < new Date()) {
      userPackage.status = 'expired';
      await userPackage.save();
      return res.status(400).json({
        success: false,
        message: 'Package has expired'
      });
    }

    // Use one wash
    userPackage.washesLeft -= 1;

    // If no washes left, mark as used
    if (userPackage.washesLeft === 0) {
      userPackage.status = 'used';
    }

    await userPackage.save();

    res.json({
      success: true,
      message: 'Package wash used successfully',
      data: {
        washesLeft: userPackage.washesLeft,
        status: userPackage.status,
        userPackage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/user-package/history (Get package usage history)
exports.getPackageHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const userPackages = await UserPackage.find({ user: req.user._id })
      .populate('package')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserPackage.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        packages: userPackages,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
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