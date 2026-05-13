const express = require('express');
const router = express.Router();
const {
  getAssets, getAsset, createAsset, updateAsset, deleteAsset,
  assignAsset, returnAsset, addMaintenance, getStats, downloadCSV
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/download', authorize('admin'), downloadCSV);
router.get('/', getAssets);
router.get('/:id', getAsset);
router.post('/', authorize('admin', 'manager'), createAsset);
router.put('/:id', authorize('admin', 'manager'), updateAsset);
router.delete('/:id', authorize('admin', 'manager'), deleteAsset);
router.put('/:id/assign', authorize('admin', 'manager'), assignAsset);
router.put('/:id/return', authorize('admin', 'manager'), returnAsset);
router.post('/:id/maintenance', authorize('admin', 'manager'), addMaintenance);

module.exports = router;
