const express = require('express');
const {
  createLeaveRequest,
  getUserLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestDetails,
  updateLeaveRequestStatus,
  getLeaveStatistics,
  getLeaveBalance
} = require('../controllers/leaveController');
const { uploadAttachment, downloadAttachment } = require('../controllers/uploadController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Leave balance
router.get('/balance', getLeaveBalance);

// Leave statistics
router.get('/statistics', getLeaveStatistics);

// File upload routes
router.post('/upload', upload.array('attachments', 5), uploadAttachment);
router.get('/:leaveRequestId/download/:filename', downloadAttachment);

// Leave requests
router.post('/', createLeaveRequest);
router.get('/my-requests', getUserLeaveRequests);
router.get('/all-requests', authorize('faculty'), getAllLeaveRequests);
router.get('/:id', getLeaveRequestDetails);
router.put('/:id/status', authorize('faculty'), updateLeaveRequestStatus);

module.exports = router;