const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelbooking',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test admin user
const testAdminUser = async () => {
  try {
    console.log('🔍 Checking for admin user...\n');
    
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' }).select('-password');
    
    if (!adminUser) {
      console.log('❌ No admin user found!');
      console.log('💡 Run: npm run create-admin');
      return;
    }

    console.log('✅ Admin user found!');
    console.log('👤 Name:', adminUser.name);
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('📊 Status:', adminUser.status);
    console.log('📅 Created:', adminUser.createdAt);
    console.log('🆔 User ID:', adminUser._id);
    
    // Check if there are other users
    const totalUsers = await User.countDocuments();
    console.log('\n📊 Total users in database:', totalUsers);
    
    if (totalUsers > 1) {
      const otherUsers = await User.find({ role: { $ne: 'admin' } }).select('name email role status');
      console.log('\n👥 Other users:');
      otherUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing admin user:', error);
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🧪 Starting admin user test script...\n');
    
    // Connect to database
    await connectDB();
    
    // Test admin user
    await testAdminUser();
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();
