const express = require('express');
const path = require('path');
const cors = require('cors');
const firefliesService = require('./fireflies');
const pdfTranscription = require('./pdf-transcription');
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

// Generate study notes from latest Fireflies transcript
router.post('/api/generate-study-notes', async (req, res) => {
    try {
        // Get the latest transcript
        const transcripts = await firefliesService.getRecentTranscripts(1);
        
        if (!transcripts || transcripts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No recent transcripts found'
            });
        }
        
        const latestTranscript = transcripts[0];
        const transcriptionData = await firefliesService.getTranscription(latestTranscript.id);
        
        if (!transcriptionData || !transcriptionData.transcript) {
            return res.status(404).json({
                success: false,
                error: 'Transcript data not found'
            });
        }

        // Format the notes content with bullet points
        let notesContent = `# CatNotes Summarized\n\n`;
        notesContent += `## ${latestTranscript.title || 'Class Notes'}\n`;
        notesContent += `Date: ${new Date(latestTranscript.dateString).toLocaleDateString()}\n\n`;
        
        // Add summary if available
        if (transcriptionData.summary) {
            notesContent += '## Key Points\n\n';
            // Split summary into sentences and make bullet points
            const summaryPoints = transcriptionData.summary
                .split(/[.!?]+/)
                .map(point => point.trim())
                .filter(point => point.length > 0)
                .map(point => `* ${point}`);
            notesContent += summaryPoints.join('\n') + '\n\n';
        }
        
        // Add action items if available
        if (transcriptionData.actionItems && transcriptionData.actionItems.length > 0) {
            notesContent += '## Action Items\n\n';
            transcriptionData.actionItems.forEach(item => {
                notesContent += `* ${item}\n`;
            });
            notesContent += '\n';
        }

        // Generate PDF from the formatted notes
        const pdfPath = await pdfTranscription.createPdf(
            notesContent,
            `${latestTranscript.title || 'Class Notes'} - Summary`
        );

        // Return success response with PDF path
        res.json({
            success: true,
            pdfPath: `outputs/${path.basename(pdfPath)}`,
            message: 'Summary notes generated successfully'
        });
        
    } catch (error) {
        console.error('Error generating summary notes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate summary notes'
        });
    }
});

module.exports = router; 