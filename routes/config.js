/**
 * Route Configuration and Constants
 * إعدادات وثوابت الراوتس
 */

// ========================================
// API CONFIGURATION
// ========================================

const API_CONFIG = {
  // API Version
  VERSION: '1.0.0',
  
  // Base URL
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  
  // API Prefix
  API_PREFIX: '/api',
  
  // Default pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
  LOGIN_RATE_LIMIT_MAX: 5, // login attempts per window
  
  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Cache settings
  CACHE_DURATION: 3600, // 1 hour
  
  // JWT settings
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 6,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  
  // Phone number format (Saudi Arabia)
  PHONE_REGEX: /^\+966[0-9]{9}$/,
  
  // Car plate format
  PLATE_REGEX: /^[A-Z]{3}-\d{3}$/,
  
  // VIN format
  VIN_REGEX: /^[A-HJ-NPR-Z0-9]{17}$/,
  
  // Email domains (optional whitelist)
  ALLOWED_EMAIL_DOMAINS: [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com'
  ]
};

// ========================================
// RESPONSE MESSAGES
// ========================================

const MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'تم الإنشاء بنجاح',
    UPDATED: 'تم التحديث بنجاح',
    DELETED: 'تم الحذف بنجاح',
    FETCHED: 'تم جلب البيانات بنجاح',
    LOGIN: 'تم تسجيل الدخول بنجاح',
    LOGOUT: 'تم تسجيل الخروج بنجاح',
    REGISTER: 'تم التسجيل بنجاح',
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
    EMAIL_SENT: 'تم إرسال البريد الإلكتروني بنجاح',
    SMS_SENT: 'تم إرسال الرسالة النصية بنجاح',
    FILE_UPLOADED: 'تم رفع الملف بنجاح',
    QR_GENERATED: 'تم إنشاء رمز QR بنجاح',
    PAYMENT_SUCCESS: 'تم الدفع بنجاح',
    ORDER_CREATED: 'تم إنشاء الطلب بنجاح',
    ORDER_UPDATED: 'تم تحديث الطلب بنجاح',
    ORDER_CANCELLED: 'تم إلغاء الطلب بنجاح'
  },
  
  // Error messages
  ERROR: {
    NOT_FOUND: 'العنصر غير موجود',
    UNAUTHORIZED: 'غير مصرح لك بالوصول',
    FORBIDDEN: 'ممنوع الوصول',
    VALIDATION_ERROR: 'بيانات غير صحيحة',
    SERVER_ERROR: 'خطأ في الخادم',
    DATABASE_ERROR: 'خطأ في قاعدة البيانات',
    NETWORK_ERROR: 'خطأ في الشبكة',
    TIMEOUT_ERROR: 'انتهت مهلة الطلب',
    RATE_LIMIT_EXCEEDED: 'تم تجاوز الحد الأقصى للطلبات',
    INVALID_TOKEN: 'توكن المصادقة غير صحيح',
    EXPIRED_TOKEN: 'انتهت صلاحية التوكن',
    INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
    EMAIL_EXISTS: 'البريد الإلكتروني مستخدم بالفعل',
    PHONE_EXISTS: 'رقم الهاتف مستخدم بالفعل',
    PASSWORD_MISMATCH: 'كلمة المرور غير متطابقة',
    FILE_TOO_LARGE: 'حجم الملف كبير جداً',
    INVALID_FILE_TYPE: 'نوع الملف غير مسموح به',
    PAYMENT_FAILED: 'فشل في الدفع',
    ORDER_NOT_FOUND: 'الطلب غير موجود',
    ORDER_CANNOT_CANCEL: 'لا يمكن إلغاء الطلب',
    BRANCH_NOT_FOUND: 'الفرع غير موجود',
    PACKAGE_NOT_FOUND: 'الباقة غير موجودة',
    CAR_NOT_FOUND: 'السيارة غير موجودة',
    USER_NOT_FOUND: 'المستخدم غير موجود'
  },
  
  // Validation messages
  VALIDATION: {
    REQUIRED: 'هذا الحقل مطلوب',
    EMAIL: 'البريد الإلكتروني غير صحيح',
    PHONE: 'رقم الهاتف غير صحيح',
    PASSWORD: 'كلمة المرور غير صحيحة',
    PASSWORD_LENGTH: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    PASSWORD_COMPLEXITY: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم',
    PASSWORD_MATCH: 'كلمة المرور غير متطابقة',
    NAME_LENGTH: 'الاسم يجب أن يكون بين 2 و 50 حرف',
    DESCRIPTION_LENGTH: 'الوصف يجب أن يكون بين 10 و 500 حرف',
    PRICE_POSITIVE: 'السعر يجب أن يكون رقم موجب',
    WASHES_POSITIVE: 'عدد الغسلات يجب أن يكون رقم صحيح موجب',
    PLATE_FORMAT: 'رقم اللوحة يجب أن يكون بصيغة ABC-123',
    VIN_FORMAT: 'VIN يجب أن يكون 17 حرف',
    RATING_RANGE: 'التقييم يجب أن يكون بين 1 و 5',
    COMMENT_LENGTH: 'التعليق يجب أن يكون بين 10 و 500 حرف',
    ADDRESS_LENGTH: 'العنوان يجب أن يكون بين 10 و 200 حرف',
    CITY_LENGTH: 'المدينة يجب أن تكون بين 2 و 50 حرف',
    LATITUDE_RANGE: 'خط العرض غير صحيح',
    LONGITUDE_RANGE: 'خط الطول غير صحيح',
    SEARCH_MIN_LENGTH: 'مصطلح البحث يجب أن يكون حرفين على الأقل',
    PAGE_POSITIVE: 'رقم الصفحة يجب أن يكون رقم موجب',
    LIMIT_RANGE: 'عدد العناصر يجب أن يكون بين 1 و 100'
  }
};

// ========================================
// STATUS CODES
// ========================================

const STATUS_CODES = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// ========================================
// ORDER STATUSES
// ========================================

const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  READY_FOR_PICKUP: 'ready_for_pickup',
  CANCELLED: 'cancelled'
};

// ========================================
// PAYMENT METHODS
// ========================================

const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile'
};

// ========================================
// PACKAGE TYPES
// ========================================

const PACKAGE_TYPES = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip'
};

// ========================================
// CAR TYPES
// ========================================

const CAR_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  TRUCK: 'truck',
  LUXURY: 'luxury'
};

// ========================================
// USER ROLES
// ========================================

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  STAFF: 'staff'
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  API_CONFIG,
  MESSAGES,
  STATUS_CODES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PACKAGE_TYPES,
  CAR_TYPES,
  USER_ROLES
};
