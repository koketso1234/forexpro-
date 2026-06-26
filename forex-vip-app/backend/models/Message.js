const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    // ===== MESSAGE STATUS =====
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });

module.exports = mongoose.model('Message', MessageSchema);