const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./modules/user/user.model');

async function resetUserPaymentStatus() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Reset all users' isPaid status to false
        const result = await User.updateMany(
            { isPaid: true }, // Find all users with isPaid: true
            { isPaid: false } // Set isPaid to false
        );

        console.log(`✅ Reset isPaid status for ${result.modifiedCount} users`);

        // Verify the changes
        const paidUsers = await User.find({ isPaid: true });
        console.log(`📊 Users with isPaid: true after reset: ${paidUsers.length}`);

        const unpaidUsers = await User.find({ isPaid: false });
        console.log(`📊 Users with isPaid: false after reset: ${unpaidUsers.length}`);

        console.log('✅ Payment status reset completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting payment status:', error);
        process.exit(1);
    }
}

resetUserPaymentStatus();

