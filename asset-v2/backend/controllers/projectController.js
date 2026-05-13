const Project = require('../models/Project');
const State = require('../models/State');
const Location = require('../models/Location');

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort('name');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStates = async (req, res) => {
  try {
    const states = await State.find({ project: req.params.projectId }).sort('name');
    res.json({ success: true, states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createState = async (req, res) => {
  try {
    const state = await State.create({ name: req.body.name, project: req.params.projectId });
    res.status(201).json({ success: true, state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteState = async (req, res) => {
  try {
    await State.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'State deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ state: req.params.stateId }).sort('name');
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const state = await State.findById(req.params.stateId);
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });
    const location = await Location.create({
      name: req.body.name,
      state: req.params.stateId,
      project: state.project
    });
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};