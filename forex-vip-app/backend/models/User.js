const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    accountType: { type: String, enum: ['free', 'paid'], default: 'free' },
    plan: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'none'], default: 'none' },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    subscriptionStart: { type: Date, default: Date.now },
    subscriptionEnd: { type: Date, default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    
    // ===== BANK DETAILS (Premium Only) =====
    bankDetails: {
        accountHolder: { type: String, default: '' },
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        branchCode: { type: String, default: '' },
        swiftCode: { type: String, default: '' },
        accountType: { type: String, enum: ['cheque', 'savings', 'current', ''], default: '' },
        isVerified: { type: Boolean, default: false }
    },
    
    // ===== PAYMENT HISTORY =====
    payments: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, enum: ['card', 'bank_transfer', 'crypto', 'payfast'], default: 'card' },
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        reference: { type: String, default: '' }
    }],
    
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedAt: { type: Date, default: null },
    deletionScheduledFor: { type: Date, default: null },
    deletionPermanent: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    this.updatedAt = Date.now();
    next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isPaid = function() {
    return this.accountType === 'paid' && this.subscriptionStatus === 'active';
};

UserSchema.methods.isFree = function() {
    return this.accountType === 'free';
};

UserSchema.methods.hasBankDetails = function() {
    return this.bankDetails && this.bankDetails.accountNumber && this.bankDetails.accountNumber.length > 0;
};

module.exports = mongoose.model('User', UserSchema);