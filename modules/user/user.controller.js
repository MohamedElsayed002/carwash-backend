const User = require("./user.model");
const jwt = require("jsonwebtoken");
const UserPackage = require("../package/userPackage.model");
const Package = require("../package/package.model");
const crypto = require("crypto");
const { generateOTP, isOTPValid } = require("../../services/otp");
const { sendNotification } = require("../../services/notification");
const QRCode = require('qrcode');
let admin = null;
try {
  admin = require("../../config/firebase");
} catch (error) {
  console.log('⚠️ Firebase not available for user authentication');
}
require("dotenv").config();
exports.register = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    const jwtSecret = process.env.JWT_SECRET || "mySecretKey";
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });
    const userData = user.toObject();
    delete userData.password;
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveUserPackages = async (req, res) => {
  try {
    const userPackages = await UserPackage.find({
      user: req.user._id,
      status: "active",
      expiry: { $gt: new Date() },
    }).populate("package");
    res.json(userPackages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateReferralLink = async (req, res) => {
  try {
    if (!req.user.referralCode) {
      req.user.referralCode = crypto.randomBytes(6).toString("hex");
      await req.user.save();
    }
    const link = `${process.env.APP_URL || "http://localhost:3000"
      }/register?ref=${req.user.referralCode}`;
    res.json({ referralLink: link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const inviter = await User.findOne({ referralCode });
    if (!inviter)
      return res.status(400).json({ error: "Invalid referral code" });
    req.user.referredBy = inviter._id;
    await req.user.save();
    await Referral.create({
      inviter: inviter._id,
      invitee: req.user._id,
      status: "pending",
    });
    res.json({ message: "Referral accepted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.rewardReferral = async (req, res) => {
  try {
    const { inviteeId } = req.body;
    const referral = await Referral.findOne({
      invitee: inviteeId,
      status: "pending",
    });
    if (!referral)
      return res
        .status(400)
        .json({ error: "Referral not found or already rewarded" });
    referral.status = "rewarded";
    referral.rewardGiven = true;
    await referral.save();
    // TODO: Add logic to give inviter a free wash (e.g., add to UserPackage)
    res.json({ message: "Referral reward granted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });
    const otp = generateOTP();
    req.user.otp = otp;
    req.user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await req.user.save();
    await sendNotification({
      user: req.user._id,
      type: "otp",
      message: `Your OTP code is: ${otp}`,
      phone,
    });
    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: "OTP required" });
    if (!req.user.otp || !req.user.otpExpires)
      return res.status(400).json({ error: "No OTP set" });
    if (!isOTPValid(req.user, otp))
      return res.status(400).json({ error: "Invalid or expired OTP" });
    // Clear OTP fields
    req.user.otp = undefined;
    req.user.otpExpires = undefined;
    await req.user.save();
    res.json({ message: "OTP verified successfully (demo mode)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReferralStatus = async (req, res) => {
  try {
    // Referrals where user is inviter (sent invites)
    const sent = await Referral.find({ inviter: req.user._id }).populate(
      "invitee",
      "name email"
    );
    // Referrals where user is invitee (was invited)
    const received = await Referral.find({ invitee: req.user._id }).populate(
      "inviter",
      "name email"
    );
    res.json({ sent, received });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /users/phone-login-initiate
exports.phoneLoginInitiate = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  const user = await User.findOne({ phone });
  if (user) {
    return res.json({ exists: true });
  }
  return res.status(404).json({ exists: false, message: "User not found" });
};

// POST /users/phone-login-verify
exports.phoneLoginVerify = async (req, res) => {
  const { phone, firebaseIdToken } = req.body;
  if (!phone || !firebaseIdToken)
    return res
      .status(400)
      .json({ error: "Phone and firebaseIdToken required" });

  if (!admin) {
    return res.status(503).json({ error: "Firebase authentication not available" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    if (decoded.phone_number !== phone) {
      return res.status(400).json({ error: "Phone number mismatch" });
    }
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const userData = user.toObject();
    delete userData.password;
    return res.json({ token, user: userData });
  } catch (err) {
    return res.status(401).json({ error: "Invalid OTP or token" });
  }
};

// POST /users/phone-signup-initiate
exports.phoneSignupInitiate = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  const user = await User.findOne({ phone });
  if (user) {
    return res
      .status(409)
      .json({ canRegister: false, message: "Phone already registered" });
  }
  return res.json({ canRegister: true });
};

// POST /users/phone-signup-verify
exports.phoneSignupVerify = async (req, res) => {
  const { phone, firebaseIdToken, name, email, password, username } = req.body;
  if (!phone || !firebaseIdToken || !name || !email || !password || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!admin) {
    return res.status(503).json({ error: "Firebase authentication not available" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    if (decoded.phone_number !== phone) {
      return res.status(400).json({ error: "Phone number mismatch" });
    }
    let user = await User.findOne({ phone });
    if (user) return res.status(409).json({ error: "User already exists" });
    user = new User({ phone, name, email, password, username });
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const userData = user.toObject();
    delete userData.password;
    return res.json({ token, user: userData });
  } catch (err) {
    return res.status(401).json({ error: "Invalid OTP or token" });
  }
};

// ========================================
// MISSING AUTHENTICATION ENDPOINTS
// ========================================

// POST /api/user/logout
exports.logout = async (req, res) => {
  try {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Remove refresh tokens
    // 3. Update user's last logout time

    // For now, we'll just return a success response
    // The client should remove the token from storage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT /api/user/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/user/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In a real implementation, send email with reset link
    // For now, we'll just return the token (in production, send via email)
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    console.log('Reset link:', resetLink);

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production - only for development
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/user/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ========================================

// GET /api/users (Admin - get all users)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
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

// GET /api/users/:id (Admin - get user by ID)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/users (Admin - create user)
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, username, role = 'user' } = req.body;

    if (!name || !email || !phone || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, password, and username are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email, phone, or username already exists'
      });
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      username,
      role
    });

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT /api/users/:id (Admin - update user)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, username, role } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (username) updateData.username = username;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE /api/users/:id (Admin - delete user)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/users/:id/add-package (Add package to user)
exports.addPackageToUser = async (req, res) => {
  try {
    const { packageData } = req.body;

    if (!packageData) {
      return res.status(400).json({
        success: false,
        message: 'Package data is required'
      });
    }

    // Validate required fields
    if (!packageData.name || !packageData.basePrice || !packageData.size) {
      return res.status(400).json({
        success: false,
        message: 'Package name, basePrice, and size are required'
      });
    }

    // Validate size
    if (!['small', 'medium', 'large'].includes(packageData.size)) {
      return res.status(400).json({
        success: false,
        message: 'Size must be small, medium, or large'
      });
    }

    // Update user with the complete package data
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { package: packageData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Package added to user successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/user/add-package (Add package to current user)
exports.addPackageToCurrentUser = async (req, res) => {
  try {
    const { packageData } = req.body;

    if (!packageData) {
      return res.status(400).json({
        success: false,
        message: 'Package data is required'
      });
    }

    // Validate required fields
    if (!packageData.name || !packageData.basePrice || !packageData.size) {
      return res.status(400).json({
        success: false,
        message: 'Package name, basePrice, paidWashes, and size are required'
      });
    }

    // Validate size
    if (!['small', 'medium', 'large'].includes(packageData.size)) {
      return res.status(400).json({
        success: false,
        message: 'Size must be small, medium, or large'
      });
    }

    // Update current user with the complete package data
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { package: packageData },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Package added to your profile successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE /api/user/remove-package (Remove package from current user)
exports.removePackageFromCurrentUser = async (req, res) => {
  try {
    // Remove package from current user by setting it to null
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { package: null },
      { new: true }
    ).select('-password');

    // Create a clean response object without the package field if it's null
    const userData = user.toObject();
    if (!userData.package || Object.keys(userData.package).length === 0) {
      delete userData.package;
    }

    res.json({
      success: true,
      message: 'Package removed from your profile successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



// GET /api/user/package-with-price (Get user's package)
exports.getUserPackageWithPrice = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');

    if (!user || !user.package) {
      return res.json({
        success: true,
        data: {
          hasPackage: false,
          package: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasPackage: true,
        package: user.package
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/user/available-packages (Get all available packages)
exports.getAvailablePackages = async (req, res) => {
  try {
    // Get all packages from database
    const packages = await Package.find({}).lean();

    res.json({
      success: true,
      data: {
        packages: packages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/user/package-qr-code (Generate QR code for user's package)
exports.generatePackageQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user || !user.package) {
      return res.status(404).json({
        success: false,
        message: 'No package found for this user'
      });
    }

    // Create QR code data
    const qrData = {
      userId: user._id.toString(),
      userName: user.name,
      packageId: user.package._id,
      packageName: user.package.name,
      washesLeft: user.package.washes,
      size: user.package.size,
      timestamp: new Date().toISOString(),
      type: 'car_wash_package'
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        packageInfo: {
          userName: user.name,
          packageName: user.package.name,
          washesLeft: user.package.washes,
          size: user.package.size,
          basePrice: user.package.basePrice
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

// POST /api/user/use-wash (Use one wash from package)
exports.useWash = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.package) {
      return res.status(404).json({
        success: false,
        message: 'No package found for this user'
      });
    }

    if (user.package.washes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No washes left in your package'
      });
    }

    // Decrement washes
    user.package.washes -= 1;

    // Update paidWashes and freeWashes accordingly
    if (user.package.paidWashes > 0) {
      user.package.paidWashes -= 1;
    } else if (user.package.freeWashes > 0) {
      user.package.freeWashes -= 1;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Wash used successfully',
      data: {
        washesLeft: user.package.washes,
        paidWashesLeft: user.package.paidWashes,
        freeWashesLeft: user.package.freeWashes,
        packageName: user.package.name,
        userName: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/user/scan-qr-code (Scan QR code and use wash - for staff/admin)
exports.scanQRCode = async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    console.log(qrCodeData)
    if (!qrCodeData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    let parsedData = qrCodeData;
    // try {
    //   parsedData = JSON.parse(qrCodeData);
    //   console.log(parsedData)
    // } catch (error) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid QR code data'
    //   });
    // }

    // Validate QR code data
    if (!parsedData.userId || !parsedData.type || parsedData.type !== 'car_wash_package') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Find user by ID
    const user = await User.findById(parsedData.userId);

    if (!user || !user.package) {
      return res.status(404).json({
        success: false,
        message: 'User or package not found'
      });
    }

    // Verify package matches
    if (user.package._id.toString() !== parsedData.packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package mismatch'
      });
    }

    if (user.package.washes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No washes left in this package'
      });
    }

    // Decrement washes
    user.package.washes -= 1;

    // Update paidWashes and freeWashes accordingly
    if (user.package.paidWashes > 0) {
      user.package.paidWashes -= 1;
    } else if (user.package.freeWashes > 0) {
      user.package.freeWashes -= 1;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Wash used successfully',
      data: {
        userName: user.name,
        packageName: user.package.name,
        washesLeft: user.package.washes,
        paidWashesLeft: user.package.paidWashes,
        freeWashesLeft: user.package.freeWashes,
        size: user.package.size,
        scanTime: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/user/package-status (Get detailed package status)
exports.getPackageStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user || !user.package) {
      return res.json({
        success: true,
        data: {
          hasPackage: false,
          package: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasPackage: true,
        package: {
          name: user.package.name,
          washesLeft: user.package.washes,
          paidWashesLeft: user.package.paidWashes,
          freeWashesLeft: user.package.freeWashes,
          size: user.package.size,
          basePrice: user.package.basePrice,
          originalPrice: user.package.originalPrice,
          savings: user.package.savings,
          features: user.package.features,
          duration: user.package.duration,
          popular: user.package.popular
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


