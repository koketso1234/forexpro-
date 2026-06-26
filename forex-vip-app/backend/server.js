const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();
process.env.TZ = 'Africa/Johannesburg';

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));        // NEW
app.use('/api/messages', require('./routes/messages'));  // NEW

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ForexPro SA Server is running',
        timezone: process.env.TZ,
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found' 
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Server error' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ForexPro SA Server running on http://localhost:${PORT}`);
    console.log(`🇿🇦 Timezone: ${process.env.TZ}`);
});