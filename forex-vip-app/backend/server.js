const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

dotenv.config();
process.env.TZ = 'Africa/Johannesburg';

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
// ✅ Clean route registration - no trailing slashes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ForexPro SA Server is running',
        timezone: process.env.TZ,
        timestamp: new Date().toISOString()
    });
});

// ===== HOME ROUTE =====
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ForexPro SA API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            routes: '/routes',
            auth: '/api/auth',
            signals: '/api/signals',
            admin: '/api/admin',
            users: '/api/users',
            messages: '/api/messages'
        }
    });
});

// ===== DEBUG: LIST ALL ROUTES =====
app.get('/routes', (req, res) => {
    const routes = [];
    
    function extractRoutes(stack, basePath = '') {
        if (!stack) return;
        
        for (const layer of stack) {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                let path = basePath + layer.route.path;
                // Clean up the path
                path = path.replace(/\/\(=\/\|\$\)\//g, '/');
                routes.push({
                    path: path,
                    methods: methods
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                let routerPath = basePath;
                if (layer.regexp) {
                    let pathStr = layer.regexp.source
                        .replace(/\\\//g, '/')
                        .replace(/\^/g, '')
                        .replace(/\?/g, '')
                        .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param')
                        .replace(/\/$/g, '');
                    // Clean up the path
                    pathStr = pathStr.replace(/\/\(=\/\|\$\)\//g, '/');
                    if (pathStr && pathStr !== '/') {
                        routerPath = pathStr;
                    }
                }
                extractRoutes(layer.handle.stack, routerPath);
            }
        }
    }
    
    extractRoutes(app._router.stack);
    
    const uniqueRoutes = routes.filter((route, index, self) => 
        index === self.findIndex((r) => r.path === route.path && r.methods === route.methods)
    );
    
    res.json({
        success: true,
        totalRoutes: uniqueRoutes.length,
        routes: uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path))
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ForexPro SA Server running on http://localhost:${PORT}`);
    console.log(`🇿🇦 Timezone: ${process.env.TZ}`);
    console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not connected'}`);
});
