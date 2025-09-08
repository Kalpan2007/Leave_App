const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Medical', 'Personal', 'Emergency', 'Vacation', 'Sick', 'Casual', 'Other'],
    required: [true, 'Leave type is required']
  },
  fromDate: {
    type: Date,
    required: [true, 'From date is required']
  },
  toDate: {
    type: Date,
    required: [true, 'To date is required'],
    validate: {
      validator: function(value) {
        return value >= this.fromDate;
      },
      message: 'To date must be after from date'
    }
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  priorityLevel: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewComment: {
    type: String,
    maxlength: [500, 'Review comment cannot exceed 500 characters']
  },
  approvalHistory: [{
    action: {
      type: String,
      enum: ['Submitted', 'Approved', 'Rejected', 'Under Review']
    },
    date: {
      type: Date,
      default: Date.now
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String
  }]
}, {
  timestamps: true
});

// Calculate leave duration in days
leaveRequestSchema.virtual('duration').get(function() {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((this.toDate - this.fromDate) / oneDay) + 1;
});

// Add submission to approval history on creation
leaveRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    this.approvalHistory.push({
      action: 'Submitted',
      by: this.applicant,
      date: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);