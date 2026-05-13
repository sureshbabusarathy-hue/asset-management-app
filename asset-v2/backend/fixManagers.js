const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
require('dotenv').config();

const fixManagers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const managers = await User.find({ role: 'manager' }).populate('project', 'name');
    console.log('\nCurrent Managers:');
    managers.forEach(m => console.log(`  - ${m.name} (${m.email}) | Project: ${m.project?.name || 'NOT ASSIGNED'}`));

    const projects = await Project.find();
    console.log('\nAvailable Projects:');
    projects.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} | ID: ${p._id}`));

    for (const manager of managers) {
      if (!manager.project) {
        const targetProject = projects[0];
        await User.findByIdAndUpdate(manager._id, { project: targetProject._id });
        console.log(`\n✅ Fixed: ${manager.name} → Project: ${targetProject.name}`);
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixManagers();