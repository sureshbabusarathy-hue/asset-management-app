const express = require('express');
const router = express.Router();
const {
  getProjects, createProject, updateProject, deleteProject,
  getStates, createState, deleteState,
  getLocations, createLocation, deleteLocation
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/', getProjects);
router.post('/', authorize('admin'), createProject);
router.put('/:id', authorize('admin'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);
router.get('/:projectId/states', getStates);
router.post('/:projectId/states', authorize('admin'), createState);
router.delete('/states/:id', authorize('admin'), deleteState);
router.get('/states/:stateId/locations', getLocations);
router.post('/states/:stateId/locations', authorize('admin'), createLocation);
router.delete('/locations/:id', authorize('admin'), deleteLocation);
module.exports = router;