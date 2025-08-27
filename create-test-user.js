const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// نموذج المستخدم
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // حذف المستخدم إذا كان موجوداً
        await User.deleteOne({ email: 'test@carwash.com' });
        await User.deleteOne({ phone: '+966501234567' });
        console.log('🗑️ Deleted existing test user if any');

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash('123456', 10);

        // إنشاء مستخدم جديد
        const testUser = new User({
            name: 'Test User',
            email: 'test@carwash.com',
            password: hashedPassword,
            phone: '+966501234568', // تغيير رقم الهاتف لتجنب التكرار
            role: 'user'
        });

        await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log('📧 Email: test@carwash.com');
        console.log('🔑 Password: 123456');
        console.log('🆔 User ID:', testUser._id);

        // التحقق من إنشاء المستخدم
        const savedUser = await User.findOne({ email: 'test@carwash.com' });
        console.log('✅ User verified in database');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
