// test-fireflies.js
require('dotenv').config();
const firefliesService = require('./fireflies');

async function testFirefliesIntegration() {
  try {
    console.log('Scheduling bot to join a test meeting...');
    const testMeetingLink = 'https://us04web.zoom.us/j/74086020873?pwd=DSbvNBFnzVYcXFbaHe0JPzz3fIocIG.1';
    
    const result = await firefliesService.scheduleBot(
      testMeetingLink,
      'Test Wilma Meeting'
    );
    
    if (result.success) {
      console.log('Bot scheduled successfully!');
      // Note: The addToLiveMeeting mutation doesn't return a botId
      console.log('Result:', result);
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

testFirefliesIntegration();