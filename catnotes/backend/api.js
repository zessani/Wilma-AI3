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

// Serve the outputs directory for PDF downloads
router.use('/outputs', express.static(path.join(__dirname, '..', 'outputs'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

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
            const chunk = data.toString();
            console.log('Script output:', chunk);
            output += chunk;
        });
        
        process.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.error('Script error:', chunk);
            errorOutput += chunk;
        });
        
        process.on('close', (code) => {
            console.log('Script exit code:', code);
            console.log('Full output:', output);
            console.log('Error output:', errorOutput);
            
            if (code === 0) {
                // Extract the PDF path from the output
                const pathMatch = output.match(/PDF generated successfully at: (.+)/);
                if (!pathMatch) {
                    console.error('Could not find PDF path in output');
                    return res.status(500).json({
                        success: false,
                        error: 'Could not find generated PDF path'
                    });
                }
                
                const pdfPath = pathMatch[1].trim();
                const pdfBasename = path.basename(pdfPath);
                const downloadUrl = `/outputs/${pdfBasename}`;
                
                // Verify the file exists
                const fullPath = path.join(__dirname, '..', pdfPath);
                if (!require('fs').existsSync(fullPath)) {
                    console.error('Generated PDF not found at:', fullPath);
                    return res.status(500).json({
                        success: false,
                        error: 'Generated PDF file not found'
                    });
                }
                
                res.json({
                    success: true,
                    pdfPath: pdfPath,
                    downloadUrl: downloadUrl
                });
            } else {
                console.error('Script failed with code:', code);
                res.status(500).json({
                    success: false,
                    error: errorOutput || 'Failed to generate PDF'
                });
            }
        });
        
        process.on('error', (error) => {
            console.error('Failed to start script:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start PDF generation script'
            });
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate PDF'
        });
    }
});

module.exports = router; 