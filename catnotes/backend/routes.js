const express = require('express');
const router = express.Router();
const zoomService = require('./zoom');
const transcribeService = require('./transcribe');
const pdfGenerator = require('./pdf-transcription');
const firefliesPdfGenerator = require('./fireflies-pdf-generator');

// Join meeting route
router.post('/meetings/join', async (req, res) => {
  try {
    const { meetingLink, password } = req.body;
    const meetingDetails = zoomService.extractMeetingInfo(meetingLink);
    const signature = zoomService.generateSignature(meetingDetails.meetingNumber);
    
    res.json({
      signature,
      meetingNumber: meetingDetails.meetingNumber,
      password: password || meetingDetails.password
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Start transcription route
router.post('/transcribe', async (req, res) => {
  try {
    const { audioData, meetingTitle } = req.body;
    
    // Save audio data temporarily
    const audioFileName = `meeting-${Date.now()}.wav`;
    
    // Start transcription
    const transcriptionJob = await transcribeService.startTranscription(audioFileName);
    
    res.json({ jobId: transcriptionJob.TranscriptionJobName });
  } catch (error) {
    console.error('Error starting transcription:', error);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

// Get transcription status
router.get('/transcribe/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = await transcribeService.getTranscriptionResults(jobId);
    
    res.json(jobStatus);
  } catch (error) {
    console.error('Error getting transcription status:', error);
    res.status(500).json({ error: 'Failed to get transcription status' });
  }
});

// In routes.js
router.post('/join-and-transcribe', async (req, res) => {
  try {
    const { meetingLink } = req.body;
    
    // Create Recall bot to join meeting
    const bot = await recallService.createBot(meetingLink);
    
    res.json({ 
      message: 'Bot successfully joined meeting',
      botId: bot.id
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

router.post('/process-meeting', async (req, res) => {
  try {
    const { botId } = req.body;
    
    // Get audio from Recall
    const audioData = await recallService.getAudioFromBot(botId);
    
    // Upload to S3 for AWS Transcribe
    const audioUrl = await transcribeService.uploadAudioToS3(audioData);
    
    // Start AWS Transcribe job
    const transcriptionJob = await transcribeService.startTranscription(audioUrl);
    
    res.json({ 
      message: 'Transcription process started',
      jobId: transcriptionJob.jobName 
    });
  } catch (error) {
    console.error('Error processing meeting:', error);
    res.status(500).json({ error: 'Failed to process meeting' });
  }
});

// Add to routes.js
const firefliesService = require('./fireflies-service');

// Schedule a bot to join a meeting
router.post('/schedule-bot', async (req, res) => {
  try {
    const { meetingLink, meetingTitle } = req.body;
    
    if (!meetingLink) {
      return res.status(400).json({ error: 'Meeting link is required' });
    }
    
    const result = await firefliesService.scheduleBot(
      meetingLink, 
      meetingTitle || 'CatNotes Meeting'
    );
    
    res.json({
      message: 'Bot scheduled successfully',
      botId: result.botId,
      success: result.success
    });
  } catch (error) {
    console.error('Failed to schedule bot:', error);
    res.status(500).json({ error: 'Failed to schedule bot' });
  }
});

// Get transcription from Fireflies
router.get('/transcription/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    
    const transcriptionData = await firefliesService.getTranscription(botId);
    
    // If Fireflies provides the transcription
    if (transcriptionData && transcriptionData.transcript) {
      res.json({
        status: 'COMPLETED',
        transcript: transcriptionData.transcript,
        summary: transcriptionData.summary,
        actionItems: transcriptionData.actionItems
      });
    } else {
      // If transcription is not ready yet
      res.json({
        status: 'IN_PROGRESS'
      });
    }
  } catch (error) {
    console.error('Error retrieving transcription:', error);
    res.status(500).json({ error: 'Failed to get transcription' });
  }
});

// Process transcription and generate PDF
router.post('/generate-notes', async (req, res) => {
  try {
    const { transcript, meetingTitle } = req.body;
    
    // Generate PDF using your existing PDF generator
    const pdfPath = await pdfGenerator.createPdf(transcript, meetingTitle);
    
    res.json({
      message: 'Notes generated successfully',
      pdfPath
    });
  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// Generate PDF from transcription
router.post('/generate-pdf', async (req, res) => {
  try {
    const { transcriptionText, meetingTitle } = req.body;
    
    // Generate PDF
    const pdfPath = await pdfGenerator.createPdf(transcriptionText, meetingTitle);
    
    // Return download link
    res.json({ pdfPath });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Generate PDF directly from Fireflies transcription
router.post('/fireflies/generate-pdf', async (req, res) => {
  try {
    const { botId, meetingTitle } = req.body;
    
    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }

    console.log(`Generating PDF for Fireflies meeting: ${meetingTitle} (Bot ID: ${botId})`);
    
    // Generate PDF from Fireflies transcription
    const result = await firefliesPdfGenerator.generateTranscriptionPdf(botId, meetingTitle);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'PDF generated successfully',
        pdfPath: result.pdfPath
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to generate PDF',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating PDF from Fireflies transcription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate PDF from transcription' 
    });
  }
});

module.exports = router;