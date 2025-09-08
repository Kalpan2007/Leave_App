const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  casual: {
    type: Number,
    default: 12
  },
  sick: {
    type: Number,
    default: 8
  },
  earned: {
    type: Number,
    default: 15
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  }
}, {
  timestamps: true
});

// Calculate total leave balance
leaveBalanceSchema.virtual('total').get(function() {
  return this.casual + this.sick + this.earned;
});

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);