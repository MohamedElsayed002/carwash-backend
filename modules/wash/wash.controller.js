const UserPackage = require('../package/userPackage.model');
const Package = require('../package/package.model');
const Car = require('../car/car.model');
const Wash = require('./wash.model');
const { sendNotification } = require('../../services/notification');

exports.createWash = async (req, res) => {
  try {
    const wash = new Wash({ ...req.body, user: req.user._id });
    await wash.save();
    res.status(201).json(wash);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getWashes = async (req, res) => {
  try {
    const washes = await Wash.find({ user: req.user._id })
      .populate('washingPlace package feedback');
    res.json(washes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWash = async (req, res) => {
  try {
    const wash = await Wash.findOne({ _id: req.params.id, user: req.user._id }).populate('washingPlace package');
    if (!wash) return res.status(404).json({ error: 'Wash not found' });
    res.json(wash);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateWash = async (req, res) => {
  try {
    const wash = await Wash.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!wash) return res.status(404).json({ error: 'Wash not found' });
    res.json(wash);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteWash = async (req, res) => {
  try {
    const wash = await Wash.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!wash) return res.status(404).json({ error: 'Wash not found' });
    res.json({ message: 'Wash deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.scanBarcodeAndDeductWash = async (req, res) => {
  try {
    const { barcode, washingPlace } = req.body;
    // Find active user package by barcode
    const userPackage = await UserPackage.findOne({ barcode, status: 'active', expiry: { $gt: new Date() }, washesLeft: { $gt: 0 } })
      .populate('user package');
    if (!userPackage) return res.status(400).json({ error: 'Invalid or expired barcode, or no washes left' });
    // Deduct a wash
    userPackage.washesLeft -= 1;
    if (userPackage.washesLeft === 0) userPackage.status = 'used';
    await userPackage.save();
    // Create wash record
    const wash = new Wash({
      user: userPackage.user._id,
      washingPlace,
      package: userPackage.package._id,
      status: 'completed',
      owner: req.user._id, // set owner to the scanning owner
    });
    await wash.save();
    // Send feedback notification
    await sendNotification({
      user: userPackage.user._id,
      type: 'feedback',
      message: 'Please rate your recent wash and optionally add a tip.',
      relatedWash: wash._id,
    });
    res.json({
      user: userPackage.user,
      carSize: userPackage.carSize,
      package: userPackage.package,
      washesLeft: userPackage.washesLeft,
      expiry: userPackage.expiry,
      wash,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all washes performed by the current owner
exports.getWashesByOwner = async (req, res) => {
  try {
    const washes = await Wash.find({ owner: req.user._id })
      .populate('user package washingPlace');
    res.json(washes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================================
// MISSING ORDER MANAGEMENT ENDPOINTS
// ========================================

// GET /api/washes/user/:userId (Get washes for specific user)
exports.getWashesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const washes = await Wash.find(filter)
      .populate('washingPlace package feedback')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Wash.countDocuments(filter);

    res.json({
      success: true,
      data: {
        washes,
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

// PUT /api/washes/:id/status (Update wash status)
exports.updateWashStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'ready_for_pickup'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, in_progress, completed, cancelled, ready_for_pickup'
      });
    }

    const wash = await Wash.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    ).populate('washingPlace package');

    if (!wash) {
      return res.status(404).json({
        success: false,
        message: 'Wash not found'
      });
    }

    res.json({
      success: true,
      message: 'Wash status updated successfully',
      data: wash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT /api/washes/:id/cancel (Cancel wash)
exports.cancelWash = async (req, res) => {
  try {
    const wash = await Wash.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!wash) {
      return res.status(404).json({
        success: false,
        message: 'Wash not found'
      });
    }

    // Check if wash can be cancelled
    if (wash.status === 'completed' || wash.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Wash cannot be cancelled in its current status'
      });
    }

    wash.status = 'cancelled';
    wash.cancelledAt = new Date();
    await wash.save();

    await wash.populate('washingPlace package');

    res.json({
      success: true,
      message: 'Wash cancelled successfully',
      data: wash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 