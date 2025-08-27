const express = require("express");
const router = express.Router();

// ========================================
// TEST & HEALTH ROUTES
// ========================================

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "PayPass API is working! 🚀",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "running",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// MOCK DATA ROUTES (for testing)
// ========================================

router.get("/users", (req, res) => {
  try {
    const users = Array.from({ length: 20 }, (_, i) => ({
      _id: `user_${i + 1}`,
      name: `مستخدم ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `+9665${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      role: ["customer", "employee", "admin"][Math.floor(Math.random() * 3)],
      status: ["active", "inactive"][Math.floor(Math.random() * 2)],
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: { users },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock packages data
router.get("/packages", (req, res) => {
  try {
    const packages = [
      {
        _id: "package_1",
        name: "باقة أساسية",
        description: "غسيل أساسي للسيارة",
        price: 50,
        washes: 1,
        type: "basic",
        duration: "30 minutes",
        features: ["غسيل خارجي", "تجفيف", "تعطير"]
      },
      {
        _id: "package_2",
        name: "باقة متقدمة",
        description: "غسيل شامل للسيارة",
        price: 100,
        washes: 1,
        type: "premium",
        duration: "45 minutes",
        features: ["غسيل خارجي", "غسيل داخلي", "تجفيف", "تعطير", "تلميع"]
      },
      {
        _id: "package_3",
        name: "باقة VIP",
        description: "خدمة VIP شاملة",
        price: 200,
        washes: 1,
        type: "vip",
        duration: "60 minutes",
        features: ["غسيل خارجي", "غسيل داخلي", "تجفيف", "تعطير", "تلميع", "معالجة الشمع"]
      }
    ];

    res.json({
      success: true,
      message: "Packages retrieved successfully",
      data: { packages },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock branches data
router.get("/branches", (req, res) => {
  try {
    const branches = [
      {
        _id: "branch_1",
        name: "الفرع الرئيسي",
        address: "شارع الملك فهد، الرياض",
        city: "الرياض",
        phone: "+966501234567",
        latitude: 24.7136,
        longitude: 46.6753,
        workingHours: "8:00 AM - 10:00 PM",
        status: "active"
      },
      {
        _id: "branch_2",
        name: "فرع جدة",
        address: "شارع التحلية، جدة",
        city: "جدة",
        phone: "+966501234568",
        latitude: 21.4858,
        longitude: 39.1925,
        workingHours: "8:00 AM - 10:00 PM",
        status: "active"
      },
      {
        _id: "branch_3",
        name: "فرع الدمام",
        address: "شارع الملك خالد، الدمام",
        city: "الدمام",
        phone: "+966501234569",
        latitude: 26.4207,
        longitude: 50.0888,
        workingHours: "8:00 AM - 10:00 PM",
        status: "active"
      }
    ];

    res.json({
      success: true,
      message: "Branches retrieved successfully",
      data: { branches },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock orders data
router.get("/orders", (req, res) => {
  try {
    const orders = Array.from({ length: 10 }, (_, i) => ({
      _id: `order_${i + 1}`,
      orderNumber: `ORD${String(i + 1).padStart(4, "0")}`,
      customerName: `عميل ${i + 1}`,
      customerPhone: `+9665${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      packageName: `باقة ${Math.floor(Math.random() * 3) + 1}`,
      branchName: `فرع ${Math.floor(Math.random() * 3) + 1}`,
      totalAmount: Math.floor(Math.random() * 200) + 50,
      status: ["pending", "in_progress", "completed", "ready_for_pickup"][Math.floor(Math.random() * 4)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: { orders },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock payments data
router.get("/payments", (req, res) => {
  try {
    const payments = Array.from({ length: 10 }, (_, i) => ({
      _id: `payment_${i + 1}`,
      orderId: `order_${i + 1}`,
      amount: Math.floor(Math.random() * 200) + 50,
      method: ["cash", "card", "mobile"][Math.floor(Math.random() * 3)],
      status: ["pending", "completed", "failed"][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    res.json({
      success: true,
      message: "Payments retrieved successfully",
      data: { payments },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
