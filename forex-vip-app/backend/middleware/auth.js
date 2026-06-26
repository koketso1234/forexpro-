const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===== USER PROTECT =====
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (req.user.subscriptionStatus !== 'active') {
                return res.status(403).json({ error: 'Subscription inactive' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
};

// ===== ADMIN PROTECT =====
const adminProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Check if user is admin
            if (!req.user.isAdmin) {
                return res.status(403).json({ error: 'Admin access required' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
};

module.exports = { protect, adminProtect };