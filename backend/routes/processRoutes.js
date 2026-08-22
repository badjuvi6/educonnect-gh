const express = require('express');
const {
  createProcess,
  getProcesses,
  getProcessById,
  updateProcessStatus,
  deleteProcess,
  getStudentSummary,
} = require('../controllers/processController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard-summary', authorize('student'), getStudentSummary);

router.route('/').post(authorize('student'), createProcess).get(getProcesses);

router
  .route('/:id')
  .get(getProcessById)
  .put(authorize('lecturer', 'admin'), updateProcessStatus)
  .delete(deleteProcess);

module.exports = router;
