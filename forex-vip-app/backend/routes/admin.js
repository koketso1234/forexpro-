const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/auth');
const User = require('../models/User');
const Signal = require('../models/Signal');

// ===== GET ALL USERS =====
router.get('/users', adminProtect, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
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

// ===== GET USER BY ID =====
router.get('/users/:id', adminProtect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
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

// ===== UPDATE USER =====
router.put('/users/:id', adminProtect, async (req, res) => {
    try {
        const { subscriptionStatus, plan, name, email, phone, isAdmin } = req.body;
        
        const updateData = {};
        if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
        if (plan) updateData.plan = plan;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (typeof isAdmin !== 'undefined') updateData.isAdmin = isAdmin;
        
        if (subscriptionStatus === 'active') {
            let endDate = new Date();
            const userPlan = plan || 'monthly';
            if (userPlan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (userPlan === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
            else if (userPlan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            updateData.subscriptionEnd = endDate;
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== DELETE USER =====
router.delete('/users/:id', adminProtect, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET ADMIN STATS =====
router.get('/stats', adminProtect, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ subscriptionStatus: 'active' });
        const inactiveUsers = await User.countDocuments({ subscriptionStatus: 'inactive' });
        const adminUsers = await User.countDocuments({ isAdmin: true });
        
        const totalSignals = await Signal.countDocuments();
        const activeSignals = await Signal.countDocuments({ status: 'active' });
        const closedSignals = await Signal.countDocuments({ status: 'closed' });
        
        // Revenue in ZAR
        const monthlyUsers = await User.countDocuments({ plan: 'monthly', subscriptionStatus: 'active' });
        const quarterlyUsers = await User.countDocuments({ plan: 'quarterly', subscriptionStatus: 'active' });
        const yearlyUsers = await User.countDocuments({ plan: 'yearly', subscriptionStatus: 'active' });
        const revenue = (monthlyUsers * 1850) + (quarterlyUsers * 3700) + (yearlyUsers * 11100);
        
        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    admin: adminUsers
                },
                signals: {
                    total: totalSignals,
                    active: activeSignals,
                    closed: closedSignals
                },
                revenue: {
                    total: revenue,
                    currency: 'ZAR'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;