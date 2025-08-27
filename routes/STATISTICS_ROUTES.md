# Statistics Routes Documentation
# توثيق راوتس الإحصائيات

## 📊 **نظرة عامة**

راوتس الإحصائيات توفر بيانات شاملة وتحليلات مفصلة عن أداء النظام. هذه الراوتس مخصصة للمديرين والمشرفين للحصول على رؤى قيمة حول الأعمال.

## 🗂️ **موقع الملفات**

```
modules/statistics/
├── statisticsController.js    # منطق الإحصائيات
└── statistics.routes.js       # راوتس الإحصائيات

routes/
└── api.js                     # تضمين راوتس الإحصائيات
```

## 🔗 **الراوتس المتاحة**

### **1. إحصائيات لوحة التحكم**
```http
GET /api/statistics/dashboard
```

**الوصف:** إحصائيات شاملة للوحة التحكم الرئيسية

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totals": {
      "users": 150,
      "packages": 25,
      "payments": 500,
      "washes": 1200,
      "cars": 200,
      "washingPlaces": 8,
      "feedbacks": 300,
      "activeUserPackages": 80
    },
    "revenue": {
      "totalRevenue": 15000.50,
      "monthlyRevenue": 2500.75,
      "weeklyRevenue": 600.25
    },
    "recentActivities": [...],
    "packageDistribution": [...]
  }
}
```

### **2. إحصائيات المبيعات**
```http
GET /api/statistics/sales?startDate=2024-01-01&endDate=2024-01-31
```

**الوصف:** إحصائيات المبيعات مع نطاق تاريخي

**المعاملات:**
- `startDate` (اختياري): تاريخ البداية (YYYY-MM-DD)
- `endDate` (اختياري): تاريخ النهاية (YYYY-MM-DD)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalSales": 5000.75,
    "totalOrders": 150,
    "averageOrderValue": 33.34,
    "salesByDay": [...],
    "salesByPackage": [...],
    "salesByBranch": [...]
  }
}
```

### **3. إحصائيات المستخدمين**
```http
GET /api/statistics/users
```

**الوصف:** إحصائيات مفصلة عن المستخدمين

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "newUsersThisMonth": 25,
    "userGrowth": 15.5,
    "usersByCity": [...],
    "usersByAge": [...],
    "topUsers": [...]
  }
}
```

### **4. إحصائيات أداء الفروع**
```http
GET /api/statistics/washing-places
```

**الوصف:** إحصائيات أداء الفروع المختلفة

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalBranches": 8,
    "activeBranches": 7,
    "branchPerformance": [...],
    "revenueByBranch": [...],
    "ordersByBranch": [...],
    "feedbackByBranch": [...]
  }
}
```

### **5. إحصائيات أداء الباقات**
```http
GET /api/statistics/packages
```

**الوصف:** إحصائيات أداء الباقات المختلفة

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalPackages": 25,
    "activePackages": 20,
    "packagePerformance": [...],
    "revenueByPackage": [...],
    "popularPackages": [...],
    "packageRatings": [...]
  }
}
```

### **6. الإحصائيات المالية**
```http
GET /api/statistics/financial
```

**الوصف:** إحصائيات مالية مفصلة

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000.50,
    "totalExpenses": 8000.25,
    "netProfit": 7000.25,
    "profitMargin": 46.7,
    "revenueByMonth": [...],
    "expensesByCategory": [...],
    "cashFlow": [...]
  }
}
```

### **7. الإحصائيات في الوقت الفعلي**
```http
GET /api/statistics/realtime
```

**الوصف:** إحصائيات محدثة في الوقت الفعلي

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "currentOrders": 15,
    "activeUsers": 45,
    "revenueToday": 250.75,
    "ordersToday": 8,
    "systemStatus": "healthy",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

## 🔐 **الأمان والتفويض**

### **المصادقة المطلوبة:**
- جميع راوتس الإحصائيات تتطلب مصادقة JWT
- يجب أن يكون المستخدم مدير أو مشرف

### **مثال على الطلب:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/statistics/dashboard
```

## 📊 **أمثلة على الاستخدام**

### **1. جلب إحصائيات لوحة التحكم:**
```javascript
const response = await fetch('/api/statistics/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Dashboard Stats:', data.data);
```

### **2. جلب إحصائيات المبيعات:**
```javascript
const startDate = '2024-01-01';
const endDate = '2024-01-31';

const response = await fetch(
  `/api/statistics/sales?startDate=${startDate}&endDate=${endDate}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log('Sales Stats:', data.data);
```

### **3. جلب الإحصائيات المالية:**
```javascript
const response = await fetch('/api/statistics/financial', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Financial Stats:', data.data);
```

## 🔧 **التخصيص والتطوير**

### **إضافة إحصائيات جديدة:**

#### **1. إضافة دالة في Controller:**
```javascript
// في modules/statistics/statisticsController.js

const getCustomStatistics = async (req, res) => {
  try {
    // منطق الإحصائيات المخصصة
    const customData = await YourModel.aggregate([
      // خطوات التجميع
    ]);

    res.json({
      success: true,
      data: customData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  // ... الدوال الأخرى
  getCustomStatistics
};
```

#### **2. إضافة راوت جديد:**
```javascript
// في modules/statistics/statistics.routes.js

const { getCustomStatistics } = require('./statisticsController');

/**
 * @route   GET /api/statistics/custom
 * @desc    Get custom statistics
 * @access  Private/Admin
 */
router.get('/custom', getCustomStatistics);
```

## 📈 **أفضل الممارسات**

### **1. تحسين الأداء:**
- استخدم التجميع (Aggregation) بدلاً من العمليات المتعددة
- استخدم الفهارس (Indexes) للحقول المستخدمة في التجميع
- استخدم التخزين المؤقت للبيانات التي لا تتغير كثيراً

### **2. معالجة الأخطاء:**
- استخدم try-catch لجميع العمليات
- أرسل رسائل خطأ واضحة ومفيدة
- سجل الأخطاء للتحليل لاحقاً

### **3. التوثيق:**
- وثق جميع المعاملات والاستجابات
- أضف أمثلة على الاستخدام
- وضح أي قيود أو متطلبات خاصة

## 🧪 **الاختبار**

### **اختبار راوتس الإحصائيات:**
```bash
# اختبار إحصائيات لوحة التحكم
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/statistics/dashboard

# اختبار إحصائيات المبيعات
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/statistics/sales?startDate=2024-01-01&endDate=2024-01-31"

# اختبار الإحصائيات المالية
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/statistics/financial
```

## 📞 **الدعم والمساعدة**

### **المشاكل الشائعة:**
1. **خطأ 401 Unauthorized:** تأكد من صحة توكن JWT
2. **خطأ 403 Forbidden:** تأكد من أن المستخدم مدير
3. **بطء في الاستجابة:** تحقق من فهارس قاعدة البيانات
4. **بيانات غير صحيحة:** تحقق من منطق التجميع

### **نقاط الاتصال:**
- راجع ملف `statisticsController.js` للتفاصيل التقنية
- راجع ملف `statistics.routes.js` لتعريف الراوتس
- راجع هذا الملف للاستخدام والأمثلة
