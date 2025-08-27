/**
 * Validation Rules and Middleware
 * قواعد التحقق والوسائط البرمجية
 */

const { body, param, query, validationResult } = require('express-validator');
const { sendValidationError } = require('./utils');

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

/**
 * Handle validation results
 * معالجة نتائج التحقق
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array(), "بيانات غير صحيحة");
  }
  next();
};

// ========================================
// USER VALIDATION RULES
// ========================================

const userValidation = {
  // Register validation
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صحيح'),
    
    body('phone')
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('رقم الهاتف يجب أن يكون بصيغة +966XXXXXXXXX'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
    
    handleValidation
  ],

  // Login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صحيح'),
    
    body('password')
      .notEmpty()
      .withMessage('كلمة المرور مطلوبة'),
    
    handleValidation
  ],

  // Update profile validation
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صحيح'),
    
    body('phone')
      .optional()
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('رقم الهاتف يجب أن يكون بصيغة +966XXXXXXXXX'),
    
    handleValidation
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('كلمة المرور الحالية مطلوبة'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('كلمة المرور الجديدة غير متطابقة');
        }
        return true;
      }),
    
    handleValidation
  ]
};

// ========================================
// PACKAGE VALIDATION RULES
// ========================================

const packageValidation = {
  // Create package validation
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم الباقة يجب أن يكون بين 2 و 100 حرف'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('وصف الباقة يجب أن يكون بين 10 و 500 حرف'),
    
    body('price')
      .isFloat({ min: 0 })
      .withMessage('السعر يجب أن يكون رقم موجب'),
    
    body('washes')
      .isInt({ min: 1 })
      .withMessage('عدد الغسلات يجب أن يكون رقم صحيح موجب'),
    
    body('type')
      .isIn(['basic', 'premium', 'vip'])
      .withMessage('نوع الباقة يجب أن يكون basic أو premium أو vip'),
    
    handleValidation
  ],

  // Update package validation
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم الباقة يجب أن يكون بين 2 و 100 حرف'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('وصف الباقة يجب أن يكون بين 10 و 500 حرف'),
    
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('السعر يجب أن يكون رقم موجب'),
    
    body('washes')
      .optional()
      .isInt({ min: 1 })
      .withMessage('عدد الغسلات يجب أن يكون رقم صحيح موجب'),
    
    handleValidation
  ]
};

// ========================================
// WASH ORDER VALIDATION RULES
// ========================================

const washValidation = {
  // Create wash order validation
  create: [
    body('packageId')
      .isMongoId()
      .withMessage('معرف الباقة غير صحيح'),
    
    body('branchId')
      .isMongoId()
      .withMessage('معرف الفرع غير صحيح'),
    
    body('carType')
      .isIn(['sedan', 'suv', 'truck', 'luxury'])
      .withMessage('نوع السيارة غير صحيح'),
    
    body('carColor')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('لون السيارة يجب أن يكون بين 2 و 20 حرف'),
    
    body('carPlate')
      .matches(/^[A-Z]{3}-\d{3}$/)
      .withMessage('رقم اللوحة يجب أن يكون بصيغة ABC-123'),
    
    body('specialInstructions')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('التعليمات الخاصة يجب أن تكون أقل من 500 حرف'),
    
    handleValidation
  ],

  // Update wash status validation
  updateStatus: [
    body('status')
      .isIn(['pending', 'in_progress', 'completed', 'ready_for_pickup', 'cancelled'])
      .withMessage('حالة الطلب غير صحيحة'),
    
    handleValidation
  ]
};

// ========================================
// PAYMENT VALIDATION RULES
// ========================================

const paymentValidation = {
  // Create payment validation
  create: [
    body('orderId')
      .isMongoId()
      .withMessage('معرف الطلب غير صحيح'),
    
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('المبلغ يجب أن يكون رقم موجب'),
    
    body('method')
      .isIn(['cash', 'card', 'mobile'])
      .withMessage('طريقة الدفع غير صحيحة'),
    
    body('cardNumber')
      .optional()
      .matches(/^[0-9]{16}$/)
      .withMessage('رقم البطاقة يجب أن يكون 16 رقم'),
    
    body('expiryMonth')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('شهر انتهاء الصلاحية يجب أن يكون بين 1 و 12'),
    
    body('expiryYear')
      .optional()
      .isInt({ min: new Date().getFullYear() })
      .withMessage('سنة انتهاء الصلاحية يجب أن تكون في المستقبل'),
    
    body('cvv')
      .optional()
      .matches(/^[0-9]{3,4}$/)
      .withMessage('CVV يجب أن يكون 3 أو 4 أرقام'),
    
    handleValidation
  ]
};

// ========================================
// CAR VALIDATION RULES
// ========================================

const carValidation = {
  // Add car validation
  add: [
    body('brand')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('الماركة يجب أن تكون بين 2 و 50 حرف'),
    
    body('model')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('الموديل يجب أن يكون بين 2 و 50 حرف'),
    
    body('year')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('سنة الصنع غير صحيحة'),
    
    body('color')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('اللون يجب أن يكون بين 2 و 20 حرف'),
    
    body('plateNumber')
      .matches(/^[A-Z]{3}-\d{3}$/)
      .withMessage('رقم اللوحة يجب أن يكون بصيغة ABC-123'),
    
    body('vin')
      .optional()
      .matches(/^[A-HJ-NPR-Z0-9]{17}$/)
      .withMessage('VIN يجب أن يكون 17 حرف'),
    
    handleValidation
  ]
};

// ========================================
// FEEDBACK VALIDATION RULES
// ========================================

const feedbackValidation = {
  // Create feedback validation
  create: [
    body('orderId')
      .isMongoId()
      .withMessage('معرف الطلب غير صحيح'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('التقييم يجب أن يكون بين 1 و 5'),
    
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('التعليق يجب أن يكون بين 10 و 500 حرف'),
    
    body('branchId')
      .isMongoId()
      .withMessage('معرف الفرع غير صحيح'),
    
    handleValidation
  ]
};

// ========================================
// BRANCH VALIDATION RULES
// ========================================

const branchValidation = {
  // Create branch validation
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم الفرع يجب أن يكون بين 2 و 100 حرف'),
    
    body('address')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('العنوان يجب أن يكون بين 10 و 200 حرف'),
    
    body('city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('المدينة يجب أن تكون بين 2 و 50 حرف'),
    
    body('phone')
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('رقم الهاتف يجب أن يكون بصيغة +966XXXXXXXXX'),
    
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('خط العرض غير صحيح'),
    
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('خط الطول غير صحيح'),
    
    handleValidation
  ]
};

// ========================================
// PARAMETER VALIDATION RULES
// ========================================

const paramValidation = {
  // Object ID validation
  objectId: (paramName) => [
    param(paramName)
      .isMongoId()
      .withMessage(`معرف ${paramName} غير صحيح`),
    handleValidation
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('عدد العناصر يجب أن يكون بين 1 و 100'),
    
    handleValidation
  ],

  // Search validation
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('مصطلح البحث يجب أن يكون حرفين على الأقل'),
    
    handleValidation
  ]
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  handleValidation,
  userValidation,
  packageValidation,
  washValidation,
  paymentValidation,
  carValidation,
  feedbackValidation,
  branchValidation,
  paramValidation
};
