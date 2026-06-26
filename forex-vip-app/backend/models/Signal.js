const mongoose = require('mongoose');

const SignalSchema = new mongoose.Schema({
    pair: {
        type: String,
        required: true,
        enum: [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
            'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'EUR/CHF',
            'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'AUD/JPY', 'AUD/CHF',
            'AUD/NZD', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'NZD/CHF',
            'NZD/CAD', 'EUR/SEK', 'EUR/NOK', 'EUR/DKK',
            'USD/TRY', 'USD/SGD', 'USD/HKD', 'USD/MXN',
            'USD/ZAR', 'EUR/ZAR', 'GBP/ZAR', 'AUD/ZAR',
            'XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD'
        ]
    },
    action: { type: String, required: true, enum: ['BUY', 'SELL'] },
    entry: { type: Number, required: true, min: 0 },
    takeProfit: { type: Number, required: true, min: 0 },
    stopLoss: { type: Number, required: true, min: 0 },
    confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    analysis: { type: String, maxlength: 500, default: '' },
    
    // ===== WHO GETS THIS SIGNAL? =====
    audience: {
        type: String,
        enum: ['all', 'free', 'premium', 'admin_only'],
        default: 'all'
    },
    
    status: { type: String, enum: ['active', 'closed', 'cancelled'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) }
});

SignalSchema.index({ pair: 1, createdAt: -1 });
SignalSchema.index({ status: 1 });
SignalSchema.index({ audience: 1 });

module.exports = mongoose.model('Signal', SignalSchema);