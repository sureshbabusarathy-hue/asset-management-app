const mongoose = require('mongoose');
const Project = require('./models/Project');
const State = require('./models/State');
require('dotenv').config();

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

const addStates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const projects = await Project.find();
    if (!projects.length) {
      console.log('❌ No projects found. Run setup.js first!');
      process.exit(1);
    }

    for (const project of projects) {
      console.log(`\nAdding states to project: ${project.name}`);
      for (const stateName of INDIAN_STATES) {
        const exists = await State.findOne({ name: stateName, project: project._id });
        if (!exists) {
          await State.create({ name: stateName, project: project._id });
          console.log(`  ✅ ${stateName}`);
        } else {
          console.log(`  ⏭ ${stateName} already exists`);
        }
      }
    }

    console.log('\n✅ All Indian states added to all projects!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addStates();