const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const api = require('./api');
const app = express();

// List of ports to try in order
const ports = [3000, 3001, 4000, 4001, 5000, 5001];

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Function to try starting the server on different ports
function startServer(portIndex = 0) {
    if (portIndex >= ports.length) {
        console.error('Could not find an available port. Please free up one of these ports:', ports);
        process.exit(1);
    }

    const PORT = process.env.PORT || ports[portIndex];

    // Use the API routes
    app.use('/', api);

    // Serve the frontend as the default route
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    });

    // Try to start the server
    const server = app.listen(PORT)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} is busy, trying next port...`);
                server.close();
                startServer(portIndex + 1);
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        })
        .on('listening', () => {
            const actualPort = server.address().port;
            console.log(`\n🚀 Server running at http://localhost:${actualPort}`);
            console.log(`\nYou can access the application by opening:`);
            console.log(`• Local:            http://localhost:${actualPort}`);
            console.log(`• On Your Network:  http://${getLocalIP()}:${actualPort}`);
            console.log(`Frontend URL: http://localhost:${actualPort}`);
            console.log(`API endpoints:`);
            console.log(`  POST /api/schedule-bot - Schedule a Fireflies bot`);
            console.log(`  POST /api/generate-latest - Generate PDF from latest transcript`);
            console.log(`  GET /outputs/* - Download generated PDFs`);
        });
}

// Helper function to get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal and non-IPv4 addresses
            if (!net.internal && net.family === 'IPv4') {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Start the server
startServer();