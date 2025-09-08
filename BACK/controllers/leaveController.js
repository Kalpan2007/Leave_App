const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');

// Create new leave request
const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, priorityLevel } = req.body;

    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (from < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave cannot be applied for past dates'
      });
    }

    if (to < from) {
      return res.status(400).json({
        success: false,
        message: 'To date must be after from date'
      });
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      applicant: req.user._id,
      leaveType,
      fromDate: from,
      toDate: to,
      reason,
      priorityLevel: priorityLevel || 'Normal'
    });

    await leaveRequest.populate('applicant', 'name email role class department');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: { leaveRequest }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create leave request'
    });
  }
};

// Get user's leave requests
const getUserLeaveRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { applicant: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate('applicant', 'name email role class department')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
};

// Get all leave requests (faculty only)
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    let query = LeaveRequest.find(filter)
      .populate('applicant', 'name email role class department')
      .populate('reviewedBy', 'name email role');

    // Add search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { class: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      filter.applicant = { $in: userIds };
    }

    const leaveRequests = await query
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
};

// Get leave request details
const getLeaveRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findById(id)
      .populate('applicant', 'name email role class department')
      .populate('reviewedBy', 'name email role')
      .populate('approvalHistory.by', 'name email role');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user can access this request
    if (req.user.role === 'student' && leaveRequest.applicant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { leaveRequest }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request details'
    });
  }
};

// Update leave request status (faculty only)
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been reviewed'
      });
    }

    // Update leave request
    leaveRequest.status = status;
    leaveRequest.reviewedBy = req.user._id;
    leaveRequest.reviewDate = new Date();
    leaveRequest.reviewComment = reviewComment;

    // Add to approval history
    leaveRequest.approvalHistory.push({
      action: status,
      by: req.user._id,
      date: new Date(),
      comment: reviewComment
    });

    await leaveRequest.save();
    await leaveRequest.populate('applicant', 'name email role class department');
    await leaveRequest.populate('reviewedBy', 'name email role');

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: { leaveRequest }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request status'
    });
  }
};

// Get leave statistics for dashboard
const getLeaveStatistics = async (req, res) => {
  try {
    let stats;

    if (req.user.role === 'faculty') {
      // Faculty dashboard statistics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalRequests = await LeaveRequest.countDocuments({
        createdAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      const pendingRequests = await LeaveRequest.countDocuments({
        status: 'Pending'
      });

      const approvedThisWeek = await LeaveRequest.countDocuments({
        status: 'Approved',
        reviewDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      });

      const rejectedThisMonth = await LeaveRequest.countDocuments({
        status: 'Rejected',
        reviewDate: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      stats = {
        totalRequests: { count: totalRequests, label: 'This Month' },
        pending: { count: pendingRequests, label: 'Approve Now' },
        approved: { count: approvedThisWeek, label: 'This Week' },
        rejected: { count: rejectedThisMonth, label: 'This Month' }
      };
    } else {
      // Student statistics - get their leave balance
      const leaveBalance = await LeaveBalance.findOne({ user: req.user._id });
      const userRequests = await LeaveRequest.countDocuments({ applicant: req.user._id });

      stats = {
        leaveBalance: leaveBalance || { casual: 12, sick: 8, earned: 15 },
        totalRequests: userRequests
      };
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics'
    });
  }
};

// Get user's leave balance
const getLeaveBalance = async (req, res) => {
  try {
    let leaveBalance = await LeaveBalance.findOne({ user: req.user._id });
    
    if (!leaveBalance) {
      // Create default balance if not exists
      leaveBalance = await LeaveBalance.create({ user: req.user._id });
    }

    res.json({
      success: true,
      data: { leaveBalance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance'
    });
  }
};

module.exports = {
  createLeaveRequest,
  getUserLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestDetails,
  updateLeaveRequestStatus,
  getLeaveStatistics,
  getLeaveBalance
};