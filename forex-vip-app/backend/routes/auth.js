const express = require('express');
const router = express.Router();  // ← THIS WAS MISSING!
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

// ===== REGISTER (WITH ADMIN CODE & ACCOUNT TYPE) =====
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, plan, accountType, adminCode } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already registered' 
            });
        }

        // ===== CHECK ADMIN CODE =====
        let isAdmin = false;
        let finalAccountType = accountType || 'free';
        let finalPrice = 0;

        if (adminCode && adminCode === process.env.ADMIN_REGISTRATION_CODE) {
            isAdmin = true;
            finalAccountType = 'free';
            finalPrice = 0;
            console.log('👑 Admin user being created with code:', adminCode);
        } else if (accountType === 'paid') {
            finalPrice = 1850;
        }

        // Calculate subscription dates
        let endDate = new Date();
        let price = 0;
        switch(plan) {
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                price = finalPrice || 1850;
                break;
            case 'quarterly':
                endDate.setMonth(endDate.getMonth() + 3);
                price = finalPrice || 3700;
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                price = finalPrice || 11100;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid plan selected'
                });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            plan: plan || 'monthly',
            accountType: finalAccountType,
            subscriptionStatus: 'active',
            subscriptionEnd: endDate,
            isAdmin: isAdmin,
            isVerified: true
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Send welcome email
        try {
            await sendWelcomeEmail(user, plan, price);
        } catch (error) {
            console.error('Email error:', error.message);
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                plan: user.plan,
                accountType: user.accountType,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEnd: user.subscriptionEnd,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        if (user.subscriptionStatus !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Your subscription is inactive. Please renew.',
                subscriptionStatus: user.subscriptionStatus
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                accountType: user.accountType,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEnd: user.subscriptionEnd,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET CURRENT USER =====
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

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
        res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
    }
});

// ===== VERIFY ADMIN =====
router.get('/verify-admin', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ 
                success: false,
                error: 'Admin access required' 
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
    }
});

module.exports = router;