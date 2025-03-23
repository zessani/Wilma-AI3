const crypto = require('crypto');

// Generate a Zoom meeting signature
const generateSignature = (meetingNumber, role = 0) => {
  const timestamp = new Date().getTime() - 30000;
  const apiKey = process.env.ZOOM_API_KEY;
  const apiSecret = process.env.ZOOM_API_SECRET;
  
  const msg = `${apiKey}${meetingNumber}${timestamp}${role}`;
  const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
  const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
  
  return signature;
};

// Extract meeting details from a Zoom link
const extractMeetingInfo = (zoomLink) => {
  try {
    // Extract meeting ID (digits after /j/ in the URL)
    const meetingIdMatch = zoomLink.match(/\/j\/(\d+)/);
    const meetingNumber = meetingIdMatch ? meetingIdMatch[1] : null;
    
    // Extract password if present in the URL
    const pwdMatch = zoomLink.match(/pwd=([^&]+)/);
    const password = pwdMatch ? pwdMatch[1] : null;
    
    if (!meetingNumber) {
      throw new Error('Invalid Zoom meeting link');
    }
    
    return {
      meetingNumber,
      password
    };
  } catch (error) {
    console.error('Error extracting meeting info:', error);
    throw error;
  }
};

module.exports = {
  generateSignature,
  extractMeetingInfo
};