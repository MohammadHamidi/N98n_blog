const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Updated fallback to include auth credentials
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongo:27017/n8bn_blog?authSource=admin';
    
    // rest of the code stays the same...
    
    // Updated options - removed deprecated bufferMaxEntries
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;