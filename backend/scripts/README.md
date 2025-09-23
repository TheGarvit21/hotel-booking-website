# Admin User Creation Script

This script creates an admin user in the MongoDB database for the Hotel Booking system.

## 🔑 Default Admin Credentials

- **Email**: `admin@luxstay.com`
- **Password**: `admin123456`
- **Role**: `admin`
- **Status**: `active`

## 🚀 How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run create-admin
```

### Option 2: Direct execution
```bash
node scripts/createAdmin.js
```

## 📋 Prerequisites

1. **MongoDB running** (local or cloud)
2. **Environment variables set** (or defaults will be used)
3. **Dependencies installed** (`npm install`)

## 🔧 Environment Variables

The script will use these environment variables (or defaults):

```env
MONGODB_URI=mongodb://localhost:27017/hotelbooking
```

## 📱 What the Script Does

1. **Connects to MongoDB** using the connection string
2. **Checks if admin already exists** (prevents duplicates)
3. **Creates admin user** with hashed password
4. **Sets admin role and permissions**
5. **Displays success message** with credentials

## 🛡️ Security Notes

- **Password is automatically hashed** using bcrypt
- **Admin role gives full access** to all system features
- **Change default password** after first login
- **Script is safe to run multiple times** (won't create duplicates)

## 🔍 Verification

After running the script, you can:

1. **Login to the system** using the admin credentials
2. **Access admin dashboard** at `/admin` route
3. **Manage users, hotels, and bookings**
4. **View system statistics and analytics**

## 🚨 Important Warnings

- ⚠️ **Change the default password** immediately after first login
- ⚠️ **Keep admin credentials secure** and don't share them
- ⚠️ **Monitor admin account activity** for security
- ⚠️ **Use strong passwords** in production environments

## 🆘 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

2. **Validation Errors**
   - Check if all required fields are provided
   - Verify email format is valid

3. **Permission Denied**
   - Ensure you have write access to the database
   - Check MongoDB user permissions

## 📞 Support

If you encounter issues:
1. Check MongoDB connection
2. Verify environment variables
3. Check console error messages
4. Ensure all dependencies are installed
