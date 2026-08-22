const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('lecturer', 'admin'), createAnnouncement)
  .get(getAnnouncements);

router
  .route('/:id')
  .get(getAnnouncementById)
  .put(authorize('lecturer', 'admin'), updateAnnouncement)
  .delete(authorize('lecturer', 'admin'), deleteAnnouncement);

module.exports = router;
