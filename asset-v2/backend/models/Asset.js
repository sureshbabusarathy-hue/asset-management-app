const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String },
  assignedDate: { type: Date },
  returnedDate: { type: Date },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedByName: { type: String },
  notes: { type: String, default: '' }
}, { timestamps: true });

const maintenanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['repair', 'service', 'inspection', 'upgrade'], required: true },
  description: { type: String, required: true },
  cost: { type: Number, default: 0 },
  performedBy: { type: String, default: '' },
  nextMaintenanceDate: { type: Date }
}, { timestamps: true });

const assetSchema = new mongoose.Schema({
  assetId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['IT Equipment', 'Furniture', 'Vehicle', 'Machinery', 'Software License', 'Office Equipment', 'Other'],
    required: true
  },
  type: { type: String, required: true },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  serialNumber: { type: String, default: '' },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  department: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedDate: { type: Date, default: null },
  returnedDate: { type: Date, default: null },
  vendor: { type: String, default: '' },
  description: { type: String, default: '' },
  assignmentHistory: [historySchema],
  maintenanceHistory: [maintenanceSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

assetSchema.pre('save', async function(next) {
  if (!this.assetId) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetId = `AST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);