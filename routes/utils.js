/**
 * Route Utilities and Helpers
 * أدوات ومساعدات الراوتس
 */

const express = require('express');
const { MESSAGES, STATUS_CODES } = require('./config');

// ========================================
// RESPONSE HELPERS
// ========================================

/**
 * Send success response
 * إرسال استجابة نجاح
 */
const sendSuccess = (res, data, message = MESSAGES.SUCCESS.FETCHED, statusCode = STATUS_CODES.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send error response
 * إرسال استجابة خطأ
 */
const sendError = (res, error, message = MESSAGES.ERROR.SERVER_ERROR, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error.message || error,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send validation error response
 * إرسال استجابة خطأ في التحقق
 */
const sendValidationError = (res, errors, message = MESSAGES.ERROR.VALIDATION_ERROR) => {
  return res.status(STATUS_CODES.BAD_REQUEST).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

// ========================================
// MIDDLEWARE HELPERS
// ========================================

/**
 * Async error handler middleware
 * معالج أخطاء للدوال غير المتزامنة
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate required fields
 * التحقق من الحقول المطلوبة
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    fields.forEach(field => {
      if (!req.body[field]) {
        missing.push(field);
      }
    });
    
    if (missing.length > 0) {
      return sendValidationError(res, missing, `الحقول المطلوبة: ${missing.join(', ')}`);
    }
    
    next();
  };
};

/**
 * Validate object ID
 * التحقق من صحة معرف الكائن
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      return sendError(res, `معرف غير صحيح: ${paramName}`, "معرف غير صحيح", 400);
    }
    
    next();
  };
};

// ========================================
// PAGINATION HELPERS
// ========================================

/**
 * Get pagination parameters from request
 * الحصول على معاملات الصفحات من الطلب
 */
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Create pagination response
 * إنشاء استجابة الصفحات
 */
const createPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// ========================================
// FILTERING HELPERS
// ========================================

/**
 * Create filter object from query parameters
 * إنشاء كائن فلتر من معاملات الاستعلام
 */
const createFilter = (req, allowedFields) => {
  const filter = {};
  
  allowedFields.forEach(field => {
    if (req.query[field]) {
      filter[field] = req.query[field];
    }
  });
  
  return filter;
};

/**
 * Create sort object from query parameters
 * إنشاء كائن ترتيب من معاملات الاستعلام
 */
const createSort = (req, defaultSort = { createdAt: -1 }) => {
  const sort = {};
  
  if (req.query.sortBy && req.query.sortOrder) {
    sort[req.query.sortBy] = req.query.sortOrder === 'asc' ? 1 : -1;
  } else {
    Object.assign(sort, defaultSort);
  }
  
  return sort;
};

// ========================================
// SEARCH HELPERS
// ========================================

/**
 * Create search filter
 * إنشاء فلتر البحث
 */
const createSearchFilter = (searchTerm, searchFields) => {
  if (!searchTerm) return {};
  
  const searchFilter = {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
  
  return searchFilter;
};

// ========================================
// DATE HELPERS
// ========================================

/**
 * Create date range filter
 * إنشاء فلتر نطاق التاريخ
 */
const createDateRangeFilter = (req, dateField = 'createdAt') => {
  const filter = {};
  
  if (req.query.startDate) {
    filter[dateField] = { $gte: new Date(req.query.startDate) };
  }
  
  if (req.query.endDate) {
    filter[dateField] = { 
      ...filter[dateField], 
      $lte: new Date(req.query.endDate) 
    };
  }
  
  return Object.keys(filter).length > 0 ? filter : {};
};

// ========================================
// EXPORT HELPERS
// ========================================

/**
 * Export data to different formats
 * تصدير البيانات بصيغ مختلفة
 */
const exportData = (data, format = 'json') => {
  switch (format.toLowerCase()) {
    case 'csv':
      return convertToCSV(data);
    case 'excel':
      return convertToExcel(data);
    default:
      return data;
  }
};

/**
 * Convert data to CSV format
 * تحويل البيانات إلى صيغة CSV
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Convert data to Excel format (placeholder)
 * تحويل البيانات إلى صيغة Excel (مؤقت)
 */
const convertToExcel = (data) => {
  // Placeholder for Excel conversion
  return data;
};

// ========================================
// LOGGING HELPERS
// ========================================

/**
 * Log API request
 * تسجيل طلب API
 */
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

/**
 * Log API response
 * تسجيل استجابة API
 */
const logResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode}`);
    originalSend.call(this, data);
  };
  
  next();
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Response helpers
  sendSuccess,
  sendError,
  sendValidationError,
  
  // Middleware helpers
  asyncHandler,
  validateRequired,
  validateObjectId,
  
  // Pagination helpers
  getPaginationParams,
  createPaginationResponse,
  
  // Filtering helpers
  createFilter,
  createSort,
  
  // Search helpers
  createSearchFilter,
  
  // Date helpers
  createDateRangeFilter,
  
  // Export helpers
  exportData,
  convertToCSV,
  convertToExcel,
  
  // Logging helpers
  logRequest,
  logResponse
};
