const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// ===== SEND MESSAGE =====
router.post('/', protect, async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Please provide receiver and message'
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                error: 'Receiver not found'
            });
        }

        // Check if user is admin (can message anyone)
        // OR if user is messaging admin
        const isAdmin = await User.findById(req.user._id).then(u => u.isAdmin);
        const isReceiverAdmin = receiver.isAdmin;

        if (!isAdmin && !isReceiverAdmin) {
            return res.status(403).json({
                success: false,
                error: 'You can only message admin'
            });
        }

        const newMessage = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            message: message
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('receiver', 'name email');

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== GET CONVERSATIONS =====
router.get('/conversations', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        let conversations = [];

        if (user.isAdmin) {
            // Admin sees all conversations
            const usersWithMessages = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { sender: user._id },
                            { receiver: user._id }
                        ]
                    }
                },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $eq: ['$sender', user._id] },
                                '$receiver',
                                '$sender'
                            ]
                        }
                    }
                },
                { $sort: { '_id': -1 } }
            ]);

            const userIds = usersWithMessages.map(u => u._id);
            const users = await User.find({ _id: { $in: userIds } }).select('name email isAdmin isActive');

            for (const u of users) {
                const lastMessage = await Message.findOne({
                    $or: [
                        { sender: user._id, receiver: u._id },
                        { sender: u._id, receiver: user._id }
                    ]
                }).sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    sender: u._id,
                    receiver: user._id,
                    read: false
                });

                conversations.push({
                    user: u,
                    lastMessage: lastMessage,
                    unreadCount: unreadCount
                });
            }
        } else {
            // User sees only their admin conversation
            const admin = await User.findOne({ isAdmin: true });
            if (admin) {
                const lastMessage = await Message.findOne({
                    $or: [
                        { sender: user._id, receiver: admin._id },
                        { sender: admin._id, receiver: user._id }
                    ]
                }).sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    sender: admin._id,
                    receiver: user._id,
                    read: false
                });

                conversations.push({
                    user: admin,
                    lastMessage: lastMessage,
                    unreadCount: unreadCount
                });
            }
        }

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== GET MESSAGES WITH A USER =====
router.get('/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await User.findById(req.user._id);

        // Check if user is allowed to see these messages
        if (!currentUser.isAdmin && userId !== req.user._id.toString()) {
            const otherUser = await User.findById(userId);
            if (!otherUser || !otherUser.isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }
        }

        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ],
            isDeleted: false
        })
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            {
                sender: userId,
                receiver: req.user._id,
                read: false
            },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== GET UNREAD COUNT =====
router.get('/unread/count', protect, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user._id,
            read: false
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;