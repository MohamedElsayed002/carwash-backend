# Route System Installation Guide
# دليل تثبيت نظام الراوتس

## 📋 **المتطلبات الأساسية**

### **Node.js و npm**
```bash
# تأكد من تثبيت Node.js (الإصدار 16 أو أحدث)
node --version
npm --version
```

### **MongoDB**
```bash
# تأكد من تشغيل MongoDB
mongod --version
```

## 🚀 **خطوات التثبيت**

### **1. تثبيت التبعيات**
```bash
# تثبيت التبعيات الأساسية
npm install

# تثبيت التبعيات الإضافية المطلوبة
npm install express-validator multer
```

### **2. إعداد ملف البيئة**
```bash
# إنشاء ملف .env
cp .env.example .env

# تعديل المتغيرات في ملف .env
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
PORT=3000
NODE_ENV=development
```

### **3. تشغيل الخادم**
```bash
# تشغيل في وضع التطوير
npm run dev

# تشغيل في وضع الإنتاج
npm start
```

## 📁 **هيكل الملفات الجديد**

```
routes/
├── index.js          # الملف الرئيسي - يجمع جميع الراوتس
├── api.js            # راوتس API الرئيسية
├── test.js           # راوتس الاختبار والبيانات الوهمية
├── utils.js          # الدوال المساعدة المشتركة
├── validation.js     # قواعد التحقق من صحة البيانات
├── middleware.js     # الوسائط البرمجية المشتركة
├── config.js         # إعدادات وثوابت الراوتس
├── example.js        # أمثلة على الاستخدام
├── README.md         # دليل الاستخدام
└── INSTALLATION.md   # دليل التثبيت
```

## 🔧 **إعدادات متقدمة**

### **1. إعداد قاعدة البيانات**
```javascript
// في ملف config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### **2. إعداد Middleware الرئيسي**
```javascript
// في ملف app.js أو index.js
const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger, corsMiddleware } = require('./routes/middleware');

const app = express();

// Middleware الأساسي
app.use(corsMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));

// استخدام الراوتس
app.use('/', require('./routes'));

// معالجة الأخطاء
app.use(errorLogger);
```

### **3. إعداد التحقق من صحة البيانات**
```javascript
// في أي راوت
const { userValidation } = require('./routes/validation');

router.post('/register', userValidation.register, (req, res) => {
  // منطق التسجيل
});
```

## 🧪 **اختبار النظام**

### **1. اختبار الاتصال**
```bash
# اختبار الخادم
curl http://localhost:3000/health

# اختبار API الرئيسي
curl http://localhost:3000/
```

### **2. اختبار الراوتس**
```bash
# اختبار راوتس الاختبار
curl http://localhost:3000/test

# اختبار راوتس API
curl http://localhost:3000/api/user/profile
```

### **3. اختبار Postman**
- استورد ملف Postman Collection
- اختبر جميع الراوتس
- تحقق من الاستجابات

## 🔒 **إعدادات الأمان**

### **1. إعداد JWT**
```javascript
// في ملف .env
JWT_SECRET=your_very_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### **2. إعداد Rate Limiting**
```javascript
// في routes/middleware.js
const { apiRateLimit, loginRateLimit } = require('./routes/middleware');

// تطبيق على جميع راوتس API
router.use(apiRateLimit);

// تطبيق على راوتس تسجيل الدخول
router.post('/login', loginRateLimit, (req, res) => {
  // منطق تسجيل الدخول
});
```

### **3. إعداد CORS**
```javascript
// في routes/middleware.js
const { corsMiddleware } = require('./routes/middleware');

app.use(corsMiddleware);
```

## 📊 **مراقبة الأداء**

### **1. تسجيل الطلبات**
```javascript
// في routes/middleware.js
const { requestLogger } = require('./routes/middleware');

app.use(requestLogger);
```

### **2. مراقبة الأخطاء**
```javascript
// في routes/middleware.js
const { errorLogger } = require('./routes/middleware');

app.use(errorLogger);
```

### **3. إحصائيات API**
```javascript
// في routes/api.js
router.get('/stats', (req, res) => {
  // إحصائيات API
});
```

## 🚀 **النشر**

### **1. إعداد الإنتاج**
```bash
# تعيين متغيرات البيئة للإنتاج
NODE_ENV=production
PORT=3000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
```

### **2. بناء التطبيق**
```bash
# تثبيت التبعيات للإنتاج
npm ci --only=production

# تشغيل التطبيق
npm start
```

### **3. استخدام PM2**
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start index.js --name "car-washer-api"

# مراقبة التطبيق
pm2 monit
```

## 🔧 **استكشاف الأخطاء**

### **1. مشاكل الاتصال بقاعدة البيانات**
```bash
# تحقق من تشغيل MongoDB
sudo systemctl status mongod

# تحقق من URI الاتصال
echo $MONGODB_URI
```

### **2. مشاكل JWT**
```bash
# تحقق من JWT_SECRET
echo $JWT_SECRET

# اختبار التوكن
curl -H "Authorization: Bearer your_token" http://localhost:3000/api/user/profile
```

### **3. مشاكل CORS**
```bash
# تحقق من إعدادات CORS
curl -H "Origin: http://localhost:3000" http://localhost:3000/api/user/profile
```

## 📞 **الدعم**

### **1. التوثيق**
- راجع ملف `README.md` للاستخدام
- راجع ملف `example.js` للأمثلة
- راجع ملف `config.js` للإعدادات

### **2. المشاكل الشائعة**
- تأكد من تثبيت جميع التبعيات
- تحقق من متغيرات البيئة
- تأكد من تشغيل MongoDB
- تحقق من إعدادات CORS

### **3. التواصل**
- إنشاء issue في GitHub
- مراجعة التوثيق
- اختبار الراوتس

## ✅ **قائمة التحقق**

- [ ] تثبيت Node.js و npm
- [ ] تثبيت MongoDB
- [ ] تثبيت التبعيات
- [ ] إعداد ملف .env
- [ ] تشغيل الخادم
- [ ] اختبار الاتصال
- [ ] اختبار الراوتس
- [ ] إعداد الأمان
- [ ] مراقبة الأداء
- [ ] النشر للإنتاج
