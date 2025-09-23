const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing backend connection...\n');

// Test MongoDB connection
const testConnection = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelbooking',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Test database operations
    console.log('\n📊 Testing database operations...');
    
    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Test User model
    const User = require('./models/User');
    console.log('👤 User model loaded successfully');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
    } else {
      console.log('❌ No admin user found');
      console.log('💡 Run: npm run create-admin');
    }
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log('📊 Total users in database:', totalUsers);
    
    return conn;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    throw error;
  }
};

// Main test
const main = async () => {
  try {
    const conn = await testConnection();
    console.log('\n✅ All tests passed!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run create-admin');
    console.log('2. Run: npm run dev');
    console.log('3. Test admin login with: admin@luxstay.com / admin123456');
  } catch (error) {
    console.error('\n❌ Tests failed!');
    console.error('Check MongoDB connection and try again.');
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed.');
    process.exit(0);
  }
};

main();
