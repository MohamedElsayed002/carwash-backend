const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://***:***@dartabases.aqbbmr9.mongodb.net/CarWasherDB?retryWrites=true&w=majority&appName=DartaBases', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define Payment Schema (matching our model)
const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'WashStation' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    method: { type: String, required: true },
    transactionId: { type: String },
    checkoutId: { type: String },
    paymentDetails: { type: mongoose.Schema.Types.Mixed },
    type: { type: String, enum: ['purchase', 'tip'], default: 'purchase' },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

async function createTestPaymentRecord() {
    try {
        console.log('🚀 Creating test payment record...\n');

        // Create a test payment record
        const testPayment = new Payment({
            user: '68a5ff54275bc1fe142ff2b0', // Existing user from your database
            package: '68a51a102389fb217ed65ef3', // Existing package from your database
            amount: 92,
            status: 'pending',
            method: 'hyperpay_checkout',
            transactionId: `TXN_TEST_${Date.now()}`,
            checkoutId: 'TEST_CHECKOUT_ID_12345', // This is the checkout ID we'll test with
            paymentDetails: {
                user: '68a5ff54275bc1fe142ff2b0',
                checkoutId: 'TEST_CHECKOUT_ID_12345',
                merchantTransactionId: 'TEST_MERCHANT_TXN_12345',
                amount: 92,
                currency: 'SAR',
                package: '68a51a102389fb217ed65ef3',
                car: null,
                customer: {},
                billing: {},
                status: 'pending',
                createdAt: new Date()
            },
            type: 'purchase'
        });

        await testPayment.save();
        console.log('✅ Test payment record created successfully!');
        console.log('📝 Payment ID:', testPayment._id);
        console.log('📝 Checkout ID:', testPayment.checkoutId);
        console.log('📝 Status:', testPayment.status);

        // Test finding the payment record
        const foundPayment = await Payment.findOne({
            checkoutId: 'TEST_CHECKOUT_ID_12345',
            status: 'pending',
            method: 'hyperpay_checkout'
        });

        if (foundPayment) {
            console.log('✅ Payment record found in database!');
            console.log('📝 Found payment:', {
                id: foundPayment._id,
                checkoutId: foundPayment.checkoutId,
                status: foundPayment.status,
                method: foundPayment.method
            });
        } else {
            console.log('❌ Payment record not found in database!');
        }

        console.log('\n🎉 Test payment record creation completed!');
        console.log('🔗 You can now test with checkout ID: TEST_CHECKOUT_ID_12345');

    } catch (error) {
        console.error('❌ Error creating test payment record:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the function
createTestPaymentRecord();
