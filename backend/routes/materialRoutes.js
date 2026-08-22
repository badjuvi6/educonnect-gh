const express = require('express');
const {
  createMaterial,
  getMaterials,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').post(authorize('lecturer', 'admin'), createMaterial).get(getMaterials);

router
  .route('/:id')
  .put(authorize('lecturer', 'admin'), updateMaterial)
  .delete(authorize('lecturer', 'admin'), deleteMaterial);

module.exports = router;
