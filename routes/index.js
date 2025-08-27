const express = require("express");
const router = express.Router();

// ========================================
// ROUTE IMPORTS
// ========================================

// Import API routes
const apiRoutes = require("./api.js");

// Import test routes
const testRoutes = require("./test.js");

// ========================================
// ROUTE SETUP
// ========================================

// Root route with API documentation
router.get("/", (req, res) => {
  res.json({
    message: "PayPass API Root",
    version: "1.0.0",
    availableEndpoints: {
      test: ["/test", "/health"],
      api: {
        auth: "/api/user/*",
        packages: "/api/packages/*",
        washes: "/api/washes/*",
        payments: "/api/payments/*",
        cars: "/api/cars/*",
        feedbacks: "/api/feedbacks/*",
        washingPlaces: "/api/washing-places/*",
        userPackages: "/api/user-package/*",
        statistics: "/api/statistics/*",
        dashboard: "/api/dashboard/*",
        qr: "/api/qr/*",
        examples: "/api/examples/*",
      },
    },
    documentation: "API documentation available at /docs",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ROUTE MOUNTING
// ========================================

// Mount API routes
router.use("/api", apiRoutes);

// Mount test routes
router.use("/test", testRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler for undefined routes - use without path to catch all unmatched routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
