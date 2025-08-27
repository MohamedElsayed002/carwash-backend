const express = require("express");
const router = express.Router();

// ========================================
// API ROUTES
// ========================================

// API Root route
router.get("/", (req, res) => {
  res.json({
    message: "PayPass API",
    version: "1.0.0",
    status: "running",
    availableEndpoints: {
      users: "/api/users",
      packages: "/api/packages",
      washes: "/api/washes",
      payments: "/api/payments",
      hyperpay: "/api/hyperpay",
      cars: "/api/cars",
      feedbacks: "/api/feedbacks",
      washingPlaces: "/api/washing-places",
      userPackages: "/api/user-packages",
      statistics: "/api/statistics",
      dashboard: "/api/dashboard",
      notifications: "/api/notifications",
      reports: "/api/reports",
      operations: "/api/operations",
      tracking: "/api/tracking",
      employees: "/api/employees",
      loyalty: "/api/loyalty",
      content: "/api/content"
    },
    timestamp: new Date().toISOString()
  });
});

// User Management Routes
router.use("/user", require("../modules/user/user.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/users", require("../modules/user/user.routes.js")); // Frontend expects /users
router.use("/auth", require("../modules/user/user.routes.js")); // Dashboard expects /auth

// Package Management Routes
router.use("/packages", require("../modules/package/package.routes.js"));
router.use("/user-package", require("../modules/package/userPackage.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/user-packages", require("../modules/package/userPackage.routes.js")); // Frontend expects /user-packages

// Washing Places Routes
router.use("/washing-places", require("../modules/washingPlace/washingPlace.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/branches", require("../modules/washingPlace/washingPlace.routes.js")); // Dashboard expects /branches

// Wash Orders Routes
router.use("/washes", require("../modules/wash/wash.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/orders", require("../modules/wash/wash.routes.js")); // Dashboard expects /orders

// Payment Routes
router.use("/payments", require("../modules/payment/payment.routes.js"));

// HyperPay Payment Routes
router.use("/hyperpay", require("../routes/hyperpay.routes.js"));

// Car Management Routes
router.use("/cars", require("../modules/car/car.routes.js"));

// Feedback Routes
router.use("/feedbacks", require("../modules/feedback/feedback.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/reviews", require("../modules/feedback/feedback.routes.js")); // Frontend expects /reviews

// Notifications Routes
router.use("/notifications", require("../modules/notification/notification.routes.js"));

// Statistics Routes
router.use("/statistics", require("../modules/statistics/statistics.routes.js"));

// Route aliases for Postman collections compatibility
router.use("/stats", require("../modules/statistics/statistics.routes.js")); // Dashboard expects /stats

// Reports Routes
router.use("/reports", require("../modules/reports/reports.routes.js"));

// Dashboard Routes
router.use("/dashboard", require("../modules/dashboard/dashboard.routes.js"));

// Operations Management Routes
router.use("/operations", require("../modules/operations/operations.routes.js"));

// Live Tracking Routes
router.use("/tracking", require("../modules/tracking/tracking.routes.js"));

// Employee Management Routes
router.use("/employees", require("../modules/employee/employee.routes.js"));

// Loyalty Management Routes
router.use("/loyalty", require("../modules/loyalty/loyalty.routes.js"));

// Content Management Routes
router.use("/content", require("../modules/content/content.routes.js"));

// Example Routes (for demonstration)
router.use("/examples", require("./example.js"));

// ========================================
// QR SYSTEM ROUTES
// ========================================

// QR Code routes
router.post("/qr/generate", (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Data is required" });
    }

    // Generate QR code
    const qrCode = `QR_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    res.json({
      success: true,
      message: "QR code generated successfully",
      data: {
        qrCode,
        originalData: data,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/qr/scan", (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ error: "QR data is required" });
    }

    res.json({
      success: true,
      message: "QR code scanned successfully",
      data: {
        scannedData: qrData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/qr/validate", (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ error: "QR code is required" });
    }

    // Validate QR code
    const isValid = qrCode.startsWith("QR_");

    res.json({
      success: true,
      message: isValid ? "QR code is valid" : "QR code is invalid",
      data: {
        isValid,
        qrCode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/qr/status/:orderId", (req, res) => {
  try {
    const { orderId } = req.params;

    res.json({
      success: true,
      message: "QR status retrieved successfully",
      data: {
        orderId,
        status: "active",
        qrCode: `QR_${orderId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/qr/use", (req, res) => {
  try {
    const { operationId, branchId } = req.body;
    if (!operationId || !branchId) {
      return res
        .status(400)
        .json({ error: "Operation ID and Branch ID are required" });
    }

    res.json({
      success: true,
      message: "QR code used successfully",
      data: {
        operationId,
        branchId,
        status: "completed",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// HEALTH CHECK ROUTES
// ========================================

router.get("/health", (req, res) => {
  try {
    res.json({
      success: true,
      message: "Server is healthy",
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// DASHBOARD ROUTES
// ========================================

router.get("/dashboard/stats", (req, res) => {
  try {
    // Mock data for dashboard stats
    const stats = {
      totalUsers: 1250,
      totalOrders: 3456,
      totalRevenue: 125000,
      activeOrders: 45,
      totalBranches: 8,
      totalPackages: 12,
      averageRating: 4.5,
      todayOrders: 23,
    };

    res.json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard/recent-orders", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Mock recent orders data
    const recentOrders = Array.from({ length: limit }, (_, i) => ({
      _id: `order_${i + 1}`,
      orderNumber: `ORD${String(i + 1).padStart(4, "0")}`,
      customerName: `عميل ${i + 1}`,
      customerPhone: `+9665${String(
        Math.floor(Math.random() * 90000000) + 10000000
      )}`,
      customerAvatar: `https://via.placeholder.com/40`,
      branchName: `فرع ${Math.floor(Math.random() * 5) + 1}`,
      packageName: `باقة ${Math.floor(Math.random() * 3) + 1}`,
      totalAmount: Math.floor(Math.random() * 200) + 50,
      status: ["pending", "in_progress", "completed", "ready_for_pickup"][
        Math.floor(Math.random() * 4)
      ],
      createdAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    res.json({
      success: true,
      message: "Recent orders retrieved successfully",
      data: { orders: recentOrders },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard/live-tracking", (req, res) => {
  try {
    // Mock live tracking data
    const liveOrders = Array.from({ length: 8 }, (_, i) => ({
      _id: `live_order_${i + 1}`,
      orderNumber: `LIVE${String(i + 1).padStart(4, "0")}`,
      customerName: `عميل مباشر ${i + 1}`,
      customerPhone: `+9665${String(
        Math.floor(Math.random() * 90000000) + 10000000
      )}`,
      branchName: `فرع ${Math.floor(Math.random() * 5) + 1}`,
      packageName: `باقة ${Math.floor(Math.random() * 3) + 1}`,
      totalAmount: Math.floor(Math.random() * 200) + 50,
      status: ["pending", "in_progress", "ready_for_pickup"][
        Math.floor(Math.random() * 3)
      ],
      createdAt: new Date(
        Date.now() - Math.random() * 2 * 60 * 60 * 1000
      ).toISOString(),
    }));

    res.json({
      success: true,
      message: "Live tracking data retrieved successfully",
      data: { orders: liveOrders },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard/branch-performance", (req, res) => {
  try {
    // Mock branch performance data
    const branchPerformance = [
      {
        branchId: "branch_1",
        branchName: "الفرع الرئيسي",
        city: "الرياض",
        totalOrders: 150,
        completedOrders: 145,
        revenue: 25000,
        growth: 12.5,
      },
      {
        branchId: "branch_2",
        branchName: "فرع جدة",
        city: "جدة",
        totalOrders: 120,
        completedOrders: 118,
        revenue: 20000,
        growth: 8.3,
      },
      {
        branchId: "branch_3",
        branchName: "فرع الدمام",
        city: "الدمام",
        totalOrders: 95,
        completedOrders: 92,
        revenue: 16000,
        growth: 15.2,
      },
    ];

    res.json({
      success: true,
      message: "Branch performance data retrieved successfully",
      data: { branches: branchPerformance },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard/revenue", (req, res) => {
  try {
    const period = req.query.period || "month";

    // Mock revenue analytics data
    const revenueData = {
      daily: {
        labels: [
          "السبت",
          "الأحد",
          "الاثنين",
          "الثلاثاء",
          "الأربعاء",
          "الخميس",
          "الجمعة",
        ],
        data: [1200, 1500, 1800, 1600, 2000, 2200, 1900],
      },
      weekly: {
        labels: ["الأسبوع 1", "الأسبوع 2", "الأسبوع 3", "الأسبوع 4"],
        data: [8500, 9200, 8800, 9500],
      },
      monthly: {
        labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
        data: [35000, 38000, 42000, 45000, 48000, 52000],
      },
    };

    res.json({
      success: true,
      message: "Revenue analytics retrieved successfully",
      data: revenueData[period] || revenueData.monthly,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
