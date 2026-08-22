const express = require('express');
const {
  createStaffUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upsertFeeStatus,
  recordPayment,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('lecturer', 'admin'));

router.post('/', authorize('admin'), createStaffUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

router.post('/:id/fees', authorize('admin'), upsertFeeStatus);
router.post('/:id/fees/:feeId/payments', authorize('admin'), recordPayment);

module.exports = router;
