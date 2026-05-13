const Asset = require('../models/Asset');

// Helper: get project filter for manager
const getManagerProjectFilter = (user) => {
  const managedProjectId = user.project?._id || user.project;
  return managedProjectId ? { project: managedProjectId } : {};
};

exports.getAssets = async (req, res) => {
  try {
    const { status, category, project, state, location, search } = req.query;
    let filter = {};

    if (req.user.role === 'staff') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager only sees assets in their project
      Object.assign(filter, getManagerProjectFilter(req.user));
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (state) filter.state = state;
      if (location) filter.location = location;
      if (search) filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    } else {
      // Admin sees all, optional filters
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (project) filter.project = project;
      if (state) filter.state = state;
      if (location) filter.location = location;
      if (search) filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(filter)
      .populate('assignedTo', 'name email department')
      .populate('project', 'name')
      .populate('state', 'name')
      .populate('location', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: assets.length, assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('project', 'name')
      .populate('state', 'name')
      .populate('location', 'name')
      .populate('assignmentHistory.assignedTo', 'name email');

    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    if (req.user.role === 'staff' && String(asset.assignedTo?._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'manager') {
      const managedProjectId = String(req.user.project?._id || req.user.project);
      if (String(asset.project?._id) !== managedProjectId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const assetObj = asset.toObject();
    // Only admin sees assignment history
    if (req.user.role !== 'admin') {
      delete assetObj.assignmentHistory;
    }
    // maintenanceHistory visible to admin and manager, not staff
    if (req.user.role === 'staff') {
      delete assetObj.maintenanceHistory;
    }

    res.json({ success: true, asset: assetObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    // Manager: force asset into their project
    if (req.user.role === 'manager') {
      const managedProjectId = req.user.project?._id || req.user.project;
      if (managedProjectId) req.body.project = managedProjectId;
    }
    req.body.createdBy = req.user._id;
    const asset = await Asset.create(req.body);
    const populated = await Asset.findById(asset._id)
      .populate('project', 'name').populate('state', 'name').populate('location', 'name');
    res.status(201).json({ success: true, asset: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('state', 'name')
      .populate('location', 'name');
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    // Manager can only delete assets in their project
    if (req.user.role === 'manager') {
      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      const managedProjectId = String(req.user.project?._id || req.user.project);
      if (String(asset.project) !== managedProjectId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignAsset = async (req, res) => {
  try {
    const { userId, userName, assignedDate, notes } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    // Manager can only assign assets in their project
    if (req.user.role === 'manager') {
      const managedProjectId = String(req.user.project?._id || req.user.project);
      if (String(asset.project) !== managedProjectId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    asset.assignmentHistory.push({
      assignedTo: userId,
      assignedToName: userName,
      assignedDate: assignedDate || new Date(),
      assignedBy: req.user._id,
      assignedByName: req.user.name,
      notes: notes || ''
    });

    asset.assignedTo = userId;
    asset.assignedDate = assignedDate || new Date();
    asset.returnedDate = null;
    asset.status = 'assigned';
    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email department')
      .populate('project', 'name')
      .populate('state', 'name')
      .populate('location', 'name');

    res.json({ success: true, asset: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const { returnedDate, notes } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    if (asset.assignmentHistory.length > 0) {
      const last = asset.assignmentHistory[asset.assignmentHistory.length - 1];
      last.returnedDate = returnedDate || new Date();
      if (notes) last.notes += ` | Returned: ${notes}`;
    }

    asset.returnedDate = returnedDate || new Date();
    asset.assignedTo = null;
    asset.assignedDate = null;
    asset.status = 'available';
    await asset.save();

    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMaintenance = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    asset.maintenanceHistory.push(req.body);
    asset.status = 'maintenance';
    await asset.save();
    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'staff') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      Object.assign(filter, getManagerProjectFilter(req.user));
    } else if (req.user.role === 'admin' && req.query.project) {
      filter.project = req.query.project;
    }

    const total = await Asset.countDocuments(filter);
    const available = await Asset.countDocuments({ ...filter, status: 'available' });
    const assigned = await Asset.countDocuments({ ...filter, status: 'assigned' });
    const maintenance = await Asset.countDocuments({ ...filter, status: 'maintenance' });
    const retired = await Asset.countDocuments({ ...filter, status: 'retired' });

    // Convert project string to ObjectId for aggregate $match
    const aggregateFilter = { ...filter };
    if (aggregateFilter.project && typeof aggregateFilter.project === 'string') {
      const mongoose = require('mongoose');
      aggregateFilter.project = new mongoose.Types.ObjectId(aggregateFilter.project);
    }
    if (aggregateFilter.assignedTo && typeof aggregateFilter.assignedTo === 'string') {
      const mongoose = require('mongoose');
      aggregateFilter.assignedTo = new mongoose.Types.ObjectId(aggregateFilter.assignedTo);
    }

    const byCategory = await Asset.aggregate([
      { $match: aggregateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, stats: { total, available, assigned, maintenance, retired, byCategory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadCSV = async (req, res) => {
  try {
    const { project, state, location } = req.query;
    let filter = {};
    if (project) filter.project = project;
    if (state) filter.state = state;
    if (location) filter.location = location;

    const assets = await Asset.find(filter)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('state', 'name')
      .populate('location', 'name');

    const headers = [
      'Asset ID','Name','Category','Type','Brand','Model',
      'Serial Number','Status','Condition','Project','State',
      'Location','Department','Assigned To','Assigned Date',
      'Returned Date','Vendor','Description'
    ];

    const rows = assets.map(a => [
      a.assetId, a.name, a.category, a.type, a.brand, a.model,
      a.serialNumber, a.status, a.condition,
      a.project?.name || '', a.state?.name || '', a.location?.name || '',
      a.department, a.assignedTo?.name || '',
      a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : '',
      a.returnedDate ? new Date(a.returnedDate).toLocaleDateString() : '',
      a.vendor, a.description
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
