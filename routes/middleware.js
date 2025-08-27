/**
 * Common Middleware Functions
 * دوال الوسائط البرمجية المشتركة
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('./utils');

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Verify JWT token middleware
 * التحقق من توكن JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return sendError(res, 'توكن المصادقة مطلوب', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'توكن المصادقة غير صحيح', 403);
  }
};

/**
 * Optional authentication middleware
 * مصادقة اختيارية
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we continue without user
      req.user = null;
    }
  }

  next();
};

/**
 * Role-based authorization middleware
 * تفويض قائم على الدور
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'المصادقة مطلوبة', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'غير مصرح لك بالوصول', 403);
    }

    next();
  };
};

/**
 * Admin authorization middleware
 * تفويض المدير
 */
const authorizeAdmin = (req, res, next) => {
  return authorizeRole('admin')(req, res, next);
};

/**
 * User authorization middleware
 * تفويض المستخدم
 */
const authorizeUser = (req, res, next) => {
  return authorizeRole('user', 'admin')(req, res, next);
};

// ========================================
// RATE LIMITING MIDDLEWARE
// ========================================

/**
 * Simple rate limiting middleware
 * تحديد معدل الطلبات البسيط
 */
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= max) {
      return sendError(res, 'تم تجاوز الحد الأقصى للطلبات', 429);
    }

    userRequests.push(now);
    next();
  };
};

/**
 * Login rate limiting
 * تحديد معدل تسجيل الدخول
 */
const loginRateLimit = rateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

/**
 * API rate limiting
 * تحديد معدل API
 */
const apiRateLimit = rateLimit(60 * 1000, 100); // 100 requests per minute

// ========================================
// REQUEST LOGGING MIDDLEWARE
// ========================================

/**
 * Request logging middleware
 * تسجيل الطلبات
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    console.log(`[${log.timestamp}] ${log.method} ${log.url} ${log.status} ${log.duration}`);
  });

  next();
};

/**
 * Error logging middleware
 * تسجيل الأخطاء
 */
const errorLogger = (err, req, res, next) => {
  const log = {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  console.error('Error:', log);
  next(err);
};

// ========================================
// CORS MIDDLEWARE
// ========================================

/**
 * CORS middleware
 * وسيط CORS
 */
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// ========================================
// REQUEST PARSING MIDDLEWARE
// ========================================

/**
 * Parse JSON with size limit
 * تحليل JSON مع حد الحجم
 */
const parseJSON = (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
      
      // Limit request body size to 10MB
      if (data.length > 10 * 1024 * 1024) {
        return sendError(res, 'حجم الطلب كبير جداً', 413);
      }
    });

    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (error) {
        return sendError(res, 'بيانات JSON غير صحيحة', 400);
      }
    });
  } else {
    next();
  }
};

// ========================================
// SECURITY MIDDLEWARE
// ========================================

/**
 * Security headers middleware
 * رؤوس الأمان
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

/**
 * Input sanitization middleware
 * تنظيف المدخلات
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

// ========================================
// CACHE CONTROL MIDDLEWARE
// ========================================

/**
 * Cache control middleware
 * التحكم في التخزين المؤقت
 */
const cacheControl = (maxAge = 3600) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

/**
 * No cache middleware
 * بدون تخزين مؤقت
 */
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// ========================================
// FILE UPLOAD MIDDLEWARE
// ========================================

/**
 * File upload validation middleware
 * التحقق من رفع الملفات
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return sendError(res, 'لم يتم رفع أي ملف', 400);
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return sendError(res, 'نوع الملف غير مسموح به', 400);
    }

    if (req.file.size > maxSize) {
      return sendError(res, 'حجم الملف كبير جداً', 400);
    }

    next();
  };
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Authentication
  authenticateToken,
  optionalAuth,
  authorizeRole,
  authorizeAdmin,
  authorizeUser,

  // Rate limiting
  rateLimit,
  loginRateLimit,
  apiRateLimit,

  // Logging
  requestLogger,
  errorLogger,

  // CORS
  corsMiddleware,

  // Request parsing
  parseJSON,

  // Security
  securityHeaders,
  sanitizeInput,

  // Cache control
  cacheControl,
  noCache,

  // File upload
  validateFileUpload
};
