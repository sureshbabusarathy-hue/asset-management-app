const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
require('dotenv').config();

const setup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const projects = ['Titan LeAP', 'Job Factory', 'Mahindra Pride Classroom'];
    for (const name of projects) {
      const exists = await Project.findOne({ name });
      if (!exists) {
        await Project.create({ name });
        console.log(`✅ Project created: ${name}`);
      }
    }

    await User.deleteOne({ email: 'sureshbabu@naandi.org' });
    const admin = await User.create({
      name: 'Suresh Babu',
      email: 'sureshbabu@naandi.org',
      password: 'Suresh@123',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin created:', admin.email);
    console.log('✅ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setup();