const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

// ===== GET USER PROFILE =====
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== UPDATE USER PROFILE =====
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, plan, accountType } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (plan) updateData.plan = plan;
        if (accountType) updateData.accountType = accountType;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            user,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== REQUEST ACCOUNT DELETION =====
router.post('/request-deletion', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Set deletion request
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 14); // 14 days grace period

        user.deletionRequested = true;
        user.deletionRequestedAt = new Date();
        user.deletionScheduledFor = deletionDate;
        user.isActive = false; // Deactivate immediately

        await user.save();

        // Send notification to admin
        const admin = await User.findOne({ isAdmin: true });
        if (admin) {
            await Message.create({
                sender: user._id,
                receiver: admin._id,
                message: `📢 User ${user.name} (${user.email}) has requested account deletion. Account will be permanently deleted on ${deletionDate.toLocaleDateString('en-ZA')}.`
            });
        }

        res.json({
            success: true,
            message: 'Account deletion requested. Your account will be permanently deleted in 14 days.',
            deletionDate: deletionDate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== CANCEL DELETION REQUEST =====
router.post('/cancel-deletion', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        user.deletionRequested = false;
        user.deletionRequestedAt = null;
        user.deletionScheduledFor = null;
        user.isActive = true;

        await user.save();

        // Notify admin
        const admin = await User.findOne({ isAdmin: true });
        if (admin) {
            await Message.create({
                sender: user._id,
                receiver: admin._id,
                message: `✅ User ${user.name} (${user.email}) has cancelled their account deletion request.`
            });
        }

        res.json({
            success: true,
            message: 'Account deletion cancelled. Your account is now active.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== PERMANENTLY DELETE ACCOUNT (Admin Only) =====
router.delete('/:id', adminProtect, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Delete all messages from this user
        await Message.deleteMany({ 
            $or: [{ sender: user._id }, { receiver: user._id }] 
        });

        res.json({
            success: true,
            message: 'User account permanently deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== GET DELETION REQUESTS (Admin Only) =====
router.get('/deletion-requests', adminProtect, async (req, res) => {
    try {
        const users = await User.find({
            deletionRequested: true,
            isActive: false
        }).select('-password');

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;