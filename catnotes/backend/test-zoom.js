// test-zoom.js
require('dotenv').config();
const zoomService = require('./zoom');


const testMeetingLink = 'https://us04web.zoom.us/j/75759622983?pwd=Xa1A66VuTRl9jTPUuOyia16E28iKt4.1'; // Replace with your test meeting link

async function testZoomIntegration() {
  try {
    console.log('Extracting meeting info...');
    const meetingInfo = zoomService.extractMeetingInfo(testMeetingLink);
    console.log('Meeting info:', meetingInfo);
    
    console.log('Generating signature...');
    const signature = zoomService.generateSignature(meetingInfo.meetingNumber);
    console.log('Generated signature successfully!');
    
    console.log('Zoom integration test completed successfully');
    console.log({
      meetingNumber: meetingInfo.meetingNumber,
      password: meetingInfo.password,
      signature: signature.substring(0, 20) + '...' // Only show part of the signature for security
    });
    
    return true;
  } catch (error) {
    console.error('Zoom integration test failed:', error);
    return false;
  }
}

// Run the test
testZoomIntegration();