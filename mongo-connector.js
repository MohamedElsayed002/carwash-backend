const mongoose = require('mongoose');
const { MONGODB_CONFIG } = require('./database-config.js');

class MongoConnector {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      console.log('🔄 Attempting to connect to MongoDB...');
      console.log('📡 Connection string:', MONGODB_CONFIG.uri.replace(/\/\/.*@/, '//***:***@'));
      
      await mongoose.connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options);
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log('✅ MongoDB connected successfully!');
      console.log('📊 Database: paypass');
      console.log('🌐 Host: cluster0.3vqlnfg.mongodb.net');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      // Test database operations
      await this.testDatabaseOperations();
      
      return true;
      
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ Connection attempt ${this.connectionAttempts} failed:`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying in 3 seconds... (${this.connectionAttempts}/${this.maxRetries})`);
        setTimeout(() => this.connect(), 3000);
      } else {
        console.error('❌ Max connection attempts reached. Please check your MongoDB settings.');
        return false;
      }
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connection established');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB connection disconnected');
      this.isConnected = false;
      this.autoReconnect();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🟢 MongoDB reconnected successfully');
      this.isConnected = true;
    });
  }

  async autoReconnect() {
    if (!this.isConnected && this.connectionAttempts < this.maxRetries) {
      console.log('🔄 Attempting to reconnect...');
      setTimeout(() => this.connect(), 3000);
    }
  }

  async testDatabaseOperations() {
    try {
      const db = mongoose.connection;
      
      // List collections
      const collections = await db.db.listCollections().toArray();
      console.log(`📁 Found ${collections.length} collections:`);
      
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });

      // Test basic operations
      console.log('🧪 Testing database operations...');
      
      // Test users collection
      const usersCount = await db.db.collection('users').countDocuments();
      console.log(`👥 Users count: ${usersCount}`);
      
      // Test packages collection
      const packagesCount = await db.db.collection('packages').countDocuments();
      console.log(`📦 Packages count: ${packagesCount}`);
      
      console.log('✅ Database operations test completed successfully!');
      
    } catch (error) {
      console.error('❌ Database operations test failed:', error.message);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      maxRetries: this.maxRetries
    };
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      console.log('🛑 MongoDB disconnected');
      this.isConnected = false;
    }
  }
}

module.exports = MongoConnector; 