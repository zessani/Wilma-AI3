const express = require('express');
const path = require('path');
const cors = require('cors');
const firefliesService = require('./fireflies');
const { spawn } = require('child_process');

const router = express.Router();

// Enable CORS
router.use(cors());
router.use(express.json());

// Serve the frontend files
router.use(express.static(path.join(__dirname, '..', 'frontend')));

// Schedule bot endpoint
router.post('/api/schedule-bot', async (req, res) => {
    try {
        const { meetingLink, meetingTitle } = req.body;
        
        if (!meetingLink || !meetingTitle) {
            return res.status(400).json({
                success: false,
                error: 'Meeting link and title are required'
            });
        }
        
        const result = await firefliesService.scheduleBot(meetingLink, meetingTitle);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error scheduling bot:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to schedule bot'
        });
    }
});

// Generate latest PDF endpoint
router.post('/api/generate-latest', async (req, res) => {
    try {
        // Run the fireflies-to-pdf.js script with --latest flag
        const scriptPath = path.join(__dirname, 'fireflies-to-pdf.js');
        const process = spawn('node', [scriptPath, '--latest']);
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                // Extract the PDF path from the output
                const pathMatch = output.match(/PDF generated successfully at: (.+)/);
                const pdfPath = pathMatch ? pathMatch[1].trim() : null;
                
                if (pdfPath) {
                    // Create a download URL for the PDF
                    const downloadUrl = `/outputs/${path.basename(pdfPath)}`;
                    res.json({
                        success: true,
                        pdfPath,
                        downloadUrl
                    });
                } else {
                    res.json({
                        success: true,
                        message: 'PDF generated successfully'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: errorOutput || 'Failed to generate PDF'
                });
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate PDF'
        });
    }
});

// Serve the outputs directory for PDF downloads
router.use('/outputs', express.static(path.join(__dirname, '..', 'outputs')));

module.exports = router; 