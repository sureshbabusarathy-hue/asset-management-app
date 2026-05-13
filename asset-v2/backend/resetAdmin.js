const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Delete existing admin
    await User.deleteOne({ email: 'sureshbabu@naandi.org' });
    console.log('Old admin deleted');

    // Create fresh admin
    const admin = await User.create({
      name: 'Suresh Babu',
      email: 'sureshbabu@naandi.org',
      password: 'Suresh@123',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin recreated successfully!');
    console.log('   Email   :', admin.email);
    console.log('   Password: Suresh@123');
    console.log('   Role    :', admin.role);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdmin();