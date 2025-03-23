const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate PDF from transcription text
const createPdf = async (transcriptionText, meetingTitle) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument();
      
      // Set filename with sanitized title (remove invalid characters)
      const sanitizedTitle = meetingTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'meeting';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Replace both colons and periods
      const filename = `catnotes-${sanitizedTitle}-${timestamp}.pdf`;
      
      // Ensure outputs directory exists relative to project root with proper permissions
      const outputDir = path.resolve(__dirname, '..', 'outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
      }
      
      // Create full output path using proper path joining
      const outputPath = path.join(outputDir, filename);
      
      // Create write stream with proper permissions on Unix systems
      const writeStream = fs.createWriteStream(outputPath, {
        mode: 0o644 // User read/write, group/others read-only
      });
      
      // Pipe to file
      doc.pipe(writeStream);
      
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
      
      // Handle write stream completion
      writeStream.on('finish', () => {
        // Return path using forward slashes for consistency
        const relativePath = path.relative(__dirname, outputPath).replace(/\\/g, '/');
        resolve(relativePath.startsWith('../') ? relativePath.substring(3) : relativePath);
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      reject(error);
    }
  });
};

module.exports = {
  createPdf
};