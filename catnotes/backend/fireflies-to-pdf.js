#!/usr/bin/env node
// fireflies-to-pdf.js - Schedule a Fireflies bot and generate a PDF from the transcript
require('dotenv').config();
const firefliesService = require('./fireflies');
const firefliesPdfGenerator = require('./fireflies-pdf-generator');

const POLL_INTERVAL_MS = 60000; // Check every minute
const MAX_POLLS = 60; // Max 1 hour of polling

async function scheduleBotAndGetTranscript(meetingLink, meetingTitle) {
  try {
    console.log(`Scheduling bot for meeting: "${meetingTitle}"`);
    console.log(`Meeting link: ${meetingLink}`);
    
    // Schedule the bot to join the meeting
    const result = await firefliesService.scheduleBot(meetingLink, meetingTitle);
    
    if (!result.success) {
      console.error('Failed to schedule bot');
      return { success: false };
    }
    
    console.log('Bot scheduled successfully!');
    console.log('Result:', result);
    
    return { success: true };
  } catch (error) {
    console.error('Error scheduling bot:', error);
    return { success: false, error };
  }
}

async function generatePdfFromTranscriptId(transcriptId, meetingTitle) {
  let pollCount = 0;
  
  console.log(`\nAttempting to generate PDF for meeting: "${meetingTitle}"`);
  console.log(`Transcript ID: ${transcriptId}`);
  
  while (pollCount < MAX_POLLS) {
    try {
      console.log(`\nAttempt ${pollCount + 1} of ${MAX_POLLS}`);
      const result = await firefliesPdfGenerator.generateTranscriptionPdf(transcriptId, meetingTitle);
      
      if (result.success) {
        console.log('\n✅ Success! PDF generated successfully!');
        console.log('PDF Path:', result.pdfPath);
        return { success: true, pdfPath: result.pdfPath };
      } else if (result.error === 'Transcription not ready yet or not available') {
        console.log('Transcription not ready yet or not available. Waiting before trying again...');
        pollCount++;
        
        if (pollCount < MAX_POLLS) {
          console.log(`Waiting ${POLL_INTERVAL_MS / 1000} seconds before checking again...`);
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      } else {
        console.error('Error generating PDF:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error };
    }
  }
  
  console.log('\n❌ Maximum polling attempts reached. Transcription may still be processing.');
  console.log('You can try again later with:');
  console.log(`node fireflies-to-pdf.js --pdf-only ${transcriptId} "${meetingTitle}"`);
  
  return { success: false, error: 'Exceeded maximum polling attempts' };
}

// Main function to handle script execution
async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log('Usage:');
    console.log('  Schedule a bot and get transcript:');
    console.log('    node fireflies-to-pdf.js <meeting-link> <meeting-title>');
    console.log('\n  Generate PDF only from an existing transcript ID:');
    console.log('    node fireflies-to-pdf.js --pdf-only <transcript-id> <meeting-title>');
    console.log('\n  Examples:');
    console.log('    node fireflies-to-pdf.js "https://zoom.us/j/123456" "Weekly Team Meeting"');
    console.log('    node fireflies-to-pdf.js --pdf-only 01JQ0T3AMPST4ZJH5M5THG3KET "Weekly Team Meeting"');
    return;
  }
  
  // PDF generation only mode
  if (args[0] === '--pdf-only') {
    const transcriptId = args[1];
    const meetingTitle = args[2] || 'Meeting Transcription';
    
    if (!transcriptId) {
      console.error('Error: Transcript ID is required');
      console.log('Usage: node fireflies-to-pdf.js --pdf-only <transcript-id> <meeting-title>');
      return;
    }
    
    await generatePdfFromTranscriptId(transcriptId, meetingTitle);
    return;
  }
  
  // Schedule bot and generate PDF mode
  const meetingLink = args[0];
  const meetingTitle = args[1] || 'Meeting Transcription';
  
  if (!meetingLink) {
    console.error('Error: Meeting link is required');
    console.log('Usage: node fireflies-to-pdf.js <meeting-link> <meeting-title>');
    return;
  }
  
  const schedulingResult = await scheduleBotAndGetTranscript(meetingLink, meetingTitle);
  
  if (schedulingResult.success) {
    console.log('\n✅ Bot scheduled successfully!');
    console.log('\nNOTE: After the meeting is completed and processed by Fireflies,');
    console.log('you can generate a PDF using the transcript ID from your Fireflies dashboard:');
    console.log('https://app.fireflies.ai/meetings');
    console.log('\nThen run:');
    console.log(`node fireflies-to-pdf.js --pdf-only YOUR_TRANSCRIPT_ID "${meetingTitle}"`);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 