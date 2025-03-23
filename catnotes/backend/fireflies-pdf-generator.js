// fireflies-pdf-generator.js
const firefliesService = require('./fireflies');
const pdfGenerator = require('./pdf-transcription');

/**
 * Gets a transcription from Fireflies and generates a PDF
 * @param {string} transcriptId - The ID of the Fireflies transcript
 * @param {string} meetingTitle - Optional title for the meeting
 * @returns {Promise<{success: boolean, pdfPath: string, error: string|null}>}
 */
const generateTranscriptionPdf = async (transcriptId, meetingTitle = 'Meeting Transcription') => {
  try {
    console.log(`Getting transcription for meeting: ${meetingTitle} (Transcript ID: ${transcriptId})`);
    
    // Get transcription from Fireflies
    const transcriptionData = await firefliesService.getTranscription(transcriptId);
    
    // Check if transcription is available
    if (!transcriptionData || !transcriptionData.transcript) {
      console.log('Transcription not ready yet or not available');
      return {
        success: false,
        pdfPath: null,
        error: 'Transcription not ready yet or not available'
      };
    }

    console.log('Transcription retrieved successfully, generating PDF...');
    
    // Format the transcription with any additional data if needed
    let formattedTranscription = transcriptionData.transcript;
    
    // Add summary if available
    if (transcriptionData.summary) {
      formattedTranscription = `## Meeting Summary\n${transcriptionData.summary}\n\n## Full Transcript\n${formattedTranscription}`;
    }
    
    // Add action items if available
    if (transcriptionData.actionItems && transcriptionData.actionItems.length > 0) {
      const actionItemsList = transcriptionData.actionItems.join('\n• ');
      formattedTranscription = `## Action Items\n• ${actionItemsList}\n\n${formattedTranscription}`;
    }
    
    // Generate PDF using existing PDF generator
    const pdfPath = await pdfGenerator.createPdf(formattedTranscription, meetingTitle);
    
    console.log(`PDF generated successfully at ${pdfPath}`);
    
    return {
      success: true,
      pdfPath,
      error: null
    };
  } catch (error) {
    console.error('Error generating transcription PDF:', error);
    return {
      success: false,
      pdfPath: null,
      error: error.message || 'Unknown error occurred'
    };
  }
};

module.exports = {
  generateTranscriptionPdf
}; 