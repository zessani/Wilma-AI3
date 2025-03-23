const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate PDF from transcription text
const createPdf = async (transcriptionText, meetingTitle) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument();
      
      // Set filename
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `catnotes-${meetingTitle || 'meeting'}-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', filename);
      
      // Make sure directory exists
      if (!fs.existsSync(path.join(__dirname, '..', 'outputs'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'outputs'), { recursive: true });
      }
      
      // Pipe to file
      doc.pipe(fs.createWriteStream(outputPath));
      
      // Add content
      doc.fontSize(20).text('CatNotes', { align: 'center' });
      doc.fontSize(16).text(meetingTitle || 'Meeting Transcript', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();
      
      // Add transcript with simple formatting
      doc.fontSize(12).text(transcriptionText);
      
      // Finalize PDF file
      doc.end();
      
      resolve(`/outputs/${filename}`);
    } catch (error) {
      console.error('Error creating PDF:', error);
      reject(error);
    }
  });
};

module.exports = {
  createPdf
};