const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    // Manager can only see users in their project
    let filter = {};
    if (req.user.role === 'manager') {
      const managedProjectId = req.user.project?._id || req.user.project;
      if (managedProjectId) {
        filter = { $or: [{ projects: managedProjectId }, { project: managedProjectId }] };
      }
    }
    const users = await User.find(filter)
      .populate('projects', 'name')
      .populate('project', 'name')
      .sort('-createdAt');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    // Sync: if projects array provided, set primary project too
    if (req.body.projects && req.body.projects.length > 0 && !req.body.project) {
      req.body.project = req.body.projects[0];
    }

    const created = await User.create(req.body);
    const user = await User.findById(created._id).populate('projects', 'name').populate('project', 'name');
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, role, department, phone, projects, project, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;

    // Update projects array
    if (projects !== undefined) {
      user.projects = projects || [];
      // Set primary project from first in array if not explicitly set
      if (!project && projects.length > 0) {
        user.project = projects[0];
      }
    }
    if (project !== undefined) user.project = project || null;

    // Only update password if provided
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();
    const updated = await User.findById(user._id).populate('projects', 'name').populate('project', 'name');
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
