const LeaveRequest = require('../models/LeaveRequest');
const fs = require('fs');
const path = require('path');

// Upload attachment for leave request
const uploadAttachment = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { leaveRequestId } = req.body;
    
    if (!leaveRequestId) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(400).json({
        success: false,
        message: 'Leave request ID is required'
      });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);
    if (!leaveRequest) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns the leave request
    if (leaveRequest.applicant.toString() !== req.user._id.toString()) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add attachments to leave request
    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date()
    }));

    leaveRequest.attachments.push(...attachments);
    await leaveRequest.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        attachments: attachments
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
};

// Download attachment
const downloadAttachment = async (req, res) => {
  try {
    const { leaveRequestId, filename } = req.params;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user can access this leave request
    if (req.user.role === 'student' && 
        leaveRequest.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const attachment = leaveRequest.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'File download failed'
    });
  }
};

module.exports = {
  uploadAttachment,
  downloadAttachment
};