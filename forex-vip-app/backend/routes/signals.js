const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/auth');
const Signal = require('../models/Signal');
const User = require('../models/User');

// ===== GET SIGNALS FOR CURRENT USER (Audience-Based) =====
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Determine which signals to show based on user type
        let audienceFilter = ['all'];
        
        if (user.isAdmin) {
            audienceFilter = ['all', 'free', 'premium', 'admin_only'];
        } else if (user.isPaid()) {
            audienceFilter = ['all', 'premium'];
        } else {
            audienceFilter = ['all', 'free'];
        }
        
        const signals = await Signal.find({
            status: 'active',
            audience: { $in: audienceFilter }
        }).sort({ createdAt: -1 }).limit(10);

        res.json({
            success: true,
            count: signals.length,
            signals,
            userType: user.accountType,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET ALL SIGNALS (Admin Only) =====
router.get('/all', adminProtect, async (req, res) => {
    try {
        const signals = await Signal.find().sort({ createdAt: -1 });
        res.json({ success: true, count: signals.length, signals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== CREATE SIGNAL (Admin Only - With Audience) =====
router.post('/', adminProtect, async (req, res) => {
    try {
        const { pair, action, entry, takeProfit, stopLoss, confidence, analysis, audience } = req.body;

        if (!pair || !action || !entry || !takeProfit || !stopLoss) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const signal = await Signal.create({
            pair,
            action,
            entry,
            takeProfit,
            stopLoss,
            confidence: confidence || 'MEDIUM',
            analysis: analysis || '',
            audience: audience || 'all',
            status: 'active'
        });

        // Get user count for each audience type
        const freeUsers = await User.countDocuments({ accountType: 'free', subscriptionStatus: 'active' });
        const premiumUsers = await User.countDocuments({ accountType: 'paid', subscriptionStatus: 'active' });
        const totalUsers = freeUsers + premiumUsers;

        const audienceNames = {
            all: 'All Users',
            free: 'Free Users Only',
            premium: 'Premium Users Only',
            admin_only: 'Admin Only'
        };

        res.status(201).json({
            success: true,
            signal,
            message: `Signal sent to: ${audienceNames[audience] || 'All Users'}`,
            stats: {
                freeUsers,
                premiumUsers,
                totalUsers,
                audience: audience
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== DELETE SIGNAL (Admin Only) =====
router.delete('/:id', adminProtect, async (req, res) => {
    try {
        const signal = await Signal.findByIdAndDelete(req.params.id);
        if (!signal) {
            return res.status(404).json({ success: false, error: 'Signal not found' });
        }
        res.json({ success: true, message: 'Signal deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;