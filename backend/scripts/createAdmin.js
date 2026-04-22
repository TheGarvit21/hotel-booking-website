const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin credentials
const ADMIN_CREDENTIALS = {
  name: 'Admin User',
  email: 'admin@luxstay.com',
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
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: ADMIN_CREDENTIALS.email
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Role:', existingAdmin.role);
      return;
    }

    // Create new admin user
    const adminUser = await User.create({
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      role: ADMIN_CREDENTIALS.role,
      status: ADMIN_CREDENTIALS.status,
      phone: ADMIN_CREDENTIALS.phone,
      emailVerified: ADMIN_CREDENTIALS.emailVerified
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Role:', adminUser.role);
    console.log('🆔 User ID:', adminUser._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        err => err.message
      );

      console.error('🔍 Validation errors:', messages.join(', '));
    }
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin user creation script...\n');

    await connectDB();

    await createAdminUser();

    console.log('\n✅ Script completed successfully!');
    console.log('\n🔑 Admin Login Credentials:');
    console.log('📧 Email: admin@luxstay.com');
    console.log('🔐 Password: BHAICHARAONTOP123');
    console.log('\n⚠️ IMPORTANT: Change password after first login!');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run script
main();