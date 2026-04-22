const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin credentials
const ADMIN_CREDENTIALS = {
  name: 'Admin User',
  email: 'admiluxstay.com',
  password: 'BHAICHARAONTOP123',
  role: 'admin',
  status: 'active',
  phone: '+1234567890',
  emailVerified: true
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelbooking'
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Role:', existingAdmin.role);
      console.log('📅 Created:', existingAdmin.createdAt);
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password, // Will be hashed by pre-save middleware
      role: ADMIN_CREDENTIALS.role,
      status: ADMIN_CREDENTIALS.status,
      phone: ADMIN_CREDENTIALS.phone,
      emailVerified: ADMIN_CREDENTIALS.emailVerified
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Role:', adminUser.role);
    console.log('📅 Created:', adminUser.createdAt);
    console.log('🆔 User ID:', adminUser._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('🔍 Validation errors:', messages.join(', '));
    }
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting admin user creation script...\n');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    await createAdminUser();
    
    console.log('\n✅ Script completed successfully!');
    console.log('\n🔑 Admin Login Credentials:');
    console.log('📧 Email: admin@luxstay.com');
    console.log('🔐 Password: admin123456');
    console.log('\n⚠️  IMPORTANT: Change these credentials after first login!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();
