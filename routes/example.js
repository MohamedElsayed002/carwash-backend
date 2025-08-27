/**
 * Example Routes - Demonstrating the new route structure
 * راوتس المثال - توضيح البنية الجديدة للراوتس
 */

const express = require('express');
const router = express.Router();
const { 
  sendSuccess, 
  sendError, 
  asyncHandler, 
  validateRequired,
  getPaginationParams,
  createPaginationResponse 
} = require('./utils');

// ========================================
// EXAMPLE ROUTES
// ========================================

/**
 * GET /example
 * Get all examples with pagination
 * جلب جميع الأمثلة مع الصفحات
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams(req);
    
    // Mock data - replace with actual database query
    const examples = Array.from({ length: limit }, (_, i) => ({
      _id: `example_${skip + i + 1}`,
      name: `مثال ${skip + i + 1}`,
      description: `وصف المثال ${skip + i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const total = 100; // Mock total count
    
    // Create paginated response
    const response = createPaginationResponse(examples, page, limit, total);
    
    return sendSuccess(res, response, "تم جلب الأمثلة بنجاح");
  } catch (error) {
    return sendError(res, error, "فشل في جلب الأمثلة");
  }
}));

/**
 * GET /example/:id
 * Get example by ID
 * جلب مثال بواسطة المعرف
 */
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const example = {
      _id: id,
      name: `مثال ${id}`,
      description: `وصف المثال ${id}`,
      createdAt: new Date().toISOString()
    };
    
    return sendSuccess(res, example, "تم جلب المثال بنجاح");
  } catch (error) {
    return sendError(res, error, "فشل في جلب المثال");
  }
}));

/**
 * POST /example
 * Create new example
 * إنشاء مثال جديد
 */
router.post('/', 
  validateRequired(['name', 'description']), // Validate required fields
  asyncHandler(async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Mock data creation - replace with actual database operation
      const newExample = {
        _id: `example_${Date.now()}`,
        name,
        description,
        createdAt: new Date().toISOString()
      };
      
      return sendSuccess(res, newExample, "تم إنشاء المثال بنجاح", 201);
    } catch (error) {
      return sendError(res, error, "فشل في إنشاء المثال");
    }
  })
);

/**
 * PUT /example/:id
 * Update example
 * تحديث مثال
 */
router.put('/:id', 
  validateRequired(['name']), // Validate required fields
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Mock data update - replace with actual database operation
      const updatedExample = {
        _id: id,
        name,
        description: description || "وصف محدث",
        updatedAt: new Date().toISOString()
      };
      
      return sendSuccess(res, updatedExample, "تم تحديث المثال بنجاح");
    } catch (error) {
      return sendError(res, error, "فشل في تحديث المثال");
    }
  })
);

/**
 * DELETE /example/:id
 * Delete example
 * حذف مثال
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data deletion - replace with actual database operation
    console.log(`Deleting example with ID: ${id}`);
    
    return sendSuccess(res, { deletedId: id }, "تم حذف المثال بنجاح");
  } catch (error) {
    return sendError(res, error, "فشل في حذف المثال");
  }
}));

// ========================================
// ADVANCED EXAMPLE ROUTES
// ========================================

/**
 * GET /example/search
 * Search examples
 * البحث في الأمثلة
 */
router.get('/search', asyncHandler(async (req, res) => {
  try {
    const { q, category, status } = req.query;
    
    // Mock search - replace with actual database query
    let examples = Array.from({ length: 20 }, (_, i) => ({
      _id: `example_${i + 1}`,
      name: `مثال ${i + 1}`,
      description: `وصف المثال ${i + 1}`,
      category: ['tech', 'business', 'personal'][Math.floor(Math.random() * 3)],
      status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    // Apply filters
    if (q) {
      examples = examples.filter(example => 
        example.name.includes(q) || example.description.includes(q)
      );
    }
    
    if (category) {
      examples = examples.filter(example => example.category === category);
    }
    
    if (status) {
      examples = examples.filter(example => example.status === status);
    }
    
    return sendSuccess(res, { examples }, "تم البحث بنجاح");
  } catch (error) {
    return sendError(res, error, "فشل في البحث");
  }
}));

/**
 * POST /example/bulk
 * Create multiple examples
 * إنشاء عدة أمثلة
 */
router.post('/bulk', 
  validateRequired(['examples']), // Validate required fields
  asyncHandler(async (req, res) => {
    try {
      const { examples } = req.body;
      
      if (!Array.isArray(examples)) {
        return sendError(res, "examples must be an array", "بيانات غير صحيحة", 400);
      }
      
      // Mock bulk creation - replace with actual database operation
      const createdExamples = examples.map((example, index) => ({
        _id: `example_${Date.now()}_${index}`,
        name: example.name,
        description: example.description,
        createdAt: new Date().toISOString()
      }));
      
      return sendSuccess(res, { examples: createdExamples }, "تم إنشاء الأمثلة بنجاح", 201);
    } catch (error) {
      return sendError(res, error, "فشل في إنشاء الأمثلة");
    }
  })
);

/**
 * GET /example/stats
 * Get example statistics
 * جلب إحصائيات الأمثلة
 */
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    // Mock statistics - replace with actual database aggregation
    const stats = {
      total: 100,
      active: 75,
      inactive: 25,
      byCategory: {
        tech: 40,
        business: 35,
        personal: 25
      },
      recent: 15 // Created in last 7 days
    };
    
    return sendSuccess(res, stats, "تم جلب الإحصائيات بنجاح");
  } catch (error) {
    return sendError(res, error, "فشل في جلب الإحصائيات");
  }
}));

// ========================================
// ERROR HANDLING EXAMPLE
// ========================================

/**
 * Example route that demonstrates error handling
 * راوت مثال يوضح معالجة الأخطاء
 */
router.get('/error/example', asyncHandler(async (req, res) => {
  // Simulate different types of errors
  const errorType = req.query.type || 'general';
  
  switch (errorType) {
    case 'validation':
      return sendError(res, "Validation failed", "بيانات غير صحيحة", 400);
    
    case 'notfound':
      return sendError(res, "Example not found", "المثال غير موجود", 404);
    
    case 'unauthorized':
      return sendError(res, "Unauthorized access", "غير مصرح", 401);
    
    case 'server':
      throw new Error("Internal server error");
    
    default:
      return sendError(res, "General error", "خطأ عام", 500);
  }
}));

module.exports = router;
