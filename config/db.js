const MongoConnector = require('../mongo-connector.js');

let mongoConnector;

const connectDB = async () => {
  try {
    console.log('🚀 Initializing MongoDB Auto-Connector...');
    
    // Create new connector instance
    mongoConnector = new MongoConnector();
    
    // Connect to MongoDB
    const success = await mongoConnector.connect();
    
    if (success) {
      console.log('🎉 MongoDB Auto-Connector initialized successfully!');
      console.log('🔗 Auto-reconnect and monitoring enabled');
    } else {
      console.error('❌ Failed to initialize MongoDB Auto-Connector');
    }
    
  } catch (err) {
    console.error('❌ Error initializing MongoDB Auto-Connector:', err.message);
  }
};

// Export connector instance for use in other parts of the app
const getConnector = () => mongoConnector;

module.exports = { connectDB, getConnector }; 