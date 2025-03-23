// test-fireflies.js
require('dotenv').config();
const firefliesService = require('./fireflies');
const firefliesPdfGenerator = require('./fireflies-pdf-generator');

async function testFirefliesIntegration() {
  try {
    console.log('Scheduling bot to join a test meeting...');
    const testMeetingLink = 'https://us05web.zoom.us/j/83401703500?pwd=wdrEzcaRusnrYYa9F821UGaByOMgDc.1';
    const meetingTitle = 'Test Wilma Meeting';
    
    const result = await firefliesService.scheduleBot(
      testMeetingLink,
      meetingTitle
    );
    
    if (result.success) {
      console.log('Bot scheduled successfully!');
      console.log('Result:', result);
      
      // Note: After a real meeting is held and transcribed, we can use the botId to generate a PDF
      console.log('\nNOTE: Since this is a test, wait for a real meeting to be processed by Fireflies');
      console.log('After the meeting, use the following code to generate a PDF from the transcription:');
      console.log('------------------------------------------------------');
      console.log(`
// To generate PDF from a completed meeting:
const botId = "YOUR_MEETING_BOT_ID"; // Replace with the actual bot ID after meeting
const result = await firefliesPdfGenerator.generateTranscriptionPdf(botId, "${meetingTitle}");
if (result.success) {
  console.log("PDF generated at:", result.pdfPath);
} else {
  console.log("Error generating PDF:", result.error);
}
      `);
      console.log('------------------------------------------------------');
      
      return true;
    } else {
      console.log('Failed to schedule bot:', result);
      return false;
    }
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

async function testPdfGenerationFromExistingBotId() {
  try {
    const botId = process.argv[2]; // Get botId from command line argument
    const meetingTitle = process.argv[3] || 'Test Meeting';
    
    if (!botId) {
      console.log('Usage: node test-fireflies.js [botId] [meetingTitle]');
      console.log('Example: node test-fireflies.js abc123 "Weekly Team Meeting"');
      return false;
    }
    
    console.log(`Testing PDF generation for meeting "${meetingTitle}" with botId "${botId}"...`);
    
    const result = await firefliesPdfGenerator.generateTranscriptionPdf(botId, meetingTitle);
    
    if (result.success) {
      console.log('PDF generated successfully!');
      console.log('PDF Path:', result.pdfPath);
      return true;
    } else {
      console.log('Failed to generate PDF:', result.error);
      return false;
    }
  } catch (error) {
    console.error('PDF generation test failed:', error);
    return false;
  }
}

// Check if a botId was provided as a command-line argument
if (process.argv.length > 2) {
  testPdfGenerationFromExistingBotId();
} else {
  testFirefliesIntegration();
}